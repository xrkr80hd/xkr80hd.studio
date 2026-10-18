export const CAST_GROUPS={main:'Main Cast',supporting:'Supporting Cast',background:'Background Cast',villain:'Villains',sub_villain:'Sub-villains',unassigned:'Unsorted Characters'};
export function characterGroup(manifest,id){const group=manifest.character_cast_groups?.[id];return Object.hasOwn(CAST_GROUPS,group)?group:'unassigned';}
export function assignCastGroup(manifest,id,group,characters){
 if(!Object.hasOwn(CAST_GROUPS,group))throw Error('Choose a valid cast group');
 if(!characters.some(a=>a.id===id&&a.type==='characters')||manifest.manifest_store?.creatures?.[id])throw Error('Choose a character in this project');
 return {...manifest,character_cast_groups:{...(manifest.character_cast_groups||{}),[id]:group}};
}
