import * as THREE from 'three';
import { PHASES, phaseProgress, smoothstep } from '../animation/scrollManager.js';

export function createEnvironment(scene) {
  const group = new THREE.Group();

  // --- GROUND ---
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshPhysicalMaterial({
    color: 0x020202,
    roughness: 0.3,
    metalness: 0.8,
    envMapIntensity: 0.5,
    transparent: true,
    opacity: 1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -7;
  group.add(ground);

  // Grid lines
  const gridLines = [];
  const gridSize = 60;
  const gridStep = 2;
  const gridMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.03,
  });
  for (let i = -gridSize / 2; i <= gridSize / 2; i += gridStep) {
    const xPts = [
      new THREE.Vector3(i, -6.99, -gridSize / 2),
      new THREE.Vector3(i, -6.99, gridSize / 2),
    ];
    const xLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(xPts), gridMat.clone());
    gridLines.push(xLine);
    group.add(xLine);
    const zPts = [
      new THREE.Vector3(-gridSize / 2, -6.99, i),
      new THREE.Vector3(gridSize / 2, -6.99, i),
    ];
    const zLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(zPts), gridMat.clone());
    gridLines.push(zLine);
    group.add(zLine);
  }

  // Light rings on ground
  const groundRings = [];
  [2.0, 3.3, 5.3].forEach((r, i) => {
    const ringGeo = new THREE.RingGeometry(r - 0.05, r + 0.05, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.04 - i * 0.01,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -6.98;
    groundRings.push(ring);
    group.add(ring);
  });

  // Central glow
  const glowGeo = new THREE.CircleGeometry(3, 64);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.02,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -6.97;
  group.add(glow);

  // --- ATMOSPHERIC PARTICLES ---
  const dust1 = createParticleSystem(400, 25, 15, 0.025, 0.12);
  group.add(dust1.points);
  const dust2 = createParticleSystem(200, 50, 30, 0.04, 0.06);
  group.add(dust2.points);
  const dust3 = createParticleSystem(60, 80, 40, 0.08, 0.03);
  group.add(dust3.points);

  // --- VERTICAL LIGHT PILLARS ---
  const pillars = [];
  const pillarMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.008,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dist = 15 + Math.random() * 10;
    const height = 20 + Math.random() * 15;
    const pillarGeo = new THREE.PlaneGeometry(0.03, height);
    const pillar = new THREE.Mesh(pillarGeo, pillarMat.clone());
    pillar.userData.baseOpacity = 0.005 + Math.random() * 0.008;
    pillar.material.opacity = pillar.userData.baseOpacity;
    pillar.position.set(
      Math.cos(angle) * dist,
      height / 2 - 7,
      Math.sin(angle) * dist,
    );
    pillar.lookAt(0, pillar.position.y, 0);
    pillars.push(pillar);
    group.add(pillar);
  }

  scene.fog = new THREE.FogExp2(0x000000, 0.018);
  scene.add(group);

  return { group, groundMat, gridLines, groundRings, glowMat, pillars };
}

function createParticleSystem(count, spread, height, size, opacity) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * height - 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return { points: new THREE.Points(geo, mat) };
}

export function updateEnvironment(env, progress) {
  // Fade out ground/grid as we enter the cylinder
  const pEnter = smoothstep(phaseProgress(progress, PHASES.ENTER));
  const fade = 1 - pEnter;

  env.groundMat.opacity = fade;
  env.glowMat.opacity = 0.02 * fade;

  env.gridLines.forEach(line => {
    line.material.opacity = 0.03 * fade;
  });

  env.groundRings.forEach((ring, i) => {
    ring.material.opacity = (0.04 - i * 0.01) * fade;
  });

  env.pillars.forEach(p => {
    p.material.opacity = p.userData.baseOpacity * fade;
  });
}
