export const navigationKey='xce:last-workspace:v1';
const views=new Set(['Studio','Projects','WorldBuilder','Workspace','Assets','Story','Storyboard','LostAssets','ColorGrades','Composer','Export']);
const defaults=()=>({project:'',view:'Projects',filter:'All',query:'',scene:'all',scroll:0});
const projectId=value=>typeof value==='string'&&(value===''||/^[a-zA-Z0-9_-]{1,80}$/.test(value));
export function restoreNavigation(options={}){
 let raw=options.raw,url=options.url;
 if(raw===undefined)try{raw=globalThis.localStorage?.getItem(navigationKey)}catch{}
 if(url===undefined)try{url=globalThis.location?.href}catch{}
 let stored;try{stored=typeof raw==='string'?JSON.parse(raw):raw}catch{}
 const saved=defaults();
 if(stored&&typeof stored==='object'&&!Array.isArray(stored)&&projectId(stored.project)){
  saved.project=stored.project;saved.view=views.has(stored.view)?stored.view:'Workspace';
  if(typeof stored.filter==='string'&&stored.filter.length<=100)saved.filter=stored.filter;
  if(typeof stored.query==='string'&&stored.query.length<=500)saved.query=stored.query;
  if(typeof stored.scene==='string'&&stored.scene.length<=128)saved.scene=stored.scene;
  if(Number.isFinite(stored.scroll)&&stored.scroll>=0)saved.scroll=stored.scroll;
 }
 try{
  const location=new URL(url,'https://xstudio.invalid'),explicit=location.searchParams.has('project'),target=location.searchParams.get('project');
  if(explicit){
   if(!projectId(target))return defaults();
   if(target!==saved.project)Object.assign(saved,defaults(),{project:target,view:target?'Workspace':'Projects'});
   else saved.project=target;
  }
  const view=location.pathname==='/composer'?'Composer':location.hash.slice(1);
  if(views.has(view)){if(view!==saved.view)saved.scroll=0;saved.view=view;}
 }catch{}
 return saved;
}

