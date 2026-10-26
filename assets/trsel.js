/* START TIME — "Translate" help, with separate permissions on the Roles sheet:
   lessons (lesson slides, home, maps, print): "language" = selected text, "langSlide" = the whole slide;
   question bank (#/bank, sets, mistakes, the bank part of a topic, any question inside a set or review — core.js sets ST.inBank on each slide):
   "langBank" = selected text, "langQ" = the whole question; "trSuggest" = "اقترح ترجمة أفضل" under a translation.
   Select any text → a small "ترجم" button → the Arabic shows in a box right under the text (from the sheet's script, which keeps every
   translation and the owner's glossary). Each slide also gets a "translate this slide / question" button that opens the Arabic under the title.
   Without the sheet (no connection, a preview) it falls back to Google Translate in a new tab. Every box keeps a link to Google Translate.
   Turned on or off in Settings (remembered on this device; on until turned off). Nothing shows where the person has no permission. */
(function(){
var ST=window.ST;if(!ST)return;
var KEY='st-trs',KEYB='st-trs-b',MAX=4500,PART=1800,PARTS=40,fl=null,pop=null,tmr=null,memo={};
function perm(k){try{return !!(ST.canStaff&&ST.canStaff(k))||!!(ST.can&&ST.can(k))}catch(e){return false}}
function inBank(){var h=location.hash||'';if(/^#\/(bank|practice|mistakes|set-result)(\/|$)/.test(h))return true;return /^#\/t\//.test(h)&&!!ST.inBank}
function allowedSel(){return perm(inBank()?'langBank':'language')}       // selected text, here on this page or slide
function allowedAll(){return perm(inBank()?'langQ':'langSlide')}          // the whole slide / question
/* the T button's three choices, each its own permission on the Roles sheet */
function okMode(m){return m==='all'?allowedAll():m==='lines'?perm('langLines'):m==='terms'?perm('langTerms'):false}
function allowedT(){return okMode('all')||okMode('lines')||okMode('terms')}
function allowedAny(){return perm('language')||perm('langBank')||perm('langSlide')||perm('langQ')||perm('langLines')||perm('langTerms')}
function isOnK(k){var v='1';try{v=localStorage.getItem(k)||'1'}catch(e){}return v==='1'}   // on where the role allows it, until the person turns it off
function isOn(){return isOnK(inBank()?KEYB:KEY)}                        // the switch for where the person is now: lessons or question bank
function setOnK(k,v){try{localStorage.setItem(k,v?'1':'0')}catch(e){}boot();if(!v){hideFl();hidePop()}}
function strip(h){var d=document.createElement('div');d.innerHTML=h==null?'':String(h);return (d.textContent||'').replace(/\s+/g,' ').trim()}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
/* Arabic with English inside: each English run (LOS, Lumora Bakery Co., A.1.a, PP&E…) is isolated left-to-right, so its dots and
   brackets stay where they belong; a full stop that ends the Arabic sentence stays outside. Numbers keep the Arabic (right-to-left) order. */
var NUM=/^[\d.,()%\s\-\u2013\u2212]*\d[\d.,()%\s\-\u2013\u2212]*$/;   // a cell that is only a number, e.g. (540,000)
var LAT=/[A-Za-z](?:[A-Za-z0-9&'\u2019%\-\/]|[.,](?=[A-Za-z0-9]))*\.?(?:[ ]+[A-Za-z0-9](?:[A-Za-z0-9&'\u2019%\-\/]|[.,](?=[A-Za-z0-9]))*\.?)*/g;
function arHtml(a){a=String(a==null?'':a);var h='',i=0,m;LAT.lastIndex=0;
  while((m=LAT.exec(a))){var w=m[0],end=m.index+w.length;
    if(/\.$/.test(w)&&!(m.index===0&&/^[A-Za-z]\.$/.test(w))&&/^\s*([\u0600-\u06FF]|$)/.test(a.slice(end))){w=w.slice(0,-1);end--}
    h+=esc(a.slice(i,m.index))+'<bdi dir="ltr">'+esc(w)+'</bdi>';i=end}
  return h+esc(a.slice(i))}
function gUrl(text){text=String(text||'').trim();if(text.length>MAX)text=text.slice(0,MAX);return 'https://translate.google.com/?sl=en&tl=ar&op=translate&text='+encodeURIComponent(text)}
function open(text){if(String(text||'').trim())window.open(gUrl(text),'_blank','noopener')}
function canCall(){var s=ST.session&&ST.session();return !!(ST.translateCall&&s&&s.code&&navigator.onLine!==false)}
var L='ABCDEFGH';
/* the words of a practice question (never the answer or the explanations) */
function qText(s){var out=[];if(s.q)out.push(strip(s.q));
  if((s.t==='mcq'||s.t==='multi')&&s.o)s.o.forEach(function(o,i){out.push(L[i]+'. '+strip(o))});
  if(s.t==='dd'&&s.s){out.push(strip(s.s.replace(/\{(\d+)\}/g,'____')));(s.f||[]).forEach(function(f,i){out.push((i+1)+') '+f.o.map(strip).join(' / '))})}
  if(s.t==='sort'){(s.i||[]).forEach(function(it){out.push('• '+strip(it.x))});if(s.b)out.push('Categories: '+s.b.map(function(b){return strip(b.l)}).join(' | '))}
  if(s.t==='order')(s.i||[]).forEach(function(x){out.push('• '+strip(x))});
  if(s.t==='num'&&s.f&&s.f.length>1)s.f.forEach(function(f){out.push('– '+strip(f.l))});
  return out.join('\n')}
function slideText(sec,s){var h=s.h?strip(s.h)+'\n\n':'';
  if(ST.isPractice&&ST.isPractice(s)&&s.t!=='trace')return h+qText(s);
  var b=sec.querySelector('.sb');return h+(b?bodyText(b).replace(/\n{3,}/g,'\n\n').trim():'')}
/* the words of a slide without its controls (an animation's Play / Slow / Normal / Fast / 6/6, game buttons, tabs, inputs);
   a quick check's answer choices stay. The copy is laid out off screen for a moment so that line breaks stay as on the slide. */
var NOISE='.anm-ctl,.anm-pb,button:not(.qc-o),[role=tab],[role=toolbar],input,select,textarea,.trs-sl,.trs-panel,.trs-pop,.trs-ln,.trs-note,rt,svg,[aria-hidden="true"]';
function bodyText(b){var c=b.cloneNode(true);Array.prototype.forEach.call(c.querySelectorAll(NOISE),function(e){e.parentNode.removeChild(e)});
  c.setAttribute('aria-hidden','true');c.style.cssText='position:absolute;left:-10000px;top:0;width:'+(b.clientWidth||800)+'px;pointer-events:none';
  b.parentNode.appendChild(c);var t=c.innerText||'';c.parentNode.removeChild(c);return t}
/* a text → the parts the script translates one by one (one paragraph or line each) */
function parts(text){var out=[];String(text||'').split(/\n+/).forEach(function(l){
  l=l.replace(/\t+/g,' | ').replace(/([A-Z]{2,})([A-Z][a-z])/g,'$1: $2').replace(/\s+/g,' ').replace(/^\|\s*|\s*\|$/g,'').trim();   // table cells stay apart; "QUICK CHECKWhich" → "QUICK CHECK: Which"
  if(!l||(l.length<3&&!/[a-z]{2}/i.test(l)))return;                                    // a lone option letter (A, B…) is not sent
  while(l.length>PART){var cut=l.lastIndexOf('. ',PART);cut=cut>200?cut+1:PART;out.push(l.slice(0,cut).trim());l=l.slice(cut).trim()}
  if(l)out.push(l)});return out.slice(0,PARTS)}

/* one translation request; the same text is asked only once per visit */
function translate(ps,where,mode){var k=where+'|'+mode+'|'+ps.join('\n');if(memo[k])return Promise.resolve(memo[k]);
  return ST.translateCall(ps,where,mode).then(function(r){if(r&&r.ok)memo[k]=r;return r})}
function failText(r){if(r&&r.limit)return 'وصلت لحد الترجمة بتاع النهارده. تقدر تكمّل بكرة، أو افتحها في Google Translate.';
  if(r&&r.quota)return 'خدمة الترجمة وصلت لحدها النهارده. افتحها في Google Translate.';
  if(r&&r.error&&/not open/i.test(r.error))return 'الترجمة مش مفتوحة لكودك.';
  return 'الترجمة مش متاحة دلوقتي. جرّب تاني، أو افتحها في Google Translate.'}
/* the box contents: the Arabic paragraphs and the Google Translate link (key terms have their own place: Key terms column, Glossary page) */
function body(r,ps,text){var h='';
  if(r&&r.ar&&r.ar.some(function(a){return a})){var rows=[];
    var flush=function(){if(!rows.length)return;var n=Math.max.apply(null,rows.map(function(c){return c.length}));
      while(rows[0].length<n){rows[0].unshift('');rows[0].pad=(rows[0].pad||0)+1}   // a heading row without its empty corner cell
      var head=rows.length>2&&!rows[0].some(function(v){return NUM.test(v)});
      h+='<table class="trs-tbl">'+rows.map(function(c,j){var t='';for(var k=0;k<n;k++){var v=c[k]||'';t+=NUM.test(v)?'<td class="n">'+esc(v)+'</td>':'<td>'+arHtml(v)+'</td>'}
        return '<tr data-i="'+c.i+'" data-pad="'+(c.pad||0)+'" data-n="'+c.n+'"'+(head&&!j?' class="h"':'')+'>'+t+'</tr>'}).join('')+'</table>';rows=[]};
    r.ar.forEach(function(a,i){
      if(a&&a.indexOf('|')>=0&&String(ps[i]||'').indexOf('|')>=0){var cells=a.split('|').map(function(c){return c.trim()});cells.i=i;cells.n=cells.length;rows.push(cells);return}   // a table row stays a table row
      flush();h+=a?'<p data-i="'+i+'">'+arHtml(a)+'</p>':(a===null?'<p class="trs-miss" dir="ltr">'+esc(ps[i])+'</p>':'')});
    flush()}
  if(!r||!r.ok)h+='<p class="trs-err">'+esc(failText(r))+'</p>';
  if(r&&r.ok&&perm('trSuggest')&&r.ar&&r.ar.some(function(a){return a}))h+='<button type="button" class="trs-sug">اقترح ترجمة أفضل</button>';
  h+='<a class="trs-g" href="'+esc(gUrl(text))+'" target="_blank" rel="noopener">افتحها في Google Translate ↗</a>';
  return h}
/* a box (slide panel or the box under selected text) gets its contents, and remembers what it shows for "اقترح ترجمة أفضل" */
function render(box,d){box.innerHTML=body(d.r,d.ps,d.text);box.__tr=d}

/* "اقترح ترجمة أفضل": the person corrects the Arabic right in the box and sends it; the owner approves it on the Suggestions sheet */
function norm(t){return String(t==null?'':t).replace(/\s+/g,' ').trim()}
function stopKeys(e){e.stopPropagation()}                                   // typing never moves the slide or starts listening
function editOn(box){if(box.querySelector('.trs-edit-bar'))return;
  var eds=box.querySelectorAll('p[data-i],tr[data-i] td');
  Array.prototype.forEach.call(eds,function(el){el.contentEditable='true';el.classList.add('trs-ed');el.addEventListener('keydown',stopKeys)});
  var sug=box.querySelector('.trs-sug');if(sug)sug.hidden=true;
  var bar=document.createElement('div');bar.className='trs-edit-bar';
  bar.innerHTML='<p class="trs-hint">عدّل الترجمة مكانها (اكتب على الكلام نفسه)، وبعدين اضغط إرسال. اقتراحك هيتراجع قبل ما يتعمل بيه.</p>'+
    '<button type="button" class="btn sm pri trs-send">إرسال الاقتراح</button> <button type="button" class="btn sm ghost trs-cancel">إلغاء</button>';
  var at=box.querySelector('.trs-g');box.insertBefore(bar,at||null);
  if(eds[0])eds[0].focus()}
function edited(el){if(el.tagName!=='TR')return norm(el.textContent);
  var pad=+el.dataset.pad||0,n=+el.dataset.n||el.cells.length;
  return norm(Array.prototype.slice.call(el.cells,pad,pad+n).map(function(td){return norm(td.textContent)}).join(' | '))}
function send(box){var d=box.__tr,bar=box.querySelector('.trs-edit-bar'),items=[];if(!d||!bar)return;
  Array.prototype.forEach.call(box.querySelectorAll('[data-i]'),function(el){var i=+el.dataset.i,orig=d.r.ar[i],now=edited(el);
    if(orig&&now&&now!==norm(orig))items.push({en:d.ps[i],ar:orig,sug:now})});
  var msg=function(t,cls){var p=bar.querySelector('.trs-msg');if(!p){p=document.createElement('p');bar.appendChild(p)}p.className='trs-msg'+(cls?' '+cls:'');p.textContent=t};
  if(!items.length){msg('لسه ما غيّرتش حاجة في الترجمة.','trs-err');return}
  var btn=bar.querySelector('.trs-send');btn.disabled=true;msg('جاري الإرسال…');
  ST.suggestCall(items.slice(0,10),d.where).then(function(res){
    if(res&&res.ok){Array.prototype.forEach.call(box.querySelectorAll('.trs-ed'),function(el){el.contentEditable='false';el.classList.remove('trs-ed')});
      bar.innerHTML='<p class="trs-ok">✓ اتبعت اقتراحك. هيتراجع، ولو اتعتمد هتوصلك رسالة شكر.</p>';return}
    btn.disabled=false;msg(res&&res.limit?'وصلت لحد الاقتراحات بتاع النهارده. تقدر تبعت تاني بكرة.':(res&&res.error&&/not open/i.test(res.error)?'الاقتراح مش مفتوح لكودك.':'ما اتبعتش. جرّب تاني.'),'trs-err')},
    function(){btn.disabled=false;msg('ما اتبعتش. اتأكد من النت وجرّب تاني.','trs-err')})}
document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('.trs-sug,.trs-send,.trs-cancel');if(!b)return;
  var box=b.closest('.trs-panel,.trs-in');if(!box||!box.__tr)return;
  if(b.classList.contains('trs-sug'))editOn(box);else if(b.classList.contains('trs-cancel'))render(box,box.__tr);else send(box)});
var WAIT='<p class="trs-wait">جاري الترجمة<span>.</span><span>.</span><span>.</span></p>';

/* on / off in Settings — shown only to roles with the permission; on until turned off */
(ST.settingsExtra=ST.settingsExtra||[]).push(function(){if(!allowedAny())return null;
  var rows=[];if(perm('language')||perm('langSlide')||perm('langLines')||perm('langTerms'))rows.push([KEY,'Lessons','the explanation slides']);if(perm('langBank')||perm('langQ')||perm('langLines')||perm('langTerms'))rows.push([KEYB,'Question bank','the questions in the bank, sets and mistakes']);
  var w=document.createElement('div');w.innerHTML='<h3 class="sett-h">Translate</h3><p class="note">Select any English text and press ترجم, or press the T button on a slide (what it does is chosen below): the Arabic shows right there, with a link to Google Translate. Each part has its own switch.</p>'+
    ((function(){var ms=MODES.filter(function(m){return m[0]==='all'?(perm('langSlide')||perm('langQ')):okMode(m[0])});return ms.length>1})()?'<div class="sett-row"><p class="note"><b>The T button</b> — what it does on each slide (English stays the base)</p><select class="sel-in trs-mode" aria-label="What the T button does">'+MODES.filter(function(m){return m[0]==='all'?(perm('langSlide')||perm('langQ')):okMode(m[0])}).map(function(m){return '<option value="'+m[0]+'"'+(mode()===m[0]?' selected':'')+'>'+m[1]+' — '+m[2]+'</option>'}).join('')+'</select></div>':'')+
    rows.map(function(r,i){return '<div class="sett-row"><p class="note"><b>'+r[1]+'</b> — '+r[2]+'</p><span class="seg sm" role="group" aria-label="Translate: '+r[1]+'"><button type="button" data-k="'+i+'" data-tr="1">On</button><button type="button" data-k="'+i+'" data-tr="0">Off</button></span></div>'}).join('');
  function paint(){Array.prototype.forEach.call(w.querySelectorAll('[data-tr]'),function(b){var on=(b.dataset.tr==='1')===isOnK(rows[+b.dataset.k][0]);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')})}
  var ms=w.querySelector('.trs-mode');if(ms)ms.onchange=function(){setMode(ms.value)};
  Array.prototype.forEach.call(w.querySelectorAll('[data-tr]'),function(b){b.onclick=function(){setOnK(rows[+b.dataset.k][0],b.dataset.tr==='1');paint()}});paint();return w});
function boot(){document.body.classList.toggle('trs-off',!isOn())}
window.addEventListener('hashchange',function(){if(document.body)boot()});
if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot);

/* the T button on each slide. What it does is chosen in Settings (owner 26 Oct 2026):
   "all" = the whole slide in Arabic under the title (the default); "lines" = the Arabic under each paragraph, line or table cell;
   "terms" = only the key terms: each glossary term in the slide gets its Arabic right under it. English stays the base in all three. */
var KEYM='st-trs-mode',MODES=[['all','Whole slide','the Arabic of the whole slide, under the title'],['lines','Line by line','the Arabic under each paragraph and line'],['terms','Key terms only','the Arabic under each key term in the text']];
function mode(){var v='all';try{v=localStorage.getItem(KEYM)||'all'}catch(e){}if(okMode(v))return v;return ['all','lines','terms'].filter(okMode)[0]||'all'}   // a choice the role no longer has falls to the first one it has
function setMode(v){try{localStorage.setItem(KEYM,v)}catch(e){}}
/* key terms: every glossary term of the open topics with its Arabic, longest first, in one pattern */
var TR=null;
function termRe(){var m={},list=[];
  (ST.glRows?ST.glRows():[]).forEach(function(r){var a=ST.glAr&&ST.glAr(r.k);if(!a)return;var en=strip(r.en);if(en.length<3)return;m[en.toLowerCase()]=a;list.push(en)});
  if(!list.length)return null;
  list.sort(function(a,b){return b.length-a.length});
  var re=new RegExp('\\b('+list.map(function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+')}).join('|')+')(?:es|s)?(?![A-Za-z])','gi');
  return {re:re,m:m}}
function arOf(t,w){var k=w.replace(/\s+/g,' ').toLowerCase();return t.m[k]||t.m[k.replace(/es$/,'')]||t.m[k.replace(/s$/,'')]||''}
var TSKIP='.gl-w,.trs-panel,.trs-ln,.trs-sl,ruby,button,svg,script,style,input,select,textarea,.anm-ctl,h2';
function wrapTerms(root,t){var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){var p=n.parentElement;return !p||p.closest(TSKIP)?2:1}}),ns=[],n,c=0;
  while((n=w.nextNode()))ns.push(n);
  ns.forEach(function(n){var v=n.nodeValue,m,i=0,f=null;t.re.lastIndex=0;
    while((m=t.re.exec(v))){var a=arOf(t,m[1]);if(!a)continue;f=f||document.createDocumentFragment();
      if(m.index>i)f.appendChild(document.createTextNode(v.slice(i,m.index)));
      var rb=document.createElement('ruby');rb.className='trs-rb';rb.appendChild(document.createTextNode(m[0]));
      var rt=document.createElement('rt');rt.lang='ar';rt.dir='rtl';rt.textContent=a;rb.appendChild(rt);f.appendChild(rb);i=m.index+m[0].length;c++}
    if(f){if(i<v.length)f.appendChild(document.createTextNode(v.slice(i)));n.parentNode.replaceChild(f,n)}});
  return c}
/* line by line: the blocks of a slide that hold words of their own (a paragraph, a list item, a table cell, a heading) */
var BLK='p,li,td,th,h3,h4,dt,dd,figcaption,.q,.qc-o,.why';
function blocks(root){return Array.prototype.filter.call(root.querySelectorAll(BLK),function(e){
  if(e.closest(TSKIP.replace(',ruby','').replace(',h2','')))return false;if(e.querySelector(BLK))return false;
  var t=(e.innerText||'').replace(/\s+/g,' ').trim();return t.length>2&&/[a-z]{2}/i.test(t)})}
var prevSlide=ST.deckSlide;
ST.deckSlide=function(sec,body0,t,s){if(prevSlide)prevSlide.apply(this,arguments);if(!allowedT())return;
  var pr=ST.isPractice&&ST.isPractice(s)&&s.t!=='trace';
  if(!isOn())return;var b=document.createElement('button');b.type='button';b.className='btn sm ghost trs-sl';
  var lab=pr?'ترجم السؤال':'ترجم الشريحة';b.textContent=lab;b.setAttribute('aria-expanded','false');
  var panel=null,where=inBank()?'bank':'lesson',open1=function(on){b.textContent=on?'إخفاء الترجمة':lab;b.setAttribute('aria-expanded',on?'true':'false')};
  var sb=function(){return sec.querySelector('.sb')||sec};
  var note=function(msg){var p=sec.querySelector('.trs-note');if(!p){p=document.createElement('p');p.className='trs-note';p.dir='rtl';p.lang='ar';b.insertAdjacentElement('afterend',p)}p.textContent=msg;setTimeout(function(){if(p.parentNode)p.parentNode.removeChild(p)},5000)};
  var doAll=function(){var text=slideText(sec,s);
    if(!canCall()){open(text);return}
    if(panel){var show=panel.hidden;panel.hidden=!show;open1(show);return}
    panel=document.createElement('div');panel.className='trs-panel';panel.dir='rtl';panel.lang='ar';panel.setAttribute('role','region');panel.setAttribute('aria-label','الترجمة');
    panel.innerHTML=WAIT;b.insertAdjacentElement('afterend',panel);open1(true);
    var ps=parts(text);
    translate(ps,where,'all').then(function(r){render(panel,{r:r,ps:ps,text:text,where:where})},function(){render(panel,{r:null,ps:ps,text:text,where:where})})};
  var doTerms=function(){if(sec.classList.contains('trs-t-on')){sec.classList.remove('trs-t-on');open1(false);return}
    var go=function(){if(!sec.__trT){var tr=termRe();if(!tr){note('ترجمة المصطلحات مش جاهزة دلوقتي. جرّب تاني بعد شوية.');return}sec.__trT=wrapTerms(sb(),tr)+1}
      if(sec.__trT===1)note('مفيش مصطلحات من الجلوسري في الشريحة دي.');sec.classList.add('trs-t-on');open1(true)};
    if(ST.glLoad&&!sec.__trT){b.disabled=true;Promise.resolve(ST.glLoad()).then(function(){b.disabled=false;go()},function(){b.disabled=false;go()})}else go()};
  var doLines=function(){if(sec.classList.contains('trs-l-on')){sec.classList.remove('trs-l-on');open1(false);return}
    sec.classList.add('trs-l-on');open1(true);if(sec.__trL)return;sec.__trL=1;
    var bs=blocks(sb()),txt=bs.map(function(e){return (e.innerText||'').replace(/\s+/g,' ').trim().slice(0,PART)});
    if(!bs.length){note('مفيش كلام إنجليزي في الشريحة دي.');return}
    if(!canCall()){open(txt.join('\n'));return}
    var outs=bs.map(function(e){var d=document.createElement(/^(TD|TH|LI)$/.test(e.tagName)?'span':'div');d.className='trs-ln';d.dir='rtl';d.lang='ar';d.innerHTML='<span class="trs-wait">…</span>';e.appendChild(d);return d});
    var chunk=function(i){if(i>=bs.length)return;var ps=txt.slice(i,i+PARTS);
      translate(ps,where,'lines').then(function(r){ps.forEach(function(_,j){var a=r&&r.ok&&r.ar&&r.ar[j];var o=outs[i+j];
          if(a)o.innerHTML=arHtml(a);else if(o.parentNode)o.parentNode.removeChild(o)});
        if(!(r&&r.ok)){note(failText(r));return}chunk(i+PARTS)},
        function(){outs.slice(i).forEach(function(o){if(o.parentNode)o.parentNode.removeChild(o)});note(failText(null))})};
    chunk(0)};
  b.onclick=function(){var m=mode();
    if(m!=='all'&&panel&&!panel.hidden){panel.hidden=true}
    if(m!=='terms')sec.classList.remove('trs-t-on');if(m!=='lines')sec.classList.remove('trs-l-on');
    (m==='terms'?doTerms:m==='lines'?doLines:doAll)()};
  var h2=sec.querySelector('h2');if(h2&&h2.parentNode===sec)h2.insertAdjacentElement('afterend',b);else sec.insertBefore(b,body0)};

/* the box under selected text */
function hidePop(){if(pop){pop.hidden=true;pop.innerHTML=''}}
function showPop(info){var text=info.text;
  if(!canCall()){open(text);return}
  if(!pop){pop=document.createElement('div');pop.className='trs-pop';pop.dir='rtl';pop.lang='ar';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','الترجمة');
    pop.addEventListener('mousedown',function(e){e.stopPropagation()});pop.addEventListener('touchstart',function(e){e.stopPropagation()},{passive:true});
    document.body.appendChild(pop)}
  var ps=parts(text),where=inBank()?'bank':'lesson';
  pop.innerHTML='<button type="button" class="trs-x" aria-label="إغلاق">✕</button><div class="trs-in">'+WAIT+'</div>';pop.hidden=false;
  pop.querySelector('.trs-x').onclick=hidePop;
  var vw=document.documentElement.clientWidth,w=Math.min(440,vw-16);pop.style.width=w+'px';
  var x=Math.max(8,Math.min(vw-w-8,info.rect.left+info.rect.width/2-w/2)),y=info.rect.bottom+8;
  pop.style.left=(x+window.scrollX)+'px';pop.style.top=(y+window.scrollY)+'px';
  var seq=pop.dataset.seq=String(Date.now());
  var fill=function(d){if(pop.dataset.seq!==seq||pop.hidden)return;var inn=pop.querySelector('.trs-in');if(inn){if(d)render(inn,d);else inn.innerHTML=WAIT}
    var r=pop.getBoundingClientRect();if(r.bottom>window.innerHeight-8&&info.rect.top>r.height+16)pop.style.top=(info.rect.top-r.height-8+window.scrollY)+'px'};
  fill(null);
  translate(ps,where,'sel').then(function(r){fill({r:r,ps:ps,text:text,where:where})},function(){fill({r:null,ps:ps,text:text,where:where})})}
document.addEventListener('mousedown',function(e){if(pop&&!pop.hidden&&!pop.contains(e.target)&&e.target!==fl)hidePop()});
document.addEventListener('touchstart',function(e){if(pop&&!pop.hidden&&!pop.contains(e.target)&&e.target!==fl)hidePop()},{passive:true});

/* floating button on any selected text inside the page */
function hideFl(){if(fl)fl.hidden=true}
function selInfo(){var sel=window.getSelection&&window.getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount)return null;
  var text=sel.toString().trim();if(text.length<2)return null;
  var r=sel.getRangeAt(0),n=r.commonAncestorContainer;if(n.nodeType===3)n=n.parentNode;
  var app=document.getElementById('app');if(!app||!app.contains(n))return null;
  if(n.closest&&n.closest('input,textarea,select,[contenteditable],.trs-panel,.trs-pop'))return null;
  var rect=r.getBoundingClientRect();if(!rect||(!rect.width&&!rect.height))return null;return {text:text,rect:rect}}
function place(){if(!allowedSel()||!isOn()){hideFl();return}var i=selInfo();if(!i){hideFl();return}
  if(!fl){fl=document.createElement('button');fl.type='button';fl.className='trs-fl';fl.textContent='ترجم';fl.hidden=true;
    fl.addEventListener('mousedown',function(e){e.preventDefault()});
    fl.onclick=function(){var j=selInfo();hideFl();if(j)showPop(j)};document.body.appendChild(fl)}
  fl.hidden=false;var w=fl.offsetWidth||80,vw=document.documentElement.clientWidth;
  var x=Math.max(8,Math.min(vw-w-8,i.rect.left+i.rect.width/2-w/2)),y=i.rect.bottom+10;
  if(y+44>window.innerHeight)y=Math.max(8,i.rect.top-44);
  fl.style.left=(x+window.scrollX)+'px';fl.style.top=(y+window.scrollY)+'px'}
document.addEventListener('selectionchange',function(){clearTimeout(tmr);tmr=setTimeout(place,280)});
window.addEventListener('resize',function(){hideFl();hidePop()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){hideFl();hidePop()}});
window.addEventListener('hashchange',function(){hideFl();hidePop()});
})();
