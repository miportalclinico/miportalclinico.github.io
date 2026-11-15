'use strict';
// Portal Clínico v48: información orientativa de equipotencia y tablas por indicación.
const $ = id => document.getElementById(id);
const fmt = (n,digits=2) => Number(n).toLocaleString('es-ES',{maximumFractionDigits:digits});
const num = v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(String(v).trim().replace(',','.'));return Number.isFinite(n)&&n>=0?n:null};
const selFill=(id,items)=>{$(id).replaceChildren(new Option('Selecciona…',''));items.forEach(v=>$(id).add(new Option(v.n,v.id)));};
const makeResult=(id,title,desc='')=>{$(id).replaceChildren();let b=document.createElement('strong');b.textContent=title;$(id).append(b);if(desc){let s=document.createElement('span');s.textContent=desc;$(id).append(s)}};
const range=(a,b,suf='',digits=2)=>`${fmt(a,digits)}${Math.abs(a-b)>1e-5?'–'+fmt(b,digits):''}${suf?' '+suf:''}`;

// Potencia analgésica expresada en miligramos aproximados de morfina oral por unidad.
// Intervalos conservan discrepancias bibliográficas, NO una incertidumbre estadística.
const OPIOIDS=[
 {id:'morfina_po',n:'Morfina oral',u:'mg/24 h',f:[1,1],eq:'30 mg'},
 {id:'morfina_iv',n:'Morfina IV',u:'mg/24 h',f:[3,3],eq:'10 mg'},
 {id:'morfina_sc',n:'Morfina SC',u:'mg/24 h',f:[2,3],eq:'10–15 mg'},
 {id:'oxicodona_po',n:'Oxicodona oral',u:'mg/24 h',f:[1.5,2],eq:'15–20 mg'},
 {id:'hidromorfona_po',n:'Hidromorfona oral',u:'mg/24 h',f:[4,5],eq:'6–7,5 mg'},
 {id:'hidromorfona_iv',n:'Hidromorfona IV',u:'mg/24 h',f:[20,30],eq:'1–1,5 mg'},
 {id:'codeina_po',n:'Codeína oral',u:'mg/24 h',f:[.1,.2],eq:'150–300 mg'},
 {id:'tramadol_po',n:'Tramadol oral',u:'mg/24 h',f:[.1,.2],eq:'150–300 mg'},
 {id:'tapentadol_po',n:'Tapentadol oral',u:'mg/24 h',f:[.4,.4],eq:'75 mg'},
 {id:'fentanilo_td',n:'Fentanilo transdérmico',u:'µg/h',f:[2.4,2.4],eq:'≈12,5 µg/h'},
 {id:'buprenorfina_td',n:'Buprenorfina transdérmica',u:'µg/h',f:[2.4,2.4],eq:'≈12,5 µg/h (factor muy variable)'}
];
// Dosis de cada fármaco aproximadamente equipotentes a 5 mg de diazepam oral.
const BENZOS=[
 {id:'diazepam',n:'Diazepam',d:[5,5]},
 {id:'alprazolam',n:'Alprazolam',d:[.25,.5]},
 {id:'lorazepam',n:'Lorazepam',d:[.5,1]},
 {id:'clonazepam',n:'Clonazepam',d:[.25,.5]},
 {id:'bromazepam',n:'Bromazepam',d:[2.5,6]},
 {id:'clorazepato',n:'Clorazepato',d:[7.5,7.5]},
 {id:'lormetazepam',n:'Lormetazepam',d:[.5,1]},
 {id:'clobazam',n:'Clobazam',d:[10,10]},
 {id:'clordiazepoxido',n:'Clordiazepóxido',d:[12.5,12.5]},
 {id:'oxazepam',n:'Oxazepam',d:[10,10]},
 {id:'temazepam',n:'Temazepam',d:[10,10]},
 {id:'nitrazepam',n:'Nitrazepam',d:[5,5]},
 {id:'loprazolam',n:'Loprazolam',d:[.5,1]},
 {id:'flurazepam',n:'Flurazepam',d:[7.5,15]}
];
const GLUCO=[
 {id:'hidrocortisona',n:'Hidrocortisona',d:20,gc:'1',mc:'1',life:'8–12 h'},
 {id:'cortisona',n:'Cortisona',d:25,gc:'0,8',mc:'0,8',life:'8–12 h'},
 {id:'prednisona',n:'Prednisona',d:5,gc:'4',mc:'0,3',life:'18–36 h'},
 {id:'prednisolona',n:'Prednisolona',d:5,gc:'5',mc:'0,3',life:'18–36 h'},
 {id:'metilprednisolona',n:'Metilprednisolona',d:4,gc:'5',mc:'0',life:'18–36 h'},
 {id:'triamcinolona',n:'Triamcinolona',d:4,gc:'5',mc:'0',life:'18–36 h'},
 {id:'dexametasona',n:'Dexametasona',d:.75,gc:'30',mc:'0',life:'36–54 h'},
 {id:'betametasona',n:'Betametasona',d:.6,gc:'25–40',mc:'0',life:'36–54 h'}
];
const get=(arr,id)=>arr.find(x=>x.id===id);
const patchValues=['12.5','25','50','75','100'];
function patchPicker(select,custom){select.replaceChildren();patchValues.forEach(v=>select.add(new Option(`${fmt(v)} µg/h`,v)));select.add(new Option('Otra dosis…','other'));select.value='25';custom.hidden=true;}
function opAmount(){let f=get(OPIOIDS,$('opFrom').value);if(!f)return null;return f.id==='fentanilo_td'?num($('opPatch').value==='other'?$('tdCustom').value:$('opPatch').value):num($('opDose').value)}
function calcOp(from,to,amount){
 if(from.id===to.id)return [amount,amount];
 // Conservative range of separate literature estimates.
 return [amount*from.f[0]/to.f[1],amount*from.f[1]/to.f[0]];
}
function renderOp(){let from=get(OPIOIDS,$('opFrom').value),to=get(OPIOIDS,$('opTo').value);
 let patch=Boolean(from&&from.id==='fentanilo_td');$('tdDoseSel').classList.toggle('visible',patch);$('opDose').closest('.field').hidden=patch;
 $('tdCustom').hidden=$('opPatch').value!=='other';$('opUnit').textContent=from?`Unidad: ${from.u}`:'Dosis en 24 h (parches: µg/h)';
 const v=opAmount();if(!from||!to||v===null||v<=0){makeResult('opResult','Selecciona origen, dosis y destino.');return;}
 const [lo,hi]=calcOp(from,to,v);makeResult('opResult',range(lo,hi,to.u),`${fmt(v)} ${from.u} de ${from.n} → ${to.n}. No es una pauta inicial de rotación.`);
}
function calcBenzo(from,to,dose){if(from.id===to.id)return [dose,dose];return [dose*to.d[0]/from.d[1],dose*to.d[1]/from.d[0]];}
function renderBz(){let a=get(BENZOS,$('bzFrom').value),b=get(BENZOS,$('bzTo').value),v=num($('bzDose').value);
 if(!a||!b||v===null||v<=0){makeResult('bzResult','Selecciona origen, dosis y destino.');return;}
 const [lo,hi]=calcBenzo(a,b,v);makeResult('bzResult',range(lo,hi,'mg/24 h'),`${a.n} → ${b.n}. Estimación de potencia oral; no pauta de sustitución ni retirada.`);
}
function renderSteroid(){let a=get(GLUCO,$('gcDrug').value),b=get(GLUCO,$('gcTo').value),v=num($('gcDose').value);
 if(!a||!b||v===null){makeResult('gcResult','Selecciona origen, destino y dosis.');return;}
 makeResult('gcResult',`${fmt(v*b.d/a.d)} mg de ${b.n}`,`≈ ${fmt(v)} mg de ${a.n} (potencia antiinflamatoria).`);
}
function setupTables(){
 const po=$('opioidReference'),bz=$('benzoReference'),gc=$('gcReference');
 OPIOIDS.forEach(d=>{let row=po.insertRow();row.insertCell().textContent=d.n;row.insertCell().textContent=d.eq});
 BENZOS.forEach(d=>{let row=bz.insertRow();row.insertCell().textContent=d.n;row.insertCell().textContent=range(...d.d,'mg')});
 GLUCO.forEach(d=>{let row=gc.insertRow();[d.n,`${fmt(d.d)} mg`,d.gc,d.mc,d.life].forEach(v=>row.insertCell().textContent=v)});
}
let rowId=0;
function createDrugRow(kind,chosen){let isOp=kind==='op',arr=isOp?OPIOIDS:BENZOS,root=$(kind+'Rows');if(root.children.length>=20)return;
 let holder=document.createElement('div');holder.className='row-holder';let row=document.createElement('div');row.className='drug-row';let id='row'+(++rowId);
 const a=document.createElement('div'),label=document.createElement('label');label.className='medlabel';label.htmlFor=id;label.textContent='Fármaco';const sel=document.createElement('select');sel.id=id;selFillInto(sel,arr);sel.value=chosen||'';a.append(label,sel);
 const b=document.createElement('div'),lab=document.createElement('label');lab.className='amountlabel';lab.htmlFor=id+'amt';lab.textContent='Total en 24 h';const input=document.createElement('input');input.type='number';input.min='0';input.step='any';input.id=id+'amt';input.placeholder='Cantidad';b.append(lab,input);
 const remove=document.createElement('button');remove.type='button';remove.textContent='Quitar';row.append(a,b,remove);holder.append(row);
 const picker=document.createElement('div');picker.className='field';picker.style.display='none';const pickLab=document.createElement('label');pickLab.textContent='Potencia parche (µg/h)';const patch=document.createElement('select');const custom=document.createElement('input');custom.type='number';custom.step='any';custom.min='0';custom.placeholder='Potencia (µg/h)';patchPicker(patch,custom);picker.append(pickLab,patch,custom);holder.append(picker);
 const detail=document.createElement('div');detail.className='drug-detail';holder.append(detail);root.append(holder);
 const refresh=()=>{let d=get(arr,sel.value),isPatch=isOp&&d&&d.id==='fentanilo_td';picker.style.display=isPatch?'grid':'none';b.hidden=isPatch;custom.hidden=patch.value!=='other';detail.textContent=d?`Unidad: ${d.u}`:'';refreshSum(kind)};
 [sel,input,patch,custom].forEach(el=>el.addEventListener(el===sel||el===patch?'change':'input',refresh));remove.addEventListener('click',()=>{holder.remove();refreshSum(kind)});refresh();
}
function selFillInto(select,arr){select.replaceChildren(new Option('Selecciona…',''));arr.forEach(x=>select.add(new Option(x.n,x.id)));}
function refreshSum(kind){let isOp=kind==='op',arr=isOp?OPIOIDS:BENZOS,rows=[...$(kind+'Rows').children],lo=0,hi=0,lines=[],valid=0;
 for(const r of rows){const select=r.querySelector('.drug-row select'),input=r.querySelector('.drug-row input'),d=get(arr,select.value);
 if(!d)continue;let amt=isOp&&d.id==='fentanilo_td'?num(r.querySelector('.field select').value==='other'?r.querySelector('.field input').value:r.querySelector('.field select').value):num(input.value);
 if(amt===null||amt<=0)continue;let l,h,unit;
 if(isOp){l=amt*d.f[0];h=amt*d.f[1];unit=d.u;}else{l=amt*5/d.d[1];h=amt*5/d.d[0];unit='mg/24 h';}
 lo+=l;hi+=h;valid++;lines.push(`${d.n}: ${fmt(amt)} ${unit} ≈ ${range(l,h,isOp?'mg morfina oral/día':'mg diazepam/día')}`);
 }
 let label=isOp?'mg morfina oral equivalente/24 h':'mg diazepam equivalente/24 h';
 if(!valid){makeResult(kind+'Total','Añade medicamentos y dosis válidas.');$(kind+'Summary').value='';return;}
 makeResult(kind+'Total',range(lo,hi,label),`Total de ${valid} tratamientos introducidos. Estimación orientativa.`);
 $(kind+'Summary').value=lines.join('\n')+`\nTOTAL ≈ ${range(lo,hi,label)}\nNo es una pauta de rotación ni retirada.`;
}
function copySummary(id,button){let val=$(id).value;if(!val){button.textContent='Sin resultado';return;}
 let fallback=()=>{$(id).focus();$(id).select();document.execCommand('copy')};
 if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(val).then(()=>button.textContent='Copiado').catch(()=>{fallback();button.textContent='Seleccionado'});
 else{fallback();button.textContent='Copiado'}setTimeout(()=>button.textContent='Copiar resumen',1500);
}

