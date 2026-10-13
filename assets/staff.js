/* START TIME — staff panel (#/staff). Every action is sent to the instructor's Apps Script, which checks the caller's role
   on the Roles sheet before doing anything and writes an Audit log row. Tabs appear only for the permissions the role has. */
(function(){
'use strict';
var ST=window.ST,el=ST.h.el,$=ST.h.$,$$=ST.h.$$,esc=ST.h.esc;
var TABS=[
  {id:'register',label:'Register a student',perm:['addStudent']},
  {id:'find',label:'Find a student',perm:['manageStudents','extendReset']},
  {id:'progress',label:'Progress report',perm:['progressReport']},
  {id:'questions',label:'Question stats',perm:['progressReport']},
  {id:'log',label:'Activity log',perm:['auditLog']},
  {id:'settings',label:'Reading time',perm:['readTime']},
  {id:'team',label:'My team',perm:['assignStaff']}
];
function allowed(t){return t.perm.some(function(k){return ST.canStaff(k)})}
ST.staffTabs=function(){return ST.role==='trainer'?TABS.filter(allowed):[]};

function call(action,data){return ST.adminCall(action,data||{})}
function msg(box,text,bad){box.innerHTML=text?'<div class="fb '+(bad?'bad':'ok')+'">'+esc(text)+'</div>':''}
function busy(btn,on,label){if(!btn)return;if(on){btn.dataset.l=btn.textContent;btn.textContent=label||'Working…';btn.disabled=true}else{btn.textContent=btn.dataset.l||btn.textContent;btn.disabled=false}}
function copy(text,btn){
  var done=function(){if(btn){var l=btn.textContent;btn.textContent='Copied ✓';setTimeout(function(){btn.textContent=l},1500)}};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fallback()});return}
  fallback();
  function fallback(){var ta=el('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done()}catch(e){}ta.remove()}
}
function siteUrl(){return location.origin+location.pathname}
function statusOf(s){
  var st=s.status||'';if(st)return st;
  if(!s.active)return s.name?'Off':'Free';
  if(s.daysLeft!==''&&s.daysLeft<0)return 'Expired';
  return s.lastSeen?'Active':'Not signed in yet';
}
/* groups = the group columns of the Access sheet; every list of them is a dropdown */
var GROUPS=null,GALL=true;                                             // GALL: this staff member has every group (the owner, or All)
function groupsReady(){if(GROUPS)return Promise.resolve(GROUPS);return call('groups').then(function(r){GROUPS=(r&&r.ok&&r.groups)||[];GALL=!(r&&r.ok&&r.all===false);return GROUPS}).catch(function(){GROUPS=[];return GROUPS})}
function noGroupLabel(){return GALL?'— no group yet (sees nothing) —':'— choose one of your groups —'}
function gOpts(sel,first){return '<option value="">'+esc(first)+'</option>'+(GROUPS||[]).map(function(g){return '<option'+(g===sel?' selected':'')+'>'+esc(g)+'</option>'}).join('')}
/* ---------- sort and filter for the staff tables (progress report, question stats, activity log) ----------
   tableKit(bar, table, cfg, state): click a column title to sort (again = the other way); a search box over every cell;
   a drop-down per filter (values come from the rows' data-f-<key>); "Showing x of y". Rows that do not match are taken out of the
   table (not hidden), so Excel exports what is shown. state lives with the view, so a redraw keeps the choices. */
var DASH=/^(—|-|–|)$/;
function sortKey(t){t=String(t||'').replace(/\s+/g,' ').trim();if(DASH.test(t)||/^needs /.test(t))return null;
  var m=t.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?/);if(m)return +(m[3]+m[2]+m[1]+(m[4]||'00')+(m[5]||'00'));   // dd/mm/yyyy hh:mm
  m=t.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);if(m)return +(m[1]+m[2]+m[3]+(m[4]||'00')+(m[5]||'00'));                // yyyy-mm-dd hh:mm
  m=t.match(/^(\d+):(\d{2})\b/);if(m)return +m[1]*60+ +m[2];                                                                      // m:ss
  m=t.match(/^-?\d[\d,]*(\.\d+)?/);if(m)return parseFloat(m[0].replace(/,/g,''));                                                  // 82%, 214 / 269, 0.35 fair
  return t.toLowerCase()}
