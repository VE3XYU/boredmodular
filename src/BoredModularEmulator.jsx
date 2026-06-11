import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo, memo } from "react";
import AudioEngine from "./AudioEngine";
import { MODULE_DEFS, CATEGORIES, SIGNAL_TYPE_COLORS, getPortSignalType } from "./moduleDefs";

// ─── Helpers ────────────────────────────────────────────────────────────────

let _idCounter = 0;
const genId = () => `mod_${++_idCounter}`;

const PORT_SIZE = 4;
const PORT_HIT_SIZE = 8;
const MODULE_WIDTH = 220;
const HEADER_H = 22;
const PARAM_ROW_H = 24;
const PARAMS_PAD_BOTTOM = 6;
const PORTS_H_WITH = 44;
const PORTS_H_NONE = 6;
const PORT_OUTPUT_OFFSET = 10;
const PORT_INPUT_OFFSET = 30;
const PARAM_STRIP_H = 56;
const PARAM_STRIP_LABEL_BAND_H = 12;
const PARAM_STRIP_LABELED_H = PARAM_STRIP_H + PARAM_STRIP_LABEL_BAND_H;

// Layout geometry depends only on the def's paramRows and the param KEY SET,
// both fixed for a given params snapshot (edits replace the snapshot object).
// Cache by snapshot identity: this function runs per port per module per
// render (ports, hit overlay, module height, cables), so items deliberately
// hold param KEYS, not param objects — values are read live by the renderer.
const _paramLayoutCache = new WeakMap();

function buildParamLayout(def, params) {
  const cached = params ? _paramLayoutCache.get(params) : undefined;
  if (cached && cached.def === def) return cached.layout;

  const items = [];
  const paramRowMap = new Map();
  (def.paramRows || []).forEach((r) => r.knobs.forEach((k) => paramRowMap.set(k, r)));

  const seen = new Set();
  let y = 4;
  Object.keys(params || {}).forEach((key) => {
    if (seen.has(key)) return;
    if (paramRowMap.has(key)) {
      const row = paramRowMap.get(key);
      const labeled = !!row.label;
      items.push({ kind: "row", row, y, labeled });
      row.knobs.forEach((k) => seen.add(k));
      y += labeled ? PARAM_STRIP_LABELED_H : PARAM_STRIP_H;
    } else {
      items.push({ kind: "single", key, y });
      seen.add(key);
      y += PARAM_ROW_H;
    }
  });
  const totalH = y - 4 + PARAMS_PAD_BOTTOM;
  const layout = { items, totalH };
  if (params) _paramLayoutCache.set(params, { def, layout });
  return layout;
}

function getPortPosition(moduleState, portName, isOutput) {
  const def = MODULE_DEFS[moduleState.type];
  const allInputs = [...(def.inputs || []), ...(def.modInputs || [])];
  const allOutputs = def.outputs || [];
  const list = isOutput ? allOutputs : allInputs;
  const idx = list.indexOf(portName);

  const paramsH = buildParamLayout(def, moduleState.params).totalH;
  const customH = def.customUIHeight || 0;
  const baseY = HEADER_H + paramsH + customH;

  // Port not in MODULE_DEFS — engine may have accepted it via a legacy input
  // alias that doesn't exist in modInputs, leaving the cable rendered to
  // canvas (0,0) and pinned to the top-left. Anchor to the module's port
  // row centre so the cable at least visibly attaches to the right module,
  // and warn so a stale connection is debuggable.
  if (idx === -1) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn(`getPortPosition: ${moduleState.type}.${portName} (${isOutput ? "output" : "input"}) not in MODULE_DEFS; cable will anchor to module centre.`);
    }
    const fallbackY = baseY + (isOutput ? PORT_OUTPUT_OFFSET : PORT_INPUT_OFFSET);
    return { x: moduleState.x + MODULE_WIDTH / 2, y: moduleState.y + fallbackY };
  }

  if (isOutput) {
    const spacing = MODULE_WIDTH / (allOutputs.length + 1);
    return { x: moduleState.x + spacing * (idx + 1), y: moduleState.y + baseY + PORT_OUTPUT_OFFSET };
  } else {
    const spacing = MODULE_WIDTH / (allInputs.length + 1);
    return { x: moduleState.x + spacing * (idx + 1), y: moduleState.y + baseY + PORT_INPUT_OFFSET };
  }
}

function getModuleHeight(type, params) {
  const def = MODULE_DEFS[type];
  const paramsH = buildParamLayout(def, params).totalH;
  const allInputs = [...(def.inputs || []), ...(def.modInputs || [])];
  const hasPorts = allInputs.length > 0 || (def.outputs || []).length > 0;
  const portsH = hasPorts ? PORTS_H_WITH : PORTS_H_NONE;
  const customH = def.customUIHeight || 0;
  return HEADER_H + paramsH + customH + portsH;
}

// Magnetic distance for drop-snap. If a dropped module's bbox (inflated by
// this margin on all sides) overlaps another module's bbox, the dropped
// module snaps top-to-bottom adjacent to that neighbour. Far drops keep
// their exact cursor position. Roughly the height of a single knob row, so
// the user has to mean it.
const SNAP_MARGIN = 22;

// Snap will never shove a module sideways by more than this. Roughly one
// centimetre at 96 DPI, so a misaligned column to either side does not
// yank the dropped module to a column it was clearly not aiming at.
const MAX_SNAP_X_SHIFT = 40;

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// Find the nearest above-neighbour and nearest below-neighbour for a dropped
// module: column-aligned modules (their bbox sits within SNAP_MARGIN of the
// dropped bbox after inflation) split by whether their centre.y is above or
// below the dropped centre.y. Either side may be null.
function findColumnNeighbours(dragged, others) {
  const ix = dragged.x - SNAP_MARGIN;
  const iy = dragged.y - SNAP_MARGIN;
  const iw = dragged.w + 2 * SNAP_MARGIN;
  const ih = dragged.h + 2 * SNAP_MARGIN;
  const dcy = dragged.y + dragged.h / 2;
  let above = null;
  let below = null;
  let aboveDist = Infinity;
  let belowDist = Infinity;
  for (const o of others) {
    const ow = MODULE_WIDTH;
    const oh = getModuleHeight(o.type, o.params);
    if (!rectsOverlap(ix, iy, iw, ih, o.x, o.y, ow, oh)) continue;
    const ocy = o.y + oh / 2;
    if (ocy < dcy) {
      const d = dcy - ocy;
      if (d < aboveDist) { above = { mod: o, h: oh }; aboveDist = d; }
    } else {
      const d = ocy - dcy;
      if (d < belowDist) { below = { mod: o, h: oh }; belowDist = d; }
    }
  }
  return { above, below };
}

// Resolve a dropped module's final position. Returns the snapped (x, y) if a
// neighbour is in magnetic range, otherwise null (caller keeps the raw drop
// coordinates). When both above and below neighbours exist (the sandwich
// case), the dropped module's top aligns with the above's bottom, and any
// modules in the same column at or below the below-neighbour are pushed
// downward by whatever is needed so the sandwich is exact -- their ids and
// the shared delta are returned in `pushDown`.
function resolveDropSnap({ x, y, type, params, ignoreId, modules }) {
  const h = getModuleHeight(type, params);
  const others = modules.filter((m) => m.id !== ignoreId);
  const { above, below } = findColumnNeighbours({ x, y, w: MODULE_WIDTH, h }, others);
  if (!above && !below) return null;

  if (above && below) {
    const snapX = above.mod.x;
    if (Math.abs(snapX - x) > MAX_SNAP_X_SHIFT) return null;
    const snapY = above.mod.y + above.h;
    const cBottom = snapY + h;
    const delta = Math.max(0, cBottom - below.mod.y);
    let pushDown = null;
    if (delta > 0) {
      const ix = x - SNAP_MARGIN;
      const iw = MODULE_WIDTH + 2 * SNAP_MARGIN;
      const inColumn = (o) => ix < o.x + MODULE_WIDTH && ix + iw > o.x;
      const ids = others
        .filter((o) => inColumn(o) && o.y >= below.mod.y)
        .map((o) => o.id);
      if (ids.length) pushDown = { ids, deltaY: delta };
    }
    return { x: snapX, y: snapY, pushDown };
  }

  if (above) {
    if (Math.abs(above.mod.x - x) > MAX_SNAP_X_SHIFT) return null;
    return { x: above.mod.x, y: above.mod.y + above.h, pushDown: null };
  }
  // below only
  if (Math.abs(below.mod.x - x) > MAX_SNAP_X_SHIFT) return null;
  return { x: below.mod.x, y: below.mod.y - h, pushDown: null };
}

// Apply a resolved drop-snap to the module list: move the dragged module to
// the snapped position and, if a pushDown was returned, shift every pushed
// module down by the shared delta.
function applyDropSnap(modules, draggedId, snapped) {
  const pushIds = snapped.pushDown ? new Set(snapped.pushDown.ids) : null;
  const delta = snapped.pushDown ? snapped.pushDown.deltaY : 0;
  return modules.map((m) => {
    if (m.id === draggedId) return { ...m, x: snapped.x, y: snapped.y };
    if (pushIds && pushIds.has(m.id)) return { ...m, y: m.y + delta };
    return m;
  });
}

