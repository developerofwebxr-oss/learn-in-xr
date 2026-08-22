// controls.js — ONE movement/selection path fed by many inputs.
//
// Flat (desktop): pointer-lock mouse-look + WASD; click to select.
// Flat (mobile):  drag-look + on-screen joystick; tap to select.
// VR/AR:          controller ray + trigger to select; thumbstick to move.
//
// Selection is unified: whatever the input, we raycast against the current
// panels and report hover/select to the app via callbacks.

import * as THREE from 'three';

const isCoarse = matchMedia('(pointer: coarse) and (not (pointer: fine))').matches;

export class Controls {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.PerspectiveCamera} camera
   * @param {THREE.Group} rig
   * @param {()=>THREE.Object3D[]} getTargets  current selectable panel groups
   * @param {{onHover:Function,onSelect:Function}} cb
   */
  constructor(renderer, camera, rig, getTargets, cb) {
    this.renderer = renderer;
    this.camera = camera;
    this.rig = rig;
    this.getTargets = getTargets;
    this.cb = cb;
    this.enabled = true;

    this.yaw = 0; this.pitch = 0;
    this.keys = {};
    this.move = new THREE.Vector2(); // joystick / wasd combined
    this.ray = new THREE.Raycaster();
    this.tmp = new THREE.Vector3();
    this.hovered = null;

    this._initFlatLook();
    this._initKeys();
    if (isCoarse) this._initJoystick();
    this._initXR();
    this._initGyro();
  }

  // ---- desktop pointer-lock + mobile drag look ---------------------
  _initFlatLook() {
    const dom = this.renderer.domElement;
    if (!isCoarse) {
      dom.addEventListener('click', (e) => {
        if (document.pointerLockElement !== dom) { dom.requestPointerLock(); return; }
        this._flatSelect();
      });
      document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement !== dom) return;
        this.yaw -= e.movementX * 0.0022;
        this.pitch -= e.movementY * 0.0022;
        this._clampPitch();
      });
    } else {
      // mobile: drag anywhere not on a UI control to look; tap to select
      let lastX = 0, lastY = 0, dragging = false, moved = 0;
      const onStart = (x, y) => { dragging = true; lastX = x; lastY = y; moved = 0; };
      const onMove = (x, y) => {
        if (!dragging) return;
        const dx = x - lastX, dy = y - lastY; lastX = x; lastY = y; moved += Math.abs(dx) + Math.abs(dy);
        this.yaw -= dx * 0.005; this.pitch -= dy * 0.005; this._clampPitch();
      };
      const onEnd = () => { if (dragging && moved < 8) this._flatSelect(); dragging = false; };
      dom.addEventListener('touchstart', (e) => { const t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: true });
      dom.addEventListener('touchmove', (e) => { const t = e.touches[0]; onMove(t.clientX, t.clientY); }, { passive: true });
      dom.addEventListener('touchend', onEnd, { passive: true });
    }
  }
  _clampPitch() { this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch)); }

  _initKeys() {
    addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }

  // ---- on-screen analog joystick (mobile) -------------------------
  _initJoystick() {
    const base = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');
    if (!base) return;
    base.style.display = 'block';
    let active = false, cx = 0, cy = 0;
    const R = 46;
    const set = (dx, dy) => {
      const d = Math.min(R, Math.hypot(dx, dy)); const a = Math.atan2(dy, dx);
      const kx = Math.cos(a) * d, ky = Math.sin(a) * d;
      knob.style.transform = `translate(${kx}px, ${ky}px)`;
      this.move.set(Math.cos(a) * (d / R), -Math.sin(a) * (d / R));
    };
    const start = (t) => { active = true; const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; };
    const moveJ = (t) => { if (active) set(t.clientX - cx, t.clientY - cy); };
    const end = () => { active = false; knob.style.transform = 'translate(0,0)'; this.move.set(0, 0); };
    base.addEventListener('touchstart', (e) => { start(); moveJ(e.touches[0]); }, { passive: true });
    base.addEventListener('touchmove', (e) => moveJ(e.touches[0]), { passive: true });
    base.addEventListener('touchend', end, { passive: true });
  }

  // ---- gyro free-look (mobile, OPT-IN only) ------------------------
  //
  // Off by default: no listener is attached until enableGyro() is called
  // from a real tap (required on iOS — DeviceOrientationEvent.requestPermission()
  // only resolves 'granted' when invoked synchronously inside a user gesture,
  // so toggleGyro()/enableGyro() must be awaited directly from the tap handler,
  // not after any other await first).
  //
  // Applies device-orientation readings as frame-to-frame DELTAS (not an
  // absolute recompute from a fixed baseline) so it composes cleanly with
  // manual drag-look, which mutates the same this.yaw/this.pitch — and so
  // turning gyro off just stops updating them, with no snap back to zero.
  _initGyro() {
    this.gyroEnabled = false;
    this.gyroSupported = typeof DeviceOrientationEvent !== 'undefined';
    this._gyroLast = null; // { alpha, beta } from the previous reading
    this._onDeviceOrientation = (e) => {
      if (!this.gyroEnabled || e.alpha == null || e.beta == null) return;
      if (this._gyroLast) {
        let dAlpha = e.alpha - this._gyroLast.alpha;
        dAlpha = ((dAlpha + 180) % 360 + 360) % 360 - 180; // wrap compass heading to [-180,180]
        const dBeta = e.beta - this._gyroLast.beta;
        this.yaw -= THREE.MathUtils.degToRad(dAlpha);
        this.pitch -= THREE.MathUtils.degToRad(dBeta);
        this._clampPitch();
      }
      this._gyroLast = { alpha: e.alpha, beta: e.beta };
    };
  }

  /** Must be called directly from a user-gesture handler (see note above). */
  async enableGyro() {
    if (this.gyroEnabled) return { ok: true };
    if (!this.gyroSupported) return { ok: false, reason: 'unsupported' };
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') return { ok: false, reason: 'denied' };
      } catch {
        return { ok: false, reason: 'denied' };
      }
    }
    this._gyroLast = null; // next reading only seeds the baseline, no jump
    window.addEventListener('deviceorientation', this._onDeviceOrientation);
    this.gyroEnabled = true;
    return { ok: true };
  }

  /** Leaves this.yaw/this.pitch exactly where they are — no snap. */
  disableGyro() {
    window.removeEventListener('deviceorientation', this._onDeviceOrientation);
    this.gyroEnabled = false;
    this._gyroLast = null;
  }

  /** @returns {Promise<{enabled:boolean, ok:boolean, reason?:string}>} */
  async toggleGyro() {
    if (this.gyroEnabled) { this.disableGyro(); return { enabled: false, ok: true }; }
    const r = await this.enableGyro();
    return { enabled: this.gyroEnabled, ok: r.ok, reason: r.reason };
  }

  // ---- XR controllers ---------------------------------------------
  _initXR() {
    this.controllers = [];
    for (let i = 0; i < 2; i++) {
      const c = this.renderer.xr.getController(i);
      c.userData.i = i;
      c.addEventListener('selectstart', () => this._xrSelect(c));
      // simple ray line
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -5)]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffaa44 }));
      line.scale.z = 5; c.add(line);
      this.rig.add(c);
      this.controllers.push(c);
    }
  }
  _xrSelect(controller) {
    this.tmp.set(0, 0, -1).applyQuaternion(controller.quaternion);
    const origin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
    this.ray.set(origin, this.tmp.normalize());
    this._pick(true);
  }

  // ---- flat select (center reticle / tap) -------------------------
  _flatSelect() {
    this.ray.setFromCamera({ x: 0, y: 0 }, this.camera);
    this._pick(true);
  }

  _pick(commit) {
    const hits = this.ray.intersectObjects(this.getTargets(), true);
    let group = null;
    if (hits.length) { group = hits[0].object; while (group && !group.userData.node) group = group.parent; }
    if (commit && group) this.cb.onSelect?.(group);
    return group;
  }

  // ---- per-frame update -------------------------------------------
  update(dt) {
    if (!this.enabled) return;
    // WASD -> move vector (desktop)
    let fx = 0, fz = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) fz -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) fz += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) fx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) fx += 1;
    fx += this.move.x; fz -= this.move.y;

    // apply look (flat mode only; XR uses headset pose)
    if (!this.renderer.xr.isPresenting) {
      this.rig.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    }

    // move relative to yaw
    const speed = 2.4 * dt;
    if (fx || fz) {
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      this.rig.position.x += (fx * cos + fz * sin) * speed;
      this.rig.position.z += (fz * cos - fx * sin) * speed;
    }

    // hover highlight via center ray (flat) — cheap, once per frame
    if (!isCoarse && !this.renderer.xr.isPresenting && document.pointerLockElement) {
      this.ray.setFromCamera({ x: 0, y: 0 }, this.camera);
      const g = this._pick(false);
      if (g !== this.hovered) {
        this.hovered?.userData.setHover?.(false);
        g?.userData.setHover?.(true);
        this.hovered = g;
        this.cb.onHover?.(g?.userData.node || null);
      }
    }
  }
}

export const IS_MOBILE = isCoarse;
