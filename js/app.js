import { W0, H0, W1, H1, DEFAULT_ID, defaultLayout, cjson, rgba565be, decode565be, assemble, parseWatch, replaceWatchBackground } from './format.js';
import { NoiseLink, transfer, bleSupported } from './ble.js';
import { sendNotification, ringCall } from './notify.js';
import { HAND_PRESETS, HAND_STYLES, SECOND_STYLES, CAP_STYLES, DIAL_STYLES, defaultDial, drawDialOverlay, drawHand, capSprite } from './hands.js';
import { decodeSprite, spriteToRGBA } from './sprite.js';
import { buildHandsFace, analogIds } from './analog.js';
import {
  VIDEO_SCENES,
  LOW_RES_PRESETS,
  resolveLowResSpec,
  quantizeLowResFrame,
  renderLowResPreviewRgba,
  analyzeGifFrames,
  computeCleanBaseRgba,
  renderSceneRgba,
  buildVideoWatchSprites,
  extractMediaFrames,
  defaultMotion,
} from './motion.js';
import { PRESETS, PRESET_CATEGORIES } from './presets.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// ------------------------------------------------------------------ fonts catalog
export const FONT_CATALOG = [
  { group: 'Watch & System', items: [
    { name: 'System Sans (Default)', family: 'system-ui, "Segoe UI", Roboto, sans-serif' },
    { name: 'Impact / Bold Poster', family: 'Impact, "Arial Black", sans-serif' },
    { name: 'Consolas / Terminal', family: 'ui-monospace, Consolas, monospace' },
    { name: 'Georgia / Classic', family: 'Georgia, serif' },
  ]},
  { group: 'Digital · Sci-Fi · LED', items: [
    { name: 'Orbitron (Sci-Fi)', family: '"Orbitron", sans-serif' },
    { name: 'Audiowide (Futuristic)', family: '"Audiowide", sans-serif' },
    { name: 'Wallpoet (Stencil LED)', family: '"Wallpoet", sans-serif' },
    { name: 'VT323 (Pixel CRT)', family: '"VT323", monospace' },
    { name: 'Share Tech Mono', family: '"Share Tech Mono", monospace' },
    { name: 'Silkscreen (8-Bit)', family: '"Silkscreen", monospace' },
    { name: 'Press Start 2P (Arcade)', family: '"Press Start 2P", monospace' },
    { name: 'Michroma (Wide Tech)', family: '"Michroma", sans-serif' },
    { name: 'Syncopate (Space Caps)', family: '"Syncopate", sans-serif' },
    { name: 'Rajdhani (HUD Square)', family: '"Rajdhani", sans-serif' },
    { name: 'Exo 2 (Cyber Sport)', family: '"Exo 2", sans-serif' },
  ]},
  { group: 'Bold · Display · Sport', items: [
    { name: 'Bebas Neue (Tall)', family: '"Bebas Neue", sans-serif' },
    { name: 'Anton (Heavy Block)', family: '"Anton", sans-serif' },
    { name: 'Teko (Condensed Sport)', family: '"Teko", sans-serif' },
    { name: 'Russo One (Tank)', family: '"Russo One", sans-serif' },
    { name: 'Black Ops One (Military)', family: '"Black Ops One", sans-serif' },
    { name: 'Righteous (Retro Wave)', family: '"Righteous", sans-serif' },
    { name: 'Bungee (Urban Sign)', family: '"Bungee", sans-serif' },
    { name: 'Monoton (Neon Lines)', family: '"Monoton", sans-serif' },
    { name: 'Rubik Mono One (Chunky)', family: '"Rubik Mono One", monospace' },
    { name: 'Oswald (Headline)', family: '"Oswald", sans-serif' },
  ]},
  { group: 'Modern · Geometric', items: [
    { name: 'Montserrat (Geometric)', family: '"Montserrat", sans-serif' },
    { name: 'Space Grotesk (Tech)', family: '"Space Grotesk", sans-serif' },
    { name: 'Comfortaa (Rounded)', family: '"Comfortaa", cursive' },
    { name: 'JetBrains Mono (Code)', family: '"JetBrains Mono", monospace' },
  ]},
  { group: 'Luxury · Editorial Serif', items: [
    { name: 'Cinzel (Roman Dial)', family: '"Cinzel", serif' },
    { name: 'Playfair Display (Luxury)', family: '"Playfair Display", serif' },
    { name: 'Abril Fatface (Vogue)', family: '"Abril Fatface", serif' },
    { name: 'DM Serif Display', family: '"DM Serif Display", serif' },
    { name: 'Cormorant Garamond', family: '"Cormorant Garamond", serif' },
    { name: 'Special Elite (Typewriter)', family: '"Special Elite", monospace' },
  ]},
  { group: 'Script · Handwritten · Brush', items: [
    { name: 'Lobster (Bold Script)', family: '"Lobster", cursive' },
    { name: 'Pacifico (Brush Surf)', family: '"Pacifico", cursive' },
    { name: 'Permanent Marker', family: '"Permanent Marker", cursive' },
    { name: 'Dancing Script', family: '"Dancing Script", cursive' },
    { name: 'Great Vibes (Calligraphy)', family: '"Great Vibes", cursive' },
    { name: 'Satisfy (Signature)', family: '"Satisfy", cursive' },
    { name: 'Sacramento (Monoline)', family: '"Sacramento", cursive' },
    { name: 'Shadows Into Light', family: '"Shadows Into Light", cursive' },
  ]},
];

// ------------------------------------------------------------------ state
const CLOCK_W = 139, CLOCK_H = 46, DATE_W = 186, DATE_H = 20;
const DEFAULTS = {
  presetId: 'nebula',
  zoom: 1, panX: 0, panY: 0, bright: 100, sat: 100, blur: 0, dim: 0,
  color: '#ffffff',
  clock: { x: 48, y: 20 },
  clockSize: 52,
  clockSpacing: 5,
  clockFontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
  date: { x: 27, y: 75, visible: true, match: true, color: '#ffffff' },
  label: { text: '', x: 120, y: 236, size: 22, color: '#ffffff', font: 'system-ui, "Segoe UI", Roboto, sans-serif' },
  faceId: DEFAULT_ID,
  clockFont: 50,
  dateFont: 18,
  dateShortWeek: false,
  dateShortMonth: false,
  analogBase: null,          // 'faces/analog_classic.watch' | 'faces/analog_color_x.watch' | null (digital)
  customHands: false,        // true = use the hands designed here instead of the template's own
  hands: structuredClone(HAND_PRESETS.swiss),
  dial: defaultDial(),
  motion: defaultMotion(),
};
let state = structuredClone(DEFAULTS);
let source = null;          // canvas holding the (downscaled) background source
let sourceDataURL = null;   // persisted copy for uploaded / imported images
let analogTemplateBytes = null; // when set, preserves the 49 analog hand sprites in the output .watch file!

// 10 FPS moving background runtime state
let customMediaFrames = null;   // Array<HTMLCanvasElement> (240x280) from uploaded GIF/MP4/WebM
let customMediaName = '';
let sceneFrameCanvases = [];    // Cached Array<HTMLCanvasElement> (240x280) for active VIDEO_SCENES preset
let sceneCacheKey = '';
let motionFrameIdx = 0;
let motionTimer = 0;

const bg = Object.assign(document.createElement('canvas'), { width: W0, height: H0 });
const bgx = bg.getContext('2d', { willReadFrequently: true });
const screen = $('#screen'), sx = screen.getContext('2d');
const thumb = $('#pickerPreview'), tx = thumb.getContext('2d', { willReadFrequently: true });

// ------------------------------------------------------------------ utils
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => (v | 0).toString(16).padStart(2, '0')).join('');
const dateColor = () => (state.date.match ? state.color : state.date.color);

function clockDims() {
  const sz = state.clockSize || fontPx(state.clockFont) || 52;
  const kk = sz / 52;
  const sp = (state.clockSpacing ?? 5) - 5;
  return {
    w: Math.max(36, Math.round((CLOCK_W + sp * 3) * kk)),
    h: Math.max(16, Math.round(CLOCK_H * kk)),
  };
}

function toast(msg, bad = false) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = 'toast'), 3200);
}

function download(blob, name) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function fitCanvas(img, max = 1200) {
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const s = Math.min(1, max / Math.max(w, h));
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(w * s), height: Math.round(h * s) });
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

const loadImage = src => new Promise((res, rej) => {
  const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not read image')); i.src = src;
});

// ------------------------------------------------------------------ rendering
function coverRect(sw, sh, W, H, zoom = 1) {
  const s = Math.max(W / sw, H / sh) * zoom;
  return { s, w: sw * s, h: sh * s };
}

function getActiveMediaDimensions() {
  if (isVideo10fpsActive()) {
    const frames = ensureSceneFrames();
    const f0 = frames[0];
    if (f0) return { width: f0.width, height: f0.height };
  }
  if (source) return { width: source.width, height: source.height };
  return { width: W0, height: H0 };
}

function clampPan() {
  const dims = getActiveMediaDimensions();
  const { w, h } = coverRect(dims.width, dims.height, W0, H0, state.zoom);
  const mx = Math.max(0, (w - W0) / 2), my = Math.max(0, (h - H0) / 2);
  state.panX = clamp(state.panX, -mx, mx);
  state.panY = clamp(state.panY, -my, my);
}

function labelBox() {
  const L = state.label;
  if (!L.text) return null;
  bgx.font = `700 ${L.size}px ${L.font}`;
  const w = bgx.measureText(L.text).width;
  return { x: L.x - w / 2 - 4, y: L.y - L.size / 2 - 4, w: w + 8, h: L.size + 8 };
}

function rgbaToCanvas(rgba, w = W0, h = H0) {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength), w, h), 0, 0);
  return c;
}

function isVideo10fpsActive() {
  return !analogTemplateBytes && !!state.motion?.enabled;
}

function ensureSceneFrames() {
  if (state.motion?.scene === 'custom_media' && customMediaFrames?.length) {
    return customMediaFrames;
  }
  const sceneKey = VIDEO_SCENES[state.motion?.scene] ? state.motion.scene : 'koi_sphere';
  const total = clamp(state.motion?.frameCount || 16, 4, 24);
  const accentColor = state.motion?.accentColor || VIDEO_SCENES[sceneKey].accent;
  const secondaryColor = state.motion?.secondaryColor || VIDEO_SCENES[sceneKey].secondary;
  const key = `${sceneKey}:${total}:${accentColor}:${secondaryColor}`;
  if (key !== sceneCacheKey || sceneFrameCanvases.length !== total) {
    sceneCacheKey = key;
    sceneFrameCanvases = [];
    for (let i = 0; i < total; i++) {
      const rgba = renderSceneRgba(sceneKey, i, total, { accentColor, secondaryColor });
      sceneFrameCanvases.push(rgbaToCanvas(rgba));
    }
    renderFilmstrip();
  }
  return sceneFrameCanvases;
}

