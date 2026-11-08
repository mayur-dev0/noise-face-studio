// Noise ColorFit Pulse 3 (BLE 16186F, zhapp SDK) native watch-face codec.
// Port of pulse3_face.py — see PULSE3_PROTOCOL.md "Face file format".
//   decodePulse3Face(bytes) -> { images:[{kind,id,frame,x,y,w,h,rgba}], layout, raw }
//   encodePulse3Face(templateBytes, rgbaBackground, w, h, opts?) -> Uint8Array
//   reencodePulse3Face(bytes) -> Uint8Array   (decode every image + rebuild; byte-identical proof)

const BLOCK = 4096;

// ------------------------------------------------------------------ CRCs
const ZH_TABLE = new Uint32Array([
  0x60454269, 0x46b94fc8, 0xe84aff3c, 0x914bdd8c, 0xd51f2ecf, 0x706cda12, 0x714bd769, 0xf44fd109,
  0x75ab709d, 0x3922e546, 0x9983d5ed, 0xe0ce529d, 0xd56de380, 0xdc38db5e, 0x631767dd, 0x1b49e4e5,
  0xe6ba93b7, 0xb09dda2b, 0x93b3f4f9, 0xacdc939d, 0x9f8e54d9, 0x3b048a03, 0xcbca8202, 0xc5243a13,
  0x2527160f, 0xd7744729, 0x8afbc395, 0xae85f196, 0x1d7426c8, 0x3d269dde, 0xc5d99079, 0x2fec0e54,
  0x7c058e1e, 0xfe1bf6ea, 0x9b4a2adf, 0x58287762, 0xaef4ca33, 0x9dc7a7f8, 0xb2cf2d61, 0x753c9e49,
  0x54259135, 0xc717df17, 0x7691e883, 0xec685a39, 0xf2dd2d80, 0x65accfd8, 0xe461a836, 0x6a3ca714,
  0x26e8a844, 0x137f5536, 0xd15f47c8, 0x6739f2c0, 0x51e5b15e, 0x362c90d8, 0x9928f212, 0x48ee7077,
  0xd3af0062, 0xcb77cbea, 0xbf3d3004, 0xe1a060c3, 0xd2d12ea2, 0x2467110f, 0xdd52ce38, 0xa50e1b37,
  0x2037b4f5, 0x9abab281, 0x738baa6b, 0xebf62ef4, 0x8ce1b7e7, 0x9efdcda2, 0x594cbe5b, 0x140f44e2,
  0x391f5e0e, 0x54fccbd2, 0x9836ce5b, 0x231dd482, 0x35453900, 0x255324dc, 0x1638ffec, 0x1b86cd9e,
  0xfbebd20e, 0x9c72b863, 0xfcce1404, 0xda4d47c4, 0x652d2782, 0xa86b57c7, 0x9337230b, 0x2c80c036,
  0x88584d9d, 0xa5bf8095, 0x1e59eb5d, 0xbff4a1f6, 0xd5336680, 0x1b667abb, 0xfe003b1b, 0x4bdbf5d0,
  0x4695354a, 0x46bc0da6, 0x22f81fd5, 0xdcc85c8d, 0xc5592a46, 0x210243c2, 0xf8ce204a, 0x55a2ecdb,
  0x302ea3eb, 0x22dbd600, 0x6558a27e, 0x203bf4f5, 0x68eca8e4, 0x48e7fb1a, 0x911ed357, 0xda6a5bbd,
  0xefb35f73, 0x2b263422, 0x25cdedc5, 0x1b97a159, 0x71e6a890, 0x8c579efc, 0xfd0736a1, 0x8068b26b,
  0x8f7a11f8, 0x6aef12eb, 0xebf98b50, 0xaef5e355, 0x7fd98589, 0x6249d41d, 0x5d50d84b, 0x930acf34,
  0xfcaf71bc, 0xfb8aaae6, 0x375077bd, 0xefba0986, 0xaacf8d46, 0x7fef096b, 0x8e5a44e2, 0x8ab919f8,
  0xc4e913d3, 0x5d7c50ba, 0xcba20ee0, 0xacdd7dfd, 0x78dcf345, 0xfc945786, 0x8b4af3a5, 0xe12ae39a,
  0xe478a534, 0xde28dd22, 0x2287e6fe, 0xa571bf42, 0xcc1892a1, 0x6ee5936b, 0xdea354eb, 0x4483c582,
  0xd665f09c, 0x7ef314f3, 0x332d89d4, 0x38e8152c, 0xf9e1e2e8, 0x520c944b, 0xb5dc35de, 0x6d98dee1,
  0x291839ba, 0xb5dbaab0, 0xc0cde96e, 0x3f1678d9, 0x8b497565, 0x6dfa7975, 0xfcb79bb0, 0x69778992,
  0x17844310, 0x9846fbe7, 0xb1557f9a, 0x39245a93, 0x75603f49, 0x5c059ad6, 0x15f64974, 0xd202dba3,
  0x77c564e4, 0x45e001b0, 0xbc86f5e8, 0xd845abed, 0x80ba7d65, 0xf65c242a, 0x61cfce88, 0x68f4c291,
  0xa66e8208, 0xdaa0fcf8, 0xd5114520, 0xa508726f, 0xb8840f5d, 0x73fe8e19, 0xc6cf3fa9, 0xccd3c924,
  0xeb34fcae, 0x5df955f9, 0xf58ec3aa, 0x152c5a44, 0x8650f4fe, 0xcb7db0d3, 0x14e9f000, 0x3c3b65d4,
  0x27dc1197, 0x53f71546, 0x5fa8dea2, 0x901de276, 0xb418dca4, 0xf8da4e3d, 0x321cf6fc, 0x6018f3dc,
  0xf57a333f, 0x555a5ce0, 0x397a1726, 0x1561efa4, 0x58775c48, 0xc5061386, 0xc644b639, 0x902a23c2,
  0x50fecb85, 0x7af0bf22, 0x8ee1772b, 0xeea4f838, 0xcd062a99, 0xe3ec789e, 0x7ad0817e, 0x31d67cf1,
  0x94ab96d5, 0x1bc984a4, 0xbb699fdf, 0x58320e9c, 0xf61e24d4, 0xe9a59fae, 0x9a6c0270, 0x8d3945b3,
  0xab23bb18, 0xb3294767, 0xd05482b7, 0x931e95f2, 0xb018bb04, 0x4ffddf3f, 0xadc902bc, 0x120f04d7,
  0x357f894f, 0x5989b031, 0x2a5cd646, 0x8699908d, 0xf62b5c52, 0x8ad1f6fb, 0xfc4de0e6, 0x31f58bc7,
  0x8cc2c7b4, 0xdbf222cd, 0x167a1385, 0x57ef98f4, 0x8c4bd22e, 0x446a99e0, 0x92179ea8, 0x334b5608,
]);
export function zhCrc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ ZH_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ 0xffffffff) >>> 0;
}
const Z_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
export function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = Z_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ------------------------------------------------------------------ byte helpers
class Buf {
  constructor() { this.a = new Uint8Array(1024); this.n = 0; }
  _g(k) { if (this.n + k > this.a.length) { let m = this.a.length * 2; while (m < this.n + k) m *= 2; const b = new Uint8Array(m); b.set(this.a.subarray(0, this.n)); this.a = b; } }
  push(v) { this._g(1); this.a[this.n++] = v & 0xff; }
  bytes(s) { this._g(s.length); this.a.set(s, this.n); this.n += s.length; }
  u16(v) { this.push(v); this.push(v >> 8); }
  u32(v) { this.push(v); this.push(v >> 8); this.push(v >> 16); this.push(v >>> 24); }
  out() { return this.a.slice(0, this.n); }
}
const rd16 = (d, o) => d[o] | (d[o + 1] << 8);
const rd32 = (d, o) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0;
const wr32 = (d, o, v) => { d[o] = v; d[o + 1] = v >> 8; d[o + 2] = v >> 16; d[o + 3] = v >>> 24; };
const concat = (arr) => { let n = 0; for (const a of arr) n += a.length; const o = new Uint8Array(n); let p = 0; for (const a of arr) { o.set(a, p); p += a.length; } return o; };

