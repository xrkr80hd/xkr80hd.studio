// One shared list for the site, the composer and the World Builder plugin.
// Values are stored as the label text, so prompts and exports read naturally.
// Everything here is for AI video, not games.

export const BIOMES={
 Realistic:['Desert','Badlands / mesas','Grassland / prairie','Savanna','Temperate forest','Rainforest / jungle','Swamp / bayou','Mountains','Alpine / snowfields','Tundra / arctic','Coastline / beach','Open ocean','Island / tropical','River valley','Lake country','Volcanic','Caves / underground','Farmland / rural','Small town','Suburbs','City downtown','Industrial district','Highway / roadside','Car dealership lot','Showroom interior','Office interior','Home interior','Stadium / sports field','School campus'],
 Fantasy:['Enchanted forest','Haunted woods','Floating islands','Crystal caverns','Ancient ruins','Steampunk city','Magitek industrial','Medieval castle town','Desert fortress','Snowbound fortress','Underwater kingdom','Sky realm / clouds','Volcanic hellscape','Wasteland / post-apocalyptic','Shadow realm','Fairy-tale village','Gothic cathedral','Temple / shrine','Dark fortress / lair'],
 'Sci-fi':['Alien planet','Space station','Starship interior','Cyberpunk city','Orbit / outer space','Moon surface','Research lab','Ruined future city']
};
export const LIGHTING_PRESETS=['Natural daylight','Golden hour','Blue hour','Overcast soft light','Harsh midday sun','Sunset backlight','Moonlight','Night city neon','Firelight / torchlight','Candlelight','Stormy / lightning','Volumetric god rays','Studio softbox (product)','Studio three-point','Showroom bright and even','Low-key dramatic','High-key bright','Underwater caustics','Magical glow','Eclipse / red sky'];
export const ATMOSPHERES=['Clear and calm','Light haze','Thick fog','Mist over water','Rain','Heavy storm','Snowfall','Blizzard','Sandstorm / dust','Smoke and embers','Ash fall','Steam and vapor','Floating magic particles','Falling leaves','Humid and hazy','Dry heat shimmer','Eerie stillness','Festive / celebratory','Tense and ominous','Peaceful and warm'];
export const GEOGRAPHY=['Flat open plain','Rolling hills','Steep mountains','Canyon / gorge','Cliffside','Coastal shoreline','Island','Peninsula','River crossing','Lakeside','Valley floor','Plateau / mesa','Dense forest floor','Cave network','Underground city','Urban grid','Small town main street','Rural backroads','Highway corridor','Floating / sky terrain','Underwater seabed','Arctic ice shelf','Desert dunes','Volcanic slopes','Interior set'];

// Project-wide look. Set once in World Builder. medium feeds the sheet contracts (RL/CB).
export const VISUAL_STYLES={
 RL:{label:'Realistic / Live Action',medium:'RL',prompt:'Photographic live-action realism: real materials, natural anatomy, full-scale sets and practical lighting. No game-render, toy or miniature look.'},
 CIN:{label:'Cinematic Realistic / Live Action',medium:'RL',prompt:'Cinematic live-action realism: film-camera look, anamorphic depth, motivated lighting and a graded color palette. Real materials and natural anatomy. No game-render, toy or miniature look.'},
 CB:{label:'Comic Book',medium:'CB',prompt:'Comic-book rendering: bold ink lines, flat color fields and graphic shading, keeping every locked design exactly the same.'}
};

// Project type changes the prompt pattern for every scene in the project.
export const PROJECT_TYPES={
 cinematic:{label:'Cinematic Film',prompt:'PROJECT TYPE: Cinematic film. Tell the moment like a movie scene: motivated camera, clear staging, natural performances.'},
 commercial:{label:'Commercial / Live Action',prompt:'PROJECT TYPE: Commercial (live action). Every vehicle, product, prop, logo, badge, trim, wheel, paint color and interior is SACRED: show it exactly as in its locked reference photos, never restyled, recolored, simplified or swapped. The product is the hero: keep it clean, well lit, fully in frame and sharp. Real people, real locations, believable ad-quality footage. No on-screen text, prices or logos unless they are in the reference.'},
 comedy:{label:'Comedy / Live Action',prompt:'PROJECT TYPE: Comedy (live action). Realistic live-action look with comedic timing: clear setups, readable reactions, physical-comedy beats and playful framing. Keep every locked character, vehicle and prop design exactly the same; the humor comes from action and performance, never from changing the designs.'}
};

// On-screen power for AI video: how much of a threat the character is in frame.
export const POWER_TIERS={
 '':{label:'Not set',prompt:''},
 standard:{label:'Standard',prompt:'normal human-level presence and strength.'},
 common_enemy:{label:'Common Enemy',prompt:'a common enemy: limited power, beatable, appears in numbers, reacts to hits and loses ground against the heroes.'},
 enhanced_enemy:{label:'Enhanced Enemy',prompt:'an enhanced enemy: clearly stronger and faster than common foes, a serious on-screen threat that takes real effort to stop; show its power through scale, speed, impact and the heroes’ caution.'},
 elite_boss:{label:'Elite / Boss',prompt:'an elite / boss-level threat: dominant presence, overwhelming power, controls the space it is in; frame it as the most dangerous thing on screen.'}
};

export const PRESET_FIELDS={biome:'biome',lighting_preset:'lighting',atmosphere:'atmosphere',world_geography:'geography'};
export function presetOptions(field){
 if(field==='biome')return BIOMES;
 if(field==='lighting_preset')return {Lighting:LIGHTING_PRESETS};
 if(field==='atmosphere')return {Atmosphere:ATMOSPHERES};
 if(field==='world_geography')return {Geography:GEOGRAPHY};
 return null;
}
export function projectStyle(m){const key=m?.world_builder?.visual_style;return Object.hasOwn(VISUAL_STYLES,key||'')?key:'';}
export function projectType(m){const key=m?.world_builder?.project_type;return Object.hasOwn(PROJECT_TYPES,key||'')?key:'';}
export function projectMedium(m){const s=projectStyle(m);return s?VISUAL_STYLES[s].medium:'';}
export function powerTier(m,id){const t=m?.asset_details?.[id]?.power_tier;return Object.hasOwn(POWER_TIERS,t||'')?t||'':'';}

// Plain prompt lines for the whole project; empty when nothing is set.
export function projectDirectionPrompt(m){
 const s=projectStyle(m),t=projectType(m);
 return [s?'PROJECT VISUAL STYLE ('+VISUAL_STYLES[s].label+'): '+VISUAL_STYLES[s].prompt:'',t?PROJECT_TYPES[t].prompt:''].filter(Boolean).join('\n');
}
export function powerTierPrompt(m,characters){
 return characters.map(c=>{const t=powerTier(m,c.id);return t&&POWER_TIERS[t].prompt?'ON-SCREEN POWER: '+c.name+' ['+c.id+'] is '+POWER_TIERS[t].prompt:''}).filter(Boolean).join('\n');
}
export const WORLD_PRESETS={schema_version:'1.0.0',biomes:BIOMES,lighting:LIGHTING_PRESETS,atmosphere:ATMOSPHERES,geography:GEOGRAPHY,visual_styles:VISUAL_STYLES,project_types:PROJECT_TYPES,power_tiers:POWER_TIERS};
