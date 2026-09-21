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
// Every leaf node also carries `tiers` — a t2 ("how it works") and t3
// ("gotchas & traps") beyond the t1 `body` ("meaning"). t3 is sourced from
// real, hard-won lessons (the webxr-threejs / threejs-visual-polish skills,
// and the CLAUDE.md of sibling repos — wordmesh, sats-arena-4, xr-stage) —
// never invented filler. Where nothing real was sourced for a node, t3 says
// so plainly rather than making something up.
//
// A couple of nodes are ALSO listed in AUTHORED_NODES to demonstrate the RGB
// layer (community-authored knowledge carrying verifiable provenance) — that
// layer is off by default; see config.js SHOW_ECONOMICS_UI.

/** @typedef {import('../schema.js').SpatialResult} SpatialResult */

export const CLUSTER_IDS = ['rendering', 'immersion', 'realtime', 'platform', 'physics', 'identity', 'value', 'why'];

// t2 and the rendered t3 string ("• a   • b") must fit the panel's 5-line
// body area (932px wide, 38px system-ui — see panel.js) with no ellipsis
// (t3 measured via schema.js renderT3, exactly as drawn).
// Measured: overflow starts ~260 chars; 240 leaves margin for wider fallback
// fonts (Arial/Roboto on Quest). t1 is the pre-existing body, left unchanged.
// Enforced by _pipeline.test.mjs.
export const TIER_MAX_CHARS = 240;

