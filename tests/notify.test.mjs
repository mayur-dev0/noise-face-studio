// Run: node tests/notify.test.mjs  (compares with packets NoiseFit sent in the capture)
import { buildNotification, buildCallFrames } from '../js/notify.js';
const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');
const t = 'Aai\u{1f496}';
const cases = [
  [hex(buildNotification('whatsapp', t, 'hiii', '', 8)), '33daaddaad0127000b000800000001000108000007000000416169f09f929600040000006869696909d6'],
  [hex(buildNotification('missed', t, 'Missed call', '+919423282845', 10)), '33daaddaad0140000b000a00000001010180000007000000416169f09f9296000d0000002b393139343233323832383435000b0000004d69737365642063616c6ca5f1'],
  [hex(buildNotification('sms', t, 'hiii', '+919423282845', 11)), '33daaddaad0139000b000b00000001010101000007000000416169f09f9296000d0000002b3931393432333238323834350004000000686969697f3a'],
  [buildCallFrames(t, '+919423282845').map(hex).join(','), '05010201070d416169f09f92962b393139343233,0501020232383238343500000000000000000000'],
];
let bad = 0;
cases.forEach(([g, e], i) => { const ok = g === e; if (!ok) bad++; console.log((ok ? 'PASS' : 'FAIL') + ' case ' + i + (ok ? '' : `\n got ${g}\n exp ${e}`)); });
if (bad) process.exit(1);
console.log('\nAll good.');
