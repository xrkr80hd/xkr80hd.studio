import factory from './color-grade-presets.json' with {type:'json'};
export const FACTORY_GRADES=Object.freeze(factory.map(g=>Object.freeze(g)));
export const CONTROL_RANGES={temperature:[-100,100],contrast:[-100,100],saturation:[-100,100],shadowTint:[-100,100],highlightTint:[-100,100],blackLevel:[-100,100],grain:[0,100],haze:[0,0]};
export const NEUTRAL_SETTINGS=Object.fromEntries(Object.keys(CONTROL_RANGES).map(k=>[k,0]));
export const GLOBAL_NEGATIVE='Avoid unwanted oversaturation, artificial HDR halos, plastic textures, uncontrolled color casts, crushed detail, and inconsistent grading. Preserve physical scene, identity, wardrobe, props, geography, framing, action and world-space light sources. Do not add fog, rain, sunlight or props.';
const clone=v=>structuredClone(v),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function validateGrade(g,{factoryAllowed=false}={}){
 if(!g||typeof g!=='object'||typeof g.id!=='string'||!/^[\w-]{1,80}$/.test(g.id))throw Error('Invalid grade ID');
 if(!factoryAllowed&&(g.factoryPreset||g.id.startsWith('CG-')))throw Error('Factory presets are protected; duplicate as a custom grade');
 for(const k of ['slug','name','description','category','prompt','negativePrompt'])if(typeof g[k]!=='string'||!g[k].trim()||g[k].length>10000)throw Error('Invalid grade '+k);
 if(!Number.isInteger(g.version)||g.version<1)throw Error('Invalid grade version');
 if(!Array.isArray(g.bestFor)||g.bestFor.length>30||g.bestFor.some(v=>typeof v!=='string'||v.length>200))throw Error('Invalid bestFor');
 for(const k of ['shadows','midtones','highlights','blacks'])if(!/^#[0-9a-f]{6}$/i.test(g.palette?.[k]))throw Error('Invalid palette '+k);
 for(const [k,[min,max]]of Object.entries(CONTROL_RANGES))if(!Number.isFinite(g.settings?.[k])||g.settings[k]<min||g.settings[k]>max)throw Error('Invalid '+k+' range');
 if(!Number.isFinite(g.intensity)||g.intensity<0||g.intensity>100)throw Error('Invalid intensity');
 if(g.lutAssetId!==null)throw Error('True LUT transforms are not implemented; lutAssetId must be null');
 for(const k of ['previewAssetId','referenceAssetId'])if(g[k]!=null&&(typeof g[k]!=='string'||!/^[\w-]{1,80}$/.test(g[k])))throw Error('Invalid reference image');
 return clone(g);
}
export function gradeLibrary(m){return [...clone(factory),...Object.values(m.color_grades?.custom||{}).map(clone)]}
export function gradeVersion(m,id,version){const g=factory.find(g=>g.id===id)||m.color_grades?.custom?.[id];if(!g)throw Error('Grade not found');const v=version&&version!==g.version?m.color_grades?.history?.[id]?.find(g=>g.version===version):g;if(!v)throw Error('Grade version not found');return clone(v)}
export function snapshot(g,intensity=g.intensity){return {grade_id:g.id,grade_version:g.version,intensity,definition:{...clone(g),intensity}}}
function assignmentKey(scope,id=''){return scope+':'+(scope==='project'?'default':id)}
export function effectiveGrade(m,ctx={}){
 const a=m.color_grades?.assignments||{};
 for(const scope of ['shot','scene','sequence','project']){const id=scope==='project'?'default':ctx[scope+'_id'];if(!id)continue;const v=a[assignmentKey(scope,id)];if(v)return clone(v.effective_grade)}return null;
}
export function gradePrompt(s,style='RL'){
 if(!s||s.intensity===0)return '';
 const g=s.definition;return `Color treatment: ${g.name} v${s.grade_version}, strength ${s.intensity}%. ${g.prompt} Internal controls ${JSON.stringify(g.settings)}. ${style==='CB'||style==='comic_book'?'Keep comic-book illustration, ink and graphic textures; interpret grading within that style. Never convert to photorealism.':'Preserve the selected rendering style.'} Color only; no new lights, weather, fog, props or geometry. These controls guide generation; they do not guarantee an exact pixel match to the preview.`;
}
export function injectGrade(prompt,s,style){if(!s||s.intensity===0)return prompt;const ratio=/\s*--ar 16:9\s*$/.test(prompt);const base=prompt.replace(/\s*--ar 16:9\s*$/,'');return [base,gradePrompt(s,style),'Grade guardrails: '+s.definition.negativePrompt+' '+GLOBAL_NEGATIVE,ratio?'--ar 16:9':''].filter(Boolean).join('\n')}
export function allGradeShots(m){const out=[];for(const list of Object.values(m.shot_lists||{}))for(const s of list.shots)out.push({shot:s,ctx:{sequence_id:list.sequence_id||list.id,scene_id:s.scene_id||list.scene_id||'',shot_id:s.id}});for(const [id,scene]of Object.entries(m.scenes||{}))for(const s of Object.values(scene.shots||{}))out.push({shot:s,ctx:{sequence_id:scene.sequence_id||'',scene_id:id,shot_id:s.asset_id}});return out}
export function gradeAssignmentPlan(m,args){
 const scope=args.scope;if(!['project','sequence','scene','shot'].includes(scope))throw Error('Invalid grade scope');
 const id=scope==='project'?'default':args[scope+'_id'];if(!id||! /^[\w-]{1,80}$/.test(id))throw Error('Choose a '+scope);
 const all=allGradeShots(m);if(scope==='sequence'&&!Object.values(m.shot_lists||{}).some(l=>(l.sequence_id||l.id)===id)&&!Object.values(m.scenes||{}).some(s=>s.sequence_id===id))throw Error('Sequence not found');if(scope==='scene'&&!m.scenes?.[id])throw Error('Scene not found');if(scope==='shot'&&!all.some(s=>s.ctx.shot_id===id))throw Error('Shot not found');
 const key=assignmentKey(scope,id),next=clone(m);next.color_grades||={};next.color_grades.assignments||={};let record=null;
 if(args.action!=='reset'){
 const g=gradeVersion(m,args.grade_id,args.grade_version);const intensity=args.intensity??g.intensity;if(!Number.isFinite(intensity)||intensity<0||intensity>100)throw Error('Invalid intensity');
 record={project_id:args.project_id,sequence_id:args.sequence_id||null,scene_id:args.scene_id||null,shot_id:args.shot_id||null,grade_id:g.id,grade_version:g.version,intensity,scope,user_override:scope!=='project',effective_grade:snapshot(g,intensity)};next.color_grades.assignments[key]=record;
 }else delete next.color_grades.assignments[key];
 const affected=all.filter(({ctx})=>scope==='project'||ctx[scope+'_id']===id).map(({shot,ctx})=>({id:ctx.shot_id,title:shot.title||shot.name||ctx.shot_id,approved:shot.approved===true||shot.status==='LOCKED',before:shot.effective_grade??effectiveGrade(m,ctx),after:effectiveGrade(next,ctx)})).filter(s=>!eq(s.before,s.after));
 return {key,record,affected,confirmation_required:affected.some(s=>s.approved)};
}
export function manageColorGrade(m,args){
 const action=args.action;if(action==='list')return {grades:gradeLibrary(m),assignments:clone(m.color_grades?.assignments||{})};if(action==='read'||action==='export')return {grade:gradeVersion(m,args.id,args.version)};if(action==='resolve')return {effective_grade:effectiveGrade(m,args)};
 if(action==='preview_assignment')return gradeAssignmentPlan(m,{...args,action:args.reset?'reset':'assign'});
 if(['assign','reset'].includes(action)){
 const plan=gradeAssignmentPlan(m,args);const approved=plan.affected.filter(s=>s.approved).map(s=>s.id).sort();if(approved.length&&(!args.confirm_approved||!eq([...(args.confirmed_shot_ids||[])].sort(),approved)))throw Error('Explicit confirmation required for approved shots: '+approved.join(', '));
 m.color_grades||={};m.color_grades.assignments||={};if(plan.record)m.color_grades.assignments[plan.key]=plan.record;else delete m.color_grades.assignments[plan.key];
 for(const {shot,ctx}of allGradeShots(m))if(plan.affected.some(s=>s.id===ctx.shot_id)){shot.effective_grade=effectiveGrade(m,ctx);shot.grade_assignment_changed=true;}
 return {...plan,saved:true,images_regenerated:false};
 }
 if(action==='delete'){if(factory.some(g=>g.id===args.id))throw Error('Factory grades cannot be deleted');if(!m.color_grades?.custom?.[args.id])throw Error('Grade not found');if(Object.values(m.color_grades.assignments||{}).some(a=>a.grade_id===args.id))throw Error('Reset grade assignments before deleting');delete m.color_grades.custom[args.id];return {deleted:true}}
 if(['save','import','duplicate'].includes(action)){
 let g=action==='duplicate'?{...gradeVersion(m,args.id),id:args.new_id,name:args.name||gradeVersion(m,args.id).name+' copy',factoryPreset:false,version:1}:clone(args.data);g=validateGrade(g);
 for(const k of ['previewAssetId','referenceAssetId'])if(g[k]&&!m.references?.[g[k]])throw Error('Reference image not found in project');
 m.color_grades||={};m.color_grades.custom||={};m.color_grades.history||={};const old=m.color_grades.custom[g.id];if(old){if(args.expected_version!==old.version)throw Error('Grade changed; reload current version');g.version=old.version+1}else g.version=1;
 m.color_grades.history[g.id]||=[];m.color_grades.history[g.id].push(clone(g));m.color_grades.custom[g.id]=g;return {saved:true,grade:g};
 }throw Error('Unknown grade action');
}
