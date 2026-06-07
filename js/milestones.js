import { getCycleDay, getCycleLength, getPhaseByDay, loadCycleData } from './cycle.js';

const MILESTONE_KEY = 'menstrual-tides-milestones';

const MILESTONES = [
  { day: 7, message: '你完成了第一阶段的记录', sub: '身体的第一首诗，已经在写了' },
  { day: 14, message: '半个周期过去了', sub: '你的潮汐色谱，已经有了上半月的轮廓' },
  { day: 21, message: '还有 7 天', sub: '你的第一首完整的诗就写完了' },
  { day: 28, message: '一个完整的周期', sub: '28 天的色谱已经完成，你可以生成海报了' },
];

export class MilestoneSystem {
  constructor() {
    this.shown = this.loadShown();
  }

  loadShown() {
    try {
      return JSON.parse(localStorage.getItem(MILESTONE_KEY)) || [];
    } catch {
      return [];
    }
  }

  saveShown(id) {
    this.shown.push(id);
    localStorage.setItem(MILESTONE_KEY, JSON.stringify(this.shown));
  }

  check() {
    const cycleDay = getCycleDay();
    if (!cycleDay) return;

    const cycleLength = getCycleLength();
    const scaledDay = Math.round((cycleDay / cycleLength) * 28);

    for (const milestone of MILESTONES) {
      if (scaledDay >= milestone.day && !this.shown.includes(milestone.day)) {
        this.show(milestone);
        this.saveShown(milestone.day);
        break;
      }
    }
  }

  show(milestone) {
    const existing = document.querySelector('.milestone-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.className = 'milestone-popup overlay';
    popup.innerHTML = `
      <div class="milestone-card">
        <div class="milestone-icon">✦</div>
        <p class="milestone-msg">${milestone.message}</p>
        <p class="milestone-sub">${milestone.sub}</p>
        <button class="milestone-dismiss">继续</button>
      </div>
    `;

    document.body.appendChild(popup);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => popup.classList.add('open'));
    });

    const dismiss = () => {
      popup.classList.add('closing');
      setTimeout(() => popup.remove(), 400);
    };

    popup.querySelector('.milestone-dismiss').addEventListener('click', dismiss);
    popup.addEventListener('click', (e) => {
      if (e.target === popup) dismiss();
    });
  }
}
