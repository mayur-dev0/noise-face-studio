// Moving watchface engine:
// 1. 10 FPS Animated Background / GIF / Video scenes (full 240×280 moving watchfaces like Watch Default #2)
// 2. Animated GIF & MP4/WebM 10 FPS frame extractor
// 3. Hardware sprite encoder ("z=1" RLE delta sprites + digital clock on top)
import { rasterize, hex2rgb } from './hands.js';
import { encodeSprite } from './sprite.js';

const W = 240, H = 280, CX = 120, CY = 140;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

const shade = (c, f) => c.map(v => Math.max(0, Math.min(255, v * f)));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ============================================================================
// PART 1: 10 FPS Animated Background Scenes (Watch Default #2 & Procedural Video Loops)
// ============================================================================

export const VIDEO_SCENES = {
  koi_sphere: {
    name: 'Particle Sphere & Koi (Default #2)',
    badge: '10 FPS · Watch #2',
    desc: 'Glowing blue particle orb with twin bioluminescent koi fish swimming smoothly at 10 fps.',
    accent: '#38bdf8',
    secondary: '#e0f2fe',
    bgTop: [2, 6, 26],
    bgBot: [3, 14, 46],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  holo_globe: {
    name: '3D Hologram Globe',
    badge: '10 FPS · 3D',
    desc: 'Rotating 3D cyan particle globe with twin tilted orbital rings and floating quantum dust.',
    accent: '#22d3ee',
    secondary: '#818cf8',
    bgTop: [2, 10, 24],
    bgBot: [4, 20, 38],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  cosmic_nebula: {
    name: 'Cosmic Galaxy Vortex',
    badge: '10 FPS · Space',
    desc: 'Swirling multi-arm spiral galaxy with pulsing core and shooting stars at 10 fps.',
    accent: '#c084fc',
    secondary: '#38bdf8',
    bgTop: [8, 4, 24],
    bgBot: [18, 6, 40],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  jellyfish: {
    name: 'Bioluminescent Jellyfish',
    badge: '10 FPS · Ocean',
    desc: 'Neon deep-sea jellyfish pulsing its bell with flowing particle tentacles and plankton.',
    accent: '#00f0ff',
    secondary: '#f472b6',
    bgTop: [1, 8, 28],
    bgBot: [2, 22, 52],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  synthwave: {
    name: 'Retrowave Outrun Grid',
    badge: '10 FPS · Cyber',
    desc: 'Scrolling 3D neon wireframe horizon grid with segmented synthwave sunset and stars.',
    accent: '#f43f5e',
    secondary: '#22d3ee',
    bgTop: [14, 4, 30],
    bgBot: [28, 6, 48],
    recommendedLayout: { clock: { x: 48, y: 18 }, date: { x: 27, y: 74 }, clockSize: 52 },
  },
  aurora: {
    name: 'Aurora & Fireflies',
    badge: '10 FPS · Nature',
    desc: 'Waving northern lights ribbons in the night sky with drifting golden-cyan fireflies.',
    accent: '#34d399',
    secondary: '#fde047',
    bgTop: [2, 12, 22],
    bgBot: [4, 26, 34],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  plasma_core: {
    name: 'Plasma Arc Reactor',
    badge: '10 FPS · Sci-Fi',
    desc: 'Crackling 10 fps electric plasma arcs, spinning containment rings, and pulsing energy core.',
    accent: '#38bdf8',
    secondary: '#a855f7',
    bgTop: [4, 8, 22],
    bgBot: [8, 14, 36],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  cyber_matrix: {
    name: 'Digital Matrix Pulse',
    badge: '10 FPS · Matrix',
    desc: 'Cascading streams of glowing neon digital rain with a pulsing cybernetic vortex.',
    accent: '#4ade80',
    secondary: '#bbf7d0',
    bgTop: [1, 10, 6],
    bgBot: [2, 22, 12],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  black_hole: {
    name: 'Gargantua Black Hole',
    badge: '10 FPS · Crazy',
    desc: 'Relativistic gravitational lensing halo with a blazing accretion disk spinning around a dark singularity.',
    accent: '#f97316',
    secondary: '#fde047',
    bgTop: [4, 2, 8],
    bgBot: [10, 4, 14],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  sharingan_eye: {
    name: 'Crimson Tomoe Eye',
    badge: '10 FPS · Anime',
    desc: 'Hypnotic spinning crimson iris with three orbiting black-and-scarlet tomoe and chakra pulse.',
    accent: '#ef4444',
    secondary: '#fca5a5',
    bgTop: [8, 1, 3],
    bgBot: [18, 2, 6],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  arcane_rune: {
    name: 'Eldritch Magic Mandala',
    badge: '10 FPS · Mystic',
    desc: 'Counter-rotating sacred hexagram sigils, glowing arcane runes, and levitating golden sparks.',
    accent: '#fbbf24',
    secondary: '#38bdf8',
    bgTop: [6, 4, 18],
    bgBot: [14, 8, 28],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  tourbillon_mech: {
    name: 'Flying Tourbillon Gear',
    badge: '10 FPS · Horology',
    desc: 'Exposed mechanical escapement cage with spinning golden balance wheel, hairspring, and ruby jewels.',
    accent: '#f59e0b',
    secondary: '#f43f5e',
    bgTop: [4, 6, 12],
    bgBot: [8, 12, 22],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  dna_helix: {
    name: '3D Cyber DNA Helix',
    badge: '10 FPS · Bio-Tech',
    desc: 'Rotating 3D double-helix bioluminescent strands with glowing base-pair rungs and floating ions.',
    accent: '#06b6d4',
    secondary: '#ec4899',
    bgTop: [2, 8, 20],
    bgBot: [4, 16, 34],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
  reactor_vortex: {
    name: 'Quantum Warp Tunnel',
    badge: '10 FPS · Hyper',
    desc: 'Concentric neon polygon warp rings zooming through hyperspace with streaking light beams.',
    accent: '#a855f7',
    secondary: '#22d3ee',
    bgTop: [5, 2, 18],
    bgBot: [12, 4, 32],
    recommendedLayout: { clock: { x: 48, y: 218 }, date: { x: 27, y: 12 }, clockSize: 52 },
  },
};

// Deterministic pseudo-random helper for particle scenes
const hash = n => {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

// Fast additive glow dot drawer on raw RGBA buffer (works in both Browser & Node!)
function addGlowDot(px, cx, cy, radius, r, g, b, alpha = 1) {
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(W - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(H - 1, Math.ceil(cy + radius));
  const invR2 = 1 / Math.max(0.25, radius * radius);
  for (let y = y0; y <= y1; y++) {
    const dy = y - cy, dy2 = dy * dy;
    const rowOff = y * W * 4;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const d2 = (dx * dx + dy2) * invR2;
      if (d2 >= 1) continue;
      const falloff = (1 - d2);
      const a = falloff * falloff * alpha;
      const i = rowOff + x * 4;
      px[i] = Math.min(255, px[i] + r * a);
      px[i + 1] = Math.min(255, px[i + 1] + g * a);
      px[i + 2] = Math.min(255, px[i + 2] + b * a);
      px[i + 3] = 255;
    }
  }
}

function addLine(px, x0, y0, x1, y1, width, r, g, b, alpha = 1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / Math.max(0.8, width * 0.45)));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    addGlowDot(px, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, width, r, g, b, alpha);
  }
}

/**
 * Render a single 240×280 RGBA frame (`Uint8ClampedArray` of length 240*280*4)
 * for any built-in 10 FPS scene at phase `t` in [0, 1).
 * If `backgroundOnly` is true, renders only the static dark ambient backdrop (for id=0).
 */
export function renderSceneRgba(sceneKey, frameIdx = 0, totalFrames = 16, opts = {}) {
  const scene = VIDEO_SCENES[sceneKey] || VIDEO_SCENES.koi_sphere;
  const px = new Uint8ClampedArray(W * H * 4);
  const t = ((frameIdx % Math.max(1, totalFrames)) / Math.max(1, totalFrames)); // 0 .. 1
  const phase = t * TAU;

  const [tr, tg, tb] = scene.bgTop;
  const [br, bg, bb] = scene.bgBot;
  const [ar, ag, ab] = opts.accentColor ? hex2rgb(opts.accentColor) : hex2rgb(scene.accent);
  const [sr, sg, sb] = opts.secondaryColor ? hex2rgb(opts.secondaryColor) : hex2rgb(scene.secondary);

  const cx = CX, cy = CY;

  // 1. Base ambient background gradient + soft core aura
  for (let y = 0; y < H; y++) {
    const yf = y / (H - 1);
    const rBase = tr + (br - tr) * yf;
    const gBase = tg + (bg - tg) * yf;
    const bBase = tb + (bb - tb) * yf;
    for (let x = 0; x < W; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const glow = Math.max(0, 1 - dist / 64);
      const g2 = glow * glow * 0.34;
      const i = (y * W + x) * 4;
      px[i] = Math.min(255, rBase + ar * g2 * 0.35);
      px[i + 1] = Math.min(255, gBase + ag * g2 * 0.45);
      px[i + 2] = Math.min(255, bBase + ab * g2 * 0.85);
      px[i + 3] = 255;
    }
  }

  // Static backdrop (id=0) must stay 100% free of frozen scene elements so nothing sticks out around the moving sprite window!
  if (opts.backgroundOnly) return px;

  // Scale virtual scene coordinates (designed for R ~ 90) into the solid moving hardware sprite window (R <= 46)
  const S = opts.sceneScale ?? 0.47;
  const dot = (vx, vy, rad, r, g, b, alpha = 1) =>
    addGlowDot(px, cx + (vx - cx) * S, cy + (vy - cy) * S, Math.max(1.15, rad * S * 1.35), r, g, b, alpha);
  const line = (x0, y0, x1, y1, width, r, g, b, alpha = 1) =>
    addLine(
      px,
      cx + (x0 - cx) * S,
      cy + (y0 - cy) * S,
      cx + (x1 - cx) * S,
      cy + (y1 - cy) * S,
      Math.max(1.1, width * S * 1.35),
      r,
      g,
      b,
      alpha
    );

  // 2. Scene-specific 10 FPS multi-element animation
  if (sceneKey === 'koi_sphere' || !VIDEO_SCENES[sceneKey]) {
    const R = 83;
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * TAU + phase * 0.35;
      const wobble = Math.sin(a * 3 - phase * 2) * 2.2;
      const rx = cx + (R + wobble) * Math.cos(a);
      const ry = cy + (R + wobble) * Math.sin(a);
      dot(rx, ry, 5.5, ar * 0.45, ag * 0.7, ab, 0.22);
    }

    for (let i = 0; i < 360; i++) {
      const u = hash(i * 1.13) * 2 - 1;
      const theta0 = hash(i * 2.71) * TAU;
      const radScale = 0.35 + 0.65 * Math.cbrt(hash(i * 3.97));
      const rLocal = R * radScale;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      const lon = theta0 + phase * (0.7 + 0.3 * (i % 2));
      const x3 = rLocal * s * Math.cos(lon);
      const y3 = rLocal * u;
      const z3 = rLocal * s * Math.sin(lon);
      const tilt = 0.28;
      const yt = y3 * Math.cos(tilt) - z3 * Math.sin(tilt);
      const zt = y3 * Math.sin(tilt) + z3 * Math.cos(tilt);
      if (zt < -R * 0.65) continue;
      const depth = (zt + R) / (2 * R);
      const sx = cx + x3;
      const sy = cy + yt;
      const pSize = 1.1 + depth * 1.45;
      const twinkle = 0.45 + 0.55 * Math.sin(phase * 2 + i * 1.7);
      const isBright = i % 7 === 0;
      dot(
        sx,
        sy,
        pSize,
        isBright ? sr : ar * 0.55,
        isBright ? sg : ag * 0.85,
        isBright ? sb : ab,
        (0.22 + depth * 0.65) * twinkle
      );
    }

    for (let fish = 0; fish < 2; fish++) {
      const headAngle = phase + fish * Math.PI + 0.65;
      const dir = 1;
      for (let seg = 33; seg >= 0; seg--) {
        const frac = seg / 33;
        const a = headAngle - dir * frac * 1.28;
        const swimWave = Math.sin(phase * 3 - frac * 7.5 + fish * 2.1) * (2.5 + frac * 5.5);
        const orbitR = R - 5 + Math.sin(a * 2 + fish) * 4 + swimWave * 0.45;
        const fx = cx + orbitR * Math.cos(a);
        const fy = cy + orbitR * Math.sin(a);
        const nx = Math.cos(a), ny = Math.sin(a);
        const bodyEnv = frac < 0.18
          ? Math.sin((frac / 0.18) * (Math.PI / 2)) * 9.5
          : frac < 0.72
            ? (1 - (frac - 0.18) / 0.62) * 9.5 + 1.8
            : (frac - 0.72) * 26;
        const fade = frac < 0.75 ? 1 - frac * 0.45 : (1 - frac) * 2.2;

        const ribs = seg < 24 ? 4 : 2;
        for (let rb = -ribs; rb <= ribs; rb++) {
          const rf = rb / Math.max(1, ribs);
          const off = rf * bodyEnv + swimWave * 0.35;
          const pxX = fx + nx * off;
          const pxY = fy + ny * off;
          const edgeBoost = Math.abs(rf) > 0.65 ? 1.25 : 0.75;
          const isHighlight = seg < 16 && Math.abs(rf) > 0.55;
          dot(
            pxX,
            pxY,
            seg < 6 ? 2.1 : 1.65,
            isHighlight ? 245 : sr * 0.7 + ar * 0.3,
            isHighlight ? 240 : sg * 0.8 + ag * 0.2,
            255,
            0.36 * fade * edgeBoost
          );
        }

        if (seg === 6 || seg === 7 || seg === 15) {
          const finLen = seg < 10 ? 15 : 10;
          for (let f = 1; f <= 5; f++) {
            const ff = f / 5;
            const finA = a - dir * ff * 0.24;
            const finR = orbitR + (seg === 15 ? -1 : 1) * (bodyEnv + ff * finLen);
            dot(cx + finR * Math.cos(finA), cy + finR * Math.sin(finA), 1.6, 220, 242, 255, 0.42 * (1 - ff * 0.7));
          }
        }
      }

      for (let sp = 0; sp < 14; sp++) {
        const sf = sp / 14;
        const sa = headAngle - dir * (1.25 + sf * 0.85) + (hash(sp + fish * 31) - 0.5) * 0.16;
        const srRad = R + (hash(sp * 3.1 + fish) - 0.5) * 16;
        const alpha = (1 - sf) * (0.4 + 0.4 * Math.sin(phase * 3 + sp));
        dot(cx + srRad * Math.cos(sa), cy + srRad * Math.sin(sa), 1.6, sr, sg, sb, alpha);
      }
    }
  } else if (sceneKey === 'holo_globe') {
    const R = 76;
    for (let lat = -75; lat <= 75; lat += 15) {
      const phi = lat * DEG;
      const y0 = R * Math.sin(phi);
      const rLat = R * Math.cos(phi);
      const dots = Math.max(12, Math.round(40 * Math.cos(phi)));
      for (let j = 0; j < dots; j++) {
        const lon = (j / dots) * TAU + phase;
        const x3 = rLat * Math.cos(lon);
        const z3 = rLat * Math.sin(lon);
        const tilt = -0.35;
        const yt = y0 * Math.cos(tilt) - z3 * Math.sin(tilt);
        const zt = y0 * Math.sin(tilt) + z3 * Math.cos(tilt);
        const depth = (zt + R) / (2 * R);
        if (depth < 0.15) continue;
        dot(cx + x3, cy + yt, 1.3 + depth * 1.1, ar, ag, ab, 0.28 + depth * 0.65);
      }
    }
    for (let ringIdx = 0; ringIdx < 2; ringIdx++) {
      const rRing = ringIdx === 0 ? 92 : 84;
      const tilt = ringIdx === 0 ? 0.38 : -0.42;
      const rot = ringIdx === 0 ? 0.32 : -0.45;
      const cr = Math.cos(rot), sr2 = Math.sin(rot);
      for (let k = 0; k < 68; k++) {
        const a = (k / 68) * TAU + phase * (ringIdx === 0 ? 1 : -1);
        const rx = rRing * Math.cos(a);
        const ry = rRing * Math.sin(a) * Math.sin(tilt);
        const sx = cx + rx * cr - ry * sr2;
        const sy = cy + rx * sr2 + ry * cr;
        const pulse = k < 10 ? (1 - k / 10) : 0.25;
        dot(sx, sy, k < 4 ? 2.6 : 1.4, sr, sg, sb, 0.35 + pulse * 0.65);
      }
    }
  } else if (sceneKey === 'cosmic_nebula') {
    for (let arm = 0; arm < 4; arm++) {
      const armBase = (arm / 4) * TAU;
      for (let k = 0; k < 80; k++) {
        const f = k / 80;
        const rad = 6 + f * 88;
        const a = armBase + f * 4.2 - phase + (hash(arm * 100 + k) - 0.5) * 0.38;
        const sx = cx + rad * Math.cos(a);
        const sy = cy + rad * 0.88 * Math.sin(a);
        const cMix = f;
        const r = ar * (1 - cMix) + sr * cMix;
        const g = ag * (1 - cMix) + sg * cMix;
        const b = ab * (1 - cMix) + sb * cMix;
        dot(sx, sy, (1 - f * 0.5) * 2.8, r, g, b, (1 - f * 0.65) * 0.76);
      }
    }
    dot(cx, cy, 18 + Math.sin(phase) * 3, 255, 240, 255, 0.7);
  } else if (sceneKey === 'jellyfish') {
    const pulse = Math.sin(phase);
    const bellW = 52 + pulse * 8;
    const bellH = 40 - pulse * 5;
    const jx = cx + Math.sin(phase) * 6;
    const jy = cy - 26 - Math.cos(phase) * 7;
    for (let ring = 0; ring < 13; ring++) {
      const rf = ring / 12;
      const yOff = (rf - 0.5) * bellH;
      const rx = Math.sin(rf * Math.PI * 0.88) * bellW;
      const dots = 32;
      for (let d = 0; d < dots; d++) {
        const a = (d / dots) * TAU;
        const x = jx + rx * Math.cos(a);
        const y = jy + yOff + rx * 0.26 * Math.sin(a);
        const cMix = rf;
        dot(x, y, 2.1, ar * (1 - cMix) + sr * cMix, ag * (1 - cMix) + sg * cMix, ab * (1 - cMix) + sb * cMix, 0.52);
      }
    }
    for (let tc = 0; tc < 9; tc++) {
      const tf = (tc / 8) - 0.5;
      const baseX = jx + tf * bellW * 1.28;
      const baseY = jy + bellH * 0.35;
      for (let s = 0; s < 22; s++) {
        const sf = s / 21;
        const wave = Math.sin(phase * 2 - sf * 5.2 + tc * 0.7) * (4 + sf * 10);
        const tx = baseX + wave;
        const ty = baseY + sf * 74;
        const isInner = tc >= 3 && tc <= 5;
        dot(tx, ty, (1 - sf * 0.55) * (isInner ? 2.3 : 1.6), isInner ? sr : ar, isInner ? sg : ag, isInner ? sb : ab, (1 - sf * 0.7) * 0.68);
      }
    }
  } else if (sceneKey === 'synthwave') {
    const horizonY = cy + 8;
    const sunR = 46, sunY = cy - 16;
    for (let y = sunY - sunR; y <= horizonY; y += 2) {
      const sf = (y - (sunY - sunR)) / (2 * sunR);
      if (sf > 0.45 && Math.sin((y + t * 12) * 0.75) > 0.25) continue;
      const halfW = Math.sqrt(Math.max(0, sunR * sunR - (y - sunY) * (y - sunY)));
      for (let x = Math.round(cx - halfW); x <= Math.round(cx + halfW); x += 3) {
        dot(x, y, 2.0, 255, Math.round(210 * (1 - sf) + 50 * sf), Math.round(60 * (1 - sf) + 140 * sf), 0.7);
      }
    }
    for (let g = -5; g <= 5; g++) {
      line(cx + g * 8, horizonY, cx + g * 16, cy + 78, 1.5, sr, sg, sb, 0.6);
    }
    for (let r = 0; r < 7; r++) {
      const rf = ((r + t) / 7);
      const gy = horizonY + Math.pow(rf, 1.8) * 70;
      const halfSpan = Math.sqrt(Math.max(0, 86 * 86 - (gy - cy) * (gy - cy)));
      line(cx - halfSpan, gy, cx + halfSpan, gy, 1.5, ar, ag, ab, 0.3 + rf * 0.65);
    }
  } else if (sceneKey === 'aurora') {
    for (let c = 0; c < 3; c++) {
      const baseY = cy - 32 + c * 28;
      for (let x = cx - 76; x <= cx + 76; x += 4) {
        const xf = (x - (cx - 76)) / 152;
        const wave = Math.sin(xf * 7 + phase + c * 1.4) * 14 + Math.cos(xf * 13 - phase * 2) * 6;
        const y0 = baseY + wave;
        const curtainH = 26 + Math.sin(xf * 9 - phase + c) * 12;
        for (let s = 0; s < 7; s++) {
          const sf = s / 6;
          const r = c === 1 ? sr : ar;
          const g = c === 1 ? sg : ag;
          const b = c === 1 ? sb : ab;
          dot(x, y0 - sf * curtainH, 2.4, r, g, b, (1 - sf) * 0.4);
        }
      }
    }
    for (let f = 0; f < 24; f++) {
      const a = hash(f * 4.3) * TAU + phase * 0.25;
      const rad = hash(f * 8.1) * 76;
      const glow = 0.35 + 0.65 * Math.max(0, Math.sin(phase * 2 + f * 1.9));
      dot(cx + rad * Math.cos(a), cy + rad * Math.sin(a), 2.4, sr, sg, sb, glow * 0.85);
    }
  } else if (sceneKey === 'plasma_core') {
    const coreR = 22 + Math.sin(phase * 2) * 3;
    dot(cx, cy, coreR, sr, sg, sb, 0.85);
    dot(cx, cy, coreR * 0.55, 255, 255, 255, 0.95);
    const outerR = 84;
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * TAU + phase * 0.5;
      const on = (i % 8) < 5;
      if (on) dot(cx + outerR * Math.cos(a), cy + outerR * Math.sin(a), 2.2, ar, ag, ab, 0.85);
    }
    for (let b = 0; b < 7; b++) {
      const baseA = (b / 7) * TAU + phase;
      let lx = cx + 14 * Math.cos(baseA), ly = cy + 14 * Math.sin(baseA);
      for (let s = 1; s <= 8; s++) {
        const sf = s / 8;
        const r = 14 + sf * (outerR - 14);
        const jitter = (s < 8 ? Math.sin(phase * 3 + b * 5 + s * 2.3) * 0.22 : 0);
        const a = baseA + jitter;
        const nx = cx + r * Math.cos(a), ny = cy + r * Math.sin(a);
        line(lx, ly, nx, ny, 2.0, sr, sg, sb, 0.8);
        lx = nx; ly = ny;
      }
    }
  } else if (sceneKey === 'cyber_matrix') {
    for (let col = -7; col <= 7; col++) {
      const x = cx + col * 10;
      const maxSpanY = Math.sqrt(Math.max(0, 82 * 82 - (x - cx) * (x - cx)));
      const speed = 1 + (Math.abs(col) % 2);
      const headY = (cy - maxSpanY) + (((hash((col + 10) * 9.1) + t * speed) % 1) * (maxSpanY * 2));
      for (let k = 0; k < 8; k++) {
        const y = headY - k * 8;
        if (Math.hypot(x - cx, y - cy) > 84) continue;
        const isHead = k === 0;
        dot(x, y, isHead ? 2.5 : 1.8, isHead ? 240 : ar, isHead ? 255 : ag, isHead ? 240 : ab, (1 - k / 8) * 0.88);
      }
    }
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * TAU + phase;
      const r = 56 + Math.sin(a * 4 - phase * 2) * 5;
      dot(cx + r * Math.cos(a), cy + r * Math.sin(a), 2.1, sr, sg, sb, 0.78);
    }
  } else if (sceneKey === 'black_hole') {
    // Gargantua gravitational lensing photon ring + tilted swirling accretion disk
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU - phase;
      const rLensing = 44 + Math.sin(a * 3 + phase) * 2;
      dot(cx + rLensing * Math.cos(a), cy + rLensing * Math.sin(a), 2.8, sr, sg, sb, 0.72);
    }
    // Blazing swirling accretion disk (tilted ellipse wrapping around event horizon)
    for (let ring = 0; ring < 5; ring++) {
      const rDisk = 50 + ring * 9;
      for (let k = 0; k < 64; k++) {
        const a = (k / 64) * TAU + phase * (1.4 - ring * 0.15);
        const doppler = 0.55 + 0.45 * Math.cos(a + 0.4); // brighter on approaching side
        const rx = rDisk * Math.cos(a);
        const ry = rDisk * 0.34 * Math.sin(a);
        const tilt = -0.28;
        const sx = cx + rx * Math.cos(tilt) - ry * Math.sin(tilt);
        const sy = cy + rx * Math.sin(tilt) + ry * Math.cos(tilt);
        const cMix = ring / 4;
        dot(
          sx,
          sy,
          2.4 - cMix * 0.7,
          sr * (1 - cMix) + ar * cMix,
          sg * (1 - cMix) + ag * cMix,
          sb * (1 - cMix) + ab * cMix,
          doppler * (0.85 - cMix * 0.35)
        );
      }
    }
    // Pitch-black event horizon core (carves out the center singularity)
    const coreRad = Math.round(18 * S);
    for (let y = cy - coreRad; y <= cy + coreRad; y++) {
      for (let x = cx - coreRad; x <= cx + coreRad; x++) {
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= coreRad * coreRad) {
          const i = (y * W + x) * 4;
          px[i] = 2; px[i + 1] = 1; px[i + 2] = 4; px[i + 3] = 255;
        }
      }
    }
  } else if (sceneKey === 'sharingan_eye') {
    // Glowing crimson iris rings + 3 spinning tomoe + dark pupil
    for (let r = 24; r <= 82; r += 8) {
      const steps = 48;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * TAU + phase * 0.4;
        dot(cx + r * Math.cos(a), cy + r * Math.sin(a), r === 56 ? 2.4 : 1.7, ar, ag, ab, r === 56 ? 0.85 : 0.38);
      }
    }
    // 3 Orbiting Tomoe (comma-shaped chakra magatama)
    for (let tm = 0; tm < 3; tm++) {
      const baseA = (tm / 3) * TAU + phase;
      const tx = cx + 56 * Math.cos(baseA);
      const ty = cy + 56 * Math.sin(baseA);
      dot(tx, ty, 7.5, sr, sg, sb, 0.95);
      dot(tx, ty, 4.2, 255, 240, 240, 0.95);
      for (let tail = 1; tail <= 10; tail++) {
        const tf = tail / 10;
        const ta = baseA - tf * 0.52;
        const tr2 = 56 + tf * 9;
        dot(cx + tr2 * Math.cos(ta), cy + tr2 * Math.sin(ta), (1 - tf * 0.7) * 5.2, sr, sg, sb, (1 - tf * 0.65) * 0.9);
      }
    }
    dot(cx, cy, 12 + Math.sin(phase * 2) * 2, sr, sg, sb, 0.9);
  } else if (sceneKey === 'arcane_rune') {
    // Outer & inner rune circles
    for (const rRing of [84, 62, 34]) {
      const dir = rRing === 62 ? -1 : 1;
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * TAU + phase * dir;
        dot(cx + rRing * Math.cos(a), cy + rRing * Math.sin(a), i % 5 === 0 ? 2.6 : 1.5, i % 5 === 0 ? sr : ar, i % 5 === 0 ? sg : ag, i % 5 === 0 ? sb : ab, 0.8);
      }
    }
    // Counter-rotating sacred hexagram (2 interlocked triangles)
    for (let tri = 0; tri < 2; tri++) {
      const rot = phase * (tri === 0 ? 1 : -1) + tri * (Math.PI / 3);
      const R = 78;
      for (let v = 0; v < 3; v++) {
        const a0 = rot + (v * TAU) / 3;
        const a1 = rot + (((v + 1) % 3) * TAU) / 3;
        line(
          cx + R * Math.cos(a0),
          cy + R * Math.sin(a0),
          cx + R * Math.cos(a1),
          cy + R * Math.sin(a1),
          2.0,
          tri === 0 ? ar : sr,
          tri === 0 ? ag : sg,
          tri === 0 ? ab : sb,
          0.85
        );
      }
    }
    dot(cx, cy, 14 + Math.sin(phase * 2) * 3, 255, 250, 220, 0.9);
  } else if (sceneKey === 'tourbillon_mech') {
    // Outer toothed escapement gear rotating clockwise
    const R = 82;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU + phase * 0.5;
      const rGear = i % 3 === 0 ? R + 5 : R - 2;
      dot(cx + rGear * Math.cos(a), cy + rGear * Math.sin(a), 2.0, ar, ag, ab, 0.85);
    }
    // 3 Tourbillon cage bridges rotating counter-clockwise
    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * TAU - phase;
      line(cx, cy, cx + 76 * Math.cos(a), cy + 76 * Math.sin(a), 2.4, 220, 230, 245, 0.85);
      dot(cx + 52 * Math.cos(a), cy + 52 * Math.sin(a), 4.2, sr, sg, sb, 0.95);
    }
    // Breathing spiral hairspring in center
    const springExpand = 1 + 0.12 * Math.sin(phase * 2);
    for (let s = 0; s < 65; s++) {
      const sf = s / 65;
      const a = sf * 3.5 * TAU + phase * 2;
      const r = (8 + sf * 38) * springExpand;
      dot(cx + r * Math.cos(a), cy + r * Math.sin(a), 1.5, ar, ag, ab, 0.78);
    }
    // Central ruby pivot jewel
    dot(cx, cy, 10, sr, sg, sb, 0.95);
    dot(cx, cy, 4.5, 255, 255, 255, 0.95);
  } else if (sceneKey === 'dna_helix') {
    // 3D double-helix rotating vertically inside circular window
    for (let s = 0; s < 28; s++) {
      const yf = (s / 27) * 2 - 1; // -1 .. 1
      const y = cy + yf * 76;
      const twist = yf * 3.2 + phase;
      const x1 = cx + Math.sin(twist) * 44;
      const z1 = Math.cos(twist);
      const x2 = cx - Math.sin(twist) * 44;
      const z2 = -Math.cos(twist);
      if (s % 2 === 0) {
        line(x1, y, x2, y, 1.5, 180, 220, 255, 0.42);
      }
      dot(x1, y, 2.8 + z1 * 0.9, ar, ag, ab, 0.55 + (z1 + 1) * 0.22);
      dot(x2, y, 2.8 + z2 * 0.9, sr, sg, sb, 0.55 + (z2 + 1) * 0.22);
    }
  } else if (sceneKey === 'reactor_vortex') {
    // 6 Concentric hexagonal warp rings zooming outward continuously
    for (let rIdx = 0; rIdx < 6; rIdx++) {
      const prog = ((rIdx + t) / 6); // 0 .. 1 zooming outward
      const rad = 8 + Math.pow(prog, 1.45) * 78;
      const rot = phase * (rIdx % 2 === 0 ? 1 : -1) + prog * 1.2;
      const alpha = Math.sin(prog * Math.PI) * 0.9;
      for (let side = 0; side < 6; side++) {
        const a0 = rot + (side * TAU) / 6;
        const a1 = rot + (((side + 1) % 6) * TAU) / 6;
        line(
          cx + rad * Math.cos(a0),
          cy + rad * Math.sin(a0),
          cx + rad * Math.cos(a1),
          cy + rad * Math.sin(a1),
          2.1,
          rIdx % 2 === 0 ? ar : sr,
          rIdx % 2 === 0 ? ag : sg,
          rIdx % 2 === 0 ? ab : sb,
          alpha
        );
      }
    }
    dot(cx, cy, 14 + Math.sin(phase * 2) * 3, 255, 255, 255, 0.9);
  }

  // Smoothly feather the outer boundary (r = 43..47) into the dark ambient background so
  // 100% of the animation sits inside the solid r=48 hardware sprite window with ZERO ring and ZERO cut-off!
  for (let y = 0; y < H; y++) {
    const yf = y / (H - 1);
    const rBase = tr + (br - tr) * yf;
    const gBase = tg + (bg - tg) * yf;
    const bBase = tb + (bb - tb) * yf;
    const dy = y - cy;
    for (let x = 0; x < W; x++) {
      const dx = x - cx;
      const dist = Math.hypot(dx, dy);
      if (dist <= 43) continue;
      const i = (y * W + x) * 4;
      const glow = Math.max(0, 1 - dist / 64);
      const g2 = glow * glow * 0.34;
      const bgR = Math.min(255, rBase + ar * g2 * 0.35);
      const bgG = Math.min(255, gBase + ag * g2 * 0.45);
      const bgB = Math.min(255, bBase + ab * g2 * 0.85);
      if (dist >= 47) {
        px[i] = bgR;
        px[i + 1] = bgG;
        px[i + 2] = bgB;
      } else {
        const keep = (47 - dist) / 4;
        px[i] = bgR + (px[i] - bgR) * keep;
        px[i + 1] = bgG + (px[i + 1] - bgG) * keep;
        px[i + 2] = bgB + (px[i + 2] - bgB) * keep;
      }
    }
  }

  return px;
}

/**
 * Convert an array of 240×280 RGBA frames (`Uint8ClampedArray[]`) into:
 * - `baseRgba`: static 240×280 RGBA backdrop (`id=0`)
 * - `sprites`: 49 `z=1` RLE-compressed hardware sprites (`id=2..50`) where `id=18..33`
 *   hold 16 animation frames encoded as solid zero-lag hardware sprites over `baseRgba`.
 */
function rgbArrToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}

