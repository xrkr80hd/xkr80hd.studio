import {VEHICLE_VIEWS,validateAspectRatio} from './visual-identity.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export async function vehicleSheet(asset,getImage){
 const model=asset.visual_identity;
 if(!model)throw Error('Vehicle identity required');
 const [horizontal,vertical]=validateAspectRatio(asset.aspect_ratio||'16:9').split(':').map(Number),ratio=horizontal/vertical;
 const width=ratio>=1?3840:Math.round(3840*ratio),height=ratio>=1?Math.round(3840/ratio):3840;
 const cellWidth=width/3,cellHeight=height/3,labelHeight=Math.min(55,cellHeight/8);
 const cells=[];
 for(let index=0;index<VEHICLE_VIEWS.length;index++){
  const view=VEHICLE_VIEWS[index],saved=model.views[view.id];
  const x=index%3*cellWidth,y=Math.floor(index/3)*cellHeight;
  if(view.id==='rear_cabin'&&Number(model.active_visual_reference.seat_rows)===1&&saved?.status==='not_applicable'&&saved.identity_revision===model.revision){cells.push(`<text x="${x+cellWidth/2}" y="${y+cellHeight/2}">REAR CABIN — NOT APPLICABLE</text>`);continue;}
  if(!saved||saved.status!=='approved'||saved.identity_revision!==model.revision)throw Error('Approve the current '+view.label+' view before combining the sheet');
  const image=await getImage(saved.reference_id);
  if(!['image/png','image/jpeg','image/webp'].includes(image.mime_type))throw Error('Vehicle views must be original PNG, JPEG or WebP images');
  cells.push(`<image x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight-labelHeight}" preserveAspectRatio="xMidYMid meet" href="data:${image.mime_type};base64,${image.base64}"/><text x="${x+cellWidth/2}" y="${y+cellHeight-labelHeight/3}">${escape(view.label)}</text>`);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#808080"/><g font-family="Arial,sans-serif" font-size="${Math.min(28,cellWidth/25)}" fill="white" text-anchor="middle">${cells.join('')}</g></svg>`;
}
