export function saveCharacterStory(manifest,id,story,characters){
 if(typeof story!=='string'||story.length>4000)throw Error('Character story must be 4,000 characters or fewer');
 if(!characters.some(a=>a.id===id&&a.type==='characters')||manifest.manifest_store?.creatures?.[id])throw Error('Choose a character in this project');
 return {...manifest,character_stories:{...(manifest.character_stories||{}),[id]:{text:story.trim(),source:'USER_SAVED',updated_at:new Date().toISOString()}}};
}
