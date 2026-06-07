export class OceanAudio {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.volumeLevel = 1; // 0=off, 1=low(0.12), 2=medium(0.22)
    this.volumes = [0, 0.12, 0.22];
    this.masterGain = null;
    this.whaleGain = null;
    this.whaleEnabled = false;
    this.nightMode = this.checkNight();
  }

  checkNight() {
    const h = new Date().getHours();
    return h >= 22 || h < 6;
  }

  get volume() {
    const base = this.volumes[this.volumeLevel] || 0;
    return this.nightMode ? base * 0.6 : base;
  }

  init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.buildOcean();
    this.isPlaying = true;
  }

  buildOcean() {
    const ctx = this.audioCtx;
    const sr = ctx.sampleRate;
    const len = sr * 6;
    const buf = ctx.createBuffer(2, len, sr);

    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lp1 = ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.value = 400;
    lp1.Q.value = 0.7;

    const lp2 = ctx.createBiquadFilter();
    lp2.type = 'lowpass';
    lp2.frequency.value = 750;
    lp2.Q.value = 0.5;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 30;
    hp.Q.value = 0.5;

    const lfo1 = ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.value = 0.07;
    const lfoG1 = ctx.createGain();
    lfoG1.gain.value = 0.22;

    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.12;
    const lfoG2 = ctx.createGain();
    lfoG2.gain.value = 0.1;

    const lfo3 = ctx.createOscillator();
    lfo3.type = 'sine';
    lfo3.frequency.value = 0.03;
    const lfoG3 = ctx.createGain();
    lfoG3.gain.value = 0.06;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.volume;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 4;
    comp.knee.value = 12;

    src.connect(lp1);
    lp1.connect(lp2);
    lp2.connect(hp);
    hp.connect(this.masterGain);
    this.masterGain.connect(comp);
    comp.connect(ctx.destination);

    lfo1.connect(lfoG1);
    lfoG1.connect(this.masterGain.gain);
    lfo2.connect(lfoG2);
    lfoG2.connect(this.masterGain.gain);
    lfo3.connect(lfoG3);
    lfoG3.connect(this.masterGain.gain);

    src.start();
    lfo1.start();
    lfo2.start();
    lfo3.start();
  }

  enableWhale() {
    if (this.whaleEnabled || !this.audioCtx) return;
    this.whaleEnabled = true;
    this.playWhaleLoop();
  }

  playWhaleLoop() {
    if (!this.whaleEnabled || !this.isPlaying) return;
    this.playWhaleCall();
    const next = 25000 + Math.random() * 35000;
    setTimeout(() => this.playWhaleLoop(), next);
  }

  playWhaleCall() {
    const ctx = this.audioCtx;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const duration = 3 + Math.random() * 2;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 80 + Math.random() * 40;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + duration * 0.3);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + duration * 0.8);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.5, now + duration);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2.02, now);
    osc2.frequency.linearRampToValueAtTime(baseFreq * 3, now + duration * 0.3);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + duration);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.03, now + duration * 0.15);
    env.gain.setValueAtTime(0.03, now + duration * 0.4);
    env.gain.linearRampToValueAtTime(0.015, now + duration * 0.7);
    env.gain.linearRampToValueAtTime(0, now + duration);

    const env2 = ctx.createGain();
    env2.gain.setValueAtTime(0, now);
    env2.gain.linearRampToValueAtTime(0.012, now + duration * 0.2);
    env2.gain.linearRampToValueAtTime(0, now + duration);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    lp.Q.value = 2;

    const vibrato = ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.value = 4 + Math.random() * 2;
    const vibGain = ctx.createGain();
    vibGain.gain.value = 3;
    vibrato.connect(vibGain);
    vibGain.connect(osc.frequency);

    osc.connect(env);
    osc2.connect(env2);
    env.connect(lp);
    env2.connect(lp);
    lp.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    vibrato.start(now);
    osc.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
    vibrato.stop(now + duration + 0.1);
  }

  playDroplet() {
    const ctx = this.audioCtx;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const freq = 800 + Math.random() * 400;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + 0.4);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.06, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2000;

    osc.connect(env);
    env.connect(lp);
    lp.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  setTideLevel(level) {
    if (!this.audioCtx || !this.isPlaying) return;
    const vol = this.volume * (0.6 + level * 0.4);
    const now = this.audioCtx.currentTime;
    this.masterGain.gain.setTargetAtTime(vol, now, 0.5);
  }

  toggle() {
    if (!this.audioCtx) {
      this.init();
      return;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Cycle: low → medium → off → low ...
    this.volumeLevel = (this.volumeLevel + 1) % 3;
    this.isPlaying = this.volumeLevel > 0;

    const now = this.audioCtx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.5);
  }

  getVolumeLabel() {
    if (this.volumeLevel === 0) return 'off';
    if (this.volumeLevel === 1) return 'low';
    return 'medium';
  }

  resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }
}
