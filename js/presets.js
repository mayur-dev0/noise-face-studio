// Procedurally generated backgrounds. All original artwork, free to use (MIT).
// Each preset draws onto a canvas at 2x the watch resolution (480x560).

const W = 480, H = 560;

function rng(seed) { // mulberry32
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  return [c, c.getContext('2d')];
}

function blob(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'transparent');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function vignette(ctx, a = 0.55) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

export const PRESET_CATEGORIES = [
  { id: 'favourites', label: '💜 Favourites (12)' },
  { id: 'glass', label: '💎 Glass Studio (8)' },
  { id: 'all', label: '✨ All Faces' },
  { id: 'crazy', label: '🔥 Crazy & Epic' },
  { id: 'pulse2', label: '⚡ Pulse 2 Pack' },
  { id: 'amoled', label: '🌑 Dark AMOLED' },
  { id: 'minimal', label: '◯ Minimalist' },
  { id: 'abstract', label: '🎨 Abstract' },
  { id: 'scenic', label: '🌌 Sci-Fi & Nature' },
];

export const PRESETS = [
  // ---- 12 Favourite Watchfaces (Exact Clock Type, Analog Hand Style & Artwork) ----
  {
    id: 'fav_gold_ribbon', name: 'Gold Ribbon 12·3·6·9', cat: 'favourites', color: '#f5c518',
    mode: 'analog_clean', handPreset: 'gold_hollow',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      x.lineCap = 'round';
      // 4 corner gauge tracks + active progress arcs
      const arc = (cx, cy, r, a0, a1, lw, col) => {
        x.strokeStyle = col; x.lineWidth = lw;
        x.beginPath(); x.arc(cx, cy, r, a0, a1); x.stroke();
      };
      // Top-left (teal steps)
      arc(118, 118, 98, Math.PI, Math.PI * 1.5, 16, '#102e2a');
      arc(118, 118, 98, Math.PI, Math.PI * 1.43, 16, '#4be0cb');
      // Top-right (coral calories)
      arc(W - 118, 118, 98, Math.PI * 1.5, Math.PI * 2, 16, '#331418');
      arc(W - 118, 118, 98, Math.PI * 1.58, Math.PI * 2, 16, '#e65c65');
      // Bottom-left (pink HR)
      arc(118, H - 118, 98, Math.PI * 0.5, Math.PI, 16, '#ee528b');
      // Bottom-right (gold battery)
      arc(W - 118, H - 118, 98, 0, Math.PI * 0.5, 16, '#2b2208');
      arc(W - 118, H - 118, 98, 0.08, Math.PI * 0.5, 16, '#e8b923');

      // Mini corner status icons (boot, flame, heart, battery)
      x.fillStyle = '#4be0cb';
      x.fillRect(102, 86, 12, 18); x.fillRect(92, 100, 22, 8);
      x.fillStyle = '#e65c65';
      x.beginPath(); x.arc(378, 98, 10, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ee528b';
      x.beginPath(); x.arc(98, 460, 9, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#e8b923';
      x.fillRect(368, 450, 18, 22);

      // Oversized 3D folded gold ribbon numerals: 12, 9, 3, 6
      const gold = '#f2be42', fold = '#b8861c';
      // --- "12" at top (x: 126..354, y: 6..138) ---
      x.fillStyle = gold;
      // "1" flag + stem + wide base
      x.beginPath();
      x.moveTo(135, 16); x.lineTo(182, 4); x.lineTo(182, 44); x.lineTo(135, 56); x.closePath();
      x.fill();
      x.fillRect(179, 4, 4, 96);
      x.fillRect(126, 98, 104, 40);
      // "2" ribbon arch + diagonal sweep + folded corner
      x.beginPath();
      x.moveTo(232, 46);
      x.bezierCurveTo(232, -2, 354, -2, 354, 46);
      x.bezierCurveTo(354, 72, 286, 76, 280, 138);
      x.lineTo(232, 138);
      x.bezierCurveTo(234, 86, 338, 68, 344, 46);
      x.lineTo(232, 46);
      x.closePath();
      x.fill();
      x.fillRect(232, 134, 122, 4);
      x.beginPath();
      x.moveTo(314, 98); x.lineTo(354, 98); x.lineTo(354, 138); x.closePath();
      x.fill();

      // Helper for 3D folded circular ribbon numerals (9, 3, 6)
      const ribbonCircle = (cx, cy, r) => {
        x.fillStyle = gold;
        x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
      };
      // --- "9" at left (cx=68, cy=280, r=65) ---
      ribbonCircle(68, 280, 65);
      x.fillStyle = '#000000';
      x.beginPath(); x.roundRect(12, 254, 112, 25, 12); x.fill();
      x.beginPath(); x.roundRect(10, 283, 114, 24, 12); x.fill();
      x.strokeStyle = fold; x.lineWidth = 3;
      x.beginPath(); x.arc(24, 267, 13, Math.PI * 0.5, Math.PI * 1.5); x.stroke();
      x.beginPath(); x.arc(112, 267, 13, -Math.PI * 0.5, Math.PI * 0.5); x.stroke();

      // --- "3" at right (cx=412, cy=280, r=65) ---
      ribbonCircle(412, 280, 65);
      x.fillStyle = '#000000';
      x.beginPath(); x.roundRect(350, 254, 114, 24, 12); x.fill();
      x.beginPath(); x.roundRect(350, 282, 114, 24, 12); x.fill();
      x.fillStyle = gold;
      x.fillRect(372, 276, 86, 6);

      // --- "6" at bottom (cx=240, cy=486, r=65) ---
      ribbonCircle(240, 486, 65);
      x.fillStyle = '#000000';
      x.beginPath(); x.roundRect(182, 460, 116, 24, 12); x.fill();
      x.beginPath(); x.roundRect(184, 488, 112, 25, 12); x.fill();
      x.strokeStyle = fold; x.lineWidth = 3;
      x.beginPath(); x.arc(196, 500, 13, Math.PI * 0.5, Math.PI * 1.5); x.stroke();
      x.beginPath(); x.arc(284, 500, 13, -Math.PI * 0.5, Math.PI * 0.5); x.stroke();

      // Condensed gold labels: SATURDAY & 04/06
      x.fillStyle = '#e5b228';
      x.font = '700 22px "Bebas Neue", "Oswald", Impact, sans-serif';
      x.textAlign = 'left'; x.textBaseline = 'middle';
      x.fillText('SATURDAY', 8, 180);
      x.textAlign = 'right';
      x.fillText('04/06', W - 8, 376);
      x.fillStyle = '#ee528b';
      x.textAlign = 'left';
      x.fillText('102', 8, 424);
      return c;
    },
  },
  {
    id: 'fav_amber_sweep', name: 'Amber Conic Sweep', cat: 'favourites', color: '#ffffff',
    mode: 'analog_clean', handPreset: 'amber_hollow',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      const cx = W / 2, cy = H / 2;
      if (typeof x.createConicGradient === 'function') {
        const cg = x.createConicGradient(Math.PI * 0.5, cx, cy);
        cg.addColorStop(0.000, '#ec9806');
        cg.addColorStop(0.180, '#f3a212');
        cg.addColorStop(0.355, '#f9af22');
        cg.addColorStop(0.360, '#f5a515');
        cg.addColorStop(0.664, '#f8ad1e');
        cg.addColorStop(0.668, '#f4a616');
        cg.addColorStop(0.850, '#fab224');
        cg.addColorStop(1.000, '#fdb82c');
        x.fillStyle = cg;
        x.fillRect(0, 0, W, H);
      } else {
        x.fillStyle = '#f6a818'; x.fillRect(0, 0, W, H);
      }
      return c;
    },
  },
  {
    id: 'fav_neon_outline', name: 'Neon Dots & Outline', cat: 'favourites', color: '#9b7ede',
    mode: 'analog_clean', handPreset: 'violet_hollow',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      // 4 glowing neon cardinal dots (top green, right pink, bottom amber, left cyan)
      const dots = [
        [W / 2, 56, '#65f02b'],
        [W - 52, H / 2, '#eb2f6d'],
        [W / 2, H - 56, '#f29e24'],
        [52, H / 2, '#24cbf2'],
      ];
      for (const [dx, dy, col] of dots) {
        const g = x.createRadialGradient(dx, dy, 2, dx, dy, 22);
        g.addColorStop(0, col);
        g.addColorStop(0.55, col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.beginPath(); x.arc(dx, dy, 22, 0, Math.PI * 2); x.fill();
      }
      // Outlined slanted bold numerals 12, 3, 6, 9
      x.font = 'italic 800 76px "Montserrat", "Segoe UI", Arial, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineJoin = 'round';
      x.strokeStyle = '#a8b0bc'; x.lineWidth = 4;
      x.fillStyle = '#000000';
      const nums = [
        ['12', W / 2 - 4, 126],
        ['3', W - 118, H / 2 + 4],
        ['6', W / 2 - 2, H - 126],
        ['9', 114, H / 2 + 4],
      ];
      for (const [txt, nx, ny] of nums) {
        x.strokeText(txt, nx, ny);
        x.fillText(txt, nx, ny);
      }
      return c;
    },
  },
  {
    id: 'fav_crimson_x', name: 'Crimson Layered X', cat: 'favourites', color: '#ffffff',
    mode: 'analog_clean', handPreset: 'crimson_solid',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const dx = 132, dy = 156;
      const layers = [
        [324, '#310408'],
        [270, '#5a0410'],
        [216, '#8c0821'],
        [162, '#de1031'],
        [108, '#ef1039'],
      ];
      x.lineCap = 'round';
      for (const [lw, col] of layers) {
        x.strokeStyle = col;
        x.lineWidth = lw;
        x.beginPath();
        x.moveTo(cx - dx, cy - dy); x.lineTo(cx + dx, cy + dy);
        x.moveTo(cx + dx, cy - dy); x.lineTo(cx - dx, cy + dy);
        x.stroke();
      }
      return c;
    },
  },
  {
    id: 'fav_indigo_stripes', name: 'Indigo Diagonal Stripes', cat: 'favourites', color: '#ffffff',
    mode: 'analog_clean', handPreset: 'indigo_baton',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      const sw = 34;
      // Upper-left vertical stripes (#222649 / #0e1123)
      for (let i = 0; i * sw < W; i++) {
        x.fillStyle = i % 2 === 0 ? '#222649' : '#0e1123';
        x.fillRect(i * sw, 0, sw + 1, H);
      }
      // Lower-right triangle clipped along diagonal from (28, H-28) to (W-28, 28)
      x.save();
      x.beginPath();
      x.moveTo(0, H);
      x.lineTo(W, 0);
      x.lineTo(W, H);
      x.closePath();
      x.clip();
      for (let j = 0; j * sw < H; j++) {
        x.fillStyle = j % 2 === 0 ? '#3a447f' : '#262d5a';
        x.fillRect(0, j * sw, W, sw + 1);
      }
      // Subtle diagonal fold shadow along the seam
      const sh = x.createLinearGradient(W * 0.42, H * 0.42, W * 0.56, H * 0.56);
      sh.addColorStop(0, 'rgba(0,0,0,0.45)');
      sh.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = sh;
      x.fillRect(0, 0, W, H);
      x.restore();
      return c;
    },
  },
  {
    id: 'fav_obsidian_sweep', name: 'Obsidian Conic Sweep', cat: 'favourites', color: '#e5e7eb',
    mode: 'analog_clean', handPreset: 'obsidian_hollow',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      const cx = W / 2, cy = H / 2;
      if (typeof x.createConicGradient === 'function') {
        const cg = x.createConicGradient(Math.PI * 0.5, cx, cy);
        cg.addColorStop(0.000, '#060607');
        cg.addColorStop(0.180, '#141416');
        cg.addColorStop(0.450, '#2c2c2f');
        cg.addColorStop(0.664, '#3c3c40');
        cg.addColorStop(0.668, '#101012');
        cg.addColorStop(0.840, '#242427');
        cg.addColorStop(1.000, '#3e3e42');
        x.fillStyle = cg;
        x.fillRect(0, 0, W, H);
      } else {
        x.fillStyle = '#18181b'; x.fillRect(0, 0, W, H);
      }
      return c;
    },
  },
  {
    id: 'fav_acid_marble', name: 'Acid Lime Fluid Marble', cat: 'favourites', color: '#ffffff',
    mode: 'digital',
    clock: { x: 14, y: 24 }, clockSize: 46, clockLayout: 'horizontal',
    date: { x: 14, y: 78, visible: true, match: false, color: '#cbd5e1' },
    dateShortWeek: true, dateShortMonth: true,
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#030605'; x.fillRect(0, 0, W, H);
      const img = x.getImageData(0, 0, W, H), d = img.data;
      // Continuous diagonal fluid alcohol-ink marble ribbons matching fav_07
      for (let py = 0; py < H; py++) {
        const ny = py / H;
        for (let px = 0; px < W; px++) {
          const nx = px / W;
          const u = (nx * 0.76 + ny * 0.65) - 0.42;
          const v = (nx * 0.65 - ny * 0.76);
          const warp = Math.sin(v * 7.2 + Math.sin(u * 10.5 + v * 4.0) * 1.3) * 0.09
                     + Math.cos(v * 14.0 - u * 8.0) * 0.04;
          const m = u + warp;
          let r = 4, g = 8, b = 7;
          if (u < -0.02 && nx > 0.24 && ny < 0.26) {
            const tw = Math.sin(nx * 22 + Math.cos(ny * 28) * 2.0);
            if (tw > 0.3) {
              const k = (tw - 0.3) / 0.7;
              r = Math.round(18 * k); g = Math.round(220 * k); b = Math.round(190 * k);
            }
          } else if (m > -0.02) {
            const band = Math.sin(m * 24.0 + Math.sin(v * 11.0) * 1.5);
            const sub = Math.cos(m * 48.0 - v * 14.0);
            if (m < 0.17) {
              // Broad glowing acid-yellow diagonal river
              const t = Math.max(0, Math.min(1, (band + 1) * 0.55));
              r = Math.round(205 + 50 * t);
              g = Math.round(242 + 13 * t);
              b = Math.round(12 + 25 * (1 - t));
              if (sub < -0.78) { r = 12; g = 68; b = 52; }
            } else if (m < 0.52) {
              // Flowing emerald, neon-lime, and cyan marble streams
              if (band > 0.18) {
                r = 175; g = 250; b = 22;
              } else if (band > -0.32) {
                r = 14; g = 222; b = 108;
              } else if (sub > -0.1) {
                r = 16; g = 162; b = 188;
              } else {
                r = 5; g = 14; b = 16;
              }
            } else {
              // Bottom-right dark obsidian pocket with sparse glowing lime droplets
              const d1 = Math.hypot(nx - 0.84, ny - 0.82);
              const d2 = Math.hypot(nx - 0.75, ny - 0.90);
              const d3 = Math.hypot(nx - 0.91, ny - 0.72);
              if (d1 < 0.032 || d2 < 0.028 || d3 < 0.025 || band > 0.62) {
                r = 215; g = 248; b = 32;
              } else if (band > 0.35) {
                r = 16; g = 195; b = 105;
              } else {
                r = 4; g = 8; b = 8;
              }
            }
          }
          const idx = (py * W + px) * 4;
          d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = 255;
        }
      }
      x.putImageData(img, 0, 0);
      return c;
    },
  },
  {
    id: 'fav_rainbow_spiro', name: 'Rainbow Spirograph', cat: 'favourites', color: '#ffffff',
    mode: 'digital',
    clock: { x: 48, y: 218 }, clockSize: 48, clockLayout: 'horizontal',
    date: { x: 27, y: 256, visible: false, match: true, color: '#ffffff' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = 228;
      // Multi-stop pastel gradient matching fav_08
      const g = x.createLinearGradient(cx - 190, cy - 190, cx + 190, cy + 190);
      g.addColorStop(0.00, '#c8d69b');
      g.addColorStop(0.28, '#e88ea4');
      g.addColorStop(0.55, '#c988ba');
      g.addColorStop(0.78, '#8b68a8');
      g.addColorStop(1.00, '#78c6ce');
      x.strokeStyle = g;
      x.lineWidth = 2.4;
      // 18 eccentric circles (R0 = 134, E = 58 -> outer radius 192, inner hole radius 76)
      const N = 18, R0 = 134, E = 58;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        x.beginPath();
        x.arc(cx + Math.cos(a) * E, cy + Math.sin(a) * E, R0, 0, Math.PI * 2);
        x.stroke();
      }
      // Outer and inner subtle ring harmonic
      x.lineWidth = 1.6;
      for (let i = 0; i < N; i++) {
        const a = ((i + 0.5) / N) * Math.PI * 2;
        x.beginPath();
        x.ellipse(cx, cy, 190, 76, a, 0, Math.PI * 2);
        x.stroke();
      }
      return c;
    },
  },
  {
    id: 'fav_petal_mandala', name: 'Coral Petal Rosette', cat: 'favourites', color: '#ffffff',
    mode: 'analog_clean', handPreset: 'petal_duo',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const D = 95, R = 95, R2 = R * R;
      const centers = Array.from({ length: 8 }, (_, k) => [
        cx + D * Math.cos((k * Math.PI) / 4),
        cy + D * Math.sin((k * Math.PI) / 4),
      ]);
      // Colors for overlap multiplicity: 1 -> #85869d, 2/4 -> #dcd6d8, 3 -> #da6562
      const palette = {
        0: [0, 0, 0],
        1: [133, 134, 157],
        2: [220, 214, 216],
        3: [218, 101, 98],
        4: [220, 214, 216],
        5: [218, 101, 98],
        6: [220, 214, 216],
        7: [218, 101, 98],
        8: [220, 214, 216],
      };
      const img = x.getImageData(0, 0, W, H), d = img.data;
      const y0 = Math.max(0, Math.floor(cy - 194)), y1 = Math.min(H - 1, Math.ceil(cy + 194));
      const x0 = Math.max(0, Math.floor(cx - 194)), x1 = Math.min(W - 1, Math.ceil(cx + 194));
      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          let rAcc = 0, gAcc = 0, bAcc = 0;
          for (const sy of [-0.25, 0.25]) {
            for (const sx of [-0.25, 0.25]) {
              const ux = px + 0.5 + sx, uy = py + 0.5 + sy;
              let cnt = 0;
              for (let k = 0; k < 8; k++) {
                const dx = ux - centers[k][0], dy = uy - centers[k][1];
                if (dx * dx + dy * dy <= R2) cnt++;
              }
              const col = palette[cnt];
              rAcc += col[0]; gAcc += col[1]; bAcc += col[2];
            }
          }
          const idx = (py * W + px) * 4;
          d[idx] = rAcc >> 2; d[idx + 1] = gAcc >> 2; d[idx + 2] = bAcc >> 2; d[idx + 3] = 255;
        }
      }
      x.putImageData(img, 0, 0);
      return c;
    },
  },
  {
    id: 'fav_mint_stripes', name: 'Mint Geometric Stripes', cat: 'favourites', color: '#ffffff',
    mode: 'analog_clean', handPreset: 'mint_solid',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#4cc1af'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#33968a';
      // 1. Left vertical stripes with 45° beveled tops
      const vBar = (bx, byTop, bw) => {
        x.beginPath();
        x.moveTo(bx, byTop);
        x.lineTo(bx + bw, byTop + bw);
        x.lineTo(bx + bw, H);
        x.lineTo(bx, H);
        x.closePath();
        x.fill();
      };
      vBar(68, 74, 24);
      vBar(122, 128, 24);

      // 2. Upper-right 45° diagonal stripes clipped at y = 288
      x.save();
      x.beginPath();
      x.rect(0, 0, W, 288);
      x.clip();
      for (const startX of [92, 168, 244, 320, 396]) {
        x.beginPath();
        x.moveTo(startX, 0);
        x.lineTo(startX + 34, 0);
        x.lineTo(startX + 34 + 288, 288);
        x.lineTo(startX + 288, 288);
        x.closePath();
        x.fill();
      }
      x.restore();

      // 3. Lower-right upward-tilted (-11°) horizontal stripes
      for (const baseY of [356, 424, 492]) {
        x.beginPath();
        x.moveTo(234, baseY);
        x.lineTo(W, baseY - 48);
        x.lineTo(W, baseY - 48 + 28);
        x.lineTo(234, baseY + 28);
        x.closePath();
        x.fill();
      }
      return c;
    },
  },
  {
    id: 'fav_eccentric_circles', name: 'Minimal Eccentric Circles', cat: 'favourites', color: '#ffffff',
    mode: 'digital',
    clock: { x: 18, y: 84 }, clockSize: 52, clockLayout: 'stacked',
    amPm: { x: 38, y: 66, size: 15 },
    date: { x: 142, y: 58, visible: false, match: false, color: '#111111' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      // Top-left pale cyan circle arc
      x.strokeStyle = '#a5dce0'; x.lineWidth = 5;
      x.beginPath(); x.arc(104, 164, 128, 0, Math.PI * 2); x.stroke();
      // Solid pastel blush-pink circle with dark "06"
      x.fillStyle = '#efb9b7';
      x.beginPath(); x.arc(284, 136, 50, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#141418';
      x.font = '700 44px "Montserrat", "Segoe UI", sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('06', 284, 138);
      // 5 nested eccentric circles in the bottom-right quadrant
      const rings = [
        [336, 368, 178, '#d6686b'],
        [352, 430, 114, '#4955a8'],
        [358, 450, 92, '#6b3fa0'],
        [362, 466, 76, '#6e4838'],
        [368, 492, 50, '#253d38'],
      ];
      x.lineWidth = 4.5;
      for (const [rx, ry, rr, col] of rings) {
        x.strokeStyle = col;
        x.beginPath(); x.arc(rx, ry, rr, 0, Math.PI * 2); x.stroke();
      }
      return c;
    },
  },
  {
    id: 'fav_neon_orbits', name: 'Neon Atomic Orbits', cat: 'favourites', color: '#ffffff',
    mode: 'digital',
    clock: { x: 64, y: 34 }, clockSize: 48, clockLayout: 'stacked',
    clockFontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
    date: { x: 27, y: 204, visible: false, match: true, color: '#ffffff' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = 296;
      const g = x.createLinearGradient(40, H - 40, W - 40, 60);
      g.addColorStop(0.0, '#6ee7b7');
      g.addColorStop(0.45, '#7dd3fc');
      g.addColorStop(1.0, '#d884c8');
      x.strokeStyle = g;
      x.lineWidth = 4.5;
      // 3 interlocking rotated stadium/pill orbits (0°, +60°, -60°)
      for (const deg of [-60, 60, 0]) {
        x.save();
        x.translate(cx, cy);
        x.rotate((deg * Math.PI) / 180);
        x.beginPath();
        x.roundRect(-126, -210, 252, 420, 126);
        x.stroke();
        x.restore();
      }
      // Clear the top-left opening where the stacked 08/26 clock sits
      x.fillStyle = '#000000';
      x.fillRect(110, 56, 126, 165);
      // Bottom "06" and "AM" markers
      x.fillStyle = '#ffffff';
      x.font = '700 38px "Bebas Neue", "Oswald", sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('06', cx, 416);
      x.font = '600 26px "Montserrat", "Segoe UI", sans-serif';
      x.fillText('AM', cx, 504);
      return c;
    },
  },
  // ---- 8 Liquid Glass & Minimalist Studio Watchfaces (4 Analog + 4 Digital) ----
  {
    id: 'glass_aurora_orb', name: 'Liquid Glass Orb', cat: 'glass', color: '#ffffff',
    mode: 'analog_clean', handPreset: 'amber_hollow',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#050710'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      blob(x, cx - 75, cy - 85, 220, 'rgba(139, 92, 246, 0.72)');
      blob(x, cx + 85, cy + 75, 230, 'rgba(6, 182, 212, 0.68)');
      blob(x, cx + 70, cy - 90, 175, 'rgba(236, 72, 153, 0.55)');
      // Frosted glass circular lens + specular rim
      const gLens = x.createLinearGradient(cx - 190, cy - 190, cx + 190, cy + 190);
      gLens.addColorStop(0, 'rgba(255,255,255,0.22)');
      gLens.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      gLens.addColorStop(1, 'rgba(56,189,248,0.16)');
      x.fillStyle = gLens;
      x.beginPath(); x.arc(cx, cy, 198, 0, Math.PI * 2); x.fill();
      const rim = x.createLinearGradient(cx - 198, cy - 198, cx + 198, cy + 198);
      rim.addColorStop(0, 'rgba(255,255,255,0.75)');
      rim.addColorStop(0.5, 'rgba(255,255,255,0.12)');
      rim.addColorStop(1, 'rgba(56,189,248,0.65)');
      x.strokeStyle = rim; x.lineWidth = 3.5;
      x.beginPath(); x.arc(cx, cy, 198, 0, Math.PI * 2); x.stroke();
      // 12 crisp glass hour batons
      for (let k = 0; k < 12; k++) {
        const a = (k * Math.PI) / 6;
        const r0 = k % 3 === 0 ? 156 : 168;
        const r1 = 186;
        x.strokeStyle = k % 3 === 0 ? '#ffffff' : 'rgba(255,255,255,0.55)';
        x.lineWidth = k % 3 === 0 ? 6 : 3;
        x.lineCap = 'round';
        x.beginPath();
        x.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0);
        x.lineTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1);
        x.stroke();
      }
      return c;
    },
  },
  {
    id: 'glass_prism_dial', name: 'Frosted Prism Dial', cat: 'glass', color: '#e2e8f0',
    mode: 'analog_clean', handPreset: 'obsidian_hollow',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      const bg = x.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#090d1a'); bg.addColorStop(0.5, '#11182d'); bg.addColorStop(1, '#060811');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      blob(x, 110, 140, 220, 'rgba(56, 189, 248, 0.35)');
      blob(x, 370, 420, 230, 'rgba(168, 85, 247, 0.35)');
      // Overlapping frosted glass cards
      const panes = [
        [-22, 60, 110, 360, 340, 44],
        [16, 65, 115, 350, 330, 44],
      ];
      const cx = W / 2, cy = H / 2;
      for (const [deg, px, py, pw, ph, pr] of panes) {
        x.save();
        x.translate(cx, cy); x.rotate((deg * Math.PI) / 180); x.translate(-cx, -cy);
        const pg = x.createLinearGradient(px, py, px + pw, py + ph);
        pg.addColorStop(0, 'rgba(255,255,255,0.16)');
        pg.addColorStop(1, 'rgba(255,255,255,0.03)');
        x.fillStyle = pg;
        x.strokeStyle = 'rgba(255,255,255,0.34)'; x.lineWidth = 2.5;
        x.beginPath(); x.roundRect(px, py, pw, ph, pr); x.fill(); x.stroke();
        x.restore();
      }
      x.font = '800 54px "Montserrat", "Segoe UI", sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = 'rgba(255,255,255,0.9)';
      x.fillText('12', cx, 92);
      x.fillText('6', cx, H - 92);
      x.fillText('9', 78, cy);
      x.fillText('3', W - 78, cy);
      return c;
    },
  },
  {
    id: 'glass_titanium_sunray', name: 'Titanium Sunburst', cat: 'glass', color: '#38bdf8',
    mode: 'analog_clean', handPreset: 'indigo_baton',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      const cx = W / 2, cy = H / 2;
      if (typeof x.createConicGradient === 'function') {
        const cg = x.createConicGradient(0, cx, cy);
        cg.addColorStop(0.00, '#0f172a');
        cg.addColorStop(0.18, '#1e293b');
        cg.addColorStop(0.33, '#334155');
        cg.addColorStop(0.50, '#0f172a');
        cg.addColorStop(0.68, '#1e293b');
        cg.addColorStop(0.84, '#334155');
        cg.addColorStop(1.00, '#0f172a');
        x.fillStyle = cg; x.fillRect(0, 0, W, H);
      } else {
        x.fillStyle = '#162032'; x.fillRect(0, 0, W, H);
      }
      // Cyan glass inner bezel ring
      x.strokeStyle = 'rgba(56, 189, 248, 0.45)'; x.lineWidth = 3;
      x.beginPath(); x.arc(cx, cy, 206, 0, Math.PI * 2); x.stroke();
      for (let k = 0; k < 60; k++) {
        const a = (k * Math.PI) / 30;
        const maj = k % 5 === 0;
        const r0 = maj ? 174 : 190;
        const r1 = 200;
        x.strokeStyle = k === 0 ? '#38bdf8' : maj ? '#f8fafc' : 'rgba(148,163,184,0.45)';
        x.lineWidth = maj ? 5 : 2;
        x.beginPath();
        x.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0);
        x.lineTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1);
        x.stroke();
      }
      return c;
    },
  },
  {
    id: 'glass_rose_eclipse', name: 'Rose Gold Eclipse', cat: 'glass', color: '#fbbf24',
    mode: 'analog_clean', handPreset: 'gold_hollow',
    dial: { style: 'none' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#040307'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      blob(x, cx + 28, cy - 28, 225, 'rgba(244, 114, 182, 0.52)');
      blob(x, cx - 20, cy + 24, 210, 'rgba(251, 191, 36, 0.52)');
      x.fillStyle = '#06050a';
      x.beginPath(); x.arc(cx - 8, cy + 8, 152, 0, Math.PI * 2); x.fill();
      const rim = x.createLinearGradient(cx - 160, cy + 160, cx + 160, cy - 160);
      rim.addColorStop(0, 'rgba(251,191,36,0.15)');
      rim.addColorStop(0.55, '#fbbf24');
      rim.addColorStop(1, '#f472b6');
      x.strokeStyle = rim; x.lineWidth = 4;
      x.beginPath(); x.arc(cx, cy, 168, 0, Math.PI * 2); x.stroke();
      for (let k = 0; k < 12; k++) {
        const a = (k * Math.PI) / 6;
        x.fillStyle = k % 3 === 0 ? '#fde68a' : 'rgba(251,191,36,0.55)';
        x.beginPath();
        x.arc(cx + Math.sin(a) * 194, cy - Math.cos(a) * 194, k % 3 === 0 ? 6 : 3, 0, Math.PI * 2);
        x.fill();
      }
      return c;
    },
  },
  {
    id: 'glass_stacked_aura', name: 'Frosted Pill Stacked', cat: 'glass', color: '#ffffff',
    mode: 'digital',
    clock: { x: 24, y: 74 }, clockSize: 54, clockLayout: 'stacked',
    amPm: { x: 60, y: 48, size: 14 },
    date: { x: 26, y: 196, visible: true, match: false, color: '#7dd3fc' },
    dateShortWeek: true, dateShortMonth: true,
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#050812'; x.fillRect(0, 0, W, H);
      blob(x, 355, 195, 210, 'rgba(56, 189, 248, 0.75)');
      blob(x, 330, 390, 220, 'rgba(139, 92, 246, 0.72)');
      blob(x, 150, 440, 175, 'rgba(236, 72, 153, 0.48)');
      // Left frosted glass pill container framing the stacked clock
      const pg = x.createLinearGradient(28, 60, 260, 460);
      pg.addColorStop(0, 'rgba(255,255,255,0.18)');
      pg.addColorStop(1, 'rgba(255,255,255,0.04)');
      x.fillStyle = pg;
      x.strokeStyle = 'rgba(255,255,255,0.34)'; x.lineWidth = 3;
      x.beginPath(); x.roundRect(28, 64, 224, 396, 48); x.fill(); x.stroke();
      // Right decorative glass ring
      x.strokeStyle = 'rgba(255,255,255,0.28)'; x.lineWidth = 2.5;
      x.beginPath(); x.arc(356, 260, 84, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.arc(356, 260, 48, 0, Math.PI * 2); x.stroke();
      return c;
    },
  },
  {
    id: 'glass_cyber_wave', name: 'Silk Ribbon Wave', cat: 'glass', color: '#f8fafc',
    mode: 'digital',
    clock: { x: 46, y: 26 }, clockSize: 50, clockLayout: 'horizontal',
    date: { x: 52, y: 84, visible: true, match: false, color: '#a5f3fc' },
    dateShortWeek: true, dateShortMonth: true,
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#04060e'; x.fillRect(0, 0, W, H);
      const waves = [
        [300, 52, 0.013, 0.0, 'rgba(139, 92, 246, 0.55)', '#c4b5fd'],
        [355, 48, 0.015, 1.4, 'rgba(6, 182, 212, 0.50)', '#67e8f9'],
        [415, 42, 0.012, 2.8, 'rgba(236, 72, 153, 0.45)', '#f9a8d4'],
      ];
      for (const [baseY, amp, freq, phase, fillCol, strokeCol] of waves) {
        x.beginPath();
        x.moveTo(0, H);
        for (let px = 0; px <= W; px += 6) {
          const py = baseY + Math.sin(px * freq + phase) * amp + Math.cos(px * freq * 0.6 - phase) * (amp * 0.4);
          x.lineTo(px, py);
        }
        x.lineTo(W, H); x.closePath();
        const wg = x.createLinearGradient(0, baseY - amp, 0, H);
        wg.addColorStop(0, fillCol); wg.addColorStop(1, 'rgba(4,6,14,0.05)');
        x.fillStyle = wg; x.fill();
        x.strokeStyle = strokeCol; x.lineWidth = 3;
        x.beginPath();
        for (let px = 0; px <= W; px += 6) {
          const py = baseY + Math.sin(px * freq + phase) * amp + Math.cos(px * freq * 0.6 - phase) * (amp * 0.4);
          if (px === 0) x.moveTo(px, py); else x.lineTo(px, py);
        }
        x.stroke();
      }
      return c;
    },
  },
  {
    id: 'glass_zen_bauhaus', name: 'Bauhaus Glass Grid', cat: 'glass', color: '#fef3c7',
    mode: 'digital',
    clock: { x: 24, y: 40 }, clockSize: 54, clockLayout: 'stacked',
    date: { x: 26, y: 156, visible: true, match: false, color: '#fda4af' },
    dateShortWeek: true, dateShortMonth: true,
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#0c0f17'; x.fillRect(0, 0, W, H);
      // Subtle geometric grid lines
      x.strokeStyle = 'rgba(255,255,255,0.07)'; x.lineWidth = 2;
      for (let gx = 80; gx < W; gx += 80) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
      for (let gy = 80; gy < H; gy += 80) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
      // Overlapping translucent Bauhaus circles & pill
      x.fillStyle = 'rgba(244, 63, 94, 0.68)';
      x.beginPath(); x.arc(330, 350, 128, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(20, 184, 166, 0.65)';
      x.beginPath(); x.arc(220, 410, 108, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(251, 191, 36, 0.72)';
      x.beginPath(); x.arc(356, 190, 68, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = 3;
      x.beginPath(); x.arc(330, 350, 128, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.arc(220, 410, 108, 0, Math.PI * 2); x.stroke();
      return c;
    },
  },
  {
    id: 'glass_emerald_halo', name: 'Emerald Matrix Halo', cat: 'glass', color: '#ecfdf5',
    mode: 'digital',
    clock: { x: 48, y: 214 }, clockSize: 48, clockLayout: 'horizontal',
    amPm: { x: 194, y: 238, size: 13 },
    date: { x: 48, y: 188, visible: false, match: true, color: '#6ee7b7' },
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#030907'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = 216;
      blob(x, cx, cy, 195, 'rgba(16, 185, 129, 0.45)');
      const radii = [156, 122, 88, 54];
      for (let i = 0; i < radii.length; i++) {
        const r = radii[i];
        x.strokeStyle = i % 2 === 0 ? '#34d399' : 'rgba(110, 231, 183, 0.42)';
        x.lineWidth = i === 0 ? 4 : 2.5;
        x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
        const dots = 24 - i * 4;
        for (let k = 0; k < dots; k++) {
          const a = (k * Math.PI * 2) / dots + i * 0.2;
          x.fillStyle = '#a7f3d0';
          x.beginPath();
          x.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 0, Math.PI * 2);
          x.fill();
        }
      }
      return c;
    },
  },
  // ---- Original 10 presets (preserved as-is) ----
  {
    id: 'aurora', name: 'Aurora', cat: 'scenic', color: '#e8fff6',
    draw() {
      const [c, x] = canvas();
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#020617'); g.addColorStop(1, '#0b1a2e');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = rng(7);
      for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.8})`; x.fillRect(r() * W, r() * H * 0.6, 1.5, 1.5); }
      x.filter = 'blur(28px)';
      const bands = [['#22d3ee', 0.55], ['#34d399', 0.75], ['#a78bfa', 0.45]];
      bands.forEach(([col, a], i) => {
        x.globalAlpha = a; x.strokeStyle = col; x.lineWidth = 70 - i * 12;
        x.beginPath();
        for (let px = -40; px <= W + 40; px += 10) {
          const py = 250 + i * 60 + Math.sin(px / 70 + i * 1.7) * 60 + Math.sin(px / 23 + i) * 12;
          px === -40 ? x.moveTo(px, py) : x.lineTo(px, py);
        }
        x.stroke();
      });
      x.filter = 'none'; x.globalAlpha = 1;
      vignette(x, 0.4);
      return c;
    },
  },
  {
    id: 'synthwave', name: 'Synthwave', cat: 'scenic', color: '#ffe4f3',
    draw() {
      const [c, x] = canvas();
      const sky = x.createLinearGradient(0, 0, 0, H * 0.62);
      sky.addColorStop(0, '#12002b'); sky.addColorStop(0.6, '#5b0a6b'); sky.addColorStop(1, '#ff3d7f');
      x.fillStyle = sky; x.fillRect(0, 0, W, H * 0.62);
      const cx = W / 2, cy = H * 0.5, R = 120;
      const sun = x.createLinearGradient(0, cy - R, 0, cy + R);
      sun.addColorStop(0, '#ffe66d'); sun.addColorStop(1, '#ff2e88');
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.clip();
      x.fillStyle = sun; x.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      x.fillStyle = '#5b0a6b';
      for (let i = 0; i < 7; i++) { const y = cy + 10 + i * 16; x.fillRect(cx - R, y, 2 * R, 2 + i * 1.6); }
      x.restore();
      x.fillStyle = '#0a0018'; x.fillRect(0, H * 0.62, W, H);
      x.strokeStyle = '#ff2ef5'; x.lineWidth = 2; x.shadowColor = '#ff2ef5'; x.shadowBlur = 10;
      const hz = H * 0.62;
      for (let i = 0; i < 12; i++) { const y = hz + Math.pow(i / 11, 2) * (H - hz); x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
      for (let i = -12; i <= 12; i++) { x.beginPath(); x.moveTo(cx + i * 8, hz); x.lineTo(cx + i * 90, H); x.stroke(); }
      x.shadowBlur = 0;
      return c;
    },
  },
  {
    id: 'nebula', name: 'Nebula', cat: 'scenic', color: '#ffffff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#03010a'; x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = 'lighter';
      blob(x, 140, 380, 260, 'rgba(124,58,237,0.55)');
      blob(x, 360, 220, 220, 'rgba(236,72,153,0.45)');
      blob(x, 260, 300, 160, 'rgba(56,189,248,0.35)');
      x.globalCompositeOperation = 'source-over';
      const r = rng(42);
      for (let i = 0; i < 420; i++) {
        const s = r() < 0.05 ? 2.6 : r() * 1.6;
        x.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`;
        x.beginPath(); x.arc(r() * W, r() * H, s, 0, Math.PI * 2); x.fill();
      }
      return c;
    },
  },
  {
    id: 'mesh', name: 'Liquid', cat: 'abstract', color: '#1b1b2f',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#fde68a'; x.fillRect(0, 0, W, H);
      blob(x, 60, 60, 380, 'rgba(251,113,133,0.95)');
      blob(x, 460, 120, 360, 'rgba(129,140,248,0.95)');
      blob(x, 420, 540, 380, 'rgba(45,212,191,0.9)');
      blob(x, 40, 520, 300, 'rgba(250,204,21,0.9)');
      return c;
    },
  },
  {
    id: 'mono', name: 'Midnight', cat: 'minimal', color: '#ffffff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      blob(x, W / 2, H * 0.35, 320, 'rgba(40,48,72,0.7)');
      return c;
    },
  },
  {
    id: 'ocean', name: 'Ocean', cat: 'scenic', color: '#ecfeff',
    draw() {
      const [c, x] = canvas();
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0c4a6e'); g.addColorStop(1, '#020617');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const cols = ['#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e', '#082f49'];
      cols.forEach((col, i) => {
        x.fillStyle = col; x.globalAlpha = 0.85; x.beginPath(); x.moveTo(0, H);
        const base = 280 + i * 48;
        for (let px = 0; px <= W; px += 8) x.lineTo(px, base + Math.sin(px / (50 + i * 9) + i * 2) * (14 + i * 3));
        x.lineTo(W, H); x.closePath(); x.fill();
      });
      x.globalAlpha = 1;
      return c;
    },
  },
  {
    id: 'matrix', name: 'Matrix', cat: 'amoled', color: '#86efac',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      const r = rng(1337), chars = 'アカサタナハマヤラワ0123456789ABCDEF';
      x.font = '18px monospace';
      for (let col = 0; col < W / 16; col++) {
        const len = 6 + Math.floor(r() * 20), start = Math.floor(r() * 30) - 5;
        for (let k = 0; k < len; k++) {
          const a = k === len - 1 ? 1 : (k / len) * 0.7;
          x.fillStyle = k === len - 1 ? `rgba(220,255,220,${a})` : `rgba(34,197,94,${a})`;
          x.fillText(chars[Math.floor(r() * chars.length)], col * 16, (start + k) * 20);
        }
      }
      return c;
    },
  },
  {
    id: 'topo', name: 'Topo', cat: 'minimal', color: '#fef3c7',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#1c1917'; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(251,191,36,0.55)'; x.lineWidth = 1.5;
      const cx = W * 0.6, cy = H * 0.55;
      for (let k = 1; k < 26; k++) {
        x.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
          const rr = k * 14 + Math.sin(a * 3 + k * 0.4) * 10 + Math.cos(a * 5 - k * 0.3) * 6;
          const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 1.1;
          a === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
        }
        x.stroke();
      }
      vignette(x, 0.5);
      return c;
    },
  },
  {
    id: 'carbon', name: 'Carbon', cat: 'amoled', color: '#f97316',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#111'; x.fillRect(0, 0, W, H);
      for (let yy = 0; yy < H; yy += 8) for (let xx = 0; xx < W; xx += 8) {
        const odd = ((xx + yy) / 8) % 2;
        const g = x.createLinearGradient(xx, yy, xx + (odd ? 8 : 0), yy + (odd ? 0 : 8));
        g.addColorStop(0, '#2a2a2a'); g.addColorStop(1, '#141414');
        x.fillStyle = g; x.fillRect(xx, yy, 8, 8);
      }
      const sh = x.createLinearGradient(0, 0, W, H);
      sh.addColorStop(0, 'rgba(255,255,255,0.08)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.3)');
      x.fillStyle = sh; x.fillRect(0, 0, W, H);
      x.fillStyle = '#f97316'; x.fillRect(0, H - 40, W, 6);
      return c;
    },
  },
  {
    id: 'bokeh', name: 'Bokeh', cat: 'abstract', color: '#fff7ed',
    draw() {
      const [c, x] = canvas();
      const g = x.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#1e1b4b'); g.addColorStop(1, '#431407');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = rng(9), hues = [30, 45, 330, 200, 280];
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 38; i++) {
        const rad = 14 + r() * 50, h = hues[Math.floor(r() * hues.length)];
        x.fillStyle = `hsla(${h},90%,65%,${0.08 + r() * 0.2})`;
        x.beginPath(); x.arc(r() * W, r() * H, rad, 0, Math.PI * 2); x.fill();
      }
      x.globalCompositeOperation = 'source-over';
      return c;
    },
  },

  // ---- New Minimalist & Aesthetic, Abstract, AMOLED & Geometric Presets ----
  {
    id: 'bauhaus', name: 'Bauhaus', cat: 'minimal', color: '#f5f0e6',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#141418'; x.fillRect(0, 0, W, H);
      // Subtle architectural grid lines
      x.strokeStyle = 'rgba(245,240,230,0.07)'; x.lineWidth = 2;
      for (const gx of [120, 240, 360]) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
      for (const gy of [140, 280, 420]) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
      // Bold geometric arches & circles
      x.fillStyle = '#e05a47';
      x.beginPath(); x.arc(340, 380, 130, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#2563eb';
      x.beginPath(); x.arc(140, 420, 110, Math.PI, 0); x.lineTo(250, H); x.lineTo(30, H); x.closePath(); x.fill();
      x.fillStyle = '#eab308';
      x.beginPath(); x.arc(240, 320, 56, 0, Math.PI * 2); x.fill();
      // Half-circle cutout
      x.fillStyle = '#141418';
      x.beginPath(); x.arc(240, 320, 26, 0, Math.PI * 2); x.fill();
      // Diagonal accent bar
      x.strokeStyle = '#f5f0e6'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(60, 240); x.lineTo(420, 480); x.stroke();
      return c;
    },
  },
  {
    id: 'eclipse', name: 'Eclipse', cat: 'amoled', color: '#fef3c7',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.58, R = 128;
      // Outer golden-amber corona glow
      blob(x, cx, cy, R * 2.1, 'rgba(245,158,11,0.38)');
      blob(x, cx + 18, cy - 18, R * 1.45, 'rgba(254,243,199,0.45)');
      // Crisp bright coronal rim
      const rim = x.createRadialGradient(cx, cy, R - 4, cx, cy, R + 18);
      rim.addColorStop(0, '#000');
      rim.addColorStop(0.25, '#fffbeb');
      rim.addColorStop(0.55, '#f59e0b');
      rim.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = rim; x.beginPath(); x.arc(cx, cy, R + 18, 0, Math.PI * 2); x.fill();
      // Pitch black moon disc
      x.fillStyle = '#000000';
      x.beginPath(); x.arc(cx, cy, R - 2, 0, Math.PI * 2); x.fill();
      // Diamond ring flare at 2 o'clock
      const fx = cx + R * Math.cos(-0.65), fy = cy + R * Math.sin(-0.65);
      blob(x, fx, fy, 46, 'rgba(255,255,255,0.95)');
      x.strokeStyle = 'rgba(255,251,235,0.75)'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(fx - 45, fy); x.lineTo(fx + 45, fy); x.moveTo(fx, fy - 45); x.lineTo(fx, fy + 45); x.stroke();
      return c;
    },
  },
  {
    id: 'zen_ink', name: 'Zen Ink', cat: 'minimal', color: '#f8fafc',
    draw() {
      const [c, x] = canvas();
      const sky = x.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0f141c'); sky.addColorStop(0.6, '#1e2631'); sky.addColorStop(1, '#090d12');
      x.fillStyle = sky; x.fillRect(0, 0, W, H);
      // Crimson rising sun seal
      const sunG = x.createRadialGradient(330, 220, 10, 330, 220, 74);
      sunG.addColorStop(0, '#ef4444'); sunG.addColorStop(0.85, '#b91c1c'); sunG.addColorStop(1, 'rgba(185,28,28,0)');
      x.fillStyle = sunG; x.beginPath(); x.arc(330, 220, 74, 0, Math.PI * 2); x.fill();
      // Layered ink wash mountains
      const layers = [
        [290, '#273240', 0.012, 38, 1.0],
        [355, '#1c2430', 0.015, 32, 2.4],
        [420, '#121820', 0.018, 26, 4.1],
        [480, '#080b10', 0.022, 18, 5.7],
      ];
      for (const [baseY, col, freq, amp, phase] of layers) {
        x.fillStyle = col;
        x.beginPath(); x.moveTo(0, H);
        for (let px = 0; px <= W; px += 6) {
          const py = baseY + Math.sin(px * freq + phase) * amp + Math.cos(px * freq * 2.3 - phase) * (amp * 0.45);
          x.lineTo(px, py);
        }
        x.lineTo(W, H); x.closePath(); x.fill();
      }
      return c;
    },
  },
  {
    id: 'prism', name: 'Prism', cat: 'abstract', color: '#ffffff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#05060a'; x.fillRect(0, 0, W, H);
      // Incoming white light beam
      x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(0, 320); x.lineTo(210, 275); x.stroke();
      // Dispersed spectral rays
      const rays = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7'];
      rays.forEach((col, i) => {
        x.strokeStyle = col; x.lineWidth = 10; x.globalAlpha = 0.82;
        x.beginPath(); x.moveTo(265, 270 + i * 4); x.lineTo(W, 300 + i * 24); x.stroke();
      });
      x.globalAlpha = 1;
      // Glass triangle prism
      const g = x.createLinearGradient(160, 200, 310, 360);
      g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(56,189,248,0.08)');
      x.fillStyle = g; x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(240, 185); x.lineTo(165, 335); x.lineTo(315, 335); x.closePath();
      x.fill(); x.stroke();
      return c;
    },
  },
  {
    id: 'dune', name: 'Desert Dune', cat: 'minimal', color: '#fef3c7',
    draw() {
      const [c, x] = canvas();
      const sky = x.createLinearGradient(0, 0, 0, H * 0.58);
      sky.addColorStop(0, '#0f172a'); sky.addColorStop(0.55, '#31102f'); sky.addColorStop(1, '#c2410c');
      x.fillStyle = sky; x.fillRect(0, 0, W, H);
      // Minimalist & Aesthetic crescent moon
      x.fillStyle = '#fef3c7';
      x.beginPath(); x.arc(365, 135, 24, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#18142c';
      x.beginPath(); x.arc(375, 129, 21, 0, Math.PI * 2); x.fill();
      // Sweeping sunlit & shadowed dune curves
      x.fillStyle = '#9a3412';
      x.beginPath(); x.moveTo(0, 330); x.quadraticCurveTo(180, 275, W, 360); x.lineTo(W, H); x.lineTo(0, H); x.fill();
      x.fillStyle = '#ea580c';
      x.beginPath(); x.moveTo(0, 390); x.quadraticCurveTo(260, 320, W, 380); x.lineTo(W, H); x.lineTo(0, H); x.fill();
      x.fillStyle = '#431407';
      x.beginPath(); x.moveTo(240, 353); x.quadraticCurveTo(360, 366, W, 380); x.lineTo(W, H); x.lineTo(140, H); x.fill();
      return c;
    },
  },
  {
    id: 'cyber_grid', name: 'Neon Edge', cat: 'amoled', color: '#22d3ee',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      // Subtle dark tech grid
      x.strokeStyle = 'rgba(34,211,238,0.06)'; x.lineWidth = 1;
      for (let gx = 24; gx < W; gx += 24) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
      for (let gy = 24; gy < H; gy += 24) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
      // Glowing dual-tone neon border frame
      const g = x.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#22d3ee'); g.addColorStop(0.5, '#a855f7'); g.addColorStop(1, '#f43f5e');
      x.strokeStyle = g; x.lineWidth = 6; x.shadowColor = '#22d3ee'; x.shadowBlur = 18;
      x.beginPath(); x.roundRect(16, 16, W - 32, H - 32, 68); x.stroke();
      x.shadowBlur = 0;
      return c;
    },
  },
  {
    id: 'waves', name: 'Silk Waves', cat: 'abstract', color: '#f0f9ff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#02040a'; x.fillRect(0, 0, W, H);
      const cols = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6'];
      for (let b = 0; b < 28; b++) {
        const f = b / 27;
        x.strokeStyle = cols[b % cols.length];
        x.globalAlpha = 0.14 + 0.35 * Math.sin(f * Math.PI);
        x.lineWidth = 2.2;
        x.beginPath();
        for (let px = 0; px <= W; px += 8) {
          const py = 180 + b * 11 + Math.sin(px / 85 + b * 0.22) * 52 + Math.cos(px / 45 - b * 0.15) * 22;
          px === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
        }
        x.stroke();
      }
      x.globalAlpha = 1;
      return c;
    },
  },
  {
    id: 'origami', name: 'Low Poly', cat: 'abstract', color: '#f8fafc',
    draw() {
      const [c, x] = canvas();
      const r = rng(2026);
      const cols = 6, rows = 7;
      const pts = [];
      for (let j = 0; j <= rows; j++) {
        pts[j] = [];
        for (let i = 0; i <= cols; i++) {
          const jx = (i === 0 || i === cols) ? 0 : (r() - 0.5) * 48;
          const jy = (j === 0 || j === rows) ? 0 : (r() - 0.5) * 48;
          pts[j][i] = [i * (W / cols) + jx, j * (H / rows) + jy];
        }
      }
      const palette = ['#0f172a', '#1e293b', '#0c4a6e', '#0369a1', '#155e75', '#312e81', '#1e1b4b', '#334155'];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const p00 = pts[j][i], p10 = pts[j][i + 1], p01 = pts[j + 1][i], p11 = pts[j + 1][i + 1];
          for (const tri of [[p00, p10, p11], [p00, p11, p01]]) {
            x.fillStyle = palette[Math.floor(r() * palette.length)];
            x.strokeStyle = 'rgba(255,255,255,0.06)'; x.lineWidth = 1;
            x.beginPath(); x.moveTo(...tri[0]); x.lineTo(...tri[1]); x.lineTo(...tri[2]); x.closePath();
            x.fill(); x.stroke();
          }
        }
      }
      vignette(x, 0.45);
      return c;
    },
  },
  {
    id: 'nordic', name: 'Nordic Pine', cat: 'scenic', color: '#e2e8f0',
    draw() {
      const [c, x] = canvas();
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#07131e'); g.addColorStop(0.55, '#16354d'); g.addColorStop(1, '#091926');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = rng(88);
      for (let i = 0; i < 90; i++) {
        x.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.65})`;
        x.fillRect(r() * W, r() * H * 0.55, 2, 2);
      }
      // Distant mountain ridge
      x.fillStyle = '#0f273a';
      x.beginPath(); x.moveTo(0, 350); x.lineTo(120, 260); x.lineTo(250, 330); x.lineTo(380, 240); x.lineTo(W, 310); x.lineTo(W, H); x.lineTo(0, H); x.fill();
      // Minimalist & Aesthetic pine tree silhouettes
      const drawTree = (tx, ty, th, col) => {
        x.fillStyle = col;
        for (let k = 0; k < 4; k++) {
          const y0 = ty - th + k * (th * 0.22);
          const w = (k + 1) * (th * 0.14);
          x.beginPath(); x.moveTo(tx, y0); x.lineTo(tx - w, y0 + th * 0.34); x.lineTo(tx + w, y0 + th * 0.34); x.closePath(); x.fill();
        }
      };
      for (let i = 0; i < 16; i++) drawTree(i * 34 + (r() * 14), H - 30, 90 + r() * 75, '#081723');
      for (let i = 0; i < 12; i++) drawTree(i * 44 + (r() * 18), H, 100 + r() * 85, '#030a11');
      return c;
    },
  },
  {
    id: 'marble', name: 'Gold Marble', cat: 'amoled', color: '#fde68a',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#08080b'; x.fillRect(0, 0, W, H);
      const r = rng(55);
      // Kintsugi gold & silver veins
      const veins = [
        { col: 'rgba(255,255,255,0.08)', w: 2.5, seed: 1 },
        { col: 'rgba(245,158,11,0.55)', w: 3.5, seed: 2 },
        { col: 'rgba(253,230,138,0.85)', w: 1.6, seed: 3 },
        { col: 'rgba(217,119,6,0.45)', w: 2.2, seed: 4 },
      ];
      for (const v of veins) {
        x.strokeStyle = v.col; x.lineWidth = v.w;
        for (let k = 0; k < 4; k++) {
          let px = (k * 130 + v.seed * 40) % W, py = 0;
          x.beginPath(); x.moveTo(px, py);
          while (py < H) {
            py += 18;
            px += Math.sin(py * 0.03 + v.seed + k) * 14 + (r() - 0.48) * 12;
            x.lineTo(px, py);
          }
          x.stroke();
        }
      }
      vignette(x, 0.45);
      return c;
    },
  },
  {
    id: 'halftone', name: 'Pop Dots', cat: 'abstract', color: '#ffffff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#0c0a14'; x.fillRect(0, 0, W, H);
      for (let gy = 16; gy < H; gy += 22) {
        for (let gx = 16; gx < W; gx += 22) {
          const wave = Math.sin(gx * 0.014 + gy * 0.012) * 0.5 + 0.5;
          const rad = 1.5 + wave * 7.5;
          x.fillStyle = wave > 0.55 ? '#f43f5e' : wave > 0.28 ? '#a855f7' : '#06b6d4';
          x.globalAlpha = 0.25 + wave * 0.65;
          x.beginPath(); x.arc(gx, gy, rad, 0, Math.PI * 2); x.fill();
        }
      }
      x.globalAlpha = 1;
      vignette(x, 0.4);
      return c;
    },
  },
  {
    id: 'vinyl', name: 'Vinyl Groove', cat: 'amoled', color: '#f8fafc',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#070709'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.58;
      // Concentric vinyl micro-grooves
      for (let r = 46; r < 230; r += 3.5) {
        x.strokeStyle = r % 14 < 3.5 ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.035)';
        x.lineWidth = 1.2;
        x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
      }
      // Diagonal sheen highlight
      const sh = x.createLinearGradient(0, cy - 180, W, cy + 180);
      sh.addColorStop(0, 'rgba(255,255,255,0)');
      sh.addColorStop(0.48, 'rgba(56,189,248,0.12)');
      sh.addColorStop(0.52, 'rgba(244,63,94,0.12)');
      sh.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = sh; x.fillRect(0, 0, W, H);
      // Warm crimson-gold center record label
      x.fillStyle = '#e11d48';
      x.beginPath(); x.arc(cx, cy, 42, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fbbf24';
      x.beginPath(); x.arc(cx, cy, 18, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#070709';
      x.beginPath(); x.arc(cx, cy, 6, 0, Math.PI * 2); x.fill();
      return c;
    },
  },
  {
    id: 'mondrian', name: 'De Stijl', cat: 'minimal', color: '#ffffff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#14161f'; x.fillRect(0, 0, W, H);
      // Color blocks on lower & side thirds so clock stays ultra-legible
      x.fillStyle = '#dc2626'; x.fillRect(0, 340, 175, 220);
      x.fillStyle = '#2563eb'; x.fillRect(330, 0, 150, 190);
      x.fillStyle = '#eab308'; x.fillRect(330, 410, 150, 150);
      x.fillStyle = '#e2e8f0'; x.fillRect(175, 410, 155, 150);
      // Bold black dividing lines
      x.strokeStyle = '#050507'; x.lineWidth = 10;
      for (const lx of [175, 330]) { x.beginPath(); x.moveTo(lx, 0); x.lineTo(lx, H); x.stroke(); }
      for (const ly of [190, 340, 410]) { x.beginPath(); x.moveTo(0, ly); x.lineTo(W, ly); x.stroke(); }
      return c;
    },
  },
  {
    id: 'lava', name: 'Magma Flow', cat: 'amoled', color: '#ffedd5',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#090504'; x.fillRect(0, 0, W, H);
      blob(x, W / 2, H * 0.72, 240, 'rgba(234,88,12,0.35)');
      // Glowing magma contour waves
      for (let k = 0; k < 14; k++) {
        const yBase = 240 + k * 24;
        x.strokeStyle = k % 3 === 0 ? '#fde047' : k % 2 === 0 ? '#f97316' : '#dc2626';
        x.lineWidth = k % 3 === 0 ? 3.2 : 2;
        x.shadowColor = '#ea580c'; x.shadowBlur = 10;
        x.beginPath();
        for (let px = 0; px <= W; px += 8) {
          const py = yBase + Math.sin(px / 55 + k * 0.9) * 24 + Math.cos(px / 28 - k) * 10;
          px === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
        }
        x.stroke();
      }
      x.shadowBlur = 0;
      vignette(x, 0.45);
      return c;
    },
  },
  {
    id: 'starlight', name: 'Deep Field', cat: 'amoled', color: '#e0f2fe',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      blob(x, 240, 320, 220, 'rgba(14,165,233,0.22)');
      blob(x, 150, 420, 180, 'rgba(99,102,241,0.18)');
      const r = rng(314);
      for (let i = 0; i < 280; i++) {
        const sx = r() * W, sy = r() * H;
        const rad = r() < 0.06 ? 2.4 : 1.1;
        x.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.75})`;
        x.beginPath(); x.arc(sx, sy, rad, 0, Math.PI * 2); x.fill();
        if (r() < 0.025) {
          x.strokeStyle = 'rgba(186,230,253,0.75)'; x.lineWidth = 1.2;
          x.beginPath(); x.moveTo(sx - 12, sy); x.lineTo(sx + 12, sy); x.moveTo(sx, sy - 12); x.lineTo(sx, sy + 12); x.stroke();
        }
      }
      return c;
    },
  },
  {
    id: 'brutalist', name: 'Swiss Grid', cat: 'minimal', color: '#a3e635',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#090a0f'; x.fillRect(0, 0, W, H);
      // Precision crosshairs grid
      x.strokeStyle = 'rgba(255,255,255,0.16)'; x.lineWidth = 1.5;
      for (let gy = 40; gy < H; gy += 60) {
        for (let gx = 40; gx < W; gx += 60) {
          x.beginPath();
          x.moveTo(gx - 5, gy); x.lineTo(gx + 5, gy);
          x.moveTo(gx, gy - 5); x.lineTo(gx, gy + 5);
          x.stroke();
        }
      }
      // Minimalist & Aesthetic lime & white technical accent bars at bottom
      x.fillStyle = '#a3e635'; x.fillRect(36, H - 72, 140, 8);
      x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(188, H - 72, W - 224, 8);
      x.strokeStyle = 'rgba(163,230,53,0.4)'; x.lineWidth = 2;
      x.strokeRect(24, 24, W - 48, H - 48);
      return c;
    },
  },

  // ---- 14 Crazy & Epic High-Detail Watchfaces ----
  {
    id: 'cyber_samurai', name: 'Cyber Ronin', cat: 'crazy', color: '#ff2e55',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#050206'; x.fillRect(0, 0, W, H);
      // Giant crimson blood moon
      const cx = W / 2, cy = H * 0.56, R = 152;
      const mg = x.createRadialGradient(cx, cy, 10, cx, cy, R);
      mg.addColorStop(0, '#ff1e42'); mg.addColorStop(0.75, '#990822'); mg.addColorStop(1, 'rgba(153,8,34,0)');
      x.fillStyle = mg; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
      // Mecha hex grid inside moon
      x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 1.2;
      for (let gy = cy - R; gy <= cy + R; gy += 24) {
        x.beginPath(); x.moveTo(cx - R, gy); x.lineTo(cx + R, gy); x.stroke();
      }
      // Twin glowing katana slash arcs cutting across the screen
      x.save();
      x.shadowColor = '#22d3ee'; x.shadowBlur = 18;
      x.strokeStyle = '#e0f2fe'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(20, 440); x.quadraticCurveTo(230, 250, 460, 170); x.stroke();
      x.strokeStyle = '#ff2e55'; x.shadowColor = '#ff2e55'; x.lineWidth = 3.5;
      x.beginPath(); x.moveTo(40, 190); x.quadraticCurveTo(250, 310, 455, 450); x.stroke();
      x.restore();
      // Floating crimson & cyan embers
      const r = rng(777);
      for (let i = 0; i < 65; i++) {
        x.fillStyle = i % 3 === 0 ? '#22d3ee' : '#fb7185';
        x.globalAlpha = 0.35 + r() * 0.65;
        x.beginPath(); x.arc(r() * W, r() * H, 1.2 + r() * 2.5, 0, Math.PI * 2); x.fill();
      }
      x.globalAlpha = 1;
      vignette(x, 0.45);
      return c;
    },
  },
  {
    id: 'gargantua', name: 'Black Hole', cat: 'crazy', color: '#fde047',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#020106'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.56, R = 82;
      // Outer relativistic gravitational lensing halo
      blob(x, cx, cy, 220, 'rgba(249,115,22,0.32)');
      const lens = x.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.65);
      lens.addColorStop(0, '#000');
      lens.addColorStop(0.22, '#fffbeb');
      lens.addColorStop(0.45, '#f97316');
      lens.addColorStop(0.75, '#7c2d12');
      lens.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = lens; x.beginPath(); x.arc(cx, cy, R * 1.65, 0, Math.PI * 2); x.fill();
      // Pitch-black event horizon singularity
      x.fillStyle = '#000000';
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
      // Warped relativistic accretion disk slicing across foreground
      x.save();
      x.translate(cx, cy); x.rotate(-0.24);
      for (let k = 0; k < 5; k++) {
        x.strokeStyle = k < 2 ? '#fef08a' : k < 4 ? '#f97316' : '#dc2626';
        x.lineWidth = 7 - k;
        x.shadowColor = '#f97316'; x.shadowBlur = 14;
        x.beginPath(); x.ellipse(0, 0, 145 + k * 14, 24 + k * 5, 0, -0.15, Math.PI + 0.15); x.stroke();
      }
      x.restore();
      return c;
    },
  },
  {
    id: 'bio_reactor', name: 'Arc Core', cat: 'crazy', color: '#38bdf8',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#020611'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.56;
      blob(x, cx, cy, 210, 'rgba(56,189,248,0.35)');
      // Outer segmented palladium ring
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12) * Math.PI * 2 + 0.04;
        const a1 = ((i + 1) / 12) * Math.PI * 2 - 0.04;
        x.strokeStyle = i % 2 === 0 ? '#38bdf8' : '#0284c7';
        x.lineWidth = 24;
        x.shadowColor = '#38bdf8'; x.shadowBlur = 14;
        x.beginPath(); x.arc(cx, cy, 134, a0, a1); x.stroke();
      }
      x.shadowBlur = 0;
      // Inner brass/titanium coil ribs
      x.strokeStyle = '#fbbf24'; x.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        x.beginPath();
        x.moveTo(cx + Math.cos(a) * 114, cy + Math.sin(a) * 114);
        x.lineTo(cx + Math.cos(a) * 154, cy + Math.sin(a) * 154);
        x.stroke();
      }
      // Blazing core
      blob(x, cx, cy, 88, 'rgba(224,242,254,0.95)');
      x.strokeStyle = '#e0f2fe'; x.lineWidth = 4;
      x.beginPath(); x.arc(cx, cy, 62, 0, Math.PI * 2); x.stroke();
      return c;
    },
  },
  {
    id: 'arcane_mandala', name: 'Eldritch Sigil', cat: 'crazy', color: '#fde68a',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#06030d'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.56;
      blob(x, cx, cy, 210, 'rgba(245,158,11,0.28)');
      x.save();
      x.translate(cx, cy);
      x.strokeStyle = '#fbbf24'; x.shadowColor = '#f59e0b'; x.shadowBlur = 12;
      for (const r of [162, 144, 108, 64]) {
        x.lineWidth = r === 144 ? 3 : 1.8;
        x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke();
      }
      // 3 Interlocked sacred squares (12-pointed star)
      for (let s = 0; s < 3; s++) {
        x.save(); x.rotate((s * Math.PI) / 6);
        x.strokeRect(-102, -102, 204, 204);
        x.restore();
      }
      // Rune ticks around outer ring
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        x.beginPath();
        x.moveTo(Math.cos(a) * 144, Math.sin(a) * 144);
        x.lineTo(Math.cos(a) * 162, Math.sin(a) * 162);
        x.stroke();
      }
      x.restore();
      return c;
    },
  },
  {
    id: 'neon_oni', name: 'Cyber Oni', cat: 'crazy', color: '#22d3ee',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#040208'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.58;
      blob(x, cx, cy, 200, 'rgba(244,63,94,0.25)');
      x.save();
      x.lineCap = 'round'; x.lineJoin = 'round';
      // Glowing magenta Oni horns
      x.strokeStyle = '#f43f5e'; x.lineWidth = 10; x.shadowColor = '#f43f5e'; x.shadowBlur = 18;
      for (const dir of [-1, 1]) {
        x.beginPath();
        x.moveTo(cx + dir * 55, cy - 55);
        x.quadraticCurveTo(cx + dir * 145, cy - 95, cx + dir * 115, cy - 175);
        x.stroke();
      }
      //Fierce glowing cyan eyes
      x.fillStyle = '#22d3ee'; x.shadowColor = '#22d3ee'; x.shadowBlur = 20;
      for (const dir of [-1, 1]) {
        x.beginPath();
        x.moveTo(cx + dir * 28, cy - 10);
        x.lineTo(cx + dir * 98, cy - 38);
        x.lineTo(cx + dir * 72, cy + 4);
        x.closePath(); x.fill();
      }
      // Neon fangs & grimace mask
      x.strokeStyle = '#e0f2fe'; x.lineWidth = 6;
      x.beginPath();
      x.moveTo(cx - 105, cy + 45);
      x.lineTo(cx - 68, cy + 95);
      x.lineTo(cx - 32, cy + 58);
      x.lineTo(cx, cy + 82);
      x.lineTo(cx + 32, cy + 58);
      x.lineTo(cx + 68, cy + 95);
      x.lineTo(cx + 105, cy + 45);
      x.stroke();
      x.restore();
      return c;
    },
  },
  {
    id: 'gt_tachometer', name: 'GT Redline', cat: 'crazy', color: '#ffffff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#07080c'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.56, R = 166;
      // Tachometer arc (from 135 deg to 405 deg)
      for (let i = 0; i <= 45; i++) {
        const f = i / 45;
        const a = (135 + f * 270) * (Math.PI / 180);
        const isRed = f >= 0.75;
        const isMajor = i % 5 === 0;
        x.strokeStyle = isRed ? '#ef4444' : '#38bdf8';
        x.lineWidth = isMajor ? 5 : 2;
        x.shadowColor = isRed ? '#ef4444' : '#38bdf8';
        x.shadowBlur = isMajor ? 10 : 0;
        const rIn = isMajor ? R - 24 : R - 12;
        x.beginPath();
        x.moveTo(cx + Math.cos(a) * rIn, cy + Math.sin(a) * rIn);
        x.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        x.stroke();
      }
      x.shadowBlur = 0;
      // Glowing redline needle pointing to 7500 RPM
      const na = 355 * (Math.PI / 180);
      x.strokeStyle = '#ef4444'; x.lineWidth = 6; x.shadowColor = '#ef4444'; x.shadowBlur = 16;
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(na) * (R - 18), cy + Math.sin(na) * (R - 18)); x.stroke();
      x.shadowBlur = 0;
      x.fillStyle = '#1e293b'; x.beginPath(); x.arc(cx, cy, 24, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#ef4444'; x.lineWidth = 4; x.stroke();
      return c;
    },
  },
  {
    id: 'liquid_chrome', name: 'Liquid Metal', cat: 'crazy', color: '#ffffff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#050508'; x.fillRect(0, 0, W, H);
      const blobs = [[160, 260, 110], [320, 290, 125], [230, 410, 105], [260, 190, 85]];
      for (const [bx, by, br] of blobs) {
        const g = x.createRadialGradient(bx - br * 0.3, by - br * 0.35, 6, bx, by, br);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.25, '#cbd5e1');
        g.addColorStop(0.55, '#334155');
        g.addColorStop(0.78, '#0f172a');
        g.addColorStop(0.92, '#ec4899');
        g.addColorStop(1, 'rgba(34,211,238,0)');
        x.fillStyle = g;
        x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
      }
      return c;
    },
  },
  {
    id: 'tourbillon_gold', name: 'Skeleton Gear', cat: 'crazy', color: '#fde68a',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#06080e'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.56;
      const drawGear = (gx, gy, r, teeth, col) => {
        x.save(); x.translate(gx, gy);
        x.strokeStyle = col; x.lineWidth = 4;
        x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke();
        x.beginPath(); x.arc(0, 0, r * 0.35, 0, Math.PI * 2); x.stroke();
        for (let i = 0; i < teeth; i++) {
          const a = (i / teeth) * Math.PI * 2;
          x.lineWidth = 4;
          x.beginPath(); x.moveTo(Math.cos(a) * r, Math.sin(a) * r); x.lineTo(Math.cos(a) * (r + 9), Math.sin(a) * (r + 9)); x.stroke();
        }
        for (let s = 0; s < 5; s++) {
          const a = (s / 5) * Math.PI * 2;
          x.lineWidth = 5;
          x.beginPath(); x.moveTo(Math.cos(a) * (r * 0.35), Math.sin(a) * (r * 0.35)); x.lineTo(Math.cos(a) * r, Math.sin(a) * r); x.stroke();
        }
        // Ruby pivot jewel
        x.fillStyle = '#e11d48'; x.beginPath(); x.arc(0, 0, 10, 0, Math.PI * 2); x.fill();
        x.restore();
      };
      drawGear(cx - 75, cy - 55, 68, 24, '#94a3b8');
      drawGear(cx + 80, cy + 50, 74, 28, '#cbd5e1');
      drawGear(cx, cy, 96, 32, '#f59e0b');
      vignette(x, 0.45);
      return c;
    },
  },
  {
    id: 'crimson_eye', name: 'Mangekyo Eye', cat: 'crazy', color: '#fecdd3',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#050002'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.56, R = 148;
      const g = x.createRadialGradient(cx, cy, 18, cx, cy, R);
      g.addColorStop(0, '#000000');
      g.addColorStop(0.18, '#991b1b');
      g.addColorStop(0.55, '#ef4444');
      g.addColorStop(0.88, '#7f1d1d');
      g.addColorStop(1, '#000000');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.65)'; x.lineWidth = 4;
      x.beginPath(); x.arc(cx, cy, R * 0.62, 0, Math.PI * 2); x.stroke();
      // 3 Mangekyo curved pinwheel blades + tomoe
      x.save(); x.translate(cx, cy);
      for (let i = 0; i < 3; i++) {
        x.save(); x.rotate((i * Math.PI * 2) / 3);
        x.fillStyle = '#090002';
        x.beginPath();
        x.moveTo(0, 0);
        x.quadraticCurveTo(68, -42, 0, -R * 0.88);
        x.quadraticCurveTo(-28, -42, 0, 0);
        x.fill();
        x.beginPath(); x.arc(0, -R * 0.62, 16, 0, Math.PI * 2); x.fill();
        x.restore();
      }
      x.fillStyle = '#ef4444'; x.beginPath(); x.arc(0, 0, 16, 0, Math.PI * 2); x.fill();
      x.restore();
      return c;
    },
  },
  {
    id: 'thunder_god', name: 'Raiden Storm', cat: 'crazy', color: '#e0f2fe',
    draw() {
      const [c, x] = canvas();
      const sky = x.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#020617'); sky.addColorStop(0.5, '#0f172a'); sky.addColorStop(1, '#1e1b4b');
      x.fillStyle = sky; x.fillRect(0, 0, W, H);
      blob(x, W / 2, 120, 220, 'rgba(56,189,248,0.35)');
      const r = rng(909);
      const bolt = (x0, y0, x1, y1, w, col) => {
        x.save();
        x.strokeStyle = col; x.lineWidth = w; x.shadowColor = '#38bdf8'; x.shadowBlur = 18;
        x.beginPath(); x.moveTo(x0, y0);
        let lx = x0, ly = y0;
        for (let s = 1; s <= 9; s++) {
          const t = s / 9;
          const nx = x0 + (x1 - x0) * t + (s < 9 ? (r() - 0.5) * 65 : 0);
          const ny = y0 + (y1 - y0) * t;
          x.lineTo(nx, ny);
          if (w > 3 && s === 4) bolt(nx, ny, nx + (r() - 0.5) * 160, ny + 140, 2, '#7dd3fc');
          lx = nx; ly = ny;
        }
        x.stroke();
        x.restore();
      };
      bolt(210, 40, 250, 480, 5, '#ffffff');
      bolt(110, 80, 90, 420, 3, '#38bdf8');
      bolt(370, 70, 390, 430, 3, '#a855f7');
      return c;
    },
  },
  {
    id: 'arcade_8bit', name: 'Retro Boss', cat: 'crazy', color: '#4ade80',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#050214'; x.fillRect(0, 0, W, H);
      const r = rng(1984);
      for (let i = 0; i < 90; i++) {
        x.fillStyle = ['#38bdf8', '#f43f5e', '#fde047', '#ffffff'][i % 4];
        x.fillRect(Math.floor(r() * 60) * 8, Math.floor(r() * 70) * 8, 4, 4);
      }
      // 11x8 Symmetric Pixel-Art Alien Boss in center
      const boss = [
        '00110001100',
        '00011011000',
        '00111111100',
        '01101110110',
        '11111111111',
        '10111111101',
        '10100000101',
        '00011011000',
      ];
      const ps = 16, ox = Math.round((W - 11 * ps) / 2), oy = 220;
      boss.forEach((row, ry) => {
        [...row].forEach((ch, rx) => {
          if (ch === '1') {
            x.fillStyle = ry < 3 ? '#f43f5e' : ry < 6 ? '#a855f7' : '#22d3ee';
            x.fillRect(ox + rx * ps, oy + ry * ps, ps - 2, ps - 2);
          }
        });
      });
      // Twin pixel laser beams
      x.fillStyle = '#fde047';
      x.fillRect(ox + 2 * ps, oy + 8 * ps, 6, 95);
      x.fillRect(ox + 8 * ps, oy + 8 * ps, 6, 95);
      return c;
    },
  },
  {
    id: 'supernova', name: 'Supernova', cat: 'crazy', color: '#ffffff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#020008'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.56;
      blob(x, cx, cy, 240, 'rgba(168,85,247,0.45)');
      blob(x, cx, cy, 160, 'rgba(244,63,94,0.55)');
      const r = rng(404);
      x.save(); x.translate(cx, cy);
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const len = 85 + r() * 135;
        x.strokeStyle = i % 3 === 0 ? '#fde047' : i % 2 === 0 ? '#38bdf8' : '#f43f5e';
        x.globalAlpha = 0.35 + r() * 0.55;
        x.lineWidth = 1.5 + r() * 2.5;
        x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * len, Math.sin(a) * len); x.stroke();
      }
      x.restore();
      x.globalAlpha = 1;
      blob(x, cx, cy, 65, 'rgba(255,255,255,0.98)');
      return c;
    },
  },
  {
    id: 'sri_yantra', name: 'Sacred Yantra', cat: 'crazy', color: '#fef08a',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#07040a'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.56;
      blob(x, cx, cy, 200, 'rgba(234,179,8,0.24)');
      x.save(); x.translate(cx, cy);
      // 16 Lotus petals around outer ring
      x.strokeStyle = '#f59e0b'; x.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        x.save(); x.rotate(a);
        x.beginPath(); x.moveTo(0, -130); x.quadraticCurveTo(22, -155, 0, -172); x.quadraticCurveTo(-22, -155, 0, -130); x.stroke();
        x.restore();
      }
      x.strokeStyle = '#fde047'; x.shadowColor = '#f59e0b'; x.shadowBlur = 10;
      x.beginPath(); x.arc(0, 0, 130, 0, Math.PI * 2); x.stroke();
      // Interlocking upward & downward sacred triangles
      for (const [sc, dir] of [[1.0, 1], [0.82, -1], [0.64, 1], [0.46, -1], [0.28, 1]]) {
        const R = 122 * sc;
        x.beginPath();
        for (let v = 0; v < 3; v++) {
          const a = dir * (-Math.PI / 2 + (v * Math.PI * 2) / 3);
          v === 0 ? x.moveTo(Math.cos(a) * R, Math.sin(a) * R) : x.lineTo(Math.cos(a) * R, Math.sin(a) * R);
        }
        x.closePath(); x.stroke();
      }
      x.fillStyle = '#fef08a'; x.beginPath(); x.arc(0, 0, 5, 0, Math.PI * 2); x.fill();
      x.restore();
      return c;
    },
  },
  {
    id: 'acid_wave', name: 'Acid Glitch', cat: 'crazy', color: '#a3e635',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#050507'; x.fillRect(0, 0, W, H);
      const cols = ['#a3e635', '#ec4899', '#22d3ee'];
      for (let k = 0; k < 24; k++) {
        const yBase = 110 + k * 16;
        cols.forEach((col, cIdx) => {
          x.strokeStyle = col;
          x.lineWidth = 2;
          x.globalAlpha = 0.65;
          x.beginPath();
          for (let px = 0; px <= W; px += 8) {
            const py = yBase + cIdx * 3 + Math.sin(px / 42 + k * 0.45) * 28 + Math.cos(px / 19 - k * 0.3) * 12;
            px === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
          }
          x.stroke();
        });
      }
      x.globalAlpha = 1;
      vignette(x, 0.4);
      return c;
    },
  },

  // ---- 14 Pulse 2 Official Prompt Pack Presets ----
  {
    id: 'pixel_quest', name: '1. Pixel Quest', cat: 'pulse2', color: '#F2E3B3',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#0E1330'; x.fillRect(0, 0, W, H);
      x.strokeStyle = '#18224C'; x.lineWidth = 2;
      for (let y = 20; y < H - 20; y += 40) {
        const off = ((y / 40) % 2) * 24;
        for (let gx = 20; gx < W - 20; gx += 48) { x.strokeRect(gx + off, y, 44, 36); }
      }
      x.strokeStyle = 'rgba(242,227,179,0.55)'; x.lineWidth = 4;
      x.strokeRect(20, 20, W - 40, H - 40);
      const hbmp = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000'];
      for (let i = 0; i < 5; i++) {
        x.fillStyle = i < 4 ? '#E4452F' : '#3A2636';
        hbmp.forEach((row, ry) => [...row].forEach((v, rx) => {
          if (v === '1') x.fillRect(56 + i * 76 + rx * 6, 36 + ry * 6, 5, 5);
        }));
      }
      x.fillStyle = '#090C20'; x.fillRect(40, 376, 400, 56);
      x.strokeStyle = '#F2E3B3'; x.lineWidth = 4; x.strokeRect(40, 376, 400, 56);
      x.fillStyle = '#5BD66A'; x.fillRect(120, 386, 240, 36);
      x.fillStyle = '#F2E3B3'; x.font = '700 28px monospace';
      x.fillText('XP', 56, 414); x.fillText('76%', 370, 414);
      return c;
    },
  },
  {
    id: 'arcade_cabinet', name: '2. Arcade Cabinet', cat: 'pulse2', color: '#FFE14D',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(25,227,255,0.06)';
      for (let y = 24; y < H - 24; y += 8) x.fillRect(24, y, W - 48, 2);
      x.strokeStyle = '#FF2E88'; x.lineWidth = 6;
      x.beginPath(); x.roundRect(20, 20, W - 40, H - 40, 20); x.stroke();
      x.strokeStyle = '#19E3FF'; x.lineWidth = 2;
      x.beginPath(); x.roundRect(28, 28, W - 56, H - 56, 14); x.stroke();
      x.fillStyle = '#19E3FF'; x.font = '700 28px monospace'; x.textAlign = 'center';
      x.fillText('HI-SCORE  08,420', W / 2, 76);
      x.fillStyle = '#FF2E88'; x.fillText('1UP  TIME  SCORE', W / 2, 136);
      for (let i = 0; i < 4; i++) {
        const sx = 108 + i * 88, sy = 365;
        x.fillStyle = '#19E3FF';
        x.beginPath(); x.moveTo(sx, sy - 20); x.lineTo(sx + 20, sy + 16); x.lineTo(sx, sy + 8); x.lineTo(sx - 20, sy + 16); x.closePath(); x.fill();
      }
      return c;
    },
  },
  {
    id: 'cyber_hud', name: '3. Cyber HUD', cat: 'pulse2', color: '#3CFF8A',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#0A0F0D'; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(60,255,138,0.35)'; x.lineWidth = 2;
      x.strokeRect(28, 144, W - 56, 188);
      x.strokeStyle = '#3CFF8A'; x.lineWidth = 4;
      for (const [cx, cy, sx, sy] of [[28, 144, 1, 1], [W - 28, 144, -1, 1], [28, 332, 1, -1], [W - 28, 332, -1, -1]]) {
        x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + sx * 32, cy); x.moveTo(cx, cy); x.lineTo(cx, cy + sy * 32); x.stroke();
      }
      x.strokeStyle = '#3CFF8A'; x.lineWidth = 2; x.strokeRect(28, 392, 204, 108);
      x.fillStyle = '#3CFF8A'; x.font = '700 26px monospace'; x.fillText('+HP 078 BPM', 40, 428);
      for (let i = 0; i < 6; i++) { x.fillStyle = i < 5 ? '#3CFF8A' : '#1B3326'; x.fillRect(40 + i * 30, 448, 24, 34); }
      x.strokeStyle = '#FFB020'; x.strokeRect(248, 392, 204, 108);
      x.fillStyle = '#FFB020'; x.fillText('AMMO 086%', 260, 428);
      for (let i = 0; i < 8; i++) { x.fillStyle = i < 7 ? '#FFB020' : '#3A2A10'; x.fillRect(260 + i * 22, 448, 16, 34); }
      return c;
    },
  },
  {
    id: 'neon_tokyo', name: '4. Neon Tokyo', cat: 'pulse2', color: '#28D7FF',
    draw() {
      const [c, x] = canvas();
      const hz = Math.round(H * 0.62);
      const sky = x.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, '#1B0B3A'); sky.addColorStop(1, '#FF3D9A');
      x.fillStyle = sky; x.fillRect(0, 0, W, hz);
      const cx = W / 2, cy = hz - 36, R = 104;
      const sun = x.createLinearGradient(0, cy - R, 0, cy + R);
      sun.addColorStop(0, '#FFD166'); sun.addColorStop(1, '#FF3D9A');
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.clip();
      x.fillStyle = sun; x.fillRect(cx - R, cy - R, R * 2, R * 2);
      x.fillStyle = '#1B0B3A';
      for (let y = cy; y < hz; y += 16) x.fillRect(cx - R, y, R * 2, 6);
      x.restore();
      x.fillStyle = '#120629'; x.fillRect(0, hz, W, H - hz);
      x.strokeStyle = '#28D7FF'; x.lineWidth = 2;
      for (let i = -8; i <= 8; i++) { x.beginPath(); x.moveTo(cx + i * 16, hz); x.lineTo(cx + i * 76, H - 20); x.stroke(); }
      x.strokeStyle = '#FF3D9A';
      for (let r = 1; r <= 8; r++) {
        const gy = hz + Math.pow(r / 8, 1.8) * (H - 24 - hz);
        x.beginPath(); x.moveTo(20, gy); x.lineTo(W - 20, gy); x.stroke();
      }
      return c;
    },
  },
  {
    id: 'carbon_performance', name: '5. Carbon Perf', cat: 'pulse2', color: '#FFFFFF',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#101114'; x.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 12) for (let gx = 0; gx < W; gx += 12) {
        x.fillStyle = ((gx / 12 + y / 12) % 2 === 0) ? '#181A20' : '#101114';
        x.fillRect(gx, y, 12, 12);
      }
      x.lineWidth = 16;
      x.strokeStyle = '#30D158'; x.beginPath(); x.arc(W / 2, 160, 180, Math.PI * 1.12, Math.PI * 1.38); x.stroke();
      x.strokeStyle = '#FFB020'; x.beginPath(); x.arc(W / 2, 160, 180, Math.PI * 1.40, Math.PI * 1.64); x.stroke();
      x.strokeStyle = '#E10600'; x.beginPath(); x.arc(W / 2, 160, 180, Math.PI * 1.66, Math.PI * 1.88); x.stroke();
      x.fillStyle = '#E10600'; x.fillRect(28, 348, W - 56, 6);
      x.strokeStyle = '#E10600'; x.lineWidth = 3; x.strokeRect(28, 380, 196, 96);
      x.strokeStyle = '#C9CCD1'; x.strokeRect(256, 380, 196, 96);
      x.fillStyle = '#C9CCD1'; x.font = '700 28px sans-serif'; x.textAlign = 'center';
      x.fillText('8,540 STP', 126, 438); x.fillText('412 KCAL', 354, 438);
      return c;
    },
  },
  {
    id: 'aurora_glass', name: '6. Aurora Glass', cat: 'pulse2', color: '#FFFFFF',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#0B1026'; x.fillRect(0, 0, W, H);
      blob(x, 150, 190, 220, 'rgba(62,224,197,0.55)');
      blob(x, 330, 320, 240, 'rgba(123,92,255,0.60)');
      x.fillStyle = 'rgba(255,255,255,0.12)'; x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = 2;
      x.beginPath(); x.roundRect(28, 68, W - 56, 224, 28); x.fill(); x.stroke();
      x.beginPath(); x.roundRect(28, 356, 200, 112, 24); x.fill(); x.stroke();
      x.beginPath(); x.roundRect(252, 356, 200, 112, 24); x.fill(); x.stroke();
      x.fillStyle = '#3EE0C5'; x.font = '700 28px sans-serif'; x.textAlign = 'center';
      x.fillText('8,240 STP', 128, 422);
      x.fillStyle = '#FFFFFF'; x.fillText('92% BAT', 352, 422);
      return c;
    },
  },
  {
    id: 'pure_black', name: '7. Pure Black', cat: 'pulse2', color: '#FFFFFF',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      return c;
    },
  },
  {
    id: 'ink_paper', name: '8. Ink Paper', cat: 'pulse2', color: '#151515',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#F4F1EA'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#D94B2B'; x.fillRect(36, 304, W - 72, 6);
      return c;
    },
  },
  {
    id: 'swiss_grid', name: '9. Swiss Grid', cat: 'pulse2', color: '#FFFFFF',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#0D0D0F'; x.fillRect(0, 0, W, H);
      const tiles = [
        [32, 204, '#FF9F0A', '8,420 STP'],
        [252, 204, '#30D158', '76 BPM'],
        [32, 360, '#64D2FF', '94% BAT'],
        [252, 360, '#BF5AF2', 'NOV 08'],
      ];
      for (const [tx, ty, col, lbl] of tiles) {
        x.fillStyle = '#1C1C20'; x.strokeStyle = col; x.lineWidth = 3;
        x.beginPath(); x.roundRect(tx, ty, 196, 136, 24); x.fill(); x.stroke();
        x.fillStyle = col; x.font = '700 30px sans-serif'; x.textAlign = 'center';
        x.fillText(lbl, tx + 98, ty + 78);
      }
      return c;
    },
  },
  {
    id: 'triple_rings', name: '10. Triple Rings', cat: 'pulse2', color: '#FFFFFF',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#080B12'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = 244;
      const rings = [[196, '#19D3C5', 1.55], [168, '#FFB020', 1.28], [140, '#8F6BFF', 1.72]];
      for (const [r, col, sweep] of rings) {
        x.lineWidth = 20; x.lineCap = 'round';
        x.strokeStyle = 'rgba(255,255,255,0.10)'; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
        x.strokeStyle = col; x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * sweep); x.stroke();
      }
      x.fillStyle = '#19D3C5'; x.font = '700 24px sans-serif'; x.textAlign = 'center';
      x.fillText('STP 78% · KCAL 64% · KM 86%', cx, 504);
      return c;
    },
  },
  {
    id: 'pulse', name: '11. Pulse Gauge', cat: 'pulse2', color: '#FFFFFF',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#090C12'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = 236, R = 176;
      const zones = [[1.0, 1.23, '#28D7FF'], [1.25, 1.48, '#30D158'], [1.50, 1.73, '#FFB020'], [1.75, 2.0, '#EF4444']];
      x.lineWidth = 26;
      for (const [a0, a1, col] of zones) {
        x.strokeStyle = col; x.beginPath(); x.arc(cx, cy, R, Math.PI * a0, Math.PI * a1); x.stroke();
      }
      const na = Math.PI * 1.38;
      x.strokeStyle = '#FFFFFF'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(na) * 140, cy + Math.sin(na) * 140); x.stroke();
      x.fillStyle = '#EF4444'; x.beginPath(); x.arc(cx, cy, 14, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#30D158'; x.font = '700 28px sans-serif'; x.textAlign = 'center';
      x.fillText('♥ 082 BPM', cx, 190);
      x.strokeStyle = '#28D7FF'; x.lineWidth = 3; x.strokeRect(60, 456, 360, 44);
      x.fillStyle = '#30D158'; x.fillRect(68, 464, 250, 28);
      x.fillStyle = '#FFFFFF'; x.fillText('84%', 370, 488);
      return c;
    },
  },
  {
    id: 'galaxy_orbit', name: '12. Galaxy Orbit', cat: 'pulse2', color: '#FFFFFF',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#05061A'; x.fillRect(0, 0, W, H);
      blob(x, 220, 240, 220, 'rgba(91,44,255,0.55)');
      blob(x, 270, 290, 170, 'rgba(255,79,163,0.48)');
      const r = rng(1212);
      for (let i = 0; i < 45; i++) {
        x.fillStyle = 'rgba(255,255,255,0.85)';
        x.beginPath(); x.arc(28 + r() * (W - 56), 28 + r() * (H - 56), i % 6 === 0 ? 3 : 1.5, 0, Math.PI * 2); x.fill();
      }
      const cx = W / 2, cy = 244, R = 192;
      x.strokeStyle = 'rgba(91,44,255,0.65)'; x.lineWidth = 4;
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = '#FF4FA3'; x.lineWidth = 6;
      x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, Math.PI * 0.85); x.stroke();
      const px = cx + Math.cos(Math.PI * 0.85) * R, py = cy + Math.sin(Math.PI * 0.85) * R;
      x.fillStyle = '#FF4FA3'; x.strokeStyle = '#FFFFFF'; x.lineWidth = 4;
      x.beginPath(); x.arc(px, py, 16, 0, Math.PI * 2); x.fill(); x.stroke();
      return c;
    },
  },
  {
    id: 'liquid_gradient', name: '13. Liquid Gradient', cat: 'pulse2', color: '#FFFFFF',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#090418'; x.fillRect(0, 0, W, H);
      blob(x, 140, 140, 260, 'rgba(255,107,0,0.88)');
      blob(x, 280, 270, 260, 'rgba(217,27,130,0.88)');
      blob(x, 220, 440, 280, 'rgba(30,64,175,0.92)');
      x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, 0, W, H);
      return c;
    },
  },
  {
    id: 'segment_lcd', name: '14. Segment LCD', cat: 'pulse2', color: '#B8F229',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#141A10'; x.fillRect(0, 0, W, H);
      x.strokeStyle = '#9BBC0F'; x.lineWidth = 4;
      x.beginPath(); x.roundRect(20, 20, W - 40, H - 40, 16); x.stroke();
      x.strokeStyle = '#304224'; x.lineWidth = 2;
      x.beginPath(); x.roundRect(28, 28, W - 56, H - 56, 10); x.stroke();
      for (const [bx, by, bw, bh, txt] of [[32, 412, 224, 68, 'STP 09,120'], [268, 412, 180, 68, 'BPM 074']]) {
        x.fillStyle = '#1D2617'; x.strokeStyle = '#B8F229'; x.lineWidth = 2;
        x.beginPath(); x.roundRect(bx, by, bw, bh, 8); x.fill(); x.stroke();
        x.fillStyle = '#B8F229'; x.font = '700 28px monospace'; x.textAlign = 'center';
        x.fillText(txt, bx + bw / 2, by + 44);
      }
      return c;
    },
  },

  // ---- 18 New Eye-Catching Ultra-Creative Watchfaces ----