function renderFilmstrip() {
  const el = $('#motionFilmstrip');
  if (!el) return;
  const frames = isVideo10fpsActive() ? ensureSceneFrames() : [];
  el.innerHTML = '';
  if (!frames.length) return;
  frames.forEach((fc, idx) => {
    const item = Object.assign(document.createElement('div'), {
      className: 'filmstrip-frame' + (idx === (motionFrameIdx % frames.length) ? ' active' : ''),
      title: `Frame ${idx + 1} / ${frames.length} (click to inspect)`,
    });
    const c = Object.assign(document.createElement('canvas'), { width: 48, height: 56 });
    c.getContext('2d').drawImage(fc, 0, 0, 48, 56);
    const num = Object.assign(document.createElement('span'), { textContent: `#${idx + 1}` });
    item.append(c, num);
    item.onclick = () => {
      motionFrameIdx = idx;
      state.motion.playing = false;
      syncMotionTimer();
      refreshClockUI();
      invalidate();
    };
    el.append(item);
  });
}

function getMotionConvertOpts() {
  return {
    scene: state.motion?.scene || 'koi_sphere',
    resolution: state.motion?.resolution || '80x80',
    pixelSize: clamp(+(state.motion?.pixelSize || 1), 1, 4),
    accentColor: state.motion?.accentColor || '#38bdf8',
    secondaryColor: state.motion?.secondaryColor || '#e0f2fe',
  };
}

function syncMotionTimer() {
  if (motionTimer) { clearInterval(motionTimer); motionTimer = 0; }
  if (!isVideo10fpsActive() || state.motion?.playing === false) return;
  const fps = clamp(state.motion?.fps || 4, 1, 15);
  motionTimer = setInterval(() => {
    if (!isVideo10fpsActive() || state.motion?.playing === false) return;
    const frames = ensureSceneFrames();
    if (!frames.length) return;
    motionFrameIdx = (motionFrameIdx + 1) % frames.length;
    const strip = $('#motionFilmstrip');
    if (strip) {
      const items = strip.children;
      for (let i = 0; i < items.length; i++) items[i].classList.toggle('active', i === motionFrameIdx);
    }
    renderBg();
    renderScreen();
  }, Math.round(1000 / fps));
}

function renderBg({ baseOnly = false, customFrameCanvas = null, rawFrame = false } = {}) {
  bgx.save();
  bgx.fillStyle = '#000'; bgx.fillRect(0, 0, W0, H0);
  if (isVideo10fpsActive()) {
    let frameCanvas = customFrameCanvas;
    if (!frameCanvas) {
      if (baseOnly) {
        if (state.motion?.scene === 'custom_media' && customMediaFrames?.length) {
          frameCanvas = customMediaFrames[0];
        } else {
          const sceneKey = VIDEO_SCENES[state.motion?.scene] ? state.motion.scene : 'koi_sphere';
          const total = clamp(state.motion?.frameCount || 16, 4, 24);
          const accentColor = state.motion?.accentColor || VIDEO_SCENES[sceneKey].accent;
          const secondaryColor = state.motion?.secondaryColor || VIDEO_SCENES[sceneKey].secondary;
          frameCanvas = rgbaToCanvas(renderSceneRgba(sceneKey, 0, total, { accentColor, secondaryColor, backgroundOnly: true }));
        }
      } else {
        const frames = ensureSceneFrames();
        frameCanvas = frames[motionFrameIdx % frames.length];
      }
    }
    if (frameCanvas) {
      clampPan();
      const { w, h } = coverRect(frameCanvas.width, frameCanvas.height, W0, H0, state.zoom);
      const dx = (W0 - w) / 2 + state.panX, dy = (H0 - h) / 2 + state.panY;
      bgx.filter = `brightness(${state.bright}%) saturate(${state.sat}%)` + (state.blur ? ` blur(${state.blur}px)` : '');
      const pad = state.blur * 3;
      bgx.drawImage(frameCanvas, dx - pad, dy - pad, w + 2 * pad, h + 2 * pad);
      bgx.filter = 'none';
    }
  } else if (source) {
    clampPan();
    const { w, h } = coverRect(source.width, source.height, W0, H0, state.zoom);
    const dx = (W0 - w) / 2 + state.panX, dy = (H0 - h) / 2 + state.panY;
    bgx.filter = `brightness(${state.bright}%) saturate(${state.sat}%)` + (state.blur ? ` blur(${state.blur}px)` : '');
    const pad = state.blur * 3; // avoid dark blurred edges
    bgx.drawImage(source, dx - pad, dy - pad, w + 2 * pad, h + 2 * pad);
    bgx.filter = 'none';
  }
  if (state.dim > 0) { bgx.fillStyle = `rgba(0,0,0,${state.dim})`; bgx.fillRect(0, 0, W0, H0); }
  if (isVideo10fpsActive() && !baseOnly && !rawFrame && state.motion?.previewLowRes !== false) {
    const cur = bgx.getImageData(0, 0, W0, H0);
    let baseRgba;
    if (state.motion?.scene === 'custom_media') {
      baseRgba = computeCleanBaseRgba([cur.data]);
    } else {
      const sceneKey = VIDEO_SCENES[state.motion?.scene] ? state.motion.scene : 'koi_sphere';
      const accentColor = state.motion?.accentColor || VIDEO_SCENES[sceneKey].accent;
      const secondaryColor = state.motion?.secondaryColor || VIDEO_SCENES[sceneKey].secondary;
      baseRgba = renderSceneRgba(sceneKey, 0, 16, { accentColor, secondaryColor, backgroundOnly: true });
    }
    const previewRgba = renderLowResPreviewRgba(cur.data, baseRgba, getMotionConvertOpts());
    bgx.putImageData(new ImageData(new Uint8ClampedArray(previewRgba.buffer, previewRgba.byteOffset, previewRgba.byteLength), W0, H0), 0, 0);
  }
  if (analogTemplateBytes && state.dial?.style && state.dial.style !== 'none') {
    drawDialOverlay(bgx, state.dial, 120, 140);
  }
  const L = state.label;
  if (L.text) {
    bgx.font = `700 ${L.size}px ${L.font}`;
    bgx.textAlign = 'center'; bgx.textBaseline = 'middle';
    bgx.shadowColor = 'rgba(0,0,0,.45)'; bgx.shadowBlur = 4; bgx.shadowOffsetY = 1;
    bgx.fillStyle = L.color; bgx.fillText(L.text, L.x, L.y);
  }
  bgx.restore();
}

// Watch font IDs. The watch draws text with its own fonts; the file only picks an ID.
// Sizes below are what we've seen (50 = big clock digits, 16/18 = date text). Others are unknown until tried.
export const KNOWN_FONTS = { 50: { label: 'Big digits', px: 52 }, 18: { label: 'Small', px: 20 }, 16: { label: 'Small (date)', px: 18 } };
const fontPx = id => KNOWN_FONTS[id]?.px ?? 52;

function dateText(now) {
  const wk = now.toLocaleDateString('en-US', { weekday: state.dateShortWeek ? 'short' : 'long' });
  const mo = now.toLocaleDateString('en-US', { month: state.dateShortMonth ? 'short' : 'long' });
  return `${wk}, ${mo} ${now.getDate()}`;
}

