/* Interface adicional — mantém o motor original de Ordem Paranormal. */
(function(){
 const nav=document.querySelector('.nav');
 const masterBtn=document.createElement('button');
 masterBtn.dataset.view='mestre';masterBtn.textContent='♜  Painel do Mestre';nav.appendChild(masterBtn);
 const main=document.querySelector('main');
 const master=document.createElement('section');master.className='view';master.id='v-mestre';
 master.innerHTML='<div class="section" style="margin-top:0"><div><div class="eyebrow">REGISTRO DA MESA</div><h2>Painel do Mestre</h2><p>Atividades registradas neste navegador. Outros dispositivos não são sincronizados.</p></div></div><div class="master-summary" id="masterSummary"></div><div class="master-filters"><label>Agente <select id="masterAgent"></select></label><label>Tipo <select id="masterKind"><option value="todos">Todos</option><option value="poderes">Poderes e rituais</option><option value="testes">Testes e combate</option></select></label></div><div class="list" id="masterLog"></div>';
 const footer=main.querySelector('.foot');main.insertBefore(master,footer);
 masterBtn.addEventListener('click',()=>{document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));master.classList.add('active');document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x===masterBtn));$('title').textContent='Painel do Mestre';if(typeof stopVoidAudio==='function')stopVoidAudio();renderMaster()});
 $('masterAgent').addEventListener('change',renderMaster);$('masterKind').addEventListener('change',renderMaster);
 function isPower(h){return ['Ritual','Habilidade','Poder'].includes(h.kind)||/CONJURADO|SELO CRIADO|HABILIDADE/i.test(h.status||'')}
 function renderMaster(){
  const sel=$('masterAgent'),old=sel.value;sel.innerHTML='<option value="todos">Todos os agentes</option>'+agents.map(c=>'<option value="'+esc(c.name)+'">'+esc(c.name)+'</option>').join('');
  if([...sel.options].some(o=>o.value===old))sel.value=old;
  const all=hist.filter(h=>sel.value==='todos'||h.agent===sel.value);
  const power=all.filter(isPower);
  const mode=$('masterKind').value;
  const rows=all.filter(h=>mode==='poderes'?isPower(h):mode==='testes'?!isPower(h):true);
  $('masterSummary').innerHTML='<div class="master-stat"><small>AGENTES</small><b>'+agents.length+'</b></div><div class="master-stat"><small>REGISTROS</small><b>'+all.length+'</b></div><div class="master-stat"><small>PODERES / RITUAIS</small><b>'+power.length+'</b></div>';
  $('masterLog').innerHTML=rows.map(h=>'<article class="master-entry"><div><strong>'+esc(h.agent||'Agente')+'</strong><span class="master-kind">'+esc(h.kind||'Ação')+'</span><div class="master-label">'+esc(h.label||'Ação')+'</div><small>'+esc(h.detail||'')+'</small></div><time>'+esc(h.time||'')+'</time></article>').join('')||'<div class="empty">Nenhuma atividade neste filtro.</div>';
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
  const powers=[...(c.powers?.class||[]),...(c.powers?.paranormal||[])];
  const rituals=(c.powers?.rituals||[]).map(entry=>{const parts=String(entry).split('|');return {name:parts[0],element:parts[1]||'Paranormal',circle:parts[2]||'1'}});
  const inventory=Array.isArray(c.inventory)?c.inventory:[];
  const powerHtml=powers.length?powers.map(name=>'<div class="sheet-entry"><span class="sheet-symbol">✦</span><strong>'+esc(name)+'</strong></div>').join(''):'<p class="sheet-empty">Nenhum poder registrado.</p>';
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
  el.innerHTML='<div class="paper-sheet paper-v2"><div class="sheet-ornament" aria-hidden="true">✿　✦　鳥居　✦　✿</div><div class="paper-head"><div><small>ORDEM PARANORMAL • FICHA DE AGENTE</small><h2>'+esc(c.name)+'</h2><p>'+esc(c.origin||'Origem não definida')+' • '+esc(className(c.class))+'</p></div><div class="paper-nex">NEX <strong>'+esc(c.nex||0)+'%</strong></div></div><div class="paper-columns"><div><div class="paper-caption">ATRIBUTOS <small>CLIQUE PARA ROLAR</small></div><div class="paper-attributes"><div class="paper-core">✣<span>ATRIBUTOS</span></div>'+attrHtml+'</div><div class="paper-resources">'+resource('pv','PONTOS DE VIDA',c.pvNow,st.pv)+resource('pe','PONTOS DE ESFORÇO',(+c.peNow||0)+(+c.peTemp||0),st.pe)+resource('san','SANIDADE',c.sanNow,st.san)+resource('def','DEFESA BASE',10+(+c.attrs.agi||0),null)+'</div><div class="paper-shortcuts"><button class="btn small" onclick="openModal(\''+esc(c.id)+'\')">Editar ficha</button></div></div><div>'+skillHudHtml+'</div></div><div class="sheet-pe-overview"><span>PE DISPONÍVEL <b>'+((+c.peNow||0)+(+c.peTemp||0))+'</b></span><span>GASTO NO TURNO <b>'+(+c.peSpentTurn||0)+'</b> / '+peLimitFor(c)+'</span></div><section class="sheet-block sheet-pe-block"><h3>✧ HABILIDADES COM CUSTO DE PE <small>'+peActions.length+'</small></h3><div class="sheet-pe-list">'+peHtml+'</div></section><div class="sheet-lower"><section class="sheet-block"><h3>✦ PODERES & HABILIDADES <small>'+powers.length+'</small></h3><div class="sheet-scroll">'+powerHtml+'</div><button class="btn small" onclick="view(\'occult\')">Gerenciar poderes</button></section><section class="sheet-block"><h3>◈ RITUAIS <small>'+rituals.length+'</small></h3><div class="sheet-scroll">'+ritualHtml+'</div><div class="sheet-add"><select id="sheetRitualChoice" aria-label="Ritual para aprender"></select><button class="btn small primary" onclick="sheetLearnRitual()">+ Aprender</button></div></section><section class="sheet-block"><h3>▣ EQUIPAMENTO & INVENTÁRIO <small>'+inventory.length+'</small></h3><div class="sheet-scroll">'+invHtml+'</div><div class="sheet-add"><select id="sheetItemPreset" aria-label="Modelo de equipamento" onchange="sheetSelectPreset(this.value)"><option value="">Item personalizado</option></select><input id="sheetItemName" placeholder="Nome do equipamento" maxlength="100" aria-label="Nome do equipamento"><input id="sheetItemQty" type="number" min="1" max="999" value="1" aria-label="Quantidade"><label class="sheet-weapon-check"><input id="sheetItemWeapon" type="checkbox"> Arma</label><button class="btn small primary" onclick="sheetAddItem()">+ Adicionar</button></div></section><section class="sheet-block"><h3>⚔ ATAQUES & COMBATE <small>'+weapons.length+'</small></h3><div class="sheet-scroll">'+combatHtml+'</div><div class="sheet-add"><label class="sheet-defense">Defesa do alvo <input id="sheetTargetDefense" type="number" min="0" max="999" value="15"></label><label class="sheet-defense">Distância <select id="sheetTargetRange"><option value="curto">Curto</option><option value="medio">Médio</option><option value="longo">Longo</option><option value="extremo">Extremo</option></select></label></div><div id="sheetCombatResult" class="sheet-combat-result" aria-live="polite"></div></section></div><div class="paper-bottom">A MALDIÇÃO DOS SETE ANJOS <span>REGISTRO PARANORMAL</span></div></div><details class="paper-technical"><summary>Ficha técnica, controles e informações adicionais</summary><div class="paper-original">'+original+'</div></details>';
  const presetSelect=$('sheetItemPreset');if(presetSelect)presetSelect.innerHTML='<option value="">Item personalizado</option>'+INVENTORY_PRESETS.map((p,i)=>'<option value="'+i+'">'+esc(p.name)+'</option>').join('');
  const ritualSelect=$('sheetRitualChoice');
  if(ritualSelect){const known=c.powers?.rituals||[],slots=ritualSlotCount(c.class,c.nex,c.trail,c.powers?.paranormal||[],c.attrs.int),eligible=known.length<slots?availableRitualsFor(c).filter(r=>!known.includes(ritualValue(r))):[];ritualSelect.innerHTML=eligible.map(r=>'<option value="'+esc(ritualValue(r))+'">'+esc(r[0])+' • '+r[1]+'º círculo</option>').join('')||'<option value="">Sem rituais disponíveis</option>'}
  renderSkillHudList();
 }
 window.sheetLearnRitual=function(){const value=$('sheetRitualChoice')?.value,select=$('grimoireNewRitual');if(!value||!select){say('Nenhum ritual disponível.');return}select.value=value;addKnownRitualFromPage()};
 window.sheetRemoveRitual=function(index){const c=current();if(!c?.powers?.rituals?.[index])return;if(!confirm('Remover este ritual da ficha?'))return;c.powers.rituals.splice(index,1);db();render()};
 window.sheetUsePE=function(actionId){
  const c=current(),a=c&&peActionList(c).find(x=>x.id===actionId);if(!c||!a)return;
  const sheet=$('sheet-pe-'+a.id),target=$((a.mode==='cost'?'pe-cost-':'pe-param-')+a.id);
  if(sheet&&target)target.value=sheet.value;
  usePEAction(c.id,a.id);
  renderPaper();
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
