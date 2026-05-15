# Module Playbook

> **Status (2026-05-06): static reference.** Parent plan (`docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md`) closed at Unit 5; the audit-batch workflow is retired. This file remains as a reference for what was audited and how, but new module work doesn't follow this practice unless it's deliberately re-adopted. The momentum checkpoint below fired in 2026-05-06 — kept here for the historical record.
>
> Procedural reference for module fidelity work in `src/`. Lives next to the spec corpus (`BORED_MODULAR_DESIGN.md`, `MODULE_LAYOUTS.md`, `SPEC_AUDIT_REPORT.md`, `IMPL_AUDIT_REPORT.md`) because that's where the work happens. Codified from real friction during Unit 1 of the parent plan; v0 is intentionally lean and grows from later batches.
>
> **Momentum checkpoint.** If maintaining this playbook starts feeling like ceremony rather than codification of real friction, that's a signal to revisit Unit 5 of the parent plan and decide whether the artifact is still earning its keep. The per-batch audit may be the durable mechanism here; the playbook may be dead weight.

## 1. Modify-a-module checklist

Refactor of `CLAUDE.md`'s "Adding a module requires" 5-step list, with verification anchors per step plus a sixth step (cleanup symmetry) the original list omits.

1. **`MODULE_DEFS` entry** in `src/moduleDefs.js`. Define `label`, `color`, `category`, `inputs`, `modInputs`, `outputs`, optional `customUIHeight`, and `description` (sidebar tooltip — internal, not audited; see §2).
   - Verify by: drop the module from the sidebar; module appears with correct ports and label.

2. **Category placement** in `CATEGORIES` (`src/moduleDefs.js:368`). Sidebar order is the array order.
   - Verify by: sidebar group placement matches expectation.

3. **`_create<Type>(id)` method** on `AudioEngine` (`src/AudioEngine.js`). Return shape: `{ id, type, node, outputNode, outputs, inputs, params, _nodes }` plus any system-specific fields (`_slaveTargets`, `_masterFreq`, `_clockSubscribers`, `_resetSubscribers`, `_pitchTargets`, `_gateTargetEnvelopes`).
   - Virtual ports (`Mst`, `Clk`, `Rst`) map to `null` in `inputs` and are handled before the `if (!inputNode) return false` guard in `connect`/`disconnect`.
   - Every oscillator `.start()`s on creation; audibility is gated by amplifier envelopes downstream, not by oscillator on/off.
   - Verify by: drop the module on the canvas; no console errors; default param values match what spec/intent says.

4. **`case "<Type>":` branch** in `AudioEngine.createModule()` switch (`src/AudioEngine.js:51`). The `OscC` / `OscSlvB` worklet-ready await is shared; new worklet modules go through the same path.
   - Verify by: instantiation through the sidebar (which calls `createModule`) produces the module without errors.

5. **`setParam` cross-param branches** (`src/AudioEngine.js:1603-1715`) only when the module needs cross-param sync (e.g., FilterC syncing freq/res across three filters; XFade inverse gain). If the param is purely declarative slider metadata or a single `AudioParam`, no branch is needed.
   - Verify by: tweak each param on the canvas; the audible/visible behaviour tracks; no stale values in linked nodes.

6. **`removeModule` cleanup symmetry** (`src/AudioEngine.js:1559-1595`). For every system-specific field added in step 3, verify the cleanup path. The existing `removeModule` covers: `_gateTargets` (Keyboard), master→slave references (`_slaveTargets`), slave→master references (`_masterModId`), ClkGen timer (`_timerId`), and node-level disconnect via `_nodes`. Modules introducing a new subscriber-pattern relationship need their cleanup added here.
   - Verify by: drop the module, patch it into a chain that exercises its system-specific field, then delete the module. No leaked subscribers; no stale references in counterpart modules; `npm start` console silent.

## 2. Audit methodology

Per-batch fidelity audits append to `IMPL_AUDIT_REPORT.md`. The report is allowed to be incomplete; "complete" is not a goal.

### Dimensions: 6 per-module, 3 systemic

The dimension list, severity grades, and disposition definitions live in `IMPL_AUDIT_REPORT.md:18-52`. The playbook describes *why* the split exists and how to apply it.

The split exists because attenuator-type and layout findings would, recorded per-module, produce ≥39 identical findings (one per implemented module). The systemic-dimension bucket records each once at the top of `IMPL_AUDIT_REPORT.md`; per-module subsections cite back by ID (S1, S2, S3) rather than restating.