// Approximation of the watch's own digits and date.
// ---- analog hands preview: the same sprites the watch will get (custom) or the template's own (original)
const handCache = new Map();
let originalSprites = null;            // Map id -> decoded sprite of the loaded template
function putSprite(s) {
  const c = Object.assign(document.createElement('canvas'), { width: s.w, height: s.h });
  c.getContext('2d').putImageData(new ImageData(spriteToRGBA(s), s.w, s.h), 0, 0);
  return c;
}
function handCanvas(kind, angle) {
  const custom = state.customHands;
  const key = custom ? kind + JSON.stringify(state.hands[kind]) + '@' + angle : 'orig:' + state.analogBase + kind + '@' + angle;
  let c = handCache.get(key);
  if (c !== undefined) return c;
  if (custom) {
    c = putSprite(kind === 'cap' ? capSprite(state.hands) : drawHand(kind, state.hands, angle));
  } else if (originalSprites) {
    const ids = originalSprites.ids;
    if (kind === 'cap') c = putSprite(originalSprites.map.get(ids.cap[0]));
    else {
      const quad = Math.floor(angle / 90) % 4, idx = Math.max(0, Math.min(15, Math.round((angle - quad * 90) / 6)));
      const spr = putSprite(originalSprites.map.get(ids[kind][idx]));
      c = Object.assign(document.createElement('canvas'), { width: 240, height: 280 });
      const g = c.getContext('2d'); g.translate(120, 140); g.rotate(quad * Math.PI / 2); g.drawImage(spr, -120, -140);
    }
  } else c = null;
  if (handCache.size > 400) handCache.clear();
  handCache.set(key, c);
  return c;
}
function loadOriginalSprites(bytes) {
  try {
    const w = parseWatch(bytes);
    originalSprites = { ids: analogIds(w), map: new Map(w.images.filter(i => i.z === 1).map(i => [i.id, decodeSprite(i.data)])) };
  } catch { originalSprites = null; }
  handCache.clear();
}
function drawOverlay(ctx, now) {
  const { x, y } = state.clock;
  const hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
  ctx.save();
  ctx.fillStyle = state.color;
  ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  const sz = state.clockSize || fontPx(state.clockFont) || 52;
  const k = sz / 52;
  const sp = (state.clockSpacing ?? 5) - 5;
  const fam = state.clockFontFamily || 'system-ui, "Segoe UI", Roboto, sans-serif';
  ctx.font = `700 ${Math.round(sz)}px ${fam}`;
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 2;
  const digit = (ch, dx) => ctx.fillText(ch, x + (dx + 14) * k, y - 2 * k, 32 * k);
  if (analogTemplateBytes) {
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    if (state.analogBase === ANALOG_BASES.analog_classic) {
      // analog_classic.watch has firmware text_date (y=90) and text_week (y=170)
      ctx.font = '700 16px system-ui, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#fa644b';
      ctx.fillText(String(now.getDate()).padStart(2, '0'), 120, 90);
      ctx.fillStyle = '#999999';
      ctx.fillText(now.toLocaleDateString('en-US', { weekday: 'long' }), 120, 170);
    }
    const sec = now.getSeconds(), m = now.getMinutes(), h = now.getHours() % 12;
    const q = a => Math.floor(a / 6) * 6;
    for (const [kind, ang] of [['hour', q((h * 60 + m) * 0.5)], ['minute', m * 6], ['second', sec * 6]]) {
      const c = handCanvas(kind, ang); if (c) ctx.drawImage(c, 0, 0);
    }
    const cap = handCanvas('cap', 0); if (cap) ctx.drawImage(cap, 0, 0);
    ctx.restore();
    return;
  }
  digit(hh[0], 0); digit(hh[1], 33 + sp);
  digit(mm[0], 77 + sp * 2); digit(mm[1], 110 + sp * 3);
  ctx.fillText(':', x + (69.5 + sp * 1.5) * k, y - 5 * k);
  if (state.date.visible) {
    const d = state.date;
    ctx.font = `600 ${fontPx(state.dateFont) <= 24 ? fontPx(state.dateFont) - 2 : 16}px system-ui, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = dateColor();
    ctx.fillText(dateText(now), d.x + DATE_W / 2, d.y + 1, DATE_W);
  }
  ctx.restore();
}

let hover = null, dragging = null;

function boxes() {
  const { w: cw, h: ch } = clockDims();
  const out = [{ kind: 'clock', x: state.clock.x - 4, y: state.clock.y - 4, w: cw + 8, h: ch + 8 }];
  if (state.date.visible) out.push({ kind: 'date', x: state.date.x, y: state.date.y - 2, w: DATE_W, h: DATE_H + 4 });
  const lb = labelBox(); if (lb) out.push({ kind: 'label', ...lb });
  return out;
}

function renderScreen() {
  const k = screen.width / W0;
  sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
  sx.drawImage(bg, 0, 0, screen.width, screen.height);
  sx.save(); sx.scale(k, k);
  drawOverlay(sx, new Date());
  const active = dragging?.kind || hover;
  if (active && active !== 'bg') {
    const b = boxes().find(b => b.kind === active);
    if (b) {
      sx.setLineDash([3, 3]); sx.lineWidth = 1 / k * 2;
      sx.strokeStyle = 'rgba(255,255,255,.75)';
      sx.strokeRect(b.x, b.y, b.w, b.h);
    }
  }
  sx.restore();
}

function renderThumb(time = new Date(2026, 0, 1, 10, 8)) {
  const s = Math.max(W1 / W0, H1 / H0);
  const ox = (W1 - W0 * s) / 2, oy = (H1 - H0 * s) / 2;
  tx.save();
  tx.imageSmoothingQuality = 'high';
  tx.drawImage(bg, ox, oy, W0 * s, H0 * s);
  tx.translate(ox, oy); tx.scale(s, s);
  drawOverlay(tx, time);
  tx.restore();
}

let dirtyBg = true, raf = 0;
function invalidate(bgToo = true) {
  dirtyBg ||= bgToo;
  if (!raf) raf = requestAnimationFrame(() => {
    raf = 0;
    if (dirtyBg) { renderBg(); dirtyBg = false; }
    renderScreen(); renderThumb();
    syncInputs();
    save();
  });
}
setInterval(() => invalidate(false), 1000);

// ------------------------------------------------------------------ build file
function buildLayout() {
  const lay = defaultLayout();
  const c = lay.WATCH.text_clock;
  const [r, g, b] = hexToRgb(state.color);
  c.text_id = state.clockFont;
  for (const k of 'hmp') { c['color_r_' + k] = r; c['color_g_' + k] = g; c['color_b_' + k] = b; }
  const { x, y } = state.clock;
  const sz = state.clockSize || fontPx(state.clockFont) || 52;
  const k = sz / 52;
  const sp = state.clockSpacing ?? 5;
  const dSp = sp - 5;
  c.x_spacing_h = sp;
  c.x_spacing_m = sp;
  c.x_hour = x; c.y_hour = y;
  c.x_min = x + Math.round((77 + dSp * 2) * k); c.y_min = y;
  c.x_point = x + Math.round((62 + dSp * 1.5) * k); c.y_point = y - Math.round(3 * k);
  const d = lay.WATCH.text_month_week;
  const [dr, dg, db] = hexToRgb(dateColor());
  d.visible = state.date.visible ? 1 : 0;
  d.x = state.date.x; d.y = state.date.y;
  d.color_r = dr; d.color_g = dg; d.color_b = db;
  d.text_id = state.dateFont; d.week_abbreviation = state.dateShortWeek ? 1 : 0; d.month_abbreviation = state.dateShortMonth ? 1 : 0;
  if (!analogTemplateBytes && state.motion?.enabled) {
    // Keep HEAD.WATCH_NUM.num = 5 so the firmware parses text_clock & text_month_week!
    // Place image_pointer_clock before text_clock so animation sprites draw underneath the digital clock & date.
    lay.WATCH = {
      image: lay.WATCH.image,
      image_pointer_clock: { visible: 1, hour_id_start_time: 34, min_id_start_time: 2, sec_id_start_time: 18 },
      text_clock: c,
      text_month_week: d,
    };
  }
  return lay;
}

function buildFile() {
  if (dirtyBg) { renderBg(); dirtyBg = false; }
  renderThumb();
  const pvPx = rgba565be(tx.getImageData(0, 0, W1, H1).data);
  if (analogTemplateBytes) {
    const bgPx = rgba565be(bgx.getImageData(0, 0, W0, H0).data);
    const f = replaceWatchBackground(analogTemplateBytes, bgPx, pvPx);
    return state.customHands ? buildHandsFace(f, state.hands) : f;
  }
  if (state.motion?.enabled) {
    const mOpts = getMotionConvertOpts();
    const sourceFrames = (state.motion.scene === 'custom_media' && customMediaFrames?.length)
      ? customMediaFrames
      : ensureSceneFrames();
    const framesRgba = [];
    for (let k = 0; k < 16; k++) {
      const fc = sourceFrames[Math.min(sourceFrames.length - 1, Math.floor((k / 16) * sourceFrames.length))];
      renderBg({ customFrameCanvas: fc, rawFrame: true });
      framesRgba.push(new Uint8ClampedArray(bgx.getImageData(0, 0, W0, H0).data));
    }
    let baseRgba;
    if (state.motion.scene === 'custom_media' && customMediaFrames?.length) {
      baseRgba = computeCleanBaseRgba(framesRgba);
    } else {
      renderBg({ baseOnly: true, rawFrame: true });
      baseRgba = new Uint8ClampedArray(bgx.getImageData(0, 0, W0, H0).data);
    }
    renderBg();
    const bgPx = rgba565be(baseRgba);
    return assemble(
      cjson(buildLayout()),
      bgPx,
      pvPx,
      buildVideoWatchSprites(framesRgba, baseRgba, mOpts)
    );
  }
  const bgPx = rgba565be(bgx.getImageData(0, 0, W0, H0).data);
  return assemble(cjson(buildLayout()), bgPx, pvPx);
}

// ------------------------------------------------------------------ sources
let lastUploadedMediaFile = null;

async function loadAnimatedMediaFile(file, { keepAdjustments = false } = {}) {
  try {
    lastUploadedMediaFile = file;
    const targetFrames = clamp(state.motion?.frameCount || 16, 4, 24);
    const targetFps = clamp(state.motion?.fps || 4, 1, 15);
    const spec = resolveLowResSpec(getMotionConvertOpts());
    toast(`Converting ${file.name} → ${spec.preset.shortLabel} @ ${targetFps} FPS…`);
    const res = await extractMediaFrames(file, { targetFrames, targetFps });
    if (!res?.frames?.length) throw new Error('Could not extract frames from file');
    customMediaFrames = res.frames.map(f => (f.canvas ? f.canvas : f));
    customMediaName = file.name;
    // Ensure we exit analog mode so the digital clock is shown and exported with WATCH_NUM = 5
    analogTemplateBytes = null;
    originalSprites = null;
    state.analogBase = null;
    state.motion.enabled = true;
    state.motion.mode = 'video10fps';
    state.motion.scene = 'custom_media';
    state.motion.playing = true;
    motionFrameIdx = 0;
    const savedCrop = keepAdjustments ? { zoom: state.zoom, panX: state.panX, panY: state.panY } : null;
    setSource(customMediaFrames[0], null, true);
    if (savedCrop) Object.assign(state, savedCrop);
    renderBg({ customFrameCanvas: customMediaFrames[0], rawFrame: true });
    const f0 = new Uint8Array(bgx.getImageData(0, 0, W0, H0).data);
    const midIdx = Math.floor(customMediaFrames.length / 2);
    renderBg({ customFrameCanvas: customMediaFrames[midIdx], rawFrame: true });
    const fMid = new Uint8Array(bgx.getImageData(0, 0, W0, H0).data);
    const info = analyzeGifFrames([f0, fMid], f0);
    state.motion.accentColor = info.accentColor;
    state.motion.secondaryColor = info.secondaryColor;
    handCache.clear();
    bindMotionUI.show?.();
    renderFilmstrip();
    syncMotionTimer();
    refreshClockUI();
    invalidate();
    toast(`🎬 Converted ${customMediaFrames.length} low-res frames (${spec.preset.shortLabel} · ${targetFps} FPS) from ${file.name}`);
  } catch (e) {
    toast('Could not decode animated file: ' + e.message, true);
  }
}

async function useImageFile(file) {
  if (!file) return;
  const isAnim = file.type === 'image/gif' || file.type.startsWith('video/') || /\.(gif|mp4|webm|mov)$/i.test(file.name || '');
  if (isAnim) return loadAnimatedMediaFile(file);
  if (!file.type.startsWith('image/')) return toast('Please choose an image, GIF, or video file', true);
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    setSource(fitCanvas(img), null, true);
    toast('Photo loaded. Drag to position it.');
  } catch (e) { toast(e.message, true); } finally { URL.revokeObjectURL(url); }
}

function setSource(canvas, presetId, persist) {
  source = canvas;
  state.presetId = presetId;
  state.zoom = 1; state.panX = 0; state.panY = 0;
  sourceDataURL = persist ? fitCanvas(canvas, 1000).toDataURL('image/jpeg', 0.9) : null;
  $$('.preset').forEach(p => p.classList.toggle('on', p.dataset.id === presetId));
  invalidate();
}

function usePreset(id, applyColor = true) {
  const p = PRESETS.find(p => p.id === id) || PRESETS[0];
  setSource(p.draw(), p.id, false);
  if (applyColor) state.color = p.color;
  invalidate();
}

// ------------------------------------------------------------------ persistence
let savedState = '', savedSrc;
function save() {
  try {
    const s = JSON.stringify(state);
    if (s !== savedState) { localStorage.setItem('nfs.state', s); savedState = s; }
    if (sourceDataURL !== savedSrc) {
      if (sourceDataURL) localStorage.setItem('nfs.src', sourceDataURL); else localStorage.removeItem('nfs.src');
      savedSrc = sourceDataURL;
    }
  } catch { /* quota: ignore */ }
}

async function restore() {
  try {
    const s = JSON.parse(localStorage.getItem('nfs.state') || 'null');
    if (s) {
      const defM = defaultMotion();
      state = {
        ...structuredClone(DEFAULTS),
        ...s,
        clock: { ...DEFAULTS.clock, ...s.clock },
        date: { ...DEFAULTS.date, ...s.date },
        label: { ...DEFAULTS.label, ...s.label },
        dial: { ...defaultDial(), ...(s.dial || {}) },
        motion: s.motion ? {
          ...defM,
          ...s.motion,
          pixelSize: (!s.motion.resolution || s.motion.resolution === '80x80') ? 1 : (s.motion.pixelSize || 1),
          mode: 'video10fps',
        } : defM,
      };
    }
    const src = localStorage.getItem('nfs.src');
    const keep = { zoom: state.zoom, panX: state.panX, panY: state.panY };
    if (src) { setSource(fitCanvas(await loadImage(src)), null, true); }
    else usePreset(state.presetId || 'nebula', !s);
    Object.assign(state, keep);
    if (state.analogBase) {
      const mode = Object.keys(ANALOG_BASES).find(k => ANALOG_BASES[k] === state.analogBase);
      if (mode) { await setClockMode(mode, { keep: true }); bindHandsUI.show?.(); bindDialUI.show?.(); }
    } else if (state.motion?.enabled) {
      if (state.motion.scene === 'custom_media' && !customMediaFrames?.length) {
        state.motion.scene = 'koi_sphere';
      }
      bindMotionUI.show?.();
      syncMotionTimer();
      refreshClockUI();
    }
  } catch { usePreset('nebula'); }
  invalidate();
}

// ------------------------------------------------------------------ inputs
function populateFontCatalog() {
  const fillSelect = sel => {
    sel.innerHTML = '';
    for (const grp of FONT_CATALOG) {
      const og = Object.assign(document.createElement('optgroup'), { label: grp.group });
      for (const item of grp.items) {
        const opt = Object.assign(document.createElement('option'), { value: item.family, textContent: item.name });
        opt.style.fontFamily = item.family;
        og.append(opt);
      }
      sel.append(og);
    }
  };
  fillSelect($('#clockFontStyle'));
  fillSelect($('#labelFont'));

  const grid = $('#labelFontGrid');
  grid.innerHTML = '';
  for (const grp of FONT_CATALOG) {
    for (const item of grp.items) {
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: item.name.split(' (')[0], title: `${item.name} — Click for Your Text (Shift+Click for Clock)` });
      b.style.fontFamily = item.family;
      b.dataset.family = item.family;
      b.onclick = e => {
        if (e.shiftKey) {
          state.clockFontFamily = item.family;
          toast(`Clock font: ${item.name}`);
          invalidate(false);
        } else {
          state.label.font = item.family;
          if (!state.label.text) state.label.text = 'Noise ✨';
          invalidate();
        }
      };
      grid.append(b);
    }
  }
}

async function loadCustomFontFile(file, target) {
  if (!file) return;
  try {
    const clean = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'CustomFont';
    const familyName = `Custom_${clean}_${Date.now().toString(36).slice(-4)}`;
    const buf = await file.arrayBuffer();
    const ff = new FontFace(familyName, buf);
    await ff.load();
    document.fonts.add(ff);
    const cssFamily = `"${familyName}", sans-serif`;
    FONT_CATALOG[0].items.unshift({ name: `★ ${clean} (Uploaded)`, family: cssFamily });
    populateFontCatalog();
    if (target === 'clock') {
      state.clockFontFamily = cssFamily;
      invalidate(false);
    } else {
      state.label.font = cssFamily;
      if (!state.label.text) state.label.text = clean;
      invalidate();
    }
    toast(`Loaded font: ${clean}`);
  } catch (err) {
    toast('Could not load font file: ' + err.message, true);
  }
}

function syncInputs() {
  $$('.sliders input').forEach(inp => {
    const v = state[inp.dataset.key];
    if (document.activeElement !== inp) inp.value = v;
    const out = inp.nextElementSibling;
    out.textContent = inp.dataset.key === 'zoom' ? v.toFixed(2) + '×' : inp.dataset.key === 'dim' ? Math.round(v * 100) + '%' : inp.dataset.key === 'blur' ? v + 'px' : v + '%';
  });
  const set = (sel, v, prop = 'value') => { const el = $(sel); if (el && document.activeElement !== el) el[prop] = v; };
  set('#clockColor', state.color); set('#clockX', state.clock.x); set('#clockY', state.clock.y);
  set('#clockSize', state.clockSize || 52);
  set('#clockSpacing', state.clockSpacing ?? 5);
  set('#clockFontStyle', state.clockFontFamily || DEFAULTS.clockFontFamily);
  if ($('#clockSizeOut')) $('#clockSizeOut').textContent = (state.clockSize || 52) + 'px';
  set('#dateVisible', state.date.visible, 'checked'); set('#dateMatch', state.date.match, 'checked');
  set('#dateColor', dateColor()); $('#dateColor').disabled = state.date.match;
  set('#dateX', state.date.x); set('#dateY', state.date.y);
  set('#labelText', state.label.text); set('#labelColor', state.label.color);
  set('#labelSize', state.label.size); set('#labelFont', state.label.font);
  if ($('#labelSizeOut')) $('#labelSizeOut').textContent = state.label.size + 'px';
  $$('#labelFontGrid button').forEach(b => b.classList.toggle('on', b.dataset.family === state.label.font));
  set('#faceId', state.faceId); set('#clockFont', state.clockFont); set('#dateFont', state.dateFont);
  set('#dateShortWeek', state.dateShortWeek, 'checked'); set('#dateShortMonth', state.dateShortMonth, 'checked');
  const fname = id => KNOWN_FONTS[id] ? `${id} · ${KNOWN_FONTS[id].label}` : `${id} · untested`;
  $('#clockFontOut').textContent = fname(state.clockFont);
  $('#dateFontOut').textContent = fname(state.dateFont);
  $$('#fontPicks button').forEach(b => b.classList.toggle('on', +b.dataset.f === state.clockFont));
  $('#fontNote').textContent = KNOWN_FONTS[state.clockFont]
    ? 'Adjust Clock size, Spacing, or Font style above, or pick a Watch font ID (50 = Large, 18 = Medium, 16 = Small).'
    : `Font ${state.clockFont} hasn't been tried yet. Send it to see what the watch does (it may be another size or style, or fall back to the default).`;
  $$('#swatches button').forEach(b => b.classList.toggle('on', b.dataset.c === state.color));
}

function bindInputs() {
  populateFontCatalog();
  $$('.sliders input').forEach(inp => inp.addEventListener('input', () => { state[inp.dataset.key] = +inp.value; invalidate(); }));
  $('#resetAdjust').onclick = () => { Object.assign(state, { zoom: 1, panX: 0, panY: 0, bright: 100, sat: 100, blur: 0, dim: 0 }); invalidate(); };
  if ($('#centerBg')) {
    $('#centerBg').onclick = () => { state.panX = 0; state.panY = 0; invalidate(); toast('Background centred'); };
  }

  $('#clockColor').addEventListener('input', e => { state.color = e.target.value; invalidate(false); });
  $('#clockFontStyle').onchange = e => { state.clockFontFamily = e.target.value; invalidate(false); };
  $('#clockFontFile').onchange = e => { loadCustomFontFile(e.target.files[0], 'clock'); e.target.value = ''; };
  $('#clockSize').addEventListener('input', e => {
    const sz = +e.target.value;
    state.clockSize = sz;
    state.clockFont = sz >= 36 ? 50 : sz >= 22 ? 18 : 16;
    const { w: cw, h: ch } = clockDims();
    state.clock.x = clamp(state.clock.x, 0, Math.max(0, W0 - cw));
    state.clock.y = clamp(state.clock.y, 2, Math.max(2, H0 - ch));
    invalidate(false);
  });
  const sw = ['#ffffff', '#fef3c7', '#fde047', '#fb923c', '#f43f5e', '#f0abfc', '#a78bfa', '#60a5fa', '#22d3ee', '#34d399', '#a3e635', '#111111'];
  $('#swatches').append(...sw.map(c => {
    const b = Object.assign(document.createElement('button'), { title: c });
    b.style.background = c; b.dataset.c = c;
    b.onclick = () => { state.color = c; invalidate(false); };
    return b;
  }));
  const num = (sel, fn) => $(sel).addEventListener('input', e => { if (e.target.value !== '') { fn(+e.target.value); invalidate(false); } });
  num('#clockX', v => (state.clock.x = clamp(Math.round(v), 0, Math.max(0, W0 - clockDims().w))));
  num('#clockY', v => (state.clock.y = clamp(Math.round(v), 2, Math.max(2, H0 - clockDims().h))));
  num('#clockSpacing', v => (state.clockSpacing = clamp(Math.round(v), 0, 30)));
  num('#dateX', v => (state.date.x = clamp(Math.round(v), 0, W0 - DATE_W)));
  num('#dateY', v => (state.date.y = clamp(Math.round(v), 0, H0 - DATE_H)));

  $('#centerClock').onclick = () => {
    const { w: cw } = clockDims();
    state.clock.x = Math.round((W0 - cw) / 2);
    invalidate(false);
    toast('Clock centred horizontally');
  };
  if ($('#centerClockHV')) {
    $('#centerClockHV').onclick = () => {
      const { w: cw, h: ch } = clockDims();
      state.clock.x = Math.round((W0 - cw) / 2);
      state.clock.y = Math.round((H0 - ch) / 2);
      invalidate(false);
      toast('Clock centred on screen');
    };
  }
  if ($('#centerDate')) {
    $('#centerDate').onclick = () => {
      state.date.x = Math.round((W0 - DATE_W) / 2);
      invalidate(false);
      toast('Date centred horizontally');
    };
  }
  if ($('#centerLabel')) {
    $('#centerLabel').onclick = () => {
      state.label.x = Math.round(W0 / 2);
      invalidate();
      toast('Text centred horizontally');
    };
  }

  $('#dateVisible').onchange = e => { state.date.visible = e.target.checked; invalidate(false); };
  $('#dateMatch').onchange = e => { state.date.match = e.target.checked; if (!e.target.checked) state.date.color = state.color; invalidate(false); };
  $('#dateColor').addEventListener('input', e => { state.date.color = e.target.value; invalidate(false); });

  $('#labelText').addEventListener('input', e => { state.label.text = e.target.value; invalidate(); });
  $('#labelColor').addEventListener('input', e => { state.label.color = e.target.value; invalidate(); });
  $('#labelSize').addEventListener('input', e => { state.label.size = +e.target.value; invalidate(); });
  $('#labelFont').onchange = e => { state.label.font = e.target.value; invalidate(); };
  $('#labelFontFile').onchange = e => { loadCustomFontFile(e.target.files[0], 'label'); e.target.value = ''; };
  $('#faceId').addEventListener('input', e => { state.faceId = clamp(+e.target.value || DEFAULT_ID, 1, 65535); save(); });

  // background upload + drag & drop
  $('#imgInput').onchange = e => useImageFile(e.target.files[0]);
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => useImageFile(e.dataTransfer.files[0]));
  document.addEventListener('paste', e => { const f = [...(e.clipboardData?.files || [])][0]; if (f) useImageFile(f); });

  // preset category filters + 26 watchface presets
  const catWrap = $('#presetCats');
  if (catWrap && PRESET_CATEGORIES) {
    catWrap.append(...PRESET_CATEGORIES.map((cat, idx) => {
      const b = Object.assign(document.createElement('button'), {
        type: 'button',
        className: idx === 0 ? 'on' : '',
        textContent: cat.id === 'all' ? `${cat.label} (${PRESETS.length})` : cat.label,
      });
      b.dataset.cat = cat.id;
      b.onclick = () => {
        $$('#presetCats button').forEach(x => x.classList.toggle('on', x === b));
        $$('#presets .preset').forEach(p => {
          p.hidden = cat.id !== 'all' && p.dataset.cat !== cat.id;
        });
      };
      return b;
    }));
  }

  $('#presets').append(...PRESETS.map(p => {
    const b = Object.assign(document.createElement('button'), { className: 'preset', title: p.name });
    b.dataset.id = p.id;
    b.dataset.cat = p.cat || 'scenic';
    const img = new Image(); img.alt = ''; img.src = p.draw().toDataURL('image/jpeg', 0.75);
    const sp = document.createElement('span'); sp.textContent = p.name;
    b.append(img, sp);
    b.onclick = () => usePreset(p.id);
    return b;
  }));

  // tabs
  $$('.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
  $('#gotoSend').onclick = () => { showTab('send'); if (innerWidth < 860) $('.panel').scrollIntoView({ behavior: 'smooth' }); };
}

function showTab(name) {
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
}

// ------------------------------------------------------------------ direct manipulation on the watch screen
function bindCanvas() {
  const pts = new Map();
  let pinch = null;
  const toWatch = e => {
    const r = screen.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W0, y: (e.clientY - r.top) / r.height * H0 };
  };
  const hit = p => [...boxes()].reverse().find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h)?.kind || 'bg';

  screen.addEventListener('pointerdown', e => {
    screen.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, toWatch(e));
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: state.zoom };
      dragging = null; return;
    }
    const p = toWatch(e);
    dragging = { kind: hit(p), last: p };
    screen.classList.add('dragging');
  });
  screen.addEventListener('pointermove', e => {
    const p = toWatch(e);
    if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()];
      state.zoom = clamp(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, 1, 4);
      return invalidate();
    }
    if (!dragging) {
      const h = hit(p); if (h !== hover) { hover = h; invalidate(false); }
      return;
    }
    const dx = p.x - dragging.last.x, dy = p.y - dragging.last.y;
    dragging.last = p;
    const k = dragging.kind;
    if (k === 'bg') { state.panX += dx; state.panY += dy; invalidate(); }
    else if (k === 'clock') {
      dragging.fx = (dragging.fx ?? state.clock.x) + dx;
      dragging.fy = (dragging.fy ?? state.clock.y) + dy;
      const { w: cw, h: ch } = clockDims();
      state.clock.x = clamp(Math.round(dragging.fx), 0, Math.max(0, W0 - cw));
      state.clock.y = clamp(Math.round(dragging.fy), 2, Math.max(2, H0 - ch));
      invalidate(false);
    } else if (k === 'date') {
      dragging.fx = (dragging.fx ?? state.date.x) + dx; dragging.fy = (dragging.fy ?? state.date.y) + dy;
      state.date.x = clamp(Math.round(dragging.fx), 0, W0 - DATE_W);
      state.date.y = clamp(Math.round(dragging.fy), 0, H0 - DATE_H);
      invalidate(false);
    } else if (k === 'label') {
      state.label.x = clamp(state.label.x + dx, 0, W0); state.label.y = clamp(state.label.y + dy, 0, H0);
      invalidate();
    }
  });
  const end = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (pts.size === 0) { dragging = null; screen.classList.remove('dragging'); invalidate(false); }
  };
  screen.addEventListener('pointerup', end);
  screen.addEventListener('pointercancel', end);
  screen.addEventListener('pointerleave', () => { if (!dragging) { hover = null; invalidate(false); } });
  screen.addEventListener('wheel', e => {
    e.preventDefault();
    state.zoom = clamp(state.zoom * Math.exp(-e.deltaY * 0.0015), 1, 4);
    invalidate();
  }, { passive: false });
}

