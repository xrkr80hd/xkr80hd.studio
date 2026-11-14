const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=text=>String(text||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function suggestedDifficulty(question,index=0){const words=normalize(question).split(' ').filter(Boolean).length;return words>35||index>=4?'hard':words>18||index>=2?'medium':'easy';}
export function reviewContent(categories){const seen=new Map(),issues=[];for(const category of categories){for(const [index,q] of (category.clues||[]).entries()){const label=`${category.name} · clue ${index+1}`,key=normalize(q.question);if(!key)issues.push(`${label}: add a question.`);else if(seen.has(key))issues.push(`${label}: duplicates ${seen.get(key)}.`);else seen.set(key,label);if(!String(q.answer||'').trim())issues.push(`${label}: add the correct answer.`);if(/\b(best|greatest|favorite|currently|today|recently|this year)\b/i.test(q.question||''))issues.push(`${label}: specify an objective fact or a date.`);if(String(q.question||'').length>220)issues.push(`${label}: shorten for across-the-room reading.`);if(!q.source)issues.push(`${label}: add a reference before using an unverified fact.`);}}return issues;}

export const MAX_TOPICS=12;
export function topicList(text){return [...new Set(String(text||'').split(/[\n,;]+/).map(t=>t.replace(/^\s*(?:[-•*]|\d+[.)])\s*/,'').trim()).filter(Boolean))].slice(0,MAX_TOPICS);}

// The prompt the Game Master copies into ChatGPT. It asks for one JSON code block, because ChatGPT shows a
// "Copy code" button on code blocks: that makes copying the answer back a single tap.
export function buildChatPrompt({topics,audience,difficulty}){const list=(Array.isArray(topics)?topics:topicList(topics));const n=Math.max(1,list.length);
 return `Make ${n} trivia categor${n===1?'y':'ies'} for a family game night (a Jeopardy-style board).

Topics, one category each:
${list.length?list.map((t,i)=>`${i+1}. ${t}`).join('\n'):'1. (pick a fun topic)'}

Players: ${audience||'family-friendly, mixed ages'}
Difficulty: ${difficulty||'mixed'}. In each category, clue 1 is easiest (100 points) and clue 5 is hardest (500 points).

Rules:
- Exactly 5 clues per category. Each clue has ONE clear, correct answer.
- Questions short enough to read aloud across a room (under 25 words).
- Only facts you are sure of. No opinions, no "best/favorite", nothing that changes over time. No song lyrics.
- Category names: 1 to 4 words.

Reply with ONE code block of JSON and nothing else, in exactly this shape:

\`\`\`json
{"categories":[
  {"name":"Category name","clues":[
    {"q":"Question 1","a":"Answer","also":"other accepted answers or empty"},
    {"q":"Question 2","a":"Answer","also":""},
    {"q":"Question 3","a":"Answer","also":""},
    {"q":"Question 4","a":"Answer","also":""},
    {"q":"Question 5","a":"Answer","also":""}
  ]}
]}
\`\`\``;}

