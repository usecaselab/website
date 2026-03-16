export const PHASES = {
  INTRO:    { start: 0.00, end: 0.04 },
  IDLE:     { start: 0.04, end: 0.07 },
  COMPACT:  { start: 0.07, end: 0.16 },
  HOLD:     { start: 0.16, end: 0.18 },
  ENTER:    { start: 0.18, end: 0.24 },
  DESCEND:  { start: 0.24, end: 0.30 },
  THROUGH:  { start: 0.30, end: 0.35 },
  FLOOR1:   { start: 0.35, end: 0.55 },
  FLOOR2:   { start: 0.55, end: 0.75 },
  FLOOR3:   { start: 0.75, end: 0.90 },
  LANDING:  { start: 0.90, end: 0.97 },
};

export function phaseProgress(progress, phase) {
  const { start, end } = phase;
  return Math.max(0, Math.min(1, (progress - start) / (end - start)));
}

export function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function createScrollManager() {
  let targetProgress = 0;
  let displayProgress = 0;

  function onScroll() {
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    targetProgress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return {
    update() {
      displayProgress += (targetProgress - displayProgress) * 0.08;
      return displayProgress;
    },
    get progress() {
      return displayProgress;
    },
  };
}
