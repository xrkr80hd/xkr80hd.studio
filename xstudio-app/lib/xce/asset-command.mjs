import {splitEdit,validateVin} from './visual-identity.mjs';
const need=(ok,message)=>{if(!ok)throw Error(message)};
export function parseAssetCommand(text,defaults={}){
 const edit=splitEdit(String(text));const input=edit.head;
 const match=/^(MVS|MCS|CRS|BEAST|CREATURE|PRS|RVH|VH|LOC)\s*(RL|CB)?\s*(CMPLX|COMPLEX|SMPLE|SMPL|SIMPLE)?(?=\s|,|[-–—]|$)/i.exec(input);
 need(match,'Use MCS, MVS, CRS, PRS, RVH or LOC with optional RL/CB and SMPL/CMPLX.');
 for(let i=1;i<match.length;i++)if(match[i])match[i]=match[i].toUpperCase();
 const tail=input.slice(match[0].length).replace(/^\s*[,–—-]?\s*/, '');
 let parts=tail.split(/\s*,\s*|\s+[–—-]\s*|\s*[–—]\s*/).map(s=>s.trim());
 if(parts.length===1){const known=/^(Star\s*Tropics|Final\s+Fantasy\s+(?:VI|6)|Walker\s+Automotive|WLKR\s+AUTO|FF6|SRT|RANDO|WA)\s+(.+)$/i.exec(tail);if(known)parts=[known[1],known[2]];}
 let vin,vehicleDescription;
 // MVS make - model - trim [VIN] has no implicit project name.
 // Retain project - vehicle - VIN for previously saved command workflows.
 if(match[1]==='MVS'&&parts.length>=3){
  const standalone=parts.length===3&&/^[A-Za-z0-9]{17}$/.test(parts[2]);
  if(standalone){vin=validateVin(parts.pop()).vin;}
  else{
   if(parts.length===4)vin=validateVin(parts.pop()).vin;
   need(parts.length===3,'Use MVS - make - model - trim [VIN], then optional edit instructions.');
   const attached=/^(.*?)\s+(?:VIN\s*:?\s*)?([A-Za-z0-9]{17})$/i.exec(parts[2]);
   if(attached){need(!vin,'Provide only one VIN');vin=validateVin(attached[2]).vin;parts[2]=attached[1].trim();}
   need(parts.every(Boolean),'Make, model and trim must be nonempty');
   vehicleDescription={make:parts[0],model:parts[1],trim:parts[2]};
   parts=[parts.join(' ')];
  }
 }else if(parts.length===3){vin=validateVin(parts.pop()).vin;}
 need(parts.length>=1&&parts.length<=2&&parts.every(Boolean),'Use command, project, name, optional VIN, then optional edit:.');
 let type={MVS:'vehicle',MCS:'character',CRS:'creature',BEAST:'creature',CREATURE:'creature',PRS:'prop',RVH:'vehicle',VH:'vehicle',LOC:'location'}[match[1]];
 if(match[1]==='MCS')need(!vin&&defaults.asset_type!=='vehicle','Use MVS (Make Vehicle Sheet) for vehicles; MCS is Make Character Sheet.');
 need(!vin||type==='vehicle','VIN is only supported for vehicle assets');
 return {asset_type:type,mode:['CMPLX','COMPLEX'].includes(match[3])?'complex':'simple',medium:match[2]||'RL',...(parts.length===2?{project_name:parts[0]}:{}),name:parts.at(-1),...(vin?{vin}:{}),...(vehicleDescription?{vehicle_description:vehicleDescription}:{}),...(edit.edit_instruction?{edit_instruction:edit.edit_instruction,edit_intent:edit.edit_intent}:{})};
}
