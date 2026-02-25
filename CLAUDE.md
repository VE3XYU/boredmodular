# CLAUDE.md — Nord Modular Web Emulator

## What This Project Is

A browser-based partial emulation of the **Clavia Nord Modular** synthesizer's modular patching system, built with React and the Web Audio API. Users place modules on a canvas, connect them with virtual cables (output → input), tweak parameters in real time, and hear the results immediately.

The goal is **accurate, usable sound design** — not just a visual toy. All audio runs through the Web Audio API with real signal-flow patching. The project is inspired by the Nord Modular G1 but is not a cycle-accurate emulation; it aims to capture the *workflow and sonic character* of modular patching.

## Project Structure

```
nord-modular-app/
├── package.json              # CRA-based, React 18, no extra deps
├── public/
│   └── index.html            # Minimal shell
├── src/
│   ├── index.js              # Entry point, renders <NordModularEmulator />
│   └── NordModularEmulator.jsx  # THE ENTIRE APP — single-file monolith
└── CLAUDE.md                 # You are here
```

Everything lives in **`NordModularEmulator.jsx`** (~1300 lines). This is intentional for now — the project is in early prototype stage. Splitting into separate files is a good future refactor (see below).

## How to Run

```bash
npm install
npm start        # dev server at localhost:3000
npm run build    # production build to build/
```

Requires Node.js ≥ 16. No other dependencies beyond React and react-scripts.

## Architecture Overview

The app has two parallel systems that stay in sync:

### 1. AudioEngine (imperative, class-based)

`class AudioEngine` — a plain JS class that owns the Web Audio API graph. Stored in a `useRef` so it persists across renders without triggering them.

Key points:
- **`this.ctx`** — single `AudioContext`, lazily initialised on first user interaction (browser autoplay policy)
- **`this.modules`** — `Map<id, AudioModuleObject>` where each module object contains:
  - `node` — primary Web Audio node (OscillatorNode, BiquadFilterNode, etc.)
  - `outputNode` — the node other modules connect *from* (often a GainNode wrapper)
  - `outputs` — `{ portName: AudioNode }` map of connectable output ports
  - `inputs` — `{ portName: AudioNode | AudioParam }` map of connectable input ports
  - `params` — `{ paramName: { value, min, max, audioParam?, options?, label } }` — UI-facing parameter definitions, with optional direct reference to the underlying `AudioParam`
  - `trigger()` / `releaseEnv()` — only on Envelope modules, for gate control
- **`connect(fromId, fromPort, toId, toPort)`** — wires an output AudioNode to an input AudioNode or AudioParam
- **`disconnect(...)`** — tears down a specific connection
- **`setParam(moduleId, paramName, value)`** — updates both the param object and the underlying AudioParam
- **Signal chain**: modules → user-patched connections → Output module → masterGain → analyser → ctx.destination

### 2. React State (declarative, functional)

The `NordModularEmulator` component holds:
- **`modules`** — array of `{ id, type, x, y, params }` — position + serialisable param snapshots
- **`connections`** — array of `{ fromId, fromPort, toId, toPort, color }` — the patch cables
- **`panOffset`** — canvas pan state (shift+drag or alt+drag)
- **`dragging`** / **`cableDrag`** — transient interaction state

React state drives the SVG rendering. The AudioEngine drives the audio. When a user changes a param slider, both are updated in `handleParamChange`.

### Module System

Defined in two places:
1. **`MODULE_DEFS`** — static UI metadata (colour, port names, category, description). This is what the sidebar and SVG renderer use.
2. **`AudioEngine._create*(id)`** methods — each returns an audio module object with real Web Audio nodes.

Adding a new module requires updating both. Current modules:

| Module    | Type       | Audio Nodes Used                        | Inputs              | Outputs | Notes |
|-----------|------------|-----------------------------------------|---------------------|---------|-------|
| OscB      | Oscillator | OscillatorNode → GainNode               | PitchMod, FmMod     | Out     | Saw default, 4 waveforms |
| OscC      | Oscillator | OscillatorNode → GainNode               | PitchMod            | Out     | Square default, has PW param (not yet functional) |
| Filter    | Filter     | BiquadFilterNode                        | In, FreqMod, ResMod | Out     | LP/HP/BP/Notch |
| Envelope  | Modulator  | GainNode (0→1→S→0 automation)           | In                  | Out     | ADSR, triggered by gate |
| LFO       | Modulator  | OscillatorNode → GainNode               | —                   | Out     | Mod source, amount controls depth |
| Amplifier | Level      | GainNode                                | In, GainMod         | Out     | VCA |
| Mixer2    | Level      | 2× GainNode → merger GainNode           | In1, In2            | Out     | 2-ch mixer |
| Noise     | Oscillator | BufferSourceNode (white noise) → GainNode | —                 | Out     | Pink noise option exists but not implemented |
| Delay     | Effect     | GainNode → DelayNode → feedback loop → GainNode | In          | Out     | Time, feedback, mix |
| Output    | I/O        | GainNode → masterGain                   | InL, InR            | —       | Final output to speakers |

### Port Types and Colour Coding

