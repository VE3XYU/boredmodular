# Unit 3 friction notes — ClkGen + RandomGen batch

Captured during Unit 3 of `docs/plans/2026-05-04-001-feat-module-completeness-playbook-plan.md`. Bullet-form, not prose. Codified into `MODULE_PLAYBOOK.md` in Unit 4; this file is deleted then (git history retains).

## Major framing correction (mid-batch)

- **The biggest leverage signal of this batch was negative**: the playbook's audit methodology was applying the wrong frame (defaulting spec divergences to `keep-as-divergence` via the "user-visible-fix rationale rule"), and it took mid-batch user pushback to surface it. The fix was wide — touched CLAUDE.md, the parent plan, the playbook (§2.2 worked example, §2.3 rule reversal, §3 dispositions), and the audit report (Disposition section, S1/S2/S3, Amplifier F1/F2a/F3 dispositions).
- **Symptom that should have caught it earlier**: in the original audit pass under the wrong frame, 7 of 11 findings landed `keep-as-divergence` with rationales like "more learnable for users without prior modular-synth fluency" or "useful affordance." Under the corrected frame, only 2 survive (R2, R3 — actual extensions, category 2 of the rule). That a single small cluster could have most findings collapse from `keep-as-divergence` to `fix-toward-spec (blocked)` after a frame reversal is itself a leverage signal: the rule was structurally wrong, not just imprecisely worded.
- **Why the original frame slipped in**: CLAUDE.md's "spiritual homage … not cycle-accurate DSP" line scopes itself narrowly (DSP cycle-accuracy) but reads as broader on a quick scan. The parent plan's "Identity frame: homage, not clone" section then escalated it from DSP-level to feature/parameter/IO. The playbook codified the escalated version. None of these documents called out the narrow scoping explicitly until the corrected pass.
- **What now exists to prevent recurrence**: CLAUDE.md has an explicit clarifying paragraph; the playbook §2.3 documents the three valid `keep-as-divergence` categories (DSP approximation / spec-tolerated extension / durable design); auto-memory captures the framing as a persistent feedback rule. The playbook's divergence rationale rule will hopefully reject feature-level rationales by default in future audits.

## Cluster choice

- The plan's "deliberately exercises the playbook" criterion was right — `ClkGen` actually stresses cross-cutting systems (`_clockSubscribers`, `_resetSubscribers`, `_timerId`, virtual `Clk`/`Rst` ports on consumers) that Unit 1's leaf-VCA `Amplifier` did not. Pre-flight read confirmed the cleanup-symmetry path in `removeModule` is non-trivial and is the canonical example for playbook §1 step 6.
- Two-module batch was right-sized. `ClkGen` produced 6 findings (5 in-scope) on its own; `RandomGen` produced 5 (4 in-scope). 11 findings total feels like the upper bound of "manageable single-cluster audit"; a third module would have inflated without sharpening.
- `LFO + LFOA` would have been worse — `LFO` is impl-only and would have rehashed the Mixer2 / Amplifier-hybrid disposition discussion from Unit 1 without testing new ground.
- `OscSlvA` alone would have been smaller but exercised only one cross-cutting system (master/slave from slave side), and it depends on `OscA` master correctness — scope-bleed risk.

## Audit methodology

- The 6+3 dimension split paid off again. Without it, the LFO Group audit would have been fighting "no attenuator-type metadata" and "no layout encoding" as per-module findings on every entry. The systemic split kept the per-module audits focused on actual divergences.
- A new systemic finding (S4 — non-oscillator master/slave architecture absence) was promoted during this batch. Three per-module findings (C4, R1, R4) shared root cause; folding them to S4 prevented restating the same architectural rationale three times.
- **Playbook gap on systemic-promotion**: the playbook §3 says systemic findings are "recorded once" but doesn't say at what threshold a cross-cutting pattern gets promoted. C4+R1+R4 naturally pushed me to propose S4, but it was a judgment call. A codified rule would help — e.g., "if a finding's rationale references the same architectural gap for ≥2 modules across batches, propose promotion to systemic in the cluster summary."
- The "+ Display" pattern in spec entries (e.g., "Rate (Knob + Display)") is a recurring layout-style element that the impl uniformly lacks. It's not a per-module finding — it folds into S3. Worth a playbook note: when scanning a spec entry, the "Display" substring is a reliable indicator that a layout-fidelity gap will surface.

