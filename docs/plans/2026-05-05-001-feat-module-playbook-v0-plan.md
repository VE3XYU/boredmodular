---
title: "Module playbook v0: codify Unit 1 friction into MODULE_PLAYBOOK.md"
type: feat
status: active
date: 2026-05-05
origin: docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md
---

# Module playbook v0: codify Unit 1 friction into MODULE_PLAYBOOK.md

## Overview

Execute Unit 2 of the parent module-completeness workflow plan. Author `sourcemats/MODULE_PLAYBOOK.md` v0 by walking Unit 1's friction notes and translating each observation into a section, checklist item, or worked example. Lean target: 4–7 sections, ≤300 lines. Delete `sourcemats/_friction_notes_unit1.md` once codification is complete (git history retains it).

This sub-plan exists to lock content-shape decisions so the writing pass is mechanical: which conditional sections from the parent plan's Unit 2 list make it into v0, where each "For Unit 2 to codify" friction item lands, what the worked examples are, and which code citations the playbook anchors to.

The parent plan (see origin) remains the workflow source of truth. This sub-plan does not change Unit 2's goals or constraints — it just resolves the shape of the deliverable.

## Problem Frame

The parent plan's Unit 2 specifies three mandatory sections (modify-a-module checklist, audit methodology, known systemic divergences) and five conditional sections (when-to-use, conventions reference, batch sizing, per-batch brief format, patch-load safety). Whether each conditional section is included is meant to be friction-justified, not theory-driven. Unit 1 is now done; the friction notes are concrete; the choice is now answerable instead of speculative.

In addition, Unit 1's "For Unit 2 to codify" list adds six new items the parent plan did not anticipate. Each of these needs a home in the playbook and the choice is not arbitrary — most cluster into the audit methodology section but two (range widening/narrowing symmetry, audit-only batches as legitimate outcomes) belong elsewhere.

The risk this sub-plan addresses: if the writer dives into prose without these decisions locked, the playbook either (a) bloats past the lean target by including all conditional sections defensively, or (b) silently drops the friction-codify items into vague catch-all sentences instead of giving them named anchors a future audit can find.

## Requirements Trace

- **R1.** Author `sourcemats/MODULE_PLAYBOOK.md` with the three mandatory sections from the parent plan, populated.
- **R2.** Include only friction-justified conditional sections. Exclude conditional sections Unit 1 did not surface need for; they remain candidates for Unit 4 to add if Unit 3 surfaces them.
- **R3.** Map every "For Unit 2 to codify" item from `_friction_notes_unit1.md` to a specific named section or worked example in the playbook.
- **R4.** Document the audit methodology with: the 6+3 dimension split, severity grades reused from `SPEC_AUDIT_REPORT.md`, tri-state disposition with `undecided` default, severity-vs-disposition independence (with worked example), the user-visible-fix rationale rule (with rejection-case worked example), and the cluster summary template.
- **R5.** Stay ≤300 lines.
- **R6.** Delete `sourcemats/_friction_notes_unit1.md` after codification.
- **R7.** Honour the parent plan's "do not yet link from CLAUDE.md" constraint — the link is added in Unit 4, not Unit 2.

## Scope Boundaries

- Re-running or modifying Unit 1's audit. Unit 2 is documentation-only.
- Adding new findings to `IMPL_AUDIT_REPORT.md`.
- Editing `CLAUDE.md` (the playbook link waits for Unit 4).
- Authoring conditional sections that Unit 1 did not surface need for (specifically: when-to-use, conventions reference, per-batch brief format — see Key Technical Decisions).
- Promoting any playbook content to `docs/solutions/`. The directory does not exist yet; create when a topic outgrows the playbook, not pre-emptively.
- Changing severity grades or methodology terminology established in `SPEC_AUDIT_REPORT.md` and `IMPL_AUDIT_REPORT.md`. The playbook reuses them verbatim.

### Deferred to Separate Tasks

- **Unit 3** (second batch using the playbook): separate execution; Unit 2 is the input.
- **Unit 4** (refine playbook from second batch + link from `CLAUDE.md`): waits for Unit 3.
- **Conditional sections not in v0**: Unit 4 may add them if Unit 3 surfaces real need.

