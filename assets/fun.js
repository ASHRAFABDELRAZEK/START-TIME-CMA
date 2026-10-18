/* START TIME — lighter learning.
   Motion setting (respects the device's "reduce motion"), small celebrations, flashcards on every Key terms slide,
   and reusable mini-games for topic files: who's asking, myth or fact, build the balance sheet, speed round, number flow.
   Games are practice for the mind, not graded questions: they never change mastery or readiness. */
(function(){
'use strict';
var ST=window.ST,el=ST.h.el,$=ST.h.$,$$=ST.h.$$,esc=ST.h.esc;
var F=ST.fun={};
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
F.shuffle=shuffle;

/* ---------- motion ---------- */
F.motion=function(){var v=store('st-motion');if(v==='off')return false;if(v==='on')return true;
  return !(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)};
F.apply=function(){document.documentElement.classList.toggle('nomotion',!F.motion())};
F.apply();
F.settingsRow=function(){
  var w=el('div','','<h3 class="sett-h">Motion</h3><p class="note">Animated diagrams, slide transitions and small celebrations. Turn them off if you prefer a still screen.</p>'+
    '<div class="apx-r"><span class="seg sm" role="group" aria-label="Motion"><button type="button" data-m="on">On</button><button type="button" data-m="off">Off</button></span></div>');
  var paint=function(){$$('[data-m]',w).forEach(function(b){var on=(b.dataset.m==='on')===F.motion();b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')})};
  $$('[data-m]',w).forEach(function(b){b.onclick=function(){store('st-motion',b.dataset.m);F.apply();paint()}});paint();return w};

/* ---------- toast and confetti ---------- */
F.toast=function(msg){var t=document.getElementById('funToast');if(!t){t=el('div','fun-toast');t.id='funToast';t.setAttribute('role','status');document.body.appendChild(t)}
  t.innerHTML=msg;t.classList.remove('on');void t.offsetWidth;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('on')},3200)};
F.confetti=function(){
  if(!F.motion())return;
  var c=document.createElement('canvas'),x=c.getContext('2d'),W=c.width=innerWidth,H=c.height=innerHeight,cols=['#0F766E','#C9A227','#112240','#14A08F','#E7C55A'];
  c.className='fun-cfx';document.body.appendChild(c);
  var ps=[];for(var i=0;i<90;i++)ps.push({x:W/2+(Math.random()-.5)*W*.3,y:H*.35,vx:(Math.random()-.5)*12,vy:-Math.random()*11-4,r:Math.random()*6+3,c:cols[i%cols.length],a:Math.random()*6,s:(Math.random()-.5)*.3});
  var t0=performance.now();
  (function fr(t){var e=t-t0;x.clearRect(0,0,W,H);ps.forEach(function(p){p.vy+=.32;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.a+=p.s;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.globalAlpha=Math.max(0,1-e/1700);x.fillStyle=p.c;x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);x.restore()});
    if(e<1700)requestAnimationFrame(fr);else c.remove()})(t0)};

/* topic mastered → celebrate once */
if(ST.mark&&ST.topicStat){var mk=ST.mark;ST.mark=function(k){var t=ST.byId[String(k).split('#')[0]],b=t?ST.topicStat(t).mastered:true;var r=mk.apply(this,arguments);
  if(t&&!b&&ST.topicStat(t).mastered){F.confetti();F.toast('<b>Topic mastered</b> — '+esc(t.n))}return r}}

/* ---------- flashcards from any Key terms table ---------- */
F.flash=function(rows,title){
  var deck=shuffle(rows.map(function(r,i){return {i:i,f:r[0],b:r[1],w:r[2]||''}})),left=deck.slice(),done=0,flip=false;
  var box=el('div','fc');
  function draw(){
    if(!left.length){box.innerHTML='<div class="fc-end"><b>All '+rows.length+' terms done</b><p class="note">Terms you sent back came round again until you knew them.</p><div class="row"><button class="btn pri" type="button" id="fcAgain">Start again</button></div></div>';
      $('#fcAgain',box).onclick=function(){left=shuffle(deck);done=0;flip=false;draw()};F.confetti();return}
    var c=left[0];
    box.innerHTML='<div class="fc-meta"><span>'+done+' of '+rows.length+' known</span><span class="note">Tap the card to turn it</span></div>'+
      '<button type="button" class="fc-card'+(flip?' on':'')+'" aria-label="Turn the card"><span class="fc-in"><span class="fc-f"><small>Term</small><b>'+c.f+'</b></span>'+
      '<span class="fc-b"><small>'+c.f+'</small><span>'+c.b+'</span>'+(c.w?'<em>Watch out: '+c.w+'</em>':'')+'</span></span></button>'+
      '<div class="row fc-act"><button class="btn" type="button" data-a="again">Again later</button><button class="btn pri" type="button" data-a="ok">I knew it</button></div>';
    $('.fc-card',box).onclick=function(){flip=!flip;this.classList.toggle('on',flip)};
    $$('[data-a]',box).forEach(function(b){b.onclick=function(){var x=left.shift();if(b.dataset.a==='ok')done++;else left.splice(Math.min(left.length,2+Math.floor(Math.random()*2)),0,x);flip=false;draw()}})}
  draw();ST.modal(title||'Flashcards',box)};
var ds=ST.deckSlide;ST.deckSlide=function(sec,body,t,s,idx){if(ds)ds.apply(this,arguments);
  var gl=$('table.gl',body);if(!gl)return;
  var rows=$$('tr',gl).slice(1).map(function(tr){return $$('td',tr).map(function(td){return td.innerHTML})}).filter(function(r){return r.length>=2});
  if(rows.length<3)return;
  var b=el('div','fc-open','<button class="btn pri sm" type="button">'+ICN.cards+'<span>Practise these terms as flashcards</span></button><span class="note">'+rows.length+' cards · terms you miss come back</span>');
  $('button',b).onclick=function(){F.flash(rows,'Key terms · '+t.n)};gl.parentNode.parentNode.insertBefore(b,gl.parentNode)};

var ICN={cards:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/></svg>',
 bank:'<svg viewBox="0 0 48 48"><path d="M6 18L24 8l18 10z"/><path d="M10 20v14M18 20v14M30 20v14M38 20v14M6 38h36"/></svg>',
 fund:'<svg viewBox="0 0 48 48"><path d="M6 38h36"/><path d="M10 32l9-9 7 6 12-14"/><path d="M32 15h6v6"/></svg>',
 truck:'<svg viewBox="0 0 48 48"><rect x="4" y="14" width="24" height="18" rx="2"/><path d="M28 20h8l6 7v5H28z"/><circle cx="13" cy="35" r="4"/><circle cx="35" cy="35" r="4"/></svg>',
 staff:'<svg viewBox="0 0 48 48"><circle cx="24" cy="15" r="7"/><path d="M10 40c1-9 7-13 14-13s13 4 14 13"/><rect x="20" y="31" width="8" height="5" rx="1"/></svg>',
 gov:'<svg viewBox="0 0 48 48"><path d="M8 40h32M12 40V22h24v18M24 22V8M24 8l9 4-9 4"/><path d="M18 28v6M24 28v6M30 28v6"/></svg>',
 cart:'<svg viewBox="0 0 48 48"><path d="M5 9h6l5 21h22l4-14H14"/><circle cx="19" cy="38" r="3"/><circle cx="35" cy="38" r="3"/></svg>',
 boss:'<svg viewBox="0 0 48 48"><rect x="7" y="16" width="34" height="22" rx="3"/><path d="M18 16v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M7 26h34"/></svg>',
 news:'<svg viewBox="0 0 48 48"><rect x="6" y="9" width="30" height="30" rx="2"/><path d="M36 15h6v20a4 4 0 0 1-4 4H10M12 16h18M12 23h18M12 30h12"/></svg>'};
F.icons=ICN;

/* ---------- who's asking? (users and the statement that answers them) ---------- */
/* F.PRINT: set by the print view — each game renders its finished result as a static table instead of the interactive board */
F.PRINT=false;
F.who=function(h,cfg){
  var S=cfg.statements,P=cfg.people,found={},cur=0,tries={};
  if(F.PRINT){var nm=function(k){return (S.filter(function(s){return s.k===k})[0]||{}).n||k};
    h.insertAdjacentHTML('beforeend','<div class="tw"><table class="t fsx"><thead><tr><th>Reader</th><th>The question</th><th>Statement to open first</th></tr></thead><tbody>'+
      P.map(function(p){return '<tr><td><b>'+esc(p.n)+'</b><br><small>'+esc(p.r||'')+'</small></td><td>'+p.q+'</td><td><b>'+esc(nm(p.a))+'</b><br>'+p.why+'</td></tr>'}).join('')+'</tbody></table></div>'+(cfg.done?'<p class="note">'+cfg.done+'</p>':''));return}
  var w=el('div','who');h.appendChild(w);
  function draw(){
    var p=P[cur],n=Object.keys(found).length;
    w.innerHTML='<div class="who-top"><span class="note">'+esc(cfg.intro||'Tap a reader, read the question, then pick the statement that answers it first.')+'</span><b class="who-sc">'+n+' / '+P.length+' answered</b></div>'+
      '<div class="who-ppl">'+P.map(function(x,i){return '<button type="button" class="who-p'+(i===cur?' on':'')+(found[i]?' ok':'')+'" data-i="'+i+'"><span class="who-ic">'+(ICN[x.ic]||ICN.staff)+'</span><b>'+esc(x.n)+'</b><small>'+esc(x.r)+'</small></button>'}).join('')+'</div>'+
      '<div class="who-q"><div class="who-bub"><span class="who-ic sm">'+(ICN[p.ic]||ICN.staff)+'</span><p><small>'+esc(p.n)+' asks</small>“'+p.q+'”</p></div>'+
      '<div class="who-st">'+S.map(function(s){return '<button type="button" class="who-s'+(found[cur]&&s.k===p.a?' ok':'')+'" data-k="'+s.k+'">'+esc(s.n)+'</button>'}).join('')+'</div>'+
      '<div class="who-fb" aria-live="polite">'+(found[cur]?'<div class="fb ok"><b class="v">Right.</b>'+p.why+'</div>':'')+'</div></div>'+
      (n===P.length?'<div class="fb ok who-done"><b class="v">Every reader answered.</b>'+(cfg.done||'Each reader opens the pack with a different question — and goes first to the statement that answers it.')+'</div>':'');
    $$('.who-p',w).forEach(function(b){b.onclick=function(){cur=+b.dataset.i;draw()}});
    $$('.who-s',w).forEach(function(b){b.onclick=function(){if(found[cur])return;
      if(b.dataset.k===p.a){found[cur]=1;var all=Object.keys(found).length===P.length;draw();if(all)F.confetti();else setTimeout(function(){var nx=P.findIndex(function(_,i){return !found[i]});if(nx>=0&&cur!==nx){cur=nx;draw()}},1600)}
      else{tries[cur]=(tries[cur]||0)+1;b.classList.add('no');var fb=$('.who-fb',w);var hint=(p.hint&&p.hint[b.dataset.k])||p.no||'Not that one first. Think about what this reader must decide.';fb.innerHTML='<div class="fb bad"><b class="v">Not quite.</b>'+hint+'</div>'}}});
  }
  draw()};

/* ---------- myth or fact? ---------- */
F.myth=function(h,items,o){o=o||{};
  if(F.PRINT){h.insertAdjacentHTML('beforeend','<ul class="myth-print">'+items.map(function(m){return '<li><b>'+(m.f?'Fact':'Myth')+':</b> '+m.s+' <span class="muted">— '+m.w+'</span></li>'}).join('')+'</ul>');return}
  var L=o.keep?items.slice():shuffle(items),i=0,score=0,ans=null,miss=[];
  var w=el('div','myth');h.appendChild(w);
  function draw(){
    if(i>=L.length){var pct=Math.round(score/L.length*100);
      w.innerHTML='<div class="myth-end"><b>'+score+' of '+L.length+'</b><span>'+(pct>=80?'Sharp. You can spot the traps examiners like.':pct>=50?'Good start — read the ones you missed once more.':'Worth another round: these traps come up again.')+'</span>'+
        (miss.length?'<ul>'+miss.map(function(m){return '<li><b>'+(m.f?'Fact':'Myth')+':</b> '+m.s+' — '+m.w+'</li>'}).join('')+'</ul>':'')+'<button class="btn pri" type="button">Play again</button></div>';
      $('button',w).onclick=function(){L=shuffle(items);i=0;score=0;miss=[];ans=null;draw()};if(pct>=80)F.confetti();return}
    var c=L[i];
    w.innerHTML='<div class="myth-top"><span class="note">'+(o.intro||'Myth or fact? Decide, then read why.')+'</span><b>'+(i+1)+' / '+L.length+'</b></div>'+
      '<div class="myth-card'+(ans!==null?(ans===c.f?' ok':' no'):'')+'"><p>'+c.s+'</p>'+(ans!==null?'<div class="myth-a"><b>'+(c.f?'Fact.':'Myth.')+'</b> '+c.w+'</div>':'')+'</div>'+
      '<div class="row myth-btn">'+(ans===null?'<button class="btn myth-m" type="button" data-v="0">Myth</button><button class="btn myth-f" type="button" data-v="1">Fact</button>':'<button class="btn pri" type="button" data-n="1">'+(i+1<L.length?'Next':'See my score')+'</button>')+'</div>';
    $$('[data-v]',w).forEach(function(b){b.onclick=function(){ans=b.dataset.v==='1';if(ans===c.f)score++;else miss.push(c);draw()}});
    var nx=$('[data-n]',w);if(nx){nx.onclick=function(){i++;ans=null;draw()};nx.focus()}}
  draw()};

/* ---------- build the balance sheet (tap an account, then the place it belongs) ---------- */
F.build=function(h,cfg){
  var S=cfg.sections,I=shuffle(cfg.items),placed={},sel=null,M=ST.money||function(v){return v};
  if(F.PRINT){I=cfg.items.slice();var side=function(sd){return S.filter(function(x){return x.side===sd}).map(function(x){var its=I.filter(function(it){return it.k===x.k});
      return '<tr><th colspan="2">'+esc(x.n)+'</th></tr>'+its.map(function(it){return '<tr><td>'+esc(it.n)+'</td><td class="n">'+M(it.v)+'</td></tr>'}).join('')}).join('')},
    tot=function(sd){return I.filter(function(it){return (S.filter(function(x){return x.k===it.k})[0]||{}).side===sd}).reduce(function(a,it){return a+it.v},0)};
    h.insertAdjacentHTML('beforeend','<div class="tw"><table class="t fsx"><tbody>'+side('A')+'<tr class="tot"><td><b>Total assets</b></td><td class="n"><b>'+M(tot('A'))+'</b></td></tr>'+side('L')+side('E')+'<tr class="tot"><td><b>Total liabilities and equity</b></td><td class="n"><b>'+M(tot('L')+tot('E'))+'</b></td></tr></tbody></table></div>'+(cfg.done?'<p class="note">'+cfg.done+'</p>':''));return}
  var w=el('div','bld');h.appendChild(w);
  function tot(side){var s=0;I.forEach(function(it,j){if(placed[j]&&S.filter(function(x){return x.k===it.k})[0].side===side)s+=it.v});return s}
  function draw(){
    var left=I.filter(function(_,j){return !placed[j]}).length,A=tot('A'),LE=tot('L')+tot('E');
    var sec=function(side){return S.filter(function(x){return x.side===side}).map(function(x){var its=I.map(function(it,j){return {it:it,j:j}}).filter(function(o){return placed[o.j]&&o.it.k===x.k});
      return '<button type="button" class="bld-sec'+(sel!==null?' tgt':'')+'" data-k="'+x.k+'"><span class="bld-h"><b>'+esc(x.n)+'</b><span class="num">'+M(its.reduce(function(a,o){return a+o.it.v},0))+'</span></span>'+
        its.map(function(o){return '<span class="bld-row"><span>'+esc(o.it.n)+'</span><span class="num">'+M(o.it.v)+'</span></span>'}).join('')+'</button>'}).join('')};
    w.innerHTML='<p class="note">'+(cfg.intro||'Tap an account, then tap the part of the balance sheet where it belongs.')+'</p>'+
      '<div class="bld-tray">'+(left?I.map(function(it,j){return placed[j]?'':'<button type="button" class="bld-chip'+(sel===j?' on':'')+'" data-j="'+j+'">'+esc(it.n)+' <span class="num">'+M(it.v)+'</span></button>'}).join(''):'<span class="bld-ok">'+(A===LE?'Balanced — assets equal liabilities plus equity':'')+'</span>')+'</div>'+
      '<div class="bld-fb" aria-live="polite"></div>'+
      '<div class="bld-bs"><div class="bld-col"><div class="bld-ch">Assets</div>'+sec('A')+'<div class="bld-t"><span>Total assets</span><b class="num">'+M(A)+'</b></div></div>'+
      '<div class="bld-col"><div class="bld-ch">Liabilities and equity</div>'+sec('L')+sec('E')+'<div class="bld-t"><span>Total liabilities and equity</span><b class="num">'+M(LE)+'</b></div></div></div>'+
      (left?'':'<div class="fb ok"><b class="v">'+(A===LE?'It balances.':'Check the totals.')+'</b>'+(cfg.done||'')+'</div>');
    $$('.bld-chip',w).forEach(function(b){b.onclick=function(){sel=+b.dataset.j;draw()}});
    $$('.bld-sec',w).forEach(function(b){b.onclick=function(){if(sel===null){$('.bld-fb',w).innerHTML='<div class="fb">Pick an account from the tray first.</div>';return}
      var it=I[sel];if(it.k===b.dataset.k){placed[sel]=1;sel=null;var all=I.every(function(_,j){return placed[j]});draw();if(all)F.confetti()}
      else{b.classList.add('no');$('.bld-fb',w).innerHTML='<div class="fb bad"><b class="v">Not there.</b>'+(it.w||'Think about when it turns into cash or must be paid.')+'</div>'}}})}
  draw()};

/* ---------- speed round ---------- */
F.speed=function(h,cfg){
  var id='st-speed-'+cfg.id,best=+(store(id)||0),secs=cfg.secs||60,L,i,ok,miss,t0,timer;
  if(F.PRINT){var cat=function(k){return (cfg.cats.filter(function(x){return x.k===k})[0]||{}).n||k};
    h.insertAdjacentHTML('beforeend',(cfg.intro?'<p>'+cfg.intro+'</p>':'')+'<div class="tw"><table class="t fsx"><thead><tr><th>Item</th><th>Belongs to</th></tr></thead><tbody>'+
      cfg.items.map(function(c){return '<tr><td>'+c.x+'</td><td><b>'+esc(cat(c.c))+'</b>'+(c.w?' <span class="muted">— '+c.w+'</span>':'')+'</td></tr>'}).join('')+'</tbody></table></div>');return}
  var w=el('div','spd');h.appendChild(w);
  function intro(){w.innerHTML='<div class="spd-in"><b>'+esc(cfg.title||'Speed round')+'</b><p>'+(cfg.intro||'')+'</p><p class="note">'+secs+' seconds. One tap per item. Best score on this device: <b>'+best+'</b></p><button class="btn pri" type="button">Start</button></div>';$('button',w).onclick=start}
  function start(){L=shuffle(cfg.items);i=0;ok=0;miss=[];t0=Date.now();next();clearInterval(timer);timer=setInterval(tick,200)}
  function tick(){var left=Math.max(0,secs-(Date.now()-t0)/1000),bar=$('.spd-bar i',w);if(bar)bar.style.width=(left/secs*100)+'%';var n=$('.spd-s',w);if(n)n.textContent=Math.ceil(left)+' s';if(left<=0||!document.body.contains(w))end()}
  function next(){if(i>=L.length)L=L.concat(shuffle(cfg.items));var c=L[i];
    w.innerHTML='<div class="spd-top"><span class="spd-bar"><i></i></span><span class="spd-s">'+secs+' s</span><b class="spd-sc">'+ok+'</b></div>'+
      '<div class="spd-item">'+c.x+'</div><div class="spd-cats">'+cfg.cats.map(function(k){return '<button type="button" class="btn" data-c="'+k.k+'">'+esc(k.n)+'</button>'}).join('')+'</div>';
    tick();$$('[data-c]',w).forEach(function(b){b.onclick=function(){var r=b.dataset.c===c.c;if(r)ok++;else miss.push(c);w.classList.remove('hit','mis');void w.offsetWidth;w.classList.add(r?'hit':'mis');i++;next()}})}
  function end(){clearInterval(timer);if(!document.body.contains(w))return;var nb=ok>best;if(nb){best=ok;store(id,String(ok))}
    var cat=function(k){return (cfg.cats.filter(function(x){return x.k===k})[0]||{}).n||k};
    var seen={};miss=miss.filter(function(m){if(seen[m.x])return false;seen[m.x]=1;return true});
    w.innerHTML='<div class="spd-end"><b>'+ok+'</b><span>right in '+secs+' seconds'+(nb?' — a new best!':' · best '+best)+'</span>'+
      (miss.length?'<ul>'+miss.slice(0,8).map(function(m){return '<li>'+m.x+' → <b>'+esc(cat(m.c))+'</b>'+(m.w?' — '+m.w:'')+'</li>'}).join('')+'</ul>':'<p>No misses.</p>')+
      '<button class="btn pri" type="button">Play again</button></div>';$('button',w).onclick=start;if(nb&&ok>=5)F.confetti()}
  intro()};

/* ---------- number flow between boxes (animated diagram with steps) ---------- */
F.flow=function(h,cfg){
  var B=cfg.boxes,K={},st=-1,busy=false,VW=cfg.w||640,VH=cfg.h||360;B.forEach(function(b){K[b.k]=b});
  var w=el('div','flw');h.appendChild(w);
  w.innerHTML='<svg viewBox="0 0 '+VW+' '+VH+'" class="flw-svg" role="img" aria-label="'+esc(cfg.label||'How the numbers move')+'"><defs><marker id="flwA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="flw-ah"/></marker></defs>'+
    '<g class="flw-paths"></g>'+B.map(function(b){return '<g class="flw-box" data-k="'+b.k+'"><rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="12"/><text x="'+(b.x+b.w/2)+'" y="'+(b.y+26)+'" text-anchor="middle" class="flw-t">'+esc(b.n)+'</text>'+
      (b.lines||[]).map(function(l,j){return '<text x="'+(b.x+14)+'" y="'+(b.y+50+j*20)+'" class="flw-l" data-l="'+b.k+j+'">'+esc(l)+'</text>'}).join('')+'</g>'}).join('')+
    '<g class="flw-tok" opacity="0"><rect rx="10" height="24"/><text y="16"></text></g></svg>'+
    '<div class="flw-note" aria-live="polite">'+(cfg.intro||'Press Play to watch each number travel to the statement where it lands.')+'</div>'+
    '<div class="row flw-ctl"><button class="btn pri" type="button" data-a="play">Play all</button><button class="btn" type="button" data-a="step">Next step</button><button class="btn ghost" type="button" data-a="reset">Start over</button><span class="note flw-n"></span></div>';
  var svg=$('svg',w),gp=$('.flw-paths',w),tok=$('.flw-tok',w),note=$('.flw-note',w),cnt=$('.flw-n',w);
  if(F.PRINT){st=cfg.steps.length-1;gp.innerHTML=cfg.steps.map(function(s){return '<path d="'+pathOf(s)+'" class="flw-p on" marker-end="url(#flwA)"/>'}).join('');
    var ctl=$('.flw-ctl',w);if(ctl)ctl.parentNode.removeChild(ctl);note.innerHTML='<ol class="flw-print">'+cfg.steps.map(function(s){return '<li><b>'+esc(s.label)+'</b>'+(s.note?' — '+s.note:'')+'</li>'}).join('')+'</ol>';return}
  function anchor(b,to){var cx=b.x+b.w/2,cy=b.y+b.h/2,tx=to.x+to.w/2,ty=to.y+to.h/2,dx=tx-cx,dy=ty-cy;
    if(Math.abs(dx)*b.h>Math.abs(dy)*b.w)return {x:cx+(dx>0?b.w/2:-b.w/2),y:cy+dy*(b.w/2)/Math.abs(dx)*0.5};return {x:cx+dx*(b.h/2)/Math.abs(dy)*0.5,y:cy+(dy>0?b.h/2:-b.h/2)}}
  function pathOf(s){var a=K[s.from],b=K[s.to],p=anchor(a,b),q=anchor(b,a);if(s.dy){p.y+=s.dy;q.y+=s.dy}if(s.dx){p.x+=s.dx;q.x+=s.dx}var mx=(p.x+q.x)/2,my=(p.y+q.y)/2,bend=s.bend||0,nx=-(q.y-p.y),ny=q.x-p.x,L=Math.sqrt(nx*nx+ny*ny)||1;
    return 'M'+p.x.toFixed(1)+' '+p.y.toFixed(1)+' Q'+(mx+nx/L*bend).toFixed(1)+' '+(my+ny/L*bend).toFixed(1)+' '+q.x.toFixed(1)+' '+q.y.toFixed(1)}
  function draw(){gp.innerHTML=cfg.steps.map(function(s,j){return '<path d="'+pathOf(s)+'" class="flw-p'+(j<=st?' on':'')+'" marker-end="url(#flwA)"/>'}).join('');
    $$('.flw-box',w).forEach(function(g){g.classList.remove('hit')});cnt.textContent=st>=0?'Step '+(st+1)+' of '+cfg.steps.length:'';
    $$('[data-a="step"]',w)[0].disabled=st>=cfg.steps.length-1;}
  function label(t){var tx=$('text',tok),r=$('rect',tok);tx.textContent=t;var bw=Math.max(60,t.length*7.2+20);r.setAttribute('width',bw);r.setAttribute('x',-bw/2);r.setAttribute('y',-12);tx.setAttribute('x',0);tx.setAttribute('y',4);tx.setAttribute('text-anchor','middle')}
  function run(j,done){var s=cfg.steps[j];st=j;draw();var p=$$('.flw-p',w)[j],len=p.getTotalLength();label(s.label);note.innerHTML='<b>'+esc(s.label)+'</b> — '+s.note;
    var land=function(){tok.setAttribute('opacity','0');var g=$('.flw-box[data-k="'+s.to+'"]',w);if(g){g.classList.remove('hit');void g.getBoundingClientRect();g.classList.add('hit')}if(s.hl)$$('[data-l="'+s.hl+'"]',w).forEach(function(t){t.classList.add('lit')});busy=false;if(done)done()};
    if(!F.motion()){land();return}
    busy=true;tok.setAttribute('opacity','1');var t0=performance.now(),D=cfg.ms||1400;
    (function fr(t){var e=Math.min(1,(t-t0)/D),k=e<.5?2*e*e:1-Math.pow(-2*e+2,2)/2,pt=p.getPointAtLength(len*k);tok.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+')');if(e<1)requestAnimationFrame(fr);else land()})(t0)}
  $$('[data-a]',w).forEach(function(b){b.onclick=function(){if(busy)return;var a=b.dataset.a;
    if(a==='reset'){st=-1;$$('.lit',w).forEach(function(t){t.classList.remove('lit')});note.innerHTML=cfg.intro||'';draw();return}
    if(a==='step'){if(st<cfg.steps.length-1)run(st+1);return}
    if(a==='play'){st=-1;$$('.lit',w).forEach(function(t){t.classList.remove('lit')});var go=function(j){if(j>=cfg.steps.length){note.insertAdjacentHTML('beforeend','<br><span class="note">'+(cfg.done||'')+'</span>');return}run(j,function(){setTimeout(function(){go(j+1)},F.motion()?700:0)})};go(0)}}});
  draw()};

/* ---------- welcome tour (first visit; again from How to use) ---------- */
var TOUR=[
 ['Welcome to START TIME — CMA','tour-1','Short slides, one idea each, every slide tagged with its LOS. Each idea comes with a one-line story about a company that fits it, and a picture that moves when movement helps.'],
 ['Learn by doing','tour-2','After each idea a <b>quick check</b> tells you at once if you got it. On interactive slides you change the numbers and watch the statements react, play short games and see the numbers travel.'],
 ['Practice like the exam','tour-3','Exam-style questions with an explanation for <b>every</b> option, cases like the exam\'s, and before you answer you can say how sure you are: <b>Sure, Not sure, Guessing</b>.'],
 ['We remember for you','tour-4','Every mistake is saved with its likely cause. Questions come back on day <b>1, 3, 7, 14 and 30</b> so you don\'t forget, a <b>mixed quiz</b> trains you to recognise the topic, and <b>exam readiness</b> shows how close you are to 75%.'],
 ['Your study tools','tour-5','A <b>Pomodoro</b> timer, calm background sound and a <b>daily goal</b> with a streak. The <b>calculator</b> and <b>present value tables</b> you will have in the exam. All in Settings — on only when you want them.'],
 ['Take it with you','tour-6','Print any topic as a clean handout with an answer key, export tables to Excel, and continue on any device with your code. Six sections of Part 1 — switch from the bar at the top of the home page.']];
F.tour=function(){var i=0,box=el('div','tour');
  function draw(){var c=TOUR[i];box.innerHTML='<div class="tour-art '+c[1]+'" aria-hidden="true">'+ART[c[1]]+'</div><h3>'+c[0]+'</h3><p>'+c[2]+'</p>'+
    '<div class="tour-dots">'+TOUR.map(function(_,j){return '<i class="'+(j===i?'on':'')+'"></i>'}).join('')+'</div>'+
    '<div class="row tour-act">'+(i?'<button class="btn" type="button" data-t="-1">Back</button>':'<button class="btn ghost" type="button" data-t="x">Skip</button>')+'<button class="btn pri" type="button" data-t="1">'+(i===TOUR.length-1?'Start studying':'Next')+'</button></div>';
    $$('[data-t]',box).forEach(function(b){b.onclick=function(){var v=b.dataset.t;if(v==='x'||(v==='1'&&i===TOUR.length-1)){store('st-tour1','1');ST.closeModal();if(v==='1')F.confetti();return}i+=+v;draw()}})}
  draw();ST.modal('Welcome',box)};
F.tourOnce=function(){if(store('st-tour1'))return;if(!ST.session||!ST.session())return;setTimeout(F.tour,500)};
var ART={
 'tour-1':'<svg viewBox="0 0 220 110"><circle cx="186" cy="24" r="12" class="a-sun"/><path d="M0 92h220v18H0z" class="a-gr"/><g class="a-palm"><path d="M38 92V52"/><path d="M38 52c-12-6-22-2-26 4M38 52c12-6 22-2 26 4M38 52c-6-10-16-12-22-10M38 52c6-10 16-12 22-10"/></g><rect x="86" y="54" width="72" height="38" rx="3" class="a-bld"/><text x="122" y="77" text-anchor="middle" class="a-tx">ADAM CO.</text><g class="a-truck"><rect x="150" y="76" width="30" height="14" rx="2"/><rect x="180" y="80" width="12" height="10" rx="2"/><circle cx="158" cy="92" r="4"/><circle cx="185" cy="92" r="4"/></g></svg>',
 'tour-2':'<svg viewBox="0 0 220 110"><rect x="30" y="20" width="160" height="70" rx="10" class="a-card"/><rect x="46" y="36" width="80" height="8" rx="4" class="a-ln"/><rect x="46" y="52" width="120" height="8" rx="4" class="a-ln"/><circle cx="160" cy="70" r="12" class="a-ok"/><path d="M154 70l4 4 8-8" class="a-tick"/></svg>',
 'tour-3':'<svg viewBox="0 0 220 110"><g class="a-opts"><rect x="40" y="18" width="140" height="18" rx="6"/><rect x="40" y="42" width="140" height="18" rx="6" class="a-right"/><rect x="40" y="66" width="140" height="18" rx="6"/></g><text x="52" y="31" class="a-tx">A</text><text x="52" y="55" class="a-tx">B ✓</text><text x="52" y="79" class="a-tx">C</text></svg>',
 'tour-4':'<svg viewBox="0 0 220 110"><circle cx="110" cy="56" r="40" class="a-ring"/><circle cx="110" cy="56" r="40" class="a-ringv"/><text x="110" y="62" text-anchor="middle" class="a-big">75%</text></svg>',
 'tour-5':'<svg viewBox="0 0 220 110"><circle cx="70" cy="56" r="32" class="a-ring"/><path d="M70 56V34" class="a-hand"/><rect x="128" y="22" width="60" height="70" rx="8" class="a-card"/><g class="a-keys"><rect x="136" y="44" width="12" height="10" rx="2"/><rect x="152" y="44" width="12" height="10" rx="2"/><rect x="168" y="44" width="12" height="10" rx="2"/><rect x="136" y="60" width="12" height="10" rx="2"/><rect x="152" y="60" width="12" height="10" rx="2"/><rect x="168" y="60" width="12" height="10" rx="2"/></g><rect x="136" y="28" width="44" height="10" rx="2" class="a-scr"/></svg>',
 'tour-6':'<svg viewBox="0 0 220 110"><g class="a-secs"><rect x="14" y="40" width="28" height="30" rx="6"/><rect x="48" y="40" width="28" height="30" rx="6"/><rect x="82" y="40" width="28" height="30" rx="6"/><rect x="116" y="40" width="28" height="30" rx="6"/><rect x="150" y="40" width="28" height="30" rx="6"/><rect x="184" y="40" width="28" height="30" rx="6"/></g><text x="28" y="60" text-anchor="middle" class="a-tx">A</text><text x="62" y="60" text-anchor="middle" class="a-tx">B</text><text x="96" y="60" text-anchor="middle" class="a-tx">C</text><text x="130" y="60" text-anchor="middle" class="a-tx">D</text><text x="164" y="60" text-anchor="middle" class="a-tx">E</text><text x="198" y="60" text-anchor="middle" class="a-tx">F</text></svg>'};

/* ---------- the opening scene: palm trees, the sun, a company with its name on a roof sign, four statements, a truck that drives in and parks at the door.
   ST.fun.scene('ADAM COMPANY') — any name, reused wherever a topic opens with a company. The truck never covers the name. ---------- */
F.scene=function(name){name=String(name||'').toUpperCase();var fs=name.length>16?' textLength="150" lengthAdjust="spacingAndGlyphs"':'';
  return '<div class="scene" aria-hidden="true"><svg viewBox="0 0 640 230">'+
  '<circle cx="250" cy="40" r="22" class="sc-sun"/><path d="M0 188h640v42H0z" class="sc-gr"/>'+
  [[60,110],[124,118],[624,112]].map(function(p,j){var x=p[0],y=p[1];return '<g class="sc-palm" style="animation-delay:'+(j*.4)+'s"><path d="M'+x+' 188V'+y+'"/><path d="M'+x+' '+y+'c-22-10-40-4-48 6M'+x+' '+y+'c22-10 40-4 48 6M'+x+' '+y+'c-10-18-28-22-40-18M'+x+' '+y+'c10-18 28-22 40-18"/></g>'}).join('')+
  '<rect x="200" y="104" width="190" height="84" rx="6" class="sc-bld"/><rect x="220" y="118" width="36" height="26" rx="3" class="sc-win"/><rect x="272" y="118" width="36" height="26" rx="3" class="sc-win"/><rect x="324" y="118" width="36" height="26" rx="3" class="sc-win"/>'+
  '<rect x="336" y="150" width="30" height="38" rx="3" class="sc-door"/>'+
  '<g class="sc-sign"><path d="M240 104V96M350 104V96" class="sc-post"/><rect x="212" y="72" width="166" height="26" rx="6"/><text x="295" y="86" text-anchor="middle" dominant-baseline="central" class="sc-name"'+fs+'>'+name.replace(/[<&>]/g,'')+'</text></g>'+
  [['Balance','sheet'],['Income','statement'],['Cash','flows'],['Changes','in equity']].map(function(n,j){var x=418+(j%2)*98,y=62+Math.floor(j/2)*62;
    return '<g class="sc-doc" style="animation-delay:'+(2.2+j*.3)+'s"><rect x="'+x+'" y="'+y+'" width="90" height="52" rx="6"/><path d="M'+(x+10)+' '+(y+38)+'h42M'+(x+10)+' '+(y+44)+'h28" class="sc-ln"/><text x="'+(x+45)+'" y="'+(y+17)+'" text-anchor="middle">'+n[0]+'</text><text x="'+(x+45)+'" y="'+(y+30)+'" text-anchor="middle">'+n[1]+'</text></g>'}).join('')+
  '<g class="sc-truck"><rect x="0" y="160" width="58" height="26" rx="3"/><rect x="58" y="168" width="22" height="18" rx="3"/><rect x="63" y="171" width="11" height="7" rx="1.5" class="sc-tw"/><circle cx="16" cy="190" r="7"/><circle cx="64" cy="190" r="7"/></g>'+
  '</svg></div>'};
})();
