// Sync-capable oscillator with selectable waveform.
// Sync input: rising-edge zero-crossing on input[0] resets phase to 0 (hard sync).
// Waveform encoded as integer: 0=sine, 1=sawtooth, 2=square, 3=triangle.
// Pulse width applies only to square waveform.

const TWO_PI = Math.PI * 2;

class SyncOscProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency',  defaultValue: 220, minValue: 0,    maxValue: 22050, automationRate: 'a-rate' },
      { name: 'pulseWidth', defaultValue: 0.5, minValue: 0.01, maxValue: 0.99,  automationRate: 'a-rate' },
      { name: 'waveform',   defaultValue: 1,   minValue: 0,    maxValue: 3,     automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();
    this.phase = 0;
    this.prevSync = 0;
  }

  process(inputs, outputs, params) {
    const ch = outputs[0][0];
    const syncCh = inputs[0] && inputs[0][0];
    const f = params.frequency;
    const pw = params.pulseWidth;
    const wave = Math.round(params.waveform[0]);
    const inv = 1 / sampleRate;

    for (let i = 0; i < ch.length; i++) {
      const sync = syncCh ? syncCh[i] : 0;
      if (this.prevSync <= 0 && sync > 0) {
        this.phase = 0;
      }
      this.prevSync = sync;

      const fi = f.length > 1 ? f[i] : f[0];
      let v;
      switch (wave) {
        case 0: v = Math.sin(this.phase * TWO_PI); break;
        case 1: v = 2 * this.phase - 1; break;
        case 2: {
          const wi = pw.length > 1 ? pw[i] : pw[0];
          v = this.phase < wi ? 1 : -1;
          break;
        }
        case 3: v = 4 * Math.abs(this.phase - 0.5) - 1; break;
        default: v = 0;
      }
      ch[i] = v;

      this.phase += fi * inv;
      if (this.phase >= 1) this.phase -= 1;
      else if (this.phase < 0) this.phase += 1;
    }
    return true;
  }
}

registerProcessor('sync-osc-processor', SyncOscProcessor);
