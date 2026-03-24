import * as THREE from 'three';

const FACE_SIZE = 2;
const FACE_DEPTH = 0.08;
const GAP = 0.02;
const HALF = FACE_SIZE / 2 + FACE_DEPTH / 2 + GAP;

// 6 faces — order = story order (the sequence they assemble)
const FACE_DEFS = [
  { name: 'front',  pos: [0, 0, HALF],  rot: [0, 0, 0] },
  { name: 'right',  pos: [HALF, 0, 0],  rot: [0, Math.PI / 2, 0] },
  { name: 'back',   pos: [0, 0, -HALF], rot: [0, Math.PI, 0] },
  { name: 'left',   pos: [-HALF, 0, 0], rot: [0, -Math.PI / 2, 0] },
  { name: 'top',    pos: [0, HALF, 0],  rot: [-Math.PI / 2, 0, 0] },
  { name: 'bottom', pos: [0, -HALF, 0], rot: [Math.PI / 2, 0, 0] },
];

// Scattered start positions — dramatic, spread wide
const SCATTER_POSITIONS = [
  [0, 0, 9],
  [8, 1, 3],
  [0, -1, -10],
  [-9, 0, -2],
  [2, 10, 1],
  [-1, -9, -1],
];

const SCATTER_ROTATIONS = [
  [0.4, 0.8, 0.2],
  [0.7, 0.2, -0.4],
  [-0.3, -0.6, 0.5],
  [-0.5, 0.9, 0.3],
  [0.2, -0.3, 0.8],
  [-0.8, 0.4, -0.6],
];

// Black lines on white — sketch/wireframe style
const MONO = 0x1a1a1a;
const FACE_ACCENTS = [MONO, MONO, MONO, MONO, MONO, MONO];

// Helper: line from points — bolder lines for illustrated feel
function addLine(group, pts, color, opacity, linewidth) {
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: linewidth || 1 });
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
}

// Helper: circle points
function circlePoints(cx, cy, r, segs, startA, endA) {
  const s = startA ?? 0;
  const e = endA ?? Math.PI * 2;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const a = s + (i / segs) * (e - s);
    pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.001));
  }
  return pts;
}

// Shared frame: outer border, corner accents, edge dots — bold graphic style
function createFrame(group, size, color, accentColor) {
  const half = size / 2;
  const inset = 0.06;

  // Outer border — strong
  addLine(group, [
    new THREE.Vector3(-half + inset, -half + inset, 0.001),
    new THREE.Vector3(half - inset, -half + inset, 0.001),
    new THREE.Vector3(half - inset, half - inset, 0.001),
    new THREE.Vector3(-half + inset, half - inset, 0.001),
    new THREE.Vector3(-half + inset, -half + inset, 0.001),
  ], color, 1.0);

  // Second border — slightly inset, thinner
  const inset1b = 0.1;
  addLine(group, [
    new THREE.Vector3(-half + inset1b, -half + inset1b, 0.001),
    new THREE.Vector3(half - inset1b, -half + inset1b, 0.001),
    new THREE.Vector3(half - inset1b, half - inset1b, 0.001),
    new THREE.Vector3(-half + inset1b, half - inset1b, 0.001),
    new THREE.Vector3(-half + inset1b, -half + inset1b, 0.001),
  ], color, 0.35);

  // Corner accents — bolder
  const cl = 0.28;
  const co = inset + 0.02;
  [
    [[-half + co, -half + co + cl], [-half + co, -half + co], [-half + co + cl, -half + co]],
    [[half - co, -half + co + cl], [half - co, -half + co], [half - co - cl, -half + co]],
    [[half - co, half - co - cl], [half - co, half - co], [half - co - cl, half - co]],
    [[-half + co, half - co - cl], [-half + co, half - co], [-half + co + cl, half - co]],
  ].forEach(([a, b, c]) => {
    addLine(group, [
      new THREE.Vector3(a[0], a[1], 0.001),
      new THREE.Vector3(b[0], b[1], 0.001),
      new THREE.Vector3(c[0], c[1], 0.001),
    ], color, 0.8);
  });

  // Edge midpoint dots — larger
  const dotMat = new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.9 });
  [[0, -half + inset], [0, half - inset], [-half + inset, 0], [half - inset, 0]].forEach(([x, y]) => {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), dotMat);
    dot.position.set(x, y, 0.002);
    group.add(dot);
  });
}

