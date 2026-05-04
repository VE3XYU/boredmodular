# Bored Modular Module Layout Reference

This document describes the visual layout and control arrangement for each module to assist in UI implementation for `boredmodular`. Sourced from the official Bored Modular V3.0 User Manual.

## General UI Patterns
- **Header:** Contains Module Name and Instance Number (e.g., OscA1).
- **Body:** Gray/Silver background with recessed "wells" for groups of controls.
- **Inputs/Outputs:**
    - **Red:** Audio (Circular socket)
    - **Blue:** Control (Circular socket)
    - **Yellow:** Logic (Circular socket)
    - **Gray:** Slave (Circular socket)
- **Knobs:** Small circular knobs, often with a green triangle indicating the default/reset position.
- **Buttons:** Small square buttons, often with an internal LED state indicator.
- **Displays:** Blue-background text boxes showing numerical values or names.
- **Attenuator placement:** Rotary knob directly to the right of (or below) its associated modulation input.
- **Level LEDs:** Multi-color (Green=normal, Yellow=headroom, Red=overload) on certain modules.
- **Graphs:** Small visual displays showing filter curves, envelope shapes, or transfer functions.

---

## 1. In/Out Group

### 1.1 Keyboard
- **Horizontal Bar Layout**
- Left to right: [Note Output (Blue)] [Gate Output (Yellow)] [Vel Output (Blue)] [Rel Vel Output (Blue)]
- Labels above each output.

### 1.2 KeyboardPatch
- **Horizontal Bar Layout**
- Left to right: [Latest Note (Blue)] [Patch Gate (Yellow)] [Latest Vel On (Blue)] [Latest Rel Vel (Blue)]

### 1.3 MIDIGlobal
- **Horizontal Bar Layout**
- Left to right: [Clock (Yellow)] [Sync (Yellow)] [Active (Yellow)]

### 1.4 AudioIn
- **Horizontal Bar Layout**
- [Input Meter L] [Input Meter R] [L Output (Red)] [R Output (Red)]
- 0dB indication on meters.

### 1.5 PolyAreaIn
- **Horizontal Bar Layout**
- [Input Meter L] [Input Meter R] [+6dB Button] [L Output (Red)] [R Output (Red)]

### 1.6 Output (1 Output)
- **Compact Row**
- [Dest Buttons (1/2/3/4/CVA L/CVA R)] [M Button] [Mix Input (Red)] [Level Knob]

### 1.7 Output (2 Outputs)
- **Row Layout**
- [Dest Buttons (1/2, 3/4, CVA)] [M Button] [Mix Bus L Input (Red)] [Mix Bus R Input (Red)] [Level Knob]

### 1.8 Output (4 Outputs)
- **Row Layout**
- [Mix Bus 1-4 Inputs (Red x4)] [Level Knob]

### 1.9 NoteDetect
- **Compact Row**
- [Note Display] [Note Knob] [Gate Output (Yellow)] [V Output (Blue)] [R Output (Blue)]

### 1.10 KeybSplit
- **Two-Row Layout**
- **Top Row:** [Lower Display] [Lower Knob] [Upper Display] [Upper Knob]
- **Bottom Row:** [Note In (Blue)] [Gate In (Yellow)] [Vel In (Blue)] → [Note Out (Blue)] [Gate Out (Yellow)] [Vel Out (Blue)]

---

## 2. Oscillator Group

### 2.1 MasterOsc
- **Multi-Row Panel**
- **Top Row:** [Display Box] [Coarse Knob] [Fine Knob] [KBT Button]
- **Middle Row:** [Pitch Mod 1 (Blue)] [Atten] [Pitch Mod 2 (Blue)] [Atten]
- **Bottom Row:** [Slv Output (Gray)]

### 2.2 OscA (Master Oscillator)
- **Multi-Row Panel**
- **Top Row:** [Display Box] [Coarse Knob] [Fine Knob] [KBT Knob] [PWidth Knob] [Waveform Selectors (4 icons: Pulse/Saw/Tri/Sine)]
- **Middle Row:** [Pitch Mod 1 (Red)] [Atten] [Pitch Mod 2 (Red)] [Atten] [FMA (Red)] [Atten] [Sync (Red)] [PWidth Mod (Red)] [Atten]
- **Bottom Row:** [Slv Output (Gray)] [M Button] [Audio Output (Red)]

