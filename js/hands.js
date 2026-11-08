// Vector hand designer & Dial Numerals system:
// 1. Draws analog hands (and the centre cap) into Noise sprites (pure maths, works in browser & Node).
// 2. Draws customizable Dial Numerals & Hour Markers onto the watch dial canvas.
import { SPRITE_W, SPRITE_H, PIVOT_X, PIVOT_Y } from './sprite.js';

const TAU = Math.PI * 2;
const SS = 4; // vertical sub-scanlines per pixel (horizontal coverage is exact)

export const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const rgb2hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (c, f) => c.map(v => Math.max(0, Math.min(255, v * f)));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// ---------------------------------------------------------------- rasterizer
/**
 * layers: [{ paths: [[x,y],...][], fill: [r,g,b] | {grad:[c1,c2], axis:'x'|'y', from, to}, alpha?: 0..1 }]
 * Coordinates are "hand space": origin = pivot, hand points UP (negative y). Even-odd fill, so holes are just extra paths.
 * Returns { w, h, mask, rgb } ready for encodeSprite().
 */
export function rasterize(layers, angleDeg = 0, o = {}) {
  const w = o.w ?? SPRITE_W, h = o.h ?? SPRITE_H, px = o.px ?? PIVOT_X, py = o.py ?? PIVOT_Y;
  const n = w * h;
  const A = new Float32Array(n), R = new Float32Array(n), G = new Float32Array(n), B = new Float32Array(n);
  const th = angleDeg * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
  for (const L of layers) {
    const edges = [];
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const path of L.paths) {
      const pts = path.map(([x, y]) => [px + x * c - y * s, py + x * s + y * c]);
      for (const [X, Y] of pts) { minX = Math.min(minX, X); maxX = Math.max(maxX, X); minY = Math.min(minY, Y); maxY = Math.max(maxY, Y); }
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[(i + 1) % pts.length];
        if (p[1] === q[1]) continue;
        edges.push(p[1] < q[1] ? [p[0], p[1], q[0], q[1]] : [q[0], q[1], p[0], p[1]]);
      }
    }
    const x0 = Math.max(0, Math.floor(minX)), x1 = Math.min(w - 1, Math.ceil(maxX));
    const y0 = Math.max(0, Math.floor(minY)), y1 = Math.min(h - 1, Math.ceil(maxY));
    if (x1 < x0 || y1 < y0) continue;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const cov = new Float32Array(bw * bh);
    for (let yy = y0; yy <= y1; yy++) {
      for (let sub = 0; sub < SS; sub++) {
        const sy = yy + (sub + 0.5) / SS, xs = [];
        for (const e of edges) if (sy >= e[1] && sy < e[3]) xs.push(e[0] + (sy - e[1]) * (e[2] - e[0]) / (e[3] - e[1]));
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
          const a = Math.max(xs[i], x0), b = Math.min(xs[i + 1], x1 + 1);
          if (b <= a) continue;
          const ia = Math.floor(a), ib = Math.min(Math.floor(b), x1), row = (yy - y0) * bw - x0;
          if (ia === ib) cov[row + ia] += (b - a) / SS;
          else {
            cov[row + ia] += (ia + 1 - a) / SS;
            for (let x = ia + 1; x < ib; x++) cov[row + x] += 1 / SS;
            cov[row + ib] += (b - ib) / SS;
          }
        }
      }
    }
    const f = L.fill, flat = Array.isArray(f), la = L.alpha ?? 1;
    let g0 = 0, g1 = 1;
    if (!flat) { g0 = f.from; g1 = f.to; }
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      const cv = cov[(yy - y0) * bw + xx - x0];
      if (cv <= 0.002) continue;
      const a = Math.min(1, cv) * la;
      let col = f;
      if (!flat) {
        const dx = xx + 0.5 - px, dy = yy + 0.5 - py;
        const v = f.axis === 'y' ? -dx * s + dy * c : dx * c + dy * s;
        col = mix(f.grad[0], f.grad[1], Math.max(0, Math.min(1, (v - g0) / (g1 - g0 || 1))));
      }
      const i = yy * w + xx, ia = 1 - a;
      A[i] = a + A[i] * ia; R[i] = col[0] * a + R[i] * ia; G[i] = col[1] * a + G[i] * ia; B[i] = col[2] * a + B[i] * ia;
    }
  }
  const maxR2 = (o.maxRadius ?? 114) ** 2;
  const mask = new Uint8Array(n).fill(255), rgb = new Uint16Array(n);
  for (let yy = 0; yy < h - 1; yy++) {
    const dy = yy - py, dy2 = dy * dy;
    for (let xx = 0; xx < w; xx++) {
      const dx = xx - px;
      if (dx * dx + dy2 > maxR2) continue;
      const i = yy * w + xx;
      const a8 = Math.round(A[i] * 255);
      if (a8 < 24) continue;
      // Quantize alpha to 3 hardware levels so adjacent pixels coalesce into long contiguous spans
      const qA = a8 >= 200 ? 255 : a8 >= 115 ? 170 : 95;
      const k = 1 / A[i];
      const r = Math.min(255, R[i] * k), g = Math.min(255, G[i] * k), b = Math.min(255, B[i] * k);
      mask[i] = 255 - qA;
      rgb[i] = ((Math.round(r) >> 3) << 11) | ((Math.round(g) >> 2) << 5) | (Math.round(b) >> 3);
    }
  }
  return { w, h, mask, rgb };
}

