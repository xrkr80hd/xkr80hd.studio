import {assetPreviewReference} from './asset-preview.mjs';
// Explicit owner lock of an existing image, separate from renderer review.
export function approveCharacterAnchor(manifest,{asset_id,source_image_id,confirm,sha256,now=new Date().toISOString()}){
 if(confirm!==true)throw Error('Choose Lock character to lock this reference');
 if(!/^[a-f0-9]{64}$/.test(sha256||''))throw Error('Stored image bytes must be verified before locking');
 const next=structuredClone(manifest),asset=next.manifest_store?.characters?.[asset_id];
 if(!asset||asset.deleted_at||asset.asset_type!=='character')throw Error('Character not found in this project');
 const expected=assetPreviewReference(asset,next.references);
 if(!expected||source_image_id!==expected)throw Error('The character image changed. Reopen it and review the current image');
 const ref=next.references?.[source_image_id];
 if(!ref?.key||ref.deleted_at||ref.role==='DIAGNOSTIC')throw Error('A saved production image is required');
 // The owner's explicit approval is the lock gate, regardless of workflow status or cast role.
 // Repeating the same lock is safe, but cannot replace a pinned image or its verified bytes.
 if(asset.status==='LOCKED'){
  if(asset.source_image_id!==source_image_id)throw Error('The locked character image changed. Reopen it and review the current image');
  if(asset.owner_image_approval?.sha256){
   if(asset.owner_image_approval.sha256!==sha256)throw Error('The locked character image bytes changed. Reopen it and review before locking');
   return {manifest:next,asset};
  }
 }
 asset.status='LOCKED';asset.source_image_id=source_image_id;asset.locked_at=now;
 asset.approval_instruction='Owner explicitly locked the displayed character image in XSTUDIO.';
 asset.owner_image_approval={source:'OWNER_EXPLICIT_LOCK',reference_id:source_image_id,sha256,approved_at:now};
 for(const other of Object.values(next.manifest_store.characters))if(other.asset_id!==asset.asset_id&&asset.namespace_root&&other.namespace_root===asset.namespace_root&&other.status==='DRAFT'){other.discarded_for_production=true;other.selected_anchor_id=asset.asset_id;}
 delete asset.discarded_for_production;delete asset.selected_anchor_id;
 return {manifest:next,asset};
}

export function unlockCharacterAnchor(manifest,{asset_id,source_image_id,confirm,now=new Date().toISOString()}){
 if(confirm!==true)throw Error('Confirm unlocking this character before editing');
 const next=structuredClone(manifest),asset=next.manifest_store?.characters?.[asset_id];
 if(!asset||asset.deleted_at||asset.asset_type!=='character')throw Error('Character not found in this project');
 if(asset.status!=='LOCKED')throw Error('Only a locked character can be unlocked');
 if(!asset.source_image_id||source_image_id!==asset.source_image_id)throw Error('The locked image changed. Reopen the character');
 asset.anchor_lock_history=[...(asset.anchor_lock_history||[]),{action:'OWNER_UNLOCK',source_image_id:asset.source_image_id,locked_at:asset.locked_at||null,approval_instruction:asset.approval_instruction||null,owner_image_approval:asset.owner_image_approval||null,immutable_traits:structuredClone(asset.immutable_traits||{}),unlocked_at:now}].slice(-20);
 asset.status='DRAFT';asset.unlocked_at=now;
 delete asset.locked_at;delete asset.approval_instruction;delete asset.owner_image_approval;
 return {manifest:next,asset};
}

// Shared owner approval for saved props, beasts, vehicles and other library assets.
export function anchorAsset(manifest,id){
 const entries=[...Object.entries(manifest.manifest_store||{}).filter(([type])=>['characters','creatures','props','vehicles','locations'].includes(type)).flatMap(([type,items])=>Object.values(items||{}).filter(a=>(a.asset_id||a.id)===id).map(asset=>({asset,type,legacy:true}))),...Object.entries(manifest.world_library||{}).flatMap(([type,items])=>Object.values(items||{}).filter(a=>a.id===id).map(asset=>({asset,type,legacy:false})))];
 if(entries.length!==1||entries[0].asset.deleted_at)throw Error('Asset not found or ambiguous in this project');
 return entries[0];
}
export function approveAssetAnchor(manifest,args){
 const entry=anchorAsset(manifest,args.asset_id);
 if(entry.legacy&&entry.type==='characters')return approveCharacterAnchor(manifest,args);
 if(args.confirm!==true)throw Error('Choose Lock asset to approve this reference');
 if(!/^[a-f0-9]{64}$/.test(args.sha256||''))throw Error('Stored image bytes must be verified before locking');
 const next=structuredClone(manifest),{asset}=anchorAsset(next,args.asset_id),expected=assetPreviewReference(asset,next.references),ref=next.references?.[args.source_image_id];
 if(!expected||args.source_image_id!==expected)throw Error('The asset image changed. Reopen it and review the current image');
 if(!ref?.key||ref.deleted_at||ref.role==='DIAGNOSTIC')throw Error('A saved production image is required');
 if(asset.status==='LOCKED'&&asset.owner_image_approval?.sha256){if(asset.owner_image_approval.sha256!==args.sha256)throw Error('The locked asset image bytes changed');return {manifest:next,asset};}
 const now=args.now||new Date().toISOString();
 asset.status='LOCKED';asset.source_image_id=args.source_image_id;asset.locked_at=now;
 asset.approval_instruction='Owner explicitly locked the displayed asset image in XSTUDIO.';
 asset.owner_image_approval={source:'OWNER_EXPLICIT_LOCK',reference_id:args.source_image_id,sha256:args.sha256,approved_at:now};
 return {manifest:next,asset};
}
export function unlockAssetAnchor(manifest,args){
 const entry=anchorAsset(manifest,args.asset_id);
 if(entry.legacy&&entry.type==='characters')return unlockCharacterAnchor(manifest,args);
 if(args.confirm!==true)throw Error('Confirm unlocking this asset before editing');
 const next=structuredClone(manifest),{asset}=anchorAsset(next,args.asset_id);
 if(asset.status!=='LOCKED')throw Error('Only a locked asset can be unlocked');
 if(args.source_image_id!==assetPreviewReference(asset,next.references))throw Error('The locked image changed. Reopen the asset');
 const now=args.now||new Date().toISOString();
 asset.anchor_lock_history=[...(asset.anchor_lock_history||[]),{action:'OWNER_UNLOCK',owner_image_approval:asset.owner_image_approval||null,source_image_id:args.source_image_id,unlocked_at:now}].slice(-20);
 asset.status='DRAFT';asset.unlocked_at=now;delete asset.locked_at;delete asset.approval_instruction;delete asset.owner_image_approval;
 return {manifest:next,asset};
}
