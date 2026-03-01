import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import AudioEngine from "./AudioEngine";
import { MODULE_DEFS, CATEGORIES } from "./moduleDefs";

// ─── Helpers ────────────────────────────────────────────────────────────────

let _idCounter = 0;
const genId = () => `mod_${++_idCounter}`;

const PORT_SIZE = 10;
const MODULE_WIDTH = 170;

function getPortPosition(moduleState, portName, isOutput) {
  const def = MODULE_DEFS[moduleState.type];
  const allInputs = [...(def.inputs || []), ...(def.modInputs || [])];
  const allOutputs = def.outputs || [];
  const list = isOutput ? allOutputs : allInputs;
  const idx = list.indexOf(portName);
  if (idx === -1) return { x: 0, y: 0 };

  const headerH = 32;
  const paramsH = Object.keys(moduleState.params || {}).length * 32 + 8;
  const customH = def.hasCustomUI ? 55 : 0;
  const baseY = headerH + paramsH + customH + 12;

  if (isOutput) {
    const spacing = MODULE_WIDTH / (allOutputs.length + 1);
    return { x: moduleState.x + spacing * (idx + 1), y: moduleState.y + baseY + 8 };
  } else {
    const spacing = MODULE_WIDTH / (allInputs.length + 1);
    return { x: moduleState.x + spacing * (idx + 1), y: moduleState.y + baseY + 34 };
  }
}

function getModuleHeight(type, params) {
  const def = MODULE_DEFS[type];
  const headerH = 32;
  const paramCount = Object.keys(params || {}).length;
  const paramsH = paramCount * 32 + 8;
  const allInputs = [...(def.inputs || []), ...(def.modInputs || [])];
  const hasPorts = allInputs.length > 0 || (def.outputs || []).length > 0;
  const portsH = hasPorts ? 60 : 10;
  const customH = def.hasCustomUI ? 55 : 0;
  return headerH + paramsH + customH + portsH;
}

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

function Scope({ engine }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const draw = () => {
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

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [engine]);

  return <canvas ref={canvasRef} width={280} height={90} style={{ borderRadius: 4, border: "1px solid #1a2a1a" }} />;
}

function SvgSlider({ x, y, width, min, max, value, onChange, color }) {
  const range = max - min;
  const pct = Math.max(0, Math.min(1, (value - min) / range));
  const trackH = 5;
  const thumbR = 5;

  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const track = e.currentTarget.querySelector(".slider-track");
    const ctm = track.getScreenCTM();
    if (!ctm) return;

    const roundVal = (val) => {
      if (range > 100) return Math.round(val);
      if (range > 10) return Math.round(val * 10) / 10;
      return Math.round(val * 1000) / 1000;
    };

    // Set initial value from click position
    const localX0 = (e.clientX - ctm.e) / ctm.a;
    const ratio0 = Math.max(0, Math.min(1, (localX0 - x) / width));
    const startValue = roundVal(Math.max(min, Math.min(max, min + ratio0 * range)));
    onChange(startValue);

    const startClientX = e.clientX;

    const move = (me) => {
      const fine = me.shiftKey ? 0.2 : 1;
      const deltaX = (me.clientX - startClientX) / ctm.a;
      const deltaRatio = (deltaX / width) * fine;
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
    <g onMouseDown={handleMouseDown} style={{ cursor: "pointer" }}>
      <rect className="slider-track" x={x} y={y} width={width} height={trackH} rx={2.5} fill="#333" />
      <rect x={x} y={y} width={Math.max(0, pct * width)} height={trackH} rx={2.5} fill={color} opacity={0.6} />
      <circle cx={x + pct * width} cy={y + trackH / 2} r={thumbR} fill={color} stroke="#1a1a1e" strokeWidth={1.5} />
      <rect x={x - 2} y={y - 6} width={width + 4} height={trackH + 12} fill="transparent" />
    </g>
  );
}

