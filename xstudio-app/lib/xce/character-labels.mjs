export const CHARACTER_GENDERS={unspecified:'Not set',male:'Male',female:'Female',other:'Other'};

// Entity identity and cast placement are independent metadata.
export const ENTITY_TYPES={human:'Human / Mortal',anthropomorphic:'Anthropomorphic (Animal with Human Traits)',magical_being:'Magical Being / Esper',creature_beast:'Creature / Beast',synthetic:'Android / Synthetic / Element',artifact:'Prop / Weapon / Artifact'};
export const NARRATIVE_ROLES={main:'Main Cast',supporting:'Supporting Cast',villain:'Antagonist / Villain',sub_villain:'Sub-Villain / Henchman',background:'Background / Crowd / Extra'};
export function characterEntityType(m,id){
 const saved=m.asset_details?.[id]?.entity_type;
 if(saved)return saved;
 const classification=m.asset_details?.[id]?.secondary_classification;
 const category=m.asset_details?.[id]?.library_category;
 return classification==='magical_being'||category==='magical_beings'?'magical_being':classification==='creature_beast'||category==='beasts'?'creature_beast':'';
}
