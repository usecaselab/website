import * as THREE from 'three';
import { PHASES, phaseProgress, smoothstep, lerp } from './scrollManager.js';
import { FLOOR_START_Y, FLOOR_SPACING } from '../scene/floors.js';

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

const IDLE_POS = new THREE.Vector3(14, 3, 14);
const IDLE_LOOK = new THREE.Vector3(0, 0, 0);

const TOP_POS = new THREE.Vector3(0, 22, 0.01);
const TOP_LOOK = new THREE.Vector3(0, 0, 0);

const ENTER_POS = new THREE.Vector3(0, 6, 0.01);

const GROUND_Y = -7;

// Camera views each platform from above at an angle
const CAM_ABOVE = 5;
const CAM_Z = 7;

export function updateCamera(progress, camera, floors) {
  const rawCompact = phaseProgress(progress, PHASES.COMPACT);
  const pCompact = rawCompact < 0.5
    ? 16 * Math.pow(rawCompact, 5)
    : 1 - Math.pow(-2 * rawCompact + 2, 5) / 2;
  const pEnter = smoothstep(phaseProgress(progress, PHASES.ENTER));
  const pDescend = smoothstep(phaseProgress(progress, PHASES.DESCEND));
  const pThrough = smoothstep(phaseProgress(progress, PHASES.THROUGH));

  if (progress <= PHASES.IDLE.end) {
    const t = Date.now() * 0.0004;
    const floatY = Math.sin(t) * 0.4;
    const floatX = Math.cos(t * 0.7) * 0.3;
    _pos.set(IDLE_POS.x + floatX, IDLE_POS.y + floatY, IDLE_POS.z);
    _look.copy(IDLE_LOOK);
  } else if (progress <= PHASES.COMPACT.end) {
    _pos.lerpVectors(IDLE_POS, TOP_POS, pCompact);
    _look.lerpVectors(IDLE_LOOK, TOP_LOOK, pCompact);
  } else if (progress <= PHASES.HOLD.end) {
    _pos.set(TOP_POS.x, TOP_POS.y, TOP_POS.z);
    _look.set(0, 0, 0);
  } else if (progress <= PHASES.ENTER.end) {
    const y = lerp(TOP_POS.y, ENTER_POS.y, pEnter);
    _pos.set(0, y, 0.01);
    _look.set(0, y - 10, 0);
  } else if (progress <= PHASES.DESCEND.end) {
    const y = lerp(ENTER_POS.y, GROUND_Y, pDescend);
    _pos.set(0, y, 0.01);
    _look.set(0, y - 10, 0);
  } else if (progress <= PHASES.THROUGH.end) {
    // Transition from ground down to first platform
    const firstY = FLOOR_START_Y;
    const y = lerp(GROUND_Y, firstY + CAM_ABOVE, pThrough);
    const z = lerp(0.01, CAM_Z, pThrough);
    _pos.set(0, y, z);
    _look.set(0, lerp(GROUND_Y - 10, firstY, pThrough), 0);
  } else if (progress <= PHASES.FLOOR3.end) {
    const floorPhases = [PHASES.FLOOR1, PHASES.FLOOR2, PHASES.FLOOR3];
    let fi = 0;
    if (progress > PHASES.FLOOR3.start) fi = 2;
    else if (progress > PHASES.FLOOR2.start) fi = 1;

    const p = phaseProgress(progress, floorPhases[fi]);

    const curY = FLOOR_START_Y - fi * FLOOR_SPACING;
    const nextY = FLOOR_START_Y - Math.min(fi + 1, 2) * FLOOR_SPACING;

    // Stay at current floor for 80%, transition to next in last 20%
    let y, lookY;
    if (p < 0.8 || fi === 2) {
      y = curY + CAM_ABOVE;
      lookY = curY;
    } else {
      const t = smoothstep((p - 0.8) / 0.2);
      y = lerp(curY + CAM_ABOVE, nextY + CAM_ABOVE, t);
      lookY = lerp(curY, nextY, t);
    }

    const t = Date.now() * 0.0003;
    const sway = Math.sin(t) * 0.4;

    _pos.set(sway, y, CAM_Z);
    _look.set(0, lookY, 0);
  } else {
    // Landing
    const lastY = FLOOR_START_Y - 2 * FLOOR_SPACING;
    const t = Date.now() * 0.0003;
    _pos.set(Math.sin(t) * 0.3, lastY + CAM_ABOVE, CAM_Z);
    _look.set(0, lastY, 0);
  }

  camera.position.copy(_pos);
  camera.lookAt(_look);

  if (floors) {
    updateFloorVisibility(progress, floors);
  }

  updateOverlays(progress);
}

