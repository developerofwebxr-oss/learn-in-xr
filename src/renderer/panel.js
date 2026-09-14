// panel.js — build ONE 3D panel from a SpatialResult.
//
// Text is drawn onto a <canvas> and used as a texture: crisp, self-contained,
// no external fonts or images (so it works offline and dodges CORS in the mock).
// The panel is a Group so we can attach a subtle frame + hover glow.

import * as THREE from 'three';
import { SECTORS } from '../schema.js';
import { CONFIG } from '../config.js';

const PANEL_W = 1.0;      // metres
const PANEL_H = 0.66;
const TEX_W = 1024;       // canvas resolution
const TEX_H = Math.round(TEX_W * (PANEL_H / PANEL_W));

/**
 * @param {import('../schema.js').SpatialResult} node
 * @returns {THREE.Group} group with .userData.node and .userData.setHover()
 */
export function makePanel(node) {
  const group = new THREE.Group();
  const hue = SECTORS[node.category]?.hue ?? 0.1;
  const accent = new THREE.Color().setHSL(hue, 0.85, 0.6);

  // --- canvas face ---------------------------------------------------
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W; canvas.height = TEX_H;
  drawFace(canvas, node, accent, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;

  const faceMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), faceMat);
  group.add(face);

  // --- glowing frame (emissive edge) --------------------------------
  const frameGeo = new THREE.PlaneGeometry(PANEL_W * 1.04, PANEL_H * 1.06);
  const frameMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.28 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.z = -0.006;
  group.add(frame);

  group.userData.node = node;
  group.userData.accent = accent;
  group.userData.baseScale = 1;
  group.userData.tier = 0; // 0=meaning(t1) 1=how it works(t2) 2=gotchas(t3)
  group.userData.setHover = (on) => {
    frameMat.opacity = on ? 0.9 : 0.28;
    const s = on ? 1.06 : 1.0;
    group.scale.setScalar(group.userData.baseScale * s);
  };
  // Redraw the face (used after a zap/collect updates the node).
  group.userData.refresh = () => { drawFace(canvas, node, accent, group.userData.tier); tex.needsUpdate = true; };
  // Selecting an already-selected panel calls this to cycle t1 -> t2 -> t3 -> t1.
  // Same handler regardless of input (flat click, mobile tap, in-world laser
  // select) — all three funnel through main.js's selectPanel(), which is the
  // single call site for this. A no-op for nodes with no `tiers` (cluster roots).
  group.userData.cycleTier = () => {
    if (!node.tiers) return false;
    group.userData.tier = (group.userData.tier + 1) % 3;
    drawFace(canvas, node, accent, group.userData.tier);
    tex.needsUpdate = true;
    return true;
  };

  return group;
}

const TIER_LABELS = ['Meaning', 'How it works', 'Gotchas'];

/** Body text for the given tier — t1 falls back to `body` for nodes with no `tiers`. */
function tierBody(node, tier) {
  if (tier === 1 && node.tiers) return node.tiers.t2;
  if (tier === 2 && node.tiers) return node.tiers.t3.map((b) => `• ${b}`).join('   ');
  return node.body || '';
}