## Tri-state disposition

- The corrected `keep-as-divergence` rule (DSP approximation / spec-tolerated extension / durable design — see playbook §2.3) had real teeth this batch. R2/R3 (impl-only `smoothing` and `amount` params on RandomGen) survive cleanly under category 2 (extensions the spec doesn't preclude); the rationale fits in a sentence. Every other proposed `keep-as-divergence` from the original-frame pass got rejected by the rule.
- `fix-toward-spec (blocked: <reason>)` was the right shape for findings where the fix is correct in principle but waits on a dependency or design call. Six findings landed there. The blocker text is the value: "blocked: depends on S4" is a specific, named pointer; "undecided" without a blocker named would be a graveyard waiting to grow.
- **Severity grade ambiguous for impl-only params.** R2/R3 could equally be "Minor" (cosmetic-ish naming-style severity grade) or "Out-of-scope" (spec is silent on the param's existence). I went Minor because the params ARE user-visible knobs even though the spec is silent on them. Playbook §2 could use a worked example for this: when an impl-only param is user-visible but spec-silent, default severity is Minor unless the param's existence demonstrably violates spec-required behavior.
- **Consequence-finding pattern.** R4 is a "consequence of R1" — same architectural cause, same disposition, same blocker. Listing it separately costs an entry but adds clarity (the spec port is a distinct missing thing). Listing without separate disposition would obscure the per-port count. The playbook's Amplifier example (F1/F2/F3 entanglement) shows the pattern naturally; the Unit 4 retro could codify it as "consequence-of-X" notation.

## Cluster mapping reality

- ClkGen's spec-vs-impl divergences were larger than expected. Spec has Reset input + Slv output; impl has neither. The mismatch is not a name divergence (both call it ClkGen) — it's an IO divergence that surfaces only when reading both side-by-side.
- RandomGen's name matches but its module class doesn't (slave-class vs standalone). This was anticipated in pre-flight but is worth flagging as a class of finding the audit should look for: "name match doesn't imply class match."
- ClkGen output port name divergence (`Clk24` vs spec `24 Pulses/B`) is a finding the pre-flight under the old frame would have marked `undecided`. Under the corrected frame, `fix-toward-spec (blocked: schema separation needed)` is the right disposition — it's a real divergence, the fix path is concrete (split keys from labels in MODULE_DEFS), and the blocker is a small but cross-cutting schema change.

## Code change

- Zero. Audit-only batch. Every `fix-toward-spec` finding is blocked on either a design call (C3 — Reset input pattern), a dependency (C4, R1, R4 — depend on S4), or a small schema extension (C1 — button param type; C5 — port key/label separation).
- The audit IS the deliverable per playbook §2.4. Recording the blocked findings with named blockers is the value; forcing premature application would be wrong.
- Patch-load impact: none. No range narrowing or param renaming was proposed (R2/R3 are extensions, not changes; R1's class change is blocked on S4 anyway).

## What the plan got right

- **Cluster pick**: ClkGen + RandomGen exercised cross-cutting systems and produced findings that test the playbook's tri-state framework on real architectural divergence (not just trivial range tweaks).
- **Pre-flight findings preview** (in the sub-plan) was useful as scaffolding. The audit confirmed all 5 ClkGen findings the preview anticipated and added one (C2 — Rate display) the preview missed; same for RandomGen (4 anticipated, 1 added). The preview was right about most dispositions under the corrected frame.
- **Audit-only outcome accepted as first-class**: the plan and playbook both explicitly admit audit-only batches; this batch validates the rule under realistic conditions (most fixes blocked, not just zero `fix-toward-spec` candidates).

## What the plan didn't anticipate (playbook v0 gaps)

- **The playbook's own rule was backwards.** Mid-batch correction; documented above. This is the single highest-priority playbook gap surfaced in Unit 3.
- **`fix-toward-spec (blocked: <reason>)` notation was not in the playbook §2.** The Disposition definitions said `fix-toward-spec` and `undecided` as separate categories, but this batch needed a hybrid (fix is correct, but blocked on a named dependency). The audit report's updated Disposition section now describes this as `fix-toward-spec (blocked: ...)` — the playbook should mirror it. Without the explicit blocked notation, six findings would have collapsed into `undecided` and lost the "fix is correct, blocker is named" information.
- **Systemic-promotion threshold** is not codified (see Audit methodology above).
- **Severity for impl-only-spec-silent params** is not codified (see Tri-state disposition above).
- **Worked example for category 2** (extension spec doesn't preclude) was the missing piece that would have let me classify R2/R3 cleanly first try. The playbook now has this example; the friction is documenting that it was needed.
- **Spec "Knob + Display" recurrence as a S3 indicator** (see Audit methodology above).

## Time / effort feel

- Reading spec entries (§3.9 + §3.12): ~5 minutes.
- Pre-flight read of impl + drafting preview tables: ~10 minutes.
- Audit pass (writing findings list): ~15 minutes under original frame, then ~15 minutes more for the framing correction + re-disposition.
- Writing audit report append (S4 + LFO Group section + cluster summaries + Module Count Summary update): ~15 minutes.
- Writing friction notes (this file): ~10 minutes.
- Total Unit 3 work-time: ~70 minutes — but this includes the framing correction. Without that, ~55 minutes for one two-module batch. Compares to ~25 minutes for Unit 1's one-module batch.
- The framing correction was a confound on the leverage signal. The "playbook saved time" comparison vs Unit 1 is therefore not clean. Better signal: the playbook DID get exercised at decision points (rule rejection on R2/R3 disposition; cluster summary template usage; modify-a-module checklist as audit lens), but it ALSO surfaced as the source of the framing problem. Unit 4's call.

## Playbook-usage observations (the leverage signal)

- **Opened §1 (modify-a-module checklist)** to confirm step 3's virtual-port handling for `Clk`/`Rst` matches existing convention. Answered cleanly.
- **Opened §2.2 (severity vs disposition independence)** for C3 (Critical severity, would-be `undecided` under the original frame, now `fix-toward-spec (blocked)`). Answered after the framing fix; before the fix, the worked example was actively misleading because it set port-colour as a Critical+`keep-as-divergence` example.
- **Opened §2.3 (rationale rule)** for every `keep-as-divergence` candidate. Originally rejected — the rule was backwards. After the framing fix, the rule rejected most candidates (correctly, leaving R2/R3 as the only survivors).
- **Opened §2.4 (cluster summary template)** at the end of each subsection. Used verbatim. Clean.
- **Opened §3 (known systemic divergences)** to check whether C4/R1/R4 should be promoted to a systemic finding. The playbook didn't have a rule for this — ended up proposing S4 as a judgment call. (Gap codified above.)
- **Opened §5 (patch-load safety)** for C5 (port name divergence). The §5 distinction between key rename (unsafe) vs label change (safe) was the relevant frame; it answered the disposition cleanly.

## For Unit 4 to codify

1. **Reframe from "homage" to "spec is source of truth"** is now in §2.3 — the highest-priority codification. Verify the rule's worked examples (rejection F2a, acceptance R2/R3) survive future batches.
2. **`fix-toward-spec (blocked: <reason>)` as a first-class disposition shape** — should be in the Disposition definitions in both the audit report and the playbook §2.
3. **Systemic-promotion rule of thumb** — when ≥2 per-module findings share an architectural root cause, propose promotion in the cluster summary.
4. **Severity for impl-only-spec-silent params** — default Minor unless the param violates spec-required behavior.
5. **Consequence-finding notation** — "consequence of X" entries with shared disposition; lets the audit count distinct ports while preserving rationale parsimony.
6. **"Display" substring in spec as S3 indicator** — small note in §3.
7. **Worked example for category 2** of the rationale rule (extensions spec doesn't preclude) is now in §2.3 as R2/R3. Verify it stays clean after future audits.
8. **Audit time delta vs Unit 1** is confounded by the framing-fix mid-batch. Unit 5's leverage call should weight playbook-usage observations more heavily than time.
