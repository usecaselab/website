import * as THREE from 'three';
import { createFigures } from './figures.js';

const NUM_FLOORS = 7;
const FLOOR_SPACING = 5;
const CYLINDER_HEIGHT = NUM_FLOORS * FLOOR_SPACING + 5;
const CYLINDER_RADIUS = 5;

export function createBuilding(scene) {
  const group = new THREE.Group();
  group.position.y = 2;

  // Clipping plane — cuts away a wedge so interior is visible
  const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, -0.5).normalize(), 0);

  // Cylinder walls (inside face)
  const cylinderGeo = new THREE.CylinderGeometry(
    CYLINDER_RADIUS, CYLINDER_RADIUS, CYLINDER_HEIGHT, 64, 1, true
  );

  const wallMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2f2f2,
    side: THREE.BackSide,
    roughness: 0.95,
    metalness: 0.0,
    clippingPlanes: [clipPlane],
  });
  const cylinder = new THREE.Mesh(cylinderGeo, wallMat);
  cylinder.position.y = -CYLINDER_HEIGHT / 2 + 2;
  cylinder.receiveShadow = true;
  group.add(cylinder);

  // Outer wall
  const outerMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8f8f8,
    side: THREE.FrontSide,
    roughness: 0.9,
    metalness: 0.0,
    clippingPlanes: [clipPlane],
  });
  const outerCylinder = new THREE.Mesh(cylinderGeo, outerMat);
  outerCylinder.position.y = -CYLINDER_HEIGHT / 2 + 2;
  outerCylinder.castShadow = true;
  group.add(outerCylinder);

  // Floors
  const floorGeo = new THREE.CircleGeometry(CYLINDER_RADIUS - 0.15, 64);

  for (let i = 0; i < NUM_FLOORS; i++) {
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0f0f0,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
      clippingPlanes: [clipPlane],
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -i * FLOOR_SPACING;
    floor.receiveShadow = true;
    group.add(floor);

    // Thin floor slab for thickness
    const slabGeo = new THREE.CylinderGeometry(
      CYLINDER_RADIUS - 0.15, CYLINDER_RADIUS - 0.15, 0.15, 64
    );
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: 0xeaeaea,
      roughness: 0.9,
      clippingPlanes: [clipPlane],
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = -i * FLOOR_SPACING - 0.075;
    slab.castShadow = true;
    slab.receiveShadow = true;
    group.add(slab);

    // Floor edge ring — subtle glow line
    const edgeGeo = new THREE.TorusGeometry(CYLINDER_RADIUS - 0.1, 0.02, 12, 128);
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.5,
      clippingPlanes: [clipPlane],
    });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.y = -i * FLOOR_SPACING + 0.01;
    group.add(edge);

    // Soft point light per floor
    const light = new THREE.PointLight(0xffffff, 0.8, 10, 2);
    light.position.set(0, -i * FLOOR_SPACING + 2.5, 0);
    group.add(light);

    // Figures on each floor
    const numPeople = 4 + Math.floor(Math.random() * 4);
    const figures = createFigures(numPeople);
    figures.position.y = -i * FLOOR_SPACING + 0.08;
    group.add(figures);
  }

  scene.add(group);
  return group;
}
