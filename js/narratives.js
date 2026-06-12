import { isFullMoon } from './moon.js';

const SAVED_KEY = 'menstrual-tides-saved-stories';

export class NarrativeEngine {
  constructor(stories, moonPhase) {
    this.stories = stories;
    this.moonPhase = moonPhase;
    this.currentId = null;
    this.history = [];
    this.timer = null;
    this.saved = this.loadSaved();

    this.card = document.getElementById('narrative-card');
    this.textEl = this.card.querySelector('.narrative-text');
    this.sourceEl = this.card.querySelector('.narrative-source');
    this.cultureEl = this.card.querySelector('.narrative-culture');
    this.badge = this.card.querySelector('.narrative-badge');
    this.saveBtn = this.card.querySelector('.narrative-save');

    this.card.addEventListener('click', (e) => {
      if (e.target === this.saveBtn || this.saveBtn.contains(e.target)) return;
      this.showNext();
    });

    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSave();
      });
    }
  }

  loadSaved() {
    try {
      return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
    } catch {
      return [];
    }
  }

  persistSaved() {
    localStorage.setItem(SAVED_KEY, JSON.stringify(this.saved));
  }

  toggleSave() {
    if (!this.currentId) return;
    const idx = this.saved.indexOf(this.currentId);
    if (idx >= 0) {
      this.saved.splice(idx, 1);
      this.saveBtn.classList.remove('saved');
      this.saveBtn.textContent = '♡';
    } else {
      this.saved.push(this.currentId);
      this.saveBtn.classList.add('saved');
      this.saveBtn.textContent = '♥';
    }
    this.persistSaved();
  }

  updateSaveBtn() {
    if (!this.saveBtn) return;
    if (this.saved.includes(this.currentId)) {
      this.saveBtn.classList.add('saved');
      this.saveBtn.textContent = '♥';
    } else {
      this.saveBtn.classList.remove('saved');
      this.saveBtn.textContent = '♡';
    }
  }

  start() {
    setTimeout(() => this.showNext(), 3000);
  }

  scheduleNext() {
    if (this.timer) clearTimeout(this.timer);
    const fullMoon = isFullMoon(this.moonPhase);
    const min = fullMoon ? 22000 : 16000;
    const max = fullMoon ? 40000 : 30000;
    const delay = min + Math.random() * (max - min);
    this.timer = setTimeout(() => this.showNext(), delay);
  }

  showNext() {
    const candidates = this.getCandidates();
    if (!candidates.length) return;
    const story = candidates[Math.floor(Math.random() * candidates.length)];
    this.currentId = story.id;
    this.history.push(story.id);
    if (this.history.length > this.stories.length * 0.7) {
      this.history = this.history.slice(-3);
    }
    this.animateIn(story);
    this.scheduleNext();
  }

  getCandidates() {
    const fullMoon = isFullMoon(this.moonPhase);
    if (fullMoon && Math.random() < 0.55) {
      const moonStories = this.stories.filter(
        s => s.moonPhase === 'full' && !this.history.includes(s.id)
      );
      if (moonStories.length > 0) return moonStories;
    }
    return this.stories.filter(s => !this.history.includes(s.id));
  }

  animateIn(story) {
    const fullMoon = isFullMoon(this.moonPhase) && story.moonPhase === 'full';

    this.card.classList.remove('visible', 'float-up');

    // Hide phase-desc to prevent overlap on mobile
    const phaseDesc = document.getElementById('phase-description');
    if (phaseDesc) phaseDesc.classList.add('narrative-active');

    setTimeout(() => {
      this.textEl.textContent = story.text;
      this.sourceEl.textContent = '— ' + story.source;

      if (story.culture) {
        this.cultureEl.textContent = story.culture;
        this.cultureEl.style.display = '';
      } else {
        this.cultureEl.style.display = 'none';
      }

      if (fullMoon) {
        this.badge.classList.remove('hidden');
        this.card.classList.add('fullmoon');
      } else {
        this.badge.classList.add('hidden');
        this.card.classList.remove('fullmoon');
      }

      this.updateSaveBtn();
      this.card.classList.add('float-up');

      setTimeout(() => {
        this.card.classList.add('visible');
      }, 50);
    }, 900);
  }
}
