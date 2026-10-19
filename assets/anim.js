/* START TIME — animation player.
   A short scene that builds itself step by step inside a slide: a caption fades in, then things move
   (a number flies from one statement to another, a truck delivers goods, an arrow draws itself).

   In a topic file:   body:`<p>…</p>${ST.anim(SPEC)}`
   SPEC = {id:'unique-id', scene:LAYOUT or function(L){return LAYOUT}, steps:[{cap:'…', do:[ACTION…]}, …]}
     LAYOUT = {w:680, h:420, els:[ELEMENT…]}   — the function form gets L = {narrow:true|false, w}
                                                  so one scene can lay itself out for phones and desktops
     steps[0] is the opening picture (its actions run at once); each later step is one press of Next.
   ELEMENT kinds: card, je, box, pill, bubble, icon, text, arrow, line, boundary, ground, sun, palm
   ACTION:  ['show',id] ['hide',id] ['move',id,x,y] ['fly',from,to,label,tone] ['set','card.row',value,tone]
            ['text','id.part',value] ['hl','card.row',tone] ['unhl','card.row'] ['draw',id] ['pulse',id]
            ['wait',ms] ['par',[ACTION…]]  (refs: 'id' or 'id.part'; fly/points also take [x,y])
   Tones (colour = meaning, the same on every slide): asset liab eq inc exp cash key neu
   The HTML written into the slide already shows the finished picture (print, PDF, no script);
   the player resets it and plays it: on its own the first time a learner meets it, after that on request.
   Motion off (Settings or the device) → no movement, the steps still go one by one. */
(function(){
var ST=window.ST=window.ST||{};
var REG={},SEEN='st-anm-seen',SPDK='st-anm-spd',NAR=560,uid=0;
/* speed levels 1 (slowest) … 10 (fastest), 5 = normal (owner 20 Oct 02:34); the number is how long each move takes compared with normal.
   The old three (Slow 1.5, Normal 1, Fast 0.7, saved under st-anm-spd) become 3, 5 and 7. */
var LVK='st-anm-lv',LV=[0,2.5,2,1.6,1.25,1,.85,.7,.6,.5,.4];
function lvGet(){var v=+store(LVK);if(v>=1&&v<=10)return Math.round(v);var o=+store(SPDK);return o>=1.4?3:o&&o<=.8?7:5}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function motionOK(){try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches&&store('st-motion')!=='on')return false}catch(e){}
  if(ST.fun&&ST.fun.motion)return ST.fun.motion();return !document.documentElement.classList.contains('nomotion')}
function seen(id,set){var a=[];try{a=JSON.parse(store(SEEN)||'[]')}catch(e){}if(set){if(a.indexOf(id)<0){a.push(id);store(SEEN,JSON.stringify(a.slice(-400)))}return true}return a.indexOf(id)>=0}
var TONES={asset:1,liab:1,eq:1,inc:1,exp:1,cash:1,key:1,neu:1};
function tn(t){return 'tn-'+(TONES[t]?t:'neu')}
function tw(s,px){return Math.round(String(s).length*(px||16)*0.55)}
/* keep a label inside its shape: a size down first, then squeeze */
function fit(t,avail,px){if(!String(t==null?'':t).length)return '';var w=String(t).length*(px||16)*0.6;if(w<=avail)return '';if(String(t).length*14*0.6<=avail)return ' style="font-size:14px"';return ' style="font-size:14px" textLength="'+Math.round(avail)+'" lengthAdjust="spacingAndGlyphs"'}

/* ---------- the cast: simple shapes drawn around (0,0), about 64 units tall ---------- */
var CAST={
 building:function(o){return '<rect x="-46" y="-40" width="92" height="70" rx="5" class="an-f"/><rect x="-34" y="-28" width="18" height="15" rx="2" class="an-w"/><rect x="-9" y="-28" width="18" height="15" rx="2" class="an-w"/><rect x="16" y="-28" width="18" height="15" rx="2" class="an-w"/><rect x="-9" y="6" width="18" height="24" rx="2" class="an-w"/>'},
 bank:function(){return '<path d="M-48 -18 L0 -44 L48 -18 Z" class="an-f"/><rect x="-44" y="-18" width="88" height="8" class="an-f"/>'+[-34,-14,6,26].map(function(x){return '<rect x="'+x+'" y="-8" width="8" height="30" class="an-w"/>'}).join('')+'<rect x="-48" y="22" width="96" height="8" rx="2" class="an-f"/>'},
 factory:function(){return '<path d="M-48 30 V-6 L-28 -20 V-6 L-8 -20 V-6 L12 -20 V-6 L32 -20 V30 Z" class="an-f"/><rect x="34" y="-40" width="12" height="70" class="an-f"/><rect x="-38" y="6" width="14" height="12" rx="2" class="an-w"/><rect x="-14" y="6" width="14" height="12" rx="2" class="an-w"/><rect x="10" y="6" width="14" height="12" rx="2" class="an-w"/>'},
 store:function(){return '<rect x="-44" y="-22" width="88" height="52" rx="4" class="an-f"/><path d="M-48 -22 L-40 -40 H40 L48 -22 Z" class="an-f"/><rect x="-30" y="-10" width="26" height="22" rx="2" class="an-w"/><rect x="8" y="-6" width="22" height="36" rx="2" class="an-w"/>'},
 warehouse:function(){return '<path d="M-50 30 V-14 L0 -40 L50 -14 V30 Z" class="an-f"/><rect x="-22" y="0" width="44" height="30" rx="2" class="an-w"/><path d="M-22 10 H22 M-22 20 H22" class="an-l"/>'},
 person:function(o){return '<circle cx="0" cy="-26" r="12" class="an-f"/><path d="M-20 30 V4 Q-20 -10 0 -10 Q20 -10 20 4 V30 Z" class="an-f"/>'+(o.hold?'<g transform="translate(26 4)">'+CAST[o.hold]({})+'</g>':'')},
 car:function(){return '<rect x="-30" y="0" width="60" height="20" rx="5" class="an-f"/><rect x="-18" y="-13" width="32" height="15" rx="4" class="an-f"/><circle cx="-16" cy="22" r="7" class="an-wh"/><circle cx="16" cy="22" r="7" class="an-wh"/>'},
 truck:function(){return '<rect x="-40" y="-14" width="56" height="34" rx="3" class="an-f"/><rect x="16" y="-2" width="26" height="22" rx="3" class="an-f"/><rect x="22" y="2" width="12" height="9" rx="2" class="an-w"/><circle cx="-24" cy="22" r="7" class="an-wh"/><circle cx="28" cy="22" r="7" class="an-wh"/>'},
 doc:function(){return '<path d="M-18 -26 H8 L18 -16 V26 H-18 Z" class="an-f"/><path d="M-10 -10 H10 M-10 0 H10 M-10 10 H4" class="an-l"/>'},
 coin:function(){return '<circle cx="0" cy="0" r="16" class="an-f"/><text x="0" y="1" text-anchor="middle" dominant-baseline="central" class="an-ic">$</text>'},
 cash:function(){return '<rect x="-26" y="-4" width="52" height="24" rx="3" class="an-f"/><rect x="-22" y="-12" width="52" height="24" rx="3" class="an-f"/><text x="4" y="0" text-anchor="middle" dominant-baseline="central" class="an-ic">$</text>'},
 safe:function(){return '<rect x="-26" y="-26" width="52" height="52" rx="5" class="an-f"/><circle cx="0" cy="0" r="11" class="an-w"/><path d="M0 -6 V0 H6" class="an-l"/>'},
 calendar:function(){return '<rect x="-24" y="-20" width="48" height="44" rx="5" class="an-f"/><rect x="-24" y="-20" width="48" height="12" rx="4" class="an-l2"/>'+[-12,0,12].map(function(x){return '<circle cx="'+x+'" cy="2" r="2.5" class="an-dot"/><circle cx="'+x+'" cy="13" r="2.5" class="an-dot"/>'}).join('')},
 clock:function(){return '<circle cx="0" cy="0" r="24" class="an-f"/><path d="M0 -14 V0 L10 6" class="an-l"/>'},
 scale:function(){return '<path d="M0 -26 V22 M-22 26 H22 M-32 -18 H32" class="an-l"/><path d="M-44 4 Q-32 16 -20 4 Z M20 4 Q32 16 44 4 Z" class="an-f"/><path d="M-32 -18 L-44 4 M-32 -18 L-20 4 M32 -18 L20 4 M32 -18 L44 4" class="an-l"/>'},
 magnifier:function(){return '<circle cx="-6" cy="-6" r="16" class="an-w an-ring"/><path d="M6 6 L22 22" class="an-l an-thick"/>'},
 shield:function(){return '<path d="M0 -28 L24 -18 V2 Q24 20 0 30 Q-24 20 -24 2 V-18 Z" class="an-f"/><path d="M-10 0 L-2 8 L12 -8" class="an-l an-thick"/>'},
 gauge:function(o){return '<path d="M-28 10 A28 28 0 0 1 28 10" class="an-l an-thick an-arc"/><path d="M0 10 L'+(o.v!=null?(Math.cos(Math.PI*(1-o.v))*22).toFixed(1)+' '+(10-Math.sin(Math.PI*(1-o.v))*22).toFixed(1):'14 -8')+'" class="an-l an-thick" data-r="needle"/><circle cx="0" cy="10" r="4" class="an-f"/>'},
 chart:function(){return '<rect x="-24" y="4" width="10" height="18" rx="2" class="an-f"/><rect x="-8" y="-8" width="10" height="30" rx="2" class="an-f"/><rect x="8" y="-20" width="10" height="42" rx="2" class="an-f"/><path d="M-28 22 H26" class="an-l"/>'},
 crate:function(){return '<rect x="-20" y="-18" width="40" height="36" rx="3" class="an-f"/><path d="M-20 -18 L20 18 M20 -18 L-20 18" class="an-l"/>'},
 tree:function(){return '<rect x="-4" y="0" width="8" height="30" class="an-trunk"/><circle cx="0" cy="-8" r="20" class="an-leaf"/>'},
 van:function(){return '<path d="M-42 -18 H12 Q18 -18 22 -12 L32 2 V20 H-42 Z" class="an-f"/><path d="M14 -13 Q17 -13 19 -10 L27 1 H14 Z" class="an-w"/><circle cx="19" cy="-5" r="3.6" class="an-dr"/><path d="M15 1 Q19 -2 23 1" class="an-l"/>'+
  '<g class="an-vdoc"><path d="M-34 -11 H-20 L-15 -6 V12 H-34 Z" class="an-w"/><path d="M-30 -3 H-19 M-30 2 H-19 M-30 7 H-23" class="an-l"/></g><circle cx="-26" cy="22" r="7" class="an-wh"/><circle cx="20" cy="22" r="7" class="an-wh"/>'}
};

