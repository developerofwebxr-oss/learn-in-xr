// layoutMath.js — PURE placement math (no three.js, no DOM) so it can be
// unit-tested headlessly. spatialLayout.js consumes computeGrid() and only
// does the three.js plumbing.
//
// Design goals (the fix):
//   • UNIFORM radius — every panel is the same distance from the viewer, so no
//     panel ever hides behind another. (Depth was the "can't see behind tables"
//     bug; relevance now drives size/emphasis, never depth.)
//   • TIERED grid — when there are more panels than fit cleanly across the
//     comfortable arc, wrap into stacked rows with real vertical gaps, so titles
//     never collide.
//   • Most-relevant CENTERED — slots are visited centre-out so the strongest
//     result sits front-and-centre; edges hold the least-relevant.

/**
 * @param {number} n  number of panels
 * @param {object} p
 * @param {number} p.radius     metres from viewer (uniform)
 * @param {number} p.spreadDeg  usable horizontal arc
 * @param {number} p.panelW     panel width at max scale (metres)
 * @param {number} p.panelH     panel height at max scale (metres)
 * @param {number} p.hGap       min horizontal gap between panels (metres)
 * @param {number} p.vGap       min vertical gap between rows (metres)
 * @param {number} p.maxCols    hard cap on columns per row
 * @param {number} p.eye        eye height (metres) — grid centres here
 * @returns {{angle:number,y:number,row:number,col:number,cols:number,rows:number}[]}
 *   one entry per panel, IN INPUT ORDER (input[0] gets the centre slot).
 */
export function computeGrid(n, p) {
  const { radius, spreadDeg, panelW, panelH, hGap, vGap, maxCols, eye } = p;
  if (n <= 0) return [];

  const spread = (spreadDeg * Math.PI) / 180;

  // Angular spacing so the chord between column centres ≥ panelW + hGap.
  // chord = 2·R·sin(Δ/2)  ⇒  Δ = 2·asin((panelW+hGap)/(2R))
  const colAng = 2 * Math.asin(clamp((panelW + hGap) / (2 * radius), 0, 0.999));
  const colsThatFit = Math.max(1, Math.floor(spread / colAng) + 1);
  const cols = Math.max(1, Math.min(n, maxCols, colsThatFit));
  const rows = Math.ceil(n / cols);
  const rowH = panelH + vGap;

  // How many panels per row (top-heavy is fine); we only need per-row counts to
  // centre each row's columns independently so short rows stay centred.
  const perRow = [];
  let left = n;
  for (let r = 0; r < rows; r++) { const c = Math.min(cols, left); perRow.push(c); left -= c; }

  // Visiting order: centre row first, then outward; within a row, centre col
  // first, then outward. input[0] → most central slot.
  const rowOrder = centreOut(rows);
  const slots = [];
  for (const r of rowOrder) {
    const c = perRow[r];
    const colOrder = centreOut(c);
    const y = eye + ((rows - 1) / 2 - r) * rowH; // row 0 highest
    for (const col of colOrder) {
      const angle = (col - (c - 1) / 2) * colAng; // symmetric about 0
      slots.push({ angle, y, row: r, col, cols: c, rows });
      if (slots.length === n) break;
    }
    if (slots.length === n) break;
  }
  return slots;
}

/** [0,1,2,3,4] -> [2,1,3,0,4] : centre index first, then alternate outward. */
function centreOut(k) {
  const out = [];
  const mid = (k - 1) / 2;
  const order = [];
  for (let i = 0; i < k; i++) order.push(i);
  order.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
  return order;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
