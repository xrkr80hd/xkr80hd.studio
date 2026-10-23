/** Shared site / XCE_COMPOSER contracts. Runtime JSON schemas live in entity-composition.mjs. */
export interface CharacterState {
 id: string;
 character_id: string;
 name: string;
 status: 'DRAFT' | 'LOCKED';
 version: number;
 reference_ids: string[];
 /** User-authored, state-specific visual properties. Replaces baseline visual metadata. */
 visual_description: string;
}
export interface CompositeMountBinding {
 id: string;
 character_id: string;
 mount_asset_id: string;
 mode: 'riding' | 'piloting' | 'driving';
 seat: string;
 posture: string;
 equipment: string;
 movement: string;
}
export interface FormationScaleConfig {
 id: string;
 target_type: 'asset' | 'composite';
 target_id: string;
 preset: 'pair' | 'patrol' | 'squad' | 'company' | 'battalion' | 'army' | 'custom';
 /** Mounted units count pairs: N riders plus N mounts. */
 count: number;
 arrangement: string;
}
export interface EntityCompositionConfig {
 placements: {asset_id: string; state_id?: string; state_version?: number; x: number; y: number; plane: 'foreground'|'midground'|'background'; action: string}[];
 composite_bindings?: CompositeMountBinding[];
 formations?: FormationScaleConfig[];
 equipment_bindings?: EquipmentBinding[];
 character_directions?: CharacterDirection[];
 scene_setting?: SceneSetting;
 source_scene?: {scene_id: string};
}
export interface EquipmentBinding {
 id: string;
 character_id: string;
 prop_id: string;
 usage: 'wielding' | 'holding' | 'wearing' | 'using';
 body_region?: 'hands' | 'arms' | 'head' | 'back' | 'torso' | 'waist' | 'feet' | 'custom';
 side?: 'unspecified' | 'left' | 'right' | 'both' | 'center';
 orientation?: string;
 attachment: string;
 instruction: string;
}
export interface SceneSetting {
 mode: 'build' | 'reference' | 'atmosphere';
 location_id: string;
 relation: 'at' | 'inside';
 description: string;
 theme: 'none' | 'fantasy' | 'sci_fi' | 'steampunk' | 'cyberpunk' | 'futuristic' | 'retro_futuristic';
 theme_details: string;
}

export interface CharacterDirection {
 character_id: string;
 handedness: 'unspecified' | 'left' | 'right' | 'ambidextrous';
 stance: string;
 facing: string;
 body_relations: {body_part: string; relation: 'toward'|'away from'|'closer to'|'facing'|'pointing toward'; target_id: string}[];
}
