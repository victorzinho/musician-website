// Strips metadata from published files in place, without re-encoding: `node scripts/strip-metadata.mjs [--drop-credit]
// [file…]`, every committed image and PDF under src/ and public/ by default. Kept: JPEG photographer credit (EXIF
// Artist, Copyright; `--drop-credit` drops it) and rotation; PDF `/Title`. `scripts/check-metadata.mjs` checks dist/.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const JPEG_KEPT = new Set([0xe0, 0xe2, 0xee]); // APP0 JFIF, APP2 ICC profile, APP14 Adobe (colour transform)
const PNG_DROPPED = new Set(['tEXt', 'zTXt', 'iTXt', 'tIME', 'eXIf']);
const EXIF_KEPT = { 274: 'Orientation', 315: 'Artist', 33432: 'Copyright' };

const jpegSegments = (buf) => {
  const segments = [];
  let at = 2;
  while (at < buf.length && buf[at] === 0xff) {
    const marker = buf[at + 1];
    if (marker === 0xda) return { segments, rest: at }; // Start of scan: image data from here on.
    const end = at + 2 + buf.readUInt16BE(at + 2);
    segments.push({ marker, start: at, end, body: buf.subarray(at + 4, end) });
    at = end;
  }
  throw new Error('not a JPEG, or no image data');
};

/** Orientation (unless upright), Artist, Copyright from an Exif APP1 body. */
const exifKept = (body) => {
  if (body.subarray(0, 6).toString('latin1') !== 'Exif\0\0') return {};
  const tiff = body.subarray(6);
  const le = tiff.toString('latin1', 0, 2) === 'II';
  const u16 = (o) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
  const ifd = u32(4);
  const kept = {};
  for (let i = 0; i < u16(ifd); i++) {
    const entry = ifd + 2 + i * 12;
    const tag = u16(entry);
    if (!(tag in EXIF_KEPT)) continue;
    if (tag === 274) {
      if (u16(entry + 8) !== 1) kept[tag] = u16(entry + 8);
      continue;
    }
    const count = u32(entry + 4);
    const at = count <= 4 ? entry + 8 : u32(entry + 8);
    const text = tiff.toString('utf8', at, at + count).replace(/[\0\s]+$/, '');
    if (text) kept[tag] = text;
  }
  return kept;
};

/** A little-endian Exif APP1 segment with only `tags`. */
const exifSegment = (tags) => {
  const entries = Object.entries(tags).map(([tag, value]) => [Number(tag), value]).sort(([a], [b]) => a - b);
  const ifdSize = 2 + entries.length * 12 + 4;
  const data = [];
  let dataAt = 8 + ifdSize;
  const ifd = Buffer.alloc(ifdSize);
  ifd.writeUInt16LE(entries.length, 0);
  entries.forEach(([tag, value], i) => {
    const entry = 2 + i * 12;
    ifd.writeUInt16LE(tag, entry);
    if (typeof value === 'number') {
      ifd.writeUInt16LE(3, entry + 2); // SHORT
      ifd.writeUInt32LE(1, entry + 4);
      ifd.writeUInt16LE(value, entry + 8);
      return;
    }
    const text = Buffer.from(`${value}\0`, 'utf8');
    ifd.writeUInt16LE(2, entry + 2); // ASCII
    ifd.writeUInt32LE(text.length, entry + 4);
    if (text.length <= 4) text.copy(ifd, entry + 8);
    else {
      ifd.writeUInt32LE(dataAt, entry + 8);
      data.push(text);
      dataAt += text.length;
    }
  });
  const body = Buffer.concat([Buffer.from('Exif\0\0II*\0\x08\0\0\0', 'latin1'), ifd, ...data]);
  const header = Buffer.from([0xff, 0xe1, 0, 0]);
  header.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([header, body]);
};

