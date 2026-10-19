/* START TIME — student access and progress sync.
   Everyone signs in once per device with a code from the instructor (students: 2 letters + 8 digits). The code is checked
   against the instructor's Google Sheet (Apps Script), which also limits how many devices may use each code and stores
   progress. The code is checked again every time the deck opens, so a code switched off in the sheet stops working.
   Offline-first: progress always lives on the device and is merged with the saved copy whenever there is a connection. */
(function(){
'use strict';
var ST=window.ST,CFG=ST.CONFIG||{},URL=CFG.syncUrl||'',DECK=CFG.deck||'p1a';
var $=ST.h.$,el=ST.h.el,esc=ST.h.esc;
var DK='st-device';
var timer=null,busy=false,again=false,lastOk=0,state='idle',lastErr='';
function device(){var d='';try{d=localStorage.getItem(DK)||''}catch(e){}
  if(!d){var a=new Uint8Array(12);(window.crypto||{}).getRandomValues?crypto.getRandomValues(a):a.forEach(function(v,i){a[i]=Math.random()*256|0});d=Array.prototype.map.call(a,function(b){return ('0'+b.toString(16)).slice(-2)}).join('');try{localStorage.setItem(DK,d)}catch(e){}}
  return d}
/* a readable name for this device, shown next to it in the sheet's Devices cell: "Android · Chrome", "Windows · Edge app"… */
function devName(){var u=navigator.userAgent||'',tp=navigator.maxTouchPoints||0;
  var os=/Android/.test(u)?'Android':/iPhone/.test(u)?'iPhone':(/iPad/.test(u)||(/Macintosh/.test(u)&&tp>1))?'iPad':/Windows/.test(u)?'Windows':/Mac OS X|Macintosh/.test(u)?'Mac':/CrOS/.test(u)?'Chromebook':/Linux/.test(u)?'Linux':'Device';
  var br=/Edg[A]?\//.test(u)?'Edge':/SamsungBrowser/.test(u)?'Samsung':/OPR\//.test(u)?'Opera':/Firefox|FxiOS/.test(u)?'Firefox':/CriOS|Chrome\//.test(u)?'Chrome':/Safari/.test(u)?'Safari':'Browser';
  var app=false;try{app=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||!!navigator.standalone}catch(e){}
  return os+' · '+br+(app?' app':'')}
function acct(){var s=ST.session();return s&&s.role==='student'&&ST.role==='student'?s:null}
function enabled(){return !!URL}
/* one request to the sheet. "busy" (another write is running) and a lost connection are tried again twice, a little later each time —
   a lost connection only for requests that cannot do anything twice (reading, saving progress, sign-in), never for registering a student */
var ONCE={addStudent:1,setActive:1,setGroup:1,extend:1,resetDevices:1,setReadTime:1};
function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
function post(body,n){
  body.deck=DECK;body.device=device();body.course=CFG.program||'CMA';n=n||0;   // one script for every certificate: the request names its course
  var retry=function(){return wait(1200*(n+1)+Math.random()*900).then(function(){return post(body,n+1)})};
  return fetch(URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow'})
    .then(function(r){if(!r.ok)throw new Error('Server error '+r.status);return r.json()})
    .then(function(res){return res&&res.busy&&n<2?retry():res},
      function(){if(n<2&&!(body.op==='admin'&&ONCE[body.action]))return retry();
        throw new Error(navigator.onLine===false?'No internet connection. Check it and try again.':'No answer from the sheet. Check the internet and try again in a moment.')});
}
function onDeck(){return /^#\/t\//.test(location.hash)}
function refresh(){if(!onDeck()&&ST.route)ST.route()}
function lockOut(msg){ST.setSession(null);ST.progress.replace(ST.progress.blank());try{sessionStorage.setItem('st-gate-msg',msg||'')}catch(e){}location.reload()}
function syncNow(){
  var a=acct();if(!enabled()||!a)return Promise.resolve();
  if(busy){again=true;return Promise.resolve()}
  busy=true;state='syncing';paint();
  return post({op:'sync',code:a.code,data:ST.progress.get(),summary:ST.progress.summary()})
    .then(function(res){
      if(res&&res.profile){a.need=res.need||['name'];ST.setSession(a);location.reload();return}   // details still missing: the form comes first
      if(!res||!res.ok){var er=new Error(res&&res.error||'Sync failed');er.auth=!!(res&&res.auth);throw er}
      ST.progress.replace(ST.progress.merge(ST.progress.get(),res.data));
      var ch=false;if(res.name&&res.name!==a.name){a.name=res.name;ch=true}
      ['email','mobile','confirmBy'].forEach(function(k){if(res[k]!==undefined&&res[k]!==(a[k]||'')){a[k]=res[k];ch=true}});
      var accCh=false;if(res.access&&accSig(res.access)!==accSig(a.access)){a.access=res.access;a.group=res.group||'';ch=true;accCh=true}
      if(res.perms&&sig(res.perms)!==sig(a.perms)){a.perms=res.perms;a.sperms=res.sperms||res.perms;ch=true}
      if(res.readSec&&res.readSec!==a.readSec){a.readSec=res.readSec;ch=true}
      if(res.ui&&uiSig(res.ui)!==uiSig(a.ui)){a.ui=res.ui;a.sui=res.sui||res.ui;ch=true}   // Slide tools rows changed on the Roles sheet: the next slide follows them
      if(ST.shellTake&&ST.shellTake(a,res))ch=true;   // the platform shell: subscription end, devices, courses, contact (shell.js)
      if(ch)ST.setSession(a);
      if(accCh&&ST.applyHidden)ST.applyHidden();
      if(accCh&&ST.route)ST.route();                  // a topic opened or closed: redraw what the student sees
      lastOk=Date.now();state='ok';lastErr='';thanks(res);
    })
    .catch(function(e){state='err';lastErr=(e&&e.message)||'No connection';if(e&&e.auth)lockOut(lastErr)})
    .then(function(){busy=false;paint();refresh();if(again){again=false;schedule(3000)}});
}
function schedule(ms){if(!enabled()||!acct())return;clearTimeout(timer);timer=setTimeout(syncNow,ms);if(state!=='syncing'){state='pending';paint()}}
function beacon(){var a=acct();
  if(!enabled()||!a||state!=='pending'||!navigator.sendBeacon)return;
  try{navigator.sendBeacon(URL,new Blob([JSON.stringify({op:'sync',deck:DECK,device:device(),course:CFG.program||'CMA',code:a.code,data:ST.progress.get(),summary:ST.progress.summary()})],{type:'text/plain;charset=utf-8'}));state='ok';paint()}catch(e){}
}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')beacon();else if(acct())schedule(1500)});
window.addEventListener('online',function(){if(acct())schedule(1000)});

/* trainer codes live in the sheet too: re-check on every open (a changed or switched-off code signs the device out).
   No connection = stay signed in. */
function accSig(a){if(!a)return '';return Object.keys(a).sort().map(function(k){return k+'='+a[k]}).join(',')}
function sig(p){if(!p)return '';return Object.keys(p).sort().map(function(k){return k+(p[k]?1:0)}).join(',')}
function uiSig(u){if(!u)return '';return Object.keys(u).sort().map(function(k){return k+'='+u[k]}).join(',')}
function recheck(){var s=ST.session();if(!enabled()||!s||!s.code)return;
  post({op:'login',code:s.code}).then(function(res){
    if(res&&res.ok){
      if(res.role==='student'){lockOut('Please sign in again.');return}
      var changed=res.role!==s.role||sig(res.perms)!==sig(s.perms)||sig(res.sperms)!==sig(s.sperms)||(res.readSec||0)!==(s.readSec||0)||uiSig(res.ui)!==uiSig(s.ui)||uiSig(res.sui)!==uiSig(s.sui);
      s.role=res.role;s.name=res.name||s.name;s.email=res.email||'';s.mobile=res.mobile||'';s.perms=res.perms||null;s.sperms=res.sperms||null;s.readSec=res.readSec||0;s.ui=res.ui||null;s.sui=res.sui||null;var hidCh=JSON.stringify(res.hid||{})!==JSON.stringify(s.hid||{});s.hid=res.hid||{};var hfCh=JSON.stringify(res.hf||{})!==JSON.stringify(s.hf||{});s.hf=res.hf||{};if(res.keys)s.keys=res.keys;if(ST.shellTake)ST.shellTake(s,res);ST.setSession(s);if(hfCh&&ST.HF)ST.HF.apply();if(hidCh&&ST.route)ST.route();
      if(changed)location.reload();               // role or permissions were changed in the sheet
      catalog();
      return}
    if(res&&res.auth)lockOut(res.error||'Please sign in again.');
  }).catch(function(){});
}

/* staff open the deck → the sheet's Access tab gets a row for every topic it does not list yet (twice a day at most) */
function catalog(){var key='st-cat2-'+DECK,list=ST.topics.filter(function(t){return !t.soon}),d=new Date(),sigc=list.length+'|'+d.toISOString().slice(0,10)+(d.getHours()<12?'a':'b');
  try{if(localStorage.getItem(key)===sigc)return}catch(e){}
  var C=ST.CONFIG||{},s=ST.session();
  post({op:'catalog',code:s.code,items:list.map(function(t){return {k:t.id,n:(t.group?t.group+' · ':'')+t.n,part:C.part||'Part 1',section:C.section||'',pk:C.partKey||'',sk:C.sectionKey||''}})})
    .then(function(r){if(r&&r.ok&&typeof r.added==='number')try{localStorage.setItem(key,sigc)}catch(e){}}).catch(function(){})}

/* staff panel: every action goes to the script, which checks the role on the Roles sheet */
/* translation inside the page (assets/trsel.js): English parts → Arabic from the sheet's script, for a signed-in code with the permission */
ST.translateCall=function(parts,where,mode){
  var s=ST.session();
  if(!enabled()||!s||!s.code)return Promise.reject(new Error('offline'));
  return post({op:'translate',code:s.code,parts:parts,where:where==='bank'?'bank':'lesson',mode:mode==='all'?'all':'sel'})
    .then(function(res){if(res&&!res.ok&&res.auth)lockOut(res.error);return res||{ok:false,error:'No answer from the sheet.'}});
};
/* key terms in Arabic (Key terms column, Glossary page, printed glossary): [English terms] → {ar: {term in lower case: Arabic}} */
ST.glossCall=function(terms){
  var s=ST.session();
  if(!enabled()||!s||!s.code)return Promise.reject(new Error('offline'));
  return post({op:'gloss',code:s.code,terms:terms})
    .then(function(res){if(res&&!res.ok&&res.auth)lockOut(res.error);return res||{ok:false,error:'No answer from the sheet.'}});
};
/* "اقترح ترجمة أفضل": [{en, ar, sug}] → the Suggestions sheet (the owner approves it there) */
ST.suggestCall=function(items,where){
  var s=ST.session();
  if(!enabled()||!s||!s.code)return Promise.reject(new Error('offline'));
  return post({op:'trSuggest',code:s.code,items:items,where:where==='bank'?'bank':'lesson'})
    .then(function(res){if(res&&!res.ok&&res.auth)lockOut(res.error);return res||{ok:false,error:'No answer from the sheet.'}});
};
/* a suggestion of this student was approved: a thank-you message, shown once (the script is told it was seen) */
var thxShown={};
function thanks(res){var t=((res&&res.thx)||[]).filter(function(x){return x&&x.id&&!thxShown[x.id]});if(!t.length||!ST.modal)return;
  t.forEach(function(x){thxShown[x.id]=1});
  var e=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  var h='<div class="thx" dir="rtl" lang="ar"><p>'+(t.length>1?'اقتراحاتك للترجمة اتعتمدت ✓':'اقتراحك للترجمة اتعتمد ✓')+'</p>'+
    t.map(function(x){return '<blockquote><bdi dir="ltr">'+e(x.en)+(x.en.length>=90?'…':'')+'</bdi><br><b>'+e(x.ar)+'</b></blockquote>'}).join('')+
    '<p>شكراً لمساهمتك! الطلبة كلهم بيشوفوا ترجمتك دلوقتي.</p></div>';
  setTimeout(function(){ST.modal('شكراً لمساهمتك',h)},700);
  var s=ST.session();if(s&&s.code)post({op:'thxSeen',code:s.code,ids:t.map(function(x){return x.id})}).catch(function(){})}
ST.adminCall=function(action,data){
  var s=ST.session();
  if(!enabled())return Promise.reject(new Error('The sheet is not connected.'));
  if(!s||!s.code||ST.role!=='trainer')return Promise.reject(new Error('Sign in with a staff code first.'));
  var body={op:'admin',code:s.code,action:action};Object.keys(data||{}).forEach(function(k){body[k]=data[k]});
  return post(body).then(function(res){if(res&&!res.ok&&res.auth)lockOut(res.error);return res||{ok:false,error:'No answer from the sheet.'}});
};

/* the student saves his details (first sign-in, confirming the details on file, or a later change): his entry replaces the sheet */
ST.saveProfile=function(d){
  var s=ST.session();if(!s||!s.code)return Promise.reject(new Error('Sign in first.'));
  return post({op:'profile',code:s.code,name:d.name||'',mobile:d.mobile||'',email:d.email||''}).then(function(res){
    if(!res||!res.ok){if(res&&res.auth)lockOut(res.error);throw new Error(res&&res.error||'Could not save your details.')}
    s.name=res.name||s.name;s.email=res.email||'';s.mobile=res.mobile||'';s.need=res.need||[];s.confirmBy=res.confirmBy||'';s.access=res.access||{};s.group=res.group||'';ST.setSession(s);
    ST.progress.replace(ST.progress.merge(ST.progress.get(),res.data));return res});
};

/* the section keys again: a device signed in before the lessons were encrypted, or keys that were changed in the script */
ST.refreshKeys=function(){var s=ST.session();if(!enabled()||!s||!s.code)return Promise.reject(new Error('Not signed in.'));
  return post({op:'login',code:s.code}).then(function(res){
    if(res&&res.ok&&res.keys){s.keys=res.keys;ST.setSession(s);return res.keys}
    if(res&&res.auth){lockOut(res.error||'Please sign in again.');return null}
    throw new Error(res&&res.error||'No keys')})};

/* sign-in used by the start screen — the sheet says whether the code is a student's or a trainer's */
ST.accessLogin=function(code){
  if(!enabled())return Promise.reject(new Error('Sign-in is not available yet. Please try again later or contact your instructor.'));
  return post({op:'login',code:code,dname:devName()}).then(function(res){
    if(!res||!res.ok)throw new Error(res&&res.error||'Sign-in failed');
    var o;
    if(res.role!=='student'){o={role:res.role||'assistant',code:code,name:res.name||'',email:res.email||'',mobile:res.mobile||'',view:'trainer',answers:false,perms:res.perms||null,sperms:res.sperms||null,ui:res.ui||null,sui:res.sui||null,readSec:res.readSec||0,keys:res.keys||null,hid:res.hid||{},hf:res.hf||{}};if(ST.shellTake)ST.shellTake(o,res);ST.setSession(o);if(ST.HF)ST.HF.apply();return res}
    o={role:'student',code:code,name:res.name||'',email:res.email||'',mobile:res.mobile||'',need:res.need||[],confirmBy:res.confirmBy||'',access:res.access||{},group:res.group||'',perms:res.perms||null,sperms:res.perms||null,ui:res.ui||null,sui:res.ui||null,readSec:res.readSec||0,keys:res.keys||null,hid:res.hid||{},hf:res.hf||{}};if(ST.shellTake)ST.shellTake(o,res);ST.setSession(o);if(ST.HF)ST.HF.apply();
    ST.progress.replace(ST.progress.merge(ST.progress.get(),res.data));
    thanks(res);
    return res;
  });
};

/* ---------- header account button (students) ---------- */
var ICON='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
function paint(){
  var b=$('#nUser');if(!b)return;
  b.dataset.st=state==='err'?'err':(state==='pending'||state==='syncing'?'pend':'ok');
  var a=acct();b.title=(a&&(a.name||a.code)||'Account')+' — '+label();
}
function label(){
  if(!enabled())return 'progress saved on this device';
  if(state==='syncing')return 'saving…';
  if(state==='pending')return 'changes waiting to be saved';
  if(state==='err')return 'not saved yet ('+lastErr+') — will retry';
  if(lastOk)return 'saved at '+new Date(lastOk).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  return 'signed in';
}
function panel(){
  var a=acct()||{},s=ST.progress.summary(),box=el('div');
  box.innerHTML='<div class="kv"><span>Signed in as</span><b>'+esc(a.name||'Student')+' · <span class="mono" title="Your code is hidden on screen">'+esc(a.code?'••••••'+String(a.code).slice(-4):'')+'</span></b></div>'+
    '<div class="kv"><span>Status</span><b id="uSt">'+esc(label())+'</b></div>'+
    '<div class="kv hi"><span>Mastery</span><b>'+s.mastery+'%</b></div>'+
    '<div class="kv"><span>Mobile</span><b>'+esc(a.mobile||'—')+'</b></div><div class="kv"><span>Email</span><b>'+esc(a.email||'—')+'</b></div>'+
    (a.confirmBy?'<p class="note">Please check your details by <b>'+esc(a.confirmBy)+'</b>.</p>':'')+
    '<div class="row"><a class="btn sm" href="#/details">'+(a.confirmBy?'Check my details':'Change my details')+'</a></div>'+
    '<div class="row" style="margin-top:12px">'+(enabled()?'<button class="btn pri" id="uNow">Save now</button>':'')+'<button class="btn ghost" id="uOut">Sign out</button></div>'+
    '<p class="note">Signing out clears this device. Your progress stays saved under your code.</p>';
  ST.modal('My account',box);
  var n=$('#uNow');if(n)n.onclick=function(){var x=$('#uSt');if(x)x.textContent='saving…';syncNow().then(function(){var x2=$('#uSt');if(x2)x2.textContent=label()})};
  $('#uOut').onclick=function(){var fin=function(){ST.setSession(null);ST.progress.replace(ST.progress.blank());location.reload()};if(state==='pending')syncNow().then(fin);else fin()};
}
ST.sync={enabled:enabled,code:function(){var a=acct();return a?a.code:''},dirty:function(){if(acct())schedule(8000)},now:syncNow,device:device};
ST.syncInit=function(){
  if(ST.role==='trainer'){recheck();return}
  if(ST.role!=='student')return;
  var nav=$('.top-act'),th=$('#nTheme');if(!nav)return;
  var b=el('button','ib',ICON);b.id='nUser';b.setAttribute('aria-label','My account');b.onclick=panel;nav.insertBefore(b,th);
  paint();if(acct())syncNow();
};
})();