### 2.3 OscB
- **Multi-Row Panel**
- **Top Row:** [Display Box] [Coarse Knob] [Fine Knob] [KBT Knob] [Waveform Selectors (4 icons)]
- **Middle Row:** [Pitch Mod 1 (Blue)] [Atten] [Pitch Mod 2 (Blue)] [Atten] [FMA (Red)] [Atten] [PW Mod (Blue)] [Atten]
- **Bottom Row:** [Slv Output (Gray)] [M Button] [Output (Red)]

### 2.4 OscC
- **Compact Panel**
- **Top Row:** [Display Box] [Coarse Knob] [Fine Knob] [AM (Red)] [KBT Button] [FMA (Red)] [Atten]
- **Middle Row:** [Pitch Mod (Red)] [Atten]
- **Bottom Row:** [Slv Output (Gray)] [M Button] [Output (Red)]

### 2.5 SpectralOsc
- **Multi-Row Panel**
- **Top Row:** [Display Box] [Coarse Knob] [Fine Knob] [KBT Button] [Spectral Shape Knob] [Partials Buttons (All/Odd)]
- **Middle Row:** [Pitch Mod 1 (Blue)] [Atten] [Pitch Mod 2 (Blue)] [Atten] [FMA (Red)] [Atten] [Shape Mod (Blue)] [Atten]
- **Bottom Row:** [Slv Output (Gray)] [M Button] [Output (Red)]

### 2.6 FormantOsc
- **Multi-Row Panel**
- **Top Row:** [Display Box] [Coarse Knob] [Fine Knob] [Timbre Knob] [Timbre Display]
- **Middle Row:** [Pitch Mod 1 (Blue)] [Atten] [Pitch Mod 2 (Blue)] [Atten] [Timbre Mod (Blue)] [Atten]
- **Bottom Row:** [Slv Output (Gray)] [KBT Button] [M Button] [Output (Red)]

### 2.7 OscSlvA
- **Multi-Row Panel**
- **Top Row:** [Display Box] [Partials Selector] [Detune Knob] [Fine Knob] [Waveform Selectors (4 icons)]
- **Middle Row:** [Sync (Red)] [FMA (Red)] [Atten] [AM (Red)]
- **Bottom Row:** [Mst Input (Gray)] [M Button] [Output (Red)]

### 2.8 OscSlvB
- **Compact Panel**
- **Top Row:** [Display Box] [Partials Selector] [Detune Knob] [Fine Knob] [PW Knob]
- **Middle Row:** [PW Mod (Red)] [Atten]
- **Bottom Row:** [Mst Input (Gray)] [M Button] [Output (Red)]

### 2.9 OscSlvC
- **Compact Panel**
- **Top Row:** [Display Box] [Partials Selector] [Detune Knob] [Fine Knob]
- **Middle Row:** [FMA (Red)] [Atten]
- **Bottom Row:** [Mst Input (Gray)] [M Button] [Output (Red)]

### 2.10 OscSlvD
- **Compact Panel** (same layout as OscSlvC)
- Triangle waveform only. Same controls as OscSlvC.

### 2.11 OscSlvE
- **Compact Panel**
- **Top Row:** [Display Box] [Partials Selector] [Detune Knob] [Fine Knob]
- **Middle Row:** [FMA (Red)] [Atten] [AM (Red)]
- **Bottom Row:** [Mst Input (Gray)] [M Button] [Output (Red)]

### 2.12 OscSineBank
- **Large Multi-Row Panel** (widest oscillator module)
- **Left Column:** [Mst Input (Gray)] [Sync Input (Red)] [Mix In (Red)]
- **Main Area:** 6 columns, each containing:
  - [Display Box] [Partial Selector ↑↓] [Tune Knob] [Fine Tune Knob] [Level Knob] [AM Input (Red)] [M Button]