function tableKit(bar,table,cfg,st){
  var tb=table.tBodies[0];if(!tb)return;var rows=Array.prototype.slice.call(tb.rows),ths=Array.prototype.slice.call(table.tHead.rows[0].cells);
  var keys=rows.map(function(r){return Array.prototype.map.call(r.cells,function(c){return sortKey(c.textContent)})});
  rows.forEach(function(r,i){r._k=keys[i];r._t=r.textContent.toLowerCase()});
  st.f=st.f||{};
  var fl=(cfg.filters||[]).map(function(f){var seen={};rows.forEach(function(r){var v=r.getAttribute('data-f-'+f.k);if(v)seen[v]=(seen[v]||0)+1});
    var vals=Object.keys(seen);vals.sort(f.order||function(a,b){return a.localeCompare(b)});
    if(st.f[f.k]&&!seen[st.f[f.k]])delete st.f[f.k];
    return vals.length?'<select class="sel-in sm" data-fk="'+f.k+'" aria-label="'+esc(f.l)+'"><option value="">'+esc(f.all||('All — '+f.l.toLowerCase()))+'</option>'+
      vals.map(function(v){return '<option value="'+esc(v)+'"'+(st.f[f.k]===v?' selected':'')+'>'+esc(v)+' ('+seen[v]+')</option>'}).join('')+'</select>':''}).join('');
  bar.innerHTML='<div class="tk"><input class="inp tk-q" type="search" placeholder="'+esc(cfg.ph||'Search the list')+'" aria-label="Search the list" value="'+esc(st.q||'')+'">'+fl+
    '<button class="btn sm ghost tk-x" type="button">Clear</button><span class="note tk-n" aria-live="polite"></span></div>';
  ths.forEach(function(th,i){if(cfg.nosort&&cfg.nosort.indexOf(i)>=0)return;var txt=th.innerHTML;
    th.innerHTML='<button type="button" class="th-b" title="Sort by this column">'+txt+'<span class="ar" aria-hidden="true"></span></button>';
    th.firstChild.onclick=function(){var num=rows.some(function(r){return typeof r._k[i]==='number'});
      if(st.sc===i)st.sd=-st.sd;else{st.sc=i;st.sd=num?-1:1}apply()}});   // numbers and dates: highest / newest first; text: A → Z
  var q=$('.tk-q',bar),n=$('.tk-n',bar);
  q.oninput=function(){st.q=q.value;apply()};
  $$('[data-fk]',bar).forEach(function(s){s.onchange=function(){if(s.value)st.f[s.dataset.fk]=s.value;else delete st.f[s.dataset.fk];apply()}});
  $('.tk-x',bar).onclick=function(){st.q='';st.f={};st.sc=null;q.value='';$$('[data-fk]',bar).forEach(function(s){s.value=''});apply()};
  function apply(){var w=(st.q||'').trim().toLowerCase().split(/\s+/).filter(String);
    var list=rows.filter(function(r){if(w.some(function(x){return r._t.indexOf(x)<0}))return false;
      for(var k in st.f)if(r.getAttribute('data-f-'+k)!==st.f[k])return false;return true});
    if(st.sc!=null){var c=st.sc,d=st.sd;list=list.map(function(r,j){return [r,j]});
      list.sort(function(a,b){var x=a[0]._k[c],y=b[0]._k[c];if(x===y)return a[1]-b[1];if(x==null)return 1;if(y==null)return -1;
        if(typeof x!==typeof y)return typeof x==='number'?-1:1;return (x<y?-1:1)*d});list=list.map(function(p){return p[0]})}
    tb.innerHTML='';list.forEach(function(r,j){if(cfg.num!=null)r.cells[cfg.num].textContent=j+1;tb.appendChild(r)});
    ths.forEach(function(th,i){var on=st.sc===i,a=$('.ar',th);th.setAttribute('aria-sort',on?(st.sd>0?'ascending':'descending'):'none');if(a)a.textContent=on?(st.sd>0?' ▲':' ▼'):''});
    var fil=w.length||Object.keys(st.f).length;$('.tk-x',bar).hidden=!fil&&st.sc==null;
    n.textContent=fil?'Showing '+list.length+' of '+rows.length:rows.length+' row'+(rows.length===1?'':'s');
    if(cfg.done)cfg.done(list.length,rows.length)}
  apply()}
function chip(st){var c={'Active':'t','Not signed in yet':'g','Expired':'r','Off':'','Free':''}[st];return '<span class="chip '+(c||'')+'">'+esc(st)+'</span>'}

ST.staffView=function(tab){
  var app=$('#app'),tabs=ST.staffTabs();
  if(!tabs.length){location.hash='#/';return}
  var cur=tabs.filter(function(t){return t.id===tab})[0]||tabs[0];
  app.innerHTML='';
  var page=el('div','stf');
  page.appendChild(el('div','stf-h','<h1>Staff panel</h1><p class="note">Signed in as <b>'+esc((ST.session()||{}).name||'')+'</b> · '+esc((ST.staffRole||'').toUpperCase())+'. Everything you do here is saved to the instructor\'s sheet and recorded in the activity log.</p>'));
  var nav=el('div','stf-tabs');
  tabs.forEach(function(t){var a=el('a','btn'+(t===cur?' pri':''),esc(t.label));a.href='#/staff/'+t.id;nav.appendChild(a)});
  page.appendChild(nav);
  var body=el('div','stf-b');page.appendChild(body);app.appendChild(page);window.scrollTo(0,0);
  ({register:register,find:find,progress:progress,questions:qstats,log:logView,settings:settingsView,team:team})[cur.id](body);
};

