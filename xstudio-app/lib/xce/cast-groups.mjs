export const CAST_GROUPS={main:'Main Cast',supporting:'Supporting Cast',villain:'Villains',sub_villain:'Sub-villains',general:'General Cast'};
export function resolveCastCharacter(manifest,id,characters){
 const eligible=characters.filter(a=>a.type==='characters'&&!a.deleted_at&&!manifest.manifest_store?.creatures?.[a.id]);
 const exact=eligible.filter(a=>a.id===id||a.asset_id===id||a.asset_code===id);
 if(exact.length===1)return exact[0].id;
 if(exact.length>1)throw Error('More than one character matches. Reopen the character from this project.');
 // Older inspectors can hold the selected source-image ID rather than the saved character ID.
 // Resolve that alias only inside this project and only when exactly one character owns it.
 const linked=manifest.references?.[id]?eligible.filter(a=>[...(a.reference_ids||[]),a.source_image_id,a.preview_reference_id,a.output_reference_id].includes(id)):[];
 if(linked.length===1)return linked[0].id;
 if(linked.length>1)throw Error('This image belongs to more than one character. Open the character itself to choose its cast group.');
 throw Error('This character is not available in the selected project. Reopen the saved character and retry.');
}
export function characterGroup(manifest,id){const group=manifest.character_cast_groups?.[id];return ['background','unassigned'].includes(group)?'general':Object.hasOwn(CAST_GROUPS,group)?group:'general';}
export function assignCastGroup(manifest,id,group,characters){
 if(['background','unassigned'].includes(group))group='general';
 if(!Object.hasOwn(CAST_GROUPS,group))throw Error('Choose a valid cast group');
 const characterId=resolveCastCharacter(manifest,id,characters);
 return {...manifest,character_cast_groups:{...(manifest.character_cast_groups||{}),[characterId]:group}};
}