export const LOW_RES_PRESETS = {
  '64x64': {
    id: '64x64',
    label: '88×88 · 2×2 Ultra-Fast Solid (~220 KB)',
    shortLabel: '88×88 · 2×2 Fast',
    maxRadius: 44,
    pixelSize: 2,
    scanlineStep: 1,
  },
  '80x80': {
    id: '80x80',
    label: '96×96 · 1×1 Crisp Solid (Recommended)',
    shortLabel: '96×96 · 1×1 Crisp',
    maxRadius: 48,
    pixelSize: 1,
    scanlineStep: 1,
  },
  '96x96': {
    id: '96x96',
    label: '104×104 · 1×1 Large Solid (~330 KB)',
    shortLabel: '104×104 · 1×1 HD',
    maxRadius: 52,
    pixelSize: 1,
    scanlineStep: 1,
  },
  '128x128_scan': {
    id: '128x128_scan',
    label: '104×104 · 2×2 Smooth Block (~310 KB)',
    shortLabel: '104×104 · 2×2 Block',
    maxRadius: 52,
    pixelSize: 2,
    scanlineStep: 1,
  },
  '148x148_scan': {
    id: '148x148_scan',
    label: '96×96 · 3×3 Retro Pixel (~240 KB)',
    shortLabel: '96×96 · 3×3 Retro',
    maxRadius: 48,
    pixelSize: 3,
    scanlineStep: 1,
  },
};

