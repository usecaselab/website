import * as THREE from 'three';

const DISC_THICKNESS = 0.12;
const HOLE_RADIUS = 0.5;

// Three solid discs, each with just a center hole
// Proportions based on golden ratio (~1.6x each step)
const DISC_SPECS = [
  { inner: HOLE_RADIUS, outer: 1.8 },    // small (top)
  { inner: HOLE_RADIUS, outer: 3.0 },    // medium
  { inner: HOLE_RADIUS, outer: 3.6 },    // large (bottom)
];

function createRingGeo(innerR, outerR, thickness) {
  const halfT = thickness / 2;
  const points = [
    new THREE.Vector2(innerR, -halfT),
    new THREE.Vector2(outerR, -halfT),
    new THREE.Vector2(outerR, halfT),
    new THREE.Vector2(innerR, halfT),
  ];
  return new THREE.LatheGeometry(points, 512);
}

function randomDiscPoint(innerR, outerR) {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random() * (outerR * outerR - innerR * innerR) + innerR * innerR);
  return new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r);
}

function makeCirclePoints(cx, cz, radius, segments) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(cx + Math.cos(a) * radius, 0, cz + Math.sin(a) * radius));
  }
  return pts;
}

// --- SMALL DISC: Residents & Researchers ---
// An intimate neural network — brains firing together
// Dense hexagonal mesh with pulsing core nodes and orbital knowledge rings
export function createResidentsLayer(innerR, outerR) {
  const group = new THREE.Group();
  const nodes = [];

  // Tight hex grid — step scaled to disc size so it's always dense
  const step = 0.4;
  for (let x = -outerR; x <= outerR; x += step) {
    for (let z = -outerR; z <= outerR; z += step * 0.866) {
      const offsetX = (Math.round(z / (step * 0.866)) % 2) * step * 0.5;
      const px = x + offsetX;
      const dist = Math.sqrt(px * px + z * z);
      if (dist > innerR + 0.1 && dist < outerR - 0.05) {
        nodes.push(new THREE.Vector3(px, 0, z));
      }
    }
  }

  // 5 core nodes — bright anchor points
  const coreCount = 5;
  const coreIndices = new Set();
  while (coreIndices.size < Math.min(coreCount, nodes.length)) {
    coreIndices.add(Math.floor(Math.random() * nodes.length));
  }

  nodes.forEach((pos, i) => {
    const isCore = coreIndices.has(i);
    const size = isCore ? 0.06 + Math.random() * 0.03 : 0.02 + Math.random() * 0.02;
    const mat = new THREE.MeshBasicMaterial({
      color: isCore ? 0x66ddff : 0x5599bb,
      transparent: true,
      opacity: isCore ? 0.7 : 0.35,
    });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), mat);
    dot.position.copy(pos);
    group.add(dot);
  });

  // Dense web — connect everything within range
  const lineMat = new THREE.LineBasicMaterial({ color: 0x4499aa, transparent: true, opacity: 0.15 });
  const strongLineMat = new THREE.LineBasicMaterial({ color: 0x4499aa, transparent: true, opacity: 0.25 });
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = nodes[i].distanceTo(nodes[j]);
      const bothCore = coreIndices.has(i) && coreIndices.has(j);
      if (bothCore && d < 1.5) {
        const geo = new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[j]]);
        group.add(new THREE.Line(geo, strongLineMat));
      } else if (d < 0.35) {
        const geo = new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[j]]);
        group.add(new THREE.Line(geo, lineMat));
      }
    }
  }

  // Orbit rings around cores
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x4499aa, transparent: true, opacity: 0.15 });
  coreIndices.forEach(idx => {
    const c = nodes[idx];
    [0.15, 0.28, 0.4].forEach(r => {
      const pts = makeCirclePoints(c.x, c.z, r, 48);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geo, orbitMat));
    });
  });

  group.position.y = DISC_THICKNESS / 2 + 0.005;
  return group;
}

