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
  constructor(starting = CONFIG.ECONOMICS.freeTrialAllowance) {
    super();
    this.name = 'mock-cashu';
    this.balance = starting;
    this.spentTotal = 0;
    this.lastCost = 0;
    this.devWallet = 0; // mock accumulator for the skimmed platform fee
  }

  /** Split a base inference cost into base + platform markup (25% default). */
  quoteInference(baseSats) {
    const platformFee = Math.ceil((baseSats * CONFIG.ECONOMICS.platformFeeBps) / 10000);
    return { base: baseSats, platformFee, total: baseSats + platformFee };
  }

  /** Meter one inference (base cost + platform markup). Fails clean — no
   *  partial spend — if the balance can't cover it. */
  async payInference(baseSats) {
    const quote = this.quoteInference(baseSats);
    if (this.balance < quote.total) {
      this.emit('insufficient', { needed: quote.total, balance: this.balance, reason: 'inference' });
      return { ok: false, ...quote, balance: this.balance };
    }
    await sleep(120);
    this.balance -= quote.total;
    this.spentTotal += quote.total;
    this.devWallet += quote.platformFee;
    this.lastCost = quote.total;
    this.emit('inference', { ...quote, balance: this.balance, spentTotal: this.spentTotal });
    return { ok: true, ...quote, balance: this.balance };
  }

  /** Zap an author (provenance model). */
  async zap(npub, sats = 21) {
    if (this.balance < sats) {
      this.emit('insufficient', { needed: sats, balance: this.balance, reason: 'zap' });
      return { ok: false, balance: this.balance };
    }
    await sleep(120);
    this.balance -= sats;
    this.spentTotal += sats;
    this.emit('zap', { npub, sats, balance: this.balance });
    return { ok: true, zapped: sats, balance: this.balance };
  }

  /** Flat fee to mint the current composition as a provenance UDA. */
  async payProvenanceMint() {
    const fee = CONFIG.ECONOMICS.provenanceMintFee;
    if (this.balance < fee) {
      this.emit('insufficient', { needed: fee, balance: this.balance, reason: 'mint' });
      return { ok: false, needed: fee, balance: this.balance };
    }
    await sleep(200);
    this.balance -= fee;
    this.spentTotal += fee;
    this.emit('mint', { sats: fee, balance: this.balance });
    return { ok: true, paid: fee, balance: this.balance };
  }

  /** Collect a scarce node (ownership model). */
  async collect(asset) {
    const price = asset?.rgb?.priceSats ?? 0;
    if (this.balance < price) {
      this.emit('insufficient', { needed: price, balance: this.balance, reason: 'collect' });
      return { ok: false, needed: price, balance: this.balance };
    }
    await sleep(160);
    this.balance -= price;
    this.spentTotal += price;
    this.emit('collect', { asset, sats: price, balance: this.balance });
    return { ok: true, collected: price, balance: this.balance };
  }

  /** Mock instant top-up — Phase 2 swaps this for a real Lightning invoice,
   *  same balance/insufficient-balance flow either side of the seam. */
  async topUp(sats = CONFIG.ECONOMICS.topUpIncrementSats) {
    await sleep(160);
    this.balance += sats;
    this.emit('topup', { sats, balance: this.balance });
    return { ok: true, topped: sats, balance: this.balance };
  }
}

// Phase-2 stub — same interface.
export class CashuPaymentProvider extends Emitter {
  constructor(backendUrl = CONFIG.BACKEND_URL) { super(); this.name = 'cashu'; this.backendUrl = backendUrl; }
  quoteInference(baseSats) {
    const platformFee = Math.ceil((baseSats * CONFIG.ECONOMICS.platformFeeBps) / 10000);
    return { base: baseSats, platformFee, total: baseSats + platformFee };
  }
  async payInference(baseSats) { /* melt token via backend */ return { ok: true, ...this.quoteInference(baseSats) }; }
  async zap(npub, sats) { /* NIP-57 zap via backend */ return { ok: true, zapped: sats }; }
  async payProvenanceMint() { /* melt token via backend */ return { ok: true, paid: CONFIG.ECONOMICS.provenanceMintFee }; }
  async collect(asset) { /* RGB transfer via backend */ return { ok: true, collected: asset?.rgb?.priceSats }; }
  async topUp(sats) { /* real Lightning invoice via backend */ return { ok: true, topped: sats }; }
}

export function makePaymentProvider() {
  return CONFIG.USE_LIVE_PAYMENTS ? new CashuPaymentProvider() : new MockPaymentProvider();
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