// Tablas de dosis terapéuticas por indicación (no equipotencia mg:mg)
const RAAS={
 hta:{'IECA':[['Enalapril','5 mg/24 h','10–20 mg/24 h','40 mg/24 h'],['Ramipril','2,5 mg/24 h','2,5–5 mg/24 h','10 mg/24 h'],['Lisinopril','10 mg/24 h','20 mg/24 h','40 mg/24 h'],['Captopril','12,5–25 mg/8–12 h','25–50 mg/8–12 h','150 mg/24 h'],['Perindopril','2–4 mg/24 h','4–8 mg/24 h','Según formulación']], 'ARA-II':[['Losartán','50 mg/24 h','50–100 mg/24 h','100 mg/24 h'],['Valsartán','80 mg/24 h','80–160 mg/24 h','320 mg/24 h'],['Candesartán','4–8 mg/24 h','8–32 mg/24 h','32 mg/24 h'],['Irbesartán','150 mg/24 h','150–300 mg/24 h','300 mg/24 h'],['Telmisartán','40 mg/24 h','40–80 mg/24 h','80 mg/24 h'],['Olmesartán','10 mg/24 h','20–40 mg/24 h','40 mg/24 h']]},
 ic:{'IECA':[['Enalapril','2,5 mg/12 h','10 mg/12 h','20 mg/12 h'],['Lisinopril','2,5–5 mg/24 h','20–35 mg/24 h','Según tolerancia'],['Ramipril','1,25–2,5 mg/24 h','5 mg/12 h','Según pauta ensayada'],['Trandolapril','0,5 mg/24 h','4 mg/24 h','Según tolerancia']], 'ARA-II':[['Candesartán','4–8 mg/24 h','32 mg/24 h','32 mg/24 h'],['Valsartán','40 mg/12 h','160 mg/12 h','160 mg/12 h'],['Losartán','25–50 mg/24 h','150 mg/24 h','150 mg/24 h']]},
 post:{'IECA':[['Ramipril','2,5 mg/12 h','5 mg/12 h','10 mg/24 h'],['Trandolapril','0,5–1 mg/24 h','4 mg/24 h','4 mg/24 h'],['Captopril','6,25 mg inicial','50 mg/8 h','150 mg/24 h'],['Lisinopril','5 mg/24 h','10 mg/24 h','Según tolerancia']], 'ARA-II':[['Valsartán','20–40 mg/12 h','160 mg/12 h','160 mg/12 h']]},
 nefro:{'IECA':[['Ramipril','1,25–2,5 mg/24 h','Hasta 10 mg/24 h','Según PA, función renal y K'],['Enalapril','2,5–5 mg/24 h','Según PA y albuminuria','Individualizar']], 'ARA-II':[['Losartán','50 mg/24 h','100 mg/24 h','100 mg/24 h'],['Irbesartán','150 mg/24 h','300 mg/24 h','300 mg/24 h']]}
};
const BB={
 ic:[['Bisoprolol','1,25 mg/24 h','10 mg/24 h','Titular progresivamente'],['Carvedilol','3,125 mg/12 h','25 mg/12 h*','*Puede variar por peso'],['Metoprolol succinato LP','12,5–25 mg/24 h','200 mg/24 h','Formulación LP específica; verificar indicación local'],['Nebivolol','1,25 mg/24 h','10 mg/24 h','Selección según perfil clínico']],
 hta:[['Atenolol','25–50 mg/24 h','50–100 mg/24 h','Según respuesta'],['Bisoprolol','2,5–5 mg/24 h','5–10 mg/24 h','Según respuesta'],['Carvedilol','6,25 mg/12 h','12,5–25 mg/12 h','Alfa y beta bloqueo'],['Nebivolol','2,5 mg/24 h','5 mg/24 h','Según respuesta'],['Metoprolol oral','25–50 mg/24 h','100–200 mg/24 h','Depende de formulación']],
 angina:[['Atenolol','25–50 mg/24 h','50–100 mg/24 h','Titular según síntomas y FC'],['Bisoprolol','2,5–5 mg/24 h','5–10 mg/24 h','Individualizar'],['Metoprolol','25–50 mg/12 h','100–200 mg/24 h','Depende de formulación'],['Carvedilol','6,25–12,5 mg/12 h','Hasta 25 mg/12 h','Individualizar']],
 fa:[['Bisoprolol','2,5–5 mg/24 h','Hasta 10 mg/24 h','Según FC, PA, función ventricular'],['Metoprolol','25–50 mg/12 h','Según respuesta','Distinguir tartrato y succinato'],['Carvedilol','3,125–6,25 mg/12 h','Según respuesta','Preferencia en algunos perfiles de IC'],['Atenolol','25–50 mg/24 h','Hasta 100 mg/24 h','No para tratar ICFEr']],
 post:[['Metoprolol','Según estabilidad','Según indicación/ensayo','Revisar FEVI y situación clínica'],['Bisoprolol','Individualizar','Individualizar','Especialmente si IC'],['Carvedilol','Individualizar','Individualizar','Especialmente si disfunción ventricular']]
};
const CA={
 dih:{hta:[['Amlodipino','5 mg/24 h','5–10 mg/24 h',''],['Lercanidipino','10 mg/24 h','10–20 mg/24 h',''],['Nifedipino OROS/LP','30 mg/24 h','30–120 mg/24 h','No confundir con liberación inmediata'],['Felodipino LP','5 mg/24 h','5–10 mg/24 h',''],['Lacidipino','2 mg/24 h','2–4 mg/24 h','']],angina:[['Amlodipino','5 mg/24 h','5–10 mg/24 h',''],['Nifedipino LP/OROS','30 mg/24 h','Según formulación','Evitar nifedipino de acción corta']],fa:[]},
 nodih:{hta:[['Diltiazem LP','90–120 mg/24 h','180–360 mg/24 h','Depende de formulación'],['Verapamilo LP','120 mg/24 h','Hasta 240–480 mg/24 h','Depende de formulación']],angina:[['Diltiazem LP','90–120 mg/24 h','Hasta 360 mg/24 h','Depende de formulación'],['Verapamilo LP','120 mg/24 h','240–480 mg/24 h','Depende de formulación']],fa:[['Diltiazem oral/LP','30–60 mg/8 h','Según FC/PA','No en ICFEr'],['Verapamilo oral/LP','40–80 mg/8 h','Según FC/PA','No en ICFEr']]} 
};
function renderSimpleTable(id,byGroup,{headings=true}={}){
 const tbody=$(id);tbody.replaceChildren();
 for(const [group,rows] of Object.entries(byGroup)){
  if(!rows||!rows.length)continue;
  if(headings){const tr=tbody.insertRow();tr.className='table-family-heading';const td=tr.insertCell();td.colSpan=4;td.textContent=group;}
  rows.forEach(data=>{const tr=tbody.insertRow();data.forEach((text,i)=>{const td=tr.insertCell();td.textContent=text||'—';if(i===0)td.className='medicine-name';});});
 }
 if(!tbody.rows.length){const tr=tbody.insertRow();const td=tr.insertCell();td.textContent='Sin pauta comparable para esta indicación.';td.colSpan=4;}
}
function renderIndTables(){
 renderSimpleTable('raasTable',RAAS[$('raasInd').value]);
 renderSimpleTable('bbTable',{'':BB[$('bbInd').value]},{headings:false});
 const selected=$('caInd').value;
 renderSimpleTable('caTable',{
  'Dihidropiridínicos':CA.dih[selected],
  'No dihidropiridínicos':CA.nodih[selected]
 });
}