- **Bottom Right:** [Output (Red)]

### 2.13 OscSlvFM
- **Compact Panel**
- **Top Row:** [Display Box] [Partials Selector] [Detune Knob] [Fine Knob]
- **Middle Row:** [Sync (Red)] [FMB (Red)] [Atten] [-3 Oct Button]
- **Bottom Row:** [Mst Input (Gray)] [M Button] [Output (Red)]

### 2.14 Noise
- **Minimal Module**
- [White/Colored Knob] [Output (Red)]

### 2.15 PercOsc
- **Multi-Row Panel**
- **Top Row:** [Display Box] [Pitch Knob] [Fine Knob] [Decay Knob] [Click Knob] [Punch Button]
- **Middle Row:** [Amp Input (Red)] [Trig Input (Red)] [Pitch Mod (Blue)] [Atten]
- **Bottom Row:** [M Button] [Output (Red)]

### 2.16 DrumSynth
- **Complex Multi-Section Panel**
- **Left Column:** [Trig Input (Yellow) + LED] [Vel Mod (Blue)] [Pitch Mod (Blue)]
- **Osc Section (Middle-Left):**
  - [Master Display] [Slave Display]
  - [Master: Tune/Dcy/Lvl Knobs] [Slave: Tune/Dcy/Lvl Knobs]
- **Noise Filter (Middle-Right):**
  - [Freq Knob] [Res Knob] [Swp Knob] [Dcy Knob]
  - [HP/BP/LP Buttons]
- **Bend/Mix (Right):**
  - [Amt Knob] [Dcy Knob] [Click Knob] [Noise Knob]
- **Bottom:** [Preset Display] [Preset ↑↓] [M Button] [Output (Red)]

---

## 3. LFO Group

### 3.1 LFOA
- **Wide Horizontal Row**
- [Rst Input (Yellow)] [Slv Output (Gray)] [Rate Display] [Rate Knob] [Rate Mod (Blue)] [Atten] [Mono Button] [Hi/Lo/Sub Buttons] [KBT Knob] [Phase Display] [Phase Knob] [Phase Graph] [Waveform Selectors (5 icons)] [M Button] [Output (Blue) + LED]

### 3.2 LFOB
- **Wide Horizontal Row**
- [Rst Input (Yellow)] [Slv Output (Gray)] [Rate Display] [Rate Knob] [Rate Mod (Blue)] [Atten] [Mono Button] [Hi/Lo/Sub Buttons] [KBT Knob] [Phase Display] [Phase Knob] [Phase Graph] [PW Knob] [PW Mod (Blue)] [Atten] [Output (Blue) + LED]

### 3.3 LFOC
- **Horizontal Row** (more compact than LFOA)
- [Slv Output (Gray)] [Rate Display] [Rate Knob] [Rate Mod (Blue)] [Atten] [Hi/Lo/Sub Buttons] [Mono Button] [Waveform Selectors (4 icons)] [M Button] [Output (Blue) + LED]

### 3.4 LFOSlvA
- **Horizontal Row**
- [Mst Input (Gray)] [Rst Input (Yellow)] [Rate Display] [Rate Knob] [Mono Button] [Phase Display] [Phase Knob] [Phase Graph] [Waveform Selectors (5 icons)] [M Button] [Output (Blue) + LED]

### 3.5 LFOSlvB
- **Minimal Horizontal Row** (Sawtooth only)
- [Mst Input (Gray)] [Rate Display] [Rate Knob] [Output (Blue) + LED]

### 3.6 LFOSlvC
- **Minimal Horizontal Row** (Sine only)
- [Mst Input (Gray)] [Rate Display] [Rate Knob] [Output (Blue) + LED]

### 3.7 LFOSlvD
- **Minimal Horizontal Row** (Square only)
- [Mst Input (Gray)] [Rate Display] [Rate Knob] [Output (Blue) + LED]

### 3.8 LFOSlvE
- **Minimal Horizontal Row** (Triangle only)
- [Mst Input (Gray)] [Rate Display] [Rate Knob] [Output (Blue) + LED]

