import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Blue-tinted vignette for that underwater FFX feel
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    darkness: { value: 1.4 },
    offset: { value: 1.0 },
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
    uniform float darkness;
    uniform float offset;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float vig = clamp(1.0 - dot(uv, uv), 0.0, 1.0);
      // Tint the vignette edges toward deep blue
      vec3 vigColor = mix(vec3(0.01, 0.03, 0.08), vec3(1.0), vig);
      texel.rgb *= mix(vigColor * (1.0 - darkness * 0.3), vec3(1.0), vig);
      gl_FragColor = texel;
    }
  `,
};

export function setupPostProcessing(renderer, scene, camera) {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Stronger, dreamier bloom for FFX ethereal glow
  const bloomPass = new UnrealBloomPass(
    size,
    0.9,   // strength (was 0.6)
    1.0,   // radius (was 1.2)
    0.5    // threshold (was 0.7)
  );
  composer.addPass(bloomPass);

  const vignettePass = new ShaderPass(VignetteShader);
  composer.addPass(vignettePass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return { composer, bloomPass };
}
