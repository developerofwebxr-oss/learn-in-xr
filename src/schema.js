// schema.js — the ONE normalized shape the renderer consumes.
//
// The agent (real or mock), the search proxy, and the RGB asset store all
// emit this same shape. The renderer is the *only* consumer and never knows
// whether a node came from a mock, from Routstr, or from an RGB contract.
//
// This seam is the whole reason the build is swappable.

/**
 * @typedef {Object} RgbAsset
 * RGB smart-contract metadata attached to a node. Present only when a node
 * is community-authored / minted. `model` mirrors CONFIG.RGB_MODEL.
 * @property {'provenance'|'ownership'} model
 * @property {string} contractId   RGB contract id (mock: "rgb:..." string)
 * @property {string} schema       "UDA" | "CFA" | "collection"
 * @property {string} authorNpub   Nostr pubkey of the author/minter
 * @property {string} authorName   Human label for the author
 * @property {number} [supply]     1 for a UDA (ownership model)
 * @property {number} [priceSats]  collect price (ownership model only)
 * @property {string} [ownerNpub]  current owner (ownership model only)
 * @property {number} [zaps]       accumulated zaps in sats (provenance)
 * @property {boolean} verified    signature/consignment validated
 */

/**
 * @typedef {Object} SpatialResult
 * The unit the renderer draws. relevance -> distance/size,
 * category -> angular sector, children -> drill-down seeds.
 * @property {string} id
 * @property {'concept'|'product'|'source'} kind
 * @property {string} title
 * @property {string} body          short readable snippet
 * @property {string} [image]       optional image URL (CORS-safe / proxied)
 * @property {string} [emoji]       lightweight glyph used when no image
 * @property {number} [priceSats]   shopping intent only
 * @property {string} [link]        external reference
 * @property {number} relevance     0..1  -> nearer + larger when higher
 * @property {string} category      sector key, e.g. "core" | "layer2" | ...
 * @property {string[]} [children]  seed ids/queries for recursive drill-down
 * @property {RgbAsset} [rgb]       set when this node is an RGB asset
 */

/**
 * @typedef {Object} SearchResponse
 * @property {'learning'|'shopping'} intent   routed layout
 * @property {string} query
 * @property {SpatialResult[]} results
 * @property {number} costSats     inference cost metered for THIS search
 */

// Sector -> angular offset (degrees, relative to arc centre) and a theme
// colour. Categories keep related concepts clustered in space.
export const SECTORS = {
  core:    { label: 'Core',        hue: 0.10, order: 0 }, // orange
  layer2:  { label: 'Layer 2',     hue: 0.55, order: 1 }, // cyan
  crypto:  { label: 'Cryptography', hue: 0.75, order: 2 }, // violet
  economy: { label: 'Money',       hue: 0.33, order: 3 }, // green
  social:  { label: 'Social',      hue: 0.90, order: 4 }, // pink
  contracts:{ label: 'Contracts',  hue: 0.13, order: 5 }, // amber
};

// Nothing to instantiate — this module is types + the sector table.
export const SCHEMA_VERSION = 1;
