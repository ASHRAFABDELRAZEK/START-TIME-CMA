/* START TIME — "Translate" help, with two permissions on the Roles sheet:
   "language" = the lessons (lesson slides, home, maps, print) and "langBank" = the question bank (#/bank, sets, mistakes,
   the bank part of a topic, any question inside a set or review — core.js sets ST.inBank on each slide).
   Select any text → a small button opens Google Translate (English → Arabic) in a new tab.
   Each slide also gets a "translate this slide / question" button. It is turned on or off in Settings
   (remembered on this device; off until turned on). Nothing shows where the person has no permission. */
(function(){
var ST=window.ST;if(!ST)return;
var KEY='st-trs',KEYB='st-trs-b',MAX=4500,fl=null,tmr=null;
function perm(k){try{return !!(ST.canStaff&&ST.canStaff(k))||!!(ST.can&&ST.can(k))}catch(e){return false}}
function inBank(){var h=location.hash||'';if(/^#\/(bank|practice|mistakes|set-result)(\/|$)/.test(h))return true;return /^#\/t\//.test(h)&&!!ST.inBank}
function allowed(){return perm(inBank()?'langBank':'language')}          // here, on this page or slide
function allowedAny(){return perm('language')||perm('langBank')}
function isOnK(k){var v='0';try{v=localStorage.getItem(k)||'0'}catch(e){}return v==='1'}
function isOn(){return isOnK(inBank()?KEYB:KEY)}                        // the switch for where the person is now: lessons or question bank
function setOnK(k,v){try{localStorage.setItem(k,v?'1':'0')}catch(e){}boot();if(!v)hideFl()}
function strip(h){var d=document.createElement('div');d.innerHTML=h==null?'':String(h);return (d.textContent||'').replace(/\s+/g,' ').trim()}
function open(text){text=String(text||'').trim();if(!text)return;if(text.length>MAX)text=text.slice(0,MAX);
  window.open('https://translate.google.com/?sl=en&tl=ar&op=translate&text='+encodeURIComponent(text),'_blank','noopener')}
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
  var b=sec.querySelector('.sb');return h+(b?(b.innerText||'').replace(/\n{3,}/g,'\n\n').trim():'')}

/* on / off in Settings — shown only to roles with the permission; off until turned on */
(ST.settingsExtra=ST.settingsExtra||[]).push(function(){if(!allowedAny())return null;
  var rows=[];if(perm('language'))rows.push([KEY,'Lessons','the explanation slides']);if(perm('langBank'))rows.push([KEYB,'Question bank','the questions in the bank, sets and mistakes']);
  var w=document.createElement('div');w.innerHTML='<h3 class="sett-h">Translate</h3><p class="note">Select any English text, or use the button under a slide title, to open Google Translate (English → Arabic) in a new tab. Each part has its own switch.</p>'+
    rows.map(function(r,i){return '<p class="note" style="margin:.6em 0 .3em"><b>'+r[1]+'</b> — '+r[2]+'</p><div class="apx-r"><span class="seg sm" role="group" aria-label="Translate: '+r[1]+'"><button type="button" data-k="'+i+'" data-tr="1">On</button><button type="button" data-k="'+i+'" data-tr="0">Off</button></span></div>'}).join('');
  function paint(){Array.prototype.forEach.call(w.querySelectorAll('[data-tr]'),function(b){var on=(b.dataset.tr==='1')===isOnK(rows[+b.dataset.k][0]);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')})}
  Array.prototype.forEach.call(w.querySelectorAll('[data-tr]'),function(b){b.onclick=function(){setOnK(rows[+b.dataset.k][0],b.dataset.tr==='1');paint()}});paint();return w});
function boot(){document.body.classList.toggle('trs-off',!isOn())}
window.addEventListener('hashchange',function(){if(document.body)boot()});
if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot);

/* "translate this slide / question" under the slide title */
var prevSlide=ST.deckSlide;
ST.deckSlide=function(sec,body,t,s){if(prevSlide)prevSlide.apply(this,arguments);if(!allowed())return;
  var pr=ST.isPractice&&ST.isPractice(s)&&s.t!=='trace';
  if(!isOn())return;var b=document.createElement('button');b.type='button';b.className='btn sm ghost trs-sl';b.textContent=pr?'ترجم السؤال ↗':'ترجم الشريحة ↗';
  b.title='يفتح ترجمة جوجل في نافذة جديدة';b.onclick=function(){open(slideText(sec,s))};
  var h2=sec.querySelector('h2');if(h2&&h2.parentNode===sec)h2.insertAdjacentElement('afterend',b);else sec.insertBefore(b,body)};

/* floating button on any selected text inside the page */
function hideFl(){if(fl)fl.hidden=true}
function selInfo(){var sel=window.getSelection&&window.getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount)return null;
  var text=sel.toString().trim();if(text.length<2)return null;
  var r=sel.getRangeAt(0),n=r.commonAncestorContainer;if(n.nodeType===3)n=n.parentNode;
  var app=document.getElementById('app');if(!app||!app.contains(n))return null;
  if(n.closest&&n.closest('input,textarea,select,[contenteditable]'))return null;
  var rect=r.getBoundingClientRect();if(!rect||(!rect.width&&!rect.height))return null;return {text:text,rect:rect}}
function place(){if(!allowed()||!isOn()){hideFl();return}var i=selInfo();if(!i){hideFl();return}
  if(!fl){fl=document.createElement('button');fl.type='button';fl.className='trs-fl';fl.textContent='ترجم ↗';fl.hidden=true;
    fl.addEventListener('mousedown',function(e){e.preventDefault()});
    fl.onclick=function(){var j=selInfo();if(j)open(j.text);hideFl()};document.body.appendChild(fl)}
  fl.hidden=false;var w=fl.offsetWidth||80,vw=document.documentElement.clientWidth;
  var x=Math.max(8,Math.min(vw-w-8,i.rect.left+i.rect.width/2-w/2)),y=i.rect.bottom+10;
  if(y+44>window.innerHeight)y=Math.max(8,i.rect.top-44);
  fl.style.left=(x+window.scrollX)+'px';fl.style.top=(y+window.scrollY)+'px'}
document.addEventListener('selectionchange',function(){clearTimeout(tmr);tmr=setTimeout(place,280)});
window.addEventListener('resize',hideFl);
document.addEventListener('keydown',function(e){if(e.key==='Escape')hideFl()});
window.addEventListener('hashchange',hideFl);
})();