// ------------------------------------------------------------------ LZO1X
export function lzoDecompress(src) {
  const out = new Buf(); let ip = 0, state = 0;
  const ext = (base) => { let t = 0; while (src[ip] === 0) { t += 255; ip++; } t += base + src[ip++]; return t; };
  const lit = (k) => { out.bytes(src.subarray(ip, ip + k)); ip += k; };
  let t = src[ip];
  if (t > 17) { ip++; t -= 17; lit(t); state = t >= 4 ? 4 : t; }
  for (;;) {
    t = src[ip++]; let len, dist;
    if (t < 16) {
      if (state === 0) { if (t === 0) t = ext(15); lit(t + 3); state = 4; continue; }
      if (state === 4) { dist = 1 + 0x800 + (t >> 2) + (src[ip++] << 2); len = 3; }
      else { dist = 1 + (t >> 2) + (src[ip++] << 2); len = 2; }
    } else if (t >= 64) { len = (t >> 5) + 1; dist = 1 + ((t >> 2) & 7) + (src[ip++] << 3); }
    else if (t >= 32) { len = t & 31; if (len === 0) len = ext(31); len += 2; dist = 1 + (rd16(src, ip) >> 2); t = src[ip]; ip += 2; }
    else {
      len = t & 7; if (len === 0) len = ext(7); len += 2;
      dist = ((t & 8) << 11) + (rd16(src, ip) >> 2); const t2 = src[ip]; ip += 2;
      if (dist === 0) break;
      dist += 0x4000; t = t2;
    }
    let p = out.n - dist; if (p < 0) throw new Error('lzo: bad distance');
    out._g(len); for (let i = 0; i < len; i++) out.a[out.n++] = out.a[p + i];
    const s = t & 3; if (s) lit(s); state = s;
    if (ip >= src.length) break;
  }
  return out.out();
}

