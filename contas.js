/* Conta, login e cadastro — armazenamento local ou Supabase configurado.
   Contas locais são uma demonstração neste dispositivo, não autenticação de servidor. */
(function(){
 'use strict';
 const config=window.OP_AUTH_CONFIG||{};
 const base=String(config.supabaseUrl||'').trim().replace(/\/+$/,'');
 const anon=String(config.supabaseAnonKey||'').trim();
 const online=!!(base&&anon);
 const accountKey='op_registered_accounts_v2';
 const currentSessionKey=online?'op_supabase_session_v1':'op_local_session_v2';
 const legacyAgents=readJson('op_agents',[]);
 const legacyHistory=readJson('op_hist',[]);
 let account=null;
 let token='';
 let refreshToken='';
 let cloudSaveChain=Promise.resolve();
 let dirtySnapshot=null;
 let rosterCache=null;
 let lastRosterFetch=0;
 let rosterRequest=null;
 let refreshPromise=null;
 let authTab='login';
 let assignedSamurai=null, lastSamuraiSnapshot='', pendingSamurai=null, samuraiSaveChain=Promise.resolve();
 let samuraiRows=null, samuraiPlayers=[], samuraiFetchAt=0, samuraiFetchPromise=null;
 let knowledgeSoundEnabled=true;
 let knowledgeAudio=null;
 let authReady=false;
 let recoveryMode=null;
 let recoveryAccessToken=null;
 const originalDB=db;
 const originalRender=render;
 function readJson(key,fallback){try{const value=JSON.parse(localStorage.getItem(key));return value??fallback}catch(e){return fallback}}
 function saveJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
 function vaultKey(id){return 'op_account_vault_v2_'+id}
 function pendingKey(id){return 'op_account_pending_v2_'+id}
 function safe(s){return esc(String(s??''))}
 function accountList(){return readJson(accountKey,[])}
 function vaultSnapshot(){return {characters:agents.filter(c=>!c.samuraiSlug),history:hist,selected:selected}}
 function setVault(value){
  const v=value&&typeof value==='object'?value:{};
  agents=Array.isArray(v.characters)?v.characters.filter(c=>!c.samuraiSlug):[];
  hist=Array.isArray(v.history)?v.history:[];
  selected=agents.some(x=>x.id===v.selected)?v.selected:(agents[0]?.id||null);
 }
 async function refreshCloudSession(){
  if(!refreshToken)throw Error('Sessão expirada. Entre novamente.');
  if(refreshPromise)return refreshPromise;
  refreshPromise=(async()=>{
   const res=await fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'apikey':anon,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refreshToken})});
   const data=await res.json();
   if(!res.ok||!data.access_token)throw Error('Sessão expirada. Faça login novamente.');
   token=data.access_token;refreshToken=data.refresh_token||refreshToken;
   if(account)storeSession();
  })();
  try{await refreshPromise}finally{refreshPromise=null}
 }
 function api(path,method='GET',data=null,asToken=token,allowRefresh=true){
  const headers={'apikey':anon,'Accept':'application/json'};
  if(asToken)headers.Authorization='Bearer '+asToken;
  if(data!==null)headers['Content-Type']='application/json';
  if(path.startsWith('/rest/v1/')&&method!=='GET')headers.Prefer='resolution=merge-duplicates,return=minimal';
  return fetch(base+path,{method,headers,body:data!==null?JSON.stringify(data):undefined}).then(async res=>{
   if(res.status===401&&asToken&&allowRefresh&&refreshToken){
    await refreshCloudSession();
    return api(path,method,data,token,false);
   }
   const raw=await res.text();let body;
   try{body=raw?JSON.parse(raw):null}catch(e){body=raw}
   if(!res.ok)throw new Error((body&&typeof body==='object'&&(body.msg||body.message||body.error_description||body.error))||'Falha de conexão ('+res.status+')');
   return body;
  });
 }
 async function loadCloudProfile(){
  const profiles=await api('/rest/v1/profiles?id=eq.'+encodeURIComponent(account.id)+'&select=id,display_name,role');
  const p=Array.isArray(profiles)?profiles[0]:null;
  account.displayName=p?.display_name||account.displayName||account.email;
  account.role=p?.role||'jogador';
 }
 function storeSession(){
  if(!account)return;
  const session=online?{account,token,refreshToken}:{accountId:account.id};
  sessionStorage.setItem(currentSessionKey,JSON.stringify(session));
 }
 async function syncCloud(){
  if(!online||!account||!token)return;
  const snapshot=dirtySnapshot;
  if(!snapshot)return;
  dirtySnapshot=null;
  const owner=account.id;
  try{
   await api('/rest/v1/character_vaults?on_conflict=owner_id','POST',{owner_id:owner,characters:snapshot.characters,history:snapshot.history,updated_at:new Date().toISOString()});
   rosterCache=null;
   if(!dirtySnapshot)localStorage.removeItem(pendingKey(owner));
   const status=document.getElementById('opAccountSync');if(status)status.textContent='Ficha sincronizada.';
  }catch(e){
   if(account?.id===owner){
    dirtySnapshot=dirtySnapshot||snapshot;
    saveJson(pendingKey(owner),dirtySnapshot);
    console.warn('Falha de sincronização:',e.message);
    const status=document.getElementById('opAccountSync');
    if(status)status.textContent='Alterações salvas localmente; falha ao sincronizar. Reabra a conta com internet para tentar novamente.';
   }
  }
 }
 function queueCloudSave(){
  if(!online||!account)return;
  dirtySnapshot={characters:JSON.parse(JSON.stringify(agents.filter(c=>!c.samuraiSlug))),history:JSON.parse(JSON.stringify(hist))};
  saveJson(pendingKey(account.id),dirtySnapshot);
  cloudSaveChain=cloudSaveChain.then(syncCloud).catch(e=>console.warn(e));
 }
 db=function(){
  if(!account)return;
  const snap=vaultSnapshot();
  saveJson(vaultKey(account.id),snap);
  if(online){queueCloudSave();queueSamuraiSave()}
 };
 render=function(){
  originalRender();
  if(account)saveJson(vaultKey(account.id),vaultSnapshot());
  renderRegistrationPage();
 };
 async function loadAccount(user){
  account=user;
  if(online){
   await loadCloudProfile();
   const result=await api('/rest/v1/character_vaults?owner_id=eq.'+encodeURIComponent(account.id)+'&select=characters,history');
   if(Array.isArray(result)&&result[0]){
    setVault({...result[0],selected:readJson(vaultKey(account.id),{}).selected});
   }else{
    setVault({characters:[],history:[]});
    await api('/rest/v1/character_vaults?on_conflict=owner_id','POST',{owner_id:account.id,characters:[],history:[]});
   }
   const pending=readJson(pendingKey(account.id),null);
   if(pending){setVault({...pending,selected:readJson(vaultKey(account.id),{}).selected});}
   saveJson(vaultKey(account.id),vaultSnapshot());
   if(pending){dirtySnapshot=pending;cloudSaveChain=cloudSaveChain.then(syncCloud);}
   await loadAssignedSamurai();
  }else{
   setVault(readJson(vaultKey(account.id),{characters:[],history:[]}));
  }
  storeSession();
  authGate.hidden=true;
  document.querySelector('.app').inert=false;
  authReady=true;
  render();
  updateAccountBadge();
  playKnowledge();
 }
 async function hashLocalPassword(password,salt){
  if(!window.crypto?.subtle)throw new Error('O navegador exige HTTPS para proteger senhas locais.');
  const encoder=new TextEncoder();
  const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:125000,hash:'SHA-256'},material,256);
  return Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,'0')).join('');
 }
 function setMessage(message,error=false){
  const box=document.getElementById('opAuthStatus');
  if(box){box.textContent=message;box.classList.toggle('error',!!error)}
 }
 async function registerUser(name,identifier,password){
  if(name.trim().length<2||name.trim().length>35)throw Error('Informe um nome entre 2 e 35 caracteres.');
  if(password.length<8)throw Error('A senha deve conter pelo menos 8 caracteres.');
  if(online){
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier))throw Error('Informe um e-mail válido.');
   const result=await api('/auth/v1/signup','POST',{email:identifier.trim().toLowerCase(),password,data:{display_name:name.trim()}},'');
   if(result?.access_token){
    token=result.access_token;refreshToken=result.refresh_token||'';
    await loadAccount({id:result.user.id,email:result.user.email,displayName:name.trim(),role:'jogador'});
   }else{
    authTab='login';updateAuthTab();
    setMessage('Cadastro criado. Confirme seu e-mail e depois entre com sua senha.');
   }
  }else{
   const users=accountList();
   const key=identifier.trim().toLocaleLowerCase('pt-BR');
   if(key.length<3||key.length>40)throw Error('Escolha um usuário entre 3 e 40 caracteres.');
   if(users.some(u=>u.key===key))throw Error('Esse nome de usuário já está cadastrado neste navegador.');
   const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x=>x.toString(16).padStart(2,'0')).join('');
   const passwordHash=await hashLocalPassword(password,salt);
   const item={id:crypto.randomUUID(),key,displayName:name.trim(),salt,passwordHash};
   saveJson(accountKey,[...users,item]);
   saveJson(vaultKey(item.id),{characters:[],history:[]});
   await loadAccount({id:item.id,displayName:item.displayName,role:'jogador'});
  }
 }
 async function loginUser(identifier,password){
  if(online){
   const result=await api('/auth/v1/token?grant_type=password','POST',{email:identifier.trim(),password},'');
   token=result.access_token;refreshToken=result.refresh_token||'';
   await loadAccount({id:result.user.id,email:result.user.email,displayName:result.user.email,role:'jogador'});
  }else{
   const key=identifier.trim().toLocaleLowerCase('pt-BR');
   const entry=accountList().find(u=>u.key===key);
   if(!entry||await hashLocalPassword(password,entry.salt)!==entry.passwordHash)throw Error('Usuário ou senha incorretos neste navegador.');
   await loadAccount({id:entry.id,displayName:entry.displayName,role:'jogador'});
  }
 }
 async function logout(){
  if(online){
   await Promise.all([cloudSaveChain.catch(()=>{}),samuraiSaveChain.catch(()=>{})]);
   try{await api('/auth/v1/logout','POST',{},token)}catch(e){}
  }
  account=null;token='';refreshToken='';rosterCache=null;lastRosterFetch=0;
  assignedSamurai=null;lastSamuraiSnapshot='';pendingSamurai=null;samuraiRows=null;samuraiPlayers=[];
  sessionStorage.removeItem(currentSessionKey);
  if(typeof window.lockMasterPanel==='function'&&document.getElementById('v-mestre')?.classList.contains('active'))window.lockMasterPanel();
  setVault({characters:[],history:[]});authReady=false;
  authGate.hidden=false;
  document.querySelector('.app').inert=true;
  authTab='login';updateAuthTab();setMessage('');
  render();updateAccountBadge();
  document.getElementById('opAuthIdentifier')?.focus();
 }
 function noteLegacy(){
  const copy=document.getElementById('opLegacyImport');
  if(!copy)return;
  const claimed=localStorage.getItem('op_legacy_imported_v2')==='1';
  const count=legacyAgents.length;
  copy.hidden=!account||claimed||count===0;
  if(!copy.hidden)copy.querySelector('p').textContent=count+' ficha(s) antigas deste navegador podem ser importadas para sua conta. Isso não remove o backup original.';
 }
 window.OPAccounts={
  get current(){return account},
  get online(){return online},
  get authenticated(){return authReady&&!!account},
  get masterRole(){return !online||account?.role==='mestre'},
  async introSamuraiAssignment(slug){
   const allowed=['akira','ichiro','masamune','reiji','takeda'];
   if(!authReady||!account||!online||account.role!=='mestre')throw Error('Atribuição disponível apenas para o mestre conectado.');
   if(!allowed.includes(String(slug)))throw Error('Selecione um dos cinco samurais.');
   const rows=await api('/rest/v1/samurai_slots?select=slug,assigned_to&slug=eq.'+encodeURIComponent(slug));
   return Array.isArray(rows)&&rows[0]?rows[0].assigned_to:null;
  },
  introRequest(path,method='GET',body=null){
   if(!authReady||!account||!online)return Promise.reject(Error('Entre com uma conta conectada.'));
   if(!/^\/rest\/v1\/character_introductions(?:\?|$)/.test(path))return Promise.reject(Error('Caminho não permitido.'));
   if(!['GET','POST'].includes(method))return Promise.reject(Error('Método não permitido.'));
   if(method==='POST'&&account.role!=='mestre')return Promise.reject(Error('Apenas o mestre pode publicar.'));
   return api(path,method,body);
  },
  logout,
  async importLegacy(){
   if(!account||!legacyAgents.length||localStorage.getItem('op_legacy_imported_v2')==='1')return;
   if(!confirm('Importar '+legacyAgents.length+' ficha(s) antigas deste navegador para '+account.displayName+'?'))return;
   const seen=new Set(agents.map(x=>String(x.id)));
   for(const c of legacyAgents){let id=String(c.id);if(seen.has(id))continue;agents.push({...c,id});seen.add(id)}
   hist=[...hist,...legacyHistory];
   selected=agents[0]?.id||null;
   localStorage.setItem('op_legacy_imported_v2','1');
   db();render();say('Fichas antigas importadas.');
  },
  renderMasterRoster,
  refreshMasterRoster(){rosterCache=null;lastRosterFetch=0;renderMasterRoster(true)},
  renderSamurais,
  refreshSamurais(){samuraiRows=null;samuraiFetchAt=0;renderSamurais(true)},
  editSamurai,
  assignSamurai,
  closeSamuraiEditor,
  saveSamuraiEditor,
  selectedSamuraiColor(id){return samuraiColorOf(agents.find(c=>c.id===id))}
 };
 const authGate=document.createElement('div');
 authGate.className='op-auth-gate';authGate.id='opAuthGate';
 authGate.innerHTML='<section class="op-auth-window"><div class="op-auth-crest" aria-hidden="true">✧</div><small class="op-auth-kicker">ARQUIVO DE CONHECIMENTO</small><h1>O Outro Lado</h1><p>Os nomes são lembrados. Os segredos, não.</p><div class="op-auth-tabs" role="tablist" aria-label="Acesso ao sistema"><button type="button" data-auth-tab="login" class="active" aria-selected="true">Entrar</button><button type="button" data-auth-tab="register" aria-selected="false">Cadastrar conta</button></div><form id="opAuthForm"><div id="opAuthNameRow" hidden><label>NOME DO JOGADOR<input id="opAuthName" maxlength="35" autocomplete="nickname" placeholder="Nome ou apelido"></label></div><label id="opAuthIdentifierLabel">USUÁRIO<input id="opAuthIdentifier" type="text" required autocomplete="username" placeholder="Nome cadastrado"></label><label>SENHA<input id="opAuthPassword" type="password" required minlength="8" autocomplete="current-password" placeholder="Mínimo 8 caracteres"></label><button type="submit" class="op-auth-submit" id="opAuthSubmit">Abrir arquivo</button></form><p class="op-auth-status" id="opAuthStatus" role="status"></p><div class="op-auth-bottom"><button type="button" id="opKnowledgeToggle">♫ Ouvir Conhecimento</button><span id="opAuthMode"></span></div></section>';
 document.body.appendChild(authGate);
 const recoveryTrigger=document.createElement('button');
 recoveryTrigger.type='button';
 recoveryTrigger.id='opAuthForgotPassword';
 recoveryTrigger.className='op-auth-forgot-trigger';
 recoveryTrigger.textContent='Esqueci minha senha';
 authGate.querySelector('#opAuthForm').after(recoveryTrigger);
 const recoveryPanel=document.createElement('section');
 recoveryPanel.id='opRecoveryPanel';
 recoveryPanel.className='op-recovery-panel';
 recoveryPanel.hidden=true;
 recoveryPanel.innerHTML='<form id="opRecoveryRequestForm">'
  +'<div class="op-recovery-sigil" aria-hidden="true">✧</div>'
  +'<h2>Recuperar acesso</h2><p>Informe o e-mail usado no cadastro. Enviaremos um link de recuperação, se houver uma conta associada a ele.</p>'
  +'<label>E-MAIL DA CONTA<input type="email" name="email" id="opRecoveryEmail" required autocomplete="email" placeholder="seu@email.com" maxlength="254"></label>'
  +'<button class="op-auth-submit" type="submit">Enviar link de recuperação</button>'
  +'</form>'
  +'<form id="opRecoveryNewForm" hidden>'
  +'<div class="op-recovery-sigil" aria-hidden="true">✦</div>'
  +'<h2>Definir nova senha</h2><p>O sigilo foi validado. Crie uma nova senha para a sua conta; as fichas continuarão salvas no Supabase.</p>'
  +'<label>NOVA SENHA<input type="password" id="opRecoveryNewPassword" required minlength="8" maxlength="128" autocomplete="new-password" placeholder="Pelo menos 8 caracteres"></label>'
  +'<label>CONFIRMAR NOVA SENHA<input type="password" id="opRecoveryConfirmPassword" required minlength="8" maxlength="128" autocomplete="new-password" placeholder="Repita a nova senha"></label>'
  +'<button class="op-auth-submit" type="submit">Salvar nova senha</button>'
  +'</form>'
  +'<button type="button" class="op-recovery-back" id="opRecoveryBackToLogin">← Voltar ao login</button>';
 recoveryTrigger.after(recoveryPanel);
 function showRecoveryMode(mode){
  recoveryMode=mode;
  const recovering=!!mode;
  const loginTabs=authGate.querySelector('.op-auth-tabs');
  loginTabs.hidden=recovering;
  document.getElementById('opAuthForm').hidden=recovering;
  recoveryTrigger.hidden=recovering||!online||authTab!=='login';
  recoveryPanel.hidden=!recovering;
  document.getElementById('opRecoveryRequestForm').hidden=mode!=='request';
  document.getElementById('opRecoveryNewForm').hidden=mode!=='new';
  if(mode==='request'){
   document.getElementById('opRecoveryEmail').value=document.getElementById('opAuthIdentifier').value.trim();
   document.getElementById('opRecoveryEmail').focus();
  }else if(mode==='new'){
   document.getElementById('opRecoveryNewPassword').focus();
  }else{
   document.getElementById('opAuthPassword').value='';
   document.getElementById('opAuthIdentifier').focus();
  }
 }
 function backToLogin(){
  recoveryAccessToken=null;
  document.getElementById('opRecoveryNewPassword').value='';
  document.getElementById('opRecoveryConfirmPassword').value='';
  showRecoveryMode(null);
  setMessage('');
 }
 recoveryTrigger.addEventListener('click',()=>{setMessage('');showRecoveryMode('request')});
 document.getElementById('opRecoveryBackToLogin').addEventListener('click',backToLogin);
 document.getElementById('opRecoveryRequestForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!online){setMessage('A recuperação por e-mail precisa do modo conectado ao Supabase.',true);return}
  const form=e.currentTarget;
  const button=form.querySelector('button[type=submit]');
  const email=document.getElementById('opRecoveryEmail').value.trim().toLowerCase();
  if(!email)return;
  button.disabled=true;setMessage('Solicitando link de recuperação...');
  try{
   // O endereço de retorno deve ser autorizado em Authentication → URL Configuration.
   const redirect=window.location.origin+window.location.pathname;
   if(window.location.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(window.location.hostname))
    throw new Error('Abra o site com HTTPS para receber o link de recuperação.');
   await api('/auth/v1/recover?redirect_to='+encodeURIComponent(redirect),'POST',{email},'');
   setMessage('Solicitação recebida. Se a conta existir, confira a caixa de entrada e o spam. Se o link não chegar, pode haver um limite de envio ou uma configuração pendente de e-mail no site.');
  }catch(error){
   const message=String(error?.message||'');
   const limit=/rate[ ._-]*limit|too[ ._-]*many|429|over_email_send_rate_limit/i.test(message);
   const smtp=/email.address.not.authorized|smtp|sending.*email|error.sending.*email/i.test(message);
   setMessage(limit?'O envio de e-mails do site atingiu um limite temporário. Aguarde a liberação antes de solicitar outro link.':
    smtp?'O serviço de e-mail do site não conseguiu enviar o link. Avise o administrador para verificar o SMTP no Supabase.':
    'Não foi possível solicitar o link de recuperação. Verifique sua conexão ou avise o administrador do site.',true);
  }finally{button.disabled=false}
 });
 document.getElementById('opRecoveryNewForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!online||!recoveryAccessToken){setMessage('Link expirado ou inválido. Solicite outro.',true);return}
  const password=document.getElementById('opRecoveryNewPassword').value;
  const confirmation=document.getElementById('opRecoveryConfirmPassword').value;
  if(password.length<8||password.length>128){setMessage('Escolha uma senha entre 8 e 128 caracteres.',true);return}
  if(password!==confirmation){setMessage('As senhas informadas não coincidem.',true);return}
  const button=e.currentTarget.querySelector('button[type=submit]');
  button.disabled=true;setMessage('Atualizando senha de acesso...');
  try{
   await api('/auth/v1/user','PUT',{password},recoveryAccessToken,false);
   try{await api('/auth/v1/logout','POST',{},recoveryAccessToken,false)}catch(e){}
   recoveryAccessToken=null;
   document.getElementById('opRecoveryNewPassword').value='';
   document.getElementById('opRecoveryConfirmPassword').value='';
   showRecoveryMode(null);
   setMessage('Senha atualizada! Agora entre com o seu e-mail e a nova senha.');
  }catch(error){
   setMessage('Não foi possível alterar a senha. O link pode ter expirado; solicite outro.',true);
  }finally{button.disabled=false}
 });
 async function handleRecoveryRedirect(){
  if(!online)return false;
  const hash=new URLSearchParams(window.location.hash.replace(/^#/,''));
  const query=new URLSearchParams(window.location.search);
  const recovery=hash.get('type')==='recovery'||query.get('type')==='recovery'||
   (hash.has('error')&&hash.has('error_code'));
  if(!recovery)return false;
  // Apaga tokens e códigos da barra de endereço antes de processá-los.
  window.history.replaceState(window.history.state,'',window.location.pathname);
  sessionStorage.removeItem(currentSessionKey);
  account=null;token='';refreshToken='';authReady=false;
  setVault({characters:[],history:[]});
  authGate.hidden=false;
  document.querySelector('.app').inert=true;
  updateAccountBadge();
  showRecoveryMode('new');
  setMessage('Validando o link de recuperação...');
  try{
   if(hash.has('error')||query.has('error'))throw Error('Link inválido');
   const directToken=hash.get('access_token')||query.get('access_token');
   const tokenHash=query.get('token_hash')||hash.get('token_hash');
   if(directToken){
    recoveryAccessToken=directToken;
   }else if(tokenHash){
    const response=await api('/auth/v1/verify','POST',{type:'recovery',token_hash:tokenHash},'',false);
    recoveryAccessToken=response?.access_token||null;
   }
   if(!recoveryAccessToken)throw Error('Link inválido');
   await api('/auth/v1/user','GET',null,recoveryAccessToken,false);
   setMessage('Link confirmado. Informe sua nova senha abaixo.');
  }catch(error){
   recoveryAccessToken=null;
   showRecoveryMode('request');
   document.getElementById('opRecoveryEmail').value='';
   setMessage('Link inválido ou expirado. Informe o e-mail e solicite uma nova recuperação.',true);
  }
  return true;
 }
 document.querySelector('.app').inert=true;
 function updateAuthTab(){
  const registering=authTab==='register';
  authGate.querySelectorAll('[data-auth-tab]').forEach(b=>{
   const chosen=b.dataset.authTab===authTab;b.classList.toggle('active',chosen);b.setAttribute('aria-selected',String(chosen));
  });
  document.getElementById('opAuthNameRow').hidden=!registering;
  document.getElementById('opAuthName').required=registering;
  document.getElementById('opAuthIdentifierLabel').firstChild.textContent=online?'E-MAIL':'USUÁRIO';
  const identifier=document.getElementById('opAuthIdentifier');
  identifier.placeholder=online?'seu@email.com':'Nome cadastrado';
  identifier.type=online?'email':'text';
  document.getElementById('opAuthSubmit').textContent=registering?'Criar conta':'Abrir arquivo';
  recoveryTrigger.hidden=registering||!online||!!recoveryMode;
  document.getElementById('opAuthPassword').autocomplete=registering?'new-password':'current-password';
  document.getElementById('opAuthMode').textContent=online?'Contas sincronizadas (Supabase)':'Modo local • somente este navegador';
 }
 authGate.querySelectorAll('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>{
  authTab=b.dataset.authTab;setMessage('');updateAuthTab();
 }));
 document.getElementById('opAuthForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.getElementById('opAuthName').value.trim();
  const identifier=document.getElementById('opAuthIdentifier').value;
  const password=document.getElementById('opAuthPassword').value;
  const btn=document.getElementById('opAuthSubmit');btn.disabled=true;setMessage('Verificando sigilos...');
  try{
   if(authTab==='register')await registerUser(name,identifier,password);
   else await loginUser(identifier,password);
   document.getElementById('opAuthPassword').value='';
  }catch(error){setMessage(error.message||'Não foi possível acessar a conta.',true)}
  finally{btn.disabled=false}
 });
 let soundContext=null;
 function playKnowledge(){
  if(!knowledgeSoundEnabled)return;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return;
  try{
   const ctx=new AC();soundContext=ctx;const now=ctx.currentTime;
   const gain=ctx.createGain();gain.gain.value=.20;gain.connect(ctx.destination);
   [[293.66,0,.8],[392,.13,.62],[587.33,.33,.57],[739.99,.59,.47],[987.77,.85,.30]].forEach(([frequency,delay,volume])=>{
    const osc=ctx.createOscillator(),env=ctx.createGain(),filter=ctx.createBiquadFilter();
    osc.type='sine';osc.frequency.value=frequency;filter.type='lowpass';filter.frequency.value=1300;
    env.gain.setValueAtTime(.0001,now+delay);
    env.gain.exponentialRampToValueAtTime(volume*.22,now+delay+.045);
    env.gain.exponentialRampToValueAtTime(.0001,now+delay+1.8);
    osc.connect(filter);filter.connect(env);env.connect(gain);
    osc.start(now+delay);osc.stop(now+delay+1.85);
   });
   const pulse=ctx.createOscillator(),env=ctx.createGain();
   pulse.type='triangle';pulse.frequency.value=146.83;
   env.gain.setValueAtTime(.0001,now);
   env.gain.exponentialRampToValueAtTime(.025,now+.3);
   env.gain.exponentialRampToValueAtTime(.0001,now+2.5);
   pulse.connect(env);env.connect(gain);pulse.start(now);pulse.stop(now+2.6);
   setTimeout(()=>ctx.close().catch(()=>{}),3500);
  }catch(e){console.warn('Áudio de Conhecimento indisponível:',e.message)}
 }
 document.getElementById('opKnowledgeToggle').addEventListener('click',playKnowledge);
 updateAuthTab();
 // Aba própria para cadastrar personagens sem duplicar o formulário do jogo.
 const nav=document.querySelector('.nav');
 const registerNav=document.createElement('button');
 registerNav.dataset.view='cadastro';registerNav.textContent='✧  Cadastrar personagem';
 nav.insertBefore(registerNav,nav.querySelector('[data-view="agents"]'));
 const registerView=document.createElement('section');
 registerView.className='view';registerView.id='v-cadastro';
 registerView.innerHTML='<div class="op-registration"><header class="op-registration-head"><small>ARQUIVO DE CONHECIMENTO • REGISTRO DE AGENTES</small><h2>Cadastrar personagem</h2><p>Crie um agente com o formulário completo de atributos, perícias, origem, NEX e poderes. Os personagens ficam vinculados à conta ativa.</p><button type="button" class="btn primary" onclick="openModal()">＋ Criar novo personagem</button></header><div class="op-registration-meta" id="opAccountMeta"></div><section class="op-legacy-import" id="opLegacyImport" hidden><strong>Fichas encontradas neste navegador</strong><p></p><button type="button" class="btn small" onclick="OPAccounts.importLegacy()">Importar fichas antigas</button></section><p class="op-account-sync" id="opAccountSync"></p><div class="op-registration-list" id="opRegistrationList"></div></div>';
 document.querySelector('main').insertBefore(registerView,document.querySelector('main .foot'));
 registerNav.addEventListener('click',()=>view('cadastro'));
 const accountBtn=document.createElement('button');
 accountBtn.className='op-account-button';accountBtn.type='button';accountBtn.onclick=()=>view('cadastro');
 const top=document.querySelector('.top');top.appendChild(accountBtn);
 const logoutBtn=document.createElement('button');logoutBtn.type='button';logoutBtn.className='op-logout-button';logoutBtn.textContent='Sair';logoutBtn.onclick=logout;top.appendChild(logoutBtn);
 function updateAccountBadge(){
  accountBtn.textContent=account?'♙ '+account.displayName:'♙ Conta';
  accountBtn.title=account?'Ver personagens de '+account.displayName:'Minha conta';
 }
 function renderRegistrationPage(){
  const list=document.getElementById('opRegistrationList'),meta=document.getElementById('opAccountMeta');
  if(!list||!meta)return;
  meta.textContent=account?'LOGADO COMO: '+account.displayName+' • '+(online?'CONTA CONECTADA':'CONTA LOCAL'):'Faça login para registrar seus personagens.';
  list.innerHTML=agents.map(c=>
   '<article class="op-registration-card '+(c.samuraiSlug?'op-samurai-card':'')+'" style="--samurai-color:'+(c.samuraiSlug?samuraiColorOf(c):'#b48e69')+'"><div><b>'+safe(c.name)+'</b><small>'+safe(className(c.class))+' • '+(c.class==='sobrevivente'?'Estágio '+safe(c.stage):'NEX '+safe(c.nex)+'%')+'</small><small>PV '+safe(c.pvNow||0)+' • PE '+safe(c.peNow||0)+' • SAN '+safe(c.sanNow||0)+'</small></div><div><button type="button" class="btn small" data-id="'+safe(c.id)+'" onclick="OPAccounts.showCharacter(this.dataset.id)">Ver ficha</button><button type="button" class="btn small" data-id="'+safe(c.id)+'" onclick="openModal(this.dataset.id)">Editar</button></div></article>'
  ).join('')||'<div class="empty">Nenhum personagem nesta conta. Clique em “Criar novo personagem”.</div>';
  noteLegacy();
 }
 window.OPAccounts.showCharacter=function(id){selected=id;view('agents')};

 // Cinco Samurais — fichas individuais atribuídas por servidor, não por localStorage compartilhado.
 const samuraiInfo=[
  {slug:'akira',name:'Akira Kurogane',color:'#C34954',element:'Lâmina Rubra'},
  {slug:'ichiro',name:'Ichiro Yamioka',color:'#8F70CB',element:'Sombra Violeta'},
  {slug:'masamune',name:'Masamune Hayato',color:'#D4A14D',element:'Sol Dourado'},
  {slug:'reiji',name:'Reiji Kuronami',color:'#4888CA',element:'Maré Azul'},
  {slug:'takeda',name:'Takeda Shirogane',color:'#58A894',element:'Jade Silencioso'}
 ];
 function samuraiColorOf(character){
  const color=String(character?.samuraiColor||'');
  return /^#[0-9a-f]{6}$/i.test(color)?color:'#b48e69';
 }
 function playerHasSamurai(){return !!assignedSamurai}
 async function loadAssignedSamurai(){
  assignedSamurai=null;lastSamuraiSnapshot='';pendingSamurai=null;
  if(!online||!account)return;
  const result=await api('/rest/v1/samurai_slots?assigned_to=eq.'+encodeURIComponent(account.id)+'&select=slug,color,name,character');
  if(!Array.isArray(result)||!result.length)return;
  const slot=result[0];
  const c={...slot.character,id:'samurai_'+slot.slug,name:slot.name,samuraiSlug:slot.slug,samuraiColor:slot.color};
  const pending=readJson('op_pending_samurai_'+account.id,null);
  if(pending&&pending.slug===slot.slug&&pending.character){
   Object.assign(c,pending.character,{id:'samurai_'+slot.slug,name:slot.name,samuraiSlug:slot.slug,samuraiColor:slot.color});
   pendingSamurai=pending;
  }
  assignedSamurai=slot.slug;
  agents=agents.filter(x=>x.id!==c.id).concat(c);
  lastSamuraiSnapshot=JSON.stringify(c);
  if(pendingSamurai)samuraiSaveChain=samuraiSaveChain.then(syncSamuraiSave);
 }
 async function syncSamuraiSave(){
  const pending=pendingSamurai;
  if(!online||!account||!token||!pending)return;
  const owner=account.id;
  pendingSamurai=null;
  try{
   await api('/rest/v1/rpc/samurai_save_progress','POST',{p_slug:pending.slug,p_character:pending.character});
   if(!pendingSamurai&&account?.id===owner)localStorage.removeItem('op_pending_samurai_'+owner);
  }catch(e){
   if(account?.id===owner){
    pendingSamurai=pendingSamurai||pending;
    saveJson('op_pending_samurai_'+owner,pendingSamurai);
    const notice=document.getElementById('opAccountSync');
    if(notice)notice.textContent='Ficha do samurai guardada neste navegador; sincronização pendente: '+e.message;
   }
  }
 }
 function queueSamuraiSave(){
  if(!assignedSamurai||!online||!account)return;
  const character=agents.find(c=>c.samuraiSlug===assignedSamurai);
  if(!character)return;
  const snapshot=JSON.stringify(character);
  if(snapshot===lastSamuraiSnapshot)return;
  lastSamuraiSnapshot=snapshot;
  pendingSamurai={slug:assignedSamurai,character:JSON.parse(snapshot)};
  saveJson('op_pending_samurai_'+account.id,pendingSamurai);
  samuraiSaveChain=samuraiSaveChain.then(syncSamuraiSave).catch(e=>console.warn('Samurai:',e));
 }
 async function fetchSamurais(force=false){
  if(!account||!online||account.role!=='mestre')return false;
  if(samuraiFetchPromise)return samuraiFetchPromise;
  if(!force&&samuraiRows&&Date.now()-samuraiFetchAt<12000)return true;
  samuraiFetchPromise=(async()=>{
   const [slots,players]=await Promise.all([
    api('/rest/v1/samurai_slots?select=slug,name,color,epithet,assigned_to,character,updated_at&order=slug.asc'),
    api('/rest/v1/profiles?select=id,display_name,role&order=display_name.asc')
   ]);
   samuraiRows=slots;
   samuraiPlayers=players.filter(p=>p.role==='jogador');
   samuraiFetchAt=Date.now();
   return true;
  })();
  try{return await samuraiFetchPromise}finally{samuraiFetchPromise=null}
 }
 function renderSamuraiCards(){
  const box=document.getElementById('masterSamuraiCards');
  if(!box||!samuraiRows)return;
  box.innerHTML=samuraiInfo.map(info=>{
   const slot=samuraiRows.find(s=>s.slug===info.slug);if(!slot)return '';
   const c=slot.character||{},attr=c.attrs||{},st=stats(c),owner=samuraiPlayers.find(p=>p.id===slot.assigned_to);
   const hasOwner=!!slot.assigned_to;
   const color=/^#[0-9a-f]{6}$/i.test(slot.color)?slot.color:info.color;
   const displaySkills=Object.entries(c.skills||{}).filter(([,level])=>+level>0).map(([skill,level])=>safe(skill)+' +'+[0,5,10,15][Math.min(3,Math.max(0,+level||0))]).join(' • ');
   const displayPowers=[...(c.powers?.class||[]),...(c.powers?.paranormal||[])].map(safe).join(' • ');
   const displayRituals=(c.powers?.rituals||[]).map(safe).join(' • ');
   const displayInventory=(c.inventory||[]).map(i=>safe(i?.name||'')).filter(Boolean).join(' • ');
   const sh=c.samuraiSheet||{},skillFormula=(sh.skills||[]).map(sk=>safe(sk.name)+' '+safe(sk.dice)+'d20 + '+safe(sk.bonus)).join(' · ');
   const ancestralInfo='<div class="samurai-special-data">'
    +'<p><strong>ELEMENTO:</strong> '+safe(sh.element||'—')+' · <strong>Marca:</strong> '+safe(sh.mark||'—')+'</p>'
    +'<p><strong>Ritual:</strong> '+safe(sh.order||'—')+'º a tocar a pedra · “'+safe(sh.phrase||'—')+'”</p>'
    +'<p><strong>Armadura:</strong> '+safe(sh.armor||'—')+' · <strong>Deslocamento:</strong> '+safe(sh.speed||'—')+' m</p>'
    +'<p><strong>Perícias especiais:</strong> '+(skillFormula||'Nenhuma')+'</p>'
    +'<p><strong>Arma:</strong> '+safe(sh.weapon?.name||'—')+' · '+safe(sh.weapon?.dice||0)+'d20 + '+safe(sh.weapon?.bonus||0)+'</p>'
    +'<p><strong>Dano:</strong> '+safe(sh.weapon?.damage||'—')+' · <strong>Crítico:</strong> '+safe(sh.weapon?.critical||'—')+'</p>'
    +'<p><strong>Habilidade única:</strong> '+safe(sh.ability?.name||'—')+' · '+safe(sh.ability?.cost||0)+' PD · '+safe(sh.ability?.trigger||'—')+'</p>'
    +'<p>'+safe(sh.ability?.description||'')+'</p></div>';
   const dossier='<details class="samurai-master-dossier"><summary>▤ Consultar ficha completa</summary><div>'
    +'<p><strong>Origem:</strong> '+safe(c.origin||'—')+'　<strong>Trilha:</strong> '+safe(c.trail||'—')+'</p>'
    +'<p><strong>Perícias:</strong> '+(displaySkills||'Nenhuma')+'</p>'
    +'<p><strong>Poderes:</strong> '+(displayPowers||'Nenhum')+'</p>'
    +'<p><strong>Rituais:</strong> '+(displayRituals||'Nenhum')+'</p>'
    +'<p><strong>Equipamentos:</strong> '+(displayInventory||'Nenhum')+'</p>'
    +'<p><strong>História:</strong> '+safe(c.backstory||'—')+'</p>'
    +'<p><strong>Objetivo:</strong> '+safe(c.objective||'—')+'</p>'+ancestralInfo+'</div></details>';
   const playerOptions='<option value="">— Não atribuído —</option>'+samuraiPlayers.map(p=>'<option value="'+safe(p.id)+'" '+(slot.assigned_to===p.id?'selected':'')+'>'+safe(p.display_name)+'</option>').join('');
   return '<article class="samurai-master-card" style="--samurai-color:'+color+'" data-samurai="'+safe(slot.slug)+'">'
    +'<div class="samurai-master-card-top"><div class="samurai-master-sigil">✦</div><div><small>'+safe(slot.epithet)+'</small><h4>'+safe(slot.name)+'</h4><span>'+safe(className(c.class||'combatente'))+' • NEX '+safe(c.nex||5)+'%</span></div><span class="samurai-master-state">'+(hasOwner?'ATRIBUÍDO':'DISPONÍVEL')+'</span></div>'
    +'<div class="samurai-master-stats"><span><b>'+safe(attr.agi??1)+'</b> AGI</span><span><b>'+safe(attr.for??1)+'</b> FOR</span><span><b>'+safe(attr.int??1)+'</b> INT</span><span><b>'+safe(attr.pre??1)+'</b> PRE</span><span><b>'+safe(attr.vig??1)+'</b> VIG</span></div>'
    +'<div class="samurai-master-resources"><span>♥ PV '+safe(c.pvNow??st.pv)+' / '+safe(c.samuraiSheet?.pv??st.pv)+'</span><span>✧ PD '+safe(c.pdNow??c.samuraiSheet?.pd??0)+' / '+safe(c.samuraiSheet?.pd??0)+'</span><span>⛨ DEF '+safe(c.samuraiSheet?.defense??'—')+'</span></div>'
    +dossier
    +'<label class="samurai-master-owner">JOGADOR RESPONSÁVEL<select id="samuraiAssign_'+safe(slot.slug)+'" aria-label="Atribuir '+safe(slot.name)+'">'+playerOptions+'</select></label>'
    +'<div class="samurai-master-actions"><button type="button" class="btn small" data-samurai="'+safe(slot.slug)+'" onclick="OPAccounts.editSamurai(this.dataset.samurai)" '+(hasOwner?'disabled title="Para proteger o progresso do jogador, desatribua antes de editar o modelo"':'')+'>✎ Editar ficha</button><button type="button" class="btn small primary" data-samurai="'+safe(slot.slug)+'" onclick="OPAccounts.assignSamurai(this.dataset.samurai)">✧ Salvar atribuição</button></div>'
    +'<small class="samurai-master-tip">'+(hasOwner?'A ficha do jogador é editável por ele. Desatribuir preserva o estado atual.':'Ajuste a ficha e escolha a conta que irá interpretá-lo.')+'</small>'
    +'</article>';
  }).join('');
 }
 async function renderSamurais(force=false){
  const box=document.getElementById('masterSamuraiCards');
  if(!box||!account)return;
  if(!online||account.role!=='mestre'){
   box.innerHTML='<p class="samurai-info">Entre com uma conta de mestre conectada ao Supabase para administrar os samurais.</p>';
   return;
  }
  if(!samuraiRows||force){box.innerHTML='<p class="samurai-info">Consultando os arquivos dos cinco samurais...</p>'}
  try{await fetchSamurais(force);renderSamuraiCards()}
  catch(e){box.innerHTML='<p class="samurai-error">Falha ao consultar os samurais: '+safe(e.message)+'</p>'}
 }
 async function assignSamurai(slug){
  if(!online||!account||account.role!=='mestre')return;
  const slot=samuraiRows?.find(s=>s.slug===slug),select=document.getElementById('samuraiAssign_'+slug);
  if(!slot||!select)return;
  const player=select.value||null;
  if(player===slot.assigned_to)return say('Esta atribuição já está salva.');
  const name=player?(samuraiPlayers.find(p=>p.id===player)?.display_name||'jogador'):'nenhum jogador';
  if(!confirm('Atribuir '+slot.name+' a '+name+'? O jogador receberá a ficha na própria conta, sem substituir seus outros personagens.'))return;
  select.disabled=true;
  try{
   await api('/rest/v1/rpc/samurai_assign','POST',{p_slug:slug,p_player:player});
   samuraiRows=null;await fetchSamurais(true);
   renderSamuraiCards();say(player?'Samurai atribuído! O jogador deve atualizar a página.':'Samurai desatribuído. Progresso preservado.');
  }catch(e){
   select.disabled=false;
   say('Não foi possível atribuir: '+e.message);await renderSamurais(true);
  }
 }
 let editSamuraiSlug=null;
 function samuraiEditorModal(){
  let el=document.getElementById('samuraiEditorModal');if(el)return el;
  el=document.createElement('div');el.className='samurai-editor-modal';el.id='samuraiEditorModal';el.hidden=true;
  el.innerHTML='<section class="samurai-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="samuraiEditorTitle"><header class="samurai-editor-head"><div><small>ARQUIVO DO MESTRE • O JURAMENTO DOS CINCO</small><h2 id="samuraiEditorTitle">Editar samurai</h2></div><button type="button" class="btn small" onclick="OPAccounts.closeSamuraiEditor()">✕ Fechar</button></header><form id="samuraiEditorForm"><div id="samuraiEditorFields"></div><footer class="samurai-editor-footer"><button type="button" class="btn small" onclick="OPAccounts.closeSamuraiEditor()">Cancelar</button><button class="btn primary" type="submit">✧ Salvar ficha</button></footer></form></section>';
  document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target===el)closeSamuraiEditor()});
  el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeSamuraiEditor()}});
  el.querySelector('#samuraiEditorForm').addEventListener('submit',e=>{e.preventDefault();saveSamuraiEditor()});
  return el;
 }
 function editSamurai(slug){
  if(!account||account.role!=='mestre')return;
  const slot=samuraiRows?.find(s=>s.slug===slug);if(!slot)return;
  if(slot.assigned_to){say('Desatribua o samurai antes de editar o modelo.');return}
  editSamuraiSlug=slug;
  const c=slot.character||{},attrs=c.attrs||{},st=stats(c),sh=c.samuraiSheet||{},weapon=sh.weapon||{},ability=sh.ability||{},modal=samuraiEditorModal();
  modal.style.setProperty('--samurai-color',slot.color);
  modal.querySelector('#samuraiEditorTitle').textContent=slot.name;
  const inp=(id,label,value,type='text',extra='')=>'<label>'+safe(label)+'<input id="samuraiEdit_'+id+'" type="'+type+'" value="'+safe(value)+'" '+extra+'></label>';
  const textarea=(id,label,value,rows=3)=>'<label>'+safe(label)+'<textarea id="samuraiEdit_'+id+'" rows="'+rows+'" maxlength="2000">'+safe(value||'')+'</textarea></label>';
  const options=(id,label,choices,current)=>'<label>'+safe(label)+'<select id="samuraiEdit_'+id+'">'+choices.map(([value,text])=>'<option value="'+safe(value)+'" '+(value===current?'selected':'')+'>'+safe(text)+'</option>').join('')+'</select></label>';
  const attributes=[['agi','AGI'],['for','FOR'],['int','INT'],['pre','PRE'],['vig','VIG']].map(([k,name])=>inp('attr_'+k,name,attrs[k]??1,'number','min="0" max="10" step="1" required')).join('');
  const skills=SK.map(([name])=>'<label>'+safe(name)+'<select data-samurai-skill="'+safe(name)+'">'+[0,1,2,3].map((rank)=>'<option value="'+rank+'" '+(Number(c.skills?.[name]||0)===rank?'selected':'')+'>'+['Destreinado','Treinado +5','Veterano +10','Expert +15'][rank]+'</option>').join('')+'</select></label>').join('');
  modal.querySelector('#samuraiEditorFields').innerHTML='<p class="samurai-editor-intro">Personalize a ficha inicial antes de entregá-la ao jogador. As alterações são salvas online e não mudam os personagens comuns.</p><div class="samurai-editor-group"><h3>◈ Identidade e progressão</h3><div class="samurai-editor-fields">'
   +inp('color','Cor da ficha',slot.color,'color','required')
   +options('class','Classe',[['combatente','Combatente'],['especialista','Especialista'],['ocultista','Ocultista']],c.class||'combatente')
   +inp('nex','NEX (%)',c.nex||5,'number','min="5" max="99" step="5" required')
   +inp('origin','Origem',c.origin||'Lutador')
   +inp('trail','Trilha',c.trail||'')
   +inp('concept','Conceito',c.concept||'')
   +'</div></div>'
   +'<div class="samurai-editor-group"><h3>✧ Atributos</h3><div class="samurai-editor-fields samurai-editor-attributes">'+attributes+'</div></div>'
   +'<div class="samurai-editor-group"><h3>♥ Recursos</h3><div class="samurai-editor-fields">'
   +inp('pv','PV atuais',c.pvNow??st.pv,'number','min="0" max="9999" required')
   +inp('pvMax','PV máximos',sh.pv??st.pv,'number','min="1" max="9999" required')
   +inp('pdNow','PD atuais',c.pdNow??sh.pd??0,'number','min="0" max="9999" required')
   +inp('pdMax','PD máximos',sh.pd??0,'number','min="1" max="9999" required')
   +inp('defense','Defesa',sh.defense??10,'number','min="0" max="999" required')
   +inp('speed','Deslocamento (m)',sh.speed??9,'number','min="0" max="999" required')
   +'</div></div>'
   +'<div class="samurai-editor-group"><h3>✦ Selo, arma e habilidade única</h3><div class="samurai-editor-fields">'
   +inp('element','Elemento',sh.element||'')
   +inp('mark','Marca na rocha',sh.mark||'')
   +inp('order','Ordem no ritual',sh.order??1,'number','min="1" max="5" required')
   +inp('phrase','Frase do ritual',sh.phrase||'')
   +inp('armor','Armadura',sh.armor||'')
   +inp('weaponName','Arma especial',weapon.name||'')
   +inp('weaponDice','Dados d20 para atacar',weapon.dice??1,'number','min="1" max="20" required')
   +inp('weaponBonus','Bônus no ataque',weapon.bonus??0,'number','min="-100" max="100" required')
   +inp('weaponCritical','Crítico (ex. 19/x2)',weapon.critical||'')
   +textarea('damageParts','Dano: uma linha por componente (ex.: 1d10 | 3 | corte)',(weapon.damageParts||[]).map(p=>p.dice+'d'+p.faces+' | '+p.bonus+' | '+p.type).join('\n'),4)
   +textarea('specialSkills','Perícias: uma linha por teste (ex.: Luta | 3 | 10)',(sh.skills||[]).map(p=>p.name+' | '+p.dice+' | '+p.bonus).join('\n'),5)
   +inp('abilityName','Nome da habilidade única',ability.name||'')
   +inp('abilityCost','Custo da habilidade em PD',ability.cost??2,'number','min="0" max="99" required')
   +options('abilityTrigger','Tipo',[['Ativação','Ativação'],['Reação','Reação']],ability.trigger||'Ativação')
   +textarea('abilityDescription','Descrição da habilidade única',ability.description||'',5)
   +'</div></div>'
   +'<div class="samurai-editor-group"><h3>⚄ Perícias convencionais</h3><div class="samurai-editor-fields samurai-editor-skills">'+skills+'</div></div>'
   +'<div class="samurai-editor-group"><h3>▤ História e equipamento</h3><div class="samurai-editor-fields">'
   +textarea('backstory','História',c.backstory||'')
   +textarea('objective','Objetivo',c.objective||'')
   +textarea('personality','Personalidade',c.personality||'')
   +textarea('appearance','Aparência',c.appearance||'')
   +textarea('classPowers','Poderes de classe (um por linha)',(c.powers?.class||[]).join('\n'))
   +textarea('paranormalPowers','Poderes paranormais (um por linha)',(c.powers?.paranormal||[]).join('\n'))
   +textarea('rituals','Rituais conhecidos (um por linha)',(c.powers?.rituals||[]).join('\n'))
   +textarea('inventory','Equipamentos (um por linha)',(c.inventory||[]).map(i=>i.name).join('\n'),5)
   +'</div></div>';
  modal.hidden=false;
  document.getElementById('samuraiEdit_color').focus();
 }
 function closeSamuraiEditor(){
  const el=document.getElementById('samuraiEditorModal');if(el)el.hidden=true;
  editSamuraiSlug=null;
 }
 async function saveSamuraiEditor(){
  if(!account||account.role!=='mestre'||!editSamuraiSlug)return;
  const slot=samuraiRows?.find(s=>s.slug===editSamuraiSlug);
  if(!slot||slot.assigned_to)return;
  const get=id=>document.getElementById('samuraiEdit_'+id)?.value??'';
  const attrs={};
  for(const k of ['agi','for','int','pre','vig']){
   const value=Number(get('attr_'+k));if(!Number.isInteger(value)||value<0||value>10){say('Atributos entre 0 e 10.');return}attrs[k]=value;
  }
  const nex=Number(get('nex'));
  if(!Number.isInteger(nex)||nex<5||nex>99||nex%5!==0){say('Informe NEX válido em múltiplos de 5.');return}
  const color=get('color');
  if(!/^#[0-9a-f]{6}$/i.test(color)){say('Cor inválida.');return}
  const skills={};
  samuraiEditorModal().querySelectorAll('[data-samurai-skill]').forEach(el=>skills[el.dataset.samuraiSkill]=Number(el.value));
  const c={...slot.character,id:'samurai_'+slot.slug,name:slot.name,samuraiSlug:slot.slug,samuraiColor:color,
   class:get('class'),nex,attrs,skills,origin:get('origin').trim().slice(0,90),trail:get('trail').trim().slice(0,90),
   concept:get('concept').trim().slice(0,200),backstory:get('backstory').trim().slice(0,2000),
   objective:get('objective').trim().slice(0,2000),personality:get('personality').trim().slice(0,2000),
   appearance:get('appearance').trim().slice(0,2000)};
  const number=(id,min,max)=>{const n=Number(get(id));return Number.isInteger(n)&&n>=min&&n<=max?n:null};
  const maxima={pv:number('pvMax',1,9999),pd:number('pdMax',1,9999),defense:number('defense',0,999),speed:number('speed',0,999)};
  if(Object.values(maxima).some(x=>x===null)){say('PV, PD, defesa ou deslocamento inválidos.');return}
  const order=number('order',1,5),abilityCost=number('abilityCost',0,99),weaponDice=number('weaponDice',1,20),weaponBonus=number('weaponBonus',-100,100);
  if([order,abilityCost,weaponDice,weaponBonus].some(x=>x===null)){say('Confira os valores da arma, habilidade e ordem no ritual.');return}
  const specialSkills=[];
  for(const line of get('specialSkills').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,30)){
   const parts=line.split('|').map(x=>x.trim()),dice=Number(parts[1]),bonus=Number(parts[2]);
   if(parts.length!==3||!parts[0]||!Number.isInteger(dice)||dice<1||dice>20||!Number.isInteger(bonus)||bonus<-100||bonus>100){say('Perícia especial inválida: '+line+'. Use Nome | dados d20 | bônus.');return}
   specialSkills.push({name:parts[0].slice(0,75),dice,bonus});
  }
  const damageParts=[];
  for(const line of get('damageParts').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,8)){
   const parts=line.split('|').map(x=>x.trim()),match=/^(\d+)d(\d+)$/i.exec(parts[0]),bonus=Number(parts[1]);
   if(parts.length!==3||!match||!parts[2]||Number(match[1])>25||Number(match[1])<1||Number(match[2])<2||Number(match[2])>100||!Number.isInteger(bonus)||bonus<-100||bonus>100){
    say('Dano inválido: '+line+'. Use 1d10 | 3 | corte.');return;
   }
   damageParts.push({dice:Number(match[1]),faces:Number(match[2]),bonus,type:parts[2].slice(0,50)});
  }
  if(!specialSkills.length||!damageParts.length){say('A ficha especial precisa de pelo menos uma perícia e um componente de dano.');return}
  const specialSheet={...c.samuraiSheet,attrs:{...attrs},pv:maxima.pv,pd:maxima.pd,defense:maxima.defense,speed:maxima.speed,
   element:get('element').trim().slice(0,60),mark:get('mark').trim().slice(0,100),order,phrase:get('phrase').trim().slice(0,250),
   armor:get('armor').trim().slice(0,150),skills:specialSkills,personality:c.personality,
   weapon:{...c.samuraiSheet?.weapon,name:get('weaponName').trim().slice(0,100),dice:weaponDice,bonus:weaponBonus,
    critical:get('weaponCritical').trim().slice(0,20),damageParts,
    damage:damageParts.map(p=>p.dice+'d'+p.faces+(p.bonus?' + '+p.bonus:'')+' '+p.type).join(' + ')},
   ability:{name:get('abilityName').trim().slice(0,100),cost:abilityCost,trigger:get('abilityTrigger'),
    description:get('abilityDescription').trim().slice(0,1500)}};
  if(!specialSheet.ability.name||!specialSheet.ability.description||!specialSheet.weapon.name||!specialSheet.element){say('Preencha elemento, arma e habilidade única.');return}
  const currentPv=number('pv',0,maxima.pv),currentPd=number('pdNow',0,maxima.pd);
  if(currentPv===null||currentPd===null){say('Os PV e PD atuais devem estar entre zero e o máximo.');return}
  c.samuraiSheet=specialSheet;c.samuraiHomebrew=true;c.pdNow=currentPd;c.pvNow=currentPv;
  c.peNow=0;c.sanNow=0;
  const maximal=stats(c);
  for(const [key,prop,max] of [['pv','pvNow',maximal.pv]]){
   const value=Number(get(key));
   if(!Number.isInteger(value)||value<0||value>max){say('O valor de '+key.toUpperCase()+' deve estar entre 0 e '+max+'.');return}
   c[prop]=value;
  }
  const byLine=field=>[...new Set(get(field).split(/\r?\n/).map(x=>x.trim().slice(0,100)).filter(Boolean))].slice(0,40);
  c.powers={...c.powers,class:byLine('classPowers'),paranormal:byLine('paranormalPowers'),rituals:byLine('rituals')};
  c.inventory=get('inventory').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,30).map((name,i)=>{
   const previous=(slot.character.inventory||[]).find(item=>item.name===name);
   const preset=INVENTORY_PRESETS.find(x=>x.name===name);
   return previous||{id:'samurai-item-'+slot.slug+'-'+i,name:name.slice(0,80),category:preset?.category??0,spaces:preset?.spaces??1,weapon:!!preset?.weapon,qty:1,mode:'stored',benefit:false,requisitioned:false,utility:false};
  });
  const button=document.querySelector('#samuraiEditorForm button[type=submit]');if(button)button.disabled=true;
  try{
   await api('/rest/v1/rpc/samurai_edit','POST',{p_slug:slot.slug,p_color:color,p_character:c});
   closeSamuraiEditor();samuraiRows=null;samuraiFetchAt=0;await renderSamurais(true);
   say('Ficha inicial de '+slot.name+' atualizada online.');
  }catch(e){say('Erro ao salvar o samurai: '+e.message)}
  finally{if(button)button.disabled=false}
 }

 function localRoster(){
  const users=accountList();
  const rows=users.map(u=>{
   const vault=readJson(vaultKey(u.id),{characters:[]});
   return {owner_id:u.id,display_name:u.displayName,characters:Array.isArray(vault.characters)?vault.characters:[],updated_at:null};
  });
  if(legacyAgents.length&&localStorage.getItem('op_legacy_imported_v2')!=='1')
   rows.push({owner_id:'antigo',display_name:'Fichas antigas (sem conta)',characters:legacyAgents});
  return rows;
 }
 async function cloudRoster(){
  const [profiles,vaults]=await Promise.all([
   api('/rest/v1/profiles?select=id,display_name,role'),
   api('/rest/v1/character_vaults?select=owner_id,characters,updated_at')
  ]);
  const names=new Map(profiles.map(p=>[p.id,p.display_name]));
  return vaults.map(v=>({...v,display_name:names.get(v.owner_id)||'Jogador'}));
 }
 function rosterCards(rows){
  let total=0;for(const r of rows)total+=(r.characters||[]).length;
  const pieces=rows.flatMap(row=>(row.characters||[]).map(c=>{
   const attrs=c.attrs||{},status=stats(c),skillEntries=Object.entries(c.skills||{}).filter(([,rank])=>Number(rank)>0);
   const powers=[...(c.powers?.class||[]),...(c.powers?.paranormal||[]),...(c.sheetPowers||[]).map(p=>p.name)].filter(Boolean);
   const rituals=(c.powers?.rituals||[]).map(p=>String(p).split('|')[0]);
   const inventory=(c.inventory||[]).filter(i=>i?.name).map(i=>i.name+' ×'+(i.qty||1));
   const resources='PV '+safe(c.pvNow??status.pv)+' / '+status.pv+' · PE '+safe(c.peNow??status.pe)+' / '+status.pe+' · SAN '+safe(c.sanNow??status.san)+' / '+status.san;
   const subsection=(title,values)=>'<details class="op-master-detail-group"><summary>'+safe(title)+' ('+values.length+')</summary><p>'+(values.length?values.map(safe).join(' · '):'Nenhum registro')+'</p></details>';
   return '<details class="op-master-char"><summary><div><strong>'+safe(c.name||'Sem nome')+'</strong><span>'+safe(row.display_name)+' · '+safe(className(c.class||'combatente'))+' · '+(c.class==='sobrevivente'?'Estágio '+safe(c.stage||1):'NEX '+safe(c.nex||5)+'%')+'</span></div><span>Ver ficha ▾</span></summary><div class="op-master-char-detail"><p>'+safe(resources)+'</p><p>AGI '+safe(attrs.agi??1)+' · FOR '+safe(attrs.for??1)+' · INT '+safe(attrs.int??1)+' · PRE '+safe(attrs.pre??1)+' · VIG '+safe(attrs.vig??1)+'</p><p>Origem: '+safe(c.origin||'Não informada')+' · Trilha: '+safe(c.trail||'Não definida')+'</p>'
    +subsection('Perícias treinadas',skillEntries.map(([name,rank])=>name+' +'+([0,5,10,15][rank]||0)))
    +subsection('Poderes',powers)
    +subsection('Rituais',rituals)
    +subsection('Inventário',inventory)
    +'<small>Somente visualização. A edição pertence à conta que criou a ficha.</small></div></details>';
  }));
  return '<div class="op-master-roster-counter">'+total+' personagem(ns) em '+rows.length+' conta(s)</div>'+(pieces.join('')||'<div class="empty">Nenhum personagem cadastrado.</div>');
 }
 async function renderMasterRoster(force=false){
  const box=document.getElementById('masterAccountRoster');
  if(!box||!account)return;
  if(online&&account.role!=='mestre'){
   box.innerHTML='<div class="empty">A conta conectada não tem a função de mestre no banco de dados. O PIN sozinho não autoriza visualizar personagens de outros jogadores.</div>';
   return;
  }
  if(!online){box.innerHTML=rosterCards(localRoster());return}
  if(!force&&rosterCache&&Date.now()-lastRosterFetch<12000){box.innerHTML=rosterCards(rosterCache);return}
  if(rosterRequest)return;
  box.innerHTML='<div class="empty">Consultando personagens conectados...</div>';
  const request=cloudRoster();
  rosterRequest=request;
  try{
   const result=await request;
   rosterCache=result;lastRosterFetch=Date.now();
   if(account&&document.getElementById('masterAccountRoster')===box)box.innerHTML=rosterCards(result);
  }catch(e){box.innerHTML='<div class="empty">Não foi possível carregar as fichas conectadas: '+safe(e.message)+'.</div>'}
  finally{if(rosterRequest===request)rosterRequest=null}
 }
 window.addEventListener('beforeunload',()=>{
  if(account)saveJson(vaultKey(account.id),vaultSnapshot());
 });
 async function bootstrap(){
  if(await handleRecoveryRedirect())return;
  let session=null;
  try{session=JSON.parse(sessionStorage.getItem(currentSessionKey)||'null')}catch(e){}
  if(!session){setVault({characters:[],history:[]});render();updateAccountBadge();return}
  try{
   if(online&&session.token&&session.account){
    token=session.token;refreshToken=session.refreshToken||'';
    await api('/auth/v1/user','GET',null,token);
    await loadAccount(session.account);
   }else if(!online&&session.accountId){
    const user=accountList().find(u=>u.id===session.accountId);
    if(user)await loadAccount({id:user.id,displayName:user.displayName,role:'jogador'});
   }
  }catch(e){sessionStorage.removeItem(currentSessionKey);account=null;token='';setVault({characters:[],history:[]});render()}
  if(!account){authGate.hidden=false;document.querySelector('.app').inert=true;updateAuthTab();updateAccountBadge()}
 }
 bootstrap();
})();