const NO_KNOWN_TRAPS = ['no known traps documented yet'];

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
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API' }, { label: 'W3C spec', url: 'https://www.w3.org/TR/webgpu/' }], 'SHIPPING',
    "You compile a pipeline object up front (shaders + fixed state), record commands into a command encoder, and submit them as one batch — unlike WebGL's call-by-call global state. Compute and render share one device and its buffers.",
    NO_KNOWN_TRAPS),
  webgl: leaf('webgl', 'rendering', '🖼️', 'WebGL',
    "The original browser 3D API, built on OpenGL ES. It's been in every major browser for over a decade and still powers most production WebXR today, even as WebGPU takes over the leading edge.",
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API' }], 'SHIPPING',
    'One implicit global state machine: bind a buffer, a program and textures to global slots, then draw with whatever is bound. No compute pipeline — general compute is smuggled through fragment shaders. Extension support varies by device.',
    NO_KNOWN_TRAPS),
  threejs: leaf('threejs', 'rendering', '🌲', 'Three.js',
    'The most widely used 3D library for the web — wraps WebGL/WebGPU behind a friendly scene graph. This project is literally built on it (see the import map in index.html).',
    [{ label: 'threejs.org', url: 'https://threejs.org/' }], 'SHIPPING',
    'A scene graph: Object3D nodes with local transforms compose into world matrices each frame. Geometry + Material + Mesh hide the GPU; loaders, animation and a picking raycaster sit on top, and the GPU calls live in a swappable renderer.',
    [
      "lookAt() aims a camera's -Z at the target but a plain Object3D's +Z — a ‘fix’ assuming -Z was verified backwards",
      'A moved InstancedMesh keeps a stale bounding sphere: frustumCulled = false fixes culling, not raycast picking',
    ]),
  babylonjs: leaf('babylonjs', 'rendering', '🅱️', 'Babylon.js',
    'A full-featured 3D engine with a heavier built-in toolset than Three.js — physics, a node-material editor, a browser-based playground IDE. Popular for product configurators and browser games.',
    [{ label: 'babylonjs.com', url: 'https://www.babylonjs.com/' }], 'SHIPPING',
    "Also a scene graph over WebGL/WebGPU, but it bundles more of the stack: a physics plugin interface, a node-based material editor, animation and particles, and an Inspector that edits a running scene's nodes and materials live.",
    NO_KNOWN_TRAPS),
  aframe: leaf('aframe', 'rendering', '🅰️', 'A-Frame',
    'A declarative, HTML-like layer over Three.js for building WebXR scenes with custom tags instead of imperative code. Great for fast prototypes; a smaller, slower-moving ecosystem than Three.js or Babylon.',
    [{ label: 'aframe.io', url: 'https://aframe.io/' }], 'MATURING',
    'Custom HTML elements (<a-scene>, <a-entity>) map onto an entity-component system over Three.js. Behaviour comes from reusable components set as HTML attributes — fast for common patterns; anything custom means dropping to Three.js.',
    NO_KNOWN_TRAPS),
  shaders: leaf('shaders', 'rendering', '✨', 'Shaders: GLSL → WGSL',
    'Shaders are the small GPU programs that decide what every pixel looks like. WebGL uses GLSL; WebGPU introduces its own language, WGSL — the ecosystem is mid-migration between the two.',
    [{ label: 'WGSL spec', url: 'https://www.w3.org/TR/WGSL/' }, { label: 'MDN GLSL', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_shaders_to_apply_color_in_WebGL' }], 'MATURING',
    'A vertex shader runs per vertex and outputs a clip-space position; a fragment shader runs per covered pixel and outputs a colour from values interpolated across the triangle. WGSL is stricter than GLSL and covers compute too.',
    [
      'onBeforeCompile: append after a stock chunk, never replace it — replacing broke the compile with redefinitions',
      'Reusing a per-instance attribute that already carries a multiplier for a new effect compounds it — nodes blew out white',
    ]),
  gltf: leaf('gltf', 'rendering', '📦', 'glTF / GLB',
    'The Khronos-ratified "JPEG of 3D" — a compact, standard interchange format for models, materials, and animations. Nearly every web 3D engine imports it directly.',
    [{ label: 'Khronos glTF', url: 'https://www.khronos.org/gltf/' }], 'STANDARD',
    'A JSON scene description (nodes, meshes, materials, animations) plus binary buffers, as loose files or one .glb. PBR metallic-roughness is the default so assets look alike across engines; extensions add mesh and texture compression.',
    [
      'AI-generated meshes are usually too heavy for a headset: decimate, collapse materials, bake detail into textures',
      'Test the export→import round trip every time — one pipeline shipped a model with its body facing backwards',
    ]),

  // ==== Immersion =======================================================
  immersion: {
    id: 'immersion', kind: 'concept', category: 'immersion', relevance: 0.92,
    emoji: '🥽', title: 'Immersion',
    body: "The APIs that get a browser INTO a headset or a phone's camera view — session management, tracking, and the sensing modules that make a scene feel like a place.",
    children: ['webxr-device-api', 'xr-modes', 'hand-tracking', 'hit-test', 'anchors', 'depth-sensing', 'openxr'],
  },
  'webxr-device-api': leaf('webxr-device-api', 'immersion', '🎮', 'WebXR Device API',
    "The core browser API for requesting an immersive session, reading headset/controller poses, and rendering stereo frames. Every mode in this app's mode switcher runs through it.",
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API' }, { label: 'W3C spec', url: 'https://www.w3.org/TR/webxr/' }], 'STANDARD',
    'requestSession() gives a session plus a reference space (viewer, local, local-floor) that sets your origin. Each frame, XRFrame gives the pose relative to it, and the browser renders stereo into the layer you handed it.',
    [
      "On exit, reset the camera's residual head position and roll too — resetting only yaw/pitch leaves a tilted view",
      "Sessions also end from the system menu, not just your button — always handle 'sessionend' or the app gets stuck",
    ]),
  'xr-modes': leaf('xr-modes', 'immersion', '🌗', 'VR / AR / Passthrough Modes',
    "One WebXR session can request 'immersive-vr' or 'immersive-ar'; passthrough blends live camera video with rendered content. Support and quality vary a lot by device.",
    [{ label: 'immersiveweb.dev', url: 'https://immersiveweb.dev/' }], 'MATURING',
    'immersive-vr replaces your whole view; immersive-ar draws your content over camera passthrough with real-world tracking. One session and frame loop drive both — what differs is what sits behind your content and which features you request.',
    [
      'A bounded environment built for VR (walls, floor, ceiling, sky) has to be suppressed entirely in AR, not just the sky — passthrough IS the environment, and anything freestanding needs to anchor to the real floor instead',
    ]),
  'hand-tracking': leaf('hand-tracking', 'immersion', '✋', 'Hand Tracking',
    'Skeletal hand-joint poses delivered straight into WebXR input sources — no controller needed. Well supported on Quest\'s browser; patchier elsewhere.',
    [{ label: 'W3C module', url: 'https://www.w3.org/TR/webxr-hand-input-1/' }], 'MATURING',
    "An XRInputSource can expose a hand of 25 named joints (wrist, knuckles, tips), each posed via XRFrame.getJointPose(). There's no controller, so a gesture like a pinch has to be computed from joint distances, not read off a button.",
    NO_KNOWN_TRAPS),
  'hit-test': leaf('hit-test', 'immersion', '🎯', 'Hit-Test',
    'Casts a ray into the real world and returns where it hits a detected surface — the basis of "tap to place an object on the floor" AR interactions.',
    [{ label: 'W3C module', url: 'https://www.w3.org/TR/webxr-hit-test-1/' }], 'MATURING',
    "You request a hit-test source tied to a ray (gaze or controller); each frame the runtime returns where that ray meets detected real-world surfaces, as a pose you can place things at. It's a live per-frame query, not a stored map.",
    NO_KNOWN_TRAPS),
  anchors: leaf('anchors', 'immersion', '📌', 'Anchors',
    'Lets an app pin a virtual object to a real-world point so it stays put as tracking recalculates. Narrower device support than hit-test.',
    [{ label: 'W3C module', url: 'https://www.w3.org/TR/webxr-anchors-module-1/' }], 'EXPERIMENTAL',
    "An anchor wraps a pose and asks the runtime to keep tracking it as its world map improves, correcting drift. Create one from a hit-test result, then read its pose each frame from the anchor's own space, not the original coordinates.",
    NO_KNOWN_TRAPS),
  'depth-sensing': leaf('depth-sensing', 'immersion', '🌊', 'Depth Sensing',
    'Exposes a live per-pixel depth map of the real world, enabling real occlusion — virtual content correctly hiding behind your couch. Still an early, unevenly supported module.',
    [{ label: 'W3C module', url: 'https://www.w3.org/TR/webxr-depth-sensing-1/' }], 'EXPERIMENTAL',
    'The runtime supplies a per-frame depth buffer (CPU array or GPU texture) aligned to the view — real-world distance per pixel. A fragment shader can test virtual geometry against it, so real objects correctly hide virtual ones.',
    NO_KNOWN_TRAPS),
  openxr: leaf('openxr', 'immersion', '🔧', 'OpenXR',
    'The native, cross-platform XR API that browser engines build their WebXR implementation on top of. You never call it directly from the web, but it\'s the plumbing underneath every headset runtime.',
    [{ label: 'Khronos OpenXR', url: 'https://www.khronos.org/openxr/' }], 'STANDARD',
    "A C API that headset runtimes implement and engines or browsers link against: sessions, spaces, input actions and frame submission. Browsers often implement WebXR as a thin layer over the platform's own OpenXR runtime.",
    NO_KNOWN_TRAPS),

  // ==== Real-time =======================================================
  realtime: {
    id: 'realtime', kind: 'concept', category: 'realtime', relevance: 0.88,
    emoji: '📡', title: 'Real-time',
    body: 'How a spatial scene stays in sync with other people and live data — the transport layer under multiplayer, voice, and live updates.',
    children: ['websockets', 'webtransport', 'webrtc', 'livekit'],
  },
  websockets: leaf('websockets', 'realtime', '🔌', 'WebSockets',
    'A persistent, full-duplex TCP connection between browser and server. The oldest and simplest way to push real-time updates — still the default choice for most multiplayer state sync.',
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API' }], 'SHIPPING',
    'One HTTP handshake upgrades the connection; after that either side can push framed messages over the same TCP socket, no polling. TCP guarantees order, which is also the ceiling: one lost packet stalls everything behind it.',
    [
      'A vanished peer or half-open socket raises no event — presence needs heartbeats, ~4 s stale-peer pruning and reconnect-on-drop',
      'Free-tier hosts idle-sleep; the first connection after a quiet spell pays a cold-start delay',
    ]),
  webtransport: leaf('webtransport', 'realtime', '🚚', 'WebTransport',
    'A newer, UDP-based transport (over HTTP/3/QUIC) offering lower-latency, unreliable-ok delivery — a better fit for fast-moving XR state than TCP. Shipping in Chrome/Edge; Safari support is the main gap.',
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API' }], 'SHIPPING',
    'Built on HTTP/3 (QUIC): many independent streams over one connection, so a lost packet only stalls its own stream — plus unreliable datagrams for state a newer update supersedes anyway, like a position.',
    NO_KNOWN_TRAPS),
  webrtc: leaf('webrtc', 'realtime', '📹', 'WebRTC',
    'Peer-to-peer audio, video, and data channels directly between browsers. Powers voice chat and low-latency data in most multiplayer XR apps, usually via a relay/SFU rather than true mesh.',
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API' }], 'SHIPPING',
    'Peers swap SDP offers and answers over a signalling channel you provide, then ICE gathers host, STUN-reflexive and TURN-relayed candidates and picks a path. Media and data then flow peer-to-peer unless a TURN relay or SFU is in between.',
    NO_KNOWN_TRAPS),
  livekit: leaf('livekit', 'realtime', '🛰️', 'LiveKit & the SFU Model',
    'An open-source Selective Forwarding Unit built on WebRTC: each client sends one stream to a server, which forwards it to everyone else, instead of every client connecting to every other client. What most production multiplayer voice/video actually runs on.',
    [{ label: 'livekit.io', url: 'https://livekit.io/' }], 'SHIPPING',
    'Each participant opens one WebRTC connection to the SFU and uploads their stream once; the SFU forwards it to everyone else, instead of each client uploading N copies. A short-lived JWT, minted server-side for one room, authorises the join.',
    [
      "The API secret that mints room access tokens must live only on a backend — a client that could mint its own token could mint one for any room, so token issuance can never move to the static client",
    ]),

  // ==== Platform primitives =============================================
  platform: {
    id: 'platform', kind: 'concept', category: 'platform', relevance: 0.85,
    emoji: '🧩', title: 'Platform Primitives',
    body: 'The lower-level browser capabilities a spatial-web app leans on for performance and reach — running real code fast, offline, and off the main thread.',
    children: ['wasm', 'workers', 'webgpu-compute', 'pwa', 'web-audio', 'gamepad', 'webcodecs', 'es-modules'],
  },
  wasm: leaf('wasm', 'platform', '🧱', 'WebAssembly',
    'A compact, near-native-speed bytecode target the browser can run — lets languages like Rust or C++ (e.g. a physics engine) run inside a web page at real speed.',
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly' }, { label: 'webassembly.org', url: 'https://webassembly.org/' }], 'STANDARD',
    'A compact binary format, compiled ahead of time from Rust, C++ and others, that runs sandboxed at near-native speed in its own linear memory. It calls to and from JS across a defined boundary; DOM and Web APIs still go through JS.',
    NO_KNOWN_TRAPS),
  workers: leaf('workers', 'platform', '👷', 'Web Workers & OffscreenCanvas',
    "Workers run JS on a background thread so physics or networking doesn't stall the render loop; OffscreenCanvas lets that worker even draw pixels directly, off the main thread.",
    [{ label: 'MDN Workers', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API' }, { label: 'MDN OffscreenCanvas', url: 'https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas' }], 'SHIPPING',
    'A Worker is a separate JS thread with no DOM, talking to the main thread via structured-clone messages, transferables, or a SharedArrayBuffer. OffscreenCanvas lets a worker own a rendering context, so even draw calls leave the main thread.',
    [
      'A Worker changes when heavy work runs, not whether it blocks: the reply handler runs on the main thread, so O(data) work there (validation, raycasts, re-centring) is still one long task',
    ]),
  'webgpu-compute': leaf('webgpu-compute', 'platform', '🧮', 'WebGPU Compute',
    'The same WebGPU API also exposes general-purpose compute shaders — not just triangles. Useful for particle systems, cloth, or ML inference running entirely on the GPU in-browser.',
    [{ label: 'W3C spec', url: 'https://www.w3.org/TR/webgpu/' }], 'SHIPPING',
    'A compute pipeline runs a WGSL kernel over a 3D grid of invocations, reading and writing storage buffers and textures with no rasterisation. It shares the device and buffers with rendering, so results feed a draw with no CPU round-trip.',
    NO_KNOWN_TRAPS),
  pwa: leaf('pwa', 'platform', '📲', 'PWA / Service Workers / Storage',
    'Service workers cache assets and run offline; storage APIs (IndexedDB etc.) persist state locally. Together they let a spatial-web app install like a native one and survive a dropped connection.',
    [{ label: 'MDN PWA', url: 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps' }, { label: 'MDN Service Worker', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API' }], 'SHIPPING',
    "A service worker sits as a programmable proxy in front of your origin, intercepting fetches and choosing cache, network or both — that's what enables offline use and instant reloads. A web app manifest is what makes it installable.",
    NO_KNOWN_TRAPS),
  'web-audio': leaf('web-audio', 'platform', '🔊', 'Web Audio API',
    'A full audio-routing graph in the browser — spatialized/positional sound, filters, synthesis. Essential for a scene to feel like a place rather than a silent diorama.',
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API' }], 'SHIPPING',
    "You wire a graph of nodes (sources, gains, filters, panners) into a destination, processed on the browser's audio thread independent of frame rate. PannerNode and AudioListener compute 3D attenuation and panning from positions.",
    ['Browsers block audio (and mic access) until a real user gesture — starting playback on load silently does nothing; gate it behind a tap or click']),
  gamepad: leaf('gamepad', 'platform', '🕹️', 'Gamepad API',
    "Reads raw controller/gamepad input — buttons, axes, sometimes haptics. WebXR's own input sources cover XR controllers; this is the fallback for plain USB/Bluetooth pads.",
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API' }], 'SHIPPING',
    'navigator.getGamepads() is polled, not event-driven: you read button and axis state yourself each frame. Axes report -1..1; buttons carry both a pressed flag and an analogue value, so a half-pulled trigger is readable.',
    [
      'Quest sticks report ~0.85–0.95 at full push, not 1.0 — a 0.95+ sprint threshold can silently never fire',
      'Runtimes map sticks to different axes (xr-standard [2]/[3] vs [0]/[1]) — fall back to whichever pair is deflected',
    ]),
  webcodecs: leaf('webcodecs', 'platform', '🎞️', 'WebCodecs',
    "Low-level access to the browser's built-in video/audio encoders and decoders, bypassing the usual media-element overhead. Useful for streaming a live camera feed into a scene efficiently.",
    [{ label: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API' }], 'MATURING',
    "Exposes the browser's hardware and software codecs directly as VideoEncoder/VideoDecoder working on raw frames, bypassing <video> and MediaRecorder. You get per-frame control and can upload decoded frames straight into a GPU texture.",
    NO_KNOWN_TRAPS),
  'es-modules': leaf('es-modules', 'platform', '🧵', 'ES Modules & Import Maps',
    'Native browser import/export, with import maps letting a bare specifier like "three" resolve to a CDN URL — no bundler required. This whole project ships this way; check the import map in index.html.',
    [{ label: 'MDN Modules', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules' }, { label: 'MDN Import Maps', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap' }], 'SHIPPING',
    'import/export are static, so the browser builds the whole dependency graph before running anything; each module has its own strict-mode scope. An import map resolves bare specifiers to URLs — how this app loads dependencies with no bundler.',
    NO_KNOWN_TRAPS),

  // ==== Physics & simulation =============================================
  physics: {
    id: 'physics', kind: 'concept', category: 'physics', relevance: 0.8,
    emoji: '🪨', title: 'Physics & Simulation',
    body: 'Making things fall, collide, and bounce convincingly — almost always via a WASM-compiled physics engine running off the main thread.',
    children: ['rapier', 'physics-workers', 'other-physics'],
  },
  rapier: leaf('rapier', 'physics', '🦀', 'Rapier',
    'A Rust physics engine compiled to WebAssembly — fast, deterministic, and the engine of choice for a lot of newer WebXR projects (including the sats-arena line this repo is a sibling of).',
    [{ label: 'rapier.rs', url: 'https://rapier.rs/' }], 'SHIPPING',
    'An impulse-based iterative constraint solver; the WASM build exposes the same rigid-body, collider and joint API as native Rapier. You step the world at a fixed timestep, then copy transforms to your render meshes; syncing them is on you.',
    NO_KNOWN_TRAPS),
  'physics-workers': leaf('physics-workers', 'physics', '⚙️', 'Physics-in-a-Worker Pattern',
    'Running the physics step inside a Web Worker keeps a heavy simulation from ever blocking the render thread — the render loop just reads back transforms each frame instead of computing them itself.',
    [{ label: 'MDN Workers', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API' }], 'MATURING',
    "The physics step runs in a Worker and posts back every active body's transform, via a transferable or shared buffer to skip copies. The render loop reads the latest result without blocking, so physics rate and frame rate decouple.",
    ['Same trap as Workers generally: running physics off-thread doesn\'t help if reading its results back into the scene each frame does O(body-count) work synchronously on the main thread']),
  'other-physics': leaf('other-physics', 'physics', '🧊', 'Other WASM Physics: cannon-es, Ammo.js',
    'cannon-es is a lighter, TypeScript-maintained engine descended from cannon.js; Ammo.js is an Emscripten port of Bullet Physics. Both still see use, though Rapier has become the more common default for new projects.',
    [{ label: 'cannon-es', url: 'https://pmndrs.github.io/cannon-es/' }, { label: 'Ammo.js', url: 'https://github.com/kripken/ammo.js/' }], 'MATURING',
    "cannon-es is a maintained fork of cannon.js: an impulse solver like Rapier, but plain JS rather than compiled WASM. Ammo.js is an Emscripten compile of the C++ Bullet engine, exposing Bullet's own API from WASM/asm.js.",
    NO_KNOWN_TRAPS),

  // ==== Identity & social =================================================
  identity: {
    id: 'identity', kind: 'concept', category: 'identity', relevance: 0.78,
    emoji: '🪪', title: 'Identity & Social',
    body: "Who you are and who you know, portable across apps instead of locked into one platform's database — the social layer for a web that isn't walled gardens.",
    children: ['nostr', 'atproto', 'activitypub'],
  },
  nostr: leaf('nostr', 'identity', '🦩', 'Nostr',
    'A minimal, relay-based protocol: your identity is just a keypair, your posts are signed events broadcast to relays you choose. No company owns your account or your follow graph.',
    [{ label: 'nostr.com', url: 'https://nostr.com/' }], 'MATURING',
    "Every action is a signed JSON event (kind, content, pubkey, signature) published to relays you choose. Relays are simple stores that needn't talk to each other; clients merge results from several relays, which makes it hard to censor.",
    NO_KNOWN_TRAPS),
  atproto: leaf('atproto', 'identity', '🦋', 'AT Protocol / Bluesky',
    'The protocol behind Bluesky — portable identity (DIDs), your data in a personal repository, and algorithmic choice via pluggable feeds. More centralized infra today than Nostr, with an explicit roadmap toward full federation.',
    [{ label: 'atproto.com', url: 'https://atproto.com/' }], 'MATURING',
    'Your identity is a DID resolving to a document that points at your current PDS (personal data server), where posts and follows live as portable records. A separate AppView builds feeds, and custom feed generators plug in.',
    NO_KNOWN_TRAPS),
  activitypub: leaf('activitypub', 'identity', '🐘', 'ActivityPub / Fediverse',
    'A W3C Recommendation for federated social networking — the protocol behind Mastodon and the wider fediverse. Different servers interoperate the way email servers do.',
    [{ label: 'W3C Recommendation', url: 'https://www.w3.org/TR/activitypub/' }], 'STANDARD',
    "Servers exchange JSON-LD activities (Create, Follow, Like…) over HTTP through each actor's inbox and outbox, found via WebFinger. Follow someone elsewhere and a Follow lands in their inbox; once accepted, their posts arrive in yours.",
    NO_KNOWN_TRAPS),

  // ==== Value & open money =================================================
  value: {
    id: 'value', kind: 'concept', category: 'value', relevance: 0.75,
    emoji: '⚡', title: 'Value & Open Money',
    body: "One cluster among eight: open, programmable money rails for the web — because a spatial web where every interaction needs a credit-card processor isn't very open. Also the layer the sats-economics demo (off by default here) is built on.",
    children: ['bitcoin', 'lightning', 'cashu', 'rgb-protocol', 'lnurl-nwc'],
  },
  bitcoin: leaf('bitcoin', 'value', '₿', 'Bitcoin',
    'A decentralized digital money with a fixed 21M supply, secured by proof-of-work and verified by a global network of nodes rather than a central issuer. The base settlement layer everything else in this cluster builds on.',
    [{ label: 'bitcoin.org', url: 'https://bitcoin.org/en/how-it-works' }], 'SHIPPING',
    'Transactions spend earlier outputs and create new ones (UTXOs); every node validates each rule independently before relaying. Miners bundle transactions into blocks by finding a hash below a target; the chain with the most work wins.',
    NO_KNOWN_TRAPS),
  lightning: leaf('lightning', 'value', '🌩️', 'Lightning Network',
    'A layer-2 network of payment channels that moves Bitcoin instantly and near-free off-chain, settling to the base chain only when a channel opens or closes. Live since 2018; wallet UX and liquidity management are still actively evolving.',
    [{ label: 'lightning.network', url: 'https://lightning.network/' }], 'MATURING',
    'Two parties lock funds in a 2-of-2 multisig on-chain, then exchange signed balance updates off-chain, settling on-chain only on close or cheating. Multi-hop payments use hashed timelocks so no intermediary can steal funds.',
    ["A hosted wallet's invoice/API key is a bearer secret for the whole balance — it has to live only on a backend the client never sees, never bundled into the frontend"]),
  cashu: leaf('cashu', 'value', '🥜', 'Cashu / Ecash',
    'Chaumian ecash backed by Lightning: a mint issues blinded bearer tokens that are private and near-instant to swap. Smaller, faster-moving ecosystem than Lightning itself — this is what the (off-by-default) per-search sats demo in this app would settle through.',
    [{ label: 'cashu.space', url: 'https://cashu.space/' }], 'EXPERIMENTAL',
    "A mint holds real sats and issues ecash tokens using blind signatures: it signs without seeing the token's secret, so it can later verify a token without linking it to whoever requested it. Spending swaps old tokens for new ones.",
    NO_KNOWN_TRAPS),
  'rgb-protocol': leaf('rgb-protocol', 'value', '📜', 'RGB (Client-Side Contracts)',
    'Client-side-validated smart contracts anchored to Bitcoin/Lightning — state lives off-chain with the parties who validate it; Bitcoin only anchors a commitment. Enables tokens and one-of-one digital assets without bloating the base chain.',
    [{ label: 'rgbfaq.com', url: 'https://www.rgbfaq.com/' }], 'EXPERIMENTAL',
    "Contract state and history live off-chain in a consignment the parties pass to each other and validate against the contract's rules; Bitcoin only holds a commitment. So on-chain cost doesn't grow with contract complexity.",
    NO_KNOWN_TRAPS),
  'lnurl-nwc': leaf('lnurl-nwc', 'value', '🔗', 'LNURL & Nostr Wallet Connect',
    'LNURL is a family of small specs that make Lightning interactions (tipping, login, withdrawing) work with a simple scannable link; Nostr Wallet Connect lets an app request permission to spend from your wallet remotely, over Nostr.',
    [{ label: 'LNURL specs', url: 'https://github.com/lnurl/luds' }, { label: 'nwc.dev', url: 'https://nwc.dev/' }], 'MATURING',
    'LNURL encodes an HTTPS callback as a scannable link; a wallet fetches metadata from it to complete a pay, withdraw or login flow. Nostr Wallet Connect sends signed, encrypted requests over Nostr relays — no HTTP endpoint on your wallet.',
    NO_KNOWN_TRAPS),

  // ==== The Why ============================================================
  why: {
    id: 'why', kind: 'concept', category: 'why', relevance: 0.7,
    emoji: '🧭', title: 'The Why',
    body: 'The thesis this whole demo is built to argue: the web keeps adding a dimension, and it should stay open while it does.',
    children: ['dimensional-web', 'one-link-any-reality', 'open-standards'],
  },
  'dimensional-web': leaf('dimensional-web', 'why', '📐', 'The Dimensional Web',
    'Text (1D) → hypertext pages (2D) → 3D scenes → shared, persistent "4D" spaces over time. Each jump didn\'t replace the last one — it added a dimension the web could route through a link.',
    [{ label: 'immersiveweb.dev', url: 'https://immersiveweb.dev/' }], undefined,
    'Each step kept the previous one reachable through the same mechanism — a link. A 2D page still shows plain text; a WebXR scene loads from an ordinary URL that a 2D browser can also show flat. Capability is added, not forked.',
    NO_KNOWN_TRAPS),
  'one-link-any-reality': leaf('one-link-any-reality', 'why', '🔗', 'One Link, Any Reality',
    'The actual promise of WebXR: the SAME url runs on a phone, a desktop browser, and a headset, because immersive mode is a session request an existing page can make — not a separate app you have to download.',
    [{ label: 'immersiveweb.dev', url: 'https://immersiveweb.dev/' }], undefined,
    'A WebXR session is a mode a page requests from JavaScript, gated on feature detection and a user gesture — no separate app, store or SDK. The same HTML/JS drawing a flat canvas can request an immersive session on a capable device.',
    NO_KNOWN_TRAPS),
  'open-standards': leaf('open-standards', 'why', '🏛️', 'Open Standards vs Walled Gardens',
    "Every cluster in this constellation — WebGPU, WebXR, ActivityPub, Bitcoin — is either a published open standard or an openly specified protocol nobody has to ask permission to build on. That's a deliberate bet against platform lock-in.",
    [{ label: 'W3C mission', url: 'https://www.w3.org/mission/' }], undefined,
    'A spec published by a body like the W3C or Khronos, with an open change process, can be implemented by any browser or engine without a licence. Independent implementations stop one vendor from quietly changing the rules.',
    NO_KNOWN_TRAPS),
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
function leaf(id, category, emoji, title, body, links, maturity, t2, t3) {
  const node = { id, kind: 'concept', category, relevance: 0.6, emoji, title, body, children: [] };
  if (links) node.links = links;
  if (maturity) node.maturity = maturity;
  if (t2 || t3) node.tiers = { t2: t2 || body, t3: t3 || NO_KNOWN_TRAPS };
  return node;
}
