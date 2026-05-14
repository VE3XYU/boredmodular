# Implementation Audit Report

A growing record of how the implementation in `src/` compares to the spec corpus, audited per batch. Each batch appends its scoped audit; the report is allowed to be incomplete.

**Status: 2026-05-13.** Three batches landed; 4 modules audited (`Amplifier`, `ClkGen`, `RandomGen`, `GainControl`). Systemic findings: S1-S4 (port-colour, attenuator-type, layout, non-oscillator master/slave architecture). On 2026-05-06 the disposition framework was reframed to make spec the source of truth (see Disposition section); Amplifier findings F1/F2a/F3 were re-dispositioned. On 2026-05-13 the Amplifier hybrid was split into spec §6.13 `Amplifier` (fixed-gain) and a new spec §6.3 `GainControl` (VCA); F1/F2a/F3/F4/F7 now resolved. Most modules remain unaudited — by design; lazy/incremental.

## Sources

- **Spec corpus:** `sourcemats/BORED_MODULAR_DESIGN.md`, `sourcemats/MODULE_LAYOUTS.md` (validated against the PDF in `sourcemats/SPEC_AUDIT_REPORT.md`).
- **Implementation:** `src/AudioEngine.js` (`_create<Type>` methods, `setParam` cross-param branches), `src/moduleDefs.js` (`MODULE_DEFS`, `CATEGORIES`), `src/BoredModularEmulator.jsx` (`Port` rendering, `loadPatchData`).

## Scope

