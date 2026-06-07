const PHASES = [
  { name: '蛰伏期', alias: '姨妈红', range: [1, 5], color: '#C73E3A', colorRGB: [199, 62, 58], waveColor: [140, 45, 45], poem: '内省的' },
  { name: '萌发期', alias: '芽绿', range: [6, 12], color: '#7FB069', colorRGB: [127, 176, 105], waveColor: [60, 120, 70], poem: '清新的' },
  { name: '创造力', alias: '金色', range: [13, 15], color: '#F4D35E', colorRGB: [244, 211, 94], waveColor: [160, 140, 50], poem: '明亮的' },
  { name: '内省期', alias: '深紫', range: [16, 22], color: '#6B4C7F', colorRGB: [107, 76, 127], waveColor: [70, 50, 100], poem: '深邃的' },
  { name: '涌动期', alias: '雾蓝', range: [23, 28], color: '#8FA3BF', colorRGB: [143, 163, 191], waveColor: [70, 90, 130], poem: '温柔的' },
];

function getPhaseByDay(day) {
  for (const phase of PHASES) {
    if (day >= phase.range[0] && day <= phase.range[1]) return phase;
  }
  return PHASES[0];
}

function getCycleColorForDay(day) {
  const phase = getPhaseByDay(day);
  return phase.waveColor;
}

function getAllPhases() {
  return PHASES;
}

const BODY_POEMS = [
  { day: 1, text: '子宫内膜开始脱落。身体在做一次温柔的清理，像潮水带走沙滩上的旧痕迹。' },
  { day: 2, text: '前列腺素在工作，它让子宫轻轻收缩。如果感到疼痛，那是身体在用力呼吸。' },
  { day: 3, text: '经血里有干细胞——你的身体正在释放再生的种子。' },
  { day: 4, text: '雌激素触底后开始缓缓回升。最深的夜过去了，黎明在酝酿。' },
  { day: 5, text: '内膜脱落接近尾声。子宫像退潮后的海滩，干净，等待。' },
  { day: 6, text: '卵泡开始发育。在你的卵巢里，十几颗卵泡正在同时生长，像一片小小的花园。' },
  { day: 7, text: '雌激素稳步上升。你可能感到思维变得清晰，像雾散去后的早晨。' },
  { day: 8, text: '子宫内膜开始重新生长。一层新的、柔软的组织正在铺开。' },
  { day: 9, text: '多巴胺和血清素水平上升。身体在奖励你——用好心情。' },
  { day: 10, text: '卵泡们在竞争，最终只有一颗会脱颖而出。一场安静的选拔正在进行。' },
  { day: 11, text: '优势卵泡已经确定。它正在积蓄力量，为释放做准备。' },
  { day: 12, text: '雌激素接近峰值。你的皮肤、头发、声音——整个人都在发光。' },
  { day: 13, text: '促黄体激素开始飙升。大幕即将拉开。' },
  { day: 14, text: '排卵。一颗成熟的卵子从卵巢释放，开始它短暂而神圣的旅程。' },
  { day: 15, text: '卵子在输卵管中缓缓移动。激素峰值让你感到自信、有魅力、充满能量。' },
  { day: 16, text: '黄体形成。排卵后的卵泡变成了一个小小的内分泌腺，开始分泌孕激素。' },
  { day: 17, text: '孕激素上升。你的身体进入"筑巢模式"——体温微升，节奏放缓。' },
  { day: 18, text: '大脑对安静和独处的需求增加。这不是孤僻，是深度思考的开始。' },
  { day: 19, text: '直觉在这个阶段最为敏锐。相信你内心的声音。' },
  { day: 20, text: '孕激素达到峰值。你可能感到想要整理、收纳、把事情做完。' },
  { day: 21, text: '子宫内膜达到最厚。一切准备就绪，身体在等待一个信号。' },
  { day: 22, text: '如果没有受精，黄体开始萎缩。一个周期的故事正在走向结尾。' },
  { day: 23, text: '孕激素和雌激素同时下降。情绪的波动不是你的错，是化学反应在说话。' },
  { day: 24, text: '血清素水平降低。你可能渴望碳水化合物和温暖的食物——这是身体在寻找安慰。' },
  { day: 25, text: '前列腺素开始积累。身体在为下一次潮汐做准备。' },
  { day: 26, text: '你可能感到浮肿或胀痛。水在身体里流动，像海面下的暗涌。' },
  { day: 27, text: '激素撤退进入最后阶段。这是转折前的寂静。' },
  { day: 28, text: '明天或后天，新的潮汐将再次来临。一个周期结束，也是另一个的开始。' },
];

function getBodyPoem(cycleDay) {
  const day = Math.max(1, Math.min(28, cycleDay));
  return BODY_POEMS[day - 1];
}

module.exports = {
  PHASES,
  getPhaseByDay,
  getCycleColorForDay,
  getAllPhases,
  getBodyPoem,
};