// ---------------------------------------------------------------- shapes
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const circle = (cx, cy, r, k = 32) => Array.from({ length: k }, (_, i) => [cx + r * Math.cos(i / k * TAU), cy + r * Math.sin(i / k * TAU)]);
const rot = (pts, deg, cx = 0, cy = 0) => { const t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); };
function capsule(hw, yTop, yBot, k = 10) {
  const out = [], tc = yTop + hw, bc = yBot - hw;
  for (let i = 0; i <= k; i++) { const a = Math.PI + i / k * Math.PI; out.push([hw * Math.cos(a), tc + hw * Math.sin(a)]); }
  for (let i = 0; i <= k; i++) { const a = i / k * Math.PI; out.push([hw * Math.cos(a), bc + hw * Math.sin(a)]); }
  return out;
}
const leaf = (cy0, cy1, hw, k = 18) => {
  const left = [], right = [];
  for (let i = 0; i <= k; i++) { const t = i / k, y = cy0 + (cy1 - cy0) * t, x = hw * Math.pow(Math.sin(Math.PI * t), 0.85); left.push([-x, y]); right.unshift([x, y]); }
  return left.concat(right);
};
const gradX = (c1, c2, hw) => ({ grad: [c1, c2], axis: 'x', from: -hw, to: hw });

