// stub browser globals the config module touches at import time
globalThis.location = { search: '' };

const { CONFIG } = await import('./src/config.js');
const { makeAgentProvider } = await import('./src/providers/AgentProvider.js');
const { makePaymentProvider } = await import('./src/providers/PaymentProvider.js');
const { makeAssetProvider } = await import('./src/providers/AssetProvider.js');
const { expandChildren, CLUSTER_IDS, CORPUS, TIER_MAX_CHARS } = await import('./src/content/techCorpus.js');

const agent = makeAgentProvider();
const pay = makePaymentProvider();
const assets = makeAssetProvider();
let fail = 0; const A = (c, m) => { if (!c) { console.log('  ✗', m); fail++; } else console.log('  ✓', m); };

// 1. default (blank) query -> the 8-cluster top-level constellation, no fallback note
let r = await agent.search('');
A(r.intent === 'learning', 'always "learning" intent (no shopping in this corpus)');
A(r.results.length === CLUSTER_IDS.length, `${r.results.length} clusters on first load (expected ${CLUSTER_IDS.length})`);
A(!r.note, 'no fallback note on the default blank-query load');
A(r.costSats >= 1, `metered ${r.costSats} sats (economics still computed even though UI is off by default)`);

// 2. exact node-name match
r = await agent.search('WebGPU');
A(r.results.length === 1 && r.results[0].id === 'webgpu', 'exact name match surfaces the single WebGPU node');

// 3. cluster-name match surfaces its children
r = await agent.search('Rendering');
A(r.results.length === 7 && r.results.every((n) => n.category === 'rendering'), 'cluster-name match surfaces all 7 rendering nodes');

// 4. hand-written intent mappings (spot-check a few of the ~10)
r = await agent.search('multiplayer');
A(r.results.map((n) => n.id).sort().join(',') === 'livekit,webrtc,websockets,webtransport', 'intent "multiplayer" -> websockets/webtransport/webrtc/livekit');

r = await agent.search('graphics');
A(r.results.map((n) => n.id).sort().join(',') === 'shaders,threejs,webgl,webgpu', 'intent "graphics" -> webgpu/webgl/threejs/shaders');

r = await agent.search('own my identity');
A(r.results.map((n) => n.id).sort().join(',') === 'activitypub,atproto,nostr', 'intent "own my identity" -> nostr/atproto/activitypub');

// 5. unmapped query -> nearest-cluster fallback with an honest note
r = await agent.search('what should I eat for lunch');
A(!!r.note && r.note.includes('mock agent, demo corpus'), `unmapped query gets an honest fallback note: "${r.note}"`);
A(r.results.length > 0, 'fallback still returns a non-empty nearest cluster');