export function resolveLowResSpec(opts = {}) {
  const key = opts.resolution && LOW_RES_PRESETS[opts.resolution] ? opts.resolution : '80x80';
  const preset = LOW_RES_PRESETS[key];
  const maxR = clamp(opts.maxRadius ?? preset.maxRadius ?? 48, 36, 56);
  const pixelSize = clamp(opts.pixelSize ?? preset.pixelSize ?? 1, 1, 6);
  const scanlineStep = 1;
  return { key, preset, maxR, pixelSize, scanlineStep };
}

/**
 * Compute a clean static 240×280 RGBA background (`id=0`) from a sequence of animation frames
 * with ZERO frozen outer graphics and ZERO artificial rings or holes!
 */
export function computeCleanBaseRgba(framesRgba) {
  const out = new Uint8ClampedArray(W * H * 4);
  if (!framesRgba?.length) return out;
  const f0 = framesRgba[0];
  // Sample ambient dark tone from corners of frame 0 so id=0 is a seamless dark backdrop
  let rAvg = 0, gAvg = 0, bAvg = 0, cnt = 0;
  for (const [sx, sy] of [[16, 16], [W - 17, 16], [16, H - 17], [W - 17, H - 17]]) {
    const i = (sy * W + sx) * 4;
    rAvg += f0[i]; gAvg += f0[i + 1]; bAvg += f0[i + 2]; cnt++;
  }
  const tr = Math.min(24, Math.round((rAvg / cnt) * 0.25));
  const tg = Math.min(28, Math.round((gAvg / cnt) * 0.25));
  const tb = Math.min(38, Math.round((bAvg / cnt) * 0.3));
  for (let y = 0; y < H; y++) {
    const yf = y / (H - 1);
    const r = Math.round(tr * (1 - yf * 0.35));
    const g = Math.round(tg * (1 - yf * 0.35));
    const b = Math.round(tb * (1 - yf * 0.35));
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = 255;
    }
  }
  return out;
}

