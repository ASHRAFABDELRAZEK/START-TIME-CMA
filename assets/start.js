/* START TIME — "Start here": an introduction to the CMA before Section A, and the exam calendar (icon in the top bar).
   Facts follow ICMA's CMA Handbook (© 2024) and IMA's published grading information; checked 11/10/2026.
   The calendar computes the recurring testing windows; ST.EXAMDATA (later filled from the sheet) can override or add notices.
   Loaded after core.js and fun.js. */
(function(){
var ST=window.ST;if(!ST||!ST.h)return;
var el=ST.h.el,$=ST.h.$,$$=ST.h.$$,esc=ST.h.esc;
var CHECKED='11/10/2026';
function st(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}

/* ---------- exam calendar ---------- */
var WIN=[['January–February',0,2,1],['May–June',4,6,5],['September–October',8,10,9]];   // name, opening month, month after closing, registration month (closes after the 15th)
function day0(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function dmy(d){return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear()}
function days(a,b){return Math.round((day0(b)-day0(a))/864e5)}
function windowsFrom(y){var out=[];for(var yy=y-1;yy<=y+2;yy++)WIN.forEach(function(w){out.push({n:w[0]+' '+yy,open:new Date(yy,w[1],1),close:new Date(yy,w[2],0),reg:new Date(yy,w[3],15)})});return out}
function cal(now){now=day0(now||new Date());var W=windowsFrom(now.getFullYear()),cur=null,next=[];
  W.forEach(function(w){if(w.open<=now&&now<=w.close)cur=w;else if(w.open>now)next.push(w)});
  next.sort(function(a,b){return a.open-b.open});
  var mine=st('st-exam-date'),md=null;if(mine){var p=mine.split('-');md=new Date(+p[0],+p[1]-1,+p[2]);if(isNaN(md)||md<now)md=null}
  return {now:now,cur:cur,next:next,mine:md}}
ST.examCal=cal;
function badge(){var c=cal();
  if(c.mine)return {t:String(days(c.now,c.mine)),tip:'Your exam in '+days(c.now,c.mine)+' days'};
  if(c.cur)return {t:'Open',tip:'A testing window is open now'};
  return {t:String(days(c.now,c.next[0].open)),tip:'Next testing window opens in '+days(c.now,c.next[0].open)+' days'}}
function paintBadge(){var b=$('#nExam');if(!b)return;var x=badge();$('.exb',b).textContent=x.t;b.title=x.tip+' — exam calendar';b.setAttribute('aria-label',x.tip+'. Open the exam calendar')}
function calBox(compact){var c=cal(),n=c.next[0],box=el('div','exc');
  var h='';
  if(c.mine)h+='<div class="exc-me"><b>'+days(c.now,c.mine)+'</b><span>days to <b>your exam</b> on '+dmy(c.mine)+'</span></div>'+(inWin(c.mine)?'':'<p class="exc-msg warn">'+dmy(c.mine)+' is outside the testing windows — check the day and the month below.</p>');
  if(c.cur){var dr=days(c.now,c.cur.reg),dc=days(c.now,c.cur.close);
    h+='<div class="exc-row on"><span class="dot"></span><div><b>Testing window open now: '+c.cur.n+'</b><br>'+(dr>=0?'Registration for this window closes after <b>'+dmy(c.cur.reg)+'</b> — '+(dr===0?'today is the last day':'<b>'+dr+'</b> day'+(dr===1?'':'s')+' left')+'. ':'Registration for this window has closed. ')+'The window ends on '+dmy(c.cur.close)+' (in '+dc+' day'+(dc===1?'':'s')+').</div></div>'}
  h+='<div class="exc-row"><span class="dot n"></span><div><b>Next window: '+n.n+'</b><br>Opens in <b>'+days(c.now,n.open)+'</b> days ('+dmy(n.open)+'). Register by '+dmy(n.reg)+'.</div></div>';
  if(!compact){
    h+='<div class="tw exc-tw"><table class="t"><tr><th>Testing window</th><th class="n">First exam day</th><th class="n">Last day to register</th><th class="n">Last exam day</th></tr>'+
      c.next.slice(0,4).map(function(w){return '<tr><td>'+w.n+'</td><td class="n" data-l="First exam day">'+dmy(w.open)+'</td><td class="n" data-l="Register by">'+dmy(w.reg)+'</td><td class="n" data-l="Last exam day">'+dmy(w.close)+'</td></tr>'}).join('')+'</table></div>'+
      '<p class="note exc-how"><b>How the three dates work:</b> register for the window with IMA by the <b>last day to register</b>; IMA then sends you the authorization to book a seat with Prometric, and you sit the exam on any open day between the <b>first</b> and the <b>last exam day</b>. Register and book early — seats near the end of a window fill up first.</p>';
    var N=(ST.EXAMDATA&&ST.EXAMDATA.news)||[];
    if(N.length)h+='<h4>Latest updates</h4><ul class="exc-news">'+N.map(function(x){return '<li><b>'+esc(x.d||'')+'</b> '+esc(x.t||'')+(x.u?' — <a href="'+esc(x.u)+'" target="_blank" rel="noopener">source</a>':'')+'</li>'}).join('')+'</ul>';
    h+=pickHtml()+
      '<p class="note">Once you book your appointment with Prometric, save the date here and the counter in the top bar counts down to your own exam. Saved on this device only.</p>'+
      '<p class="note">Windows and deadlines follow ICMA\'s published schedule; last checked '+CHECKED+'. Always confirm on <a href="https://www.imanet.org" target="_blank" rel="noopener">imanet.org</a> and in your Prometric appointment. <a href="#/start/exam">How the exam works</a></p>'}
  box.innerHTML=h;
  if(!compact)wirePick(box);
  return box}
/* my exam date: day / month / year lists, so the order is always dd/mm/yyyy whatever the browser's language */
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function inWin(d){return WIN.some(function(w){var o=new Date(d.getFullYear(),w[1],1),c=new Date(d.getFullYear(),w[2],0);return d>=o&&d<=c})}
function pickHtml(){var v=(st('st-exam-date')||'').split('-'),y0=new Date().getFullYear(),opt=function(a,sel){return a.map(function(x){return '<option value="'+x[0]+'"'+(String(x[0])===String(sel)?' selected':'')+'>'+x[1]+'</option>'}).join('')};
  var D=[['','Day']],M=[['','Month']],Y=[['','Year']];for(var i=1;i<=31;i++)D.push([i,('0'+i).slice(-2)]);MON.forEach(function(m,i){M.push([i+1,('0'+(i+1)).slice(-2)+' · '+m])});for(var k=y0;k<=y0+3;k++)Y.push([k,k]);
  return '<div class="exc-mine"><span class="lb" id="exLb">My exam date</span><span class="exc-dmy" role="group" aria-labelledby="exLb">'+
    '<select id="exD" aria-label="Day">'+opt(D,v[2]?+v[2]:'')+'</select><span>/</span><select id="exM" aria-label="Month">'+opt(M,v[1]?+v[1]:'')+'</select><span>/</span><select id="exY" aria-label="Year">'+opt(Y,v[0]?+v[0]:'')+'</select></span>'+
    '<button class="btn sm" type="button" id="exSave">Save</button>'+(st('st-exam-date')?'<button class="btn sm ghost" type="button" id="exClear">Clear</button>':'')+'<div class="exc-msg" id="exMsg" role="status"></div></div>'}
function wirePick(box){var sv=$('#exSave',box),cl=$('#exClear',box),msg=$('#exMsg',box),warned='';
  function re(){paintBadge();ST.modal('Exam calendar',calBox())}
  ['#exD','#exM','#exY'].forEach(function(s){$(s,box).onchange=function(){warned='';sv.textContent='Save';msg.textContent='';msg.className='exc-msg'}});
  sv.onclick=function(){var d=+$('#exD',box).value,m=+$('#exM',box).value,y=+$('#exY',box).value,say=function(x,c){msg.textContent=x;msg.className='exc-msg '+(c||'')};
    if(!d||!m||!y)return say('Choose the day, the month and the year.','bad');
    var dt=new Date(y,m-1,d);if(dt.getMonth()!==m-1)return say(('0'+d).slice(-2)+'/'+('0'+m).slice(-2)+'/'+y+' is not a real date.','bad');
    if(dt<day0(new Date()))return say('That date has already passed.','bad');
    var key=y+'-'+('0'+m).slice(-2)+'-'+('0'+d).slice(-2);
    if(!inWin(dt)&&warned!==key){warned=key;sv.textContent='Save anyway';return say(dmy(dt)+' is outside the testing windows (January–February, May–June, September–October). Check the date on your Prometric appointment.','warn')}
    st('st-exam-date',key);re()};
  if(cl)cl.onclick=function(){st('st-exam-date',null);re()}}
ST.examCalendar=function(){ST.modal('Exam calendar',calBox())};
function addIcon(){var nav=$('.top-act');if(!nav||$('#nExam'))return;
  var b=el('button','ib exi','<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg><span class="exb"></span>');
  b.id='nExam';b.type='button';b.onclick=ST.examCalendar;nav.insertBefore(b,$('#nHelp'));paintBadge()}

/* ---------- Start here: seven animated steps ---------- */
var RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
function party(){if(ST.fun&&ST.fun.confetti&&!RM)ST.fun.confetti()}
function countUp(node,to,ms,fmt){fmt=fmt||function(v){return Math.round(v)};if(RM){node.textContent=fmt(to);return}
  var t0=null;function f(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);node.textContent=fmt(to*e);if(k<1&&document.body.contains(node))requestAnimationFrame(f)}requestAnimationFrame(f)}
var P1=[['A','External Financial Reporting Decisions',15,'Read the four financial statements and watch one transaction move all of them.'],
 ['B','Planning, Budgeting, and Forecasting',20,'Build budgets and forecasts — and rebuild them when the plan changes.'],
 ['C','Performance Management',20,'Explain why results differ from the plan, and judge each manager fairly.'],
 ['D','Cost Management',15,'Find what a product really costs, and make processes cheaper and better.'],
 ['E','Internal Controls',15,'Design the controls that protect assets, records and systems.'],
 ['F','Technology and Analytics',15,'Use systems, data and analytics to support decisions.']];
var P2=[['A','Financial Statement Analysis',20,'Judge a company\'s health with ratios and comparisons.'],
 ['B','Corporate Finance',20,'Risk and return, financing, and managing working capital.'],
 ['C','Business Decision Analysis',25,'Price, make or buy, product mix — decide with numbers.'],
 ['D','Enterprise Risk Management',10,'Find and manage the risks a business faces.'],
 ['E','Capital Investment Decisions',10,'Evaluate investments with cash flows, NPV and IRR.'],
 ['F','Professional Ethics',15,'Apply professional ethics to real dilemmas.']];
var REQ=[['Join IMA','Become an IMA member and keep the membership active.'],['Pay the CMA entrance fee','Paid once, before you sit the exams; it starts your three-year window to pass both parts.'],['Pass Part 1 and Part 2','Both parts, within three years of entering the program.'],['A bachelor\'s degree or an approved professional certification','You can sit the exams first; the proof can follow later.'],['Two years of relevant experience','Continuous management accounting or financial management work, before or within seven years after passing.'],['Follow IMA\'s ethics standard','The Statement of Ethical Professional Practice — and 30 hours of continuing education a year once certified, 2 of them on ethics.']];
var CERTS={CMA:['IMA (USA, global)','Planning, performance, cost and decision support inside organizations','Corporate finance teams: budgeting, cost, FP&amp;A, controllership'],
 CPA:['US state boards of accountancy (Uniform CPA Examination)','Audit, financial reporting and tax, with a US licence to practise','Public accounting, audit and tax, especially in the US'],
 ACCA:['Association of Chartered Certified Accountants (UK, global)','A broad route through reporting, audit, tax, management and strategy','Accounting, audit and finance roles in the many countries that recognize it'],
 CIMA:['Chartered Institute of Management Accountants (UK, with AICPA; CGMA)','Management accounting linked to business strategy','Management accounting and business partnering in UK-linked markets'],
 CFA:['CFA Institute (USA, global)','Investment analysis, portfolio management and ethics','Investment, asset management and securities research']};
var FITQ=[['Where do you see yourself working?',[['In a company\'s finance team',{CMA:2,CIMA:2,ACCA:1}],['In an audit or tax firm',{CPA:2,ACCA:2}],['In investment or asset management',{CFA:3}],['Not sure yet',{CMA:1,CPA:1,ACCA:1,CIMA:1,CFA:1}]]],
 ['Which work excites you most?',[['Plans, budgets, costs and decisions',{CMA:2,CIMA:2}],['Auditing and financial reporting',{CPA:2,ACCA:2}],['Valuing companies and markets',{CFA:3}],['Tax rules and compliance',{CPA:2,ACCA:1}]]],
 ['Which kind of recognition matters most to you?',[['Global companies and multinationals',{CMA:2,ACCA:1,CFA:1}],['UK and Commonwealth markets',{ACCA:2,CIMA:2}],['A licence to practise in the US',{CPA:3}],['The global investment industry',{CFA:2}]]]];
var ROLES=[['Cost accountant','Works out what products and services really cost, and keeps the costing system honest.','CD'],
 ['Budget and FP&amp;A analyst','Builds budgets and forecasts, and explains the gap between plan and actual.','BC'],
 ['Financial analyst','Reads statements, models scenarios and supports investment decisions.','ABF'],
 ['Financial controller','Runs reporting, the accounting team and the internal controls.','ACE'],
 ['Head of finance / CFO','Leads finance strategy, performance and risk for the whole organization.','BCEF']];

/* drawings (original, simple shapes) */
var NAV='<svg viewBox="0 0 120 120" class="stp-av" aria-hidden="true"><circle cx="60" cy="60" r="56" class="av-bg"/><circle cx="48" cy="44" r="13" class="av-sk"/><path d="M26 104c2-22 12-34 22-34s20 12 22 34z" class="av-b1"/>'+
 '<g class="av-tel"><rect x="56" y="54" width="44" height="10" rx="4" transform="rotate(-28 56 59)" class="av-b2"/><rect x="92" y="34" width="10" height="14" rx="3" transform="rotate(-28 97 41)" class="av-b2"/></g><circle cx="104" cy="30" r="4" class="av-glint"/></svg>';
var HIS='<svg viewBox="0 0 120 120" class="stp-av" aria-hidden="true"><circle cx="60" cy="60" r="56" class="av-bg"/><circle cx="60" cy="42" r="13" class="av-sk"/><path d="M36 104c2-22 12-34 24-34s22 12 24 34z" class="av-b1"/>'+
 '<rect x="34" y="70" width="26" height="22" rx="2" class="av-pg"/><rect x="60" y="70" width="26" height="22" rx="2" class="av-pg"/><rect x="60" y="70" width="26" height="22" rx="2" class="av-flip"/>'+
 '<path d="M39 76h16M39 81h16M39 86h12M65 76h16M65 81h16" class="av-ln"/></svg>';

function stepWhat(b){
  b.innerHTML='<div class="stp-stats">'+[[2,'parts'],[12,'sections'],[4,'hours per exam'],[360,'of 500 to pass']].map(function(x){return '<div class="stp-stat"><b data-to="'+x[0]+'">0</b><span>'+x[1]+'</span></div>'}).join('')+'</div>'+
   '<p>The <b>Certified Management Accountant (CMA)</b> is the certification of the <b>Institute of Management Accountants (IMA)</b>. It shows you can do the finance work done <b>inside</b> organizations — planning, analyzing performance, managing costs and risk, and supporting decisions, ethically.</p>'+
   '<div class="seg" role="group" aria-label="Part"><button type="button" data-p="1" class="on">Part 1 · Financial Planning, Performance, and Analytics</button><button type="button" data-p="2">Part 2 · Strategic Financial Management</button></div>'+
   '<div class="stp-tiles"></div><p class="note">Tap a section to flip it. Weights from ICMA\'s Learning Outcome Statements effective 1 September 2024. You are starting Part 1.</p>';
  $$('.stp-stat b',b).forEach(function(n,i){setTimeout(function(){countUp(n,+n.dataset.to,900)},i*180)});
  var T=$('.stp-tiles',b);
  function draw(p){var R=p==='1'?P1:P2;T.innerHTML=R.map(function(r,i){return '<button type="button" class="stp-tile" style="--d:'+(i*70)+'ms"><span class="in"><span class="f"><b>'+r[0]+'</b><i>'+r[1]+'</i><em><s style="--w:'+(r[2]*4)+'%"></s></em><small>'+r[2]+'% of the exam</small></span><span class="k"><b>'+r[0]+'</b>'+r[3]+'</span></span></button>'}).join('');
    $$('.stp-tile',T).forEach(function(t){t.onclick=function(){t.classList.toggle('fl')}})}
  $$('[data-p]',b).forEach(function(x){x.onclick=function(){$$('[data-p]',b).forEach(function(y){y.classList.toggle('on',y===x)});draw(x.dataset.p)}});draw('1')}

function stepRoles(b){
  var L={m:[['Works for','Managers inside the company'],['Looks','Forward — plans and decisions'],['Rules','Whatever helps the decision'],['Typical work','Budgets, forecasts, costs, variances']],
         f:[['Works for','Investors, lenders and regulators outside it'],['Looks','Back — what happened, fairly reported'],['Rules','US GAAP or IFRS'],['Typical work','Financial statements and their notes']]};
  b.innerHTML='<p>Same numbers, two different jobs. Tap each one:</p><div class="stp-duo"><button type="button" class="stp-who on" data-w="m">'+NAV+'<b>Management accountant</b><small>the navigator</small></button>'+
   '<button type="button" class="stp-who" data-w="f">'+HIS+'<b>Financial accountant</b><small>the historian</small></button></div><div class="stp-lens"></div><div class="stp-g"></div>';
  var lens=$('.stp-lens',b);
  function show(k){lens.innerHTML=L[k].map(function(r,i){return '<div class="stp-lr" style="--d:'+(i*90)+'ms"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'}).join('');lens.className='stp-lens '+k}
  $$('.stp-who',b).forEach(function(x){x.onclick=function(){$$('.stp-who',b).forEach(function(y){y.classList.toggle('on',y===x)});show(x.dataset.w)}});show('m');
  if(ST.fun)ST.fun.speed($('.stp-g',b),{id:'start-roles',title:'Whose job is it?',intro:'Sixty seconds: the navigator\'s job or the historian\'s?',
    cats:[{k:'m',n:'Management accountant'},{k:'f',n:'Financial accountant'}],
    items:[{x:'Preparing next year\'s budget',c:'m'},{x:'Explaining why material costs ran over plan',c:'m'},{x:'Working out the cost of one gift box',c:'m'},{x:'Deciding whether to make a part or buy it',c:'m'},{x:'Forecasting cash for the next quarter',c:'m'},
      {x:'Preparing the annual financial statements',c:'f'},{x:'Applying IFRS to a lease',c:'f'},{x:'Writing the notes to the statements',c:'f'},{x:'Answering the external auditor\'s questions',c:'f'},{x:'Reporting quarterly results to shareholders',c:'f'}]})}

function stepValue(b){
  var W=640,H=200,pts=[[70,160],[200,120],[330,140],[450,80],[570,44]];
  var path='M70 160 C130 160 140 120 200 120 S290 150 330 140 S410 80 450 80 S530 44 570 44';
  b.innerHTML='<p>CMAs work in finance teams everywhere — manufacturing, services, retail, government, non-profit. Tap a stop on the road:</p>'+
   '<svg class="stp-road" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Career road with five roles"><path d="'+path+'" class="rd"/><path d="'+path+'" class="rd2" id="stRoad"/>'+
   pts.map(function(p,i){return '<g class="ms" data-i="'+i+'" style="--d:'+(300+i*450)+'ms" tabindex="0" role="button" aria-label="'+ROLES[i][0].replace('&amp;','and')+'"><circle cx="'+p[0]+'" cy="'+p[1]+'" r="16"/><text x="'+p[0]+'" y="'+(p[1]+5)+'" text-anchor="middle">'+(i+1)+'</text><text class="lb" x="'+(i===4?p[0]+18:p[0])+'" y="'+(p[1]+(i%2||i===4?-26:34))+'" text-anchor="'+(i===4?'end':'middle')+'">'+ROLES[i][0]+'</text></g>'}).join('')+
   (RM?'':'<circle r="7" class="rnr"><animateMotion dur="2.4s" fill="freeze" path="'+path+'"/></circle>')+'</svg><div class="stp-rcard"></div>'+
   '<p class="note">Every stop uses the toolkit you will build in the six sections of Part 1.</p>';
  var card=$('.stp-rcard',b);
  function show(i){var r=ROLES[i];$$('.ms',b).forEach(function(g){g.classList.toggle('sel',+g.dataset.i===i)});
    card.innerHTML='<b>'+r[0]+'</b><p>'+r[1]+'</p><div class="chips">'+r[2].split('').map(function(k){var s=P1.filter(function(x){return x[0]===k})[0];return '<span class="chip g">'+k+' · '+s[1]+'</span>'}).join('')+'</div>';
    card.classList.remove('pop');void card.offsetWidth;card.classList.add('pop')}
  $$('.ms',b).forEach(function(g){g.onclick=function(){show(+g.dataset.i)};g.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();show(+g.dataset.i)}}});
  setTimeout(function(){if(document.body.contains(card)&&!card.innerHTML)show(1)},RM?0:2600)}

