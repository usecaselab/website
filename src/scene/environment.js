import * as THREE from 'three';
import { PHASES, phaseProgress, smoothstep } from '../animation/scrollManager.js';

export function createEnvironment(scene) {
  const group = new THREE.Group();

  // --- GROUND (deep ocean floor) ---
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshPhysicalMaterial({
    color: 0x021a2e,
    roughness: 0.2,
    metalness: 0.9,
    envMapIntensity: 0.6,
    transparent: true,
    opacity: 1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -7;
  group.add(ground);

  // Grid lines (faint blue)
  const gridLines = [];
  const gridSize = 60;
  const gridStep = 2;
  const gridMat = new THREE.LineBasicMaterial({
    color: 0x3088cc,
    transparent: true,
    opacity: 0.04,
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

  const groundRings = [];
  const glowMat = { opacity: 0 };

  // --- PYREFLIES ---
  const pyreflies = createPyreflySystem(150, 30, 20);
  group.add(pyreflies.points);

  // Distant blue dust
  const dust1 = createParticleSystem(300, 25, 15, 0.025, 0.1, 0x60c0ff);
  group.add(dust1.points);
  const dust2 = createParticleSystem(150, 50, 30, 0.04, 0.05, 0x4090cc);
  group.add(dust2.points);

  // --- VERTICAL LIGHT PILLARS ---
  const pillars = [];
  const pillarMat = new THREE.MeshBasicMaterial({
    color: 0x3088cc,
    transparent: true,
    opacity: 0.012,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dist = 15 + Math.random() * 10;
    const height = 20 + Math.random() * 15;
    const pillarGeo = new THREE.PlaneGeometry(0.04, height);
    const pillar = new THREE.Mesh(pillarGeo, pillarMat.clone());
    pillar.userData.baseOpacity = 0.008 + Math.random() * 0.012;
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

  scene.fog = new THREE.FogExp2(0x010a14, 0.016);
  scene.add(group);

  return { group, groundMat, gridLines, groundRings, glowMat, pillars, pyreflies };
}

function createPyreflySystem(count, spread, height) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const pyreflyColors = [
    new THREE.Color(0xffcc44),
    new THREE.Color(0x88ff66),
    new THREE.Color(0x66ddff),
    new THREE.Color(0xffaa22),
    new THREE.Color(0xaaffaa),
  ];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * height - 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;

    const c = pyreflyColors[Math.floor(Math.random() * pyreflyColors.length)];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.08,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    sizeAttenuation: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  return { points, positions, count };
}

function createParticleSystem(count, spread, height, size, opacity, color) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * height - 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  return { points: new THREE.Points(geo, mat) };
}

export function updateEnvironment(env, progress, mouse) {
  const pEnter = smoothstep(phaseProgress(progress, PHASES.ENTER));
  const fade = 1 - pEnter;

  env.groundMat.opacity = fade;
  env.glowMat.opacity = 0.04 * fade;

  env.gridLines.forEach(line => {
    line.material.opacity = 0.04 * fade;
  });

  env.groundRings.forEach((ring, i) => {
    ring.material.opacity = (0.06 - i * 0.015) * fade;
  });

  env.pillars.forEach(p => {
    p.material.opacity = p.userData.baseOpacity * fade;
  });

  // Animate pyreflies with mouse attraction
  if (env.pyreflies) {
    const pos = env.pyreflies.points.geometry.attributes.position;
    const t = Date.now() * 0.001;

    // Mouse world-space approximation (project onto xz plane near camera)
    const mx = mouse ? mouse.smoothX * 15 : 0;
    const mz = mouse ? -mouse.smoothY * 15 : 0;

    for (let i = 0; i < env.pyreflies.count; i++) {
      const idx = i * 3;

      // Base drift
      pos.array[idx + 1] += 0.003 + Math.sin(t + i * 1.7) * 0.002;
      pos.array[idx] += Math.sin(t * 0.5 + i * 2.3) * 0.001;
      pos.array[idx + 2] += Math.cos(t * 0.4 + i * 1.9) * 0.001;

      // Mouse attraction — gentle pull toward cursor
      const dx = mx - pos.array[idx];
      const dz = mz - pos.array[idx + 2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 12) {
        const force = 0.0008 * (1 - dist / 12);
        pos.array[idx] += dx * force;
        pos.array[idx + 2] += dz * force;
      }

      if (pos.array[idx + 1] > 10) pos.array[idx + 1] = -12;
    }
    pos.needsUpdate = true;
  }
}
