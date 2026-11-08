// Run: node tests/motion.test.mjs
// Verifies that every moving-digital preset builds 49 valid hardware sprites
// and assembles into a valid hybrid (text_clock + image_pointer_clock) .watch file.
import { W0, H0, W1, H1, defaultLayout, cjson, rgba565be, assemble, parseWatch, frames } from '../js/format.js';
import { decodeSprite, encodeSprite } from '../js/sprite.js';
import {
  VIDEO_SCENES,
  renderSceneRgba,
  buildVideoWatchSprites,
  MOTION_PRESETS,
  FAST_STYLES,
  MEDIUM_STYLES,
  SLOW_STYLES,
  TRACK_STYLES,
  buildMotionSprites,
} from '../js/motion.js';

let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

ok(Object.keys(VIDEO_SCENES).length >= 8 && !!VIDEO_SCENES.koi_sphere, '8+ 10 FPS VIDEO_SCENES exist including koi_sphere (Default #2)');

// Test 10 FPS VIDEO_SCENES rendering + differential RLE sprite packing
for (const [sceneKey, sc] of Object.entries(VIDEO_SCENES)) {
  const t0 = Date.now();
  const baseRgba = renderSceneRgba(sceneKey, 0, 16, { accentColor: sc.accent, secondaryColor: sc.secondary, backgroundOnly: true });
  const f0 = renderSceneRgba(sceneKey, 0, 16, { accentColor: sc.accent, secondaryColor: sc.secondary });
  const f4 = renderSceneRgba(sceneKey, 4, 16, { accentColor: sc.accent, secondaryColor: sc.secondary });
  let diff04 = 0;
  for (let i = 0; i < f0.length; i += 4) {
    if (f0[i] !== f4[i] || f0[i + 1] !== f4[i + 1] || f0[i + 2] !== f4[i + 2]) diff04++;
  }
  ok(f0.length === W0 * H0 * 4 && diff04 > 200, `10fps ${sceneKey}: frames animate across time (${diff04} moving pixels between frame 0 and 4)`);

  const sprites = buildMotionSprites({
    mode: 'video10fps',
    scene: sceneKey,
    accentColor: sc.accent,
    secondaryColor: sc.secondary,
  });
  ok(sprites.length === 49, `10fps ${sceneKey}: generated 49 hardware sprites`);
  const bg565 = rgba565be(baseRgba);
  const pv565 = new Uint8Array(W1 * H1 * 2).fill(0x22);
  const lay = defaultLayout();
  lay.WATCH = {
    image: lay.WATCH.image,
    image_pointer_clock: { visible: 1, hour_id_start_time: 34, min_id_start_time: 2, sec_id_start_time: 18 },
    text_clock: lay.WATCH.text_clock,
    text_month_week: lay.WATCH.text_month_week,
  };
  const watchBytes = assemble(cjson(lay), bg565, pv565, sprites);
  const parsed = parseWatch(watchBytes);
  const dec18 = decodeSprite(parsed.images.find(i => i.id === 18).data);
  const dec22 = decodeSprite(parsed.images.find(i => i.id === 22).data);
  let nonZero18 = 0, diffSpr = 0;
  for (let p = 0; p < dec18.rgb.length; p++) {
    if (dec18.mask[p] === 0 && dec18.rgb[p] !== 0) nonZero18++;
    if (dec18.rgb[p] !== dec22.rgb[p]) diffSpr++;
  }
  const kb = watchBytes.length / 1024;
  ok(
    parsed.images.length === 51 && kb < 800 && nonZero18 > 500 && diffSpr > 100,
    `10fps ${sceneKey}: assembled valid .watch (${kb.toFixed(0)} KB, ${nonZero18} non-black RGB565 px, ${diffSpr} changing sprite px in ${Date.now() - t0} ms)`
  );
}

ok(
  Object.values(MOTION_PRESETS).every(
    d => FAST_STYLES[d.fast.style] && MEDIUM_STYLES[d.medium.style] && SLOW_STYLES[d.slow.style] && TRACK_STYLES[d.track.style]
  ),
  'all motion preset styles exist'
);

const bg = new Uint8Array(W0 * H0 * 2).fill(0x11);
const pv = new Uint8Array(W1 * H1 * 2).fill(0x22);

for (const [key, preset] of Object.entries(MOTION_PRESETS)) {
  const t0 = Date.now();
  const sprites = buildMotionSprites(preset);
  ok(sprites.length === 49, `${key}: generated 49 sprites (ids ${sprites[0]?.id}..${sprites.at(-1)?.id})`);

  const lay = defaultLayout();
  lay.WATCH.image_pointer_clock = { visible: 1, hour_id_start_time: 34, min_id_start_time: 2, sec_id_start_time: 18 };
  lay.WATCH.image__2 = { visible: 1, x: 0, y: 0, id: 50 };

  const watchBytes = assemble(cjson(lay), bg, pv, sprites);
  const parsed = parseWatch(watchBytes);
  const z1 = parsed.images.filter(i => i.z === 1);

  let validSprites = z1.length === 49;
  let paintedPx = 0;
  for (const im of z1) {
    const dec = decodeSprite(im.data);
    const re = encodeSprite(dec);
    if (re.length !== im.data.length || dec.w !== W0 || dec.h !== H0 || dec.id !== im.id) validSprites = false;
    for (const m of dec.mask) if (m !== 255) paintedPx++;
  }
  const hasBoth = !!parsed.layout?.WATCH?.text_clock && !!parsed.layout?.WATCH?.image_pointer_clock;
  const kb = watchBytes.length / 1024;
  ok(
     parsed.images.length === 51 && validSprites && hasBoth && paintedPx > 1000 && kb < 900,
    `${key}: valid hybrid digital+motion .watch (${kb.toFixed(0)} KB, ${paintedPx} painted px, ${Date.now() - t0} ms)`
  );
  ok(frames(watchBytes).at(-1).bytes.length === 38, `${key}: BLE upload frames build`);
}

if (fails) process.exit(1);
console.log('\nAll good.');
