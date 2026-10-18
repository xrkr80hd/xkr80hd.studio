import {validate} from './tools.mjs';
const id={type:'string',minLength:1,maxLength:128,pattern:'^[a-zA-Z0-9_-]+$'};
const text={type:'string',maxLength:2000};
const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
export const CHARACTER_STATE_SCHEMA=object({id,character_id:id,name:{type:'string',minLength:1,maxLength:100},status:{type:'string',enum:['DRAFT','LOCKED']},version:{type:'integer',minimum:1},reference_ids:{type:'array',maxItems:6,items:id},visual_description:text});
export const COMPOSITE_MOUNT_SCHEMA=object({id,character_id:id,mount_asset_id:id,mode:{type:'string',enum:['riding','piloting','driving']},seat:text,posture:text,equipment:text,movement:text});
export const FORMATION_PRESETS={
 pair:{label:'Duo / Pair',min:2,max:2,count:2,cues:'direct interaction, side-by-side or lead-follower framing; clearly separated silhouettes'},
 patrol:{label:'Small Group / Patrol',min:3,max:5,count:4,cues:'tactical cluster, medium group shot; distinct individuals and equipment'},
 squad:{label:'Squad / Detachment',min:6,max:12,count:8,cues:'tight formation, staggered skirmish lines or columns; readable spacing'},
 company:{label:'Platoon / Company',min:15,max:40,count:24,cues:'layered ranks with depth, wide group framing; foreground leaders and midground rows without inventing different identities'},
 battalion:{label:'Regiment / Battalion',min:50,max:200,count:100,cues:'sweeping wide view, dense marching ranks; environmental depth, dust or haze only if consistent with the scene'},
 army:{label:'Legion / Army / Multitude',min:500,max:100000,count:500,cues:'horizon-spanning host, grand cinematic wide shot, deep perspective lines and atmospheric depth'},
 custom:{label:'Custom count',min:1,max:100000,count:1,cues:'frame the requested population with readable spacing and depth appropriate to its size'}
};
export const FORMATION_SCALE_SCHEMA=object({id,target_type:{type:'string',enum:['asset','composite']},target_id:id,preset:{type:'string',enum:Object.keys(FORMATION_PRESETS)},count:{type:'integer',minimum:1,maximum:100000},arrangement:text});
export const ENTITY_SCHEMAS={CharacterState:CHARACTER_STATE_SCHEMA,CompositeMountBinding:COMPOSITE_MOUNT_SCHEMA,FormationScaleConfig:FORMATION_SCALE_SCHEMA};
export function stateVariants(m,id){return Object.values(m.state_variants?.[id]||{});}
export function editCharacterState(m,args,records){
 const {character_id,state,operation}=args;
 if(!records.some(a=>a.id===character_id&&a.type==='characters'&&!a.deleted_at)||m.manifest_store?.creatures?.[character_id])throw Error('Choose a character in this project');
 if(!['save','lock','unlock','delete'].includes(operation))throw Error('Unknown state operation');
 validate(CHARACTER_STATE_SCHEMA,state);
 if(state.character_id!==character_id||['base','__proto__','constructor','prototype'].includes(state.id))throw Error('Invalid state identity');
 const previous=m.state_variants?.[character_id]?.[state.id];
 if((previous?.version||0)!==args.expected_version)throw Error('State changed; reload before saving');
 if(!previous&&operation!=='save')throw Error('Save the alternate form first');
 if(previous?.status==='LOCKED'&&operation!=='unlock')throw Error('Unlock this alternate form before changing it');
 if(operation==='unlock'&&previous.status!=='LOCKED')throw Error('State is already unlocked');
 if(operation==='save'&&(!state.name.trim()||state.status!=='DRAFT'))throw Error('Save a named draft first');
 if(operation==='lock'&&!Object.keys(CHARACTER_STATE_SCHEMA.properties).every(key=>key==='status'||JSON.stringify(state[key])===JSON.stringify(previous[key])))throw Error('Save changes before locking the alternate form');
 const candidate=operation==='save'?{...state,name:state.name.trim()}:previous;
 if(new Set(candidate.reference_ids).size!==candidate.reference_ids.length)throw Error('Duplicate state references');
 if(operation!=='delete')for(const ref of candidate.reference_ids)if(!m.references?.[ref]?.key||m.references[ref].role==='DIAGNOSTIC')throw Error('Missing or diagnostic state reference: '+ref);
 if(operation==='lock'&&!candidate.reference_ids.length)throw Error('Assign a turnaround sheet before locking');
 const next=structuredClone(m);next.state_variants||={};next.state_variants[character_id]||={};
 if(!previous&&Object.keys(next.state_variants[character_id]).length>=20)throw Error('Maximum 20 alternate forms per character');
 if(operation==='delete')delete next.state_variants[character_id][state.id];
 else next.state_variants[character_id][state.id]={...candidate,status:operation==='lock'?'LOCKED':operation==='unlock'?'DRAFT':candidate.status,version:(previous?.version||0)+1};
 return next;
}
export function selectedState(m,placement){
 if(!placement?.state_id||placement.state_id==='base')return null;
 const state=m.state_variants?.[placement.asset_id]?.[placement.state_id];
 if(!state||state.status!=='LOCKED'||!state.reference_ids.length)throw Error('Selected alternate form is missing or unlocked: '+placement.state_id);
 if(placement.state_version&&placement.state_version!==state.version)throw Error('Selected alternate form changed; reselect it before compiling');
 return state;
}
export function validateEntities(config,assets){
 const mounts=config.composite_bindings||[],formations=config.formations||[],ids=new Set(config.placements.map(p=>p.asset_id));
 const unique=(rows,label)=>{if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Duplicate '+label+' ID');};
 unique(mounts,'mount binding');unique(formations,'formation');const riders=new Set(),seats=new Set();
 for(const b of mounts){
  validate(COMPOSITE_MOUNT_SCHEMA,b);
  const rider=assets.find(a=>(a.asset_id||a.id)===b.character_id),mount=assets.find(a=>(a.asset_id||a.id)===b.mount_asset_id);
  if(!ids.has(b.character_id)||!ids.has(b.mount_asset_id)||b.character_id===b.mount_asset_id)throw Error('Mount pairing requires two different selected assets');
  if(rider?.category!=='characters'||!['creatures','vehicles'].includes(mount?.category))throw Error('Pair a character with a creature or vehicle');
  if((mount.category==='creatures')!==(b.mode==='riding'))throw Error('Choose riding for creatures, driving or piloting for vehicles');
  if(riders.has(b.character_id))throw Error('A character cannot occupy two mounts in the same scene');riders.add(b.character_id);
  const seat=b.mount_asset_id+'|'+(mount.category==='creatures'?'rider':b.seat.trim().toLowerCase());
  if(mount.category==='vehicles'&&!b.seat.trim())throw Error('Name the vehicle seat or cockpit');
  if(seats.has(seat))throw Error('Mount seat already occupied');seats.add(seat);
  for(const p of config.placements.filter(p=>[b.character_id,b.mount_asset_id].includes(p.asset_id)))if(!['as described','riding','driving','sitting','interacting','observing'].includes(p.action))throw Error('Mounted assets have conflicting per-asset actions; choose as described or a mounted action');
  if(config.relationships.some(r=>[b.character_id,b.mount_asset_id].includes(r.subject_id)&&[b.character_id,b.mount_asset_id].includes(r.object_id)&&!(r.subject_id===b.character_id&&['on','inside'].includes(r.relation))))throw Error('Spatial relationship conflicts with mount pairing');
 }
 const occupied=new Set();
 for(const f of formations){
  validate(FORMATION_SCALE_SCHEMA,f);const preset=FORMATION_PRESETS[f.preset];
  if(f.count<preset.min||f.count>preset.max)throw Error('Count outside selected formation range; choose Custom count');
  const binding=mounts.find(b=>b.id===f.target_id);
  const members=f.target_type==='composite'?(binding?[binding.character_id,binding.mount_asset_id]:[]):ids.has(f.target_id)?[f.target_id]:[];
  if(!members.length)throw Error('Formation target is missing');
  if(f.target_type==='asset'&&mounts.some(b=>[b.character_id,b.mount_asset_id].includes(f.target_id)))throw Error('Scale the entire mount pairing instead of one member');
  if(members.some(id=>occupied.has(id)))throw Error('Overlapping formation targets');members.forEach(id=>occupied.add(id));
 }
 return {mounts,formations};
}
export function entityPrompt(config,assets){
 const {mounts,formations}=validateEntities(config,assets);
 const label=id=>{const a=assets.find(a=>(a.asset_id||a.id)===id),state=a?.selected_state||a?.state_variants?.find(s=>s.id===config.placements.find(p=>p.asset_id===id)?.state_id);return '@['+(a?.category==='characters'?'Character':a?.category==='creatures'?'Creature':a?.category==='vehicles'?'Vehicle':'Asset')+':'+(a?.name||id)+(state?' ('+state.name+')':'')+'] ['+id+']';};
 const pairing=b=>`${label(b.character_id)} ${b.mode==='riding'?'mounted securely atop and riding':'seated securely inside and '+b.mode} ${label(b.mount_asset_id)}; ${b.seat?'seat: '+b.seat+'; ':''}${b.posture||'supported seated posture, anatomically plausible contact points'}; ${b.equipment||'hands engaging the appropriate reins or controls where present in the references'}; ${b.movement||'coordinated movement'}. Keep rider and mount spatially connected with correct relative proportions, clear limb separation and physical support; no rider standing beside the mount, floating, intersecting bodies or clipping through surfaces. Preserve referenced equipment; extra rigging only as explicitly specified.`;
 const lines=config.placements.filter(p=>assets.find(a=>(a.asset_id||a.id)===p.asset_id)?.category==='characters').map(p=>'CHARACTER STATE '+label(p.asset_id)+': '+(!p.state_id||p.state_id==='base'?'use the locked baseline references.':'use only this selected alternate form’s locked visual references and state description for appearance; baseline appearance and baseline visual intelligence do not override this form. Shared user-authored character continuity still applies.'));
 lines.push(...mounts.map(b=>'COMPOSITE '+b.id+': '+pairing(b))); 
 for(const f of formations){const b=mounts.find(b=>b.id===f.target_id);lines.push(`FORMATION ${f.id}: exactly ${f.count} ${f.target_type==='composite'?'complete mounted units of '+pairing(b):'instances of '+label(f.target_id)+'.'} ${FORMATION_PRESETS[f.preset].cues}. ${f.arrangement||'Maintain coherent spacing and coordinated orientation.'} This population replaces the single target placement; do not add an extra standalone copy. ${b?`Unit multipliers: ${f.count} riders and ${f.count} mounts; each rider stays paired with one mount.`:''} Retain the selected reference identity across repetitions; do not fuse or randomly redesign individuals. Formation framing describes the population; camera framing may show a partial view, never compress the entire population into a close-up.`);}
 return lines.join('\n\n');
}
export function compositionBlockingAction(config,id){return (config.composite_bindings||[]).some(b=>[b.character_id,b.mount_asset_id].includes(id))?'follow the composite seat, posture and movement binding':null;}
