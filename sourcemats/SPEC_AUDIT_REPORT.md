# Spec Audit Report

A discrepancy report comparing the project's spec documents against the canonical source PDF.

**Status: 2026-05-04 — All 26 findings (6 critical, 20 minor) resolved.** `NORD_MODULAR_DESIGN.md` and `MODULE_LAYOUTS.md` have been updated to match the PDF where they diverged. The 5 out-of-scope items are unchanged (they describe material outside this PDF excerpt and could not be verified). The Resolution lines below are kept as a record of what was changed.

## Sources

- **Canonical:** `sourcemats/Nord Modular English User Manual - module reference only.pdf` — 97 PDF pages, original manual pages 93-189 (Chapter 7 "Module reference"). PDF page numbers in this report are PDF-page numbers (1-97), not original-manual page numbers.
- **Spec doc 1:** `sourcemats/NORD_MODULAR_DESIGN.md` — technical specification.
- **Spec doc 2:** `sourcemats/MODULE_LAYOUTS.md` — visual layout descriptions.

## Scope

- All 109 modules across 10 groups, plus the spec's `General Conventions` and `System Features` sections.
- Spec-vs-PDF only. Code in `src/` is not part of this audit.
- This pass produces a report. No edits to the spec docs are part of this pass.

## Methodology

Each module is checked across eight dimensions:

1. **Presence** — module exists in spec docs and PDF, or is consistently absent.
2. **Name** — exact match including casing, hyphens, abbreviations.
3. **Parameters** — every knob/button/selector captured.
4. **Numeric ranges** — Hz, semitone, ms, dB, unit ranges accurate.
5. **Default values** — preset values captured where stated.
6. **Inputs/outputs** — port presence, colour (Red audio / Blue control / Yellow logic / Gray slave), direction.
7. **Attenuator types** — Type I (linear) / II (exponential) / III (bipolar) correct.
8. **Layout** (`MODULE_LAYOUTS.md`) — row arrangement and control grouping match the panel illustration.

## Severity

- **Critical** — factual error that would cause incorrect implementation (wrong attenuator type, wrong range, wrong port colour, missing module/control).
- **Minor** — wording difference without behavioural impact (paraphrased descriptions, casing, abbreviated labels).
- **Formatting** — markdown structure or ordering with no meaning change.
- **Out-of-scope** — spec content that cannot be verified from this PDF excerpt (refers to other chapters of the original manual).

## PDF page boundary map

| Group | PDF pages | Status |
|-------|-----------|--------|
| Chapter intro | 1 | Confirmed |
| 1. In/Out | 1-7 | Confirmed |
| 2. Oscillator | 7-25 | Confirmed |
| 3. LFO | 26-37 | Confirmed |
| 4. Envelope | 38-46 | Confirmed |
| 5. Filter | 46-54 | Confirmed |
| 6. Mixer | 55-61 | Confirmed |
| 7. Audio Modifier | 62-75 | Confirmed |
| 8. Control Modifier | 76-82 | Confirmed |
| 9. Logic | 83-87 | Confirmed |
| 10. Sequencer | 88-93 | Confirmed |

Page ranges are filled in as each group is audited.

## Notes on PDF cross-references

The PDF's text contains references like "see page 33" or "see page 70" which point to chapters of the original manual that are not included in this excerpt. These references are not discrepancies — they are intentional pointers to material outside the audit scope.

---

# Section 0: General conventions and system features

Spec location: `NORD_MODULAR_DESIGN.md` lines 5-39.

## 0.1 Signal Types (`NORD_MODULAR_DESIGN.md:7-11`)

Definitions of Bipolar, Unipolar, Logic, and Slave signal types.

- **Out-of-scope** — The PDF excerpt references signal-type definitions on original-manual page 33 (e.g., "See 'Pitch modulation' on page 34") but does not contain the definitions themselves. The spec's wording cannot be verified from this excerpt.
- **Minor** (`NORD_MODULAR_DESIGN.md:8` — "Audio/Control (Bipolar)") — combines the PDF's separately-named "Audio" and "Control (Bipolar)" categories into a single label. Inline PDF usage shows the manual treats `Bipolar` as a single signal-type label applied to both audio outputs and bipolar control outputs, so combining them in the spec is reasonable, but the spec's compound name is not the manual's. Resolution: rename to `Bipolar` (drop the `Audio/Control` prefix) to match the PDF's inline usage of `Signal: Bipolar.`

## 0.2 Connector Colors (`NORD_MODULAR_DESIGN.md:13-17`)

Red = audio, Blue = control, Yellow = logic, Gray = slave.

- **Out-of-scope** for the definitions section, but **verifiable inline**: every panel illustration in the PDF uses these colour assignments. Spot check across pages 1, 2, 7, 8, 9, 10, 11, 12, 13 confirms:
  - Note (Bipolar pitch) ports — Blue. ✓
  - Gate (Logic) ports — Yellow. ✓
  - Audio Out / FMA / Sync / AM ports on oscillators — Red. ✓
  - Slv ports (master ↔ slave) — Gray (rendered as small grey-bordered circles). ✓
- No discrepancies in the colour-to-signal mapping.

## 0.3 Modulation Input Attenuator Types (`NORD_MODULAR_DESIGN.md:19-22`)

Type I (linear), Type II (exponential), Type III (bipolar).

- **Out-of-scope** — Definitions appear on original-manual pages 34-35 (cross-referenced in the PDF as "See 'Pitch modulation' on page 34" and "See 'Frequency modulation (FM)' on page 35"). Not in this excerpt.
- **Verifiable inline**: every modulation-input description in the PDF tags its attenuator type, e.g. `Pitch modulation inputs [Attenuator Type II]`, `Pulse Width modulation input [Attenuator Type I]`, `Freq Mod [Attenuator Type III]` (filter sections). The spec's per-module Type assignments are checked group-by-group below.

## 0.4 Module Limits (`NORD_MODULAR_DESIGN.md:24-27`)

- **Verified** — `NORD_MODULAR_DESIGN.md:25` ("Max 254 modules per patch (127 poly, 127 common)") matches PDF p.1: "you could use up to 254 modules in each patch, 127 in the Poly Voice Area and 127 in the Common Voice Area."
- **Verified** — `NORD_MODULAR_DESIGN.md:26` ("Keyboard, KeyboardPatch, MIDIGlobal, AudioIn: max one per voice area") matches PDF p.1: "These modules can only be used twice in a patch, one in the Poly Voice Area and one in the Common Voice Area." (Spec wording is equivalent — one per voice area, two voice areas → two per patch.)
- **Verified** — `NORD_MODULAR_DESIGN.md:27` ("PolyAreaIn: one per patch, common voice area only") matches PDF p.1: "The 'Poly Area In' module can only be used once in a patch, in the Common Voice Area."
- **Minor** (`NORD_MODULAR_DESIGN.md:26` — name `KeyboardPatch`) — PDF uses the two-word form `Keyboard Patch` (e.g. p.2 "KeyboardPatch" panel header but body text "Keyboard Patch module"). Spec contracts to one word, matching the panel header. Acceptable.

## 0.5 Morphing (`NORD_MODULAR_DESIGN.md:31-35`)

- **Out-of-scope** — The Morphing system is not described in this PDF excerpt (this is a "Module reference only" excerpt; the morphing system is documented in earlier chapters of the original manual). Spec content cannot be verified from this PDF.

## 0.6 Variations (`NORD_MODULAR_DESIGN.md:37-39`)

- **Out-of-scope** — Variations are not described in this PDF excerpt. Spec content cannot be verified from this PDF.

## 0.7 General UI Patterns (`MODULE_LAYOUTS.md:5-18`)

- **Verifiable inline** by inspection of panel illustrations throughout the PDF.
  - "Header contains Module Name and Instance Number (e.g., OscA1)" — matches every panel (e.g. `Keyboard1`, `MasterOsc1`, `OscA1`, `KeyboardPat..1`). ✓
  - "Knobs: small circular knobs, often with a green triangle indicating the default/reset position" — green triangles appear above Fine knobs, KBT knobs, etc. on PDF panels (visible on OscA, OscB, OscC, MasterOsc panels, p.7, 8, 9). ✓
  - "Displays: Blue-background text boxes" — visible on every Hz/Note display in the PDF panels. ✓
  - "Attenuator placement: knob directly to the right of (or below) its associated modulation input" — confirmed across oscillator/filter panels. ✓
