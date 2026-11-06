// Notifications and incoming-call ringing for Noise watches.
// Decoded from the noise_analog_notify capture; byte-identical to what NoiseFit sends.
const enc = new TextEncoder();

export const APPS = {
  whatsapp: { id: 0x0008, phone: false, label: 'WhatsApp' },
  instagram: { id: 0x000A, phone: false, label: 'Instagram' },
  sms: { id: 0x0001, phone: true, label: 'SMS' },
  missed: { id: 0x0080, phone: true, label: 'Missed call' },
};

export function crc16(bytes) {
  let crc = 0xFFFF;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
  }
  return crc;
}

const cat = parts => { const o = new Uint8Array(parts.reduce((a, p) => a + p.length, 0)); let i = 0; for (const p of parts) { o.set(p, i); i += p.length; } return o; };
const lpStr = s => { const b = enc.encode(s); return cat([Uint8Array.from([0, b.length & 255, b.length >> 8, 0, 0]), b]); };

export function buildPacket(cmd, seq, payload) {
  const head = new Uint8Array(11);
  head.set([0xda, 0xad, 0xda, 0xad, 0x01]);
  const dv = new DataView(head.buffer);
  dv.setUint16(5, 11 + payload.length, true); dv.setUint16(7, cmd, true); dv.setUint16(9, seq, true);
  const inner = cat([head, payload]);
  const c = crc16(inner);
  return cat([Uint8Array.of(0x33), inner, Uint8Array.of(c & 255, c >> 8)]);
}

export function buildNotification(app, title, body, number = '', seq = 8) {
  const a = APPS[app] || APPS.whatsapp;
  const phone = a.phone || !!number;
  const flags = Uint8Array.of(0, 0, 1, phone ? 1 : 0, 1, a.id & 255, a.id >> 8);
  const parts = [flags, lpStr(title)];
  if (phone) parts.push(lpStr(number || title));
  parts.push(lpStr(body));
  return buildPacket(0x000B, seq, cat(parts));
}

export function buildCallFrames(name, number) {
  const nb = enc.encode(name).slice(0, 24), pb = enc.encode(number).slice(0, 20);
  const stream = cat([nb, pb]);
  const pad = (b, n) => { const o = new Uint8Array(n); o.set(b.slice(0, n)); return o; };
  const frames = [cat([Uint8Array.of(5, 1, 2, 1, nb.length, pb.length), pad(stream.slice(0, 14), 14)])];
  for (let i = 14, k = 2; i < stream.length; i += 16, k++) frames.push(cat([Uint8Array.of(5, 1, 2, k), pad(stream.slice(i, i + 16), 16)]));
  return frames;
}

let seq = 20 + Math.floor(Math.random() * 1000);

export async function sendNotification(link, app, title, body, number = '') {
  seq = (seq + 1) & 0xFFFF;
  await link.write('cmd', buildNotification(app, title, body, number, seq));
  return !!(await link.expect(Uint8Array.of(0x33, 0xda, 0xad, 0xda, 0xad), 4000));
}

export async function ringCall(link, name, number, seconds = 6, missed = true, log = () => {}) {
  for (const f of buildCallFrames(name, number)) { await link.write('ctl', f); await link.expect(Uint8Array.of(5, 1), 2000); }
  log(`Ringing as ${name} for ${seconds} s…`);
  await new Promise(r => setTimeout(r, seconds * 1000));
  await link.write('ctl', Uint8Array.of(5, 2, 2));
  await link.expect(Uint8Array.of(5, 2), 2000);
  if (missed) await sendNotification(link, 'missed', name, 'Missed call', number);
}
