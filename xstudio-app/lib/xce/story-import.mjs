import {updateWorldBuilder} from './world-builder-fields.mjs';
export const STORY_TAGS={WORLD_TYPE:'world_type',AESTHETIC_TONE:'aesthetic',WORLD_BACKGROUND:'world_background',STORY_SO_FAR:'story_so_far',PRODUCTION_BRIEF:'production_brief',WORLD_RULES_CONTINUITY:'notes'};
// Parse fully before mutating anything. Empty sections preserve the saved value.
export function parseStoryImport(text){
 if(typeof text!=='string'||text.length>1400000)throw Error('Paste a valid story block');
 const patch={},seen=new Set(),warnings=[];let active=null,start=0,last=0;
 const token=/\[([^\]\r\n]*)\]/g;let match;
 while((match=token.exec(text))){
  const raw=match[1],closing=raw.startsWith('/'),name=closing?raw.slice(1):raw;
  if(!/^[A-Z][A-Z0-9_]*$/.test(name))throw Error('Malformed or incorrectly cased tag: '+match[0]);
  if(!active&&text.slice(last,match.index).trim())throw Error('Text must be inside a tagged section');
  if(!closing){if(active)throw Error('Overlapping sections are not allowed');if(seen.has(name))throw Error('Duplicate section: '+name);seen.add(name);active=name;start=token.lastIndex;}
  else {if(active!==name)throw Error('Mismatched closing tag: '+name);const value=text.slice(start,match.index).trim();if(Object.hasOwn(STORY_TAGS,name)){if(value)patch[STORY_TAGS[name]]=value;}else warnings.push('Ignored unknown section: '+name);active=null;}
  last=token.lastIndex;
 }
 if(active||text.slice(last).trim())throw Error('Missing closing tag or text outside sections');
 for(const name of Object.keys(STORY_TAGS))if(!seen.has(name))throw Error('Missing required section: '+name);
 if(Object.keys(patch).length)updateWorldBuilder({},patch); // Validate field limits before use.
 return {patch,warnings};
}
export function importStoryBlock(manifest,text){const result=parseStoryImport(text);if(Object.keys(result.patch).length)updateWorldBuilder(manifest,result.patch);return result;}