**Description text (`MODULE_DEFS[type].description`) is not an audit dimension.** It's sidebar tooltip text — internal documentation, not user-facing per spec. Don't get sidetracked auditing description strings during a per-module pass.

**Impl-only spec-silent params are findings, not OOS.** When an impl param has no spec equivalent (e.g., `RandomGen.smoothing`, `RandomGen.amount`), it is a finding — severity defaults to Minor (the param is a user-visible knob). Out-of-scope applies only when spec genuinely doesn't speak to the dimension under audit (e.g., a default value when spec is silent on defaults). Disposition is usually `keep-as-divergence` under §2.3 category 2 (extension the spec doesn't preclude).

### Disposition shapes

The audit report's Disposition section (`IMPL_AUDIT_REPORT.md`) is canonical. The playbook calls out one frequently-used pattern explicitly:

- **`fix-toward-spec (blocked: <reason>)`** — the fix is correct in principle but waits on a named blocker: a design call, an external dependency, or a cross-cutting schema/rendering change. Reach for this when you would otherwise mark `undecided` but the fix's correctness is clear and only its application is gated. The named blocker matters: "blocked: depends on S4" is a specific pointer; `undecided` without a named blocker is a graveyard waiting to grow.

Examples of named blockers from existing batches:

- `(blocked: depends on systemic finding S4)` — fix waits on a cross-cutting architectural extension.
- `(blocked: design call needed — subscriber-pattern vs audio-rate input)` — fix waits on a deliberate choice between equally-valid impl patterns.
- `(blocked: range narrowing requires patch-load scan per §5; revisit when scan is run)` — fix waits on a safety check.
- `(blocked: MODULE_DEFS schema needs key/label separation)` — fix waits on a small but cross-cutting code change.

### Severity vs disposition are independent

Severity describes magnitude of deviation; disposition describes intent. A `Critical` finding can be `keep-as-divergence`, and a `Minor` finding can be `fix-toward-spec`. The two axes don't constrain each other.

**Worked example.** Systemic finding S1 (port-colour semantics, `IMPL_AUDIT_REPORT.md:60-65`) is **Critical** because the divergence is cross-cutting and every module reads differently than spec. Its disposition is **`fix-toward-spec (blocked: cross-cutting overhaul carries scope and visual-design implications; requires its own brainstorm + plan)`**. Severity is the magnitude; disposition is the call. The "more learnable" argument for direction-based does not survive the spec-as-source-of-truth frame (see §2.3); spec convention is canonical pending a deliberate design call to keep the divergence.

### Consequence findings

When a divergence is structurally caused by another (e.g., `RandomGen` missing `Mst` input is a direct consequence of `RandomGen` being standalone vs slave-class), record it as a separate finding for completeness but mark it `(consequence of <ID>)` and inherit the parent's disposition + rationale. Restating the rationale across consequence findings buries the architectural point; consequence-of-X notation keeps the per-port count honest while letting readers trace the chain back to the root cause.

### Divergence rationale rule

The PDF/spec corpus (`sourcemats/Bored Modular English User Manual - module reference only.pdf`, derived into `sourcemats/BORED_MODULAR_DESIGN.md`) is the source of truth for module shape: params, ranges, IO, behavior. CLAUDE.md's "spiritual homage … not cycle-accurate DSP" framing scopes narrowly to *implementation-level* fidelity — Web Audio approximations are allowed, AudioWorklet is optional, exact DSP graphs are not required. It does not extend to feature/parameter/IO divergence.

For any `keep-as-divergence` finding that touches user-visible behaviour (port count or direction, param names, default values, control ranges that change feel), require a one-line rationale fitting one of these three categories:

1. **DSP-level approximation** the spec implicitly tolerates (e.g., a Web Audio BiquadFilter standing in for a virtual-analog ladder filter; same musical character, lower implementation cost).
2. **Extension** the spec doesn't preclude (an impl-only utility param that doesn't replace any spec feature and doesn't change spec-required behavior).
3. **Durable design rationale** that survives spec adherence as the baseline — concrete enough that "more learnable" / "useful" / "saves implementation work" alone don't qualify.

Default-acceptance of divergences — letting "we just decided to do it differently" become an indistinguishable-from-default disposition — is the failure mode this rule prevents.

