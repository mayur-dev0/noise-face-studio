// Run: node tests/hands.test.mjs
// 1. swapping the *original* sprites back in must reproduce the captured face byte for byte
// 2. every preset design builds a valid face that decodes cleanly and stays a sane size
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseWatch, frames } from '../js/format.js';
import { decodeSprite, encodeSprite, spriteToRGBA } from '../js/sprite.js';
import { replaceSprites, buildHandsFace, analogIds } from '../js/analog.js';
import { HAND_PRESETS, HAND_STYLES, SECOND_STYLES, CAP_STYLES } from '../js/hands.js';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'faces');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

for (const fn of ['analog_classic.watch', 'analog_color_x.watch']) {
  const p = join(dir, fn);
  if (!existsSync(p)) { console.log('SKIP', fn); continue; }
  const orig = new Uint8Array(readFileSync(p));
  const w = parseWatch(orig);
  const ids = analogIds(w);
  ok(ids.hour.length === 16 && ids.minute.length === 16 && ids.second.length === 16 && ids.cap.length === 1, `${fn}: hand ids ${ids.hour[0]}/${ids.minute[0]}/${ids.second[0]} cap ${ids.cap}`);
  const same = new Map(w.images.filter(i => i.z === 1).map(i => [i.id, encodeSprite(decodeSprite(i.data))]));
  const rebuilt = replaceSprites(orig, same);
  ok(rebuilt.length === orig.length && rebuilt.every((v, i) => v === orig[i]), `${fn}: rebuild with original sprites is byte-identical`);

  const tpl = new Uint8Array(readFileSync(p));
  for (const [key, design] of Object.entries(HAND_PRESETS)) {
    const t0 = Date.now();
    const out = buildHandsFace(tpl, design);
    const b = parseWatch(out);
    const sprites = b.images.filter(i => i.z === 1);
    let good = sprites.length === 49;
    let opaque = 0;
    for (const im of sprites) {
      const s = decodeSprite(im.data);
      const re = encodeSprite(s);
      if (re.length !== im.data.length || s.w !== 240 || s.h !== 280 || s.id !== im.id) good = false;
      for (const m of s.mask) if (m !== 255) opaque++;
    }
    const kb = out.length / 1024;
    ok(good && opaque > 5000 && kb < 900, `${fn} / ${key}: valid, ${kb.toFixed(0)} KB, ${opaque} painted px, ${Date.now() - t0} ms`);
    
    ok(frames(out).at(-1).bytes.length === 38, `${fn} / ${key}: upload frames build`);
  }
}
ok(Object.values(HAND_PRESETS).every(d => HAND_STYLES[d.hour.style] && HAND_STYLES[d.minute.style] && SECOND_STYLES[d.second.style] && CAP_STYLES[d.cap.style]), 'all preset styles exist');
if (fails) process.exit(1);
console.log('\nAll good.');
