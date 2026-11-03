/* Fichas ancestrais — sistema caseiro dos cinco samurais.
   Usa PD independentes dos PE convencionais da Ordem e preserva os dados no Supabase. */
(function(){
 'use strict';
 const colorOf=c=>/^#[a-f0-9]{6}$/i.test(String(c?.samuraiColor||''))?c.samuraiColor:'#a98e6c';
 const escText=s=>esc(String(s??''));
 function findSamurai(id){
  const c=agents.find(c=>c.id===id);
  return c&&c.samuraiSlug&&c.samuraiSheet?c:null;
 }
 function pdMax(c){return Math.max(0,Math.floor(Number(c?.samuraiSheet?.pd)||0))}
 function pdNow(c){return Math.max(0,Math.min(pdMax(c),Math.floor(Number(c?.pdNow??c?.samuraiSheet?.pd)||0)))}
 function rollDice(sides){return 1+Math.floor(Math.random()*sides)}
 function rollPool(n,faces=20){
  const count=Math.min(30,Math.max(1,Math.floor(Number(n)||1)));
  const rolls=Array.from({length:count},()=>rollDice(faces));
  return {rolls,chosen:Math.max(...rolls)};
 }
 function outcome(title,formula,rolls,total,detail,character){
  const box=$('skillRollOverlayContent');
  if(!box)return;
  showSkillRollOverlay();
  box.innerHTML='<div class="skill-roll-top"><div><small>'+escText(character?.name||'Samurai')+' • ARQUIVO ANCESTRAL</small><b id="skillRollOverlayTitle">'+escText(title)+'</b></div><span class="skill-roll-total">'+escText(total)+'</span></div>'
    +'<p class="samurai-roll-formula">'+escText(formula)+'</p>'
    +'<div class="skill-roll-dice">'+rolls.map(v=>'<span class="die">'+escText(v)+'</span>').join('')+'</div>'
    +'<p class="samurai-roll-detail">'+escText(detail)+'</p>';
  addHist({agent:character.name,label:title,detail:formula+' → '+total+' • '+detail,total,dt:null,passed:null,status:'ROLAGEM ANCESTRAL',kind:'Samurai'});
 }
 function rollSkill(id,index){
  const c=findSamurai(id);if(!c)return;
  const sk=c.samuraiSheet.skills?.[index];if(!sk)return;
  const dice=rollPool(sk.dice),bonus=Math.floor(Number(sk.bonus)||0),total=dice.chosen+bonus;
  outcome(sk.name,sk.dice+'d20 + '+bonus,dice.rolls,total,'Maior dado: '+dice.chosen+'. Teste especial da ficha do samurai.',c);
 }
 function rollWeapon(id){
  const c=findSamurai(id);if(!c)return;
  const w=c.samuraiSheet.weapon||{},dice=rollPool(w.dice),bonus=Math.floor(Number(w.bonus)||0),total=dice.chosen+bonus;
  outcome('Ataque • '+(w.name||'Arma'),w.dice+'d20 + '+bonus,dice.rolls,total,
   'Maior dado: '+dice.chosen+' • Crítico: '+(w.critical||'—')+' • Dano: '+(w.damage||'—')+'.',c);
 }
 function rollDamage(id,critical=false){
  const c=findSamurai(id);if(!c)return;
  const w=c.samuraiSheet.weapon||{},parts=Array.isArray(w.damageParts)?w.damageParts:[];
  if(!parts.length){say('Esta arma não possui dados de dano configurados.');return}
  const multiplier=Math.max(2,Math.min(5,Number(String(w.critical||'').split('/x')[1])||2));
  let total=0,all=[],detail=[],formula=[];
  parts.forEach((part,index)=>{
   const amount=Math.min(30,Math.max(1,(Number(part.dice)||1)*(critical&&index===0?multiplier:1)));
   const faces=Math.min(100,Math.max(2,Number(part.faces)||6));
   const values=Array.from({length:amount},()=>rollDice(faces));
   const plus=Number(part.bonus)||0,sum=values.reduce((a,b)=>a+b,0)+plus;
   total+=sum;all.push(...values);
   formula.push(amount+'d'+faces+(plus>=0?' + '+plus:' − '+Math.abs(plus))+' '+String(part.type||''));
   detail.push((part.type||'Dano')+': '+sum);
  });
  outcome((critical?'Crítico':'Dano')+' • '+(w.name||'Arma'),
   formula.join(' + '),all,total,detail.join(' • ')+(critical?' • Crítico '+(w.critical||''):' • Dano normal'),c);
 }
 function adjustPD(id,delta){
  const c=findSamurai(id);if(!c)return;
  const prev=pdNow(c),next=Math.min(pdMax(c),Math.max(0,prev+Math.floor(Number(delta)||0)));
  if(next===prev)return say(next===0?'Não há PD disponíveis.':'PD já estão no máximo.');
  c.pdNow=next;
  addHist({agent:c.name,label:'PD • ajuste de recurso',detail:prev+' → '+next+' PD',total:Math.abs(next-prev),dt:null,passed:null,status:'PD ATUALIZADO',kind:'Samurai'});
  render();
 }
 function activate(id){
  const c=findSamurai(id);if(!c)return;
  const ability=c.samuraiSheet.ability||{},cost=Math.max(0,Number(ability.cost)||0);
  if(pdNow(c)<cost){say('PD insuficientes para '+(ability.name||'habilidade')+'.');return}
  c.pdNow=pdNow(c)-cost;
  addHist({agent:c.name,label:ability.name||'Habilidade ancestral',detail:'−'+cost+' PD • '+(ability.description||'Ativação registrada.'),total:cost,dt:null,passed:null,status:'HABILIDADE ÚNICA',kind:'Samurai'});
  render();say((ability.name||'Habilidade')+' ativada • −'+cost+' PD.');
 }
 function renderSamuraiSheet(){
  const c=current(),sheet=c?.samuraiSheet;
  const paper=$('agentDetail')?.querySelector('.paper-sheet');
  if(!paper||!c?.samuraiSlug||!sheet)return;
  const st=sheet,weapon=st.weapon||{},ability=st.ability||{},pd=pdNow(c),maximum=pdMax(c);
  const skills=Array.isArray(st.skills)?st.skills:[];
  const available=pd>=Number(ability.cost||0);
  const skillButtons=skills.map((s,i)=>'<button class="samurai-quick-skill" type="button" data-agent="'+escText(c.id)+'" data-i="'+i+'" onclick="SamuraiSheet.skill(this.dataset.agent,Number(this.dataset.i))">'
    +'<strong>'+escText(s.name)+'</strong><span>'+escText(s.dice)+'d20 + '+escText(s.bonus)+'</span></button>').join('');
  const addon='<section class="samurai-ancestral-sheet" style="--samurai-color:'+colorOf(c)+'" aria-label="Ficha especial de '+escText(c.name)+'">'
   +'<div class="samurai-ancestral-top"><small>✦ O JURAMENTO DOS CINCO • '+escText(st.element||'Paranormal')+'</small><h3>'+escText(c.concept||c.name)+'</h3>'
   +'<p><strong>Marca na rocha:</strong> '+escText(st.mark||'—')+' · <strong>Ritual:</strong> '+escText(st.order||'—')+'º a tocar a pedra</p>'
   +'<p class="samurai-ancestral-phrase">“'+escText(st.phrase||'')+'”</p></div>'
   +'<div class="samurai-ancestral-vitals">'
   +'<div><small>♥ VIDA</small><strong>'+escText(c.pvNow??st.pv)+' <em>/ '+escText(st.pv)+'</em></strong></div>'
   +'<div><small>✧ DETERMINAÇÃO</small><strong>'+pd+' <em>/ '+maximum+' PD</em></strong></div>'
   +'<div><small>⛨ DEFESA</small><strong>'+escText(st.defense)+'</strong></div>'
   +'<div><small>➤ DESLOCAMENTO</small><strong>'+escText(st.speed)+' m</strong></div></div>'
   +'<div class="samurai-ancestral-pd-controls"><span>Controle de PD</span><button type="button" onclick="SamuraiSheet.pd(\''+escText(c.id)+'\',-1)" aria-label="Gastar 1 PD">−1</button><button type="button" onclick="SamuraiSheet.pd(\''+escText(c.id)+'\',1)" aria-label="Recuperar 1 PD">+1</button><button type="button" onclick="SamuraiSheet.pd(\''+escText(c.id)+'\','+(maximum-pd)+')">↻ Restaurar PD</button></div>'
   +'<div class="samurai-ancestral-ability"><div><small>✦ HABILIDADE ÚNICA • '+escText(st.element||'')+'</small><h4>'+escText(ability.name||'Sem habilidade')+'</h4></div>'
   +'<span class="samurai-ability-cost">'+escText(ability.cost??0)+' PD · '+escText(ability.trigger||'Ativação')+'</span>'
   +'<p>'+escText(ability.description||'')+'</p>'
   +'<button type="button" '+(!available?'disabled':'')+' data-agent="'+escText(c.id)+'" onclick="SamuraiSheet.ability(this.dataset.agent)">✦ Ativar habilidade (−'+escText(ability.cost??0)+' PD)</button></div>'
   +'<div class="samurai-ancestral-grid"><div><h4>⚔ '+escText(weapon.name||'Arma')+'</h4><p>'+escText(weapon.dice)+'d20 + '+escText(weapon.bonus)+' · Crítico '+escText(weapon.critical||'—')+'</p>'
   +'<p>'+escText(weapon.damage||'Dano não informado')+'</p>'
   +'<div class="samurai-weapon-actions"><button type="button" data-agent="'+escText(c.id)+'" onclick="SamuraiSheet.attack(this.dataset.agent)">⚄ Rolar ataque</button>'
   +'<button type="button" data-agent="'+escText(c.id)+'" onclick="SamuraiSheet.damage(this.dataset.agent,false)">⚄ Dano</button>'
   +'<button type="button" data-agent="'+escText(c.id)+'" onclick="SamuraiSheet.damage(this.dataset.agent,true)">✦ Crítico</button></div></div>'
   +'<div><h4>◈ Perícias especiais</h4><div class="samurai-quick-skills">'+skillButtons+'</div></div></div>'
   +'<p class="samurai-ancestral-foot"><strong>Armadura:</strong> '+escText(st.armor||'—')+' · <strong>Personalidade:</strong> '+escText(st.personality||c.personality||'—')+'</p>'
   +'<p class="samurai-ancestral-rule">Ficha personalizada da campanha: os custos das habilidades usam <strong>PD</strong>, separados dos PE tradicionais. As rolagens acima usam exatamente os dados e bônus cadastrados pelo mestre.</p>'
   +'</section>';
  const head=paper.querySelector('.paper-head');
  if(head)head.insertAdjacentHTML('afterend',addon);
 }
 window.SamuraiSheet={skill:rollSkill,attack:rollWeapon,damage:rollDamage,ability:activate,pd:adjustPD};
 const previous=render;
 render=function(){previous();renderSamuraiSheet()};
 renderSamuraiSheet();
})();
