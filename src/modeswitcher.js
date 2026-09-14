// modeswitcher.js — Screen / VR / AR entry, kept separate from scene logic.
//
// Shows all three controls on every device; greys-out + tooltips the ones this
// device can't do (per the webxr-threejs skill). Rolls its own session request
// so we control the reference space and button styling.

import * as THREE from 'three';

export class ModeSwitcher {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {{onEnter?:Function,onExit?:Function}} hooks
   */
  constructor(renderer, hooks = {}) {
    this.renderer = renderer;
    this.hooks = hooks;
    this.session = null;
    this.el = {
      vr: document.getElementById('mode-vr'),
      ar: document.getElementById('mode-ar'),
      screen: document.getElementById('mode-screen'),
    };
    this._wire();
    this._detect();
    this._wireSessionGranted();
  }

  // Quest Browser (and similar) fire 'sessiongranted' on navigator.xr when
  // arriving from another WebXR site that kept the immersive context alive —
  // permission is already granted, no click needed, so this is the one place
  // it's correct to call _enter() without a user gesture. Feature-detected;
  // browsers that never fire this event see zero behavior change.
  _wireSessionGranted() {
    navigator.xr?.addEventListener('sessiongranted', () => {
      if (this.session) return; // already in a session — nothing to continue into
      this._enter('immersive-vr');
    });
  }

  async _detect() {
    const xr = navigator.xr;
    const vrOk = xr && await safe(() => xr.isSessionSupported('immersive-vr'));
    const arOk = xr && await safe(() => xr.isSessionSupported('immersive-ar'));
    this._setEnabled(this.el.vr, vrOk, 'VR needs a headset browser (Quest) over HTTPS');
    this._setEnabled(this.el.ar, arOk, 'AR needs a passthrough-capable device over HTTPS');
    // Screen mode is always available.
    this.el.screen.classList.add('active');
  }

  _wire() {
    this.el.vr.addEventListener('click', () => this._enter('immersive-vr'));
    this.el.ar.addEventListener('click', () => this._enter('immersive-ar'));
    this.el.screen.addEventListener('click', () => this._exit());
  }

  _setEnabled(btn, ok, tip) {
    if (ok) { btn.classList.remove('disabled'); btn.removeAttribute('title'); }
    else { btn.classList.add('disabled'); btn.title = tip; }
  }

  async _enter(mode) {
    if (this.el[mode === 'immersive-vr' ? 'vr' : 'ar'].classList.contains('disabled')) return;
    const opts = mode === 'immersive-ar'
      ? { requiredFeatures: ['local-floor'], optionalFeatures: ['hit-test', 'dom-overlay'] }
      : { requiredFeatures: ['local-floor'], optionalFeatures: ['bounded-floor'] };
    try {
      const session = await navigator.xr.requestSession(mode, opts);
      this.session = session;
      await this.renderer.xr.setReferenceSpaceType('local-floor');
      await this.renderer.xr.setSession(session);
      document.body.classList.add('in-xr', mode === 'immersive-ar' ? 'in-ar' : 'in-vr');
      this._activate(mode === 'immersive-vr' ? 'vr' : 'ar');
      session.addEventListener('end', () => this._onEnd());
      this.hooks.onEnter?.(mode);
    } catch (err) {
      console.warn('XR entry failed:', err);
    }
  }

  _exit() { this.session?.end(); }

  _onEnd() {
    this.session = null;
    document.body.classList.remove('in-xr', 'in-vr', 'in-ar');
    this._activate('screen');
    this.hooks.onExit?.();
  }

  _activate(which) {
    for (const k of ['vr', 'ar', 'screen']) this.el[k].classList.toggle('active', k === which);
  }
}

async function safe(fn) { try { return await fn(); } catch { return false; } }
