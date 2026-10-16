// Renders public/favicon.ico (16 and 32 px) and public/apple-touch-icon.png (180 px) from public/favicon.svg. Rerun
// after changing the SVG.
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('public/favicon.svg');
const png = (size) => sharp(svg, { density: (72 * size) / 32 }).resize(size, size).png().toBuffer();

// An ICO is a directory of images; each entry here is a PNG.
const ico = (images) => {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(({ data }) => data)]);
};

writeFileSync('public/favicon.ico', ico([{ size: 16, data: await png(16) }, { size: 32, data: await png(32) }]));
writeFileSync('public/apple-touch-icon.png', await png(180));
