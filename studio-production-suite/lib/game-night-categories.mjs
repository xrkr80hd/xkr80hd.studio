import {createHash,randomUUID} from 'node:crypto';
// Shapes a category for the shared library: text fields only, plus media references. Point values and
// Daily Double flags belong to the game slot it is placed in, not to the library copy.
const text=(value,max)=>String(value??'').slice(0,max);
function cleanMedia(media){if(!media||typeof media!=='object')return null;if(typeof media.storagePath==='string'){if(media.storagePath.includes('..')||!/^[a-z0-9._-]+\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i.test(media.storagePath))throw Error('Invalid clue media');return {storagePath:media.storagePath,type:text(media.type,60),name:text(media.name,120)};}
  // Small inline images (older saves) are kept; large inline files would make the library too heavy to load.
  if(typeof media.data==='string'&&media.data.startsWith('data:')&&media.data.length<=700000)return {data:media.data,type:text(media.type,60),name:text(media.name,120)};return null;}
export function normalizeCategory(input){if(!input||typeof input!=='object')throw Error('Invalid category');const name=text(input.name,80).trim();if(!name)throw Error('Give the category a name');if(!Array.isArray(input.clues)||input.clues.length<1||input.clues.length>10)throw Error('A category needs 1–10 clues');
  const clues=input.clues.map(q=>({question:text(q?.question,2000),answer:text(q?.answer,500),accepted:text(q?.accepted,500),hint:text(q?.hint,500),note:text(q?.note,1000),source:text(q?.source,500),media:cleanMedia(q?.media)}));
  const id=typeof input.id==='string'&&/^[A-Za-z0-9_-]{6,64}$/.test(input.id)?input.id:randomUUID();return {id,name,clues};}
export function categorySignature(category){return createHash('sha256').update(JSON.stringify([category.name.trim().toLowerCase(),category.clues.map(q=>[q.question.trim().toLowerCase(),q.answer.trim().toLowerCase()])])).digest('hex');}
export function categoryMediaPaths(category){return [...new Set(category.clues.map(q=>q.media?.storagePath).filter(Boolean))];}
export function hasContent(category){return category.clues.some(q=>q.question.trim()||q.answer.trim());}