- All implemented modules in `src/` (39 currently) are eligible for this audit.
- Each batch audits the cluster it modifies. The report grows over time; "complete" is not a goal.
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
- **Impl:** direction-based — Red=output, Blue=audio-in, Yellow=mod-in (`src/BoredModularEmulator.jsx:184` — `const color = isOutput ? "#f44" : isMod ? "#fc0" : "#4cf";`).
- **Severity:** Critical (cross-cutting; every module's port colours read differently than spec).
- **Disposition:** `fix-toward-spec (blocked: cross-cutting overhaul requires its own brainstorm + plan due to scope and visual-design implications)`. The "more learnable for users without prior modular-synth fluency" argument is feature-level, not DSP-level, and does not survive the spec-as-source-of-truth frame; spec convention is canonical pending a deliberate design call to keep the divergence. See `docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md` Scope Boundaries for the deferral.

### S2. Attenuator-type metadata

- **Spec:** every modulation input is tagged with attenuator type — Type I (linear), Type II (exponential), or Type III (bipolar). Examples: `Pitch Mod x2 (Inputs, Red): [Attenuator Type II]` (`BORED_MODULAR_DESIGN.md:134`).
- **Impl:** no Type I/II/III metadata anywhere. `MODULE_DEFS` lists mod inputs as port-name strings; `_create<Type>` returns raw `AudioParam` references with no curve / response-shape annotation.
- **Severity:** Critical.
- **Disposition:** `fix-toward-spec (blocked: requires threading attenuator behavior through MODULE_DEFS, the cable-drag UI, and per-input curve logic — substantial cross-cutting change)`. Surfaces here so per-module audits don't repeat "no attenuator-type metadata" across all 39 modules.

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

---

## Per-module audits

Group sections appear as their batches are run. Modules not yet audited are listed in the Module Count Summary at the end.

## 3. LFO Group

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

## 6. Mixer Group

### 6.3 GainControl (impl: `GainControl`) — audited 2026-05-13, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:629-635` (GainControl (VCA) — voltage-controlled amplifier; can function as ring/amplitude modulator).
- **Impl:** `src/AudioEngine.js` (`_createGainControl`), `src/moduleDefs.js` (`MODULE_DEFS.GainControl`).

The spec's `GainControl` is a VCA: a carrier `Input`, a `Control` mod input, an `Output`, and a `Unipolar` button that switches between ring-mod (bipolar control) and AM (unipolar control). Added in batch 3 alongside the Amplifier split (see Amplifier subsection below for the rationale). Internally a `ctrlIn` GainNode feeds two parallel paths into `gainNode.gain`: a bipolar gate (passes raw control) and a unipolar half-and-bias gate (×0.5 plus a +0.5 ConstantSource). Flipping the `unipolar` param swaps the active gates via `setParam`.

- **Finding G1 — Impl-only `level` knob.** Impl has a `level` slider (0–4, default 0.8) that sets `gainNode.gain.value` as a baseline; the spec §6.3 GainControl has no level control — gain is defined entirely by the Control signal. **Severity:** Minor. **Disposition:** `keep-as-divergence`. Rationale: extension the spec doesn't preclude (category 2 of playbook §2.3). The level knob carries the saved value forward from migrated pre-split Amplifier patches and lets users set a baseline without needing an external `ConstantSource` for "fixed gain with Ctrl summed in." Doesn't replace any spec feature, doesn't change spec-required Ctrl behaviour.
- **Finding G2 — `Ctrl` port colour (folds to S1).** Spec colours `Control` as Red (audio bus); impl renders it as a yellow mod-input per the direction-based convention. Folds to S1 systemic; no per-module action.
- **Finding G3 — Default values.** Impl defaults: `level=0.8`, `unipolar="off"`. Spec is silent on defaults. **Severity:** Out-of-scope.
- **Finding G4 — `Unipolar` button shape.** Spec defines a button with two states ("Unipolar off" = ring mod, "Unipolar on" = AM). Impl renders this as a select dropdown with `options: ["off", "on"]` — same pattern as `ClkGen.active` (folds to C1 / S3 layout encoding). **Severity:** Minor. **Disposition:** `fix-toward-spec (blocked: MODULE_DEFS schema does not currently distinguish button-style binary widgets from selector-style options — same blocker as ClkGen C1)`.

**Cluster summary (GainControl):**
- Findings: 3 in-scope + 1 out-of-scope = 4 total.
- Dispositions: 1 `keep-as-divergence` (G1 — extension, category 2), 1 `fix-toward-spec (blocked)` (G4 — same blocker as C1), 1 folds-to-S1 (G2), 1 out-of-scope (G3).
- Code change applied: new `_createGainControl` in `src/AudioEngine.js`, new `GainControl` entry in `src/moduleDefs.js`, conditional patch-load migration in `src/BoredModularEmulator.jsx`.
- Patch-load impact: legacy Amplifier patches with a `GainMod` connection retype to GainControl (level value preserved, port renamed `GainMod → Ctrl`); legacy Amplifier patches without a `GainMod` connection stay as the new fixed-gain Amplifier (level clamped into [0.25, 4.0]).

### 6.13 Amplifier (impl: `Amplifier`) — audited 2026-05-04, batch 1; updated 2026-05-13, batch 3

- **Spec:** `BORED_MODULAR_DESIGN.md:698-702` (Amplifier — fixed gain/attenuation), `MODULE_LAYOUTS.md:391-393`.
- **Impl:** `src/AudioEngine.js` (`_createAmplifier`), `src/moduleDefs.js` (`MODULE_DEFS.Amplifier`).

The spec's `Amplifier` (§6.13) is a fixed-gain attenuation module with no modulation input. Pre-batch-3 the impl was named `Amplifier` but functionally implemented `GainControl` (VCA, spec §6.3): it had a `GainMod` mod input and the moduleDefs description read "Voltage controlled amplifier." Batch 3 resolved the hybrid by splitting: the impl `Amplifier` was narrowed to the spec §6.13 shape (no mod input, range 0.25–4.0×, label "Amplification"), and a new `GainControl` module was added to cover the spec §6.3 VCA role (see GainControl subsection above). Findings F1, F2a, F3, F4, F7 all resolved this batch.

- **Finding F1 — Name-vs-function hybrid.** Impl module type "Amplifier" combined the name from spec §6.13 with the function (mod-controlled VCA) of spec §6.3 GainControl. **Severity:** Minor. **Disposition:** `fix-toward-spec` (applied 2026-05-13 in batch 3 — split into two modules: fixed-gain `Amplifier` per §6.13, new `GainControl` per §6.3). Re-dispositioned 2026-05-06 from `keep-as-divergence` to `undecided`; now resolved.
- **Finding F2a — Range minimum (0 vs 0.25).** Impl had `level.min = 0`; spec `Amplification` range starts at `0.25x`. **Severity:** Minor. **Disposition:** `fix-toward-spec` (applied 2026-05-13 in batch 3 — `level.min: 0 → 0.25`). Patch-load safety handled by a conditional migration in `loadPatchData`: saved Amplifier patches with no `GainMod` connection stay as Amplifier and have their `level` clamped into the new range; patches with a `GainMod` connection retype to GainControl (whose `level.min` stays at 0). Re-dispositioned 2026-05-06 from `keep-as-divergence`; now resolved.
- **Finding F2b — Range maximum (1.0 vs 4.0).** Impl `level.max` was 1; spec range goes to `4.0x`. **Severity:** Critical. **Disposition:** `fix-toward-spec` (applied 2026-05-04 in batch 1 — `level.max: 1 → 4`).
- **Finding F3 — `GainMod` input presence.** Impl had a `GainMod` mod input; spec §6.13 has no mod input. **Severity:** Minor (consequence of F1). **Disposition:** `fix-toward-spec` (applied 2026-05-13 in batch 3 — `GainMod` removed from `Amplifier`, moved to the new `GainControl` as port `Ctrl` per spec §6.3). Re-dispositioned 2026-05-06 from `keep-as-divergence`; now resolved.
- **Finding F4 — `Unipolar` button absent.** Spec §6.3 GainControl has a `Unipolar` button ("Converts bipolar control to unipolar (divides by 2, adds +32 bias)"). **Severity:** Minor. **Disposition:** `fix-toward-spec` (applied 2026-05-13 in batch 3 — Unipolar toggle added to the new `GainControl` module; widget renders as a select dropdown per the existing on/off param pattern, see GainControl finding G4 for the button-vs-selector follow-up).
- **Finding F5 — Amplification value display absent.** Spec §6.13 layout includes an `[Amplification Display]` showing the numeric gain value. Impl renders only a slider with the value-as-position; no readout. **Severity:** Minor. **Disposition:** `undecided`. Visual-layout fidelity is deferred to a separate audit batch (see S3 systemic finding). When that batch runs, this finding folds in.
- **Finding F6 — Default value (0.8).** Impl `level.value = 0.8`; spec doesn't state a default for `Amplification`. **Severity:** Out-of-scope (spec is silent).
- **Finding F7 — Param key `level` vs spec knob "Amplification".** Spec calls the knob `Amplification`; impl uses key `level`. **Severity:** Minor (cosmetic naming). **Disposition:** `fix-toward-spec` (applied 2026-05-13 in batch 3 — label changed `"Level" → "Amplification"`; the param key `level` stays unchanged to keep saved patches loading).

**Cluster summary (Amplifier — batch 3 update):**
- Findings: 7 in-scope + 1 out-of-scope = 8 total.
- Dispositions: 6 `fix-toward-spec` applied (F1, F2a, F2b, F3, F4, F7), 1 `undecided` (F5 — folds to S3), 1 out-of-scope (F6). Zero `keep-as-divergence` on this module after the split (the impl-only level knob moved with the VCA behaviour to GainControl and is recorded there as G1).
- Code change applied: `src/AudioEngine.js` `_createAmplifier` updated (`level.min: 0 → 0.25`, `GainMod` removed, label "Amplification"); new `_createGainControl` added; new switch case in `createModule`; new `unipolar` cross-param branch in `setParam`. `src/moduleDefs.js` updated for both modules. `src/BoredModularEmulator.jsx` `loadPatchData` adds the conditional Amplifier→GainControl retype + GainMod→Ctrl port rename + level clamp.
- Patch-load impact: conditional migration. Pre-split Amplifier patches with a `GainMod` connection retype to GainControl (`level` carries forward unchanged). Pre-split Amplifier patches without a `GainMod` connection stay as the new fixed-gain Amplifier (`level` clamped to `[0.25, 4.0]` on load — a saved value of 0 lands at 0.25). User-exported patch JSON outside the repo: best-effort per playbook §5.

---

## Module Count Summary

- **Spec total:** 109 modules across 10 groups (`BORED_MODULAR_DESIGN.md:1059-1080`).
- **Impl total:** 40 modules across 6 categories (`src/moduleDefs.js`).
- **Audited so far:** 4 (`Amplifier`, `ClkGen`, `RandomGen`, `GainControl`).
- **Spec-only modules (coverage gaps, ~70):** every spec module without an impl counterpart. Includes the entire Logic group (§9), most of Audio Modifier (§7) and Control Modifier (§8), the LFO/random slave-class modules (`LFOSlvA-E`, `RndStepGen`, `ClkRndGen`, `RndPulsGen`, `PatternGen`), and many partial group entries. Coverage closure is deferred to a separate plan.
- **Impl-only modules:** notable impl-only entries surface as audit batches reach them. None currently identified — the former `Mixer2` (impl-only 2-input mixer) was reshaped to match spec §6.1 and now ships as `Mixer3`; legacy `"type": "Mixer2"` payloads still load via an alias in `AudioEngine.createModule`.

Names and shapes diverging between impl and spec where audited:
- impl `Amplifier` matches spec §6.13 cleanly after the 2026-05-13 split (fixed-gain, range 0.25–4.0×, no mod input).
- impl `GainControl` matches spec §6.3 in name and core shape; carries an impl-only `level` knob (extension, recorded as finding G1 keep-as-divergence). See per-module audit above.
- impl `ClkGen` matches spec §3.9 in name; output port keys diverge (`Clk24`/`Clk4` vs spec `24 Pulses/B`/`4 Pulses/B`); missing `Reset` input and `Slv` output. See finding C5 and S4.
- impl `RandomGen` matches spec §3.12 in name but is standalone (absolute rate) where spec is slave-class (master-relative rate via `Mst` input). See finding R1 and S4.

The Module Count Summary grows as batches audit additional clusters. Modules without subsections in this report have not yet been audited; their absence is not a finding, just a not-yet.
