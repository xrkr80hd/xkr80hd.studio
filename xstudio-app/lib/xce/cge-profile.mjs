export const CGE_PARAMETERS=['lift_shadows','gamma_midtones','gain_highlights','color_temp_kelvin','contrast_saturation','film_stock_grain'];
const clone=v=>structuredClone(v);
export function validateCgeProfile(p){
 if(!p||typeof p!=='object'||Array.isArray(p)||!/^XCE-CG-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(p.grade_id||'')||p.grade_id.length>80)throw Error('Invalid CGE grade ID');
 for(const k of ['name','prompt_token_string'])if(typeof p[k]!=='string'||!p[k].trim()||p[k].length>(k==='name'?200:10000))throw Error('Invalid CGE '+k);
 if(!['STAGED','LOCKED','PUSHED'].includes(p.status))throw Error('Invalid CGE status');
 if(!p.parameters||typeof p.parameters!=='object'||Array.isArray(p.parameters)||CGE_PARAMETERS.some(k=>typeof p.parameters[k]!=='string'))throw Error('CGE requires all six color parameter fields');
 for(const v of Object.values(p.parameters))if(typeof v!=='string'||v.length>10000)throw Error('Invalid CGE parameter');
 if(JSON.stringify(p).length>100000)throw Error('CGE profile exceeds 100 KB');return clone(p);
}
export function cgeToNative(input,existing){
 const p=validateCgeProfile(input);if(existing&&existing.id!==p.grade_id)throw Error('Grade ID cannot change during an update');
 return {...(existing?clone(existing):{slug:p.grade_id.toLowerCase(),description:'CGE profile. Palette swatches are representative; numeric controls are relative, not recovered camera settings.',category:'Custom CGE',negativePrompt:'Preserve scene, identity, wardrobe, props, geometry and light sources; avoid clipping and unwanted color casts.',version:1,bestFor:[],palette:{shadows:'#26313b',midtones:'#808080',highlights:'#e5e5e5',blacks:'#101010'},settings:{temperature:0,contrast:0,saturation:0,shadowTint:0,highlightTint:0,blackLevel:0,grain:0,haze:0},intensity:100,lutAssetId:null,referenceAssetId:null,previewAssetId:null}),id:p.grade_id,name:p.name,prompt:p.prompt_token_string,factoryPreset:false,cge_profile:p};
}
export function newCgeProfile(id){return {grade_id:id,name:'Untitled grade',status:'STAGED',prompt_token_string:'Describe the color treatment.',parameters:Object.fromEntries(CGE_PARAMETERS.map(k=>[k,'not specified']))};}
