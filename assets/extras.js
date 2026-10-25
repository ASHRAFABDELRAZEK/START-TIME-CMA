/* START TIME — extras: trainer "show answer", printable handouts (clean or screen colours), Excel export of tables. */
(function(){
'use strict';
var ST=window.ST,el=ST.h.el,$=ST.h.$,$$=ST.h.$$,esc=ST.h.esc,M=ST.money;
var L='ABCDEFGH';
var XLSX_URL='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
var ICO={
  xls:'<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M4 9h16M4 14h16M10 4v16"/></svg>',
  prt:'<svg viewBox="0 0 24 24"><path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><path d="M7 14h10v6H7z"/></svg>'
};

/* ---------- solutions (trainer view and printed answer keys) ---------- */
function strip(h){var d=document.createElement('div');d.innerHTML=h||'';return d.textContent||''}
function solHTML(s){
  var e=s.e?'<div style="margin-top:6px">'+s.e+'</div>':'';
  if(s.t==='mcq')return '<b>Answer: '+L[s.a]+'.</b> '+s.o[s.a]+e+(s.w?'<ol type="A" class="sol-w">'+s.w.map(function(w){return '<li>'+w+'</li>'}).join('')+'</ol>':'');
  if(s.t==='multi')return '<b>Answers: '+s.a.map(function(i){return L[i]}).join(', ')+'.</b><ul>'+s.a.map(function(i){return '<li>'+s.o[i]+'</li>'}).join('')+'</ul>'+e;
  if(s.t==='num'){var f=s.f||[{l:'Answer',a:s.a,m:s.m}],sv=function(v){return (v<0?'(':'')+M(Math.abs(v))+(v<0?')':'')},tr=[];f.forEach(function(x){(x.m||[]).forEach(function(mm){tr.push('<li><b>'+sv(mm[0])+'</b>'+(f.length>1?' <span class="muted">· '+x.l+'</span>':'')+' — '+mm[1]+'</li>')})});
    return '<ul>'+f.map(function(x){return '<li>'+x.l+': <b>'+sv(x.a)+'</b></li>'}).join('')+'</ul>'+e+(tr.length?'<div style="margin-top:6px"><b>Tempting wrong answers</b><ul>'+tr.join('')+'</ul></div>':'')}
  if(s.t==='sort')return '<div class="tw"><table class="t"><tr><th>Item</th><th>Belongs in</th></tr>'+s.i.map(function(it){var b=s.b.filter(function(x){return x.id===it.b})[0];return '<tr><td>'+it.x+'</td><td><b>'+(b?b.l:'')+'</b>'+(it.w?' — '+it.w:'')+'</td></tr>'}).join('')+'</table></div>'+e;
  if(s.t==='dd')return '<p>'+s.s.replace(/\{(\d+)\}/g,function(m,i){var f=s.f[+i];return '<b><u>'+esc(f.o[f.a])+'</u></b>'})+'</p>'+e+(s.f.some(function(f){return f.w})?'<ol>'+s.f.map(function(f){return '<li>'+f.o.map(function(o,j){return (j===f.a?'<b>'+esc(o)+' ✓</b>':esc(o))+(f.w&&f.w[j]?' — '+f.w[j]:'')}).join('<br>')+'</li>'}).join('')+'</ol>':'');
  if(s.t==='order')return '<ol>'+s.i.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ol>'+e;
  return '<p>This activity is interactive — work through it in the online deck.</p>';
}
ST.solHTML=solHTML;

/* ---------- trainer: show answer on practice slides ---------- */
ST.deckSlide=function(sec,body,t,s){
  if(!ST.can('answers')||!ST.isPractice(s)||s.t==='trace')return;
  var b=el('button','btn sm ghost sol-b','Show answer');b.style.marginTop='10px';
  function show(){sec.appendChild(el('div','call key sol','<div class="ct">'+ST.ICON.key+'Answer</div>'+solHTML(s)));b.textContent='Hide answer'}
  b.onclick=function(){var p=$('.sol',sec);if(p){p.remove();b.textContent='Show answer';return}show()};
  sec.appendChild(b);var ss=ST.session();if(ss&&ss.answers)show();
};

/* ---------- deck top bar: Excel + print ---------- */
ST.deckTop=function(top,t,idx){
  if(ST.can('excel')){
  var x=el('button','ib dk-xl',ICO.xls);x.title='Export this slide\'s tables to Excel';x.setAttribute('aria-label','Export tables to Excel');
  x.onclick=function(){var sec=$('.slide');var tabs=sec?$$('table.t',sec):[];if(!tabs.length){ST.modal('Export to Excel','<p>This slide has no tables. Open <b>Print / PDF</b> from the slide list to export every table in the topic.</p>');return}
    exportTables([{h:(idx+1)+' '+strip(t.slides[idx].h||''),tables:tabs}],t.n,t.id+'-slide'+(idx+1))};
  top.appendChild(x)}
  if(ST.can('print')){
  var p=el('button','ib dk-pr',ICO.prt);p.title='Print / PDF this topic';p.setAttribute('aria-label','Print or save as PDF');
  p.onclick=function(){printDialog(t)};
  top.appendChild(p)}
};

function printDialog(t){
  var all=ST.topics.filter(function(x){return !x.soon}),groups=[],byG={};
  var stOk=ST.can('printStory')&&all.some(function(x){return x.slides.some(ST.hasStory)});   // Scenarios and stories only: staff by default (Roles → printStory); a story hidden from a student is not loaded at all
  all.forEach(function(x){if(!byG[x.group]){byG[x.group]=[];groups.push(x.group)}byG[x.group].push(x)});
  var box=el('div','pdlg');
  box.innerHTML='<p class="note">Pick the topics and slides for the handout. Every choice is a tick — select as many as you like.</p>'+
   '<fieldset class="pd-f"><legend>Topics</legend><div class="row pd-tools"><button type="button" class="btn sm ghost" data-all="1">Select all</button><button type="button" class="btn sm ghost" data-all="0">Clear</button></div>'+
   groups.map(function(g){return '<div class="pd-gh">'+esc(g)+'</div><div class="pd-list">'+byG[g].map(function(x){
     var lk=ST.lock&&ST.lock(x);
     return '<label class="ck'+(lk?' off':'')+'"><input type="checkbox" name="pt" value="'+x.id+'"'+(x===t&&!lk?' checked':'')+(lk?' disabled':'')+'><span>'+esc(x.n)+' <span class="note">· '+(lk?esc(ST.lockText(lk)):x.slides.length)+'</span></span></label>'}).join('')+'</div>'}).join('')+'</fieldset>'+
   '<fieldset class="pd-f" id="pdSl"><legend>Slides</legend><div id="pdSlBody"></div></fieldset>'+
   '<fieldset class="pd-f" id="pdInc"><legend>Include — tick one or more</legend><div class="row pd-tools">'+   // owner 20 Oct: any mix (stories + questions, explanations + questions …)
     (stOk?'<label class="ck"><input type="checkbox" name="pk" value="s"><span>Scenarios and stories</span></label>':'')+
     '<label class="ck"><input type="checkbox" name="pk" value="c" checked><span>Explanations</span></label>'+
     '<label class="ck"><input type="checkbox" name="pk" value="p" checked><span>Practice questions</span></label>'+
     (ST.can('glossPrint')?'<label class="ck"><input type="checkbox" name="pk" value="g"><span>Glossary (A–Z, at the end)</span></label>':'')+
   '</div><p class="note" id="pkNote" hidden></p></fieldset>'+
   '<div class="ctl"><label>Style<select class="sel-in" id="pStyle"><option value="clean">Clean — white page, saves ink</option><option value="color">Screen colours</option></select></label>'+
   (ST.can('answerKey')?'<label id="pAnsW">Answer key<select class="sel-in" id="pAns"><option value="1">At the end</option><option value="0">Leave it out</option></select></label>':'')+'</div>'+
   '<div class="row"><label>Show first<select class="sel-in" id="pOri"><option value="p">A4 portrait</option><option value="l">A4 landscape</option></select></label></div>'+
   '<p class="note">You see the exact pages before printing. Portrait and landscape are both prepared: the print window\'s orientation decides which one prints. Every page carries the academy\'s name, your details and the page number.</p>'+
   '<div class="row pd-go"><button class="btn pri" id="pGo">Open handout</button><span class="note" id="pdCount"></span></div>';
  ST.modal('Print / PDF',box);
  var picked=function(){return $$('input[name="pt"]:checked',box).map(function(i){return i.value})};
  var kinds=function(){return $$('input[name="pk"]:checked',box).map(function(i){return i.value}).join('')};   // e.g. 'sp' = stories + practice questions
  var kindOk=function(s){var k=kinds(),pr=ST.isPractice(s)&&s.t!=='trace';if(pr)return k.indexOf('p')>=0;if(k.indexOf('c')>=0)return true;return k.indexOf('s')>=0&&ST.hasStory(s)};
  function slides(){var ids=picked(),body=$('#pdSlBody');
    if(ids.length!==1){body.innerHTML='<p class="note">'+(ids.length?'With more than one topic, each topic is printed in full (what you tick under <b>Include</b>).':'Tick at least one topic.')+'</p>';count();return}
    var tp=ST.byId[ids[0]];
    body.innerHTML='<div class="row pd-tools"><label class="ck"><input type="radio" name="psm" value="all" checked><span>All slides</span></label><label class="ck"><input type="radio" name="psm" value="pick"><span>Only the slides I tick</span></label></div>'+
      '<div class="pd-sl" hidden><div class="row pd-tools"><button type="button" class="btn sm ghost" data-sl="1">Tick all</button><button type="button" class="btn sm ghost" data-sl="0">Clear</button><button type="button" class="btn sm ghost" data-sl="p">Practice only</button></div><div class="pd-list">'+tp.slides.map(function(s,i){var pr=ST.isPractice(s)&&s.t!=='trace';
        return '<label class="ck"><input type="checkbox" name="ps" value="'+(i+1)+'" checked><span>'+(i+1)+'. '+(s.h||(pr?'Practice':'Slide'))+(pr?' <span class="chip t">practice</span>':'')+'</span></label>'}).join('')+'</div></div>';
    $$('input[name="psm"]',body).forEach(function(r){r.onchange=function(){$('.pd-sl',body).hidden=r.value!=='pick'||!r.checked;count()}});
    $$('input[name="ps"]',body).forEach(function(c){c.onchange=count});
    $$('[data-sl]',body).forEach(function(b){b.onclick=function(){$$('input[name="ps"]',body).forEach(function(c){var s=tp.slides[c.value-1];
      c.checked=b.dataset.sl==='1'||(b.dataset.sl==='p'&&ST.isPractice(s)&&s.t!=='trace')});count()}});count()}
  function count(){var ids=picked(),n=0,pick=$('input[name="psm"][value="pick"]',box);
    var k=kinds(),nt=$('#pkNote');
    if($('#pAnsW'))$('#pAnsW').hidden=k.indexOf('p')<0;                       // an answer key only with the practice questions
    if(nt){nt.hidden=!(k.indexOf('s')>=0&&k.indexOf('c')>=0);nt.textContent='The explanations already carry the Scenario slide and the story lines.'}
    if(!k){$('#pdCount').textContent='Tick at least one thing to include.';$('#pGo').disabled=true;return}
    if(k==='g'){n=ST.glRows(ids).length;$('#pdCount').textContent=ids.length?ids.length+' topic'+(ids.length>1?'s':'')+' · '+n+' key term'+(n===1?'':'s'):'';$('#pGo').disabled=!n;return}
    ids.forEach(function(id){var tp=ST.byId[id];tp.slides.forEach(function(s,i){
      if(!kindOk(s))return;if(ids.length===1&&pick&&pick.checked&&!$('input[name="ps"][value="'+(i+1)+'"]',box).checked)return;n++})});
    $('#pdCount').textContent=ids.length?ids.length+' topic'+(ids.length>1?'s':'')+' · '+n+' slide'+(n===1?'':'s'):'';$('#pGo').disabled=!n}
  $$('input[name="pt"]',box).forEach(function(c){c.onchange=slides});
  $$('[data-all]',box).forEach(function(b){b.onclick=function(){$$('input[name="pt"]',box).forEach(function(c){c.checked=!c.disabled&&b.dataset.all==='1'});slides()}});
  $$('input[name="pk"]',box).forEach(function(c){c.onchange=count});slides();
  $('#pGo').onclick=function(){var ids=picked();if(!ids.length)return;
    var st=$('#pStyle').value,an=ST.can('answerKey')?$('#pAns').value:'0',k=kinds(),sl='';if(!k)return;
    var pick=$('input[name="psm"][value="pick"]',box);
    if(ids.length===1&&pick&&pick.checked)sl=$$('input[name="ps"]:checked',box).map(function(c){return c.value}).join('.');
    var gl=k!=='g'&&k.indexOf('g')>=0,kk=k==='g'?'g':k.replace('g','');if(kk.indexOf('p')<0)an='0';
    var o=$('#pOri')?$('#pOri').value:'p';ST.closeModal();location.hash='#/print/'+ids.join(',')+'?style='+st+'&ans='+an+(kk!=='cp'?'&k='+kk:'')+(sl?'&s='+sl:'')+(gl?'&g=1':'')+(o==='l'?'&o=l':'')};
}
ST.printDialog=function(t){if(ST.can('print'))printDialog(t)};

/* ---------- print view ---------- */
function staticQ(s){
  var stem='<div class="stem">'+(s.q||'')+'</div>';
  if(s.t==='mcq'||s.t==='multi')return stem+'<ol type="A" class="pq">'+s.o.map(function(o){return '<li>'+o+'</li>'}).join('')+'</ol>'+(s.t==='multi'?'<p class="note">Select all that apply.</p>':'');
  if(s.t==='num'){var f=s.f||[{l:'Answer'}];return stem+'<ul class="pq">'+f.map(function(x){return '<li>'+x.l+': <span class="blank"></span></li>'}).join('')+'</ul>'}
  if(s.t==='sort')return (s.intro||'')+stem+'<p class="cats"><b>Categories:</b> '+s.b.map(function(b,i){return '<span>'+L[i]+'. '+b.l+'</span>'}).join(' ')+'</p>'+
    '<p class="note">Write the letter of the right category next to each item.</p><ol class="pq sortq">'+s.i.map(function(it){return '<li><span class="blank sm"></span> '+it.x+'</li>'}).join('')+'</ol>';
  if(s.t==='dd')return (s.q?stem:'')+'<p>'+s.s.replace(/\{(\d+)\}/g,function(m,i){return '<span class="blank"></span> <span class="note">('+s.f[+i].o.map(esc).join(' / ')+')</span>'})+'</p>';
  if(s.t==='order'){var n=s.i.length,sh=s.i.map(function(x,i){return i}).sort(function(a,c){return ((a*31+7)%n)-((c*31+7)%n)});if(sh.every(function(v,i){return v===i}))sh.reverse();
    return stem+'<p class="note">Number the steps in the correct order.</p><ul class="pq">'+sh.map(function(i){return '<li><span class="blank sm"></span> '+s.i[i]+'</li>'}).join('')+'</ul>'}
  return stem;
}
function treeHTML(n,id,depth){var nd=n[id];if(!nd||depth>8)return '';if(nd.r)return '<div class="res">'+nd.r+'</div>';
  return '<div><b>'+nd.q+'</b><ul>'+nd.o.map(function(o){return '<li>'+o[0]+' → '+treeHTML(n,o[1],depth+1)+'</li>'}).join('')+'</ul></div>'}
var prevTheme=null;
/* ---------- printed handout: real pages, laid out here (not by the browser), so every device prints the same ----------
   Each A4 page (portrait or landscape) carries the academy's identity at the top, the reader's details and the page number
   at the bottom; a multi-topic handout opens with a cover and a contents list with page numbers. Content flows topic by topic:
   a topic starts on the same page when enough room is left, tables continue on the next page with their header row repeated,
   lists continue with their numbering, headings never end a page, and nothing is cut. */
var CF=ST.CONFIG||{},PART=CF.part||'Part 1',SECT=CF.section||'Section A',SECT_T=CF.sectionTitle||'External Financial Reporting Decisions';
var BRAND='START TIME — ASHRAF FATHY · CMA '+PART+' · '+SECT;
/* a mobile written in groups that stay together on one line: +966 5x xxx xxxx · +20 1xx xxx xxxx · others in threes */
function fmtMobile(m){m=String(m||'').replace(/[\s-]/g,'');
  /* the sheet often drops the + (a number cell) or keeps a local form: 9665…/05…/5… → +9665…, 201…/01… → +201…, 00… → + */
  m=m.replace(/^00/,'+');if(/^9665\d{8}$/.test(m)||/^201\d{9}$/.test(m))m='+'+m;else if(/^05\d{8}$/.test(m))m='+966'+m.slice(1);else if(/^5\d{8}$/.test(m))m='+966'+m;else if(/^01\d{9}$/.test(m))m='+20'+m.slice(1);else if(/^\d{9,15}$/.test(m))m='+'+m;var NB='\u00a0',g=function(cc,n,sz){var o=[],i=0;sz.forEach(function(k){if(i<n.length){o.push(n.slice(i,i+k));i+=k}});if(i<n.length)o.push(n.slice(i));return cc.replace('+','')+NB+o.join(NB)};   // country code without the + (his choice: saves room in the footer)
  if(/^\+9665\d{8}$/.test(m))return g('+966',m.slice(4),[2,3,4]);if(/^\+201\d{9}$/.test(m))return g('+20',m.slice(3),[3,3,4]);
  var x=m.match(/^(\+\d{1,3})(\d{6,12})$/);return x?g(x[1],x[2],[3,3,3,3]):m}
function printWho(){var s=ST.session&&ST.session();if(!s)return {line:'',student:false,name:''};
  var p=s.perms||{},stu=s.role==='student',has=function(k,d){return Object.prototype.hasOwnProperty.call(p,k)?!!p[k]:d};
  var parts=[has('printName',true)?s.name:'',has('printEmail',stu)?s.email:'',has('printMobile',stu)?fmtMobile(s.mobile):''].map(function(x){return String(x||'').trim()}).filter(String);
  return {line:parts.join(' · '),student:stu,name:has('printName',true)?String(s.name||'').trim():'',
    parts:{name:has('printName',true)?String(s.name||'').trim():'',email:has('printEmail',stu)?String(s.email||'').trim():'',mobile:has('printMobile',stu)?fmtMobile(s.mobile):''}}}   // for the Header & Footer tab (assets/hf.js)
/* the footer stays on one line: when name · email · mobile is too long for the page width, its font gets smaller (down to 6pt) so nothing is cut */
function fitFeet(root){$$('.sh-foot',root).forEach(function(f){var w=$('.sh-who',f);if(!w)return;var fs=9,pc=$('.sh-pc',f);w.style.fontSize='';
  var over=function(){return w.scrollWidth>w.clientWidth+1||f.scrollWidth>f.clientWidth+1};
  while(over()&&fs>7){fs-=0.5;w.style.fontSize=fs+'pt'}
  if(over()&&pc)pc.textContent='Personal copy';                                   // then the shorter label
  if(over())w.textContent=w.textContent.replace(/^(Prepared for|Printed by) /,'');  // then without the opening words
  while(over()&&fs>6){fs-=0.5;w.style.fontSize=fs+'pt'}
  var pn=$('.pn',f);if(over()&&pn)pn.textContent=pn.textContent.replace(/^[\d\/: ]+ · /,'')})}                  // last: the page number without the date (the date is on the cover)
function today(){var d=new Date();return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear()}
/* no forced paper size: the print window decides the orientation, and the matching set of pages prints (see .sheets.p / .sheets.l) */
function setPage(o){var st=document.getElementById('pageSz');if(!st){st=document.createElement('style');st.id='pageSz';document.head.appendChild(st)}
  st.textContent='@media print{@page{size:A4 '+(o==='l'?'landscape':'portrait')+';margin:0}}'}   // the pages are built on A4: ask the print window for A4 in the layout on screen, so a Letter default can't shrink or split them
/* accounts without the print permission get a blank page with a note (Ctrl+P / browser menu included) */
window.addEventListener('beforeprint',function(){document.documentElement.classList.toggle('noprint',!ST.can('print'))});

/* --- the page maker --- */
var ATOM=/(^|\s)(call|mini|kv|big-eq|diagw|ctl|pk-h|cmp|fs|qc)(\s|$)/;   // side-by-side and boxed blocks stay whole unless very tall
function kidsBox(e){return e.tagName==='TABLE'?e.tBodies[0]:e}
function textKids(e){for(var n=e.firstChild;n;n=n.nextSibling)if(n.nodeType===3&&n.nodeValue.trim())return true;return false}
function Pager(host,land,chrome){this.host=host;this.land=land;this.chrome=chrome;this.pages=[];this.run=null}
Pager.prototype.newPage=function(){var sh=el('div','sheet'+(this.land?' land':''));this.host.appendChild(sh);this.body=this.chrome(sh,this.run);this.pages.push(sh);return this.body};
Pager.prototype.fits=function(){return this.body.scrollHeight<=this.body.clientHeight+1};
Pager.prototype.left=function(){var b=this.body,l=b.lastElementChild;if(!l)return b.clientHeight;return b.clientHeight-(l.getBoundingClientRect().bottom-b.getBoundingClientRect().top)};
Pager.prototype.canSplit=function(e,h){
  if(e.tagName==='TABLE')return !!e.tBodies[0]&&e.tBodies[0].rows.length>=3;
  if(e.tagName==='OL'||e.tagName==='UL')return e.children.length>=3;
  if(/^(P|H[1-6]|IMG|SVG|svg|PRE|TR|LI|SUMMARY|FIGURE)$/.test(e.tagName))return false;
  if(textKids(e))return false;
  var n=e.children.length;if(!n)return false;
  var hh=(h!=null?h:e.getBoundingClientRect().height);
  if(/(^|\s)pk-sol(\s|$)/.test(e.className||'')&&hh<this.body.clientHeight*0.9)return false;   // an answer and its explanation stay together unless taller than a page
  if(ATOM.test(e.className||'')&&hh<this.body.clientHeight*0.45)return false;   // boxes stay whole unless very tall
  return n>=2||this.canSplit(e.children[0])};
/* put b into target; if it does not all fit, put as much as fits and return what is left (null = all placed) */
Pager.prototype.fill=function(b,target){
  target.appendChild(b);if(this.fits())return null;
  var hb=b.getBoundingClientRect().height;target.removeChild(b);
  if(!this.canSplit(b,hb))return b;
  var rows=b.tagName==='TABLE'||b.tagName==='OL'||b.tagName==='UL',shell=b.cloneNode(false),src=kidsBox(b),box,moved=0,min=rows?2:1;
  if(b.tagName==='TABLE'){if(b.tHead)shell.appendChild(b.tHead.cloneNode(true));box=document.createElement('tbody');shell.appendChild(box)}else box=shell;
  target.appendChild(shell);
  while(src.firstElementChild){var k=src.firstElementChild;box.appendChild(k);
    if(this.fits()){moved++;continue}
    var hk=k.getBoundingClientRect().height;box.removeChild(k);
    if((rows?moved>=min:true)&&this.canSplit(k,hk)){                      // a wrapper may split its first child
      var before=box.children.length,r=this.fill(k,box);
      if(r)src.insertBefore(r,src.firstElementChild);                   // what is left of it waits for the next page
      if(box.children.length>before){moved++;if(!r)continue}
    }else src.insertBefore(k,src.firstElementChild);
    break}
  if(moved<min){while(box.lastElementChild)src.insertBefore(box.lastElementChild,src.firstElementChild);target.removeChild(shell);return b}
  if(b.tagName==='OL'){var st=+(b.getAttribute('start')||1);shell.setAttribute('start',st);b.setAttribute('start',st+box.children.length)}
  b.classList.add('cont-part');
  return src.firstElementChild?b:null};
/* a block that cannot fit even on an empty page and cannot be split is scaled down to fit */
Pager.prototype.squeeze=function(e,target){target.appendChild(e);if(this.fits())return;
  var h=e.getBoundingClientRect().height,over=this.body.scrollHeight-this.body.clientHeight;e.style.zoom=Math.max(.5,(h-over-4)/h)};
Pager.prototype.isKeeper=function(e){return !!e&&(/^H[2-5]$/.test(e.tagName)||(e.classList&&(e.classList.contains('pk-h')||e.classList.contains('pv-th'))))};
Pager.prototype.topic=function(head,run){
  this.run=run;
  if(!this.body||(this.body.firstElementChild&&this.left()<this.body.clientHeight*0.33))this.newPage();
  this.body.appendChild(head);if(!this.fits()){this.body.removeChild(head);this.newPage();this.body.appendChild(head)}
  return this.pages.length};
Pager.prototype.slide=function(head,blocks,cls){
  var frag=el('section',cls),sb=el('div','sb'),me=this,defer=[];if(head)frag.appendChild(head);frag.appendChild(sb);
  if(!this.body)this.newPage();
  this.body.appendChild(frag);if(!this.fits()){this.body.removeChild(frag);var tk=this.trail();this.newPage();if(tk)this.body.appendChild(tk);this.body.appendChild(frag)}
  /* a picture waiting for the next page goes first on it (squeezed a little only if taller than the page) */
  function flush(){while(defer.length){var d=defer.shift();sb.appendChild(d);if(!me.fits()){sb.removeChild(d);me.squeeze(d,sb)}}}
  function next(){var keep=[];while(sb.lastElementChild&&sb.children.length>1&&me.isKeeper(sb.lastElementChild))keep.unshift(sb.removeChild(sb.lastElementChild));
    me.newPage();frag=el('section',cls+' cont');sb=el('div','sb');frag.appendChild(sb);me.body.appendChild(frag);keep.forEach(function(k){sb.appendChild(k)});flush()}
  for(var i=0;i<blocks.length;i++){var bk=blocks[i];
    if(isPic(bk)&&!defer.length){                                  // a picture: keep it whole; shrink it a little to use the space left, or let the text after it fill this page
      sb.appendChild(bk);if(this.fits())continue;var hp=bk.getBoundingClientRect().height;sb.removeChild(bk);var lf=this.left();
      if(lf>=hp*0.62){bk.style.zoom=Math.max(.62,(lf-4)/hp);sb.appendChild(bk);if(this.fits())continue;sb.removeChild(bk);bk.style.zoom=''}
      if(i<blocks.length-1&&lf>this.body.clientHeight*0.12&&blocks.slice(i+1).some(function(x){return !isPic(x)})){defer.push(bk);continue}}
    var rem=this.fill(bk,sb),guard=0;
    while(rem&&guard++<40){
      if((!sb.firstElementChild||light(sb))&&!defer.length){        // nothing of this slide on the page yet (or only a short intro line): its heading moves too
        this.body.removeChild(frag);var tk2=this.trail();this.newPage();if(tk2)this.body.appendChild(tk2);this.body.appendChild(frag);
      }else next();
      var fresh=this.body.children.length===1&&sb.children.length===0;
      if(fresh){sb.appendChild(rem);var over=this.body.scrollHeight-this.body.clientHeight;sb.removeChild(rem);
        if(over<=0){sb.appendChild(rem);rem=null;break}
        if(over<this.body.clientHeight*0.12){this.squeeze(rem,sb);rem=null;break}}   // a little too tall for an empty page: shrink it slightly rather than leave a page almost empty
      rem=this.fill(rem,sb);
      if(rem&&fresh){this.squeeze(rem,sb);rem=null}
    }
  }
  while(defer.length){var d=defer[0];var r=this.fill(d,sb);if(!r){defer.shift();continue}next()}   // pictures still waiting: after the text, on this page if they fit, else on the next
};
function light(sb){var h=0;for(var i=0;i<sb.children.length;i++){var c=sb.children[i];if(c.tagName!=='P')return false;h+=c.getBoundingClientRect().height}return h<70}   // only an intro paragraph so far
function isPic(e){return !!e&&(e.tagName==='FIGURE'||/(^|\s)(anm|scene|fig|quad|months)(\s|$)/.test(e.className||''))}   // a grid figure (quad) prints whole on one page (owner 26 Oct 02:33)
/* a topic heading left alone at the bottom of a page goes with what follows */
Pager.prototype.trail=function(){var l=this.body&&this.body.lastElementChild;if(l&&l.classList.contains('pv-th')){this.body.removeChild(l);return l}return null};

function sheetChrome(who,stu,wm,pw){return function(sh,run){
  if(ST.HF&&ST.HF.on()){                                                // the owner changed the Header & Footer tab
    sh.innerHTML=ST.HF.printHead(PART,SECT,run)+'<div class="sh-body"></div>'+ST.HF.printFoot(pw&&pw.parts||{},stu)+
      (wm?'<div class="sh-wm" aria-hidden="true"><span>START TIME · '+esc(wm)+'</span></div>':'');
    return $('.sh-body',sh)}
  sh.innerHTML='<header class="sh-head"><div class="sh-logo">ST</div><div class="sh-brand"><b>START TIME ACADEMY</b><span>ASHRAF FATHY · CMA '+esc(PART)+' · '+esc(SECT)+'</span></div>'+
    '<div class="sh-run">'+(run?'<small>'+esc(run.k)+'</small>'+esc(run.n):'')+'</div></header><div class="sh-body"></div>'+
    '<footer class="sh-foot"><span class="sh-who">'+esc(who)+'</span>'+(stu?'<span class="sh-pc">Personal copy — not for sharing</span>':'')+'<span class="pn" data-d="'+today()+'"></span></footer>'+
    (wm?'<div class="sh-wm" aria-hidden="true"><span>START TIME · '+esc(wm)+'</span></div>':'');
  return $('.sh-body',sh)}}

/* slide content → printable blocks */
function slideBlocks(s,i,n,prac,id){
  var body=el('div','sb');
  try{
    if(prac){var tc=ST.byId[id],cz=s.case&&tc&&tc.cases&&tc.cases[s.case];body.innerHTML=(cz?'<p class="note case-ref">Uses the case: <b>'+cz.h+'</b> (printed with the case slide).</p>':'')+staticQ(s)}
    else if(s.t==='trace')body.innerHTML=(s.intro||'')+(s.print||'<p class="note">This tracer is interactive. Its result: every transaction touches at least two statements, and the slides before it show each path.</p>');
    else if(s.t==='tree')body.innerHTML=(s.intro||'')+treeHTML(s.n,'start',0);
    else if(s.t==='lab')body.innerHTML=(s.body||'')+labPrint(s);
    else (ST.R[s.t]||ST.R.x)(body,s,'print#'+id+'#'+i);
  }catch(e){body.innerHTML='<p class="note">This slide is interactive; its points are covered in the explanation and the Check yourself items.</p>'}
  /* the case slide prints the full case data (tables and text) before its questions; the questions only point to it */
  if(!prac&&s.t==='x'&&!s.lesson){var tc2=ST.byId[id],ck=s.case,sl=tc2&&tc2.slides;
    if(!ck&&sl){var ix=sl.indexOf(s);if(ix>=0&&sl[ix+1]&&sl[ix+1].case)ck=sl[ix+1].case}   // the case slide may sit just before its first question without a case field itself
    var cz2=ck&&tc2&&tc2.cases&&tc2.cases[ck];
    if(cz2&&cz2.body){var plain=function(h){return String(h).replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/g,' ').replace(/\s+/g,' ').trim()};
      if(plain(body.innerHTML).indexOf(plain(cz2.body).slice(0,80))<0){var cd=el('div','case-print');cd.innerHTML='<p class="note"><b>Case data</b> — '+esc(cz2.h)+'</p>'+cz2.body;body.appendChild(cd)}}}
  tidy(body);return body}
/* an interactive tool on paper: the author's static result (s.print) if given; otherwise the game renders its finished result (ST.fun.PRINT); otherwise one neutral line */
function labPrint(s){
  if(s.print)return s.print;
  var d=el('div','lab-print');
  if(s.run&&ST.fun){ST.fun.PRINT=true;try{s.run(d)}catch(e){d.innerHTML=''}ST.fun.PRINT=false;
    $$('button, input, select',d).forEach(function(b){if(b.tagName==='BUTTON')b.parentNode.removeChild(b);else{var v=el('b','lab-v',b.value||'');b.parentNode.replaceChild(v,b)}});
    if(d.textContent.trim())return d.outerHTML}
  return '<p class="note">This exercise is interactive and is not printed. Its points are covered in the explanation and in the Check yourself items.</p>'}
function tidy(root){
  (function walk(n){for(var c=n.firstChild;c;c=c.nextSibling){if(c.nodeType===3){if(/Play the /.test(c.nodeValue))c.nodeValue=c.nodeValue.replace(/Play the (opening |next |first |whole )?picture/g,'Look at the $1picture').replace(/Play the (opening |next |first |whole )?animation/g,'Look at the $1picture')}else if(c.nodeType===1&&!/^(SCRIPT|STYLE|svg)$/i.test(c.tagName))walk(c)}})(root);
  $$('details',root).forEach(function(d){var w=el('div','rv'),sm=d.querySelector('summary');if(sm)w.appendChild(el('div','rv-s',sm.innerHTML));
    Array.prototype.slice.call(d.childNodes).forEach(function(n){if(n!==sm)w.appendChild(n)});d.parentNode.replaceChild(w,d)});
  $$('table',root).forEach(function(tb){if(tb.tHead)return;var hd=document.createElement('thead');
    while(tb.rows.length&&!$$('td',tb.rows[0]).length&&!hd.rows.length)hd.appendChild(tb.rows[0]);
    if(hd.rows.length)tb.insertBefore(hd,tb.firstChild)});
  $$('button.qc-o',root).forEach(function(b){var d=el('div','qc-o',b.innerHTML);b.parentNode.replaceChild(d,b)});   // quick-check options stay on paper
  $$('input,select,textarea,button',root).forEach(function(x){if(x.tagName==='BUTTON')x.remove()})}
function kids(e){return Array.prototype.slice.call(e.children)}

ST.printView=function(tidList){
  var app=$('#app'),ids=String(tidList||'').split(',').filter(function(id){var x=ST.byId[id];return x&&!x.soon&&!(ST.lock&&ST.lock(x))});   // only topics open for this student
  if(!ids.length||!ST.can('print')){location.hash='#/';return}
  var q=(location.hash.split('?')[1]||''),qp=function(k){var m=q.match(new RegExp('(?:^|&)'+k+'=([^&]*)'));return m?decodeURIComponent(m[1]):''};
  var style=qp('style')==='color'?'color':'clean',ans=ST.can('answerKey')&&qp('ans')!=='0',land=qp('o')==='l';
  /* k = what is included, any mix of s (scenarios and stories) · c (explanations) · p (practice questions); g alone = the glossary only.
     Older links: a = everything (cp), c, p, s, g. */
  var K=String(qp('k')||'a').replace(/[^scpga]/g,'');if(!K||K.indexOf('a')>=0)K='cp';
  if(!ST.can('printStory'))K=K.replace('s','');if(!K)K='cp';
  var kind=K==='g'?'g':K.replace('g','')||'cp',hasC=kind.indexOf('c')>=0,hasP=kind.indexOf('p')>=0,hasS=kind.indexOf('s')>=0;
  var glP=ST.can('glossPrint')&&(kind==='g'||qp('g')==='1');if(kind==='g'&&!glP){kind='cp';hasC=hasP=true}if(kind==='g'||!hasP)ans=false;
  var wants=function(s){var pr=ST.isPractice(s)&&s.t!=='trace';return pr?hasP:(hasC||(hasS&&ST.hasStory(s)))};
  if(kind!=='g'){ids=ids.filter(function(id){return ST.byId[id].slides.some(wants)});                 // a topic with nothing of what was ticked is left out
    if(!ids.length){app.innerHTML='<div class="fb"><b>Nothing of what you ticked is in the chosen topics.</b> <a href="#/">Back</a></div>';return}}
  var only=ids.length===1&&qp('s')?qp('s').split('.').map(Number):null;
  setPage();
  var root=document.documentElement;
  if(prevTheme===null)prevTheme=root.getAttribute('data-theme')||'';
  root.classList.add('printing');root.classList.toggle('pcolor',style==='color');root.classList.toggle('pclean',style==='clean');
  root.setAttribute('data-theme','light');
  app.innerHTML='';
  var parts=[];if(hasS&&!hasC)parts.push('Scenarios and stories');if(hasC)parts.push('Explanations');if(hasP)parts.push('Practice questions');
  var what=(kind==='g'?'Glossary only':(hasC&&hasP?'Everything':parts.join(' + ')+(parts.length===1?' only':''))+(glP?' · with the glossary':''))+(only&&kind!=='g'?' · slides '+only.join(', '):'');
  var bar=el('div','prt-bar');
  bar.innerHTML='<a class="btn" href="#/t/'+ids[0]+'/1">← Back to the deck</a><button class="btn pri" id="pPrint" disabled>Print / save as PDF</button>'+
    '<div class="seg" role="group" aria-label="Preview"><button type="button" data-o="p">Portrait</button><button type="button" data-o="l">Landscape</button></div>'+
    '<button class="btn" id="pEdit">Change selection</button>'+(ST.can('excel')&&(hasC||hasP)?'<button class="btn" id="pXls">Excel — all tables</button>':'')+
    '<span class="note" id="pStat">Preparing the pages…</span>'+
    '<p class="note prt-tip">'+ids.length+' topic'+(ids.length>1?'s':'')+' · '+what+' · '+(style==='clean'?'clean style':'screen colours')+(ans?' · with answer key':'')+
    '. The layout chosen here (Portrait / Landscape) is the one that prints, on A4. <b>For a PDF file, choose «Save as PDF» as the destination in the print window</b> — it keeps A4 and the layout exactly. On a printer, keep the scale at <b>100%</b>; Letter paper also fits.</p>';
  app.appendChild(bar);
  $('#pEdit').onclick=function(){printDialog(ST.byId[ids[0]])};
  var multi=ids.length>1,groups=[],pw=printWho(),stat=$('#pStat',bar);
  var who=pw.line?(pw.student?'Prepared for ':'Printed by ')+pw.line:'START TIME ACADEMY — ASHRAF FATHY';
  /* one complete set of pages for one orientation */
  function build(isLand,first){
    var host=el('div','sheets '+(isLand?'l':'p')+' building');app.appendChild(host);
    var P=new Pager(host,isLand,sheetChrome(who,pw.student,pw.student?(pw.name||''):'',pw)),tp={},cover=null,keys=[];
    if(multi){cover=el('div','sheet cover'+(isLand?' land':''));host.appendChild(cover);P.pages.push(cover);
      cover.innerHTML='<div class="cv-band"><div class="cv-logo">ST</div><div><b>START TIME ACADEMY</b><span>ASHRAF FATHY</span></div></div>'+
        '<div class="cv-main"><div class="cv-kick">CMA® '+esc(PART.toUpperCase())+' · '+esc(SECT.toUpperCase())+'</div><h1>'+esc(SECT_T)+'</h1>'+
        '<p class="cv-sub">Study handout · '+ids.length+' topics · '+esc(what.toLowerCase())+(ans?' · with answer key':'')+'</p>'+
        (pw.line?'<div class="cv-who">'+(pw.student?'Prepared for':'Printed by')+' <b>'+esc(pw.line)+'</b> · '+today()+'</div>':'')+
        '<div class="cv-h">Contents</div><ol class="cv-toc">'+(kind==='g'?'':ids.map(function(id){var t=ST.byId[id];return '<li><span class="g">'+esc(t.group)+'</span><span class="t">'+esc(t.n)+'</span><span class="p" data-p="'+id+'"></span></li>'}).join(''))+
        (ans?'<li><span class="g">✓</span><span class="t">Answer key</span><span class="p" data-p="__key"></span></li>':'')+
        (glP?'<li><span class="g">A–Z</span><span class="t">Glossary</span><span class="p" data-p="__gl"></span></li>':'')+'</ol></div>'+
        '<div class="cv-foot"><span>Original START TIME study material. Not affiliated with IMA; CMA® is a registered trademark of the Institute of Management Accountants.'+(pw.student?' <b>Personal copy — not for sharing.</b>':'')+'</span><span class="pn" data-d="'+today()+'"></span></div>';
      var cm=$('.cv-main',cover),over=function(){return cm.scrollHeight>cm.clientHeight+1};if(over())cover.classList.add('toc2');if(over())cover.classList.add('toc3')}   // a long contents list goes to two columns, then smaller
    var chain=Promise.resolve();
    if(kind!=='g')ids.forEach(function(id,ti){chain=chain.then(function(){
      var t=ST.byId[id],n=0,tk=[];stat.textContent='Preparing the '+(isLand?'landscape':'portrait')+' pages… topic '+(ti+1)+' of '+ids.length;
      var th=el('div','pv-th','<div class="kick">'+esc(t.group)+' · '+esc(t.sub||'')+(multi?' · Topic '+(ti+1)+' of '+ids.length:'')+'</div><h1>'+esc(t.n)+'</h1><div class="chips">'+t.los.map(function(c){return '<span class="chip g">LOS '+c+'</span>'}).join('')+'</div>');
      tp[id]=P.topic(th,{k:t.group+' · '+(t.sub||''),n:t.n});
      t.slides.forEach(function(s,i){
        var prac=ST.isPractice(s)&&s.t!=='trace';if(prac)n++;
        if(only&&only.indexOf(i+1)<0)return;
        if(!prac&&!hasC){if(!hasS||!ST.hasStory(s))return;   // stories without the explanations: the Scenario slide whole; from any other slide only its story lines
          var sc=ST.isScenario(s),sh=el('div','ps-hd','<div class="s-meta"><span class="s-kind">'+(i+1)+' · '+(sc?'SCENARIO':'STORY')+'</span><span class="chips">'+ST.losChip(s)+'</span></div>'+(s.h?'<h2>'+s.h+'</h2>':'')),sb=slideBlocks(s,i,n,false,id);
          if(!sc){var keep=el('div','sb');$$('.story',sb).forEach(function(p){if(!p.closest('.case-print'))keep.appendChild(p.cloneNode(true))});if(!keep.children.length)return;sb=keep}
          P.slide(sh,kids(sb),'ps');return}
        if(prac&&!hasP)return;
        if(s.cy&&ST.qcMode&&ST.qcMode()==='below')return;   // the student prints the quick checks under their slides: the gathering slide is not needed on paper
        var bk=t.nB&&i>=t.nL,head=el('div','ps-hd','<div class="s-meta"><span class="s-kind">'+(bk?'B'+(i-t.nL+1):i+1)+' · '+(prac?(bk?'QUESTION BANK ':'PRACTICE ')+n:(s.t==='x'?'CONCEPT':'INTERACTIVE'))+'</span><span class="chips">'+ST.losChip(s)+'</span></div>'+(s.h?'<h2>'+s.h+'</h2>':''));
        var body=slideBlocks(s,i,n,prac,id);if(ST.glFill&&body.querySelector&&body.querySelector('.gl-ar'))ST.glFill(body);
        if(first){var tabs=$$('table.t',body);if(tabs.length)groups.push({h:(multi?t.n+' — ':'')+(i+1)+' '+strip(s.h||''),tables:tabs.map(function(x){return x.cloneNode(true)})})}
        if(prac)tk.push({i:i,n:n,s:s});
        P.slide(head,kids(body),'ps')});
      if(tk.length)keys.push({t:t,k:tk});
      return new Promise(function(r){setTimeout(r,0)})})});
    return chain.then(function(){
      if(ans&&keys.length){
        var kt=keys[0].t,krun=multi?{k:SECT,n:SECT_T}:{k:kt.group+' · '+(kt.sub||''),n:kt.n};   // the running header keeps the topic (or section) name; "Answer key" is printed once, in the title block
        tp.__key=P.topic(el('div','pv-th','<div class="kick">Answer key</div><h1>Answers and explanations</h1>'),krun);
        keys.forEach(function(g){g.k.forEach(function(x,j){var sol=el('div','pk-sol');sol.innerHTML=solHTML(x.s);tidy(sol);
          var hd=el('div','pk-hd',(multi&&j===0?'<div class="pk-t">'+esc(g.t.n)+'</div>':'')+'<h3>Practice '+x.n+' (slide '+(g.t.nB&&x.i>=g.t.nL?'B'+(x.i-g.t.nL+1):x.i+1)+')'+(x.s.h?' — '+x.s.h:'')+'</h3>');
          P.slide(hd,[sol],'ps pk')})})}
      if(glP){var gr=ST.glRows(ids);
        if(gr.length){
          tp.__gl=P.topic(el('div','pv-th','<div class="kick">Glossary</div><h1>Key terms, A to Z</h1>'),{k:'Glossary',n:'Key terms, A to Z'});
          var L0='',rowsH='';
          gr.forEach(function(r){var L=(r.k.match(/[a-z0-9]/)||['#'])[0].toUpperCase();if(/[0-9]/.test(L))L='#';
            if(L!==L0){L0=L;rowsH+='<tr class="gl-let"><td colspan="'+(multi?4:3)+'">'+L+'</td></tr>'}
            rowsH+='<tr><td><b>'+r.en+'</b></td><td class="gl-pa" dir="rtl" lang="ar">'+esc(ST.glAr(r.k))+'</td><td>'+r.m+(r.w?'<div class="gl-pw">'+r.w+'</div>':'')+'</td>'+(multi?'<td class="gl-pt">'+r.t.map(function(t){return esc(t.n)}).join('; ')+'</td>':'')+'</tr>'});
          var gb=el('div');gb.innerHTML='<table class="t gl gl-print'+(multi?' gl-m':'')+'"><thead><tr><th>Term</th><th>بالعربي</th><th>What it means</th>'+(multi?'<th>Topic</th>':'')+'</tr></thead><tbody>'+rowsH+'</tbody></table>';
          P.slide(el('div','pk-hd','<h3>'+gr.length+' key term'+(gr.length===1?'':'s')+(multi?' from '+ids.length+' topics':'')+'</h3>'),kids(gb),'ps')}}
      var N=P.pages.length;
      var hfOn=ST.HF&&ST.HF.on();
      P.pages.forEach(function(pg,i){var pn=$('.pn',pg);if(pn)pn.textContent=hfOn?ST.HF.pageText(pn.dataset.d||'',i+1,N):(pn.dataset.d?pn.dataset.d+' · ':'')+'Page '+(i+1)+' of '+N});
      if(hfOn){ST.HF.cover(cover);ST.HF.fillQR(host)}
      fitFeet(host);
      if(cover)$$('[data-p]',cover).forEach(function(x){x.textContent=tp[x.dataset.p]||''});
      host.classList.remove('building');host.dataset.n=N;return host})}
  var hosts={},want=land?'l':'p';
  function show(o){want=o;setPage(o);root.classList.toggle('pr-l',o==='l');root.classList.toggle('pr-p',o!=='l');['p','l'].forEach(function(k){if(hosts[k])hosts[k].classList.toggle('off',k!==o)});
    $$('[data-o]',bar).forEach(function(b){b.classList.toggle('on',b.dataset.o===o)});
    var h=hosts[o];if(h){h.style.setProperty('--pvz',1);var w=h.firstElementChild?h.firstElementChild.getBoundingClientRect().width:0,a=app.clientWidth||window.innerWidth;h.style.setProperty('--pvz',w?Math.min(1,(a-8)/w):1)}
    try{history.replaceState(null,'',location.hash.replace(/([?&])o=[pl]/,'$1').replace(/[?&]$/,'')+(o==='l'?(location.hash.indexOf('?')<0?'?':'&')+'o=l':''))}catch(e){}
    if(hosts.p&&hosts.l)stat.textContent=hosts[o].dataset.n+' pages in '+(o==='l'?'landscape':'portrait')+' (the other layout: '+hosts[o==='l'?'p':'l'].dataset.n+')'}
  $$('[data-o]',bar).forEach(function(b){b.onclick=function(){show(b.dataset.o)}});
  (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(function(){
    return (glP||ST.can('glossAr'))&&ST.glLoad?ST.glLoad():null}).then(function(){   // the Arabic of the key terms is in place before the pages are measured
    return build(land,true).then(function(h){hosts[land?'l':'p']=h;show(want);return build(!land,false)}).then(function(h){
      hosts[land?'p':'l']=h;show(want);
      var pb=$('#pPrint',bar);pb.disabled=false;
      pb.onclick=function(){['p','l'].forEach(function(k){hosts[k].style.setProperty('--pvz',1)});window.print()};
      var fit=function(){show(want)};window.addEventListener('resize',fit);window.addEventListener('afterprint',fit)})
  }).catch(function(e){stat.textContent='Could not prepare the pages: '+(e&&e.message||e)});
  if($('#pXls',bar))$('#pXls',bar).onclick=function(){if(!groups.length){ST.modal('Export to Excel','<p>No tables in this selection.</p>');return}
    exportTables(groups,multi?SECT+' handout':ST.byId[ids[0]].n,multi?'handout-'+ids.length+'-topics':ids[0])};
  window.scrollTo(0,0);
};
window.addEventListener('hashchange',function(){if(!/^#\/print\//.test(location.hash)){var r=document.documentElement;if(r.classList.contains('printing')){r.classList.remove('printing','pr-l','pr-p','pcolor','pclean');var ps=document.getElementById('pageSz');if(ps)ps.textContent='';r.setAttribute('data-theme',prevTheme==='dark'?'dark':'light');prevTheme=null}}});

/* ---------- Excel export (ExcelJS, loaded only when needed) ---------- */
var xlP=null;
function loadXL(){if(window.ExcelJS)return Promise.resolve(window.ExcelJS);if(xlP)return xlP;
  xlP=new Promise(function(res,rej){var sc=document.createElement('script');sc.src=XLSX_URL;sc.onload=function(){res(window.ExcelJS)};sc.onerror=function(){xlP=null;rej(new Error('Could not load the Excel library — check the internet connection.'))};document.head.appendChild(sc)});return xlP}
function cellText(c){var t=(c.innerText||c.textContent||'').replace(/ /g,' ').replace(/[ \t]+/g,' ').replace(/\n\s*/g,' ').trim();return t}
function parseNum(t){
  if(t==='–'||t==='-'||t==='—')return {v:0,f:'n'};
  var m=t.replace(/\s/g,'').match(/^([+−\-])?\(?([+−\-])?(\$)?([\d,]+(?:\.\d+)?)\)?(%)?$/);
  if(!m)return null;
  var v=parseFloat(m[4].replace(/,/g,''));if(isNaN(v))return null;
  if(/^\(.*\)$/.test(t.replace(/\s/g,'').replace(/^[+−\-]/,''))||m[1]==='−'||m[1]==='-'||m[2]==='−'||m[2]==='-')v=-v;
  return m[5]?{v:v/100,f:'p'}:{v:v,f:'n',cur:m[3]?'$':''};
}
/* a variance written the CMA way: "15,000 F" (favorable) or "2,000 U" (unfavorable) */
function parseFU(t){var m=String(t||'').replace(/\s+/g,' ').trim().match(/^\$?([\d,]+(?:\.\d+)?) ?(F|U)$/);if(!m)return null;var n=parseFloat(m[1].replace(/,/g,''));return isNaN(n)?null:{n:n,s:m[2]==='F'?1:-1}}
function grid(tbl){
  var rows=[],occ=[];
  $$('tr',tbl).forEach(function(tr,ri){var r=[],xs=[],ci=0,hdr=true,span=false;occ[ri]=occ[ri]||[];
    $$('th,td',tr).forEach(function(c){while(occ[ri][ci])ci++;var cs=+c.getAttribute('colspan')||1,rs=+c.getAttribute('rowspan')||1;if(cs>1)span=true;if(c.tagName!=='TH')hdr=false;
      var tx=cellText(c);r[ci]=tx;if(c.getAttribute('data-x'))xs[ci]=c.getAttribute('data-x');for(var k=1;k<cs;k++)r[ci+k]=hdr?{g:tx}:'';for(var j=1;j<rs;j++){occ[ri+j]=occ[ri+j]||[];occ[ri+j][ci]=1}ci+=cs});
    rows.push({c:r,x:xs,hdr:hdr,span:span,cls:tr.className||''})});
  /* fold a spanning header row (group labels) into the header row below it — no merged cells */
  var out=[];
  for(var i=0;i<rows.length;i++){var r=rows[i],nx=rows[i+1];
    if(r.hdr&&r.span&&nx&&nx.hdr){var g='';nx.c=nx.c.map(function(v,k){var gv=r.c[k];if(gv&&typeof gv==='object')gv=gv.g;if(gv)g=gv;return (gv&&gv!==v?gv+' — ':'')+(v||'')});continue}
    r.c=r.c.map(function(v){return v&&typeof v==='object'?'':v});out.push(r)}
  return out;
}
function sheetName(s,used){s=s.replace(/[\[\]\:\*\?\/\\]/g,' ').replace(/\s+/g,' ').trim().slice(0,28).replace(/^[\s']+|[\s']+$/g,'')||'Table';var n=s,k=2;while(used[n.toLowerCase()])n=s.slice(0,26)+' ('+(k++)+')';used[n.toLowerCase()]=1;return n}
/* ---------- live formulas: a figure becomes a formula only if the formula gives the slide's figure exactly ----------
   automatic: totals (rows tot/tt/s or labelled Total/Net/Gross…) = sum of the run above, first minus the rest,
   or the unused totals above; a "Total" column = the other figures in its row.
   authored: <td data-x="=-20%*{-1}"> — {dr} = same column dr rows away, {dr,dc} = dr rows and dc columns away. */
function colL(i){var s='',n=i+1;while(n>0){var m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s}
var TOTC=/\b(tot|tt|s)\b/,TOTL=/^(=|total|net |gross |sub-?total|balance at|cash at|ending )/i;
function near(a,b){return Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b))}
function lnorm(t){return String(t||'').replace(/\s+/g,' ').trim().toLowerCase()}
/* the value of an authored formula once its cells are replaced by numbers: + − × ÷ ( ) % and ROUND only */
function arith(js){if(!/^[\d\s+\-*\/().%,eE]*$/.test(js.replace(/ROUND|SUM/g,'')))return null;
  try{var v=Function('"use strict";function ROUND(a,b){var p=Math.pow(10,b||0);return Math.round(a*p)/p}function SUM(){var s=0;for(var i=0;i<arguments.length;i++)s+=arguments[i];return s}return ('+js.replace(/(\d+(?:\.\d+)?)%/g,'($1/100)')+')')();return isFinite(v)?v:null}catch(e){return null}}
var XREF=/\{(?:@([^}]+)|(-?\d+)(?:,(-?\d+))?)\}/g,XRANGE=/\{(-?\d+)(?:,(-?\d+))?\}:\{(-?\d+)(?:,(-?\d+))?\}/g;
function liveFormulas(rows,r0,L){
  var N=[],F={},used={},hd=[],cur=null;
  rows.forEach(function(r,ri){if(r.hdr)cur=r.c;hd[ri]=cur;
    N[ri]=r.c.map(function(v,ci){if(r.hdr||!ci)return null;var p=parseNum(v==null?'':String(v));return p?p.v:null})});
  function A(ri,ci){return colL(ci)+(r0+ri)}
  function isTot(ri){var r=rows[ri];return !r.hdr&&(TOTC.test(r.cls)||TOTL.test(String(r.c[0]||'').trim()))}
  function put(ri,ci,f,refs){F[ri+','+ci]={f:f,v:N[ri][ci],refs:refs};refs.forEach(function(p){used[p[0]+','+p[1]]=1})}
  /* 1. authored formulas */
  /* {dr} / {dr,dc}: a cell of this table counted from this one; {@Label}: the row with that label, here or in a table above on the same slide */
  rows.forEach(function(r,ri){(r.x||[]).forEach(function(x,ci){if(!x||N[ri][ci]==null)return;var refs=[],bad=false;
    var js=x.replace(/^=/,'').replace(XRANGE,function(_,a,b,c,d){var r1=ri+(+a),c1=ci+(+(b||0)),r2=ri+(+c),c2=ci+(+(d||0)),t=[];   /* {a}:{b} = the cells between, empty ones count 0 */
        for(var rr=Math.min(r1,r2);rr<=Math.max(r1,r2);rr++)for(var cc=Math.min(c1,c2);cc<=Math.max(c1,c2);cc++){var q=N[rr]&&N[rr][cc];
          if(q==null){var tx=rows[rr]&&rows[rr].c[cc];if(tx!=null&&String(tx).trim()!==''&&!rows[rr].hdr){bad=true;q=0}else q=0}else refs.push([rr,cc]);t.push('('+q+')')}
        return '('+(t.join('+')||'0')+')'}).replace(XREF,function(_,lab,dr,dc){
      if(lab){var e=L&&L[lnorm(lab)];if(!e||e.N[ci]==null){bad=true;return '0'}if(e.ri!=null)refs.push([e.ri,ci]);return '('+e.N[ci]+')'}
      var rr=ri+(+dr),cc=ci+(+(dc||0));if(!N[rr]||N[rr][cc]==null){bad=true;return '0'}refs.push([rr,cc]);return '('+N[rr][cc]+')'});
    var xl=x.replace(/^=/,'').replace(XRANGE,function(_,a,b,c,d){return A(ri+(+a),ci+(+(b||0)))+':'+A(ri+(+c),ci+(+(d||0)))})
      .replace(XREF,function(_,lab,dr,dc){return lab?colL(ci)+L[lnorm(lab)].row:A(ri+(+dr),ci+(+(dc||0)))});
    var v=bad?null:arith(js);if(v==null)return;
    if(near(v,N[ri][ci])||nearR(v,ri,ci))put(ri,ci,xl,refs);else if(window.console)console.warn('Excel formula does not give the slide figure:',x,v,N[ri][ci])})});
  /* 2. a "Total" column = the other figures in its row */
  rows.forEach(function(r,ri){var h=hd[ri];if(r.hdr||!h)return;var tc=[],oc=[];
    h.forEach(function(t,ci){if(ci&&N[ri][ci]!=null)(/\b(total|quarter)\b/i.test(String(t||''))?tc:oc).push(ci)});
    if(tc.length!==1||oc.length<2||F[ri+','+tc[0]])return;var s=0;oc.forEach(function(ci){s+=N[ri][ci]});
    if(near(s,N[ri][tc[0]]))put(ri,tc[0],oc.map(function(ci){return A(ri,ci)}).join('+'),oc.map(function(ci){return [ri,ci]}))});
  /* 2b. a column that is the product (or the quotient) of two other columns in every row of a block: Allowance = Receivables × Loss rate.
         At least two rows must agree and none may disagree; the slide's rounding is allowed, since the cell shows the same figure. */
  var nc0=0;rows.forEach(function(r){nc0=Math.max(nc0,r.c.length)});
  function dec(ri,ci){var t=String(rows[ri].c[ci]||''),d=((t.match(/\.(\d+)/)||[0,''])[1]).length;return /%\s*$/.test(t)?d+2:d}
  function nearR(x,ri,ci){var v=N[ri][ci];return near(x,v)||Math.abs(x-v)<=0.5*Math.pow(10,-dec(ri,ci))+1e-9}
  var blocks=[],cb=[];rows.forEach(function(r,ri){if(r.hdr){if(cb.length)blocks.push(cb);cb=[]}else if(!isTot(ri))cb.push(ri)});if(cb.length)blocks.push(cb);
  blocks.forEach(function(body){if(body.length<2)return;var role={};       /* the result is looked for from the right; its two columns become inputs (no circle) */
    for(var k=nc0-1;k>=1;k--){var done=false;if(role[k]||body.some(function(ri){return F[ri+','+k]}))continue;   /* a column with formulas of its own is left alone */
      for(var i=1;i<nc0&&!done;i++)for(var j=1;j<nc0&&!done;j++){if(i===k||j===k||i===j||role[i]==='out'&&role[j]==='out')continue;
        ['*','/','-'].forEach(function(op){if(done||(op==='*'&&j<i))return;var good=0,bad=0,use=[];
          body.forEach(function(ri){var a=N[ri][i],b=N[ri][j],v=N[ri][k];if(a==null||b==null||v==null||F[ri+','+k])return;
            if([i,j].some(function(c){var e=F[ri+','+c];return e&&e.refs.some(function(q){return q[0]===ri&&q[1]===k})})){bad++;return}   /* never a circle */
            var x=op==='*'?a*b:op==='-'?a-b:(b?a/b:NaN);if(!isFinite(x)){bad++;return}
            if(nearR(x,ri,k)){if(v&&Math.abs(a)!==1&&Math.abs(b)!==1&&!near(a,v)&&!near(b,v))good++;use.push(ri)}else bad++});
          if(good>=2&&!bad){use.forEach(function(ri){put(ri,k,A(ri,i)+op+A(ri,j),[[ri,i],[ri,j]])});done=true;role[k]='out';role[i]=role[i]||'in';role[j]=role[j]||'in'}})}}});
  /* 2c. a variance column written "15,000 F" / "2,000 U": the gap between two figure columns of the same row, F or U as on the slide.
         The same two columns must explain at least two variances of the table and every one of them. */
  var FU=rows.map(function(r){return r.c.map(function(v,ci){return r.hdr||!ci?null:parseFU(v)})});
  for(var kf=1;kf<nc0;kf++){var cells=[];rows.forEach(function(r,ri){if(FU[ri][kf])cells.push(ri)});if(cells.length<2)continue;
    var pair=null;
    for(var i2=1;i2<nc0&&!pair;i2++)for(var j2=i2+1;j2<nc0&&!pair;j2++){if(i2===kf||j2===kf)continue;
      if(cells.every(function(ri){var a=N[ri][i2],b=N[ri][j2];return a!=null&&b!=null&&Math.abs(Math.abs(a-b)-FU[ri][kf].n)<=0.5*Math.pow(10,-dec(ri,kf))+1e-9}))pair=[i2,j2]}
    if(pair)cells.forEach(function(ri){var a=N[ri][pair[0]],b=N[ri][pair[1]],s=FU[ri][kf].s,f=(a-b)*s>=0?A(ri,pair[0])+'-'+A(ri,pair[1]):A(ri,pair[1])+'-'+A(ri,pair[0]);
      var d=dec(ri,kf),z=d?'.'+'0'.repeat(d):'';
      F[ri+','+kf]={f:f,v:FU[ri][kf].n*s,refs:[[ri,pair[0]],[ri,pair[1]]],fu:'#,##0'+z+' "F";#,##0'+z+' "U";"-"'};
      used[ri+','+pair[0]]=used[ri+','+pair[1]]=1})}
  /* 3. totals down a column: one set of source rows must give the figure in EVERY column of the total row,
        so a zero that happens to sit inside a window cannot pass for a real component */
  var nc=0;rows.forEach(function(r){nc=Math.max(nc,r.c.length)});
  function val(ri,ci){if(N[ri][ci]!=null)return N[ri][ci];var t=rows[ri].c[ci];return t==null||String(t).trim()===''?0:NaN}
  function cands(ri,ci){var out=[],run=[],tl=[],k,j;
    for(k=ri-1;k>=0&&!rows[k].hdr&&N[k][ci]!=null;k--)run.push(k);
    for(j=0;j<run.length;j++)if(j>0||run.length===1)out.push({p:run.slice(0,j+1).reverse(),m:0});   /* sum of the run above, shortest first */
    for(j=1;j<run.length;j++)out.push({p:run.slice(0,j+1).reverse(),m:1});                           /* first minus the rest */
    for(k=ri-1;k>=0&&!rows[k].hdr;k--)if(isTot(k)&&N[k][ci]!=null&&!used[k+','+ci])tl.push(k);
    if(tl.length>=2)out.push({p:tl.reverse(),m:0});                                                   /* the unused totals above */
    return out}
  function calc(c,ci){var s=0;for(var i=0;i<c.p.length;i++){var x=val(c.p[i],ci);if(isNaN(x))return NaN;s+=c.m&&i?-x:x}return s}
  function seq(p,ci){return p.length===1?A(p[0],ci):p[p.length-1]-p[0]===p.length-1?'SUM('+A(p[0],ci)+':'+A(p[p.length-1],ci)+')':p.map(function(q){return A(q,ci)}).join('+')}
  function ftext(c,ci){if(!c.m)return seq(c.p,ci);var r=c.p.slice(1),t=seq(r,ci);return A(c.p[0],ci)+'-'+(r.length>1&&!/^SUM/.test(t)?'('+t+')':t)}
  /* per column: 1 = gives the figure, 0 = cannot judge (no figures to add, text, or off only by the slide's rounding), -1 = contradicts */
  function judge(c,ri,cj){var n=0,i;for(i=0;i<c.p.length;i++){if(N[c.p[i]][cj]!=null)n++;else if(isNaN(val(c.p[i],cj)))return 0}
    if(!n)return 0;var s=calc(c,cj),v=N[ri][cj];if(near(s,v))return 1;
    var d=((String(rows[ri].c[cj]).match(/\.(\d+)/)||[0,''])[1]).length;return Math.abs(s-v)<=0.5*n*Math.pow(10,-d)+1e-9?0:-1}
  for(var ri=0;ri<rows.length;ri++){if(!isTot(ri))continue;
    var cols=[],tried={},pick=null,ok=[];for(var ci=1;ci<nc;ci++)if(N[ri][ci]!=null&&!F[ri+','+ci])cols.push(ci);
    cols.some(function(ci){return cands(ri,ci).some(function(c){var key=c.m+':'+c.p.join(',');if(tried[key])return false;tried[key]=1;
      var j=cols.map(function(cj){return judge(c,ri,cj)});
      if(j.indexOf(-1)<0&&j.indexOf(1)>=0){pick=c;ok=cols.filter(function(cj,i){return j[i]===1});return true}return false})});
    if(pick)ok.forEach(function(ci){put(ri,ci,ftext(pick,ci),pick.p.map(function(q){return [q,ci]}))});
  }
  return F;
}
function numFmt(txt,pct,plain,cur){var d=((txt.match(/\.(\d+)/)||[0,''])[1]).length,z=d?'.'+'0'.repeat(d):'',b=(cur?'"$"':'')+(pct?'0'+z+'%':'#,##0'+z);
  return b+';'+(plain?'':'[Red]')+'('+b+');"-"'}
function exportTables(groups,title,fname){
  if(!document.documentElement.classList.contains('gl-ar-on'))groups=groups.map(function(g){return {h:g.h,tables:g.tables.map(function(t){   // Key terms: no empty Arabic column
    if(!t.querySelector('.gl-ar'))return t;var c=t.cloneNode(true);Array.prototype.forEach.call(c.querySelectorAll('.gl-ar'),function(x){x.parentNode.removeChild(x)});return c})}});
  var note=el('div','fb ok','<b class="v">Preparing the Excel file…</b>');ST.modal('Export to Excel',note);
  loadXL().then(function(XL){
    var wb=new XL.Workbook();wb.creator='START TIME — ASHRAF FATHY';wb.created=new Date();wb.calcProperties={fullCalcOnLoad:true};
    var NAVY='FF1F3864',HEAD='FFBDD7EE',BORDER={style:'thin',color:{argb:'FFBFBFBF'}},B={top:BORDER,left:BORDER,bottom:BORDER,right:BORDER};
    var NUM='#,##0.00;(#,##0.00);"-"',font={name:'Arial',size:10};
    var used={index:1},idx=wb.addWorksheet('Index'),list=[];
    /* one sheet per slide: its tables one under the other (a balance sheet split into two tables stays one page) */
    groups.forEach(function(g){
      var tabs=g.tables.map(function(t){return {t:t,rows:grid(t)}}).filter(function(o){return o.rows.length});if(!tabs.length)return;
      var nm=sheetName(g.h,used),ws=wb.addWorksheet(nm);
      var c1=ws.getCell('A1');c1.value=g.h.replace(/^\d+\s*/,'')||title;c1.font={name:'Arial',size:14,bold:true,color:{argb:NAVY}};
      var c2=ws.getCell('B1');c2.value={text:'← Index',hyperlink:"#'Index'!A1"};c2.font={name:'Arial',size:10,color:{argb:'FF0563C1'},underline:true};
      var c3=ws.getCell('A2');c3.value=title+' · slide '+(g.h.match(/^\d+/)||[''])[0];c3.font={name:'Arial',size:9,italic:true,color:{argb:'FF808080'}};
      var r0=4,maxC=0,widths=[],live=false,frz=0,L={};
      tabs.forEach(function(o){var rows=o.rows;
        Object.keys(L).forEach(function(k){L[k].ri=null});                /* labels of the tables above: no row number inside this table */
        rows.forEach(function(r,ri){if(r.hdr||!r.c[0])return;L[lnorm(r.c[0])]={row:r0+ri,ri:ri,N:r.c.map(function(v,ci){var p=ci?parseNum(v==null?'':String(v)):null;return p?p.v:null})}});
        var FX=liveFormulas(rows,r0,L),refd={};if(Object.keys(FX).length)live=true;
        Object.keys(FX).forEach(function(k){FX[k].refs.forEach(function(p){refd[p[0]+','+p[1]]=1})});
        rows.forEach(function(r,ri){var row=ws.getRow(r0+ri);maxC=Math.max(maxC,r.c.length);
          var navy=/\btt\b/.test(r.cls),bold=navy||/\b(s|tot)\b/.test(r.cls);
          r.c.forEach(function(v,ci){var cell=row.getCell(ci+1),txt=v==null?'':String(v),pn=(!r.hdr&&ci>0)?parseNum(txt):null,fx=FX[ri+','+ci];
            if(pn){cell.value=fx?{formula:fx.f,result:pn.v}:pn.v;cell.numFmt=numFmt(txt,pn.f==='p',navy,pn.cur);cell.alignment={horizontal:'right'}}
            else if(fx&&fx.fu){cell.value={formula:fx.f,result:fx.v};cell.numFmt=fx.fu;cell.alignment={horizontal:'right'}}
            else{cell.value=txt;cell.alignment={wrapText:true,vertical:'top'}}
            cell.font=font;cell.border=B;
            if(r.hdr){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:HEAD}};cell.font={name:'Arial',size:10,bold:true,color:{argb:NAVY}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true}}
            else if(navy){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:NAVY}};cell.font={name:'Arial',size:10,bold:true,color:{argb:'FFFFFFFF'}}}
            else{if(bold)cell.font={name:'Arial',size:10,bold:true};if(pn&&!fx&&refd[ri+','+ci])cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF2CC'}}}
            widths[ci]=Math.max(widths[ci]||8,Math.min(ci===0?60:24,txt.length+2))});
          if(r.hdr&&tabs.length===1)frz=r0+ri});
        /* a check row under the table (data-xcheck="Label|={@Total assets}-{@Total liabilities and equity}"): green when 0, red otherwise */
        var xc=o.t.getAttribute&&o.t.getAttribute('data-xcheck'),chk=0;
        if(xc){var xp=xc.split('|'),xf=(xp[1]||'').replace(/^=/,''),crow=ws.getRow(r0+rows.length);
          for(var ci=1;ci<maxC;ci++){var bad=false;
            var js=xf.replace(/\{@([^}]+)\}/g,function(_,l){var e=L[lnorm(l)];if(!e||e.N[ci]==null){bad=true;return '0'}return '('+e.N[ci]+')'}),v=bad?null:arith(js);
            if(v==null)continue;if(!near(v,0)){if(window.console)console.warn('Excel check is not 0 on the slide figures:',xc,v);continue}
            var cc=crow.getCell(ci+1);cc.value={formula:xf.replace(/\{@([^}]+)\}/g,function(_,l){return colL(ci)+L[lnorm(l)].row}),result:0};
            cc.numFmt='[Red]#,##0;[Red](#,##0);"0 \u2713"';cc.font={name:'Arial',size:10,bold:true,color:{argb:'FF00703C'}};cc.border=B;cc.alignment={horizontal:'right'};chk=1}
          if(chk){var lc=crow.getCell(1);lc.value=xp[0];lc.font={name:'Arial',size:10,bold:true,italic:true,color:{argb:'FFC00000'}};lc.border=B;lc.alignment={wrapText:true,vertical:'top'};
            widths[0]=Math.max(widths[0]||8,Math.min(60,xp[0].length+2));live=true}}
        r0+=rows.length+chk+2});
      if(live){var c4=ws.getCell('A3');c4.value='Yellow cells are the inputs: change one and every total that depends on it updates.';c4.font={name:'Arial',size:9,italic:true,color:{argb:'FF7F6000'}}}
      if(frz)ws.views=[{state:'frozen',ySplit:frz}];
      widths.forEach(function(w,i){ws.getColumn(i+1).width=w});
      ws.pageSetup={orientation:maxC>4?'landscape':'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9,margins:{left:0.4,right:0.4,top:0.5,bottom:0.5,header:0.2,footer:0.2}};
      list.push(nm);
    });
    idx.getCell('A1').value=title;idx.getCell('A1').font={name:'Arial',size:14,bold:true,color:{argb:NAVY}};
    idx.getCell('A2').value='START TIME — ASHRAF FATHY · CMA '+PART+' · '+SECT+' · exported '+new Date().toLocaleDateString('en-GB');idx.getCell('A2').font={name:'Arial',size:9,italic:true,color:{argb:'FF808080'}};
    list.forEach(function(nm,i){var c=idx.getCell('A'+(4+i));c.value={text:nm,hyperlink:"#'"+nm.replace(/'/g,"''")+"'!A1"};c.font={name:'Arial',size:10,color:{argb:'FF0563C1'},underline:true}});
    idx.getColumn(1).width=48;
    return wb.xlsx.writeBuffer();
  }).then(function(buf){
    var blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='START-TIME-'+fname+'.xlsx';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},2000);
    note.innerHTML='<b class="v">Done.</b>Your download should start now ('+esc(a.download)+').';
  }).catch(function(e){note.className='fb bad';note.innerHTML='<b class="v">Export failed.</b>'+esc(e.message||String(e))});
}
ST.exportTables=exportTables;
})();
