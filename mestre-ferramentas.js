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
 const navScene=document.querySelector('.nav button[data-view="cenas"]');
 const navWhisper=document.querySelector('.nav button[data-view="sussurros"]');
 if(!masterView||!masterConsole||!pePanel||!scenePage||!whisperPage)return;

 // Somente os blocos de conteudo entram no painel. Os overlays ficam no body,
 // para continuar aparecendo inclusive durante rolagens e exploracao.
 const sceneNodes=Array.from(scenePage.children);
 const whisperNodes=Array.from(whisperPage.children);
 const section=document.createElement('section');
 section.id='masterNarrativeTools';
 section.className='master-narrative-tools';
 section.hidden=true;
 section.innerHTML=
  '<div class="master-narrative-head"><div><small>◈ CONTROLE DO NARRADOR</small>'+
  '<h3>Direção da sessão</h3><p>Inicie cenas cinematográficas e envie sussurros sem sair do Painel do Mestre.</p></div>'+
  '<span class="master-narrative-glyph" aria-hidden="true">✧</span></div>'+
  '<div class="master-narrative-tabs" role="tablist" aria-label="Ferramentas do mestre">'+
  '<button type="button" id="masterScenesTab" role="tab" aria-selected="true" aria-controls="masterScenesDock" class="is-current">◈ Diretor de Cenas</button>'+
  '<button type="button" id="masterWhispersTab" role="tab" aria-selected="false" aria-controls="masterWhispersDock">✧ Sussurros <span id="masterWhisperBadge" hidden>0</span></button></div>'+
  '<div class="master-narrative-dock master-scene-dock" role="tabpanel" id="masterScenesDock" aria-labelledby="masterScenesTab"></div>'+
  '<div class="master-narrative-dock master-whisper-dock" role="tabpanel" id="masterWhispersDock" aria-labelledby="masterWhispersTab" hidden></div>';
 pePanel.insertAdjacentElement('afterend',section);
 const sceneDock=byId('masterScenesDock'),whisperDock=byId('masterWhispersDock');
 const sceneTab=byId('masterScenesTab'),whisperTab=byId('masterWhispersTab');
 const badge=byId('masterWhisperBadge'),baseBadge=byId('whisperUnreadBadge');
 let isMounted=null,tab='cenas';

 function useTab(which){
  tab=which==='sussurros'?'sussurros':'cenas';
  sceneDock.hidden=tab!=='cenas';
  whisperDock.hidden=tab!=='sussurros';
  sceneTab.classList.toggle('is-current',tab==='cenas');
  whisperTab.classList.toggle('is-current',tab==='sussurros');
  sceneTab.setAttribute('aria-selected',String(tab==='cenas'));
  whisperTab.setAttribute('aria-selected',String(tab==='sussurros'));
  if(tab==='cenas')window.TempusCenas?.atualizar?.();
  else window.TempusSussurros?.atualizar?.();
 }
 sceneTab.addEventListener('click',()=>useTab('cenas'));
 whisperTab.addEventListener('click',()=>useTab('sussurros'));

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
    section.hidden=false;
    // Se a troca de conta ocorreu em uma aba antiga, solicitar acesso ao painel.
    if((scenePage.classList.contains('active')||whisperPage.classList.contains('active'))&&typeof window.view==='function')
     window.view('mestre');
   }else{
    for(const n of sceneNodes)scenePage.appendChild(n);
    for(const n of whisperNodes)whisperPage.appendChild(n);
    section.hidden=true;
    if(masterView.classList.contains('active')&&typeof window.view==='function')
     window.view('home');
   }
   if(navScene)navScene.hidden=move;
   if(navWhisper)navWhisper.hidden=move;
  }
  syncUnread();
 }
 syncPlacement();
 setInterval(syncPlacement,1200);
 window.addEventListener('pageshow',syncPlacement);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPlacement()});
 window.TempusMestreFerramentas={atualizar:syncPlacement,abrir:useTab};
})();