- No discrepancies found.

---

# Section 1: In/Out group

PDF pages: 1-7. Module count: PDF 10 modules / spec 10 modules. ✓

## 1.1 Keyboard

Spec: `NORD_MODULAR_DESIGN.md:45-50`, `MODULE_LAYOUTS.md:24-27`.
PDF: pp.1-2.

- **Verified** — Note (Blue, Bipolar, E4=0, C-1=-64, G9=+63, includes pitch bend), Gate (Yellow, Logic, respects sustain), Vel (Blue, Unipolar, linear), Rel Vel (Blue, Unipolar) all match.
- **Verified** — layout: horizontal bar `Note | Gate | Vel | Rel vel` matches PDF panel.

## 1.2 KeyboardPatch

Spec: `NORD_MODULAR_DESIGN.md:52-57`, `MODULE_LAYOUTS.md:29-31`.
PDF: p.2.

- **Verified** — all four outputs (Latest Note, Patch Gate, Latest Vel On, Latest Rel Vel) match. Single-trigger gate behaviour matches PDF wording "single-trigger fashion."
- **Minor** (`NORD_MODULAR_DESIGN.md:52`, `MODULE_LAYOUTS.md:29`) — module name `KeyboardPatch` is one word in spec; PDF body text uses `Keyboard Patch` (two words) but the panel header is `KeyboardPat..1` (truncated single-word). The single-word spec name is consistent with the panel header. Resolution: leave as is, or align to PDF body wording.

## 1.3 MIDIGlobal

Spec: `NORD_MODULAR_DESIGN.md:59-63`, `MODULE_LAYOUTS.md:33-35`.
PDF: p.3.

- **Verified** — Clock (24 PPQN), Sync (Global Sync rate), Active (high on Start/Continue, low on Stop) all match.
- **Verified** — layout matches.

## 1.4 AudioIn

Spec: `NORD_MODULAR_DESIGN.md:65-68`, `MODULE_LAYOUTS.md:37-40`.
PDF: p.4.

- **Verified** — L/R outputs (Red, Bipolar), 0dB headroom limit indication, externally-amplify guidance.
- **Verified** — layout matches (meter on left, L/R outputs on right).

## 1.5 PolyAreaIn

Spec: `NORD_MODULAR_DESIGN.md:70-74`, `MODULE_LAYOUTS.md:42-44`.
PDF: p.4.

- **Verified** — +6dB button, L/R outputs (Red, Bipolar), Common-Voice-Area-only restriction match.
- **Verified** — layout matches.

## 1.6 Output (1 Output)

Spec: `NORD_MODULAR_DESIGN.md:76-81`, `MODULE_LAYOUTS.md:46-48`.
PDF: p.5.

- **Verified** — Mix input (Red), Dest selector (Mix Bus 1-4, CVA L, CVA R = 6 destinations matches PDF "six mix buses"), M mute button, Level knob.
- **Minor** (`MODULE_LAYOUTS.md:48`) — control order in spec layout is `[Mix Input] [Dest Buttons] [M] [Level]`, but PDF panel order is `Dest [1][2][3][4]CVA[L][R] | M | Mix• | Level`. Spec puts Mix before Dest; PDF panel has Dest first. Resolution: reorder spec layout to `[Dest Buttons (1/2/3/4/CVA L/CVA R)] [M Button] [Mix Input (Red)] [Level Knob]`.

## 1.7 Output (2 Outputs)

Spec: `NORD_MODULAR_DESIGN.md:83-88`, `MODULE_LAYOUTS.md:50-52`.
PDF: p.5.

- **Verified** — Mix Bus L/R inputs, Destination selector (1/2, 3/4, CVA), M button, Level knob.
- **Minor** (`MODULE_LAYOUTS.md:52`) — same layout-order issue as 1.6: spec lists `[Mix Bus L] [Mix Bus R] [Dest] [M] [Level]`; PDF panel order is `Destination | M | Mix Bus L• R• | Level`. Resolution: reorder.
- **Minor** (`MODULE_LAYOUTS.md:52`) — spec writes destination labels as `1+2/3+4/CVA`; PDF panel uses slash form `1/2 | 3/4 | CVA`. Resolution: change `1+2/3+4/CVA` to `1/2, 3/4, CVA`.

## 1.8 Output (4 Outputs)

Spec: `NORD_MODULAR_DESIGN.md:90-93`, `MODULE_LAYOUTS.md:54-56`.
PDF: p.6.

- **Verified** — four Mix bus inputs (Red), Level knob. Layout matches.
- **Minor** (`NORD_MODULAR_DESIGN.md:90`) — spec says "Routes four separate signals to individual mix buses"; PDF says "routes four separate signals to one mix bus each." Equivalent meaning.

## 1.9 NoteDetect

Spec: `NORD_MODULAR_DESIGN.md:95-100`, `MODULE_LAYOUTS.md:58-60`.
PDF: p.6.

- **Verified** — Note knob (range C-1 to G9), Gate output (Yellow), V output (Blue, Unipolar velocity), R output (Blue, Unipolar release velocity), global behaviour (not affected by polyphony).
- **Minor** (`MODULE_LAYOUTS.md:60`) — spec layout lists `[Note Knob] [Note Display]`; PDF panel shows the order as Display first, then Knob: `[C4 display] [knob] [Gate] [V] [R]`. Resolution: swap to `[Note Display] [Note Knob]`.

## 1.10 KeybSplit

Spec: `NORD_MODULAR_DESIGN.md:102-110`, `MODULE_LAYOUTS.md:62-65`.
PDF: pp.6-7.

- **Verified** — Lower/Upper knobs (range C-1 to G9), three inputs (Note Blue, Gate Yellow, Vel Blue), three outputs (Note Blue, Gate Yellow, Vel Blue), pass-through-if-in-range behaviour.
- **Verified** — layout: top row with Lower display + knob + Upper display + knob; bottom row with input/output port group. PDF panel matches the spec's two-row description.

# Section 2: Oscillator group

PDF pages: 7-25. Module count: PDF 16 modules / spec 16 modules. ✓

## 2.1 MasterOsc

Spec: `NORD_MODULAR_DESIGN.md:118-126`, `MODULE_LAYOUTS.md:71-75`.
PDF: p.7.

- **Verified** — Coarse (C-1 to G9), Fine (+/- half semitone, 128 steps), Pitch Mod x2 (Blue, Type II), Slv output (Gray), Display (Hz/Note).
- **Critical** (`NORD_MODULAR_DESIGN.md:122`) — KBT described as "(Knob/Button)" with range "Off, or 0.0 to 2.0". PDF p.7 says: "If KBT is activated the oscillator will track the keyboard at the rate of one semitone for each key. If KBT is not activated, the keyboard will not affect the oscillator frequency." This is binary (Button On/Off), not a 0-2.0 knob. The 0.0-2.0 range applies only to `OscA` and `OscB`. Resolution: change to `**KBT (Button):** On/Off keyboard tracking.`
- **Critical** (`MODULE_LAYOUTS.md:73`) — layout lists `[KBT Knob]`; PDF panel renders KBT as a button label without rotary knob. Resolution: change to `[KBT Button]`.

## 2.2 OscA

Spec: `NORD_MODULAR_DESIGN.md:127-141`, `MODULE_LAYOUTS.md:77-81`.
PDF: pp.8-10.

- **Verified** — Coarse, Fine, KBT (Knob, Off to 2.0 — correctly described), PWidth (1%-99%), Pitch Mod x2 (Red, Type II), FMA (Red, Type II), Sync (Red), PWidth Mod (Red, Type I), Slv (Gray), M, Out (Bipolar).
- **Minor** (`NORD_MODULAR_DESIGN.md:129`) — spec describes the first waveform as "Pulse"; PDF p.8 says "Square/Pulse". Same minor naming difference exists in `OscB:144`, `OscSlvA:187`. Resolution: rename to `Square/Pulse` for consistency with PDF.

## 2.3 OscB

