import { getTideLevel, isFullMoon } from './moon.js';
import { getPhaseByDay, lerpColor, isNightTime } from './cycle.js';

const NUM_LAYERS = 6;
const POINTS_PER_WAVE = 16;
const BASE_AMPLITUDE = 26;
const FPS = 30;
const FRAME_INTERVAL = 1000 / FPS;

const DEFAULT_WAVE_RGB = [15, 25, 40];

const LAYER_CONFIGS = [
  { speed: 0.18, amp: 0.3, opacity: 0.06, yShift: -20, depthMix: 0 },
  { speed: 0.28, amp: 0.4, opacity: 0.10, yShift: -8, depthMix: 0.15 },
  { speed: 0.42, amp: 0.55, opacity: 0.18, yShift: 0, depthMix: 0.3 },
  { speed: 0.6, amp: 0.7, opacity: 0.26, yShift: 10, depthMix: 0.5 },
  { speed: 0.82, amp: 0.88, opacity: 0.36, yShift: 22, depthMix: 0.7 },
  { speed: 1.05, amp: 1.0, opacity: 0.48, yShift: 36, depthMix: 0.9 },
];

export class WaveEngine {
  constructor(canvasId, moonPhase, cycleDay) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.moonPhase = moonPhase;
    this.tideLevel = getTideLevel(moonPhase);
    this.tidePulse = 0;
    this.time = 0;
    this.running = false;
    this.lastFrame = 0;
    this.particles = [];
    this.foamParticles = [];

    this.cycleDay = cycleDay;
    this.phaseColor = cycleDay
      ? getPhaseByDay(cycleDay).waveColor
      : DEFAULT_WAVE_RGB;

