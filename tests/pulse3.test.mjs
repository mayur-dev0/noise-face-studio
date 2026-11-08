// Replays a captured Pulse 3 face install against a fake watch and checks our bytes match NoiseFit's.
import { readFileSync, existsSync } from 'node:fs';
import { Pulse3, P3 } from '../js/pulse3.js';

const bin = new URL('../faces/pulse3/face_1423.bin', import.meta.url);
const cap = new URL('../faces/pulse3/face_1423.capture.hex', import.meta.url);
if (!existsSync(bin) || !existsSync(cap)) { console.log('SKIP pulse3 capture files missing'); process.exit(0); }
const data = new Uint8Array(readFileSync(bin));
const expected = readFileSync(cap, 'utf8').trim().split('\n');   // "uuid hex" per captured phone write
const toHex = b => Buffer.from(b).toString('hex');

const writes = [];
const link = { verbose: false, log: () => {}, chars: {} };
const p3 = new Pulse3(link);
for (const u of [P3.RX, P3.CMD, P3.FILE]) {
  link.chars[u] = { writeValueWithoutResponse: async v => {
    writes.push(`${u.slice(4, 8)} ${toHex(v)}`);
    if (u === P3.RX) return;
    queueMicrotask(() => {
      if (v.length === 6 && v[0] === 0 && v[2] === 0) p3.onNotify(u, new Uint8Array([0, 0, 1, 1, 0, 0]));
      else if (v[0] === 0 || true) {
        const ann = writes.filter(w => w.startsWith(u.slice(4, 8))).reverse().find(w => /^\S+ 00000000/.test(w));
        const n = parseInt(ann.slice(13, 15), 16), seq = v[0] | (v[1] << 8);
        if (v.length !== 6 && seq === n) {
          p3.onNotify(u, new Uint8Array([0, 0, 1, 0, 0, 0]));
          if (u === P3.CMD) setTimeout(() => reply([0x08, 0x53, 0x3a, 0x04, 0x2a, 0x02, 0x08, 0x00]), 1);
        }
      }
    });
  } };
}
async function reply(msg) {
  p3.onNotify(P3.RX, new Uint8Array([0, 0, 0, 0, 1, 0]));
  p3.onNotify(P3.RX, new Uint8Array([1, 0, ...msg]));
}
let sentChunks = 0;
const run = p3.installFace(data, '1423', { onProgress: f => { if (f === 1) setTimeout(() => reply([0x08, 0x54, 0x3a, 0x0a, 0x32, 0x08, 0x0a, 0x04, 0x31, 0x34, 0x32, 0x33, 0x10, 0x02]), 5); sentChunks++; } });
await run;
const mine = writes.filter(w => !w.startsWith('6f01'));
let ok = mine.length === expected.length, firstBad = -1;
for (let i = 0; i < Math.min(mine.length, expected.length); i++) if (mine[i] !== expected[i].trim()) { ok = false; firstBad = i; break; }
console.log(ok ? `PASS pulse3: ${mine.length} writes byte-identical to NoiseFit capture (${sentChunks} chunks)` :
  `FAIL pulse3 at write ${firstBad}: mine=${mine[firstBad]?.slice(0, 80)} cap=${expected[firstBad]?.slice(0, 80)} (counts ${mine.length}/${expected.length})`);
if (!ok) process.exit(1);
