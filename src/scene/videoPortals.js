import * as THREE from 'three';

const _vec = new THREE.Vector3();

export function updateSprintNodes(sprintNodes, floorProgress, time) {
  if (!sprintNodes || !sprintNodes.length) return;

  // Floor visibility envelope
  let intensity = 0;
  if (floorProgress > 0.05 && floorProgress < 0.78) {
    if (floorProgress < 0.2) intensity = (floorProgress - 0.05) / 0.15;
    else if (floorProgress > 0.65) intensity = (0.78 - floorProgress) / 0.13;
    else intensity = 1;
  }
  intensity = Math.max(0, Math.min(1, intensity));

  sprintNodes.forEach((node, i) => {
    // Blink pulse
    const pulse = Math.sin(time * 3 + i * Math.PI) * 0.5 + 0.5;

    // Hub blink
    node.hub.material.opacity = (0.4 + pulse * 0.6) * intensity;
    const s = 1 + pulse * 0.35;
    node.hub.scale.set(s, s, s);

    // Ring pulse
    node.ring.material.opacity = (0.15 + pulse * 0.45) * intensity;
    const rs = 1 + pulse * 0.2;
    node.ring.scale.set(rs, rs, rs);

    // Store current intensity for label visibility
    node._intensity = intensity;
  });
}

export function projectSprintLabels(sprintNodes, camera, labels) {
  if (!sprintNodes || !labels) return;

  sprintNodes.forEach((node, i) => {
    const label = labels[i];
    if (!label) return;

    // Get world position of hub
    node.hub.getWorldPosition(_vec);

    // Project to screen coords
    _vec.project(camera);

    const x = (0.5 + _vec.x * 0.5) * window.innerWidth;
    const y = (0.5 - _vec.y * 0.5) * window.innerHeight;

    label.style.left = `${x}px`;
    label.style.top = `${y}px`;

    const intensity = node._intensity != null ? node._intensity : 0;
    const floorVisible = node.hub.parent && node.hub.parent.parent && node.hub.parent.parent.visible;
    const visible = floorVisible && _vec.z < 1 && intensity > 0.05;
    label.style.display = visible ? 'block' : 'none';
    label.style.opacity = intensity;
  });
}
