import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { createScrollManager } from './animation/scrollManager.js';
import { updateCamera } from './animation/cameraPath.js';
import { updateRings } from './animation/ringAnimator.js';
import { createRings } from './scene/rings.js';
import { createBeam, updateBeam } from './scene/beam.js';
import { createEnvironment, updateEnvironment } from './scene/environment.js';
import { createFloors } from './scene/floors.js';
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

// Generate a soft gradient environment map procedurally
const envScene = new THREE.Scene();
const envCam = new THREE.CubeCamera(0.1, 100, new THREE.WebGLCubeRenderTarget(256));

// Soft studio lighting via gradient sphere
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

// No bright spots — keep env map even and soft

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

// Subtle lighting to complement the env map
const ambient = new THREE.AmbientLight(0x4488cc, 0.5);
scene.add(ambient);

// Subtle blue-tinted directional for depth
const dirLight = new THREE.DirectionalLight(0x3366aa, 0.3);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Scene objects
const rings = createRings(scene);
const beam = createBeam(scene);
const env = createEnvironment(scene);

// Get disc material from the first ring for the floor showcases
const discMaterial = rings[0].children[0].material;
const floors = createFloors(scene, discMaterial);

// Post-processing
const { composer } = setupPostProcessing(renderer, scene, camera);

// Scroll
const scrollManager = createScrollManager();

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

// Auto-play: smoothly scroll through the animation
const playBtn = document.getElementById('play-btn');
let autoPlaying = false;
let autoStart = 0;
let autoDirection = 1; // 1 = down, -1 = up
let autoFromScroll = 0;
const AUTO_DURATION = 10000;

playBtn.addEventListener('click', () => {
  if (autoPlaying) return;
  autoPlaying = true;
  autoStart = Date.now();
  playBtn.classList.add('playing');

  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const currentScroll = window.scrollY;

  // If near bottom, scroll back to top; otherwise scroll to bottom
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
  const scrollPos = autoFromScroll + (target - autoFromScroll) * eased;
  window.scrollTo(0, scrollPos);

  if (t >= 1) {
    autoPlaying = false;
    playBtn.classList.remove('playing');
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  updateAutoPlay();
  const progress = scrollManager.update();

  updateRings(progress, rings);
  updateBeam(beam);
  updateEnvironment(env, progress);
  updateCamera(progress, camera, floors);

  // Debug: show scroll progress and current phase
  let phase = 'INTRO';
  // Flip play button direction when near bottom
  if (progress > 0.8) {
    playBtn.style.transform = 'rotate(180deg)';
  } else {
    playBtn.style.transform = 'rotate(0deg)';
  }

  if (progress > 0.90) phase = 'LANDING';
  else if (progress > 0.75) phase = 'FLOOR3';
  else if (progress > 0.55) phase = 'FLOOR2';
  else if (progress > 0.35) phase = 'FLOOR1';
  else if (progress > 0.30) phase = 'THROUGH';
  else if (progress > 0.24) phase = 'DESCEND';
  else if (progress > 0.18) phase = 'ENTER';
  else if (progress > 0.16) phase = 'HOLD';
  else if (progress > 0.07) phase = 'COMPACT';
  else if (progress > 0.04) phase = 'IDLE';
  const debugEl = document.getElementById('debug');
  if (debugEl) debugEl.textContent = `${(progress * 100).toFixed(1)}% — ${phase}`;

  composer.render();
}

animate();
