// Noise watch face file format + upload framing.
// Direct port of noise_face.py (worked out from a NoiseFit Bluetooth capture, 240x280 screen).
// Pure functions only (no DOM) so they can be tested in Node.

export const W0 = 240, H0 = 280;   // background
export const W1 = 184, H1 = 210;   // face-picker preview
export const MAGIC = 0x00FFAA22;
export const FOOTER = Uint8Array.from([0xfa, 0xaa, 0xf2, 0xbb, 0xf1, 0xcc, 0xf1, 0xdd]);
export const FILE_NAME = 'cfg_res.watch';
export const DEFAULT_ID = 734;
export const CHUNK = 241;           // payload bytes per data frame (244-byte ATT writes)

// Key order matters: it is reproduced byte-for-byte in the file.
const LAYOUT = {
  HEAD: { WATCH_NUM: { num: 5 }, PREVIEW_NUM: { num: 1 } },
  WATCH: {
    image: { visible: 1, x: 0, y: 0, id: 0 },
    text_clock: {
      text_id: 50, visible: 1, use_point: 1,
      x_spacing_h: 5, x_spacing_m: 5,
      x_hour: 48, y_hour: 20, x_min: 125, y_min: 20,
      x_point: 110, y_point: 17,
      color_r_h: 255, color_g_h: 255, color_b_h: 255,
      color_r_m: 255, color_g_m: 255, color_b_m: 255,
      color_r_p: 255, color_g_p: 255, color_b_p: 255,
    },
    text_month_week: {
      text_id: 18, visible: 1, x_spacing: 1,
      month_abbreviation: 0, week_abbreviation: 0,
      x: 27, y: 75, w: 186, h: 20, align: 2,
      color_r: 255, color_g: 255, color_b: 255,
    },
  },
  PREVIEW: { image: { id1: 1, id2: 1 } },
};

export const defaultLayout = () => JSON.parse(JSON.stringify(LAYOUT));

// cJSON-style pretty print (tabs, "key":\tvalue) exactly like the watch's own files.
export function cjson(o, depth = 0) {
  if (o && typeof o === 'object') {
    const t = '\t'.repeat(depth + 1);
    const items = Object.entries(o).map(([k, v]) => `${t}"${k}":\t${cjson(v, depth + 1)}`).join(',\n');
    return `{\n${items}\n${'\t'.repeat(depth)}}`;
  }
  return String(o);
}

// RGBA (ImageData.data) -> RGB565 big-endian
export function rgba565be(rgba) {
  const n = rgba.length >> 2;
  const out = new Uint8Array(n * 2);
  for (let i = 0; i < n; i++) {
    const r = rgba[4 * i], g = rgba[4 * i + 1], b = rgba[4 * i + 2];
    const v = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
    out[2 * i] = v >> 8;
    out[2 * i + 1] = v & 255;
  }
  return out;
}

// RGB565 big-endian -> RGBA
export function decode565be(bytes, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = (bytes[2 * i] << 8) | bytes[2 * i + 1];
    const r = (v >> 11) & 31, g = (v >> 5) & 63, b = v & 31;
    out[4 * i] = (r << 3) | (r >> 2);
    out[4 * i + 1] = (g << 2) | (g >> 4);
    out[4 * i + 2] = (b << 3) | (b >> 2);
    out[4 * i + 3] = 255;
  }
  return out;
}

