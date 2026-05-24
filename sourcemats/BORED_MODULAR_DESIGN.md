# Bored Modular System Design Document

This document provides a detailed technical specification for all modules from the Bored Modular V3.0 system, intended as a reference for implementing similar modules in the `boredmodular` project. Sourced from the official Bored Modular V3.0 User Manual.

## General Conventions

### Signal Types
Four signal classes, each tied 1:1 to a connector colour. See "Connector Colors" below.

- **Bipolar (audio):** Range -64 to +64 units (or -1.0 to 1.0 normalized). Used for audio and bipolar modulation. Sampled at **96 kHz** when carried on an audio (red) connector.
- **Control (Unipolar or Bipolar):** Range 0 to +64 units, or -64 to +64 units (or 0 to ±64 / 0.0 to 1.0 normalized). Used for envelopes, velocity, LFOs, and general modulation. Sampled at **24 kHz**.
- **Logic:** High (+64 units / 1.0) or Low (0 units / 0.0). Used for gates, triggers, and clocks. Any signal crossing from <=0 to >0 triggers logic transitions. Sampled at **24 kHz**.
- **Slave (Gray):** Specialized high-resolution pitch/frequency control signals used between master and slave modules. Slave oscillators track 1:1 with master pitch; slave LFOs track 5 octaves below master pitch. Sampled at **24 kHz**.

### Connector Colors
Inputs are rendered as circles and outputs as squares (canonical convention; the current implementation uses circles for both — see SPEC_AUDIT_REPORT.md). Colour identifies signal type; sampling rate listed alongside.

- **Red:** Audio signals (Bipolar). **96 kHz** sampling.
- **Blue:** Control signals (Unipolar or Bipolar). **24 kHz** sampling.
- **Yellow:** Logic signals. **24 kHz** sampling.
- **Gray:** Slave control signals (master-slave pitch links). **24 kHz** sampling.

### Cable Conventions
- **Cable colour = source (output) connector colour.** The output's colour determines the cable's appearance. A cable can be re-coloured manually after creation.
- **Cross-type drops are allowed.** An audio (red) output may be patched into a control (blue) input or vice versa; the system applies the source signal at the destination without conversion damage. Drops that are not meaningful at all (e.g. into a non-routable target) refuse with no cable-with-dot cursor and produce no connection.
- **Branch connections** (one output → many inputs) are supported.
- **Serial input→input chains** are allowed provided the chain head connects to an output. The chain renders in **white** to indicate it carries no signal flow on its own (presentation only); when the head connects to an output, the chain inherits the source colour.
- **Highlight:** click-hold a connector to highlight the full cable chain attached to it.

