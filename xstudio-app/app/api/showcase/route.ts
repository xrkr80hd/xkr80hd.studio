import {owner,requireFolder} from '../../../lib/xce/server';
import {showcaseRequest} from '../../../lib/xce/showcase-backend';
import {isTrustedOrigin} from '../../../lib/xstudio-validation.mjs';
export const dynamic='force-dynamic';

const PROJECT=/^[a-zA-Z0-9_-]{1,80}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers={'Cache-Control':'private, no-store'};

export async function POST(req:Request){
 if(!isTrustedOrigin(req))return Response.json({error:'Origin required'},{status:403,headers});
 let u:string;try{u=await owner(req)}catch{return Response.json({error:'Sign in required'},{status:401,headers})}
 let input:any;try{input=await req.json()}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 const action=input?.action;
 try{
  if(action==='status'||action==='create'){
   if(typeof input.project_id!=='string'||!PROJECT.test(input.project_id))throw Object.assign(Error('Invalid project'),{status:400});
   // A PIN-locked folder must be unlocked on this device before it can be shared or inspected.
   await requireFolder(req,u,input.project_id);
   const result=await showcaseRequest({action,project:input.project_id});
   const url=result.token?new URL('/s/'+result.token,new URL(req.url).origin).toString():undefined;
   return Response.json({link:result.link,...(url?{url}:{})},{headers});
  }
  if(action==='extend'||action==='kill'){
   if(typeof input.id!=='string'||!UUID.test(input.id))throw Object.assign(Error('Invalid link'),{status:400});
   const result=await showcaseRequest({action,id:input.id});
   return Response.json({link:result.link},{headers});
  }
  throw Object.assign(Error('Unknown action'),{status:400});
 }catch(e){
  const err=e as Error&{status?:number};
  const status=err.message==='Folder locked'?423:err.status||400;
  return Response.json({error:err.message},{status,headers});
 }
}