// LZO 2.10 lzo1x_1_compress (D_BITS=14, 4-byte match extension) — reproduces NoiseFit byte-exactly.
export function lzoCompress(data) {
  const inLen = data.length;
  const src = new Uint8Array(inLen + 16); src.set(data);
  const op = new Buf();
  const rd = (p) => (src[p] | (src[p + 1] << 8) | (src[p + 2] << 16) | (src[p + 3] << 24)) >>> 0;
  const emitLitLong = (t, ii) => {
    if (t <= 18) op.push(t - 3);
    else { let tt = t - 18; op.push(0); while (tt > 255) { tt -= 255; op.push(0); } op.push(tt); }
    op.bytes(src.subarray(ii, ii + t));
  };
  const doCompress = (base, ln, ti) => {
    const dict = new Uint16Array(1 << 14);
    const inEnd = base + ln, ipEnd = base + ln - 20;
    let ip = base, ii = ip;
    ip += ti < 4 ? 4 - ti : 0;
    for (;;) {
      ip += 1 + ((ip - ii) >> 5);
      for (;;) {
        if (ip >= ipEnd) return inEnd - (ii - ti);
        const dv = rd(ip);
        const di = (Math.imul(0x1824429d, dv) >>> 18) & 0x3fff;
        const mPos = base + dict[di];
        dict[di] = ip - base;
        if (dv !== rd(mPos)) break;
        ii -= ti; ti = 0;
        const t = ip - ii;
        if (t) {
          if (t <= 3) { op.a[op.n - 2] |= t; op.bytes(src.subarray(ii, ii + t)); }
          else if (t <= 16) { op.push(t - 3); op.bytes(src.subarray(ii, ii + t)); }
          else emitLitLong(t, ii);
        }
        let mLen = 4;
        for (;;) {
          let k = 0;
          while (k < 4 && src[ip + mLen + k] === src[mPos + mLen + k]) k++;
          if (k === 4) { mLen += 4; if (ip + mLen >= ipEnd) break; continue; }
          mLen += k; break;
        }
        let mOff = ip - mPos;
        ip += mLen; ii = ip;
        if (mLen <= 8 && mOff <= 0x800) { mOff -= 1; op.push(((mLen - 1) << 5) | ((mOff & 7) << 2)); op.push(mOff >> 3); }
        else if (mOff <= 0x4000) {
          mOff -= 1;
          if (mLen <= 33) op.push(32 | (mLen - 2));
          else { mLen -= 33; op.push(32); while (mLen > 255) { mLen -= 255; op.push(0); } op.push(mLen); }
          op.push(mOff << 2); op.push(mOff >> 6);
        } else {
          mOff -= 0x4000;
          if (mLen <= 9) op.push(16 | ((mOff >> 11) & 8) | (mLen - 2));
          else { mLen -= 9; op.push(16 | ((mOff >> 11) & 8)); while (mLen > 255) { mLen -= 255; op.push(0); } op.push(mLen); }
          op.push(mOff << 2); op.push(mOff >> 6);
        }
      }
    }
  };
  let ip = 0, l = inLen, t = 0;
  while (l > 20) { const ll = Math.min(l, 49152); t = doCompress(ip, ll, t); ip += ll; l -= ll; }
  t += l;
  if (t > 0) {
    const ii = inLen - t;
    if (op.n === 0 && t <= 238) { op.push(17 + t); op.bytes(src.subarray(ii, ii + t)); }
    else if (t <= 3) { op.a[op.n - 2] |= t; op.bytes(src.subarray(ii, ii + t)); }
    else emitLitLong(t, ii);
  }
  op.push(17); op.push(0); op.push(0);
  return op.out();
}

