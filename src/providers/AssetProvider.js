// AssetProvider.js — the RGB smart-contract seam.
//
// RGB = client-side-validated smart contracts on Bitcoin. Two models, one
// seam (see config.RGB_MODEL):
//   provenance -> UDA proves authorship, knowledge freely readable, zappable
//   ownership  -> UDA is a scarce collectible with a sats price + owner
//
// Phase 1: MockAssetProvider serves a small store of community-authored nodes
//   and can "mint" the current constellation as a new UDA (in memory).
// Phase 2: RgbWasmAssetProvider runs @utexo/rgb-sdk-web (rgb-lib-wasm) in a
//   Worker for validation, persists to IndexedDB, and issues/transfers via the
//   Railway RGB-Lightning node. Renderer is untouched.

import { CONFIG } from '../config.js';
import { AUTHORED_NODES } from '../content/techCorpus.js';

let mintCounter = 100;

export class MockAssetProvider {
  constructor() { this.name = 'mock-rgb'; }

  /** Return the RGB metadata a node should carry for the active model. */
  decorate(node) {
    const seed = AUTHORED_NODES[node.id];
    if (!seed) return node; // not a community-authored node
    const base = {
      contractId: seed.contractId,
      schema: 'UDA',
      authorNpub: seed.authorNpub,
      authorName: seed.authorName,
      verified: true,
      model: CONFIG.RGB_MODEL,
    };
    const rgb = CONFIG.RGB_MODEL === 'ownership'
      ? { ...base, supply: 1, priceSats: seed.priceSats ?? 500, ownerNpub: seed.ownerNpub ?? seed.authorNpub }
      : { ...base, zaps: seed.zaps ?? 0 };
    return { ...node, rgb };
  }

  /** Apply decorate() across a whole result set. */
  decorateAll(results) { return results.map((n) => this.decorate(n)); }

  /**
   * Mint the current spatial arrangement as a new UDA (mock).
   * In provenance mode this credits authorship; in ownership mode it also
   * sets a price so others can collect it.
   * @param {{title:string, childIds:string[]}} structure
   * @param {string} authorNpub
   */
  async mintStructure(structure, authorNpub) {
    await sleep(240); // stands in for WASM validation on a worker
    const id = `rgb:mock:${++mintCounter}`;
    return {
      contractId: id,
      schema: 'collection',
      title: structure.title,
      members: structure.childIds,
      authorNpub,
      model: CONFIG.RGB_MODEL,
      priceSats: CONFIG.RGB_MODEL === 'ownership' ? 1000 : undefined,
      verified: true,
      mintedAt: Date.now(),
    };
  }

  /**
   * OWNERSHIP = deferred. Discrete scarce things (mini-apps, imported 3D
   * objects) will register as owned/tradeable UDAs for
   * CONFIG.ECONOMICS.ownershipRegistrationFee sats — the capability and its
   * fee are defined so the seam exists, but minting/trading is not built or
   * reachable from the UI this phase.
   */
  async registerOwnership() {
    throw new Error('ownership registration is deferred — not available in Phase 1');
  }
}

// Phase-2 stub — same interface, real RGB.
export class RgbWasmAssetProvider {
  constructor() { this.name = 'rgb-wasm'; /* init worker + IndexedDB */ }
  decorate(node) { return node; }
  decorateAll(r) { return r; }
  async mintStructure() { /* issue UDA via rgb-lib-wasm + backend node */ }
}

export function makeAssetProvider() {
  return CONFIG.USE_LIVE_RGB ? new RgbWasmAssetProvider() : new MockAssetProvider();
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
