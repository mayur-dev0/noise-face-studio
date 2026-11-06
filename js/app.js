import { W0, H0, W1, H1, DEFAULT_ID, defaultLayout, cjson, rgba565be, decode565be, assemble, parseWatch } from './format.js';
import { NoiseLink, transfer, bleSupported } from './ble.js';
import { PRESETS } from './presets.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// ------------------------------------------------------------------ state
const CLOCK_W = 139, CLOCK_H = 46, DATE_W = 186, DATE_H = 20;
const DEFAULTS = {
  presetId: 'nebula',
  zoom: 1, panX: 0, panY: 0, bright: 100, sat: 100, blur: 0, dim: 0,
  color: '#ffffff',
  clock: { x: 48, y: 20 },
  date: { x: 27, y: 75, visible: true, match: true, color: '#ffffff' },
  label: { text: '', x: 120, y: 236, size: 22, color: '#ffffff', font: 'system-ui' },
  faceId: DEFAULT_ID,
};
let state = structuredClone(DEFAULTS);
let source = null;          // canvas holding the (downscaled) background source
let sourceDataURL = null;   // persisted copy for uploaded / imported images

const bg = Object.assign(document.createElement('canvas'), { width: W0, height: H0 });
const bgx = bg.getContext('2d', { willReadFrequently: true });
const screen = $('#screen'), sx = screen.getContext('2d');
const thumb = $('#pickerPreview'), tx = thumb.getContext('2d', { willReadFrequently: true });

// ------------------------------------------------------------------ utils
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => (v | 0).toString(16).padStart(2, '0')).join('');
const dateColor = () => (state.date.match ? state.color : state.date.color);

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

function clampPan() {
  if (!source) return;
  const { w, h } = coverRect(source.width, source.height, W0, H0, state.zoom);
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

function renderBg() {
  bgx.save();
  bgx.fillStyle = '#000'; bgx.fillRect(0, 0, W0, H0);
  if (source) {
    clampPan();
    const { w, h } = coverRect(source.width, source.height, W0, H0, state.zoom);
    const dx = (W0 - w) / 2 + state.panX, dy = (H0 - h) / 2 + state.panY;
    bgx.filter = `brightness(${state.bright}%) saturate(${state.sat}%)` + (state.blur ? ` blur(${state.blur}px)` : '');
    const pad = state.blur * 3; // avoid dark blurred edges
    bgx.drawImage(source, dx - pad, dy - pad, w + 2 * pad, h + 2 * pad);
    bgx.filter = 'none';
  }
  if (state.dim > 0) { bgx.fillStyle = `rgba(0,0,0,${state.dim})`; bgx.fillRect(0, 0, W0, H0); }
  const L = state.label;
  if (L.text) {
    bgx.font = `700 ${L.size}px ${L.font}`;
    bgx.textAlign = 'center'; bgx.textBaseline = 'middle';
    bgx.shadowColor = 'rgba(0,0,0,.45)'; bgx.shadowBlur = 4; bgx.shadowOffsetY = 1;
    bgx.fillStyle = L.color; bgx.fillText(L.text, L.x, L.y);
  }
  bgx.restore();
}

// Approximation of the watch's own digits (text_id 50) and date (text_id 18).
function drawOverlay(ctx, now) {
  const { x, y } = state.clock;
  const hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
  ctx.save();
  ctx.fillStyle = state.color;
  ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  ctx.font = '600 52px system-ui, "Segoe UI", Roboto, sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 2;
  const digit = (ch, dx) => ctx.fillText(ch, x + dx + 14, y - 2, 28);
  digit(hh[0], 0); digit(hh[1], 33);
  digit(mm[0], 77); digit(mm[1], 110);
  ctx.fillText(':', x + 69.5, y - 5);
  if (state.date.visible) {
    const d = state.date;
    ctx.font = '600 16px system-ui, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = dateColor();
    const txt = now.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
      now.toLocaleDateString('en-US', { month: 'short' }) + ' ' + String(now.getDate()).padStart(2, '0');
    ctx.fillText(txt, d.x + DATE_W / 2, d.y + 1, DATE_W);
  }
  ctx.restore();
}

let hover = null, dragging = null;

function boxes() {
  const out = [{ kind: 'clock', x: state.clock.x - 4, y: state.clock.y - 4, w: CLOCK_W + 8, h: CLOCK_H + 8 }];
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
  for (const k of 'hmp') { c['color_r_' + k] = r; c['color_g_' + k] = g; c['color_b_' + k] = b; }
  const { x, y } = state.clock;
  c.x_hour = x; c.y_hour = y; c.x_min = x + 77; c.y_min = y; c.x_point = x + 62; c.y_point = y - 3;
  const d = lay.WATCH.text_month_week;
  const [dr, dg, db] = hexToRgb(dateColor());
  d.visible = state.date.visible ? 1 : 0;
  d.x = state.date.x; d.y = state.date.y;
  d.color_r = dr; d.color_g = dg; d.color_b = db;
  return lay;
}

function buildFile() {
  if (dirtyBg) { renderBg(); dirtyBg = false; }
  renderThumb();
  const bgPx = rgba565be(bgx.getImageData(0, 0, W0, H0).data);
  const pvPx = rgba565be(tx.getImageData(0, 0, W1, H1).data);
  return assemble(cjson(buildLayout()), bgPx, pvPx);
}

// ------------------------------------------------------------------ sources
async function useImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return toast('Please choose an image file', true);
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
    if (s) state = { ...structuredClone(DEFAULTS), ...s, clock: { ...DEFAULTS.clock, ...s.clock }, date: { ...DEFAULTS.date, ...s.date }, label: { ...DEFAULTS.label, ...s.label } };
    const src = localStorage.getItem('nfs.src');
    const keep = { zoom: state.zoom, panX: state.panX, panY: state.panY };
    if (src) { setSource(fitCanvas(await loadImage(src)), null, true); }
    else usePreset(state.presetId || 'nebula', !s);
    Object.assign(state, keep);
  } catch { usePreset('nebula'); }
  invalidate();
}

