import { saveGeneratedImage } from '../../../../lib/xstudio-assets';
import { generateGeminiImage, generateXaiImage, readBounded } from '../../../../lib/xstudio-providers.mjs';
import { json, requireOwner } from '../../../../lib/xstudio-server';
import { isTrustedOrigin } from '../../../../lib/xstudio-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  if (!isTrustedOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const context = await requireOwner();
  if (context.response) return context.response;
  let body;
  try { body = JSON.parse((await readBounded(request, 5_000)).toString('utf8')); }
  catch { return json({ error: 'Invalid or oversized JSON.' }, 400); }
  const provider = body?.provider;
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!['gemini', 'grok'].includes(provider) || !prompt || prompt.length > 2_000) return json({ error: 'Invalid provider or prompt.' }, 400);
  const key = provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.XAI_API_KEY;
  if (!key) return json({ error: `${provider} is not connected.` }, 503);
  let image;
  try {
    image = provider === 'gemini' ? await generateGeminiImage(prompt, key) : await generateXaiImage(prompt, key);
  } catch {
    return json({ error: 'Image generation failed or returned an unsupported image.' }, 502);
  }
  const name = `${provider === 'gemini' ? 'Gemini' : 'Grok'} image - ${prompt.slice(0, 80)}`;
  const saved = await saveGeneratedImage(context.client, context.user.id, provider, name, image.bytes, image.mimeType);
  return saved.error ? json({ error: saved.error }, saved.status) : json({ asset: saved.asset }, 201);
}
