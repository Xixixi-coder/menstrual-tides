const app = getApp();
const { getPhaseByDay } = require('../../utils/cycle');

const EMOTIONS = ['平静', '疲惫', '疼痛', '自由', '敏感', '有力', '焦虑', '柔软'];

Page({
  data: {
    emotions: EMOTIONS,
    selectedEmotion: '',
    text: '',
    poemHint: '',
    inPeriod: false,
  },

  onShow() {
    const cycleDay = app.globalData.cycleDay;
    if (cycleDay) {
      const scaledDay = Math.max(1, Math.min(28, Math.round((cycleDay / app.globalData.cycleLength) * 28)));
      const phase = getPhaseByDay(scaledDay);
      this.setData({ poemHint: `今天，激素在写一首${phase.poem}诗` });
    }

    try {
      const data = wx.getStorageSync('menstrual-tides-cycle') || {};
      this.setData({ inPeriod: !!data.periodActive });
    } catch (e) {}
  },

  selectEmotion(e) {
    this.setData({ selectedEmotion: e.currentTarget.dataset.emotion });
  },

  onTextInput(e) {
    this.setData({ text: e.detail.value });
  },

  submit() {
    if (!this.data.selectedEmotion) return;

    const entry = {
      id: Date.now(),
      emotion: this.data.selectedEmotion,
      text: this.data.text.trim(),
      date: new Date().toISOString(),
      cycleDay: app.globalData.cycleDay,
    };

    try {
      const marks = wx.getStorageSync('menstrual-tides-marks') || [];
      marks.push(entry);
      wx.setStorageSync('menstrual-tides-marks', marks);
    } catch (e) {}

    wx.showToast({ title: '已汇入潮汐', icon: 'none', duration: 2000 });
    this.setData({ selectedEmotion: '', text: '' });

    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1500);
  },

  markPeriodStart() {
    try {
      const data = wx.getStorageSync('menstrual-tides-cycle') || {};
      data.periodActive = true;
      data.periodStartDate = new Date().toISOString();
      wx.setStorageSync('menstrual-tides-cycle', data);
      app.saveCycleStart(new Date());
      this.setData({ inPeriod: true });
      wx.showToast({ title: '已记录经期开始', icon: 'none' });
    } catch (e) {}
  },

  markPeriodEnd() {
    try {
      const data = wx.getStorageSync('menstrual-tides-cycle') || {};
      data.periodActive = false;
      data.periodEndDate = new Date().toISOString();
      wx.setStorageSync('menstrual-tides-cycle', data);
      this.setData({ inPeriod: false });
      wx.showToast({ title: '已记录经期结束', icon: 'none' });
    } catch (e) {}
  },
});