### 3.9 ClkGen
- **Horizontal Row**
- [Reset Input (Yellow)] [Slv Output (Gray)] [Rate Display] [Rate Knob] [On/Off Button] [24 Output (Yellow)] [4 Output (Yellow)] [Sync Output (Yellow)]

### 3.10 ClkRndGen
- **Compact Row**
- [Mono Button] [Col Button] [Clk Input (Yellow)] [Output (Blue)]

### 3.11 RndStepGen
- **Minimal Row**
- [Mst Input (Gray)] [Rate Display] [Rate Knob] [Output (Blue) + LED]

### 3.12 RandomGen
- **Minimal Row**
- [Mst Input (Gray)] [Rate Display] [Rate Knob] [Output (Blue) + LED]

### 3.13 RndPulsGen
- **Minimal Module**
- [Density Knob] [Output (Blue) + LED]

### 3.14 PatternGen
- **Multi-Row Panel**
- **Top Row:** [Clk Input (Yellow)] [Rst Input (Yellow)] [Pattern Display] [Pattern Knob] [Pattern Mod (Blue)] [Bank Display] [Bank Knob] [Bank Mod (Blue)]
- **Bottom Row:** [Step Display] [Step ↑↓] [Mono Button] [Delta Button (Hi/Lo)] [Output (Blue)]

---

## 4. Envelope Group

### 4.1 ADSR-Env
- **Horizontal Layout with Graph**
- **Left:** [Gate Input (Yellow) + LED] [Retrig Input (Yellow)] [Amp Mod (Blue)]
- **Center:** [Curve Buttons (Log/Lin/Exp)] [Invert Button] [A Knob + Display] [D Knob + Display] [S Knob + Display] [R Knob + Display] [Graph]
- **Right:** [Input (Red)] → [Output (Red)] and [Env Output (Blue)]

### 4.2 AD-Env
- **Compact Horizontal Layout**
- [Gate/Trig Button] [Gate/Trig Input (Yellow) + LED] [Amp Mod (Blue)] [Attack Knob + Display] [Dcy Knob + Display] [Graph] [Input (Red)] → [Output (Red)] [Env Output (Blue)]

### 4.3 Mod-Env
- **Wide Horizontal Layout**
- **Left:** [Gate Input (Yellow) + LED] [Retrig Input (Yellow)] [Amp Mod (Blue)]
- **Center:** [Invert Button] [A Knob + Display] [D Knob + Display] [S Knob + Display] [R Knob + Display]
- **Below A/D/S/R:** [A Mod (Blue)] [Atten] [D Mod (Blue)] [Atten] [S Mod (Blue)] [Atten] [R Mod (Blue)] [Atten]
- **Right:** [Graph] [Input (Red)] → [Output (Red)] [Env Output (Blue)]

### 4.4 AHD-Env
- **Wide Horizontal Layout**
- **Left:** [Trig Input (Yellow) + LED] [Amp Mod (Blue)]
- **Center:** [A Knob + Display] [H Knob + Display] [D Knob + Display]
- **Below A/H/D:** [A Mod (Blue)] [Atten] [H Mod (Blue)] [Atten] [D Mod (Blue)] [Atten]
- **Right:** [Graph] [Input (Red)] → [Output (Red)] [Env Output (Blue)]

### 4.5 Multi-Env
- **Large Multi-Row Panel**
- **Top Left:** [Gate Input (Yellow) + LED] [Amp Mod (Blue)] [Curve Buttons (Bipolar Lin / Unipolar Exp / Unipolar Lin)]
- **Main Area:** [L1 Knob + Disp] [T1 Knob + Disp] [L2 Knob + Disp] [T2 Knob + Disp] [L3 Knob + Disp] [T3 Knob + Disp] [L4 Knob + Disp] [T4 Knob + Disp] [T5 Knob + Disp]
- **Bottom Left:** [Sustain Selector ↑↓ + Display]
- **Right:** [Graph] [Input (Red)] → [Output (Red)] [Env Output (Blue)]

### 4.6 EnvFollower
- **Compact Row**
- [Atk Knob + Display] [Rel Knob + Display] [Input (Red)] [Output (Blue)]

