import { getMoonPhase } from './moon.js';
import { getPhaseByDay, getCycleDay, saveCycleStart, getCalibrationSuggestion, saveCycleLength, loadCycleData } from './cycle.js';

const STORAGE_KEY = 'menstrual-tides-marks';

const EMOTION_COLORS = {
  '平静': [192, 197, 206],
  '疲惫': [123, 109, 141],
  '疼痛': [232, 165, 152],
  '自由': [245, 245, 240],
  '敏感': [180, 150, 200],
  '有力': [244, 211, 94],
  '其他': [80, 120, 170],
};

export class MarkSystem {
  constructor(waveEngine, audio) {
    this.waveEngine = waveEngine;
    this.audio = audio;
    this.selectedEmotion = null;
    this.inPeriod = false;

    this.btn = document.getElementById('mark-btn');
    this.popup = document.getElementById('mark-popup');
    this.submitBtn = document.getElementById('mark-submit');
    this.closeBtn = document.getElementById('mark-close');
    this.textInput = document.getElementById('mark-text');
    this.tags = this.popup.querySelectorAll('.tag');
    this.poemHint = document.getElementById('poem-hint');
    this.periodStartBtn = document.getElementById('period-start-btn');
    this.periodEndBtn = document.getElementById('period-end-btn');

    this.particleCanvas = document.getElementById('particle-canvas');
    this.pCtx = this.particleCanvas.getContext('2d');
    this.resizeParticleCanvas();
    window.addEventListener('resize', () => this.resizeParticleCanvas());

    this.checkPeriodState();
    this.bindEvents();
    this.renderHistory();
    this.updatePoemHint();
  }

  resizeParticleCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.particleCanvas.width = window.innerWidth * dpr;
    this.particleCanvas.height = window.innerHeight * dpr;
    this.particleCanvas.style.width = window.innerWidth + 'px';
    this.particleCanvas.style.height = window.innerHeight + 'px';
    this.pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  updatePoemHint() {
    if (!this.poemHint) return;
    const cycleDay = getCycleDay();
    if (cycleDay) {
      const phase = getPhaseByDay(cycleDay);
      this.poemHint.textContent = `今天，激素在写一首${phase.poem}诗`;
      this.poemHint.style.display = '';
    } else {
      this.poemHint.style.display = 'none';
    }
  }

  bindEvents() {
    this.btn.addEventListener('click', () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());
    this.submitBtn.addEventListener('click', () => this.submit());

    this.tags.forEach(tag => {
      tag.addEventListener('click', () => {
        this.tags.forEach(t => t.classList.remove('selected'));
        tag.classList.add('selected');
        this.selectedEmotion = tag.dataset.emotion;
        this.submitBtn.disabled = false;
      });
    });

    this.popup.addEventListener('click', (e) => {
      if (e.target === this.popup) this.close();
    });

    if (this.periodStartBtn) {
      this.periodStartBtn.addEventListener('click', () => this.markPeriodStart());
    }
    if (this.periodEndBtn) {
      this.periodEndBtn.addEventListener('click', () => this.markPeriodEnd());
    }
  }

  checkPeriodState() {
    const data = loadCycleData();
    this.inPeriod = !!data.periodActive;
    this.updatePeriodUI();
  }

  updatePeriodUI() {
    if (!this.periodStartBtn || !this.periodEndBtn) return;
    if (this.inPeriod) {
      this.periodStartBtn.classList.add('active');
      this.periodStartBtn.textContent = '🔴 经期中';
      this.periodEndBtn.classList.remove('hidden');
    } else {
      this.periodStartBtn.classList.remove('active');
      this.periodStartBtn.textContent = '🔴 经期开始';
      this.periodEndBtn.classList.add('hidden');
    }
  }

  markPeriodStart() {
    if (this.inPeriod) return;
    this.inPeriod = true;
    const data = loadCycleData();
    data.periodActive = true;
    data.periodStartDate = new Date().toISOString();
    localStorage.setItem('menstrual-tides-cycle', JSON.stringify(data));

    saveCycleStart(new Date());
    this.updatePeriodUI();
    this.checkCalibration();
  }

  markPeriodEnd() {
    if (!this.inPeriod) return;
    this.inPeriod = false;
    const data = loadCycleData();
    data.periodActive = false;
    data.periodEndDate = new Date().toISOString();
    localStorage.setItem('menstrual-tides-cycle', JSON.stringify(data));
    this.updatePeriodUI();
  }

