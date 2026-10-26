/* START TIME — CMA Part 1 study decks (one per section, see sections.js) · core */
(function(){
'use strict';
var ST=window.ST=window.ST||{};
ST.topics=[];ST.byId={};
function h36(str){var h=5381;for(var i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))|0;return (h>>>0).toString(36)}
ST.topic=function(t){t.slides=t.slides||[];var used={};t.gl=ST._glp||[];ST._glp=[];   // the topic's key terms (ST.gloss), for the Glossary page and the printed glossary
  if(t.sortPractice){   // teach LOS by LOS: each LOS's explanations, then its practice (a practice slide on several LOS comes after the last one); the case and key terms stay at the end
    var P_={mcq:1,multi:1,num:1,sort:1,dd:1,order:1},cs=t.slides.length;
    t.slides.forEach(function(s,i){if(cs===t.slides.length&&s.case)cs=(i>0&&t.slides[i-1].t==='x'&&!t.slides[i-1].case)?i-1:i});
    var L_=function(s,last){var l=s.los?(Array.isArray(s.los)?s.los:[s.los]):[];var v=l.map(function(c){return t.los.indexOf(c)}).filter(function(x){return x>=0});return v.length?(last?Math.max.apply(null,v):Math.min.apply(null,v)):99};
    var head=t.slides.slice(0,cs).map(function(s,i){var pr=!!P_[s.t]||(s.t==='trace'&&s.predict);return {s:s,i:i,g:L_(s,pr),p:pr?1:0}});
    head.sort(function(a,b){return a.g-b.g||a.p-b.p||a.i-b.i});
    t.slides=head.map(function(x){return x.s}).concat(t.slides.slice(cs))}
  /* the lesson, then the topic's section of the question bank. The lesson is the explanation (concept, interactive and key-terms slides);
     every exam-style question and the case go to the bank, in the order written. A slide marked lesson:1 (the closing question or the
     short closing case) stays in the lesson and closes it. t.nL = slides in the lesson (1…nL), t.nB = slides in the bank (nL+1…).
     Practice sets, reviews and readiness still use every question. */
  (function(){var BQ={mcq:1,multi:1,num:1,sort:1,dd:1,order:1},L=[],E=[],Bk=[];
    t.slides.forEach(function(s){if(s.lesson)E.push(s);else if(BQ[s.t]||s.case||s.bank)Bk.push(s);else L.push(s)});
    t.slides=L.concat(E,Bk);t.nL=L.length+E.length;t.nB=Bk.length})();
  t.slides.forEach(function(s,i){var b=h36(s.t+'|'+(s.h||'')+'|'+String(s.q||s.s||s.intro||s.body||'').slice(0,240)),k=b,j=2;while(used[k])k=b+'-'+(j++);used[k]=1;s._k=t.id+'#'+k});
  if(storyOff(t.id))dropStory(t);   // after the keys: progress keys never change when the story is hidden or shown again
  ST.topics.push(t);ST.byId[t.id]=t};
/* ---------- the story (Access → Hide story) ----------
   A topic's story is its "Scenario: …" slide (or a slide marked story:1) and the story lines (<p class="story">) at the top of its explanation slides.
   For a student (or the group a staff member previews) whose story is hidden, the topic loads without them: nothing to see, nothing to print.
   Staff always keep the stories. Cases and questions keep their own text. */
var STORY_RE=/<p class="story[^"]*"[^>]*>[\s\S]*?<\/p>/g;
ST.isScenario=function(s){return !!s&&(s.story===1||s.story===true||(s.t==='x'&&!s.case&&/^Scenario\s*:/i.test(String(s.h||''))))};
ST.hasStory=function(s){return ST.isScenario(s)||(!!s&&s.t==='x'&&!s.case&&typeof s.body==='string'&&/<p class="story/.test(s.body))};
function storyKeys(){var S=ST.session&&ST.session(),r=S&&S.code?(S.role==='student'?'student':'trainer'):'';
  if(r==='student')return S.ns||[];
  if(r==='trainer'&&S.view==='student'&&S.preview)return S.preview.ns||[];
  return []}
function storyOff(id){var ks=storyKeys();if(!ks.length)return false;var pk=(ST.CONFIG&&ST.CONFIG.partKey)||'P1';
  return ks.indexOf(id)>=0||ks.indexOf(pk+'-'+String(id).charAt(0).toUpperCase())>=0||ks.indexOf(pk)>=0}
ST.storyOff=storyOff;
function dropStory(t){var gone=[],nL=t.nL||t.slides.length;
  t.slides=t.slides.filter(function(s,i){if(ST.isScenario(s)){gone.push(i);return false}return true});
  var renum=function(n){var o=n-1;if(gone.indexOf(o)>=0)return 0;return n-gone.filter(function(g){return g<o}).length};   // quick checks point at slide numbers
  t.slides.forEach(function(s){(s.cy||[]).forEach(function(q){if(q[4])q[4]=renum(q[4])});
    if(s.t==='x'&&!s.case&&typeof s.body==='string')s.body=s.body.replace(STORY_RE,'')});
  if(t.nL)t.nL=nL-gone.filter(function(g){return g<nL}).length;
  t.storyOff=true}

/* LOS register of the open section: set by assets/sections.js from assets/los.js */
ST.LOS=ST.LOS||[];
ST.LOSmap={};ST.LOS.forEach(function(l){ST.LOSmap[l.c]=l});

/* ---------- progress store ----------
   Sync-ready: every entry carries a timestamp, resets are tombstones.
   r[k]=ts concept slide read (>= readSec() on screen, or marked read) · mk[k]=ts read with the "Mark as read" button (still counts while mk[k] >= r[k]; staying the full time later turns it into a timed read) · un[k]=ts marked unread by the learner (wins over an older r[k]) · q[k]=[1|0,ts] last answer to a practice slide
   d[tid]=[1|0,ts] topic marked "studied" by the learner · tr[tid]=ts topic reset · R=ts reset of everything */
/* compact synchronous SHA-256 (ASCII input) — used to recognise the private trainer code without storing it */
ST.sha256=function(ascii){
  function rr(v,a){return (v>>>a)|(v<<(32-a))}
  var mp=Math.pow,mw=mp(2,32),i,j,res='',words=[],bl=ascii.length*8,hash=[],k=[],pc=0,comp={};
  for(var c=2;pc<64;c++){if(!comp[c]){for(i=0;i<313;i+=c)comp[i]=c;hash[pc]=(mp(c,.5)*mw)|0;k[pc++]=(mp(c,1/3)*mw)|0}}
  hash=hash.slice(0,8);ascii+='\x80';while(ascii.length%64-56)ascii+='\x00';
  for(i=0;i<ascii.length;i++){j=ascii.charCodeAt(i);if(j>>8)return '';words[i>>2]|=j<<((3-i)%4)*8}
  words[words.length]=((bl/mw)|0);words[words.length]=bl;
  for(j=0;j<words.length;){var w=words.slice(j,j+=16),old=hash;hash=hash.slice(0,8);
    for(i=0;i<64;i++){var w15=w[i-15],w2=w[i-2],a=hash[0],e=hash[4];
      var t1=hash[7]+(rr(e,6)^rr(e,11)^rr(e,25))+((e&hash[5])^((~e)&hash[6]))+k[i]+(w[i]=(i<16)?w[i]:(w[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+w[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
      var t2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
      hash=[(t1+t2)|0].concat(hash);hash[4]=(hash[4]+t1)|0}
    for(i=0;i<8;i++)hash[i]=(hash[i]+old[i])|0}
  for(i=0;i<8;i++)for(j=3;j+1;j--){var b=(hash[i]>>(j*8))&255;res+=((b<16)?0:'')+b.toString(16)}
  return res};
/* ---------- access: session, role and what each role may see ----------
   session (localStorage 'st-p1a-session'): {role:'trainer'|'student', h (trainer), code, name, view:'trainer'|'student', answers:bool} */
var SKEY='st-p1a-session',SESS=null,CFG=ST.CONFIG||{};
try{SESS=JSON.parse(localStorage.getItem(SKEY)||'null')}catch(e){}
/* roles: staff = owner | teacher | assistant (internally 'trainer'); permissions come from the sheet's Roles tab at sign-in */
var ROLE=null;
if(SESS&&SESS.code&&SESS.role==='student')ROLE='student';
else if(SESS&&SESS.code&&SESS.role)ROLE='trainer';             // owner, teacher, assistant or any role added on the Roles sheet
var VIEW=ROLE==='trainer'&&SESS.view==='student'?'student':ROLE;
if(!VIEW&&!CFG.gate)VIEW='student';
var TRAINER=VIEW==='trainer';
ST.role=ROLE;ST.view=VIEW;ST.TRAINER=TRAINER;
ST.staffRole=ROLE==='trainer'?(SESS.role==='trainer'?'owner':SESS.role):'';
ST.session=function(){return SESS};
ST.setSession=function(o){try{if(o)localStorage.setItem(SKEY,JSON.stringify(o));else localStorage.removeItem(SKEY)}catch(e){}SESS=o};
function cfgCan(f,v){var r=(CFG.features||{})[f];return !!r&&r.indexOf(v||'guest')>=0}
function permIn(p,f,v){if(p&&typeof p==='object'&&Object.prototype.hasOwnProperty.call(p,f))return !!p[f];return cfgCan(f,v)}
/* what the current view may use (a trainer in Student view gets the Student column) */
ST.can=function(f){
  if(VIEW==='student')return permIn(SESS&&SESS.sperms,f,'student');
  if(VIEW==='trainer'&&ST.staffRole==='owner')return true;
  return permIn(SESS&&SESS.perms,f,VIEW);
};
/* what the signed-in staff member may use, whatever the view */
ST.canStaff=function(f){if(ROLE!=='trainer')return false;if(ST.staffRole==='owner')return true;return permIn(SESS&&SESS.perms,f,'trainer')};
ST.gated=function(){return !!CFG.gate&&!ROLE};
/* per-student access from the sheet's Access tab: null = open; {on:'dd/mm/yyyy'} = opens that day; {on:''} = not open.
   Staff and guests see everything. The script also refuses to save progress for a topic that is not open. */
/* the access map in force: a student's own, or the group a staff member previews in Student view; null = everything open */
function accMap(){if(ROLE==='student'&&SESS&&SESS.access)return SESS.access;if(ROLE==='trainer'&&VIEW==='student'&&SESS&&SESS.preview)return SESS.preview.access||{};return null}
/* a topic the sheet does not list yet follows its section (topic ids start with the section letter: a1-…, b2-…) */
function accOf(a,id){if(Object.prototype.hasOwnProperty.call(a,id))return a[id];return a[(CFG.partKey||'P1')+'-'+String(id).charAt(0).toUpperCase()]||'closed'}
/* Hidden (Access sheet, column F or "hidden" in a group cell): a student does not see the topic or section at all, open or closed.
   ST.topics / ST.byId keep only what he may see; staff keep everything and see a "Hidden" mark (SESS.hid: {key: 'All' | 'Group 1, …'}). */
var ALLT=null;
ST.applyHidden=function(){if(!ALLT)ALLT=ST.topics.slice();var a=accMap();
  ST.topics=a?ALLT.filter(function(t){return accOf(a,t.id)!=='hidden'}):ALLT.slice();
  ST.byId={};ST.topics.forEach(function(t){ST.byId[t.id]=t})};
function secKey(k){return (CFG.partKey||'P1')+'-'+k}
ST.secHidden=function(k){var a=accMap();return !!a&&a[secKey(k)]==='hidden'};
ST.storyMark=function(id){if(ROLE!=='trainer'||!SESS||!SESS.shid)return '';var h=SESS.shid,v=h[id]||h[secKey(String(id).charAt(0).toUpperCase())]||h[CFG.partKey||'P1']||'';return v?'Story hidden from: '+v:''};
ST.hidMark=function(id){if(ROLE!=='trainer'||!SESS||!SESS.hid)return '';var h=SESS.hid,v=h[id]||h[secKey(String(id).charAt(0).toUpperCase())]||h[CFG.partKey||'P1']||'';return v?'Hidden from: '+v:''};
ST.lock=function(t){var a=accMap();if(!t||!a)return null;var v=accOf(a,t.id);return v==='open'?null:{on:v&&v!=='closed'?v:''}};
var LOCK='<svg viewBox="0 0 24 24" class="lk-i" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
function lockText(l){return l.on?'Opens on '+l.on:'Not open yet'}
function lockMsg(t,l){modal(t.n,'<p>'+(l.on?'This topic opens for your group on <b>'+esc(l.on)+'</b>.':'This topic is not open for you yet.')+' Your instructor opens each topic when its lecture comes, so the material and its practice follow the course.</p>')}
ST.lockText=lockText;
var KEY='st-'+(CFG.deck||'p1a')+'-v2'+(ROLE==='trainer'?'-trainer':''),SEEN={};
/* seconds on screen before a concept slide counts as read: the sheet's Settings value (sent at sign-in), else config, else 30 */
function readSec(){var v=SESS&&Number(SESS.readSec);if(v>=5&&v<=900)return Math.round(v);return (ST.CONFIG&&ST.CONFIG.readSec)||180}
function readTxt(){var s=readSec();return s<60?s+' seconds':s%60?Math.floor(s/60)+' min '+s%60+' s':s/60+(s===60?' minute':' minutes')}
function mmss(s){s=Math.max(0,Math.round(s));return s<60?s+' s':Math.floor(s/60)+':'+('0'+s%60).slice(-2)+' min'}
ST.readSec=readSec;ST.readTxt=readTxt;
function blank(){return {v:2,r:{},mk:{},un:{},q:{},d:{},tr:{},R:0,last:'',lt:0}}
var P=blank();
try{var raw=localStorage.getItem(KEY);if(raw){var o=JSON.parse(raw);if(o&&o.v===2)P=Object.assign(blank(),o)}}catch(e){}
function store(){try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}}
function save(){store();if(ST.sync&&ST.sync.dirty)ST.sync.dirty()}
function tidOf(k){return k.split('#')[0]}
function live(ts,tid){return ts>P.R&&ts>(P.tr[tid]||0)}
function isRead(k){var t=P.r[k];return !!t&&live(t,tidOf(k))&&t>((P.un&&P.un[k])||0)}
function isMarked(k){var m=P.mk&&P.mk[k];return !!m&&m>=P.r[k]&&isRead(k)}
function qRes(k){var x=P.q[k];return x&&live(x[1],tidOf(k))?x[0]:null}
function isDone(tid){var x=P.d[tid];return !!x&&x[0]===1&&live(x[1],tid)}
function prune(m){var lv=function(ts,t){return ts>m.R&&ts>(m.tr[t]||0)};
  Object.keys(m.r).forEach(function(k){if(!lv(m.r[k],tidOf(k)))delete m.r[k]});
  m.un=m.un||{};Object.keys(m.un).forEach(function(k){if(!lv(m.un[k],tidOf(k))||(m.r[k]&&m.r[k]>m.un[k]))delete m.un[k];else{delete m.r[k];if(m.mk)delete m.mk[k]}});
  m.mk=m.mk||{};Object.keys(m.mk).forEach(function(k){if(!m.r[k]||m.r[k]>m.mk[k])delete m.mk[k]});
  Object.keys(m.q).forEach(function(k){if(!lv(m.q[k][1],tidOf(k)))delete m.q[k]});
  Object.keys(m.d).forEach(function(t){if(!lv(m.d[t][1],t))delete m.d[t]});return m}
function merge(a,b){var m=blank();a=a||blank();b=b||blank();m.R=Math.max(a.R||0,b.R||0);
  [a,b].forEach(function(x){
    Object.keys(x.tr||{}).forEach(function(t){m.tr[t]=Math.max(m.tr[t]||0,x.tr[t])});
    Object.keys(x.r||{}).forEach(function(k){m.r[k]=Math.max(m.r[k]||0,x.r[k])});
    Object.keys(x.mk||{}).forEach(function(k){m.mk[k]=Math.max(m.mk[k]||0,x.mk[k])});
    Object.keys(x.un||{}).forEach(function(k){m.un[k]=Math.max(m.un[k]||0,x.un[k])});
    ['q','d'].forEach(function(f){Object.keys(x[f]||{}).forEach(function(k){if(!m[f][k]||x[f][k][1]>m[f][k][1])m[f][k]=x[f][k]})});   // q[k] may carry the chosen answer as a third item
    if((x.lt||0)>m.lt){m.lt=x.lt;m.last=x.last}});
  return prune(m)}
var CF={};   // "How sure are you?" picked before answering (s = sure, u = not sure, g = guessing)
var IV=[1,3,7,14,30];   // spaced review: days before a right answer comes back — longer each time it is right again
function dueAt(q){var n=Math.max(1,q[5]||1);return q[1]+IV[Math.min(n,IV.length)-1]*864e5}
/* q[k] = [right?, when, what was chosen (wrong answers), seconds spent on this try, how sure (s/u/g), right in a row at review times] — empty tail items are dropped */
ST.mark=function(k,ok,ch){var sec=Math.min(3600,Math.round(QS[k]||0));QS[k]=0;
  var o=P.q[k],cf=CF[k]||'',n=0;delete CF[k];
  if(ok){var was=o&&o[0]===1&&live(o[1],tidOf(k));n=was?Math.min(20,Date.now()>=dueAt(o)?(o[5]||1)+1:(o[5]||1)):1}
  var e=[ok?1:0,Date.now(),ok||ch==null?'':String(ch).slice(0,60),sec,cf,n];while(e.length>2&&!e[e.length-1])e.pop();
  P.q[k]=e;save();var dq=document.querySelector('.deck.mixq');if(dq)dq.classList.remove('mixq');   // mixed quiz: answered — show the topic
  var c=document.getElementById('stStat');if(c&&c.dataset.k===k)paintStat(c,k,true);paintConf(k,cf)};
ST.resetAll=function(){var n=Date.now();P=blank();P.R=n;save()};
ST.resetTopic=function(tid){P.tr[tid]=Date.now();prune(P);save()};
ST.setDone=function(tid,on){P.d[tid]=[on?1:0,Date.now()];save()};
ST.progress={get:function(){return P},replace:function(m){P=Object.assign(blank(),m);store()},merge:merge,blank:blank,
  summary:function(){var o=overall();return {mastery:o.pct,read:o.rd,marked:o.rb,concept:o.cn,correct:o.ok,practice:o.pr,topicsDone:o.td,topics:o.tn,mastered:o.ms,ready:readiness().pct}}};

/* ---------- helpers ---------- */
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
function num(v){if(v==null)return NaN;v=String(v).replace(/[,\s]/g,'').replace(/^\((.*)\)$/,'-$1').replace(/[−–]/g,'-');return v===''?NaN:+v}
ST.h={$:$,$$:$$,esc:esc,el:el,num:num};
var ICON={
 land:'<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M7 10h6M7 13.5h4"/></svg>',
 port:'<svg viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M9 7h6M9 10.5h4"/></svg>',
 why:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>',
 trap:'<svg viewBox="0 0 24 24"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.01"/></svg>',
 key:'<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/></svg>',
 ex:'<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>',
 prev:'<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
 next:'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
 list:'<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
 full:'<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
 back:'<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>'
};
ST.ICON=ICON;
/* callout helper for content authors */
ST.call=function(kind,title,html){return '<div class="call '+kind+'"><div class="ct">'+(ICON[kind]||ICON.key)+esc(title)+'</div>'+html+'</div>'};
/* quick check inside an explanation: tap an answer, see right/wrong and why. Does not count towards mastery.
   ST.qc(question, [options], index of the right one, explanation) */
ST.qc=function(q,o,a,e){return '<div class="qc" data-a="'+a+'"><div class="qc-q"><span class="qc-t">Quick check</span>'+q+'</div><div class="qc-os">'+o.map(function(x,i){return '<button type="button" class="qc-o" data-i="'+i+'"><span class="k">'+'ABCDEFG'[i]+'</span><span>'+x+'</span></button>'}).join('')+'</div><div class="qc-e" hidden><b>Answer: '+'ABCDEFG'[a]+'.</b> '+e+'</div></div>'};
/* "Check yourself": the topic's quick checks gathered on one slide, each with a link back to the slide that teaches it.
   ST.qcSet(topicId, [[question, [options], answerIndex, explanation, slideNumber], ...]); numbering counts the lesson slides from 1. */
ST.qcSet=function(id,items){return items.map(function(x,n){var q=ST.qc(x[0],x[1],x[2],x[3]);
  q=q.replace('<span class="qc-t">Quick check</span>','<span class="qc-t">Quick check <b class="qc-no">'+(n+1)+'</b></span>');
  if(x[4])q=q.replace(/<\/div>$/,'<a class="qc-rev" href="#/t/'+id+'/'+x[4]+'">Review slide '+x[4]+' →</a></div>');
  return q.replace('<div class="qc"','<div class="qc cyq"')}).join('')};/* key terms of a topic: [[term, meaning, watch out (optional)], …] */
/* The rows are also kept for the Glossary page and the printed glossary. The Arabic column shows only where Roles → glossAr allows
   (html.gl-ar-on); its cells are filled from the Key terms sheet by ST.glFill. */
ST._glp=[];
function glText(t){var d=document.createElement('div');d.innerHTML=String(t==null?'':t);return d.textContent.replace(/\s+/g,' ').trim()}
function glK(t){return glText(t).toLowerCase()}
ST.glKey=glK;
ST.gloss=function(rows){ST._glp=ST._glp.concat(rows);
  return '<div class="tw gl-w"><table class="t gl"><tr><th>Term</th><th class="gl-ar">بالعربي</th><th>What it means</th><th>Watch out</th></tr>'+rows.map(function(r){
    return '<tr><td><b>'+r[0]+'</b></td><td class="gl-ar" dir="rtl" lang="ar" data-k="'+esc(glK(r[0]))+'"></td><td>'+r[1]+'</td><td>'+(r[2]||'')+'</td></tr>'}).join('')+'</table></div>'};
/* Arabic of the key terms: this device's copy at once, then fresh from the sheet once per visit (yours first, else Google's) */
var GLM=null,GLP=null;
function glMap(){if(GLM)return GLM;try{var o=JSON.parse(localStorage.getItem('st-gl-ar')||'null');GLM=(o&&o.m)||{}}catch(e){GLM={}}return GLM}
function glOn(){return ST.can('glossAr')||ST.can('glossPage')||ST.can('glossPrint')}
/* every key term of the topics open to this person: [{k, en, m, w, t:[topics]}], A to Z (ids = only these topics) */
ST.glRows=function(ids){var rows=[],seen={};
  ST.topics.forEach(function(t){if(t.soon||ST.lock(t)||(ids&&ids.indexOf(t.id)<0))return;
    (t.gl||[]).forEach(function(r){var k=glK(r[0]);if(!k)return;if(seen[k]){if(seen[k].t.indexOf(t)<0)seen[k].t.push(t);return}
      var o={k:k,en:r[0],m:r[1],w:r[2]||'',t:[t]};seen[k]=o;rows.push(o)})});
  return rows.sort(function(a,b){return a.k.localeCompare(b.k)})};
ST.glAr=function(k){return glMap()[k]||''};
ST.glLoad=function(){
  if(GLP)return GLP;
  if(!glOn()||!ST.glossCall)return Promise.resolve(glMap());
  var terms=ST.glRows().map(function(r){return glText(r.en)}),n=0;
  var ask=function(){return ST.glossCall(terms).then(function(res){
    if(res&&res.ok&&res.ar){GLM=Object.assign({},glMap(),res.ar);try{localStorage.setItem('st-gl-ar',JSON.stringify({t:Date.now(),m:GLM}))}catch(e){}}
    if(res&&res.ok&&res.more>0&&++n<6)return ask();                     // a long list is translated 150 terms at a time
    return glMap()},function(){return glMap()})};
  GLP=ask();return GLP};
ST.glFill=function(root){var m=glMap();
  Array.prototype.forEach.call((root||document).querySelectorAll('.gl-ar[data-k],.gp-ar[data-k]'),function(c){var a=m[c.dataset.k];if(a&&c.textContent!==a)c.textContent=a});
  if(!GLP&&glOn()&&ST.glossCall)ST.glLoad().then(function(){ST.glFill(document)})};
ST.BLOOM={remember:'Remember',understand:'Understand',apply:'Apply',analyze:'Analyze',evaluate:'Evaluate'};

/* ---------- modal ---------- */
function modal(title,html){$('#mTitle').textContent=title;$('#mBody').innerHTML='';if(typeof html==='string')$('#mBody').innerHTML=html;else $('#mBody').appendChild(html);$('#modal').hidden=false;$('#mClose').focus()}
function closeModal(){$('#modal').hidden=true}
ST.modal=modal;ST.closeModal=closeModal;

/* ---------- slide registry ---------- */
var PRACTICE={mcq:1,multi:1,num:1,sort:1,dd:1,order:1,trace:1,tree:0};
function slideKey(t,i){return t.slides[i]._k}
function isPractice(s){return !!PRACTICE[s.t]&&!(s.t==='trace'&&!s.predict)}
ST.isPractice=isPractice;ST.slideKey=slideKey;ST.losOf=losOf;
/* LOS tags on slides: off by default; Settings → Your screen turns them on for this device (st-ui-los). The topic card and the LOS map always show them. */
function losTags(){try{return localStorage.getItem('st-ui-los')==='1'}catch(e){return false}}
function losChip(s){var l=losOf(s);return losTags()&&l.length?'<span class="chip g">LOS '+l.join(' · ')+'</span>':''}
ST.losTags=losTags;ST.losChip=losChip;
function losOf(s){return s.los?(Array.isArray(s.los)?s.los:[s.los]):[]}
/* the slide that teaches a question's idea: the last explanation (or, failing that, interactive) slide before it on the same LOS, inside the lesson — never the case or the key terms */
function ideaOf(t,i,s,pref){var lo=losOf(s),e=null,x=null,end=Math.min(i,t.nL==null?i:t.nL);
  for(var j=0;j<end;j++){var s2=t.slides[j];if(isPractice(s2)||s2.case||/^(Case|Key terms)\b/i.test(s2.h||''))continue;
    if(losOf(s2).some(function(c){return lo.indexOf(c)>=0})){x=j;if(s2.t==='x')e=j}}
  return pref&&e!==null?e:x}
function allSlides(){var a=[];ST.topics.forEach(function(t){if(t.soon)return;t.slides.forEach(function(s,i){a.push({t:t,s:s,i:i,k:slideKey(t,i)})})});return a}
function topicStat(t){var n=t.slides.length,cn=0,rd=0,rb=0,pr=0,ok=0,tried=0;
  t.slides.forEach(function(s,i){var k=slideKey(t,i);if(isPractice(s)){pr++;var r=qRes(k);if(r!==null)tried++;if(r===1)ok++}else if(t.nL==null||i<t.nL){cn++;if(isRead(k)){rd++;if(isMarked(k))rb++}}});   // reading counts the lesson only (a case's intro slide in the bank is not reading)
  var done=isDone(t.id),sc=done?100:Math.round(((cn?rd/cn:1)*(pr?0.3:1)+(pr?ok/pr*0.7:0))*100);
  return {n:n,cn:cn,rd:rd,rb:rb,pr:pr,ok:ok,tried:tried,done:done,score:sc,mastered:done||((pr?ok/pr>=0.8:true)&&rd===cn)}}
ST.topicStat=topicStat;
function overall(){var o={w:0,sw:0,cn:0,rd:0,rb:0,pr:0,ok:0,td:0,tn:0,ms:0};ST.topics.forEach(function(t){if(t.soon)return;var s=topicStat(t);o.tn++;o.w+=s.n;o.sw+=s.score*s.n;o.cn+=s.cn;o.rd+=s.rd;o.rb+=s.rb;o.pr+=s.pr;o.ok+=s.ok;if(s.done)o.td++;if(s.mastered)o.ms++});o.pct=o.w?Math.round(o.sw/o.w):0;return o}
function slideDone(t,s,k){return isDone(t.id)||(isPractice(s)?qRes(k)===1:isRead(k))}
function topicMenu(t){
  var st=topicStat(t),box=el('div');
  box.innerHTML='<div class="kv"><span>Concept and interactive slides read</span><b>'+st.rd+' / '+st.cn+'</b></div>'+
   '<div class="kv"><span>Practice answered correctly</span><b>'+st.ok+' / '+st.pr+'</b></div>'+
   '<div class="kv hi"><span>Topic mastery</span><b>'+st.score+'%'+(st.done?' (marked studied)':'')+'</b></div>'+
   '<p class="note">A slide counts as read after '+readTxt()+' on screen. Mastery = 30% reading + 70% practice answered correctly (your latest try). A topic is <b>mastered</b> at 80% correct with every slide read — or when you mark it as studied.</p>';
  var r=el('div','row');
  var go=el('a','btn pri','Open topic');go.href='#/t/'+t.id+'/1';go.onclick=closeModal;r.appendChild(go);
  if(t.nB){var bq=el('a','btn','Questions ('+bankQs(t).length+')');bq.href='#/bank/'+t.id;bq.onclick=closeModal;r.appendChild(bq)}
  var mk=el('button','btn',st.done?'Remove "studied" mark':'Mark as studied');mk.onclick=function(){ST.setDone(t.id,!st.done);closeModal();route()};r.appendChild(mk);
  if(ST.printDialog&&ST.can('print')){var pb=el('button','btn','Print / PDF');pb.onclick=function(){ST.printDialog(t)};r.appendChild(pb)}
  var rs=el('button','btn ghost','Reset this topic');rs.onclick=function(){if(rs.dataset.c){ST.resetTopic(t.id);closeModal();route()}else{rs.dataset.c=1;rs.textContent='Tap again to confirm reset'}};r.appendChild(rs);
  box.appendChild(r);modal(t.n,box);
}
ST.topicMenu=topicMenu;

/* =========================================================
   HOME
   ========================================================= */
/* the six sections of Part 1: the open one is highlighted; a section without topics yet shows "coming soon" */
/* a student with no open topic in a section: the section shows locked (and when its first topic opens, if a date is set) */
function secLock(k){var a=accMap();if(!a)return null;var p=k.toLowerCase(),first=null,sv=a[(CFG.partKey||'P1')+'-'+k];
  if(sv==='open')return null;if(sv&&sv!=='closed'){var sd=sv.split('/'),sdt=new Date(+sd[2],+sd[1]-1,+sd[0]);if(!isNaN(sdt))first={dt:sdt,on:sv}}
  for(var id in a){if(id.charAt(0)!==p)continue;var v=a[id];if(v==='open')return null;
    if(v&&v!=='closed'){var d=v.split('/');var dt=new Date(+d[2],+d[1]-1,+d[0]);if(!isNaN(dt)&&(!first||dt<first.dt))first={dt:dt,on:v}}}
  return {on:first?first.on:''}}
function secBar(app){
  if(!ST.SECTIONS)return;
  var bar=el('nav','secbar');bar.setAttribute('aria-label','Part 1 sections');
  if(ST.startView){var sh=el('a','sb sb-st'+(/^#\/start/.test(location.hash)?' on':''),'<b>★</b><span>Start here</span><small>The CMA and the exam</small>');sh.href='#/start';bar.appendChild(sh)}
  ST.SECTIONS.forEach(function(s){if(ST.secHidden(s.k))return;var on=ST.SEC&&s.k===ST.SEC.k,ready=ST.sectionOpen&&ST.sectionOpen(s.k),lk=ready?secLock(s.k):null,hs=(ROLE==='trainer'&&SESS&&SESS.hid&&SESS.hid[secKey(s.k)])||'';
    var b=el(ready&&!on?'button':'div','sb'+(on?' on':'')+(ready?'':' soon')+(lk?' lk':''),'<b>'+s.k+'</b><span>'+esc(s.title)+'</span><small>'+(lk?LOCK+esc(lockText(lk)):on?'You are here':ready?s.weight+'% of the exam':'Coming soon')+(hs?' · Hidden from: '+esc(hs):'')+'</small>');
    if(ready&&!on){b.type='button';b.onclick=function(){ST.goSection(s.k)}}
    if(on)b.setAttribute('aria-current','true');
    bar.appendChild(b)});
  app.appendChild(bar)}
function home(){
  var app=$('#app');app.innerHTML='';
  secBar(app);
  if(ST.detailsBanner)ST.detailsBanner(app);
  var all=allSlides(),O=overall(),cov={};all.forEach(function(x){losOf(x.s).forEach(function(c){cov[c]=1})});
  var covN=ST.LOS.filter(function(l){return cov[l.c]}).length,pct=O.pct;
  var last=P.last&&P.last.split('/'),cont=last&&ST.byId[last[0]]&&!ST.lock(ST.byId[last[0]])?'#/t/'+last[0]+'/'+last[1]:null;
  var openTs=ST.topics.filter(function(t){return !t.soon&&!ST.lock(t)}),first=openTs[0],noneOpen=!openTs.length;
  var C=2*Math.PI*50,off=C*(1-pct/100);
  var hero=el('section','hero');
  hero.innerHTML='<div><div class="kick">CMA '+esc(CFG.part||'Part 1')+' · '+esc(CFG.section||'')+' · '+(CFG.weight||'')+'% of the exam</div>'+
   '<h1>'+esc(CFG.sectionTitle||'')+'</h1>'+
   '<p>'+((ST.SEC&&ST.SEC.blurb)||'')+'</p>'+
   '<div class="stats"><span><b>'+ST.topics.length+'</b> topics</span><span><b>'+all.length+'</b> slides</span><span><b>'+covN+'/'+ST.LOS.length+'</b> LOS covered</span></div><div class="stats"><span><b>'+O.rd+'/'+O.cn+'</b> slides read</span><span><b>'+O.ok+'/'+O.pr+'</b> practice correct</span><span><b>'+O.ms+'/'+O.tn+'</b> topics mastered</span>'+(Object.keys(P.q).length?'<span><b>'+readiness().pct+'%</b> exam readiness</span>':'')+'</div>'+
   (function(){var v=revGet();if(!v||v.l!=='c')return '';var j=-1,an=0;v.a.forEach(function(r,x){if(setSt(v,r)>=0)an++;else if(j<0)j=x});
     return '<div class="fb set-run"><span><b>'+(v.ex?'An exam set':'A practice set')+' is running</b> · '+an+' of '+v.a.length+' answered</span><a class="btn sm pri" href="#/t/'+v.a[Math.max(0,j)]+'">Return to it</a></div>'})()+
   (noneOpen?'<div class="fb lk-n">'+LOCK+'<span>No topic is open for you yet. Your instructor opens each topic when its lecture comes.</span></div>':'')+
   '<div class="row">'+(cont?'<a class="btn pri" href="'+cont+'">Continue where you stopped</a>':(first?'<a class="btn pri" href="#/t/'+first.id+'/1">'+(first===ST.topics[0]?'Start from LOS '+(ST.LOS[0]?ST.LOS[0].c:''):'Start: '+esc(first.n))+'</a>':''))+
   '<a class="btn" href="#/map">LOS map</a><a class="btn" href="#/bank">Question bank</a>'+(ST.can('glossPage')?'<a class="btn" href="#/glossary">Glossary</a>':'')+(Object.keys(P.q).length?'<a class="btn" href="#/mistakes">Readiness &amp; mistakes'+(mistakes().length?' <span class="chip r" title="Mistakes to fix">'+mistakes().length+'</span>':'')+(dueList().length?' <span class="chip t" title="Due for review">↻ '+dueList().length+'</span>':'')+'</a>':'')+'<button class="btn ghost" id="howP">How progress works</button></div></div>'+
   '<div class="ring" aria-label="Progress '+pct+'%"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="60" cy="60" r="50" fill="none" stroke="var(--teal)" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'"/></svg><div class="rv"><div><b>'+pct+'%</b><br><small>mastery</small></div></div></div>';
  app.appendChild(hero);
  $('#howP',hero).onclick=howProgress;
  var groups=(ST.SEC&&ST.SEC.groups)||[],n=0;
  groups.forEach(function(g){
    var head=el('div','grp','<span class="code">'+g[0]+'</span><h2>'+g[1]+'</h2>');app.appendChild(head);
    var subs=[];ST.topics.forEach(function(t){if(t.group===g[0]&&subs.indexOf(t.sub)<0)subs.push(t.sub)});
    subs.forEach(function(sb){
      app.appendChild(el('div','sub',esc(sb)));
      var cards=el('div','cards');
      ST.topics.forEach(function(t){if(t.group!==g[0]||t.sub!==sb)return;n++;
        var st=topicStat(t),p=st.score,lk=t.soon?null:ST.lock(t);
        var w=el('div','tcw'),a=el('a','tc'+(t.soon?' soon':'')+(lk?' lk':'')+(st.mastered&&!t.soon&&!lk?' ms':''));a.href=t.soon||lk?'#/':'#/t/'+t.id+'/1';
        if(lk)a.onclick=function(e){e.preventDefault();lockMsg(t,lk)};
        a.innerHTML='<div class="n"><span>Topic '+n+'</span><span>'+(t.soon?'in preparation':st.n+' slides')+'</span></div>'+
          '<h3>'+esc(t.n)+'</h3><div class="chips">'+(ST.hidMark(t.id)?'<span class="chip hid" title="Students in these groups do not see this topic">'+esc(ST.hidMark(t.id))+'</span>':'')+(ST.storyMark(t.id)?'<span class="chip hid" title="Students in these groups see this topic without its Scenario slide and story lines (Access → Hide story)">'+esc(ST.storyMark(t.id))+'</span>':'')+t.los.map(function(c){return '<span class="chip g">'+c+'</span>'}).join('')+'</div>'+
          (t.soon?'':lk?'<div class="tstat lk-l">'+LOCK+'<span>'+esc(lockText(lk))+'</span></div>':'<div class="tstat"><span>Read '+st.rd+'/'+st.cn+' · Correct '+st.ok+'/'+st.pr+'</span><b>'+(st.done?'✓ studied':(st.mastered?'✓ mastered':p+'%'))+'</b></div>')+
          '<div class="bar"><i style="width:'+p+'%"></i></div>';
        w.appendChild(a);
        if(!t.soon&&!lk){var mb=el('button','tc-m','<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>');mb.title='Topic progress';mb.setAttribute('aria-label','Topic progress: '+t.n);mb.onclick=function(e){e.preventDefault();topicMenu(t)};w.appendChild(mb)}
        cards.appendChild(w)});
      app.appendChild(cards)});
  });
  var rs=el('div','row');rs.style.marginTop='24px';
  var b=el('button','btn ghost sm','Reset all my progress');b.onclick=function(){
    var box=el('div','',"<p>This clears every topic: slides read, practice answers and 'studied' marks"+(ST.sync&&ST.sync.code()?' — on this device and in your saved progress for code '+esc(ST.sync.code()):' on this device')+".</p>");
    var r=el('div','row');var y=el('button','btn pri','Yes, reset');var no=el('button','btn','Cancel');
    y.onclick=function(){ST.resetAll();closeModal();home()};no.onclick=closeModal;r.appendChild(y);r.appendChild(no);box.appendChild(r);modal('Reset progress?',box)};
  rs.appendChild(b);app.appendChild(rs);
  if(ST.fun&&ST.fun.tourOnce)ST.fun.tourOnce();
}

/* =========================================================
   MY MISTAKES — every practice question whose latest answer is wrong (open topics only).
   Answer it correctly and it leaves the list. "Review them one by one" walks through them in order.
   ========================================================= */
var RVK='st-review';
function mistakes(){var out=[];ST.topics.forEach(function(t){if(t.soon||ST.lock(t))return;var n=0;
  t.slides.forEach(function(s,i){if(!isPractice(s))return;n++;var k=slideKey(t,i);if(qRes(k)===0)out.push({t:t,i:i,s:s,k:k,n:n,ts:P.q[k][1]})})});return out}
ST.mistakes=mistakes;
/* why a mistake happened: an explicit tag on the question (err / m[2] / it.err / f.err) wins; otherwise the kind of question decides.
   c = concept, k = calculation, r = misread, mix:<topic id> = mixed up with another topic */
var CAUSE={c:['Concept','The idea itself was not clear yet','Re-read the concept slide below, then try again without looking.'],
  k:['Calculation','The method or the arithmetic went wrong','Write the formula first, then the numbers, and check the sign and the base you used.'],
  r:['Read the question','The question asked for something else','Underline what is asked (amount? classification? which statement?) before answering.'],
  mix:['Mixed up two topics','The rule of a neighbouring topic was used','Compare the two topics side by side — the link below opens the other one.']};
function numeric(t){t=String(t||'').replace(/<[^>]*>/g,'').trim();return /^[\s$€£SARUD()\-−–+.,%0-9]+$/.test(t)&&/\d/.test(t)}
function causeOf(x){var s=x.s,ch=(P.q[x.k]&&P.q[x.k][2])||'',kind=ch.charAt(0),val=ch.slice(2),out={c:'',why:'',ans:'',mix:''};
  var tag=function(t){if(!t)return false;if(/^mix:/.test(t)){out.c='mix';out.mix=t.slice(4)}else out.c=t;return true};
  if(s.t==='mcq'&&kind==='o'){var i=+val;out.ans='ABCDEFG'[i]+' — '+(s.o[i]||'');out.why=(s.w&&s.w[i])||'';
    if(!tag(s.err&&s.err[i]))out.c=numeric(s.o[i])&&numeric(s.o[s.a])?'k':'c'}
  else if(s.t==='multi'&&kind==='o'){var pk=val?val.split(',').map(Number):[];out.ans=pk.length?pk.map(function(j){return 'ABCDEFGH'[j]}).join(', '):'nothing selected';
    var wrong=pk.filter(function(j){return s.a.indexOf(j)<0}).concat(s.a.filter(function(j){return pk.indexOf(j)<0}));
    out.why=wrong.map(function(j){return s.w&&s.w[j]?'<b>'+'ABCDEFGH'[j]+'</b>: '+s.w[j]:''}).filter(String).join('<br>');
    if(!wrong.some(function(j){return tag(s.err&&s.err[j])}))out.c='c'}
  else if(s.t==='num'&&kind==='v'){var f=s.f||[{l:'Answer',a:s.a,tol:s.tol,m:s.m}],vs=val.split('|'),ex=[];out.ans=f.map(function(x,j){return (f.length>1?x.l+': ':'')+(vs[j]||'—')}).join(' · ');
    f.forEach(function(x,j){var v=num(vs[j]),tol=x.tol!=null?x.tol:0.5;if(!isNaN(v)&&Math.abs(v-x.a)<=tol)return;
      (x.m||[]).forEach(function(mm){if(!isNaN(v)&&Math.abs(v-mm[0])<=Math.max(tol,0.5)){ex.push(mm[1]);if(!out.c)tag(mm[2])}})});
    out.why=ex.join('<br>');if(!out.c)out.c='k'}
  else if(s.t==='sort'&&kind==='s'){var ws=val?val.split(','):[];out.ans=ws.length+' item'+(ws.length===1?'':'s')+' in the wrong box';
    out.why=ws.map(function(w){var ix=+w.split('>')[0],it=s.i[ix];if(!it)return '';if(!out.c)tag(it.err);var bl=s.b.filter(function(b){return b.id===it.b})[0];return '<b>'+it.x+'</b> → '+(bl?bl.l:'')+(it.w?' — '+it.w:'')}).filter(String).join('<br>');if(!out.c)out.c='c'}
  else if(s.t==='dd'&&kind==='d'){var dv=val.split(','),ex2=[];s.f.forEach(function(f,j){var c=dv[j]===''?-1:+dv[j];if(c===f.a)return;if(c>=0&&f.w&&f.w[c])ex2.push('<b>'+esc(f.o[c])+'</b> — '+f.w[c]);if(!out.c)tag(f.err&&f.err[c])});
    out.ans=s.f.map(function(f,j){var c=dv[j]===''?-1:+dv[j];return c>=0?f.o[c]:'—'}).join(' · ');out.why=ex2.join('<br>');if(!out.c)out.c='c'}
  else if(s.t==='order'){out.ans='steps out of order';out.c='c'}
  else out.c='c';
  return out}
/* pace: time per question against the exam's pace (latest timed answer of each practice question) */
function paceSec(){var a=[];
  ST.topics.forEach(function(t){if(t.soon||ST.lock(t))return;t.slides.forEach(function(s,i){if(!isPractice(s))return;var q=P.q[slideKey(t,i)];
    if(!q||!live(q[1],t.id)||!(q[3]>0))return;var b=budget(s);a.push({ok:q[0]===1,sec:q[3],b:b,r:q[3]/b,mcq:s.t==='mcq'})})});
  var box=el('section','mk-sum pace');
  if(!a.length){box.innerHTML='<h2>Your pace</h2><p class="note">Answer a few practice questions and your pace appears here: how long you take per question against the exam\'s pace (100 questions in 3 hours = <b>1:48</b> a question).</p>';return box}
  var g={good:0,slow:0,rush:0,gap:0},sec=0,bud=0,mc=a.filter(function(x){return x.mcq}),mcs=0;
  a.forEach(function(x){sec+=x.sec;bud+=x.b;if(x.ok)g[x.r>1.5?'slow':'good']++;else g[x.r<0.5?'rush':'gap']++});mc.forEach(function(x){mcs+=x.sec});
  var use=Math.round(sec/bud*100),T=[['good','✓','Right and on time','Keep this rhythm.'],['slow','◷','Right but slow','You know it — practise to answer faster.'],
    ['rush','»','Wrong and fast','Rushed or guessed: slow down and read the question fully.'],['gap','✗','Wrong and slow','The idea needs another look before speed.']];
  box.innerHTML='<h2>Your pace</h2><p class="pace-l">'+(mc.length?'Multiple-choice: <b>'+mmss2(mcs/mc.length)+'</b> a question on average — the exam pace is <b>1:48</b>. ':'')+
    'Across '+a.length+' timed answer'+(a.length===1?'':'s')+' you used <b>'+use+'%</b> of the time an exam would allow'+(use>115?' — too slow for the exam yet.':use<60?' — fast; make sure speed is not costing marks.':' — a good exam pace.')+'</p>'+
    '<div class="mk-cs">'+T.map(function(x){return '<div class="mk-c p-'+x[0]+'"><b>'+g[x[0]]+'</b><span>'+x[1]+' '+x[2]+'</span><small>'+x[3]+'</small></div>'}).join('')+'</div>';
  return box}
function revGet(){try{var v=JSON.parse(sessionStorage.getItem(RVK)||'null');return Array.isArray(v)?{l:'m',a:v}:(v&&Array.isArray(v.a)?v:null)}catch(e){return null}}   // l: m = my mistakes, d = spaced review
function revSet(v){try{if(v)sessionStorage.setItem(RVK,JSON.stringify(v));else sessionStorage.removeItem(RVK)}catch(e){}}
function dmy(ts){var d=new Date(ts);return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear()}
/* questions answered right some days ago and due again (spaced review), open topics only */
function dueList(){var out=[],now=Date.now();ST.topics.forEach(function(t){if(t.soon||ST.lock(t))return;var n=0;
  t.slides.forEach(function(s,i){if(!isPractice(s))return;n++;var k=slideKey(t,i),q=P.q[k];if(q&&q[0]===1&&live(q[1],t.id)&&now>=dueAt(q))out.push({t:t,i:i,s:s,k:k,n:n})})});return out}
ST.due=dueList;
/* mixed quiz: 10 questions from different open topics in random order, the topic hidden until answered — like the exam.
   Questions not right yet come first, at most 3 from one topic */
function shuffle(a){for(var j=a.length-1;j>0;j--){var r=Math.floor(Math.random()*(j+1)),x=a[j];a[j]=a[r];a[r]=x}return a}
function mixPool(){var a=[],tp={};ST.topics.forEach(function(t){if(t.soon||ST.lock(t))return;t.slides.forEach(function(s,i){if(isPractice(s)){a.push({t:t,i:i,k:slideKey(t,i)});tp[t.id]=1}})});return {a:a,tn:Object.keys(tp).length}}
function mixStart(){var all=shuffle(mixPool().a),pick=[],per={};
  all.sort(function(a,b){return (qRes(a.k)===1)-(qRes(b.k)===1)});
  all.forEach(function(x){if(pick.length<10&&(per[x.t.id]||0)<3){pick.push(x);per[x.t.id]=(per[x.t.id]||0)+1}});
  all.forEach(function(x){if(pick.length<10&&pick.indexOf(x)<0)pick.push(x)});
  var a=shuffle(pick).map(function(x){return x.t.id+'/'+(x.i+1)});revSet({l:'x',a:a,s:Date.now()});location.hash='#/t/'+a[0]}
function mixResult(rv){var ok=0,n=0;rv.a.forEach(function(r){var p=r.split('/'),t=ST.byId[p[0]];if(!t)return;var q=P.q[slideKey(t,+p[1]-1)];if(q&&q[1]>=rv.s){n++;if(q[0]===1)ok++}});
  try{sessionStorage.setItem('st-mixres',JSON.stringify({ok:ok,n:n,tot:rv.a.length}))}catch(e){}}
/* =========================================================
   PRACTICE SET — the student picks the part (the whole section or some topics), how many questions, and how:
   Practice (the answer after each question) or Exam (one clock, the answers at the end).
   Questions are spread evenly across the LOS of what was picked — the way the exam spreads them — then mixed.
   Runs through the same review bar as the mistakes review: sessionStorage RVK with l = 'c'.
   ========================================================= */
var SOK='st-setopt',SRK='st-setres',SHK=KEY+'-sets',SETT=null;
function setTopics(){return ST.topics.filter(function(t){return !t.soon&&!ST.lock(t)&&t.slides.some(function(s){return isPractice(s)&&s.t!=='trace'})})}
function setPool(tids){var B={},n=0,bud=0;ST.topics.forEach(function(t){if(t.soon||ST.lock(t)||tids.indexOf(t.id)<0)return;
  t.slides.forEach(function(s,i){if(!isPractice(s)||s.t==='trace')return;var c=losOf(s)[0]||t.group;(B[c]=B[c]||[]).push({t:t,i:i,s:s,k:slideKey(t,i)});n++;bud+=budget(s)})});
  return {B:B,n:n,L:Object.keys(B).length,avg:n?bud/n:108}}
/* weakest first: wrong now (0), never answered (1), due for review (2), right (3) */
function setRank(x){var r=qRes(x.k);return r===0?0:r===null?1:Date.now()>=dueAt(P.q[x.k])?2:3}
function setPick(tids,n,weak){var B=setPool(tids).B,out=[],more=true;
  var L=shuffle(Object.keys(B)).map(function(c){var a=shuffle(B[c].slice());if(weak)a.sort(function(x,y){return setRank(x)-setRank(y)});return a});
  if(weak)L.sort(function(a,b){return setRank(a[0])-setRank(b[0])});   // a last, partial round goes to the weakest LOS
  while(out.length<n&&more){more=false;L.forEach(function(a){if(out.length<n&&a.length){out.push(a.shift());more=true}})}
  return shuffle(out)}
function setRun(a,ex,sc){if(!a.length)return;var T=0;a.forEach(function(r){var p=r.split('/'),t=ST.byId[p[0]],s=t&&t.slides[+p[1]-1];T+=s?budget(s):108});
  var now=Date.now();revSet({l:'c',a:a,s:now,t0:now,T:T,ex:ex?1:0,f:[],sc:sc||''});location.hash='#/t/'+a[0]}
function setStart(o){var a=setPick(o.t,o.n,o.w);
  if(o.o)a.sort(function(x,y){return ST.topics.indexOf(x.t)-ST.topics.indexOf(y.t)||x.i-y.i});   // in lesson order: topic by topic, as written
  setRun(a.map(function(x){return x.t.id+'/'+(x.i+1)}),o.ex,o.sc)}
/* 1 = right, 0 = wrong, -1 = not answered in this set */
function setSt(rv,ref){var p=ref.split('/'),t=ST.byId[p[0]];if(!t)return -1;var q=P.q[slideKey(t,+p[1]-1)];return q&&q[1]>=rv.s&&live(q[1],t.id)?(q[0]===1?1:0):-1}
function setGo(j){var v=revGet();if(v&&v.a[j])location.hash='#/t/'+v.a[j]}
function hms(s){s=Math.max(0,Math.round(s));var h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=('0'+s%60).slice(-2);return h?h+':'+('0'+m).slice(-2)+':'+x:m+':'+x}
function setTick(){clearInterval(SETT);SETT=null;var rv=revGet();if(!rv||rv.l!=='c'||!rv.ex)return;
  function f(){var v=revGet();if(!v||v.l!=='c'||!v.ex||v.s!==rv.s){clearInterval(SETT);SETT=null;return}
    var left=Math.ceil((v.t0+v.T*1000-Date.now())/1000);if(left<=0){clearInterval(SETT);SETT=null;setFinish(v,true);return}
    $$('.set-clk').forEach(function(c){c.textContent=hms(left)+' left';c.classList.toggle('low',left<=300)})}
  f();if(revGet())SETT=setInterval(f,1000)}
function setFinish(rv,up){clearInterval(SETT);SETT=null;var now=Date.now(),st=rv.a.map(function(r){return setSt(rv,r)}),ok=st.filter(function(v){return v===1}).length;
  var used=Math.round((rv.ex?Math.min(rv.T*1000,now-rv.t0):now-rv.t0)/1000);
  try{sessionStorage.setItem(SRK,JSON.stringify({a:rv.a,st:st,s:rv.s,e:now,ex:rv.ex,T:rv.T,used:used,up:up?1:0,sc:rv.sc||''}))}catch(e){}
  try{var H=JSON.parse(localStorage.getItem(SHK)||'[]');if(!Array.isArray(H))H=[];H.unshift({d:now,ex:rv.ex,n:rv.a.length,ok:ok,sc:rv.sc||''});localStorage.setItem(SHK,JSON.stringify(H.slice(0,12)))}catch(e){}
  revSet(null);if(location.hash==='#/set-result')route();else location.hash='#/set-result'}
function setEnd(rv){var un=rv.a.filter(function(r){return setSt(rv,r)<0}).length,fl=(rv.f||[]).length;
  if(!un&&!fl){setFinish(rv,false);return}
  var box=el('div','','<p>'+(un?'<b>'+un+'</b> question'+(un===1?' is':'s are')+' not answered yet — '+(un===1?'it counts':'they count')+' as wrong.':'')+(fl?' <b>'+fl+'</b> flagged to come back to.':'')+'</p>');
  var r=el('div','row'),y=el('button','btn pri','Finish and see my result'),no=el('button','btn','Back to the questions');
  y.onclick=function(){closeModal();setFinish(revGet()||rv,false)};no.onclick=function(){closeModal();setGrid(revGet()||rv)};
  r.appendChild(y);r.appendChild(no);box.appendChild(r);modal(rv.ex?'Finish the exam set?':'Finish the practice set?',box)}
/* every question of the set as a number: answered, flagged, right / wrong (Practice only) — tap to go */
function setGrid(rv,cu){var box=el('div','set-gw'),g=el('div','set-grid'),an=0;
  rv.a.forEach(function(r,j){var s=setSt(rv,r),fl=(rv.f||[]).indexOf(r)>=0;if(s>=0)an++;
    var b=el('button','set-q'+(s<0?'':rv.ex?' an':s===1?' ok':' bad')+(fl?' fl':'')+(j===cu?' cur':''),String(j+1));b.type='button';
    b.title='Question '+(j+1)+(s<0?' · not answered':rv.ex?' · answered':s===1?' · right':' · wrong')+(fl?' · flagged':'');b.onclick=function(){closeModal();setGo(j)};g.appendChild(b)});
  box.appendChild(el('p','note',an+' of '+rv.a.length+' answered'+((rv.f||[]).length?' · '+rv.f.length+' flagged':'')+'. Tap a number to go to that question.'));box.appendChild(g);
  box.appendChild(el('div','set-lg',(rv.ex?'<span><i class="set-q an"></i>answered</span>':'<span><i class="set-q ok"></i>right</span><span><i class="set-q bad"></i>wrong</span>')+'<span><i class="set-q"></i>not answered</span><span><i class="set-q fl"></i>flagged</span>'));
  var r=el('div','row'),fin=el('button','btn pri','Finish the set');fin.onclick=function(){closeModal();setEnd(revGet()||rv)};r.appendChild(fin);box.appendChild(r);
  modal((rv.ex?'Exam set':'Practice set')+' · all questions',box)}
/* the bar above each question of a running set */
function setBar(rv,i){var A=rv.a,n=A.length,ex=!!rv.ex,me=A[i],fl=(rv.f||[]).indexOf(me)>=0;
  var b=el('div','rv-bar due set-bar'+(ex?' ex':''));
  var lab=el('button','set-n','<b>'+(ex?'Exam set':'Practice set')+'</b> · '+(i+1)+' of '+n+'<span class="set-g">all questions</span>');lab.type='button';lab.title='See every question in this set';lab.onclick=function(){setGrid(revGet()||rv,i)};
  b.appendChild(lab);
  if(ex){var ck=el('span','set-clk');ck.setAttribute('role','timer');ck.title='Time left — the set ends by itself at 0';b.appendChild(ck)}
  var f=el('button','btn sm ghost set-fl'+(fl?' on':''),'⚑<span class="set-ft"> '+(fl?'Flagged':'Flag')+'</span>');f.type='button';f.setAttribute('aria-pressed',fl?'true':'false');f.title='Flag this question to come back to it';f.setAttribute('aria-label','Flag this question');
  f.onclick=function(){var v=revGet();if(!v)return;v.f=v.f||[];var p=v.f.indexOf(me),on=p<0;if(on)v.f.push(me);else v.f.splice(p,1);revSet(v);f.classList.toggle('on',on);f.lastChild.textContent=' '+(on?'Flagged':'Flag');f.setAttribute('aria-pressed',on?'true':'false')};
  var pv=el('button','btn sm','‹ Back');pv.type='button';pv.disabled=i===0;pv.onclick=function(){setGo(i-1)};
  var nx=el('button','btn sm pri',i+1<n?'Next ›':'Finish');nx.type='button';nx.onclick=function(){if(i+1<n)setGo(i+1);else setEnd(revGet()||rv)};
  b.appendChild(f);b.appendChild(pv);b.appendChild(nx);
  if(i+1<n){var st=el('button','btn sm ghost','End');st.type='button';st.title='End the set now and see the result';st.onclick=function(){setEnd(revGet()||rv)};b.appendChild(st)}
  setTimeout(setTick,0);return b}
/* exam set: the buttons say what they do there (no checking, no feedback) */
function exLabels(body){$$('.qa .btn',body).forEach(function(b){var t=b.textContent,x=t==='Try again'?'Change my answer':t==='Check'?'Save my answer':null;if(x&&t!==x)b.textContent=x})}
/* the build page */
function setOpts(){var o=null;try{o=JSON.parse(localStorage.getItem(SOK)||'null')}catch(e){}o=o||{};
  return {sc:o.sc==='pick'?'pick':'all',t:Array.isArray(o.t)?o.t:[],n:o.n||20,ex:o.ex?1:0,w:o.w===0?0:1,o:o.o?1:0}}
/* =========================================================
   QUESTION BANK — each topic has its own section: all its exam-style questions and its case (#/bank, #/bank/<topic>)
   ========================================================= */
function bankBar(st){var p=st.n?Math.round(st.ok/st.n*100):0;return '<span class="bk-bar" role="img" aria-label="'+st.ok+' of '+st.n+' correct"><i style="width:'+p+'%"></i></span>'}
function bankList(app){var TS=ST.topics.filter(function(t){return !t.soon&&t.nB&&bankQs(t).length});if(!TS.length)return;
  app.appendChild(el('h2','bk-t','Each topic\'s questions'));
  ((ST.SEC&&ST.SEC.groups)||[]).forEach(function(g){var gt=TS.filter(function(t){return t.group===g[0]});if(!gt.length)return;
    var sec=el('section','mk-sum bk-g','<h2>'+g[0]+' · '+esc(g[1])+'</h2>'),box=el('div','bk-list');
    gt.forEach(function(t){var lk=ST.lock(t),Q=bankQs(t),st=bankStat(Q),nc=Q.filter(function(x){return x.s.case}).length,a=el(lk?'div':'a','bk-row'+(lk?' lk':''));
      if(!lk)a.href='#/bank/'+t.id;
      a.innerHTML='<span class="bk-n">'+esc(t.n)+'<small>'+(Q.length-nc)+' questions'+(nc?' · a case':'')+(lk?' · '+esc(lockText(lk)):'')+'</small></span>'+(lk?LOCK:'<span class="bk-s">'+st.ok+'/'+st.n+bankBar(st)+'</span>');
      box.appendChild(a)});
    sec.appendChild(box);app.appendChild(sec)})}
function bankTopic(tid){var t=ST.byId[tid];if(!t||t.soon){location.hash='#/bank';return}
  var app=$('#app');app.innerHTML='';var lk=ST.lock(t);
  if(lk){app.appendChild(el('section','gate lk-p','<div class="gate-logo">'+LOCK+'</div><h1>'+esc(t.n)+'</h1><p>'+(lk.on?'This topic opens for your group on <b>'+esc(lk.on)+'</b>.':'This topic is not open for you yet.')+'</p><a class="btn pri" href="#/bank">Back to the question bank</a>'));return}
  var Q=bankQs(t),cq=Q.filter(function(x){return x.s.case}),gq=Q.filter(function(x){return !x.s.case}),st=bankStat(Q),lb=t.n.split(' — ')[0];
  var hero=el('section','hero','<div><div class="kick">Question bank · '+esc(t.group)+' · '+esc(t.sub||'')+'</div><h1>'+esc(t.n)+'</h1>'+
    '<p>'+gq.length+' exam-style question'+(gq.length===1?'':'s')+(cq.length?' and a case with '+cq.length+' questions':'')+'. '+(st.tr?'<b>'+st.ok+' of '+st.n+'</b> correct so far.':'None answered yet.')+'</p>'+
    '<div class="row"><a class="btn" href="#/t/'+t.id+'/1">Back to the lesson</a><a class="btn ghost" href="#/bank">All topics in the bank</a></div></div>');
  app.appendChild(hero);
  function refs(a){return a.map(function(x){return x.ref})}
  if(gq.length){var s1=el('section','mk-sum bk-s','<h2>Practise the questions</h2><p class="note">Practice shows the answer after each question; a timed exam set keeps one clock and shows the answers at the end.</p>'),r1=el('div','row');
    var b1=el('button','btn pri','Practise all '+gq.length);b1.type='button';b1.onclick=function(){setRun(shuffle(refs(gq)),0,lb+' · questions')};r1.appendChild(b1);
    var b2=el('button','btn','Timed exam set');b2.type='button';b2.onclick=function(){setRun(shuffle(refs(gq)),1,lb+' · exam set')};r1.appendChild(b2);
    var nr=gq.filter(function(x){return qRes(x.k)!==1});
    if(nr.length&&nr.length<gq.length){var b3=el('button','btn','Not right yet ('+nr.length+')');b3.type='button';b3.onclick=function(){setRun(shuffle(refs(nr)),0,lb+' · not right yet')};r1.appendChild(b3)}
    var b4=el('a','btn ghost','One by one');b4.href='#/t/'+gq[0].ref;r1.appendChild(b4);s1.appendChild(r1);
    var L={};gq.forEach(function(x){var c=losOf(x.s)[0]||t.group;(L[c]=L[c]||[]).push(x)});var lc=Object.keys(L);
    if(lc.length>1){var lr=el('div','bk-los','<span class="note">By LOS:</span>');lc.sort().forEach(function(c){var b=el('button','chip g','LOS '+c+' · '+L[c].length);b.type='button';b.onclick=function(){setRun(shuffle(refs(L[c])),0,lb+' · LOS '+c)};lr.appendChild(b)});s1.appendChild(lr)}
    app.appendChild(s1)}
  if(cq.length){var cid=cq[0].s.case,cs=t.cases&&t.cases[cid];
    var s2=el('section','mk-sum bk-s','<h2>The case'+(cs?': '+esc(cs.h):'')+'</h2><p class="note">'+cq.length+' questions on one company, in order — like the case part of the exam.</p>'),r2=el('div','row');
    var c1=el('button','btn pri','Solve the case');c1.type='button';c1.onclick=function(){setRun(refs(cq),0,lb+' · case')};r2.appendChild(c1);
    var c2=el('button','btn','As an exam');c2.type='button';c2.onclick=function(){setRun(refs(cq),1,lb+' · case (exam)')};r2.appendChild(c2);s2.appendChild(r2);app.appendChild(s2)}
  var s3=el('section','mk-sum bk-s','<h2>Every question</h2>'),bx=el('div','toc');
  Q.forEach(function(x,j){var r=qRes(x.k),a=el('a','k-p');a.href='#/t/'+x.ref;
    a.innerHTML='<span class="i">'+(j+1)+'</span><span class="tt">'+(x.s.h||'Question '+(j+1))+'<small><b class="kd">'+(x.s.case?'Case':'Question')+'</b>'+(losOf(x.s).length?' · LOS '+losOf(x.s).join(', '):'')+'</small></span>'+(r===1?'<span class="ok">✓</span>':r===0?'<span class="ok" style="color:var(--red)">↻</span>':'');bx.appendChild(a)});
  s3.appendChild(bx);app.appendChild(s3)}
function setPage(){var app=$('#app');app.innerHTML='';
  var TS=setTopics(),O=setOpts(),run=revGet();if(run&&run.l!=='c')run=null;
  var hero=el('section','hero','<div><div class="kick">Question bank · '+esc(CFG.section||'')+'</div><h1>Question bank</h1>'+
    '<p>Build a set from one topic, several topics or the whole section, in lesson order or at random. The questions are spread across the LOS of what you pick — the way the exam spreads them. Below, every topic has its own section with its case.</p></div>');
  app.appendChild(hero);
  if(run){var an=run.a.filter(function(r){return setSt(run,r)>=0}).length,rb=el('div','fb set-run','<b>'+(run.ex?'An exam set':'A practice set')+' is running</b> · '+an+' of '+run.a.length+' answered. ');
    var rg=el('button','btn sm pri','Return to it');rg.onclick=function(){var v=revGet();if(!v)return;var j=0;v.a.some(function(r,x){if(setSt(v,r)<0){j=x;return true}return false});setGo(j)};
    var re=el('button','btn sm ghost','End it');re.onclick=function(){var v=revGet();if(v)setEnd(v)};rb.appendChild(rg);rb.appendChild(re);hero.firstChild.appendChild(rb)}
  if(!TS.length){hero.firstChild.appendChild(el('div','fb lk-n',LOCK+'<span>No topic with practice questions is open for you yet.</span>'));return}
  var ids=TS.map(function(t){return t.id}),pick=O.t.filter(function(x){return ids.indexOf(x)>=0});if(!pick.length)pick=ids.slice();
  function seg(name,key,list,val){return '<span class="seg sm set-sg" data-key="'+key+'" role="group" aria-label="'+name+'">'+list.map(function(x){return '<button type="button" data-v="'+x[0]+'" aria-pressed="'+(String(x[0])===String(val)?'true':'false')+'"'+(String(x[0])===String(val)?' class="on"':'')+'>'+x[1]+'</button>'}).join('')+'</span>'}
  /* 1 — what */
  var s1=el('section','mk-sum set-s','<h2><span class="set-i">1</span>What to practise</h2>'+seg('What to practise','sc',[['all','Whole '+esc(CFG.section||'section')],['pick','Choose topics']],O.sc));
  var tl=el('div','set-tl');var cnt={};TS.forEach(function(t){cnt[t.id]=t.slides.filter(function(s){return isPractice(s)&&s.t!=='trace'}).length});
  ((ST.SEC&&ST.SEC.groups)||[]).forEach(function(g){var gt=TS.filter(function(t){return t.group===g[0]});if(!gt.length)return;
    var gw=el('div','set-gp'),gh=el('label','set-gh','<input type="checkbox" data-g="'+g[0]+'"><b>'+g[0]+'</b> '+esc(g[1]));gw.appendChild(gh);
    gt.forEach(function(t){gw.appendChild(el('label','set-t','<input type="checkbox" data-t="'+t.id+'"'+(pick.indexOf(t.id)>=0?' checked':'')+'><span>'+esc(t.n)+'</span><small>'+cnt[t.id]+' q</small>'))});tl.appendChild(gw)});
  s1.appendChild(tl);app.appendChild(s1);
  /* 2 — how many */
  var s2=el('section','mk-sum set-s','<h2><span class="set-i">2</span>How many questions</h2><div class="set-nw"></div><p class="note set-ni"></p>');app.appendChild(s2);
  /* 3 — how */
  var s3=el('section','mk-sum set-s','<h2><span class="set-i">3</span>How</h2>'+seg('Mode','ex',[[0,'Practice'],[1,'Exam']],O.ex)+'<p class="note set-mn"></p>'+
    seg('Which questions','w',[[1,'Not right yet first'],[0,'Any question']],O.w)+'<p class="note set-wn"></p>'+
    seg('Order','o',[[0,'Random'],[1,'In lesson order']],O.o)+'<p class="note set-on"></p>');app.appendChild(s3);
  var go=el('section','set-go','<p class="set-sum"></p><div class="row"><button class="btn pri" type="button" id="setGo">Start</button><a class="btn ghost" href="#/">Back to the topics</a></div>');app.appendChild(go);
  /* last sets on this device */
  var H=[];try{H=JSON.parse(localStorage.getItem(SHK)||'[]')||[]}catch(e){}
  if(Array.isArray(H)&&H.length)app.appendChild(el('section','mk-sum set-h','<h2>Your last sets</h2><div class="set-hl">'+H.slice(0,8).map(function(h){var p=h.n?Math.round(h.ok/h.n*100):0;
    return '<div class="set-hr"><span>'+dmy(h.d)+'</span><span>'+(h.ex?'Exam':'Practice')+' · '+h.n+' q'+(h.sc?' · '+esc(h.sc):'')+'</span><b class="'+(p>=75?'ok':p>=50?'mid':'low')+'">'+h.ok+'/'+h.n+' · '+p+'%</b></div>'}).join('')+'</div><p class="note">Kept on this device.</p>'));
  function chosen(){return O.sc==='all'?ids.slice():$$('[data-t]',tl).filter(function(c){return c.checked}).map(function(c){return c.dataset.t})}
  function paint(){
    tl.hidden=O.sc!=='pick';
    $$('[data-g]',tl).forEach(function(gc){var bx=$$('[data-t]',gc.closest('.set-gp')),on=bx.filter(function(c){return c.checked}).length;gc.checked=on===bx.length;gc.indeterminate=on>0&&on<bx.length});
    var tids=chosen(),pl=setPool(tids),N=pl.n,opts=[10,20,30,50,100].filter(function(v){return v<N});
    $('.set-nw',s2).innerHTML=seg('How many questions','n',opts.map(function(v){return [v,String(v)]}).concat([[N,'All '+N]]),Math.min(O.n,N));
    var n=Math.min(O.n,N),L=pl.L;
    $$('.set-sg',app).forEach(function(sg){var key=sg.dataset.key,val=key==='n'?n:O[key];$$('button',sg).forEach(function(b){var on=String(b.dataset.v)===String(val);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')})});
    $('.set-ni',s2).innerHTML=N?(n>=L?'Spread over <b>'+L+'</b> LOS — about '+Math.max(1,Math.round(n/L))+' from each.':'One question from each of '+n+' of the <b>'+L+'</b> LOS.'):'No practice questions in what you picked yet.';
    $('.set-mn',s3).innerHTML=O.ex?'<b>Exam</b>: one clock for the whole set at exam pace (100 multiple-choice questions in 3 hours = 1:48 each). The right answers and the explanations come at the end.':'<b>Practice</b>: the right answer and why come after each question. The topic stays hidden until you answer — first decide which idea the question tests.';
    $('.set-on',s3).innerHTML=O.o?'Topic by topic, in the order of the lessons — good for a first pass after studying.':'Mixed at random — closest to the exam.';
    $('.set-wn',s3).innerHTML=O.w?'Questions you got wrong come first, then ones you have not tried, then ones due for review.':'Any question, at random.';
    var mins=Math.round(n*pl.avg/60);
    $('.set-sum',go).innerHTML=n?'<b>'+n+'</b> question'+(n===1?'':'s')+' · '+(tids.length===ids.length?'whole section':tids.length+' topic'+(tids.length===1?'':'s'))+' · '+(O.ex?'Exam — your clock: <b>'+hms(n*pl.avg)+'</b>':'Practice — about '+mins+' min at exam pace'):'Tick at least one topic.';
    $('#setGo',go).disabled=!n;
    try{localStorage.setItem(SOK,JSON.stringify({sc:O.sc,t:tids,n:O.n,ex:O.ex,w:O.w,o:O.o}))}catch(e){}}
  [s1,s2,s3].forEach(function(x){x.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.set-sg button');if(!b)return;var key=b.parentNode.dataset.key;O[key]=key==='sc'?b.dataset.v:+b.dataset.v;paint()})});
  $$('[data-t]',tl).forEach(function(c){c.onchange=paint});
  $$('[data-g]',tl).forEach(function(gc){gc.onchange=function(){$$('[data-t]',gc.closest('.set-gp')).forEach(function(c){c.checked=gc.checked});paint()}});
  $('#setGo',go).onclick=function(){var tids=chosen(),N=setPool(tids).n;if(!N)return;
    var sc=tids.length===ids.length?'whole section':tids.length===1?ST.byId[tids[0]].n.split(' — ')[0]:tids.length+' topics';setStart({t:tids,n:Math.min(O.n,N),ex:O.ex,w:O.w,o:O.o,sc:sc})};
  paint();bankList(app)}
/* the result: score, time, by LOS, and every question with the answer and the explanation */
function rightAns(s){var L='ABCDEFGH';
  if(s.t==='mcq')return L[s.a]+' — '+s.o[s.a];
  if(s.t==='multi')return s.a.map(function(i){return L[i]}).join(', ');
  if(s.t==='num'){var f=s.f||[{l:'Answer',a:s.a}];return f.map(function(x){return (f.length>1?esc(x.l)+': ':'')+(x.a<0?'('+ST.money(-x.a)+')':ST.money(x.a))}).join(' · ')}
  if(s.t==='dd')return s.f.map(function(f){return esc(f.o[f.a])}).join(' · ');
  return ''}
function setResult(){var app=$('#app');app.innerHTML='';var R0=null;try{R0=JSON.parse(sessionStorage.getItem(SRK)||'null')}catch(e){}
  if(!R0||!Array.isArray(R0.a)){location.hash='#/practice';return}
  var X=R0.a.map(function(r,j){var p=r.split('/'),t=ST.byId[p[0]],i=+p[1]-1,s=t&&t.slides[i];return s?{t:t,i:i,s:s,k:slideKey(t,i),st:R0.st[j],j:j,ref:r}:null}).filter(Boolean);
  var n=X.length,ok=X.filter(function(x){return x.st===1}).length,un=X.filter(function(x){return x.st<0}).length,pct=n?Math.round(ok/n*100):0,col=pct>=75?'var(--teal)':pct>=50?'var(--gold)':'var(--red)';
  var hero=el('section','hero','<div><div class="kick">'+(R0.ex?'Exam set':'Practice set')+' · '+esc(CFG.section||'')+' · '+dmy(R0.e)+'</div><h1>'+ok+' of '+n+' right</h1>'+
    '<div class="rd"><div class="rd-n"><b>'+pct+'%</b><span>'+(R0.sc?esc(R0.sc)+' · ':'')+n+' question'+(n===1?'':'s')+'</span></div><div class="rd-bar" role="img" aria-label="'+pct+'% right, target 75%"><i style="width:'+pct+'%;background:'+col+'"></i><s style="left:75%"></s></div>'+
    '<div class="rd-l">'+(R0.up?'<span><b>Time ran out</b></span>':'')+(R0.ex?'<span>Time used <b>'+hms(R0.used)+'</b> of '+hms(R0.T)+'</span>':'<span>Time <b>'+hms(R0.used)+'</b> · exam pace '+hms(R0.T)+'</span>')+(un?'<span><b>'+un+'</b> not answered</span>':'')+'<span><b>'+(n-ok-un)+'</b> wrong</span></div>'+
    '<p class="note">'+(pct>=75?'At the 75% target for this set.':'Target <b>75%</b>. The table below shows which LOS to study first.')+'</p></div>'+
    '<div class="row" id="srBtns"></div></div>');
  app.appendChild(hero);var bt=$('#srBtns',hero);
  var wr=X.filter(function(x){return x.st!==1});
  if(wr.length){var b1=el('button','btn pri','Try the '+wr.length+' I missed again');b1.onclick=function(){revSet({l:'m',a:wr.map(function(x){return x.ref})});location.hash='#/t/'+wr[0].ref};bt.appendChild(b1)}
  var b2=el('button','btn','Same questions again');b2.onclick=function(){setRun(shuffle(R0.a.slice()),R0.ex,R0.sc)};bt.appendChild(b2);
  var b3=el('a','btn','New set');b3.href='#/bank';bt.appendChild(b3);
  /* by LOS — weakest first */
  var LM={};ST.LOS.forEach(function(l){LM[l.c]=l});var by={},ord=[];
  X.forEach(function(x){var c=losOf(x.s)[0]||x.t.group;if(!by[c]){by[c]={c:c,n:0,ok:0};ord.push(c)}by[c].n++;if(x.st===1)by[c].ok++});
  ord.sort(function(a,b){return by[a].ok/by[a].n-by[b].ok/by[b].n||by[b].n-by[a].n});
  app.appendChild(el('section','mk-sum set-los','<h2>By LOS</h2><div class="tw"><table class="t"><tr><th>LOS</th><th>What it covers</th><th>Right</th></tr>'+ord.map(function(c){var o=by[c],p=Math.round(o.ok/o.n*100),l=LM[c];
    return '<tr><td><b>'+esc(c)+'</b></td><td>'+(l?esc(l.d):'')+'</td><td class="set-pc"><b class="'+(p>=75?'ok':p>=50?'mid':'low')+'">'+o.ok+'/'+o.n+'</b><i style="--p:'+p+'%"></i></td></tr>'}).join('')+'</table></div></section>'));
  /* every question */
  var ql=el('section','mk-sum set-ql','<h2>Every question</h2><p class="note">Open a question to try it again, or read the explanation here.</p>');
  X.forEach(function(x){var cz=x.st===0?causeOf(x):null,ra=rightAns(x.s),sh=String(x.s.q||x.s.s||x.s.h||''),tb=sh.indexOf('<table'),stem=strip((tb>0?sh.slice(0,tb):sh).replace(/\{\d+\}/g,'____').replace(/</g,' <')).replace(/\s+/g,' ').trim();if(tb>0)stem+=' (table)';if(stem.length>150)stem=stem.slice(0,147)+'…';
    var lc=ideaOf(x.t,x.i,x.s,0);
    var w=el('div','set-qi '+(x.st===1?'ok':x.st===0?'bad':'na'),'<div class="set-qh"><span class="set-m">'+(x.st===1?'✓':x.st===0?'✗':'–')+'</span><span class="set-qn">'+(x.j+1)+'</span><span class="set-qt">'+esc(stem)+'<small>'+esc(x.t.n.split(' — ')[0])+' · '+losOf(x.s).map(function(c){return 'LOS '+c}).join(' · ')+(x.st<0?' · not answered':'')+'</small></span></div>'+
      '<div class="set-qd">'+(cz&&cz.ans?'<div><span class="note">Your answer:</span> '+cz.ans+'</div>':'')+(x.st!==1&&ra?'<div><span class="note">Right answer:</span> <b>'+ra+'</b></div>':'')+(cz&&cz.why?'<div class="mk-why">'+cz.why+'</div>':'')+
      (x.s.e?'<details class="set-ex"><summary>Explanation</summary><div>'+x.s.e+'</div></details>':'')+
      '<div class="mk-go"><a href="#/t/'+x.ref+'">Open the question</a>'+(lc!==null?'<a href="#/t/'+x.t.id+'/'+(lc+1)+'">Review the idea (slide '+(lc+1)+')</a>':'')+'</div></div>');
    ql.appendChild(w)});
  app.appendChild(ql)}
/* exam readiness for the whole section — every practice question counts, also in topics not open yet (the exam covers them all).
   A right answer counts 1 (a guess 0.5, not sure 0.8), ×0.75 while it is due for review; then × pace when slower than the exam allows */
function readiness(){var tot=0,sc=0,ok=0,due=0,now=Date.now(),sec=0,bud=0,tm=0;
  ST.topics.forEach(function(t){if(t.soon)return;t.slides.forEach(function(s,i){if(!isPractice(s))return;tot++;var q=P.q[slideKey(t,i)];
    if(!q||!live(q[1],t.id))return;if(q[3]>0){sec+=q[3];bud+=budget(s);tm++}
    if(q[0]!==1)return;ok++;var v=q[4]==='g'?0.5:q[4]==='u'?0.8:1;if(now>=dueAt(q)){v*=0.75;due++}sc+=v})});
  var use=tm>=5&&bud?sec/bud:0,pf=use>1?Math.max(0.6,1/use):1;
  return {pct:tot?Math.round(sc/tot*pf*100):0,tot:tot,ok:ok,due:due,use:Math.round(use*100),tm:tm}}
ST.readiness=readiness;
function readyBox(R){var col=R.pct>=75?'var(--teal)':R.pct>=50?'var(--gold)':'var(--red)';
  return '<div class="rd"><div class="rd-n"><b>'+R.pct+'%</b><span>exam readiness · '+esc(CFG.section||'')+'</span></div>'+
    '<div class="rd-bar" role="img" aria-label="Readiness '+R.pct+'%, target 75%"><i style="width:'+R.pct+'%;background:'+col+'"></i><s style="left:75%"></s></div>'+
    '<div class="rd-l"><span><b>'+R.ok+'/'+R.tot+'</b> practice questions right now</span><span><b>'+R.due+'</b> due for review</span><span>'+(R.tm>=5?'Pace <b>'+R.use+'%</b> of exam time':'Pace: after 5 timed answers')+'</span></div>'+
    '<p class="note">'+(R.pct>=75?'At the target. Keep reviewing so it stays there.':'Target <b>75%</b> before you book the exam.')+'</p></div>'}
function readyHelp(){modal('How exam readiness works','<p>Readiness looks at <b>every practice question in '+esc(CFG.section||'this section')+'</b> — also in topics not open yet, because the exam covers them all.</p><ul>'+
  '<li><b>Knowledge:</b> a question counts when your latest answer is right. A right answer you marked <b>Guessing</b> counts half, <b>Not sure</b> 80%.</li>'+
  '<li><b>Memory:</b> a right answer comes back for review after 1, 3, 7, 14 and 30 days — longer each time you get it right again. While it is due and not reviewed it counts 75%.</li>'+
  '<li><b>Pace:</b> slower than the exam allows (100 questions in 3 hours = 1:48 each) lowers readiness in the same proportion, after 5 timed answers.</li></ul>'+
  '<p>Aim for <b>75% or more</b> before you book the exam. It is a START TIME guide to your preparation, not an IMA score.</p>')}
/* how sure the student was against the result */
function confSec(){var g={sr:0,sw:0,ur:0,uw:0},n=0;
  ST.topics.forEach(function(t){if(t.soon||ST.lock(t))return;t.slides.forEach(function(s,i){if(!isPractice(s))return;var q=P.q[slideKey(t,i)];
    if(!q||!live(q[1],t.id)||!q[4])return;n++;g[(q[4]==='s'?'s':'u')+(q[0]===1?'r':'w')]++})});
  var box=el('section','mk-sum');
  if(!n){box.innerHTML='<h2>How sure you were</h2><p class="note">Before answering a practice question you can tap <b>Sure</b>, <b>Not sure</b> or <b>Guessing</b>. It is optional, but it shows what you only <i>think</i> you know — the mistakes that cost the most in an exam.</p>';return box}
  var T=[['sr','p-good','Sure and right','Solid knowledge.'],['sw','p-rush','Sure but wrong','A misconception — fix these first: read the explanation slowly.'],
    ['ur','p-slow','Unsure but right','Shaky — review these until you are sure.'],['uw','p-gap','Unsure and wrong','A known gap — study the idea, then practise.']];
  box.innerHTML='<h2>How sure you were</h2><p class="pace-l">'+n+' answer'+(n===1?'':'s')+' with a pick.'+(g.sw?' <b>'+g.sw+'</b> sure but wrong — the most important to fix.':'')+'</p><div class="mk-cs">'+
    T.map(function(x){return '<div class="mk-c '+x[1]+'"><b>'+g[x[0]]+'</b><span>'+x[2]+'</span><small>'+x[3]+'</small></div>'}).join('')+'</div>';
  return box}
function mistakesPage(){
  var app=$('#app');app.innerHTML='';var list=mistakes(),dl=dueList(),RD=readiness(),rv0=revGet();if(rv0&&rv0.l!=='c')revSet(null);   // a running practice set keeps going
  var nt=list.map(function(x){return x.t.id}).filter(function(v,i,a){return a.indexOf(v)===i}).length;
  var hero=el('section','hero','<div><div class="kick">Practice · '+esc(CFG.section||'')+'</div><h1>Exam readiness &amp; mistakes</h1>'+
    '<p>How ready you are for the exam, the questions due for review, and every practice question whose <b>latest answer was wrong</b> — get it right and it leaves the list.</p>'+readyBox(RD)+
    (list.length?'<div class="stats"><span><b>'+list.length+'</b> mistake'+(list.length===1?'':'s')+' to fix</span><span><b>'+nt+'</b> topic'+(nt===1?'':'s')+'</span></div>'
      :'<div class="fb ok">No mistakes waiting — every practice question you answered is right now.</div>')+
    '<div class="row">'+(list.length?'<button class="btn pri" id="mkGo">Review my mistakes</button>':'')+(dl.length?'<button class="btn'+(list.length?'':' pri')+'" id="dueGo">Spaced review ('+Math.min(dl.length,20)+')</button>':'')+
    '<button class="btn ghost" id="rdHelp">How readiness works</button><a class="btn ghost" href="#/">Back to the topics</a></div></div>');
  app.appendChild(hero);
  $('#rdHelp',hero).onclick=readyHelp;
  var mr=null;try{mr=JSON.parse(sessionStorage.getItem('st-mixres')||'null');sessionStorage.removeItem('st-mixres')}catch(e){}
  if(mr)hero.firstChild.insertBefore(el('div','fb '+(mr.n&&mr.ok/mr.n>=0.75?'ok':''),'<b>Mixed quiz: '+mr.ok+' of '+mr.n+' right</b>'+(mr.n<mr.tot?' ('+(mr.tot-mr.n)+' not answered)':'')+'. Any wrong answer is now in your mistakes below, with its cause.'),hero.firstChild.querySelector('.rd'));
  if(dl.length){var byT={},ord=[];dl.forEach(function(x){if(!byT[x.t.id]){byT[x.t.id]={t:x.t,n:0,i:x.i};ord.push(x.t.id)}byT[x.t.id].n++});
    app.appendChild(el('section','mk-sum due','<h2>Due for review · '+dl.length+'</h2><p class="note">Questions you got right some days ago. Answering them again from memory is what keeps them for the exam; each right answer pushes the next review further (1 → 3 → 7 → 14 → 30 days).</p><div class="due-l">'+
      ord.map(function(id){var o=byT[id];return '<a class="chip t" href="#/t/'+id+'/'+(o.i+1)+'">'+esc(o.t.n.split(' — ')[0])+' · '+o.n+'</a>'}).join('')+'</div>'));
    $('#dueGo',hero).onclick=function(){var a=dl.slice(0,20).map(function(x){return x.t.id+'/'+(x.i+1)});revSet({l:'d',a:a});location.hash='#/t/'+a[0]}}
  var ps=el('section','mk-sum mix','<h2>Practice set</h2><p class="note">Pick the part — the whole section or some topics — and the number of questions, as Practice (the answer after each question) or Exam (one clock, the answers at the end). The questions are spread across the LOS the way the exam spreads them.</p><div class="row"><a class="btn" href="#/bank">Open the question bank</a></div>');app.appendChild(ps);
  var mp=mixPool();
  if(mp.tn>=2&&mp.a.length>=4){var mx=el('section','mk-sum mix','<h2>Mixed quiz</h2><p class="note">10 questions from different topics in random order. The topic stays hidden until you answer, so — like the exam — you first have to recognise which idea the question tests. The best cure for mixing up two topics.</p><div class="row"><button class="btn" type="button">Start a mixed quiz</button></div>');
    mx.querySelector('button').onclick=mixStart;app.appendChild(mx)}
  var pc=paceSec();if(pc)app.appendChild(pc);
  app.appendChild(confSec());
  if(!list.length)return;
  var cnt={c:0,k:0,r:0,mix:0};list.forEach(function(x){x.cause=causeOf(x);cnt[x.cause.c]=(cnt[x.cause.c]||0)+1});
  var sum=el('section','mk-sum','<h2>What is behind your mistakes</h2><div class="mk-cs">'+['k','c','mix','r'].filter(function(c){return cnt[c]}).sort(function(a,b){return cnt[b]-cnt[a]}).map(function(c){
      return '<div class="mk-c c-'+c+'"><b>'+cnt[c]+'</b><span>'+CAUSE[c][0]+'</span><small>'+CAUSE[c][2]+'</small></div>'}).join('')+'</div>');
  app.appendChild(sum);
  $('#mkGo',hero).onclick=function(){revSet({l:'m',a:list.map(function(x){return x.t.id+'/'+(x.i+1)})});location.hash='#/t/'+list[0].t.id+'/'+(list[0].i+1)};
  var cur='',box=null;
  list.forEach(function(x){
    if(x.t.id!==cur){cur=x.t.id;app.appendChild(el('div','sub',esc(x.t.group)+' · '+esc(x.t.n)));box=el('div','mk-l');app.appendChild(box)}
    var a=el('a','mk-i');a.href='#/t/'+x.t.id+'/'+(x.i+1);
    var cz=x.cause,cl=CAUSE[cz.c]||CAUSE.c,mt=cz.mix&&ST.byId[cz.mix],lc=null;
    lc=ideaOf(x.t,x.i,x.s,1);   // the explanation slide first, else the interactive one
    var det=el('div','mk-d','<span class="mk-cc"><span class="chip c-'+cz.c+'">'+cl[0]+(mt?': '+esc(mt.n):'')+'</span>'+(P.q[x.k]&&P.q[x.k][4]==='s'?' <span class="chip r">You were sure — a misconception</span>':'')+'</span>'+(cz.ans?'<div><span class="note">Your answer:</span> '+cz.ans+'</div>':'')+(P.q[x.k]&&P.q[x.k][3]>0?'<div class="note">Time: <b>'+mmss2(P.q[x.k][3])+'</b> · exam pace '+mmss2(budget(x.s))+(P.q[x.k][3]<budget(x.s)*0.5?' — answered in a rush':P.q[x.k][3]>budget(x.s)*1.5?' — slower than the exam allows':'')+'</div>':'')+
      (cz.why?'<div class="mk-why">'+cz.why+'</div>':'<div class="note">'+cl[1]+'.</div>')+
      '<div class="mk-go">'+(lc!==null?'<a href="#/t/'+x.t.id+'/'+(lc+1)+'">Review the idea (slide '+(lc+1)+')</a>':'')+(mt?'<a href="#/t/'+mt.id+'/1">Open '+esc(mt.n)+'</a>':'')+'</div>');
    a.innerHTML='<span class="mk-n">'+(x.i+1)+'</span><span class="mk-t"><b>Practice '+x.n+(x.s.h?' — '+esc(strip(x.s.h).replace(/^(Practice|Exam-style question)\s*:?\s*/i,'')||'exam-style question'):'')+'</b><small>'+losOf(x.s).map(function(c){return 'LOS '+c}).join(' · ')+' · answered wrong on '+dmy(x.ts)+'</small></span><span class="chip r">↻ try again</span>';
    var wrap=el('div','mk-w');wrap.appendChild(a);wrap.appendChild(det);box.appendChild(wrap)});
}
function strip(h){var d=document.createElement('div');d.innerHTML=h||'';return d.textContent||''}
/* the review bar above a slide while "Review them one by one" runs */
function reviewBar(t,idx){var rv=revGet();if(!rv)return null;var A=rv.a,me=t.id+'/'+(idx+1),i=A.indexOf(me),dd=rv.l==='d',mx=rv.l==='x';if(i<0)return null;
  if(rv.l==='c')return setBar(rv,i);
  var b=el('div','rv-bar'+(dd||mx?' due':''),'<span><b>'+(mx?'Mixed quiz':dd?'Spaced review':'Reviewing my mistakes')+'</b> · '+(i+1)+' of '+A.length+(dd?' · answer from memory':mx?' · the topic shows after you answer':'')+'</span>');
  var nx=el('button','btn sm pri',i+1<A.length?(dd||mx?'Next question':'Next mistake'):(mx?'Finish quiz':'Finish review'));
  nx.onclick=function(){if(i+1<A.length){var p=A[i+1].split('/');location.hash='#/t/'+p[0]+'/'+p[1]}else{if(mx)mixResult(rv);revSet(null);location.hash='#/mistakes'}};
  var st=el('button','btn sm ghost','Stop');st.onclick=function(){revSet(null);location.hash='#/mistakes'};
  b.appendChild(nx);b.appendChild(st);return b}

/* =========================================================
   LOS MAP
   ========================================================= */
/* Glossary (Roles → glossPage): every key term of the topics open to this person, English and Arabic, A to Z, with a search box */
function glossPage(){
  var app=$('#app');app.innerHTML='';
  var rows=ST.glRows(),open=ST.topics.filter(function(t){return !t.soon&&!ST.lock(t)}).map(function(t){return t.id});
  var hero=el('div','hero','<div><div class="kick">CMA '+esc(CFG.part||'Part 1')+' · '+esc(CFG.section||'')+' · key terms</div><h1>Glossary</h1>'+
    '<p>Every key term of the topics open to you, in English and Arabic, with what it means, A to Z. The Arabic is your instructor\'s; where he has not written one yet, it is Google\'s.</p>'+
    '<div class="row gp-tools"><input type="search" class="gp-q" placeholder="Search — English or عربي" aria-label="Search the glossary"><span class="note gp-n">'+rows.length+' terms</span>'+
    (ST.can('glossPrint')&&ST.can('print')&&rows.length?'<a class="btn" href="#/print/'+open.join(',')+'?k=g&style=clean&ans=0">Print / PDF the glossary</a>':'')+'</div></div>');
  app.appendChild(hero);
  var wrap=el('div','gp');app.appendChild(wrap);
  if(!rows.length){wrap.innerHTML='<p class="note">No key terms yet: they come from the Key terms slide at the end of each open topic.</p>';return}
  var letter='',html='';
  rows.forEach(function(r){var L=(r.k.match(/[a-z0-9]/)||['#'])[0].toUpperCase();if(/[0-9]/.test(L))L='#';
    if(L!==letter){if(letter)html+='</div>';letter=L;html+='<div class="gp-g" data-l="'+L+'"><h2 class="gp-l">'+L+'</h2>'}
    html+='<div class="gp-r" data-k="'+esc(r.k)+'"><div class="gp-h"><b class="gp-en">'+r.en+'</b><span class="gp-ar" dir="rtl" lang="ar" data-k="'+esc(r.k)+'"></span></div>'+
      '<div class="gp-m">'+r.m+(r.w?'<span class="gp-w">'+r.w+'</span>':'')+'</div>'+
      '<div class="gp-t">'+r.t.map(function(t){return '<a href="#/t/'+t.id+'/'+(t.nL||1)+'">'+esc(t.n)+'</a>'}).join(' · ')+'</div></div>'});
  wrap.innerHTML=html+'</div>';
  ST.glFill(wrap);
  var q=$('.gp-q',hero),cnt=$('.gp-n',hero);
  q.oninput=function(){var v=q.value.trim().toLowerCase(),n=0;
    $$('.gp-r',wrap).forEach(function(r){var hit=!v||r.textContent.toLowerCase().indexOf(v)>=0;r.hidden=!hit;if(hit)n++});
    $$('.gp-g',wrap).forEach(function(g){g.hidden=!$$('.gp-r',g).some(function(r){return !r.hidden})});
    cnt.textContent=v?n+' of '+rows.length+' terms':rows.length+' terms'};
}
function losMap(){
  var app=$('#app');app.innerHTML='';
  var links={};ST.topics.forEach(function(t){if(t.soon)return;t.slides.forEach(function(s,i){losOf(s).forEach(function(c){(links[c]=links[c]||[]).push({t:t,i:i,s:s})})})});
  app.appendChild(el('div','hero','<div><div class="kick">2024 CMA Learning Outcome Statements · '+esc(CFG.part||'Part 1')+' · '+esc(CFG.section||'')+'</div><h1>LOS map</h1><p>Every LOS in '+esc(CFG.section||'this section')+', with the slides that teach it and the slides that test it. A tick means every slide linked to that LOS is done: concept slides read and practice answered correctly.</p></div>'));
  var lastG='',lastSub='';var wrap=el('div','lm');
  ST.LOS.forEach(function(l){
    if(l.g!==lastG){lastG=l.g;wrap.appendChild(el('div','grp','<span class="code">'+l.g+'</span><h2>'+(l.g==='A.1'?'Financial statements':'Recognition, measurement, and valuation')+'</h2>'))}
    if(l.sub!==lastSub){lastSub=l.sub;wrap.appendChild(el('div','sub',esc(l.sub)))}
    var ls=links[l.c]||[],seen=ls.filter(function(x){return slideDone(x.t,x.s,slideKey(x.t,x.i))}).length;
    var st=!ls.length?'<span class="st no">not built yet</span>':(seen===ls.length?'<span class="st ok">✓ mastered</span>':(seen?'<span class="st part">'+seen+'/'+ls.length+'</span>':'<span class="st no">0/'+ls.length+'</span>'));
    var r=el('div','lr','<span class="c">'+l.c.replace(/^A\.(\d)\./,'A.$1.')+'</span><div class="d">'+esc(l.d)+'</div>'+st);
    if(ls.length){var lk=el('div','links');ls.forEach(function(x){var lo=ST.lock(x.t),a=el(lo?'span':'a',lo?'lk-x':'',esc(x.t.n.split(' — ')[0])+' · '+(x.i+1)+(isPractice(x.s)?' ✎':'')+(lo?' · '+esc(lockText(lo)):(slideDone(x.t,x.s,slideKey(x.t,x.i))?' ✓':'')));if(!lo)a.href='#/t/'+x.t.id+'/'+(x.i+1);lk.appendChild(a)});r.appendChild(lk)}
    wrap.appendChild(r)});
  app.appendChild(wrap);
}

/* =========================================================
   DECK
   ========================================================= */
var cur={t:null,i:0};
/* the explanation view: portrait (reading — text, then its picture; the page scrolls) or landscape (presenting — one 16:9 screen,
   the text beside its picture, sized to fit). Saved per device; full screen opens landscape unless the viewer chose portrait. Narrow screens stay portrait. */
var ORK='st-orient';
function orientPref(){try{var v=localStorage.getItem(ORK);return v==='l'||v==='p'?v:null}catch(e){return null}}
/* two landscape styles, each allowed per role on the Roles sheet (View: …): fit = the whole slide on one screen (text shrinks),
   split = large text, a long slide shows in parts under the same number.
   The viewer picks one in Settings (saved per device); portrait is always there. */
var LMK='st-landmode',LSTY=[['fit','viewFit','One screen'],['split','viewSplit','In parts, large text']];
function landStyles(){return LSTY.filter(function(x){return ST.can(x[1])}).map(function(x){return x[0]})}
function landMode(){var a=landStyles(),v='';try{v=localStorage.getItem(LMK)||''}catch(e){}if(a.indexOf(v)<0)v=a[0]||'';return v}
ST.landStyles=landStyles;ST.landMode=landMode;ST.LSTY=LSTY;
function orient(){if(window.innerWidth<700||!landStyles().length)return 'p';var v=orientPref();return v||(document.fullscreenElement?'l':'p')}
function setOrient(o){try{localStorage.setItem(ORK,o)}catch(e){}if(cur.t&&/^#\/t\//.test(location.hash))deck(cur.t.id,cur.i)}
var VIS1='.anm,.scene,figure,.fig,svg.dg',VIS2='.tw,.tiles,.quad,.months',VIS3='.call,.qc';   // beside the text: the picture; with no picture, the table or tiles; with neither, the callouts and the quick check
function landLayout(body){var kids=[].slice.call(body.children),pick=function(q){return kids.filter(function(c){return c.matches&&c.matches(q)})},vis=pick(VIS1);if(!vis.length)vis=pick(VIS2);if(!vis.length)vis=pick(VIS3);if(vis.length===kids.length)return;
  if(!vis.length)return;var L=el('div','lcol'),R=el('div','rcol');
  /* keep the reading order of the portrait slide, left to right: a picture that comes before most of the text goes on the LEFT
     (with the lines above it, e.g. the story), the text after it on the right; a picture that follows the text stays on the right */
  var i0=kids.indexOf(vis[0]),pre=kids.slice(0,i0).filter(function(c){return vis.indexOf(c)<0}).length,post=kids.length-vis.length-pre;
  if(pre<=post){kids.forEach(function(c,i){(vis.indexOf(c)>=0||i<i0?L:R).appendChild(c)});body.classList.add('vl')}
  else kids.forEach(function(c){(vis.indexOf(c)>=0?R:L).appendChild(c)});
  body.appendChild(L);body.appendChild(R);body.classList.add('two')}
function fitLand(){var d=$('.deck.land');if(!d)return;
  if(d.classList.contains('splitv')){splitLand();return}
  var sec=$('.slide',d),sb=sec&&$('.sb',sec),nav=$('.dk-nav',d);if(!sb)return;
  var avail=window.innerHeight-(nav?nav.offsetHeight:0)-20-Math.max(0,sec.getBoundingClientRect().top);
  var z=1.25,n=0;sb.style.zoom=z;while(sec.offsetHeight>avail&&z>0.68&&n++<40){z=Math.round((z-0.03)*100)/100;sb.style.zoom=z}
  d.dataset.zoom=z}
/* split view: the blocks of the slide, in reading order, go into parts that each fit at a large size (from 105 %, up to 130 %);
   Next / Previous walk through the parts before leaving the slide. */
var WANT_LAST=false;
function splitLand(){var d=$('.deck.land.splitv');if(!d)return;var sec=$('.slide',d),sb=sec&&$('.sb',sec),nav=$('.dk-nav',d);if(!sb)return;
  var L=$('.lcol',sb),R=$('.rcol',sb),items=L?[].slice.call(L.children).concat([].slice.call(R.children)):[].slice.call(sb.children);
  var avail=window.innerHeight-(nav?nav.offsetHeight:0)-20-Math.max(0,sec.getBoundingClientRect().top),fits=function(){return sec.offsetHeight<=avail};
  var vis=function(col){return [].some.call(col.children,function(e){return e.style.display!=='none'})};
  function show(a,b){items.forEach(function(e,i){e.style.display=i>=a&&i<b?'':'none'})}
  function grow(){var z=1.3,n=0;sb.style.zoom=z;while(!fits()&&z>0.68&&n++<40){z=Math.round((z-0.03)*100)/100;sb.style.zoom=z}return z}
  /* pack in the two-column layout: a part takes the next blocks while they still fit at 90 % */
  sb.classList.remove('one');sb.style.maxWidth='';if(L)sb.classList.add('two');
  var parts=[],a=0;sb.style.zoom=0.9;
  while(a<items.length){var b=a+1;while(b<items.length){show(a,b+1);if(!fits())break;b++}parts.push([a,b]);a=b}
  /* a part that is only a line or two (the story line before its picture, say) joins the next part */
  var tiny=function(p){var it=items.slice(p[0],p[1]);return it.every(function(e){return /^(P|H3|H4)$/.test(e.tagName)})&&it.reduce(function(n,e){return n+(e.textContent||'').length},0)<220};
  for(var q=0;q<parts.length-1;){if(tiny(parts[q])){parts[q]=[parts[q][0],parts[q+1][1]];parts.splice(q+1,1)}else q++}
  if(parts.length>1&&tiny(parts[parts.length-1])){var lp=parts.pop();parts[parts.length-1][1]=lp[1]}
  /* lay each part out: both columns when it has blocks in both, otherwise one centred column */
  function lay(p,w){show(p[0],p[1]);var two=!L||(vis(L)&&vis(R));sb.classList.toggle('two',!!L&&two);sb.classList.toggle('one',!!L&&!two);sb.style.maxWidth=two?'':w}
  parts=parts.map(function(p){lay(p,'76%');return {a:p[0],b:p[1],z:grow(),w:'76%'}});   // pictures keep their own height, so a picture part may need smaller text on a short screen
  cur.parts=parts;cur.show=function(i){var p=parts[i];cur.part=i;lay([p.a,p.b],p.w);sb.style.zoom=p.z;d.dataset.zoom=p.z;d.dataset.part=(i+1)+'/'+parts.length;
    var m=$('.dk-nav .mid span',d),nx=$('.dk-nav .btn.pri span',d),pv=$('.dk-nav .btn:not(.pri)',d);
    if(m){if(m.dataset.base==null)m.dataset.base=m.textContent;m.textContent=m.dataset.base+(parts.length>1?' · '+(i+1)+'/'+parts.length:'')}
    if(nx){if(nx.dataset.base==null)nx.dataset.base=nx.textContent;nx.textContent=i<parts.length-1?'Next part':nx.dataset.base}
    if(pv&&i>0)pv.disabled=false;window.scrollTo(0,0)};
  var i=cur.part==='last'?parts.length-1:Math.min(cur.part||0,parts.length-1);cur.show(i)}
var fitT=null;window.addEventListener('resize',function(){clearTimeout(fitT);fitT=setTimeout(function(){if(!$('.deck'))return;if(($('.deck.land')?'l':'p')!==orient()&&cur.t)deck(cur.t.id,cur.i);else fitLand()},180)});
document.addEventListener('fullscreenchange',function(){if(cur.t&&/^#\/t\//.test(location.hash)&&!orientPref())deck(cur.t.id,cur.i)});
ST.orient=orient;
/* the topic's question bank: the card at the end of the lesson (and in the topic window) */
function bankQs(t){var a=[];for(var i=t.nL||0;i<t.slides.length;i++){var s=t.slides[i];if(isPractice(s)&&s.t!=='trace')a.push({t:t,i:i,s:s,k:slideKey(t,i),ref:t.id+'/'+(i+1)})}return a}
function bankStat(Q){var ok=0,tr=0;Q.forEach(function(x){var r=qRes(x.k);if(r!==null)tr++;if(r===1)ok++});return {ok:ok,tr:tr,n:Q.length}}
function bankCard(t){var Q=bankQs(t),st=bankStat(Q),nc=Q.filter(function(x){return x.s.case}).length,ng=Q.length-nc;
  var c=el('div','bank-c','<div class="bk-h">'+ICON.list+'<b>Practise this topic</b></div>'+
    '<p>That is the end of the lesson. This topic\'s section of the question bank has <b>'+ng+' exam-style question'+(ng===1?'':'s')+'</b>'+(nc?' and <b>a case</b> ('+nc+' questions)':'')+
    (st.tr?' — '+st.ok+' of '+st.n+' correct so far':'')+'. Practise them all, by LOS, as a timed exam set, or the case on its own.</p>');
  var r=el('div','row'),a=el('a','btn pri','Go to this topic\'s questions');a.href='#/bank/'+t.id;r.appendChild(a);c.appendChild(r);return c}
ST.bankCard=bankCard;
function deck(tid,idx){
  var t=ST.byId[tid];if(!t||t.soon){location.hash='#/';return}
  var lk=ST.lock(t);if(lk){var ap=$('#app');ap.innerHTML='';ap.appendChild(el('section','gate lk-p','<div class="gate-logo">'+LOCK+'</div><h1>'+esc(t.n)+'</h1><p>'+(lk.on?'This topic opens for your group on <b>'+esc(lk.on)+'</b>.':'This topic is not open for you yet.')+'</p><p class="note">Your instructor opens each topic when its lecture comes.</p><a class="btn pri" href="#/">Back to the topics</a>'));stopDwell();return}
  var n=t.slides.length;idx=Math.max(0,Math.min(n-1,idx));cur={t:t,i:idx};var nL=t.nL||n,inB=idx>=nL;
  var s=t.slides[idx],k=slideKey(t,idx);SEEN[k]=1;P.last=t.id+'/'+(idx+1);P.lt=Date.now();save();
  var app=$('#app');app.innerHTML='';
  var d=el('div','deck'),LAND=orient()==='l',LM=LAND?landMode():'';if(LAND)d.classList.add('land');document.body.classList.toggle('land-on',LAND);
  cur.part=WANT_LAST?'last':0;WANT_LAST=false;
  var top=el('div','dk-top');
  top.innerHTML='<a class="ib" href="#/" title="All topics" aria-label="All topics">'+ICON.back+'</a><h1>'+esc(t.n)+'<small>'+t.group+' · '+esc(t.sub)+'</small></h1>';
  var tocB=el('button','ib dk-toc',ICON.list);tocB.title='Slides in this topic';tocB.setAttribute('aria-label','Slides in this topic');tocB.onclick=function(){toc(t)};
  var fsB=el('button','ib dk-fs',ICON.full);fsB.title='Full screen (F)';fsB.setAttribute('aria-label','Full screen');fsB.onclick=toggleFS;
  top.appendChild(tocB);if(ST.deckTop)ST.deckTop(top,t,idx);top.appendChild(fsB);
  if(LAND){var gs=$('#nTheme svg'),vwB=el('button','ib dk-vw',gs?gs.outerHTML:'⚙');vwB.title='Settings: slide view, appearance';vwB.setAttribute('aria-label','Settings');vwB.onclick=settings;top.insertBefore(vwB,fsB)}   // the top bar is hidden in landscape
  if(window.innerWidth>=700&&landStyles().length){var orB=el('button','ib dk-or',LAND?ICON.port:ICON.land);orB.title=LAND?'Portrait view — for reading (L)':'Landscape view — for presenting (L)';orB.setAttribute('aria-label',orB.title);orB.onclick=function(){setOrient(LAND?'p':'l')};top.insertBefore(orB,fsB)}
  d.appendChild(top);
  d.appendChild(el('div','prog'+(inB?' inbank':''),'<i style="width:'+(inB?(idx-nL+1)/(n-nL):(idx+1)/nL)*100+'%"></i>'));
  var rvb=reviewBar(t,idx);if(rvb)d.appendChild(rvb);
  var rv0=rvb&&revGet(),si=rv0&&rv0.l==='c'?rv0.a.indexOf(t.id+'/'+(idx+1)):-1,exq=si>=0&&!!rv0.ex&&isPractice(s);
  if(rvb&&isPractice(s)&&(rv0.l==='x'||(si>=0&&!rv0.ex))){d.classList.add('mixq');$('h1',top).insertAdjacentHTML('afterend','<h1 class="mx-t">'+(rv0.l==='x'?'Mixed quiz':'Practice set')+'<small>Which topic is this? Decide, then answer</small></h1>')}
  if(exq){d.classList.add('exq');$('h1',top).insertAdjacentHTML('afterend','<h1 class="mx-t">Exam set<small>The answers and explanations come at the end</small></h1>')}
  var sec=el('section','slide');sec.setAttribute('aria-live','polite');
  var kind=isPractice(s)?(inB&&si<0?'QUESTION BANK':'PRACTICE'):(s.t==='x'?'CONCEPT':'INTERACTIVE');
  sec.innerHTML='<div class="s-meta"><span class="s-kind">'+kind+' <span id="stStat" data-k="'+esc(k)+'"></span></span><span class="chips">'+losChip(s)+'</span></div>'+(s.h?'<h2>'+s.h+'</h2>':'');
  paintStat($('#stStat',sec),k,isPractice(s));
  var cs=s.case&&t.cases&&t.cases[s.case];
  if(cs){var cx=el('details','case-x');if(window.innerWidth>=760)cx.open=true;cx.innerHTML='<summary><span class="case-t">Case</span>'+esc(cs.h)+'</summary><div class="case-b">'+cs.body+'</div>';sec.appendChild(cx)}
  var body=el('div','sb');sec.appendChild(body);
  try{(R[s.t]||R.x)(body,s,k)}catch(err){body.innerHTML='<p>Something went wrong rendering this slide.</p>';console.error(err)}
  if(LAND&&s.t==='x')landLayout(body);
  if(LAND&&LM==='split'&&s.t==='x')d.classList.add('splitv');
  if(exq){exLabels(body);try{new MutationObserver(function(){exLabels(body)}).observe(body,{childList:true,subtree:true})}catch(e){}}
  if(CONFQ[s.t]&&isPractice(s)){placeConf(body,s,k);try{new MutationObserver(function(){placeConf(body,s,k)}).observe(body,{childList:true})}catch(e){}}   // "Try again" redraws the question: the row comes back
  if(ST.can('notes')&&s.note)sec.appendChild(LAND?el('details','call key nt','<summary class="ct">'+ICON.key+'Instructor note</summary>'+s.note):el('div','call key','<div class="ct">'+ICON.key+'Instructor note</div>'+s.note));
  if(!isPractice(s)){var rb=el('div','rd-bar');rb.id='rdBar';sec.appendChild(rb)}
  ST.inBank=inB||(!!rvb&&isPractice(s));   // the question bank (its part of a topic, or a question inside a set / review) — the translate help has a separate permission there
  if(ST.deckSlide)ST.deckSlide(sec,body,t,s,idx);
  if(si<0&&idx===nL-1&&t.nB)sec.appendChild(bankCard(t));
  d.appendChild(sec);
  var nav=el('div','dk-nav');
  var pv=el('button','btn',ICON.prev+'<span>Previous</span>');pv.disabled=idx===0&&!prevTopic(t);
  pv.onclick=function(){go(-1)};
  var nx=el('button','btn pri','<span>'+(si>=0?(si+1<rv0.a.length?'Next':'Finish'):inB&&idx===n-1?'Back to the questions':idx===nL-1?(nextTopic(t)?'Next topic':'Finish'):'Next')+'</span>'+ICON.next);
  if(si>=0)pv.disabled=si===0;
  nx.onclick=function(){go(1)};
  var mid=el('button','mid','<span>'+(si>=0?'Question '+(si+1)+' / '+rv0.a.length:inB?'Bank '+(idx-nL+1)+' / '+(n-nL):(idx+1)+' / '+nL)+'</span>'+ICON.list);mid.type='button';mid.title=si>=0?'Every question in this set (G)':'Go to a slide (G, or type its number and Enter)';mid.setAttribute('aria-label',si>=0?'Every question in this set':'Go to a slide');mid.onclick=function(){if(si>=0)setGrid(revGet()||rv0,si);else toc(t)};
  nav.appendChild(pv);nav.appendChild(mid);nav.appendChild(nx);
  d.appendChild(nav);app.appendChild(d);
  if(ST.deckDone)try{ST.deckDone(d,t,s,idx)}catch(e){console.error(e)}   // ui.js: the slide's tool row
  window.scrollTo(0,0);
  if(LAND){fitLand();setTimeout(fitLand,120);setTimeout(fitLand,600);$$('img',sec).forEach(function(im){if(!im.complete)im.addEventListener('load',fitLand)})}
  startDwell(t,s,k);if(isPractice(s))startQTimer(t,k);
}
/* "How sure are you?" above the answer — optional; saved with the next answer, then cleared */
var CONFQ={mcq:1,multi:1,num:1,sort:1,dd:1,order:1},CONF=[['s','Sure'],['u','Not sure'],['g','Guessing']];
function confRow(k){var r=el('div','conf');r.setAttribute('data-k',k);
  r.innerHTML='<span class="cf-l">How sure are you?</span><span class="seg sm" role="group" aria-label="How sure are you?">'+CONF.map(function(c){return '<button type="button" data-v="'+c[0]+'" aria-pressed="false">'+c[1]+'</button>'}).join('')+'</span><small>optional · pick before you answer</small>';
  $$('button',r).forEach(function(b){b.onclick=function(){CF[k]=CF[k]===b.dataset.v?'':b.dataset.v;paintConf(k)}});return r}
function placeConf(body,s,k){if($('.conf',body))return;var a=s.t==='mcq'?$('.opts',body):$('.qa',body);if(a&&a.parentNode)a.parentNode.insertBefore(confRow(k),a);paintConf(k)}
function paintConf(k,saved){$$('.conf').forEach(function(r){if(r.getAttribute('data-k')!==k)return;
  $$('button',r).forEach(function(x){var on=x.dataset.v===(CF[k]||'');x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false')});
  if(saved!=null)$('small',r).textContent=saved?'saved with your answer: '+CONF.filter(function(c){return c[0]===saved})[0][1]:'optional · pick before you answer'})}
/* the line under a concept slide: countdown until it counts as read, and a "Mark as read" button */
function paintRead(k,left){var b=document.getElementById('rdBar');if(!b)return;
  if(isRead(k)){b.innerHTML='<span class="chip t">✓ Read</span><button class="btn sm ghost" type="button" id="rdUn">Mark as unread</button>';
    $('#rdUn',b).onclick=function(){P.un[k]=Date.now();delete P.r[k];delete P.mk[k];save();paintStat(document.getElementById('stStat'),k,false);
      if(cur.t&&slideKey(cur.t,cur.i)===k)startDwell(cur.t,cur.t.slides[cur.i],k);else paintRead(k,readSec())};return}
  b.innerHTML='<span class="note">'+(left>0?'Counts as read after <b>'+mmss(left)+'</b> on this slide':'Stay on the slide to count it as read')+'</span>'+
    (ST.can('markRead')?'<button class="btn sm ghost" type="button">Mark as read</button>':'');
  var m=b.querySelector('button');if(m)m.onclick=function(){var n=Date.now();P.r[k]=n;P.mk[k]=n;save();paintStat(document.getElementById('stStat'),k,false);paintRead(k,0)}}
function paintStat(c,k,prac){if(!c)return;var r=prac?qRes(k):null;
  if(prac){c.className=r===1?'chip t':(r===0?'chip r':'');c.textContent=r===1?'✓ correct':(r===0?'↻ try again':'')}
  else{var rd=isRead(k);c.className=rd?'chip t':'';c.textContent=rd?'✓ read':''}}
/* time on a practice question: counted only while it is on screen; one try = from the last answer (or first view) to this answer */
var QS={},qt=null;
function startQTimer(t,k){clearInterval(qt);qt=setInterval(function(){if(document.visibilityState==='hidden')return;
  if(!cur.t||cur.t!==t||slideKey(t,cur.i)!==k||!/^#\/t\//.test(location.hash)){clearInterval(qt);qt=null;return}QS[k]=(QS[k]||0)+1},1000)}
/* the time an exam would allow: 100 MCQs in 180 minutes = 108 s each; longer formats get more */
function budget(s){if(s.time)return s.time;var f=s.f||[1];
  return s.t==='mcq'?108:s.t==='multi'?150:s.t==='num'?Math.max(108,90*f.length):s.t==='dd'?Math.max(60,40*(s.f||[]).length):s.t==='sort'?Math.max(90,25*(s.i||[]).length):s.t==='order'?Math.max(60,20*(s.i||[]).length):108}
ST.qBudget=budget;
function mmss2(sec){sec=Math.round(sec);return Math.floor(sec/60)+':'+('0'+sec%60).slice(-2)}
var dw=null;
function stopDwell(){if(dw){clearInterval(dw);dw=null}}
function startDwell(t,s,k){stopDwell();if(isPractice(s))return;var sec=0,need=readSec();paintRead(k,need);if(isRead(k)&&!isMarked(k))return;   // a slide read with the button keeps timing quietly: the full time turns it into a timed read
  dw=setInterval(function(){if(document.visibilityState==='hidden')return;     // only time spent looking at this slide counts
    if(!cur.t||cur.t!==t||slideKey(t,cur.i)!==k||!/^#\/t\//.test(location.hash)){stopDwell();return}
    if(++sec>=need){P.r[k]=Date.now();save();stopDwell();paintStat(document.getElementById('stStat'),k,false)}
    paintRead(k,need-sec)},1000)}
function nextTopic(t){var a=ST.topics.filter(function(x){return !x.soon}),i=a.indexOf(t);return a[i+1]||null}
function prevTopic(t){var a=ST.topics.filter(function(x){return !x.soon}),i=a.indexOf(t);return a[i-1]||null}
function setIdx(){var v=revGet();return v&&v.l==='c'&&cur.t?{v:v,j:v.a.indexOf(cur.t.id+'/'+(cur.i+1))}:{j:-1}}
function go(dir){
  var t=cur.t;if(!t)return;
  if(cur.parts&&cur.parts.length>1){var pi=(cur.part||0)+dir;if(pi>=0&&pi<cur.parts.length){cur.show(pi);return}}
  if(dir<0&&$('.deck.land')&&landMode()==='split')WANT_LAST=true;
  var n=t.slides.length,nL=t.nL||n,S=setIdx();
  var i=cur.i+dir;if(cur.i<nL&&i>=nL)i=n;   // the lesson ends at nL: Next goes on to the next topic, the bank is opened from its card
  if(S.j>=0){var j=S.j+dir;if(j>=S.v.a.length)setEnd(S.v);else if(j>=0)setGo(j);return}
  if(i>=n&&cur.i>=nL){location.hash='#/bank/'+t.id;return}
  if(i>=n){var nt=nextTopic(t);location.hash=nt?'#/t/'+nt.id+'/1':'#/';return}
  if(i<0){var pt=prevTopic(t);if(pt)location.hash='#/t/'+pt.id+'/'+(pt.nL||pt.slides.length);return}
  location.hash='#/t/'+t.id+'/'+(i+1);
}
function kindOf(s){return isPractice(s)?'p':(s.t==='x'?'c':'i')}
var KIND={c:'Concept',i:'Interactive',p:'Practice'},TOCF='a';
function toc(t){
  var wrap=el('div'),st=topicStat(t),n=t.slides.length,cnt={c:0,i:0,p:0};t.slides.forEach(function(s){cnt[kindOf(s)]++});
  var nL=t.nL||n,go2=el('form','toc-go');go2.innerHTML='<label>Go to slide <input class="inp" type="number" min="1" max="'+n+'" inputmode="numeric" value="'+(cur.t===t?cur.i+1:1)+'"></label><span class="note">of '+nL+(n>nL?' · then '+(n-nL)+' in the question bank':'')+'</span><button class="btn sm pri" type="submit">Go</button>'+
    (cnt.p?'<button class="btn sm" type="button" data-first="p">First practice</button>':'')+(cnt.i?'<button class="btn sm ghost" type="button" data-first="i">First interactive</button>':'');
  go2.onsubmit=function(e){e.preventDefault();var v=parseInt($('input',go2).value,10);if(v>=1&&v<=n){closeModal();location.hash='#/t/'+t.id+'/'+v}};
  ST.h.$$('[data-first]',go2).forEach(function(b){b.onclick=function(){for(var i=0;i<n;i++)if(kindOf(t.slides[i])===b.dataset.first){closeModal();location.hash='#/t/'+t.id+'/'+(i+1);return}}});
  wrap.appendChild(go2);
  var flt=el('div','seg toc-f');flt.innerHTML=[['a','All '+n],['c','Concepts '+cnt.c],['i','Interactive '+cnt.i],['p','Practice '+cnt.p]].filter(function(x){return x[0]==='a'||cnt[x[0]]}).map(function(x){return '<button type="button" data-f="'+x[0]+'"'+(TOCF===x[0]?' class="on"':'')+'>'+x[1]+'</button>'}).join('');
  wrap.appendChild(flt);
  var head=el('div','toc-h','<span>Read <b>'+st.rd+'/'+st.cn+'</b> · Correct <b>'+st.ok+'/'+st.pr+'</b> · Mastery <b>'+st.score+'%</b>'+(st.done?' · marked studied':'')+'</span>');
  var mb=el('button','btn sm','Progress options');mb.onclick=function(){topicMenu(t)};head.appendChild(mb);wrap.appendChild(head);
  var box=el('div','toc');
  t.slides.forEach(function(s,i){if(i===nL&&n>nL)box.appendChild(el('div','toc-bk','Question bank · '+(n-nL)+' questions'));
    var k=slideKey(t,i),kd=kindOf(s),a=el('a',(cur.t===t&&i===cur.i?'cur ':'')+'k-'+kd),pr=kd==='p',r=pr?qRes(k):null,ok=pr?r===1:isRead(k);a.href='#/t/'+t.id+'/'+(i+1);a.dataset.k=kd;
    a.innerHTML='<span class="i">'+(i<nL?i+1:'B'+(i-nL+1))+'</span><span class="tt">'+(s.h||'Slide '+(i+1))+'<small><b class="kd">'+KIND[kd]+'</b>'+(losOf(s).length?' · LOS '+losOf(s).join(', '):'')+'</small></span>'+(ok?'<span class="ok">✓</span>':(r===0?'<span class="ok" style="color:var(--red)">↻</span>':''));
    a.onclick=closeModal;box.appendChild(a)});
  function filt(){ST.h.$$('a',box).forEach(function(a){a.hidden=TOCF!=='a'&&a.dataset.k!==TOCF});ST.h.$$('button',flt).forEach(function(b){b.classList.toggle('on',b.dataset.f===TOCF)})}
  ST.h.$$('button',flt).forEach(function(b){b.onclick=function(){TOCF=b.dataset.f;filt()}});filt();
  wrap.appendChild(box);modal(t.n,wrap);
  var c=$('a.cur',box);if(c&&c.scrollIntoView)setTimeout(function(){c.scrollIntoView({block:'center'})},30);
}
function howProgress(){
  var box=el('div');
  box.innerHTML='<p>The circle on the home page measures <b>mastery</b>, not clicks:</p><ul>'+
   '<li>A concept or interactive slide counts as <b>read</b> after it has been on screen for '+readTxt()+'. Moving on sooner does not count it'+(ST.can('markRead')?', unless you press <b>Mark as read</b>':'')+'. A read slide has <b>Mark as unread</b> if you want to go over it again.</li>'+
   '<li>A practice slide counts only when your <b>latest answer is correct</b>. Get it wrong later and it stops counting until you get it right again.</li>'+
   '<li>Topic mastery = 30% reading + 70% practice. A topic is <b>mastered</b> at 80% or more correct with every slide read.</li>'+
   '<li>If you studied a topic elsewhere, open its <b>⋯</b> menu and mark it as <b>studied</b>. You can remove the mark or <b>reset</b> the topic at any time.</li>'+
   '<li><b>Exam readiness</b> is stricter: it counts every practice question in the section, lowers guesses and answers due for review, and checks your pace. See <b>Readiness &amp; mistakes</b>.</li></ul>'+
   '<p>'+(ST.sync&&ST.sync.enabled()?'Sign in with your <b>student code</b> (person icon at the top) to keep the same progress on every device.':'Progress is saved on this device.')+'</p>';
  modal('How progress works',box);
}
var KEYN='',KEYT=null;
function hint(txt){var h=document.getElementById('kHint');if(!h){h=el('div','k-hint');h.id='kHint';document.body.appendChild(h)}h.textContent=txt;h.hidden=!txt}
function toggleFS(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen()}catch(e){}}

/* =========================================================
   SLIDE RENDERERS
   ========================================================= */
var R={};
ST.R=R;ST.route=function(){route()};
/* concept slide */
/* Quick checks: a concept slide may carry cy:[[question,[options],answer,explanation,slideNo],…] — the topic's "Check yourself" set.
   Settings → Your screen → Quick checks: "at the end of the topic" (default) shows the set on that slide with "Review slide N" links;
   "below each slide" shows each check under the slide that teaches it instead (st-ui-qc). The data never moves, so nothing in progress changes. */
function qcMode(){try{return localStorage.getItem('st-ui-qc')==='below'?'below':'end'}catch(e){return 'end'}}
function qcBelow(t,i){var out=[];if(!t)return out;t.slides.forEach(function(x){(x.cy||[]).forEach(function(q){if(q[4]===i+1)out.push(q)})});return out}
function topicOf(k){var id=String(k||'').replace(/^print#/,'').split('#')[0];return (cur.t&&cur.t.id===id)?cur.t:(ST.byId&&ST.byId[id])||cur.t}
ST.qcMode=qcMode;
R.x=function(b,s,k){var t=topicOf(k),i=t?t.slides.indexOf(s):-1,h=s.body||'';
  if(s.cy){h+=qcMode()==='end'?ST.qcSet(t?t.id:'',s.cy):'<p class="note qc-note">Your quick checks are shown below each slide. You can move them here from Settings → Your screen → Quick checks.</p>'}
  else if(qcMode()==='below'&&i>=0){qcBelow(t,i).forEach(function(q){h+=ST.qc(q[0],q[1],q[2],q[3])})}
  b.innerHTML=h;if(b.querySelector('.gl-ar'))ST.glFill(b)};

/* multiple choice (single answer) */
R.mcq=function(b,s,k){
  var q=el('div','q');q.innerHTML='<div class="stem">'+s.q+'</div>';
  var opts=el('div','opts'),done=false;
  s.o.forEach(function(o,i){var btn=el('button','opt','<span class="k">'+'ABCDEFG'[i]+'</span><span><span>'+o+'</span></span>');
    btn.onclick=function(){if(done)return;done=true;btn.classList.add('pk');var ok=i===s.a;ST.mark(k,ok,'o:'+i);
      $$('.opt',opts).forEach(function(x,j){x.disabled=true;if(j===s.a)x.classList.add('ok');else if(j===i)x.classList.add('bad');
        if(s.w&&s.w[j]){var w=el('span','why',s.w[j]);x.lastChild.appendChild(w)}});
      var fb=el('div','fb '+(ok?'ok':'bad'),'<b class="v">'+(ok?'Correct.':'Not quite — the answer is '+'ABCDEFG'[s.a]+'.')+'</b>'+(s.e||''));q.appendChild(fb);
      var r=el('div','qa');var t=el('button','btn sm','Try again');t.onclick=function(){b.innerHTML='';R.mcq(b,s,k)};r.appendChild(t);q.appendChild(r)};
    opts.appendChild(btn)});
  q.appendChild(opts);b.appendChild(q);
};

/* multiple select */
R.multi=function(b,s,k){
  var q=el('div','q');q.innerHTML='<div class="stem">'+s.q+'</div>';var opts=el('div','opts'),sel={};
  s.o.forEach(function(o,i){var btn=el('button','opt','<span class="k">'+'ABCDEFGH'[i]+'</span><span><span>'+o+'</span></span>');
    btn.onclick=function(){if(btn.disabled)return;sel[i]=!sel[i];btn.classList.toggle('sel',!!sel[i])};opts.appendChild(btn)});
  q.appendChild(opts);
  var r=el('div','qa');var c=el('button','btn pri','Check');
  c.onclick=function(){var ok=true;$$('.opt',opts).forEach(function(x,j){x.disabled=true;var isA=s.a.indexOf(j)>=0;
      if(isA)x.classList.add('ok');else if(sel[j])x.classList.add('bad');if((!!sel[j])!==isA)ok=false;
      if(s.w&&s.w[j])x.lastChild.appendChild(el('span','why',s.w[j]))});
    ST.mark(k,ok,'o:'+Object.keys(sel).filter(function(j){return sel[j]}).join(','));c.remove();q.appendChild(el('div','fb '+(ok?'ok':'bad'),'<b class="v">'+(ok?'Correct — all of them.':'Not quite. Correct choices: '+s.a.map(function(i){return 'ABCDEFGH'[i]}).join(', ')+'.')+'</b>'+(s.e||'')));
    var t=el('button','btn sm','Try again');t.onclick=function(){b.innerHTML='';R.multi(b,s,k)};r.appendChild(t)};
  r.appendChild(c);q.appendChild(r);b.appendChild(q);
};

/* numeric entry — one or more fields */
R.num=function(b,s,k){
  var q=el('div','q');q.innerHTML='<div class="stem">'+s.q+'</div>';
  var f=s.f||[{l:'Answer',a:s.a,tol:s.tol,m:s.m}],ins=[];
  var g=el('div','ctl');
  f.forEach(function(x){var lab=el('label','',x.l);var i=el('input','inp');i.inputMode='decimal';i.autocomplete='off';i.setAttribute('aria-label',x.l);lab.appendChild(i);g.appendChild(lab);ins.push(i)});
  q.appendChild(g);
  var r=el('div','qa');var c=el('button','btn pri','Check');
  function sgm(v){return (v<0?'(':'')+ST.money(Math.abs(v))+(v<0?')':'')}
  c.onclick=function(){var ok=true,hits=[];f.forEach(function(x,j){var v=num(ins[j].value),tol=x.tol!=null?x.tol:0.5,good=!isNaN(v)&&Math.abs(v-x.a)<=tol;
      ins[j].classList.remove('ok','bad');ins[j].classList.add(good?'ok':'bad');if(!good){ok=false;
        (x.m||[]).forEach(function(mm){if(!isNaN(v)&&Math.abs(v-mm[0])<=Math.max(tol,0.5))hits.push('<li><b>'+(f.length>1?esc(x.l)+': ':'')+'you entered '+sgm(v)+'</b> — '+mm[1]+'</li>')})}});
    ST.mark(k,ok,'v:'+ins.map(function(i){return i.value.trim()}).join('|'));$$('.fb,.whyl,.traps',q).forEach(function(o){o.remove()});
    q.appendChild(el('div','fb '+(ok?'ok':'bad'),'<b class="v">'+(ok?'Correct.':'Not yet. ')+'</b>'+(ok?'':'<span>Answer'+(f.length>1?'s':'')+': '+f.map(function(x){return (f.length>1?x.l+' = ':'')+sgm(x.a)}).join(' · ')+'</span>')+(hits.length?'<ul class="hits">'+hits.join('')+'</ul>':'')+(s.e?'<div style="margin-top:6px">'+s.e+'</div>':'')));
    var all=[];f.forEach(function(x){(x.m||[]).forEach(function(mm){all.push('<li><b>'+sgm(mm[0])+'</b>'+(f.length>1?' <span class="note">('+esc(x.l)+')</span>':'')+' — '+mm[1]+'</li>')})});
    if(all.length)q.appendChild(el('div','traps','<div class="ct">Why the tempting wrong answers are wrong</div><ul>'+all.join('')+'</ul>'))};
  ins.forEach(function(i){i.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();c.click()}})});
  r.appendChild(c);q.appendChild(r);b.appendChild(q);
};

/* sort / classify — tap an item, then tap a bucket (works on phones) */
R.sort=function(b,s,k){
  if(s.intro)b.appendChild(el('div','',s.intro));
  var q=el('div','q');if(s.q)q.appendChild(el('div','stem',s.q));
  var pool=el('div','pool'),picked=null,place={};
  var items=s.i.map(function(it,ix){return {it:it,ix:ix}});
  if(s.shuffle!==false)items.sort(function(a,c){return ((a.ix*7919)%13)-((c.ix*7919)%13)});
  var bmap={};var bks=el('div','bks');
  s.b.forEach(function(bk){var d=el('div','bk','<h4><span>'+bk.l+'</span><span class="cnt muted"></span></h4>');var inn=el('div','in');d.appendChild(inn);bmap[bk.id]=inn;
    d.onclick=function(e){if(e.target.closest('.it')&&e.target.closest('.bk')===d&&!picked)return;if(!picked)return;inn.appendChild(picked);place[picked.dataset.ix]=bk.id;picked.classList.remove('pick');picked=null;$$('.bk',bks).forEach(function(x){x.classList.remove('hot')})};
    bks.appendChild(d)});
  items.forEach(function(o){var c=el('button','it',o.it.x);c.dataset.ix=o.ix;
    c.onclick=function(e){e.stopPropagation();if(c.classList.contains('ok')||c.classList.contains('bad')){return}
      if(picked===c){c.classList.remove('pick');picked=null;$$('.bk',bks).forEach(function(x){x.classList.remove('hot')});return}
      if(picked)picked.classList.remove('pick');picked=c;c.classList.add('pick');$$('.bk',bks).forEach(function(x){x.classList.add('hot')})};
    pool.appendChild(c)});
  pool.onclick=function(e){if(picked&&e.target===pool){pool.appendChild(picked);delete place[picked.dataset.ix];picked.classList.remove('pick');picked=null;$$('.bk',bks).forEach(function(x){x.classList.remove('hot')})}};
  q.appendChild(el('div','note','Tap an item, then tap the box it belongs in. Tap the empty area of the list to send an item back.'));
  q.appendChild(pool);q.appendChild(bks);
  var r=el('div','qa');var c=el('button','btn pri','Check');
  c.onclick=function(){var ok=true,wl=el('div','whyl');
    s.i.forEach(function(it,ix){var chip=$('.it[data-ix="'+ix+'"]',q),good=place[ix]===it.b;if(!good)ok=false;chip.classList.remove('pick');chip.classList.add(good?'ok':'bad');
      var bl=s.b.filter(function(x){return x.id===it.b})[0],pb=s.b.filter(function(x){return x.id===place[ix]})[0];
      wl.appendChild(el('div','wr '+(good?'ok':'bad'),'<span class="mk">'+(good?'✓':'✗')+'</span><div><b>'+it.x+'</b> → '+(bl?bl.l:'')+(good?'':' <span class="note">(you chose: '+(pb?pb.l:'nothing')+')</span>')+(it.w?'<div class="rs">'+it.w+'</div>':'')+'</div>'))});
    ST.mark(k,ok,'s:'+s.i.map(function(it,ix){return place[ix]===it.b?'':ix+'>'+(place[ix]||'')}).filter(String).join(','));c.remove();
    q.appendChild(el('div','fb '+(ok?'ok':'bad'),'<b class="v">'+(ok?'All correct.':'Some items are in the wrong box (marked in red).')+'</b>'+(s.e||'')));
    if(wl.children.length)q.appendChild(wl);
    var t=el('button','btn sm','Try again');t.onclick=function(){b.innerHTML='';R.sort(b,s,k)};r.appendChild(t)};
  r.appendChild(c);q.appendChild(r);b.appendChild(q);
};

/* fill in the blanks with drop-downs: s.s = 'text {0} text {1}', s.f=[{o:[...],a:i}] */
R.dd=function(b,s,k){
  var q=el('div','q');if(s.q)q.appendChild(el('div','stem',s.q));
  var sels=[];var html=s.s.replace(/\{(\d+)\}/g,function(m,i){return '<select class="sel-in" data-i="'+i+'"><option value="">— select —</option>'+s.f[+i].o.map(function(o,j){return '<option value="'+j+'">'+esc(o)+'</option>'}).join('')+'</select>'});
  var p=el('div','stem',html);q.appendChild(p);sels=$$('select',p);
  var r=el('div','qa');var c=el('button','btn pri','Check');
  c.onclick=function(){var ok=true;sels.forEach(function(se){var f=s.f[+se.dataset.i],good=se.value!==''&&+se.value===f.a;se.classList.remove('ok','bad');se.classList.add(good?'ok':'bad');if(!good)ok=false});
    ST.mark(k,ok,'d:'+sels.map(function(se){return se.value}).join(','));$$('.fb,.ddw',q).forEach(function(o){o.remove()});
    q.appendChild(el('div','fb '+(ok?'ok':'bad'),'<b class="v">'+(ok?'Correct.':'Not yet — fix the boxes marked in red, or read why below.')+'</b>'+(s.e||'')));
    if(s.f.some(function(f){return f.w})){var dw=el('ol','ddw');sels.forEach(function(se){var f=s.f[+se.dataset.i],ch=se.value===''?-1:+se.value;
      dw.appendChild(el('li','','<ul>'+f.o.map(function(o,j){return '<li class="'+(j===f.a?'ok':(j===ch?'bad':''))+'"><b>'+esc(o)+'</b>'+(j===f.a?' ✓':(j===ch?' ✗':''))+(f.w&&f.w[j]?' — '+f.w[j]:'')+'</li>'}).join('')+'</ul>'))});q.appendChild(dw)}};
  r.appendChild(c);q.appendChild(r);b.appendChild(q);
};

/* put steps in order: tap in sequence */
R.order=function(b,s,k){
  var q=el('div','q');if(s.q)q.appendChild(el('div','stem',s.q));
  var n=s.i.length,seq=[],shuf=s.i.map(function(x,i){return i}).sort(function(a,c){return ((a*31+7)%n)-((c*31+7)%n)});
  if(shuf.every(function(v,i){return v===i}))shuf.reverse();
  var box=el('div','ord'),btns=[];
  shuf.forEach(function(ix){var it=el('button','it','<span class="k">·</span><span>'+s.i[ix]+'</span>');it.onclick=function(){if(it.classList.contains('ok')||it.classList.contains('bad'))return;
      var p=seq.indexOf(ix);if(p>=0){seq.splice(p,1)}else seq.push(ix);paint()};btns.push({ix:ix,b:it});box.appendChild(it)});
  function paint(){btns.forEach(function(o){var p=seq.indexOf(o.ix);o.b.firstChild.textContent=p>=0?(p+1):'·';o.b.classList.toggle('pick',p>=0)})}
  q.appendChild(el('div','note','Tap the items in the correct order (1, 2, 3 …). Tap again to undo.'));q.appendChild(box);
  var r=el('div','qa');var c=el('button','btn pri','Check');
  c.onclick=function(){if(seq.length<n){c.textContent='Number all '+n+' items first';return}var ok=seq.every(function(v,i){return v===i});
    btns.forEach(function(o){o.b.classList.remove('pick');o.b.classList.add(seq.indexOf(o.ix)===o.ix?'ok':'bad')});ST.mark(k,ok,'q:'+seq.join(','));c.remove();
    q.appendChild(el('div','fb '+(ok?'ok':'bad'),'<b class="v">'+(ok?'Correct order.':'Not quite. Correct order:')+'</b>'+(ok?'':'<ol>'+s.i.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ol>')+(s.e||'')));
    var t=el('button','btn sm','Try again');t.onclick=function(){b.innerHTML='';R.order(b,s,k)};r.appendChild(t)};
  r.appendChild(c);q.appendChild(r);b.appendChild(q);
};

/* decision tree: s.n = {start:{q,o:[[label,next]]}, id:{r:'result html'}} */
R.tree=function(b,s){
  if(s.intro)b.appendChild(el('div','',s.intro));
  var w=el('div','tree'),trail=el('div','trail');w.appendChild(trail);var host=el('div');w.appendChild(host);var path=[];
  function show(id){var nd=s.n[id];host.innerHTML='';trail.innerHTML=path.map(function(p){return '<span class="chip">'+p+'</span>'}).join(' ');
    if(nd.r){host.appendChild(el('div','res',nd.r));var a=el('button','btn sm','Start again');a.style.marginTop='10px';a.onclick=function(){path=[];show('start')};host.appendChild(a);return}
    var d=el('div','node','<div class="qq">'+nd.q+'</div>');var r=el('div','row');
    nd.o.forEach(function(o){var bt=el('button','btn',o[0]);bt.onclick=function(){path.push(o[0]);show(o[1])};r.appendChild(bt)});d.appendChild(r);host.appendChild(d)}
  show('start');b.appendChild(w);
};

/* custom interactive lab */
R.lab=function(b,s,k){if(s.body)b.appendChild(el('div','',s.body));var h=el('div','lab');b.appendChild(h);s.run(h,{k:k,mark:function(ok){ST.mark(k,ok)}})};

/* =========================================================
   FINANCIAL STATEMENT PANELS (shared by tracer & fs slides)
   ========================================================= */
var FS_NAMES={is:['Income statement','for the month'],sce:['Statement of changes in equity','for the month'],bs:['Balance sheet','end of the month'],cf:['Statement of cash flows','indirect method']};
function panels(R1,R0,opt){
  opt=opt||{};var wrap=el('div'),show=opt.show||['is','sce','bs','cf'];
  var tabs=el('div','fs-tabs'),grid=el('div','fs tabbed'),pn={};
  show.forEach(function(st,i){
    var tb=el('button',i===0?'on':'',FS_NAMES[st][0].replace('Statement of ','').replace('changes in equity','Equity').replace('cash flows','Cash flows'));tb.dataset.st=st;
    tb.onclick=function(){activate(st)};tabs.appendChild(tb);
    var p=el('div','fsp'+(i===0?' on':''));p.dataset.st=st;
    var tbl='<h4><span>'+FS_NAMES[st][0]+'</span><small>'+FS_NAMES[st][1]+'</small></h4><table>';
    R1[st].forEach(function(r){var d=R0&&r.v!=null&&R0.val[r.k]!==undefined?r.v-R0.val[r.k]:(R0&&r.v!=null&&R0.val[r.k]===undefined?r.v:0);
      var ch=R0&&r.v!=null&&Math.abs(d)>0.005;
      tbl+='<tr class="'+r.cls+(ch?' chg':'')+'" data-k="'+esc(r.k)+'"><td>'+esc(r.n)+'</td><td class="v">'+(r.v==null?'':ST.fmt(r.v))+'</td>'+(R0?'<td class="d '+(ch?(d>0?'up':'dn'):'')+'">'+(ch?ST.fmtS(d):'')+'</td>':'')+'</tr>'});
    tbl+='</table>';p.innerHTML=tbl;pn[st]=p;grid.appendChild(p)});
  function activate(st){$$('button',tabs).forEach(function(x){x.classList.toggle('on',x.dataset.st===st);x.classList.remove('ping')});$$('.fsp',grid).forEach(function(x){x.classList.toggle('on',x.dataset.st===st)})}
  wrap.appendChild(tabs);wrap.appendChild(grid);
  wrap.activate=activate;
  wrap.flash=function(st,keys){$$('tr.flash',grid).forEach(function(x){x.classList.remove('flash')});if(!st)return;activate(st);
    (keys||[]).forEach(function(kk){var tr=$('tr[data-k="'+(window.CSS&&CSS.escape?CSS.escape(kk):kk)+'"]',pn[st]);if(tr)tr.classList.add('flash')})};
  return wrap;
}
ST.panels=panels;
function eqBox(R1,R0){
  var f=function(v,old){return '<b class="num">'+ST.money(v)+'</b>'+(R0&&Math.abs(v-old)>0.005?' <small class="num">('+ST.fmtS(v-old)+')</small>':'')};
  var ok=Math.abs(R1.ta-R1.tl-R1.teq)<0.01;
  return el('div','eq','<span class="box"><small>Assets</small>'+f(R1.ta,R0&&R0.ta)+'</span><span>=</span><span class="box"><small>Liabilities</small>'+f(R1.tl,R0&&R0.tl)+'</span><span>+</span><span class="box"><small>Equity</small>'+f(R1.teq,R0&&R0.teq)+'</span><span class="'+(ok?'ok':'no')+'">'+(ok?'✓ balanced':'✗')+'</span>');
}
ST.eqBox=eqBox;

/* fs slide: show statements after a list of transactions */
R.fs=function(b,s){
  if(s.body)b.appendChild(el('div','',s.body));
  var m=ST.L.model(s.acc,s.open),txs=(s.txs||[]).map(function(x){return ST.L.makeTx(x[0],x[1])});
  var R1=ST.L.build(m,txs),R0=s.delta?ST.L.build(m,[]):null;
  b.appendChild(eqBox(R1,R0));b.appendChild(panels(R1,R0,{show:s.show}));
  if(s.after)b.appendChild(el('div','',s.after));
};

/* =========================================================
   FOLLOW-THE-NUMBER TRACER
   ========================================================= */
var DIRS=[['up','▲','increase'],['zero','–','no effect'],['dn','▼','decrease']];
var PRED=[['ta','Total assets'],['tl','Total liabilities'],['teq','Total equity'],['ni','Net income'],['cfo','Cash from operating activities'],['cfi','Cash from investing activities'],['cff','Cash from financing activities']];
function sgn(v){return Math.abs(v)<0.005?'zero':(v>0?'up':'dn')}
R.trace=function(b,s,k){
  if(s.intro)b.appendChild(el('div','',s.intro));
  var m=ST.L.model(),list=s.tx||Object.keys(ST.L.TX),ledger=s.mode==='ledger',posted=[],sel=list[0],params={};
  var root=el('div','tr');b.appendChild(root);
  function draw(){
    root.innerHTML='';
    var tx=ST.L.TX[sel];
    /* picker */
    var pk=el('div','tr-pick');pk.appendChild(el('div','note','1 · Choose a transaction'));
    var se=el('select','sel-in tx-sel');se.setAttribute('aria-label','Transaction');
    var GR=[['Financing the business',['issue','borrow','repay','divPay','divDecl']],['Investing',['buyEq','buyEqLoan','sellEq']],['Buying and selling goods',['buyInv','buyInvCash','saleCredit','saleCash','collect','payAP']],['Expenses and adjustments',['paySal','accrSal','prepay','useRent','dep','payInt']],['Customer advances',['advance','earnAdv']]];
    GR.forEach(function(g){var ids=g[1].filter(function(id){return list.indexOf(id)>=0});if(!ids.length)return;var og=document.createElement('optgroup');og.label=g[0];
      ids.forEach(function(id){var o=document.createElement('option');o.value=id;o.textContent=ST.L.TX[id].n;if(id===sel)o.selected=true;og.appendChild(o)});se.appendChild(og)});
    list.forEach(function(id){if(!GR.some(function(g){return g[1].indexOf(id)>=0})){var o=document.createElement('option');o.value=id;o.textContent=ST.L.TX[id].n;if(id===sel)o.selected=true;se.appendChild(o)}});
    se.onchange=function(){sel=se.value;params={};draw()};
    pk.appendChild(se);root.appendChild(pk);
    /* params */
    var frm=el('div','tx-form');tx.p.forEach(function(a){var lab=el('label','',a[1]);var i=el('input','inp');i.inputMode='decimal';i.value=ST.money(params[a[0]]!==undefined?params[a[0]]:a[2]);
      i.onchange=function(){var v=num(i.value);if(!isNaN(v)&&v>=0){params[a[0]]=v;draw()}else i.value=ST.money(params[a[0]]!==undefined?params[a[0]]:a[2])};lab.appendChild(i);frm.appendChild(lab)});
    frm.appendChild(el('div','note','2 · Change the numbers if you like (press Enter or click outside the box).'));root.appendChild(frm);
    var t=ST.L.makeTx(sel,params);
    var txsBefore=ledger?posted.slice():[],txsAfter=txsBefore.concat([t]);
    var R0=ST.L.build(m,txsBefore),R1=ST.L.build(m,txsAfter);
    var bad=ST.L.invalid(m,R1.bal);
    if(bad.length){root.appendChild(el('div','fb bad','<b class="v">That amount is not possible for '+esc(s.co||'the company')+' right now.</b>It would leave <b>'+bad.map(function(x){return ST.L.ACC[x].n}).join(', ')+'</b> with a negative balance. '+bad.map(function(x){return ST.L.ACC[x].n+' is currently '+ST.money(Math.abs(R0.bal[x]))}).join('; ')+'. Lower the amount.'));return}
    /* prediction */
    var reveal=!s.predict;
    var pw=el('div');root.appendChild(pw);
    var stage=el('div');root.appendChild(stage);
    if(s.predict){
      pw.appendChild(el('div','note','3 · Predict the effect before you look'));
      var pred=el('div','pred'),choice={};
      PRED.forEach(function(p){var r=el('div','pr','<div class="lab">'+p[1]+'</div>');var sg=el('div','seg');
        DIRS.forEach(function(d){var bt=el('button','',d[1]);bt.title=d[2];bt.setAttribute('aria-label',p[1]+': '+d[2]);bt.onclick=function(){choice[p[0]]=d[0];$$('button',sg).forEach(function(x){x.classList.remove('on')});bt.classList.add('on')};sg.appendChild(bt)});
        r.appendChild(sg);r.dataset.k=p[0];pred.appendChild(r)});
      pw.appendChild(pred);
      var ra=el('div','qa');var chk=el('button','btn pri','Check my prediction');var skip=el('button','btn ghost','Just show me');
      chk.onclick=function(){var miss=PRED.filter(function(p){return !choice[p[0]]});if(miss.length){chk.textContent='Choose all '+PRED.length+' rows first';return}
        var ok=true;PRED.forEach(function(p){var r=$('.pr[data-k="'+p[0]+'"]',pred),truth=sgn(R1[p[0]]-R0[p[0]]),good=choice[p[0]]===truth;if(!good)ok=false;
          r.classList.add(good?'ok':'bad');$$('button',r).forEach(function(x){x.disabled=true});
          var d=R1[p[0]]-R0[p[0]];r.appendChild(el('div','ans',(good?'✓ ':'✗ Actual: ')+(truth==='zero'?'no effect':(truth==='up'?'increase':'decrease')+' of '+ST.money(d))))});
        ST.mark(k,ok);ra.remove();pw.appendChild(el('div','fb '+(ok?'ok':'bad'),'<b class="v">'+(ok?'All seven correct.':'Check the rows in red.')+'</b>'+tx.why));showStage()};
      skip.onclick=function(){ra.remove();pw.appendChild(el('div','fb ok','<b class="v">Here is what happens.</b>'+tx.why));showStage()};
      ra.appendChild(chk);ra.appendChild(skip);pw.appendChild(ra);
    }else{pw.appendChild(el('div','fb ok',tx.why));showStage()}
    function showStage(){
      stage.innerHTML='';
      /* journal entry */
      var je='<div class="tw"><table class="t je"><tr><th>Journal entry</th><th class="n">Debit</th><th class="n">Credit</th></tr>';
      t.je.filter(function(l){return l[1]>0}).forEach(function(l){je+='<tr><td class="dr">'+ST.L.ACC[l[0]].n+'</td><td class="n">'+ST.money(l[1])+'</td><td></td></tr>'});
      t.je.filter(function(l){return l[1]<0}).forEach(function(l){je+='<tr><td class="cr">'+ST.L.ACC[l[0]].n+'</td><td></td><td class="n">'+ST.money(-l[1])+'</td></tr>'});
      stage.appendChild(el('div','',je+'</table></div>'));
      /* path */
      var steps=buildSteps(R0,R1,t);
      var path=el('div','path');steps.forEach(function(st,i){if(i)path.appendChild(el('span','ar','→'));path.appendChild(el('span','pc',st.chip))});
      stage.appendChild(el('div','note','4 · Follow the number through the four statements'));
      stage.appendChild(path);
      var txt=el('div','step-txt','Press <b>Next step</b> to follow the effect statement by statement.');stage.appendChild(txt);
      var ctl=el('div','row');var nb=el('button','btn pri','Next step');var ab=el('button','btn','Show all');ctl.appendChild(nb);ctl.appendChild(ab);
      if(ledger){var post=el('button','btn gold','Post to the books');post.onclick=function(){posted.push(t);params={};draw()};ctl.appendChild(post)}
      stage.appendChild(ctl);
      stage.appendChild(eqBox(R1,R0));
      var pnl=panels(R1,R0);stage.appendChild(pnl);
      var si=-1,chips=$$('.pc',path);
      function at(i){si=i;chips.forEach(function(c,j){c.classList.toggle('on',j===i);c.classList.toggle('done',j<i)});var st=steps[i];txt.innerHTML=st.txt;pnl.flash(st.st,st.keys);if(i>=steps.length-1){nb.disabled=true;nb.textContent='Done'}}
      nb.onclick=function(){if(si<steps.length-1)at(si+1)};
      ab.onclick=function(){chips.forEach(function(c){c.classList.add('done');c.classList.remove('on')});txt.innerHTML=steps.map(function(x){return '<div>• '+x.txt+'</div>'}).join('');pnl.flash(null);nb.disabled=true};
    }
    if(ledger){
      var lg=el('div','');lg.innerHTML='<div class="note">Posted to '+esc(s.co?s.co+'\'s':'the company\'s')+' books this month: '+(posted.length?'':'nothing yet — the statements start from the opening balances.')+'</div>';
      if(posted.length){var l=el('div','log');posted.forEach(function(p,i){l.appendChild(el('span','',(i+1)+'. '+esc(p.label)+' ('+ST.money(p.je.reduce(function(a,x){return a+(x[1]>0?x[1]:0)},0))+')'))});lg.appendChild(l)}
      var rs=el('button','btn sm ghost','Clear the books');rs.onclick=function(){posted=[];params={};draw()};if(posted.length)lg.appendChild(rs);
      root.insertBefore(lg,root.firstChild);
    }
  }
  draw();
};
function chg(R0,R1,st,skip){return R1[st].filter(function(r){return r.v!=null&&(skip||[]).indexOf(r.k)<0&&Math.abs(r.v-(R0.val[r.k]||0))>0.005}).map(function(r){return {k:r.k,n:r.n,d:r.v-(R0.val[r.k]||0),v:r.v}})}
function li(c){return c.map(function(x){return x.n.replace(/^Less: |^Add back: /,'')+' <b class="num">'+ST.fmtS(x.d)+'</b>'}).join(', ')}
function buildSteps(R0,R1,t){
  var S=[];
  var dr=t.je.filter(function(l){return l[1]>0}).map(function(l){return ST.L.ACC[l[0]].n}),cr=t.je.filter(function(l){return l[1]<0}).map(function(l){return ST.L.ACC[l[0]].n});
  S.push({chip:'Journal entry',st:null,keys:[],txt:'<b>The entry:</b> debit '+dr.join(' and ')+'; credit '+cr.join(' and ')+'. Debits always equal credits — that is why the balance sheet will still balance at the end.'});
  /* income statement */
  var is=chg(R0,R1,'is',['is:gp','is:oi','is:ibt','is:ni']),dNI=R1.ni-R0.ni;
  S.push({chip:'Income statement'+(Math.abs(dNI)>0.005?' · NI '+ST.fmtS(dNI):' · no effect'),st:'is',keys:is.map(function(x){return x.k}).concat(Math.abs(dNI)>0.005?['is:ni']:[]),
    txt:is.length?'<b>Income statement:</b> '+li(is)+' → <b>net income '+ST.fmtS(dNI)+'</b>.':'<b>Income statement:</b> nothing here — no revenue, expense, gain or loss. Net income does not change.'});
  /* equity */
  var dRE=R1.reE-R0.reE,dPI=(R1.val['sce:piE']||0)-(R0.val['sce:piE']||0),dDiv=(R1.val['sce:div']||0)-(R0.val['sce:div']||0),parts=[];
  if(Math.abs(dNI)>0.005)parts.push('net income '+ST.fmtS(dNI)+' flows into retained earnings');
  if(Math.abs(dDiv)>0.005)parts.push('dividends declared reduce retained earnings by '+ST.money(-dDiv));
  if(Math.abs(dPI)>0.005)parts.push('paid-in capital '+ST.fmtS(dPI));
  var sceK=chg(R0,R1,'sce').map(function(x){return x.k});
  S.push({chip:'Equity statement'+(Math.abs(dRE)>0.005?' · RE '+ST.fmtS(dRE):(Math.abs(dPI)>0.005?' · paid-in '+ST.fmtS(dPI):' · no effect')),st:'sce',keys:sceK,
    txt:parts.length?'<b>Statement of changes in equity:</b> '+parts.join('; ')+'. Total equity moves '+ST.fmtS(R1.teq-R0.teq)+'.':'<b>Statement of changes in equity:</b> no change — the owners\' claim is unaffected.'});
  /* balance sheet */
  var bs=chg(R0,R1,'bs',['bs:tca','bs:tnca','bs:ta','bs:tcl','bs:tl','bs:teq','bs:tle']);
  var dA=R1.ta-R0.ta,dL=R1.tl-R0.tl,dE=R1.teq-R0.teq;
  S.push({chip:'Balance sheet · A '+ST.fmtS(dA)+' = L '+ST.fmtS(dL)+' + E '+ST.fmtS(dE),st:'bs',keys:bs.map(function(x){return x.k}).concat(['bs:ta','bs:tle']),
    txt:'<b>Balance sheet:</b> '+(bs.length?li(bs):'no line changes')+'. Check the equation: assets '+ST.fmtS(dA)+' = liabilities '+ST.fmtS(dL)+' + equity '+ST.fmtS(dE)+' ✓'});
  /* cash flows */
  var cf=chg(R0,R1,'cf',['cf:end','cf:beg']),dC=R1.cash-R0.cash,cls=[];
  if(Math.abs(R1.cfo-R0.cfo)>0.005)cls.push('operating '+ST.fmtS(R1.cfo-R0.cfo));
  if(Math.abs(R1.cfi-R0.cfi)>0.005)cls.push('investing '+ST.fmtS(R1.cfi-R0.cfi));
  if(Math.abs(R1.cff-R0.cff)>0.005)cls.push('financing '+ST.fmtS(R1.cff-R0.cff));
  var adj=cf.filter(function(x){return /^cf:(ni|nc|wc)/.test(x.k)});
  var txt;
  if(Math.abs(dC)>0.005)txt='<b>Cash flows:</b> cash '+ST.fmtS(dC)+', classified as '+cls.join(', ')+'.'+(adj.length?' In the indirect method this shows up as: '+li(adj)+'.':'');
  else if(t.noncash)txt='<b>Cash flows:</b> no cash moved, so nothing appears in the three sections. The transaction is disclosed separately as a <b>non-cash investing and financing activity</b>.';
  else if(adj.length)txt='<b>Cash flows:</b> no cash moved — but watch the indirect method: '+li(adj)+'. The adjustments cancel out, so net cash from operating activities changes by 0.';
  else txt='<b>Cash flows:</b> no cash moved and no line changes.';
  S.push({chip:'Cash flows · cash '+ST.fmtS(dC),st:'cf',keys:cf.map(function(x){return x.k}),txt:txt});
  return S;
}

/* =========================================================
   ROUTER & START
   ========================================================= */
ST.zoom=function(){var v=100;try{v=parseInt(localStorage.getItem('st-zoom')||'100',10)}catch(e){}return [80,90,100,110,125,150].indexOf(v)>=0?v:100};
/* zoom goes on the page parts (header, content, footer), not on <html>: menus and pop-ups hang from <body> and are placed by
   on-screen coordinates, so they stay inside the window at any size (owner 26 Oct 2026: the ⋯ menu ran off the page at 150%) */
ST.applyZoom=function(){var v=ST.zoom(),de=document.documentElement.style;de.zoom='';['top','app','foot'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.zoom=''});
  if('zoom' in de){de.fontSize='';de.setProperty('--uz',String(v/100));de.setProperty('--uzt',String(window.innerWidth<600&&v>100?1:v/100))}   // a phone's header has no room to grow
  else de.fontSize=v===100?'':(v+'%')};   // font-size is the fallback where zoom is not supported
function route(){
  var h=location.hash||'#/',m;
  if(!$('#modal').hidden)closeModal();
  $('#nHome').classList.toggle('on',h==='#/'||h==='');document.documentElement.classList.toggle('gl-ar-on',!!ST.can('glossAr'));$('#nMap').classList.toggle('on',h==='#/map');
  if(!/^#\/t\//.test(h)){stopDwell();document.body.classList.remove('land-on');ST.inBank=false}
  if((m=h.match(/^#\/t\/([\w-]+)\/(\d+)/)))deck(m[1],+m[2]-1);
  else if(h==='#/map')losMap();
  else if(h==='#/glossary'&&ST.can('glossPage'))glossPage();
  else if(h==='#/mistakes')mistakesPage();
  else if(h==='#/practice')setPage();
  else if((m=h.match(/^#\/bank(?:\/([\w-]+))?$/)))(m[1]?bankTopic(m[1]):setPage());
  else if(h==='#/set-result')setResult();
  else if((m=h.match(/^#\/print\/([\w,-]+)/))&&ST.printView)ST.printView(m[1]);
  else if((m=h.match(/^#\/staff(?:\/(\w+))?/))&&ST.staffView)ST.staffView(m[1]||'');
  else if((m=h.match(/^#\/start(?:\/(\w+))?/))&&ST.startView)ST.startView(m[1]||'');
  else if(h==='#/details'&&ROLE==='student'&&ST.showProfile)ST.showProfile({edit:true});
  else if(ST.shellRoute&&ST.shellRoute(h))return;   // the platform shell: #/home, #/courses, #/certs, #/me (assets/shell.js)
  else home();
}
function help(){
  modal('How to use this deck',
  '<p>This is a full study deck for <b>CMA '+esc(CFG.part||'Part 1')+' – '+esc(CFG.section||'')+'</b>. It follows the 2024 Learning Outcome Statements in order, and every slide is tagged with the LOS it covers. Each section of Part 1 has its own deck: switch sections from the bar at the top of the home page.</p>'+
  '<ul><li><b>Concept</b> slides explain the idea, then a short <b>quick check</b> lets you test yourself before you move on.</li>'+
  '<li><b>Interactive</b> slides let you change the numbers and watch the four statements react.</li>'+
  '<li>Each lesson ends with <b>one closing question</b> or a short case. Every other exam-style question, and the topic\'s full case, is in the <b>question bank</b>, with an explanation for every option.</li></ul>'+
  '<p><b>Keyboard:</b> → next, ← previous, F full screen, L portrait / landscape, G (or the slide number at the bottom) to go to any slide. On a phone use the buttons at the bottom.</p>'+
  '<p><b>Slide view</b> (Settings): portrait for reading, or — for presenting — one screen or in parts with large text, as your role allows. <b>Portrait or landscape</b> (the screen icon in the slide\'s tools, or under ⋯): portrait is for reading — the text, then its picture. Landscape is for presenting — one screen, the text beside its picture, sized to fit. Full screen opens in landscape.</p>'+
  '<p><b>Readiness &amp; mistakes</b> (home page): your exam readiness (knowledge, memory and pace), questions due for <b>spaced review</b>, every practice question whose latest answer was wrong with its likely cause, your pace against the exam, and how sure you were. Before answering a practice question you can tap <b>Sure</b>, <b>Not sure</b> or <b>Guessing</b>.</p>'+
  '<p><b>Question bank</b> (home page): every topic has its own section there — practise all its questions, by LOS, as a timed set, or its case on its own. At the top you can build a set: pick the whole section or some topics and how many questions — they are spread across the LOS the way the exam spreads them. <b>Practice</b> shows the answer after each question; <b>Exam</b> runs one clock at exam pace and shows the answers, a score by LOS and every explanation at the end.</p>'+
  '<p><b>Print / PDF</b> (printer icon in a topic): the whole topic as a handout — clean white or screen colours — with an answer key at the end. <b>Excel</b> (table icon): download the tables on the slide, or every table in the topic from the handout page.</p>'+
  '<p>Progress measures <b>mastery</b>: slides read for at least '+readTxt()+' and practice answered correctly. The <b>LOS map</b> shows which LOS you have mastered.'+(ST.sync&&ST.sync.enabled()?' Sign in with your student code to use the same progress on every device.':'')+'</p>'+
  
  '<p><b>Settings</b> (gear icon): light or dark theme, background colour, reading time, and the optional <b>focus tools</b> (Pomodoro timer, background sound, daily goal) and <b>exam tools</b> (basic calculator, present and future value tables). The calculator and table buttons also appear in the slide\'s tools on slides that need them.</p><p><b>Your screen</b> (Settings, or ⋯ on a slide): the tools at the top right of each slide — Listen, ع, calculator and the rest — sit on the slide, under ⋯, or are hidden, as you choose. <b>Focus mode</b> hides the top bar so only the slide stays.</p>'+
  '<p class="muted">Every company, person, number, case and question is invented START TIME material — any likeness to a real company is accidental. Amounts are in U.S. dollars unless stated.</p>'+
  (ST.fun?'<div class="row"><button class="btn sm" type="button" id="hTour">Take the welcome tour again</button></div>':''));
  var ht=document.getElementById('hTour');if(ht)ht.onclick=function(){ST.fun.tour()};
}
/* appearance: light / dark exactly as designed, plus a page background colour of your own for each (Default = as designed).
   Kept on this device only. */
/* Appearance: light / dark, and a background of your own. Every choice here keeps the text easy to read:
   ready-made backgrounds come with a short hint, and "Make your own" offers 12 colours in three soft levels per theme
   (light: very pale tints; dark: deep shades) — strong or glaring colours are not offered. */
var BGS={light:[['Default','','Clean and neutral'],['Paper','#FBF8F1','Recommended · warm and soft, easiest for long study',1],['Sand','#F5EFE3','Calmer · warmer, less glare'],
          ['Mint','#EDF6F1','Calm green, restful'],['Sky','#EDF3FB','Brighter · cool and crisp'],['Grey','#EEF0F3','Dimmer · less glare on bright screens'],['Lavender','#F2F0F9','Soft and quiet']],
         dark:[['Default','','The standard dark'],['Coffee','#1B1612','Recommended at night · warm, less blue light',1],['Charcoal','#15171C','Calmer · neutral, softer contrast'],
          ['Forest','#0E1B16','Calm green'],['Plum','#191424','Soft violet'],['Midnight','#070D1A','Darker'],['Black','#000000','Darkest · for OLED screens in a dark room']]};
var HUES=['Red','Orange','Amber','Yellow','Lime','Green','Teal','Cyan','Blue','Indigo','Violet','Pink'];
var TINTS={"light":[["#FBF4F4","#FBF7F4","#FBF9F4","#FBFAF4","#F8FBF4","#F4FBF6","#F4FBFA","#F4F9FB","#F4F7FB","#F4F4FB","#F7F4FB","#FBF4F8"],["#F6ECEC","#F6F0EC","#F6F3EC","#F6F5EC","#F2F6EC","#ECF6EE","#ECF6F5","#ECF4F6","#ECF0F6","#ECEDF6","#F0ECF6","#F6ECF2"],["#F0E5E5","#F0EAE5","#F0EDE5","#F0EFE5","#ECF0E5","#E5F0E8","#E5F0EE","#E5EEF0","#E5EAF0","#E5E6F0","#EAE5F0","#F0E5EC"]],"dark":[["#241616","#241C16","#242016","#242316","#1E2416","#16241A","#162422","#162224","#161C24","#161724","#1C1624","#24161E"],["#1C1010","#1C1510","#1C1810","#1C1B10","#171C10","#101C13","#101C1A","#10191C","#10151C","#10111C","#15101C","#1C1017"],["#120A0A","#120D0A","#12100A","#12120A","#0F120A","#0A120C","#0A1211","#0A1112","#0A0D12","#0A0B12","#0D0A12","#120A0F"]]};
var LEVELS={light:['Brighter','Balanced','Dimmer'],dark:['Lighter','Balanced','Darker']};
function curTheme(){return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light'}   // the app's own choice, light unless Dark is picked — the device's dark mode does not change it
function bgGet(t){try{return localStorage.getItem('st-bg-'+t)||''}catch(e){return ''}}
/* ready themes: a page colour, card colour and text colour that belong together; light or dark goes with each (the academy colours stay) */
var RT=[['','Standard','The platform as designed','light','#F8FAFC','#112240'],['sepia','Warm paper','For long study hours','light','#F3EAD7','#3A2E22'],
  ['night','Calm night','Less blue light at night','dark','#14110E','#ECE3D3'],['contrast','High contrast','Tired eyes, or a screen in the sun','light','#FFFFFF','#000000'],
  ['calm','Very calm','Soft grey, nothing bright','light','#ECEEF1','#2E3846']];
function rtGet(){try{var v=localStorage.getItem('st-rt')||'';return RT.some(function(x){return x[0]===v})?v:''}catch(e){return ''}}
function rtSet(v){try{if(v)localStorage.setItem('st-rt',v);else localStorage.removeItem('st-rt')}catch(e){}var r=document.documentElement;if(v)r.setAttribute('data-rt',v);else r.removeAttribute('data-rt')}
function applyBg(){var t=curTheme(),v=rtGet()?'':bgGet(t),r=document.documentElement;
  if(v)r.style.setProperty('--bg',v);else r.style.removeProperty('--bg');
  if(v&&t==='light')r.style.setProperty('--muted','#4F5C73');else r.style.removeProperty('--muted')}   // a tinted page gets slightly darker grey text
function appearance(){
  var box=el('div','apx');
  function sw(c,name,hint,on,rec,small){var t=curTheme(),bg=c||(t==='dark'?'#0B1324':'#F8FAFC');
    return '<button class="sw'+(small?' sm':'')+(on?' on':'')+'" data-c="'+c+'" title="'+esc(name+(hint?' — '+hint:''))+'" aria-label="'+esc(name)+'" style="background:'+bg+'">'+(small?'':'<span>'+esc(name)+'</span>')+(rec?'<i class="rec">★</i>':'')+'</button>'}
  function draw(){var t=curTheme(),cur=bgGet(t);
    var rt=rtGet();
    box.innerHTML='<h4 class="apx-h" style="margin-top:0">Ready themes <span class="note">— the page and the text together; the academy colours stay</span></h4>'+
      '<div class="apx-rt">'+RT.map(function(x){return '<button type="button" class="rt'+(x[0]===rt&&(x[0]||!bgGet(t))?' on':'')+'" data-rt="'+x[0]+'" style="background:'+x[4]+';color:'+x[5]+'" aria-pressed="'+(x[0]===rt?'true':'false')+'"><b>Aa</b><i></i><span>'+x[1]+'</span><small>'+x[2]+'</small></button>'}).join('')+'</div>'+
      '<div class="apx-r"><span class="note">Theme</span><div class="seg" id="apT"><button data-t="light"'+(t==='light'?' class="on"':'')+'>Light</button><button data-t="dark"'+(t==='dark'?' class="on"':'')+'>Dark</button></div></div>'+
      '<p class="note apx-tip">The platform keeps its own theme: it stays the way you choose here even when the phone or computer is in dark mode.</p>'+
      '<p class="note apx-tip">'+(t==='light'?'For long study a warm, soft background is easiest on the eyes — <b>Paper</b> ★ is our pick. In a dark room, switch to <b>Dark</b>.':'At night a warm dark background is gentlest — <b>Coffee</b> ★ is our pick. In daylight, <b>Light</b> is easier to read.')+'</p>'+
      '<div class="apx-ready">'+BGS[t].map(function(x){return '<div class="apx-it">'+sw(x[1],x[0],x[2],(x[1]||'')===cur,x[3])+'<small>'+esc(x[2])+'</small></div>'}).join('')+'</div>'+
      '<h4 class="apx-h">Make your own <span class="note">— 12 colours, each in three soft levels</span></h4>'+
      '<div class="apx-grid">'+TINTS[t].map(function(row,li){return '<div class="apx-lv"><span class="note">'+LEVELS[t][li]+'</span><div class="apx-row">'+row.map(function(c,hi){return sw(c,HUES[hi]+' · '+LEVELS[t][li],'',c===cur,0,1)}).join('')+'</div></div>'}).join('')+'</div>'+
      '<div class="apx-r"><button class="btn sm ghost" id="apD">Back to default</button><span class="note">Saved on this device only. Light and dark keep their own background.</span></div>';
    ST.h.$$('#apT button',box).forEach(function(b){b.onclick=function(){var r0=RT.filter(function(x){return x[0]===rtGet()})[0];if(r0&&r0[0]&&r0[3]!==b.dataset.t)rtSet('');   // a theme made for the other mode goes back to Standard
      document.documentElement.setAttribute('data-theme',b.dataset.t);try{localStorage.setItem('st-p1a-theme',b.dataset.t)}catch(e){}applyBg();draw()}});
    ST.h.$$('.rt',box).forEach(function(b){b.onclick=function(){var x=RT.filter(function(y){return y[0]===b.dataset.rt})[0];if(!x)return;
      document.documentElement.setAttribute('data-theme',x[3]);try{localStorage.setItem('st-p1a-theme',x[3]);localStorage.removeItem('st-bg-'+x[3])}catch(e){}
      rtSet(x[0]);applyBg();draw()}});
    ST.h.$$('.sw',box).forEach(function(b){b.onclick=function(){set(b.dataset.c)}});
    $('#apD',box).onclick=function(){set('')}}
  function set(v){var t=curTheme();rtSet('');try{if(v)localStorage.setItem('st-bg-'+t,v);else localStorage.removeItem('st-bg-'+t)}catch(e){}applyBg();draw()}   // a background of your own leaves the ready theme
  draw();return box}
ST.appearanceBox=appearance;

/* Settings (gear in the top bar): appearance for everyone; reading time for the roles ticked on Roles → Staff panel: reading time */
function settings(at){
  var box=el('div','sett');
  if(ST.uiSettings)try{box.appendChild(ST.uiSettings())}catch(e){console.error(e)}   // Your screen: the tools on the slide (ui.js)
  box.appendChild(el('h3','sett-h','Appearance'));box.appendChild(appearance());
  /* Text size (owner 26 Oct 02:46): 80 % to 150 %, kept on this device; applied to the whole page */
  (function(){var ZK='st-zoom',Z=[80,90,100,110,125,150],z=el('div','','<h3 class="sett-h">Text size</h3><p class="note">Makes the text and the slides bigger or smaller on this device.</p><div class="seg sm" role="group" aria-label="Text size">'+Z.map(function(x){return '<button type="button" data-z="'+x+'">'+x+'%</button>'}).join('')+'</div>');
    var paintZ=function(){var v=ST.zoom();$$('[data-z]',z).forEach(function(b){var on=+b.dataset.z===v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')})};
    $$('[data-z]',z).forEach(function(b){b.onclick=function(){try{localStorage.setItem(ZK,b.dataset.z)}catch(e){}ST.applyZoom();paintZ()}});paintZ();box.appendChild(z)})();
  var vs=landStyles();if(vs.length){var vw=el('div','');var curV=function(){return orientPref()==='l'?landMode():'p'};
    vw.innerHTML='<h3 class="sett-h">Slide view</h3><p class="note">Portrait is for reading. The other views are for presenting on a wide screen (a computer or a projector); phones always show portrait. The L key, or the screen icon at the top of a slide, switches between portrait and the view you pick here.</p>'+
      '<div class="apx-r"><span class="seg sm vw-seg" role="group" aria-label="Slide view"><button type="button" data-v="p">Portrait</button>'+LSTY.filter(function(x){return vs.indexOf(x[0])>=0}).map(function(x){return '<button type="button" data-v="'+x[0]+'">'+x[2]+'</button>'}).join('')+'</span></div>'+
      '<p class="note vw-tip"></p>';
    var TIP={p:'The text, then its picture; the page scrolls.',fit:'The whole slide on one screen, the text beside its picture. Long slides get smaller text.',split:'Large text. A long slide shows in two or three parts under the same slide number: Next shows the next part.'};
    var paintV=function(){var v=curV();$$('[data-v]',vw).forEach(function(b){var on=b.dataset.v===v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});$('.vw-tip',vw).textContent=TIP[v]||''};
    $$('[data-v]',vw).forEach(function(b){b.onclick=function(){var v=b.dataset.v;try{if(v==='p')localStorage.setItem(ORK,'p');else{localStorage.setItem(ORK,'l');localStorage.setItem(LMK,v)}}catch(e){}
      paintV();if(cur.t&&/^#\/t\//.test(location.hash)){closeModal();deck(cur.t.id,cur.i)}}});
    paintV();box.appendChild(vw)}
  if(ST.fun)box.appendChild(ST.fun.settingsRow());
  (ST.settingsExtra||[]).forEach(function(f){try{var n=f();if(n)box.appendChild(n)}catch(e){}});   // rows added by other scripts (e.g. trsel.js)
  if(ST.focus){var fc=el('div','','<h3 class="sett-h">Focus tools</h3><p class="note">A Pomodoro timer, calm background sound and a daily goal. All optional — turn each on or off whenever you like.</p><div class="apx-r"><button class="btn sm" type="button">Open focus tools</button></div>');fc.querySelector('button').onclick=ST.focus.panel;box.appendChild(fc)}
  if(ST.tools){var xt=el('div','','<h3 class="sett-h">Exam tools</h3><p class="note">The basic calculator and the present / future value tables. On slides that need them they also open from the slide\'s tools (on the slide or under ⋯).</p><div class="apx-r"><button class="btn sm" type="button" data-x="c">Calculator</button><button class="btn sm" type="button" data-x="t">PV / FV tables</button></div>');
    $$('[data-x]',xt).forEach(function(b){b.onclick=function(){closeModal();if(b.dataset.x==='c')ST.tools.calc();else ST.tools.tables()}});box.appendChild(xt)}
  var rt=el('div');rt.innerHTML='<h3 class="sett-h">Reading time</h3>';box.appendChild(rt);
  if(ST.canStaff('readTime')&&ST.adminCall){
    rt.insertAdjacentHTML('beforeend','<p class="note">How long a concept slide must stay on screen before it counts as read. Students get the new time the next time they open the deck.</p>'+
      '<div class="apx-r"><label class="sett-n">Minutes <input class="inp" id="stM" inputmode="numeric" maxlength="2"></label><label class="sett-n">Seconds <input class="inp" id="stS" inputmode="numeric" maxlength="2"></label></div>'+
      '<div class="apx-r">'+[[30,'30 s'],[60,'1 min'],[120,'2 min'],[180,'3 min (default)'],[300,'5 min']].map(function(x){return '<button class="btn sm ghost" type="button" data-p="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>'+
      '<div class="apx-r"><button class="btn pri sm" type="button" id="stGo">Save</button><span class="note" id="stMsg"></span></div>');
    var mI=$('#stM',rt),sI=$('#stS',rt),msg=$('#stMsg',rt),go=$('#stGo',rt);
    var show=function(v){mI.value=Math.floor(v/60);sI.value=v%60};show(readSec());
    ST.h.$$('[data-p]',rt).forEach(function(x){x.onclick=function(){show(+x.dataset.p)}});
    go.onclick=function(){var v=(parseInt(mI.value,10)||0)*60+(parseInt(sI.value,10)||0);
      if(v<5||v>900){msg.textContent='Choose between 5 seconds and 15 minutes.';return}
      go.disabled=true;msg.textContent='Saving…';
      ST.adminCall('setReadTime',{seconds:v}).then(function(r){go.disabled=false;if(!r.ok){msg.textContent=r.error||'Not saved.';return}
        var s=ST.session();if(s){s.readSec=r.seconds;ST.setSession(s)}show(r.seconds);msg.textContent='Saved: '+readTxt()+'.'})
      .catch(function(e){go.disabled=false;msg.textContent=e.message})}
  }else rt.insertAdjacentHTML('beforeend','<p class="note">A concept slide counts as read after <b>'+readTxt()+'</b> on screen'+(ST.can('markRead')?', or when you press <b>Mark as read</b>':'')+'. A read slide can be marked unread again.</p>');
  if(!standalone()&&(INST||isIOS())){var ins=el('div');ins.innerHTML='<h3 class="sett-h">App</h3><div class="apx-r"><button class="btn sm" type="button">Install the app on this device</button></div>';ins.querySelector('button').onclick=doInstall;box.appendChild(ins)}
  settTabs(box,typeof at==='string'?at:'');
  modal('Settings',box)}
ST.settings=function(at){settings(at)};
/* Settings in tabs, not one long page (owner 20 Oct 02:10): the sections (each starts with its h3.sett-h, whichever script added it) go into
   a few tabs; a tab with nothing for this person is not shown; the last tab used is remembered on this device. "ui" (from ⋯ → Your screen)
   opens Screen. A section a later script adds with a new title lands in More. */
var SETT_TABS=[['look','Appearance',['Appearance','Text size','Motion']],['screen','Screen',['Your screen','Slide view','App']],['listen','Listen',['Listen']],
  ['lang','Translate',['Translate']],['study','Study',['Focus tools','Exam tools','Reading time']],['more','More',[]]],SETT_K='st-sett-tab';
function settTabs(box,at){
  var secs=[],cs=null;
  [].slice.call(box.children).forEach(function(n){
    var h=n.matches&&n.matches('h3.sett-h')?n:(n.firstElementChild&&n.firstElementChild.matches&&n.firstElementChild.matches('h3.sett-h')?n.firstElementChild:null);
    if(h||!cs){cs={t:h?h.textContent.trim():'',h:h,nodes:[]};secs.push(cs)}cs.nodes.push(n)});
  var by={};secs.forEach(function(x){var t=SETT_TABS.filter(function(g){return g[2].indexOf(x.t)>=0})[0]||SETT_TABS[SETT_TABS.length-1];(by[t[0]]=by[t[0]]||[]).push(x)});
  var tabs=SETT_TABS.filter(function(g){return by[g[0]]});if(tabs.length<2)return;
  box.innerHTML='';box.classList.add('sett-tabbed');
  var bar=el('div','sett-tabs');bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Settings');box.appendChild(bar);
  tabs.forEach(function(g){var b=el('button','sett-tab',g[1]);b.type='button';b.id='stt-'+g[0];b.setAttribute('role','tab');b.dataset.tab=g[0];bar.appendChild(b);
    var p=el('div','sett-pane');p.setAttribute('role','tabpanel');p.dataset.tab=g[0];p.setAttribute('aria-labelledby','stt-'+g[0]);
    by[g[0]].forEach(function(x){if(x.h&&by[g[0]].length===1&&x.t===g[1])x.h.classList.add('sett-same');x.nodes.forEach(function(n){p.appendChild(n)})});box.appendChild(p)});
  function show(k){if(!tabs.some(function(g){return g[0]===k}))k=tabs[0][0];
    $$('.sett-tab',bar).forEach(function(b){var on=b.dataset.tab===k;b.classList.toggle('on',on);b.setAttribute('aria-selected',on?'true':'false');b.tabIndex=on?0:-1});
    $$('.sett-pane',box).forEach(function(p){p.hidden=p.dataset.tab!==k});try{localStorage.setItem(SETT_K,k)}catch(e){}
    var mb=box.closest('.modal-box');if(mb)mb.scrollTop=0}
  $$('.sett-tab',bar).forEach(function(b){b.onclick=function(){show(b.dataset.tab)}});
  bar.addEventListener('keydown',function(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;var bs=$$('.sett-tab',bar),i=bs.indexOf(document.activeElement);if(i<0)return;
    var n=bs[(i+(e.key==='ArrowRight'?1:bs.length-1))%bs.length];n.focus();show(n.dataset.tab);e.preventDefault()});
  var last='';try{last=localStorage.getItem(SETT_K)||''}catch(e){}
  show(at==='ui'?'screen':last||'look')}

/* install as an app: Chrome / Edge / Android offer it (button appears), iPhone / iPad get the Safari steps.
   Installed, it opens full screen from its own icon on the desktop, start menu or home screen. */
var INST=null;
function standalone(){return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true}
function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function doInstall(){
  if(INST){INST.prompt();INST.userChoice.then(function(){INST=null;paintInstall()});return}
  modal('Install the app',isIOS()?'<p>In <b>Safari</b>, tap the <b>Share</b> button, then <b>Add to Home Screen</b>, then <b>Add</b>. The app then opens full screen from its icon.</p>':
    '<p>Open the browser menu (⋮ or …) and choose <b>Install app</b> or <b>Add to Home screen</b>. On a computer, Chrome and Edge also show an install icon at the right end of the address bar. The app then gets its own icon on the desktop and in the start menu.</p>')}
function paintInstall(){var show=!standalone()&&(!!INST||isIOS());
  ['#nInst','#gInst'].forEach(function(id){var b=$(id);if(b){b.hidden=!show;b.onclick=doInstall}})}
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();INST=e;paintInstall()});
window.addEventListener('appinstalled',function(){INST=null;paintInstall()});
ST.paintInstall=paintInstall;
ST.start=function(){
  ST.applyHidden();if(ST.HF)ST.HF.apply();
  $('#mClose').onclick=closeModal;$('#modal').addEventListener('click',function(e){if(e.target.id==='modal')closeModal()});
  $('#nHelp').onclick=help;
  var nav=$('.top-act');if(nav&&!$('#nInst')){var ib=el('button','ib inst','<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg><span>Install app</span>');ib.id='nInst';ib.hidden=true;ib.title='Install the app on this device';ib.setAttribute('aria-label','Install the app on this device');nav.insertBefore(ib,nav.firstChild)}
  paintInstall();
  $('#nTheme').onclick=settings;
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.qc-o');if(!b)return;var q=b.closest('.qc');if(!q||q.classList.contains('done'))return;
    var a=+q.getAttribute('data-a'),i=+b.getAttribute('data-i');q.classList.add('done');
    $$('.qc-o',q).forEach(function(x,j){x.disabled=true;if(j===a)x.classList.add('ok');else if(j===i)x.classList.add('bad')});
    var ex=$('.qc-e',q);ex.hidden=false;ex.insertAdjacentHTML('afterbegin','<span class="qc-v '+(i===a?'ok':'bad')+'">'+(i===a?'Right. ':'Not quite. ')+'</span>')});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&!$('#modal').hidden){closeModal();return}
    var tg=e.target.tagName;if(/INPUT|SELECT|TEXTAREA/.test(tg)||!$('#modal').hidden)return;
    if(!cur.t||!/^#\/t\//.test(location.hash))return;
    if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();go(1)}
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(-1)}
    else if(e.key==='f'||e.key==='F'){toggleFS()}
    else if((e.key==='l'||e.key==='L')&&window.innerWidth>=700&&landStyles().length){setOrient(orient()==='l'?'p':'l')}
    else if(e.key==='g'||e.key==='G'){e.preventDefault();var S=setIdx();if(S.j>=0)setGrid(S.v,S.j);else toc(cur.t)}
    else if(setIdx().j>=0)return;   // inside a practice set: no jumping around the topic
    else if(e.key==='Home'){e.preventDefault();location.hash='#/t/'+cur.t.id+'/1'}
    else if(e.key==='End'){e.preventDefault();location.hash='#/t/'+cur.t.id+'/'+(cur.i<(cur.t.nL||cur.t.slides.length)?(cur.t.nL||cur.t.slides.length):cur.t.slides.length)}
    else if(/^[0-9]$/.test(e.key)){KEYN=(KEYN+e.key).slice(-3);clearTimeout(KEYT);KEYT=setTimeout(function(){KEYN=''},1500);hint('Slide '+KEYN+' — press Enter')}
    else if(e.key==='Enter'&&KEYN){var v=parseInt(KEYN,10);KEYN='';hint('');if(v>=1&&v<=cur.t.slides.length)location.hash='#/t/'+cur.t.id+'/'+v}
  });
  if(ST.gated()&&ST.showGate){ST.showGate();return}
  if(ST.needProfile&&ST.needProfile()){ST.showProfile();return}       // a student's first sign-in: details before anything else
  if(ST.syncInit)ST.syncInit();
  if(ST.roleInit)ST.roleInit();
  if(ST.introFirst)ST.introFirst();
  ST.applyZoom();window.addEventListener('hashchange',route);route();
};
})();
