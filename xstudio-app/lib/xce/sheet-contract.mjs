// Sheet type and layout come from the current command, never conversation history.
export const CHARACTER_VIEWS=['front_body','profile_body','three_quarter_body','rear_body','front_face','profile_face'];
const need=(ok,message)=>{if(!ok)throw Error(message)};
export const SHEET_LAYOUT_SCHEMA={type:'object',additionalProperties:false,required:['asset_type','mode','medium','core_views','total_panels','rows'],properties:{asset_type:{type:'string',enum:['character','vehicle']},mode:{type:'string',enum:['simple','complex']},medium:{type:'string',enum:['RL','CB']},core_views:{type:'array',items:{type:'string'},maxItems:20},total_panels:{type:'integer',minimum:1,maximum:30},rows:{type:'integer',minimum:1,maximum:10}}};
export function sheetContract(asset){
 const deliverable=asset.target_deliverable,type=asset.asset_type||(deliverable==='character_turnaround'?'character':deliverable==='vehicle_turnaround'?'vehicle':undefined);
 need(!(type==='character'&&deliverable==='vehicle_turnaround')&&!(type==='vehicle'&&deliverable==='character_turnaround'),'Sheet category mismatch: MCS characters cannot use MVS vehicle layouts');
 if(type==='character')return {asset_type:type,target_deliverable:'character_turnaround',mode:asset.mode||'simple',medium:asset.medium||'RL',core_views:[...CHARACTER_VIEWS],full_body_views:4,face_views:2,...(asset.mode!=='complex'?{total_panels:6,rows:1,columns:6}:{}),instruction:asset.mode==='complex'?'Character complex layout: six core views, with only approved source-evidenced detail callouts.':'Character simple layout: exactly SIX columns in ONE row, in core_views order; four full bodies and two complete face portraits. No extra body rotations, extra row or vehicle camera plan.'};
 if(type==='vehicle')return {asset_type:type,target_deliverable:'vehicle_turnaround',mode:asset.mode||'simple',medium:asset.medium||'RL',core_view_count:9,instruction:'MVS vehicle layout only: seven exterior views and two cabin views. Never apply this template to a person.'};
 return null;
}
export function assertSheetReview(asset,layout){
 const contract=sheetContract(asset);if(contract?.asset_type!=='character')return;
 need(layout,'Report the inspected character sheet layout before passing review');
 need(layout.asset_type==='character'&&layout.mode===contract.mode&&layout.medium===contract.medium,'Reviewed sheet type, mode or medium differs from the character request');
 need(JSON.stringify(layout.core_views)===JSON.stringify(CHARACTER_VIEWS),'Character sheet must contain exactly four body views and two face views in the commanded order');
 if(contract.mode==='simple')need(layout.total_panels===6&&layout.rows===1,'MCS simple requires exactly six columns in one row; reject extra body views or stacked face panels');
}