// ------------------------------------------------------------------ container
export function unpackContainer(d) {
  if (d[0x16] !== 0xaf || d[0x17] !== 0xaf || d[0x18] !== 0xaf || d[0x19] !== 0x02) throw new Error('bad magic');
  const rawSize = rd32(d, 0x1a);
  const n = rd16(d, 0x2e);
  let p = 0x30 + 2 * n; const parts = [];
  for (let i = 0; i < n; i++) {
    const s = rd16(d, 0x30 + 2 * i), len = s & 0x7fff;
    const blk = d.subarray(p, p + len);
    parts.push(s & 0x8000 ? lzoDecompress(blk) : blk.slice()); p += len;
  }
  const raw = concat(parts);
  if (raw.length !== rawSize) throw new Error('raw size mismatch');
  if (rd32(d, p) !== crc32(d.subarray(0, p))) throw new Error('file CRC mismatch');
  return raw;
}

export function packContainer(raw, template) {
  const blocks = [];
  for (let i = 0; i < raw.length; i += BLOCK) {
    const chunk = raw.subarray(i, i + BLOCK), c = lzoCompress(chunk);
    blocks.push(c.length >= chunk.length ? [chunk.length, chunk] : [0x8000 | c.length, c]);
  }
  const comp = concat(blocks.map((b) => b[1]));
  const o = new Buf();
  const h = new Uint8Array(0x16); h[1] = 0x10;
  if (template) h.set(template.subarray(0, 0x12));
  o.bytes(h); o.bytes([0xaf, 0xaf, 0xaf, 0x02]);
  o.u32(raw.length); o.u32(zhCrc32(raw)); o.u32(comp.length); o.u32(zhCrc32(comp));
  o.u32(0); o.u16(blocks.length);
  for (const b of blocks) o.u16(b[0]);
  o.bytes(comp);
  const out = o.out();
  wr32(out, 0x12, out.length + 4 - 0x1a);
  const f = new Uint8Array(out.length + 4); f.set(out); wr32(f, out.length, crc32(out));
  return f;
}

// ------------------------------------------------------------------ layout
function parseRecord(r, o) {
  return { id: r[o], x: rd16(r, o + 1), y: rd16(r, o + 3), w: rd16(r, o + 5), h: rd16(r, o + 7),
    frames: r[o + 9], compressed: r[o + 10], offset: rd32(r, o + 11), size: rd32(r, o + 15), rec: o };
}
export function parseRaw(raw) {
  const lay = {};
  lay.code = String.fromCharCode(...raw.subarray(0, 20));
  lay.name = new TextDecoder().decode(raw.subarray(21, 21 + raw[20]));
  lay.elemBase = rd32(raw, 0x51); lay.elemSize = rd32(raw, 0x55); lay.tailOff = rd32(raw, 0x59); lay.tailSize = rd32(raw, 0x5d);
  lay.elements = [];
  for (let k = 0; k < 68; k++) {
    const o = 0x82 + k * 0x70; let any = false;
    for (let i = 1; i < 0x70; i++) if (raw[o + i]) { any = true; break; }
    if (any) { const r = parseRecord(raw, o); r.abs = lay.elemBase + r.offset; lay.elements.push(r); }
  }
  lay.tail = [];
  const first = rd32(raw, lay.tailOff + 11);
  for (let o = lay.tailOff; o < lay.tailOff + first && raw[o] !== 0; o += 0x70) {
    const r = parseRecord(raw, o); r.abs = lay.tailOff + r.offset; lay.tail.push(r);
  }
  return lay;
}

