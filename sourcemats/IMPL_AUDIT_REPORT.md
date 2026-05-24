# Implementation Audit Report

A growing record of how the implementation in `src/` compares to the spec corpus, audited per batch. Each batch appends its scoped audit; the report is allowed to be incomplete.

**Status: 2026-05-24.** Systemic finding **S1 (port-colour semantics) fully resolved**: common-case inference rewire shipped 2026-05-23 (PR `feat/port-colours-by-signal-type`); per-port overrides shipped 2026-05-24 (PR `feat/port-signal-type-overrides`) for the residual divergences inference can't infer (OscA mods, OscB.FmMod, OscC.PitchMod, OscSlvB.PwMod, PercOsc.Trig). Override table lives at `src/moduleDefs.js:PORT_SIGNAL_TYPE_OVERRIDES`. Original Pass 1 status below.

**Status: 2026-05-15.** Six batches landed; all 42 currently-implemented modules audited. Batch 3 (2026-05-12) was a single audit-only sweep covering the 38 modules previously unaudited; Batch 4 (2026-05-13) split the impl `Amplifier` hybrid into a spec §6.13 fixed-gain `Amplifier` plus a new spec §6.3 `GainControl` (VCA with `Unipolar` toggle), resolving Amplifier findings F1/F2a/F3/F4/F7 in one batch; Batch 5 (2026-05-14) applied eight patch-load-safe range widenings drawn from Batch 3's quick-win recommendations (MstOsc-F2, OscA-F3, OscC-F6, FormantOsc-F3, PercOsc-F1, Filter-F7, FilterC-F2, FilterE-F10); Batch 6 (2026-05-15) applied two range narrowings (OscA-F2 Fine, Porta-F2 time) — the playbook §5 saved-patch scan was waived because the project is still in development mode and the maintainer confirmed no saved patches need preservation. Batches 1 and 2 covered Amplifier (initial range fixes), ClkGen, and RandomGen. Systemic findings: S1-S6 (port-colour, attenuator-type, layout, non-oscillator master/slave architecture, mute-affordance absence, KBT cosmetic-only). On 2026-05-06 the disposition framework was reframed to make spec the source of truth (see Disposition section). Batches 1-3 left every `fix-toward-spec` finding blocked on a systemic dependency, a design call, or a patch-load safety check; Batches 4, 5, and 6 are the first since then to apply `fix-toward-spec` changes in `src/`.

## Sources

- **Spec corpus:** `sourcemats/BORED_MODULAR_DESIGN.md`, `sourcemats/MODULE_LAYOUTS.md` (validated against the PDF in `sourcemats/SPEC_AUDIT_REPORT.md`).
- **Implementation:** `src/AudioEngine.js` (`_create<Type>` methods, `setParam` cross-param branches), `src/moduleDefs.js` (`MODULE_DEFS`, `CATEGORIES`), `src/BoredModularEmulator.jsx` (`Port` rendering, `loadPatchData`).

## Scope

- All implemented modules in `src/` (42 currently) are eligible for this audit. As of Batch 4 (2026-05-13) every implemented module has been audited at least once.
- Each batch audits the cluster it modifies (single-cluster batches per playbook §4 are the norm; Batch 3 is an exceptional single-PR full sweep). The report grows over time; "complete" is not a goal beyond the per-module first pass.
- Spec-only modules (those in spec but not yet implemented) are listed in the Module Count Summary as coverage gaps, not audited here.

## Methodology

Adapted from `SPEC_AUDIT_REPORT.md`'s 8-dimension methodology, split into per-module and systemic dimensions per the plan's audit methodology decision (`docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md`).

**Per-module dimensions** (audit each module against its spec entry):

1. **Presence** — module is in both impl and spec (or consistently absent / impl-only / spec-only).
2. **Name** — exact match including casing.
3. **Parameters** — every knob, button, selector captured.
4. **Numeric ranges** — Hz, semitone, ms, dB, unit ranges accurate.
5. **Inputs/outputs** — port presence and direction (port colour is systemic, see below).
6. **Default values** — where impl distinguishes default from initial value, and where spec states a default.

**Systemic dimensions** (recorded once at the top; not repeated per module):

7. **Attenuator types** — impl has no Type I/II/III metadata.
8. **Layout (PDF panel illustrations)** — impl has no panel layout encoding outside `customUIHeight`.
9. **Port-colour semantics** — direction-based vs signal-type-based.

## Severity

- **Critical** — factual divergence with behavioural impact (wrong range, missing required port, wrong port-direction).
- **Minor** — wording difference without behavioural impact (param naming, descriptions).
- **Formatting** — report structure, ordering, no meaning change.
- **Out-of-scope** — spec content not verifiable from this PDF excerpt, OR impl behaviour the spec does not specify (e.g., default value when spec is silent).

## Disposition

The PDF/spec corpus is the source of truth for module shape (params, ranges, IO, behavior). CLAUDE.md's "spiritual homage … not cycle-accurate DSP" framing scopes narrowly to implementation-level fidelity (Web Audio approximations, AudioWorklet optional, DSP graph freedom) — not to feature/parameter/IO divergence.

Every finding carries a disposition assigned at audit time. Severity describes deviation magnitude; disposition describes intent. The two are independent — `Critical` severity does not imply `fix-toward-spec` disposition.

- **`fix-toward-spec`** — impl will be changed to match spec. May be `(blocked: <reason>)` when a fix is correct in principle but waits on a concrete design call or external dependency.
- **`keep-as-divergence`** — impl deliberately diverges from spec. For findings touching user-visible behavior, requires a one-line rationale fitting one of three categories: a DSP-level approximation the spec implicitly tolerates, an extension the spec doesn't preclude, or a durable design rationale that survives spec adherence as the baseline. "More learnable" / "useful" / "saves implementation work" alone do not qualify. See `MODULE_PLAYBOOK.md` §2.3.
- **`undecided`** — disposition deferred. Used when a fix is blocked on a design call or when the divergence rationale needs more thought.

---

## Systemic Findings

These cross-cutting findings affect every module. Recording once here; not repeated per-module.

### S1. Port-colour semantics

- **Spec:** signal-type-based — Red=audio, Blue=control, Yellow=logic, Gray=slave (`BORED_MODULAR_DESIGN.md:13-17`).
- **Impl (before):** direction-based — Red=output, Blue=audio-in, Yellow=mod-in.
- **Impl (after, 2026-05-23):** signal-type-based, driven by a `getPortSignalType(portName, kind)` helper in `src/moduleDefs.js` and applied in `src/BoredModularEmulator.jsx` Port component. Inference covers the common cases (Slv/SlvOut→slave, Mst→slave, Gate/Clk*/Sync output→logic, Clk/Rst input→logic, Note/Vel output→control, AM*/FMA/FMB/Amp mod→audio, Gate/Trig/Retrig/Rst mod→logic, everything else by direction default).
- **Severity:** Critical (cross-cutting; every module's port colours read differently than spec).
- **Disposition:** `fix-toward-spec — RESOLVED 2026-05-24` (common-case rewire 2026-05-23; per-port overrides 2026-05-24). Resolved divergences (each now keyed in `PORT_SIGNAL_TYPE_OVERRIDES`):
  - **OscA** — `PitchMod1`, `PitchMod2`, `FmMod`, `PWMod` overridden to `audio` (spec `MODULE_LAYOUTS.md:82`: all RED).
  - **OscB** — `FmMod` overridden to `audio` (spec `MODULE_LAYOUTS.md:88`: FMA RED; the other PitchMod1/2 are correctly Blue per spec and so left to inference).
  - **OscC** — `PitchMod` overridden to `audio` (spec `MODULE_LAYOUTS.md:94`: RED). `FMA`/`AM` already named to match spec and inferred audio.
  - **OscSlvB** — `PwMod` overridden to `audio` (spec `MODULE_LAYOUTS.md:118`: RED).
  - **PercOsc** — `Trig` overridden to `audio` (spec `MODULE_LAYOUTS.md:157`: RED). `DrumSynth.Trig` deliberately not overridden — spec `MODULE_LAYOUTS.md:162` says YELLOW (logic), which inference already gives.
  - **SpectralOsc / OscSlvC / OscSlvE / OscSlvFM** — no overrides needed: spec-correct `FMA`/`FMB` port names are used and inferred as audio. The earlier audit text flagged a naming inconsistency that doesn't actually exist in current `MODULE_DEFS`.

### S2. Attenuator-type metadata

- **Spec:** every modulation input is tagged with attenuator type — Type I (linear), Type II (exponential), or Type III (bipolar). Examples: `Pitch Mod x2 (Inputs, Red): [Attenuator Type II]` (`BORED_MODULAR_DESIGN.md:134`).
- **Impl (before):** no Type I/II/III metadata anywhere. `MODULE_DEFS` listed mod inputs as port-name strings; `_create<Type>` returned raw `AudioParam` references with no curve / response-shape annotation.
- **Impl (after, 2026-05-24):** Phases 1+2 shipped (PR `feat/attenuator-types-phase-1-2`):
  - **Phase 1 (metadata)** — `PORT_ATTENUATOR_TYPES` table added to `src/moduleDefs.js` enumerating the spec curve type for every implemented modulation input (~25 entries across 18 modules); helpers `getModInputAttenuatorType(moduleType, portName)` and `applyAttenuatorCurve(value, min, max, curve)` exported.
  - **Phase 2 (existing depth-knob curves)** — `pwModDepth` (Type I) and the six `fmDepth` knobs (Type II) tagged with `curve` in their param defs. `setParam` now consults the `curve` field and applies the appropriate transformation when writing to the bound `AudioParam`. UI-displayed knob values are unchanged; only the audio-graph response curve changes (Type II FM knobs now feel finer at low settings, matching spec).
- **Severity:** Critical (rated before resolution).
- **Disposition:** `fix-toward-spec — FULLY RESOLVED 2026-05-24` across five phases (1+2 in a single PR, then 5, 3, 4 in order):
  - **Phase 3 (per-port attenuator UI)** — RESOLVED 2026-05-24 (PR `feat/attenuator-phase-3-per-port-ui`): `AudioEngine._autoAddAttenuators` runs after every `_create*` and wraps each modulation input enumerated in `PORT_ATTENUATOR_TYPES` with a `GainNode` (defaulting to 1.0 for pass-through) plus a `<port>Atten` param. Bipolar Type III ports (filter `FreqMod*`) get min=-1, max=1 ranges. The Note-source pattern is preserved via `mod._originalInputs`: when `Keyboard`/`NoteSeqA`/`NoteSeqB` connects `Note → PitchMod*`, `connect`/`disconnect` track the original `AudioParam` so the keyboard still replaces the oscillator's pitch instead of routing through the attenuator. Existing depth knobs (`fmDepth`, `pwModDepth`) and ports already wrapped in a `GainNode` are detected via `typeof target.connect === "function"` and skipped. Saved patches load with `Atten` params defaulting to 1.0, preserving audible behaviour.
  - **Phase 4 (max-modulation summing/clamping)** — RESOLVED 2026-05-24 by disposition (PR `feat/attenuator-phase-4-disposition`): **addressed by Phase 3 rather than implemented literally**. The spec's ±64 sum-clamp is a hardware-mediated alternative to per-port attenuators — when the user has no per-input control, the hardware sums everything and clips at a safe limit to prevent runaway. In our software impl with full per-port attenuator knobs (Phase 3), the user has direct control over each input's contribution, so the runtime clamp serves no useful purpose. Literal implementation considered and rejected:
    - **Unit translation fails.** Spec "±64 units" maps to different Web Audio units per param (Hz for oscillator/filter frequency, normalized 0..1 for gain/pan). A faithful translation would require per-param unit metadata + a CV-to-natural-unit converter at every modulated AudioParam.
    - **Web Audio already self-limits at typical magnitudes.** LFO/envelope outputs are bounded by ±1; stacking 3 such sources through unity attenuators contributes ±3 Web Audio units to the target AudioParam. For Hz-valued params that's ±3 Hz — inaudible. For gain that's already clamped by the AudioParam's natural range. The runaway scenario the spec clamp guards against doesn't realistically occur in our impl.
    - **A tight clamp would break patches.** If we set the clamp at the spec's literal ±64 in Web Audio units (interpreting "units" as raw values), most patches would be unaffected — but any patch that intentionally uses high `fmDepth` (0..1000 range) would be limited to ±64 Hz of FM, neutering FM synthesis entirely.
    - **WaveShaperNode inherently clamps inputs to ±1**, so a curve-based clipper at limits >1 doesn't actually clip anything — the input is already pre-clipped by the node.
  - If a future hardware-fidelity mode wants literal ±64 unit clamping with per-param unit-translation, the work would be: (1) per-param `naturalUnit: { kind, range }` metadata, (2) a `_modScaler` chain per AudioParam target with unit-aware conversion + WaveShaper clip. Logged here so it isn't lost.
  - **Phase 5 (Type III bipolar curve)** — RESOLVED 2026-05-24 (PR `feat/attenuator-phase-5-bipolar`): `applyAttenuatorCurve` now formally supports Type III as bipolar passthrough; bipolarity comes from the param range (min<0, max>0). The per-port bipolar attenuator UI that consumes this helper lands with Phase 3.

### S3. Layout encoding

- **Spec:** `MODULE_LAYOUTS.md` describes panel illustrations from the PDF — row arrangement, control grouping, control ordering.
- **Impl:** no panel illustration encoding. Module visual layout is computed from `MODULE_DEFS` (`inputs`, `modInputs`, `outputs`) plus the optional `customUIHeight: N` for in-module SVG widgets. The whole "layout" dimension is therefore systemic — nothing per-module to audit until layout is encoded.
- **Severity:** Out-of-scope at the per-module level. Critical at the systemic level if visual fidelity becomes a goal.
- **Disposition:** `fix-toward-spec (blocked: visual-layout fidelity deferred to its own batch with its own methodology)`. See plan Scope Boundaries: "visual-layout audit … future batch with explicit methodology run".

### S4. Non-oscillator master/slave architecture absence

- **Spec:** the master/slave port pattern extends to non-oscillator masters and slaves throughout the spec. Examples:
  - `LFOA` (§3.1) provides `Slv` output (gray); `LFOSlvA-E` (§3.4-3.8) take `Mst` input (gray) for master rate.
  - `ClkGen` (§3.9) provides `Slv` output (gray): "1 BPM = 1 Hz on connected slave LFO at 1:1 ratio."
  - `RandomGen` (§3.12) is described as "Slave LFO" with `Mst` input (gray) and a master-relative rate (0.025 to 38.05x).
  - `RndStepGen` (§3.11) and other slave-class generators in the LFO group follow the same pattern.
- **Impl:** master/slave plumbing exists (`Slv → Mst` virtual port handling in `connect`/`disconnect`, `_slaveTargets[]`, `_recalcFreq()`, `_propagateToSlaves()`) but only oscillator participants are wired. Master oscillators (`OscA`, `OscB`, `OscC`, `MasterOsc`) and slave oscillators (`OscSlvA-E`, `OscSlvFM`, `OscSineBank`) participate; no LFO masters export `Slv`, no LFO slaves are implemented, `ClkGen` has no `Slv` output, `RandomGen` has no `Mst` input.
- **Severity:** Critical (cross-cutting; affects multiple implemented modules — `LFOA`'s missing `Slv` output, `ClkGen`'s missing `Slv` output, `RandomGen`'s missing `Mst` input — plus the absent `LFOSlvA-E`, `RndStepGen`, `ClkRndGen`, `RndPulsGen` modules).
- **Disposition:** `fix-toward-spec (blocked: cross-cutting architectural extension — requires extending the existing Slv → Mst plumbing to non-oscillator masters and slaves, plus implementing the absent LFO/random slave modules; needs its own brainstorm + plan)`.
- **Surfaced:** 2026-05-06 during Unit 3 batch audit. Findings folding to S4: `ClkGen` C4 (missing `Slv` output), `RandomGen` R1 (standalone vs slave-class), `RandomGen` R4 (missing `Mst` input).

### S5. Mute affordance absent

- **Spec:** virtually every spec module with an audio `Out` lists an `M (Button): Mute` (e.g., `BORED_MODULAR_DESIGN.md:139` OscA, `:150` OscB, `:161` OscC, `:317` LFOA, `:439` ADSR-Env, `:798` Shaper, `:702` Amplifier inherits via §6.13). Three Outputs variants (§1.6-§1.8) also have it.
- **Impl:** no per-module mute button anywhere in `src/`. Mute is partially achieved by setting `level` (or equivalent gain param) to zero, but there is no on/off control distinct from level.
- **Severity:** Minor (cross-cutting; affects most modules' control surface; mute can be approximated by zero-gain but loses the "preserve level, just silence" gesture).
- **Disposition:** `fix-toward-spec (blocked: MODULE_DEFS schema currently has no boolean/button widget type distinct from "options" selectors; introducing a per-module Mute button requires the same key/label separation called out in C5 plus a UI rendering decision for binary toggles vs multi-option selectors)`.
- **Surfaced:** 2026-05-12 during Batch 3 full-sweep audit. Findings folding to S5: OscA-F4, OscB-F3, OscC-F4, SpectralOsc-F4, FormantOsc-F4, OscSlvA-F3, OscSlvB-F3, OscSlvC-F3, OscSlvD-F3, OscSlvE-F3, OscSlvFM-F3, OscSineBank-F4, PercOsc-F3, DrumSynth-F5, LFOA-F4, ADSREnv-F4, Filter-F2, FilterC-F3, FilterE-F4, Shaper-F2, Out-F3, Mixer8-F2.

### S6. KBT (keyboard tracking) parameter is cosmetic-only

- **Spec:** `KBT` is either a Knob (Off to 2.0) or a Button (On/Off) depending on module (`BORED_MODULAR_DESIGN.md:122` MstOsc, `:132` OscA, `:146` OscB, `:156` OscC, `:167` SpectralOsc, `:179` FormantOsc, `:527` FilterD, `:538` FilterE, `:553` FilterF). Behaviour: pitch (or filter cutoff) tracks keyboard note offset, multiplied by KBT value.
- **Impl:** `kbt` param exists on MasterOsc, OscB, OscC, SpectralOsc, FormantOsc (mixture of button/knob style), and is *not read anywhere* — `setParam` has no branch that consumes `kbt`, and the keyboard-to-pitch path (`Keyboard.playNote` and `NoteSeqA/B.clockTick`) writes raw frequency to oscillator pitch targets without scaling by any KBT value. The param is stored and displayed but has zero behavioural effect.
- **Severity:** Critical (the labelled control does nothing; the omission affects pitch tracking, which is one of the most fundamental musical behaviours for a synth).
- **Disposition:** `fix-toward-spec (blocked: cross-cutting — wiring KBT through the pitch-target path requires changes in `Keyboard.playNote`, `NoteSeqA.clockTick`, `NoteSeqB.clockTick`, and the slave-osc `_recalcFreq` chain. Also requires a design call on the units (the impl writes raw Hz to `_pitchTargets`; KBT scaling would need to know the keyboard's reference note to compute a delta to scale). Treat as its own brainstorm + plan)`.
- **Surfaced:** 2026-05-12 during Batch 3 full-sweep audit. Findings folding to S6: MstOsc-F5, OscA-F1 (missing kbt param entirely), OscB-F4, OscC-F4 (button vs knob), SpectralOsc-F5, FormantOsc-F5 (button vs knob).

---

## Per-module audits

Group sections appear as their batches are run. Modules not yet audited are listed in the Module Count Summary at the end.

## 1. In/Out Group

### 1.1 Keyboard (impl: `Keyboard`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:45-50` (per-voice keyboard signals).
- **Impl:** `src/AudioEngine.js:1707-1776` (`_createKeyboard`), `src/moduleDefs.js:366-375` (`MODULE_DEFS.Keyboard`).

Per-voice Note / Gate / Vel triplet. Spec also names a `Rel Vel` output. Note pitch is propagated directly to oscillator frequency params via `_pitchTargets` (set in `connect` at `AudioEngine.js:1819`) and `playNote` at `:1746-1753`, bypassing the spec's `-64..+63` unit semantics for raw Hz.

- **Kbd-F1 — Note output signal type divergence.** Spec: bipolar pitch in "units" (E4 = 0, C-1 = -64, G9 = +63). Impl: frequency in Hz, written directly to `OscillatorNode.frequency` or AudioWorklet frequency params (`AudioEngine.js:1739, 1747`). Severity: Critical. Disposition: `keep-as-divergence`. Rationale (cat 1 — DSP-level approximation): Web Audio's `OscillatorNode.frequency` is parameterised in Hz, and routing pitch as Hz lets `_pitchTargets` write directly to oscillator frequency without unit conversion. Spec's `-64..+63` units would require a conversion layer at every pitch sink. Musical behaviour is equivalent.
- **Kbd-F2 — Missing `Rel Vel` output.** Spec defines an additional `Rel Vel (Output, Blue)` unipolar release velocity. Impl emits Note / Gate / Vel only. Severity: Minor. Disposition: `fix-toward-spec (blocked: computer keyboard input doesn't carry release velocity; usable only after MIDI input lands — see CLAUDE.md "Known limitations")`.
- **Kbd-F3 — `Vel` output hardcoded to 0.8.** Spec: unipolar velocity, linear response. Impl: `velOut.offset.setValueAtTime(0.8, now)` at `AudioEngine.js:1741`. Severity: Minor. Disposition: `fix-toward-spec (blocked: computer keyboard input has no velocity dimension; revisit with MIDI)`.
- **Kbd-F4 — Impl-only `octave` param (-2..+4).** No spec equivalent on the per-voice Keyboard module. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): shifts the computer-keyboard mapping without preventing any spec-required behaviour; without MIDI the keyboard would otherwise be range-locked.
- **Kbd-F5 — Port-colour treatment for Note (Blue), Gate (Yellow), Vel (Blue).** Folds to S1.

**Cluster summary (Keyboard):**
- Findings: 4 in-scope + 0 OOS = 4 total (Kbd-F5 folds to S1; not enumerated).
- Dispositions: 2 `keep-as-divergence` (Kbd-F1 cat 1, Kbd-F4 cat 2), 2 `fix-toward-spec (blocked)` (Kbd-F2, Kbd-F3 — both blocked on MIDI input).
- Code change applied: none (audit-only).
- Patch-load impact: none.

### 1.7 Output (impl: `Output`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:83-88` (2 Outputs variant — closest match for impl's `InL`/`InR` shape).
- **Impl:** `src/AudioEngine.js:1562-1575` (`_createOutput`), `src/moduleDefs.js:376-384`.

Single stereo audio sink. Both `InL` and `InR` route to the same `gain` node (`AudioEngine.js:1569`), which connects to `masterGain`. Spec defines three Output variants (§1.6 1-output, §1.7 2-outputs, §1.8 4-outputs); impl picks one shape.

- **Out-F1 — Single-variant vs three spec variants.** Spec defines 3 Output modules with different IO counts. Impl ships only the 2-input shape. Severity: OOS (the other two variants are coverage gaps, listed in Module Count Summary as missing modules).
- **Out-F2 — Missing `Dest (Selector)`.** Spec §1.7: bus pair 1/2, 3/4, or CVA. Impl always routes to a single `masterGain` (`AudioEngine.js:1565`). Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 3 — durable design rationale): Web Audio has a single output destination per `AudioContext`; spec's bus routing presumes a multi-bus hardware architecture the impl doesn't model. No user-visible affordance is lost.
- **Out-F3 — Missing `M (Button) Mute`.** Folds to S5.
- **Out-F4 — `InL` and `InR` are summed mono, not stereo.** Both inputs map to the same `GainNode` (`AudioEngine.js:1569`) — there is no per-channel separation. Severity: Minor. Disposition: `fix-toward-spec (blocked: requires per-channel gain stages and a stereo merge to honour L/R as distinct; could land alongside §1.7 Dest selector if multi-bus is ever modelled)`.
- **Out-F5 — Default `level = 0.5`.** Spec is silent on the Level default. Severity: OOS.

**Cluster summary (Output):**
- Findings: 2 in-scope + 2 OOS = 4 total (Out-F3 folds to S5; not enumerated).
- Dispositions: 1 `keep-as-divergence` (Out-F2 cat 3), 1 `fix-toward-spec (blocked)` (Out-F4), 2 OOS (Out-F1, Out-F5).
- Code change applied: none.
- Patch-load impact: none.

## 2. Oscillator Group

### 2.1 MasterOsc (impl: `MasterOsc`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:118-125`.
- **Impl:** `src/AudioEngine.js:621-640` (`_createMasterOsc`), `src/moduleDefs.js:59-67`.

Pitch-only controller. No audio output; `Slv` carries frequency in Hz via `ConstantSourceNode.offset`. Coarse/fine recompute frequency in `setParam` `MasterOsc` branch (`AudioEngine.js:2131-2140`) and `_propagateToSlaves`.

- **MstOsc-F1 — Impl-only `frequency` param (20-8000 Hz, default 220).** Spec defines pitch only via Coarse + Fine + Pitch Mod inputs + KBT (no direct frequency knob). Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): direct-Hz seed lets users tune without going through semitone arithmetic; coarse/fine still apply as offsets on top of `frequency` per the `setParam` branch.
- **MstOsc-F2 — Coarse range ±60 vs spec C-1..G9 (~±64 semitones from middle).** Severity: Minor. Disposition: `fix-toward-spec` (applied 2026-05-14 in batch 5 — `coarse.min/max: ±60 → ±64`).
- **MstOsc-F3 — Fine range ±50 (cents) vs spec ±half-semitone with 128 discrete steps.** Magnitude matches (±0.5 semitone); the discretization is missing. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 1 — DSP approximation): continuous fine-tune is the Web Audio idiom; 128-step quantization is a hardware UI affordance, not a behavioural requirement.
- **MstOsc-F4 — KBT (Button) matches spec form.** Match — no finding.
- **MstOsc-F5 — KBT param cosmetic.** Folds to S6.
- **MstOsc-F6 — Missing Hz/Note `Display`.** Folds to S3.
- **MstOsc-F7 — Pitch Mod port colour (spec Blue, impl yellow).** Folds to S1.