// Additional 18 eye-catching presets for presets.js

  // 1. Cyberpunk Samurai 2077
  {
    id: 'cyber_glitch', name: 'Cyberpunk 2077', cat: 'crazy', color: '#00f0ff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#0a0518'; x.fillRect(0, 0, W, H);
      // Neon yellow cyber grid
      x.strokeStyle = 'rgba(254, 240, 138, 0.08)'; x.lineWidth = 1;
      for (let gx = 20; gx < W; gx += 20) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
      for (let gy = 20; gy < H; gy += 20) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
      // High-contrast angled glitch tech bars
      x.fillStyle = '#ff0055';
      x.beginPath(); x.moveTo(0, 180); x.lineTo(W, 140); x.lineTo(W, 160); x.lineTo(0, 200); x.fill();
      x.fillStyle = '#00f0ff';
      x.beginPath(); x.moveTo(0, 260); x.lineTo(W, 220); x.lineTo(W, 235); x.lineTo(0, 275); x.fill();
      x.fillStyle = '#fcee09';
      x.beginPath(); x.moveTo(0, 340); x.lineTo(W, 300); x.lineTo(W, 308); x.lineTo(0, 348); x.fill();
      // Glowing tech core ring
      blob(x, W / 2, H * 0.52, 190, 'rgba(0, 240, 255, 0.35)');
      blob(x, W / 2, H * 0.52, 90, 'rgba(255, 0, 85, 0.45)');
      x.strokeStyle = '#fcee09'; x.lineWidth = 3;
      x.strokeRect(30, 80, W - 60, H - 160);
      x.fillStyle = '#00f0ff'; x.fillRect(20, 70, 20, 20); x.fillRect(W - 40, 70, 20, 20);
      x.fillRect(20, H - 90, 20, 20); x.fillRect(W - 40, H - 90, 20, 20);
      vignette(x, 0.5);
      return c;
    }
  },
  // 2. Solar Flare Prominence
  {
    id: 'solar_flare', name: 'Solar Flare', cat: 'scenic', color: '#ffedd5',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#030002'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.55, R = 130;
      // Massive pulsing corona
      blob(x, cx, cy, 240, 'rgba(239, 68, 68, 0.4)');
      blob(x, cx, cy, 180, 'rgba(249, 115, 22, 0.6)');
      blob(x, cx, cy, 130, 'rgba(253, 224, 71, 0.85)');
      // Blazing magnetic loop arcs
      const r = rng(108);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const len = 40 + r() * 90;
        x.strokeStyle = i % 2 === 0 ? '#fef08a' : '#f97316';
        x.lineWidth = 2 + r() * 4;
        x.beginPath();
        x.arc(cx + Math.cos(a) * (R + len * 0.4), cy + Math.sin(a) * (R + len * 0.4), len * 0.5, a - 1.2, a + 1.2);
        x.stroke();
      }
      x.fillStyle = '#000000'; x.beginPath(); x.arc(cx, cy, R - 10, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#ffffff'; x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, R - 10, 0, Math.PI * 2); x.stroke();
      return c;
    }
  },
  // 3. Cyber Dragon Aura
  {
    id: 'dragon_aura', name: 'Dragon Soul', cat: 'crazy', color: '#38bdf8',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#020b14'; x.fillRect(0, 0, W, H);
      blob(x, W / 2, H * 0.48, 220, 'rgba(14, 165, 233, 0.45)');
      // Twin serpentine spiral energy dragons
      const r = rng(99);
      for (let d = 0; d < 2; d++) {
        const dir = d === 0 ? 1 : -1;
        x.strokeStyle = d === 0 ? '#38bdf8' : '#a855f7';
        x.lineWidth = 4;
        x.beginPath();
        for (let t = 0; t < 180; t++) {
          const rad = 20 + t * 1.1;
          const a = (t * 0.08) * dir;
          const px = W / 2 + Math.cos(a) * rad;
          const py = H * 0.5 + Math.sin(a) * rad * 1.2;
          t === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
        }
        x.stroke();
      }
      // Glowing mystical sparks
      for (let i = 0; i < 70; i++) {
        x.fillStyle = i % 3 === 0 ? '#ffffff' : '#38bdf8';
        x.beginPath(); x.arc(r() * W, r() * H, 1 + r() * 2.5, 0, Math.PI * 2); x.fill();
      }
      vignette(x, 0.4);
      return c;
    }
  },
  // 4. Ghost Shell Camo
  {
    id: 'cyber_hex', name: 'Tactical Hex', cat: 'amoled', color: '#4ade80',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#060a08'; x.fillRect(0, 0, W, H);
      const hexR = 24;
      const hH = hexR * Math.sqrt(3);
      const r = rng(42);
      for (let y = 0; y < H + 40; y += hH) {
        for (let gx = 0; gx < W + 40; gx += hexR * 3) {
          for (let row = 0; row < 2; row++) {
            const hx = gx + (row === 1 ? hexR * 1.5 : 0);
            const hy = y + (row === 1 ? hH * 0.5 : 0);
            const active = r() < 0.28;
            x.strokeStyle = active ? '#22c55e' : 'rgba(34, 197, 94, 0.08)';
            x.lineWidth = active ? 2 : 1;
            x.fillStyle = active ? 'rgba(34, 197, 94, 0.18)' : 'transparent';
            x.beginPath();
            for (let a = 0; a < 6; a++) {
              const ang = (a * Math.PI) / 3;
              const px = hx + hexR * Math.cos(ang);
              const py = hy + hexR * Math.sin(ang);
              a === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
            }
            x.closePath();
            x.fill(); x.stroke();
          }
        }
      }
      blob(x, W / 2, H / 2, 200, 'rgba(74, 222, 128, 0.2)');
      vignette(x, 0.6);
      return c;
    }
  },
  // 5. Interstellar Wormhole
  {
    id: 'wormhole', name: 'Wormhole', cat: 'crazy', color: '#c084fc',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#020008'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.54;
      // Hyperdrive perspective warp tunnel rings
      for (let i = 1; i <= 20; i++) {
        const rad = Math.pow(i / 20, 1.8) * 230;
        x.strokeStyle = i % 2 === 0 ? '#a855f7' : '#38bdf8';
        x.lineWidth = 1.2 + (i / 20) * 3;
        x.beginPath(); x.arc(cx, cy, rad, 0, Math.PI * 2); x.stroke();
      }
      // Radial warp streaks
      for (let s = 0; s < 36; s++) {
        const a = (s / 36) * Math.PI * 2;
        x.strokeStyle = s % 3 === 0 ? '#f43f5e' : '#818cf8';
        x.lineWidth = 1.5;
        x.beginPath();
        x.moveTo(cx + Math.cos(a) * 25, cy + Math.sin(a) * 25);
        x.lineTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
        x.stroke();
      }
      blob(x, cx, cy, 50, '#ffffff');
      vignette(x, 0.5);
      return c;
    }
  },
  // 6. Neon Horizon Sunset
  {
    id: 'neon_sunset', name: 'Miami Palms', cat: 'scenic', color: '#fed7aa',
    draw() {
      const [c, x] = canvas();
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1e1136'); g.addColorStop(0.45, '#7c1356'); g.addColorStop(0.7, '#ea580c'); g.addColorStop(1, '#0f172a');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // Giant glowing sunset orb
      blob(x, W / 2, H * 0.44, 140, 'rgba(253, 224, 71, 0.9)');
      // Palm tree silhouette
      x.fillStyle = '#090514';
      // Left palm
      x.beginPath();
      x.moveTo(60, H); x.quadraticCurveTo(80, H * 0.6, 120, H * 0.4);
      x.quadraticCurveTo(80, H * 0.6, 75, H); x.fill();
      // Fronds
      for (let f = -3; f <= 3; f++) {
        x.beginPath();
        x.moveTo(120, H * 0.4);
        x.quadraticCurveTo(120 + f * 35, H * 0.35 + Math.abs(f) * 15, 120 + f * 55, H * 0.46 + Math.abs(f) * 18);
        x.quadraticCurveTo(120 + f * 35, H * 0.38 + Math.abs(f) * 10, 120, H * 0.4);
        x.fill();
      }
      vignette(x, 0.35);
      return c;
    }
  },
  // 7. Dark Obsidian Gold
  {
    id: 'obsidian_gold', name: 'Black & Gold', cat: 'amoled', color: '#fef08a',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#08080a'; x.fillRect(0, 0, W, H);
      // Geometric brushed gold facets
      x.strokeStyle = 'rgba(234, 179, 8, 0.6)'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(W / 2, 40); x.lineTo(W - 40, H * 0.4); x.lineTo(W / 2, H - 40); x.lineTo(40, H * 0.4); x.closePath(); x.stroke();
      x.beginPath(); x.moveTo(W / 2, 80); x.lineTo(W - 70, H * 0.4); x.lineTo(W / 2, H - 80); x.lineTo(70, H * 0.4); x.closePath(); x.stroke();
      // Gold gradient core
      const g = x.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, 180);
      g.addColorStop(0, 'rgba(250, 204, 21, 0.35)'); g.addColorStop(1, 'transparent');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // Gold accent bars
      x.fillStyle = '#eab308';
      x.fillRect(50, H - 54, W - 100, 4);
      x.fillRect(70, H - 44, W - 140, 2);
      return c;
    }
  },
  // 8. Cyberpunk HUD Redline
  {
    id: 'hud_redline', name: 'Apex Predator', cat: 'crazy', color: '#ef4444',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#050102'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.54;
      // Aggressive red HUD targeting circles and chevrons
      x.strokeStyle = '#ef4444'; x.lineWidth = 3;
      x.beginPath(); x.arc(cx, cy, 110, -Math.PI * 0.8, -Math.PI * 0.2); x.stroke();
      x.beginPath(); x.arc(cx, cy, 110, Math.PI * 0.2, Math.PI * 0.8); x.stroke();
      x.strokeStyle = 'rgba(239, 68, 68, 0.4)'; x.lineWidth = 1;
      x.beginPath(); x.arc(cx, cy, 126, 0, Math.PI * 2); x.stroke();
      // Tactical lock brackets
      for (const [bx, by, dx, dy] of [[30, 60, 20, 20], [W - 30, 60, -20, 20], [30, H - 60, 20, -20], [W - 30, H - 60, -20, -20]]) {
        x.strokeStyle = '#ef4444'; x.lineWidth = 4;
        x.beginPath(); x.moveTo(bx, by + dy); x.lineTo(bx, by); x.lineTo(bx + dx, by); x.stroke();
      }
      blob(x, cx, cy, 120, 'rgba(239, 68, 68, 0.3)');
      vignette(x, 0.5);
      return c;
    }
  },
  // 9. Emerald Nexus
  {
    id: 'emerald_nexus', name: 'Emerald Matrix', cat: 'amoled', color: '#6ee7b7',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#020a06'; x.fillRect(0, 0, W, H);
      blob(x, W / 2, H * 0.5, 210, 'rgba(16, 185, 129, 0.35)');
      // Digital circuit traces
      const r = rng(71);
      x.strokeStyle = '#10b981'; x.lineWidth = 2;
      for (let i = 0; i < 28; i++) {
        let px = r() * W, py = r() * H;
        x.beginPath(); x.moveTo(px, py);
        for (let s = 0; s < 4; s++) {
          const dir = Math.floor(r() * 4);
          if (dir === 0) px += 30; else if (dir === 1) py += 30; else if (dir === 2) px -= 30; else py -= 30;
          x.lineTo(px, py);
        }
        x.stroke();
        x.fillStyle = '#6ee7b7'; x.beginPath(); x.arc(px, py, 3, 0, Math.PI * 2); x.fill();
      }
      vignette(x, 0.5);
      return c;
    }
  },
  // 10. Vaporwave Dreamscape
  {
    id: 'vapor_wave', name: 'Vaporwave 90s', cat: 'abstract', color: '#fbcfe8',
    draw() {
      const [c, x] = canvas();
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#38bdf8'); g.addColorStop(0.5, '#f472b6'); g.addColorStop(1, '#a855f7');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // Floating 3D checkerboard grid plane
      x.fillStyle = '#ffffff';
      for (let y = 140; y < H - 20; y += 24) {
        for (let gx = 20; gx < W - 20; gx += 24) {
          if (((gx + y) / 24) % 2 === 0) x.fillRect(gx, y, 24, 24);
        }
      }
      // Gradient marble overlay
      blob(x, W * 0.3, H * 0.3, 160, 'rgba(255, 255, 255, 0.45)');
      vignette(x, 0.35);
      return c;
    }
  },
  // 11. Supercharged Lightning
  {
    id: 'electric_blue', name: 'Arc Lightning', cat: 'crazy', color: '#e0f2fe',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#020617'; x.fillRect(0, 0, W, H);
      blob(x, W / 2, H * 0.48, 200, 'rgba(56, 189, 248, 0.45)');
      const r = rng(333);
      const drawArc = (x1, y1, x2, y2, col, w) => {
        x.strokeStyle = col; x.lineWidth = w;
        x.beginPath(); x.moveTo(x1, y1);
        let curX = x1, curY = y1;
        const steps = 14;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const targetX = x1 + (x2 - x1) * t + (r() - 0.5) * 45;
          const targetY = y1 + (y2 - y1) * t + (r() - 0.5) * 30;
          x.lineTo(targetX, targetY);
          curX = targetX; curY = targetY;
        }
        x.stroke();
      };
      drawArc(20, 40, W - 30, H - 40, '#0284c7', 6);
      drawArc(20, 40, W - 30, H - 40, '#38bdf8', 3);
      drawArc(20, 40, W - 30, H - 40, '#ffffff', 1.5);
      drawArc(W - 20, 60, 30, H - 60, '#38bdf8', 3);
      drawArc(W - 20, 60, 30, H - 60, '#ffffff', 1.2);
      vignette(x, 0.4);
      return c;
    }
  },
  // 12. Magma Core Overload
  {
    id: 'magma_core', name: 'Molten Core', cat: 'crazy', color: '#ffedd5',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#0a0201'; x.fillRect(0, 0, W, H);
      blob(x, W / 2, H * 0.52, 230, 'rgba(239, 68, 68, 0.45)');
      blob(x, W / 2, H * 0.52, 140, 'rgba(249, 115, 22, 0.7)');
      blob(x, W / 2, H * 0.52, 60, '#fffbeb');
      // Cracked obsidian crust polygons
      x.strokeStyle = '#f97316'; x.lineWidth = 3;
      const r = rng(77);
      for (let i = 0; i < 18; i++) {
        x.beginPath();
        x.arc(W / 2, H * 0.52, 50 + i * 9, (r() * Math.PI), (r() * Math.PI + 1.2));
        x.stroke();
      }
      vignette(x, 0.5);
      return c;
    }
  },
  // 13. Deep Oceanic Trench
  {
    id: 'ocean_abyss', name: 'Abyssal Deep', cat: 'scenic', color: '#a5f3fc',
    draw() {
      const [c, x] = canvas();
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#020617'); g.addColorStop(0.5, '#082f49'); g.addColorStop(1, '#02040a');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      blob(x, W * 0.6, H * 0.6, 200, 'rgba(6, 182, 212, 0.35)');
      // Bioluminescent light rays
      for (let r = 0; r < 8; r++) {
        const xTop = 40 + r * 50;
        x.fillStyle = 'rgba(165, 243, 252, 0.08)';
        x.beginPath(); x.moveTo(xTop, 0); x.lineTo(xTop + 80, H); x.lineTo(xTop + 130, H); x.lineTo(xTop + 20, 0); x.fill();
      }
      vignette(x, 0.45);
      return c;
    }
  },
  // 14. Neon Polygon Prism
  {
    id: 'neon_poly', name: 'Prism Facets', cat: 'abstract', color: '#fbcfe8',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#080711'; x.fillRect(0, 0, W, H);
      const cols = ['#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4'];
      const r = rng(2027);
      for (let i = 0; i < 18; i++) {
        x.fillStyle = cols[i % cols.length];
        x.globalAlpha = 0.25;
        x.beginPath();
        x.moveTo(r() * W, r() * H);
        x.lineTo(r() * W, r() * H);
        x.lineTo(r() * W, r() * H);
        x.closePath();
        x.fill();
      }
      x.globalAlpha = 1.0;
      vignette(x, 0.5);
      return c;
    }
  },
  // 15. Royal Crimson Gold
  {
    id: 'crimson_royal', name: 'Royal Velvet', cat: 'minimal', color: '#fef08a',
    draw() {
      const [c, x] = canvas();
      const g = x.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 280);
      g.addColorStop(0, '#580c1f'); g.addColorStop(1, '#1a0308');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // Gold ornate baroque border
      x.strokeStyle = '#eab308'; x.lineWidth = 3;
      x.strokeRect(26, 26, W - 52, H - 52);
      x.strokeStyle = 'rgba(234, 179, 8, 0.4)'; x.lineWidth = 1;
      x.strokeRect(34, 34, W - 68, H - 68);
      // Corner flourishes
      for (const [bx, by] of [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]]) {
        x.fillStyle = '#eab308';
        x.beginPath(); x.arc(bx, by, 7, 0, Math.PI * 2); x.fill();
      }
      return c;
    }
  },
  // 16. Cyber Lotus Mandala
  {
    id: 'cyber_lotus', name: 'Cyber Lotus', cat: 'crazy', color: '#f472b6',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#06030d'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.52;
      blob(x, cx, cy, 210, 'rgba(236, 72, 153, 0.35)');
      // 12 Glowing neon lotus petals
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        x.save();
        x.translate(cx, cy);
        x.rotate(a);
        x.strokeStyle = i % 2 === 0 ? '#f472b6' : '#a855f7';
        x.lineWidth = 2.5;
        x.beginPath();
        x.moveTo(0, 0);
        x.quadraticCurveTo(35, -90, 0, -145);
        x.quadraticCurveTo(-35, -90, 0, 0);
        x.stroke();
        x.restore();
      }
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx, cy, 8, 0, Math.PI * 2); x.fill();
      vignette(x, 0.45);
      return c;
    }
  },
  // 17. Stealth Fighter Carbon
  {
    id: 'stealth_bomber', name: 'Nighthawk Stealth', cat: 'amoled', color: '#94a3b8',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#050608'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.52;
      // Angular stealth faceted wings
      x.fillStyle = '#0f172a';
      x.beginPath(); x.moveTo(cx, cy - 130); x.lineTo(W - 30, cy + 90); x.lineTo(cx, cy + 50); x.lineTo(30, cy + 90); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(148, 163, 184, 0.35)'; x.lineWidth = 2; x.stroke();
      x.fillStyle = '#1e293b';
      x.beginPath(); x.moveTo(cx, cy - 130); x.lineTo(W - 80, cy + 40); x.lineTo(cx, cy + 50); x.lineTo(80, cy + 40); x.closePath(); x.fill();
      x.strokeStyle = '#38bdf8'; x.lineWidth = 1.5; x.stroke();
      // Glowing cyan targeting reticle
      x.strokeStyle = '#06b6d4'; x.lineWidth = 2;
      x.beginPath(); x.arc(cx, cy - 20, 35, 0, Math.PI * 2); x.stroke();
      vignette(x, 0.5);
      return c;
    }
  },
  // 18. Neon City Skyline
  {
    id: 'synth_skyline', name: 'Cyber City 2099', cat: 'scenic', color: '#fef08a',
    draw() {
      const [c, x] = canvas();
      const sky = x.createLinearGradient(0, 0, 0, H * 0.65);
      sky.addColorStop(0, '#090014'); sky.addColorStop(0.5, '#3b0764'); sky.addColorStop(1, '#be185d');
      x.fillStyle = sky; x.fillRect(0, 0, W, H * 0.65);
      // Giant neon moon
      blob(x, W / 2, H * 0.35, 90, 'rgba(254, 240, 138, 0.9)');
      // Skyscraper silhouettes with lighted windows
      const r = rng(55);
      x.fillStyle = '#090514';
      for (let b = 0; b < 12; b++) {
        const bx = b * 40 - 10;
        const bW = 34 + r() * 12;
        const bH = 110 + r() * 120;
        x.fillRect(bx, H * 0.7 - bH, bW, bH + 120);
        // Windows
        for (let wy = H * 0.7 - bH + 10; wy < H * 0.7; wy += 14) {
          for (let wx = bx + 4; wx < bx + bW - 4; wx += 8) {
            if (r() < 0.45) {
              x.fillStyle = r() < 0.3 ? '#22d3ee' : '#fde047';
              x.fillRect(wx, wy, 4, 6);
              x.fillStyle = '#090514';
            }
          }
        }
      }
      x.fillStyle = '#030106'; x.fillRect(0, H * 0.7, W, H * 0.3);
      vignette(x, 0.4);
      return c;
    }
  },

  // ---- Aesthetic & Minimalist Additions ----
  {
    id: 'zen_enso', name: 'Zen Ensō', cat: 'minimal', color: '#f5f5f4',
    draw() {
      const [c, x] = canvas();
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0c0d10'); g.addColorStop(1, '#16181e');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // Ensō ink brush circle
      const cx = W / 2, cy = H * 0.42, r = 135;
      x.strokeStyle = '#e7e5e4';
      x.lineCap = 'round';
      for (let deg = 25; deg < 340; deg += 3) {
        const rad = deg * Math.PI / 180;
        const wFactor = Math.sin((deg - 25) / 315 * Math.PI);
        const rOffset = r + Math.sin(deg * 0.08) * 4;
        const px = cx + rOffset * Math.cos(rad);
        const py = cy + rOffset * Math.sin(rad);
        x.fillStyle = 'rgba(231, 229, 228, 0.92)';
        x.beginPath();
        x.arc(px, py, 2.5 + wFactor * 9, 0, Math.PI * 2);
        x.fill();
      }
      // Traditional Vermilion Red Stamp / Seal
      x.strokeStyle = '#dc2626';
      x.lineWidth = 3;
      x.strokeRect(W - 90, H - 120, 32, 32);
      x.fillStyle = '#dc2626';
      x.fillRect(W - 80, H - 110, 12, 12);
      vignette(x, 0.45);
      return c;
    }
  },
  {
    id: 'nordic_fog', name: 'Nordic Fog', cat: 'minimal', color: '#f1f5f9',
    draw() {
      const [c, x] = canvas();
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0f172a'); g.addColorStop(0.5, '#1e293b'); g.addColorStop(1, '#334155');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // Soft pale moon in mist
      blob(x, W / 2, H * 0.28, 70, 'rgba(241, 245, 249, 0.85)');
      // Minimal mountain silhouettes
      x.fillStyle = '#1e293b';
      x.beginPath();
      x.moveTo(0, H * 0.65);
      x.lineTo(W * 0.25, H * 0.58);
      x.lineTo(W * 0.6, H * 0.66);
      x.lineTo(W * 0.85, H * 0.55);
      x.lineTo(W, H * 0.62);
      x.lineTo(W, H); x.lineTo(0, H);
      x.fill();
      // Foreground darker ridge
      x.fillStyle = '#0f172a';
      x.beginPath();
      x.moveTo(0, H * 0.78);
      x.lineTo(W * 0.35, H * 0.72);
      x.lineTo(W * 0.7, H * 0.77);
      x.lineTo(W, H * 0.7);
      x.lineTo(W, H); x.lineTo(0, H);
      x.fill();
      // Clean horizon rule
      x.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      x.lineWidth = 1.5;
      x.beginPath();
      x.moveTo(40, H * 0.88); x.lineTo(W - 40, H * 0.88);
      x.stroke();
      return c;
    }
  },
  {
    id: 'bauhaus_geo', name: 'Bauhaus Modern', cat: 'minimal', color: '#fef3c7',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#171717'; x.fillRect(0, 0, W, H);
      // Outer minimalist drafting frame
      x.strokeStyle = '#404040';
      x.lineWidth = 1.5;
      x.strokeRect(30, 30, W - 60, H - 60);
      // Deep cobalt arch
      x.fillStyle = '#1d4ed8';
      x.beginPath();
      x.arc(W * 0.38, H * 0.32, 100, Math.PI, Math.PI * 2);
      x.fill();
      // Bauhaus warm gold circle
      x.fillStyle = '#f59e0b';
      x.beginPath();
      x.arc(W * 0.68, H * 0.56, 68, 0, Math.PI * 2);
      x.fill();
      // Coral red slim rule
      x.fillStyle = '#ef4444';
      x.fillRect(50, H * 0.8, 180, 10);
      // Fine crosshair axes
      x.strokeStyle = '#525252';
      x.beginPath();
      x.moveTo(W / 2, 40); x.lineTo(W / 2, H - 40);
      x.moveTo(40, H * 0.48); x.lineTo(W - 40, H * 0.48);
      x.stroke();
      return c;
    }
  },
  {
    id: 'sandstone_dune', name: 'Sandstone Dusk', cat: 'minimal', color: '#fde68a',
    draw() {
      const [c, x] = canvas();
      const sky = x.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#1c1917'); sky.addColorStop(0.5, '#44281d'); sky.addColorStop(1, '#78350f');
      x.fillStyle = sky; x.fillRect(0, 0, W, H);
      // Crescent golden moon
      x.fillStyle = '#fde68a';
      x.beginPath();
      x.arc(W * 0.78, H * 0.22, 32, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = '#1c1917';
      x.beginPath();
      x.arc(W * 0.73, H * 0.20, 30, 0, Math.PI * 2);
      x.fill();
      // Flowing desert dune sweeps
      x.fillStyle = '#451a03';
      x.beginPath();
      x.moveTo(0, H * 0.6);
      x.quadraticCurveTo(W * 0.4, H * 0.52, W, H * 0.66);
      x.lineTo(W, H); x.lineTo(0, H);
      x.fill();
      x.fillStyle = '#291002';
      x.beginPath();
      x.moveTo(0, H * 0.76);
      x.quadraticCurveTo(W * 0.6, H * 0.68, W, H * 0.82);
      x.lineTo(W, H); x.lineTo(0, H);
      x.fill();
      return c;
    }
  },
  {
    id: 'sage_botanical', name: 'Sage Botanical', cat: 'minimal', color: '#ecfdf5',
    draw() {
      const [c, x] = canvas();
      const bg = x.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#061711'); bg.addColorStop(1, '#0e2b20');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      // Delicate minimalist plant stem & leaves (line art)
      x.strokeStyle = '#6ee7b7';
      x.lineWidth = 2.5;
      x.beginPath();
      x.moveTo(W / 2, H * 0.9);
      x.quadraticCurveTo(W / 2 - 15, H * 0.65, W / 2, H * 0.45);
      x.stroke();
      // Delicate botanical leaves
      const leaves = [
        [W / 2 - 8, H * 0.8, -45, -20],
        [W / 2 - 4, H * 0.7, 45, -20],
        [W / 2 - 8, H * 0.6, -40, -18],
        [W / 2, H * 0.5, 38, -18],
        [W / 2, H * 0.44, 0, -28]
      ];
      x.fillStyle = 'rgba(110, 231, 183, 0.2)';
      for (const [lx, ly, dx, dy] of leaves) {
        x.beginPath();
        x.ellipse(lx + dx / 2, ly + dy / 2, Math.abs(dx) / 1.5 + 4, 10, Math.atan2(dy, dx), 0, Math.PI * 2);
        x.fill();
        x.stroke();
      }
      // Double hairline frame
      x.strokeStyle = 'rgba(52, 211, 153, 0.3)';
      x.lineWidth = 1;
      x.strokeRect(35, 35, W - 70, H - 70);
      return c;
    }
  },
  {
    id: 'eclipse_mono', name: 'Eclipse Halo', cat: 'minimal', color: '#ffffff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.42;
      // Glowing soft corona
      blob(x, cx, cy, 180, 'rgba(255, 255, 255, 0.45)');
      blob(x, cx, cy, 140, 'rgba(255, 255, 255, 0.75)');
      // Pitch black eclipse disc
      x.fillStyle = '#000000';
      x.beginPath();
      x.arc(cx, cy, 120, 0, Math.PI * 2);
      x.fill();
      // Delicate ring accent
      x.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      x.lineWidth = 1.5;
      x.stroke();
      // Cardinal dots
      x.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        const rad = i * Math.PI / 2;
        x.beginPath();
        x.arc(cx + 155 * Math.cos(rad), cy + 155 * Math.sin(rad), 3, 0, Math.PI * 2);
        x.fill();
      }
      return c;
    }
  },
  {
    id: 'terrazzo_slate', name: 'Terrazzo Slate', cat: 'minimal', color: '#fafaf9',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#1c1917'; x.fillRect(0, 0, W, H);
      // Speckled stones
      const stones = [
        [70, 90, 16, '#f97316'], [390, 70, 12, '#14b8a6'], [170, 460, 20, '#facc15'],
        [420, 430, 15, '#6366f1'], [80, 330, 11, '#fb7185'], [360, 240, 18, '#38bdf8'],
        [220, 80, 10, '#a3e635'], [300, 480, 16, '#e0e7ff'], [60, 190, 14, '#fdba74']
      ];
      for (const [sx, sy, sr, sc] of stones) {
        x.fillStyle = sc;
        x.beginPath();
        x.arc(sx, sy, sr, 0, Math.PI * 2);
        x.fill();
      }
      // Centered frosted pill outline for time
      x.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      x.lineWidth = 2.5;
      x.beginPath();
      x.roundRect(64, H * 0.3, W - 128, 140, 32);
      x.stroke();
      return c;
    }
  },
  {
    id: 'kyoto_slate', name: 'Kyoto Washi', cat: 'minimal', color: '#fef3c7',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#111215'; x.fillRect(0, 0, W, H);
      // Subtle vertical bamboo reed lines
      x.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      x.lineWidth = 2;
      for (let lx = 30; lx < W - 20; lx += 28) {
        x.beginPath();
        x.moveTo(lx, 30); x.lineTo(lx, H - 30);
        x.stroke();
      }
      // Pure gold horizontal washi stripe
      x.fillStyle = '#d4af37';
      x.fillRect(40, H * 0.5, W - 80, 4);
      // Deep lacquer red circle
      x.fillStyle = '#991b1b';
      x.beginPath();
      x.arc(W / 2, H * 0.72, 38, 0, Math.PI * 2);
      x.fill();
      return c;
    }
  }

];
