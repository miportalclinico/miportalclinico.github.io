
'use strict';
const $=x=>document.getElementById(x), L=window.LabEditor, KEYS={omitPending:'optOmitPending',normal:'optNormal',units:'optUnits',rnl:'optRnl',nonhdl:'optNonhdl',hemogramShort:'optHemogramShort',includeStandard:'optIncludeStandard',inferUnits:'optInferUnits',cmi:'optCmi',differentialPct:'optDifferentialPct',fena:'optFena',feurea:'optFeurea',ureaRatio:'optUreaRatio',crRatio:'optCrRatio',rfi:'optRfi',anionGap:'optAnionGap',deltaRatio:'optDeltaRatio',tibc:'optTibc',sodiumCorr:'optSodiumCorr'};
let parsed=null,selected={},generated='',manual=false,confirmRegen=false;
function readOpts(){const o={profile:$('profile').value,gasType:$('gasType').value,gasFormat:$('gasFormat').value,microDetail:$('microFormat').value==='antibiotico',retic:false,showRpi:$('showRpi').checked,lipTotal:$('showLipTotal').checked,lipTg:$('showLipTg').checked,lipLdl:$('showLipLdl').checked};for(const [k,id] of Object.entries(KEYS))o[k]=$(id).checked;return o;}
function writeOpts(o){if(o.profile==='resumen'){o={...o,profile:'completo',normal:true};}$('profile').value=['completo','alterados'].includes(o.profile)?o.profile:'completo';$('gasFormat').value=['completo','etiquetado','barras'].includes(o.gasFormat)?o.gasFormat:'barras';$('microFormat').value=o.microDetail?'antibiotico':'agrupado';$('showRpi').checked=!!o.showRpi;for(const [id,key] of [['showLipTotal','lipTotal'],['showLipTg','lipTg'],['showLipLdl','lipLdl']])$(id).checked=!!(o[key]??o.showLipids);updateToolVisibility();for(const [k,id] of Object.entries(KEYS))$(id).checked=o[k]??L.defaults[k];if(o.gasType)$('gasType').value=o.gasType;}
function formatOpts(){const o=readOpts();for(const k of ['rnl','nonhdl','fena','feurea','ureaRatio','crRatio','rfi','anionGap','deltaRatio','tibc'])o[k]=false;return o;}
const activeResults=new Map(), addedResults=new Map(), suppressedIndices=new Set();
function fmtLine(record){return record?.short||'';}
function replaceLineIn(text,oldLine,newLine){
 let lines=text?text.split('\n'):[];
 if(oldLine){const pos=lines.findIndex(x=>x.trim()===oldLine);if(pos>=0)lines.splice(pos,1);}
 if(newLine&&!lines.includes(newLine))lines.push(newLine);
 return lines.join('\n').trimEnd();
}
function applyLineReplacement(oldLine,newLine){
 const oldEditor=$('outputText').value;
 $('outputText').value=replaceLineIn(oldEditor,oldLine,newLine);
 generated=replaceLineIn(generated,oldLine,newLine);
 manual=$('outputText').value!==generated;
 $('restoreBtn').hidden=!manual;
}
function resultToggle(id){
 const record=activeResults.get(id);
 if(record?.kind==='index'){
  if(manual&&!window.confirm('El informe contiene cambios manuales. ¿Regenerarlo para actualizar este índice?'))return;
  if(suppressedIndices.has(id))suppressedIndices.delete(id);else suppressedIndices.add(id);
  regenerate(true);outputStatus(suppressedIndices.has(id)?'Índice retirado del informe.':'Índice incluido en su apartado del informe.');
  return;
 }
 if(addedResults.has(id)){const previous=addedResults.get(id);addedResults.delete(id);applyLineReplacement(previous,null);outputStatus('Resultado retirado del informe.');}
 else if(record){const line=fmtLine(record);addedResults.set(id,line);applyLineReplacement(null,line);outputStatus('Resultado añadido al informe, sin interpretación.');}
 renderAllActionButtons();
}
async function copyShortResult(id){
 const r=activeResults.get(id);if(!r)return;
 try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(fmtLine(r));}
 else{const f=document.createElement('textarea');f.value=fmtLine(r);f.style.position='fixed';f.style.opacity='0';document.body.append(f);f.select();if(!document.execCommand('copy'))throw Error('copy');f.remove();}
 outputStatus('Resultado copiado.');}catch(e){outputStatus('No se pudo copiar automáticamente. Selecciona el resultado mostrado.');}
}
function resultActionRow(id,container){
 const r=activeResults.get(id);if(!r||!container)return;
 const row=document.createElement('div');row.className='actionLine';row.dataset.resultId=id;
 const label=document.createElement('span');label.className='actionLabel';label.textContent=fmtLine(r);
 const controls=document.createElement('div');controls.className='resultActions';
 const indexAuto=r.kind==='index';const included=indexAuto?!suppressedIndices.has(id):addedResults.has(id);
 const add=document.createElement('button');add.type='button';add.className='btn'+(included?' active':'');add.textContent=included?'Quitar del informe':'Añadir al informe';add.onclick=()=>resultToggle(id);
 const copy=document.createElement('button');copy.type='button';copy.className='btn light';copy.textContent='Copiar resultado';copy.onclick=()=>copyShortResult(id);
 controls.append(add,copy);row.append(label,controls);container.append(row);
}
function renderAllActionButtons(){
 for(const [id,containerId] of [['bic','bicActions'],['katz','naActions'],['hillier','naActions'],['water','waterActions']]){
  // shared container (Na two results) is cleared only once below
 }
 for(const id of ['bicActions','naActions','waterActions','fibActions'])$(id).replaceChildren();
 resultActionRow('bic',$('bicActions'));resultActionRow('katz',$('naActions'));resultActionRow('hillier',$('naActions'));resultActionRow('water',$('waterActions'));resultActionRow('fib4',$('fibActions'));
 const indices=$('indicesList');if(indices){for(const node of indices.querySelectorAll('[data-actions-for]')){node.replaceChildren();resultActionRow(node.dataset.actionsFor,node);}}
}
function updateAddedResults(){
 for(const [id,old] of [...addedResults]){
  const next=activeResults.get(id)?.short||null;
  if(!next){addedResults.delete(id);applyLineReplacement(old,null);}
  else if(next!==old){addedResults.set(id,next);applyLineReplacement(old,next);}
 }
}
function settingStatus(msg){$('prefsStatus').textContent=msg;}
function outputStatus(msg){$('outputStatus').textContent=msg;}
function savePrefs(){const c=readOpts();delete c.gasType;try{localStorage.setItem('editor_analiticas_prefs_v27',JSON.stringify(c));settingStatus('Preferencias guardadas en este navegador.')}catch(e){settingStatus('No se ha podido guardar en el navegador; puedes exportar el archivo.')}}
function loadPrefs(){try{const data=JSON.parse(localStorage.getItem('editor_analiticas_prefs_v27')||localStorage.getItem('editor_analiticas_prefs_v26')||localStorage.getItem('editor_analiticas_prefs_v25')||localStorage.getItem('editor_analiticas_prefs_v24')||'null');if(data&&typeof data==='object')writeOpts({...L.defaults,...data})}catch(e){}}
function downloadFile(name,body){const blob=new Blob([body],{type:'application/json;charset=utf-8'});const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function visibleSections(){
 if(!parsed)return[];
 const found=new Set(parsed.items.map(e=>['orina','orina_bioq','orina_sistema','indices_renales'].includes(e.section)?'orina':e.section));
 if(parsed.cultures.length)found.add('cultivos');
 if(parsed.texts.frotis)found.add('frotis');
 if(parsed.texts.proteinograma)found.add('proteinograma');
 return L.ORDER.filter(k=>found.has(k));
}
function buildSections(){const el=$('sectionChecks');el.replaceChildren();const keys=visibleSections();if(!keys.length){el.innerHTML='<span class="empty">No se han reconocido apartados.</span>';return;}
 for(const k of keys){selected[k]=selected[k]!==false;const label=document.createElement('label');label.className='secCheck';const inp=document.createElement('input');inp.type='checkbox';inp.checked=selected[k];inp.dataset.section=k;inp.addEventListener('change',()=>{selected[k]=inp.checked;markStale()});label.append(inp,document.createTextNode(L.TITLES[k]));el.append(label)}
 $('allSections').checked=keys.every(k=>selected[k]);}
function reviewList(id,rows,msg){const ul=$(id);ul.replaceChildren();if(!rows.length){const li=document.createElement('li');li.textContent=msg;ul.append(li);return;}
 for(const x of rows){const li=document.createElement('li');li.textContent=(x.line||'')+(x.reason?' — '+x.reason:'');ul.append(li);}}
function fmtNum(n,dec=2){return Number(n.toFixed(dec)).toLocaleString('es-ES',{maximumFractionDigits:dec});}
function tryNum(value){const s=String(value||'').trim();if(!/^[+-]?\d+(?:[.,]\d+)?$/.test(s))return null;const n=Number(s.replace(',','.'));return Number.isFinite(n)?n:null;}
function cells(v){if(!Number.isFinite(v.num))return null;const u=L.clean(v.unit||'').replace(/\s/g,'');if(/(?:10\^?3|10³|x10\^?3|10e3|10\^?9|10⁹)/.test(u))return v.num*1000;if(/\/(?:ul|mm3|mm³)/.test(u))return v.num;return null;}
function clinicalSignal(e){
 const n=e.num,u=L.clean(e.unit||'').replace(/\s/g,'');
 if(!Number.isFinite(n))return {severity:'none',why:''};
 const mmol=['mmol/l','meq/l'].includes(u),mgdl=u==='mg/dl';
 let x=null,min=null,max=null,rule='';
 if(e.key==='potasio'&&mmol){x=n;min=2.5;max=6.0;rule='K <2,5 o >6,0 mmol/L';}
 if(e.key==='sodio'&&mmol){x=n;min=120;max=160;rule='Na <120 o >160 mmol/L';}
 if(e.key==='glucosa'&&(mgdl||u==='mmol/l')){x=mgdl?n:n*18.018;min=50;max=500;rule='Glucosa <50 o >500 mg/dL';}
 if(e.key==='hb'&&(u==='g/dl'||u==='g/l')){x=u==='g/l'?n/10:n;min=7;max=21;rule='Hb <7 o >21 g/dL';}
 if(e.key==='plaquetas'){x=cells(e);min=20e3;max=1e6;rule='Plaquetas ≤20.000 o ≥1.000.000 /mm³';}
 if(e.key==='neutro'){x=cells(e);min=500;rule='Neutrófilos <500/mm³';}
 if(e.key==='inr'&&(!u||u==='')){x=n;max=5;rule='INR ≥5 (interpretar según anticoagulación)';}
 if(e.key==='lactato'&&(mmol)){x=n;max=4;rule='Lactato ≥4 mmol/L';}
 const lowCritical=x!==null&&min!==null&&(e.key==='plaquetas'?x<=min:x<min);
 const highCritical=x!==null&&max!==null&&(e.key==='inr'||e.key==='lactato'||e.key==='plaquetas'?x>=max:x>max);
 if(e.critical||lowCritical||highCritical)return {severity:'critical',why:e.critical?'El laboratorio marca el valor como crítico.':'Umbral orientativo de aviso: '+rule};
 if(e.range&&(n<e.range.low||n>e.range.high))return{severity:'warning',why:'Fuera del intervalo informado por el laboratorio ('+e.range.low+'–'+e.range.high+').'};
 if(e.abnormal==='high'||e.abnormal==='low')return{severity:'warning',why:'Marcado como alterado en la analítica.'};
 const orient={potasio:[3.5,5.1],sodio:[135,145],hb:[11,17.5],plaquetas:[150000,450000],creatinina:[0.5,1.5],glucosa:[70,180]};
 if(!e.range&&orient[e.key]&&Number.isFinite(x===null?n:x)){const y=x===null?n:x;const r=orient[e.key];if(y<r[0]||y>r[1])return{severity:'warning',why:'Fuera de límites orientativos generales; confirmar con el laboratorio.'};}
 return{severity:'none',why:''};
}
function doubtfulItems(res){
 const list=[...(res.pending||[])], seen=new Map();
 for(const [idx,e] of parsed.items.entries()){
  const code=e.section+':'+e.key;
  if(seen.has(code)&&!/^other_/.test(e.key))list.push({line:e.name,reason:'Dos valores para la misma determinación; verificar muestra y fecha (filas '+(seen.get(code)+1)+' y '+(idx+1)+').'});
  else seen.set(code,idx);
  if(e.unit&&/[<>{}\[\]]/.test(e.unit))list.push({line:e.line,reason:'Unidad o texto de unidad de lectura dudosa.'});
  if(e.unit&&e.unit.length>28)list.push({line:e.line,reason:'Unidad inusualmente larga: comprobar transcripción.'});
  const u=L.clean(e.unit||'').replace(/\s/g,'');
  if(['sodio','potasio','cloro'].includes(e.key)&&u&&!['mmol/l','meq/l'].includes(u))list.push({line:e.line,reason:'Unidad no habitual para este electrolito; comprobar en el original.'});
  if(e.key==='hb'&&u&&!['g/dl','g/l'].includes(u))list.push({line:e.line,reason:'Unidad de hemoglobina poco habitual; comprobar antes de interpretar.'});
 }
 return list;
}
function correctionEditor(index,row){
 const e=parsed.items[index];if(!e)return;
 const valCell=row.cells[1],last=row.cells[3];last.replaceChildren();
 const pane=document.createElement('div');pane.className='editPanel';
 const input=document.createElement('input');input.type='text';input.value=e.raw;input.setAttribute('aria-label','Valor corregido de '+e.name);
 const unit=document.createElement('input');unit.type='text';unit.value=e.unit||'';unit.setAttribute('aria-label','Unidad corregida');
 const save=document.createElement('button');save.type='button';save.className='editValue';save.textContent='Guardar';
 const cancel=document.createElement('button');cancel.type='button';cancel.className='editValue';cancel.textContent='Cancelar';
 pane.append(input,unit,save,cancel);last.append(pane);
 cancel.addEventListener('click',()=>regenerateReviewOnly());
 save.addEventListener('click',()=>{
  const num=tryNum(input.value);if(num===null){outputStatus('Introduce un valor numérico válido para corregir la determinación.');return;}
  const cleanUnit=unit.value.trim();if(cleanUnit.length>44||/[<>\n\r]/.test(cleanUnit)){outputStatus('La unidad no tiene un formato válido.');return;}
  e.raw=input.value.trim();e.num=num;e.unit=cleanUnit;e.unitInferred=false;e.rangeInferred=false;
  e.abnormal=e.range?(num<e.range.low?'low':num>e.range.high?'high':'normal'):null;e.critical=false;
  // El texto original se conserva. Sólo se modifica el registro procesado.
  if(manual){outputStatus('Valor corregido; pulsa Regenerar para actualizar el informe (se confirmará la sustitución del texto editado).');regenerateReviewOnly();}
  else{regenerate(true);}
  autoFillCalculators();
 });input.focus();
}
function regenerateReviewOnly(){if(!parsed)return;const res=L.format(parsed,formatOpts(),selected,automaticExtras());updateReview(res);}
function updateReview(res){
 $('countRecognized').textContent=(parsed.items.length+parsed.cultures.length)+' reconocidos';
 $('countOmitted').textContent=res.ignored.length+' omitidos';$('countPending').textContent=res.pending.length+' pendientes';
 const tbody=$('recognizedList');tbody.replaceChildren();let warnings=0,critical=0;const issues=[];
 for(const [i,e] of (res.processedItems||parsed.items).entries()){
  const sig=clinicalSignal(e);if(sig.severity==='critical')critical++;if(sig.severity==='warning')warnings++;if(sig.severity!=='none')issues.push({type:sig.severity,label:e.name+': '+e.raw+(e.unit?' '+e.unit:''),why:sig.why,index:i});
  const row=document.createElement('tr');if(sig.severity!=='none')row.className=sig.severity+'Row';
  const name=document.createElement('td');name.textContent=e.name;
  const val=document.createElement('td');val.textContent=e.raw+(e.unit?' '+e.unit:'')+(e.unitInferred?' [unidad inferida]':'');
  if(sig.severity!=='none'){val.classList.add('flag');const tag=document.createElement('button');tag.type='button';tag.className='levelTag '+sig.severity;tag.textContent=sig.severity==='critical'?'Crítico · ver umbral':'Alterado · ver rango';tag.title=sig.why;tag.setAttribute('aria-expanded','false');tag.addEventListener('click',()=>{let d=val.querySelector('.alertExplain');if(d){d.remove();tag.setAttribute('aria-expanded','false');return;}d=document.createElement('div');d.className='alertExplain';d.textContent=sig.why+' Umbral orientativo; contrasta el resultado y el intervalo del laboratorio.';val.append(d);tag.setAttribute('aria-expanded','true');});val.append(document.createElement('br'),tag);}
  const sec=document.createElement('td');sec.textContent=L.TITLES[e.section]||e.section;
  const action=document.createElement('td');const edit=document.createElement('button');edit.type='button';edit.className='editValue';edit.textContent='✎';edit.title='Corregir valor reconocido';edit.setAttribute('aria-label','Corregir '+e.name);edit.addEventListener('click',()=>correctionEditor(i,row));action.append(edit);
  row.append(name,val,sec,action);tbody.append(row);
 }
 for(const c of parsed.cultures){const row=document.createElement('tr');for(const s of [c.name,c.status||c.organism||'—','Cultivos','—']){const cell=document.createElement('td');cell.textContent=s;row.append(cell);}tbody.append(row);}
 const doubts=doubtfulItems(res);reviewList('doubtfulList',doubts,'No se han detectado datos dudosos.');
 $('doubtfulBadge').textContent=doubts.length?'('+doubts.length+')':'';$('doubtfulDetails').hidden=!doubts.length;$('recognizedBadge').textContent='('+parsed.items.length+')';
 $('countWarning').textContent=warnings+' alterados';$('countCritical').textContent=critical+' críticos';$('countDoubtful').textContent=doubts.length+' dudosos';
 reviewList('omittedList',res.ignored,'No hay valores omitidos por reglas fijas.');
 reviewList('inferredList',res.inferred||[],'Sin valores completados automáticamente.');
 reviewList('pendingList',res.pending,'Sin datos pendientes de revisión.');
 const list=$('issuesPreview');list.replaceChildren();
 for(const issue of issues.slice(0,4)){
  const e=document.createElement('div');e.className='issueItem '+issue.type;
  const span=document.createElement('span');span.textContent=issue.label;
  const btn=document.createElement('button');btn.type='button';btn.textContent=issue.type==='critical'?'Crítico · revisar':'Alterado · revisar';btn.title=issue.why;
  btn.onclick=()=>{$('otherChecksDetails').open=true;$('allResultsDetails').open=true;tbody.children[issue.index]?.scrollIntoView({behavior:'smooth',block:'center'});};e.append(span,btn);list.append(e);
 }
 const other=issues.length-4;
 if(other>0){const e=document.createElement('span');e.className='mini';e.textContent='+'+other+' alteraciones adicionales. Consulta «Otras comprobaciones».';list.append(e);}
 // Los datos dudosos se consultan en «Otras comprobaciones».

 if(!issues.length){list.innerHTML='<span class="empty">Sin alertas detectadas. Comprueba siempre el informe original.</span>';}
 renderIndices();
}
function markStale(){if(parsed)outputStatus(manual?'Has editado el texto. Las opciones han cambiado; pulsa Regenerar si deseas sustituirlo.':'Opciones modificadas. Pulsa Regenerar para aplicarlas.');}
function regenerate(force=false){if(!parsed){outputStatus('Procesa una analítica primero.');return;}
 if(manual&&!force&&!confirmRegen){confirmRegen=true;outputStatus('Tienes cambios manuales. Vuelve a pulsar Regenerar para sustituirlos, o usa «Deshacer cambios manuales».');return;}
 confirmRegen=false;const opts=readOpts();const res=L.format(parsed,formatOpts(),selected,automaticExtras());updateReview(res);$('parseAlert').hidden=!res.blocked;$('parseAlert').textContent=res.blocked||'';
 if(res.blocked){outputStatus('Generación detenida: revisa el aviso.');return;}
 const reportExtras=[...addedResults.values()].filter(Boolean);generated=[res.output,...reportExtras].filter(Boolean).join('\n');$('outputText').value=generated;manual=false;$('restoreBtn').hidden=true;outputStatus(res.pending.length?'Resultado generado. Revisa los '+res.pending.length+' elementos pendientes.':'Resultado generado. Puedes editarlo y copiarlo.');}
function process(){const raw=$('rawInput').value;if(!raw.trim()){$('inputStatus').textContent='Pega una analítica anonimizada o selecciona un archivo de prueba.';return;}
 parsed=L.parse(raw);if(parsed.personal){$('outputText').value='';$('parseAlert').hidden=false;$('parseAlert').textContent='Posibles datos identificativos: se ha detenido la revisión y no se ha generado ningún informe. Retira esos datos del texto original.';$('inputStatus').textContent='Documento no procesado por protección de datos.';parsed=null;return;}selected={};addedResults.clear();activeResults.clear();suppressedIndices.clear();resetPatientContext();autoFillCalculators();$('gasField').classList.toggle('hidden',!parsed.seenGas);$('gasType').value=parsed.gas.sourceType||'';buildSections();manual=false;confirmRegen=false;generated='';$('restoreBtn').hidden=true;$('outputText').value='';$('inputStatus').textContent='Análisis completado localmente: '+(parsed.items.length+parsed.cultures.length)+' valores o cultivos identificados.';regenerate(true);showTab('review');}
$('processBtn').addEventListener('click',process);
$('clearBtn').addEventListener('click',()=>{$('rawInput').value='';$('outputText').value='';$('documentFile').value='';$('retirePdfBtn').hidden=true;$('fileStatus').textContent='PDF.js local · texto seleccionable · sin OCR.';$('inputStatus').textContent='';$('outputStatus').textContent='';$('parseAlert').hidden=true;$('gasField').classList.add('hidden');parsed=null;selected={};addedResults.clear();activeResults.clear();suppressedIndices.clear();generated='';manual=false;confirmRegen=false;$('restoreBtn').hidden=true;clearContext();$('issuesPreview').innerHTML='<span class="empty">Procesa una analítica para revisar sus resultados.</span>';$('indicesList').replaceChildren();$('indicesBadge').textContent='';$('doubtfulList').innerHTML='<li>Sin analítica procesada.</li>';$('countWarning').textContent='0 alterados';$('countCritical').textContent='0 críticos';$('countDoubtful').textContent='0 dudosos';$('sectionChecks').innerHTML='<span class="empty">Primero procesa una analítica para ver sus apartados.</span>';$('recognizedList').replaceChildren();reviewList('omittedList',[],'Sin resultados procesados.');reviewList('inferredList',[],'Sin resultados procesados.');reviewList('pendingList',[],'Sin resultados procesados.');$('countRecognized').textContent='0 reconocidos';$('countOmitted').textContent='0 omitidos';$('countPending').textContent='0 pendientes';});
$('outputText').addEventListener('input',()=>{manual=$('outputText').value!==generated;$('restoreBtn').hidden=!manual;confirmRegen=false;outputStatus(manual?'Texto modificado manualmente; tus cambios se conservarán hasta regenerar.':'Texto generado sin modificaciones.');});
$('regenBtn').addEventListener('click',()=>regenerate());
$('tabReview').addEventListener('click',()=>showTab('review'));$('tabIndices').addEventListener('click',()=>showTab('indices'));$('tabCalculators').addEventListener('click',()=>showTab('calculators'));
for(const [i,id] of ['tabReview','tabIndices','tabCalculators'].entries())$(id).addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const keys=['review','indices','calculators'];let next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowLeft'?-1:1)+3)%3;showTab(keys[next]);$(['tabReview','tabIndices','tabCalculators'][next]).focus();});
$('restoreBtn').addEventListener('click',()=>{$('outputText').value=generated;manual=false;$('restoreBtn').hidden=true;confirmRegen=false;outputStatus('Restaurado el último resultado generado, sin modificar la analítica original.');});
$('copyBtn').addEventListener('click',async()=>{const txt=$('outputText').value;if(!txt){outputStatus('No hay texto que copiar.');return;}try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(txt);else{$('outputText').focus();$('outputText').select();if(!document.execCommand('copy'))throw Error('No disponible')}outputStatus('Texto copiado.')}catch(e){outputStatus('No se ha podido copiar automáticamente. Selecciona el texto y utiliza Ctrl+C.');}});
$('profile').addEventListener('change',()=>{if($('profile').value==='alterados'&&$('optNormal').checked){$('prefsStatus').textContent='El perfil de resultados alterados muestra las determinaciones fuera de rango y resume las restantes como «resto normal» cuando procede.';}markStale();});$('gasFormat').addEventListener('change',markStale);$('microFormat').addEventListener('change',markStale);$('gasType').addEventListener('change',markStale);for(const id of Object.values(KEYS))$(id).addEventListener('change',()=>{if(parsed){buildSections();if(!manual)regenerate(true);else{renderIndices();markStale();}}});
$('allSections').addEventListener('change',e=>{for(const k of visibleSections())selected[k]=e.target.checked;buildSections();markStale();});
$('savePrefs').addEventListener('click',savePrefs);
const preferenceGroups=[...document.querySelectorAll('.prefsAccordions > details.prefGroup')];
function refreshPrefsToggle(){const allOpen=preferenceGroups.every(el=>el.open);$('togglePrefs').textContent=allOpen?'Replegar todo':'Desplegar todo';$('togglePrefs').setAttribute('aria-expanded',String(allOpen));}
$('togglePrefs').addEventListener('click',()=>{const shouldOpen=!preferenceGroups.every(el=>el.open);preferenceGroups.forEach(el=>{el.open=shouldOpen});refreshPrefsToggle();});
preferenceGroups.forEach(el=>el.addEventListener('toggle',refreshPrefsToggle));refreshPrefsToggle();
$('resetPrefs').addEventListener('click',()=>{writeOpts(L.defaults);settingStatus('Opciones restablecidas. Guarda si quieres mantenerlas.');markStale();});
$('exportPrefs').addEventListener('click',()=>{const obj=readOpts();delete obj.gasType;downloadFile('preferencias_editor_analiticas.json',JSON.stringify({version:1,editor:'Editor de analíticas',preferences:obj},null,2));settingStatus('Archivo de configuración preparado.');});
$('importPrefs').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>25000)throw Error('Archivo demasiado grande');const j=JSON.parse(await f.text());if(j.editor!=='Editor de analíticas'||!j.preferences||j.version!==1)throw Error('Configuración no reconocida');writeOpts({...L.defaults,...j.preferences});settingStatus('Preferencias importadas. Pulsa Guardar preferencias para conservarlas.');markStale();}catch(err){settingStatus('No se pudo importar: '+err.message)}finally{e.target.value='';}});
async function importLocalFile(file){if(!file)return;const el=$('fileStatus');el.textContent='Extrayendo el texto en el dispositivo…';
 try{const result=await window.LabFileReader.read(file);$('rawInput').value=result.text;$('retirePdfBtn').hidden=result.type!=='pdf';
  el.textContent=result.type==='pdf'?'PDF.js: '+result.pages+' páginas leídas localmente. Comprueba el texto extraído y el informe.':'Texto cargado localmente.';
  process();if(result.type==='pdf')$('inputStatus').textContent+=' PDF.js local: coteja los valores con el informe original.';
 }catch(err){el.textContent='No se pudo extraer: '+err.message;}
 finally{$('documentFile').value='';}
}
$('retirePdfBtn').addEventListener('click',()=>{$('rawInput').value='';$('retirePdfBtn').hidden=true;$('fileStatus').textContent='Texto fuente retirado de la pantalla. El informe generado permanece disponible; usa Borrar todo para eliminarlo.';$('inputStatus').textContent='Se ha retirado el texto original. El resultado puede editarse y copiarse.';});
$('documentFile').addEventListener('change',e=>importLocalFile(e.target.files?.[0]));
const zone=$('dropZone');
for(const type of ['dragenter','dragover'])zone.addEventListener(type,e=>{e.preventDefault();e.stopPropagation();zone.classList.add('dragOver');});
for(const type of ['dragleave','drop'])zone.addEventListener(type,e=>{e.preventDefault();e.stopPropagation();zone.classList.remove('dragOver');});
zone.addEventListener('drop',e=>importLocalFile(e.dataTransfer?.files?.[0]));
// Avoid accidentally opening a dropped document over this editor.
window.addEventListener('dragover',e=>e.preventDefault());
window.addEventListener('drop',e=>e.preventDefault());
loadPrefs();
for(const id of ['showRpi','showLipTotal','showLipTg','showLipLdl'])$(id).addEventListener('change',()=>{updateToolVisibility();if(parsed&&!manual)regenerate(true);else{renderIndices();markStale();}});
for(const el of document.querySelectorAll('.toolBody input,.toolBody select')){el.addEventListener(el.tagName==='SELECT'?'change':'input',renderCalculators);}
for(const id of ['rpiRetic','rpiHct','lipTotal','lipHdl','lipLdl','lipTg'])$(id).addEventListener('change',()=>{if(parsed&&!manual)regenerate(true);else markStale();});
updateToolVisibility();
showTab('review');