function stepOthers(b){
  var ans=[];
  b.innerHTML='<p>No certification is "the best" — each prepares you for a different kind of work. Three quick questions, and we light up the paths that fit you:</p><div class="stp-quiz"></div><div class="stp-cards"></div>'+
   '<p class="note">A quick guide, not advice. All five are respected qualifications; each body sets its own exams, experience rules and fees — check its official site.</p>';
  var qz=$('.stp-quiz',b),cards=$('.stp-cards',b);
  function drawCards(top){cards.innerHTML=Object.keys(CERTS).map(function(k){var c=CERTS[k],on=top&&top.indexOf(k)>=0;return '<div class="stp-card'+(top?(on?' fit':' dim'):'')+'"><b>'+k+'</b><small>'+c[0]+'</small><p>'+c[1]+'</p><p class="fit"><span>A good fit for:</span> '+c[2]+'</p></div>'}).join('')}
  function ask(){if(ans.length>=FITQ.length){var sc={};ans.forEach(function(a){Object.keys(a).forEach(function(k){sc[k]=(sc[k]||0)+a[k]})});
      var mx=Math.max.apply(null,Object.keys(sc).map(function(k){return sc[k]})),top=Object.keys(sc).filter(function(k){return sc[k]>=mx-1&&sc[k]>0}).sort(function(a,c){return sc[c]-sc[a]}).slice(0,2);
      qz.innerHTML='<div class="stp-res"><b>Your answers point to: '+top.join(' and ')+'</b><button class="btn sm ghost" type="button">Answer again</button></div>';
      $('button',qz).onclick=function(){ans=[];drawCards(null);ask()};drawCards(top);if(top.indexOf('CMA')>=0)party();return}
    var q=FITQ[ans.length];
    qz.innerHTML='<div class="stp-q"><span class="note">Question '+(ans.length+1)+' of '+FITQ.length+'</span><b>'+q[0]+'</b><div class="stp-opts">'+q[1].map(function(o,i){return '<button type="button" class="btn" data-i="'+i+'">'+o[0]+'</button>'}).join('')+'</div></div>';
    $$('[data-i]',qz).forEach(function(x){x.onclick=function(){ans.push(q[1][+x.dataset.i][1]);ask()}})}
  drawCards(null);ask()}