**Cluster summary (MasterOsc):**
- Findings: 3 in-scope + 0 OOS = 3 total (F4 match; F5/F6/F7 fold to S6/S3/S1).
- Dispositions: 2 `keep-as-divergence` (F1 cat 2, F3 cat 1), 1 `fix-toward-spec` applied (F2 — coarse widening in batch 5).
- Code change applied: `src/AudioEngine.js:636` — `coarse.min/max: -60..60 → -64..64` (batch 5, 2026-05-14).
- Patch-load impact: widening (safe).

### 2.2 OscA (impl: `OscA`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:127-140`.
- **Impl:** `src/AudioEngine.js:126-165` (`_createOscA`, uses `sync-osc-processor` AudioWorklet), `src/moduleDefs.js:5-13`.

Full-featured master with Sync, FMA, PWM, and Slv output. Pitch / fine / waveform / PW params present.

- **OscA-F1 — Missing `KBT (Knob): Off to 2.0` param.** Compare to OscB/OscC which have a `kbt` knob param. Severity: Minor. Disposition: `fix-toward-spec (blocked: adding the param without the behaviour would deepen S6 — wire it once S6 is resolved)`.
- **OscA-F2 — Fine range ±100 (cents) vs spec ±50 (half semitone, 128 steps).** Impl's range is double spec. Severity: Minor. Disposition: `fix-toward-spec` (applied 2026-05-15 in batch 6 — `fine.min/max: ±100 → ±50`). Saved-patch scan waived: project is still in development mode; maintainer confirmed no saved patches need preservation.
- **OscA-F3 — Coarse range ±60 vs spec C-1..G9 (~±64).** Same widening issue as MstOsc-F2. Severity: Minor. Disposition: `fix-toward-spec` (applied 2026-05-14 in batch 5 — `coarse.min/max: ±60 → ±64`).
- **OscA-F4 — Missing `M (Button) Mute`.** Folds to S5.
- **OscA-F5 — `pwModDepth` impl-only mod attenuator (0..1).** Spec describes a `PWidth Mod (Input, Red)` [Type I] with no separate impl-only depth knob — depth is the attenuator. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): provides per-input scaling that spec assumes hardware attenuator hardware provides; folds into S2 once attenuator metadata is threaded.
- **OscA-F6 — `fmDepth` impl-only mod attenuator (0..1000).** Same shape as F5; same disposition (`keep-as-divergence`, cat 2; folds to S2).
- **OscA-F7 — Pitch Mod / FMA / Sync / PWMod port colours (spec Red, impl yellow/blue).** Folds to S1.
- **OscA-F8 — Missing Hz/Note `Display`.** Folds to S3.
- **OscA-F9 — Default level 0.8 (spec silent).** Severity: OOS.

**Cluster summary (OscA):**
- Findings: 5 in-scope + 1 OOS = 6 total (F4/F7/F8 fold to S5/S1/S3).
- Dispositions: 1 `fix-toward-spec (blocked)` (F1 — depends on S6), 2 `fix-toward-spec` applied (F3 — coarse widening in batch 5; F2 — fine narrowing in batch 6), 2 `keep-as-divergence` (F5 cat 2, F6 cat 2), 1 OOS (F9).
- Code change applied: `src/AudioEngine.js:157` — `coarse.min/max: -60..60 → -64..64` (batch 5, 2026-05-14); `src/AudioEngine.js:158` — `fine.min/max: -100..100 → -50..50` (batch 6, 2026-05-15).
- Patch-load impact: F3 widening (safe). F2 narrowing — saved-patch scan waived per dev-mode statement in batch 6.

### 2.3 OscB (impl: `OscB`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:142-151`.
- **Impl:** `src/AudioEngine.js:167-199` (`_createOscB`, uses native `OscillatorNode`), `src/moduleDefs.js:14-22`.

Master oscillator with FMA, no Sync, no PWM (spec also has `PWidth Mod` but impl ships only Sine/Saw/Sq/Tri waveforms with FM — PWM mention in spec is for the Square waveform, not a separate input).

- **OscB-F1 — Missing `PWidth Mod (Input, Blue)` input.** Spec §2.3: separate `PWidth Mod (Input, Blue)` with Type I attenuator (PWM from initial 50% width). Impl has no `PwMod` input on OscB; impl uses native `OscillatorNode` which has no pulse-width param. Severity: Critical (loses a spec input). Disposition: `fix-toward-spec (blocked: native OscillatorNode has no pulse-width control. Would require swapping to the `pulse-processor` AudioWorklet for the Square wave or adding a separate PW oscillator. Cross-cuts the DSP graph)`.
- **OscB-F2 — Fine range ±50 (cents).** Spec ±half-semitone matches; 128-step quantization missing (folds with MstOsc-F3 rationale). Match in magnitude. No finding.
- **OscB-F3 — Missing `M (Button) Mute`.** Folds to S5.
- **OscB-F4 — KBT param cosmetic.** Folds to S6.
- **OscB-F5 — `fmDepth` impl-only attenuator.** Same shape as OscA-F6; `keep-as-divergence` cat 2, folds to S2.
- **OscB-F6 — PitchMod / FMA port colours.** Folds to S1.
- **OscB-F7 — Spec describes "clicking selected waveform button mutes output".** Impl has no per-waveform mute click affordance. Severity: Minor. Disposition: `fix-toward-spec (blocked: depends on per-module Mute affordance from S5 + per-waveform-button UI gesture)`.
- **OscB-F8 — Default level 0.8 (spec silent).** Severity: OOS.
- **OscB-F9 — Coarse range ±60 vs spec ±64.** Spec §2.3 says "Coarse/Fine/KBT: Same as OscA" (`BORED_MODULAR_DESIGN.md:145`), so the spec coarse range is C-1..G9 ≈ ±64 semitones from middle, matching OscA / MstOsc / OscC / FormantOsc. Impl is ±60. Severity: Minor. Disposition: `fix-toward-spec (blocked: widening — defer to fix batch; patch-load-safe per playbook §5)`. **Surfaced:** 2026-05-14 during Batch 5 (range-widening cluster); was missed in the original Batch 3 audit pass. Eligible for inclusion in any future widening cluster alongside MstOsc-F2 / OscA-F3 / OscC-F6 / FormantOsc-F3 (which were resolved in Batch 5).

**Cluster summary (OscB):**
- Findings: 5 in-scope + 1 OOS = 6 total (F3/F4/F6 fold; F5 folds via S2; F2 is a match).
- Dispositions: 3 `fix-toward-spec (blocked)` (F1, F7, F9 — backfilled audit gap), 1 `keep-as-divergence` (F5 cat 2), 1 OOS (F8).
- Code change applied: none.
- Patch-load impact: F1 would-be additive (safe). F9 would-be widening (safe).

### 2.4 OscC (impl: `OscC`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:153-162`.
- **Impl:** `src/AudioEngine.js:201-234` (`_createOscC`), `src/moduleDefs.js:23-31`.

Sine-only master with AM and FMA. Single Pitch Mod input matches spec.

- **OscC-F1 — Fine range ±50 cents (match magnitude).** No finding.
- **OscC-F2 — Missing `M (Button) Mute`.** Folds to S5.
- **OscC-F3 — KBT widget form: impl knob (0..2), spec button.** Severity: Minor. Disposition: `fix-toward-spec (blocked: depends on S6 — once behaviour wires up, settle widget form to match spec)`.
- **OscC-F4 — KBT param cosmetic.** Folds to S6 (separate finding from F3 for clarity).
- **OscC-F5 — `fmDepth` impl-only attenuator.** `keep-as-divergence` cat 2; folds to S2.
- **OscC-F6 — Coarse range ±60 vs ~±64.** Same widening pattern as MstOsc-F2. Disposition: `fix-toward-spec` (applied 2026-05-14 in batch 5 — `coarse.min/max: ±60 → ±64`).
- **OscC-F7 — Port colours.** Folds to S1.
- **OscC-F8 — Default level 0.6 (spec silent).** OOS.

**Cluster summary (OscC):**
- Findings: 3 in-scope + 1 OOS = 4 total.
- Dispositions: 1 `fix-toward-spec (blocked)` (F3 — depends on S6), 1 `fix-toward-spec` applied (F6 — coarse widening in batch 5), 1 `keep-as-divergence` (F5 cat 2), 1 OOS (F8).
- Code change applied: `src/AudioEngine.js:228` — `coarse.min/max: -60..60 → -64..64` (batch 5, 2026-05-14).
- Patch-load impact: widening (safe).