function Port({ x, y, name, isOutput, isMod, onMouseDown, onMouseUp, isConnected }) {
  const color = isOutput ? "#f44" : isMod ? "#fc0" : "#4cf";
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={PORT_SIZE}
        fill={isConnected ? color : "#111"}
        stroke={color}
        strokeWidth={2}
        style={{ cursor: "pointer", filter: isConnected ? `drop-shadow(0 0 4px ${color})` : "none" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          onMouseUp(e);
        }}
      />
      <text
        x={x}
        y={y - 14}
        textAnchor="middle"
        fill="#889"
        fontSize={9}
        fontFamily="'DM Mono', monospace"
        pointerEvents="none"
      >
        {name}
      </text>
    </g>
  );
}

function ModuleNode({
  moduleState,
  engine,
  onDragStart,
  onPortDragStart,
  onPortDragEnd,
  connections,
  onParamChange,
  onRemove,
}) {
  const [editingParam, setEditingParam] = useState(null);
  const def = MODULE_DEFS[moduleState.type];
  const params = moduleState.params || {};
  const allInputs = [...(def.inputs || []), ...(def.modInputs || [])];
  const allOutputs = def.outputs || [];
  const height = getModuleHeight(moduleState.type, params);

  const headerH = 32;
  const paramsStartY = headerH;

  const connectedPorts = new Set();
  connections.forEach((c) => {
    if (c.fromId === moduleState.id) connectedPorts.add(`out:${c.fromPort}`);
    if (c.toId === moduleState.id) connectedPorts.add(`in:${c.toPort}`);
  });

  return (
    <g
      transform={`translate(${moduleState.x}, ${moduleState.y})`}
      onMouseDown={(e) => {
        if (e.target.tagName === "circle" || e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
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
        fill="#1a1a1e"
        stroke={def.color}
        strokeWidth={1.5}
      />
      {/* Header bar */}
      <rect x={0} y={0} width={MODULE_WIDTH} height={headerH} rx={6} fill={def.color} opacity={0.85} />
      <rect x={0} y={headerH - 6} width={MODULE_WIDTH} height={6} fill={def.color} opacity={0.85} />
      {/* Label */}
      <text x={10} y={21} fill="#fff" fontSize={13} fontWeight={700} fontFamily="'DM Mono', monospace">
        {def.label}
      </text>
      {/* Close */}
      <text
        x={MODULE_WIDTH - 16}
        y={21}
        fill="rgba(255,255,255,0.6)"
        fontSize={14}
        fontWeight={700}
        fontFamily="monospace"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(moduleState.id);
        }}
      >
        ×
      </text>

      {/* Params */}
      {Object.entries(params).map(([key, p], i) => {
        const py = paramsStartY + 6 + i * 32;
        if (p.options) {
          return (
            <g key={key}>
              <text x={8} y={py + 14} fill="#99a" fontSize={10} fontFamily="'DM Mono', monospace">
                {p.label || key}
              </text>
              <foreignObject x={60} y={py} width={102} height={24}>
                <select
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#111",
                    color: "#ddd",
                    border: `1px solid ${def.color}44`,
                    borderRadius: 3,
                    fontSize: 10,
                    fontFamily: "'DM Mono', monospace",
                    padding: "0 4px",
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
        const range = p.max - p.min;
        return (
          <g key={key}>
            <text x={8} y={py + 14} fill="#99a" fontSize={10} fontFamily="'DM Mono', monospace">
              {p.label || key}
            </text>
            <SvgSlider
              x={56}
              y={py + 5}
              width={78}
              min={p.min}
              max={p.max}
              value={p.value}
              onChange={(v) => onParamChange(moduleState.id, key, v)}
              color={def.color}
            />
            {editingParam === key ? (
              <foreignObject x={100} y={py} width={62} height={20}>
                <input
                  type="text"
                  defaultValue={p.value < 10 ? p.value.toFixed(2) : p.value < 100 ? p.value.toFixed(1) : Math.round(p.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#111",
                    color: "#fff",
                    border: `1px solid ${def.color}`,
                    borderRadius: 2,
                    fontSize: 10,
                    fontFamily: "'DM Mono', monospace",
                    padding: "0 3px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) onParamChange(moduleState.id, key, Math.max(p.min, Math.min(p.max, v)));
                      setEditingParam(null);
                    } else if (e.key === "Escape") {
                      setEditingParam(null);
                    }
                  }}
                  onBlur={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) onParamChange(moduleState.id, key, Math.max(p.min, Math.min(p.max, v)));
                    setEditingParam(null);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </foreignObject>
            ) : (
              <text
                x={138}
                y={py + 14}
                fill="#aab"
                fontSize={9}
                fontFamily="'DM Mono', monospace"
                textAnchor="end"
                style={{ cursor: "text" }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingParam(key);
                }}
              >
                {p.value < 10 ? p.value.toFixed(2) : p.value < 100 ? p.value.toFixed(1) : Math.round(p.value)}
              </text>
            )}
          </g>
        );
      })}

      {/* Keyboard custom UI */}
      {moduleState.type === "Keyboard" && (() => {
        const kbY = paramsStartY + Object.keys(params).length * 32 + 12;
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

      {/* Input ports */}
      {allInputs.map((port, i) => {
        const worldPos = getPortPosition(moduleState, port, false);
        const px = worldPos.x - moduleState.x;
        const py = worldPos.y - moduleState.y;
        const isMod = (def.modInputs || []).includes(port);
        return (
          <Port
            key={`in-${port}`}
            x={px}
            y={py}
            name={port}
            isOutput={false}
            isMod={isMod}
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
        return (
          <Port
            key={`out-${port}`}
            x={px}
            y={py}
            name={port}
            isOutput={true}
            isMod={false}
            isConnected={connectedPorts.has(`out:${port}`)}
            onMouseDown={(e) => onPortDragStart(e, moduleState.id, port, true)}
            onMouseUp={(e) => onPortDragEnd(e, moduleState.id, port, true)}
          />
        );
      })}

    </g>
  );
}

function CableSVG({ x1, y1, x2, y2, color }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const sag = Math.min(dist * 0.3, 80);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 + sag;
  const cp1x = x1 + dx * 0.25;
  const cp1y = y1 + dy * 0.25 + sag;
  const cp2x = x1 + dx * 0.75;
  const cp2y = y1 + dy * 0.75 + sag;

  return (
    <g>
      <path
        d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`}
        stroke={color || "#f55"}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color || "#f55"})` }}
      />
    </g>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

export default function NordModularEmulator() {
  const engineRef = useRef(new AudioEngine());
  const svgRef = useRef(null);
  const [modules, setModules] = useState([]);
  const [connections, setConnections] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [cableDrag, setCableDrag] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [audioStarted, setAudioStarted] = useState(false);
  const [keyHeld, setKeyHeld] = useState(false);

  const initAudio = useCallback(() => {
    if (!audioStarted) {
      engineRef.current.init();
      setAudioStarted(true);
    }
  }, [audioStarted]);

  const addModule = useCallback(
    (type) => {
      initAudio();
      const id = genId();
      const eng = engineRef.current;
      const audioMod = eng.createModule(id, type);
      if (!audioMod) return;

      const params = {};
      Object.entries(audioMod.params).forEach(([k, v]) => {
        params[k] = { ...v };
      });

      const candidateX = 80 + Math.random() * 200 - panOffset.x;
      const candidateY = 80 + Math.random() * 150 - panOffset.y;
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
    [initAudio, panOffset]
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

  const fileInputRef = useRef(null);
  const [patchMsg, setPatchMsg] = useState(null);

  const clearPatch = useCallback(() => {
    modules.forEach((m) => engineRef.current.removeModule(m.id));
    setModules([]);
    setConnections([]);
  }, [modules]);

  const loadPatchData = useCallback(
    (patch) => {
      // Clear existing
      modules.forEach((m) => engineRef.current.removeModule(m.id));
      initAudio();
      // Rebuild modules
      patch.modules.forEach((m) => {
        engineRef.current.createModule(m.id, m.type);
        Object.entries(m.params).forEach(([k, v]) => {
          engineRef.current.setParam(m.id, k, v.value != null ? v.value : v);
        });
      });
      // Update _idCounter
      const maxId = Math.max(...patch.modules.map((m) => parseInt(m.id.split("_")[1]) || 0), 0);
      if (maxId >= _idCounter) _idCounter = maxId;
      // Reconnect
      patch.connections.forEach((c) => {
        engineRef.current.connect(c.fromId, c.fromPort, c.toId, c.toPort);
      });
      setModules(patch.modules);
      setConnections(patch.connections);
    },
    [modules, initAudio]
  );

  const savePatch = useCallback(() => {
    const patch = JSON.stringify({ modules, connections });
    localStorage.setItem("bored-patch-1", patch);
    setPatchMsg("Saved!");
    setTimeout(() => setPatchMsg(null), 1500);
  }, [modules, connections]);

  const loadPatch = useCallback(() => {
    const raw = localStorage.getItem("bored-patch-1");
    if (!raw) {
      setPatchMsg("No saved patch");
      setTimeout(() => setPatchMsg(null), 1500);
      return;
    }
    try {
      loadPatchData(JSON.parse(raw));
      setPatchMsg("Loaded!");
      setTimeout(() => setPatchMsg(null), 1500);
    } catch (e) {
      console.error("Load error:", e);
    }
  }, [loadPatchData]);

  const exportPatch = useCallback(() => {
    const blob = new Blob([JSON.stringify({ modules, connections }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bored-patch.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [modules, connections]);

  const importPatch = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          loadPatchData(JSON.parse(ev.target.result));
          setPatchMsg("Imported!");
          setTimeout(() => setPatchMsg(null), 1500);
        } catch (err) {
          console.error("Import error:", err);
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
      const mod = modules.find((m) => m.id === id);
      if (!mod) return;
      setDragging({
        id,
        offsetX: (e.clientX - rect.left) / 1 - panOffset.x - mod.x,
        offsetY: (e.clientY - rect.top) / 1 - panOffset.y - mod.y,
      });
    },
    [modules, panOffset]
  );

  const handlePortDragStart = useCallback(
    (e, moduleId, portName, isOutput) => {
      initAudio();
      const mod = modules.find((m) => m.id === moduleId);
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
    [modules, initAudio, panOffset]
  );

  const handlePortDragEnd = useCallback(
    (e, moduleId, portName, isOutput) => {
      if (!cableDrag) return;
      // Normalize: one side must be output, the other input
      let outId, outPort, inId, inPort;
      if (cableDrag.isOutput && !isOutput) {
        // Dragged from output to input (normal)
        outId = cableDrag.fromId; outPort = cableDrag.fromPort;
        inId = moduleId; inPort = portName;
      } else if (!cableDrag.isOutput && isOutput) {
        // Dragged from input to output (reverse)
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
            color: `hsl(${Math.random() * 360}, 70%, 55%)`,
          },
        ]);
      }
      setCableDrag(null);
    },
    [cableDrag]
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

  // Mouse move
  const handleMouseMove = useCallback(
    (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setMousePos({ x: mx, y: my });

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
    setDragging(null);
    setCableDrag(null);
    setIsPanning(false);
  }, []);

  const handleSvgMouseDown = useCallback(
    (e) => {
      if (e.target === svgRef.current || e.target.tagName === "rect") {
        if (e.button === 0 && (e.shiftKey || e.altKey)) {
          setIsPanning(true);
          panStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
        }
      }
    },
    [panOffset]
  );

  // Keyboard trigger + musical keyboard
  useEffect(() => {
    const heldNotes = new Set();
    const down = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === " " && !keyHeld) {
        e.preventDefault();
        setKeyHeld(true);
        initAudio();
        engineRef.current.triggerEnvelopes();
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
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [keyHeld, initAudio]);

  // Render cables
  const cableElements = useMemo(() => {
    return connections.map((c, idx) => {
      const fromMod = modules.find((m) => m.id === c.fromId);
      const toMod = modules.find((m) => m.id === c.toId);
      if (!fromMod || !toMod) return null;
      const p1 = getPortPosition(fromMod, c.fromPort, true);
      const p2 = getPortPosition(toMod, c.toPort, false);
      return (
        <g key={idx} onDoubleClick={() => removeCable(idx)} style={{ cursor: "pointer" }} pointerEvents="visibleStroke">
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
  }, [connections, modules, panOffset, removeCable]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0e0e10",
        display: "flex",
        fontFamily: "'DM Mono', monospace",
        color: "#ccc",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <div
        style={{
          width: 200,
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
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#666", textTransform: "uppercase" }}>bored</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "#e33", letterSpacing: 1 }}>modular</div>
          <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>v0.1</div>
        </div>

        {/* Module palette */}
        <div style={{ padding: "8px 0", flex: 1 }}>
          {CATEGORIES.map((cat) => (
            <div key={cat.key} style={{ marginBottom: 4 }}>
              <div
                style={{
                  fontSize: 9,
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
                    onClick={() => addModule(type)}
                    style={{
                      padding: "6px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1e1e22")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
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
                      <div style={{ fontSize: 12, color: "#bbb" }}>{d.label}</div>
                      <div style={{ fontSize: 9, color: "#555" }}>{d.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Patches */}
        <div style={{ padding: "8px 10px", borderTop: "1px solid #222" }}>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
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
                  fontSize: 10,
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
            <div style={{ fontSize: 10, color: "#6c6", textAlign: "center", marginTop: 4 }}>{patchMsg}</div>
          )}
        </div>

        {/* Scope & controls */}
        <div style={{ padding: "8px 10px 12px", borderTop: "1px solid #222" }}>
          <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
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
                fontSize: 11,
                transition: "all 0.1s",
                border: "1px solid #333",
              }}
            >
              {keyHeld ? "▶ GATE ON" : "GATE (Space / Click)"}
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 9, color: "#444", lineHeight: 1.5 }}>
            Drag from output (red) to input (blue/yellow) to patch.
            <br />
            Double-click cable to remove.
            <br />
            Shift+drag slider for fine control.
            <br />
            Double-click value to type exact number.
            <br />
            Shift+drag canvas to pan.
          </div>
        </div>
      </div>

      {/* Canvas */}
      <svg
        ref={svgRef}
        style={{ flex: 1, cursor: isPanning ? "grabbing" : "default" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleSvgMouseDown}
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
              connections={connections}
              onDragStart={handleDragStart}
              onPortDragStart={handlePortDragStart}
              onPortDragEnd={handlePortDragEnd}
              onParamChange={handleParamChange}
              onRemove={removeModule}
            />
          ))}

          {/* Cables (rendered after modules, so they appear in front) */}
          <g pointerEvents="none">
            {cableElements}
          </g>

          {/* Dragging cable */}
          {cableDrag && (
            <g pointerEvents="none">
              <CableSVG x1={cableDrag.startX} y1={cableDrag.startY} x2={mousePos.x - panOffset.x} y2={mousePos.y - panOffset.y} color="#fff" />
            </g>
          )}

          {/* Port hit overlay — rendered last so ports are always interactive on top of cables */}
          {modules.map((m) => {
            const def = MODULE_DEFS[m.type];
            const allInputs = [...(def.inputs || []), ...(def.modInputs || [])];
            const allOutputs = def.outputs || [];
            return (
              <g key={`ports-${m.id}`}>
                {allOutputs.map((port) => {
                  const pos = getPortPosition(m, port, true);
                  return (
                    <circle
                      key={`oh-${port}`}
                      cx={pos.x} cy={pos.y} r={PORT_SIZE}
                      fill="transparent"
                      style={{ cursor: "pointer" }}
                      onMouseDown={(e) => { e.stopPropagation(); handlePortDragStart(e, m.id, port, true); }}
                      onMouseUp={(e) => { e.stopPropagation(); handlePortDragEnd(e, m.id, port, true); }}
                    />
                  );
                })}
                {allInputs.map((port) => {
                  const pos = getPortPosition(m, port, false);
                  return (
                    <circle
                      key={`ih-${port}`}
                      cx={pos.x} cy={pos.y} r={PORT_SIZE}
                      fill="transparent"
                      style={{ cursor: "pointer" }}
                      onMouseDown={(e) => { e.stopPropagation(); handlePortDragStart(e, m.id, port, false); }}
                      onMouseUp={(e) => { e.stopPropagation(); handlePortDragEnd(e, m.id, port, false); }}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>

        {/* Empty state */}
        {modules.length === 0 && (
          <text x="50%" y="50%" textAnchor="middle" fill="#333" fontSize={14} fontFamily="'DM Mono', monospace">
            Click a module in the sidebar to begin patching
          </text>
        )}
      </svg>
    </div>
  );
}
