import { PHASES, phaseProgress, smoothstep, lerp } from './scrollManager.js';

const INITIAL_SPACING = 1.2;
const COMPACT_SPACING = 0;

export function updateRings(progress, rings) {
  // Ease-in-out quint: matches camera, slow at both ends
  const rawCompact = phaseProgress(progress, PHASES.COMPACT);
  const pCompact = rawCompact < 0.5
    ? 16 * Math.pow(rawCompact, 5)
    : 1 - Math.pow(-2 * rawCompact + 2, 5) / 2;
  const pEnter = smoothstep(phaseProgress(progress, PHASES.ENTER));

  const spacing = lerp(INITIAL_SPACING, COMPACT_SPACING, pCompact);

  rings[0].position.y = spacing;
  rings[1].position.y = 0;
  rings[2].position.y = -spacing;

  // Gentle slow rotation
  const time = Date.now() * 0.00015;
  rings.forEach((ring, i) => {
    ring.rotation.y = time + i * 0.3;
  });

  // Fade out as we enter
  const opacity = lerp(1, 0, pEnter);
  rings.forEach(ring => {
    ring.visible = opacity > 0.01;
    ring.traverse(child => {
      if (child.isMesh && child.material) {
        child.material.transparent = opacity < 1;
        child.material.opacity = child.material.userData?.baseOpacity != null
          ? child.material.userData.baseOpacity * opacity
          : opacity;
      }
    });
  });

  // Store base opacities on first run
  if (!rings[0].userData.initialized) {
    rings.forEach(ring => {
      ring.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.userData = child.material.userData || {};
          child.material.userData.baseOpacity = child.material.opacity;
        }
      });
      ring.userData.initialized = true;
    });
  }
}
