const SYNODIC_MONTH = 29.53058770576;

export function getMoonPhase(date) {
  const year = date.getFullYear();
  let m = date.getMonth() + 1;
  let y = year;
  const day = date.getDate();

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = Math.floor(A / 4);
  const C = 2 - A + B;
  const E = Math.floor(365.25 * (y + 4716));
  const F = Math.floor(30.6001 * (m + 1));
  const JD = C + day + E + F - 1524.5;

  const daysSinceNew = JD - 2451550.1;
  let phase = (daysSinceNew % SYNODIC_MONTH) / SYNODIC_MONTH;
  if (phase < 0) phase += 1;

  return phase;
}

export function getMoonPhaseName(phase) {
  if (phase < 0.0625) return { name: '新月', icon: '\u{1F311}' };
  if (phase < 0.1875) return { name: '蛾眉月', icon: '\u{1F312}' };
  if (phase < 0.3125) return { name: '上弦月', icon: '\u{1F313}' };
  if (phase < 0.4375) return { name: '盈凸月', icon: '\u{1F314}' };
  if (phase < 0.5625) return { name: '满月', icon: '\u{1F315}' };
  if (phase < 0.6875) return { name: '亏凸月', icon: '\u{1F316}' };
  if (phase < 0.8125) return { name: '下弦月', icon: '\u{1F317}' };
  if (phase < 0.9375) return { name: '残月', icon: '\u{1F318}' };
  return { name: '新月', icon: '\u{1F311}' };
}

export function isFullMoon(phase) {
  return phase >= 0.45 && phase <= 0.55;
}

export function getTideLevel(phase) {
  return 0.3 + 0.7 * Math.pow(Math.sin(phase * Math.PI), 2);
}