### 2.5 SpectralOsc (impl: `SpectralOsc`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:164-174`.
- **Impl:** `src/AudioEngine.js:236-317` (`_createSpectralOsc`), `src/moduleDefs.js:131-139`.

Spec describes an additive oscillator with synced noise generating overtones; impl uses 8 stacked sine oscillators with per-partial rolloff and a `spectralShape` knob controlling the upper-partial bus. The DSP approach differs but the user-facing controls (Coarse/Fine/KBT/Spectral Shape/Partials/PitchMod/FMA/Slv/Out) largely line up.

- **SpcOsc-F1 — Coarse range ±24 vs spec C-1..G9 (~±64).** Severity: Minor. Disposition: `fix-toward-spec (blocked: widening — defer to fix batch)`.
- **SpcOsc-F2 — Additive-via-sine-stack vs spec "additive-style from synced noise".** DSP graph divergence. Severity: OOS (CLAUDE.md scopes DSP-level approximation to homage; sine-stack with rolloff produces equivalent additive-style overtone control without requiring the synced-noise approach). Disposition: `keep-as-divergence`. Rationale (cat 1 — DSP-level approximation tolerated by spec).
- **SpcOsc-F3 — Missing dedicated `Spectral Shape (Blue Mod Input)` as named modulation port.** Spec §2.5 lists "Spectral Shape (Knob + Blue Mod Input)". Impl has `ShapeMod` as a modInput at `moduleDefs.js:137`. Match in shape, just port-name `ShapeMod` vs spec implicit name "Spectral Shape Mod". Severity: Minor (cosmetic naming). Disposition: `fix-toward-spec (blocked: MODULE_DEFS key/label separation needed — see C5)`.
- **SpcOsc-F4 — Missing `M (Button) Mute`.** Folds to S5.
- **SpcOsc-F5 — KBT cosmetic.** Folds to S6.
- **SpcOsc-F6 — `fmDepth` impl-only attenuator.** `keep-as-divergence` cat 2; folds to S2.
- **SpcOsc-F7 — Port colours.** Folds to S1.
- **SpcOsc-F8 — Default level 0.5 (spec silent).** OOS.
- **SpcOsc-F9 — Fine range ±100 (cents) vs spec ±half-semitone (±50).** Same shape as OscA-F2 (which was resolved in Batch 6). Impl's range is double spec. Severity: Minor. Disposition: `fix-toward-spec (blocked: narrowing — would normally require playbook §5 saved-patch scan; Batch 6 established a dev-mode waiver precedent. Eligible for inclusion in any future narrowing cluster while the dev-mode waiver still applies)`. **Surfaced:** 2026-05-15 during Batch 6 (range-narrowing cluster); was missed in the original Batch 3 audit pass.

**Cluster summary (SpectralOsc):**
- Findings: 4 in-scope + 2 OOS = 6 total.
- Dispositions: 1 `keep-as-divergence` (F2 cat 1), 3 `fix-toward-spec (blocked)` (F1 — widening, F3 — depends on C5 key/label separation, F9 — narrowing audit gap from Batch 6), 1 `keep-as-divergence` (F6 cat 2), 2 OOS (F2 also borderline, F8).
- Code change applied: none.
- Patch-load impact: F1 would-be widening (safe). F9 would-be narrowing (saved-patch scan / dev-mode waiver per Batch 6 precedent).

### 2.6 FormantOsc (impl: `FormantOsc`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:176-185`.
- **Impl:** `src/AudioEngine.js:556-617` (`_createFormantOsc`), `src/moduleDefs.js:50-58`.

Sawtooth source through three bandpass formants; vowel selects formant frequency triple, timbre interpolates to next vowel. Has Slv output for slave participation.

- **FmtOsc-F1 — Vowel selector A/E/I/O/U vs spec "1-127 variations plus Random".** Spec describes `Timbre (Knob + Display): 1-127 variations plus Random`. Impl: discrete vowel selector + continuous `timbre` 0..1 for interpolation. The discrete `vowel` param is impl-only; spec doesn't define a vowel selector — its `timbre` is a continuous 1-127 knob that includes all variations. Severity: Minor (different control shape; same musical effect family). Disposition: `keep-as-divergence`. Rationale (cat 3 — durable design rationale): vowel-letter selectors are more learnable for users without prior modular fluency *and* the impl's `vowel + timbre` decomposition models the same continuum more transparently (each vowel is a labelled point, timbre interpolates between them).
- **FmtOsc-F2 — Missing `Timbre Mod (Input, Blue)` [Type I].** Spec §2.6 has a dedicated timbre modulation input. Impl has no `TimbreMod` modInput. Severity: Minor. Disposition: `fix-toward-spec (blocked: implementation requires routing a control signal to the vowel-interpolation logic in `setParam` FormantOsc `timbre` branch — viable, just hasn't been wired)`.
- **FmtOsc-F3 — Coarse range ±60 vs spec ±64.** Widening. Same disposition as MstOsc-F2. `fix-toward-spec` (applied 2026-05-14 in batch 5 — `coarse.min/max: ±60 → ±64`).
- **FmtOsc-F4 — Missing `M (Button) Mute`.** Folds to S5.
- **FmtOsc-F5 — KBT impl-knob vs spec-button; cosmetic.** Folds to S6.
- **FmtOsc-F6 — Pitch Mod port colours.** Folds to S1.
- **FmtOsc-F7 — Display absent.** Folds to S3.

**Cluster summary (FormantOsc):**
- Findings: 3 in-scope + 0 OOS = 3 total.
- Dispositions: 1 `keep-as-divergence` (F1 cat 3), 1 `fix-toward-spec (blocked)` (F2), 1 `fix-toward-spec` applied (F3 — coarse widening in batch 5).
- Code change applied: `src/AudioEngine.js:609` — `coarse.min/max: -60..60 → -64..64` (batch 5, 2026-05-14).
- Patch-load impact: widening (safe).

### 2.7 OscSlvA (impl: `OscSlvA`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:187-199`.
- **Impl:** `src/AudioEngine.js:791-793` (`_createOscSlvA`) → `_makeSyncSlaveOsc` (`AudioEngine.js:720-789`), `src/moduleDefs.js:68-76`.

4-waveform slave with Sync / FMA / AM / `Mst` virtual input. Uses `sync-osc-processor` for sync.

- **OscSlvA-F1 — Partials range 0.03125..32 vs spec "1:32 to 32:1" (= 0.03125..32).** Match.
- **OscSlvA-F2 — Fine range ±50 cents matches spec ±half-semitone in magnitude.** 128-step quantization missing (covered by MstOsc-F3 rationale; folds to S3 display rationale).
- **OscSlvA-F3 — Missing `M (Button) Mute`.** Folds to S5.
- **OscSlvA-F4 — Mst port colour: impl-blue (input) vs spec gray (slave).** Folds to S1 (Slv/Mst gray semantics are part of port-colour systemic).
- **OscSlvA-F5 — Sync / FMA / AM port colours.** Folds to S1.
- **OscSlvA-F6 — `fmDepth` impl-only attenuator (0..1000).** `keep-as-divergence` cat 2; folds to S2.
- **OscSlvA-F7 — Display absent.** Folds to S3.
- **OscSlvA-F8 — Default level 0.8 (spec silent).** OOS.

**Cluster summary (OscSlvA):**
- Findings: 1 in-scope + 1 OOS = 2 total (F1/F2 are matches; F3/F4/F5/F7 fold; F6 folds to S2).
- Dispositions: 1 `keep-as-divergence` (F6 cat 2), 1 OOS (F8).
- Code change applied: none.
- Patch-load impact: none.

### 2.8 OscSlvB (impl: `OscSlvB`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:201-208`.
- **Impl:** `src/AudioEngine.js:794-824` (`_createOscSlvB`, uses `pulse-processor` AudioWorklet), `src/moduleDefs.js:77-85`.

Pulse/Square slave with PW + PwMod input. Uses the bespoke `pulse-processor` worklet for PW control.

- **OscSlvB-F1 — Partials/Detune/Fine ranges match spec.** No finding.
- **OscSlvB-F2 — PW range 0.01..0.99 matches spec "1%-99%" (mapped to 0-1).** No finding.
- **OscSlvB-F3 — Missing `M (Button) Mute`.** Folds to S5.
- **OscSlvB-F4 — `Mst` virtual gray semantics.** Folds to S1.
- **OscSlvB-F5 — `PwMod` port colour (spec Red, impl yellow).** Folds to S1.
- **OscSlvB-F6 — `PwMod` Type I attenuator metadata.** Folds to S2.
- **OscSlvB-F7 — Display absent.** Folds to S3.
- **OscSlvB-F8 — Default level 0.8 (spec silent).** OOS.

**Cluster summary (OscSlvB):**
- Findings: 0 in-scope + 1 OOS = 1 total (all others fold).
- Dispositions: 1 OOS (F8).
- Code change applied: none.
- Patch-load impact: none.

### 2.9 OscSlvC (impl: `OscSlvC`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:210-216`.
- **Impl:** `src/AudioEngine.js:825-827` (`_createOscSlvC`) → `_makeSlaveOsc` (`AudioEngine.js:642-718`), `src/moduleDefs.js:86-94`.

Sawtooth-only slave with FMA. Uses native `OscillatorNode`.

- **OscSlvC-F1 — Partials/Detune/Fine match spec.** No finding.
- **OscSlvC-F2 — No `Sync (Input, Red)` listed in spec for OscSlvC.** Match — spec only has FMA. No finding.
- **OscSlvC-F3 — Missing `M (Button) Mute`.** Folds to S5.
- **OscSlvC-F4 — Port colours / Mst gray / FMA Red / FMA Type II.** Folds to S1 / S2.
- **OscSlvC-F5 — `fmDepth` attenuator (0..1000).** `keep-as-divergence` cat 2; folds to S2.
- **OscSlvC-F6 — Display absent.** Folds to S3.
- **OscSlvC-F7 — Default level 0.8 (spec silent).** OOS.

**Cluster summary (OscSlvC):**
- Findings: 0 in-scope + 1 OOS = 1 total.
- Dispositions: 1 `keep-as-divergence` (F5 cat 2), 1 OOS (F7).
- Code change applied: none.
- Patch-load impact: none.

### 2.10 OscSlvD (impl: `OscSlvD`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:218-224`.
- **Impl:** `src/AudioEngine.js:828-830` (`_createOscSlvD`) → `_makeSlaveOsc`, `src/moduleDefs.js:95-103`.

Triangle-only slave with FMA. Same factory as OscSlvC; waveform is the only difference.

- **OscSlvD-F1 — Partials/Detune/Fine match spec.** No finding.
- **OscSlvD-F2 — Missing `M (Button) Mute`.** Folds to S5.
- **OscSlvD-F3 — Port colours / Mst gray / FMA Red.** Folds to S1.
- **OscSlvD-F4 — `fmDepth` attenuator.** `keep-as-divergence` cat 2; folds to S2.
- **OscSlvD-F5 — Default level 0.8 (spec silent).** OOS.

**Cluster summary (OscSlvD):**
- Findings: 0 in-scope + 1 OOS = 1 total.
- Dispositions: 1 `keep-as-divergence` (F4 cat 2), 1 OOS (F5).
- Code change applied: none.
- Patch-load impact: none.

### 2.11 OscSlvE (impl: `OscSlvE`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:226-233`.
- **Impl:** `src/AudioEngine.js:831-833` (`_createOscSlvE`) → `_makeSlaveOsc`, `src/moduleDefs.js:104-112`.

Sine-only slave with FMA + AM.

- **OscSlvE-F1 — Partials/Detune/Fine match spec.** No finding.
- **OscSlvE-F2 — Missing `M (Button) Mute`.** Folds to S5.
- **OscSlvE-F3 — Port colours / Mst gray / FMA Red / AM Red.** Folds to S1.
- **OscSlvE-F4 — `fmDepth` attenuator.** `keep-as-divergence` cat 2; folds to S2.
- **OscSlvE-F5 — Default level 0.8 (spec silent).** OOS.

**Cluster summary (OscSlvE):**
- Findings: 0 in-scope + 1 OOS = 1 total.
- Dispositions: 1 `keep-as-divergence` (F4 cat 2), 1 OOS (F5).
- Code change applied: none.
- Patch-load impact: none.

### 2.12 OscSineBank (impl: `OscSineBank`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:235-246`.
- **Impl:** `src/AudioEngine.js:838-901` (`_createOscSineBank`), `src/moduleDefs.js:122-130`.

Six independent sine oscillators with per-osc Tune / Fine / Level / AM, plus Mst (gray slave input), Sync, MixIn.

- **SinBnk-F1 — Per-osc Partial selector absent in impl panel.** Spec §2.12: "Partial Selectors x6: Ratio 1:32 to 32:1 per oscillator." Impl has per-osc `tune{N}` params (0.03125..32) that serve the same role. Match in mechanism; spec calls them selectors (discrete steps), impl is continuous knob. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 1 — DSP approximation): continuous tune is the Web Audio idiom; discrete 1:32..32:1 steps would be a hardware UI quantization, not a behavioural requirement.
- **SinBnk-F2 — Per-osc Mute buttons absent.** Spec §2.12: "M x6 (Buttons): Per-oscillator mute." Impl has per-osc `level{N}` knobs; zero-level is the only way to silence. Severity: Minor. Disposition: `fix-toward-spec (blocked: depends on S5 — needs per-osc binary widget alongside the level knob)`.
- **SinBnk-F3 — Master `masterLevel` (0..1) maps to spec's lack of explicit master level.** Spec doesn't define a master level for the sum — output is just bipolar sum. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): per-instance gain on the sum is a small affordance that doesn't break spec behaviour; spec doesn't preclude it.
- **SinBnk-F4 — Missing `M (Button) Mute` at module level (separate from per-osc mutes).** Folds to S5.
- **SinBnk-F5 — Mst gray / Sync Red / MixIn Red / AM Red port colours.** Folds to S1.
- **SinBnk-F6 — AM[1-6] Type I attenuator metadata.** Folds to S2.
- **SinBnk-F7 — Default level1 = 1, level2..6 = 0.5/N (spec silent).** OOS.

**Cluster summary (OscSineBank):**
- Findings: 3 in-scope + 1 OOS = 4 total.
- Dispositions: 2 `keep-as-divergence` (F1 cat 1, F3 cat 2), 1 `fix-toward-spec (blocked)` (F2 — depends on S5), 1 OOS (F7).
- Code change applied: none.
- Patch-load impact: none.

### 2.13 OscSlvFM (impl: `OscSlvFM`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:248-256`.
- **Impl:** `src/AudioEngine.js:834-836` (`_createOscSlvFM`) → `_makeSyncSlaveOsc`, `src/moduleDefs.js:113-121`.

Sine slave optimised for classic FM. Has Sync, FMB, octShift (-3 to +3).

- **OscSlvFM-F1 — `octShift` range -3..+3 vs spec "-3 Oct (Button): Transpose 3 octaves below master".** Spec describes only a *single* -3 octave button; impl exposes a 7-position octave shift (-3..+3). Severity: Minor (impl gives more flexibility). Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): -3..+3 spans the spec's single-button affordance and adds positive shift; spec's single -3 button is a subset of this range. Doesn't replace any spec feature.
- **OscSlvFM-F2 — Missing `M (Button) Mute`.** Folds to S5.
- **OscSlvFM-F3 — Port colours / Mst gray / Sync Red / FMB Red [Type II].** Folds to S1 / S2.
- **OscSlvFM-F4 — `fmDepth` attenuator.** `keep-as-divergence` cat 2; folds to S2.
- **OscSlvFM-F5 — Display absent.** Folds to S3.
- **OscSlvFM-F6 — Default level 0.8 (spec silent).** OOS.

**Cluster summary (OscSlvFM):**
- Findings: 1 in-scope + 1 OOS = 2 total.
- Dispositions: 2 `keep-as-divergence` (F1 cat 2, F4 cat 2), 1 OOS (F6).
- Code change applied: none.
- Patch-load impact: none.

### 2.14 Noise (impl: `Noise`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:258-261`.
- **Impl:** `src/AudioEngine.js:403-431` (`_createNoise`), `src/moduleDefs.js:32-40`.