// ------------------------------------------------------------------ files
function bindFiles() {
  const dlWatch = () => {
    const data = buildFile();
    download(new Blob([data], { type: 'application/octet-stream' }), 'myface.watch');
    toast(`myface.watch saved (${(data.length / 1024).toFixed(0)} KB)`);
  };
  $('#downloadBtn').onclick = dlWatch;
  $('#dlWatch').onclick = dlWatch;
  $('#dlPng').onclick = () => { renderBg(); bg.toBlob(b => download(b, 'face_background.png')); };
  $('#dlThumb').onclick = () => { renderThumb(); thumb.toBlob(b => download(b, 'face_thumbnail.png')); };
  $('#dlProject').onclick = () => {
    const img = source ? fitCanvas(source, 1200).toDataURL('image/jpeg', 0.92) : null;
    download(new Blob([JSON.stringify({ app: 'noiseface-studio', version: 1, state, image: img })], { type: 'application/json' }), 'noiseface-project.json');
  };
  $('#projectInput').onchange = async e => {
    try {
      const p = JSON.parse(await e.target.files[0].text());
      if (p.app !== 'noiseface-studio') throw new Error('Not a NoiseFace project');
      const keep = { ...DEFAULTS, ...p.state };
      if (p.image) setSource(fitCanvas(await loadImage(p.image)), null, true); else usePreset(keep.presetId, false);
      state = { ...keep, clock: { ...keep.clock }, date: { ...keep.date }, label: { ...keep.label }, dial: { ...defaultDial(), ...(keep.dial || {}) } };
      invalidate(); toast('Project loaded'); showTab('design');
    } catch (err) { toast(err.message, true); }
    e.target.value = '';
  };
  $('#watchInput').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    await importWatch(new Uint8Array(await f.arrayBuffer()), f.name);
    e.target.value = '';
  };
  $('#resetAll').onclick = () => {
    if (!confirm('Clear the current design?')) return;
    localStorage.removeItem('nfs.state'); localStorage.removeItem('nfs.src');
    state = structuredClone(DEFAULTS); usePreset('nebula'); toast('Fresh start');
  };
  loadSavedFacesLibrary();
  const refBtn = $('#refreshFaces');
  if (refBtn) refBtn.onclick = () => loadSavedFacesLibrary();
  const refMain = $('#refreshFacesMain');
  if (refMain) refMain.onclick = () => loadSavedFacesLibrary();
  const search = $('#faceSearchInput');
  if (search) search.oninput = () => renderFacesGrid(allSavedFacesList, search.value);
}

