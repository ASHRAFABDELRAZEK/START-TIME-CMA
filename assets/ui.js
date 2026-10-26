/* START TIME — "Your screen": the slide's tool row, the ⋯ menu, focus mode, and the staff tools in one chip.
   Each tool sits on the slide, under ⋯, or is hidden. Where it starts comes from the Roles sheet (the "Slide tools" rows,
   sent with the sign-in as session.ui, and session.sui for Student view). A person whose role has "uiCustom" can change it
   on his own device: Settings → Your screen (kept in localStorage st-ui). Focus mode hides the top bar (st-ui-focus). */
(function(){
var $=ST.h.$,$$=ST.h.$$,el=ST.h.el,esc=ST.h.esc,ICON=ST.ICON||{};
var KEY='st-ui',FK='st-ui-focus',LK='st-ui-los',QK='st-ui-qc';   // LK: LOS tags on slides (default hidden); QK: quick checks below each slide, or at the end (default)
function sv(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
var SVG=function(p){return '<svg viewBox="0 0 24 24">'+p+'</svg>'};
var IC={
 listen:SVG('<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
 calc:SVG('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h.01M12 18h.01M16 18h.01"/>'),
 tables:SVG('<rect x="3" y="4.5" width="18" height="15" rx="3"/><text x="12" y="15.6" text-anchor="middle" font-size="8.5" font-weight="700" font-family="Inter,Arial,sans-serif" fill="currentColor" stroke="none">PV</text>'),
 excel:SVG('<path d="M4 4h16v16H4z"/><path d="M4 9h16M4 14h16M10 4v16"/>'),
 print:SVG('<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><path d="M7 14h10v6H7z"/>'),
 timer:SVG('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>'),
 record:SVG('<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>'),
 more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/></svg>',
 screen:SVG('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
 focus:SVG('<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/><circle cx="12" cy="12" r="2.5"/>')
};
/* [id, label, hint, icon]. 'translate' shows a T (owner 26 Oct 2026); what it does is chosen in Settings → Translate. */
var TOOLS=[
 ['listen','Listen','Reads the slide aloud. The play controls show only while it reads (K)',IC.listen],
 ['translate','Translate (T)','Whole slide, line by line or key terms only: choose in Settings',null],
 ['calc','Calculator','Only on slides with numbers',IC.calc],
 ['tables','PV / FV tables','Only on present / future value slides',IC.tables],
 ['outline','Slide list','Go to any slide (G)',ICON.list],
 ['excel','Tables to Excel','The tables on this slide',IC.excel],
 ['print','Print / PDF','A handout of the topic',IC.print],
 ['full','Full screen','Or press F',ICON.full],
 ['view','Portrait / landscape','For presenting on a wide screen (L)',ICON.land],
 ['timer','Focus timer','Pomodoro, calm sound, daily goal',IC.timer],
 ['answer','Show answer','Practice slides',ICON.key],
 ['record','Record MP3','The slides read aloud, as an MP3 (computer)',IC.record]
];
var LABEL={};TOOLS.forEach(function(x){LABEL[x[0]]=x});
var CLEAN={listen:'bar',translate:'bar',calc:'menu',tables:'menu',outline:'menu',excel:'menu',print:'menu',full:'menu',view:'menu',timer:'menu',answer:'bar',record:'menu'};
function all(v){var o={};TOOLS.forEach(function(x){o[x[0]]=v});return o}
var PRESETS=[['clean','Clean','Listen and ع on the slide; everything else under ⋯',CLEAN],['bare','Nothing on the slide','Every tool under ⋯',all('menu')],['all','Everything','Every tool on the slide',all('bar')]];
var PLACES=[['bar','On the slide'],['menu','Under ⋯'],['off','Hidden']];

/* ---------- where each tool goes ---------- */
function sess(){return (ST.session&&ST.session())||{}}
function roleUI(){var s=sess(),u=ST.role==='trainer'&&s.view==='student'?(s.sui||s.ui):s.ui;return u||{}}
function custom(){return ST.can?ST.can('uiCustom'):true}
function dev(){try{return JSON.parse(sv(KEY)||'{}')||{}}catch(e){return {}}}
function place(id){var d=custom()?dev():{},r=roleUI();var p=d[id]||r[id]||CLEAN[id]||'menu';return /^(bar|menu|off)$/.test(p)?p:'menu'}
function secOK(id){var v=String(roleUI()[id+'.sec']||'').trim();if(!v||/^all$/i.test(v))return true;
  var L=v.toUpperCase().replace(/SECTION|PART\s*\d|P\d-?/g,' ').split(/[^A-Z]+/).filter(function(x){return x.length===1});
  return !!(ST.SEC&&L.indexOf(ST.SEC.k)>=0)}
function perm(k){return (ST.canStaff&&ST.canStaff(k))||(ST.can&&ST.can(k))}
/* the tools this person has at all (for the settings list) */
function avail(id){switch(id){
  case 'listen':return perm('listen')||perm('listenBank');
  case 'translate':return perm('langSlide')||perm('langQ')||perm('langLines')||perm('langTerms');
  case 'excel':return ST.can('excel');case 'print':return ST.can('print');
  case 'answer':return ST.can('answers');case 'record':return perm('listenRecord')&&!/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  case 'view':return window.innerWidth>=700;case 'timer':return !!ST.focus;
  case 'calc':case 'tables':return secOK(id);
  default:return true}}
function focusOn(){return sv(FK)==='1'}
function applyFocus(){document.body.classList.toggle('ui-focus',focusOn())}

/* ---------- the slide's tool row ---------- */
var menu=null,menuFor=null;
function closeMenu(){if(menu){menu.remove();menu=null}if(menuFor){menuFor.setAttribute('aria-expanded','false');menuFor.classList.remove('on');menuFor=null}}
function ctrls(d){var top=$('.dk-top',d),sec=$('section.slide',d);if(!top||!sec)return null;
  return {sec:sec,top:top,c:{listen:$('.tts-bar .tts-b',sec),translate:$('.trs-sl',sec),calc:$('.xt-bc',top),tables:$('.xt-bt',top),outline:$('.dk-toc',top),
    excel:$('.dk-xl',top),print:$('.dk-pr',top),full:$('.dk-fs',top),view:$('.dk-or',top),answer:$('.sol-b',sec),record:$('.tts-rec',sec),
    timer:ST.focus?{click:function(){ST.focus.panel()},virtual:1}:null}}}
var MOVE={calc:1,tables:1,outline:1,excel:1,print:1,full:1,view:1};   // header buttons: moved into the row as they are
function proxy(id,orig){var x=LABEL[id],b=el('button','ib ui-px ui-'+id,x[3]||'<span class="ui-ar ui-t">T</span>');b.type='button';
  var t=id==='translate'?(orig.textContent||'ترجم'):x[1];b.title=t;b.setAttribute('aria-label',t);
  b.onclick=function(){closeMenu();orig.click();paintPx(b,id,orig)};paintPx(b,id,orig);return b}
function paintPx(b,id,orig){var on=false;
  if(id==='listen'){var bar=orig.closest&&orig.closest('.tts-bar');on=!!bar&&(bar.classList.contains('playing')||bar.classList.contains('paused'));
    b.title=bar&&bar.classList.contains('playing')?'Pause (K)':bar&&bar.classList.contains('paused')?'Resume (K)':'Listen (K)';b.setAttribute('aria-label',b.title)}
  else if(id==='translate')on=orig.getAttribute&&orig.getAttribute('aria-expanded')==='true';
  else if(id==='answer')on=/Hide/.test(orig.textContent||'');
  else if(id==='record')on=orig.classList&&orig.classList.contains('on');
  b.classList.toggle('on',!!on);b.setAttribute('aria-pressed',on?'true':'false')}
function build(d){
  var C=ctrls(d);if(!C)return;var sec=C.sec,meta=$('.s-meta',sec);if(!meta)return;
  var exq=d.classList.contains('exq'),set=exq||d.classList.contains('mixq'),row=el('div','s-tools'),items=[];row.setAttribute('role','toolbar');row.setAttribute('aria-label','Slide tools');
  TOOLS.forEach(function(x){var id=x[0],o=C.c[id];if(!o)return;
    var p=place(id);if((id==='calc'||id==='tables')&&!secOK(id))p='off';
    if(set&&id==='outline')p='off';                                                     // a set or a mixed quiz has its own question grid
    if(exq){if(id==='calc'||id==='tables')p='bar';else if(id==='excel'||id==='print')p='off'}   // an exam set: the exam's own tools, in reach
    /* Listen and Record live in the listen bar under the title: it shows only while reading or recording */
    var inBar=id==='listen'||id==='record',hide=!o.virtual&&!inBar;
    if(id==='listen'){var tb=o.closest('.tts-bar');if(tb){tb.classList.add('ui-min');if(p==='off')tb.classList.add('ui-hide')}}
    if(id==='record'&&p==='off')o.classList.add('ui-hide');
    if(p==='bar'){if(MOVE[id]&&!o.virtual){row.appendChild(o);o.classList.add('ui-in')}else{row.appendChild(proxy(id,o));if(hide)o.classList.add('ui-hide')}}
    else{if(hide)o.classList.add('ui-hide');if(p==='menu')items.push([id,o])}});
  var mb=el('button','ib ui-more',IC.more);mb.type='button';mb.title='More tools';mb.setAttribute('aria-label','More tools');mb.setAttribute('aria-haspopup','menu');mb.setAttribute('aria-expanded','false');
  mb.onclick=function(e){e.stopPropagation();if(menu&&menuFor===mb){closeMenu();return}openMenu(mb,items,d)};
  row.appendChild(mb);meta.appendChild(row);sec.classList.add('ui-man');
  /* keep the proxies in step with the originals (Listen playing, the translation open, the answer shown) */
  try{new MutationObserver(function(){$$('.ui-px',row).forEach(function(b){var id=(b.className.match(/ui-(listen|translate|answer|record)/)||[])[1];if(id&&C.c[id])paintPx(b,id,C.c[id])})})
    .observe(sec,{subtree:true,attributes:true,childList:true,characterData:true,attributeFilter:['class','aria-expanded']})}catch(e){}
}
function openMenu(btn,items,d){closeMenu();menuFor=btn;btn.setAttribute('aria-expanded','true');btn.classList.add('on');
  var m=el('div','s-menu');m.setAttribute('role','menu');m.setAttribute('aria-label','More tools');
  var add=function(icon,label,hint,fn,cls){var b=el('button','s-mi'+(cls?' '+cls:''),'<span class="s-mi-i">'+(icon||'<span class="ui-ar ui-t">T</span>')+'</span><span><b>'+esc(label)+'</b>'+(hint?'<small>'+esc(hint)+'</small>':'')+'</span>');
    b.type='button';b.setAttribute('role','menuitem');b.onclick=function(e){e.stopPropagation();closeMenu();fn()};m.appendChild(b);return b};
  items.forEach(function(it){var x=LABEL[it[0]],o=it[1],lab=x[1],hint=x[2];
    if(it[0]==='listen'){var tb=o.closest('.tts-bar');var st=tb&&tb.classList.contains('playing')?'Pause':tb&&tb.classList.contains('paused')?'Resume':'';if(st)lab=st+' reading'}
    if(it[0]==='translate'&&o.getAttribute('aria-expanded')==='true')lab='Hide the translation';
    if(it[0]==='answer'&&/Hide/.test(o.textContent||''))lab='Hide the answer';
    if(it[0]==='view'){var l=document.body.classList.contains('land-on');lab=l?'Portrait view':'Landscape view';hint=l?'For reading (L)':'For presenting on a wide screen (L)'}
    add(x[3],lab,hint,function(){o.click()})});
  if(items.length)m.appendChild(el('div','s-msep'));
  add(IC.focus,focusOn()?'Show the top bar':'Focus mode',focusOn()?'Bring back the header':'Hide the top bar; only the slide stays',function(){sv(FK,focusOn()?null:'1');applyFocus()});
  if(ST.settings)add(IC.screen,'Your screen…',custom()?'Choose which tools sit on the slide':'Appearance and settings',function(){ST.settings('ui')});
  document.body.appendChild(m);menu=m;
  var r=btn.getBoundingClientRect(),w=m.offsetWidth,vw=document.documentElement.clientWidth,vh=window.innerHeight;
  var left=Math.max(8,Math.min(vw-w-8,r.right-w)),top=r.bottom+6;if(top+m.offsetHeight>vh-8)top=Math.max(8,r.top-m.offsetHeight-6);
  m.style.left=left+'px';m.style.top=top+'px';var f=m.querySelector('.s-mi');if(f)f.focus()}
document.addEventListener('click',function(e){if(menu&&!menu.contains(e.target))closeMenu()});
document.addEventListener('keydown',function(e){if(!menu)return;if(e.key==='Escape'){var b=menuFor;closeMenu();if(b)b.focus();return}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();var it=$$('.s-mi',menu),i=it.indexOf(document.activeElement);i=(i+(e.key==='ArrowDown'?1:-1)+it.length)%it.length;it[i].focus()}});
window.addEventListener('hashchange',closeMenu);window.addEventListener('resize',closeMenu);window.addEventListener('scroll',function(){if(menu)closeMenu()},{passive:true});

var prevDone=ST.deckDone;
ST.deckDone=function(d,t,s,idx){if(prevDone)prevDone.apply(this,arguments);closeMenu();build(d)};

/* ---------- Settings → Your screen ---------- */
ST.uiSettings=function(){
  var w=el('div','ui-sett');w.id='uiSett';
  var mine=TOOLS.filter(function(x){return avail(x[0])});
  var can=custom();
  w.innerHTML='<h3 class="sett-h">Your screen</h3>'+(can?'<p class="note">Choose what sits on the slide. Tools under ⋯ are one tap away; hidden tools are off. This device only.</p>'+
     '<div class="ui-pre" role="group" aria-label="Ready-made layouts">'+PRESETS.map(function(p){return '<button type="button" data-p="'+p[0]+'"><b>'+esc(p[1])+'</b><small>'+esc(p[2])+'</small></button>'}).join('')+'</div>'+
     '<div class="ui-rows">'+mine.map(function(x){return '<div class="ui-row"><span><b>'+esc(x[1])+'</b><small>'+esc(x[2])+'</small></span><span class="seg sm" role="group" aria-label="'+esc(x[1])+'">'+
       PLACES.map(function(p){return '<button type="button" data-t="'+x[0]+'" data-v="'+p[0]+'">'+p[1]+'</button>'}).join('')+'</span></div>'}).join('')+'</div>'
    :'<p class="note">Your academy sets which tools sit on your slides. Anything not on the slide is under ⋯.</p>')+
    '<div class="apx-r"><span class="note">Top bar</span><span class="seg sm" role="group" aria-label="Focus mode"><button type="button" data-f="0">Show</button><button type="button" data-f="1">Hide (focus mode)</button></span></div>'+
    '<div class="apx-r"><span class="note">LOS tags on slides</span><span class="seg sm" role="group" aria-label="LOS tags on slides"><button type="button" data-l="0">Hide</button><button type="button" data-l="1">Show</button></span></div>'+
    '<div class="apx-r"><span class="note">Quick checks</span><span class="seg sm" role="group" aria-label="Where the quick checks appear"><button type="button" data-q="below">Below each slide</button><button type="button" data-q="end">At the end of the topic</button></span></div>'+
    (can?'<div class="apx-r"><button type="button" class="btn sm ghost ui-reset">Back to the academy\'s layout</button></div>':'');
  function presetOf(){var cur={};mine.forEach(function(x){cur[x[0]]=place(x[0])});
    var hit='';PRESETS.forEach(function(p){if(mine.every(function(x){return (p[3][x[0]]||'menu')===cur[x[0]]}))hit=hit||p[0]});return hit}
  function paint(){$$('[data-t]',w).forEach(function(b){var on=place(b.dataset.t)===b.dataset.v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
    var pr=presetOf();$$('[data-p]',w).forEach(function(b){var on=b.dataset.p===pr;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
    $$('[data-f]',w).forEach(function(b){var on=(b.dataset.f==='1')===focusOn();b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
    $$('[data-l]',w).forEach(function(b){var on=(b.dataset.l==='1')===(sv(LK)==='1');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
    $$('[data-q]',w).forEach(function(b){var on=b.dataset.q===(sv(QK)==='below'?'below':'end');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')})}
  function redraw(){paint();if(/^#\/t\//.test(location.hash)&&ST.route)ST.route()}
  $$('[data-t]',w).forEach(function(b){b.onclick=function(){var d=dev();d[b.dataset.t]=b.dataset.v;sv(KEY,JSON.stringify(d));redraw()}});
  $$('[data-p]',w).forEach(function(b){b.onclick=function(){var p=PRESETS.filter(function(x){return x[0]===b.dataset.p})[0],d={};mine.forEach(function(x){d[x[0]]=p[3][x[0]]||'menu'});sv(KEY,JSON.stringify(d));redraw()}});
  $$('[data-f]',w).forEach(function(b){b.onclick=function(){sv(FK,b.dataset.f==='1'?'1':null);applyFocus();paint()}});
  $$('[data-l]',w).forEach(function(b){b.onclick=function(){sv(LK,b.dataset.l==='1'?'1':null);redraw()}});
  $$('[data-q]',w).forEach(function(b){b.onclick=function(){sv(QK,b.dataset.q==='below'?'below':null);redraw()}});
  var rs=$('.ui-reset',w);if(rs)rs.onclick=function(){sv(KEY,null);redraw()};
  paint();return w};

/* ---------- staff: every staff tool behind one chip in the top bar ---------- */
ST.staffChip=function(bar){
  var s=sess(),stu=s.view==='student',label=String(ST.staffRole||'staff').toUpperCase();
  var b=el('button','st-chip'+(stu?' stu':''),'<span class="st-r">'+esc(label)+'</span>'+(stu?'<span class="st-v">Student view</span>':'')+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>');
  b.type='button';b.id='nStaff';b.title='Staff tools'+(s.name?' — '+s.name:'');b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');
  bar.classList.add('tb-pop');bar.hidden=true;bar.setAttribute('role','dialog');bar.setAttribute('aria-label','Staff tools');document.body.appendChild(bar);
  function place_(){var r=b.getBoundingClientRect(),vw=document.documentElement.clientWidth,w=bar.offsetWidth;bar.style.top=(r.bottom+6)+'px';bar.style.left=Math.max(8,Math.min(vw-w-8,r.right-w))+'px'}
  function shut(){bar.hidden=true;b.setAttribute('aria-expanded','false');b.classList.remove('on')}
  b.onclick=function(e){e.stopPropagation();if(!bar.hidden){shut();return}bar.hidden=false;b.setAttribute('aria-expanded','true');b.classList.add('on');place_()};
  document.addEventListener('click',function(e){if(!bar.hidden&&!bar.contains(e.target)&&e.target!==b)shut()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!bar.hidden){shut();b.focus()}});
  window.addEventListener('resize',function(){if(!bar.hidden)place_()});window.addEventListener('hashchange',shut);
  var act=$('#top .top-act'),th=$('#nTheme',act);if(act)act.insertBefore(b,th||null);
  return b};

applyFocus();
})();
