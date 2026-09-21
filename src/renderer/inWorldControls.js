// inWorldControls.js — in-scene Back/Search controls for immersive VR/AR
// sessions, where the DOM HUD doesn't exist at all.
//
// The laser keyboard (one InstancedMesh of boxes as the raycast target,
// pooled sprite letter labels painted once, chip/panel hit-testing via UV
// rects) is PORTED from the sibling WordMesh repo
// (/Users/dev/devxr/wordmesh/index.html, "search panel + keyboard" section) —
// not rebuilt. Adapted here: WordMesh's live match-list-as-you-type became
// a fixed grid of the 12 preset intent chips (this app's queries are a
// keyword/intent match, not a live token filter) plus an explicit SUBMIT
// key, since here a query has to actually go through AgentProvider.search()
// rather than instantly resolving to an already-loaded node.
//
// Lessons honored (also learned the hard way in WordMesh):
//   - raycaster.camera must be set before intersecting any Sprite target
//     (three.js Sprite.raycast() requires it, silently/loudly errors
//     otherwise) — set once at construction, the camera reference never
//     changes.
//   - Trigger state is POLLED each frame from session.inputSources' own
//     gamepad, with manual rising-edge detection — NOT the 'selectstart'/
//     'selectend' XR input events, which WordMesh moved off of after
//     reliability problems across runtimes.
//   - sessionend must dispose everything this module owns. It never
//     touches rig/camera transforms itself, so there's nothing of that
//     kind to reset on top of disposal.
//
// World placement: anchored at a fixed offset from the panel arc's own
// centre/radius (CONFIG.ARC_RADIUS etc.) computed once at spawn — NOT
// parented to the camera/rig — so it holds a consistent position relative
// to the arc regardless of where the user walks, matching "world-locked,
// not head-locked."

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { INTENT_MAP } from '../content/techCorpus.js';

const BTN_SIZE = 0.16;
const BTN_GAP = 0.04;
const ACCENT = new THREE.Color(0xf7931a);
const MUTED = new THREE.Color(0x98a2b8);
const CYAN = new THREE.Color(0x4fd6ff);

// ---- ported from WordMesh, same proportions -----------------------------
const KEY_SIZE = 0.051, KEY_GAP = 0.0085;
const KEY_STEP = KEY_SIZE + KEY_GAP;
const KEYBOARD_TOP_Y = -0.02;

function buildKeyboardLayout() {
  const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const keys = [];
  rows.forEach((row, rowIdx) => {
    const letters = row.split('');
    const rowWidth = letters.length * KEY_STEP;
    letters.forEach((letter, colIdx) => {
      keys.push({ label: letter, action: 'char', value: letter, x: -rowWidth / 2 + colIdx * KEY_STEP + KEY_STEP / 2, y: -rowIdx * KEY_STEP });
    });
  });
  const controlRowIdx = rows.length;
  const controls = [
    { label: '⌫', action: 'backspace' },
    { label: 'CLR', action: 'clear' },
    { label: '⏎ GO', action: 'submit' },
  ];
  const ctrlStep = KEY_STEP * 2.0;
  const ctrlRowWidth = controls.length * ctrlStep;
  controls.forEach((c, i) => keys.push({ ...c, x: -ctrlRowWidth / 2 + i * ctrlStep + ctrlStep / 2, y: -controlRowIdx * KEY_STEP }));
  return keys;
}
const KEYBOARD_LAYOUT = buildKeyboardLayout();

export class InWorldControls {
  /**
   * @param {{scene:THREE.Scene, camera:THREE.PerspectiveCamera, renderer:THREE.WebGLRenderer,
   *   goBack:Function, runSearch:(q:string)=>Promise<void>}} deps
   */
  constructor({ scene, camera, renderer, goBack, runSearch }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.goBack = goBack;
    this.runSearch = runSearch;

    this.group = null; // top-level group; null when not spawned
    this.searchOpen = false;
    this.query = '';

    this.raycaster = new THREE.Raycaster();
    this.raycaster.camera = camera; // Sprite-raycast lesson (see file header)
    this._rayOrigin = new THREE.Vector3();
    this._rayDir = new THREE.Vector3();
    this._triggerPrev = [false, false];
    this._laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    this._noteTimer = 0;
  }