/**
 * Encode the active moving circular window (`r <= maxR`, 100% solid `mask = 0`, 1 contiguous span per row)
 * into `rgb = Uint16Array(W * H)` (true 16-bit RGB565) and `mask = Uint8Array(W * H)` (`0` = opaque).
 * Because 100% of the scene/GIF fits inside `r <= maxR` and softly feathers into `baseRgba` at the edge,
 * the entire graphic moves as one piece with ZERO hole and ZERO frozen outer border!
 */
export function quantizeLowResFrame(frameRgba, baseRgba, opts = {}) {
  const { maxR, pixelSize, scanlineStep } = resolveLowResSpec(opts);
  const maxR2 = maxR * maxR;
  const featherStart = maxR - 4;
  const base = baseRgba || frameRgba;
  // When encoding an uploaded full-canvas GIF/video (`!opts.scene || opts.scene === 'custom_media'`),
  // scale the full source frame into the `r <= maxR` moving window so nothing gets cut off or frozen outside!
  const fitFullFrame = opts.fitFullFrame ?? (opts.scene === 'custom_media');
  const srcScale = fitFullFrame ? (96 / Math.max(1, maxR)) : 1;

  const rgb = new Uint16Array(W * H);
  const mask = new Uint8Array(W * H).fill(255);
  let activeSpans = 0;
  let activePixels = 0;

  const yStart = Math.max(8, CY - maxR);
  const yEnd = Math.min(H - 8, CY + maxR);

  for (let y = yStart; y <= yEnd; y++) {
    const dy = y - CY;
    const dxLim = Math.floor(Math.sqrt(Math.max(0, maxR2 - dy * dy)));
    if (dxLim < 1) continue;
    const x0 = Math.max(4, CX - dxLim);
    const x1 = Math.min(W - 5, CX + dxLim);
    activeSpans++;

    const qy = pixelSize > 1
      ? CY + Math.floor((y - CY) / pixelSize) * pixelSize + (pixelSize >> 1)
      : y;
    const sy = clamp(Math.round(CY + (qy - CY) * srcScale), 0, H - 1);

    for (let x = x0; x <= x1; x++) {
      const dx = x - CX;
      const dist = Math.hypot(dx, dy);
      const qx = pixelSize > 1
        ? CX + Math.floor((x - CX) / pixelSize) * pixelSize + (pixelSize >> 1)
        : x;
      const sx = clamp(Math.round(CX + (qx - CX) * srcScale), 0, W - 1);

      const si = (sy * W + sx) * 4;
      const bi = (y * W + x) * 4;
      let r = frameRgba[si];
      let g = frameRgba[si + 1];
      let b = frameRgba[si + 2];

      if (dist > featherStart) {
        const keep = clamp((maxR - dist) / Math.max(1, maxR - featherStart), 0, 1);
        r = Math.round(base[bi] + (r - base[bi]) * keep);
        g = Math.round(base[bi + 1] + (g - base[bi + 1]) * keep);
        b = Math.round(base[bi + 2] + (b - base[bi + 2]) * keep);
      }

      const p = y * W + x;
      rgb[p] = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
      mask[p] = 0;
      activePixels++;
    }
  }

  return { rgb, mask, activeSpans, activePixels, maxR, pixelSize, scanlineStep };
}

