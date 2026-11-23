// Removes camera details (location, device, time) from a JPEG, keeping only the
// orientation so the picture still shows right side up.

function readOrientation(seg) {
  // seg: APP1 payload starting with "Exif\0\0"
  const tiff = 6;
  if (seg.length < tiff + 8) return 1;
  const little = seg[tiff] === 0x49;
  const u16 = at => (little ? seg[at] | (seg[at + 1] << 8) : (seg[at] << 8) | seg[at + 1]);
  const u32 = at => (little
    ? (seg[at] | (seg[at + 1] << 8) | (seg[at + 2] << 16) | (seg[at + 3] << 24)) >>> 0
    : ((seg[at] << 24) | (seg[at + 1] << 16) | (seg[at + 2] << 8) | seg[at + 3]) >>> 0);
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > seg.length) return 1;
  const entries = u16(ifd);
  for (let i = 0; i < entries; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > seg.length) break;
    if (u16(entry) === 0x0112) {
      const value = u16(entry + 8);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}

function orientationSegment(orientation) {
  // APP1 "Exif\0\0" + big-endian TIFF header + IFD0 with one Orientation entry.
  const body = [
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
    0x00, 0x01,
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ];
  const length = body.length + 2;
  return Uint8Array.from([0xff, 0xe1, length >> 8, length & 0xff, ...body]);
}

export function cleanJpeg(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const keep = [bytes.subarray(0, 2)];
  let orientation = 1;
  let pos = 2;
  while (pos + 4 <= bytes.length) {
    if (bytes[pos] !== 0xff) return bytes; // unexpected layout: leave untouched
    const marker = bytes[pos + 1];
    if (marker === 0xda) break; // start of image data: copy the rest as is
    const length = (bytes[pos + 2] << 8) | bytes[pos + 3];
    const end = pos + 2 + length;
    if (length < 2 || end > bytes.length) return bytes;
    const payload = bytes.subarray(pos + 4, end);
    const isExif = marker === 0xe1 && payload[0] === 0x45 && payload[1] === 0x78 && payload[2] === 0x69 && payload[3] === 0x66;
    if (isExif) orientation = readOrientation(payload);
    // Drop APP1 (Exif/XMP), APP13 (IPTC) and comments; keep everything else.
    if (!(marker === 0xe1 || marker === 0xed || marker === 0xfe)) keep.push(bytes.subarray(pos, end));
    pos = end;
  }
  if (pos + 4 > bytes.length) return bytes;
  // JFIF (APP0) stays first; the orientation-only Exif block goes right after it.
  const rest = keep.slice(1);
  const lead = rest.length && rest[0][1] === 0xe0 ? 1 : 0;
  const parts = [keep[0], ...rest.slice(0, lead), orientationSegment(orientation), ...rest.slice(lead), bytes.subarray(pos)];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
