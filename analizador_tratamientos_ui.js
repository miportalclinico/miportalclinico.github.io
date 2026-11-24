/* Portal Clínico · Analizador de tratamientos. Interfaz compacta y procesamiento local. */
'use strict';
(()=>{
const A=window.TreatmentAnalyzer;
const $=id=>document.getElementById(id);
let items=[],order=[],draggingId=null;
let ppiDecisions=new Map();
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
function toggleSlot(id,j){
 const m=getItem(id);if(!m)return;
 if(A.isAvk(m)){m.avkSlot=m.avkSlot===j?null:j;renderAll();$('reviewStatus').textContent='Antivitamina K: se indica el momento, siempre según pauta de INR, sin asignar dosis.';return;}
 if(m.interval==='48'&&!m.verified48){m._choose48=true;renderReview();$('reviewStatus').textContent='Confirma primero cómo se administra la pauta de 48 horas.';return;}
 const counts=activeAmounts(m);
 counts[j]=counts[j]>0?0:(m.verified48==='half'?0.5:1);
 m.slotAmounts=counts;
 if(counts[j]===0&&m.editSlot===j)m.editSlot=null;
 renderAll();$('reviewStatus').textContent=counts[j]?'Toma seleccionada: 1 unidad por defecto (o 0.5 si se confirmó media unidad diaria).':'Toma desactivada.';
}
function editSlot(id,j){const m=getItem(id);if(!m||A.isAvk(m))return;
 if(m.interval==='48'&&!m.verified48){m._choose48=true;renderReview();return;}
 m.editSlot=m.editSlot===j?null:j;renderReview();
}
function setAmount(id,j,value){const m=getItem(id);if(!m)return;const n=Number(String(value).replace(',','.'));
 if(!Number.isFinite(n)||n<0||n>20){$('reviewStatus').textContent='Introduce entre 0 y 20 unidades, o elimina la toma con «Quitar».';return;}
 const counts=activeAmounts(m);counts[j]=Math.round(n*1000)/1000;m.slotAmounts=counts;m.amountEdited=true;m.editSlot=j;
 renderAll();$('reviewStatus').textContent=n?'Unidades actualizadas para los formatos correspondientes.':'Toma eliminada; puedes volver a activarla.';
}
function confirm48(id,choice){
 const m=getItem(id);if(!m)return;
 if(choice==='half'&&!m._confirmHalfPending){m._confirmHalfPending=true;renderReview();$('reviewStatus').textContent='Comprueba que realmente toma medio comprimido diario (no 0.5 mg).';return;}
 m.verified48=choice;m.slotAmounts=[0,0,0,0,0];m.editSlot=null;m.amountEdited=false;m._choose48=false;m._confirmHalfPending=false;
 renderAll();$('reviewStatus').textContent=choice==='half'?'Confirmado: medio comprimido cada 24 h. No se calculan mg si falta la presentación.':choice==='alternate'?'Pauta cada 48 horas confirmada.':'Pauta de 48 horas sin confirmar.';
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
  panel.append(el('p','hint','El texto se reproducirá tal cual en los tres formatos. Útil para dosis variables según días; comprueba el original.'));
 }
 row.append(panel);
}
function renderReview(){
 const dest=$('medList');dest.replaceChildren();const meds=orderedReview();
 $('medCount').replaceChildren(el('span','',meds.length+' medicamentos'),el('span','',meds.filter(x=>!x.excluded).length+' para copiar'),el('span','',meds.filter(x=>!A.isAvk(x)&&x.interval==='48'&&!x.verified48).length+' pautas de 48 h pendientes'));
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
  ident.append(el('div','detail',freq+(!A.isAvk(m)&&m.dose&&!m.strength?' · '+m.dose:'')));
  if(!m.drugKey)ident.append(el('small','smallReview','No reconocido; comprueba el original.'));
  else if(!A.isAvk(m)&&m.interval==='48'&&!m.verified48)ident.append(button('⚠ Confirmar pauta',()=>{m._choose48=!m._choose48;renderReview();},'interval48'));
  else if(!A.isAvk(m)&&m.interval==='48')ident.append(button('Cambiar pauta',()=>{m._choose48=!m._choose48;renderReview();},'miniLinkButton'));
  if(A.isAvk(m))ident.append(el('small','smallReview','Dosis según pauta individual de INR; selecciona solo el momento de toma.'));
  const expected={'24':1,'12':2,'8':3,'6':4}[m.interval];
  const count=activeAmounts(m).filter(x=>x>0).length;
  if(!A.isAvk(m)&&expected&&count&&count!==expected)ident.append(el('small','smallReview','⚠ Tomas seleccionadas distintas de la frecuencia registrada.'));
  const actions=el('div','moveButtons');const i=meds.findIndex(x=>x.id===m.id);
  const up=button('↑',()=>move(m.id,-1),'','Subir');const down=button('↓',()=>move(m.id,1),'','Bajar');
  up.disabled=i===0||isPrn(m)!==isPrn(meds[i-1]);down.disabled=i===meds.length-1||isPrn(m)!==isPrn(meds[i+1]);actions.append(up,down);
  top.append(grip,omit,ident,actions);row.append(top);
  {
   const slots=el('div','slotPills');const amounts=activeAmounts(m);
   for(let j=0;j<5;j++){
    const avk=A.isAvk(m), amount=avk?(m.avkSlot===j?1:0):amounts[j], small=j===2||j===4;
    const lab=SLOT_SHORT[j]+(!avk&&amount>0?' '+amount:'');
    const b=button(lab,()=>toggleSlot(m.id,j),'slotPill'+(small?' minor':'')+(amount>0?' selected':''),SLOT_NAMES[j]+' · '+(avk?'según pauta':amount>0?amount+' unidades':'sin configurar'));
    b.setAttribute('aria-pressed',String(amount>0));slots.append(b);
   }row.append(slots);
   if(!A.isAvk(m)){
    const any=amounts.some(x=>x>0);
    if(any||m.editSlot!==null){
     const tools=el('div','amountTools');
     tools.append(button(m.editSlot!==null?'Cerrar ajuste de cantidades':'± Ajustar cantidades',()=>{
      m.editSlot=m.editSlot!==null?null:Math.max(0,amounts.findIndex(x=>x>0));renderReview();
     },'quiet miniAction'));row.append(tools);
    }
    if(m.editSlot!=null){const j=m.editSlot,amount=amounts[j];const editor=el('div','amountEditor');
     const select=el('select');select.setAttribute('aria-label','Franja a ajustar');
     SLOT_NAMES.forEach((name,i)=>{const op=el('option','',name);op.value=String(i);op.selected=i===j;select.append(op);});
     select.addEventListener('change',()=>{m.editSlot=Number(select.value);renderReview();});editor.append(select);
     const minus=button('−',()=>setAmount(m.id,j,Math.max(0,amount-0.5)),'qtyBtn','Restar 0.5');minus.setAttribute('aria-label','Restar 0.5 unidades');editor.append(minus);
     const n=el('input');n.type='number';n.step='any';n.min='0';n.max='20';n.value=amount;n.setAttribute('aria-label','Unidades en '+SLOT_NAMES[j]);
     n.addEventListener('change',()=>setAmount(m.id,j,n.value));editor.append(n);
     const plus=button('+',()=>setAmount(m.id,j,amount+0.5),'qtyBtn','Añadir 0.5');plus.setAttribute('aria-label','Añadir 0.5 unidades');editor.append(plus);
     row.append(editor);
    }
   }
  }
  if(!A.isAvk(m)&&m._choose48){const p=el('div','confirm48');p.append(el('span','','¿Cómo toma realmente este medicamento?'));
   const actions=el('div','choice48');const half=button('0.5 comprimido cada 24 h',()=>confirm48(m.id,'half'),'quiet');
   actions.append(half,button('Dosis cada 48 h',()=>confirm48(m.id,'alternate'),'quiet'),button('Sin confirmar',()=>confirm48(m.id,''),'quiet'));p.append(actions);
   if(m._confirmHalfPending){const confirm=el('div','halfConfirm');
    confirm.append(el('p','hint','Confirma que la pauta REAL es medio comprimido al día y que su presentación permite partirse. Si no consta concentración, no se calcularán mg. Si es cápsula o liberación modificada, revisa la ficha técnica.'));
    confirm.append(button('Sí, confirmar medio comprimido al día',()=>confirm48(m.id,'half'),'primary miniAction'));
    p.append(confirm);
   }row.append(p);
  }
  if(!A.isAvk(m))renderIrregular(row,m);dest.append(row);
 }
}
function supplementalLines(){
 if(!$('includeSupplements').checked)return [];
 const timing=$('supplementTiming').value==='after'?'después de las comidas principales':'entre comidas';
 return items.filter(x=>x.kind==='nutrition'&&!/espesante|modulos espesantes/i.test(A.normal(x.rawName)))
   .map(x=>(x.name&&x.name!=='Espesante / producto nutricional'?x.name:'Suplemento nutricional oral')+': '+timing);
}
// Reglas de instrucciones con respaldo en fichas técnicas. No inferir horarios
// ni aplicarlas a formulaciones, concentraciones o vías no comprobadas.
function foodInstruction(m){
 if(m.route&&/intravenosa|intramuscular|subcut[aá]nea|transd[eé]rmica|inhalatoria/i.test(m.route))return '';
 const name=A.normal(m.drugKey||'');
 if(name==='levotiroxina')return 'Tomar por la mañana en ayunas, al menos 30 minutos antes del desayuno. (CIMA, Eutirox, FT 64014)';
 if(name==='alendronato'||name==='acido alendronico')return 'Tomar con agua del grifo, al menos 30 minutos antes de la primera comida, bebida u otro medicamento; permanecer incorporado al menos 30 minutos. (CIMA, FT 67028)';
 if(name==='rivaroxaban'&&/^\s*(15|20)\s*mg\s*$/i.test(m.strength||''))return 'Los comprimidos de 15 y 20 mg deben tomarse con alimentos. (CIMA, FT 89322)';
 return '';
}
function foodInstructionLines(){
 if($('copyMode').value!=='patient'||!$('includeFoodNotes').checked)return [];
 return orderedCopy().map(m=>{const note=foodInstruction(m);return note?A.displayName(m)+(m.strength?' '+m.strength:'')+': '+note:null;}).filter(Boolean);
}
function exportFinal(){
 const pharmacology=A.exportText(orderedCopy(),$('copyMode').value);
 const extra=supplementalLines();
 const plans=[];const rescues=[];
 for(const m of medicines()){
  if(m.excluded)continue;
  const d=ppiDecisions.get(m.id);
  if(!d||d.status!=='possible'||!d.verified)continue;
  if(d.taper)plans.push(ppiTaper(m));
  if(d.reflux)rescues.push(ppiReflux(m));
 }
 const foodNotes=foodInstructionLines();
 return [pharmacology,extra.length?'SUPLEMENTOS NUTRICIONALES\n'+extra.join('\n'):'',
  foodNotes.length?'INDICACIONES DE ADMINISTRACIÓN CON ALIMENTOS\n'+foodNotes.join('\n'):'',
  plans.length?'PAUTA DE RETIRADA DE IBP\n'+plans.join('\n\n'):'',
  rescues.length?'ALTERNATIVAS PARA EL REFLUJO\n'+rescues.join('\n\n'):''].filter(Boolean).join('\n\n');
}
function ppiTaper(m){
 const base=A.displayName(m);const strength=(m.strength||'').trim();
 if(m.drugKey==='Omeprazol'&&/^20\s*mg$/i.test(strength))return base+': propuesta orientativa tras confirmar la indicación: 10 mg cada 24 h durante 1–2 semanas; después suspender si se tolera. Utilizar la presentación adecuada, sin dividir cápsulas gastrorresistentes. Reevaluar síntomas y necesidad de tratamiento.';
 if(m.drugKey==='Omeprazol'&&/^40\s*mg$/i.test(strength))return base+': propuesta orientativa tras confirmar la indicación: 20 mg cada 24 h durante 1–2 semanas; después 10 mg cada 24 h durante 1–2 semanas y suspender si se tolera. Ajustar el plan al contexto clínico y usar presentaciones adecuadas.';
 return base+': retirada progresiva a individualizar según indicación, dosis actual, formulación y tolerancia. No se ha calculado una dosis automática por falta de verificación.';
}
function ppiReflux(m){return A.displayName(m)+': si reaparece reflujo leve, valorar medidas posturales y dietéticas y alginato o antiácido a demanda si son apropiados. Si persiste, reevaluar; otras opciones según indicación incluyen antagonista H2 o IBP a demanda. Son alternativas a valorar, no medicación prescrita simultáneamente.';}

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
 for(const m of medicines()){m.slotAmounts=[0,0,0,0,0];m.avkSlot=null;m.amountEdited=false;m.editSlot=null;}
 renderAll();$('reviewStatus').textContent='Franjas desmarcadas. En los formatos no horarios se conservará cada frecuencia original.';
}
// Apoyo a la revisión, sin modificar nunca prescripciones ni presentarse como verificador completo.
function guidanceLink(text,url){const a=el('a','',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function renderOptimization(){
 const root=$('optimizationReview');root.replaceChildren();if(!items.length)return;
 const drugs=medicines(),found=new Set(drugs.map(x=>x.drugKey)),ibps=drugs.filter(x=>x.family==='ibp');
 const ppiActionNodes=[];
 root.append(el('h3','optimizationTitle','Adecuación de la prescripción'));
 for(const med of ibps){
  const state=ppiDecisions.get(med.id)||{status:'unknown',verified:false,taper:false,reflux:false};ppiDecisions.set(med.id,state);
  const pane=el('details','clinicalTool');pane.append(el('summary','','Revisar indicación de '+A.displayName(med)));
  pane.append(el('p','','Revisar reflujo complicado/esofagitis grave, Barrett, úlcera activa o complicada, hipersecreción, H. pylori durante su tratamiento y necesidad de gastroprotección según riesgo digestivo. La falta de datos no descarta una indicación.'));
  const field=el('fieldset');field.append(el('legend','fieldLabel','Situación clínica'));
  [['unknown','Datos insuficientes / sin revisar'],['keep','Mantener: indicación o alto riesgo gastrointestinal'],['possible','Posible retirada tras revisión clínica']].forEach(([v,label])=>{
   const l=el('label','checkline');const input=el('input');input.type='radio';input.name='ppi-'+med.id;input.value=v;input.checked=state.status===v;
   input.addEventListener('change',()=>{state.status=v;if(v!=='possible'){state.taper=false;state.reflux=false;state.verified=false;}sync();});l.append(input,document.createTextNode(' '+label));field.append(l);
  });pane.append(field);
  const line=el('label','checkline');const tick=el('input');tick.type='checkbox';tick.checked=state.verified;line.append(tick,document.createTextNode(' He comprobado indicación, antecedentes digestivos y antitrombóticos, y no encuentro motivo de mantenimiento.'));pane.append(line);
  tick.addEventListener('change',()=>{state.verified=tick.checked;if(!state.verified){state.taper=false;state.reflux=false;}sync();});
  const result=el('p','caution');pane.append(result);
  const refs=el('div','referenceLinks');refs.append(guidanceLink('AGA · Deprescripción de IBP','https://gastro.org/clinical-guidance/de-prescribing-proton-pump-inhibitors-ppis/'),guidanceLink('Guía de retirada · deprescribing.com','https://deprescribing.com/08-alimentary-tract-and-metabolism/01-proton-pump-inhibitors.html'));pane.append(refs);
  root.append(pane);
  const optim=el('div','ppiActions');optim.append(el('strong','','Omeprazol / IBP: '+A.displayName(med)));
  const note=el('p','hint','Añade instrucciones editables al final del tratamiento, tras revisar la indicación en Adecuación. No se modifica la prescripción original.');optim.append(note);
  const taper=button('',()=>{state.taper=!state.taper;sync();},'quiet');const rescue=button('',()=>{state.reflux=!state.reflux;sync();},'quiet');
  optim.append(taper,rescue);
  const preview=el('p','hint','');optim.append(preview);
  const sync=()=>{
   const ok=state.status==='possible'&&state.verified;
   if(!ok){state.taper=false;state.reflux=false;}
   taper.disabled=!ok;rescue.disabled=!ok;
   taper.textContent=(state.taper?'✓ Quitar':'＋ Añadir')+' pauta de retirada';
   rescue.textContent=(state.reflux?'✓ Quitar':'＋ Añadir')+' alternativas para el reflujo';
   result.textContent=state.status==='keep'?'Indicación de mantenimiento o riesgo identificado: no proponer retirada rutinaria.':state.status==='unknown'?'Datos insuficientes: revisar indicación y riesgo gastrointestinal antes de valorar retirada.':!state.verified?'Confirmar la evaluación clínica para preparar un borrador de retirada.':'Posible candidato a deprescripción: las propuestas son orientativas y requieren validación clínica.';
   preview.textContent=ok?(state.taper||state.reflux?'Los bloques seleccionados aparecen al final de «Ver o editar texto final».':'Selecciona las intervenciones que quieras añadir al texto final.'):'Acciones bloqueadas hasta confirmar la valoración clínica.';
   renderOrder();
  };
  ppiActionNodes.push({node:optim,sync});
 }
 root.append(el('h3','optimizationTitle','Optimización terapéutica'));
 for(const action of ppiActionNodes){root.append(action.node);action.sync();}
 if(!ibps.length)root.append(el('p','hint','No hay IBP identificados para revisión específica.'));
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
function makeLink(text,url){
 if(!/^https:\/\//i.test(String(url||'')))return el('span','',text+' (enlace no disponible)');
 const l=el('a','',text);l.href=url;l.target='_blank';l.rel='noopener noreferrer';return l;
}
function sectionHeading(text){return el('h3','docSectionHeading',text);}
function renderDocumental(dest){
 const engine=window.DocumentalInteractionEngine;
 if(!engine){addAlert(dest,'Base documental no disponible','No se puede ejecutar la comprobación.');return;}
 const result=engine.analyze(items);
 const intro=el('div','docNotice');intro.append(el('strong','','BASE v0.5 · SOLO PRUEBAS'),el('p','','342 reglas documentales pendientes de validación clínica. Las coincidencias no son alertas asistenciales y pueden contener errores de clasificación, contexto o cobertura. No tomar decisiones terapéuticas a partir de este prototipo.'));
 dest.append(intro);
 const totals=el('div','docStats');totals.append(el('strong','',`${result.matched.length} ${result.matched.length===1?'coincidencia documental':'coincidencias documentales'}`),el('span','',`${result.recognized}/${result.total} medicamentos identificados en la base · ${result.baseRules} reglas disponibles`));dest.append(totals);
 if(result.combosIdentified.length){const comboPane=el('details','clinicalTool docExpand');comboPane.append(el('summary','','Combinaciones antirretrovirales reconocidas ('+result.combosIdentified.length+')'));
  for(const c of result.combosIdentified)comboPane.append(el('p','docComponents',c.combo.toUpperCase()+': '+c.components.join(' + ')));dest.append(comboPane);
 }
 if(result.unknown.length){const pane=el('details','clinicalTool docExpand');pane.append(el('summary','','Medicamentos fuera de cobertura ('+result.unknown.length+')'));
   pane.append(el('p','caution','Su ausencia del diccionario no significa que carezcan de interacciones.'));
   for(const m of result.unknown)pane.append(el('p','',m.rawName||m.name));dest.append(pane);
 }
 if(!result.matched.length){dest.append(el('p','hint','No se han identificado coincidencias en esta base parcial. Esto NO descarta interacciones farmacológicas.'));}
 const groups=[
  {id:'contraindicacion',icon:'⛔',cls:'contra'},
  {id:'interaccion_clinicamente_relevante',icon:'⚠',cls:'relevant'},
  {id:'precaucion_monitorizacion',icon:'●',cls:'monitor'},
  {id:'informacion',icon:'ℹ',cls:'information'}
 ];
 for(const g of groups){const found=result.matched.filter(x=>x.rule.categoria===g.id);if(!found.length)continue;
  const box=el('section','docGroup');box.append(sectionHeading(g.icon+' '+engine.labels[g.id]+' ('+found.length+')'));
  for(const hit of found){const r=hit.rule;
   const node=el('details','docInteraction doc-'+g.cls);
   const summary=el('summary');const title=el('span','docLabel',hit.medications.map(m=>m.brand||m.name||m.rawName).join(' + '));summary.append(title);
   summary.append(el('span','docStatus','Documental · '+(hit.decision==='conditional'?'condiciones por verificar':'pendiente de validación')));node.append(summary);
   const inner=el('div','docBody');
   const field=(label,value)=>{if(!value)return;const p=el('p');p.append(el('strong','',label+': '),document.createTextNode(value));inner.append(p);};
   field('Principios implicados',r.principios_activos.join(' + '));field('Consecuencia descrita',r.consecuencia);
   field('Mecanismo',r.mecanismo);field('Actuación descrita en la fuente',r.actuacion_orientativa);
   field('Contexto / excepciones',r.contexto_y_limitaciones);field('Pendiente de comprobar',hit.needs||'Validación clínica independiente de la regla y de la categoría');
   const refs=el('div','docRefs');refs.append(el('strong','','Fuente(s): '));for(const f of (r.fuentes||[])){
    refs.append(makeLink((f.organismo||'Fuente')+' · '+(f.documento||r.id),f.url));refs.append(document.createTextNode(' · '));
   }inner.append(refs);
   inner.append(el('p','docFoot',`${r.id} · Revisión documental ${r.fecha_revision_documental||'no indicada'} · NO VALIDADA PARA ALERTAS CLÍNICAS`));
   node.append(inner);box.append(node);
  }dest.append(box);
 }
 if(result.withheld.length){const withheld=el('details','clinicalTool docExpand');withheld.append(el('summary','',`${result.withheld.length} coincidencias excluidas por formulación o régimen no aplicable`));
  withheld.append(el('p','hint','No se han mostrado como interacciones porque sus condiciones de origen no se cumplen. Esta exclusión solo valida el filtrado de reglas, no acredita seguridad farmacológica.'));
  for(const h of result.withheld)withheld.append(el('p','docFoot',h.rule.id+': '+h.rule.principios_activos.join(' + ')+' — '+h.needs));dest.append(withheld);
 }
 const links=el('div','docExternal');links.append(el('strong','','Consulta complementaria: '));
 links.append(makeLink('CIMA / AEMPS','https://cima.aemps.es/'),document.createTextNode(' · '),makeLink('BOT PLUS','https://www.farmaceuticos.com/botplus/'),document.createTextNode(' · '),makeLink('Liverpool VIH','https://www.hiv-druginteractions.org/checker'));
 dest.append(links);
}
function renderClinical(){
 const dest=$('clinicalReview');dest.replaceChildren();if(!items.length){dest.append(el('p','muted','Introduce un tratamiento.'));return;}
 renderDocumental(dest);
 const old=A.review(items);
 for(const duplicate of old.duplicates)addAlert(dest,'Posible duplicidad · comprobar',duplicate);
 const fractionContainer=el('div','fractionWarnings');fractionContainer.id='fractionWarnings';dest.append(fractionContainer);
 dest.append(el('p','hint','Las reglas antiguas no se suman a las 342 de v0.5 para evitar avisos duplicados. ACB, DBI y STOPP/START siguen sin calcularse. Excluir de la copia no excluye del análisis.'));
 renderFractionWarnings();renderOptimization();
}
function addAlert(target,title,text){const row=el('div','alertLine');row.append(el('strong','',title),el('span','',text));target.append(row);}
function renderAll(){renderReview();renderOrder();renderFractionWarnings();}
function parse(){const raw=$('rawInput').value;if(!raw.trim()){$('parseStatus').textContent='Introduce un tratamiento.';return;}const result=A.parse(raw);if(result.blocked){reset();$('parseStatus').classList.add('bad');$('parseStatus').textContent='Posible dato identificativo detectado: anonimiza el texto antes de procesarlo.';return;}
 $('parseStatus').classList.remove('bad');items=result.items;ppiDecisions=new Map();for(const m of medicines()){m.verified48='';m.slotAmounts=[0,0,0,0,0];m._choose48=false;m._confirmHalfPending=false;m.avkSlot=null;m.irregularOpen=false;m.editSlot=null;m.amountEdited=false;}
 const meds=medicines(),others=items.filter(x=>x.kind!=='drug');$('parseStatus').textContent=`Formato ${result.format}: ${meds.length} medicamentos y ${others.length} productos no farmacológicos. Revisa el texto antes de copiar.`;
 $('otherList').replaceChildren();$('additionalProducts').hidden=!others.length;$('otherCount').textContent=String(others.length);for(const other of others)$('otherList').append(el('span','other-chip',other.name));$('reviewStatus').textContent='';$('copyStatus').textContent='';chooseSort();renderClinical();}
function reset(){items=[];order=[];ppiDecisions=new Map();$('medList').replaceChildren(el('p','muted','Introduce un tratamiento para empezar.'));$('medCount').replaceChildren();$('otherList').replaceChildren();$('additionalProducts').hidden=true;$('outputText').value='';generatedOutput='';$('manualEditWarning').hidden=true;$('clinicalReview').replaceChildren(el('p','muted','Reconoce un tratamiento para consultar las comprobaciones disponibles.'));$('optimizationReview').replaceChildren();$('copyStatus').textContent='';$('reviewStatus').textContent='';$('parseStatus').textContent='';}
async function copy(){const txt=$('outputText').value;if(!txt.trim()){$('copyStatus').textContent='No hay medicamentos para copiar.';return;}try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(txt);else{$('outputText').focus();$('outputText').select();if(!document.execCommand('copy'))throw Error('no disponible');}$('copyStatus').textContent='Texto copiado. Los productos sanitarios y los espesantes no se incluyen.';}catch(e){$('outputText').focus();$('outputText').select();$('copyStatus').textContent='Selecciona el texto y pulsa Ctrl+C.';}}
$('parseButton').addEventListener('click',parse);
$('clearButton').addEventListener('click',()=>{$('rawInput').value='';reset();});
$('sortSelect').addEventListener('change',chooseSort);
$('resetOrder').addEventListener('click',chooseSort);
$('copyMode').addEventListener('change',()=>{ $('foodNotesControl').hidden=$('copyMode').value!=='patient';renderOrder();});
$('includeFoodNotes').addEventListener('change',renderOrder);
$('clearSchedules').addEventListener('click',clearSchedules);
$('includeSupplements').addEventListener('change',()=>{renderOrder();$('supplementOptions').hidden=!$('includeSupplements').checked;});
$('supplementTiming').addEventListener('change',renderOrder);
$('copyButton').addEventListener('click',copy);
$('regenerateText').addEventListener('click',()=>{renderOrder(true);$('copyStatus').textContent='Texto regenerado desde el tratamiento revisado.';});
$('outputText').addEventListener('input',()=>{$('manualEditWarning').hidden=$('outputText').value===generatedOutput;});
})();
