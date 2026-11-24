/* Motor de coincidencias DOCUMENTALES v0.5. No es un detector clínico validado.
   Cruce exclusivamente local. Nunca convierte borradores en alertas asistenciales. */
'use strict';
(function(root){
const seed=root.PCInteractionSeed||{medicamentos:[],reglas:[],combinaciones:[]};
const clean=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const normAlias=x=>clean(x).replace(/[^a-z0-9\/ ]/g,' ').replace(/\s+/g,' ').trim();
const catalogue=new Map();
const aliases=[];
for(const drug of seed.medicamentos){
 const id=clean(drug.id);catalogue.set(id,drug);
 const names=[drug.id,drug.nombre,...(drug.alias||[])];
 for(const name of names){if(!name||name.trim().length<3)continue;aliases.push({alias:normAlias(name),id});}
}
aliases.sort((a,b)=>b.alias.length-a.alias.length);
const combos=seed.combinaciones.map(c=>({id:clean(c.id),marca:c.marca,aliases:[c.marca,...(c.alias||[])].map(normAlias),components:c.componentes.map(clean)}));
// Sólo reconocemos nombres en el comienzo de cada ficha, nunca subcadenas arbitrarias.
function startsAs(text,term){return text===term||(text.startsWith(term)&&/^[ \(\[0-9\/.,;:-]/.test(text.slice(term.length)));}
function findCombo(item){const raw=normAlias(item.rawName||item.name||'');const key=normAlias(item.drugKey||'');
 return combos.find(c=>c.aliases.some(a=>a&&startsAs(raw,a))||c.components.join('/')===key)||null;
}
function ingredientsFor(item){if(item.kind!=='drug')return {ingredientIds:[],combo:null,uncertain:true};
 const combo=findCombo(item);
 if(combo)return {ingredientIds:combo.components.filter(id=>catalogue.has(id)),combo:combo.id,uncertain:false};
 const k=normAlias(item.drugKey||'');
 let id=Array.from(catalogue.keys()).find(i=>normAlias(i)===k);
 if(!id){const raw=normAlias(item.rawName||'');const found=aliases.find(x=>startsAs(raw,x.alias));if(found)id=found.id;}
 // Las combinaciones no verificadas no se expanden por coincidencia de palabras.
 return {ingredientIds:id?[id]:[],combo:null,uncertain:!id};
}
function entriesFor(items){return items.filter(i=>i.kind==='drug').map(item=>({item, ...ingredientsFor(item)}));}
const indices=new Map();
for(const rule of seed.reglas){
 if(!Array.isArray(rule.principios_activos)||rule.principios_activos.length!==2)continue;
 const key=rule.principios_activos.map(clean).sort().join('||');
 if(!indices.has(key))indices.set(key,[]);
 indices.get(key).push(rule);
}
const priority={contraindicacion:0,interaccion_clinicamente_relevante:1,precaucion_monitorizacion:2,informacion:3};
const labels={contraindicacion:'Contraindicación',interaccion_clinicamente_relevante:'Interacción clínicamente relevante',precaucion_monitorizacion:'Precaución / monitorización',informacion:'Información'};
function routeOf(item){return clean(item.route||'');}
function evaluateConditions(rule,a,b){
 const condition=rule.condiciones_para_alerta||{};
 const [i1,i2]=rule.principios_activos.map(clean);
 const pairs=[{ingredient:i1,from:a},{ingredient:i2,from:b}];
 const byIngredient=(name)=>pairs.find(p=>p.ingredient===name)?.from;
 const flags=[];
 const regimen=condition.regimen_fuente_obligatorio;
 if(regimen){
  // Una ficha de Symtuza NO autoriza ninguna extrapolación a Genvoya o a cobicistat aislado.
  const cob=byIngredient('cobicistat');
  if(!cob||cob.combo!==clean(regimen))return {decision:'out_of_scope',reason:'Se exige régimen comercial '+regimen+'. No extrapolar a otros.'};
 }
 if(condition.via_rilpivirina){
  const rp=byIngredient('rilpivirina');
  const r=routeOf(rp?.item);
  if(r==='im'||r==='sc'||r==='iv')return{decision:'out_of_scope',reason:'Formulación de rilpivirina no oral'};
  if(!rp?.combo&&!['vo','oral','po'].includes(r))flags.push('Confirmar que rilpivirina es oral, no inyectable');
 }
 if(condition.via_dexametasona){const dx=byIngredient('dexametasona');
  const rt=routeOf(dx?.item);if(['in','top','of','td'].includes(rt))return {decision:'out_of_scope',reason:'No corresponde a la vía sistémica de la ficha'};
  if(!['vo','iv','im','sc'].includes(rt))flags.push('Confirmar vía sistémica de dexametasona');
 }
 if(condition.dosis_unica_excluida)flags.push('Confirmar que la dexametasona no es una dosis única');
 if(condition.requiere_valoracion_resistencia)flags.push('Verificar resistencia, régimen TAR y ajuste específico');
 if(rule.requiere_validacion_de_condiciones)flags.push('Condiciones de la ficha técnica pendientes de comprobación clínica');
 if(rule.origen_regimen_consultado&&!regimen){
  const regimenId=clean(rule.origen_regimen_consultado);
  if(![a.combo,b.combo].includes(regimenId))flags.push('La fuente corresponde a '+regimenId+'; confirmar extrapolabilidad');
 }
 // Nunca indicamos «verificada» para reglas que no han superado segunda validación.
 return {decision:flags.length?'conditional':'documented',reason:flags.join('. ')};
}
function analyze(items){
 const entries=entriesFor(items);
 const matched=[];const withheld=[];const used=new Set();
 for(let aIndex=0;aIndex<entries.length;aIndex++)for(let bIndex=aIndex+1;bIndex<entries.length;bIndex++){
  const a=entries[aIndex],b=entries[bIndex];
  for(const first of a.ingredientIds)for(const second of b.ingredientIds){
   const key=[first,second].sort().join('||');
   for(const rule of indices.get(key)||[]){
    const signature=[rule.id,a.item.id,b.item.id].join('|');if(used.has(signature))continue;used.add(signature);
    const firstEntry=clean(rule.principios_activos[0])===first?a:b;
    const secondEntry=clean(rule.principios_activos[1])===second?b:a;
    const cond=evaluateConditions(rule,firstEntry,secondEntry);
    const record={rule,medications:[a.item,b.item],ingredients:[first,second],decision:cond.decision,needs:cond.reason};
    if(cond.decision==='out_of_scope')withheld.push(record);else matched.push(record);
   }
  }
 }
 matched.sort((x,y)=>(priority[x.rule.categoria]??10)-(priority[y.rule.categoria]??10)||x.rule.id.localeCompare(y.rule.id));
 const unknown=entries.filter(x=>!x.ingredientIds.length).map(x=>x.item);
 const combosIdentified=entries.filter(x=>x.combo).map(x=>({name:x.item.rawName,combo:x.combo,components:x.ingredientIds}));
 return {matched,withheld,unknown,combosIdentified,recognized:entries.length-unknown.length,total:entries.length,baseRules:seed.reglas.length,baseDrugs:seed.medicamentos.length};
}
const api={analyze,ingredientsFor,entriesFor,labels,priority,version:'0.5.0'};
root.DocumentalInteractionEngine=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
