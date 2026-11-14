const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=text=>String(text||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function suggestedDifficulty(question,index=0){const words=normalize(question).split(' ').filter(Boolean).length;return words>35||index>=4?'hard':words>18||index>=2?'medium':'easy';}
export function reviewContent(categories){const seen=new Map(),issues=[];for(const category of categories){for(const [index,q] of (category.clues||[]).entries()){const label=`${category.name} · clue ${index+1}`,key=normalize(q.question);if(!key)issues.push(`${label}: add a question.`);else if(seen.has(key))issues.push(`${label}: duplicates ${seen.get(key)}.`);else seen.set(key,label);if(!String(q.answer||'').trim())issues.push(`${label}: add the correct answer.`);if(/\b(best|greatest|favorite|currently|today|recently|this year)\b/i.test(q.question||''))issues.push(`${label}: specify an objective fact or a date.`);if(String(q.question||'').length>220)issues.push(`${label}: shorten for across-the-room reading.`);if(!q.source)issues.push(`${label}: add a reference before using an unverified fact.`);}}return issues;}

// Prompt the Game Master copies into ChatGPT (or any chatbot). It asks for one fixed plain-text format we can read back.
export function buildChatPrompt({topic,audience,difficulty}){return `Write one trivia category for a family game night (a Jeopardy-style board).

Topic: ${topic||'(choose a fun topic)'}
Players: ${audience||'family-friendly, mixed ages'}
Difficulty: ${difficulty||'mixed'}, getting harder from clue 1 (100 points) to clue 5 (500 points)

Rules:
- Exactly 5 clues. Each clue has ONE clear, correct answer.
- Keep each question short enough to read aloud across a room (under 25 words).
- Only use facts you are sure of. No opinions, no "best/favorite", nothing that changes over time.
- Family friendly. No song lyrics.

Reply with ONLY this format, nothing before or after it:

CATEGORY: <category name, max 4 words>
1. Q: <question> | A: <answer> | ALSO: <other accepted answers, or leave blank>
2. Q: <question> | A: <answer> | ALSO: <other accepted answers, or leave blank>
3. Q: <question> | A: <answer> | ALSO: <other accepted answers, or leave blank>
4. Q: <question> | A: <answer> | ALSO: <other accepted answers, or leave blank>
5. Q: <question> | A: <answer> | ALSO: <other accepted answers, or leave blank>`;}

// Reads ChatGPT's reply back. Tolerates markdown (**bold**, bullets), "Question:/Answer:" spelled out,
// one line per clue with | separators, or Q and A on separate lines.
export function parsePastedCategory(text){let name='',clues=[],cur=null;const keyOf=k=>{k=k.toLowerCase().replace(/[^a-z ]/g,'').trim();return /^(category|category name|title|topic)$/.test(k)?'category':/^(q|question|clue)$/.test(k)?'q':/^(a|answer)$/.test(k)?'a':/^(also|also accept|accepted|alternates?|other answers?)$/.test(k)?'also':/^(note|notes|host note)$/.test(k)?'note':null;};
 for(let line of String(text||'').split(/\r?\n/)){line=line.replace(/[*_`#>]+/g,'').replace(/^\s*(?:[-•]|\d+\s*[.):-])\s*/,'').trim();if(!line)continue;
  for(const part of line.split('|')){const m=part.match(/^\s*([A-Za-z][A-Za-z ]{0,20}?)\s*\d*\s*[:–-]\s*(.*)$/);if(!m)continue;const key=keyOf(m[1]),value=m[2].trim();if(!key)continue;
   if(key==='category'){if(!name)name=value;}else if(key==='q'){cur={question:value,answer:'',accepted:'',note:''};clues.push(cur);}else if(cur){if(key==='a')cur.answer=value;else if(key==='also')cur.accepted=/^(none|n\/?a|-|blank|leave blank)$/i.test(value)?'':value;else if(key==='note')cur.note=value;}}}
 clues=clues.filter(q=>q.question&&q.answer);if(clues.length<5)throw Error(clues.length?`Found only ${clues.length} complete clue${clues.length===1?'':'s'} (question AND answer). You need 5. Ask ChatGPT to “use the exact format”, then paste again.`:'Couldn’t find any clues. Make sure you pasted ChatGPT’s whole answer, in the CATEGORY / Q: / A: format.');
 return {category:(name||'New category').slice(0,80),clues:clues.slice(0,5).map(q=>({question:q.question.slice(0,2000),answer:q.answer.slice(0,500),accepted:q.accepted.slice(0,500),note:q.note.slice(0,1000)}))};}

// Writing assistant: 1) topic, 2) copy prompt for ChatGPT, 3) paste the reply, preview, pick a slot, fill it.
// Hook receives modal(html), slots [{name}], selected slot index, and onApply(draft, slotIndex).
export async function openAiAssistant({modal,slots=[],selected=0,onApply}){let draft=null;
 modal(`<div class="ai-wizard"><div class="eyebrow">CATEGORY WRITER</div><h2>Write a category with ChatGPT</h2><p class="help">Three steps. Nothing in your game changes until you click “Fill slot”.</p>
 <section class="ai-step"><div class="ai-step-num">1</div><div><h3>What should it be about?</h3><label class="field">Topic<input id="ai-topic" maxlength="200" placeholder="e.g. 90s cartoons, our family vacations, dog breeds" value="${escape(slots[selected]?.name&&!/^new category$/i.test(slots[selected].name)?slots[selected].name:'')}"></label><div class="row"><label class="field">Who’s playing<input id="ai-audience" maxlength="200" value="Family-friendly, mixed ages"></label><label class="field">Difficulty<select id="ai-difficulty"><option>Mixed: easy to hard</option><option>Easy (kids can play)</option><option>Hard (trivia fans)</option></select></label></div></div></section>
 <section class="ai-step"><div class="ai-step-num">2</div><div><h3>Copy this prompt into ChatGPT</h3><p class="help">Click <b>Copy prompt</b>, open <a href="https://chatgpt.com" target="_blank" rel="noopener">ChatGPT ↗</a>, paste it in and press Enter.</p><textarea id="ai-prompt" class="ai-prompt" readonly rows="9"></textarea><button type="button" id="ai-copy" class="primary">📋 Copy prompt</button></div></section>
 <section class="ai-step"><div class="ai-step-num">3</div><div><h3>Paste ChatGPT’s answer here</h3><p class="help">Copy ChatGPT’s whole reply (it starts with <b>CATEGORY:</b>) and paste it below.</p><textarea id="ai-paste" rows="7" placeholder="CATEGORY: …&#10;1. Q: … | A: … | ALSO: …"></textarea><button type="button" id="ai-read" class="purple">Check the answer</button><div id="ai-status" role="status" class="help"></div><div id="ai-draft"></div></div></section></div>`);
 const el=id=>document.getElementById(id),status=el('ai-status');
 const refresh=()=>{el('ai-prompt').value=buildChatPrompt({topic:el('ai-topic').value.trim(),audience:el('ai-audience').value.trim(),difficulty:el('ai-difficulty').value});};
 for(const id of ['ai-topic','ai-audience','ai-difficulty'])el(id).addEventListener('input',refresh);refresh();
 el('ai-copy').onclick=async()=>{refresh();if(!el('ai-topic').value.trim()){status.textContent='';el('ai-topic').focus();el('ai-copy').textContent='Type a topic first ↑';setTimeout(()=>el('ai-copy').textContent='📋 Copy prompt',1800);return;}let ok=false;try{await navigator.clipboard.writeText(el('ai-prompt').value);ok=true;}catch{el('ai-prompt').select();ok=document.execCommand?.('copy');}el('ai-copy').textContent=ok?'✓ Copied! Now paste it into ChatGPT':'Select the text above and copy it (Ctrl+C)';setTimeout(()=>el('ai-copy').textContent='📋 Copy prompt',3000);};
 el('ai-read').onclick=()=>{try{draft=parsePastedCategory(el('ai-paste').value);status.textContent='';el('ai-draft').innerHTML=`<div class="ai-preview"><div class="eyebrow">LOOKS GOOD · CHECK THE FACTS</div><label class="field">Category name<input id="ai-name" maxlength="80" value="${escape(draft.category)}"></label>${draft.clues.map((q,i)=>`<div class="ai-clue"><b>${(i+1)*100}</b><label class="field">Question<textarea data-ai-question="${i}" rows="2">${escape(q.question)}</textarea></label><label class="field">Answer<input data-ai-answer="${i}" value="${escape(q.answer)}"></label>${q.accepted?`<small>Also accept: ${escape(q.accepted)}</small>`:''}</div>`).join('')}<label class="field">Put it in<select id="ai-slot">${slots.map((s,i)=>`<option value="${i}" ${i===selected?'selected':''}>Slot ${i+1}: replace “${escape(s.name)}”</option>`).join('')}</select></label><button type="button" id="ai-apply" class="primary">✓ Fill slot with this category</button><p class="help">Afterwards, tap <b>💾 Save category</b> on it to share it with every Game Master.</p></div>`;
  el('ai-apply').onclick=async()=>{draft.category=el('ai-name').value.trim()||draft.category;draft.clues.forEach((q,i)=>{q.question=document.querySelector(`[data-ai-question="${i}"]`).value.trim();q.answer=document.querySelector(`[data-ai-answer="${i}"]`).value.trim();});if(draft.clues.some(q=>!q.question||!q.answer)){status.textContent='Every clue needs a question and an answer.';return;}await onApply(draft,Number(el('ai-slot').value));};
  el('ai-draft').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){el('ai-draft').innerHTML='';status.textContent='⚠ '+e.message;}};}
