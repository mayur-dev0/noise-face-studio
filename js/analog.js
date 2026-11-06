// Builds a complete analog .watch file by swapping the hand sprites inside a captured template.
import { parseWatch } from './format.js';
import { encodeSprite } from './sprite.js';
import { handFrames, capSprite } from './hands.js';

const MARK_LEN = 8; // the faaaf2bbf1ccf1dd marker that precedes the sprite area

/** which sprite ids belong to which hand, according to the template's layout */
export function analogIds(w) {
  const pc = w.layout?.WATCH?.image_pointer_clock;
  if (!pc) throw new Error('This face has no analog clock (image_pointer_clock)');
  const sprites = w.images.filter(i => i.z === 1).map(i => i.id);
  const range = start => Array.from({ length: 16 }, (_, k) => start + k);
  const hour = range(pc.hour_id_start_time), minute = range(pc.min_id_start_time), second = range(pc.sec_id_start_time);
  const used = new Set([...hour, ...minute, ...second]);
  const cap = sprites.filter(id => !used.has(id));
  return { hour, minute, second, cap };
}

/** Replace sprite images by id (Map id -> encoded bytes). Everything else is copied untouched. */
export function replaceSprites(template, byId) {
  const d = template instanceof Uint8Array ? template : new Uint8Array(template);
  const w = parseWatch(d);
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
  const tblStart = 4 + dv.getUint32(12, true), imgStart = 4 + dv.getUint32(20, true);
  const hdr1 = dv.getUint32(imgStart + 4, true);
  const spriteBase = imgStart + hdr1 + MARK_LEN;
  const head = d.slice(0, spriteBase);                      // header, layout, table, bg, preview, marker
  const ents = w.images.map((im, i) => ({ im, i }));
  const chunks = [];
  let off = 0;
  const hdv = new DataView(head.buffer);
  for (const { im, i } of ents) {
    if (im.z !== 1) continue;
    const data = byId.get(im.id) ?? im.data;
    chunks.push(data);
    hdv.setUint32(tblStart + 4 + i * 16 + 12, off, true);
    off += data.length;
  }
  const out = new Uint8Array(head.length + off);
  out.set(head, 0);
  let p = head.length;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  new DataView(out.buffer).setUint32(24, out.length - imgStart, true);
  return out;
}

/** design JSON -> every sprite the face needs */
export function spritesForDesign(w, design) {
  const ids = analogIds(w);
  const byId = new Map();
  for (const kind of ['hour', 'minute', 'second']) {
    handFrames(kind, design).forEach((f, k) => byId.set(ids[kind][k], encodeSprite({ ...f, id: ids[kind][k] })));
  }
  const cap = capSprite(design);
  for (const id of ids.cap) byId.set(id, encodeSprite({ ...cap, id }));
  return byId;
}

export function buildHandsFace(template, design) {
  const d = template instanceof Uint8Array ? template : new Uint8Array(template);
  return replaceSprites(d, spritesForDesign(parseWatch(d), design));
}
