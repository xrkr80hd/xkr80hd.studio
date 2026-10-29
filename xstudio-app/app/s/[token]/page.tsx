import type {Metadata} from 'next';
import {showcaseGallery,type ShowcaseItem} from '../../../lib/xce/showcase-backend';
import './showcase.css';

export const dynamic='force-dynamic';

export const metadata:Metadata={
 title:'Showcase · XSTUDIO',
 robots:{index:false,follow:false,nocache:true,googleBot:{index:false,follow:false,noimageindex:true}},
 referrer:'no-referrer',
};

const GROUPS:[string,string,(i:ShowcaseItem)=>boolean][]=[
 ['characters','Characters',i=>/^(characters?|creatures?)$/i.test(i.category||'')||/^(character|creature)$/i.test(i.asset_type||'')],
 ['locations','Locations & rooms',i=>/^(locations?|rooms?|environments?|maps?)$/i.test(i.category||'')||/^(location|room)$/i.test(i.asset_type||'')],
 ['props','Props, vehicles & wardrobe',i=>/^(props?|vehicles?|wardrobe|equipment)$/i.test(i.category||'')||/^(prop|vehicle|wardrobe)$/i.test(i.asset_type||'')],
 ['scenes','Scenes & shots',i=>/^(scenes?|scenes_and_shots|keyframes?|shots?|storyboards?)$/i.test(i.category||'')||/^(scene|keyframe)$/i.test(i.asset_type||'')],
];

const nice=(v:string|null)=>v?v.replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()):null;

function Ended(){
 return <main className="showcase showcase-ended"><h1>This showcase has ended</h1><p>The link was temporary and is no longer active. Ask the owner for a new one.</p></main>;
}

export default async function ShowcasePage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 let gallery;
 try{gallery=await showcaseGallery(token)}catch{return <main className="showcase showcase-ended"><h1>Showcase unavailable</h1><p>Please try again in a moment.</p></main>}
 if(!gallery)return <Ended/>;
 const {project,items,expires_at}=gallery;
 const placed=new Set<ShowcaseItem>();
 const sections=GROUPS.map(([id,label,test])=>{const list=items.filter(i=>!placed.has(i)&&test(i));list.forEach(i=>placed.add(i));return {id,label,list}});
 sections.push({id:'other',label:'Other references',list:items.filter(i=>!placed.has(i))});
 const filled=sections.filter(s=>s.list.length);
 const ends=new Date(expires_at);
 const minutes=Math.max(1,Math.round((ends.getTime()-Date.now())/60000));
 const remaining=minutes>=90?'about '+Math.round(minutes/60)+' hours':minutes+' minute'+(minutes===1?'':'s');
 return <main className="showcase">
  <header>
   <p className="showcase-eyebrow">XSTUDIO showcase{project.code?' · '+project.code:''}</p>
   <h1>{project.name}</h1>
   {project.description&&<p className="showcase-description">{project.description}</p>}
   <p className="showcase-summary">{items.length} image{items.length===1?'':'s'}{filled.length?': '+filled.map(s=>s.list.length+' '+s.label.toLowerCase()).join(', '):''}. Temporary, read-only link; expires in <time dateTime={ends.toISOString()}>{remaining}</time>.</p>
  </header>
  {!items.length&&<p className="showcase-empty">This project has no images yet.</p>}
  {filled.map(s=><section key={s.id} aria-labelledby={'sc-'+s.id}>
   <h2 id={'sc-'+s.id}>{s.label} <span>{s.list.length}</span></h2>
   <ul className="showcase-grid">
    {s.list.map((i,n)=>{const kind=nice(i.asset_type||i.category);const alt=[i.name,kind,i.code].filter(Boolean).join(' — ');return <li key={(i.id||'')+n}>
     <figure>
      <a href={i.url} rel="noreferrer noopener" target="_blank"><img src={i.url} alt={alt} loading={n<8?'eager':'lazy'} decoding="async" referrerPolicy="no-referrer"/></a>
      <figcaption>
       <strong>{i.name||'Untitled'}</strong>
       <span>{[kind,i.role&&i.role!=='IDENTITY'?nice(i.role):null].filter(Boolean).join(' · ')}</span>
       {i.code&&<code>{i.code}</code>}
      </figcaption>
     </figure>
    </li>})}
   </ul>
  </section>)}
 </main>;
}
