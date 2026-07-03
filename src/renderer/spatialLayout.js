// spatialLayout.js — place SpatialResult[] as a tiered curved GRID.
//
// Mapping (the "spatial-native" idea):
//   relevance -> SIZE + centrality (most relevant sits front-and-centre)
//   category  -> frame colour (see panel.js) — no longer depth
//   children  -> handled by drilldown.js
//
// Every panel shares one radius, so none can hide behind another; when there
// are more panels than fit across the arc they wrap into stacked rows with real
// vertical gaps, keeping every TITLE visible. Placement math lives in
// layoutMath.js (pure + unit-tested); this file is just three.js plumbing.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { makePanel, PANEL_SIZE } from './panel.js';
import { computeGrid } from './layoutMath.js';

const MAX_SCALE = 1.14;  // largest a panel gets (highest relevance)
const MIN_SCALE = 0.92;  // smallest (lowest relevance)
const H_GAP = 0.28;      // min horizontal gap between panels (m)
const V_GAP = 0.34;      // min vertical gap between rows (m)
const MAX_COLS = 5;      // keep the front row readable without head-spinning

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
   * @param {THREE.Vector3} [origin] viewer position the grid faces (default 0,eye,0)
   */
  layout(results, origin) {
    this.clear();
    const eye = CONFIG.PANEL_EYE_HEIGHT;
    const center = origin || new THREE.Vector3(0, eye, 0);
    const radius = CONFIG.ARC_RADIUS;

    // Most relevant first, so it takes the central slot.
    const sorted = [...results].sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));

    // Spacing is computed at MAX_SCALE so even the largest panel keeps its gap.
    const slots = computeGrid(sorted.length, {
      radius,
      spreadDeg: CONFIG.ARC_SPREAD_DEG,
      panelW: PANEL_SIZE.w * MAX_SCALE,
      panelH: PANEL_SIZE.h * MAX_SCALE,
      hGap: H_GAP,
      vGap: V_GAP,
      maxCols: MAX_COLS,
      eye,
    });

    sorted.forEach((node, i) => {
      const slot = slots[i];
      const panel = makePanel(node);

      // relevance -> scale only (never depth)
      const rel = THREE.MathUtils.clamp(node.relevance ?? 0.6, 0, 1);
      const scale = MIN_SCALE + rel * (MAX_SCALE - MIN_SCALE);
      panel.userData.baseScale = scale;
      panel.userData.targetScale = scale;

      // uniform-radius arc position from the slot's angle + row height
      const x = center.x + Math.sin(slot.angle) * radius;
      const z = center.z - Math.cos(slot.angle) * radius;
      const y = slot.y;
      panel.position.set(x, y, z);
      panel.userData.baseY = y; // idle float oscillates around this, no drift

      // face the viewer at this panel's own height (billboard toward centre column)
      panel.lookAt(center.x, y, center.z);

      // entrance pop, staggered from the centre outward
      panel.scale.setScalar(0.001);
      panel.userData.spawnAt = performance.now() + i * 40;

      this.parent.add(panel);
      this.panels.push(panel);
    });

    return this.panels;
  }

  /** Called each frame: entrance pop + gentle drift-free float. */
  update(t) {
    for (const p of this.panels) {
      const u = p.userData;
      if (performance.now() >= (u.spawnAt || 0)) {
        const cur = p.scale.x;
        p.scale.setScalar(cur + (u.targetScale - cur) * 0.18);
      }
      // oscillate around the fixed base Y (no cumulative drift)
      if (u.baseY !== undefined) {
        p.position.y = u.baseY + Math.sin(t * 0.0012 + p.position.x) * 0.012;
      }
    }
  }
}