let allSavedFacesList = [];

function renderFacesGrid(list, filter = '') {
  const q = filter.trim().toLowerCase();
  const filtered = q ? list.filter(i => i.name.toLowerCase().includes(q) || i.file.toLowerCase().includes(q)) : list;
  for (const containerId of ['savedFacesLibraryGrid', 'savedFacesList']) {
    const container = $(`#${containerId}`);
    if (!container) continue;
    container.className = 'presets';
    container.style.cssText = 'max-height:560px; overflow-y:auto; padding:4px; margin-top:12px;';
    container.innerHTML = '';
    for (const item of filtered) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'preset';
      card.title = `${item.name} · ${(item.size / 1024).toFixed(0)} KB — click to open`;
      card.innerHTML = `
        <canvas class="face-thumb" width="120" height="140" style="width:100%; height:100%; display:block;"></canvas>
        <span>${item.name}</span>
      `;
      card.onclick = async () => {
        try {
          toast(`Loading ${item.name}...`);
          const r = await fetch(`faces/${item.file}`);
          if (!r.ok) throw new Error('Could not download face file');
          const buf = await r.arrayBuffer();
          document.querySelectorAll('.presets .preset.on').forEach(el => el.classList.remove('on'));
          card.classList.add('on');
          await importWatch(new Uint8Array(buf), item.file);
          showTab('design');
        } catch (e) {
          toast(e.message, true);
        }
      };
      container.appendChild(card);
      drawFaceThumb(item, card.querySelector('.face-thumb'));
    }
  }
}

const faceThumbCache = new Map();
async function drawFaceThumb(item, cv) {
  try {
    let src = faceThumbCache.get(item.file);
    if (!src) {
      const r = await fetch(`faces/${item.file}`);
      if (!r.ok) return;
      const w = parseWatch(new Uint8Array(await r.arrayBuffer()));
      const img = w.images.find(i => i.w === W0 && i.h === H0) || w.images[0];
      if (!img) return;
      src = Object.assign(document.createElement('canvas'), { width: img.w, height: img.h });
      src.getContext('2d').putImageData(new ImageData(decode565be(img.data, img.w, img.h), img.w, img.h), 0, 0);
      faceThumbCache.set(item.file, src);
    }
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, cv.width, cv.height);
  } catch (e) { console.warn('thumb failed', item.file, e); }
}

async function loadSavedFacesLibrary() {
  try {
    const res = await fetch('faces/manifest.json');
    if (!res.ok) return;
    allSavedFacesList = await res.json();
    for (const badgeId of ['libraryCount', 'libraryCountMain']) {
      const badge = $(`#${badgeId}`);
      if (badge) badge.textContent = `${allSavedFacesList.length} faces`;
    }
    const search = $('#faceSearchInput');
    renderFacesGrid(allSavedFacesList, search?.value || '');
  } catch (err) {
    console.warn('Failed to load faces library:', err);
  }
}

