import {libraryFolder} from './library-groups.mjs';
import {unassignedReferences} from './attachments.mjs';
export function assetSections(manifest){
 const sections=[
  ['characters','Characters','character','People used in your scenes.'],
  ['creatures','Creature / Beast','creature','Animals, monsters, and other creatures.'],
  ['props','Props','prop','Objects and equipment.'],
  ['vehicles','Vehicles','vehicle','Cars, ships, aircraft, and other vehicles.'],
  ['locations','Locations','location','Rooms, places, and environments.'],
  ['scenes','Scenes','scene','Scene plans and saved scene images.'],
  ['notes','Reference Notes and Corrections','reference','Ideas, screenshots, and correction notes.'],
  ['marketing','Marketing Graphics','reference','Saved promotional images.'],
  ['references','Reference Uploads','reference','Unassigned images. Open an image to name and categorize it.']
 ].map(([id,label,entity,description])=>({id,label,entity,description,records:[]}));
 const byId=Object.fromEntries(sections.map(s=>[s.id,s]));
 for(const [category,items] of Object.entries(manifest.manifest_store||{})){
  if(byId[category])byId[category].records.push(...Object.values(items).map(a=>({...a,category})));
 }
 byId.scenes.records.push(...Object.values(manifest.scenes||{}).map(a=>({...a,category:'scenes',asset_id:a.scene_id})));
 for(const r of unassignedReferences(manifest)){
  const folder=libraryFolder(r);
  const type=({character:'characters',creature:'creatures',prop:'props',vehicle:'vehicles',location:'locations',scene:'scenes'})[r.asset_type];
  const role=({PROP:'props',LOCATION:'locations',BLUEPRINT:'scenes',IDENTITY:'characters',COSTUME:'characters'})[r.role];
  let category;
  if(folder==='Reference Notes and Corrections')category='notes';
  else if(folder==='Marketing Graphics')category='marketing';
  else if(folder==='Scenes')category='scenes';
  else if(folder==='Correct Character Sheets'||folder==='needs to be generated correctly')category='characters';
  else if(folder==='Props and Locations')category=['props','locations','vehicles'].includes(type)?type:['props','locations'].includes(role)?role:'references';
  else category=type||role||'references';
  byId[category].records.push({...r,category:'references',asset_id:r.id});
 }
 return sections.filter(s=>s.records.length||!['notes','marketing'].includes(s.id));
}
