/* Tempus Custodia — acopla os controles de narracao ao Painel do Mestre.
   Move nos reais do DOM (sem clones): os listeners e estados dos modulos continuam intactos.
   Outros jogadores mantem as paginas de consulta; RLS segue sendo a autorizacao efetiva. */
(function(){
 'use strict';
 const byId=id=>document.getElementById(id);
 const masterView=byId('v-mestre');
 const masterConsole=masterView?.querySelector('.master-console');
 const pePanel=masterConsole?.querySelector('.master-pe-console');
 const scenePage=byId('v-cenas'),whisperPage=byId('v-sussurros');
 const puzzlePage=byId('v-enigmas'),boardPage=byId('v-mural');
 const navScene=document.querySelector('.nav button[data-view="cenas"]');
 const navWhisper=document.querySelector('.nav button[data-view="sussurros"]');
 const navPuzzle=document.querySelector('.nav button[data-view="enigmas"]');
 const navBoard=document.querySelector('.nav button[data-view="mural"]');
 if(!masterView||!masterConsole||!pePanel||!scenePage||!whisperPage||!puzzlePage||!boardPage)return;

 // Somente os blocos de conteudo entram no painel. Os overlays ficam no body,
 // para continuar aparecendo inclusive durante rolagens e exploracao.
 const sceneNodes=Array.from(scenePage.children);
 const whisperNodes=Array.from(whisperPage.children);
 const puzzleNodes=Array.from(puzzlePage.children);
 const boardNodes=Array.from(boardPage.children);
 const section=document.createElement('section');
 section.id='masterNarrativeTools';
 section.className='master-narrative-tools';
 section.hidden=true;
 section.innerHTML=
  '<div class="master-narrative-head"><div><small>◈ CONTROLE DO NARRADOR</small>'+
  '<h3>Direção da sessão</h3><p>Cenas cinematográficas, sussurros, enigmas e investigação em um único lugar.</p></div>'+
  '<span class="master-narrative-glyph" aria-hidden="true">✧</span></div>'+
  '<div class="master-narrative-tabs" role="tablist" aria-label="Ferramentas do mestre">'+
  '<button type="button" id="masterScenesTab" role="tab" aria-selected="true" aria-controls="masterScenesDock" class="is-current">◈ Diretor de Cenas</button>'+
  '<button type="button" id="masterWhispersTab" role="tab" aria-selected="false" aria-controls="masterWhispersDock">✧ Sussurros <span id="masterWhisperBadge" hidden>0</span></button>'+ 
  '<button type="button" id="masterPuzzlesTab" role="tab" aria-selected="false" aria-controls="masterPuzzlesDock">◇ Enigmas interativos</button>'+ 
  '<button type="button" id="masterBoardTab" role="tab" aria-selected="false" aria-controls="masterBoardDock">⌕ Mural de investigação</button></div>'+
  '<div class="master-narrative-dock master-scene-dock" role="tabpanel" id="masterScenesDock" aria-labelledby="masterScenesTab"></div>'+
  '<div class="master-narrative-dock master-whisper-dock" role="tabpanel" id="masterWhispersDock" aria-labelledby="masterWhispersTab" hidden></div>'+ 
  '<div class="master-narrative-dock master-puzzle-dock" role="tabpanel" id="masterPuzzlesDock" aria-labelledby="masterPuzzlesTab" hidden></div>'+ 
  '<div class="master-narrative-dock master-board-dock" role="tabpanel" id="masterBoardDock" aria-labelledby="masterBoardTab" hidden></div>';
 pePanel.insertAdjacentElement('afterend',section);
 const sceneDock=byId('masterScenesDock'),whisperDock=byId('masterWhispersDock');
 const puzzleDock=byId('masterPuzzlesDock'),boardDock=byId('masterBoardDock');
 const sceneTab=byId('masterScenesTab'),whisperTab=byId('masterWhispersTab');
 const puzzleTab=byId('masterPuzzlesTab'),boardTab=byId('masterBoardTab');
 const badge=byId('masterWhisperBadge'),baseBadge=byId('whisperUnreadBadge');
 let isMounted=null,tab='cenas';

 function useTab(which){
  tab=['cenas','sussurros','enigmas','mural'].includes(which)?which:'cenas';
  const tabs=[
   {name:'cenas',tab:sceneTab,dock:sceneDock},
   {name:'sussurros',tab:whisperTab,dock:whisperDock},
   {name:'enigmas',tab:puzzleTab,dock:puzzleDock},
   {name:'mural',tab:boardTab,dock:boardDock}
  ];
  for(const item of tabs){
   item.dock.hidden=tab!==item.name;
   item.tab.classList.toggle('is-current',tab===item.name);
   item.tab.setAttribute('aria-selected',String(tab===item.name));
  }
  if(tab==='cenas')window.TempusCenas?.atualizar?.();
  if(tab==='sussurros')window.TempusSussurros?.atualizar?.();
  if(tab==='enigmas'||tab==='mural')window.TempusInvestigacao?.atualizar?.();
 }
 sceneTab.addEventListener('click',()=>useTab('cenas'));
 whisperTab.addEventListener('click',()=>useTab('sussurros'));
 puzzleTab.addEventListener('click',()=>useTab('enigmas'));
 boardTab.addEventListener('click',()=>useTab('mural'));

 const hasMasterAccount=()=>window.OPAccounts?.authenticated===true &&
  window.OPAccounts?.online===true && window.OPAccounts?.masterRole===true;
 function syncUnread(){
  if(!badge||!baseBadge)return;
  badge.hidden=baseBadge.hidden;
  badge.textContent=baseBadge.textContent||'0';
  whisperTab.setAttribute('aria-label',badge.hidden?'Sussurros':'Sussurros: '+badge.textContent+' não lidos');
 }
 function syncPlacement(){
  const move=hasMasterAccount();
  if(move!==isMounted){
   isMounted=move;
   if(move){
    for(const n of sceneNodes)sceneDock.appendChild(n);
    for(const n of whisperNodes)whisperDock.appendChild(n);
    for(const n of puzzleNodes)puzzleDock.appendChild(n);
    for(const n of boardNodes)boardDock.appendChild(n);
    section.hidden=false;
    // Sincronizar os paineis logo apos receber a conta do mestre.
    window.TempusCenas?.atualizar?.();
    window.TempusSussurros?.atualizar?.();
    window.TempusInvestigacao?.atualizar?.();
    // Se a troca de conta ocorreu em uma aba antiga, solicitar acesso ao painel.
    if([scenePage,whisperPage,puzzlePage,boardPage].some(p=>p.classList.contains('active'))&&typeof window.view==='function')
     window.view('mestre');
   }else{
    for(const n of sceneNodes)scenePage.appendChild(n);
    for(const n of whisperNodes)whisperPage.appendChild(n);
    for(const n of puzzleNodes)puzzlePage.appendChild(n);
    for(const n of boardNodes)boardPage.appendChild(n);
    section.hidden=true;
    // Nenhum formulario de administracao fica exposto durante a troca de contas.
    const sceneMaster=byId('sceneMasterPanel'),whisperMaster=byId('whisperMasterPanel'),whisperComposer=byId('whisperComposer');
    if(sceneMaster)sceneMaster.hidden=true;
    if(whisperMaster)whisperMaster.hidden=true;
    if(whisperComposer)whisperComposer.hidden=true;
    const puzzleMaster=byId('puzzleMasterPanel'),clueMaster=byId('clueMasterPanel');
    if(puzzleMaster)puzzleMaster.hidden=true;
    if(clueMaster)clueMaster.hidden=true;
    if(masterView.classList.contains('active')&&typeof window.view==='function')
     window.view('home');
   }
   if(navScene)navScene.hidden=move;
   if(navWhisper)navWhisper.hidden=move;
   if(navPuzzle)navPuzzle.hidden=move;
   if(navBoard)navBoard.hidden=move;
  }
  syncUnread();
 }
 syncPlacement();
 setInterval(syncPlacement,1200);
 window.addEventListener('pageshow',syncPlacement);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPlacement()});
 window.TempusMestreFerramentas={atualizar:syncPlacement,abrir:useTab};
})();