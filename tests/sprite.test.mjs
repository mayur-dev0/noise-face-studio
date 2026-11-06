// Run: node tests/sprite.test.mjs
// Re-encodes every hand sprite from the two captured NoiseFit analog faces and demands byte-identical output.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseWatch } from '../js/format.js';
import { decodeSprite, encodeSprite } from '../js/sprite.js';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'faces');
let total = 0, same = 0, firstBad = null;
for (const fn of ['analog_classic.watch', 'analog_color_x.watch']) {
  const p = join(dir, fn);
  if (!existsSync(p)) { console.log('SKIP', fn); continue; }
  const w = parseWatch(new Uint8Array(readFileSync(p)));
  for (const im of w.images.filter(i => i.z === 1)) {
    total++;
    const re = encodeSprite(decodeSprite(im.data));
    const eq = re.length === im.data.length && re.every((v, i) => v === im.data[i]);
    if (eq) same++;
    else if (!firstBad) {
      let at = 0; while (at < re.length && re[at] === im.data[at]) at++;
      firstBad = `${fn} sprite ${im.id}: lengths ${re.length} vs ${im.data.length}, first difference at byte ${at}`;
    }
  }
}
console.log(`${same === total ? 'PASS' : 'FAIL'} ${same}/${total} captured sprites re-encode byte-identical`);
if (firstBad) console.log('  ' + firstBad);
process.exit(same === total && total > 0 ? 0 : 1);
