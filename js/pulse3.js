// ColorFit Pulse 3 / newer NoiseFit watches (GATT service 16186F00). Decoded from a NoiseFit 5.5.0 capture.
//
// Every characteristic uses the same framed exchange, in both directions:
//   sender  → 00 00 00 00 NN 00        announce NN frames (u16 LE at byte 4)
//   receiver→ 00 00 01 01 00 00        ready
//   sender  → SS SS <payload…>         NN frames, SS = 1-based frame number (u16 LE)
//   receiver→ 00 00 01 00 00 00        done
// 16186F02: phone → watch commands (protobuf).  16186F01: watch → phone replies (protobuf).
// 16186F04: phone → watch face file. The file is cut into 3846-byte chunks; each chunk is sent as one
//           framed message prefixed with u16 totalChunks + u16 chunkIndex (1-based), in 175-byte frames.
// Install = command 0x53 {7:{4:{1:"<faceId>", 2:KB, 3:KB, 4:1}}}, watch answers 0x53 ok, then the
// chunks, then the watch sends 0x54 {7:{6:{1:"<faceId>", 2:2}}} when the face is stored.

const U = n => `16186f0${n}-0000-1000-8000-00807f9b34fb`;
export const P3 = { RX: U(1), CMD: U(2), FILE: U(4) };
const CHUNK = 3846, FRAME = 175;
const READY = [0, 0, 1, 1, 0, 0], DONE = [0, 0, 1, 0, 0, 0];
const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const u16 = v => [v & 255, (v >> 8) & 255];

function varint(n) { const o = []; do { let b = n & 127; n = Math.floor(n / 128); if (n) b |= 128; o.push(b); } while (n); return o; }
const lenField = (tag, bytes) => [tag, ...varint(bytes.length), ...bytes];

export class Pulse3 {
  constructor(link) {
    this.link = link; this.waiters = []; this.inbox = []; this.rx = null;
  }
  get log() { return this.link.log; }

  // Called by NoiseLink for every notification on a 16186F characteristic.
  onNotify(uuid, b) {
    if (uuid === P3.RX) return this.onRxChannel(b);
    this.resolve(w => w.uuid === uuid && eq(b, w.want), b);
  }

  // Watch → phone framed messages on 16186F01: we play the receiver role.
  async onRxChannel(b) {
    const c = this.link.chars[P3.RX];
    if (b.length === 6 && b[0] === 0 && b[1] === 0 && b[2] === 0) {
      this.rx = { n: b[4] | (b[5] << 8), parts: [] };
      await c.writeValueWithoutResponse(new Uint8Array(READY)).catch(() => {});
      return;
    }
    if (!this.rx) return;
    this.rx.parts.push(b.subarray(2));
    if (this.rx.parts.length >= this.rx.n) {
      const msg = new Uint8Array(this.rx.parts.reduce((a, p) => a + p.length, 0));
      let i = 0; for (const p of this.rx.parts) { msg.set(p, i); i += p.length; }
      this.rx = null;
      await c.writeValueWithoutResponse(new Uint8Array(DONE)).catch(() => {});
      if (this.link.verbose) this.log('  ⇠ ' + hex(msg));
      if (!this.resolve(w => w.uuid === 'msg' && msg[0] === 0x08 && msg[1] === w.want, msg)) this.inbox.push(msg);
    }
  }

  resolve(match, val) {
    const i = this.waiters.findIndex(match);
    if (i < 0) return false;
    const [w] = this.waiters.splice(i, 1); clearTimeout(w.t); w.res(val); return true;
  }
  wait(uuid, want, ms, what) {
    if (uuid === 'msg') { const j = this.inbox.findIndex(m => m[1] === want); if (j >= 0) return Promise.resolve(this.inbox.splice(j, 1)[0]); }
    return new Promise((res, rej) => {
      const w = { uuid, want, res };
      w.t = setTimeout(() => { this.waiters.splice(this.waiters.indexOf(w), 1); rej(new Error(`Watch did not answer (${what}).`)); }, ms);
      this.waiters.push(w);
    });
  }

  // Send one framed message on a characteristic.
  async sendFramed(uuid, payload) {
    const c = this.link.chars[uuid];
    if (!c) throw new Error('Missing characteristic ' + uuid);
    const frames = [];
    for (let i = 0; i < payload.length; i += FRAME) frames.push(payload.subarray(i, i + FRAME));
    const ready = this.wait(uuid, READY, 8000, 'ready');
    await c.writeValueWithoutResponse(new Uint8Array([0, 0, 0, 0, ...u16(frames.length)]));
    await ready;
    const done = this.wait(uuid, DONE, 15000, 'chunk received');
    for (let i = 0; i < frames.length; i++) {
      const f = new Uint8Array(2 + frames[i].length); f.set(u16(i + 1)); f.set(frames[i], 2);
      await c.writeValueWithoutResponse(f);
      await sleep(4);
    }
    await done;
  }

  async command(bytes, reply, ms = 8000) {
    const p = reply != null ? this.wait('msg', reply, ms, 'command 0x' + reply.toString(16)) : null;
    await this.sendFramed(P3.CMD, new Uint8Array(bytes));
    return p ? p : null;
  }

  async hello() {
    await this.command([0x08, 0x00, 0x9a, 0x06, 0x02, 0x20, 0x00], 0x00).catch(() => {});
    const now = Math.floor(Date.now() / 1000), tz = Math.round(-new Date().getTimezoneOffset() / 15);
    const t = [0x08, ...varint(now), 0x10, ...varint(tz < 0 ? tz + 256 : tz)];
    await this.command([0x08, 0x30, ...lenField(0x2a, lenField(0x0a, t))], 0x30).catch(() => {});
  }

  /** Install a native Pulse-3 face file (as captured from NoiseFit). */
  async installFace(data, faceId, { onProgress = () => {} } = {}) {
    const kb = Math.ceil(data.length / 1024);
    const idb = [...new TextEncoder().encode(String(faceId))];
    const inner = [...lenField(0x0a, idb), 0x10, ...varint(kb), 0x18, ...varint(kb), 0x20, 0x01];
    this.log(`Asking watch to accept face ${faceId} (${kb} KB)…`);
    const ok = await this.command([0x08, 0x53, ...lenField(0x3a, lenField(0x22, inner))], 0x53);
    if (this.link.verbose) this.log('  accept → ' + hex(ok));
    const total = Math.ceil(data.length / CHUNK);
    for (let i = 0; i < total; i++) {
      const part = data.subarray(i * CHUNK, (i + 1) * CHUNK);
      const msg = new Uint8Array(4 + part.length); msg.set([...u16(total), ...u16(i + 1)]); msg.set(part, 4);
      await this.sendFramed(P3.FILE, msg);
      onProgress((i + 1) / total, Math.min(data.length, (i + 1) * CHUNK), data.length);
    }
    this.log('Waiting for the watch to store the face…');
    const fin = await this.wait('msg', 0x54, 30000, 'install result');
    this.log('Watch reply: ' + hex(fin));
  }
}