---

## 5. Filter Group

### 5.1 FilterA
- **Minimal Row**
- [Freq Display] [Freq Knob] [Input (Red)] [Output (Red)]

### 5.2 FilterB
- **Minimal Row** (same as FilterA)
- [Freq Display] [Freq Knob] [Input (Red)] [Output (Red)]

### 5.3 FilterC (Static Multimode)
- **Row Layout**
- [Freq Display] [Freq Knob] [Res Display] [Res Knob] [GC Button] [Input (Red)] [HP Output (Red)] [BP Output (Red)] [LP Output (Red)]

### 5.4 FilterD (Dynamic Multimode)
- **Multi-Row**
- **Top Row:** [Freq Display] [Freq Knob] [KBT Knob] [Res Display] [Res Knob]
- **Middle Row:** [Freq Mod (Blue)] [Atten]
- **Bottom Row:** [Input (Red)] [HP Output (Red)] [BP Output (Red)] [LP Output (Red)]

### 5.5 FilterE (Dynamic Synth Filter)
- **Multi-Row Panel**
- **Top Row:** [Freq Display] [Freq Knob] [KBT Knob] [Filter Type Buttons (HP/BP/LP/BR)] [GC Button] [Res Display] [Res Knob] [Slope Button (12/24)]
- **Middle Row:** [Freq Mod 1 (Red)] [Atten] [Freq Mod 2 (Red)] [Atten] [Res Mod (Red)] [Atten]
- **Bottom Row:** [Graph] [Input (Red)] [B Button] [Output (Red)]

### 5.6 FilterF (Classic Analog LP)
- **Multi-Row Panel**
- **Top Row:** [Freq Display] [Freq Knob] [KBT Knob] [Res Display] [Res Knob] [Slope Button (12/18/24)]
- **Middle Row:** [Freq Mod 1 (Blue)] [Atten] [Freq Mod 2 (Blue)] [Atten]
- **Bottom Row:** [Graph] [Input (Red)] [B Button] [Output (Red)]

### 5.7 VocalFilter
- **Multi-Row Panel**
- **Top Row:** [Res Knob] [Freq Knob] [Freq Mod (Blue)] [Atten]
- **Middle Row:** [Vowel 1 Display + Selector ↑↓] [Vowel 2 Display + Selector ↑↓] [Vowel 3 Display + Selector ↑↓]
- **Bottom Row:** [Vowel Mod (Blue)] [Atten] [Navigator Knob] [Input (Red)] [Input Atten] [Output (Red)]

### 5.8 Vocoder
- **Large Panel**
- **Top Left:** [Analysis Input (Red)] [HF Emphasis Button] [Mon Button]
- **Center:** [Routing Graph] [16 Reroute Button Pairs (↑↓)]
- **Right:** [Preset Shift Buttons] [Inv Button] [Rnd Button]
- **Bottom Left:** [Output Gain Knob]
- **Bottom Right:** [Synth Input (Red)] [Output (Red)]

### 5.9 FilterBank
- **Wide Panel**
- **Main Area:** 14 vertical sliders in a row, center frequency labels above each
- **Right:** [Min Button] [Max Button] [Input (Red)] [B Button] [Output (Red)]

### 5.10 EqMid
- **Multi-Row Panel**
- **Top Row:** [Freq Display] [Freq Knob] [Gain Display] [Gain Knob] [BW Display] [BW Knob]
- **Bottom Row:** [Graph] [Input (Red)] [Input Atten] [B Button] [Output (Red) + LED]

### 5.11 EqShelving
- **Multi-Row Panel**
- **Top Row:** [Freq Display] [Freq Knob] [Gain Display] [Gain Knob] [Hi/Lo Button]
- **Bottom Row:** [Graph] [Input (Red)] [Input Atten] [Bypass Button] [Output (Red) + LED]

---

## 6. Mixer Group

### 6.1 3 Inputs Mixer
- **Horizontal Row**
- 3 blocks of: [Input (Red)] [Atten Knob]
- End: [Output (Red)]

