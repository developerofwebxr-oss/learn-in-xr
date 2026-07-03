// hud.js — CSS-overlay HUD (zero Three.js cost, crisp at any resolution).
//
// Owns: the search box, the sats meter ("this search: N sats" + balance),
// breadcrumbs, the RGB model toggle, and the mint/zap/collect action bar.
// It talks to the app via callbacks passed in bind(); it holds no scene state.

import { CONFIG } from './config.js';

export class HUD {
  constructor() {
    this.el = {
      search:   document.getElementById('search'),
      form:     document.getElementById('search-form'),
      balance:  document.getElementById('balance'),
      lastCost: document.getElementById('last-cost'),
      intent:   document.getElementById('intent'),
      crumbs:   document.getElementById('crumbs'),
      back:     document.getElementById('back-btn'),
      rgbToggle:document.getElementById('rgb-toggle'),
      action:   document.getElementById('action-bar'),
      selTitle: document.getElementById('sel-title'),
      actBtn:   document.getElementById('act-btn'),
      mintBtn:  document.getElementById('mint-btn'),
      toast:    document.getElementById('toast'),
    };
    this.el.rgbToggle.textContent = `RGB: ${CONFIG.RGB_MODEL}`;
  }

  bind({ onSearch, onBack, onRgbToggle, onAction, onMint }) {
    this.el.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = this.el.search.value.trim();
      if (q) onSearch(q);
      this.el.search.blur();
    });
    this.el.back.addEventListener('click', () => onBack());
    this.el.rgbToggle.addEventListener('click', () => onRgbToggle());
    this.el.actBtn.addEventListener('click', () => onAction());
    this.el.mintBtn.addEventListener('click', () => onMint());
  }

  setBalance(sats) { this.el.balance.textContent = fmt(sats); }
  setLastCost(sats) {
    this.el.lastCost.textContent = `this search: ${sats} sat${sats === 1 ? '' : 's'}`;
    this.el.lastCost.classList.remove('pulse'); void this.el.lastCost.offsetWidth;
    this.el.lastCost.classList.add('pulse');
  }
  setIntent(intent) {
    this.el.intent.textContent = intent === 'shopping' ? '🛍️ shopping' : '📚 learning';
  }
  setRgbLabel(model) { this.el.rgbToggle.textContent = `RGB: ${model}`; }

  setCrumbs(crumbs) {
    this.el.crumbs.innerHTML = crumbs
      .map((c, i) => `<span class="${i === crumbs.length - 1 ? 'here' : ''}">${esc(c.title)}</span>`)
      .join('<span class="sep">›</span>');
    this.el.back.style.visibility = crumbs.length > 1 ? 'visible' : 'hidden';
  }

  /** Show the action bar for a selected panel. */
  showAction(node) {
    if (!node) { this.el.action.classList.remove('show'); return; }
    this.el.selTitle.textContent = node.title;
    let label = null;
    if (node.rgb) {
      label = node.rgb.model === 'ownership'
        ? `Collect · ${fmt(node.rgb.priceSats)} sats`
        : `⚡ Zap author · 21 sats`;
    } else if (node.kind === 'product' && node.priceSats) {
      label = `Buy · ${fmt(node.priceSats)} sats`;
    }
    if (label) { this.el.actBtn.textContent = label; this.el.actBtn.style.display = ''; }
    else this.el.actBtn.style.display = 'none';
    this.el.action.classList.add('show');
  }

  toast(msg) {
    this.el.toast.textContent = msg;
    this.el.toast.classList.add('show');
    clearTimeout(this._t);
    this._t = setTimeout(() => this.el.toast.classList.remove('show'), 2200);
  }
}

const fmt = (n) => (n ?? 0).toLocaleString('en-US');
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
