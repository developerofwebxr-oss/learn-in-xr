// bitcoinCorpus.js — the canned "knowledge" the mock agent decomposes.
//
// This stands in for what Routstr generation returns in Phase 2. Each node is
// a SpatialResult; `children` are seed ids the drill-down expands recursively.
//
// A few nodes are ALSO listed in AUTHORED_NODES to demonstrate the RGB layer:
// community-authored knowledge carrying verifiable provenance.

/** @typedef {import('../schema.js').SpatialResult} SpatialResult */

// Every node keyed by id so drill-down can resolve children by id.
/** @type {Record<string, SpatialResult>} */
export const CORPUS = {
  // ---- Root facets of "Bitcoin" -------------------------------------
  'what-is': {
    id: 'what-is', kind: 'concept', category: 'core', relevance: 0.98,
    emoji: '₿', title: 'What Is Bitcoin?',
    body: 'A decentralized digital money with a fixed supply of 21M, secured by proof-of-work and run by a global network of nodes — no central issuer.',
    children: ['fixed-supply', 'nodes', 'history'],
  },
  'blockchain': {
    id: 'blockchain', kind: 'concept', category: 'core', relevance: 0.9,
    emoji: '⛓️', title: 'The Blockchain',
    body: 'An append-only chain of blocks. Each block links to the previous by hash, so rewriting history means redoing all the work since — practically impossible.',
    children: ['blocks', 'hashing', 'utxo'],
  },
  'mining': {
    id: 'mining', kind: 'concept', category: 'core', relevance: 0.82,
    emoji: '⛏️', title: 'Mining & Proof-of-Work',
    body: 'Miners spend energy guessing a hash below a target. The winner adds the next block and earns the subsidy + fees. Difficulty retargets every 2016 blocks.',
    children: ['difficulty', 'halving', 'fees'],
  },
  'keys': {
    id: 'keys', kind: 'concept', category: 'crypto', relevance: 0.86,
    emoji: '🔑', title: 'Keys & Wallets',
    body: 'Ownership is a private key. Your public key derives addresses; signatures prove you can spend without revealing the key. "Not your keys, not your coins."',
    children: ['seed-phrase', 'signatures', 'self-custody'],
  },
  'lightning': {
    id: 'lightning', kind: 'concept', category: 'layer2', relevance: 0.92,
    emoji: '⚡', title: 'The Lightning Network',
    body: 'A layer-2 of payment channels. Move sats instantly and cheaply off-chain, settling to the base chain only when a channel opens or closes.',
    children: ['channels', 'routing', 'watchtowers'],
  },
  'cashu': {
    id: 'cashu', kind: 'concept', category: 'layer2', relevance: 0.78,
    emoji: '🥜', title: 'Cashu & Ecash',
    body: 'Chaumian ecash backed by Lightning. A mint issues blinded tokens: near-instant, private, bearer sats. This is how per-inference agent payments settle here.',
    children: ['blinding', 'mints', 'bearer-tokens'],
  },
  'rgb': {
    id: 'rgb', kind: 'concept', category: 'contracts', relevance: 0.8,
    emoji: '📜', title: 'RGB Smart Contracts',
    body: 'Client-side-validated smart contracts on Bitcoin & Lightning. State lives off-chain in consignments; Bitcoin only anchors commitments. Enables tokens & unique digital assets (UDAs).',
    children: ['client-side-validation', 'uda', 'rgb-lightning'],
  },
  'nostr': {
    id: 'nostr', kind: 'concept', category: 'social', relevance: 0.72,
    emoji: '🦩', title: 'Nostr & Zaps',
    body: 'A simple relay-based protocol for identity (npub) and notes. "Zaps" are Lightning tips attached to posts — the social layer that credits authors here.',
    children: ['npub', 'relays', 'zaps'],
  },
  'sound-money': {
    id: 'sound-money', kind: 'concept', category: 'economy', relevance: 0.76,
    emoji: '🪙', title: 'Sound Money',
    body: 'Bitcoin\'s monetary policy is fixed and predictable: issuance halves every ~4 years toward 21M. No discretionary inflation — scarcity by consensus.',
    children: ['halving', 'inflation', '21-million'],
  },

  // ---- Second level (drill-down targets) ----------------------------
  'fixed-supply': mk('fixed-supply', 'core', '🔒', 'Fixed 21M Supply', 'The cap is enforced by every node. New issuance falls geometrically and stops around the year 2140.'),
  'nodes': mk('nodes', 'core', '🖥️', 'Full Nodes', 'Anyone can run a node to independently verify every rule. Consensus is enforced by users, not miners.'),
  'history': mk('history', 'core', '📰', 'Origins (2008–09)', 'Satoshi\'s whitepaper (Oct 2008) and genesis block (Jan 2009), stamped with a headline about bank bailouts.'),
  'blocks': mk('blocks', 'core', '🧱', 'Blocks', 'A batch of transactions plus a header. ~10-minute target spacing, adjusted by difficulty.'),
  'hashing': mk('hashing', 'crypto', '#️⃣', 'Hashing (SHA-256)', 'A one-way fingerprint. Tiny input changes scramble the output — the glue that chains blocks together.'),
  'utxo': mk('utxo', 'core', '🧾', 'UTXOs', 'Unspent Transaction Outputs — Bitcoin tracks coins as discrete outputs, not account balances.'),
  'difficulty': mk('difficulty', 'core', '🎯', 'Difficulty Retarget', 'Every 2016 blocks the network tunes the target so blocks keep arriving ~every 10 minutes.'),
  'halving': mk('halving', 'economy', '✂️', 'The Halving', 'Every 210,000 blocks the block subsidy halves — the heartbeat of Bitcoin\'s disinflation.'),
  'fees': mk('fees', 'core', '💸', 'Transaction Fees', 'A fee market prioritizes transactions and, over time, replaces the shrinking subsidy.'),
  'seed-phrase': mk('seed-phrase', 'crypto', '🌱', 'Seed Phrase', '12–24 words that deterministically regenerate all your keys. Guard it; it IS the wallet.'),
  'signatures': mk('signatures', 'crypto', '✍️', 'Digital Signatures', 'Prove authorization to spend without exposing the private key. Schnorr enables aggregation.'),
  'self-custody': mk('self-custody', 'crypto', '🛡️', 'Self-Custody', 'Holding your own keys removes counterparty risk — and puts responsibility on you.'),
  'channels': mk('channels', 'layer2', '🔀', 'Payment Channels', 'A shared 2-of-2 balance updated off-chain. Only opening/closing touches the base chain.'),
  'routing': mk('routing', 'layer2', '🗺️', 'Routing', 'Payments hop across connected channels; nodes forward for a small fee, like packets on a network.'),
  'watchtowers': mk('watchtowers', 'layer2', '🗼', 'Watchtowers', 'Third parties that watch for channel cheating while you\'re offline and punish it automatically.'),
  'blinding': mk('blinding', 'crypto', '🕶️', 'Blind Signatures', 'The mint signs a token it can\'t link back to you — the privacy trick under Chaumian ecash.'),
  'mints': mk('mints', 'layer2', '🏦', 'Ecash Mints', 'Custodial-ish issuers that swap Lightning sats for bearer tokens and back again.'),
  'bearer-tokens': mk('bearer-tokens', 'layer2', '🎫', 'Bearer Tokens', 'Whoever holds the token holds the sats — like digital cash, redeemable at the mint.'),
  'client-side-validation': mk('client-side-validation', 'contracts', '🧮', 'Client-Side Validation', 'Only parties to a contract validate its history off-chain; Bitcoin just anchors commitments. Huge scalability + privacy.'),
  'uda': mk('uda', 'contracts', '💎', 'Unique Digital Assets', 'RGB\'s one-of-one schema. The primitive behind "a knowledge node minted by a person."'),
  'rgb-lightning': mk('rgb-lightning', 'contracts', '⚡', 'RGB over Lightning', 'RGB assets can move inside Lightning channels via an LDK-based node — fast, cheap asset transfer.'),
  'npub': mk('npub', 'social', '🆔', 'npub Identity', 'A public key IS your identity on Nostr. Portable across every relay and client.'),
  'relays': mk('relays', 'social', '📡', 'Relays', 'Dumb servers that store and forward notes. Clients read/write to many at once — no central host.'),
  'zaps': mk('zaps', 'social', '⚡', 'Zaps', 'Lightning micro-tips on content. Here they credit the authors of RGB knowledge nodes.'),
  'inflation': mk('inflation', 'economy', '📉', 'Disinflation', 'Bitcoin\'s issuance rate only falls. Contrast with discretionary fiat expansion.'),
  '21-million': mk('21-million', 'economy', '2️⃣', '21 Million', 'The asymptotic cap. Divisible to 100M sats each, so 21M is plenty of units.'),

  // ---- Shopping intent demo (the crowd-pleaser) ---------------------
  'shoe-1': { id: 'shoe-1', kind: 'product', category: 'core', relevance: 0.9, emoji: '👟', title: 'Prada Runner', body: 'Re-Nylon low-top. Ships worldwide.', priceSats: 812000, link: '#' },
  'shoe-2': { id: 'shoe-2', kind: 'product', category: 'layer2', relevance: 0.8, emoji: '👞', title: 'Prada Monolith', body: 'Brushed leather loafer.', priceSats: 1140000, link: '#' },
  'shoe-3': { id: 'shoe-3', kind: 'product', category: 'crypto', relevance: 0.72, emoji: '🥿', title: 'Prada Ballet', body: 'Satin flat, spring line.', priceSats: 690000, link: '#' },
  'shoe-4': { id: 'shoe-4', kind: 'product', category: 'economy', relevance: 0.66, emoji: '🩰', title: 'Prada Sport', body: 'Foam trainer, unisex.', priceSats: 540000, link: '#' },
};

