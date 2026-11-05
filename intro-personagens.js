/* Tempus Custodia — entradas cinematográficas de personagens.
   Somente o mestre publica. NPCs são públicos; samurais visíveis só ao responsável pela ficha.
   Sincronização por consulta periódica; modo local somente neste navegador. */
(function(){
'use strict';
const byId=id=>document.getElementById(id);
const clean=v=>String(v??'');
const esc=s=>clean(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const color=s=>/^#[0-9a-f]{6}$/i.test(clean(s))?s:'#b99777';
const portrait=s=>{const v=clean(s).trim();return /^https:\/\/[^\s"'<>]+$/i.test(v)&&v.length<=500?v:''};
const auth=()=>window.OPAccounts?.authenticated===true;
const master=()=>auth()&&window.OPAccounts.masterRole===true;
const online=()=>window.OPAccounts?.online===true;
const currentId=()=>window.OPAccounts?.current?.id||'local';
const localKey=()=> 'tempus_introducoes_v2_'+currentId();
const seenKey=()=> 'tempus_intro_last_seen_'+currentId();
const PRESETS=[
 {key:'haruto',name:'Haruto Nakamura',subtitle:'ATENDENTE • KAGE NO MICHI',quote:'“Hoje está movimentado. Vocês vieram pela mesma trilha?”',description:'O primeiro rosto amigável no último restaurante antes das montanhas.',chapter:'EPISÓDIO 1 • O RESTAURANTE',kind:'npc',accent:'#c8ac7f',glyph:'茶'},
 {key:'kenji',name:'Kenji Morita',subtitle:'CHEF • KAGE NO MICHI',quote:'“Há lugares que não devem ser procurados.”',description:'Um proprietário reservado, de poucas palavras e muitas memórias.',chapter:'EPISÓDIO 1 • O RESTAURANTE',kind:'npc',accent:'#c27666',glyph:'火'},
 {key:'yumi',name:'Yumi Takahara',subtitle:'CLIENTE HABITUAL',quote:'“Esses olhos... eu já os vi antes.”',description:'Uma senhora que guarda histórias esquecidas pelas montanhas.',chapter:'EPISÓDIO 1 • O RESTAURANTE',kind:'npc',accent:'#b99bbd',glyph:'時'},
 {key:'hitalo',name:'Hitalo',subtitle:'O MONGE VIAJANTE',quote:'“Vocês chegaram cedo demais.”',description:'Um homem que parece conhecer o passado, mas teme o futuro.',chapter:'EPISÓDIO 2 • A VILA ANTIGA',kind:'npc',accent:'#d8b777',glyph:'刻'},
 {key:'aiko',name:'Aiko',subtitle:'A CURANDEIRA',quote:'“Ontem, ouvi uma voz vindo do poço.”',description:'Uma jovem que cuida dos moradores e percebe que algo mudou.',chapter:'EPISÓDIO 2 • A VILA ANTIGA',kind:'npc',accent:'#6eb9ab',glyph:'水'},
 {key:'genzo',name:'Genzo',subtitle:'ADMINISTRADOR DA VILA',quote:'“Viajantes de onde? Nunca vi roupas como essas.”',description:'O responsável pela vila não confia em desconhecidos.',chapter:'EPISÓDIO 2 • A VILA ANTIGA',kind:'npc',accent:'#b59b7d',glyph:'守'},
 {key:'ren',name:'Ren',subtitle:'APRENDIZ DE CARPINTEIRO',quote:'“Como sabem o que ainda nem terminei de desenhar?”',description:'Um jovem encarregado de uma construção cercada de perguntas.',chapter:'EPISÓDIO 2 • A VILA ANTIGA',kind:'npc',accent:'#a8b1a0',glyph:'木'},
 {key:'taro',name:'Taro',subtitle:'MORADOR DA VILA',quote:'“Alguém falou comigo... de dentro do poço.”',description:'Uma criança intrigada pelas vozes que os adultos não escutam.',chapter:'EPISÓDIO 2 • A VILA ANTIGA',kind:'npc',accent:'#93b7c9',glyph:'声'},
 {key:'akira',name:'Akira Kurogane',subtitle:'O PRIMEIRO GUARDIÃO',quote:'“Quem de vocês tocou na minha armadura?”',description:'Um samurai que retorna à vila com mais perguntas do que respostas.',chapter:'EPISÓDIO 2 • A CHEGADA',kind:'samurai',accent:'#c34954',glyph:'護'},
 {key:'ichiro',name:'Ichiro Yamioka',subtitle:'O GUERREIRO QUE RESISTE',quote:'“Uma promessa não termina quando o medo começa.”',description:'Uma presença determinada, ligada às tradições da família Yamioka.',chapter:'OS CINCO GUERREIROS',kind:'samurai',accent:'#8f70cb',glyph:'血'},
 {key:'masamune',name:'Masamune Hayato',subtitle:'AQUELE QUE PROCURA RESPOSTAS',quote:'“Toda história tem uma parte que foi apagada.”',description:'Um observador atento às palavras e aos registros do passado.',chapter:'OS CINCO GUERREIROS',kind:'samurai',accent:'#d4a14d',glyph:'知'},
 {key:'reiji',name:'Reiji Kuronami',subtitle:'O GUARDIÃO DAS LEMBRANÇAS',quote:'“Nem tudo o que esquecemos desapareceu.”',description:'Um nome repetido em sussurros, documentos e antigos juramentos.',chapter:'OS CINCO GUERREIROS',kind:'samurai',accent:'#4888ca',glyph:'憶'},
 {key:'takeda',name:'Takeda Shirogane',subtitle:'AQUELE QUE ABRE O CAMINHO',quote:'“O próximo passo também é uma escolha.”',description:'Um guerreiro cuja família constrói caminhos onde outros veem obstáculos.',chapter:'OS CINCO GUERREIROS',kind:'samurai',accent:'#58a894',glyph:'道'}
];
const els={panel:byId('introMasterPanel'),catalog:byId('introCatalog'),history:byId('introPublished'),feedback:byId('introFeedback'),overlay:byId('introCinema')};
if(!els.panel||!els.overlay)return;
let entries=[],activePreset=PRESETS[0],isBusy=false,fetching=false;
let lastAccount='',firstSync=true,lastId=0,activeAuto=null,finishing=false,openingSheet=false,assignedSlot=null;
const completedKey=()=> 'tempus_samurai_intro_completed_v3_'+currentId();
const assignedPreset=slot=>{const p=PRESETS.find(x=>x.key===slot?.slug);return p?{...p,name:slot.name||p.name,accent:slot.color||p.accent,samurai_slug:p.key,preset_key:p.key}:null};
function readLocal(){try{return JSON.parse(localStorage.getItem(localKey())||'[]')}catch{return []}}
function writeLocal(rows){localStorage.setItem(localKey(),JSON.stringify(rows))}
function glyph(item){
 const p=PRESETS.find(p=>p.key===item?.preset_key||p.name===item?.name);
 return p?.glyph||'✧';
}
function presetButton(p){
 return '<button type="button" class="intro-preset '+(activePreset?.key===p.key?'selected':'')+'" data-preset="'+esc(p.key)+'" style="--intro-accent:'+color(p.accent)+'"><span class="intro-preset-glyph">'+esc(p.glyph)+'</span><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.chapter)+'</small></span></button>';
}
function renderCatalog(){
 if(!els.catalog)return;
 els.catalog.innerHTML=PRESETS.map(presetButton).join('')+
 '<button type="button" class="intro-preset '+(!activePreset?'selected':'')+'" data-preset="custom" style="--intro-accent:#b99777"><span class="intro-preset-glyph">＋</span><span><strong>Personagem personalizado</strong><small>Jornalista ou NPC criado por você</small></span></button>';
}
function syncSamuraiTarget(){const field=byId('intro_samurai_target');if(field)field.hidden=byId('intro_kind')?.value!=='samurai';}
function fill(p){
 const data=p||{name:'',subtitle:'',quote:'',description:'',chapter:'PERSONAGEM DA CAMPANHA',kind:'jornalista',accent:'#b99777',portrait_url:''};
 for(const id of ['name','subtitle','quote','description','chapter','kind','accent','portrait_url']){
  const el=byId('intro_'+id);if(el)el.value=data[id]||((id==='accent')?'#b99777':'');
 }
 const slug=byId('intro_samurai_slug');if(slug)slug.value=data.kind==='samurai'?(data.samurai_slug||data.key||''):'';
 syncSamuraiTarget();
}
function setPreset(key){
 activePreset=PRESETS.find(p=>p.key===key)||null;
 fill(activePreset);renderCatalog();
}
function draft(){
 const item={};for(const id of ['name','subtitle','quote','description','chapter','kind','accent','portrait_url']){
 item[id]=byId('intro_'+id)?.value?.trim()||'';
 }
 item.name=item.name.slice(0,80);
 item.subtitle=item.subtitle.slice(0,100);
 item.quote=item.quote.slice(0,220);
 item.description=item.description.slice(0,340);
 item.chapter=item.chapter.slice(0,80);
 item.kind=['npc','samurai','jornalista','outro'].includes(item.kind)?item.kind:'npc';
 item.accent=color(item.accent);
 item.portrait_url=portrait(item.portrait_url)||null;
 item.preset_key=activePreset?.key||null;
 item.samurai_slug=item.kind==='samurai'?(byId('intro_samurai_slug')?.value||null):null;
 return item;
}
function feedback(msg,bad=false){if(!els.feedback)return;els.feedback.textContent=msg;els.feedback.classList.toggle('intro-error',bad)}
function display(item,automatic=false){
 if(!item)return;
 const overlay=els.overlay,accent=color(item.accent),url=portrait(item.portrait_url);
 activeAuto=automatic?item:null;
 overlay.style.setProperty('--intro-accent',accent);
 byId('introCinemaChapter').textContent=item.chapter||'TEMPUS CUSTODIA';
 byId('introCinemaSubtitle').textContent=item.subtitle||'PERSONAGEM';
 byId('introCinemaName').textContent=item.name||'';
 byId('introCinemaQuote').textContent=item.quote||'';
 byId('introCinemaDesc').textContent=item.description||'';
 const img=byId('introCinemaPortrait'),sig=byId('introCinemaGlyph');
 if(url){img.src=url;img.alt='Retrato de '+item.name;img.hidden=false;sig.hidden=true}
 else{img.removeAttribute('src');img.hidden=true;sig.textContent=glyph(item);sig.hidden=false}
 byId('introCinemaStage')?.classList.remove('is-final');
 byId('introCinemaFinish').hidden=!automatic;
 byId('introCinemaFinish').disabled=false;
 byId('introCinemaFinish').textContent='✦ Finalizar introdução';
 byId('introCinemaClose').hidden=!!automatic;
 byId('introCinemaEnd').hidden=true;
 const status=byId('introCinemaStatus');if(status)status.textContent='';
 overlay.hidden=false;
 overlay.classList.remove('intro-replay');void overlay.offsetWidth;
 overlay.classList.add('intro-replay');
 (automatic?byId('introCinemaFinish'):byId('introCinemaClose'))?.focus({preventScroll:true});
}
function close(){
 if(activeAuto)return;
 els.overlay.hidden=true;
 byId('introCinemaPortrait')?.removeAttribute('src');
 // Uma segunda apresentação pode ter chegado enquanto esta estava aberta.
 if(auth())refresh();
}
async function finishAutomatic(){
 if(!activeAuto||finishing||!auth())return;
 const event=activeAuto,button=byId('introCinemaFinish'),status=byId('introCinemaStatus');
 finishing=true;button.disabled=true;button.textContent='Registrando conclusão...';
 if(status)status.textContent='';
 try{
  // Conclusão atrelada à conta deste navegador; nunca armazenar dados de outra conta.
  localStorage.setItem(completedKey(),event.samurai_slug);
  byId('introCinemaStage').classList.add('is-final');
  byId('introCinemaEnd').hidden=false;
  byId('introCinemaFinalName').textContent=event.name;
  byId('introCinemaOpenSheet').focus({preventScroll:true});
  showHistory();
 }catch(error){
  button.disabled=false;button.textContent='✦ Tentar finalizar introdução';
  if(status)status.textContent='Não foi possível guardar a conclusão neste navegador: '+error.message;
 }finally{finishing=false}
}
async function enterAssignedSheet(){
 if(!activeAuto||openingSheet)return;
 const button=byId('introCinemaOpenSheet'),status=byId('introCinemaFinalStatus');
 openingSheet=true;button.disabled=true;
 if(status)status.textContent='Carregando sua ficha...';
 try{
  await window.OPAccounts.openAssignedSamurai(activeAuto.samurai_slug);
  activeAuto=null;
  els.overlay.hidden=true;
  byId('introCinemaPortrait')?.removeAttribute('src');
  byId('introCinemaStage')?.classList.remove('is-final');
  if(status)status.textContent='';
  refresh();
 }catch(error){
  if(status)status.textContent='Não foi possível abrir a ficha: '+error.message;
 }finally{openingSheet=false;button.disabled=false}
}
function recentText(i){return new Date(i.created_at||Date.now()).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function showHistory(){
 const list=els.history;if(!list)return;
 const own=assignedSlot&&!master()?assignedPreset(assignedSlot):null;
 const complete=own&&localStorage.getItem(completedKey())===own.samurai_slug;
 const ownHtml=own?'<article class="intro-public-row" style="--intro-accent:'+color(own.accent)+'"><div class="intro-public-mini">'+esc(glyph(own))+'</div><div><strong>'+esc(own.name)+'</strong><small>Ficha atribuída · '+(complete?'Introdução concluída':'Introdução pendente')+'</small></div><button type="button" class="btn small" data-assigned-repeat="1">Rever</button></article>':'';
 const rows=entries.map((e,i)=>
  '<article class="intro-public-row" style="--intro-accent:'+color(e.accent)+'"><div class="intro-public-mini">'+esc(glyph(e))+'</div><div><strong>'+esc(e.name)+'</strong><small>'+esc(e.subtitle)+' · '+esc(recentText(e))+(e.kind==='samurai'?' · 🔒 Apenas o responsável':'')+'</small></div><button type="button" class="btn small" data-repeat="'+i+'">Rever</button></article>'
 ).join('');
 list.innerHTML=ownHtml+rows||'<p class="intro-muted">Nenhuma apresentação publicada ainda. O mestre dará início às revelações durante a sessão.</p>';
}
function authChanged(){
 const id=auth()?currentId():'';
 if(id===lastAccount)return;
 lastAccount=id;firstSync=true;lastId=0;entries=[];assignedSlot=null;
 if(activeAuto){activeAuto=null;els.overlay.hidden=true}
 els.panel.hidden=!master();
 if(auth())showHistory();
}
function markSeen(id){
 lastId=Math.max(lastId,Number(id)||0);
 localStorage.setItem(seenKey(),String(lastId));
}
async function refresh(){
 if(!auth()||fetching)return;
 authChanged();
 fetching=true;
 try{
  const [data,slot]=await Promise.all([
   online()?window.OPAccounts.introRequest('/rest/v1/character_introductions?select=id,name,subtitle,quote,description,chapter,kind,samurai_slug,accent,portrait_url,created_at&order=id.desc&limit=40')
           :Promise.resolve(readLocal().slice().sort((a,b)=>b.id-a.id).slice(0,40)),
   online()&&!master()?window.OPAccounts.introAssignedSamurai():Promise.resolve(null)
  ]);
  if(!Array.isArray(data))throw Error('Resposta inválida do arquivo.');
  if(!auth())return;
  entries=data;
  assignedSlot=slot;
  if(online()&&!master()&&!slot){
   // Se o mestre desatribuir a ficha, uma atribuição futura poderá iniciar nova apresentação.
   localStorage.removeItem(completedKey());
  }
  showHistory();
  // Detecta a atribuição pela ficha já protegida por RLS no Supabase.
  // Não depende do botão "Publicar" nem de o jogador estar online no momento.
  const pending=slot&&localStorage.getItem(completedKey())!==slot.slug?assignedPreset(slot):null;
  if(pending&&els.overlay.hidden)display(pending,true);
  // Entregar cada NPC publicado, em ordem, sem marcar como visto enquanto
  // outra apresentação (inclusive o samurai automático) estiver aberta.
  // Num primeiro acesso, o histórico antigo não deve abrir dezenas de cenas.
  const stored=Number(localStorage.getItem(seenKey())||0);
  if(firstSync){
   firstSync=false;
   lastId=Math.max(lastId,stored);
   if(!stored){
    const cutoff=Date.now()-10*60*1000;
    const stale=data.filter(e=>new Date(e.created_at).getTime()<cutoff);
    const oldestSeen=stale.reduce((id,e)=>Math.max(id,Number(e.id)||0),0);
    if(oldestSeen>lastId)markSeen(oldestSeen);
   }
  }
  const next=data.filter(e=>Number(e.id)>lastId)
   .sort((a,b)=>Number(a.id)-Number(b.id))[0];
  if(next&&els.overlay.hidden){
   display(next);
   markSeen(next.id);
  }
  if(els.feedback?.dataset.connection==='error'){
   els.feedback.dataset.connection='';
   feedback('Arquivo conectado. Atribuições dos samurais são reveladas automaticamente para seus jogadores.');
  }
 }catch(e){
  if(els.feedback&&(!master()||!els.feedback.textContent.startsWith('Prévia'))){
   els.feedback.dataset.connection='error';
   feedback('Falha ao sincronizar as apresentações: '+e.message,true);
  }
 }finally{fetching=false}
}
async function publish(){
 if(!master())return feedback('Somente o mestre pode publicar entradas.',true);
 if(isBusy)return;
 const item=draft();
 if(!item.name)return feedback('Informe o nome do personagem.',true);
 if(!item.subtitle)return feedback('Escreva um título curto para a apresentação.',true);
 if(!item.quote)return feedback('Adicione uma frase de entrada.',true);
 const restricted=item.kind==='samurai';
 if(restricted&&!item.samurai_slug)return feedback('Selecione a ficha de samurai que receberá a apresentação.',true);
 if(restricted&&!online())return feedback('As apresentações privadas dos samurais exigem conexão com o Supabase. Use a prévia local ou conecte-se.',true);
 isBusy=true;const button=byId('introPublish');button.disabled=true;button.textContent='Publicando...';
 try{
  if(restricted){
   const assignee=await window.OPAccounts.introSamuraiAssignment(item.samurai_slug);
   if(!assignee)throw Error('Esta ficha ainda não foi atribuída a um jogador. Faça isso em Painel do Mestre → Os Cinco Samurais.');
  }
  const audience=restricted?'somente para o jogador que recebeu a ficha de '+item.name:'para todos os jogadores conectados';
  if(!confirm('Apresentar '+item.name+' agora '+audience+'?'))return;
  if(online()){
   const request={name:item.name,subtitle:item.subtitle,quote:item.quote,description:item.description,chapter:item.chapter,kind:item.kind,samurai_slug:item.samurai_slug,accent:item.accent,portrait_url:item.portrait_url,created_by:currentId()};
   await window.OPAccounts.introRequest('/rest/v1/character_introductions','POST',request);
  }else{
   const data=readLocal();const nextId=Math.max(Date.now(),...data.map(x=>x.id||0))+1;
   data.unshift({...item,id:nextId,created_at:new Date().toISOString()});writeLocal(data.slice(0,40));
  }
  feedback(!online()?'A apresentação foi salva somente neste navegador. Para os outros jogadores receberem, use o site conectado ao Supabase.':
   restricted?'Apresentação privada publicada! Apenas quem recebeu a ficha poderá vê-la e revê-la.':'NPC publicado! A entrada aparecerá para os jogadores conectados, na ordem das apresentações.');
  await refresh();
 }catch(e){feedback('Não foi possível publicar: '+e.message,true)}
 finally{isBusy=false;button.disabled=false;button.textContent='✧ Apresentar aos jogadores'}
}
els.catalog?.addEventListener('click',e=>{const btn=e.target.closest('[data-preset]');if(btn)setPreset(btn.dataset.preset)});
els.history?.addEventListener('click',e=>{const assigned=e.target.closest('[data-assigned-repeat]');if(assigned&&assignedSlot){const item=assignedPreset(assignedSlot);display(item,localStorage.getItem(completedKey())!==item.samurai_slug);return}const btn=e.target.closest('[data-repeat]');if(btn)display(entries[Number(btn.dataset.repeat)])});
byId('introPreview')?.addEventListener('click',()=>{if(!master())return;const item=draft();if(!item.name)return feedback('Digite um nome para pré-visualizar.',true);display(item);feedback('Prévia local: nenhum jogador recebeu esta apresentação.')});
byId('introPublish')?.addEventListener('click',publish);
byId('intro_kind')?.addEventListener('change',()=>{syncSamuraiTarget();if(byId('intro_kind').value==='samurai'&&activePreset?.kind==='samurai')byId('intro_samurai_slug').value=activePreset.key});
byId('introReload')?.addEventListener('click',refresh);
byId('introCinemaClose')?.addEventListener('click',close);
byId('introCinemaFinish')?.addEventListener('click',finishAutomatic);
byId('introCinemaOpenSheet')?.addEventListener('click',enterAssignedSheet);
els.overlay.addEventListener('click',e=>{if(e.target===els.overlay)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!els.overlay.hidden)close()});
window.addEventListener('storage',e=>{if(e.key===localKey()&&!online())refresh()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
setPreset(PRESETS[0].key);els.panel.hidden=true;showHistory();
setInterval(()=>{authChanged();if(auth()&&!document.hidden)refresh()},4000);
setTimeout(()=>{authChanged();if(auth())refresh()},800);
window.TempusIntroducoes={abrir:display,atualizar:refresh};
})();