/* ---------- line icons for badges: drawn in a 24-unit box around (0,0), navy strokes, one colour circle per kind of reader or item ---------- */
var ICO={
 bank:'<path d="M-11 -3 L0 -10 L11 -3 Z"/><path d="M-8 -1 V7 M-3 -1 V7 M3 -1 V7 M8 -1 V7 M-11 9.5 H11"/>',
 truck:'<path d="M-11 -6 H3 V6 H-11 Z"/><path d="M3 -2 H8 L11 2 V6 H3"/><circle cx="-6" cy="8" r="2.2"/><circle cx="7" cy="8" r="2.2"/>',
 investor:'<circle cx="-4" cy="-6" r="3.2"/><path d="M-10 9 V5 Q-10 0 -4 0 Q2 0 2 5 V9"/><path d="M6 9 V3 M9 9 V-1 M12 9 V-5"/>',
 people:'<circle cx="-5" cy="-5" r="3"/><circle cx="5" cy="-5" r="3"/><path d="M-11 8 V4 Q-11 0 -5 0 Q1 0 1 4 V8 M-1 8 V4 Q-1 0 5 0 Q11 0 11 4 V8"/>',
 cart:'<path d="M-11 -8 H-8 L-5 4 H8 L10 -4 H-7"/><circle cx="-4" cy="8" r="1.8"/><circle cx="7" cy="8" r="1.8"/>',
 shield:'<path d="M0 -10 L8 -7 V0 Q8 7 0 10 Q-8 7 -8 0 V-7 Z"/><path d="M-3.5 0 L-1 2.5 L4 -3"/>',
 analyst:'<circle cx="-2" cy="-2" r="7"/><path d="M3 3 L10 10"/><path d="M-5 1 V-1 M-2 1 V-4 M1 1 V-2"/>',
 brief:'<rect x="-10" y="-5" width="20" height="14" rx="2"/><path d="M-4 -5 V-8 H4 V-5 M-10 1 H10"/>',
 doc:'<path d="M-7 -10 H3 L8 -5 V10 H-7 Z"/><path d="M3 -10 V-5 H8 M-4 -1 H5 M-4 3 H5 M-4 7 H2"/>',
 camera:'<rect x="-10" y="-5" width="20" height="14" rx="2.5"/><circle cx="0" cy="2" r="4"/><path d="M-4 -5 L-2 -8 H2 L4 -5"/>',
 film:'<rect x="-10" y="-8" width="20" height="16" rx="2"/><path d="M-10 -4 H10 M-10 4 H10 M-6 -8 V-4 M-2 -8 V-4 M2 -8 V-4 M6 -8 V-4 M-6 4 V8 M-2 4 V8 M2 4 V8 M6 4 V8"/>',
 coins:'<ellipse cx="0" cy="-6" rx="8" ry="3"/><path d="M-8 -6 V6 Q-8 9 0 9 Q8 9 8 6 V-6 M-8 0 Q-8 3 0 3 Q8 3 8 0"/>',
 flow:'<path d="M-9 -3 H9 M5 -7 L9 -3 L5 1 M9 5 H-9 M-5 1 L-9 5 L-5 9"/>',
 trend:'<path d="M-10 9 H10 M-10 9 V-9"/><path d="M-7 4 L-2 -1 L2 2 L8 -6 M4 -6 H8 V-2"/>',
 scale:'<path d="M0 -9 V9 M-6 9 H6 M-10 -6 H10"/><path d="M-10 -6 L-13 2 H-7 Z M10 -6 L7 2 H13 Z"/>',
 pie:'<circle cx="0" cy="0" r="9"/><path d="M0 0 V-9 A9 9 0 0 1 7.8 4.5 Z" class="fl"/>',
 drop:'<path d="M0 -10 C4 -4 8 0 8 4 A8 8 0 0 1 -8 4 C-8 0 -4 -4 0 -10 Z"/><path d="M-4 4 A4 4 0 0 0 0 8"/>',
 stack:'<rect x="-9" y="-10" width="18" height="8" rx="1.5"/><rect x="-9" y="0" width="18" height="10" rx="1.5" class="fl"/>',
 lock:'<rect x="-8" y="-2" width="16" height="12" rx="2"/><path d="M-5 -2 V-5 A5 5 0 0 1 5 -5 V-2"/>',
 eye:'<path d="M-11 0 Q0 -9 11 0 Q0 9 -11 0 Z"/><circle cx="0" cy="0" r="3"/>',
 calendar:'<rect x="-10" y="-8" width="20" height="18" rx="2"/><path d="M-10 -3 H10 M-5 -11 V-6 M5 -11 V-6"/>',
 clock:'<circle cx="0" cy="0" r="10"/><path d="M0 -6 V0 L4 3"/>',
 factory:'<path d="M-11 9 V-2 L-5 -6 V-2 L1 -6 V-2 L7 -6 V9 Z"/><path d="M7 -6 V-10 H10 V9"/>',
 store:'<path d="M-10 -2 V9 H10 V-2 M-11 -2 L-9 -9 H9 L11 -2 Z"/><path d="M-3 9 V3 H3 V9"/>',
 palm:'<path d="M0 10 V-4"/><path d="M0 -4 C-4 -8 -9 -8 -11 -6 M0 -4 C4 -8 9 -8 11 -6 M0 -4 C-2 -9 -6 -11 -9 -10 M0 -4 C2 -9 6 -11 9 -10"/>',
 gym:'<path d="M-11 0 H11 M-8 -5 V5 M-5 -7 V7 M8 -5 V5 M5 -7 V7"/>',
 sun:'<circle r="4"/><path d="M0 -10 V-7 M0 7 V10 M-10 0 H-7 M7 0 H10 M-7 -7 L-5 -5 M5 5 L7 7 M-7 7 L-5 5 M5 -5 L7 -7"/>',
 bike:'<circle cx="-6" cy="4" r="5"/><circle cx="6" cy="4" r="5"/><path d="M-6 4 L-2 -5 H4 M0 -5 L6 4 M-2 -5 L1 4"/>',
 news:'<rect x="-10" y="-8" width="20" height="16" rx="2"/><path d="M-6 -4 H6 M-6 0 H6 M-6 4 H2"/>',
 gov:'<path d="M-11 -2 L0 -9 L11 -2"/><path d="M-9 -2 V8 M-4 -2 V8 M4 -2 V8 M9 -2 V8 M-11 10 H11"/>',
 q:'<circle r="10"/><path d="M-3 -3 A3 3 0 1 1 1 0 Q0 1 0 3"/><path d="M0 6.5 V6.6"/>',
 check:'<path d="M-7 0 L-2 5 L8 -6"/>',
 cross:'<path d="M-6 -6 L6 6 M6 -6 L-6 6"/>',
 bolt:'<path d="M2 -11 L-7 2 H0 L-2 11 L7 -2 H0 Z"/>',
 leaf:'<path d="M-9 9 C-9 -3 -2 -10 10 -10 C10 2 3 9 -9 9 Z"/><path d="M-9 9 L4 -4"/>',
 gear:'<circle r="3.5"/><path d="M0 -10 V-7 M0 7 V10 M-10 0 H-7 M7 0 H10 M-7 -7 L-5 -5 M5 5 L7 7 M-7 7 L-5 5 M5 -5 L7 -7"/><circle r="7"/>',
 bulb:'<path d="M-4 6 V3 C-8 0 -8 -9 0 -9 C8 -9 8 0 4 3 V6 Z"/><path d="M-3 9 H3"/>',
 link:'<rect x="-11" y="-4" width="12" height="8" rx="4"/><rect x="-1" y="-4" width="12" height="8" rx="4"/>',
 globe:'<circle r="10"/><path d="M-10 0 H10 M0 -10 C-5 -5 -5 5 0 10 M0 -10 C5 -5 5 5 0 10"/>',
 crate:'<rect x="-10" y="-8" width="20" height="16" rx="2"/><path d="M-10 -2 H10 M-3 -8 V-2 M3 -8 V-2"/>',
 building:'<rect x="-8" y="-10" width="16" height="20" rx="1.5"/><path d="M-4 -6 H-2 M2 -6 H4 M-4 -1 H-2 M2 -1 H4 M-2 10 V5 H2 V10"/>',
 tag:'<path d="M-10 -2 V-10 H-2 L10 2 L2 10 Z"/><circle cx="-6" cy="-6" r="1.5"/>',
 plus:'<path d="M0 -8 V8 M-8 0 H8"/>',
 minus:'<path d="M-8 0 H8"/>',
 equal:'<path d="M-8 -3 H8 M-8 3 H8"/>',
 up:'<path d="M0 9 V-8 M-6 -2 L0 -8 L6 -2"/>',
 down:'<path d="M0 -9 V8 M-6 2 L0 8 L6 2"/>',
 layers:'<path d="M0 -9 L10 -4 L0 1 L-10 -4 Z M-10 1 L0 6 L10 1 M-10 6 L0 11 L10 6"/>'
};
function wrap(t,n){t=String(t||'');if(!t)return [];var w=t.split(' '),out=[],cur='';w.forEach(function(x){if(cur&&(cur+' '+x).length>n){out.push(cur);cur=x}else cur=cur?cur+' '+x:x});if(cur)out.push(cur);return out}
function backOut(p){var c1=1.70158,c3=c1+1;return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2)}