/**
 * Render the exact 240×280 RGBA image that the watch hardware displays when the converted
 * sprite is composited over `baseRgba`.
 */
export function renderLowResPreviewRgba(frameRgba, baseRgba, opts = {}) {
  const base = baseRgba || frameRgba;
  const out = new Uint8ClampedArray(base);
  const { rgb, mask } = quantizeLowResFrame(frameRgba, base, opts);
  for (let p = 0; p < W * H; p++) {
    if (mask[p] === 255) continue;
    const v = rgb[p];
    const r5 = (v >> 11) & 31;
    const g6 = (v >> 5) & 63;
    const b5 = v & 31;
    const di = p * 4;
    out[di] = (r5 << 3) | (r5 >> 2);
    out[di + 1] = (g6 << 2) | (g6 >> 4);
    out[di + 2] = (b5 << 3) | (b5 >> 2);
    out[di + 3] = 255;
  }
  return out;
}

/**
 * Encode a single 240×280 RGBA animation frame into a zero-lag `z=1` hardware delta sprite
 * over `baseRgba` across the full `r <= 86` watchface area with true 16-bit RGB565 (`Uint16Array`).
 */
export function deltaFrameToSprite(frameRgba, baseRgba, id, opts = {}) {
  const { rgb, mask } = quantizeLowResFrame(frameRgba, baseRgba, opts);
  return encodeSprite({ id, w: W, h: H, rgb, mask });
}

/**
 * Analyze an array of 240×280 RGBA frames (e.g. from an uploaded GIF/video) to extract its
 * dominant vibrant glow colors for UI accents.
 */
export function analyzeGifFrames(framesRgba, baseRgba) {
  if (!framesRgba?.length) {
    return { accentColor: '#d946ef', secondaryColor: '#38bdf8', radius: 74 };
  }
  const f0 = baseRgba || framesRgba[0];
  const fMid = framesRgba[Math.min(framesRgba.length - 1, Math.floor(framesRgba.length / 2))] || f0;
  let r1 = 0, g1 = 0, b1 = 0, w1 = 0;
  let r2 = 0, g2 = 0, b2 = 0, w2 = 0;
  let rSum = 0, rWeight = 0;

  for (let y = 24; y < H - 24; y += 2) {
    for (let x = 12; x < W - 12; x += 2) {
      const i = (y * W + x) * 4;
      const cr = fMid[i], cg = fMid[i + 1], cb = fMid[i + 2];
      const maxC = Math.max(cr, cg, cb), minC = Math.min(cr, cg, cb);
      const sat = maxC - minC;
      if (maxC < 50 || sat < 25) continue;
      const diff = Math.abs(cr - f0[i]) + Math.abs(cg - f0[i + 1]) + Math.abs(cb - f0[i + 2]);
      const weight = sat + diff * 1.5;
      const dist = Math.hypot(x - CX, y - CY);
      if (dist >= 28 && dist <= 96) {
        rSum += dist * weight;
        rWeight += weight;
      }
      if (cr >= cb) {
        r1 += cr * weight; g1 += cg * weight; b1 += cb * weight; w1 += weight;
      } else {
        r2 += cr * weight; g2 += cg * weight; b2 += cb * weight; w2 += weight;
      }
    }
  }
  const accentColor = w1 > 0 ? rgbArrToHex(r1 / w1, g1 / w1, b1 / w1) : '#d946ef';
  const secondaryColor = w2 > 0 ? rgbArrToHex(r2 / w2, g2 / w2, b2 / w2) : '#38bdf8';
  const radius = rWeight > 0 ? clamp(Math.round(rSum / rWeight), 52, 82) : 74;
  return { accentColor, secondaryColor, radius };
}

/**
 * Build 49 zero-lag hardware sprites (`id = 2..50`) directly from the 16 frames of an
 * animated GIF, MP4/WebM video, or animated scene — NO orbital rings!
 * - `id = 2..17` (minute) & `id = 34..49` (hour) & `id = 50` (cap) use a 1-pixel transparent anchor
 *   so the watch MCU only blits 1 active frame sprite per tick.
 * - `id = 18..33` encode the 16 actual low-resolution animation frames via `deltaFrameToSprite`.
 */
export function buildVideoWatchSprites(framesRgba, baseRgba, opts = {}) {
  const cleanBase = baseRgba || computeCleanBaseRgba(framesRgba, opts);
  const count = framesRgba?.length || 0;
  const tinySpr = rasterize(hiddenLayer(), 0);
  const sprites = [];

  for (let k = 0; k < 16; k++) {
    const id = 2 + k;
    sprites.push({ id, data: encodeSprite({ ...tinySpr, id }) });
  }
  for (let k = 0; k < 16; k++) {
    const id = 18 + k;
    const frame = count > 0
      ? framesRgba[Math.min(count - 1, Math.floor((k / 16) * count))]
      : cleanBase;
    sprites.push({ id, data: deltaFrameToSprite(frame, cleanBase, id, opts) });
  }
  for (let k = 0; k < 16; k++) {
    const id = 34 + k;
    sprites.push({ id, data: encodeSprite({ ...tinySpr, id }) });
  }
  sprites.push({ id: 50, data: encodeSprite({ ...tinySpr, id: 50 }) });
  return sprites;
}

// ============================================================================
// PART 2: Browser Animated GIF & Video (MP4 / WebM) Low-FPS & Low-Res Frame Extractor
// ============================================================================

/**
 * Extract `targetFrames` downscaled canvases from an animated `.gif` or video (`.mp4`, `.webm`, `.mov`) File
 * sampled at `targetFps`. Works entirely in the browser with zero external dependencies.
 */
