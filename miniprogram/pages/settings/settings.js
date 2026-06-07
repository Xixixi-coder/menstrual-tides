const app = getApp();

Page({
  data: {
    cycleLength: 28,
    lastPeriodStart: '',
    markCount: 0,
  },

  onShow() {
    try {
      const data = wx.getStorageSync('menstrual-tides-cycle') || {};
      const marks = wx.getStorageSync('menstrual-tides-marks') || [];
      this.setData({
        cycleLength: data.cycleLength || 28,
        lastPeriodStart: data.lastPeriodStart ? data.lastPeriodStart.split('T')[0] : '未设置',
        markCount: marks.length,
      });
    } catch (e) {}
  },

  onLengthChange(e) {
    const len = parseInt(e.detail.value, 10);
    try {
      const data = wx.getStorageSync('menstrual-tides-cycle') || {};
      data.cycleLength = len;
      wx.setStorageSync('menstrual-tides-cycle', data);
      this.setData({ cycleLength: len });
      app.loadCycleData();
      wx.showToast({ title: `周期已调整为 ${len} 天`, icon: 'none' });
    } catch (e) {}
  },

  onResetDate() {
    wx.showActionSheet({
      itemList: ['重新设置经期日期', '清除所有数据'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: '/pages/index/index?showSetup=true' });
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '确认清除？',
            content: '这将删除所有标记和周期数据',
            success: (r) => {
              if (r.confirm) {
                wx.removeStorageSync('menstrual-tides-cycle');
                wx.removeStorageSync('menstrual-tides-marks');
                wx.removeStorageSync('menstrual-tides-milestones');
                this.onShow();
                wx.showToast({ title: '已清除', icon: 'none' });
              }
            },
          });
        }
      },
    });
  },
});
