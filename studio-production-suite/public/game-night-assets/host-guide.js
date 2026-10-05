export function hostNextStep(play,room,clue){
 if(!room)return {title:'Connect player phones',text:'This is a local game. Phones in an online room cannot receive these clues. Connect phones, then open the TV board for that same room.',action:'connect',button:'Connect phones'};
 if(!play.started)return {title:'Check the roster and start the room',text:'Show the TV board QR. Have players join and choose a team, then click Start game.',action:'start-online-game',button:'Start game'};
 if(play.phase==='board')return {title:'Choose a category and point value',text:'The highlighted representative chooses on their phone, or you click a tile. Read the clue before opening buzzers.'};
 if(play.phase==='double')return {title:'Lock the Daily Double wager',text:'Only the selected team answers this clue. Enter its wager, then lock it to show the question.'};
 if(play.phase.startsWith('final'))return {title:'Run the final showdown',text:'Collect wagers, lock wagers to show the clue, reveal the answer, judge every team, then show standings.'};
 if(play.phase==='standings')return {title:'Celebrate your winners',text:'The final scores are on the TV board.'};
 if(play.resolved||play.revealed)return {title:'Return to the board',text:'This clue is closed. Return to the board to rotate players and choose the next clue.',action:'close-clue',button:'Return to board'};
 if(play.winner)return {title:'Judge the answering team',text:'Listen to the answer, then click Correct or Incorrect. After an incorrect answer, reopen buzzers for the remaining teams.'};
 if(clue?.dailyDouble)return {title:'Judge the Daily Double',text:'The selected team answers without buzzing. Mark its answer Correct or Incorrect.'};
 if(play.buzzOpen)return {title:'Buzzers are OPEN',text:'Wait for the first eligible player to buzz. The winner will appear here automatically.'};
 return {title:'Read the question, then open buzzers',text:'Phones are LOCKED while you read. Click Open buzzers when players may answer.',action:'open-buzz',button:'Open buzzers'};
}