function concat(parts) {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function u32s(...vals) {
  const b = new Uint8Array(vals.length * 4), dv = new DataView(b.buffer);
  vals.forEach((v, i) => dv.setUint32(i * 4, v >>> 0, true));
  return b;
}

function imgEntry(id, w, h, offset) { // <HHHHII
  const b = new Uint8Array(16), dv = new DataView(b.buffer);
  dv.setUint16(0, id, true); dv.setUint16(2, w, true); dv.setUint16(4, h, true);
  dv.setUint16(6, 0, true); dv.setUint32(8, 2, true); dv.setUint32(12, offset, true);
  return b;
}

export function assemble(layoutText, bg, prev) {
  const txt = new TextEncoder().encode(layoutText);
  const jsLen = txt.length + 1;
  const js = new Uint8Array(jsLen + ((4 - (jsLen % 4)) % 4)).fill(0xfd);
  js.set(txt); js[txt.length] = 0;
  const tbl = concat([u32s(2), imgEntry(0, W0, H0, 8), imgEntry(1, W1, H1, 8 + bg.length)]);
  const imgs = concat([u32s(8, 0), bg, prev, FOOTER]);
  const head = u32s(MAGIC, 24, js.length, 24 + js.length, tbl.length, 24 + js.length + tbl.length, imgs.length);
  return concat([head, js, tbl, imgs]);
}

// Parse a .watch file (ours or a NoiseFit cloud face with the same container).
export function parseWatch(buf) {
  const d = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
  if (d.length < 28 || dv.getUint32(0, true) !== MAGIC) throw new Error('Not a Noise .watch file (bad magic)');
  const [jsLen, , tblLen, , imgsLen] = [2, 3, 4, 5, 6].map(i => dv.getUint32(i * 4, true));
  const jsStart = 28, tblStart = jsStart + jsLen, imgStart = tblStart + tblLen;
  if (imgStart + imgsLen > d.length) throw new Error('Truncated .watch file');
  const raw = d.subarray(jsStart, tblStart);
  const end = raw.indexOf(0);
  const layoutText = new TextDecoder().decode(raw.subarray(0, end < 0 ? raw.length : end));
  let layout = null;
  try { layout = JSON.parse(layoutText); } catch { /* keep text only */ }
  const count = dv.getUint32(tblStart, true);
  const images = [];
  for (let i = 0; i < count; i++) {
    const o = tblStart + 4 + i * 16;
    const id = dv.getUint16(o, true), w = dv.getUint16(o + 2, true), h = dv.getUint16(o + 4, true);
    const fmt = dv.getUint32(o + 8, true), off = dv.getUint32(o + 12, true);
    const start = imgStart + off;
    images.push({ id, w, h, fmt, offset: off, data: d.subarray(start, start + w * h * 2) });
  }
  return { layoutText, layout, images, size: d.length };
}

export function byteSum(data) {
  let s = 0;
  for (let i = 0; i < data.length; i++) s = (s + data[i]) >>> 0;
  return s;
}

// MD5 (needed for the end-of-transfer frame; WebCrypto has no MD5).
const K = new Int32Array(64).map((_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0);
const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
export function md5hex(bytes) {
  const n = bytes.length;
  const total = Math.ceil((n + 9) / 64) * 64;
  const buf = new Uint8Array(total);
  buf.set(bytes); buf[n] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, (n * 8) >>> 0, true);
  dv.setUint32(total - 4, Math.floor(n / 2 ** 29), true);
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  const M = new Int32Array(16);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) M[i] = dv.getInt32(off + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      const s = S[(i >> 4) * 4 + (i & 3)];
      F = (F + A + K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + ((F << s) | (F >>> (32 - s)))) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  const out = new Uint8Array(16), odv = new DataView(out.buffer);
  [a0, b0, c0, d0].forEach((v, i) => odv.setInt32(i * 4, v, true));
  return [...out].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Frames exactly as NoiseFit sends them on characteristic 0AF6.
export function frames(data) {
  const out = [];
  const head = new Uint8Array(3 + 4 + 1 + FILE_NAME.length);
  head.set([0xd1, 0x01, 0x13]);
  new DataView(head.buffer).setUint32(3, data.length, true);
  head[7] = 0;
  head.set(new TextEncoder().encode(FILE_NAME), 8);
  out.push({ kind: 'head', bytes: head });
  out.push({ kind: 'ready', bytes: Uint8Array.from([0xd1, 0x05, 0x0a]) });
  for (let i = 0; i < data.length; i += CHUNK) {
    const body = data.subarray(i, i + CHUNK);
    const f = new Uint8Array(3 + body.length);
    f.set([0xd1, 0x02, 0x00]); f.set(body, 3);
    out.push({ kind: 'data', bytes: f, len: body.length });
  }
  const end = new Uint8Array(2 + 4 + 32);
  end.set([0xd1, 0x03]);
  new DataView(end.buffer).setUint32(2, byteSum(data), true);
  end.set(new TextEncoder().encode(md5hex(data)), 6);
  out.push({ kind: 'end', bytes: end });
  return out;
}
