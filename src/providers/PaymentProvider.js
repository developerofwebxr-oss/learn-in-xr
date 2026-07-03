// PaymentProvider.js — the Bitcoin loop seam.
//
// The thesis: every spatial search literally meters inference in sats, and
// authored knowledge can be zapped (provenance) or collected (ownership).
//
// Phase 1: MockPaymentProvider keeps an in-memory Cashu-style balance and
//   emits events the HUD listens to.
// Phase 2: CashuPaymentProvider melts/mints real ecash against the Railway
//   wallet; the client still only ever sees settled results, never a key.

import { CONFIG } from '../config.js';

/** Simple event emitter so the HUD can react without tight coupling. */
class Emitter {
  constructor() { this._l = {}; }
  on(ev, fn) { (this._l[ev] ||= []).push(fn); return this; }
  emit(ev, payload) { (this._l[ev] || []).forEach((fn) => fn(payload)); }
}

export class MockPaymentProvider extends Emitter {
  constructor(starting = CONFIG.STARTING_BALANCE_SATS) {
    super();
    this.name = 'mock-cashu';
    this.balance = starting;
    this.spentTotal = 0;
    this.lastCost = 0;
  }

  /** Meter one inference. Returns the settled cost. */
  async payInference(sats) {
    await sleep(120);
    this.balance -= sats;
    this.spentTotal += sats;
    this.lastCost = sats;
    this.emit('inference', { sats, balance: this.balance, spentTotal: this.spentTotal });
    return { paid: sats, balance: this.balance };
  }

  /** Zap an author (provenance model). */
  async zap(npub, sats = 21) {
    await sleep(120);
    this.balance -= sats;
    this.spentTotal += sats;
    this.emit('zap', { npub, sats, balance: this.balance });
    return { zapped: sats, balance: this.balance };
  }

  /** Collect a scarce node (ownership model). */
  async collect(asset) {
    const price = asset?.rgb?.priceSats ?? 0;
    await sleep(160);
    this.balance -= price;
    this.spentTotal += price;
    this.emit('collect', { asset, sats: price, balance: this.balance });
    return { collected: price, balance: this.balance };
  }
}

// Phase-2 stub — same interface.
export class CashuPaymentProvider extends Emitter {
  constructor(backendUrl = CONFIG.BACKEND_URL) { super(); this.name = 'cashu'; this.backendUrl = backendUrl; }
  async payInference(sats) { /* melt token via backend */ return { paid: sats }; }
  async zap(npub, sats) { /* NIP-57 zap via backend */ return { zapped: sats }; }
  async collect(asset) { /* RGB transfer via backend */ return { collected: asset?.rgb?.priceSats }; }
}

export function makePaymentProvider() {
  return CONFIG.USE_LIVE_PAYMENTS ? new CashuPaymentProvider() : new MockPaymentProvider();
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