// Community-authored RGB nodes: id -> authorship seed. The AssetProvider reads
// this to decorate matching CORPUS nodes with provenance/ownership metadata.
export const AUTHORED_NODES = {
  'lightning':   { contractId: 'rgb:1a2b…ln', authorNpub: 'npub1qz…hodl', authorName: 'stacker.sats', zaps: 3021, priceSats: 800, ownerNpub: 'npub1qz…hodl' },
  'rgb':         { contractId: 'rgb:9f8e…rgb', authorNpub: 'npub1rg…bcon', authorName: 'contract.dev', zaps: 1470, priceSats: 1500, ownerNpub: 'npub1rg…bcon' },
  'cashu':       { contractId: 'rgb:44c…nut',  authorNpub: 'npub1ec…cash', authorName: 'nutsack',       zaps: 921,  priceSats: 600 },
  'sound-money': { contractId: 'rgb:77a…21m',  authorNpub: 'npub1au…strn', authorName: 'austrian.btc',  zaps: 2555, priceSats: 2100 },
};

// ---- Intent routing + decomposition (mock "agent" logic) ------------

/** Very small keyword router. Real version = Routstr intent classification. */
export function routeIntent(query) {
  const q = (query || '').toLowerCase();
  const shoppingHints = ['buy', 'price', 'shoes', 'prada', 'shop', 'sneaker', 'cheap', 'order'];
  return shoppingHints.some((h) => q.includes(h)) ? 'shopping' : 'learning';
}

