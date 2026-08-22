// techCorpus.js — the canned "knowledge" the mock agent decomposes.
//
// This stands in for what Routstr generation returns in Phase 2. Each node is
// a SpatialResult; `children` are seed ids the drill-down expands recursively.
//
// Content is a curated corpus of the tech behind the spatial web, grouped into
// 8 clusters (see schema.js SECTORS). Links are real official sources only
// (MDN, W3C/immersive-web, project sites) — never invented. Maturity tags are
// an honest snapshot as of Aug 2026, not a guarantee.
//
// A couple of nodes are ALSO listed in AUTHORED_NODES to demonstrate the RGB
// layer (community-authored knowledge carrying verifiable provenance) — that
// layer is off by default; see config.js SHOW_ECONOMICS_UI.

/** @typedef {import('../schema.js').SpatialResult} SpatialResult */

export const CLUSTER_IDS = ['rendering', 'immersion', 'realtime', 'platform', 'physics', 'identity', 'value', 'why'];

/** Every node keyed by id so drill-down can resolve children by id. */
/** @type {Record<string, SpatialResult>} */
export const CORPUS = {
  // ==== Rendering ======================================================
  rendering: {
    id: 'rendering', kind: 'concept', category: 'rendering', relevance: 0.95,
    emoji: '🎨', title: 'Rendering',
    body: "How pixels actually get drawn in a spatial-web scene — the GPU APIs and engines that turn geometry and shaders into the constellation you're standing inside right now.",
    children: ['webgpu', 'webgl', 'threejs', 'babylonjs', 'aframe', 'shaders', 'gltf'],
  },
  webgpu: leaf('webgpu', 'rendering', '⚙️', 'WebGPU',
    "A modern, low-overhead GPU API for the web — direct access to compute and graphics pipelines, successor to WebGL. It's what lets browser-based 3D scenes approach native-app performance.",
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API' }, { label: 'W3C spec', url: 'https://www.w3.org/TR/webgpu/' }], 'SHIPPING'),
  webgl: leaf('webgl', 'rendering', '🖼️', 'WebGL',
    "The original browser 3D API, built on OpenGL ES. It's been in every major browser for over a decade and still powers most production WebXR today, even as WebGPU takes over the leading edge.",
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API' }], 'SHIPPING'),
  threejs: leaf('threejs', 'rendering', '🌲', 'Three.js',
    'The most widely used 3D library for the web — wraps WebGL/WebGPU behind a friendly scene graph. This project is literally built on it (see the import map in index.html).',
    [{ label: 'threejs.org', url: 'https://threejs.org/' }], 'SHIPPING'),
  babylonjs: leaf('babylonjs', 'rendering', '🅱️', 'Babylon.js',
    'A full-featured 3D engine with a heavier built-in toolset than Three.js — physics, a node-material editor, a browser-based playground IDE. Popular for product configurators and browser games.',
    [{ label: 'babylonjs.com', url: 'https://www.babylonjs.com/' }], 'SHIPPING'),
  aframe: leaf('aframe', 'rendering', '🅰️', 'A-Frame',
    'A declarative, HTML-like layer over Three.js for building WebXR scenes with custom tags instead of imperative code. Great for fast prototypes; a smaller, slower-moving ecosystem than Three.js or Babylon.',
    [{ label: 'aframe.io', url: 'https://aframe.io/' }], 'MATURING'),
  shaders: leaf('shaders', 'rendering', '✨', 'Shaders: GLSL → WGSL',
    'Shaders are the small GPU programs that decide what every pixel looks like. WebGL uses GLSL; WebGPU introduces its own language, WGSL — the ecosystem is mid-migration between the two.',
    [{ label: 'WGSL spec', url: 'https://www.w3.org/TR/WGSL/' }, { label: 'MDN GLSL', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_shaders_to_apply_color_in_WebGL' }], 'MATURING'),
  gltf: leaf('gltf', 'rendering', '📦', 'glTF / GLB',
    'The Khronos-ratified "JPEG of 3D" — a compact, standard interchange format for models, materials, and animations. Nearly every web 3D engine imports it directly.',
    [{ label: 'Khronos glTF', url: 'https://www.khronos.org/gltf/' }], 'STANDARD'),

  // ==== Immersion =======================================================
  immersion: {
    id: 'immersion', kind: 'concept', category: 'immersion', relevance: 0.92,
    emoji: '🥽', title: 'Immersion',
    body: "The APIs that get a browser INTO a headset or a phone's camera view — session management, tracking, and the sensing modules that make a scene feel like a place.",
    children: ['webxr-device-api', 'xr-modes', 'hand-tracking', 'hit-test', 'anchors', 'depth-sensing', 'openxr'],
  },
  'webxr-device-api': leaf('webxr-device-api', 'immersion', '🎮', 'WebXR Device API',
    "The core browser API for requesting an immersive session, reading headset/controller poses, and rendering stereo frames. Every mode in this app's mode switcher runs through it.",
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API' }, { label: 'W3C spec', url: 'https://www.w3.org/TR/webxr/' }], 'STANDARD'),
  'xr-modes': leaf('xr-modes', 'immersion', '🌗', 'VR / AR / Passthrough Modes',
    "One WebXR session can request 'immersive-vr' or 'immersive-ar'; passthrough blends live camera video with rendered content. Support and quality vary a lot by device.",
    [{ label: 'immersiveweb.dev', url: 'https://immersiveweb.dev/' }], 'MATURING'),
  'hand-tracking': leaf('hand-tracking', 'immersion', '✋', 'Hand Tracking',
    'Skeletal hand-joint poses delivered straight into WebXR input sources — no controller needed. Well supported on Quest\'s browser; patchier elsewhere.',
    [{ label: 'W3C module', url: 'https://www.w3.org/TR/webxr-hand-input-1/' }], 'MATURING'),
  'hit-test': leaf('hit-test', 'immersion', '🎯', 'Hit-Test',
    'Casts a ray into the real world and returns where it hits a detected surface — the basis of "tap to place an object on the floor" AR interactions.',
    [{ label: 'W3C module', url: 'https://www.w3.org/TR/webxr-hit-test-1/' }], 'MATURING'),
  anchors: leaf('anchors', 'immersion', '📌', 'Anchors',
    'Lets an app pin a virtual object to a real-world point so it stays put as tracking recalculates. Narrower device support than hit-test.',
    [{ label: 'W3C module', url: 'https://www.w3.org/TR/webxr-anchors-module-1/' }], 'EXPERIMENTAL'),
  'depth-sensing': leaf('depth-sensing', 'immersion', '🌊', 'Depth Sensing',
    'Exposes a live per-pixel depth map of the real world, enabling real occlusion — virtual content correctly hiding behind your couch. Still an early, unevenly supported module.',
    [{ label: 'W3C module', url: 'https://www.w3.org/TR/webxr-depth-sensing-1/' }], 'EXPERIMENTAL'),
  openxr: leaf('openxr', 'immersion', '🔧', 'OpenXR',
    'The native, cross-platform XR API that browser engines build their WebXR implementation on top of. You never call it directly from the web, but it\'s the plumbing underneath every headset runtime.',
    [{ label: 'Khronos OpenXR', url: 'https://www.khronos.org/openxr/' }], 'STANDARD'),

  // ==== Real-time =======================================================
  realtime: {
    id: 'realtime', kind: 'concept', category: 'realtime', relevance: 0.88,
    emoji: '📡', title: 'Real-time',
    body: 'How a spatial scene stays in sync with other people and live data — the transport layer under multiplayer, voice, and live updates.',
    children: ['websockets', 'webtransport', 'webrtc', 'livekit'],
  },
  websockets: leaf('websockets', 'realtime', '🔌', 'WebSockets',
    'A persistent, full-duplex TCP connection between browser and server. The oldest and simplest way to push real-time updates — still the default choice for most multiplayer state sync.',
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API' }], 'SHIPPING'),
  webtransport: leaf('webtransport', 'realtime', '🚚', 'WebTransport',
    'A newer, UDP-based transport (over HTTP/3/QUIC) offering lower-latency, unreliable-ok delivery — a better fit for fast-moving XR state than TCP. Shipping in Chrome/Edge; Safari support is the main gap.',
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API' }], 'SHIPPING'),
  webrtc: leaf('webrtc', 'realtime', '📹', 'WebRTC',
    'Peer-to-peer audio, video, and data channels directly between browsers. Powers voice chat and low-latency data in most multiplayer XR apps, usually via a relay/SFU rather than true mesh.',
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API' }], 'SHIPPING'),
  livekit: leaf('livekit', 'realtime', '🛰️', 'LiveKit & the SFU Model',
    'An open-source Selective Forwarding Unit built on WebRTC: each client sends one stream to a server, which forwards it to everyone else, instead of every client connecting to every other client. What most production multiplayer voice/video actually runs on.',
    [{ label: 'livekit.io', url: 'https://livekit.io/' }], 'SHIPPING'),

  // ==== Platform primitives =============================================
  platform: {
    id: 'platform', kind: 'concept', category: 'platform', relevance: 0.85,
    emoji: '🧩', title: 'Platform Primitives',
    body: 'The lower-level browser capabilities a spatial-web app leans on for performance and reach — running real code fast, offline, and off the main thread.',
    children: ['wasm', 'workers', 'webgpu-compute', 'pwa', 'web-audio', 'gamepad', 'webcodecs', 'es-modules'],
  },
  wasm: leaf('wasm', 'platform', '🧱', 'WebAssembly',
    'A compact, near-native-speed bytecode target the browser can run — lets languages like Rust or C++ (e.g. a physics engine) run inside a web page at real speed.',
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly' }, { label: 'webassembly.org', url: 'https://webassembly.org/' }], 'STANDARD'),
  workers: leaf('workers', 'platform', '👷', 'Web Workers & OffscreenCanvas',
    "Workers run JS on a background thread so physics or networking doesn't stall the render loop; OffscreenCanvas lets that worker even draw pixels directly, off the main thread.",
    [{ label: 'MDN Workers', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API' }, { label: 'MDN OffscreenCanvas', url: 'https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas' }], 'SHIPPING'),
  'webgpu-compute': leaf('webgpu-compute', 'platform', '🧮', 'WebGPU Compute',
    'The same WebGPU API also exposes general-purpose compute shaders — not just triangles. Useful for particle systems, cloth, or ML inference running entirely on the GPU in-browser.',
    [{ label: 'W3C spec', url: 'https://www.w3.org/TR/webgpu/' }], 'SHIPPING'),
  pwa: leaf('pwa', 'platform', '📲', 'PWA / Service Workers / Storage',
    'Service workers cache assets and run offline; storage APIs (IndexedDB etc.) persist state locally. Together they let a spatial-web app install like a native one and survive a dropped connection.',
    [{ label: 'MDN PWA', url: 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps' }, { label: 'MDN Service Worker', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API' }], 'SHIPPING'),
  'web-audio': leaf('web-audio', 'platform', '🔊', 'Web Audio API',
    'A full audio-routing graph in the browser — spatialized/positional sound, filters, synthesis. Essential for a scene to feel like a place rather than a silent diorama.',
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API' }], 'SHIPPING'),
  gamepad: leaf('gamepad', 'platform', '🕹️', 'Gamepad API',
    "Reads raw controller/gamepad input — buttons, axes, sometimes haptics. WebXR's own input sources cover XR controllers; this is the fallback for plain USB/Bluetooth pads.",
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API' }], 'SHIPPING'),
  webcodecs: leaf('webcodecs', 'platform', '🎞️', 'WebCodecs',
    "Low-level access to the browser's built-in video/audio encoders and decoders, bypassing the usual media-element overhead. Useful for streaming a live camera feed into a scene efficiently.",
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API' }], 'MATURING'),
  'es-modules': leaf('es-modules', 'platform', '🧵', 'ES Modules & Import Maps',
    'Native browser import/export, with import maps letting a bare specifier like "three" resolve to a CDN URL — no bundler required. This whole project ships this way; check the import map in index.html.',
    [{ label: 'MDN Modules', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules' }, { label: 'MDN Import Maps', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap' }], 'SHIPPING'),

  // ==== Physics & simulation =============================================
  physics: {
    id: 'physics', kind: 'concept', category: 'physics', relevance: 0.8,
    emoji: '🪨', title: 'Physics & Simulation',
    body: 'Making things fall, collide, and bounce convincingly — almost always via a WASM-compiled physics engine running off the main thread.',
    children: ['rapier', 'physics-workers', 'other-physics'],
  },
  rapier: leaf('rapier', 'physics', '🦀', 'Rapier',
    'A Rust physics engine compiled to WebAssembly — fast, deterministic, and the engine of choice for a lot of newer WebXR projects (including the sats-arena line this repo is a sibling of).',
    [{ label: 'rapier.rs', url: 'https://rapier.rs/' }], 'SHIPPING'),
  'physics-workers': leaf('physics-workers', 'physics', '⚙️', 'Physics-in-a-Worker Pattern',
    'Running the physics step inside a Web Worker keeps a heavy simulation from ever blocking the render thread — the render loop just reads back transforms each frame instead of computing them itself.',
    [{ label: 'MDN Workers', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API' }], 'MATURING'),
  'other-physics': leaf('other-physics', 'physics', '🧊', 'Other WASM Physics: cannon-es, Ammo.js',
    'cannon-es is a lighter, TypeScript-maintained engine descended from cannon.js; Ammo.js is an Emscripten port of Bullet Physics. Both still see use, though Rapier has become the more common default for new projects.',
    [{ label: 'cannon-es', url: 'https://pmndrs.github.io/cannon-es/' }, { label: 'Ammo.js', url: 'https://github.com/kripken/ammo.js/' }], 'MATURING'),

  // ==== Identity & social =================================================
  identity: {
    id: 'identity', kind: 'concept', category: 'identity', relevance: 0.78,
    emoji: '🪪', title: 'Identity & Social',
    body: "Who you are and who you know, portable across apps instead of locked into one platform's database — the social layer for a web that isn't walled gardens.",
    children: ['nostr', 'atproto', 'activitypub'],
  },
  nostr: leaf('nostr', 'identity', '🦩', 'Nostr',
    'A minimal, relay-based protocol: your identity is just a keypair, your posts are signed events broadcast to relays you choose. No company owns your account or your follow graph.',
    [{ label: 'nostr.com', url: 'https://nostr.com/' }], 'MATURING'),
  atproto: leaf('atproto', 'identity', '🦋', 'AT Protocol / Bluesky',
    'The protocol behind Bluesky — portable identity (DIDs), your data in a personal repository, and algorithmic choice via pluggable feeds. More centralized infra today than Nostr, with an explicit roadmap toward full federation.',
    [{ label: 'atproto.com', url: 'https://atproto.com/' }], 'MATURING'),
  activitypub: leaf('activitypub', 'identity', '🐘', 'ActivityPub / Fediverse',
    'A W3C Recommendation for federated social networking — the protocol behind Mastodon and the wider fediverse. Different servers interoperate the way email servers do.',
    [{ label: 'W3C Recommendation', url: 'https://www.w3.org/TR/activitypub/' }], 'STANDARD'),

  // ==== Value & open money =================================================
  value: {
    id: 'value', kind: 'concept', category: 'value', relevance: 0.75,
    emoji: '⚡', title: 'Value & Open Money',
    body: "One cluster among eight: open, programmable money rails for the web — because a spatial web where every interaction needs a credit-card processor isn't very open. Also the layer the sats-economics demo (off by default here) is built on.",
    children: ['bitcoin', 'lightning', 'cashu', 'rgb-protocol', 'lnurl-nwc'],
  },
  bitcoin: leaf('bitcoin', 'value', '₿', 'Bitcoin',
    'A decentralized digital money with a fixed 21M supply, secured by proof-of-work and verified by a global network of nodes rather than a central issuer. The base settlement layer everything else in this cluster builds on.',
    [{ label: 'bitcoin.org', url: 'https://bitcoin.org/en/how-it-works' }], 'SHIPPING'),
  lightning: leaf('lightning', 'value', '🌩️', 'Lightning Network',
    'A layer-2 network of payment channels that moves Bitcoin instantly and near-free off-chain, settling to the base chain only when a channel opens or closes. Live since 2018; wallet UX and liquidity management are still actively evolving.',
    [{ label: 'lightning.network', url: 'https://lightning.network/' }], 'MATURING'),
  cashu: leaf('cashu', 'value', '🥜', 'Cashu / Ecash',
    'Chaumian ecash backed by Lightning: a mint issues blinded bearer tokens that are private and near-instant to swap. Smaller, faster-moving ecosystem than Lightning itself — this is what the (off-by-default) per-search sats demo in this app would settle through.',
    [{ label: 'cashu.space', url: 'https://cashu.space/' }], 'EXPERIMENTAL'),
  'rgb-protocol': leaf('rgb-protocol', 'value', '📜', 'RGB (Client-Side Contracts)',
    'Client-side-validated smart contracts anchored to Bitcoin/Lightning — state lives off-chain in consignments the involved parties validate themselves, while Bitcoin only anchors a commitment. Enables tokens and one-of-one digital assets without bloating the base chain.',
    [{ label: 'rgbfaq.com', url: 'https://www.rgbfaq.com/' }], 'EXPERIMENTAL'),
  'lnurl-nwc': leaf('lnurl-nwc', 'value', '🔗', 'LNURL & Nostr Wallet Connect',
    'LNURL is a family of small specs that make Lightning interactions (tipping, login, withdrawing) work with a simple scannable link; Nostr Wallet Connect lets an app request permission to spend from your wallet remotely, over Nostr.',
    [{ label: 'LNURL specs', url: 'https://github.com/lnurl/luds' }, { label: 'nwc.dev', url: 'https://nwc.dev/' }], 'MATURING'),

  // ==== The Why ============================================================
  why: {
    id: 'why', kind: 'concept', category: 'why', relevance: 0.7,
    emoji: '🧭', title: 'The Why',
    body: 'The thesis this whole demo is built to argue: the web keeps adding a dimension, and it should stay open while it does.',
    children: ['dimensional-web', 'one-link-any-reality', 'open-standards'],
  },
  'dimensional-web': leaf('dimensional-web', 'why', '📐', 'The Dimensional Web',
    'Text (1D) → hypertext pages (2D) → 3D scenes → shared, persistent "4D" spaces over time. Each jump didn\'t replace the last one — it added a dimension the web could route through a link.',
    [{ label: 'immersiveweb.dev', url: 'https://immersiveweb.dev/' }]),
  'one-link-any-reality': leaf('one-link-any-reality', 'why', '🔗', 'One Link, Any Reality',
    'The actual promise of WebXR: the SAME url runs on a phone, a desktop browser, and a headset, because immersive mode is a session request an existing page can make — not a separate app you have to download.',
    [{ label: 'immersiveweb.dev', url: 'https://immersiveweb.dev/' }]),
  'open-standards': leaf('open-standards', 'why', '🏛️', 'Open Standards vs Walled Gardens',
    "Every cluster in this constellation — WebGPU, WebXR, ActivityPub, Bitcoin — is either a published open standard or an openly specified protocol nobody has to ask permission to build on. That's a deliberate bet against platform lock-in.",
    [{ label: 'W3C mission', url: 'https://www.w3.org/mission/' }]),
};

// Community-authored RGB nodes: id -> authorship seed. Only reachable when
// the sats-economics demo layer is on (CONFIG.SHOW_ECONOMICS_UI / ?economics=on)
// — see AssetProvider.js / main.js. Kept small and self-referential: the RGB
// and Nostr nodes carry their own protocol's provenance as the demo.
export const AUTHORED_NODES = {
  'rgb-protocol': { contractId: 'rgb:9f8e…rgb', authorNpub: 'npub1rg…bcon', authorName: 'contract.dev', zaps: 1470, priceSats: 1500, ownerNpub: 'npub1rg…bcon' },
  nostr: { contractId: 'rgb:2b3c…nos', authorNpub: 'npub1no…strr', authorName: 'plebdev', zaps: 890, priceSats: 650, ownerNpub: 'npub1no…strr' },
};

// ---- Intent routing + decomposition (mock "agent" logic) ------------
//
// query -> { results, note? }
//   1. exact/keyword match on a node's own name (cluster or leaf)
//   2. a hand-written mapping of example intents to node sets
//   3. fallback: nearest cluster by keyword overlap, with a polite note
//      admitting the mock agent guessed

/** Every query in this demo is "learning" — no shopping/product intent. */
export function routeIntent() {
  return 'learning';
}

// ~10 example intents. Real version = Routstr semantic decomposition.
// Exported so both decompose() and the in-world search chips (immersive
// sessions only — inWorldControls.js) read the SAME 12 mappings, not two
// copies that could drift.
export const INTENT_MAP = [
  { keywords: ['multiplayer', 'multi-player', 'multi player'], nodeIds: ['websockets', 'webtransport', 'webrtc', 'livekit'] },
  { keywords: ['graphics', 'render', 'rendering'], nodeIds: ['webgpu', 'webgl', 'threejs', 'shaders'] },
  { keywords: ['own my identity', 'identity', 'social network'], nodeIds: ['nostr', 'atproto', 'activitypub'] },
  { keywords: ['physics', 'simulation', 'collide', 'collision'], nodeIds: ['rapier', 'physics-workers', 'other-physics'] },
  { keywords: ['open money', 'bitcoin', 'payments', 'sats'], nodeIds: ['bitcoin', 'lightning', 'cashu', 'rgb-protocol', 'lnurl-nwc'] },
  { keywords: ['hand tracking', 'controllers', 'input'], nodeIds: ['webxr-device-api', 'hand-tracking', 'hit-test', 'gamepad'] },
  { keywords: ['run code fast', 'performance', 'native speed', 'compute'], nodeIds: ['wasm', 'webgpu-compute', 'webcodecs'] },
  { keywords: ['offline', 'installable', 'no build'], nodeIds: ['pwa', 'es-modules'] },
  { keywords: ['3d models', 'assets', 'engines'], nodeIds: ['gltf', 'threejs', 'babylonjs', 'aframe'] },
  { keywords: ['sound', 'audio'], nodeIds: ['web-audio', 'gamepad'] },
  { keywords: ['passthrough', 'mixed reality', 'ar'], nodeIds: ['xr-modes', 'depth-sensing', 'anchors', 'openxr'] },
  { keywords: ['why does this matter', 'why'], nodeIds: ['dimensional-web', 'one-link-any-reality', 'open-standards'] },
];

/**
 * Turn a query into a spatial structure.
 * @param {string} query
 * @returns {{results: SpatialResult[], note?: string}}
 */
export function decompose(query) {
  const q = normalize(query);

  // Blank query (first load) -> the 8 clusters, no fallback note.
  if (!q) return { results: CLUSTER_IDS.map((id) => CORPUS[id]) };

  // 1. exact/keyword match on a node's own name.
  const nameHit = Object.values(CORPUS).find((n) => q.includes(normalize(n.title)));
  if (nameHit) {
    return nameHit.children?.length
      ? { results: nameHit.children.map((id) => CORPUS[id]).filter(Boolean) }
      : { results: [nameHit] };
  }

  // 2. hand-written intent -> node-set mapping.
  const intentHit = INTENT_MAP.find(({ keywords }) => keywords.some((k) => q.includes(k)));
  if (intentHit) return { results: intentHit.nodeIds.map((id) => CORPUS[id]).filter(Boolean) };

  // 3. unmapped query -> nearest cluster by keyword overlap, honestly labeled.
  const nearest = nearestCluster(q);
  return {
    results: nearest.children.map((id) => CORPUS[id]).filter(Boolean),
    note: `mock agent, demo corpus — nearest match: "${nearest.title}"`,
  };
}

function nearestCluster(q) {
  const words = q.split(' ').filter(Boolean);
  let best = CORPUS[CLUSTER_IDS[0]];
  let bestScore = -1;
  for (const id of CLUSTER_IDS) {
    const cluster = CORPUS[id];
    const haystack = normalize(
      `${cluster.title} ${cluster.body} ${cluster.children.map((cid) => CORPUS[cid]?.title || '').join(' ')}`
    );
    const score = words.reduce((s, w) => s + (haystack.includes(w) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = cluster; }
  }
  return best;
}

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Resolve child seeds (ids) into SpatialResult[] for drill-down. */
export function expandChildren(ids = []) {
  return ids.map((id) => CORPUS[id]).filter(Boolean);
}

// tiny helper to keep the corpus readable
function leaf(id, category, emoji, title, body, links, maturity) {
  const node = { id, kind: 'concept', category, relevance: 0.6, emoji, title, body, children: [] };
  if (links) node.links = links;
  if (maturity) node.maturity = maturity;
  return node;
}
