/* TEMPUS CUSTODIA — Diretor de Cenas. Acesso mestre/jogador protegido por RLS. */
(function(){
'use strict';
const byId=id=>document.getElementById(id);
const clean=value=>String(value??'');
const esc=value=>clean(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeColor=value=>/^#[0-9a-f]{6}$/i.test(clean(value))?value:'#bb9b79';
const safeUrl=value=>{const v=clean(value).trim();return /^https:\/\/[^\s<>"']+$/i.test(v)&&v.length<=500?v:null};
const auth=()=>window.OPAccounts?.authenticated===true;
const master=()=>auth()&&window.OPAccounts?.masterRole===true;
const online=()=>window.OPAccounts?.online===true;
const userId=()=>window.OPAccounts?.current?.id||'local';
const key=()=> 'tempus_cenas_concluidas_v1_'+userId();
const PRESETS=[
 {key:'restaurante',title:'O Último Restaurante',subtitle:'KAGE NO MICHI',chapter:'EPISÓDIO 1 • UM ÚLTIMO CAFÉ',accent:'#bda081',
 narration:'A estrada termina diante de um pequeno restaurante iluminado. Além de suas janelas, a neblina começa a cobrir as montanhas. O atendente observa a chegada dos visitantes como se já soubesse que eles viriam.',
 choices:['Conversar com o atendente','Procurar informações sobre a vila','Observar os outros clientes']},
 {key:'trilha',title:'O Caminho na Neblina',subtitle:'A FLORESTA NÃO ESQUECE',chapter:'EPISÓDIO 1 • A TRILHA',accent:'#799c82',
 narration:'O vento percorre as árvores e apaga os últimos sons da estrada. Adiante, a trilha se divide. Em algum lugar entre os galhos, um sino distante parece tocar apenas uma vez.',
 choices:['Seguir a trilha à esquerda','Examinar o caminho da direita','Procurar sinais de quem passou por ali']},
 {key:'vila',title:'A Vila Devastada',subtitle:'UM LUGAR QUE O TEMPO ABANDONOU',chapter:'EPISÓDIO 1 • A DESCOBERTA',accent:'#b39b89',
 narration:'Cinco casas silenciosas cercam uma praça tomada pelo mato. Um poço antigo e os restos do mercado permanecem onde as pessoas deveriam estar. Nenhuma dessas casas pertence aos samurais. São as moradias de uma vila que desapareceu da história.',
 choices:['Investigar as casas abandonadas','Examinar o poço','Procurar o templo na encosta']},
 {key:'templo',title:'O Templo das Cinco Armaduras',subtitle:'O LIMIAR DO PASSADO',chapter:'EPISÓDIO 1 • O TEMPLO',accent:'#cc9d68',
 narration:'Uma porta de madeira antiga se abre para um salão que a poeira não conseguiu dominar. Cinco armaduras permanecem diante de seus pedestais, como guardiões à espera de um nome que ainda não foi pronunciado.',
 choices:['Examinar os símbolos nos pedestais','Investigar as armaduras','Procurar inscrições pelo salão']},
 {key:'vila-viva',title:'O Dia Que Nunca Terminou',subtitle:'A VILA ESTÁ VIVA',chapter:'EPISÓDIO 2 • O PASSADO',accent:'#8fb0a0',
 narration:'Vozes atravessam as ruas. Há fumaça sobre os telhados e moradores no mercado. As cinco casas estão intactas. No lugar do templo, a montanha guarda apenas o espaço de uma construção que ainda não aconteceu.',
 choices:['Conversar com os moradores','Examinar o projeto do futuro templo','Procurar o monge Hitalo']},
 {key:'sinos',title:'O Primeiro Eco do Sino',subtitle:'ALGO MUDOU NO TEMPO',chapter:'EPISÓDIO 2 • O SINO',accent:'#a19ac9',
 narration:'Um sino ressoa onde nenhum sino deveria estar. Por um instante, as palavras se repetem e os gestos parecem voltar ao começo. Apenas os viajantes percebem que o mesmo momento aconteceu duas vezes.',
 choices:['Contar aos demais o que perceberam','Investigar a origem do som','Observar quem também notou a repetição']}
];
const UI={
 panel:byId('sceneMasterPanel'),catalog:byId('sceneCatalog'),history:byId('sceneHistory'),
 live:byId('sceneLiveStatus'),feedback:byId('sceneFeedback'),overlay:byId('sceneCinema'),
 finish:byId('sceneFinish'),close:byId('sceneCinemaClose'),audio:byId('sceneAudio'),
 audioToggle:byId('sceneAudioToggle'),voteStatus:byId('sceneVoteStatus'),
 voteSummary:byId('sceneVoteSummary')
};
if(!UI.panel||!UI.overlay)return;
let preset=PRESETS[0],scenes=[],active=null,shown=null,assignedAccount='',firstSync=true;
let fetching=false,publishing=false,closing=false,voting=false,chosen=null,playingPreview=false;
function readSeen(){try{return JSON.parse(localStorage.getItem(key())||'[]').map(Number)}catch{return []}}
function hasSeen(id){return readSeen().includes(Number(id))}
function markSeen(id){const rows=readSeen();if(!rows.includes(Number(id))){rows.push(Number(id));localStorage.setItem(key(),JSON.stringify(rows.slice(-90)))}}
function choicesOf(scene){return Array.isArray(scene?.choices)?scene.choices.filter(x=>typeof x==='string').slice(0,4):[]}
function say(message,error=false){if(!UI.feedback)return;UI.feedback.textContent=message;UI.feedback.classList.toggle('is-error',!!error)}
function when(iso){return new Date(iso||Date.now()).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function renderCatalog(){
 if(!UI.catalog)return;
 UI.catalog.innerHTML=PRESETS.map(p=>
  '<button type="button" class="scene-preset'+(preset?.key===p.key?' selected':'')+'" data-scene-preset="'+esc(p.key)+'" style="--scene-accent:'+safeColor(p.accent)+'"><b>'+esc(p.title)+'</b><small>'+esc(p.chapter)+'</small></button>'
 ).join('')+'<button type="button" class="scene-preset'+(!preset?' selected':'')+'" data-scene-preset="custom"><b>＋ Cena personalizada</b><small>Crie uma nova revelação</small></button>';
}
function fill(p){
 const data=p||{title:'',subtitle:'',chapter:'TEMPUS CUSTODIA',narration:'',image_url:'',audio_url:'',choices:[],accent:'#bb9b79'};
 for(const field of ['title','subtitle','chapter','narration','image_url','audio_url','accent']){
  const el=byId('scene_'+field);if(el)el.value=data[field]||((field==='accent')?'#bb9b79':'');
 }
 const options=byId('scene_choices');if(options)options.value=(data.choices||[]).join('\n');
}
function selectPreset(key){
 preset=PRESETS.find(p=>p.key===key)||null;
 fill(preset);renderCatalog();
}
function draft(){
 const get=id=>clean(byId('scene_'+id)?.value).trim();
 const raw=clean(byId('scene_choices')?.value).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 return {title:get('title').slice(0,90),subtitle:get('subtitle').slice(0,110),chapter:get('chapter').slice(0,90),
  narration:get('narration').slice(0,1800),accent:safeColor(get('accent')),image_url:safeUrl(get('image_url')),
  audio_url:safeUrl(get('audio_url')),choices:raw.slice(0,4).map(x=>x.slice(0,140))};
}
function checkDraft(d){
 if(!d.title)return 'Informe o título da cena.';
 if(!d.narration)return 'Escreva a narração da cena.';
 const image=clean(byId('scene_image_url')?.value).trim();
 const audio=clean(byId('scene_audio_url')?.value).trim();
 if(image&&!d.image_url)return 'O retrato deve usar uma URL HTTPS válida.';
 if(audio&&!d.audio_url)return 'O áudio deve usar uma URL HTTPS válida.';
 if(clean(byId('scene_choices')?.value).split(/\r?\n/).map(x=>x.trim()).filter(Boolean).length>4)return 'Escolha no máximo quatro opções.';
 return '';
}
function refreshRole(){
 const id=auth()?userId():'';
 if(id!==assignedAccount){
  assignedAccount=id;firstSync=true;scenes=[];active=null;
  if(shown&&!playingPreview)hideCinema();
  UI.panel.hidden=!master();
  say(online()?'Aguardando a próxima cena do mestre.':'As cenas ao vivo exigem contas conectadas ao Supabase.');
 }
 UI.panel.hidden=!master();
}
function renderHistory(){
 if(!UI.history)return;
 UI.history.innerHTML=scenes.length?scenes.map(x=>
  '<article class="scene-history-row" style="--scene-accent:'+safeColor(x.accent)+'"><div><b>'+esc(x.title)+'</b><small>'+esc(x.chapter||'TEMPUS CUSTODIA')+' · '+esc(when(x.created_at))+' · '+(x.status==='active'?'NO AR':'ENCERRADA')+'</small></div><button class="btn small" type="button" data-scene-replay="'+Number(x.id)+'">Rever</button></article>'
 ).join(''):'<p class="scene-hint">Ainda não há cenas publicadas nesta campanha.</p>';
}
function renderLive(){
 if(!UI.live)return;
 const live=active;
 UI.live.innerHTML=live?
  '<span class="scene-on-air">● CENA NO AR</span><strong>'+esc(live.title)+'</strong><small>Iniciada em '+esc(when(live.created_at))+'</small>':
  '<span class="scene-off-air">AGUARDANDO</span><strong>Nenhuma cena em execução</strong><small>Prepare uma cena e inicie quando quiser.</small>';
 const start=byId('scenePublish'),end=byId('sceneCloseLive');
 if(start)start.disabled=!master()||!online()||!!live||publishing;
 if(end)end.disabled=!master()||!online()||!live||closing;
}
function updateVotes(votes){
 if(!UI.voteSummary)return;
 if(!master()||!active){UI.voteSummary.innerHTML='';return}
 const opts=choicesOf(active);
 if(!opts.length){UI.voteSummary.innerHTML='<p class="scene-hint">Esta cena não possui escolhas.</p>';return}
 const tally=opts.map((_,i)=>votes.filter(v=>Number(v.choice_index)===i).length);
 const total=tally.reduce((a,b)=>a+b,0);
 UI.voteSummary.innerHTML='<strong>Respostas registradas: '+total+'</strong>'+
 opts.map((option,i)=>'<div class="scene-vote-row"><span>'+esc(option)+'</span><b>'+tally[i]+'</b></div>').join('');
}
function stopAudio(){
 if(!UI.audio)return;
 UI.audio.pause();UI.audio.removeAttribute('src');UI.audio.load();
 if(UI.audioToggle){UI.audioToggle.textContent='♫ Ativar som';UI.audioToggle.hidden=true}
}
function hideCinema(){
 if(!shown)return;
 shown=null;chosen=null;playingPreview=false;
 stopAudio();
 UI.overlay.hidden=true;
 UI.overlay.classList.remove('scene-animate');
}
function renderChoiceButtons(){
 const root=byId('sceneOptions');
 if(!root||!shown)return;
 const opts=choicesOf(shown);
 const preview=playingPreview;
 root.innerHTML=opts.map((v,i)=>
  '<button type="button" class="scene-choice-btn'+(chosen===i?' is-chosen':'')+'" data-scene-choice="'+i+'" '+(preview||chosen!==null?'disabled':'')+'>'+esc(v)+'</button>'
 ).join('');
 const finish=UI.finish;
 if(finish){finish.hidden=preview;finish.disabled=!preview&&opts.length>0&&chosen===null;
 finish.textContent=opts.length>0?'Continuar a história':'Concluir cena'}
 const status=UI.voteStatus;
 if(status)status.textContent=preview?'Prévia local. Nenhum jogador recebeu esta cena.':
  chosen!==null?'Escolha registrada. Você pode continuar a história.':opts.length?'Escolha uma das opções para continuar.':'';
}
function display(scene,preview=false){
 if(!scene)return;
 if(shown&&!preview)return;
 shown=scene;chosen=null;playingPreview=preview;
 UI.overlay.style.setProperty('--scene-accent',safeColor(scene.accent));
 byId('sceneCinemaChapter').textContent=scene.chapter||'TEMPUS CUSTODIA';
 byId('sceneCinemaTitle').textContent=scene.title||'Nova cena';
 byId('sceneCinemaSubtitle').textContent=scene.subtitle||'O OUTRO LADO AGUARDA';
 byId('sceneCinemaNarration').textContent=scene.narration||'';
 const photo=byId('sceneCinemaImage'),url=safeUrl(scene.image_url);
 if(url){photo.src=url;photo.hidden=false}else{photo.hidden=true;photo.removeAttribute('src')}
 const fallback=byId('sceneCinemaArt');fallback.hidden=!!url;
 UI.close.hidden=!preview;
 if(UI.audioToggle){UI.audioToggle.hidden=!safeUrl(scene.audio_url);UI.audioToggle.textContent='♫ Ativar som'}
 UI.overlay.hidden=false;
 UI.overlay.classList.remove('scene-animate');void UI.overlay.offsetWidth;UI.overlay.classList.add('scene-animate');
 renderChoiceButtons();
 if(!preview&&online()&&choicesOf(scene).length){
  window.OPAccounts.sceneRequest('/rest/v1/cinematic_scene_votes?scene_id=eq.'+Number(scene.id)+'&select=choice_index,player_id').then(rows=>{
   if(shown!==scene||!Array.isArray(rows))return;
   const own=rows.find(x=>x.player_id===userId());
   if(own){chosen=Number(own.choice_index);renderChoiceButtons()}
  }).catch(()=>{});
 }
 (preview?UI.close:UI.finish)?.focus({preventScroll:true});
}
async function submitChoice(index){
 if(!shown||playingPreview||voting||chosen!==null||!auth()||master())return;
 const opts=choicesOf(shown);
 if(!Number.isInteger(index)||index<0||index>=opts.length)return;
 voting=true;
 if(UI.voteStatus)UI.voteStatus.textContent='Enviando escolha...';
 try{
  await window.OPAccounts.sceneRequest('/rest/v1/cinematic_scene_votes','POST',{scene_id:Number(shown.id),player_id:userId(),choice_index:index});
  chosen=index;renderChoiceButtons();
 }catch(error){
  try{
   const rows=await window.OPAccounts.sceneRequest('/rest/v1/cinematic_scene_votes?scene_id=eq.'+Number(shown.id)+'&select=choice_index,player_id');
   const own=rows.find(row=>row.player_id===userId());
   if(own){chosen=Number(own.choice_index);renderChoiceButtons();return}
  }catch{}
  if(UI.voteStatus)UI.voteStatus.textContent='Não foi possível registrar sua escolha: '+error.message;
 }finally{voting=false}
}
function finishScene(){
 if(!shown||playingPreview||master())return;
 if(choicesOf(shown).length&&chosen===null)return;
 markSeen(shown.id);hideCinema();
 refresh();
}
async function toggleAudio(){
 if(!shown||!UI.audio)return;
 const url=safeUrl(shown.audio_url);if(!url)return;
 if(!UI.audio.paused){UI.audio.pause();UI.audioToggle.textContent='♫ Ativar som';return}
 if(UI.audio.getAttribute('src')!==url)UI.audio.src=url;
 UI.audio.volume=.45;UI.audio.loop=true;
 try{await UI.audio.play();UI.audioToggle.textContent='♫ Pausar som'}
 catch{if(UI.voteStatus)UI.voteStatus.textContent='O navegador não conseguiu reproduzir este áudio. Confira o arquivo HTTPS.'}
}
async function refresh(){
 if(!auth()||fetching)return;
 refreshRole();const accountAtStart=userId();fetching=true;
 try{
  if(!online()){renderLive();return}
  const rows=await window.OPAccounts.sceneRequest('/rest/v1/cinematic_scenes?select=id,title,subtitle,chapter,narration,accent,image_url,audio_url,choices,status,created_at,closed_at&order=id.desc&limit=30');
  if(!auth()||userId()!==accountAtStart)return;
  if(!Array.isArray(rows))throw Error('O servidor respondeu com dados inválidos.');
  scenes=rows;active=rows.find(row=>row.status==='active')||null;
  renderHistory();renderLive();
  if(master()&&active){
   try{const votes=await window.OPAccounts.sceneRequest('/rest/v1/cinematic_scene_votes?scene_id=eq.'+Number(active.id)+'&select=choice_index');updateVotes(Array.isArray(votes)?votes:[])}
   catch{if(UI.voteSummary)UI.voteSummary.textContent='Não foi possível carregar as respostas.'}
  }else updateVotes([]);
  if(!master()){
   if(shown&&!playingPreview&&(!active||Number(shown.id)!==Number(active.id))){
    if(active)markSeen(shown.id);
    hideCinema();
   }
   const otherIntro=byId('introCinema');
   if(active&&!hasSeen(active.id)&&!shown&&(!otherIntro||otherIntro.hidden)&&!document.hidden)
    display(active,false);
  }
  firstSync=false;
  if(UI.feedback?.classList?.contains('is-error'))say('Conectado. As cenas iniciadas pelo mestre chegam automaticamente.');
 }catch(error){
  say('Falha ao sincronizar as cenas: '+error.message,true);
 }finally{fetching=false}
}
async function publish(){
 if(!master()||!online())return say('Apenas o mestre conectado pode iniciar cenas para os jogadores.',true);
 if(publishing)return;
 const scene=draft(),error=checkDraft(scene);
 if(error)return say(error,true);
 if(active)return say('Encerre a cena atual antes de iniciar outra.',true);
 if(!confirm('Iniciar "'+scene.title+'" para todos os jogadores conectados?'))return;
 publishing=true;renderLive();say('Iniciando cena...');
 try{
  await window.OPAccounts.sceneRequest('/rest/v1/cinematic_scenes','POST',{...scene,status:'active',created_by:userId()});
  say('Cena iniciada! Ela aparecerá para os jogadores em até alguns segundos.');
  await refresh();
 }catch(error){say('Não foi possível iniciar a cena: '+error.message,true)}
 finally{publishing=false;renderLive()}
}
async function closeLive(){
 if(!master()||!active||closing)return;
 const item=active;
 if(!confirm('Encerrar a cena "'+item.title+'" para todos?'))return;
 closing=true;renderLive();
 try{
  await window.OPAccounts.sceneRequest('/rest/v1/cinematic_scenes?id=eq.'+Number(item.id),'PATCH',{status:'closed',closed_at:new Date().toISOString()});
  say('Cena encerrada. Você pode iniciar a próxima.');
  await refresh();
 }catch(error){say('Não foi possível encerrar a cena: '+error.message,true)}
 finally{closing=false;renderLive()}
}
UI.catalog?.addEventListener('click',event=>{const btn=event.target.closest('[data-scene-preset]');if(btn)selectPreset(btn.dataset.scenePreset)});
UI.history?.addEventListener('click',event=>{
 const btn=event.target.closest('[data-scene-replay]');if(!btn)return;
 const item=scenes.find(s=>Number(s.id)===Number(btn.dataset.sceneReplay));if(item)display(item,true);
});
byId('scenePreview')?.addEventListener('click',()=>{
 if(!master())return;
 const item=draft(),error=checkDraft(item);if(error)return say(error,true);
 display(item,true);
 say('Prévia local. Nenhuma cena foi publicada.');
});
byId('scenePublish')?.addEventListener('click',publish);
byId('sceneCloseLive')?.addEventListener('click',closeLive);
byId('sceneReload')?.addEventListener('click',refresh);
UI.finish?.addEventListener('click',finishScene);
UI.close?.addEventListener('click',hideCinema);
UI.audioToggle?.addEventListener('click',toggleAudio);
byId('sceneOptions')?.addEventListener('click',event=>{
 const btn=event.target.closest('[data-scene-choice]');
 if(btn)submitChoice(Number(btn.dataset.sceneChoice));
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!UI.overlay.hidden&&playingPreview)hideCinema();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
selectPreset(PRESETS[0].key);UI.panel.hidden=true;renderHistory();renderLive();
setInterval(()=>{refreshRole();if(auth()&&!document.hidden)refresh()},4000);
setTimeout(()=>{refreshRole();if(auth())refresh()},1100);
window.TempusCenas={atualizar:refresh,previsualizar:display};
})();
