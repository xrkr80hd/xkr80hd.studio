import {validateFirestarterState} from './firestarter-state.mjs';
import {VISUAL_STYLES,PROJECT_TYPES} from './world-presets.mjs';
// Project-wide picks: set once, applied to every prompt in the project.
export const PROJECT_SETTINGS={visual_style:VISUAL_STYLES,project_type:PROJECT_TYPES};
// Project-authored story text is kept separate from deterministic asset hints.
export const WORLD_BUILDER_FIELDS={world_type:{label:'World type',limit:1000,rows:2},aesthetic:{label:'Aesthetic & tone',limit:5000,rows:3},world_background:{label:'World & background',limit:30000,rows:6},story_so_far:{label:'Story so far',limit:50000,rows:8},production_brief:{label:'Production brief',limit:30000,rows:6},notes:{label:'World rules & continuity notes',limit:10000,rows:4}};
export function worldBuilderText(value={}){return Object.fromEntries(Object.keys(WORLD_BUILDER_FIELDS).map(k=>[k,typeof value[k]==='string'?value[k]:'']))}
export function updateWorldBuilder(m,patch){
 if(!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length||Object.keys(patch).some(k=>!Object.hasOwn(WORLD_BUILDER_FIELDS,k)&&!Object.hasOwn(PROJECT_SETTINGS,k)&&k!=='firestarter_state'))throw Error('Choose valid World Builder fields');
 for(const [key,value] of Object.entries(patch))if(Object.hasOwn(PROJECT_SETTINGS,key)&&(typeof value!=='string'||(value&&!Object.hasOwn(PROJECT_SETTINGS[key],value))))throw Error('Choose a listed '+(key==='visual_style'?'visual style':'project type'));
 for(const [key,value] of Object.entries(patch))if(key!=='firestarter_state'&&!Object.hasOwn(PROJECT_SETTINGS,key)&&(typeof value!=='string'||value.length>WORLD_BUILDER_FIELDS[key].limit))throw Error(WORLD_BUILDER_FIELDS[key].label+' must be text up to '+WORLD_BUILDER_FIELDS[key].limit+' characters');
 const state='firestarter_state'in patch?validateFirestarterState(patch.firestarter_state):undefined;
 m.world_builder={...m.world_builder,...Object.fromEntries(Object.entries(patch).filter(([k])=>k!=='firestarter_state').map(([k,v])=>[k,v.trim()])),...(state?{firestarter_state:state}:{})};
 return m.world_builder;
}
