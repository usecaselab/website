import * as THREE from 'three';
import { createScrollManager } from './animation/scrollManager.js';
import { createCube, updateCube } from './scene/cube.js';
import { setupPostProcessing } from './postprocessing/bloom.js';

// Renderer — cap pixel ratio lower on mobile for performance
const canvas = document.getElementById('canvas');
const isMobile = window.innerWidth <= 768;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
const canvasWidth = window.innerWidth;
const canvasHeight = isMobile ? Math.floor(window.innerHeight / 2) : window.innerHeight;
renderer.setSize(canvasWidth, canvasHeight, false);
canvas.style.width = '';
canvas.style.height = '';
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.NoToneMapping;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Procedural environment map (for panel reflections)
const envScene = new THREE.Scene();
const envCam = new THREE.CubeCamera(0.1, 100, new THREE.WebGLCubeRenderTarget(256));
const envGeo = new THREE.SphereGeometry(50, 32, 32);
const envMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    colorTop: { value: new THREE.Color(0xf0f0f5) },
    colorMid: { value: new THREE.Color(0xfafafa) },
    colorBot: { value: new THREE.Color(0xe8e8f0) },
  },
  vertexShader: `
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 colorTop;
    uniform vec3 colorMid;
    uniform vec3 colorBot;
    varying vec3 vWorldPos;
    void main() {
      float y = normalize(vWorldPos).y;
      vec3 col = y > 0.0 ? mix(colorMid, colorTop, y) : mix(colorMid, colorBot, -y);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
envScene.add(new THREE.Mesh(envGeo, envMat));
envCam.update(renderer, envScene);
scene.environment = envCam.renderTarget.texture;

// Camera
const camera = new THREE.PerspectiveCamera(
  50,
  canvasWidth / canvasHeight,
  0.1,
  200
);
camera.position.set(0, 0, isMobile ? 11 : 9);
camera.lookAt(0, 0, 0);

// On desktop, shift the view so the cube renders on the right half of the full-width canvas
if (!isMobile) {
  camera.setViewOffset(canvasWidth * 2, canvasHeight, canvasWidth * 0.25, 0, canvasWidth, canvasHeight);
}

// Minimal lighting — wireframe lines don't need much
scene.add(new THREE.AmbientLight(0xffffff, 1.0));

// No dust or fog — clean sketch aesthetic

// --- The Cube ---
const cube = createCube(scene);

// Post-processing
const { composer, bloomPass, fxPass } = setupPostProcessing(renderer, scene, camera);

// Scroll
const scrollManager = createScrollManager();

// Mouse tracking
const mouse = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

// Color drift — barely perceptible on white
const colorStops = [
  new THREE.Vector3(0.0, 0.0, 0.0),
  new THREE.Vector3(0.005, 0.005, 0.01),
];

function getColorShift(progress) {
  const t = Math.max(0, Math.min(1, progress));
  const out = new THREE.Vector3();
  out.lerpVectors(colorStops[0], colorStops[1], t);
  return out;
}

// Resize
function onResize() {
  const mobile = window.innerWidth <= 768;
  const w = window.innerWidth;
  const h = mobile ? Math.floor(window.innerHeight / 2) : window.innerHeight;
  camera.aspect = w / h;
  if (!mobile) {
    camera.setViewOffset(w * 2, h, w * 0.25, 0, w, h);
  } else {
    camera.clearViewOffset();
  }
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  canvas.style.width = '';
  canvas.style.height = '';
  composer.setSize(w, h);
}
window.addEventListener('resize', onResize);

// Auto-play
const playBtn = document.getElementById('play-btn');
let autoPlaying = false;
let autoStart = 0;
let autoDirection = 1;
let autoFromScroll = 0;
const AUTO_DURATION = 10000;

if (playBtn) playBtn.addEventListener('click', () => {
  if (autoPlaying) return;
  autoPlaying = true;
  autoStart = Date.now();
  playBtn.classList.add('playing');
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const currentScroll = window.scrollY;
  if (currentScroll > maxScroll * 0.8) {
    autoDirection = -1;
    autoFromScroll = currentScroll;
  } else {
    autoDirection = 1;
    autoFromScroll = currentScroll;
  }
});

function updateAutoPlay() {
  if (!autoPlaying) return;
  const elapsed = Date.now() - autoStart;
  const t = Math.min(elapsed / AUTO_DURATION, 1);
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const target = autoDirection === 1 ? maxScroll : 0;
  window.scrollTo(0, autoFromScroll + (target - autoFromScroll) * eased);
  if (t >= 1) {
    autoPlaying = false;
    if (playBtn) playBtn.classList.remove('playing');
  }
}

// Text character reveal
function initCharReveal() {
  document.querySelectorAll('.landing-title').forEach(el => {
    if (el.dataset.charReady) return;
    const text = el.textContent;
    el.innerHTML = '';
    let charIndex = 0;
    text.split(' ').forEach((word, wi) => {
      if (wi > 0) {
        const space = document.createElement('span');
        space.textContent = ' ';
        space.className = 'char-reveal';
        space.style.setProperty('--i', charIndex);
        el.appendChild(space);
        charIndex++;
      }
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      [...word].forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'char-reveal';
        span.style.setProperty('--i', charIndex);
        wordSpan.appendChild(span);
        charIndex++;
      });
      el.appendChild(wordSpan);
    });
    el.dataset.charReady = 'true';
  });
}
initCharReveal();

// Story overlay elements
const storyEls = [0, 1, 2, 3, 4].map(i => document.getElementById(`story-${i}`));

function smoothstep(t) { return t * t * (3 - 2 * t); }

function updateOverlays(progress, faceProgresses) {
  // Intro
  const intro = document.getElementById('intro-overlay');
  if (intro) {
    const fadeOut = Math.max(0, Math.min(1, progress / 0.06));
    const opacity = 1 - smoothstep(fadeOut);
    intro.style.opacity = opacity;
    intro.style.display = opacity < 0.01 ? 'none' : 'flex';
    if (opacity > 0.5) {
      intro.querySelectorAll('.char-reveal').forEach(ch => ch.classList.add('visible'));
    }
  }

  // Story beats — driven by actual face assembly progress
  // Text appears when face lands (progress >= 0.9), fades when next face lands
  storyEls.forEach((el, i) => {
    if (!el || !faceProgresses) return;

    const landed = faceProgresses[i] >= 0.9;
    const nextLanded = i < 4 && faceProgresses[i + 1] >= 0.9;

    // Last story (index 4) dismisses when landing overlay starts
    const dismissed = i < 4 ? nextLanded : progress > 0.74;

    if (landed && !dismissed) {
      el.style.display = 'flex';

      // Fade in based on how "landed" the face is (0.9 → 1.0 mapped to 0 → 1)
      const fadeIn = Math.min(1, (faceProgresses[i] - 0.9) / 0.1);
      el.style.opacity = smoothstep(fadeIn);

      const desc = el.querySelector('.story-desc');
      if (desc) {
        desc.style.transform = `translateY(${(1 - smoothstep(fadeIn)) * 12}px)`;
        desc.style.opacity = smoothstep(fadeIn);
      }
      const label = el.querySelector('.story-label');
      if (label) label.style.opacity = smoothstep(fadeIn);
    } else if (dismissed && el.style.display !== 'none') {
      // Quick fade out
      el.style.opacity = 0;
      setTimeout(() => { el.style.display = 'none'; }, 300);
    } else {
      el.style.display = 'none';
      el.style.opacity = 0;
    }
  });

  // Landing — after cube is complete
  const landing = document.getElementById('landing-overlay');
  if (landing) {
    const landingStart = 0.74;
    const landingFadeDuration = 0.06; // fade in over ~60vh, similar to story transitions
    if (progress > landingStart) {
      const p = Math.min(1, (progress - landingStart) / landingFadeDuration);
      const s = smoothstep(p);
      landing.style.display = 'flex';
      landing.style.opacity = s;

      const title = landing.querySelector('.landing-title');
      if (title) {
        title.style.opacity = 1;
        title.querySelectorAll('.char-reveal').forEach(ch => {
          if (p > 0.3) ch.classList.add('visible');
        });
      }
      const subtitle = landing.querySelector('.landing-subtitle');
      if (subtitle) {
        subtitle.style.opacity = s;
      }
      const contact = landing.querySelector('.landing-contact');
      if (contact) {
        contact.style.opacity = s;
      }
    } else {
      landing.style.display = 'none';
      landing.style.opacity = 0;
    }
  }

  // Floating initiative labels with wire connections
  const initOverlay = document.getElementById('initiatives-overlay');
  if (initOverlay) {
    const initStart = 0.78;
    if (progress > initStart) {
      const p = Math.min(1, (progress - initStart) / 0.08);
      initOverlay.style.display = 'block';
      initOverlay.style.opacity = 1;

      const rotX = mouse.smoothY * -15;
      const rotY = mouse.smoothX * 15;
      const floats = initOverlay.querySelectorAll('.initiative-float');
      floats.forEach((el, i) => {
        const stagger = i * 0.08;
        const d = Math.max(0, p - stagger) / (1 - stagger);
        const s = smoothstep(Math.min(1, d));
        el.style.opacity = s;
        el.style.transform = `translate(-50%, ${-50 + (1 - s) * 20}%) perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      });

    } else {
      initOverlay.style.display = 'none';
      initOverlay.style.opacity = 0;
      initOverlay.querySelectorAll('.initiative-float').forEach(el => {
        el.style.opacity = 0;
      });
    }
  }
}

