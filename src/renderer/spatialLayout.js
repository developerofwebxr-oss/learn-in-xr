// spatialLayout.js — place SpatialResult[] on a comfortable curved arc.
//
// Mapping (the "spatial-native" idea):
//   relevance -> distance (nearer + larger when higher)
//   category  -> angular sector (related concepts cluster together)
//   children  -> handled by drilldown.js
//
// One arc in front, readable without spinning. Panels billboard to the user.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { SECTORS } from '../schema.js';
import { makePanel } from './panel.js';

export class SpatialLayout {
  /** @param {THREE.Object3D} parent  group the panels are added to */
  constructor(parent) {
    this.parent = parent;
    this.panels = [];      // THREE.Group[]
  }

  clear() {
    for (const p of this.panels) {
      this.parent.remove(p);
      p.traverse((o) => { o.geometry?.dispose?.(); o.material?.map?.dispose?.(); o.material?.dispose?.(); });
    }
    this.panels = [];
  }

  /**
   * Lay out a result set. Returns the created panel groups.
   * @param {import('../schema.js').SpatialResult[]} results
   * @param {THREE.Vector3} [origin] centre the arc faces from (default 0,eye,0)
   */
  layout(results, origin) {
    this.clear();
    const eye = CONFIG.PANEL_EYE_HEIGHT;
    const center = origin || new THREE.Vector3(0, eye, 0);

    // Sort by sector so clusters are contiguous along the arc.
    const sorted = [...results].sort(
      (a, b) => (SECTORS[a.category]?.order ?? 9) - (SECTORS[b.category]?.order ?? 9)
    );

    const n = sorted.length;
    const spread = THREE.MathUtils.degToRad(CONFIG.ARC_SPREAD_DEG);
    const start = -spread / 2;
    const step = n > 1 ? spread / (n - 1) : 0;

    sorted.forEach((node, i) => {
      const panel = makePanel(node);

      // relevance -> radius (higher relevance = closer) and scale
      const rel = THREE.MathUtils.clamp(node.relevance ?? 0.6, 0, 1);
      const radius = CONFIG.ARC_RADIUS * (1.35 - rel * 0.5); // 0.85x..1.35x
      const scale = 0.8 + rel * 0.5;
      panel.userData.baseScale = scale;
      panel.scale.setScalar(scale);

      // angle along arc; nudge vertically by sector so rows don't collide
      const ang = start + step * i;
      const yJitter = ((SECTORS[node.category]?.order ?? 0) % 2) * 0.28 - 0.14;

      const x = center.x + Math.sin(ang) * radius;
      const z = center.z - Math.cos(ang) * radius;
      const y = eye + yJitter + Math.cos(ang) * 0.05;
      panel.position.set(x, y, z);

      // billboard toward the user (arc centre column)
      panel.lookAt(center.x, y, center.z);

      // entrance animation state
      panel.userData.targetScale = scale;
      panel.scale.setScalar(0.001);
      panel.userData.spawnAt = performance.now() + i * 45;

      this.parent.add(panel);
      this.panels.push(panel);
    });

    return this.panels;
  }

  /** Called each frame for entrance pop + gentle float. */
  update(t) {
    for (const p of this.panels) {
      const n = p.userData;
      if (performance.now() >= (n.spawnAt || 0)) {
        const target = n.targetScale * n.baseScaleMul || n.targetScale;
        const cur = p.scale.x;
        const next = cur + (n.targetScale - cur) * 0.18;
        p.scale.setScalar(next);
      }
      // subtle idle float
      p.position.y += Math.sin(t * 0.0012 + p.position.x) * 0.00025;
    }
  }
}