export async function extractMediaFrames(file, { targetFrames = 16, targetFps = 4 } = {}) {
  const isGif = file.type === 'image/gif' || /\.gif$/i.test(file.name || '');
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name || '');
  const maxDim = 320; // Downscale extracted source frames to save memory & speed up low-res conversion

  if (isGif && typeof ImageDecoder !== 'undefined') {
    try {
      const buf = await file.arrayBuffer();
      const decoder = new ImageDecoder({ data: buf, type: 'image/gif' });
      await decoder.tracks.ready;
      const track = decoder.tracks.selectedTrack;
      const total = track.frameCount || 1;
      const count = Math.min(targetFrames, Math.max(1, total));
      const frames = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.min(total - 1, Math.floor((i / count) * total));
        const { image } = await decoder.decode({ frameIndex: idx });
        const sw = image.displayWidth || W;
        const sh = image.displayHeight || H;
        const sc = Math.min(1, maxDim / Math.max(sw, sh));
        const c = document.createElement('canvas');
        c.width = Math.max(16, Math.round(sw * sc));
        c.height = Math.max(16, Math.round(sh * sc));
        c.getContext('2d').drawImage(image, 0, 0, c.width, c.height);
        image.close();
        frames.push({ canvas: c });
      }
      decoder.close();
      if (frames.length > 0) return { frames, fps: targetFps, type: 'gif', originalCount: total };
    } catch {
      // Fall through to video/image fallback
    }
  }

  if (isVideo) {
    const url = URL.createObjectURL(file);
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = url;
      await new Promise((res, rej) => {
        video.onloadeddata = () => res();
        video.onerror = () => rej(new Error('Could not decode video file'));
      });
      const rawDur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 2.5;
      // Sample targetFrames at targetFps across the video clip
      const clipWindow = Math.min(rawDur, Math.max(1.0, targetFrames / Math.max(1, targetFps)));
      const count = clamp(targetFrames, 4, 24);
      const sw = video.videoWidth || W;
      const sh = video.videoHeight || H;
      const sc = Math.min(1, maxDim / Math.max(sw, sh));
      const cw = Math.max(16, Math.round(sw * sc));
      const ch = Math.max(16, Math.round(sh * sc));
      const frames = [];
      for (let i = 0; i < count; i++) {
        video.currentTime = Math.min(rawDur - 0.01, (i / count) * clipWindow);
        await new Promise(r => {
          const done = () => { video.removeEventListener('seeked', done); r(); };
          video.addEventListener('seeked', done);
          setTimeout(done, 250);
        });
        const c = document.createElement('canvas');
        c.width = cw;
        c.height = ch;
        c.getContext('2d').drawImage(video, 0, 0, cw, ch);
        frames.push({ canvas: c });
      }
      return { frames, fps: targetFps, type: 'video', originalCount: count, duration: clipWindow };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Fallback for single static image or unsupported GIF environment:
  // animate subtle zoom/pan pulse across targetFrames
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Could not load media file'));
      i.src = url;
    });
    const frames = [];
    const iw = img.naturalWidth || img.width || W;
    const ih = img.naturalHeight || img.height || H;
    const sc = Math.min(1, maxDim / Math.max(iw, ih));
    const cw = Math.max(16, Math.round(iw * sc));
    const ch = Math.max(16, Math.round(ih * sc));
    for (let i = 0; i < targetFrames; i++) {
      const phase = (i / targetFrames) * TAU;
      const zoom = 1.04 + 0.04 * Math.sin(phase);
      const c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      const ctx = c.getContext('2d');
      const dw = cw * zoom, dh = ch * zoom;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      frames.push({ canvas: c });
    }
    return { frames, fps: targetFps, type: 'image-loop', originalCount: targetFrames };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ============================================================================
// PART 3: Orbital Sprite Channels (kept for backward compatibility & unit tests)
// ============================================================================

const polar = (r, aDeg) => [r * Math.sin(aDeg * DEG), -r * Math.cos(aDeg * DEG)];

const circle = (cx, cy, r, k = 28) =>
  Array.from({ length: k }, (_, i) => [cx + r * Math.cos((i / k) * TAU), cy + r * Math.sin((i / k) * TAU)]);

const ring = (cx, cy, rOut, rIn, k = 44) => [circle(cx, cy, rOut, k), circle(cx, cy, rIn, k)];

function arcBand(rIn, rOut, a0, a1, steps = 18) {
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(polar(rOut, a0 + ((a1 - a0) * i) / steps));
  for (let i = steps; i >= 0; i--) pts.push(polar(rIn, a0 + ((a1 - a0) * i) / steps));
  return pts;
}

function star4(cx, cy, rOut, rIn = rOut * 0.32) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = (i * Math.PI) / 4;
    pts.push([cx + r * Math.sin(a), cy - r * Math.cos(a)]);
  }
  return pts;
}

function radialBar(aDeg, rIn, rOut, hw) {
  const c = Math.cos(aDeg * DEG), s = Math.sin(aDeg * DEG);
  const rect = [[-hw, -rOut], [hw, -rOut], [hw, -rIn], [-hw, -rIn]];
  return rect.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}

function rotPts(pts, aDeg) {
  const c = Math.cos(aDeg * DEG), s = Math.sin(aDeg * DEG);
  return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}

const hiddenLayer = () => [{ paths: [circle(0, 0, 0.6, 8)], fill: [0, 0, 0], alpha: 0.05 }];

export const FAST_STYLES = {
  koi_pair: {
    label: 'Twin Bioluminescent Koi (Default #2)',
    build: ({ r, size, color, trail }) => {
      const out = [];
      for (const baseA of [0, 180]) {
        // Curved bioluminescent wake segments
        for (let i = 0; i < 6; i++) {
          const t0 = i / 6, t1 = (i + 1) / 6;
          const a0 = baseA - 48 * t1, a1 = baseA - 48 * t0;
          const w = size * (1 - t0 * 0.72);
          const wave = Math.sin(i * 1.3) * 2.2;
          out.push({
            paths: [arcBand(r + wave - w * 0.65, r + wave + w * 0.65, a0, a1, 7)],
            fill: i < 2 ? color : trail,
            alpha: 0.75 * (1 - t0 * 0.72),
          });
        }
        // Feathery pectoral fins
        const [fx1, fy1] = polar(r + size * 1.15, baseA - 10);
        const [fx2, fy2] = polar(r - size * 1.15, baseA - 10);
        out.push({ paths: [circle(fx1, fy1, size * 0.55, 12)], fill: trail, alpha: 0.55 });
        out.push({ paths: [circle(fx2, fy2, size * 0.55, 12)], fill: trail, alpha: 0.55 });
        // Flared caudal tail fin
        const [tx1, ty1] = polar(r + size * 0.85, baseA - 44);
        const [tx2, ty2] = polar(r - size * 0.85, baseA - 44);
        out.push({ paths: [circle(tx1, ty1, size * 0.48, 12), circle(tx2, ty2, size * 0.48, 12)], fill: color, alpha: 0.5 });
        // Glowing koi head + bright core
        const [hx, hy] = polar(r, baseA);
        out.push({ paths: [circle(hx, hy, size * 1.25, 18)], fill: trail, alpha: 0.45 });
        out.push({ paths: [circle(hx, hy, size * 0.85, 18)], fill: color });
        out.push({ paths: [circle(hx, hy, size * 0.42, 12)], fill: [255, 255, 255] });
      }
      return out;
    },
  },
  comet: {
    label: 'Comet + plasma tail',
    build: ({ r, size, color, trail }) => {
      const segs = 7;
      const tailLayers = [];
      for (let i = 0; i < segs; i++) {
        const t0 = i / segs, t1 = (i + 1) / segs;
        const a0 = -52 * t1, a1 = -52 * t0;
        const w = size * (1 - t0 * 0.78);
        tailLayers.push({
          paths: [arcBand(r - w * 0.65, r + w * 0.65, a0, a1, 8)],
          fill: trail,
          alpha: 0.62 * (1 - t0 * 0.82),
        });
      }
      return [
        ...tailLayers,
        { paths: [circle(0, -r, size * 1.45, 24)], fill: color, alpha: 0.28 },
        { paths: [circle(0, -r, size, 24)], fill: color },
        { paths: [circle(0, -r, size * 0.48, 16)], fill: [255, 255, 255] },
      ];
    },
  },
  radar_fan: {
    label: 'Radar scanner fan',
    build: ({ r, size, color, trail }) => {
      const rIn = Math.max(18, r * 0.34);
      const fan = [];
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const a0 = -42 * ((i + 1) / steps), a1 = -42 * (i / steps);
        fan.push({
          paths: [arcBand(rIn, r, a0, a1, 8)],
          fill: trail,
          alpha: 0.38 * (1 - i / steps),
        });
      }
      const bw = Math.max(1.1, size * 0.22);
      return [
        ...fan,
        { paths: [radialBar(0, rIn, r, bw)], fill: color },
        { paths: [circle(0, -r * 0.82, size * 0.9, 20)], fill: color, alpha: 0.3 },
        { paths: [circle(0, -r * 0.82, size * 0.45, 16)], fill: [255, 255, 255] },
      ];
    },
  },
  chaser_dots: {
    label: 'Neon chaser dots (6×)',
    build: ({ r, size, color, trail }) => {
      const out = [];
      for (let i = 5; i >= 0; i--) {
        const a = -i * 9.5;
        const [cx, cy] = polar(r, a);
        const rad = size * (1 - i * 0.13);
        const col = i === 0 ? color : trail;
        const al = i === 0 ? 1 : 0.85 - i * 0.13;
        out.push({ paths: [circle(cx, cy, rad * 1.35, 18)], fill: col, alpha: al * 0.28 });
        out.push({ paths: [circle(cx, cy, rad, 18)], fill: col, alpha: al });
      }
      return out;
    },
  },
  turbine_3: {
    label: 'Cyber turbine blades (3×)',
    build: ({ r, size, color, trail }) => {
      const w = Math.max(2, size * 0.55);
      const out = [];
      for (const base of [0, 120, 240]) {
        out.push({ paths: [arcBand(r - w * 1.3, r + w * 1.3, base - 28, base + 4, 14)], fill: trail, alpha: 0.25 });
        out.push({ paths: [arcBand(r - w * 0.7, r + w * 0.7, base - 24, base, 12)], fill: color, alpha: 0.88 });
        const [px, py] = polar(r, base);
        out.push({ paths: [circle(px, py, w * 0.9, 16)], fill: [255, 255, 255] });
      }
      return out;
    },
  },
  star_swirl: {
    label: 'Shooting star swirl',
    build: ({ r, size, color, trail }) => {
      const out = [];
      const specs = [[0, r, 1.0], [-18, r - 6, 0.7], [-36, r + 4, 0.52], [180, r, 0.85], [162, r - 5, 0.6]];
      for (const [a, rad, sc] of specs) {
        const [cx, cy] = polar(rad, a);
        out.push({ paths: [arcBand(rad - 1.5, rad + 1.5, a - 14, a, 8)], fill: trail, alpha: 0.45 * sc });
        out.push({ paths: [star4(cx, cy, size * 1.45 * sc)], fill: color, alpha: 0.95 });
        out.push({ paths: [circle(cx, cy, size * 0.35 * sc, 12)], fill: [255, 255, 255] });
      }
      return out;
    },
  },
  eq_bars: {
    label: 'Sonic equalizer ring',
    build: ({ r, size, color, trail }) => {
      const out = [];
      const heights = [1.0, 0.65, 0.4, 0.8, 0.5, 0.9, 0.55, 0.75, 0.45, 0.85, 0.6, 0.7];
      for (let i = 0; i < 12; i++) {
        const a = i * 30;
        const h = size * 1.9 * heights[i];
        const col = i % 2 === 0 ? color : trail;
        out.push({ paths: [radialBar(a, r - h * 0.5, r + h * 0.5, 2.2)], fill: col, alpha: 0.9 });
      }
      return out;
    },
  },
  rim_needle: {
    label: 'GT rim pointer (hollow center)',
    build: ({ r, size, color, trail }) => {
      const rIn = Math.max(48, r - size * 2.8);
      const rOut = Math.min(116, r + size * 0.8);
      const w = Math.max(2.2, size * 0.42);
      return [
        { paths: [arcBand(r - 2, r + 2, -26, -4, 10)], fill: trail, alpha: 0.45 },
        { paths: [[[-w * 1.3, -rIn], [0, -rOut], [w * 1.3, -rIn]]], fill: color },
        { paths: [[[-w * 0.45, -rIn - 3], [0, -rOut + 2], [w * 0.45, -rIn - 3]]], fill: [255, 255, 255] },
      ];
    },
  },
  twin_comets: {
    label: 'Twin quantum electrons',
    build: ({ r, size, color, trail }) => {
      const out = [];
      for (const base of [0, 180]) {
        for (let i = 0; i < 5; i++) {
          const t0 = i / 5, t1 = (i + 1) / 5;
          const w = size * (1 - t0 * 0.75);
          out.push({
            paths: [arcBand(r - w * 0.55, r + w * 0.55, base - 38 * t1, base - 38 * t0, 8)],
            fill: trail,
            alpha: 0.55 * (1 - t0 * 0.8),
          });
        }
        const [cx, cy] = polar(r, base);
        out.push({ paths: [circle(cx, cy, size * 1.35, 20)], fill: color, alpha: 0.3 });
        out.push({ paths: [circle(cx, cy, size * 0.9, 20)], fill: color });
        out.push({ paths: [circle(cx, cy, size * 0.42, 14)], fill: [255, 255, 255] });
      }
      return out;
    },
  },
  orb: {
    label: 'Glowing beacon orb',
    build: ({ r, size, color, trail }) => [
      { paths: [circle(0, -r, size * 1.6, 24)], fill: trail, alpha: 0.25 },
      { paths: [circle(0, -r, size * 1.15, 24)], fill: color, alpha: 0.6 },
      { paths: [circle(0, -r, size * 0.78, 20)], fill: color },
      { paths: [circle(0, -r, size * 0.36, 14)], fill: [255, 255, 255] },
    ],
  },
  none: { label: 'Hidden', build: hiddenLayer },
};

