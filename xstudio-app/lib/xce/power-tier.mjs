import {POWER_TIERS} from './world-presets.mjs';
// On-screen power lives with the asset's details; it never touches locked images or saved prompts.
export function setPowerTier(m,id,tier,type){
 if(!['character','creature','characters','creatures'].includes(type))throw Error('Only characters and creatures have on-screen power');
 if(typeof tier!=='string'||!Object.hasOwn(POWER_TIERS,tier))throw Error('Choose an on-screen power level');
 const next=structuredClone(m);next.asset_details||={};next.asset_details[id]={...next.asset_details[id]};
 if(tier)next.asset_details[id].power_tier=tier;else delete next.asset_details[id].power_tier;
 return next;
}