async function importWatch(bytes, fname) {
  const f = { name: fname };
  {
    try {
      const w = parseWatch(bytes);
      const info = [`${f.name}: ${w.size} bytes`, `images: ${w.images.map(i => `#${i.id} ${i.w}×${i.h}`).join(', ')}`];
      const img0 = w.images.find(i => i.w === W0 && i.h === H0) || w.images[0];
      if (!img0) throw new Error('No images inside this file');
      const c = Object.assign(document.createElement('canvas'), { width: img0.w, height: img0.h });
      c.getContext('2d').putImageData(new ImageData(decode565be(img0.data, img0.w, img0.h), img0.w, img0.h), 0, 0);
      Object.assign(state, { bright: 100, sat: 100, blur: 0, dim: 0 });
      state.label = { ...state.label, text: '' };
      setSource(c, null, true);
      const tc = w.layout?.WATCH?.text_clock, tm = w.layout?.WATCH?.text_month_week;
      const isAnalog = !tc && (!!w.layout?.WATCH?.image_pointer_clock || w.images.length > 10);
      analogTemplateBytes = isAnalog ? bytes : null;
      if (isAnalog) { state.analogBase = null; state.customHands = false; loadOriginalSprites(bytes); } else { originalSprites = null; state.analogBase = null; }
      refreshClockUI();
      if (tc) {
        state.clock = { x: clamp(tc.x_hour ?? 48, 0, W0 - 40), y: clamp(tc.y_hour ?? 20, 3, H0 - 25) };
        if (tc.text_id != null) { state.clockFont = tc.text_id; state.clockSize = KNOWN_FONTS[tc.text_id]?.px ?? 52; }
        if (tc.x_spacing_h != null) state.clockSpacing = tc.x_spacing_h;
        if (tc.color_r_h != null) state.color = rgbToHex(tc.color_r_h, tc.color_g_h, tc.color_b_h);
      }
      if (tm) {
        const col = rgbToHex(tm.color_r ?? 255, tm.color_g ?? 255, tm.color_b ?? 255);
        state.date = { ...state.date, x: clamp(tm.x ?? 27, 0, W0 - DATE_W), y: clamp(tm.y ?? 75, 0, H0 - DATE_H), visible: tm.visible !== 0, match: col === state.color, color: col };
      }
      const known = w.layout && Object.keys(w.layout.WATCH || {}).filter(k => !['image', 'text_clock', 'text_month_week'].includes(k));
      if (isAnalog) info.push(`🕰 Analog face template active (${w.images.length} sprites preserved! You can swap the background photo and send to watch with real analog hands!)`);
      else if (known?.length) info.push(`note: extra elements not editable here: ${known.join(', ')}`);
      info.push('', w.layoutText);
      $('#fileInfo').textContent = info.join('\n'); $('#fileInfo').hidden = false;
      invalidate(); toast('Face loaded into the editor');
    } catch (err) { toast(err.message, true); }
  }
}

// ------------------------------------------------------------------ Noise Lab bridge (only when served by noise_lab.py)
async function bindLab() {
  try {
    const r = await fetch('/api/ping', { cache: 'no-store' });
    if (!r.ok || (await r.json()).app !== 'noise-lab') return;
  } catch { return; }
  $('#labLink').hidden = false;
  const b = Object.assign(document.createElement('button'), { className: 'ghost', textContent: '💾 Save to Noise Lab' });
  $('.stage-actions').append(b);
  b.onclick = async () => {
    const name = prompt('Name for this face', 'myface'); if (!name) return;
    try {
      const res = await fetch('/api/faces/upload?name=' + encodeURIComponent(name), { method: 'POST', body: buildFile() });
      const j = await res.json(); if (!res.ok) throw new Error(j.error);
      toast('Saved to library as ' + j.name);
    } catch (e) { toast(e.message, true); }
  };
  const load = new URLSearchParams(location.search).get('load');
  if (load && load.startsWith('/files/')) {
    const res = await fetch(load);
    if (res.ok) await importWatch(new Uint8Array(await res.arrayBuffer()), load.split('/').pop());
  }
}

// ------------------------------------------------------------------ clock style: digital / 10fps moving / analog + dial + hand designer
const ANALOG_BASES = { analog_classic: 'faces/analog_classic.watch', analog_clean: 'faces/analog_color_x.watch' };

function applyWatch2Layout() {
  state.date = { ...state.date, x: 27, y: 12, visible: true };
  state.dateShortWeek = true;
  state.dateShortMonth = true;
  state.clock = { x: 48, y: 218 };
  state.clockSize = 52;
  state.clockFont = 50;
}

async function setClockMode(mode, { keep = false } = {}) {
  if (mode === 'digital') {
    analogTemplateBytes = null; originalSprites = null; state.analogBase = null;
    state.motion.enabled = false;
    handCache.clear();
  } else if (mode === 'motion') {
    analogTemplateBytes = null; originalSprites = null; state.analogBase = null;
    state.motion.enabled = true;
    state.motion.mode = 'video10fps';
    if (!state.motion.scene) state.motion.scene = 'koi_sphere';
    if (state.motion.playing === undefined) state.motion.playing = true;
    if (!keep && state.clock.y === 20) {
      applyWatch2Layout();
    }
    bindMotionUI.show?.();
    handCache.clear();
  } else {
    const path = ANALOG_BASES[mode];
    const r = await fetch(path);
    if (!r.ok) throw new Error('Could not load ' + path);
    const bytes = new Uint8Array(await r.arrayBuffer());
    parseWatch(bytes);
    analogTemplateBytes = bytes; state.analogBase = path;
    state.motion.enabled = false;
    loadOriginalSprites(bytes);
    if (!keep) {
      state.customHands = true;
      if (!state.dial?.style || state.dial.style === 'none') {
        state.dial = { ...(state.dial || defaultDial()), style: 'arabic_full', scale: 1.0 };
      }
    }
    bindDialUI.show?.();
    bindHandsUI.show?.();
  }
  syncMotionTimer();
  refreshClockUI();
  invalidate();
}

function refreshClockUI() {
  const mode = analogTemplateBytes
    ? (state.analogBase === ANALOG_BASES.analog_clean ? 'analog_clean' : state.analogBase === ANALOG_BASES.analog_classic ? 'analog_classic' : 'imported')
    : (state.motion?.enabled ? 'motion' : 'digital');
  $$('#clockMode button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));

  const modeLabels = {
    digital: '⌚ Digital',
    motion: '🎬 10 FPS Moving',
    analog_classic: '🕰 Analog + Date',
    analog_clean: '🕰 Analog Clean',
    imported: '🕰 Analog Template',
  };
  if ($('#activeModeBadge')) $('#activeModeBadge').textContent = modeLabels[mode] || '⌚ Digital';

  // Clean mode-aware card visibility so the Design tab only shows cards for the active mode
  if ($('#motionCard')) $('#motionCard').hidden = !state.motion?.enabled;
  if ($('#dialCard')) $('#dialCard').hidden = !analogTemplateBytes;
  if ($('#handsCard')) $('#handsCard').hidden = !analogTemplateBytes;
  if ($('#clockCard')) $('#clockCard').hidden = !!analogTemplateBytes;
  if ($('#dateCard')) $('#dateCard').hidden = !!analogTemplateBytes;

  $('#analogHint').textContent = analogTemplateBytes
    ? 'Analog mode: customize numeric dial scales and clock hand styles below.'
    : state.motion?.enabled
      ? '🎬 10 FPS Moving mode: converts your GIF, MP4 video, or 10 FPS scene into hardware frame sprites with the digital clock & date on top.'
      : 'Digital mode: drag the clock, date, or background anywhere on the watch screen.';

  $$('#handPresets .hand-preset').forEach(b => b.classList.toggle('on', state.customHands && b.dataset.key === state.handPreset));
  $$('#dialPresets .hand-preset').forEach(b => b.classList.toggle('on', (state.dial?.style || 'none') === b.dataset.dkey));
  $('#handsOriginal').hidden = !analogTemplateBytes || !state.customHands;
  if ($('#motionEnabled')) $('#motionEnabled').checked = !!state.motion?.enabled;
  if ($('#motionPanel')) $('#motionPanel').hidden = !state.motion?.enabled;
  $$('#videoScenePresets .hand-preset').forEach(b => b.classList.toggle('on', state.motion?.enabled && b.dataset.scene === (state.motion?.scene || 'koi_sphere')));
  syncDialControls();
  syncHandControls();
  syncMotionControls();
  showSize();
}

function syncDialControls() {
  if (!state.dial) state.dial = defaultDial();
  const set = (sel, v, prop = 'value') => { const el = $(sel); if (el && document.activeElement !== el) el[prop] = v; };
  set('#dialColor', state.dial.color || '#f8fafc');
  set('#dialAccent', state.dial.accent || '#38bdf8');
  set('#dialTrack', (state.dial.track ?? state.dial.minuteTrack) !== false, 'checked');
  const rawSc = state.dial.scale ?? 1;
  const scPct = Math.round(rawSc <= 3 ? rawSc * 100 : rawSc);
  set('#dialScale', scPct);
  if ($('#dialScaleOut')) $('#dialScaleOut').textContent = scPct + '%';
}

function bindDialUI() {
  if (!state.dial) state.dial = defaultDial();
  const prevDial = key => {
    const c = Object.assign(document.createElement('canvas'), { width: 240, height: 280 });
    const g = c.getContext('2d');
    const bgd = g.createRadialGradient(120, 140, 10, 120, 140, 150);
    bgd.addColorStop(0, '#1e2230');
    bgd.addColorStop(1, '#090b10');
    g.fillStyle = bgd;
    g.fillRect(0, 0, 240, 280);
    if (key !== 'none') {
      drawDialOverlay(g, { style: key, color: '#f8fafc', accent: '#38bdf8', scale: 1.0, track: true }, 120, 140);
    }
    return c;
  };
  let drawn = false;
  const drawPresets = () => {
    if (drawn) return;
    drawn = true;
    const wrap = $('#dialPresets');
    if (!wrap) return;
    wrap.innerHTML = '';
    wrap.append(...Object.entries(DIAL_STYLES).map(([key, d]) => {
      const titleText = d.label || d.name || key;
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'hand-preset', title: titleText });
      b.dataset.dkey = key;
      if (d.badge) {
        const badge = Object.assign(document.createElement('em'), { className: 'badge-tag', textContent: d.badge });
        b.append(badge);
      }
      const sp = Object.assign(document.createElement('span'), { textContent: titleText });
      b.append(prevDial(key), sp);
      b.onclick = () => {
        state.dial = { ...(state.dial || defaultDial()), style: key };
        refreshClockUI();
        invalidate();
        toast(`🔢 Dial Numerals: ${titleText}`);
      };
      return b;
    }));
  };
  if ($('#dialReset')) {
    $('#dialReset').onclick = () => {
      state.dial = { ...(state.dial || defaultDial()), style: 'none' };
      refreshClockUI();
      invalidate();
    };
  }
  if ($('#dialColor')) {
    $('#dialColor').oninput = e => {
      state.dial.color = e.target.value;
      if (state.dial.style === 'none') state.dial.style = 'arabic_full';
      refreshClockUI();
      invalidate();
    };
  }
  if ($('#dialAccent')) {
    $('#dialAccent').oninput = e => {
      state.dial.accent = e.target.value;
      if (state.dial.style === 'none') state.dial.style = 'arabic_full';
      refreshClockUI();
      invalidate();
    };
  }
  if ($('#dialTrack')) {
    $('#dialTrack').onchange = e => {
      state.dial.track = e.target.checked;
      invalidate();
    };
  }
  if ($('#dialScale')) {
    $('#dialScale').oninput = e => {
      state.dial.scale = (+e.target.value) / 100;
      if ($('#dialScaleOut')) $('#dialScaleOut').textContent = e.target.value + '%';
      invalidate();
    };
  }
  bindDialUI.show = drawPresets;
}

const HAND_FIELDS = {
  hour: [['len', 'Length', 20, 110, 1], ['w', 'Width', 2, 22, 0.5], ['tail', 'Tail', 0, 40, 1]],
  minute: [['len', 'Length', 30, 118, 1], ['w', 'Width', 2, 20, 0.5], ['tail', 'Tail', 0, 40, 1]],
  second: [['len', 'Length', 40, 125, 1], ['tail', 'Tail', 0, 45, 1]],
};
const HAND_TABLE = { hour: HAND_STYLES, minute: HAND_STYLES, second: SECOND_STYLES, cap: CAP_STYLES };
const HAND_TITLE = { hour: 'Hour hand', minute: 'Minute hand', second: 'Second hand', cap: 'Centre cap' };

function syncHandControls() {
  $$('#handCtl [data-k]').forEach(el => {
    if (document.activeElement === el) return;
    const v = state.hands[el.dataset.kind][el.dataset.k];
    el.value = v;
    const out = el.nextElementSibling; if (out && out.tagName === 'OUTPUT') out.textContent = v;
  });
}

