export const MAX_PROVIDER_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_PROVIDER_JSON_BYTES = 8 * 1024 * 1024;

export async function readBounded(response, maxBytes) {
  const declared = Number(response.headers.get('content-length'));
  if (declared && declared > maxBytes) throw new Error('Provider response too large');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty provider response');
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('Provider response too large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks, size);
}

async function providerJson(response) {
  if (!response.ok) throw new Error('Provider request failed');
  return JSON.parse((await readBounded(response, MAX_PROVIDER_JSON_BYTES)).toString('utf8'));
}

export function parseGeminiImage(result) {
  const parts = result?.candidates?.flatMap(candidate => candidate?.content?.parts || []) || [];
  const inline = parts.map(part => part.inlineData || part.inline_data).find(Boolean);
  const mimeType = inline?.mimeType || inline?.mime_type;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType) || typeof inline?.data !== 'string') {
    throw new Error('No supported image returned');
  }
  const bytes = Buffer.from(inline.data, 'base64');
  if (!bytes.length || bytes.length > MAX_PROVIDER_IMAGE_BYTES) throw new Error('Provider image too large');
  return { bytes, mimeType };
}

export async function generateGeminiImage(prompt, key, references = []) {
  if (!references.length || references.some(r => !['image/png','image/jpeg','image/webp'].includes(r.mimeType) || !r.data)) throw new Error('Saved project reference bytes are required');
  const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-image:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...references.map(inlineData => ({inlineData}))] }], generationConfig: { responseModalities: ['Image'] } }),
    signal: AbortSignal.timeout(45_000),
    cache: 'no-store',
  });
  return parseGeminiImage(await providerJson(response));
}

export async function generateXaiImage(prompt, key) {
  const response = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'grok-imagine-image-2.0', prompt, n: 1 }),
    signal: AbortSignal.timeout(45_000),
    cache: 'no-store',
  });
  const result = await providerJson(response);
  const image = result?.data?.[0];
  if (!image || !['image/png', 'image/jpeg', 'image/webp'].includes(image.mime_type)) throw new Error('No supported image returned');
  const url = new URL(image.url);
  if (url.protocol !== 'https:' || url.hostname !== 'imgen.x.ai' || url.username || url.password) throw new Error('Unexpected provider image URL');
  const imageResponse = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30_000), cache: 'no-store' });
  if (!imageResponse.ok || imageResponse.headers.get('content-type')?.split(';')[0] !== image.mime_type) throw new Error('Provider image unavailable');
  const bytes = await readBounded(imageResponse, MAX_PROVIDER_IMAGE_BYTES);
  if (!bytes.length) throw new Error('Empty provider image');
  return { bytes, mimeType: image.mime_type };
}
