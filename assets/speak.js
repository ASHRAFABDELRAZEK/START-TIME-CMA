/* START TIME — "Listen": reads slides aloud with the device's own voice (Web Speech API: free, no audio files).
   Permissions (Roles sheet), each separate:  listen = the lessons · listenBank = the question bank (its part of a topic,
   sets, mistakes, review) · listenAuto = hands-free: the whole lesson, slide after slide.
   Settings → Listen, each separate on/off: Lessons, Question bank, Hands-free, Follow each word, Read tables,
   Read the explanation after an answer; a pause between sentences (none / 1 / 2 / 3 / 5 s); plus the voice and a tip for a more natural voice.
   On a slide: Listen / Pause / Resume (carries on from the same sentence), Stop, speed. Tap any sentence to start there
   (while reading it jumps straight there). K = listen / pause, Shift+K = stop.
   The block being read is tinted; where the browser can (CSS Custom Highlight API + word events) the sentence and the
   word being spoken are highlighted too. Pictures are skipped; tables are read row by row; exam terms are spoken the
   way people say them; in an exam set the explanations are never read. */
(function(){
var ST=window.ST,SS=window.speechSynthesis;if(!ST||!SS||!window.SpeechSynthesisUtterance)return;
var K={p:'st-tts-p',l:'st-tts-l',b:'st-tts-b',a:'st-tts-a',w:'st-tts-w',t:'st-tts-t',e:'st-tts-e',v:'st-tts-voice',r:'st-tts-rate2',g:'st-tts-gap'};
var DEF={p:'0',l:'1',b:'1',a:'0',w:'1',t:'1',e:'1'};   // Listen is on where the role allows it (its button: Settings → Your screen); hands-free stays off until turned on
/* speeds as a share of the voice's own pace (owner 20 Oct 01:48 and 01:57: more steps, 70 % to 100 %, nothing faster — the students read English
   carefully). The old three were 0.8 / 0.95 / 1.1: a saved 0.8 or 0.95 stays, a saved "Faster" (1.1) becomes 100 %. */
var RATES=[['0.7','70%'],['0.75','75%'],['0.8','80%'],['0.85','85%'],['0.9','90%'],['0.95','95% · normal'],['1','100%']];
/* a silence after each sentence (owner 20 Oct 02:05: time to translate the sentence in his head before the next one); not in a recorded MP3 */
var GAPS=[['0','None'],['1','1 s'],['2','2 s'],['3','3 s'],['5','5 s']];
function gapKey(){var v=get(K.g,'0');return GAPS.some(function(x){return x[0]===v})?v:'0'}
function gapMs(){return REC?0:(+gapKey())*1000}
function rateKey(){var v=get(K.r,'0.95');if(RATES.some(function(x){return x[0]===v}))return v;return parseFloat(v)>1?'1':'0.95'}
var HL=!!(window.CSS&&CSS.highlights&&window.Highlight);
var voices=[],run=null,cur=null,pendingAuto=false,fl=null,REC=null;
function get(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function opt(x){return get(K[x],DEF[x])==='1'}
function perm(k){try{return !!(ST.canStaff&&ST.canStaff(k))||!!(ST.can&&ST.can(k))}catch(e){return false}}
function hereBank(){return !!ST.inBank}
function allowedHere(){return perm(hereBank()?'listenBank':'listen')}
function onHere(){return opt(hereBank()?'b':'l')}
function autoOn(){return !!(REC&&REC.scope==='lesson')||(perm('listenAuto')&&opt('a'))}
function rate(){return parseFloat(rateKey())||0.95}

/* ---------- voices: the most natural English voice on the device first ---------- */
function score(v){var n=v.name,s=0;
  if(/natural|neural/i.test(n))s+=60;if(/online/i.test(n))s+=20;if(/premium/i.test(n))s+=55;if(/enhanced/i.test(n))s+=45;
  if(/^google/i.test(n))s+=30;if(/aria|jenny|guy|ava|andrew|emma|brian|sonia|ryan|libby|samantha|daniel|karen|zoe/i.test(n))s+=10;
  if(/en-US/i.test(v.lang))s+=6;else if(/en-GB/i.test(v.lang))s+=4;
  if(/compact|espeak|zira|david|mark|hazel/i.test(n))s-=40;return s}
function load(){voices=SS.getVoices().filter(function(v){return /^en[-_]/i.test(v.lang)}).sort(function(a,b){return score(b)-score(a)})}
load();if(SS.addEventListener)SS.addEventListener('voiceschanged',function(){load();document.querySelectorAll('.tts-v').forEach(fillVoices)});
function pick(){var w=get(K.v,'');for(var i=0;i<voices.length;i++)if(voices[i].name===w)return voices[i];return voices[0]||null}
function fillVoices(sel){var c=pick();sel.innerHTML=voices.length?voices.map(function(v,i){return '<option value="'+i+'"'+(c&&v.name===c.name?' selected':'')+'>'+(i===0?'★ ':'')+v.name.replace(/^Microsoft /,'').replace(/ - English.*$/,'')+' · '+v.lang+'</option>'}).join(''):'<option>No English voice on this device</option>'}

/* ---------- how words are spoken ---------- */
var DICT={'LOS':'L O S','CMA':'C M A','IMA':'I M A','GAAP':'gap','IFRS':'I F R S','IAS':'I A S','FASB':'fazz-bee','IASB':'I A S B',
 'COGS':'cogs','COGM':'C O G M','LIFO':'lie-foe','FIFO':'fie-foe','ROI':'R O I','ROA':'R O A','ROE':'R O E','EPS':'E P S','EBIT':'ee-bit',
 'EBITDA':'ee-bit-dah','NPV':'N P V','IRR':'I R R','ARR':'A R R','WACC':'wack','CAPM':'cap M','OCI':'O C I','AOCI':'A O C I','PP&E':'P P and E',
 'NCI':'N C I','VIE':'V I E','ASC':'A S C','ASU':'A S U','SEC':'S E C','KPI':'K P I','KPIs':'K P Is','CSF':'C S F','CSFs':'C S Fs','BSC':'B S C',
 'ABC':'A B C','JIT':'just-in-time','ERP':'E R P','CVP':'C V P','MRP':'M R P','TQM':'T Q M','EVA':'E V A','MVA':'M V A','DM':'D M','DL':'D L',
 'VOH':'variable overhead','FOH':'fixed overhead','MOH':'manufacturing overhead','SG&A':'S G and A','R&D':'R and D','CPA':'C P A','ACCA':'A C C A',
 'CIMA':'see-ma','CFA':'C F A','XBRL':'X B R L','ESG':'E S G','GRI':'G R I','SASB':'sass-bee','COSO':'koh-so','SOX':'socks','AQ':'A Q','SQ':'S Q',
 'AP':'A P','SP':'S P','AH':'A H','SH':'S H','AR':'A R','SR':'S R','CM':'C M','BEP':'break-even point','DOL':'D O L','DFL':'D F L','IRS':'I R S'};
var DKEYS=Object.keys(DICT).sort(function(a,b){return b.length-a.length}).map(function(k){return k.replace(/[&]/g,'\\&')});
function y(re){return new RegExp(re.source,'y'+(re.ignoreCase?'i':''))}
var RULES=[
 [y(/[A-F]\.\d\.[a-z]{1,2}\b/),function(m){return m[0].split('.').join(' ')}],                 // LOS A.1.a
 [y(/SAR\s*(\d[\d,]*(?:\.\d+)?)/),function(m){return m[1]+' riyals'}],
 [y(/\(SAR\)/),'(in riyals)'],[y(/\bSAR\b/),'riyals'],
 [y(/\be\.g\.,?/),'for example,'],[y(/\bi\.e\.,?/),'that is,'],[y(/\bvs\.?(?=\s)/),'versus'],[y(/\betc\./),'et cetera.'],
 [new RegExp('\\b(?:'+DKEYS.join('|')+')(?![\\w&])','y'),function(m){return DICT[m[0]]}],
 [y(/\s\+\s/),' plus '],[y(/\s[−–-]\s(?=\d)/),' minus '],[y(/\s?×\s?/),' times '],[y(/\s?÷\s?/),' divided by '],
 [y(/\s?→\s?/),' to '],[y(/\s?=\s?/),' equals '],[y(/\s?≥\s?/),' at least '],[y(/\s?≤\s?/),' at most '],[y(/\s?—\s?/),', ']];
var RULE_T=[[y(/\((\d[\d,]*(?:\.\d+)?)\)/),function(m){return 'minus '+m[1]}]];                        // in a table, (540,000) is a deduction
/* R (the page's text) → S (what is spoken), with rs/re: for each spoken character, the span of page text it came from */
function speakable(R,table){var S='',rs=[],re=[],i=0,rules=table?RULE_T.concat(RULES):RULES;
  while(i<R.length){var m=null,rep=null;
    for(var j=0;j<rules.length;j++){var x=rules[j][0];x.lastIndex=i;m=x.exec(R);if(m&&m[0].length){rep=typeof rules[j][1]==='function'?rules[j][1](m):rules[j][1];break}m=null}
    if(m){for(var c=0;c<rep.length;c++){var ch=rep[c];if(/\s/.test(ch)&&(!S||/\s$/.test(S)))continue;S+=ch;rs.push(i);re.push(i+m[0].length)}i+=m[0].length;continue}
    var h=R[i];if(/\s/.test(h)){if(S&&!/\s$/.test(S)){S+=' ';rs.push(i);re.push(i+1)}i++;continue}
    S+=h;rs.push(i);re.push(i+1);i++}
  return {S:S,rs:rs,re:re}}
/* sentences (short ones joined), each with its place in S — Pause / Resume and "tap a sentence" work sentence by sentence */
function pieces(S){var out=[],st=0,rx=/[.!?]+["')\]]*(?=\s|$)/g,m;
  function push(a,b){while(a<b&&/\s/.test(S[a]))a++;var t=S.slice(a,b).trim();if(!t)return;var last=out[out.length-1];
    if(last&&last.t.length<40)last.t=S.slice(last.off,a+t.length);else out.push({off:a,t:t})}
  while((m=rx.exec(S))){var e=m.index+m[0].length;push(st,e);st=e}if(st<S.length)push(st,S.length);return out}

/* ---------- reading blocks built from the page's own text nodes (so a word can be highlighted where it is) ---------- */
var SKIP='svg,.anim,.diagw,.tts-bar,.rd-bar,.trs-sl,script,style';
function isBlockEl(e){var d=getComputedStyle(e).display;return d!=='inline'&&d!=='inline-block'&&d!=='contents'}
function Block(el,table){this.el=el;this.table=!!table;this.R='';this.parts=[]}
Block.prototype.stop=function(){var t=this.R.replace(/\s+$/,'');return this.lit(!t?'':/[.!?:;,]$/.test(t)?' ':'. ')};
Block.prototype.lit=function(s){if(!s)return this;this.parts.push({node:null,start:this.R.length,len:s.length});this.R+=s;return this};
Block.prototype.add=function(root,skip){var self=this,lastB=null;
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){var p=n.parentElement;if(!p)return 2;
    if(p.closest(SKIP))return 2;if(skip&&p.closest(skip)&&root.contains(p.closest(skip)))return 2;
    if(!p.getClientRects().length)return 2;return 1}}),n;
  while((n=w.nextNode())){var b=n.parentElement;while(b!==root&&!isBlockEl(b))b=b.parentElement;
    if(lastB&&b!==lastB&&self.R&&!/\s$/.test(self.R))self.lit(/[.!?:;,]$/.test(self.R)?' ':'. ');lastB=b;
    self.parts.push({node:n,start:self.R.length,len:n.nodeValue.length});self.R+=n.nodeValue}
  return this};
Block.prototype.done=function(){var x=speakable(this.R,this.table);this.S=x.S;this.rs=x.rs;this.re=x.re;this.ps=pieces(this.S);return this.ps.length?this:null};
/* page-text span [a,b) → a DOM Range (skipping inserted words) */
Block.prototype.range=function(a,b){var s=null,e=null;
  for(var i=0;i<this.parts.length;i++){var p=this.parts[i];if(!p.node)continue;
    if(!s&&a<p.start+p.len&&b>p.start)s=[p.node,Math.max(0,a-p.start)];
    if(s&&p.start<b)e=[p.node,Math.min(p.len,b-p.start)]}
  if(!s||!e)return null;try{var r=document.createRange();r.setStart(s[0],s[1]);r.setEnd(e[0],e[1]);return r}catch(x){return null}};
Block.prototype.spanS=function(a,b){a=Math.max(0,Math.min(a,this.rs.length-1));b=Math.max(a+1,Math.min(b,this.re.length));return this.range(this.rs[a],this.re[b-1])};

function txtBlock(el,skip,table){return new Block(el,table).add(el,skip).done()}
function rowBlock(tr){var cells=Array.prototype.slice.call(tr.children),tb=tr.closest('table');
  if(!cells.length)return null;var allTh=cells.every(function(c){return c.tagName==='TH'});
  var first=tb&&tb.rows[0],hdr=first&&Array.prototype.every.call(first.cells,function(c){return c.tagName==='TH'})?Array.prototype.map.call(first.cells,function(c){return (c.innerText||'').trim()}):[];
  if(allTh)return cells.length<=2&&(cells[0].innerText||'').trim()?txtBlock(cells[0],null,true):null;
  var b=new Block(tr,true),n=cells.length,said=0;
  cells.forEach(function(c,j){var t=(c.innerText||'').trim();if(!t||/^[–—-]$/.test(t))return;
    var L0=b.R.length;if(said)b.lit(n>2&&hdr[j]?', '+hdr[j]+': ':(said===1&&n===2?': ':', '));b.add(c);if(b.parts.length&&b.parts[b.parts.length-1].node)said++;else{b.R=b.R.slice(0,L0);b.parts=b.parts.filter(function(p){return p.start<L0})}});
  return said?b.done():null}
function qcBlock(qc){var b=new Block(qc);b.lit('Quick check. ');var q=qc.querySelector('.qc-q');if(q)b.add(q,'.qc-t');
  qc.querySelectorAll('.qc-o').forEach(function(o,i){b.stop();b.lit('ABCDEFG'[i]+'. ');b.add(o,'.k')});return b.done()}

function slideBlocks(ctx){var out=[],sec=ctx.sec,push=function(b){if(b)out.push(b)};
  var h=sec.querySelector(':scope > h2');if(h)push(txtBlock(h));
  var roots=[],cx=sec.querySelector('details.case-x[open] .case-b');if(cx)roots.push(cx);roots.push(ctx.body);
  var tables=opt('t');
  roots.forEach(function(root){root.querySelectorAll('h3,h4,p,li,.call,tr,.qc,.q .stem,.q .opt').forEach(function(e){
    if(e.closest(SKIP))return;
    if(e.matches('.qc')){push(qcBlock(e));return}
    if(e.matches('.stem')){var b=new Block(e);b.lit(ctx.practice?'Question. ':'');push(b.add(e).done());return}
    if(e.matches('.opt')){var i=Array.prototype.indexOf.call(e.parentNode.children,e);var bo=new Block(e);bo.lit('ABCDEFGH'[i]+'. ');push(bo.add(e,'.k,.why').done());return}
    if(e.closest('.qc,.q,.fb,.qc-e'))return;
    if(e.matches('tr')){if(tables)push(rowBlock(e));return}
    if(e.closest('table'))return;
    if(e.matches('.call')){if(e.parentElement&&e.parentElement.closest('.call'))return;var bc=new Block(e);var ct=e.querySelector('.ct');if(ct){bc.add(ct);bc.stop()}push(bc.add(e,'.ct').done());return}
    if(e.closest('.call'))return;
    if(e.matches('p,li')&&e.querySelector('p,li'))return;
    push(txtBlock(e))})});
  return out}
/* after an answer: the verdict and explanation, then why the chosen option is wrong and why the right one is right */
function fbBlocks(fb){var out=[],q=fb.closest('.q');var b=txtBlock(fb);if(b)out.push(b);
  if(q){var L='ABCDEFGH',os=Array.prototype.slice.call(q.querySelectorAll('.opt'));
    var bad=os.filter(function(o){return o.classList.contains('bad')})[0],ok=os.filter(function(o){return o.classList.contains('ok')})[0];
    [[bad,'Your choice, '],[ok,'The answer, ']].forEach(function(p){var o=p[0],w=o&&o.querySelector('.why');if(!w||!(w.innerText||'').trim())return;
      var x=new Block(w);x.lit(p[1]+L[os.indexOf(o)]+': ');x.add(w);x=x.done();if(x)out.push(x)})}
  return out}

/* ---------- highlights ---------- */
function clearHL(){if(HL){CSS.highlights.delete('tts-s');CSS.highlights.delete('tts-w')}document.querySelectorAll('.tts-on').forEach(function(e){e.classList.remove('tts-on')})}
function hl(name,r){if(!HL)return;if(r)CSS.highlights.set(name,new Highlight(r));else CSS.highlights.delete(name)}

/* ---------- the player ---------- */
function paint(){var c=cur;if(!c||!c.bar)return;var st=run&&run.ctx===c?run.state:'idle';
  c.bar.classList.toggle('playing',st==='play');c.bar.classList.toggle('paused',st==='pause');
  c.btn.textContent=st==='play'?'⏸ Pause':st==='pause'?'▶ Resume':'🔊 Listen';c.stopB.hidden=!(st==='play'||st==='pause')}
function stop(){if(run){run.gen++;run=null}SS.cancel();clearHL();paint()}
function pause(){if(!run||run.state!=='play')return;run.gen++;run.state='pause';SS.cancel();paint()}
function startCtx(ctx,blocks,i,k,after){stop();if(!blocks||!blocks.length){finish({ctx:ctx,after:after});return}
  ctx.armed=true;run={ctx:ctx,blocks:blocks,i:i||0,k:k||0,gen:0,state:'idle',after:after||''};go(run)}
function go(r){var g=++r.gen,v=pick(),word=opt('w');r.state='play';paint();SS.cancel();clearHL();
  (function say(){if(r.gen!==g||run!==r)return;
    if(r.i>=r.blocks.length){finish(r);return}
    var b=r.blocks[r.i];if(r.k>=b.ps.length){r.i++;r.k=0;
      if(opt('p')&&!REC&&r.i<r.blocks.length&&!r.after){r.gen++;r.state='pause';hl('tts-s',null);hl('tts-w',null);paint();return}   // presenter: stop after each paragraph (it stays tinted); Resume reads the next
      clearHL();setTimeout(say,Math.max(260,gapMs()));return}
    var p=b.ps[r.k];
    if(!b.el.classList.contains('tts-on')){document.querySelectorAll('.tts-on').forEach(function(e){e.classList.remove('tts-on')});b.el.classList.add('tts-on')}
    if(r.k===0)try{b.el.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}
    hl('tts-s',b.spanS(p.off,p.off+p.t.length));hl('tts-w',null);
    var u=new SpeechSynthesisUtterance(p.t);if(v){u.voice=v;u.lang=v.lang}else u.lang='en-US';u.rate=rate();
    if(word&&HL)u.onboundary=function(e){if(r.gen!==g||e.name&&e.name!=='word')return;var a=p.off+e.charIndex,len=e.charLength;
      if(!len){var mm=/^\S+/.exec(b.S.slice(a));len=mm?mm[0].length:1}hl('tts-w',b.spanS(a,a+len))};
    var done=false,fin=function(){if(done||r.gen!==g)return;done=true;r.k++;var ms=gapMs();if(ms&&r.k<b.ps.length){hl('tts-w',null);setTimeout(say,ms)}else say()};   // the pause after a sentence; say() checks gen, so Pause / Stop during it holds
    u.onend=fin;u.onerror=function(e){if(e&&(e.error==='interrupted'||e.error==='canceled'))return;fin()};SS.speak(u)})()}
/* the end of a run: a question waits for its answer; otherwise hands-free goes to the next slide */
function finish(r){var c=r.ctx;if(run===r){run.gen++;run=null}clearHL();paint();
  if(REC){if(REC.scope==='slide')endRec();else setTimeout(function(){if(cur===c&&!run)nextSlide()},700);return}   // recording: questions are read, not waited for
  var exq=!!c.sec.closest('.exq');
  if(r.after!=='fb'&&c.practice&&!c.sec.querySelector('.q .fb')){c.waitAuto=autoOn()&&!exq;return}   // wait for the answer (an exam set never moves on by itself)
  if(autoOn())setTimeout(function(){if(cur===c&&!run)nextSlide()},r.after==='fb'?1200:700)}
function nextSlide(){var nx=document.querySelector('.dk-nav .btn.pri');if(!nx||(nx.textContent||'').trim()!=='Next'){if(REC)endRec();return}pendingAuto=true;nx.click()}

/* ---------- a slide: the bar, the answer watcher ---------- */
var prev=ST.deckSlide;
ST.deckSlide=function(sec,body,t,s){if(prev)prev.apply(this,arguments);
  var auto=pendingAuto;pendingAuto=false;if(run)stop();cur=null;
  if(!allowedHere()||!onHere()){if(auto&&REC)setTimeout(nextSlide,700);return}
  var ctx={sec:sec,body:body,t:t,s:s,practice:!!(ST.isPractice&&ST.isPractice(s)),armed:false};cur=ctx;
  var bar=document.createElement('div');bar.className='tts-bar';
  bar.innerHTML='<button type="button" class="btn sm tts-b" title="Listen / pause (K)">🔊 Listen</button>'+
    '<button type="button" class="btn sm tts-s" hidden title="Stop (Shift+K)">■ Stop</button>'+
    '<select class="tts-r" aria-label="Speed">'+RATES.map(function(x){return '<option value="'+x[0]+'">'+x[1]+'</option>'}).join('')+'</select>'+
    (canRec()?'<button type="button" class="btn sm tts-rec" title="Record an MP3">⏺ Record MP3</button>':'')+
    '<span class="tts-hint">Tap any sentence to start there</span>';
  ctx.bar=bar;ctx.btn=bar.querySelector('.tts-b');ctx.stopB=bar.querySelector('.tts-s');var rs=bar.querySelector('.tts-r');
  rs.value=rateKey();
  ctx.btn.onclick=function(){toggle(ctx)};ctx.stopB.onclick=function(){if(REC)endRec();else if(run&&run.ctx===ctx)stop()};
  ctx.recB=bar.querySelector('.tts-rec');if(ctx.recB)ctx.recB.onclick=function(){if(REC)endRec();else recMenu(ctx)};paintRec();
  rs.onchange=function(){put(K.r,rs.value);if(run&&run.ctx===ctx&&run.state==='play')go(run)};
  var h2=sec.querySelector(':scope > h2');if(h2)h2.insertAdjacentElement('afterend',bar);else sec.insertBefore(bar,body);
  /* answers: a practice question's feedback, or a quick check's explanation — read when this slide was listened to */
  try{new MutationObserver(function(ms){if(cur!==ctx||!ctx.armed)return;var fb=null,qe=null;
    ms.forEach(function(m){if(m.type==='childList')Array.prototype.forEach.call(m.addedNodes,function(n){if(n.nodeType===1&&n.matches('.fb')&&n.closest('.q'))fb=n});
      else if(m.target.matches&&m.target.matches('.qc-e')&&!m.target.hidden)qe=m.target});
    if(fb){if(sec.closest('.exq'))return;
      if(!opt('e')){if(ctx.waitAuto||autoOn())setTimeout(function(){if(cur===ctx&&!run)nextSlide()},1500);return}
      setTimeout(function(){if(cur===ctx)startCtx(ctx,fbBlocks(fb),0,0,'fb')},350)}
    else if(qe&&opt('e')){var b=txtBlock(qe);if(!b)return;
      if(run&&run.ctx===ctx&&run.state!=='idle'){run.blocks.splice(run.i+1,0,b)}else startCtx(ctx,[b],0,0,'fb')}
  }).observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']})}catch(e){}
  if(auto)setTimeout(function(){if(cur===ctx&&!run)startCtx(ctx,slideBlocks(ctx))},700);
};
function toggle(ctx){if(!run||run.ctx!==ctx)startCtx(ctx,slideBlocks(ctx));else if(run.state==='play')pause();else go(run)}

/* ---------- tap a sentence ---------- */
function caretAt(x,yy){if(document.caretPositionFromPoint){var p=document.caretPositionFromPoint(x,yy);return p&&{node:p.offsetNode,off:p.offset}}
  if(document.caretRangeFromPoint){var r=document.caretRangeFromPoint(x,yy);return r&&{node:r.startContainer,off:r.startOffset}}return null}
function locate(blocks,node,off){for(var i=0;i<blocks.length;i++){var b=blocks[i];for(var j=0;j<b.parts.length;j++){var p=b.parts[j];if(p.node!==node)continue;
  var R=p.start+off,s=0;while(s<b.rs.length-1&&b.re[s]<=R)s++;var k=0;for(var q=0;q<b.ps.length;q++)if(b.ps[q].off<=s)k=q;return {i:i,k:k}}}return null}
function hideFl(){if(fl)fl.hidden=true}
document.addEventListener('click',function(e){
  if(fl&&e.target===fl)return;hideFl();
  var c=cur;if(!c||!c.sec.isConnected||!c.sec.contains(e.target))return;
  if(e.target.closest('button,a,input,select,textarea,label,summary,.opt,.qc-o,svg,.tts-bar,.anim,.diagw'))return;
  var sel=window.getSelection&&window.getSelection();if(sel&&!sel.isCollapsed)return;
  var pos=caretAt(e.clientX,e.clientY);if(!pos||pos.node.nodeType!==3)return;
  var mine=run&&run.ctx===c,blocks=mine?run.blocks:slideBlocks(c),at=locate(blocks,pos.node,pos.off);if(!at)return;
  if(mine&&(run.state==='play'||run.state==='pause')){run.i=at.i;run.k=at.k;go(run);return}
  if(!fl){fl=document.createElement('button');fl.type='button';fl.className='tts-fl';fl.textContent='▶ Read from here';fl.hidden=true;document.body.appendChild(fl)}
  fl.onclick=function(){hideFl();if(cur===c)startCtx(c,blocks,at.i,at.k)};
  fl.hidden=false;var w=fl.offsetWidth||140,vw=document.documentElement.clientWidth;
  fl.style.left=(Math.max(8,Math.min(vw-w-8,e.clientX-w/2))+window.scrollX)+'px';fl.style.top=(e.clientY+14+window.scrollY)+'px'});

/* ---------- keys, leaving the page ---------- */
document.addEventListener('keydown',function(e){if(e.key!=='k'&&e.key!=='K')return;if(e.ctrlKey||e.metaKey||e.altKey)return;
  var tg=e.target&&e.target.tagName;if(/INPUT|SELECT|TEXTAREA/.test(tg||''))return;var m=document.getElementById('modal');if(m&&!m.hidden)return;
  if(!cur||!cur.sec.isConnected)return;e.preventDefault();if(e.shiftKey){if(REC)endRec();else if(run&&run.ctx===cur)stop()}else toggle(cur)});
window.addEventListener('hashchange',function(){hideFl();if(run&&run.state==='play'&&autoOn())pendingAuto=true;stop();cur=null});   // runs before the deck draws the next slide
window.addEventListener('pagehide',stop);
document.addEventListener('visibilitychange',function(){if(document.hidden&&!REC)pause()});

/* ---------- Record MP3 (computer): the screen-share prompt gives the system sound; it is recorded while the slides are read,
   then turned into an MP3 in the browser (lamejs) and downloaded. Permission: listenRecord. ---------- */
function canRec(){return perm('listenRecord')&&!!(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia&&window.MediaRecorder)&&!/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)}
function mmss(ms){var s=Math.floor(ms/1000);return ('0'+Math.floor(s/60)).slice(-2)+':'+('0'+s%60).slice(-2)}
var recTick=null;
function paintRec(){var c=cur;if(c&&c.recB){c.recB.classList.toggle('on',!!REC);c.recB.textContent=REC?'⏹ Stop recording '+mmss(Date.now()-REC.t0):'⏺ Record MP3'}
  if(c&&c.stopB&&REC)c.stopB.hidden=true;
  clearTimeout(recTick);if(REC)recTick=setTimeout(paintRec,1000)}
function note(msg,keep){var n=document.getElementById('ttsNote');if(!n){n=document.createElement('div');n.id='ttsNote';n.className='tts-note';document.body.appendChild(n)}
  n.innerHTML=msg;n.hidden=false;clearTimeout(n._t);if(!keep)n._t=setTimeout(function(){n.hidden=true},9000);return n}
function recMenu(ctx){var old=ctx.bar.querySelector('.tts-rm');if(old){old.remove();return}
  var m=document.createElement('div');m.className='tts-rm';
  m.innerHTML='<b>Record an MP3</b><div class="tts-rm-b"><button type="button" class="btn sm pri" data-s="slide">This slide</button><button type="button" class="btn sm" data-s="lesson">The lesson, from this slide</button></div>'+
    '<p class="note">Edge or Chrome will ask what to share: choose <b>this tab</b> (the platform) and switch on <b>Also share tab audio</b>. Recording runs in real time; <b>Stop recording</b> saves what is recorded so far. If no sound reaches the recording, a warning appears within a few seconds.</p>';
  m.querySelectorAll('[data-s]').forEach(function(b){b.onclick=function(){m.remove();startRec(ctx,b.dataset.s)}});
  ctx.bar.appendChild(m)}
function fname(ctx,scope){var t=ctx.t||{},n=(t.n||t.id||'lesson'),i=(location.hash.match(/\/(\d+)$/)||[])[1];
  return ('START TIME - '+n+(scope==='slide'&&i?' - slide '+i:' - from slide '+(i||1))).replace(/[\\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim()}
function startRec(ctx,scope){var md=navigator.mediaDevices;
  md.getDisplayMedia({video:true,audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,suppressLocalAudioPlayback:false,restrictOwnAudio:false},
    preferCurrentTab:true,selfBrowserSurface:'include',systemAudio:'include',surfaceSwitching:'exclude'}).then(function(st){
    var at=st.getAudioTracks();if(!at.length){st.getTracks().forEach(function(t){t.stop()});note('<b>No sound was shared.</b> Try again: choose <b>this tab</b> and switch on <b>Also share tab audio</b>.');return}
    var mt=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'].filter(function(x){return MediaRecorder.isTypeSupported(x)})[0]||'';
    var rec=new MediaRecorder(new MediaStream(at),mt?{mimeType:mt}:undefined);
    REC={st:st,rec:rec,chunks:[],scope:scope,name:fname(ctx,scope),t0:Date.now()};var me=REC;
    try{var AC=window.AudioContext||window.webkitAudioContext,ac=new AC(),an=ac.createAnalyser(),buf=new Float32Array(2048),peak=0;an.fftSize=2048;ac.createMediaStreamSource(new MediaStream(at)).connect(an);
      var chk=setInterval(function(){if(REC!==me){clearInterval(chk);try{ac.close()}catch(e){}return}an.getFloatTimeDomainData(buf);for(var i=0;i<buf.length;i++){var a=Math.abs(buf[i]);if(a>peak)peak=a}},200);
      setTimeout(function(){if(REC===me&&peak<0.002)note('<b>No sound is reaching the recording.</b> The browser is not passing the voice to it. Press <b>Stop recording</b> and try again choosing <b>this tab</b> with <b>Also share tab audio</b>.',true)},9000)}catch(e){}
    rec.ondataavailable=function(e){if(e.data&&e.data.size)me.chunks.push(e.data)};rec.start(1000);
    st.getTracks().forEach(function(t){t.onended=function(){if(REC===me)endRec()}});   // "Stop sharing" in Chrome saves too
    paintRec();setTimeout(function(){if(REC===me&&cur)startCtx(cur,slideBlocks(cur))},600)
  }).catch(function(e){if(e&&e.name==='NotAllowedError')return;note('Recording could not start: '+((e&&e.message)||e))})}
function endRec(){if(!REC)return;var R=REC;REC=null;stop();paintRec();
  var done=false,fin=function(){if(done)return;done=true;R.st.getTracks().forEach(function(t){t.stop()});saveRec(R)};
  try{R.rec.onstop=fin;R.rec.stop();setTimeout(fin,3000)}catch(e){fin()}}
function dl(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},4000)}
function lame(){if(window.lamejs)return Promise.resolve();   // the MP3 encoder (lamejs, LGPL) ships with the site; the CDN copy is only a fallback
  function load(src){return new Promise(function(ok,no){var s=document.createElement('script');s.src=src;s.onload=function(){window.lamejs?ok():no(new Error('MP3 encoder did not load'))};s.onerror=function(){no(new Error('MP3 encoder did not load'))};document.head.appendChild(s)})}
  return load('assets/vendor/lame.min.js').catch(function(){return load('https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js')})}