function stepPath(b){
  var C=2*Math.PI*42,done={};try{done=JSON.parse(st('st-req')||'{}')||{}}catch(e){}
  b.innerHTML='<div class="stp-pathw"><svg class="stp-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" class="rg0"/><circle cx="50" cy="50" r="42" class="rg1" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+C.toFixed(1)+'"/></svg><div class="stp-ringv"><b>0</b><span>of 6</span></div></div>'+
   '<p>Six steps lead to the certificate. Tick what you have already done:</p><div class="stp-req"></div>';
  var rq=$('.stp-req',b),ring=$('.rg1',b),rv=$('.stp-ringv b',b),last=-1;
  function req(){var n=0;REQ.forEach(function(r,i){if(done[i])n++});
    rq.innerHTML=REQ.map(function(r,i){return '<label class="stp-ck'+(done[i]?' on':'')+'" style="--d:'+(i*60)+'ms"><input type="checkbox" data-i="'+i+'"'+(done[i]?' checked':'')+'><span><b>'+r[0]+'</b><small>'+r[1]+'</small></span></label>'}).join('')+
     '<p class="stp-req-s">'+(n===REQ.length?'All six — you are a CMA. Congratulations!':n===0?'Most candidates start with the first two, then Part 1 — exactly where you are now.':'Good progress — '+(REQ.length-n)+' to go.')+'</p>';
    ring.style.strokeDashoffset=(C*(1-n/REQ.length)).toFixed(1);rv.textContent=n;if(n===REQ.length&&last>=0&&last<n)party();last=n;
    $$('input',rq).forEach(function(c){c.onchange=function(){done[c.dataset.i]=c.checked?1:0;st('st-req',JSON.stringify(done));req()}})}
  req()}

