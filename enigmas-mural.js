/* TEMPUS CUSTODIA — enigmas e mural de investigação, sincronizados pelo Supabase.
 * Soluções são verificadas por trigger privado no banco; nunca embutidas neste arquivo. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const str=v=>String(v??'');
const esc=v=>str(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const s=str(v).trim();return /^https:\/\/[^\s<>"']+$/i.test(s)&&s.length<=500?s:null};
const auth=()=>window.OPAccounts?.authenticated===true;
const online=()=>window.OPAccounts?.online===true;
const master=()=>auth()&&window.OPAccounts?.masterRole===true;
const uid=()=>window.OPAccounts?.current?.id||'';
const rpc=(path,method='GET',body=null)=>window.OPAccounts.mysteryRequest(path,method,body);
const ICONS={pista:'⌕',documento:'▤',local:'⌂',testemunho:'✧',imagem:'▧'};
const THEMES={conhecimento:'◈ Conhecimento',medo:'✦ Medo',tempo:'◷ Tempo',simbolos:'◇ Símbolos'};
const STATUS={draft:'Rascunho',active:'Em andamento',solved:'Resolvido',closed:'Encerrado'};
const PUZZLE_TEMPLATES=[
 {title:'O Cofre dos Cinco Símbolos',prompt:'Cinco símbolos antigos cercam uma inscrição. Observe as pistas recolhidas pelo grupo e descubra qual palavra ou sequência abre o mecanismo.',hint:'Os detalhes estão espalhados pelo templo e pela vila.',theme:'simbolos'},
 {title:'O Sino que Ecoa Duas Vezes',prompt:'Uma frase retorna sempre ao tocar do sino. Qual palavra da inscrição explica a repetição?',hint:'Talvez o passado e o presente não estejam tão separados.',theme:'tempo'},
 {title:'O Juramento Esquecido',prompt:'Um antigo juramento foi fragmentado. Encontre nos documentos a resposta exigida pelo selo.',hint:'Investigue as anotações do monge e os registros da vila.',theme:'conhecimento'}
];
// Os modelos não trazem respostas prontas, evitando que um jogador descubra o gabarito pelo código.
const ui={
 puzzleMaster:$('puzzleMasterPanel'),puzzleList:$('puzzleList'),puzzleStatus:$('puzzleStatus'),
 puzzleTitle:$('puzzleTitle'),puzzlePrompt:$('puzzlePrompt'),puzzleHint:$('puzzleHint'),
 puzzleAnswer:$('puzzleAnswer'),puzzleTheme:$('puzzleTheme'),puzzleUnlock:$('puzzleUnlock'),
 puzzleCreate:$('puzzleCreate'),puzzleTemplates:$('puzzleTemplates'),
 clueMaster:$('clueMasterPanel'),clueTitle:$('clueTitle'),clueDetails:$('clueDetails'),
 clueCategory:$('clueCategory'),clueImage:$('clueImage'),clueCreate:$('clueCreate'),
 clueList:$('clueList'),clueDetail:$('clueDetail'),clueStatus:$('clueStatus'),
 clueA:$('clueConnectA'),clueB:$('clueConnectB'),clueInsight:$('clueInsight'),
 linkCreate:$('clueConnect'),linkList:$('clueConnections'),
 noteText:$('clueNoteText'),noteSend:$('clueNoteSend'),noteList:$('clueNotes')
};
if(!ui.puzzleList||!ui.clueList||!ui.puzzleMaster||!ui.clueMaster)return;
let puzzles=[],attempts=[],clues=[],links=[],notes=[],selectedClue=null;
let account='',fetching=false,creatingPuzzle=false,creatingClue=false,busy=false;
let puzzleSnapshot='',clueSnapshot='';
const message=(kind,text,bad=false)=>{const el=kind==='puzzle'?ui.puzzleStatus:ui.clueStatus;if(el){el.textContent=text;el.classList.toggle('is-error',bad)}};
const date=s=>new Date(s||Date.now()).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const errorMessage=e=>{
 const raw=str(e?.message||e);
 if(/duplicate|unique|23505/i.test(raw))return 'Essa ligação já existe no mural.';
 if(/tentativas|limite|8 tentativas/i.test(raw))return 'Você atingiu o limite de oito tentativas. Solicite uma dica ao mestre.';
 return raw.slice(0,220);
};
function syncAccount(){
 const id=auth()?uid():'';
 if(account===id)return;
 account=id;selectedClue=null;puzzles=[];attempts=[];clues=[];links=[];notes=[];puzzleSnapshot='';clueSnapshot='';
 ui.puzzleMaster.hidden=!master();ui.clueMaster.hidden=!master();
 if(ui.puzzleList)ui.puzzleList.innerHTML='';
 if(ui.clueList)ui.clueList.innerHTML='';
 message('puzzle',online()?'Enigmas sincronizados com a campanha.':'Entre com sua conta conectada para jogar.');
 message('clue',online()?'As pistas reveladas aparecerão no mural.':'O mural compartilhado exige conexão com o Supabase.');
}
function renderPuzzleTemplates(){
 if(!ui.puzzleTemplates)return;
 ui.puzzleTemplates.innerHTML=PUZZLE_TEMPLATES.map((p,i)=>
  '<button class="mystery-template" type="button" data-puzzle-template="'+i+'"><b>'+esc(p.title)+'</b><small>'+esc(THEMES[p.theme])+'</small></button>').join('');
}
function renderPuzzles(){
 const rows=puzzles.filter(x=>master()||x.status!=='draft');
 ui.puzzleList.innerHTML=rows.length?rows.map(p=>{
  const related=attempts.filter(a=>Number(a.puzzle_id)===Number(p.id));
  const mine=related.filter(a=>a.player_id===uid());
  const done=p.status==='solved';
  const triesLeft=Math.max(0,8-mine.length);
  const masterTools=master()?
   '<div class="mystery-card-actions">'+
    (p.status==='draft'?'<button class="btn small" type="button" data-puzzle-activate="'+Number(p.id)+'">Publicar rascunho</button>':'')+
    (p.status==='active'?'<button class="btn small" type="button" data-puzzle-close="'+Number(p.id)+'">Encerrar enigma</button>':'')+
    '<small>'+related.length+' tentativa(s) do grupo'+(p.unlock_clue_id?' · libera pista #'+Number(p.unlock_clue_id):'')+'</small></div>':'';
  const playerForm=(!master()&&p.status==='active'&&triesLeft>0)?
   '<form class="mystery-answer-form" data-puzzle-form="'+Number(p.id)+'"><label for="puzzleGuess'+Number(p.id)+'">Sua resposta</label>'+
   '<div class="mystery-answer-row"><input id="puzzleGuess'+Number(p.id)+'" name="guess" autocomplete="off" maxlength="70" required placeholder="Digite a palavra ou combinação"><button class="btn primary" type="submit">Responder</button></div>'+
   '<small>'+triesLeft+' tentativa(s) restantes</small></form>':'';
  const solved=done?'<div class="mystery-solved"><span>✦</span> Enigma resolvido'+(p.unlock_clue_id?' • uma pista foi liberada no Mural':'')+'</div>':'';
  const closed=!master()&&p.status==='closed'?'<p class="mystery-muted">Esse enigma foi encerrado pelo mestre.</p>':'';
  return '<article class="mystery-puzzle-card" data-theme="'+esc(p.theme)+'">'+
   '<div class="mystery-puzzle-top"><small>'+esc(THEMES[p.theme]||'ENIGMA')+'</small><span class="mystery-state '+esc(p.status)+'">'+esc(STATUS[p.status]||'')+'</span></div>'+
   '<h3>'+esc(p.title)+'</h3><p class="mystery-prompt">'+esc(p.prompt)+'</p>'+
   (p.hint?'<details class="mystery-hint"><summary>◈ Examinar dica</summary><p>'+esc(p.hint)+'</p></details>':'')+
   solved+closed+playerForm+(!master()&&!done&&p.status==='active'&&triesLeft===0?'<small>Sem tentativas restantes. Peça uma dica ao mestre.</small>':'')+
   masterTools+'</article>';
 }).join(''):'<div class="mystery-empty">Ainda não há enigmas publicados. O mestre poderá abrir o primeiro quando a investigação começar.</div>';
}
function renderClueOptions(){
 const options=clues.filter(c=>master()||c.visible);
 const markup='<option value="">Selecione uma pista</option>'+options.map(c=>
  '<option value="'+Number(c.id)+'">'+(c.visible?'':'[OCULTA] ')+esc(c.title)+'</option>').join('');
 for(const select of [ui.clueA,ui.clueB]){
  if(!select)continue;
  const current=select.value;select.innerHTML=markup;
  if(options.some(c=>String(c.id)===current))select.value=current;
 }
 if(ui.puzzleUnlock&&master()){
  const current=ui.puzzleUnlock.value;
  ui.puzzleUnlock.innerHTML='<option value="">Não desbloquear pista automaticamente</option>'+clues.map(c=>
   '<option value="'+Number(c.id)+'">'+(c.visible?'[REVELADA] ':'[OCULTA] ')+esc(c.title)+'</option>').join('');
  if(clues.some(c=>String(c.id)===current))ui.puzzleUnlock.value=current;
 }
}
function renderConnections(){
 if(!ui.linkList)return;
 const available=clues.filter(c=>master()||c.visible);
 const ids=new Map(available.map(c=>[Number(c.id),c.title]));
 const rows=links.filter(l=>ids.has(Number(l.clue_a))&&ids.has(Number(l.clue_b)));
 ui.linkList.innerHTML=rows.length?rows.map(l=>
  '<article class="mystery-string"><span class="mystery-string-pin"></span><div><b>'+
  esc(ids.get(Number(l.clue_a)))+' <span>⟷</span> '+esc(ids.get(Number(l.clue_b)))+'</b>'+
  (l.insight?'<p>'+esc(l.insight)+'</p>':'')+'</div></article>').join('')
  :'<p class="mystery-muted">Os investigadores ainda não conectaram nenhuma pista.</p>';
}
function renderNotes(){
 if(!ui.noteList)return;
 const row=clues.find(c=>Number(c.id)===Number(selectedClue));
 const entries=notes.filter(n=>row&&Number(n.clue_id)===Number(row.id));
 ui.noteList.innerHTML=entries.length?entries.map(n=>
  '<article class="mystery-note"><small>'+esc(n.created_by===uid()?'Sua anotação':'Anotação do grupo')+' · '+esc(date(n.created_at))+'</small>'+
  '<p>'+esc(n.body)+'</p></article>').join(''):'<p class="mystery-muted">Nenhuma anotação nesta pista ainda.</p>';
 if(ui.noteSend)ui.noteSend.disabled=!row;
}
function renderClueDetail(){
 const c=clues.find(x=>Number(x.id)===Number(selectedClue) && (master()||x.visible));
 if(!c){ui.clueDetail.innerHTML='<p class="mystery-muted">Escolha uma pista do mural para examinar os detalhes e fazer anotações.</p>';selectedClue=null}
 else{
  ui.clueDetail.innerHTML='<small class="mystery-detail-type">'+esc(c.category.toUpperCase())+'</small>'+
   '<h3>'+esc(c.title)+'</h3><p class="mystery-detail-body">'+esc(c.details||'Uma pista que ainda precisa ser analisada.')+'</p>'+
   (safeUrl(c.image_url)?'<img class="mystery-detail-photo" src="'+esc(safeUrl(c.image_url))+'" alt="Imagem da pista '+esc(c.title)+'" loading="lazy">':'')+
   '<small>'+esc(c.visible?'Revelada ao grupo':'Oculta — somente mestre')+' • '+esc(date(c.created_at))+'</small>';
 }
 renderNotes();
}
function renderBoard(){
 const cards=clues.filter(c=>master()||c.visible);
 ui.clueList.innerHTML=cards.length?cards.map(c=>
  '<article class="mystery-clue'+(Number(selectedClue)===Number(c.id)?' is-selected':'')+(!c.visible?' is-secret':'')+'" data-kind="'+esc(c.category)+'">'+
  '<button type="button" class="mystery-clue-pick" data-clue-pick="'+Number(c.id)+'">'+
  '<span class="mystery-clue-icon" aria-hidden="true">'+esc(ICONS[c.category]||'✧')+'</span>'+
  '<small>'+esc(c.category.toUpperCase())+' • '+(c.visible?'REVELADA':'OCULTA')+'</small>'+
  '<strong>'+esc(c.title)+'</strong>'+
  '<p>'+esc(c.details||'Uma pista ainda sem observações.')+'</p>'+
  '<span class="mystery-clue-foot">⌕ Examinar</span></button>'+
  (master()?'<button class="mystery-reveal" type="button" data-clue-toggle="'+Number(c.id)+'">'+(c.visible?'Ocultar do grupo':'✦ Revelar ao grupo')+'</button>':'')+
  '</article>').join(''):
  '<div class="mystery-empty">A investigação ainda não tem pistas reveladas. Os primeiros documentos aparecerão aqui quando o mestre liberá-los.</div>';
 renderClueDetail();renderConnections();renderClueOptions();
}
function renderAll(){
 const p=JSON.stringify([puzzles,attempts]);
 const c=JSON.stringify([clues,links,notes,selectedClue]);
 if(p!==puzzleSnapshot){puzzleSnapshot=p;renderPuzzles()}
 if(c!==clueSnapshot){clueSnapshot=c;renderBoard()}
}
async function refresh(){
 if(!auth()||fetching)return;
 syncAccount();fetching=true;const id=uid();
 try{
  if(!online())return;
  const requests=[
   rpc('/rest/v1/investigation_clues?select=id,title,details,category,image_url,visible,created_by,created_at,revealed_at&order=id.desc&limit=100'),
   rpc('/rest/v1/investigation_links?select=id,clue_a,clue_b,insight,created_by,created_at&order=id.asc&limit=300'),
   rpc('/rest/v1/investigation_notes?select=id,clue_id,body,created_by,created_at&order=id.desc&limit=250'),
   rpc('/rest/v1/rpg_puzzles?select=id,title,prompt,hint,theme,status,unlock_clue_id,created_at,solved_at&order=id.desc&limit=80'),
   rpc('/rest/v1/rpg_puzzle_attempts?select=id,puzzle_id,player_id,guess,correct,created_at&order=id.desc&limit=150')
  ];
  const [c,l,n,p,a]=await Promise.all(requests);
  if(!auth()||uid()!==id)return;
  if(![c,l,n,p,a].every(Array.isArray))throw Error('Resposta de sincronização inválida.');
  clues=c;links=l;notes=n;puzzles=p;attempts=a;
  if(selectedClue&&!clues.some(x=>Number(x.id)===Number(selectedClue)))selectedClue=null;
  ui.puzzleMaster.hidden=!master();ui.clueMaster.hidden=!master();
  renderAll();
  if(ui.puzzleStatus?.classList.contains('is-error'))message('puzzle','Conectado. Enigmas sincronizados.');
  if(ui.clueStatus?.classList.contains('is-error'))message('clue','Conectado. Mural sincronizado.');
 }catch(e){
  message('puzzle','Não foi possível sincronizar: '+errorMessage(e),true);
  message('clue','Não foi possível sincronizar: '+errorMessage(e),true);
 }finally{fetching=false}
}
async function createClue(){
 if(!master()||!online()||creatingClue)return message('clue','Somente o mestre conectado pode criar pistas.',true);
 const title=str(ui.clueTitle?.value).trim(),details=str(ui.clueDetails?.value).trim(),
  category=ui.clueCategory?.value||'pista',rawUrl=str(ui.clueImage?.value).trim();
 if(!title)return message('clue','Escreva um título para a pista.',true);
 if(rawUrl&&!safeUrl(rawUrl))return message('clue','Use um endereço HTTPS válido para a imagem.',true);
 creatingClue=true;ui.clueCreate.disabled=true;
 try{
  await rpc('/rest/v1/investigation_clues','POST',{title:title.slice(0,100),details:details.slice(0,1500),category,
   image_url:safeUrl(rawUrl),created_by:uid(),visible:false});
  ui.clueTitle.value='';ui.clueDetails.value='';ui.clueImage.value='';
  message('clue','Pista salva como OCULTA. Clique em Revelar para entregá-la ao grupo ou vincule a um enigma.');
  await refresh();
 }catch(e){message('clue','Falha ao criar pista: '+errorMessage(e),true)}
 finally{creatingClue=false;ui.clueCreate.disabled=false}
}
async function toggleClue(id){
 if(!master()||busy)return;
 const c=clues.find(x=>Number(x.id)===Number(id));if(!c)return;
 const visible=!c.visible;
 if(!confirm(visible?'Revelar "'+c.title+'" para todos os jogadores?':'Ocultar "'+c.title+'" do mural dos jogadores?'))return;
 busy=true;
 try{
  await rpc('/rest/v1/investigation_clues?id=eq.'+Number(id),'PATCH',{visible,revealed_at:visible?new Date().toISOString():null});
  message('clue',visible?'Pista revelada para os jogadores.':'Pista ocultada dos jogadores.');
  await refresh();
 }catch(e){message('clue','Não foi possível alterar a pista: '+errorMessage(e),true)}
 finally{busy=false}
}
async function createPuzzle(){
 if(!master()||!online()||creatingPuzzle)return message('puzzle','Somente o mestre conectado pode criar enigmas.',true);
 const title=str(ui.puzzleTitle?.value).trim(),prompt=str(ui.puzzlePrompt?.value).trim(),
  hint=str(ui.puzzleHint?.value).trim(),answer=str(ui.puzzleAnswer?.value).trim(),
  theme=ui.puzzleTheme?.value||'conhecimento',unlockId=Number(ui.puzzleUnlock?.value)||null;
 if(!title||!prompt||!answer)return message('puzzle','Preencha título, desafio e resposta secreta.',true);
 if(answer.length>70)return message('puzzle','A resposta deve ter no máximo 70 caracteres.',true);
 creatingPuzzle=true;ui.puzzleCreate.disabled=true;let id=null;
 try{
  const result=await rpc('/rest/v1/rpg_puzzles?select=id','POST',{
   title:title.slice(0,100),prompt:prompt.slice(0,1200),hint:hint.slice(0,420),theme,
   unlock_clue_id:unlockId,status:'draft',created_by:uid()
  });
  if(!Array.isArray(result)||!Number(result[0]?.id))throw Error('O servidor não retornou o número do enigma.');
  id=Number(result[0].id);
  await rpc('/rest/v1/rpg_puzzle_answers','POST',{puzzle_id:id,answer_value:answer});
  await rpc('/rest/v1/rpg_puzzles?id=eq.'+id,'PATCH',{status:'active'});
  ui.puzzleTitle.value='';ui.puzzlePrompt.value='';ui.puzzleHint.value='';ui.puzzleAnswer.value='';
  message('puzzle','Enigma publicado! A resposta ficou protegida no banco. Jogadores já podem tentar resolvê-lo.');
  await refresh();
 }catch(e){
  message('puzzle','Falha ao criar o enigma: '+errorMessage(e)+(id?' O rascunho #'+id+' poderá ser concluído sem expor a resposta.':''),true);
  await refresh();
 }finally{creatingPuzzle=false;ui.puzzleCreate.disabled=false}
}
async function activateDraft(id){
 if(!master()||busy)return;
 const puzzle=puzzles.find(p=>Number(p.id)===Number(id));
 if(!puzzle||puzzle.status!=='draft')return;
 busy=true;
 try{
  const exists=await rpc('/rest/v1/rpg_puzzle_answers?select=puzzle_id&puzzle_id=eq.'+Number(id));
  if(!Array.isArray(exists))throw Error('Falha na consulta do gabarito.');
  if(!exists.length){
   const answer=str(ui.puzzleAnswer?.value).trim();
   if(!answer)throw Error('Escreva a resposta secreta no formulário antes de publicar o rascunho.');
   await rpc('/rest/v1/rpg_puzzle_answers','POST',{puzzle_id:Number(id),answer_value:answer.slice(0,70)});
  }
  await rpc('/rest/v1/rpg_puzzles?id=eq.'+Number(id),'PATCH',{status:'active'});
  message('puzzle','Rascunho publicado com segurança.');
  await refresh();
 }catch(e){message('puzzle','Não foi possível publicar o rascunho: '+errorMessage(e),true)}
 finally{busy=false}
}
async function closePuzzle(id){
 if(!master()||busy)return;
 if(!confirm('Encerrar este enigma para todos os jogadores?'))return;
 busy=true;
 try{
  await rpc('/rest/v1/rpg_puzzles?id=eq.'+Number(id),'PATCH',{status:'closed'});
  message('puzzle','Enigma encerrado.');
  await refresh();
 }catch(e){message('puzzle','Não foi possível encerrar: '+errorMessage(e),true)}
 finally{busy=false}
}
async function submitGuess(event){
 event.preventDefault();
 if(master()||!auth()||!online())return;
 const form=event.target,id=Number(form.dataset.puzzleForm),field=form.querySelector('input[name="guess"]');
 const guess=str(field?.value).trim();
 if(!guess||guess.length>70)return message('puzzle','Informe uma resposta de até 70 caracteres.',true);
 const button=form.querySelector('button[type="submit"]');button.disabled=true;
 try{
  await rpc('/rest/v1/rpg_puzzle_attempts','POST',{puzzle_id:id,player_id:uid(),guess});
  const rows=await rpc('/rest/v1/rpg_puzzle_attempts?select=correct,guess&puzzle_id=eq.'+id+'&player_id=eq.'+encodeURIComponent(uid())+'&order=id.desc&limit=1');
  message('puzzle',rows?.[0]?.correct?'✦ Resposta correta! Confira a pista revelada no mural.':'Ainda não. Investigue as pistas e tente outra hipótese.');
  await refresh();
 }catch(e){message('puzzle','Tentativa recusada: '+errorMessage(e),true)}
 finally{button.disabled=false}
}
async function createLink(){
 if(!auth()||!online()||busy)return;
 const a=Number(ui.clueA?.value),b=Number(ui.clueB?.value),insight=str(ui.clueInsight?.value).trim();
 if(!a||!b||a===b)return message('clue','Escolha duas pistas diferentes para conectar.',true);
 busy=true;
 try{
  await rpc('/rest/v1/investigation_links','POST',{clue_a:Math.min(a,b),clue_b:Math.max(a,b),insight:insight.slice(0,240),created_by:uid()});
  ui.clueInsight.value='';
  message('clue','Conexão registrada no mural de todo o grupo.');
  await refresh();
 }catch(e){message('clue','Não foi possível conectar: '+errorMessage(e),true)}
 finally{busy=false}
}
async function createNote(){
 if(!auth()||!online()||busy)return;
 const c=clues.find(x=>Number(x.id)===Number(selectedClue)),body=str(ui.noteText?.value).trim();
 if(!c)return message('clue','Selecione primeiro uma pista.',true);
 if(!body)return message('clue','Escreva a anotação antes de registrar.',true);
 busy=true;
 try{
  await rpc('/rest/v1/investigation_notes','POST',{clue_id:Number(c.id),body:body.slice(0,500),created_by:uid()});
  ui.noteText.value='';message('clue','Anotação compartilhada com o grupo.');
  await refresh();
 }catch(e){message('clue','Falha ao salvar anotação: '+errorMessage(e),true)}
 finally{busy=false}
}
ui.puzzleTemplates?.addEventListener('click',e=>{
 if(!master())return;
 const btn=e.target.closest('[data-puzzle-template]');if(!btn)return;
 const p=PUZZLE_TEMPLATES[Number(btn.dataset.puzzleTemplate)];if(!p)return;
 ui.puzzleTitle.value=p.title;ui.puzzlePrompt.value=p.prompt;ui.puzzleHint.value=p.hint;ui.puzzleTheme.value=p.theme;ui.puzzleAnswer.value='';
 message('puzzle','Modelo carregado. Defina a resposta secreta antes de publicar.');
});
ui.puzzleCreate?.addEventListener('click',createPuzzle);
ui.clueCreate?.addEventListener('click',createClue);
ui.clueList?.addEventListener('click',e=>{
 const pick=e.target.closest('[data-clue-pick]');if(pick){
  selectedClue=Number(pick.dataset.cluePick);clueSnapshot='';renderAll();return;
 }
 const toggle=e.target.closest('[data-clue-toggle]');
 if(toggle)toggleClue(Number(toggle.dataset.clueToggle));
});
ui.puzzleList?.addEventListener('submit',submitGuess);
ui.puzzleList?.addEventListener('click',e=>{
 const draft=e.target.closest('[data-puzzle-activate]');
 if(draft){activateDraft(Number(draft.dataset.puzzleActivate));return}
 const close=e.target.closest('[data-puzzle-close]');
 if(close)closePuzzle(Number(close.dataset.puzzleClose));
});
ui.linkCreate?.addEventListener('click',createLink);
ui.noteSend?.addEventListener('click',createNote);
$('puzzleReload')?.addEventListener('click',refresh);
$('clueReload')?.addEventListener('click',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
renderPuzzleTemplates();syncAccount();renderAll();
setInterval(()=>{syncAccount();if(auth()&&!document.hidden)refresh()},5000);
setTimeout(()=>{syncAccount();if(auth())refresh()},950);
window.TempusInvestigacao={atualizar:refresh};
})();