function saveRec(R){var raw=new Blob(R.chunks,{type:(R.rec&&R.rec.mimeType)||'audio/webm'});
  if(!raw.size){note('Nothing was recorded.');return}
  var n=note('Making the MP3… <span class="tts-pc">0%</span>',true);
  toMp3(raw,function(p){var x=n.querySelector('.tts-pc');if(x)x.textContent=Math.round(p*100)+'%'}).then(function(mp3){dl(mp3,R.name+'.mp3');note('<b>Saved:</b> '+R.name+'.mp3 (in Downloads)')})
    .catch(function(e){dl(raw,R.name+'.webm');note('The MP3 could not be made ('+((e&&e.message)||e)+'), so the recording was saved as .webm (VLC plays it).')})}
function toMp3(blob,prog){var SR=44100;
  return Promise.all([lame(),blob.arrayBuffer()]).then(function(x){var AC=window.AudioContext||window.webkitAudioContext,ac=new AC();
    return new Promise(function(ok,no){ac.decodeAudioData(x[1],ok,no)}).then(function(buf){try{ac.close()}catch(e){}
      var oc=new OfflineAudioContext(1,Math.ceil(buf.duration*SR),SR),src=oc.createBufferSource();src.buffer=buf;src.connect(oc.destination);src.start();return oc.startRendering()})})
  .then(function(buf){var f=buf.getChannelData(0),enc=new lamejs.Mp3Encoder(1,SR,64),out=[],i=0,N=1152,STEP=N*400;
    return new Promise(function(ok){(function part(){var end=Math.min(f.length,i+STEP);
      for(;i<end;i+=N){var n=Math.min(N,f.length-i),s=new Int16Array(n);for(var j=0;j<n;j++){var v=f[i+j];v=v<-1?-1:v>1?1:v;s[j]=v<0?v*32768:v*32767}var d=enc.encodeBuffer(s);if(d.length)out.push(new Uint8Array(d))}
      prog&&prog(i/f.length);if(i<f.length)setTimeout(part,0);else{var e=enc.flush();if(e.length)out.push(new Uint8Array(e));ok(new Blob(out,{type:'audio/mpeg'}))}})()})})}