// Calculadoras contextuales: la entrada se procesa en memoria y NUNCA entra en el informe.
function setInput(id,val){$(id).value=val===null||val===undefined?'':String(val);}
function nlrValues(){
 if(!parsed)return null;
 const all=parsed.items.filter(e=>e.section==='hemograma'&&['neutro','linfo'].includes(e.key)&&Number.isFinite(e.num));
 const abs=(k)=>all.map(e=>e.key===k?cells(e):null).find(v=>v!==null&&v>0);
 const na=abs('neutro'),la=abs('linfo');
 if(na!==undefined&&la!==undefined&&la>0)return na/la;
 const pct=(k)=>all.find(e=>e.key===k&&((e.unit||'').trim()==='%'||/(?:porcentaje|\%)/i.test(e.line||''))&&e.num>=0&&e.num<=100)?.num;
 const np=pct('neutro'),lp=pct('linfo');
 return np!==undefined&&lp!==undefined&&lp>0?np/lp:null;
}
function nlrClassification(value){
 if(value<1)return {name:'Por debajo de 1: sin clasificación',color:'#94a3b8'};
 if(value<=3)return {name:'Normal',color:'#27966f'};
 if(value<6)return {name:'Indeterminado (normal-leve)',color:'#64748b'};
 if(value<9)return {name:'Estrés leve',color:'#d9ac35'};
 if(value<=18)return {name:'Estrés moderado',color:'#e38b42'};
 return {name:'Estrés intenso/grave',color:'#cc4c4c'};
}
function firstKey(section,key){return parsed?.items.find(e=>e.section===section&&e.key===key&&Number.isFinite(e.num))||null;}
function numUnit(e,kind){if(!e)return null;let n=e.num,u=L.clean(e.unit||'').replace(/\s/g,'');
 if(!Number.isFinite(n))return null;
 if(kind==='glucose'){if(u==='mg/dl')return n;if(u==='mmol/l')return n*18.018;}
 if(kind==='lipid'){if(u==='mg/dl')return n;if(u==='mmol/l')return n*38.67;}
 if(kind==='tg'){if(u==='mg/dl')return n;if(u==='mmol/l')return n*88.57;}
 if(kind==='sodium'||kind==='hco3'){if(u==='mmol/l'||u==='meq/l')return n;}
 if(kind==='percent'){if(u==='%')return n;}
 return null;
}
function resetPatientContext(){
 for(const id of ['patientAge','patientWeight','fibAge','fibAst','fibAlt','fibPlatelets','bicWeight','waterWeight'])setInput(id,'');
 $('patientSex').value='';$('waterSex').value='';$('waterAge').value='adult';
}
function synchronizePatientInputs(){
 const weight=getInput('patientWeight');
 setInput('bicWeight',weight);setInput('waterWeight',weight);
 const sex=$('patientSex').value;if(sex)$('waterSex').value=sex;
 const age=getInput('patientAge');
 if(age!==null&&Number.isInteger(age)&&age>=1&&age<=120)$('waterAge').value=age<18?'child':age>=65?'elderly':'adult';
 if(age!==null&&(getInput('fibAge')===null||$('fibAge').dataset.fromPatient==='yes')){$('fibAge').value=String(age);$('fibAge').dataset.fromPatient='yes';}
 renderCalculators();
}
$('fibAge').addEventListener('input',()=>{$('fibAge').dataset.fromPatient='no';renderCalculators();});
for(const id of ['patientAge','patientWeight','patientSex'])$(id).addEventListener(id==='patientSex'?'change':'input',synchronizePatientInputs);
function autoFillCalculators(){
 if(!parsed){clearContext();return;}
 const gas=firstKey('gasometria','hco3');const na=firstKey('bioquimica','sodio'),glu=firstKey('bioquimica','glucosa');
 setInput('bicActual',numUnit(gas,'hco3'));setInput('naActual',numUnit(na,'sodium'));setInput('naGlucose',numUnit(glu,'glucose'));
 setInput('waterNa',numUnit(na,'sodium'));
 setInput('rpiRetic',numUnit(firstKey('hemograma','retic'),'percent'));
 setInput('rpiHct',numUnit(firstKey('hemograma','hematocrito'),'percent'));
 for(const [id,key,kind] of [['lipTotal','col_total','lipid'],['lipHdl','col_hdl','lipid'],['lipLdl','col_ldl','lipid'],['lipTg','tg','tg']])setInput(id,numUnit(firstKey('lipidico',key),kind));
 for(const [id,key] of [['fibAst','ast'],['fibAlt','alt']]){
  const e=firstKey('bioquimica',key)||parsed.items.find(z=>z.section==='bioquimica'&&Number.isFinite(z.num)&&new RegExp(key==='ast'?'^(?:got|ast)(?:\\b|\\s|\\/)':'^(?:gpt|alt)(?:\\b|\\s|\\/)','i').test(L.clean(z.short||z.name||'')));const u=L.clean(e?.unit||'').replace(/\s/g,'');
  setInput(id,e&&Number.isFinite(e.num)&&u==='u/l'?e.num:null);
 }
 const platelets=parsed.items.find(e=>e.section==='hemograma'&&e.key==='plaquetas'&&cells(e)!==null);
 setInput('fibPlatelets',platelets?cells(platelets)/1000:null);
 renderCalculators();
}
function clearContext(){for(const id of ['patientAge','patientWeight','fibAge','fibAst','fibAlt','fibPlatelets','bicActual','bicWeight','naActual','naGlucose','waterNa','waterWeight','rpiRetic','rpiHct','lipTotal','lipHdl','lipLdl','lipTg'])setInput(id,'');$('patientSex').value='';$('waterSex').value='';$('waterAge').value='adult';renderCalculators();}
function getInput(id){return tryNum($(id).value);}
function renderCalculators(){
 for(const id of ['bic','katz','hillier','water','fib4'])activeResults.delete(id);
 const a=getInput('bicActual'),w=getInput('bicWeight'),t=getInput('bicTarget');
 if(a!==null&&w!==null&&t!==null&&w>0&&a>=0&&t>=0){const val=Math.max(0,0.5*w*(t-a));
  activeResults.set('bic',{short:'Déficit de bicarbonato: '+fmtNum(val,1)+' mEq'});
  $('bicResult').textContent=fmtNum(val,1)+' mEq';}
 else $('bicResult').textContent='Introduce bicarbonato, peso y objetivo.';
 const na=getInput('naActual'),g=getInput('naGlucose');
 if(na!==null&&g!==null&&na>0&&g>=0){const delta=Math.max(0,(g-100)/100),k=na+1.6*delta,h=na+2.4*delta;
  activeResults.set('katz',{short:'Na corregido (Katz): '+fmtNum(k,1)+' mmol/L'});
  activeResults.set('hillier',{short:'Na corregido (Hillier): '+fmtNum(h,1)+' mmol/L'});
  $('naResult').textContent='Katz: '+fmtNum(k,1)+' mmol/L · Hillier: '+fmtNum(h,1)+' mmol/L';}
 else $('naResult').textContent='Introduce sodio y glucemia.';
 const wn=getInput('waterNa'),ww=getInput('waterWeight'),wt=getInput('waterTarget');
 const age=$('waterAge').value,sex=$('waterSex').value;
 const wf=!['male','female'].includes(sex)?null:age==='child'?0.6:age==='elderly'?(sex==='male'?0.5:0.45):(sex==='male'?0.6:0.5);
 if(wn!==null&&ww!==null&&wt!==null&&ww>0&&wn>0&&wt>0&&Number.isFinite(wf)){
  const val=Math.max(0,ww*wf*(wn/wt-1));
  activeResults.set('water',{short:'Déficit de agua libre: '+fmtNum(val,2)+' L'});
  $('waterResult').textContent=fmtNum(val,2)+' L';}
 else $('waterResult').textContent='Introduce sodio, peso y objetivo.';
 const fibAge=getInput('fibAge')??getInput('patientAge'),ast=getInput('fibAst'),alt=getInput('fibAlt'),platelets=getInput('fibPlatelets');
 if(fibAge!==null&&Number.isInteger(fibAge)&&fibAge>=18&&fibAge<=120&&ast!==null&&ast>0&&alt!==null&&alt>0&&platelets!==null&&platelets>0&&ast<=10000&&alt<=10000&&platelets<=2000){
  const value=fibAge*ast/(platelets*Math.sqrt(alt));
  const score=fmtNum(value,2);
  activeResults.set('fib4',{short:'FIB-4: '+score});$('fibResult').textContent=score;
  if(fibAge<35)$('fibInterpretation').textContent='Precisión limitada antes de los 35 años.';
  else if(value<(fibAge>=65?2:1.3))$('fibInterpretation').textContent='Riesgo bajo de fibrosis avanzada, según edad y contexto.';
  else if(value<=2.67)$('fibInterpretation').textContent='Zona intermedia; considerar valoración adicional.';
  else $('fibInterpretation').textContent='Riesgo elevado; interpretar según contexto y pruebas complementarias.';
 }else{$('fibResult').textContent='Introduce edad, AST/GOT, ALT/GPT y plaquetas.';$('fibInterpretation').textContent='';}
 renderIndices();updateAddedResults();renderAllActionButtons();
}
function updateToolVisibility(){
 $('rpiDetails').hidden=!$('showRpi').checked;
 $('lipidsDetails').hidden=!['showLipTotal','showLipTg','showLipLdl'].some(id=>$(id).checked);
}