White / Pink noise generator. Impl uses pre-rendered buffer; `color` toggle swaps source buffer (handled in `setParam` Noise branch at `AudioEngine.js:2046-2058` — buffer can't change after `start()`).

- **Noise-F1 — `color` discrete {white, pink} vs spec "White/Colored (Knob): Blends from white to colored".** Spec describes a continuous blend knob. Impl is binary. Severity: Minor (the continuous knob would crossfade between white and a pink-filtered signal). Disposition: `fix-toward-spec (blocked: requires mixing two buffer sources with crossfade gains rather than swapping at setParam time; modest refactor)`.
- **Noise-F2 — Out port colour (spec Red, impl red — match in colour-name but treated as output-red in S1 scheme).** Folds to S1.
- **Noise-F3 — Default level 0.3 (spec silent).** OOS.

**Cluster summary (Noise):**
- Findings: 1 in-scope + 1 OOS = 2 total.
- Dispositions: 1 `fix-toward-spec (blocked)` (F1 — requires crossfade refactor), 1 OOS (F3).
- Code change applied: none.
- Patch-load impact: F1 would-be no rename / no narrowing (additive — adds an `amount` interpretation rather than swapping the param key); safe.

### 2.15 PercOsc (impl: `PercOsc`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:263-274`.
- **Impl:** `src/AudioEngine.js:319-401` (`_createPercOsc`), `src/moduleDefs.js:140-148`.

Percussive sine with click + punch. `trigger()` schedules amplitude decay + optional pitch sweep on punch. Connected via gate-target tracking.

- **PercOsc-F1 — Pitch range 20..8000 Hz vs spec "C-1 to G9" (~8 Hz to 12.5 kHz).** Spec range is wider on both ends. Severity: Minor. Disposition: `fix-toward-spec` (applied 2026-05-14 in batch 5 — `frequency.min/max: 20..8000 → 8..12544` Hz, rounded from spec's 8.18..12543.85).
- **PercOsc-F2 — Fine range ±50 cents matches spec.** No finding.
- **PercOsc-F3 — Missing `M (Button) Mute`.** Folds to S5.
- **PercOsc-F4 — Trig / Amp / Pitch Mod port colours.** Folds to S1.
- **PercOsc-F5 — Decay range 0.005..4 s vs spec (no explicit range).** Spec silent on numeric range. Severity: OOS.
- **PercOsc-F6 — Display absent.** Folds to S3.
- **PercOsc-F7 — Default level 0.8, decay 0.3, click 0.3 (spec silent).** OOS.

**Cluster summary (PercOsc):**
- Findings: 1 in-scope + 2 OOS = 3 total.
- Dispositions: 1 `fix-toward-spec` applied (F1 — pitch widening in batch 5), 2 OOS (F5, F7).
- Code change applied: `src/AudioEngine.js:364` — `frequency.min/max: 20..8000 → 8..12544` Hz (batch 5, 2026-05-14).
- Patch-load impact: widening (safe).

### 2.16 DrumSynth (impl: `DrumSynth`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:276-298`.
- **Impl:** `src/AudioEngine.js:433-554` (`_createDrumSynth`), `src/moduleDefs.js:41-49`.

Integrated analog drum: dual osc (master + slave with ratio), multimode noise filter with sweep/decay, bend section, click, noise level. Triggered via gate-target tracking.

- **Drum-F1 — Master Pitch range 20..784 Hz vs spec "20-784 Hz".** Match.
- **Drum-F2 — Slave Ratio 1..6.26 vs spec "1:1 to 6.26".** Match.
- **Drum-F3 — Decay ranges 0.0005..45 s vs spec "0.5ms to 45s".** Match (0.5 ms = 0.0005 s).
- **Drum-F4 — Filter modes LP/BP/HP match spec "HP/BP/LP".** Match.
- **Drum-F5 — Missing `M (Button) Mute`.** Folds to S5.
- **Drum-F6 — Missing `Preset (Selector + Display)` for factory presets.** Severity: Minor. Disposition: `fix-toward-spec (blocked: preset catalogue not authored; presets are out-of-scope for a fidelity batch — would need a separate preset-design exercise)`.
- **Drum-F7 — `Trig` port spec Yellow, impl yellow (modulator).** Folds to S1.
- **Drum-F8 — `Vel Mod` and `Pitch Mod` port colours / attenuator types.** Folds to S1 / S2.
- **Drum-F9 — Display elements (Master Pitch, Slave Ratio, Tune Decay, Preset).** Folds to S3.
- **Drum-F10 — Default level 0.8 (spec silent).** OOS.

**Cluster summary (DrumSynth):**
- Findings: 1 in-scope + 1 OOS = 2 total (F1-F4 all matches).
- Dispositions: 1 `fix-toward-spec (blocked)` (F6 — preset design out-of-scope of fidelity), 1 OOS (F10).
- Code change applied: none.
- Patch-load impact: none.

## 3. LFO Group

### 3.1 LFOA (impl: `LFOA`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:306-318`.
- **Impl:** `src/AudioEngine.js:1105-1135` (`_createLFOA`), `src/moduleDefs.js:206-214`. `setParam` LFOA branch at `AudioEngine.js:2067-2076` handles `range` multiplier.

Master LFO with Out + SlvOut, Rst input, RateMod input, range (hi/lo/sub) multiplier, and 5 waveforms (sine/saw/sq/tri/random).

- **LFOA-F1 — Rate range 0.05..40 Hz vs spec "699 s/cycle to 392 Hz" (≈ 0.00143..392 Hz).** Impl range is much narrower on both ends. Severity: Minor. Disposition: `fix-toward-spec (blocked: requires extending the OscillatorNode frequency or using a different rate source. Lo and Sub range multipliers don't currently reach spec's lower bound. Widen rate.max to 392 in a routine cluster pass; range narrowing for `rate.max: 40` is the smaller risk and would be widening — patch-load-safe)`.
- **LFOA-F2 — Range multipliers Hi/Lo/Sub: impl 1.0 / 0.1 / 0.01 vs spec "Hi: 0.26-392 Hz. Lo: 0.02-24.4 Hz. Sub: 699s-5.46s per cycle".** Magnitudes differ. Severity: Minor. Disposition: `fix-toward-spec (blocked: depends on F1 — broader rate range will require re-deriving the multipliers)`.
- **LFOA-F3 — Phase param exists (0-360) vs spec "-180 to +177".** Range and units differ; impl shows the same angular concept but uses unsigned 0-360 instead of signed ±180. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 1 — DSP approximation): 0..360 is the more common convention in software UI; the underlying phase wraps to the same waveform start position. Musical behaviour is equivalent.
- **LFOA-F4 — Missing `M (Button) Mute`.** Folds to S5.
- **LFOA-F5 — Missing `Mono (Button)` for poly-voice sync.** Spec: `Mono (Button): Sync across all voices in polyphonic patches.` Impl has no Mono toggle. Severity: OOS (impl is monophonic — no poly voice areas). Disposition: `keep-as-divergence`. Rationale (cat 3 — durable design rationale): impl runs a single voice graph, so per-voice-area-sync has no meaning. Adding the button as a cosmetic-only widget would deepen S6's pattern.
- **LFOA-F6 — Missing `KBT (Knob): Off to 2.0`.** Severity: OOS (LFOA's KBT would scale rate by keyboard pitch; impl has no kbt param on LFOs). Disposition: `fix-toward-spec (blocked: depends on S6 — no point adding cosmetic-only LFO KBT)`.
- **LFOA-F7 — Rate Mod port colour (spec Blue, impl yellow); attenuator Type II.** Folds to S1 / S2.
- **LFOA-F8 — Rst port colour (spec Yellow, impl yellow — match in colour-name but treated as mod-yellow in S1 scheme).** Folds to S1.
- **LFOA-F9 — `SlvOut` port name vs spec `Slv (Output, Gray)`.** Minor naming divergence. Severity: Minor. Disposition: `fix-toward-spec (blocked: MODULE_DEFS key/label separation needed — see C5)`.
- **LFOA-F10 — Out port spec Blue (control) vs impl red (output).** Folds to S1.
- **LFOA-F11 — Display elements absent.** Folds to S3.
- **LFOA-F12 — Default rate 2 Hz, amount 100, range Hi (spec silent on defaults).** OOS.

**Cluster summary (LFOA):**
- Findings: 4 in-scope + 2 OOS = 6 total.
- Dispositions: 1 `keep-as-divergence` (F3 cat 1), 3 `fix-toward-spec (blocked)` (F1, F2 — depends on F1, F9 — depends on C5), 1 `keep-as-divergence` (F5 cat 3), 1 `fix-toward-spec (blocked)` (F6 — depends on S6), 2 OOS (F5 borderline, F12).
- Code change applied: none.
- Patch-load impact: F1 would-be widening at one end + narrowing at the other (rate.max widen to 392 is safe; rate.min lowering to ~0.00143 is also widening so safe).

### 3.3 LFO (impl: `LFO`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:329-338` (LFOC — compact master LFO; closest match for impl's minimal `LFO`).
- **Impl:** `src/AudioEngine.js:1084-1103` (`_createLFO`), `src/moduleDefs.js:197-205`.

Minimal LFO: 4 waveforms (sine/saw/sq/tri), no Slv output, no Rst, no Rate Mod input, no range multiplier. The impl `LFO` is even sparser than spec's LFOC.

- **LFO-F1 — Missing `Slv (Output, Gray)`.** Spec LFOC has Slv output for connected slave LFOs. Folds to S4 (non-oscillator master/slave architecture). Severity: Critical. Disposition: `fix-toward-spec (blocked: depends on S4)`.
- **LFO-F2 — Missing `Rate Mod (Input, Blue)`.** Spec: rate modulation input [Type II]. Severity: Critical. Disposition: `fix-toward-spec (blocked: simple additive change — assign osc.frequency as the RateMod target; viable once UI surface decision is made about whether `LFO` is the "simple" tier or should be upgraded to match LFOC's full set)`.
- **LFO-F3 — Missing `Mono (Button)`.** Severity: OOS (no polyphony — same rationale as LFOA-F5). Disposition: `keep-as-divergence`. Rationale (cat 3 — durable design rationale).
- **LFO-F4 — Missing `M (Button) Mute`.** Folds to S5.
- **LFO-F5 — Missing `Hi/Lo/Sub` range selector.** Spec LFOC: range selector. Impl `LFO` has neither range param nor multiplier; the `amount` knob doubles as scale. Severity: Minor. Disposition: `fix-toward-spec (blocked: depends on the decision in F2 about whether `LFO` is the simple tier; consider just rerouting users to `LFOA` for range-aware LFO usage)`.
- **LFO-F6 — `amount` impl-only (0..2000).** Spec output is "Bipolar. LED indicates rate" with no explicit amount knob. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): provides a built-in output gain that lets users target oscillator/filter Hz ranges without an external Amplifier; doesn't replace any spec affordance.
- **LFO-F7 — Display absent.** Folds to S3.
- **LFO-F8 — Out colour (spec Blue, impl red).** Folds to S1.
- **LFO-F9 — Default rate 2 Hz, amount 100 (spec silent).** OOS.

**Cluster summary (LFO):**
- Findings: 4 in-scope + 2 OOS = 6 total.
- Dispositions: 2 `fix-toward-spec (blocked)` (F1 — depends on S4, F2), 2 `keep-as-divergence` (F3 cat 3, F6 cat 2), 1 `fix-toward-spec (blocked)` (F5), 2 OOS (F3 borderline, F9).
- Code change applied: none.
- Patch-load impact: F2 would-be additive (safe), F5 would-be additive.
- Systemic finding folded to: S4 (LFO-F1 — missing Slv output).

### 3.9 ClkGen (impl: `ClkGen`) — audited 2026-05-06, batch 2

- **Spec:** `BORED_MODULAR_DESIGN.md:375-383` (ClkGen — internal clock generator, independent of MIDI clock).
- **Impl:** `src/AudioEngine.js:798-871` (`_createClkGen`), `src/moduleDefs.js:196-204` (`MODULE_DEFS.ClkGen`).

Internal clock running at 24 PPQN with quarter-note (`Clk4`), bar (`Sync`), and per-tick (`Clk24`) outputs. Subscribers register via virtual `Clk` and `Rst` ports on consuming modules; the module has no audio inputs of its own. Timer cleanup is handled in `removeModule` (`src/AudioEngine.js:1565-1569`) — the cross-cutting system most stressed by this audit.

- **Finding C1 — `active` selector vs spec "On/Off button".** Spec calls a button widget; impl uses a select dropdown (`active: ["on", "off"]` at `src/AudioEngine.js:820`). **Severity:** Minor. **Disposition:** `fix-toward-spec (blocked: MODULE_DEFS schema does not currently distinguish button-style binary widgets from selector-style options; introducing a button param type is a small but cross-cutting UI rendering change)`.
- **Finding C2 — Rate display absent.** Spec lists "Rate (Knob + Display)"; impl renders a slider with no separate numeric readout. **Severity:** Minor. **Disposition:** `undecided`. Folds into systemic finding S3 (layout encoding); the impl has no per-module numeric-display affordance, so this surfaces broadly when visual-layout fidelity becomes a goal.
- **Finding C3 — Missing `Reset` input.** Spec defines a yellow `Reset` input that restarts the clock on positive edge and triggers `Sync` output. Impl has no `Reset` input (`inputs: []`, `modInputs: []` at `src/moduleDefs.js:200,202`). **Severity:** Critical. **Disposition:** `fix-toward-spec (blocked: pattern choice required between (a) audio-rate AudioParam input polled by the schedule loop with edge detection — closer to spec's logic-signal semantics — and (b) virtual subscriber-pattern input handled in connect/disconnect — closer to existing impl conventions for Clk/Rst on sequencers)`. Both patterns exist in the codebase; choice has follow-on implications for how other modules send reset signals to ClkGen.
- **Finding C4 — Missing `Slv` output.** Spec defines a gray `Slv` output for slave-rate control on connected slave LFOs (1 BPM = 1 Hz at 1:1). Impl has no `Slv` output (`outputs: ["Clk24", "Clk4", "Sync"]` at `src/moduleDefs.js:201`). **Severity:** Critical. **Disposition:** `fix-toward-spec (blocked: depends on systemic finding S4 — non-oscillator master/slave architecture)`. Adding the output without slave-side recipients (no `LFOSlvA-E` implemented) would be dangling.
- **Finding C5 — Output port name divergence.** Impl outputs `Clk24` / `Clk4` / `Sync`; spec names them `24 Pulses/B` / `4 Pulses/B` / `Sync`. **Severity:** Minor. **Disposition:** `fix-toward-spec (blocked: MODULE_DEFS currently uses port-name strings as both keys and visible labels at src/moduleDefs.js:201; renaming the keys would silently drop saved patches via the setParam no-op branch — see playbook §5)`. A label-only change (introducing key/label separation in `MODULE_DEFS`) is the cleanest fix path; `Sync` is already aligned.
- **Finding C6 — Default BPM 120 (spec silent).** **Severity:** Out-of-scope (spec doesn't state a default).

**Cluster summary (ClkGen subsection):**
- Findings: 5 in-scope + 1 out-of-scope = 6 total.
- Dispositions: 4 `fix-toward-spec (blocked)` (C1, C3, C4, C5), 1 `undecided` (C2 — folds to S3), 1 out-of-scope (C6).

### 3.12 RandomGen (impl: `RandomGen`) — audited 2026-05-06, batch 2

- **Spec:** `BORED_MODULAR_DESIGN.md:398-402` (RandomGen — slave LFO generating smooth random control signal).
- **Impl:** `src/AudioEngine.js:873-907` (`_createRandomGen`), `src/moduleDefs.js:205-213` (`MODULE_DEFS.RandomGen`).

The spec defines `RandomGen` as a slave-class module: master-relative rate (0.025-38.05x via `Mst` input), single bipolar smooth-random output. The impl is standalone: absolute Hz rate, plus impl-only `smoothing` (BiquadFilter LP cutoff) and `amount` (output gain stage) params, no `Mst` input. The slave-class shape would require S4 (non-oscillator master/slave architecture) to land first.

- **Finding R1 — Standalone vs slave-class.** Spec is "Slave LFO" with `Mst` input and master-relative rate; impl is standalone with absolute Hz rate (`rate: { value: 1, min: 0.1, max: 20, audioParam: source.playbackRate }` at `src/AudioEngine.js:902`). **Severity:** Critical (architectural divergence in module class). **Disposition:** `fix-toward-spec (blocked: depends on systemic finding S4 — non-oscillator master/slave architecture)`. Once S4 lands, the impl could become a true slave (replacing the standalone behavior) or a spec-shape `RandomGen` could be added as a separate module alongside the existing impl-only standalone (which would migrate to a different name). That call is downstream of S4.
- **Finding R2 — Impl-only `smoothing` param.** Impl has a `smoothing` param (BiquadFilter lowpass cutoff, 0.5-100 Hz, default 5) that smooths the random buffer (`src/AudioEngine.js:903`); spec has no equivalent. **Severity:** Minor. **Disposition:** `keep-as-divergence`. Rationale: extension the spec doesn't preclude (category 2 of playbook §2.3). The smoothing affordance lets users dial fluid-vs-stepped random without an external Smooth utility module; doesn't replace any spec feature, doesn't change spec-required behavior.
- **Finding R3 — Impl-only `amount` param.** Impl has an `amount` param (output gain stage, 0-2000, default 100) that scales the bipolar random signal (`src/AudioEngine.js:904`); spec output is "Bipolar smooth random" with no defined amplitude. **Severity:** Minor. **Disposition:** `keep-as-divergence`. Rationale: extension the spec doesn't preclude (category 2). The gain stage lets users scale to target param ranges (e.g., cents-of-pitch, filter Hz) without an external Amplifier between RandomGen and target; doesn't replace any spec feature.
- **Finding R4 — Missing `Mst` input.** Spec defines a gray `Mst` input for master rate control. Impl has no `Mst` input (`inputs: []`, `modInputs: []` at `src/moduleDefs.js:209,211`). **Severity:** Critical (consequence of R1). **Disposition:** `fix-toward-spec (blocked: consequence of R1; depends on systemic finding S4)`.
- **Finding R5 — Default values.** Impl defaults: `rate=1`, `smoothing=5`, `amount=100`. Spec is silent on defaults for §3.12 RandomGen. **Severity:** Out-of-scope.

**Cluster summary (RandomGen subsection):**
- Findings: 4 in-scope + 1 out-of-scope = 5 total.
- Dispositions: 2 `fix-toward-spec (blocked)` (R1, R4), 2 `keep-as-divergence` (R2, R3 — extensions spec doesn't preclude), 1 out-of-scope (R5).

**Cluster summary (LFO Group, batch 2 — combined):**
- Findings: 9 in-scope + 2 out-of-scope = 11 total.
- Dispositions: 6 `fix-toward-spec (blocked)` (C1, C3, C4, C5, R1, R4), 2 `keep-as-divergence` (R2, R3), 1 `undecided` (C2 — folds to S3), 2 out-of-scope (C6, R5).
- Code change applied: none (audit-only batch — every `fix-toward-spec` finding is blocked on a dependency or design call).
- Patch-load impact: none (no rename, no narrowing).
- Systemic finding promoted: S4 (non-oscillator master/slave architecture absence). Findings folding to S4: C4, R1, R4.

---

## 4. Envelope Group

### 4.1 ADSREnv (impl: `ADSREnv`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:426-440` (ADSR-Env).
- **Impl:** `src/AudioEngine.js:1023-1082` (`_createADSREnv`), `src/moduleDefs.js:187-196`.

Standard 4-stage envelope with curve selection and built-in VCA shape (audio passes through the gain node that the envelope shapes). Gate input + Retrig input.

- **ADSREnv-F1 — A/D/R ranges 0.001..4/4/8 s vs spec "0.5ms to 45s".** Spec range is wider on both ends (impl's upper limit is 4 s for A/D and 8 s for R; spec is 45 s). Severity: Minor. Disposition: `fix-toward-spec (blocked: range widening is patch-load-safe — defer to fix batch)`.
- **ADSREnv-F2 — Per-segment curve selectors (`attackCurve`, `decayCurve`, `releaseCurve`).** Spec §4.1: "Attack Curve (Buttons): Log, Linear, Exp (3 buttons, not morphable)." Spec describes one set of curve buttons that apply to attack only. Impl has three separate curve params, one per segment. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): per-segment curves give finer control than spec's single attack-curve toggle; doesn't replace spec behaviour (the impl's attack curve still corresponds to spec's affordance) but adds decay and release curve controls that don't conflict with anything in spec.
- **ADSREnv-F3 — Missing `Invert (Button)`.** Spec: inverts control signal output. Impl has no invert toggle. Severity: Minor. Disposition: `fix-toward-spec (blocked: requires an output gain stage with negative gain or a multiply-by-(-1) stage; modest addition. Depends on the Envelope split — see Envelope-F1)`.
- **ADSREnv-F4 — Missing `M (Button) Mute`.** Folds to S5.
- **ADSREnv-F5 — Missing `Amp (Input, Blue)` for overall amplitude modulation.** Spec describes a dedicated Amp input that scales the envelope's overall amplitude. Impl uses `gain.gain` as a writable AudioParam already, so a connection would write to it directly via `GainMod`-style routing; just not exposed. Severity: Minor. Disposition: `fix-toward-spec (blocked: add `Amp` modInput → `gain.gain` AudioParam; trivial follow-up)`.
- **ADSREnv-F6 — Missing `Env Output (Output, Blue)` distinct from `Output (Output, Red) audio`.** Spec defines two outputs: `Env Output` (unipolar control signal) and `Output` (bipolar audio from VCA). Impl exposes only `Out` which is the audio-through-gain. There is no separate control-signal output. Severity: Critical (loses a major affordance — the env can't drive other modules' params without piping audio through it). Disposition: `fix-toward-spec (blocked: requires adding a separate envelope-signal output stage — e.g., a ConstantSourceNode whose offset is driven by the envelope curve — alongside the existing audio-VCA output; modest cross-cutting change for the ADSR/Envelope pair)`.
- **ADSREnv-F7 — Gate / Retrig port colours (spec Yellow, impl yellow).** Folds to S1.
- **ADSREnv-F8 — Display elements absent (A/D/S/R displays, Graph).** Folds to S3.
- **ADSREnv-F9 — Default A=0.01, D=0.2, S=0.6, R=0.5 (spec silent on defaults).** OOS.

**Cluster summary (ADSREnv):**
- Findings: 5 in-scope + 1 OOS = 6 total (F4 folds to S5; F7/F8 fold to S1/S3).
- Dispositions: 1 `keep-as-divergence` (F2 cat 2), 4 `fix-toward-spec (blocked)` (F1 — widening defer; F3, F5, F6), 1 OOS (F9).
- Code change applied: none.
- Patch-load impact: F1 would-be widening (safe). F6 would-be additive (safe — new output port name).

### 4.x Envelope (impl: `Envelope`, no direct spec match — stripped ADSR) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:426-440` (closest match — ADSR-Env, stripped).
- **Impl:** `src/AudioEngine.js:988-1021` (`_createEnvelope`), `src/moduleDefs.js:178-186`.

Stripped 4-stage envelope: A/D/S/R params, single `In` audio input (the envelope is applied as a gain on the input), single `Out` audio output. No Gate input (triggered via gate-target tracking only — see Keyboard, NoteSeqA, NoteSeqB, EventSeq). No curve selectors. No Retrig.

- **Envelope-F1 — Module is a stripped ADSREnv with no clear spec counterpart.** ADSREnv already audited above (§4.1). The impl `Envelope` overlaps in role but is strictly less featured. Severity: Critical (architectural — two impl modules with the same role and one is incomplete). Disposition: `fix-toward-spec (blocked: design call needed — either retire `Envelope` and route all envelope use to `ADSREnv`, or formally distinguish `Envelope` as the simple tier matching no spec section. The latter is `keep-as-divergence` cat 3 but only if we decide simplicity is a durable design rationale)`. Re-evaluate after ADSREnv-F1/F3/F5/F6 land.
- **Envelope-F2 — Missing `Gate (Input, Yellow)`.** Impl `Envelope` has only `In` (audio) input; gating happens implicitly via the gate-target tracking system at `AudioEngine.js:1828-1832`. From the spec's perspective, the gate is a first-class input. Severity: Minor (functional: gate-target tracking works; missing on the panel is a UI/spec divergence). Disposition: `fix-toward-spec (blocked: depends on Envelope-F1 outcome)`.
- **Envelope-F3 — Default A=0.01, D=0.2, S=0.6, R=0.5 (spec silent).** OOS.
- **Envelope-F4 — Display elements absent.** Folds to S3.

**Cluster summary (Envelope):**
- Findings: 2 in-scope + 1 OOS = 3 total.
- Dispositions: 2 `fix-toward-spec (blocked)` (F1 — depends on its own design call, F2 — depends on F1), 1 OOS (F3).
- Code change applied: none.
- Patch-load impact: would-be rename or removal pending F1 outcome — patch-load risk if `Envelope` is retired (saved patches lose state). Document explicitly when F1 resolves.

---

## 5. Filter Group

### 5.4 Filter (impl: `Filter`, closest match: spec FilterD) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:523-532` (FilterD — dynamic 12 dB/oct multimode with res, KBT, freq mod).
- **Impl:** `src/AudioEngine.js:916-932` (`_createFilter`), `src/moduleDefs.js:150-158`.

Multi-mode filter with LP/HP/BP/notch options, resonance, FreqMod, ResMod. Native `BiquadFilterNode` (12 dB/oct).

- **Filter-F1 — Filter type set includes `notch` (spec FilterD lists LP/BP/HP, no notch).** Severity: Minor (extra option). Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): notch is a useful filter mode that BiquadFilterNode supports natively; spec FilterD doesn't list it but doesn't prohibit it either; spec FilterE does list BR (band-reject) which is the same as notch.
- **Filter-F2 — Missing `M (Button) Mute`.** Folds to S5.
- **Filter-F3 — Missing `KBT (Knob): Off to 2.0`.** Severity: Minor. Disposition: `fix-toward-spec (blocked: depends on S6)`.
- **Filter-F4 — `FreqMod` Type III attenuator metadata absent.** Folds to S2.
- **Filter-F5 — `ResMod` attenuator metadata absent.** Folds to S2.
- **Filter-F6 — `Filter` impl name divergence vs spec `FilterD`.** Severity: Minor (generic name vs spec-specific name). Disposition: `fix-toward-spec (blocked: module-type rename triggers patch-load drop via setParam no-op branch — see playbook §5; needs key/label separation per C5 to be safe)`.
- **Filter-F7 — Frequency range 20..15000 Hz vs spec "10 Hz to 15.8 kHz".** Spec is slightly wider on both ends. Severity: Minor. Disposition: `fix-toward-spec` (applied 2026-05-14 in batch 5 — `frequency.min/max: 20..15000 → 10..15800` Hz).
- **Filter-F8 — Resonance range 0.1..30 (Q value) vs spec "0-127" (units).** Different units. Severity: Minor (cosmetic — Q vs hardware units; behavioural equivalence depends on exact mapping). Disposition: `keep-as-divergence`. Rationale (cat 1 — DSP approximation): the BiquadFilter `Q` parameter is the Web Audio idiom; spec's "0-127, self-oscillates at 127" maps to a Q value that produces self-oscillation — a calibration question, not behavioural.
- **Filter-F9 — Missing `Graph` display.** Folds to S3.
- **Filter-F10 — Port colours.** Folds to S1.
- **Filter-F11 — Default frequency 1200 Hz, resonance 4 (spec silent).** OOS.

**Cluster summary (Filter):**
- Findings: 4 in-scope + 1 OOS = 5 total (F2/F4/F5/F9/F10 fold).
- Dispositions: 2 `keep-as-divergence` (F1 cat 2, F8 cat 1), 2 `fix-toward-spec (blocked)` (F3, F6), 1 `fix-toward-spec` applied (F7 — frequency widening in batch 5), 1 OOS (F11).
- Code change applied: `src/AudioEngine.js:928` — `frequency.min/max: 20..15000 → 10..15800` Hz (batch 5, 2026-05-14).
- Patch-load impact: F7 widening (safe). F6 would-be rename still blocked.

### 5.3 FilterC (impl: `FilterC`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:513-521`.
- **Impl:** `src/AudioEngine.js:934-955` (`_createFilterC`), `src/moduleDefs.js:159-167`. `setParam` FilterC branch at `AudioEngine.js:1984-1991` syncs freq/res across the three filters.

Static 3-output multimode filter: parallel LP, BP, HP outputs sharing input + freq + res. GC (gain compensation) selector.

- **FilterC-F1 — Three outputs LP/BP/HP match spec.** Match.
- **FilterC-F2 — Frequency range 20..15000 Hz vs spec "10 Hz to 15.8 kHz".** Same as Filter-F7. Severity: Minor. Disposition: `fix-toward-spec` (applied 2026-05-14 in batch 5 — `frequency.min/max: 20..15000 → 10..15800` Hz).
- **FilterC-F3 — Missing `M (Button) Mute`.** Folds to S5.
- **FilterC-F4 — `GC` selector `off`/`on` matches spec button.** Match in shape; only widget form (selector vs button) diverges — folds to MODULE_DEFS key/label separation (C5).
- **FilterC-F5 — GC behaviour not actually implemented.** Impl `setParam` has no branch that consumes `gainComp` (`AudioEngine.js:1984-1991` only syncs freq and resonance). The param is stored but doesn't reduce gain at high resonance. Severity: Critical (the labelled control does nothing). Disposition: `fix-toward-spec (blocked: requires a per-output gain stage scaled inversely by resonance; modest addition. Could land in a routine fix batch)`.
- **FilterC-F6 — Resonance range 0.1..30 (Q) vs spec "0-127. Self-oscillates at 127".** Same as Filter-F8. `keep-as-divergence` cat 1.
- **FilterC-F7 — Display elements absent.** Folds to S3.
- **FilterC-F8 — Port colours.** Folds to S1.
- **FilterC-F9 — Default frequency 1200 Hz, resonance 4, GC off (spec silent).** OOS.

**Cluster summary (FilterC):**
- Findings: 3 in-scope + 1 OOS = 4 total.
- Dispositions: 1 `fix-toward-spec (blocked)` (F5), 1 `fix-toward-spec` applied (F2 — frequency widening in batch 5), 1 `keep-as-divergence` (F6 cat 1), 1 `fix-toward-spec (blocked)` (F4 — depends on C5), 1 OOS (F9).
- Code change applied: `src/AudioEngine.js:951` — `frequency.min/max: 20..15000 → 10..15800` Hz (batch 5, 2026-05-14).
- Patch-load impact: widening (safe).

### 5.5 FilterE (impl: `FilterE`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:534-547`.
- **Impl:** `src/AudioEngine.js:957-984` (`_createFilterE`), `src/moduleDefs.js:168-176`. `setParam` FilterE branch at `AudioEngine.js:1993-2014` handles freq/res/type sync and slope rewiring.

Dynamic synthesizer filter with 12/24 dB slope, four modes (LP/HP/BP/notch), GC, Bypass(spec)/missing(impl). 24 dB chains two BiquadFilters in series.

- **FilterE-F1 — Modes include `notch` matching spec's BR (band-reject).** Match.
- **FilterE-F2 — Slope `12dB`/`24dB` matches spec.** Match.
- **FilterE-F3 — Missing `B (Button) Bypass`.** Spec has bypass toggle that routes input to output unfiltered. Impl has no bypass param. Severity: Minor. Disposition: `fix-toward-spec (blocked: requires routing alternative + UI button; modest addition; depends on the same widget-form decision as S5)`.
- **FilterE-F4 — Missing `M (Button) Mute`.** Folds to S5.
- **FilterE-F5 — GC behaviour not implemented (same as FilterC-F5).** Impl `setParam` FilterE branch doesn't consume `gainComp`. Severity: Critical. Disposition: `fix-toward-spec (blocked: same approach as FilterC-F5)`.
- **FilterE-F6 — Missing `KBT (Knob): Off to 2.0`.** Folds to S6.
- **FilterE-F7 — `FreqMod1`/`FreqMod2` match spec's two Freq Mod inputs.** Match.
- **FilterE-F8 — Attenuator types (Type III for FreqMods, Type I for ResMod).** Folds to S2.
- **FilterE-F9 — Resonance range 0.1..30 (Q) vs spec "0-127".** Same as Filter-F8. `keep-as-divergence` cat 1.
- **FilterE-F10 — Frequency range 20..15000 Hz vs spec "10 Hz to 15.8 kHz".** Widening; same disposition as Filter-F7. `fix-toward-spec` (applied 2026-05-14 in batch 5 — `frequency.min/max: 20..15000 → 10..15800` Hz).
- **FilterE-F11 — Display + Graph elements absent.** Folds to S3.
- **FilterE-F12 — Port colours.** Folds to S1.
- **FilterE-F13 — Default frequency 1200 Hz, resonance 4, type LP, slope 12dB, GC off (spec silent).** OOS.

**Cluster summary (FilterE):**
- Findings: 4 in-scope + 1 OOS = 5 total.
- Dispositions: 2 `fix-toward-spec (blocked)` (F3, F5), 1 `fix-toward-spec` applied (F10 — frequency widening in batch 5), 1 `keep-as-divergence` (F9 cat 1), 1 OOS (F13).
- Code change applied: `src/AudioEngine.js:978` — `frequency.min/max: 20..15000 → 10..15800` Hz (batch 5, 2026-05-14).
- Patch-load impact: widening (safe).

---

## 6. Mixer Group

### 6.3 GainControl (impl: `GainControl`) — audited 2026-05-13, batch 4

- **Spec:** `BORED_MODULAR_DESIGN.md:629-635` (GainControl (VCA) — voltage-controlled amplifier; can function as ring/amplitude modulator).
- **Impl:** `src/AudioEngine.js` (`_createGainControl`), `src/moduleDefs.js` (`MODULE_DEFS.GainControl`).

Added Batch 4 alongside the Amplifier split (see Amplifier subsection below for the rationale). Spec §6.3 GainControl is a VCA: a carrier `Input`, a `Control` mod input, an `Output`, and a `Unipolar` button that switches between ring-mod (bipolar control) and AM (unipolar control). Internally a `ctrlIn` GainNode feeds two parallel paths into `gainNode.gain`: a bipolar gate (passes raw control) and a unipolar half-and-bias gate (×0.5 plus a +0.5 ConstantSource). Flipping the `unipolar` param swaps the active gates via `setParam`. DSP routing verified quantitatively with a DC carrier through an `AnalyserNode`: bipolar mode passes `level + ctrl`, unipolar mode passes `level + ctrl/2 + 0.5`; pure ring-mod and AM are recovered at `Level=0`.

- **Finding G1 — Impl-only `level` knob.** Impl has a `level` slider (0–4, default 0.8) that sets `gainNode.gain.value` as a baseline; the spec §6.3 GainControl has no level control — gain is defined entirely by the Control signal. **Severity:** Minor. **Disposition:** `keep-as-divergence`. Rationale: extension the spec doesn't preclude (category 2 of playbook §2.3). The level knob carries the saved value forward from migrated pre-split Amplifier patches and lets users set a baseline without needing an external `ConstantSource` for "fixed gain with Ctrl summed in." Doesn't replace any spec feature, doesn't change spec-required Ctrl behaviour (with `Level=0` the module behaves as spec-pure ring-mod / AM).
- **Finding G2 — `Ctrl` port colour (folds to S1).** Spec colours `Control` as Red (audio bus); impl renders it as a yellow mod-input per the direction-based convention. Folds to S1 systemic; no per-module action.
- **Finding G3 — Default values.** Impl defaults: `level=0.8`, `unipolar="off"`. Spec is silent on defaults. **Severity:** Out-of-scope.
- **Finding G4 — `Unipolar` button shape (folds to S5).** Spec defines a button with two states. Impl renders this as a select dropdown with `options: ["off", "on"]` — same pattern as `ClkGen.active`. Folds to S5 (mute / binary-widget systemic) and ClkGen C1.

**Cluster summary (GainControl):**
- Findings: 2 in-scope + 1 out-of-scope = 3 total (G2 folds to S1, G4 folds to S5).
- Dispositions: 1 `keep-as-divergence` (G1 — extension, category 2), 1 folds-to-S1 (G2), 1 folds-to-S5 (G4), 1 out-of-scope (G3).
- Code change applied: new `_createGainControl` in `src/AudioEngine.js`, new switch case in `createModule`, new `unipolar` cross-param branch in `setParam`, new `GainControl` entry in `src/moduleDefs.js`, conditional patch-load migration in `src/BoredModularEmulator.jsx` `loadPatchData`.
- Patch-load impact: legacy `Amplifier` patches with a `GainMod` connection retype to `GainControl` (level value preserved, port renamed `GainMod → Ctrl`); legacy `Amplifier` patches without a `GainMod` connection stay as the new fixed-gain `Amplifier` (level clamped into `[0.25, 4.0]`). Both paths verified end-to-end. User-exported patch JSON outside the repo: best-effort per playbook §5.

### 6.13 Amplifier (impl: `Amplifier`) — audited 2026-05-04, batch 1; updated 2026-05-13, batch 4

- **Spec:** `BORED_MODULAR_DESIGN.md:698-702` (Amplifier — fixed gain/attenuation), `MODULE_LAYOUTS.md:391-393`.
- **Impl:** `src/AudioEngine.js` (`_createAmplifier`), `src/moduleDefs.js` (`MODULE_DEFS.Amplifier`).

Pre-batch-4 the impl was named `Amplifier` but functionally implemented `GainControl` (VCA, spec §6.3): it had a `GainMod` mod input and the moduleDefs description read "Voltage controlled amplifier." Batch 4 resolved the hybrid by splitting: the impl `Amplifier` was narrowed to the spec §6.13 shape (no mod input, range 0.25–4.0×, label "Amplification"), and a new `GainControl` module was added to cover the spec §6.3 VCA role (see GainControl subsection above). Findings F1, F2a, F3, F4, F7 all resolved this batch.

- **Finding F1 — Name-vs-function hybrid.** Impl module type "Amplifier" combined the name from spec §6.13 with the function (mod-controlled VCA) of spec §6.3 GainControl. **Severity:** Minor. **Disposition:** `fix-toward-spec` (applied 2026-05-13 in batch 4 — split into two modules: fixed-gain `Amplifier` per §6.13, new `GainControl` per §6.3). Re-dispositioned 2026-05-06 from `keep-as-divergence` to `undecided`; now resolved.
- **Finding F2a — Range minimum (0 vs 0.25).** Impl had `level.min = 0`; spec `Amplification` range starts at `0.25x`. **Severity:** Minor. **Disposition:** `fix-toward-spec` (applied 2026-05-13 in batch 4 — `level.min: 0 → 0.25`). Patch-load safety handled by a conditional migration in `loadPatchData`: saved Amplifier patches with no `GainMod` connection stay as Amplifier and have their `level` clamped into the new range; patches with a `GainMod` connection retype to GainControl (whose `level.min` stays at 0). Re-dispositioned 2026-05-06 from `keep-as-divergence`; now resolved.
- **Finding F2b — Range maximum (1.0 vs 4.0).** Impl `level.max` was 1; spec range goes to `4.0x`. **Severity:** Critical. **Disposition:** `fix-toward-spec` (applied 2026-05-04 in batch 1 — `level.max: 1 → 4`).
- **Finding F3 — `GainMod` input presence.** Impl had a `GainMod` mod input; spec §6.13 has no mod input. **Severity:** Minor (consequence of F1). **Disposition:** `fix-toward-spec` (applied 2026-05-13 in batch 4 — `GainMod` removed from `Amplifier`, moved to the new `GainControl` as port `Ctrl` per spec §6.3). Re-dispositioned 2026-05-06 from `keep-as-divergence`; now resolved.
- **Finding F4 — `Unipolar` button absent.** Spec §6.3 GainControl has a `Unipolar` button ("Converts bipolar control to unipolar (divides by 2, adds +32 bias)"). **Severity:** Minor. **Disposition:** `fix-toward-spec` (applied 2026-05-13 in batch 4 — Unipolar toggle added to the new `GainControl` module; widget renders as a select dropdown per the existing on/off param pattern, see GainControl finding G4 for the button-vs-selector follow-up that folds to S5).
- **Finding F5 — Amplification value display absent.** Spec §6.13 layout includes an `[Amplification Display]` showing the numeric gain value. Impl renders only a slider with the value-as-position; no readout. **Severity:** Minor. **Disposition:** `undecided`. Visual-layout fidelity is deferred to a separate audit batch (see S3 systemic finding). When that batch runs, this finding folds in.
- **Finding F6 — Default value (0.8).** Impl `level.value = 0.8`; spec doesn't state a default for `Amplification`. **Severity:** Out-of-scope (spec is silent).
- **Finding F7 — Param key `level` vs spec knob "Amplification".** Spec calls the knob `Amplification`; impl uses key `level`. **Severity:** Minor (cosmetic naming). **Disposition:** `fix-toward-spec` (applied 2026-05-13 in batch 4 — label changed `"Level" → "Amplification"`; the param key `level` stays unchanged to keep saved patches loading).

**Cluster summary (Amplifier — batch 4 update):**
- Findings: 7 in-scope + 1 out-of-scope = 8 total.
- Dispositions: 6 `fix-toward-spec` applied (F1, F2a, F2b, F3, F4, F7), 1 `undecided` (F5 — folds to S3), 1 out-of-scope (F6). Zero `keep-as-divergence` on this module after the split (the impl-only level knob moved with the VCA behaviour to GainControl and is recorded there as G1).
- Code change applied: `src/AudioEngine.js` `_createAmplifier` updated (`level.min: 0 → 0.25`, `GainMod` removed, label "Amplification"); new `_createGainControl` added; new switch case in `createModule`; new `unipolar` cross-param branch in `setParam`. `src/moduleDefs.js` updated for both modules. `src/BoredModularEmulator.jsx` `loadPatchData` adds the conditional Amplifier→GainControl retype + `GainMod → Ctrl` port rename + level clamp.
- Patch-load impact: conditional migration. Pre-split Amplifier patches with a `GainMod` connection retype to GainControl (`level` carries forward unchanged). Pre-split Amplifier patches without a `GainMod` connection stay as the new fixed-gain Amplifier (`level` clamped to `[0.25, 4.0]` on load — a saved value of 0 lands at 0.25). User-exported patch JSON outside the repo: best-effort per playbook §5.

### 6.1 Mixer3 (impl: `Mixer3`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:618-621` (3 Inputs Mixer).
- **Impl:** `src/AudioEngine.js:1476-1498` (`_createMixer3`), `src/moduleDefs.js:292-300`.

Three audio inputs (In1/In2/In3), each with its own gain stage, summed via a single `GainNode` to `Out`. Matches spec shape exactly.

- **Mix3-F1 — IO presence matches spec.** Match.
- **Mix3-F2 — Level ranges 0..1 vs spec "[Type I] attenuator 0-127 units".** Different units; functionally equivalent (0..1 normalized vs 0..127 hardware). Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 1 — DSP approximation): Web Audio gain values are linear unitless multipliers; spec's 0-127 units are a hardware UI convention. Same behaviour.
- **Mix3-F3 — `In1/In2/In3` port colours (spec Red, impl blue).** Folds to S1.
- **Mix3-F4 — Attenuator type metadata.** Folds to S2.
- **Mix3-F5 — Default `level1/2/3 = 0.5` (spec silent).** OOS.

**Cluster summary (Mixer3):**
- Findings: 1 in-scope + 1 OOS = 2 total.
- Dispositions: 1 `keep-as-divergence` (F2 cat 1), 1 OOS (F5).
- Code change applied: none.
- Patch-load impact: none.

### 6.2 Mixer8 (impl: `Mixer8`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:623-627` (8 Inputs Mixer).
- **Impl:** `src/AudioEngine.js:1500-1520` (`_createMixer8`), `src/moduleDefs.js:301-309`.

Eight inputs with per-input gain, summed via merger gain. No -6dB button, no level LED.

- **Mix8-F1 — IO and 8 levels match spec.** Match.
- **Mix8-F2 — Missing `-6dB (Button) Global -6dB cut`.** Spec describes a global attenuation toggle to prevent distortion when multiple loud inputs sum. Impl has no such control. Severity: Minor. Disposition: `fix-toward-spec (blocked: requires output gain stage with toggleable -6dB cut; modest addition. Folds with S5 widget-form decision)`.
- **Mix8-F3 — Missing `Multi-color level LED`.** Folds to S3.
- **Mix8-F4 — Level 0..1 vs 0-127 units, default 100.** Spec says "Default attenuation = 100" (i.e., 100/127 ≈ 0.787). Impl default is 0.5. Severity: Minor. Disposition: `fix-toward-spec (blocked: change defaults to ≈0.787; range change is widening if treated as same 0-1 vs translating to 0-1.27; depends on F1 unit-decision)`.
- **Mix8-F5 — Attenuator type, port colours.** Folds to S1 / S2.

**Cluster summary (Mixer8):**
- Findings: 2 in-scope + 0 OOS = 2 total.
- Dispositions: 2 `fix-toward-spec (blocked)` (F2, F4).
- Code change applied: none.
- Patch-load impact: F4 would-be default-change (safe — saved values stay valid in 0..1 range).

### 6.4 XFade (impl: `XFade`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:637-642` (X-Fade).
- **Impl:** `src/AudioEngine.js:1522-1544` (`_createXFade`), `src/moduleDefs.js:310-318`. `setParam` XFade branch at `AudioEngine.js:2017-2020` handles inverse gain update.

Two-input crossfader: InA/InB summed via inverse-gain pair, FadeMod input.

- **XFade-F1 — `fade` range 0..1 matches spec "1/2 (Knob): Manual crossfade position. Center = equal mix".** Match in shape.
- **XFade-F2 — `FadeMod` input present.** Match.
- **XFade-F3 — `FadeMod` Type I attenuator metadata.** Folds to S2.
- **XFade-F4 — InA/InB/FadeMod port colours.** Folds to S1.
- **XFade-F5 — `FadeMod` writes to internal `fadeMod` gain that is never connected to the gainA/gainB pair.** The `fadeMod` GainNode is created at `AudioEngine.js:1526-1527`, accepted as the `FadeMod` input target, but never wired to update gainA/gainB. Connected modulation thus has no audible effect. Severity: Critical (the labelled mod input doesn't function). Disposition: `fix-toward-spec (blocked: requires either polling the FadeMod input and updating gain values in a worklet-based scheduler, OR a different architecture using a constant-source-driven inverse-gain pair. Modest cross-cutting change)`.
- **XFade-F6 — Default `fade = 0.5` (centre) matches spec "Center = equal mix".** Match.

**Cluster summary (XFade):**
- Findings: 1 in-scope + 0 OOS = 1 total.
- Dispositions: 1 `fix-toward-spec (blocked)` (F5 — critical, mod-input dead-wired).
- Code change applied: none.
- Patch-load impact: F5 would-be additive (no rename/narrowing).

### 6.5 Panner (impl: `Panner`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:644-650` (Pan).
- **Impl:** `src/AudioEngine.js:1546-1558` (`_createPanner`), `src/moduleDefs.js:319-327`.

Stereo panner using native `StereoPannerNode`. `In` input, single `Out` output, `PanMod` input.

- **Panner-F1 — Single `Out` output vs spec dual `L (Output, Red)`, `R (Output, Red)`.** Spec describes the Pan module as producing two outputs (L and R independently). Impl produces a single stereo output port that carries both channels via `StereoPannerNode` panning. Severity: Critical (loses per-output L/R routing — patching L into a mono signal path means losing R). Disposition: `fix-toward-spec (blocked: requires splitting the stereo signal via ChannelSplitterNode and exposing L and R as separate output ports; depends on the same multi-bus decision as Output)`.
- **Panner-F2 — Module name `Panner` vs spec `Pan`.** Severity: Minor (cosmetic). Disposition: `fix-toward-spec (blocked: module-type rename — same risk as Filter-F6; needs C5 key/label separation)`.
- **Panner-F3 — `PanMod` Type I attenuator metadata.** Folds to S2.
- **Panner-F4 — In / PanMod port colours.** Folds to S1.
- **Panner-F5 — Default `pan = 0` (centre) matches spec "Center = equal".** Match.

**Cluster summary (Panner):**
- Findings: 2 in-scope + 0 OOS = 2 total.
- Dispositions: 2 `fix-toward-spec (blocked)` (F1, F2).
- Code change applied: none.
- Patch-load impact: F2 would-be rename (silent drop risk).

---

## 7. Audio Modifier Group

### 7.5 ShortDelay (impl: `ShortDelay`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:739-745` (Delay (Short) — for flanger/phaser effects, NOT a long echo delay).
- **Impl:** `src/AudioEngine.js:1603-1627` (`_createShortDelay`), `src/moduleDefs.js:338-346`.

Short delay (0-2.65 ms) for flanger-class effects. Has feedback and mix params, TimeMod input.

- **ShortDelay-F1 — Time range 0..0.00265 s matches spec "0 to 2.65 ms".** Match.
- **ShortDelay-F2 — Missing dedicated `2.65ms (Output, Red)` fixed max-delay output.** Spec defines two outputs: `2.65ms` (fixed max-delay) and `Out` (variable). Impl has only `Out` (variable). Severity: Minor. Disposition: `fix-toward-spec (blocked: requires adding a parallel DelayNode at fixed 2.65 ms feeding a separate output port; modest addition)`.
- **ShortDelay-F3 — Impl-only `feedback` (0..0.95) and `mix` (0..1) params.** Spec describes the module as raw flanger/phaser stage with no internal feedback or wet/dry. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): feedback and mix are common flanger affordances that the spec doesn't preclude; they make the module musically usable without external Amp + feedback routing.
- **ShortDelay-F4 — `TimeMod` Type I attenuator metadata.** Folds to S2.
- **ShortDelay-F5 — In / TimeMod port colours.** Folds to S1.
- **ShortDelay-F6 — Default time 0.001 s, feedback 0.3, mix 0.7 (spec silent).** OOS.

**Cluster summary (ShortDelay):**
- Findings: 2 in-scope + 1 OOS = 3 total.
- Dispositions: 1 `fix-toward-spec (blocked)` (F2), 1 `keep-as-divergence` (F3 cat 2), 1 OOS (F6).
- Code change applied: none.
- Patch-load impact: F2 would-be additive (safe).

### 7.8 Chorus (impl: `Chorus`, closest match: spec StereoChorus) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:760-766` (StereoChorus).
- **Impl:** `src/AudioEngine.js:1629-1670` (`_createChorus`), `src/moduleDefs.js:347-355`. `setParam` Chorus branch at `AudioEngine.js:1972-1977` syncs second LFO rate and depth.

Stereo chorus with two LFO-modulated delay lines. Impl exposes Rate, Depth, Mix params.

- **Chorus-F1 — Single `Out` vs spec dual `L, R (Outputs, Red)`.** Same shape issue as Panner-F1. Severity: Critical. Disposition: `fix-toward-spec (blocked: same approach as Panner-F1 — requires ChannelSplitterNode + separate L/R output ports)`.
- **Chorus-F2 — Missing `B (Button) Bypass`.** Severity: Minor. Disposition: `fix-toward-spec (blocked: depends on S5 widget-form decision)`.
- **Chorus-F3 — Param names `rate` / `depth` / `mix` vs spec `Detune` (depth) / `Amount` (mix).** Spec calls the depth knob "Detune" and the mix knob "Amount". Severity: Minor. Disposition: `fix-toward-spec (blocked: param-name rename triggers patch-load drop; needs C5 key/label separation)`.
- **Chorus-F4 — In port colour.** Folds to S1.
- **Chorus-F5 — Default rate 0.8 Hz, depth 0.003, mix 0.5 (spec silent).** OOS.

**Cluster summary (Chorus):**
- Findings: 3 in-scope + 1 OOS = 4 total.
- Dispositions: 3 `fix-toward-spec (blocked)` (F1, F2, F3), 1 OOS (F5).
- Code change applied: none.
- Patch-load impact: F3 would-be rename (silent drop risk).

### 7.11 Shaper (impl: `Shaper`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:793-798`.
- **Impl:** `src/AudioEngine.js:1672-1703` (`_createShaper`), `src/moduleDefs.js:356-364`. `setParam` Shaper branch at `AudioEngine.js:2022-2040` regenerates curve from shape + drive.

Waveshaper with 5 transfer functions: log2, log1, linear (bypass), exp1, exp2. Per-shape transfer function regenerated when shape or drive changes.

- **Shaper-F1 — Shape options match spec: Log2, Log1, Linear, Exp1, Exp2.** Match.
- **Shaper-F2 — Missing `M (Button) Mute`.** Folds to S5.
- **Shaper-F3 — Impl-only `drive` (0.1..10) and `level` (0..1) params.** Spec describes the Shaper as just shape buttons with no drive or output level. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): drive scales the input before the curve (controls how hard the signal hits the shaper); level scales the output. Neither replaces a spec affordance.
- **Shaper-F4 — Spec note about Log2 on sine approaching square / Exp2 on sine approaching triangle.** Behavioural assertion; impl's `Math.sign(x) * Math.pow(Math.abs(x), 0.25)` for Log2 and `Math.pow(Math.abs(x), 4)` for Exp2 generate curves whose effect on sine matches the spec direction qualitatively. Not strictly equal to a hardware shaper's curve but the musical behaviour family is correct. Severity: OOS (DSP-level approximation; CLAUDE.md scopes this to keep-as-divergence under cat 1).
- **Shaper-F5 — In port colour.** Folds to S1.
- **Shaper-F6 — Default shape `linear`, drive 1, level 0.8 (spec silent).** OOS.

