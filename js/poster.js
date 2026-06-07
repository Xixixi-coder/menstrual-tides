import { getCycleDay, getPhaseByDay, getCycleColorForDay, getAllPhases, getCycleLength, getPhase } from './cycle.js';

export class PosterGenerator {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1080;
    this.canvas.height = 1920;
    this.ctx = this.canvas.getContext('2d');
  }

  generate(marks) {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0A1628';
    ctx.fillRect(0, 0, w, h);

    this.drawTitle(ctx, w);
    this.drawSpectrum(ctx, w, h, marks);
    this.drawPhaseLabels(ctx, w);
    this.drawPersonalPoem(ctx, w, h);
    this.drawFooter(ctx, w, h, marks);

    return canvas.toDataURL('image/png');
  }

  drawTitle(ctx, w) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F5F5F0';
    ctx.font = '300 42px PingFang SC, sans-serif';
    ctx.fillText('我的 28 天，是 5 首诗', w / 2, 180);

    ctx.font = '300 24px PingFang SC, sans-serif';
    ctx.fillStyle = 'rgba(192, 197, 206, 0.5)';
    ctx.fillText('月经潮汐 · 周期色谱', w / 2, 230);
  }

  drawSpectrum(ctx, w, h, marks) {
    const startY = 320;
    const barHeight = h - 700;
    const barWidth = 28;
    const totalWidth = 28 * barWidth + 27 * 6;
    const startX = (w - totalWidth) / 2;
    const cycleLength = getCycleLength();

    for (let day = 1; day <= 28; day++) {
      const color = getCycleColorForDay(day, 28);
      const x = startX + (day - 1) * (barWidth + 6);
      const dayH = barHeight * (0.5 + Math.sin((day / 28) * Math.PI) * 0.4);
      const y = startY + (barHeight - dayH) / 2;

      const grad = ctx.createLinearGradient(x, y, x, y + dayH);
      grad.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`);
      grad.addColorStop(0.5, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`);
      grad.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, dayH, 14);
      ctx.fill();

      const mark = marks.find(m => m.cycleDay === day);
      if (mark) {
        ctx.beginPath();
        ctx.arc(x + barWidth / 2, y + dayH + 16, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.7)`;
        ctx.fill();
      }
    }
  }

  drawPhaseLabels(ctx, w) {
    const phases = getAllPhases();
    const y = 1380;
    ctx.textAlign = 'center';

    const totalW = w - 160;
    phases.forEach((phase, i) => {
      const x = 80 + (i + 0.5) * (totalW / phases.length);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = phase.color;
      ctx.fill();

      ctx.font = '300 20px PingFang SC, sans-serif';
      ctx.fillStyle = 'rgba(245, 245, 240, 0.7)';
      ctx.fillText(phase.alias, x, y + 30);

      ctx.font = '300 16px PingFang SC, sans-serif';
      ctx.fillStyle = 'rgba(192, 197, 206, 0.4)';
      ctx.fillText(phase.name, x, y + 54);
    });
  }

  drawPersonalPoem(ctx, w, h) {
    const cycleDay = getCycleDay();
    if (!cycleDay) return;

    const cycleLength = getCycleLength();
    const phase = getPhase(cycleDay, cycleLength);
    const y = 1500;

    ctx.textAlign = 'center';
    ctx.font = '300 26px PingFang SC, sans-serif';
    ctx.fillStyle = 'rgba(245, 245, 240, 0.8)';
    ctx.fillText('今天，激素在写一首', w / 2, y);

    ctx.font = '400 30px PingFang SC, sans-serif';
    ctx.fillStyle = phase.color;
    ctx.fillText(`「${phase.alias}·${phase.poem}」的诗`, w / 2, y + 44);
  }

  drawFooter(ctx, w, h, marks) {
    ctx.textAlign = 'center';
    ctx.font = 'italic 300 20px PingFang SC, sans-serif';
    ctx.fillStyle = 'rgba(192, 197, 206, 0.4)';
    ctx.fillText(`已记录 ${marks.length} 天`, w / 2, h - 200);

    ctx.font = '300 18px PingFang SC, sans-serif';
    ctx.fillStyle = 'rgba(192, 197, 206, 0.25)';
    ctx.fillText('「原来我不是情绪不稳定，是激素在写诗」', w / 2, h - 150);

    ctx.fillStyle = 'rgba(192, 197, 206, 0.15)';
    ctx.fillText('月经潮汐 menstrual-tides', w / 2, h - 80);
  }

  downloadPoster(marks) {
    const dataUrl = this.generate(marks);
    const link = document.createElement('a');
    link.download = '我的潮汐色谱.png';
    link.href = dataUrl;
    link.click();
  }
}
