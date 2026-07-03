// config.js — single source of truth for feature flags and endpoints.
// Nothing secret lives here. The client is static (GitHub Pages).
// Secrets (Cashu wallet, Routstr key, RGB Lightning node) live on the
// backend and are only reached via BACKEND_URL. See README "Architecture".

export const CONFIG = {
  // ---- RGB smart-contract model --------------------------------------
  // "provenance": knowledge stays freely readable; the RGB UDA proves
  //   authorship/credit (wiki-native). Panels show "minted by <npub>",
  //   are zappable, and never gate reading.
  // "ownership":  knowledge nodes are scarce, owned, collectible UDAs.
  //   Panels show a "collect for N sats" action and a scarcity badge.
  // Both models run through the SAME AssetProvider seam and renderer.
  // Flip this at runtime with the HUD toggle or ?rgb=ownership.
  RGB_MODEL: 'provenance',

  // ---- Live vs mock ---------------------------------------------------
  // Phase 1 (this build) is fully mock. Phase 2 swaps these to true and
  // points BACKEND_URL at Railway; the renderer never changes.
  USE_LIVE_AGENT: false,   // Routstr pay-per-inference
  USE_LIVE_PAYMENTS: false, // Cashu / Lightning
  USE_LIVE_RGB: false,     // rgb-lib-wasm + RGB Lightning node

  // Public backend URL (Railway). Client never holds a secret; it only
  // ever receives normalized SpatialResult[] and settled payment tokens.
  BACKEND_URL: '', // e.g. 'https://learn-in-xr.up.railway.app'

  // ---- Economics (modeled entirely in MockPaymentProvider; Phase 3 swaps
  // real Cashu/Routstr behind these same numbers — callers untouched) ----
  ECONOMICS: {
    freeTrialAllowance: 30,        // dev-sponsored sats seeded for a new visitor
    platformFeeBps: 2500,          // 25% markup on inference, shown on the HUD
    provenanceMintFee: 21,         // sats to mint a composition (provenance model)
    ownershipRegistrationFee: 210, // higher than mint; defined for the ownership
                                    // model but deferred/unused this phase
    topUpIncrementSats: 500,       // mock instant top-up (Phase 2: real invoice)
  },
  DEFAULT_TOPIC: 'Bitcoin',

  // ---- Layout ---------------------------------------------------------
  ARC_RADIUS: 3.2,        // metres from user to the primary panel arc
  ARC_SPREAD_DEG: 130,    // comfortable field, readable without spinning
  PANEL_EYE_HEIGHT: 1.6,  // flat-mode camera height (VR/AR uses headset)
};

// Allow ?rgb=ownership / ?rgb=provenance to override for quick demoing.
const q = new URLSearchParams(location.search);
if (q.get('rgb') === 'ownership' || q.get('rgb') === 'provenance') {
  CONFIG.RGB_MODEL = q.get('rgb');
}