/* ---------- elements → SVG ---------- */
function rowsOf(e){var y=e.title?58:24,out=[],step=e.rh||28;(e.rows||[]).forEach(function(r){if(r==='-'){out.push({rule:1,y:y-step/2+2});return}out.push({id:r[0],label:r[1],v:r[2]!=null?r[2]:'—',b:!!r[3],y:y});y+=step});return {rows:out,h:y-step/2+14}}
var KIND={
 card:function(e,P){var R=rowsOf(e),h=e.h||R.h,w=e.w;P[e.id]=[e.x+w/2,e.y+h/2];
  var s='<rect width="'+w+'" height="'+h+'" rx="10" class="an-card"/>'+(e.title?'<text x="16" y="30" class="an-h'+(e.sm?' an-sm':'')+'">'+esc(e.title)+'</text>':'');
  R.rows.forEach(function(r){if(r.rule){s+='<path d="M16 '+r.y+' H'+(w-16)+'" class="an-rule"/>';return}
    P[e.id+'.'+r.id]=[e.x+w-50,e.y+r.y];
    s+='<rect data-h="'+r.id+'" x="8" y="'+(r.y-14)+'" width="'+(w-16)+'" height="28" rx="6" class="an-hl" style="opacity:0"/>'+
       '<text x="16" y="'+r.y+'" dominant-baseline="central" class="'+(r.b?'an-h':'an-t')+(e.sm?' an-sm':'')+'" data-r="'+r.id+'-l">'+esc(r.label)+'</text>'+
       '<text x="'+(w-14)+'" y="'+r.y+'" text-anchor="end" dominant-baseline="central" class="an-num '+(r.b?'an-h':'an-t')+(e.sm?' an-sm':'')+'" data-r="'+r.id+'">'+esc(r.v)+'</text>'});
  return {s:s,w:w,h:h}},
 je:function(e,P){var w=e.w,lines=e.lines||[],h=e.h||(30+lines.length*24);P[e.id]=[e.x+w/2,e.y+h/2];
  var s='<rect width="'+w+'" height="'+h+'" rx="10" class="an-card"/>'+(e.title===false?'':'<text x="16" y="'+(h/2)+'" dominant-baseline="central" class="an-s">'+esc(e.title||'Journal entry')+'</text>')+'<g data-r="body">';
  lines.forEach(function(l,i){var y=24+i*24,ind=l[1]==='Cr'?(e.ind||24):0,ax=e.ax||(w-30);P[e.id+'.'+l[0]]=[e.x+ax-30,e.y+y];
    s+='<text x="'+((e.lx||130)+ind)+'" y="'+y+'" dominant-baseline="central" class="an-t" data-r="'+l[0]+'">'+esc(l[1]+'  '+l[2])+'</text><text x="'+ax+'" y="'+y+'" text-anchor="end" dominant-baseline="central" class="an-t an-num" data-r="'+l[0]+'-v">'+esc(l[3])+'</text>'});
  return {s:s+'</g>',w:w,h:h}},
 box:function(e,P){var w=e.w||Math.max(tw(e.text,16),tw(e.sub||'',13))+36,h=e.h||(e.sub?58:44);P[e.id]=[e.x+w/2,e.y+h/2];
  return {s:'<g class="'+tn(e.tone)+'"><rect width="'+w+'" height="'+h+'" rx="10" class="an-f"/><text x="'+(w/2)+'" y="'+(e.sub?h/2-10:h/2)+'" text-anchor="middle" dominant-baseline="central" class="an-h an-ink" data-r="t"'+fit(e.text,w-20)+'>'+esc(e.text)+'</text>'+(e.sub?'<text x="'+(w/2)+'" y="'+(h/2+12)+'" text-anchor="middle" dominant-baseline="central" class="an-s an-ink" data-r="s">'+esc(e.sub)+'</text>':'')+'</g>',w:w,h:h}},
 pill:function(e,P){var w=e.w||tw(e.text,15)+36,h=e.h||32;P[e.id]=[e.x+w/2,e.y+h/2];
  return {s:'<g class="'+tn(e.tone||'key')+'"><rect width="'+w+'" height="'+h+'" rx="'+(h/2)+'" class="an-f"/><text x="'+(w/2)+'" y="'+(h/2)+'" text-anchor="middle" dominant-baseline="central" class="an-h an-ink" data-r="t"'+fit(e.text,w-28)+'>'+esc(e.text)+'</text></g>',w:w,h:h}},
 bubble:function(e,P){var w=e.w||tw(e.text,14)+30,h=30,tx=e.tail!=null?e.tail:w/2;P[e.id]=[e.x+w/2,e.y+h/2];
  return {s:'<g class="'+tn(e.tone||'neu')+'"><path d="M10 0 H'+(w-10)+' Q'+w+' 0 '+w+' 10 V'+(h-10)+' Q'+w+' '+h+' '+(w-10)+' '+h+' H'+(tx+7)+' L'+tx+' '+(h+8)+' L'+(tx-7)+' '+h+' H10 Q0 '+h+' 0 '+(h-10)+' V10 Q0 0 10 0 Z" class="an-f"/><text x="'+(w/2)+'" y="'+(h/2)+'" text-anchor="middle" dominant-baseline="central" class="an-s an-ink" data-r="t">'+esc(e.text)+'</text></g>',w:w,h:h}},
 icon:function(e,P){var sc=e.s||1;P[e.id]=[e.x,e.y];if(e.label)P[e.id+'.label']=[e.x,e.y+40*sc+14];
  var d=(CAST[e.kind]||CAST.building)(e);
  var tag='';if(e.tag!=null){var tgw=Math.max(80,tw(e.tag,14)+26),ty=e.ty!=null?e.ty:-56*sc;tag='<g class="tn-key an-tag"><rect x="'+(-tgw/2)+'" y="'+(ty-13)+'" width="'+tgw+'" height="26" rx="13" class="an-f"/><text x="0" y="'+ty+'" text-anchor="middle" dominant-baseline="central" class="an-s an-ink" data-r="tag">'+esc(e.tag)+'</text></g>'}
  return {s:tag+'<g class="'+tn(e.tone)+' an-cast"><g transform="scale('+sc+')">'+d+'</g>'+(e.name?'<text x="0" y="'+(e.ny!=null?e.ny:14*sc)+'" text-anchor="middle" dominant-baseline="central" class="an-s an-ink an-name" data-r="name">'+esc(e.name)+'</text>':'')+'</g>'+
    (e.label?'<text x="0" y="'+(40*sc+14)+'" text-anchor="middle" dominant-baseline="central" class="an-s" data-r="label">'+esc(e.label)+'</text>':''),origin:1}},
 text:function(e,P){P[e.id]=[e.x,e.y];return {s:'<text x="0" y="0" text-anchor="'+(e.anchor||'start')+'" dominant-baseline="central" class="'+(e.cls||'an-t')+'" data-r="t">'+esc(e.text)+'</text>',origin:1}},
 arrow:function(e){return {s:'<path d="'+e.d+'" class="an-arr '+tn(e.tone)+(e.soft?' an-soft':'')+'"'+(e.draw?' pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"':'')+(e.head===false?'':' marker-end="url(#'+e._m+')"')+' data-r="p"/>',origin:1}},
 /* a round badge: colour = kind of item, navy line icon inside, bold label and a short line under it */
 badge:function(e,P){var r=e.r||26,sc=r/15,lp=e.lp||'b';P[e.id]=[e.x,e.y];
  var s='<g class="'+tn(e.tone)+' an-bdg"><circle r="'+r+'" class="an-bc"/>'+(e.inner?'<g class="an-li" transform="translate(0 '+(-r*.4).toFixed(1)+') scale('+(sc*.5).toFixed(2)+')">'+(ICO[e.icon]||ICO.doc)+'</g>'+e.inner.map(function(t,i){return '<text x="0" y="'+(r*(e.inner.length>1?.2:.3)+i*15).toFixed(1)+'" text-anchor="middle" dominant-baseline="central" class="an-in">'+esc(t)+'</text>'}).join(''):'<g class="an-li" transform="scale('+sc.toFixed(2)+')">'+(ICO[e.icon]||ICO.doc)+'</g>')+'</g>';
  var L=wrap(e.sub||'',e.wc||22),n=(e.label?1:0)+L.length,hh=(e.label?20:0)+L.length*17,x=0,y=0,an='middle';
  if(lp==='b')y=r+16;else if(lp==='t')y=-r-8-hh+10;else{x=lp==='r'?r+12:-r-12;an=lp==='r'?'start':'end';y=-hh/2+10}
  if(e.label){s+='<text x="'+x+'" y="'+y+'" text-anchor="'+an+'" dominant-baseline="central" class="an-h'+(e.sm?' an-sm':'')+'" data-r="label">'+esc(e.label)+'</text>';y+=19}
  L.forEach(function(l,i){s+='<text x="'+x+'" y="'+(y+i*17)+'" text-anchor="'+an+'" dominant-baseline="central" class="an-s" data-r="sub'+i+'">'+esc(l)+'</text>'});
  return {s:s,origin:1}},
 /* a time line with ticks and labels under them */
 axis:function(e){var s='<path d="M0 0 H'+e.w+'" class="an-axis" marker-end="url(#'+e._m+')"/>';
  (e.ticks||[]).forEach(function(t,i){s+='<g data-r="t'+i+'"><path d="M'+t[0]+' -7 V7" class="an-axis"/><text x="'+t[0]+'" y="24" text-anchor="middle" class="an-h an-sm">'+esc(t[1])+'</text>'+(t[2]?'<text x="'+t[0]+'" y="42" text-anchor="middle" class="an-s">'+esc(t[2])+'</text>':'')+'</g>'});
  return {s:s,origin:1}},
 /* a document thumbnail: coloured top edge, folded corner, title and a few grey lines */
 sheet:function(e,P){var w=e.w||120,h=e.h||84,k=14;P[e.id]=[e.x+w/2,e.y+h/2];
  var s='<g class="'+tn(e.tone)+'"><path d="M0 0 H'+(w-k)+' L'+w+' '+k+' V'+h+' H0 Z" class="an-sh"/><path d="M'+(w-k)+' 0 V'+k+' H'+w+'" class="an-sh2"/><rect x="0" y="0" width="'+(w-k)+'" height="5" class="an-shh"/>'+
   '<text x="'+(w/2)+'" y="'+(e.sub?24:28)+'" text-anchor="middle" dominant-baseline="central" class="an-h an-sm an-ink" data-r="t"'+fit(e.text,w-16,15)+'>'+esc(e.text)+'</text>'+(e.sub?'<text x="'+(w/2)+'" y="44" text-anchor="middle" dominant-baseline="central" class="an-s" data-r="s">'+esc(e.sub)+'</text>':'');
  for(var i=0;i<(e.lines==null?2:e.lines);i++)s+='<path d="M14 '+(h-22+i*9)+' H'+(w-(i%2?40:24))+'" class="an-shl"/>';
  return {s:s+'</g>',w:w,h:h}},
 /* a bar that can grow, with its value above and a label under the base line (x, y = left end of the base) */
 bar:function(e,P){var H=e.H||160,h=Math.max(0,Math.round(H*(e.v||0)/e.vmax));P[e.id]=[e.x+e.w/2,e.y-h-14];
  return {s:'<g class="'+tn(e.tone)+'"><rect x="0" y="'+(-h)+'" width="'+e.w+'" height="'+h+'" rx="4" class="an-f" data-r="r" data-hh="'+H+'" data-vmax="'+e.vmax+'"/><text x="'+(e.w/2)+'" y="'+(-h-14)+'" text-anchor="middle" dominant-baseline="central" class="an-h an-num an-ink" data-r="v">'+esc(e.vt!=null?e.vt:'')+'</text>'+
   (e.label?'<text x="'+(e.w/2)+'" y="18" text-anchor="middle" dominant-baseline="central" class="an-s" data-r="l">'+esc(e.label)+'</text>':'')+'</g>',origin:1}},
 /* a question inside the scene: the player waits for a tap, then shows the right answer and why */
 ask:function(e,P){var w=e.w||420,Q=wrap(e.q,Math.floor((w-32)/8.6)),W=wrap(e.why||'',Math.floor((w-32)/7.4)),no=e.o.length,ow=(w-32-(no-1)*10)/no,oy=20+Q.length*22,wy=oy+52,h=wy+W.length*18+8;P[e.id]=[e.x+w/2,e.y+h/2];
  var s='<g data-r="ask" data-a="'+e.a+'"><rect width="'+w+'" height="'+h+'" rx="12" class="an-ask"/><rect x="10" y="-9" width="94" height="18" class="an-qbg"/><text x="16" y="0" class="an-qt" dominant-baseline="central">YOUR TURN</text>';
  Q.forEach(function(l,i){s+='<text x="16" y="'+(26+i*22)+'" dominant-baseline="central" class="an-h">'+esc(l)+'</text>'});
  e.o.forEach(function(o,i){s+='<g class="an-opt" data-o="'+i+'" transform="translate('+(16+i*(ow+10)).toFixed(1)+' '+oy+')"><rect width="'+ow.toFixed(1)+'" height="36" rx="18" class="an-ob"/><text x="'+(ow/2).toFixed(1)+'" y="18" text-anchor="middle" dominant-baseline="central" class="an-h an-sm"'+fit(o,ow-22,15)+'>'+esc(o)+'</text></g>'});
  s+='<g data-r="why" style="opacity:0">';W.forEach(function(l,i){s+='<text x="16" y="'+(wy+i*18)+'" dominant-baseline="central" class="an-t an-sm">'+esc(l)+'</text>'});
  return {s:s+'</g></g>',w:w,h:h}},
 line:function(e){return {s:'<path d="'+e.d+'" class="an-line"'+(e.dash?' stroke-dasharray="'+e.dash+'"':'')+'/>',origin:1}},
 boundary:function(e,P){P[e.id]=[e.x+e.w/2,e.y+e.h/2];return {s:'<rect width="'+e.w+'" height="'+e.h+'" rx="16" class="an-bound"/>'+(e.label?'<text x="'+(e.w/2)+'" y="-10" text-anchor="middle" class="an-s">'+esc(e.label)+'</text>':''),w:e.w,h:e.h}},
 ground:function(e){return {s:'<rect x="0" y="0" width="'+e.w+'" height="'+(e.h||18)+'" class="an-ground"/>'+(e.road?'<path d="M0 '+((e.h||18)/2)+' H'+e.w+'" class="an-road"/>':''),origin:1}},
 sun:function(e){return {s:'<circle cx="0" cy="0" r="'+(e.r||20)+'" class="an-sun"/>',origin:1}},
 sky:function(e){var g=e._m+'-sky';return {s:'<defs><linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--soft-navy)"/><stop offset="1" style="stop-color:var(--soft-teal)"/></linearGradient></defs><rect width="'+e.w+'" height="'+e.h+'" rx="'+(e.rx||0)+'" fill="url(#'+g+')"/>',origin:1}},
 sign:function(e,P){var w=e.w||Math.max(120,tw(e.text,15)+34),h=26;P[e.id]=[e.x,e.y];
  return {s:'<path d="M'+(-w/2+22)+' 13 V'+(13+(e.post||8))+' M'+(w/2-22)+' 13 V'+(13+(e.post||8))+'" class="an-post"/><rect x="'+(-w/2)+'" y="-13" width="'+w+'" height="'+h+'" rx="6" class="an-sign"/><text x="0" y="1" text-anchor="middle" dominant-baseline="central" class="an-sgt"'+fit(String(e.text).toUpperCase(),w-16,15)+'>'+esc(String(e.text).toUpperCase())+'</text>',origin:1}},
 palm:function(e){var s=e.s||1;return {s:'<g transform="scale('+s+')" class="an-palm"><path d="M0 0 V-70"/><path d="M0 -70 c-22 -10 -40 -4 -48 6 M0 -70 c22 -10 40 -4 48 6 M0 -70 c-10 -18 -28 -22 -40 -18 M0 -70 c10 -18 28 -22 40 -18"/></g>',origin:1}}
};
function sceneOf(spec,narrow){var L={narrow:narrow,w:narrow?380:680};var sc=typeof spec.scene==='function'?spec.scene(L):spec.scene;return sc}
function svgOf(spec,narrow,fid){var sc=sceneOf(spec,narrow),P={},m='anm-a'+fid,parts=[];
  sc.els.forEach(function(e){e._m=m;if(e.x==null)e.x=0;if(e.y==null)e.y=0;var r=(KIND[e.k]||KIND.text)(e,P);
    parts.push('<g class="an-el" data-id="'+esc(e.id||'')+'" data-x="'+e.x+'" data-y="'+e.y+'" transform="translate('+e.x+' '+e.y+')"'+(e.hidden?' style="opacity:0"':'')+'>'+r.s+'</g>')});
  var svg='<svg viewBox="0 0 '+sc.w+' '+sc.h+'" class="anm-svg" role="img" aria-label="'+esc(spec.label||'Animated explanation')+'"><defs><marker id="'+m+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>'+
    parts.join('')+'<g class="an-tok" style="opacity:0"><rect x="-44" y="-15" width="88" height="30" rx="15" class="an-f"/><text x="0" y="0" text-anchor="middle" dominant-baseline="central" class="an-h an-ink">0</text></g></svg>';
  return {svg:svg,P:P}}