/* ---------- register ---------- */
function register(b){
  b.innerHTML='<section class="stf-card"><h2>Register a new student</h2>'+
    '<p class="note">The student gets the next free code, switched on at once. The code works on the number of devices set on the sheet.</p>'+
    '<div class="kv hi"><span>Next free code</span><b id="sfNext" class="mono">…</b></div>'+
    '<form id="sfForm" class="stf-form" autocomplete="off">'+
    '<p class="note wide">Every field is optional. Anything left empty, the student fills in at his first sign-in; what you type here he confirms or corrects there, and his own entry is the one kept.</p>'+
    '<label>Full name<input class="inp" name="name" maxlength="80"></label>'+
    '<label>Mobile<input class="inp" name="mobile" inputmode="tel" maxlength="20" placeholder="+966 5x xxx xxxx or +20 1x xxxx xxxx"></label>'+
    '<label>Email<input class="inp" name="email" type="email" maxlength="80"></label>'+
    '<label>Days valid<input class="inp" name="days" inputmode="numeric" maxlength="4" placeholder="Default from the sheet"></label>'+
    '<label>Group<select class="sel-in" name="group" id="sfGrp"><option value="">Loading…</option></select></label>'+
    '<label class="wide">Notes<input class="inp" name="notes" maxlength="200" placeholder="e.g. batch, payment, group"></label>'+
    '<div class="row wide"><button class="btn pri" id="sfGo" type="submit">Register and activate</button></div></form><div id="sfMsg" role="alert"></div></section>';
  var next=$('#sfNext',b),out=$('#sfMsg',b),form=$('#sfForm',b),go=$('#sfGo',b);
  groupsReady().then(function(){return call('nextFree')}).then(function(r){next.textContent=r.ok?r.code:'—';if(r.groups)GROUPS=r.groups;$('#sfGrp',b).innerHTML=gOpts('',noGroupLabel());if(!r.ok)msg(out,r.error,true)}).catch(function(e){next.textContent='—';msg(out,e.message,true)});
  form.onsubmit=function(e){e.preventDefault();
    var f=form.elements,d={name:f.name.value.trim(),mobile:f.mobile.value.trim(),email:f.email.value.trim(),notes:f.notes.value.trim(),days:f.days.value.trim(),group:f.group.value,target:next.textContent!=='…'&&next.textContent!=='—'?next.textContent:''};
    if(d.name&&d.name.length<2){msg(out,'Write the student\'s full name, or leave it empty.',true);f.name.focus();return}
    if(d.days&&!/^\d{1,4}$/.test(d.days)){msg(out,'Days valid must be a number.',true);return}
    busy(go,true,'Saving…');msg(out,'');
    call('addStudent',d).then(function(r){busy(go,false);
      if(!r.ok){msg(out,r.error,true);return}
      done(b,r.student||{code:r.code,name:d.name});
    }).catch(function(e){busy(go,false);msg(out,e.message,true)});
  };
}
function done(b,s){
  var text='أهلاً'+(s.name?' '+s.name:'')+' 👋\nكود دخولك على منصة START TIME — CMA:\n'+s.code+'\nافتح الرابط واكتب الكود:\n'+siteUrl()+'\nالكود شخصي ويشتغل على عدد محدود من الأجهزة.';
  b.innerHTML='<section class="stf-card ok"><h2>Registered ✓</h2>'+
    '<div class="kv"><span>Student</span><b>'+(s.name?esc(s.name):'<span class="note">fills in his details on first sign-in</span>')+'</b></div><div class="kv hi"><span>Code</span><b class="mono big">'+esc(s.code)+'</b></div>'+
    (s.daysValid?'<div class="kv"><span>Days valid</span><b>'+esc(s.daysValid)+'</b></div>':'')+
    '<p class="note">Message to send to the student:</p><pre class="stf-msg">'+esc(text)+'</pre>'+
    '<div class="row"><button class="btn pri" id="sfCopyM">Copy message</button><button class="btn" id="sfCopyC">Copy code</button><button class="btn ghost" id="sfMore">Register another</button></div></section>';
  $('#sfCopyM',b).onclick=function(){copy(text,this)};$('#sfCopyC',b).onclick=function(){copy(s.code,this)};$('#sfMore',b).onclick=function(){register(b)};
}

