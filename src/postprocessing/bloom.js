import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Combined post-processing: chromatic aberration + film grain + vignette
const FXShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    chromaticStrength: { value: 0.0 },
    grainIntensity: { value: 0.04 },
    vigDarkness: { value: 1.4 },
    vigOffset: { value: 1.0 },
    colorShift: { value: new THREE.Vector3(0, 0, 0) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float chromaticStrength;
    uniform float grainIntensity;
    uniform float vigDarkness;
    uniform float vigOffset;
    uniform vec3 colorShift;
    varying vec2 vUv;

    // Film grain noise
    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = uv - 0.5;

      // Chromatic aberration — RGB channel split driven by scroll velocity
      float dist = length(center);
      vec2 dir = center * chromaticStrength * dist;
      float r = texture2D(tDiffuse, uv + dir).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - dir).b;
      vec3 col = vec3(r, g, b);

      // Color drift — subtle hue shift per section
      col += colorShift * 0.08;

      // Film grain
      float grain = rand(uv * time * 0.01) * grainIntensity;
      col += grain - grainIntensity * 0.5;

      // Vignette — subtle darkening at edges
      vec2 vigUv = center * vigOffset;
      float vig = clamp(1.0 - dot(vigUv, vigUv), 0.0, 1.0);
      col *= mix(vec3(0.92), vec3(1.0), vig);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function setupPostProcessing(renderer, scene, camera) {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    size,
    0.3,   // strength — subtle on white
    0.8,   // radius
    1.5    // threshold — high so white bg doesn't bloom
  );
  composer.addPass(bloomPass);

  const fxPass = new ShaderPass(FXShader);
  composer.addPass(fxPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return { composer, bloomPass, fxPass };
}
