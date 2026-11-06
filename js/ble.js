// Web Bluetooth uploader for Noise watches. Port of the transfer() routine in noise_face.py.
// Characteristics (16-bit UUIDs): 0AF1 = control, 0AF6 = command/data, 0AF7 = notifications.
import { frames, DEFAULT_ID } from './format.js';

export const bleSupported = () => typeof navigator !== 'undefined' && !!navigator.bluetooth && window.isSecureContext;

const hex = s => Uint8Array.from(s.match(/../g).map(h => parseInt(h, 16)));
const short = uuid => uuid.slice(4, 8).toLowerCase();
const toHex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');
const startsWith = (a, p) => a.length >= p.length && p.every((v, i) => a[i] === v);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const u32le = v => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, v >>> 0, true); return b; };
const cat = (...p) => { const o = new Uint8Array(p.reduce((a, x) => a + x.length, 0)); let i = 0; for (const x of p) { o.set(x, i); i += x.length; } return o; };

const PRE_A = ['0201', '0202', '0207', '0401f3000000', '0205', '0211'].map(h => ['ctl', hex(h)]);
const PRE_B = ['0801', '0907', '02f3', '02f3', '080701', '080702', '080301', '080302', '080401', '080402',
  '33daaddaad01100004001000001001000030e2',
  '33daaddaad01100004001100011001000000f0',
  '33daaddaad011000040012000010000000e3b5',
  '33daaddaad011000040013000110000000d3a7'].map(h => ['cmd', hex(h)]);
const PRE_C = ['0802', '0907', '02f3'].map(h => ['cmd', hex(h)]);

class NotifyQueue {
  constructor() { this.items = []; this.waiters = []; }
  push(v) {
    const w = this.waiters.shift();
    if (w) { clearTimeout(w.t); w.res(v); } else this.items.push(v);
  }
  get(ms) {
    if (this.items.length) return Promise.resolve(this.items.shift());
    return new Promise(res => {
      const w = { res };
      w.t = setTimeout(() => { const i = this.waiters.indexOf(w); if (i >= 0) this.waiters.splice(i, 1); res(null); }, ms);
      this.waiters.push(w);
    });
  }
}

export class NoiseLink {
  constructor({ log = console.log, verbose = false } = {}) {
    this.log = log; this.verbose = verbose;
    this.q = new NotifyQueue(); this.chars = {}; this.device = null;
    this.onDisconnect = null;
  }

  get connected() { return !!this.device?.gatt?.connected; }
  get name() { return this.device?.name || 'watch'; }

  async connect({ namePrefix = '' } = {}) {
    const opts = { optionalServices: [0x0af0, 0x2760] };
    if (namePrefix) opts.filters = [{ namePrefix }]; else opts.acceptAllDevices = true;
    this.device = await navigator.bluetooth.requestDevice(opts);
    this.device.addEventListener('gattserverdisconnected', () => { this.log('Disconnected.'); this.onDisconnect?.(); });
    this.log(`Connecting to ${this.name}…`);
    const server = await this.device.gatt.connect();
    let services = [];
    try { services = await server.getPrimaryServices(); } catch (e) { throw new Error('No Noise services found on this device (' + e.message + ')'); }
    this.chars = {};
    for (const s of services) {
      for (const c of await s.getCharacteristics()) {
        const id = short(c.uuid);
        this.chars[id] = c;
        if (c.properties.notify) {
          if (id === '0af7') c.addEventListener('characteristicvaluechanged', e => {
            const v = e.target.value;
            const b = new Uint8Array(v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength));
            if (this.verbose) this.log('  ← ' + toHex(b));
            this.q.push(b);
          });
          try { await c.startNotifications(); } catch (e) { this.log(`  (could not subscribe to ${id}: ${e.message})`); }
        }
      }
    }
    const missing = ['0af1', '0af6', '0af7'].filter(k => !this.chars[k]);
    if (missing.length) {
      this.disconnect();
      throw new Error(`This device does not expose the Noise face characteristics (missing ${missing.join(', ')}). Pick your watch, not another device.`);
    }
    this.log(`Connected to ${this.name}. Services: ${services.map(s => short(s.uuid)).join(', ')}`);
  }

  disconnect() { try { this.device?.gatt?.disconnect(); } catch { /* ignore */ } }

  async write(which, data) {
    const c = this.chars[which === 'cmd' ? '0af6' : '0af1'];
    if (this.verbose && data.length < 40) this.log(`  → ${which} ${toHex(data)}`);
    if (c.properties.writeWithoutResponse) await c.writeValueWithoutResponse(data);
    else await c.writeValueWithResponse(data);
  }

  async quiet(gap = 600, maxt = 8000) {
    const end = Date.now() + maxt;
    while (Date.now() < end) if ((await this.q.get(gap)) === null) return;
  }

  async expect(prefix, timeout) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const n = await this.q.get(Math.max(50, end - Date.now()));
      if (n === null) break;
      if (startsWith(n, prefix)) return n;
    }
    return null;
  }
}

/**
 * Send a .watch file. Mirrors NoiseFit's sequence from the capture.
 * onProgress(fraction 0..1, sentBytes, totalBytes)
 */
export async function transfer(link, data, { id = DEFAULT_ID, minimal = false, onProgress = () => {}, log = link.log } = {}) {
  if (!minimal) {
    log('Handshake (device info, time, sync)…');
    for (const [ch, p] of [...PRE_A, ...PRE_B]) { await link.write(ch, p); await link.quiet(); }
  }
  log('Entering face-install mode…');
  for (const [ch, p] of PRE_C) { await link.write(ch, p); await link.quiet(600, 4000); }

  await link.write('ctl', cat(hex('03e401'), u32le(id)));
  if (!await link.expect(hex('03e401'), 5000)) throw new Error('Watch did not answer the start command.');

  const total = data.length;
  let run = 0, sent = 0, burst = 0;
  const t0 = Date.now();
  for (const f of frames(data)) {
    await link.write('cmd', f.bytes);
    if (f.kind === 'head') {
      log('Watch is preparing storage (can take ~10 s)…');
      if (!await link.expect(hex('d101'), 40000)) throw new Error('No answer to file header.');
      log('Sending face data…');
    } else if (f.kind === 'ready') {
      if (!await link.expect(hex('d105'), 5000)) throw new Error('No answer to ready frame.');
    } else if (f.kind === 'data') {
      const body = f.bytes.subarray(3);
      for (let i = 0; i < body.length; i++) run = (run + body[i]) >>> 0;
      sent += body.length; burst++;
      await sleep(5);
      const last = sent >= total;
      if (burst === 10 || last) {
        const n = await link.expect(hex('d102'), burst === 10 ? 5000 : 600);
        if (n === null) {
          if (burst === 10) throw new Error(`Watch stopped acknowledging at ${sent} bytes.`);
        } else {
          const dv = new DataView(n.buffer, n.byteOffset, n.byteLength);
          const wsum = dv.getUint32(3, true), wcnt = dv.getUint32(7, true);
          if (wcnt !== sent || wsum !== run) throw new Error(`Watch disagrees at ${sent} bytes (sum ${wsum.toString(16)} vs ${run.toString(16)}, count ${wcnt}).`);
        }
        burst = 0;
        onProgress(sent / total, sent, total);
      }
    } else if (f.kind === 'end') {
      log('Verifying checksum…');
      if (!await link.expect(hex('d103'), 15000)) throw new Error('Watch did not confirm the file.');
    }
  }
  await link.write('ctl', cat(hex('03e403'), u32le(id)));
  await link.expect(hex('03e4'), 5000);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  log(`Done in ${secs} s. The watch accepted the face.`);
}
