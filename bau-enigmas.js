/* TEMPUS CUSTODIA — Baús interativos de quatro dígitos.
   O banco verifica a senha e só libera o conteúdo quando o grupo abre o cadeado. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const txt=v=>String(v??'');
const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const s=txt(v).trim();return /^https:\/\/[^\s<>"']+$/.test(s)&&s.length<=500?s:null};
const auth=()=>window.OPAccounts?.authenticated===true;
const master=()=>auth()&&window.OPAccounts?.masterRole===true;
const online=()=>window.OPAccounts?.online===true;
const uid=()=>window.OPAccounts?.current?.id||'';
const req=(p,m='GET',data=null)=>window.OPAccounts.mysteryRequest(p,m,data);
const shell=$('v-enigmas')?.querySelector('.mystery-shell');
const masterPanel=$('puzzleMasterPanel');
if(!shell||!masterPanel)return;
const creator=document.createElement('section');
creator.id='chestMasterBuilder';creator.hidden=true;
creator.innerHTML="<details id=\"chestBuilderDisclosure\" class=\"chest-builder\">\n <summary class=\"chest-builder-summary\"><span>▣</span><span><strong>＋ Criar baú com senha de 4 dígitos</strong><small>Um enigma jogável com cadeado e conteúdo secreto</small></span></summary>\n <form id=\"chestCreateForm\" class=\"chest-builder-form\" autocomplete=\"off\">\n  <p>Configure os quatro números, a pista para encontrá-los e o que haverá dentro. Os jogadores só conhecerão o conteúdo após acertar.</p>\n  <div class=\"chest-builder-grid\">\n   <label>Nome do baú<input id=\"chestBuildTitle\" maxlength=\"100\" required placeholder=\"Baú do Templo Antigo\"></label>\n   <label>Senha secreta de 4 números<input id=\"chestBuildCode\" type=\"text\" inputmode=\"numeric\" maxlength=\"4\" pattern=\"[0-9]{4}\" required autocomplete=\"new-password\" placeholder=\"••••\"></label>\n   <label class=\"chest-wide\">Descrição do cadeado<textarea id=\"chestBuildPrompt\" rows=\"3\" maxlength=\"1200\" required placeholder=\"As inscrições espalhadas pela vila escondem os números do cadeado.\"></textarea></label>\n   <label class=\"chest-wide\">Dica para encontrar os números (opcional)<textarea id=\"chestBuildHint\" rows=\"2\" maxlength=\"420\" placeholder=\"Procure os quatro símbolos nas casas e no poço.\"></textarea></label>\n   <label>Título do interior<input id=\"chestBuildLootTitle\" maxlength=\"110\" required placeholder=\"O segredo que estava guardado\"></label>\n   <label>Imagem do interior (HTTPS, opcional)<input id=\"chestBuildImage\" type=\"url\" maxlength=\"500\" placeholder=\"https://exemplo.com/pergaminho.png\"></label>\n   <label class=\"chest-wide\">O que existe dentro do baú?<textarea id=\"chestBuildContents\" rows=\"4\" maxlength=\"1800\" required placeholder=\"Vocês encontram um pergaminho e uma inscrição desconhecida...\"></textarea></label>\n   <label class=\"chest-wide\">Pista do mural desbloqueada (opcional)<select id=\"chestBuildUnlock\"><option value=\"\">Nenhuma pista extra</option></select></label>\n  </div>\n  <div class=\"chest-builder-actions\">\n   <button class=\"btn\" type=\"button\" id=\"chestSaveDraft\">▤ Guardar como rascunho</button>\n   <button class=\"btn primary\" type=\"submit\" id=\"chestPublish\">✦ Publicar baú</button>\n  </div>\n  <p id=\"chestBuildStatus\" role=\"status\" class=\"chest-build-status\"></p>\n </form></details>";
masterPanel.appendChild(creator);
const area=document.createElement('section');
area.id='chestPuzzlePanel';area.className='mystery-panel chest-puzzle-panel';
area.innerHTML='<div class="mystery-section-head"><h3>▣ Baús e cadeados</h3><span class="chest-panel-count" id="chestPanelCount"></span></div>'+
 '<p class="mystery-intro">Encontre os quatro números na investigação, digite a combinação e veja o que existe dentro.</p>'+
 '<p id="chestListStatus" class="chest-list-status" role="status"></p><div id="chestPuzzleList" class="chest-grid"></div>';
shell.appendChild(area);
const overlay=document.createElement('div');overlay.id='chestInsideOverlay';
overlay.className='chest-inside-overlay';overlay.hidden=true;
overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
overlay.setAttribute('aria-labelledby','chestInsideTitle');
overlay.innerHTML="<section class=\"chest-inside-box\">\n <button type=\"button\" id=\"chestInsideClose\" class=\"chest-inside-close\">✕ Voltar aos enigmas</button>\n <div class=\"chest-inside-symbol\" aria-hidden=\"true\">✧</div>\n <small>O SEGREDO FOI REVELADO</small>\n <h2 id=\"chestInsideTitle\">Dentro do baú</h2>\n <img id=\"chestInsideImage\" alt=\"Imagem do tesouro encontrado\" hidden>\n <p id=\"chestInsideText\"></p>\n <button type=\"button\" class=\"btn primary\" id=\"chestInsideReturn\">Voltar à investigação</button>\n </section>";
document.body.appendChild(overlay);
let chests=[],attempts=[],contents=[],clues=[];
let account='',loading=false,saving=false,updating=false,lastSnapshot='';
const digits=new Map(),feedbacks=new Map();
const onlyFour=v=>/^[0-9]{4}$/.test(txt(v));
const message=(s,bad=false)=>{const p=$('chestBuildStatus');if(p){p.textContent=s;p.classList.toggle('is-error',bad)}};
const error=e=>txt(e?.message||e).slice(0,240);
function closeInside(){
 overlay.hidden=true;
 const img=$('chestInsideImage');if(img){img.hidden=true;img.removeAttribute('src')}
}
function resetAccount(){
 const id=auth()?uid():'';
 if(id===account)return;
 account=id;chests=[];attempts=[];contents=[];clues=[];
 digits.clear();feedbacks.clear();lastSnapshot='';closeInside();creator.hidden=!master();render();
}
function renderUnlockOptions(){
 const box=$('chestBuildUnlock');if(!box||!master())return;
 const old=box.value;
 box.innerHTML='<option value="">Nenhuma pista extra</option>'+clues.map(c=>
  '<option value="'+Number(c.id)+'">'+(c.visible?'[REVELADA] ':'[OCULTA] ')+esc(c.title)+'</option>').join('');
 if(clues.some(c=>String(c.id)===old))box.value=old;
}
function slots(value){
 return Array.from({length:4},(_,i)=>'<span class="chest-code-slot'+(txt(value)[i]?' filled':'')+'">'+
 (txt(value)[i]?esc(txt(value)[i]):'–')+'</span>').join('');
}
function illustration(open){
 return '<div class="chest-graphic '+(open?'chest-open':'chest-locked')+'" aria-hidden="true">'+
  '<div class="chest-glow"></div><div class="chest-lid"></div>'+
  '<div class="chest-box"><div class="chest-band left"></div><div class="chest-band right"></div>'+
  '<div class="chest-lockplate">'+(open?'✧':'◈')+'</div></div></div>';
}
function card(c){
 const id=Number(c.id),open=c.status==='solved',active=c.status==='active';
 const mine=attempts.filter(a=>Number(a.puzzle_id)===id&&a.player_id===uid());
 const remaining=Math.max(0,8-mine.length),code=digits.get(id)||'';
 const status=open?'ABERTO':active?'TRANCADO':c.status==='draft'?'RASCUNHO':'ENCERRADO';
 const form=!master()&&active&&remaining>0?
  '<form class="chest-unlock-form" data-chest-form="'+id+'">'+
  '<label for="chestEntry'+id+'">Digite os quatro números encontrados:</label>'+
  '<div class="chest-code-slots" data-chest-slots="'+id+'" aria-hidden="true">'+slots(code)+'</div>'+
  '<input id="chestEntry'+id+'" class="chest-code-entry" name="code" type="text" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required autocomplete="off" placeholder="Digite a combinação" value="'+esc(code)+'" aria-label="Combinação de quatro dígitos">'+
  '<div class="chest-keypad" role="group" aria-label="Teclado do cadeado">'+
  [1,2,3,4,5,6,7,8,9,'back',0,'clear'].map(k=>'<button type="button" data-chest-key="'+k+'" data-chest-id="'+id+'">'+
   (k==='back'?'⌫':k==='clear'?'C':k)+'</button>').join('')+'</div>'+
  '<button class="chest-submit" type="submit">◇ Tentar destrancar</button>'+
  '<small class="chest-attempts">'+remaining+' tentativa(s) restante(s)</small></form>':'';
 const masterActions=master()?'<div class="chest-master-actions">'+
  (c.status==='draft'?'<button class="btn small" type="button" data-chest-publish="'+id+'">Publicar este baú</button>':'')+
  (active?'<button class="btn small" type="button" data-chest-close="'+id+'">Encerrar baú</button>':'')+
  '<small>'+attempts.filter(a=>Number(a.puzzle_id)===id).length+' tentativa(s) do grupo</small></div>':'';
 const entry=(open||master())?'<button type="button" class="chest-enter" data-chest-enter="'+id+'">'+
  (open?'✦ Entrar no baú':'✧ Ver interior reservado')+'</button>':'';
 return '<article class="chest-card" id="puzzleCard'+id+'" data-status="'+esc(c.status)+'">'+
  '<div class="chest-kicker">TEMPUS CUSTODIA • BAÚ INTERATIVO</div>'+
  '<div class="chest-heading"><h4>'+esc(c.title)+'</h4><span>'+status+'</span></div>'+
  '<p class="chest-prompt">'+esc(c.prompt)+'</p>'+illustration(open)+
  '<p class="chest-caption">'+(open?'O cadeado foi destrancado.':active?'Quatro números protegem este baú.':'O cadeado está indisponível.')+'</p>'+
  (c.hint?'<details class="chest-hint"><summary>⌕ Examinar dica</summary><p>'+esc(c.hint)+'</p></details>':'')+
  form+(!master()&&active&&!remaining?'<p class="chest-warning">Você usou suas oito tentativas. Peça ajuda ao mestre.</p>':'')+
  (open?'<p class="chest-success">✦ O baú foi aberto para todo o grupo!</p>':'')+
  entry+'<p class="chest-feedback" data-chest-feedback="'+id+'" role="status">'+esc(feedbacks.get(id)||'')+'</p>'+
  masterActions+'</article>';
}
function render(){
 creator.hidden=!master();
 area.hidden=!auth();
 const list=$('chestPuzzleList');if(!list)return;
 const visible=chests.filter(c=>master()||c.status!=='draft');
 const signature=JSON.stringify([visible,attempts,Array.from(feedbacks.entries()),master(),uid()]);
 // Não reconstruir o formulário a cada sincronização: preserve a digitação e o foco.
 if(signature===lastSnapshot)return;
 lastSnapshot=signature;
 $('chestPanelCount').textContent=visible.length+' baú(s)';
 list.innerHTML=visible.length?visible.map(card).join(''):
  '<p class="chest-empty">Ainda não há baús publicados. Quando o mestre preparar um, o cadeado de quatro números aparecerá aqui.</p>';
}
async function refresh(){
 if(!auth()||loading)return;
 resetAccount();if(!online())return;
 loading=true;const id=uid();
 try{
  const [p,a,c,l]=await Promise.all([
   req('/rest/v1/rpg_puzzles?select=id,title,prompt,hint,status,puzzle_kind&order=id.desc&limit=100'),
   req('/rest/v1/rpg_puzzle_attempts?select=id,puzzle_id,player_id,correct&order=id.desc&limit=200'),
   req('/rest/v1/rpg_chest_contents?select=puzzle_id,loot_title,contents,image_url'),
   master()?req('/rest/v1/investigation_clues?select=id,title,visible&order=id.desc&limit=120'):Promise.resolve([])
  ]);
  if(!auth()||id!==uid())return;
  if(![p,a,c,l].every(Array.isArray))throw Error('O servidor enviou uma resposta incompleta.');
  chests=p.filter(x=>x.puzzle_kind==='chest');attempts=a;contents=c;clues=l;
  renderUnlockOptions();render();$('chestListStatus').textContent='';
 }catch(e){$('chestListStatus').textContent='Não foi possível carregar os baús: '+error(e)}
 finally{loading=false}
}
function formValues(){
 const v=id=>txt($(id)?.value).trim();
 return {p_title:v('chestBuildTitle'),p_prompt:v('chestBuildPrompt'),
  p_hint:v('chestBuildHint'),p_code:v('chestBuildCode'),
  p_loot_title:v('chestBuildLootTitle'),p_contents:v('chestBuildContents'),
  p_image_url:v('chestBuildImage')?safeUrl(v('chestBuildImage')):null,
  p_unlock_clue_id:Number(v('chestBuildUnlock'))||null};
}
async function createChest(publish){
 if(!master()||!online()||saving)return message('Somente o mestre conectado pode criar baús.',true);
 const data=formValues(),rawUrl=txt($('chestBuildImage').value).trim();
 if(![data.p_title,data.p_prompt,data.p_loot_title,data.p_contents].every(Boolean))
  return message('Preencha nome, desafio e conteúdo do baú.',true);
 if(!onlyFour(data.p_code))return message('Defina exatamente quatro números. A senha pode começar com zero.',true);
 if(rawUrl&&!data.p_image_url)return message('A imagem precisa usar um endereço HTTPS.',true);
 saving=true;const buttons=[$('chestPublish'),$('chestSaveDraft')];buttons.forEach(b=>b.disabled=true);
 message('Preparando o cadeado e guardando o conteúdo...');
 try{
  await req('/rest/v1/rpc/create_chest_puzzle','POST',{...data,p_publish:publish});
  $('chestCreateForm').reset();
  message(publish?'Baú publicado! Os jogadores já podem tentar abrir.':'Baú guardado em rascunho. Somente o mestre pode vê-lo.');
  await refresh();
  if(publish)$('chestBuilderDisclosure').open=false;
 }catch(e){message('Falha ao criar baú: '+error(e),true)}
 finally{saving=false;buttons.forEach(b=>b.disabled=false)}
}
async function setStatus(id,status){
 if(!master()||updating)return;
 if(status==='closed'&&!confirm('Encerrar este baú para os jogadores?'))return;
 updating=true;
 try{
  await req('/rest/v1/rpg_puzzles?id=eq.'+Number(id),'PATCH',{status});
  message(status==='active'?'Baú publicado aos jogadores.':'Baú encerrado.');
  await refresh();
 }catch(e){message('Falha ao alterar baú: '+error(e),true)}
 finally{updating=false}
}
function changeCode(id,input){
 const value=txt(input).replace(/\D/g,'').slice(0,4);digits.set(id,value);
 const field=$('chestEntry'+id);if(field&&field.value!==value)field.value=value;
 const container=document.querySelector('[data-chest-slots="'+id+'"]');
 if(container)container.innerHTML=slots(value);
}
async function tryCode(id,form){
 if(!auth()||master()||!online()||updating)return;
 const code=txt(form.querySelector('[name="code"]')?.value||digits.get(id)||'').replace(/\D/g,'').slice(0,4);
 if(!onlyFour(code)){feedbacks.set(id,'Preencha os quatro espaços.');render();return}
 const chest=chests.find(x=>Number(x.id)===id);
 if(!chest||chest.status!=='active')return;
 updating=true;
 const btn=form.querySelector('[type="submit"]');if(btn)btn.disabled=true;
 try{
  await req('/rest/v1/rpg_puzzle_attempts','POST',{puzzle_id:id,player_id:uid(),guess:code});
  const rows=await req('/rest/v1/rpg_puzzle_attempts?select=correct&puzzle_id=eq.'+id+'&player_id=eq.'+encodeURIComponent(uid())+'&order=id.desc&limit=1');
  const correct=rows?.[0]?.correct===true;
  feedbacks.set(id,correct?'✦ O cadeado foi destrancado!':'A senha não abriu o baú. Procure outras pistas.');
  digits.delete(id);await refresh();
  if(correct&&chests.find(x=>Number(x.id)===id)?.status==='solved')enterInside(id);
 }catch(e){feedbacks.set(id,error(e));await refresh()}
 finally{updating=false;if(btn)btn.disabled=false}
}
function enterInside(id){
 const chest=chests.find(x=>Number(x.id)===id);
 if(!chest||(!master()&&chest.status!=='solved'))return;
 const loot=contents.find(x=>Number(x.puzzle_id)===id);
 if(!loot){$('chestListStatus').textContent='O interior ainda não carregou. Sincronize novamente.';return}
 $('chestInsideTitle').textContent=loot.loot_title;
 $('chestInsideText').textContent=loot.contents;
 const img=$('chestInsideImage'),url=safeUrl(loot.image_url);
 if(url){img.src=url;img.hidden=false}else{img.hidden=true;img.removeAttribute('src')}
 overlay.hidden=false;
 $('chestInsideClose').focus({preventScroll:true});
}
function focusChest(id){
 const el=$('puzzleCard'+Number(id));if(el?.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'center'});
 const c=chests.find(x=>Number(x.id)===Number(id));
 if(c?.status==='solved')enterInside(Number(id));
}
$('chestCreateForm').addEventListener('submit',e=>{e.preventDefault();createChest(true)});
$('chestSaveDraft').addEventListener('click',()=>createChest(false));
$('chestBuildCode').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,4)});
area.addEventListener('input',e=>{
 if(!e.target.classList?.contains('chest-code-entry'))return;
 const id=Number(e.target.closest('[data-chest-form]')?.dataset.chestForm);
 if(id>0)changeCode(id,e.target.value);
});
area.addEventListener('click',e=>{
 const key=e.target.closest('[data-chest-key]');
 if(key){
  const id=Number(key.dataset.chestId),old=digits.get(id)||'',action=key.dataset.chestKey;
  changeCode(id,action==='back'?old.slice(0,-1):action==='clear'?'':(old+action).slice(0,4));
  $('chestEntry'+id)?.focus({preventScroll:true});return;
 }
 const inside=e.target.closest('[data-chest-enter]');
 if(inside){enterInside(Number(inside.dataset.chestEnter));return}
 const publish=e.target.closest('[data-chest-publish]');
 if(publish){setStatus(Number(publish.dataset.chestPublish),'active');return}
 const close=e.target.closest('[data-chest-close]');
 if(close)setStatus(Number(close.dataset.chestClose),'closed');
});
area.addEventListener('submit',e=>{
 const f=e.target.closest('[data-chest-form]');if(!f)return;
 e.preventDefault();tryCode(Number(f.dataset.chestForm),f);
});
$('chestInsideClose').addEventListener('click',closeInside);
$('chestInsideReturn').addEventListener('click',closeInside);
overlay.addEventListener('click',e=>{if(e.target===overlay)closeInside()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)closeInside()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
resetAccount();render();
setInterval(()=>{resetAccount();if(auth()&&!document.hidden)refresh()},5000);
setTimeout(()=>{resetAccount();if(auth())refresh()},1100);
window.TempusBaus={atualizar:refresh,focar:focusChest,entrar:enterInside};
})();