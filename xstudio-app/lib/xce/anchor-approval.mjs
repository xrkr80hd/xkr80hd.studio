import {assetPreviewReference} from './asset-preview.mjs';
// Owner approval of an existing uploaded image, separate from renderer review.
export function approveCharacterAnchor(manifest,{asset_id,source_image_id,confirm,sha256,now=new Date().toISOString()}){
 if(confirm!==true)throw Error('Review the displayed image and explicitly approve it before locking');
 if(!/^[a-f0-9]{64}$/.test(sha256||''))throw Error('Stored image bytes must be verified before locking');
 const next=structuredClone(manifest),asset=next.manifest_store?.characters?.[asset_id];
 if(!asset||asset.deleted_at||asset.asset_type!=='character')throw Error('Character not found in this project');
 if(asset.status!=='DRAFT')throw Error('Only a draft character can be locked');
 const expected=assetPreviewReference(asset,next.references);
 if(!expected||source_image_id!==expected)throw Error('The character image changed. Reopen it and review the current image');
 const ref=next.references?.[source_image_id];
 if(!ref?.key||ref.deleted_at||ref.role==='DIAGNOSTIC')throw Error('A saved production image is required');
 asset.status='LOCKED';asset.source_image_id=source_image_id;asset.locked_at=now;
 asset.approval_instruction='Owner reviewed and approved the displayed character image in XSTUDIO.';
 asset.owner_image_approval={source:'OWNER_VISUAL_APPROVAL',reference_id:source_image_id,sha256,approved_at:now};
 for(const other of Object.values(next.manifest_store.characters))if(other.asset_id!==asset.asset_id&&asset.namespace_root&&other.namespace_root===asset.namespace_root&&other.status==='DRAFT'){other.discarded_for_production=true;other.selected_anchor_id=asset.asset_id;}
 delete asset.discarded_for_production;delete asset.selected_anchor_id;
 return {manifest:next,asset};
}
