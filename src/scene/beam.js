import * as THREE from 'three';

const BEAM_HEIGHT = 14;
const BEAM_RADIUS = 0.35;
const PARTICLE_COUNT = 120;
const PARTICLE_SPREAD = 0.5;

export function createBeam(scene) {
  const group = new THREE.Group();

  // Soft outer beam
  const beamGeo = new THREE.CylinderGeometry(BEAM_RADIUS, BEAM_RADIUS, BEAM_HEIGHT, 32, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  group.add(beam);

  // Inner brighter core
  const coreGeo = new THREE.CylinderGeometry(BEAM_RADIUS * 0.3, BEAM_RADIUS * 0.3, BEAM_HEIGHT, 16, 1, true);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // Particles
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const speeds = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * PARTICLE_SPREAD;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * BEAM_HEIGHT;
    positions[i * 3 + 2] = Math.sin(angle) * r;
    speeds[i] = 0.5 + Math.random() * 1.5;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  group.add(particles);

  scene.add(group);

  return { group, particles, speeds, beamMat, coreMat };
}

export function updateBeam(beam) {
  const positions = beam.particles.geometry.attributes.position.array;
  const halfH = 7;

  for (let i = 0; i < positions.length / 3; i++) {
    positions[i * 3 + 1] += beam.speeds[i] * 0.02;
    if (positions[i * 3 + 1] > halfH) {
      positions[i * 3 + 1] = -halfH;
    }
  }

  beam.particles.geometry.attributes.position.needsUpdate = true;

  // Subtle pulse
  const pulse = 0.08 + Math.sin(Date.now() * 0.002) * 0.025;
  beam.beamMat.opacity = pulse;
  beam.coreMat.opacity = pulse * 2;
}
