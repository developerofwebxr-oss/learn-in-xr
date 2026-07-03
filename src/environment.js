// environment.js — a light, atmospheric backdrop for the concept constellation.
// Kept cheap for Quest: a varied starfield, a soft grid floor, gentle fog and
// two coloured key lights. No heavy assets. (See threejs-visual-polish.)

import * as THREE from 'three';

export function buildEnvironment(scene) {
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.FogExp2(0x05060a, 0.035);

  // key + fill lights, Bitcoin-orange / cyan
  const key = new THREE.DirectionalLight(0xffb060, 0.9); key.position.set(3, 6, 2); scene.add(key);
  const fill = new THREE.DirectionalLight(0x4fd6ff, 0.4); fill.position.set(-4, 2, -3); scene.add(fill);
  scene.add(new THREE.AmbientLight(0x223044, 0.7));

  // varied starfield
  scene.add(makeStars(1200, 60));

  // soft radial grid floor
  const grid = new THREE.GridHelper(40, 40, 0x1b3a4a, 0x122029);
  grid.material.transparent = true; grid.material.opacity = 0.5;
  scene.add(grid);

  // faint ground disc to catch the eye height
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(20, 48),
    new THREE.MeshBasicMaterial({ color: 0x070a10, transparent: true, opacity: 0.85 })
  );
  disc.rotation.x = -Math.PI / 2; disc.position.y = -0.01; scene.add(disc);

  return { key, fill };
}

function makeStars(count, spread) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // shell distribution so stars sit "far"
    const r = spread * (0.6 + Math.random() * 0.4);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * 0.6 + 2;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    // varied warm/cool tint + brightness
    c.setHSL(Math.random() < 0.5 ? 0.09 : 0.55, 0.4, 0.5 + Math.random() * 0.4);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true });
  return new THREE.Points(g, m);
}
