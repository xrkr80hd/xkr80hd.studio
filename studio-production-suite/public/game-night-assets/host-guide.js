// "Do this next" guidance for the Game Master console. Plain words, one action at a time, naming the exact button.
// stage: which step of the night the host is on (see hostStages).
export const hostStages=['TV on','Players join','Start','Play','Final'];
export function hostStage(play,room){
 if(play.phase==='standings')return 5;
 if(play.phase?.startsWith('final'))return 4;
 const playing=play.used?.length||play.selected;
 if(!room)return playing?3:0;
 if(!play.started)return (play.players||[]).length?2:1;
 return 3;
}
export function hostNextStep(play,room,clue){
 const playing=play.used?.length||play.selected;
 if(!room&&!playing)return {title:'Put the board on the TV',text:'Click the glowing “📺 Open TV board” button. A new window opens: drag it onto the TV and press F11 (or the Fullscreen button) so it fills the screen. No phones? You can skip this and just click a number on the board.',action:'tv',button:'📺 Open TV board'};
 if(room&&!play.started&&!(play.players||[]).length)return {title:'Wait for players to join',text:'Everyone scans the QR code on the TV with their phone camera, types their name and picks a team. Their names show up under “Who’s here” below. Room code: '+room.code+'.',action:'start-online-game',button:'▶ Start the game'};
 if(room&&!play.started)return {title:'Everyone in? Start the game',text:'Check that each player picked a team (see “Who’s here” below). When everyone is ready, click “▶ Start the game”.',action:'start-online-game',button:'▶ Start the game'};
 if(play.phase==='board')return {title:'Pick a question',text:'Click any number on the board (left side) to open that question. If the player on turn picks it on their phone, it opens by itself.'};
 if(play.phase==='double')return {title:'Daily Double! Set the bet',text:'Only the team on turn plays this one. Type how many points they want to bet, then click “Lock wager & show clue”.'};
 if(play.phase==='final-category')return {title:'Final showdown: collect bets',text:'Each team bets some of its points. Type every team’s bet (or wait for their phones), then click “Lock wagers & start final”.'};
 if(play.phase?.startsWith('final'))return {title:'Final showdown: judge each team',text:'Read the final question aloud. When time is up click “Reveal answer”, then click ✓ or ✕ for every team. Finish with “Show standings”.'};
 if(play.phase==='standings')return {title:'Game over: celebrate!',text:'The winners are on the TV. To play again, go to Main menu → Host a game.'};
 if(play.resolved||play.revealed)return {title:'Go back to the board',text:'This question is finished. Click “Back to board →” to choose the next one.',action:'close-clue',button:'Back to board →'};
 if(play.winner&&!(play.judged||[]).length)return {title:'Read it out loud, then judge',text:'Read the question to the room. The team on turn answers first (no buzzing). Compare their answer with the gold answer box (only you see it), then click ✓ Correct or ✕ Wrong.'};
 if(play.winner)return {title:'Did they get it right?',text:'Listen to their answer, compare it with the gold answer box (only you can see it), then click ✓ Correct or ✕ Wrong.'};
 if(clue?.dailyDouble)return {title:'Did they get it right?',text:'The team on turn answers the Daily Double. Click ✓ Correct or ✕ Wrong.'};
 if(play.buzzOpen)return {title:'Buzzers are OPEN',text:'Wait. The first team to buzz shows up here automatically, then you judge their answer.'};
 if(!(play.judged||[]).length)return {title:'Read the question out loud',text:'Read the question on your screen to the room. The team on turn answers first (no buzzing). Then click ✓ Correct or ✕ Wrong. If nobody knows, click “▶ Open buzzers” so any team can try.',action:'open-buzz',button:'▶ Open buzzers'};
 return {title:'Wrong! Let another team steal',text:'Click “▶ Open buzzers”. The TV counts down 3-2-1, then the fastest team to buzz gets a chance to steal the points.',action:'open-buzz',button:'▶ Open buzzers'};
}