// Helper: add a dot — slightly larger for graphic clarity
function addDot(group, x, y, r, color, opacity) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  const dot = new THREE.Mesh(new THREE.CircleGeometry(r * 1.3, 12), mat);
  dot.position.set(x, y, 0.002);
  group.add(dot);
}

// Helper: inner border rect — bolder
function addInnerBorder(group, size, color, opacity) {
  const half = size / 2;
  const inset = 0.22;
  addLine(group, [
    new THREE.Vector3(-half + inset, -half + inset, 0.001),
    new THREE.Vector3(half - inset, -half + inset, 0.001),
    new THREE.Vector3(half - inset, half - inset, 0.001),
    new THREE.Vector3(-half + inset, half - inset, 0.001),
    new THREE.Vector3(-half + inset, -half + inset, 0.001),
  ], color, opacity * 1.5);
}

// Helper: small ETH diamond
function addEthDiamond(group, x, y, scale, color, opacity) {
  const z = 0.001;
  addLine(group, [
    new THREE.Vector3(x, y + scale * 1.3, z),
    new THREE.Vector3(x + scale * 0.75, y, z),
    new THREE.Vector3(x, y - scale * 1.3, z),
    new THREE.Vector3(x - scale * 0.75, y, z),
    new THREE.Vector3(x, y + scale * 1.3, z),
  ], color, opacity);
  addLine(group, [
    new THREE.Vector3(x - scale * 0.75, y, z),
    new THREE.Vector3(x + scale * 0.75, y, z),
  ], color, opacity * 0.5);
}

// --- FACE 0: Unstoppable — Continuous circuit, no breaks ---
function createMotifUnstoppable(group, size, color, accent) {
  const z = 0.001;
  addInnerBorder(group, size, color, 0.15);

  const r1 = size * 0.32;
  const r2 = size * 0.21;
  const r3 = size * 0.12;

  // Three unbroken concentric rings
  addLine(group, circlePoints(0, 0, r1, 96), accent, 0.55);
  addLine(group, circlePoints(0, 0, r2, 80), color, 0.3);
  addLine(group, circlePoints(0, 0, r3, 48), accent, 0.4);

  // 12 radial spokes connecting all rings
  const nodeCount = 12;
  for (let i = 0; i < nodeCount; i++) {
    const a = (i / nodeCount) * Math.PI * 2;
    const isMain = i % 3 === 0;
    const ox = Math.cos(a), oy = Math.sin(a);

    // Spoke: outer → inner
    addLine(group, [
      new THREE.Vector3(ox * r1, oy * r1, z),
      new THREE.Vector3(ox * r3, oy * r3, z),
    ], color, isMain ? 0.3 : 0.12);

    // Node on outer ring
    addDot(group, ox * r1, oy * r1, isMain ? 0.03 : 0.018, accent, isMain ? 0.8 : 0.45);

    // Node on middle ring
    if (isMain) addDot(group, ox * r2, oy * r2, 0.022, color, 0.5);

    // Tick marks just outside outer ring
    addLine(group, [
      new THREE.Vector3(ox * (r1 + 0.02), oy * (r1 + 0.02), z),
      new THREE.Vector3(ox * (r1 + 0.06), oy * (r1 + 0.06), z),
    ], color, 0.2);
  }

  // Arc segments between nodes on the outer ring (circuit traces)
  for (let i = 0; i < nodeCount; i++) {
    const a1 = (i / nodeCount) * Math.PI * 2 + 0.08;
    const a2 = ((i + 1) / nodeCount) * Math.PI * 2 - 0.08;
    if (i % 2 === 0) {
      // Secondary arc between the main ring and outer ring
      addLine(group, circlePoints(0, 0, (r1 + r2) / 2, 16, a1, a2), color, 0.18);
    }
  }

  // ETH diamond at center
  addEthDiamond(group, 0, 0, size * 0.065, accent, 0.9);
}