function bindHandsUI() {
  // presets, each drawn with its own hands over a dark dial at 10:09:36
  const prev = key => {
    const d = HAND_PRESETS[key], c = Object.assign(document.createElement('canvas'), { width: 240, height: 280 }), g = c.getContext('2d');
    const bgd = g.createRadialGradient(120, 140, 10, 120, 140, 150); bgd.addColorStop(0, '#20222c'); bgd.addColorStop(1, '#0a0a10');
    g.fillStyle = bgd; g.fillRect(0, 0, 240, 280);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
    for (let k = 0; k < 12; k++) { g.save(); g.translate(120, 140); g.rotate(k * Math.PI / 6); g.beginPath(); g.moveTo(0, -112); g.lineTo(0, -122); g.stroke(); g.restore(); }
    for (const [kind, a] of [['hour', 302], ['minute', 54], ['second', 216]]) g.drawImage(putSprite(drawHand(kind, d, a)), 0, 0);
    g.drawImage(putSprite(capSprite(d)), 0, 0);
    return c;
  };
  let drawn = false;
  const drawPresets = () => {
    if (drawn) return; drawn = true;
    $('#handPresets').append(...Object.entries(HAND_PRESETS).map(([key, d]) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'hand-preset', title: d.name });
      b.dataset.key = key;
      const sp = document.createElement('span'); sp.textContent = d.name;
      b.append(prev(key), sp);
      b.onclick = () => { state.hands = structuredClone(HAND_PRESETS[key]); state.handPreset = key; state.customHands = true; refreshClockUI(); invalidate(false); };
      return b;
    }));
  };

  // fine-tune controls
  const row = kind => {
    const box = document.createElement('div'); box.className = 'hand-row';
    const title = document.createElement('b'); title.textContent = HAND_TITLE[kind]; box.append(title);
    const top = document.createElement('div'); top.className = 'top';
    const sel = document.createElement('select');
    for (const [id, s] of Object.entries(HAND_TABLE[kind])) sel.append(Object.assign(document.createElement('option'), { value: id, textContent: s.label }));
    sel.dataset.kind = kind; sel.dataset.k = 'style';
    sel.onchange = () => { state.hands[kind].style = sel.value; state.customHands = true; state.handPreset = null; refreshClockUI(); invalidate(false); };
    top.append(sel);
    const colors = kind === 'cap' ? [['color', 'Body'], ['accent', 'Centre']] : kind === 'second' ? [['color', 'Colour']] : [['color', 'Body'], ['lume', 'Lume']];
    for (const [k, label] of colors) {
      const inp = Object.assign(document.createElement('input'), { type: 'color', title: label });
      inp.dataset.kind = kind; inp.dataset.k = k;
      inp.oninput = () => { state.hands[kind][k] = inp.value; state.customHands = true; state.handPreset = null; invalidate(false); };
      top.append(inp);
    }
    box.append(top);
    for (const [k, label, min, max, step] of HAND_FIELDS[kind] || []) {
      const lab = document.createElement('label'); lab.append(label);
      const r = Object.assign(document.createElement('input'), { type: 'range', min, max, step });
      r.dataset.kind = kind; r.dataset.k = k;
      const out = document.createElement('output');
      r.oninput = () => { state.hands[kind][k] = +r.value; out.textContent = r.value; state.customHands = true; state.handPreset = null; invalidate(false); };
      lab.append(r, out); box.append(lab);
    }
    return box;
  };
  $('#handCtl').append(...['hour', 'minute', 'second', 'cap'].map(row));

  $$('#clockMode button').forEach(b => b.onclick = async () => {
    const label = b.textContent;
    $$('#clockMode button').forEach(x => x.classList.toggle('on', x === b));
    if (b.dataset.mode !== 'digital' && b.dataset.mode !== 'motion') b.textContent = 'Loading…';
    try {
      await setClockMode(b.dataset.mode);
      if (b.dataset.mode === 'motion') {
        bindMotionUI.show?.();
        toast('🎬 10 FPS Moving Watchface active! Playing live on the watch preview ✨');
      } else if (b.dataset.mode !== 'digital') {
        drawPresets();
        bindDialUI.show?.();
        toast('🕰 Analog mode active: pick Dial Numerals and Hand Designs below');
      } else {
        toast('⌚ Digital clock active');
      }
    } catch (e) { toast('Could not switch: ' + e.message, true); refreshClockUI(); }
    finally { b.textContent = label; }
  });
  $('#handsOriginal').onclick = () => { state.customHands = false; state.handPreset = null; refreshClockUI(); invalidate(false); };
  $('#clockFont').oninput = e => {
    state.clockFont = +e.target.value;
    if (KNOWN_FONTS[state.clockFont]) state.clockSize = KNOWN_FONTS[state.clockFont].px;
    invalidate(false);
  };
  $('#dateFont').oninput = e => { state.dateFont = +e.target.value; invalidate(false); };
  $('#dateShortWeek').onchange = e => { state.dateShortWeek = e.target.checked; invalidate(false); };
  $('#dateShortMonth').onchange = e => { state.dateShortMonth = e.target.checked; invalidate(false); };
  $('#fontPicks').append(...[50, 18, 16].map(f => {
    const b = Object.assign(document.createElement('button'), { className: 'ghost', textContent: `${f} · ${KNOWN_FONTS[f].label}` });
    b.dataset.f = f; b.onclick = () => {
      state.clockFont = f;
      state.clockSize = KNOWN_FONTS[f].px;
      invalidate(false);
    };
    return b;
  }));
  $('#handInfo').textContent = 'Hands are drawn in 16 angles per hand (6° steps) and packed into the face. Combine with any Dial Numeral design above.';
  bindHandsUI.show = drawPresets;
}

// ------------------------------------------------------------------ Low-FPS / Low-Res Video & GIF Converter UI
function updateConverterStats() {
  const el = $('#converterStats');
  if (!el || !state.motion) return;
  const spec = resolveLowResSpec(getMotionConvertOpts());
  const fps = clamp(state.motion.fps || 4, 1, 15);
  const frames = clamp(state.motion.frameCount || 16, 4, 24);
  const diam = spec.maxR * 2;
  const rows = Math.round(diam / spec.scanlineStep);
  const estPx = Math.round((Math.PI * spec.maxR * spec.maxR) / spec.scanlineStep);
  const frameKb = ((3378 + rows * 12 + estPx * 2) / 1024).toFixed(1);
  const srcLabel = state.motion.scene === 'custom_media' && customMediaName
    ? customMediaName
    : (VIDEO_SCENES[state.motion.scene]?.name || 'Particle Sphere');
  el.textContent = `✔ Ready: ${srcLabel} → ${diam}×${diam} (${spec.pixelSize}×${spec.pixelSize} px block${spec.scanlineStep > 1 ? ' · Scanline' : ''}) · ${fps} FPS · ${frames} frames (~${frameKb} KB/sprite · ${rows} spans)`;
}

function syncMotionControls() {
  if (!state.motion) return;
  const set = (sel, v, prop = 'value') => { const el = $(sel); if (el && document.activeElement !== el) el[prop] = v; };
  const fps = clamp(state.motion.fps || 4, 1, 15);
  const frames = clamp(state.motion.frameCount || 16, 8, 16);
  const resKey = state.motion.resolution && LOW_RES_PRESETS[state.motion.resolution] ? state.motion.resolution : '80x80';
  const pxSize = clamp(+(state.motion.pixelSize || LOW_RES_PRESETS[resKey].pixelSize || 2), 1, 4);
  set('#motionRes', resKey);
  set('#motionPixelSize', String(pxSize));
  set('#motionFps', fps);
  if ($('#motionFpsOut')) $('#motionFpsOut').textContent = `${fps} FPS`;
  $$('#fpsPicks button').forEach(b => b.classList.toggle('on', +b.dataset.fps === fps));
  set('#motionFrames', frames);
  if ($('#motionFramesOut')) $('#motionFramesOut').textContent = `${frames} frames`;
  set('#motionPreviewLowRes', state.motion.previewLowRes !== false, 'checked');
  const sc = VIDEO_SCENES[state.motion.scene] || VIDEO_SCENES.koi_sphere;
  set('#motionAccentColor', state.motion.accentColor || sc.accent);
  set('#motionSecondaryColor', state.motion.secondaryColor || sc.secondary);
  if ($('#motionPlayBtn')) {
    $('#motionPlayBtn').textContent = state.motion.playing === false ? `▶ Play (${fps} FPS)` : `⏸ Pause (${fps} FPS)`;
  }
  if ($('#filmstripLabel')) {
    const spec = resolveLowResSpec(getMotionConvertOpts());
    $('#filmstripLabel').textContent = `(${spec.preset.shortLabel} · ${spec.pixelSize}×${spec.pixelSize}px @ ${fps} FPS)`;
  }
  updateConverterStats();
}