/* ---------- find ---------- */
function find(b){
  b.innerHTML='<section class="stf-card"><h2>Find a student</h2><form id="sqForm" class="row stf-search" autocomplete="off"><input class="inp" id="sq" placeholder="Name, code'+(ST.canStaff('addStudent')||ST.canStaff('manageStudents')?', mobile or email':'')+'"><select class="sel-in" id="sqG" aria-label="Group"><option value="">All groups</option></select><button class="btn pri" type="submit">Search</button></form><div id="sqMsg" role="alert"></div></section><div id="sqRes" class="stf-list"></div>';
  var q=$('#sq',b),out=$('#sqMsg',b),res=$('#sqRes',b),gs=$('#sqG',b);setTimeout(function(){q.focus()},50);
  groupsReady().then(function(){gs.innerHTML=gOpts('','All groups')});
  gs.onchange=function(){if(gs.value&&q.value.trim().length<2)$('#sqForm',b).requestSubmit?$('#sqForm',b).requestSubmit():$('#sqForm',b).onsubmit({preventDefault:function(){}})};
  $('#sqForm',b).onsubmit=function(e){e.preventDefault();var v=q.value.trim(),g=gs.value;if(v.length<2&&!g){msg(out,'Type at least 2 letters or digits, or pick a group.',true);return}
    msg(out,'Searching…');res.innerHTML='';
    call('search',{q:v.length>=2?v:'',group:g}).then(function(r){if(!r.ok){msg(out,r.error,true);return}
      if(r.groups)GROUPS=r.groups;
      msg(out,r.results.length?(r.results.length+' found'+(r.more?' — showing the first '+r.results.length+', narrow the search':'')):'Nothing found.');
      r.results.forEach(function(s){res.appendChild(card(s))});
    }).catch(function(e){msg(out,e.message,true)})};
}
function card(s){
  var c=el('article','stf-card stf-st');
  function paint(){
    var st=statusOf(s);
    c.innerHTML='<div class="stf-top"><div><b>'+esc(s.name||'(no name)')+'</b> <span class="mono note">'+esc(s.code)+'</span></div>'+chip(st)+'</div>'+
      '<div class="stf-meta">'+[s.mobile?'📱 '+esc(s.mobile):'',s.email?'✉ '+esc(s.email):'',
        s.expires?'Ends '+esc(s.expires)+(s.daysLeft!==''?' ('+s.daysLeft+' days left)':''):((s.daysValid||s.defDays)?esc(s.daysValid||s.defDays)+' days, starting at the first sign-in'+(s.daysValid?'':' (default)'):'No end date'),
        'Devices '+s.devices,s.lastSeen?'Last seen '+esc(s.lastSeen):'Never signed in',s.mastery!==''?'Mastery '+s.mastery+'%':'',
        s.assignedBy?'Registered by '+esc(s.assignedBy)+(s.assignedOn?' on '+esc(s.assignedOn):''):'',
        'Group: '+(s.group?'<b>'+esc(s.group)+'</b>':'<b class="bad-t">none — sees no topic</b>')+(s.extra?' · extra: '+esc(s.extra):'')].filter(String).map(function(x){return '<span>'+x+'</span>'}).join('')+'</div>'+
      (s.notes?'<div class="note">'+esc(s.notes)+'</div>':'')+
      '<div class="row stf-act"></div><div class="stf-m" role="alert"></div>';
    var act=$('.stf-act',c),m=$('.stf-m',c);
    function run(btn,action,data,label){busy(btn,true);msg(m,'');call(action,Object.assign({target:s.code},data)).then(function(r){
      if(!r.ok){busy(btn,false);msg(m,r.error,true);return}s=r.student||s;paint();msg($('.stf-m',c),label)}).catch(function(e){busy(btn,false);msg(m,e.message,true)})}
    if(ST.canStaff('manageStudents')&&(s.name||s.active)){
      var gsel=el('select','sel-in sm');gsel.setAttribute('aria-label','Group of '+(s.name||s.code));gsel.innerHTML=gOpts(s.group,GALL?'— no group —':'— choose —');
      gsel.onchange=function(){gsel.disabled=true;run(null,'setGroup',{group:gsel.value},gsel.value?'Moved to '+gsel.value+'.':'Group removed — the student now sees no topic.')};
      groupsReady().then(function(){gsel.innerHTML=gOpts(s.group,GALL?'— no group —':'— choose —')});act.appendChild(gsel);
      var t=el('button','btn sm'+(s.active?'':' pri'),s.active?'Stop code':'Resume code');
      t.onclick=function(){run(t,'setActive',{active:!s.active},s.active?'Code stopped.':'Code resumed.')};act.appendChild(t)}
    if(ST.canStaff('extendReset')&&(s.name||s.active)){
      [30,90].forEach(function(d){var x=el('button','btn sm','+'+d+' days');x.onclick=function(){run(x,'extend',{days:d},'Extended by '+d+' days.')};act.appendChild(x)});
      var o=el('span','stf-other','<input class="inp sm" inputmode="numeric" maxlength="4" placeholder="days"><button class="btn sm">Add</button>');
      $('button',o).onclick=function(){var v=$('input',o).value.trim();if(!/^\d{1,4}$/.test(v)){msg(m,'Type the number of days.',true);return}run(this,'extend',{days:+v},'Extended by '+v+' days.')};
      act.appendChild(o);
      var rd=el('button','btn sm ghost','Reset devices');
      rd.onclick=function(){if(rd.dataset.sure){run(rd,'resetDevices',{},'Devices cleared — the student can sign in again on a new device.');return}
        rd.dataset.sure='1';rd.textContent='Confirm reset';rd.classList.add('pri');setTimeout(function(){if(rd.isConnected&&rd.dataset.sure){delete rd.dataset.sure;rd.textContent='Reset devices';rd.classList.remove('pri')}},5000)};
      act.appendChild(rd)}
  }
  paint();return c;
}