**Cluster summary (Shaper):**
- Findings: 1 in-scope + 2 OOS = 3 total.
- Dispositions: 1 `keep-as-divergence` (F3 cat 2), 1 OOS (F4 borderline keep-as-div cat 1), 1 OOS (F6).
- Code change applied: none.
- Patch-load impact: none.

### 7.x Delay (impl: `Delay`, no direct spec match — long echo delay) — audited 2026-05-12, batch 3

- **Spec:** *No direct match in §7.* Spec §7.5 is `Delay (Short)` (0-2.65 ms, flanger-class). No long echo delay in the spec audio modifier group.
- **Impl:** `src/AudioEngine.js:1577-1601` (`_createDelay`), `src/moduleDefs.js:329-337`.

Long echo delay (0.01-2 s) with feedback (0-0.95) and dry/wet mix. Impl-only module — no spec equivalent.

- **Delay-F1 — Module is impl-only with no spec counterpart.** Severity: Critical (architectural — impl ships a module the spec doesn't define). Disposition: `keep-as-divergence`. Rationale (cat 2 — extension that spec doesn't preclude): long echo delay is a near-universal modular synth utility; spec's omission is plausibly an oversight (the spec PDF excerpts the user manual section, and echo modules may exist elsewhere in the spec source not captured in our corpus). Keep as impl-only with this finding as the durable record. Re-evaluate if the spec excerpt is ever extended to include a long delay.
- **Delay-F2 — Default time 0.35 s, feedback 0.4, mix 0.6 (no spec to compare).** OOS.
- **Delay-F3 — In port colour.** Folds to S1.

