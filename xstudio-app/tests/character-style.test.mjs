import test from 'node:test';
import assert from 'node:assert/strict';
import {editAsset} from '../lib/xce/asset-edit.mjs';
import {emptyWorld,worldRecords,validateWorld} from '../lib/xce/world-library.mjs';
for(const legacy of [false,true])test('style saves on same '+(legacy?'legacy':'native')+' character and survives reload',()=>{
 const record={id:'C',asset_id:'C',name:'Test',type:'characters',status:'LOCKED',reference_ids:['R'],source_image_id:'R',medium:'RL',metadata:{style_anchor:'RL'}};
 const m={references:{R:{role:'IDENTITY'}},world_library:emptyWorld(),manifest_store:{characters:{}},scenes:{}};
 if(legacy)m.manifest_store.characters.C=record;else m.world_library.characters.C=record;
 const result=editAsset(m,'C',{description:'',clauses:[],medium:'CB'});
 const reloaded=JSON.parse(JSON.stringify(result.manifest));
 if(!legacy)reloaded.world_library=validateWorld(reloaded.world_library,reloaded);
 const saved=worldRecords(reloaded).find(a=>a.id==='C');
 assert.equal(legacy?saved.medium:saved.metadata.style_anchor,'CB');assert.equal(saved.status,'LOCKED');assert.deepEqual(saved.reference_ids,['R']);assert.equal(worldRecords(reloaded).length,1);
 assert.throws(()=>editAsset(m,'C',{description:'',clauses:[],medium:'invalid'}),/Realistic/);
 assert.equal(record.medium,'RL');
});
