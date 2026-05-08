---
title: "UI redesign — match Nord Modular density and layout"
type: feat
status: draft
date: 2026-05-07
---

# UI redesign — match Nord Modular density and layout

> The current canvas renders modules as sparse vertical tiles with linear sliders and sans-serif labels. The Nord Modular Editor (visual reference for this project per `feedback_pdf_is_source_of_truth.md`) renders modules as dense horizontal strips with circular knobs, blue-LCD numeric displays, inline ports, and a pixelated bitmap typeface. This plan captures the gap, the pieces that need to change, and a phased path so we can ship the redesign incrementally rather than as one giant rewrite.

## Overview

The trigger for this plan is a screenshot of the Nord Modular Editor showing a Korg Poly61 patch in `Yot Modular, Slot A`. Modules visible in the reference: DCO 1, DCO 2, OCTAVE (×2), WAVEFORM (×2), PW/PWM, SAWTOOTH (×2), PULSE, INTERVAL (×3), VCF, VCA, EG, MG, DELAY, FREQUENCY, ARPEGGIATOR, SPEED, ON/OFF. The screenshot is the canonical visual reference; treat it as ground truth.

The existing `sourcemats/MODULE_LAYOUTS.md` already describes per-module layout in prose ("Horizontal Bar Layout", control ordering). What's missing is a system-level visual specification — typography, spacing, control geometry, and module framing — that makes those per-module descriptions implementable. This plan supplies that, then sequences the implementation.

## Problem Frame

### Where the impl currently is

- `BoredModularEmulator.jsx` `ModuleNode` renders each module as a vertical SVG group: title bar at top, params stacked vertically as `SvgSlider` rows, ports in a horizontal strip at the bottom.
- `SvgSlider` is a linear track with a draggable thumb. Range-tier rounding (see `feedback_slider_resolution.md`).
- Numeric value rendered as plain text right-aligned next to the slider.
- Font: `'DM Mono', monospace` at 9–10 px.
- Ports are color-coded by direction (impl) rather than signal type (spec) — known systemic finding S1.
- Module width fixed (`MODULE_WIDTH` constant); height grows with param count plus optional `customUIHeight`.
- DrumSynth (just rebuilt to spec) has 16 params and is now a tall vertical column on the canvas — concretely surfaces the density problem.

### Where the impl needs to go

From the screenshot:

- **Modules are wide, not tall.** Each module is a horizontal strip. Header label is at the *left edge* of the strip, not on top. Controls flow left-to-right within the strip.
- **Modules tile vertically with little or no gap.** The canvas reads as a stack of horizontal bars, not a scatter of tiles.
- **Knobs are circular**, rendered as small 3D-shaded rotaries with a position indicator. Tiny — maybe 18–22 px diameter.
- **Numeric displays are blue boxes** with bitmap-style numerals (LCD-like). Often paired with a knob, sometimes standalone (e.g., the `329.6Hz` pitch displays).
- **Ports are inline** with their control labels, not in a separate row. Output ports often at the right edge of a module strip; mod inputs grouped with the parameter they modulate.
- **Mute (M) buttons** appear on most modules — small square button with an internal LED.
- **Sub-sections within a module** (e.g., `OCTAVE` rows inside the DCO frame, separate `WAVEFORM` strip, separate `PW/PWM` strip) — module composition supports nested labeled regions.
- **Typography is bitmap / low-resolution** — small geometric font that reads as 90s GUI rather than modern web type.
- **Control density** roughly 4–8× what we render today: the screenshot fits ~20+ modules in a viewport that today would hold maybe 4–5 of ours.

### Why doing this sooner matters

Per the user: "we need to tackle this sooner than later." Concrete reasons:

- DrumSynth's new 16-param shape is unusable on the current vertical layout — drives this from "nice-to-have polish" to "blocking new module work."
- Per-module spec audits keep growing the param count; the layout system has to accommodate dense modules before we keep adding to them.
- Cable routing/aesthetics depend on port positions, which depend on the layout system. Cable cleanup work is downstream of this.

## Reference Anchors

Two ground-truth sources:

1. **Screenshot** (provided 2026-05-07): Nord Modular Editor showing `KorgPoly61Preset`. Suggested capture path if we want a checked-in copy: `sourcemats/screenshots/nord-editor-korg-poly61.png` (does not exist yet — capture pending).
2. **`sourcemats/MODULE_LAYOUTS.md`** — per-module control arrangement in prose. Already complete for many modules.

Per `feedback_slider_resolution.md` and `feedback_pdf_is_source_of_truth.md`: where the screenshot/PDF doesn't specify a dimension (exact pixel sizes, exact font, etc.), we approximate based on "matches the Nord aesthetic" — but knob/slider *behavior* (taper, resolution) still needs Nord ground truth before we change it; this plan is about visual layout, not control-feel mechanics.

## Dimensions to Change (audit-style)

