export const PHASES = {
  IDLE:     { start: 0.00, end: 0.15 },
  COMPACT:  { start: 0.15, end: 0.40 },
  ENTER:    { start: 0.40, end: 0.55 },
  DESCEND:  { start: 0.55, end: 1.00 },
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
      // Smooth out scroll input
      displayProgress += (targetProgress - displayProgress) * 0.08;
      return displayProgress;
    },
    get progress() {
      return displayProgress;
    },
  };
}
