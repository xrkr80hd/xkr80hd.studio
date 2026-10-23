/** Resolve an image record, never mistake an asset ID for its attached image. */
export function assetPreviewReference(asset, references = {}) {
 const candidates = [asset.status==='LOCKED'?asset.source_image_id:null, asset.output_reference_id, asset.preview_reference_id, asset.source_image_id, asset.blueprint_id, ...(Array.isArray(asset.reference_ids) ? asset.reference_ids : []), asset.id];
 return candidates.find(id => typeof id === 'string' && Object.hasOwn(references, id)) || null;
}
