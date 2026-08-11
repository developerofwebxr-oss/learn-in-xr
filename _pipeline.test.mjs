// stub browser globals the config module touches at import time
globalThis.location = { search: '' };

const { CONFIG } = await import('./src/config.js');
const { makeAgentProvider } = await import('./src/providers/AgentProvider.js');
const { makePaymentProvider } = await import('./src/providers/PaymentProvider.js');
const { makeAssetProvider } = await import('./src/providers/AssetProvider.js');
const { expandChildren } = await import('./src/content/bitcoinCorpus.js');

const agent = makeAgentProvider();
const pay = makePaymentProvider();
const assets = makeAssetProvider();
let fail = 0; const A = (c,m)=>{ if(!c){console.log('  ✗',m);fail++;} else console.log('  ✓',m); };

// 1. learning search decomposes Bitcoin into a constellation
let r = await agent.search('Bitcoin');
A(r.intent==='learning','learning intent for "Bitcoin"');
A(r.results.length>=8, `${r.results.length} facet panels`);
A(r.costSats>=1, `metered ${r.costSats} sats`);

// 2. payment meter debits balance: base cost + 25% platform markup
const start = pay.balance;
A(start===CONFIG.ECONOMICS.freeTrialAllowance, `free-trial allowance seeded: ${start} sats`);
const quote = pay.quoteInference(r.costSats);
A(quote.platformFee===Math.ceil(r.costSats*0.25), `platform fee ${quote.platformFee} = 25% of ${r.costSats}`);
const paid = await pay.payInference(r.costSats);
A(paid.ok && pay.balance===start-quote.total, `balance ${start}->${pay.balance} (paid ${quote.total} = ${quote.base}+${quote.platformFee} platform)`);
A(pay.devWallet===quote.platformFee, `platform fee skimmed to mock dev wallet: ${pay.devWallet} sats`);

// 2b. insufficient balance -> clean failure + top-up recovers it
pay.balance = 1;
const short = await pay.payInference(r.costSats);
A(short.ok===false && pay.balance===1, 'insufficient balance rejected without partial spend');
const topped = await pay.topUp();
A(topped.ok && pay.balance===1+CONFIG.ECONOMICS.topUpIncrementSats, `top-up recovers balance: ${pay.balance} sats`);

// 2c. provenance mint costs a flat 21 sats
const beforeMint = pay.balance;
const mintPaid = await pay.payProvenanceMint();
A(mintPaid.ok && mintPaid.paid===21 && pay.balance===beforeMint-21, `provenance mint fee: −${mintPaid.paid} sats`);
A(CONFIG.ECONOMICS.ownershipRegistrationFee>CONFIG.ECONOMICS.provenanceMintFee, 'ownership registration fee defined, higher than mint, unused this phase');

// 3. RGB decorate — provenance model
CONFIG.RGB_MODEL='provenance';
let dec = assets.decorateAll(r.results);
let ln = dec.find(n=>n.id==='lightning');
A(ln.rgb && ln.rgb.model==='provenance', 'lightning node has provenance RGB');
A(ln.rgb.authorName && ln.rgb.zaps>=0, `authored by ${ln.rgb.authorName}, zaps=${ln.rgb.zaps}`);

// 4. RGB decorate — ownership model (flag flip, same seam)
CONFIG.RGB_MODEL='ownership';
dec = assets.decorateAll(r.results);
ln = dec.find(n=>n.id==='lightning');
A(ln.rgb.model==='ownership' && ln.rgb.priceSats>0, `ownership: collect for ${ln.rgb.priceSats} sats, owner ${ln.rgb.ownerNpub}`);

// 5. drill-down: lightning children expand
const kids = expandChildren(ln.children);
A(kids.length===3 && kids.every(k=>k&&k.title), `drill into Lightning -> ${kids.map(k=>k.title).join(', ')}`);

// 6. shopping intent routes to product grid
r = await agent.search('Prada shoes');
A(r.intent==='shopping', 'shopping intent for "Prada shoes"');
A(r.results.every(n=>n.kind==='product'&&n.priceSats>0), `${r.results.length} products with sat prices`);

// 7. mint a structure as RGB UDA
const minted = await assets.mintStructure({title:'My Bitcoin map', childIds:['lightning','rgb','cashu']}, 'npub1me');
A(minted.contractId.startsWith('rgb:') && minted.schema==='collection', `minted ${minted.schema} ${minted.contractId}`);

console.log(fail? `\nFAILED ${fail} assertions` : '\nALL PASS');
process.exit(fail?1:0);