Spec: `NORD_MODULAR_DESIGN.md:142-151`, `MODULE_LAYOUTS.md:83-87`.
PDF: pp.10-11.

- **Verified** — Pitch Mod x2 (Blue, Type II — note: blue not red, matching PDF p.10), FMA (Red, Type II), PWidth Mod (Blue, Type I, from initial 50%), Slv (Gray), Out (Bipolar). Also verified spec's "clicking selected waveform button mutes output" against PDF p.11: "Selects one of the four available waveforms. Clicking on a selected button will mute the audio output of the oscillator." ✓
- **Minor** (`NORD_MODULAR_DESIGN.md:144`) — same `Pulse` vs `Square/Pulse` naming as OscA.

## 2.4 OscC

Spec: `NORD_MODULAR_DESIGN.md:152-162`, `MODULE_LAYOUTS.md:89-93`.
PDF: pp.11-12.

- **Verified** — Sine-only oscillator. KBT (Button, On/Off — correctly described), Pitch Mod (Red, Type II — single input), AM (Red, fixed 1:1), FMA (Red, Type II), Slv (Gray), M, Out (Bipolar).
- **Minor** (`MODULE_LAYOUTS.md:91-93`) — layout places AM in the middle row alongside Pitch and FMA. PDF panel p.11 actually shows AM in the top row near KBT and FMA. Resolution: rearrange to top row `[Display] [Coarse] [Fine] [AM (Red)] [KBT Button] [FMA (Red)] [Atten]`, middle row `[Pitch Mod (Red)] [Atten]`.

## 2.5 SpectralOsc

Spec: `NORD_MODULAR_DESIGN.md:163-173`, `MODULE_LAYOUTS.md:95-99`.
PDF: pp.12-14.

- **Verified** — Spectral Shape (knob + Blue mod input, attenuator), Partials buttons (All / Odd), Pitch Mod x2 (Blue, Type II), FMA (Red, Type II), Slv (Gray), M, Out (Bipolar).
- **Critical** (`NORD_MODULAR_DESIGN.md:167`) — `**Coarse/Fine/KBT:** Standard.` is ambiguous and likely misleading. PDF p.14 describes SpectralOsc's KBT as binary ("If KBT is activated... If KBT is not activated"), same as MasterOsc/OscC, NOT the OscA-style 0.0-2.0 knob implied by "Standard". Resolution: replace with `**Coarse/Fine (Knobs):** Standard. **KBT (Button):** On/Off.`
- **Critical** (`MODULE_LAYOUTS.md:97`) — layout lists `[KBT Knob]`; should be `[KBT Button]` to match PDF panel.

## 2.6 FormantOsc

Spec: `NORD_MODULAR_DESIGN.md:175-183`, `MODULE_LAYOUTS.md:101-105`.
PDF: pp.14-15.

- **Verified** — Coarse/Fine, KBT (Button), Timbre (1-127 + Random), Pitch Mod x2 (Blue, Type II), Slv (Gray), M, Out (Bipolar). No FMA input — correctly omitted from spec.
- **Minor** (`NORD_MODULAR_DESIGN.md:177`) — Timbre's blue mod input is mentioned inline in the Timbre bullet but not listed as a separate I/O port. The layout (`MODULE_LAYOUTS.md:104`) does list `[Timbre Mod (Blue)] [Atten]` separately. For consistency with other modules' bullet style, add a dedicated `**Timbre Mod (Input, Blue):** [Attenuator Type I].` bullet. (Type per PDF: this is a control modulation input; PDF does not tag a Type but inline-attenuator style suggests Type I — flag as `needs decision` if exact Type matters.)

## 2.7 OscSlvA

Spec: `NORD_MODULAR_DESIGN.md:184-197`, `MODULE_LAYOUTS.md:107-111`.
PDF: pp.15-16.

- **Verified** — Mst (Gray), Partials (1:32 to 32:1), Detune (semitone), Fine (+/- half, 128 steps), Sync (Red), FMA (Red, Type II), AM (Red, 1:1), Display (Semitones/Hz/Ratio), M, Out (Bipolar).
- **Minor** (`NORD_MODULAR_DESIGN.md:187`) — same `Pulse` vs `Square/Pulse` waveform naming as OscA/OscB.

## 2.8 OscSlvB

Spec: `NORD_MODULAR_DESIGN.md:199-206`, `MODULE_LAYOUTS.md:113-117`.
PDF: p.16.

- **Verified** — Mst (Gray), Partials/Detune/Fine same as OscSlvA, PW (1%-99%), PW Mod (Red, Type I), M, Out (Bipolar). All match.

## 2.9 OscSlvC

Spec: `NORD_MODULAR_DESIGN.md:208-214`, `MODULE_LAYOUTS.md:119-123`.
PDF: p.17.

- **Verified** — Sawtooth slave with Mst (Gray), Partials/Detune/Fine, FMA (Red, Type II), M, Out. All match.

## 2.10 OscSlvD

Spec: `NORD_MODULAR_DESIGN.md:216-222`, `MODULE_LAYOUTS.md:125-127`.
PDF: p.18.

- **Verified** — Triangle slave with Mst, Partials/Detune/Fine, FMA, M, Out. All match.

## 2.11 OscSlvE

Spec: `NORD_MODULAR_DESIGN.md:224-231`, `MODULE_LAYOUTS.md:129-133`.
PDF: p.19.

- **Verified** — Sine slave with Mst, Partials/Detune/Fine, FMA (Red, Type II), AM (Red, 1:1), M, Out. All match.

## 2.12 OscSineBank

Spec: `NORD_MODULAR_DESIGN.md:233-244`, `MODULE_LAYOUTS.md:135-140`.
PDF: p.20.

- **Verified** — Six independent sine oscillators with Mst (Gray, shared), Sync (Red, shared), Mix In (Red), per-osc Partial selectors (1:32 to 32:1), Tune knobs (semitone steps), Fine Tune knobs (1/128 semitone), Level knobs, AM inputs (Red, per-osc, 1:1), M buttons, summed Out (Bipolar). All match.

## 2.13 OscSlvFM

Spec: `NORD_MODULAR_DESIGN.md:246-254`, `MODULE_LAYOUTS.md:142-146`.
PDF: pp.21-22.

- **Verified** — Sine FM slave with Mst, Partials/Detune/Fine, Sync (Red), FMB (Red, Type II — distinct from FMA, classic FM timbres), -3 Oct button, M, Out. All match.

## 2.14 Noise

Spec: `NORD_MODULAR_DESIGN.md:256-259`, `MODULE_LAYOUTS.md:148-150`.
PDF: p.22.

- **Verified** — White/Colored knob, Out (Bipolar). Spec phrasing "Blends from white noise to colored (less high-frequency energy)" matches PDF p.22 "Colored noise contains less high frequency energy than white noise."

## 2.15 PercOsc

Spec: `NORD_MODULAR_DESIGN.md:261-272`, `MODULE_LAYOUTS.md:152-156`.
PDF: p.23.

- **Verified** — Pitch (C-1 to G9), Fine, Decay, Click, Punch (Button), Amp (Red, 1:1), Trig (Red, accepts audio rate), Pitch Mod (Blue, Type II), M, Out (Bipolar). All match.

## 2.16 DrumSynth

Spec: `NORD_MODULAR_DESIGN.md:274-296`, `MODULE_LAYOUTS.md:158-169`.
PDF: pp.24-25.

- **Verified** — Trig (Yellow, LED), Vel Mod (Blue), Pitch Mod (Blue), Master Pitch (20-784 Hz), Slave Ratio (1:1 to 6.26), per-osc Tune/Decay (0.5ms-45s)/Level, Noise Filter (Freq 10 Hz-15.8 kHz, Res, Sweep 0-5 octaves, Decay 0.5ms-45s, HP/BP/LP modes), Bend (Amt 0-5 octaves down, Dcy 0.5ms-45s), Click, Noise, Preset selector, M, Out (Bipolar). All match.

# Section 3: LFO group

PDF pages: 26-37. Module count: PDF 14 modules / spec 14 modules. ✓

## 3.1 LFOA

Spec: `NORD_MODULAR_DESIGN.md:304-316`, `MODULE_LAYOUTS.md:175-177`.
PDF: pp.26-27.

