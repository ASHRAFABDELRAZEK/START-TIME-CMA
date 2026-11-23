/* START TIME — focus tools: a Pomodoro timer, calm background noise, and a daily goal with a streak.
   Everything is the student's choice: nothing starts on its own, and each part turns on and off by itself.
   Saved on this device only (not part of the progress record). */
(function(){
'use strict';
var ST=window.ST;if(!ST||!ST.h)return;
var $=ST.h.$,$$=ST.h.$$,el=ST.h.el,esc=ST.h.esc;
var K='st-focus',S={};
try{S=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch(e){S={}}
function save(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
var LENS=[25,45,50],BRKS=[5,10],LONG=15,GOALS=[1,2,3,4,6,8];
if(LENS.indexOf(S.len)<0)S.len=25;if(BRKS.indexOf(S.brk)<0)S.brk=5;if(GOALS.indexOf(S.goal)<0)S.goal=2;
if(typeof S.vol!=='number')S.vol=0.35;if(S.chime==null)S.chime=true;S.days=S.days||{};
var PH={f:'Focus',b:'Break',l:'Long break'};

/* ---------- dates and the daily log: days[yyyy-mm-dd] = [focus sessions, focus minutes] ---------- */
function dkey(d){d=d||new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function day(k){return S.days[k]||[0,0]}
function credit(min,full){var k=dkey(),d=day(k);if(full)d[0]++;d[1]+=Math.max(0,Math.round(min));S.days[k]=d;
  var ks=Object.keys(S.days).sort();while(ks.length>70)delete S.days[ks.shift()]}
function streak(){var n=0,d=new Date();if(day(dkey(d))[0]<S.goal)d.setDate(d.getDate()-1);   // today still counts until it ends
  while(day(dkey(d))[0]>=S.goal){n++;d.setDate(d.getDate()-1)}return n}
function answeredToday(){var q=(ST.progress&&ST.progress.get().q)||{},t0=new Date();t0.setHours(0,0,0,0);var n=0;
  Object.keys(q).forEach(function(k){if(q[k]&&q[k][1]>=t0.getTime())n++});return n}

/* ---------- timer: S.ph = f / b / l, S.end = when the running phase ends, S.left = seconds left while paused ---------- */
function phLen(p){return (p==='f'?S.len:p==='l'?LONG:S.brk)*60}
function left(){if(!S.ph)return phLen('f');return S.run?Math.max(0,Math.round((S.end-Date.now())/1000)):(S.left!=null?S.left:phLen(S.ph))}
function start(){unlock();if(!S.ph)S.ph='f';var l=left();S.end=Date.now()+l*1000;S.run=true;delete S.left;if(S.ph==='f'&&!S.t0)S.t0=Date.now();save();tick()}
function pause(){if(!S.run)return;S.left=left();S.run=false;save();paint()}
function reset(){if(S.ph==='f'&&S.run!=null)credit((phLen('f')-left())/60,false);S.ph='';S.run=false;delete S.left;delete S.end;S.n=0;delete S.t0;save();paint()}
function next(done){var was=S.ph;
  if(was==='f'){credit((phLen('f')-(done?0:left()))/60,!!done);S.n=(S.n||0)+(done?1:0);S.ph=done&&S.n%4===0?'l':'b'}else S.ph='f';
  delete S.left;delete S.t0;
  if(S.ph==='f'){S.run=false}else{S.run=true;S.end=Date.now()+phLen(S.ph)*1000}   // a break starts by itself; the next focus waits for Start
  save();
  if(done){chime(was==='f');buzz();toast(was==='f'?(S.ph==='l'?'Focus done — take a '+LONG+'-minute break. You earned it.':'Focus done — '+S.brk+'-minute break. Stand up and rest your eyes.'):'Break over — press Start when you are ready to focus.')}
  paint()}
var TK=null;
function tick(){clearInterval(TK);TK=setInterval(function(){if(!S.run){clearInterval(TK);TK=null;paint();return}if(left()<=0)next(true);else paint()},1000);paint()}
function mmss(s){return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}

/* ---------- sound: generated here (no files), loops without a seam ---------- */
var AC=null,BUF={},src=null,gain=null;
function ctx(){if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{AC=new C()}catch(e){return null}}if(AC.state==='suspended')AC.resume();return AC}
function unlock(){if(S.chime||S.snd)ctx()}   // browsers allow sound only after a tap: the Start tap opens the audio for the chime later
function buffer(kind){if(BUF[kind])return BUF[kind];var c=ctx(),sr=c.sampleRate,N=Math.floor(sr*8),F=Math.floor(sr*0.6),b=c.createBuffer(2,N,sr);
  for(var ch=0;ch<2;ch++){var raw=new Float32Array(N+F),b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,last=0,i,w;
    for(i=0;i<N+F;i++){w=Math.random()*2-1;
      if(kind==='white')raw[i]=w*0.25;
      else if(kind==='pink'){b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.969*b2+w*0.153852;b3=0.8665*b3+w*0.3104856;b4=0.55*b4+w*0.5329522;b5=-0.7616*b5-w*0.016898;
        raw[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.06;b6=w*0.115926}
      else{last=(last+0.02*w)/1.02;raw[i]=last*2.6}}
    var d=b.getChannelData(ch);
    for(i=0;i<N;i++)d[i]=i<F?raw[i]*Math.sqrt(i/F)+raw[N+i]*Math.sqrt(1-i/F):raw[i]}   // the end fades into the start: no click when it loops
  return BUF[kind]=b}
function vol(){return S.vol*S.vol*0.9}
function play(kind){var c=ctx();if(!c)return false;stopSnd(true);
  gain=c.createGain();gain.gain.setValueAtTime(0,c.currentTime);gain.gain.linearRampToValueAtTime(vol(),c.currentTime+1.5);gain.connect(c.destination);
  src=c.createBufferSource();src.buffer=buffer(kind);src.loop=true;src.connect(gain);src.start();S.snd=kind;save();return true}
function stopSnd(keep){if(src&&AC){var s0=src,g0=gain;try{g0.gain.cancelScheduledValues(AC.currentTime);g0.gain.setValueAtTime(g0.gain.value,AC.currentTime);g0.gain.linearRampToValueAtTime(0,AC.currentTime+0.4);s0.stop(AC.currentTime+0.45)}catch(e){}}
  src=null;gain=null;if(!keep){S.snd='';save()}}
function chime(big){if(!S.chime)return;var c=ctx();if(!c||c.state!=='running')return;var t=c.currentTime;
  (big?[523.25,659.25,783.99]:[659.25,523.25]).forEach(function(f,i){var o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(0,t+i*0.28);g.gain.linearRampToValueAtTime(0.22,t+i*0.28+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+i*0.28+1.6);
    o.connect(g);g.connect(c.destination);o.start(t+i*0.28);o.stop(t+i*0.28+1.7)})}
function buzz(){try{if(navigator.vibrate)navigator.vibrate([180,90,180])}catch(e){}}
var SND=[['','Off',''],['brown','Brown','deep, like distant rain'],['pink','Pink','soft, like steady rain'],['white','White','bright, like a fan']];

/* ---------- the header shows a small clock only while the timer or a sound is on (the tools themselves live in Settings) ---------- */
var IC='<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5M19 6l1.5-1.5"/></svg>';
var btn=el('button','ib fc-b',IC);btn.type='button';btn.id='nFocus';btn.title='Focus: Pomodoro timer, calm sounds, daily goal';btn.setAttribute('aria-label','Focus tools');
var th=$('#nTheme');if(th&&th.parentNode)th.parentNode.insertBefore(btn,th);
btn.onclick=panel;btn.hidden=true;
function paint(){var on=!!S.ph,l=left();btn.hidden=!on&&!src;
  btn.classList.toggle('on',on);btn.classList.toggle('brk',S.ph==='b'||S.ph==='l');btn.classList.toggle('snd',!!src);
  btn.innerHTML=on?'<span class="fc-bt">'+mmss(l)+'</span>'+(S.run?'':'<span class="fc-bp">paused</span>'):IC+(src?'<i class="fc-dot"></i>':'');
  btn.title=on?PH[S.ph]+' · '+mmss(l)+' left'+(S.run?'':' (paused)'):'Focus: Pomodoro timer, calm sounds, daily goal';
  var p=document.getElementById('fcP');if(p&&p.isConnected)fill(p)}
var tt=null;
function toast(msg){var t=document.getElementById('fcToast');if(!t){t=el('button','fc-toast');t.id='fcToast';t.type='button';document.body.appendChild(t);t.onclick=function(){t.hidden=true;panel()}}
  t.textContent=msg;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},12000)}

/* ---------- the panel ---------- */
function seg(id,list,cur,fmt){return '<span class="seg sm" id="'+id+'" role="group">'+list.map(function(v){return '<button type="button" data-v="'+v+'" class="'+(v===cur?'on':'')+'" aria-pressed="'+(v===cur)+'">'+fmt(v)+'</button>'}).join('')+'</span>'}
function panel(){var box=el('div','fc');box.id='fcP';fill(box);ST.modal('Focus',box)}
function fill(box){var l=left(),ph=S.ph||'',td=day(dkey()),sk=streak(),run=!!S.run;
  var tot=phLen(ph||'f'),pct=Math.round((1-l/tot)*100);
  var wk=[],mx=1;for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var v=day(dkey(d));wk.push([d,v]);mx=Math.max(mx,v[1])}
  box.innerHTML=
   '<section class="fc-s"><h3>Pomodoro timer</h3>'+
    '<div class="fc-t '+(ph==='b'||ph==='l'?'brk':'')+'"><div class="fc-ph">'+(ph?PH[ph]+(run?'':' · paused'):'Ready to focus')+'</div><div class="fc-big" aria-live="off">'+mmss(l)+'</div>'+
    '<div class="fc-bar"><i style="width:'+(ph?pct:0)+'%"></i></div></div>'+
    '<div class="row fc-ctl">'+(run?'<button class="btn" data-a="pause">Pause</button>':'<button class="btn pri" data-a="start">'+(ph&&S.left!=null?'Resume':ph==='b'||ph==='l'?'Start break':'Start focus')+'</button>')+
     (ph?'<button class="btn ghost" data-a="skip">'+(ph==='f'?'End focus early':'Skip break')+'</button><button class="btn ghost" data-a="reset">Stop</button>':'')+'</div>'+
    (ph==='b'||ph==='l'?'<div class="fb ok fc-tip">Rest well: look at something far away for 20 seconds, stand up and stretch, drink water. Keep the phone away — the break is for your eyes and mind.</div>':'')+
    '<div class="fc-set"><label>Focus '+seg('fcLen',LENS,S.len,function(v){return v+' min'})+'</label><label>Break '+seg('fcBrk',BRKS,S.brk,function(v){return v+' min'})+'</label></div>'+
    '<p class="note">After every 4 focus sessions the break is '+LONG+' minutes. The time keeps going on other pages and in full screen, and pauses only when you press Pause.</p>'+
    '<label class="ck"><input type="checkbox" id="fcCh"'+(S.chime?' checked':'')+'><span>Soft chime when a session ends</span></label></section>'+
   '<section class="fc-s"><h3>Background sound</h3>'+
    '<span class="seg sm fc-snd" id="fcSnd" role="group">'+SND.map(function(x){var on=(src?S.snd:'')===x[0];return '<button type="button" data-v="'+x[0]+'" class="'+(on?'on':'')+'" aria-pressed="'+on+'">'+x[1]+'</button>'}).join('')+'</span>'+
    '<div class="fc-sh">'+SND.slice(1).map(function(x){return '<span><b>'+x[1]+'</b> — '+x[2]+'</span>'}).join('')+'</div>'+
    '<label class="fc-vol">Volume <input type="range" id="fcVol" min="0" max="100" value="'+Math.round(S.vol*100)+'" aria-label="Volume"></label>'+
    '<p class="note">Keep it low: it should cover the noise around you, not take your attention. Music with words makes reading harder — leave it for the breaks.</p></section>'+
   '<section class="fc-s"><h3>Today</h3>'+
    '<div class="fc-today"><div><b>'+td[0]+' / '+S.goal+'</b><span>focus sessions</span></div><div><b>'+td[1]+'</b><span>minutes focused</span></div><div><b>'+answeredToday()+'</b><span>practice answered</span></div><div><b>'+sk+'</b><span>day'+(sk===1?'':'s')+' in a row at the goal</span></div></div>'+
    '<div class="fc-goal"><label>Daily goal '+seg('fcGoal',GOALS,S.goal,function(v){return v})+'</label><span class="note">focus sessions a day</span></div>'+
    '<div class="fc-wk" role="img" aria-label="Minutes focused in the last 7 days">'+wk.map(function(x){return '<div><i style="height:'+Math.round(x[1][1]/mx*100)+'%" class="'+(x[1][0]>=S.goal?'met':'')+'"></i><small>'+'SMTWTFS'.charAt(x[0].getDay())+'</small><em>'+(x[1][1]||'')+'</em></div>'}).join('')+'</div>'+
    '<p class="note">Saved on this device only.</p></section>';
  $$('[data-a]',box).forEach(function(b){b.onclick=function(){var a=b.dataset.a;if(a==='start')start();else if(a==='pause')pause();else if(a==='skip')next(false);else reset()}});
  $$('#fcLen button',box).forEach(function(b){b.onclick=function(){S.len=+b.dataset.v;if(S.ph==='f'&&!S.run&&S.left!=null)S.left=Math.min(S.left,S.len*60);if(S.ph==='f'&&S.run)S.end=Math.min(S.end,Date.now()+S.len*60000);save();paint()}});
  $$('#fcBrk button',box).forEach(function(b){b.onclick=function(){S.brk=+b.dataset.v;save();paint()}});
  $$('#fcGoal button',box).forEach(function(b){b.onclick=function(){S.goal=+b.dataset.v;save();paint()}});
  $$('#fcSnd button',box).forEach(function(b){b.onclick=function(){var v=b.dataset.v;if(v){if(!play(v))b.textContent='not supported'}else stopSnd();paint()}});
  var vr=$('#fcVol',box);vr.oninput=function(){S.vol=vr.value/100;if(gain&&AC){gain.gain.cancelScheduledValues(AC.currentTime);gain.gain.setValueAtTime(vol(),AC.currentTime)}};vr.onchange=save;
  $('#fcCh',box).onchange=function(e){S.chime=e.target.checked;save();if(S.chime){ctx();chime(false)}}}

/* a timer that was running keeps its time after a reload; the sound waits for a tap (browsers do not allow it to start alone) */
if(S.ph&&S.run&&(Date.now()-S.end)>3600e3){S.ph='';S.run=false;delete S.end;delete S.t0;S.n=0;save()}   // left running and forgotten for over an hour: start fresh, nothing credited
if(S.ph&&S.run){if(left()<=0){while(S.run&&left()<=0){var over=-left();next(true);if(S.run)S.end-=over*1000}}tick()}else paint();
ST.focus={panel:panel};
})();
