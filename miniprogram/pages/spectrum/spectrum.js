const { getPhaseByDay, getCycleColorForDay, getBodyPoem, getAllPhases } = require('../../utils/cycle');

Page({
  data: {
    currentDay: 1,
    phaseName: '',
    phaseAlias: '',
    phaseColor: '',
    bodyPoem: '',
    days: [],
  },

  onLoad() {
    this.buildDays();
    this.goTo(1);
  },

  buildDays() {
    const days = [];
    for (let d = 1; d <= 28; d++) {
      const color = getCycleColorForDay(d);
      days.push({
        day: d,
        color: `rgb(${color[0]},${color[1]},${color[2]})`,
      });
    }
    this.setData({ days });
  },

  goTo(day) {
    day = Math.max(1, Math.min(28, day));
    const phase = getPhaseByDay(day);
    const poem = getBodyPoem(day);
    this.setData({
      currentDay: day,
      phaseName: phase.name,
      phaseAlias: phase.alias,
      phaseColor: phase.color,
      bodyPoem: poem.text,
    });
  },

  onPrev() {
    if (this.data.currentDay > 1) this.goTo(this.data.currentDay - 1);
  },

  onNext() {
    if (this.data.currentDay < 28) this.goTo(this.data.currentDay + 1);
  },

  onDayTap(e) {
    const day = parseInt(e.currentTarget.dataset.day, 10);
    if (day) this.goTo(day);
  },

  touchStart(e) {
    this._touchX = e.touches[0].clientX;
  },

  touchEnd(e) {
    const dx = e.changedTouches[0].clientX - this._touchX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) this.onNext();
      else this.onPrev();
    }
  },
});