**Cluster summary (Delay):**
- Findings: 1 in-scope + 1 OOS = 2 total.
- Dispositions: 1 `keep-as-divergence` (F1 cat 2), 1 OOS (F2).
- Code change applied: none.
- Patch-load impact: none.

---

## 8. Control Modifier Group

### 8.3 PortamentoA (impl: `PortamentoA`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:866-871`.
- **Impl:** `src/AudioEngine.js:1248-1270` (`_createPortamentoA`), `src/moduleDefs.js:233-241`. `setParam` PortamentoA branch at `AudioEngine.js:2061-2065` maps `time` to lowpass cutoff.

Slew limiter using a BiquadFilter lowpass: input → filter → output. The `time` param maps to cutoff (higher time = lower cutoff = slower glide).

- **Porta-F1 — Missing `On (Input, Yellow)` enable input.** Spec: "On (Input, Yellow): Enables glide when high. If unpatched, portamento is always active." Impl has no On input — portamento is always active. Severity: Minor (impl matches spec's "unpatched" default state but loses the ability to gate the glide). Disposition: `fix-toward-spec (blocked: requires adding an `On` input that conditionally bypasses the filter when low; modest addition, depends on a small architectural decision about how to implement the bypass — switch via AudioWorklet vs branching gain)`.
- **Porta-F2 — `time` range 0.001..2 s vs spec "5.3 to 1355 ms" (0.0053..1.355 s).** Different range. Impl is wider at the lower end and narrower at the upper. Severity: Minor. Disposition: `fix-toward-spec` (applied 2026-05-15 in batch 6 — `time.min/max: 0.001..2 → 0.0053..1.355` s). Saved-patch scan waived: project is still in development mode; maintainer confirmed no saved patches need preservation. User-visible effect: fastest glide gets slightly slower (1 ms → 5.3 ms minimum) and slowest glide narrows from 2 s to 1.355 s; the `setParam` mapping (`cutoff = max(0.5, 1 / (time * 2))`) is range-agnostic.
- **Porta-F3 — Impl-only `level` param (0..1).** Spec has no output level knob (Portamento is just a slew limiter). Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): output gain is a small affordance; doesn't replace any spec feature.
- **Porta-F4 — In / Output port colours (spec Blue for both, impl In is blue but Out is red).** Folds to S1.
- **Porta-F5 — Display element absent.** Folds to S3.
- **Porta-F6 — Slew-via-lowpass approximation.** DSP-level approximation; the curve shape of a BiquadFilter slew differs from a hardware slew limiter's linear or exponential ramp. Severity: OOS. Disposition: `keep-as-divergence`. Rationale (cat 1 — DSP-level approximation).