// ---------------------------------------------------------------- hand styles
// Each builder gets a spec {len, w, tail, color, lume} and returns layers for a hand pointing up.
export const HAND_STYLES = {
  baton: {
    label: 'Baton',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [rect(-w / 2, -len, w / 2, tail)], fill: shade(color, 0.42) },
      { paths: [rect(-w / 2 + 1.1, -len + 1.1, w / 2 - 1.1, tail - 1.1)], fill: gradX(shade(color, 1.12), shade(color, 0.82), w / 2) },
      { paths: [rect(-w * 0.2, -len * 0.92, w * 0.2, -len * 0.16)], fill: lume },
    ],
  },
  sword: {
    label: 'Sword',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [[[-w / 2, tail], [-w / 2, -len * 0.3], [0, -len], [w / 2, -len * 0.3], [w / 2, tail]]], fill: shade(color, 0.4) },
      { paths: [[[-w / 2 + 1, tail - 1], [-w / 2 + 1, -len * 0.3], [0, -len + 2.5], [0, tail - 1]]], fill: shade(color, 1.1) },
      { paths: [[[w / 2 - 1, tail - 1], [w / 2 - 1, -len * 0.3], [0, -len + 2.5], [0, tail - 1]]], fill: shade(color, 0.72) },
      { paths: [[[-w * 0.17, -len * 0.22], [0, -len * 0.86], [w * 0.17, -len * 0.22], [0, -len * 0.1]]], fill: lume },
    ],
  },
  dauphine: {
    label: 'Dauphine',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [[[-w / 2, tail], [0, -len], [w / 2, tail]]], fill: shade(color, 0.4) },
      { paths: [[[-w / 2 + 1, tail - 0.8], [0, -len + 3], [0, tail - 0.8]]], fill: shade(color, 1.15) },
      { paths: [[[w / 2 - 1, tail - 0.8], [0, -len + 3], [0, tail - 0.8]]], fill: shade(color, 0.7) },
      { paths: [[[-w * 0.12, -len * 0.18], [0, -len * 0.78], [w * 0.12, -len * 0.18]]], fill: lume },
    ],
  },
  leaf: {
    label: 'Leaf',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [rect(-w * 0.16, -len, w * 0.16, tail)], fill: shade(color, 0.9) },
      { paths: [leaf(-len * 0.26, -len * 0.84, w * 0.78)], fill: shade(color, 0.45) },
      { paths: [leaf(-len * 0.3, -len * 0.8, w * 0.62)], fill: gradX(shade(color, 1.12), shade(color, 0.8), w * 0.6) },
      { paths: [leaf(-len * 0.38, -len * 0.7, w * 0.3)], fill: lume },
    ],
  },
  skeleton: {
    label: 'Skeleton',
    build: ({ len, w, tail, color }) => [{
      paths: [
        [[-w / 2, tail], [-w / 2, -len * 0.3], [0, -len], [w / 2, -len * 0.3], [w / 2, tail]],
        [[-w / 2 + 1.8, tail - 1.8], [-w / 2 + 1.8, -len * 0.3], [0, -len + 6], [w / 2 - 1.8, -len * 0.3], [w / 2 - 1.8, tail - 1.8]],
      ], fill: color,
    }],
  },
  line: {
    label: 'Thin line',
    build: ({ len, w, tail, color }) => [{ paths: [rect(-Math.max(1, w / 4), -len, Math.max(1, w / 4), tail)], fill: color }],
  },
  neon: {
    label: 'Neon glow',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [capsule(w * 1.0, -len - w * 0.3, tail + w * 0.3)], fill: color, alpha: 0.2 },
      { paths: [capsule(w * 0.55, -len, tail)], fill: color, alpha: 0.55 },
      { paths: [capsule(w * 0.24, -len + w * 0.3, tail - w * 0.3)], fill: lume },
    ],
  },
  breguet: {
    label: 'Breguet',
    build: ({ len, w, tail, color }) => {
      const cy = -len * 0.8, R = w * 0.95;
      return [
        { paths: [rect(-w * 0.15, cy, w * 0.15, tail)], fill: color },
        { paths: [circle(0, cy, R), circle(0, cy, R * 0.58)], fill: color },
        { paths: [[[-w * 0.15, cy - R + 1], [w * 0.15, cy - R + 1], [0, -len]]], fill: color },
      ];
    },
  },
  arrow: {
    label: 'Arrow',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [rect(-w * 0.3, -len * 0.78, w * 0.3, tail)], fill: color },
      { paths: [[[-w * 0.85, -len * 0.74], [0, -len], [w * 0.85, -len * 0.74]]], fill: color },
      { paths: [rect(-w * 0.1, -len * 0.7, w * 0.1, -len * 0.14)], fill: lume },
    ],
  },
  mercedes: {
    label: 'Mercedes',
    build: ({ len, w, tail, color, lume }) => {
      const cy = -len * 0.74, R = w * 1.15;
      const spokes = [0, 120, 240].map(a => rot(rect(-0.9, -R + 1.6, 0.9, 0), a, 0, 0).map(([x, y]) => [x, y + cy]));
      return [
        { paths: [rect(-w * 0.14, -len, w * 0.14, tail)], fill: color },
        { paths: [circle(0, cy, R), circle(0, cy, R - 1.7)], fill: color },
        ...spokes.map(p => ({ paths: [p], fill: color })),
        { paths: [circle(0, cy, 1.5)], fill: lume },
      ];
    },
  },
  capsule: {
    label: 'Capsule',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [capsule(w / 2, -len, tail)], fill: gradX(shade(color, 1.05), shade(color, 0.8), w / 2) },
      { paths: [capsule(Math.max(1, w * 0.14), -len + w * 0.55, -len * 0.45)], fill: lume },
    ],
  },
  // ---- New Hand Styles ----
  cathedral: {
    label: 'Cathedral (Pilot)',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [[[-w * 0.26, tail], [-w * 0.58, -len * 0.38], [-w * 0.65, -len * 0.72], [0, -len], [w * 0.65, -len * 0.72], [w * 0.58, -len * 0.38], [w * 0.26, tail]]], fill: shade(color, 0.45) },
      { paths: [[[-w * 0.18, tail - 1], [-w * 0.44, -len * 0.38], [-w * 0.5, -len * 0.7], [0, -len + 3], [w * 0.5, -len * 0.7], [w * 0.44, -len * 0.38], [w * 0.18, tail - 1]]], fill: color },
      { paths: [[[-w * 0.32, -len * 0.4], [-w * 0.36, -len * 0.66], [w * 0.36, -len * 0.66], [w * 0.32, -len * 0.4]]], fill: lume },
      { paths: [[[-w * 0.28, -len * 0.7], [0, -len * 0.9], [w * 0.28, -len * 0.7]]], fill: lume },
    ],
  },
  snowflake: {
    label: 'Snowflake (Diver)',
    build: ({ len, w, tail, color, lume }) => {
      const cy = -len * 0.68, ds = w * 1.05;
      return [
        { paths: [rect(-w * 0.26, -len * 0.85, w * 0.26, tail)], fill: color },
        { paths: [[[0, cy - ds], [ds, cy], [0, cy + ds], [-ds, cy]]], fill: color },
        { paths: [[[-w * 0.38, -len * 0.82], [0, -len], [w * 0.38, -len * 0.82]]], fill: color },
        { paths: [[[0, cy - ds * 0.64], [ds * 0.64, cy], [0, cy + ds * 0.64], [-ds * 0.64, cy]]], fill: lume },
        { paths: [rect(-w * 0.11, -len * 0.52, w * 0.11, -len * 0.16)], fill: lume },
      ];
    },
  },
  syringe: {
    label: 'Syringe (Chrono)',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [rect(-w * 0.1, -len, w * 0.1, tail)], fill: color },
      { paths: [capsule(w * 0.48, -len * 0.78, -len * 0.16)], fill: shade(color, 0.45) },
      { paths: [capsule(w * 0.38, -len * 0.75, -len * 0.19)], fill: color },
      { paths: [capsule(w * 0.2, -len * 0.71, -len * 0.23)], fill: lume },
    ],
  },
  lance: {
    label: 'Faceted Lance',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [[[-w * 0.22, tail], [-w * 0.56, -len * 0.26], [0, -len], [w * 0.56, -len * 0.26], [w * 0.22, tail]]], fill: shade(color, 0.42) },
      { paths: [[[-w * 0.16, tail - 1], [-w * 0.46, -len * 0.26], [0, -len + 2.5], [0, tail - 1]]], fill: shade(color, 1.15) },
      { paths: [[[w * 0.16, tail - 1], [w * 0.46, -len * 0.26], [0, -len + 2.5], [0, tail - 1]]], fill: shade(color, 0.74) },
      { paths: [[[-w * 0.16, -len * 0.26], [0, -len * 0.72], [w * 0.16, -len * 0.26]]], fill: lume },
    ],
  },
  tuning: {
    label: 'Twin Rail (Cyber)',
    build: ({ len, w, tail, color, lume }) => [
      { paths: [rect(-w * 0.48, -len * 0.85, -w * 0.18, tail), rect(w * 0.18, -len * 0.85, w * 0.48, tail)], fill: color },
      { paths: [[[-w * 0.48, -len * 0.85], [0, -len], [w * 0.48, -len * 0.85], [w * 0.18, -len * 0.78], [-w * 0.18, -len * 0.78]]], fill: lume },
    ],
  },
};

