import * as THREE from 'three';
import { createScrollManager } from './animation/scrollManager.js';
import { updateCamera } from './animation/cameraPath.js';
import { updateRings } from './animation/ringAnimator.js';
import { createRings } from './scene/rings.js';
import { createBeam, updateBeam } from './scene/beam.js';
import { createEnvironment, updateEnvironment } from './scene/environment.js';
import { createFloors } from './scene/floors.js';
import { projectSprintLabels } from './scene/videoPortals.js';
import { setupPostProcessing } from './postprocessing/bloom.js';

// Renderer
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = false;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010a14);

// Procedural environment map
const envScene = new THREE.Scene();
const envCam = new THREE.CubeCamera(0.1, 100, new THREE.WebGLCubeRenderTarget(256));

const envGeo = new THREE.SphereGeometry(50, 32, 32);
const envMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    colorTop: { value: new THREE.Color(0x0a2040) },
    colorMid: { value: new THREE.Color(0x051525) },
    colorBot: { value: new THREE.Color(0x010810) },
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
  window.innerWidth / window.innerHeight,
  0.1,
  150
);
camera.position.set(14, 3, 14);
camera.lookAt(0, 0, 0);

// Lighting
const ambient = new THREE.AmbientLight(0x4488cc, 0.5);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0x3366aa, 0.3);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Scene objects
const rings = createRings(scene);
const beam = createBeam(scene);
const env = createEnvironment(scene);

const discMaterial = rings[0].children[0].material;
const floors = createFloors(scene, discMaterial);

// Post-processing
const { composer, bloomPass, fxPass } = setupPostProcessing(renderer, scene, camera);

// --- Sprint node interaction ---
const sprintLabels = [
  document.getElementById('sprint-label-0'),
  document.getElementById('sprint-label-1'),
];
const sprintFloor = floors[1];
const sprintNodes = sprintFloor ? sprintFloor.sprintNodes : null;

const videoModal = document.getElementById('video-modal');
const videoModalTitle = videoModal.querySelector('.video-modal-title');
const videoPlayer = videoModal.querySelector('#video-player');
let currentSprintIndex = -1;

function openSprint(index) {
  if (!sprintNodes || index < 0 || index >= sprintNodes.length) return;
  currentSprintIndex = index;
  const node = sprintNodes[index];
  videoModalTitle.textContent = node.name;
  if (node.videoUrl) {
    videoPlayer.src = node.videoUrl;
    videoPlayer.play();
  }
  // Force reflow then activate for CSS transition
  videoModal.style.display = 'flex';
  videoModal.offsetHeight; // reflow
  videoModal.classList.add('active');
}

function closeSprint() {
  videoModal.classList.remove('active');
  currentSprintIndex = -1;
  videoPlayer.pause();
  videoPlayer.removeAttribute('src');
  setTimeout(() => {
    if (!videoModal.classList.contains('active')) {
      videoModal.style.display = 'none';
    }
  }, 350);
}

sprintLabels.forEach((label, i) => {
  label.addEventListener('click', () => {
    if (currentSprintIndex === i) {
      closeSprint();
    } else {
      if (currentSprintIndex >= 0) closeSprint();
      setTimeout(() => openSprint(i), currentSprintIndex >= 0 ? 100 : 0);
    }
  });
});

videoModal.querySelector('.video-modal-close').addEventListener('click', closeSprint);
videoModal.querySelector('.video-modal-backdrop').addEventListener('click', closeSprint);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currentSprintIndex >= 0) closeSprint();
});

// Raycaster — click on the 3D hub spheres
const raycaster = new THREE.Raycaster();
const _clickNDC = new THREE.Vector2();

const sprintHubMeshes = sprintNodes ? sprintNodes.map(n => n.hub) : [];