**Worked example (rejection).** Finding F2a in `IMPL_AUDIT_REPORT.md` — Amplifier `level.min`: impl 0, spec §6.13 0.25. Initially proposed `keep-as-divergence` with rationale "full-mute is a useful patch operation in modular synthesis." The rationale rule asks: is this a DSP-level approximation, a spec-tolerated extension, or a durable design rationale that survives spec-as-baseline? Full-mute is a feature-level affordance, not a DSP-level approximation; spec defines 0.25 as the minimum; "useful" alone doesn't qualify. Rejected. Disposition flips to `fix-toward-spec (blocked: range narrowing requires patch-load scan per §5; revisit when narrowing is safe to apply)`.

**Worked example (acceptance).** Findings R2/R3 in `IMPL_AUDIT_REPORT.md` — RandomGen impl-only `smoothing` (BiquadFilter LP cutoff) and `amount` (output gain stage), neither described in spec §3.12. Rationale: extensions the spec doesn't preclude — they don't replace any spec feature and don't change spec-required behavior; they let users dial fluid-vs-stepped random and scale to target ranges without an external utility module. Accepted as `keep-as-divergence` under category 2.

### What counts as a batch outcome

An audit batch with zero `fix-toward-spec` findings is still a batch. The audit *is* the deliverable; the per-cluster section in `IMPL_AUDIT_REPORT.md` records dispositions even when nothing changes in `src/`. Don't force a fix to make the batch feel productive; `keep-as-divergence` and `undecided` are first-class outcomes.

A batch with mostly `undecided` findings is also fine. Carryover is expected. Unit 4's after-batch retrospective in the parent plan tracks `undecided` counts; if the count grows unboundedly across batches, the playbook will codify a forcing rule then. v0 doesn't pre-emptively cap it.

### Cluster summary template

End every per-module audit subsection in `IMPL_AUDIT_REPORT.md` with a cluster summary. Format mirrors `IMPL_AUDIT_REPORT.md:105-109`:

```markdown
**Cluster summary:**
- Findings: N in-scope + M out-of-scope = T total.
- Dispositions: A `fix-toward-spec` (IDs — applied / blocked), B `keep-as-divergence` (IDs — rationale category 1/2/3 from §2.3), C `undecided` (IDs — note "folds to <Sn>" if applicable), D out-of-scope (IDs).
- Code change applied: `path:line` — concise summary, or "none (audit-only batch)".
- Patch-load impact: none / widening (safe) / narrowing (handled — see scan notes) / rename (handled — see scan notes).
- Systemic finding promoted: `<Sn>` with brief rationale (omit if none surfaced this batch).
```

The summary is the durable record. Future batches scan summaries first when picking the next cluster.

## 3. Known systemic divergences

Recorded once in `IMPL_AUDIT_REPORT.md` Systemic Findings section (`S1`, `S2`, `S3`). Not repeated per-module audit. The playbook adds two more that aren't in the report yet because they don't fit the per-module-vs-systemic-dimension frame; they're project-level facts that shape every audit.

- **S1 — Port-colour semantics.** Direction-based (impl) vs signal-type-based (spec). `fix-toward-spec (blocked: cross-cutting overhaul requires its own brainstorm + plan due to scope and visual-design implications)`. See `IMPL_AUDIT_REPORT.md` — Systemic Findings §S1.
- **S2 — Attenuator-type metadata.** No Type I/II/III metadata anywhere in `src/`. `fix-toward-spec (blocked: requires threading attenuator behavior through MODULE_DEFS and the cable-drag UI — substantial cross-cutting change)`. See `IMPL_AUDIT_REPORT.md` — Systemic Findings §S2.
- **S3 — Layout encoding.** No panel illustration encoding outside `customUIHeight`. `fix-toward-spec (blocked: visual-layout fidelity deferred to its own batch with its own methodology)`. See `IMPL_AUDIT_REPORT.md` — Systemic Findings §S3.
- **S4 — Non-oscillator master/slave architecture absence.** Spec extends the `Slv → Mst` port pattern to LFOA, ClkGen, RandomGen, RndStepGen, and other slave-class generators in the LFO group; impl plumbing is wired only for oscillators. `fix-toward-spec (blocked: cross-cutting architectural extension — requires its own brainstorm + plan)`. Surfaced 2026-05-06 during Unit 3 batch audit. See `IMPL_AUDIT_REPORT.md` — Systemic Findings §S4.
- **No test harness.** Verification is manual: `npm start`, drop the module on the canvas, exercise patch chains, listen / watch. Every audit batch's verification depends on this. If a future batch introduces tests, the playbook gets a verification update; until then, "manual" is the convention, not a gap.
- **System Features (Morphing, Variations) absent.** Out of the spec PDF excerpt and out of `src/`. Not a per-module finding; surfaces here so future audits don't try to record it as one.

