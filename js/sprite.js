// Noise analog-hand sprite codec ("z=1" images in a .watch file).
//
// Layout of one sprite (all little-endian), reverse-engineered from NoiseFit analog faces:
//   12 bytes   header: pivotX, pivotY, width, height, imageId, 0            (u16 each)
//   h * 8      row table: 0, blockOffset, 0, pixelEndOffset                (u16 each)
//   blocks     per row: u16 L, L-4 bytes of 12-byte spans, u16 trailer
//                span = x0, x1, mask (0=opaque, 255=transparent), 0 (u16) + pixelOffset (u32)
//                trailer = number of spans in the NEXT row
//                the last row is the fixed 4 bytes "04 00 fa aa", then "f1 bb f1 cc f1 dd"
//   pixels     RGB565 big-endian, in span order; pixelOffset counts from the start of this area
//
// A span is a run of x-adjacent pixels that share the same mask value.

export const SPRITE_W = 240, SPRITE_H = 280, PIVOT_X = 120, PIVOT_Y = 140;
export const SPRITE_MARK = Uint8Array.from([0xf1, 0xbb, 0xf1, 0xcc, 0xf1, 0xdd]);

const rd16 = (d, o) => d[o] | (d[o + 1] << 8);
const rd32 = (d, o) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0;

/** bytes -> { id, pivotX, pivotY, w, h, mask: Uint8Array(w*h) (255 = empty), rgb: Uint16Array(w*h) } */
export function decodeSprite(b) {
  const pivotX = rd16(b, 0), pivotY = rd16(b, 2), w = rd16(b, 4), h = rd16(b, 6), id = rd16(b, 8);
  const area = 12 + h * 8;
  const mask = new Uint8Array(w * h).fill(255), rgb = new Uint16Array(w * h);
  // pixel area starts after the last block (4 bytes) + the 6-byte marker
  const lastB = rd16(b, 12 + (h - 1) * 8 + 2);
  const pxBase = area + lastB + 4 + SPRITE_MARK.length;
  for (let y = 0; y < h - 1; y++) {
    const blk = area + rd16(b, 12 + y * 8 + 2);
    const L = rd16(b, blk), n = (L - 4) / 12;
    for (let k = 0; k < n; k++) {
      const o = blk + 2 + k * 12;
      const x0 = rd16(b, o), x1 = rd16(b, o + 2), m = rd16(b, o + 4), po = pxBase + rd32(b, o + 8);
      for (let x = x0; x <= x1; x++) {
        const p = po + (x - x0) * 2;
        mask[y * w + x] = m; rgb[y * w + x] = (b[p] << 8) | b[p + 1];
      }
    }
  }
  return { id, pivotX, pivotY, w, h, mask, rgb };
}

/** inverse of decodeSprite. Pixels with mask 255 are skipped. */
export function encodeSprite(s) {
  const { w, h, mask, rgb } = s;
  const rows = [];
  let pxBytes = 0;
  for (let y = 0; y < h; y++) {
    const spans = [];
    if (y < h - 1) {
      let x = 0;
      while (x < w) {
        const m = mask[y * w + x];
        if (m === 255) { x++; continue; }
        let x1 = x;
        while (x1 + 1 < w && mask[y * w + x1 + 1] === m) x1++;
        spans.push({ x0: x, x1, m, px: pxBytes });
        pxBytes += (x1 - x + 1) * 2;
        x = x1 + 1;
      }
    }
    rows.push({ spans, endPx: pxBytes });
  }
  const area = 12 + h * 8;
  let blocksLen = 0;
  const blockOff = rows.map((r, y) => { const o = blocksLen; blocksLen += y === h - 1 ? 4 : 4 + 12 * r.spans.length; return o; });
  const total = area + blocksLen + SPRITE_MARK.length + pxBytes;
  const out = new Uint8Array(total), dv = new DataView(out.buffer);
  [s.pivotX ?? PIVOT_X, s.pivotY ?? PIVOT_Y, w, h, s.id, 0].forEach((v, i) => dv.setUint16(i * 2, v, true));
  rows.forEach((r, y) => {
    const e = 12 + y * 8;
    dv.setUint16(e + 2, blockOff[y], true);
    dv.setUint16(e + 6, y === h - 1 ? 0 : r.endPx, true);
    let o = area + blockOff[y];
    if (y === h - 1) { out.set([0x04, 0x00, 0xfa, 0xaa], o); return; }
    dv.setUint16(o, 4 + 12 * r.spans.length, true); o += 2;
    for (const sp of r.spans) {
      dv.setUint16(o, sp.x0, true); dv.setUint16(o + 2, sp.x1, true); dv.setUint16(o + 4, sp.m, true);
      dv.setUint16(o + 6, 0, true); dv.setUint32(o + 8, sp.px, true); o += 12;
    }
    dv.setUint16(o, rows[y + 1].spans.length, true);
  });
  out.set(SPRITE_MARK, area + blocksLen);
  let p = area + blocksLen + SPRITE_MARK.length;
  for (let y = 0; y < h - 1; y++) for (const sp of rows[y].spans) {
    for (let x = sp.x0; x <= sp.x1; x++) { const v = rgb[y * w + x]; out[p++] = v >> 8; out[p++] = v & 255; }
  }
  return out;
}

/** straight RGBA (Uint8ClampedArray, w*h*4) for previews */
export function spriteToRGBA(s) {
  const out = new Uint8ClampedArray(s.w * s.h * 4);
  for (let i = 0; i < s.w * s.h; i++) {
    if (s.mask[i] === 255) continue;
    const v = s.rgb[i], r = (v >> 11) & 31, g = (v >> 5) & 63, b = v & 31;
    out[4 * i] = (r << 3) | (r >> 2); out[4 * i + 1] = (g << 2) | (g >> 4); out[4 * i + 2] = (b << 3) | (b >> 2);
    out[4 * i + 3] = 255 - s.mask[i];
  }
  return out;
}
