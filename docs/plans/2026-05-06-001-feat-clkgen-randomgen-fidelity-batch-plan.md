---
title: "ClkGen + RandomGen fidelity batch (Unit 3)"
type: feat
status: closed
date: 2026-05-06
closed: 2026-05-06
origin: docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md
---

# ClkGen + RandomGen fidelity batch (Unit 3)

> **Plan closed 2026-05-06.** Unit 3 deliverables shipped in PR #9 (audit append + friction notes), then the parent plan rolled into Unit 4 (playbook refinement, PR #11) and was closed on 2026-05-06. Implementation Unit checkboxes below were never reconciled — see the parent plan's retrospective for the canonical record.

> Sub-plan locking the cluster pick and audit pre-flight for Unit 3 of the parent module-completeness plan. Scope is "execute one fidelity batch using `MODULE_PLAYBOOK.md` v0"; the deliverables are an audit append, any `fix-toward-spec` code changes that pass the divergence rationale rule's blocking-conditions check, and a friction-notes file capturing playbook usage observations for Unit 4.

## Overview

Run the second per-batch fidelity audit against the LFO/Clock group. The cluster pairs `ClkGen` (spec §3.9) and `RandomGen` (spec §3.12). The pairing is chosen because (a) both have clean spec↔impl name mappings, (b) `ClkGen` exercises the clock subscriber cross-cutting system — `_clockSubscribers` / `_resetSubscribers` / `_timerId` cleanup — that Unit 1's leaf-VCA cluster did not touch, and (c) `RandomGen` is small enough to stay within batch sizing while contributing a second module to test the playbook's two-module flow.

Pre-flight read of `src/AudioEngine.js:798-907` and `sourcemats/BORED_MODULAR_DESIGN.md:375-402` against `src/moduleDefs.js:196-213` shows several `fix-toward-spec (blocked)` findings — divergences whose fix is correct in principle but waits on a design call (Reset input pattern choice) or a dependency (non-oscillator master/slave architecture). RandomGen's impl-only `smoothing` and `amount` params survive the divergence rationale rule as extensions the spec doesn't preclude. The likely outcome is an audit-only batch (zero code changes applied this round), which is itself a useful exercise of the playbook's tri-state framework, divergence rationale rule, and "audit-only batch is still a batch" rule (`MODULE_PLAYBOOK.md` §2.4).

## Problem Frame

Unit 3 of the parent plan exists to validate that `MODULE_PLAYBOOK.md` v0 saves time / answers questions during a real fidelity batch. The leverage signal is *playbook usage at decision points*, not raw wall-clock delta vs Unit 1 (cluster difficulty and learning-curve effects confound time comparison — see parent plan Key Technical Decisions). Unit 3 must therefore deliberately pick a cluster that engages the playbook's mandatory sections (modify-a-module checklist, audit methodology, patch-load safety), not one that could be done playbook-blind.

## Requirements Trace

- **R6** (parent): Run a second batch using the playbook. Compare batch-2 effort to batch-1; the delta measures the playbook's leverage.
- **L1** (Unit-3-specific): Track playbook usage explicitly during the work — which sections opened, which questions answered, which gaps surfaced. Outputs feed Unit 4.
- **L2** (Unit-3-specific): Append a per-cluster section to `sourcemats/IMPL_AUDIT_REPORT.md` using the cluster summary template from `MODULE_PLAYBOOK.md:65-75`.

## Scope Boundaries

- Adding new modules from the missing ~70 (e.g., `LFOSlvA-E`, `ClkRndGen`, `RndStepGen`, `RndPulsGen`, `PatternGen`).
- Implementing the LFO-slave architecture that would let `RandomGen` become a slave-shaped module per spec §3.12. That is systemic-class work and follows playbook §3 (separate brainstorm + plan, not a batch).
- Adding spec §3.9 `Reset` input or `Slv` output to `ClkGen` — both are real spec divergences, but each carries a non-trivial design choice (subscriber-pattern vs audio-rate input for `Reset`; non-oscillator master/slave architecture for `Slv`). They surface as audit findings; disposition will be `fix-toward-spec (blocked: <reason>)` per the corrected frame. Implementation is out of scope for Unit 3.
- Visual-layout fidelity (spec panel illustrations) — covered by systemic finding S3 in `IMPL_AUDIT_REPORT.md:74-79`.

### Deferred to Separate Tasks

