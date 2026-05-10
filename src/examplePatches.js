// Inline example patches surfaced in the sidebar's Examples section.
// Each entry is a self-contained patch: { modules, connections } in the
// same shape that loadPatchData and Export/Import already use.
//
// Module IDs are local to each patch (mod_1..mod_N). loadPatchData clears
// existing modules before rebuilding and updates the global id counter from
// the loaded patch, so collisions are not possible.
//
// Patches lean on the engine's ground truth port names. Verified against
// AudioEngine._create*() input/output maps:
//   Keyboard:  Note, Gate (outputs)
//   OscA:      PitchMod1 (input), Out, Slv (outputs)
//   OscB:      PitchMod (input), Out, Slv (outputs)
//   OscSlvA:   Mst (virtual input), FMA, AM, Out
//   OscSlvFM:  Mst (virtual input), FMB, Out
//   Filter:    In, FreqMod, ResMod (inputs), Out
//   FilterE:   In, FreqMod1, FreqMod2, ResMod (inputs), Out
//   ADSREnv:   In, Gate, Retrig (inputs), Out  (acts as a VCA -- pass audio through)
//   LFO:       Out
//   Mixer8:    In1..In8 (inputs), Out
//   Output:    InL, InR (inputs)
//
// Cable colour is cosmetic; consistent hue per signal type makes diagrams
// easier to read at a glance.
const C_PITCH = "hsl(60, 70%, 55%)";   // Note pitch (yellow)
const C_GATE  = "hsl(40, 70%, 55%)";   // Gate / trigger (amber)
const C_AUDIO = "hsl(180, 70%, 55%)";  // Audio signal (cyan)
const C_MOD   = "hsl(280, 70%, 55%)";  // Modulation source (purple)
const C_MST   = "hsl(0, 70%, 55%)";    // Master/slave virtual link (red)
const C_OUT   = "hsl(330, 70%, 55%)";  // Final output (pink)