// Camera state
let camTheta = 0;   // horizontal orbit angle
let camPhi = 0.15;  // vertical tilt
let activeFace = -1; // which face is currently presenting (-1 = none)

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  updateAutoPlay();
  const progress = scrollManager.update();
  const vel = scrollManager.velocity;

  // Smooth mouse
  mouse.smoothX += (mouse.x - mouse.smoothX) * 0.05;
  mouse.smoothY += (mouse.y - mouse.smoothY) * 0.05;

  // Update cube assembly — returns per-face progress + cube rotation
  const { faceProgresses, cubeRotY } = updateCube(cube, progress, activeFace);

  // Determine which face is currently presenting
  // Find the highest-indexed face that has landed
  let newActiveFace = -1;
  for (let i = 0; i < 6; i++) {
    if (faceProgresses[i] >= 0.9) newActiveFace = i;
  }
  // If next face has also landed, advance to it
  if (newActiveFace >= 0 && newActiveFace < 5 && faceProgresses[newActiveFace + 1] >= 0.9) {
    newActiveFace = newActiveFace + 1;
  }
  if (progress > 0.74) newActiveFace = -1; // landing takes over
  activeFace = newActiveFace;

  // Base angles for each face's outward normal (before cube rotation)
  const FACE_BASE_ANGLES = [
    { theta: 0,               phi: 0.15 },   // front: +Z
    { theta: Math.PI * 0.5,   phi: 0.1 },    // right: +X
    { theta: Math.PI,         phi: 0.15 },    // back: -Z
    { theta: -Math.PI * 0.5,  phi: 0.1 },    // left: -X
    { theta: 0,               phi: 0.7 },     // top: elevated
    { theta: 0,               phi: 0.1 },     // bottom/reveal: straight on, cube tilts itself
  ];

  const t = Date.now() * 0.0003;

  // Camera follows cube rotation — target = face angle + cube's current Y rotation
  if (activeFace >= 0 && activeFace < 6) {
    const base = FACE_BASE_ANGLES[activeFace];
    const targetTheta = base.theta + cubeRotY;

    // Shortest path around the circle
    let diff = targetTheta - camTheta;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    camTheta += diff * 0.06;
    camPhi += (base.phi - camPhi) * 0.06;
  } else {
    // Free orbit when no face is presenting (intro + landing)
    camTheta += 0.002;
    camPhi += (0.15 - camPhi) * 0.03;
  }

  // Zoom: in during assembly, pull back for reveal, hold wide for landing
  let camDist, camYBase;
  const revealStart = 0.62;
  const revealEnd = 0.74;

  if (progress < revealStart) {
    const zoomT = Math.max(0, Math.min(1, progress / revealStart));
    const zoomEased = zoomT * zoomT * (3 - 2 * zoomT);
    camDist = 9 - zoomEased * 3.5; // 9 → 5.5
    camYBase = 0;
  } else if (progress < revealEnd) {
    const pullT = (progress - revealStart) / (revealEnd - revealStart);
    const pullEased = pullT * pullT * (3 - 2 * pullT);
    camDist = 5.5 + pullEased * 5; // 5.5 → 10.5
    camYBase = 0;
  } else {
    camDist = 10.5;
    camYBase = 0;
  }

  // Mouse-driven orbit: stronger when no face is presenting (intro + landing)
  const mouseOrbitStrength = activeFace < 0 ? 0.6 : 0.1;
  const finalTheta = camTheta + mouse.smoothX * mouseOrbitStrength;
  const finalPhi = camPhi - mouse.smoothY * mouseOrbitStrength * 0.5;

  camera.position.set(
    Math.sin(finalTheta) * camDist * Math.cos(finalPhi),
    camYBase + Math.sin(finalPhi) * camDist,
    Math.cos(finalTheta) * camDist * Math.cos(finalPhi)
  );
  camera.lookAt(0, 0, 0);

  // Post-processing FX
  const fxUniforms = fxPass.uniforms;
  const targetChromatic = Math.min(vel * 80, 0.012);
  fxUniforms.chromaticStrength.value += (targetChromatic - fxUniforms.chromaticStrength.value) * 0.1;
  fxUniforms.time.value = performance.now();
  fxUniforms.grainIntensity.value = 0.008;

  const shift = getColorShift(progress);
  fxUniforms.colorShift.value.lerp(shift, 0.05);

  // Bloom — off for clean wireframe look
  bloomPass.strength = 0;

  // Overlays — synced to face assembly
  updateOverlays(progress, faceProgresses);

  composer.render();
}

// If arriving with #bottom hash, scroll to the bottom immediately
if (window.location.hash === '#bottom') {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  window.scrollTo(0, maxScroll);
  history.replaceState(null, '', '/');
}

animate();