// Sequencer module types: the only custom UIs that poll engine state
// (_currentStep, pattern arrays) at render time, so the only ones that need
// the live seqFrame tick as a re-render trigger.
const SEQ_TYPES = new Set(["EventSeq", "CtrlSeq", "NoteSeqA", "NoteSeqB"]);

// Shared empty Set for modules with no connections — a stable identity so
// ModuleNode's memo doesn't break on unrelated connection changes.
const EMPTY_PORT_SET = new Set();

// Keyboard note mapping: computer keys -> MIDI notes (relative to C4=60)
const KEY_NOTE_MAP = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72,
};

// Piano key layout for the clickable keyboard
const PIANO_KEYS = [
  { note: 60, label: "C", black: false },
  { note: 61, label: "C#", black: true },
  { note: 62, label: "D", black: false },
  { note: 63, label: "D#", black: true },
  { note: 64, label: "E", black: false },
  { note: 65, label: "F", black: false },
  { note: 66, label: "F#", black: true },
  { note: 67, label: "G", black: false },
  { note: 68, label: "G#", black: true },
  { note: 69, label: "A", black: false },
  { note: 70, label: "A#", black: true },
  { note: 71, label: "B", black: false },
  { note: 72, label: "C", black: false },
];

// ─── Components ─────────────────────────────────────────────────────────────

const SAFARI_ADVISORY_KEY = "bm-safari-latency-advisory-dismissed";

function detectSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Brave/.test(ua);
}

function SafariAdvisoryBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      if (window.localStorage.getItem(SAFARI_ADVISORY_KEY) === "1") return true;
    } catch (_) {}
    return !detectSafari();
  });

  if (dismissed) return null;

  const dismiss = () => {
    try { window.localStorage.setItem(SAFARI_ADVISORY_KEY, "1"); } catch (_) {}
    setDismissed(true);
  };

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#241c12",
        border: "1px solid #5a3d1f",
        color: "#e0c890",
        padding: "8px 38px 8px 14px",
        borderRadius: 4,
        fontSize: 14,
        lineHeight: 1.45,
        maxWidth: 560,
        zIndex: 1000,
        boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
      }}
    >
      Safari uses a larger Web Audio output buffer than Chromium browsers, which adds noticeable latency to keypress-to-sound. For tighter monitoring, try Chrome, Edge, or Brave.
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss advisory"
        style={{
          position: "absolute",
          top: 4,
          right: 6,
          background: "transparent",
          border: "none",
          color: "#a08560",
          cursor: "pointer",
          fontSize: 19,
          lineHeight: 1,
          padding: "2px 8px",
        }}
      >
        ×
      </button>
    </div>
  );
}