// ------------------------------------------------------------------ pixels
function px(d, p, out, q) { // [alpha, RGB565 big-endian]
  const v = (d[p + 1] << 8) | d[p + 2], r = (v >> 11) & 31, g = (v >> 5) & 63, b = v & 31;
  out[q] = (r << 3) | (r >> 2); out[q + 1] = (g << 2) | (g >> 4); out[q + 2] = (b << 3) | (b >> 2); out[q + 3] = d[p];
}
function decodeFrame(d, w, h, compressed) {
  const out = new Uint8Array(w * h * 4);
  if (!compressed) { for (let i = 0; i < w * h; i++) px(d, 3 * i, out, 4 * i); return out; }
  for (let y = 0; y < h; y++) {
    const e = rd32(d, 4 * y); let p = e & 0x1fffff; const end = p + (e >>> 21); let q = y * w * 4;
    while (p < end) {
      const c = d[p++];
      if (c & 0x80) { for (let k = 0; k < (c & 0x7f); k++) { px(d, p, out, q); q += 4; } p += 3; }
      else { for (let k = 0; k < c; k++) { px(d, p, out, q); q += 4; p += 3; } }
    }
    if (q !== (y + 1) * w * 4) throw new Error('rle row length');
  }
  return out;
}
function decodeRecord(raw, rec) {
  const n = Math.max(1, rec.frames), fr = [];
  for (let i = 0; i < n; i++) fr.push(decodeFrame(raw.subarray(rec.abs + i * rec.size, rec.abs + (i + 1) * rec.size), rec.w, rec.h, rec.compressed));
  return fr;
}
const pxKey = (rgba, i) => {
  const r = rgba[4 * i], g = rgba[4 * i + 1], b = rgba[4 * i + 2], a = rgba[4 * i + 3];
  return (a << 16) | (((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3));
};
function encodeFrame(rgba, w, h, compressed) {
  const o = new Buf();
  const put = (k) => { o.push(k >> 16); o.push(k >> 8); o.push(k); };
  if (!compressed) { for (let i = 0; i < w * h; i++) put(pxKey(rgba, i)); return o.out(); }
  const rows = [];
  for (let y = 0; y < h; y++) {
    const r = new Buf(), row = []; for (let x = 0; x < w; x++) row.push(pxKey(rgba, y * w + x));
    let lit = [];
    const flush = () => { while (lit.length) { const k = lit.splice(0, 127); r.push(k.length); for (const v of k) { r.push(v >> 16); r.push(v >> 8); r.push(v); } } };
    let i = 0;
    while (i < w) {
      let j = i; while (j < w && row[j] === row[i] && j - i < 127) j++;
      if (j - i >= 3) { flush(); r.push(0x80 | (j - i)); r.push(row[i] >> 16); r.push(row[i] >> 8); r.push(row[i]); i = j; }
      else { lit.push(row[i]); i++; }
    }
    flush(); rows.push(r.out());
  }
  let off = 4 * h;
  for (const r of rows) { if (r.length >= 2048) throw new Error('row too long'); o.u32((off | (r.length << 21)) >>> 0); off += r.length; }
  for (const r of rows) o.bytes(r);
  return o.out();
}
function encodeFrames(frames, w, h, compressed) {
  const enc = frames.map((f) => encodeFrame(f, w, h, compressed));
  const stride = compressed ? ((Math.max(...enc.map((e) => e.length)) + 3) & ~3) : 3 * w * h;
  const out = new Uint8Array(stride * enc.length);
  enc.forEach((e, i) => out.set(e, i * stride));
  return { blob: out, stride };
}

function rebuildRaw(raw, lay, newImages) {
  const blobOf = (kind, rec) => {
    const k = kind + ':' + rec.id;
    if (newImages[k]) return encodeFrames(newImages[k], rec.w, rec.h, rec.compressed);
    const n = Math.max(1, rec.frames);
    return { blob: raw.slice(rec.abs, rec.abs + n * rec.size), stride: rec.size };
  };
  const elems = [...lay.elements].sort((a, b) => a.offset - b.offset);
  const pos = elems.length ? elems[0].offset : lay.elemSize;
  const head = raw.slice(0, lay.elemBase + pos);
  const edata = [];
  let cur = pos;
  for (const r of elems) { const { blob, stride } = blobOf('elem', r); wr32(head, r.rec + 11, cur); wr32(head, r.rec + 15, stride); edata.push(blob); cur += blob.length; }
  wr32(head, 0x55, cur); wr32(head, 0x59, lay.elemBase + cur);
  const tab = raw.slice(lay.tailOff, lay.tailOff + lay.tail.length * 0x70);
  const tdata = []; let tpos = tab.length;
  lay.tail.forEach((r, i) => { const { blob, stride } = blobOf('tail', r); wr32(tab, i * 0x70 + 11, tpos); wr32(tab, i * 0x70 + 15, stride); tdata.push(blob); tpos += blob.length; });
  wr32(head, 0x5d, tpos);
  const body = concat([head, ...edata, tab, ...tdata]);
  const out = new Uint8Array(body.length + 4); out.set(body); wr32(out, body.length, zhCrc32(body));
  return out;
}

// ------------------------------------------------------------------ simple raster ops (preview)
function sample(src, sw, sh, x, y, out, q) { // bilinear, premultiplied
  x = Math.min(Math.max(x, 0), sw - 1); y = Math.min(Math.max(y, 0), sh - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, sw - 1), y1 = Math.min(y0 + 1, sh - 1);
  const fx = x - x0, fy = y - y0; const acc = [0, 0, 0, 0];
  for (const [xx, yy, wgt] of [[x0, y0, (1 - fx) * (1 - fy)], [x1, y0, fx * (1 - fy)], [x0, y1, (1 - fx) * fy], [x1, y1, fx * fy]]) {
    const p = 4 * (yy * sw + xx), a = src[p + 3] * wgt;
    acc[0] += src[p] * a; acc[1] += src[p + 1] * a; acc[2] += src[p + 2] * a; acc[3] += a;
  }
  out[q + 3] = Math.round(acc[3]);
  for (let c = 0; c < 3; c++) out[q + c] = acc[3] ? Math.round(acc[c] / acc[3]) : 0;
}
export function resizeRGBA(src, sw, sh, dw, dh) {
  // box-filter downscale then bilinear; good enough for thumbnails/backgrounds
  const out = new Uint8Array(dw * dh * 4); const sx = sw / dw, sy = sh / dh;
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    if (sx <= 1 && sy <= 1) { sample(src, sw, sh, (x + 0.5) * sx - 0.5, (y + 0.5) * sy - 0.5, out, 4 * (y * dw + x)); continue; }
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = Math.floor(y * sy); yy < Math.min(sh, Math.ceil((y + 1) * sy)); yy++)
      for (let xx = Math.floor(x * sx); xx < Math.min(sw, Math.ceil((x + 1) * sx)); xx++) {
        const p = 4 * (yy * sw + xx), al = src[p + 3]; r += src[p] * al; g += src[p + 1] * al; b += src[p + 2] * al; a += al; n++;
      }
    const q = 4 * (y * dw + x);
    out[q] = a ? Math.round(r / a) : 0; out[q + 1] = a ? Math.round(g / a) : 0; out[q + 2] = a ? Math.round(b / a) : 0; out[q + 3] = Math.round(a / n);
  }
  return out;
}
function over(dst, dw, dh, src, sw, sh, ox, oy, angleDeg = 0, cx = 0, cy = 0) {
  const th = (angleDeg * Math.PI) / 180, cs = Math.cos(th), sn = Math.sin(th), tmp = new Uint8Array(4);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    let u = x, v = y;
    if (angleDeg) { const dx = x - cx, dy = y - cy; u = cx + dx * cs + dy * sn; v = cy - dx * sn + dy * cs; }
    u -= ox; v -= oy;
    if (u < -1 || v < -1 || u > sw || v > sh) continue;
    if (angleDeg) sample(src, sw, sh, u, v, tmp, 0);
    else { if (u < 0 || v < 0 || u >= sw || v >= sh) continue; const p = 4 * (v * sw + u); tmp[0] = src[p]; tmp[1] = src[p + 1]; tmp[2] = src[p + 2]; tmp[3] = src[p + 3]; }
    if (angleDeg && (u < 0 || v < 0 || u > sw - 1 || v > sh - 1)) tmp[3] = 0;
    const a = tmp[3] / 255; if (!a) continue;
    const q = 4 * (y * dw + x);
    for (let c = 0; c < 3; c++) dst[q + c] = Math.round(tmp[c] * a + dst[q + c] * (1 - a));
    dst[q + 3] = Math.round(255 * (a + (dst[q + 3] / 255) * (1 - a)));
  }
}
const HAND_ANGLES = { 0x42: 304, 0x43: 49, 0x44: 216 }; // 10:08:36

