/* Portal Clínico · Analizador independiente de tratamientos · prototipo v60.
   Análisis LOCAL. Catálogo parcial de reconocimiento; NO verificador integral ni base CIMA completa. */
'use strict';
(function(root){
const GROUPS=[['hta','HTA'],['dlp','Dislipemia'],['dm','Diabetes mellitus'],['inmuno','Inmunosupresión'],['neuro','Neurología'],['psiq','Psiquiatría'],['hormonal','Endocrinología y hormonal'],['resp','Respiratorio'],['cardio','Cardiología'],['hema','Hematología'],['reuma','Reumatología y metabolismo óseo'],['digestivo','Digestivo'],['nefro','Nefrología y urología'],['antimicro','Antiinfecciosos'],['analgesia','Analgesia'],['vitaminas','Vitaminas y suplementos'],['otros','Otros'],['inyectables','Otros inyectables'],['parches','Parches'],['inhaladores','Inhaladores'],['oftalmo','Colirios y oftálmicos'],['topicos','Otros tópicos']];
const meds=[];
function add(name,group,aliases=[],family=''){meds.push({name,group,family,aliases:[name,...aliases]});}
// Catálogo de reconocimiento INICIAL, no catálogo completo CIMA ni vademécum validado.
add('Paracetamol','analgesia',['gelocatil','termalgin'],'analgesico');add('Ibuprofeno','analgesia',['espidifen','neobrufen'],'aine');add('Naproxeno','analgesia',['naprosyn','antalgín'],'aine');add('Dexketoprofeno','analgesia',['enantyum'],'aine');add('Metamizol','analgesia',['nolotil'],'analgesico');add('Tramadol','analgesia',['adolonta'],'opioide');add('Morfina','analgesia',['sevredol','mst continus'],'opioide');add('Fentanilo','parches',['durogesic'],'opioide');
add('Candesartán','hta',['atacand','parapres'],'ara2');add('Enalapril','hta',['renitec'],'ieca');add('Ramipril','hta',['acovil'],'ieca');add('Lisinopril','hta',[],'ieca');add('Losartán','hta',['cozaar'],'ara2');add('Valsartán','hta',['diovan'],'ara2');add('Olmesartán','hta',['olmetec'],'ara2');add('Irbesartán','hta',['aprovel'],'ara2');add('Amlodipino','hta',['norvas'],'calcioantagonista');add('Lercanidipino','hta',['zanidip'],'calcioantagonista');add('Nifedipino','hta',['adalat'],'calcioantagonista');add('Doxazosina','hta',['carduran'],'alfa_bloqueante');
add('Atorvastatina','dlp',['prevencor','zarator'],'estatina');add('Rosuvastatina','dlp',['crestor'],'estatina');add('Simvastatina','dlp',['zocor'],'estatina');add('Ezetimiba','dlp',['ezetrol'],'hipolipemiante');add('Fenofibrato','dlp',['secalip'],'hipolipemiante');
add('Metformina','dm',['dianben'],'biguanida');add('Sitagliptina','dm',['januvia','tesavel','xelevia'],'idpp4');add('Linagliptina','dm',['trajenta'],'idpp4');add('Empagliflozina','dm',['jardiance'],'isglt2');add('Dapagliflozina','dm',['forxiga','edistride'],'isglt2');add('Gliclazida','dm',['diamicron'],'sulfonilurea');add('Semaglutida','dm',['ozempic','rybelsus'],'ar_glp1');add('Dulaglutida','dm',['trulicity'],'ar_glp1');add('Liraglutida','dm',['victoza'],'ar_glp1');add('Insulina glargina','dm',['lantus','toujeo','abasaglar'],'insulina');add('Insulina degludec','dm',['tresiba'],'insulina');add('Insulina aspart','dm',['novorapid','fiasp'],'insulina');add('Insulina lispro','dm',['humalog'],'insulina');
add('Prednisona','inmuno',['dacortin'],'corticoide');add('Metilprednisolona','inmuno',['urbason'],'corticoide');add('Metotrexato','inmuno',['metoject'],'inmunosupresor');add('Azatioprina','inmuno',['imurel'],'inmunosupresor');add('Micofenolato','inmuno',['cellcept','myfortic'],'inmunosupresor');add('Tacrolimus','inmuno',['prograf','advagraf'],'inmunosupresor');add('Ciclosporina','inmuno',['sandimmun'],'inmunosupresor');
add('Levetiracetam','neuro',['keppra'],'antiepileptico');add('Pregabalina','neuro',['lyrica'],'antiepileptico');add('Gabapentina','neuro',['neurontin'],'antiepileptico');add('Carbidopa/levodopa','neuro',['sinemet'],'antiparkinsoniano');add('Donepezilo','neuro',['aricept'],'anti_demencia');
add('Sertralina','psiq',['besitran'],'isrs');add('Trazodona','psiq',['deprax'],'antidepresivo_serotoninergico');add('Escitalopram','psiq',['cipralex'],'isrs');add('Citalopram','psiq',['prisdal'],'isrs');add('Fluoxetina','psiq',['prozac'],'isrs');add('Paroxetina','psiq',['seroxat'],'isrs');add('Mirtazapina','psiq',['remeron'],'antidepresivo');add('Duloxetina','psiq',['cymbalta'],'irsn');add('Venlafaxina','psiq',['vandral'],'irsn');add('Amitriptilina','psiq',['tryptizol'],'triciclico');add('Lorazepam','psiq',['orfidal'],'benzodiazepina');add('Diazepam','psiq',['valium'],'benzodiazepina');add('Alprazolam','psiq',['trankimazin'],'benzodiazepina');add('Quetiapina','psiq',['seroquel'],'antipsicotico');add('Olanzapina','psiq',['zyprexa'],'antipsicotico');
add('Levotiroxina','hormonal',['eutirox'],'hormona_tiroidea');add('Tiamazol','hormonal',['tirodril'],'antitiroideo');
add('Torasemida','cardio',['sutril'],'diuretico_asa');add('Furosemida','cardio',['seguril'],'diuretico_asa');add('Espironolactona','cardio',['aldactone'],'antialdosteronico');add('Eplerenona','cardio',['inspra'],'antialdosteronico');add('Bisoprolol','cardio',['emconcor'],'beta_bloqueante');add('Carvedilol','cardio',['coropres'],'beta_bloqueante');add('Metoprolol','cardio',['lopresor'],'beta_bloqueante');add('Amiodarona','cardio',['trangorex'],'antiarritmico');add('Digoxina','cardio',['lanacordin'],'digitalico');add('Sacubitrilo/valsartán','cardio',['entresto'],'arni');
add('Acenocumarol','hema',['sintrom'],'avk');add('Warfarina','hema',['aldocumar'],'avk');add('Apixabán','hema',['eliquis'],'acod');add('Rivaroxabán','hema',['xarelto'],'acod');add('Dabigatrán','hema',['pradaxa'],'acod');add('Edoxabán','hema',['lixiana'],'acod');add('Ácido acetilsalicílico','hema',['adiro','aas'],'antiagregante');add('Clopidogrel','hema',['plavix','iscover'],'antiagregante');add('Prasugrel','hema',['efient'],'antiagregante');add('Ticagrelor','hema',['brilique'],'antiagregante');add('Enoxaparina','hema',['clexane'],'heparina');add('Hierro','hema',['tardyferon','ferrogradumet'],'suplemento_hierro');
add('Alopurinol','reuma',['zyloric'],'antigotoso');add('Colchicina','reuma',['colchimax'],'antigotoso');add('Alendronato','reuma',['fosamax'],'antirresortivo');
add('Omeprazol','digestivo',['losec'],'ibp');add('Pantoprazol','digestivo',['pantecta'],'ibp');add('Esomeprazol','digestivo',['nexium'],'ibp');add('Lansoprazol','digestivo',['opiren'],'ibp');add('Lactulosa','digestivo',['duphalac'],'laxante');add('Macrogol','digestivo',['movicol','casenlax'],'laxante');add('Metoclopramida','digestivo',['primperan'],'antiemetico');
add('Tamsulosina','nefro',['omnic'],'urologico');add('Finasterida','nefro',['proscar'],'urologico');add('Sevelámero','nefro',['renvela'],'quelante_fosforo');
add('Cefixima','antimicro',['denvar'],'cefalosporina');add('Amoxicilina','antimicro',['clamoxyl'],'penicilina');add('Amoxicilina/ácido clavulánico','antimicro',['augmentine'],'penicilina');add('Ciprofloxacino','antimicro',['baycip'],'quinolona');add('Levofloxacino','antimicro',['tavanic'],'quinolona');add('Azitromicina','antimicro',['zithromax'],'macrolido');add('Doxiciclina','antimicro',['vibracina'],'tetraciclina');add('Cotrimoxazol','antimicro',['septra','septrin'],'antimicrobiano');add('Fluconazol','antimicro',['diflucan'],'antifungico');
add('Budesonida/formoterol','inhaladores',['symbicort'],'inhalador');add('Umeclidinio/vilanterol','inhaladores',['anoro ellipta','anoro'],'inhalador');add('Fluticasona/vilanterol','inhaladores',['relvar ellipta'],'inhalador');add('Salbutamol','inhaladores',['ventolin'],'inhalador');add('Tiotropio','inhaladores',['spiriva'],'inhalador');
add('Colecalciferol','vitaminas',['hidroferol d3'],'vitamina');add('Ácido fólico','vitaminas',['acfol'],'vitamina');add('Cianocobalamina','vitaminas',['optovite'],'vitamina');

add('Montelukast','resp',['singulair'],'antileucotrieno');add('Roflumilast','resp',['daxas'],'respiratorio');add('Budesonida','inhaladores',['pulmicort'],'inhalador');add('Salbutamol/ipratropio','inhaladores',['combivent'],'inhalador');

const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const keys=meds.flatMap(d=>d.aliases.map(alias=>({key:normal(alias),alias,drug:d}))).sort((a,b)=>b.key.length-a.key.length);
const routeNames={VO:'Oral',IN:'Inhalatoria',IV:'Intravenosa',IM:'Intramuscular',SC:'Subcutánea',SL:'Sublingual',TD:'Transdérmica',TOP:'Tópica',OF:'Oftálmica',OV:'Otra/no especificada'};
const specialBrands={'deprax':'Deprax','sintrom':'Sintrom','anoro ellipta':'Anoro Ellipta','eutirox':'Eutirox','emconcor':'Emconcor','symbicort':'Symbicort','seguril':'Seguril','renitec':'Renitec','januvia':'Januvia','lantus':'Lantus','forxiga':'Forxiga','jardiance':'Jardiance','eliquis':'Eliquis','xarelto':'Xarelto','clexane':'Clexane','aldactone':'Aldactone','spiriva':'Spiriva'};
function lookup(raw){const n=normal(raw);for(const x of keys){if(n===x.key||(n.startsWith(x.key)&&/^[\s(.,;-]/.test(n.slice(x.key.length)))){return {drug:x.drug,brand:normal(x.alias)===normal(x.drug.name)?'':(specialBrands[x.key]||x.alias.split(' ').map(v=>v.charAt(0).toUpperCase()+v.slice(1).toLowerCase()).join(' '))};}}return null;}
function kindOf(name){const n=normal(name);if(/espesante|modulos espesantes|nutrisens|vegenat|suplemento nutricional|nutricion enteral|batido hiperproteico/.test(n))return 'nutrition';if(/absorb|bsorb inc|aposit|bolsas? recog|colector|camara (?:de )?inhal|medias? de compres|vendaje|panal|sonda|funda de orina|empapador|guantes? |baston|ortesis/.test(n))return 'device';return 'drug';}
function tidyOther(name,kind){const n=normal(name);if(kind==='nutrition')return /nutrisens/.test(n)?'Espesante Nutrisens':/vegenat/.test(n)?'Espesante Vegenat':'Espesante / producto nutricional';if(/absorb|bsorb/.test(n))return 'Absorbentes de incontinencia';if(/aposit/.test(n))return /allevyn/.test(n)?'Apósito Allevyn Gentle Border Lite':'Apósito';if(/colector/.test(n))return 'Colector urinario'+(/conveen/.test(n)?' Conveen Optima':'');if(/bolsas? recog/.test(n))return 'Bolsas de recogida de orina';if(/camara/.test(n))return 'Cámara de inhalación';if(/medias?/.test(n))return 'Medias de compresión';return name.trim().slice(0,95);}
function dataRisk(text){return /\b(?:DNI|CIP|NSS|NHC|NIF|NIE|Paciente|Apellidos?|Domicilio|N[úu]mero de historia|Historia cl[íi]nica|Tel[ée]fono)\s*:/i.test(text)||/\b[A-Z]{0,2}\d{7,8}[A-Z]\b/i.test(text);}
function cleanName(x){let s=String(x||'').replace(/@0L@/gi,' ').replace(/[\t\r\n]+/g,' ').trim().replace(/\s+/g,' ');if(s.startsWith('(')&&s.endsWith(')')){let depth=0,valid=true;for(let i=0;i<s.length;i++){if(s[i]==='(')depth++;if(s[i]===')'){depth--;if(depth===0&&i!==s.length-1){valid=false;break;}}}if(valid&&depth===0)s=s.slice(1,-1).trim();}return s;}
// La pauta se identifica por el código de vía, sin depender de tabulaciones ni paréntesis.
const routePattern=/(?<![\p{L}\d])(VO|OV|IN|IV|IM|SC|SL|TD|TOP|OF)\s*,\s*([<>]?\s*\d+(?:[.,]\d+)?\s*(?:C\s*\/\s*U|COMPRIMIDOS?|COMP\.?|INHALACIONES?|UNIDADES?|MCG|µG|MG|ML|UI|G|U))\s*,\s*(C\s*\d+\s*H\b|BISEMANAL\b|C\s*\d+\s*D\b|A\s*DEMANDA\b|S\s*\/\s*P\b|PRN\b|(?:LUNES|MARTES|MI[EÉ]RCOLES|JUEVES|VIERNES|S[AÁ]BADO|DOMINGO)\b)/giu;
function extractEntries(text){const s=String(text||'').replace(/\u00a0/g,' ');const matches=[...s.matchAll(routePattern)];if(!matches.length){return s.split(/\r?\n/).map(l=>l.trim()).filter(x=>x&&!/^@0L@$/.test(x)).map(name=>({name:cleanName(name),pauta:null}));}let cursor=0;const out=[];for(const m of matches){const chunk=s.slice(cursor,m.index);let name=cleanName(chunk);if(name){out.push({name,pauta:{route:m[1].toUpperCase(),dose:m[2],frequency:m[3]},rawPauta:m[0].trim()});}else{out.push({name:'Pauta sin medicamento identificado',pauta:{route:m[1].toUpperCase(),dose:m[2],frequency:m[3]},rawPauta:m[0].trim()});}cursor=m.index+m[0].length;}
 const leftover=cleanName(s.slice(cursor));if(leftover)for(const line of leftover.split(/\n+/)){if(line.trim())out.push({name:line.trim(),pauta:null});}
 return out;}
function fmtDose(s){return String(s||'').trim().replace(/\s+/g,' ').replace(/\bMCG\b/gi,'µg').replace(/\bMG\b/gi,'mg').replace(/\bUI\b/gi,'UI').replace(/\bML\b/gi,'mL').replace(/\bG\b/gi,'g').replace(/\bC\s*\/\s*U\b/gi,'unidad');}
function unitNumber(s){const m=String(s||'').trim().match(/^([<>]?\s*\d+(?:[.,]\d+)?)\s*(mg|µg|mcg|g|mL|UI|unidad|C\s*\/\s*U)\b/i);return m?{value:Number(m[1].replace(',','.')),unit:normal(m[2]).replace('mcg','µg').replace('c/u','unidad')}:null;}
function strengthFromName(name){const a=name.match(/(\d+(?:[.,]\d+)?)\s*(MCG|µG|MG|G|UI)\s*\/\s*(\d+(?:[.,]\d+)?)\s*(MCG|µG|MG|G|UI)/i);if(a)return `${a[1].replace(',','.')}/${a[3].replace(',','.')} ${a[2].toUpperCase()==='MCG'?'µg':a[2].toLowerCase()}`;const m=name.match(/(\d+(?:[.,]\d+)?)\s*(MCG|µG|MG|G|UI)\b/i);return m?`${m[1].replace(',','.')} ${m[2].toUpperCase()==='MCG'?'µg':m[2].toLowerCase()}`:'';}
function normalizeInterval(f){const t=String(f||'').trim().toUpperCase();const m=t.match(/^C\s*(\d+)\s*H$/);if(m)return {interval:m[1],other:'',frequency:`cada ${m[1]} h`};if(/BISEMANAL/.test(t))return {interval:'other',other:'bisemanal',frequency:'bisemanal'};if(/DEMANDA|PRN|S\s*\/\s*P/.test(t))return {interval:'other',other:'a demanda',frequency:'a demanda'};if(t)return{interval:'other',other:t.toLowerCase(),frequency:t.toLowerCase()};return{interval:'',other:'',frequency:''};}
function getFrequency(item){if(item.interval==='other')return String(item.otherInterval||'').trim();if(item.interval)return `cada ${item.interval} h`;return'';}
function isPrn(item){return /\b(?:a demanda|si precisa|prn|s\s*\/\s*p)\b/i.test(getFrequency(item));}
const usual={
 'Paracetamol':['500 mg','650 mg','1 g'],'Candesartán':['4 mg','8 mg','16 mg','32 mg'],'Lercanidipino':['10 mg','20 mg'],'Sitagliptina':['25 mg','50 mg','100 mg'],'Trazodona':['50 mg','100 mg','150 mg'],'Sertralina':['50 mg','100 mg'],'Torasemida':['5 mg','10 mg','20 mg'],'Acenocumarol':['1 mg','4 mg'],'Omeprazol':['10 mg','20 mg','40 mg'],'Cefixima':['200 mg','400 mg'],'Umeclidinio/vilanterol':['55/22 µg'],'Enalapril':['5 mg','10 mg','20 mg'],'Atorvastatina':['10 mg','20 mg','40 mg','80 mg'],'Furosemida':['40 mg'],'Apixabán':['2.5 mg','5 mg'],'Ibuprofeno':['400 mg','600 mg'],'Bisoprolol':['2.5 mg','5 mg','10 mg'],'Espironolactona':['25 mg','100 mg'],'Metformina':['850 mg','1000 mg'],'Levotiroxina':['25 µg','50 µg','75 µg','100 µg','125 µg','150 µg'],'Lorazepam':['1 mg','2.5 mg'],'Amoxicilina':['500 mg','875 mg'],'Clopidogrel':['75 mg']};
function optionsFor(item){const val=[...(usual[item.drugKey]||[]),...(item.remoteStrengths||[])];if(item.strength&&!val.includes(item.strength))val.unshift(item.strength);return [...new Set(val)];}
function buildItem(entry,i){const rawName=entry.name;const kind=kindOf(rawName);const found=kind==='drug'?lookup(rawName):null;const d=found?.drug;const route=entry.pauta?.route||'';const dose=entry.pauta?fmtDose(entry.pauta.dose):'';const fi=normalizeInterval(entry.pauta?.frequency);const item={id:'med-'+i,kind,rawName,rawPauta:entry.rawPauta||'',drugKey:d?.name||'',brand:found?.brand||'',name:d?.name||(kind==='drug'?rawName:tidyOther(rawName,kind)),group:d?.group||'otros',family:d?.family||'',strength:kind==='drug'?strengthFromName(rawName):'',dose,route,interval:fi.interval,otherInterval:fi.other,sourceIndex:i,excluded:false,confirmed:false,manualOrder:null,schedule:null,extraSlot:'noche',avkText:'',verified48:'',timeSlots:null,slotTouched:false,slotAmounts:[0,0,0,0,0],amountEdited:false,irregular:{mode:"days",days:[0,1,2,3,4,5,6],text:""}};return item;}
function parse(text){if(dataRisk(text))return {blocked:true,items:[],format:''};const input=String(text||'').trim();if(!input)return{blocked:false,items:[],format:''};const format=/@0L@/i.test(input)?'D':/^\s*\(/.test(input)?'A':/\b(?:VO|IN|OV|IV|IM|SC|OF|TD|TOP)\s*,/i.test(input)?'C / mixto':'B (sin pauta)';return {blocked:false,items:extractEntries(input).map(buildItem),format};}
function warnings(item){if(item.kind!=='drug')return [];const notes=[];if(!item.drugKey)notes.push('Medicamento no reconocido: confirmar nombre/principio activo.');if(!item.dose||!getFrequency(item))notes.push('No se ha recuperado una dosis o pauta completa; no inferirla del envase.');if(item.interval==='48'&&!item.verified48)notes.push('Frecuencia cada 48 h: confirmar si corresponde a media unidad diaria o a días alternos.');if(['Acenocumarol','Warfarina'].includes(item.drugKey)&&!item.avkText.trim())notes.push('AVK: la concentración del comprimido no equivale a una pauta diaria; confirmar pauta individual.');if(item.group==='antimicro'&&!/(?:\d+\s*d[ií]as|hasta|fecha fin|fin tratamiento)/i.test(item.rawPauta+' '+item.avkText))notes.push('Antiinfeccioso: duración o fecha de finalización no disponible.');return notes;}
function status(item){if(item.kind!=='drug')return 'ok';if(!item.drugKey)return 'unknown';return warnings(item).length?'review':'ok';}
function displayName(item){if(!item.brand)return item.name;const gen=item.drugKey||item.name;return `${item.brand} (${gen.charAt(0).toLowerCase()+gen.slice(1)})`;}
function isAvk(item){return ['Acenocumarol','Warfarina'].includes(item.drugKey);}
function isInhaler(item){return item.group==='inhaladores'||item.route==='IN';}
function labelDose(item){if(isInhaler(item)&&/^(?:1|1[.,]0)\s*(?:unidad|C\s*\/\s*U)$/i.test(item.dose))return '1 inhalación';if(isInhaler(item)&&/\bunidad\b/i.test(item.dose))return item.dose.replace(/unidad/i,'inhalación');return item.dose;}
function baseText(item){const title=displayName(item);const strength=item.strength||(isAvk(item)?item.dose:'');return title+(strength?' '+strength:'');}
function unitsPerDose(item){const d=unitNumber(item.dose),s=unitNumber(item.strength);if(d&&d.unit==='unidad')return d.value;if(!d||!s||d.unit!==s.unit||!Number.isFinite(s.value)||s.value<=0)return null;const q=d.value/s.value;return Number.isFinite(q)&&q>0&&q<=8?Number(q.toFixed(3)):null;}
function suggestedSchedule(item){if(isAvk(item)||isPrn(item))return null;const n=unitsPerDose(item);if(n===null)return null;const q=item.interval;if(q==='12')return [n,0,n];if(q==='8')return [n,n,n];if(q==='6')return [n,n,n,n];return null;}
// Las cinco franjas se guardan por unidades, en el orden real del día.
const TIME_SLOTS=['desayuno','comida','merienda','cena','antes de dormir'];
const DAYS=['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
function effectiveDose(item){
 const n=unitsPerDose(item);
 return item.interval==='48'&&item.verified48==='half'?(n===1?0.5:null):n;
}
function chosenAmounts(item){
 return Array.isArray(item.slotAmounts)?item.slotAmounts.slice(0,5).map(n=>Number.isFinite(n)&&n>0?n:0):[0,0,0,0,0];
}
function selectedNames(item){return TIME_SLOTS.filter((_,i)=>chosenAmounts(item)[i]>0);}
function numberString(n){return String(Number(n.toFixed(3)));}
function unitName(item,n){
 if(isInhaler(item))return n===1?'inhalación':'inhalaciones';
 if(/c[aá]psul/i.test(item.rawName))return n===1?'cápsula':'cápsulas';
 if(/comprimi|\bcomp\.?\b|tableta|\btab\b/i.test(item.rawName))return n===1?'comprimido':'comprimidos';
 return n===1?'unidad':'unidades';
}
function slotText(item,i,n){
 const when=TIME_SLOTS[i]==='antes de dormir'?'antes de dormir':`en ${TIME_SLOTS[i]==='desayuno'?'el':'la'} ${TIME_SLOTS[i]}`;
 return `${numberString(n)} ${unitName(item,n)} ${when}`;
}
function joinWords(words){return words.length<=1?(words[0]||''):words.length===2?words.join(' y '):words.slice(0,-1).join(', ')+' y '+words.at(-1);}
function scheduleInfo(item){
 if(isPrn(item)||isAvk(item)&&!item.irregular?.text?.trim())return null;
 const values=chosenAmounts(item),active=values.some(x=>x>0);
 if(!active)return null;
 let compact=null,legend='';
 const [des,com,mer,cena,dorm]=values;
 if(mer&&dorm){compact=null;}
 else if(mer){compact=[des,com,mer,cena].map(numberString).join('-');legend='desayuno-comida-merienda-cena';}
 else if(dorm){compact=[des,com,cena,dorm].map(numberString).join('-');legend='desayuno-comida-cena-antes de dormir';}
 else compact=[des,com,cena].map(numberString).join('-');
 return {values,active,compact,legend,patient:joinWords(values.map((n,i)=>n>0?slotText(item,i,n):null).filter(Boolean))};
}
function weeklyData(item){
 const w=item.irregular;
 if(!w)return null;
 if(w.mode==='text')return w.text?.trim()?{mode:'text',text:w.text.trim()}:null;
 if(w.mode==='days'&&Array.isArray(w.days)&&w.days.length>0&&w.days.length<7)
  return {mode:'days',days:w.days.slice().sort((a,b)=>a-b)};
 return null;
}
function weeklySuffix(w){return 'los '+joinWords(w.days.map(i=>DAYS[i]));}
function normalizedDoseText(item){const d=labelDose(item);if(!d)return '';if(item.strength&&normal(d)===normal(item.strength))return '';return d;}
function literalPauta(item){
 if(item.verified48==='half')return '0.5 comprimido cada 24 h';
 if(item.verified48==='alternate')return (normalizedDoseText(item)?normalizedDoseText(item)+' ':'')+'cada 48 h';
 const freq=getFrequency(item),d=normalizedDoseText(item);
 if(isInhaler(item))return [labelDose(item)||'dosis no especificada',freq].filter(Boolean).join(' ');
 return [d,freq].filter(Boolean).join(' ');
}
function formatted(item,mode='literal'){
 const base=baseText(item);
 const output=x=>base+': '+x;
 const fallback=()=>output(isAvk(item)?(item.avkText?.trim()||'según pauta individual (no disponible)'):(literalPauta(item)||'pauta no disponible'));
 const weekly=weeklyData(item);
 if(weekly?.mode==='text')return output(weekly.text);
 const data=scheduleInfo(item);
 if(weekly?.mode==='days'){
  if(!data)return output('pauta semanal '+weeklySuffix(weekly)+'; dosis/momento pendiente de confirmar');
  const text=mode==='compact'?(data.compact?data.compact+(data.legend?' ('+data.legend+')':''):data.patient):data.patient;
  return output(text+' ('+weeklySuffix(weekly)+')');
 }
 if(mode==='literal'){
  // Los horarios de comida nunca se añaden entre paréntesis a «cada X horas».
  // Si se cambia explícitamente el número de comprimidos, no ocultar un 2-0-1 bajo un «cada 12 h».
  if(item.amountEdited&&data){
   return output(data.compact?(data.compact+(data.legend?' ('+data.legend+')':'')):data.patient);
  }
  return fallback();
 }
 if(!data)return fallback();
 if(mode==='compact')return output(data.compact?(data.compact+(data.legend?' ('+data.legend+')':'')):data.patient);
 if(mode==='patient')return output(data.patient);
 return fallback();
}
const groupRank=Object.fromEntries(GROUPS.map(([k],i)=>[k,i]));
function sort(items,mode='group'){const list=items.filter(e=>e.kind==='drug'&&!e.excluded).slice();const cmp=mode==='original'?(a,b)=>a.sourceIndex-b.sourceIndex:mode==='alphabetical'?(a,b)=>displayName(a).localeCompare(displayName(b),'es'):mode==='frequency'?(a,b)=>getFrequency(a).localeCompare(getFrequency(b),'es')||displayName(a).localeCompare(displayName(b),'es'):(a,b)=>(groupRank[a.group]??100)-(groupRank[b.group]??100)||displayName(a).localeCompare(displayName(b),'es');const regular=list.filter(e=>!isPrn(e)).sort(cmp),demand=list.filter(isPrn).sort(cmp);return [...regular,...demand];}
function exportText(ordered,mode='literal'){const normalList=ordered.filter(x=>!isPrn(x));const prn=ordered.filter(isPrn);return [normalList.map(x=>formatted(x,mode)).join('\n'),prn.length?'A DEMANDA\n'+prn.map(x=>formatted(x,mode)).join('\n'):''].filter(Boolean).join('\n\n');}
const interactions=[
 {a:'Acenocumarol',b:'Sertralina',level:'Vigilancia',desc:'Posible aumento del riesgo hemorrágico; revisar sangrado, INR y contexto clínico.'},
 {a:'Sertralina',b:'Trazodona',level:'Vigilancia',desc:'Asociación serotoninérgica; valorar indicación y signos de toxicidad serotoninérgica.'},
 {a:'Candesartán',b:'Espironolactona',level:'Monitorización',desc:'Posible hiperpotasemia y deterioro renal. Controlar potasio y función renal.'},
 {a:'Enalapril',b:'Espironolactona',level:'Monitorización',desc:'Posible hiperpotasemia y deterioro renal. Controlar potasio y función renal.'},
 {a:'Acenocumarol',b:'Ibuprofeno',level:'Importante',desc:'Aumento del riesgo hemorrágico; revisar necesidad de AINE.'},
 {a:'Apixabán',b:'Ibuprofeno',level:'Importante',desc:'Aumento del riesgo hemorrágico por anticoagulante y AINE.'},
 {a:'Rivaroxabán',b:'Ibuprofeno',level:'Importante',desc:'Aumento del riesgo hemorrágico por anticoagulante y AINE.'}
];
function review(items){const drugs=items.filter(x=>x.kind==='drug');const found=new Set(drugs.map(x=>x.drugKey).filter(Boolean));const alerts=interactions.filter(a=>found.has(a.a)&&found.has(a.b));const duplicates=[];const seen=new Set();for(const i of drugs){if(!i.drugKey)continue;if(seen.has(i.drugKey))duplicates.push(`Se repite ${i.drugKey}; revisar si son pautas complementarias.`);seen.add(i.drugKey);}for(const family of ['aine','ieca','ara2','avk','acod','ibp']){const items=drugs.filter(x=>x.family===family);if(new Set(items.map(x=>x.drugKey)).size>1)duplicates.push(`Posible duplicidad de familia (${family}): ${items.map(x=>x.drugKey).join(', ')}.`);}return{alerts,duplicates,unknown:drugs.filter(x=>!x.drugKey).length,recognized:drugs.filter(x=>x.drugKey).length};}
const api={parse,sort,exportText,formatted,review,warnings,status,displayName,getFrequency,optionsFor,unitsPerDose,suggestedSchedule,isAvk,isInhaler,normal,lookup,selectedNames,scheduleInfo,chosenAmounts,weeklyData,unitName,TIME_SLOTS,DAYS,GROUPS,catalogue:meds};root.TreatmentAnalyzer=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