export const SECOND_STYLES = {
  line: { label: 'Line + tail', build: ({ len, tail, color }) => [{ paths: [rect(-0.9, -len, 0.9, tail)], fill: color }, { paths: [rect(-2.2, tail - 8, 2.2, tail)], fill: color }] },
  lollipop: { label: 'Lollipop', build: ({ len, tail, color }) => [{ paths: [rect(-0.8, -len * 0.8, 0.8, tail)], fill: color }, { paths: [circle(0, -len * 0.84, 4.4), circle(0, -len * 0.84, 1.8)], fill: color }] },
  needle: { label: 'Needle', build: ({ len, tail, color }) => [{ paths: [[[-1.6, tail], [0, -len], [1.6, tail]]], fill: color }] },
  arrow: { label: 'Arrow', build: ({ len, tail, color }) => [{ paths: [rect(-0.8, -len * 0.82, 0.8, tail)], fill: color }, { paths: [[[-3, -len * 0.8], [0, -len], [3, -len * 0.8]]], fill: color }] },
  glow: { label: 'Glow', build: ({ len, tail, color }) => [{ paths: [capsule(3.2, -len, tail)], fill: color, alpha: 0.2 }, { paths: [capsule(1.7, -len, tail)], fill: color, alpha: 0.55 }, { paths: [rect(-0.6, -len, 0.6, tail)], fill: [255, 255, 255] }] },
  trident: {
    label: 'Counterweight ring',
    build: ({ len, tail, color }) => [
      { paths: [rect(-0.85, -len, 0.85, tail * 0.65)], fill: color },
      { paths: [circle(0, tail * 0.82, 4.2), circle(0, tail * 0.82, 2.0)], fill: color },
      { paths: [[[-2.4, -len * 0.86], [0, -len], [2.4, -len * 0.86]]], fill: [255, 255, 255] },
    ],
  },
  none: { label: 'Hidden', build: () => [{ paths: [circle(0, 0, 0.6)], fill: [0, 0, 0], alpha: 0.05 }] },
};

export const CAP_STYLES = {
  dot: { label: 'Dot', build: ({ color, accent }) => [{ paths: [circle(0, 0, 6)], fill: color }, { paths: [circle(0, 0, 2.2)], fill: accent }] },
  ring: { label: 'Ring', build: ({ color, accent }) => [{ paths: [circle(0, 0, 7.5), circle(0, 0, 4.6)], fill: color }, { paths: [circle(0, 0, 2.4)], fill: accent }] },
  disc: { label: 'Big disc', build: ({ color, accent }) => [{ paths: [circle(0, 0, 9.5)], fill: shade(color, 0.55) }, { paths: [circle(0, 0, 8)], fill: color }, { paths: [circle(0, 0, 3)], fill: accent }] },
  pin: { label: 'Pin', build: ({ color }) => [{ paths: [circle(0, 0, 2.8)], fill: color }] },
};