export const MEDIUM_STYLES = {
  planet_moon: {
    label: 'Planet + orbiting moon',
    build: ({ r, size, color }) => {
      const mx = size * 1.75, my = -r - size * 1.05;
      return [
        { paths: [circle(0, -r, size * 1.35, 24)], fill: color, alpha: 0.25 },
        { paths: [circle(0, -r, size, 24)], fill: color },
        { paths: [circle(-size * 0.28, -r - size * 0.28, size * 0.35, 14)], fill: shade(color, 1.35) },
        { paths: [circle(mx, my, Math.max(2, size * 0.38), 16)], fill: [240, 246, 255] },
      ];
    },
  },
  hud_brackets: {
    label: 'Perimeter HUD lock brackets',
    build: ({ r, size, color }) => {
      const w = Math.max(2, size * 0.38);
      return [
        { paths: [arcBand(r - w, r + w, -16, 16, 12)], fill: color },
        { paths: [arcBand(r - w, r + w, 164, 196, 12)], fill: color },
        { paths: [radialBar(-16, r - w * 2.6, r + w, w * 0.8)], fill: color },
        { paths: [radialBar(16, r - w * 2.6, r + w, w * 0.8)], fill: color },
      ];
    },
  },
  data_arcs: {
    label: '4× Segmented tech arcs',
    build: ({ r, size, color }) => {
      const w = Math.max(1.8, size * 0.35);
      return [0, 90, 180, 270].map(a => ({
        paths: [arcBand(r - w, r + w, a - 14, a + 14, 10)],
        fill: color,
        alpha: 0.88,
      }));
    },
  },
  twin_capsules: {
    label: 'Twin neon capsules',
    build: ({ r, size, color }) => {
      const w = Math.max(2, size * 0.45);
      return [0, 180].flatMap(a => [
        { paths: [arcBand(r - w * 1.4, r + w * 1.4, a - 10, a + 10, 10)], fill: color, alpha: 0.28 },
        { paths: [arcBand(r - w * 0.8, r + w * 0.8, a - 8, a + 8, 10)], fill: color },
      ]);
    },
  },
  star_cluster: {
    label: 'Nebula star cluster',
    build: ({ r, size, color }) => {
      const [x1, y1] = polar(r, 0);
      const [x2, y2] = polar(r - 5, -14);
      const [x3, y3] = polar(r + 4, 12);
      return [
        { paths: [star4(x1, y1, size * 1.3)], fill: color },
        { paths: [star4(x2, y2, size * 0.78)], fill: shade(color, 1.2), alpha: 0.85 },
        { paths: [circle(x3, y3, Math.max(1.6, size * 0.32), 12)], fill: [255, 255, 255] },
      ];
    },
  },
  bezel_chevron: {
    label: 'Bezel index triangle',
    build: ({ r, size, color }) => {
      const s = size * 1.15;
      return [
        { paths: [[[-s, -r - s * 0.7], [s, -r - s * 0.7], [0, -r + s * 0.9]]], fill: color },
        { paths: [[[-s * 0.45, -r - s * 0.45], [s * 0.45, -r - s * 0.45], [0, -r + s * 0.35]]], fill: [255, 255, 255] },
      ];
    },
  },
  orb: {
    label: 'Glowing orb',
    build: ({ r, size, color }) => [
      { paths: [circle(0, -r, size * 1.3, 22)], fill: color, alpha: 0.3 },
      { paths: [circle(0, -r, size * 0.85, 20)], fill: color },
    ],
  },
  none: { label: 'Hidden', build: hiddenLayer },
};

export const SLOW_STYLES = {
  saturn: {
    label: 'Ringed Saturn planet',
    build: ({ r, size, color }) => {
      const ringOuter = rotPts(
        Array.from({ length: 32 }, (_, i) => [size * 2.1 * Math.cos((i / 32) * TAU), size * 0.65 * Math.sin((i / 32) * TAU)]),
        -24
      ).map(([x, y]) => [x, y - r]);
      const ringInner = rotPts(
        Array.from({ length: 32 }, (_, i) => [size * 1.35 * Math.cos((i / 32) * TAU), size * 0.42 * Math.sin((i / 32) * TAU)]),
        -24
      ).map(([x, y]) => [x, y - r]);
      return [
        { paths: [ringOuter, ringInner], fill: shade(color, 1.2), alpha: 0.85 },
        { paths: [circle(0, -r, size * 0.95, 22)], fill: color },
        { paths: [circle(-size * 0.25, -r - size * 0.25, size * 0.3, 12)], fill: [255, 250, 220] },
      ];
    },
  },
  diamond_bug: {
    label: 'Tactical diamond marker',
    build: ({ r, size, color }) => {
      const s = size * 1.1;
      return [
        { paths: [[[0, -r - s], [s * 0.8, -r], [0, -r + s], [-s * 0.8, -r]]], fill: color },
        { paths: [circle(0, -r, s * 0.28, 12)], fill: [255, 255, 255] },
      ];
    },
  },
  triad_nodes: {
    label: '3× Reactor triad nodes',
    build: ({ r, size, color }) =>
      [0, 120, 240].flatMap(a => {
        const [cx, cy] = polar(r, a);
        return [
          { paths: [circle(cx, cy, size * 1.1, 18)], fill: color, alpha: 0.3 },
          { paths: [circle(cx, cy, size * 0.68, 16)], fill: color },
        ];
      }),
  },
  pulsar_pair: {
    label: 'Binary pulsar stars',
    build: ({ r, size, color }) =>
      [0, 180].map(a => {
        const [cx, cy] = polar(r, a);
        return { paths: [star4(cx, cy, size * 1.25)], fill: color };
      }),
  },
  orb: {
    label: 'Glowing orb',
    build: ({ r, size, color }) => [
      { paths: [circle(0, -r, size * 1.25, 20)], fill: color, alpha: 0.3 },
      { paths: [circle(0, -r, size * 0.82, 18)], fill: color },
    ],
  },
  none: { label: 'Hidden', build: hiddenLayer },
};