- **Verified** — 5 waveforms (Sine/Triangle/Sawtooth/Square/Random), Rate (699 s/cycle to 392 Hz), Hi range (0.26-392 Hz), Lo range (0.02-24.4 Hz), Sub range (699s-5.46s/cycle), Phase (-180 to +177°), KBT (Knob, Off to 2.0, doubles per octave at "Key"), Mono, Rate Mod (Blue, Type II), Rst (Yellow), Slv (Gray), M, Out (Blue, Bipolar, LED).
- **Minor** (`MODULE_LAYOUTS.md:177`) — layout describes "Wide Horizontal Row" but PDF panel p.26 is actually two rows (top: Rst/Rate display/Mono/Phase display/Phase knob/Phase graph; bottom: Slv/Rate knob/Hi-Lo-Sub/KBT/waveform selectors/M/Out). Spec lists all elements in one flat row description, which loses visual structure but contains all info.

## 3.2 LFOB

Spec: `NORD_MODULAR_DESIGN.md:318-326`, `MODULE_LAYOUTS.md:179-181`.
PDF: pp.27-29.

- **Verified** — Rate/Display/Hi/Lo/Sub/Phase/KBT/Mono/Rst same as LFOA, Rate Mod (Blue, Type II), PW (1%-99%), PW Mod (Blue, Type I), Slv (Gray), Out (Blue, Bipolar). PDF body text confirms no M button, matching spec's omission.

## 3.3 LFOC

Spec: `NORD_MODULAR_DESIGN.md:327-336`, `MODULE_LAYOUTS.md:183-185`.
PDF: p.29.

- **Verified** — 4 waveforms, Rate (same range as LFOA), Hi/Lo/Sub, Rate Mod (Blue, Type II), Mono, Slv (Gray), M, Out (Blue, Bipolar, LED). No phase, no KBT, no restart — correctly captured in spec.

## 3.4 LFOSlvA

Spec: `NORD_MODULAR_DESIGN.md:338-347`, `MODULE_LAYOUTS.md:187-189`.
PDF: p.30.

- **Verified** — 5 waveforms, Mst (Gray), Rate (0.025-38.05× master, or 62.9s/cycle to 24.4 Hz), Phase (-180 to +177°), Mono, Rst (Yellow), M, Out (Blue, Bipolar, LED). All match.

## 3.5 LFOSlvB

Spec: `NORD_MODULAR_DESIGN.md:349-353`, `MODULE_LAYOUTS.md:191-193`.
PDF: p.31.

- **Verified** — Sawtooth slave with Mst (Gray), Display, Rate knob (0.025-38.05× master), Out (Blue).
- **Minor** (`NORD_MODULAR_DESIGN.md:353`) — Out description "Bipolar" omits the LED indicator. PDF p.31 says: "The LED above the output shows an approximation of the current LFO rate. Signal: Bipolar." Layout already includes "+ LED" but body is inconsistent. Resolution: append "LED indicates rate." to the Out bullet, matching LFOA and LFOSlvA style.

## 3.6 LFOSlvC

Spec: `NORD_MODULAR_DESIGN.md:355-359`, `MODULE_LAYOUTS.md:195-197`.
PDF: pp.31-32.

- **Verified** — Sine slave; same controls as LFOSlvB.
- **Minor** (`NORD_MODULAR_DESIGN.md:359`) — same missing-LED note as LFOSlvB.

## 3.7 LFOSlvD

Spec: `NORD_MODULAR_DESIGN.md:361-365`, `MODULE_LAYOUTS.md:199-201`.
PDF: p.32.

- **Verified** — Square slave; same controls.
- **Minor** (`NORD_MODULAR_DESIGN.md:365`) — same missing-LED note.

## 3.8 LFOSlvE

Spec: `NORD_MODULAR_DESIGN.md:367-371`, `MODULE_LAYOUTS.md:203-205`.
PDF: pp.32-33.

- **Verified** — Triangle slave; same controls.
- **Minor** (`NORD_MODULAR_DESIGN.md:371`) — same missing-LED note.

## 3.9 ClkGen

Spec: `NORD_MODULAR_DESIGN.md:373-381`, `MODULE_LAYOUTS.md:207-209`.
PDF: p.34.

- **Verified** — Reset (Yellow, triggers Sync output on reset), Slv (Gray, 1 BPM ↔ 1 Hz at 1:1), Rate (24-214 BPM), On/Off button, 24 Pulses/B (Yellow Logic), 4 Pulses/B (Yellow Logic), Sync (Yellow Logic, pulses on start/reset). All match.

## 3.10 ClkRndGen

Spec: `NORD_MODULAR_DESIGN.md:383-388`, `MODULE_LAYOUTS.md:211-213`.
PDF: p.35.

- **Verified** — Mono, Col (colored vs white random), Clk input (Yellow), Out (Blue, Bipolar). All match.

## 3.11 RndStepGen

Spec: `NORD_MODULAR_DESIGN.md:390-394`, `MODULE_LAYOUTS.md:215-217`.
PDF: p.35.

- **Verified** — Mst (Gray), Rate display, Rate knob (0.025-38.05× master), Out (Blue, Bipolar, colored random). All match.

## 3.12 RandomGen

Spec: `NORD_MODULAR_DESIGN.md:396-400`, `MODULE_LAYOUTS.md:219-221`.
PDF: p.36.

- **Verified** — Mst (Gray), Display, Rate knob, Out (Blue, smooth random). PDF wording: "Random Generator is a slave LFO that generates smooth random control signal steps at a steady frequency." Matches spec.

## 3.13 RndPulsGen

Spec: `NORD_MODULAR_DESIGN.md:402-405`, `MODULE_LAYOUTS.md:223-225`.
PDF: p.36.

- **Verified** — Density knob, Out (Blue). PDF describes output as random logic pulses but explicitly tagged as `Signal: Bipolar`. Spec's "Bipolar random pulses" wording captures this. All match.

## 3.14 PatternGen

Spec: `NORD_MODULAR_DESIGN.md:407-417`, `MODULE_LAYOUTS.md:227-230`.
PDF: p.37.

- **Verified** — Clk (Yellow), Rst (Yellow), Pattern (knob + Blue mod input + display, 0-127), Bank (knob + Blue mod input + display, 0-127), Step selector (1-128), Mono, Delta (High/Low — High = large level differences, default High), Out (Blue, Unipolar). 16384 patterns = 128 banks × 128 patterns. All match.

# Section 4: Envelope group

PDF pages: 38-46. Module count: PDF 6 modules / spec 6 modules. ✓

## 4.1 ADSR-Env

Spec: `NORD_MODULAR_DESIGN.md:424-438`, `MODULE_LAYOUTS.md:236-240`.
PDF: pp.38-39.

- **Verified** — Attack curve (Log/Linear/Exp, 3 buttons, not Morph-assignable per PDF p.39 "This selector can not be assigned to a Morph group"), A/D/S/R ranges (0.5ms-45s, 0-64 units for S), exponential D/R, Invert button, Gate (Yellow + LED), Retrig (Yellow, requires gate), Amp (Blue), Input (Red audio), Env Output (Blue Unipolar), Output (Red Bipolar), Graph. All match.

## 4.2 AD-Env

Spec: `NORD_MODULAR_DESIGN.md:440-449`, `MODULE_LAYOUTS.md:242-244`.
PDF: pp.40-41.

- **Verified** — Gate/Trig selector & input (Yellow + LED), Attack (linear), Dcy (exponential, 0.5ms-45s each), Amp (Blue), Input (Red), Env Output (Blue Unipolar), Output (Red Bipolar). PDF p.40 confirms Trig mode: "the unconditional (Trig mode) envelope only needs a short high logic signal to start. When the envelope has started after a Trig signal, it will proceed to the very end of the cycle even if the Trig signal drops to zero." Matches spec.

## 4.3 Mod-Env

Spec: `NORD_MODULAR_DESIGN.md:451-461`, `MODULE_LAYOUTS.md:246-251`.
PDF: pp.41-42.