| Dimension | Current | Target | Notes |
|---|---|---|---|
| Module orientation | Vertical tile, ~180 px wide × variable height | Horizontal strip, full-canvas-width × ~40–60 px tall | Possibly some modules stay 2-row for dense ones |
| Header position | Top bar | Left edge, vertical or running label | Like "DCO 1", "VCF" in screenshot |
| Primary control | `SvgSlider` (linear) | `SvgKnob` (circular rotary) | New component; same value/min/max/onChange API |
| Numeric display | Plain text right of slider | Blue-LCD box, bitmap font, sometimes standalone | New `LcdDisplay` component |
| Font | `DM Mono` 9–10 px | Bitmap font, ~8 px | Candidate fonts: Px437/IBM VGA8, Pixel Operator, Perfect DOS VGA. Need @font-face load |
| Port layout | Bottom row | Inline with associated control / right edge | Per `MODULE_LAYOUTS.md` patterns |
| Port color | Direction-based (S1) | Signal-type-based per spec | S1 is its own systemic — fold into this redesign? |
| Module spacing | Auto-position with padding | Snap-to-grid vertical stacking | "Holes are too big" observation |
| Mute (M) button | Absent | Present per module | Resolves the deferred mute-systemic question |
| Sub-section frames | Absent (flat module body) | Nested labeled regions (DCO contains OCTAVE rows, etc.) | Affects module def schema |

## Implementation Phases (proposed, not committed)

Each phase is a candidate branch. Phases are roughly independent but earlier ones unblock later ones.

### Phase 1 — `feat/ui-knob-component`

Build `SvgKnob` with the same API surface as `SvgSlider` (`{x, y, width, min, max, value, onChange, color}`). Drop-in replace at the call site. No layout change. Lets us iterate on the rotary control in isolation.

**Risk:** drag interaction needs to feel right (vertical mouse drag → angular delta is the standard pattern). Also need shift-drag fine mode like SvgSlider has.

### Phase 2 — `feat/ui-bitmap-font`

Add a bitmap font via `@font-face` (download to `public/fonts/`, declare in `App.css`). Apply globally to module text. Visual change only; no layout shift.

**Risk:** font choice is taste-driven and the user may have opinions. Stage a candidate, link a screenshot of it applied, get sign-off before committing.

### Phase 3 — `feat/ui-horizontal-module-layout`

Rewrite `ModuleNode` to render horizontally. Compute width from param count rather than height. Header on left edge. This is the largest single change — touches port-position math (`getPortPosition`), module-height math (`getModuleHeight`), and the cable-attachment logic indirectly.

**Risk:** highest. Cable rendering depends on port positions; re-layout shifts every port. Plan to keep the math centralized and verify with a test patch (load `examples/sync-sweep.json` after change).

### Phase 4 — `feat/ui-lcd-display`

Add `LcdDisplay` component (blue background, bitmap font, numeric or short-text content). Replace the inline param text. Possibly add standalone displays where spec calls for them (e.g., "Hz or Note name" under MasterOsc per §2.1).

### Phase 5 — `feat/ui-port-inline`

Move ports out of the bottom strip into inline positions next to associated controls. Requires a per-module concept of "this port belongs to this control" — extends `MODULE_DEFS` schema.

### Phase 6 — `feat/ui-mute-button`

Add `M` button per module. Resolves the deferred mute-systemic question (the design call that previously needed its own brainstorm now folds in here naturally — the mute toggle is one element of the new module strip).

### Phase 7 — `feat/ui-port-colors-by-signal-type`

Resolve systemic finding S1 — switch port colors from direction-based to signal-type-based per spec. Visual-only at the rendering layer; engine connection logic unchanged.

### Phase 8 — `feat/ui-module-subsections`

Support nested labeled regions within a module (DCO containing OCTAVE rows, etc.). Extends `MODULE_DEFS` schema with optional sub-section grouping. Touches DCO-equivalent modules (OscA, OscB) plus DrumSynth (which has natural sub-sections: Oscillator / Noise Filter / Bend).

## Scope Boundaries

- **Not redesigning the sidebar** — module list / drag-from-sidebar UX stays as-is unless an obvious win surfaces during phase work.
- **Not redesigning the patch save/load UI** — Save/Load/Export/Import buttons stay where they are.
- **Not implementing slider taper / resolution changes** — gated on Nord-research per `feedback_slider_resolution.md`. Knob component's mouse-drag-to-value mapping should be a stand-in for whatever taper the user lands on.
- **Not redesigning the GATE button or scope display.**
- **Not redesigning the canvas pan/zoom behavior.**
- **Not adding MIDI input** (separate concern; remains in known-issues).

## Open Design Questions

Before Phase 3 (the big layout shift) we need calls on these. Phase 1 (knob) and Phase 2 (font) can land first without these answered.