// ---------------------------------------------------------------- sets
// A "design" is plain JSON: { hour:{style,len,w,tail,color,lume}, minute:{...}, second:{style,len,tail,color}, cap:{style,color,accent} }
export const HAND_PRESETS = {
  // ---- Original 10 presets (preserved as-is) ----
  swiss: { name: 'Swiss classic',
    hour: { style: 'baton', len: 54, w: 9, tail: 12, color: '#f1f3f8', lume: '#b6ffcb' },
    minute: { style: 'baton', len: 86, w: 7, tail: 12, color: '#f1f3f8', lume: '#b6ffcb' },
    second: { style: 'lollipop', len: 100, tail: 24, color: '#ef4444' },
    cap: { style: 'dot', color: '#f1f3f8', accent: '#ef4444' } },
  dress: { name: 'Gold dauphine',
    hour: { style: 'dauphine', len: 54, w: 11, tail: 10, color: '#e5c06b', lume: '#fff3c4' },
    minute: { style: 'dauphine', len: 88, w: 9, tail: 10, color: '#e5c06b', lume: '#fff3c4' },
    second: { style: 'needle', len: 100, tail: 22, color: '#e5c06b' },
    cap: { style: 'ring', color: '#e5c06b', accent: '#1f1a0e' } },
  sport: { name: 'Sport sword',
    hour: { style: 'sword', len: 56, w: 11, tail: 12, color: '#e8ecf4', lume: '#9bffb0' },
    minute: { style: 'sword', len: 90, w: 9, tail: 12, color: '#e8ecf4', lume: '#9bffb0' },
    second: { style: 'arrow', len: 104, tail: 24, color: '#fb923c' },
    cap: { style: 'disc', color: '#e8ecf4', accent: '#fb923c' } },
  merc: { name: 'Mercedes',
    hour: { style: 'mercedes', len: 56, w: 8, tail: 12, color: '#f5f5f5', lume: '#a7ffc0' },
    minute: { style: 'baton', len: 88, w: 6, tail: 12, color: '#f5f5f5', lume: '#a7ffc0' },
    second: { style: 'line', len: 102, tail: 24, color: '#f43f5e' },
    cap: { style: 'ring', color: '#f5f5f5', accent: '#f43f5e' } },
  neon: { name: 'Neon cyber',
    hour: { style: 'neon', len: 52, w: 3.4, tail: 8, color: '#22d3ee', lume: '#ecfeff' },
    minute: { style: 'neon', len: 86, w: 3, tail: 8, color: '#22d3ee', lume: '#ecfeff' },
    second: { style: 'glow', len: 100, tail: 18, color: '#f0abfc' },
    cap: { style: 'dot', color: '#22d3ee', accent: '#ffffff' } },
  capsule: { name: 'Capsule (modern)',
    hour: { style: 'capsule', len: 56, w: 11, tail: 14, color: '#ffffff', lume: '#d1d5db' },
    minute: { style: 'capsule', len: 88, w: 9, tail: 14, color: '#ffffff', lume: '#d1d5db' },
    second: { style: 'line', len: 100, tail: 22, color: '#fb923c' },
    cap: { style: 'disc', color: '#ffffff', accent: '#fb923c' } },
  skeleton: { name: 'Skeleton',
    hour: { style: 'skeleton', len: 54, w: 11, tail: 12, color: '#e5e7eb', lume: '#e5e7eb' },
    minute: { style: 'skeleton', len: 88, w: 9, tail: 12, color: '#e5e7eb', lume: '#e5e7eb' },
    second: { style: 'needle', len: 100, tail: 22, color: '#ef4444' },
    cap: { style: 'ring', color: '#e5e7eb', accent: '#ef4444' } },
  minimal: { name: 'Minimal lines',
    hour: { style: 'line', len: 50, w: 6, tail: 8, color: '#ffffff', lume: '#ffffff' },
    minute: { style: 'line', len: 84, w: 5, tail: 8, color: '#ffffff', lume: '#ffffff' },
    second: { style: 'line', len: 98, tail: 20, color: '#f97316' },
    cap: { style: 'pin', color: '#f97316', accent: '#f97316' } },
  breguet: { name: 'Breguet blue',
    hour: { style: 'breguet', len: 54, w: 9, tail: 10, color: '#60a5fa', lume: '#ffffff' },
    minute: { style: 'breguet', len: 88, w: 8, tail: 10, color: '#60a5fa', lume: '#ffffff' },
    second: { style: 'lollipop', len: 100, tail: 22, color: '#93c5fd' },
    cap: { style: 'dot', color: '#60a5fa', accent: '#0b1220' } },
  leaf: { name: 'Leaf (alpha)',
    hour: { style: 'leaf', len: 54, w: 9, tail: 10, color: '#f3f4f6', lume: '#bbf7d0' },
    minute: { style: 'leaf', len: 88, w: 8, tail: 10, color: '#f3f4f6', lume: '#bbf7d0' },
    second: { style: 'arrow', len: 100, tail: 22, color: '#84cc16' },
    cap: { style: 'dot', color: '#f3f4f6', accent: '#84cc16' } },

  // ---- New Hand Presets ----
  pilot: { name: 'Pilot cathedral',
    hour: { style: 'cathedral', len: 54, w: 12, tail: 11, color: '#e2e8f0', lume: '#fde68a' },
    minute: { style: 'cathedral', len: 86, w: 9.5, tail: 11, color: '#e2e8f0', lume: '#fde68a' },
    second: { style: 'trident', len: 100, tail: 22, color: '#ef4444' },
    cap: { style: 'disc', color: '#e2e8f0', accent: '#ef4444' } },
  diver: { name: 'Diver snowflake',
    hour: { style: 'snowflake', len: 54, w: 10, tail: 11, color: '#f8fafc', lume: '#67e8f9' },
    minute: { style: 'sword', len: 88, w: 8.5, tail: 11, color: '#f8fafc', lume: '#67e8f9' },
    second: { style: 'lollipop', len: 100, tail: 22, color: '#fb7185' },
    cap: { style: 'ring', color: '#f8fafc', accent: '#fb7185' } },
  chrono: { name: 'Racing syringe',
    hour: { style: 'syringe', len: 56, w: 11, tail: 12, color: '#f1f5f9', lume: '#fef08a' },
    minute: { style: 'syringe', len: 90, w: 9, tail: 12, color: '#f1f5f9', lume: '#fef08a' },
    second: { style: 'trident', len: 102, tail: 24, color: '#ef4444' },
    cap: { style: 'dot', color: '#ef4444', accent: '#ffffff' } },
  royal: { name: 'Rose gold lance',
    hour: { style: 'lance', len: 55, w: 11, tail: 11, color: '#f4b895', lume: '#fff7ed' },
    minute: { style: 'lance', len: 88, w: 9, tail: 11, color: '#f4b895', lume: '#fff7ed' },
    second: { style: 'needle', len: 100, tail: 22, color: '#f4b895' },
    cap: { style: 'ring', color: '#f4b895', accent: '#1c1917' } },
  cyber_rail: { name: 'Twin rail cyber',
    hour: { style: 'tuning', len: 54, w: 10, tail: 12, color: '#94a3b8', lume: '#22d3ee' },
    minute: { style: 'tuning', len: 88, w: 8.5, tail: 12, color: '#94a3b8', lume: '#22d3ee' },
    second: { style: 'arrow', len: 100, tail: 22, color: '#f43f5e' },
    cap: { style: 'disc', color: '#22d3ee', accent: '#0f172a' } },
  bauhaus_h: { name: 'Bauhaus geo',
    hour: { style: 'line', len: 52, w: 9, tail: 14, color: '#facc15', lume: '#facc15' },
    minute: { style: 'line', len: 86, w: 7, tail: 14, color: '#38bdf8', lume: '#38bdf8' },
    second: { style: 'lollipop', len: 98, tail: 22, color: '#ef4444' },
    cap: { style: 'dot', color: '#ef4444', accent: '#ffffff' } },
};

export const defaultHands = () => structuredClone(HAND_PRESETS.swiss);

export function handLayers(kind, d) {
  const spec = { ...d, color: hex2rgb(d.color), lume: hex2rgb(d.lume ?? d.color), accent: hex2rgb(d.accent ?? d.color) };
  const table = kind === 'second' ? SECOND_STYLES : kind === 'cap' ? CAP_STYLES : HAND_STYLES;
  return (table[d.style] || Object.values(table)[0]).build(spec);
}

