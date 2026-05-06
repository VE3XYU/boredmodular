---
title: "Module completeness: batch-first workflow, playbook codified from real friction"
type: feat
status: active
date: 2026-05-04
deepened: 2026-05-04
---

# Module completeness: batch-first workflow, playbook codified from real friction

> **Progress (2026-05-05):** Units 1-2 complete in PRs #6 and #7. Units 3-5 pending. **A future agent picking up this plan should start at Unit 3** — do not re-execute Units 1 or 2.

## Overview

Establish a sustainable workflow for closing the 39 → 109 gap between `src/` and `sourcemats/BORED_MODULAR_DESIGN.md`, in a shape that matches the project's actual nature (sole-maintainer side project, "spiritual homage to the patch-cord modular tradition, not a clone of any specific hardware"). Five things the plan does:

1. **Batch first; playbook from real friction.** Land one small fidelity-fix batch on a clean-mapping cluster. Capture friction during the work. Then — and only then — write `sourcemats/MODULE_PLAYBOOK.md` from those notes plus what survives translation from `CLAUDE.md`. The playbook is *codified* from real work, not pre-written from theory.
2. **Audit incrementally, per batch.** No 39-module upfront sweep. Each batch begins with a scoped audit of just the cluster being fixed; findings append to `sourcemats/IMPL_AUDIT_REPORT.md`. The report is allowed to be incomplete; it grows.
3. **Each finding carries a disposition.** Findings classify as `fix-toward-spec`, `keep-as-deliberate-divergence`, or `undecided`. The audit becomes a design-decision log, not just a fix backlog. Severity (deviation magnitude) and disposition (intent) are independent — a `Critical` finding can be `keep-as-divergence`.
4. **First batch is not the Filter group.** Spec has 11 Filter modules and impl has 3 with no clean name mapping (the bare `Filter` doesn't correspond to any spec entry). Auditing it surfaces mostly coverage findings, which the plan defers anyway. Recommended starts: `Amplifier` alone, or `Mixer2` + `Mixer8`.
5. **Success is named.** Two signals: (a) batch 2 lands in noticeably less time than batch 1, validating the playbook's leverage; (b) the maintainer keeps wanting to do this. Both can fail. Unit 5 makes the call.

Same destination as the rejected first draft of this plan — a workflow that lets future module work skip the full `ce-plan` cycle — but the path inverts (do the work, then formalize) and the audit is grown from real activity.

## Problem Frame

The spec corpus is solid (`sourcemats/SPEC_AUDIT_REPORT.md` confirms `BORED_MODULAR_DESIGN.md` and `MODULE_LAYOUTS.md` were validated against the manual on 2026-05-04, all 26 findings resolved). The implementation has 39 of 109 modules; ~70 are missing. What's missing today:

- A `src/`-vs-spec audit. Gaps are known to exist (e.g., `OscA` per spec has `PWidth`, `KBT`, `Sync`, `PWidthMod`, `M` button — none are in `src/AudioEngine.js:105-135` or `src/moduleDefs.js:5-13`); none are recorded.
- A repeatable workflow for module batches that doesn't impose `ce-plan` overhead per batch.
- Formalized cross-cutting patterns (master/slave virtual ports, clock subscribers, note-source pitch tracking, `customUIHeight` contracts).

The user-stated pain is per-module overhead from planning, branching, and merging one module at a time. The actual time cost of a fidelity fix in this repo is plausibly dominated by **diagnosis** (reading PDF, comparing impl, deciding what "matches" means) and **manual verification** (no test harness), not by `ce-plan` overhead. The plan addresses both: scoped per-batch audits compress diagnosis to the cluster at hand; the playbook codifies "what verified looks like" patterns; no per-batch `ce-plan` cycle is needed once the playbook stabilizes.

## Identity frame: homage, not clone

`CLAUDE.md` positions the project as "a spiritual homage to the patch-cord modular tradition, not a clone of any specific hardware. The goal is usable sound design — accurate workflow and sonic character, not cycle-accurate DSP." The audit must respect that. Several plausibly-divergent impl choices are arguably improvements over the spec:

- **Port colours by direction** (red=output / blue=audio-in / yellow=mod-in, see `src/BoredModularEmulator.jsx:184`) vs spec by signal-type (red=audio / blue=control / yellow=logic / gray=slave). The impl convention is more learnable for users who haven't internalized modular-synth conventions; the spec convention encodes more information for users who have.
- Some impl choices reduce DSP cost or sidestep AudioWorklet dependencies entirely.

The audit's tri-state disposition makes this explicit. Default disposition for new findings is `undecided`. A finding gets fixed only after deliberate consideration. The audit is a design log, not a homework list.

## Requirements Trace

- **R1.** Land a meaningful, low-risk fidelity-fix batch on a clean-mapping cluster, with friction notes captured during the work.
- **R2.** Author `sourcemats/MODULE_PLAYBOOK.md` from those friction notes plus what survives translation from `CLAUDE.md`. Lean v0; sections grow as later batches surface need.
- **R3.** Codify (but do not yet exhaustively run) the per-batch audit methodology in the playbook. Methodology states which dimensions translate per-module and which are systemic-only.
- **R4.** Adopt incremental `sourcemats/IMPL_AUDIT_REPORT.md` — each batch appends its scoped audit. Allowed to be incomplete; grows with the work.
- **R5.** Each audit finding carries a `disposition` (fix-toward-spec / keep-as-divergence / undecided), making the audit a design log not just a backlog.
- **R6.** Run a second batch using the playbook. Compare batch-2 effort to batch-1; the delta measures the playbook's leverage.
- **R7.** Codify a batch-sizing rule with effort-class qualifier (worklet-class fixes count more than range fixes).

## Scope Boundaries

- Adding net-new modules from the missing ~70.
- Port-colour semantics overhaul (carries identity-decision weight; needs its own brainstorm).
- System Features (Morphing, Variations) — out of PDF excerpt anyway.
- Visual-layout audit against `MODULE_LAYOUTS.md` — methodology section in the playbook describes how this would work in the future; no execution.
- 39-module exhaustive audit — explicitly inverted to incremental per-batch audits.
- Test harness adoption — manual verification only.
- Changes to port-colour semantics, canvas coordinate system, master/slave wiring, clock subscriber wiring, `customUIHeight` calculations, patch-save/load JSON schema (range-narrowing requires explicit handling — see System-Wide Impact).

### Deferred to Separate Tasks

- **Coverage closure** (~70 missing modules): separate plan after a few fidelity batches stabilize the workflow.
- **Port-colour semantics overhaul**: separate brainstorm + plan.
- **Visual-layout audit**: future batch with explicit methodology run.
- **MIDI input / canvas zoom / voice allocation**: pre-existing roadmap items, unaffected.

## Context & Research

### Relevant Code and Patterns

- `src/AudioEngine.js` — every `_create<Type>(id)` returns `{ id, type, node, outputNode, outputs, inputs, params, _nodes }` plus optional system fields (`_slaveTargets`, `_masterFreq`, `_clockSubscribers`, `_pitchTargets`, `_gateTargetEnvelopes`). Cross-param syncs live in `setParam` (e.g., `src/AudioEngine.js:1680-1715`).
- `src/moduleDefs.js` — UI metadata: `MODULE_DEFS` per type, `CATEGORIES` for sidebar order. Optional `customUIHeight: N` reserves N px for in-module SVG widgets.
- `src/BoredModularEmulator.jsx:183-184` — `Port` colour mapping: `isOutput ? "#f44" : isMod ? "#fc0" : "#4cf"`. Direction-based, not signal-type-based.
- `CLAUDE.md` — onboarding context. The "Adding a module requires" 5-step list is the seed for the playbook's modify-a-module checklist.
- Cross-cutting systems (verifiable in code, summarized in `CLAUDE.md`):
  - **Master/slave** via virtual `Slv → Mst` (`null` in `inputs`), `_slaveTargets[]`, `_recalcFreq()`, `_propagateToSlaves()`.
  - **Clock subscriber** via virtual `Clk` / `Rst`, `_clockSubscribers[]`, `_resetSubscribers[]`, `clockTick()`, `resetSeq()`.
  - **Note-source pitch tracking** via `_pitchTargets[]` and `_gateTargetEnvelopes[]` on `Keyboard`, `NoteSeqA`, `NoteSeqB`.
  - **`customUIHeight`** read by both `getPortPosition` and `getModuleHeight`.

### Why CLAUDE.md extension wasn't enough

The lighter-weight alternative — extend `CLAUDE.md` rather than create a new playbook artifact — was deliberately considered. Reasons it isn't sufficient:

- `CLAUDE.md` is agent-onboarding context. It sets context at session start but isn't structured as a procedure-followed-during-work doc. The audit methodology, severity grades, batch-sizing rule, and per-batch retros stretch CLAUDE.md beyond its current job.
- The playbook's audience is future-self in a working session with the spec PDF open. Living in `sourcemats/`, alongside `BORED_MODULAR_DESIGN.md` / `MODULE_LAYOUTS.md` / `SPEC_AUDIT_REPORT.md`, is contextually right.
- The playbook reuses `SPEC_AUDIT_REPORT.md`'s severity grades. Living next to that file means severity changes ripple naturally.

If the playbook stays small (≤ 300 lines, matching Unit 2's lean target), this distinction is comfortable. If it bloats, the right response is *split* (move stable conventions into `CLAUDE.md`, keep procedural content in the playbook), not *merge*.

### Existing audit methodology, translated honestly

`SPEC_AUDIT_REPORT.md` audits spec docs against the PDF using 8 dimensions and 4 severity grades. Translating the methodology to `src/`-vs-spec, the dimensions split into two buckets:

**Per-module dimensions** (audit each module against its spec entry):

1. Presence
2. Name
3. Parameters
4. Numeric ranges
5. Inputs/outputs (port presence and direction; *not* port colour — see below)
6. Default values where impl distinguishes default from initial value

**Systemic dimensions** (record once at the top of the audit; not repeated per module):

7. **Attenuator types** — impl has no Type I/II/III metadata anywhere; every mod input trivially fails this dimension.
8. **Layout (PDF panel illustrations)** — impl has no panel illustrations; only `customUIHeight` for in-module custom UI. A future visual-layout audit batch can address this with its own methodology.
9. **Port-colour semantics** — direction-based vs signal-type-based; already known divergence (see Identity frame).

The first draft of this plan claimed "the dimensions translate cleanly." Multiple reviewers flagged that they don't. This bucket split is the playbook's first methodological decision; it prevents the audit from drowning in low-signal per-module repetition of systemic gaps.

### Institutional Learnings

- No `docs/solutions/` directory yet. The playbook itself becomes the seed for institutional learnings; later batch retros can append to it or spawn `docs/solutions/*.md` entries when a topic outgrows the playbook.

## Key Technical Decisions

- **Inverted ordering: batch first, playbook from friction, audit per batch.** First draft of this plan front-loaded playbook v0 + 39-module audit before any module fix. Reviewers (product-lens, adversarial) consistently pushed back: "playbook becomes truly usable only after it has been used" was the original plan's own thesis; inverting the order is more honest with it.
- **Playbook lives at `sourcemats/MODULE_PLAYBOOK.md`** — co-located with spec corpus. CLAUDE.md alternative weighed and rejected (see Context & Research).
- **Audit report at `sourcemats/IMPL_AUDIT_REPORT.md`** — name parallels `SPEC_AUDIT_REPORT.md`. Built incrementally; never claimed to be complete.
- **Tri-state disposition on findings** — `fix-toward-spec` / `keep-as-divergence` / `undecided`. Default `undecided`. Severity and disposition are independent.
- **Systemic vs per-module dimension split** — instead of asserting all 8 spec-vs-PDF dimensions translate, the playbook explicitly lists 6 per-module dimensions and 3 systemic dimensions.
- **Batch sizing rule with effort-class qualifier** — for per-module clusters: `1 PR = 1 cluster (≤5 modules)`, where worklet-class fixes count as 3 modules and range/param-add fixes count as 1. Systemic findings (port-colour, attenuator-type encoding, layout) are out of this workflow's batch shape — each goes to its own brainstorm + plan, not a "batch."
- **First-batch cluster: small surface, decision-rich.** Recommendation: `Amplifier` alone (single module, smallest surface), or escalate to `Amplifier` + a second small module (e.g., `Panner`, `XFade`) if the friction signal is too thin to write a playbook from. The Filter group is *not* recommended (spec has 11 entries, impl has 3, no clean name mapping). Honest about what the audit will find:
  - Impl `Amplifier`'s name maps to spec §6.13 Amplifier, but functionally the impl is closer to spec §6.3 GainControl (VCA): impl has `GainMod` mod input and range 0-1; spec §6.13 is fixed-gain (no mod input) with range 0.25x-4.0x. The audit's first concrete exercise of the tri-state framework will be deciding the disposition for this name-vs-function mismatch.
  - Impl `Mixer2` has 2 inputs; spec has §6.1 (3-input) and §6.2 (8-input). Mixer2 is impl-only — disposition almost certainly `keep-as-divergence`, recorded as such in the audit. Useful exercise; not a fidelity-fix target.
  - Impl `Mixer8` maps to spec §6.2 with known gaps (`-6dB` button, default attenuation, level LED). These are genuine fidelity findings.
- **Patch-load regression: range narrowing is unsafe.** `loadPatchData` (`src/BoredModularEmulator.jsx`) calls `setParam` (`src/AudioEngine.js:1603`) which silently tolerates unknown keys (renames are safe in the sense of "no error" — but values associated with renamed keys are silently dropped) and does not clamp values (range narrowing leaves the underlying `AudioParam` set to the now-stale saved value). The playbook's pre-batch checklist requires scanning saved-patch JSON for outside-range values before narrowing AND checking which renames will silently drop saved data. The scan covers the maintainer's localStorage and any committed example patches; user-exported patches are out of reach (best-effort only).
- **Success signals anchored to playbook usage, not raw time.** Naïve "batch 2 < batch 1 time" is confounded by learning curve and cluster difficulty. Better: during batch 2, did I open the playbook? Did it answer the question I had? Did I find myself re-deriving things the playbook should have captured? Plus the second signal: momentum — does the maintainer want batch 3? Either can fail. Unit 5 makes the call.

## Open Questions

### Resolved During Planning

- *Fidelity or coverage first?* — Fidelity, but per-cluster, not full-fidelity-then-coverage. Within a cluster, coverage of the next-most-natural addition is allowed if the audit shows the cluster's spec mapping makes it natural.
- *Playbook before or after first batch?* — After. (Reversed from first draft of this plan.)
- *Where does the playbook live?* — `sourcemats/MODULE_PLAYBOOK.md`. CLAUDE.md alternative considered and rejected.
- *Should the audit run exhaustively up front?* — No. Incremental per batch.
- *Should the Filter group be the first batch?* — No. Spec mapping is too messy. Recommend `Amplifier` or `Mixer2`+`Mixer8`.
- *Do all 8 spec audit dimensions translate to src vs spec?* — No. 6 per-module, 3 systemic.
- *Should color-semantics be fixed in this plan?* — No. Surfaced as systemic, deferred to its own brainstorm + plan.
- *Should fidelity findings be classified by intent, not just severity?* — Yes, via tri-state disposition.

### Deferred to Implementation

- *Final shape of `IMPL_AUDIT_REPORT.md` sections* — adapt as batches accumulate. Methodology fixed; structure can drift.
- *Final cluster choice for batch 1* — `Amplifier` or `Mixer2`+`Mixer8` recommended; final pick made when Unit 1 starts.
- *Whether the playbook stays as one file or splits* — start as one; split if it crosses ~300 lines (revised down from 600 — leaner v0 reaches the goal sooner).
- *Test scenarios template within the playbook* — repo has no test harness; verification is "spin up dev server, exercise patch chain" until that changes.
- *Whether to surface the homage-vs-clone tension as a docs-only section in CLAUDE.md too* — defer until the playbook stabilizes; adding to CLAUDE.md too early risks duplication that drifts.

## Implementation Units

- [x] **Unit 1: Pick first batch and execute it (no playbook yet)** — **COMPLETED 2026-05-04 in PR #6** (`feat/amplifier-fidelity-batch`). Cluster picked: `Amplifier` alone. Audit: `sourcemats/IMPL_AUDIT_REPORT.md` (Amplifier subsection + 3 systemic findings seeded). Code change: `src/AudioEngine.js:1121` `level.max: 1 → 4` (single `fix-toward-spec` finding F2b). Friction notes: `sourcemats/_friction_notes_unit1.md` (committed; deleted in Unit 2). **Next agent: do not re-execute. Start at Unit 2.**

**Goal:** Land a small, low-risk fidelity-fix batch on a cluster with clean impl↔spec name mapping. Capture friction during the work. Start `IMPL_AUDIT_REPORT.md` with just this cluster.

**Requirements:** R1, R4, R5.

**Dependencies:** None.

**Files:**
- Modify: `src/AudioEngine.js` (specific `_create<Type>` methods for the cluster), `src/moduleDefs.js` (entries for the cluster).
- Create: `sourcemats/IMPL_AUDIT_REPORT.md` with this cluster's audit only.
- Create: `sourcemats/_friction_notes_unit1.md` — committed alongside the Unit 1 PR so the notes don't evaporate between Unit 1 and Unit 2. Deleted in Unit 2 once codified into the playbook (git history retains it).

**Approach:**
- Pick the cluster (default: `Amplifier` alone). See Key Technical Decisions for the cluster-mapping reality (impl Amplifier diverges from spec §6.13 in range and mod-input presence; Mixer2 has no spec counterpart; Mixer8 has known gaps). The audit's first concrete exercise of the tri-state framework will be deciding dispositions for these.
- Open the spec entry for each module; read the impl. Write findings as a list. For each finding, set a disposition: `fix-toward-spec` / `keep-as-divergence` / `undecided`. Default `undecided`. **For any `fix-toward-spec` finding that touches user-visible behavior** (port count or direction, param names, default values, control ranges that change feel), require a one-line rationale on why the spec value is right for the homage product — not just default acceptance.
- Apply only `fix-toward-spec` findings. Verify manually (`npm start`, exercise the module on the canvas, audible/visible behavior matches expectation).
- Record the cluster's audit in `IMPL_AUDIT_REPORT.md` using the systemic-vs-per-module structure. Seed the systemic findings section with at least port-colour and attenuator-type entries, using this template:

  ```markdown
  ## Systemic Findings

  ### S1. Port-colour semantics
  - Spec: signal-type-based (red=audio / blue=control / yellow=logic / gray=slave) — `BORED_MODULAR_DESIGN.md:13-17`.
  - Impl: direction-based (red=output / blue=audio-in / yellow=mod-in) — `src/BoredModularEmulator.jsx:184`.
  - Severity: Critical (cross-cutting).
  - Disposition: `keep-as-divergence` — see Identity frame (homage, not clone). Direction-based is more learnable for users without prior modular-synth fluency.

  ### S2. Attenuator-type metadata
  - Spec: every mod input tagged Type I (linear) / II (exp) / III (bipolar) — see `BORED_MODULAR_DESIGN.md` examples.
  - Impl: no metadata at all; all mod inputs are raw `AudioParam` references (`src/AudioEngine.js`).
  - Severity: Critical.
  - Disposition: `undecided` — fix would need to thread attenuator behavior through `MODULE_DEFS` and the cable-drag UI.
  ```

- Capture friction notes throughout: anything slower than expected, anything surprising, anything that felt re-derivable. Write them into `sourcemats/_friction_notes_unit1.md` as you go — short bullets, not prose. Sparse notes are a signal: if the cluster surfaced fewer than ~3 distinct friction items, expect Unit 2's playbook v0 to be thin and Unit 3 to need a richer cluster (one touching `_slaveTargets`, `_clockSubscribers`, `_pitchTargets`, or `customUIHeight`) to test playbook leverage honestly.

**Patterns to follow:**
- Existing `_create<Type>` shape in `src/AudioEngine.js`.
- `setParam` cross-param branches at `src/AudioEngine.js:1680-1715` if the cluster needs cross-param syncs.
- Citation style from `SPEC_AUDIT_REPORT.md` for `IMPL_AUDIT_REPORT.md`.

**Test scenarios:**
- **Happy path** — drop each modified module on the canvas; no console errors; defaults match spec defaults.
- **Edge case** — for any range that changed, set the param to its new min and new max; confirm audible/visible behavior tracks.
- **Integration** — patch the modified module into a minimal signal chain (e.g., `OscA → Amplifier → Output`); confirm signal flows.
- **Patch-load regression** — before merging, manually load any pre-existing patch JSON that uses the modified modules. If a saved value falls outside a narrowed range, decide: migrate the saved value, widen the range back, or document the breakage explicitly.

**Verification:**
- `npm start` clean; modified modules behave per their finding dispositions (some findings may be `keep-as-divergence`; those don't change behavior).
- `IMPL_AUDIT_REPORT.md` exists with cluster section + systemic-findings header populated using the template above.
- `sourcemats/_friction_notes_unit1.md` committed (durable, not in PR description alone).
- `CLAUDE.md` is *not* yet linked to the playbook (the playbook doesn't exist yet); the link is added in Unit 4.

---

- [x] **Unit 2: Author `MODULE_PLAYBOOK.md` v0 from friction notes** — **COMPLETED 2026-05-05 in PR #7** (`feat/module-playbook-v0`). File: `sourcemats/MODULE_PLAYBOOK.md` (5 sections, 121 lines, well under the 300-line lean target). Sections: modify-a-module checklist (with the `removeModule` cleanup step CLAUDE.md's 5-step list omits), audit methodology (6+3 dimension split rationale + severity-vs-disposition independence + user-visible-fix rationale rule with both acceptance and rejection worked examples + cluster summary template), known systemic divergences, batch sizing, patch-load safety. Three conditional sections from this plan's Unit 2 list (when-to-use, conventions reference, per-batch brief format) deferred to Unit 4 — none surfaced friction in Unit 1. Sub-plan locking the v0 shape: `docs/plans/2026-05-05-001-feat-module-playbook-v0-plan.md`. Friction notes deleted (git history retains). **Next agent: do not re-execute. Start at Unit 3.**

**Goal:** Codify what Unit 1's friction proves is needed. Lean v0. Future batches grow it.

**Requirements:** R2, R3, R5, R7.

**Dependencies:** Unit 1.

**Files:**
- Create: `sourcemats/MODULE_PLAYBOOK.md`.
- Delete: `sourcemats/_friction_notes_unit1.md` (codified into the playbook; git history retains the source).

**Approach:**
- Walk Unit 1 friction notes. For each note, decide: belongs in playbook? If yes, which section?
- v0 sections, in two groups:

  **Mandatory** (seeded from this plan + `CLAUDE.md` regardless of Unit 1's friction):
  1. **Modify-a-module checklist** — refactor of `CLAUDE.md`'s 5-step "Adding a module requires" list with verification anchors per step. Includes the `removeModule` cleanup symmetry that `CLAUDE.md` flags as easy-to-forget.
  2. **Audit methodology** — per-module vs systemic dimension split (6 + 3 — see Context & Research), tri-state disposition rule (default `undecided`), severity grades (Critical / Minor / Formatting / Out-of-scope reused from `SPEC_AUDIT_REPORT.md`), severity-vs-disposition independence with worked example (port-colour as `Critical` + `keep-as-divergence`), and the user-visible-fix rationale rule (any `fix-toward-spec` touching user-visible behavior needs a one-line "why this isn't a homage divergence" note).
  3. **Known systemic divergences** — port-colour semantics, attenuator-type encoding absence, layout encoding absence, no test harness, missing System Features (Morphing, Variations).

  **Conditional** (include only if Unit 1's friction motivates them):
  4. **When to use** — when to reach for the playbook vs `CLAUDE.md` vs the spec PDF directly.
  5. **Conventions reference** — port direction, *current* colour semantics with explicit divergence note, naming patterns, file locations, `customUIHeight` contract.
  6. **Batch sizing** — `1 PR = 1 cluster (≤5 modules)`, effort-class qualifier (worklet = 3, range/param = 1), systemic findings → separate brainstorm + plan, not "batches."
  7. **Per-batch brief format** — minimal: cluster, findings (with dispositions), out of scope.
  8. **Patch-load safety** — saved-patch scan step before range-narrowing or param-rename fixes; covers maintainer's localStorage and committed example patches only.

- Lean target: 4-7 sections total, ≤ 300 lines. The mandatory three give Unit 3 something to use verbatim; the conditional ones are friction-justified.

**Momentum checkpoint at end of Unit 2:** If writing the playbook felt like ceremony rather than codification of real friction, pause before Unit 3 and reconsider whether the playbook artifact is worth Unit 3's investment. The per-batch audit may be the durable mechanism here; the playbook may be dead weight. This is the leverage-failed branch surfaced one step earlier than Unit 5.

**Patterns to follow:**
- Prose style of `CLAUDE.md` and `SPEC_AUDIT_REPORT.md` — concise, declarative, file:symbol citations over line ranges.

**Test scenarios:**
- Test expectation: none — documentation artifact. Reviewability check: a contributor unfamiliar with the project, given the playbook + spec corpus + a friction example from Unit 1, can describe how they would address that finding without re-reading Unit 1's commits.

**Verification:**
- File exists at `sourcemats/MODULE_PLAYBOOK.md`.
- All three mandatory sections populated.
- Conditional sections populated only where Unit 1 surfaced real need.
- Audit methodology section documents the 6+3 dimension split, tri-state disposition with `undecided` default, and the user-visible-fix rationale rule.
- Severity-vs-disposition independence is documented with the port-colour worked example.
- `_friction_notes_unit1.md` deleted; the codification is complete.
- `CLAUDE.md` is *not* yet linked to the playbook; the link waits for Unit 4 after Unit 3 has stress-tested the playbook.

---

- [ ] **Unit 3: Run a second batch using the playbook**

**Goal:** Validate that the playbook saves time. Compare batch-2 effort to batch-1.

**Requirements:** R6.

**Dependencies:** Unit 2.

**Files:**
- Modify: `src/AudioEngine.js`, `src/moduleDefs.js` for the second cluster.
- Update: `sourcemats/IMPL_AUDIT_REPORT.md` (append cluster section, with dispositions).
- Track: batch-2 friction notes, *only* the friction the playbook didn't anticipate.

**Approach:**
- Pick a second cluster that **deliberately exercises the playbook** — touching at least one cross-cutting system the Mandatory sections cover (master/slave wiring, clock subscriber, note-source pitch tracking, or `customUIHeight`). Picking another low-entanglement cluster (e.g., another isolated Level module) makes the leverage signal untrustworthy because both batches would be intrinsically easy regardless of the playbook.
  - Suggested batch-2 candidates that exercise cross-cutting systems: `LFO` + `LFOA` (modulator group, `LFOA` outputs both `Out` and `SlvOut`), `RandomGen` + `ClkGen` (touches clock subscriber pattern), one of the slave oscillators (`OscSlvA` etc., touches master/slave virtual port).
- Use the playbook's modify-a-module checklist verbatim. Use the playbook's audit methodology to scope the per-cluster audit. Use the tri-state disposition for findings.
- Track playbook usage explicitly: when did I open the playbook? What question did I have? Did the playbook answer it? Where did I find myself re-deriving things the playbook should have covered? These observations feed Unit 4's leverage assessment more reliably than raw time delta (which is confounded by cluster difficulty and learning-curve effects).

**Patterns to follow:**
- The playbook itself.
- Same manual verification scaffolding as Unit 1.

**Test scenarios:**
- **Happy path / Edge case / Integration / Patch-load regression** — same shape as Unit 1's scenarios, applied to the new cluster.

**Verification:**
- Cluster audited, fixes applied, `IMPL_AUDIT_REPORT.md` updated.
- Playbook-usage observations recorded (which sections were opened, which questions were answered, which gaps surfaced).
- Playbook-gap notes captured for Unit 4.

---

- [ ] **Unit 4: Refine playbook from second batch**

**Goal:** Update `MODULE_PLAYBOOK.md` from batch-2 friction. If batch 2 was harder than batch 1, restructure (not just append).

**Requirements:** R2.

**Dependencies:** Unit 3.

**Files:**
- Modify: `sourcemats/MODULE_PLAYBOOK.md`.

**Approach:**
- Walk Unit 3's playbook-usage observations and gap notes. For each gap, decide: add a checklist item, add to "what breaks if you forget", add an example, or restructure.
- If Unit 3 reported that the playbook's mandatory sections weren't opened during batch 2, that's a signal those sections are wrong (too generic, too verbose, or not anchored to actual decision points). Restructure rather than patch.
- Add an "After-batch retrospective" section to the playbook listing batch-1 and batch-2: date, cluster, finding count by disposition (e.g., 4 fix-toward-spec / 2 keep-as-divergence / 1 undecided), effort-class summary, key playbook delta from this revision.
- Add the link from `CLAUDE.md`'s "Module system" section to `sourcemats/MODULE_PLAYBOOK.md`. This is the first time CLAUDE.md should reference the playbook — Units 1-3 deliberately leave it unlinked so the playbook proves itself before getting promoted.

**Patterns to follow:**
- Same prose style as Unit 2.

**Test scenarios:**
- Test expectation: none — documentation refinement.

**Verification:**
- Playbook diff exists; references concrete observations from Unit 3.
- After-batch retrospective section exists, populated with batch-1 and batch-2.
- `CLAUDE.md` links to the playbook from the "Module system" section.

---

- [ ] **Unit 5: Decide success and choose next arc**

**Goal:** With two batches landed and a refined playbook, decide whether the workflow is working — and what comes next.

**Requirements:** R6.

**Dependencies:** Unit 4.

**Files:** None (decision recorded in retro notes or a follow-up plan stub).

**Approach:**
- Two success signals to evaluate honestly:
  - **Leverage** (anchored to playbook usage, not raw time): in batch 2, was the playbook open at decision points? Did its mandatory sections answer the questions that came up? How many gaps did Unit 4 have to fill? A playbook with leverage gets opened, answers questions, and shrinks the friction-notes pile across batches. A playbook without leverage stays unopened or gets opened only to find it doesn't address the actual question. Time delta is a *secondary* signal because it's confounded by cluster difficulty and learning-curve effects.
  - **Momentum** — is the maintainer willing to do batch 3 without resentment? Side-projects die from boredom and ceremony, not just from technical failure.
- Decision tree:
  - **Both pass** → open a follow-up plan. Either more fidelity batches (next cluster, possibly a richer one like the Modulator group) or pivot to coverage (start adding missing modules, with per-batch fidelity audits applied to the new ones too).
  - **Leverage failed, momentum holds** → playbook needs another revision OR the workflow is wrong. Consider: maybe per-batch audits are enough on their own; the playbook artifact is dead weight. Spawn a small revisit.
  - **Momentum failed, leverage held** → stop. Don't extract more value from a tool that's making the side-project unfun. The artifacts produced so far still have value as a static reference.
  - **Both failed** → revert / abandon. The plan got it wrong; that's fine, capture the lesson in the retro and move on.

**Test scenarios:**
- Test expectation: none — decision unit.

**Verification:**
- A decision is recorded (in retro notes or a stub plan in `docs/plans/`). The plan is then closed.

## System-Wide Impact

- **Interaction graph:** Audit reads `_create<Type>` and `MODULE_DEFS`; per-batch fixes modify a small set of methods.
- **Error propagation:** New ports from fidelity fixes must be handled in `connect()`, `disconnect()`, and `removeModule` — atomic update, codified by the playbook's checklist.
- **State lifecycle risks:** `_slaveTargets` / `_clockSubscribers` / `_pitchTargets` / `_gateTargetEnvelopes` arrays must stay synced with port additions; cleanup symmetry in `removeModule`.
- **API surface parity:** `loadPatchData` lives in `src/BoredModularEmulator.jsx` and calls `setParam` (`src/AudioEngine.js:1603`). `setParam` no-ops on unknown param names (`if (!mod || !mod.params[paramName]) return;`). Two consequences: **(1) Param renames silently drop the saved value** — no error, no warning, the saved data is lost on load. **(2) Range narrowing is unsafe** — saved values outside the new range silently set the underlying `AudioParam` to the now-stale value (no clamping). The playbook's pre-batch checklist must include a saved-patch scan covering both cases. Scope of the scan: maintainer's localStorage (`bored-patch-1`) plus any committed example patches; user-exported JSON files are out of reach (best-effort only).
- **Integration coverage:** Manual integration tests cover the modified cluster in a minimal signal chain; playbook prescribes this pattern.
- **Unchanged invariants:** Coordinate system, cable rendering order, master/slave wiring, clock subscriber wiring, `customUIHeight` calculations, patch-save/load JSON schema (renames safe, range narrowing requires explicit saved-patch handling). Port-colour semantics explicitly *not* changed by this plan.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Recommended cluster's mapping is messier than expected (impl Amplifier diverges from spec §6.13; Mixer2 has no spec counterpart) | Acknowledged in Key Technical Decisions; first audit-and-disposition exercise tests the tri-state framework on real divergence. If even Unit 1's cluster surfaces dispositionally-confusing findings, that's itself useful playbook input. |
| Playbook v0 is too lean and Unit 3's batch-2 surfaces structural friction | Unit 4 is explicitly a structural-revision step, not just additions. |
| Playbook fails to demonstrate leverage in Unit 3 | Unit 5's "leverage failed" branch allows abandoning the playbook artifact while keeping per-batch audits — partial value preserved. Leverage signal is anchored to playbook usage at decision points, not raw time delta, so cluster-difficulty noise is reduced. |
| Maintainer loses interest after Unit 1; Units 2-4 never happen | Unit 1's batch is the high-value standalone deliverable. Friction notes are committed (`_friction_notes_unit1.md`) so they survive any pause. Real fidelity work landed; `IMPL_AUDIT_REPORT.md` exists as a starting point for future-self. |
| Maintainer loses interest after Unit 2 (writing the playbook); Unit 3 never happens | Unit 2 has an explicit momentum checkpoint — if writing felt like ceremony rather than codification, pause before Unit 3 and reconsider whether the artifact is needed. Better than discovering this after the cost of Unit 3. |
| `Critical` severity findings with `keep-as-divergence` disposition feel inconsistent to readers | Playbook documents severity-vs-disposition independence with a worked example (port-colour). Severity = magnitude of deviation; disposition = intent. User-visible-fix rationale rule prevents drive-by spec adherence. |
| Patch-load regressions from range narrowing OR param renames in fidelity fixes | System-Wide Impact section makes both cases explicit; pre-batch checklist requires saved-patch scan covering both range and rename. Scope is best-effort (maintainer localStorage + committed example patches only). |
| Effort-class fixes (AudioWorklet-class) break the batch-sizing heuristic | Effort-class qualifier in the rule: worklet-class = 3 modules, range/param-add = 1 module. |
| Audit incrementality means the report is always "incomplete" | That's the design intent. The report is a design-decision log of *examined* modules, not a "done" backlog. CLAUDE.md/playbook link to it for context, not as a checklist. |
| Spec module names diverge from impl names (e.g., `Filter` impl vs spec `FilterA-F`) and the audit's per-module subsection title gets confusing | Per-module subsections carry both spec name and impl name where they differ. Module Count Summary at the end of `IMPL_AUDIT_REPORT.md` reconciles names and counts. |
| Reviewers / future-self forget the homage-vs-clone frame and fix divergent-but-good impl choices "to spec" out of habit | Identity-frame section preserved into the playbook's audit methodology. Tri-state disposition with `undecided` default forces the question instead of letting it slide. User-visible-fix rationale rule (one-line "why this isn't a homage divergence") puts a specific friction in the path of drive-by fixes. |
| Findings sit in `undecided` indefinitely; the audit becomes a graveyard of unresolved dispositions | Unit 4's after-batch retrospective surfaces the `undecided` count per disposition. Playbook can codify a per-batch rule (e.g., "no more than 3 carryover undecided per cluster") if the graveyard pattern emerges. |

## Documentation / Operational Notes

- All deliverables are markdown in-repo. No deployment, monitoring, rollout.
- After Unit 4, `CLAUDE.md` links to `MODULE_PLAYBOOK.md` from its "Module system" section.
- If retro notes accumulate enough to warrant a separate solutions doc, promote to `docs/solutions/<topic>.md` (the directory does not exist yet; create when needed).
- `IMPL_AUDIT_REPORT.md` is allowed to be incomplete forever. Don't treat its incompleteness as work-not-done.

## Alternative Approaches Considered

| Alternative | Rejected because |
|------|------------|
| **Original draft of this plan: playbook v0 → 39-module audit → first batch → refine** | Front-loaded speculative meta-work that the original plan's own logic ("playbook becomes truly usable only after it has been used") said was inverted. Multiple reviewers flagged this independently. |
| **Extend `CLAUDE.md` instead of separate playbook** | Considered seriously. CLAUDE.md is agent-onboarding context; the playbook is procedure-followed-during-work. Different audiences, different shapes. If the playbook stays small (≤ 300 lines), the boundary holds. If it bloats, the right move is *split* (move stable conventions into CLAUDE.md, keep procedures in the playbook), not *merge*. |
| **Exhaustive 39-module audit upfront** | Demoralizing shape for a sole-maintainer side project. Per-batch audit gets the same fidelity benefit per fix without the upfront pile. The audit is grown from real work, not a one-shot sweep. |
| **Filter group as first batch** | Spec has 11 Filter modules; impl has 3 with no clean name mapping (the bare `Filter` is closest to spec `FilterC` but not a clean match). Auditing it surfaces mostly *coverage* findings, undermining fidelity-first proof. Smaller clusters (Amplifier alone, possibly + a second Level module) are better starts — even though they too have mapping divergences (impl Amplifier vs spec §6.13 / §6.3, Mixer2 vs nothing). The smaller cluster makes those divergences easier to discuss one-by-one as the first tri-state-disposition exercise. |
| **Per-batch fidelity work with no playbook artifact at all** | The actual baseline the playbook needs to beat. Considered seriously after second-pass review. Unit 1 produces real value (fidelity fixes + audit start) without consulting any playbook (it doesn't exist yet). Unit 3's batch-2 effort delta vs Unit 1 conflates two changes: the playbook now exists, *and* the maintainer has done one batch. The latter is a confound. Why not adopt this baseline? Two reasons: (1) future-self at month 6 has lost batch-1 memory; the playbook is a note to that future-self, not just to the next-week-self. (2) The cost of writing a lean v0 playbook from real friction notes is small; the cost of *not* having one when the next batch comes is potentially much larger. Unit 5's "leverage failed → playbook is dead weight" branch is the explicit retreat to this baseline if the assumption fails. |
| **Coverage closure first, fidelity later** | Adding 70 modules over unaudited foundations risks compounding fidelity issues — but more importantly, per-batch-audit-during-coverage gives the same benefit incrementally. With the inverted ordering and incremental audits, the fidelity-vs-coverage tension dissolves: each batch handles its own fidelity. |
| **External CLI tool that diffs spec markdown against `MODULE_DEFS`** | Tooling investment outweighs benefit at current scale (39 modules, infrequent changes). Revisit if module count grows past ~80. |
| **Mega-batch fixing all systemic issues at once** | Each (port-colour, layout parity, attenuator-type encoding) deserves its own decision; mega-batching them eliminates the visibility this workflow is supposed to produce. Each surfaces in the playbook's "Known systemic divergences" section and waits for its own brainstorm. |
| **Alternating "one new module + one fidelity fix to taste"** | Considered as the most-fun ordering. Rejected for this plan because the user has *already* expressed a preference for batched module work and reduced overhead — alternating is the opposite of batching. But a future arc can adopt this rhythm once the playbook stabilizes; the workflow doesn't preclude it. |

## Sources & References

- Spec corpus: `sourcemats/BORED_MODULAR_DESIGN.md`, `sourcemats/MODULE_LAYOUTS.md`
- PDF source: `sourcemats/Bored Modular English User Manual - module reference only.pdf`
- Spec-vs-PDF audit (model for methodology): `sourcemats/SPEC_AUDIT_REPORT.md`
- Implementation entry points: `src/AudioEngine.js`, `src/moduleDefs.js`, `src/BoredModularEmulator.jsx`
- Project conventions: `CLAUDE.md`
- Recent commit context: `6a55de3` (rename to bored), `2815bd5` (spec audit fixes), `a4c7026` (audit merge)
