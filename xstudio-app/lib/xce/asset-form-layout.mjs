// Secondary classifications select a form; they never replace an asset's primary category.
export const ASSET_FORM_FIELDS={
 textures:'Textures & surface references',special_functions:'Special functions & capabilities',screen_action:'On-screen use & action',lore:'Lore',effects_notes:'Practical / visual effects notes',threat_level:'On-screen presence / threat',habitat:'Habitat',environment_notes:'Environmental anchors',body_scale:'Body scale',combat_behaviors:'Behavior & performance notes',continuity_rules:'Continuity rules',biome:'Biome',atmosphere:'Atmosphere',landmarks:'Key landmarks',architecture:'Architecture & set notes',scene_markers:'Associated scene markers',technical_notes:'Technical details'
};
export function assetFormKind(primary,classification=''){
 const type=({characters:'character',creatures:'creature',props:'prop',vehicles:'vehicle',locations:'location',rooms:'room',wardrobe:'wardrobe'})[primary]||primary;
 if(classification==='magical_being'&&['character','creature'].includes(type)||type==='character')return 'character';
 if(type==='creature')return 'creature';
 if(['location','room'].includes(type))return 'location';
 if(type==='prop'&&['weapon','equipment'].includes(classification))return 'item';
 return 'general';
}
export const ASSET_FORM_SECTIONS={
 character:[['Core Identity & Role',['name','role','gender','classification']],['Body / Face Anchors & Turnaround Sheets',['references','body_anchor_url','face_anchor_url']],['Gear, Weapons & Inventory',['inventory']],['Visual Style & Details',['visual_style','quick_details','description','anatomy']],['Generation Prompts & Alternate Forms',['generation_prompt','status','alternate_forms']]],
 item:[['Item Name & Classification',['name','classification']],['Primary Render Reference & Textures',['references','textures','world_metadata']],['On-screen Function & Effects',['special_functions','screen_action','effects_notes']],['Description, Prompts & Continuity',['lore','description','relationships','continuity_rules','visual_style','generation_prompt','status']]],
 creature:[['Specimen Name & Presence',['name','classification','threat_level','species']],['Habitat & Environmental Anchors',['habitat','environment_notes','references']],['Body Scale & Anatomy References',['body_scale','anatomy','appearance','visual_style']],['Behavior, Prompts & Continuity',['combat_behaviors','continuity_rules','description','generation_prompt','status']]],
 location:[['Location Name & Biome',['name','classification','biome']],['Lighting & Atmosphere Setups',['lighting_preset','atmosphere','visual_style']],['Key Landmark References & Architecture',['references','landmarks','architecture','world_metadata']],['Associated Scene Markers',['scene_markers','description','generation_prompt','status']]],
 general:[['Identity & Classification',['name','classification']],['Visual Anchors & References',['references','textures','world_metadata']],['Metadata & Details',['description','relationships','technical_notes','visual_style']],['Prompts & Continuity',['generation_prompt','status']]]
};
export const ASSET_FORM_SCHEMA={version:'1.0.0',action:'asset_form',required:['asset_id','primary_category','expected_revision','confirm'],text_fields:ASSET_FORM_FIELDS,sections:ASSET_FORM_SECTIONS,primary_category_immutable:true,reference_changes:'DRAFT assets only; saved project references',empty_fields:'Only changed fields are written',save:'Single authenticated project revision check and atomic persistence'};