export function composePreview(raw, lay, bgRgba, { thumb = true } = {}) {
  const bg = lay.tail.find((r) => r.id === 2), pv = lay.tail.find((r) => r.id === 1);
  const W = bg.w, H = bg.h, canvas = new Uint8Array(bgRgba);
  for (const rec of lay.elements) {
    const f = decodeRecord(raw, rec)[0];
    const ang = HAND_ANGLES[rec.id];
    over(canvas, W, H, f, rec.w, rec.h, rec.x, rec.y, ang || 0, W / 2, H / 2);
  }
  return thumb ? resizeRGBA(canvas, W, H, pv.w, pv.h) : canvas;
}

// ------------------------------------------------------------------ public API
export function decodePulse3Face(bytes) {
  const raw = unpackContainer(bytes);
  const layout = parseRaw(raw);
  const images = [];
  for (const [kind, recs] of [['tail', layout.tail], ['elem', layout.elements]])
    for (const rec of recs) decodeRecord(raw, rec).forEach((rgba, frame) =>
      images.push({ kind, id: rec.id, frame, x: rec.x, y: rec.y, w: rec.w, h: rec.h, rgba }));
  // kind 'tail' id 1 = list thumbnail, id 2 = full-screen background; 'elem' 0x42/0x43/0x44 = hour/min/sec hands
  return { images, layout, raw };
}

