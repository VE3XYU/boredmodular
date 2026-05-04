class PulseProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency',  defaultValue: 440, minValue: 0,    maxValue: 22050, automationRate: 'a-rate' },
      { name: 'pulseWidth', defaultValue: 0.5, minValue: 0.01, maxValue: 0.99,  automationRate: 'a-rate' },
    ];
  }

  constructor() {
    super();
    this.phase = 0;
  }

  process(_inputs, outputs, params) {
    const ch = outputs[0][0];
    const f = params.frequency;
    const w = params.pulseWidth;
    const inv = 1 / sampleRate;
    for (let i = 0; i < ch.length; i++) {
      const fi = f.length > 1 ? f[i] : f[0];
      const wi = w.length > 1 ? w[i] : w[0];
      ch[i] = this.phase < wi ? 1 : -1;
      this.phase += fi * inv;
      if (this.phase >= 1) this.phase -= 1;
      else if (this.phase < 0) this.phase += 1;
    }
    return true;
  }
}

registerProcessor('pulse-processor', PulseProcessor);