// --- FACE 1: The Secure Backbone — Dense hex network + shield ---
function createMotifSecure(group, size, color, accent) {
  const z = 0.001;
  addInnerBorder(group, size, color, 0.15);

  const hexR = size * 0.11;
  const hr = hexR * 0.75;
  const dx = hexR * 1.7;
  const dy = hexR * 1.48;

  // 19-hex grid (3 rows of varying width)
  const positions = [
    [0, 0],
    [dx, 0], [-dx, 0],
    [dx * 0.5, dy], [-dx * 0.5, dy],
    [dx * 0.5, -dy], [-dx * 0.5, -dy],
    [dx * 1.5, dy * 0.5], [-dx * 1.5, dy * 0.5],
    [dx * 1.5, -dy * 0.5], [-dx * 1.5, -dy * 0.5],
    [dx, dy], [-dx, dy],
    [dx, -dy], [-dx, -dy],
    [0, dy * 1.35], [0, -dy * 1.35],
    [dx * 0.5, dy * 2], [-dx * 0.5, dy * 2],
  ];

  // Filter to fit within inner area
  const limit = size * 0.38;
  const validPos = positions.filter(([x, y]) => Math.abs(x) < limit && Math.abs(y) < limit);

  validPos.forEach(([cx, cy], i) => {
    const pts = [];
    for (let j = 0; j <= 6; j++) {
      const a = (j / 6) * Math.PI * 2 - Math.PI / 6;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * hr, cy + Math.sin(a) * hr, z));
    }
    const isCenter = i === 0;
    addLine(group, pts, isCenter ? accent : color, isCenter ? 0.6 : 0.2);

    // Node dots
    addDot(group, cx, cy, isCenter ? 0.03 : 0.015, isCenter ? accent : color, isCenter ? 0.8 : 0.35);
  });

  // Connection lines between nearby hexes
  for (let i = 0; i < validPos.length; i++) {
    for (let j = i + 1; j < validPos.length; j++) {
      const ddx = validPos[i][0] - validPos[j][0];
      const ddy = validPos[i][1] - validPos[j][1];
      const d = Math.sqrt(ddx * ddx + ddy * ddy);
      if (d < dx * 1.2) {
        const isFromCenter = i === 0 || j === 0;
        addLine(group, [
          new THREE.Vector3(validPos[i][0], validPos[i][1], z),
          new THREE.Vector3(validPos[j][0], validPos[j][1], z),
        ], color, isFromCenter ? 0.2 : 0.08);
      }
    }
  }

  // Shield at center — double outline
  const sh = hexR * 0.65;
  const shieldPts = (s) => [
    new THREE.Vector3(0, s * 1.2, z),
    new THREE.Vector3(s * 0.85, s * 0.45, z),
    new THREE.Vector3(s * 0.85, -s * 0.35, z),
    new THREE.Vector3(0, -s * 1.0, z),
    new THREE.Vector3(-s * 0.85, -s * 0.35, z),
    new THREE.Vector3(-s * 0.85, s * 0.45, z),
    new THREE.Vector3(0, s * 1.2, z),
  ];
  addLine(group, shieldPts(sh), accent, 0.7);
  addLine(group, shieldPts(sh * 0.7), color, 0.3);

  // Checkmark inside shield
  addLine(group, [
    new THREE.Vector3(-sh * 0.25, 0, z),
    new THREE.Vector3(-sh * 0.05, -sh * 0.25, z),
    new THREE.Vector3(sh * 0.3, sh * 0.25, z),
  ], accent, 0.6);
}