  get spawned() { return !!this.group; }

  // ---- lifecycle ---------------------------------------------------
  spawn() {
    if (this.group) return;
    const group = new THREE.Group();
    group.name = 'in-world-controls';

    // Fixed offset from the arc's own geometry (constants, not live panel
    // positions) — bottom-left, a touch closer than the panel radius so it
    // reads as a separate control cluster, not another result panel.
    const eye = CONFIG.PANEL_EYE_HEIGHT;
    const radius = CONFIG.ARC_RADIUS * 0.72;
    const angle = -THREE.MathUtils.degToRad(CONFIG.ARC_SPREAD_DEG) / 2 - 0.18; // just past the arc's left edge
    const anchorX = Math.sin(angle) * radius;
    const anchorZ = -Math.cos(angle) * radius;
    const anchorY = eye - 0.55;
    group.position.set(anchorX, anchorY, anchorZ);
    group.lookAt(0, anchorY, 0);

    this.backBtn = this._makeButton('back', '←', 'BACK', MUTED);
    this.backBtn.position.set(-(BTN_SIZE + BTN_GAP) / 2, 0, 0);
    group.add(this.backBtn);

    this.searchBtn = this._makeButton('search', '🔍', 'SEARCH', CYAN);
    this.searchBtn.position.set((BTN_SIZE + BTN_GAP) / 2, 0, 0);
    group.add(this.searchBtn);

    this._buildSearchGroup(group);
    this._buildNote(group);

    this.scene.add(group);
    this.group = group;
    this.hoverTargets = [this.backBtn, this.searchBtn, this.chipsMesh, this.keyboardMesh];
  }

