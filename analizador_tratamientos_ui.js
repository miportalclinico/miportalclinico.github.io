/* Portal Clínico · Analizador independiente v60. Interfaz compacta, procesamiento local. */
'use strict';
(()=>{
const A=window.TreatmentAnalyzer;
const $=id=>document.getElementById(id);
let items=[],order=[],draggingId=null;
const exampleA='(PARACETAMOL) VO,650 MG,C12H (ABSORBENTE INC ORINA DIA ANAT) OV,1 C/U,C6H (TORASEMIDA) VO,5 MG,C24H (LERCANIDIPINO) VO,10 MG,C24H (CANDESARTAN) VO,32 MG,C48H (BOLSAS RECOGIDA ORINA PIERNA) OV,1 C/U,C12H (TRAZODONA) VO,100 MG,C48H (ACENOCUMAROL) VO,1 MG,C24H (SITAGLIPTINA) VO,50 MG,C12H (SERTRALINA) VO,50 MG,C24H (OMEPRAZOL) VO,20 MG,C24H (APOSITO ESTERIL) OV,1 C/U,C24H (COLECTOR BOLSA RECOGIDA ORINA AADH (AUTOADHESIVO)) OV,1 C/U,C12H (MÓDULOS ESPESANTES.) VO,400 G,BISEMANAL (CEFIXIMA) VO,400 MG,C24H';
const exampleD=`BSORB INC ORINA DIA/ANAT-PANTS 80 UD/ENV T MED\t@0L@\tOV,1 C/U,C6H
ANORO ELLIPTA 55 MCG/22 MCG POLVO PARA INHALACION (UNIDOSIS) 30 DOSIS\t@0L@\tIN,1 C/U,C24H
APOSITO ESTERIL ALLEVYN GENTLE BORDER LITE OVAL 8.6X7.7CM 3U\t@0L@\tOV,1 C/U,C24H
BOLSAS RECOGIDA ORINA PIERNA FLEMING 75O ML 30 U\t@0L@\tOV,1 C/U,C12H
CANDESARTAN 32 MG 28 COMPRIMIDOS\t@0L@\tVO,32 MG,C48H
CEFIXIMA 400 MG 10 CAPSULAS\t@0L@\tVO,400 MG,C24H
COLECTOR BOLSA RECOG ORINA AADH CONVEEN OPTIMA 30MM 30U\t@0L@\tOV,1 C/U,C12H
DEPRAX 100 MG COMPRIMIDOS RECUBIERTOS CON PELICULA EFG . 30 COMPRIMIDOS\t@0L@\tVO,100 MG,C48H
ESPESANTE NUTRISENS(antes ESPESANTE VEGENAT MED) NEUTRO (AN ) 400G 1 BOTE\t@0L@\tVO,400 G,BISEMANAL
LERCANIDIPINO 10 MG 28 COMPRIMIDOS\t@0L@\tVO,10 MG,C24H
OMEPRAZOL 20 MG 28 CAPSULAS\t@0L@\tVO,20 MG,C24H
PARACETAMOL 650 MG 40 COMPRIMIDOS\t@0L@\tVO,650 MG,C12H
SERTRALINA 50 MG 30 COMPRIMIDOS\t@0L@\tVO,50 MG,C24H
SINTROM 1 MG COMPRIMIDOS . 60 COMPRIMIDOS\t@0L@\tVO,1 MG,C24H
SITAGLIPTINA 50 MG 28 COMPRIMIDOS\t@0L@\tVO,50 MG,C12H
TORASEMIDA 5 MG 30 COMPRIMIDOS\t@0L@\tVO,5 MG,C24H`;
function el(tag,className='',text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=String(text);return n;}
function button(text,cb,cls='',title=''){const b=el('button',cls,text);b.type='button';if(title)b.title=title;b.addEventListener('click',cb);return b;}
function isPrn(m){return /a demanda|si precisa|\bprn\b|s\s*\/\s*p/i.test(A.getFrequency(m));}
function medicines(){return items.filter(x=>x.kind==='drug');}
function getItem(id){return items.find(x=>x.id===id);}
function orderedReview(){const idx=new Map(order.map((id,i)=>[id,i]));const list=medicines().slice().sort((a,b)=>(idx.get(a.id)??999)-(idx.get(b.id)??999));return [...list.filter(x=>!isPrn(x)),...list.filter(isPrn)];}
function orderedCopy(){return orderedReview().filter(x=>!x.excluded);}
function chooseSort(){const drugs=medicines();const incl=A.sort(drugs.map(x=>({...x,excluded:false})),$('sortSelect').value);order=incl.map(x=>x.id);renderAll();}
function normalUnitCount(m){const n=A.unitsPerDose(m);return n!==null&&Number.isFinite(n)&&n>0?n:null;}
// Orden de las tomas: desayuno, comida, merienda, cena y antes de dormir.
const SLOT_NAMES=['Desayuno','Comida','Merienda','Cena','Antes de dormir'];
const SLOT_SHORT=['Des','Com','Mer','Cena','Dorm'];
const DAYS_SHORT=['L','M','X','J','V','S','D'];
function activeAmounts(m){return A.chosenAmounts(m);}
function editSlot(id,j){
 const m=getItem(id);if(!m)return;
 if(m.interval==='48'&&!m.verified48){m._choose48=true;renderReview();$('reviewStatus').textContent='Confirma antes si cada 48 horas significa días alternos o media unidad diaria.';return;}
 if(A.isAvk(m)&&!m.irregular?.text?.trim()){$('reviewStatus').textContent='En AVK introduce la pauta individual en «Pauta irregular»; no se deduce del envase.';m.irregularOpen=true;renderReview();return;}
 const counts=activeAmounts(m);
 if(counts[j]<=0){const suggestion=m.verified48==='half'?0.5:normalUnitCount(m);if(suggestion!==null)counts[j]=suggestion;}
 m.slotAmounts=counts;m.editSlot=j;
 renderAll();$('reviewStatus').textContent=counts[j]>0?'Toma seleccionada. Puedes modificar sus unidades con los controles.':'Cantidad por toma desconocida: introduce unidades antes de usar esta franja.';
}
function setAmount(id,j,value){const m=getItem(id);if(!m)return;const n=Number(String(value).replace(',','.'));
 if(!Number.isFinite(n)||n<0||n>20){$('reviewStatus').textContent='Introduce entre 0 y 20 unidades, o elimina la toma con «Quitar».';return;}
 const counts=activeAmounts(m);counts[j]=Math.round(n*1000)/1000;m.slotAmounts=counts;m.amountEdited=true;m.editSlot=j;
 renderAll();$('reviewStatus').textContent=n?'Unidades actualizadas para los formatos correspondientes.':'Toma eliminada; puedes volver a activarla.';
}
function confirm48(id,choice){
 const m=getItem(id);if(!m)return;
 if(choice==='half'&&normalUnitCount(m)!==1){$('reviewStatus').textContent='No se ha podido verificar media unidad: comprueba concentración y dosis.';return;}
 m.verified48=choice;m.slotAmounts=[0,0,0,0,0];m.editSlot=null;m.amountEdited=false;m._choose48=false;
 renderAll();$('reviewStatus').textContent=choice==='half'?'Confirmado: 0.5 comprimido cada 24 horas. Selecciona las tomas si quieres un formato por comidas.':choice==='alternate'?'Pauta cada 48 horas confirmada.':'Pauta de 48 horas sin confirmar.';
}
function setDays(id,days){const m=getItem(id);if(!m)return;m.irregular.days=days.slice().sort((a,b)=>a-b);renderAll();}
function irregularMode(id,mode){const m=getItem(id);if(!m)return;m.irregular.mode=mode;renderAll();}
function renderIrregular(row,m){
 const toggle=button((m.irregularOpen?'▾':'▸')+' Pauta irregular',()=>{m.irregularOpen=!m.irregularOpen;renderReview();},'irregularToggle'+(A.weeklyData(m)?' active':'') );
 row.append(toggle);
 if(!m.irregularOpen)return;
 const panel=el('div','irregularPanel');
 const line=el('div','irregularMode');const legend=el('label','','Tipo de pauta');const select=el('select');
 [['days','Días concretos de la semana'],['text','Pauta variable por días (texto libre)']].forEach(([v,t])=>{const o=el('option','',t);o.value=v;o.selected=m.irregular.mode===v;select.append(o);});
 select.addEventListener('change',()=>irregularMode(m.id,select.value));line.append(legend,select);panel.append(line);
 if(m.irregular.mode==='days'){
  panel.append(el('div','minorHeading','Días en que se administra (resto: descanso)'));
  const buttons=el('div','daysButtons');for(let i=0;i<7;i++){
   const selected=m.irregular.days.includes(i);const b=button(DAYS_SHORT[i],()=>{const d=new Set(m.irregular.days);selected?d.delete(i):d.add(i);setDays(m.id,[...d]);},'weekday'+(selected?' active':''),A.DAYS[i]);
   b.setAttribute('aria-pressed',String(selected));buttons.append(b);
  }panel.append(buttons);
  const shortcuts=el('div','smallActions');shortcuts.append(button('L-X-V',()=>setDays(m.id,[0,2,4]),'quiet'),button('Todos',()=>setDays(m.id,[0,1,2,3,4,5,6]),'quiet'));panel.append(shortcuts);
  panel.append(el('p','hint',m.irregular.days.length===0?'No hay días seleccionados: no se generará una pauta semanal.':m.irregular.days.length===7?'Todos los días: no se añade una restricción semanal.':'Se incluirán los días concretos en todos los formatos. Comprueba también las unidades por toma.'));
 }else{
  panel.append(el('label','fieldLabel','Pauta exacta, con días y cantidades (sin inferencias)'));
  const ta=el('textarea');ta.rows=3;ta.placeholder='Ej.: lunes 1 comprimido; martes 0.5; miércoles 1...';ta.value=m.irregular.text||'';
  ta.addEventListener('input',()=>{m.irregular.text=ta.value;renderOrder();renderClinical();});panel.append(ta);
  panel.append(el('p','hint','El texto se reproducirá tal cual en los tres formatos. Útil para acenocumarol o dosis variables; comprueba el original.'));
 }
 row.append(panel);
}
function renderReview(){
 const dest=$('medList');dest.replaceChildren();const meds=orderedReview();
 $('medCount').replaceChildren(el('span','',meds.length+' medicamentos'),el('span','',meds.filter(x=>!x.excluded).length+' para copiar'),el('span','',meds.filter(x=>x.interval==='48'&&!x.verified48).length+' pautas de 48 h pendientes'));
 if(!meds.length){dest.append(el('p','muted','No se han identificado medicamentos.'));return;}
 for(const m of meds){
  const row=el('div','medRow compactMed'+(m.excluded?' excluded':''));row.dataset.id=m.id;
  const top=el('div','medSummary compactSummary');
  const grip=button('☰',()=>{},'reviewGrip','Arrastrar '+A.displayName(m));grip.setAttribute('aria-label','Arrastrar '+A.displayName(m));grip.addEventListener('pointerdown',e=>dragStart(e,m.id,grip));
  const omit=button(m.excluded?'↶':'×',()=>{m.excluded=!m.excluded;renderAll();},'omit'+(m.excluded?' inactive':''),m.excluded?'Incluir en copia':'Excluir solo del texto copiado');
  const ident=el('div','medIdentity');ident.append(el('strong','',A.displayName(m)+(m.strength?' '+m.strength:'')));
  let freq=A.getFrequency(m)||'Pauta no identificada';
  if(m.verified48==='half')freq='0.5 comprimido cada 24 h · confirmado';
  if(m.verified48==='alternate')freq='cada 48 h · confirmado';
  ident.append(el('div','detail',freq+(m.dose&&!m.strength?' · '+m.dose:'')));
  if(!m.drugKey)ident.append(el('small','smallReview','No reconocido; comprueba el original.'));
  else if(m.interval==='48'&&!m.verified48)ident.append(button('⚠ Confirmar pauta',()=>{m._choose48=!m._choose48;renderReview();},'interval48'));
  else if(m.interval==='48')ident.append(button('Cambiar pauta',()=>{m._choose48=!m._choose48;renderReview();},'miniLinkButton'));
  if(A.isAvk(m))ident.append(el('small','smallReview','Confirmar pauta individual; no se deduce del envase.'));
  const expected={'24':1,'12':2,'8':3,'6':4}[m.interval];
  const count=activeAmounts(m).filter(x=>x>0).length;
  if(expected&&count&&count!==expected)ident.append(el('small','smallReview','⚠ Tomas seleccionadas distintas de la frecuencia registrada.'));
  const actions=el('div','moveButtons');const i=meds.findIndex(x=>x.id===m.id);
  const up=button('↑',()=>move(m.id,-1),'','Subir');const down=button('↓',()=>move(m.id,1),'','Bajar');
  up.disabled=i===0||isPrn(m)!==isPrn(meds[i-1]);down.disabled=i===meds.length-1||isPrn(m)!==isPrn(meds[i+1]);actions.append(up,down);
  top.append(grip,omit,ident,actions);row.append(top);
  if(!A.isAvk(m)){
   const slots=el('div','slotPills');const amounts=activeAmounts(m);
   for(let j=0;j<5;j++){
    const amount=amounts[j];const small=j===2||j===4;
    const lab=SLOT_SHORT[j]+(amount>0?' '+amount:'');
    const b=button(lab,()=>editSlot(m.id,j),'slotPill'+(small?' minor':'')+(amount>0?' selected':''),SLOT_NAMES[j]+' · '+(amount>0?amount+' unidades':'sin configurar'));
    b.setAttribute('aria-pressed',String(amount>0));slots.append(b);
   }row.append(slots);
   if(m.editSlot!=null){const j=m.editSlot,amount=amounts[j];const editor=el('div','amountEditor');
    editor.append(el('span','',SLOT_NAMES[j]+':'));
    const minus=button('−',()=>setAmount(m.id,j,Math.max(0,amount-0.5)),'qtyBtn','Restar 0.5');minus.setAttribute('aria-label','Restar 0.5 unidades');editor.append(minus);
    const n=el('input');n.type='number';n.step='any';n.min='0';n.max='20';n.value=amount||'';n.placeholder='unidades';n.setAttribute('aria-label','Unidades en '+SLOT_NAMES[j]);
    n.addEventListener('change',()=>setAmount(m.id,j,n.value));editor.append(n);
    const plus=button('+',()=>setAmount(m.id,j,amount+0.5),'qtyBtn','Añadir 0.5');plus.setAttribute('aria-label','Añadir 0.5 unidades');editor.append(plus);
    editor.append(button('Quitar',()=>setAmount(m.id,j,0),'quiet miniAction'));
    editor.append(button('Cerrar',()=>{m.editSlot=null;renderReview();},'quiet miniAction'));row.append(editor);
   }
  }
  if(m._choose48){const p=el('div','confirm48');p.append(el('span','','¿Cómo toma realmente este medicamento?'));
   const actions=el('div','choice48');const half=button('0.5 comprimido cada 24 h',()=>confirm48(m.id,'half'),'quiet');half.disabled=normalUnitCount(m)!==1||/c[aá]psul/i.test(m.rawName);
   actions.append(half,button('Dosis cada 48 h',()=>confirm48(m.id,'alternate'),'quiet'),button('Sin confirmar',()=>confirm48(m.id,''),'quiet'));p.append(actions);row.append(p);
  }
  renderIrregular(row,m);dest.append(row);
 }
}
function supplementalLines(){
 if(!$('includeSupplements').checked)return [];
 const timing=$('supplementTiming').value==='after'?'después de las comidas principales':'entre comidas';
 return items.filter(x=>x.kind==='nutrition'&&!/espesante|modulos espesantes/i.test(A.normal(x.rawName)))
   .map(x=>(x.name&&x.name!=='Espesante / producto nutricional'?x.name:'Suplemento nutricional oral')+': '+timing);
}
function exportFinal(){
 const pharmacology=A.exportText(orderedCopy(),$('copyMode').value);
 const extra=supplementalLines();
 return [pharmacology,extra.length?'SUPLEMENTOS NUTRICIONALES\n'+extra.join('\n'):''].filter(Boolean).join('\n\n');
}
let generatedOutput='';
function renderOrder(force=false){
 const next=exportFinal();const field=$('outputText');
 const hasUserChanges=field.value!==generatedOutput&&field.value.trim()!=='';
 if(!hasUserChanges||force){field.value=next;generatedOutput=next;$('manualEditWarning').hidden=true;}
 else {$('manualEditWarning').hidden=false;$('copyStatus').textContent='El texto tiene cambios manuales. No se sobrescribirá; pulsa «Regenerar» para aplicar la nueva pauta.';}
}
function move(id,delta){const list=orderedReview(),i=list.findIndex(x=>x.id===id),j=i+delta;if(j<0||j>=list.length)return;if(isPrn(list[i])!==isPrn(list[j])){$('reviewStatus').textContent='La medicación a demanda permanece al final.';return;}
 const a=order.indexOf(list[i].id),b=order.indexOf(list[j].id);if(a<0||b<0)return;[order[a],order[b]]=[order[b],order[a]];renderAll();}
function dragStart(ev,id,handle){if(ev.pointerType==='mouse'&&ev.button!==0)return;ev.preventDefault();handle.setPointerCapture(ev.pointerId);handle.classList.add('dragging');let targetId=null;
 const onMove=e=>{const node=document.elementFromPoint(e.clientX,e.clientY)?.closest('.medRow');document.querySelectorAll('.drag-target').forEach(x=>x.classList.remove('drag-target'));targetId=node?.dataset.id||null;if(node&&targetId!==id)node.classList.add('drag-target');};
 const finish=()=>{handle.removeEventListener('pointermove',onMove);handle.removeEventListener('pointerup',finish);handle.removeEventListener('pointercancel',finish);document.querySelectorAll('.drag-target').forEach(x=>x.classList.remove('drag-target'));handle.classList.remove('dragging');if(!targetId||targetId===id)return;const first=getItem(id),second=getItem(targetId);if(!first||!second)return;if(isPrn(first)!==isPrn(second)){$('reviewStatus').textContent='La medicación a demanda permanece en su bloque.';return;}
 const a=order.indexOf(id),b=order.indexOf(targetId);if(a<0||b<0)return;order.splice(a,1);order.splice(b,0,id);renderAll();};
 handle.addEventListener('pointermove',onMove);handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
}
function clearSchedules(){
 for(const m of medicines()){m.slotAmounts=[0,0,0,0,0];m.amountEdited=false;m.editSlot=null;}
 renderAll();$('reviewStatus').textContent='Franjas desmarcadas. En los formatos no horarios se conservará cada frecuencia original.';
}
// Apoyo a la revisión, sin modificar nunca prescripciones ni presentarse como verificador completo.
function guidanceLink(text,url){const a=el('a','',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function renderOptimization(){
 const root=$('optimizationReview');root.replaceChildren();if(!items.length)return;
 const drugs=medicines(),found=new Set(drugs.map(x=>x.drugKey));
 const head=el('h3','optimizationTitle','Optimización y adecuación');root.append(head);
 const ibps=drugs.filter(x=>x.family==='ibp');
 for(const med of ibps){
  const pane=el('details','clinicalTool');pane.append(el('summary','','Revisar indicación de '+A.displayName(med)));
  pane.append(el('p','','Antes de considerar la retirada, revisar ERGE complicada o esofagitis grave, Barrett, úlcera péptica activa o complicada, H. pylori durante tratamiento, hipersecreción y necesidad de gastroprotección según riesgo individual. No tener datos no equivale a descartar una indicación.'));
  const choices=el('fieldset');choices.append(el('legend','fieldLabel','Situación clínica (a confirmar)'));
  const statuses=[['unknown','Datos insuficientes / no revisado'],['keep','Indicación de mantenimiento o alto riesgo digestivo identificado'],['possible','Sin indicación de mantenimiento tras revisión clínica']];
  const name='ppi-'+med.id;let chosen='unknown';let verified=false;
  for(const [value,label] of statuses){const l=el('label');const inp=el('input');inp.type='radio';inp.name=name;inp.value=value;inp.checked=value==='unknown';l.append(inp,document.createTextNode(label));choices.append(l);inp.addEventListener('change',()=>{chosen=value;updateGuidance();});}
  pane.append(choices);
  const checklist=el('label','checkline');const tick=el('input');tick.type='checkbox';checklist.append(tick,document.createTextNode(' He descartado indicaciones de mantenimiento y alto riesgo gastrointestinal tras revisar antecedentes y antitrombóticos.'));pane.append(checklist);
  const result=el('div','caution','Indicación sin verificar: no generar retirada.');pane.append(result);
  const generate=button('Ver propuesta orientativa de retirada',()=>{proposal.hidden=!proposal.hidden;},'quiet');generate.disabled=true;pane.append(generate);
  const proposal=el('div','proposal');proposal.hidden=true;pane.append(proposal);
  tick.addEventListener('change',()=>{verified=tick.checked;updateGuidance();});
  function plan(){
   const strength=med.strength||'';
   if(med.drugKey==='Omeprazol'&&/^20\s*mg$/i.test(strength))return 'Ejemplo para valorar: omeprazol 10 mg cada 24 h durante aproximadamente 1–2 semanas y, si se tolera, suspensión. Confirmar disponibilidad de la presentación y seguimiento clínico.';
   if(med.drugKey==='Omeprazol'&&/^40\s*mg$/i.test(strength))return 'Ejemplo para valorar: pasar de omeprazol 40 mg a 20 mg cada 24 h durante 1–2 semanas; considerar luego 10 mg cada 24 h durante otras 1–2 semanas antes de suspender, según evolución.';
   return 'Propuesta individualizada: considerar descenso escalonado hacia una dosis menor durante 1–2 semanas por escalón, utilizando una presentación autorizada y comprobando indicación, tolerancia y síntomas. No se propone una dosis concreta porque falta una equivalencia validada para esta presentación.';
  }
  function updateGuidance(){
   generate.disabled=!(chosen==='possible'&&verified);
   if(chosen==='unknown')result.textContent='Datos insuficientes: no valorar la retirada sin revisar la indicación y el riesgo gastrointestinal.';
   else if(chosen==='keep')result.textContent='Indicación/riesgo identificado: no proponer retirada rutinaria.';
   else if(!verified)result.textContent='Antes de generar una propuesta, confirma que has revisado los factores de riesgo digestivo.';
   else result.textContent='Posible candidato a deprescripción tras valoración clínica. Esta herramienta solo prepara un borrador y no modifica la prescripción.';
   proposal.textContent=plan()+'\n\nSi aparecen síntomas, valorar antiácidos/alginatos ocasionales, antagonista H2 o IBP a demanda cuando proceda. Advertir de posible rebote ácido y reevaluar síntomas.';
   if(generate.disabled)proposal.hidden=true;
  }
  const refs=el('div','referenceLinks');refs.append(guidanceLink('AGA: cuándo retirar IBP','https://gastro.org/clinical-guidance/de-prescribing-proton-pump-inhibitors-ppis/'),guidanceLink('Guía de retirada: deprescribing.com','https://deprescribing.com/08-alimentary-tract-and-metabolism/01-proton-pump-inhibitors.html'));
  pane.append(refs);root.append(pane);
 }
 const combination=[];
 if(found.has('Sitagliptina')&&found.has('Metformina'))combination.push('Sitagliptina + metformina: comprobar si las dosis y frecuencias coinciden con una combinación autorizada en España.');
 if(found.has('Amlodipino')&&found.has('Valsartán'))combination.push('Amlodipino + valsartán: valorar una presentación combinada si las dosis, la pauta y la indicación son compatibles.');
 if(combination.length){const pane=el('details','clinicalTool');pane.append(el('summary','','Posibles combinaciones a dosis fijas'));for(const msg of combination)pane.append(el('p','',msg));pane.append(el('p','caution','Coincidencia de principios activos solamente. No implica equivalencia de dosis ni recomendación de cambio. Revisar ficha técnica y comercialización.'));pane.append(guidanceLink('Buscar asociación en CIMA (AEMPS)','https://cima.aemps.es/cima/publico/home.html'));root.append(pane);}
 const options=[];
 if(found.has('Furosemida'))options.push('Furosemida: torasemida (otro diurético de asa; dosis NO intercambiables automáticamente).');
 if(found.has('Torasemida'))options.push('Torasemida: furosemida (otro diurético de asa; dosis NO intercambiables automáticamente).');
 if(drugs.some(d=>d.family==='ieca'))options.push('IECA: existen otros IECA; la elección y dosis dependen de la indicación, función renal y tolerancia.');
 if(drugs.some(d=>d.family==='ara2'))options.push('ARA-II: existen otros ARA-II; no hay una equivalencia universal en miligramos.');
 if(options.length){const pane=el('details','clinicalTool');pane.append(el('summary','','Consultar alternativas de la misma familia'));for(const msg of options)pane.append(el('p','',msg));pane.append(el('p','hint','Listado orientativo, sin cambios automáticos ni equivalencias posológicas calculadas.'));root.append(pane);}
 if(!ibps.length&&!combination.length&&!options.length)root.append(el('p','hint','No se han activado módulos de optimización para los medicamentos identificados. Esto no descarta oportunidades de mejora.'));
}
// Actualizar los avisos por fraccionamiento sin reiniciar formularios clínicos del IBP.
function renderFractionWarnings(){
 const dest=$('fractionWarnings');if(!dest)return;dest.replaceChildren();
 for(const m of medicines()){
  const fractional=A.chosenAmounts(m).some(n=>n>0&&Math.abs(n-Math.round(n))>0.0001)||
   (m.verified48==='half')||(()=>{const n=A.unitsPerDose(m);return n!==null&&n>0&&Math.abs(n-Math.round(n))>0.0001;})();
  if(!fractional)continue;
  const raw=A.normal(m.rawName);
  const modified=/\b(?:retard|lp|xr|sr|cr|oros|gastroresistente|gastro-resistente)\b|liberacion (?:prolongada|modificada|retardada)|recubrimiento enterico/.test(raw);
  const capsule=/capsul/.test(raw);
  if(modified)addAlert(dest,'⚠ Fraccionamiento y formulación especial: '+A.displayName(m),'Hay una fracción de unidad en una presentación de liberación modificada o gastrorresistente. Algunas permiten partirse y otras no: comprobar la ficha técnica concreta antes de hacerlo.');
  if(capsule)addAlert(dest,'⚠ Fracción de cápsula: '+A.displayName(m),'La división del contenido no garantiza una dosis homogénea y abrir una cápsula puede estar contraindicado según formulación. Revisar ficha técnica y presentación alternativa.');
 }
 }
function renderClinical(){const dest=$('clinicalReview');dest.replaceChildren();if(!items.length){dest.append(el('p','muted','Introduce un tratamiento.'));return;}const r=A.review(items);
 if(r.unknown)addAlert(dest,'Medicamentos no reconocidos',`${r.unknown} medicamento(s) no se han comprobado.`);
 for(const a of r.alerts)addAlert(dest,`${a.level}: ${a.a} + ${a.b}`,a.desc);
 for(const d of r.duplicates)addAlert(dest,'Posible duplicidad',d);
 if(!r.alerts.length&&!r.duplicates.length)addAlert(dest,'Sin coincidencias en las reglas incluidas','Esto no equivale a ausencia de interacciones. La cobertura de esta versión es limitada.');
 const fractionContainer=el('div','fractionWarnings');fractionContainer.id='fractionWarnings';dest.append(fractionContainer);
 dest.append(el('p','hint',`Medicamentos identificados: ${r.recognized}. ACB, DBI y STOPP/START todavía no calculados. Excluir de la copia no excluye del análisis.`));renderFractionWarnings();renderOptimization();
}
function addAlert(target,title,text){const row=el('div','alertLine');row.append(el('strong','',title),el('span','',text));target.append(row);}
function renderAll(){renderReview();renderOrder();renderFractionWarnings();}
function parse(){const raw=$('rawInput').value;if(!raw.trim()){$('parseStatus').textContent='Introduce un tratamiento.';return;}const result=A.parse(raw);if(result.blocked){reset();$('parseStatus').classList.add('bad');$('parseStatus').textContent='Posible dato identificativo detectado: anonimiza el texto antes de procesarlo.';return;}
 $('parseStatus').classList.remove('bad');items=result.items;for(const m of medicines()){m.verified48='';m.slotAmounts=[0,0,0,0,0];m._choose48=false;m.irregularOpen=false;m.editSlot=null;m.amountEdited=false;}
 const meds=medicines(),others=items.filter(x=>x.kind!=='drug');$('parseStatus').textContent=`Formato ${result.format}: ${meds.length} medicamentos y ${others.length} productos no farmacológicos. Revisa el texto antes de copiar.`;
 $('otherList').replaceChildren();$('additionalProducts').hidden=!others.length;$('otherCount').textContent=String(others.length);for(const other of others)$('otherList').append(el('span','other-chip',other.name));$('reviewStatus').textContent='';$('copyStatus').textContent='';chooseSort();renderClinical();}
function reset(){items=[];order=[];$('medList').replaceChildren(el('p','muted','Introduce un tratamiento para empezar.'));$('medCount').replaceChildren();$('otherList').replaceChildren();$('additionalProducts').hidden=true;$('outputText').value='';generatedOutput='';$('manualEditWarning').hidden=true;$('clinicalReview').replaceChildren(el('p','muted','Reconoce un tratamiento para consultar las comprobaciones disponibles.'));$('optimizationReview').replaceChildren();$('copyStatus').textContent='';$('reviewStatus').textContent='';$('parseStatus').textContent='';}
async function copy(){const txt=$('outputText').value;if(!txt.trim()){$('copyStatus').textContent='No hay medicamentos para copiar.';return;}try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(txt);else{$('outputText').focus();$('outputText').select();if(!document.execCommand('copy'))throw Error('no disponible');}$('copyStatus').textContent='Texto copiado. Los productos sanitarios y los espesantes no se incluyen.';}catch(e){$('outputText').focus();$('outputText').select();$('copyStatus').textContent='Selecciona el texto y pulsa Ctrl+C.';}}
$('parseButton').addEventListener('click',parse);
$('exampleA').addEventListener('click',()=>{$('rawInput').value=exampleA;parse();});
$('exampleD').addEventListener('click',()=>{$('rawInput').value=exampleD;parse();});
$('clearButton').addEventListener('click',()=>{$('rawInput').value='';reset();});
$('sortSelect').addEventListener('change',chooseSort);
$('resetOrder').addEventListener('click',chooseSort);
$('copyMode').addEventListener('change',()=>renderOrder());
$('clearSchedules').addEventListener('click',clearSchedules);
$('includeSupplements').addEventListener('change',()=>{renderOrder();$('supplementOptions').hidden=!$('includeSupplements').checked;});
$('supplementTiming').addEventListener('change',renderOrder);
$('copyButton').addEventListener('click',copy);
$('regenerateText').addEventListener('click',()=>{renderOrder(true);$('copyStatus').textContent='Texto regenerado desde el tratamiento revisado.';});
$('outputText').addEventListener('input',()=>{$('manualEditWarning').hidden=$('outputText').value===generatedOutput;});
})();