/* ---------- progress ---------- */
/* "160 / 269" + 40 marked → on time 120 / 269 · button 40 (shown in red so skipping stands out) */
function readCells(r){var p=String(r.read||'').split('/'),rd=parseInt(p[0],10),cn=(p[1]||'').trim(),m=+r.marked||0;
  if(isNaN(rd))return '<td>'+esc(r.read)+'</td><td></td>';
  return '<td>'+Math.max(0,rd-m)+(cn?' / '+esc(cn):'')+'</td><td>'+(m?'<b class="bad-t">'+m+'</b>':'0')+'</td>'}
function progress(b){
  b.innerHTML='<section class="stf-card"><h2>Progress report</h2><div class="row stf-search"><select class="sel-in" id="prG" aria-label="Group"><option value="">All groups</option></select>'+(ST.canStaff('excel')?'<button class="btn" id="prX">Excel</button>':'')+'</div><div id="prK"></div><div id="prMsg" role="alert"><div class="fb">Loading…</div></div><div class="tw" id="prT"></div></section>';
  var out=$('#prMsg',b),box=$('#prT',b),rows=[],kst={};
  var band=function(v){return v===''||v==null?'No practice yet':v>=75?'Ready (75%+)':v>=50?'Getting there (50–74%)':'Not ready (under 50%)'};
  function draw(){var list=rows;
    box.innerHTML='<table class="t"><thead><tr><th>#</th><th>Name</th><th>Code</th><th>Group</th><th>Mastery</th><th title="Every practice question of the section: right answers (less for guesses and answers due for review) × pace. 75%+ = ready to book the exam">Exam readiness</th><th>Topics mastered</th><th>Practice correct</th><th>Read on time</th><th>Marked with button</th><th>Last study</th></tr></thead><tbody>'+
      list.map(function(r,i){return '<tr data-f-g="'+esc(r.group||'— no group')+'" data-f-r="'+esc(band(r.ready))+'"><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td class="mono">'+esc(r.code)+'</td><td>'+esc(r.group||'—')+'</td><td>'+r.mastery+'%</td><td>'+(r.ready===''||r.ready==null?'—':'<span class="'+(r.ready>=75?'ok-t':r.ready<50?'bad-t':'')+'">'+r.ready+'%</span>')+'</td><td>'+esc(r.mastered)+'</td><td>'+esc(r.correct)+'</td>'+readCells(r)+'<td>'+esc(r.last)+'</td></tr>'}).join('')+'</tbody></table>';
    msg(out,'');tableKit($('#prK',b),$('table.t',box),{num:0,nosort:[0],ph:'Search: name, code, group…',filters:[{k:'g',l:'Group',all:'Every group in the list'},{k:'r',l:'Readiness',all:'Any readiness'}]},kst)}
  var gsel=$('#prG',b);
  function load(){msg(out,'Loading…');call('report',{group:gsel.value}).then(function(r){if(!r.ok){msg(out,r.error,true);return}rows=r.rows||[];if(r.groups&&!GROUPS){GROUPS=r.groups;gsel.innerHTML=gOpts(gsel.value,'All groups')}draw()}).catch(function(e){msg(out,e.message,true)})}
  groupsReady().then(function(){gsel.innerHTML=gOpts(gsel.value,'All groups')});
  gsel.onchange=load;load();
  if($('#prX',b))$('#prX',b).onclick=function(){var t=$('table.t',box);if(t&&ST.exportTables)ST.exportTables([{h:'Student progress',tables:[t]}],'Student progress','student-progress')};
}

/* ---------- reading time (Settings → Seconds to count a slide as read) ---------- */
function settingsView(b){
  b.innerHTML='<section class="stf-card"><h2>Reading time</h2><p class="note">How long a concept slide must stay on screen before it counts as read. Moving on sooner does not count it. Students get the new time the next time they open the deck.</p>'+
    '<form id="rtForm" class="stf-form" autocomplete="off"><label>Minutes<input class="inp" id="rtM" inputmode="numeric" maxlength="2"></label><label>Seconds<input class="inp" id="rtS" inputmode="numeric" maxlength="2"></label>'+
    '<div class="row wide"><button class="btn sm" type="button" data-p="30">30 s</button><button class="btn sm" type="button" data-p="60">1 min</button><button class="btn sm" type="button" data-p="120">2 min</button><button class="btn sm" type="button" data-p="180">3 min (default)</button><button class="btn sm" type="button" data-p="300">5 min</button></div>'+
    '<div class="row wide"><button class="btn pri" id="rtGo" type="submit">Save</button><span class="note" id="rtNow"></span></div></form><div id="rtMsg" role="alert"></div></section>';
  var out=$('#rtMsg',b),mI=$('#rtM',b),sI=$('#rtS',b),go=$('#rtGo',b);
  function show(sec){mI.value=Math.floor(sec/60);sI.value=sec%60;$('#rtNow',b).textContent='Now: '+(sec>=60?Math.floor(sec/60)+' min '+(sec%60?sec%60+' s':''):sec+' s')}
  call('readTime').then(function(r){if(!r.ok){msg(out,r.error,true);return}show(r.seconds)}).catch(function(e){msg(out,e.message,true)});
  $$('[data-p]',b).forEach(function(x){x.onclick=function(){var v=+x.dataset.p;mI.value=Math.floor(v/60);sI.value=v%60}});
  $('#rtForm',b).onsubmit=function(e){e.preventDefault();var sec=(parseInt(mI.value,10)||0)*60+(parseInt(sI.value,10)||0);
    if(sec<5||sec>900){msg(out,'Choose between 5 seconds and 15 minutes.',true);return}
    busy(go,true,'Saving…');call('setReadTime',{seconds:sec}).then(function(r){busy(go,false);if(!r.ok){msg(out,r.error,true);return}show(r.seconds);msg(out,'Saved. Students get it the next time they open the deck.')}).catch(function(e){busy(go,false);msg(out,e.message,true)})};
}