export const EXAMPLE_PATCHES = [
  {
    key: "subPluck",
    label: "Sub Pluck",
    description: "Single saw → low-pass filter → pluck envelope. The simplest signal chain that still sounds musical.",
    patch: {
      modules: [
        { id: "mod_1", type: "Keyboard", x:  60, y: 320, params: {} },
        { id: "mod_2", type: "OscA",     x: 320, y:  60, params: { frequency: 220, waveform: "sawtooth", level: 0.7 } },
        { id: "mod_3", type: "Filter",   x: 600, y: 100, params: { frequency: 1500, resonance: 3, filterType: "lowpass" } },
        { id: "mod_4", type: "ADSREnv",  x: 880, y: 100, params: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.3 } },
        { id: "mod_5", type: "Output",   x: 1140, y: 200, params: { level: 0.6 } },
      ],
      connections: [
        { fromId: "mod_1", fromPort: "Note", toId: "mod_2", toPort: "PitchMod1", color: C_PITCH },
        { fromId: "mod_2", fromPort: "Out",  toId: "mod_3", toPort: "In",        color: C_AUDIO },
        { fromId: "mod_3", fromPort: "Out",  toId: "mod_4", toPort: "In",        color: C_AUDIO },
        { fromId: "mod_1", fromPort: "Gate", toId: "mod_4", toPort: "Gate",      color: C_GATE  },
        { fromId: "mod_4", fromPort: "Out",  toId: "mod_5", toPort: "InL",       color: C_OUT   },
      ],
    },
  },
  {
    key: "wobble",
    label: "Wobble",
    description: "Adds an LFO modulating the filter cutoff for a wah-wah movement under each note.",
    patch: {
      modules: [
        { id: "mod_1", type: "Keyboard", x:  60, y: 320, params: {} },
        { id: "mod_2", type: "OscA",     x: 320, y:  40, params: { frequency: 220, waveform: "sawtooth", level: 0.7 } },
        { id: "mod_3", type: "Filter",   x: 600, y:  80, params: { frequency: 700, resonance: 8, filterType: "lowpass" } },
        { id: "mod_4", type: "LFO",      x: 600, y: 380, params: { rate: 4, amount: 700, waveform: "sine" } },
        { id: "mod_5", type: "ADSREnv",  x: 880, y: 100, params: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 } },
        { id: "mod_6", type: "Output",   x: 1140, y: 200, params: { level: 0.5 } },
      ],
      connections: [
        { fromId: "mod_1", fromPort: "Note", toId: "mod_2", toPort: "PitchMod1", color: C_PITCH },
        { fromId: "mod_2", fromPort: "Out",  toId: "mod_3", toPort: "In",        color: C_AUDIO },
        { fromId: "mod_4", fromPort: "Out",  toId: "mod_3", toPort: "FreqMod",   color: C_MOD   },
        { fromId: "mod_3", fromPort: "Out",  toId: "mod_5", toPort: "In",        color: C_AUDIO },
        { fromId: "mod_1", fromPort: "Gate", toId: "mod_5", toPort: "Gate",      color: C_GATE  },
        { fromId: "mod_5", fromPort: "Out",  toId: "mod_6", toPort: "InL",       color: C_OUT   },
      ],
    },
  },
  {
    key: "mini",
    label: "Mini",
    description: "Three-oscillator subtractive voice (Minimoog homage). One master saw plus two slaves -- a detuned saw and a square octave-up -- mixed through a 24 dB ladder-style low-pass.",
    patch: {
      modules: [
        { id: "mod_1", type: "Keyboard", x:  60, y: 360, params: {} },
        { id: "mod_2", type: "OscA",     x: 300, y:  20, params: { frequency: 220, waveform: "sawtooth", level: 0.7 } },
        { id: "mod_3", type: "OscSlvA",  x: 300, y: 220, params: { partials: 1, fine: -7, level: 0.7 } },
        { id: "mod_4", type: "OscSlvA",  x: 300, y: 420, params: { partials: 2, fine: 5, level: 0.6 } },
        { id: "mod_5", type: "Mixer8",   x: 580, y: 200, params: { level1: 0.6, level2: 0.6, level3: 0.5 } },
        { id: "mod_6", type: "FilterE",  x: 820, y: 200, params: { frequency: 1400, resonance: 6, filterType: "lowpass", slope: "24dB" } },
        { id: "mod_7", type: "ADSREnv",  x: 1060, y: 200, params: { attack: 0.01, decay: 0.4, sustain: 0.65, release: 0.4 } },
        { id: "mod_8", type: "Output",   x: 1300, y: 280, params: { level: 0.45 } },
      ],
      connections: [
        { fromId: "mod_1", fromPort: "Note", toId: "mod_2", toPort: "PitchMod1", color: C_PITCH },
        { fromId: "mod_2", fromPort: "Slv",  toId: "mod_3", toPort: "Mst",       color: C_MST   },
        { fromId: "mod_2", fromPort: "Slv",  toId: "mod_4", toPort: "Mst",       color: C_MST   },
        { fromId: "mod_2", fromPort: "Out",  toId: "mod_5", toPort: "In1",       color: C_AUDIO },
        { fromId: "mod_3", fromPort: "Out",  toId: "mod_5", toPort: "In2",       color: C_AUDIO },
        { fromId: "mod_4", fromPort: "Out",  toId: "mod_5", toPort: "In3",       color: C_AUDIO },
        { fromId: "mod_5", fromPort: "Out",  toId: "mod_6", toPort: "In",        color: C_AUDIO },
        { fromId: "mod_6", fromPort: "Out",  toId: "mod_7", toPort: "In",        color: C_AUDIO },
        { fromId: "mod_1", fromPort: "Gate", toId: "mod_7", toPort: "Gate",      color: C_GATE  },
        { fromId: "mod_7", fromPort: "Out",  toId: "mod_8", toPort: "InL",       color: C_OUT   },
      ],
    },
  },
  {
    key: "bellFm",
    label: "Bell FM",
    description: "Two-operator FM bell (DX7 homage). A sine modulator one octave above frequency-modulates a sine carrier; a percussive envelope gives the characteristic ping-and-decay tine.",
    patch: {
      modules: [
        { id: "mod_1", type: "Keyboard",  x:  60, y: 320, params: {} },
        { id: "mod_2", type: "OscB",      x: 300, y:  60, params: { frequency: 440, coarse: 12, waveform: "sine", level: 1.0 } },
        { id: "mod_3", type: "OscSlvFM",  x: 580, y: 200, params: { partials: 0.5, fine: 0, fmDepth: 500, level: 0.8 } },
        { id: "mod_4", type: "ADSREnv",   x: 840, y: 200, params: { attack: 0.001, decay: 1.2, sustain: 0, release: 1.5 } },
        { id: "mod_5", type: "Output",    x: 1100, y: 280, params: { level: 0.5 } },
      ],
      connections: [
        { fromId: "mod_1", fromPort: "Note", toId: "mod_2", toPort: "PitchMod",  color: C_PITCH },
        { fromId: "mod_2", fromPort: "Slv",  toId: "mod_3", toPort: "Mst",       color: C_MST   },
        { fromId: "mod_2", fromPort: "Out",  toId: "mod_3", toPort: "FMB",       color: C_MOD   },
        { fromId: "mod_3", fromPort: "Out",  toId: "mod_4", toPort: "In",        color: C_AUDIO },
        { fromId: "mod_1", fromPort: "Gate", toId: "mod_4", toPort: "Gate",      color: C_GATE  },
        { fromId: "mod_4", fromPort: "Out",  toId: "mod_5", toPort: "InL",       color: C_OUT   },
      ],
    },
  },
];
