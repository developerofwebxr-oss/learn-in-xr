// main.js — bootstrap & wiring. One scene, four modes, one link.
//
// Pipeline:  query -> AgentProvider.search() -> PaymentProvider meters sats ->
//            AssetProvider decorates RGB nodes -> SpatialLayout draws the arc ->
//            DrillStack handles recursion -> HUD shows economics + actions.
// The renderer only ever sees SpatialResult[]; swapping mock->live never
// touches anything below AgentProvider/PaymentProvider/AssetProvider.

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { HUD } from './hud.js';
import { ModeSwitcher } from './modeswitcher.js';
import { Controls, IS_MOBILE } from './controls.js';
import { buildEnvironment } from './environment.js';
import { SpatialLayout } from './renderer/spatialLayout.js';
import { DrillStack } from './renderer/drilldown.js';
import { makeAgentProvider } from './providers/AgentProvider.js';
import { makePaymentProvider } from './providers/PaymentProvider.js';
import { makeAssetProvider } from './providers/AssetProvider.js';

// ---- three basics ----------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
buildEnvironment(scene);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 200);
const rig = new THREE.Group();
rig.add(camera);
camera.position.set(0, CONFIG.PANEL_EYE_HEIGHT, 0); // flat mode eye height only
scene.add(rig);

// group that holds all panels (so we can move/clear them as a set)
const world = new THREE.Group();
scene.add(world);

// ---- app services ----------------------------------------------------
const agent = makeAgentProvider();
const payments = makePaymentProvider();
const assets = makeAssetProvider();
const hud = new HUD();
const layout = new SpatialLayout(world);

let selected = null; // currently selected panel group

const drill = new DrillStack(layout, (crumbs) => hud.setCrumbs(crumbs));

// ---- controls: selection + locomotion --------------------------------
const controls = new Controls(
  renderer, camera, rig,
  () => layout.panels,
  {
    onHover: (node) => { /* reticle glow handled in Controls */ },
    onSelect: (group) => selectPanel(group),
  }
);

// ---- mobile gyro free-look toggle (opt-in; drag-look is unaffected) --
if (IS_MOBILE) {
  const gyroBtn = document.getElementById('gyro-toggle');
  gyroBtn.style.display = 'flex';
  gyroBtn.addEventListener('click', async () => {
    if (gyroBtn.classList.contains('disabled')) return;
    // Call directly inside this handler (no prior await) — iOS only honors
    // DeviceOrientationEvent.requestPermission() as a genuine user gesture
    // when it's invoked synchronously from the tap that triggered it.
    const r = await controls.toggleGyro();
    gyroBtn.classList.toggle('active', r.enabled);
    gyroBtn.title = `Gyroscope look (${r.enabled ? 'on' : 'off'})`;
    if (!r.enabled && r.reason === 'denied') {
      gyroBtn.classList.add('disabled');
      gyroBtn.title = 'Gyroscope look (permission denied)';
      hud.toast('Gyroscope permission denied — drag-look still works');
    }
  });
}

// ---- sats/pay-per-inference demo layer --------------------------------
// Fully wired, default OFF (see config.js SHOW_ECONOMICS_UI). The DOM chips
// are CSS-hidden by default (index.html .econ-hide); this class is what
// reveals them again when the flag is on.
document.body.classList.toggle('economics-on', CONFIG.SHOW_ECONOMICS_UI);

payments.on?.('inference', ({ balance }) => hud.setBalance(balance));
payments.on?.('zap', ({ balance }) => hud.setBalance(balance));
payments.on?.('collect', ({ balance }) => hud.setBalance(balance));
payments.on?.('mint', ({ balance }) => hud.setBalance(balance));
payments.on?.('topup', ({ balance }) => hud.setBalance(balance));
payments.on?.('insufficient', ({ needed }) => hud.showInsufficient(needed));
hud.setBalance(payments.balance ?? CONFIG.ECONOMICS.freeTrialAllowance);

const YOUR_NPUB = 'npub1you…mine'; // mock local identity for zap/collect/mint