/* ---------- Settings → Listen ---------- */
(ST.settingsExtra=ST.settingsExtra||[]).push(function(){var L=perm('listen'),B=perm('listenBank'),A=perm('listenAuto');if(!L&&!B)return null;
  var rows=[];
  if(L)rows.push(['l','Lessons','a Listen button on the explanation slides']);
  if(B)rows.push(['b','Question bank','the questions in the bank, sets, mistakes and review']);
  if(A)rows.push(['a','Hands-free','reads the whole lesson, slide after slide (the screen must stay on)']);
  rows.push(['p','Stop after each paragraph','for explaining in class: it reads one paragraph and waits; Resume (or K) reads the next']);
  rows.push(['w','Follow each word','highlights the word being spoken (where the browser allows)']);
  rows.push(['t','Read tables','reads tables row by row']);
  rows.push(['e','Read the explanation after an answer','never in an exam set']);
  var w=document.createElement('div');
  w.innerHTML='<h3 class="sett-h">Listen</h3><p class="note">Reads the slides aloud with this device\'s own voice. Each part has its own switch.</p>'+
    rows.map(function(r){return '<p class="note tts-rl"><b>'+r[1]+'</b> — '+r[2]+'</p><div class="apx-r"><span class="seg sm" role="group" aria-label="'+r[1]+'"><button type="button" data-o="'+r[0]+'" data-v="1">On</button><button type="button" data-o="'+r[0]+'" data-v="0">Off</button></span></div>'}).join('')+
    '<p class="note tts-rl"><b>Pause between sentences</b> — a short silence after each sentence, to take it in (or translate it in your head) before the next</p><div class="apx-r"><span class="seg sm" role="group" aria-label="Pause between sentences">'+
      GAPS.map(function(x){return '<button type="button" data-gap="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</span></div>'+
    '<p class="note tts-rl"><b>Voice</b> — ★ is the most natural voice found on this device</p><div class="apx-r tts-vr"><select class="tts-v" aria-label="Voice"></select><button type="button" class="btn sm tts-test">Test</button></div>'+
    '<details class="tts-guide"><summary>Make the voice sound more natural</summary>'+
    '<p class="note">The voice comes from this device, so it can be improved on the device itself:</p>'+
    '<p class="note"><b>Android</b> (Samsung and others)</p><ol class="note">'+
     '<li>Open <b>Settings</b> and search for <b>Text-to-speech</b> (Arabic menus: تحويل النص إلى كلام). On Samsung: General management → Text-to-speech.</li>'+
     '<li>Set <b>Preferred engine</b> to <b>Speech Services by Google</b>.</li>'+
     '<li>Tap the gear ⚙ next to it → <b>Install voice data</b> → <b>English (United States)</b>.</li>'+
     '<li>Play the voices (Voice I, Voice II…) and download the one that sounds most natural.</li>'+
     '<li>Come back here, pick it under <b>Voice</b> and press <b>Test</b>.</li></ol>'+
    '<p class="note"><b>iPhone / iPad</b>: Settings → Accessibility → Spoken Content → Voices → English → download an <b>Enhanced</b> or <b>Premium</b> voice (for example Ava or Zoe), then open the platform again.</p>'+
    '<p class="note"><b>Computer</b>: open the platform in <b>Microsoft Edge</b> and pick a voice with <b>Natural</b> in its name.</p></details>';
  function paintS(){w.querySelectorAll('[data-o]').forEach(function(b){var on=(b.dataset.v==='1')===opt(b.dataset.o);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
    w.querySelectorAll('[data-gap]').forEach(function(b){var on=b.dataset.gap===gapKey();b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')})}
  w.querySelectorAll('[data-gap]').forEach(function(b){b.onclick=function(){put(K.g,b.dataset.gap);paintS()}});
  w.querySelectorAll('[data-o]').forEach(function(b){b.onclick=function(){var was=opt(b.dataset.o);put(K[b.dataset.o],b.dataset.v);paintS();
    if(!was&&b.dataset.v==='1'&&(b.dataset.o==='l'||b.dataset.o==='b')){var g=w.querySelector('.tts-guide');g.open=true;try{g.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}}   // turning it on opens the voice guide
    if(cur&&cur.bar&&(b.dataset.o==='l'||b.dataset.o==='b')){if(!onHere()){stop();cur.bar.hidden=true}else cur.bar.hidden=false}}});
  var vs=w.querySelector('.tts-v');fillVoices(vs);vs.onchange=function(){var x=voices[+vs.value];if(x)put(K.v,x.name);if(run&&run.state==='play')go(run)};
  w.querySelector('.tts-test').onclick=function(){stop();var v=pick(),one=function(t){var u=new SpeechSynthesisUtterance(t);if(v){u.voice=v;u.lang=v.lang}u.rate=rate();return u};   // two sentences, with the chosen pause between them
    var a=one('This is how the lessons will sound.'),b=one('Revenue minus the cost of goods sold gives the gross profit.');a.onend=function(){setTimeout(function(){SS.speak(b)},gapMs())};SS.speak(a)};
  paintS();return w});

ST.tts={blocks:function(){return cur?slideBlocks(cur):[]},speakable:speakable,pieces:pieces,toMp3:toMp3,rec:function(){return REC}};   // for checks
})();
