/* TEMPUS CUSTODIA — Central do Mestre.
   As ferramentas são movidas para páginas internas reais (sem duplicar DOM/IDs).
   O desbloqueio local existente continua em ficha-mestre.js. A autorização do
   mestre e a privacidade continuam no Supabase / políticas RLS. */
(function(){
 'use strict';
 const byId=id=>document.getElementById(id);
 const masterView=byId('v-mestre');
 const consoleRoot=masterView?.querySelector('.master-console');
 const header=consoleRoot?.querySelector('.master-console-head');
 const sources={
  cenas:byId('v-cenas'),
  sussurros:byId('v-sussurros'),
  enigmas:byId('v-enigmas'),
  mural:byId('v-mural'),
  npcs:byId('v-intro')
 };
 const local={
  summary:byId('masterSummary'),
  pe:consoleRoot?.querySelector('.master-pe-console'),
  samurais:consoleRoot?.querySelector('.samurai-master-section'),
  roster:consoleRoot?.querySelector('.op-master-roster'),
  filters:consoleRoot?.querySelector('.master-filters'),
  log:byId('masterLog')
 };
 if(!masterView||!consoleRoot||!header||Object.values(sources).some(x=>!x)||
    Object.values(local).some(x=>!x))return;
 const sourceNodes={};
 for(const key of Object.keys(sources))sourceNodes[key]=Array.from(sources[key].children);
 const navButtons={};
 for(const [key,view] of Object.entries({
  cenas:'cenas',sussurros:'sussurros',enigmas:'enigmas',mural:'mural',npcs:'intro'
 })){
  navButtons[key]=document.querySelector('.nav button[data-view="'+view+'"]');
 }
 const root=document.createElement('div');
 root.id='masterExperience';
 root.className='mc-experience';
 const areas=[
  {key:'cenas',number:'01',icon:'◈',name:'Diretor de Cenas',description:'Prepare e inicie revelações cinematográficas para a mesa.',group:'NARRATIVA',flag:'CENAS AO VIVO',featured:true},
  {key:'sussurros',number:'02',icon:'✧',name:'Sussurros',description:'Envie segredos individuais e acompanhe respostas privadas.',group:'NARRATIVA',flag:'MENSAGENS PRIVADAS'},
  {key:'npcs',number:'03',icon:'♙',name:'NPCs e Apresentações',description:'Revele personagens, use retratos e apresente novos encontros.',group:'NARRATIVA',flag:'REVELAÇÕES'},
  {key:'enigmas',number:'04',icon:'◇',name:'Enigmas e Baús',description:'Crie códigos, desafios, rascunhos e baús de quatro dígitos.',group:'INVESTIGAÇÃO',flag:'DESAFIOS'},
  {key:'mural',number:'05',icon:'⌕',name:'Mural de Investigação',description:'Revele pistas, veja fotografias e conecte evidências.',group:'INVESTIGAÇÃO',flag:'ARQUIVO DE PISTAS'},
  {key:'personagens',number:'06',icon:'♜',name:'Personagens e PE',description:'Controle recursos, cinco samurais e fichas dos jogadores.',group:'GESTÃO',flag:'FICHAS E RECURSOS'},
  {key:'registros',number:'07',icon:'◷',name:'Registros da Sessão',description:'Filtre ações, rolagens, poderes e acontecimentos.',group:'GESTÃO',flag:'HISTÓRICO'}
 ];
 const safeKey=key=>areas.some(x=>x.key===key)||key==='central'?key:'central';
 const card=a=>'<button type="button" class="mc-card'+(a.featured?' mc-card-featured':'')+'" data-master-open="'+a.key+'"'+
  ' data-group="'+a.group+'" aria-label="Abrir '+a.name+'">'+
  '<div class="mc-card-top"><span class="mc-card-icon" aria-hidden="true">'+a.icon+'</span><small>'+a.number+' / '+a.flag+'</small></div>'+
  '<div class="mc-card-bottom"><h4>'+a.name+'</h4><p>'+a.description+'</p>'+
  '<span class="mc-card-cta">ACESSAR FERRAMENTA <span aria-hidden="true">↗</span></span></div>'+
  (a.key==='sussurros'?'<span id="mcWhisperCardBadge" class="mc-card-badge" hidden>0</span>':'')+
  '</button>';
 const cardsGroup=(group,title,desc)=>
  '<div class="mc-group"><div class="mc-group-heading"><div><small>'+group+'</small><h3>'+title+'</h3></div><p>'+desc+'</p></div>'+
  '<div class="mc-card-grid">'+areas.filter(a=>a.group===group).map(card).join('')+'</div></div>';
 const pageHTML=a=>
  '<section class="mc-subpage" data-master-page-panel="'+a.key+'" id="mcPage-'+a.key+'" hidden aria-label="'+a.name+'">'+
  '<header class="mc-subpage-head"><button type="button" class="mc-back" data-master-open="central">← Voltar à Central</button>'+
  '<div class="mc-subpage-title"><span class="mc-subpage-symbol" aria-hidden="true">'+a.icon+'</span><div><small>ARQUIVO '+a.number+' • '+a.flag+'</small>'+
  '<h2>'+a.name+'</h2><p>'+a.description+'</p></div></div></header>'+
  '<div class="mc-page-content" id="mcDock-'+a.key+'"></div></section>';
 const sectionNav='<nav class="mc-jump-nav" aria-label="Trocar de página do mestre">'+
  '<button type="button" data-master-open="central" class="mc-jump-home">⌂ Central</button>'+
  areas.map(a=>'<button type="button" data-master-open="'+a.key+'">'+a.icon+' '+a.name+'</button>').join('')+'</nav>';
 root.innerHTML=
  '<section class="mc-overview" id="mcPage-central" data-master-page-panel="central">'+
   '<div class="mc-hero"><div class="mc-hero-content"><small class="mc-kicker">◈ O ARQUIVO DOS SETE ANJOS • ACESSO DO NARRADOR</small>'+
   '<h2>Central<br><em>do Mestre.</em></h2><p>Uma única entrada para todas as ferramentas. Escolha seu próximo movimento e mantenha o controle da narrativa.</p>'+
   '<div class="mc-hero-actions"><button type="button" class="mc-primary-action" data-master-open="cenas">◈ Iniciar uma cena <span aria-hidden="true">↗</span></button>'+
   '<button type="button" class="mc-secondary-action" data-master-open="sussurros">✧ Enviar sussurro</button></div></div>'+
   '<div class="mc-hero-art" aria-hidden="true"><div class="mc-orbit mc-orbit-outer"></div><div class="mc-orbit mc-orbit-mid"></div><div class="mc-orbit mc-orbit-inner"></div><span>七</span><small>TEMPUS<br>CUSTODIA</small></div></div>'+
   '<div class="mc-status-row" aria-live="polite">'+
    '<div class="mc-status"><span class="mc-status-glyph">◈</span><div><small>CENA ATUAL</small><strong id="mcSceneState">Verificando...</strong></div></div>'+
    '<div class="mc-status"><span class="mc-status-glyph">◇</span><div><small>ENIGMAS ATIVOS</small><strong id="mcPuzzleCount">—</strong></div></div>'+
    '<div class="mc-status"><span class="mc-status-glyph">✧</span><div><small>SUSSURROS NÃO LIDOS</small><strong id="mcUnreadCount">—</strong></div></div>'+
    '<div class="mc-status"><span class="mc-status-glyph">⌕</span><div><small>PISTAS NO MURAL</small><strong id="mcClueCount">—</strong></div></div>'+
   '</div>'+
   '<div class="mc-local-summary"><div class="mc-group-heading"><div><small>VISÃO GERAL</small><h3>Seu terminal de campo</h3></div><p>Registros locais dos agentes desta sessão.</p></div><div id="mcSummaryDock"></div></div>'+
   '<div id="mcAccountNotice" class="mc-account-notice" hidden>Para transmitir cenas, revelar pistas e gerenciar mensagens entre dispositivos, entre com a <strong>conta de mestre conectada ao Supabase</strong>. Os recursos locais continuam disponíveis.</div>'+
   cardsGroup('NARRATIVA','Conduza a história','Cenas, revelações e mensagens secretas.')+
   cardsGroup('INVESTIGAÇÃO','Desvende o impossível','Enigmas, fotografias e evidências compartilhadas.')+
   cardsGroup('GESTÃO','Cuide da sua mesa','Fichas, esforço e atividades dos jogadores.')+
   '<footer class="mc-overview-foot"><span>✦ TEMPUS CUSTODIA</span><span>O TEMPO GUARDA SEUS SEGREDOS</span></footer>'+
  '</section>'+
  '<div class="mc-subpage-nav" id="mcSubpageNav" hidden>'+sectionNav+'</div>'+
  areas.map(pageHTML).join('');
 header.insertAdjacentElement('afterend',root);
 const dock=key=>byId('mcDock-'+key);
 dock('personagens').append(local.pe,local.samurais,local.roster);
 dock('registros').append(local.filters,local.log);
 byId('mcSummaryDock').appendChild(local.summary);
 let mounted=null,activeAccount='',currentPage='central',masterWasActive=false;
 const hasMasterAccount=()=>window.OPAccounts?.authenticated===true&&
  window.OPAccounts?.online===true&&window.OPAccounts?.masterRole===true;
 const remoteKeys=new Set(['cenas','sussurros','npcs','enigmas','mural']);
 function openPage(key){
  const next=safeKey(key);
  if(next!=='central'&&remoteKeys.has(next)&&!hasMasterAccount())return;
  currentPage=next;
  for(const panel of root.querySelectorAll('[data-master-page-panel]')){
   const selected=panel.dataset.masterPagePanel===next;
   panel.hidden=!selected;
   panel.setAttribute('aria-hidden',String(!selected));
  }
  byId('mcSubpageNav').hidden=next==='central';
  for(const button of root.querySelectorAll('.mc-jump-nav [data-master-open]')){
   const selected=button.dataset.masterOpen===next;
   button.classList.toggle('is-current',selected);
   if(selected)button.setAttribute('aria-current','page');
   else button.removeAttribute('aria-current');
  }
  const title=byId('title');
  if(title&&masterView.classList.contains('active')){
   const area=areas.find(x=>x.key===next);
   title.textContent=area?'Mestre • '+area.name:'Central do Mestre';
   masterWasActive=true;
  }
  if(next==='cenas')window.TempusCenas?.atualizar?.();
  if(next==='sussurros')window.TempusSussurros?.atualizar?.();
  if(next==='enigmas'||next==='mural')window.TempusInvestigacao?.atualizar?.();
  if(next==='npcs')window.TempusIntroducoes?.atualizar?.();
  if(next==='central')renderOverview();
  if(masterView.classList.contains('active')){
   const scrollArea=document.querySelector('main');
   if(scrollArea&&scrollArea.scrollTop>50)scrollArea.scrollTo({top:0,behavior:'instant'});
   window.scrollTo?.({top:0,behavior:'instant'});
  }
 }
 root.addEventListener('click',e=>{
  const button=e.target.closest('[data-master-open]');
  if(!button||!root.contains(button)||!masterView.classList.contains('active'))return;
  openPage(button.dataset.masterOpen);
 });
 function renderOverview(){
  const allowed=hasMasterAccount();
  byId('mcAccountNotice').hidden=allowed;
  for(const button of root.querySelectorAll('[data-master-open]')){
   button.disabled=remoteKeys.has(button.dataset.masterOpen)&&!allowed;
   if(button.disabled)button.title='Conecte-se com a conta de mestre para acessar esta ferramenta.';
   else button.removeAttribute('title');
  }
  const sceneStatus=byId('sceneLiveStatus');
  const onAir=Boolean(sceneStatus?.querySelector('.scene-on-air'));
  const sceneTitle=sceneStatus?.querySelector('strong')?.textContent?.trim();
  byId('mcSceneState').textContent=!allowed?'Conta do mestre necessária':onAir?(sceneTitle||'Cena no ar'):'Nenhuma cena ao vivo';
  byId('mcPuzzleCount').textContent=allowed?
   String(byId('puzzleList')?.querySelectorAll('.mystery-puzzle-card .mystery-state.active').length??0):'—';
  byId('mcClueCount').textContent=allowed?
   String(byId('clueList')?.querySelectorAll('.mystery-clue').length??0):'—';
  const badge=byId('whisperUnreadBadge');
  const unread=allowed&&!badge?.hidden?badge?.textContent?.trim()||'0':'0';
  byId('mcUnreadCount').textContent=allowed?unread:'—';
  const cardBadge=byId('mcWhisperCardBadge');
  if(cardBadge){cardBadge.textContent=unread;cardBadge.hidden=!allowed||unread==='0'}
 }
 function hideMasterOnlyForms(){
  for(const id of ['sceneMasterPanel','whisperMasterPanel','whisperComposer','puzzleMasterPanel','clueMasterPanel','introMasterPanel']){
   const el=byId(id);if(el)el.hidden=true;
  }
 }
 function sync(){
  const isMaster=hasMasterAccount();
  const accountId=isMaster?window.OPAccounts.current?.id||'master':'';
  if(isMaster!==mounted){
   mounted=isMaster;
   if(isMaster){
    for(const [key,page] of Object.entries(sources)){
     for(const node of sourceNodes[key])dock(key).appendChild(node);
    }
    window.TempusCenas?.atualizar?.();
    window.TempusSussurros?.atualizar?.();
    window.TempusInvestigacao?.atualizar?.();
    window.TempusIntroducoes?.atualizar?.();
    if(Object.values(sources).some(page=>page.classList.contains('active'))&&typeof window.view==='function'){
     window.view('mestre');
    }
   }else{
    for(const [key,page] of Object.entries(sources)){
     for(const node of sourceNodes[key])page.appendChild(node);
    }
    hideMasterOnlyForms();
    if(masterView.classList.contains('active')&&typeof window.view==='function')window.view('home');
    if(currentPage!=='central')openPage('central');
   }
   for(const button of Object.values(navButtons))if(button)button.hidden=isMaster;
  }
  if(accountId!==activeAccount){activeAccount=accountId;openPage('central')}
  const active=masterView.classList.contains('active');
  if(active&&!masterWasActive){openPage('central');masterWasActive=true}
  if(!active)masterWasActive=false;
  if(active&&currentPage==='central')renderOverview();
 }
 openPage('central');
 sync();
 setInterval(sync,1250);
 window.addEventListener('pageshow',sync);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
 window.TempusMestreFerramentas={
  atualizar:sync,
  abrir:key=>openPage(key),
  central:()=>openPage('central')
 };
})();