// --- FACE 2: Everything Built In — Four quadrants with refined icons ---
function createMotifBuiltIn(group, size, color, accent) {
  const z = 0.001;
  addInnerBorder(group, size, color, 0.15);
  const q = size * 0.17;

  // Quadrant dividers — dashed cross
  const half = size * 0.38;
  for (let i = -6; i <= 6; i++) {
    const t = i * half / 6;
    const len = 0.015;
    addLine(group, [new THREE.Vector3(t - len, 0, z), new THREE.Vector3(t + len, 0, z)], color, 0.2);
    addLine(group, [new THREE.Vector3(0, t - len, z), new THREE.Vector3(0, t + len, z)], color, 0.2);
  }

  // Quadrant labels — tiny dots at quadrant centers
  [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx, sy]) => {
    addDot(group, sx * q * 1.3, sy * q * 1.3, 0.01, color, 0.3);
  });

  // Top-left: Key (authentication)
  const kx = -q * 1.3, ky = q * 1.3;
  addLine(group, circlePoints(kx, ky + q * 0.2, q * 0.22, 32), accent, 0.65);
  addLine(group, circlePoints(kx, ky + q * 0.2, q * 0.14, 24), color, 0.25);
  addLine(group, [
    new THREE.Vector3(kx, ky - q * 0.02, z),
    new THREE.Vector3(kx, ky - q * 0.65, z),
  ], accent, 0.65);
  addLine(group, [
    new THREE.Vector3(kx, ky - q * 0.32, z),
    new THREE.Vector3(kx + q * 0.18, ky - q * 0.32, z),
  ], accent, 0.5);
  addLine(group, [
    new THREE.Vector3(kx, ky - q * 0.48, z),
    new THREE.Vector3(kx + q * 0.22, ky - q * 0.48, z),
  ], accent, 0.5);
  addDot(group, kx, ky + q * 0.2, 0.018, accent, 0.7);

  // Top-right: ETH diamond (payments)
  const px = q * 1.3, py = q * 1.3;
  addEthDiamond(group, px, py, q * 0.25, accent, 0.7);
  // Coin ring around it
  addLine(group, circlePoints(px, py, q * 0.45, 48), color, 0.2);
  // Small radiating lines
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    addLine(group, [
      new THREE.Vector3(px + Math.cos(a) * q * 0.48, py + Math.sin(a) * q * 0.48, z),
      new THREE.Vector3(px + Math.cos(a) * q * 0.55, py + Math.sin(a) * q * 0.55, z),
    ], color, 0.15);
  }

  // Bottom-left: Speech bubble (messaging)
  const mx = -q * 1.3, my = -q * 1.3;
  const bw = q * 0.42, bh = q * 0.3;
  // Rounded bubble (using lines)
  addLine(group, [
    new THREE.Vector3(mx - bw, my + bh, z),
    new THREE.Vector3(mx + bw, my + bh, z),
    new THREE.Vector3(mx + bw, my - bh * 0.2, z),
    new THREE.Vector3(mx + bw * 0.25, my - bh * 0.2, z),
    new THREE.Vector3(mx, my - bh * 0.75, z),
    new THREE.Vector3(mx - bw * 0.05, my - bh * 0.2, z),
    new THREE.Vector3(mx - bw, my - bh * 0.2, z),
    new THREE.Vector3(mx - bw, my + bh, z),
  ], accent, 0.6);
  // Inner text lines
  for (let i = 0; i < 3; i++) {
    const ly = my + bh * 0.55 - i * bh * 0.3;
    const lw = bw * (0.65 - i * 0.1);
    addLine(group, [
      new THREE.Vector3(mx - lw, ly, z),
      new THREE.Vector3(mx + lw, ly, z),
    ], color, 0.2);
  }

  // Bottom-right: Database/storage cylinder
  const sx = q * 1.3, sy = -q * 1.3;
  const cw = q * 0.38, ch = q * 0.2;
  for (let i = 0; i < 4; i++) {
    const yy = sy + ch * 1.2 - i * ch * 0.7;
    // Ellipse top of each layer
    addLine(group, circlePoints(sx, yy, cw, 32, 0, Math.PI), i === 0 ? accent : color, i === 0 ? 0.6 : 0.3);
    addLine(group, circlePoints(sx, yy, cw, 32, Math.PI, Math.PI * 2), i === 0 ? accent : color, (i === 0 ? 0.6 : 0.3) * 0.5);
    // Vertical sides
    if (i < 3) {
      addLine(group, [
        new THREE.Vector3(sx - cw, yy, z),
        new THREE.Vector3(sx - cw, yy - ch * 0.7, z),
      ], color, 0.2);
      addLine(group, [
        new THREE.Vector3(sx + cw, yy, z),
        new THREE.Vector3(sx + cw, yy - ch * 0.7, z),
      ], color, 0.2);
    }
  }

  // Tiny ETH at intersection
  addEthDiamond(group, 0, 0, size * 0.04, accent, 0.7);
}

