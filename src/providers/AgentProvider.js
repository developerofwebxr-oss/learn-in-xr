// AgentProvider.js — the "brain" seam.
//
// Interface:  search(query) -> Promise<SearchResponse>
//
// Phase 1: MockAgentProvider returns canned SpatialResult[] for a few demo
//   queries and a small metered cost in sats.
// Phase 2: RoutstrAgentProvider posts the query to the Railway backend, which
//   pays Routstr per inference (Cashu/Lightning) and returns the SAME shape.
//
// The renderer calls search() and does not care which one is wired.

import { CONFIG } from '../config.js';
import { CORPUS, decompose, routeIntent } from '../content/bitcoinCorpus.js';

/** @typedef {import('../schema.js').SearchResponse} SearchResponse */

export class MockAgentProvider {
  constructor() { this.name = 'mock-agent'; }

  /**
   * Turn one query into a spatial structure.
   * @param {string} query
   * @returns {Promise<SearchResponse>}
   */
  async search(query) {
    const intent = routeIntent(query);
    // Simulate inference latency so the sats meter "ticks" believably.
    await sleep(280 + Math.random() * 260);

    const results = decompose(query, intent);
    // Mock metering: cost scales with how many panels the agent "generated".
    const costSats = Math.max(1, Math.round(results.length * 0.6));

    return { intent, query, results, costSats };
  }
}

// Phase-2 stub — same interface, hits the secret backend.
export class RoutstrAgentProvider {
  constructor(backendUrl = CONFIG.BACKEND_URL) {
    this.name = 'routstr-agent';
    this.backendUrl = backendUrl;
  }
  /** @returns {Promise<SearchResponse>} */
  async search(query) {
    const r = await fetch(`${this.backendUrl}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, rgbModel: CONFIG.RGB_MODEL }),
    });
    if (!r.ok) throw new Error(`agent ${r.status}`);
    return r.json(); // backend returns SearchResponse
  }
}

export function makeAgentProvider() {
  return CONFIG.USE_LIVE_AGENT ? new RoutstrAgentProvider() : new MockAgentProvider();
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Expose corpus for the asset provider to reuse authored nodes.
export { CORPUS };
