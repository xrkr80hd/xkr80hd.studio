import {uploadDestination} from '../../../lib/xce/upload-category.mjs';
import {call,owner} from '../../../lib/xce/server';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return new Response('Origin required',{status:403});
 let u;try{u=await owner(req)}catch{return new Response('Sign in required',{status:401})}
 try{const form=await req.formData(),file=form.get('file');if(!(file instanceof File)||file.size>6*1024*1024)throw Error('Choose an image up to 6 MB');const category=form.get('upload_category');const destination=category?uploadDestination(String(category)):null;const result=await call('register_reference',{project_id:form.get('project_id')||'xce-lost-assets',...(form.get('reference_id')?{reference_id:form.get('reference_id')}:{}),...(form.get('asset_name')?{asset_name:form.get('asset_name')}:{}),...(form.get('asset_type')?{asset_type:form.get('asset_type')}:{}),...(form.get('role')?{role:form.get('role')}:{}),...(destination?{role:destination.role,...(destination.asset_type?{asset_type:destination.asset_type}:{}),upload_category:category}:{}),name:file.name,mime_type:file.type,image_base64:Buffer.from(await file.arrayBuffer()).toString('base64')},u,req);return Response.json(JSON.parse(result.content[0].text))}catch(e){return Response.json({error:(e as Error).message},{status:400})}
}