    this.nightMode = isNightTime();
    this.entranceProgress = 0;
    this.entranceDuration = 1.5;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    this.running = true;
    this.lastFrame = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
  }

  pulse() {
    this.tidePulse = 1;
  }

  setCycleDay(day) {
    this.cycleDay = day;
    if (day) {
      this.phaseColor = getPhaseByDay(day).waveColor;
    }
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    if (now - this.lastFrame >= FRAME_INTERVAL) {
      this.lastFrame = now;
      this.render();
      this.time += 1 / FPS;
      if (this.entranceProgress < 1) {
        this.entranceProgress = Math.min(1, this.entranceProgress + (1 / FPS) / this.entranceDuration);
      }
      if (this.tidePulse > 0) {
        this.tidePulse *= 0.97;
        if (this.tidePulse < 0.01) this.tidePulse = 0;
      }
    }
    requestAnimationFrame(() => this.loop());
  }

  render() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    this.drawSky();
    this.drawMoonGlow();

    for (let i = 0; i < NUM_LAYERS; i++) {
      this.drawWaveLayer(i);
    }

    this.drawFoam();

    if (isFullMoon(this.moonPhase)) {
      this.updateMoonParticles();
      this.drawMoonParticles();
    }

    this.drawMoonReflection();
  }

  drawSky() {
    const { ctx, width, height } = this;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  }

  drawMoonGlow() {
    const { ctx, width, height, moonPhase } = this;
    const intensity = Math.pow(Math.sin(moonPhase * Math.PI), 2) * this.entranceProgress;
    if (intensity < 0.1) return;

    const phase = this.cycleDay ? getPhaseByDay(this.cycleDay) : null;
    const glowColor = phase?.glowColor || [192, 197, 206];

    const grad = ctx.createRadialGradient(
      width * 0.5, height * 0.06, 0,
      width * 0.5, height * 0.06, height * 0.4 * intensity
    );
    grad.addColorStop(0, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${0.06 * intensity})`);
    grad.addColorStop(0.4, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${0.02 * intensity})`);
    grad.addColorStop(1, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  getLayerColor(layerIdx) {
    const config = LAYER_CONFIGS[layerIdx];
    const base = DEFAULT_WAVE_RGB;
    const target = this.phaseColor;
    return lerpColor(base, target, config.depthMix * 0.6);
  }

  drawWaveLayer(layerIdx) {
    const { ctx, width, height, time, tideLevel, tidePulse } = this;
    const config = LAYER_CONFIGS[layerIdx];
    const segmentWidth = width / (POINTS_PER_WAVE - 1);
    const effectiveTide = Math.min(1, tideLevel + tidePulse * 0.08);
    const baseY = height * (0.42 + 0.32 * (1 - effectiveTide)) + config.yShift;

    const layerDelay = layerIdx / NUM_LAYERS * 0.3;
    const layerProgress = Math.max(0, Math.min(1, (this.entranceProgress - layerDelay) / (1 - layerDelay)));
    const layerEase = 1 - Math.pow(1 - layerProgress, 3);
    const riseOffset = (1 - layerEase) * height * 0.5;

    const points = [];
    for (let i = 0; i < POINTS_PER_WAVE; i++) {
      const x = i * segmentWidth;
      const y = baseY + riseOffset + this.calcWaveY(x, config, time) * layerEase;
      points.push({ x, y });
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const cpX = (points[i].x + points[i + 1].x) / 2;
      const cpY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, cpX, cpY);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    const color = this.getLayerColor(layerIdx);
    const entranceAlpha = layerEase;
    const grad = ctx.createLinearGradient(0, baseY + riseOffset - 40, 0, height);
    grad.addColorStop(0, `rgba(${color[0] + 20}, ${color[1] + 20}, ${color[2] + 25}, ${config.opacity * entranceAlpha})`);
    grad.addColorStop(0.5, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${config.opacity * 0.85 * entranceAlpha})`);
    grad.addColorStop(1, `rgba(${Math.max(0, color[0] - 10)}, ${Math.max(0, color[1] - 10)}, ${Math.max(0, color[2] - 5)}, ${config.opacity * 0.6 * entranceAlpha})`);
    ctx.fillStyle = grad;
    ctx.fill();

    if (layerIdx >= NUM_LAYERS - 2) {
      const phase = this.cycleDay ? getPhaseByDay(this.cycleDay) : null;
      const glow = phase?.glowColor || [100, 150, 200];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const cpX = (points[i].x + points[i + 1].x) / 2;
        const cpY = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, cpX, cpY);
      }
      ctx.strokeStyle = `rgba(${glow[0]}, ${glow[1]}, ${glow[2]}, ${config.opacity * 0.12})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    if (layerIdx === NUM_LAYERS - 1) {
      this.updateFoam(points);
    }
  }

  calcWaveY(x, config, time) {
    const s = config.speed;
    const a = config.amp * BASE_AMPLITUDE;
    const y1 = Math.sin(x * 0.0025 + time * s * 0.9) * a;
    const y2 = Math.sin(x * 0.006 + time * s * 1.4 + 2.1) * a * 0.4;
    const y3 = Math.sin(x * 0.01 + time * s * 0.6 + 4.7) * a * 0.2;
    const y4 = Math.sin(x * 0.015 + time * s * 1.8 + 1.3) * a * 0.1;
    return y1 + y2 + y3 + y4;
  }

  getWaveSurfaceY(x) {
    const config = LAYER_CONFIGS[NUM_LAYERS - 1];
    const effectiveTide = Math.min(1, this.tideLevel + this.tidePulse * 0.08);
    const baseY = this.height * (0.42 + 0.32 * (1 - effectiveTide)) + config.yShift;
    return baseY + this.calcWaveY(x, config, this.time);
  }

  updateFoam(surfacePoints) {
    if (Math.random() < 0.12) {
      const idx = Math.floor(Math.random() * surfacePoints.length);
      const pt = surfacePoints[idx];
      this.foamParticles.push({
        x: pt.x + (Math.random() - 0.5) * 20,
        y: pt.y - Math.random() * 3,
        size: 1 + Math.random() * 2.5,
        life: 40 + Math.random() * 30,
        maxLife: 40 + Math.random() * 30,
      });
    }

    for (let i = this.foamParticles.length - 1; i >= 0; i--) {
      const p = this.foamParticles[i];
      p.life--;
      p.x += (Math.random() - 0.5) * 0.5;
      p.y -= 0.05;
      if (p.life <= 0) this.foamParticles.splice(i, 1);
    }
    if (this.foamParticles.length > 60) {
      this.foamParticles.splice(0, this.foamParticles.length - 60);
    }
  }

  drawFoam() {
    const { ctx } = this;
    for (const p of this.foamParticles) {
      const fade = p.life / p.maxLife;
      const alpha = fade < 0.3 ? fade / 0.3 : (fade > 0.7 ? (1 - fade) / 0.3 : 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 210, 220, ${alpha * 0.15})`;
      ctx.fill();
    }
  }

  updateMoonParticles() {
    if (Math.random() < 0.08 && this.particles.length < 30) {
      const x = Math.random() * this.width;
      const y = this.getWaveSurfaceY(x);
      this.particles.push({
        x, y, opacity: 1,
        life: 90 + Math.random() * 40,
        maxLife: 90 + Math.random() * 40,
        drift: (Math.random() - 0.5) * 0.4,
        size: 1 + Math.random() * 1.5,
      });
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life--;
      p.opacity = p.life / p.maxLife;
      p.y -= 0.12;
      p.x += p.drift + Math.sin(p.life * 0.08) * 0.2;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  drawMoonParticles() {
    const { ctx } = this;
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(192, 197, 206, ${p.opacity * 0.12})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 225, 235, ${p.opacity * 0.6})`;
      ctx.fill();
    }
  }

  drawMoonReflection() {
    const { ctx, width, height, moonPhase, time } = this;
    const intensity = Math.pow(Math.sin(moonPhase * Math.PI), 2);
    if (intensity < 0.15) return;

    const surfaceY = this.getWaveSurfaceY(width * 0.5);
    const cx = width * 0.5;
    const reflWidth = 40 + intensity * 60;

    ctx.save();
    ctx.globalAlpha = intensity * 0.1;
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const y = surfaceY + t * (height - surfaceY) * 0.5;
      const wobble = Math.sin(time * 0.8 + i * 0.7) * (4 + i * 2);
      const w = reflWidth * (1 - t * 0.6);
      ctx.beginPath();
      ctx.ellipse(cx + wobble, y, w, 2 + (1 - t) * 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(192, 197, 206, ${(1 - t) * 0.8})`;
      ctx.fill();
    }
    ctx.restore();
  }
}