// ------------------------------------------------------------------ inputs
function syncInputs() {
  $$('.sliders input').forEach(inp => {
    const v = state[inp.dataset.key];
    if (document.activeElement !== inp) inp.value = v;
    const out = inp.nextElementSibling;
    out.textContent = inp.dataset.key === 'zoom' ? v.toFixed(2) + '×' : inp.dataset.key === 'dim' ? Math.round(v * 100) + '%' : inp.dataset.key === 'blur' ? v + 'px' : v + '%';
  });
  const set = (sel, v, prop = 'value') => { const el = $(sel); if (document.activeElement !== el) el[prop] = v; };
  set('#clockColor', state.color); set('#clockX', state.clock.x); set('#clockY', state.clock.y);
  set('#dateVisible', state.date.visible, 'checked'); set('#dateMatch', state.date.match, 'checked');
  set('#dateColor', dateColor()); $('#dateColor').disabled = state.date.match;
  set('#dateX', state.date.x); set('#dateY', state.date.y);
  set('#labelText', state.label.text); set('#labelColor', state.label.color);
  set('#labelSize', state.label.size); set('#labelFont', state.label.font);
  set('#faceId', state.faceId);
  $$('#swatches button').forEach(b => b.classList.toggle('on', b.dataset.c === state.color));
}