/** raster of one hand at an exact angle (degrees clockwise from 12 o'clock) */
export const drawHand = (kind, design, angle) => rasterize(handLayers(kind, design[kind]), angle);
/** the 16 sprites (0..90 degrees in 6 degree steps) a face file needs for one hand */
export const handFrames = (kind, design, extra = []) => {
  const L = [...extra, ...handLayers(kind, design[kind])];
  return Array.from({ length: 16 }, (_, i) => rasterize(L, i * 6));
};
export const capSprite = design => rasterize(handLayers('cap', design.cap), 0);

// ============================================================================
// PART 2: Separate Dial Numerals & Hour Markers System (for Analog Watchfaces)
// ============================================================================

export const DIAL_STYLES = {
  none: { name: 'Clean (No Numerals)', label: 'Clean (No Numerals)', badge: 'Clean', desc: 'Background only, no added dial numbers or ticks.' },
  arabic_full: { name: 'Full Arabic 1–12', label: 'Full Arabic 1–12', badge: '1–12', desc: 'All 12 Arabic hour numbers with a 60-minute perimeter track.' },
  arabic_quarter: { name: '12 · 3 · 6 · 9 Sport', label: '12 · 3 · 6 · 9 Sport', badge: 'Sport', desc: 'Bold quarter numerals with baton markers at intermediate hours.' },
  roman: { name: 'Classic Roman I–XII', label: 'Classic Roman I–XII', badge: 'Roman', desc: 'Luxury Roman numerals around the dial with an inner railroad ring.' },
  roman_quarter: { name: 'Roman Quarters', label: 'Roman Quarters', badge: 'Luxury', desc: 'XII · III · VI · IX in serif with diamond hour indices.' },
  baton_minimal: { name: 'Minimalist Batons', label: 'Minimalist Batons', badge: 'Swiss', desc: 'Clean Swiss double-baton at 12 and slim hour indices.' },
  pilot_flieger: { name: 'Pilot 05–55 Avionics', label: 'Pilot 05–55 Avionics', badge: 'Pilot', desc: 'Flieger triangle at 12 with 05..55 two-digit aviation scale.' },
  california: { name: 'California Dial', label: 'California Dial', badge: 'Retro', desc: 'Iconic half-Roman (top) and half-Arabic (bottom) vintage dial.' },
  diver_dots: { name: 'Pro Diver Lume', label: 'Pro Diver Lume', badge: 'Diver', desc: 'Bold 12 o’clock triangle, 3/6/9 batons, and luminous dot indices.' },
  chrono_60: { name: 'Racing Tachymeter', label: 'Racing Tachymeter', badge: 'GT 60', desc: 'Redline 0–15 sector with 60-second numbers and slanted markers.' },
  bauhaus_dial: { name: 'Bauhaus Minimal', label: 'Bauhaus Minimal', badge: 'Bauhaus', desc: 'Ultra-thin hairlines, fine dots, and geometric even-hour numbers.' },
  stencil_x: { name: 'Oversized 12 & 06', label: 'Oversized 12 & 06', badge: 'Big 12/06', desc: 'Large bold 12 and 06 numerals with precision crosshair ticks.' },
  field_24h: { name: 'Military Field 12/24h', label: 'Military Field 12/24h', badge: '24H Field', desc: 'Outer 1–12 bold numerals with inner 13–24 military ring.' },
  cyber_hud: { name: 'Cyber Mecha Telemetry', label: 'Cyber Mecha Telemetry', badge: 'Cyber', desc: 'Futuristic segmented neon HUD ring with digital 00/15/30/45 readouts.' },
  sector_scientific: { name: 'Vintage Sector Dial', label: 'Vintage Sector Dial', badge: 'Sector', desc: 'Concentric scientific crosshair rings with 12/3/6/9 typography.' },
  arabic_bold_all: { name: 'Heavy Neon 01–12', label: 'Heavy Neon 01–12', badge: '01–12', desc: 'Two-digit 01..12 bold display numerals with glowing outer ring.' },
};

export const defaultDial = () => ({
  style: 'arabic_full',
  color: '#f8fafc',
  accent: '#38bdf8',
  scale: 1.0,
  track: true,
  minuteTrack: true,
});

const ROMAN_12 = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

/**
 * Draw customizable Dial Numerals & Hour Markers onto a 2D CanvasContext (`ctx`)
 * centered at `(cx, cy)` (default `120, 140` on the 240×280 watch screen).
 */
