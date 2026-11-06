/* Tempus Custodia — fotos de cartas com câmera/galeria e Storage privado. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const auth=()=>window.OPAccounts?.authenticated===true&&window.OPAccounts?.online===true;
const master=()=>window.OPAccounts?.masterRole===true;
const uid=()=>window.OPAccounts?.current?.id||'';
const validPath=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}\/[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}[.]jpg$/;
const shell=$('v-mural')?.querySelector('.mystery-shell');
if(!shell)return;
const panel=document.createElement('section');
panel.id='investPhotoPanel';
panel.className='mystery-panel invest-photo-panel';
panel.hidden=true;
panel.innerHTML=
 '<div class="invest-photo-intro"><div><small>▧ ARQUIVO FOTOGRÁFICO DOS INVESTIGADORES</small><h3>Fotografar evidência</h3>'+
 '<p>Encontrou uma carta, bilhete ou símbolo? Fotografe e coloque diretamente no mural. Depois conecte a foto às outras pistas.</p></div><div aria-hidden="true" class="invest-photo-emblem">⌕</div></div>'+
 '<form id="investPhotoForm" autocomplete="off">'+
 '<div class="invest-photo-choose"><label class="invest-photo-option" for="investPhotoCamera"><span>📷</span><strong>Tirar foto</strong><small>Usar a câmera do celular</small></label>'+
 '<input id="investPhotoCamera" class="invest-photo-file" type="file" accept="image/*" capture="environment">'+
 '<label class="invest-photo-option" for="investPhotoGallery"><span>▧</span><strong>Escolher imagem</strong><small>Galeria ou computador</small></label>'+
 '<input id="investPhotoGallery" class="invest-photo-file" type="file" accept="image/*"></div>'+
 '<div id="investPhotoPreview" class="invest-photo-preview" hidden><img id="investPhotoPreviewImage" alt="Prévia da foto escolhida"><div><strong id="investPhotoFileName">Foto selecionada</strong>'+
 '<small>Confira se a carta está legível antes de publicar.</small><button id="investPhotoClear" class="btn small" type="button">Trocar foto</button></div></div>'+
 '<div class="invest-photo-fields"><label>TÍTULO DA FOTO<input id="investPhotoTitle" maxlength="100" placeholder="Ex.: Carta encontrada perto do poço" required></label>'+
 '<label>OBSERVAÇÕES DO INVESTIGADOR<textarea id="investPhotoDescription" rows="3" maxlength="1500" placeholder="Onde encontrou? O que chamou atenção?"></textarea></label></div>'+
 '<div class="invest-photo-actions"><button class="btn primary" type="submit" id="investPhotoSubmit">✦ Adicionar foto ao mural</button>'+
 '<small>Compartilhada com a equipe do RPG. Envie apenas cartas e objetos do jogo, sem dados pessoais.</small></div>'+
 '<p id="investPhotoStatus" class="invest-photo-status" role="status" aria-live="polite"></p></form>';
shell.appendChild(panel);
const form=$('investPhotoForm');
const preview=$('investPhotoPreview');
const previewImage=$('investPhotoPreviewImage');
const status=$('investPhotoStatus');
const submit=$('investPhotoSubmit');
let chosen=null,previewUrl=null,busy=false,lastAccount='';
const cache=new Map();
const inflight=new Map();
const photoCount=new Set();
function notice(text,error=false){status.textContent=text;status.classList.toggle('is-error',error)}
function clearPreview(){
 chosen=null;
 if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}
 previewImage.removeAttribute('src');preview.hidden=true;
 $('investPhotoCamera').value='';$('investPhotoGallery').value='';
}
function clearCache(){
 for(const url of cache.values())URL.revokeObjectURL(url);
 cache.clear();inflight.clear();photoCount.clear();
}
function syncAccount(){
 const id=auth()?uid():'';
 if(id!==lastAccount){
  lastAccount=id;
  clearPreview();clearCache();
  if(form)form.reset();
  notice('');
 }
 panel.hidden=!auth();
}
function pick(file){
 if(!file)return;
 if(!file.type.startsWith('image/'))return notice('Selecione uma foto ou imagem compatível.',true);
 if(file.size>12*1024*1024)return notice('A foto original deve ter até 12 MB. Escolha uma imagem menor.',true);
 clearPreview();
 chosen=file;
 previewUrl=URL.createObjectURL(file);
 previewImage.src=previewUrl;
 $('investPhotoFileName').textContent=file.name||'Foto da carta';
 preview.hidden=false;
 notice('Imagem selecionada. Digite um título e publique quando estiver pronta.');
}
$('investPhotoCamera').addEventListener('change',e=>pick(e.target.files?.[0]));
$('investPhotoGallery').addEventListener('change',e=>pick(e.target.files?.[0]));
$('investPhotoClear').addEventListener('click',clearPreview);
async function jpegFromImage(file){
 let objectUrl=null;
 try{
  objectUrl=URL.createObjectURL(file);
  const image=new Image();
  await new Promise((resolve,reject)=>{
   image.onload=resolve;
   image.onerror=()=>reject(Error('Não foi possível abrir este formato de imagem. Experimente JPEG ou PNG.'));
   image.src=objectUrl;
  });
  if(!image.naturalWidth||!image.naturalHeight)throw Error('Esta foto não pôde ser processada.');
  async function process(maxSide,quality){
   const scale=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
   const ctx=canvas.getContext('2d');
   if(!ctx)throw Error('Seu navegador não permite preparar a imagem.');
   ctx.fillStyle='#ffffff';
   ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(image,0,0,canvas.width,canvas.height);
   return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Não foi possível preparar a foto.')),'image/jpeg',quality));
  }
  let blob=await process(1800,.82);
  if(blob.size>3145728)blob=await process(1400,.65);
  if(blob.size>3145728)throw Error('A foto ficou muito grande mesmo após a compressão.');
  return blob;
 }finally{if(objectUrl)URL.revokeObjectURL(objectUrl)}
}
function uuid(){
 if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
 throw Error('O envio de fotos requer uma conexão HTTPS segura.');
}
async function upload(event){
 event.preventDefault();
 if(busy)return;
 if(!auth())return notice('Entre com sua conta conectada para publicar fotos.',true);
 if(!chosen)return notice('Primeiro tire uma foto ou selecione uma imagem da galeria.',true);
 const title=$('investPhotoTitle').value.trim();
 const details=$('investPhotoDescription').value.trim();
 if(!title)return notice('Dê um título à fotografia.',true);
 busy=true;submit.disabled=true;submit.textContent='Preparando foto...';
 const owner=uid();
 try{
  const blob=await jpegFromImage(chosen);
  if(owner!==uid()||!auth())throw Error('A conta mudou. Selecione a foto novamente.');
  const path=owner+'/'+uuid()+'.jpg';
  submit.textContent='Enviando foto...';
  await window.OPAccounts.investigationPhotoUpload(path,blob);
  submit.textContent='Criando cartão...';
  // Jogadores publicam imediatamente; o mestre prepara uma pista oculta e pode revelá-la.
  await window.OPAccounts.mysteryRequest('/rest/v1/investigation_clues','POST',{
   title:title.slice(0,100),details:details.slice(0,1500),category:'imagem',
   image_url:null,storage_path:path,visible:!master(),
   revealed_at:master()?null:new Date().toISOString(),created_by:owner
  });
  if(owner!==uid())throw Error('O envio foi concluído, mas a conta mudou.');
  clearPreview();form.reset();
  notice(master()?'Foto guardada como pista oculta. Clique em Revelar para compartilhar.':
   'Foto adicionada ao mural! Você já pode conectá-la a outras evidências.');
  await window.TempusInvestigacao?.atualizar?.();
 }catch(err){
  notice('Não foi possível concluir o envio: '+String(err?.message||err).slice(0,190)+'. Se a foto chegou ao armazenamento, tente publicar novamente.',true);
 }finally{busy=false;submit.disabled=false;submit.textContent='✦ Adicionar foto ao mural'}
}
form.addEventListener('submit',upload);
function hydrate(){
 syncAccount();
 if(!auth())return;
 for(const img of document.querySelectorAll('img[data-investigation-photo]')){
  const path=img.dataset.investigationPhoto||'';
  if(!validPath.test(path))continue;
  if(cache.has(path)){
   img.src=cache.get(path);img.hidden=false;
   continue;
  }
  if(inflight.has(path))continue;
  const account=uid();
  const promise=window.OPAccounts.investigationPhotoDownload(path)
   .then(blob=>{
    if(!blob||!blob.size||blob.size>3145728||blob.type!=='image/jpeg')
     throw Error('A imagem recebida não é uma fotografia JPEG válida.');
    if(!auth()||uid()!==account)return;
    const url=URL.createObjectURL(blob);cache.set(path,url);
    for(const target of document.querySelectorAll('img[data-investigation-photo]')){
     if(target.dataset.investigationPhoto===path){target.src=url;target.hidden=false}
    }
   }).catch(error=>{
    if(!photoCount.has(path)){photoCount.add(path);console.warn('Foto indisponível:',String(error?.message||error).slice(0,100))}
   }).finally(()=>inflight.delete(path));
  inflight.set(path,promise);
 }
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)hydrate()});
setInterval(()=>{syncAccount();if(auth())hydrate()},4000);
setTimeout(hydrate,1000);
syncAccount();
window.TempusFotos={hydrate};
})();