/* ---------- question stats: which practice questions the students get wrong (their latest answer), by group ---------- */
function qstats(b){
  b.innerHTML='<section class="stf-card"><h2>Question stats</h2><p class="note">For every practice question: how many students answered it, how many have it <b>right now</b> (their latest answer), their average time (exam pace: 1:48 a multiple-choice question), the <b>most common wrong answer</b> — the confusion to explain in the next lecture — and, from 8 students, the <b>discrimination</b>: right answers among the strongest 27% minus the weakest 27%. 0.30 or more separates well; under 0.10 needs a look; below 0 usually means the key or the wording is off. The hardest come first.</p>'+
    '<div class="row stf-search"><select class="sel-in" id="qsG" aria-label="Group"><option value="">All groups</option></select><select class="sel-in" id="qsT" aria-label="Topic"><option value="">All topics</option></select>'+
    '<label class="ck" style="margin:0"><input type="checkbox" id="qsMin" checked><span>Only questions 3+ students answered</span></label>'+(ST.canStaff('excel')?'<button class="btn" id="qsX">Excel</button>':'')+'</div>'+
    '<div id="qsK"></div><div id="qsMsg" role="alert"><div class="fb">Loading…</div></div><div class="tw" id="qsT2"></div></section>';
  var out=$('#qsMsg',b),box=$('#qsT2',b),gsel=$('#qsG',b),tsel=$('#qsT',b),data=null,map={},kst={};
  ST.topics.forEach(function(t){if(t.soon)return;var n=0;t.slides.forEach(function(s,i){if(!ST.isPractice(s))return;n++;map[ST.slideKey(t,i)]={t:t,i:i,s:s,n:n}})});
  tsel.innerHTML='<option value="">All topics</option>'+ST.topics.filter(function(t){return !t.soon}).map(function(t){return '<option value="'+t.id+'">'+esc(t.group+' · '+t.n)+'</option>'}).join('');
  function strip(h){var d=document.createElement('div');d.innerHTML=h||'';return d.textContent||''}
  /* "o:2" → C — the option text; other kinds of question: the wrong values most students gave */
  function wrongTxt(r){if(!r.w||!r.wn)return '—';var s=r.m.s,kd=r.w.charAt(0),v=r.w.slice(2),of=' <span class="note">('+r.wn+' of '+(r.n-r.c)+' wrong)</span>';
    if(kd==='o'&&(s.t==='mcq'||s.t==='multi')){var ix=v===''?[]:v.split(',').map(Number);return ix.length?esc(ix.map(function(i){return 'ABCDEFGH'[i]}).join(', ')+(ix.length===1&&s.o[ix[0]]!=null?' — '+strip(s.o[ix[0]]).slice(0,70):''))+of:'nothing selected'+of}
    if(kd==='v')return esc(v.split('|').join(' · ').slice(0,60))+of;
    if(kd==='d'&&s.f)return esc(v.split(',').map(function(c,j){var f=s.f[j];return c===''||!f?'—':strip(f.o[+c]||'')}).join(' · ').slice(0,80))+of;
    return r.wn>1?'same mistake'+of:'—'}
  function discTxt(d){if(d==null)return '<span class="note">needs 8+ students</span>';var t=d>=0.3?['ok-t','separates well']:d>=0.1?['','fair']:d>=0?['bad-t','review the question']:['bad-t','check the key'];
    return '<b class="'+t[0]+'">'+d.toFixed(2)+'</b> <span class="note">'+t[1]+'</span>'}
  function draw(){if(!data)return;var tf=tsel.value,min=$('#qsMin',b).checked?3:1;
    var rows=(data.items||[]).map(function(x){var m=map[x.k];return m?{m:m,n:x.n,c:x.c,t:x.t||0,p:x.n?Math.round(x.c/x.n*100):0,d:x.d,w:x.w||'',wn:x.wn||0}:null}).filter(function(r){return r&&r.n>=min&&(!tf||r.m.t.id===tf)});
    rows.sort(function(a,c){return a.p-c.p||c.n-a.n});
    box.innerHTML=rows.length?'<table class="t"><thead><tr><th>#</th><th>Question</th><th>LOS</th><th>Level</th><th class="n">Answered</th><th class="n">Right now</th><th class="n">Wrong</th><th>Correct</th><th class="n">Avg time</th><th>Most common wrong answer</th><th>Discrimination</th></tr></thead><tbody>'+
      rows.map(function(r,i){var h=strip(r.m.s.h||'').replace(/^(Practice|Exam-style question)\s*:?\s*/i,'');
        var dq=r.d==null?'Needs 8+ students':r.d>=0.3?'Separates well':r.d>=0.1?'Fair':r.d>=0?'Review the question':'Check the key';
        return '<tr data-f-los="'+esc(ST.losOf(r.m.s).join(', '))+'" data-f-lv="'+esc((ST.BLOOM||{})[r.m.s.bl]||'—')+'" data-f-d="'+dq+'" data-f-p="'+(r.p<50?'Under 50% right':r.p<75?'50–74% right':'75%+ right')+'"><td>'+(i+1)+'</td><td><a href="#/t/'+r.m.t.id+'/'+(r.m.i+1)+'"><b>'+esc(r.m.t.n)+'</b> · slide '+(r.m.i+1)+' · Practice '+r.m.n+(h?' — '+esc(h):'')+'</a></td><td>'+esc(ST.losOf(r.m.s).join(', '))+'</td><td>'+esc((ST.BLOOM||{})[r.m.s.bl]||'—')+'</td><td class="n">'+r.n+'</td><td class="n">'+r.c+'</td><td class="n">'+(r.n-r.c)+'</td>'+
          '<td><span class="qbar"><i style="width:'+r.p+'%;background:'+(r.p<50?'var(--red)':r.p<75?'var(--gold)':'var(--teal)')+'"></i></span> '+r.p+'%</td>'+
          '<td class="n">'+(r.t?Math.floor(r.t/60)+':'+('0'+r.t%60).slice(-2)+(ST.qBudget&&r.t>ST.qBudget(r.m.s)*1.5?' <span class="bad-t">slow</span>':''):'—')+'</td>'+
          '<td>'+wrongTxt(r)+'</td><td>'+discTxt(r.d)+'</td></tr>'}).join('')+'</tbody></table>':'';
    msg(out,rows.length?data.students+' student'+(data.students===1?'':'s')+' with practice answers'+(gsel.value?' in '+gsel.value:'')+' · '+rows.length+' question'+(rows.length===1?'':'s')+' (hardest first until you sort)':'No answers yet'+(min>1?' from 3 or more students':'')+' for this selection.');
    if(rows.length)tableKit($('#qsK',b),$('table.t',box),{num:0,nosort:[0],ph:'Search: topic, LOS, wrong answer…',filters:[{k:'p',l:'Right now',all:'Any score'},{k:'d',l:'Discrimination',all:'Any discrimination'},{k:'lv',l:'Level',all:'Any level'},{k:'los',l:'LOS',all:'Every LOS'}]},kst);else $('#qsK',b).innerHTML=''}
  function load(){msg(out,'Loading…');data=null;box.innerHTML='';
    call('qstats',{group:gsel.value}).then(function(r){if(!r.ok){msg(out,r.error,true);return}data=r;if(r.groups&&!GROUPS){GROUPS=r.groups;gsel.innerHTML=gOpts(gsel.value,'All groups')}draw()}).catch(function(e){msg(out,e.message,true)})}
  groupsReady().then(function(){gsel.innerHTML=gOpts(gsel.value,'All groups')});
  gsel.onchange=load;tsel.onchange=draw;$('#qsMin',b).onchange=draw;load();
  if($('#qsX',b))$('#qsX',b).onclick=function(){var t=$('table.t',box);if(t&&ST.exportTables)ST.exportTables([{h:'Question stats',tables:[t]}],'Question stats','question-stats')};
}

