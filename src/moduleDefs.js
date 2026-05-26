// ─── Module Definitions (UI metadata) ───────────────────────────────────────

const MODULE_DEFS = {
  // ── Oscillators ──
  OscA: {
    label: "OscA",
    category: "oscillator",
    color: "#c22",
    inputs: ["Sync"],
    outputs: ["Out", "Slv"],
    modInputs: ["PitchMod1", "PitchMod2", "FmMod", "PWMod"],
    description: "Master oscillator - Full-featured with FM, PW, sync",
    paramRows: [
      { knobs: ["frequency", "coarse", "fine"] },
      { knobs: ["pulseWidth", "pwModDepth"] },
      { knobs: ["fmDepth", "level"] },
    ],
  },
  OscB: {
    label: "OscB",
    category: "oscillator",
    color: "#c33",
    inputs: [],
    outputs: ["Out", "Slv"],
    modInputs: ["PitchMod1", "PitchMod2", "FmMod"],
    description: "Oscillator B - Classic analog waveforms with FM",
    paramRows: [
      { knobs: ["frequency", "coarse", "fine"] },
      { knobs: ["fmDepth", "level"] },
    ],
  },
  OscC: {
    label: "OscC",
    category: "oscillator",
    color: "#c55",
    inputs: [],
    outputs: ["Out", "Slv"],
    modInputs: ["PitchMod", "FMA", "AM"],
    description: "Oscillator C - Sine with AM and FMA",
    paramRows: [
      { knobs: ["frequency", "coarse", "fine"] },
      { knobs: ["fmDepth", "level"] },
    ],
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
  DrumSynth: {
    label: "Drum",
    category: "oscillator",
    color: "#c66",
    inputs: [],
    outputs: ["Out"],
    modInputs: ["Trig", "VelMod", "PitchMod"],
    description: "Drum synth - Dual osc, multimode noise filter, bend",
    paramRows: [
      { knobs: ["masterPitch", "masterDecay", "masterLevel"] },
      { knobs: ["slaveRatio", "slaveDecay", "slaveLevel"] },
      { knobs: ["filterFreq", "filterRes", "filterSweep", "filterDecay"] },
      { knobs: ["bendAmt", "bendDecay"] },
    ],
  },
  FormantOsc: {
    label: "Formant",
    category: "oscillator",
    color: "#c55",
    inputs: [],
    outputs: ["Out", "Slv"],
    modInputs: ["PitchMod1", "PitchMod2"],
    description: "Formant oscillator - Vowel synthesis with slave output",
  },
  MasterOsc: {
    label: "MstOsc",
    category: "oscillator",
    color: "#d44",
    inputs: [],
    outputs: ["Slv"],
    modInputs: ["PitchMod1", "PitchMod2"],
    description: "Master oscillator - Pitch controller for slaves",
    paramRows: [{ knobs: ["frequency", "coarse", "fine"] }],
  },
  OscSlvA: {
    label: "SlvA",
    category: "oscillator",
    color: "#b33",
    inputs: ["Mst", "Sync"],
    outputs: ["Out"],
    modInputs: ["FMA", "AM"],
    description: "Slave osc A - 4 waveforms, sync, FM & AM",
  },
  OscSlvB: {
    label: "SlvB",
    category: "oscillator",
    color: "#b44",
    inputs: ["Mst"],
    outputs: ["Out"],
    modInputs: ["PwMod"],
    description: "Slave osc B - Square/Pulse with PW",
  },
  OscSlvC: {
    label: "SlvC",
    category: "oscillator",
    color: "#b55",
    inputs: ["Mst"],
    outputs: ["Out"],
    modInputs: ["FMA"],
    description: "Slave osc C - Sawtooth",
  },
  OscSlvD: {
    label: "SlvD",
    category: "oscillator",
    color: "#b66",
    inputs: ["Mst"],
    outputs: ["Out"],
    modInputs: ["FMA"],
    description: "Slave osc D - Triangle",
  },
  OscSlvE: {
    label: "SlvE",
    category: "oscillator",
    color: "#b77",
    inputs: ["Mst"],
    outputs: ["Out"],
    modInputs: ["FMA", "AM"],
    description: "Slave osc E - Sine, FM & AM",
  },
  OscSlvFM: {
    label: "SlvFM",
    category: "oscillator",
    color: "#b88",
    inputs: ["Mst", "Sync"],
    outputs: ["Out"],
    modInputs: ["FMB"],
    description: "Slave FM osc - Sine, FM-optimized, sync",
  },
  OscSineBank: {
    label: "SinBnk",
    category: "oscillator",
    color: "#c44",
    inputs: ["Mst", "Sync", "MixIn"],
    outputs: ["Out"],
    modInputs: ["AM1", "AM2", "AM3", "AM4", "AM5", "AM6"],
    description: "6-oscillator sine bank with sync and mix-in",
    paramRows: [
      { knobs: ["tune1", "fine1", "level1"] },
      { knobs: ["tune2", "fine2", "level2"] },
      { knobs: ["tune3", "fine3", "level3"] },
      { knobs: ["tune4", "fine4", "level4"] },
      { knobs: ["tune5", "fine5", "level5"] },
      { knobs: ["tune6", "fine6", "level6"] },
    ],
  },
  SpectralOsc: {
    label: "Spectral",
    category: "oscillator",
    color: "#c66",
    inputs: [],
    outputs: ["Out", "Slv"],
    modInputs: ["PitchMod1", "PitchMod2", "FMA", "ShapeMod"],
    description: "Spectral oscillator - Additive partial stack",
  },
  PercOsc: {
    label: "PercOsc",
    category: "oscillator",
    color: "#c77",
    inputs: [],
    outputs: ["Out"],
    modInputs: ["Trig", "Amp", "PitchMod"],
    description: "Percussive oscillator - Click and punch",
  },
  // ── Filters ──
  Filter: {
    label: "Filter",
    category: "filter",
    color: "#2a7",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: ["FreqMod", "ResMod"],
    description: "Multi-mode filter with resonance",
    paramRows: [{ knobs: ["frequency", "resonance"] }],
  },
  FilterC: {
    label: "FiltC",
    category: "filter",
    color: "#2b8",
    inputs: ["In"],
    outputs: ["LP", "BP", "HP"],
    modInputs: ["FreqMod", "ResMod"],
    description: "Static 3-output multimode filter",
    paramRows: [{ knobs: ["frequency", "resonance"] }],
  },
  FilterE: {
    label: "FiltE",
    category: "filter",
    color: "#2c9",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: ["FreqMod1", "FreqMod2", "ResMod"],
    description: "Dynamic filter with slope select",
    paramRows: [{ knobs: ["frequency", "resonance"] }],
  },
  // ── Modulators ──
  Envelope: {
    label: "Env",
    category: "modulator",
    color: "#c80",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: [],
    description: "ADSR Envelope generator",
    paramRows: [{ knobs: ["attack", "decay", "sustain", "release"] }],
  },
  ADSREnv: {
    label: "ADSR",
    category: "modulator",
    color: "#c90",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: ["Gate", "Retrig"],
    description: "Enhanced ADSR with curve control",
    paramRows: [{ knobs: ["attack", "decay", "sustain", "release"] }],
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
  LFOA: {
    label: "LFOA",
    category: "modulator",
    color: "#c70",
    inputs: [],
    outputs: ["Out", "SlvOut"],
    modInputs: ["Rst", "RateMod"],
    description: "Enhanced LFO with waveform select",
  },
  ClkGen: {
    label: "Clock",
    category: "modulator",
    color: "#c95",
    inputs: [],
    outputs: ["Clk24", "Clk4", "Sync"],
    modInputs: [],
    description: "Clock generator with BPM control",
  },
  RandomGen: {
    label: "Random",
    category: "modulator",
    color: "#c65",
    inputs: [],
    outputs: ["Out"],
    modInputs: [],
    description: "Random signal generator",
  },
  PortamentoA: {
    label: "Porta",
    category: "modulator",
    color: "#c75",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: [],
    description: "Portamento / glide processor",
  },
  EventSeq: {
    label: "EvtSeq",
    category: "modulator",
    color: "#ca5",
    inputs: ["Clk", "Rst"],
    outputs: ["Out1", "Out2"],
    modInputs: [],
    description: "16-step event/trigger sequencer",
    customUIHeight: 70,
  },
  CtrlSeq: {
    label: "CtrlSq",
    category: "modulator",
    color: "#cb6",
    inputs: ["Clk", "Rst"],
    outputs: ["Out"],
    modInputs: [],
    description: "16-step control value sequencer",
    customUIHeight: 80,
  },
  NoteSeqA: {
    label: "NtSeqA",
    category: "modulator",
    color: "#cc7",
    inputs: ["Clk", "Rst"],
    outputs: ["Note", "Gate"],
    modInputs: [],
    description: "16-step note sequencer with gate",
    customUIHeight: 100,
  },
  NoteSeqB: {
    label: "NtSeqB",
    category: "modulator",
    color: "#cd8",
    inputs: ["Clk", "Rst"],
    outputs: ["Note", "Gate"],
    modInputs: [],
    description: "16-step piano roll sequencer",
    customUIHeight: 120,
  },
  // ── Level ──
  Amplifier: {
    label: "Amp",
    category: "level",
    color: "#66a",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: [],
    description: "Fixed-gain amplifier (0.25–4.0×)",
  },
  GainControl: {
    label: "GnCtrl",
    category: "level",
    color: "#67a",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: ["Ctrl"],
    description: "Voltage-controlled amplifier with Unipolar toggle",
  },
  Mixer3: {
    label: "Mix3",
    category: "level",
    color: "#669",
    inputs: ["In1", "In2", "In3"],
    outputs: ["Out"],
    modInputs: [],
    description: "3-channel mixer",
  },
  Mixer8: {
    label: "Mix8",
    category: "level",
    color: "#668",
    inputs: ["In1", "In2", "In3", "In4", "In5", "In6", "In7", "In8"],
    outputs: ["Out"],
    modInputs: [],
    description: "8-channel mixer",
    paramRows: [
      { knobs: ["level1", "level2", "level3", "level4"] },
      { knobs: ["level5", "level6", "level7", "level8"] },
    ],
  },
  XFade: {
    label: "X-Fade",
    category: "level",
    color: "#66b",
    inputs: ["InA", "InB"],
    outputs: ["Out"],
    modInputs: ["FadeMod"],
    description: "Crossfader between two inputs",
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
  // ── Effects ──
  Delay: {
    label: "Delay",
    category: "effect",
    color: "#4899bb",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: [],
    description: "Delay effect with feedback",
    paramRows: [{ knobs: ["time", "feedback", "mix"] }],
  },
  ShortDelay: {
    label: "ShDly",
    category: "effect",
    color: "#489abb",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: ["TimeMod"],
    description: "Short delay for flanging (0-2.65ms)",
    paramRows: [{ knobs: ["time", "feedback", "mix"] }],
  },
  Chorus: {
    label: "Chorus",
    category: "effect",
    color: "#48a9bb",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: [],
    description: "Stereo chorus effect",
    paramRows: [{ knobs: ["rate", "depth", "mix"] }],
  },
  Shaper: {
    label: "Shaper",
    category: "effect",
    color: "#4a80bb",
    inputs: ["In"],
    outputs: ["Out"],
    modInputs: [],
    description: "Waveshaper with drive control",
    paramRows: [{ knobs: ["drive", "level"] }],
  },
  // ── I/O ──
  Keyboard: {
    label: "Keys",
    category: "io",
    color: "#777",
    inputs: [],
    outputs: ["Note", "Gate", "Vel"],
    modInputs: [],
    description: "Keyboard - Play notes with keys",
    customUIHeight: 55,
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
  { key: "oscillator", label: "Oscillators", modules: ["MasterOsc", "OscA", "OscB", "OscC", "SpectralOsc", "FormantOsc", "OscSlvA", "OscSlvB", "OscSlvC", "OscSlvD", "OscSlvE", "OscSineBank", "OscSlvFM", "Noise", "PercOsc", "DrumSynth"] },
  { key: "filter", label: "Filters", modules: ["Filter", "FilterC", "FilterE"] },
  { key: "modulator", label: "Modulators", modules: ["Envelope", "ADSREnv", "LFO", "LFOA", "ClkGen", "RandomGen", "PortamentoA", "EventSeq", "CtrlSeq", "NoteSeqA", "NoteSeqB"] },
  { key: "level", label: "Level", modules: ["Amplifier", "GainControl", "Mixer3", "Mixer8", "XFade", "Panner"] },
  { key: "effect", label: "Effects", modules: ["Delay", "ShortDelay", "Chorus", "Shaper"] },
  { key: "io", label: "I/O", modules: ["Keyboard", "Output"] },
];

// ─── Signal-type taxonomy (4 classes, per BORED_MODULAR_DESIGN.md) ──────────
// Colours match the spec's connector-colour scheme: audio=red, control=blue,
// logic=yellow, slave=grey. Replaces the previous direction-based scheme
// (output=red / audio-in=blue / mod-in=yellow). Closes IMPL_AUDIT_REPORT S1.

const SIGNAL_TYPE_COLORS = {
  audio: "#f44",
  control: "#4cf",
  logic: "#fc0",
  slave: "#9aa",
};

// Per-module overrides for ports whose signal type can't be derived from the
// port name alone. Spec source: sourcemats/MODULE_LAYOUTS.md.
const PORT_SIGNAL_TYPE_OVERRIDES = {
  OscA: { PitchMod1: "audio", PitchMod2: "audio", FmMod: "audio", PWMod: "audio" },
  OscB: { FmMod: "audio" },
  OscC: { PitchMod: "audio" },
  OscSlvB: { PwMod: "audio" },
  PercOsc: { Trig: "audio" },
  // Module outputs that the default-by-name fallback assumes are audio but the
  // spec marks as control or logic. Without these, every cable from these
  // modules renders red instead of blue / yellow.
  LFO: { Out: "control" },
  LFOA: { Out: "control" },
  RandomGen: { Out: "control" },
  CtrlSeq: { Out: "control" },
  EventSeq: { Out1: "logic", Out2: "logic" },
  // PortamentoA processes pitch CV, not audio — both its input and output are
  // blue per §8.3.
  PortamentoA: { In: "control", Out: "control" },
};

// kind: "output" | "input" | "modInput"
// moduleType (optional): when supplied, PORT_SIGNAL_TYPE_OVERRIDES is checked first.
function getPortSignalType(portName, kind, moduleType) {
  if (moduleType) {
    const override = PORT_SIGNAL_TYPE_OVERRIDES[moduleType]?.[portName];
    if (override) return override;
  }
  if (kind === "output") {
    if (portName === "Slv" || portName === "SlvOut") return "slave";
    if (portName === "Gate" || portName === "Clk24" || portName === "Clk4" || portName === "Sync") return "logic";
    if (portName === "Note" || portName === "Vel") return "control";
    return "audio";
  }
  if (kind === "input") {
    if (portName === "Mst") return "slave";
    if (portName === "Clk" || portName === "Rst") return "logic";
    return "audio";
  }
  // modInput
  if (portName === "AM" || /^AM\d$/.test(portName) || portName === "FMA" || portName === "FMB" || portName === "Amp") return "audio";
  if (portName === "Gate" || portName === "Trig" || portName === "Retrig" || portName === "Rst") return "logic";
  return "control";
}

function getPortColor(portName, kind, moduleType) {
  return SIGNAL_TYPE_COLORS[getPortSignalType(portName, kind, moduleType)];
}

// ─── Modulation-input attenuator types (per BORED_MODULAR_DESIGN.md §"Modulation
// Input Attenuator Types", lines 37-40). Each modulation input on a module has
// a knob whose curve is one of:
//   - "I"   Linear      (0=off, 64=half, 127=full).  Used for PW, general-purpose
//   - "II"  Exponential (finer control at low end).  Used for pitch, FM
//   - "III" Bipolar     (0=off, 64=unaffected, 127=2×). Used for filter freq
// Ports absent from a module's entry have no attenuator: either fixed 1:1 (AM
// modulation, Amp inputs), or logic (Trig/Gate/Clk/Rst). Spec line refs in the
// per-module audit (sourcemats/SPEC_AUDIT_REPORT.md §S2). ─────────────────────

const PORT_ATTENUATOR_TYPES = {
  // Oscillators
  MasterOsc: { PitchMod1: "II", PitchMod2: "II" },
  OscA: { PitchMod1: "II", PitchMod2: "II", FmMod: "II", PWMod: "I" },
  OscB: { PitchMod1: "II", PitchMod2: "II", FmMod: "II" },
  OscC: { PitchMod: "II", FMA: "II" }, // AM fixed 1:1
  SpectralOsc: { PitchMod1: "II", PitchMod2: "II", FMA: "II", ShapeMod: "I" },
  FormantOsc: { PitchMod1: "II", PitchMod2: "II" },
  OscSlvA: { FMA: "II" }, // AM fixed 1:1, Sync no attenuator
  OscSlvB: { PwMod: "I" },
  OscSlvC: { FMA: "II" },
  OscSlvD: { FMA: "II" },
  OscSlvE: { FMA: "II" }, // AM fixed 1:1
  OscSlvFM: { FMB: "II" },
  // OscSineBank AM1-6 fixed 1:1; no attenuators per spec line 267
  PercOsc: { PitchMod: "II" }, // Amp fixed 1:1, Trig audio-rate trigger (no curve)
  DrumSynth: { PitchMod: "II", VelMod: "I" }, // Trig is logic
  // Filters
  Filter: { FreqMod: "III", ResMod: "I" },
  FilterC: { FreqMod: "III", ResMod: "I" },
  FilterE: { FreqMod1: "III", FreqMod2: "III", ResMod: "I" },
  // Modulators (Gate/Retrig/Rst are logic, no attenuators)
  LFOA: { RateMod: "II" },
  // Level
  GainControl: { Ctrl: "I" },
  XFade: { FadeMod: "I" },
  Panner: { PanMod: "I" },
  // Effects
  ShortDelay: { TimeMod: "I" },
};

function getModInputAttenuatorType(moduleType, portName) {
  return PORT_ATTENUATOR_TYPES[moduleType]?.[portName] || null;
}

// Apply the spec attenuator curve to a knob position. The audio engine
// stores knob values in their natural param range [min..max]; this helper
// returns the value to write to the bound AudioParam.
//   - Type I  (linear):      passthrough
//   - Type II (exponential): square the normalized 0..1 position
//   - Type III (bipolar):    passthrough — bipolarity comes from a min<0,
//                             max>0 param range; the linear response across
//                             [-max..+max] gives off at 0, full polarity at
//                             ±max, and intermediate scaling in between
function applyAttenuatorCurve(value, min, max, curve) {
  if (!curve || curve === "I" || curve === "III") return value;
  if (max === min) return value;
  if (curve === "II") {
    // Exponential: square the normalized knob position so 50% → 25% of max
    const span = max - min;
    const norm = (value - min) / span;
    const clamped = Math.max(0, Math.min(1, norm));
    return min + clamped * clamped * span;
  }
  return value;
}

export {
  MODULE_DEFS,
  CATEGORIES,
  SIGNAL_TYPE_COLORS,
  PORT_SIGNAL_TYPE_OVERRIDES,
  PORT_ATTENUATOR_TYPES,
  getPortSignalType,
  getPortColor,
  getModInputAttenuatorType,
  applyAttenuatorCurve,
};
