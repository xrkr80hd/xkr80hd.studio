import {deriveCode} from './namespace.mjs';
export const codedRecords=m=>[...Object.values(m.references||{}).map(record=>({record,type:'reference'})),...Object.values(m.scenes||{}).map(record=>({record,type:'scene'})),...Object.values(m.manifest_store||{}).flatMap(c=>Object.values(c).map(record=>({record,type:record.asset_type||'keyframe'})))];
export const recordId=r=>r.asset_id||r.scene_id||r.id;
export function assignAssetCodes(m,reserved=[]){
 const entries=codedRecords(m);const used=new Set([...reserved,...entries.map(({record:r})=>r.asset_code).filter(Boolean),...Object.values(m.trash||{}).map(t=>t.record?.asset_code).filter(Boolean)]);
 const prefix=m.active_project_code||deriveCode(m.campaign_name||'Project');let count=0;
 for(const {record:r,type} of entries){const id=recordId(r);if(r.asset_code&&(!r.asset_code_record_id||r.asset_code_record_id===id)){r.asset_code_record_id=id;continue;}
 const category={character:'CH',creature:'CR',prop:'PR',vehicle:'VH',location:'LOC',scene:'SB',keyframe:'SH',reference:'RF'}[type]||'AS';
 const name=String(r.name||r.asset_name||id||'ASSET').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10)||'ASSET';
 const base=`${prefix}-${category}-${name}`;let code=base,n=2;while(used.has(code))code=base+'-'+n++;r.asset_code=code;r.asset_code_record_id=id;used.add(code);count++;
 }return count;
}
export function exactCode(m,code){return codedRecords(m).filter(({record})=>record.asset_code===String(code).trim().toUpperCase());}
