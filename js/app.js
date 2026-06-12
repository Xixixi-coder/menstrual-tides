import { getMoonPhase, getMoonPhaseName, isFullMoon, getTideLevel } from './moon.js';
import { getCycleDay, getPhaseByDay, saveCycleStart, loadCycleData, isNightTime, saveCycleLength, getCycleLength } from './cycle.js';
import { getBodyPoem, getDayContent } from './body-poems.js';
import { CycleLine } from './cycle-line.js';
import { WaveEngine } from './wave-engine.js';
import { OceanAudio } from './audio.js';
import { NarrativeEngine } from './narratives.js';
import { MarkSystem } from './mark.js';
import { CollectiveTide } from './collective.js';
import { PosterGenerator } from './poster.js';
import { SpectrumExplorer } from './spectrum-explorer.js';
import { MilestoneSystem } from './milestones.js';

const LAST_VISIT_KEY = 'menstrual-tides-last-visit';

class App {
  async init() {
    this.moonPhase = getMoonPhase(new Date());
    this.moonInfo = getMoonPhaseName(this.moonPhase);
    this.cycleDay = getCycleDay();

    this.renderMoon();
    this.checkMissedDays();

    this.waveEngine = new WaveEngine('tide-canvas', this.moonPhase, this.cycleDay);
    this.waveEngine.start();

    this.audio = new OceanAudio();
    this.audio.setTideLevel(getTideLevel(this.moonPhase));

    this.setupAudio();
    this.setupStartOverlay();

    const res = await fetch('./data/narratives.json');
    const stories = await res.json();
    this.narratives = new NarrativeEngine(stories, this.moonPhase);

    this.markSystem = new MarkSystem(this.waveEngine, this.audio);

    const collectiveEl = document.getElementById('collective-layer');
    if (collectiveEl) {
      this.collective = new CollectiveTide(collectiveEl, this.waveEngine);
    }

    this.poster = new PosterGenerator();
    this.setupPosterButton();

    const spectrumEl = document.getElementById('spectrum-explorer');
    if (spectrumEl) {
      this.spectrum = new SpectrumExplorer(spectrumEl, this.waveEngine);
    }

    this.milestones = new MilestoneSystem();

    if (isNightTime()) {
      document.body.classList.add('night-mode');
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.audio.resume();
    });

