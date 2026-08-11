# Learn XR in XR

**An XR browser — search the tech behind the spatial web, and the results
surround you.** Built in WebXR/Three.js, runs from a single link on desktop,
mobile, VR (Quest) and AR passthrough.

You ask a question. A **mock agent** decomposes it into a **concept
constellation** that surrounds you in 3D — position encodes the *shape* of the
topic, not a scroll of links. The corpus is curated: the standards, engines,
and protocols actually building the spatial web, grouped into 8 clusters
(Rendering, Immersion, Real-time, Platform Primitives, Physics & Simulation,
Identity & Social, Value & Open Money, and The Why).

This is a **concept demo**: "an XR browser with 3D search results" as a real,
playable thing, not a mockup. It's Phase 1 by design — the agent is a mock
keyword/intent router over a hand-written corpus, not a live LLM. A
pay-per-inference sats economics layer (from an earlier build of this repo)
is fully implemented and still wired up, just off by default — see
[Sats economics demo layer](#sats-economics-demo-layer-off-by-default) below.

> The **XRium** museum concept is a separate project, not this repo.

---

## The core idea (and the wall we designed around)

You *can't* render live cross-origin web pages onto a WebGL surface inside an
immersive session (iframes don't composite into GL; sites block embedding; CSS3D
and DOM-overlay don't survive an immersive XR session). So the agent doesn't
hand you *pages* — it hands you **structured data**, and we render **purpose-built
3D panels**. That's the single decision everything hangs off, and it looks better
than fake browser windows anyway.

The agent's real job is therefore richer than "fetch and show":

- **Decomposition** — one query → a set of nodes, each becoming a panel around you.
- **Intent mapping** — a query like "multiplayer" resolves to a hand-picked node
  set (WebSockets, WebTransport, WebRTC, LiveKit) rather than a keyword search.
- **Honest fallback** — an unmapped query still returns something (the nearest
  cluster by keyword overlap) and says so on the HUD: *"mock agent, demo corpus"*.

## What's in the corpus

8 clusters, ~40 individual technology nodes. Every leaf node carries a short
plain-language explainer, 1–2 links to **real official sources** (MDN, W3C,
Khronos, or the project's own site — never invented), and an honest maturity
tag: `STANDARD` / `SHIPPING` / `MATURING` / `EXPERIMENTAL`, a snapshot as of
Aug 2026, not a guarantee. See `src/content/techCorpus.js`.

| Cluster | Nodes |
|---|---|
| **Rendering** | WebGPU, WebGL, Three.js, Babylon.js, A-Frame, Shaders (GLSL→WGSL), glTF/GLB |
| **Immersion** | WebXR Device API, VR/AR/passthrough modes, hand tracking, hit-test, anchors, depth sensing, OpenXR |
| **Real-time** | WebSockets, WebTransport, WebRTC, LiveKit/SFU |
| **Platform Primitives** | WebAssembly, Web Workers/OffscreenCanvas, WebGPU compute, PWA/service workers, Web Audio, Gamepad API, WebCodecs, ES modules + import maps |
| **Physics & Simulation** | Rapier (WASM), physics-in-a-worker pattern, cannon-es/Ammo.js |
| **Identity & Social** | Nostr, AT Protocol/Bluesky, ActivityPub/fediverse |
| **Value & Open Money** | Bitcoin, Lightning, Cashu/ecash, RGB, LNURL/NWC |
| **The Why** | The dimensional web, "one link, any reality", open standards vs walled gardens |

Try typing: `multiplayer`, `graphics`, `own my identity`, `physics`,
`open money`, `hand tracking`, `passthrough`, or the name of any node
(e.g. `WebGPU`, `Rapier`, `Nostr`) — or leave the search box empty and just
look around; the 8 clusters are the default view.

---

## Architecture — the swappable seam

The renderer is the **only** consumer of one normalized schema
(`src/schema.js` → `SpatialResult`):

```
query
  │
  ▼
AgentProvider.search()      → SearchResponse { intent, results[], costSats, note? }
  │   (MockAgentProvider  |  RoutstrAgentProvider)
  ▼
PaymentProvider.payInference(costSats)   → meters sats (only when SHOW_ECONOMICS_UI)
  │   (MockPaymentProvider |  CashuPaymentProvider)
  ▼
AssetProvider.decorateAll(results)       → attaches RGB provenance/ownership (only when SHOW_ECONOMICS_UI)
  │   (MockAssetProvider   |  RgbWasmAssetProvider)
  ▼
SpatialLayout.layout()  →  tiered grid of 3D panels, uniform radius
  │      relevance → size/centrality · category → frame colour
  ▼
DrillStack               →  select a panel → spawn its children (recursion)
```

**Mock-first.** Phase 1 (this build) is 100% mock: a canned corpus, a fake
sats meter, an in-memory RGB store. Phase 2 flips three flags in `config.js`
(`USE_LIVE_AGENT`, `USE_LIVE_PAYMENTS`, `USE_LIVE_RGB`) and points
`BACKEND_URL` at a real backend. **Callers are untouched.**

**Static client / secret backend.** The client (this repo → GitHub Pages) only
ever sees normalized `SpatialResult[]`. Any future backend secrets (a Cashu
wallet, an inference-provider key, an RGB-Lightning node) would live off this
repo entirely — the frontend never holds one.

### File map

```
index.html                  import map, HUD overlay DOM + CSS, module entry
src/
  config.js                 flags: RGB_MODEL, SHOW_ECONOMICS_UI, USE_LIVE_*, layout
  schema.js                 SpatialResult / SearchResponse / RgbAsset + the 8 sectors
  main.js                   wiring + render loop (one scene, four modes)
  modeswitcher.js           Screen / VR / AR entry (feature-detected)
  controls.js               one movement+selection path (desktop/mobile/XR)
  environment.js            starfield, grid, fog, lights (Quest-light)
  hud.js                    CSS-overlay HUD: search, breadcrumbs, (economics chips)
  providers/
    AgentProvider.js        mock keyword/intent router + Routstr stub (the "brain")
    PaymentProvider.js      mock Cashu + live stub (the sats loop, off by default)
    AssetProvider.js        mock RGB + rgb-wasm stub (provenance|ownership, off by default)
  content/
    techCorpus.js           the 8-cluster corpus + intent mapping + fallback
  renderer/
    panel.js                one 3D panel (canvas-texture card: meaning, links, maturity)
    layoutMath.js            pure, unit-testable placement math (uniform-radius tiered grid)
    spatialLayout.js        three.js plumbing around layoutMath.js
    drilldown.js            recursive level stack
```

---

## Run it

No build step. Any static server with **HTTPS** (WebXR needs a secure context):

```bash
# option A: Python (screen mode works over http; VR/AR need https)
python3 -m http.server 8000
#   → http://localhost:8000

# option B: https for real VR/AR testing (self-signed)
npx http-server -S -C cert.pem -K key.pem -p 8443
#   → open on the Quest browser at https://<your-LAN-ip>:8443
```

**Controls.** Desktop: click to capture look, WASD to move, click a panel to
drill in, click the center reticle target to select. Mobile: drag to look,
joystick to move, tap to select. VR/AR: point a controller and pull the trigger.

> Headless/preview browsers can't accept self-signed certs, so real *Enter VR* /
> *Enter AR* must be verified on a real Quest and a real phone.

## Sats economics demo layer (off by default)

An earlier build of this repo modeled a full pay-per-inference economy: a
free-trial sats allowance, a 25% platform markup shown on the HUD, a 21-sat
RGB provenance mint fee, insufficient-balance → top-up handling, and an RGB
provenance/ownership toggle. **All of that code is still here and still
correct** (`src/providers/PaymentProvider.js`, `AssetProvider.js`,
`_pipeline.test.mjs`) — it's just not part of the general demo, which is a
plain XR browser: search, constellation, panels, drill, mode switcher.

Turn it back on with **one flag**:

```js
// src/config.js
SHOW_ECONOMICS_UI: true,
```

or load the page with `?economics=on` in the URL. That restores the sats
meter, the top-up button, the RGB toggle chip, and the mint/zap/collect
action bar — layered on the exact same corpus.

## Phase 2 checklist (live)

- [ ] Backend: `/search` → pays a real inference provider, returns `SearchResponse`.
- [ ] Cashu wallet on backend; client melts/mints via `/pay` — no key in client.
- [ ] `@utexo/rgb-sdk-web` (rgb-lib-wasm) in a **Worker** (validation is heavy —
      keep it off the render loop); persist wallet to IndexedDB.
- [ ] RGB-Lightning node (LDK) on backend for asset issuance/transfer.
- [ ] Pick one RGB toolchain deliberately (RGB-WG vs RGB Protocol Association),
      develop on **testnet/regtest**.

## Status

Concept-demo consolidation pass. Corpus generalized from a Bitcoin-only demo
to the 8-cluster "tech behind the spatial web" corpus above; sats economics
layer preserved but off by default.
