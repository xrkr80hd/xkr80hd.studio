'use client';
import {useState} from 'react';
import {assetViewData,assetId} from '../lib/xce/asset-viewer.mjs';
import {classificationValue,CLASSIFICATIONS} from '../lib/xce/classifications.mjs';
import {CAST_GROUPS,characterGroup} from '../lib/xce/cast-groups.mjs';
import {CHARACTER_RELATIONS} from '../lib/xce/character-network.mjs';
import PreviewImage from './PreviewImage';
import './asset-viewer.css';

const label=(key:string)=>key.replace(/_url$/,' image').replaceAll('_',' ');
function text(value:any):string{if(value===null||value===undefined)return '';if(Array.isArray(value))return value.map(text).filter(Boolean).join(', ');if(typeof value==='object')return Object.entries(value).map(([k,v])=>label(k)+': '+text(v)).join('\n');return String(value)}

export function AssetReadOnlyCard({asset,manifest,project,onPrev,onNext,prevDisabled=true,nextDisabled=true}:{asset:any;manifest:any;project:string;onPrev?:()=>void;onNext?:()=>void;prevDisabled?:boolean;nextDisabled?:boolean}){
 const data=assetViewData(manifest,asset),a=data.record;
 const [imageIndex,setImageIndex]=useState(0);
 const classification=classificationValue(manifest,data.id),character=a.type==='characters'||a.asset_type==='character';
 const image=(ref:string)=>'/api/manifest?'+new URLSearchParams({project,file:ref});
 const shown=data.imageIds[Math.min(imageIndex,Math.max(0,data.imageIds.length-1))];
 return <article className="asset-read-only" aria-label={'View '+(a.name||data.id)}>
  <header><h2>{a.name||a.asset_name||data.id}</h2><p>{character?(CAST_GROUPS as any)[characterGroup(manifest,data.id)]:label(classification||a.asset_type||a.type||asset.category||'Reference')}{a.status?' · '+a.status:''}</p>{a.asset_code&&<code>{a.asset_code}</code>}</header>
  <div className="asset-viewer-image">
   {shown?<PreviewImage src={image(shown)} alt={a.name||'Saved reference'} loading="lazy"/>:<p>No saved reference image.</p>}
   {onPrev&&<button type="button" className="asset-viewer-prev icon-button" aria-label="Previous asset" disabled={prevDisabled} onClick={onPrev}>‹</button>}
   {onNext&&<button type="button" className="asset-viewer-next icon-button" aria-label="Next asset" disabled={nextDisabled} onClick={onNext}>›</button>}
  </div>
  {data.imageIds.length>1&&<div className="asset-viewer-references" role="group" aria-label="Saved reference sheets">{data.imageIds.map((ref:string,index:number)=><button type="button" key={ref} aria-pressed={shown===ref} aria-label={'View reference '+(index+1)} onClick={()=>setImageIndex(index)}><PreviewImage thumbnail src={image(ref)} alt={'Reference '+(index+1)}/></button>)}</div>}
  {classification&&<p>{(CLASSIFICATIONS as any)[classification]||label(classification)}</p>}
  {data.description&&<p>{data.description}</p>}
  {data.tags.length>0&&<p><strong>Tags:</strong> {text(data.tags)}</p>}
  {data.quickDetails&&<section><h3>Details</h3><p>{data.quickDetails}</p></section>}
  {data.biography&&<section><h3>Biography</h3><p>{data.biography}</p></section>}
  {(['relationship','synergy'] as const).map(kind=>{const links=data.relationships.filter((r:any)=>(r.clause_type||'relationship')===kind);return <section key={kind}><h3>{kind==='synergy'?'Synergies':'Relationships'}</h3>{links.length?<ul>{links.map((r:any,i:number)=><li key={i}><strong>{r.target_name}</strong>: {r.kind==='custom'?r.text:(CHARACTER_RELATIONS as any)[r.kind]||label(r.kind)}{r.enabled===false?' (Disabled)':''}</li>)}</ul>:<p>None saved.</p>}</section>})}
  {data.equipment.length>0&&<section><h3>Assigned equipment</h3><ul>{data.equipment.map((r:any)=><li key={r.id}>{r.name}</li>)}</ul></section>}
  {data.assignedTo.length>0&&<section><h3>Used by</h3><ul>{data.assignedTo.map((r:any)=><li key={r.id}>{r.name}</li>)}</ul></section>}
  {data.clauses.length>0&&<section><h3>Prop and character rules</h3><ul>{data.clauses.map((r:any,i:number)=><li key={i}><strong>{r.asset_name}</strong>: {r.text}{r.enabled===false?' (Disabled)':''}</li>)}</ul></section>}
  <dl>{Object.entries(data.fields).filter(([key,value])=>!['description','biography'].includes(key)&&text(value)&&!data.imageIds.includes(value)).map(([key,value])=><div key={key}><dt>{label(key)}</dt><dd>{text(value)}</dd></div>)}</dl>
  {data.prompt&&<section><h3>Prompt anchor</h3><p className="asset-viewer-prompt">{data.prompt}</p></section>}
  {a.action_continuity&&<section><h3>Continuity</h3><p>{text(a.action_continuity)}</p></section>}
  {data.variations.length>0&&<section><h3>Variations</h3><ul>{data.variations.map((variant:any,i:number)=><li key={variant.id||i}>{typeof variant==='string'?variant:variant.name||variant.id||text(variant)}{variant.status?' · '+variant.status:''}</li>)}</ul></section>}
  {shown&&<a className="button secondary" href={image(shown)}>Download image</a>}
 </article>;
}

/** The studio's shared dialog owns the focus trap, Escape and close behavior. */
export default function AssetViewerModal({assets,manifest,project,index=0,batch=false,busy=false,onPrev,onNext,onEdit,onEditSelected,onClose}:{assets:any[];manifest:any;project:string;index?:number;batch?:boolean;busy?:boolean;onPrev:()=>void;onNext:()=>void;onEdit:(asset:any)=>void;onEditSelected:()=>void;onClose:()=>void}){
 const active=assets[index];
 return <section className="asset-viewer" aria-label={batch?'Selected asset comparison':'Asset viewer'}>
  <header className="asset-viewer-toolbar"><h2 id="modal-title">{batch?'View selected ('+assets.length+')':'Asset view'}</h2><div className="button-row">{batch?<button type="button" className="button primary" disabled={busy||!assets.length} onClick={onEditSelected}>Edit Selected</button>:<button type="button" className="button primary" disabled={busy||!active} onClick={()=>onEdit(assetViewData(manifest,active).record)}>Edit</button>}<button type="button" className="button secondary" disabled={busy} onClick={onClose}>Back to library</button></div></header>
  {batch?<div className="asset-comparison">{assets.map(a=><AssetReadOnlyCard key={assetId(a)} asset={a} manifest={manifest} project={project}/>)}</div>:active&&<AssetReadOnlyCard key={assetId(active)} asset={active} manifest={manifest} project={project} onPrev={onPrev} onNext={onNext} prevDisabled={busy||index===0} nextDisabled={busy||index===assets.length-1}/>}
  {!assets.length&&<p role="status">These selected assets are no longer available. Close this view and select them again.</p>}
 </section>;
}
