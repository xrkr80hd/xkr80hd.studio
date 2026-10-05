// Run against local Next: GAME_QA_BASE=http://127.0.0.1:3000 node tests/game-night-visual-qa.mjs
// Fixtures never create or update production rooms. Screenshots are viewport simulations,
// not physical 55-inch/85-inch viewing-distance measurements.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.GAME_QA_PLAYWRIGHT||'playwright');
const base=process.env.GAME_QA_BASE||'http://127.0.0.1:3000';
const output=process.env.GAME_QA_OUTPUT||'/tmp/ultimate-game-night-qa';
await fs.mkdir(output,{recursive:true});
const teams=[{id:'gold',name:'Golden Legends',score:1800,color:'#ffcb46'},{id:'violet',name:'Purple Lightning',score:1400,color:'#9a70ff'}];
const players=Array.from({length:8},(_,i)=>({id:'player-'+i,name:['Alex','Taylor','Jordan','Sam','Casey','Morgan','Riley','Jamie'][i],teamId:i<4?'gold':'violet',photo:''}));
const publicState={title:'ULTIMATE GAME NIGHT',theme:'electric',teamMode:true,started:true,players,turns:{},round:0,phase:'board',teams,active:'gold',used:[],selected:null,revealed:false,deadline:null,buzzOpen:false,winner:null,finalCategory:'The Grand Finale',board:['Music Legends','Picture This','Movie Magic','Wild Science','Around the World','Crowd Favorites'].map((name,i)=>({name,clues:[100,200,300,400,500].map((value,j)=>({id:`clue-${i}-${j}`,value}))})),clue:null};
const browser=await chromium.launch({headless:true,executablePath:process.env.GAME_QA_CHROMIUM,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
for(const viewport of [{width:390,height:844},{width:1440,height:900},{width:1980,height:1020},{width:3840,height:2160}]){
 const context=await browser.newContext({viewport,deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let state=structuredClone(publicState);
 await page.route('**/api/game-night/room',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({code:'QA2ABC',version:1,public:state,players,me:'player-0',buzz:{}})}));
 for(const phase of ['lobby','board','clue','reveal']){
 state.started=phase!=='lobby';state.phase=['clue','reveal'].includes(phase)?'clue':'board';state.revealed=phase==='reveal';state.clue=state.phase==='clue'?{question:'Which famous landmark stands beside the River Seine in Paris?',answer:state.revealed?'The Eiffel Tower':null,media:null}:null;
 await page.goto(base+'/game-night?mode=stage&room=QA2ABC');await page.waitForTimeout(500);
 await page.locator('#app').waitFor();assert.equal(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth+2),true,`horizontal overflow ${viewport.width} ${phase}`);
 const visibleText=await page.locator('#app').innerText();assert.ok(visibleText.includes('Golden Legends'));if(phase==='reveal')assert.ok(visibleText.includes('The Eiffel Tower'));else assert.ok(!visibleText.includes('The Eiffel Tower'));
 await page.screenshot({path:`${output}/${viewport.width}x${viewport.height}-${phase}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[],`browser errors at ${viewport.width}`);await context.close();
}
console.log(`PASS 16 public display scenarios; screenshots ${output}`);
}finally{await browser.close();}
