// End the authenticated session before leaving the studio. Keep device drafts.
export async function signOutOfStudio({request,storage,navigate}){
 const response=await request('/api/auth/logout',{method:'POST',credentials:'same-origin'});
 const data=await response.json().catch(()=>null);
 if(!response.ok||data?.ok!==true)throw Error(data?.error||'Sign out was not confirmed. Please try again.');
 // Remove automatic offline-owner selection without deleting unsynced projects.
 try{storage?.removeItem('xstudio:device-owner')}catch{}
 navigate('/login?manual=true');
}
