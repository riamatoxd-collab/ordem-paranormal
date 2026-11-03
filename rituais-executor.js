/* Execução de rituais: Custo do Paranormal, efeitos, testes, condições e poderes.
   Dados mecânicos verificáveis das obras; efeitos narrativos exigem decisão do mestre. */
(function(){
'use strict';
const reg=window.OP_RITUAL_EFFECT_REGISTRY||{};
const get=id=>agents.find(c=>c.id===id),safe=s=>esc(String(s??'')),el=id=>document.getElementById(id);
const entries=c=>Array.isArray(c?.activeRitualEffects)?c.activeRitualEffects.filter(x=>x.active!==false):[];
const write=()=>{db();render()};
let cast=null,layer=null;
function skillBonus(c,n){return entries(c).reduce((v,e)=>v+(+e.mods?.skills||0)+(e.mods?.skillName===n?(+e.mods?.skillBonus||0):0),0)}
function attribute(c,key){return Math.max(0,(+c?.attrs?.[key]||0)+entries(c).reduce((n,e)=>n+(e.mods?.attributeKey===key?(+e.mods?.attribute||0):0),0))}
function defenseBonus(c){return entries(c).reduce((v,e)=>v+(+e.mods?.defense||0),0)}
function attackBonus(c){return entries(c).reduce((v,e)=>v+(+e.mods?.attack||0),0)}
function bonusResistance(c){return entries(c).reduce((v,e)=>v+(+e.mods?.ritualResistanceBonus||0),0)}
function addEffect(target,e){
 target.activeRitualEffects=Array.isArray(target.activeRitualEffects)?target.activeRitualEffects.filter(x=>x.active!==false):[];
 target.activeRitualEffects=target.activeRitualEffects.filter(x=>x.source!==e.source||x.casterId!==e.casterId||x.name!==e.name);
 const id='opfx_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 target.activeRitualEffects.push({...e,id,active:true});
 return id;
}
function modifiers(name,index){
 const a={...(reg[name]?.modifiers||{})};
 if(name==='Amaldiçoar Arma')a.weaponExtra=['1d6','2d6','4d6'][index];
 if(name==='Aprimorar Físico'||name==='Aprimorar Mente')a.attribute=[1,2,3][index];
 if(name==='Coincidência Forçada')a.skills=index===2?5:2;
 if(name==='Armadura de Sangue')a.defense=[5,10,15][index];
 if(name==='Embaralhar')a.defense=[6,10,16][index];
 if(name==='Proteção contra Rituais'){a.ritualResistanceBonus=index===2?10:5;a.paranormalDR=index===2?10:5}
 if(name==='Tela de Ruído')a.physicalTempPV=index===2?0:index===1?60:30;
 if(name==='Desfazer Sinapses')a.condition=index===2?'esmorecido':'frustrado';
 if(name==='Arma Atroz'){a.attack=index?5:2;a.criticalMargin=index===2?2:1}
 if(name==='Cinerária'){a.ritualDT=5;a.costReduction=index?2:0;a.maximized=index===2}
 return a;
}
function cpTest(c,cost){
 const a=Math.max(0,Math.floor(+c.attrs?.int||0));
 const rolls=Array.from({length:a||2},()=>1+Math.floor(Math.random()*20));
 const die=a?Math.max(...rolls):Math.min(...rolls),bonus=sb(rank(c,'Ocultismo'))+skillBonus(c,'Ocultismo');
 const total=die+bonus,dt=20+cost,pass=die===20||total>=dt;
 return {rolls,die,bonus,total,dt,pass,permanent:!pass&&dt-total>=5};
}
function afterCast(info){
 const c=get(info.id);if(!c)return;
 if(info.element!=='Medo'){
  const cp=cpTest(c,info.cost);info.cp=cp;
  if(!cp.pass){
   c.sanNow=Math.max(0,(+c.sanNow||0)-info.cost);
   if(cp.permanent){c.permanentSanLoss=(+c.permanentSanLoss||0)+1;c.sanNow=Math.max(0,c.sanNow-1)}
  }
  addHist({agent:c.name,label:'Custo do Paranormal • '+info.name,detail:'Ocultismo '+cp.rolls.join(', ')+' + '+cp.bonus+' = '+cp.total+' contra DT '+cp.dt+(cp.pass?' • sucesso':' • SAN −'+info.cost)+(cp.permanent?' • SAN máxima −1':''),total:cp.total,dt:cp.dt,passed:cp.pass,status:cp.pass?'SUCESSO':'CUSTO DO PARANORMAL',kind:'Ritual'});
 }
 db();open(info);
}
function dialog(){
 if(layer)return layer;
 layer=document.createElement('div');layer.className='op-effect-overlay';layer.hidden=true;layer.id='opEffectOverlay';
 layer.innerHTML='<section class="op-effect-dialog" role="dialog" aria-modal="true" aria-labelledby="opEffectTitle"><header><div><small>O OUTRO LADO • EXECUÇÃO</small><h2 id="opEffectTitle">Resolver ritual</h2></div><button type="button" id="opEffectClose">✕</button></header><div id="opEffectContent"></div></section>';
 document.body.appendChild(layer);
 el('opEffectClose').onclick=close;layer.addEventListener('click',e=>{if(e.target===layer)close()});
 layer.addEventListener('keydown',e=>{if(e.key==='Escape')close()});return layer;
}
function close(){if(layer)layer.hidden=true;cast=null}
function variant(name,extra){
 if(!extra)return {name:'Básico',index:0};
 const found=window.grimoireRitualRules?.(name)?.improvements?.find(x=>x.extra===extra);
 return {name:found?.name||'Aprimorado',index:found?.name==='Discente'?1:2};
}
function open(info){
 const d=dialog();cast=info;d.hidden=false;
 const p=reg[info.name]||{kind:'utilidade',modes:[],formulas:[null,null,null],modifiers:{}};
 const rule=window.grimoireRitualRules?.(info.name)||{},form=variant(info.name,info.extra),initialFormula=p.formulas?.[form.index]||p.formulas?.[0]||'';
 const targets=agents.map(c=>'<option value="'+safe(c.id)+'" '+(c.id===info.id?'selected':'')+'>'+safe(c.name)+(c.id===info.id?' (você)':'')+'</option>').join('');
 const choices=(p.modes||[]).map(x=>'<option>'+safe(x)+'</option>').join('');
 const cp=info.cp,cpText=info.element==='Medo'?'Ritual de Medo: sem teste de Custo do Paranormal.':
  'Ocultismo '+cp.rolls.join(', ')+' → '+cp.total+' / DT '+cp.dt+' • '+(cp.pass?'Sucesso':('Falha: −'+info.cost+' SAN'+(cp.permanent?', −1 SAN máxima':'')));
 el('opEffectTitle').textContent=info.name;
 const summary=window.grimoireRitualInfo?.(info.name)?.summary||'Consulte o efeito e as modalidades no Grimório.';
 el('opEffectContent').innerHTML='<div class="op-effect-tags"><span>'+safe(info.element)+'</span><span>'+safe(form.name)+'</span><span>'+safe(rule.execution||'Execução especial')+'</span><span>'+info.cost+' PE</span></div>'+
 '<p class="op-effect-cp">'+safe(cpText)+'</p><p class="op-effect-summary">'+safe(summary)+'</p>'+
 '<p class="op-effect-note">O mestre define escolhas narrativas e efeitos de resistência parcial. A aplicação numérica só altera personagens desta mesma conta.</p>'+
 '<div class="op-effect-fields"><label>ALVO DA CONJURAÇÃO<select id="opFxTarget">'+targets+'<option value="external">Outro jogador, NPC ou criatura (somente anotação)</option></select></label>'+
 '<label id="opFxExternalWrap" hidden>NOME EXTERNO<input maxlength="80" id="opFxExternal" placeholder="Nome do alvo"></label>'+
 (choices?'<label>MODALIDADE<select id="opFxMode">'+choices+'</select></label>':'')+
 (p.modifiers?.attributeChoice?'<label>ATRIBUTO ALTERADO<select id="opFxAttr">'+p.modifiers.attributeChoice.map(k=>'<option value="'+k+'">'+safe(({agi:'Agilidade',for:'Força',int:'Intelecto',pre:'Presença'})[k])+'</option>').join('')+'</select></label>':'')+
 '<label>FÓRMULA DE DANO, CURA OU PV TRANSFERIDOS<input id="opFxFormula" maxlength="70" placeholder="Ex.: 2d8+2" value="'+safe(info.name==='Transfusão Vital'?'':initialFormula)+'"></label>'+
 '<label>RESISTÊNCIA<select id="opFxRes"><option value="pending">Pendente / mestre decide</option><option value="failed">Falhou</option><option value="passed">Passou</option><option value="none">Voluntário ou sem resistência</option></select></label>'+
 '<div class="op-effect-resist"><button type="button" id="opFxRoll">⚄ Rolar resistência do alvo</button><small id="opFxRollResult">'+safe(rule.resistance||'Sem resistência obrigatória indicada')+'</small></div>'+
 '<label>DECISÕES E OBSERVAÇÕES<textarea id="opFxNotes" rows="2" maxlength="450" placeholder="Área afetada, ordem, aparência, alvo, consequência..."></textarea></label>'+
 '<div class="op-effect-buttons"><button type="button" id="opFxApply">Aplicar efeito</button><button type="button" id="opFxOnly">Apenas registrar</button></div></div>';
 el('opFxTarget').onchange=()=>el('opFxExternalWrap').hidden=el('opFxTarget').value!=='external';
 el('opFxRoll').onclick=rollResistance;
 el('opFxApply').onclick=()=>finish(true);
 el('opFxOnly').onclick=()=>finish(false);
 d.querySelector('#opEffectClose').focus();
}
function rollResistance(){
 if(!cast)return;const t=get(el('opFxTarget').value),c=get(cast.id),rule=window.grimoireRitualRules?.(cast.name)||{};
 const word=String(rule.resistance||'');const skill=/Vontade/i.test(word)?'Vontade':/Fortitude/i.test(word)?'Fortitude':/Reflexos/i.test(word)?'Reflexos':null;
 if(!skill||!t){el('opFxRollResult').textContent='Resistência resolvida pelo mestre.';return}
 const key=skill==='Vontade'?'pre':skill==='Fortitude'?'vig':'agi',a=attribute(t,key);
 const dice=Array.from({length:a||2},()=>1+Math.floor(Math.random()*20)),die=a?Math.max(...dice):Math.min(...dice);
 const total=die+sb(rank(t,skill))+skillBonus(t,skill)+bonusResistance(t),dc=10+Math.ceil((+c.nex||5)/5)+(+c.attrs.pre||0)+entries(c).reduce((v,e)=>v+(+e.mods?.ritualDT||0),0);
 const passed=die===20||total>=dc;
 el('opFxRes').value=passed?'passed':'failed';
 el('opFxRollResult').textContent=skill+' '+dice.join(', ')+' → '+total+' vs DT '+dc+' • '+(passed?'Passou':'Falhou');
 addHist({agent:t.name,label:'Resistência • '+cast.name,detail:skill+' '+dice.join(', ')+' → '+total+' vs DT '+dc,total,dt:dc,passed,status:passed?'SUCESSO':'FALHA',kind:'Resistência'});
}
function rollFormula(raw){
 if(!raw)return null;
 const input=String(raw).replace(/\s/g,'');
 if(!/^\d{1,4}$|^\d{1,2}d\d{1,3}(?:[+-]\d{1,4})?(?:\+\d{1,2}d\d{1,3}(?:[+-]\d{1,4})?)*$/i.test(input))throw Error('Fórmula inválida. Use 2d8+2, 3d6 ou um número.');
 return parseDice(input);
}
function finish(apply){
 if(!cast)return;const c=get(cast.id),targetId=el('opFxTarget').value,target=get(targetId),isExternal=targetId==='external';
 const who=isExternal?String(el('opFxExternal').value||'Alvo externo').trim().slice(0,80):target?.name||c.name;
 if(isExternal&&!who){say('Informe o nome do alvo.');return}
 const p=reg[cast.name]||{kind:'utilidade',formulas:[],modifiers:{}},form=variant(cast.name,cast.extra),mode=el('opFxMode')?.value||'';
 const rule=window.grimoireRitualRules?.(cast.name)||{},duration=String(rule.duration||'Instantânea'),res=el('opFxRes').value,notes=String(el('opFxNotes').value||'').trim().slice(0,450);
 const mods=modifiers(cast.name,form.index);if(mods.attributeChoice)mods.attributeKey=el('opFxAttr').value;
 const resisted=res==='passed',resType=String(rule.resistance||'').toLowerCase(),nullified=resisted&&(resType.includes('anula')||resType.includes('desacredita'));
 let result=null,damage=0,heal=0,transfer=0;
 if(apply&&!nullified&&el('opFxFormula').value.trim()){try{result=rollFormula(el('opFxFormula').value.trim())}catch(e){say(e.message);return}}
 if(result){
  if((p.kind==='dano'&&!(cast.name==='Invadir Mente'&&mode==='Ligação telepática'))||(cast.name==='Chamas do Caos'&&mode.includes('Labareda'))||(cast.name==='Transfigurar Água'&&mode==='Evaporar')||(cast.name==='Transfigurar Terra'&&mode==='Amolecer'))damage=Math.max(0,result.total);
  if(p.kind==='cura'||p.kind==='vitalidade')heal=Math.max(0,result.total);
 }
 if(resisted&&(resType.includes('metade')||['Eletrocussão','Miasma Entrópico','Desfazer Sinapses','Esfolar'].includes(cast.name)))damage=Math.floor(damage/2);
 if(resisted&&cast.name==='Inexistir'&&result){const less=['2d12','3d12','4d12'][form.index];damage=rollFormula(less).total}
 if(resisted&&['Eletrocussão','Miasma Entrópico','Desfazer Sinapses','Esfolar'].includes(cast.name))delete mods.condition;
 if(resisted&&cast.name==='Definhar')mods.condition=form.index===0?'vulnerável':'fatigado';
 if(cast.name==='Hemofagia'&&damage&&c){const healCaster=Math.floor(damage/2);c.pvNow=Math.min(Math.max(0,stats(c).pv-(+c.flageloSpentPV||0)),(+c.pvNow||0)+healCaster)}
 if(cast.name==='Tela de Ruído'&&form.index<2&&target&&apply){target.pvTempPhysical=(+target.pvTempPhysical||0)+[30,60][form.index]}
 if(cast.name==='Cicatrização'&&result&&target)mods.noteAge='Além da cura, o alvo envelhece 1 ano (registrar na história).';
 if(cast.name==='Transfusão Vital'&&result&&target){
  const max=[30,50,100][form.index];transfer=Math.min(Math.max(0,result.total),(+c.pvNow||0)-1,max);heal=transfer;
 }
 if(apply&&!nullified&&target){
  if(damage){const temp=Math.min(+target.pvTemp||0,damage);target.pvTemp=Math.max(0,(+target.pvTemp||0)-temp);target.pvNow=Math.max(0,(+target.pvNow||0)-(damage-temp))}
  if(heal){if(p.kind==='vitalidade')target.pvTemp=(+target.pvTemp||0)+heal;else target.pvNow=Math.min(Math.max(0,stats(target).pv-(+target.flageloSpentPV||0)),(+target.pvNow||0)+heal)}
  if(transfer)c.pvNow=Math.max(1,(+c.pvNow||0)-transfer);
 }
 const lasting=!/instantânea/i.test(duration)||!!mods.condition||!!mods.physicalTempPV,display=(apply&&!nullified),recordTarget=target||c;
 if(display&&lasting){
  // Um ocultista só sustenta um ritual por vez.
  if(/sustentada/i.test(duration))for(const other of agents)for(const ef of entries(other))if(ef.casterId===c.id&&ef.sustain)ef.active=false;
  addEffect(recordTarget,{source:'ritual',casterId:c.id,name:cast.name,element:cast.element,kind:p.kind,duration:(!/instantânea/i.test(duration)?duration:(mods.condition?'Até remover a condição':'Cena')),mode,variant:form.name,mods,notes:notes+(mods.noteAge?' • '+mods.noteAge:''),targetName:who,condition:mods.condition||'',sustain:/sustentada/i.test(duration),sustainPending:false,rounds:/1 rodada/i.test(duration)?1:/2 rodadas/i.test(duration)?2:null,external:isExternal});
 }
 const detail=(apply?'Aplicado':'Conjurado')+' • '+who+' • '+form.name+(mode?' • '+mode:'')+(damage?' • '+damage+' dano':'')+(heal?' • '+heal+' PV':'')+(nullified?' • anulado pela resistência':'')+(notes?' • '+notes:'');
 addHist({agent:c.name,label:cast.name,detail,total:damage||heal||null,dt:null,passed:null,status:apply&&!nullified?'EFEITO REGISTRADO':'EFEITO MANUAL',kind:'Ritual'});
 close();write();
 if(isExternal)say('Registrado: alterações em fichas de outras contas devem ser aplicadas pelo jogador ou mestre.');
}
function activeHtml(c){
 if(!c)return '';const a=entries(c);
 return '<section class="op-effects-panel"><header><div><small>CONTROLE DE CENA</small><h3>EFEITOS DE RITUAIS E PODERES</h3></div><b>'+a.length+' ativos</b></header>'+
 (a.length?a.map(e=>'<div class="op-effect-item"><div><strong>'+safe(e.name)+'</strong><small>'+safe(e.source==='poder'?'Poder':'Ritual')+' • '+safe(e.duration||'Cena')+' • '+safe(e.targetName||c.name)+'</small>'+(e.condition?'<p>Condição: '+safe(e.condition)+'</p>':'')+(e.notes?'<p>'+safe(e.notes)+'</p>':'')+'</div><div>'+((e.sustain&&e.casterId===c.id)?'<button type="button" onclick="RitualEngine.sustain(\''+safe(c.id)+'\',\''+safe(e.id)+'\')">Manter 1 PE</button>':'')+'<button type="button" onclick="RitualEngine.remove(\''+safe(c.id)+'\',\''+safe(e.id)+'\')">Encerrar</button></div></div>').join(''):'<p class="build-muted">Nenhum efeito ativo.</p>')+
 '<small>Efeitos sobre NPCs e jogadores de outras contas são registrados para resolução pelo mestre.</small></section>';
}
function remove(id,eid){const c=get(id),e=entries(c).find(x=>x.id===eid);if(!e)return;e.active=false;addHist({agent:c.name,label:'Encerrado: '+e.name,detail:'Efeito encerrado',status:'FIM DE EFEITO',kind:'Ritual'});write()}
function sustain(id,eid){
 const c=get(id),e=entries(c).find(x=>x.id===eid);if(!e||!e.sustain||e.casterId!==id)return;
 if(!e.sustainPending){say('A manutenção é realizada no início do próximo turno.');return}
 if(!consumePE(c,1,{minCost:1,kind:'ritual'})){e.active=false;say('PE insuficientes. Ritual encerrado.');write();return}
 e.sustainPending=false;addHist({agent:c.name,label:'Sustentar '+e.name,detail:'−1 PE • ação livre',total:1,status:'SUSTENTAÇÃO',kind:'Ritual'});write()
}
function newTurn(id){
 for(const c of agents)for(const e of entries(c))if(e.casterId===id){
  if(e.sustain){if(e.sustainPending)e.active=false;else e.sustainPending=true}if(e.source==='poder'&&e.duration==='Até usar ou encerrar turno')e.active=false;
  if(Number.isInteger(e.rounds)){e.rounds--;if(e.rounds<=0)e.active=false}
 }db()
}
function endScene(id){for(const c of agents){for(const e of entries(c))if(e.casterId===id&&(/cena|sustentada|rodadas?/i.test(e.duration)))e.active=false;if(c.id===id){c.pvTemp=0;c.pvTempPhysical=0}}write()}
function rest(id){const c=get(id);if(!c)return;c.flageloSpentPV=0;addHist({agent:c.name,label:'Descanso • recuperação do Flagelo',detail:'PV anteriormente gastos para rituais podem ser recuperados por descanso conforme a regra da mesa.',status:'DESCANSO',kind:'Habilidade'});write()}
function powerUsed(c,action,cost){
 if(!action)return;const mods={},detail=hist[0]?.detail||'';
 if(action.id==='ataque-especial')mods.attack=5*Math.max(1,cost-1);
 if(action.id==='sentido-tatico')mods.defense=+c.attrs.int||0;
 if(action.id==='campo-protetor')mods.defense=5;
 const note=(action.desc||'')+(action.result==='healing'?' • Cura rolada: aplicar PV ao alvo da habilidade.':'');
 addEffect(c,{source:'poder',casterId:c.id,name:action.name,kind:'aprimoramento',duration:action.onceScene?'Cena':'Até usar ou encerrar turno',targetName:c.name,mods,notes:note});write();
}
const oldCast=window.useKnownRitual;
if(typeof oldCast==='function')window.useKnownRitual=function(id,index,seal=false){
 const c=get(id),ritual=c?.powers?.rituals?.[index],prev=hist[0];if(!ritual)return oldCast(id,index,seal);
 const [name,element,rawCircle]=ritual.split('|'),extra=seal?0:(+el('ritual-extra-'+index)?.value||0);
 oldCast(id,index,seal);
 if(seal||hist[0]===prev||hist[0]?.label!==name||hist[0]?.kind!=='Ritual')return;
 afterCast({id,name,element,circle:+rawCircle||1,extra,cost:+hist[0].total||1});
};
const oldPE=window.renderPEPanel;
if(typeof oldPE==='function')window.renderPEPanel=function(c){return oldPE(c)+activeHtml(c)};
const oldPower=window.usePEAction;
if(typeof oldPower==='function')window.usePEAction=function(id,actionId){
 const c=get(id),action=c&&c.class!=='sobrevivente'?peActionList(c).find(x=>x.id===actionId):null,prev=hist[0];
 oldPower(id,actionId);
 if(c&&action&&prev!==hist[0]&&hist[0]?.kind==='Habilidade')powerUsed(c,action,+hist[0].total||0);
};
const oldTurn=window.newPETurn;
if(typeof oldTurn==='function')window.newPETurn=function(id){oldTurn(id);newTurn(id);render()};
const oldScene=window.endPEScene;
if(typeof oldScene==='function')window.endPEScene=function(id){oldScene(id);endScene(id)};
window.RitualEngine={registry:reg,afterCast,open,close,skillBonus,attribute,defenseBonus,attackBonus,bonusResistance,rollFormula,newTurn,endScene,rest,sustain,remove,activeHtml,cpTest};
})();