// Matriz de dosis y reducción de LDL aportada por el usuario (orientativa).
const HEADS=['Prava','Fluva','Lova','Simva','Pita','Atorva','Rosu','E+Pr','E+F','E+L','E+S','E+P','E+A','E+R'];
const LONG=['Pravastatina','Fluvastatina','Lovastatina','Simvastatina','Pitavastatina','Atorvastatina','Rosuvastatina','Ezetimiba + pravastatina','Ezetimiba + fluvastatina','Ezetimiba + lovastatina','Ezetimiba + simvastatina','Ezetimiba + pitavastatina','Ezetimiba + atorvastatina','Ezetimiba + rosuvastatina'];
const LR=[
 [25,{'Prava':'20','Fluva':'40'}],
 [30,{'Lova':'20','Simva':'10'}],
 [36,{'Prava':'40','Fluva':'80','Lova':'40','Simva':'20','Pita':'1','Atorva':'10'}],
 [41,{'Simva':'40','Pita':'2','Atorva':'20','Rosu':'5'}],
 [44,{'Atorva':'30','E+Pr':'10/20','E+F':'10/40'}],
 [47,{'Pita':'4','Atorva':'40','Rosu':'10'}],
 [50,{'Atorva':'60','E+L':'10/20','E+S':'10/10'}],
 [55,{'Atorva':'80','Rosu':'20','E+Pr':'10/40','E+F':'10/80','E+L':'10/40','E+S':'10/20','E+P':'10/1','E+A':'10/10'}],
 [60,{'Rosu':'40','E+S':'10/40','E+P':'10/2','E+A':'10/20','E+R':'10/5'}],
 [63,{'E+A':'10/30'}],
 [67,{'E+P':'10/4','E+A':'10/40','E+R':'10/10'}],
 [70,{'E+A':'10/60'}],
 [73,{'E+A':'10/80','E+R':'10/20'}],
 [79,{'E+R':'10/40'}]
];
// Tabla 11 de Estándares SEA 2026: media/estimación del descenso de cLDL.
const EXTRA=[
 {n:'Evolocumab 140 mg/14 días',v:[65,79,83,87,89]},
 {n:'Alirocumab 150 mg/14 días (o 300 mg/mes)',v:[62,77,81,85,88]},
 {n:'Alirocumab 75 mg/14 días',v:[53,72,77,82,85]},
 {n:'Inclisirán (tras dosis de inicio, mantenimiento semestral)',v:[50,70,75,81,85]}
];
function lvl(n){return n<=30?['low','Baja']:n<=50?['moderate','Moderada']:n<=60?['high','Alta']:n<=80?['very-high','Muy alta']:['max','Máxima'];}
function prepLipid(){
 const legend=$('lipidLegend');[['≤30 %','Baja'],['>30–≤50 %','Moderada'],['>50–≤60 %','Alta'],['>60–≤80 %','Muy alta'],['>80 %','Máxima']].forEach(([r,n],i)=>{let el=document.createElement('span');el.className='ldl-rank-'+['low','moderate','high','very-high','max'][i];el.textContent=`${n}: ${r}`;el.style.background=['#e5e7eb','#f8e5a5','#f5c9a4','#eaa18a','#d9a6c8'][i];legend.append(el)});
 HEADS.forEach((x,i)=>{let th=document.createElement('th');th.textContent=x;th.title=LONG[i];th.dataset.col=String(i);th.tabIndex=0;$('lipidColumns').append(th)});
 const body=$('lipidMatrixBody');LR.forEach(([pct,vals],ri)=>{let tr=body.insertRow();tr.dataset.row=String(ri);tr.className="rank-"+lvl(pct)[0];HEADS.forEach((h,ci)=>{let cell=tr.insertCell();cell.textContent=vals[h]||'';cell.dataset.col=String(ci);cell.title=vals[h]?`${LONG[ci]} ${vals[h]} mg ≈ ${pct}% de reducción LDL`:'';cell.tabIndex=0});let td=tr.insertCell();td.className='ldl-rank-'+lvl(pct)[0];td.textContent=pct+' %';td.tabIndex=0});
 let selectedRow=null,selectedCol=null;
 function highlight(){body.querySelectorAll('tr').forEach((tr,i)=>{[...tr.cells].forEach((td,j)=>{td.classList.toggle('hilite-row',i===selectedRow);td.classList.toggle('hilite-col',j===selectedCol)})});$('lipidColumns').querySelectorAll('[data-col]').forEach(th=>th.classList.toggle('hilite-col',Number(th.dataset.col)===selectedCol));}
 function handle(target){let cell=target.closest('td,th');if(!cell)return;let tr=cell.closest('tbody tr');if(tr){let id=Number(tr.dataset.row);selectedRow=selectedRow===id?null:id;}if(cell.dataset.col!==undefined){let col=Number(cell.dataset.col);selectedCol=selectedCol===col?null:col;}highlight()}
 $('lipidMatrix').addEventListener('click',e=>handle(e.target));$('lipidMatrix').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handle(e.target)}});
 EXTRA.forEach(row=>{let tr=$('lipidExtraBody').insertRow();tr.insertCell().textContent=row.n;row.v.forEach(n=>{let td=tr.insertCell();td.textContent=n+' %';td.style.background=['#e5e7eb','#f8e5a5','#f5c9a4','#eaa18a','#d9a6c8'][['low','moderate','high','very-high','max'].indexOf(lvl(n)[0])]})});
 const choices=[...new Set([...LR.map(x=>x[0]),...EXTRA.flatMap(x=>x.v)])].sort((a,b)=>a-b);choices.forEach(v=>$('lipidPercent').add(new Option(v+' %',String(v))));$('lipidPercent').value='55';
 [...LONG,...EXTRA.map(x=>x.n)].forEach((n,i)=>$('lipidDrug').add(new Option(n,String(i))));$('lipidDrug').value='5';
 renderCards();
 const mobile=window.matchMedia('(max-width:700px)').matches;setView(mobile?'consulta':'tabla');
}
function setView(v){for(const x of document.querySelectorAll('[data-lview]'))x.setAttribute('aria-pressed',String(x.dataset.lview===v));$('lipidTabla').hidden=v!=='tabla';$('lipidConsulta').hidden=v!=='consulta'}
let lipidMode='reduccion';
function setLipidMode(v){lipidMode=v;for(const x of document.querySelectorAll('[data-lmode]'))x.setAttribute('aria-pressed',String(x.dataset.lmode===v));$('lipidSelectReduction').hidden=v!=='reduccion';$('lipidSelectDrug').hidden=v!=='farmaco';renderCards()}
function card(title,dose,pct,sub){let div=document.createElement('div');div.className='lipid-choice';let name=document.createElement('strong');name.textContent=title;let sm=document.createElement('small');sm.textContent= dose + (sub?' · '+sub:'');let b=document.createElement('b');b.textContent='↓ '+pct+' %';div.append(name,sm,b);return div}
function renderCards(){let root=$('lipidCards');root.replaceChildren();let found=0;
 if(lipidMode==='reduccion'){let pct=Number($('lipidPercent').value);for(const [p,vals] of LR){if(p!==pct)continue;HEADS.forEach((h,i)=>{if(vals[h]){root.append(card(LONG[i],vals[h]+' mg',p,lvl(p)[1]));found++;}})}EXTRA.forEach(x=>{x.v.forEach((p,i)=>{if(p===pct){root.append(card(x.n,['Monoterapia','+ estatina moderada','+ estatina alta','+ estatina alta y ezetimiba','+ estatina alta, ezetimiba y ácido bempedoico'][i],p,lvl(p)[1]));found++;}})});
 }else{let id=Number($('lipidDrug').value);if(id<HEADS.length){let h=HEADS[id];LR.forEach(([pct,vals])=>{if(vals[h]){root.append(card(LONG[id],vals[h]+' mg',pct,lvl(pct)[1]));found++}})}else{let x=EXTRA[id-HEADS.length];if(x)x.v.forEach((pct,i)=>{root.append(card(x.n,['Monoterapia','+ estatina moderada','+ estatina alta','+ estatina alta y ezetimiba','+ estatina alta, ezetimiba y ácido bempedoico'][i],pct,lvl(pct)[1]));found++})}}
 if(!found)root.textContent='No hay tratamientos tabulados para esta selección.';
}
function openHash(){let id=decodeURIComponent(location.hash.slice(1));if(!id)return;let el=$(id);if(el&&el.matches('details.drug-group'))el.open=true;}
function init(){
 selFill('opFrom',OPIOIDS);selFill('opTo',OPIOIDS);selFill('bzFrom',BENZOS);selFill('bzTo',BENZOS);selFill('gcDrug',GLUCO);selFill('gcTo',GLUCO);
 $('opFrom').value='morfina_po';$('opTo').value='morfina_iv';$('bzFrom').value='lorazepam';$('bzTo').value='diazepam';$('gcDrug').value='prednisona';$('gcTo').value='metilprednisolona';
 setupTables();
 for(const id of ['opFrom','opTo','opDose','opPatch','tdCustom'])$(id).addEventListener(['opDose','tdCustom'].includes(id)?'input':'change',renderOp);
 for(const id of ['bzFrom','bzTo','bzDose'])$(id).addEventListener(id==='bzDose'?'input':'change',renderBz);
 for(const id of ['gcDrug','gcTo','gcDose'])$(id).addEventListener(id==='gcDose'?'input':'change',renderSteroid);
 $('opAdd').onclick=()=>createDrugRow('op');$('bzAdd').onclick=()=>createDrugRow('bz');
 for(let type of ['op','bz']){$(type+'Reset').onclick=()=>{$(type+'Rows').replaceChildren();createDrugRow(type)};}
 document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copySummary(b.dataset.copy,b));
 for(let id of ['raasInd','bbInd','caInd'])$(id).addEventListener('change',renderIndTables);
 document.querySelectorAll('[data-lview]').forEach(x=>x.onclick=()=>setView(x.dataset.lview));document.querySelectorAll('[data-lmode]').forEach(x=>x.onclick=()=>setLipidMode(x.dataset.lmode));
 $('lipidPercent').addEventListener('change',renderCards);$('lipidDrug').addEventListener('change',renderCards);
 createDrugRow('op');createDrugRow('bz');renderOp();renderBz();renderSteroid();renderIndTables();prepLipid();openHash();window.addEventListener('hashchange',openHash);
}
document.addEventListener('DOMContentLoaded',init);