const Scope = memo(function Scope({ engine }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    // ~30fps cap: shadowBlur on the waveform stroke is expensive, and 30fps
    // is plenty for an oscilloscope readout. Halves per-frame canvas work.
    const FRAME_MS = 33;
    let lastPaint = 0;

    const draw = (now) => {
      animRef.current = requestAnimationFrame(draw);
      if (document.hidden) return;
      if (now - lastPaint < FRAME_MS) return;
      lastPaint = now;

      const canvas = canvasRef.current;
      if (!canvas || !engine.current) return;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      const data = engine.current.getScopeData();

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "#1a2a1a";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 5; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let i = 0; i < 9; i++) {
        const x = (w / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Waveform
      ctx.strokeStyle = "#0f8";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#0f8";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      const sliceWidth = w / data.length;
      for (let i = 0; i < data.length; i++) {
        const x = i * sliceWidth;
        const y = (1 - data[i]) * h * 0.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const onVisible = () => { lastPaint = 0; };
    document.addEventListener("visibilitychange", onVisible);
    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [engine]);

  return <canvas ref={canvasRef} width={280} height={90} style={{ borderRadius: 4, border: "1px solid #1a2a1a" }} />;
});

function SvgKnob({ x, y, width, min, max, value, onChange, color, onDoubleClick }) {
  const range = max - min;
  const pct = Math.max(0, Math.min(1, (value - min) / range));

  const radius = 9;
  const cx = x + width / 2;
  const cy = y + radius - 1;

  // 0° points up; sweep -135° (7 o'clock) clockwise through 0° to +135° (5 o'clock).
  const minAngle = -135;
  const maxAngle = 135;
  const angle = minAngle + pct * (maxAngle - minAngle);
  const angleRad = (angle * Math.PI) / 180;
  const ix = cx + Math.sin(angleRad) * (radius - 2);
  const iy = cy - Math.cos(angleRad) * (radius - 2);

  const arcR = radius + 2.5;
  const arcPoint = (a) => {
    const rad = (a * Math.PI) / 180;
    return [cx + Math.sin(rad) * arcR, cy - Math.cos(rad) * arcR];
  };
  const [tx0, ty0] = arcPoint(minAngle);
  const [tx1, ty1] = arcPoint(maxAngle);
  const [fx, fy] = arcPoint(angle);
  const fillLargeFlag = angle - minAngle > 180 ? 1 : 0;

  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const roundVal = (val) => {
      if (range > 100) return Math.round(val);
      if (range > 10) return Math.round(val * 10) / 10;
      return Math.round(val * 1000) / 1000;
    };

    const startClientY = e.clientY;
    const startValue = value;
    const DRAG_RANGE_PX = 140;

    const move = (me) => {
      const fine = me.shiftKey ? 0.2 : 1;
      const deltaY = -(me.clientY - startClientY);
      const deltaRatio = (deltaY / DRAG_RANGE_PX) * fine;
      let val = startValue + deltaRatio * range;
      val = roundVal(Math.max(min, Math.min(max, val)));
      onChange(val);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <g onMouseDown={handleMouseDown} onDoubleClick={onDoubleClick} style={{ cursor: "ns-resize" }}>
      <path
        d={`M ${tx0} ${ty0} A ${arcR} ${arcR} 0 1 1 ${tx1} ${ty1}`}
        stroke="#333"
        strokeWidth={1.5}
        fill="none"
      />
      <path
        d={`M ${tx0} ${ty0} A ${arcR} ${arcR} 0 ${fillLargeFlag} 1 ${fx} ${fy}`}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        opacity={0.7}
      />
      <circle cx={cx} cy={cy} r={radius} fill="#1a1a1e" stroke="#333" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={radius - 2} fill="#2a2a2e" />
      <line
        x1={cx + Math.sin(angleRad) * 2.5}
        y1={cy - Math.cos(angleRad) * 2.5}
        x2={ix}
        y2={iy}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={radius + 5} fill="transparent" />
    </g>
  );
}

function LcdDisplay({ x, y, width, height, text, onDoubleClick }) {
  return (
    <g style={{ cursor: onDoubleClick ? "text" : "default" }} onDoubleClick={onDoubleClick}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={1}
        fill="#1a3a6a"
        stroke="#0a1f3a"
        strokeWidth={0.5}
      />
      <text
        x={x + width - 3}
        y={y + height - 4}
        textAnchor="end"
        fill="#7ec8e3"
        fontSize={13}
        fontFamily="'Pixel Operator', 'DM Mono', monospace"
        pointerEvents="none"
      >
        {text}
      </text>
    </g>
  );
}

function Port({ x, y, name, isOutput, signalType, onMouseDown, onMouseUp, isConnected }) {
  const color = SIGNAL_TYPE_COLORS[signalType] || SIGNAL_TYPE_COLORS.audio;
  const shapeProps = {
    fill: isConnected ? color : "#111",
    stroke: color,
    strokeWidth: 1.5,
    "data-port": "1",
    style: { cursor: "pointer", filter: isConnected ? `drop-shadow(0 0 4px ${color})` : "none" },
    onMouseDown: (e) => {
      e.stopPropagation();
      onMouseDown(e);
    },
    onMouseUp: (e) => {
      e.stopPropagation();
      onMouseUp(e);
    },
  };
  return (
    <g>
      {isOutput ? (
        <rect
          x={x - PORT_SIZE}
          y={y - PORT_SIZE}
          width={PORT_SIZE * 2}
          height={PORT_SIZE * 2}
          {...shapeProps}
        />
      ) : (
        <circle cx={x} cy={y} r={PORT_SIZE} {...shapeProps} />
      )}
      <text
        x={x}
        y={y - 7}
        textAnchor="middle"
        fill="#222"
        fontSize={11}
        fontFamily="'Pixel Operator', 'DM Mono', monospace"
        pointerEvents="none"
      >
        {name}
      </text>
    </g>
  );
}

function ParamNumericInput({ x, y, width, height, p, color, onCommit, onCancel }) {
  const fmt = (v) => (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.round(v));
  const tryCommit = (raw) => {
    const v = parseFloat(raw);
    if (!isNaN(v)) onCommit(Math.max(p.min, Math.min(p.max, v)));
    else onCancel();
  };
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <input
        type="text"
        defaultValue={fmt(p.value)}
        autoFocus
        style={{
          width: "100%",
          height: "100%",
          background: "#111",
          color: "#fff",
          border: `1px solid ${color}`,
          borderRadius: 2,
          fontSize: 13,
          fontFamily: "'Pixel Operator', 'DM Mono', monospace",
          padding: "0 3px",
          outline: "none",
          boxSizing: "border-box",
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") tryCommit(e.target.value);
          else if (e.key === "Escape") onCancel();
        }}
        onBlur={(e) => tryCommit(e.target.value)}
        onFocus={(e) => e.target.select()}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </foreignObject>
  );
}

const ModuleNode = memo(function ModuleNode({
  moduleState,
  engine,
  onDragStart,
  onPortDragStart,
  onPortDragEnd,
  connectedPorts,
  onParamChange,
  onMuteToggle,
  onRemove,
  seqFrame, // unread: its change is the re-render trigger for sequencer UIs
}) {
  const [editingParam, setEditingParam] = useState(null);
  const def = MODULE_DEFS[moduleState.type];
  const params = moduleState.params || {};
  const allInputs = [...(def.inputs || []), ...(def.modInputs || [])];
  const allOutputs = def.outputs || [];
  const height = getModuleHeight(moduleState.type, params);

  const headerH = HEADER_H;
  const paramsStartY = headerH;

  return (
    <g
      transform={`translate(${moduleState.x}, ${moduleState.y})`}
      onMouseDown={(e) => {
        if (e.target.dataset?.port === "1" || e.target.tagName === "circle" || e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
        onDragStart(e, moduleState.id);
      }}
      style={{ cursor: "grab" }}
    >
      {/* Shadow */}
      <rect x={3} y={3} width={MODULE_WIDTH} height={height} rx={6} fill="rgba(0,0,0,0.4)" />
      {/* Body */}
      <rect
        x={0}
        y={0}
        width={MODULE_WIDTH}
        height={height}
        rx={6}
        fill="#9a9a9a"
        stroke={def.color}
        strokeWidth={1.5}
      />
      {/* Header bar */}
      <rect x={0} y={0} width={MODULE_WIDTH} height={headerH} rx={6} fill="#828282" />
      <rect x={0} y={headerH - 6} width={MODULE_WIDTH} height={6} fill="#828282" />
      {/* Header underline accents the category colour */}
      <rect x={0} y={headerH - 1} width={MODULE_WIDTH} height={1} fill={def.color} />
      {/* Label */}
      <text x={8} y={15} fill="#111" fontSize={15} fontWeight={700} fontFamily="'Pixel Operator', 'DM Mono', monospace">
        {def.label}
      </text>
      {/* Mute button — small Nord-style M with an LED-style fill when active */}
      <g
        style={{ cursor: "pointer" }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onMuteToggle(moduleState.id);
        }}
      >
        <title>{moduleState.mute ? "Unmute module" : "Mute module"}</title>
        <rect
          x={MODULE_WIDTH - 32}
          y={4}
          width={14}
          height={14}
          rx={2}
          fill={moduleState.mute ? "#e04848" : "#5a5a5a"}
          stroke="#2a2a2a"
          strokeWidth={1}
        />
        <text
          x={MODULE_WIDTH - 25}
          y={15}
          textAnchor="middle"
          fill={moduleState.mute ? "#fff" : "#bbb"}
          fontSize={11}
          fontWeight={700}
          fontFamily="'Pixel Operator', 'DM Mono', monospace"
          style={{ pointerEvents: "none" }}
        >
          M
        </text>
      </g>
      {/* Close */}
      <text
        x={MODULE_WIDTH - 12}
        y={15}
        fill="#444"
        fontSize={15}
        fontWeight={700}
        fontFamily="'Pixel Operator', 'DM Mono', monospace"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(moduleState.id);
        }}
      >
        ×
      </text>

      {/* Params */}
      {buildParamLayout(def, params).items.map((item, idx) => {
        const py = paramsStartY + item.y;
        if (item.kind === "row") {
          const knobs = item.row.knobs;
          const labeled = item.labeled;
          const yOff = labeled ? PARAM_STRIP_LABEL_BAND_H : 0;
          const lcdText = knobs
            .map((k) => {
              const v = params[k]?.value ?? 0;
              return v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.round(v);
            })
            .join("  ");
          return (
            <g key={`row-${idx}`}>
              {labeled && (
                <>
                  <rect
                    x={4}
                    y={py}
                    width={MODULE_WIDTH - 8}
                    height={PARAM_STRIP_LABELED_H - 4}
                    fill="#a8a8a8"
                    stroke="#888"
                    strokeWidth={1}
                    rx={2}
                    ry={2}
                  />
                  <text
                    x={10}
                    y={py + 9}
                    fill="#444"
                    fontSize={9}
                    fontWeight={700}
                    fontFamily="'Pixel Operator', 'DM Mono', monospace"
                  >
                    {item.row.label}
                  </text>
                </>
              )}
              <LcdDisplay x={6} y={py + yOff} width={MODULE_WIDTH - 12} height={14} text={lcdText} />
              {knobs.map((k, ki) => {
                const p = params[k];
                if (!p) return null;
                const slot = MODULE_WIDTH / knobs.length;
                const cx = ki * slot + slot / 2;
                return (
                  <g key={k}>
                    {editingParam === k ? (
                      <ParamNumericInput
                        x={cx - 25}
                        y={py + 19 + yOff}
                        width={50}
                        height={18}
                        p={p}
                        color={def.color}
                        onCommit={(v) => { onParamChange(moduleState.id, k, v); setEditingParam(null); }}
                        onCancel={() => setEditingParam(null)}
                      />
                    ) : (
                      <SvgKnob
                        x={cx - 20}
                        y={py + 18 + yOff}
                        width={40}
                        min={p.min}
                        max={p.max}
                        value={p.value}
                        onChange={(v) => onParamChange(moduleState.id, k, v)}
                        color={def.color}
                        onDoubleClick={(e) => { e.stopPropagation(); setEditingParam(k); }}
                      />
                    )}
                    <text
                      x={cx}
                      y={py + 50 + yOff}
                      textAnchor="middle"
                      fill="#111"
                      fontSize={12}
                      fontFamily="'Pixel Operator', 'DM Mono', monospace"
                    >
                      {p.label || k}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        }
        const { key } = item;
        const p = params[key];
        if (!p) return null;
        if (p.options) {
          return (
            <g key={key}>
              <text x={6} y={py + 12} fill="#111" fontSize={14} fontFamily="'Pixel Operator', 'DM Mono', monospace">
                {p.label || key}
              </text>
              <foreignObject x={64} y={py + 1} width={152} height={20}>
                <select
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#111",
                    color: "#ddd",
                    border: `1px solid ${def.color}44`,
                    borderRadius: 2,
                    fontSize: 13,
                    fontFamily: "'Pixel Operator', 'DM Mono', monospace",
                    padding: "0 3px",
                    outline: "none",
                  }}
                  value={p.value}
                  onChange={(e) => onParamChange(moduleState.id, key, e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {p.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </foreignObject>
            </g>
          );
        }
        return (
          <g key={key}>
            <text x={6} y={py + 12} fill="#111" fontSize={14} fontFamily="'Pixel Operator', 'DM Mono', monospace">
              {p.label || key}
            </text>
            <SvgKnob
              x={64}
              y={py + 3}
              width={80}
              min={p.min}
              max={p.max}
              value={p.value}
              onChange={(v) => onParamChange(moduleState.id, key, v)}
              color={def.color}
              onDoubleClick={(e) => { e.stopPropagation(); setEditingParam(key); }}
            />
            {editingParam === key ? (
              <ParamNumericInput
                x={156}
                y={py + 1}
                width={58}
                height={18}
                p={p}
                color={def.color}
                onCommit={(v) => { onParamChange(moduleState.id, key, v); setEditingParam(null); }}
                onCancel={() => setEditingParam(null)}
              />
            ) : (
              <LcdDisplay
                x={156}
                y={py + 2}
                width={58}
                height={18}
                text={p.value < 10 ? p.value.toFixed(2) : p.value < 100 ? p.value.toFixed(1) : Math.round(p.value)}
                onDoubleClick={(e) => { e.stopPropagation(); setEditingParam(key); }}
              />
            )}
          </g>
        );
      })}

      {/* Custom UI renderers */}
      {moduleState.type === "Keyboard" && (() => {
        const kbY = paramsStartY + Object.keys(params).length * PARAM_ROW_H + PARAMS_PAD_BOTTOM + 4;
        const whiteKeys = PIANO_KEYS.filter(k => !k.black);
        const ww = MODULE_WIDTH / whiteKeys.length; // white key width
        let whiteIdx = 0;
        return (
          <g>
            {/* White keys */}
            {PIANO_KEYS.filter(k => !k.black).map((k, i) => (
              <rect
                key={`w-${k.note}`}
                x={i * ww + 1}
                y={kbY}
                width={ww - 1}
                height={40}
                rx={1}
                fill="#ddd"
                stroke="#999"
                strokeWidth={0.5}
                style={{ cursor: "pointer" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const eng = engine.current;
                  const mod = eng.modules.get(moduleState.id);
                  if (mod && mod.playNote) mod.playNote(k.note);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  const eng = engine.current;
                  const mod = eng.modules.get(moduleState.id);
                  if (mod && mod.releaseNote) mod.releaseNote(k.note);
                }}
                onMouseLeave={(e) => {
                  const eng = engine.current;
                  const mod = eng.modules.get(moduleState.id);
                  if (mod && mod.releaseNote) mod.releaseNote(k.note);
                }}
              />
            ))}
            {/* Black keys */}
            {(() => {
              const blackKeyPositions = [];
              let wi = 0;
              for (let i = 0; i < PIANO_KEYS.length; i++) {
                if (PIANO_KEYS[i].black) {
                  blackKeyPositions.push({ ...PIANO_KEYS[i], xPos: wi * ww - ww * 0.3 });
                } else {
                  wi++;
                }
              }
              return blackKeyPositions.map((k) => (
                <rect
                  key={`b-${k.note}`}
                  x={k.xPos}
                  y={kbY}
                  width={ww * 0.6}
                  height={25}
                  rx={1}
                  fill="#222"
                  stroke="#000"
                  strokeWidth={0.5}
                  style={{ cursor: "pointer" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const eng = engine.current;
                    const mod = eng.modules.get(moduleState.id);
                    if (mod && mod.playNote) mod.playNote(k.note);
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    const eng = engine.current;
                    const mod = eng.modules.get(moduleState.id);
                    if (mod && mod.releaseNote) mod.releaseNote(k.note);
                  }}
                  onMouseLeave={(e) => {
                    const eng = engine.current;
                    const mod = eng.modules.get(moduleState.id);
                    if (mod && mod.releaseNote) mod.releaseNote(k.note);
                  }}
                />
              ));
            })()}
          </g>
        );
      })()}

      {/* EventSeq custom UI */}
      {moduleState.type === "EventSeq" && (() => {
        const seqY = paramsStartY + Object.keys(params).length * PARAM_ROW_H + PARAMS_PAD_BOTTOM + 2;
        const mod = engine.current?.modules?.get(moduleState.id);
        const step = mod?._currentStep || 0;
        const cellW = MODULE_WIDTH / 16;
        return (
          <g>
            {/* Step indicator */}
            {[...Array(16)].map((_, i) => (
              <rect key={`led-${i}`} x={i * cellW + 1} y={seqY} width={cellW - 2} height={3}
                rx={1} fill={i === step ? "#ff0" : "#222"} />
            ))}
            {/* Row 1 triggers */}
            {[...Array(16)].map((_, i) => (
              <rect key={`t1-${i}`} x={i * cellW + 1} y={seqY + 6} width={cellW - 2} height={24}
                rx={2} fill={mod?._triggers1[i] ? "#f84" : "#1a1a1e"} stroke="#333" strokeWidth={0.5}
                style={{ cursor: "pointer" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (mod) { mod._triggers1[i] = !mod._triggers1[i]; onParamChange(moduleState.id, "steps", params.steps.value); }
                }} />
            ))}
            {/* Row 2 triggers */}
            {[...Array(16)].map((_, i) => (
              <rect key={`t2-${i}`} x={i * cellW + 1} y={seqY + 33} width={cellW - 2} height={24}
                rx={2} fill={mod?._triggers2[i] ? "#4cf" : "#1a1a1e"} stroke="#333" strokeWidth={0.5}
                style={{ cursor: "pointer" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (mod) { mod._triggers2[i] = !mod._triggers2[i]; onParamChange(moduleState.id, "steps", params.steps.value); }
                }} />
            ))}
          </g>
        );
      })()}

      {/* CtrlSeq custom UI */}
      {moduleState.type === "CtrlSeq" && (() => {
        const seqY = paramsStartY + Object.keys(params).length * PARAM_ROW_H + PARAMS_PAD_BOTTOM + 2;
        const mod = engine.current?.modules?.get(moduleState.id);
        const step = mod?._currentStep || 0;
        const cellW = MODULE_WIDTH / 16;
        const maxH = 60;
        return (
          <g>
            {/* Step indicator */}
            {[...Array(16)].map((_, i) => (
              <rect key={`led-${i}`} x={i * cellW + 1} y={seqY} width={cellW - 2} height={3}
                rx={1} fill={i === step ? "#ff0" : "#222"} />
            ))}
            {/* Value bars */}
            {[...Array(16)].map((_, i) => {
              const val = mod?._values[i] || 0;
              const norm = (val + 64) / 128; // -64..+64 => 0..1
              const barH = norm * maxH;
              return (
                <g key={`bar-${i}`}>
                  <rect x={i * cellW + 1} y={seqY + 6} width={cellW - 2} height={maxH}
                    fill="#111" stroke="#333" strokeWidth={0.5} rx={1} />
                  <rect x={i * cellW + 2} y={seqY + 6 + (maxH - barH)} width={cellW - 4} height={barH}
                    fill="#4cf" rx={1} />
                  <rect x={i * cellW + 1} y={seqY + 6} width={cellW - 2} height={maxH}
                    fill="transparent" style={{ cursor: "ns-resize" }}
                    onMouseDown={(e) => {
                      e.stopPropagation(); e.preventDefault();
                      const startY = e.clientY;
                      const startVal = mod?._values[i] || 0;
                      const move = (me) => {
                        const dy = startY - me.clientY;
                        const newVal = Math.max(-64, Math.min(64, Math.round(startVal + dy)));
                        if (mod) { mod._values[i] = newVal; onParamChange(moduleState.id, "steps", params.steps.value); }
                      };
                      const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
                      window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
                    }} />
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* NoteSeqA custom UI */}
      {moduleState.type === "NoteSeqA" && (() => {
        const seqY = paramsStartY + Object.keys(params).length * PARAM_ROW_H + PARAMS_PAD_BOTTOM + 2;
        const mod = engine.current?.modules?.get(moduleState.id);
        const step = mod?._currentStep || 0;
        const cellW = MODULE_WIDTH / 16;
        const sliderH = 60;
        return (
          <g>
            {/* Step indicator */}
            {[...Array(16)].map((_, i) => (
              <rect key={`led-${i}`} x={i * cellW + 1} y={seqY} width={cellW - 2} height={3}
                rx={1} fill={i === step ? "#ff0" : "#222"} />
            ))}
            {/* Pitch sliders */}
            {[...Array(16)].map((_, i) => {
              const midi = mod?._pitchValues[i] || 60;
              const norm = (midi - 36) / 48; // MIDI 36-84 (C2-C6)
              const barH = Math.max(2, norm * sliderH);
              return (
                <g key={`pitch-${i}`}>
                  <rect x={i * cellW + 1} y={seqY + 6} width={cellW - 2} height={sliderH}
                    fill="#111" stroke="#333" strokeWidth={0.5} rx={1} />
                  <rect x={i * cellW + 2} y={seqY + 6 + (sliderH - barH)} width={cellW - 4} height={barH}
                    fill="#fc0" rx={1} />
                  <rect x={i * cellW + 1} y={seqY + 6} width={cellW - 2} height={sliderH}
                    fill="transparent" style={{ cursor: "ns-resize" }}
                    onMouseDown={(e) => {
                      e.stopPropagation(); e.preventDefault();
                      const startY = e.clientY;
                      const startMidi = mod?._pitchValues[i] || 60;
                      const move = (me) => {
                        const dy = startY - me.clientY;
                        const newMidi = Math.max(36, Math.min(84, Math.round(startMidi + dy * 0.5)));
                        if (mod) { mod._pitchValues[i] = newMidi; onParamChange(moduleState.id, "steps", params.steps.value); }
                      };
                      const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
                      window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
                    }} />
                </g>
              );
            })}
            {/* Gate toggles */}
            {[...Array(16)].map((_, i) => (
              <rect key={`gate-${i}`} x={i * cellW + 1} y={seqY + sliderH + 10} width={cellW - 2} height={16}
                rx={2} fill={mod?._gatePattern[i] ? "#4f4" : "#1a1a1e"} stroke="#333" strokeWidth={0.5}
                style={{ cursor: "pointer" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (mod) { mod._gatePattern[i] = !mod._gatePattern[i]; onParamChange(moduleState.id, "steps", params.steps.value); }
                }} />
            ))}
          </g>
        );
      })()}

      {/* NoteSeqB custom UI (Piano Roll) */}
      {moduleState.type === "NoteSeqB" && (() => {
        const seqY = paramsStartY + Object.keys(params).length * PARAM_ROW_H + PARAMS_PAD_BOTTOM + 2;
        const mod = engine.current?.modules?.get(moduleState.id);
        const step = mod?._currentStep || 0;
        const cellW = MODULE_WIDTH / 16;
        const baseOct = (mod?.params?.baseOctave?.value || 3);
        const baseMidi = (baseOct + 1) * 12; // octave 3 = MIDI 48
        const rows = 24; // 2 octaves
        const rowH = 4;
        const gridH = rows * rowH;
        const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
        return (
          <g>
            {/* Step indicator */}
            {[...Array(16)].map((_, i) => (
              <rect key={`led-${i}`} x={i * cellW + 1} y={seqY} width={cellW - 2} height={3}
                rx={1} fill={i === step ? "#ff0" : "#222"} />
            ))}
            {/* Grid */}
            {[...Array(rows)].map((_, row) => {
              const midi = baseMidi + (rows - 1 - row);
              const isBlack = [1,3,6,8,10].includes(midi % 12);
              return [...Array(16)].map((_, col) => {
                const isActive = mod?._pitchValues[col] === midi && mod?._gatePattern[col];
                return (
                  <rect key={`cell-${row}-${col}`}
                    x={col * cellW + 1} y={seqY + 6 + row * rowH}
                    width={cellW - 2} height={rowH - 0.5}
                    fill={isActive ? "#fc0" : isBlack ? "#181818" : "#111"}
                    stroke="#222" strokeWidth={0.25}
                    style={{ cursor: "pointer" }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (!mod) return;
                      if (mod._pitchValues[col] === midi && mod._gatePattern[col]) {
                        mod._gatePattern[col] = false;
                      } else {
                        mod._pitchValues[col] = midi;
                        mod._gatePattern[col] = true;
                      }
                      onParamChange(moduleState.id, "steps", params.steps.value);
                    }} />
                );
              });
            })}
          </g>
        );
      })()}

      {/* Input ports */}
      {allInputs.map((port, i) => {
        const worldPos = getPortPosition(moduleState, port, false);
        const px = worldPos.x - moduleState.x;
        const py = worldPos.y - moduleState.y;
        const isMod = (def.modInputs || []).includes(port);
        const signalType = getPortSignalType(port, isMod ? "modInput" : "input", moduleState.type);
        return (
          <Port
            key={`in-${port}`}
            x={px}
            y={py}
            name={port}
            isOutput={false}
            signalType={signalType}
            isConnected={connectedPorts.has(`in:${port}`)}
            onMouseDown={(e) => onPortDragStart(e, moduleState.id, port, false)}
            onMouseUp={(e) => onPortDragEnd(e, moduleState.id, port, false)}
          />
        );
      })}

      {/* Output ports */}
      {allOutputs.map((port, i) => {
        const worldPos = getPortPosition(moduleState, port, true);
        const px = worldPos.x - moduleState.x;
        const py = worldPos.y - moduleState.y;
        const signalType = getPortSignalType(port, "output", moduleState.type);
        return (
          <Port
            key={`out-${port}`}
            x={px}
            y={py}
            name={port}
            isOutput={true}
            signalType={signalType}
            isConnected={connectedPorts.has(`out:${port}`)}
            onMouseDown={(e) => onPortDragStart(e, moduleState.id, port, true)}
            onMouseUp={(e) => onPortDragEnd(e, moduleState.id, port, true)}
          />
        );
      })}

    </g>
  );
});

function cablePathD(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const sag = Math.min(dist * 0.3, 80);
  const cp1x = x1 + dx * 0.25;
  const cp1y = y1 + dy * 0.25 + sag;
  const cp2x = x1 + dx * 0.75;
  const cp2y = y1 + dy * 0.75 + sag;
  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

const CableSVG = memo(function CableSVG({ x1, y1, x2, y2, color }) {
  const d = cablePathD(x1, y1, x2, y2);
  return (
    <g>
      <path
        d={d}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={d}
        stroke={color || "#f55"}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color || "#f55"})` }}
      />
    </g>
  );
});

// Drag-preview cable: refs onto the SVG paths and a RAF loop that reads the
// shared mousePosRef directly. Skips React reconciliation per mousemove,
// which would otherwise re-render the entire app while a cable is being dragged.
function CableDragPreview({ cableDrag, mousePosRef, panOffset }) {
  const backRef = useRef(null);
  const frontRef = useRef(null);

  useEffect(() => {
    if (!cableDrag) return undefined;
    let raf = 0;
    const tick = () => {
      const mp = mousePosRef.current;
      const d = cablePathD(
        cableDrag.startX,
        cableDrag.startY,
        mp.x - panOffset.x,
        mp.y - panOffset.y,
      );
      if (backRef.current) backRef.current.setAttribute("d", d);
      if (frontRef.current) frontRef.current.setAttribute("d", d);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [cableDrag, mousePosRef, panOffset]);

  if (!cableDrag) return null;
  return (
    <g pointerEvents="none">
      <path ref={backRef} stroke="rgba(0,0,0,0.5)" strokeWidth={5} fill="none" strokeLinecap="round" />
      <path
        ref={frontRef}
        stroke="#fff"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 3px #fff)" }}
      />
    </g>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

export default function BoredModularEmulator() {
  const engineRef = useRef(new AudioEngine());
  const svgRef = useRef(null);
  const [modules, setModules] = useState([]);
  const [connections, setConnections] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [cableDrag, setCableDrag] = useState(null);
  // mousePos is read only by the cable drag preview, which now consumes it
  // imperatively via RAF -- keep it as a ref so mousemove doesn't re-render.
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [audioStarted, setAudioStarted] = useState(false);
  const [keyHeld, setKeyHeld] = useState(false);

  // Latest-value refs, synced after every commit. Gesture handlers passed to
  // memoized children read live values through these instead of closing over
  // state — a handler whose identity changed per render would defeat
  // React.memo on every ModuleNode. Handlers only fire on user events (always
  // after a commit), so the refs are never stale when read.
  const modulesRef = useRef(modules);
  const panOffsetRef = useRef(panOffset);
  const cableDragRef = useRef(cableDrag);
  useLayoutEffect(() => {
    modulesRef.current = modules;
    panOffsetRef.current = panOffset;
    cableDragRef.current = cableDrag;
  });

  const initAudio = useCallback(() => {
    if (!audioStarted) {
      engineRef.current.init();
      setAudioStarted(true);
    } else {
      // Already started: every subsequent gesture is a chance to recover audio
      // if the context suspended (mobile/Safari backgrounding, screen lock).
      engineRef.current.resumeIfNeeded();
    }
  }, [audioStarted]);

  const addModuleAt = useCallback(
    async (type, x, y) => {
      initAudio();
      const id = genId();
      const eng = engineRef.current;
      const audioMod = await eng.createModule(id, type);
      if (!audioMod) return;

      const params = {};
      Object.entries(audioMod.params).forEach(([k, v]) => {
        params[k] = { ...v };
      });

      setModules((prev) => {
        const snapped = resolveDropSnap({ x, y, type, params, ignoreId: id, modules: prev });
        const pos = snapped || { x, y };
        let next = prev;
        if (snapped && snapped.pushDown) {
          const pushIds = new Set(snapped.pushDown.ids);
          const delta = snapped.pushDown.deltaY;
          next = prev.map((m) => (pushIds.has(m.id) ? { ...m, y: m.y + delta } : m));
        }
        return [...next, { id, type, x: pos.x, y: pos.y, params }];
      });
    },
    [initAudio]
  );

  const addModule = useCallback(
    async (type) => {
      initAudio();
      const id = genId();
      const eng = engineRef.current;
      const audioMod = await eng.createModule(id, type);
      if (!audioMod) return;

      const params = {};
      Object.entries(audioMod.params).forEach(([k, v]) => {
        params[k] = { ...v };
      });

      const candidateX = 80 + Math.random() * 200 - panOffsetRef.current.x;
      const candidateY = 80 + Math.random() * 150 - panOffsetRef.current.y;
      setModules((prev) => {
        const pos = { x: candidateX, y: candidateY };
        let attempts = 0;
        while (
          attempts < 20 &&
          prev.some(
            (m) => Math.abs(m.x - pos.x) < MODULE_WIDTH + 20 && Math.abs(m.y - pos.y) < 120
          )
        ) {
          pos.x += 25;
          pos.y += 25;
          attempts++;
        }
        return [...prev, { id, type, x: pos.x, y: pos.y, params }];
      });
    },
    [initAudio]
  );

  const removeModule = useCallback(
    (id) => {
      engineRef.current.removeModule(id);
      setModules((prev) => prev.filter((m) => m.id !== id));
      setConnections((prev) => prev.filter((c) => c.fromId !== id && c.toId !== id));
    },
    []
  );

  const handleParamChange = useCallback((moduleId, paramName, value) => {
    engineRef.current.setParam(moduleId, paramName, value);
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          params: {
            ...m.params,
            [paramName]: { ...m.params[paramName], value },
          },
        };
      })
    );
  }, []);

  const handleMuteToggle = useCallback((moduleId) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const next = !m.mute;
        engineRef.current.setMute(moduleId, next);
        return { ...m, mute: next };
      })
    );
  }, []);

  const fileInputRef = useRef(null);
  const [patchMsg, setPatchMsg] = useState(null);

  const clearPatch = useCallback(() => {
    modules.forEach((m) => engineRef.current.removeModule(m.id));
    setModules([]);
    setConnections([]);
  }, [modules]);

  const loadPatchData = useCallback(
    async (patch) => {
      // Malformed-patch guard: validate shape BEFORE any engine teardown so a
      // bad import (e.g. a {}-shaped JSON) can't destroy the live graph and
      // white-screen the canvas. Surface a brief on-screen note and bail.
      if (!patch || typeof patch !== "object" || !Array.isArray(patch.modules)) {
        console.error("loadPatchData: malformed patch (expected { modules: [...] })", patch);
        setPatchMsg("Invalid patch file");
        setTimeout(() => setPatchMsg(null), 2500);
        return;
      }

      // Clear existing
      modules.forEach((m) => engineRef.current.removeModule(m.id));
      initAudio();

      // Legacy Amplifier migration: the pre-split impl was a VCA with a GainMod
      // mod input. If a saved Amplifier still has a GainMod connection, retype
      // it to the new GainControl (carrying the saved level value forward).
      // Without any GainMod connection, it stays as the new fixed-gain Amplifier
      // and its saved level is clamped into the new [0.25, 4.0] range.
      const amplifierRetypes = new Map();
      patch.modules.forEach((m) => {
        if (m.type !== "Amplifier") return;
        const hasGainMod = (patch.connections || []).some(
          (c) => c.toId === m.id && c.toPort === "GainMod"
        );
        if (hasGainMod) amplifierRetypes.set(m.id, "GainControl");
      });

      // Rebuild modules — start from the engine's param shape (with min/max/etc),
      // overlay the patch's values. Patches may store params as raw values
      // ({freq: 220}) or as full objects ({freq: {value: 220, ...}}); both work.
      const rebuilt = [];
      for (const m of patch.modules) {
        // Legacy alias: pre-rename patches store "Mixer2" — canonicalise to "Mixer3"
        // so both the engine and the renderer (which keys MODULE_DEFS by type) agree.
        let type = m.type === "Mixer2" ? "Mixer3" : m.type;
        if (amplifierRetypes.has(m.id)) type = amplifierRetypes.get(m.id);
        const audioMod = await engineRef.current.createModule(m.id, type);
        // Unknown-type skip: a type the engine/UI doesn't know would otherwise
        // push a phantom module that white-screens the canvas on next render.
        if (!audioMod || !MODULE_DEFS[type]) {
          console.warn("Skipping unknown module type", type);
          continue;
        }
        const params = {};
        if (audioMod) {
          Object.entries(audioMod.params).forEach(([k, v]) => {
            params[k] = { ...v };
          });
        }
        Object.entries(m.params || {}).forEach(([rawKey, v]) => {
          // Pitch port rename (2026-05-25): PitchMod1Atten / PitchMod2Atten
          // params from pre-rename patches map onto the new Pitch1Atten /
          // Pitch2Atten attenuator params created by _autoAddAttenuators.
          const k = rawKey === "PitchMod1Atten" ? "Pitch1Atten"
            : rawKey === "PitchMod2Atten" ? "Pitch2Atten"
            : rawKey;
          let value = v && typeof v === "object" && "value" in v ? v.value : v;
          // Own-property guard: a hostile patch key like "__proto__" or
          // "toString" resolves through the prototype chain on a bare lookup,
          // and the `.value` write below would then land on Object.prototype
          // or a shared built-in. Only own keys are real params.
          const def = Object.prototype.hasOwnProperty.call(params, k) ? params[k] : undefined;
          // Param clamp on restore: for numeric params, coerce with Number() and
          // clamp into the engine def's [min,max]. A non-finite/garbage saved value
          // keeps the engine default. Enum/string params (no numeric def) pass through.
          if (def && typeof def.value === "number" && typeof value !== "string") {
            const num = Number(value);
            if (Number.isFinite(num)) {
              let clamped = num;
              if (typeof def.min === "number") clamped = Math.max(def.min, clamped);
              if (typeof def.max === "number") clamped = Math.min(def.max, clamped);
              value = clamped;
            } else {
              value = def.value; // keep engine default when the saved value is garbage
            }
          }
          // Amplifier kept as fixed-gain: clamp pre-split level values into [0.25, 4.0].
          if (m.type === "Amplifier" && type === "Amplifier" && k === "level") {
            value = Math.max(0.25, value);
          }
          if (def) def.value = value;
          engineRef.current.setParam(m.id, k, value);
        });
        // Restore mute before reconnection so the lazy mute-gain (created on the
        // first connect from each port) starts at the right gain value.
        if (m.mute) engineRef.current.setMute(m.id, true);
        rebuilt.push({ id: m.id, type, x: m.x, y: m.y, params, ...(m.mute ? { mute: true } : {}) });
      }
      // Update _idCounter
      const maxId = Math.max(...patch.modules.map((m) => parseInt(m.id.split("_")[1]) || 0), 0);
      if (maxId >= _idCounter) _idCounter = maxId;
      // Reconnect — for Amplifier→GainControl retypes, rename GainMod port to Ctrl
      // so both engine connections and rendered cables target the new module shape.
      // Backfill `color` from the source-port signal type when missing, so patches
      // saved before the colour-by-signal-type system (and hand-authored patches
      // that skip the field) still render with the correct cable colours.
      const fromModType = (id) => rebuilt.find((m) => m.id === id)?.type;
      const migratedConnections = (patch.connections || []).map((c) => {
        let next = c;
        if (amplifierRetypes.has(c.toId) && c.toPort === "GainMod") {
          next = { ...next, toPort: "Ctrl" };
        }
        // Pitch port rename (2026-05-25): PitchMod1/PitchMod2 → Pitch1/Pitch2
        // on the oscillators that carried numbered pitch mods (OscA, OscB,
        // MasterOsc, FormantOsc, SpectralOsc). Other modules' connections
        // pass through unchanged.
        if (next.toPort === "PitchMod1") next = { ...next, toPort: "Pitch1" };
        else if (next.toPort === "PitchMod2") next = { ...next, toPort: "Pitch2" };
        if (!next.color) {
          next = { ...next, color: SIGNAL_TYPE_COLORS[getPortSignalType(next.fromPort, "output", fromModType(next.fromId))] };
        }
        return next;
      });
      migratedConnections.forEach((c) => {
        engineRef.current.connect(c.fromId, c.fromPort, c.toId, c.toPort);
      });
      // Restore per-module internal state (sequencer steps, etc.) after
      // connections are in place. resetSeq() neutralises any ClkGen tick that
      // may have advanced _currentStep during the awaited createModule loop.
      for (const m of patch.modules) {
        if (!m.internalState) continue;
        const audioMod = engineRef.current.modules.get(m.id);
        engineRef.current.restoreInternalState(audioMod, m.internalState);
        if (audioMod && typeof audioMod.resetSeq === "function") audioMod.resetSeq();
      }
      setModules(rebuilt);
      setConnections(migratedConnections);
    },
    [modules, initAudio]
  );

  const buildPatch = useCallback(() => {
    const engine = engineRef.current;
    return {
      modules: modules.map((m) => {
        const audioMod = engine ? engine.modules.get(m.id) : null;
        const internalState = engine ? engine.extractInternalState(audioMod) : null;
        return internalState ? { ...m, internalState } : { ...m };
      }),
      connections,
    };
  }, [modules, connections]);

  const savePatch = useCallback(() => {
    const patch = JSON.stringify(buildPatch());
    localStorage.setItem("bored-patch-1", patch);
    setPatchMsg("Saved!");
    setTimeout(() => setPatchMsg(null), 1500);
  }, [buildPatch]);

  const loadPatch = useCallback(async () => {
    const raw = localStorage.getItem("bored-patch-1");
    if (!raw) {
      setPatchMsg("No saved patch");
      setTimeout(() => setPatchMsg(null), 1500);
      return;
    }
    // Await so async failures inside loadPatchData surface here instead of
    // escaping as an unhandled rejection.
    try {
      await loadPatchData(JSON.parse(raw));
      setPatchMsg("Loaded!");
      setTimeout(() => setPatchMsg(null), 1500);
    } catch (e) {
      console.error("Load error:", e);
      setPatchMsg("Load failed");
      setTimeout(() => setPatchMsg(null), 2500);
    }
  }, [loadPatchData]);

  const exportPatch = useCallback(() => {
    const blob = new Blob([JSON.stringify(buildPatch(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bored-patch.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [buildPatch]);

  const importPatch = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      // Await so async failures inside loadPatchData surface here instead of
      // escaping as an unhandled rejection.
      reader.onload = async (ev) => {
        try {
          await loadPatchData(JSON.parse(ev.target.result));
          setPatchMsg("Imported!");
          setTimeout(() => setPatchMsg(null), 1500);
        } catch (err) {
          console.error("Import error:", err);
          setPatchMsg("Load failed");
          setTimeout(() => setPatchMsg(null), 2500);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [loadPatchData]
  );

  // Drag modules
  const handleDragStart = useCallback(
    (e, id) => {
      if (e.button === 1 || e.button === 2) return;
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const mod = modulesRef.current.find((m) => m.id === id);
      if (!mod) return;
      const pan = panOffsetRef.current;
      setDragging({
        id,
        offsetX: (e.clientX - rect.left) / 1 - pan.x - mod.x,
        offsetY: (e.clientY - rect.top) / 1 - pan.y - mod.y,
      });
    },
    []
  );

  const handlePortDragEnd = useCallback(
    (e, moduleId, portName, isOutput) => {
      const cableDrag = cableDragRef.current;
      if (!cableDrag) return;
      // Releasing on the same port that started the cable — leave it pending
      // so the user can click a target next (click-then-click mode).
      if (cableDrag.fromId === moduleId && cableDrag.fromPort === portName) return;
      // Normalize: one side must be output, the other input
      let outId, outPort, inId, inPort;
      if (cableDrag.isOutput && !isOutput) {
        // Output → input (normal)
        outId = cableDrag.fromId; outPort = cableDrag.fromPort;
        inId = moduleId; inPort = portName;
      } else if (!cableDrag.isOutput && isOutput) {
        // Input → output (reverse)
        outId = moduleId; outPort = portName;
        inId = cableDrag.fromId; inPort = cableDrag.fromPort;
      } else {
        // Same type (output→output or input→input) — can't connect
        setCableDrag(null);
        return;
      }
      const success = engineRef.current.connect(outId, outPort, inId, inPort);
      if (success) {
        setConnections((prev) => [
          ...prev,
          {
            fromId: outId,
            fromPort: outPort,
            toId: inId,
            toPort: inPort,
            color: SIGNAL_TYPE_COLORS[getPortSignalType(outPort, "output")],
          },
        ]);
      }
      setCableDrag(null);
    },
    []
  );

  const handlePortDragStart = useCallback(
    (e, moduleId, portName, isOutput) => {
      e.preventDefault();
      // If a cable is already pending, treat this click as the drop target.
      if (cableDragRef.current) {
        handlePortDragEnd(e, moduleId, portName, isOutput);
        return;
      }
      initAudio();
      const mod = modulesRef.current.find((m) => m.id === moduleId);
      if (!mod) return;
      const pos = getPortPosition(mod, portName, isOutput);
      setCableDrag({
        fromId: moduleId,
        fromPort: portName,
        isOutput,
        startX: pos.x,
        startY: pos.y,
      });
    },
    [initAudio, handlePortDragEnd]
  );

  const removeCable = useCallback((idx) => {
    setConnections((prev) => {
      const c = prev[idx];
      if (c) {
        engineRef.current.disconnect(c.fromId, c.fromPort, c.toId, c.toPort);
      }
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const handleSidebarDrop = useCallback(
    (e) => {
      const type = e.dataTransfer.getData("application/x-bored-modular");
      if (!type || !MODULE_DEFS[type]) return;
      e.preventDefault();
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - panOffset.x;
      const y = e.clientY - rect.top - panOffset.y;
      addModuleAt(type, x, y);
    },
    [panOffset, addModuleAt]
  );

  // Mouse move
  const handleMouseMove = useCallback(
    (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mousePosRef.current.x = mx;
      mousePosRef.current.y = my;

      if (dragging) {
        setModules((prev) =>
          prev.map((m) => {
            if (m.id !== dragging.id) return m;
            return {
              ...m,
              x: mx / 1 - panOffset.x - dragging.offsetX,
              y: my / 1 - panOffset.y - dragging.offsetY,
            };
          })
        );
      }
      if (isPanning) {
        setPanOffset({
          x: panStart.current.ox + (e.clientX - panStart.current.x),
          y: panStart.current.oy + (e.clientY - panStart.current.y),
        });
      }
    },
    [dragging, isPanning, panOffset]
  );

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      const draggedId = dragging.id;
      setModules((prev) => {
        const drag = prev.find((m) => m.id === draggedId);
        if (!drag) return prev;
        const snapped = resolveDropSnap({
          x: drag.x,
          y: drag.y,
          type: drag.type,
          params: drag.params,
          ignoreId: draggedId,
          modules: prev,
        });
        if (!snapped) return prev;
        return applyDropSnap(prev, draggedId, snapped);
      });
    }
    setDragging(null);
    setIsPanning(false);
  }, [dragging]);

  // Releasing the mouse over the sidebar or off-window never reaches the <svg>
  // onMouseUp, so a drag/pan would stay stuck. Mirror the finalize logic on a
  // window mouseup while a drag or pan is active. Gated so it's only bound when
  // needed, and cleaned up when the interaction ends.
  useEffect(() => {
    if (!dragging && !isPanning) return;
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [dragging, isPanning, handleMouseUp]);

  // Audio-context recovery: refocusing the window or revealing the tab is a
  // chance to resume after the context suspended (backgrounding, screen lock).
  useEffect(() => {
    const recover = () => engineRef.current.resumeIfNeeded();
    const onVisibility = () => { if (!document.hidden) recover(); };
    window.addEventListener("focus", recover);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", recover);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const handleSvgMouseDown = useCallback(
    (e) => {
      if (e.target === svgRef.current || e.target.tagName === "rect") {
        if (cableDrag) {
          setCableDrag(null);
          return;
        }
        if (e.button === 0 && (e.shiftKey || e.altKey)) {
          setIsPanning(true);
          panStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
        }
      }
    },
    [panOffset, cableDrag]
  );

  // Keyboard trigger + musical keyboard
  useEffect(() => {
    const heldNotes = new Set();
    const down = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === "Escape" && cableDrag) {
        e.preventDefault();
        setCableDrag(null);
        return;
      }
      if (e.key === " " && !keyHeld) {
        e.preventDefault();
        setKeyHeld(true);
        initAudio();
        engineRef.current.triggerEnvelopes();
        return;
      }
      // Octave shift: Z down, X up. Ignore when modifiers are held so
      // Cmd/Ctrl+Z still reaches the browser. Shifts every Keyboard module
      // on the canvas in lock-step so the musical keyboard stays consistent.
      const k = e.key.toLowerCase();
      if ((k === "z" || k === "x") && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const delta = k === "z" ? -1 : 1;
        let shifted = false;
        engineRef.current.modules.forEach((mod, id) => {
          if (mod.type !== "Keyboard") return;
          const p = mod.params && mod.params.octave;
          if (!p) return;
          const min = p.min ?? -2;
          const max = p.max ?? 4;
          const next = Math.max(min, Math.min(max, (p.value ?? 0) + delta));
          if (next !== p.value) {
            handleParamChange(id, "octave", next);
            shifted = true;
          }
        });
        if (shifted) e.preventDefault();
        return;
      }
      // Musical keyboard: route to all Keyboard modules
      const note = KEY_NOTE_MAP[e.key.toLowerCase()];
      if (note !== undefined && !e.repeat && !heldNotes.has(note)) {
        e.preventDefault();
        heldNotes.add(note);
        initAudio();
        engineRef.current.modules.forEach((mod) => {
          if (mod.type === "Keyboard" && mod.playNote) mod.playNote(note);
        });
      }
    };
    const up = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === " ") {
        setKeyHeld(false);
        engineRef.current.releaseEnvelopes();
        return;
      }
      const note = KEY_NOTE_MAP[e.key.toLowerCase()];
      if (note !== undefined) {
        heldNotes.delete(note);
        engineRef.current.modules.forEach((mod) => {
          if (mod.type === "Keyboard" && mod.releaseNote) mod.releaseNote(note);
        });
      }
    };
    // Stuck-notes panic: when the window loses focus or the tab is hidden
    // (Alt-Tab, screen lock), keyup events can be lost — leaving notes/gates
    // held forever. Release everything and clear local held state.
    const panic = () => {
      heldNotes.forEach((note) => {
        engineRef.current.modules.forEach((mod) => {
          if (mod.type === "Keyboard" && mod.releaseNote) mod.releaseNote(note);
        });
      });
      heldNotes.clear();
      setKeyHeld(false);
      engineRef.current.releaseEnvelopes();
    };
    const onVisibility = () => { if (document.hidden) panic(); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", panic);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", panic);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [keyHeld, initAudio, handleParamChange, cableDrag]);

  // Sequencer step animation: poll at ~15fps to update step LEDs. The effect
  // depends on the derived boolean, not the modules array: with [modules] as
  // the dependency, every drag mousemove tore down and recreated the interval,
  // so the 66ms timer never fired during a sustained drag. Memoized modules
  // no longer repaint incidentally on every mousemove, so the tick must stay
  // alive on its own for LEDs to keep stepping mid-drag.
  const [seqFrame, setSeqFrame] = useState(0);
  const hasSeq = useMemo(() => modules.some((m) => SEQ_TYPES.has(m.type)), [modules]);
  useEffect(() => {
    if (!hasSeq) return;
    const id = setInterval(() => setSeqFrame(f => f + 1), 66);
    return () => clearInterval(id);
  }, [hasSeq]);

  // Per-module connected-port sets, one Set per patched module. ModuleNode
  // receives its own Set (or the shared empty one), so its memo only sees a
  // prop change when the connection list itself changes.
  const connectedPortsByModule = useMemo(() => {
    const map = new Map();
    connections.forEach((c) => {
      let from = map.get(c.fromId);
      if (!from) map.set(c.fromId, (from = new Set()));
      from.add(`out:${c.fromPort}`);
      let to = map.get(c.toId);
      if (!to) map.set(c.toId, (to = new Set()));
      to.add(`in:${c.toPort}`);
    });
    return map;
  }, [connections]);

  // Sidebar palette: ~250 elements that only depend on static defs and the
  // stable addModule handler — without this, every drag mousemove rebuilt it.
  const paletteElements = useMemo(() => (
    CATEGORIES.map((cat) => (
      <div key={cat.key} style={{ marginBottom: 4 }}>
        <div
          style={{
            fontSize: 17,
            color: "#555",
            textTransform: "uppercase",
            letterSpacing: 2,
            padding: "4px 12px",
          }}
        >
          {cat.label}
        </div>
        {cat.modules.map((type) => {
          const d = MODULE_DEFS[type];
          return (
            <div
              key={type}
              draggable
              onClick={() => addModule(type)}
              onDragStart={(e) => {
                e.dataTransfer.setData("application/x-bored-modular", type);
                e.dataTransfer.effectAllowed = "copy";
                const chip = e.currentTarget.querySelector("[data-drag-chip]");
                if (chip) e.dataTransfer.setDragImage(chip, 0, 0);
              }}
              style={{
                padding: "6px 12px",
                cursor: "grab",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1e1e22")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div
                data-drag-chip
                style={{
                  position: "absolute",
                  top: -9999,
                  left: -9999,
                  padding: "4px 8px",
                  background: "#1e1e22",
                  border: "1px solid #333",
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 15,
                  color: "#ddd",
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                {d.label}
              </div>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: d.color,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 17, color: "#bbb" }}>{d.label}</div>
                <div style={{ fontSize: 13, color: "#888" }}>{d.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    ))
  ), [addModule]);

  // Port hit overlay: geometry tracks module positions/types, so this only
  // needs to recompute when modules changes — not on pan, tick, or key state.
  const portHitOverlay = useMemo(() => (
    modules.map((m) => {
      const def = MODULE_DEFS[m.type];
      const allInputs = [...(def.inputs || []), ...(def.modInputs || [])];
      const allOutputs = def.outputs || [];
      return (
        <g key={`ports-${m.id}`}>
          {allOutputs.map((port) => {
            const pos = getPortPosition(m, port, true);
            return (
              <rect
                key={`oh-${port}`}
                x={pos.x - PORT_HIT_SIZE} y={pos.y - PORT_HIT_SIZE}
                width={PORT_HIT_SIZE * 2} height={PORT_HIT_SIZE * 2}
                fill="transparent"
                data-port="1"
                style={{ cursor: "pointer" }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); handlePortDragStart(e, m.id, port, true); }}
                onMouseUp={(e) => { e.stopPropagation(); handlePortDragEnd(e, m.id, port, true); }}
              />
            );
          })}
          {allInputs.map((port) => {
            const pos = getPortPosition(m, port, false);
            return (
              <circle
                key={`ih-${port}`}
                cx={pos.x} cy={pos.y} r={PORT_HIT_SIZE}
                fill="transparent"
                data-port="1"
                style={{ cursor: "pointer" }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); handlePortDragStart(e, m.id, port, false); }}
                onMouseUp={(e) => { e.stopPropagation(); handlePortDragEnd(e, m.id, port, false); }}
              />
            );
          })}
        </g>
      );
    })
  ), [modules, handlePortDragStart, handlePortDragEnd]);

  // Render cables. panOffset is not a dependency: cables live inside the
  // panned <g>, so their geometry is pan-independent.
  const cableElements = useMemo(() => {
    const byId = new Map(modules.map((m) => [m.id, m]));
    // Key by connection tuple so removing one cable doesn't re-key the rest
    // (index keys churn the whole list). connect() accepts duplicate tuples,
    // so a seen-count suffix keeps keys unique in that degenerate case.
    const seenTuples = new Map();
    return connections.map((c, idx) => {
      const fromMod = byId.get(c.fromId);
      const toMod = byId.get(c.toId);
      if (!fromMod || !toMod) return null;
      const p1 = getPortPosition(fromMod, c.fromPort, true);
      const p2 = getPortPosition(toMod, c.toPort, false);
      const tuple = `${c.fromId}:${c.fromPort}->${c.toId}:${c.toPort}`;
      const n = (seenTuples.get(tuple) || 0) + 1;
      seenTuples.set(tuple, n);
      return (
        <g key={n === 1 ? tuple : `${tuple}#${n}`} onDoubleClick={() => removeCable(idx)} style={{ cursor: "pointer" }} pointerEvents="visibleStroke">
          <CableSVG
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            color={c.color}
          />
        </g>
      );
    });
  }, [connections, modules, removeCable]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0e0e10",
        display: "flex",
        fontFamily: "'Pixel Operator', 'DM Mono', monospace",
        color: "#ccc",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <SafariAdvisoryBanner />

      {/* Sidebar */}
      <div
        style={{
          width: 220,
          background: "#141416",
          borderRight: "1px solid #222",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "14px 12px 8px",
            borderBottom: "1px solid #222",
          }}
        >
          <div style={{ fontSize: 17, letterSpacing: 3, color: "#666", textTransform: "uppercase" }}>bored</div>
          <div style={{ fontSize: 25, fontWeight: 500, color: "#e33", letterSpacing: 1 }}>modular</div>
          <div style={{ fontSize: 15, color: "#555", marginTop: 2 }}>v0.1</div>
        </div>

        {/* Module palette */}
        <div style={{ padding: "8px 0", flex: 1 }}>
          {paletteElements}
        </div>

        {/* Patches */}
        <div style={{ padding: "8px 10px", borderTop: "1px solid #222" }}>
          <div style={{ fontSize: 17, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
            Patches
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {[
              { label: "Save", action: savePatch },
              { label: "Load", action: loadPatch },
              { label: "Export", action: exportPatch },
              { label: "Import", action: () => fileInputRef.current?.click() },
            ].map((btn) => (
              <div
                key={btn.label}
                onClick={btn.action}
                style={{
                  padding: "5px 0",
                  textAlign: "center",
                  background: "#222",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 15,
                  color: "#999",
                  border: "1px solid #333",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#2a2a2e"; e.currentTarget.style.color = "#ddd"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#222"; e.currentTarget.style.color = "#999"; }}
              >
                {btn.label}
              </div>
            ))}
          </div>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={importPatch} />
          {patchMsg && (
            <div style={{ fontSize: 15, color: "#6c6", textAlign: "center", marginTop: 4 }}>{patchMsg}</div>
          )}
        </div>

        {/* Scope & controls */}
        <div style={{ padding: "8px 10px 12px", borderTop: "1px solid #222" }}>
          <div style={{ fontSize: 17, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
            Scope
          </div>
          <Scope engine={engineRef} />
          <div style={{ marginTop: 8 }}>
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                initAudio();
                setKeyHeld(true);
                engineRef.current.triggerEnvelopes();
              }}
              onMouseUp={() => {
                setKeyHeld(false);
                engineRef.current.releaseEnvelopes();
              }}
              onMouseLeave={() => {
                if (keyHeld) {
                  setKeyHeld(false);
                  engineRef.current.releaseEnvelopes();
                }
              }}
              style={{
                padding: "8px 0",
                textAlign: "center",
                background: keyHeld ? "#e33" : "#222",
                color: keyHeld ? "#fff" : "#888",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 15,
                transition: "all 0.1s",
                border: "1px solid #333",
              }}
            >
              {keyHeld ? "▶ GATE ON" : "GATE (Space / Click)"}
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 15, color: "#444", lineHeight: 1.5 }}>
            Drag from output (red) to input (blue/yellow) to patch.
            <br />
            Double-click cable to remove.
            <br />
            Shift+drag slider for fine control.
            <br />
            Double-click value to type exact number.
            <br />
            Shift+drag canvas to pan.
            <br />
            Z / X to shift Keyboard octave.
          </div>
        </div>
      </div>

      {/* Canvas */}
      <svg
        ref={svgRef}
        style={{ flex: 1, cursor: isPanning ? "grabbing" : "default", userSelect: "none" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleSvgMouseDown}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
        onDrop={handleSidebarDrop}
      >
        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" x={panOffset.x % 40} y={panOffset.y % 40}>
            <circle cx="20" cy="20" r="0.8" fill="#1a1a1e" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
          {/* Modules (rendered first, behind cables) */}
          {modules.map((m) => (
            <ModuleNode
              key={m.id}
              moduleState={m}
              engine={engineRef}
              connectedPorts={connectedPortsByModule.get(m.id) || EMPTY_PORT_SET}
              onDragStart={handleDragStart}
              onPortDragStart={handlePortDragStart}
              onPortDragEnd={handlePortDragEnd}
              onParamChange={handleParamChange}
              onMuteToggle={handleMuteToggle}
              onRemove={removeModule}
              seqFrame={SEQ_TYPES.has(m.type) ? seqFrame : 0}
            />
          ))}

          {/* Cables (rendered after modules, so they appear in front) */}
          <g pointerEvents="none">
            {cableElements}
          </g>

          {/* Dragging cable */}
          <CableDragPreview cableDrag={cableDrag} mousePosRef={mousePosRef} panOffset={panOffset} />


          {/* Port hit overlay — rendered last so ports are always interactive on top of cables */}
          {portHitOverlay}
        </g>

        {/* Empty state */}
        {modules.length === 0 && (
          <text x="50%" y="50%" textAnchor="middle" fill="#333" fontSize={17} fontFamily="'Pixel Operator', 'DM Mono', monospace">
            Click a module in the sidebar to begin patching
          </text>
        )}
      </svg>
    </div>
  );
}