  checkCalibration() {
    const suggestion = getCalibrationSuggestion();
    if (!suggestion) return;

    const toast = document.getElementById('calibration-toast');
    const msg = document.getElementById('calibration-msg');
    const acceptBtn = document.getElementById('calibration-accept');
    const dismissBtn = document.getElementById('calibration-dismiss');
    if (!toast || !msg) return;

    msg.textContent = `你的周期平均 ${suggestion} 天，要调整吗？`;
    toast.classList.add('show');

    const hide = () => {
      toast.classList.remove('show');
      acceptBtn.removeEventListener('click', onAccept);
      dismissBtn.removeEventListener('click', onDismiss);
    };

    const onAccept = () => {
      saveCycleLength(suggestion);
      hide();
    };
    const onDismiss = () => hide();

    acceptBtn.addEventListener('click', onAccept);
    dismissBtn.addEventListener('click', onDismiss);
  }

  open() {
    this.popup.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.popup.classList.add('visible'));
    });
    this.btn.style.opacity = '0';
    this.btn.style.pointerEvents = 'none';
  }

  close() {
    this.popup.classList.remove('visible');
    setTimeout(() => {
      this.popup.classList.add('hidden');
      this.reset();
      this.btn.style.opacity = '';
      this.btn.style.pointerEvents = '';
    }, 500);
  }

  reset() {
    this.selectedEmotion = null;
    this.textInput.value = '';
    this.submitBtn.disabled = true;
    this.tags.forEach(t => t.classList.remove('selected'));
  }

  submit() {
    if (!this.selectedEmotion) return;

    const entry = {
      id: Date.now(),
      emotion: this.selectedEmotion,
      text: this.textInput.value.trim(),
      date: new Date().toISOString(),
      moonPhase: getMoonPhase(new Date()),
      cycleDay: getCycleDay(),
    };

    this.save(entry);
    this.close();

    setTimeout(() => {
      this.playParticleAnimation(this.selectedEmotion);
      this.waveEngine.pulse();
      if (this.audio) this.audio.playDroplet();
      this.showToast();
    }, 600);

    this.renderHistory();
    this.showPosterButton();
  }

  showToast() {
    const toast = document.getElementById('submit-toast');
    if (!toast) return;
    toast.classList.remove('hidden');
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 600);
    }, 3000);
  }

  showPosterButton() {
    const btn = document.getElementById('poster-btn');
    if (!btn) return;
    const marks = this.load();
    if (marks.length >= 3) {
      btn.classList.remove('hidden');
    }
  }

  save(entry) {
    const marks = this.load();
    marks.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  renderHistory() {
    const counter = document.getElementById('mark-counter');
    if (!counter) return;
    const marks = this.load();
    if (marks.length > 0) {
      counter.textContent = `已汇入 ${marks.length} 笔`;
      counter.classList.remove('hidden');
    }
  }

  playParticleAnimation(emotion) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const startX = w / 2;
    const startY = h * 0.85;
    const targetX = w * (0.25 + Math.random() * 0.5);
    const targetY = this.waveEngine.getWaveSurfaceY(targetX);
    const color = EMOTION_COLORS[emotion] || EMOTION_COLORS['其他'];

    const totalFrames = 75;
    let frame = 0;
    const trails = [];

    const animate = () => {
      const ctx = this.pCtx;
      ctx.clearRect(0, 0, w, h);

      const t = frame / totalFrames;
      const eased = 1 - Math.pow(1 - t, 3);

      const x = startX + (targetX - startX) * eased;
      const arcHeight = 70 + Math.abs(targetX - startX) * 0.15;
      const y = startY + (targetY - startY) * eased - Math.sin(t * Math.PI) * arcHeight;
      const radius = 3 + Math.sin(t * Math.PI) * 4.5;
      const opacity = t < 0.7 ? 1 : (1 - t) / 0.3;

      if (frame % 3 === 0 && t < 0.85) {
        trails.push({
          x: x + (Math.random() - 0.5) * 4,
          y: y + (Math.random() - 0.5) * 4,
          life: 22, maxLife: 22,
          size: 1 + Math.random() * 1.5,
        });
      }

      for (let i = trails.length - 1; i >= 0; i--) {
        const tr = trails[i];
        tr.life--;
        if (tr.life <= 0) { trails.splice(i, 1); continue; }
        const a = (tr.life / tr.maxLife) * 0.35;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, tr.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${a})`;
        ctx.fill();
      }

      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
      ctx.fill();
      ctx.restore();

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, w, h);
        this.playRipple(targetX, targetY, color);
      }
    };

    requestAnimationFrame(animate);
  }

  playRipple(x, y, color) {
    const ctx = this.pCtx;
    const w = window.innerWidth;
    const h = window.innerHeight;
    let frame = 0;
    const totalFrames = 50;

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      for (let r = 0; r < 3; r++) {
        const offset = r * 8;
        const t = Math.max(0, (frame - offset)) / (totalFrames - offset);
        if (t < 0 || t > 1) continue;
        ctx.beginPath();
        ctx.arc(x, y, 4 + t * 35, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(1 - t) * 0.4})`;
        ctx.lineWidth = 1.2 * (1 - t);
        ctx.stroke();
      }
      frame++;
      if (frame < totalFrames + 24) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };
    requestAnimationFrame(animate);
  }
}