canvas.addEventListener('click', (e) => {
  if (!sprintNodes || videoModal.classList.contains('active')) return;
  _clickNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  _clickNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(_clickNDC, camera);

  const hits = raycaster.intersectObjects(sprintHubMeshes);
  if (hits.length > 0) {
    const idx = sprintHubMeshes.indexOf(hits[0].object);
    if (idx >= 0) {
      if (currentSprintIndex === idx) closeSprint();
      else openSprint(idx);
    }
  }
});

// Pointer cursor when hovering over sprint hub spheres
canvas.addEventListener('mousemove', (e) => {
  if (!sprintNodes || videoModal.classList.contains('active')) return;
  _clickNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  _clickNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(_clickNDC, camera);
  const hits = raycaster.intersectObjects(sprintHubMeshes);
  canvas.style.cursor = hits.length > 0 ? 'pointer' : '';
});

// Scroll
const scrollManager = createScrollManager();

// --- Mouse tracking ---
const mouse = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

// --- Color drift palette per section ---
// deep blue → teal → violet as you scroll deeper
const colorStops = [
  new THREE.Vector3(0, 0, 0),       // intro: neutral
  new THREE.Vector3(0, 0.05, 0.1),  // floors: teal push
  new THREE.Vector3(0.06, 0, 0.1),  // landing: violet push
];

function getColorShift(progress) {
  if (progress < 0.35) return colorStops[0];
  if (progress > 0.90) return colorStops[2];
  const t = (progress - 0.35) / (0.90 - 0.35);
  const out = new THREE.Vector3();
  out.lerpVectors(colorStops[1], colorStops[2], t);
  return out;
}

// Resize
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
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

playBtn.addEventListener('click', () => {
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
    playBtn.classList.remove('playing');
  }
}

// --- Text character reveal system ---
function initCharReveal() {
  document.querySelectorAll('.floor-title, .landing-title').forEach(el => {
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

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  updateAutoPlay();
  const progress = scrollManager.update();
  const vel = scrollManager.velocity;

  // Smooth mouse
  mouse.smoothX += (mouse.x - mouse.smoothX) * 0.05;
  mouse.smoothY += (mouse.y - mouse.smoothY) * 0.05;

  updateRings(progress, rings);
  updateBeam(beam);
  updateEnvironment(env, progress, mouse);
  updateCamera(progress, camera, floors);

  // Mouse parallax — subtle camera offset
  camera.position.x += mouse.smoothX * 0.3;
  camera.position.y += -mouse.smoothY * 0.15;

  // --- Velocity-driven FX ---
  const fxUniforms = fxPass.uniforms;

  // Chromatic aberration: scales with scroll speed
  const targetChromatic = Math.min(vel * 80, 0.015);
  fxUniforms.chromaticStrength.value += (targetChromatic - fxUniforms.chromaticStrength.value) * 0.1;

  // Film grain
  fxUniforms.time.value = performance.now();
  fxUniforms.grainIntensity.value = 0.03;

  // Color drift
  const shift = getColorShift(progress);
  fxUniforms.colorShift.value.lerp(shift, 0.05);

  // Reactive bloom: swells when scrolling
  const baseBloom = 0.9;
  const targetBloom = baseBloom + Math.min(vel * 200, 0.6);
  bloomPass.strength += (targetBloom - bloomPass.strength) * 0.08;

  // Play button
  if (progress > 0.8) {
    playBtn.style.transform = 'rotate(180deg)';
  } else {
    playBtn.style.transform = 'rotate(0deg)';
  }

  // Sprint label projection
  if (sprintNodes) {
    projectSprintLabels(sprintNodes, camera, sprintLabels);
    // Auto-close modal if floor scrolled away
    if (currentSprintIndex >= 0) {
      const intensity = sprintNodes[0]._intensity || 0;
      if (intensity < 0.05) closeSprint();
    }
  }

  // Debug
  const debugEl = document.getElementById('debug');
  if (debugEl) debugEl.textContent = `${(progress * 100).toFixed(1)}% v:${vel.toFixed(5)}`;

  composer.render();
}

animate();