// --- FACE 3: Zero Infrastructure — Brackets + dissolving grid ---
function createMotifZero(group, size, color, accent) {
  const z = 0.001;
  addInnerBorder(group, size, color, 0.1);
  const s = size * 0.22;

  // Prominent code brackets < />
  const bw = 2.2;
  addLine(group, [
    new THREE.Vector3(-s * 0.7, s * 0.55, z),
    new THREE.Vector3(-s * 1.3, 0, z),
    new THREE.Vector3(-s * 0.7, -s * 0.55, z),
  ], accent, 0.75);
  addLine(group, [
    new THREE.Vector3(s * 0.7, s * 0.55, z),
    new THREE.Vector3(s * 1.3, 0, z),
    new THREE.Vector3(s * 0.7, -s * 0.55, z),
  ], accent, 0.75);
  // Slash
  addLine(group, [
    new THREE.Vector3(s * 0.18, s * 0.5, z),
    new THREE.Vector3(-s * 0.18, -s * 0.5, z),
  ], accent, 0.55);

  // Faint secondary brackets (echo)
  addLine(group, [
    new THREE.Vector3(-s * 0.55, s * 0.4, z),
    new THREE.Vector3(-s * 1.0, 0, z),
    new THREE.Vector3(-s * 0.55, -s * 0.4, z),
  ], color, 0.15);
  addLine(group, [
    new THREE.Vector3(s * 0.55, s * 0.4, z),
    new THREE.Vector3(s * 1.0, 0, z),
    new THREE.Vector3(s * 0.55, -s * 0.4, z),
  ], color, 0.15);

  // Dissolving grid — fades from left to right
  const gridSize = 8;
  const gridSpacing = size * 0.06;
  const gridOff = -gridSize * gridSpacing / 2;
  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const gx = gridOff + i * gridSpacing;
      const gy = gridOff + j * gridSpacing;
      const dist = Math.sqrt(gx * gx + gy * gy);
      // Dissolve: nodes near center are gone, edges fade
      const fade = Math.max(0, Math.min(1, (dist - s * 0.6) / (s * 0.8)));
      if (fade > 0.05) {
        addDot(group, gx, gy, 0.008, color, fade * 0.2);
      }
    }
  }

  // A few ghost horizontal lines (dissolved server rack)
  for (let i = 0; i < 5; i++) {
    const gy = -s * 0.9 + i * s * 0.45;
    const opacity = 0.04 + Math.random() * 0.04;
    // Fragmented line
    const segs = 3 + Math.floor(Math.random() * 3);
    for (let seg = 0; seg < segs; seg++) {
      const x1 = -s * 1.2 + (seg / segs) * s * 2.4 + Math.random() * 0.05;
      const x2 = x1 + s * (0.15 + Math.random() * 0.3);
      addLine(group, [
        new THREE.Vector3(x1, gy, z),
        new THREE.Vector3(Math.min(x2, s * 1.2), gy, z),
      ], color, opacity);
    }
  }
}

// --- FACE 4: Your Data, Your Rules — Fingerprint + lock ---
function createMotifData(group, size, color, accent) {
  const z = 0.001;
  addInnerBorder(group, size, color, 0.15);

  // Fingerprint — many concentric partial arcs with unique breaks
  const arcCount = 10;
  for (let i = 0; i < arcCount; i++) {
    const r = size * (0.06 + i * 0.032);
    // Unique start/end per arc — gives fingerprint irregularity
    const seed = i * 137.5; // golden angle
    const gapPos = (seed % 360) * Math.PI / 180;
    const gapSize = 0.3 + (i % 3) * 0.2;

    // Draw arc in two segments (with a gap)
    addLine(group, circlePoints(0, 0, r, 40, gapPos + gapSize, gapPos + Math.PI * 2 - gapSize * 0.5),
      i < 3 ? accent : color, i < 3 ? 0.55 : (0.3 - i * 0.02));

    // Small arc on opposite side for density
    if (i > 2 && i < 8) {
      const miniStart = gapPos + Math.PI - 0.4;
      const miniEnd = gapPos + Math.PI + 0.4;
      addLine(group, circlePoints(0, 0, r + size * 0.01, 12, miniStart, miniEnd), color, 0.1);
    }
  }

  // Lock body at center
  const lw = size * 0.06, lh = size * 0.05;
  addLine(group, [
    new THREE.Vector3(-lw, -lh * 0.3, z),
    new THREE.Vector3(lw, -lh * 0.3, z),
    new THREE.Vector3(lw, -lh * 1.5, z),
    new THREE.Vector3(-lw, -lh * 1.5, z),
    new THREE.Vector3(-lw, -lh * 0.3, z),
  ], accent, 0.8);

  // Lock shackle (arch)
  addLine(group, circlePoints(0, -lh * 0.3, lw * 0.75, 20, 0, Math.PI), accent, 0.7);

  // Keyhole
  addDot(group, 0, -lh * 0.75, 0.015, accent, 0.9);
  addLine(group, [
    new THREE.Vector3(0, -lh * 0.85, z),
    new THREE.Vector3(0, -lh * 1.2, z),
  ], accent, 0.6);

  // Radiating data lines from fingerprint edges
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const r1 = size * 0.34;
    const r2 = size * 0.39;
    addLine(group, [
      new THREE.Vector3(Math.cos(a) * r1, Math.sin(a) * r1, z),
      new THREE.Vector3(Math.cos(a) * r2, Math.sin(a) * r2, z),
    ], color, 0.15);
    addDot(group, Math.cos(a) * r2, Math.sin(a) * r2, 0.012, color, 0.3);
  }
}

