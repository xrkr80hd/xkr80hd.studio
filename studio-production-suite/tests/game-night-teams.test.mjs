import assert from 'node:assert/strict';
import {makeGame} from '../public/game-night-assets/catalog.js';
import {newPlay,view,id,select,score,closeClue} from '../public/game-night-assets/engine.js';
const endpoint='https://goufiujqycnkvewkvegq.supabase.co/functions/v1/family-game';
const host={token:id()+id()},a={token:id()+id()},b={token:id()+id()},c={token:id()+id()};
async function call(action,session,data={},error=false){const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...session,data}),signal:AbortSignal.timeout(20000)});const d=await response.json();if(error){assert.ok(d.error);return d;}if(d.error)throw Error(d.error);return d;}
const game=makeGame('QA team assignment — temporary'),play=newPlay(game,['Team Gold','Team Violet']);play.teamMode=true;play.players=[];const created=await call('create',host,{state:{game,play,settings:game.settings},public:view(game,play)});for(const s of [host,a,b,c])s.code=created.code;let version=created.version;console.log('QA_ROOM='+host.code);
const pa=await call('join',a,{name:'Alice'}),pb=await call('join',b,{name:'Bob'}),pc=await call('join',c,{name:'Casey'});
let d=await call('assign_team',a,{teamId:play.teams[0].id,playerId:pb.me});assert.equal(d.players.find(p=>p.id===pa.me).teamId,play.teams[0].id);assert.equal(d.players.find(p=>p.id===pb.me).teamId,undefined);console.log('PASS phone selects own team; cannot move another player');
d=await call('assign_team',host,{playerId:pb.me,teamId:play.teams[0].id});assert.equal(d.players.find(p=>p.id===pb.me).teamId,play.teams[0].id);console.log('PASS host assigns a joined player');
await call('assign_team',c,{teamId:'missing'},true);console.log('PASS invalid team is rejected');
async function update(){const d=await call('update',host,{version,state:{game,play,settings:game.settings},public:view(game,play),resetBuzz:true});version=d.version;}
d=await call('read',host);play.players=d.players;play.started=true;play.active=play.teams[0].id;play.turns={};await update();
await call('pick_request',b,{clueId:game.rounds[0][0].clues[0].id},true);await call('pick_request',a,{clueId:'missing'},true);
d=await call('pick_request',a,{clueId:game.rounds[0][0].clues[0].id});assert.equal(d.submissions,undefined);await call('pick_request',a,{clueId:game.rounds[0][0].clues[1].id},true);
d=await call('read',host);assert.equal(d.submissions[pa.me].pick,game.rounds[0][0].clues[0].id);console.log('PASS only active representative chooses an unused clue, once, and selection stays private');
select(game,play,game.rounds[0][0].clues[0].id);play.buzzOpen=true;await update();await call('buzz',c,{},true);await call('assign_team',b,{teamId:play.teams[1].id},true);d=await call('buzz',a);assert.equal(d.buzz.winner,pa.me);await call('answer',a,{text:'My answer'});await call('answer',b,{text:'Wrong member'},true);console.log('PASS only assigned player can buzz; only winning player can answer; team changes lock during clue');
score(game,play,play.teams[0].id,false);play.buzzOpen=true;await update();await call('buzz',b,{},true);console.log('PASS incorrect answer blocks another member of the same team');
closeClue(play);play.active=play.teams[0].id;await update();
await call('pick_request',a,{clueId:game.rounds[0][0].clues[1].id},true);await call('pick_request',b,{clueId:game.rounds[0][0].clues[1].id});
select(game,play,game.rounds[0][0].clues[1].id);play.winner=play.teams[0].id;play.deadline=Date.now()+20000;await update();
await call('answer',a,{text:'Not my turn'},true);await call('answer',b,{text:'My turn'});console.log('PASS category picker rotates and manual assigned answer is limited to representative');
play.phase='final-category';play.revealed=false;play.teams[0].score=500;await update();await call('wager',a,{text:'300'},true);await call('wager',b,{text:'300'});await call('wager',b,{text:'501'},true);console.log('PASS wager uses team score');
d=await call('read',a);assert.equal(d.state,undefined);assert.equal(d.submissions,undefined);assert.ok(d.players.every(p=>!p.hash));console.log('PASS team player response keeps host answers and secrets private');
console.log('Team room integration checks passed. QA_ROOM='+host.code);
