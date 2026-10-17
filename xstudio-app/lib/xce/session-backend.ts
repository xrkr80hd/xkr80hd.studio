import 'server-only';
import {requireOwner} from '../xstudio-server';
import {XSTUDIO_ENDPOINT} from './xstudio-bridge.mjs';

// Use the verified owner session; never expose a connector or service-role key.
export async function engineRequest(args:any){
 const context=await requireOwner();
 if(context.response)throw Error('Sign in to load your private studio.');
 const {data,error}=await context.client!.auth.getSession();
 if(error||!data.session?.access_token)throw Error('Session expired. Please sign in again.');
 const response=await fetch(XSTUDIO_ENDPOINT+'?resource=engine',{
  method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json',apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!},
  body:JSON.stringify(args),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(25000)
 });
 if(!response.ok)throw Error(response.status===401?'Session expired. Please sign in again.':'Studio connection unavailable (HTTP '+response.status+').');
 return response.json();
}
