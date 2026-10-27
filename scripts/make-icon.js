'use strict';
/* Generates assets/icon.png (256×256) without any image dependency: a rounded
 * dark tile with two blue chevrons and a head — a hawk, abstractly. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 256;

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const clamp = (v) => Math.min(1, Math.max(0, v));

/* signed distance to a rounded rectangle, in pixel space */
function roundedRect(x, y, cx, cy, halfW, halfH, r) {
  const dx = Math.abs(x - cx) - (halfW - r);
  const dy = Math.abs(y - cy) - (halfH - r);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(dx, dy), 0) - r;
}

function inPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i--) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const wing1 = [[0.5, 0.44], [0.1, 0.66], [0.1, 0.73], [0.5, 0.58], [0.9, 0.73], [0.9, 0.66]];
const wing2 = [[0.5, 0.63], [0.2, 0.84], [0.2, 0.9], [0.5, 0.75], [0.8, 0.9], [0.8, 0.84]];
const head = { x: 0.5, y: 0.335, r: 0.072 };
const beak = [[0.5, 0.39], [0.44, 0.45], [0.5, 0.52], [0.56, 0.45]];

const px = Buffer.alloc(SIZE * SIZE * 4);
const S = SIZE;

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const u = x / SIZE;
    const v = y / SIZE;

    // background: rounded tile with a diagonal gradient
    const d = roundedRect(x + 0.5, y + 0.5, S / 2, S / 2, S / 2 - 2, S / 2 - 2, 58);
    const cover = clamp(0.5 - d);
    if (cover <= 0) continue;

    const g = clamp((u + v) / 2);
    let r = Math.round(16 + 6 * (1 - g));
    let gg = Math.round(21 + 10 * (1 - g));
    let b = Math.round(30 + 26 * (1 - g));

    // inner glow behind the bird
    const dist = Math.hypot(u - 0.5, v - 0.52);
    const glow = clamp(1 - dist / 0.5) * 0.25;
    b = Math.round(b + 60 * glow);
    gg = Math.round(gg + 34 * glow);

    const markAlpha = Math.max(
      inPolygon(u, v, wing1) || inPolygon(u, v, wing2) || inPolygon(u, v, beak) ? 1 : 0,
      clamp((head.r - Math.hypot(u - head.x, v - head.y)) * SIZE) > 0.5 ? 1 : 0
    );

    if (markAlpha > 0) {
      const shade = clamp(1 - (v - 0.4) * 0.9);
      r = Math.round(232 - 40 * (1 - shade));
      gg = Math.round(240 - 20 * (1 - shade));
      b = 255;
    }

    const i = (y * SIZE + x) * 4;
    px[i] = Math.round(px[i] * (1 - cover) + r * cover);
    px[i + 1] = Math.round(px[i + 1] * (1 - cover) + gg * cover);
    px[i + 2] = Math.round(px[i + 2] * (1 - cover) + b * cover);
    px[i + 3] = Math.round(255 * cover);
  }
}

// filter type 0 per scanline
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  px.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = path.join(__dirname, '..', 'assets', 'icon.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
