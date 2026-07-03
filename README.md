# LEARN in XR

A **spatial search browser for learning** — built in WebXR/Three.js, runs from a
single link on desktop, mobile, VR (Quest) and AR passthrough.

You ask a question. An **agent** decomposes it into a **concept constellation**
that surrounds you in 3D — position encodes the *shape* of the topic, not a
scroll of links. Every search **meters inference in sats** (the Bitcoin loop),
and community-authored knowledge nodes carry **RGB smart-contract provenance**.

This repo is **Demo 2** in the Sats Arena line. Topic for the first build:
**learning about Bitcoin.**

---

## The core idea (and the wall we designed around)

You *can't* render live cross-origin web pages onto a WebGL surface inside an
immersive session (iframes don't composite into GL; sites block embedding; CSS3D
and DOM-overlay don't survive an immersive XR session). So the agent doesn't
hand you *pages* — it hands you **structured data**, and we render **purpose-built
3D panels**. That's the single decision everything hangs off, and it looks better
than fake browser windows anyway.

The agent's real job is therefore richer than "fetch and show":

- **Intent routing** — "Lightning Network" → learning layout; "Prada shoes" → shopping grid.
- **Decomposition** — one query → a set of facets, each becoming a panel around you.
- **Generation vs fetch** — for learning, clean structured explanations beat scraping.

## The three technologies in the mix

| Layer | What it does | Where it lives |
|---|---|---|
| **Agent (Routstr)** | pay-per-inference; turns a query into `SpatialResult[]` | backend (secret) |
| **Bitcoin (Cashu / Lightning)** | meters each search in sats; zaps authors | backend wallet |
| **RGB** | client-side-validated smart contracts → authored/ownable knowledge nodes (UDAs) | WASM in client + RGB-Lightning node on backend |

## RGB: two models, one seam

`src/config.js` → `RGB_MODEL`:

- **`provenance`** (default) — knowledge stays **freely readable**; the RGB UDA
  proves **authorship**. Panels show `by <author>`, are **zappable**. Wiki-native.
- **`ownership`** — knowledge nodes are **scarce collectibles** with a sats price
  and an owner. Panels show a **Collect** action.

Both run through the same `AssetProvider` and the same renderer. Toggle live with
the **RGB** chip in the HUD, or `?rgb=ownership` in the URL.

---

## Architecture — the swappable seam

The renderer is the **only** consumer of one normalized schema
(`src/schema.js` → `SpatialResult`):

```
query
  │
  ▼
AgentProvider.search()      → SearchResponse { intent, results[], costSats }
  │   (MockAgentProvider  |  RoutstrAgentProvider)
  ▼
PaymentProvider.payInference(costSats)   → meters sats, updates HUD
  │   (MockPaymentProvider |  CashuPaymentProvider)
  ▼
AssetProvider.decorateAll(results)       → attaches RGB provenance/ownership
  │   (MockAssetProvider   |  RgbWasmAssetProvider)
  ▼
SpatialLayout.layout()  →  curved arc of 3D panels
  │      relevance → distance/size · category → angular sector
  ▼
DrillStack               →  select a panel → spawn its children (recursion)
```

**Mock-first (Sats Arena / Demo 3 pattern).** Phase 1 (this build) is 100% mock:
canned Bitcoin corpus, a fake sats meter, an in-memory RGB store. Phase 2 flips
three flags in `config.js` (`USE_LIVE_AGENT`, `USE_LIVE_PAYMENTS`, `USE_LIVE_RGB`)
and points `BACKEND_URL` at Railway. **Callers are untouched.**

**Static client / secret backend.** The client (this repo → GitHub Pages) only
ever sees normalized `SpatialResult[]` and settled payments. The Cashu wallet,
Routstr key, and RGB-Lightning (LDK) node live on Railway. The frontend never
holds a secret.

### File map

```
index.html                  import map, HUD overlay DOM + CSS, module entry
src/
  config.js                 flags: RGB_MODEL, USE_LIVE_*, BACKEND_URL, layout
  schema.js                 SpatialResult / SearchResponse / RgbAsset + sectors
  main.js                   wiring + render loop (one scene, four modes)
  modeswitcher.js           Screen / VR / AR entry (feature-detected)
  controls.js               one movement+selection path (desktop/mobile/XR)
  environment.js            starfield, grid, fog, lights (Quest-light)
  hud.js                    CSS-overlay HUD: search, sats meter, actions
  providers/
    AgentProvider.js        mock + Routstr stub  (the "brain")
    PaymentProvider.js      mock Cashu + live stub (the sats loop)
    AssetProvider.js        mock RGB + rgb-wasm stub (provenance|ownership)
  content/
    bitcoinCorpus.js        canned decomposition + authored RGB nodes
  renderer/
    panel.js                one 3D panel (canvas-texture card + RGB badge)
    spatialLayout.js        arc placement from relevance/category
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

**Try:** `Bitcoin` (default), `Lightning Network`, `RGB`, `keys`, and
`Prada shoes` (shopping intent). Toggle the **RGB** chip to flip provenance ↔
ownership and watch the panels + action bar change.

> Headless/preview browsers can't accept self-signed certs, so real *Enter VR* /
> *Enter AR* must be verified on a real Quest and a real phone.

---

## Phase 2 checklist (live)

- [ ] Railway backend: `/search` → pays Routstr, returns `SearchResponse`.
- [ ] Cashu wallet on backend; client melts/mints via `/pay` — no key in client.
- [ ] `@utexo/rgb-sdk-web` (rgb-lib-wasm) in a **Worker** (validation is heavy —
      keep it off the render loop); persist wallet to IndexedDB.
- [ ] RGB-Lightning node (LDK) on backend for asset issuance/transfer.
- [ ] Pick one RGB toolchain deliberately (RGB-WG vs RGB Protocol Association),
      develop on **testnet/regtest**.

## Status

Phase 1 — playable mock. Demo 2 of the Sats Arena line. (Prague WebXR → Demo 7.)
