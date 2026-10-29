import 'server-only';
import {requireOwner} from '../xstudio-server';
import {XSTUDIO_ENDPOINT} from './xstudio-bridge.mjs';

export const SHOWCASE_TOKEN=/^xss_[A-Za-z0-9_-]{43}$/;

export type ShowcaseLink={id:string,project:string,expires_at:string};
export type ShowcaseItem={id:string|null,name:string|null,file_name:string|null,category:string|null,asset_type:string|null,role:string|null,code:string|null,mime_type:string,url:string};
export type ShowcaseGallery={project:{name:string,code:string|null,description:string|null},expires_at:string,items:ShowcaseItem[]};

// Owner actions use the verified owner session, like engineRequest.
export async function showcaseRequest(args:{action:'status'|'create'|'extend'|'kill',project?:string,id?:string}){
 const context=await requireOwner();
 if(context.response)throw Object.assign(Error('Sign in to manage showcases.'),{status:401});
 const {data,error}=await context.client!.auth.getSession();
 if(error||!data.session?.access_token)throw Object.assign(Error('Session expired. Please sign in again.'),{status:401});
 const response=await fetch(XSTUDIO_ENDPOINT+'?resource=showcase',{
  method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json',apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!},
  body:JSON.stringify(args),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)
 });
 let body:any={};try{body=await response.json()}catch{/* handled below */}
 if(!response.ok)throw Object.assign(Error(body.error||'Showcase unavailable (HTTP '+response.status+').'),{status:response.status===401?401:response.status===404?404:response.status===409?409:502});
 return body as {link:ShowcaseLink|null,token?:string};
}

// Public read for /s/[token]. No session: the link token is the credential.
export async function showcaseGallery(token:string):Promise<ShowcaseGallery|null>{
 if(!SHOWCASE_TOKEN.test(token))return null;
 const response=await fetch(XSTUDIO_ENDPOINT+'?resource=showcase_view',{
  method:'POST',headers:{'Content-Type':'application/json',apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!},
  body:JSON.stringify({token}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)
 });
 if(response.status===404)return null;
 if(!response.ok)throw Error('Showcase unavailable');
 const body=await response.json() as ShowcaseGallery;
 const origin=new URL(XSTUDIO_ENDPOINT).origin;
 // Only ever render signed URLs from our own storage.
 body.items=(Array.isArray(body.items)?body.items:[]).filter(i=>{try{const u=new URL(i.url);return u.origin===origin&&u.pathname.startsWith('/storage/v1/object/sign/')&&u.searchParams.has('token')}catch{return false}});
 return body;
}