export const TRACK_STYLES = {
  orbit_rings: {
    label: 'Dotted planetary orbit rings',
    build: ({ color, r1 = 62, r2 = 82, r3 = 102 }) => {
      const dots = [];
      for (const [rad, cnt] of [[r1, 24], [r2, 32], [r3, 40]]) {
        for (let i = 0; i < cnt; i++) {
          const [x, y] = polar(rad, (i * 360) / cnt);
          dots.push(circle(x, y, 1.05, 8));
        }
      }
      return [{ paths: dots, fill: color, alpha: 0.42 }];
    },
  },
  radar_grid: {
    label: 'Radar range rings + crosshair',
    build: ({ color }) => {
      const paths = [
        ...ring(0, 0, 105, 103.5, 56),
        ...ring(0, 0, 74, 72.8, 44),
      ];
      for (let i = 0; i < 36; i++) {
        const a = i * 10;
        const len = i % 9 === 0 ? 9 : i % 3 === 0 ? 5 : 2.5;
        paths.push(radialBar(a, 105 - len, 105, i % 9 === 0 ? 1.3 : 0.8));
      }
      return [{ paths, fill: color, alpha: 0.55 }];
    },
  },
  cyber_corners: {
    label: 'Sci-Fi HUD corner brackets',
    build: ({ color }) => {
      const b = (sx, sy) => {
        const x = sx * 110, y = sy * 128, dx = -sx * 24, dy = -sy * 24, t = 3.2;
        return [
          [[x, y], [x + dx, y], [x + dx, y - sy * t], [x - sx * t, y - sy * t], [x - sx * t, y + dy], [x, y + dy]],
        ];
      };
      return [
        { paths: [...b(-1, -1), ...b(1, -1), ...b(1, 1), ...b(-1, 1)], fill: color, alpha: 0.78 },
        { paths: ring(0, 0, 109, 107.6, 56), fill: color, alpha: 0.32 },
      ];
    },
  },
  bezel_60: {
    label: '60-Tick precision bezel',
    build: ({ color }) => {
      const major = [], minor = [];
      for (let i = 0; i < 60; i++) {
        const a = i * 6;
        if (i % 5 === 0) major.push(radialBar(a, 102, 110, 1.4));
        else minor.push(radialBar(a, 106, 110, 0.75));
      }
      return [
        { paths: minor, fill: color, alpha: 0.4 },
        { paths: major, fill: color, alpha: 0.85 },
      ];
    },
  },
  tachymeter: {
    label: 'GT racing tachymeter rim',
    build: ({ color }) => {
      const ticks = [], redline = [];
      for (let i = 0; i < 60; i++) {
        const a = i * 6;
        const bar = radialBar(a, i % 5 === 0 ? 100 : 105, 112, i % 5 === 0 ? 1.6 : 0.85);
        if (i <= 15) redline.push(bar);
        else ticks.push(bar);
      }
      return [
        { paths: ticks, fill: color, alpha: 0.75 },
        { paths: redline, fill: [239, 68, 68], alpha: 0.95 },
      ];
    },
  },
  cardinal_stars: {
    label: 'Cardinal compass stars',
    build: ({ color }) => [
      { paths: [0, 90, 180, 270].map(a => { const [x, y] = polar(106, a); return star4(x, y, 5.5); }), fill: color, alpha: 0.85 },
    ],
  },
  none: { label: 'None (clean)', build: hiddenLayer },
};

export const MOTION_PRESETS = {
  solar: {
    name: 'Solar Orbit',
    fast: { style: 'comet', r: 102, size: 6.5, color: '#38bdf8', trail: '#818cf8' },
    medium: { style: 'planet_moon', r: 82, size: 6.5, color: '#34d399' },
    slow: { style: 'saturn', r: 62, size: 6, color: '#fbbf24' },
    track: { style: 'orbit_rings', color: '#94a3b8' },
  },
  radar: {
    name: 'Radar Scanner',
    fast: { style: 'radar_fan', r: 102, size: 6, color: '#4ade80', trail: '#22c55e' },
    medium: { style: 'hud_brackets', r: 106, size: 6, color: '#22d3ee' },
    slow: { style: 'diamond_bug', r: 74, size: 5.5, color: '#facc15' },
    track: { style: 'radar_grid', color: '#16a34a' },
  },
  cyber: {
    name: 'Cyber Reactor',
    fast: { style: 'turbine_3', r: 94, size: 6.5, color: '#22d3ee', trail: '#0ea5e9' },
    medium: { style: 'data_arcs', r: 106, size: 6, color: '#a855f7' },
    slow: { style: 'triad_nodes', r: 76, size: 5, color: '#f43f5e' },
    track: { style: 'cyber_corners', color: '#38bdf8' },
  },
  pulse: {
    name: 'Neon Chaser',
    fast: { style: 'chaser_dots', r: 104, size: 6, color: '#f43f5e', trail: '#fb923c' },
    medium: { style: 'twin_capsules', r: 88, size: 5.5, color: '#a855f7' },
    slow: { style: 'orb', r: 72, size: 5, color: '#38bdf8' },
    track: { style: 'bezel_60', color: '#e2e8f0' },
  },
  galaxy: {
    name: 'Star Vortex',
    fast: { style: 'star_swirl', r: 98, size: 6.5, color: '#fde047', trail: '#c084fc' },
    medium: { style: 'star_cluster', r: 78, size: 6, color: '#60a5fa' },
    slow: { style: 'pulsar_pair', r: 58, size: 5, color: '#f472b6' },
    track: { style: 'cardinal_stars', color: '#fef08a' },
  },
  sonic: {
    name: 'Sonic Wave',
    fast: { style: 'eq_bars', r: 96, size: 7, color: '#22d3ee', trail: '#f43f5e' },
    medium: { style: 'data_arcs', r: 109, size: 5.5, color: '#a855f7' },
    slow: { style: 'triad_nodes', r: 78, size: 4.5, color: '#fde047' },
    track: { style: 'bezel_60', color: '#64748b' },
  },
  chrono: {
    name: 'GT Racing Rim',
    fast: { style: 'rim_needle', r: 98, size: 7, color: '#ef4444', trail: '#fb923c' },
    medium: { style: 'bezel_chevron', r: 108, size: 6, color: '#facc15' },
    slow: { style: 'diamond_bug', r: 84, size: 5, color: '#38bdf8' },
    track: { style: 'tachymeter', color: '#f8fafc' },
  },
  atom: {
    name: 'Quantum Atom',
    fast: { style: 'twin_comets', r: 102, size: 6, color: '#22d3ee', trail: '#38bdf8' },
    medium: { style: 'twin_capsules', r: 82, size: 5.5, color: '#c084fc' },
    slow: { style: 'orb', r: 62, size: 5.5, color: '#f43f5e' },
    track: { style: 'orbit_rings', color: '#64748b' },
  },
};

export const defaultMotion = () => ({
  enabled: false,
  mode: 'video10fps',        // 'video10fps' (moving background/GIF/video) | 'orbital'
  scene: 'koi_sphere',       // key in VIDEO_SCENES or 'custom_media'
  resolution: '80x80',       // key in LOW_RES_PRESETS
  pixelSize: 1,              // 1 (crisp), 2, 3, or 4 px block downscale
  fps: 10,                   // target FPS (1..10)
  frameCount: 16,            // encoded frame count (8..16)
  previewLowRes: true,       // show exact converted output on preview canvas
  playing: true,
  accentColor: '#38bdf8',
  secondaryColor: '#e0f2fe',
  preset: 'solar',
  ...structuredClone(MOTION_PRESETS.solar),
});

const TABLES = { fast: FAST_STYLES, medium: MEDIUM_STYLES, slow: SLOW_STYLES, track: TRACK_STYLES };

export function motionLayers(kind, cfg) {
  const d = cfg[kind] || {};
  const table = TABLES[kind];
  const entry = table[d.style] || Object.values(table)[0];
  const spec = {
    ...d,
    r: d.r ?? 96,
    size: d.size ?? 6,
    color: hex2rgb(d.color || '#38bdf8'),
    trail: hex2rgb(d.trail || d.color || '#818cf8'),
    r1: cfg.slow?.r ?? 62,
    r2: cfg.medium?.r ?? 82,
    r3: cfg.fast?.r ?? 102,
  };
  return entry.build(spec);
}

export const drawMotionChannel = (kind, cfg, angleDeg = 0) =>
  rasterize(motionLayers(kind, cfg), kind === 'track' ? 0 : angleDeg);

export function buildMotionSprites(cfg) {
  if (cfg?.mode === 'video10fps' && cfg?.scene && VIDEO_SCENES[cfg.scene]) {
    const base = renderSceneRgba(cfg.scene, 0, 16, { backgroundOnly: true, accentColor: cfg.accentColor, secondaryColor: cfg.secondaryColor });
    const frames = [];
    for (let k = 0; k < 16; k++) {
      frames.push(renderSceneRgba(cfg.scene, k, 16, { accentColor: cfg.accentColor, secondaryColor: cfg.secondaryColor }));
    }
    return buildVideoWatchSprites(frames, base, {
      scene: cfg.scene,
      resolution: cfg.resolution,
      pixelSize: cfg.pixelSize,
      accentColor: cfg.accentColor,
      secondaryColor: cfg.secondaryColor,
    });
  }
  const sprites = [];
  const medL = motionLayers('medium', cfg);
  for (let k = 0; k < 16; k++) {
    const id = 2 + k;
    sprites.push({ id, data: encodeSprite({ ...rasterize(medL, k * 6), id }) });
  }
  const fastL = motionLayers('fast', cfg);
  for (let k = 0; k < 16; k++) {
    const id = 18 + k;
    sprites.push({ id, data: encodeSprite({ ...rasterize(fastL, k * 6), id }) });
  }
  const slowL = motionLayers('slow', cfg);
  for (let k = 0; k < 16; k++) {
    const id = 34 + k;
    sprites.push({ id, data: encodeSprite({ ...rasterize(slowL, k * 6), id }) });
  }
  const trackL = cfg?.bakeTrack ? hiddenLayer() : motionLayers('track', cfg);
  sprites.push({ id: 50, data: encodeSprite({ ...rasterize(trackL, 0), id: 50 }) });
  return sprites;
}