// --- FACE 5: The World Computer — Globe + orbits + nodes ---
function createMotifGlobe(group, size, color, accent) {
  const z = 0.001;
  addInnerBorder(group, size, color, 0.15);
  const r = size * 0.25;

  // Globe outline — double ring
  addLine(group, circlePoints(0, 0, r, 80), accent, 0.65);
  addLine(group, circlePoints(0, 0, r * 1.04, 80), color, 0.15);

  // Latitude lines (horizontal ellipses)
  [0.8, 0.55, 0.25].forEach((f, i) => {
    // Squished circles for latitude
    const pts = [];
    for (let j = 0; j <= 48; j++) {
      const a = (j / 48) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r * f, Math.sin(a) * r * 0.2 * (i + 1) / 2, z));
    }
    addLine(group, pts, color, 0.15 + i * 0.05);
  });

  // Longitude ellipses — 5 meridians with varying squish
  for (let i = 0; i < 5; i++) {
    const squish = 0.15 + i * 0.2;
    const pts = [];
    for (let j = 0; j <= 48; j++) {
      const a = (j / 48) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r * squish, Math.sin(a) * r, z));
    }
    addLine(group, pts, color, 0.12 + (i === 2 ? 0.1 : 0));
  }

  // Equator + prime meridian — bright
  addLine(group, [new THREE.Vector3(-r, 0, z), new THREE.Vector3(r, 0, z)], accent, 0.35);
  addLine(group, [new THREE.Vector3(0, -r, z), new THREE.Vector3(0, r, z)], accent, 0.35);

  // Orbit rings — 3 tilted ellipses
  const orbitConfigs = [
    { r: r * 1.3, tiltY: 0.35, tiltX: 0.15, opacity: 0.5 },
    { r: r * 1.4, tiltY: -0.25, tiltX: -0.1, opacity: 0.35 },
    { r: r * 1.2, tiltY: 0.1, tiltX: 0.4, opacity: 0.25 },
  ];
  orbitConfigs.forEach(({ r: or, tiltY, tiltX, opacity }) => {
    const pts = [];
    for (let j = 0; j <= 80; j++) {
      const a = (j / 80) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(a) * or,
        Math.sin(a) * or * 0.3 + Math.cos(a) * tiltY * or * 0.35,
        z
      ));
    }
    addLine(group, pts, accent, opacity);
  });

  // Satellite dots on orbit paths
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.5;
    const or = r * (1.2 + (i % 3) * 0.1);
    addDot(group, Math.cos(a) * or, Math.sin(a) * or * 0.3, 0.015, accent, 0.5);
  }

  // ETH diamond at core
  addEthDiamond(group, 0, 0, size * 0.06, accent, 0.9);
}

// Face motif lookup
const FACE_MOTIFS = [
  createMotifUnstoppable,
  createMotifSecure,
  createMotifBuiltIn,
  createMotifZero,
  createMotifData,
  createMotifGlobe,
];

function createNeonPattern(size, neonColor, accentColor, faceIndex) {
  const group = new THREE.Group();

  // Shared frame
  createFrame(group, size, neonColor, accentColor);

  // Unique motif per face
  FACE_MOTIFS[faceIndex](group, size, neonColor, accentColor);

  return group;
}

function createFacePanel(faceIndex) {
  const group = new THREE.Group();
  const accent = FACE_ACCENTS[faceIndex];

  // Invisible panel — just for structure/raycasting
  const panelGeo = new THREE.BoxGeometry(FACE_SIZE, FACE_SIZE, FACE_DEPTH);
  const panelMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(panelGeo, panelMat));

  // Sketch pattern — unique motif per face
  const pattern = createNeonPattern(FACE_SIZE, accent, accent, faceIndex);
  pattern.position.z = FACE_DEPTH / 2;
  group.add(pattern);

  // Wireframe edges — clean black lines
  const edgeGeo = new THREE.EdgesGeometry(panelGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.7 });
  group.add(new THREE.LineSegments(edgeGeo, edgeMat));

  return group;
}

