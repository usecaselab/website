import * as THREE from 'three';
import { PHASES, phaseProgress, smoothstep, lerp } from './scrollManager.js';

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

const IDLE_POS = new THREE.Vector3(14, 3, 14);
const IDLE_LOOK = new THREE.Vector3(0, 0, 0);

const TOP_POS = new THREE.Vector3(0, 22, 0.01);
const TOP_LOOK = new THREE.Vector3(0, 0, 0);

const ENTER_POS = new THREE.Vector3(0, 6, 0.01);
const ENTER_LOOK = new THREE.Vector3(0, 0, 0);

const GROUND_Y = -7;
const BELOW_Y = -30;

export function updateCamera(progress, camera) {
  const rawCompact = phaseProgress(progress, PHASES.COMPACT);
  const pCompact = rawCompact < 0.5
    ? 16 * Math.pow(rawCompact, 5)
    : 1 - Math.pow(-2 * rawCompact + 2, 5) / 2;
  const pEnter = smoothstep(phaseProgress(progress, PHASES.ENTER));
  const pDescend = smoothstep(phaseProgress(progress, PHASES.DESCEND));
  const pThrough = phaseProgress(progress, PHASES.THROUGH); // linear — slow and steady

  if (progress <= PHASES.IDLE.end) {
    // Intro + Idle: floating side view
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
    const y = lerp(GROUND_Y, BELOW_Y, pThrough);
    _pos.set(0, y, 0.01);
    _look.set(0, y - 10, 0);
  } else {
    _pos.set(0, BELOW_Y, 0.01);
    _look.set(0, BELOW_Y - 10, 0);
  }

  camera.position.copy(_pos);
  camera.lookAt(_look);

  updateOverlays(progress);
}

function updateOverlays(progress) {
  // --- INTRO OVERLAY: visible at start, fades out during INTRO phase ---
  const intro = document.getElementById('intro-overlay');
  if (intro) {
    const pIntro = phaseProgress(progress, PHASES.INTRO);
    const introOpacity = 1 - smoothstep(pIntro);
    intro.style.opacity = introOpacity;
    intro.style.display = introOpacity < 0.01 ? 'none' : 'flex';
  }

  // --- LANDING OVERLAY: fades in during THROUGH, fully visible at LANDING ---
  const overlay = document.getElementById('landing-overlay');
  if (!overlay) return;

  const pThrough = phaseProgress(progress, PHASES.THROUGH);
  const pLanding = phaseProgress(progress, PHASES.LANDING);

  // Only start showing overlay in the last 20% of THROUGH
  const overlayStart = Math.max(0, (pThrough - 0.8) / 0.2);

  if (overlayStart > 0) {
    overlay.style.display = 'flex';
    const opacity = smoothstep(overlayStart);
    overlay.style.opacity = opacity;

    const title = overlay.querySelector('.landing-title');
    const subtitle = overlay.querySelector('.landing-subtitle');
    const btn = overlay.querySelector('.landing-btn');

    if (title) {
      const scale = lerp(1.2, 1, smoothstep(pLanding));
      const translateY = lerp(20, 0, smoothstep(pLanding));
      title.style.transform = `scale(${scale}) translateY(${translateY}px)`;
      title.style.opacity = smoothstep(overlayStart);
    }
    if (subtitle) {
      const delay = Math.max(0, pLanding - 0.2) / 0.8;
      subtitle.style.opacity = smoothstep(delay);
      subtitle.style.transform = `translateY(${lerp(15, 0, smoothstep(delay))}px)`;
    }
    if (btn) {
      const delay = Math.max(0, pLanding - 0.4) / 0.6;
      btn.style.opacity = smoothstep(delay);
      btn.style.transform = `translateY(${lerp(15, 0, smoothstep(delay))}px)`;
    }
  } else {
    overlay.style.display = 'none';
    overlay.style.opacity = 0;
  }
}
