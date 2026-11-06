// Run: node tests/transfer.test.mjs
// Drives ble.js transfer() against a simulated watch that answers like the real one did in the capture.
import { transfer } from '../js/ble.js';
import { assemble, cjson, defaultLayout, md5hex, byteSum } from '../js/format.js';

class FakeWatch {
  constructor() { this.buf = []; this.expected = 0; this.got = new Uint8Array(0); this.frames = 0; this.log = []; }
  attach(link) { this.link = link; }
  reply(...bytes) { setTimeout(() => this.link.q.push(Uint8Array.from(bytes.flat())), 2); }
  u32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }
  onWrite(which, d) {
    const h = [...d.subarray(0, 3)];
    if (which === 'ctl' && h[0] === 0x03 && h[1] === 0xe4) return this.reply(0x03, 0xe4, h[2], 0, 0, 0);
    if (which === 'ctl' || d[0] !== 0xd1) return this.reply([...d, 0, 0]);       // generic echo-ish ack
    if (d[1] === 0x01) { this.expected = new DataView(d.buffer, d.byteOffset).getUint32(3, true); return this.reply(0xd1, 0x01, 0x00); }
    if (d[1] === 0x05) return this.reply(0xd1, 0x05, 0x0a);
    if (d[1] === 0x02) {
      const n = new Uint8Array(this.got.length + d.length - 3); n.set(this.got); n.set(d.subarray(3), this.got.length); this.got = n;
      this.frames++;
      if (this.frames % 10 === 0 || this.got.length >= this.expected) this.reply(0xd1, 0x02, 0x00, this.u32(byteSum(this.got)), this.u32(this.got.length));
      return;
    }
    if (d[1] === 0x03) {
      const sum = new DataView(d.buffer, d.byteOffset).getUint32(2, true);
      const md5 = new TextDecoder().decode(d.subarray(6));
      this.ok = sum === byteSum(this.got) && md5 === md5hex(this.got) && this.got.length === this.expected;
      return this.reply(0xd1, 0x03, this.ok ? 0 : 1);
    }
  }
}

// Minimal link with the same queue semantics as NoiseLink (reuse its methods).
import { NoiseLink } from '../js/ble.js';
const watch = new FakeWatch();
const link = new NoiseLink({ log: () => {} });
link.write = async (which, data) => watch.onWrite(which, data);
watch.attach(link);

const bg = new Uint8Array(240 * 280 * 2).map((_, i) => i * 7);
const pv = new Uint8Array(184 * 210 * 2).map((_, i) => i * 3);
const file = assemble(cjson(defaultLayout()), bg, pv);

let last = 0;
await transfer(link, file, { minimal: true, onProgress: f => (last = f), log: () => {} });
const same = watch.got.length === file.length && watch.got.every((v, i) => v === file[i]);
console.log((same ? 'PASS' : 'FAIL') + ' watch received identical bytes');
console.log((watch.ok ? 'PASS' : 'FAIL') + ' checksum + md5 verified by fake watch');
console.log((last === 1 ? 'PASS' : 'FAIL') + ' progress reached 100%');
if (!same || !watch.ok || last !== 1) process.exit(1);
console.log('\nAll good.');
