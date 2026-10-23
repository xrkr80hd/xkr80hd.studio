import {owner,folderLockAction} from '../../../lib/xce/server';
import {isTrustedOrigin} from '../../../lib/xstudio-validation.mjs';
export async function POST(req:Request){if(!isTrustedOrigin(req))return Response.json({error:'Origin required'},{status:403});let u;try{u=await owner(req)}catch{return Response.json({error:'Sign in required'},{status:401})}try{const input:any=await req.json();const result=await folderLockAction(req,u,input.project_id,input);return Response.json({saved:true},result)}catch(e){return Response.json({error:(e as Error).message},{status:400})}}