function bindInputs() {
  $$('.sliders input').forEach(inp => inp.addEventListener('input', () => { state[inp.dataset.key] = +inp.value; invalidate(); }));
  $('#resetAdjust').onclick = () => { Object.assign(state, { zoom: 1, panX: 0, panY: 0, bright: 100, sat: 100, blur: 0, dim: 0 }); invalidate(); };

  $('#clockColor').addEventListener('input', e => { state.color = e.target.value; invalidate(false); });
  const sw = ['#ffffff', '#fef3c7', '#fde047', '#fb923c', '#f43f5e', '#f0abfc', '#a78bfa', '#60a5fa', '#22d3ee', '#34d399', '#a3e635', '#111111'];
  $('#swatches').append(...sw.map(c => {
    const b = Object.assign(document.createElement('button'), { title: c });
    b.style.background = c; b.dataset.c = c;
    b.onclick = () => { state.color = c; invalidate(false); };
    return b;
  }));
  const num = (sel, fn) => $(sel).addEventListener('input', e => { if (e.target.value !== '') { fn(+e.target.value); invalidate(false); } });
  num('#clockX', v => (state.clock.x = clamp(Math.round(v), 0, W0 - CLOCK_W)));
  num('#clockY', v => (state.clock.y = clamp(Math.round(v), 3, H0 - CLOCK_H)));
  num('#dateX', v => (state.date.x = clamp(Math.round(v), 0, W0 - DATE_W)));
  num('#dateY', v => (state.date.y = clamp(Math.round(v), 0, H0 - DATE_H)));
  $('#centerClock').onclick = () => { state.clock.x = Math.round((W0 - CLOCK_W) / 2); state.date.x = Math.round((W0 - DATE_W) / 2); invalidate(false); };

  $('#dateVisible').onchange = e => { state.date.visible = e.target.checked; invalidate(false); };
  $('#dateMatch').onchange = e => { state.date.match = e.target.checked; if (!e.target.checked) state.date.color = state.color; invalidate(false); };
  $('#dateColor').addEventListener('input', e => { state.date.color = e.target.value; invalidate(false); });

  $('#labelText').addEventListener('input', e => { state.label.text = e.target.value; invalidate(); });
  $('#labelColor').addEventListener('input', e => { state.label.color = e.target.value; invalidate(); });
  $('#labelSize').addEventListener('input', e => { state.label.size = +e.target.value; invalidate(); });
  $('#labelFont').onchange = e => { state.label.font = e.target.value; invalidate(); };
  $('#faceId').addEventListener('input', e => { state.faceId = clamp(+e.target.value || DEFAULT_ID, 1, 65535); save(); });

  // background upload + drag & drop
  $('#imgInput').onchange = e => useImageFile(e.target.files[0]);
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => useImageFile(e.dataTransfer.files[0]));
  document.addEventListener('paste', e => { const f = [...(e.clipboardData?.files || [])][0]; if (f) useImageFile(f); });

  // presets
  $('#presets').append(...PRESETS.map(p => {
    const b = Object.assign(document.createElement('button'), { className: 'preset', title: p.name });
    b.dataset.id = p.id;
    const img = new Image(); img.alt = ''; img.src = p.draw().toDataURL('image/jpeg', 0.7);
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
      dragging.fx = (dragging.fx ?? state.clock.x) + dx; dragging.fy = (dragging.fy ?? state.clock.y) + dy;
      state.clock.x = clamp(Math.round(dragging.fx), 0, W0 - CLOCK_W);
      state.clock.y = clamp(Math.round(dragging.fy), 3, H0 - CLOCK_H);
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
      state = { ...keep, clock: { ...keep.clock }, date: { ...keep.date }, label: { ...keep.label } };
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
      if (tc) {
        state.clock = { x: clamp(tc.x_hour ?? 48, 0, W0 - CLOCK_W), y: clamp(tc.y_hour ?? 20, 3, H0 - CLOCK_H) };
        if (tc.color_r_h != null) state.color = rgbToHex(tc.color_r_h, tc.color_g_h, tc.color_b_h);
      }
      if (tm) {
        const col = rgbToHex(tm.color_r ?? 255, tm.color_g ?? 255, tm.color_b ?? 255);
        state.date = { ...state.date, x: clamp(tm.x ?? 27, 0, W0 - DATE_W), y: clamp(tm.y ?? 75, 0, H0 - DATE_H), visible: tm.visible !== 0, match: col === state.color, color: col };
      }
      const known = w.layout && Object.keys(w.layout.WATCH || {}).filter(k => !['image', 'text_clock', 'text_month_week'].includes(k));
      if (known?.length) info.push(`note: extra elements not editable here: ${known.join(', ')}`);
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
  refresh();
}

// ------------------------------------------------------------------ PWA
function bindPwa() {
  let deferred = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').hidden = false; });
  $('#installBtn').onclick = async () => { deferred?.prompt(); deferred = null; $('#installBtn').hidden = true; };
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ------------------------------------------------------------------ size info
function showSize() {
  $('#sizeInfo').textContent = `File size: ${(212660 / 1024).toFixed(0)} KB · about 880 Bluetooth packets`;
}

bindInputs(); bindCanvas(); bindFiles(); bindBle(); bindPwa(); showSize();
restore().then(bindLab);
