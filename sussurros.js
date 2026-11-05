/* TEMPUS CUSTODIA — Sussurros privados. A autorização é aplicada no Supabase (RLS). */
(function(){
'use strict';
const byId=id=>document.getElementById(id);
const txt=v=>String(v??'');
const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const auth=()=>window.OPAccounts?.authenticated===true;
const online=()=>window.OPAccounts?.online===true;
const master=()=>auth()&&window.OPAccounts?.masterRole===true;
const own=()=>window.OPAccounts?.current?.id||'';
const KINDS={sussurro:'Sussurro',pista:'Pista secreta',pressagio:'Presságio'};
const PRESETS=[
 {title:'Apenas você percebe...',kind:'pista',body:'Há um detalhe que os outros ainda não notaram. Um símbolo está gravado onde a luz mal alcança.'},
 {title:'Uma lembrança distante',kind:'pressagio',body:'Por um instante, um fragmento de memória parece familiar. Você não sabe de onde o conhece.'},
 {title:'Uma voz entre os ecos',kind:'sussurro',body:'Uma frase chega aos seus ouvidos, baixa demais para que os outros possam escutá-la.'}
];
const ui={
 badge:byId('whisperUnreadBadge'),panel:byId('whisperMasterPanel'),form:byId('whisperComposer'),
 recipient:byId('whisperRecipient'),recipientRow:byId('whisperRecipientRow'),
 replyLabel:byId('whisperReplyLabel'),replyCancel:byId('whisperCancelReply'),
 title:byId('whisperTitle'),kind:byId('whisperKind'),body:byId('whisperBody'),
 send:byId('whisperSend'),feedback:byId('whisperFeedback'),
 inbox:byId('whisperInbox'),counts:byId('whisperCounts'),toast:byId('whisperToast'),
 toastTitle:byId('whisperToastTitle'),toastText:byId('whisperToastText'),
 popup:byId('whisperPopup'),popupTitle:byId('whisperPopupTitle'),
 popupBody:byId('whisperPopupBody'),popupInfo:byId('whisperPopupInfo'),
 popupRead:byId('whisperPopupRead'),popupClose:byId('whisperPopupClose'),
 popupReply:byId('whisperPopupReply'),popupStatus:byId('whisperPopupStatus')
};
if(!ui.inbox||!ui.popup)return;
let players=[],messages=[],filter='recebidas',lastAccount='',fetching=false,sending=false,marking=false;
let replyTarget=null,popupMessage=null,readOnPopup=new Set(),snoozed=new Set();
const stamp=v=>new Date(v||Date.now()).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
function say(message,error=false){if(!ui.feedback)return;ui.feedback.textContent=message;ui.feedback.classList.toggle('is-error',error)}
function nameOf(id){
 if(id===own())return 'Você';
 const player=players.find(p=>p.id===id);
 if(player){
  const duplicate=players.filter(p=>p.display_name===player.display_name).length>1;
  return player.display_name+(duplicate?' · #'+id.slice(-4):'');
 }
 return master()?'Jogador':'Mestre';
}
function resetPopup(){
 popupMessage=null;ui.popup.hidden=true;
 if(ui.popupStatus)ui.popupStatus.textContent='';
}
function resetAccount(){
 const id=auth()?own():'';
 if(lastAccount===id)return;
 lastAccount=id;messages=[];players=[];replyTarget=null;readOnPopup=new Set();snoozed=new Set();
 resetPopup();
 if(ui.recipient)ui.recipient.innerHTML='<option value="">Carregando jogadores...</option>';
 ui.panel.hidden=!master();
 ui.form.hidden=!master();
 if(ui.recipientRow)ui.recipientRow.hidden=!master();
 if(ui.replyLabel)ui.replyLabel.hidden=true;
 if(ui.replyCancel)ui.replyCancel.hidden=true;
 updateBadge();renderInbox();
 say(!online()?'Mensagens privadas exigem conexão com o Supabase.':'As mensagens aparecem aqui somente para os participantes.');
}
function updateBadge(){
 const n=messages.filter(m=>m.recipient_id===own()&&!m.read_at).length;
 if(ui.badge){ui.badge.textContent=String(n>99?'99+':n);ui.badge.hidden=n===0}
 if(ui.counts)ui.counts.textContent=n?'Você tem '+n+' mensagem(ns) não lida(s).':'Nenhuma mensagem não lida.';
 document.title=document.title.replace(/^\(\d+\+?\)\s*/,'');
 if(n>0)document.title='('+n+') '+document.title;
}
function renderRecipients(){
 if(!ui.recipient||!master())return;
 const old=ui.recipient.value;
 ui.recipient.innerHTML='<option value="">Selecione uma conta de jogador</option>'+
  players.map(p=>{
   const dup=players.filter(x=>x.display_name===p.display_name).length>1;
   return '<option value="'+esc(p.id)+'">'+esc(p.display_name)+(dup?' · #'+esc(p.id.slice(-4)):'')+'</option>';
  }).join('');
 if(players.some(p=>p.id===old))ui.recipient.value=old;
}
function renderInbox(){
 if(!ui.inbox)return;
 const mine=messages.filter(m=>filter==='todas'||(filter==='recebidas'?m.recipient_id===own():m.sender_id===own()));
 ui.inbox.innerHTML=mine.length?mine.map(m=>{
  const sent=m.sender_id===own();
  return '<article class="whisper-mail'+(!m.read_at&&!sent?' unread':'')+'" data-kind="'+esc(m.kind)+'">'+
   '<div class="whisper-mail-icon">'+(m.kind==='pista'?'⌕':m.kind==='pressagio'?'◷':'✧')+'</div>'+
   '<div class="whisper-mail-body"><small>'+(sent?'PARA '+esc(nameOf(m.recipient_id)):'DE '+esc(nameOf(m.sender_id)))+
   ' · '+esc(stamp(m.created_at))+'</small><b>'+esc(m.title)+'</b><p>'+esc(m.body)+'</p>'+
   '<span>'+esc(KINDS[m.kind]||'Mensagem')+(!m.read_at&&!sent?' · NÃO LIDA':m.read_at&&sent?' · LIDA':'')+'</span></div>'+
   '<button class="btn small" type="button" data-whisper-open="'+Number(m.id)+'">Abrir</button></article>';
 }).join(''):'<p class="whisper-empty">Nenhum sussurro nesta caixa. As mensagens são visíveis apenas para quem participa da conversa.</p>';
 for(const btn of document.querySelectorAll('[data-whisper-filter]')){
  btn.classList.toggle('is-active',btn.dataset.whisperFilter===filter);
  btn.setAttribute('aria-pressed',String(btn.dataset.whisperFilter===filter));
 }
}
function idleForPopup(){
 return ui.popup.hidden &&
  (byId('introCinema')?.hidden!==false) &&
  (byId('sceneCinema')?.hidden!==false) &&
  !document.hidden;
}
function showPopup(m){
 if(!m||!idleForPopup())return;
 popupMessage=m;
 ui.popupTitle.textContent=m.title;
 ui.popupBody.textContent=m.body;
 ui.popupInfo.textContent=(m.sender_id===own()?'Para '+nameOf(m.recipient_id):'De '+nameOf(m.sender_id))+
  ' · '+(KINDS[m.kind]||'Mensagem')+' · '+stamp(m.created_at);
 const unread=m.recipient_id===own()&&!m.read_at;
 ui.popupRead.hidden=!unread;
 ui.popupReply.hidden=master()||m.recipient_id!==own();
 ui.popupClose.textContent=unread?'Ler depois':'Fechar';
 if(ui.popupStatus)ui.popupStatus.textContent='';
 ui.popup.hidden=false;
 (unread?ui.popupRead:ui.popupClose).focus({preventScroll:true});
}
async function markRead(id){
 const m=messages.find(x=>Number(x.id)===Number(id));
 if(!m||m.recipient_id!==own()||m.read_at)return true;
 if(marking)return false;
 marking=true;
 try{
  const read_at=new Date().toISOString();
  await window.OPAccounts.whisperRequest('/rest/v1/private_whispers?id=eq.'+Number(id),'PATCH',{read_at});
  m.read_at=read_at;readOnPopup.add(Number(id));updateBadge();renderInbox();
  return true;
 }catch(err){
  if(ui.popupStatus)ui.popupStatus.textContent='Não foi possível marcar como lida: '+err.message;
  say('Falha ao registrar leitura: '+err.message,true);
  return false;
 }finally{marking=false}
}
function cancelReply(){
 replyTarget=null;
 if(ui.form)ui.form.hidden=!master();
 if(ui.replyLabel){ui.replyLabel.hidden=true;ui.replyLabel.textContent=''}
 if(ui.replyCancel)ui.replyCancel.hidden=true;
 ui.body.value='';
 ui.title.value='';
}
function startReply(m){
 if(master()||m.recipient_id!==own())return;
 replyTarget={recipient_id:m.sender_id,title:m.title};
 ui.form.hidden=false;
 ui.recipientRow.hidden=true;
 ui.replyLabel.hidden=false;
 ui.replyLabel.textContent='RESPOSTA PRIVADA PARA O MESTRE';
 ui.replyCancel.hidden=false;
 ui.title.value=('Resposta: '+m.title).slice(0,90);
 ui.kind.value='sussurro';ui.body.value='';
 resetPopup();
 if(typeof window.view==='function')window.view('sussurros');
 ui.body.focus();
 say('Responda diretamente ao mestre. Somente vocês dois terão acesso a esta conversa.');
}
async function send(){
 if(!auth()||!online()||sending)return say('Entre com sua conta conectada para enviar sussurros.',true);
 const to=master()?ui.recipient?.value:replyTarget?.recipient_id;
 const title=txt(ui.title.value).trim().slice(0,90);
 const body=txt(ui.body.value).trim().slice(0,1500);
 const kind=txt(ui.kind.value);
 if(!to)return say('Selecione um jogador ou use o botão Responder em uma mensagem do mestre.',true);
 if(!title||!body)return say('Preencha o título e o texto do sussurro.',true);
 if(!Object.prototype.hasOwnProperty.call(KINDS,kind))return say('Tipo de mensagem inválido.',true);
 if(master()&&!players.some(x=>x.id===to))return say('Escolha um jogador cadastrado.',true);
 if(!master()&&(!replyTarget||!messages.some(m=>m.sender_id===to&&m.recipient_id===own())))
  return say('Você só pode responder a uma mensagem recebida do mestre.',true);
 sending=true;ui.send.disabled=true;ui.send.textContent='Enviando...';
 try{
  await window.OPAccounts.whisperRequest('/rest/v1/private_whispers','POST',{
   sender_id:own(),recipient_id:to,title,body,kind
  });
  say('Sussurro enviado. Somente o destinatário e você podem lê-lo.');
  ui.body.value='';ui.title.value='';
  if(!master())cancelReply();
  await refresh();
 }catch(error){say('Não foi possível enviar: '+error.message,true)}
 finally{sending=false;ui.send.disabled=false;ui.send.textContent=master()?'✧ Enviar sussurro':'✧ Enviar resposta'}
}
async function refresh(){
 if(!auth()||fetching)return;
 resetAccount();
 if(!online())return;
 fetching=true;const id=own();
 try{
  const tasks=[
   window.OPAccounts.whisperRequest('/rest/v1/private_whispers?select=id,sender_id,recipient_id,title,body,kind,created_at,read_at&order=id.desc&limit=150')
  ];
  if(master())tasks.push(window.OPAccounts.whisperPlayers());
  const [items,roster]=await Promise.all(tasks);
  if(!auth()||own()!==id)return;
  if(!Array.isArray(items))throw Error('Não foi possível interpretar as mensagens.');
  messages=items;
  if(master()&&Array.isArray(roster)){
   players=roster.filter(p=>p.role==='jogador');renderRecipients();
  }
  updateBadge();renderInbox();
  if(ui.feedback?.classList?.contains('is-error'))say('Caixa de sussurros sincronizada.');
  const next=messages.filter(m=>m.recipient_id===id&&!m.read_at&&!snoozed.has(Number(m.id)))
   .sort((a,b)=>Number(a.id)-Number(b.id))[0];
  if(next&&idleForPopup())showPopup(next);
 }catch(e){say('Falha ao sincronizar sussurros: '+e.message,true)}
 finally{fetching=false}
}
ui.send?.addEventListener('click',send);
ui.replyCancel?.addEventListener('click',cancelReply);
byId('whisperRefresh')?.addEventListener('click',refresh);
byId('whisperTemplates')?.addEventListener('click',event=>{
 const btn=event.target.closest('[data-whisper-template]');if(!btn||!master())return;
 const item=PRESETS[Number(btn.dataset.whisperTemplate)];if(!item)return;
 ui.title.value=item.title;ui.body.value=item.body;ui.kind.value=item.kind;
 ui.body.focus();
});
document.addEventListener('click',event=>{
 const filterBtn=event.target.closest('[data-whisper-filter]');
 if(filterBtn){filter=filterBtn.dataset.whisperFilter;renderInbox();return}
 const open=event.target.closest('[data-whisper-open]');
 if(open){const m=messages.find(x=>Number(x.id)===Number(open.dataset.whisperOpen));if(m)showPopup(m)}
});
ui.popupRead?.addEventListener('click',async()=>{
 if(!popupMessage)return;
 const id=popupMessage.id;
 if(await markRead(id)){resetPopup();refresh()}
});
ui.popupClose?.addEventListener('click',()=>{
 if(popupMessage)snoozed.add(Number(popupMessage.id));
 resetPopup();
});
ui.popupReply?.addEventListener('click',async()=>{
 if(!popupMessage)return;
 const message=popupMessage;
 if(message.recipient_id===own()&&!message.read_at&&!(await markRead(message.id)))return;
 startReply(message);
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!ui.popup.hidden){
  if(popupMessage)snoozed.add(Number(popupMessage.id));
  resetPopup();
 }
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
setInterval(()=>{resetAccount();if(auth()&&!document.hidden)refresh()},5000);
setTimeout(()=>{resetAccount();if(auth())refresh()},1200);
resetAccount();
window.TempusSussurros={atualizar:refresh,abrir:showPopup};
})();