### When to promote a per-module finding to systemic

If ≥2 per-module findings across one or more batches share the same architectural root cause — same missing pattern, same impl-vs-spec gap, same downstream blocker — propose promotion in that batch's cluster summary. Promotion looks like:

1. Add a new entry (`Sn`) to the Systemic Findings section in `IMPL_AUDIT_REPORT.md`. Keep the entry shape consistent with S1-S3: spec ref, impl ref, severity, disposition (typically `fix-toward-spec (blocked: ...)`), surfaced date.
2. Update the per-module findings that contributed to point at it via `(folds to <Sn>)` in their disposition or rationale.
3. Note the promotion in the cluster summary's `Systemic finding promoted:` line.

A single per-module finding doesn't need promotion; the cost is in restating the same rationale across N modules. Two is the threshold because at one finding the gap is local; at two it's a pattern. S4 (non-oscillator master/slave architecture absence) was promoted under this rule from C4/R1/R4 in batch 2.

### Spec layout-element substring scan

Spec entries often include "Display" as a panel element (e.g., "Rate (Knob + Display)" in §3.9). Impl uniformly lacks per-module numeric readouts — every "Display" substring becomes a finding that folds into S3 (layout encoding absence). When auditing, scan for "Display" as a recognizable pattern and fold those findings to S3 directly instead of treating each one as a fresh per-module audit dimension.

## 4. Batch sizing