- **Verified** — A/D/S/R same as ADSR-Env, A/D/S/R Control Inputs x4 (Blue, Type I, A/D/R bipolar — positive shortens, negative lengthens; S direct level), Invert, Gate (Yellow + LED), Retrig, Amp, Input, Env Output, Output. All match.

## 4.4 AHD-Env

Spec: `NORD_MODULAR_DESIGN.md:463-473`, `MODULE_LAYOUTS.md:253-258`.
PDF: pp.42-44.

- **Verified** — A (linear, 0.5ms-45s), H (0.5ms-45s, sets time at +64), D (exponential, 0.5ms-45s), A/H/D Control Inputs x3 (Blue, Type I; A/D positive shortens, H reversed — positive lengthens), Trig (Yellow + LED, trig-only — always completes full cycle), Amp, Input, Env Output, Output. All match.

## 4.5 Multi-Env

Spec: `NORD_MODULAR_DESIGN.md:475-486`, `MODULE_LAYOUTS.md:260-265`.
PDF: pp.44-45.

- **Verified** — Curve buttons (Bipolar Lin / Unipolar Exp / Unipolar Lin, with PDF p.44 confirming "only the attack segments of the unipolar envelopes that can be selected to be linear or exponential. The decay segments of the unipolar envelopes are always exponential"), L1-L4 (-64 to +64 bipolar / 0 to +64 unipolar), T1-T5 (0.5ms-45s each, T5 = release from L4 to 0), Sustain selector (None, L1-L4), Gate (Yellow + LED), Amp, Input, Env Output (Unipolar OR Bipolar depending on curve mode), Output, Graph (shows sustain indicator and "0 units output level" line in bipolar mode). All match.

## 4.6 EnvFollower

Spec: `NORD_MODULAR_DESIGN.md:488-493`, `MODULE_LAYOUTS.md:267-269`.
PDF: pp.45-46.

- **Verified** — Atk (Fast/0.5ms to 767ms), Rel (40ms to 3.26s), Input (Red), Output (Blue Unipolar). All match.

_No discrepancies found in Envelope group._

# Section 5: Filter group

PDF pages: 46-54. Module count: PDF 11 modules / spec 11 modules. ✓

## 5.1 FilterA

Spec: `NORD_MODULAR_DESIGN.md:499-503`, `MODULE_LAYOUTS.md:275-277`.
PDF: p.46.

- **Verified** — Static non-resonant lowpass, 6 dB/oct, Freq (12 Hz - 20 kHz), Input (Red), Output (Red Bipolar). All match.

## 5.2 FilterB

Spec: `NORD_MODULAR_DESIGN.md:505-509`, `MODULE_LAYOUTS.md:279-281`.
PDF: p.46.

- **Verified** — Static non-resonant highpass, 6 dB/oct, same Freq range. All match.

## 5.3 FilterC

Spec: `NORD_MODULAR_DESIGN.md:511-519`, `MODULE_LAYOUTS.md:283-285`.
PDF: p.47.

- **Verified** — Static multimode, 12 dB/oct, three outputs (HP/BP/LP, all Red Bipolar), Freq (10 Hz - 15.8 kHz, E-1 to B9), Res (0-127, self-oscillates at 127), GC button, Input (Red). All match.

## 5.4 FilterD

Spec: `NORD_MODULAR_DESIGN.md:521-530`, `MODULE_LAYOUTS.md:287-291`.
PDF: p.48.

- **Verified** — Dynamic multimode, 12 dB/oct, three outputs (HP/BP/LP, Red Bipolar), Freq, Freq Mod (Blue, Type III), KBT (Knob, Off to 2.0), Res (0-127), Input. PDF panel does not include GC button — spec correctly omits it (FilterC has GC, FilterD does not).

## 5.5 FilterE

Spec: `NORD_MODULAR_DESIGN.md:532-545`, `MODULE_LAYOUTS.md:293-297`.
PDF: pp.49-50.

- **Verified** — Multi-mode HP/BP/LP/BR (selector not Morph-assignable per PDF p.49), GC button, Freq (10 Hz - 15.8 kHz), Freq Mod x2 (Red, Type III), KBT, Res (0-127, controls reject bandwidth in BR mode), Res Mod (Red, Type I), dB/Oct (12 or 24), B (Bypass), Graph, Input, Output (Bipolar). All match.

## 5.6 FilterF

Spec: `NORD_MODULAR_DESIGN.md:547-557`, `MODULE_LAYOUTS.md:299-303`.
PDF: pp.50-51.

