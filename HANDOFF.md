# Learn XR in XR — state brief (2026-08-11)

**What this is:** An XR browser with 3D search results — search the tech behind the spatial web, results surround you in a 3D constellation. Curated corpus of ~40 real technologies across 8 clusters (Rendering, Immersion, Real-time, Platform Primitives, Physics & Simulation, Identity & Social, Value & Open Money, The Why). Mock keyword/intent-mapped agent by design, not a live LLM. No build step, static ESM, one link across flat/mobile/VR/AR.

**Live URLs / deploys:** https://developerofwebxr-oss.github.io/learn-in-xr/ — GitHub Pages, workflow-based deploy (`.github/workflows/deploy.yml`, no bundler, rsync copy excluding `.claude/`, `CLAUDE.md`, `HANDOFF.md`, `verification/`, `_pipeline.test.mjs`). Green, serving latest `main`. No backend deployed anywhere — Phase 1 has no live backend, `USE_LIVE_*` flags all `false`.

**Status:**
- Works: full mock pipeline (AgentProvider → SpatialLayout → DrillStack), 8-cluster top-level constellation (browsable pre-search), keyword/intent-mapped search with an honest "mock agent, demo corpus" fallback note for unmapped queries, drill-down, uniform-radius tiered-grid layout (no panel overlap), mode switcher. Every leaf node panel shows a plain-language explainer, 1-2 real links (MDN/W3C/Khronos/project sites), and a maturity tag (STANDARD/SHIPPING/MATURING/EXPERIMENTAL). Verified live in Chrome; screenshot in `verification/` (gitignored, local only).
- The original sats-economics + RGB-provenance demo layer (free-trial allowance, 25% platform fee, mint/zap/collect, RGB toggle) is **fully intact in code** but off by default — gated by `CONFIG.SHOW_ECONOMICS_UI` (or `?economics=on`). All of it is still exercised directly by `_pipeline.test.mjs`.
- Repo hygiene resolved this session: the 2 previously-unpushed local commits (one mis-staged, one with a false "+ tests" claim — see prior brief) are pushed; `_pipeline.test.mjs` was restored and now tests the new corpus; `.claude/settings.local.json` untracked and gitignored.
- Found and fixed live (not caught by local review): a CSS specificity bug where `#action-bar`'s own id-level `display:flex` rule beat the class-based `.econ-hide` hide rule — the Mint button would have reappeared the moment any leaf node was selected, even with economics off. Fixed and reverified live.

**Changed this session:**
- Repo hygiene: restored `_pipeline.test.mjs`, untracked `.claude/settings.local.json`, hardened the Pages workflow's rsync excludes, pushed.
- Full content pivot: replaced `src/content/bitcoinCorpus.js` with `src/content/techCorpus.js` (8 clusters, ~40 nodes, real links, honest maturity tags); rewrote `schema.js` SECTORS for the new clusters; `panel.js` now renders maturity + link labels.
- Added `CONFIG.SHOW_ECONOMICS_UI` (default `false`) gating the sats meter / RGB toggle / mint-zap-collect bar via a CSS class plus skipped payment/decoration calls in `main.js`.
- Rebranded to "Learn XR in XR"; README rewritten for the new framing; notes XRium is a separate project.
- Chrome-verified live: 8 clusters, 2 mapped + 1 unmapped query, drill-down, 3 node panels (links/maturity render correctly), no economics UI visible, clean console.

**Next steps:**
1. None blocking — this pass is complete and deployed green.
2. Consider adding unit tests for `layoutMath.js` (still untested, called out in a prior session's commit).
3. Decide on the XRium repo name/domain question (explicitly deferred, not part of this repo).
4. Phase 2 planning whenever desired: a real backend for `/search`, live economics behind the existing `SHOW_ECONOMICS_UI` flag.

**Open decisions / blockers:** None currently — the XRium naming/domain decision is the only deferred item, and it's out of scope for this repo.

**Infra notes:** GitHub repo `developerofwebxr-oss/learn-in-xr` (Pages enabled, workflow build type). No backend service provisioned anywhere. No wallet/backend credentials exist in this repo — frontend is fully static and mock.
