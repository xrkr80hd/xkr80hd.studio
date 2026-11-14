import {NextResponse} from 'next/server';
import {gameDb,gameIdentity,sameOrigin,smallJson,privateHeaders,refreshGameMedia,sharedMediaFor} from '../../../../lib/game-night-server';
import {normalizeCategory,categorySignature,categoryMediaPaths,hasContent} from '../../../../lib/game-night-categories.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
// One shared category library for every Game Master. Each category is its own row, so two hosts saving
// different categories at the same time never overwrite each other.
const fields='id,name,clues,created_by,updated_by,updated_at';
const out=row=>({id:row.id,name:row.name,clues:row.clues,createdBy:row.created_by,updatedBy:row.updated_by,updatedAt:row.updated_at,shared:true});
const fail=(error,status=400)=>NextResponse.json({error},{status,headers:privateHeaders});
async function signRows(rows,username,db){const all=new Set(rows.flatMap(r=>categoryMediaPaths(r)));const wrapped={rows};await refreshGameMedia(wrapped,username,db,all);return wrapped.rows;}
async function checkMedia(category,username,db){const shared=await sharedMediaFor(category,username,db);for(const path of categoryMediaPaths(category))if(!path.startsWith(username+'/')&&!shared.has(path))throw Error('Invalid clue media');}

export async function GET(request){const user=await gameIdentity(request);if(!user)return fail('Log in to open the category library',401);const db=gameDb();const {data,error}=await db.from('game_night_categories').select(fields).order('updated_at',{ascending:false}).limit(1000);if(error)return fail('Could not load the category library',503);try{return NextResponse.json({categories:(await signRows(data,user.username,db)).map(out)},{headers:privateHeaders});}catch{return NextResponse.json({categories:data.map(out),warning:'Some clue media could not be loaded'},{headers:privateHeaders});}}

// Save (create or update) one category.
export async function PUT(request){if(!sameOrigin(request))return fail('Invalid origin',403);const user=await gameIdentity(request);if(!user)return fail('Log in again to save categories',401);try{const body=await smallJson(request,1500000);const category=normalizeCategory(body.category);const db=gameDb();await checkMedia(category,user.username,db);
  const row={id:category.id,name:category.name,clues:category.clues,media_paths:categoryMediaPaths(category),signature:categorySignature(category),updated_by:user.username,updated_at:new Date().toISOString()};
  // One lookup finds this category by id, or the same words already in the library (e.g. rescued from an old save),
  // so a re-save updates that row instead of adding a duplicate. id and signature are validated/hex, safe in the filter.
  const {data:matches,error:lookupError}=await db.from('game_night_categories').select('id').or(`id.eq.${category.id},signature.eq.${row.signature}`).limit(2);if(lookupError)return fail('Could not save the category right now',503);
  const existing=matches.find(m=>m.id===category.id)||matches[0];if(existing)row.id=category.id=existing.id;
  const {data,error}=existing?await db.from('game_night_categories').update(row).eq('id',row.id).select(fields).single():await db.from('game_night_categories').insert({...row,created_by:user.username}).select(fields).single();
  if(error)return fail('Could not save the category right now',503);const [signed]=await signRows([data],user.username,db).catch(()=>[data]);return NextResponse.json({category:out(signed)},{headers:privateHeaders});}
 catch(error){return fail(error.message==='Request too large'?'This category is too large to save. Use smaller pictures or clips.':error.message);}}

// One-time rescue: copy the custom categories a host had in their private workspace into the shared library.
export async function POST(request){if(!sameOrigin(request))return fail('Invalid origin',403);const user=await gameIdentity(request);if(!user)return fail('Log in again to save categories',401);try{const body=await smallJson(request,3800000);if(!Array.isArray(body.categories)||body.categories.length>300)throw Error('Invalid category list');const db=gameDb();
  const seen=new Map();for(const raw of body.categories){let c;try{c=normalizeCategory({...raw,id:undefined});}catch{continue;}if(!hasContent(c))continue;try{await checkMedia(c,user.username,db);}catch{c.clues.forEach(q=>{if(q.media?.storagePath&&!q.media.storagePath.startsWith(user.username+'/'))q.media=null;});}seen.set(categorySignature(c),c);}
  if(!seen.size)return NextResponse.json({added:0},{headers:privateHeaders});
  const {data:have,error}=await db.from('game_night_categories').select('signature').in('signature',[...seen.keys()]);if(error)return fail('Could not save categories right now',503);const existing=new Set(have.map(r=>r.signature));
  const rows=[...seen].filter(([sig])=>!existing.has(sig)).map(([signature,c])=>({id:c.id,name:c.name,clues:c.clues,media_paths:categoryMediaPaths(c),signature,created_by:user.username,updated_by:user.username}));
  if(rows.length){const {error:insertError}=await db.from('game_night_categories').insert(rows);if(insertError)return fail('Could not save categories right now',503);}
  return NextResponse.json({added:rows.length},{headers:privateHeaders});}
 catch(error){return fail(error.message);}}

// Delete: the Game Master who created it, or the site owner.
export async function DELETE(request){if(!sameOrigin(request))return fail('Invalid origin',403);const user=await gameIdentity(request);if(!user)return fail('Log in again to manage categories',401);const id=request.nextUrl.searchParams.get('id');if(!id)return fail('Missing category');const db=gameDb();const {data,error}=await db.from('game_night_categories').select('created_by').eq('id',id).maybeSingle();if(error)return fail('Could not delete right now',503);if(!data)return NextResponse.json({ok:true},{headers:privateHeaders});if(!user.owner&&data.created_by!==user.username)return fail('Only '+data.created_by+' or the site owner can delete this category',403);const {error:delError}=await db.from('game_night_categories').delete().eq('id',id);if(delError)return fail('Could not delete right now',503);return NextResponse.json({ok:true},{headers:privateHeaders});}