/**
 * Turn a query into a SpatialResult[]. Learning -> topical facet set;
 * Shopping -> product grid. Both come straight from CORPUS.
 * @returns {SpatialResult[]}
 */
export function decompose(query, intent) {
  if (intent === 'shopping') {
    return ['shoe-1', 'shoe-2', 'shoe-3', 'shoe-4'].map((id) => CORPUS[id]);
  }
  const q = (query || '').toLowerCase();
  // If the query names a specific facet, surface its children as the constellation.
  const direct = Object.values(CORPUS).find(
    (n) => n.kind === 'concept' && q.includes(n.title.toLowerCase().replace(/[^a-z ]/g, '').trim())
  );
  if (direct && direct.children?.length) {
    return direct.children.map((id) => CORPUS[id]).filter(Boolean);
  }
  // Default: the top-level Bitcoin constellation.
  return ['what-is', 'blockchain', 'mining', 'keys', 'lightning', 'cashu', 'rgb', 'nostr', 'sound-money']
    .map((id) => CORPUS[id]);
}

/** Resolve child seeds (ids) into SpatialResult[] for drill-down. */
export function expandChildren(ids = []) {
  return ids.map((id) => CORPUS[id]).filter(Boolean);
}

// tiny helper to keep the corpus readable
function mk(id, category, emoji, title, body) {
  return { id, kind: 'concept', category, relevance: 0.6, emoji, title, body, children: [] };
}
