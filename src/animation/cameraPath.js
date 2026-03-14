import * as THREE from 'three';
import { PHASES, phaseProgress, smoothstep, lerp } from './scrollManager.js';

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

// Camera keyframes
const IDLE_POS = new THREE.Vector3(14, 3, 14);
const IDLE_LOOK = new THREE.Vector3(0, 0, 0);

const TOP_POS = new THREE.Vector3(0, 22, 0.01);
const TOP_LOOK = new THREE.Vector3(0, 0, 0);

const ENTER_POS = new THREE.Vector3(0, 6, 0.01);
const ENTER_LOOK = new THREE.Vector3(0, -10, 0);

const BOTTOM_Y = -32;

export function updateCamera(progress, camera) {
  const pCompact = smoothstep(phaseProgress(progress, PHASES.COMPACT));
  const pEnter = smoothstep(phaseProgress(progress, PHASES.ENTER));
  const pDescend = smoothstep(phaseProgress(progress, PHASES.DESCEND));

  if (progress <= PHASES.COMPACT.start) {
    // Idle: gentle floating side view
    const t = Date.now() * 0.0004;
    const floatY = Math.sin(t) * 0.4;
    const floatX = Math.cos(t * 0.7) * 0.3;
    _pos.set(IDLE_POS.x + floatX, IDLE_POS.y + floatY, IDLE_POS.z);
    _look.copy(IDLE_LOOK);
  } else if (progress <= PHASES.COMPACT.end) {
    // Compact: sweep from side to top-down
    _pos.lerpVectors(IDLE_POS, TOP_POS, pCompact);
    _look.lerpVectors(IDLE_LOOK, TOP_LOOK, pCompact);
  } else if (progress <= PHASES.ENTER.end) {
    // Enter: descend through the rings into the cylinder
    _pos.lerpVectors(TOP_POS, ENTER_POS, pEnter);
    _look.lerpVectors(TOP_LOOK, ENTER_LOOK, pEnter);
  } else {
    // Descend: elevator ride through floors
    const y = lerp(ENTER_POS.y, BOTTOM_Y, pDescend);
    // Gentle circular drift as we descend
    const t = pDescend * Math.PI * 2;
    const driftX = Math.sin(t) * 0.8;
    const driftZ = Math.cos(t) * 0.8;
    _pos.set(driftX, y, driftZ);
    _look.set(driftX + 2, y - 3, driftZ);
  }

  camera.position.copy(_pos);
  camera.lookAt(_look);
}
