import {owner,load,backend,requireFolder,call} from '../../../../lib/xce/server';
import {bindProjectPrompt} from '../../../../lib/xce/world-library.mjs';
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
  if (!/^[\w-]{1,80}$/.test(body.project_id||'')) return json({error:'Select a project and bind locked @Assets first.'},400);
  let binding, references;
  try {
    const user=await owner(request); await requireFolder(request,user,body.project_id); const {m}=await load(user,body.project_id);
    binding=bindProjectPrompt(m,body.project_id,prompt); references=[];let total=0;
    for(const ref of binding.references){const record=m.references[ref.reference_id];const file=await backend().BUCKET.get(record.key);if(!file)throw Error('Saved anchor bytes unavailable');const bytes=await file.arrayBuffer();total+=bytes.byteLength;if(total>16*1024*1024)throw Error('Reference package exceeds 16 MB');references.push({mimeType:record.mime_type,data:Buffer.from(bytes).toString('base64')});}
  } catch(error){return json({error:error.message},400);}
  if(provider==='grok')return json({error:'This provider adapter does not support verified project references. No unanchored fallback was used.'},422);
  const key = provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.XAI_API_KEY;
  if (!key) return json({ error: `${provider} is not connected.` }, 503);
  let image;
  try {
    image = provider === 'gemini' ? await generateGeminiImage(binding.prompt, key, references) : await generateXaiImage(prompt, key);
  } catch {
    return json({ error: 'Image generation failed or returned an unsupported image.' }, 502);
  }
  const name = `${provider === 'gemini' ? 'Gemini' : 'Grok'} image - ${prompt.slice(0, 80)}`;
  try {const result=await call('register_reference',{project_id:body.project_id,name,asset_name:name,mime_type:image.mimeType,image_base64:image.bytes.toString('base64'),role:'STYLE'},context.user.id,request);return json({asset:JSON.parse(result.content[0].text),binding},201);}catch(error){return json({error:'Generated image could not be saved to its project.'},502);}
}
