---
title: "UI module sub-section frames — Phase 8"
type: feat
status: closed
date: 2026-05-26
closed: 2026-05-28
origin: docs/plans/2026-05-07-001-feat-ui-redesign-plan.md
---

# UI module sub-section frames — Phase 8

> **Plan closed 2026-05-28.** Unit 1 (schema + renderer + DrumSynth labels) shipped in PR #71 (2026-05-26); Unit 2 (OscA/B/C + MasterOsc labels) shipped in PR #73 (2026-05-28). Both visually verified via the committed test patches (`examples/drumsynth-subsections-test.json`, `examples/osc-subsections-test.json`). Phase 8 in the parent UI-redesign plan is now fully complete.

> Sub-plan executing Phase 8 of the parent UI-redesign plan: nested labelled regions within a module (the Nord screenshot's "DCO contains OCTAVE rows" pattern). Extends `MODULE_DEFS.paramRows` with an optional `label`; renderer draws a recessed-well rectangle plus a section header above the strip. Scoped to `paramRows`-bearing modules where the spec gives section names; rolls out as two PRs.

## Overview

`paramRows` (parent plan Phase 3b, shipped PRs #47/49/51/53/56/57) already groups params into horizontal knob strips with a shared LCD. What's missing relative to the Nord visual is the labelled "well" framing — `MODULE_LAYOUTS.md` §General UI Patterns calls this out explicitly: *"Body: Gray/Silver background with recessed 'wells' for groups of controls."* That single sentence resolves the parent plan's open Q3 in favour of framed sections rather than label-and-spacing alone.

This phase is therefore narrow:

1. One additive schema field: `paramRows[i].label?: string`.
2. One renderer change: when `label` is present, draw an inset rect behind the strip and a small uppercase header above the LCD.
3. Module fan-out limited to paramRows-bearing modules whose spec layout names sections (DrumSynth first; OscA/B/C and MasterOsc as follow-up).

No engine changes. No new module types. No port-layout changes. Existing patches load unchanged because the schema is additive and absent `label` falls through to the current renderer.

## Problem Frame

The parent plan's Phase 8 entry is one line; this sub-plan exists to lock the schema, the visual treatment, and the module-by-module rollout before any code lands. The reason for a sub-plan rather than just opening a PR: the schema decision and visual style decision are reused by the follow-up fan-out PR. Capturing them once in a plan prevents drift between the two PRs and gives the parent plan something concrete to link to in its "Phases shipped" log.

## Requirements Trace

- **Parent Phase 8** (parent plan line 114): "Support nested labeled regions within a module (DCO containing OCTAVE rows, etc.). Extends `MODULE_DEFS` schema with optional sub-section grouping. Touches DCO-equivalent modules (OscA, OscB) plus DrumSynth."
- **Parent Q3** (parent plan line 133): "Sub-section frame styling. Do we draw an outline around grouped controls (like the screenshot's DCO frame), or rely on label + spacing only?" → resolved here as *framed* per `MODULE_LAYOUTS.md:7`.
- **`MODULE_LAYOUTS.md` §2.16 DrumSynth**: explicitly names Osc / Noise Filter / Bend sub-sections.
- **`MODULE_LAYOUTS.md` §2.2–2.4 OscA/B/C, §2.1 MasterOsc**: described as "Multi-Row Panel" with Top/Middle/Bottom rows; section *names* aren't always given but the row groupings are.

## Scope Boundaries

In scope:

- New optional field `label` on each `paramRows` entry.
- New renderer branch in `BoredModularEmulator.jsx` for labelled rows: inset rect + header `<text>`.
- New height constant for labelled rows (current `PARAM_STRIP_H = 56` stays for unlabelled).
- DrumSynth labels in this PR; OscA/B/C + MasterOsc labels in the follow-up PR.

Out of scope:

- Modules that don't already use `paramRows` (Keyboard, EventSeq, CtrlSeq, NoteSeqA/B, sequencer custom UI, etc.). They use `customUIHeight` for their custom widgets; no spec-named sub-sections apply.
- DrumSynth's "Preset Display + Preset ↑↓" footer from `MODULE_LAYOUTS.md` §2.16 — a separate spec gap (no preset system today); doesn't belong in a framing pass.
- OscSineBank — its 6 paramRows are per-partial, positional, not named sub-sections.
- Any engine, port, cable, or audio change.
- Changing the unlabelled-row visual. Rows without `label` must render byte-identical to today (verified visually).

### Deferred to Separate Tasks

- DrumSynth preset footer — captured as a future audit note; not in this phase.
- Per-port attenuator-knob visual integration into sub-section frames (S2 already shipped; revisit only if frames overlap badly with the existing attenuator placement).

## Context & Research

### Relevant code

- `src/BoredModularEmulator.jsx:22-44` — `buildParamLayout`. Walks params, slots paramRows knobs together, returns `{ items, totalH }` where each row item carries `{ kind: "row", row, y }`.
- `src/BoredModularEmulator.jsx:20` — `PARAM_STRIP_H = 56` constant currently shared by every row.
- `src/BoredModularEmulator.jsx:663-721` — row render branch in `ModuleNode`: draws `LcdDisplay` at the top of the strip, then knobs below at fixed slots, then a per-knob label `<text>` at `py + 50`.
- `src/BoredModularEmulator.jsx:441-...` — `LcdDisplay` component (fill, stroke, text rendering). The well rect for sub-sections uses similar styling tokens but a different fill colour.
- `src/moduleDefs.js:62-67` — DrumSynth's existing `paramRows` (4 rows, no labels yet) — already groups by spec section.
- `src/moduleDefs.js:13-44, 86` — OscA/OscB/OscC/MasterOsc `paramRows`.

### Relevant spec sections

- `sourcemats/MODULE_LAYOUTS.md:7` — recessed-wells visual cue.
- `sourcemats/MODULE_LAYOUTS.md:160-171` — DrumSynth "Complex Multi-Section Panel" with explicit Osc / Noise Filter / Bend / Mix groupings.
- `sourcemats/MODULE_LAYOUTS.md:73-94` — OscA/B/C and MasterOsc multi-row panels.

### Existing patterns the work follows

- Additive schema field on `MODULE_DEFS` entries — same shape as the existing `customUIHeight`, `paramRows`, `inputs`, `modInputs`, etc. additions.
- Render-time read from `MODULE_DEFS` in `buildParamLayout` and `ModuleNode` — same pattern Phase 3b established.
- Backwards compatibility through omission — absent field means "render as before", same pattern as Phase 6 (`mute` defaults to false) and Phase 7 (no port override means infer signal type).

## Design

### Schema

```js
// src/moduleDefs.js
DrumSynth: {
  // ...existing fields
  paramRows: [
    { label: "MASTER", knobs: ["masterPitch", "masterDecay", "masterLevel"] },
    { label: "SLAVE",  knobs: ["slaveRatio", "slaveDecay", "slaveLevel"] },
    { label: "FILTER", knobs: ["filterFreq", "filterRes", "filterSweep", "filterDecay"] },
    { label: "BEND",   knobs: ["bendAmt", "bendDecay"] },
  ],
},
```

`label` is `string | undefined`. No other field on the row. No grouping of multiple rows under one label (would force a nested-array schema; not needed for any spec module).

### Visual

- **Inset rect:** behind the row, spanning `x = 4` to `x = MODULE_WIDTH - 4`. Height covers the full labelled-row strip. Fill `#a8a8a8` (slightly darker than the `#b8b8b8` module body so it reads as a recess), stroke `#888` 1 px, rx/ry 2 px.
- **Header:** above the LCD. Uppercase, Pixel Operator 8 px, fill `#444`, anchored 8 px from the inset rect's left edge, y baseline ~10 px below the rect's top edge.
- **LCD + knobs + per-knob labels:** unchanged from today's row renderer — just nudged down by the header band height.
- **Unlabelled rows:** unchanged. The rect/header only render when `label` is truthy.

### Height impact

- Add `PARAM_STRIP_LABELED_H = 68` (vs `PARAM_STRIP_H = 56`). The +12 px is the header band.
- `buildParamLayout` picks per-row: `y += row.label ? PARAM_STRIP_LABELED_H : PARAM_STRIP_H`.
- `getModuleHeight` and `getPortPosition` both already read `buildParamLayout(...).totalH`, so cable anchor math and port row positioning fall through unchanged.

### DrumSynth labels (this PR)

Mapped directly from `MODULE_LAYOUTS.md` §2.16:

| Row | Knobs | Label |
|---|---|---|
| 1 | masterPitch, masterDecay, masterLevel | `MASTER` |
| 2 | slaveRatio, slaveDecay, slaveLevel | `SLAVE` |
| 3 | filterFreq, filterRes, filterSweep, filterDecay | `FILTER` |
| 4 | bendAmt, bendDecay | `BEND` |

`filterMode` dropdown still falls through as a single between Slave and Filter rows. `click`, `noiseLevel`, `level` fall through after Bend. Same fall-through pattern as today; no schema fight.

### Fan-out PR labels (follow-up, captured here for the fan-out PR to reuse)

`MODULE_LAYOUTS.md` doesn't always give explicit section names for the Top/Middle/Bottom rows on Osc panels, so labels follow the *control type* groupings the spec implies:

| Module | Row | Knobs | Label |
|---|---|---|---|
| MasterOsc | 1 | frequency, coarse, fine | `PITCH` |
| OscA | 1 | frequency, coarse, fine | `PITCH` |
| OscA | 2 | pulseWidth, pwModDepth | `PW` |
| OscA | 3 | fmDepth, level | `FM / LVL` |
| OscB | 1 | frequency, coarse, fine | `PITCH` |
| OscB | 2 | fmDepth, level | `FM / LVL` |
| OscC | 1 | frequency, coarse, fine | `PITCH` |
| OscC | 2 | fmDepth, level | `FM / LVL` |

These are tentative — the fan-out PR's commit description should treat them as the working set, with the option to drop or rename if the rendered result looks wrong against the spec screenshot.

## Implementation Plan

### Unit 1 — DrumSynth (this PR — `feat/ui-module-subsections-drumsynth`)

1. Add `PARAM_STRIP_LABELED_H` constant in `BoredModularEmulator.jsx`.
2. Update `buildParamLayout` to use per-row height based on `row.label` presence.
3. Add labelled-row render branch in the row map: inset `<rect>` + header `<text>` above the existing LCD/knobs JSX.
4. Add `label` to each of DrumSynth's 4 `paramRows` entries in `moduleDefs.js`.
5. Add `examples/drumsynth-subsections-test.json` — a patch with DrumSynth + ADSR (gate trigger) + Output, knobs at non-default values to visually confirm the labelled strips render and the LCD/knobs still update.
6. Manual visual verification: load test patch in browser with master muted (per `feedback_no_unattended_audio.md`); check (a) DrumSynth shows 4 labelled rows, (b) cable anchors still meet ports, (c) other modules render unchanged. Capture before/after if useful.

### Unit 2 — Fan-out (follow-up PR — `feat/ui-module-subsections-fanout`)

1. Add `label` to MasterOsc, OscA, OscB, OscC `paramRows` per the table above.
2. Visual verification — same patches users had pre-fan-out should still look right; section headers should match the Nord screenshot's rough layout.

## Validation

- **Code:** unchanged paramRows-bearing modules (Filter, FilterC, FilterE, Envelope, ADSREnv, OscSineBank, Mixer8, Delay/ShortDelay/Chorus/Shaper) render byte-identical (no `label`, fall-through path unchanged).
- **Existing patches:** all checked-in `examples/*.json` patches load and render without errors. DrumSynth's height grows by `4 × 12 = 48 px`; cable anchors track the new height via existing `getModuleHeight` plumbing.
- **No engine touch:** `git diff src/AudioEngine.js` is empty.

## Open Questions

- **Header position vs LCD:** above the LCD (chosen) vs left of it inside the same band (would shrink LCD horizontal space). Pick: above. Reason: keeps LCD width consistent with unlabelled rows, easier to scan.
- **Inset rect fill:** `#a8a8a8` (chosen) vs an `inset` SVG filter for true 3D recess. Pick: flat darker fill. Reason: matches the project's flat-pixelated aesthetic and avoids SVG filter perf overhead.

## Status / Next Action

Plan `closed` 2026-05-28.

- **Unit 1 shipped in PR #71 (2026-05-26):** optional `paramRows[i].label` field, recessed-well renderer, DrumSynth's 4 rows labelled MASTER / SLAVE / FILTER / BEND. Unlabelled rows in every other module render byte-identical.
- **Unit 2 shipped in PR #73 (2026-05-28):** MasterOsc (`PITCH`), OscA (`PITCH` / `PW` / `FM`), OscB (`PITCH` / `FM`), OscC (`PITCH` / `FM`). The fmDepth/level rows shipped as `FM` rather than the sub-plan's tentative `FM / LVL` — cleaner header in Pixel Operator at 9 px, and the spec doesn't name these rows.

Parent UI-redesign plan's Phase 8 entry updated to mark both units shipped.
