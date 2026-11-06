// Run: node tests/format.test.mjs
// Checks the JS port against Node's crypto and (if present) the captured NoiseFit face.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { assemble, parseWatch, cjson, defaultLayout, md5hex, frames, byteSum, rgba565be, decode565be, W0, H0, W1, H1 } from '../js/format.js';

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; };
const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// md5 vs node for many lengths (covers padding edge cases)
let md5ok = true;
for (const n of [0, 1, 55, 56, 63, 64, 65, 119, 120, 1000, 212660]) {
  const b = new Uint8Array(n).map((_, i) => (i * 31 + 7) & 255);
  if (md5hex(b) !== createHash('md5').update(b).digest('hex')) { md5ok = false; console.log('  md5 mismatch at', n); }
}
ok(md5ok, 'md5 matches node:crypto');

// synthetic round trip
const bgRGBA = new Uint8ClampedArray(W0 * H0 * 4).map((_, i) => (i * 13) & 255);
const pvRGBA = new Uint8ClampedArray(W1 * H1 * 4).map((_, i) => (i * 7) & 255);
const file = assemble(cjson(defaultLayout()), rgba565be(bgRGBA), rgba565be(pvRGBA));
ok(file.length === 212660, `synthetic file size ${file.length} == 212660`);
const p = parseWatch(file);
ok(p.images.length === 2 && p.images[0].w === 240 && p.images[1].h === 210, 'parse image table');
ok(p.layout.WATCH.text_clock.x_hour === 48, 'parse layout JSON');
ok(eq(rgba565be(decode565be(p.images[0].data, W0, H0)), p.images[0].data), '565 decode/encode is lossless');

const fr = frames(file);
ok(fr[0].bytes.length === 21 && fr.at(-1).bytes.length === 38, 'head/end frame sizes');
ok(fr.filter(f => f.kind === 'data').every((f, i, a) => f.bytes.length === 244 || i === a.length - 1), 'data frames are 244 bytes');

// Compare with the real captured face, if this folder sits next to it.
const here = dirname(fileURLToPath(import.meta.url));
const orig = join(here, '..', '..', 'noise_face_original.watch');
if (existsSync(orig)) {
  const o = new Uint8Array(readFileSync(orig));
  const q = parseWatch(o);
  const rebuilt = assemble(q.layoutText, q.images[0].data, q.images[1].data);
  ok(eq(rebuilt, o), 'rebuilding noise_face_original.watch is byte-identical');
  ok(cjson(defaultLayout()) === q.layoutText, 'default layout text == captured layout text');
  const end = frames(o).at(-1).bytes;
  const hex = [...end].map(b => b.toString(16).padStart(2, '0')).join('');
  ok(hex === 'd103be4702013463643138653566333132613565616366353138336237386662633064316238',
     'end frame equals the one NoiseFit sent in the capture');
  ok(frames(o).filter(f => f.kind === 'data').length === 883, 'same number of data frames as capture (883)');
  console.log('  byte sum', byteSum(o).toString(16));
} else {
  console.log('SKIP capture comparison (noise_face_original.watch not found)');
}

if (fails) { console.log(`\n${fails} failure(s)`); process.exit(1); }
console.log('\nAll good.');
