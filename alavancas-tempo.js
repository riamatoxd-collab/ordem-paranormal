/* TEMPUS CUSTODIA — Mecanismo visual das Três Alavancas.
 * A resposta correta permanece exclusivamente no banco.
 * Esta interface usa o sistema seguro de tentativas já existente. */
(function(){
'use strict';
var TITLE='As Três Alavancas do Tempo';
var LABELS=['Passado','Presente','Futuro'];
var sequences=new Map(),remainingById=new Map();
var list=document.getElementById('puzzleList');
if(!list)return;
function matchesTitle(value){
 return String(value||'').trim().toLocaleLowerCase('pt-BR')===TITLE.toLocaleLowerCase('pt-BR');
}
function getSequence(id){return sequences.get(id)||[]}
function machineMarkup(id,playable,solved,remaining){
 var seq=getSequence(id);
 if(solved)seq=[];
 var controls=LABELS.map(function(label){
  var active=seq.includes(label);
  return '<button class="tempo-lever'+(active?' is-pulled':'')+'" type="button" data-tempo-pull="'+id+'" data-tempo-name="'+label+'"'+
   ((!playable||active||seq.length>=3)?' disabled':'')+' aria-label="Puxar alavanca '+label+'">'+
   '<span class="tempo-lever-track" aria-hidden="true"><span class="tempo-lever-stick"></span><span class="tempo-lever-knob"></span></span>'+
   '<span class="tempo-lever-name">'+label+'</span><small>'+(active?'ACIONADA':'INATIVA')+'</small></button>';
 }).join('');
 var slots=[0,1,2].map(function(i){
  return '<span class="tempo-sequence-slot'+(seq[i]?' is-filled':'')+'"><small>'+String(i+1).padStart(2,'0')+'</small><b>'+(seq[i]||'—')+'</b></span>';
 }).join('');
 var action=playable?
  '<form class="mystery-answer-form tempo-mechanism-form" data-puzzle-form="'+id+'">'+
   '<input type="hidden" name="guess" value="'+seq.join(' > ')+'">'+
   '<button type="submit" class="btn primary tempo-confirm"'+(seq.length===3?'':' disabled')+'>✦ Confirmar sequência</button>'+
   '<button type="button" class="btn tempo-clear" data-tempo-reset="'+id+'"'+(seq.length?'':' disabled')+'>↺ Reiniciar</button>'+
   '<small>Restam '+remaining+' tentativa(s). Reiniciar não conta como tentativa.</small></form>':
  '';
 var status=solved?'MEMÓRIA RECUPERADA':seq.length===3?'SEQUÊNCIA PRONTA':'ENGRENAGENS PARADAS';
 var message=solved?
  '<div class="tempo-mechanism-success" role="status">✦ O tempo começa a recuar. Longe dali, no santuário, as peças da armadura de <strong>Masamune Hayato</strong> voltam a se encaixar.</div>':
  (!playable?'<p class="tempo-mechanism-note">'+(id===0?'Prévia do mestre: as alavancas estarão disponíveis quando o enigma for publicado.':remaining===0?'Sem tentativas restantes. Peça uma dica ao mestre.':'Aguardando a vez dos investigadores.')+'</p>':'');
 return '<section class="tempo-mechanism'+(solved?' is-solved':'')+'" data-tempo-machine="'+id+'" aria-label="Mecanismo das três alavancas">'+
  '<div class="tempo-mechanism-head"><span>◷ MECANISMO TEMPORAL</span><strong>'+status+'</strong></div>'+
  '<p class="tempo-mechanism-intro">Três alavancas controlam as engrenagens. Escolha a ordem com base na carta encontrada no dormitório.</p>'+
  '<div class="tempo-levers" role="group" aria-label="Alavancas Passado, Presente e Futuro">'+controls+'</div>'+
  '<div class="tempo-mechanism-caption">ORDEM SELECIONADA</div>'+
  '<div class="tempo-sequence" aria-live="polite" aria-label="Sequência de alavancas">'+slots+'</div>'+
  action+message+'</section>';
}
function mountCard(card){
 var heading=card.querySelector('h3');
 if(!heading||!matchesTitle(heading.textContent)||card.dataset.tempoReady==='1')return;
 var id=Number(String(card.id).replace('puzzleCard',''));
 if(!Number.isInteger(id)||id<=0)return;
 card.dataset.tempoReady='1';
 var form=card.querySelector('form[data-puzzle-form]');
 var solved=!!card.querySelector('.mystery-solved');
 var remaining=0;
 if(form){
  var small=form.querySelector('small');
  var m=String(small?.textContent||'').match(/(\d+)\s+tentativa/i);
  remaining=m?Number(m[1]):0;
  var last=remainingById.get(id);
  if(last!==undefined&&remaining<last)sequences.delete(id);
  remainingById.set(id,remaining);
 }
 var playable=!!form&&!solved;
 card.dataset.tempoPlayable=playable?'1':'0';
 card.dataset.tempoRemaining=String(remaining);
 if(form)form.outerHTML=machineMarkup(id,playable,solved,remaining);
 else card.insertAdjacentHTML('beforeend',machineMarkup(id,false,solved,0));
 if(solved)sequences.delete(id);
}
function mount(){
 list.querySelectorAll('.mystery-puzzle-card').forEach(mountCard);
}
function redraw(card,id){
 var machine=card.querySelector('[data-tempo-machine="'+id+'"]');
 if(!machine)return;
 machine.outerHTML=machineMarkup(id,card.dataset.tempoPlayable==='1',!!card.querySelector('.mystery-solved'),Number(card.dataset.tempoRemaining)||0);
}
list.addEventListener('click',function(event){
 var btn=event.target.closest('[data-tempo-pull],[data-tempo-reset]');
 if(!btn||!list.contains(btn))return;
 var id=Number(btn.dataset.tempoPull||btn.dataset.tempoReset);
 var card=btn.closest('.mystery-puzzle-card');
 if(!card||!Number.isInteger(id)||id<=0||card.dataset.tempoPlayable!=='1')return;
 if(btn.hasAttribute('data-tempo-reset')){sequences.delete(id);redraw(card,id);return}
 var name=btn.dataset.tempoName;
 if(!LABELS.includes(name))return;
 var seq=getSequence(id);
 if(seq.includes(name)||seq.length>=3)return;
 sequences.set(id,seq.concat(name));
 redraw(card,id);
});
var observer=new MutationObserver(mount);
observer.observe(list,{childList:true,subtree:true});
mount();
/* Exibe a mesma aparência na prévia privada do mestre. */
var preview=document.getElementById('puzzleBuilderPreview');
function mountPreview(){
 if(!preview)return;
 var card=preview.querySelector('.mystery-puzzle-card'),title=preview.querySelector('#puzzleDraftTitle');
 var defaultForm=preview.querySelector('.mystery-answer-form');
 if(!card||!title||!defaultForm)return;
 var leverMode=matchesTitle(title.textContent);
 defaultForm.hidden=leverMode;
 var existing=card.querySelector('.tempo-preview');
 if(leverMode&&!existing){
  var box=document.createElement('div');box.className='tempo-preview';
  box.innerHTML=machineMarkup(0,false,false,8);
  card.appendChild(box);
 }else if(!leverMode&&existing){existing.remove()}
}
if(preview){
 var previewObserver=new MutationObserver(mountPreview);
 previewObserver.observe(preview,{childList:true,subtree:true});
 mountPreview();
}
})();