function updateFloorVisibility(progress, floors) {
  const floorPhases = [PHASES.FLOOR1, PHASES.FLOOR2, PHASES.FLOOR3];
  const t = Date.now() * 0.002;

  floors.forEach((floor, i) => {
    const prevEnd = i > 0 ? floorPhases[i - 1].end : PHASES.THROUGH.start;
    const visible = progress > prevEnd - 0.02 && progress < PHASES.LANDING.end;
    floor.group.visible = visible;

    if (!visible) return;

    const p = phaseProgress(progress, floorPhases[i]);
    const active = p > 0 && p < 1;

    // Per-floor glow intensity — small disc needs more, medium less
    const glowMultiplier = 0.6;
    const glowStrength = active ? (0.5 + Math.sin(t + i) * 0.3) * glowMultiplier : 0;

    floor.group.traverse(child => {
      if (!child.material) return;
      if (!child.userData._baseOpacity) {
        child.userData._baseOpacity = child.material.opacity;
        child.userData._baseColor = child.material.color.getHex();
      }
      if (active) {
        child.material.opacity = Math.min(1, child.userData._baseOpacity + glowStrength * 0.5);
        const base = new THREE.Color(child.userData._baseColor);
        const glow = new THREE.Color(0x66eeff);
        base.lerp(glow, glowStrength * 0.5);
        child.material.color.copy(base);
      } else {
        child.material.opacity = child.userData._baseOpacity;
        child.material.color.setHex(child.userData._baseColor);
      }
    });
  });
}

function updateOverlays(progress) {
  // --- INTRO ---
  const intro = document.getElementById('intro-overlay');
  if (intro) {
    const pIntro = phaseProgress(progress, PHASES.INTRO);
    const introOpacity = 1 - smoothstep(pIntro);
    intro.style.opacity = introOpacity;
    intro.style.display = introOpacity < 0.01 ? 'none' : 'flex';
    // Reveal intro chars on load
    if (introOpacity > 0.5) {
      intro.querySelectorAll('.char-reveal').forEach(ch => ch.classList.add('visible'));
    }
  }

  // --- FLOOR INFO OVERLAYS ---
  const floorPhases = [PHASES.FLOOR1, PHASES.FLOOR2, PHASES.FLOOR3];
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById(`floor-info-${i}`);
    if (!el) continue;

    const p = phaseProgress(progress, floorPhases[i]);

    if (p > 0 && p < 1) {
      el.style.display = 'flex';
      let opacity;
      if (p < 0.3) opacity = smoothstep(p / 0.3);
      else if (p > 0.8) opacity = smoothstep((1 - p) / 0.2);
      else opacity = 1;
      el.style.opacity = opacity;

      const title = el.querySelector('.floor-title');
      const desc = el.querySelector('.floor-desc');
      if (title) {
        title.style.opacity = 1;
        // Trigger character reveal
        const chars = title.querySelectorAll('.char-reveal');
        chars.forEach(ch => {
          if (p > 0.05) ch.classList.add('visible');
          else ch.classList.remove('visible');
          // Remove glow after sweep
          if (p > 0.3) ch.classList.remove('glow');
          else if (p > 0.05) ch.classList.add('glow');
        });
        // Fade out the whole title near end
        if (p > 0.8) title.style.opacity = smoothstep((1 - p) / 0.2);
      }
      if (desc) {
        const fadeIn = smoothstep(Math.min(Math.max(0, (p - 0.15)) / 0.2, 1));
        desc.style.opacity = Math.min(opacity, fadeIn);
        desc.style.transform = `translateY(${lerp(10, 0, fadeIn)}px)`;
      }
    } else {
      el.style.display = 'none';
      el.style.opacity = 0;
    }
  }

  // --- LANDING ---
  const overlay = document.getElementById('landing-overlay');
  if (!overlay) return;

  const pLanding = phaseProgress(progress, PHASES.LANDING);

  if (pLanding > 0) {
    overlay.style.display = 'flex';
    overlay.style.opacity = smoothstep(pLanding);

    const title = overlay.querySelector('.landing-title');
    const subtitle = overlay.querySelector('.landing-subtitle');
    const btn = overlay.querySelector('.landing-btn');

    if (title) {
      title.style.opacity = 1;
      title.style.transform = `scale(${lerp(1.1, 1, smoothstep(pLanding))})`;
      title.querySelectorAll('.char-reveal').forEach(ch => {
        if (pLanding > 0.1) ch.classList.add('visible');
        else ch.classList.remove('visible');
      });
    }
    if (subtitle) {
      const d = Math.max(0, pLanding - 0.3) / 0.7;
      subtitle.style.opacity = smoothstep(d);
      subtitle.style.transform = `translateY(${lerp(10, 0, smoothstep(d))}px)`;
    }
    if (btn) {
      const d = Math.max(0, pLanding - 0.5) / 0.5;
      btn.style.opacity = smoothstep(d);
      btn.style.transform = `translateY(${lerp(10, 0, smoothstep(d))}px)`;
    }
  } else {
    overlay.style.display = 'none';
    overlay.style.opacity = 0;
  }
}
