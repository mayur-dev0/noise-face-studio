// node tools/preview_sheet.mjs  ->  tools/hands_sheet.png  (all presets over a dark dial at 10:09:36)
import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HAND_PRESETS, drawHand, capSprite } from '../js/hands.js';
import { spriteToRGBA } from '../js/sprite.js';

const here = dirname(fileURLToPath(import.meta.url));
const names = Object.keys(HAND_PRESETS), cols = 5, rows = Math.ceil(names.length / cols), W = 240, H = 280, pad = 8;
const SW = cols * (W + pad) + pad, SH = rows * (H + pad) + pad;
const img = new Uint8Array(SW * SH * 3).fill(24);

function dial(buf, ox, oy) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x - 120) / 120, (y - 140) / 140), v = 14 + Math.max(0, 1 - d) * 16;
    const o = ((oy + y) * SW + ox + x) * 3; buf[o] = v; buf[o + 1] = v; buf[o + 2] = v + 6;
  }
  for (let k = 0; k < 60; k++) {          // tick marks
    const a = k * Math.PI / 30, len = k % 5 === 0 ? 12 : 4;
    for (let t = 0; t < len; t++) {
      const r = Math.min(116 - t, 1e9), x = Math.round(120 + Math.sin(a) * r * 1.0), y = Math.round(140 - Math.cos(a) * (r + 20));
      if (x >= 0 && x < W && y >= 0 && y < H) { const o = ((oy + y) * SW + ox + x) * 3; buf[o] = buf[o + 1] = buf[o + 2] = k % 5 === 0 ? 210 : 110; }
    }
  }
}
function blit(buf, ox, oy, sprite) {
  const px = spriteToRGBA(sprite);
  for (let i = 0; i < W * H; i++) {
    const a = px[4 * i + 3] / 255; if (!a) continue;
    const x = i % W, y = (i / W) | 0, o = ((oy + y) * SW + ox + x) * 3;
    for (let c = 0; c < 3; c++) buf[o + c] = buf[o + c] * (1 - a) + px[4 * i + c] * a;
  }
}
names.forEach((n, i) => {
  const d = HAND_PRESETS[n], ox = pad + (i % cols) * (W + pad), oy = pad + ((i / cols) | 0) * (H + pad);
  dial(img, ox, oy);
  blit(img, ox, oy, drawHand('hour', d, 305));     // 10:09 -> hour hand about 304.5 deg
  blit(img, ox, oy, drawHand('minute', d, 54));
  blit(img, ox, oy, drawHand('second', d, 216));   // 36 s
  blit(img, ox, oy, capSprite(d));
});
// minimal PNG writer
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, data) => { const b = Buffer.alloc(12 + data.length); b.writeUInt32BE(data.length, 0); b.write(t, 4); Buffer.from(data).copy(b, 8); b.writeUInt32BE(crc(b.subarray(4, 8 + data.length)), 8 + data.length); return b; };
const raw = Buffer.alloc((SW * 3 + 1) * SH);
for (let y = 0; y < SH; y++) { raw[y * (SW * 3 + 1)] = 0; Buffer.from(img.subarray(y * SW * 3, (y + 1) * SW * 3)).copy(raw, y * (SW * 3 + 1) + 1); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(SW, 0); ihdr.writeUInt32BE(SH, 4); ihdr[8] = 8; ihdr[9] = 2;
writeFileSync(join(here, 'hands_sheet.png'), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', [])]));
console.log('wrote tools/hands_sheet.png', names.join(', '));
