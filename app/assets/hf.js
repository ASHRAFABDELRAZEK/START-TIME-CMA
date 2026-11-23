/* START TIME — header and footer from the sheet's "Header & Footer" tab (Oct 2026).
   The sign-in and sync answers carry hf = {key: {s, t, z, w, p, l}}: only what the owner changed from the defaults below
   (s shown 0/1 · t text or image link · z size s/n/l · w where s=site p=print b=both · p position s/c/e · l link opened on click).
   No hf (an older Apps Script, or nothing changed) = the page is left exactly as it is written in index.html and extras.js.
   HF_DEF must match HF_ROWS in backend/apps-script/Code.gs (tools/test-apps-script-hf.cjs checks it). */
(function(){
var ST=window.ST=window.ST||{};
/* key: [shown, size, where, position] */
var HF_DEF={
  'h.logo':[1,'n','b','s'],'h.title':[1,'n','s','s'],'h.academy':[1,'n','p','s'],'h.instructor':[1,'n','b','s'],'h.partsec':[1,'n','b','s'],
  'h.topic':[1,'n','p','e'],'h.date':[0,'n','s','e'],'h.time':[0,'n','s','e'],'h.logo2':[0,'n','p','e'],
  'h.home':[1,'n','s','e'],'h.map':[1,'n','s','e'],'h.help':[1,'n','s','e'],'h.settings':[1,'n','s','e'],
  'f.disclaimer':[1,'n','s','c'],'f.name':[1,'n','p','s'],'f.email':[1,'n','p','s'],'f.mobile':[1,'n','p','s'],'f.copy':[1,'n','p','s'],
  'f.page':[1,'n','p','e'],'f.date':[1,'n','p','e'],'f.time':[0,'n','p','e'],'f.img3':[0,'n','b','e'],'f.channel':[0,'n','b','c'],'f.extra':[0,'n','b','c']};
var ZF={s:.82,n:1,l:1.25};
function $(s,r){return (r||document).querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function cfg(){var s=ST.session&&ST.session();var h=s&&s.hf;return h&&typeof h==='object'?h:{}}
function get(k){var d=HF_DEF[k],o=cfg()[k]||{};return {k:k,set:!!cfg()[k],on:o.s===undefined?!!d[0]:!!o.s,t:String(o.t||'').trim(),z:o.z||d[1],w:o.w||d[2],p:o.p||d[3],l:safeLink(o.l)}}
function site(e){return e.on&&e.w!=='p'}
function print(e){return e.on&&e.w!=='s'}
function safeLink(u){u=String(u||'').trim();return /^(https?:\/\/|mailto:|tel:)/i.test(u)?u:''}
function isImg(t){return /^https?:\/\//i.test(t)||/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(t)}
function isQR(e){return /^qr$/i.test(e.t)&&!!e.l}
/* a Drive share link → an address the browser can show as an image (the file must be shared "anyone with the link") */
function imgUrl(u){u=String(u||'').trim();
  var m=u.match(/^https?:\/\/drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=|thumbnail\?(?:.*&)?id=)([\w-]{10,})/i)||u.match(/^https?:\/\/docs\.google\.com\/uc\?(?:.*&)?id=([\w-]{10,})/i);
  return m?'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w1000':u}
function pad(n){return ('0'+n).slice(-2)}
function dstr(d){return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()}
function tstr(d){return pad(d.getHours())+':'+pad(d.getMinutes())}

/* ---------- QR codes: the encoder (assets/vendor/qrcode.js, MIT) loads only when a QR is shown ---------- */
var qrLoad=null,qrSvg={};
function loadQR(){if(window.STQRCode)return Promise.resolve();if(qrLoad)return qrLoad;
  qrLoad=new Promise(function(ok,no){var sc=document.createElement('script');sc.src='assets/vendor/qrcode.js?v=1';sc.onload=ok;sc.onerror=function(){qrLoad=null;no(new Error('qr'))};document.head.appendChild(sc)});return qrLoad}
function svgFor(text){if(qrSvg[text])return qrSvg[text];
  var q=new window.STQRCode(-1,window.STQRLevel.M);q.addData(unescape(encodeURIComponent(text)));q.make();   // UTF-8 bytes: the encoder takes one byte per character
  var n=q.getModuleCount(),m=2,d='';
  for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))d+='M'+(c+m)+' '+(r+m)+'h1v1h-1z';
  return qrSvg[text]='<svg viewBox="0 0 '+(n+2*m)+' '+(n+2*m)+'" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>'}
/* every placeholder <span class="hf-qr" data-u=…> under root gets its code */
function fillQR(root){var ps=(root||document).querySelectorAll('.hf-qr:not(.done)');if(!ps.length)return Promise.resolve();
  return loadQR().then(function(){Array.prototype.forEach.call(ps,function(p){try{p.innerHTML=svgFor(p.getAttribute('data-u'));p.classList.add('done')}catch(x){p.remove()}})},function(){Array.prototype.forEach.call(ps,function(p){p.remove()})})}

/* one element as HTML: an image, a QR, a link or a text, with its size class */
function html(e,text,cls){
  var z=' hfz-'+e.z,c=(cls?cls+' ':'')+'hf-i'+z,inner;
  if(isQR(e))inner='<span class="hf-qr" data-u="'+esc(e.l)+'"></span>';
  else if(isImg(e.t))inner='<img class="hf-img" src="'+esc(imgUrl(e.t))+'" alt="" loading="lazy" decoding="async" onerror="this.parentNode&&this.parentNode.classList.add(\'hf-bad\');this.remove()">';
  else{var t=e.t||text;if(!t)return '';inner=esc(t)}
  if(e.l)return '<a class="'+c+'" href="'+esc(e.l)+'" target="_blank" rel="noopener">'+inner+'</a>';
  return '<span class="'+c+'">'+inner+'</span>'}

/* ---------- the site: header (.top) and footer (#foot) ---------- */
var O=null,applied=false,clock=null;
function capture(){if(O)return;var lg=$('.top .logo'),b=$('.brand-t b'),sm=$('.brand-t small'),f=$('#foot');
  O={logo:lg?lg.innerHTML:'ST',title:b?b.textContent:'START TIME — CMA',small:sm?sm.textContent:'',foot:f?f.innerHTML:'',footT:f?f.textContent:''}}
function restore(){var top=$('#top');if(!top||!O)return;
  Array.prototype.forEach.call(top.querySelectorAll('.hf-slot'),function(x){x.remove()});top.classList.remove('hf-on');
  var lg=$('.top .logo'),b=$('.brand-t b'),sm=$('.brand-t small'),br=$('.top .brand');
  if(lg){lg.innerHTML=O.logo;lg.className='logo';lg.style.cssText='';if(br&&lg.parentNode!==br)br.insertBefore(lg,br.firstChild)}
  if(b){b.textContent=O.title;b.style.cssText='';var bt=$('.brand-t');if(bt&&b.parentNode!==bt)bt.insertBefore(b,bt.firstChild)}
  if(sm){sm.style.cssText='';sm.hidden=false;sm.textContent=O.small}
  ['#nHome','#nMap','#nHelp','#nTheme'].forEach(function(id){var x=$(id);if(x){x.style.display='';x.classList.remove('hfz-s','hfz-l')}});
  var f=$('#foot');if(f){f.innerHTML=O.foot;f.classList.remove('hf-foot')}
  if(clock){clearInterval(clock);clock=null}}
function slot(p){var top=$('#top'),s=top.querySelector('.hf-slot.hf-'+p);if(s)return s;
  top.classList.add('hf-on');s=document.createElement('span');s.className='hf-slot hf-'+p;
  var nav=$('.top-act',top),br=$('.brand',top);
  if(p==='e')top.insertBefore(s,nav);
  else if(p==='c')top.insertBefore(s,top.querySelector('.hf-slot.hf-e')||nav);
  else top.insertBefore(s,br?br.nextSibling:nav);
  return s}
function scale(x,z){if(!x||z==='n')return;var fs=parseFloat(getComputedStyle(x).fontSize)||14;x.style.fontSize=(fs*ZF[z]).toFixed(1)+'px'}
function apply(){
  var c=cfg(),keys=Object.keys(c);
  if(!keys.length&&!applied)return;                                   // nothing set: the page stays as written
  capture();restore();applied=keys.length>0;if(!applied)return;
  var top=$('#top');if(!top)return;
  var lg=$('.top .logo'),b=$('.brand-t b'),sm=$('.brand-t small'),e;
  /* logo */
  e=get('h.logo');
  if(lg&&e.set){
    if(!site(e))lg.style.display='none';
    else{
      if(isImg(e.t)){lg.className='logo hf-logo hfz-'+e.z;lg.innerHTML='<img class="hf-img" src="'+esc(imgUrl(e.t))+'" alt="" decoding="async">';
        var im=lg.querySelector('img');im.onerror=function(){lg.className='logo';lg.innerHTML=O.logo}}
      else if(e.t){lg.textContent=e.t.slice(0,4);scale(lg,e.z)}
      else scale(lg,e.z);
      if(e.p!=='s')slot(e.p).appendChild(lg)}}
  /* title */
  e=get('h.title');
  if(b&&e.set){if(!site(e))b.style.display='none';else{if(e.t)b.textContent=e.t;scale(b,e.z);if(e.p!=='s')slot(e.p).appendChild(b)}}
  /* the small line: academy · instructor · part · section */
  if(sm&&(c['h.academy']||c['h.instructor']||c['h.partsec'])){
    var ps=O.small.replace(/^ASHRAF FATHY · /,''),parts=[];
    [['h.academy','START TIME ACADEMY'],['h.instructor','ASHRAF FATHY'],['h.partsec',ps]].forEach(function(x){var y=get(x[0]);if(!site(y))return;
      var h=html(y,x[1]);if(!h)return;if(y.p!=='s')slot(y.p).insertAdjacentHTML('beforeend',h);else parts.push(h)});
    sm.innerHTML=parts.join(' · ');sm.hidden=!parts.length}
  /* date and time, second logo */
  ['h.date','h.time'].forEach(function(k){var y=get(k);if(!site(y))return;var s=slot(y.p);
    s.insertAdjacentHTML('beforeend','<span class="hf-i hf-clk hfz-'+y.z+'" data-k="'+k+'"></span>')});
  e=get('h.logo2');if(site(e)&&e.t)slot(e.p).insertAdjacentHTML('beforeend',html(e,''));
  /* icons */
  [['h.home','#nHome'],['h.map','#nMap'],['h.help','#nHelp'],['h.settings','#nTheme']].forEach(function(x){var y=get(x[0]),n=$(x[1]);if(!n||!y.set)return;
    if(!site(y))n.style.display='none';else if(y.z!=='n')n.classList.add('hfz-'+y.z)});
  /* footer */
  var f=$('#foot');
  if(f&&keys.some(function(k){return k.charAt(0)==='f'})){
    var s=ST.session&&ST.session()||{},cols={s:[],c:[],e:[]},put=function(y,h){if(h)cols[y.p].push(h)};
    var d=get('f.disclaimer');if(site(d))put(d,html(d,O.footT.trim(),'hf-disc'));
    [['f.name',s.name],['f.email',s.email],['f.mobile',s.mobile]].forEach(function(x){var y=get(x[0]);if(site(y)&&x[1])put(y,html(y,String(x[1])))});
    var cp=get('f.copy');if(site(cp)&&s.role==='student')put(cp,html(cp,'Personal copy — not for sharing'));
    ['f.date','f.time'].forEach(function(k){var y=get(k);if(site(y))put(y,'<span class="hf-i hf-clk hfz-'+y.z+'" data-k="'+k+'"></span>')});
    ['f.img3','f.channel','f.extra'].forEach(function(k){var y=get(k);if(!site(y))return;
      if(k==='f.img3'&&!y.t)return;put(y,html(y,k==='f.channel'?'Our channel':''))});
    f.classList.add('hf-foot');
    f.innerHTML=['s','c','e'].map(function(p){return '<span class="hf-fs hf-f'+p+'">'+cols[p].join('<span class="hf-sep"> · </span>')+'</span>'}).join('')}
  tick();if(document.querySelector('.hf-clk'))clock=setInterval(tick,30000);
  fillQR(document)}
function tick(){var d=new Date();Array.prototype.forEach.call(document.querySelectorAll('.hf-clk'),function(x){var k=x.getAttribute('data-k');x.textContent=/time$/.test(k)?tstr(d):dstr(d)})}

/* ---------- printed pages (extras.js) ---------- */
function on(){return Object.keys(cfg()).length>0}
function printHead(part,sect,run){
  var cols={s:[],c:[],e:[]},put=function(y,h){if(h)cols[y.p].push(h)};
  var lg=get('h.logo');
  if(print(lg)){if(isImg(lg.t))put(lg,'<div class="sh-logo hf-logo hfz-'+lg.z+'"><img class="hf-img" src="'+esc(imgUrl(lg.t))+'" alt="" onerror="this.parentNode.className=\'sh-logo\';this.parentNode.textContent=\'ST\'"></div>');
    else put(lg,'<div class="sh-logo hfz-'+lg.z+'">'+esc((lg.t||'ST').slice(0,4))+'</div>')}
  var bl=[],sl=[];
  [['h.title','START TIME — CMA'],['h.academy','START TIME ACADEMY']].forEach(function(x){var y=get(x[0]);if(!print(y))return;var h=html(y,x[1]);if(y.p!=='s')put(y,h);else if(h)bl.push(h)});
  [['h.instructor','ASHRAF FATHY'],['h.partsec','CMA '+part+' · '+sect]].forEach(function(x){var y=get(x[0]);if(!print(y))return;var h=html(y,x[1]);if(y.p!=='s')put(y,h);else if(h)sl.push(h)});
  if(bl.length||sl.length)cols.s.splice(print(lg)&&lg.p==='s'?1:0,0,'<div class="sh-brand">'+(bl.length?'<b>'+bl.join(' — ')+'</b>':'')+(sl.length?'<span>'+sl.join(' · ')+'</span>':'')+'</div>');
  var d=new Date();
  ['h.date','h.time'].forEach(function(k){var y=get(k);if(print(y))put(y,'<span class="hf-i hfz-'+y.z+'">'+(k==='h.time'?tstr(d):dstr(d))+'</span>')});
  var l2=get('h.logo2');if(print(l2)&&l2.t)put(l2,html(l2,''));
  var tp=get('h.topic');if(print(tp)&&run)put(tp,'<div class="sh-run hfz-'+tp.z+'"><small>'+esc(run.k)+'</small>'+esc(run.n)+'</div>');
  return '<header class="sh-head hf-head">'+row(cols)+'</header>'}
function row(cols){return '<span class="hf-ps">'+cols.s.join('')+'</span>'+(cols.c.length?'<span class="hf-pc">'+cols.c.join('')+'</span>':'')+'<span class="hf-pe">'+cols.e.join('')+'</span>'}
/* who = {name, email, mobile} already filtered by the Roles print rows */
function printFoot(who,stu){
  var cols={s:[],c:[],e:[]},more={s:[],c:[],e:[]},put=function(y,h,c2){if(h)(c2||cols)[y.p].push(h)};
  var wl=[];[['f.name',who.name],['f.email',who.email],['f.mobile',who.mobile]].forEach(function(x){var y=get(x[0]);if(print(y)&&x[1])wl.push({y:y,v:x[1]})});
  var line=wl.map(function(x){return x.v}).join(' · ');
  var acad=get('h.academy'),ins=get('h.instructor');
  var whoTxt=line?(stu?'Prepared for ':'Printed by ')+line:(acad.t||'START TIME ACADEMY')+' — '+(ins.t||'ASHRAF FATHY');
  var w0=wl[0]?wl[0].y:get('f.name');
  put(w0,'<span class="sh-who hfz-'+w0.z+'">'+esc(whoTxt)+'</span>');
  var cp=get('f.copy');if(print(cp)&&stu)put(cp,'<span class="sh-pc hfz-'+cp.z+'">'+esc(cp.t||'Personal copy — not for sharing')+'</span>');
  var pg=get('f.page');if(print(pg)||print(get('f.date'))||print(get('f.time')))put(pg.on?pg:get('f.date'),'<span class="pn hfz-'+pg.z+'" data-d="'+esc(stamp())+'"></span>');
  /* the added elements go on a second line, so the first line keeps today's layout (one line, see fitFeet in extras.js) */
  var di=get('f.disclaimer');if(print(di))put(di,html(di,'An independent study tool by START TIME ACADEMY. Not affiliated with IMA or Prometric. CMA® is a registered trademark of IMA.'),more);
  ['f.img3','f.channel','f.extra'].forEach(function(k){var y=get(k);if(!print(y))return;if(k==='f.img3'&&!y.t)return;
    var h=html(y,k==='f.channel'?'Our channel':'');
    if(k!=='f.img3'&&y.l&&h)h=h.replace(/<\/a>$/,' <span class="hf-url">'+esc(y.l.replace(/^https?:\/\//,''))+'</span></a>');   // on paper the address itself is shown
    put(y,h,more)});
  var two=more.s.length||more.c.length||more.e.length;
  return '<footer class="sh-foot hf-foot'+(two?' hf-2':'')+'">'+(two?'<div class="hf-r1">'+row(cols)+'</div><div class="hf-r2">'+row(more)+'</div>':row(cols))+'</footer>'}
function stamp(){var d=new Date(),a=[];if(print(get('f.date')))a.push(dstr(d));if(print(get('f.time')))a.push(tstr(d));return a.join(' ')}
function pageText(d,n,N){var pg=get('f.page');var t=print(pg)?(pg.t||'Page {n} of {all}').replace(/\{n\}/g,n).replace(/\{all\}/g,N):'';return [d,t].filter(String).join(' · ')}
/* the cover band of a multi-topic handout: logo, academy and instructor */
function cover(cv){if(!cv)return;var lg=get('h.logo'),x=cv.querySelector('.cv-logo');
  if(x){if(!print(lg))x.style.display='none';else if(isImg(lg.t)){x.classList.add('hf-logo');x.innerHTML='<img class="hf-img" src="'+esc(imgUrl(lg.t))+'" alt="">'}else if(lg.t)x.textContent=lg.t.slice(0,4)}
  var b=cv.querySelector('.cv-band b'),s=cv.querySelector('.cv-band span'),a=get('h.academy'),i=get('h.instructor');
  if(b&&a.set){if(a.t)b.textContent=a.t}if(s&&i.set){if(!i.on)s.style.display='none';else if(i.t)s.textContent=i.t}}

ST.HF={def:HF_DEF,get:get,apply:apply,on:on,printHead:printHead,printFoot:printFoot,pageText:pageText,cover:cover,fillQR:fillQR,imgUrl:imgUrl,svgFor:svgFor,loadQR:loadQR};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