    this.saveVisit();
  }

  renderMoon() {
    const container = document.getElementById('moon-phase');
    const iconEl = container.querySelector('.moon-icon');
    const labelEl = container.querySelector('.moon-label');
    const startMoon = document.querySelector('.start-moon');

    startMoon.textContent = this.moonInfo.icon;
    iconEl.textContent = this.moonInfo.icon;
    labelEl.textContent = this.moonInfo.name;

    if (isFullMoon(this.moonPhase)) {
      iconEl.classList.add('fullmoon-glow');
    }
  }

  showCycleView() {
    const cycleLength = getCycleLength();
    const scaledDay = Math.max(1, Math.min(28, Math.round((this.cycleDay / cycleLength) * 28)));
    const phase = getPhaseByDay(scaledDay);
    const poem = getBodyPoem(scaledDay);
    const content = getDayContent(scaledDay);
    const lineContainer = document.getElementById('cycle-line-container');
    if (lineContainer) {
      this.cycleLine = new CycleLine(lineContainer, this.cycleDay);
    }

    const phaseDesc = document.getElementById('phase-description');
    if (phaseDesc) {
      const bodySpan = document.createElement('span');
      bodySpan.className = 'phase-body';

      const todaySpan = phaseDesc.querySelector('.phase-today');
      if (todaySpan) todaySpan.remove();
      const oldBody = phaseDesc.querySelector('.phase-body');
      if (oldBody) oldBody.remove();

      const newToday = document.createElement('span');
      newToday.className = 'phase-today';
      newToday.textContent = `第 ${this.cycleDay} 天 / ${cycleLength} 天 · ${phase.alias} · 「${phase.name}」`;

      const tipsInline = phaseDesc.querySelector('.phase-tips-inline');
      phaseDesc.insertBefore(bodySpan, tipsInline);
      phaseDesc.insertBefore(newToday, bodySpan);

      phaseDesc.style.display = '';

      setTimeout(() => {
        phaseDesc.style.opacity = '1';
        phaseDesc.style.transform = 'translateY(0)';
        this.typewrite(bodySpan, poem.text, 60);
      }, 200);

      this.setupTipsInline(content);
    }

    const bottomBar = document.querySelector('.bottom-bar');
    if (bottomBar) {
      setTimeout(() => bottomBar.classList.add('glow-burst'), 500);
    }
  }

  typewrite(el, text, speed) {
    el.style.opacity = '0.85';
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
        setTimeout(tick, speed);
      }
    };
    tick();
  }

  setupTipsInline(content) {
    const tipsEl = document.getElementById('tips-inline');
    const bodyEl = document.getElementById('tips-body');
    const moodEl = document.getElementById('tips-mood');
    if (!tipsEl || !content) return;

    bodyEl.textContent = content.tip;
    moodEl.textContent = content.mood;
    tipsEl.classList.remove('hidden');
  }

  showSetupPrompt() {
    const setup = document.getElementById('cycle-setup');
    if (!setup) return;
    setup.classList.remove('hidden');

    const confirmBtn = setup.querySelector('#setup-confirm');
    const skipBtn = setup.querySelector('#setup-skip');
    const dateInput = setup.querySelector('#setup-date');
    const lengthInput = setup.querySelector('#setup-length');
    const lengthVal = setup.querySelector('#setup-length-val');

    if (dateInput) {
      const today = new Date();
      dateInput.value = today.toISOString().split('T')[0];
    }

    if (lengthInput && lengthVal) {
      lengthInput.addEventListener('input', () => {
        lengthVal.textContent = lengthInput.value;
      });
    }

    confirmBtn.addEventListener('click', () => {
      const date = dateInput.value ? new Date(dateInput.value) : new Date();
      const len = lengthInput ? parseInt(lengthInput.value, 10) : 28;
      saveCycleLength(len);
      saveCycleStart(date);
      this.cycleDay = getCycleDay();
      this.waveEngine.setCycleDay(this.cycleDay);
      setup.classList.add('fading');
      setTimeout(() => {
        setup.classList.add('hidden');
        setup.classList.remove('fading');
        this.showCycleView();
        this.narratives.start();
        this.milestones.check();
      }, 600);
    });

    skipBtn.addEventListener('click', () => {
      setup.classList.add('fading');
      setTimeout(() => {
        setup.classList.add('hidden');
        setup.classList.remove('fading');
        this.narratives.start();
      }, 600);
    });
  }

  checkMissedDays() {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    if (!lastVisit) return;

    const last = new Date(lastVisit);
    const now = new Date();
    const daysMissed = Math.floor((now - last) / (1000 * 60 * 60 * 24));

    if (daysMissed >= 7) {
      document.body.classList.add('missed-you');
      setTimeout(() => document.body.classList.remove('missed-you'), 5000);
    }
  }

  saveVisit() {
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
  }

  setupAudio() {
    const toggleBtn = document.getElementById('audio-toggle');
    const icon = toggleBtn.querySelector('.audio-icon');

    toggleBtn.addEventListener('click', () => {
      this.audio.toggle();
      const label = this.audio.getVolumeLabel();
      icon.classList.toggle('off', label === 'off');
      icon.textContent = label === 'off' ? '~' : label === 'low' ? '~' : '≈';
    });
  }

  setupStartOverlay() {
    const overlay = document.getElementById('start-overlay');

    const dismiss = () => {
      this.audio.init();
      this.audio.setTideLevel(getTideLevel(this.moonPhase));

      if (isFullMoon(this.moonPhase)) {
        setTimeout(() => this.audio.enableWhale(), 8000);
      }

      overlay.classList.add('fading');
      setTimeout(() => {
        overlay.classList.add('hidden');

        if (this.cycleDay) {
          this.showCycleView();
          this.narratives.start();
          setTimeout(() => this.milestones.check(), 3000);
        } else {
          this.showSetupPrompt();
        }
      }, 1200);

      overlay.removeEventListener('click', dismiss);
      overlay.removeEventListener('touchstart', dismiss);
    };

    overlay.addEventListener('click', dismiss);
    overlay.addEventListener('touchstart', dismiss, { passive: true });
  }

  setupPosterButton() {
    const btn = document.getElementById('poster-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const marks = this.markSystem.load();
      this.poster.downloadPoster(marks);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
