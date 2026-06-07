App({
  globalData: {
    cycleDay: null,
    cycleLength: 28,
    moonPhase: null,
    theme: {
      bgDeep: '#0A1628',
      bgHorizon: '#0F2035',
      tideBlue: '#1E3A5F',
      moonlight: '#C0C5CE',
      coral: '#E8A598',
      fogPurple: '#7B6D8D',
      pearl: '#F5F5F0',
    },
  },

  onLaunch() {
    this.loadCycleData();
    this.calcMoonPhase();
  },

  loadCycleData() {
    try {
      const data = wx.getStorageSync('menstrual-tides-cycle') || {};
      if (data.lastPeriodStart) {
        const start = new Date(data.lastPeriodStart);
        const now = new Date();
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
        const len = data.cycleLength || 28;
        let day = diff % len;
        if (day <= 0) day += len;
        this.globalData.cycleDay = day;
        this.globalData.cycleLength = len;
      }
    } catch (e) {
      console.error('loadCycleData error', e);
    }
  },

  calcMoonPhase() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y +
             Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

    const synodicMonth = 29.53058868;
    const knownNewMoon = 2451550.1;
    const daysSinceNew = jd - knownNewMoon;
    const phase = ((daysSinceNew % synodicMonth) + synodicMonth) % synodicMonth / synodicMonth;

    this.globalData.moonPhase = phase;
  },

  saveCycleStart(date) {
    try {
      const data = wx.getStorageSync('menstrual-tides-cycle') || {};
      if (data.lastPeriodStart) {
        const prev = new Date(data.lastPeriodStart);
        const interval = Math.round((date - prev) / (1000 * 60 * 60 * 24));
        if (interval > 0 && interval <= 50) {
          if (!data.cycleHistory) data.cycleHistory = [];
          data.cycleHistory.push(interval);
          if (data.cycleHistory.length > 6) data.cycleHistory = data.cycleHistory.slice(-6);
        }
      }
      data.lastPeriodStart = date.toISOString();
      data.cycleLength = data.cycleLength || 28;
      wx.setStorageSync('menstrual-tides-cycle', data);
      this.loadCycleData();
    } catch (e) {
      console.error('saveCycleStart error', e);
    }
  },
});