function stepExam(b){
  b.innerHTML='<p>Each part is a separate <b>4-hour</b> computer exam delivered by Prometric; you can sit the parts in either order. Watch one exam in fast motion:</p>'+
   '<div class="stp-sim"><svg viewBox="0 0 120 120" class="stp-clock" aria-hidden="true"><circle cx="60" cy="60" r="52" class="ck0"/><path class="ck1" d=""/><line x1="60" y1="60" x2="60" y2="16" class="hand"/><circle cx="60" cy="60" r="4" class="hub"/></svg>'+
   '<div class="stp-simr"><div class="sim-l"><span>Time</span><b class="s-t">0:00</b></div><div class="sim-l"><span>Multiple-choice</span><b class="s-q">0 / 100</b></div><div class="sim-l"><span>Case-based questions</span><b class="s-e">locked</b></div><div class="sim-l"><span>Scaled score</span><b class="s-s">—</b></div>'+
   '<div class="sim-bar"><i></i><u></u></div><div class="sim-msg">Press play: 4 hours in 12 seconds.</div><button class="btn pri" type="button" id="simGo">▶ Play the exam</button></div></div>'+
   '<ul><li><b>Multiple-choice:</b> 100 questions in 3 hours — about <b>1:48</b> a question. A few are unscored trial questions you can\'t identify, so treat every one as real.</li>'+
   '<li><b>Case-based questions (CBQs):</b> two short business cases, each with a set of questions — type a number, pick from a drop-down list, drag and drop, or calculate. They open only if at least <b>50%</b> of your multiple-choice answers are right. Since the September–October 2026 window they have replaced the essays in most regions.</li>'+
   '<li><b>Score:</b> scaled 0–500; <b>360 passes</b>.</li></ul>'+
   '<p class="stp-cbq">★ The case at the end of every topic here is built the same way: a short case, then a set of questions with typed numbers, drop-down lists and drag-and-drop.</p>'+
   '<div class="stp-pace"><b>Feel the pace</b><p>One exam-style question, one exam-style clock: 1 minute 48 seconds.</p><button class="btn" type="button" id="paceGo">Start the clock</button><div class="pace-q"></div></div>';
  var sim=$('.stp-sim',b),hand=$('.hand',b),arc=$('.ck1',b),tT=$('.s-t',b),tQ=$('.s-q',b),tE=$('.s-e',b),tS=$('.s-s',b),bar=$('.sim-bar i',b),bar2=$('.sim-bar u',b),msg=$('.sim-msg',b),go=$('#simGo',b),raf=null;
  function arcTo(f){var a=f*2*Math.PI,x=60+52*Math.sin(a),y=60-52*Math.cos(a);arc.setAttribute('d',f<=0?'':f>=1?'M60 8 A52 52 0 1 1 59.99 8Z':'M60 60 L60 8 A52 52 0 '+(f>.5?1:0)+' 1 '+x.toFixed(2)+' '+y.toFixed(2)+'Z')}
  function frame(k){var min=k*240,h=Math.floor(min/60),m=Math.floor(min%60);tT.textContent=h+':'+('0'+m).slice(-2);
    hand.setAttribute('transform','rotate('+(k*360)+' 60 60)');arcTo(k);
    var mq=Math.min(1,k/0.75);tQ.textContent=Math.min(100,Math.round(mq*100))+' / 100';bar.style.width=(mq*75)+'%';
    if(k>=0.75){sim.classList.add('sgate');tE.textContent=k>=1?'2 / 2 cases':'case '+(k<0.875?'1':'2')+' of 2';bar2.style.width=((k-0.75)/0.25*25)+'%';msg.textContent=k>=1?'':'Gate passed: 50% or more right — case-based questions unlocked.'}
    else{sim.classList.remove('sgate');tE.textContent='locked';bar2.style.width='0';msg.textContent='Answering… about 1:48 a question.'}}
  function play(){cancelAnimationFrame(raf);sim.classList.remove('done');tS.textContent='—';go.disabled=true;
    if(RM){frame(1);end();return}
    var t0=null;function f(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/12000);frame(k);if(k<1&&document.body.contains(sim))raf=requestAnimationFrame(f);else end()}raf=requestAnimationFrame(f)}
  function end(){sim.classList.add('done');msg.innerHTML='<b>Example result:</b> 382 — a pass.';countUp(tS,382,1200);go.disabled=false;go.textContent='↻ Play again';setTimeout(party,900)}
  go.onclick=play;frame(0);
  var pq=$('.pace-q',b),pg=$('#paceGo',b),ti=null;
  pg.onclick=function(){pg.style.display='none';var left=108,O=['Income statement','Balance sheet (statement of financial position)','Statement of cash flows','Statement of changes in equity'],A=1,t0=Date.now();
    pq.innerHTML='<div class="pace-t"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" class="pt0"/><circle cx="20" cy="20" r="17" class="pt1" stroke-dasharray="106.8" stroke-dashoffset="0"/></svg><b>1:48</b></div>'+
     '<p><b>A company wants to show what it owns and owes on the last day of the year. Which statement does it use?</b></p><div class="pace-o">'+O.map(function(o,i){return '<button type="button" class="btn" data-i="'+i+'">'+'ABCD'[i]+'. '+o+'</button>'}).join('')+'</div><div class="pace-r"></div>';
    var pt=$('.pt1',pq),pb=$('.pace-t b',pq),rr=$('.pace-r',pq);
    function stop(i){clearInterval(ti);var used=Math.min(108,Math.round((Date.now()-t0)/1000));$$('.pace-o button',pq).forEach(function(x,j){x.disabled=true;if(j===A)x.classList.add('ok');else if(j===i)x.classList.add('bad')});
      rr.innerHTML=(i===A?'<b class="ok">Right</b> in '+used+' seconds'+(used<=108?' — inside the exam pace.':'.'):i<0?'<b class="bad">Time\'s up.</b> In the exam you would move on — and come back if time allows.':'<b class="bad">Not quite</b> ('+used+' seconds).')+' The balance sheet shows assets, liabilities and equity at one date; the others cover a period. You will study all four in Section A.';if(i===A)party()}
    $$('.pace-o button',pq).forEach(function(x){x.onclick=function(){stop(+x.dataset.i)}});
    ti=setInterval(function(){if(!document.body.contains(pq)){clearInterval(ti);return}left--;pb.textContent=Math.floor(left/60)+':'+('0'+left%60).slice(-2);pt.style.strokeDashoffset=(106.8*(1-left/108)).toFixed(1);if(left<=20)pq.classList.add('hot');if(left<=0)stop(-1)},1000)}}

