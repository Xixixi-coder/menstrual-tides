const PHASES = [
  {
    name: '蛰伏期',
    alias: '玫红·蛰伏',
    range: [1, 5],
    color: '#FF007F',
    colorRGB: [255, 0, 127],
    waveColor: [74, 14, 30],
    glowColor: [255, 0, 127],
    description: '子宫内膜正在脱落，身体在做一次安静的清理。',
    poem: '内省的',
    keywords: ['内省', '敏感', '需要休息'],
    musicHint: 'ambient / cello',
  },
  {
    name: '萌发期',
    alias: '荧绿·萌发',
    range: [6, 12],
    color: '#39FF14',
    colorRGB: [57, 255, 20],
    waveColor: [26, 58, 26],
    glowColor: [57, 255, 20],
    description: '雌激素缓缓上升，像春天的第一株嫩芽破土。',
    poem: '清新的',
    keywords: ['清新', '好奇', '能量恢复'],
    musicHint: 'piano / folk',
  },
  {
    name: '创造力',
    alias: '荧金·创造',
    range: [13, 15],
    color: '#FFD700',
    colorRGB: [255, 215, 0],
    waveColor: [74, 58, 0],
    glowColor: [255, 215, 0],
    description: '卵子正在释放，激素达到峰值。这是你最有创造力的时刻。',
    poem: '明亮的',
    keywords: ['自信', '魅力', '创造力'],
    musicHint: 'strings / world',
  },
  {
    name: '内省期',
    alias: '紫蓝·内省',
    range: [16, 22],
    color: '#7B68EE',
    colorRGB: [123, 104, 238],
    waveColor: [26, 26, 58],
    glowColor: [123, 104, 238],
    description: '孕激素在守护你，身体进入深层思考模式。直觉最敏锐的时候。',
    poem: '深邃的',
    keywords: ['深度思考', '直觉', '沉静'],
    musicHint: 'electronic / post-rock',
  },
  {
    name: '涌动期',
    alias: '雾蓝·涌动',
    range: [23, 28],
    color: '#00BFFF',
    colorRGB: [0, 191, 255],
    waveColor: [26, 42, 58],
    glowColor: [0, 191, 255],
    description: '激素在撤退，像退潮前的暗涌。情绪的波动不是失控，是身体在说话。',
    poem: '温柔的',
    keywords: ['情绪波动', '渴望连接', '敏锐'],
    musicHint: 'soul / R&B',
  },
];

const STORAGE_KEY = 'menstrual-tides-cycle';

export function getPhase(cycleDay, cycleLength = 28) {
  const scaled = Math.round((cycleDay / cycleLength) * 28);
  const day = Math.max(1, Math.min(28, scaled));

  for (const phase of PHASES) {
    if (day >= phase.range[0] && day <= phase.range[1]) {
      return { ...phase, day };
    }
  }
  return { ...PHASES[0], day };
}

export function getCycleLength() {
  const data = loadCycleData();
  return data.cycleLength || 28;
}

export function getPhaseByDay(day) {
  for (const phase of PHASES) {
    if (day >= phase.range[0] && day <= phase.range[1]) {
      return phase;
    }
  }
  return PHASES[0];
}

export function getAllPhases() {
  return PHASES;
}

export function lerpColor(rgb1, rgb2, t) {
  return [
    Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t),
    Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t),
    Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t),
  ];
}

export function getCycleColorForDay(day, cycleLength) {
  const len = cycleLength || getCycleLength();
  const scaled = Math.max(1, Math.min(28, Math.round((day / len) * 28)));
  const phase = getPhaseByDay(scaled);
  const nextPhaseIdx = PHASES.indexOf(phase) + 1;
  const nextPhase = PHASES[nextPhaseIdx % PHASES.length];

  const progress = (scaled - phase.range[0]) / (phase.range[1] - phase.range[0]);
  if (progress > 0.7 && nextPhaseIdx < PHASES.length) {
    const blend = (progress - 0.7) / 0.3;
    return lerpColor(phase.colorRGB, nextPhase.colorRGB, blend * 0.3);
  }
  return phase.colorRGB;
}

export function saveCycleStart(date) {
  const data = loadCycleData();
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveCycleLength(len) {
  const clamped = Math.max(21, Math.min(35, Math.round(len)));
  const data = loadCycleData();
  data.cycleLength = clamped;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCalibrationSuggestion() {
  const data = loadCycleData();
  if (!data.cycleHistory || data.cycleHistory.length < 2) return null;
  const avg = Math.round(data.cycleHistory.reduce((a, b) => a + b, 0) / data.cycleHistory.length);
  if (avg >= 21 && avg <= 35 && avg !== data.cycleLength) {
    return avg;
  }
  return null;
}

export function loadCycleData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function getCycleDay() {
  const data = loadCycleData();
  if (!data.lastPeriodStart) return null;

  const start = new Date(data.lastPeriodStart);
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  const cycleLen = data.cycleLength || 28;

  let day = diff % cycleLen;
  if (day <= 0) day += cycleLen;
  return day;
}

export function isNightTime() {
  const h = new Date().getHours();
  return h >= 22 || h < 6;
}