- **Non-oscillator master/slave architecture** (proposed systemic finding S4): separate brainstorm + plan. Surfaces here as the root cause of several findings (R1, R2, R4, C4 — see preview tables).
- **`ClkGen.Reset` input**: revisit once the subscriber-vs-audio-rate input pattern choice is taken.
- **`ClkGen.Slv` output**: blocked on non-oscillator master/slave architecture decision (S4).

## Context & Research

### Relevant code

- `src/AudioEngine.js:798-871` — `_createClkGen`. Timer-driven scheduler at 24 PPQN; `_clockSubscribers` fires on Clk4 (every 6 ticks); `_resetSubscribers` fires on Sync (every 24 ticks).
- `src/AudioEngine.js:873-907` — `_createRandomGen`. BufferSourceNode loop over 1s of `Math.random() * 2 - 1` samples → BiquadFilter lowpass smoothing → GainNode amount. Standalone; no `Mst` input.
- `src/AudioEngine.js:1565-1569` — `removeModule` clearTimeout for `ClkGen._timerId`. Already covered; no change expected.
- `src/moduleDefs.js:196-213` — `MODULE_DEFS.ClkGen` and `MODULE_DEFS.RandomGen`.
- `src/BoredModularEmulator.jsx` — `loadPatchData` and patch-load safety relevant if any param key is renamed or any range is narrowed (neither anticipated; confirm during audit).

### Spec entries

- `sourcemats/BORED_MODULAR_DESIGN.md:375-383` — §3.9 ClkGen.
- `sourcemats/BORED_MODULAR_DESIGN.md:398-402` — §3.12 RandomGen.

### Playbook sections this batch will exercise

- `MODULE_PLAYBOOK.md:7-29` — modify-a-module checklist (used as audit lens; step 6 cleanup symmetry on `_timerId` is the salient case).
- `MODULE_PLAYBOOK.md` §2 — audit methodology, severity-vs-disposition independence, divergence rationale rule, cluster summary template.
- `MODULE_PLAYBOOK.md` §3 — known systemic divergences (R1/R2/R4/C4 will fold into the proposed S4 non-oscillator master/slave architecture absence).
- `MODULE_PLAYBOOK.md:89-94` — batch sizing (two non-worklet modules = 2 effort, comfortable headroom under the 5-cap).
- `MODULE_PLAYBOOK.md:96-117` — patch-load safety (pre-flight scan only required if any rename or range narrowing is proposed; expected: not required for this batch).

### Pre-flight findings preview

This is a read-only sketch from spec-vs-impl read; the actual audit produces the canonical list. Surfaced here as scaffolding so the audit pass detects surprises (findings the preview missed) and to inform Unit 4's leverage signal (did the playbook help me organize the audit faster than ad-hoc?).

**ClkGen — anticipated findings:**

| ID | Finding | Severity | Anticipated disposition |
|---|---|---|---|
| C1 | `active` `["on", "off"]` selector vs spec "On/Off button" | Minor | `fix-toward-spec` (UI shape divergence; selector is current convention but spec calls a button — durable design rationale to keep is weak) |
| C2 | Spec "Rate (Knob + Display)" — impl has slider only, no numeric readout | Minor | `undecided` (folds to systemic S3 layout encoding) |
| C3 | Missing `Reset` input (spec §3.9) | Critical | `fix-toward-spec (blocked: subscriber-pattern vs audio-rate input — design call needed)` |
| C4 | Missing `Slv` output (spec §3.9) | Critical | `fix-toward-spec (blocked: depends on proposed systemic S4 non-oscillator master/slave architecture)` |
| C5 | Output port name divergence: impl `Clk24` / `Clk4` vs spec `24 Pulses/B` / `4 Pulses/B` | Minor | `fix-toward-spec` for labels (label-only change is patch-load-safe); `undecided` for key rename (unsafe per playbook §5) |
| C6 | Default BPM 120 (spec silent) | Out-of-scope | n/a |

**RandomGen — anticipated findings:**