/* ---------- actions ---------- */
function find(root,ref){var p=String(ref).split('.'),g=root.querySelector('.an-el[data-id="'+p[0]+'"]');if(!g)return null;return {g:g,sub:p[1]||null,el:p[1]?g.querySelector('[data-r="'+p[1]+'"]'):g}}
function pt(st,ref){if(Array.isArray(ref))return ref;var p=st.P[ref];var f=find(st.root,String(ref).split('.')[0]);if(!p)return [0,0];
  if(f&&f.g){var dx=(+f.g.dataset.cx||+f.g.dataset.x)-(+f.g.dataset.x),dy=(+f.g.dataset.cy||+f.g.dataset.y)-(+f.g.dataset.y);return [p[0]+dx,p[1]+dy]}return p}
function setPos(g,x,y){g.dataset.cx=x;g.dataset.cy=y;g.setAttribute('transform','translate('+x+' '+y+')')}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function tween(st,ms,f){return new Promise(function(r){if(!st.anim){f(1);r();return}var d=ms*st.spd,t0=performance.now();
  (function k(n){if(st.stop){f(1);r();return}var p=Math.min(1,(n-t0)/d);f(ease(p));p<1?requestAnimationFrame(k):r()})(t0)})}
function setHl(f,tone,on){var h=f.g.querySelector('[data-h="'+f.sub+'"]');if(h){h.setAttribute('class','an-hl '+tn(tone));h.style.opacity=on?1:0}}
function lv(st,v){return v&&typeof v==='object'&&!Array.isArray(v)&&('w' in v||'n' in v)?(st.narrow?v.n:v.w):v}
function act(st,a){a=a.map(function(v,i){return i?lv(st,v):v});var k=a[0],f;switch(k){
 case 'par':return Promise.all(a[1].map(function(x){return act(st,x)}));
 case 'wait':return tween(st,a[1]||400,function(){});
 case 'show':case 'hide':f=find(st.root,a[1]);if(!f)return;var g=f.el,to=k==='show'?1:0,fr=+(g.style.opacity===''?1:g.style.opacity);
  return tween(st,450,function(p){g.style.opacity=fr+(to-fr)*p});
 case 'move':f=find(st.root,a[1]);if(!f)return;var g2=f.g,x0=+(g2.dataset.cx||g2.dataset.x),y0=+(g2.dataset.cy||g2.dataset.y);
  return tween(st,a[4]||1400,function(p){setPos(g2,x0+(a[2]-x0)*p,y0+(a[3]-y0)*p)});
 case 'fly':var A=pt(st,a[1]),B=pt(st,a[2]),tk=st.root.querySelector('.an-tok');tk.setAttribute('class','an-tok '+tn(a[4]||'key'));
  var tt=tk.querySelector('text');tt.textContent=a[3];var bw=Math.max(70,tw(a[3],17)+28);tk.querySelector('rect').setAttribute('width',bw);tk.querySelector('rect').setAttribute('x',-bw/2);
  if(!st.anim)return;tk.style.opacity=1;
  return tween(st,850,function(p){var x=A[0]+(B[0]-A[0])*p,y=A[1]+(B[1]-A[1])*p-Math.sin(p*Math.PI)*Math.min(70,20+Math.abs(B[0]-A[0])*.15);tk.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+')')}).then(function(){tk.style.opacity=0});
 case 'set':f=find(st.root,a[1]);if(!f||!f.el)return;f.el.textContent=a[2];if(a[3]!==null)setHl(f,a[3]||'key',a[3]!==false);
  if(st.anim){f.el.classList.remove('an-pop');void f.el.getBBox();f.el.classList.add('an-pop')}return;
 case 'text':f=find(st.root,a[1]);if(f&&f.el){f.el.textContent=a[2];var bx=f.g.querySelector('rect.an-f,rect.an-card');if(bx&&f.el.getAttribute('text-anchor')==='middle'){var av=+bx.getAttribute('width')-28,fs=fit(a[2],av);f.el.removeAttribute('style');f.el.removeAttribute('textLength');f.el.removeAttribute('lengthAdjust');
   if(fs){var m1=/textLength="(\d+)"/.exec(fs);f.el.style.fontSize='14px';if(m1){f.el.setAttribute('textLength',m1[1]);f.el.setAttribute('lengthAdjust','spacingAndGlyphs')}}}}return;
 case 'hl':f=find(st.root,a[1]);if(f)setHl(f,a[2]||'key',true);return;
 case 'unhl':f=find(st.root,a[1]);if(f)setHl(f,'neu',false);return;
 case 'draw':f=find(st.root,a[1]);if(!f)return;var pa=f.g.querySelector('[data-r="p"]');if(!pa)return;return tween(st,700,function(p){pa.setAttribute('stroke-dashoffset',(1-p).toFixed(3))});
 case 'pulse':f=find(st.root,a[1]);if(!f||!st.anim)return;f.g.classList.remove('an-pulse');void f.g.getBBox();f.g.classList.add('an-pulse');return tween(st,600,function(){});
 /* pop: appear with a small bounce (the opening scenes); calm scenes use show */
 case 'pop':f=find(st.root,a[1]);if(!f)return;var gp=f.g,px=+(gp.dataset.cx||gp.dataset.x),py=+(gp.dataset.cy||gp.dataset.y);
  if(!st.anim){gp.style.opacity=1;return}var bb=null;try{bb=gp.getBBox()}catch(x){}var ccx=bb?bb.x+bb.width/2:0,ccy=bb?bb.y+bb.height/2:0;
  return tween(st,560,function(q){var sc=.5+.5*backOut(q);gp.style.opacity=Math.min(1,q*1.8);gp.setAttribute('transform','translate('+px+' '+py+') translate('+ccx.toFixed(1)+' '+ccy.toFixed(1)+') scale('+sc.toFixed(3)+') translate('+(-ccx).toFixed(1)+' '+(-ccy).toFixed(1)+')')}).then(function(){setPos(gp,px,py)});
 /* focus: dim everything except the listed elements; unfocus: bring the rest back */
 case 'focus':var keep=a[1]||[],dl=[];Array.prototype.forEach.call(st.root.querySelectorAll('.an-el'),function(g){if(keep.indexOf(g.dataset.id)>=0)return;var o=g.dataset.op!=null?+g.dataset.op:+(g.style.opacity===''?1:g.style.opacity);if(o<.3)return;g.dataset.op=o;dl.push(g)});
  return tween(st,a[2]||450,function(q){dl.forEach(function(g){g.style.opacity=(+g.dataset.op*(1-.82*q)).toFixed(3)})});
 case 'unfocus':var ul=Array.prototype.slice.call(st.root.querySelectorAll('.an-el[data-op]'));
  var done=function(){ul.forEach(function(g){g.style.opacity=g.dataset.op;g.removeAttribute('data-op')})};if(!st.anim){done();return}
  return tween(st,400,function(q){ul.forEach(function(g){g.style.opacity=(+g.dataset.op*(.18+.82*q)).toFixed(3)})}).then(done);
 /* count a number from one value to another: ['count','id.part',from,to,{pre,suf,d,paren}] */
 case 'count':f=find(st.root,a[1]);if(!f||!f.el)return;var c0=+a[2],c1=+a[3],fm=a[4]||{},nf=function(v){var n=Math.abs(v),t=n.toFixed(fm.d||0).replace(/\B(?=(\d{3})+(?!\d))/g,',');return (v<0?(fm.paren?'(':'−'):'')+(fm.pre||'')+t+(fm.suf||'')+(v<0&&fm.paren?')':'')};
  return tween(st,a[5]||1100,function(q){f.el.textContent=nf(c0+(c1-c0)*q)});
 /* grow a bar to a new value: ['grow',id,value,label] */
 case 'grow':f=find(st.root,a[1]);if(!f)return;var rr=f.g.querySelector('[data-r="r"]'),vt=f.g.querySelector('[data-r="v"]'),HH=+rr.getAttribute('data-hh'),VM=+rr.getAttribute('data-vmax'),h0=+rr.getAttribute('height'),h1=Math.max(0,Math.round(HH*a[2]/VM));if(a[3]!=null)vt.textContent=a[3];
  return tween(st,a[4]||900,function(q){var hq=h0+(h1-h0)*q;rr.setAttribute('height',hq.toFixed(1));rr.setAttribute('y',(-hq).toFixed(1));vt.setAttribute('y',(-hq-14).toFixed(1))});
 /* a question in the scene: waits for the learner (Next or Play shows the answer) */
 case 'ask':f=find(st.root,a[1]);if(!f)return;var ag=f.g,box=ag.querySelector('[data-r="ask"]'),ans=+box.getAttribute('data-a'),ops=Array.prototype.slice.call(ag.querySelectorAll('.an-opt')),why=ag.querySelector('[data-r="why"]');
  var reveal=function(pk){ops.forEach(function(o,i){o.classList.toggle('an-ok',i===ans);o.classList.toggle('an-no',pk!=null&&i===pk&&i!==ans)});why.style.opacity=1};
  ag.style.opacity=1;if(!st.live){reveal(null);return}
  return new Promise(function(res){var fin=function(pk){if(!st.asking)return;st.asking=null;ag.classList.remove('an-wait');reveal(pk);setTimeout(res,pk==null?250:1500*st.spd)};
   st.asking={fin:fin};ag.classList.add('an-wait');ops.forEach(function(o,i){o.onclick=function(){fin(i)}})});
}}
function runSteps(st,upto){var p=Promise.resolve(),an=st.anim;st.anim=false;
  for(var i=0;i<=upto;i++)(st.spec.steps[i].do||[]).forEach(function(a){act(st,a)});st.anim=an}

