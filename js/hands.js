// Vector hand designer: draws analog hands (and the centre cap) into Noise sprites.
// Everything is pure maths (no canvas), so it runs in the browser and in Node tests.
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
  const mask = new Uint8Array(n).fill(255), rgb = new Uint16Array(n);
  for (let i = 0; i < n; i++) {
    let a8 = Math.round(A[i] * 255);
    if (a8 < 8) continue;
    if (a8 > 249) a8 = 255;
    const k = 1 / A[i];
    const r = Math.min(255, R[i] * k), g = Math.min(255, G[i] * k), b = Math.min(255, B[i] * k);
    mask[i] = 255 - a8;
    rgb[i] = ((Math.round(r) >> 3) << 11) | ((Math.round(g) >> 2) << 5) | (Math.round(b) >> 3);
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
};

export const SECOND_STYLES = {
  line: { label: 'Line + tail', build: ({ len, tail, color }) => [{ paths: [rect(-0.9, -len, 0.9, tail)], fill: color }, { paths: [rect(-2.2, tail - 8, 2.2, tail)], fill: color }] },
  lollipop: { label: 'Lollipop', build: ({ len, tail, color }) => [{ paths: [rect(-0.8, -len * 0.8, 0.8, tail)], fill: color }, { paths: [circle(0, -len * 0.84, 4.4), circle(0, -len * 0.84, 1.8)], fill: color }] },
  needle: { label: 'Needle', build: ({ len, tail, color }) => [{ paths: [[[-1.6, tail], [0, -len], [1.6, tail]]], fill: color }] },
  arrow: { label: 'Arrow', build: ({ len, tail, color }) => [{ paths: [rect(-0.8, -len * 0.82, 0.8, tail)], fill: color }, { paths: [[[-3, -len * 0.8], [0, -len], [3, -len * 0.8]]], fill: color }] },
  glow: { label: 'Glow', build: ({ len, tail, color }) => [{ paths: [capsule(3.2, -len, tail)], fill: color, alpha: 0.2 }, { paths: [capsule(1.7, -len, tail)], fill: color, alpha: 0.55 }, { paths: [rect(-0.6, -len, 0.6, tail)], fill: [255, 255, 255] }] },
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
};

export const defaultHands = () => structuredClone(HAND_PRESETS.swiss);

function handLayers(kind, d) {
  const spec = { ...d, color: hex2rgb(d.color), lume: hex2rgb(d.lume ?? d.color), accent: hex2rgb(d.accent ?? d.color) };
  const table = kind === 'second' ? SECOND_STYLES : kind === 'cap' ? CAP_STYLES : HAND_STYLES;
  return (table[d.style] || Object.values(table)[0]).build(spec);
}

/** raster of one hand at an exact angle (degrees clockwise from 12 o'clock) */
export const drawHand = (kind, design, angle) => rasterize(handLayers(kind, design[kind]), angle);
/** the 16 sprites (0..90 degrees in 6 degree steps) a face file needs for one hand */
export const handFrames = (kind, design) => { const L = handLayers(kind, design[kind]); return Array.from({ length: 16 }, (_, i) => rasterize(L, i * 6)); };
export const capSprite = design => rasterize(handLayers('cap', design.cap), 0);