### 6.2 8 Inputs Mixer
- **Wide Horizontal Bar**
- 8 blocks of: [Input (Red)] [Atten Knob]
- End: [-6dB Button] [Output (Red) + LED]

### 6.3 GainControl (VCA)
- **Compact Panel**
- [Control Input (Red)] [Unipolar Button] [Input (Red)] [Output (Red)]

### 6.4 X-Fade
- **Row Layout**
- [X-Fade Mod (Red)] [Atten] [1/2 Knob] [Input 1 (Red)] [Input 2 (Red)] [Output (Red)]

### 6.5 Pan
- **Row Layout**
- [Pan Mod (Red)] [Atten] [L/R Knob] [Input (Red)] [L Output (Red)] [R Output (Red)]

### 6.6 1to2Fade
- **Compact Row**
- [Fade Knob] [Input (Red)] [Output 1 (Red)] [Output 2 (Red)]

### 6.7 2to1Fade
- **Compact Row**
- [Fade Knob] [Input 1 (Red)] [Input 2 (Red)] [Output (Red)]

### 6.8 LevMult
- **Compact Row**
- [Uni Button] [Gain Display] [Gain Knob] [Input (Red)] [Output (Red)]

### 6.9 LevAdd
- **Compact Row**
- [Uni Button] [Offset Display] [Offset Knob] [Input (Red)] [Output (Red)]

### 6.10 OnOff
- **Minimal Module**
- [On Button] [Input (Red)] [Output (Red)]

### 6.11 4-1Switch
- **Multi-Row**
- [Input 1 (Red)] [Atten] [Input 2 (Red)] [Atten] [Input 3 (Red)] [Atten] [Input 4 (Red)] [Atten]
- [Input Selector Buttons (1/2/3/4)] [M Button] [Output (Red)]

### 6.12 1-4Switch
- **Multi-Row**
- [Input (Red)] [Atten]
- [Output Selector Buttons (1/2/3/4)] [M Button]
- [Output 1 (Red)] [Output 2 (Red)] [Output 3 (Red)] [Output 4 (Red)]

### 6.13 Amplifier
- **Minimal Row**
- [Amplification Display] [Amplification Knob] [Input (Red)] [Output (Red)]

---

## 7. Audio Modifier Group

### 7.1 Clip
- **Multi-Row**
- [Sym Button] [Clip Knob] [Mod Input (Red)] [Atten] [Graph] [In (Red)] [Out (Red)]

### 7.2 Overdrive
- **Multi-Row**
- [Overdrive Knob] [Mod Input (Blue)] [Atten] [Graph] [In (Red)] [Out (Red)]

### 7.3 WaveWrapper
- **Multi-Row**
- [Wrap Knob] [Mod Input (Red)] [Atten] [Graph] [In (Red)] [Out (Red)]

### 7.4 Quantizer
- **Compact Row**
- [Bits Display] [Bits ↑↓] [In (Red)] [Out (Red)]

### 7.5 Delay (Short)
- **Row Layout**
- [Time Display] [Time Knob] [Time Mod (Blue)] [Atten] [In (Red)] [2.65ms Output (Red)] [Variable Output (Red)]

### 7.6 Sample&Hold
- **Compact Row**
- [Trig Input (Yellow)] [Input (Red)] [Out (Red)]

### 7.7 Diode
- **Compact Row**
- [Mode Buttons (Bypass/Half/Full)] [In (Red)] [Out (Red)]

### 7.8 StereoChorus
- **Compact Row**
- [Detune Knob] [Amount Knob] [B Button] [In (Red)] [L Output (Red)] [R Output (Red)]

### 7.9 Phaser
- **Large Multi-Row Panel**
- **Top Row:** [Rate Display] [Rate Knob] [Depth Knob] [LFO Button]
- **Middle Row:** [Center Freq Display] [Center Freq Knob] [Freq Mod (Blue)] [Atten] [Feedbk Knob] [Peaks Display] [Peaks ↑↓]
- **Bottom Row:** [Graph] [Spread Knob] [Spread Mod (Blue)] [Atten] [Input (Red)] [Input Atten] [B Button] [Output (Red) + LED]

