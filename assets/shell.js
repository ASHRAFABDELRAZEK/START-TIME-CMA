/* START TIME — the platform shell outside the course (Oct 2026): My dashboard, Courses, Certificates, Profile & settings,
   Contact us and Share the app. A layer around the course, never inside it: the lessons, the question bank, the print pages
   and the in-course header keep their own screens and icons.
   Routes: #/home · #/courses · #/certs · #/me. The course home stays #/ (a link from the dashboard opens it).
   Data, all from the sign-in / sync answer and kept in the session (nothing is asked for separately):
     expires 'dd/mm/yyyy' (Students → Expires on; '' = no end date), devices / maxDevices, courses [] (the Courses tab, "Show on site" rows
     only), contact {wa, mail, page, shareUrl, shareMsg} (Settings rows). An older Apps Script sends none of these: the shell then shows
     the course it runs (CMA) alone, no end date, and Contact us falls back to the Header & Footer channel link.
   Who sees what: the Roles sheet rows pf.home, pf.courses, pf.certs, pf.profile, pf.contact, pf.share, pf.join (a row that does not
   exist yet counts as ticked). core.js hands #/home, #/courses, #/certs and #/me to ST.shellRoute; the first open of a tab with no hash
   lands on #/home. */
(function(){
'use strict';
var ST=window.ST;if(!ST||!ST.h)return;
var $=ST.h.$,$$=ST.h.$$,el=ST.h.el,esc=ST.h.esc,CFG=ST.CONFIG||{};
var PROGRAM=(CFG.program||'CMA'),PART=CFG.part||'Part 1';
var KEYS=['expires','devices','maxDevices','courses','contact','enrolledIn','enrolled'];

/* ---------- the session fields the shell needs (called by sync.js on sign-in, sync and re-check) → true when something changed ---------- */
ST.shellTake=function(s,res){if(!s||!res)return false;var ch=false;
  KEYS.forEach(function(k){if(res[k]===undefined)return;var a=JSON.stringify(res[k]),b=JSON.stringify(s[k]);if(a!==b){s[k]=res[k];ch=true}});
  return ch};

/* a Roles row that is not on the sheet yet counts as ticked (an older sheet, or a site set up before the shell) */
function pf(k){var s=ST.session(),p=ST.view==='student'?(s&&s.sperms):(s&&s.perms);
  if(p&&typeof p==='object'&&Object.prototype.hasOwnProperty.call(p,k))return ST.can(k);
  return true}
function signedIn(){var s=ST.session();return !!(s&&s.code&&s.role)}
function student(){return ST.role==='student'||(ST.role==='trainer'&&ST.view==='student')}
function on(){return signedIn()&&!(ST.gated&&ST.gated())&&!(ST.needProfile&&ST.needProfile())&&pf('pf.home')}

/* ---------- dates ---------- */
function parseDMY(t){var m=String(t||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(!m)return null;var d=new Date(+m[3],+m[2]-1,+m[1]);return isNaN(d)?null:d}
function daysLeft(t){var d=parseDMY(t);if(!d)return null;var n=new Date();n.setHours(0,0,0,0);return Math.round((d-n)/864e5)}   // as the sheet: Expires on − today
var MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
function longDate(t){var d=parseDMY(t);return d?d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear():''}

/* ---------- the course this site runs, from the site itself (never typed by hand) ---------- */
function secInfo(){var S=ST.SECTIONS||[],built=S.filter(function(s){return s.files&&s.files.length&&!(ST.secHidden&&ST.secHidden(s.k))}),soon=S.filter(function(s){return !(s.files&&s.files.length)&&!(ST.secHidden&&ST.secHidden(s.k))});
  var ks=built.map(function(s){return s.k}),label=ks.length?(ks.length>1?'Sections '+ks[0]+'–'+ks[ks.length-1]:'Section '+ks[0]):'';
  if(soon.length)label+=(label?' · ':'')+soon.map(function(s){return s.k}).join(' and ')+' coming soon';
  return {built:built,soon:soon,label:label}}
function here(){var ts=(ST.topics||[]).filter(function(t){return !t.soon}),sl=0;ts.forEach(function(t){sl+=(t.slides||[]).length});
  var sum=ST.progress&&ST.progress.summary?ST.progress.summary():{mastery:0,read:0,concept:0,mastered:0,topics:0};
  var P=ST.progress&&ST.progress.get?ST.progress.get():{},last=P.last&&P.last.split('/'),cont=last&&ST.byId&&ST.byId[last[0]]&&!(ST.lock&&ST.lock(ST.byId[last[0]]))?'#/t/'+last[0]+'/'+last[1]:'#/';
  return {section:CFG.section||'',title:CFG.sectionTitle||'',topics:ts.length,slides:sl,sum:sum,cont:cont}}

/* the Courses tab rows; an old script: the course this site runs, alone */
function courses(){var s=ST.session()||{},c=s.courses;
  if(!Array.isArray(c)||!c.length)c=[{id:PROGRAM.toLowerCase(),code:PROGRAM,name:'Certified Management Accountant',ar:'',issuer:'IMA (USA)',parts:2,status:'active',price:'',months:0}];
  return c}
/* the courses this student is in, from the sign-in answer (enrolledIn: [{code, group}]); an older answer names none = the course this site runs */
function enrolledIn(){var s=ST.session()||{},e=s.enrolledIn;
  if(!student())return [{code:PROGRAM,group:''}];
  if(Array.isArray(e))return e.map(function(x){return {code:String(x.code||'').toUpperCase(),group:x.group||''}}).filter(function(x){return x.code});
  return [{code:PROGRAM.toUpperCase(),group:s.group||''}]}
function inCourse(code){return enrolledIn().some(function(x){return x.code===String(code||'').toUpperCase()})}
function mine(c){return inCourse(c.code)}
function here_(){return String(PROGRAM).toUpperCase()}   // the course this site runs
/* the name of a part of the course: the Courses tab (part_names), else the fixed names of the CMA parts — never a section's title */
var PART_NAMES={CMA:['Financial Planning, Performance, and Analytics','Strategic Financial Management']};
function partName(c,n){var l=(c&&c.partNames&&c.partNames.length?c.partNames:PART_NAMES[String((c&&c.code)||PROGRAM).toUpperCase()])||[];
  if(n===partNo()&&CFG.partTitle&&!(c&&c.partNames&&c.partNames.length))return CFG.partTitle;   // this part: config.js names it
  return l[n-1]||''}
function myCourse(){return courses().filter(function(c){return String(c.code||'').toUpperCase()===here_()})[0]||null}
function partNo(){var m=String(PART).match(/\d+/);return m?+m[0]:1}
/* a cell the owner left empty, or still holding a placeholder like [PRICE], is not shown */
function val(v){v=String(v==null?'':v).trim();return /^\[.*\]$/.test(v)||/^\[|\]$/.test(v)?'':v}
function contact(){var s=ST.session()||{},c=s.contact&&typeof s.contact==='object'?s.contact:{},o={wa:c.wa||'',mail:c.mail||'',page:c.page||'',shareUrl:c.shareUrl||'',shareMsg:c.shareMsg||''};
  if(!o.wa&&!o.mail&&!o.page&&ST.HF&&ST.HF.get){var ch=ST.HF.get('f.channel');if(ch&&ch.l)o.page=ch.l}   // Header & Footer: the channel link
  ['page','shareUrl'].forEach(function(k){if(o[k]&&!/^(https?:|mailto:|tel:)/i.test(o[k]))o[k]=''});   // the site checks the links itself, whatever the sheet sent
  o.wa=String(o.wa).replace(/\D/g,'');if(o.mail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.mail))o.mail='';
  return o}
function waLink(num,text){return 'https://wa.me/'+String(num).replace(/\D/g,'')+(text?'?text='+encodeURIComponent(text):'')}
function siteUrl(){return location.origin+location.pathname}

/* ---------- icons (inline stroke SVG, same family as the top bar) ---------- */
var I={
  home:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>',
  courses:'<svg viewBox="0 0 24 24"><path d="M4 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4z"/><path d="M20 5h-4a3 3 0 0 0-3 3v11a2 2 0 0 1 2-2h5z"/></svg>',
  cert:'<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="M8.5 13.5 7 21l5-3 5 3-1.5-7.5"/></svg>',
  me:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  chat:'<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  share:'<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'};

/* ---------- the frame: side menu (computer) / bottom bar (phone) + the page ---------- */
function tabs(){var t=[{h:'#/home',k:'pf.home',i:'home',n:'My dashboard',s:'Dashboard'},{h:'#/courses',k:'pf.courses',i:'courses',n:'Courses',s:'Courses'},{h:'#/certs',k:'pf.certs',i:'cert',n:'Certificates',s:'Certificates'},{h:'#/me',k:'pf.profile',i:'me',n:'Profile & settings',s:'Profile'}];
  return t.filter(function(x){return pf(x.k)})}
function frame(cur,title,sub){
  var app=$('#app');app.innerHTML='';
  var box=el('div','pf'),nav=el('nav','pf-nav');nav.setAttribute('aria-label','Platform');
  nav.innerHTML=tabs().map(function(t){return '<a class="pf-t'+(t.h===cur?' on':'')+'" href="'+t.h+'"'+(t.h===cur?' aria-current="page"':'')+'>'+I[t.i]+'<span class="pf-l">'+t.n+'</span><span class="pf-s">'+t.s+'</span></a>'}).join('')+
    '<span class="pf-sp"></span>'+(pf('pf.contact')&&hasContact()?'<button type="button" class="pf-t pf-x" id="pfContact">'+I.chat+'<span>Contact us</span></button>':'')+
    (pf('pf.share')?'<button type="button" class="pf-t pf-x" id="pfShare">'+I.share+'<span>Share the app</span></button>':'');
  var main=el('section','pf-main');
  var xb=(pf('pf.contact')&&hasContact()?'<button type="button" class="ib" data-x="c" title="Contact us" aria-label="Contact us">'+I.chat+'</button>':'')+(pf('pf.share')?'<button type="button" class="ib" data-x="s" title="Share the app" aria-label="Share the app">'+I.share+'</button>':'');
  main.innerHTML='<header class="pf-head"><div><h1>'+esc(title)+'</h1>'+(sub?'<p>'+sub+'</p>':'')+'</div>'+(xb?'<div class="pf-xbar">'+xb+'</div>':'')+'</header>';
  box.appendChild(nav);box.appendChild(main);app.appendChild(box);
  var c=$('#pfContact',nav);if(c)c.onclick=contactUs;var sh=$('#pfShare',nav);if(sh)sh.onclick=share;
  $$('.pf-xbar [data-x]',main).forEach(function(b){b.onclick=b.dataset.x==='c'?contactUs:share});
  $('#nHome').classList.remove('on');
  return main}
function who(){var s=ST.session()||{};return s.name?s.name.split(' ')[0]:''}

/* ---------- My dashboard ---------- */
function dash(){
  var s=ST.session()||{},st=student(),h=here(),si=secInfo(),left=daysLeft(s.expires),end=longDate(s.expires);
  var m=frame('#/home','My dashboard',who()?'Welcome back, '+esc(who())+'.':'');
  /* subscription */
  var card=el('section','pf-sub');card.setAttribute('aria-label','Subscription');
  var status=!st?'<span class="pf-tag">'+esc(String(ST.staffRole||'staff').toUpperCase())+'</span>':left===null?'<span class="pf-tag">ACTIVE</span>':left<0?'<span class="pf-tag off">EXPIRED</span>':'<span class="pf-tag">ACTIVE</span>';
  card.innerHTML='<div class="pf-sub-l"><div class="pf-row">'+status+'<span class="pf-dim">'+(st?'Your subscription':'Staff access')+'</span></div>'+
    '<div class="pf-big">'+esc(!st||inCourse(here_())?PROGRAM+' — '+PART:(enrolledIn().length?enrolledIn().map(function(e){return e.code}).join(' · '):'START TIME'))+'</div>'+
    (st?(end?'<div class="pf-dim">Ends on <b>'+esc(end)+'</b></div>':'<div class="pf-dim">No end date is set for your code.</div>'):(s.name?'<div class="pf-dim">'+esc(s.name)+'</div>':''))+
    '<div class="pf-row pf-acts"><a class="btn gold" href="'+h.cont+'">'+(h.cont==='#/'?'Open the course':'Continue learning')+'</a>'+(st?'':'<a class="btn" href="#/staff">Staff panel</a>')+'</div></div>'+
    (st&&left!==null?'<div class="pf-days"><b>'+Math.max(0,left)+'</b><span>'+(left<0?'expired':left===1?'day remaining':'days remaining')+'</span></div>':'');
  m.appendChild(card);
  /* my courses + certificates */
  var grid=el('div','pf-grid');
  var mc=el('section','pf-card');mc.setAttribute('aria-label','My courses');
  mc.innerHTML='<h2>My courses</h2>'+
    '<a class="pf-course" href="#/"><div class="pf-row pf-sb"><span><b>'+esc(PROGRAM+' '+PART)+'</b>'+(partName(myCourse(),partNo())?' · '+esc(partName(myCourse(),partNo())):'')+'</span><span class="pf-pct">'+h.sum.mastery+'%</span></div>'+
    '<div class="pf-bar"><i style="width:'+h.sum.mastery+'%"></i></div>'+
    '<div class="pf-dim">'+esc(si.label)+(h.section?' · you are in '+esc(h.section)+': '+h.topics+' topic'+(h.topics===1?'':'s')+(h.slides?' · '+h.slides.toLocaleString('en-US')+' slides':''):'')+'</div></a>'+
    (st&&!inCourse(here_())?'<p class="pf-dim">Your code is not registered for '+esc(PROGRAM)+' yet: its lessons stay closed until START TIME adds you.</p>':'')+
    enrolledIn().filter(function(e){return e.code!==here_()}).map(function(e){var c=courses().filter(function(x){return String(x.code||'').toUpperCase()===e.code})[0]||{code:e.code};
      return '<div class="pf-course pf-other"><div class="pf-row pf-sb"><span><b>'+esc(c.code)+'</b>'+(val(c.name)?' · '+esc(val(c.name)):'')+'</span><span class="pf-tag sm">SUBSCRIBED</span></div><div class="pf-dim">'+(e.group?'Group: '+esc(e.group)+' · ':'')+'lessons coming soon</div></div>'}).join('')+
    (function(){var others=courses().filter(function(c){return !mine(c)});if(!others.length)return '';
      return '<div class="pf-more"><span class="pf-dim">'+others.length+' more certificate'+(others.length===1?'':'s')+' on START TIME</span><a class="btn sm" href="#/courses">See the courses</a></div>'})();
  grid.appendChild(mc);
  if(pf('pf.certs')){var cc=el('section','pf-card');cc.setAttribute('aria-label','Certificates');
    cc.innerHTML='<h2>My certificates</h2><div class="pf-cert"><span class="pf-ci">'+I.cert+'</span><div><b>START TIME completion — '+esc(PROGRAM+' '+PART)+'</b><div class="pf-dim">'+(h.sum.mastery>=100?'ready':'in progress · '+h.sum.mastery+'% mastery')+'</div></div></div>'+
      '<p class="pf-dim">Completion certificates are coming soon. Your progress is already counted.</p>';grid.appendChild(cc)}
  m.appendChild(grid);
}

/* ---------- Courses ---------- */
function coursesPage(){
  var m=frame('#/courses','Courses','Accounting certificates on START TIME. Open what you are subscribed to; the rest opens when its content is ready.');
  var list=courses(),si=secInfo(),h=here(),st=student();
  list.forEach(function(c){
    var isMine=mine(c),sec=el('section','pf-card pf-cc'+(isMine?' pf-mine':''));sec.setAttribute('aria-label',c.code);
    var head='<div class="pf-row pf-sb"><div class="pf-row"><span class="pf-badge">'+esc(c.code)+'</span><div><h2>'+esc(val(c.name)||c.code)+'</h2><div class="pf-dim">'+esc([val(c.issuer),c.parts?c.parts+(c.parts===1?' part':' parts'):''].filter(String).join(' · '))+'</div></div></div>'+
      (isMine?'<span class="pf-tag">SUBSCRIBED</span>':c.status==='active'?'':'<span class="pf-tag off">COMING SOON</span>')+'</div>';
    var body='',grp=(enrolledIn().filter(function(e){return e.code===String(c.code||'').toUpperCase()})[0]||{}).group;
    if(isMine&&String(c.code||'').toUpperCase()!==here_())body='<p class="pf-dim">You are in this course'+(grp?' (group: '+esc(grp)+')':'')+'. Its lessons open here when they are ready.</p>';
    else if(isMine){
      body='<div class="pf-parts"><article class="pf-part on"><div class="pf-row pf-sb"><span class="pf-k">'+esc(PART.toUpperCase())+'</span><span class="pf-tag sm">ACTIVE</span></div><b>'+esc(partName(c,partNo())||c.code+' '+PART)+'</b>'+
        '<div class="pf-dim">'+esc(si.label)+(h.section?' · now in '+esc(h.section)+(h.title?': '+esc(h.title):''):'')+'</div><div class="pf-bar"><i style="width:'+h.sum.mastery+'%"></i></div><div class="pf-row pf-sb pf-dim"><span>'+h.sum.mastery+'% mastery</span>'+(st&&(ST.session()||{}).expires?'<span>Ends '+esc(longDate((ST.session()||{}).expires))+'</span>':'')+'</div>'+
        '<a class="btn pri" href="#/">Open course</a></article>';
      for(var p=1;p<=(c.parts||1);p++){if(p===partNo())continue;body+='<article class="pf-part"><div class="pf-row pf-sb"><span class="pf-k">PART '+p+'</span><span class="pf-tag off sm">COMING SOON</span></div><b>'+esc(partName(c,p)||c.code+' Part '+p)+'</b><div class="pf-dim">Opens when its lessons are ready.</div></article>'}
      body+='</div>'}
    else if(c.status==='active'&&pf('pf.join'))body='<p class="pf-dim">'+priceLine(c)+'</p><div class="pf-row"><a class="btn" href="'+esc(joinLink(c))+'" target="_blank" rel="noopener">Request to join</a></div>';
    else body='<p class="pf-dim">'+(priceLine(c)||'Opens when its lessons are ready.')+'</p>'+(hasWa()?'<div class="pf-row"><a class="btn ghost" href="'+esc(waLink(contact().wa,'Hello START TIME, please tell me when the '+c.code+' course opens.'+sig()))+'" target="_blank" rel="noopener">Notify me</a></div>':'');
    sec.innerHTML=head+body;m.appendChild(sec)});
  m.insertAdjacentHTML('beforeend','<p class="pf-legal">Not affiliated with the bodies above. All names and trademarks belong to their owners.</p>');
}
function priceLine(c){var a=[],pr=val(c.price),mo=+c.months||0;if(pr)a.push(pr);if(mo>0)a.push(mo+' month'+(mo===1?'':'s')+' access');return esc(a.join(' · '))}
function sig(){var s=ST.session()||{},c=String(s.code||'');return s.name?' — '+s.name+(c?' (code …'+c.slice(-4)+')':''):''}   // never the whole code in a chat
function hasWa(){return !!contact().wa}
function joinLink(c){var ct=contact();if(ct.wa)return waLink(ct.wa,'Hello START TIME, I would like to join the '+c.code+' course.'+sig());if(ct.mail)return 'mailto:'+ct.mail+'?subject='+encodeURIComponent('Join the '+c.code+' course')+'&body='+encodeURIComponent('I would like to join the '+c.code+' course.'+sig());return ct.page||'#/courses'}

/* ---------- Certificates ---------- */
function certs(){var m=frame('#/certs','Certificates','Your completion certificates from START TIME.'),h=here();
  m.innerHTML+='<section class="pf-card"><div class="pf-cert"><span class="pf-ci">'+I.cert+'</span><div><b>START TIME completion — '+esc(PROGRAM+' '+PART)+'</b><div class="pf-dim">'+h.sum.mastery+'% mastery · '+h.sum.mastered+' of '+h.sum.topics+' topics mastered in '+esc(h.section||'this section')+'</div></div></div>'+
    '<p class="pf-dim">Coming soon: when a part is complete, its certificate appears here to view and download.</p></section>'}

/* ---------- Profile & settings ---------- */
function me(){
  var s=ST.session()||{},st=student(),h=here(),left=daysLeft(s.expires),m=frame('#/me','Profile & settings','');
  var code=String(s.code||''),masked=code?'••••••'+code.slice(-4):'';
  var rows=[['Name',esc(s.name||'—')],['Code','<span class="mono" id="pfCode" data-c="'+esc(code)+'">'+esc(masked)+'</span> <button type="button" class="btn sm ghost" id="pfShow">Show</button> <button type="button" class="btn sm ghost" id="pfCopy">'+I.copy+' Copy</button>'],
    ['Mobile',esc(s.mobile||'—')],['Email',esc(s.email||'—')]];
  if(st){rows.push(['Group',esc(s.group||'—')]);rows.push(['Subscription',s.expires?'Ends '+esc(longDate(s.expires))+(left!==null?' · '+(left<0?'expired':Math.max(0,left)+' day'+(left===1?'':'s')+' left'):''):'No end date']);
    if(s.maxDevices)rows.push(['Devices',(s.devices||0)+' of '+s.maxDevices+' in use']);rows.push(['Mastery',h.sum.mastery+'% in '+esc(h.section||'this section')])}
  else rows.push(['Role',esc(String(ST.staffRole||s.role||'staff'))]);
  var card=el('section','pf-card');card.innerHTML='<h2>'+esc(s.name||'My profile')+'</h2><dl class="pf-kv">'+rows.map(function(r){return '<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>'}).join('')+'</dl>'+
    '<div class="pf-row pf-acts">'+(st?'<a class="btn" href="#/details">Change my details</a>':'')+'<button type="button" class="btn" id="pfSett">Settings</button><button type="button" class="btn ghost" id="pfOut">Sign out</button></div>'+
    (st?'<p class="pf-dim">Your code, group and subscription are set by START TIME. Your name, mobile and email are yours to change.</p>':'');
  m.appendChild(card);
  var cd=$('#pfCode',card),sh=$('#pfShow',card);sh.onclick=function(){var on=cd.textContent===masked;cd.textContent=on?code:masked;sh.textContent=on?'Hide':'Show'};
  $('#pfCopy',card).onclick=function(){var b=this;try{navigator.clipboard.writeText(code).then(function(){b.textContent='Copied'},function(){b.textContent='Copy failed'})}catch(e){b.textContent='Copy failed'}setTimeout(function(){b.innerHTML=I.copy+' Copy'},1500)};
  $('#pfSett',card).onclick=function(){if(ST.settings)ST.settings()};
  $('#pfOut',card).onclick=function(){var fin=function(){ST.setSession(null);if(ST.progress)ST.progress.replace(ST.progress.blank());location.reload()};if(ST.sync&&ST.sync.now)ST.sync.now().then(fin,fin);else fin()};
}

/* ---------- Contact us / Share the app ---------- */
function hasContact(){var c=contact();return !!(c.wa||c.mail||c.page)}
function contactUs(){var c=contact(),b=[];
  if(c.wa)b.push({u:waLink(c.wa,'Hello START TIME,'+sig()),n:'WhatsApp',p:1});
  if(c.mail)b.push({u:'mailto:'+c.mail,n:'Email'});
  if(c.page)b.push({u:c.page,n:'Open the page'});
  if(!b.length)return;
  if(b.length===1){window.open(b[0].u,'_blank','noopener');return}   // one way only: straight there
  ST.modal('Contact us','<p>How would you like to reach START TIME?</p><div class="row">'+b.map(function(x){return '<a class="btn'+(x.p?' pri':'')+'" href="'+esc(x.u)+'" target="_blank" rel="noopener">'+x.n+'</a>'}).join('')+'</div>')}
function share(){var c=contact(),u=c.shareUrl||siteUrl(),t=c.shareMsg||'START TIME — '+PROGRAM;
  if(navigator.share){navigator.share({title:t,text:c.shareMsg||'',url:u}).catch(function(){});return}
  var done=function(ok){ST.modal('Share the app','<p>'+(ok?'The link is copied. Paste it to share the app.':'Copy this link to share the app:')+'</p><p class="mono pf-link">'+esc(u)+'</p>')};
  try{navigator.clipboard.writeText(u).then(function(){done(true)},function(){done(false)})}catch(e){done(false)}}

/* ---------- routing: core.js calls ST.shellRoute(hash) before its own pages ---------- */
ST.shellRoute=function(h){
  if(!on())return false;
  if(h==='#/home')dash();else if(h==='#/courses'&&pf('pf.courses'))coursesPage();else if(h==='#/certs'&&pf('pf.certs'))certs();else if(h==='#/me'&&pf('pf.profile'))me();
  else return false;
  document.body.classList.add('pf-on');window.scrollTo(0,0);return true};
/* the course home (#/) keeps its own page and header; a slim line above it leads back to the dashboard */
function back(){if(!on())return;var h=location.hash||'#/';if(h!=='#/'&&h!=='#')return;var app=$('#app');if(!app||$('.pf-back',app))return;
  var b=el('a','pf-back',I.home+'<span>My dashboard</span>');b.href='#/home';app.insertBefore(b,app.firstChild)}
window.addEventListener('hashchange',function(){if(!/^#\/(home|courses|certs|me)$/.test(location.hash))document.body.classList.remove('pf-on');setTimeout(back,0)});   // after core's route() has drawn the page
/* the first open of a tab with no hash lands on the dashboard (a link to #/ or a topic goes where it says) */
var route0=ST.route;if(route0)ST.route=function(){route0();back()};   // sync.js redraws the home page after a sync: the line comes back
var start0=ST.start;
ST.start=function(){
  if(on()){var seen=false;try{seen=sessionStorage.getItem('st-pf-in')==='1';sessionStorage.setItem('st-pf-in','1')}catch(e){}
    if(!seen&&(location.hash===''||location.hash==='#'))location.replace('#/home')}
  start0();back()};
})();