### Bandwidth Considerations
Modulation inputs come in two bandwidth classes:
- **Audio-rate modulation inputs:** run at the full **96 kHz** audio bandwidth (e.g. `OscA.FMA`, `FilterF.FreqMod`).
- **Control-rate modulation inputs:** run at **24 kHz** (most filters' frequency/resonance mod inputs, and most non-audio-FM mod inputs).

Per-module bandwidth tagging is deferred to a future audit batch.

### Modulation Input Attenuator Types
- **Type I (Linear):** Range 0-127. 0 = off, 64 = half, 127 = full. Used for pulse-width and general-purpose modulation.
- **Type II (Exponential):** Range 0-127. Provides finer control at low modulation amounts (64 = less than half). Used for pitch and FM modulation.
- **Type III (Bipolar):** Range 0-127. 0 = off, 64 = unaffected, 127 = 2× amplification with bidirectional polarity. Used for filter frequency modulation.

#### Maximum modulation
- Most parameters accept **±64 units** of total modulation (sum of all modulation inputs on the same parameter).
- **Filter frequency** parameters accept **±128 units**.
- If summed modulation would exceed the limit, it is clamped at the limit.

### Module Limits
- Max 254 modules per patch (127 poly, 127 common).
- Keyboard, KeyboardPatch, MIDIGlobal, AudioIn: max one per voice area.
- PolyAreaIn: one per patch, common voice area only.

## 0. System Features

### 0.1 Morphing
Bored Modular allows assigning multiple parameters to one of four "Morph Groups". This enables a single control source to sweep many parameters simultaneously between their current value and a "morphed" value.
- **Morph Groups:** 4 per patch.
- **Sources:** Mod Wheel, Velocity, Aftertouch, Keyboard Note.
- **Implementation:** Each parameter stores an offset/target value for each morph group.

### 0.2 Variations
Each patch can store up to 8 Variations. A variation captures the settings of all knobs, buttons, and selectors in the patch.
- **Switching:** Instant switching between variations allows for drastic timbre changes within a single patch.

---

## 1. In/Out Group

### 1.1 Keyboard
Provides per-voice keyboard/MIDI signals.
- **Note (Output, Blue):** Bipolar pitch signal. E4 (MIDI 64) = 0 units. C-1 = -64, G9 = +63. Includes pitch bend data.
- **Gate (Output, Yellow):** Logic high when key pressed. Respects sustain pedal.
- **Vel (Output, Blue):** Unipolar note-on velocity. Linear response.
- **Rel Vel (Output, Blue):** Unipolar release velocity.

### 1.2 KeyboardPatch
Global keyboard signals affecting all voices (latest-note priority).
- **Latest Note (Output, Blue):** Pitch of most recent note. Bipolar, same range as Keyboard Note.
- **Patch Gate (Output, Yellow):** Logic high when at least one key is pressed. Single-trigger behavior.
- **Latest Vel On (Output, Blue):** Velocity of latest note. Unipolar.
- **Latest Rel Vel (Output, Blue):** Release velocity of latest note. Unipolar.

### 1.3 MIDIGlobal
Generates timing and status signals from MIDI clock.
- **Clock (Output, Yellow):** 24 PPQN. May continue even when external sequencer stopped.
- **Sync (Output, Yellow):** Pulse at Global Sync rate (configurable). Essential for sequencer synchronization.
- **Active (Output, Yellow):** High on MIDI Start/Continue, low on MIDI Stop.

### 1.4 AudioIn
Routes external line-level audio into the patch. Two channels (L/R).
- **L, R (Outputs, Red):** Bipolar audio from physical inputs. Input meters show level; 0dB = headroom limit.
- **Note:** Low-level input signals should be amplified externally, not digitally, for best quality.

### 1.5 PolyAreaIn
Routes audio from Poly Voice Area to Common Voice Area. Sum of all voices.
- **+6dB (Button):** Amplify input by 6dB.
- **L, R (Outputs, Red):** Bipolar. Volume depends on number of simultaneous notes.
- **Limit:** One per patch, Common Voice Area only.

### 1.6 Output (1 Output)
Routes one signal to a mix bus.
- **Mix (Input, Red):** Audio input.
- **Dest (Selector):** Mix Bus 1-4, CVA L, CVA R.
- **M (Button):** Mute toggle.
- **Level (Knob):** Output attenuation.

### 1.7 Output (2 Outputs)
Routes two signals as a stereo pair.
- **Mix Bus L, R (Inputs, Red):** Stereo audio inputs.
- **Dest (Selector):** Bus pair 1/2, 3/4, or CVA.
- **M (Button):** Mute toggle.
- **Level (Knob):** Output attenuation.

### 1.8 Output (4 Outputs)
Routes four separate signals to one mix bus each.
- **Mix Bus 1-4 (Inputs, Red):** Four audio inputs, one per bus.
- **Level (Knob):** Master output attenuation.

### 1.9 NoteDetect
Detects a specific MIDI note and generates gate/velocity signals. Global (affects all voices). Not affected by polyphony limits.
- **Note (Knob):** Select note to detect. Range: C-1 to G9.
- **Gate (Output, Yellow):** Logic high when detected note is held.
- **V (Output, Blue):** Unipolar velocity.
- **R (Output, Blue):** Unipolar release velocity.

### 1.10 KeybSplit
Keyboard range filter for creating split sounds within one patch.
- **Lower, Upper (Knobs):** Set key range limits. Range: C-1 to G9.
- **Note (Input, Blue):** Note signal input.
- **Gate (Input, Yellow):** Gate signal input (must be high to activate).
- **Vel (Input, Blue):** Velocity input.
- **Note (Output, Blue):** Bipolar pitch (passed through if in range).
- **Gate (Output, Yellow):** Logic gate (passed through if in range).
- **Vel (Output, Blue):** Unipolar velocity (passed through if in range).

---

## 2. Oscillator Group

Two types: **Master oscillators** (more features, more DSP load, provide slave outputs) and **Slave oscillators** (lighter, controlled by masters). Slaves without a master connection produce a fixed pitch starting at E4 (329.6 Hz).

### 2.1 MasterOsc
Does not generate audio — controls slave oscillators only. Saves DSP power.
- **Coarse (Knob):** Semitone tuning. Range: C-1 to G9.
- **Fine (Knob):** +/- half semitone, 128 steps.
- **KBT (Button):** On/Off keyboard tracking.
- **Pitch Mod x2 (Inputs, Blue):** Two pitch modulation inputs [Attenuator Type II].
- **Slv (Output, Gray):** Slave control output.
- **Display:** Hz or Note name.

### 2.2 OscA
Full-featured master oscillator with sync and pulse width modulation.
- **Waveforms:** Square/Pulse, Sawtooth, Triangle, Sine (4 selectors).
- **Coarse (Knob):** C-1 to G9.
- **Fine (Knob):** +/- half semitone, 128 steps.
- **KBT (Knob):** Off to 2.0.
- **PWidth (Knob):** Pulse width 1%-99%.
- **Pitch Mod x2 (Inputs, Red):** [Attenuator Type II].
- **FMA (Input, Red):** Linear FM input [Attenuator Type II].
- **Sync (Input, Red):** Hard sync — restarts waveform when input crosses >0.
- **PWidth Mod (Input, Red):** PWM input [Attenuator Type I].
- **Slv (Output, Gray):** Slave control.
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar audio.

### 2.3 OscB
Master oscillator with FM and PWM, no sync.
- **Waveforms:** Square/Pulse, Sawtooth, Triangle, Sine.
- **Coarse/Fine/KBT:** Same as OscA.
- **Pitch Mod x2 (Inputs, Blue):** [Attenuator Type II].
- **FMA (Input, Red):** [Attenuator Type II].
- **PWidth Mod (Input, Blue):** PWM from initial width of 50% [Attenuator Type I].
- **Slv (Output, Gray):** Slave control.
- **M (Button):** Mute. Also, clicking selected waveform button mutes output.
- **Out (Output, Red):** Bipolar.

### 2.4 OscC
Sine-only master oscillator with AM and FM.
- **Coarse/Fine (Knobs):** Standard tuning.
- **KBT (Button):** On/Off keyboard tracking.
- **Pitch Mod (Input, Red):** Single [Attenuator Type II].
- **AM (Input, Red):** Amplitude modulation, fixed 1:1 ratio.
- **FMA (Input, Red):** [Attenuator Type II].
- **Slv (Output, Gray):** Slave control.
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

### 2.5 SpectralOsc
Additive-style oscillator generating overtones from synced noise.
- **Coarse/Fine (Knobs):** Standard.
- **KBT (Button):** On/Off keyboard tracking.
- **Spectral Shape (Knob + Blue Mod Input):** Controls overtone amount. Mod input with attenuator.
- **Partials (Buttons):** All (odd+even) or Odd only.
- **Pitch Mod x2 (Inputs, Blue):** [Attenuator Type II].
- **FMA (Input, Red):** [Attenuator Type II].
- **Slv (Output, Gray):** Slave control.
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

### 2.6 FormantOsc
Generates vocal-sounding waveforms with non-transposed body resonance spectrum.
- **Coarse/Fine (Knobs):** Standard.
- **KBT (Button):** On/Off.
- **Timbre (Knob + Display):** 1-127 variations plus Random.
- **Timbre Mod (Input, Blue):** External timbre control [Attenuator Type I].
- **Pitch Mod x2 (Inputs, Blue):** [Attenuator Type II].
- **Slv (Output, Gray):** Slave control.
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

### 2.7 OscSlvA
4-waveform slave with sync, FMA, and AM.
- **Waveforms:** Sine, Triangle, Sawtooth, Square/Pulse.
- **Mst (Input, Gray):** Master pitch control.
- **Partials (Selector):** Transposition ratio 1:32 to 32:1.
- **Detune (Knob):** Semitone steps relative to master.
- **Fine (Knob):** +/- half semitone, 128 steps.
- **Sync (Input, Red):** Hard sync.
- **FMA (Input, Red):** [Attenuator Type II].
- **AM (Input, Red):** Fixed 1:1 ratio.
- **Display:** Semitones, Hz, or Ratio.
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

### 2.8 OscSlvB
Pulse/Square slave with PWM.
- **Mst (Input, Gray):** Master pitch control.
- **Partials/Detune/Fine:** Same as OscSlvA.
- **PW (Knob):** Initial pulse width 1%-99%.
- **PW Mod (Input, Red):** [Attenuator Type I].
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

### 2.9 OscSlvC
Sawtooth slave with FMA.
- **Mst (Input, Gray):** Master pitch control.
- **Partials/Detune/Fine:** Same as OscSlvA.
- **FMA (Input, Red):** [Attenuator Type II].
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

### 2.10 OscSlvD
Triangle slave with FMA.
- **Mst (Input, Gray):** Master pitch control.
- **Partials/Detune/Fine:** Same as OscSlvA.
- **FMA (Input, Red):** [Attenuator Type II].
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

### 2.11 OscSlvE
Sine slave with FMA and AM.
- **Mst (Input, Gray):** Master pitch control.
- **Partials/Detune/Fine:** Same as OscSlvA.
- **FMA (Input, Red):** [Attenuator Type II].
- **AM (Input, Red):** Fixed 1:1 ratio.
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

### 2.12 OscSineBank
Six independent sine oscillators in one module. Individually tuned and AM-modulated.
- **Mst (Input, Gray):** Master pitch control for all six.
- **Sync (Input, Red):** Sync all six oscillators.
- **Mix In (Input, Red):** Mix external audio into the output.
- **Partial Selectors x6:** Ratio 1:32 to 32:1 per oscillator.
- **Tune x6 (Knobs):** Semitone steps per oscillator.
- **Fine Tune x6 (Knobs):** 1/128 semitone per oscillator.
- **Level x6 (Knobs):** Individual output levels.
- **AM x6 (Inputs, Red):** Per-oscillator AM, fixed 1:1.
- **M x6 (Buttons):** Per-oscillator mute.
- **Out (Output, Red):** Bipolar (summed).

### 2.13 OscSlvFM
Sine slave optimized for classic FM synthesis.
- **Mst (Input, Gray):** Master pitch control.
- **Partials/Detune/Fine:** Same as OscSlvA.
- **Sync (Input, Red):** Hard sync.
- **FMB (Input, Red):** FM input producing classic FM timbres [Attenuator Type II].
- **-3 Oct (Button):** Transpose 3 octaves below master.
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

### 2.14 Noise
Noise generator with color control.
- **White/Colored (Knob):** Blends from white noise to colored (less high-frequency energy).
- **Out (Output, Red):** Bipolar.

### 2.15 PercOsc
Percussive oscillator with click and punch.
- **Pitch (Knob):** Coarse pitch. C-1 to G9.
- **Fine (Knob):** +/- half semitone.
- **Decay (Knob):** Decay time.
- **Click (Knob):** Click amount on attack.
- **Punch (Button):** Adds distinct attack character.
- **Amp (Input, Red):** Amplitude modulation, fixed 1:1.
- **Trig (Input, Red):** Trigger input (red = also accepts audio rate).
- **Pitch Mod (Input, Blue):** [Attenuator Type II].
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

### 2.16 DrumSynth
Integrated analog drum synthesis module.
- **Trig (Input, Yellow):** Trigger input. LED indicates trig received.
- **Vel Mod (Input, Blue):** Velocity control. Affects all parameters proportionally.
- **Pitch Mod (Input, Blue):** External pitch control.
- **Oscillator Section:**
  - Master Pitch (Knob + Display): 20-784 Hz.
  - Slave Ratio (Knob + Display): 1:1 to 6.26.
  - Tune, Decay (0.5ms-45s), Level for each oscillator.
- **Noise Filter Section:**
  - Freq (Knob): Cutoff 10 Hz to 15.8 kHz.
  - Res (Knob): Resonance amount.
  - Sweep (Knob): Cutoff sweep range 0-5 octaves (high → set freq).
  - Decay (Knob): Noise sweep/decay time. 0.5ms to 45s.
  - HP/BP/LP (Buttons): Filter mode selector.
- **Bend Section:**
  - Amt (Knob): Pitch bend range 0-5 octaves (always sweeps down).
  - Dcy (Knob): Bend rate. 0.5ms to 45s.
- **Click (Knob):** Attack click amount.
- **Noise (Knob):** Noise level in mix.
- **Preset (Selector + Display):** Factory presets.
- **M (Button):** Mute.
- **Out (Output, Red):** Bipolar.

---

## 3. LFO Group

Two types: **Master LFOs** (more features, slave output) and **Slave LFOs** (lighter, rate controlled by masters). Master oscillators connected to slave LFOs: LFO tracks 5 octaves below oscillator pitch. Master LFOs connected to slave oscillators: oscillator tracks 5 octaves above LFO rate.

### 3.1 LFOA
Full-featured master LFO with 5 waveforms, phase control, and rate modulation.
- **Waveforms:** Sine, Triangle, Sawtooth, Square, Random (5 selectors).
- **Rate (Knob + Display):** 699 s/cycle to 392 Hz.
- **Hi/Lo/Sub (Buttons):** Range selector. Hi: 0.26-392 Hz. Lo: 0.02-24.4 Hz. Sub: 699s-5.46s per cycle.
- **Phase (Knob + Display):** Starting phase. -180 to +177 degrees.
- **KBT (Knob):** Keyboard tracking. Off to 2.0 (doubles rate per octave at "Key").
- **Mono (Button):** Sync across all voices in polyphonic patches.
- **Rate Mod (Input, Blue):** [Attenuator Type II].
- **Rst (Input, Yellow):** Restart on positive edge.
- **Slv (Output, Gray):** Slave control.
- **M (Button):** Mute.
- **Out (Output, Blue):** Bipolar. LED indicates rate.

### 3.2 LFOB
Master LFO producing pulse/square wave with pulse width modulation.
- **Rate/Display/Hi/Lo/Sub/Phase/KBT/Mono/Rst:** Same as LFOA.
- **Rate Mod (Input, Blue):** [Attenuator Type II].
- **PW (Knob):** Initial pulse width 1%-99%.
- **PW Mod (Input, Blue):** [Attenuator Type I].
- **Slv (Output, Gray):** Slave control.
- **Out (Output, Blue):** Bipolar. LED indicates rate.

### 3.3 LFOC
Compact master LFO with 4 waveforms. No phase, no KBT, no restart.
- **Waveforms:** 4 selectable (Sine, Triangle, Sawtooth, Square).
- **Rate (Knob + Display):** Same range as LFOA.
- **Hi/Lo/Sub (Buttons):** Range selector.
- **Rate Mod (Input, Blue):** [Attenuator Type II].
- **Mono (Button):** Sync across voices.
- **Slv (Output, Gray):** Slave control.
- **M (Button):** Mute.
- **Out (Output, Blue):** Bipolar. LED indicates rate.

### 3.4 LFOSlvA
5-waveform slave LFO with phase and restart.
- **Waveforms:** Sine, Triangle, Sawtooth, Square, Random.
- **Mst (Input, Gray):** Master rate control.
- **Rate (Knob + Display):** 0.025 to 38.05x master rate, or 62.9 s/cycle to 24.4 Hz.
- **Phase (Knob):** -180 to +177 degrees.
- **Mono (Button):** Sync across voices.
- **Rst (Input, Yellow):** Restart on positive edge.
- **M (Button):** Mute.
- **Out (Output, Blue):** Bipolar. LED indicates rate.

### 3.5 LFOSlvB
Sawtooth slave LFO. Minimal controls.
- **Mst (Input, Gray):** Master rate control.
- **Rate (Knob + Display):** 0.025 to 38.05x master rate.
- **Out (Output, Blue):** Bipolar. LED indicates rate.

### 3.6 LFOSlvC
Sine slave LFO. Minimal controls.
- **Mst (Input, Gray):** Master rate control.
- **Rate (Knob + Display):** 0.025 to 38.05x master rate.
- **Out (Output, Blue):** Bipolar. LED indicates rate.

### 3.7 LFOSlvD
Square slave LFO. Minimal controls.
- **Mst (Input, Gray):** Master rate control.
- **Rate (Knob + Display):** 0.025 to 38.05x master rate.
- **Out (Output, Blue):** Bipolar. LED indicates rate.

### 3.8 LFOSlvE
Triangle slave LFO. Minimal controls.
- **Mst (Input, Gray):** Master rate control.
- **Rate (Knob + Display):** 0.025 to 38.05x master rate.
- **Out (Output, Blue):** Bipolar. LED indicates rate.

### 3.9 ClkGen
Internal clock generator (independent of MIDI clock).
- **Rate (Knob + Display):** 24 to 214 BPM.
- **On/Off (Button):** Start/stop clock.
- **Reset (Input, Yellow):** Restart on positive edge. Triggers Sync output.
- **Slv (Output, Gray):** Slave rate control. 1 BPM = 1 Hz on connected slave LFO at 1:1 ratio.
- **24 Pulses/B (Output, Yellow):** 24 PPQN. Logic.
- **4 Pulses/B (Output, Yellow):** 4 pulses per beat. Logic.
- **Sync (Output, Yellow):** Pulse on start/reset. Logic.

### 3.10 ClkRndGen
Clocked random step generator. Outputs new random value on each clock pulse.
- **Mono (Button):** Sync across voices.
- **Col (Button):** Color of random signal. Colored = smoother transitions; White = fully random.
- **Clk (Input, Yellow):** Clock input.
- **Out (Output, Blue):** Bipolar random.

### 3.11 RndStepGen
Random step generator (slave-type). Generates colored random steps at steady rate.
- **Mst (Input, Gray):** Master rate control.
- **Rate (Knob + Display):** 0.025 to 38.05x master rate.
- **Out (Output, Blue):** Bipolar. Colored (smooth) random.

### 3.12 RandomGen
Slave LFO generating smooth random control signal.
- **Mst (Input, Gray):** Master rate control.
- **Rate (Knob + Display):** 0.025 to 38.05x master rate.
- **Out (Output, Blue):** Bipolar. Smooth random.

### 3.13 RndPulsGen
Random pulse generator producing random logic pulses.
- **Density (Knob):** Average frequency and pulse width. Low = few long pulses; High = many short pulses.
- **Out (Output, Blue):** Bipolar random pulses.

### 3.14 PatternGen
Clocked pattern generator. 16384 patterns (128 banks x 128 patterns) with selectable length.
- **Clk (Input, Yellow):** Advances one step per pulse.
- **Rst (Input, Yellow):** Restart to step 1 (on next clock pulse).
- **Pattern (Knob + Blue Mod Input + Display):** Pattern 0-127. External control input.
- **Bank (Knob + Blue Mod Input + Display):** Bank 0-127. External control input.
- **Step (Selector + Display):** Number of steps 1-128.
- **Mono (Button):** Sync across voices.
- **Delta (Button):** High or Low. High = large level differences between steps.
- **Out (Output, Blue):** Unipolar.

---

## 4. Envelope Group

Envelopes output 0 to +64 units (unipolar) unless inverted. All have built-in envelope-controlled amplifier (audio input → envelope-shaped audio output) in addition to the control signal output.

### 4.1 ADSR-Env
Standard 4-stage envelope with curve selection and built-in VCA.
- **Attack Curve (Buttons):** Log, Linear, Exp (3 buttons, not morphable).
- **A (Knob + Display):** Attack time. 0.5ms to 45s.
- **D (Knob + Display):** Decay time. 0.5ms to 45s. Exponential.
- **S (Knob + Display):** Sustain level. 0-64 units.
- **R (Knob + Display):** Release time. 0.5ms to 45s. Exponential.
- **Invert (Button):** Inverts control signal output.
- **Gate (Input, Yellow):** Starts and holds envelope. LED indicates gate.
- **Retrig (Input, Yellow):** Restarts attack from current level (requires gate).
- **Amp (Input, Blue):** Overall amplitude modulation.
- **Input (Input, Red):** Audio into built-in VCA.
- **Env Output (Output, Blue):** Unipolar control signal.
- **Output (Output, Red):** Bipolar audio from VCA.
- **Graph:** Visual envelope shape display.

### 4.2 AD-Env
Two-stage attack-decay envelope. Gate or Trig mode.
- **Gate/Trig (Button):** Gate mode: envelope follows gate. Trig mode: envelope always completes full cycle.
- **Attack (Knob + Display):** 0.5ms to 45s. Linear.
- **Dcy (Knob + Display):** 0.5ms to 45s. Exponential.
- **Gate/Trig (Input, Yellow):** Start input. LED indicates signal.
- **Amp (Input, Blue):** Overall amplitude modulation.
- **Input (Input, Red):** Audio into built-in VCA.
- **Env Output (Output, Blue):** Unipolar.
- **Output (Output, Red):** Bipolar audio from VCA.

### 4.3 Mod-Env
ADSR envelope with external control of all four parameters.
- **A/D/S/R (Knobs + Displays):** Same ranges as ADSR-Env.
- **A/D/S/R Control Inputs x4 (Inputs, Blue):** External modulation of each parameter [Attenuator Type I]. A/D/R: positive shortens, negative lengthens. S: direct level control.
- **Invert (Button):** Inverts control signal.
- **Gate (Input, Yellow):** Gate input. LED.
- **Retrig (Input, Yellow):** Retrigger (requires gate).
- **Amp (Input, Blue):** Overall amplitude modulation.
- **Input (Input, Red):** Audio into VCA.
- **Env Output (Output, Blue):** Unipolar.
- **Output (Output, Red):** Bipolar audio from VCA.

### 4.4 AHD-Env
Attack-Hold-Decay envelope (trig-only, always completes full cycle).
- **A (Knob + Display):** Attack time. 0.5ms to 45s. Linear.
- **H (Knob + Display):** Hold time at +64. 0.5ms to 45s.
- **D (Knob + Display):** Decay time. 0.5ms to 45s. Exponential.
- **A/H/D Control Inputs x3 (Inputs, Blue):** [Attenuator Type I]. A/D: positive shortens. H: positive lengthens.
- **Trig (Input, Yellow):** Trigger input. LED.
- **Amp (Input, Blue):** Overall amplitude modulation.
- **Input (Input, Red):** Audio into VCA.
- **Env Output (Output, Blue):** Unipolar.
- **Output (Output, Red):** Bipolar audio from VCA.

### 4.5 Multi-Env
5-segment time/level envelope with selectable sustain point.
- **Curve (Buttons):** Bipolar Linear, Unipolar Exponential, Unipolar Linear. Note: only attack segments are affected by lin/exp choice; decay segments always exponential.
- **L1-L4 (Knobs + Displays):** Level of each segment. -64 to +64 (bipolar) or 0 to +64 (unipolar).
- **T1-T5 (Knobs + Displays):** Time between levels + final release. 0.5ms to 45s each.
- **Sustain (Selector):** Which level to sustain during gate. None, L1, L2, L3, or L4.
- **Gate (Input, Yellow):** Gate input. LED.
- **Amp (Input, Blue):** Overall amplitude.
- **Input (Input, Red):** Audio into VCA.
- **Env Output (Output, Blue):** Unipolar or Bipolar (depends on curve mode).
- **Output (Output, Red):** Bipolar audio from VCA.
- **Graph:** Shows envelope shape with sustain indicator.

### 4.6 EnvFollower
Extracts amplitude envelope from incoming signal.
- **Atk (Knob + Display):** Attack tracking time. 0.5ms to 767ms.
- **Rel (Knob + Display):** Release tracking time. 40ms to 3.26s.
- **Input (Input, Red):** Audio signal to track.
- **Output (Output, Blue):** Unipolar envelope signal.

---

## 5. Filter Group

### 5.1 FilterA
Static non-resonant lowpass filter, 6 dB/octave.
- **Freq (Knob + Display):** Cutoff frequency. 12 Hz to 20 kHz.
- **Input (Input, Red):** Audio in.
- **Output (Output, Red):** Bipolar.

### 5.2 FilterB
Static non-resonant highpass filter, 6 dB/octave.
- **Freq (Knob + Display):** Cutoff frequency. 12 Hz to 20 kHz.
- **Input (Input, Red):** Audio in.
- **Output (Output, Red):** Bipolar.

### 5.3 FilterC
Static multimode filter, 12 dB/octave with resonance. Three simultaneous outputs.
- **Freq (Knob + Display):** Cutoff. 10 Hz to 15.8 kHz (E-1 to B9).
- **Res (Knob + Display):** Resonance. 0-127. Self-oscillates at 127.
- **GC (Button):** Gain compensation — reduces gain at high resonance.
- **Input (Input, Red):** Audio in.
- **HP (Output, Red):** Highpass. Bipolar.
- **BP (Output, Red):** Bandpass. Bipolar.
- **LP (Output, Red):** Lowpass. Bipolar.

### 5.4 FilterD
Dynamic multimode filter, 12 dB/octave. Like FilterC but with frequency modulation and KBT.
- **Freq (Knob + Display):** Cutoff. 10 Hz to 15.8 kHz.
- **Freq Mod (Input, Blue):** Cutoff modulation [Attenuator Type III].
- **KBT (Knob):** Keyboard tracking. Off to 2.0.
- **Res (Knob + Display):** 0-127. Self-oscillates at 127.
- **Input (Input, Red):** Audio in.
- **HP (Output, Red):** Highpass. Bipolar.
- **BP (Output, Red):** Bandpass. Bipolar.
- **LP (Output, Red):** Lowpass. Bipolar.

### 5.5 FilterE
Dynamic synthesizer filter with selectable slope and mode. Most versatile filter.
- **Freq (Knob + Display):** Cutoff/center. 10 Hz to 15.8 kHz.
- **Freq Mod x2 (Inputs, Red):** Two cutoff mod inputs [Attenuator Type III].
- **KBT (Knob):** Keyboard tracking. Off to 2.0.
- **Filter Selector (Buttons):** HP, BP, LP, BR (band reject). Not morphable.
- **GC (Button):** Gain compensation.
- **Res (Knob + Display):** 0-127. Self-oscillates at 127. In BR mode, controls rejection bandwidth.
- **Res Mod (Input, Red):** Resonance modulation [Attenuator Type I].
- **dB/Oct (Button):** 12 or 24 dB/octave slope.
- **B (Button):** Bypass.
- **Input (Input, Red):** Audio in.
- **Output (Output, Red):** Bipolar.
- **Graph:** Filter characteristic display.

### 5.6 FilterF
Classic analog-style lowpass filter with selectable slope.
- **Freq (Knob + Display):** Cutoff. 10 Hz to 15.8 kHz.
- **Freq Mod x2 (Inputs, Blue):** Two cutoff mod inputs [Attenuator Type III].
- **KBT (Knob):** Keyboard tracking. Off to 2.0.
- **Res (Knob + Display):** 0-127. Self-oscillates at 127.
- **dB/Oct (Button):** 12, 18, or 24 dB/octave.
- **B (Button):** Bypass.
- **Input (Input, Red):** Audio in.
- **Output (Output, Red):** Bipolar.
- **Graph:** Filter characteristic display.

### 5.7 VocalFilter
Simulates vocal tract with selectable vowels and morphing between them.
- **Res (Knob):** Vowel peak emphasis. More resonance = clearer vowels.
- **Freq (Knob):** Center frequency offset. Like pitch-shifting a voice.
- **Freq Mod (Input, Blue):** Center frequency modulation [Attenuator Type II].
- **Vowel Selectors x3 (Buttons):** Select up to 3 vowels. Presets: A, E, I, O, U, Y, AA, AE, OE.
- **Vowel Navigator (Knob):** Morph between selected vowels (transformation, not mix).
- **Vowel Mod (Input, Blue):** Vowel navigation modulation [Attenuator Type I].
- **Input (Input, Red):** Audio in. With attenuation knob.
- **Output (Output, Red):** Bipolar.

### 5.8 Vocoder
16-band vocoder with reroutable analysis bands.
- **Analysis Input (Input, Red):** Modulator signal (e.g., voice). Upper left.
- **HF Emphasis (Button):** Boost high frequencies in analysis signal.
- **Mon (Button):** Bypass modulator to output for monitoring.
- **Reroute Buttons x16:** Remap each synthesis band to any analysis band.
- **Presets:** Shift buttons (-2 to +2 steps), Inv (reverse routing), Rnd (random routing).
- **Output Gain (Knob):** 0.25x to 4.0x input level.
- **Synth Input (Input, Red):** Carrier signal. Lower right.
- **Out (Output, Red):** Bipolar.
- **Graph:** Routing visualization.

### 5.9 FilterBank
14-band static filter with per-band attenuation. Good for body resonance/formant simulation.
- **Band Sliders x14:** Attenuation per frequency band. Center frequencies displayed above each slider.
- **Presets:** Min (max attenuation), Max (min attenuation).
- **B (Button):** Bypass.
- **Input (Input, Red):** Audio in.
- **Output (Output, Red):** Bipolar.

### 5.10 EqMid
Parametric mid EQ with center frequency, gain, and bandwidth.
- **Freq (Knob + Display):** Center frequency. 20 Hz to 16 kHz.
- **Gain (Knob + Display):** -18 to +18 dB.
- **BW (Knob + Display):** Bandwidth. 2 to 0.02 octaves.
- **B (Button):** Bypass.
- **Input (Input, Red):** Audio in [Attenuator Type I].
- **Output (Output, Red):** Bipolar. Multi-color level LED.
- **Graph:** EQ curve display.

### 5.11 EqShelving
Hi/Lo shelving EQ.
- **Freq (Knob + Display):** Cutoff frequency. 20 Hz to 16 kHz.
- **Gain (Knob + Display):** -18 to +18 dB.
- **Hi/Lo (Button):** Select which frequency band to affect.
- **Bypass (Button):** Disable EQ.
- **Input (Input, Red):** Audio in [Attenuator Type I].
- **Output (Output, Red):** Bipolar. Multi-color level LED.
- **Graph:** EQ curve display.

---

## 6. Mixer Group

Mixers work with audio and control signals. High or amplified inputs may distort.

### 6.1 3 Inputs Mixer
Three inputs, one output.
- **Inputs x3 (Inputs, Red):** Each with attenuation knob [Type I].
- **Output (Output, Red):** Bipolar.

### 6.2 8 Inputs Mixer
Eight inputs, one output.
- **Inputs x8 (Inputs, Red):** Each with attenuation knob [Type I]. Default attenuation = 100.
- **-6dB (Button):** Global -6dB cut to prevent distortion.
- **Output (Output, Red):** Bipolar. Multi-color level LED.

### 6.3 GainControl (VCA)
Voltage-controlled amplifier. Can function as ring/amplitude modulator.
- **Control (Input, Red):** Modulator signal. 0 units = closed, +64 = fully open, -64 = inverted polarity.
- **Unipolar (Button):** Converts bipolar control to unipolar (divides by 2, adds +32 bias).
- **Input (Input, Red):** Carrier/signal to modulate.
- **Output (Output, Red):** Bipolar.
- **Note:** With Unipolar off = ring modulator behavior. With Unipolar on = amplitude modulator.

### 6.4 X-Fade
Crossfader with modulation.
- **1/2 (Knob):** Manual crossfade position. Center = equal mix.
- **X-Fade Mod (Input, Red):** Crossfade modulation [Attenuator Type I].
- **Input 1, 2 (Inputs, Red):** Audio inputs.
- **Output (Output, Red):** Bipolar.

### 6.5 Pan
Stereo panner.
- **L/R (Knob):** Pan position. Center = equal.
- **Pan Mod (Input, Red):** Pan modulation [Attenuator Type I].
- **Input (Input, Red):** Mono audio in.
- **L (Output, Red):** Bipolar.
- **R (Output, Red):** Bipolar.

### 6.6 1to2Fade
One input faded between two outputs.
- **Fade (Knob):** Fade position. 12 o'clock = both outputs silent.
- **Input (Input, Red):** Audio in.
- **Output 1, 2 (Outputs, Red):** Bipolar.

### 6.7 2to1Fade
Two inputs faded to one output.
- **Fade (Knob):** Fade position. 12 o'clock = output silent.
- **Input 1, 2 (Inputs, Red):** Audio ins.
- **Output (Output, Red):** Bipolar.

### 6.8 LevMult
Signal attenuator/inverter with fixed gain control.
- **Uni (Button):** Unipolar or Bipolar mode.
- **Gain (Knob + Display):** -127 to +127 (bipolar) or 0 to 127 (unipolar). +127 = unity gain. Negative = 180° phase shift.
- **Input (Input, Red):** Signal in.
- **Output (Output, Red):** Bipolar.

### 6.9 LevAdd
Adds or subtracts a fixed offset (DC bias) to a signal.
- **Uni (Button):** Unipolar or Bipolar mode.
- **Offset (Knob + Display):** -64 to +64 (bipolar) or 0 to +64 (unipolar).
- **Input (Input, Red):** Signal in.
- **Output (Output, Red):** Bipolar.

### 6.10 OnOff
Simple on/off switch. With no input patched, outputs 0 (Off) or +64 (On).
- **On (Button):** Pass signal through or mute.
- **Input (Input, Red):** Audio in.
- **Output (Output, Red):** Signal type depends on input.

### 6.11 4-1Switch
Routes one of four inputs to a single output.
- **Inputs x4 (Inputs, Red):** Each with attenuation knob [Type I].
- **Input Selector (Buttons):** Selects which input routes to output.
- **M (Button):** Mute output.
- **Output (Output, Red):** Bipolar.

### 6.12 1-4Switch
Routes a single input to one of four outputs.
- **Input (Input, Red):** Audio in [Attenuator Type I].
- **Output Selector (Buttons):** Selects which output receives signal.
- **M (Button):** Mute all outputs.
- **Outputs x4 (Outputs, Red):** Bipolar.

### 6.13 Amplifier
Fixed gain/attenuation module.
- **Amplification (Knob + Display):** 0.25x to 4.0x input level.
- **Input (Input, Red):** Audio in.
- **Output (Output, Red):** Bipolar.

---

## 7. Audio Modifier Group

### 7.1 Clip
Digital distortion by clipping signal peaks.
- **Sym (Button):** Off = clip positive peaks only. On = clip both positive and negative.
- **Clip (Knob):** Initial clip limit(s).
- **Mod (Input, Red):** Clip level modulation [Attenuator Type I].
- **In (Input, Red):** Audio in.
- **Out (Output, Red):** Bipolar.
- **Graph:** Transfer function display.

### 7.2 Overdrive
Warm distortion by amplifying signal into headroom.
- **Overdrive (Knob):** Drive amount.
- **Mod (Input, Blue):** Drive modulation [Attenuator Type I].
- **In (Input, Red):** Audio in.
- **Out (Output, Red):** Bipolar.
- **Graph:** Transfer function display.

### 7.3 WaveWrapper
Folds signal when it hits headroom instead of clipping. Creates FM-like overtones.
- **Wrap (Knob):** Wrap amount.
- **Mod (Input, Red):** Wrap modulation [Attenuator Type I].
- **In (Input, Red):** Audio in.
- **Out (Output, Red):** Bipolar.
- **Graph:** Transfer function display.

### 7.4 Quantizer
Bit-resolution reducer. Transforms smooth signals to jagged/lo-fi.
- **Bits (Selector + Display):** Off, 12 down to 1 bit.
- **In (Input, Red):** Audio in.
- **Out (Output, Red):** Bipolar.

### 7.5 Delay (Short)
Short delay for flanger/phaser effects. NOT a long echo delay.
- **Time (Knob + Display):** 0 to 2.65 ms.
- **Time Mod (Input, Blue):** Delay time modulation [Attenuator Type I].
- **In (Input, Red):** Audio in.
- **2.65ms (Output, Red):** Fixed max-delay output. Bipolar.
- **Out (Output, Red):** Variable delay output. Bipolar.

### 7.6 Sample&Hold
Samples input value on each trigger.
- **Trig (Input, Yellow):** Sampling trigger. Samples on positive edge.
- **Input (Input, Red):** Signal to sample.
- **Out (Output, Red):** Bipolar. Holds last sampled value.
- **Classic use:** Noise → input, LFO → trig = random stepped modulation.

### 7.7 Diode
Converts bipolar signal to unipolar. Three modes.
- **Selector (3 buttons):** Bypass / Half (discard negatives) / Full (mirror negatives to positive).
- **In (Input, Red):** Audio in.
- **Out (Output, Red):** Bipolar or Unipolar depending on mode.

### 7.8 StereoChorus
Stereo chorus effect.
- **Detune (Knob):** Chorus depth.
- **Amount (Knob):** Dry/wet balance.
- **B (Button):** Bypass.
- **In (Input, Red):** Audio in.
- **L, R (Outputs, Red):** Bipolar stereo.

### 7.9 Phaser
14-pole phaser with 1-6 selectable allpass filters.
- **Rate (Knob + Display):** Internal LFO rate. 62.9 s/cycle to 24.4 Hz.
- **Depth (Knob):** LFO modulation depth.
- **LFO (Button):** Enable/disable internal LFO.
- **Center Freq (Knob + Display):** 100 Hz to 16 kHz.
- **Center Freq Mod (Input, Blue):** [Attenuator Type I].
- **Feedbk (Knob):** Positive or negative feedback. Center = zero.
- **Peaks (Selector):** Number of allpass filters, 1-6.
- **Spread (Knob):** Distance between peaks.
- **Spread Mod (Input, Blue):** [Attenuator Type I].
- **B (Button):** Bypass.
- **Input (Input, Red):** Audio in [Attenuator Type I].
- **Output (Output, Red):** Bipolar. Multi-color level LED.
- **Graph:** Phaser response display.

### 7.10 InvLevShift
Combined level shifter and polarity inverter.
- **Inv (Button):** Invert polarity.
- **Bipolar (Button):** Keep bipolar (combine with Inv for polarity flip only).
- **Unipolar Negative (Button):** Bipolar → negative unipolar (÷2, -32 bias).
- **Unipolar Positive (Button):** Bipolar → positive unipolar (÷2, +32 bias).
- **Input (Input, Red):** Signal in.
- **Output (Output, Red):** Bipolar or Unipolar.

### 7.11 Shaper
Waveshaper with 5 transfer functions.
- **Shape (Buttons):** Log2, Log1, Linear (bypass), Exp1, Exp2.
- **In (Input, Red):** Audio in.
- **Out (Output, Red):** Bipolar.
- **Note:** Affects each sample value individually. Log2 on sine → approaches square. Exp2 on sine → approaches triangle.

### 7.12 Compressor
Stereo compressor/limiter with sidechain.
- **Attack (Knob):** 0.5ms to 767ms.
- **Release (Knob):** 125ms to 10.2s.
- **Threshold (Knob):** -30 to 11 dB, Off.
- **Ratio (Knob):** 1.0:1 to 80:1.
- **Ref Level (Knob):** -30 to 12 dB. Target compression level.
- **Limiter (Knob):** Max output level. -30 to 11 dB, Off.
- **Side Chain (Input, Red):** External sidechain signal.
- **Act (Button):** Activate sidechain.
- **Mon (Button):** Monitor sidechain signal.
- **B (Button):** Bypass.
- **Input L, R (Inputs, Red):** Stereo audio in.
- **Output L, R (Outputs, Red):** Bipolar stereo.
- **Graph:** Compression curve. Gain reduction LED. Limiter active LED.

### 7.13 Expander
Stereo expander/gate with sidechain. Increases dynamic range by attenuating weak signals.
- **Attack (Knob):** 0.5ms to 767ms.
- **Release (Knob):** 125ms to 10.2s.
- **Threshold (Knob):** Off, -83 to 0 dB.
- **Ratio (Knob):** 1:1.0 to 1:80.
- **Gate (Knob):** Gate threshold. Off, -83 to -12 dB.
- **Hold (Knob):** Gate hold time. Off, 4 to 508ms.
- **Side Chain (Input, Red):** External sidechain.
- **Act (Button):** Activate sidechain.
- **Mon (Button):** Monitor sidechain.
- **B (Button):** Bypass.
- **Input L, R (Inputs, Red):** Stereo audio in.
- **Output L, R (Outputs, Red):** Bipolar stereo.
- **Graph:** Expansion curve. Gain reduction LED. Gate active LED.

### 7.14 RingMod
Ring/amplitude modulator with continuous depth control.
- **0/AM/RM (Knob):** Dry → AM → RM. 12 o'clock = max AM; past = ring modulation.
- **Mod Depth Mod (Input, Blue):** Depth modulation [Attenuator Type I].
- **Mod (Input, Red):** Modulator signal.
- **In (Input, Red):** Carrier signal.
- **Out (Output, Red):** Bipolar.

### 7.15 Digitizer
Sample rate and bit depth reducer for lo-fi effects.
- **Bits (Selector + Display):** 1 to 12 bits.
- **Quant Off (Button):** Disable bit quantization.
- **Rate (Knob + Display):** Sample rate. 32.7 Hz to 50.18 kHz.
- **Sample Off (Button):** Disable sample rate reduction (full bandwidth).
- **Rate Mod (Input, Blue):** Sample rate modulation [Attenuator Type I].
- **In (Input, Red):** Audio in.
- **Out (Output, Red):** Bipolar.

---

## 8. Control Modifier Group

### 8.1 Constant
Produces a fixed control signal value.
- **Uni (Button):** Unipolar (0 to +64, 0.5 unit steps) or Bipolar (-64 to +64, 1 unit steps).
- **Value (Knob + Display):** Set output level.
- **Output (Output, Blue):** Unipolar or Bipolar.

### 8.2 Smooth
Smooths transitions in control signals (slew limiter).
- **Time (Knob + Display):** Smooth time. 0.32 to 318 ms.
- **Input (Input, Blue):** Control signal in.
- **Output (Output, Blue):** Bipolar.

### 8.3 PortamentoA
Glide generator activated by external logic signal.
- **Time (Knob):** Glide time. 5.3 to 1355 ms.
- **In (Input, Blue):** Control signal to glide.
- **On (Input, Yellow):** Enables glide when high. If unpatched, portamento is always active.
- **Output (Output, Blue):** Bipolar.

### 8.4 PortamentoB
Glide generator with jump interrupt.
- **Time (Knob):** Glide time. 5.3 to 1355 ms.
- **In (Input, Blue):** Control signal to glide.
- **Jmp (Input, Yellow):** Temporarily interrupts portamento (signal passes through unaffected). If unpatched, portamento is always active.
- **Output (Output, Blue):** Bipolar.
- **Tip:** Patch Keyboard Patch gate → Jmp for legato portamento.

### 8.5 NoteScaler
Control signal attenuator calibrated in semitones.
- **Range (Knob + Display):** 0 to +/-64 semitones. Shows musical intervals.
- **In (Input, Blue):** Control signal in.
- **Output (Output, Blue):** Bipolar.

### 8.6 NoteQuant
Quantizes continuous control signal to discrete semitone steps.
- **Range (Knob + Display):** 0 to +/-64 semitones.
- **Notes (Selector + Display):** Quantization grid interval. Off, 1-127 semitones.
- **In (Input, Blue):** Control signal in.
- **Out (Output, Blue):** Bipolar.

### 8.7 KeyQuant
Quantizes control signal to a user-defined musical scale. Great for arpeggiator-like effects.
- **Notes (12 Buttons):** Select active notes in scale (C, C#, D, etc.). Duplicated across all octaves.
- **Range (Knob + Display):** +/-64 semitones.
- **Cont (Button):** Force equal sections per octave (evenly distributes input range).
- **In (Input, Blue):** Control signal in.
- **Out (Output, Blue):** Bipolar.

### 8.8 PartialGen
Generates control signal that transposes an oscillator to harmonic partials.
- **Range (Knob + Display):** 0 to +/-64 partials (0.5 steps). Practical limit: +/-32 partials.
- **Input (Input, Blue):** Control signal in.
- **Out (Output, Blue):** Bipolar.

### 8.9 ControlMixer
Two-input mixer for control signals with selectable attenuator characteristics.
- **Lin (Button):** Toggle between linear [Type I] and exponential [Type II] attenuators.
- **Inv Switches x2:** Invert polarity of each input.
- **Inputs x2 (Inputs, Blue):** Each with attenuation knob.
- **Output (Output, Blue):** Bipolar.

### 8.10 NoteVelScal
Note and velocity scaler. Generates control signals based on keyboard position and velocity with configurable break point.
- **Vel (Input, Blue):** Velocity input.
- **Note (Input, Blue):** Note/pitch input.
- **Vel Sens (Knob):** Velocity sensitivity [Type I]. Min (0) = output always 64 units; Max (127) = output ranges 0-85 units across the velocity input.
- **L Gain (Knob + Display):** Lower key section slope. +/-24 dB/octave.
- **Brk Pnt (Knob + Display):** Break point note. C-1 to G9.
- **R Gain (Knob + Display):** Upper key section slope. +/-24 dB/octave.
- **Output (Output, Blue):** Bipolar. Combined note + velocity result.
- **Graph:** Shows gain slopes and break point.

---

## 9. Logic Group

Logic signals: any value >= +1 unit is "high"; any value <= 0 is "low".

### 9.1 PosEdgeDelay
Delays the rising edge of a logic signal. Falling edge passes through immediately.
- **Time (Knob + Display):** 1.0 ms to 18 s. If input goes low before delay elapses, no output pulse.
- **Input (Input, Yellow):** Logic in.
- **Output (Output, Yellow):** Logic.

### 9.2 NegEdgeDelay
Delays the falling edge of a logic signal. Rising edge passes through immediately.
- **Time (Knob + Display):** 1.0 ms to 18 s. New positive edges extend the high duration.
- **Input (Input, Yellow):** Logic in.
- **Output (Output, Yellow):** Logic.

### 9.3 Pulse
Generates a fixed-duration logic high pulse from any positive edge.
- **Time (Knob + Display):** Pulse duration. 1.0 ms to 18 s. Retrigger extends duration.
- **Input (Input, Yellow):** Logic in.
- **Output (Output, Yellow):** Logic.

### 9.4 LogicDelay
Delays both edges of a logic signal equally.
- **Time (Knob + Display):** 1.0 ms to 18 s. Cycle length preserved.
- **Input (Input, Yellow):** Logic in.
- **Output (Output, Yellow):** Logic.

### 9.5 LogicInv
Logic inverter. High input → low output, and vice versa.
- Threshold: +1 to +64 → low output. 0 to -64 → high output.
- **Input (Input, Yellow):** Signal in.
- **Output (Output, Yellow):** Logic.

### 9.6 LogicProc
Boolean logic processor.
- **Mode (Buttons):** AND, OR, XOR.
  - AND: high when both inputs high.
  - OR: high when at least one input high.
  - XOR: high when exactly one input high.
- **Inputs x2 (Inputs, Yellow):** Logic signals.
- **Output (Output, Yellow):** Logic.

### 9.7 CompareLev
Compares a control signal against a fixed threshold.
- **Level Limit (Knob + Display):** -64 to +64 units.
- **A (Input, Blue):** Control signal to compare.
- **Out (Output, Yellow):** Logic. High when input >= threshold.

### 9.8 CompareAB
Compares two control signals.
- **A (Input, Blue):** First signal.
- **B (Input, Blue):** Second signal.
- **A>=B (Output, Yellow):** Logic. High when A >= B.

### 9.9 ClkDiv
Programmable clock divider.
- **Divider (Selector + Display):** Division factor. 1-128. Useful values: 6 = sixteenth notes from 24 PPQN, 8 = eighth note triplets.
- **Clock (Input, Yellow):** Clock input.
- **Rst (Input, Yellow):** Reset counter.
- **Output (Output, Yellow):** Logic.

### 9.10 ClkDivFix
Fixed clock divider. Divides 24 PPQN into standard musical divisions.
- **MIDI Cl (Input, Yellow):** 24 PPQN clock input.
- **Rst (Input, Yellow):** Reset counter.
- **8 (Output, Yellow):** Eighth notes (÷12). Logic.
- **T8 (Output, Yellow):** Eighth note triplets (÷8). Logic.
- **16 (Output, Yellow):** Sixteenth notes (÷6). Logic.

---

## 10. Sequencer Group

All sequencers have 16 steps, can be linked in series (Link output → next Rst input) or run in parallel. Steps configurable from 1-128 via Link chaining. Performance not transmitted via MIDI output.

### 10.1 EventSeq
Trigger/gate sequencer with two independent rows of 16 trigger buttons.
- **Clk (Input, Yellow):** Clock input. Advances one step per pulse.
- **Rst (Input, Yellow):** Reset to step 1 (on next clock pulse).
- **Snc (Output, Yellow):** Logic pulse when starting step 1.
- **Clr (Button):** Clear all triggers.
- **Loop (Button):** Auto-restart after last step.
- **Step (Selector):** Last step. 1-128.
- **Trigger Buttons x32:** Two rows of 16 buttons.
- **G Buttons x2:** Per-row toggle between Trigger mode (50% duty cycle per step) and Gate mode (adjacent steps merge into longer gate).
- **Link (Output, Yellow):** Logic pulse when going past step 16.
- **Out x2 (Outputs, Yellow):** Logic. One per trigger row.

### 10.2 CtrlSeq
Control sequencer with 16 sliders.
- **Clk (Input, Yellow):** Clock input.
- **Rst (Input, Yellow):** Reset to step 1.
- **Snc (Output, Yellow):** Pulse on step 1.
- **Loop (Button):** Auto-restart.
- **Step (Selector):** Last step. 1-128.
- **Clr (Button):** Reset all values to 0.
- **Rnd (Button):** Randomize all step values.
- **Sliders x16:** Control signal level per step. +/-64 (bipolar) or 0-64 (unipolar).
- **Uni (Button):** Unipolar/bipolar output mode.
- **Link (Output, Yellow):** Logic pulse past step 16.
- **Out (Output, Blue):** Unipolar or Bipolar.

### 10.3 NoteSeqA
Note sequencer with pitch sliders and gate pattern.
- **Clk (Input, Yellow):** Clock input.
- **Rst (Input, Yellow):** Reset to step 1.
- **Snc (Output, Yellow):** Pulse on step 1.
- **Loop (Button):** Auto-restart.
- **Step (Selector):** Last step. 1-128.
- **Clr (Button):** Reset all pitches to 0.
- **Record (Button):** Program steps from keyboard/MIDI. Pressing a key advances to next step.
- **Stop/Go (Button):** Stop sequencer / resume clocked operation.
- **< > (Buttons):** Scroll through steps.
- **Sliders x16:** Pitch per step. +/-64 semitones.
- **Link (Output, Yellow):** Logic pulse past step 16.
- **Gclk (Output, Yellow):** Logic pulse on each step advance.
- **Out (Output, Blue):** Bipolar pitch signal.

### 10.4 NoteSeqB
Note sequencer with graphical grid editor.
- **Clk/Rst/Snc/Loop/Step/Clr/Record/Stop/< >:** Same as NoteSeqA.
- **Rnd (Button):** Randomize step values within visible grid range.
- **Grid:** Graphical note editor. Click to zoom in, Ctrl/Alt-click to zoom out. 1-6 octave overview. Scroll bar for grid position.
- **Arrow Buttons x16:** Fine per-step pitch adjustment.
- **Link (Output, Yellow):** Logic pulse past step 16.
- **Gclk (Output, Yellow):** Logic pulse on each step advance.
- **Out (Output, Blue):** Bipolar pitch signal.

---

## Module Count Summary

| Group | Count | Modules |
|-------|-------|---------|
| 1. In/Out | 10 | Keyboard, KeyboardPatch, MIDIGlobal, AudioIn, PolyAreaIn, Output×3, NoteDetect, KeybSplit |
| 2. Oscillator | 16 | MasterOsc, OscA/B/C, SpectralOsc, FormantOsc, OscSlvA/B/C/D/E, OscSineBank, OscSlvFM, Noise, PercOsc, DrumSynth |
| 3. LFO | 14 | LFOA/B/C, LFOSlvA/B/C/D/E, ClkGen, ClkRndGen, RndStepGen, RandomGen, RndPulsGen, PatternGen |
| 4. Envelope | 6 | ADSR-Env, AD-Env, Mod-Env, AHD-Env, Multi-Env, EnvFollower |
| 5. Filter | 11 | FilterA/B/C/D/E/F, VocalFilter, Vocoder, FilterBank, EqMid, EqShelving |
| 6. Mixer | 13 | 3-Input Mixer, 8-Input Mixer, GainControl, X-Fade, Pan, 1to2Fade, 2to1Fade, LevMult, LevAdd, OnOff, 4-1Switch, 1-4Switch, Amplifier |
| 7. Audio Modifier | 15 | Clip, Overdrive, WaveWrapper, Quantizer, Delay, Sample&Hold, Diode, StereoChorus, Phaser, InvLevShift, Shaper, Compressor, Expander, RingMod, Digitizer |
| 8. Control Modifier | 10 | Constant, Smooth, PortamentoA/B, NoteScaler, NoteQuant, KeyQuant, PartialGen, ControlMixer, NoteVelScal |
| 9. Logic | 10 | PosEdgeDelay, NegEdgeDelay, Pulse, LogicDelay, LogicInv, LogicProc, CompareLev, CompareAB, ClkDiv, ClkDivFix |
| 10. Sequencer | 4 | EventSeq, CtrlSeq, NoteSeqA, NoteSeqB |
| **Total** | **109** | |