export function reencodePulse3Face(bytes) {
  const raw = unpackContainer(bytes); const lay = parseRaw(raw); const imgs = {};
  for (const [kind, recs] of [['tail', lay.tail], ['elem', lay.elements]]) for (const r of recs) imgs[kind + ':' + r.id] = decodeRecord(raw, r);
  return packContainer(rebuildRaw(raw, lay, imgs), bytes);
}

/** Replace the background of a captured face (template) with `rgbaBackground` (w x h RGBA).
 *  The image is scaled to the template's background size (240x280 on Pulse 3) and flattened on black;
 *  the list thumbnail is regenerated unless opts.keepPreview. */
export function encodePulse3Face(templateBytes, rgbaBackground, w, h, opts = {}) {
  const raw = unpackContainer(templateBytes); const lay = parseRaw(raw);
  const bg = lay.tail.find((r) => r.id === 2);
  let img = (w === bg.w && h === bg.h) ? rgbaBackground : resizeRGBA(rgbaBackground, w, h, bg.w, bg.h);
  const flat = new Uint8Array(bg.w * bg.h * 4);
  for (let i = 0; i < bg.w * bg.h; i++) {
    const a = img[4 * i + 3] / 255;
    for (let c = 0; c < 3; c++) flat[4 * i + c] = Math.round(img[4 * i + c] * a);
    flat[4 * i + 3] = 255;
  }
  const imgs = { 'tail:2': [flat] };
  if (!opts.keepPreview) imgs['tail:1'] = [composePreview(raw, lay, flat)];
  const out = packContainer(rebuildRaw(raw, lay, imgs), templateBytes);
  unpackContainer(out); // self-check
  return out;
}
