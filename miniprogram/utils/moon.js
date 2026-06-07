const MOON_PHASES = [
  { name: '新月', icon: '🌑', range: [0, 0.0625] },
  { name: '蛾眉月', icon: '🌒', range: [0.0625, 0.1875] },
  { name: '上弦月', icon: '🌓', range: [0.1875, 0.3125] },
  { name: '盈凸月', icon: '🌔', range: [0.3125, 0.4375] },
  { name: '满月', icon: '🌕', range: [0.4375, 0.5625] },
  { name: '亏凸月', icon: '🌖', range: [0.5625, 0.6875] },
  { name: '下弦月', icon: '🌗', range: [0.6875, 0.8125] },
  { name: '残月', icon: '🌘', range: [0.8125, 0.9375] },
  { name: '新月', icon: '🌑', range: [0.9375, 1.0] },
];

function getMoonPhaseName(phase) {
  for (const mp of MOON_PHASES) {
    if (phase >= mp.range[0] && phase < mp.range[1]) {
      return { name: mp.name, icon: mp.icon };
    }
  }
  return { name: '新月', icon: '🌑' };
}

function isFullMoon(phase) {
  return phase >= 0.45 && phase <= 0.55;
}

function getTideLevel(phase) {
  return 0.3 + 0.7 * Math.pow(Math.sin(phase * Math.PI), 2);
}

module.exports = {
  getMoonPhaseName,
  isFullMoon,
  getTideLevel,
};
