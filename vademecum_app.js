(()=>{'use strict';
const D=window.VADE_DRUGS||[],$=id=>document.getElementById(id),fmt=x=>Number(x).toLocaleString('es-ES',{maximumFractionDigits:3}),norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');let current='';let lastCopy='';const favKey='vademecum_favoritos_v1';let favorites=new Set();try{favorites=new Set(JSON.parse(localStorage.getItem(favKey)||'[]').filter(x=>typeof x==='string'))}catch(_){favorites=new Set()}let onlyFavorites=false;function saveFaves(){try{localStorage.setItem(favKey,JSON.stringify([...favorites]))}catch(_){}}function toggleFav(id){if(favorites.has(id))favorites.delete(id);else favorites.add(id);saveFaves();renderList();if(current===id)refreshDetailStar()}function makeStar(id){const b=element('button','starBtn'+(favorites.has(id)?' isFav':''),favorites.has(id)?'★':'☆');b.type='button';b.title=favorites.has(id)?'Quitar de favoritos':'Añadir a favoritos';b.setAttribute('aria-label',(favorites.has(id)?'Quitar de favoritos: ':'Añadir a favoritos: ')+(D.find(x=>x.id===id)?.name||id));b.setAttribute('aria-pressed',String(favorites.has(id)));b.onclick=(ev)=>{ev.stopPropagation();toggleFav(id)};return b}function refreshDetailStar(){const target=document.getElementById('detailStar');if(target){const fresh=makeStar(current);fresh.id='detailStar';target.replaceWith(fresh)}}
const element=(tag,cl,t)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(t!==undefined)e.textContent=t;return e};
for(const g of [...new Set(D.map(d=>d.group))].sort((a,b)=>a.localeCompare(b,'es'))){let o=document.createElement('option');o.value=g;o.textContent=g;$('drugGroup').append(o)}
function renderList(){const term=norm($('drugSearch').value.trim()),gr=$('drugGroup').value,st=$('drugStatus').value;const matches=D.filter(d=>(!term||norm([d.name,d.brand,d.group,d.indication].join(' ')).includes(term))&&(!gr||d.group===gr)&&(!st||(st==='ready'?d.reviewed:!d.reviewed))&&(!onlyFavorites||favorites.has(d.id)));$('drugCount').textContent=matches.length+' de '+D.length+' medicamentos';matches.sort((a,b)=>a.name.localeCompare(b.name,'es',{sensitivity:'base'}));const host=$('drugList');host.replaceChildren();for(const d of matches){const row=element('div','drugRow');const btn=element('button','drugBtn'+(d.id===current?' active':''));btn.type='button';const name=element('strong','',d.name);if(d.reviewed)name.append(element('span','dot','●'));btn.append(name,element('small','',d.brand+(d.reviewed?'':' · Pendiente de validación')));btn.onclick=()=>show(d.id,true);row.append(btn,makeStar(d.id));host.append(row)}if(!matches.length)host.append(element('p','blank','Sin coincidencias.'))}
function emptyDetail(){const e=$('drugDetail');e.replaceChildren();const b=element('div','emptyDetail');b.append(element('div','', '💊'),element('h2','','Selecciona un medicamento'),element('p','','Elige una ficha en la lista de la izquierda o utiliza el buscador. No se carga ningún fármaco de inicio.'));e.append(b)}
// v35 · Fichas de perfusión de consulta rápida.
function specialDisclosure(title,content,cls=''){
  const wrap=element('details','specialDisclosure '+cls);
  wrap.append(element('summary','',title));
  const body=element('div','specialDisclosureBody');
  if(typeof content==='string')body.append(element('p','',content));
  else if(content)body.append(content);
  wrap.append(body);return wrap;
}
function specialSources(d){
  const content=element('div','sourceLinks');
  for(const [label,url] of d.sources||[]){
    const a=element('a','',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';content.append(a);
  }
  if(!(d.sources||[]).length)content.append(element('p','','Sin fuentes verificadas.'));
  if(d.sourcesNotes)content.append(element('p','sourceNote',d.sourcesNotes));
  if(d.id==='solinitrina_fuerte')content.append(element('p','sourceNote','La dilución predeterminada de 200 µg/ml corresponde a la preparación local indicada como validada. La ficha técnica propone la alternativa de 100 µg/ml.'));
  if(d.id==='dopamina')content.append(element('p','sourceNote','La preparación seleccionada de 4 mg/ml es más concentrada que las diluciones de referencia descritas en la ficha técnica; requiere comprobación conforme al procedimiento local.'));
  return specialDisclosure('Fuentes',content,'sourcesDisclosure');
}
// Noradrenalina B. Braun · base/bitartrato · volumen final libre según preparación real.
// No hay dilución hospitalaria predeterminada: requiere consignar un volumen final explícito.
// V38 · componentes clínicos específicos y tablas seleccionables.
function createDoseCards(d){
 const host=element('section','specialInfusion doseCards');host.append(element('h3','specialTitle','Pautas de administración'));
 for(const item of d.special.cards||[]){
  const card=element('div','amioStage clinicalStage'),line=element('div','v38DoseLine'),heading=element('div','');heading.append(element('b','',item.title));if(item.subtitle)heading.append(element('strong','v38DoseText',item.subtitle));line.append(heading);
  let order=item.copy||'';const simpleBolus=['adenosina','metoprolol','verapamilo','digoxina','magnesio_iv'];const b=simpleBolus.includes(d.id)?null:copyButton('Copiar',()=>order);if(b)b.disabled=!order;
  if(item.choices){const options=element('div','v38DoseChoices');item.choices.forEach((choice,i)=>{const c=element('button','preparationButton'+(i===0?' active':''),choice.label);c.type='button';c.setAttribute('aria-pressed',i===0?'true':'false');if(i===0)order=choice.copy;c.onclick=()=>{order=choice.copy;for(const child of options.children){const active=child===c;child.classList.toggle('active',active);child.setAttribute('aria-pressed',String(active))}};options.append(c)});line.append(options);if(b)b.disabled=false}
  card.append(line);if(b)card.append(b);host.append(card)
 }
 return host;
}
function makeTable(headings){const wrap=element('div','specialTableScroll'),table=element('table','specialTable');const thead=document.createElement('thead'),tr=document.createElement('tr');for(const h of headings){const th=document.createElement('th');th.scope='col';th.textContent=h;tr.append(th)}thead.append(tr);table.append(thead);const body=document.createElement('tbody');table.append(body);wrap.append(table);return {wrap,table,body}}
function addTableChoice(td,label,onClick,aria){const b=element('button','cellChoice',label);b.type='button';b.setAttribute('aria-label',aria||label);b.onclick=()=>onClick(b);td.append(b);return b}
function selectCell(table,btn){table.querySelectorAll('.cellChoice.chosen').forEach(x=>x.classList.remove('chosen'));btn.classList.add('chosen')}
function v38Info(parent,text,cls='small'){parent.append(element('p',cls,text))}

function createLevosimendan(d){
 const host=element('section','specialInfusion levoProgram');host.append(element('h3','specialTitle','Preparación de la perfusión'),element('div','selectedPreparation'));
 const prep=host.querySelector('.selectedPreparation');prep.append(element('strong','','12,5 mg (5 ml) en 250 ml finales de SG 5 %'),element('span','selectedConcentration','50 µg/ml'),element('p','small','Una única concentración. Si se requieren dos viales, 25 mg (10 ml) en 500 ml finales: también 50 µg/ml.'));
 const controls=element('div','weightControls'),lab=element('label','','Peso del paciente (kg)'),weight=element('input','control');weight.type='number';weight.min='20';weight.max='250';weight.step='0.1';weight.value='70';lab.append(weight);controls.append(lab);host.append(controls);
 const panel=element('div','v38SelectedPlan'),loadChoose=element('div','v38DoseChoices'),maintChoose=element('div','v38DoseChoices');
 let load=0,rate=0.1;panel.append(element('b','','Pauta seleccionada'),element('p','small','Dosis de carga (10 min)'));
 for(const opt of [0,6,12]){const b=element('button','preparationButton',opt===0?'Sin carga':opt+' µg/kg');b.type='button';b.onclick=()=>{load=opt;render()};b.dataset.value=String(opt);loadChoose.append(b)}panel.append(loadChoose,element('p','small','Mantenimiento (24 h)'));
 for(const opt of [0.05,0.1,0.2]){const b=element('button','preparationButton',es(opt)+' µg/kg/min');b.type='button';b.dataset.value=String(opt);b.onclick=()=>{rate=opt;render()};maintChoose.append(b)}panel.append(maintChoose);
 const result=element('div','selectedPreparation'),warning=element('div','v38BagWarning'),copy=copyButton('Copiar',()=>makeOrder());panel.append(result,warning,copy);host.append(panel);
 const area=element('div','infusionTableArea');host.append(area);
 function totalMg(w){return w*load/1000+w*rate*60*24/1000}
 function makeOrder(){const w=Number(weight.value);if(!(w>=20&&w<=250))return '';const t=totalMg(w),mg=t>12.5?25:12.5,vol=t>12.5?500:250;if(t>25)return ''; 
  return `Levosimendán: ${es(mg)} mg en ${es(vol)} ml finales de SG 5 % (50 µg/ml). ${load>0?'Carga '+es(load)+' µg/kg ('+es(load*w/1000)+' mg) durante 10 min a '+es(load*w*6/50)+' ml/h; ':'Sin dosis de carga; '}mantenimiento ${es(rate)} µg/kg/min a ${es(rate*w*60/50)} ml/h durante 24 h para ${es(w)} kg. Requiere ${es(t)} mg en total (${es(t*20)} ml). ${t>25?'La cantidad supera 25 mg; preparar una bolsa adicional y verificar estabilidad.':''}`;
 }
 function render(){const w=Number(weight.value),valid=w>=20&&w<=250;copy.disabled=!valid;
  [...loadChoose.children].forEach(b=>{const on=Number(b.dataset.value)===load;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
  [...maintChoose.children].forEach(b=>{const on=Number(b.dataset.value)===rate;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
  if(!valid){result.textContent='Indica un peso entre 20 y 250 kg.';warning.textContent='';return}
  const t=totalMg(w),vol=t*20,bag=t<=12.5?250:500,vials=t<=12.5?1:t<=25?2:Math.ceil(t/12.5);copy.disabled=t>25;result.replaceChildren();result.append(element('strong','',`Carga: ${load?' '+es(load*w/1000)+' mg a '+es(load*w*6/50)+' ml/h durante 10 min':'sin carga'} · Mantenimiento: ${es(rate*w*60/50)} ml/h`),element('p','small',`Total estimado 24 h + carga: ${es(t)} mg (${es(vol)} ml a 50 µg/ml).`));
  warning.replaceChildren();if(t>25)warning.append(element('b','','Necesitas más de dos viales'),element('p','','Planificar '+vials+' viales, con preparaciones adicionales a 50 µg/ml, de acuerdo con estabilidad y protocolo local.'));else if(t>12.5)warning.append(element('b','','Se necesitan dos viales: cambiar a 25 mg en 500 ml finales de SG 5 %.'),element('p','','La concentración se mantiene en 50 µg/ml, por lo que no cambian las velocidades.'));else warning.append(element('p','','Un vial de 12,5 mg en 250 ml es suficiente para la pauta calculada.'));
  area.replaceChildren();area.append(element('h4','','Tabla de carga · 10 minutos'),element('p','specialUnitLabel','Pulsar una celda selecciona la dosis de carga · velocidades en ml/h'));
  const weights=[...new Set([60,70,80,90,100,w])].sort((a,b)=>a-b);
  const ltab=makeTable(['Peso','6 µg/kg','12 µg/kg']);for(const wt of weights){const tr=document.createElement('tr'),th=document.createElement('th');th.textContent=es(wt)+' kg';tr.append(th);for(const n of [6,12]){const td=document.createElement('td');addTableChoice(td,es(n*wt*6/50),()=>{weight.value=String(wt);load=n;render()},`Carga ${n} µg/kg en 10 minutos para ${wt} kg`);tr.append(td)}ltab.body.append(tr)}area.append(ltab.wrap);
  area.append(element('h4','','Tabla de mantenimiento · 24 horas'),element('p','specialUnitLabel','Dosis en µg/kg/min; resultados en ml/h, misma concentración 50 µg/ml'));
  const tab=makeTable(['Peso','0,05','0,1','0,2']);for(const wt of weights){const tr=document.createElement('tr'),th=document.createElement('th');th.textContent=es(wt)+' kg';tr.append(th);for(const n of [0.05,0.1,0.2]){const td=document.createElement('td');addTableChoice(td,es(n*wt*60/50),()=>{weight.value=String(wt);rate=n;render()},`Mantenimiento ${es(n)} µg/kg/min para ${wt} kg`);tr.append(td)}tab.body.append(tr)}area.append(tab.wrap);
 }
 weight.oninput=render;render();
 v38Info(host,'Reevaluar hemodinámica a los 30–60 min y tras ajustes: hipotensión o taquicardia → reducir a 0,05 µg/kg/min o suspender; si bien tolerado y precisa mayor efecto → hasta 0,2. Duración de mantenimiento: 24 h.');
 return host;
}
function createEsmolol(d){
 const host=element('section','specialInfusion esmololProgram');host.append(element('h3','specialTitle','Administración y velocidades de perfusión'));
 const prep=element('div','selectedPreparation');prep.append(element('strong','','Brevibloc, solución lista para perfusión · 2.500 mg/250 ml'),element('span','selectedConcentration','10 mg/ml'),element('p','small','No confundir con el concentrado de 2.500 mg que debe diluirse.'));host.append(prep);
 const controls=element('div','weightControls'),lab=element('label','','Peso del paciente (kg)'),input=element('input','control');input.type='number';input.min='20';input.max='250';input.value='70';input.step='0.1';lab.append(input);controls.append(lab);host.append(controls);
 const load=element('div','esmololBlock'),maint=element('div','esmololBlock');host.append(load,maint);
 load.append(element('h4','','Carga opcional · 500 µg/kg durante 1 minuto'));
 const loadResult=element('div','selectedPreparation esmololResult'),loadCopy=copyButton('Copiar carga',()=>{const w=Number(input.value);return w>=20&&w<=250?`Esmolol: carga opcional de ${es(w*.5)} mg IV (${es(w*.05)} ml a 10 mg/ml), durante 1 minuto. Peso: ${es(w)} kg.`:''});
 load.append(loadResult,loadCopy);
 maint.append(element('h4','','Perfusión de mantenimiento'),element('p','specialUnitLabel','Dosis en µg/kg/min · Velocidad en ml/h · Concentración 10 mg/ml'));
 const table=makeTable(['Peso','50','100','150','200']);maint.append(table.wrap);
 const maintResult=element('div','selectedPreparation esmololResult'),maintCopy=copyButton('Copiar mantenimiento',()=>{const w=Number(input.value);return w>=20&&w<=250?`Esmolol: Brevibloc 2.500 mg en 250 ml (10 mg/ml), perfusión IV a ${es(selectedDose*w*.006)} ml/h (${es(selectedDose)} µg/kg/min para ${es(w)} kg).`:''});maint.append(maintResult,maintCopy);
 let selectedDose=50;
 function render(){const w=Number(input.value),ok=input.value.trim()!==''&&w>=20&&w<=250;loadCopy.disabled=maintCopy.disabled=!ok;
  loadResult.textContent=ok?`Dosis: ${es(w*.5)} mg · Volumen: ${es(w*.05)} ml (10 mg/ml)`:'Introduce un peso entre 20 y 250 kg.';
  table.body.replaceChildren();maintResult.textContent=ok?`Mantenimiento: ${es(selectedDose)} µg/kg/min → ${es(selectedDose*w*.006)} ml/h`:'Introduce un peso válido.';
  if(!ok)return;
  const tr=table.body.insertRow(),th=document.createElement('th');th.scope='row';th.textContent=es(w)+' kg';tr.append(th);
  for(const n of [50,100,150,200]){const td=tr.insertCell(),b=addTableChoice(td,es(n*w*.006),()=>{selectedDose=n;render()},`${n} µg/kg/min para ${es(w)} kg`);if(n===selectedDose)b.classList.add('chosen')}
 }
 input.addEventListener('input',render);render();return host;
}
function createFurosemide(d){
 const host=element('section','specialInfusion furosemideProgram');host.append(element('h3','specialTitle','Perfusión continua'));
 const panel=element('div','selectedPreparation');panel.append(element('strong','','Furosemida 250 mg en 250 ml finales de SF 0,9 %'),element('span','selectedConcentration','1 mg/ml'),element('p','small','Perfusión mediante bomba; la presentación 250 mg/25 ml no se administra en bolo IV.'));host.append(panel);
 const choice=selectedOrderBox(),tbl=makeTable(['Dosis (mg/h)','Velocidad (ml/h)']);for(const mg of [5,10,15,20,30,40]){const tr=document.createElement('tr'),th=document.createElement('th');th.textContent=mg+' mg/h';tr.append(th);const td=document.createElement('td');addTableChoice(td,mg.toString(),b=>{selectCell(tbl.table,b);choice.setOrder(`Furosemida 250 mg en 250 ml finales de SF 0,9 % (1 mg/ml), perfusión IV a ${mg} ml/h (${mg} mg/h).`)});tr.append(td);tbl.body.append(tr)}host.append(tbl.wrap,choice);
 return host;
}
function createNoradrenalineInfusion(d){
 const host=element('section','specialInfusion noradInfusion');host.append(element('h3','specialTitle','Preparación de la perfusión'));
 host.append(element('div','selectedPreparation','5 mg de noradrenalina BASE = 10 mg de noradrenalina bitartrato'));
 const buttons=element('div','preparationOptions');const preps=[{amountMg:10,volumeMl:100,label:'10 mg BASE / 100 ml',conc:100},{amountMg:20,volumeMl:100,label:'20 mg BASE / 100 ml',conc:200}];let i=0,full=false;
 const area=element('div','infusionTableArea'),wrap=element('div','weightControls'),lab=element('label','','Peso (kg)'),weight=element('input','control');weight.type='number';weight.min='20';weight.max='250';weight.value='70';weight.step='0.1';lab.append(weight);wrap.append(lab);host.append(buttons,wrap,area);
 const order=selectedOrderBox();host.append(order);for(const [n,p] of preps.entries()){const b=element('button','preparationButton',p.label);b.type='button';b.onclick=()=>{i=n;order.setOrder('');render()};buttons.append(b)};
 function render(){const w=Number(weight.value),p=preps[i],ok=w>=20&&w<=250;for(const [n,b] of [...buttons.children].entries()){b.classList.toggle('active',n===i);b.setAttribute('aria-pressed',String(n===i))}area.replaceChildren();area.append(element('p','selectedConcentration',p.conc+' µg/ml BASE · SG 5 % preferente según producto'));
 if(!ok){area.append(element('p','weightWarning','Introduce peso entre 20–250 kg.'));order.setOrder('');return}
 const table=makeTable(['Peso','0,02','0,05','0,1','0,2','0,3','0,5','0,75','1']);const doses=[.02,.05,.1,.2,.3,.5,.75,1];const tr=document.createElement('tr'),th=document.createElement('th');th.textContent=es(w)+' kg';tr.append(th);for(const dose of doses){const td=document.createElement('td'),rate=dose*w*60/p.conc;addTableChoice(td,es(rate),b=>{selectCell(table.table,b);order.setOrder(`Noradrenalina BASE ${p.amountMg} mg en 100 ml finales de SG 5 % (${p.conc} µg/ml BASE), perfusión IV a ${es(rate)} ml/h (${es(dose)} µg/kg/min de BASE para ${es(w)} kg).`)});tr.append(td)}table.body.append(tr);area.append(table.wrap)}weight.oninput=()=>{order.setOrder('');render()};render();
 const note=element('p','small','Cambio de etiquetado (2022): la expresión de cantidad pasó de bitartrato a BASE, sin modificar la cantidad real de noradrenalina.');host.append(note);
 return host;
}

// v51: SSH as its own validated-warning workflow, separate from furosemide.
function createSSHProgram(d){
 const host=element('section','specialInfusion sshProgram');host.append(element('h3','specialTitle','Preparación local de SSH · volumen final 150 ml'));
 const rows=[{id:'low',range:'<125 mEq/l',amp:'3 ampollas',volume:30,percent:'4,72 %'},{id:'mid',range:'125–135 mEq/l',amp:'2 ampollas',volume:20,percent:'3,45 %'},{id:'norm',range:'136–145 mEq/l',amp:'1 ampolla',volume:10,percent:'2,17 %'},{id:'high',range:'>145 mEq/l',amp:'½ ampolla',volume:5,percent:'1,54 %'}];
 let row=rows[1],furo=250,time=60;
 const table=makeTable(['Na plasmático','Concentración de SSH · seleccionar','NaCl 20 %']);
 const buttons=[];
 for(const item of rows){const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=item.range;tr.append(th);const td=document.createElement('td'),b=addTableChoice(td,item.percent,()=>{row=item;render();},'Elegir SSH '+item.percent+' para Na '+item.range);buttons.push([item,b]);tr.append(td);const ex=document.createElement('td');ex.textContent=item.amp+' ('+item.volume+' ml)';tr.append(ex);table.body.append(tr)}
 host.append(table.wrap);
 const controls=element('div','sshControls');const furoBox=element('div','sshSelector'),timeBox=element('div','sshSelector');furoBox.append(element('b','','Furosemida IV por administración'));timeBox.append(element('b','','Duración de la perfusión de SSH'));
 const fuButtons=[],tButtons=[];const fuPanel=element('div','preparationOptions'),tPanel=element('div','preparationOptions');
 for(const amount of [250,500]){const b=element('button','preparationButton',amount+' mg');b.type='button';b.onclick=()=>{furo=amount;render()};fuPanel.append(b);fuButtons.push([amount,b])}
 for(const n of [30,60]){const b=element('button','preparationButton',n+' min');b.type='button';b.onclick=()=>{time=n;render()};tPanel.append(b);tButtons.push([n,b])}
 furoBox.append(fuPanel);timeBox.append(tPanel);controls.append(furoBox,timeBox);host.append(controls);
 const chosen=element('div','selectedPreparation'),alert=element('p','v51SafetyWarning'),order=element('div','v51Order'),btn=copyButton('Copiar pauta',()=>order.dataset.copy||'');chosen.append(element('strong','','Preparación seleccionada'),order,alert,btn);host.append(chosen);
 host.append(element('p','small','El tiempo seleccionado corresponde al SSH. La furosemida requiere una perfusión separada y más lenta, acorde con la ficha técnica; no se ha confirmado compatibilidad de conexión en Y.'));
 const extra=specialDisclosure('Monitorización y límites del protocolo', 'Valorar natremia de forma seriada según riesgo, K/Cl/Mg, función renal, diuresis y balance, PA y congestión. Las concentraciones son las definidas para el protocolo local; verificar con Farmacia la preparación y cualquier posibilidad de administración en Y.','clinicalFold');host.append(extra);
 function render(){
  for(const [item,b] of buttons){b.classList.toggle('chosen',item===row);b.setAttribute('aria-pressed',String(item===row))}
  for(const [n,b] of fuButtons){b.classList.toggle('active',n===furo);b.setAttribute('aria-pressed',String(n===furo))}
  for(const [n,b] of tButtons){b.classList.toggle('active',n===time);b.setAttribute('aria-pressed',String(n===time))}
  const furoMin=Math.ceil(furo/4); // AEMPS limit: <= 4 mg/min
  const v=row.volume,remain=150-v;
  const a=`SSH ${row.percent}: a partir de 150 ml de SF 0,9 %, retirar ${v} ml y sustituir por ${v} ml de NaCl al 20 % (${row.amp}), para un volumen final de 150 ml. Administrar el SSH IV mediante bomba en ${time} minutos (${150*60/time} ml/h), cada 12 horas según pauta individualizada.`;
  const b=`Furosemida ${furo} mg IV, preparada por separado en SF 0,9 % hasta 150 ml finales; administrar mediante bomba por vía independiente en no menos de ${furoMin} minutos (${Number(150*60/furoMin).toLocaleString('es-ES',{maximumFractionDigits:1})} ml/h), cada 12 horas según indicación.`;
  order.textContent=a+'\n\n'+b;order.dataset.copy=a+'\n'+b;btn.disabled=false;
  alert.textContent=`SEGURIDAD: el manual histórico plantea perfusión conjunta en Y y tiempos de 30 minutos, pero la ficha técnica de furosemida limita a 4 mg/min (2,5 mg/min en insuficiencia renal grave) y desaconseja infundir junto a otros medicamentos. Con ${furo} mg, ${time} minutos supondrían ${(furo/time).toLocaleString('es-ES',{maximumFractionDigits:2})} mg/min. No usar Y sin validación farmacéutica.`;
 }
 render();return host;
}

// v51: official Ferinject table + selectable infusion + optional Ganzoni formula.
function createFerinjectPanel(){
 const host=element('section','specialInfusion ferinjectProgram');host.append(element('h3','specialTitle','Necesidad total de hierro · tabla simplificada'));
 const ref=[['35–<70 kg','<10',1500,1000,500],['35–<70 kg','10–<14',1000,1000,null],['35–<70 kg','≥14',500,500,null],['≥70 kg','<10',2000,1000,1000],['≥70 kg','10–<14',1500,1000,500],['≥70 kg','≥14',500,500,null]];
 const tbl=makeTable(['Peso','Hb (g/dl)','Hierro total','1.ª semana','2.ª semana']);
 const tableRows=[];
 for(const r of ref){const tr=document.createElement('tr');for(let i=0;i<5;i++){const td=document.createElement(i<2?'th':'td');td.textContent=r[i]==null?'—':(i>=2?r[i]+' mg':r[i]);tr.append(td)}tbl.body.append(tr);tableRows.push(tr)}host.append(tbl.wrap);
 host.append(element('p','small','Tabla de necesidades según AEMPS. No administrar automáticamente 1.000 mg si el peso no permite 20 mg/kg por perfusión. Para <35 kg se aplica cálculo por peso.'));
 const inputs=element('div','v51InputGrid'),wLab=element('label','','Peso (kg)'),hbLab=element('label','','Hb (g/dl)');const weight=element('input','control'),hb=element('input','control');weight.type=hb.type='number';weight.min='15';weight.max='350';weight.step='0.1';weight.placeholder='Peso';hb.min='1';hb.max='25';hb.step='0.1';hb.placeholder='Hemoglobina';wLab.append(weight);hbLab.append(hb);inputs.append(wLab,hbLab);host.append(inputs);
 const dialysisLabel=element('label','checkline v51Dialysis'),dialysis=element('input','');dialysis.type='checkbox';dialysisLabel.append(dialysis,document.createTextNode(' Paciente en hemodiálisis (máximo 200 mg de hierro/día)'));host.append(dialysisLabel);
 const totals=element('div','selectedPreparation');host.append(totals);
 const prepTitle=element('h3','specialTitle','Diluciones para perfusión intravenosa');host.append(prepTitle);
 const dt=makeTable(['Dosis','Cantidad de Ferinject','SF 0,9 % · máximo','Tiempo mínimo']);
 for(const [range,volume,saline,minutes] of [['100–200 mg','2–4 ml','50 ml','Sin mínimo establecido'],['>200–500 mg','>4–10 ml','100 ml','6 min'],['>500–1.000 mg','>10–20 ml','250 ml','15 min']]){const tr=document.createElement('tr');for(const v of [range,volume,saline,minutes])tr.append(element('td','',v));dt.body.append(tr)}host.append(dt.wrap);
 host.append(element('p','small','El volumen de SF indica diluyente máximo, NO volumen final. Diluir exclusivamente en SF 0,9 %; concentración de hierro ≥2 mg/ml.'));
 const doseBar=element('div','preparationOptions');host.append(doseBar);
 const opts=[100,200,500,750,1000];let chosenDose=500;const doseButtons=[];for(const n of opts){const b=element('button','preparationButton',n+' mg');b.type='button';b.onclick=()=>{chosenDose=n;render()};doseBar.append(b);doseButtons.push([n,b])}
 const result=element('div','v51OrderResult'),copier=copyButton('Copiar preparación',()=>result.dataset.copy||'');host.append(result,copier);
 const caution=element('p','v51SafetyWarning');host.append(caution);
 const g=element('details','specialDisclosure');g.append(element('summary','','Cálculo individualizado del déficit de hierro · Ganzoni'));const gb=element('div','specialDisclosureBody'),gNote=element('p','small','Estimación complementaria; no sustituye la tabla oficial ni determina una dosis por administración.');const gOut=element('div','calcresult');gb.append(gNote,gOut);g.append(gb);host.append(g);
 function render(){const w=weight.value.trim()===''?NaN:Number(weight.value),h=hb.value.trim()===''?NaN:Number(hb.value),valid=w>=15&&w<=350&&h>0&&h<=25;
  for(const [n,b] of doseButtons){b.classList.toggle('active',chosenDose===n);b.setAttribute('aria-pressed',String(chosenDose===n))}
  for(let i=0;i<tableRows.length;i++)tableRows[i].classList.remove('v51Highlight');
  let need=NaN,limit=NaN;
  if(valid){const row=h<10?0:h<14?1:2;const col=w<35?-1:w<70?0:1;if(col<0)need=w*(h<10?30:15);else{const ix=col*3+row;need=ref[ix][2];tableRows[ix].classList.add('v51Highlight')};limit=Math.min(1000,20*w,dialysis.checked?200:Infinity);totals.textContent='Necesidad total estimada por tabla: '+fmt(need)+' mg. Máximo por perfusión individual para '+fmt(w)+' kg: '+fmt(limit)+' mg; máximo acumulado 1.000 mg/semana. Si se precisa otra sesión, separar ≥7 días. Para inyección IV (sin diluir), límite 15 mg/kg.';
   const target=w<35?13:15,stores=w<35?15*w:500;if(h<target){const formula=w*(target-h)*2.4+stores;gOut.textContent='Ganzoni: '+fmt(formula)+' mg = '+fmt(w)+' × ('+target+' − '+fmt(h)+') × 2,4 + '+fmt(stores)+' mg de depósitos. Resultado estimado, no pauta.'}else{gOut.textContent='Hb ≥ objetivo convencional ('+target+' g/dl). Ganzoni no proporciona una pauta válida automática en este contexto.'}
  }else{totals.textContent='Introduce peso y Hb para aplicar la tabla y comprobar el límite de la dosis seleccionada.';gOut.textContent='Introduce peso y Hb para calcular.'}
  const volume=chosenDose/50,saline=chosenDose<=200?50:chosenDose<=500?100:250,min=chosenDose<=200?'sin tiempo mínimo prescrito':chosenDose<=500?'al menos 6 minutos':'al menos 15 minutos';
  const preparation=`Carboximaltosa férrica (Ferinject) ${chosenDose} mg IV (${fmt(volume)} ml de 50 mg/ml) diluida en ${saline} ml de SF 0,9 %, administrar en perfusión ${min}.`;
  result.textContent=preparation;
  const safe=valid&&chosenDose<=limit&&chosenDose<=need&&chosenDose>=100;
  result.dataset.copy=safe?preparation:'';copier.disabled=!safe;
  caution.textContent=!valid?'Para habilitar la copia, introducir peso y Hb y comprobar límites.':!safe?'La dosis seleccionada supera el límite individual o la necesidad estimada: no se permite copiarla.':'Observar al menos 30 minutos tras administración. En hemodiálisis, respetar límite 200 mg/día; esta calculadora de perfusión no debe utilizarse para esa situación sin revisar el ajuste.';
 }
 weight.addEventListener('input',render);hb.addEventListener('input',render);dialysis.addEventListener('change',render);render();return host;
}

function createSpecialInfusion(d){
 if(d.special.kind==='dose_cards')return createDoseCards(d);
 if(d.special.kind==='levosimendan')return createLevosimendan(d);
 if(d.special.kind==='esmolol')return createEsmolol(d);
 if(d.special.kind==='furosemide')return createFurosemide(d);
 if(d.special.kind==='ssh_heart_failure')return createSSHProgram(d);
 if(d.special.kind==='ferinject')return createFerinjectPanel();
 if(d.id==='noradrenalina')return createNoradrenalineInfusion(d);
 if(d.special.kind==='amiodarone')return null;
 const conf=d.special,host=element('section','specialInfusion');host.append(element('h3','specialTitle','Preparación de la perfusión'));
 const buttons=element('div','preparationOptions'),chosen=element('div','selectedPreparation'),area=element('div','infusionTableArea'),order=selectedOrderBox();
 let prepIndex=0,full=false,weight=null,selection=null;let solvent='SG 5 %';
 conf.preparations.forEach((p,i)=>{const b=element('button','preparationButton',p.label);b.type='button';b.onclick=()=>{prepIndex=i;selection=null;render()};buttons.append(b)});
 if(conf.preparations.length>1)host.append(buttons);
 const allowedDiluents=d.id==='adrenalina'?['SG 5 %','SF 0,9 %']:[];
 if(allowedDiluents.length>1){const bar=element('div','infusionDiluent'),label=element('b','','Diluyente de perfusión'),options=element('div','preparationOptions');bar.append(label,options);
  for(const value of allowedDiluents){const b=element('button','preparationButton',value);b.type='button';b.dataset.solvent=value;b.onclick=()=>{solvent=value;selection=null;render()};options.append(b)}host.append(bar)}
 host.append(chosen);
 if(conf.kind==='weight'){
   const controls=element('div','weightControls'),wrap=element('div','weightInputGroup'),label=element('label','','Peso del paciente (kg)');
   weight=element('input','control');weight.type='number';weight.min='20';weight.max='250';weight.step='0.1';weight.value='70';weight.id='doseWeight_'+d.id;
   label.htmlFor=weight.id;wrap.append(label,weight,element('span','small','Cambiar el peso recalcula la tabla.'));
   const view=element('div','viewSelector');for(const [name,value] of [['Una fila',false],['Tabla completa',true]]){const b=element('button','viewButton',name);b.type='button';b.onclick=()=>{full=value;selection=null;render()};view.append(b)}
   controls.append(wrap,view);host.append(controls);weight.oninput=()=>{selection=null;render()};
   if(d.id==='dopamina'){
     const legend=element('div','dopamineLegend');for(const r of conf.colorRanges)legend.append(element('span','doseLegend '+r.css,r.label+' · '+r.note));
     host.append(legend,element('p','small pharmacologyCaution','Rangos aproximados y solapados; los colores representan efectos predominantes, no seguridad ni indicación.'));
   }
 }
 host.append(area,order);
 if(conf.equivalent)host.append(element('p','small equivalentPreparation',conf.equivalent));
 host.append(element('p','small infusionCaution','Velocidades calculadas matemáticamente para la concentración seleccionada. Verificar prescripción, volumen final, bomba y condiciones del centro.'));
 function effect(n){return n<=2?'dopaminergic':n<=10?'beta':'alpha'}
 function orderText(p,w,dose,rate){const mg=es(p.amountMg),vol=es(p.volumeMl),r=es(rate);
   if(conf.kind==='fixed')return `${d.name}: ${mg} mg en ${vol} ml finales de SG 5 %. Perfusión IV continua a ${r} ml/h (${es(dose)} mg/h).`;
   if(conf.kind==='fixed_micro')return `${d.name}: ${mg} mg en ${vol} ml finales de SF 0,9 %. Perfusión IV continua a ${r} ml/h (${es(dose)} µg/min).`;
   const dil=d.id==='adrenalina'?solvent:d.id==='dobutamina'?'SG 5 %':d.id==='dopamina'?'SG 5 %':'diluyente indicado';
   return `${d.name}: ${mg} mg en ${vol} ml finales de ${dil}. Perfusión IV continua a ${r} ml/h (${es(dose)} µg/kg/min para ${es(w)} kg).`
 }
 function render(){const p=conf.preparations[prepIndex],micro=conf.kind==='fixed_micro',fixed=conf.kind==='fixed'||micro;
   for(const [i,btn] of [...buttons.children].entries()){btn.classList.toggle('active',i===prepIndex);btn.setAttribute('aria-pressed',String(i===prepIndex))}
   host.querySelectorAll('[data-solvent]').forEach(b=>{const on=b.dataset.solvent===solvent;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
   const views=host.querySelectorAll('.viewButton');views.forEach((b,i)=>{b.classList.toggle('active',Boolean(i)===full);b.setAttribute('aria-pressed',String(Boolean(i)===full))});
   chosen.replaceChildren();chosen.append(element('strong','',d.id==='adrenalina'?p.name.replace('SG 5 % o SF 0,9 %',solvent):p.name),element('span','selectedConcentration',es(1000*p.amountMg/p.volumeMl)+' µg/ml · '+es(p.amountMg/p.volumeMl)+' mg/ml'),element('p','small',p.detail+' Volumen final incluido el medicamento.'+(d.id==='adrenalina'?' Diluyente seleccionado: '+solvent+'.':'')));
   area.replaceChildren();area.append(element('h4','',fixed?'Tabla de perfusión':'Calculadora de perfusión por peso'));
   area.append(element('p','specialUnitLabel',fixed?(micro?'Dosis: µg/min · Velocidad: ml/h':'Dosis: mg/h · Velocidad: ml/h'):'Cabeceras: µg/kg/min · Resultados: ml/h'));
   const scroll=element('div','specialTableScroll'),table=element('table','specialTable'),head=document.createElement('thead'),hr=document.createElement('tr');
   const th=document.createElement('th');th.textContent=fixed?'Dosis':'Peso';hr.append(th);
   if(fixed){const h=document.createElement('th');h.textContent='Velocidad (ml/h)';hr.append(h)}
   else for(const dose of conf.doses){const h=document.createElement('th');h.textContent=es(dose);if(d.id==='dopamina')h.className='doseHead '+effect(dose);hr.append(h)}
   head.append(hr);table.append(head);const body=document.createElement('tbody');
   const kg=weight?Number(weight.value):NaN,validKg=Number.isFinite(kg)&&kg>=20&&kg<=250;
   if(!fixed&&!validKg){area.append(element('p','weightWarning','Introduce peso válido entre 20 y 250 kg.'));order.setOrder('');return}
   const all=[40,50,60,70,80,90,100,110,120];const rows=fixed?conf.doses:(full?[...new Set([...all,kg])].sort((a,b)=>a-b):[kg]);
   for(const row of rows){const tr=document.createElement('tr');if(!fixed&&row===kg)tr.className='selectedWeightRow';
     const title=document.createElement('th');title.scope='row';title.textContent=fixed?es(row)+(micro?' µg/min':' mg/h'):es(row)+' kg';tr.append(title);
     const ds=fixed?[row]:conf.doses;
     for(const dose of ds){const rate=fixed?(micro?dose*60*p.volumeMl/(1000*p.amountMg):dose*p.volumeMl/p.amountMg):dose*row*60*p.volumeMl/(1000*p.amountMg);
       const td=document.createElement('td'),b=element('button','cellChoice',es(Number(rate.toFixed(conf.decimals??2))));b.type='button';
       const key=String(row)+'|'+String(dose);if(selection===key)b.classList.add('chosen');
       b.setAttribute('aria-label',`Seleccionar ${es(rate)} ml/h para ${fixed?es(dose)+(micro?' µg/min':' mg/h'):es(row)+' kg y '+es(dose)+' µg/kg/min'}`);
       b.onclick=()=>{selection=key;order.setOrder(orderText(p,fixed?null:row,dose,rate));render();};td.append(b);tr.append(td)
     }body.append(tr)
   }
   table.append(body);scroll.append(table);area.append(scroll);
   if(!selection)order.setOrder('');
 }
 render();return host;
}
function createSpecialInfo(d){
  const host=element('div','specialDetails');
  for(const item of d.special.sections||[]){if(/precauciones y contraindicaciones/i.test(item.title))continue;host.append(specialDisclosure(item.title,item.text));}
  host.append(specialSources(d));return host;
}

// v37 · órdenes copiables y equivalencias de presentación; nunca se copian solo ampollas.
const es=n=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:2});
function asciiFractions(text){const f={"½":"1/2","¼":"1/4","¾":"3/4","⅓":"1/3","⅔":"2/3","⅛":"1/8","⅜":"3/8","⅝":"5/8","⅞":"7/8"};return String(text??'').replace(/(\d)?([½¼¾⅓⅔⅛⅜⅝⅞])/g,(_,n,c)=>(n?n+' y ':'')+f[c]);}
async function copyClinical(text,button){
  text=asciiFractions(text);
  if(!text)return;
  let copied=false;try{await navigator.clipboard.writeText(text);copied=true}catch(_){
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';document.body.append(ta);ta.select();copied=document.execCommand('copy');ta.remove();
  }
  if(button){const old=button.textContent;button.textContent=copied?'✓ Copiado':'No se pudo copiar';setTimeout(()=>{if(button.isConnected)button.textContent=old},1800)}
}
function copyButton(label,getText){const b=element('button','action v37CopyButton','⧉ '+label);b.type='button';b.addEventListener('click',()=>copyClinical(getText(),b));return b}
function selectedOrderBox(){const panel=element('div','selectedOrder');panel.append(element('b','','Pauta seleccionada'));const preview=element('p','selectedOrderText','Selecciona una celda de dosis y velocidad para copiar la pauta.');panel.append(preview);const b=copyButton('Copiar',()=>panel.dataset.copy||'');b.disabled=true;panel.append(b);panel.setOrder=(txt)=>{panel.dataset.copy=txt||'';preview.textContent=txt||'Selecciona una celda de dosis y velocidad para copiar la pauta.';b.disabled=!txt};return panel}
function createPautaCopies(d){
 if(!d.reviewed||!d.copyPautas?.length)return null;
 const host=element('div','copyPautas v38IntegratedCopies');
 for(const item of d.copyPautas){const row=element('div','copyPautaRow');row.append(element('span','',item.title),copyButton('Copiar',()=>item.text));host.append(row)}
 return host;
}
function clinicalField(title,value,extra='',fold=false){
  if(fold)return specialDisclosure(title,value,'clinicalFold');
  const e=element('section','field'+(extra?' '+extra:''));
  e.append(element('b','',title),element('p','',value||'Pendiente de comprobar en ficha técnica.'));
  return e;
}
function renderIndications(d){
  const fold=d.id==='cloruro_calcico';
  const e=element('div','clinicalEssentials'+(fold?' folded':''));
  e.append(clinicalField('Indicaciones',d.indication,'',fold));
  e.append(clinicalField('Precauciones',d.precautions,'',fold));
  e.append(clinicalField('Contraindicaciones',d.contraindication,'',fold));
  return e;
}
function showDoseRows(d,panel){
 if(!d.doseRows?.length)return;
 const summary=panel.querySelector('p');if(summary)summary.remove();
 const rows=element('div','doseRows');
 for(const it of d.doseRows){
   const line=element('div','doseRow');const text=element('div','doseRowText');
   text.append(element('b','',it.title),element('span','',it.text));line.append(text);
   if(it.copy)line.append(copyButton('Copiar',()=>it.copy));
   rows.append(line);
 }
 panel.append(rows);
}
function showDiluent(d,e){
 if(d.diluent){const z=element('div','diluentTop');z.append(element('b','','Diluyente / administración'),element('span','',d.diluent));e.append(z)}
}
function relatedPhosphateLink(id){
 const target=id==='fosfato_iv'?'fosfatos_orales':'fosfato_iv';
 const b=element('button','action phosphateLink',id==='fosfato_iv'?'Ver fosfatos orales':'Ver fosfatos IV');
 b.type='button';b.onclick=()=>{show(target,true);document.getElementById('drugSearch').value='';document.getElementById('drugGroup').value='';document.getElementById('drugStatus').value='';renderList()};
 return b;
}
function createPhosphateCalculator(){
 const host=element('section','specialInfusion phosphateCalc');host.append(element('h3','specialTitle','Calculadora de fosfatos IV · dosis por peso'));
 const controls=element('div','phosphateControls');
 const chooser=(title,opts,value)=>{const wrap=element('label','phosLabel'),select=element('select','control');wrap.append(element('span','',title));for(const [v,t] of opts){const o=element('option','',t);o.value=v;select.append(o)}select.value=value;wrap.append(select);controls.append(wrap);return select};
 const weightWrap=element('label','phosLabel');weightWrap.append(element('span','','Peso (kg)'));const weight=element('input','control');weight.type='number';weight.min='20';weight.max='250';weight.step='0.1';weight.value='70';weightWrap.append(weight);controls.append(weightWrap);
 const dose=chooser('Dosis',[['0.08','0,08 mmol/kg · inicial'],['0.16','0,16 mmol/kg'],['0.25','0,25 mmol/kg'],['0.5','0,50 mmol/kg']],'0.08');
 const route=chooser('Vía venosa',[['per','Periférica'],['cen','Central monitorizada']],'per');
 const prep=chooser('Preparación',[['15','1,5 ampollas · 15 mmol'],['30','3 ampollas · 30 mmol']],'15');
 const diluent=chooser('Diluyente compatible',[['SF 0,9 %','SF 0,9 %'],['SG 5 %','SG 5 %']],'SF 0,9 %');
 const hours=chooser('Duración de la perfusión',[['6','6 horas']],'6');
 host.append(controls);
 const prepInfo=element('div','selectedPreparation phosPreparation'),result=element('div','phosResult'),alerts=element('div','phosAlerts');host.append(prepInfo,result,alerts);
 const note=element('p','small','Las dos preparaciones periféricas contienen 0,06 mmol de fósforo/ml. Los ejemplos centrales son más concentrados y solo son utilizables si el servicio de Farmacia valida la formulación y vía. NO asumir que las diluciones de fosfato dipotásico son aptas para vía periférica: 15 mmol/250 ml o 30 mmol/500 ml implican 120 mEq/l de potasio.');host.append(note);
 const f=x=>Number(x).toLocaleString('es-ES',{maximumFractionDigits:2});
 const cell=(title,value,cls='')=>{const e=element('div','phosMetric '+cls);e.append(element('span','',title),element('strong','',value));return e};
 const warning=(title,desc)=>{const a=element('div','phosAlert');a.append(element('strong','',title),element('p','',desc));alerts.append(a);return a};
 function minHours(){return route.value==='per'?(prep.value==='15'?4:6):(prep.value==='15'?2:4)}
 function updateHours(){const min=minHours(),old=Number(hours.value)||6;hours.replaceChildren();for(const n of [2,3,4,5,6,7,8,10,12,16,24])if(n>=min){const o=element('option','',n+' horas');o.value=String(n);hours.append(o)}hours.value=String(old>=min?[...hours.options].some(o=>o.value===String(old))?old:min:min)}
 function calc(){updateHours();const kg=Number(weight.value),ok=weight.value.trim()!==''&&Number.isFinite(kg)&&kg>=20&&kg<=250;
  result.replaceChildren();alerts.replaceChildren();prepInfo.replaceChildren();
  const bagDose=Number(prep.value),bagVolume=route.value==='per'?(bagDose===15?250:500):100,concentration=bagDose/bagVolume;
  prepInfo.append(element('strong','',`${bagDose===15?'1,5':'3'} ampollas (${bagDose} mmol de fósforo) en ${bagVolume} ml de volumen FINAL de ${diluent.value}`),element('span','selectedConcentration',`${f(concentration)} mmol/ml de fósforo`));
  if(!ok){result.append(element('p','weightWarning','Introduce un peso válido entre 20 y 250 kg.'));return}
  const mmol=kg*Number(dose.value),duration=Number(hours.value),vtbi=mmol/concentration,pump=vtbi/duration,phosRate=mmol/duration,potRate=2*phosRate;
  const pFast=phosRate>7.5+1e-9,tooLarge=mmol>bagDose+1e-9,tooLargeBoth=mmol>30+1e-9;
  const grid=element('div','phosMetrics');grid.append(cell('Dosis calculada',f(mmol)+' mmol'),cell('Duración seleccionada',f(duration)+' h'));
  grid.append(cell('VOLUMEN A ADMINISTRAR · VTBI',f(vtbi)+' ml','phosPrimary'),cell('VELOCIDAD DE BOMBA',f(pump)+' ml/h','phosPrimary'));
  grid.append(cell('Velocidad de fósforo',f(phosRate)+' mmol/h',pFast?'isOver':''));
  result.append(grid);
  if(tooLarge){const row=warning('Preparación insuficiente',tooLargeBoth?`La dosis calculada (${f(mmol)} mmol) supera incluso los 30 mmol de la preparación mayor: se requiere revisión de pauta y otra preparación validada.`:`La dosis calculada (${f(mmol)} mmol) supera los 15 mmol (1,5 ampollas) disponibles. Cambia a 3 ampollas.`);
   if(!tooLargeBoth&&bagDose===15){const b=element('button','action phosUpgrade',route.value==='per'?'Cambiar a 3 ampollas en 500 ml':'Cambiar a 3 ampollas en 100 ml · vía central');b.type='button';b.onclick=()=>{prep.value='30';const min=minHours();if(Number(hours.value)<min)hours.value=String(min);calc()};row.append(b)}
  }
  if(pFast)warning('Velocidad de fósforo superior al límite conservador',`${f(phosRate)} mmol/h supera 7,5 mmol/h. Revisa la duración (mínimo matemático ${f(mmol/7.5)} h) o la dosis.`);
  // Potassium safety remains explicit despite no salt selector: the same pump rate delivers 2 mEq K/mmol P with dipotassium.
  const kLimit=route.value==='per'?10:20;
  if(potRate>kLimit+1e-9)warning('Posible exceso de potasio si se utiliza dipotásico',`Esta dosis aportaría ${f(potRate)} mEq/h de K con fosfato dipotásico, por encima de la referencia general de ${kLimit} mEq/h para la vía seleccionada. Verificar también concentración y otros aportes.`);
  if(route.value==='cen')warning('Preparación central concentrada pendiente de validación',`Con fosfato dipotásico español, esta preparación tendría ${f(2*bagDose*1000/bagVolume)} mEq/l de K. No administrar sin protocolo central validado y monitorización.`);
  const vtbiNotice=element('div','phosVTBINotice');
  vtbiNotice.append(element('strong','',tooLarge?'NO programar esta pauta con la preparación seleccionada':`PROGRAMAR EN LA BOMBA: ${f(vtbi)} ml de volumen a infundir (VTBI)`));
  vtbiNotice.append(element('p','',tooLarge?'La dosis calculada supera el contenido de la bolsa elegida. Selecciona otra preparación y verifica de nuevo todos los datos.':mmol<bagDose-1e-9?`NO ADMINISTRAR LA BOLSA COMPLETA: pasar solo ${f(vtbi)} ml a ${f(pump)} ml/h durante ${f(duration)} horas; detener al alcanzar ese volumen.`:`La dosis calculada coincide con el contenido total de la bolsa. Programar ${f(vtbi)} ml como volumen a infundir y confirmar la pauta.`));
  if(!tooLarge)result.append(vtbiNotice);else alerts.prepend(vtbiNotice);
  if(dose.value!=='0.08')alerts.append(element('p','phosInfo','La duración inicial de 6 h recogida en AEMPS corresponde a 0,08 mmol/kg en hipofosfatemia reciente no complicada; las dosis mayores requieren individualización.'));
  if(dose.value==='0.08'&&duration<6)warning('Duración inferior a la pauta inicial de ficha técnica','La pauta inicial de 0,08 mmol/kg se administra durante 6 horas en hipofosfatemia reciente no complicada. Si eliges menos tiempo, debe existir justificación clínica y un protocolo validado.');
  if(!tooLarge)alerts.append(element('p','phosInfo','Antes de administrar, comprobar P, Ca, Na, K, Mg, creatinina/FGe, diuresis y acceso venoso. En cetoacidosis diabética, el fosfato dipotásico tiene un límite específico de 5 mEq/h. Las preparaciones están pendientes de validación local.'));
 }
 for(const node of [weight,dose,route,prep,hours,diluent])node.addEventListener('change',calc);
 weight.addEventListener('input',calc);
 calc();return host;
}
function createPresentations(d, mainDose){
 return null; // v38: presentación visible en cabecera; sin conversor de ampollas/ml.
}
function createAmiodarone(d){
 const host=element('section','specialInfusion amiodaroneProgram');host.append(element('h3','specialTitle','Taquiarritmias con pulso · pauta IV seleccionada'));
 const stages=[{name:'Carga IV',mg:300,vol:250,minutes:60},{name:'Mantenimiento · primeras 12 h',mg:600,vol:250,minutes:720},{name:'Mantenimiento · siguientes 24 h',mg:600,vol:250,minutes:1440}];
 for(const it of stages){const card=element('div','amioStage');const detail=element('div','v38DoseLine');detail.append(element('b','',it.name),element('strong','v38DoseText',`${it.mg} mg en ${it.vol} ml finales de SG 5 %`),element('span','small',`${it.minutes===60?'60 minutos':it.minutes/60+' horas'} · ${es(it.vol*60/it.minutes)} ml/h`));
  card.append(detail,copyButton('Copiar',()=>`Amiodarona ${it.mg} mg IV en SG 5 % hasta ${it.vol} ml finales, durante ${it.minutes===60?'60 minutos':it.minutes/60+' horas'}, a ${es(it.vol*60/it.minutes)} ml/h.`));host.append(card)}
 host.append(element('p','small','No confundir pauta de perfusión con 300 mg IV/IO tras tercera descarga (y 150 mg tras quinta) en FV/TV sin pulso. La continuación oral no es obligatoria.'));return host;
}
// v49 · Pautas por pasos/indicaciones mediante viñetas; aclaraciones de la misma pauta, como adenosina, en párrafo separado.
function posologyText(value,id,quick=false){
 const lines=String(value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean),host=element('div','posologyText');
 if(!lines.length)return host;
 if(id==='adenosina'&&quick){for(const line of lines)host.append(element('p','posologyParagraph',line));return host}
 if(lines.length>1){const ul=element('ul','posologyList');for(const line of lines)ul.append(element('li','',line));host.append(ul)}
 else host.append(element('p','posologyParagraph',lines[0]));return host;
}
function sectionGroup(d,selector){return (d.special?.sections||[]).filter(s=>selector(s.title.toLocaleLowerCase('es')))}
function infoItems(items){const host=element('div','infoItems');for(const item of items){const p=element('div','infoItem');p.append(element('b','',item.title),element('p','',item.text));host.append(p)}return host}
function addDisclosure(parent,title,content){const h=specialDisclosure(title,content,'clinicalFold v49Fold');parent.append(h);return h}
function show(id,scroll){const d=D.find(x=>x.id===id);if(!d)return;if(current!==id)$('genericAccordion').open=false;current=id;if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);const e=$('drugDetail');const stored=$('lyticBox');if(stored&&stored.parentNode!==$('lyticHome'))$('lyticHome').append(stored);e.replaceChildren();
const status=element('span','status'+(d.reviewed?' ready':''),d.reviewed?'Ficha clínica':'Pendiente de validación');const hd=element('div','drugHead');const hwrap=element('div','');hwrap.append(status,element('h2','',d.name),element('div','subdrug',d.brand+' · '+d.routes));if(d.mechanism)hwrap.append(element('div','mechanismBrief',d.mechanism));const star=makeStar(id);star.id='detailStar';hd.append(hwrap,star);e.append(hd);
// Referencia rápida: presentación + diluyentes en un solo recuadro, dosis y tres recuadros clínicos.
if((d.presentation&&!d.presentation.startsWith('Pendiente'))||d.diluent){const present=element('div','v38PresentationHeader');present.append(element('b','','Presentación'));if(d.presentation)present.append(element('p','',d.presentation));if(d.diluent){const dl=element('p','v49PresentationDiluent');dl.append(element('strong','','Diluyentes / administración: '),document.createTextNode(d.diluent));present.append(dl)}e.append(present)}
const doseCard=element('section','dosePanel'+(d.reviewed?'':' pending'));doseCard.append(element('h3','','Dosis y pautas de referencia'));
if(d.doseRows?.length)showDoseRows(d,doseCard);else doseCard.append(posologyText(d.dosingBrief||d.dosing,d.id,true));e.append(doseCard);
const copyPautas=(d.id==='atropina'||d.id==='furosemida'||d.doseRows?.length)?null:createPautaCopies(d);if(copyPautas)doseCard.append(copyPautas);
e.append(renderIndications(d));
// Ajustes inmediatamente antes del detalle posológico.
const adjustments=sectionGroup(d,t=>/^ajustes?/.test(t));if(adjustments.length)addDisclosure(e,'Ajustes posológicos',infoItems(adjustments));
// Consolidar información sobre vía y condiciones en detalle posológico, sin bloques redundantes.
const details=sectionGroup(d,t=>!/^ajustes?/.test(t)&&!/(^monitorizaci[oó]n|^interacciones|farmacocin[eé]tica)/.test(t)&&!/precauciones y contraindicaciones|contraindicaciones y precauciones/.test(t)&&!(d.id==='adenosina'&&t==='precauciones'));
const detailNeeded=(d.dosingBrief&&d.dosingBrief!==d.dosing)||details.length||(!d.special&&d.administration);
if(detailNeeded){const det=element('details','detailDose');det.append(element('summary','','Detalle posológico y consideraciones'));
 const body=element('div','doseBody');if(d.dosingBrief&&d.dosingBrief!==d.dosing)body.append(posologyText(d.dosing,d.id,false));
 if(details.length)body.append(infoItems(details));
 if(!d.special&&d.administration)body.append(infoItems([{title:'Vía y administración',text:d.administration}]));
 det.append(body);e.append(det)}
// Preparaciones, cálculo por peso y bolos únicamente si existen; adenosina sin ficha redundante.
if(d.id==='fosfato_iv'){e.append(createPhosphateCalculator(),relatedPhosphateLink(id))}else if(d.id==='fosfatos_orales'){e.append(relatedPhosphateLink(id))}
if(d.special?.kind&&d.special.kind!=='none'&&d.special.kind!=='amiodarone'&&d.id!=='adenosina'){const inf=createSpecialInfusion(d);if(inf)e.append(inf)}
if(!d.special&&(id==='ferinject'||id==='venofer'))e.append(createIronCalc(id));
// Calculadora de trombólisis, como preparación, antes de los apartados clínicos complementarios.
const lyticBox=$('lyticBox'),lyticHome=$('lyticHome');
if(id==='alteplasa'||id==='tenecteplasa'){
const opt=($('lyticType')); opt.replaceChildren();
const types=id==='alteplasa'?[['alteplase_stroke','Alteplasa · ictus isquémico']]:[['tenecteplase_stroke','Tenecteplasa · ictus isquémico (vial 25 mg)'],['tenecteplase_mi','Tenecteplasa · IAM (presentación IAM)']];
for(const [value,label] of types){const o=document.createElement('option');o.value=value;o.textContent=label;opt.append(o)}
$('lyticWeight').value='';$('lyticAccordion').open=false;e.append(lyticBox);calcLytic();
}else{lyticHome.append(lyticBox);$('lyticAccordion').open=false}
// Información complementaria siempre tras el bloque posológico y las perfusiones.
const monitor=sectionGroup(d,t=>/^monitorizaci[oó]n/.test(t));if(monitor.length)addDisclosure(e,'Monitorización',infoItems(monitor));
if(d.adverse)addDisclosure(e,'Reacciones adversas relevantes',d.adverse);
const interactions=sectionGroup(d,t=>/^interacciones/.test(t));if(interactions.length)addDisclosure(e,'Interacciones farmacológicas',infoItems(interactions));
const kinetics=sectionGroup(d,t=>/farmacocin[eé]tica/.test(t));if(kinetics.length)addDisclosure(e,'Farmacocinética clínica',infoItems(kinetics));else if(d.clinicalKinetics)addDisclosure(e,'Farmacocinética clínica',d.clinicalKinetics);
if(d.notes)e.append(d.id==='cloruro_calcico'?specialDisclosure('Nota de seguridad',d.notes,'clinicalFold'):element('div','notes'+(/ALERTA|NO |Vía periférica/.test(d.notes)?' emph':''),d.notes));
e.append(specialSources(d));
renderList();if(scroll&&window.innerWidth<801)e.scrollIntoView({behavior:'smooth',block:'start'})}
function val(id){const s=$(id).value.trim().replace(',','.');return s===''?NaN:Number(s)}
function createIronCalc(drug){const host=element('section','ironCalc');const details=element('details','calcAccordion');const summary=document.createElement('summary');const text=element('span','');text.append(element('span','accordionName',drug==='ferinject'?'Calculadora de necesidad de hierro · Ferinject':'Calculadora de hierro · Ganzoni / Venofer'),element('span','accordionSub','Peso + Hb → necesidad acumulada y límites de administración'));summary.append(text,element('span','accordionSide'));details.append(summary);const body=element('div','calcAccordionBody');const grid=element('div','calcgrid');const weightBox=element('div','inputgroup'),hbBox=element('div','inputgroup');weightBox.innerHTML='<label for="ironWeight">Peso (kg)</label><input id="ironWeight" class="control" type="number" min="15" max="350" step="0.1" inputmode="decimal" placeholder="Peso">';hbBox.innerHTML='<label for="ironHb">Hemoglobina (g/dL)</label><input id="ironHb" class="control" type="number" min="1" max="25" step="0.1" inputmode="decimal" placeholder="Hb">';grid.append(weightBox,hbBox);if(drug==='ferinject'){const route=element('div','inputgroup');route.innerHTML='<label for="ironRoute">Administración</label><select class="control" id="ironRoute"><option value="infusion">Perfusión IV</option><option value="injection">Inyección IV</option></select>';grid.append(route)}body.append(grid);if(drug==='ferinject'){const label=element('label','checkline');label.innerHTML='<input id="ironDialysis" type="checkbox"> Paciente en hemodiálisis (máximo 200 mg/día)';body.append(label)}const result=element('div','calcresult','Introduce peso y Hb para calcular.');result.id='ironResult';result.setAttribute('aria-live','polite');body.append(result,element('div','warn',drug==='ferinject'?'Solo ≥14 años; aplicar tabla y límites de ficha técnica. No elegir automáticamente indicación ni pauta.':'Cálculo de Ganzoni según FT. No es una orden de administración ni determina de forma automática número o frecuencia de perfusiones.'));details.append(body);host.append(details);
function update(){const w=Number(weightBox.querySelector('input').value),hb=Number(hbBox.querySelector('input').value);result.replaceChildren();result.className='calcresult';if(!(w>=15&&w<=350&&hb>=1&&hb<=25)){result.textContent='Introduce peso de 15–350 kg y Hb de 1–25 g/dL.';return}if(drug==='ferinject'){let total;if(w<35)total=w*(hb<10?30:15);else if(w<70)total=hb<10?1500:hb<14?1000:500;else total=hb<10?2000:hb<14?1500:500;const route=body.querySelector('#ironRoute').value,hd=body.querySelector('#ironDialysis').checked;const maxByKg=w*(route==='infusion'?20:15);const maxAdmin=Math.min(total,1000,maxByKg,hd?200:Infinity);const n=Math.ceil(total/Math.max(maxAdmin,1));result.append(element('strong','',fmt(total)+' mg de hierro necesarios'));result.append(element('div','small','Máximo orientativo de esta administración: '+fmt(maxAdmin)+' mg ('+fmt(maxAdmin/50)+' ml de Ferinject). '+(hd?'Hemodiálisis: no superar 200 mg/día. ':'')+'Límite semanal 1.000 mg; si se requieren dosis adicionales, respetar al menos 7 días. Tabla oficial para ≥14 años.'));if(n>1)result.append(element('div','small','La necesidad total supera una administración: individualizar fraccionamiento y tiempos según FT.'));if(maxAdmin<100)result.append(element('div','small','Dosis inferior a 100 mg: verificar viabilidad y presentación antes de prescribir.'));}
else{const target=w<35?13:15;if(hb>=target){result.classList.add('error');result.textContent='Hb igual o superior al objetivo de la fórmula ('+fmt(target)+' g/dL). Revalorar indicación y depósitos; no generar dosis automática.';return}const stores=w<35?15*w:500,total=w*(target-hb)*2.4+stores;result.append(element('strong','',fmt(total)+' mg de déficit de hierro'));result.append(element('div','small','Equivalente teórico a '+fmt(total/20)+' ml de Venofer 20 mg/ml. En adultos, dosis habituales 100–200 mg IV por administración, 1–3 veces por semana. Individualizar total y fraccionamiento.'));result.append(element('div','small','Ganzoni: objetivo Hb '+fmt(target)+' g/dL; depósitos '+fmt(stores)+' mg.'))}}
body.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));return host}

function calculate(){const dose=val('orderedDose'),amount=val('drugAmount'),vol=val('finalVolume'),kg=val('patientWeight'),kind=$('doseKind').value,unit=$('drugAmountUnit').value,out=$('genericResult');out.className='calcresult';lastCopy='';if(![dose,amount,vol].every(x=>Number.isFinite(x)&&x>0)){out.textContent='Introduce dosis prescrita, cantidad del medicamento y volumen final positivos.';return}if(kind.includes('kg')&&!(kg>=1&&kg<=350)){out.textContent='Introduce el peso en kg para esta pauta.';return}
const mg=kind.startsWith('mg')||kind.startsWith('mcg');if((mg&&unit!=='mg')||(kind.startsWith('UI')&&unit!=='UI')||(kind.startsWith('mmol')&&unit!=='mmol')||(kind.startsWith('mEq')&&unit!=='mEq')){out.classList.add('error');out.textContent='Dosis y preparado usan unidades incompatibles.';return}
let rate=0,text='',bolus=kind==='mgkgdose';switch(kind){case'mcgkgmin':rate=dose*kg*60/1000;text=fmt(dose*kg)+' µg/min';break;case'mgkgh':rate=dose*kg;text=fmt(rate)+' mg/h';break;case'mgkgdose':rate=dose*kg;text=fmt(rate)+' mg/dosis';break;case'mgh':rate=dose;text=fmt(rate)+' mg/h';break;case'mcgmin':rate=dose*60/1000;text=fmt(dose)+' µg/min';break;case'mgmin':rate=dose*60;text=fmt(dose)+' mg/min';break;case'UIh':rate=dose;text=fmt(rate)+' UI/h';break;case'UIkgh':rate=dose*kg;text=fmt(rate)+' UI/h';break;case'mmolh':rate=dose;text=fmt(rate)+' mmol/h';break;case'mEqh':rate=dose;text=fmt(rate)+' mEq/h';break;default:out.textContent='Unidad no válida';return}
const conc=amount/vol,ml=rate/conc;if(!Number.isFinite(ml)||ml<=0||ml>1e6){out.classList.add('error');out.textContent='Resultado matemático no válido.';return}const label=bolus?'ml por dosis':'ml/h',final=fmt(ml)+' '+label;out.replaceChildren();out.append(element('strong','',final),element('div','small','Equivalente a '+text+' · concentración '+fmt(conc)+' '+unit+'/ml.'));lastCopy=`Cálculo aritmético: ${text}; preparado ${fmt(amount)} ${unit} en ${fmt(vol)} ml finales; resultado ${final}.`}
function calcLytic(){const kg=val('lyticWeight'),type=$('lyticType').value,out=$('lyticResult');out.replaceChildren();if(!(kg>=20&&kg<=250)){out.textContent='Introduce peso entre 20 y 250 kg.';return}let text='';if(type==='alteplase_stroke'){const tot=Math.min(90,kg*.9),bolus=tot*.1;text=`Alteplasa ICTUS · total ${fmt(tot)} mg; bolo 10% ${fmt(bolus)} mg; perfusión 60 min ${fmt(tot-bolus)} mg (máx. 90 mg).`}else{let i=kg<60?0:kg<70?1:kg<80?2:kg<90?3:4;const stroke=type==='tenecteplase_stroke',mg=(stroke?[15,17.5,20,22.5,25]:[30,35,40,45,50])[i];text=`Tenecteplasa ${stroke?'ICTUS (vial 25 mg)':'IAM (presentación IAM)'} · ${fmt(mg)} mg = ${fmt(mg*200)} unidades; bolo IV único. Banda ${['<60','60–<70','70–<80','80–<90','≥90'][i]} kg.`;if(stroke&&kg<=50)text+=' Precaución: datos limitados con peso ≤50 kg.'}out.append(element('strong','',text),element('div','small','No verifica elegibilidad, tiempo, anticoagulación ni contraindicaciones.'))}
for(const id of ['patientWeight','doseKind','orderedDose','drugAmount','drugAmountUnit','finalVolume'])$(id).addEventListener('input',calculate);for(const id of ['lyticWeight','lyticType'])$(id).addEventListener('input',calcLytic);for(const id of ['drugSearch','drugGroup','drugStatus'])$(id).addEventListener(id==='drugSearch'?'input':'change',renderList);
$('resetCalc').onclick=()=>{for(const id of ['patientWeight','orderedDose','drugAmount','finalVolume'])$(id).value='';$('doseKind').value='mcgkgmin';$('drugAmountUnit').value='mg';calculate()};$('copyCalc').onclick=async()=>{if(!lastCopy)return;try{await navigator.clipboard.writeText(asciiFractions(lastCopy));$('copyCalc').textContent='Copiado'}catch(e){const t=document.createElement('textarea');t.value=asciiFractions(lastCopy);document.body.append(t);t.select();document.execCommand('copy');t.remove();$('copyCalc').textContent='Copiado'}};
$('onlyFaves').onclick=()=>{onlyFavorites=!onlyFavorites;$('onlyFaves').setAttribute('aria-pressed',String(onlyFavorites));$('onlyFaves').textContent=(onlyFavorites?'★':'☆')+' Solo favoritos';renderList()};window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(id&&id!==current)show(id,false);else if(!id){current='';emptyDetail();renderList()}});const firstId=decodeURIComponent(location.hash.slice(1));if(firstId==='bicarbonato')show('bicarbonato_1m',false);else if(firstId&&D.some(d=>d.id===firstId))show(firstId,false);else{emptyDetail();renderList()}calculate();
})();