- **Red circles** — Outputs. Drag FROM these.
- **Blue circles** — Audio inputs (signal flow).
- **Yellow circles** — Modulation inputs (connect to an AudioParam like frequency or gain).

Connections are strictly **output → input**. The cable drag starts on mousedown of an output port and completes on mouseup over an input port.

### Cable Rendering

`CableSVG` draws a cubic Bézier curve with calculated sag (simulating gravity/droop on a physical cable). Each cable gets a random hue on creation. Double-click a cable to remove it.

### Gate / Trigger System

- **Spacebar** (hold) or the **GATE button** in the sidebar triggers all Envelope modules simultaneously via `engineRef.current.triggerEnvelopes()`.
- Release fires `releaseEnvelopes()`.
- This is a global gate — there's no per-voice or MIDI triggering yet.

### Oscilloscope

The `Scope` component reads `analyser.getFloatTimeDomainData()` on every animation frame and draws a green phosphor-style waveform on a `<canvas>`.

## Known Limitations and Bugs

These are the issues a future session should be aware of:

1. **OscC pulse width param is non-functional** — the `pulseWidth` param exists in the UI but doesn't affect audio. True PWM requires an AudioWorklet (the built-in OscillatorNode doesn't support variable pulse width).
2. **Noise "pink" option not implemented** — the dropdown exists but both options produce white noise. Pink noise requires shaping the spectrum with a filter network.
3. **No patch save/load** — state is lost on refresh.
4. **No MIDI support** — gate is spacebar-only, no pitch control from keyboard/MIDI.
5. **Oscillators are always running** — they start immediately on creation. There's no concept of voice allocation or note-on/off per oscillator.
6. **Connection validation is minimal** — you can connect an LFO output to a filter's audio input (which works but may produce unexpected results). No type checking on port compatibility.
7. **Module removal can leave dangling Web Audio connections** — the cleanup in `removeModule` tries to disconnect everything but may miss indirect references in complex patches.
8. **Single-file monolith** — everything is in one 1300-line file. Fine for now, but will need splitting as complexity grows.
9. **Port position calculation is fragile** — `getPortPosition()` calculates port positions from module state using hardcoded layout math. If module visual layout changes, port positions break and cables will misalign.
10. **No zoom** — only pan (shift+drag). Adding zoom requires scaling the SVG transform and adjusting all mouse coordinate calculations.

## How to Add a New Module

1. **Add a `MODULE_DEFS` entry** with label, category, colour, input/output port names, and modulation input names.
2. **Add the type string** to the relevant `CATEGORIES` entry so it appears in the sidebar.
3. **Add `_create<Type>(id)` method** to `AudioEngine`. Follow the existing pattern:
   - Create Web Audio nodes
   - Wire them internally
   - Return `{ id, type, node, outputNode, outputs: {}, inputs: {}, params: {} }`
   - For `inputs`, map port names to either AudioNodes (signal) or AudioParams (modulation)
4. **Add a case** in `AudioEngine.createModule()` switch statement.
5. **Test** the signal flow by patching it into an Output module.

## Recommended Next Steps (Priority Order)

### High Impact
- **MIDI input** — Use the Web MIDI API to receive note-on/off, map note number to oscillator frequency, and trigger envelopes. This transforms it from a drone machine into a playable instrument.
- **Keyboard module** — A virtual on-screen keyboard or a "Keyboard" module that outputs pitch CV and gate signals.
- **Patch save/load** — Serialise `modules` and `connections` state to JSON. Store in localStorage or allow file export/import.

### Medium Impact
- **AudioWorklet-based oscillators** — Replace built-in OscillatorNode with custom AudioWorklet processors for proper pulse width modulation, oscillator sync, and more accurate Nord-style waveforms.
- **More modules** — Ring Modulator, Phaser, Chorus, Reverb (ConvolverNode), Sequencer, Sample & Hold, Constant module, Slew Limiter.
- **File splitting** — Extract AudioEngine into its own file, module definitions into another, components into a components/ directory.
- **Proper pink noise** — Implement Paul Kellet's pink noise algorithm in an AudioWorklet.

### Polish
- **Zoom** — Scroll wheel zoom with SVG viewBox transform.
- **Module snapping / auto-layout** — Snap to grid, or auto-arrange.
- **Cable management** — Click-to-select cables, colour coding by signal type, cable opacity/thickness indicating signal level.
- **Undo/redo** — State history stack.
- **Preset patches** — Ship a few example patches (basic subtractive synth, FM bass, ambient pad, etc.) that users can load.
- **Responsive / touch support** — Touch events for mobile/tablet use.

## Reference Material

If you need to understand the original hardware for accuracy:
- The Nord Modular G1 had ~170 module types across categories: oscillators, filters, envelopes, LFOs, shapers, mixers, logic, sequencers, effects, and I/O.
- The official Nord Modular Editor software used a two-panel layout (Patch area and Performance area) with colour-coded modules by category.
- Modules used a red/blue cable colour convention (audio vs control rate), though in practice any output could connect to any input.
- The G1 ran a custom DSP (Motorola 56303) — we're approximating with Web Audio, which is good enough for most module types but won't perfectly match the DSP character of the original hardware.