// --- MEDIUM DISC: Partners (VCs, startups, hubs) ---
// Four clusters in a diamond — two are interactive sprint nodes
export function createPartnersLayer(innerR, outerR) {
  const group = new THREE.Group();
  const sprintNodes = [];

  const clusterR = (innerR + outerR) / 2;
  const ratio = 0.6;
  const diamondPositions = [
    new THREE.Vector3(0, 0, -clusterR),
    new THREE.Vector3(clusterR * ratio, 0, 0),
    new THREE.Vector3(0, 0, clusterR),
    new THREE.Vector3(-clusterR * ratio, 0, 0),
  ];

  // Sprint hubs: top and bottom of diamond
  const sprintConfig = new Map([
    [0, { name: 'Argentina Onchain', videoUrl: '' }],
    [2, { name: 'Unblock SF', videoUrl: '' }],
  ]);

  const clusters = diamondPositions.map(pos => ({ center: pos, nodes: [] }));

  const sprintHubMat = new THREE.MeshBasicMaterial({ color: 0x66ddff, transparent: true, opacity: 0.8 });
  const staticHubMat = new THREE.MeshBasicMaterial({ color: 0x3a7799, transparent: true, opacity: 0.25 });
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x5599bb, transparent: true, opacity: 0.35 });
  const lineMat = new THREE.LineBasicMaterial({ color: 0x4499aa, transparent: true, opacity: 0.15 });
  const bridgeMat = new THREE.LineBasicMaterial({ color: 0x4499aa, transparent: true, opacity: 0.25 });

  clusters.forEach((cluster, ci) => {
    const { center } = cluster;
    const isSprint = sprintConfig.has(ci);

    // Hub
    const hubSize = isSprint ? 0.08 : 0.04;
    const mat = isSprint ? sprintHubMat.clone() : staticHubMat.clone();
    const hub = new THREE.Mesh(new THREE.SphereGeometry(hubSize, 12, 12), mat);
    hub.position.copy(center);
    group.add(hub);
    cluster.nodes.push(center.clone());

    if (isSprint) {
      const cfg = sprintConfig.get(ci);
      hub.userData.isSprint = true;
      hub.userData.sprintName = cfg.name;

      // Glow ring around sprint hub
      const ringGeo = new THREE.RingGeometry(0.12, 0.15, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x66ddff, transparent: true, opacity: 0.4, side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(center);
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);

      sprintNodes.push({ hub, ring, name: cfg.name, videoUrl: cfg.videoUrl });
    }

    // Satellites — varied sizes, spread out
    const satCount = 12 + Math.floor(Math.random() * 4);
    for (let i = 0; i < satCount; i++) {
      const a = (i / satCount) * Math.PI * 2 + Math.random() * 0.3;
      const r = 0.25 + Math.random() * ((outerR - innerR) * 0.5);
      const pos = new THREE.Vector3(center.x + Math.cos(a) * r, 0, center.z + Math.sin(a) * r);
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      if (dist < innerR + 0.1 || dist > outerR - 0.1) continue;

      const size = 0.015 + Math.random() * 0.035;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(size, 6, 6), dotMat.clone());
      dot.material.opacity = 0.35;
      dot.position.copy(pos);
      group.add(dot);
      cluster.nodes.push(pos);

      // Spoke to hub — thin
      const geo = new THREE.BufferGeometry().setFromPoints([center, pos]);
      group.add(new THREE.Line(geo, lineMat));
    }
  });

  // Diamond bridges between hubs
  for (let a = 0; a < clusters.length; a++) {
    const b = (a + 1) % clusters.length;
    const geo = new THREE.BufferGeometry().setFromPoints([clusters[a].nodes[0], clusters[b].nodes[0]]);
    group.add(new THREE.Line(geo, bridgeMat));
  }

  group.userData.sprintNodes = sprintNodes;

  group.position.y = DISC_THICKNESS / 2 + 0.005;
  return group;
}

// --- LARGE DISC: Extended Community ---
// A galaxy — scattered stars of varying brightness with faint constellation arcs
// Denser near the inner edge (closer to the core community), sparser at the rim
export function createCommunityLayer(innerR, outerR) {
  const group = new THREE.Group();
  const nodes = [];
  const nodeCount = 120;

  for (let i = 0; i < nodeCount; i++) {
    // Bias toward inner edge
    const angle = Math.random() * Math.PI * 2;
    const t = Math.pow(Math.random(), 0.6); // bias inner
    const r = innerR + 0.2 + t * (outerR - innerR - 0.3);
    nodes.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
  }

  nodes.forEach((pos, i) => {
    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    const normalized = (dist - innerR) / (outerR - innerR);

    const isCompany = i < 15;
    const isMid = i >= 15 && i < 40;

    let size;
    if (isCompany) size = 0.04 + Math.random() * 0.03;
    else if (isMid) size = 0.02 + Math.random() * 0.02;
    else size = 0.01 + Math.random() * 0.015;

    const dotGeo = new THREE.SphereGeometry(size, 6, 6);
    const dotMat = new THREE.MeshBasicMaterial({
      color: isCompany ? 0x66ddff : 0x5599bb,
      transparent: true,
      opacity: isCompany ? 0.7 : 0.35,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(pos);
    group.add(dot);
  });

  // Connections — every node connects to its 2 nearest neighbors
  const arcMat = new THREE.LineBasicMaterial({ color: 0x4499aa, transparent: true, opacity: 0.15 });
  for (let i = 0; i < nodes.length; i++) {
    const dists = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      dists.push({ j, d: nodes[i].distanceTo(nodes[j]) });
    }
    dists.sort((a, b) => a.d - b.d);
    for (let k = 0; k < 2 && k < dists.length; k++) {
      if (dists[k].d < 2.0) {
        const geo = new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[dists[k].j]]);
        group.add(new THREE.Line(geo, arcMat));
      }
    }
  }

  // Faint concentric ripple rings — community radiating outward
  const rippleMat = new THREE.LineBasicMaterial({ color: 0x4499aa, transparent: true, opacity: 0.15 });
  const rippleCount = 4;
  for (let i = 0; i < rippleCount; i++) {
    const r = innerR + 0.5 + (i / rippleCount) * (outerR - innerR - 0.8);
    const pts = makeCirclePoints(0, 0, r, 96);
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), rippleMat));
  }

  group.position.y = DISC_THICKNESS / 2 + 0.005;
  return group;
}

export function createRings(scene) {
  const rings = [];
  const positions = [4, 0, -4];
  const layers = [createResidentsLayer, createPartnersLayer, createCommunityLayer];

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0a1e35,
    roughness: 0.03,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    reflectivity: 1.0,
    transmission: 0.4,
    thickness: 0.5,
    ior: 2.4,
    envMapIntensity: 2.0,
    transparent: true,
    opacity: 0.8,
  });

  for (let i = 0; i < 3; i++) {
    const { inner, outer } = DISC_SPECS[i];
    const group = new THREE.Group();

    // Disc geometry — invisible, just defines the space
    const geo = createRingGeo(inner, outer, DISC_THICKNESS);
    const disc = new THREE.Mesh(geo, material.clone());
    disc.visible = false;
    group.add(disc);

    const layer = layers[i](inner, outer);
    group.add(layer);

    group.position.y = positions[i];
    scene.add(group);
    rings.push(group);
  }

  return rings;
}
