# Unit 1 friction notes — Amplifier batch

Captured during Unit 1 of `docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md`. Bullet-form, not prose. Codified into `MODULE_PLAYBOOK.md` in Unit 2; this file is deleted then (git history retains).

## Cluster choice

- The plan's "small surface, decision-rich" framing was correct — Amplifier alone produced 7 in-scope findings, plenty to exercise the tri-state framework on. A larger cluster would have inflated the audit without sharpening the methodology test.
- Worried at the start that "Amplifier alone" would yield zero findings (it's one Gain node). It didn't — the name-vs-function divergence cascaded into multiple per-dimension findings.

## Audit methodology

- The 6+3 dimension split (per-module vs systemic) paid off immediately. Without it, the Attenuator-types and Layout dimensions would have produced trivially-failing per-module findings on Amplifier (no attenuator metadata, no layout encoding) — which would be true of every other module too. Recording these once at the top is cleaner.
- Port-colour systemic finding could be cited from the audit's Systemic Findings section without re-explaining per module. Good shape.
- "Default values" dimension went out-of-scope because spec §6.13 doesn't state a default. The `Out-of-scope` severity grade handled this naturally.

## Tri-state disposition

- The most useful part of the methodology this round. The single most-loaded decision was F1 (name vs function) — without `keep-as-divergence` as an option, the audit would have implied a fix that would be wrong (renaming the impl module type would break every saved patch and every test).
- Default `undecided` did its job for F4/F5/F7 — surfaced findings without forcing a decision. These three may sit `undecided` for batches; that's fine.
- The user-visible-fix rationale rule (one-line "why this isn't a homage divergence") was exercised once, on F2b (extending range from 0-1 to 0-4). The rationale ("signal boost is useful for amplifying low-level inputs and envelope-modulated dynamics; range widening is patch-load-safe") felt right-sized — not a thesis, not an empty checkbox.

## Cluster mapping reality

- The plan's Key Technical Decisions section was honest about Amplifier's name-vs-function divergence, which prevented surprise during the audit. The audit confirmed exactly what the plan flagged: spec §6.13 Amplifier (fixed-gain) vs impl Amplifier (VCA, closer to spec §6.3 GainControl).
- Useful as a worked example for the playbook's audit methodology section: shows that the tri-state framework handles hybrid impl modules that don't map 1:1 to any spec module.

## Code change

- The single fix-toward-spec was a 1-character change (`max: 1` → `max: 4` in `src/AudioEngine.js:1121`). Verifying it required only reading the change and confirming Web Audio's `GainNode.gain` accepts values >1 (it does, no clipping at the node level — clipping would happen downstream).
- No `setParam` cross-param branch needed. `_createAmplifier` is a single-node module; the change is purely declarative metadata for the slider UI.
- Patch-load impact: range *widening* is safe. Worth surfacing in the playbook alongside the range *narrowing* warning that's already documented — they're symmetric concerns with opposite safety profiles.

## What the plan got right

- Recommended cluster (Amplifier) was small enough to not be daunting and decision-rich enough to exercise the methodology.
- Friction-notes-as-committed-file (this file) means I'm not worried about losing observations between Unit 1 and Unit 2 — I can just write them as I think them.
- "Apply only `fix-toward-spec` findings" prevented scope creep into F4 (Unipolar button), F5 (Amplification display), F7 (param rename). Each is a real follow-up, but none were necessary for Unit 1.
- The IMPL_AUDIT_REPORT.md being structurally similar to SPEC_AUDIT_REPORT.md meant the writing went fast — I had a template to work against.

## What the plan didn't anticipate (playbook v0 gaps)

- **No fixes might be applied at all.** If F2b had also been `keep-as-divergence`, this batch would have produced an audit + friction notes but zero code change. The plan's R1 ("Land a meaningful, low-risk fidelity-fix batch") implies a fix; it doesn't say what to do if the cluster surfaces no fix-toward-spec findings. The playbook should explicitly cover the "audit-only batch" case (it's a legitimate Unit 1 outcome — the audit IS the deliverable).
- **The user-visible-fix rationale rule was uneventful here, but its real test is when a fix is *aesthetically tempting* but homage-wrong.** F2b's rationale was easy. A harder case would have been F7 (rename `level` → `amplification`) — the spec name is "more correct" but the rename silently drops saved data. The playbook needs a worked example where the rationale rule rejects a fix that initially seemed obvious.
- **`Out-of-scope` severity was applied to F6 (default value).** This is consistent with `SPEC_AUDIT_REPORT.md`'s usage but worth calling out in the playbook: when spec is silent, the impl behaviour can't be a "finding" per se. The dimension is still recorded; the disposition just doesn't apply.
- **The audit methodology dimension list (6 per-module) didn't include "Description text" as a dimension.** Impl `MODULE_DEFS[type].description` is internal documentation, not a per-module audit dimension. Confirmed during the audit when I considered whether the description "Voltage controlled amplifier" (vs the module name "Amplifier") was a finding. It isn't — descriptions aren't user-facing per-spec; they're sidebar tooltips. Worth noting in the playbook so future audits don't get sidetracked on internal doc strings.
- **Cluster summary stats (1 fix / 3 keep / 3 undecided / 1 out-of-scope)** were useful at the end of the per-module audit. Worth codifying as a required summary at the bottom of every audited cluster. The playbook should specify this.

## Time / effort feel

- Reading spec entries + impl: ~5 minutes.
- Writing the audit report: ~15 minutes (most of that was the Systemic Findings section, which is a one-time cost; future batches mostly add per-module subsections).
- Writing this friction-notes file: ~5 minutes.
- Total Unit 1 work-time: ~25 minutes for one module. Subsequent batches should be much faster on the per-module work since the systemic-findings section and the audit-report scaffolding already exist.
- Rough first-batch effort baseline for Unit 5's leverage signal: most of the work was scaffolding (writing the report from scratch), not auditing-and-fixing. Batch 2 won't have that scaffolding cost. Time delta is therefore expected to favour batch 2 even without playbook leverage — so Unit 5's leverage signal must be anchored to playbook usage at decision points (per the plan), not raw time.

## For Unit 2 to codify

1. Audit-only batches are a legitimate outcome — playbook should say so.
2. Cluster summary template (counts by disposition) at the end of each per-module audit subsection.
3. Worked example for user-visible-fix rationale rule should include a case where the rule *rejects* an aesthetically-tempting fix (F7-style).
4. Description text is not an audit dimension — internal documentation isn't part of fidelity.
5. Range widening vs range narrowing — symmetric concerns with opposite safety profiles. Both deserve explicit playbook coverage.
6. The 6+3 split rationale in concrete terms: "Attenuator types apply to every mod input across all 39 modules — recording per-module would produce 100+ identical findings. Recording once captures the same information."