### 7.10 InvLevShift
- **Compact Row**
- [Inv Button] [Bipolar Button] [Uni Neg Button] [Uni Pos Button] [Input (Red)] [Output (Red)]

### 7.11 Shaper
- **Compact Row**
- [Shape Buttons (Log2/Log1/Linear/Exp1/Exp2)] [In (Red)] [Out (Red)]

### 7.12 Compressor
- **Large Multi-Row Panel**
- **Top Row:** [Input L (Red)] [Input R (Red)] [Side Chain (Red)] [Act Button] [Mon Button]
- **Middle Row:** [Graph] [GR Indicator] [Lim LED] [Attack Knob] [Release Knob] [Thresh Knob] [Ratio Knob] [Ref Lvl Knob] [Limiter Knob]
- **Bottom Row:** [B Button] [Output L (Red)] [Output R (Red)]

### 7.13 Expander
- **Large Multi-Row Panel** (similar to Compressor)
- **Top Row:** [Input L (Red)] [Input R (Red)] [Side Chain (Red)] [Act Button] [Mon Button]
- **Middle Row:** [Graph] [GR Indicator] [Gate LED] [Attack Knob] [Release Knob] [Thresh Knob] [Ratio Knob] [Gate Knob] [Hold Knob]
- **Bottom Row:** [B Button] [Output L (Red)] [Output R (Red)]

### 7.14 RingMod
- **Compact Panel**
- [0/AM/RM Knob] [Mod Depth Mod (Blue)] [Atten] [Mod Input (Red)] [In (Red)] [Out (Red)]

### 7.15 Digitizer
- **Multi-Row Panel**
- **Top Row:** [Bits Display] [Bits ↑↓] [Quant Off Button] [Sample Display] [Rate Knob] [Sample Off Button]
- **Middle Row:** [Rate Mod (Blue)] [Atten]
- **Bottom Row:** [In (Red)] [Out (Red)]

---

## 8. Control Modifier Group

### 8.1 Constant
- **Minimal Module**
- [Uni Button] [Value Display] [Value Knob] [Output (Blue)]

### 8.2 Smooth
- **Compact Row**
- [Time Display] [Time Knob] [Input (Blue)] [Output (Blue)]

### 8.3 PortamentoA
- **Compact Row**
- [Time Knob] [In (Blue)] [On Input (Yellow)] [Output (Blue)]

### 8.4 PortamentoB
- **Compact Row**
- [Time Knob] [In (Blue)] [Jmp Input (Yellow)] [Output (Blue)]

### 8.5 NoteScaler
- **Compact Row**
- [Range Display] [Range Knob] [In (Blue)] [Output (Blue)]

### 8.6 NoteQuant
- **Row Layout**
- [Range Display] [Range Knob] [Notes Display] [Notes ↑↓] [In (Blue)] [Out (Blue)]

### 8.7 KeyQuant
- **Multi-Row Panel**
- **Top Row:** [12 Note Buttons (C through B)] [Cont Button]
- **Bottom Row:** [Range Display] [Range Knob] [In (Blue)] [Out (Blue)]

### 8.8 PartialGen
- **Compact Row**
- [Range Display] [Range Knob] [Input (Blue)] [Out (Blue)]

### 8.9 ControlMixer
- **Row Layout**
- [Lin Button] [Input 1 (Blue)] [Atten] [Inv Button 1] [Input 2 (Blue)] [Atten] [Inv Button 2] [Output (Blue)]

### 8.10 NoteVelScal
- **Multi-Row Panel**
- **Top Row:** [Vel Input (Blue)] [Vel Sens Knob] [Note Input (Blue)]
- **Middle Row:** [L Gain Display] [L Gain Knob] [Brk Pnt Display] [Brk Pnt Knob] [R Gain Display] [R Gain Knob]
- **Bottom Row:** [Graph] [Output (Blue)]

---

## 9. Logic Group

### 9.1 PosEdgeDelay
- **Compact Row**
- [Time Display] [Time Knob] [Input (Yellow)] [Output (Yellow)]