function stepWhen(b){
  var c=cal(),now=c.now,y=now.getFullYear(),MS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function ang(d){var s=new Date(d.getFullYear(),0,1),e=new Date(d.getFullYear()+1,0,1);return (d-s)/(e-s)*360}
  function pt(a,r){var t=(a-90)*Math.PI/180;return [100+r*Math.cos(t),100+r*Math.sin(t)]}
  function arcP(a1,a2,r){var p=pt(a1,r),q=pt(a2,r);return 'M'+p[0].toFixed(1)+' '+p[1].toFixed(1)+' A'+r+' '+r+' 0 '+(a2-a1>180?1:0)+' 1 '+q[0].toFixed(1)+' '+q[1].toFixed(1)}
  var ring='<svg class="stp-year" viewBox="0 0 200 200" role="img" aria-label="The year with three testing windows"><circle cx="100" cy="100" r="78" class="yr0"/>'+
   WIN.map(function(w){var o=new Date(y,w[1],1),cl=new Date(y,w[2],0),rg=new Date(y,w[3],15),a1=ang(o),a2=ang(cl)+0.9,tk=pt(ang(rg),70),tk2=pt(ang(rg),88);return '<path d="'+arcP(a1,a2,78)+'" class="yrw"/><line x1="'+tk[0].toFixed(1)+'" y1="'+tk[1].toFixed(1)+'" x2="'+tk2[0].toFixed(1)+'" y2="'+tk2[1].toFixed(1)+'" class="yrr"/>'}).join('')+
   MS.map(function(m,i){var p=pt(i*30+15,96);return '<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+3).toFixed(1)+'" text-anchor="middle" class="yrm">'+m+'</text>'}).join('')+
   '<g class="yrt"><circle cx="100" cy="22" r="6"/></g><text x="100" y="94" text-anchor="middle" class="yrc1">today</text><text x="100" y="114" text-anchor="middle" class="yrc2">'+dmy(now)+'</text></svg>';
  var tgt,lab;if(c.cur&&days(now,c.cur.reg)>=0){tgt=new Date(c.cur.reg.getFullYear(),c.cur.reg.getMonth(),c.cur.reg.getDate(),23,59,59);lab='Registration for '+c.cur.n+' closes in'}else{tgt=c.next[0].open;lab=c.next[0].n+' opens in'}
  b.innerHTML='<div class="stp-when">'+ring+'<div><p>Three testing windows a year — <b>January–February</b>, <b>May–June</b>, <b>September–October</b>. Registration closes after the 15th of the second month (the red marks).</p>'+
   '<div class="stp-cd"><span>'+lab+'</span><div class="cd"><b class="cd-d">0</b><i>days</i><b class="cd-h">0</b><i>hrs</i><b class="cd-m">0</b><i>min</i><b class="cd-s">0</b><i>sec</i></div></div></div></div><div class="stp-cal"></div>'+
   '<div class="row stp-final"><button class="btn pri" type="button" id="stGo">Start Section A →</button>'+(ST.fun?'<button class="btn" type="button" id="stTour">Take the 1-minute tour</button>':'')+'<button class="btn ghost" type="button" id="stCal">Set my exam date</button></div>'+
   '<p class="note">Facts checked '+CHECKED+' against ICMA\'s CMA Handbook; confirm on <a href="https://www.imanet.org" target="_blank" rel="noopener">imanet.org</a> before you register.</p>';
  $('.stp-cal',b).appendChild(calBox(true));
  var g=$('.yrt',b),A=ang(now);if(RM)g.setAttribute('transform','rotate('+A+' 100 100)');else{var t0=null;(function f(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/1600),e=1-Math.pow(1-k,3);g.setAttribute('transform','rotate('+(A*e)+' 100 100)');if(k<1)requestAnimationFrame(f)})(performance.now())}
  var D=$('.cd-d',b),H=$('.cd-h',b),Mi=$('.cd-m',b),Se=$('.cd-s',b);
  function tick(){if(!document.body.contains(D)){clearInterval(tm);return}var s=Math.max(0,Math.floor((tgt-new Date())/1000));D.textContent=Math.floor(s/86400);H.textContent=Math.floor(s%86400/3600);Mi.textContent=Math.floor(s%3600/60);Se.textContent=s%60}
  var tm=setInterval(tick,1000);tick();
  var ct=$('#stTour',b);if(ct)ct.onclick=function(){ST.fun.tour()};
  $('#stCal',b).onclick=ST.examCalendar;
  $('#stGo',b).onclick=function(){party();setTimeout(function(){if(ST.SEC&&ST.SEC.k!=='A'&&ST.goSection)ST.goSection('A');else location.hash='#/'},RM?0:900)}}

var STEPS=[{id:'what',t:'What the CMA is',r:stepWhat},{id:'roles',t:'Navigator or historian?',r:stepRoles},{id:'value',t:'Where it can take you',r:stepValue},
 {id:'others',t:'Which path fits you?',r:stepOthers},{id:'path',t:'Six steps to the certificate',r:stepPath},{id:'exam',t:'The exam, in fast motion',r:stepExam},{id:'when',t:'When you can sit it',r:stepWhen}];
var lastStep=0;
function startView(sub){
  var i=0,n=parseInt(sub,10);
  if(n>=1&&n<=STEPS.length)i=n-1;else if(sub)STEPS.forEach(function(s,j){if(s.id===sub)i=j});
  var S=STEPS[i],app=$('#app');app.innerHTML='';
  var w=el('section','stp-step '+(i>=lastStep?'fwd':'bck'));lastStep=i;app.appendChild(w);
  w.innerHTML='<div class="stp-top"><span class="kick">Start here · '+(i+1)+' of '+STEPS.length+'</span><a class="stp-skip" href="#/">Skip to the sections ›</a></div>'+
   '<div class="stp-prog">'+STEPS.map(function(s,j){return '<a href="#/start/'+(j+1)+'" class="'+(j<i?'dn':j===i?'on':'')+'" title="'+esc(s.t)+'" aria-label="Step '+(j+1)+': '+esc(s.t)+'"></a>'}).join('')+'</div>'+
   '<h1 class="stp-h">'+esc(S.t)+'</h1><div class="stp-body"></div>'+
   '<div class="stp-navb">'+(i?'<a class="btn" href="#/start/'+i+'">‹ Back</a>':'<span></span>')+(i<STEPS.length-1?'<a class="btn pri" href="#/start/'+(i+2)+'">Next ›</a>':'')+'</div>';
  S.r($('.stp-body',w));
  st(INTRO_KEY,'1');window.scrollTo(0,0)}
ST.startView=startView;

document.addEventListener('keydown',function(e){var m=location.hash.match(/^#\/start(?:\/(\d+))?$/);if(!m||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||!$('#modal').hidden)return;var i=+(m[1]||1);
  if(e.key==='ArrowRight'&&i<STEPS.length)location.hash='#/start/'+(i+1);else if(e.key==='ArrowLeft'&&i>1)location.hash='#/start/'+(i-1)});
/* first visit on this device: open Start here once.
   To show it once more to everyone (e.g. after a big update), bump the number: st-intro2, st-intro3 … */
var INTRO_KEY='st-intro1';
ST.introFirst=function(){if(st(INTRO_KEY))return false;var h=location.hash;if(h&&h!=='#/'&&h!=='#')return false;st(INTRO_KEY,'1');location.replace('#/start');return true};

var t0=setInterval(function(){if($('.top-act')){clearInterval(t0);addIcon()}},100);
setInterval(paintBadge,3600000);
})();
