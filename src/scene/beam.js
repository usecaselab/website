import * as THREE from 'three';

const BEAM_HEIGHT = 14;
const PARTICLE_COUNT = 40;
const PARTICLE_SPREAD = 0.4;

function createEthDiamond(scale) {
  const geo = new THREE.OctahedronGeometry(scale, 0);
  geo.scale(0.6, 1, 0.6);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.4 + Math.random() * 0.3,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

export function createBeam(scene) {
  const group = new THREE.Group();

  const diamonds = [];
  const speeds = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const size = 0.03 + Math.random() * 0.06;
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

    speeds.push(0.5 + Math.random() * 1.5);
    diamonds.push(diamond);
    group.add(diamond);
  }

  scene.add(group);

  return { group, diamonds, speeds };
}

export function updateBeam(beam) {
  const halfH = 7;

  beam.diamonds.forEach((d, i) => {
    d.position.y -= beam.speeds[i] * 0.02;
    d.rotation.y += d.userData.rotSpeed;

    if (d.position.y < -halfH) {
      d.position.y = halfH;
    }
  });
}
