# Implementation Audit Report

A growing record of how the implementation in `src/` compares to the spec corpus, audited per batch. Each batch appends its scoped audit; the report is allowed to be incomplete.

**Status: 2026-05-04 — Initial seed.** First batch (Unit 1 of `docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md`) audits `Amplifier`. Systemic findings header seeded with port-colour and attenuator-type entries. Most modules remain unaudited — this is by design; lazy/incremental.

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

Every finding carries a disposition (default `undecided`). Severity describes deviation magnitude; disposition describes intent.

- **`fix-toward-spec`** — impl will be changed to match spec. For findings touching user-visible behavior, requires a one-line rationale on why the spec value is right for the homage product.
- **`keep-as-divergence`** — impl deliberately diverges. Always carries a rationale (homage, ergonomics, DSP cost, etc.).
- **`undecided`** — finding documented; decision deferred. Default state for new findings.

`Critical` severity does not imply `fix-toward-spec` disposition. The two are independent.

---

## Systemic Findings

These cross-cutting findings affect every module. Recording once here; not repeated per-module.

### S1. Port-colour semantics

- **Spec:** signal-type-based — Red=audio, Blue=control, Yellow=logic, Gray=slave (`BORED_MODULAR_DESIGN.md:13-17`).
- **Impl:** direction-based — Red=output, Blue=audio-in, Yellow=mod-in (`src/BoredModularEmulator.jsx:184` — `const color = isOutput ? "#f44" : isMod ? "#fc0" : "#4cf";`).
- **Severity:** Critical (cross-cutting; every module's port colours read differently than spec).
- **Disposition:** `keep-as-divergence`. Direction-based is more learnable for users without prior modular-synth fluency; the homage frame (`CLAUDE.md`: "spiritual homage … not a clone") accommodates UX-improving divergences. A future overhaul to signal-type colours would require its own brainstorm + plan (see `docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md` Scope Boundaries).

### S2. Attenuator-type metadata

- **Spec:** every modulation input is tagged with attenuator type — Type I (linear), Type II (exponential), or Type III (bipolar). Examples: `Pitch Mod x2 (Inputs, Red): [Attenuator Type II]` (`BORED_MODULAR_DESIGN.md:134`).
- **Impl:** no Type I/II/III metadata anywhere. `MODULE_DEFS` lists mod inputs as port-name strings; `_create<Type>` returns raw `AudioParam` references with no curve / response-shape annotation.
- **Severity:** Critical.
- **Disposition:** `undecided`. Threading attenuator behaviour through `MODULE_DEFS`, the cable-drag UI, and per-input curve logic is its own substantial change. Surfaces here so per-module audits don't repeat "no attenuator-type metadata" across all 39 modules.

### S3. Layout encoding

- **Spec:** `MODULE_LAYOUTS.md` describes panel illustrations from the PDF — row arrangement, control grouping, control ordering.
- **Impl:** no panel illustration encoding. Module visual layout is computed from `MODULE_DEFS` (`inputs`, `modInputs`, `outputs`) plus the optional `customUIHeight: N` for in-module SVG widgets. The whole "layout" dimension is therefore systemic — nothing per-module to audit until layout is encoded.
- **Severity:** Out-of-scope at the per-module level. Critical at the systemic level if visual fidelity becomes a goal.
- **Disposition:** `undecided`. Visual-layout fidelity is deferred to its own batch with its own methodology (see plan Scope Boundaries: "visual-layout audit … future batch with explicit methodology run").

---

## Per-module audits

Group sections appear as their batches are run. Modules not yet audited are listed in the Module Count Summary at the end.

## 6. Mixer Group

### 6.13 Amplifier (impl: `Amplifier`) — audited 2026-05-04, batch 1

- **Spec:** `BORED_MODULAR_DESIGN.md:698-702` (Amplifier — fixed gain/attenuation), `MODULE_LAYOUTS.md:391-393`.
- **Impl:** `src/AudioEngine.js:1112-1124` (`_createAmplifier`), `src/moduleDefs.js:264-272` (`MODULE_DEFS.Amplifier`).

The spec's `Amplifier` (§6.13) is a fixed-gain attenuation module with no modulation input. The impl is named `Amplifier` but functionally implements `GainControl` (VCA, spec §6.3): it has a `GainMod` mod input and the moduleDefs description reads "Voltage controlled amplifier". This is the first concrete exercise of the tri-state framework — most findings below trace back to this name-vs-function divergence.

- **Finding F1 — Name-vs-function hybrid.** Impl module type "Amplifier" combines the name from spec §6.13 with the function (mod-controlled VCA) of spec §6.3 GainControl. **Severity:** Minor (the impl works correctly as a VCA; the name just doesn't match its function relative to spec). **Disposition:** `keep-as-divergence`. Rationale: the name "Amplifier" is more intuitive to users without prior modular-synth fluency than "GainControl" or "VCA"; the homage frame accommodates name-from-one-spec-module + function-from-another. Spec §6.3 GainControl remains a future coverage candidate (a separate, true fixed-gain "Amplifier" matching §6.13 could be added later if needed).
- **Finding F2a — Range minimum (0 vs 0.25).** Impl `level.min = 0`; spec `Amplification` range starts at `0.25x`. **Severity:** Minor. **Disposition:** `keep-as-divergence`. Rationale: full-mute (gain = 0) is a useful patch operation in modular synthesis (e.g., as a kill-switch via mod input); spec's 0.25 minimum is unnecessarily conservative for digital audio.
- **Finding F2b — Range maximum (1.0 vs 4.0).** Impl `level.max = 1`; spec range goes to `4.0x`. **Severity:** Critical (impl can't boost — limits useful patches that need to amplify weak signals). **Disposition:** `fix-toward-spec` (applied this batch). Rationale: signal boost is useful for amplifying low-level inputs (e.g., from a future `AudioIn` module) and for envelope-modulated dynamics where the modulator briefly drives gain above unity. Range *widening* is patch-load-safe — any saved 0-1 value remains valid in the new 0-4 range. Resolution: changed `level.max` from `1` to `4` in `src/AudioEngine.js:1121`.
- **Finding F3 — `GainMod` input presence.** Impl has `GainMod` mod input; spec §6.13 has no mod input. **Severity:** Minor (consequence of F1). **Disposition:** `keep-as-divergence`. Rationale: `GainMod` is what makes this a VCA; removing it would convert the impl into a fixed-gain attenuator (matching §6.13 strictly) but lose the mod-routing affordance that makes the module practically useful. Per F1's hybrid disposition, `GainMod` stays.
- **Finding F4 — `Unipolar` button absent.** Spec §6.3 GainControl has a `Unipolar` button ("Converts bipolar control to unipolar (divides by 2, adds +32 bias)"). Impl has no such button. **Severity:** Minor (real feature, but not strictly required for VCA behaviour). **Disposition:** `undecided`. Adding it requires inserting a half-and-offset stage on the `GainMod` input plus a UI toggle. Worth a follow-up consideration in a later batch — not high-priority.
- **Finding F5 — Amplification value display absent.** Spec §6.13 layout includes an `[Amplification Display]` showing the numeric gain value. Impl renders only a slider with the value-as-position; no readout. **Severity:** Minor. **Disposition:** `undecided`. Visual-layout fidelity is deferred to a separate audit batch (see S3 systemic finding). When that batch runs, this finding folds in.
- **Finding F6 — Default value (0.8).** Impl `level.value = 0.8`; spec doesn't state a default for `Amplification`. **Severity:** Out-of-scope (spec is silent).
- **Finding F7 — Param key `level` vs spec knob "Amplification".** Spec calls the knob `Amplification`; impl uses key `level` and label `"Level"`. **Severity:** Minor (cosmetic naming). **Disposition:** `undecided`. Renaming the param key would silently drop the saved value from any pre-existing patch (param renames trigger the no-op branch in `setParam`, see `src/AudioEngine.js:1603`). The label-only change ("Level" → "Amplification") is safe but cosmetic; deferred until a UI/labelling batch makes that call.

**Cluster summary:**
- Findings: 7 in-scope + 1 out-of-scope = 8 total.
- Dispositions: 1 `fix-toward-spec` (F2b — applied), 3 `keep-as-divergence` (F1, F2a, F3), 3 `undecided` (F4, F5, F7), 1 out-of-scope (F6).
- Code change applied: `src/AudioEngine.js:1121` — `level.max: 1 → 4`.
- Patch-load impact: none (range widened, not narrowed).

---

## Module Count Summary

- **Spec total:** 109 modules across 10 groups (`BORED_MODULAR_DESIGN.md:1059-1080`).
- **Impl total:** 39 modules across 6 categories (`src/moduleDefs.js`).
- **Audited so far:** 1 (`Amplifier`).
- **Spec-only modules (coverage gaps, ~70):** every spec module without an impl counterpart. Includes the entire Logic group (§9), most of Audio Modifier (§7) and Control Modifier (§8), and many partial group entries. Coverage closure is deferred to a separate plan.
- **Impl-only modules:** notable impl-only entries surface as audit batches reach them. Currently identified: `Mixer2` (impl 2-input mixer; spec has §6.1 3-input and §6.2 8-input — Mixer2 is impl-only).

Names diverging between impl and spec where audited:
- impl `Amplifier` is a hybrid: name from spec §6.13 Amplifier, function from spec §6.3 GainControl. See per-module audit above.

The Module Count Summary grows as batches audit additional clusters. Modules without subsections in this report have not yet been audited; their absence is not a finding, just a not-yet.