- **Verified** — Classic analog-style lowpass, dB/Oct (12, 18, or 24), Freq, Freq Mod x2 (**Blue** in FilterF — distinct from FilterE's Red, Type III), KBT, Res (0-127), B (Bypass), Graph, Input, Output (Bipolar). All match.

## 5.7 VocalFilter

Spec: `NORD_MODULAR_DESIGN.md:559-568`, `MODULE_LAYOUTS.md:305-309`.
PDF: pp.51-52.

- **Verified** — Res, Freq, Freq Mod (Blue, Type II), Vowel display + selector x3 (presets A, E, I, O, U, Y, AA, AE, OE), Vowel Navigator knob (transformation, not mix), Vowel Mod (Blue, Type I), Input (Red, with attenuator knob), Output (Red Bipolar). All match.

## 5.8 Vocoder

Spec: `NORD_MODULAR_DESIGN.md:570-580`, `MODULE_LAYOUTS.md:311-317`.
PDF: pp.52-53.

- **Verified** — 16 bands, Analysis Input (Red, upper-left), HF Emphasis button, Mon button, Reroute buttons x16, Inv (reverses 1↔16), Rnd (random routing), Output Gain (0.25-4×), Synth Input (Red, lower-right), Out (Red Bipolar), Routing Graph.
- **Critical** (`NORD_MODULAR_DESIGN.md:576`) — spec says `Shift buttons (+1 to +15)` for the preset shift range. PDF panel p.52 shows preset shift buttons as `-2, -1, 0, +1, +2, Inv, Rnd` (a small symmetric range, not +1 to +15). PDF p.53 body text describes them as "all Synthesis bands the number of steps indicated on the buttons" — the actual button labels are -2 through +2. Resolution: replace `+1 to +15` with `-2 to +2` (and update the surrounding wording: "Shift buttons (-2 to +2 steps)").

## 5.9 FilterBank

Spec: `NORD_MODULAR_DESIGN.md:582-588`, `MODULE_LAYOUTS.md:319-322`.
PDF: pp.52-53.

- **Verified** — 14-band static filter, per-band sliders with Hz/kHz frequency labels above each, Min/Max preset buttons, Input (Red), B (Bypass), Output (Red Bipolar). All match.

## 5.10 EqMid

Spec: `NORD_MODULAR_DESIGN.md:590-598`, `MODULE_LAYOUTS.md:324-327`.
PDF: pp.53-54.

- **Verified** — Parametric mid EQ. Freq (20 Hz - 16 kHz), Gain (-18 to +18 dB), BW (2 to 0.02 octaves), Graph, Input (Red, attenuator Type I), B (Bypass), Output (Red Bipolar, multi-color LED). All match.

## 5.11 EqShelving

Spec: `NORD_MODULAR_DESIGN.md:600-608`, `MODULE_LAYOUTS.md:329-332`.
PDF: p.54.

- **Verified** — Hi/Lo shelving EQ. Freq (20 Hz - 16 kHz), Gain (-18 to +18 dB), Hi/Lo selector, Graph, Input (Red, attenuator Type I), Bypass button, Output (Red Bipolar, multi-color LED). All match.

# Section 6: Mixer group

PDF pages: 55-61. Module count: PDF 13 modules / spec 13 modules. ✓ (PDF p.57 includes a "Ring-/Amplitude modulator patch example" but that is illustrative content, not a separate module.)

## 6.1 3 Inputs Mixer

Spec: `NORD_MODULAR_DESIGN.md:616-619`, `MODULE_LAYOUTS.md:338-341`.
PDF: p.55.

- **Verified** — 3 inputs (Red, attenuator Type I), Output (Red Bipolar). All match.

## 6.2 8 Inputs Mixer

Spec: `NORD_MODULAR_DESIGN.md:621-625`, `MODULE_LAYOUTS.md:343-346`.
PDF: p.55.

- **Verified** — 8 inputs (Red, Type I, default attenuation 100 to reduce distortion risk), -6dB button, Output (Red Bipolar, multi-color LED). All match.

## 6.3 GainControl (VCA)

Spec: `NORD_MODULAR_DESIGN.md:627-633`, `MODULE_LAYOUTS.md:348-350`.
PDF: p.56.

- **Verified** — Control input (Red, 0=closed, +64=open, -64=inverted polarity), Unipolar button (divides by 2, adds +32 bias), Input (Red), Output (Red Bipolar). Unipolar-off = ring modulation, Unipolar-on = amplitude modulation. All match.

## 6.4 X-Fade

Spec: `NORD_MODULAR_DESIGN.md:635-640`, `MODULE_LAYOUTS.md:352-354`.
PDF: pp.57-58.

- **Verified** — 1/2 knob, X-Fade Mod (Red, Type I), Inputs 1/2 (Red), Output (Red Bipolar). All match.

## 6.5 Pan

Spec: `NORD_MODULAR_DESIGN.md:642-648`, `MODULE_LAYOUTS.md:356-358`.
PDF: p.58.

- **Verified** — L/R knob, Pan Mod (Red, Type I), Input (Red mono), L and R outputs (Red Bipolar). All match.

## 6.6 1to2Fade

Spec: `NORD_MODULAR_DESIGN.md:650-654`, `MODULE_LAYOUTS.md:360-362`.
PDF: p.58.

- **Verified** — Fade knob (12 o'clock = both silent), Input, Output 1/2. All match.

## 6.7 2to1Fade

Spec: `NORD_MODULAR_DESIGN.md:656-660`, `MODULE_LAYOUTS.md:364-366`.
PDF: pp.58-59.

- **Verified** — Fade knob (12 o'clock = output silent), Inputs 1/2, Output. All match.

## 6.8 LevMult

Spec: `NORD_MODULAR_DESIGN.md:662-667`, `MODULE_LAYOUTS.md:368-370`.
PDF: p.59.

- **Verified** — Uni button, Gain (-127 to +127 bipolar / 0 to 127 unipolar; +127 unity gain; negative = 180° phase shift), Input, Output. All match.

## 6.9 LevAdd

Spec: `NORD_MODULAR_DESIGN.md:669-674`, `MODULE_LAYOUTS.md:372-374`.
PDF: p.59.

- **Verified** — Uni button, Offset (-64 to +64 bipolar / 0 to +64 unipolar), Input, Output. All match.

## 6.10 OnOff

Spec: `NORD_MODULAR_DESIGN.md:676-680`, `MODULE_LAYOUTS.md:376-378`.
PDF: p.60.

- **Verified** — On button (no input → constant 0 or +64), Input, Output (signal type depends on input — Bipolar/Unipolar/Logic). All match.

## 6.11 4-1Switch

Spec: `NORD_MODULAR_DESIGN.md:682-687`, `MODULE_LAYOUTS.md:380-383`.
PDF: p.60.

- **Verified** — 4 inputs (Red, Type I), Input selector buttons, M button, Output (Red Bipolar). All match.

## 6.12 1-4Switch

Spec: `NORD_MODULAR_DESIGN.md:689-694`, `MODULE_LAYOUTS.md:385-389`.
PDF: p.61.

- **Verified** — Input (Red, Type I), Output selector buttons, M (mutes all outputs), 4 outputs (Red Bipolar). All match.

## 6.13 Amplifier

Spec: `NORD_MODULAR_DESIGN.md:696-700`, `MODULE_LAYOUTS.md:391-393`.
PDF: p.61.

- **Verified** — Amplification knob/display (0.25x to 4.0x), Input, Output (Red Bipolar). PDF p.61 body text uses "slider" but the panel image shows a rotary knob; spec correctly describes a knob.

_No discrepancies found in Mixer group._

# Section 7: Audio Modifier group

PDF pages: 62-75. Module count: PDF 15 modules / spec 15 modules. ✓

## 7.1 Clip

Spec: `NORD_MODULAR_DESIGN.md:706-713`, `MODULE_LAYOUTS.md:399-401`.
PDF: p.62.

- **Verified** — Sym button (Off = positive peaks only, On = both), Mod input (Red, Type I), Clip knob, Graph, In (Red), Out (Red Bipolar). All match.

## 7.2 Overdrive

Spec: `NORD_MODULAR_DESIGN.md:715-721`, `MODULE_LAYOUTS.md:403-405`.
PDF: pp.62-63.

- **Verified** — Overdrive knob, Mod input (Blue, Type I — note: blue, distinct from Clip's red mod input), Graph, In (Red), Out (Red Bipolar). All match.

## 7.3 WaveWrapper

Spec: `NORD_MODULAR_DESIGN.md:723-729`, `MODULE_LAYOUTS.md:407-409`.
PDF: p.63.

- **Verified** — Wrap knob, Mod input (Red, Type I), Graph, In (Red), Out (Red Bipolar). All match.

## 7.4 Quantizer

Spec: `NORD_MODULAR_DESIGN.md:731-735`, `MODULE_LAYOUTS.md:411-413`.
PDF: p.64.

- **Verified** — Bits selector (Off, 12 down to 1 bits), In (Red), Out (Red Bipolar). All match.

## 7.5 Delay (Short)

Spec: `NORD_MODULAR_DESIGN.md:737-743`, `MODULE_LAYOUTS.md:415-417`.
PDF: p.64.

- **Verified** — Time (0 to 2.65 ms), Time Mod (Blue, Type I), In (Red), 2.65ms fixed-max output (Red Bipolar), variable-time Output (Red Bipolar). All match.

## 7.6 Sample&Hold

Spec: `NORD_MODULAR_DESIGN.md:745-750`, `MODULE_LAYOUTS.md:419-421`.
PDF: p.65.

- **Verified** — Trig (Yellow, samples on positive edge), Input (Red), Out (Red Bipolar, holds last sampled value). The classic-use note (Noise → input + LFO → trig for random stepped modulation) is supported by PDF p.65 example diagram. All match.

## 7.7 Diode

Spec: `NORD_MODULAR_DESIGN.md:752-755`, `MODULE_LAYOUTS.md:423-425`.
PDF: p.65.

- **Verified** — Selector (Bypass / Half — discard negatives / Full — mirror negatives to positive), In (Red), Out (Bipolar or Unipolar depending on mode). All match.

## 7.8 StereoChorus

Spec: `NORD_MODULAR_DESIGN.md:757-763`, `MODULE_LAYOUTS.md:427-429`.
PDF: p.66.

- **Verified** — Detune (chorus depth), Amount (dry/wet), B (Bypass), In (Red), L/R outputs (Red Bipolar stereo). All match.

## 7.9 Phaser

Spec: `NORD_MODULAR_DESIGN.md:765-779`, `MODULE_LAYOUTS.md:431-435`.
PDF: pp.66-67.

- **Verified** — 14-pole, 1-6 selectable allpass filters (Peaks selector), Rate (62.9 s/cycle to 24.4 Hz), Depth, LFO on/off button, Center Freq (100 Hz to 16 kHz), Center Freq Mod (Blue, Type I), Feedbk (positive/negative, center = zero), Spread, Spread Mod (Blue, Type I), B (Bypass), Input (Red, Type I attenuator), Output (Red Bipolar, multi-color LED), Graph. All match.

## 7.10 InvLevShift

Spec: `NORD_MODULAR_DESIGN.md:781-789`, `MODULE_LAYOUTS.md:437-439`.
PDF: p.68.

- **Verified** — Inv (polarity), Bipolar (keep bipolar), Unipolar Negative (÷2, -32 bias), Unipolar Positive (÷2, +32 bias), Input (Red), Output (Bipolar or Unipolar). All match.

## 7.11 Shaper

Spec: `NORD_MODULAR_DESIGN.md:791-796`, `MODULE_LAYOUTS.md:441-443`.
PDF: pp.68-69.

- **Verified** — 5 shape buttons (Log2, Log1, Linear=bypass, Exp1, Exp2), In (Red), Out (Red Bipolar). PDF p.69 confirms spec's note: Log2 on sine ≈ square; Exp2 on sine ≈ triangle. All match.

## 7.12 Compressor

Spec: `NORD_MODULAR_DESIGN.md:798-812`, `MODULE_LAYOUTS.md:445-449`.
PDF: pp.70-71.

- **Verified** — Attack (0.5ms-767ms), Release (125ms-10.2s), Threshold (-30 to 11 dB, Off), Ratio (1.0:1 to 80:1), Ref Level (-30 to 12 dB), Limiter (-30 to 11 dB, Off), Side Chain (Red), Act, Mon, B (Bypass), Input L/R (Red), Output L/R (Red Bipolar), Graph + GR indicator + Lim Active LED. All match.

## 7.13 Expander

Spec: `NORD_MODULAR_DESIGN.md:814-828`, `MODULE_LAYOUTS.md:451-455`.
PDF: pp.71-72.

- **Verified** — Attack (0.5ms-767ms), Release (125ms-10.2s), Threshold (Off, -83 to 0 dB), Ratio (1:1.0 to 1:80), Gate (Off, -83 to -12 dB), Hold (Off, 4-508ms), Side Chain (Red), Act, Mon, B (Bypass), Input L/R (Red), Output L/R (Red Bipolar), Graph + GR indicator + Gate Active LED. All match.

## 7.14 RingMod

Spec: `NORD_MODULAR_DESIGN.md:830-836`, `MODULE_LAYOUTS.md:457-459`.
PDF: p.72.

- **Verified** — 0/AM/RM knob (12 o'clock = max AM, past = ring modulation), Mod Depth Mod input (Blue, Type I), Mod input (Red, modulator signal), In (Red, carrier), Out (Red Bipolar). All match.

## 7.15 Digitizer

Spec: `NORD_MODULAR_DESIGN.md:838-846`, `MODULE_LAYOUTS.md:461-465`.
PDF: p.75.

- **Verified** — Bits selector (1-12), Quant Off button, Sample rate (32.7 Hz - 50.18 kHz; PDF says 32.70), Sample Off button, Rate Mod (Blue, Type I), In (Red), Out (Red Bipolar). All match.

_No discrepancies found in Audio Modifier group._

# Section 8: Control Modifier group

PDF pages: 76-82. Module count: PDF 10 modules / spec 10 modules. ✓

## 8.1 Constant

Spec: `NORD_MODULAR_DESIGN.md:852-856`, `MODULE_LAYOUTS.md:471-473`.
PDF: p.76.

- **Verified** — Uni button (Bipolar = -64 to +64 in 1-unit increments; Unipolar = 0 to +64 in 0.5-unit increments), Value (knob + display), Output (Blue Unipolar or Bipolar). All match.

## 8.2 Smooth

Spec: `NORD_MODULAR_DESIGN.md:858-862`, `MODULE_LAYOUTS.md:475-477`.
PDF: p.76.

- **Verified** — Time (0.32 to 318 ms), Input (Blue), Output (Blue Bipolar). All match.

## 8.3 PortamentoA

Spec: `NORD_MODULAR_DESIGN.md:864-868`, `MODULE_LAYOUTS.md:479-481`.
PDF: p.77.

- **Verified** — Time (5.3 to 1355 ms), In (Blue), On (Yellow — when unpatched, portamento always active), Output (Blue Bipolar). All match.

## 8.4 PortamentoB

Spec: `NORD_MODULAR_DESIGN.md:870-876`, `MODULE_LAYOUTS.md:483-485`.
PDF: p.77.

- **Verified** — Time (5.3 to 1355 ms), In (Blue), Jmp (Yellow — temporarily interrupts; unpatched = always active), Output (Blue Bipolar). Spec's tip "Patch Keyboard Patch gate → Jmp for legato portamento" is supported by PDF p.77 example. All match.

## 8.5 NoteScaler

Spec: `NORD_MODULAR_DESIGN.md:879-883`, `MODULE_LAYOUTS.md:487-489`.
PDF: p.78.

- **Verified** — Range (knob + display, 0 to ±64 semitones, shows musical intervals like fifth/seventh in parentheses), In (Blue), Output (Blue Bipolar). All match.

## 8.6 NoteQuant

Spec: `NORD_MODULAR_DESIGN.md:885-890`, `MODULE_LAYOUTS.md:491-493`.
PDF: p.78.

- **Verified** — Range (0 to ±64 semitones), Notes selector (Off, 1-127 semitones), In (Blue), Out (Blue Bipolar). All match.

## 8.7 KeyQuant

Spec: `NORD_MODULAR_DESIGN.md:892-898`, `MODULE_LAYOUTS.md:495-498`.
PDF: pp.79-80.

- **Verified** — 12 Note buttons (C, C#, D, ..., B; duplicated across all octaves), Range (±64 semitones), Cont button (forces equal sections per octave), In (Blue), Out (Blue Bipolar). Diagrams on PDF p.79 confirm Cont behaviour. All match.

## 8.8 PartialGen

Spec: `NORD_MODULAR_DESIGN.md:900-904`, `MODULE_LAYOUTS.md:500-502`.
PDF: p.80.

- **Verified** — Range (0 to ±64 partials in 0.5 steps; values >±32 shown with asterisk indicating practical limit), Input (Blue), Out (Blue Bipolar). PDF p.80 confirms the practical-limit behaviour: oscillator stays at 32nd partial when control signal exceeds ±32. All match.

## 8.9 ControlMixer

Spec: `NORD_MODULAR_DESIGN.md:906-911`, `MODULE_LAYOUTS.md:504-506`.
PDF: p.81.

- **Verified** — Lin button (Type I linear / Type II exponential), 2 Inv switches, 2 Inputs (Blue, with attenuation), Output (Blue Bipolar). All match.

## 8.10 NoteVelScal

Spec: `NORD_MODULAR_DESIGN.md:913-922`, `MODULE_LAYOUTS.md:508-512`.
PDF: pp.81-82.

- **Verified** — Vel and Note inputs (Blue), Vel Sens (Type I), L Gain (±24 dB/octave), Brk Pnt (C-1 to G9), R Gain (±24 dB/octave), Graph, Output (Blue Bipolar).
- **Minor** (`NORD_MODULAR_DESIGN.md:916`) — Vel Sens description says `Min = always 64; Max = full velocity range.` PDF p.81 actually states: "If set to min (0) the velocity output component is always 64 units. If set to max (127) the output can vary between 0 and 85 units." So at max sensitivity the output range is 0-85 units, not the full velocity range. Resolution: change to `Min (0) = output always 64 units; Max (127) = output ranges 0-85 units across the velocity input.`

# Section 9: Logic group

PDF pages: 83-87. Module count: PDF 10 modules / spec 10 modules. ✓

## 9.1 PosEdgeDelay

Spec: `NORD_MODULAR_DESIGN.md:930-934`, `MODULE_LAYOUTS.md:518-520`.
PDF: p.83.

- **Verified** — Time (1.0 ms to 18 s, no output if input goes low before delay elapses), Input (Yellow), Output (Yellow Logic). All match.

## 9.2 NegEdgeDelay

Spec: `NORD_MODULAR_DESIGN.md:936-940`, `MODULE_LAYOUTS.md:522-524`.
PDF: p.83.

- **Verified** — Time (1.0 ms to 18 s, new positive edges extend high duration), Input, Output. All match.

## 9.3 Pulse

Spec: `NORD_MODULAR_DESIGN.md:942-946`, `MODULE_LAYOUTS.md:526-528`.
PDF: p.84.

- **Verified** — Time (1.0 ms to 18 s, retrigger extends duration), Input, Output. All match.

## 9.4 LogicDelay

Spec: `NORD_MODULAR_DESIGN.md:948-952`, `MODULE_LAYOUTS.md:530-532`.
PDF: p.84.

- **Verified** — Time (1.0 ms to 18 s, cycle length preserved), Input, Output. All match.

## 9.5 LogicInv

Spec: `NORD_MODULAR_DESIGN.md:954-958`, `MODULE_LAYOUTS.md:534-536`.
PDF: p.85.

- **Verified** — Threshold (+1 to +64 → low; 0 to -64 → high), Input, Output. All match.

## 9.6 LogicProc

Spec: `NORD_MODULAR_DESIGN.md:960-967`, `MODULE_LAYOUTS.md:538-540`.
PDF: p.85.

- **Verified** — AND / OR / XOR mode buttons (semantics match PDF), 2 Inputs (Yellow), Output (Yellow Logic). All match.

## 9.7 CompareLev

Spec: `NORD_MODULAR_DESIGN.md:969-973`, `MODULE_LAYOUTS.md:542-544`.
PDF: p.86.

- **Verified** — Level Limit knob/display (-64 to +64 units), A input (Blue control), Out (Yellow Logic, high when input ≥ threshold). All match.

## 9.8 CompareAB

Spec: `NORD_MODULAR_DESIGN.md:975-978`, `MODULE_LAYOUTS.md:546-548`.
PDF: p.86.

- **Verified** — A and B inputs (Blue), A≥B output (Yellow Logic). All match.

## 9.9 ClkDiv

Spec: `NORD_MODULAR_DESIGN.md:980-985`, `MODULE_LAYOUTS.md:550-552`.
PDF: p.87.

- **Verified** — Divider (1-128, useful values 6 = sixteenth notes from 24 PPQN, 8 = eighth-note triplets), Clock (Yellow), Rst (Yellow), Output (Yellow Logic). All match.

## 9.10 ClkDivFix

Spec: `NORD_MODULAR_DESIGN.md:987-991`, `MODULE_LAYOUTS.md:554-556`.
PDF: p.87.

- **Verified** — MIDI cl (24 PPQN input), Rst, three Yellow Logic outputs: 8 (÷12 = eighth notes; PDF: "24 incoming pulses divided to 2 pulses" = 24/12), T8 (÷8 = eighth-note triplets; "24 to 3"), 16 (÷6 = sixteenth notes; "24 to 4"). All match.

_No discrepancies found in Logic group._

# Section 10: Sequencer group

PDF pages: 88-93 (sequencing examples on pp.94-97 are illustrative content, not separate modules). Module count: PDF 4 modules / spec 4 modules. ✓

## 10.1 EventSeq

Spec: `NORD_MODULAR_DESIGN.md:1002-1013`, `MODULE_LAYOUTS.md:562-567`.
PDF: pp.88-89.

- **Verified** — Clk (Yellow), Rst (Yellow), Snc (Yellow Logic, pulse on step 1), Clr, Loop, Step (1-128), 32 trigger buttons in 2 rows of 16, G buttons per row (Trigger mode = 50% duty cycle / Gate mode = adjacent steps merge), Link (Yellow Logic past step 16), 2 Outs (Yellow Logic). All match.

## 10.2 CtrlSeq

Spec: `NORD_MODULAR_DESIGN.md:1015-1027`, `MODULE_LAYOUTS.md:569-574`.
PDF: pp.89-90.

- **Verified** — Clk, Rst, Snc, Clr, Rnd, Loop, Step (1-128), 16 sliders (±64 bipolar / 0-64 unipolar), Uni button, Link, Out (Blue, Unipolar or Bipolar). All match.

## 10.3 NoteSeqA

Spec: `NORD_MODULAR_DESIGN.md:1029-1043`, `MODULE_LAYOUTS.md:576-581`.
PDF: pp.90-91.

- **Verified** — Clk, Rst, Snc, Clr, Loop, Step (1-128), Record (program from keyboard/MIDI, key press advances step), Stop/Go, < > scroll, 16 sliders (±64 semitones), Link, Gclk (logic pulse on each step advance), Out (Blue Bipolar pitch).
- **Critical** (`MODULE_LAYOUTS.md:580`) — layout description says `16 vertical pitch sliders with 16 gate toggle buttons below`, but PDF p.90 panel shows only the 16 vertical pitch sliders — there are no per-step gate toggle buttons on NoteSeqA. The PDF body text describes only Sliders, with the per-step "logic gate signal" being the Gclk output (pulses on each step advance). Resolution: change to `16 vertical pitch sliders with step LEDs above. No per-step gate buttons — Gclk emits a logic pulse on each step advance.`

## 10.4 NoteSeqB

Spec: `NORD_MODULAR_DESIGN.md:1045-1053`, `MODULE_LAYOUTS.md:583-588`.
PDF: pp.92-93.

- **Verified** — Clk, Rst, Snc, Clr, Rnd (randomizes within visible grid range), Loop, Step (1-128), Record, Stop/Go, < > scroll, Graphical grid with zoom (1-6 octaves; click to zoom in, Ctrl/Alt-click to zoom out), Arrow buttons x16 for fine per-step pitch, scroll bar, Link, Gclk, Out (Blue Bipolar).
- **Minor** (`MODULE_LAYOUTS.md:585`, `:588`) — layout places `Snc Output (Yellow)` on the **Right Side**, but PDF p.92 panel shows Snc on the **Left Side**, grouped with the Clk/Rst inputs and Clr/Rnd buttons. Resolution: move `[Snc Output (Yellow)]` from the Right-Side line to the Left-Side line (matching NoteSeqA's layout convention).

---

# Summary

| Group | Critical | Minor | Formatting | Out-of-scope |
|-------|----------|-------|------------|--------------|
| 0. Conventions | 0 | 2 | 0 | 5 |
| 1. In/Out | 0 | 6 | 0 | 0 |
| 2. Oscillator | 4 | 5 | 0 | 0 |
| 3. LFO | 0 | 5 | 0 | 0 |
| 4. Envelope | 0 | 0 | 0 | 0 |
| 5. Filter | 1 | 0 | 0 | 0 |
| 6. Mixer | 0 | 0 | 0 | 0 |
| 7. Audio Modifier | 0 | 0 | 0 | 0 |
| 8. Control Modifier | 0 | 1 | 0 | 0 |
| 9. Logic | 0 | 0 | 0 | 0 |
| 10. Sequencer | 1 | 1 | 0 | 0 |
| **Total** | **6** | **20** | **0** | **5** |

## Critical findings — quick reference

These six are the items that would lead to incorrect implementation if the spec were used as-is. They should be addressed first in any follow-up fix pass.

1. **MasterOsc KBT** (`NORD_MODULAR_DESIGN.md:122`, `MODULE_LAYOUTS.md:73`) — described as a 0-2.0 knob; PDF p.7 confirms it's a binary on/off button.
2. **SpectralOsc KBT** (`NORD_MODULAR_DESIGN.md:167`, `MODULE_LAYOUTS.md:97`) — `Coarse/Fine/KBT: Standard` is ambiguous and implies OscA-style knob; PDF p.14 confirms it's a binary on/off button.
3. **Vocoder preset shift buttons** (`NORD_MODULAR_DESIGN.md:576`) — spec lists `+1 to +15`; PDF p.52 panel shows -2, -1, 0, +1, +2 plus Inv and Rnd.
4. **NoteSeqA gate toggle buttons** (`MODULE_LAYOUTS.md:580`) — layout claims `16 gate toggle buttons below` the pitch sliders; PDF p.90 panel shows only the pitch sliders. The "gate signal" referenced in PDF intro is the Gclk pulse output, not per-step gate buttons.
5. **NoteSeqB Snc placement** (`MODULE_LAYOUTS.md:585, 588`) — Snc output listed on Right Side; PDF p.92 panel shows Snc on Left Side alongside Clk/Rst.

(Items 1+2 each touch two spec files, accounting for 4 of the 6 critical line-locations in the per-group totals; items 3-5 each touch one location.)

## Notes for the fix pass

- The per-module page references in this report are PDF-page numbers (1-97), which differ from the original-manual page numbers shown in PDF page footers (offset = 92).
- Spec content describing material outside this PDF excerpt (Morphing, Variations, signal-type definitions, attenuator-type definitions) cannot be confirmed against this PDF and is marked Out-of-scope. Those sections are not necessarily wrong — they likely come from earlier chapters of the original manual that are not in the audit's source PDF.
- Several Layout discrepancies are visual-order differences (e.g., `[Mix Input] [Dest Buttons] [M] [Level]` vs `[Dest Buttons] [M] [Mix Input] [Level]`). They do not change behaviour but will affect any UI implementation that uses MODULE_LAYOUTS.md as a control-arrangement guide.
