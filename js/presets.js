// Procedurally generated backgrounds. All original artwork, free to use (MIT).
// Each preset draws onto a canvas at 2x the watch resolution.

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

export const PRESETS = [
  {
    id: 'aurora', name: 'Aurora', color: '#e8fff6',
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
    id: 'synthwave', name: 'Synthwave', color: '#ffe4f3',
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
    id: 'nebula', name: 'Nebula', color: '#ffffff',
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
    id: 'mesh', name: 'Liquid', color: '#1b1b2f',
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
    id: 'mono', name: 'Midnight', color: '#ffffff',
    draw() {
      const [c, x] = canvas();
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      blob(x, W / 2, H * 0.35, 320, 'rgba(40,48,72,0.7)');
      return c;
    },
  },
  {
    id: 'ocean', name: 'Ocean', color: '#ecfeff',
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
    id: 'matrix', name: 'Matrix', color: '#86efac',
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
    id: 'topo', name: 'Topo', color: '#fef3c7',
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
    id: 'carbon', name: 'Carbon', color: '#f97316',
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
    id: 'bokeh', name: 'Bokeh', color: '#fff7ed',
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
];
