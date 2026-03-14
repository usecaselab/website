import * as THREE from 'three';

const DISC_THICKNESS = 0.12;
const HOLE_RADIUS = 0.8;
const DISC_RADII = [2.5, 4, 5.5];

function createRingGeo(innerR, outerR, thickness) {
  const halfT = thickness / 2;
  const points = [
    new THREE.Vector2(innerR, -halfT),
    new THREE.Vector2(outerR, -halfT),
    new THREE.Vector2(outerR, halfT),
    new THREE.Vector2(innerR, halfT),
  ];
  return new THREE.LatheGeometry(points, 128);
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
function createResidentsLayer(innerR, outerR) {
  const group = new THREE.Group();
  const nodes = [];

  // Place nodes in a structured hex-ish grid within the disc
  const midR = (innerR + outerR) / 2;
  const step = 0.38;
  for (let x = -outerR; x <= outerR; x += step) {
    for (let z = -outerR; z <= outerR; z += step * 0.866) {
      const offsetX = (Math.round(z / (step * 0.866)) % 2) * step * 0.5;
      const px = x + offsetX;
      const dist = Math.sqrt(px * px + z * z);
      if (dist > innerR + 0.15 && dist < outerR - 0.1) {
        nodes.push(new THREE.Vector3(px, 0, z));
      }
    }
  }

  // Core nodes — brighter, slightly larger, represent key researchers
  const coreCount = 6;
  const coreIndices = new Set();
  while (coreIndices.size < Math.min(coreCount, nodes.length)) {
    coreIndices.add(Math.floor(Math.random() * nodes.length));
  }

  const smallDot = new THREE.SphereGeometry(0.025, 6, 6);
  const coreDot = new THREE.SphereGeometry(0.05, 8, 8);

  nodes.forEach((pos, i) => {
    const isCore = coreIndices.has(i);
    const geo = isCore ? coreDot : smallDot;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: isCore ? 0.9 : 0.45,
    });
    const dot = new THREE.Mesh(geo, mat);
    dot.position.copy(pos);
    if (isCore) dot.userData.pulse = true;
    group.add(dot);
  });

  // Dense synaptic connections — only short range
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = nodes[i].distanceTo(nodes[j]);
      if (d < 0.55) {
        const geo = new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[j]]);
        group.add(new THREE.Line(geo, lineMat));
      }
    }
  }

  // Knowledge orbit rings around core nodes
  const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 });
  coreIndices.forEach(idx => {
    const c = nodes[idx];
    [0.2, 0.35].forEach(r => {
      const pts = makeCirclePoints(c.x, c.z, r, 32);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geo, orbitMat));
    });
  });

  group.position.y = DISC_THICKNESS / 2 + 0.005;
  return group;
}

