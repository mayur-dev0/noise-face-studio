// Run: node tests/analog.test.mjs
// Checks that swapping the background of a captured analog face keeps every hand sprite intact.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseWatch, replaceWatchBackground, frames, W0, H0, W1, H1 } from '../js/format.js';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'faces');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

for (const fn of ['analog_classic.watch', 'analog_color_x.watch']) {
  const p = join(dir, fn);
  if (!existsSync(p)) { console.log('SKIP', fn); continue; }
  const orig = new Uint8Array(readFileSync(p));
  const a = parseWatch(orig);
  ok(a.images.length === 51, `${fn}: 51 images parsed`);
  ok(!!a.layout?.WATCH?.image_pointer_clock, `${fn}: has image_pointer_clock`);
  const bg = new Uint8Array(W0 * H0 * 2).fill(0x5a), pv = new Uint8Array(W1 * H1 * 2).fill(0xa5);
  const out = replaceWatchBackground(orig, bg, pv);
  const b = parseWatch(out);
  ok(out.length === orig.length, `${fn}: size unchanged (${out.length})`);
  ok(b.images[0].data.every(v => v === 0x5a) && b.images[1].data.every(v => v === 0xa5), `${fn}: new background + thumbnail written`);
  const same = a.images.slice(2).every((im, i) => {
    const o = b.images[i + 2].data;
    return o.length === im.data.length && o.every((v, k) => v === im.data[k]);
  });
  ok(same, `${fn}: all 49 hand/cap sprites byte-identical`);
  ok(a.layoutText === b.layoutText, `${fn}: layout untouched`);
  ok(frames(out).at(-1).bytes.length === 38, `${fn}: upload frames build`);
}
if (fails) process.exit(1);
console.log('\nAll good.');
