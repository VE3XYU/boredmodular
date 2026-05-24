// ─── Audio Engine ───────────────────────────────────────────────────────────
// Web Audio API based modular synthesis engine

import { applyAttenuatorCurve, PORT_ATTENUATOR_TYPES } from "./moduleDefs";

// Note-to-frequency conversion
const NOTE_FREQ = (note) => 440 * Math.pow(2, (note - 69) / 12);

// sync-osc-processor waveform encoding
const WAVE_INT = { sine: 0, sawtooth: 1, square: 2, triangle: 3 };

// Pink noise filter (Paul Kellet refined coefficients) — fills a Float32Array in place
function _fillPinkBuffer(data) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.modules = new Map();
    this.connections = [];
    this.masterGain = null;
    this.analyser = null;
    this.scopeData = new Float32Array(256);
    this.isRunning = false;
    // Gate target tracking: keyboard id -> Set of envelope module ids
    this._gateTargets = new Map();
  }

  init() {
    if (this.ctx) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctor({ latencyHint: "interactive" });
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    if (typeof console !== "undefined" && console.info) {
      console.info(
        "[AudioEngine] state=%s sampleRate=%d baseLatency=%s outputLatency=%s",
        this.ctx.state,
        this.ctx.sampleRate,
        this.ctx.baseLatency,
        this.ctx.outputLatency,
      );
    }
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    const base = process.env.PUBLIC_URL || '';
    this._workletReady = Promise.all([
      this.ctx.audioWorklet.addModule(`${base}/pulse-processor.js`),
      this.ctx.audioWorklet.addModule(`${base}/sync-osc-processor.js`),
    ]).catch((err) => { console.error('worklet load failed', err); });
    this.isRunning = true;
  }

  async createModule(id, type) {
    if (!this.ctx) this.init();
    if (type === 'OscSlvB' || type === 'OscA' || type === 'OscSlvA' || type === 'OscSlvFM' || type === 'OscSineBank') {
      await this._workletReady;
    }
    let mod;
    switch (type) {
      case "OscA": mod = this._createOscA(id); break;
      case "OscB": mod = this._createOscB(id); break;
      case "OscC": mod = this._createOscC(id); break;
      case "Filter": mod = this._createFilter(id); break;
      case "FilterC": mod = this._createFilterC(id); break;
      case "FilterE": mod = this._createFilterE(id); break;
      case "Envelope": mod = this._createEnvelope(id); break;
      case "ADSREnv": mod = this._createADSREnv(id); break;
      case "LFO": mod = this._createLFO(id); break;
      case "LFOA": mod = this._createLFOA(id); break;
      case "ClkGen": mod = this._createClkGen(id); break;
      case "RandomGen": mod = this._createRandomGen(id); break;
      case "PortamentoA": mod = this._createPortamentoA(id); break;
      case "Amplifier": mod = this._createAmplifier(id); break;
      case "GainControl": mod = this._createGainControl(id); break;
      case "Mixer2": // legacy alias — load patches saved before Mixer3 rename
      case "Mixer3": mod = this._createMixer3(id); break;
      case "Mixer8": mod = this._createMixer8(id); break;
      case "XFade": mod = this._createXFade(id); break;
      case "Noise": mod = this._createNoise(id); break;
      case "Output": mod = this._createOutput(id); break;
      case "Delay": mod = this._createDelay(id); break;
      case "ShortDelay": mod = this._createShortDelay(id); break;
      case "Panner": mod = this._createPanner(id); break;
      case "Chorus": mod = this._createChorus(id); break;
      case "Shaper": mod = this._createShaper(id); break;
      case "Keyboard": mod = this._createKeyboard(id); break;
      case "DrumSynth": mod = this._createDrumSynth(id); break;
      case "FormantOsc": mod = this._createFormantOsc(id); break;
      case "MasterOsc": mod = this._createMasterOsc(id); break;
      case "OscSlvA": mod = this._createOscSlvA(id); break;
      case "OscSlvB": mod = this._createOscSlvB(id); break;
      case "OscSlvC": mod = this._createOscSlvC(id); break;
      case "OscSlvD": mod = this._createOscSlvD(id); break;
      case "OscSlvE": mod = this._createOscSlvE(id); break;
      case "OscSlvFM": mod = this._createOscSlvFM(id); break;
      case "OscSineBank": mod = this._createOscSineBank(id); break;
      case "SpectralOsc": mod = this._createSpectralOsc(id); break;
      case "PercOsc": mod = this._createPercOsc(id); break;
      case "EventSeq": mod = this._createEventSeq(id); break;
      case "CtrlSeq": mod = this._createCtrlSeq(id); break;
      case "NoteSeqA": mod = this._createNoteSeqA(id); break;
      case "NoteSeqB": mod = this._createNoteSeqB(id); break;
      default: return null;
    }
    this._autoAddAttenuators(mod);
    this.modules.set(id, mod);
    return mod;
  }

  // Wraps each modulation input listed in PORT_ATTENUATOR_TYPES with a GainNode
  // attenuator + a "<port>Atten" param. Skips ports whose impl already routes
  // through a GainNode (existing fmDepth/pwModDepth knobs) or virtual ports
  // (null). Note-source connections bypass these via `mod._originalInputs`
  // because the Note source replaces the target's value rather than modulating it.
  _autoAddAttenuators(mod) {
    if (!mod) return;
    const spec = PORT_ATTENUATOR_TYPES[mod.type];
    if (!spec) return;
    mod._originalInputs = mod._originalInputs || {};
    for (const portName of Object.keys(spec)) {
      const target = mod.inputs[portName];
      // Skip if virtual (null) or already wrapped in a GainNode (typeof connect === "function")
      if (!target || typeof target.connect === "function") continue;
      const curve = spec[portName];
      const attenGain = this.ctx.createGain();
      attenGain.gain.value = 1;
      attenGain.connect(target);
      mod._originalInputs[portName] = target;
      mod.inputs[portName] = attenGain;
      mod._nodes.push(attenGain);
      const paramName = portName + "Atten";
      const isBipolar = curve === "III";
      mod.params[paramName] = {
        value: 1,
        min: isBipolar ? -1 : 0,
        max: 1,
        audioParam: attenGain.gain,
        label: portName + " Atn",
        curve,
      };
    }
  }

  // ── Oscillators ──────────────────────────────────────────────────────────

  _createOscA(id) {
    const osc = new AudioWorkletNode(this.ctx, 'sync-osc-processor', { numberOfInputs: 1 });
    const freqParam = osc.parameters.get('frequency');
    const pwParam = osc.parameters.get('pulseWidth');
    const waveParam = osc.parameters.get('waveform');
    freqParam.value = 220;
    waveParam.value = WAVE_INT.sawtooth;

    const gain = this.ctx.createGain();
    const slaveGain = this.ctx.createGain();
    const fmGain = this.ctx.createGain();
    const pwModGain = this.ctx.createGain();
    gain.gain.value = 0.8;
    slaveGain.gain.value = 0.8;
    fmGain.gain.value = 0;
    pwModGain.gain.value = 0;
    osc.connect(gain);
    osc.connect(slaveGain);
    fmGain.connect(freqParam);
    pwModGain.connect(pwParam);

    return {
      id, type: "OscA", node: osc, outputNode: gain,
      outputs: { Out: gain, Slv: slaveGain },
      inputs: { PitchMod1: freqParam, PitchMod2: freqParam, FmMod: fmGain, Sync: osc, PWMod: pwModGain },
      _nodes: [osc, gain, slaveGain, fmGain, pwModGain],
      _slaveTargets: [],
      _frequency: 220,
      params: {
        frequency: { value: 220, min: 20, max: 8000, audioParam: freqParam, label: "Freq" },
        coarse: { value: 0, min: -64, max: 64, label: "Coarse" },
        fine: { value: 0, min: -50, max: 50, label: "Fine" },
        waveform: { value: "sawtooth", options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" },
        pulseWidth: { value: 0.5, min: 0.01, max: 0.99, audioParam: pwParam, label: "PW" },
        pwModDepth: { value: 0, min: 0, max: 1, audioParam: pwModGain.gain, label: "PW Mod", curve: "I" },
        fmDepth: { value: 0, min: 0, max: 1000, audioParam: fmGain.gain, label: "FM Depth", curve: "II" },
        level: { value: 0.8, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createOscB(id) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const slaveGain = this.ctx.createGain();
    const fmGain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 220;
    gain.gain.value = 0.8;
    slaveGain.gain.value = 0.8;
    fmGain.gain.value = 0;
    osc.connect(gain);
    osc.connect(slaveGain);
    fmGain.connect(osc.frequency);
    osc.start();
    return {
      id, type: "OscB", node: osc, outputNode: gain,
      outputs: { Out: gain, Slv: slaveGain },
      // PitchMod is a legacy alias for PitchMod1; preserves load of patches saved before split
      inputs: { PitchMod1: osc.frequency, PitchMod2: osc.frequency, PitchMod: osc.frequency, FmMod: fmGain },
      _nodes: [osc, gain, slaveGain, fmGain],
      _slaveTargets: [],
      _frequency: 220,
      params: {
        frequency: { value: 220, min: 20, max: 8000, audioParam: osc.frequency, label: "Freq" },
        coarse: { value: 0, min: -60, max: 60, label: "Coarse" },
        fine: { value: 0, min: -50, max: 50, label: "Fine" },
        kbt: { value: 1, min: 0, max: 2, label: "KBT" },
        waveform: { value: "sawtooth", options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" },
        fmDepth: { value: 0, min: 0, max: 1000, audioParam: fmGain.gain, label: "FM Depth", curve: "II" },
        level: { value: 0.8, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createOscC(id) {
    // Spec §2.4 OscC: sine-only master oscillator with AM and FMA.
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 220;
    osc.start();

    const gain = this.ctx.createGain();
    const slaveGain = this.ctx.createGain();
    const fmGain = this.ctx.createGain();
    gain.gain.value = 0.6;
    slaveGain.gain.value = 0.6;
    fmGain.gain.value = 0;
    osc.connect(gain);
    osc.connect(slaveGain);
    fmGain.connect(osc.frequency);

    return {
      id, type: "OscC", node: osc, outputNode: gain,
      outputs: { Out: gain, Slv: slaveGain },
      inputs: { PitchMod: osc.frequency, FMA: fmGain, AM: gain.gain },
      _nodes: [osc, gain, slaveGain, fmGain],
      _slaveTargets: [],
      _frequency: 220,
      params: {
        frequency: { value: 220, min: 20, max: 8000, audioParam: osc.frequency, label: "Freq" },
        coarse: { value: 0, min: -64, max: 64, label: "Coarse" },
        fine: { value: 0, min: -50, max: 50, label: "Fine" },
        kbt: { value: 1, min: 0, max: 2, label: "KBT" },
        fmDepth: { value: 0, min: 0, max: 1000, audioParam: fmGain.gain, label: "FM Dep", curve: "II" },
        level: { value: 0.6, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createSpectralOsc(id) {
    const ctx = this.ctx;
    const PARTIAL_COUNT = 8;
    const output = ctx.createGain();
    const slvOut = ctx.createConstantSource();
    output.gain.value = 0.5;
    slvOut.offset.value = 220;
    slvOut.start();

    const freqSrc = ctx.createConstantSource();
    freqSrc.offset.value = 220;
    freqSrc.start();

    const fmGain = ctx.createGain();
    fmGain.gain.value = 0;

    // Upper-partials bus: partials 2..N feed here, gain set by spectralShape and modulated by ShapeMod
    const partialBus = ctx.createGain();
    partialBus.gain.value = 0.4;
    partialBus.connect(output);

    const partials = [];
    for (let i = 0; i < PARTIAL_COUNT; i++) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 220 * (i + 1);
      const partialFreqSrc = ctx.createGain();
      partialFreqSrc.gain.value = i + 1;
      freqSrc.connect(partialFreqSrc);
      partialFreqSrc.connect(osc.frequency);
      // FMA contributes to every partial, scaled by ratio (preserves harmonic stack under FM)
      const partialFmGain = ctx.createGain();
      partialFmGain.gain.value = i + 1;
      fmGain.connect(partialFmGain);
      partialFmGain.connect(osc.frequency);
      const g = ctx.createGain();
      // Per-partial rolloff stays constant; shapeBus gates them collectively
      const rolloff = i === 0 ? 1 : 1 / Math.sqrt(i + 1);
      g.gain.value = rolloff;
      osc.connect(g);
      // Fundamental routes direct to output; upper partials route through shape bus
      g.connect(i === 0 ? output : partialBus);
      osc.start();
      partials.push({ osc, gain: g, partialFreqSrc, partialFmGain, rolloff });
    }

    const mod = {
      id, type: "SpectralOsc", node: partials[0].osc, outputNode: output,
      outputs: { Out: output, Slv: slvOut },
      inputs: { PitchMod1: freqSrc.offset, PitchMod2: freqSrc.offset, FMA: fmGain, ShapeMod: partialBus.gain },
      _nodes: [output, slvOut, freqSrc, fmGain, partialBus,
        ...partials.flatMap(p => [p.osc, p.gain, p.partialFreqSrc, p.partialFmGain])],
      _slaveTargets: [],
      _frequency: 220,
      _partials: partials,
      _freqSrc: freqSrc,
      _slvOut: slvOut,
      _partialBus: partialBus,
      params: {
        frequency: { value: 220, min: 20, max: 8000, label: "Freq" },
        coarse: { value: 0, min: -24, max: 24, label: "Coarse" },
        fine: { value: 0, min: -100, max: 100, label: "Fine" },
        kbt: { value: "on", options: ["on", "off"], label: "KBT" },
        spectralShape: { value: 0.4, min: 0, max: 1, audioParam: partialBus.gain, label: "Shape" },
        partialsMode: { value: "all", options: ["all", "odd"], label: "Parts" },
        fmDepth: { value: 0, min: 0, max: 1000, audioParam: fmGain.gain, label: "FM Dep", curve: "II" },
        level: { value: 0.5, min: 0, max: 1, audioParam: output.gain, label: "Level" },
      },
    };
    mod._recalcSpectralGains = () => {
      const oddOnly = mod.params.partialsMode.value === "odd";
      const now = ctx.currentTime;
      for (let i = 0; i < partials.length; i++) {
        const harmonicNum = i + 1;
        const isEven = harmonicNum % 2 === 0;
        const target = (oddOnly && isEven) ? 0 : partials[i].rolloff;
        partials[i].gain.gain.setValueAtTime(target, now);
      }
    };
    mod._recalcSpectralGains();
    return mod;
  }

  _createPercOsc(id) {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 110;
    osc.start();

    // Body amp envelope
    const bodyGain = this.ctx.createGain();
    bodyGain.gain.value = 0;
    osc.connect(bodyGain);

    // Click: short noise burst
    const bufferSize = this.ctx.sampleRate * 0.5;
    const noiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) nd[i] = Math.random() * 2 - 1;
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;
    const clickFilter = this.ctx.createBiquadFilter();
    clickFilter.type = "highpass";
    clickFilter.frequency.value = 2000;
    const clickGain = this.ctx.createGain();
    clickGain.gain.value = 0;
    noiseSrc.connect(clickFilter);
    clickFilter.connect(clickGain);
    noiseSrc.start();

    // Output stage
    const output = this.ctx.createGain();
    output.gain.value = 0.8;
    bodyGain.connect(output);
    clickGain.connect(output);

    // Trig input: dummy gain receiver (gate-target tracking calls trigger())
    const trigIn = this.ctx.createGain();
    trigIn.gain.value = 0;

    const perc = {
      id, type: "PercOsc", node: osc, outputNode: output,
      outputs: { Out: output },
      inputs: { Trig: trigIn, Amp: output.gain, PitchMod: osc.frequency },
      _nodes: [osc, bodyGain, noiseSrc, clickFilter, clickGain, output, trigIn],
      params: {
        frequency: { value: 110, min: 8, max: 12544, audioParam: osc.frequency, label: "Pitch" },
        fine: { value: 0, min: -50, max: 50, label: "Fine" },
        decay: { value: 0.3, min: 0.005, max: 4, label: "Dec" },
        click: { value: 0.3, min: 0, max: 1, label: "Click" },
        punch: { value: "off", options: ["off", "on"], label: "Punch" },
        level: { value: 0.8, min: 0, max: 1, audioParam: output.gain, label: "Level" },
      },
      trigger: () => {
        const now = this.ctx.currentTime;
        const p = perc.params;
        const baseFreq = p.frequency.value * Math.pow(2, p.fine.value / 1200);
        const punchOn = p.punch.value === "on";

        // Body envelope: instant attack, exponential decay
        bodyGain.gain.cancelScheduledValues(now);
        bodyGain.gain.setValueAtTime(1, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay.value);

        // Pitch: punch adds high-to-low sweep; otherwise straight
        osc.frequency.cancelScheduledValues(now);
        if (punchOn) {
          osc.frequency.setValueAtTime(baseFreq * 4, now);
          osc.frequency.exponentialRampToValueAtTime(Math.max(baseFreq, 1), now + Math.min(0.05, p.decay.value * 0.2));
        } else {
          osc.frequency.setValueAtTime(baseFreq, now);
        }

        // Click: noise burst, ~5-15ms duration scaled by Click knob, tiny exponential decay
        const clickAmt = p.click.value;
        clickGain.gain.cancelScheduledValues(now);
        clickGain.gain.setValueAtTime(clickAmt, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005 + clickAmt * 0.015);
      },
      releaseEnv: () => {
        // Percussive: release is implicit in decay envelope; no-op so gate-target tracking accepts us
      },
    };
    return perc;
  }

  _createNoise(id) {
    const bufferSize = this.ctx.sampleRate * 2;
    const whiteBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const whiteData = whiteBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }
    const pinkBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    _fillPinkBuffer(pinkBuffer.getChannelData(0));
    const source = this.ctx.createBufferSource();
    source.buffer = whiteBuffer;
    source.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.3;
    source.connect(gain);
    source.start();
    return {
      id, type: "Noise", node: source, outputNode: gain,
      outputs: { Out: gain },
      inputs: {},
      _nodes: [source, gain],
      _whiteBuffer: whiteBuffer,
      _pinkBuffer: pinkBuffer,
      params: {
        level: { value: 0.3, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
        color: { value: "white", options: ["white", "pink"], label: "Color" },
      },
    };
  }

  _createDrumSynth(id) {
    // Spec §2.16: dual-osc (master + slave with ratio), noise filter (HP/BP/LP)
    // with sweep, bend section, click. Presets deferred.
    const ctx = this.ctx;

    // Master oscillator (sine)
    const masterOsc = ctx.createOscillator();
    masterOsc.type = "sine";
    masterOsc.frequency.value = 60;
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterOsc.connect(masterGain);
    masterOsc.start();

    // Slave oscillator (sine, frequency = master * ratio at trigger time)
    const slaveOsc = ctx.createOscillator();
    slaveOsc.type = "sine";
    slaveOsc.frequency.value = 60;
    const slaveGain = ctx.createGain();
    slaveGain.gain.value = 0;
    slaveOsc.connect(slaveGain);
    slaveOsc.start();

    // Noise + multimode filter
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) noiseData[i] = Math.random() * 2 - 1;
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 3000;
    noiseFilter.Q.value = 1;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0;
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseSrc.start();

    // Click: short noise burst at attack
    const clickGain = ctx.createGain();
    clickGain.gain.value = 0;
    noiseSrc.connect(clickGain);

    // Mix
    const output = ctx.createGain();
    output.gain.value = 0.8;
    masterGain.connect(output);
    slaveGain.connect(output);
    noiseGain.connect(output);
    clickGain.connect(output);

    const trigIn = ctx.createGain();
    trigIn.gain.value = 0;

    const drum = {
      id, type: "DrumSynth", node: masterOsc, outputNode: output,
      outputs: { Out: output },
      inputs: { Trig: trigIn, VelMod: output.gain, PitchMod: masterOsc.frequency },
      _nodes: [masterOsc, masterGain, slaveOsc, slaveGain, noiseSrc, noiseFilter, noiseGain, clickGain, output, trigIn],
      _noiseFilter: noiseFilter,
      params: {
        masterPitch: { value: 60, min: 20, max: 784, audioParam: masterOsc.frequency, label: "MstPitch" },
        masterDecay: { value: 0.15, min: 0.0005, max: 45, label: "MstDec" },
        masterLevel: { value: 1, min: 0, max: 1, label: "MstLvl" },
        slaveRatio: { value: 1, min: 1, max: 6.26, label: "SlvRatio" },
        slaveDecay: { value: 0.15, min: 0.0005, max: 45, label: "SlvDec" },
        slaveLevel: { value: 0.5, min: 0, max: 1, label: "SlvLvl" },
        filterMode: { value: "BP", options: ["LP", "BP", "HP"], label: "FltMode" },
        filterFreq: { value: 3000, min: 10, max: 15800, audioParam: noiseFilter.frequency, label: "FltFreq" },
        filterRes: { value: 1, min: 0.1, max: 30, audioParam: noiseFilter.Q, label: "FltRes" },
        filterSweep: { value: 0, min: 0, max: 5, label: "FltSweep" },
        filterDecay: { value: 0.05, min: 0.0005, max: 45, label: "FltDec" },
        bendAmt: { value: 0, min: 0, max: 5, label: "BendAmt" },
        bendDecay: { value: 0.04, min: 0.0005, max: 45, label: "BendDcy" },
        click: { value: 0.3, min: 0, max: 1, label: "Click" },
        noiseLevel: { value: 0.5, min: 0, max: 1, label: "NsLvl" },
        level: { value: 0.8, min: 0, max: 1, audioParam: output.gain, label: "Level" },
      },
      trigger: () => {
        const now = ctx.currentTime;
        const p = drum.params;
        const masterFreq = p.masterPitch.value;
        const slaveFreq = masterFreq * p.slaveRatio.value;
        const bendMul = Math.pow(2, p.bendAmt.value);

        // Master osc: pitch bend down + amplitude decay
        masterOsc.frequency.cancelScheduledValues(now);
        masterOsc.frequency.setValueAtTime(masterFreq * bendMul, now);
        masterOsc.frequency.exponentialRampToValueAtTime(Math.max(masterFreq, 1), now + p.bendDecay.value);
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(p.masterLevel.value, now);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + p.masterDecay.value);

        // Slave osc: same bend ratio applied; ratio of master pitch
        slaveOsc.frequency.cancelScheduledValues(now);
        slaveOsc.frequency.setValueAtTime(slaveFreq * bendMul, now);
        slaveOsc.frequency.exponentialRampToValueAtTime(Math.max(slaveFreq, 1), now + p.bendDecay.value);
        slaveGain.gain.cancelScheduledValues(now);
        slaveGain.gain.setValueAtTime(p.slaveLevel.value, now);
        slaveGain.gain.exponentialRampToValueAtTime(0.0001, now + p.slaveDecay.value);

        // Noise filter: cutoff sweep from (set freq * 2^sweep) down to set freq, gain decays
        const sweepMul = Math.pow(2, p.filterSweep.value);
        noiseFilter.frequency.cancelScheduledValues(now);
        noiseFilter.frequency.setValueAtTime(p.filterFreq.value * sweepMul, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(Math.max(p.filterFreq.value, 10), now + p.filterDecay.value);
        noiseGain.gain.cancelScheduledValues(now);
        noiseGain.gain.setValueAtTime(p.noiseLevel.value, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + p.filterDecay.value);

        // Click: short unfiltered noise burst, scaled by Click knob
        clickGain.gain.cancelScheduledValues(now);
        clickGain.gain.setValueAtTime(p.click.value, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005 + p.click.value * 0.015);
      },
      releaseEnv: () => {},
    };
    return drum;
  }

  _createFormantOsc(id) {
    const FORMANT_TABLE = {
      A: [800, 1200, 2500],
      E: [400, 1800, 2500],
      I: [300, 2300, 3000],
      O: [500, 1000, 2500],
      U: [350, 600, 2500],
    };

    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 150;
    osc.start();

    // 3 formant bandpass filters
    const filters = [];
    const filterGains = [];
    const output = this.ctx.createGain();
    output.gain.value = 0.5;

    for (let i = 0; i < 3; i++) {
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = FORMANT_TABLE.A[i];
      f.Q.value = 10;
      const g = this.ctx.createGain();
      g.gain.value = 1 / 3;
      osc.connect(f);
      f.connect(g);
      g.connect(output);
      filters.push(f);
      filterGains.push(g);
    }

    // Slv output: ConstantSource carrying the master pitch for slave oscillators
    const slvOut = this.ctx.createConstantSource();
    slvOut.offset.value = 150;
    slvOut.start();

    const mod = {
      id, type: "FormantOsc", node: osc, outputNode: output,
      outputs: { Out: output, Slv: slvOut },
      // PitchMod is a legacy alias for PitchMod1; preserves load of patches saved before split
      inputs: { PitchMod1: osc.frequency, PitchMod2: osc.frequency, PitchMod: osc.frequency },
      _nodes: [osc, ...filters, ...filterGains, output, slvOut],
      _slaveTargets: [],
      _frequency: 150,
      _slvOut: slvOut,
      _filters: filters,
      _formantTable: FORMANT_TABLE,
      params: {
        frequency: { value: 150, min: 20, max: 8000, audioParam: osc.frequency, label: "Freq" },
        coarse: { value: 0, min: -64, max: 64, label: "Coarse" },
        fine: { value: 0, min: -50, max: 50, label: "Fine" },
        kbt: { value: 1, min: 0, max: 2, label: "KBT" },
        vowel: { value: "A", options: ["A", "E", "I", "O", "U"], label: "Vowel" },
        timbre: { value: 0, min: 0, max: 1, label: "Timbre" },
        level: { value: 0.5, min: 0, max: 1, audioParam: output.gain, label: "Level" },
      },
    };
    return mod;
  }

  // ── Master / Slave Oscillators ──────────────────────────────────────────

  _createMasterOsc(id) {
    // Pitch-only controller, no audio output
    const slvOut = this.ctx.createConstantSource();
    slvOut.offset.value = 220;
    slvOut.start();
    return {
      id, type: "MasterOsc", node: slvOut, outputNode: slvOut,
      outputs: { Slv: slvOut },
      inputs: { PitchMod1: slvOut.offset, PitchMod2: slvOut.offset },
      _nodes: [slvOut],
      _slaveTargets: [], // { moduleId, mod } — slaves connected to Slv output
      _frequency: 220,
      params: {
        frequency: { value: 220, min: 20, max: 8000, label: "Freq" },
        coarse: { value: 0, min: -64, max: 64, label: "Coarse" },
        fine: { value: 0, min: -50, max: 50, label: "Fine" },
        kbt: { value: "on", options: ["on", "off"], label: "KBT" },
      },
    };
  }

  _makeSlaveOsc(id, type, waveform, modInputDefs) {
    // Shared slave oscillator factory
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = waveform;
    osc.frequency.value = 220;
    gain.gain.value = 0.8;
    osc.connect(gain);
    osc.start();

    const inputs = { Mst: null }; // Virtual input — handled in connect()
    const modGains = {};
    if (modInputDefs.FMA) {
      const fmGain = this.ctx.createGain();
      fmGain.gain.value = 0;
      fmGain.connect(osc.frequency);
      inputs.FMA = fmGain;
      modGains._fmGain = fmGain;
    }
    if (modInputDefs.FMB) {
      const fmGain = this.ctx.createGain();
      fmGain.gain.value = 0;
      fmGain.connect(osc.frequency);
      inputs.FMB = fmGain;
      modGains._fmGain = fmGain;
    }
    if (modInputDefs.AM) {
      inputs.AM = gain.gain;
    }
    if (modInputDefs.PwMod) {
      const pwGain = this.ctx.createGain();
      pwGain.gain.value = 0;
      inputs.PwMod = pwGain;
      modGains._pwGain = pwGain;
    }

    const params = {
      partials: { value: 1, min: 0.03125, max: 32, label: "Partials" },
      detune: { value: 0, min: -24, max: 24, label: "Detune" },
      fine: { value: 0, min: -50, max: 50, label: "Fine" },
      level: { value: 0.8, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
    };
    if (modInputDefs.FMA || modInputDefs.FMB) {
      params.fmDepth = { value: 0, min: 0, max: 1000, audioParam: modGains._fmGain?.gain, label: "FM Dep", curve: "II" };
    }
    if (waveform === "square" || type === "OscSlvA") {
      params.waveform = type === "OscSlvA"
        ? { value: waveform, options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" }
        : undefined;
    }
    if (type === "OscSlvFM") {
      params.octShift = { value: 0, min: -3, max: 3, label: "Oct" };
    }
    // Clean undefined params
    Object.keys(params).forEach(k => { if (params[k] === undefined) delete params[k]; });

    const allNodes = [osc, gain, ...Object.values(modGains)].filter(Boolean);
    return {
      id, type, node: osc, outputNode: gain,
      outputs: { Out: gain },
      inputs,
      _nodes: allNodes,
      _masterFreq: 0,
      _masterModId: null,
      _recalcFreq() {
        if (!this._masterFreq) return;
        const p = this.params;
        const partial = p.partials.value;
        const det = p.detune.value;
        const fn = p.fine.value;
        const octShift = p.octShift ? p.octShift.value : 0;
        const freq = this._masterFreq * partial * Math.pow(2, det / 12) * Math.pow(2, fn / 1200) * Math.pow(2, octShift);
        osc.frequency.setValueAtTime(freq, osc.context.currentTime);
      },
      params,
    };
  }

  _makeSyncSlaveOsc(id, type, waveform, modInputDefs) {
    // Slave factory using sync-osc-processor (Sync input + selectable waveform).
    const osc = new AudioWorkletNode(this.ctx, 'sync-osc-processor', { numberOfInputs: 1 });
    const freqParam = osc.parameters.get('frequency');
    const waveParam = osc.parameters.get('waveform');
    freqParam.value = 220;
    waveParam.value = WAVE_INT[waveform] ?? WAVE_INT.sawtooth;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.8;
    osc.connect(gain);

    const inputs = { Mst: null, Sync: osc };
    const modGains = {};
    if (modInputDefs.FMA) {
      const fmGain = this.ctx.createGain();
      fmGain.gain.value = 0;
      fmGain.connect(freqParam);
      inputs.FMA = fmGain;
      modGains._fmGain = fmGain;
    }
    if (modInputDefs.FMB) {
      const fmGain = this.ctx.createGain();
      fmGain.gain.value = 0;
      fmGain.connect(freqParam);
      inputs.FMB = fmGain;
      modGains._fmGain = fmGain;
    }
    if (modInputDefs.AM) {
      inputs.AM = gain.gain;
    }

    const params = {
      partials: { value: 1, min: 0.03125, max: 32, label: "Partials" },
      detune: { value: 0, min: -24, max: 24, label: "Detune" },
      fine: { value: 0, min: -50, max: 50, label: "Fine" },
      level: { value: 0.8, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
    };
    if (modInputDefs.FMA || modInputDefs.FMB) {
      params.fmDepth = { value: 0, min: 0, max: 1000, audioParam: modGains._fmGain.gain, label: "FM Dep", curve: "II" };
    }
    if (type === "OscSlvA") {
      params.waveform = { value: waveform, options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" };
    }
    if (type === "OscSlvFM") {
      params.octShift = { value: 0, min: -3, max: 3, label: "Oct" };
    }

    const allNodes = [osc, gain, ...Object.values(modGains)];
    return {
      id, type, node: osc, outputNode: gain,
      outputs: { Out: gain },
      inputs,
      _nodes: allNodes,
      _masterFreq: 0,
      _masterModId: null,
      _freqParam: freqParam,
      _recalcFreq() {
        if (!this._masterFreq) return;
        const p = this.params;
        const partial = p.partials.value;
        const det = p.detune.value;
        const fn = p.fine.value;
        const octShift = p.octShift ? p.octShift.value : 0;
        const freq = this._masterFreq * partial * Math.pow(2, det / 12) * Math.pow(2, fn / 1200) * Math.pow(2, octShift);
        this._freqParam.setValueAtTime(freq, osc.context.currentTime);
      },
      params,
    };
  }

  _createOscSlvA(id) {
    return this._makeSyncSlaveOsc(id, "OscSlvA", "sawtooth", { FMA: true, AM: true });
  }
  _createOscSlvB(id) {
    const pulse = new AudioWorkletNode(this.ctx, 'pulse-processor');
    pulse.parameters.get('frequency').value = 220;
    pulse.parameters.get('pulseWidth').value = 0.5;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.8;
    pulse.connect(gain);
    return {
      id, type: "OscSlvB", node: pulse, outputNode: gain,
      outputs: { Out: gain },
      inputs: { Mst: null, PwMod: pulse.parameters.get('pulseWidth') },
      _nodes: [pulse, gain],
      _masterFreq: 0,
      _masterModId: null,
      _recalcFreq() {
        if (!this._masterFreq) return;
        const p = this.params;
        const freq = this._masterFreq * p.partials.value
          * Math.pow(2, p.detune.value / 12)
          * Math.pow(2, p.fine.value / 1200);
        pulse.parameters.get('frequency').setValueAtTime(freq, pulse.context.currentTime);
      },
      params: {
        partials: { value: 1, min: 0.03125, max: 32, label: "Partials" },
        detune: { value: 0, min: -24, max: 24, label: "Detune" },
        fine: { value: 0, min: -50, max: 50, label: "Fine" },
        pulseWidth: { value: 0.5, min: 0.01, max: 0.99, audioParam: pulse.parameters.get('pulseWidth'), label: "PW" },
        level: { value: 0.8, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }
  _createOscSlvC(id) {
    return this._makeSlaveOsc(id, "OscSlvC", "sawtooth", { FMA: true });
  }
  _createOscSlvD(id) {
    return this._makeSlaveOsc(id, "OscSlvD", "triangle", { FMA: true });
  }
  _createOscSlvE(id) {
    return this._makeSlaveOsc(id, "OscSlvE", "sine", { FMA: true, AM: true });
  }
  _createOscSlvFM(id) {
    return this._makeSyncSlaveOsc(id, "OscSlvFM", "sine", { FMB: true });
  }

  _createOscSineBank(id) {
    const output = this.ctx.createGain();
    output.gain.value = 0.6;
    // Sync fan-out: a single Sync input connects here; we route to all 6 worklets
    const syncFanOut = this.ctx.createGain();
    syncFanOut.gain.value = 1;
    // MixIn: external audio mixed straight into output bus
    const mixInGain = this.ctx.createGain();
    mixInGain.gain.value = 1;
    mixInGain.connect(output);

    const oscs = [];
    const gains = [];
    const freqParams = [];
    const inputs = { Mst: null, Sync: syncFanOut, MixIn: mixInGain };
    const params = {};

    for (let i = 0; i < 6; i++) {
      const n = i + 1;
      const osc = new AudioWorkletNode(this.ctx, 'sync-osc-processor', { numberOfInputs: 1 });
      const fp = osc.parameters.get('frequency');
      fp.value = 220 * n;
      osc.parameters.get('waveform').value = WAVE_INT.sine;
      const g = this.ctx.createGain();
      g.gain.value = i === 0 ? 1 : 0.5 / n;
      osc.connect(g);
      g.connect(output);
      syncFanOut.connect(osc);
      oscs.push(osc);
      gains.push(g);
      freqParams.push(fp);
      inputs[`AM${n}`] = g.gain;
      params[`tune${n}`] = { value: n, min: 0.03125, max: 32, label: `Tune${n}` };
      params[`fine${n}`] = { value: 0, min: -50, max: 50, label: `Fine${n}` };
      params[`level${n}`] = { value: i === 0 ? 1 : +(0.5 / n).toFixed(2), min: 0, max: 1, audioParam: g.gain, label: `Lvl${n}` };
    }

    return {
      id, type: "OscSineBank", node: oscs[0], outputNode: output,
      outputs: { Out: output },
      inputs,
      _nodes: [...oscs, ...gains, output, syncFanOut, mixInGain],
      _oscs: oscs,
      _freqParams: freqParams,
      _masterFreq: 0,
      _masterModId: null,
      _recalcFreq() {
        if (!this._masterFreq) return;
        const p = this.params;
        const now = oscs[0].context.currentTime;
        for (let i = 0; i < 6; i++) {
          const n = i + 1;
          const tune = p[`tune${n}`].value;
          const fine = p[`fine${n}`].value;
          const freq = this._masterFreq * tune * Math.pow(2, fine / 1200);
          freqParams[i].setValueAtTime(freq, now);
        }
      },
      params: {
        ...params,
        masterLevel: { value: 0.6, min: 0, max: 1, audioParam: output.gain, label: "MstLvl" },
      },
    };
  }

  _propagateToSlaves(masterMod) {
    if (!masterMod._slaveTargets) return;
    masterMod._slaveTargets.forEach(({ moduleId }) => {
      const slaveMod = this.modules.get(moduleId);
      if (slaveMod) {
        slaveMod._masterFreq = masterMod._frequency;
        if (slaveMod._recalcFreq) slaveMod._recalcFreq();
      }
    });
  }

  // ── Filters ──────────────────────────────────────────────────────────────

  _createFilter(id) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    filter.Q.value = 4;
    return {
      id, type: "Filter", node: filter, outputNode: filter,
      outputs: { Out: filter },
      inputs: { In: filter, FreqMod: filter.frequency, ResMod: filter.Q },
      _nodes: [filter],
      params: {
        frequency: { value: 1200, min: 10, max: 15800, audioParam: filter.frequency, label: "Freq" },
        resonance: { value: 4, min: 0.1, max: 30, audioParam: filter.Q, label: "Res" },
        filterType: { value: "lowpass", options: ["lowpass", "highpass", "bandpass", "notch"], label: "Type" },
      },
    };
  }

  _createFilterC(id) {
    // 3 parallel filters sharing the same input
    const input = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    const bp = this.ctx.createBiquadFilter();
    const hp = this.ctx.createBiquadFilter();
    lp.type = "lowpass"; bp.type = "bandpass"; hp.type = "highpass";
    [lp, bp, hp].forEach(f => { f.frequency.value = 1200; f.Q.value = 4; });
    input.connect(lp); input.connect(bp); input.connect(hp);
    return {
      id, type: "FilterC", node: input, outputNode: lp,
      outputs: { LP: lp, BP: bp, HP: hp },
      inputs: { In: input, FreqMod: lp.frequency, ResMod: lp.Q },
      _nodes: [input, lp, bp, hp],
      _filters: [lp, bp, hp],
      params: {
        frequency: { value: 1200, min: 10, max: 15800, audioParam: lp.frequency, label: "Freq" },
        resonance: { value: 4, min: 0.1, max: 30, audioParam: lp.Q, label: "Res" },
        gainComp: { value: "off", options: ["off", "on"], label: "GComp" },
      },
    };
  }

  _createFilterE(id) {
    const filter1 = this.ctx.createBiquadFilter();
    const filter2 = this.ctx.createBiquadFilter();
    filter1.type = "lowpass"; filter2.type = "lowpass";
    filter1.frequency.value = 1200; filter2.frequency.value = 1200;
    filter1.Q.value = 4; filter2.Q.value = 4;
    // Default 12dB: only filter1 active, filter2 bypassed
    const input = this.ctx.createGain();
    const output = this.ctx.createGain();
    input.connect(filter1);
    filter1.connect(output);
    // For 24dB, will rewire: input -> filter1 -> filter2 -> output
    return {
      id, type: "FilterE", node: input, outputNode: output,
      outputs: { Out: output },
      inputs: { In: input, FreqMod1: filter1.frequency, FreqMod2: filter2.frequency, ResMod: filter1.Q },
      _nodes: [input, filter1, filter2, output],
      _filter1: filter1, _filter2: filter2, _output: output,
      _slope: "12dB",
      params: {
        frequency: { value: 1200, min: 10, max: 15800, audioParam: filter1.frequency, label: "Freq" },
        resonance: { value: 4, min: 0.1, max: 30, audioParam: filter1.Q, label: "Res" },
        filterType: { value: "lowpass", options: ["lowpass", "highpass", "bandpass", "notch"], label: "Type" },
        slope: { value: "12dB", options: ["12dB", "24dB"], label: "Slope" },
        gainComp: { value: "off", options: ["off", "on"], label: "GComp" },
      },
    };
  }

  // ── Modulators ───────────────────────────────────────────────────────────

  _createEnvelope(id) {
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    const env = {
      id, type: "Envelope", node: gain, outputNode: gain,
      outputs: { Out: gain },
      inputs: { In: gain },
      _nodes: [gain],
      params: {
        attack: { value: 0.01, min: 0.001, max: 4, label: "Atk" },
        decay: { value: 0.2, min: 0.001, max: 4, label: "Dec" },
        sustain: { value: 0.6, min: 0, max: 1, label: "Sus" },
        release: { value: 0.5, min: 0.001, max: 8, label: "Rel" },
      },
      trigger: () => {
        const now = this.ctx.currentTime;
        const a = env.params.attack.value;
        const d = env.params.decay.value;
        const s = env.params.sustain.value;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + a);
        gain.gain.linearRampToValueAtTime(s, now + a + d);
      },
      releaseEnv: () => {
        const now = this.ctx.currentTime;
        const r = env.params.release.value;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + r);
      },
    };
    return env;
  }

  _createADSREnv(id) {
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    // Gate input: a GainNode that acts as a trigger receiver
    const gateIn = this.ctx.createGain();
    gateIn.gain.value = 0;
    const retrigIn = this.ctx.createGain();
    retrigIn.gain.value = 0;

    const env = {
      id, type: "ADSREnv", node: gain, outputNode: gain,
      outputs: { Out: gain },
      inputs: { In: gain, Gate: gateIn, Retrig: retrigIn },
      _nodes: [gain, gateIn, retrigIn],
      params: {
        attack: { value: 0.01, min: 0.001, max: 4, label: "Atk" },
        decay: { value: 0.2, min: 0.001, max: 4, label: "Dec" },
        sustain: { value: 0.6, min: 0, max: 1, label: "Sus" },
        release: { value: 0.5, min: 0.001, max: 8, label: "Rel" },
        attackCurve: { value: "lin", options: ["lin", "log", "exp"], label: "AtkC" },
        decayCurve: { value: "lin", options: ["lin", "log", "exp"], label: "DecC" },
        releaseCurve: { value: "lin", options: ["lin", "log", "exp"], label: "RelC" },
      },
      trigger: () => {
        const now = this.ctx.currentTime;
        const p = env.params;
        const a = p.attack.value;
        const d = p.decay.value;
        const s = p.sustain.value;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
        // Attack
        if (p.attackCurve.value === "exp") {
          gain.gain.exponentialRampToValueAtTime(1, now + a);
        } else {
          gain.gain.linearRampToValueAtTime(1, now + a);
        }
        // Decay
        if (p.decayCurve.value === "exp") {
          gain.gain.exponentialRampToValueAtTime(Math.max(s, 0.001), now + a + d);
        } else {
          gain.gain.linearRampToValueAtTime(s, now + a + d);
        }
      },
      releaseEnv: () => {
        const now = this.ctx.currentTime;
        const p = env.params;
        const r = p.release.value;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        if (p.releaseCurve.value === "exp") {
          gain.gain.exponentialRampToValueAtTime(0.001, now + r);
          gain.gain.setValueAtTime(0, now + r + 0.001);
        } else {
          gain.gain.linearRampToValueAtTime(0, now + r);
        }
      },
    };
    return env;
  }

  _createLFO(id) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 2;
    gain.gain.value = 100;
    osc.connect(gain);
    osc.start();
    return {
      id, type: "LFO", node: osc, outputNode: gain,
      outputs: { Out: gain },
      inputs: {},
      _nodes: [osc, gain],
      params: {
        rate: { value: 2, min: 0.05, max: 40, audioParam: osc.frequency, label: "Rate" },
        amount: { value: 100, min: 0, max: 2000, audioParam: gain.gain, label: "Amt" },
        waveform: { value: "sine", options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" },
      },
    };
  }

  _createLFOA(id) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const slaveGain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 2;
    gain.gain.value = 100;
    slaveGain.gain.value = 100;
    osc.connect(gain);
    osc.connect(slaveGain);
    osc.start();

    // Reset input: a GainNode used as a signal receiver
    const rstIn = this.ctx.createGain();
    rstIn.gain.value = 0;

    return {
      id, type: "LFOA", node: osc, outputNode: gain,
      outputs: { Out: gain, SlvOut: slaveGain },
      inputs: { Rst: rstIn, RateMod: osc.frequency },
      _nodes: [osc, gain, slaveGain, rstIn],
      _rangeMultiplier: 1,
      params: {
        rate: { value: 2, min: 0.05, max: 40, audioParam: osc.frequency, label: "Rate" },
        amount: { value: 100, min: 0, max: 2000, audioParam: gain.gain, label: "Amt" },
        waveform: { value: "sine", options: ["sine", "sawtooth", "square", "triangle", "random"], label: "Wave" },
        range: { value: "hi", options: ["hi", "lo", "sub"], label: "Range" },
        phase: { value: 0, min: 0, max: 360, label: "Phase" },
      },
    };
  }

  _createClkGen(id) {
    // Clock outputs as ConstantSourceNodes that pulse
    const clk24 = this.ctx.createConstantSource();
    const clk4 = this.ctx.createConstantSource();
    const sync = this.ctx.createConstantSource();
    clk24.offset.value = 0;
    clk4.offset.value = 0;
    sync.offset.value = 0;
    clk24.start(); clk4.start(); sync.start();

    const clk = {
      id, type: "ClkGen", node: clk24, outputNode: clk24,
      outputs: { Clk24: clk24, Clk4: clk4, Sync: sync },
      inputs: {},
      _nodes: [clk24, clk4, sync],
      _timerId: null,
      _tickCount: 0,
      _active: true,
      _clockSubscribers: [],
      _resetSubscribers: [],
      params: {
        bpm: { value: 120, min: 24, max: 214, label: "BPM" },
        active: { value: "on", options: ["on", "off"], label: "Active" },
      },
    };

    // Start clock scheduler
    const schedule = () => {
      if (!clk._active || clk.params.active.value === "off") {
        clk._timerId = setTimeout(schedule, 100);
        return;
      }
      const bpm = clk.params.bpm.value;
      const interval = 60 / (bpm * 24); // 24 PPQN
      const now = this.ctx.currentTime;
      const pulseLen = 0.005;

      // Clk24 pulse
      clk24.offset.setValueAtTime(1, now);
      clk24.offset.setValueAtTime(0, now + pulseLen);

      clk._tickCount++;
      // Clk4 = every 6 ticks (quarter note at 24 PPQN)
      if (clk._tickCount % 6 === 0) {
        clk4.offset.setValueAtTime(1, now);
        clk4.offset.setValueAtTime(0, now + pulseLen);
        // Notify clock subscribers on quarter note
        if (clk._clockSubscribers) {
          clk._clockSubscribers.forEach(({ moduleId }) => {
            const sub = this.modules.get(moduleId);
            if (sub && sub.clockTick) sub.clockTick();
          });
        }
      }
      // Sync = every 24 ticks (one bar at 24 PPQN, assuming 4/4)
      if (clk._tickCount % 24 === 0) {
        sync.offset.setValueAtTime(1, now);
        sync.offset.setValueAtTime(0, now + pulseLen);
        // Notify reset subscribers on bar
        if (clk._resetSubscribers) {
          clk._resetSubscribers.forEach(({ moduleId }) => {
            const sub = this.modules.get(moduleId);
            if (sub && sub.resetSeq) sub.resetSeq();
          });
        }
        clk._tickCount = 0;
      }

      clk._timerId = setTimeout(schedule, interval * 1000);
    };
    schedule();

    return clk;
  }

  _createRandomGen(id) {
    // Looping random buffer
    const bufferSize = this.ctx.sampleRate; // 1 second
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = 1;

    // Smoothing filter
    const smooth = this.ctx.createBiquadFilter();
    smooth.type = "lowpass";
    smooth.frequency.value = 5;
    smooth.Q.value = 0.5;

    const gain = this.ctx.createGain();
    gain.gain.value = 100;
    source.connect(smooth);
    smooth.connect(gain);
    source.start();

    return {
      id, type: "RandomGen", node: source, outputNode: gain,
      outputs: { Out: gain },
      inputs: {},
      _nodes: [source, smooth, gain],
      params: {
        rate: { value: 1, min: 0.1, max: 20, audioParam: source.playbackRate, label: "Rate" },
        smoothing: { value: 5, min: 0.5, max: 100, audioParam: smooth.frequency, label: "Smooth" },
        amount: { value: 100, min: 0, max: 2000, audioParam: gain.gain, label: "Amt" },
      },
    };
  }

  _createPortamentoA(id) {
    // Slew limiter using lowpass filter
    // Signal passes through: input → filter → output
    const input = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 20; // Low cutoff = slow glide
    filter.Q.value = 0.5;
    const output = this.ctx.createGain();
    input.connect(filter);
    filter.connect(output);

    return {
      id, type: "PortamentoA", node: input, outputNode: output,
      outputs: { Out: output },
      inputs: { In: input },
      _nodes: [input, filter, output],
      params: {
        time: { value: 0.1, min: 0.0053, max: 1.355, label: "Time" },
        level: { value: 1, min: 0, max: 1, audioParam: output.gain, label: "Level" },
      },
    };
  }

  // ── Sequencers ───────────────────────────────────────────────────────────

  _createEventSeq(id) {
    const out1 = this.ctx.createConstantSource();
    const out2 = this.ctx.createConstantSource();
    out1.offset.value = 0; out2.offset.value = 0;
    out1.start(); out2.start();

    const seq = {
      id, type: "EventSeq", node: out1, outputNode: out1,
      outputs: { Out1: out1, Out2: out2 },
      inputs: { Clk: null, Rst: null }, // Virtual — handled by clock subscriber
      _nodes: [out1, out2],
      _triggers1: new Array(16).fill(false),
      _triggers2: new Array(16).fill(false),
      _currentStep: 0,
      _stepCount: 16,
      _gateTargetEnvelopes1: [],
      _gateTargetEnvelopes2: [],
      params: {
        steps: { value: 16, min: 1, max: 16, label: "Steps" },
      },
      clockTick: () => {
        const step = seq._currentStep;
        const now = this.ctx.currentTime;
        const pulseLen = 0.01;
        if (seq._triggers1[step]) {
          out1.offset.setValueAtTime(1, now);
          out1.offset.setValueAtTime(0, now + pulseLen);
          seq._gateTargetEnvelopes1.forEach(envId => {
            const envMod = this.modules.get(envId);
            if (envMod && envMod.trigger) envMod.trigger();
            if (envMod && envMod.releaseEnv) setTimeout(() => envMod.releaseEnv(), pulseLen * 1000 + 10);
          });
        }
        if (seq._triggers2[step]) {
          out2.offset.setValueAtTime(1, now);
          out2.offset.setValueAtTime(0, now + pulseLen);
          seq._gateTargetEnvelopes2.forEach(envId => {
            const envMod = this.modules.get(envId);
            if (envMod && envMod.trigger) envMod.trigger();
            if (envMod && envMod.releaseEnv) setTimeout(() => envMod.releaseEnv(), pulseLen * 1000 + 10);
          });
        }
        seq._currentStep = (step + 1) % seq.params.steps.value;
      },
      resetSeq: () => { seq._currentStep = 0; },
    };
    return seq;
  }

  _createCtrlSeq(id) {
    const out = this.ctx.createConstantSource();
    out.offset.value = 0;
    out.start();

    const seq = {
      id, type: "CtrlSeq", node: out, outputNode: out,
      outputs: { Out: out },
      inputs: { Clk: null, Rst: null },
      _nodes: [out],
      _values: new Array(16).fill(0),
      _currentStep: 0,
      _stepCount: 16,
      params: {
        steps: { value: 16, min: 1, max: 16, label: "Steps" },
      },
      clockTick: () => {
        const step = seq._currentStep;
        const val = seq._values[step];
        out.offset.setValueAtTime(val, this.ctx.currentTime);
        seq._currentStep = (step + 1) % seq.params.steps.value;
      },
      resetSeq: () => { seq._currentStep = 0; },
    };
    return seq;
  }

  _createNoteSeqA(id) {
    const noteOut = this.ctx.createConstantSource();
    const gateOut = this.ctx.createConstantSource();
    noteOut.offset.value = 0; gateOut.offset.value = 0;
    noteOut.start(); gateOut.start();

    const seq = {
      id, type: "NoteSeqA", node: noteOut, outputNode: noteOut,
      outputs: { Note: noteOut, Gate: gateOut },
      inputs: { Clk: null, Rst: null },
      _nodes: [noteOut, gateOut],
      _pitchValues: [60,62,64,65,67,69,71,72,60,62,64,65,67,69,71,72],
      _gatePattern: new Array(16).fill(true),
      _currentStep: 0,
      _stepCount: 16,
      _gateTargetEnvelopes: [],
      _pitchTargets: [],
      params: {
        steps: { value: 16, min: 1, max: 16, label: "Steps" },
      },
      clockTick: () => {
        const step = seq._currentStep;
        const midi = seq._pitchValues[step];
        const freq = NOTE_FREQ(midi);
        const now = this.ctx.currentTime;
        const gateOn = seq._gatePattern[step];
        noteOut.offset.setValueAtTime(freq, now);
        // Set pitch targets directly; propagate to slaves when target is a master osc
        seq._pitchTargets.forEach(({ audioParam, moduleId }) => {
          audioParam.setValueAtTime(freq, now);
          const targetMod = this.modules.get(moduleId);
          if (targetMod && targetMod._slaveTargets) {
            targetMod._frequency = freq;
            this._propagateToSlaves(targetMod);
          }
        });
        if (gateOn) {
          gateOut.offset.setValueAtTime(1, now);
          gateOut.offset.setValueAtTime(0, now + 0.05);
          seq._gateTargetEnvelopes.forEach(envId => {
            const envMod = this.modules.get(envId);
            if (envMod && envMod.trigger) envMod.trigger();
            if (envMod && envMod.releaseEnv) setTimeout(() => envMod.releaseEnv(), 60);
          });
        } else {
          gateOut.offset.setValueAtTime(0, now);
        }
        seq._currentStep = (step + 1) % seq.params.steps.value;
      },
      resetSeq: () => { seq._currentStep = 0; },
    };
    return seq;
  }

  _createNoteSeqB(id) {
    // Same audio engine as NoteSeqA, different type for UI
    const noteOut = this.ctx.createConstantSource();
    const gateOut = this.ctx.createConstantSource();
    noteOut.offset.value = 0; gateOut.offset.value = 0;
    noteOut.start(); gateOut.start();

    const seq = {
      id, type: "NoteSeqB", node: noteOut, outputNode: noteOut,
      outputs: { Note: noteOut, Gate: gateOut },
      inputs: { Clk: null, Rst: null },
      _nodes: [noteOut, gateOut],
      _pitchValues: [60,62,64,65,67,69,71,72,60,62,64,65,67,69,71,72],
      _gatePattern: new Array(16).fill(true),
      _currentStep: 0,
      _stepCount: 16,
      _gateTargetEnvelopes: [],
      _pitchTargets: [],
      params: {
        steps: { value: 16, min: 1, max: 16, label: "Steps" },
        baseOctave: { value: 3, min: 1, max: 6, label: "Oct" },
      },
      clockTick: () => {
        const step = seq._currentStep;
        const midi = seq._pitchValues[step];
        const freq = NOTE_FREQ(midi);
        const now = this.ctx.currentTime;
        const gateOn = seq._gatePattern[step];
        noteOut.offset.setValueAtTime(freq, now);
        // Propagate to slaves when the pitch target is a master oscillator
        seq._pitchTargets.forEach(({ audioParam, moduleId }) => {
          audioParam.setValueAtTime(freq, now);
          const targetMod = this.modules.get(moduleId);
          if (targetMod && targetMod._slaveTargets) {
            targetMod._frequency = freq;
            this._propagateToSlaves(targetMod);
          }
        });
        if (gateOn) {
          gateOut.offset.setValueAtTime(1, now);
          gateOut.offset.setValueAtTime(0, now + 0.05);
          seq._gateTargetEnvelopes.forEach(envId => {
            const envMod = this.modules.get(envId);
            if (envMod && envMod.trigger) envMod.trigger();
            if (envMod && envMod.releaseEnv) setTimeout(() => envMod.releaseEnv(), 60);
          });
        } else {
          gateOut.offset.setValueAtTime(0, now);
        }
        seq._currentStep = (step + 1) % seq.params.steps.value;
      },
      resetSeq: () => { seq._currentStep = 0; },
    };
    return seq;
  }

  // ── Level ────────────────────────────────────────────────────────────────

  _createAmplifier(id) {
    const gain = this.ctx.createGain();
    gain.gain.value = 0.8;
    return {
      id, type: "Amplifier", node: gain, outputNode: gain,
      outputs: { Out: gain },
      inputs: { In: gain },
      _nodes: [gain],
      params: {
        level: { value: 0.8, min: 0.25, max: 4, audioParam: gain.gain, label: "Amplification" },
      },
    };
  }

  _createGainControl(id) {
    // Spec §6.3 GainControl (VCA). Ctrl modulates gainNode.gain around a baseline level.
    // Unipolar toggle switches between ring-mod (bipolar Ctrl) and AM (unipolar Ctrl).
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0.8;

    const ctrlIn = this.ctx.createGain();
    ctrlIn.gain.value = 1;

    // Bipolar path: ctrlIn → bipolarGate → gainNode.gain
    const bipolarGate = this.ctx.createGain();
    bipolarGate.gain.value = 1;
    ctrlIn.connect(bipolarGate);
    bipolarGate.connect(gainNode.gain);

    // Unipolar half path: ctrlIn → unipolarHalf (×0.5) → uniGate → gainNode.gain
    const unipolarHalf = this.ctx.createGain();
    unipolarHalf.gain.value = 0.5;
    const uniGate = this.ctx.createGain();
    uniGate.gain.value = 0;
    ctrlIn.connect(unipolarHalf);
    unipolarHalf.connect(uniGate);
    uniGate.connect(gainNode.gain);

    // Unipolar +0.5 bias: constant source through biasGate to gainNode.gain
    const biasSrc = this.ctx.createConstantSource();
    biasSrc.offset.value = 0.5;
    const biasGate = this.ctx.createGain();
    biasGate.gain.value = 0;
    biasSrc.connect(biasGate);
    biasGate.connect(gainNode.gain);
    biasSrc.start();

    return {
      id, type: "GainControl", node: gainNode, outputNode: gainNode,
      outputs: { Out: gainNode },
      inputs: { In: gainNode, Ctrl: ctrlIn },
      _nodes: [gainNode, ctrlIn, bipolarGate, unipolarHalf, uniGate, biasSrc, biasGate],
      _bipolarGate: bipolarGate,
      _uniGate: uniGate,
      _biasGate: biasGate,
      params: {
        level: { value: 0.8, min: 0, max: 4, audioParam: gainNode.gain, label: "Level" },
        unipolar: { value: "off", options: ["off", "on"], label: "Uni" },
      },
    };
  }

  _createMixer3(id) {
    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    const gain3 = this.ctx.createGain();
    const merger = this.ctx.createGain();
    gain1.gain.value = 0.5;
    gain2.gain.value = 0.5;
    gain3.gain.value = 0.5;
    gain1.connect(merger);
    gain2.connect(merger);
    gain3.connect(merger);
    return {
      id, type: "Mixer3", node: merger, outputNode: merger,
      outputs: { Out: merger },
      inputs: { In1: gain1, In2: gain2, In3: gain3 },
      _nodes: [gain1, gain2, gain3, merger],
      params: {
        level1: { value: 0.5, min: 0, max: 1, audioParam: gain1.gain, label: "Lvl 1" },
        level2: { value: 0.5, min: 0, max: 1, audioParam: gain2.gain, label: "Lvl 2" },
        level3: { value: 0.5, min: 0, max: 1, audioParam: gain3.gain, label: "Lvl 3" },
      },
    };
  }

  _createMixer8(id) {
    const gains = [];
    const merger = this.ctx.createGain();
    const inputs = {};
    const params = {};
    for (let i = 1; i <= 8; i++) {
      const g = this.ctx.createGain();
      g.gain.value = 0.5;
      g.connect(merger);
      gains.push(g);
      inputs[`In${i}`] = g;
      params[`level${i}`] = { value: 0.5, min: 0, max: 1, audioParam: g.gain, label: `Lvl ${i}` };
    }
    return {
      id, type: "Mixer8", node: merger, outputNode: merger,
      outputs: { Out: merger },
      inputs,
      _nodes: [...gains, merger],
      params,
    };
  }

  _createXFade(id) {
    const gainA = this.ctx.createGain();
    const gainB = this.ctx.createGain();
    const output = this.ctx.createGain();
    const fadeMod = this.ctx.createGain();
    fadeMod.gain.value = 0;
    // Default: 50/50
    gainA.gain.value = 0.5;
    gainB.gain.value = 0.5;
    gainA.connect(output);
    gainB.connect(output);

    return {
      id, type: "XFade", node: output, outputNode: output,
      outputs: { Out: output },
      inputs: { InA: gainA, InB: gainB, FadeMod: fadeMod },
      _nodes: [gainA, gainB, output, fadeMod],
      _gainA: gainA, _gainB: gainB,
      params: {
        fade: { value: 0.5, min: 0, max: 1, label: "Fade" },
      },
    };
  }

  _createPanner(id) {
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = 0;
    return {
      id, type: "Panner", node: panner, outputNode: panner,
      outputs: { Out: panner },
      inputs: { In: panner, PanMod: panner.pan },
      _nodes: [panner],
      params: {
        pan: { value: 0, min: -1, max: 1, audioParam: panner.pan, label: "Pan" },
      },
    };
  }

  // ── Effects ──────────────────────────────────────────────────────────────

  _createOutput(id) {
    const gain = this.ctx.createGain();
    gain.gain.value = 0.5;
    gain.connect(this.masterGain);
    return {
      id, type: "Output", node: gain, outputNode: null,
      outputs: {},
      inputs: { InL: gain, InR: gain },
      _nodes: [gain],
      params: {
        level: { value: 0.5, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createDelay(id) {
    const input = this.ctx.createGain();
    const delay = this.ctx.createDelay(2.0);
    const feedback = this.ctx.createGain();
    const output = this.ctx.createGain();
    delay.delayTime.value = 0.35;
    feedback.gain.value = 0.4;
    output.gain.value = 0.6;
    input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    input.connect(output);
    delay.connect(output);
    return {
      id, type: "Delay", node: input, outputNode: output,
      outputs: { Out: output },
      inputs: { In: input },
      _nodes: [input, delay, feedback, output],
      params: {
        time: { value: 0.35, min: 0.01, max: 2, audioParam: delay.delayTime, label: "Time" },
        feedback: { value: 0.4, min: 0, max: 0.95, audioParam: feedback.gain, label: "Fdbk" },
        mix: { value: 0.6, min: 0, max: 1, audioParam: output.gain, label: "Mix" },
      },
    };
  }

  _createShortDelay(id) {
    const input = this.ctx.createGain();
    const delay = this.ctx.createDelay(0.003);
    const feedback = this.ctx.createGain();
    const output = this.ctx.createGain();
    delay.delayTime.value = 0.001;
    feedback.gain.value = 0.3;
    output.gain.value = 0.7;
    input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    input.connect(output);
    delay.connect(output);
    return {
      id, type: "ShortDelay", node: input, outputNode: output,
      outputs: { Out: output },
      inputs: { In: input, TimeMod: delay.delayTime },
      _nodes: [input, delay, feedback, output],
      params: {
        time: { value: 0.001, min: 0, max: 0.00265, audioParam: delay.delayTime, label: "Time" },
        feedback: { value: 0.3, min: 0, max: 0.95, audioParam: feedback.gain, label: "Fdbk" },
        mix: { value: 0.7, min: 0, max: 1, audioParam: output.gain, label: "Mix" },
      },
    };
  }

  _createChorus(id) {
    const input = this.ctx.createGain();
    const output = this.ctx.createGain();
    const dry = this.ctx.createGain();
    const wet = this.ctx.createGain();
    dry.gain.value = 0.7;
    wet.gain.value = 0.5;
    const delay1 = this.ctx.createDelay(0.05);
    delay1.delayTime.value = 0.015;
    const lfo1 = this.ctx.createOscillator();
    lfo1.type = "sine"; lfo1.frequency.value = 0.8;
    const lfoGain1 = this.ctx.createGain();
    lfoGain1.gain.value = 0.003;
    lfo1.connect(lfoGain1);
    lfoGain1.connect(delay1.delayTime);
    lfo1.start();
    const delay2 = this.ctx.createDelay(0.05);
    delay2.delayTime.value = 0.02;
    const lfo2 = this.ctx.createOscillator();
    lfo2.type = "sine"; lfo2.frequency.value = 1.1;
    const lfoGain2 = this.ctx.createGain();
    lfoGain2.gain.value = 0.003;
    lfo2.connect(lfoGain2);
    lfoGain2.connect(delay2.delayTime);
    lfo2.start();
    input.connect(dry); dry.connect(output);
    input.connect(delay1); input.connect(delay2);
    delay1.connect(wet); delay2.connect(wet);
    wet.connect(output);
    return {
      id, type: "Chorus", node: input, outputNode: output,
      outputs: { Out: output },
      inputs: { In: input },
      _nodes: [input, output, dry, wet, delay1, delay2, lfo1, lfo2, lfoGain1, lfoGain2],
      _lfo2: lfo2, _lfoGain2: lfoGain2,
      params: {
        rate: { value: 0.8, min: 0.1, max: 5, audioParam: lfo1.frequency, label: "Rate" },
        depth: { value: 0.003, min: 0, max: 0.01, audioParam: lfoGain1.gain, label: "Depth" },
        mix: { value: 0.5, min: 0, max: 1, audioParam: wet.gain, label: "Mix" },
      },
    };
  }

  _createShaper(id) {
    const input = this.ctx.createGain();
    const shaper = this.ctx.createWaveShaper();
    const output = this.ctx.createGain();
    output.gain.value = 0.8;

    // Generate initial curve (linear)
    const makeLinearCurve = () => {
      const n = 256;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) curve[i] = (2 * i) / (n - 1) - 1;
      return curve;
    };
    shaper.curve = makeLinearCurve();
    shaper.oversample = "2x";

    input.connect(shaper);
    shaper.connect(output);

    return {
      id, type: "Shaper", node: input, outputNode: output,
      outputs: { Out: output },
      inputs: { In: input },
      _nodes: [input, shaper, output],
      _shaper: shaper,
      params: {
        shape: { value: "linear", options: ["linear", "log1", "log2", "exp1", "exp2"], label: "Shape" },
        drive: { value: 1, min: 0.1, max: 10, label: "Drive" },
        level: { value: 0.8, min: 0, max: 1, audioParam: output.gain, label: "Level" },
      },
    };
  }

  // ── I/O ──────────────────────────────────────────────────────────────────

  _createKeyboard(id) {
    // Note output: ConstantSourceNode whose value = frequency in Hz
    const noteOut = this.ctx.createConstantSource();
    noteOut.offset.value = 0;
    noteOut.start();

    // Gate output: ConstantSourceNode, 1 when key held, 0 when released
    const gateOut = this.ctx.createConstantSource();
    gateOut.offset.value = 0;
    gateOut.start();

    // Velocity output
    const velOut = this.ctx.createConstantSource();
    velOut.offset.value = 0;
    velOut.start();

    const kbd = {
      id, type: "Keyboard", node: noteOut, outputNode: noteOut,
      outputs: { Note: noteOut, Gate: gateOut, Vel: velOut },
      inputs: {},
      _nodes: [noteOut, gateOut, velOut],
      _gateTargetEnvelopes: [], // filled by connect/disconnect
      _pitchTargets: [], // { audioParam, moduleId } — directly set on note play
      _currentNote: -1,
      params: {
        octave: { value: 0, min: -2, max: 4, label: "Oct" },
      },
      // Play a note: set frequency, trigger connected envelopes
      playNote: (midiNote) => {
        const octShift = kbd.params.octave.value * 12;
        const freq = NOTE_FREQ(midiNote + octShift);
        const now = this.ctx.currentTime;
        noteOut.offset.setValueAtTime(freq, now);
        gateOut.offset.setValueAtTime(1, now);
        velOut.offset.setValueAtTime(0.8, now);
        kbd._currentNote = midiNote;
        // Directly set frequency on connected oscillator pitch targets.
        // When the target is a master oscillator, also update its _frequency
        // and propagate to slaves so master/slave keyboard tracking works.
        kbd._pitchTargets.forEach(({ audioParam, moduleId }) => {
          audioParam.setValueAtTime(freq, now);
          const targetMod = this.modules.get(moduleId);
          if (targetMod && targetMod._slaveTargets) {
            targetMod._frequency = freq;
            this._propagateToSlaves(targetMod);
          }
        });
        // Trigger connected envelopes
        kbd._gateTargetEnvelopes.forEach(envId => {
          const envMod = this.modules.get(envId);
          if (envMod && envMod.trigger) envMod.trigger();
        });
      },
      releaseNote: (midiNote) => {
        if (kbd._currentNote !== midiNote) return;
        gateOut.offset.setValueAtTime(0, this.ctx.currentTime);
        kbd._currentNote = -1;
        // Release connected envelopes
        kbd._gateTargetEnvelopes.forEach(envId => {
          const envMod = this.modules.get(envId);
          if (envMod && envMod.releaseEnv) envMod.releaseEnv();
        });
      },
    };

    // Initialize gate targets
    this._gateTargets.set(id, new Set());

    return kbd;
  }

  // ── Connection Management ────────────────────────────────────────────────

  connect(fromId, fromPort, toId, toPort) {
    const fromMod = this.modules.get(fromId);
    const toMod = this.modules.get(toId);
    if (!fromMod || !toMod) return false;
    const outputNode = fromMod.outputs[fromPort];
    const inputNode = toMod.inputs[toPort];

    // Master/Slave connection: Slv output -> Mst input (virtual, no audio)
    if (fromPort === "Slv" && toPort === "Mst" && toMod._recalcFreq) {
      if (!fromMod._slaveTargets) fromMod._slaveTargets = [];
      fromMod._slaveTargets.push({ moduleId: toId });
      toMod._masterModId = fromId;
      toMod._masterFreq = fromMod._frequency || fromMod.params.frequency?.value || 220;
      toMod._recalcFreq();
      this.connections.push({ fromId, fromPort, toId, toPort });
      return true;
    }

    // Clock subscriber: clock output -> sequencer Clk input
    if (toPort === "Clk" && toMod.clockTick) {
      if (!fromMod._clockSubscribers) fromMod._clockSubscribers = [];
      fromMod._clockSubscribers.push({ moduleId: toId });
      this.connections.push({ fromId, fromPort, toId, toPort });
      return true;
    }

    // Reset subscriber: Sync/Rst output -> sequencer Rst input
    if (toPort === "Rst" && toMod.resetSeq) {
      if (!fromMod._resetSubscribers) fromMod._resetSubscribers = [];
      fromMod._resetSubscribers.push({ moduleId: toId });
      this.connections.push({ fromId, fromPort, toId, toPort });
      return true;
    }

    if (!outputNode || !inputNode) return false;

    // Note -> PitchMod: direct pitch tracking (Keyboard, NoteSeqA, NoteSeqB).
    // The Note source replaces the target's value rather than modulating it, so
    // we bypass any auto-inserted attenuator and write to the original AudioParam.
    const isNoteSource = (fromMod.type === "Keyboard" || fromMod.type === "NoteSeqA" || fromMod.type === "NoteSeqB") && fromPort === "Note";
    if (isNoteSource) {
      const pitchTarget = toMod._originalInputs?.[toPort] || inputNode;
      if (pitchTarget instanceof AudioParam) {
        fromMod._pitchTargets.push({ audioParam: pitchTarget, moduleId: toId, port: toPort });
        this.connections.push({ fromId, fromPort, toId, toPort });
        return true;
      }
    }

    try {
      outputNode.connect(inputNode);
      this.connections.push({ fromId, fromPort, toId, toPort });

      // Gate target tracking: Keyboard/NoteSeq Gate -> envelope
      const isGateSource = (fromMod.type === "Keyboard" || fromMod.type === "NoteSeqA" || fromMod.type === "NoteSeqB") && fromPort === "Gate";
      if (isGateSource && toMod.trigger && toMod.releaseEnv) {
        fromMod._gateTargetEnvelopes.push(toId);
      }

      // EventSeq Out1/Out2 gate tracking
      if (fromMod.type === "EventSeq" && toMod.trigger && toMod.releaseEnv) {
        if (fromPort === "Out1") fromMod._gateTargetEnvelopes1.push(toId);
        if (fromPort === "Out2") fromMod._gateTargetEnvelopes2.push(toId);
      }

      return true;
    } catch (e) {
      console.error("Connection error:", e);
      return false;
    }
  }

  disconnect(fromId, fromPort, toId, toPort) {
    const fromMod = this.modules.get(fromId);
    const toMod = this.modules.get(toId);
    if (!fromMod || !toMod) return;

    // Master/Slave disconnect
    if (fromPort === "Slv" && toPort === "Mst" && fromMod._slaveTargets) {
      fromMod._slaveTargets = fromMod._slaveTargets.filter(s => s.moduleId !== toId);
      if (toMod._masterModId === fromId) {
        toMod._masterModId = null;
        toMod._masterFreq = 0;
      }
      this.connections = this.connections.filter(
        (c) => !(c.fromId === fromId && c.fromPort === fromPort && c.toId === toId && c.toPort === toPort)
      );
      return;
    }

    // Clock subscriber disconnect
    if (toPort === "Clk" && fromMod._clockSubscribers) {
      fromMod._clockSubscribers = fromMod._clockSubscribers.filter(s => s.moduleId !== toId);
      this.connections = this.connections.filter(
        (c) => !(c.fromId === fromId && c.fromPort === fromPort && c.toId === toId && c.toPort === toPort)
      );
      return;
    }

    // Reset subscriber disconnect
    if (toPort === "Rst" && fromMod._resetSubscribers) {
      fromMod._resetSubscribers = fromMod._resetSubscribers.filter(s => s.moduleId !== toId);
      this.connections = this.connections.filter(
        (c) => !(c.fromId === fromId && c.fromPort === fromPort && c.toId === toId && c.toPort === toPort)
      );
      return;
    }

    const outputNode = fromMod.outputs[fromPort];
    const inputNode = toMod.inputs[toPort];
    if (!outputNode || !inputNode) return;

    // Note pitch targets (Keyboard, NoteSeqA, NoteSeqB) — mirror connect()'s
    // _originalInputs lookup so we cleanly remove the tracked AudioParam.
    const isNoteSource = (fromMod.type === "Keyboard" || fromMod.type === "NoteSeqA" || fromMod.type === "NoteSeqB") && fromPort === "Note";
    const pitchTarget = isNoteSource ? (toMod._originalInputs?.[toPort] || inputNode) : null;
    if (isNoteSource && pitchTarget instanceof AudioParam) {
      fromMod._pitchTargets = fromMod._pitchTargets.filter(
        pt => !(pt.moduleId === toId && pt.port === toPort)
      );
    } else {
      try {
        outputNode.disconnect(inputNode);
      } catch (e) {
        if (e.name !== "InvalidAccessError") {
          console.error("AudioEngine.disconnect: unexpected error", e);
        }
      }
    }

    this.connections = this.connections.filter(
      (c) => !(c.fromId === fromId && c.fromPort === fromPort && c.toId === toId && c.toPort === toPort)
    );

    // Gate target tracking: remove (Keyboard, NoteSeqA, NoteSeqB)
    const isGateSource = (fromMod.type === "Keyboard" || fromMod.type === "NoteSeqA" || fromMod.type === "NoteSeqB") && fromPort === "Gate";
    if (isGateSource) {
      fromMod._gateTargetEnvelopes = fromMod._gateTargetEnvelopes.filter(eid => eid !== toId);
    }

    // EventSeq gate tracking
    if (fromMod.type === "EventSeq") {
      if (fromPort === "Out1") fromMod._gateTargetEnvelopes1 = fromMod._gateTargetEnvelopes1.filter(eid => eid !== toId);
      if (fromPort === "Out2") fromMod._gateTargetEnvelopes2 = fromMod._gateTargetEnvelopes2.filter(eid => eid !== toId);
    }
  }

  removeModule(id) {
    const mod = this.modules.get(id);
    if (!mod) return;
    // Disconnect everything
    const toRemove = this.connections.filter((c) => c.fromId === id || c.toId === id);
    toRemove.forEach((c) => this.disconnect(c.fromId, c.fromPort, c.toId, c.toPort));
    // Stop clock timer if ClkGen
    if (mod.type === "ClkGen" && mod._timerId) {
      clearTimeout(mod._timerId);
      mod._active = false;
    }
    // Clean up gate targets
    if (mod.type === "Keyboard") {
      this._gateTargets.delete(id);
    }
    // Clean up master->slave references
    if (mod._slaveTargets) {
      mod._slaveTargets.forEach(({ moduleId }) => {
        const slave = this.modules.get(moduleId);
        if (slave) { slave._masterModId = null; slave._masterFreq = 0; }
      });
    }
    // Clean up slave->master references
    if (mod._masterModId) {
      const master = this.modules.get(mod._masterModId);
      if (master && master._slaveTargets) {
        master._slaveTargets = master._slaveTargets.filter(s => s.moduleId !== id);
      }
    }
    // Stop and disconnect all internal nodes
    const nodes = mod._nodes || [mod.node, mod.outputNode].filter(Boolean);
    nodes.forEach((n) => {
      try { if (n.stop) n.stop(); } catch (e) {}
      try { n.disconnect(); } catch (e) {}
    });
    this.modules.delete(id);
  }

  getScopeData() {
    if (!this.analyser) return new Float32Array(256);
    this.analyser.getFloatTimeDomainData(this.scopeData);
    return this.scopeData;
  }

  setParam(moduleId, paramName, value) {
    const mod = this.modules.get(moduleId);
    if (!mod || !mod.params[paramName]) return;
    const p = mod.params[paramName];
    p.value = value;
    if (p.audioParam) {
      const audioValue = p.curve ? applyAttenuatorCurve(value, p.min, p.max, p.curve) : value;
      p.audioParam.setValueAtTime(audioValue, this.ctx.currentTime);
    }
    // Handle Chorus cross-updates
    if (mod.type === "Chorus" && paramName === "rate") {
      mod._lfo2.frequency.setValueAtTime(value * 1.375, this.ctx.currentTime);
    }
    if (mod.type === "Chorus" && paramName === "depth") {
      mod._lfoGain2.gain.setValueAtTime(value, this.ctx.currentTime);
    }
    // Handle waveform changes
    if (paramName === "waveform" || paramName === "filterType") {
      if (mod.node && mod.node.type !== undefined) {
        mod.node.type = value;
      }
    }
    // FilterC: sync freq/res across all 3 filters
    if (mod.type === "FilterC") {
      if (paramName === "frequency") {
        mod._filters.forEach(f => f.frequency.setValueAtTime(value, this.ctx.currentTime));
      } else if (paramName === "resonance") {
        mod._filters.forEach(f => f.Q.setValueAtTime(value, this.ctx.currentTime));
      }
    }
    // FilterE: sync freq/res/type across both filters, handle slope change
    if (mod.type === "FilterE") {
      if (paramName === "frequency") {
        mod._filter1.frequency.setValueAtTime(value, this.ctx.currentTime);
        mod._filter2.frequency.setValueAtTime(value, this.ctx.currentTime);
      } else if (paramName === "resonance") {
        mod._filter1.Q.setValueAtTime(value, this.ctx.currentTime);
        mod._filter2.Q.setValueAtTime(value, this.ctx.currentTime);
      } else if (paramName === "filterType") {
        mod._filter1.type = value;
        mod._filter2.type = value;
      } else if (paramName === "slope") {
        // Rewire: 12dB = filter1 -> output, 24dB = filter1 -> filter2 -> output
        try { mod._filter1.disconnect(); } catch (e) {}
        try { mod._filter2.disconnect(); } catch (e) {}
        if (value === "24dB") {
          mod._filter1.connect(mod._filter2);
          mod._filter2.connect(mod._output);
        } else {
          mod._filter1.connect(mod._output);
        }
        mod._slope = value;
      }
    }
    // XFade: update both gains inversely
    if (mod.type === "XFade" && paramName === "fade") {
      mod._gainA.gain.setValueAtTime(1 - value, this.ctx.currentTime);
      mod._gainB.gain.setValueAtTime(value, this.ctx.currentTime);
    }
    // GainControl: unipolar toggle flips bipolar/unipolar routing gates.
    // Bias source is a ConstantSource(0.5); biasGate passes it through unchanged
    // when on (gain=1) for the spec "+32 bias" (normalized to +0.5).
    if (mod.type === "GainControl" && paramName === "unipolar") {
      const now = this.ctx.currentTime;
      if (value === "on") {
        mod._bipolarGate.gain.setValueAtTime(0, now);
        mod._uniGate.gain.setValueAtTime(1, now);
        mod._biasGate.gain.setValueAtTime(1, now);
      } else {
        mod._bipolarGate.gain.setValueAtTime(1, now);
        mod._uniGate.gain.setValueAtTime(0, now);
        mod._biasGate.gain.setValueAtTime(0, now);
      }
    }
    // Shaper: regenerate curve
    if (mod.type === "Shaper" && (paramName === "shape" || paramName === "drive")) {
      const shape = mod.params.shape.value;
      const drive = mod.params.drive.value;
      const n = 256;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let x = ((2 * i) / (n - 1) - 1) * drive;
        switch (shape) {
          case "log2": curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.25); break;
          case "log1": curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.5); break;
          case "linear": curve[i] = Math.max(-1, Math.min(1, x)); break;
          case "exp1": curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 2); break;
          case "exp2": curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 4); break;
          default: curve[i] = x;
        }
        curve[i] = Math.max(-1, Math.min(1, curve[i]));
      }
      mod._shaper.curve = curve;
    }
    // DrumSynth: filterMode -> noise filter type
    if (mod.type === "DrumSynth" && paramName === "filterMode") {
      const map = { LP: "lowpass", BP: "bandpass", HP: "highpass" };
      mod._noiseFilter.type = map[value] || "bandpass";
    }
    // Noise: swap source buffer when color changes (buffer can't change after start())
    if (mod.type === "Noise" && paramName === "color") {
      const oldSrc = mod.node;
      try { oldSrc.stop(); } catch (e) {}
      try { oldSrc.disconnect(); } catch (e) {}
      mod._nodes = mod._nodes.filter((n) => n !== oldSrc);
      const newSrc = this.ctx.createBufferSource();
      newSrc.buffer = value === "pink" ? mod._pinkBuffer : mod._whiteBuffer;
      newSrc.loop = true;
      newSrc.connect(mod.outputNode);
      newSrc.start();
      mod.node = newSrc;
      mod._nodes.push(newSrc);
    }
    // PortamentoA: time -> filter frequency
    if (mod.type === "PortamentoA" && paramName === "time") {
      // Higher time = lower cutoff = slower glide
      const cutoff = Math.max(0.5, 1 / (value * 2));
      mod._nodes[1].frequency.setValueAtTime(cutoff, this.ctx.currentTime);
    }
    // LFOA: range multiplier
    if (mod.type === "LFOA" && paramName === "range") {
      const baseRate = mod.params.rate.value;
      const mult = value === "lo" ? 0.1 : value === "sub" ? 0.01 : 1;
      mod._rangeMultiplier = mult;
      mod.node.frequency.setValueAtTime(baseRate * mult, this.ctx.currentTime);
    }
    if (mod.type === "LFOA" && paramName === "rate") {
      const mult = mod._rangeMultiplier || 1;
      mod.node.frequency.setValueAtTime(value * mult, this.ctx.currentTime);
    }
    // FormantOsc: vowel change
    if (mod.type === "FormantOsc" && paramName === "vowel") {
      const freqs = mod._formantTable[value];
      if (freqs) {
        mod._filters.forEach((f, i) => {
          f.frequency.setValueAtTime(freqs[i], this.ctx.currentTime);
        });
      }
    }
    // FormantOsc: timbre (interpolates between current vowel and next)
    if (mod.type === "FormantOsc" && paramName === "timbre") {
      const vowels = ["A", "E", "I", "O", "U"];
      const currentVowel = mod.params.vowel.value;
      const idx = vowels.indexOf(currentVowel);
      const nextIdx = (idx + 1) % vowels.length;
      const fromFreqs = mod._formantTable[vowels[idx]];
      const toFreqs = mod._formantTable[vowels[nextIdx]];
      const t = value;
      mod._filters.forEach((f, i) => {
        const freq = fromFreqs[i] + (toFreqs[i] - fromFreqs[i]) * t;
        f.frequency.setValueAtTime(freq, this.ctx.currentTime);
      });
    }
    // FormantOsc: coarse/fine tuning + propagate to slaves
    if (mod.type === "FormantOsc" && (paramName === "coarse" || paramName === "fine" || paramName === "frequency")) {
      const baseFreq = mod.params.frequency.value;
      const coarse = mod.params.coarse.value;
      const fine = mod.params.fine.value;
      const semitones = coarse + fine / 100;
      const freq = baseFreq * Math.pow(2, semitones / 12);
      mod.node.frequency.setValueAtTime(freq, this.ctx.currentTime);
      mod._slvOut.offset.setValueAtTime(freq, this.ctx.currentTime);
      mod._frequency = freq;
      this._propagateToSlaves(mod);
    }
    // OscA: coarse/fine tuning + propagate to slaves
    if (mod.type === "OscA" && (paramName === "coarse" || paramName === "fine" || paramName === "frequency")) {
      const baseFreq = mod.params.frequency.value;
      const coarse = mod.params.coarse.value;
      const fine = mod.params.fine.value;
      const semitones = coarse + fine / 100;
      const freq = baseFreq * Math.pow(2, semitones / 12);
      mod.params.frequency.audioParam.setValueAtTime(freq, this.ctx.currentTime);
      mod._frequency = freq;
      this._propagateToSlaves(mod);
    }
    // OscA: waveform string -> integer for sync-osc-processor
    if (mod.type === "OscA" && paramName === "waveform") {
      const w = WAVE_INT[value];
      if (w !== undefined) {
        mod.node.parameters.get("waveform").setValueAtTime(w, this.ctx.currentTime);
      }
    }
    // MasterOsc: coarse/fine tuning + propagate to slaves
    if (mod.type === "MasterOsc" && (paramName === "coarse" || paramName === "fine" || paramName === "frequency")) {
      const baseFreq = mod.params.frequency.value;
      const coarse = mod.params.coarse.value;
      const fine = mod.params.fine.value;
      const semitones = coarse + fine / 100;
      const freq = baseFreq * Math.pow(2, semitones / 12);
      mod._frequency = freq;
      mod.node.offset.setValueAtTime(freq, this.ctx.currentTime);
      this._propagateToSlaves(mod);
    }
    // OscB: coarse/fine tuning + propagate to slaves
    if (mod.type === "OscB" && (paramName === "coarse" || paramName === "fine" || paramName === "frequency")) {
      const baseFreq = mod.params.frequency.value;
      const coarse = mod.params.coarse.value;
      const fine = mod.params.fine.value;
      const semitones = coarse + fine / 100;
      const freq = baseFreq * Math.pow(2, semitones / 12);
      mod.node.frequency.setValueAtTime(freq, this.ctx.currentTime);
      mod._frequency = freq;
      this._propagateToSlaves(mod);
    }
    // OscC: coarse/fine tuning + propagate to slaves
    if (mod.type === "OscC" && (paramName === "coarse" || paramName === "fine" || paramName === "frequency")) {
      const baseFreq = mod.params.frequency.value;
      const coarse = mod.params.coarse.value;
      const fine = mod.params.fine.value;
      const semitones = coarse + fine / 100;
      const freq = baseFreq * Math.pow(2, semitones / 12);
      mod.node.frequency.setValueAtTime(freq, this.ctx.currentTime);
      mod._frequency = freq;
      this._propagateToSlaves(mod);
    }
    // Slave oscillators: recalc on partial/detune/fine/octShift change
    const isSlaveType = mod.type?.startsWith("OscSlv") || mod.type === "OscSineBank";
    if (isSlaveType && (paramName === "partials" || paramName === "detune" || paramName === "fine" || paramName === "octShift")) {
      if (mod._recalcFreq) mod._recalcFreq();
    }
    // OscSineBank: recalc on tune/fine changes
    if (mod.type === "OscSineBank" && (paramName.startsWith("tune") || paramName.startsWith("fine"))) {
      if (mod._recalcFreq) mod._recalcFreq();
    }
    // OscSlvA waveform string -> integer for sync-osc-processor
    if (mod.type === "OscSlvA" && paramName === "waveform") {
      const w = WAVE_INT[value];
      if (w !== undefined) {
        mod.node.parameters.get("waveform").setValueAtTime(w, this.ctx.currentTime);
      }
    }
    // SpectralOsc: coarse/fine tuning + propagate to slaves; shape/partials -> recalc gains
    if (mod.type === "SpectralOsc") {
      if (paramName === "coarse" || paramName === "fine" || paramName === "frequency") {
        const baseFreq = mod.params.frequency.value;
        const coarse = mod.params.coarse.value;
        const fine = mod.params.fine.value;
        const semitones = coarse + fine / 100;
        const freq = baseFreq * Math.pow(2, semitones / 12);
        mod._frequency = freq;
        mod._freqSrc.offset.setValueAtTime(freq, this.ctx.currentTime);
        mod._slvOut.offset.setValueAtTime(freq, this.ctx.currentTime);
        this._propagateToSlaves(mod);
      } else if (paramName === "partialsMode") {
        if (mod._recalcSpectralGains) mod._recalcSpectralGains();
      }
    }
  }

  // Returns a serialisable snapshot of a module's user-mutated runtime state
  // (the state that lives on the engine object, not in React params). Returns
  // null when the module has no such state. Arrays are shallow-cloned so the
  // caller can't mutate the live module.
  extractInternalState(mod) {
    if (!mod) return null;
    switch (mod.type) {
      case "EventSeq":
        return { triggers1: [...mod._triggers1], triggers2: [...mod._triggers2] };
      case "CtrlSeq":
        return { values: [...mod._values] };
      case "NoteSeqA":
      case "NoteSeqB":
        return { pitchValues: [...mod._pitchValues], gatePattern: [...mod._gatePattern] };
      default:
        return null;
    }
  }

  // Applies a saved internal-state snapshot to a live module. In-place writes
  // preserve the live array length so future step-count changes load cleanly
  // in either direction. Defensive against null / malformed input.
  restoreInternalState(mod, state) {
    if (!mod || !state || typeof state !== "object") return;
    const writeBoolArray = (target, source) => {
      if (!Array.isArray(target) || !Array.isArray(source)) return;
      const n = Math.min(target.length, source.length);
      for (let i = 0; i < n; i++) target[i] = Boolean(source[i]);
    };
    const writeMidiArray = (target, source) => {
      if (!Array.isArray(target) || !Array.isArray(source)) return;
      const n = Math.min(target.length, source.length);
      for (let i = 0; i < n; i++) {
        const raw = Number(source[i]);
        const v = Number.isFinite(raw) ? Math.round(raw) : 60;
        target[i] = Math.max(0, Math.min(127, v));
      }
    };
    const writeNumberArray = (target, source) => {
      if (!Array.isArray(target) || !Array.isArray(source)) return;
      const n = Math.min(target.length, source.length);
      for (let i = 0; i < n; i++) {
        const raw = Number(source[i]);
        target[i] = Number.isFinite(raw) ? raw : 0;
      }
    };
    switch (mod.type) {
      case "EventSeq":
        writeBoolArray(mod._triggers1, state.triggers1);
        writeBoolArray(mod._triggers2, state.triggers2);
        break;
      case "CtrlSeq":
        writeNumberArray(mod._values, state.values);
        break;
      case "NoteSeqA":
      case "NoteSeqB":
        writeMidiArray(mod._pitchValues, state.pitchValues);
        writeBoolArray(mod._gatePattern, state.gatePattern);
        break;
      default:
        break;
    }
  }

  triggerEnvelopes() {
    this.modules.forEach((mod) => {
      if (mod.trigger) mod.trigger();
    });
  }

  releaseEnvelopes() {
    this.modules.forEach((mod) => {
      if (mod.releaseEnv) mod.releaseEnv();
    });
  }
}

export default AudioEngine;
