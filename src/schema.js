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
 * @property {string} category      sector key, e.g. "rendering" | "immersion" | ...
 * @property {string[]} [children]  seed ids/queries for recursive drill-down
 * @property {RgbAsset} [rgb]       set when this node is an RGB asset (economics demo only)
 * @property {{label:string,url:string}[]} [links]  1-2 real official sources
 * @property {'STANDARD'|'SHIPPING'|'MATURING'|'EXPERIMENTAL'} [maturity]  honest support level
 */

/**
 * @typedef {Object} SearchResponse
 * @property {'learning'|'shopping'} intent   routed layout
 * @property {string} query
 * @property {SpatialResult[]} results
 * @property {number} costSats     inference cost metered for THIS search
 * @property {string} [note]       shown on the HUD when the query didn't map
 *   to anything and the mock agent fell back to the nearest cluster
 */

// Sector -> angular offset (degrees, relative to arc centre) and a theme
// colour. Categories keep related concepts clustered in space. These are the
// 8 clusters of "the tech behind the spatial web" — see content/techCorpus.js.
export const SECTORS = {
  rendering: { label: 'Rendering',          hue: 0.06, order: 0 }, // orange
  immersion: { label: 'Immersion',          hue: 0.55, order: 1 }, // cyan
  realtime:  { label: 'Real-time',          hue: 0.80, order: 2 }, // violet
  platform:  { label: 'Platform Primitives',hue: 0.62, order: 3 }, // blue
  physics:   { label: 'Physics & Simulation', hue: 0.35, order: 4 }, // green
  identity:  { label: 'Identity & Social',  hue: 0.90, order: 5 }, // pink
  value:     { label: 'Value & Open Money', hue: 0.13, order: 6 }, // amber
  why:       { label: 'The Why',            hue: 0.0,  order: 7 }, // red
};

// Nothing to instantiate — this module is types + the sector table.
export const SCHEMA_VERSION = 1;
