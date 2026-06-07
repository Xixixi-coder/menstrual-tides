const app = getApp();
const { getPhaseByDay, getCycleColorForDay, getBodyPoem } = require('../../utils/cycle');
const { getMoonPhaseName, isFullMoon, getTideLevel } = require('../../utils/moon');

Page({
  data: {
    moonIcon: '',
    moonName: '',
    cycleDay: null,
    phaseName: '',
    phaseAlias: '',
    phaseColor: '',
    bodyPoem: '',
    showSetup: false,
    canvasWidth: 0,
    canvasHeight: 0,
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo();
    this.setData({
      canvasWidth: sysInfo.windowWidth,
      canvasHeight: sysInfo.windowHeight,
    });

    this.initData();
  },

  onShow() {
    this.initData();
  },

  initData() {
    const moonPhase = app.globalData.moonPhase;
    const moonInfo = getMoonPhaseName(moonPhase);
    const cycleDay = app.globalData.cycleDay;
    const cycleLength = app.globalData.cycleLength;

    const updates = {
      moonIcon: moonInfo.icon,
      moonName: moonInfo.name,
      cycleDay,
    };

    if (cycleDay) {
      const scaledDay = Math.max(1, Math.min(28, Math.round((cycleDay / cycleLength) * 28)));
      const phase = getPhaseByDay(scaledDay);
      const poem = getBodyPoem(scaledDay);
      updates.phaseName = phase.name;
      updates.phaseAlias = phase.alias;
      updates.phaseColor = phase.color;
      updates.bodyPoem = poem.text;
      updates.showSetup = false;
    } else {
      updates.showSetup = true;
    }

    this.setData(updates);
    this.startWaveAnimation();
  },

  startWaveAnimation() {
    const query = wx.createSelectorQuery();
    query.select('#tideCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        this.canvas = canvas;
        this.ctx = ctx;
        this.canvasW = res[0].width;
        this.canvasH = res[0].height;
        this.time = 0;
        this.animateWave();
      });
  },

  animateWave() {
    if (!this.ctx) return;
    const { ctx, canvasW: w, canvasH: h } = this;

    ctx.clearRect(0, 0, w, h);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#060D18');
    sky.addColorStop(0.4, '#0F2035');
    sky.addColorStop(1, '#08101E');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Draw 4 wave layers
    const cycleDay = this.data.cycleDay;
    const baseColor = cycleDay
      ? getCycleColorForDay(Math.max(1, Math.min(28, Math.round((cycleDay / app.globalData.cycleLength) * 28))))
      : [30, 58, 95];

    const layers = [
      { speed: 0.2, amp: 0.3, opacity: 0.12, yShift: -15 },
      { speed: 0.4, amp: 0.55, opacity: 0.22, yShift: 0 },
      { speed: 0.7, amp: 0.8, opacity: 0.35, yShift: 15 },
      { speed: 1.0, amp: 1.0, opacity: 0.5, yShift: 30 },
    ];

    const moonPhase = app.globalData.moonPhase || 0.5;
    const tideLevel = 0.3 + 0.7 * Math.pow(Math.sin(moonPhase * Math.PI), 2);

    for (const layer of layers) {
      const baseY = h * (0.45 + 0.3 * (1 - tideLevel)) + layer.yShift;
      ctx.beginPath();
      ctx.moveTo(0, baseY);

      for (let x = 0; x <= w; x += 4) {
        const y1 = Math.sin(x * 0.003 + this.time * layer.speed * 0.9) * 20 * layer.amp;
        const y2 = Math.sin(x * 0.007 + this.time * layer.speed * 1.4) * 8 * layer.amp;
        ctx.lineTo(x, baseY + y1 + y2);
      }

      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();

      const r = Math.min(255, baseColor[0] + 10);
      const g = Math.min(255, baseColor[1] + 10);
      const b = Math.min(255, baseColor[2] + 15);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${layer.opacity})`;
      ctx.fill();
    }

    this.time += 1 / 30;
    this.waveTimer = canvas.requestAnimationFrame(() => this.animateWave());
  },

  onSetupConfirm(e) {
    const date = new Date(e.detail.value);
    app.saveCycleStart(date);
    this.initData();
  },

  onSetupSkip() {
    this.setData({ showSetup: false });
  },

  onUnload() {
    if (this.waveTimer && this.canvas) {
      this.canvas.cancelAnimationFrame(this.waveTimer);
    }
  },
});