// ---- the core search flow -------------------------------------------
async function runSearch(query) {
  hud.toast(`Agent thinking…`);
  const resp = await agent.search(query);              // 1. decompose

  let decorated = resp.results;
  let costLine = '';
  if (CONFIG.SHOW_ECONOMICS_UI) {
    const paid = await payments.payInference(resp.costSats); // meter sats + platform fee
    if (!paid.ok) return;                               // insufficient balance — toast shown by HUD
    hud.setLastCost(paid);
    decorated = assets.decorateAll(resp.results);        // RGB provenance/ownership
    costLine = ` · ${paid.total} sats (${paid.base} + ${paid.platformFee} platform)`;
  }
  hud.setIntent(resp.intent);
  drill.setRoot(query || 'Spatial Web', decorated);       // 4. lay out arc
  selectPanel(null);

  // unmapped query -> nearest-cluster fallback note takes priority over the panel-count toast
  hud.toast(resp.note || `${decorated.length} panels${costLine}`);
}

function selectPanel(group) {
  if (selected) selected.userData.setHover(false);
  selected = group;
  if (group) group.userData.setHover(true);
  const node = group?.userData.node || null;

  // Single tap on a concept with children = drill in.
  if (node && node.kind === 'concept' && node.children?.length) {
    drill.enter(node);
    selected = null;
    hud.showAction(null);
    return;
  }
  hud.showAction(node);
}

// ---- HUD actions -----------------------------------------------------
hud.bind({
  onSearch: (q) => runSearch(q),
  onBack: () => { drill.back(); hud.showAction(null); },
  onRgbToggle: () => {
    CONFIG.RGB_MODEL = CONFIG.RGB_MODEL === 'provenance' ? 'ownership' : 'provenance';
    hud.setRgbLabel(CONFIG.RGB_MODEL);
    hud.toast(`RGB model: ${CONFIG.RGB_MODEL}`);
    // re-decorate + re-lay the current level so panels reflect the model
    const top = drill.stack[drill.stack.length - 1];
    if (top) { const d = assets.decorateAll(top.results); top.results = d; layout.layout(d); }
  },
  onAction: async () => {
    const node = selected?.userData.node;
    if (!node) return;
    if (node.rgb?.model === 'ownership') {
      const r = await payments.collect(node);
      if (!r.ok) return;
      node.rgb.ownerNpub = YOUR_NPUB; selected.userData.refresh();
      hud.toast(`Collected · −${r.collected} sats`);
    } else if (node.rgb) {
      const r = await payments.zap(node.rgb.authorNpub, 21);
      if (!r.ok) return;
      node.rgb.zaps = (node.rgb.zaps || 0) + 21; selected.userData.refresh();
      hud.toast(`⚡ Zapped ${node.rgb.authorName} · 21 sats`);
    } else if (node.kind === 'product') {
      hud.toast(`(demo) would pay ${node.priceSats} sats via Lightning`);
    }
  },
  onMint: async () => {
    const top = drill.stack[drill.stack.length - 1];
    if (!top) return;
    const paid = await payments.payProvenanceMint(); // flat 21-sat mint fee
    if (!paid.ok) return;
    hud.toast('Minting structure as RGB UDA…');
    const res = await assets.mintStructure(
      { title: top.title, childIds: top.results.map((r) => r.id) },
      YOUR_NPUB
    );
    hud.toast(`Minted ${res.schema} · minted by ${YOUR_NPUB} · −${paid.paid} sats`);
  },
  onTopUp: async () => {
    const r = await payments.topUp();
    hud.toast(`+${r.topped} sats added (mock top-up)`);
  },
});

// ---- mode switching --------------------------------------------------
new ModeSwitcher(renderer, {
  onEnter: () => { document.getElementById('reticle').style.display = 'none'; },
  onExit: () => { document.getElementById('reticle').style.display = ''; },
});

// ---- resize + loop ---------------------------------------------------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let last = performance.now();
renderer.setAnimationLoop((t) => {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  controls.update(dt);
  layout.update(t);
  renderer.render(scene, camera);
});

// ---- first search on load -------------------------------------------
runSearch(CONFIG.DEFAULT_TOPIC);

// expose for quick console poking during dev
window.LEARN = {
  CONFIG, runSearch, agent, payments, assets, hud, drill, layout, selectPanel,
  renderer, scene, camera, // lets a background/hidden tab force a synchronous
                            // render (rAF is throttled when the tab isn't visible)
};