| ID | Finding | Severity | Anticipated disposition |
|---|---|---|---|
| R1 | Spec is "Slave LFO" with master-relative rate; impl is standalone with absolute Hz rate | Critical | `fix-toward-spec (blocked: depends on proposed systemic S4 non-oscillator master/slave architecture)` |
| R2 | Impl `smoothing` param (BiquadFilter LP cutoff) — not in spec | Minor | `keep-as-divergence` (extension spec doesn't preclude — doesn't replace any spec feature, doesn't change spec-required behavior) |
| R3 | Impl `amount` param (output gain stage) — not in spec | Minor | `keep-as-divergence` (extension spec doesn't preclude — same rationale as R2) |
| R4 | Missing `Mst` input (consequence of R1) | Critical | `fix-toward-spec (blocked: consequence of R1; depends on S4)` |
| R5 | Default values (rate 1, smoothing 5, amount 100) — spec silent | Out-of-scope | n/a |

**Anticipated cluster summary:** ~11 findings; ~0 `fix-toward-spec` applied this batch (most fixes blocked on dependencies); ~5 `fix-toward-spec (blocked)`; ~2 `keep-as-divergence` (extensions); ~2 `undecided`; ~2 out-of-scope. Audit-only outcome is likely. If the audit-pass produces meaningfully different counts, that's a useful signal — it means the preview missed something or got a disposition wrong.

### Why audit-only is fine

Per `MODULE_PLAYBOOK.md` §2.4: "An audit batch with zero `fix-toward-spec` findings is still a batch. The audit *is* the deliverable; the per-cluster section in `IMPL_AUDIT_REPORT.md` records dispositions even when nothing changes in `src/`. Don't force a fix to make the batch feel productive." Under the spec-as-source-of-truth frame, this rule applies particularly when most fixes are `fix-toward-spec (blocked: ...)` — they're correct in principle but waiting on dependencies or design calls. Recording the blocked fixes is the value; forcing them prematurely is not.

## Key Technical Decisions

- **Cluster: `ClkGen` + `RandomGen`.** Picked over `LFO + LFOA` (LFO is impl-only, rehashes Unit 1's Mixer2 disposition discussion) and over `OscSlvA` alone (depends on OscA master correctness — scope bleed risk; smaller surface but exercises only one cross-cutting system).
- **Audit-only outcome is acceptable.** This batch may apply zero code changes. The deliverable is the audit append + the leverage observations; both are first-class.
- **`Reset` and `Slv` deferred even though findings are `Critical`.** Both touch decisions outside this cluster's scope (subscriber-vs-audio-rate input pattern, non-oscillator master/slave architecture). Disposition is `fix-toward-spec (blocked: <reason>)` — the fix is correct in principle, the blocker is concrete and named. The playbook's carryover rule (`§2.4`) accepts batches dominated by blocked or undecided findings.
- **No saved-patch scan required (anticipated).** No range narrowing or param rename is in the preview. If the audit pass surfaces one, run the scan per `MODULE_PLAYBOOK.md:109-117` before applying.
- **Friction notes commit alongside the PR.** Same shape as Unit 1 (`sourcemats/_friction_notes_unit1.md`). Filename: `sourcemats/_friction_notes_unit3.md`. Deleted in Unit 4 once codified.

## Open Questions

### Resolved during planning

- *Which cluster?* — `ClkGen` + `RandomGen`. Resolved via the discussion that produced this plan.
- *Should this sub-plan exist at all, given the parent already specifies Unit 3?* — Yes, parallel to Unit 2's sub-plan: locks the cluster pick, the pre-flight, and the leverage-tracking template.

### Deferred to implementation

- *Will the audit-pass produce findings the preview missed?* — Expected; the preview is a scaffolding sketch, not a closed set.
- *Will any finding force a saved-patch scan?* — Not anticipated, but check during audit.
- *Final wording of cluster summary patch-load-impact line.* — Likely "none (audit-only batch)" or "none (no rename, no narrowing)".

## Implementation Units

- [ ] **Unit A: Audit pass — produce the canonical findings list with dispositions**

**Goal:** Read both spec entries against impl; write the per-finding list. For each finding, assign severity and disposition. Apply the divergence rationale rule (`MODULE_PLAYBOOK.md` §2.3) to every `keep-as-divergence` candidate.

**Requirements:** R6, L1, L2.

**Dependencies:** None (parent plan's Units 1-2 complete).

**Files:**
- Read: `sourcemats/BORED_MODULAR_DESIGN.md` §3.9 and §3.12; `src/AudioEngine.js:798-907`; `src/moduleDefs.js:196-213`.
- Write (during this unit, not yet committed): a working findings list, the same shape as the preview tables in this plan but with the audit's actual outcomes.

**Approach:**
- Walk each per-module dimension from `IMPL_AUDIT_REPORT.md` "Methodology" section against each module. Skip systemic dimensions (S1-S3, plus proposed S4); they're recorded once at the report's top.
- For every finding, write: severity, disposition, and (for `keep-as-divergence`) the one-line rationale per `MODULE_PLAYBOOK.md` §2.3 (DSP-level approximation / spec-tolerated extension / durable design rationale).
- Compare findings list to the preview tables in this plan's "Pre-flight findings preview" section. Any divergence is a surprise — note it in friction notes (good signal: audit found something the preview missed; useful signal: audit's disposition flipped from preview because the preview applied an old frame).
- Do not apply any fix yet. The audit pass is read-only.

**Patterns to follow:** `IMPL_AUDIT_REPORT.md:89-109` — the Amplifier subsection is the reference shape.

**Test scenarios:** none — audit pass is documentation-shaped.

**Verification:** Working findings list exists for both modules with severity + disposition for each entry. User-visible-fix rationales recorded for any `fix-toward-spec` candidate.

---

- [ ] **Unit B: Apply fixes (if any) and verify manually**

**Goal:** Apply only `fix-toward-spec` findings that are not blocked on a dependency or design call. Verify each manually per playbook §1's verification anchors. Likely outcome: zero fixes applied this batch (most fixes are blocked); audit-only.

**Requirements:** R6.

**Dependencies:** Unit A.

**Files:**
- Modify (conditional): `src/AudioEngine.js` — `_createClkGen` (`src/AudioEngine.js:798`) or `_createRandomGen` (`src/AudioEngine.js:873`) only if a fix passes the rationale rule.
- Modify (conditional): `src/moduleDefs.js` — entries at `src/moduleDefs.js:196-213`.

**Approach:**
- For each unblocked `fix-toward-spec` finding from Unit A, confirm at the point of edit that the fix is genuinely correct toward spec and that the blocking conditions (if any) really are resolved. If a blocker re-surfaces on second look, mark the finding `fix-toward-spec (blocked: ...)` instead of applying.
- For each fix that touches a range or a param key: run the saved-patch scan per `MODULE_PLAYBOOK.md:109-117` (maintainer `localStorage.getItem('bored-patch-1')` plus `grep` for the key in committed JSON / patch files in the repo). Document scan outcome in the cluster summary's patch-load-impact line.
- Apply the fix; manually verify per playbook §1 step 3 ("drop the module on the canvas; no console errors; default param values match what spec/intent says"). For `ClkGen` specifically, verify step 6 cleanup is unaffected — drop ClkGen, patch it into a sequencer, delete it; sequencer subscriber list cleans up; `_timerId` cleared.

**Patterns to follow:** Unit 1's diff at `src/AudioEngine.js:1121` (one-line range change with rationale captured in finding F2b).

**Test scenarios:**
- **Happy path** — drop ClkGen and RandomGen on the canvas; defaults render; no console errors.
- **Edge case (conditional on fix being applied)** — set the modified param to its new min and new max; behaviour tracks.
- **Integration** — patch ClkGen → NoteSeqA → OscA → Output; clock drives the sequencer at 120 BPM; quarter notes audible. Patch RandomGen → OscA pitch mod input; smooth random pitch wobble audible. Verifies that the cross-cutting clock subscriber and audio-rate mod path still work after any change.
- **Cleanup symmetry (ClkGen)** — drop ClkGen + a NoteSeq subscriber; delete ClkGen; sequencer no longer ticks; no leaked subscribers (open the dev console; no errors on subsequent ticks).
- **Patch-load (conditional)** — only if the saved-patch scan in approach above flagged anything.

**Verification:** `npm start` clean; modified modules behave per their disposition; integration scenario above produces audible/visible tracking output.

---

- [ ] **Unit C: Append cluster section to `IMPL_AUDIT_REPORT.md` + commit friction notes**

**Goal:** Codify the audit. Capture playbook-usage observations for Unit 4.

**Requirements:** R6, L1, L2.

**Dependencies:** Unit A; Unit B (if any fix applied).

**Files:**
- Modify: `sourcemats/IMPL_AUDIT_REPORT.md` — append a new top-level group section ("3. LFO Group" or similar; mirror the existing "6. Mixer Group" header style at `sourcemats/IMPL_AUDIT_REPORT.md:87`). Update Module Count Summary's audited count.
- Create: `sourcemats/_friction_notes_unit3.md` — short bullets, not prose. Track: which playbook sections opened, which questions had clean playbook answers, which questions had to be re-derived, surprises vs the preview in this plan, rough effort estimate vs Unit 1.

**Approach:**
- For each module, write a per-module subsection mirroring `sourcemats/IMPL_AUDIT_REPORT.md:89-109` (Amplifier). Cite spec line ranges and impl line ranges. End each subsection with a cluster summary using the template at `MODULE_PLAYBOOK.md:65-75`.
- Friction notes capture the leverage signal at the granularity Unit 4 needs: not "audit took N minutes" (confounded), but "I opened §2 to check the severity-vs-disposition rule when I had to call C1 (active selector) — it answered cleanly" or "I had to re-derive the divergence rationale rule's category boundaries for R2 — playbook §2.3's category 2 (extension spec doesn't preclude) needed a clearer worked example." That granularity is what Unit 4 needs to decide what to revise.

**Patterns to follow:** `sourcemats/IMPL_AUDIT_REPORT.md:87-109` for prose style and citation density. Unit 1's friction notes are deleted but `git show e4b4169:sourcemats/_friction_notes_unit1.md` recovers them as a reference.

**Test scenarios:** none — documentation artifact.

**Verification:**
- New per-module subsections exist for both `ClkGen` and `RandomGen` with severity + disposition for every finding.
- Cluster summary line populated per the template, including the patch-load-impact note (likely "none — no rename, no narrowing").
- Module Count Summary's audited count goes from 1 to 3.
- `sourcemats/_friction_notes_unit3.md` committed alongside the PR.

## System-Wide Impact

- **Interaction graph:** Audit reads `_createClkGen` and `_createRandomGen`; any fix applied (likely none or one small range/default tweak) modifies a single method.
- **State lifecycle risks:** `ClkGen._timerId` cleanup at `src/AudioEngine.js:1565-1569` is already covered by `removeModule`. Don't change. Don't accidentally introduce new subscriber arrays without parallel cleanup.
- **API surface parity:** Cluster does not change `loadPatchData`, `setParam`, `connect`, or `disconnect` semantics. If a fix would, escalate scope back to systemic-class work per playbook §3 and defer.
- **Unchanged invariants:** Clock subscriber pattern (`_clockSubscribers`, `_resetSubscribers`, `clockTick`, `resetSeq`), virtual `Clk` / `Rst` input handling in `connect` / `disconnect`, ClkGen's 24 PPQN scheduler, RandomGen's looping-buffer DSP shape.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Audit produces zero `fix-toward-spec` outcomes; the batch feels unproductive | `MODULE_PLAYBOOK.md:59-61` explicitly accommodates audit-only batches. The friction-notes deliverable is the leverage signal Unit 4 needs; a zero-fix batch with strong leverage notes is more valuable than a forced-fix batch. |
| Pre-flight preview drives the audit (anchoring bias) instead of the spec ↔ impl read | Unit A explicitly notes "compare findings to the preview … any divergence is a surprise — note it in friction notes." Treat preview as scaffolding, not target. |
| Saved-patch scan flagged by an unanticipated rename/narrowing | Run the scan per playbook §5 before applying; document outcome in cluster summary. If the scan blocks the fix, leave the finding `undecided`. |
| `ClkGen` `Reset` or `Slv` finding gets applied as an unblocked `fix-toward-spec` despite real downstream design choices | Both findings genuinely require dependency resolution (subscriber-pattern vs audio-rate input pattern; non-oscillator master/slave architecture). Disposition is `fix-toward-spec (blocked: <reason>)` — recording the fix as correct in principle while not applying it this batch. The blocker is concrete and named, not a hand-wave. |
| RandomGen-as-standalone vs spec-as-slave gets recorded as a per-module finding instead of folded into systemic LFO-slave-architecture absence | Audit pass should reference the systemic gap once and let R1-R3 be consequences with shared rationale. Avoid restating the architecture-absence point three times. |
| Friction notes are too thin to feed Unit 4's revision decisions | If Unit C produces fewer than ~3 distinct usage observations, that's itself a signal — either the playbook is well-shaped (no friction → no revisions needed) or the audit was too easy to test the playbook (cluster choice was wrong). Capture which interpretation feels true in the friction notes themselves; Unit 4 makes the call. |

## Sources & References

- **Origin / parent plan:** `docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md` — Unit 3 specification.
- **Sibling sub-plan (template precedent):** `docs/plans/2026-05-05-001-feat-module-playbook-v0-plan.md` — Unit 2's lock-the-shape plan.
- **Playbook (the artifact under test):** `sourcemats/MODULE_PLAYBOOK.md`.
- **Audit report (where this batch appends):** `sourcemats/IMPL_AUDIT_REPORT.md`.
- **Spec entries:** `sourcemats/BORED_MODULAR_DESIGN.md:375-383` (§3.9 ClkGen), `sourcemats/BORED_MODULAR_DESIGN.md:398-402` (§3.12 RandomGen).
- **Impl entry points:** `src/AudioEngine.js:798-907` (both `_create*` methods), `src/moduleDefs.js:196-213` (both `MODULE_DEFS` entries).
- **`removeModule` cleanup:** `src/AudioEngine.js:1559-1595`.
- **Project conventions:** `CLAUDE.md`.
