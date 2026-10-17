import {owner,call} from '../../../lib/xce/server';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origin required'},{status:403});
 let u;try{u=await owner(req)}catch{return Response.json({error:'Sign in required'},{status:401})}
 try{const input:any=await req.json();const tool=input.tool||'manage_record';delete input.tool;if(!['manage_color_grade','manage_shot_list','manage_record','transfer_record','intake_asset','reclassify_record','delete_records','purge_trash'].includes(tool))throw Error('Unknown action');const result=await call(tool,input,u,req);return Response.json(JSON.parse(result.content[0].text),{headers:{'Cache-Control':'private, no-store'}})}catch(e){return Response.json({error:(e as Error).message},{status:400})}
}
