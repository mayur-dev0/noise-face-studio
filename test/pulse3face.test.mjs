// node noise-face-web/test/pulse3face.test.mjs   (run from workspace root)
import { readFileSync, writeFileSync } from 'node:fs';
import { decodePulse3Face, encodePulse3Face, reencodePulse3Face, unpackContainer } from '../js/pulse3face.js';

const faces = ['captures/pulse3/faces/face_1_1423.bin', 'captures/pulse3/faces/face_2_659.bin'];
let fail = 0;
const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
for (const f of faces) {
  const bytes = new Uint8Array(readFileSync(f));
  const { images, layout } = decodePulse3Face(bytes);
  console.log(f, layout.name, images.length, 'images', layout.tail.map((r) => `${r.id}:${r.w}x${r.h}`).join(' '));
  const re = reencodePulse3Face(bytes);
  const ok = eq(re, bytes);
  console.log('  byte-identical re-encode:', ok); if (!ok) fail++;
  // cross-check vs python decoder raw dump if present
  try {
    const py = new Uint8Array(readFileSync(f.replace(/face_\d+_(\d+)\.bin/, 'decoded_$1/raw.bin')));
    const ok2 = eq(unpackContainer(bytes), py); console.log('  raw matches python:', ok2); if (!ok2) fail++;
  } catch { /* no python dump */ }
}
// new background
const W = 240, H = 280, bg = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const q = 4 * (y * W + x); const inC = (x - 120) ** 2 + (y - 140) ** 2 < 80 ** 2;
  bg[q] = inC ? 255 : (y * 255 / H) | 0; bg[q + 1] = inC ? 200 : 60; bg[q + 2] = inC ? 0 : 255 - ((y * 255 / H) | 0); bg[q + 3] = 255;
}
const tpl = new Uint8Array(readFileSync(faces[1]));
const out = encodePulse3Face(tpl, bg, W, H);
writeFileSync('captures/pulse3/faces/test_out_js.bin', out);
const d = decodePulse3Face(out);
const bgImg = d.images.find((i) => i.kind === 'tail' && i.id === 2);
let maxErr = 0; for (let i = 0; i < bg.length; i++) maxErr = Math.max(maxErr, Math.abs(bg[i] - bgImg.rgba[i]));
console.log('encoded', out.length, 'bytes; background max channel error (565 quantisation):', maxErr);
if (maxErr > 8) fail++;
// odd-sized input gets scaled
const small = encodePulse3Face(tpl, bg.subarray(0, 120 * 140 * 4), 120, 140); decodePulse3Face(small);
console.log(fail ? `FAIL (${fail})` : 'ALL OK'); process.exit(fail ? 1 : 0);