/* ---------- static picture for the slide HTML (finished state) ---------- */
function staticHTML(spec){var id=++uid,o=svgOf(spec,false,id),d=document.createElement('div');d.innerHTML=o.svg;
  var st={root:d,P:o.P,spec:spec,anim:false,spd:1,narrow:false};try{runSteps(st,spec.steps.length-1)}catch(e){}
  var last=spec.steps[spec.steps.length-1];
  return '<figure class="anm" data-anm="'+esc(spec.id)+'"><figcaption class="anm-cap"><p class="anm-tx">'+esc(lv(st,last.cap||''))+'</p><div class="anm-pb"><i></i></div></figcaption><div class="anm-stage">'+d.innerHTML+'</div></figure>'}
var A=ST.anim=function(spec){REG[spec.id]=spec;return staticHTML(spec)};
A.reg=REG;A.cast=CAST;A.icons=ICO;
/* points on a circle, for hub-and-branch pictures: ring(n, cx, cy, radius, start angle in degrees) */
A.ring=function(n,cx,cy,R,start){var out=[],a0=(start==null?-90:start)*Math.PI/180;for(var i=0;i<n;i++){var t=a0+i*2*Math.PI/n;out.push([Math.round(cx+R*Math.cos(t)),Math.round(cy+R*Math.sin(t))])}return out};
/* the opening scene of a topic: a company with its name on the roof; its accountant loads the year-end report into a van and
   delivers it to each reader in turn. ST.anim(ST.anim.opening({id, name, sub:'a California date packer', readers:[[kind,label],…], caps:{…}}))
   reader kinds: bank, warehouse (supplier), investor, store (customer), people (staff), gov (regulator). Up to three readers. */