function drawFace(canvas, node, accent, tier = 0) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // dark glass background with accent-tinted gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(18,20,28,0.96)');
  g.addColorStop(1, 'rgba(10,11,16,0.96)');
  ctx.fillStyle = g;
  roundRect(ctx, 8, 8, W - 16, H - 16, 34); ctx.fill();

  // accent top bar
  ctx.fillStyle = accent.getStyle();
  roundRect(ctx, 8, 8, W - 16, 14, 8); ctx.fill();

  const pad = 46;
  // emoji glyph
  ctx.font = '96px system-ui, "Segoe UI Emoji", sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(node.emoji || '•', pad, 54);

  // title
  ctx.fillStyle = '#f4f6fb';
  ctx.font = 'bold 62px system-ui, sans-serif';
  wrapText(ctx, node.title, pad + 132, 66, W - pad * 2 - 132, 64, 2);

  // body — swaps per tier; title/footer/links/maturity stay put (task: panel
  // size and position unchanged, tier text re-renders in place)
  ctx.fillStyle = 'rgba(210,216,230,0.9)';
  ctx.font = '38px system-ui, sans-serif';
  wrapText(ctx, tierBody(node, tier), pad, 210, W - pad * 2, 48, 5);

  // ---- tier indicator: three dots (active lit) + label -------------
  if (node.tiers) {
    const dotY = 466;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(pad + 10 + i * 24, dotY, 7, 0, Math.PI * 2);
      ctx.fillStyle = i === tier ? accent.getStyle() : 'rgba(255,255,255,0.22)';
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(210,216,230,0.85)';
    ctx.font = '600 26px system-ui, sans-serif';
    ctx.fillText(TIER_LABELS[tier], pad + 88, dotY - 13);
  }

  // ---- footer: price / RGB provenance / drill hint ----------------
  const footY = H - 96;
  ctx.font = '34px system-ui, sans-serif';

  if (node.kind === 'product' && node.priceSats) {
    ctx.fillStyle = accent.getStyle();
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(`${fmtSats(node.priceSats)} sats`, pad, footY);
  }

  if (node.rgb) {
    const r = node.rgb;
    ctx.fillStyle = 'rgba(255,180,80,0.95)';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('📜 RGB', pad, footY - 40);
    ctx.fillStyle = 'rgba(200,206,220,0.85)';
    ctx.font = '30px system-ui, sans-serif';
    if (r.model === 'ownership') {
      ctx.fillText(`collect · ${fmtSats(r.priceSats)} sats`, pad + 150, footY - 40);
      ctx.fillText(`owner ${r.ownerNpub}`, pad, footY + 8);
    } else {
      ctx.fillText(`by ${r.authorName} · ⚡${fmtSats(r.zaps)}`, pad + 150, footY - 40);
      ctx.fillText(`${r.authorNpub}`, pad, footY + 8);
    }
  } else if (node.maturity || node.links?.length) {
    if (node.maturity) {
      ctx.fillStyle = maturityColor(node.maturity);
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(`● ${node.maturity}`, pad, footY - 38);
    }
    if (node.links?.length) {
      ctx.fillStyle = 'rgba(180,190,210,0.85)';
      ctx.font = '26px system-ui, sans-serif';
      ctx.fillText(`🔗 ${node.links.map((l) => l.label).join(' · ')}`, pad, footY + 8);
    }
  } else if (node.children && node.children.length) {
    ctx.fillStyle = 'rgba(150,160,180,0.8)';
    ctx.fillText(`↳ ${node.children.length} more inside`, pad, footY + 8);
  }
}

function maturityColor(m) {
  switch (m) {
    case 'STANDARD': return 'rgba(120,190,255,0.95)';
    case 'SHIPPING': return 'rgba(120,220,150,0.95)';
    case 'MATURING': return 'rgba(255,200,90,0.95)';
    case 'EXPERIMENTAL': return 'rgba(255,130,120,0.95)';
    default: return 'rgba(200,206,220,0.9)';
  }
}

// ---- small canvas helpers ------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
  const words = String(text).split(' ');
  let line = '', lines = 0;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y); line = w; y += lineH; lines++;
      if (lines >= maxLines - 1) {
        // last line: ellipsize remainder
        let rest = words.slice(words.indexOf(w)).join(' ');
        while (ctx.measureText(rest + '…').width > maxW && rest.length) rest = rest.slice(0, -1);
        ctx.fillText(rest + '…', x, y); return;
      }
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
}
function fmtSats(n) { return (n ?? 0).toLocaleString('en-US'); }

export const PANEL_SIZE = { w: PANEL_W, h: PANEL_H };