// 6. every leaf node (no children) carries a maturity tag and 1-2 real links
const leaves = Object.values(CORPUS).filter((n) => !n.children || n.children.length === 0);
A(leaves.length > 30, `${leaves.length} leaf nodes in the corpus`);
const missingLinks = leaves.filter((n) => !n.links || n.links.length < 1 || n.links.length > 2);
A(missingLinks.length === 0, `every leaf node has 1-2 links (${missingLinks.length} missing)`);
const badLinks = leaves.flatMap((n) => n.links).filter((l) => !/^https:\/\//.test(l.url));
A(badLinks.length === 0, 'every link is a real https:// URL');

// 7. drill-down: a cluster's children expand
const kids = expandChildren(CORPUS.realtime.children);
A(kids.length === 4 && kids.every((k) => k && k.title), `drill into Real-time -> ${kids.map((k) => k.title).join(', ')}`);

// 8. economics layer (PaymentProvider) still fully correct — just gated behind
//    CONFIG.SHOW_ECONOMICS_UI at the main.js orchestration layer, not removed
const start = pay.balance;
A(start === CONFIG.ECONOMICS.freeTrialAllowance, `free-trial allowance seeded: ${start} sats`);
const quote = pay.quoteInference(r.costSats);
A(quote.platformFee === Math.ceil(r.costSats * 0.25), `platform fee ${quote.platformFee} = 25% of ${r.costSats}`);
const paid = await pay.payInference(r.costSats);
A(paid.ok && pay.balance === start - quote.total, `balance ${start}->${pay.balance} (paid ${quote.total} = ${quote.base}+${quote.platformFee} platform)`);

pay.balance = 1;
const short = await pay.payInference(r.costSats);
A(short.ok === false && pay.balance === 1, 'insufficient balance rejected without partial spend');
const topped = await pay.topUp();
A(topped.ok && pay.balance === 1 + CONFIG.ECONOMICS.topUpIncrementSats, `top-up recovers balance: ${pay.balance} sats`);

const beforeMint = pay.balance;
const mintPaid = await pay.payProvenanceMint();
A(mintPaid.ok && mintPaid.paid === 21 && pay.balance === beforeMint - 21, `provenance mint fee: −${mintPaid.paid} sats`);
A(CONFIG.ECONOMICS.ownershipRegistrationFee > CONFIG.ECONOMICS.provenanceMintFee, 'ownership registration fee defined, higher than mint, unused this phase');
A(CONFIG.SHOW_ECONOMICS_UI === false, 'sats/RGB UI is off by default for the general demo');

// 9. RGB provenance demo (reachable only when SHOW_ECONOMICS_UI is on) still
//    decorates its two self-referential nodes correctly
CONFIG.RGB_MODEL = 'provenance';
let dec = assets.decorateAll([CORPUS['rgb-protocol'], CORPUS.nostr, CORPUS.webgpu]);
const rgbNode = dec.find((n) => n.id === 'rgb-protocol');
A(rgbNode.rgb && rgbNode.rgb.model === 'provenance', 'rgb-protocol node carries provenance RGB metadata');
A(!dec.find((n) => n.id === 'webgpu').rgb, 'a plain node (webgpu) is left undecorated');

CONFIG.RGB_MODEL = 'ownership';
dec = assets.decorateAll([CORPUS['rgb-protocol']]);
A(dec[0].rgb.model === 'ownership' && dec[0].rgb.priceSats > 0, `ownership model: collect for ${dec[0].rgb.priceSats} sats`);

// 10. mint a structure as RGB UDA (mechanism unchanged, still callable directly)
const minted = await assets.mintStructure({ title: 'My Spatial Web Map', childIds: ['webgpu', 'nostr', 'bitcoin'] }, 'npub1me');
A(minted.contractId.startsWith('rgb:') && minted.schema === 'collection', `minted ${minted.schema} ${minted.contractId}`);

// 11. depth layers: every leaf has t1/t2/t3, no tier exceeds the character
// budget the panel can actually render (see panel.js body text area), and
// t3 is either real sourced traps or the honest "no known traps" fallback —
// never invented filler.
const tierMissing = leaves.filter((n) => !n.tiers || !n.tiers.t2 || !Array.isArray(n.tiers.t3) || n.tiers.t3.length === 0);
A(tierMissing.length === 0, `every leaf node has t1 (body) + t2 + t3 (${tierMissing.length} missing: ${tierMissing.map((n) => n.id).join(', ')})`);

const overBudget = [];
for (const n of leaves) {
  if (n.body.length > TIER_MAX_CHARS) overBudget.push(`${n.id}:t1`);
  if (n.tiers.t2.length > TIER_MAX_CHARS) overBudget.push(`${n.id}:t2`);
  if (n.tiers.t3.join(' ').length > TIER_MAX_CHARS) overBudget.push(`${n.id}:t3`);
}
A(overBudget.length === 0, `no tier exceeds the ${TIER_MAX_CHARS}-char budget (${overBudget.length} over: ${overBudget.join(', ')})`);

const badBulletCount = leaves.filter((n) => n.tiers.t3.length < 1 || n.tiers.t3.length > 5);
A(badBulletCount.length === 0, 't3 has 1-5 bullets on every leaf (2-5 real traps, or exactly one honest "no known traps" line)');

const withTraps = leaves.filter((n) => n.tiers.t3[0] !== 'no known traps documented yet').length;
const withoutTraps = leaves.length - withTraps;
A(withTraps > 0 && withoutTraps > 0, `${withTraps} nodes carry real sourced traps, ${withoutTraps} honestly say none are documented yet`);

// Note: panel.js's tier-cycling (makePanel().userData.cycleTier()) imports
// three.js, which this repo deliberately resolves only via the browser's
// import map (no bundler/node_modules) — same reason nothing else in this
// suite touches src/renderer/*.js. That behavior is verified live in Chrome
// instead (see the task's verification pass), not here.

console.log(fail ? `\nFAILED ${fail} assertions` : '\nALL PASS');
process.exit(fail ? 1 : 0);
