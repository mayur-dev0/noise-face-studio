// Web Bluetooth uploader for Noise watches. Port of the transfer() routine in noise_face.py.
// Characteristics (16-bit UUIDs): 0AF1 = control, 0AF6 = command/data, 0AF7 = notifications.
import { frames, DEFAULT_ID } from './format.js';
import { Pulse3 } from './pulse3.js';

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

  // Known NoiseFit watch families. Add a new entry here when a new watch protocol is captured.
  static FAMILIES = [
    { id: 'pulse2', label: 'ColorFit Pulse 2 family (0AF0)', faces: true, need: ['0af1', '0af6', '0af7'] },
    { id: 'proto16186', label: 'ColorFit Pulse 3 family (16186F)', faces: false, native: 'pulse3',
      need: ['16186f01-0000-1000-8000-00807f9b34fb', '16186f02-0000-1000-8000-00807f9b34fb'] },
  ];

  async connect({ namePrefix = '' } = {}) {
    // Every watch service UUID referenced inside NoiseFit 5.5.0 (extracted from the APK), so any NoiseFit watch can be opened.
    const B = n => `0000${n}-0000-1000-8000-00805f9b34fb`;
    const V = n => `0000${n}-3c17-d293-8e48-14fe2e4da212`;
    const optionalServices = [
      ...['0af0', '2760', '27f0', 'aa01', 'aa02', 'aa03', 'aa04', 'aa05', 'ab02', 'fe78', 'fe59', 'fd50',
        'ff01', 'ff02', 'ff03', 'ff04', 'ff05', 'ffb1', 'ffb2', 'ffd1', 'ffd2', 'ffd3', 'ffd4', 'ffd5', 'ffd8',
        'fff1', 'fff2', 'fff3', 'fff6', 'ffff', '6666', '6006', '7006', '8001', '2001', '1601', '1701',
        '3802', '3d01', '3e01', '4a02', '180a', '180d', '180f'].map(B),
      ...['01ff', '02fd', '6287', '6387', '6487', '6587', '9966', 'aa55', 'd0ff'].map(V),
      '16186f00-0000-1000-8000-00807f9b34fb', '16186f01-0000-1000-8000-00807f9b34fb',
      '6e400001-b5a3-f393-e0a9-e50e24dcca9e', '6e400001-b5a3-f393-e0a9-e50e25dcca8d',
      '00010203-0405-0607-0809-0a0b0c0d1912', 'fe010000-1234-5678-abcd-00805f9b34fb',
      'a6ed0402-d344-460a-8075-b9e8ec90d71b',
    ];
    const opts = { optionalServices };
    if (namePrefix) opts.filters = [{ namePrefix }]; else opts.acceptAllDevices = true;
    this.device = await navigator.bluetooth.requestDevice(opts);
    this.device.addEventListener('gattserverdisconnected', () => { this.log('Disconnected.'); this.onDisconnect?.(); });
    this.log(`Connecting to ${this.name}…`);
    const server = await this.device.gatt.connect();
    let services = [];
    try { services = await server.getPrimaryServices(); } catch (e) { throw new Error('No NoiseFit services found on this device (' + e.message + ')'); }
    this.chars = {};
    for (const s of services) {
      let cs = [];
      try { cs = await s.getCharacteristics(); } catch { continue; }
      for (const c of cs) {
        const id = short(c.uuid);
        this.chars[id] = c;
        this.chars[c.uuid.toLowerCase()] = c;
        if (c.properties.notify) {
          c.addEventListener('characteristicvaluechanged', e => {
            const v = e.target.value;
            const b = new Uint8Array(v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength));
            if (this.verbose) this.log(`  ← ${id} ` + toHex(b));
            if (id === '0af7') this.q.push(b);
            const full = c.uuid.toLowerCase();
            if (full.startsWith('16186f0')) this.p3?.onNotify(full, b);
          });
          try { await c.startNotifications(); } catch (e) { this.log(`  (could not subscribe to ${id}: ${e.message})`); }
        }
      }
    }
    this.family = NoiseLink.FAMILIES.find(f => f.need.every(k => this.chars[k])) || null;
    const svcList = services.map(s => s.uuid.length > 8 && !s.uuid.endsWith('-0000-1000-8000-00805f9b34fb') ? s.uuid : short(s.uuid)).join(', ');
    const generic = services.filter(s => !['1800', '1801', '180a', '180f', '180d'].includes(short(s.uuid)));
    if (!this.family && generic.length) this.family = { id: 'generic', label: 'Other NoiseFit watch', faces: false, need: [] };
    if (!this.family) {
      this.disconnect();
      throw new Error(`No NoiseFit watch services found. Services: ${svcList || 'none'}. Pick your Noise watch, not another device.`);
    }
    this.log(`Connected to ${this.name} · ${this.family.label}. Services: ${svcList}`);
    if (this.family.id === 'proto16186') {
      this.p3 = new Pulse3(this);
      try { await this.p3.hello(); } catch { /* optional */ }
      this.log('ColorFit Pulse 3 protocol ready. Native Pulse 3 faces from Saved Faces can be installed.');
    } else if (!this.family.faces) this.log('⚠ This watch uses a NoiseFit protocol that is not decoded yet. Install one face from NoiseFit with Bluetooth HCI logging on so it can be captured.');
  }

  get canSendFaces() { return !!this.family?.faces; }

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
  if (link.family && !link.family.faces) throw new Error(`${link.name} is connected, but face upload for "${link.family.label}" is not supported yet.`);
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