A.opening=function(o){var R=(o.readers||[['bank','Bank'],['warehouse','Supplier'],['investor','Investor']]).slice(0,3),C=o.caps||{},nm=o.name||'Company';
  var stm=o.statements||['Balance sheet','Income','Cash flows','Equity'];
  return {id:o.id,label:o.label||('The year-end report of '+nm+' goes out to its readers'),
   scene:function(L){var n=L.narrow,W=n?380:680,gy=n?206:232,H=n?318:312,els=[],bx=n?84:150,bs=n?.95:1.45,rx=n?[192,264,336]:[456,550,636],rs=n?.5:.72,vy=n?(gy+68):(gy+38);
    els.push({k:'sky',id:'sky',w:W,h:gy});els.push({k:'ground',id:'gr',x:0,y:gy,w:W,h:H-gy,road:0});
    els.push({k:'line',id:'road',d:'M0 '+(vy+24)+' H'+W,dash:'14 12'});
    els.push({k:'sun',id:'sun',x:n?336:612,y:n?36:44,r:n?16:22});
    (n?[[16,.6]]:[[24,1],[264,.75]]).forEach(function(p,i){els.push({k:'palm',id:'pm'+i,x:p[0],y:gy,s:p[1]})});
    els.push({k:'icon',id:'co',kind:'building',tone:'neu',x:bx,y:gy-30*bs,s:bs});
    els.push({k:'sign',id:'sg',x:bx,y:gy-70*bs-22,text:nm,w:n?156:180,post:8});
    var rk={bank:['bank','cash'],warehouse:['warehouse','liab'],investor:['person','eq'],store:['store','key'],people:['person','key'],gov:['bank','key']};
    R.forEach(function(r,i){var c=rk[r[0]]||rk.bank,x=rx[i],e={k:'icon',id:'r'+i,kind:c[0],hold:r[0]==='investor'?'chart':null,tone:c[1],x:x,y:gy-30*rs,s:rs};if(n)e.label=r[1];else e.tag=r[1];els.push(e);
      els.push({k:'icon',id:'d'+i,kind:'doc',tone:'key',x:x,y:n?gy-30*rs-44:138,s:n?.4:.5,hidden:1})});
    if(n)els.push({k:'sheet',id:'s0',x:150,y:30,w:132,h:56,text:'Year-end report',sub:stm.length+' statements + notes',tone:'key',lines:0,hidden:1});
    else stm.forEach(function(t,i){els.push({k:'sheet',id:'s'+i,x:236+(i%2)*100,y:44+Math.floor(i/2)*50,w:92,h:42,text:t,tone:'key',lines:0,hidden:1})});
    els.push({k:'icon',id:'van',kind:'van',tone:'asset',x:n?bx+64:bx+120,y:vy,s:n?.8:1});
    return {w:W,h:H,els:els}},
   steps:[
    {cap:C.open||(nm+(o.sub?', '+o.sub+',':'')+' closes its year on December 31.')},
    {cap:C.prep||'Its accountant prepares the financial statements.',do:[['par',[0,1,2,3].map(function(i){return ['pop','s'+i]})]]},
    {cap:C.load||'They go out together in one year-end report.',do:[['par',[0,1,2,3].map(function(i){return ['move','s'+i,{w:250,n:110},{w:228,n:250},900]})],['par',[0,1,2,3].map(function(i){return ['hide','s'+i]})],['pulse','van']]}]
   .concat(R.map(function(r,i){return {cap:(C['r'+i])||('Next stop: '+r[1].toLowerCase()+'.'),do:[['move','van',{w:[456,550,636][i]-62,n:[192,264,336][i]-30},{w:270,n:274},1300],['pop','d'+i]]}}))
   .concat([{cap:C.end||'Same report, different questions — that is what this topic is about.',do:[['par',R.map(function(r,i){return ['pulse','r'+i]})]]}])}};
