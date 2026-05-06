# Module Playbook

> Procedural reference for module fidelity work in `src/`. Lives next to the spec corpus (`BORED_MODULAR_DESIGN.md`, `MODULE_LAYOUTS.md`, `SPEC_AUDIT_REPORT.md`, `IMPL_AUDIT_REPORT.md`) because that's where the work happens. Codified from real friction during Unit 1 of `docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md`; v0 is intentionally lean and grows from later batches.
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

### Severity vs disposition are independent

Severity describes magnitude of deviation; disposition describes intent. A `Critical` finding can be `keep-as-divergence`, and a `Minor` finding can be `fix-toward-spec`. The two axes don't constrain each other.

**Worked example.** Systemic finding S1 (port-colour semantics, `IMPL_AUDIT_REPORT.md:60-65`) is **Critical** because the divergence is cross-cutting and every module reads differently than spec. Its disposition is **`keep-as-divergence`** because direction-based colour is more learnable for users without prior modular-synth fluency, and the homage frame in `CLAUDE.md` accommodates UX-improving divergences. Severity is the magnitude; disposition is the call.

### User-visible-fix rationale rule

For any `fix-toward-spec` finding that touches user-visible behaviour (port count or direction, param names, default values, control ranges that change feel), require a one-line rationale on why the spec value is right *for the homage product* — not just default acceptance of the spec.

Default-acceptance is the failure mode this rule prevents: the audit surfaces a divergence, the impl gets "fixed" toward spec out of reflex, and the homage-vs-clone frame quietly erodes one fix at a time.

**Worked example (acceptance).** Finding F2b in `IMPL_AUDIT_REPORT.md:98` widened the `Amplifier` `level.max` from 1.0 to 4.0 to match spec §6.13's range. Rationale: signal boost is useful for amplifying low-level inputs and for envelope-modulated dynamics where the modulator briefly drives gain above unity. Range *widening* is patch-load-safe (see §5). The rationale is one line, concrete, and product-aware. Accepted.

**Worked example (rejection).** Suppose someone proposes: rename the `Amplifier` `level` param key to `amplification` to match spec terminology. The rationale rule asks: *why is the spec name right for the homage product?* The honest answer is "it isn't, by enough to justify the cost" — renaming the param key silently drops saved values from any pre-existing patch, because `setParam` no-ops on unknown keys (`src/AudioEngine.js:1603`). The spec-fidelity gain (one word in the UI) doesn't justify the data-loss cost. Rejected; finding stays `undecided` until either a label-only change is preferred or a patch-migration path exists. (See finding F7 in the audit report for the actual undecided entry.)

### What counts as a batch outcome

An audit batch with zero `fix-toward-spec` findings is still a batch. The audit *is* the deliverable; the per-cluster section in `IMPL_AUDIT_REPORT.md` records dispositions even when nothing changes in `src/`. Don't force a fix to make the batch feel productive; `keep-as-divergence` and `undecided` are first-class outcomes.

A batch with mostly `undecided` findings is also fine. Carryover is expected. Unit 4's after-batch retrospective in the parent plan tracks `undecided` counts; if the count grows unboundedly across batches, the playbook will codify a forcing rule then. v0 doesn't pre-emptively cap it.

### Cluster summary template

End every per-module audit subsection in `IMPL_AUDIT_REPORT.md` with a cluster summary. Format mirrors `IMPL_AUDIT_REPORT.md:105-109`:

```markdown
**Cluster summary:**
- Findings: N in-scope + M out-of-scope = T total.
- Dispositions: A `fix-toward-spec` (IDs — applied / deferred), B `keep-as-divergence` (IDs), C `undecided` (IDs), D out-of-scope (IDs).
- Code change applied: `path:line` — concise summary, or "none (audit-only batch)".
- Patch-load impact: none / widening (safe) / narrowing (handled — see scan notes) / rename (handled — see scan notes).
```

The summary is the durable record. Future batches scan summaries first when picking the next cluster.

## 3. Known systemic divergences

Recorded once in `IMPL_AUDIT_REPORT.md` Systemic Findings section (`S1`, `S2`, `S3`). Not repeated per-module audit. The playbook adds two more that aren't in the report yet because they don't fit the per-module-vs-systemic-dimension frame; they're project-level facts that shape every audit.

- **S1 — Port-colour semantics.** Direction-based (impl) vs signal-type-based (spec). `keep-as-divergence`. See `IMPL_AUDIT_REPORT.md:60-65`.
- **S2 — Attenuator-type metadata.** No Type I/II/III metadata anywhere in `src/`. `undecided`. See `IMPL_AUDIT_REPORT.md:67-72`.
- **S3 — Layout encoding.** No panel illustration encoding outside `customUIHeight`. `undecided`; visual-layout fidelity deferred to its own batch. See `IMPL_AUDIT_REPORT.md:74-79`.
- **No test harness.** Verification is manual: `npm start`, drop the module on the canvas, exercise patch chains, listen / watch. Every audit batch's verification depends on this. If a future batch introduces tests, the playbook gets a verification update; until then, "manual" is the convention, not a gap.
- **System Features (Morphing, Variations) absent.** Out of the spec PDF excerpt and out of `src/`. Not a per-module finding; surfaces here so future audits don't try to record it as one.

## 4. Batch sizing

- **One PR = one cluster.** A cluster is up to 5 modules with related impl↔spec mappings. Smaller is fine; larger needs splitting.
- **Effort-class qualifier.** Range / param-add / metadata fixes count as 1 module each. AudioWorklet-class fixes (new worklet, custom DSP node) count as 3. So a worklet-class fix to one module fills a cluster on its own; routine metadata fixes to a Mixer pair fill a cluster lightly.
- **Systemic findings are not "batches".** Port-colour overhaul, attenuator-type encoding, layout encoding — each gets its own brainstorm + plan because each carries identity-decision weight (see `CLAUDE.md`'s homage framing) and needs its own scope conversation. Don't squeeze them into a fidelity batch.
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

---

*Companion files: `IMPL_AUDIT_REPORT.md` (the canonical audit log this playbook describes), `SPEC_AUDIT_REPORT.md` (model for prose style and severity grades), `BORED_MODULAR_DESIGN.md` and `MODULE_LAYOUTS.md` (the spec corpus). Project conventions and the imperative AudioEngine vs declarative React state split are in `CLAUDE.md`.*
