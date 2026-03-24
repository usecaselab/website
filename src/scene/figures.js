import * as THREE from 'three';

const bodyGeo = new THREE.CapsuleGeometry(0.07, 0.25, 4, 8);
const headGeo = new THREE.SphereGeometry(0.065, 8, 8);

function createFigure() {
  const group = new THREE.Group();

  // Slightly varied gray tones per figure
  const shade = 0.55 + Math.random() * 0.2;
  const color = new THREE.Color(shade, shade, shade);

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0.0,
  });

  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = 0.2;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(headGeo, mat);
  head.position.y = 0.42;
  head.castShadow = true;
  group.add(head);

  // Desk
  const deskGeo = new THREE.BoxGeometry(0.35, 0.015, 0.22);
  const deskMat = new THREE.MeshStandardMaterial({
    color: 0xd5d5d5,
    roughness: 0.6,
  });
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.position.set(0.22, 0.17, 0);
  desk.castShadow = true;
  desk.receiveShadow = true;
  group.add(desk);

  // Chair (simple small box)
  const chairGeo = new THREE.BoxGeometry(0.12, 0.1, 0.12);
  const chair = new THREE.Mesh(chairGeo, deskMat);
  chair.position.set(0, 0.05, 0);
  group.add(chair);

  return group;
}

export function createFigures(count) {
  const group = new THREE.Group();
  const radius = 3.5;

  for (let i = 0; i < count; i++) {
    const figure = createFigure();
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const r = 1.2 + Math.random() * (radius - 2);
    figure.position.x = Math.cos(angle) * r;
    figure.position.z = Math.sin(angle) * r;
    figure.rotation.y = angle + Math.PI + (Math.random() - 0.5) * 0.4;
    group.add(figure);
  }

  return group;
}