- **One PR = one cluster.** A cluster is up to 5 modules with related impl↔spec mappings. Smaller is fine; larger needs splitting.
- **Effort-class qualifier.** Range / param-add / metadata fixes count as 1 module each. AudioWorklet-class fixes (new worklet, custom DSP node) count as 3. So a worklet-class fix to one module fills a cluster on its own; routine metadata fixes to a Mixer pair fill a cluster lightly.
- **Systemic findings are not "batches".** Port-colour overhaul, attenuator-type encoding, layout encoding — each gets its own brainstorm + plan because each is cross-cutting (touches every module's UI or schema) and needs its own scope conversation. Don't squeeze them into a fidelity batch.
- **Picking the next cluster.** Read recent cluster summaries in `IMPL_AUDIT_REPORT.md`. Prefer clusters with clean spec↔impl name mapping (or honest known divergence) over clusters with messy mapping. The Filter group is *not* a good early cluster for this reason — spec has 11 entries, impl has 3, no clean mapping.

## 5. Patch-load safety

`loadPatchData` (`src/BoredModularEmulator.jsx`) calls `setParam` (`src/AudioEngine.js:1603`). `setParam` does two things that matter for audit fixes:

1. **Silently no-ops on unknown param keys.** `if (!mod || !mod.params[paramName]) return;` — no error, no warning. A param rename therefore silently drops the saved value on load.
2. **Does not clamp values to current ranges.** A range narrowed in code leaves the underlying `AudioParam` set to whatever the saved JSON specified, even if that value falls outside the new min/max.

The two failure modes split symmetrically along the type of fix:

- **Range widening — safe.** Any saved value remains valid in the wider range. F2b's `level.max: 1 → 4` is the canonical example; no migration needed.
- **Range narrowing — unsafe.** Pre-existing patches with values outside the new range silently set the underlying `AudioParam` to the now-stale value. A user opens an old patch and the slider visually clamps but the audio uses the stale number, or vice versa.
- **Param rename — unsafe.** The saved value is dropped without notice; the new key gets its default. Distinct from range-narrowing in mechanism, but the user experience ("my old patch sounds different now") is the same.

### Pre-batch saved-patch scan

Before applying any range-narrowing or param-rename `fix-toward-spec`:

1. Read the maintainer's `localStorage` patch (`bored-patch-1`). Search for the affected param keys; check whether stored values fall outside the proposed new range, or whether the old key would silently drop on load.
2. Check any committed example patches in the repo (`grep -r '"<paramKey>"' .` constrained to JSON / patch files).
3. If any saved values would be affected, either: widen back, document the breakage explicitly in the cluster summary's patch-load-impact line, or implement a load-time migration shim. Don't ship the change silently.

Scope is best-effort. User-exported patch JSON files outside the repo are out of reach; the scan can't cover them. Document this honestly in the cluster summary rather than claiming patches were preserved when they weren't checked.

## 6. After-batch retrospective

Running log of executed batches. Each entry: date, cluster, finding count by disposition, effort class, and the playbook delta the batch produced. Future-self scans this section first when picking the next cluster and when deciding whether the playbook is still earning its keep.

### Batch 1 — Amplifier (2026-05-04)

- **Cluster:** `Amplifier` alone (single module, spec §6.13).
- **Findings:** 7 in-scope + 1 out-of-scope = 8 total.
- **Dispositions** (current state, post-2026-05-06 re-disposition under the corrected spec-as-source-of-truth frame): 1 `fix-toward-spec` applied (F2b — `level.max: 1 → 4`), 1 `fix-toward-spec (blocked)` (F2a — patch-load scan needed), 5 `undecided` (F1, F3, F4, F5, F7), 1 out-of-scope (F6).
- **Effort class:** 1 module × range tweak = 1 effort point.
- **Playbook delta:** Batch 1 produced the friction notes that fed playbook v0 in Unit 2; the playbook itself didn't exist during this batch.

### Batch 2 — ClkGen + RandomGen (2026-05-06)

- **Cluster:** `ClkGen` (spec §3.9) + `RandomGen` (spec §3.12).
- **Findings:** 9 in-scope + 2 out-of-scope = 11 total.
- **Dispositions:** 0 `fix-toward-spec` applied (audit-only batch), 6 `fix-toward-spec (blocked)` (C1, C3, C4, C5, R1, R4), 2 `keep-as-divergence` (R2, R3 — extensions, category 2), 1 `undecided` (C2 — folds to S3), 2 out-of-scope (C6, R5).
- **Effort class:** 2 modules × range/param-add audit-only = ~2 effort points.
- **Playbook delta:**
  - **Mid-batch framing correction** (commit `742a647`): the audit methodology had been defaulting spec divergences to `keep-as-divergence` via a backwards rule. Reversed across CLAUDE.md, parent plan, playbook §2.3, and audit report's Disposition section. Spec corpus is now explicitly the source of truth; `keep-as-divergence` requires concrete rationale fitting one of three categories (DSP approximation / spec-tolerated extension / durable design rationale).
  - **New systemic finding S4** promoted: non-oscillator master/slave architecture absence. C4 / R1 / R4 fold into it.
  - **Codifications added in Unit 4** (this revision): `fix-toward-spec (blocked: <reason>)` named-blocker shape; severity for impl-only spec-silent params; consequence-finding notation; systemic-promotion threshold (≥2 per-module findings sharing root cause); "Display" substring as S3 indicator.
  - **CLAUDE.md → playbook link** added in this revision (the playbook is now promoted; Units 1-3 deliberately left it unlinked while it proved itself).

### Batch 3 — Full-sweep audit (2026-05-12)

- **Cluster:** all 38 previously unaudited implemented modules — §1 In/Out (Keyboard, Output), §2 Oscillator (MasterOsc, OscA/B/C, SpectralOsc, FormantOsc, OscSlvA-E, OscSineBank, OscSlvFM, Noise, PercOsc, DrumSynth), §3 LFO (LFO, LFOA), §4 Envelope (Envelope, ADSREnv), §5 Filter (Filter, FilterC, FilterE), §6 Mixer (Mixer3, Mixer8, XFade, Panner), §7 Audio Modifier (Delay, ShortDelay, Chorus, Shaper), §8 Control Modifier (PortamentoA), §10 Sequencer (EventSeq, CtrlSeq, NoteSeqA, NoteSeqB).
- **Findings:** ~95 in-scope + ~20 out-of-scope ≈ 115 total. Roughly half of in-scope findings fold to S1-S6 (recorded once, not enumerated per module).
- **Dispositions:** 0 `fix-toward-spec` applied (audit-only by plan), ~50 `fix-toward-spec (blocked)` (mostly blocked on S2/S3/S4/S5/S6 or playbook §5 patch-load safety), ~25 `keep-as-divergence` (mostly category 1 DSP approximations and category 2 extensions), ~20 out-of-scope (mostly spec-silent defaults).
- **Effort class:** 38 modules × range/param-add audit-only ≈ 38 effort points — deliberately deviates from the playbook §4 "≤5 modules per cluster" rule, justified by audit-only scope (no `src/` changes), single-file diff into `IMPL_AUDIT_REPORT.md`, and explicit user direction in the plan that approved this packaging.
- **Playbook delta:**
  - **Two new systemic findings promoted:** S5 (mute affordance absent — folded ≥20 modules' missing M buttons) and S6 (KBT parameter cosmetic-only — folded 5 modules with kbt params that are stored but never read by `setParam` or the keyboard-pitch path).
  - **Coverage milestone:** every implemented module now has at least one pass of audit-recorded findings. Future fix-batches reference back to existing per-module subsections; new modules added to `src/` should be audited as part of their introductory plan.
  - **Workflow re-adoption note:** this batch explicitly re-adopted the playbook workflow that was retired after Unit 4 in 2026-05-06. The workflow is again static reference unless deliberately re-adopted for a future sweep or fix batch.

### Batch 4 — Amplifier split (2026-05-13)

- **Cluster:** `Amplifier` narrowed to spec §6.13 (fixed-gain) + new `GainControl` module per spec §6.3 (VCA with `Unipolar` toggle). 2 modules.
- **Findings:** 7 in-scope + 1 OOS = 8 total (Amplifier F1/F2a/F2b/F3/F4/F5/F6/F7 + new GainControl G1-G4).
- **Dispositions:** 6 `fix-toward-spec` applied (Amplifier F1/F2a/F3/F4/F7 in this batch; F2b had landed in Batch 1), 1 `keep-as-divergence` (GainControl G1 cat 2 extension), 1 `undecided` (Amplifier F5, folds to S3), 2 OOS, 2 fold-to-systemic.
- **Effort class:** 1 module-narrow + 1 new module + patch-load migration ≈ 4 effort points (single-PR cluster within playbook §4).
- **Playbook delta:**
  - **Conditional patch-load migration pattern** demonstrated in `loadPatchData`: pre-existing `Amplifier` patches with an inbound `GainMod` connection retype to `GainControl` (rename port to `Ctrl`, level value preserved); patches without one stay as the narrowed Amplifier with `level` clamped into `[0.25, 4.0]`. Mechanically chained onto the existing `Mixer2 → Mixer3` alias precedent.
  - **No new systemic findings.**
  - Retrospected here on 2026-05-14 alongside the Batch 5 entry below — Batch 4's PR did not include a §6 update at the time.

### Batch 5 — Range widenings (2026-05-14)

- **Cluster:** 8 modules across two thematic groups — Oscillator pitch (`MasterOsc`, `OscA`, `OscC`, `FormantOsc`, `PercOsc`) and Filter frequency (`Filter`, `FilterC`, `FilterE`).
- **Findings:** 8 in-scope + 0 OOS = 8 total (MstOsc-F2, OscA-F3, OscC-F6, FormantOsc-F3, PercOsc-F1, Filter-F7, FilterC-F2, FilterE-F10). All eight were previously `fix-toward-spec (blocked: widening — defer to fix batch)` and listed on Batch 3's quick-win recommendation.
- **Dispositions:** 8 `fix-toward-spec` applied; 0 blocked / div / undecided / OOS surfaced this batch.
- **Effort class:** 8 × range fix = 8 effort points; deliberately deviates from playbook §4 "≤5 modules per cluster", justified by every fix being a single numeric literal change with no cross-module entanglement and one diff surface in `IMPL_AUDIT_REPORT.md`.
- **Playbook delta:**
  - **No new systemic findings.** Audit gap *observed* (OscB.coarse and SpectralOsc.coarse should also widen to ±64) but explicitly *not extended into this batch* per user feedback `feedback_match_literal_scope.md`. Recorded in the Batch 5 cluster summary as a deferred audit-pass item, not folded into Batch 5's scope.
  - **`replace_all` near-miss documented** in the Batch 5 cluster summary: literal `replace_all` on `coarse: { value: 0, min: -60, max: 60, label: "Coarse" }` would have silently caught OscB (not in scope). Hand-edited with disambiguating multi-line context per target. Surfaces here as a small but reusable safety note: `replace_all` is unsafe whenever the matched pattern is *legitimately repeated* across modules that aren't all in the batch's scope. Use per-target multi-line context instead.
  - **Excluded from this batch by design:** LFOA-F1 (rate widening — sibling LFOA-F2 multiplier values need re-derivation first) and ADSREnv-F1 (lowers attack/decay/release floor 0.001 → 0.0005 s, doubles snappiness at same slider position — not a clean widening). Both deferred to brainstorms.

---

*Companion files: `IMPL_AUDIT_REPORT.md` (the canonical audit log this playbook describes), `SPEC_AUDIT_REPORT.md` (model for prose style and severity grades), `BORED_MODULAR_DESIGN.md` and `MODULE_LAYOUTS.md` (the spec corpus). Project conventions and the imperative AudioEngine vs declarative React state split are in `CLAUDE.md`.*