**Cluster summary (PortamentoA):**
- Findings: 2 in-scope + 1 OOS = 3 total.
- Dispositions: 2 `keep-as-divergence` (F3 cat 2, F6 cat 1), 1 `fix-toward-spec (blocked)` (F1), 1 `fix-toward-spec` applied (F2 — time narrowing in batch 6).
- Code change applied: `src/AudioEngine.js:1267` — `time.min/max: 0.001..2 → 0.0053..1.355` s (batch 6, 2026-05-15).
- Patch-load impact: F2 narrowing — saved-patch scan waived per dev-mode statement in batch 6.

---

## 10. Sequencer Group

### 10.1 EventSeq (impl: `EventSeq`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:1004-1015`.
- **Impl:** `src/AudioEngine.js:1274-1321` (`_createEventSeq`), `src/moduleDefs.js:242-251`. `customUIHeight: 70` for the 2×16 trigger grid.

Two-row 16-step trigger/gate sequencer. Subscribes to clock via virtual `Clk`/`Rst` inputs; outputs `Out1`/`Out2` are ConstantSources that pulse on configured steps.

- **EventSeq-F1 — Step count fixed at 16 vs spec "1-128 via Link chaining".** Spec describes a 16-step base sequencer with `Step (Selector)` for last step (1-128 via Link output → next Rst input). Impl has a single sequencer with `steps: 1..16`. Severity: Minor (the 1-128 via Link is multi-sequencer chaining; impl is single-unit). Disposition: `fix-toward-spec (blocked: requires implementing `Link (Output, Yellow)` and using the Rst-subscriber pattern to chain to next sequencer; multi-sequencer; modest cross-cutting change)`.
- **EventSeq-F2 — Missing `Snc (Output, Yellow)` output (pulse on step 1).** Severity: Minor. Disposition: `fix-toward-spec (blocked: requires adding a ConstantSourceNode that pulses on resetSeq() and at step 1 in clockTick(); modest addition)`.
- **EventSeq-F3 — Missing `Link (Output, Yellow)`.** Same as F1; depends on F1.
- **EventSeq-F4 — Missing `Clr (Button)`.** Spec: clear all triggers. Impl has no clear-all affordance in the param set (UI may have one — confirm at audit time). Severity: Minor. Disposition: `fix-toward-spec (blocked: depends on S5 widget-form decision)`.
- **EventSeq-F5 — Missing `Loop (Button)`.** Spec: auto-restart after last step. Impl auto-loops by `seq._currentStep = (step + 1) % seq.params.steps.value`, so loops by default; spec's Loop button toggles this. Severity: Minor. Disposition: `fix-toward-spec (blocked: requires storing the toggle state and using `... % seq.params.steps.value` only when looping is on; depends on S5 widget-form)`.
- **EventSeq-F6 — Missing `G Buttons x2` (per-row Trigger/Gate mode).** Spec: "Trigger mode (50% duty cycle per step) and Gate mode (adjacent steps merge into longer gate)." Impl always uses trigger mode (10 ms pulse). Severity: Minor. Disposition: `fix-toward-spec (blocked: requires per-row mode flag and modified clockTick output schedule; depends on S5 widget-form)`.
- **EventSeq-F7 — `Out1`/`Out2` port names vs spec `Out x2`.** Match in shape; differing labels. Severity: Minor (cosmetic naming).
- **EventSeq-F8 — Clk / Rst / Out port colours (spec Yellow for all).** Folds to S1.
- **EventSeq-F9 — Default `steps = 16`, all triggers off (spec silent on defaults).** OOS.

**Cluster summary (EventSeq):**
- Findings: 5 in-scope + 1 OOS = 6 total.
- Dispositions: 5 `fix-toward-spec (blocked)` (F1, F2, F4, F5, F6 — F3 is consequence of F1), 1 OOS (F9).
- Code change applied: none.
- Patch-load impact: F1 would-be additive (Link is new output port).

### 10.2 CtrlSeq (impl: `CtrlSeq`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:1017-1029`.
- **Impl:** `src/AudioEngine.js:1323-1348` (`_createCtrlSeq`), `src/moduleDefs.js:252-261`. `customUIHeight: 80` for the slider row.

16-slider control sequencer. Outputs a ConstantSource set to the current step's stored value.

- **CtrlSeq-F1 — Step count fixed at 16 vs spec "1-128 via Link chaining".** Same as EventSeq-F1. Disposition same.
- **CtrlSeq-F2 — Missing `Snc (Output, Yellow)`.** Same as EventSeq-F2.
- **CtrlSeq-F3 — Missing `Link (Output, Yellow)`.** Consequence of F1.
- **CtrlSeq-F4 — Missing `Loop (Button)`, `Clr (Button)`, `Rnd (Button)`.** Severity: Minor (each). Disposition: `fix-toward-spec (blocked: depends on S5 widget-form)`.
- **CtrlSeq-F5 — Missing `Uni (Button)` for unipolar/bipolar output mode.** Spec describes a button that switches between -64..+64 (bipolar) and 0..+64 (unipolar) output range. Impl values are stored 0..1 and output via `out.offset.setValueAtTime(val, ...)` — single mode. Severity: Minor. Disposition: `fix-toward-spec (blocked: requires storing a mode flag and possibly transforming stored slider values; depends on S5 widget-form)`.
- **CtrlSeq-F6 — Out port colour (spec Blue).** Folds to S1.
- **CtrlSeq-F7 — Default `steps = 16`, all values 0 (spec silent).** OOS.

**Cluster summary (CtrlSeq):**
- Findings: 5 in-scope + 1 OOS = 6 total (F3 is consequence; F6 folds).
- Dispositions: 5 `fix-toward-spec (blocked)` (F1, F2, F4, F5, plus F3 consequence-of-F1), 1 OOS (F7).
- Code change applied: none.
- Patch-load impact: F1/F2 would-be additive; F5 would-be range/representation change (handle on landing).

### 10.3 NoteSeqA (impl: `NoteSeqA`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:1031-1045`.
- **Impl:** `src/AudioEngine.js:1350-1402` (`_createNoteSeqA`), `src/moduleDefs.js:262-271`. `customUIHeight: 100` for pitch sliders + gate row.

Note sequencer with pitch sliders and per-step gate. Drives oscillator pitch via `_pitchTargets` (same pattern as Keyboard).

- **NoteSeqA-F1 — Step count fixed at 16 vs spec "1-128 via Link chaining".** Same as EventSeq-F1.
- **NoteSeqA-F2 — Missing `Snc (Output, Yellow)`.** Same as EventSeq-F2.
- **NoteSeqA-F3 — Missing `Link (Output, Yellow)`.** Consequence of F1.
- **NoteSeqA-F4 — Missing `Gclk (Output, Yellow)`.** Spec: logic pulse on each step advance. Impl has no Gclk output. Severity: Minor. Disposition: `fix-toward-spec (blocked: requires adding a ConstantSource that pulses on every clockTick; modest addition)`.
- **NoteSeqA-F5 — Missing `Loop (Button)`, `Clr (Button)`, `Record (Button)`, `Stop/Go (Button)`, `< > (Buttons)`.** Severity: Minor (each, with Record being more substantial). Disposition: `fix-toward-spec (blocked: depends on S5 widget-form. Record (program-from-keyboard) requires MIDI input or a separate keyboard-capture flow — partially blocked on the MIDI gap)`.
- **NoteSeqA-F6 — Pitch sliders range ±64 semitones vs impl pitch values stored as MIDI 0..127.** Spec describes slider range as ±64 semitones from a base note. Impl stores raw MIDI note numbers (`_pitchValues: [60,62,64,...]`). Different representation; behaviourally equivalent in range. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 1 — DSP approximation): MIDI 0..127 is the canonical pitch representation; spec's "±64 semitones" presupposes a base note offset that the impl absorbs into the MIDI number directly.
- **NoteSeqA-F7 — Note / Gate / Clk / Rst / Snc / Link / Gclk port colours.** Folds to S1.
- **NoteSeqA-F8 — Default 16-step C-major run, all gates on (spec silent).** OOS.

**Cluster summary (NoteSeqA):**
- Findings: 4 in-scope + 1 OOS = 5 total.
- Dispositions: 1 `keep-as-divergence` (F6 cat 1), 4 `fix-toward-spec (blocked)` (F1, F2, F4, F5 + F3 consequence), 1 OOS (F8).
- Code change applied: none.
- Patch-load impact: F1/F2/F4 would-be additive.

### 10.4 NoteSeqB (impl: `NoteSeqB`) — audited 2026-05-12, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:1047-1055`.
- **Impl:** `src/AudioEngine.js:1404-1458` (`_createNoteSeqB`), `src/moduleDefs.js:272-281`. `customUIHeight: 120` for piano-roll grid editor.

Note sequencer with graphical grid editor (piano roll). Same audio engine as NoteSeqA; UI differs.

- **NoteSeqB-F1 — Step count fixed at 16 vs spec "1-128 via Link chaining".** Same as EventSeq-F1.
- **NoteSeqB-F2 — Missing `Snc (Output, Yellow)`.** Same as EventSeq-F2.
- **NoteSeqB-F3 — Missing `Link (Output, Yellow)`.** Consequence of F1.
- **NoteSeqB-F4 — Missing `Gclk (Output, Yellow)`.** Same as NoteSeqA-F4.
- **NoteSeqB-F5 — Missing `Rnd (Button)`, `Record`, `Stop/Go`, `< >`, `Loop`, `Clr` buttons.** Same as NoteSeqA-F5.
- **NoteSeqB-F6 — Missing `Arrow Buttons x16` for fine per-step pitch adjustment.** Spec describes per-step ± arrow buttons. Impl uses drag-on-grid for per-step pitch. Severity: Minor (different UI affordance, same effect). Disposition: `keep-as-divergence`. Rationale (cat 3 — durable design rationale): direct-grid editing is the more idiomatic web UI; per-step arrow buttons are a hardware-panel affordance.
- **NoteSeqB-F7 — Missing piano-roll zoom (Click to zoom in, Ctrl/Alt-click out, scroll bar).** Spec describes zoom + scroll. Impl renders a static grid (1-6 octave overview via `baseOctave` param). Severity: Minor. Disposition: `fix-toward-spec (blocked: zoom-on-click would deepen the customUIHeight implementation — modest UI work, defer)`.
- **NoteSeqB-F8 — `baseOctave` param (1-6) impl-only.** Spec describes a "1-6 octave overview" which the impl exposes as a discrete `baseOctave` knob. Severity: Minor. Disposition: `keep-as-divergence`. Rationale (cat 2 — extension): the baseOctave param implements the spec's octave-overview affordance directly via a param rather than via a hidden UI state.
- **NoteSeqB-F9 — Pitch representation (MIDI vs ±64 semitones).** Same as NoteSeqA-F6.
- **NoteSeqB-F10 — Port colours.** Folds to S1.
- **NoteSeqB-F11 — Defaults (spec silent).** OOS.

**Cluster summary (NoteSeqB):**
- Findings: 5 in-scope + 1 OOS = 6 total.
- Dispositions: 3 `keep-as-divergence` (F6 cat 3, F8 cat 2, F9 cat 1), 4 `fix-toward-spec (blocked)` (F1, F2, F4, F5, F7 + F3 consequence), 1 OOS (F11).
- Code change applied: none.
- Patch-load impact: F1/F2/F4 would-be additive.

---

## Batch 3 — Full-sweep audit summary (2026-05-12)

Re-adopts the playbook workflow explicitly for one large audit-only sweep covering all 38 previously unaudited implemented modules. Single PR, no code in `src/` modified.

