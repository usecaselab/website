import * as THREE from 'three';
import { createResidentsLayer, createPartnersLayer, createCommunityLayer } from './rings.js';

const DISC_THICKNESS = 0.12;
const HOLE_RADIUS = 0.5;

const DISC_SPECS = [
  { inner: HOLE_RADIUS, outer: 1.8 },
  { inner: HOLE_RADIUS, outer: 3.0 },
  { inner: HOLE_RADIUS, outer: 3.6 },
];

export const FLOOR_START_Y = -20;
export const FLOOR_SPACING = 15;

const layerFns = [createResidentsLayer, createPartnersLayer, createCommunityLayer];

function createRingGeo(innerR, outerR, thickness) {
  const halfT = thickness / 2;
  const points = [
    new THREE.Vector2(innerR, -halfT),
    new THREE.Vector2(outerR, -halfT),
    new THREE.Vector2(outerR, halfT),
    new THREE.Vector2(innerR, halfT),
  ];
  return new THREE.LatheGeometry(points, 256);
}

export function createFloors(scene, discMaterial) {
  const floors = [];

  for (let i = 0; i < 3; i++) {
    const { inner, outer } = DISC_SPECS[i];
    const group = new THREE.Group();

    const geo = createRingGeo(inner, outer, DISC_THICKNESS);
    const disc = new THREE.Mesh(geo, discMaterial.clone());
    group.add(disc);

    const layer = layerFns[i](inner, outer);
    group.add(layer);

    // Flat platforms with slight tilt
    group.rotation.x = 0.12 * (i % 2 === 0 ? 1 : -1);

    const y = FLOOR_START_Y - i * FLOOR_SPACING;
    group.position.set(0, y, 0);

    // Extract sprint nodes from Design Sprints floor (floor index 1)
    let sprintNodes = null;
    if (i === 1) {
      sprintNodes = layer.userData.sprintNodes || null;
    }

    group.visible = false;

    scene.add(group);
    floors.push({ group, y, sprintNodes });
  }

  return floors;
}