/* a small static badge for slide HTML (no player): ST.anim.badge('bank','cash',40) */
A.badge=function(icon,tone,size){var z=size||40;return '<svg class="anm-svg an-ib" viewBox="-20 -20 40 40" width="'+z+'" height="'+z+'" aria-hidden="true"><g class="'+tn(tone)+' an-bdg"><circle r="18" class="an-bc"/><g class="an-li" transform="scale(1.1)">'+(ICO[icon]||ICO.doc)+'</g></g></svg>'};

/* ---------- the player ---------- */
var IC={prev:'<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',next:'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  play:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" class="fl"/></svg>',pause:'<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  again:'<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5"/></svg>',end:'<svg viewBox="0 0 24 24"><path d="M6 6l6 6-6 6M13 6l6 6-6 6"/></svg>'};
function mount(fig){if(fig.dataset.on)return;var spec=REG[fig.dataset.anm];if(!spec)return;fig.dataset.on='1';
  var N=spec.steps.length-1,stage=fig.querySelector('.anm-stage'),tx=fig.querySelector('.anm-tx'),bar=fig.querySelector('.anm-pb i');
  var st={spec:spec,spd:LV[lvGet()],anim:false,step:N,playing:false,run:0,busy:false,narrow:null,fid:++uid};
  var ctl=document.createElement('div');ctl.className='anm-ctl';
  ctl.innerHTML='<button type="button" class="anm-b" data-a="prev" aria-label="Previous step">'+IC.prev+'</button>'+
    '<button type="button" class="anm-b anm-pp" data-a="pp"><span class="anm-ppi">'+IC.play+'</span><span class="anm-ppt">Play</span></button>'+
    '<button type="button" class="anm-b" data-a="next" aria-label="Next step">'+IC.next+'</button>'+
    '<button type="button" class="anm-b" data-a="end" title="Show the result" aria-label="Show the result">'+IC.end+'</button>'+
    '<label class="anm-sp"><span>Speed</span><select class="anm-lv" aria-label="Speed: 1 is the slowest, 10 the fastest">'+
      [1,2,3,4,5,6,7,8,9,10].map(function(n){return '<option value="'+n+'">'+n+(n===1?' · slowest':n===5?' · normal':n===10?' · fastest':'')+'</option>'}).join('')+'</select></label>'+
    '<span class="anm-n"></span>';
  fig.appendChild(ctl);tx.setAttribute('aria-live','polite');
  function paintSp(){var se=ctl.querySelector('.anm-lv');if(se)se.value=String(lvGet())}
  ctl.querySelector('.anm-lv').onchange=function(){var n=+this.value;store(LVK,String(n));st.spd=LV[n];   // every drawing on the page takes the new speed
    Array.prototype.forEach.call(document.querySelectorAll('.anm-lv'),function(x){x.value=String(n)});document.dispatchEvent(new CustomEvent('anm-speed',{detail:n}))};
  document.addEventListener('anm-speed',function(e){st.spd=LV[e.detail]||1});
  function render(k){if(st.asking){var fa=st.asking;st.asking=null;}var nar=fig.clientWidth>0&&fig.clientWidth<NAR;st.narrow=nar;var o=svgOf(spec,nar,st.fid);stage.innerHTML=o.svg;st.root=stage;st.P=o.P;runSteps(st,k);st.step=k;cap(k,false)}
  function cap(k,fade){var t=spec.steps[k].cap||'';ctl.querySelector('.anm-n').textContent=(k)+' / '+N;
    t=lv(st,t);if(!fade||!st.anim){tx.textContent=t;tx.style.opacity=1;return}tx.style.opacity=0;setTimeout(function(){tx.textContent=t;tx.style.opacity=1},170)}
  function ppUI(){var b=ctl.querySelector('.anm-pp');b.querySelector('.anm-ppi').innerHTML=st.playing?IC.pause:(st.step>=N?IC.again:IC.play);
    b.querySelector('.anm-ppt').textContent=st.playing?'Pause':(st.step>=N?'Replay':'Play');fig.classList.toggle('anm-playing',st.playing)}
  function go(k){if(st.busy||k<0||k>N)return Promise.resolve();
    if(k===st.step+1){st.busy=true;st.anim=motionOK();st.live=true;st.stop=false;cap(k,true);var p=Promise.resolve();
      (spec.steps[k].do||[]).forEach(function(a){p=p.then(function(){return act(st,a)})});
      return p.then(function(){st.busy=false;st.live=false;st.step=k;if(k>=N)seen(spec.id,true);ppUI()})}
    render(k);ppUI();return Promise.resolve()}
  function readMs(k){var t=lv(st,spec.steps[k].cap||'');return (2000+t.length*55)*st.spd}
  function hold(ms,id){var e=0,last=performance.now();return new Promise(function(r){(function f(n){if(id!==st.run)return r(false);if(st.playing)e+=n-last;last=n;
    bar.style.width=Math.min(100,e/ms*100)+'%';if(e>=ms)return r(true);requestAnimationFrame(f)})(last)})}
  function auto(){var id=++st.run;st.playing=true;ppUI();
    (function loop(){if(id!==st.run)return;if(st.step>=N){st.playing=false;bar.style.width='0';ppUI();return}
      hold(readMs(st.step),id).then(function(ok){if(!ok||id!==st.run)return;bar.style.width='0';go(st.step+1).then(loop)})})()}
  function stopAuto(){st.run++;st.playing=false;bar.style.width='0';ppUI()}
  ctl.onclick=function(e){var b=e.target.closest('button');if(b&&st.asking&&/^(next|end|pp)$/.test(b.dataset.a||'')){st.asking.fin(null);return}
    if(!b||st.busy&&!b.dataset.s)return;
    var a=b.dataset.a;
    if(a==='pp'){if(st.playing){stopAuto();return}if(st.step>=N)render(0);inView(fig);auto();return}
    if(a==='next'){stopAuto();go(st.step+1);return}
    if(a==='prev'){stopAuto();render(Math.max(0,st.step-1));ppUI();return}
    if(a==='end'){stopAuto();render(N);seen(spec.id,true);ppUI();return}};
  paintSp();
  var first=!seen(spec.id)&&motionOK(),tries=0;
  /* the slide is built before it is put on the page: wait until the figure has a width, so phones get their own layout */
  (function begin(){if(!fig.clientWidth&&tries++<40){requestAnimationFrame(begin);return}
  if(first){render(0);ppUI();
    var startIt=function(){if(!fig.isConnected||st.started)return;st.started=true;auto()};
    /* it starts when the drawing is really in view: between the top bar and the Previous / Next bar, not under them (owner 20 Oct 02:33) */
    if('IntersectionObserver' in window){var ed=freeZone(),io=new IntersectionObserver(function(en){en.forEach(function(x){var e=freeZone(),want=Math.min(x.boundingClientRect.height,e.bot-e.top)*.85;
        if(x.isIntersecting&&x.intersectionRect.height>=want){io.disconnect();setTimeout(startIt,350)}})},
      {rootMargin:'-'+Math.round(ed.top)+'px 0px -'+Math.round(window.innerHeight-ed.bot)+'px 0px',threshold:[0,.25,.5,.75,.85,.95,1]});io.observe(stage)}else startIt()}
  else{render(N);ppUI()}})();
  var rt=null;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(!fig.isConnected||st.busy)return;var nar=fig.clientWidth<NAR;if(nar!==st.narrow){render(st.step)}},200)})}
