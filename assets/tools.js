/* START TIME — exam tools: an on-screen calculator like the basic one allowed in the CMA exam
   (add, subtract, multiply, divide, square root, percentage, memory) and present / future value tables.
   They open in small windows beside the question, from the slide's top bar (only where a slide needs them) or from Settings. */
(function(){
'use strict';
var ST=window.ST;if(!ST||!ST.h)return;
var $=ST.h.$,$$=ST.h.$$,el=ST.h.el,esc=ST.h.esc;

/* ---------- small windows that can be dragged by their title ---------- */
var Z=70;
function win(id,title,cls){var w=document.getElementById(id);if(w){w.hidden=false;w.style.zIndex=++Z;return w}
  w=el('div','xt-win '+(cls||''));w.id=id;w.setAttribute('role','dialog');w.setAttribute('aria-label',title);w.style.zIndex=++Z;
  w.innerHTML='<div class="xt-h"><b>'+esc(title)+'</b><button class="ib xt-x" type="button" aria-label="Close '+esc(title)+'"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="xt-b"></div>';
  document.body.appendChild(w);
  $('.xt-x',w).onclick=function(){w.hidden=true;paintBtns()};
  w.addEventListener('pointerdown',function(){w.style.zIndex=++Z});
  var h=$('.xt-h',w),sx=0,sy=0,ox=0,oy=0,drag=false;
  h.addEventListener('pointerdown',function(e){if(e.target.closest('button')||window.innerWidth<600)return;drag=true;var r=w.getBoundingClientRect();sx=e.clientX;sy=e.clientY;ox=r.left;oy=r.top;h.setPointerCapture(e.pointerId)});
  h.addEventListener('pointermove',function(e){if(!drag)return;var x=Math.max(0,Math.min(window.innerWidth-80,ox+e.clientX-sx)),y=Math.max(0,Math.min(window.innerHeight-40,oy+e.clientY-sy));
    w.style.left=x+'px';w.style.top=y+'px';w.style.right='auto';w.style.bottom='auto'});
  h.addEventListener('pointerup',function(){drag=false});
  return w}

/* ---------- calculator: works like a basic exam calculator (each operation runs as you go) ---------- */
var C={cur:'0',acc:null,op:null,fresh:true,mem:0,last:null,err:false,line:''};
function rnd(x){return isFinite(x)?parseFloat(x.toPrecision(12)):NaN}
function calcOp(a,op,b){return rnd(op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:b===0?NaN:a/b)}
function show(v){if(!isFinite(v)){C.err=true;return 'Error'}var s=String(rnd(v));if(/e/.test(s))return s;
  var p=s.split('.'),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');return i+(p.length>1?'.'+p[1]:'')}
var SYM={'+':'+','-':'−','*':'×','/':'÷'};
function press(k){if(C.err&&k!=='C')return;var v=parseFloat(C.cur);
  if(/^[0-9]$/.test(k)){if(C.fresh){C.cur=k;C.fresh=false}else if(C.cur.replace(/[-.]/g,'').length<14)C.cur=C.cur==='0'?k:C.cur+k}
  else if(k==='.'){if(C.fresh){C.cur='0.';C.fresh=false}else if(C.cur.indexOf('.')<0)C.cur+='.'}
  else if(SYM[k]){if(C.op&&!C.fresh&&C.acc!==null){C.acc=calcOp(C.acc,C.op,v)}else if(C.acc===null||!C.op||!C.fresh)C.acc=v;C.op=k;C.fresh=true;C.last=null;C.line=show(C.acc)+' '+SYM[k];C.cur=String(C.acc)}
  else if(k==='='){if(C.op&&C.acc!==null){var b=C.fresh&&C.last?C.last[1]:v;C.last=[C.op,b];C.line=show(C.acc)+' '+SYM[C.op]+' '+show(b)+' =';C.cur=String(calcOp(C.acc,C.op,b));C.acc=null;C.op=null}
    else if(C.last){C.line=show(v)+' '+SYM[C.last[0]]+' '+show(C.last[1])+' =';C.cur=String(calcOp(v,C.last[0],C.last[1]))}C.fresh=true}
  else if(k==='%'){var pc=C.op==='+'||C.op==='-'?rnd((C.acc||0)*v/100):rnd(v/100);C.cur=String(pc);C.fresh=true}
  else if(k==='√'){C.line='√('+show(v)+')';C.cur=String(v<0?NaN:rnd(Math.sqrt(v)));C.fresh=true}
  else if(k==='±'){if(C.cur!=='0')C.cur=C.cur.charAt(0)==='-'?C.cur.slice(1):'-'+C.cur}
  else if(k==='⌫'){if(!C.fresh){C.cur=C.cur.length>1&&C.cur!=='-0'?C.cur.slice(0,-1):'0';if(C.cur==='-')C.cur='0'}}
  else if(k==='CE'){C.cur='0';C.fresh=true}
  else if(k==='C'){C={cur:'0',acc:null,op:null,fresh:true,mem:C.mem,last:null,err:false,line:''}}
  else if(k==='MC')C.mem=0;else if(k==='MR'){C.cur=String(C.mem);C.fresh=true}
  else if(k==='M+'){C.mem=rnd(C.mem+v);C.fresh=true}else if(k==='M-'){C.mem=rnd(C.mem-v);C.fresh=true}
  if(isNaN(parseFloat(C.cur)))C.err=true;
  paintCalc()}
function paintCalc(){var w=document.getElementById('xtCalc');if(!w)return;
  $('.cc-l',w).textContent=C.line||' ';
  $('.cc-v',w).textContent=C.err?'Error':(C.fresh?show(parseFloat(C.cur)):C.cur.replace(/^(-?)(\d+)/,function(m,s,i){return s+i.replace(/\B(?=(\d{3})+(?!\d))/g,',')}));
  $('.cc-m',w).textContent=C.mem?'M':''}
var KEYS=[['MC','MR','M-','M+','√'],['7','8','9','÷','C'],['4','5','6','×','CE'],['1','2','3','−','⌫'],['±','0','.','+','%'],['=']];
var MAP={'÷':'/','×':'*','−':'-'};
function calc(){var w=win('xtCalc','Calculator','xt-calc');
  if(!$('.cc',w)){$('.xt-b',w).innerHTML='<div class="cc"><div class="cc-d"><div class="cc-l"></div><div class="cc-v" aria-live="polite"></div><span class="cc-m"></span></div><div class="cc-k">'+
    KEYS.map(function(r){return r.map(function(k){var v=MAP[k]||k;return '<button type="button" data-k="'+esc(v)+'" class="'+(SYM[v]||k==='='?'op':/^M/.test(k)?'mem':/^(C|CE|⌫)$/.test(k)?'fn':'')+(k==='='?' eq':'')+'">'+k+'</button>'}).join('')}).join('')+
    '</div><p class="note cc-n">Like the basic calculator allowed in the exam. Keyboard works too: numbers, + − * /, Enter, Backspace, Esc to clear.</p></div>';
    $$('.cc-k button',w).forEach(function(b){b.onclick=function(){press(b.dataset.k)}})}
  paintCalc();paintBtns();return w}
window.addEventListener('keydown',function(e){var w=document.getElementById('xtCalc');if(!w||w.hidden||e.ctrlKey||e.metaKey||e.altKey)return;
  var tg=e.target&&e.target.tagName;if(/INPUT|SELECT|TEXTAREA/.test(tg)||!$('#modal').hidden)return;
  var k=e.key,m={'Enter':'=','=':'=','Backspace':'⌫','Delete':'CE','Escape':'C',',':'.'}[k]||k;
  if(/^[0-9]$/.test(m)||m==='.'||SYM[m]||m==='='||m==='⌫'||m==='CE'||m==='C'||m==='%'){e.preventDefault();e.stopPropagation();press(m)}},true);

/* ---------- present and future value tables: worked out here, 4 decimals ---------- */
var RATES=[1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,18,20],NS=[];for(var n=1;n<=20;n++)NS.push(n);NS.push(25,30);
var TB=[['pv1','PV of $1','1 ÷ (1 + r)ⁿ','What 1 received after n periods is worth today',function(r,n){return Math.pow(1+r,-n)}],
  ['pva','PV of an annuity of $1','[1 − (1 + r)⁻ⁿ] ÷ r','What 1 at the end of each period for n periods is worth today (ordinary annuity)',function(r,n){return (1-Math.pow(1+r,-n))/r}],
  ['pvad','PV of an annuity due of $1','PV annuity × (1 + r)','Payments at the start of each period (for example a lease paid in advance)',function(r,n){return (1-Math.pow(1+r,-n))/r*(1+r)}],
  ['fv1','FV of $1','(1 + r)ⁿ','What 1 today grows to after n periods',function(r,n){return Math.pow(1+r,n)}],
  ['fva','FV of an annuity of $1','[(1 + r)ⁿ − 1] ÷ r','What 1 at the end of each period grows to after n periods',function(r,n){return (Math.pow(1+r,n)-1)/r}]];
var TS={t:'pv1',r:'',n:''};
function f4(x){return x.toFixed(4)}
function tables(which){var w=win('xtTab','Present & future value tables','xt-tab');if(which)TS.t=which;
  var T=TB.filter(function(x){return x[0]===TS.t})[0]||TB[0];
  $('.xt-b',w).innerHTML='<div class="tb-tabs" role="tablist">'+TB.map(function(x){return '<button type="button" role="tab" aria-selected="'+(x[0]===T[0])+'" data-t="'+x[0]+'" class="'+(x[0]===T[0]?'on':'')+'">'+x[1].replace(' of $1','').replace('an annuity','annuity')+'</button>'}).join('')+'</div>'+
    '<div class="tb-f"><b>'+T[1]+'</b> = '+T[2]+'<span class="note">'+T[3]+'. r = rate per period, n = periods.</span></div>'+
    '<div class="tb-q"><label>Rate % <input class="inp" id="tbR" inputmode="decimal" value="'+esc(TS.r)+'" aria-label="Rate per period, percent"></label><label>Periods <input class="inp" id="tbN" inputmode="numeric" value="'+esc(TS.n)+'" aria-label="Number of periods"></label><span class="tb-a" id="tbA"></span></div>'+
    '<div class="tb-w"><table class="tb"><thead><tr><th>n</th>'+RATES.map(function(r){return '<th data-r="'+r+'">'+r+'%</th>'}).join('')+'</tr></thead><tbody>'+
    NS.map(function(n){return '<tr data-n="'+n+'"><th>'+n+'</th>'+RATES.map(function(r){return '<td data-r="'+r+'">'+f4(T[4](r/100,n))+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'+
    '<p class="note">Tap a factor to mark its row and column. Amount × factor = the value. Factors are rounded to 4 decimals.</p>';
  $$('.tb-tabs button',w).forEach(function(b){b.onclick=function(){tables(b.dataset.t)}});
  var R=$('#tbR',w),N=$('#tbN',w),A=$('#tbA',w),tb=$('table.tb',w);
  function mark(r,n){$$('.hl,.hx',tb).forEach(function(c){c.classList.remove('hl','hx')});
    $$('td[data-r="'+r+'"],th[data-r="'+r+'"]',tb).forEach(function(c){c.classList.add('hx')});
    var tr=tb.querySelector('tr[data-n="'+n+'"]');if(tr){$$('td,th',tr).forEach(function(c){c.classList.add('hx')});var c=tr.querySelector('td[data-r="'+r+'"]');if(c){c.classList.add('hl');c.scrollIntoView({block:'nearest',inline:'nearest'})}}}
  function look(){TS.r=R.value;TS.n=N.value;var r=parseFloat(String(R.value).replace(',','.')),n=parseInt(N.value,10);
    if(!(r>0&&r<=100)||!(n>=1&&n<=100)){A.textContent='';return}
    A.innerHTML='Factor <b>'+T[4](r/100,n).toFixed(5)+'</b>';mark(r,n)}
  R.oninput=look;N.oninput=look;look();
  tb.addEventListener('click',function(e){var c=e.target.closest('td');if(!c)return;var n=c.parentNode.getAttribute('data-n'),r=c.getAttribute('data-r');R.value=r;N.value=n;look()});
  paintBtns();return w}

/* ---------- which slides get the buttons: practice and numeric slides get the calculator; time-value wording gets the tables ---------- */
var TVM=/present value|\bPV\b|annuit|discount(ed|ing)? (rate|at)|future value|effective[- ]interest|market rate of interest|time value|implicit rate|incremental borrowing rate/i;
function text(s){var o=[s.h,s.q,s.body,s.e];if(s.o)o=o.concat(s.o);if(s.f&&s.f.forEach)s.f.forEach(function(f){o.push(f.l)});return o.filter(function(x){return typeof x==='string'}).join(' ').replace(/<[^>]*>/g,' ')}
function need(s){var t=s.tools||[],x=text(s);return {calc:t.indexOf('calc')>=0||ST.isPractice(s)||s.t==='num'||s.t==='lab',pv:t.indexOf('pv')>=0||TVM.test(x)}}
var IC_C='<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>';
var IC_T='<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="3"/><text x="12" y="15.6" text-anchor="middle" font-size="8.5" font-weight="700" font-family="Inter,Arial,sans-serif" fill="currentColor" stroke="none">PV</text></svg>';
function paintBtns(){var c=document.getElementById('xtCalc'),t=document.getElementById('xtTab');
  $$('.xt-bc').forEach(function(b){b.classList.toggle('on',!!c&&!c.hidden)});$$('.xt-bt').forEach(function(b){b.classList.toggle('on',!!t&&!t.hidden)})}
var prevTop=ST.deckTop;
ST.deckTop=function(top,t,idx){if(prevTop)prevTop(top,t,idx);var s=t.slides[idx],nd=need(s);
  if(nd.pv){var b2=el('button','ib xt-bt',IC_T);b2.type='button';b2.title='Present & future value tables';b2.setAttribute('aria-label','Present and future value tables');b2.onclick=function(){var w=document.getElementById('xtTab');if(w&&!w.hidden){w.hidden=true;paintBtns()}else tables()};top.appendChild(b2)}
  if(nd.calc){var b=el('button','ib xt-bc',IC_C);b.type='button';b.title='Calculator';b.setAttribute('aria-label','Calculator');b.onclick=function(){var w=document.getElementById('xtCalc');if(w&&!w.hidden){w.hidden=true;paintBtns()}else calc()};top.appendChild(b)}
  paintBtns()};
ST.tools={calc:calc,tables:tables,need:need};
})();