## Context & Research

### Inputs

- Parent plan: `docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md` — Unit 2 section is the spec for this work.
- Friction notes: `sourcemats/_friction_notes_unit1.md` — primary content source.
- Audit report: `sourcemats/IMPL_AUDIT_REPORT.md` — methodology already drafted there; the playbook should align rather than redefine.
- Spec audit (model for prose style + severity grades): `sourcemats/SPEC_AUDIT_REPORT.md`.
- Project conventions: `CLAUDE.md` — source of the "Adding a module requires" 5-step list that the modify-a-module checklist refactors.
- Code anchors:
  - `src/AudioEngine.js:1559-1595` — `removeModule` cleanup symmetry. Anchor for the modify-a-module checklist step "verify removeModule cleanup".
  - `src/AudioEngine.js:1603-1715` — `setParam` and its cross-param branches. Anchor for the checklist step "extend setParam if cross-param sync is needed".
  - `src/BoredModularEmulator.jsx:184` — port colour mapping. Anchor for the systemic divergence S1.

### Key facts already settled in upstream artifacts

The playbook does not need to re-derive these:

- 6+3 dimension split: per-module dimensions (Presence, Name, Parameters, Numeric ranges, Inputs/outputs, Default values) vs systemic dimensions (Attenuator types, Layout, Port-colour). Already documented in `IMPL_AUDIT_REPORT.md:18-35`.
- Severity grades (Critical / Minor / Formatting / Out-of-scope): `IMPL_AUDIT_REPORT.md:37-42` and `SPEC_AUDIT_REPORT.md`.
- Tri-state disposition (`fix-toward-spec` / `keep-as-divergence` / `undecided`, default `undecided`): `IMPL_AUDIT_REPORT.md:44-52`.
- Worked example for severity-vs-disposition independence: S1 (port-colour: Critical + `keep-as-divergence`) in `IMPL_AUDIT_REPORT.md:60-65`.
- Worked example for user-visible-fix rationale rule (acceptance case): F2b in `IMPL_AUDIT_REPORT.md:98`.

The playbook should cite these anchors rather than restate them. Restating risks drift if the audit report evolves.

## Key Technical Decisions

