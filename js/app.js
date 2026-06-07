import { getMoonPhase, getMoonPhaseName, isFullMoon, getTideLevel } from './moon.js';
import { getCycleDay, getPhaseByDay, saveCycleStart, loadCycleData, isNightTime, saveCycleLength, getCycleLength } from './cycle.js';
import { getBodyPoem } from './body-poems.js';
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

    if (this.cycleDay) {
      this.showCycleView();
    } else {
      this.showSetupPrompt();
    }

    const res = await fetch('data/narratives.json');
    const stories = await res.json();
    this.narratives = new NarrativeEngine(stories, this.moonPhase);
    this.narratives.start();

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
    if (this.cycleDay) {
      setTimeout(() => this.milestones.check(), 3000);
    }

    this.setupAudio();
    this.setupStartOverlay();

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
    const phase = getPhaseByDay(Math.max(1, Math.min(28, Math.round((this.cycleDay / cycleLength) * 28))));
    const scaledDay = Math.max(1, Math.min(28, Math.round((this.cycleDay / cycleLength) * 28)));
    const poem = getBodyPoem(scaledDay);
    const lineContainer = document.getElementById('cycle-line-container');
    if (lineContainer) {
      this.cycleLine = new CycleLine(lineContainer, this.cycleDay);
    }

    const phaseDesc = document.getElementById('phase-description');
    if (phaseDesc) {
      phaseDesc.innerHTML = `
        <span class="phase-today">今天：${phase.alias} · 「${phase.name}」</span>
        <span class="phase-body">${poem.text}</span>
      `;
      phaseDesc.style.display = '';
    }
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
      }, 600);
    });

    skipBtn.addEventListener('click', () => {
      setup.classList.add('fading');
      setTimeout(() => {
        setup.classList.add('hidden');
        setup.classList.remove('fading');
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
      icon.classList.toggle('off', !this.audio.isPlaying);
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
      setTimeout(() => overlay.classList.add('hidden'), 1200);
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