/* ---------- my team: give a staff member some of my groups (e.g. my secretary) ---------- */
function team(b){
  b.innerHTML='<section class="stf-card"><h2>My team</h2><p class="note">Give a staff member — your secretary or assistant, say — some of <b>your</b> groups. They then see and follow only the students of those groups. <b>All my groups</b> keeps them in step with you: a group you get later is theirs too. You can change only what you gave; groups others gave stay as they are.</p><div id="tmMsg" role="alert"><div class="fb">Loading…</div></div></section><div id="tmList" class="stf-list"></div>';
  var out=$('#tmMsg',b),list=$('#tmList',b);
  call('staff').then(function(r){if(!r.ok){msg(out,r.error,true);return}
    msg(out,r.staff.length?'':'No other staff codes on the sheet yet.');
    if(!r.groups.length&&!r.all){msg(out,'You have no groups yet, so there is nothing to give. Ask the owner to give you your groups.',true);return}
    r.staff.forEach(function(p){list.appendChild(member(p,r))})}).catch(function(e){msg(out,e.message,true)});
}
function member(p,r){
  var c=el('article','stf-card stf-st'),allLbl=r.owner?'All groups (the whole academy)':'All my groups (now and later)',on=r.owner?p.allAcademy:p.follows;
  c.innerHTML='<div class="stf-top"><div><b>'+esc(p.name)+'</b> <span class="note">'+esc(p.role)+'</span></div>'+(p.active?'':'<span class="chip">Off</span>')+'</div>'+
    '<div class="tm-g"><label class="ck"><input type="checkbox" data-all="1"'+(on?' checked':'')+'><span><b>'+esc(allLbl)+'</b></span></label>'+
    r.groups.map(function(g){return '<label class="ck"><input type="checkbox" data-g="'+esc(g)+'"'+(p.mine.indexOf(g)>=0?' checked':'')+(on?' disabled':'')+'><span>'+esc(g)+'</span></label>'}).join('')+'</div>'+
    (p.others.length?'<p class="note">Also has, from others: '+esc(p.others.join(', '))+'</p>':'')+
    '<div class="row"><button class="btn sm pri" type="button">Save</button></div><div class="stf-m" role="alert"></div>';
  var all=$('[data-all]',c),boxes=$$('[data-g]',c),go=$('button',c),m=$('.stf-m',c);
  all.onchange=function(){boxes.forEach(function(x){x.disabled=all.checked})};
  go.onclick=function(){var d={target:p.id};if(all.checked){if(r.owner)d.allAcademy=true;else d.follow=true}else d.groups=boxes.filter(function(x){return x.checked}).map(function(x){return x.dataset.g});
    busy(go,true,'Saving…');msg(m,'');call('setStaff',d).then(function(x){busy(go,false);if(!x.ok){msg(m,x.error,true);return}msg(m,'Saved.')}).catch(function(e){busy(go,false);msg(m,e.message,true)})};
  return c;
}