const stripJpeg = (buf, { credit }) => {
  const { segments, rest } = jpegSegments(buf);
  const app = (s) => s.marker >= 0xe0 && s.marker <= 0xef;
  const exif = Object.assign({}, ...segments.filter((s) => s.marker === 0xe1).map((s) => exifKept(s.body)));
  if (!credit) for (const tag of [315, 33432]) delete exif[tag];
  const kept = segments.filter((s) => !(app(s) && !JPEG_KEPT.has(s.marker)) && s.marker !== 0xfe);
  const [first, ...others] = kept.map((s) => buf.subarray(s.start, s.end));
  const appended = Object.keys(exif).length ? [exifSegment(exif)] : [];
  return Buffer.concat([buf.subarray(0, 2), first, ...appended, ...others, buf.subarray(rest)]);
};

const pngChunks = (buf) => {
  const chunks = [];
  for (let at = 8; at < buf.length; ) {
    const end = at + 12 + buf.readUInt32BE(at);
    chunks.push({ type: buf.toString('latin1', at + 4, at + 8), start: at, end });
    at = end;
  }
  return chunks;
};

const stripPng = (buf) =>
  Buffer.concat([buf.subarray(0, 8), ...pngChunks(buf).filter((c) => !PNG_DROPPED.has(c.type)).map((c) => buf.subarray(c.start, c.end))]);

/** The end of the PDF value starting at `at` (after whitespace) in `text`. */
const pdfValueEnd = (text, at) => {
  while (/\s/.test(text[at])) at++;
  if (text.startsWith('<<', at)) {
    at += 2;
    for (;;) {
      while (/\s/.test(text[at])) at++;
      if (text.startsWith('>>', at)) return at + 2;
      at = pdfValueEnd(text, at);
    }
  }
  if (text[at] === '(') {
    for (let depth = 0; ; at++) {
      if (text[at] === '\\') at++;
      else if (text[at] === '(') depth++;
      else if (text[at] === ')' && --depth === 0) return at + 1;
    }
  }
  if (text[at] === '<') return text.indexOf('>', at) + 1;
  if (text[at] === '[') {
    at++;
    for (;;) {
      while (/\s/.test(text[at])) at++;
      if (text[at] === ']') return at + 1;
      at = pdfValueEnd(text, at);
    }
  }
  const ref = /^\d+\s+\d+\s+R/.exec(text.slice(at, at + 40));
  if (ref) return at + ref[0].length;
  const token = /^\/?[^\s/<>()[\]]*/.exec(text.slice(at))[0];
  return at + Math.max(token.length, 1);
};

/** The entries of each Info dictionary: key, value, and where the entry starts and ends in `text`. */
const pdfInfo = (text) => {
  const ids = new Set([...text.matchAll(/\/Info\s+(\d+)\s+(\d+)\s+R/g)].map((m) => `${m[1]} ${m[2]}`));
  return [...ids].map((id) => {
    const obj = new RegExp(`(?:^|[^\\d])${id.replace(' ', '\\s+')}\\s+obj\\s*<<`).exec(text);
    if (!obj) throw new Error(`Info object ${id} not found: in an object stream?`);
    const entries = [];
    for (let at = obj.index + obj[0].length; ; ) {
      while (/\s/.test(text[at])) at++;
      if (text.startsWith('>>', at)) return entries;
      const keyEnd = pdfValueEnd(text, at);
      const end = pdfValueEnd(text, keyEnd);
      entries.push({ key: text.slice(at, keyEnd), value: text.slice(keyEnd, end).trim(), start: at, end });
      at = end;
    }
  });
};

const emptyTitle = (value) => /^(\(\s*\)|<\s*(FEFF)?\s*>|\(\xfe\xff\))$/i.test(value);
const pdfLeftovers = (text) => [
  ...pdfInfo(text).flat().filter((e) => e.key !== '/Title' || emptyTitle(e.value)).map((e) => `Info ${e.key}`),
  ...(/\/Metadata\s+\d+\s+\d+\s+R/.test(text) ? ['XMP /Metadata'] : []),
];