### 9.2 NegEdgeDelay
- **Compact Row**
- [Time Display] [Time Knob] [Input (Yellow)] [Output (Yellow)]

### 9.3 Pulse
- **Compact Row**
- [Time Display] [Time Knob] [Input (Yellow)] [Output (Yellow)]

### 9.4 LogicDelay
- **Compact Row**
- [Time Display] [Time Knob] [Input (Yellow)] [Output (Yellow)]

### 9.5 LogicInv
- **Minimal Module**
- [Input (Yellow)] [Output (Yellow)]

### 9.6 LogicProc
- **Compact Row**
- [Mode Buttons (AND/OR/XOR)] [Input 1 (Yellow)] [Input 2 (Yellow)] [Output (Yellow)]

### 9.7 CompareLev
- **Compact Row**
- [Level Display] [Level Knob] [A Input (Blue)] [Out (Yellow)]

### 9.8 CompareAB
- **Compact Row**
- [A Input (Blue)] [B Input (Blue)] [A>=B Output (Yellow)]

### 9.9 ClkDiv
- **Row Layout**
- [Clock Input (Yellow)] [Rst Input (Yellow)] [Divider Display] [Divider ↑↓] [Output (Yellow)]

### 9.10 ClkDivFix
- **Row Layout**
- [MIDI Cl Input (Yellow)] [Rst Input (Yellow)] [8 Output (Yellow)] [T8 Output (Yellow)] [16 Output (Yellow)]

---

## 10. Sequencer Group

### 10.1 EventSeq
- **Grid Layout**
- **Left Side:** [Clk Input (Yellow)] [Rst Input (Yellow)] [Snc Output (Yellow)]
- **Top Bar:** [Clr Button] [Step Display + ↑↓] [Loop Button]
- **Main Area:** 2 rows of 16 trigger buttons with step LEDs above. [G Button] per row for gate/trigger mode.
- **Right Side:** [Link Output (Yellow)] [Out 1 (Yellow)] [Out 2 (Yellow)]

### 10.2 CtrlSeq
- **Grid Layout**
- **Left Side:** [Clk Input (Yellow)] [Rst Input (Yellow)] [Snc Output (Yellow)]
- **Top Bar:** [Clr Button] [Rnd Button] [Step Display + ↑↓] [Loop Button] [Uni Button]
- **Main Area:** 16 vertical sliders with arrow buttons per step. Step LEDs above.
- **Right Side:** [Link Output (Yellow)] [Out (Blue)]

### 10.3 NoteSeqA
- **Grid Layout**
- **Left Side:** [Clk Input (Yellow)] [Rst Input (Yellow)] [Snc Output (Yellow)]
- **Top Bar:** [Clr Button] [Step Display + ↑↓] [Loop Button] [Record Button] [Stop/Go Button] [< > Buttons]
- **Main Area:** 16 vertical pitch sliders with step LEDs above. No per-step gate buttons — Gclk emits a logic pulse on each step advance.
- **Right Side:** [Link Output (Yellow)] [Gclk Output (Yellow)] [Note Output (Blue)]

### 10.4 NoteSeqB
- **Grid Layout**
- **Left Side:** [Clk Input (Yellow)] [Rst Input (Yellow)] [Snc Output (Yellow)]
- **Top Bar:** [Clr Button] [Rnd Button] [Step Display + ↑↓] [Loop Button] [Record Button] [Stop/Go Button] [< > Buttons]
- **Main Area:** Graphical grid (zoomable 1-6 octaves) with 16 columns. Arrow buttons below each step. Scroll bar on right.
- **Right Side:** [Link Output (Yellow)] [Gclk Output (Yellow)] [Out (Blue)]

---

## Module Count Summary

| Group | Count |
|-------|-------|
| 1. In/Out | 10 |
| 2. Oscillator | 16 |
| 3. LFO | 14 |
| 4. Envelope | 6 |
| 5. Filter | 11 |
| 6. Mixer | 13 |
| 7. Audio Modifier | 15 |
| 8. Control Modifier | 10 |
| 9. Logic | 10 |
| 10. Sequencer | 4 |
| **Total** | **109** |