/* ---------- activity log ---------- */
function logView(b){
  b.innerHTML='<section class="stf-card"><h2>Activity log</h2><p class="note">The newest first. Sort by any column, search, or pick a day, a person, a role or a kind of action. The full log is the Audit log sheet.</p>'+
    '<div class="row stf-search"><select class="sel-in" id="lgN" aria-label="How many actions"><option value="300">The latest 300 actions</option><option value="1000">The latest 1,000</option><option value="3000">The latest 3,000</option></select>'+(ST.canStaff('excel')?'<button class="btn" id="lgX">Excel</button>':'')+'</div>'+
    '<div id="lgK"></div><div id="lgMsg" role="alert"><div class="fb">Loading…</div></div><div class="tw" id="lgT"></div></section>';
  var out=$('#lgMsg',b),box=$('#lgT',b),ns=$('#lgN',b),kst={};
  var day=function(t){var m=String(t).match(/^(\d{2})\/(\d{2})\/(\d{4})/);return m?m[0]:''};
  var newest=function(a,c){var k=function(s){var m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);return m?m[3]+m[2]+m[1]:s};return k(c).localeCompare(k(a))};
  function load(){msg(out,'Loading…');box.innerHTML='';$('#lgK',b).innerHTML='';
  call('audit',{n:+ns.value}).then(function(r){if(!r.ok){msg(out,r.error,true);return}
    msg(out,r.total>(r.items||[]).length?'The sheet holds '+r.total+' actions; the latest '+(r.items||[]).length+' are here.':'');
    box.innerHTML='<table class="t"><thead><tr><th>Time</th><th>Who</th><th>Role</th><th>Action</th><th>Code</th><th>Details</th></tr></thead><tbody>'+
      (r.items||[]).map(function(x){return '<tr data-f-day="'+esc(day(x.time))+'" data-f-who="'+esc(x.who)+'" data-f-role="'+esc(x.role)+'" data-f-act="'+esc(String(x.action).replace(/!.*$/,''))+'"><td>'+esc(x.time)+'</td><td>'+esc(x.who)+(x.code?' <span class="note">'+esc(x.code)+'</span>':'')+'</td><td>'+esc(x.role)+'</td><td>'+esc(x.action)+'</td><td class="mono">'+esc(x.target)+'</td><td>'+esc(x.details)+'</td></tr>'}).join('')+'</tbody></table>';
    tableKit($('#lgK',b),$('table.t',box),{ph:'Search: name, code, cell, details…',filters:[{k:'day',l:'Day',all:'Any day',order:newest},{k:'who',l:'Who',all:'Anyone'},{k:'role',l:'Role',all:'Any role'},{k:'act',l:'Action',all:'Any action'}]},kst);
  }).catch(function(e){msg(out,e.message,true)})}
  ns.onchange=load;load();
  if($('#lgX',b))$('#lgX',b).onclick=function(){var t=$('table.t',box);if(t&&ST.exportTables)ST.exportTables([{h:'Activity log',tables:[t]}],'Activity log','activity-log')};
}
})();
