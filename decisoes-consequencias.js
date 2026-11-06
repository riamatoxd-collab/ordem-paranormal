/* TEMPUS CUSTODIA — Decisões e Consequências.
   Somente o mestre consulta as decisões no Supabase (RLS). O painel não
   dispara cenas automaticamente: as ações narrativas permanecem explícitas. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const dock=$('mcDock-decisoes');
 if(!dock)return;
 const str=x=>String(x??'');
 const escape=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const role=()=>window.OPAccounts?.authenticated===true&&window.OPAccounts?.online===true&&window.OPAccounts?.masterRole===true;
 const accountId=()=>role()?(window.OPAccounts?.current?.id||''):'';
 const api=(path,method='GET',body=null)=>window.OPAccounts.decisionRequest(path,method,body);
 const STATES={pendente:'Pendente',preparada:'Preparada',executada:'Executada',arquivada:'Arquivada'};
 const IMPACT={baixo:'Baixo',medio:'Médio',alto:'Alto',critico:'Crítico'};
 const TOOLS={
  nenhuma:'Sem ferramenta vinculada',cenas:'Diretor de Cenas',sussurros:'Sussurros',
  npcs:'NPCs e Apresentações',enigmas:'Enigmas e Baús',mural:'Mural de Investigação',
  personagens:'Personagens e PE'
 };
 const TEMPLATES=[
  {title:'O grupo confiou no monge',choice_text:'Os investigadores decidiram confiar nas palavras do monge.',consequence_text:'A confiança abre um caminho, mas a verdade ainda depende do que o grupo descobrirá.',trigger_condition:'No próximo encontro com o monge.',episode:'Próximo episódio',impact:'medio',next_tool:'npcs'},
  {title:'O baú foi aberto',choice_text:'O grupo resolveu o mecanismo do baú antigo.',consequence_text:'A descoberta pode alterar o rumo da investigação e revelar um segredo do templo.',trigger_condition:'Quando os jogadores examinarem o conteúdo.',episode:'Exploração do templo',impact:'alto',next_tool:'mural'},
  {title:'Os cinco símbolos foram reunidos',choice_text:'O grupo escolheu reunir os símbolos encontrados na vila.',consequence_text:'Uma nova cena ficará disponível quando todas as pistas forem compreendidas.',trigger_condition:'Após concluírem o próximo enigma.',episode:'Retorno à vila',impact:'critico',next_tool:'cenas'}
 ];
 dock.innerHTML=
  '<div class="dc-app" id="dcApp">'+
   '<div class="dc-intro"><div><small>◷ ARQUIVO DO DESTINO • CONTROLE RESERVADO</small>'+
    '<h3>O peso de cada escolha.</h3><p>Registre o que o grupo decidiu, prepare as consequências e acompanhe quando cada acontecimento deve entrar na história. Nada é revelado aos jogadores automaticamente.</p></div>'+
    '<span class="dc-intro-symbol" aria-hidden="true">♢</span></div>'+
   '<div class="dc-stats" id="dcStats" aria-live="polite"></div>'+
   '<div class="dc-layout">'+
    '<section class="dc-panel dc-editor" aria-label="Criador de decisões">'+
     '<div class="dc-panel-heading"><div><small>◈ REGISTRO NARRATIVO</small><h3 id="dcEditorHeading">Nova decisão</h3></div>'+
      '<button type="button" id="dcCancelEdit" class="dc-mini-btn" hidden>＋ Novo registro</button></div>'+
     '<p class="dc-muted">Escolhas reais dos jogadores ficam separadas das consequências planejadas pelo mestre.</p>'+
     '<div class="dc-templates" id="dcTemplates"><span>COMEÇAR A PARTIR DE UM EXEMPLO</span></div>'+
     '<form id="dcForm" class="dc-form" autocomplete="off">'+
      '<label class="dc-full">TÍTULO DA DECISÃO<input id="dcTitle" name="title" maxlength="100" required placeholder="Ex.: Confiaram no monge"></label>'+
      '<label class="dc-full">O QUE O GRUPO ESCOLHEU?<textarea id="dcChoice" name="choice_text" maxlength="1200" rows="3" required placeholder="Qual foi a escolha? O que aconteceu na sessão?"></textarea></label>'+
      '<div class="dc-two">'+
       '<label>EPISÓDIO / ETAPA<input id="dcEpisode" maxlength="100" placeholder="Episódio 2 — A Vila"></label>'+
       '<label>PERSONAGENS ENVOLVIDOS<input id="dcParticipants" maxlength="200" placeholder="Todos, Akira, Ichiro..."></label>'+
      '</div>'+
      '<label class="dc-full">CONSEQUÊNCIA SECRETA<textarea id="dcConsequence" maxlength="1800" rows="4" required placeholder="O que acontecerá por causa dessa escolha?"></textarea></label>'+
      '<label class="dc-full">QUANDO A CONSEQUÊNCIA DEVE APARECER?<textarea id="dcTrigger" maxlength="500" rows="2" placeholder="Ex.: Quando o grupo retornar à praça da vila"></textarea></label>'+
      '<div class="dc-two">'+
       '<label>IMPACTO NARRATIVO<select id="dcImpact"><option value="baixo">Baixo</option><option value="medio" selected>Médio</option><option value="alto">Alto</option><option value="critico">Crítico</option></select></label>'+
       '<label>FERRAMENTA RELACIONADA<select id="dcTool"><option value="nenhuma">Nenhuma</option><option value="cenas">Diretor de Cenas</option><option value="sussurros">Sussurros</option><option value="npcs">NPCs e Apresentações</option><option value="enigmas">Enigmas e Baús</option><option value="mural">Mural de Investigação</option><option value="personagens">Personagens e PE</option></select></label>'+
      '</div>'+
      '<label class="dc-full">ANOTAÇÕES DO MESTRE (OPCIONAL)<textarea id="dcNotes" maxlength="1000" rows="2" placeholder="Frases para narrar, pistas relacionadas, observações..."></textarea></label>'+
      '<div class="dc-form-actions"><button type="submit" id="dcSave" class="dc-submit">✦ Registrar decisão</button>'+
       '<button type="button" class="dc-ghost" id="dcReset">Limpar formulário</button></div>'+
     '</form>'+
     '<div role="status" aria-live="polite" id="dcFeedback" class="dc-feedback"></div>'+
    '</section>'+
    '<section class="dc-panel dc-register" aria-label="Decisões da campanha">'+
     '<div class="dc-panel-heading"><div><small>⌕ LINHA DO DESTINO</small><h3>Consequências da campanha</h3></div>'+
      '<button type="button" id="dcRefresh" class="dc-mini-btn" aria-label="Atualizar registros">↻ Atualizar</button></div>'+
     '<div class="dc-flow" aria-label="Etapas do registro"><span>01 REGISTRAR</span><b>›</b><span>02 PREPARAR</span><b>›</b><span>03 EXECUTAR</span></div>'+
     '<div class="dc-filters"><label>VISUALIZAR<select id="dcStatusFilter"><option value="abertas">Em aberto</option><option value="todas">Todas</option><option value="pendente">Pendentes</option><option value="preparada">Preparadas</option><option value="executada">Executadas</option><option value="arquivada">Arquivadas</option></select></label>'+
      '<label>BUSCAR<input id="dcSearch" maxlength="100" placeholder="Título, episódio, escolha..."></label></div>'+
     '<p class="dc-muted dc-limited">Até 200 registros recentes por consulta. Os arquivados permanecem no histórico.</p>'+
     '<div id="dcCards" class="dc-cards"></div>'+
    '</section>'+
   '</div>'+
  '</div>';
 const E={
  root:$('dcApp'),form:$('dcForm'),feedback:$('dcFeedback'),stats:$('dcStats'),
  cards:$('dcCards'),filter:$('dcStatusFilter'),search:$('dcSearch'),
  heading:$('dcEditorHeading'),save:$('dcSave'),cancel:$('dcCancelEdit'),
  title:$('dcTitle'),choice:$('dcChoice'),episode:$('dcEpisode'),
  participants:$('dcParticipants'),consequence:$('dcConsequence'),trigger:$('dcTrigger'),
  impact:$('dcImpact'),tool:$('dcTool'),notes:$('dcNotes'),templates:$('dcTemplates')
 };
 let account='',rows=[],editId=null,loading=false,busy=false,loaded=false,feedbackError=false;
 const fieldIds={title:E.title,choice_text:E.choice,episode:E.episode,participants:E.participants,
  consequence_text:E.consequence,trigger_condition:E.trigger,impact:E.impact,
  next_tool:E.tool,master_notes:E.notes};
 const dateText=x=>{if(!x)return '';const d=new Date(x);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})};
 function notice(message,error=false){
  E.feedback.textContent=message;feedbackError=error;
  E.feedback.classList.toggle('is-error',error);
 }
 function countBy(status){return rows.filter(x=>x.status===status).length}
 function resumo(){return role()?{pendentes:countBy('pendente'),preparadas:countBy('preparada'),
  executadas:countBy('executada'),arquivadas:countBy('arquivada'),
  abertas:countBy('pendente')+countBy('preparada'),carregado:loaded}:null}
 function renderStats(){
  const stats=[
   {state:'pendente',icon:'◷',label:'Pendentes',value:countBy('pendente')},
   {state:'preparada',icon:'✦',label:'Preparadas',value:countBy('preparada')},
   {state:'executada',icon:'◈',label:'Executadas',value:countBy('executada')},
   {state:'arquivada',icon:'▤',label:'Arquivadas',value:countBy('arquivada')}
  ];
  E.stats.innerHTML=stats.map(x=>'<div class="dc-stat" data-state="'+x.state+'">'+
   '<span class="dc-stat-icon" aria-hidden="true">'+x.icon+'</span><div><small>'+x.label+'</small>'+
   '<strong>'+(!loaded?'—':x.value)+'</strong></div></div>').join('');
 }
 function renderCards(){
  const keyword=E.search.value.trim().toLocaleLowerCase('pt-BR'),filter=E.filter.value;
  const filtered=rows.filter(x=>{
   if(filter==='abertas'&&!['pendente','preparada'].includes(x.status))return false;
   if(!['abertas','todas'].includes(filter)&&x.status!==filter)return false;
   return !keyword||[x.title,x.choice_text,x.participants,x.episode,x.consequence_text,
    x.trigger_condition].some(v=>str(v).toLocaleLowerCase('pt-BR').includes(keyword));
  }).sort((a,b)=>{
   const rank={preparada:0,pendente:1,executada:2,arquivada:3};
   return (rank[a.status]??4)-(rank[b.status]??4)||Number(b.id)-Number(a.id);
  });
  if(!filtered.length){
   E.cards.innerHTML='<div class="dc-empty"><span aria-hidden="true">◷</span><strong>'+
    (!loaded?'Conectando ao arquivo...':rows.length?'Nenhum registro corresponde aos filtros.':'O destino ainda não foi escrito.')+
    '</strong><p>'+(rows.length?'Tente outro filtro ou termo de busca.':
    'Cadastre uma escolha que os jogadores fizeram. Ela aparecerá aqui, pronta para acompanhar suas consequências.')+
    '</p></div>';
   return;
  }
  E.cards.innerHTML=filtered.map(x=>{
   const id=Number(x.id);
   const status=STATES[x.status]||'Pendente',impact=IMPACT[x.impact]||'Médio';
   const actions=x.status==='pendente'?
    '<button type="button" class="dc-action dc-ready" data-dc-stage="preparada" data-dc-id="'+id+'">✦ Preparar</button>':
    x.status==='preparada'?
    '<button type="button" class="dc-action dc-complete" data-dc-stage="executada" data-dc-id="'+id+'">◈ Executar</button>':
    '<button type="button" class="dc-action" data-dc-stage="pendente" data-dc-id="'+id+'">↻ Reabrir</button>';
   const extra=x.status==='pendente'?
    '<button type="button" class="dc-action dc-complete" data-dc-stage="executada" data-dc-id="'+id+'">◈ Executar</button>':'';
   const archive=x.status!=='arquivada'?
    '<button type="button" class="dc-action dc-archive" data-dc-stage="arquivada" data-dc-id="'+id+'">Arquivar</button>':'';
   const nextTool=x.next_tool&&x.next_tool!=='nenhuma'&&TOOLS[x.next_tool]?
    '<button type="button" class="dc-link-tool" data-dc-tool="'+escape(x.next_tool)+'">↗ Ir para '+escape(TOOLS[x.next_tool])+'</button>':'';
   return '<article class="dc-record" data-dc-state="'+escape(x.status)+'" data-dc-impact="'+escape(x.impact)+'">'+
    '<div class="dc-record-head"><span class="dc-record-number">REGISTRO #'+id+'</span><span class="dc-state">'+escape(status)+'</span></div>'+
    '<div class="dc-record-meta"><span>◷ '+escape(x.episode||'Sem episódio')+'</span>'+
     '<span class="dc-impact">✦ Impacto '+escape(impact)+'</span></div>'+
    '<h4>'+escape(x.title)+'</h4>'+
    '<div class="dc-decision-text"><small>ESCOLHA DO GRUPO</small><p>'+escape(x.choice_text)+'</p></div>'+
    (x.participants?'<p class="dc-participants">♙ '+escape(x.participants)+'</p>':'')+
    '<details class="dc-consequence"><summary>◈ Ver consequência secreta</summary>'+
     '<div class="dc-consequence-body"><small>EFEITO NARRATIVO</small><p>'+escape(x.consequence_text)+'</p>'+
     '<small>GATILHO / MOMENTO</small><p>'+escape(x.trigger_condition||'Quando o mestre decidir')+'</p>'+
     (x.master_notes?'<small>ANOTAÇÕES DO MESTRE</small><p>'+escape(x.master_notes)+'</p>':'')+
     (nextTool?nextTool:'')+'</div></details>'+
    (x.status==='executada'&&x.resolved_at?'<p class="dc-resolved">✦ Executada em '+escape(dateText(x.resolved_at))+'</p>':'')+
    '<div class="dc-record-actions"><button type="button" class="dc-action" data-dc-edit="'+id+'">✎ Editar</button>'+actions+extra+archive+'</div>'+
    '</article>';
  }).join('');
 }
 function render(){renderStats();renderCards()}
 function clearForm(){
  E.form.reset();editId=null;E.heading.textContent='Nova decisão';
  E.save.textContent='✦ Registrar decisão';E.cancel.hidden=true;
  E.impact.value='medio';E.tool.value='nenhuma';
 }
 function clearSensitive(){
  rows=[];loaded=false;account='';editId=null;
  E.form.reset();clearForm();E.search.value='';E.filter.value='abertas';
  notice('');render();
 }
 function syncAccount(){
  const id=accountId();
  if(account!==id){clearSensitive();account=id}
  return Boolean(id);
 }
 function template(index){
  if(!role())return;
  const item=TEMPLATES[index];if(!item)return;
  if(editId!==null){clearForm()}
  for(const [key,field] of Object.entries(fieldIds))field.value=str(item[key]??'');
  E.participants.value='';
  notice('Exemplo carregado. Ajuste a escolha para o que realmente aconteceu na sua mesa antes de salvar.');
  E.title.focus();
 }
 function collect(){
  const values={};
  for(const [key,el] of Object.entries(fieldIds))values[key]=el.value.trim();
  if(!values.title||!values.choice_text||!values.consequence_text)
   throw Error('Preencha título, escolha do grupo e consequência secreta.');
  const bounds={title:100,choice_text:1200,participants:200,episode:100,consequence_text:1800,
   trigger_condition:500,master_notes:1000};
  for(const [name,max] of Object.entries(bounds)){
   if(values[name].length>max)throw Error('O campo '+name+' ultrapassou o limite permitido.');
  }
  if(!Object.hasOwn(IMPACT,values.impact)||!Object.hasOwn(TOOLS,values.next_tool))
   throw Error('Impacto ou ferramenta inválidos.');
  return values;
 }
 async function save(event){
  event.preventDefault();
  if(busy)return;
  if(!syncAccount())return notice('Entre na conta de mestre para guardar decisões.',true);
  let values;
  try{values=collect()}catch(error){return notice(error.message,true)}
  busy=true;E.save.disabled=true;
  const owner=account,editing=editId;
  try{
   const now=new Date().toISOString();
   const data=editing===null?{...values,status:'pendente',created_by:owner,
    updated_at:now,resolved_at:null}:{...values,updated_at:now};
   const path=editing===null?'/rest/v1/campaign_decisions':
    '/rest/v1/campaign_decisions?id=eq.'+editing;
   await api(path,editing===null?'POST':'PATCH',data);
   if(owner!==accountId())return;
   clearForm();notice(editing===null?'Decisão registrada. Prepare a consequência quando chegar a hora.':
     'Registro atualizado. As informações secretas continuam só no arquivo do mestre.');
   await refresh();
  }catch(e){notice('Não foi possível salvar: '+str(e.message||e).slice(0,200),true)}
  finally{busy=false;E.save.disabled=false}
 }
 function openEdit(id){
  if(!role()||busy)return;
  const item=rows.find(x=>Number(x.id)===id);if(!item)return;
  editId=id;
  for(const [key,el] of Object.entries(fieldIds))el.value=str(item[key]);
  E.heading.textContent='Editar registro #'+id;
  E.save.textContent='✦ Salvar alterações';E.cancel.hidden=false;
  notice('Editando '+item.title+'. As mudanças ficarão salvas no Supabase.');
  E.title.focus();E.root.scrollIntoView?.({behavior:'smooth',block:'start'});
 }
 async function updateStatus(id,newStatus){
  if(!role()||busy||!Object.hasOwn(STATES,newStatus))return;
  const item=rows.find(x=>Number(x.id)===id);if(!item||item.status===newStatus)return;
  if(newStatus==='executada'&&!confirm('Marcar esta consequência como executada? Esta ação registra a decisão, mas NÃO inicia uma cena automaticamente.'))return;
  if(newStatus==='arquivada'&&!confirm('Arquivar este registro? Você ainda poderá reabri-lo no histórico.'))return;
  busy=true;const owner=accountId();
  try{
   const now=new Date().toISOString();
   await api('/rest/v1/campaign_decisions?id=eq.'+id,'PATCH',{
    status:newStatus,resolved_at:newStatus==='executada'?now:null,updated_at:now
   });
   if(owner!==accountId())return;
   notice(newStatus==='preparada'?'Consequência preparada. Ela ficará em destaque na lista.':
    newStatus==='executada'?'Consequência executada e registrada no histórico.':
    newStatus==='arquivada'?'Registro arquivado. Use o filtro Arquivadas para reencontrá-lo.':
    'Registro reaberto para a próxima sessão.');
   await refresh();
  }catch(e){notice('Não foi possível atualizar a etapa: '+str(e.message||e).slice(0,200),true)}
  finally{busy=false}
 }
 async function refresh(){
  if(!syncAccount()||loading||busy)return;
  loading=true;const id=account;
  try{
   const path='/rest/v1/campaign_decisions?select=id,title,choice_text,participants,episode,impact,consequence_text,trigger_condition,master_notes,next_tool,status,created_by,created_at,updated_at,resolved_at&order=updated_at.desc&limit=200';
   const fetched=await api(path);
   if(!Array.isArray(fetched))throw Error('Formato inesperado ao sincronizar decisões.');
   if(!role()||id!==accountId())return;
   rows=fetched.filter(x=>x.created_by===id);
   loaded=true;render();
   if(feedbackError)notice('Arquivo sincronizado.');
  }catch(e){
   if(id===accountId())notice('Falha ao sincronizar: '+str(e.message||e).slice(0,200),true);
  }finally{loading=false}
 }
 E.templates.innerHTML+='<div class="dc-template-grid">'+TEMPLATES.map((t,i)=>
  '<button type="button" data-dc-template="'+i+'"><span>0'+(i+1)+' ◇</span><strong>'+
   escape(t.title)+'</strong></button>').join('')+'</div>';
 E.templates.addEventListener('click',e=>{
  const button=e.target.closest('[data-dc-template]');if(button)template(Number(button.dataset.dcTemplate));
 });
 E.form.addEventListener('submit',save);
 E.cancel.addEventListener('click',()=>{clearForm();notice('Pronto para criar um novo registro.')});
 $('dcReset').addEventListener('click',()=>{clearForm();notice('Formulário limpo.')});
 $('dcRefresh').addEventListener('click',refresh);
 E.filter.addEventListener('change',renderCards);
 E.search.addEventListener('input',renderCards);
 E.cards.addEventListener('click',e=>{
  const edit=e.target.closest('[data-dc-edit]');
  if(edit){openEdit(Number(edit.dataset.dcEdit));return}
  const stage=e.target.closest('[data-dc-stage]');
  if(stage){updateStatus(Number(stage.dataset.dcId),stage.dataset.dcStage);return}
  const tool=e.target.closest('[data-dc-tool]');
  if(tool&&Object.hasOwn(TOOLS,tool.dataset.dcTool)&&tool.dataset.dcTool!=='nenhuma')
   window.TempusMestreFerramentas?.abrir?.(tool.dataset.dcTool);
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 syncAccount();render();
 setInterval(()=>{if(!syncAccount())return;if(!document.hidden)refresh()},6500);
 setTimeout(()=>{if(role())refresh()},1100);
 window.TempusDecisoes={atualizar:refresh,resumo,limpar:clearSensitive};
})();