/** Each `/Metadata` reference and the body of its XMP stream: where each starts and ends in `text`. */
const pdfXmp = (text) =>
  [...text.matchAll(/\/Metadata\s+(\d+)\s+(\d+)\s+R/g)].map((ref) => {
    const obj = new RegExp(`(?:^|[^\\d])${ref[1]}\\s+${ref[2]}\\s+obj\\s*<<([^]*?)>>\\s*stream\\r?\\n`).exec(text);
    if (!obj || obj[1].includes('/Filter')) throw new Error(`XMP ${ref[1]} ${ref[2]}: compressed or in an object stream, strip it with a PDF tool`);
    const start = obj.index + obj[0].length;
    return [
      { start: ref.index, end: ref.index + ref[0].length },
      { start, end: text.indexOf('endstream', start) },
    ];
  });

/** Info entries, XMP references and XMP packets blanked with spaces, so every byte offset (the xref table) stays valid. */
const stripPdf = (buf) => {
  const text = buf.toString('latin1');
  const out = Buffer.from(buf);
  for (const { start, end } of pdfXmp(text).flat()) out.fill(0x20, start, end);
  for (const entry of pdfInfo(text).flat()) {
    if (entry.key === '/Title' && !emptyTitle(entry.value)) continue;
    out.fill(0x20, entry.start, entry.end);
  }
  return out;
};

const kind = (file) => /\.(jpe?g|png|webp|pdf)$/i.exec(file)?.[1].toLowerCase().replace('jpeg', 'jpg');

/** What metadata `file` still carries, besides what `strip` keeps. */
export const leftovers = (file) => {
  if (!kind(file)) return [];
  const buf = readFileSync(file);
  switch (kind(file)) {
    case 'jpg': {
      const { segments } = jpegSegments(buf);
      const found = segments
        .filter((s) => (s.marker >= 0xe0 && s.marker <= 0xef && !JPEG_KEPT.has(s.marker)) || s.marker === 0xfe)
        .map((s) => (s.marker === 0xfe ? 'comment' : `APP${s.marker - 0xe0}`));
      const exif = segments.filter((s) => s.marker === 0xe1);
      // A single Exif segment holding exactly what `strip` keeps is clean.
      if (exif.length === 1 && found.length === 1 && exifSegment(exifKept(exif[0].body)).equals(buf.subarray(exif[0].start, exif[0].end))) return [];
      return found;
    }
    case 'png':
      return pngChunks(buf).filter((c) => PNG_DROPPED.has(c.type)).map((c) => c.type);
    case 'webp': {
      const found = [];
      for (let at = 12; at + 8 <= buf.length; at += 8 + buf.readUInt32LE(at + 4) + (buf.readUInt32LE(at + 4) % 2)) {
        const type = buf.toString('latin1', at, at + 4);
        if (type === 'EXIF' || type === 'XMP ') found.push(type.trim());
      }
      return found;
    }
    default:
      return pdfLeftovers(buf.toString('latin1'));
  }
};

export const strip = (file, { credit = true } = {}) => {
  const buf = readFileSync(file);
  const stripped = { jpg: () => stripJpeg(buf, { credit }), png: () => stripPng(buf), pdf: () => stripPdf(buf) }[kind(file)];
  if (!stripped) {
    const left = leftovers(file);
    if (left.length) throw new Error(`${file}: has ${left.join(', ')}; stripping ${kind(file)} isn't implemented`);
    return;
  }
  const out = stripped();
  if (!out.equals(buf)) writeFileSync(file, out);
  const left = leftovers(file);
  if (left.length) throw new Error(`${file}: still has ${left.join(', ')}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const credit = !args.includes('--drop-credit');
  const given = args.filter((a) => a !== '--drop-credit');
  const files = given.length
    ? given
    : execFileSync('git', ['ls-files', '-z', 'src', 'public'], { encoding: 'utf8' }).split('\0').filter(kind);
  for (const file of files) {
    const before = readFileSync(file);
    strip(file, { credit });
    if (!readFileSync(file).equals(before)) console.log(`stripped ${file}`);
  }
}
