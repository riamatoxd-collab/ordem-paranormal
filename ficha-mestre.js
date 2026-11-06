/* Interface adicional — mantém o motor original de Ordem Paranormal. */
(function(){
 const nav=document.querySelector('.nav');
 const masterBtn=document.createElement('button');
 masterBtn.dataset.view='mestre';masterBtn.textContent='♜  Painel do Mestre';nav.appendChild(masterBtn);
 const main=document.querySelector('main');
 const master=document.createElement('section');master.className='view';master.id='v-mestre';
 master.innerHTML='<div class="master-console">'
  +'<div class="master-console-head"><div class="master-brand"><small>TRANSMISSÃO RESTRITA • CAMADA DO VAZIO</small><h2>♜ Tempus Custodia</h2><p>Central de comando da campanha · ferramentas separadas para o narrador.</p></div><div class="master-access-tools"><span class="master-lock-label">ACESSO AUTORIZADO</span><button type="button" class="btn small master-sound-toggle" id="masterSoundToggle" onclick="toggleMasterAmbient()" aria-pressed="true">◉ Som do Vazio: ligado</button><button type="button" class="btn small master-lock-button" onclick="lockMasterPanel()">Bloquear painel</button></div></div>'
  +'<div class="master-summary" id="masterSummary"></div>'
  +'<section class="master-pe-console" aria-label="Controles de esforço dos agentes"><div class="master-pe-head"><span>◈ CONTROLE DE ESFORÇO</span><small>Reinicie o turno, encerre a cena ou recupere PE, conforme a situação da mesa.</small></div><div class="master-pe-controls"><label>AGENTE<select id="masterPEAgent"></select></label><div class="master-pe-buttons"><button type="button" class="btn small" onclick="masterPEAction(&quot;turn&quot;)">↻ Novo turno</button><button type="button" class="btn small" onclick="masterPEAction(&quot;scene&quot;)">◌ Encerrar cena</button><button type="button" class="btn small primary" onclick="masterPEAction(&quot;restore&quot;)">✚ Recuperar PE</button></div></div><div class="master-pe-status" id="masterPEStatus" aria-live="polite"></div></section>'
  +'<section class="samurai-master-section"><header class="samurai-master-header"><div><small>ARQUIVO ANCESTRAL • CINCO JURAMENTOS</small><h3>✦ Os Cinco Samurais</h3><p>Prepare as fichas, escolha uma cor para cada guerreiro e atribua um personagem a cada jogador. O progresso do jogador permanece salvo.</p></div><button type="button" class="btn small" onclick="OPAccounts.refreshSamurais()">↻ Atualizar samurais</button></header><div class="samurai-master-grid" id="masterSamuraiCards" aria-live="polite"></div></section>'
  +'<section class="op-master-roster"><div class="op-master-roster-head"><div><h3>✧ Personagens registrados</h3><p>Consulte personagens criados pelos jogadores, seus recursos e atributos.</p></div><button type="button" onclick="OPAccounts.refreshMasterRoster()">↻ Atualizar registros</button></div><div id="masterAccountRoster" aria-live="polite"></div></section>'
  +'<div class="master-filters"><label>Agente <select id="masterAgent"></select></label><label>Tipo <select id="masterKind"><option value="todos">Todos</option><option value="poderes">Poderes e rituais</option><option value="testes">Testes e combate</option></select></label></div><div class="list" id="masterLog"></div></div>';
 const footer=main.querySelector('.foot');main.insertBefore(master,footer);

 const MASTER_PASSWORD='342005'; // Bloqueio de interface local; não substitui autenticação de servidor.
 let masterUnlocked=false;
 let masterSoundEnabled=true;
 let masterAmbient=null;
 const masterGate=document.createElement('div');
 masterGate.id='masterGate';masterGate.className='master-gate';masterGate.hidden=true;
 masterGate.innerHTML='<section class="master-gate-dialog" role="dialog" aria-modal="true" aria-labelledby="masterGateTitle" aria-describedby="masterGateDescription"><div class="master-gate-sigil" aria-hidden="true">◈</div><span class="master-gate-kicker">ENTRADA RESTRITA</span><h2 id="masterGateTitle">O Vazio observa.</h2><p id="masterGateDescription">Somente o mestre pode abrir este arquivo. Insira o código de acesso para continuar.</p><form id="masterGateForm"><label for="masterGatePassword">SENHA DO MESTRE</label><input id="masterGatePassword" type="password" inputmode="numeric" maxlength="6" autocomplete="off" required placeholder="••••••"><p id="masterGateError" class="master-gate-error" role="alert" aria-live="polite"></p><div class="master-gate-actions"><button type="button" class="btn small" id="masterGateCancel">Voltar</button><button type="submit" class="btn small primary">Entrar no painel</button></div></form><small class="master-gate-hint">Este bloqueio protege apenas a interface local. A senha pode ser encontrada por alguém que inspecione o código do site.</small></section>';
 document.body.appendChild(masterGate);
 const audioButton=$('masterSoundToggle');
 function updateMasterAudioButton(){
  if(!audioButton)return;
  audioButton.textContent=masterSoundEnabled?'◉ Som do Vazio: ligado':'◯ Som do Vazio: desligado';
  audioButton.setAttribute('aria-pressed',String(masterSoundEnabled));
 }
 function startMasterAmbient(){
  if(!masterUnlocked||!masterSoundEnabled||masterAmbient)return;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC){masterSoundEnabled=false;updateMasterAudioButton();say('Áudio não suportado neste navegador.');return}
  try{
   const ctx=new AC(),output=ctx.createGain(),nodes=[];
   output.gain.setValueAtTime(0,ctx.currentTime);
   output.connect(ctx.destination);
   // Drone grave + oscilação lenta + ruído filtrado, sintetizados localmente.
   [[52,'sine',.24],[74,'triangle',.09],[104.3,'sine',.045]].forEach(([frequency,type,volume])=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=type;osc.frequency.value=frequency;gain.gain.value=volume;
    osc.connect(gain);gain.connect(output);osc.start();nodes.push(osc);
   });
   const noiseBuffer=ctx.createBuffer(1,Math.round(ctx.sampleRate*2),ctx.sampleRate);
   const noiseData=noiseBuffer.getChannelData(0);
   for(let i=0;i<noiseData.length;i++)noiseData[i]=(Math.random()*2-1)*.28;
   const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),noiseGain=ctx.createGain();
   noise.buffer=noiseBuffer;noise.loop=true;
   filter.type='lowpass';filter.frequency.value=150;filter.Q.value=.75;noiseGain.gain.value=.055;
   noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(output);noise.start();
   nodes.push(noise);
   const lfo=ctx.createOscillator(),lfoGain=ctx.createGain();
   lfo.type='sine';lfo.frequency.value=.11;lfoGain.gain.value=45;
   lfo.connect(lfoGain);lfoGain.connect(filter.frequency);lfo.start();nodes.push(lfo);
   masterAmbient={ctx,output,nodes};
   output.gain.setTargetAtTime(.19,ctx.currentTime,.25);
   Promise.resolve(ctx.resume()).catch(()=>{stopMasterAmbient();say('Não foi possível iniciar o som. Use o botão para tentar novamente.')});
  }catch(e){stopMasterAmbient();masterSoundEnabled=false;updateMasterAudioButton();say('Falha ao iniciar o som do Vazio.')}
 }
 function stopMasterAmbient(){
  if(!masterAmbient)return;
  const audio=masterAmbient;masterAmbient=null;
  try{
   audio.output.gain.setTargetAtTime(0,audio.ctx.currentTime,.045);
   setTimeout(()=>{audio.nodes.forEach(node=>{try{node.stop()}catch(e){}});audio.ctx.close().catch(()=>{})},280);
  }catch(e){try{audio.ctx.close().catch(()=>{})}catch(err){}}
 }
 window.toggleMasterAmbient=function(){
  if(!masterUnlocked)return;
  masterSoundEnabled=!masterSoundEnabled;updateMasterAudioButton();
  if(masterSoundEnabled)startMasterAmbient();else stopMasterAmbient();
 };
 function closeMasterGate(){
  masterGate.hidden=true;
  $('masterGatePassword').value='';
  $('masterGateError').textContent='';
  masterBtn.focus();
 }
 function showMasterGate(){
  if(!masterGate.hidden)return;
  masterGate.hidden=false;
  $('masterGatePassword').value='';
  $('masterGateError').textContent='';
  $('masterGatePassword').focus();
 }
 $('masterGateCancel').addEventListener('click',closeMasterGate);
 masterGate.addEventListener('click',e=>{if(e.target===masterGate)closeMasterGate()});
 masterGate.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();closeMasterGate();return}
  if(e.key==='Tab'){
   const els=[...masterGate.querySelectorAll('input,button')].filter(el=>!el.disabled);
   if(!els.length)return;
   if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els[els.length-1].focus()}
   else if(!e.shiftKey&&document.activeElement===els[els.length-1]){e.preventDefault();els[0].focus()}
  }
 });
 const originalView=view;
 function openMasterView(){
  masterUnlocked=true;
  originalView('mestre');
  $('title').textContent='Painel do Mestre';
  renderMaster();
  startMasterAmbient();
  updateMasterAudioButton();
 }
 view=function(page){
  if(page==='mestre'){if(masterUnlocked)openMasterView();else showMasterGate();return}
  masterUnlocked=false;stopMasterAmbient();
  originalView(page);
 };
 $('masterGateForm').addEventListener('submit',e=>{
  e.preventDefault();
  const input=$('masterGatePassword'),error=$('masterGateError');
  if(input.value!==MASTER_PASSWORD){error.textContent='Código incorreto. O Vazio permanece fechado.';input.value='';input.focus();return}
  masterGate.hidden=true;input.value='';error.textContent='';
  openMasterView();
 });
 masterBtn.addEventListener('click',()=>view('mestre'));
 window.lockMasterPanel=function(){
  masterUnlocked=false;stopMasterAmbient();
  view('home');
  say('Painel do Mestre bloqueado.');
 };
 $('masterAgent').addEventListener('change',renderMaster);
 $('masterKind').addEventListener('change',renderMaster);
 $('masterPEAgent').addEventListener('change',renderMaster);

 function isPower(h){return ['Ritual','Habilidade','Poder'].includes(h.kind)||/CONJURADO|SELO CRIADO|HABILIDADE/i.test(h.status||'')}
 function renderMaster(){
  if(!masterUnlocked)return;
  const peSelect=$('masterPEAgent');
  if(peSelect){
   const previous=peSelect.value;
   peSelect.innerHTML=agents.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')||'<option value="">Nenhum agente cadastrado</option>';
   peSelect.value=agents.some(c=>c.id===previous)?previous:(current()?.id||'');
   const selectedAgent=agents.find(c=>c.id===peSelect.value);
   const status=$('masterPEStatus');
   if(status)status.innerHTML=selectedAgent?
    '<span><strong>'+esc(selectedAgent.peNow??0)+'</strong> / '+stats(selectedAgent).pe+' PE atuais</span><span><strong>'+(+selectedAgent.peSpentTurn||0)+'</strong> / '+peLimitFor(selectedAgent)+' gasto no turno</span><span><strong>'+(+selectedAgent.peTemp||0)+'</strong> PE temporários</span>':
    '<span>Cadastre um agente para controlar seus PE.</span>';
   document.querySelectorAll('.master-pe-buttons button').forEach(button=>button.disabled=!selectedAgent);
  }
  const sel=$('masterAgent'),old=sel.value;sel.innerHTML='<option value="todos">Todos os agentes</option>'+agents.map(c=>'<option value="'+esc(c.name)+'">'+esc(c.name)+'</option>').join('');
  if([...sel.options].some(o=>o.value===old))sel.value=old;
  const all=hist.filter(h=>sel.value==='todos'||h.agent===sel.value);
  const power=all.filter(isPower);
  const mode=$('masterKind').value;
  const rows=all.filter(h=>mode==='poderes'?isPower(h):mode==='testes'?!isPower(h):true);
  $('masterSummary').innerHTML='<div class="master-stat"><small>AGENTES</small><b>'+agents.length+'</b></div><div class="master-stat"><small>REGISTROS</small><b>'+all.length+'</b></div><div class="master-stat"><small>PODERES / RITUAIS</small><b>'+power.length+'</b></div>';
  $('masterLog').innerHTML=rows.map(h=>'<article class="master-entry"><div><strong>'+esc(h.agent||'Agente')+'</strong><span class="master-kind">'+esc(h.kind||'Ação')+'</span><div class="master-label">'+esc(h.label||'Ação')+'</div><small>'+esc(h.detail||'')+'</small></div><time>'+esc(h.time||'')+'</time></article>').join('')||'<div class="empty">Nenhuma atividade neste filtro.</div>';
  if(window.OPAccounts?.authenticated)window.OPAccounts.renderMasterRoster();
  if(window.OPAccounts?.authenticated)window.OPAccounts.renderSamurais();
 }

 let skillHudFilter='trained';
 let skillHudQuery='';
 const skillHudCombat=['Luta','Pontaria','Iniciativa','Reflexos','Fortitude','Vontade','Atletismo','Acrobacia'];
 function renderSkillHudList(){
  const c=current(),list=$('sheetSkillsList');if(!c||!list)return;
  const query=skillHudQuery.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let overload=false;try{overload=capacityInfo(c).overloaded}catch(e){}
  const rows=SK.filter(([name])=>{
   if(skillHudFilter==='trained'&&rank(c,name)===0)return false;
   if(skillHudFilter==='combat'&&!skillHudCombat.includes(name))return false;
   if(query&&!name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query))return false;
   return true;
  });
  const icons={agi:'◈',for:'✦',int:'✧',pre:'✷',vig:'❖'};
  const trainLabels=['Destreinada','Treinada','Veterana','Expert'];
  list.innerHTML=rows.map(([name,attr,required,load])=>{
   const training=rank(c,name),penalty=overload&&!!load?5:0,bonus=sb(training)-penalty;
   const bonusLabel=bonus>=0?'+'+bonus:'−'+Math.abs(bonus);
   const status=training?trainLabels[Math.min(training,3)]:(required?'Exige treino':'Destreinada');
   const state=training?' is-trained':required?' is-required':'';
   return '<button type="button" class="skill-hud-item'+state+'" data-agent="'+esc(c.id)+'" data-skill="'+esc(name)+'" data-attr="'+attr+'" onclick="rollCharacterSkill(this.dataset.agent,this.dataset.skill)" aria-label="Rolar '+esc(name)+', '+esc(AN[attr])+', bônus '+bonusLabel+'"><span class="skill-hud-icon" aria-hidden="true">'+icons[attr]+'</span><span class="skill-hud-info"><strong>'+esc(name)+'</strong><small>'+esc(status)+(penalty?' · Sobrecarga −5':'')+'</small></span><span class="skill-hud-attribute">'+attr.toUpperCase()+'</span><span class="skill-hud-bonus">'+bonusLabel+'</span><span class="skill-hud-roll" aria-hidden="true">⚄</span></button>';
  }).join('')||'<div class="skill-hud-empty">Nenhuma perícia encontrada. Experimente outro filtro.</div>';
  const shown=$('skillHudShown');if(shown)shown.textContent=rows.length+' de '+SK.length+' perícias';
  document.querySelectorAll('[data-skill-filter]').forEach(button=>{const active=button.dataset.skillFilter===skillHudFilter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
 }
 window.sheetSkillHudFilter=function(filter){if(!['trained','all','combat'].includes(filter))return;skillHudFilter=filter;renderSkillHudList()};
 window.sheetSkillHudSearch=function(value){skillHudQuery=String(value||'');renderSkillHudList()};

 const sheetPowerCatalog=(()=>{
  const entries=[];
  for(const [cls,items] of Object.entries(CLASS_POWERS)){
   for(const item of items)entries.push({name:item[0],description:item[1],category:'class',group:'Classe • '+className(cls),class:cls});
  }
  for(const item of PARA_POWERS)entries.push({name:item[0],description:item[2],category:'paranormal',group:'Paranormal • '+item[1],element:item[1]});
  for(const record of ORIGINS){if(record.power)entries.push({name:record.power,description:record.desc||'',category:'origin',group:'Origem • '+record.name});}
  for(const [cls,trails] of Object.entries(TRAILS)){
   for(const [trail,items] of Object.entries(trails)){
    for(const item of items)entries.push({name:item[1],description:item[2],category:'trail',group:'Trilha • '+trail,class:cls,trail});
   }
  }
  return entries;
 })();
 function sheetPowerStore(c){return Array.isArray(c?.sheetPowers)?c.sheetPowers:[]}
 function sheetPowerNames(c){
  const names=[...(c.powers?.class||[]),...(c.powers?.paranormal||[])];
  const origin=ORIGINS.find(x=>x.name===c.origin);if(origin?.power)names.push(origin.power);
  (TRAILS[c.class]?.[c.trail]||[]).forEach(([n,name])=>{if((+c.nex||0)>=n)names.push(name)});
  sheetPowerStore(c).forEach(p=>names.push(p.name));
  return new Set(names.filter(Boolean).map(x=>String(x).toLocaleLowerCase('pt-BR')));
 }
 function sheetPowerCatalogOptions(c){
  const used=sheetPowerNames(c),groups=new Map();
  for(let i=0;i<sheetPowerCatalog.length;i++){
   const p=sheetPowerCatalog[i];
   if(used.has(String(p.name).toLocaleLowerCase('pt-BR')))continue;
   const group=p.category==='class'&&p.class===c.class?'Sua classe • '+className(c.class):p.group;
   if(!groups.has(group))groups.set(group,[]);
   groups.get(group).push('<option value="'+i+'">'+esc(p.name)+'</option>');
  }
  if(!groups.size)return '<option value="">Nenhum poder disponível</option>';
  const rankGroup=label=>label.startsWith('Sua classe')?0:label.startsWith('Paranormal')?1:label.startsWith('Trilha')?2:label.startsWith('Origem')?3:4;
  return [...groups].sort((a,b)=>rankGroup(a[0])-rankGroup(b[0])||a[0].localeCompare(b[0],'pt-BR')).map(([label,options])=>'<optgroup label="'+esc(label)+'">'+options.join('')+'</optgroup>').join('');
 }
 function sheetPowerCard(c,p,fromSheet=false){
  const native=fromSheet&&peActionList(c).some(a=>a.name===p.name);
  const label=fromSheet?(p.source==='custom'?'PERSONALIZADO':'ADICIONADO'):p.category||'PODER';
  const cost=fromSheet&&p.activation?(+p.cost||0)+' PE':'';
  const key='sp-'+p.id;
  const used=fromSheet&&p.activation&&((p.limit==='turn'&&(c.peRoundUsed||[]).includes(key))||(p.limit==='scene'&&(c.peSceneUsed||[]).includes(key)));
  const btn=fromSheet&&p.activation?(native?'<button class="btn small" type="button" onclick="document.getElementById(&quot;sheetPEBlock&quot;)?.scrollIntoView({behavior:&quot;smooth&quot;,block:&quot;start&quot;})">Ir para PE</button>':'<button type="button" class="btn small primary" data-power="'+esc(p.id)+'" onclick="sheetActivatePower(this.dataset.power)" '+(used?'disabled':'')+'>'+(used?'Utilizado':'Usar')+'</button>'):'';
  const actions=fromSheet?'<div class="sheet-power-actions">'+btn+(p.source==='custom'?'<button type="button" class="btn small" data-power="'+esc(p.id)+'" onclick="sheetEditCustomPower(this.dataset.power)">Editar</button>':'')+'<button type="button" class="sheet-remove" title="Remover poder adicionado" aria-label="Remover '+esc(p.name)+'" data-power="'+esc(p.id)+'" onclick="sheetDeletePower(this.dataset.power)">✕</button></div>':'';
  return '<article class="sheet-power-card '+(fromSheet?'is-added':'is-natural')+'"><div class="sheet-power-card-top"><span class="sheet-power-glyph" aria-hidden="true">✦</span><div class="sheet-power-card-heading"><strong>'+esc(p.name)+'</strong><small>'+esc(label)+(cost?' • '+cost:'')+(fromSheet&&p.activation?' • '+(p.limit==='turn'?'1 por turno':p.limit==='scene'?'1 por cena':'uso livre'):'')+'</small></div>'+actions+'</div>'+(p.description?'<p>'+esc(p.description)+'</p>':'')+'</article>';
 }

 const attributeEditorStats=[
  ['agi','AGI','Agilidade','◈'],
  ['for','FOR','Força','✦'],
  ['int','INT','Intelecto','✧'],
  ['pre','PRE','Presença','✷'],
  ['vig','VIG','Vigor','❖']
 ];
 let attributeDraft=null,attributeStart=null,attributeEditingId=null,attributeReturnFocus=null;
 function sheetAttributeEditor(){
  let overlay=$('sheetAttributeModal');
  if(overlay)return overlay;
  overlay=document.createElement('div');
  overlay.className='sheet-attribute-modal';
  overlay.id='sheetAttributeModal';
  overlay.hidden=true;
  overlay.innerHTML='<section class="sheet-attribute-dialog" role="dialog" aria-modal="true" aria-labelledby="sheetAttributeEditorTitle" aria-describedby="sheetAttributeHelp">'
   +'<header class="sheet-attribute-dialog-head"><div class="sheet-attribute-headline"><span aria-hidden="true" class="sheet-attribute-head-icon">✧</span><div><small>AJUSTES DA CAMPANHA</small><h2 id="sheetAttributeEditorTitle">Editar atributos</h2></div></div><button type="button" class="sheet-attribute-close" aria-label="Fechar editor de atributos" onclick="sheetCloseAttributeEditor()">✕</button></header>'
   +'<p id="sheetAttributeHelp" class="sheet-attribute-help">Use − e + para alterar os valores dos atributos. O ajuste é adicional à progressão de NEX, salvo na ficha e utilizado em todos os testes.</p>'
   +'<div class="sheet-attribute-rows">'
   +attributeEditorStats.map(([key,short,name,icon])=>'<div class="sheet-attribute-row" data-edit-attribute="'+key+'"><span class="sheet-attribute-row-icon" aria-hidden="true">'+icon+'</span><div class="sheet-attribute-label"><strong>'+name+'</strong><small>'+short+'</small></div><div class="sheet-attribute-stepper"><button type="button" data-key="'+key+'" onclick="sheetShiftAttribute(this.dataset.key,-1)" aria-label="Diminuir '+name+'">−</button><output id="sheetDraft-'+key+'" aria-label="Valor de '+name+'">0</output><button type="button" data-key="'+key+'" onclick="sheetShiftAttribute(this.dataset.key,1)" aria-label="Aumentar '+name+'">+</button></div></div>').join('')
   +'</div>'
   +'<div class="sheet-attribute-note"><span id="sheetAttributeDelta" aria-live="polite">Nenhuma alteração</span><small>Valores de 0 a 10 • ajustes além do limite normal são opcionais da mesa.</small></div>'
   +'<footer class="sheet-attribute-actions"><button type="button" class="sheet-attribute-cancel" onclick="sheetCloseAttributeEditor()">Cancelar</button><button type="button" class="sheet-attribute-save" onclick="sheetSaveAttributes()">Salvar alterações</button></footer>'
   +'</section>';
  overlay.addEventListener('click',e=>{if(e.target===overlay)window.sheetCloseAttributeEditor()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();window.sheetCloseAttributeEditor()}});
  document.body.appendChild(overlay);
  return overlay;
 }
 function sheetRefreshAttributeDraft(){
  if(!attributeDraft||!attributeStart)return;
  let net=0,changed=0;
  for(const [key] of attributeEditorStats){
   const value=attributeDraft[key]??0,element=$('sheetDraft-'+key);
   if(element)element.textContent=value;
   const row=document.querySelector('.sheet-attribute-modal [data-edit-attribute="'+key+'"]');
   const buttons=row?.querySelectorAll('button')||[];
   if(buttons[0])buttons[0].disabled=value<=0;
   if(buttons[1])buttons[1].disabled=value>=10;
   const diff=value-(attributeStart[key]||0);net+=diff;
   if(diff!==0)changed++;
   row?.classList.toggle('has-change',diff!==0);
  }
  const meter=$('sheetAttributeDelta');
  if(meter)meter.textContent=changed===0?'Nenhuma alteração':(net>0?'+':'')+net+' pontos no total • '+changed+' atributo(s) alterado(s)';
 }
 window.sheetOpenAttributeEditor=function(){
  const c=current();if(!c){say('Selecione um agente antes de editar atributos.');return}
  const overlay=sheetAttributeEditor();
  attributeEditingId=c.id;
  attributeStart=Object.fromEntries(attributeEditorStats.map(([key])=>[key,Math.max(0,Math.min(10,Math.round(+c.attrs[key]||0)))]));
  attributeDraft={...attributeStart};
  attributeReturnFocus=document.activeElement;
  overlay.hidden=false;
  document.body.classList.add('sheet-attribute-editor-open');
  sheetRefreshAttributeDraft();
  overlay.querySelector('.sheet-attribute-close')?.focus();
 };
 window.sheetCloseAttributeEditor=function(){
  const overlay=$('sheetAttributeModal');if(overlay)overlay.hidden=true;
  document.body.classList.remove('sheet-attribute-editor-open');
  attributeDraft=null;attributeStart=null;attributeEditingId=null;
  if(attributeReturnFocus?.isConnected)attributeReturnFocus.focus();
  attributeReturnFocus=null;
 };
 window.sheetShiftAttribute=function(key,change){
  if(!attributeDraft||!attributeEditorStats.some(row=>row[0]===key))return;
  const next=Math.max(0,Math.min(10,(+attributeDraft[key]||0)+Math.sign(change)));
  attributeDraft[key]=next;
  sheetRefreshAttributeDraft();
 };
 window.sheetSaveAttributes=function(){
  const c=current();if(!c||!attributeDraft||!attributeStart||c.id!==attributeEditingId){
   say('Não foi possível salvar: agente não selecionado.');window.sheetCloseAttributeEditor();return
  }
  const changes=[];
  const bonuses={...(c.manualAttributeBonuses||{})};
  for(const [key,short,name] of attributeEditorStats){
   const before=+c.attrs[key]||0,after=+attributeDraft[key]||0;
   if(before===after)continue;
   bonuses[key]=(+bonuses[key]||0)+(after-before);
   c.attrs[key]=after;
   changes.push(name+': '+before+' → '+after);
  }
  if(!changes.length){window.sheetCloseAttributeEditor();say('Nenhuma alteração nos atributos.');return}
  c.manualAttributeBonuses=bonuses;
  const newMaximum=stats(c);
  for(const [field,max] of [['pvNow','pv'],['peNow','pe'],['sanNow','san']]){
   const value=Number(c[field]);
   c[field]=Number.isFinite(value)?Math.max(0,Math.min(newMaximum[max],value)):newMaximum[max];
  }
  addHist({agent:c.name,label:'Atributos ajustados',detail:changes.join(' • '),total:null,dt:null,passed:null,status:'EDITADO',kind:'Atributo'});
  window.sheetCloseAttributeEditor();
  render();
  document.querySelector('.paper-attributes-heading .paper-attribute-edit')?.focus();
  say('Atributos atualizados e salvos na ficha.');
 };
 function renderPaper(){
  const el=$('agentDetail'),c=current();if(!el||!c)return;
  const original=el.innerHTML;
  const st=stats(c),attr=[['agi','AGI','Agilidade'],['for','FOR','Força'],['int','INT','Intelecto'],['pre','PRE','Presença'],['vig','VIG','Vigor']];
  const attrHtml=attr.map(([key,short,name])=>'<button class="paper-attr paper-'+key+'" onclick="rollCharacterAttribute(\''+esc(c.id)+'\',\''+key+'\')" title="Rolar '+name+'"><small>'+name+'</small><strong>'+short+'</strong><b>'+esc(c.attrs[key])+'</b></button>').join('');
  const trainedCount=SK.filter(([name])=>rank(c,name)>0).length;
  const skillHudHtml='<section class="skill-hud" aria-label="Painel de perícias do agente">'
   +'<header class="skill-hud-header"><div class="skill-hud-heading"><span class="skill-hud-sigil" aria-hidden="true">✧</span><div><span class="skill-hud-kicker">TERMINAL DE TESTES</span><h3>PERÍCIAS</h3></div></div><div class="skill-hud-score"><strong>'+trainedCount+'</strong><span>/ '+SK.length+'<small>TREINADAS</small></span></div></header>'
   +'<div class="skill-hud-toolbar"><label class="skill-hud-search"><span aria-hidden="true">⌕</span><input type="search" id="skillHudSearch" placeholder="Buscar perícia..." autocomplete="off" value="'+esc(skillHudQuery)+'" aria-label="Buscar perícia" oninput="sheetSkillHudSearch(this.value)"></label><div class="skill-hud-filters" role="group" aria-label="Filtrar perícias"><button type="button" data-skill-filter="trained" onclick="sheetSkillHudFilter(\'trained\')">Treinadas</button><button type="button" data-skill-filter="all" onclick="sheetSkillHudFilter(\'all\')">Todas</button><button type="button" data-skill-filter="combat" onclick="sheetSkillHudFilter(\'combat\')">Combate</button></div></div>'
   +'<div class="skill-hud-legend"><span><i class="skill-hud-dot"></i> Treinamento</span><span>ATR · BÔNUS</span></div><div class="skill-hud-entries" id="sheetSkillsList" aria-live="polite"></div><footer class="skill-hud-footer"><span id="skillHudShown">—</span><span>⚄ Clique para rolar</span></footer></section>';
  const resource=(key,name,now,max)=>{
    const symbols={pv:'♥',pe:'✦',san:'◉',def:'⛨'};
    const currentValue=Math.max(0,Number(now)||0);
    const maximum=Math.max(0,Number(max)||0);
    const percent=maximum>0?Math.min(100,Math.max(0,Math.round(currentValue/maximum*100))):0;
    const isDefense=key==='def';
    const tempPE=key==='pe'&&(+c.peTemp||0)>0?'<span class="sheet-resource-temp">+'+esc(c.peTemp)+' PE temporários</span>':'';
    const meter=isDefense?'':'<div class="sheet-resource-meter" role="progressbar" aria-label="'+esc(name)+'" aria-valuemin="0" aria-valuemax="'+maximum+'" aria-valuenow="'+Math.min(currentValue,maximum)+'"><span style="width:'+percent+'%"></span></div>';
    const controls=isDefense?'':'<div class="paper-resource-controls"><label class="resource-amount-label" for="resource-amount-'+esc(c.id)+'-'+key+'">Quantidade a ajustar em '+esc(name)+'</label><button type="button" class="btn sheet-resource-btn" data-agent="'+esc(c.id)+'" data-resource="'+key+'" onclick="adjustAgentResource(this.dataset.agent,this.dataset.resource,-1)" aria-label="Diminuir '+esc(name)+'">−</button><input id="resource-amount-'+esc(c.id)+'-'+key+'" type="number" min="1" max="999" step="1" value="1" inputmode="numeric" aria-label="Quantidade para ajustar '+esc(name)+'"><button type="button" class="btn primary sheet-resource-btn" data-agent="'+esc(c.id)+'" data-resource="'+key+'" onclick="adjustAgentResource(this.dataset.agent,this.dataset.resource,1)" aria-label="Aumentar '+esc(name)+'">+</button></div>';
    return '<section class="paper-resource paper-resource-'+key+'"><div class="sheet-resource-top"><span class="sheet-resource-icon" aria-hidden="true">'+symbols[key]+'</span><small>'+esc(name)+'</small>'+(isDefense?'<span class="sheet-resource-suffix">BASE</span>':'')+'</div><div class="sheet-resource-reading"><strong>'+esc(now)+'</strong>'+(isDefense?'':'<em>/ '+esc(max)+'</em>')+'</div>'+tempPE+meter+controls+'</section>';
  };
  const powers=[...(c.powers?.class||[]).filter(Boolean).map(name=>({name,category:'Classe',description:CLASS_POWERS[c.class]?.find(p=>p[0]===name)?.[1]||''})),...(c.powers?.paranormal||[]).filter(Boolean).map(name=>({name,category:'Paranormal',description:PARA_POWERS.find(p=>p[0]===name)?.[2]||''}))];
  const originPower=ORIGINS.find(o=>o.name===c.origin);
  if(originPower?.power&&!powers.some(p=>p.name===originPower.power))powers.push({name:originPower.power,category:'Origem',description:originPower.desc||''});
  for(const [level,name,description] of (TRAILS[c.class]?.[c.trail]||[])){
   if((+c.nex||0)>=level&&!powers.some(p=>p.name===name))powers.push({name,description,category:'Trilha '+level+'%'});
  }
  const grantedPowers=sheetPowerStore(c);
  const rituals=(c.powers?.rituals||[]).map(entry=>{const parts=String(entry).split('|');return {name:parts[0],element:parts[1]||'Paranormal',circle:parts[2]||'1'}});
  const inventory=Array.isArray(c.inventory)?c.inventory:[];
  const powerHtml=[...powers.map(p=>sheetPowerCard(c,p)),...grantedPowers.map(p=>sheetPowerCard(c,p,true))].join('')||'<p class="sheet-empty">Nenhum poder registrado.</p>';
  const powerEditorHtml='<div class="sheet-power-editors">'
  +'<details class="sheet-power-form" id="sheetAddExistingPower"><summary>＋ Adicionar poder existente</summary><div class="sheet-power-form-body"><label>Poder do catálogo<select id="sheetKnownPowerSelect" aria-label="Escolher poder existente"></select></label><div class="sheet-power-inline"><label>Tipo<select id="sheetKnownPowerActivation"><option value="passive">Passivo / referência</option><option value="active">Ativável</option></select></label><label>Custo de PE<input id="sheetKnownPowerCost" type="number" min="0" max="99" step="1" value="0"></label></div><button type="button" class="btn small primary" onclick="sheetAddKnownPower()">Adicionar à ficha</button><small class="sheet-power-note">Concessão manual da mesa: não ocupa marcos de NEX. Efeitos passivos e pré-requisitos devem ser conferidos com o mestre; habilidades de PE existentes usam o custo automático do sistema.</small></div></details>'
  +'<details class="sheet-power-form" id="sheetCustomPowerPanel"><summary>✧ Criar poder personalizado</summary><div class="sheet-power-form-body"><input id="sheetPowerEditId" type="hidden"><label>Nome<input type="text" id="sheetCustomPowerName" maxlength="65" placeholder="Nome do poder"></label><label>Descrição<textarea id="sheetCustomPowerDescription" maxlength="600" rows="3" placeholder="Descreva como funciona na campanha..."></textarea></label><div class="sheet-power-inline"><label>Tipo<select id="sheetCustomPowerActivation"><option value="passive">Passivo</option><option value="active">Ativável</option></select></label><label>Custo PE<input id="sheetCustomPowerCost" type="number" min="0" max="99" step="1" value="0"></label><label>Limite<select id="sheetCustomPowerLimit"><option value="none">Sem limite</option><option value="turn">1 por turno</option><option value="scene">1 por cena</option></select></label></div><div class="sheet-power-form-actions"><button type="button" class="btn small primary" id="sheetCustomPowerSave" onclick="sheetSaveCustomPower()">Salvar poder</button><button type="button" class="btn small" onclick="sheetResetCustomPower()">Limpar</button></div><small class="sheet-power-note">Poderes personalizados são regras da sua campanha. O custo é descontado automaticamente ao usar.</small></div></details></div>';
  const peActions=peActionList(c);
  const peHtml=peActions.length?peActions.map(a=>{
   const max=Math.max(a.min,Math.min(a.max,peLimitFor(c,a.kind)));
   const spent=(+c.peSpentTurn||0),available=(+c.peNow||0)+(+c.peTemp||0);
   const blocked=(a.onceScene&&(c.peSceneUsed||[]).includes(a.id))||(a.onceTurn&&(c.peRoundUsed||[]).includes(a.id));
   let input='';
   if(a.mode==='cost'&&max>a.min)input='<label>PE <input type="number" id="sheet-pe-'+esc(a.id)+'" min="'+a.min+'" max="'+max+'" step="'+a.step+'" value="'+a.min+'"></label>';
   else if(a.mode==='units')input='<label>'+esc(a.unit)+' <input type="number" id="sheet-pe-'+esc(a.id)+'" min="1" max="'+Math.max(1,Math.floor(max/a.unitCost))+'" value="1"></label>';
   else if(a.mode==='category')input='<label>Categoria <input type="number" id="sheet-pe-'+esc(a.id)+'" min="'+(a.minCategory||0)+'" max="4" value="'+(a.minCategory||0)+'"></label>';
   return '<article class="sheet-pe-action"><div><strong>'+esc(a.name)+'</strong><small>'+esc(a.desc)+'</small><em>'+(a.mode==='fixed'?a.min+' PE':a.mode==='trigger'?'Custo crescente • inicial 2 PE':'Custo variável')+'</em></div><div class="sheet-pe-controls">'+input+'<button class="btn small primary" onclick="sheetUsePE(\''+esc(a.id)+'\')" '+(blocked?'disabled title="Já utilizado neste turno ou cena"':'')+'>'+(blocked?'Utilizado':'Usar')+'</button></div></article>';
  }).join(''):'<p class="sheet-empty">Nenhuma habilidade com gasto de PE disponível.</p>';
  const ritualHtml=rituals.length?rituals.map((r,i)=>'<div class="sheet-entry"><span class="sheet-symbol">◈</span><div><strong>'+esc(r.name)+'</strong><small>'+esc(r.element)+' • '+esc(r.circle)+'º círculo</small></div><button class="btn small" onclick="view(\'grimorio\')">Conjurar</button><button class="sheet-remove" title="Esquecer ritual" onclick="sheetRemoveRitual('+i+')">✕</button></div>').join(''):'<p class="sheet-empty">Nenhum ritual conhecido.</p>';
  const invHtml=inventory.length?inventory.map(it=>'<div class="sheet-entry"><span class="sheet-symbol">'+(it.weapon?'⚔':'▣')+'</span><strong>'+esc(it.name||'Item')+'</strong><button class="sheet-qty" title="Diminuir quantidade" onclick="adjustInventoryQty(\''+esc(it.id)+'\',-1)">−</button><small>×'+esc(it.qty||1)+'</small><button class="sheet-qty" title="Aumentar quantidade" onclick="adjustInventoryQty(\''+esc(it.id)+'\',1)">+</button><button class="sheet-remove" title="Remover item" onclick="sheetRemoveItem(\''+esc(it.id)+'\')">✕</button></div>').join(''):'<p class="sheet-empty">Inventário vazio.</p>';
  const weapons=inventory.filter(it=>it.weapon);
  const combatHtml=weapons.length?weapons.map(it=>{const profile=weaponProfileFor(it);return '<button class="sheet-weapon" onclick="sheetRollWeapon(\''+esc(it.id)+'\')"><span>⚔</span><span><strong>'+esc(it.name)+'</strong><small>'+(profile?esc(profile.damage)+' • '+esc(profile.skill):it.sheetDamage?esc(it.sheetDamage)+' • '+esc(it.sheetSkill||'Luta'):'Clique para configurar dano')+'</small></span><b>ROLAR DADOS ⚄</b></button>'}).join(''):'<p class="sheet-empty">Adicione uma arma ao inventário para habilitar os ataques.</p>';
  el.innerHTML='<div class="paper-sheet paper-v2 '+(c.samuraiSlug?'paper-samurai':'')+'" style="--samurai-color:'+(c.samuraiSlug?(window.OPAccounts?.selectedSamuraiColor(c.id)||'#b48e69'):'#b48e69')+'"><div class="sheet-ornament" aria-hidden="true">✿　✦　鳥居　✦　✿</div><div class="paper-head"><div><small>'+(c.samuraiSlug?'OS CINCO SAMURAIS • FICHA ATRIBUÍDA':'ORDEM PARANORMAL • FICHA DE AGENTE')+'</small><h2>'+esc(c.name)+'</h2><p>'+esc(c.origin||'Origem não definida')+' • '+esc(className(c.class))+'</p></div><div class="paper-nex">NEX <strong>'+esc(c.nex||0)+'%</strong></div></div><div class="paper-columns"><div><div class="paper-caption paper-attributes-heading"><span>ATRIBUTOS</span><small>CLIQUE PARA ROLAR</small><button type="button" class="paper-attribute-edit" title="Editar atributos e adicionar pontos" aria-label="Editar atributos e adicionar pontos" onclick="sheetOpenAttributeEditor()"><span aria-hidden="true">✎</span><i aria-hidden="true">+</i></button></div><div class="paper-attributes"><div class="paper-core">✣<span>ATRIBUTOS</span></div>'+attrHtml+'</div><div class="paper-resources">'+resource('pv','PONTOS DE VIDA',c.pvNow,st.pv)+resource('pe','PONTOS DE ESFORÇO',(+c.peNow||0)+(+c.peTemp||0),st.pe)+resource('san','SANIDADE',c.sanNow,st.san)+resource('def','DEFESA BASE',10+(+c.attrs.agi||0),null)+'</div><div class="paper-shortcuts"><button class="btn small" onclick="openModal(\''+esc(c.id)+'\')">Editar ficha</button></div></div><div>'+skillHudHtml+'</div></div><div class="sheet-pe-overview"><span>PE DISPONÍVEL <b>'+((+c.peNow||0)+(+c.peTemp||0))+'</b></span><span>GASTO NO TURNO <b>'+(+c.peSpentTurn||0)+'</b> / '+peLimitFor(c)+'</span></div><div class="sheet-pe-rest-controls" aria-label="Reiniciar e recuperar PE"><span class="sheet-pe-rest-title">◈ CONTROLE DE PE <small>Novo turno libera o limite; Recuperar PE restaura a reserva atual.</small></span><div><button type="button" class="btn small" data-agent="'+esc(c.id)+'" onclick="sheetNewPETurn(this.dataset.agent)">↻ Novo turno</button><button type="button" class="btn small" data-agent="'+esc(c.id)+'" onclick="sheetFinishPEScene(this.dataset.agent)">◌ Encerrar cena</button><button type="button" class="btn small primary" data-agent="'+esc(c.id)+'" onclick="sheetRefillPE(this.dataset.agent)">✚ Recuperar PE</button></div></div><section class="sheet-block sheet-pe-block" id="sheetPEBlock"><h3>✧ HABILIDADES COM CUSTO DE PE <small>'+peActions.length+'</small></h3><div class="sheet-pe-list">'+peHtml+'</div></section><div class="sheet-lower"><section class="sheet-block sheet-powers-block"><h3>✦ PODERES & HABILIDADES <small>'+(powers.length+grantedPowers.length)+'</small></h3><div class="sheet-scroll sheet-powers-list">'+powerHtml+'</div>'+powerEditorHtml+'</section><section class="sheet-block"><h3>◈ RITUAIS <small>'+rituals.length+'</small></h3><div class="sheet-scroll">'+ritualHtml+'</div><div class="sheet-add"><select id="sheetRitualChoice" aria-label="Ritual para aprender"></select><button class="btn small primary" onclick="sheetLearnRitual()">+ Aprender</button></div></section><section class="sheet-block"><h3>▣ EQUIPAMENTO & INVENTÁRIO <small>'+inventory.length+'</small></h3><div class="sheet-scroll">'+invHtml+'</div><div class="sheet-add"><select id="sheetItemPreset" aria-label="Modelo de equipamento" onchange="sheetSelectPreset(this.value)"><option value="">Item personalizado</option></select><input id="sheetItemName" placeholder="Nome do equipamento" maxlength="100" aria-label="Nome do equipamento"><input id="sheetItemQty" type="number" min="1" max="999" value="1" aria-label="Quantidade"><label class="sheet-weapon-check"><input id="sheetItemWeapon" type="checkbox"> Arma</label><button class="btn small primary" onclick="sheetAddItem()">+ Adicionar</button></div></section><section class="sheet-block"><h3>⚔ ATAQUES & COMBATE <small>'+weapons.length+'</small></h3><div class="sheet-scroll">'+combatHtml+'</div><div class="sheet-add"><label class="sheet-defense">Defesa do alvo <input id="sheetTargetDefense" type="number" min="0" max="999" value="15"></label><label class="sheet-defense">Distância <select id="sheetTargetRange"><option value="curto">Curto</option><option value="medio">Médio</option><option value="longo">Longo</option><option value="extremo">Extremo</option></select></label></div><div id="sheetCombatResult" class="sheet-combat-result" aria-live="polite"></div></section></div><div class="paper-bottom">A MALDIÇÃO DOS SETE ANJOS <span>REGISTRO PARANORMAL</span></div></div><details class="paper-technical"><summary>Ficha técnica, controles e informações adicionais</summary><div class="paper-original">'+original+'</div></details>';
  const powerSelect=$('sheetKnownPowerSelect');
  if(powerSelect)powerSelect.innerHTML=sheetPowerCatalogOptions(c);
  const presetSelect=$('sheetItemPreset');if(presetSelect)presetSelect.innerHTML='<option value="">Item personalizado</option>'+INVENTORY_PRESETS.map((p,i)=>'<option value="'+i+'">'+esc(p.name)+'</option>').join('');
  const ritualSelect=$('sheetRitualChoice');
  if(ritualSelect){const known=c.powers?.rituals||[],slots=ritualSlotCount(c.class,c.nex,c.trail,c.powers?.paranormal||[],c.attrs.int),eligible=known.length<slots?availableRitualsFor(c).filter(r=>!known.includes(ritualValue(r))):[];ritualSelect.innerHTML=eligible.map(r=>'<option value="'+esc(ritualValue(r))+'">'+esc(r[0])+' • '+r[1]+'º círculo</option>').join('')||'<option value="">Sem rituais disponíveis</option>'}
  renderSkillHudList();
 }

 window.sheetAddKnownPower=function(){
  const c=current(),select=$('sheetKnownPowerSelect');
  if(!c||!select||select.value===''){say('Escolha um poder no catálogo.');return}
  const index=Number(select.value),power=sheetPowerCatalog[index];
  if(!power||!Number.isInteger(index)){say('Poder não encontrado.');return}
  if(sheetPowerNames(c).has(power.name.toLocaleLowerCase('pt-BR'))){say('Esse poder já está na ficha.');return}
  const value=$('sheetKnownPowerCost')?.value??'0',cost=Number(value);
  if(value.trim()===''||!Number.isInteger(cost)||cost<0||cost>99){say('Custo de PE deve ser um número inteiro de 0 a 99.');return}
  const activation=$('sheetKnownPowerActivation')?.value==='active';
  if(!activation&&cost>0){say('Para usar custo de PE, selecione o tipo Ativável.');return}
  const trial={...c,sheetPowers:[...sheetPowerStore(c),{source:'catalog',category:power.category,name:power.name}]};
  if(activation&&cost>0&&peActionList(trial).some(a=>a.name===power.name)){
   say('Esse poder já possui custo automático no sistema. Use custo 0 ou crie uma versão personalizada.');return;
  }
  c.sheetPowers=[...sheetPowerStore(c),{id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),name:power.name,description:power.description||'',source:'catalog',category:power.category,group:power.group,cost,activation,limit:'none'}];
  db();render();say('Poder adicionado: '+power.name+'.');
 };
 window.sheetResetCustomPower=function(){
  const form=$('sheetCustomPowerPanel');if(!form)return;
  for(const id of ['sheetPowerEditId','sheetCustomPowerName','sheetCustomPowerDescription']){const field=$(id);if(field)field.value=''}
  $('sheetCustomPowerCost').value='0';
  $('sheetCustomPowerActivation').value='passive';
  $('sheetCustomPowerLimit').value='none';
  $('sheetCustomPowerSave').textContent='Salvar poder';
 };
 window.sheetEditCustomPower=function(id){
  const c=current(),power=sheetPowerStore(c).find(p=>p.id===id&&p.source==='custom');
  if(!power)return;
  const form=$('sheetCustomPowerPanel');if(!form)return;
  form.open=true;
  $('sheetPowerEditId').value=power.id;
  $('sheetCustomPowerName').value=power.name;
  $('sheetCustomPowerDescription').value=power.description||'';
  $('sheetCustomPowerActivation').value=power.activation?'active':'passive';
  $('sheetCustomPowerCost').value=power.cost||0;
  $('sheetCustomPowerLimit').value=['turn','scene'].includes(power.limit)?power.limit:'none';
  $('sheetCustomPowerSave').textContent='Atualizar poder';
  form.scrollIntoView({behavior:'smooth',block:'nearest'});
  $('sheetCustomPowerName').focus();
 };
 window.sheetSaveCustomPower=function(){
  const c=current();if(!c)return;
  const name=$('sheetCustomPowerName')?.value.trim(),description=$('sheetCustomPowerDescription')?.value.trim()||'';
  const raw=$('sheetCustomPowerCost')?.value??'0',cost=Number(raw);
  const activation=$('sheetCustomPowerActivation')?.value==='active';
  const limit=$('sheetCustomPowerLimit')?.value||'none',id=$('sheetPowerEditId')?.value||'';
  if(!name||name.length>65){say('Preencha o nome do poder (até 65 caracteres).');return}
  if(description.length>600){say('A descrição deve ter até 600 caracteres.');return}
  if(raw.trim()===''||!Number.isInteger(cost)||cost<0||cost>99){say('O custo de PE deve ser um número inteiro de 0 a 99.');return}
  if(!activation&&cost>0){say('Para definir gasto de PE, escolha o tipo Ativável.');return}
  if(!['none','turn','scene'].includes(limit)){say('Limite de uso inválido.');return}
  const old=sheetPowerStore(c).find(p=>p.id===id&&p.source==='custom');
  if(id&&!old){say('Poder não encontrado para edição.');return}
  const duplicate=[...(c.powers?.class||[]),...(c.powers?.paranormal||[]),...sheetPowerStore(c).filter(p=>p.id!==id).map(p=>p.name)];
  if(duplicate.some(x=>String(x).toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))){say('Esse nome de poder já está sendo usado.');return}
  const record={id:id||'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),source:'custom',category:'Personalizado',name,description,cost,activation,limit};
  if(old)c.sheetPowers=sheetPowerStore(c).map(p=>p.id===id?record:p);
  else c.sheetPowers=[...sheetPowerStore(c),record];
  db();render();say(old?'Poder atualizado.':'Poder personalizado criado.');
 };
 window.sheetDeletePower=function(id){
  const c=current(),power=sheetPowerStore(c).find(p=>p.id===id);if(!c||!power)return;
  if(!confirm('Remover "'+power.name+'" da ficha?'))return;
  c.sheetPowers=sheetPowerStore(c).filter(p=>p.id!==id);
  const key='sp-'+id;
  c.peRoundUsed=(c.peRoundUsed||[]).filter(x=>x!==key);
  c.peSceneUsed=(c.peSceneUsed||[]).filter(x=>x!==key);
  db();render();say('Poder removido da ficha.');
 };
 window.sheetActivatePower=function(id){
  const c=current(),power=sheetPowerStore(c).find(p=>p.id===id);if(!power||!power.activation)return;
  const key='sp-'+power.id,cost=Number(power.cost)||0;
  if(power.limit==='turn'&&(c.peRoundUsed||[]).includes(key)){say('Esse poder já foi usado neste turno.');return}
  if(power.limit==='scene'&&(c.peSceneUsed||[]).includes(key)){say('Esse poder já foi usado nesta cena.');return}
  if(cost>0&&!consumePE(c,cost,{minCost:cost,kind:'general'}))return;
  if(power.limit==='turn')c.peRoundUsed=[...(c.peRoundUsed||[]),key];
  if(power.limit==='scene')c.peSceneUsed=[...(c.peSceneUsed||[]),key];
  db();
  addHist({agent:c.name,label:power.name,detail:cost?'−'+cost+' PE • Poder '+(power.source==='custom'?'personalizado':'adicional'):'Poder ativado • '+(power.source==='custom'?'personalizado':'adicional'),total:cost,dt:null,passed:null,status:cost?'PE GASTO':'ATIVADO',kind:'Poder'});
  render();say(power.name+' utilizado'+(cost?' • '+cost+' PE':'')+'.');
 };
 window.sheetLearnRitual=function(){const value=$('sheetRitualChoice')?.value,select=$('grimoireNewRitual');if(!value||!select){say('Nenhum ritual disponível.');return}select.value=value;addKnownRitualFromPage()};
 window.sheetRemoveRitual=function(index){const c=current();if(!c?.powers?.rituals?.[index])return;if(!confirm('Remover este ritual da ficha?'))return;c.powers.rituals.splice(index,1);db();render()};

 window.sheetNewPETurn=function(agentId){
  const c=agents.find(x=>x.id===agentId);if(!c)return;
  const spent=+c.peSpentTurn||0;
  newPETurn(agentId);
  addHist({agent:c.name,label:'Novo turno',detail:'Limite de PE do turno reiniciado (gasto anterior: '+spent+' PE). PE atuais não foram recuperados.',total:spent,dt:null,passed:null,status:'TURNO REINICIADO',kind:'Recursos'});
  if(masterUnlocked)renderMaster();
 };
 window.sheetFinishPEScene=function(agentId){
  const c=agents.find(x=>x.id===agentId);if(!c)return;
  if(!confirm('Encerrar a cena? Os usos por cena e por turno serão reiniciados, e os PE temporários serão removidos. Os PE normais não serão recuperados.'))return;
  const removed=+c.peTemp||0;
  endPEScene(agentId);
  addHist({agent:c.name,label:'Cena encerrada',detail:'Usos e limite reiniciados • PE temporários removidos: '+removed,total:removed,dt:null,passed:null,status:'CENA ENCERRADA',kind:'Recursos'});
  if(masterUnlocked)renderMaster();
 };
 window.sheetRefillPE=function(agentId){
  const c=agents.find(x=>x.id===agentId);if(!c)return;
  const maximum=Math.max(0,stats(c).pe),previous=Math.max(0,+c.peNow||0);
  if(previous>=maximum){say('Os PE normais desse agente já estão no máximo.');return}
  if(!confirm('Recuperar os PE normais de '+c.name+' até o máximo ('+maximum+')? O limite de gasto do turno continuará como está.'))return;
  c.peNow=maximum;
  db();
  addHist({agent:c.name,label:'PE recuperados',detail:'PE normais recuperados: '+previous+' → '+maximum+'. Limite do turno preservado.',total:maximum-previous,dt:null,passed:null,status:'PE RECUPERADO',kind:'Recursos'});
  render();
  say(c.name+': PE recuperados para '+maximum+'.');
 };
 window.masterPEAction=function(action){
  if(!masterUnlocked)return;
  const id=$('masterPEAgent')?.value;
  const c=agents.find(x=>x.id===id);
  if(!c){say('Selecione um agente para controlar PE.');return}
  if(action==='turn')window.sheetNewPETurn(id);
  else if(action==='scene')window.sheetFinishPEScene(id);
  else if(action==='restore')window.sheetRefillPE(id);
 };
 window.sheetUsePE=function(actionId){
  const c=current(),a=c&&peActionList(c).find(x=>x.id===actionId);if(!c||!a)return;
  const sheet=$('sheet-pe-'+a.id),target=$((a.mode==='cost'?'pe-cost-':'pe-param-')+a.id);
  if(sheet&&target)target.value=sheet.value;
  usePEAction(c.id,a.id);
  render();
 };
 window.sheetSelectPreset=function(value){const p=INVENTORY_PRESETS[Number(value)];if(value===''||!p)return;$('sheetItemName').value=p.name;$('sheetItemWeapon').checked=!!p.weapon};
 window.sheetRemoveItem=function(id){if(!confirm('Remover este item do inventário?'))return;removeInventoryItem(id)};
 window.sheetAddItem=function(){
  const name=$('sheetItemName')?.value.trim(),qty=Number($('sheetItemQty')?.value),weapon=!!$('sheetItemWeapon')?.checked;
  if(!name||!Number.isInteger(qty)||qty<1||qty>999){say('Informe nome e quantidade válida.');return}
  const c=current();if(!c)return;
  const preset=INVENTORY_PRESETS.find(p=>normalized(p.name)===normalized(name));
  c.inventory=itemList(c);
  c.inventory.push({id:'i'+Date.now(),name,category:preset?.category||0,spaces:preset?.spaces??1,qty,mode:'stored',weapon,benefit:false,requisitioned:false,utility:false});
  db();render();say(weapon?'Arma adicionada ao inventário e ao combate.':'Item adicionado à ficha.');
 };
 window.sheetRollWeapon=function(id){
  const c=current(),it=c&&itemList(c).find(x=>x.id===id);if(!c||!it||!it.weapon)return;
  const def=$('sheetTargetDefense'),range=$('sheetTargetRange'),oldDef=$('invTargetDefense'),oldRange=$('invTargetRange');
  if(oldDef&&def)oldDef.value=def.value;
  if(oldRange&&range)oldRange.value=range.value;
  if(weaponProfileFor(it)){rollInventoryWeapon(c.id,id);return}
  if(!it.sheetDamage){const formula=prompt('Dano desta arma (ex.: 1d6+2):','1d6');if(formula===null)return;try{parseDice(formula)}catch(e){say('Fórmula de dano inválida.');return}it.sheetDamage=formula;it.sheetSkill=confirm('A arma utiliza Pontaria? Clique em Cancelar para Luta.')?'Pontaria':'Luta';db()}
  const skill=it.sheetSkill||'Luta',attribute=Number(c.attrs[skillAttr(skill)]||0),dice=Array.from({length:attribute||2},()=>1+Math.floor(Math.random()*20)),chosen=attribute?Math.max(...dice):Math.min(...dice),total=chosen+sb(rank(c,skill)),defense=Number(def?.value||15),hit=chosen===20||total>=defense;
  let damage=null;if(hit){try{damage=parseDice(it.sheetDamage).total}catch(e){say('Dano inválido.');return}}
  const result=$('sheetCombatResult');if(result)result.innerHTML='<strong>'+esc(it.name)+'</strong><p>Teste de '+esc(skill)+': '+dice.join(', ')+' → '+total+' contra Defesa '+defense+'</p><b>'+(hit?'ACERTOU • Dano: '+damage:'ERROU')+'</b>';
  addHist({agent:c.name,label:it.name,detail:'Ataque '+total+' vs Defesa '+defense+' • '+(hit?'Dano '+damage:'Errou'),total,dt:defense,passed:hit,status:hit?'ACERTOU':'ERROU',kind:'Combate'});
 };

 const oldRender=render;
 render=function(){oldRender();renderPaper();renderMaster()};
 render();
})();