const pick=(o,keys)=>{for(const k of keys)if(o&&o[k]!=null&&String(o[k]).trim()!=='')return String(o[k]).trim();return '';};
const clean=(c,i)=>({category:(c.category||`Category ${i+1}`).slice(0,80),clues:c.clues.slice(0,5).map(q=>({question:q.question.slice(0,2000),answer:q.answer.slice(0,500),accepted:(q.accepted||'').slice(0,500),note:(q.note||'').slice(0,1000)}))});
function fromJson(text){const start=text.search(/[[{]/);if(start<0)return null;let data=null;for(let end=text.length;end>start&&!data;end=text.lastIndexOf(text[start]==='{'?'}':']',end-1)){if(end<0)break;try{data=JSON.parse(text.slice(start,end+1));}catch{}}if(!data)return null;
 const raw=Array.isArray(data)?data:Array.isArray(data.categories)?data.categories:Array.isArray(data.topics)?data.topics:[data];
 return raw.map(c=>({category:pick(c,['name','category','title','topic']),clues:(c.clues||c.questions||c.items||[]).map(q=>({question:pick(q,['q','question','clue']),answer:pick(q,['a','answer']),accepted:/^(none|n\/?a|-)$/i.test(pick(q,['also','accepted','alternates']))?'':pick(q,['also','accepted','alternates']),note:pick(q,['note','notes'])})).filter(q=>q.question&&q.answer)}));}
// Older plain-text format: CATEGORY: …, then "Q: … | A: … | ALSO: …" lines. Several CATEGORY blocks allowed.
function fromText(text){const cats=[];let cat=null,cur=null;const keyOf=k=>{k=k.toLowerCase().replace(/[^a-z ]/g,'').trim();return /^(category|category name|title|topic)$/.test(k)?'category':/^(q|question|clue)$/.test(k)?'q':/^(a|answer)$/.test(k)?'a':/^(also|also accept|accepted|alternates?|other answers?)$/.test(k)?'also':/^(note|notes|host note)$/.test(k)?'note':null;};
 for(let line of String(text||'').split(/\r?\n/)){line=line.replace(/[*_`#>]+/g,'').replace(/^\s*(?:[-•]|\d+\s*[.):-])\s*/,'').trim();if(!line)continue;
  for(const part of line.split('|')){const m=part.match(/^\s*([A-Za-z][A-Za-z ]{0,20}?)\s*\d*\s*[:–-]\s*(.*)$/);if(!m)continue;const key=keyOf(m[1]),value=m[2].trim();if(!key)continue;
   if(key==='category'){cat={category:value,clues:[]};cats.push(cat);cur=null;}else if(key==='q'){if(!cat){cat={category:'',clues:[]};cats.push(cat);}cur={question:value,answer:'',accepted:'',note:''};cat.clues.push(cur);}else if(cur){if(key==='a')cur.answer=value;else if(key==='also')cur.accepted=/^(none|n\/?a|-|blank|leave blank)$/i.test(value)?'':value;else if(key==='note')cur.note=value;}}}
 return cats.map(c=>({...c,clues:c.clues.filter(q=>q.question&&q.answer)}));}
// Reads ChatGPT's reply: JSON (with or without a code block) or the plain-text format. Returns every complete category.
export function parsePastedCategories(text){const j=fromJson(String(text||'')),found=(j&&j.some(c=>c.clues.length)?j:fromText(text)).filter(c=>c.clues.length);
 if(!found.length)throw Error('Couldn’t find any categories. Copy ChatGPT’s whole answer (tap “Copy code” on its box) and paste it again.');
 const short=found.filter(c=>c.clues.length<5);if(short.length===found.length)throw Error(`Found ${found.length===1?'a category':found.length+' categories'} but with fewer than 5 complete clues. Ask ChatGPT for “exactly 5 clues per category”, then paste again.`);
 return {categories:found.filter(c=>c.clues.length>=5).map(clean),skipped:short.map(c=>c.category||'Unnamed')};}
export function parsePastedCategory(text){const {categories}=parsePastedCategories(text);return categories[0];}

// Category writer. Four steps as accordions, one open at a time.
// Step 1 is a list of category boxes with a big "+ Add category" button for more. Results go to the category
// library; Game Masters then add them to a game the usual way in the Game Builder.
// Hook receives modal(html), slots (for the starting idea), the selected slot index, and onApply(categories,{targets,share}).
export async function openAiAssistant({modal,slots=[],selected=0,onApply}){let parsed=[];
 const firstName=slots[selected]?.name&&!/^new category$/i.test(slots[selected].name)?slots[selected].name:'';
 let rows=[{text:''}];
 const step=(n,title,body,open=false)=>`<details class="ai-acc" data-step="${n}" ${open?'open':''}><summary><span class="ai-step-num">${n}</span><span class="ai-acc-title">${title}</span><span class="ai-acc-done" hidden>✓</span></summary><div class="ai-acc-body">${body}</div></details>`;
 modal(`<div class="ai-wizard"><div class="eyebrow">CATEGORY WRITER · USES CHATGPT</div><h2>Make categories with ChatGPT</h2><p class="help">Follow the 4 steps. Nothing changes in your game until step 4.</p>
 ${step(1,'What categories do you want?',`<p class="help">Type a category idea. Want another one? Tap <b>＋ Add category</b>.</p><div id="ai-rows"></div><button type="button" id="ai-addrow" class="ai-addrow">＋ Add category</button><details class="ai-more"><summary>Players &amp; difficulty (optional)</summary><label class="field">Who’s playing<input id="ai-audience" maxlength="200" value="Family-friendly, mixed ages"></label><label class="field">Difficulty<select id="ai-difficulty"><option>Mixed: easy to hard</option><option>Easy (kids can play)</option><option>Hard (trivia fans)</option></select></label></details><button type="button" id="ai-next1" class="primary">Next →</button><p id="ai-rowmsg" class="ai-rowmsg" role="status"></p>`,true)}
 ${step(2,'Copy the prompt into ChatGPT',`<ol class="ai-howto"><li>Tap <b>Copy prompt</b>.</li><li>Tap <b>Open ChatGPT</b>, paste it in and send.</li><li>When ChatGPT answers, tap <b>Copy code</b> on its answer box.</li></ol><div class="ai-btns"><button type="button" id="ai-copy" class="primary">📋 Copy prompt</button><a class="ai-open" href="https://chatgpt.com/" target="_blank" rel="noopener">Open ChatGPT ↗</a></div><details class="ai-more"><summary>See the prompt</summary><textarea id="ai-prompt" class="ai-prompt" readonly rows="8"></textarea></details><button type="button" id="ai-next2" class="ghost">I have ChatGPT’s answer →</button>`)}
 ${step(3,'Paste ChatGPT’s answer',`<textarea id="ai-paste" rows="6" placeholder="Paste ChatGPT’s answer here"></textarea><div class="ai-btns"><button type="button" id="ai-pastebtn" class="ghost">📥 Paste from clipboard</button><button type="button" id="ai-read" class="primary">Read it →</button></div><div id="ai-status" role="status"></div>`)}
 ${step(4,'Check them and add to your game',`<div id="ai-draft"><p class="help">Finish step 3 first.</p></div>`)}</div>`);
 const el=id=>document.getElementById(id),status=()=>el('ai-status');
 const openStep=n=>{document.querySelectorAll('.ai-acc').forEach(d=>{d.open=Number(d.dataset.step)===n;});document.querySelector(`.ai-acc[data-step="${n}"]`)?.scrollIntoView({behavior:'smooth',block:'start'});};
 const done=n=>{const m=document.querySelector(`.ai-acc[data-step="${n}"] .ai-acc-done`);if(m)m.hidden=false;};
 document.querySelectorAll('.ai-acc').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('.ai-acc').forEach(o=>{if(o!==d)o.open=false;});}));
 const topics=()=>rows.map(r=>r.text.trim()).filter(Boolean);
 function drawRows(focusLast=false){el('ai-rows').innerHTML=rows.map((r,i)=>`<div class="ai-row"><label class="ai-row-label" for="ai-cat-${i}">Category ${i+1}</label><div class="ai-row-line"><input id="ai-cat-${i}" class="ai-row-topic" data-ai-row="${i}" maxlength="120" placeholder="e.g. Dog breeds" value="${escape(r.text)}">${rows.length>1?`<button type="button" class="ai-row-x" data-ai-remove="${i}" aria-label="Remove category ${i+1}">✕</button>`:''}</div></div>`).join('');
  el('ai-addrow').hidden=rows.length>=MAX_TOPICS;
  document.querySelectorAll('[data-ai-row]').forEach(inp=>inp.addEventListener('input',()=>{rows[Number(inp.dataset.aiRow)].text=inp.value;refresh();}));
  document.querySelectorAll('[data-ai-remove]').forEach(b=>b.onclick=()=>{rows.splice(Number(b.dataset.aiRemove),1);drawRows();refresh();});
  if(focusLast){const all=document.querySelectorAll('.ai-row-topic');all[all.length-1]?.focus();}}
 el('ai-addrow').onclick=()=>{const last=rows[rows.length-1];if(last&&!last.text.trim()){el('ai-rowmsg').textContent='Type a category in the box above first, then add another.';document.querySelectorAll('.ai-row-topic')[rows.length-1]?.focus();return;}el('ai-rowmsg').textContent='';rows.push({text:''});drawRows(true);};
 const refresh=()=>{el('ai-prompt').value=buildChatPrompt({topics:topics(),audience:el('ai-audience').value.trim(),difficulty:el('ai-difficulty').value});};
 for(const id of ['ai-audience','ai-difficulty'])el(id).addEventListener('input',refresh);drawRows();refresh();
 el('ai-next1').onclick=()=>{rows=rows.filter((r,i)=>r.text.trim()||i===0);const n=topics().length;if(!n){drawRows(true);el('ai-rowmsg').textContent='Type a category first, like “Dog breeds”.';return;}el('ai-rowmsg').textContent='';drawRows();refresh();done(1);openStep(2);};
 el('ai-copy').onclick=async()=>{refresh();if(!topics().length){openStep(1);return;}let ok=false;try{await navigator.clipboard.writeText(el('ai-prompt').value);ok=true;}catch{const t=el('ai-prompt');t.closest('details').open=true;t.select();try{ok=document.execCommand('copy');}catch{}}el('ai-copy').textContent=ok?'✓ Copied! Now open ChatGPT':'Select the prompt below and copy it';if(ok)done(2);};
 el('ai-next2').onclick=()=>{done(2);openStep(3);el('ai-paste').focus();};
 el('ai-pastebtn').onclick=async()=>{try{const t=await navigator.clipboard.readText();if(t){el('ai-paste').value=t;el('ai-read').click();}}catch{status().textContent='Your browser blocked that. Long-press (or right-click) the box above and choose Paste.';}};
 el('ai-read').onclick=()=>{try{const {categories,skipped}=parsePastedCategories(el('ai-paste').value);parsed=categories;status().textContent=skipped.length?`⚠ Skipped ${skipped.join(', ')}: fewer than 5 clues.`:'';done(3);renderReview();openStep(4);}catch(e){status().textContent='⚠ '+e.message;}};
 function renderReview(){const n=parsed.length;el('ai-draft').innerHTML=`<p class="ai-found">✓ Got <b>${n} categor${n===1?'y':'ies'}</b> from ChatGPT. Tap one to check or fix it.</p>${parsed.map((c,ci)=>`<details class="ai-cat"><summary><b>${escape(c.category)}</b><small>5 clues</small></summary><label class="field">Category name<input data-ai-name="${ci}" maxlength="80" value="${escape(c.category)}"></label>${c.clues.map((q,i)=>`<div class="ai-clue"><b>${(i+1)*100}</b><label class="field">Question<textarea data-ai-q="${ci}-${i}" rows="2">${escape(q.question)}</textarea></label><label class="field">Answer<input data-ai-a="${ci}-${i}" value="${escape(q.answer)}"></label>${q.accepted?`<small>Also accept: ${escape(q.accepted)}</small>`:''}</div>`).join('')}</details>`).join('')}
  <p class="help" id="ai-where">They’ll go into the <b>Category library</b>. Then add them to your game like any other category.</p><button type="button" id="ai-apply" class="primary">✓ Save ${n} categor${n===1?'y':'ies'} to the library</button>`;
  el('ai-apply').onclick=async()=>{parsed.forEach((c,ci)=>{c.category=document.querySelector(`[data-ai-name="${ci}"]`).value.trim()||c.category;c.clues.forEach((q,i)=>{q.question=document.querySelector(`[data-ai-q="${ci}-${i}"]`).value.trim();q.answer=document.querySelector(`[data-ai-a="${ci}-${i}"]`).value.trim();});});const bad=parsed.findIndex(c=>c.clues.some(q=>!q.question||!q.answer));if(bad>=0){document.querySelectorAll('.ai-cat')[bad].open=true;el('ai-where').textContent=`⚠ “${parsed[bad].category}” has an empty question or answer.`;return;}await onApply(parsed,{targets:parsed.map(()=>'library'),share:true});};}}