// --- MEDIUM DISC: Partners (VCs, startups, hubs) ---
// Three ecosystems orbiting each other — structured yet interconnected
// Each cluster has its own geometry language: triangles (VCs), squares (hubs), circles (startups)
function createPartnersLayer(innerR, outerR) {
  const group = new THREE.Group();

  // Three cluster centers, evenly spaced
  const clusterAngles = [0, (Math.PI * 2) / 3, (Math.PI * 2 * 2) / 3];
  const clusterR = (innerR + outerR) / 2;
  const clusters = clusterAngles.map(a => ({
    center: new THREE.Vector3(Math.cos(a) * clusterR, 0, Math.sin(a) * clusterR),
    nodes: [],
  }));

  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  const dimDotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 });
  const strongLine = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 });

  clusters.forEach((cluster, ci) => {
    const { center } = cluster;

    // Hub node
    const hubGeo = new THREE.SphereGeometry(0.07, 10, 10);
    const hub = new THREE.Mesh(hubGeo, dotMat);
    hub.position.copy(center);
    hub.userData.pulse = true;
    group.add(hub);
    cluster.nodes.push(center.clone());

    // Satellite nodes in geometric patterns
    const satCount = 7 + Math.floor(Math.random() * 4);
    for (let i = 0; i < satCount; i++) {
      const a = (i / satCount) * Math.PI * 2 + Math.random() * 0.3;
      const r = 0.4 + Math.random() * 0.7;
      const pos = new THREE.Vector3(
        center.x + Math.cos(a) * r,
        0,
        center.z + Math.sin(a) * r,
      );
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      if (dist < innerR + 0.1 || dist > outerR - 0.1) continue;

      const size = 0.025 + Math.random() * 0.025;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(size, 6, 6), dimDotMat);
      dot.position.copy(pos);
      group.add(dot);
      cluster.nodes.push(pos);

      // Spoke to hub
      const geo = new THREE.BufferGeometry().setFromPoints([center, pos]);
      group.add(new THREE.Line(geo, lineMat));
    }

    // Geometric identity ring
    if (ci === 0) {
      // VCs: triangle
      const triR = 0.9;
      const triPts = [];
      for (let i = 0; i <= 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        triPts.push(new THREE.Vector3(center.x + Math.cos(a) * triR, 0, center.z + Math.sin(a) * triR));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(triPts), strongLine));
    } else if (ci === 1) {
      // Startups: double circle (growth)
      [0.6, 0.85].forEach(r => {
        const pts = makeCirclePoints(center.x, center.z, r, 48);
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
      });
    } else {
      // Hubs: square
      const sqR = 0.75;
      const sqPts = [];
      for (let i = 0; i <= 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        sqPts.push(new THREE.Vector3(center.x + Math.cos(a) * sqR, 0, center.z + Math.sin(a) * sqR));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(sqPts), strongLine));
    }
  });

  // Cross-cluster bridges — thicker, partnership links
  for (let i = 0; i < clusters.length; i++) {
    const j = (i + 1) % clusters.length;
    const a = clusters[i].nodes[0];
    const b = clusters[j].nodes[0];
    // Curved arc between cluster hubs
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    mid.y = 0;
    const dist = Math.sqrt(mid.x * mid.x + mid.z * mid.z);
    // Push midpoint slightly outward for arc feel
    if (dist > 0.1) {
      mid.multiplyScalar((dist + 0.3) / dist);
    }
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const pts = curve.getPoints(24);
    pts.forEach(p => { p.y = 0; });
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), strongLine));
  }

  group.position.y = DISC_THICKNESS / 2 + 0.005;
  return group;
}

// --- LARGE DISC: Extended Community ---
// A galaxy — scattered stars of varying brightness with faint constellation arcs
// Denser near the inner edge (closer to the core community), sparser at the rim
function createCommunityLayer(innerR, outerR) {
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

    // Closer to center = brighter and bigger
    const brightness = 0.2 + (1 - normalized) * 0.6;
    const size = 0.015 + (1 - normalized) * 0.025;

    // Some "company" nodes are bigger
    const isCompany = i < 12;
    const finalSize = isCompany ? size * 2 : size;
    const finalBright = isCompany ? Math.min(brightness + 0.2, 0.9) : brightness;

    const dotGeo = new THREE.SphereGeometry(finalSize, 6, 6);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: finalBright,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(pos);
    group.add(dot);
  });

  // Constellation arcs — curved connections between nearby nodes
  const arcMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.035 });
  const connected = new Set();
  for (let i = 0; i < nodes.length; i++) {
    if (connected.has(i)) continue;
    // Find nearest neighbor
    let minD = Infinity;
    let minJ = -1;
    for (let j = i + 1; j < nodes.length; j++) {
      const d = nodes[i].distanceTo(nodes[j]);
      if (d < minD && d < 1.5) {
        minD = d;
        minJ = j;
      }
    }
    if (minJ >= 0) {
      const geo = new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[minJ]]);
      group.add(new THREE.Line(geo, arcMat));
      connected.add(minJ);
    }
  }

  // Faint concentric ripple rings — community radiating outward
  const rippleMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.025 });
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
    color: 0xeae6e2,
    roughness: 0.25,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.8,
    sheen: 0.4,
    sheenRoughness: 0.3,
    sheenColor: new THREE.Color(0xfaf5f0),
    envMapIntensity: 1.2,
  });

  for (let i = 0; i < 3; i++) {
    const radius = DISC_RADII[i];
    const group = new THREE.Group();

    const geo = createRingGeo(HOLE_RADIUS, radius, DISC_THICKNESS);
    const disc = new THREE.Mesh(geo, material.clone());
    group.add(disc);

    const layer = layers[i](HOLE_RADIUS, radius);
    group.add(layer);

    group.position.y = positions[i];
    scene.add(group);
    rings.push(group);
  }

  return rings;
}
