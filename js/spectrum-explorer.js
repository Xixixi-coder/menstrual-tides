import { getPhaseByDay, getCycleColorForDay, getAllPhases } from './cycle.js';
import { getBodyPoem, getDayContent } from './body-poems.js';

export class SpectrumExplorer {
  constructor(container, waveEngine) {
    this.container = container;
    this.waveEngine = waveEngine;
    this.currentDay = 1;
    this.isOpen = false;
    this.touchStartX = 0;

    this.bindEvents();
  }

  bindEvents() {
    const openBtn = document.getElementById('spectrum-btn');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.open());
    }
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.currentDay = 1;
    this.container.classList.remove('hidden');
    requestAnimationFrame(() => this.container.classList.add('open'));
    this.render();
    this.setupTouch();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.classList.remove('open');
    setTimeout(() => this.container.classList.add('hidden'), 600);
    this.waveEngine.setCycleDay(null);
  }

  setupTouch() {
    this.container.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      if (Math.abs(dx) > 40) {
        if (dx < 0 && this.currentDay < 28) {
          this.goTo(this.currentDay + 1);
        } else if (dx > 0 && this.currentDay > 1) {
          this.goTo(this.currentDay - 1);
        }
      }
    }, { passive: true });
  }

  goTo(day) {
    this.currentDay = Math.max(1, Math.min(28, day));
    this.render();
    this.waveEngine.setCycleDay(this.currentDay);
  }

  render() {
    const day = this.currentDay;
    const phase = getPhaseByDay(day);
    const content = getDayContent(day);
    const color = getCycleColorForDay(day, 28);
    const rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

    const el = this.container.querySelector('.spectrum-content');
    if (!el) return;

    el.innerHTML = `
      <button class="spectrum-close">&times;</button>
      <p class="spectrum-label">滑动探索 28 天的自己</p>
      <div class="spectrum-track">
        ${this.renderTrack(day)}
      </div>
      <div class="spectrum-day" style="color: ${rgb}">
        <span class="spectrum-day-num">第 ${day} 天</span>
        <span class="spectrum-phase">${phase.alias} · ${phase.name}</span>
      </div>
      <p class="spectrum-poem">${content.poetic}</p>
      <div class="spectrum-tips">
        <p class="spectrum-tip"><span class="spectrum-tip-tag">身体</span>${content.tip}</p>
        <p class="spectrum-tip"><span class="spectrum-tip-tag">心情</span>${content.mood}</p>
      </div>
      <div class="spectrum-nav">
        <button class="spectrum-prev" ${day <= 1 ? 'disabled' : ''}>←</button>
        <span class="spectrum-progress">${day} / 28</span>
        <button class="spectrum-next" ${day >= 28 ? 'disabled' : ''}>→</button>
      </div>
      <button class="spectrum-done">生成我的色谱海报</button>
    `;

    const closeBtn = el.querySelector('.spectrum-close');
    closeBtn.addEventListener('click', () => this.close());

    const prevBtn = el.querySelector('.spectrum-prev');
    const nextBtn = el.querySelector('.spectrum-next');
    prevBtn.addEventListener('click', () => this.goTo(day - 1));
    nextBtn.addEventListener('click', () => this.goTo(day + 1));

    const doneBtn = el.querySelector('.spectrum-done');
    doneBtn.addEventListener('click', () => {
      this.close();
      const posterBtn = document.getElementById('poster-btn');
      if (posterBtn) posterBtn.click();
    });

    const trackNodes = el.querySelectorAll('.spectrum-node');
    trackNodes.forEach(node => {
      node.addEventListener('click', () => {
        const d = parseInt(node.dataset.day, 10);
        if (d) this.goTo(d);
      });
    });
  }

  renderTrack(currentDay) {
    let html = '';
    for (let d = 1; d <= 28; d++) {
      const color = getCycleColorForDay(d, 28);
      const isCurrent = d === currentDay;
      const size = isCurrent ? 12 : 6;
      const opacity = isCurrent ? 1 : 0.5;
      html += `<span class="spectrum-node" data-day="${d}" style="
        width:${size}px;height:${size}px;
        background:rgb(${color[0]},${color[1]},${color[2]});
        opacity:${opacity};
        border-radius:50%;
        display:inline-block;
        margin:0 2px;
        cursor:pointer;
        transition:all 300ms;
        ${isCurrent ? `box-shadow:0 0 8px rgb(${color[0]},${color[1]},${color[2]})` : ''}
      "></span>`;
    }
    return html;
  }
}