1. **Module width policy.** Fixed-width strips (uniform across modules) or variable-width per param count? Screenshot suggests variable.
2. **How to render variable-port-count modules** (OscSineBank with 7 inputs + 6 mod inputs, NoteSeqA with custom UI height) under horizontal layout. Wrap to a second row?
3. **Sub-section frame styling.** Do we draw an outline around grouped controls (like the screenshot's DCO frame), or rely on label + spacing only?
4. **Sidebar drop zone.** When the user drags a module in, where does it land? Currently random-near-origin; may want grid-aligned in the new layout.
5. **Cable attachment under the new layout.** Output ports on right edge, input ports on left edge of the receiving module — this is the natural pattern and matches the screenshot. Confirm before we commit cable-routing changes.
6. **Bitmap font choice.** Px437 IBM VGA8, Pixel Operator, Perfect DOS VGA, or something else? User preference call.
7. **Mute button position.** Per-module header, or inline near Level? Screenshot has it at the right edge of each row.

## Pre-flight before Phase 1

- Capture the reference screenshot to `sourcemats/screenshots/nord-editor-korg-poly61.png` so it's checked in alongside the rest of the spec corpus.
- Decide on fixed-width vs variable-width modules (Q1 above) — affects knob component sizing.
- Pick a bitmap font and stage it (Q6) — the knob's value display will use it, so a reasonable default avoids re-touching every component.

## Decisions Log

- **2026-05-07 — Bitmap font:** Pixel Operator. Phase 2 will self-host the font under `public/fonts/` and declare `@font-face` in `App.css`.
- **2026-05-07 — Module width:** uniform / fixed-width across all modules. Variable-height per module is still allowed (sub-section frames in Phase 8 may want a 2-row module). Updates Q1.
- **2026-05-07 — Screenshot:** capture deferred — user is remote and can't add the file in this session. Plan continues using the in-document description as reference; checked-in screenshot remains a TODO before final visual sign-off.
- **2026-05-08 — Workspace width:** the canvas should fit roughly **4 modules wide**. This sets the per-module width as a fraction of viewport rather than an absolute pixel constant. Settles the sizing question Phase 3 has to answer.
- **2026-05-08 — Phase 1 (knob) shipped.** `SvgKnob` replaced `SvgSlider` at the single `ModuleNode` call site. Drop-in API; no layout shift. PR #21.

## Reference observations (2026-05-08)

User shared three Nord Modular Editor reference screenshots in chat — used as the visual ground truth for the redesign. The screenshots are not yet checked in (still pending the `sourcemats/screenshots/` capture from earlier deferred item). Key observations from reviewing them:

- **Header is inline at top-left** of each module body — not a separate title bar above the body. Saves vertical space.
- **Module body is pale gray** (~`#b8b8b8`-ish), not the dark theme the current impl uses. The current dark canvas + per-category-colored headers diverges from this. **Open question:** do we shift to a light-gray module body for visual fidelity, or stay dark and treat color as the homage divergence? Folds into Phase 3 visual polish.
- **Modules tile flush vertically** within a column (no gap). Multiple columns sit side by side; cables sag freely between columns.
- **LCD blue boxes** are the canonical numeric display:
  - Hz/note name (e.g., `329.6Hz`) — pairs with a knob.
  - Envelope segment times (e.g., `32m 122m 48.5 260m` for ADSR or `132m 103m` for AD) — multi-value LCD.
  - Signed integers in CV ranges (e.g., `-64`, `+15`, `+64`).
  - Multipliers (e.g., `x0.96`).
  - Sequencer steps and other counters.
  Phase 4 should support both single-value and multi-segment LCDs.
- **Waveform selection is icon-row toggles** (sine / triangle / saw / square glyphs as a row of mutually-exclusive buttons), not a `<select>` dropdown. Phase 4 or Phase 5 should add this control type — extends `MODULE_DEFS` param schema.
- **M (mute) button** is small, consistent, present on virtually every module. Phase 6 lands cleanly with this as the visual reference.
- **Port symbology**: yellow circles = gate/trigger (digital), red = audio out, blue = audio/CV in. Some ports show small flag/arrow glyphs indicating signal type. Resolves S1's spec-by-signal-type direction.
- **Slave-osc indicator**: vertical "Slv" tab on the left edge of slave oscillators (visible on `OscSlvE1`, `OscSlvFM1`, `Synced Osc`). Suggests a per-module decoration system for marking master/slave relationship.
- **Module label includes instance number** (`MasterOsc1`, `OscSlvE1`, `ADSR-Env1`, `2 outputs1`). Current impl shows only the type name. Possible Phase 5+ refinement: append a per-type counter so duplicates are distinguishable.

## Status / Next Action

Plan in `draft`. Phase 1 (knob) and Phase 2 (font) shipped. Screenshot reference observations recorded above (see "Reference observations (2026-05-08)").

Next phase candidate: **Phase 4 (LCD display)** — visual-only, complements the rotary knob aesthetic, and the screenshots show LCDs are the canonical numeric readout across nearly every module. Alternative: jump to **Phase 3 (horizontal layout)** now that the workspace-width decision (4 modules wide) is locked; Phase 3 carries higher risk (cables, hit math) but unblocks the bigger density win.
