# Implementation Audit Report

A growing record of how the implementation in `src/` compares to the spec corpus, audited per batch. Each batch appends its scoped audit; the report is allowed to be incomplete.

**Status: 2026-05-06.** Two batches landed; 3 modules audited (`Amplifier`, `ClkGen`, `RandomGen`). Systemic findings: S1-S4 (port-colour, attenuator-type, layout, non-oscillator master/slave architecture). On 2026-05-06 the disposition framework was reframed to make spec the source of truth (see Disposition section); Amplifier findings F1/F2a/F3 were re-dispositioned. Most modules remain unaudited — by design; lazy/incremental.

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

### 6.13 Amplifier (impl: `Amplifier`) — audited 2026-05-04, batch 1

- **Spec:** `BORED_MODULAR_DESIGN.md:698-702` (Amplifier — fixed gain/attenuation), `MODULE_LAYOUTS.md:391-393`.
- **Impl:** `src/AudioEngine.js:1112-1124` (`_createAmplifier`), `src/moduleDefs.js:264-272` (`MODULE_DEFS.Amplifier`).

The spec's `Amplifier` (§6.13) is a fixed-gain attenuation module with no modulation input. The impl is named `Amplifier` but functionally implements `GainControl` (VCA, spec §6.3): it has a `GainMod` mod input and the moduleDefs description reads "Voltage controlled amplifier". This is the first concrete exercise of the tri-state framework — most findings below trace back to this name-vs-function divergence.

- **Finding F1 — Name-vs-function hybrid.** Impl module type "Amplifier" combines the name from spec §6.13 with the function (mod-controlled VCA) of spec §6.3 GainControl. **Severity:** Minor (impl works correctly as a VCA; the name doesn't match its function relative to spec). **Disposition:** `undecided`. Resolution requires a structural call: rename impl module type to `GainControl` (param-key change → patch-load risk per §5), or split into two modules (a fixed-gain `Amplifier` matching §6.13, plus a `GainControl` matching §6.3), or another path. Re-dispositioned 2026-05-06 from `keep-as-divergence`; the original "more intuitive" rationale was feature-level and does not survive the spec-as-source-of-truth frame.
- **Finding F2a — Range minimum (0 vs 0.25).** Impl `level.min = 0`; spec `Amplification` range starts at `0.25x`. **Severity:** Minor. **Disposition:** `fix-toward-spec (blocked: range narrowing requires patch-load scan and handling per playbook §5; revisit when narrowing is safe to apply)`. Re-dispositioned 2026-05-06 from `keep-as-divergence`; the original "full-mute is useful in modular synthesis" rationale was feature-level (not DSP-level approximation, not a spec-tolerated extension, not a durable design call) and did not survive the divergence rationale rule.
- **Finding F2b — Range maximum (1.0 vs 4.0).** Impl `level.max = 1`; spec range goes to `4.0x`. **Severity:** Critical (impl can't boost — limits useful patches that need to amplify weak signals). **Disposition:** `fix-toward-spec` (applied this batch). Range *widening* is patch-load-safe — any saved 0-1 value remains valid in the new 0-4 range. Resolution: changed `level.max` from `1` to `4` in `src/AudioEngine.js:1121`.
- **Finding F3 — `GainMod` input presence.** Impl has `GainMod` mod input; spec §6.13 has no mod input. **Severity:** Minor (consequence of F1). **Disposition:** `undecided`. Depends on F1 resolution: if F1 splits Amplifier into two modules, F3 disappears (the §6.13 module loses `GainMod`; the §6.3 module retains it as spec-required); if F1 renames to `GainControl`, F3 becomes spec-correct. Re-dispositioned 2026-05-06 from `keep-as-divergence`.
- **Finding F4 — `Unipolar` button absent.** Spec §6.3 GainControl has a `Unipolar` button ("Converts bipolar control to unipolar (divides by 2, adds +32 bias)"). Impl has no such button. **Severity:** Minor (real feature, but not strictly required for VCA behaviour). **Disposition:** `undecided`. Adding it requires inserting a half-and-offset stage on the `GainMod` input plus a UI toggle. Worth a follow-up consideration in a later batch — not high-priority.
- **Finding F5 — Amplification value display absent.** Spec §6.13 layout includes an `[Amplification Display]` showing the numeric gain value. Impl renders only a slider with the value-as-position; no readout. **Severity:** Minor. **Disposition:** `undecided`. Visual-layout fidelity is deferred to a separate audit batch (see S3 systemic finding). When that batch runs, this finding folds in.
- **Finding F6 — Default value (0.8).** Impl `level.value = 0.8`; spec doesn't state a default for `Amplification`. **Severity:** Out-of-scope (spec is silent).
- **Finding F7 — Param key `level` vs spec knob "Amplification".** Spec calls the knob `Amplification`; impl uses key `level` and label `"Level"`. **Severity:** Minor (cosmetic naming). **Disposition:** `undecided`. Renaming the param key would silently drop the saved value from any pre-existing patch (param renames trigger the no-op branch in `setParam`, see `src/AudioEngine.js:1603`). The label-only change ("Level" → "Amplification") is safe but cosmetic; deferred until a UI/labelling batch makes that call.

**Cluster summary:**
- Findings: 7 in-scope + 1 out-of-scope = 8 total.
- Dispositions: 1 `fix-toward-spec` applied (F2b), 1 `fix-toward-spec` blocked (F2a — patch-load), 0 `keep-as-divergence`, 5 `undecided` (F1, F3, F4, F5, F7), 1 out-of-scope (F6).
- Code change applied: `src/AudioEngine.js:1121` — `level.max: 1 → 4`.
- Patch-load impact: none (range widened, not narrowed).
- Re-dispositioned 2026-05-06 under the corrected spec-as-source-of-truth frame: F1 → undecided, F2a → fix-toward-spec (blocked), F3 → undecided.

---

## Module Count Summary

- **Spec total:** 109 modules across 10 groups (`BORED_MODULAR_DESIGN.md:1059-1080`).
- **Impl total:** 39 modules across 6 categories (`src/moduleDefs.js`).
- **Audited so far:** 3 (`Amplifier`, `ClkGen`, `RandomGen`).
- **Spec-only modules (coverage gaps, ~70):** every spec module without an impl counterpart. Includes the entire Logic group (§9), most of Audio Modifier (§7) and Control Modifier (§8), the LFO/random slave-class modules (`LFOSlvA-E`, `RndStepGen`, `ClkRndGen`, `RndPulsGen`, `PatternGen`), and many partial group entries. Coverage closure is deferred to a separate plan.
- **Impl-only modules:** notable impl-only entries surface as audit batches reach them. None currently identified — the former `Mixer2` (impl-only 2-input mixer) was reshaped to match spec §6.1 and now ships as `Mixer3`; legacy `"type": "Mixer2"` payloads still load via an alias in `AudioEngine.createModule`.

Names and shapes diverging between impl and spec where audited:
- impl `Amplifier` is a hybrid: name from spec §6.13 Amplifier, function from spec §6.3 GainControl. See per-module audit above.
- impl `ClkGen` matches spec §3.9 in name; output port keys diverge (`Clk24`/`Clk4` vs spec `24 Pulses/B`/`4 Pulses/B`); missing `Reset` input and `Slv` output. See finding C5 and S4.
- impl `RandomGen` matches spec §3.12 in name but is standalone (absolute rate) where spec is slave-class (master-relative rate via `Mst` input). See finding R1 and S4.

The Module Count Summary grows as batches audit additional clusters. Modules without subsections in this report have not yet been audited; their absence is not a finding, just a not-yet.
