// Pulse 3 native face codec: decode -> re-encode must reproduce NoiseFit's bytes exactly,
// and a new background must survive encode -> decode (within RGB565 rounding).
import { readFileSync } from 'node:fs';
import { decodePulse3Face, reencodePulse3Face, encodePulse3Face } from '../js/pulse3face.js';

const load = f => new Uint8Array(readFileSync(new URL(`../faces/pulse3/${f}`, import.meta.url)));
let bad = 0;
const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) bad++; };

for (const f of ['face_1423.bin', 'face_659.bin']) {
  const b = load(f), d = decodePulse3Face(b);
  const bg = d.images.find(i => i.kind === 'tail' && i.id === 2);
  check(bg && bg.w === 240 && bg.h === 280, `${f}: background 240x280, ${d.images.length} images`);
  const r = reencodePulse3Face(b);
  check(r.length === b.length && r.every((v, i) => v === b[i]), `${f}: re-encode byte-identical (${b.length} B)`);
}

const W = 240, H = 280, px = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = 4 * (y * W + x); px[i] = x; px[i + 1] = y % 256; px[i + 2] = 128; px[i + 3] = 255; }
const out = encodePulse3Face(load('face_659.bin'), px, W, H);
const bg2 = decodePulse3Face(out).images.find(i => i.kind === 'tail' && i.id === 2);
let maxErr = 0; for (let i = 0; i < px.length; i += 4) for (let c = 0; c < 3; c++) maxErr = Math.max(maxErr, Math.abs(bg2.rgba[i + c] - px[i + c]));
check(maxErr <= 7, `custom background encodes/decodes (${out.length} B, max error ${maxErr})`);
if (bad) process.exit(1);
