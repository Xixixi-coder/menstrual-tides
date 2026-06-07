import { getPhaseByDay, getCycleColorForDay, getAllPhases, getCycleDay, loadCycleData, getCycleLength, getPhase } from './cycle.js';
import { getBodyPoem } from './body-poems.js';

export class CycleLine {
  constructor(container, cycleDay) {
    this.container = container;
    this.cycleDay = cycleDay;
    this.cycleLength = getCycleLength();
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'cycle-line';

    const track = document.createElement('div');
    track.className = 'cycle-track';

    for (let day = 1; day <= this.cycleLength; day++) {
      const node = document.createElement('div');
      node.className = 'cycle-node';
      node.dataset.day = day;

      const color = getCycleColorForDay(day);
      const rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

      if (day <= this.cycleDay) {
        node.style.background = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6)`;
        node.classList.add('filled');
      } else {
        node.style.borderColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`;
      }

      if (day === this.cycleDay) {
        node.classList.add('current');
        node.style.background = rgb;
      }

      node.addEventListener('click', () => this.showDayDetail(day));
      track.appendChild(node);

      if (day < this.cycleLength) {
        const seg = document.createElement('div');
        seg.className = 'cycle-segment';
        if (day < this.cycleDay) {
          seg.style.background = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.35)`;
        }
        track.appendChild(seg);
      }
    }

    wrapper.appendChild(track);

    const phase = getPhase(this.cycleDay, this.cycleLength);
    const info = document.createElement('div');
    info.className = 'cycle-info';
    info.innerHTML = `
      <span class="cycle-day-label">第 ${this.cycleDay} 天 / ${this.cycleLength} 天</span>
      <span class="cycle-phase-dot" style="background: ${phase.color}"></span>
      <span class="cycle-phase-name">${phase.alias}</span>
    `;
    wrapper.appendChild(info);

    this.container.appendChild(wrapper);

    if (this.cycleDay) {
      setTimeout(() => {
        const currentNode = track.querySelector('.cycle-node.current');
        if (currentNode) {
          currentNode.scrollIntoView({ inline: 'center', behavior: 'smooth' });
        }
      }, 300);
    }
  }

  showDayDetail(day) {
    const existing = document.querySelector('.day-detail-popup');
    if (existing) existing.remove();

    const scaledDay = Math.max(1, Math.min(28, Math.round((day / this.cycleLength) * 28)));
    const poem = getBodyPoem(scaledDay);
    const phase = getPhase(day, this.cycleLength);
    const color = getCycleColorForDay(day, this.cycleLength);
    const rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

    const popup = document.createElement('div');
    popup.className = 'day-detail-popup';
    popup.innerHTML = `
      <div class="day-detail-card">
        <div class="day-detail-header">
          <span class="day-detail-number" style="color: ${rgb}">第 ${day} 天</span>
          <span class="day-detail-phase">${phase.alias} · ${phase.name}</span>
        </div>
        <p class="day-detail-poem">${poem.text}</p>
        <button class="day-detail-close">&times;</button>
      </div>
    `;

    popup.addEventListener('click', (e) => {
      if (e.target === popup || e.target.classList.contains('day-detail-close')) {
        popup.classList.add('closing');
        setTimeout(() => popup.remove(), 400);
      }
    });

    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('open'));
  }

  updateDay(day) {
    this.cycleDay = day;
    this.render();
  }
}
