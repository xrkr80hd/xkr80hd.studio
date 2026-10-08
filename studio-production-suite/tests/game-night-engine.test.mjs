import assert from 'node:assert/strict';
import {makeGame,library} from '../public/game-night-assets/catalog.js';
import {newPlay,select,score,undo,closeClue,view,validate,clone,representative} from '../public/game-night-assets/engine.js';
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
const g=makeGame(),p=newPlay(g,['One','Two']),tid=p.teams[0].id;
test('30 complete categories and 150 nonempty clues',()=>{assert.equal(library.length,30);assert.equal(library.flatMap(c=>c.clues).length,150);assert.ok(library.every(c=>c.clues.every(q=>q.question&&q.answer)));});
test('Both boards have six categories and correct values',()=>{validate(g);assert.equal(g.rounds[0].flatMap(c=>c.clues).filter(c=>c.dailyDouble).length,1);assert.equal(g.rounds[1][0].clues[4].value,1000);});
test('Public view hides all unrevealed answers and Daily Double flags',()=>{const v=view(g,p);assert.equal(v.board[2].clues[3].dailyDouble,undefined);assert.ok(!JSON.stringify(v).includes('Jelly of the Month'));select(g,p,g.rounds[0][0].clues[0].id);assert.equal(view(g,p).clue.answer,null);});
test('Correct answer scores once and prevents another team scoring the same clue',()=>{score(g,p,tid,true);assert.equal(p.teams[0].score,100);assert.throws(()=>score(g,p,tid,true));assert.throws(()=>score(g,p,p.teams[1].id,true));});
test('Undo restores scoring eligibility and score',()=>{undo(p);assert.equal(p.teams[0].score,0);assert.equal(p.resolved,false);score(g,p,tid,false);assert.equal(p.teams[0].score,-100);});
test('Another player can answer after an incorrect response',()=>{score(g,p,p.teams[1].id,true);assert.equal(p.teams[1].score,100);});
test('Incorrect answer passes next clue to opponent, and undo restores control',()=>{const p=newPlay(g,['Alpha','Beta']);p.active=p.teams[0].id;select(g,p,g.rounds[0][1].clues[0].id);score(g,p,p.teams[0].id,false);assert.equal(p.active,p.teams[1].id);undo(p);assert.equal(p.active,p.teams[0].id);score(g,p,p.teams[0].id,false);closeClue(p);assert.equal(p.active,p.teams[1].id);});
test('Three-player wrong answers rotate to an unjudged opponent',()=>{const p=newPlay(g,['Alpha','Beta','Gamma']);p.active=p.teams[0].id;select(g,p,g.rounds[0][1].clues[1].id);score(g,p,p.teams[0].id,false);assert.equal(p.active,p.teams[1].id);score(g,p,p.teams[1].id,false);assert.equal(p.active,p.teams[2].id);score(g,p,p.teams[2].id,false);assert.equal(p.active,p.teams[0].id);});
test('Used clues cannot be replayed',()=>{const cid=p.selected;closeClue(p);assert.throws(()=>select(g,p,cid));});
test('Daily Double hides clue until wager, uses wager and settles even if incorrect',()=>{select(g,p,g.rounds[0][2].clues[3].id);assert.equal(p.phase,'double');assert.equal(view(g,p).clue,null);p.wager=375;p.phase='clue';score(g,p,tid,false);assert.equal(p.teams[0].score,-475);assert.equal(p.resolved,true);});
test('Final category hides question and answer',()=>{p.phase='final-category';p.selected=null;p.revealed=false;p.judged=[];assert.equal(view(g,p).clue,null);});
test('Final wagers apply once per player, undo across reveal works',()=>{p.phase='final-clue';p.wagers[tid]=250;score(g,p,tid,true);assert.equal(p.teams[0].score,-225);p.phase='final-answer';undo(p);assert.equal(p.teams[0].score,-475);assert.ok(!p.judged.includes(tid));});
test('Export/import and refresh preserve IDs, media and scores',()=>{g.rounds[0][0].clues[0].media={type:'image/png',name:'test',data:'data:image/png;base64,aA=='};assert.deepEqual(validate(clone(g)),g);assert.deepEqual(clone(p),p);});
test('Malformed imports are rejected',()=>{assert.throws(()=>validate({}));const bad=clone(g);bad.rounds[0][0].clues[0].media.data='javascript:alert(1)';assert.throws(()=>validate(bad));});
test('Team representatives rotate after a clue, never twice when closing an empty board',()=>{
 const p=newPlay(g,['Gold','Violet']);p.teamMode=true;p.players=[{id:'alice',teamId:p.teams[0].id},{id:'bob',teamId:p.teams[0].id},{id:'casey',teamId:p.teams[1].id}];
 assert.equal(representative(p,p.teams[0].id).id,'alice');assert.equal(representative(p,p.teams[1].id).id,'casey');
 select(g,p,g.rounds[0][0].clues[0].id);closeClue(p);assert.equal(representative(p,p.teams[0].id).id,'bob');assert.equal(representative(p,p.teams[1].id).id,'casey');
 closeClue(p);assert.equal(representative(p,p.teams[0].id).id,'bob');
 select(g,p,g.rounds[0][0].clues[1].id);closeClue(p);assert.equal(representative(p,p.teams[0].id).id,'alice');
 assert.equal(view(g,p).representatives[p.teams[0].id].id,'alice');
});
test('An empty team has no representative and individual play resolves the player card',()=>{
 const p=newPlay(g,['Solo']);p.teamMode=true;assert.equal(representative(p,p.teams[0].id),null);p.teamMode=false;assert.equal(representative(p,p.teams[0].id).name,'Solo');
});
console.log(`${checks} engine checks passed.`);
