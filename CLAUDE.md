# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Browser-based modular synthesizer — a spiritual homage to the patch-cord modular tradition, not a clone of any specific hardware. Users drop modules on an SVG canvas, patch them with virtual cables (output → input), tweak params, and hear the result through the Web Audio API. The goal is usable sound design — accurate workflow and sonic character, not cycle-accurate DSP.

Built with Create React App, React 18, no extra runtime deps. The published name is "bored modular".

## Commands

```bash
npm install
npm start        # dev server at localhost:3000
npm run build    # production build to build/
```

There are no tests, no lint script, and no typecheck — just the two CRA scripts. Node ≥ 16.

## Architecture

The app is split across three source files. Two parallel systems stay in sync: an imperative AudioEngine (Web Audio graph) and React state (SVG render).

```
src/
├── index.js                  # CRA entry, renders <BoredModularEmulator />
├── AudioEngine.js            # AudioEngine class — all _create*() methods, connect/disconnect, setParam
├── moduleDefs.js             # MODULE_DEFS (UI metadata) + CATEGORIES (sidebar order)
└── BoredModularEmulator.jsx   # React components (Scope, SvgSlider, Port, ModuleNode, CableSVG) + main app
```

### AudioEngine (imperative)

`class AudioEngine` owns the Web Audio graph. Stored in `useRef` so it persists across renders. Key shape:

- `this.ctx` — single `AudioContext`, lazily initialised on first user interaction (autoplay policy)
- `this.modules` — `Map<id, AudioModuleObject>` where each module exposes:
  - `node`, `outputNode`, `_nodes[]` (for cleanup)
  - `outputs: { portName: AudioNode }` — sources you connect *from*
  - `inputs: { portName: AudioNode | AudioParam | null }` — destinations you connect *to*. `null` = virtual port (see below).
  - `params: { name: { value, min, max, audioParam?, options?, label } }` — UI-facing param defs, optionally bound to an `AudioParam`
  - Optional method hooks: `trigger()`/`releaseEnv()` (envelopes), `playNote()`/`releaseNote()` (Keyboard), `clockTick()`/`resetSeq()` (sequencers), `_recalcFreq()` (slave oscs)
- Final chain: modules → user patches → `Output` → `masterGain` → `analyser` → `ctx.destination`

### React state (declarative)

`BoredModularEmulator` holds:
- `modules` — `[{ id, type, x, y, params }]` (canvas-space x/y, serialisable param snapshots)
- `connections` — `[{ fromId, fromPort, toId, toPort, color }]`
- `panOffset`, `dragging`, `cableDrag`, `mousePos` — interaction state
- `seqFrame` — 66ms tick counter to refresh sequencer step LEDs (~15fps)

React state drives the SVG render; AudioEngine drives the audio. `handleParamChange` writes both. Patch save/load is implemented (localStorage + JSON export/import via `loadPatchData`).

### Module system — definition lives in two places

Each module is defined in **both** `moduleDefs.js` (UI metadata: label, color, category, port names, optional `customUIHeight`) **and** `AudioEngine._create<Type>(id)` (the audio graph + params). Adding a module requires:

1. Entry in `MODULE_DEFS` (`moduleDefs.js`)
2. Type string added to the relevant `CATEGORIES` group (sidebar order)
3. `_create<Type>(id)` method on `AudioEngine` — return `{ id, type, node, outputNode, outputs, inputs, params, _nodes }` plus any system-specific fields (`_slaveTargets`, `_pitchTargets`, `_clockSubscribers`, etc.)
4. `case "<Type>":` in `AudioEngine.createModule()` switch
5. If the module needs cross-param updates, add a branch in `setParam`

### Modules (39 total, by category)

- **Oscillators** (14): `OscA`, `OscB`, `OscC`, `MasterOsc`, `OscSlvA`–`OscSlvE`, `OscSlvFM`, `OscSineBank`, `Noise`, `DrumSynth`, `FormantOsc`
- **Filters** (3): `Filter`, `FilterC` (3-output LP/BP/HP), `FilterE` (12/24 dB slope)
- **Modulators** (11): `Envelope`, `ADSREnv`, `LFO`, `LFOA`, `ClkGen`, `RandomGen`, `PortamentoA`, `EventSeq`, `CtrlSeq`, `NoteSeqA`, `NoteSeqB`
- **Level** (5): `Amplifier`, `Mixer2`, `Mixer8`, `XFade`, `Panner`
- **Effects** (4): `Delay`, `ShortDelay` (flanger), `Chorus`, `Shaper`
- **I/O** (2): `Keyboard` (playable), `Output`

### Port semantics

- **Red circles** = outputs. **Blue** = audio inputs. **Yellow** = modulation inputs (target an `AudioParam`).
- Cable drag is **bidirectional** — start from any port, the system normalises to output→input on drop. Same-type drops are rejected.
- Cables render *on top* of modules (SVG order: modules → cables → transparent port hit overlay last for reliable interaction over cables).
- `CableSVG` draws a cubic Bézier with calculated sag (gravity sim). Each cable gets a random hue. Double-click to remove.

### Master/Slave oscillator system

Slave oscillators (`OscSlvA`–`E`, `OscSlvFM`, `OscSineBank`) take pitch from a master (`OscA`/`B`/`C`/`MasterOsc`) via a **virtual** `Slv → Mst` connection — no audio flows; pitch propagates through fields:

- Master has `_slaveTargets[]`, `_frequency`, and a `Slv` output port
- Slave has `_masterFreq`, `_masterModId`, `_recalcFreq()`, and a `Mst` input that maps to `null` (virtual)
- `connect()` detects `Slv→Mst` and writes the relationship instead of calling `outputNode.connect()`. Same for disconnect.
- Slave freq formula: `masterFreq * partials * 2^(detune/12) * 2^(fine/1200)` (with per-module variations)
- Master param changes call `_propagateToSlaves(masterMod)` to recompute every slave's frequency

### Clock / Sequencer subscriber system

`ClkGen` drives sequencers (`EventSeq`, `CtrlSeq`, `NoteSeqA`, `NoteSeqB`) via subscriber lists, not audio:

- ClkGen schedules `setTimeout` ticks at 24 PPQN; on quarter notes (`Clk4`) it calls every `_clockSubscribers[].clockTick()`, on bar boundaries (`Sync`) it calls every `_resetSubscribers[].resetSeq()`.
- Sequencer `Clk` and `Rst` inputs are virtual (`null`); `connect()` recognises them and pushes onto the clock module's subscriber list.
- The sequencer's own `Clk24`/`Clk4`/`Sync` are `ConstantSourceNode`s that pulse 0→1→0 — useful as audio-rate triggers if patched into envelope mod inputs, but the clock-tick logic above is the primary mechanism.

### Note-source pattern (Keyboard, NoteSeqA, NoteSeqB)

These modules track their pitch and gate targets directly rather than through the standard audio graph:

- `Note` output is a `ConstantSourceNode` whose offset = frequency in Hz. When `Note → PitchMod` is patched, the target `AudioParam` is pushed onto the source's `_pitchTargets[]` and `connect()` does **not** call `outputNode.connect(inputNode)`.
- On `playNote(midi)`, the source iterates `_pitchTargets` and `setValueAtTime(freq, now)` directly. This is the trick that makes oscillators play in tune — adding the Note's offset to the oscillator's `frequency` would *sum* not *replace*.
- `Gate` output is a real audio-rate `ConstantSourceNode` (0/1), but additionally tracks `_gateTargetEnvelopes[]`: any envelope module connected to it gets `trigger()`/`releaseEnv()` calls on note on/off.
- Computer keys: `ASDFGHJK` = white keys C–C, `WETYU` = black keys (see `KEY_NOTE_MAP`). Spacebar still triggers the global gate.

### Coordinate system (important when changing layout)

- `moduleState.x/y` are **canvas-space** (the world the SVG `<g transform="translate(panOffset)">` lives in)
- `getPortPosition()` returns canvas-space and includes `def.customUIHeight || 0` in its math
- `mousePos` from SVG events is **viewport/screen space** — subtract `panOffset` to get canvas-space
- `getModuleHeight()` also depends on `customUIHeight`; keep these in sync if you change a module's visual layout, or cables will misalign

### `customUIHeight` for in-module UI

Set `customUIHeight: N` in a module's `MODULE_DEFS` entry to reserve N px between the param sliders and the port row for an inline custom SVG widget (e.g., the piano keys on `Keyboard`, the step grid on sequencers). The custom widget is rendered in `ModuleNode` based on module type. Both `getPortPosition` and `getModuleHeight` read `customUIHeight` — both port positions and module height calculations derive from this value, so always set it before adding the renderer or cables will be off.

### `setParam` cross-param handling

`AudioEngine.setParam` sets the `value` and (if present) writes the linked `AudioParam`, then runs module-specific branches for cross-param updates:

- `Chorus`: rate → `_lfo2.frequency`, depth → `_lfoGain2.gain`
- `FilterC`/`FilterE`: sync freq/res across multiple internal filters; FilterE rewires on slope change
- `XFade`: inverse gain on the other channel
- `Shaper`: regenerates `WaveShaperNode.curve` from shape+drive
- `PortamentoA`: time → lowpass cutoff
- `LFOA`: range multiplier on rate
- `FormantOsc`: vowel → formant filter freqs, timbre → interpolation
- `OscA`/`MasterOsc`: coarse/fine recompute frequency, then `_propagateToSlaves`
- `OscB`/`OscC`: frequency change → `_propagateToSlaves`
- Slaves: any of partials/detune/fine/octShift → `_recalcFreq()`
- `OscSineBank`: per-partial tune/fine → `_recalcFreq()`
- Waveform/filterType params: assign directly to `node.type`

When adding a module that needs sync between params, extend this method.

## Gotchas worth knowing

- **SVG vs HTML tagName casing**: `e.target.tagName` is **lowercase** for SVG elements (`"circle"`, `"rect"`) but **UPPERCASE** for HTML inside `<foreignObject>` (`"INPUT"`, `"SELECT"`). The keyboard handler checks for the latter to avoid stealing keys from form inputs.
- **Virtual inputs are `null`**: `Mst`, `Clk`, `Rst` map to `null` in `inputs`. `connect()`/`disconnect()` must handle these cases *before* the `if (!inputNode) return false` guard.
- **Oscillators always run**: every oscillator `.start()`s on creation; there's no voice allocation. Audibility is gated by amplifier envelopes, not oscillator on/off.
- **`removeModule` cleanup**: walks `_nodes` to disconnect, clears subscriber/target arrays on both sides of master/slave and clock relationships, and stops the ClkGen timer. New modules with similar relationships need parallel cleanup or they'll leak.
- **e.preventDefault() on port mousedown**: required to prevent browser text selection from interfering with cable drags. The SVG has `userSelect: "none"` for the same reason.

## Known limitations (for future work)

- **No MIDI input** — pitch comes from `Keyboard` (computer keys) and sequencers only.
- **No zoom** — pan only (shift+drag or alt+drag).
- **Connection type checking is minimal** — any output can connect to any input that isn't already filled. Audio-into-modulation usually works but may sound surprising.