export function createCube(scene) {
  const cubeGroup = new THREE.Group();
  const pieces = [];

  FACE_DEFS.forEach((def, i) => {
    const piece = createFacePanel(i);

    piece.userData.targetPos = new THREE.Vector3(...def.pos);
    piece.userData.targetRot = new THREE.Euler(...def.rot);
    piece.userData.scatterPos = new THREE.Vector3(...SCATTER_POSITIONS[i]);
    piece.userData.scatterRot = new THREE.Euler(...SCATTER_ROTATIONS[i]);

    piece.position.copy(piece.userData.scatterPos);
    piece.rotation.copy(piece.userData.scatterRot);

    piece.userData.floatOffset = Math.random() * Math.PI * 2;
    piece.userData.floatSpeed = 0.5 + Math.random() * 0.5;

    cubeGroup.add(piece);
    pieces.push(piece);
  });

  scene.add(cubeGroup);
  return { group: cubeGroup, pieces };
}

// Stagger timing: each face has its own assembly window
// Face 0 assembles first, face 5 last
const FACE_COUNT = 6;
const STAGGER_START = 0.06; // first face starts moving at 6% scroll
const STAGGER_END = 0.68;   // last face done at 68% scroll
const FACE_DURATION = 0.12;  // each face takes 12% of scroll to assemble
const FACE_GAP = (STAGGER_END - STAGGER_START - FACE_DURATION) / (FACE_COUNT - 1);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Track cube rotation state
let cubeRotY = 0;
let cubeRotX = 0;

export function updateCube(cube, progress, activeFace) {
  const t = Date.now() * 0.001;
  const dt = 0.016; // ~60fps timestep

  // Per-face staggered assembly
  const faceProgresses = [];

  cube.pieces.forEach((piece, i) => {
    const faceStart = STAGGER_START + i * FACE_GAP;
    const faceEnd = faceStart + FACE_DURATION;
    const raw = Math.max(0, Math.min(1, (progress - faceStart) / (faceEnd - faceStart)));
    const eased = easeInOutCubic(raw);
    faceProgresses.push(eased);

    const sp = piece.userData.scatterPos;
    const tp = piece.userData.targetPos;
    const sr = piece.userData.scatterRot;
    const tr = piece.userData.targetRot;

    // Lerp position & rotation
    piece.position.x = sp.x + (tp.x - sp.x) * eased;
    piece.position.y = sp.y + (tp.y - sp.y) * eased;
    piece.position.z = sp.z + (tp.z - sp.z) * eased;
    piece.rotation.x = sr.x + (tr.x - sr.x) * eased;
    piece.rotation.y = sr.y + (tr.y - sr.y) * eased;
    piece.rotation.z = sr.z + (tr.z - sr.z) * eased;

    // Float when not yet assembled
    const floatAmount = 1 - eased;
    const fo = piece.userData.floatOffset;
    const fs = piece.userData.floatSpeed;
    piece.position.y += Math.sin(t * fs + fo) * 0.15 * floatAmount;
    piece.position.x += Math.cos(t * fs * 0.7 + fo) * 0.08 * floatAmount;
  });

  // Cube rotation: slow spin when free, near-stop when presenting, spin during reveal
  const allAssembled = faceProgresses.every(p => p > 0.99);
  if (allAssembled) {
    // Fully assembled — slow spin to show it off
    cubeRotY += 0.004;
  } else if (activeFace >= 0) {
    // Presenting a face — very slow drift
    cubeRotY += 0.0003;
  } else {
    // Free spin (intro/landing)
    cubeRotY += 0.003;
  }

  // Tilt the cube to show the bottom face (world computer) when it's the active face
  let targetRotX;
  if (activeFace === 5) {
    // Tilt backward 90° so bottom face presents to camera
    targetRotX = -Math.PI * 0.5;
  } else {
    targetRotX = Math.sin(t * 0.1) * 0.06;
  }
  cubeRotX += (targetRotX - cubeRotX) * 0.04;

  cube.group.rotation.y = cubeRotY;
  cube.group.rotation.x = cubeRotX;

  return { faceProgresses, cubeRotY };
}
