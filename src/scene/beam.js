import * as THREE from 'three';

const BEAM_HEIGHT = 14;
const PARTICLE_COUNT = 50;
const PARTICLE_SPREAD = 0.5;

// Pyrefly-style colors
const PYREFLY_COLORS = [
  0xffcc44, // warm amber
  0x88ff66, // green
  0x66ddff, // light blue
  0xffaa22, // orange
  0xaaffaa, // pale green
  0x44aaff, // sky blue
];

function createEthDiamond(scale) {
  const geo = new THREE.OctahedronGeometry(scale, 0);
  geo.scale(0.6, 1, 0.6);
  const color = PYREFLY_COLORS[Math.floor(Math.random() * PYREFLY_COLORS.length)];
  const mat = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: 0.35 + Math.random() * 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(geo, mat);
}

export function createBeam(scene) {
  const group = new THREE.Group();

  const diamonds = [];
  const speeds = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const size = 0.03 + Math.random() * 0.07;
    const diamond = createEthDiamond(size);

    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * PARTICLE_SPREAD;
    diamond.position.set(
      Math.cos(angle) * r,
      (Math.random() - 0.5) * BEAM_HEIGHT,
      Math.sin(angle) * r,
    );
    diamond.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      0,
    );
    diamond.userData.rotSpeed = (Math.random() - 0.5) * 0.02;
    diamond.userData.wobblePhase = Math.random() * Math.PI * 2;

    speeds.push(0.5 + Math.random() * 1.5);
    diamonds.push(diamond);
    group.add(diamond);
  }

  scene.add(group);

  return { group, diamonds, speeds };
}

export function updateBeam(beam) {
  const halfH = 7;
  const t = Date.now() * 0.001;

  beam.diamonds.forEach((d, i) => {
    d.position.y -= beam.speeds[i] * 0.02;
    d.rotation.y += d.userData.rotSpeed;

    // Gentle lateral wobble like pyreflies
    const wobble = d.userData.wobblePhase;
    d.position.x += Math.sin(t * 0.8 + wobble) * 0.001;
    d.position.z += Math.cos(t * 0.6 + wobble) * 0.001;

    // Pulse opacity
    d.material.opacity = (0.35 + Math.sin(t * 1.5 + wobble) * 0.15);

    if (d.position.y < -halfH) {
      d.position.y = halfH;
    }
  });
}
