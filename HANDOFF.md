# LEARN in XR — state brief (2026-07-03)

**What this is:** A WebXR spatial learning browser — a search surrounds you with 3D concept panels instead of returning a page. An AI agent decomposes a topic (demo corpus: Bitcoin/Lightning) into a concept constellation; every search meters inference in sats on a HUD; community compositions carry RGB provenance. Phase 1 is fully mock — no build step, static ESM, one link across flat/mobile/VR/AR.

**Live URLs / deploys:** https://developerofwebxr-oss.github.io/learn-in-xr/ — GitHub Pages, workflow-based deploy (`.github/workflows/deploy.yml`, no bundler, straight rsync copy). Currently green, serving commit `3fe97ff`. Backend is Railway in the target architecture but nothing is deployed there yet — Phase 1 has no live backend, `CONFIG.BACKEND_URL` is empty and `USE_LIVE_*` flags are all `false`.

**Status:**
- Works: full mock pipeline (AgentProvider → PaymentProvider → AssetProvider → SpatialLayout → DrillStack), curved-arc concept constellation, drill-down, RGB provenance/ownership toggle, CSS-overlay HUD, mode switcher (Screen/VR/AR), sats economics (free-trial allowance, 25% platform fee shown on HUD, 21-sat provenance mint, insufficient-balance→top-up flow). Verified live in Chrome; screenshots in `verification/` (gitignored, local only).
- Whacky: **repo has 2 local commits not yet pushed to origin** (`6da8f6b`, `3d4eeb2`), made by a session other than this one. `6da8f6b`'s message says "Add sats economics layer" but its actual diff only adds `.claude/settings.local.json` and **deletes `_pipeline.test.mjs`** — message doesn't match contents, looks like a mis-staged commit. Net effect: the project's only test file is currently gone from the repo. `3d4eeb2` ("Fix panel overlap") looks legitimate — adds `src/renderer/layoutMath.js` (pure, unit-testable placement math) and updates `spatialLayout.js` to use uniform-radius tiered grid — but its commit message claims "+ tests" and no test file exists anywhere in the tree.
- The live Pages site does NOT yet reflect these 2 unpushed commits (still serving the pre-layoutMath-fix version).

**Changed this session:**
- Wired origin remote to `github.com/developerofwebxr-oss/learn-in-xr`, pushed scaffold, set up GitHub Pages deploy workflow, confirmed live.
- Implemented sats economics in `PaymentProvider`/`hud.js`/`main.js`: `freeTrialAllowance=30`, `platformFeeBps=2500`, `provenanceMintFee=21`, `ownershipRegistrationFee=210` (defined, deferred/unused), `topUpIncrementSats=500`.
- Added `_pipeline.test.mjs` (non-interactive smoke test) — **now deleted by a later, unpushed commit; needs restoring or replacing.**
- Exposed `window.LEARN.{renderer,scene,camera,drill,layout,selectPanel,hud}` for scripted verification.
- Verified live in Chrome (constellation render, drill-down, cost/platform-split HUD, mint fee + "minted by npub" toast, insufficient-balance/top-up, flat mode) using only JS-driven capture (forced render + `html2canvas` + download-relay via `BroadcastChannel`) — no computer-use tool.

**Next steps:**
1. Decide what to do with the 2 unpushed local commits — at minimum restore/recreate `_pipeline.test.mjs` before pushing `6da8f6b`, since it currently just deletes the test suite under a misleading message.
2. Add real tests for `layoutMath.js` (commit message promises them, none exist).
3. Push cleaned-up history to origin and confirm Pages redeploys with the panel-overlap fix.
4. Re-run Chrome verification against the redeployed site to confirm the layout fix didn't regress drill-down/economics.
5. Start Phase 2 planning: Railway backend stub for `/search`, Cashu wallet, RGB-Lightning node.

**Open decisions / blockers:**
- Should `6da8f6b` be amended/split (keep the settings.local.json, drop the test-file deletion) or reverted entirely? Needs a human call before pushing.
- Whether `.claude/settings.local.json` (a personal tool-permission allowlist) belongs committed to the repo at all.

**Infra notes:** GitHub repo `developerofwebxr-oss/learn-in-xr` (Pages enabled, workflow build type). No Railway service provisioned yet for this project. No wallet/backend credentials exist in this repo — frontend is fully static and mock.
