import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─── Audio Engine ───────────────────────────────────────────────────────────
// Web Audio API based modular synthesis engine inspired by the Nord Modular G2

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.modules = new Map();
    this.connections = [];
    this.masterGain = null;
    this.analyser = null;
    this.scopeData = new Float32Array(256);
    this.isRunning = false;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.isRunning = true;
  }

  createModule(id, type) {
    if (!this.ctx) this.init();
    let mod;
    switch (type) {
      case "OscB":
        mod = this._createOscB(id);
        break;
      case "OscC":
        mod = this._createOscC(id);
        break;
      case "Filter":
        mod = this._createFilter(id);
        break;
      case "Envelope":
        mod = this._createEnvelope(id);
        break;
      case "LFO":
        mod = this._createLFO(id);
        break;
      case "Amplifier":
        mod = this._createAmplifier(id);
        break;
      case "Mixer2":
        mod = this._createMixer2(id);
        break;
      case "Noise":
        mod = this._createNoise(id);
        break;
      case "Output":
        mod = this._createOutput(id);
        break;
      case "Delay":
        mod = this._createDelay(id);
        break;
      case "Panner":
        mod = this._createPanner(id);
        break;
      case "Chorus":
        mod = this._createChorus(id);
        break;
      default:
        return null;
    }
    this.modules.set(id, mod);
    return mod;
  }

  _createOscB(id) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const fmGain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 220;
    gain.gain.value = 0.8;
    fmGain.gain.value = 0;
    osc.connect(gain);
    fmGain.connect(osc.frequency);
    osc.start();
    return {
      id,
      type: "OscB",
      node: osc,
      outputNode: gain,
      outputs: { Out: gain },
      inputs: { PitchMod: osc.frequency, FmMod: fmGain },
      _nodes: [osc, gain, fmGain],
      params: {
        frequency: { value: 220, min: 20, max: 8000, audioParam: osc.frequency, label: "Freq" },
        waveform: { value: "sawtooth", options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" },
        fmDepth: { value: 0, min: 0, max: 1000, audioParam: fmGain.gain, label: "FM Depth" },
        level: { value: 0.8, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createOscC(id) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 330;
    gain.gain.value = 0.6;
    osc.connect(gain);
    osc.start();
    return {
      id,
      type: "OscC",
      node: osc,
      outputNode: gain,
      outputs: { Out: gain },
      inputs: { PitchMod: osc.frequency },
      _nodes: [osc, gain],
      params: {
        frequency: { value: 330, min: 20, max: 8000, audioParam: osc.frequency, label: "Freq" },
        waveform: { value: "square", options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" },
        pulseWidth: { value: 0.5, min: 0, max: 1, label: "PW" },
        level: { value: 0.6, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createFilter(id) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    filter.Q.value = 4;
    return {
      id,
      type: "Filter",
      node: filter,
      outputNode: filter,
      outputs: { Out: filter },
      inputs: { In: filter, FreqMod: filter.frequency, ResMod: filter.Q },
      _nodes: [filter],
      params: {
        frequency: { value: 1200, min: 20, max: 15000, audioParam: filter.frequency, label: "Freq" },
        resonance: { value: 4, min: 0.1, max: 30, audioParam: filter.Q, label: "Res" },
        filterType: { value: "lowpass", options: ["lowpass", "highpass", "bandpass", "notch"], label: "Type" },
      },
    };
  }

  _createEnvelope(id) {
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    const env = {
      id,
      type: "Envelope",
      node: gain,
      outputNode: gain,
      outputs: { Out: gain },
      inputs: { In: gain },
      _nodes: [gain],
      params: {
        attack: { value: 0.01, min: 0.001, max: 4, label: "Atk" },
        decay: { value: 0.2, min: 0.001, max: 4, label: "Dec" },
        sustain: { value: 0.6, min: 0, max: 1, label: "Sus" },
        release: { value: 0.5, min: 0.001, max: 8, label: "Rel" },
      },
      trigger: () => {
        const now = this.ctx.currentTime;
        const a = env.params.attack.value;
        const d = env.params.decay.value;
        const s = env.params.sustain.value;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + a);
        gain.gain.linearRampToValueAtTime(s, now + a + d);
      },
      releaseEnv: () => {
        const now = this.ctx.currentTime;
        const r = env.params.release.value;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + r);
      },
    };
    return env;
  }

  _createLFO(id) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 2;
    gain.gain.value = 100;
    osc.connect(gain);
    osc.start();
    return {
      id,
      type: "LFO",
      node: osc,
      outputNode: gain,
      outputs: { Out: gain },
      inputs: {},
      _nodes: [osc, gain],
      params: {
        rate: { value: 2, min: 0.05, max: 40, audioParam: osc.frequency, label: "Rate" },
        amount: { value: 100, min: 0, max: 2000, audioParam: gain.gain, label: "Amt" },
        waveform: { value: "sine", options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" },
      },
    };
  }

  _createAmplifier(id) {
    const gain = this.ctx.createGain();
    gain.gain.value = 0.8;
    return {
      id,
      type: "Amplifier",
      node: gain,
      outputNode: gain,
      outputs: { Out: gain },
      inputs: { In: gain, GainMod: gain.gain },
      _nodes: [gain],
      params: {
        level: { value: 0.8, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createMixer2(id) {
    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    const merger = this.ctx.createGain();
    gain1.gain.value = 0.5;
    gain2.gain.value = 0.5;
    gain1.connect(merger);
    gain2.connect(merger);
    return {
      id,
      type: "Mixer2",
      node: merger,
      outputNode: merger,
      outputs: { Out: merger },
      inputs: { In1: gain1, In2: gain2 },
      _nodes: [gain1, gain2, merger],
      params: {
        level1: { value: 0.5, min: 0, max: 1, audioParam: gain1.gain, label: "Lvl 1" },
        level2: { value: 0.5, min: 0, max: 1, audioParam: gain2.gain, label: "Lvl 2" },
      },
    };
  }

  _createNoise(id) {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.3;
    source.connect(gain);
    source.start();
    return {
      id,
      type: "Noise",
      node: source,
      outputNode: gain,
      outputs: { Out: gain },
      inputs: {},
      _nodes: [source, gain],
      params: {
        level: { value: 0.3, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
        color: { value: "white", options: ["white", "pink"], label: "Color" },
      },
    };
  }

  _createOutput(id) {
    const gain = this.ctx.createGain();
    gain.gain.value = 0.5;
    gain.connect(this.masterGain);
    return {
      id,
      type: "Output",
      node: gain,
      outputNode: null,
      outputs: {},
      inputs: { InL: gain, InR: gain },
      _nodes: [gain],
      params: {
        level: { value: 0.5, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createDelay(id) {
    const input = this.ctx.createGain();
    const delay = this.ctx.createDelay(2.0);
    const feedback = this.ctx.createGain();
    const output = this.ctx.createGain();
    delay.delayTime.value = 0.35;
    feedback.gain.value = 0.4;
    output.gain.value = 0.6;
    input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    input.connect(output);
    delay.connect(output);
    return {
      id,
      type: "Delay",
      node: input,
      outputNode: output,
      outputs: { Out: output },
      inputs: { In: input },
      _nodes: [input, delay, feedback, output],
      params: {
        time: { value: 0.35, min: 0.01, max: 2, audioParam: delay.delayTime, label: "Time" },
        feedback: { value: 0.4, min: 0, max: 0.95, audioParam: feedback.gain, label: "Fdbk" },
        mix: { value: 0.6, min: 0, max: 1, audioParam: output.gain, label: "Mix" },
      },
    };
  }

  _createPanner(id) {
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = 0;
    return {
      id,
      type: "Panner",
      node: panner,
      outputNode: panner,
      outputs: { Out: panner },
      inputs: { In: panner, PanMod: panner.pan },
      _nodes: [panner],
      params: {
        pan: { value: 0, min: -1, max: 1, audioParam: panner.pan, label: "Pan" },
      },
    };
  }

  _createChorus(id) {
    const input = this.ctx.createGain();
    const output = this.ctx.createGain();
    const dry = this.ctx.createGain();
    const wet = this.ctx.createGain();
    dry.gain.value = 0.7;
    wet.gain.value = 0.5;

    // Voice 1
    const delay1 = this.ctx.createDelay(0.05);
    delay1.delayTime.value = 0.015;
    const lfo1 = this.ctx.createOscillator();
    lfo1.type = "sine";
    lfo1.frequency.value = 0.8;
    const lfoGain1 = this.ctx.createGain();
    lfoGain1.gain.value = 0.003;
    lfo1.connect(lfoGain1);
    lfoGain1.connect(delay1.delayTime);
    lfo1.start();

    // Voice 2
    const delay2 = this.ctx.createDelay(0.05);
    delay2.delayTime.value = 0.02;
    const lfo2 = this.ctx.createOscillator();
    lfo2.type = "sine";
    lfo2.frequency.value = 1.1;
    const lfoGain2 = this.ctx.createGain();
    lfoGain2.gain.value = 0.003;
    lfo2.connect(lfoGain2);
    lfoGain2.connect(delay2.delayTime);
    lfo2.start();

    // Routing
    input.connect(dry);
    dry.connect(output);
    input.connect(delay1);
    input.connect(delay2);
    delay1.connect(wet);
    delay2.connect(wet);
    wet.connect(output);

    const mod = {
      id,
      type: "Chorus",
      node: input,
      outputNode: output,
      outputs: { Out: output },
      inputs: { In: input },
      _nodes: [input, output, dry, wet, delay1, delay2, lfo1, lfo2, lfoGain1, lfoGain2],
      _lfo2: lfo2,
      _lfoGain2: lfoGain2,
      params: {
        rate: { value: 0.8, min: 0.1, max: 5, audioParam: lfo1.frequency, label: "Rate" },
        depth: { value: 0.003, min: 0, max: 0.01, audioParam: lfoGain1.gain, label: "Depth" },
        mix: { value: 0.5, min: 0, max: 1, audioParam: wet.gain, label: "Mix" },
      },
    };
    return mod;
  }

  connect(fromId, fromPort, toId, toPort) {
    const fromMod = this.modules.get(fromId);
    const toMod = this.modules.get(toId);
    if (!fromMod || !toMod) return false;
    const outputNode = fromMod.outputs[fromPort];
    const inputNode = toMod.inputs[toPort];
    if (!outputNode || !inputNode) return false;
    try {
      outputNode.connect(inputNode);
      this.connections.push({ fromId, fromPort, toId, toPort });
      return true;
    } catch (e) {
      console.error("Connection error:", e);
      return false;
    }
  }

  disconnect(fromId, fromPort, toId, toPort) {
    const fromMod = this.modules.get(fromId);
    const toMod = this.modules.get(toId);
    if (!fromMod || !toMod) return;
    const outputNode = fromMod.outputs[fromPort];
    const inputNode = toMod.inputs[toPort];
    if (!outputNode || !inputNode) return;
    try {
      outputNode.disconnect(inputNode);
    } catch (e) {
      if (e.name !== "InvalidAccessError") {
        console.error("AudioEngine.disconnect: unexpected error", e);
      }
    }
    this.connections = this.connections.filter(
      (c) => !(c.fromId === fromId && c.fromPort === fromPort && c.toId === toId && c.toPort === toPort)
    );
  }

  removeModule(id) {
    const mod = this.modules.get(id);
    if (!mod) return;
    // Disconnect everything
    const toRemove = this.connections.filter((c) => c.fromId === id || c.toId === id);
    toRemove.forEach((c) => this.disconnect(c.fromId, c.fromPort, c.toId, c.toPort));
    // Stop and disconnect all internal nodes
    const nodes = mod._nodes || [mod.node, mod.outputNode].filter(Boolean);
    nodes.forEach((n) => {
      try { if (n.stop) n.stop(); } catch (e) {}
      try { n.disconnect(); } catch (e) {}
    });
    this.modules.delete(id);
  }

  getScopeData() {
    if (!this.analyser) return new Float32Array(256);
    this.analyser.getFloatTimeDomainData(this.scopeData);
    return this.scopeData;
  }

  setParam(moduleId, paramName, value) {
    const mod = this.modules.get(moduleId);
    if (!mod || !mod.params[paramName]) return;
    mod.params[paramName].value = value;
    if (mod.params[paramName].audioParam) {
      mod.params[paramName].audioParam.setValueAtTime(value, this.ctx.currentTime);
    }
    // Handle Chorus cross-updates
    if (mod.type === "Chorus" && paramName === "rate") {
      mod._lfo2.frequency.setValueAtTime(value * 1.375, this.ctx.currentTime);
    }
    if (mod.type === "Chorus" && paramName === "depth") {
      mod._lfoGain2.gain.setValueAtTime(value, this.ctx.currentTime);
    }
    // Handle waveform changes
    if (paramName === "waveform" || paramName === "filterType") {
      if (mod.node && mod.node.type !== undefined) {
        mod.node.type = value;
      }
    }
  }

  triggerEnvelopes() {
    this.modules.forEach((mod) => {
      if (mod.trigger) mod.trigger();
    });
  }

  releaseEnvelopes() {
    this.modules.forEach((mod) => {
      if (mod.releaseEnv) mod.releaseEnv();
    });
  }
}

// ─── Module Definitions (UI metadata) ───────────────────────────────────────

const MODULE_DEFS = {
  OscB: {
    label: "OscB",
    category: "oscillator",
    color: "#c33",
    inputs: [],
    outputs: ["Out"],
    modInputs: ["PitchMod", "FmMod"],
    description: "Oscillator B - Classic analog waveforms with FM",
  },
  OscC: {
    label: "OscC",
    category: "oscillator",
    color: "#c55",
    inputs: [],
    outputs: ["Out"],
    modInputs: ["PitchMod"],
    description: "Oscillator C - With pulse width",
  },
  Filter: {
    label: "Filter",
    category: "filter",
    color: "#2a7",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: ["FreqMod", "ResMod"],
    description: "Multi-mode filter with resonance",
  },
  Envelope: {
    label: "Env",
    category: "modulator",
    color: "#c80",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: [],
    description: "ADSR Envelope generator",
  },
  LFO: {
    label: "LFO",
    category: "modulator",
    color: "#c60",
    inputs: [],
    outputs: ["Out"],
    modInputs: [],
    description: "Low frequency oscillator for modulation",
  },
  Amplifier: {
    label: "Amp",
    category: "level",
    color: "#66a",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: ["GainMod"],
    description: "Voltage controlled amplifier",
  },
  Mixer2: {
    label: "Mix2",
    category: "level",
    color: "#669",
    inputs: ["In1", "In2"],
    outputs: ["Out"],
    modInputs: [],
    description: "2-channel mixer",
  },
  Noise: {
    label: "Noise",
    category: "oscillator",
    color: "#888",
    inputs: [],
    outputs: ["Out"],
    modInputs: [],
    description: "White/Pink noise generator",
  },
  Delay: {
    label: "Delay",
    category: "effect",
    color: "#4899bb",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: [],
    description: "Delay effect with feedback",
  },
  Panner: {
    label: "Pan",
    category: "level",
    color: "#6a6",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: ["PanMod"],
    description: "Stereo panner",
  },
  Chorus: {
    label: "Chorus",
    category: "effect",
    color: "#48a9bb",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: [],
    description: "Stereo chorus effect",
  },
  Output: {
    label: "Out",
    category: "io",
    color: "#555",
    inputs: ["InL", "InR"],
    outputs: [],
    modInputs: [],
    description: "Master audio output",
  },
};

const CATEGORIES = [
  { key: "oscillator", label: "Oscillators", modules: ["OscB", "OscC", "Noise"] },
  { key: "filter", label: "Filters", modules: ["Filter"] },
  { key: "modulator", label: "Modulators", modules: ["Envelope", "LFO"] },
  { key: "level", label: "Level", modules: ["Amplifier", "Mixer2", "Panner"] },
  { key: "effect", label: "Effects", modules: ["Delay", "Chorus"] },
  { key: "io", label: "I/O", modules: ["Output"] },
];

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
  const baseY = headerH + paramsH + 12;

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
  return headerH + paramsH + portsH;
}

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
            onMouseDown={() => {}}
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
            onMouseUp={() => {}}
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
    localStorage.setItem("nord-patch-1", patch);
    setPatchMsg("Saved!");
    setTimeout(() => setPatchMsg(null), 1500);
  }, [modules, connections]);

  const loadPatch = useCallback(() => {
    const raw = localStorage.getItem("nord-patch-1");
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
    a.download = "nord-patch.json";
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
      // Must connect output -> input
      if (cableDrag.isOutput && !isOutput) {
        const success = engineRef.current.connect(cableDrag.fromId, cableDrag.fromPort, moduleId, portName);
        if (success) {
          setConnections((prev) => [
            ...prev,
            {
              fromId: cableDrag.fromId,
              fromPort: cableDrag.fromPort,
              toId: moduleId,
              toPort: portName,
              color: `hsl(${Math.random() * 360}, 70%, 55%)`,
            },
          ]);
        }
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

  // Keyboard trigger
  useEffect(() => {
    const down = (e) => {
      if (e.key === " " && !keyHeld && e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT") {
        e.preventDefault();
        setKeyHeld(true);
        initAudio();
        engineRef.current.triggerEnvelopes();
      }
    };
    const up = (e) => {
      if (e.key === " " && e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT") {
        setKeyHeld(false);
        engineRef.current.releaseEnvelopes();
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
        <g key={idx} onDoubleClick={() => removeCable(idx)} style={{ cursor: "pointer" }}>
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
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#666", textTransform: "uppercase" }}>Nord</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "#e33", letterSpacing: 1 }}>Modular</div>
          <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>Web Emulator v0.1</div>
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
          {/* Cables */}
          {cableElements}

          {/* Dragging cable */}
          {cableDrag && (
            <CableSVG x1={cableDrag.startX} y1={cableDrag.startY} x2={mousePos.x - panOffset.x} y2={mousePos.y - panOffset.y} color="#fff" />
          )}

          {/* Modules */}
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
