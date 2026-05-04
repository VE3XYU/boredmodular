// ─── Audio Engine ───────────────────────────────────────────────────────────
// Web Audio API based modular synthesis engine

// Note-to-frequency conversion
const NOTE_FREQ = (note) => 440 * Math.pow(2, (note - 69) / 12);

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
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.isRunning = true;
  }

  createModule(id, type) {
    if (!this.ctx) this.init();
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
      case "Mixer2": mod = this._createMixer2(id); break;
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
      case "EventSeq": mod = this._createEventSeq(id); break;
      case "CtrlSeq": mod = this._createCtrlSeq(id); break;
      case "NoteSeqA": mod = this._createNoteSeqA(id); break;
      case "NoteSeqB": mod = this._createNoteSeqB(id); break;
      default: return null;
    }
    this.modules.set(id, mod);
    return mod;
  }

  // ── Oscillators ──────────────────────────────────────────────────────────

  _createOscA(id) {
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
      id, type: "OscA", node: osc, outputNode: gain,
      outputs: { Out: gain, Slv: slaveGain },
      inputs: { PitchMod1: osc.frequency, PitchMod2: osc.frequency, FmMod: fmGain },
      _nodes: [osc, gain, slaveGain, fmGain],
      _slaveTargets: [],
      _frequency: 220,
      params: {
        frequency: { value: 220, min: 20, max: 8000, audioParam: osc.frequency, label: "Freq" },
        coarse: { value: 0, min: -24, max: 24, label: "Coarse" },
        fine: { value: 0, min: -100, max: 100, label: "Fine" },
        waveform: { value: "sawtooth", options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" },
        fmDepth: { value: 0, min: 0, max: 1000, audioParam: fmGain.gain, label: "FM Depth" },
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
      inputs: { PitchMod: osc.frequency, FmMod: fmGain },
      _nodes: [osc, gain, slaveGain, fmGain],
      _slaveTargets: [],
      _frequency: 220,
      params: {
        frequency: { value: 220, min: 20, max: 8000, audioParam: osc.frequency, label: "Freq" },
        waveform: { value: "sawtooth", options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" },
        fmDepth: { value: 0, min: 0, max: 1000, audioParam: fmGain.gain, label: "FM Depth" },
        level: { value: 0.8, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createOscC(id) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const slaveGain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 330;
    gain.gain.value = 0.6;
    slaveGain.gain.value = 0.6;
    osc.connect(gain);
    osc.connect(slaveGain);
    osc.start();
    return {
      id, type: "OscC", node: osc, outputNode: gain,
      outputs: { Out: gain, Slv: slaveGain },
      inputs: { PitchMod: osc.frequency },
      _nodes: [osc, gain, slaveGain],
      _slaveTargets: [],
      _frequency: 330,
      params: {
        frequency: { value: 330, min: 20, max: 8000, audioParam: osc.frequency, label: "Freq" },
        waveform: { value: "square", options: ["sine", "sawtooth", "square", "triangle"], label: "Wave" },
        pulseWidth: { value: 0.5, min: 0, max: 1, label: "PW" },
        level: { value: 0.6, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createNoise(id) {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
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
      params: {
        level: { value: 0.3, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
        color: { value: "white", options: ["white", "pink"], label: "Color" },
      },
    };
  }

  _createDrumSynth(id) {
    // Sine osc for body
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 60;
    const oscGain = this.ctx.createGain();
    oscGain.gain.value = 0;
    osc.connect(oscGain);
    osc.start();

    // Noise for transient
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) noiseData[i] = Math.random() * 2 - 1;
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 3000;
    noiseFilter.Q.value = 1;
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseSrc.start();

    // Mix to output
    const output = this.ctx.createGain();
    output.gain.value = 0.8;
    oscGain.connect(output);
    noiseGain.connect(output);

    const drum = {
      id, type: "DrumSynth", node: osc, outputNode: output,
      outputs: { Out: output },
      inputs: {},
      _nodes: [osc, oscGain, noiseSrc, noiseFilter, noiseGain, output],
      params: {
        oscFreq: { value: 60, min: 20, max: 500, audioParam: osc.frequency, label: "Freq" },
        oscDecay: { value: 0.15, min: 0.01, max: 2, label: "OscDec" },
        noiseLevel: { value: 0.5, min: 0, max: 1, label: "NsLvl" },
        noiseDecay: { value: 0.05, min: 0.01, max: 1, label: "NsDec" },
        pitchBend: { value: 200, min: 0, max: 1000, label: "Bend" },
        bendTime: { value: 0.04, min: 0.005, max: 0.5, label: "BdTm" },
        filterFreq: { value: 3000, min: 200, max: 10000, audioParam: noiseFilter.frequency, label: "FltFq" },
        level: { value: 0.8, min: 0, max: 1, audioParam: output.gain, label: "Level" },
      },
      trigger: () => {
        const now = this.ctx.currentTime;
        const p = drum.params;
        // Osc envelope
        oscGain.gain.cancelScheduledValues(now);
        oscGain.gain.setValueAtTime(1, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + p.oscDecay.value);
        // Noise envelope
        noiseGain.gain.cancelScheduledValues(now);
        noiseGain.gain.setValueAtTime(p.noiseLevel.value, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + p.noiseDecay.value);
        // Pitch bend
        osc.frequency.cancelScheduledValues(now);
        osc.frequency.setValueAtTime(p.oscFreq.value + p.pitchBend.value, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(p.oscFreq.value, 1), now + p.bendTime.value);
      },
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

    const mod = {
      id, type: "FormantOsc", node: osc, outputNode: output,
      outputs: { Out: output },
      inputs: { PitchMod: osc.frequency },
      _nodes: [osc, ...filters, ...filterGains, output],
      _filters: filters,
      _formantTable: FORMANT_TABLE,
      params: {
        frequency: { value: 150, min: 50, max: 1000, audioParam: osc.frequency, label: "Freq" },
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
        coarse: { value: 0, min: -36, max: 36, label: "Coarse" },
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
      partials: { value: 1, min: 0.25, max: 16, label: "Partials" },
      detune: { value: 0, min: -24, max: 24, label: "Detune" },
      fine: { value: 0, min: -50, max: 50, label: "Fine" },
      level: { value: 0.8, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
    };
    if (modInputDefs.FMA || modInputDefs.FMB) {
      params.fmDepth = { value: 0, min: 0, max: 1000, audioParam: modGains._fmGain?.gain, label: "FM Dep" };
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

  _createOscSlvA(id) {
    return this._makeSlaveOsc(id, "OscSlvA", "sawtooth", { FMA: true, AM: true });
  }
  _createOscSlvB(id) {
    return this._makeSlaveOsc(id, "OscSlvB", "square", { PwMod: true });
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
    return this._makeSlaveOsc(id, "OscSlvFM", "sine", { FMB: true });
  }

  _createOscSineBank(id) {
    const output = this.ctx.createGain();
    output.gain.value = 0.6;
    const oscs = [];
    const gains = [];
    const inputs = { Mst: null };
    const params = {};

    for (let i = 0; i < 6; i++) {
      const n = i + 1;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 220 * n;
      const g = this.ctx.createGain();
      g.gain.value = i === 0 ? 1 : 0.5 / n;
      osc.connect(g);
      g.connect(output);
      osc.start();
      oscs.push(osc);
      gains.push(g);
      inputs[`AM${n}`] = g.gain;
      params[`tune${n}`] = { value: n, min: 0.25, max: 16, label: `Tune${n}` };
      params[`fine${n}`] = { value: 0, min: -50, max: 50, label: `Fine${n}` };
      params[`level${n}`] = { value: i === 0 ? 1 : +(0.5 / n).toFixed(2), min: 0, max: 1, audioParam: g.gain, label: `Lvl${n}` };
    }

    return {
      id, type: "OscSineBank", node: oscs[0], outputNode: output,
      outputs: { Out: output },
      inputs,
      _nodes: [...oscs, ...gains, output],
      _oscs: oscs,
      _masterFreq: 0,
      _masterModId: null,
      _recalcFreq() {
        if (!this._masterFreq) return;
        const p = this.params;
        for (let i = 0; i < 6; i++) {
          const n = i + 1;
          const tune = p[`tune${n}`].value;
          const fine = p[`fine${n}`].value;
          const freq = this._masterFreq * tune * Math.pow(2, fine / 1200);
          oscs[i].frequency.setValueAtTime(freq, oscs[i].context.currentTime);
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
        frequency: { value: 1200, min: 20, max: 15000, audioParam: filter.frequency, label: "Freq" },
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
        frequency: { value: 1200, min: 20, max: 15000, audioParam: lp.frequency, label: "Freq" },
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
        frequency: { value: 1200, min: 20, max: 15000, audioParam: filter1.frequency, label: "Freq" },
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
        time: { value: 0.1, min: 0.001, max: 2, label: "Time" },
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
        // Set pitch targets directly
        seq._pitchTargets.forEach(({ audioParam }) => {
          audioParam.setValueAtTime(freq, now);
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
        seq._pitchTargets.forEach(({ audioParam }) => {
          audioParam.setValueAtTime(freq, now);
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
      inputs: { In: gain, GainMod: gain.gain },
      _nodes: [gain],
      params: {
        level: { value: 0.8, min: 0, max: 1, audioParam: gain.gain, label: "Level" },
      },
    };
  }

  _createMixer2(id) {
    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    const merger = this.ctx.createGain();
    gain1.gain.value = 0.5;
    gain2.gain.value = 0.5;
    gain1.connect(merger);
    gain2.connect(merger);
    return {
      id, type: "Mixer2", node: merger, outputNode: merger,
      outputs: { Out: merger },
      inputs: { In1: gain1, In2: gain2 },
      _nodes: [gain1, gain2, merger],
      params: {
        level1: { value: 0.5, min: 0, max: 1, audioParam: gain1.gain, label: "Lvl 1" },
        level2: { value: 0.5, min: 0, max: 1, audioParam: gain2.gain, label: "Lvl 2" },
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
        // Directly set frequency on connected oscillator pitch targets
        kbd._pitchTargets.forEach(({ audioParam }) => {
          audioParam.setValueAtTime(freq, now);
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

    // Note -> PitchMod: direct pitch tracking (Keyboard, NoteSeqA, NoteSeqB)
    const isNoteSource = (fromMod.type === "Keyboard" || fromMod.type === "NoteSeqA" || fromMod.type === "NoteSeqB") && fromPort === "Note";
    if (isNoteSource && inputNode instanceof AudioParam) {
      fromMod._pitchTargets.push({ audioParam: inputNode, moduleId: toId, port: toPort });
      this.connections.push({ fromId, fromPort, toId, toPort });
      return true;
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

    // Note pitch targets (Keyboard, NoteSeqA, NoteSeqB)
    const isNoteSource = (fromMod.type === "Keyboard" || fromMod.type === "NoteSeqA" || fromMod.type === "NoteSeqB") && fromPort === "Note";
    if (isNoteSource && inputNode instanceof AudioParam) {
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
    mod.params[paramName].value = value;
    if (mod.params[paramName].audioParam) {
      mod.params[paramName].audioParam.setValueAtTime(value, this.ctx.currentTime);
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
    // OscA: coarse/fine tuning + propagate to slaves
    if (mod.type === "OscA" && (paramName === "coarse" || paramName === "fine" || paramName === "frequency")) {
      const baseFreq = mod.params.frequency.value;
      const coarse = mod.params.coarse.value;
      const fine = mod.params.fine.value;
      const semitones = coarse + fine / 100;
      const freq = baseFreq * Math.pow(2, semitones / 12);
      mod.node.frequency.setValueAtTime(freq, this.ctx.currentTime);
      mod._frequency = freq;
      this._propagateToSlaves(mod);
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
    // OscB/OscC: update _frequency for slave propagation
    if ((mod.type === "OscB" || mod.type === "OscC") && paramName === "frequency") {
      mod._frequency = value;
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
    // Slave waveform change
    if (mod.type === "OscSlvA" && paramName === "waveform") {
      mod.node.type = value;
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