function bindMotionUI() {
  const prevScene = key => {
    const sc = VIDEO_SCENES[key];
    const rgba = renderSceneRgba(key, 3, 16, { accentColor: sc.accent, secondaryColor: sc.secondary });
    const c = rgbaToCanvas(rgba);
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.font = '600 13px system-ui, "Segoe UI", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillText('Fri Nov 06', 120, 12);
    g.font = '700 44px system-ui, "Segoe UI", sans-serif';
    g.fillText('20:56', 120, 218);
    return c;
  };

  let drawn = false;
  const drawPresets = () => {
    if (drawn) return; drawn = true;
    const vsGrid = $('#videoScenePresets');
    if (vsGrid) {
      vsGrid.innerHTML = '';
      vsGrid.append(...Object.entries(VIDEO_SCENES).map(([key, sc]) => {
        const b = Object.assign(document.createElement('button'), { type: 'button', className: 'hand-preset', title: `${sc.name} — ${sc.desc}` });
        b.dataset.scene = key;
        const badge = Object.assign(document.createElement('em'), { className: 'badge-tag', textContent: sc.badge || 'Low-Res' });
        const sp = Object.assign(document.createElement('span'), { textContent: sc.name });
        b.append(prevScene(key), badge, sp);
        b.onclick = () => {
          analogTemplateBytes = null;
          originalSprites = null;
          state.analogBase = null;
          state.motion.enabled = true;
          state.motion.mode = 'video10fps';
          state.motion.scene = key;
          state.motion.accentColor = sc.accent;
          state.motion.secondaryColor = sc.secondary;
          state.motion.playing = true;
          motionFrameIdx = 0;
          sceneCacheKey = '';
          ensureSceneFrames();
          syncMotionTimer();
          refreshClockUI();
          invalidate();
          toast(`🎬 Scene: ${sc.name}`);
        };
        return b;
      }));
    }
    ensureSceneFrames();
    renderFilmstrip();
  };

  // Upload animated GIF / Video in Moving Watchface card
  const mInput = $('#motionMediaInput');
  if (mInput) mInput.onchange = e => { if (e.target.files[0]) loadAnimatedMediaFile(e.target.files[0]); e.target.value = ''; };
  const mDrop = $('#motionDrop');
  if (mDrop) {
    ['dragenter', 'dragover'].forEach(t => mDrop.addEventListener(t, e => { e.preventDefault(); mDrop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(t => mDrop.addEventListener(t, e => { e.preventDefault(); mDrop.classList.remove('over'); }));
    mDrop.addEventListener('drop', e => { if (e.dataTransfer.files[0]) loadAnimatedMediaFile(e.dataTransfer.files[0]); });
  }

  // Play / Pause button
  if ($('#motionPlayBtn')) {
    $('#motionPlayBtn').onclick = () => {
      state.motion.playing = state.motion.playing === false;
      syncMotionTimer();
      refreshClockUI();
      invalidate(false);
    };
  }

  // Match Default #2 Layout button (Fri Nov 06 at top, 20:56 at bottom)
  if ($('#applyWatch2Layout')) {
    $('#applyWatch2Layout').onclick = () => {
      applyWatch2Layout();
      state.color = '#ffffff';
      state.date.match = true;
      invalidate(false);
      toast('✨ Applied Watch Default #2 layout (Date top · 20:56 bottom)');
    };
  }

  // One-click Convert & Send to Watch button
  if ($('#convertAndSendBtn')) {
    $('#convertAndSendBtn').onclick = () => {
      const spec = resolveLowResSpec(getMotionConvertOpts());
      showTab('send');
      if (innerWidth < 860) $('.panel')?.scrollIntoView({ behavior: 'smooth' });
      const sendBtn = $('#sendBtn');
      if (sendBtn && !sendBtn.disabled) {
        toast(`⚡ Sending converted ${spec.preset.shortLabel} (${state.motion.fps || 4} FPS) face to watch…`);
        sendBtn.click();
      } else {
        toast(`⚡ Converted to ${spec.preset.shortLabel} (${state.motion.fps || 4} FPS)! Click Connect → Send to watch`);
      }
    };
  }

  // Target Low Resolution & Pixel Block selectors
  if ($('#motionRes')) {
    $('#motionRes').onchange = e => {
      const key = e.target.value;
      state.motion.resolution = key;
      if (LOW_RES_PRESETS[key]) {
        state.motion.pixelSize = LOW_RES_PRESETS[key].pixelSize;
      }
      refreshClockUI();
      invalidate();
      toast(`Resolution set to ${LOW_RES_PRESETS[key]?.shortLabel || key}`);
    };
  }
  if ($('#motionPixelSize')) {
    $('#motionPixelSize').onchange = e => {
      state.motion.pixelSize = clamp(+e.target.value || 2, 1, 4);
      refreshClockUI();
      invalidate();
      toast(`Pixel block scale: ${state.motion.pixelSize}×${state.motion.pixelSize} px`);
    };
  }
  if ($('#motionPreviewLowRes')) {
    $('#motionPreviewLowRes').onchange = e => {
      state.motion.previewLowRes = e.target.checked;
      invalidate();
    };
  }

  const applyNewFps = async newFps => {
    state.motion.fps = clamp(newFps, 1, 15);
    if ($('#motionFpsOut')) $('#motionFpsOut').textContent = `${state.motion.fps} FPS`;
    syncMotionTimer();
    syncMotionControls();
    save();
    if (state.motion.scene === 'custom_media' && lastUploadedMediaFile) {
      await loadAnimatedMediaFile(lastUploadedMediaFile, { keepAdjustments: true });
    } else {
      invalidate();
    }
  };

  // FPS slider & quick FPS buttons
  if ($('#motionFps')) {
    $('#motionFps').oninput = e => {
      state.motion.fps = +e.target.value;
      if ($('#motionFpsOut')) $('#motionFpsOut').textContent = `${state.motion.fps} FPS`;
      syncMotionTimer();
      syncMotionControls();
      save();
    };
    $('#motionFps').onchange = e => applyNewFps(+e.target.value);
  }
  $$('#fpsPicks button').forEach(b => {
    b.onclick = () => applyNewFps(+b.dataset.fps);
  });

  if ($('#motionFrames')) {
    $('#motionFrames').oninput = e => {
      state.motion.frameCount = +e.target.value;
      if ($('#motionFramesOut')) $('#motionFramesOut').textContent = `${state.motion.frameCount} frames`;
      sceneCacheKey = '';
      ensureSceneFrames();
      syncMotionControls();
      invalidate();
    };
    $('#motionFrames').onchange = async () => {
      if (state.motion.scene === 'custom_media' && lastUploadedMediaFile) {
        await loadAnimatedMediaFile(lastUploadedMediaFile, { keepAdjustments: true });
      }
    };
  }
  if ($('#motionAccentColor')) {
    $('#motionAccentColor').oninput = e => {
      state.motion.accentColor = e.target.value;
      sceneCacheKey = '';
      ensureSceneFrames();
      invalidate();
    };
  }
  if ($('#motionSecondaryColor')) {
    $('#motionSecondaryColor').oninput = e => {
      state.motion.secondaryColor = e.target.value;
      sceneCacheKey = '';
      ensureSceneFrames();
      invalidate();
    };
  }

  $('#motionEnabled').onchange = async e => {
    if (e.target.checked) {
      drawPresets();
      analogTemplateBytes = null;
      originalSprites = null;
      state.analogBase = null;
      state.motion.enabled = true;
      state.motion.mode = 'video10fps';
      if (!state.motion.scene) state.motion.scene = 'koi_sphere';
      state.motion.playing = true;
      syncMotionTimer();
      refreshClockUI();
      invalidate();
      toast('🎬 Low-Res Moving Watchface enabled ✨');
    } else {
      state.motion.enabled = false;
      syncMotionTimer();
      refreshClockUI();
      invalidate();
      toast('Moving animation off');
    }
  };
  $('#motionInfo').textContent = 'Videos (.mp4, .webm, .mov) and .GIFs are downscaled into a low-resolution circular display portal (1 contiguous RGB565 span per row) with the digital clock and date rendered cleanly on top.';
  bindMotionUI.show = drawPresets;
  refreshClockUI();
}

// ------------------------------------------------------------------ bluetooth
function bindBle() {
  const ok = bleSupported();
  const badge = $('#bleBadge');
  badge.textContent = ok ? 'Bluetooth ready' : 'No Web Bluetooth';
  badge.className = 'badge ' + (ok ? 'ok' : 'bad');
  $('#bleUnsupported').hidden = ok;
  $('#connectBtn').disabled = !ok;

  const logEl = $('#log');
  const log = m => { logEl.textContent += `[${new Date().toLocaleTimeString()}] ${m}\n`; logEl.scrollTop = logEl.scrollHeight; };
  const setProg = f => { $('#progressBar').style.width = (f * 100).toFixed(1) + '%'; $('#progressText').textContent = f ? Math.floor(f * 100) + '%' : ''; };
  let link = null, busy = false, fileToSend = null;

  const refresh = () => {
    const c = !!link?.connected;
    $('#connStatus').textContent = c ? `Connected to ${link.name}` : 'Not connected';
    $('#connStatus').className = 'status' + (c ? ' ok' : '');
    $('#connectBtn').disabled = !ok || c || busy;
    $('#disconnectBtn').disabled = !c;
    $('#sendBtn').disabled = !c || busy;
    $('#nSend').disabled = $('#cRing').disabled = !c || busy;
  };

  $('#connectBtn').onclick = async () => {
    link = new NoiseLink({ log, verbose: $('#verbose').checked });
    link.onDisconnect = refresh;
    try {
      busy = true; refresh();
      await link.connect({ namePrefix: $('#namePrefix').value.trim() });
    } catch (e) {
      if (e.name !== 'NotFoundError') { log('Error: ' + e.message); toast(e.message, true); }
    } finally { busy = false; refresh(); }
  };
  $('#disconnectBtn').onclick = () => link?.disconnect();
  $('#verbose').onchange = e => { if (link) link.verbose = e.target.checked; };
  $('#sendFile').onchange = e => { if (e.target.checked) $('#sendFileInput').click(); else fileToSend = null; };
  $('#sendFileInput').onchange = async e => {
    const f = e.target.files[0];
    if (!f) { $('#sendFile').checked = false; return; }
    try { parseWatch(new Uint8Array(await f.arrayBuffer())); } catch (err) { toast(err.message, true); $('#sendFile').checked = false; return; }
    fileToSend = new Uint8Array(await f.arrayBuffer());
    log(`Will send ${f.name} (${fileToSend.length} bytes) instead of the editor design.`);
  };

  $('#sendBtn').onclick = async () => {
    if (!link?.connected) return;
    const data = $('#sendFile').checked && fileToSend ? fileToSend : buildFile();
    busy = true; refresh(); setProg(0);
    log(`Sending ${data.length} bytes as face slot ${state.faceId}…`);
    let wake = null;
    try { wake = await navigator.wakeLock?.request('screen'); } catch { /* optional */ }
    try {
      await transfer(link, data, { id: state.faceId, minimal: $('#minimal').checked, onProgress: setProg, log });
      setProg(1); toast('Face installed. Check your wrist ✨');
    } catch (e) {
      log('Failed: ' + e.message);
      toast('Transfer failed: ' + e.message, true);
      if (!$('#minimal').checked) log('Tip: retry once. If it keeps failing at the same step, enable "Log every Bluetooth packet" and keep the log.');
    } finally { busy = false; refresh(); wake?.release?.(); }
  };

  // ---- notifications & calls (same BLE link)
  const nlog = m => { const el = $('#nLog'); el.textContent += `[${new Date().toLocaleTimeString()}] ${m}\n`; el.scrollTop = el.scrollHeight; };
  const guard = async (fn) => {
    if (!link?.connected) { toast('Connect to the watch in the Send tab first', true); return showTab('send'); }
    busy = true; refresh();
    try { await fn(); } catch (e) { nlog('Failed: ' + e.message); toast(e.message, true); } finally { busy = false; refresh(); }
  };
  $('#nSend').onclick = () => guard(async () => {
    const app = $('#nApp').value, t = $('#nTitle').value || 'Noise', b = $('#nBody').value || ' ';
    nlog(`Sending ${app}: ${t} — ${b}`);
    const acked = await sendNotification(link, app, t, b, $('#nNum').value.trim());
    nlog(acked ? '✔ Watch acknowledged.' : 'Sent (no acknowledgement seen).');
    toast(acked ? 'Notification delivered ✨' : 'Sent');
  });
  $('#cRing').onclick = () => guard(async () => {
    await ringCall(link, $('#cName').value || 'Unknown', $('#cNum').value || '', +$('#cSec').value || 6, $('#cMissed').checked, nlog);
    nlog('✔ Call finished.');
  });
  refresh();
}

// ------------------------------------------------------------------ PWA
function bindPwa() {
  let deferred = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').hidden = false; });
  $('#installBtn').onclick = async () => { deferred?.prompt(); deferred = null; $('#installBtn').hidden = true; };
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').then(reg => reg.update()).catch(() => {});
  }
}

// ------------------------------------------------------------------ size info
function showSize() {
  const hasSprites = !!(analogTemplateBytes || state.motion?.enabled);
  const is10fps = !analogTemplateBytes && state.motion?.enabled;
  if (is10fps) {
    const spec = resolveLowResSpec(getMotionConvertOpts());
    const rows = Math.round((spec.maxR * 2) / spec.scanlineStep);
    const estPx = Math.round((Math.PI * spec.maxR * spec.maxR) / spec.scanlineStep);
    const frameBytes = 3378 + rows * 12 + estPx * 2;
    const totalKb = Math.round((212660 + 33 * 3392 + 16 * frameBytes) / 1024);
    const pkts = Math.round((totalKb * 1024) / 241);
    $('#sizeInfo').textContent = `File size: ~${totalKb} KB (${spec.preset.shortLabel} · ${state.motion.fps || 4} FPS + digital clock) · ~${pkts} Bluetooth packets`;
    return;
  }
  $('#sizeInfo').textContent = hasSprites
    ? 'File size: ~540 KB (49 analog hand sprites) · about 2,250 Bluetooth packets'
    : `File size: ${(212660 / 1024).toFixed(0)} KB · about 880 Bluetooth packets`;
}

bindInputs(); bindCanvas(); bindFiles(); bindBle(); bindDialUI(); bindHandsUI(); bindMotionUI(); bindPwa(); showSize();
restore().then(bindLab);