/* the free part of the screen: under the top bar, above the Previous / Next bar of a slide */
function freeZone(){var t=document.querySelector('.top'),n=document.querySelector('.dk-nav'),top=0,bot=window.innerHeight;
  if(t){var a=t.getBoundingClientRect();if(a.bottom>0&&a.top<=1)top=a.bottom}
  if(n){var b=n.getBoundingClientRect();if(b.top<window.innerHeight&&b.bottom>=window.innerHeight-2)bot=b.top}
  return {top:top,bot:bot}}
/* Play pressed on a drawing that is partly under a bar: bring the whole figure into the free part first */
function inView(el){try{var q=el.getBoundingClientRect(),e=freeZone();if(q.top>=e.top+4&&q.bottom<=e.bot-4)return;
  var y=q.height<=e.bot-e.top-16?q.top-e.top-8-Math.max(0,(e.bot-e.top-q.height)/2-8):q.top-e.top-8;
  window.scrollBy({top:y,behavior:motionOK()?'smooth':'auto'})}catch(x){}}
A.mount=mount;
A.mountAll=function(root){Array.prototype.forEach.call((root||document).querySelectorAll('figure.anm:not([data-on])'),mount)};
/* in the deck: start the players of the slide just drawn */
var prevSlide=ST.deckSlide;
ST.deckSlide=function(sec){if(prevSlide)prevSlide.apply(this,arguments);A.mountAll(sec)};
})();