function showTab(name){
 for(const [key,button,content] of [['review','tabReview','reviewContent'],['indices','tabIndices','indicesContent'],['calculators','tabCalculators','calculatorContent']]){
  const active=name===key;$(content).hidden=!active;$(button).classList.toggle('active',active);$(button).setAttribute('aria-selected',String(active));$(button).tabIndex=active?0:-1;
 }
}
function unitValue(e,kind){if(!e||!Number.isFinite(e.num))return null;const u=L.clean(e.unit||'').replace(/\s/g,'').replace(/µ/g,'u');const n=e.num;
 if(kind==='creat'){if(u==='mg/dl')return n;if(u==='mg/l')return n/10;if(u==='umol/l')return n/88.4;if(u==='mmol/l')return n*11.312;}
 if(kind==='urea'){if(u==='mg/dl')return n;if(u==='mg/l')return n/10;if(u==='mmol/l')return n*6.006;}
 if(kind==='sodium'||kind==='hco3'||kind==='chloride'){if(['mmol/l','meq/l'].includes(u))return n;}
 if(kind==='albumin'){if(u==='g/dl')return n;if(u==='g/l')return n/10;}
 if(kind==='transferrin'){if(u==='mg/dl')return n;if(u==='g/l')return n*100;}
 return null;
}
function firstVal(sec,key,kind){return unitValue(firstKey(sec,key),kind);}
function makeIndex(id,label,value,unit,interpretation,ranges,dec=2,fixed=false){
 if(!Number.isFinite(value))return null;
 const formatted=fixed?Number(value).toLocaleString('es-ES',{minimumFractionDigits:dec,maximumFractionDigits:dec}):fmtNum(value,dec);
 const section=({rnl:'hemograma',rpi:'hemograma',fena:'orina',feurea:'orina',ureaRatio:'orina',crRatio:'orina',rfi:'orina',anionGap:'gasometria',anionGapCorr:'gasometria',deltaRatio:'gasometria',tibc:'ferrico',lipTotal:'lipidico',lipTg:'lipidico',lipLdl:'lipidico',nonhdl:'lipidico',sodiumCorr:'bioquimica'})[id]||'otros';
 return {id,label,value:formatted,unit:unit||'',kind:'index',section,short:label+': '+formatted+(unit?' '+unit:''),inline:label+' '+formatted+(unit?' '+unit:''),interpretation,ranges};
}
function indexData(){
 if(!parsed)return[];
 const opts=readOpts(),out=[];const add=(r)=>{if(r)out.push(r)};
 const rnl=nlrValues();
 if(opts.rnl&&rnl!==null){const cl=nlrClassification(rnl);add(makeIndex('rnl','Ratio neutrófilo-linfocito (RNL)',rnl,'',cl.name+' · Escala orientativa de respuesta inflamatoria/estrés, no diagnóstico ni clasificación clínica universal.','1–3 normal · >3–<6 indeterminado (normal-leve) · 6–<9 estrés leve · 9–18 estrés moderado · >18 estrés intenso/grave.',2));}
 const pna=firstVal('bioquimica','sodio','sodium'),pcr=firstVal('bioquimica','creatinina','creat'),pu=firstVal('bioquimica','urea','urea');
 const glucose=numUnit(firstKey('bioquimica','glucosa'),'glucose');
 if(opts.sodiumCorr&&pna!==null&&pna>0&&glucose!==null&&glucose>=200){
  const corrected=pna+2.4*(glucose-100)/100;
  add(makeIndex('sodiumCorr','Sodio corregido por glucemia',corrected,'mmol/L','Corrección orientativa del sodio medido en hiperglucemia.','Sin umbrales independientes; valorar el sodio corregido junto al estado clínico.',1));
 }
 const una=firstVal('orina_bioq','sodio_orina','sodium'),ucr=firstVal('orina_bioq','creatinina_orina','creat'),uu=firstVal('orina_bioq','urea_orina','urea');
 const valid=(...xs)=>xs.every(x=>x!==null&&Number.isFinite(x)&&x>0);
 if(opts.fena&&valid(una,pcr,pna,ucr)){
  const v=100*una*pcr/(pna*ucr);
  add(makeIndex('fena','FeNa',v,'%',v<1?'Compatible con retención renal de sodio; posible componente prerrenal. Interpretación limitada con diuréticos, ERC y sepsis.':v<=2?'Zona indeterminada.':'Puede orientar hacia lesión tubular intrínseca.','<1 % prerrenal · 1–2 % indeterminado · >2 % posible lesión tubular.'));
 }
 if(opts.feurea&&valid(uu,pcr,pu,ucr)){
  const v=100*uu*pcr/(pu*ucr);
  add(makeIndex('feurea','FeUrea',v,'%',v<35?'Puede apoyar un componente prerrenal.':v>50?'Compatible con lesión renal intrínseca en contexto apropiado.':'Interpretación intermedia, no concluyente.','<35 % orienta a prerrenal · 35–50 % intermedio · >50 % sugiere intrínseca.'));
 }
 if(opts.ureaRatio&&valid(uu,pu))add(makeIndex('ureaRatio','Urea orina/suero',uu/pu,'','Cociente de concentraciones, no diagnóstico aislado.','Depende de las condiciones clínicas y la diuresis.'));
 if(opts.crRatio&&valid(ucr,pcr))add(makeIndex('crRatio','Creatinina orina/suero',ucr/pcr,'','Cociente de concentraciones; interpretar según el contexto.','Sin punto de corte universal de gravedad.'));
 if(opts.rfi&&valid(una,pcr,ucr))add(makeIndex('rfi','Índice de fallo renal',una*pcr/ucr,'','Índice orientativo de manejo renal de sodio.','<1 orienta a prerrenal; >1 puede sugerir lesión tubular, con limitaciones similares a FeNa.'));
 const st=firstVal('bioquimica','sodio','sodium'),cl=firstVal('bioquimica','cloro','chloride'),b=firstVal('gasometria','hco3','hco3');
 const albumin=firstVal('bioquimica','albumina','albumin');
 if(st!==null&&cl!==null&&b!==null){const ag=st-cl-b,agc=(albumin!==null&&albumin>=0&&albumin<4)?ag+2.5*(4-albumin):ag;
  if(opts.anionGap){add(makeIndex('anionGap','Anion gap',ag,'mmol/L',ag>12?'Anion gap elevado (sin potasio), según el laboratorio.':'Sin elevación clara en la fórmula sin potasio.','Intervalo orientativo sin K: 8–12 mmol/L; depende del método y la albúmina.',1));
   if(agc!==ag)add(makeIndex('anionGapCorr','Anion gap corregido por albúmina',agc,'mmol/L','Corrección orientativa ante hipoalbuminemia.','Usar con interpretación ácido-base clínica.',1));}
  if(opts.deltaRatio&&agc>12&&b<24)add(makeIndex('deltaRatio','Razón delta-delta',(agc-12)/(24-b),'','Compatible con alteración del equilibrio ácido-base; valorar trastornos mixtos.','<0,4 acidosis de anion gap normal asociada · 0,4–0,8 mezcla frecuente · 0,8–2 orienta a AG elevado aislado · >2 considerar alcalosis o HCO₃ previo elevado.'));
 }
 const trans=firstVal('ferrico','transferrina','transferrin');
 if(opts.tibc&&trans!==null&&trans>0)add(makeIndex('tibc','TIBC',trans*1.4,'µg/dL','Estimación derivada de transferrina, no medición directa.','Intervalo típico orientativo: 250–450 µg/dL; depende del laboratorio.',1));
 const h=getInput('rpiHct'),rt=getInput('rpiRetic');
 if(opts.showRpi&&rt!==null&&h!==null&&rt>=0&&h>0&&h<=80){const corr=rt*h/45,maturation=h>=40?1:h>=35?1.5:h>=25?2:h>=15?2.5:3,v=corr/maturation;
  add(makeIndex('rpi','IPR',v,'',v<2?'Respuesta medular insuficiente para el grado de anemia.':v>3?'Respuesta regenerativa orientativa.':'Zona intermedia.','<2 respuesta insuficiente · 2–3 intermedio · >3 regenerativa. Factor de maduración aproximado.'));
  $('rpiResult').textContent='Reticulocitos corregidos '+fmtNum(corr,2)+' % · IPR '+fmtNum(v,2);
 }else $('rpiResult').textContent='Introduce reticulocitos y hematocrito.';
 const hd=getInput('lipHdl');
 for(const [pref,id,label,input] of [['lipTotal','lipTotal','Colesterol total/HDL','lipTotal'],['lipTg','lipTg','Triglicéridos/HDL','lipTg'],['lipLdl','lipLdl','LDL/HDL','lipLdl']]){
  if(!opts[pref])continue;const value=getInput(input);
  if(hd!==null&&hd>0&&value!==null&&value>=0)add(makeIndex(id,label,value/hd,'','Cociente lipídico complementario; no sustituye los objetivos de LDL, no-HDL o ApoB.','No hay objetivos clínicos universales validados para este cociente.',2,true));
 }
 if(opts.nonhdl){const ct=firstKey('lipidico','col_total'),h=firstKey('lipidico','col_hdl'),t=ct?numUnit(ct,'lipid'):null,hi=h?numUnit(h,'lipid'):null;
  if(t!==null&&hi!==null&&t>=hi)add(makeIndex('nonhdl','Colesterol no-HDL',t-hi,'mg/dL','Objetivo individualizado según el riesgo cardiovascular.','Los objetivos varían por categoría de riesgo.',1));}
 $('lipResult').textContent=hd!==null&&hd>0?'HDL disponible para calcular los cocientes seleccionados.':'Introduce HDL y los parámetros que falten.';
 return out;
}
function automaticExtras(){
 const bySection={};let sodiumCorrection=null;
 if(!parsed)return{bySection,sodiumCorrection};
 for(const r of indexData()){
  if(suppressedIndices.has(r.id))continue;
  if(r.id==='sodiumCorr'){sodiumCorrection=r.value;continue;}
  (bySection[r.section]??=[]).push(r.inline);
 }
 return{bySection,sodiumCorrection};
}
function renderIndices(){
 if(!parsed){return;}
 for(const [id,r] of [...activeResults])if(!['bic','katz','hillier','water','fib4'].includes(id))activeResults.delete(id);
 const out=indexData(),dest=$('indicesList');dest.replaceChildren();
 $('indicesBadge').textContent=out.length?'('+out.length+')':'';
 if(!out.length){const t=document.createElement('span');t.className='empty';t.textContent='No hay índices disponibles con las preferencias y datos actuales.';dest.append(t);}
 else for(const r of out){activeResults.set(r.id,r);const card=document.createElement('div');card.className='indexCard';
  const hd=document.createElement('div');hd.className='indexHead';const name=document.createElement('strong');name.textContent=r.label;hd.append(name);
  const range=document.createElement('p');range.className='range';range.textContent=r.ranges;
  const val=document.createElement('div');val.className='indexValue';val.textContent=r.value+(r.unit?' '+r.unit:'');
  const why=document.createElement('p');why.className='meaning';why.textContent=r.interpretation;
  const controls=document.createElement('div');controls.dataset.actionsFor=r.id;card.append(hd,range,val);
  if(r.id==='rnl'){
   const numeric=Number(r.value.replace(',','.'));
   const cl=nlrClassification(numeric);
   // La barra representa un continuo 0-24; el tramo >18 se satura visualmente en 24+.
   // No cambiamos la interpretación clínica ni los umbrales ya existentes.
   const position=Math.max(0,Math.min(100,numeric/24*100));
   const gaugeWrapper=document.createElement('div');gaugeWrapper.className='rnlGaugeWrap';
   const badge=document.createElement('span');badge.className='indexGrade rnlFloatingGrade';badge.style.color=cl.color;badge.style.background=cl.color+'20';badge.style.left=Math.max(14,Math.min(86,position))+'%';badge.textContent=cl.name;
   const pointer=document.createElement('span');pointer.className='rnlPointer';pointer.style.left=Math.max(1,Math.min(99,position))+'%';pointer.setAttribute('aria-label','Posición del RNL en la barra');
   const gauge=document.createElement('div');gauge.className='indexGauge rnlScaledGauge';
   for(const [c,start,end] of [['#94a3b8',0,1],['#27966f',1,3],['#64748b',3,6],['#d9ac35',6,9],['#e38b42',9,18],['#cc4c4c',18,24]]){const step=document.createElement('span');step.style.background=c;step.style.flex=(end-start)+' 1 0';gauge.append(step)}
   const ticks=document.createElement('div');ticks.className='rnlGaugeTicks';ticks.textContent='0          3          6          9          18          24+';
   for(const [text,pct] of [['0',0],['3',12.5],['6',25],['9',37.5],['18',75],['24+',100]]){const tick=document.createElement('span');tick.textContent=text;tick.style.left=Math.max(2,Math.min(98,pct))+'%';ticks.append(tick)}
   ticks.firstChild.remove();gaugeWrapper.append(badge,pointer,gauge,ticks);card.append(gaugeWrapper);
  }
  card.append(why,controls);dest.append(card);
 }
 updateToolVisibility();updateAddedResults();renderAllActionButtons();
}