**Modules covered:** 38 — Keyboard, Output, MasterOsc, OscA, OscB, OscC, SpectralOsc, FormantOsc, OscSlvA, OscSlvB, OscSlvC, OscSlvD, OscSlvE, OscSineBank, OscSlvFM, Noise, PercOsc, DrumSynth, LFO, LFOA, Envelope, ADSREnv, Filter, FilterC, FilterE, Mixer3, Mixer8, XFade, Panner, Delay, ShortDelay, Chorus, Shaper, PortamentoA, EventSeq, CtrlSeq, NoteSeqA, NoteSeqB.

**Aggregate dispositions:**
- ~50 `fix-toward-spec (blocked)` findings — most blocked on systemic findings (S2 attenuator metadata, S3 layout encoding, S4 non-osc master/slave, S5 mute widget, S6 KBT behaviour) or playbook §5 patch-load safety.
- ~25 `keep-as-divergence` findings — mostly category 1 (DSP approximations) and category 2 (extensions spec doesn't preclude); a handful of category 3 durable design rationale.
- ~20 out-of-scope findings — mostly spec-silent defaults and impl-only modules without spec counterparts.
- Zero `undecided` findings (re-evaluated against the disposition framework introduced in Batch 2).
- Zero `fix-toward-spec` items applied (audit-only by plan).

**Critical findings worth flagging for early follow-up:**
- **OscB-F1**: Missing `PWidth Mod` input. Native OscillatorNode has no PW control; needs Pulse worklet swap for Square waveform.
- **ADSREnv-F6 / Envelope-F1**: Missing separate `Env Output` (control signal). The Envelope/ADSREnv pair is also architecturally redundant.
- **Filter-F6 / Panner-F2 / Chorus-F3**: Module/param renames blocked on patch-load safety (need C5 key/label separation first).
- **FilterC-F5 / FilterE-F5**: Gain Compensation params exist but the behaviour is never applied — dead controls.
- **XFade-F5**: `FadeMod` input is wired into a dead-end `fadeMod` gain that never modulates the gain pair — the labelled mod-input does nothing.
- **LFO-F1 / multiple oscillator findings**: Many fold to S4 (non-osc master/slave architecture).

**New systemic findings promoted this batch:**
- **S5** — Mute affordance absent (≥20 modules' Mute buttons folded here).
- **S6** — KBT parameter cosmetic-only (5 modules: MstOsc, OscB, OscC, SpectralOsc, FormantOsc).

**Patch-load impact:**
- Numerous would-be widenings (safe).
- Several would-be narrowings (OscA-F2, Porta-F2) — blocked on patch-load scan per playbook §5.
- Several would-be renames (Filter-F6, Panner-F2, Chorus-F3, ClkGen-C5) — all blocked on C5 (MODULE_DEFS key/label separation).
- No code change applied this batch — patch-load impact is zero in `src/` terms.

**Code change applied:** none (audit-only batch).

**Next steps surfacing from this batch:**
1. Resolve S5 widget-form decision (button vs selector) to unblock ~20 fix-toward-spec items across many modules.
2. Implement C5 MODULE_DEFS key/label separation to unblock ~10 rename/label-only fix-toward-spec items.
3. Brainstorm + plan for S6 (KBT behaviour) — affects 5 modules + would unblock OscA-F1 / OscC-F3 / FormantOsc-F5 / FilterE-F6.
4. Schedule narrowing scans for OscA-F2, Porta-F2.
5. Quick wins (single-PR clusters per playbook §4): apply widening fixes for MstOsc-F2, OscA-F3, OscC-F6, FormantOsc-F3, ADSREnv-F1, Filter-F7, FilterC-F2, FilterE-F10, PercOsc-F1, LFOA-F1 — all patch-load-safe.

---

## Batch 4 — Amplifier split (2026-05-13)

Single-cluster batch resolving the Amplifier name-vs-function hybrid surfaced in Batch 1 (findings F1, F2a, F3, F4, F7). One PR; `src/` changes applied; one new module (`GainControl`) added to bring impl count to 42.

**Modules covered:** 2 — `Amplifier` (narrowed to spec §6.13 shape), `GainControl` (new spec §6.3 VCA with `Unipolar` toggle).

**Dispositions:**
- 6 `fix-toward-spec` applied: Amplifier F1 (split into two modules), F2a (`level.min: 0 → 0.25`), F3 (`GainMod` removed from §6.13; moved to GainControl as `Ctrl`), F4 (`Unipolar` toggle added to GainControl), F7 (label "Level" → "Amplification" on Amplifier).
- 1 `keep-as-divergence`: GainControl G1 (impl-only `level` knob — category 2 extension; carries forward from migrated Amplifier patches).
- 2 folds-to-systemic: GainControl G2 → S1 (Ctrl port colour), G4 → S5 (Unipolar widget is a selector, not a button).
- 1 `undecided`: Amplifier F5 (numeric display, folds to S3 layout encoding).
- 2 out-of-scope: F6 (Amplifier default 0.8 — spec silent), G3 (GainControl defaults — spec silent).

**Code change applied:**
- `src/AudioEngine.js`: `_createAmplifier` narrowed (no mod input, range 0.25–4.0×, label "Amplification"); new `_createGainControl` added; new `case "GainControl"` in `createModule` switch; new `unipolar` toggle branch in `setParam` that flips bipolar/unipolar routing gates.
- `src/moduleDefs.js`: `Amplifier` entry `modInputs: []`; new `GainControl` entry with `inputs: ["In"]`, `modInputs: ["Ctrl"]`, `Uni` toggle param; appended to Level `CATEGORIES`.
- `src/BoredModularEmulator.jsx` `loadPatchData`: conditional migration. Saved `Amplifier` patches with an inbound `GainMod` connection retype to `GainControl` and rename the port to `Ctrl` (level value carries forward); saved `Amplifier` patches without one stay as the new fixed-gain `Amplifier` and have their `level` clamped into `[0.25, 4.0]`. Chains onto the existing `Mixer2 → Mixer3` alias.

**Patch-load impact:** conditional migration verified both directions. DSP routing verified quantitatively with an isolated `AnalyserNode` rig — all bipolar / unipolar / pure-AM / pure-ring-mod cases match expected effective gain to floating-point precision.

**Playbook leverage signals:**
- The pre-batch saved-patch scan (playbook §5) identified that no committed example patches use `Amplifier`, narrowing the risk surface to the maintainer's localStorage and user-exported JSON files — which the conditional migration now covers in-tree.
- Re-using the `Mixer2 → Mixer3` alias pattern at the same `loadPatchData` call site kept the migration code mechanically equivalent to a precedent the maintainer has already reviewed once.
- Folding G4 to S5 (per Batch 3's systemic) rather than re-stating the button-vs-selector argument per-module kept the GainControl findings tight.

---

## Batch 5 — Range widenings (2026-05-14)

Eight patch-load-safe range widenings drawn from Batch 3's quick-win recommendation list (`:1067-1073`). Two thematic groups in a single PR: oscillator pitch widening (5 modules) and filter frequency widening (3 modules). No new modules; no `setParam` branches touched; no `loadPatchData` migration needed (widenings only).

**Modules covered:** 8 — `MasterOsc`, `OscA`, `OscC`, `FormantOsc`, `PercOsc`, `Filter`, `FilterC`, `FilterE`.

**Findings resolved:**
- **Oscillator pitch widening (5):** MstOsc-F2 (`coarse: ±60 → ±64`), OscA-F3 (`coarse: ±60 → ±64`), OscC-F6 (`coarse: ±60 → ±64`), FormantOsc-F3 (`coarse: ±60 → ±64`), PercOsc-F1 (`pitch: 20..8000 → 8..12544` Hz).
- **Filter frequency widening (3):** Filter-F7 (`frequency: 20..15000 → 10..15800` Hz), FilterC-F2 (same), FilterE-F10 (same).

**Dispositions:**
- 8 `fix-toward-spec` applied.
- 0 `keep-as-divergence`, 0 `undecided`, 0 OOS surfaced this batch (all eight had existing dispositions of `fix-toward-spec (blocked: widening — defer to fix batch)`; this batch unblocks them).

**Code change applied:**
- `src/AudioEngine.js`: eight single-literal min/max edits across seven `_create*` methods.
  - `_createOscA` (`:157`): `coarse.min/max: -60..60 → -64..64`.
  - `_createOscC` (`:228`): `coarse.min/max: -60..60 → -64..64`.
  - `_createPercOsc` (`:364`): `frequency.min/max: 20..8000 → 8..12544` Hz.
  - `_createFormantOsc` (`:609`): `coarse.min/max: -60..60 → -64..64`.
  - `_createMasterOsc` (`:636`): `coarse.min/max: -60..60 → -64..64`.
  - `_createFilter` (`:928`): `frequency.min/max: 20..15000 → 10..15800` Hz.
  - `_createFilterC` (`:951`): `frequency.min/max: 20..15000 → 10..15800` Hz.
  - `_createFilterE` (`:978`): `frequency.min/max: 20..15000 → 10..15800` Hz.

**Patch-load impact:** widening only across all eight changes. Every saved value remains valid in the wider range; no rename, no narrowing, no `setParam` keys changed. Pre-batch saved-patch scan (playbook §5) not required by rule — recorded explicitly for clarity.

**Scope deviation from playbook §4:** the cluster covers 8 modules vs. the §4 cap of 5. Mirroring Batch 3's deviation justification: every fix is a single numeric literal change, no cross-module entanglement, two clean thematic groups within one diff surface. Per-module cluster summaries are preserved.

**Audit gap observed, not in scope:**
- **OscB.coarse** at `src/AudioEngine.js:192` is also `min: -60, max: 60`. Spec §2.3 says "Coarse/Fine/KBT: Same as OscA" (`BORED_MODULAR_DESIGN.md:145`), so the spec range is ±64 here as well. The Batch 3 audit's OscB cluster did not record a coarse-widening finding; this is an audit gap rather than a deliberate divergence. Deferred to a follow-up audit pass — not silently extended into this batch. **Backfilled 2026-05-15 as OscB-F9** so future widening clusters discover it via the canonical per-module subsection.
- **SpectralOsc.coarse** at `src/AudioEngine.js:297` is `min: -24, max: 24`, narrower than spec's C-1..G9 (~±64); SpcOsc-F1 records this as `fix-toward-spec (blocked: widening — defer to fix batch)`. Not on Batch 3's quick-win list, so out of scope for Batch 5; flagged here so a future fix batch can pick it up alongside OscB. (This one was already recorded in the per-module subsection; the cross-reference is preserved here for context.)

**Playbook leverage signals:**
- The cluster deliberately *omits* LFOA-F1 (rate widening) and ADSREnv-F1 (envelope time widening) from Batch 3's quick-win list. LFOA-F1's sibling F2 needs to be re-derived once `rate` widens — applying F1 alone leaves Sub-range insufficient. ADSREnv-F1 lowers the floor (0.001 → 0.0005 s) which doubles snappiness at the same slider position — not a clean widening. Both deferred to brainstorms.
- Eight one-literal edits with no cross-module entanglement made `replace_all` tempting but unsafe: a literal `replace_all` on `coarse: { value: 0, min: -60, max: 60, label: "Coarse" }` would have silently caught OscB (line 192), which is *not* in this batch's scope per the audit-gap observation above. Hand-edited instead with disambiguating multi-line context per target.

---

## Batch 6 — Range narrowings (2026-05-15)

Two range narrowings drawn from Batch 3's quick-win list (`:1067-1073`), both previously blocked on the playbook §5 saved-patch scan. The scan was waived for this batch on direct maintainer direction: the project is still in development mode, no saved patches need preservation, so the silent-stale-value risk that motivates §5 doesn't apply here.

**Modules covered:** 2 — `OscA` (fine range), `PortamentoA` (time range).

**Findings resolved:**
- **OscA-F2** — `fine.min/max: ±100 → ±50` cents, matching spec ±half-semitone (`BORED_MODULAR_DESIGN.md:132`).
- **Porta-F2** — `time.min/max: 0.001..2 → 0.0053..1.355` s, matching spec "5.3 to 1355 ms" (`:867`).

**Dispositions:**
- 2 `fix-toward-spec` applied.
- 0 other dispositions surfaced this batch.

**Code change applied:**
- `src/AudioEngine.js:158` (`_createOscA`): `fine.min/max: -100..100 → -50..50`.
- `src/AudioEngine.js:1267` (`_createPortamentoA`): `time.min/max: 0.001..2 → 0.0053..1.355`.

**Patch-load impact:** narrowings — would normally require the playbook §5 saved-patch scan to verify no in-flight saved values fall outside the new range. Scan waived on direct maintainer direction (dev-mode project, no saved patches need preservation). Recorded explicitly in the affected per-module dispositions and cluster summaries.

**User-visible effects worth noting:**
- `OscA.fine`: the cents knob now travels half as far per slider unit — fine-tune resolution is the same (continuous), but the range stops at ±50 cents instead of ±100. A user accustomed to ±100 will hit the ceiling sooner.
- `PortamentoA.time`: fastest glide moves from 1 ms to 5.3 ms (slightly slower); slowest glide moves from 2 s to 1.355 s (slightly faster). The `setParam` mapping (`cutoff = max(0.5, 1 / (time * 2))`) is range-agnostic — only the slider extremes change.

**Playbook leverage signals:**
- Documenting the §5 scan waiver explicitly (rather than silently skipping it) keeps the audit honest about why this batch differs from the §5 default. If saved-patch preservation later becomes a requirement (post-launch, public release, etc.), the waiver can be revisited per-finding rather than re-litigated from scratch.
- This is the first batch to apply a `fix-toward-spec (blocked: ... patch-load scan per §5)` finding by waiving rather than satisfying the scan. The waiver is dev-mode-specific; the §5 rule itself stays in place for future batches.

**Audit gap observed, not in scope:**
- **SpectralOsc.fine** at `src/AudioEngine.js:298` is also `min: -100, max: 100` — same shape as OscA's pre-fix state. The Batch 3 audit's SpectralOsc cluster did not record a fine-narrowing finding; this joins the `OscB.coarse` and `SpectralOsc.coarse` gaps surfaced in Batch 5. **Backfilled 2026-05-15 as SpcOsc-F9** so future narrowing clusters discover it via the canonical per-module subsection.

---

## Module Count Summary

- **Spec total:** 109 modules across 10 groups (`BORED_MODULAR_DESIGN.md:1059-1080`).
- **Impl total:** 42 modules across 6 categories (`src/moduleDefs.js`). Up from the 41 at Batch 3 — `GainControl` was added in Batch 4 alongside the Amplifier narrowing.
- **Audited so far:** 42 (all implemented modules) — `Amplifier`, `ClkGen`, `RandomGen` in Batches 1-2; the remaining 38 in Batch 3; `GainControl` (new) plus an `Amplifier` re-audit in Batch 4.
- **Spec-only modules (coverage gaps, ~67):** every spec module without an impl counterpart. Includes the entire Logic group (§9), most of Audio Modifier (§7) and Control Modifier (§8), the LFO/random slave-class modules (`LFOSlvA-E`, `RndStepGen`, `ClkRndGen`, `RndPulsGen`, `PatternGen`), and many partial group entries. Coverage closure is deferred to a separate plan.
- **Impl-only modules:** `Delay` (long echo, no spec counterpart in §7 — see Delay-F1). `Envelope` is borderline impl-only (stripped ADSR with no clear spec match — see Envelope-F1).

Names and shapes diverging between impl and spec where audited:
- impl `Amplifier` matches spec §6.13 cleanly after the 2026-05-13 split (fixed-gain, range 0.25–4.0×, no mod input).
- impl `GainControl` matches spec §6.3 in name and core shape; carries an impl-only `level` knob recorded as finding G1 (`keep-as-divergence`, category 2 extension).
- impl `ClkGen` matches spec §3.9 in name; output port keys diverge (`Clk24`/`Clk4` vs spec `24 Pulses/B`/`4 Pulses/B`); missing `Reset` input and `Slv` output. See finding C5 and S4.
- impl `RandomGen` matches spec §3.12 in name but is standalone (absolute rate) where spec is slave-class (master-relative rate via `Mst` input). See finding R1 and S4.
- impl `Filter` is closest to spec §5.4 FilterD by feature set; name divergence captured in Filter-F6.
- impl `Panner` matches spec §6.5 Pan in feature set; name divergence captured in Panner-F2.
- impl `Chorus` matches spec §7.8 StereoChorus; name divergence captured in Chorus-F3.
- impl `LFO` matches spec §3.3 LFOC most closely but is sparser; multiple missing affordances captured in LFO-F1..F5.
- impl `ShortDelay` matches spec §7.5 Delay (Short) but adds feedback + mix params (ShortDelay-F3) and lacks the fixed-2.65ms output (ShortDelay-F2).
- impl `Delay` has no spec counterpart (Delay-F1, kept as cat-2 extension).
- impl `Envelope` and `ADSREnv` overlap roles (Envelope-F1).
- impl `Output` matches only spec §1.7 (2 Outputs variant) of three spec variants (Out-F1).
- impl `Keyboard` Note output is in Hz rather than spec's ±64 units (Kbd-F1, kept as cat-1 DSP approximation).

This summary is a one-line-per-module index; the per-module audits above are the canonical record.
