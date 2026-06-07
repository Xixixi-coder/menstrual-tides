export class CollectiveTide {
  constructor(container, waveEngine) {
    this.container = container;
    this.waveEngine = waveEngine;
    this.isOpen = false;
    this.setupGesture();
  }

  setupGesture() {
    const hint = document.getElementById('collective-hint');
    if (hint) {
      hint.addEventListener('click', () => this.open());
    }

    const closeBtn = this.container.querySelector('.collective-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    let startY = 0;
    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const dy = startY - e.changedTouches[0].clientY;
      if (dy > 80 && !this.isOpen) this.open();
      if (dy < -80 && this.isOpen) this.close();
    }, { passive: true });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.container.classList.remove('hidden');
    requestAnimationFrame(() => this.container.classList.add('open'));
    this.generateStats();
    document.body.classList.add('collective-active');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.classList.remove('open');
    document.body.classList.remove('collective-active');
    setTimeout(() => this.container.classList.add('hidden'), 600);
  }

  generateStats() {
    const countEl = this.container.querySelector('.collective-count');
    const subtitleEl = this.container.querySelector('.collective-subtitle');
    if (!countEl) return;

    const marks = this.getLocalMarkCount();
    this.animateCount(countEl, marks);

    if (subtitleEl) {
      if (marks === 0) {
        subtitleEl.textContent = '标记今天的颜色，成为潮汐的一部分';
      } else if (marks < 5) {
        subtitleEl.textContent = '在这片潮汐中留下了颜色';
      } else {
        subtitleEl.textContent = '天的情绪，汇成了这片潮汐';
      }
    }
  }

  getLocalMarkCount() {
    try {
      const marks = JSON.parse(localStorage.getItem('menstrual-tides-marks')) || [];
      return marks.length;
    } catch {
      return 0;
    }
  }

  animateCount(el, target) {
    if (target === 0) {
      el.textContent = '0';
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(target * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
