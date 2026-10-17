import test from 'node:test';
import assert from 'node:assert/strict';
import { generateXaiImage, parseGeminiImage, readBounded } from '../lib/xstudio-providers.mjs';

test('Gemini image parser accepts supported inline image only', () => {
  const result = { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from('image').toString('base64') } }] } }] };
  assert.equal(parseGeminiImage(result).bytes.toString(), 'image');
  assert.throws(() => parseGeminiImage({ candidates: [{ content: { parts: [{ text: 'no image' }] } }] }));
});

test('provider response reader stops at configured size', async () => {
  await assert.rejects(readBounded(new Response('123456'), 5), /too large/);
});

test('xAI adapter rejects off-domain image URL before fetching it', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ data: [{ url: 'https://attacker.example/image.jpg', mime_type: 'image/jpeg' }] });
  };
  try {
    await assert.rejects(generateXaiImage('prompt', 'fake-key'), /Unexpected provider image URL/);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});
