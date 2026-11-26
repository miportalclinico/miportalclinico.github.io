'use strict';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin||r.mode!=='navigate')return;
 const name=u.pathname.split('/').pop();if(['acceso.html','perfiles.html','expedientes.html','editor_ia_local.html'].includes(name)||u.search||u.hash)return;
 e.respondWith(fetch(r,{cache:'no-store'}).catch(()=>new Response('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sin conexión</title><body style="font:16px system-ui;max-width:480px;margin:50px auto;padding:20px"><h1>MI Portal Clínico</h1><p>No hay conexión. Para evitar consultar información clínica desactualizada, conecta a Internet y vuelve a abrir el portal.</p><button onclick="location.reload()">Reintentar</button></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
});