  dispose() {
    if (!this.group) return;
    this.group.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { m?.map?.dispose?.(); m?.dispose?.(); });
    });
    this.scene.remove(this.group);
    this.group = null;
    this.searchOpen = false;
    this.query = '';
    this._triggerPrev = [false, false];
  }

  // ---- buttons -------------------------------------------------------
  _makeButton(id, glyph, label, accent) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const paint = (hover) => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 256, 256);
      ctx.fillStyle = hover ? `rgba(${accent.r * 255 | 0},${accent.g * 255 | 0},${accent.b * 255 | 0},0.28)` : 'rgba(14,16,24,0.85)';
      ctx.beginPath(); ctx.arc(128, 128, 118, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = hover ? accent.getStyle() : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(128, 128, 118, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = hover ? accent.getStyle() : '#eef1f8';
      ctx.font = '96px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(glyph, 128, 108);
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.fillText(label, 128, 196);
    };
    paint(false);
    const tex = new THREE.CanvasTexture(canvas);
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(BTN_SIZE, BTN_SIZE),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    mesh.userData.control = id;
    mesh.userData.repaint = paint;
    mesh.userData.canvasTex = tex;
    return mesh;
  }

  // ---- search group: chips panel + ported keyboard --------------------
  _buildSearchGroup(parent) {
    const searchGroup = new THREE.Group();
    searchGroup.visible = false;
    searchGroup.position.set(0, BTN_SIZE * 1.6, 0); // opens above the button pair
    parent.add(searchGroup);
    this.searchGroup = searchGroup;

    // chips panel: query readout + 12-intent grid, one canvas, UV-rect hits
    const dpr = 2;
    const W = 420 * dpr, H = 260 * dpr;
    const chipsCanvas = document.createElement('canvas');
    chipsCanvas.width = W; chipsCanvas.height = H;
    const chipsTex = new THREE.CanvasTexture(chipsCanvas);
    if ('colorSpace' in chipsTex) chipsTex.colorSpace = THREE.SRGBColorSpace;
    const panelW = 0.46, panelH = panelW * (H / W);
    const chipsMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(panelW, panelH),
      new THREE.MeshBasicMaterial({ map: chipsTex, transparent: true, side: THREE.DoubleSide })
    );
    chipsMesh.userData.control = 'chips';
    chipsMesh.position.set(0, 0.14, 0);
    searchGroup.add(chipsMesh);
    this.chipsMesh = chipsMesh;
    this._chipsCanvas = chipsCanvas;
    this._chipsTex = chipsTex;
    this._chipRects = [];
    this._paintChips();

    // keyboard: ported InstancedMesh
    const keyGeo = new THREE.BoxGeometry(KEY_SIZE, KEY_SIZE, KEY_SIZE * 0.4);
    const keyMat = new THREE.MeshBasicMaterial({ color: 0x22304a, transparent: true, opacity: 0.85 });
    const keyboardMesh = new THREE.InstancedMesh(keyGeo, keyMat, KEYBOARD_LAYOUT.length);
    keyboardMesh.userData.control = 'keyboard';
    const tmp = new THREE.Object3D();
    KEYBOARD_LAYOUT.forEach((k, i) => {
      tmp.position.set(k.x, KEYBOARD_TOP_Y + k.y, 0);
      tmp.updateMatrix();
      keyboardMesh.setMatrixAt(i, tmp.matrix);
    });
    keyboardMesh.instanceMatrix.needsUpdate = true;
    searchGroup.add(keyboardMesh);
    this.keyboardMesh = keyboardMesh;

    KEYBOARD_LAYOUT.forEach((k) => {
      const sprite = this._makeKeyLabel(k.label);
      sprite.position.set(k.x, KEYBOARD_TOP_Y + k.y, KEY_SIZE * 0.22);
      searchGroup.add(sprite);
    });
  }

  _makeKeyLabel(text) {
    const size = 60;
    const cnv = document.createElement('canvas');
    cnv.width = size; cnv.height = size;
    const ctx = cnv.getContext('2d');
    ctx.font = `700 ${Math.round(size * (text.length > 1 ? 0.26 : 0.42))}px system-ui, sans-serif`;
    ctx.fillStyle = '#eaf6ff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2 + 1);
    const tex = new THREE.CanvasTexture(cnv);
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    // depthTest:false — same fix WordMesh needed: the semi-transparent key
    // box writes depth, and this label sits only a hair in front of its
    // face, so any view tilt can swing the sprite behind the box's own
    // depth and show the dark box through the letter.
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    sprite.renderOrder = 3;
    const worldSize = KEY_SIZE * 0.7;
    sprite.scale.set(worldSize, worldSize, 1);
    return sprite;
  }

  _paintChips() {
    const ctx = this._chipsCanvas.getContext('2d');
    const w = this._chipsCanvas.width, h = this._chipsCanvas.height;
    const dpr = 2;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(6,10,20,0.9)';
    ctx.beginPath(); ctx.roundRect(0, 0, w, h, 16 * dpr); ctx.fill();
    ctx.strokeStyle = 'rgba(157,182,255,0.5)'; ctx.lineWidth = 2 * dpr;
    ctx.beginPath(); ctx.roundRect(1, 1, w - 2, h - 2, 16 * dpr); ctx.stroke();

    const pad = 14 * dpr;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = `700 ${16 * dpr}px system-ui, sans-serif`;
    ctx.fillStyle = '#eaf6ff';
    ctx.fillText('SEARCH', pad, pad);

    const qy = pad + 24 * dpr, qh = 26 * dpr;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.roundRect(pad, qy, w - pad * 2, qh, 6 * dpr); ctx.fill();
    ctx.font = `600 ${15 * dpr}px system-ui, sans-serif`;
    ctx.fillStyle = '#7de0ff';
    ctx.textBaseline = 'middle';
    ctx.fillText((this.query || 'type below, or tap a chip') + (this.query ? '_' : ''), pad + 8 * dpr, qy + qh / 2 + 1);

    // 12 chips, 3 columns x 4 rows
    this._chipRects = [];
    const gridY = qy + qh + 10 * dpr;
    const cols = 3, rows = 4, gap = 6 * dpr;
    const cellW = (w - pad * 2 - gap * (cols - 1)) / cols;
    const cellH = 24 * dpr;
    INTENT_MAP.forEach((entry, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = pad + col * (cellW + gap);
      const cy = gridY + row * (cellH + gap);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath(); ctx.roundRect(cx, cy, cellW, cellH, 6 * dpr); ctx.fill();
      ctx.strokeStyle = 'rgba(157,182,255,0.3)'; ctx.lineWidth = 1 * dpr;
      ctx.beginPath(); ctx.roundRect(cx, cy, cellW, cellH, 6 * dpr); ctx.stroke();
      ctx.font = `600 ${11 * dpr}px system-ui, sans-serif`;
      ctx.fillStyle = '#cdd9ff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = entry.keywords[0];
      ctx.fillText(label.length > 16 ? label.slice(0, 15) + '…' : label, cx + cellW / 2, cy + cellH / 2 + 1);
      this._chipRects.push({ u0: cx / w, u1: (cx + cellW) / w, v0: cy / h, v1: (cy + cellH) / h, query: entry.keywords[0] });
    });
    this._chipsTex.needsUpdate = true;
  }

  // raycast hit.uv is flipped (v=1 at canvas-top) vs how the canvas was painted
  _chipAtUV(uv) {
    const canvasV = 1 - uv.y;
    for (const r of this._chipRects) {
      if (uv.x >= r.u0 && uv.x <= r.u1 && canvasV >= r.v0 && canvasV <= r.v1) return r.query;
    }
    return null;
  }

  // ---- fallback note (mirrors the DOM toast, invisible in VR) --------
  _buildNote(parent) {
    const canvas = document.createElement('canvas');
    const tex = new THREE.CanvasTexture(canvas);
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.visible = false;
    sprite.renderOrder = 30;
    sprite.position.set(0, BTN_SIZE + 0.12, 0);
    parent.add(sprite);
    this._noteSprite = sprite;
    this._noteCanvas = canvas;
    this._noteTex = tex;
  }

  /** Shown for ~4s, same wording as the DOM toast's fallback note. */
  showFallbackNote(text) {
    if (!this.group) return;
    const dpr = 2;
    const ctx = this._noteCanvas.getContext('2d');
    ctx.font = `600 ${15 * dpr}px system-ui, sans-serif`;
    const textW = ctx.measureText(text).width;
    const padX = 12 * dpr, padY = 8 * dpr;
    const w = Math.ceil(textW + padX * 2), h = Math.ceil(15 * dpr + padY * 2);
    this._noteCanvas.width = w; this._noteCanvas.height = h;
    const ctx2 = this._noteCanvas.getContext('2d');
    ctx2.fillStyle = 'rgba(6,10,20,0.85)';
    ctx2.beginPath(); ctx2.roundRect(0, 0, w, h, h / 2); ctx2.fill();
    ctx2.strokeStyle = 'rgba(247,147,26,0.6)'; ctx2.lineWidth = 2;
    ctx2.beginPath(); ctx2.roundRect(1, 1, w - 2, h - 2, h / 2); ctx2.stroke();
    ctx2.fillStyle = '#ffcf87';
    ctx2.font = `600 ${15 * dpr}px system-ui, sans-serif`;
    ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
    ctx2.fillText(text, w / 2, h / 2 + 1);
    this._noteTex.dispose();
    this._noteTex = new THREE.CanvasTexture(this._noteCanvas);
    if ('colorSpace' in this._noteTex) this._noteTex.colorSpace = THREE.SRGBColorSpace;
    this._noteSprite.material.map = this._noteTex;
    this._noteSprite.material.needsUpdate = true;
    this._noteSprite.scale.set((w / h) * 0.16, 0.16, 1);
    this._noteSprite.visible = true;
    this._noteTimer = 4;
  }

  // ---- search open/close/keys -----------------------------------------
  openSearch() {
    if (!this.group || this.searchOpen) return;
    this.searchOpen = true;
    this.query = '';
    this._paintChips();
    this.searchGroup.visible = true;
  }
  closeSearch() {
    this.searchOpen = false;
    if (this.searchGroup) this.searchGroup.visible = false;
  }
  toggleSearch() { this.searchOpen ? this.closeSearch() : this.openSearch(); }

  async _pressKey(key) {
    if (key.action === 'char') {
      if (this.query.length < 24) this.query += key.value.toLowerCase();
    } else if (key.action === 'backspace') {
      this.query = this.query.slice(0, -1);
    } else if (key.action === 'clear') {
      this.query = '';
    } else if (key.action === 'submit') {
      const q = this.query;
      this.closeSearch();
      await this.runSearch(q);
      return;
    }
    this._paintChips();
  }

  // ---- per-frame: hover highlight + polled trigger select --------------
  /** @param {THREE.Object3D[]} controllers */
  update(dt, controllers) {
    if (this._noteTimer > 0) {
      this._noteTimer -= dt;
      if (this._noteTimer <= 0) this._noteSprite.visible = false;
    }
    if (!this.group || !controllers?.length) return;
    this._updateHover(controllers);
    this._pollTriggers(controllers);
  }

  _rayFromController(ctrl) {
    this._rayOrigin.setFromMatrixPosition(ctrl.matrixWorld);
    this._rayDir.set(0, 0, -1).transformDirection(ctrl.matrixWorld);
    this.raycaster.set(this._rayOrigin, this._rayDir);
  }

  _hitTargets() {
    const targets = [this.backBtn, this.searchBtn];
    if (this.searchOpen) targets.push(this.chipsMesh, this.keyboardMesh);
    return targets.filter(Boolean);
  }

  _updateHover(controllers) {
    let hoveredBtn = null;
    for (const ctrl of controllers) {
      this._rayFromController(ctrl);
      const hits = this.raycaster.intersectObjects(this._hitTargets(), false);
      if (hits[0] && (hits[0].object === this.backBtn || hits[0].object === this.searchBtn)) {
        hoveredBtn = hits[0].object;
        break;
      }
    }
    for (const btn of [this.backBtn, this.searchBtn]) {
      const isHover = btn === hoveredBtn;
      if (btn.userData.hovered !== isHover) {
        btn.userData.hovered = isHover;
        btn.userData.repaint(isHover);
        btn.userData.canvasTex.needsUpdate = true;
      }
    }
  }

  // Polled per-frame from the session's own input sources — NOT the
  // 'selectstart' event (see file header).
  _pollTriggers(controllers) {
    const session = this.renderer.xr.getSession?.();
    if (!session) return;
    for (let i = 0; i < session.inputSources.length; i++) {
      const src = session.inputSources[i];
      const gp = src.gamepad;
      if (!gp) continue;
      const pressed = !!(gp.buttons[0] && gp.buttons[0].pressed);
      if (pressed && !this._triggerPrev[i]) this._trySelect(controllers[i] || controllers[0]);
      this._triggerPrev[i] = pressed;
    }
  }

  async _trySelect(controller) {
    if (!controller) return;
    this._rayFromController(controller);

    const btnHit = this.raycaster.intersectObjects([this.backBtn, this.searchBtn], false)[0];
    if (btnHit) {
      if (btnHit.object === this.backBtn) { this.closeSearch(); this.goBack(); }
      else this.toggleSearch();
      return;
    }
    if (!this.searchOpen) return;

    const keyHit = this.raycaster.intersectObject(this.keyboardMesh)[0];
    if (keyHit && keyHit.instanceId != null) { await this._pressKey(KEYBOARD_LAYOUT[keyHit.instanceId]); return; }

    const chipHit = this.raycaster.intersectObject(this.chipsMesh)[0];
    if (chipHit && chipHit.uv) {
      const q = this._chipAtUV(chipHit.uv);
      if (q) { this.closeSearch(); await this.runSearch(q); }
    }
  }
}