- **Five sections in v0, not seven.** The three mandatory sections plus two conditional sections. Decision below for each conditional. Total ≤300 lines, comfortably within the lean target.
- **Conditional section: Batch sizing — INCLUDE.** Unit 3 cannot pick its cluster without this rule, and the rule is short. Cite the parent plan's effort-class qualifier (worklet = 3 modules, range/param = 1 module) and the "1 PR = 1 cluster ≤5 modules" baseline.
- **Conditional section: Patch-load safety — INCLUDE.** Unit 1 surfaced both directions of the symmetry (F2b widened a range, F7 considered renaming a param key — both require the same scan, with opposite safety profiles). The friction notes' codify-item #5 lives here.
- **Conditional section: When to use (playbook vs CLAUDE.md vs spec PDF) — DEFER to Unit 4.** Unit 1 did not surface confusion about which doc to consult; codifying when-to-use without that friction would be theory-driven. Unit 4 can add it if Unit 3 reports the question came up.
- **Conditional section: Conventions reference (port direction, colour semantics, naming, file locations, customUIHeight) — DEFER to Unit 4.** Most of this is already in `CLAUDE.md`. Duplicating risks drift; the modify-a-module checklist links into `CLAUDE.md` for these. Unit 4 can re-evaluate if Unit 3 finds the cross-doc lookup costly.
- **Conditional section: Per-batch brief format — DEFER to Unit 4.** Unit 1 used `IMPL_AUDIT_REPORT.md` directly as both audit and brief; no separate brief artifact was needed. If Unit 3's larger / cross-cutting cluster motivates a brief, Unit 4 adds the template.
- **Audit-only batches are a legitimate outcome (friction codify-item #1) lives in the audit methodology section, not as a standalone section.** The point is methodological: a batch with zero `fix-toward-spec` findings is still a batch. Subsection title: "What counts as a batch outcome".
- **Cluster summary template (codify-item #2) lives in the audit methodology section as a sub-template under the per-module audit guidance.** Format follows `IMPL_AUDIT_REPORT.md:105-109` (the Unit 1 cluster summary): findings count, dispositions breakdown, code change summary, patch-load impact.
- **F7-style rejection-case worked example (codify-item #3).** Construct a hypothetical: "Rename `level` param key to `amplification` to match spec terminology." The user-visible-fix rationale rule rejects it: renaming silently drops saved values from any pre-existing patch (`setParam` no-ops on unknown keys at `src/AudioEngine.js:1603`), so the spec-fidelity gain is not worth the data-loss cost. This complements F2b's acceptance case in `IMPL_AUDIT_REPORT.md:98`.
- **Description text is not an audit dimension (codify-item #4) is a one-liner in the dimension list, not a section.** Add to the per-module dimensions list with a parenthetical: "(internal `MODULE_DEFS[type].description` is sidebar tooltip text, not user-facing per-spec; not a fidelity dimension)".
- **Range widening vs narrowing symmetry (codify-item #5) is the framing for the patch-load safety section.** Widening is safe (any saved value remains valid in the wider range); narrowing is unsafe (saved values outside the new range silently leave the underlying `AudioParam` set to the stale value — see parent plan's System-Wide Impact and `IMPL_AUDIT_REPORT.md:98`'s F2b rationale). Renames are a separate failure mode in the same section: silent value-drop on load.
- **6+3 split rationale in concrete terms (codify-item #6).** Short paragraph in the audit methodology section: "Recording attenuator-type or layout findings per module would produce ≥39 identical findings (one per implemented module). The systemic-dimension bucket records each once at the top of `IMPL_AUDIT_REPORT.md`. Per-module subsections cite back to the systemic finding by ID rather than restating it."
- **Modify-a-module checklist: refactor of CLAUDE.md's 5-step list, with verification anchors per step.** The five steps stay; each gets a "verify by:" line. The checklist also adds a sixth step the original list omitted: removeModule cleanup symmetry, anchored at `src/AudioEngine.js:1559-1595`. CLAUDE.md flags this as easy-to-forget but doesn't include it in the 5-step list.
- **Momentum checkpoint as a meta-instruction at the top of the playbook, not a section.** A 1–2 sentence framing block: "If maintaining this playbook starts feeling like ceremony rather than codification of real friction, that's a signal to revisit Unit 5 of the parent plan and consider whether the artifact is still earning its keep." This is a writer-facing note, not user-facing playbook content.
- **Prose style: declarative, file:line anchors, present tense.** Match `CLAUDE.md` and `SPEC_AUDIT_REPORT.md`. No second-person "you should…"; the playbook describes the workflow.

## Open Questions

### Resolved During Planning

- *Which conditional sections in v0?* — Batch sizing + patch-load safety. Three others deferred to Unit 4.
- *Where does each "For Unit 2 to codify" item land?* — See Key Technical Decisions (one-to-one mapping).
- *What is the F7-style rejection-case worked example?* — Hypothetical `level` → `amplification` rename rejected on patch-data-loss grounds.
- *Is the cluster summary a template or prose?* — Template, mirroring the format already used in `IMPL_AUDIT_REPORT.md:105-109`.
- *Does the playbook duplicate the dimension list from `IMPL_AUDIT_REPORT.md`?* — No; cite by reference. The playbook's job is the methodology *and rationale*, the audit report is the canonical list.
- *Should the modify-a-module checklist add a step CLAUDE.md doesn't have?* — Yes, the removeModule cleanup symmetry step.
- *Does the playbook link to `CLAUDE.md`?* — Yes (cites it for conventions). The reverse link from `CLAUDE.md` waits for Unit 4 per the parent plan.

### Deferred to Implementation

- *Exact section ordering within the playbook* — start with the modify-a-module checklist (most-used during work), then audit methodology, then known systemic divergences, then batch sizing, then patch-load safety. Adjust if drafting reveals a more natural flow.
- *Length of the rejection-case worked example* — start with 3–4 sentences; trim if redundant with F2b.
- *Whether the modify-a-module checklist embeds verification anchors as inline links or as a follow-up "verify by:" line per step* — pick whichever reads better when drafted.

## Implementation Units

- [ ] **Unit A: Draft `MODULE_PLAYBOOK.md` with five sections**

**Goal:** Produce the playbook v0 file with all five sections populated, ≤300 lines, every "For Unit 2 to codify" item placed.

**Requirements:** R1, R2, R3, R4, R5.

**Dependencies:** None (all inputs are committed).

**Files:**
- Create: `sourcemats/MODULE_PLAYBOOK.md`.

**Approach:**
- Open the parent plan, the friction notes, and `IMPL_AUDIT_REPORT.md` side by side.
- Start with a meta-block at the top: 1–2 sentence "what this is and when to revisit" framing including the momentum checkpoint.
- Write each section in the order locked above (checklist → audit methodology → known systemic divergences → batch sizing → patch-load safety).
- For the audit methodology section, cite `IMPL_AUDIT_REPORT.md` for the dimension list and severity grades rather than restating; use the playbook to explain *why* (the 6+3 rationale, severity-vs-disposition independence, the user-visible-fix rule, what counts as a batch outcome) and *how* (cluster summary template).
- Include both worked examples for the user-visible-fix rationale rule: F2b (acceptance, cite `IMPL_AUDIT_REPORT.md:98`) and the F7-style hypothetical rename rejection.
- Anchor the modify-a-module checklist's removeModule step at `src/AudioEngine.js:1559-1595`.
- Anchor the systemic divergences section by citing the existing entries in `IMPL_AUDIT_REPORT.md` (S1, S2, S3) rather than restating them; add the additional systemic items the parent plan flagged but the audit report doesn't yet carry: no test harness, missing System Features (Morphing, Variations).
- Anchor the patch-load safety section in `setParam`'s no-op branch at `src/AudioEngine.js:1603` for the rename-data-loss case, and reference `IMPL_AUDIT_REPORT.md:98`'s F2b rationale for the widen-is-safe case.
- Cross-check against the friction notes' "For Unit 2 to codify" list before finishing — every item must have a home.
- Track line count as drafting proceeds; if approaching 300, trim restated content (the playbook should reference, not duplicate).

**Patterns to follow:**
- Prose style of `CLAUDE.md` and `SPEC_AUDIT_REPORT.md` — concise, declarative, file:line citations.
- Severity-vs-disposition framing already established in `IMPL_AUDIT_REPORT.md:44-52`.

**Test scenarios:**
- Test expectation: none — documentation artifact. Reviewability check at the end of Unit B.

**Verification:**
- File `sourcemats/MODULE_PLAYBOOK.md` exists with five sections (modify-a-module checklist, audit methodology, known systemic divergences, batch sizing, patch-load safety).
- Each "For Unit 2 to codify" item from `_friction_notes_unit1.md` (six items) is locatable in the playbook by section + a few words; if asked "where did codify-item #N land?", the answer is unambiguous.
- Both worked examples for the user-visible-fix rule are present (F2b acceptance + F7-style hypothetical rejection).
- Cluster summary template present in the audit methodology section with the same shape as `IMPL_AUDIT_REPORT.md:105-109`.
- modify-a-module checklist includes the removeModule cleanup step the original CLAUDE.md 5-step list omits.
- Total line count ≤300.
- No reference to `CLAUDE.md` linking *back* to the playbook (that link waits for Unit 4).

---

- [ ] **Unit B: Reviewability check, then delete friction notes**

**Goal:** Confirm the playbook is usable as a standalone document, then delete the friction notes file (codification is complete; git history retains the source).

**Requirements:** R3, R6.

**Dependencies:** Unit A.

**Files:**
- Delete: `sourcemats/_friction_notes_unit1.md`.

**Approach:**
- Re-read the playbook end-to-end as if encountering it for the first time. Specifically check: would a contributor unfamiliar with the project, given the playbook + spec corpus + Unit 1's audit entry as a friction example, be able to describe how they would address that finding without re-reading Unit 1's commits? (This is the parent plan's reviewability check — it should pass.)
- If the re-read surfaces gaps, fix them in the playbook before deleting the friction notes. Do not preserve `_friction_notes_unit1.md` "just in case" — git history retains it; keeping the file invites drift.
- Once the reviewability check passes, delete `sourcemats/_friction_notes_unit1.md`.
- Commit the playbook + the deletion together (or in a tight pair) so the codification is auditable as one logical change.

**Test scenarios:**
- Test expectation: none — documentation refinement + file deletion.

**Verification:**
- Reviewability check passes (the writer's own honest read).
- `sourcemats/_friction_notes_unit1.md` no longer exists in the working tree.
- Git history shows the deletion alongside the playbook commit; `git log -- sourcemats/_friction_notes_unit1.md` still finds the prior version.

## System-Wide Impact

- **Interaction graph:** None at runtime. Unit 2 is documentation-only; no `_create<Type>`, `connect`, or `setParam` change.
- **API surface parity:** None. No code change.
- **Unchanged invariants:** All `src/` behaviour. The playbook describes existing patterns; it does not introduce new ones.
- **Documentation linkage:** The playbook references `CLAUDE.md`, `IMPL_AUDIT_REPORT.md`, `SPEC_AUDIT_REPORT.md`, and the parent plan. None of those files are edited in Unit 2 — particularly not `CLAUDE.md`, whose link to the playbook waits for Unit 4 per the parent plan.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Playbook bloats past the 300-line target by including all conditional sections defensively | Key Technical Decisions locks five sections, not seven. Three conditional sections are explicitly deferred to Unit 4. |
| Playbook restates content from `IMPL_AUDIT_REPORT.md` and drifts when the audit report evolves | The methodology section cites the audit report by file:line for the dimension list and severity grades; it does not duplicate them. Drift surface is small. |
| F7-style rejection-case worked example feels contrived because F7 is `undecided` not actively rejected | Frame the example as "if this were proposed, the rationale rule would reject it because…" — explicit hypothetical, not a claim that anyone proposed it. |
| Writing the playbook feels like ceremony rather than codification (the parent plan's momentum checkpoint trigger) | Momentum checkpoint surfaces this explicitly at the top of the playbook. If the writer hits it during Unit A, pause and revisit Unit 5 of the parent plan before forcing through. |
| Reviewability check at Unit B fails — playbook isn't standalone | Fix in the playbook before deleting the friction notes. Do not delete to "force" completion. |
| Friction notes deletion feels premature (in case Unit 4 needs more than what the playbook codified) | Git history retains the file (`git log -- sourcemats/_friction_notes_unit1.md`). Keeping the working-tree copy invites it diverging from the playbook's codification. The parent plan explicitly calls for deletion in Unit 2. |
| Section ordering feels wrong once drafted | Open Questions explicitly defers final ordering to drafting; checklist-first is a starting hypothesis, not a constraint. |

## Documentation / Operational Notes

- Deliverables are markdown in-repo. No deployment, monitoring, rollout.
- After Unit 2, the parent plan's progress note is updated: "Units 1-2 complete. Unit 3 pending."
- `CLAUDE.md` is **not** edited. The link from `CLAUDE.md` to the playbook is added in Unit 4 of the parent plan, after Unit 3 has stress-tested the playbook.
- The playbook v0 is allowed to be incomplete in the same sense `IMPL_AUDIT_REPORT.md` is — Unit 4 will refine it from Unit 3's friction. Not every future-self question needs an answer in v0.

## Sources & References

- **Origin (parent plan):** `docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md` — Unit 2 section is the spec for this work.
- **Friction notes (primary content source):** `sourcemats/_friction_notes_unit1.md`.
- **Audit report (methodology cited by reference):** `sourcemats/IMPL_AUDIT_REPORT.md`.
- **Spec audit (prose style + severity grades):** `sourcemats/SPEC_AUDIT_REPORT.md`.
- **Project conventions:** `CLAUDE.md`.
- **Code anchors:**
  - `src/AudioEngine.js:1559-1595` — `removeModule` cleanup symmetry.
  - `src/AudioEngine.js:1603-1715` — `setParam` and cross-param branches.
  - `src/BoredModularEmulator.jsx:184` — port colour mapping (cited via S1 in audit report).