export function drawDialOverlay(ctx, dial, cx = 120, cy = 140) {
  if (!dial || !dial.style || dial.style === 'none') return;
  const style = dial.style;
  const col = dial.color || '#ffffff';
  const acc = dial.accent || '#38bdf8';
  const rawScale = dial.scale ?? 1.0;
  const sc = rawScale <= 3 ? rawScale : rawScale / 100;
  const showTrack = (dial.track ?? dial.minuteTrack) !== false;
  const R = 106 * sc;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 4;

  // Optional 60-minute perimeter tick track
  if (showTrack && style !== 'bauhaus_dial') {
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU;
      const is5 = i % 5 === 0;
      const rOut = R + 5;
      const rIn = is5 ? R - 1.5 : R + 1.8;
      ctx.save();
      ctx.rotate(a);
      ctx.strokeStyle = (style === 'chrono_60' && i <= 15) ? acc : is5 ? col : 'rgba(255,255,255,0.38)';
      ctx.lineWidth = is5 ? 1.8 : 0.9;
      ctx.beginPath();
      ctx.moveTo(0, -rOut);
      ctx.lineTo(0, -rIn);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (style === 'arabic_full') {
    ctx.font = `700 ${Math.round(17 * sc)}px "Montserrat", system-ui, sans-serif`;
    ctx.fillStyle = col;
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * TAU - Math.PI / 2;
      const nr = R - 15 * sc;
      ctx.fillStyle = h === 12 ? acc : col;
      ctx.fillText(String(h), Math.cos(a) * nr, Math.sin(a) * nr + 1);
    }
  } else if (style === 'arabic_quarter') {
    ctx.font = `800 ${Math.round(22 * sc)}px "Orbitron", "Montserrat", system-ui, sans-serif`;
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * TAU - Math.PI / 2;
      if (h % 3 === 0) {
        const nr = R - 17 * sc;
        ctx.fillStyle = h === 12 ? acc : col;
        ctx.fillText(String(h), Math.cos(a) * nr, Math.sin(a) * nr + 1);
      } else {
        ctx.save();
        ctx.rotate((h / 12) * TAU);
        ctx.fillStyle = col;
        ctx.fillRect(-1.6, -R + 3, 3.2, 11 * sc);
        ctx.restore();
      }
    }
  } else if (style === 'roman') {
    // Inner railroad ring
    const rr = R - 30 * sc;
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke();
    ctx.font = `700 ${Math.round(14.5 * sc)}px "Cinzel", Georgia, serif`;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      const nr = R - 14 * sc;
      ctx.fillStyle = i === 0 ? acc : col;
      ctx.fillText(ROMAN_12[i], Math.cos(a) * nr, Math.sin(a) * nr + 1);
    }
  } else if (style === 'roman_quarter') {
    ctx.font = `700 ${Math.round(18 * sc)}px "Cinzel", Georgia, serif`;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      if (i % 3 === 0) {
        const nr = R - 16 * sc;
        ctx.fillStyle = i === 0 ? acc : col;
        ctx.fillText(ROMAN_12[i], Math.cos(a) * nr, Math.sin(a) * nr + 1);
      } else {
        ctx.save();
        ctx.rotate((i / 12) * TAU);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, -R + 3);
        ctx.lineTo(2.6, -R + 9 * sc);
        ctx.lineTo(0, -R + 15 * sc);
        ctx.lineTo(-2.6, -R + 9 * sc);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  } else if (style === 'baton_minimal') {
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((i / 12) * TAU);
      ctx.fillStyle = i === 0 ? acc : col;
      if (i === 0) {
        ctx.fillRect(-4.5, -R + 2, 3, 15 * sc);
        ctx.fillRect(1.5, -R + 2, 3, 15 * sc);
      } else if (i % 3 === 0) {
        ctx.fillRect(-2, -R + 2, 4, 14 * sc);
      } else {
        ctx.fillRect(-1.3, -R + 2, 2.6, 10 * sc);
      }
      ctx.restore();
    }
  } else if (style === 'pilot_flieger') {
    ctx.font = `700 ${Math.round(13.5 * sc)}px "Share Tech Mono", "JetBrains Mono", monospace`;
    for (let i = 0; i < 12; i++) {
      if (i === 0) {
        // Flieger triangle + 2 dots at 12 o'clock
        ctx.fillStyle = acc;
        ctx.beginPath();
        ctx.moveTo(0, -R + 6 * sc);
        ctx.lineTo(-8 * sc, -R + 20 * sc);
        ctx.lineTo(8 * sc, -R + 20 * sc);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-11 * sc, -R + 10 * sc, 2 * sc, 0, TAU);
        ctx.arc(11 * sc, -R + 10 * sc, 2 * sc, 0, TAU);
        ctx.fill();
      } else {
        const a = (i / 12) * TAU - Math.PI / 2;
        const nr = R - 14 * sc;
        ctx.fillStyle = col;
        ctx.fillText(String(i * 5).padStart(2, '0'), Math.cos(a) * nr, Math.sin(a) * nr + 1);
      }
    }
  } else if (style === 'california') {
    const labels = ['XII', 'I', 'II', '—', '4', '5', '|', '7', '8', '—', 'X', 'XI'];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      const nr = R - 15 * sc;
      if (i === 3 || i === 9 || i === 6) {
        ctx.save();
        ctx.rotate((i / 12) * TAU);
        ctx.fillStyle = acc;
        ctx.fillRect(-2, -R + 4, 4, 14 * sc);
        ctx.restore();
      } else {
        ctx.font = `700 ${Math.round(16 * sc)}px ${i <= 2 || i >= 10 ? '"Cinzel", Georgia, serif' : '"Montserrat", sans-serif'}`;
        ctx.fillStyle = i === 0 ? acc : col;
        ctx.fillText(labels[i], Math.cos(a) * nr, Math.sin(a) * nr + 1);
      }
    }
  } else if (style === 'diver_dots') {
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((i / 12) * TAU);
      ctx.strokeStyle = acc;
      ctx.lineWidth = 1.4;
      ctx.fillStyle = col;
      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(-8 * sc, -R + 4);
        ctx.lineTo(8 * sc, -R + 4);
        ctx.lineTo(0, -R + 21 * sc);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (i === 3 || i === 6 || i === 9) {
        ctx.fillRect(-3 * sc, -R + 4, 6 * sc, 15 * sc);
        ctx.strokeRect(-3 * sc, -R + 4, 6 * sc, 15 * sc);
      } else {
        ctx.beginPath();
        ctx.arc(0, -R + 11 * sc, 4.5 * sc, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  } else if (style === 'chrono_60') {
    ctx.font = `700 ${Math.round(11.5 * sc)}px "Rajdhani", "Orbitron", sans-serif`;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      const nr = R - 13 * sc;
      const num = i === 0 ? '60' : String(i * 5).padStart(2, '0');
      ctx.fillStyle = i <= 3 ? acc : col;
      ctx.fillText(num, Math.cos(a) * nr, Math.sin(a) * nr + 1);
      ctx.save();
      ctx.rotate((i / 12) * TAU);
      ctx.fillStyle = i === 0 ? acc : col;
      ctx.fillRect(-1.5, -R + 1, 3, 6 * sc);
      ctx.restore();
    }
  } else if (style === 'bauhaus_dial') {
    ctx.font = `600 ${Math.round(14 * sc)}px "Space Grotesk", system-ui, sans-serif`;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU;
      ctx.save();
      ctx.rotate(a);
      if (i % 5 === 0) {
        ctx.fillStyle = i === 0 ? acc : col;
        ctx.beginPath();
        ctx.arc(0, -R - 2, 1.8, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -R + 2);
        ctx.lineTo(0, -R + 9 * sc);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(0, -R - 2, 0.8, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    for (let h = 2; h <= 12; h += 2) {
      const a = (h / 12) * TAU - Math.PI / 2;
      const nr = R - 17 * sc;
      ctx.fillStyle = h === 12 ? acc : col;
      ctx.fillText(String(h), Math.cos(a) * nr, Math.sin(a) * nr + 1);
    }
  } else if (style === 'stencil_x') {
    // Subtle crosshair lines
    ctx.strokeStyle = acc;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-R + 28, 0); ctx.lineTo(R - 28, 0);
    ctx.moveTo(0, -R + 36); ctx.lineTo(0, R - 36);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.font = `900 ${Math.round(28 * sc)}px "Teko", "Anton", Impact, sans-serif`;
    ctx.fillStyle = acc;
    ctx.fillText('12', 0, -R + 20 * sc);
    ctx.fillStyle = col;
    ctx.fillText('06', 0, R - 18 * sc);
    for (let i = 1; i < 12; i++) {
      if (i === 6) continue;
      ctx.save();
      ctx.rotate((i / 12) * TAU);
      ctx.fillStyle = i % 3 === 0 ? acc : col;
      ctx.fillRect(-1.8, -R + 2, 3.6, (i % 3 === 0 ? 14 : 9) * sc);
      ctx.restore();
    }
  } else if (style === 'field_24h') {
    // Outer 1-12 numerals + inner 13-24 military ring
    ctx.font = `800 ${Math.round(16 * sc)}px "Rajdhani", "Montserrat", sans-serif`;
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * TAU - Math.PI / 2;
      const nr = R - 13 * sc;
      ctx.fillStyle = h === 12 ? acc : col;
      ctx.fillText(String(h), Math.cos(a) * nr, Math.sin(a) * nr + 1);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, R - 26 * sc, 0, TAU); ctx.stroke();
    ctx.font = `700 ${Math.round(9.5 * sc)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = acc;
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * TAU - Math.PI / 2;
      const nr = R - 34 * sc;
      ctx.fillText(String(h + 12), Math.cos(a) * nr, Math.sin(a) * nr + 1);
    }
  } else if (style === 'cyber_hud') {
    // Segmented neon HUD ring + 00 / 15 / 30 / 45 digital readouts
    ctx.strokeStyle = acc;
    ctx.lineWidth = 2;
    for (let q = 0; q < 4; q++) {
      const a0 = q * (Math.PI / 2) + 0.22;
      const a1 = (q + 1) * (Math.PI / 2) - 0.22;
      ctx.beginPath(); ctx.arc(0, 0, R - 8 * sc, a0, a1); ctx.stroke();
    }
    ctx.font = `800 ${Math.round(16 * sc)}px "Orbitron", monospace`;
    const hudLabels = ['12', '03', '06', '09'];
    for (let q = 0; q < 4; q++) {
      const a = q * (Math.PI / 2) - Math.PI / 2;
      const nr = R - 14 * sc;
      ctx.fillStyle = q === 0 ? acc : col;
      ctx.fillText(hudLabels[q], Math.cos(a) * nr, Math.sin(a) * nr + 1);
    }
  } else if (style === 'sector_scientific') {
    // Concentric scientific sector rings + crosshair + 12 / 3 / 6 / 9
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, R - 6 * sc, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R - 26 * sc, 0, TAU); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-R + 26 * sc, 0); ctx.lineTo(R - 26 * sc, 0);
    ctx.moveTo(0, -R + 26 * sc); ctx.lineTo(0, R - 26 * sc);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.font = `700 ${Math.round(16 * sc)}px "Space Grotesk", sans-serif`;
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * TAU - Math.PI / 2;
      if (h % 3 === 0) {
        const nr = R - 16 * sc;
        ctx.fillStyle = h === 12 ? acc : col;
        ctx.fillText(String(h), Math.cos(a) * nr, Math.sin(a) * nr + 1);
      } else {
        ctx.save();
        ctx.rotate((h / 12) * TAU);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -R + 6 * sc); ctx.lineTo(0, -R + 26 * sc); ctx.stroke();
        ctx.restore();
      }
    }
  } else if (style === 'arabic_bold_all') {
    ctx.font = `900 ${Math.round(15 * sc)}px "Orbitron", "Arial Black", sans-serif`;
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * TAU - Math.PI / 2;
      const nr = R - 15 * sc;
      ctx.fillStyle = h % 3 === 0 ? acc : col;
      ctx.fillText(String(h).padStart(2, '0'), Math.cos(a) * nr, Math.sin(a) * nr + 1);
    }
  }

  ctx.restore();
}
