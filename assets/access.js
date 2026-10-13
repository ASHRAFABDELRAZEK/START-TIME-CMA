/* START TIME — start screen (access code) and the staff bar (owner / teacher / assistant). */
(function(){
'use strict';
var ST=window.ST,CFG=ST.CONFIG||{},el=ST.h.el,$=ST.h.$,esc=ST.h.esc;

/* ---------- start screen ---------- */
ST.showGate=function(){
  var app=$('#app'),nav=$('.top-act');if(nav)$$hide(nav);
  var msg='';try{msg=sessionStorage.getItem('st-gate-msg')||'';sessionStorage.removeItem('st-gate-msg')}catch(e){}
  app.innerHTML='';
  var card=el('section','gate');
  card.innerHTML='<div class="gate-logo">ST</div><div class="kick">START TIME — ASHRAF FATHY</div><h1>CMA study platform</h1>'+
    '<p class="g-now"><span class="chip g">Now open</span> '+((ST.SECTIONS||[]).filter(function(s){return ST.sectionOpen&&ST.sectionOpen(s.k)}).map(function(s){return 'Part 1 · '+esc(s.section)+' — '+esc(s.title)}).join('<br>')||'Part 1 · Section A — External Financial Reporting Decisions')+'</p>'+
    '<p>Enter the access code you received from <b>START TIME — ASHRAF FATHY</b>.</p>'+
    '<form id="gForm" autocomplete="off"><label for="gCode">Access code</label><div class="g-in"><input class="inp mask" id="gCode" type="password" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="30" placeholder="e.g. KX48213907" aria-describedby="gMsg"><span class="g-dots" id="gDots" aria-hidden="true"></span><button type="button" class="g-eye" id="gEye" aria-pressed="false" aria-label="Show the code">Show</button></div>'+
    '<button class="btn pri" id="gGo" type="submit">Open the deck</button></form><div id="gMsg" role="alert">'+(msg?'<div class="fb bad">'+esc(msg)+'</div>':'')+'</div>'+
    '<p class="note">Your code works on a set number of devices. Your progress is saved under your code, so it follows you to each of them.</p>'+
    '<button class="btn ghost sm g-inst" id="gInst" type="button" hidden>Install the app on this device</button>';
  app.appendChild(card);if(ST.paintInstall)ST.paintInstall();
  var inp=$('#gCode'),go=$('#gGo'),out=$('#gMsg'),eye=$('#gEye');
  /* the code never shows on screen while typing (safe on a live stream or a shared screen): the real field is a password
     field (no keyboard suggestions) drawn in transparent ink, and our own dots stand in for it — even the phone's
     "show the last letter" flash stays invisible. Show reveals it on purpose. */
  var dots=$('#gDots');function paintDots(){dots.textContent=inp.classList.contains('mask')?new Array(inp.value.length+1).join('•'):''}
  inp.addEventListener('input',paintDots);
  eye.onclick=function(){var on=inp.classList.toggle('mask');inp.type=on?'password':'text';eye.textContent=on?'Show':'Hide';eye.setAttribute('aria-pressed',on?'false':'true');eye.setAttribute('aria-label',on?'Show the code':'Hide the code');paintDots();inp.focus()};
  setTimeout(function(){inp.focus()},50);
  $('#gForm').onsubmit=function(e){
    e.preventDefault();var code=inp.value.toUpperCase().replace(/[\s-]+/g,'');if(!code){out.innerHTML='<div class="fb bad">Enter your code.</div>';return}
    if(!/^[A-Z0-9]{6,24}$/.test(code)){out.innerHTML='<div class="fb bad">Codes have 2 letters and 8 digits, e.g. KX48213907. Check the code and try again.</div>';return}
    go.disabled=true;go.textContent='Checking…';out.innerHTML='';
    ST.accessLogin(code).then(function(){location.reload()}).catch(function(err){go.disabled=false;go.textContent='Open the deck';out.innerHTML='<div class="fb bad">'+esc((err&&err.message)||'No connection — check the internet and try again.')+'</div>'});
  };
};
function $$hide(n){n.style.visibility='hidden'}

/* ---------- the student's details: filled in or confirmed once, changed later from My account ----------
   need = fields still empty, or ['confirm'] when the details on file must be confirmed now. opts.edit = opened by the student himself. */
var CC=[['+966','Saudi Arabia'],['+20','Egypt'],['+971','United Arab Emirates'],['+965','Kuwait'],['+974','Qatar'],['+973','Bahrain'],['+968','Oman'],
  ['+962','Jordan'],['+961','Lebanon'],['+964','Iraq'],['+963','Syria'],['+970','Palestine'],['+967','Yemen'],['+249','Sudan'],['+218','Libya'],
  ['+216','Tunisia'],['+213','Algeria'],['+212','Morocco'],['other','Other — type + and the code']];
var LOCAL={'+966':/^5\d{8}$/,'+20':/^1\d{9}$/};                       // the usual mobile shapes; other countries: 6–12 digits
function splitMobile(m){m=String(m||'').replace(/[\s().-]/g,'').replace(/^00/,'+');
  if(m.charAt(0)==='+'){var hit=CC.filter(function(c){return c[0]!=='other'&&m.indexOf(c[0])===0}).sort(function(x,y){return y[0].length-x[0].length})[0];
    return hit?{cc:hit[0],n:m.slice(hit[0].length)}:{cc:'other',n:m}}
  if(/^05\d{8}$/.test(m))return {cc:'+966',n:m.slice(1)};
  if(/^01\d{9}$/.test(m))return {cc:'+20',n:m.slice(1)};
  return {cc:'',n:m}}
ST.needProfile=function(){var s=ST.session();return !!(s&&s.code&&s.role==='student'&&s.need&&s.need.length)};
ST.showProfile=function(opts){
  opts=opts||{};var edit=!!opts.edit,app=$('#app'),nav=$('.top-act'),s=ST.session()||{},need=s.need||[],empty=need.filter(function(k){return k!=='confirm'});
  if(!edit&&nav)$$hide(nav);
  if(edit){ST.closeModal&&ST.closeModal()}
  app.innerHTML='';
  var mob=splitMobile(s.mobile),title=edit?'My details':empty.length?'Complete your details':'Confirm your details';
  var card=el('section','gate pf');
  card.innerHTML='<div class="gate-logo">ST</div><div class="kick">'+(edit?'My account':'One step before you continue')+'</div><h1>'+title+'</h1>'+
    '<p>Your name, mobile and email go to your instructor\'s records, appear on the pages you print, and are how we reach you. '+(edit?'':'Check each one and correct anything that is wrong. ')+'You can change them later from <b>My account</b>.</p>'+
    '<form id="pfForm" autocomplete="on" novalidate>'+
      '<label for="pf_name">Full name</label><input class="inp pf-inp" id="pf_name" name="name" type="text" autocomplete="name" maxlength="80" value="'+esc(s.name||'')+'" placeholder="First and last name">'+
      '<label for="pf_mobile">Mobile</label><div class="pf-mob"><select class="sel-in" id="pf_cc" aria-label="Country code"><option value="">Country code</option>'+
        CC.map(function(c){return '<option value="'+c[0]+'"'+(c[0]===mob.cc?' selected':'')+'>'+(c[0]==='other'?esc(c[1]):esc(c[1])+' ('+c[0]+')')+'</option>'}).join('')+'</select>'+
        '<input class="inp pf-inp" id="pf_mobile" name="mobile" type="tel" autocomplete="tel-national" inputmode="tel" maxlength="20" value="'+esc(mob.n)+'" placeholder="5x xxx xxxx"></div>'+
      '<label for="pf_email">Email</label><input class="inp pf-inp" id="pf_email" name="email" type="email" autocomplete="email" maxlength="80" value="'+esc(s.email||'')+'" placeholder="name@example.com">'+
      '<label class="ck pf-ok"><input type="checkbox" id="pfOk"><span>I confirm these details are correct.</span></label>'+
      '<button class="btn pri" id="pfGo" type="submit">'+(edit?'Save':'Save and continue')+'</button>'+(edit?' <a class="btn ghost" href="#/">Cancel</a>':'')+'</form><div id="pfMsg" role="alert"></div>'+
    (edit?'':'<p class="note">Not you? <button class="btn sm ghost" id="pfOut" type="button">Sign out</button></p>');
  app.appendChild(card);
  var out=$('#pfMsg'),go=$('#pfGo'),cc=$('#pf_cc'),mi=$('#pf_mobile');
  var first=empty.length?$('#pf_'+empty[0]):$('#pf_name');if(first)setTimeout(function(){first.focus()},50);
  function hint(){mi.placeholder=cc.value==='+966'?'5x xxx xxxx':cc.value==='+20'?'1x xxxx xxxx':cc.value==='other'?'+ country code and number':'number'}
  cc.onchange=hint;hint();
  var bad=function(m,f){out.innerHTML='<div class="fb bad">'+esc(m)+'</div>';if(f)f.focus()};
  if($('#pfOut'))$('#pfOut').onclick=function(){ST.setSession(null);location.reload()};
  $('#pfForm').onsubmit=function(e){e.preventDefault();var d={},f=$('#pf_name');
    d.name=f.value.trim().replace(/\s+/g,' ');
    if(d.name.length<5||d.name.split(' ').length<2||/[\d@#$%^&*_=+<>{}\[\]|\\\/~`!?;:"]/.test(d.name))return bad('Write your full name: first and last name, letters only.',f);
    var raw=mi.value.trim().replace(/[\s().-]/g,'');
    if(!cc.value)return bad('Choose the country code of your mobile.',cc);
    if(cc.value==='other'){raw=raw.replace(/^00/,'+');if(!/^\+\d{8,15}$/.test(raw))return bad('Write the full number starting with + and the country code.',mi);d.mobile=raw}
    else{var nn=raw.replace(/^\+?/,'').replace(new RegExp('^'+cc.value.slice(1)),'').replace(/^0+/,'');
      if(!(LOCAL[cc.value]||/^\d{6,12}$/).test(nn))return bad(cc.value==='+966'?'A Saudi mobile has 9 digits after +966 and starts with 5, e.g. 5x xxx xxxx.':cc.value==='+20'?'An Egyptian mobile has 10 digits after +20 and starts with 1, e.g. 10 xxxx xxxx.':'Write the mobile number without the country code.',mi);
      d.mobile=cc.value+nn}
    f=$('#pf_email');d.email=f.value.trim().toLowerCase();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(d.email))return bad('Write a valid email address.',f);
    if(!$('#pfOk').checked)return bad('Tick the box to confirm your details.',$('#pfOk'));
    go.disabled=true;go.textContent='Saving…';out.innerHTML='';
    ST.saveProfile(d).then(function(){if(edit){location.hash='#/';if(ST.toast)ST.toast('Your details are saved.')}else location.reload()})
      .catch(function(err){go.disabled=false;go.textContent=edit?'Save':'Save and continue';bad((err&&err.message)||'No connection — check the internet and try again.')});
  };
};
/* reminder on the home page while the student still has days left to confirm his details */
ST.detailsBanner=function(app){
  var s=ST.session();if(!s||s.role!=='student'||!s.confirmBy||ST.needProfile())return;
  var p=s.confirmBy.split('/'),due=new Date(+p[2],+p[1]-1,+p[0]),left=Math.max(0,Math.ceil((due-new Date())/864e5));
  var b=el('div','dt-ban','<div><b>Please check your name, mobile and email.</b> <span>'+(left>0?left+' day'+(left===1?'':'s')+' left — ':'')+'by '+esc(s.confirmBy)+'. After that the platform asks for them before anything else.</span></div><a class="btn sm pri" href="#/details">Check my details</a>');
  app.appendChild(b)};

/* ---------- trainer bar ---------- */
ST.roleInit=function(){
  if(ST.role!=='trainer')return;
  var s=ST.session()||{},bar=el('div','tbar');
  var stu=s.view==='student',label=String(ST.staffRole||'staff').toUpperCase(),panel=ST.staffTabs&&ST.staffTabs().length;
  bar.innerHTML='<span class="chip t" title="'+esc(s.name||'')+'">'+label+'</span>'+
    (ST.canStaff('studentView')||stu?'<div class="tb-grp"><span class="note">View</span><div class="seg tb-seg" id="tbView"><button data-v="trainer"'+(stu?'':' class="on"')+'>Trainer</button><button data-v="student"'+(stu?' class="on"':'')+'>Student</button></div></div>':'')+
    (stu?'<div class="tb-grp"><span class="note">As group</span><select class="sel-in sm" id="tbGrp" aria-label="See the deck as this group sees it"><option value="">'+(s.preview?esc(s.preview.group):'Every topic open')+'</option></select></div>':'')+
    (!ST.can('answers')?'':'<div class="tb-grp"><span class="note">Answers</span><div class="seg tb-seg" id="tbAns"><button data-a="0"'+(s.answers?'':' class="on"')+'>Hidden</button><button data-a="1"'+(s.answers?' class="on"':'')+'>Shown</button></div></div>')+
    (panel?'<a class="btn sm" href="#/staff">Staff panel</a>':'')+
    '<button class="btn sm ghost" id="tbOut">Sign out</button>';
  var top=$('#top');top.parentNode.insertBefore(bar,top.nextSibling);
  ST.h.$$('#tbView button',bar).forEach(function(b){b.onclick=function(){var o=ST.session();o.view=b.dataset.v;if(o.view!=='student')delete o.preview;ST.setSession(o);location.reload()}});
  var gs=$('#tbGrp',bar);
  if(gs&&ST.adminCall){                                                  // Student view as one group: the locks that group sees, from the sheet
    ST.adminCall('preview',{}).then(function(r){if(!r||!r.ok){gs.title=(r&&r.error)||'';return}
      gs.innerHTML='<option value="">Every topic open</option>'+(r.groups||[]).map(function(g){return '<option'+(s.preview&&s.preview.group===g?' selected':'')+'>'+esc(g)+'</option>'}).join('')}).catch(function(){});
    gs.onchange=function(){var o=ST.session(),g=gs.value;if(!g){delete o.preview;ST.setSession(o);location.reload();return}
      gs.disabled=true;ST.adminCall('preview',{group:g}).then(function(r){if(!r||!r.ok){gs.disabled=false;gs.title=(r&&r.error)||'';return}
        o.preview={group:r.group,access:r.access||{}};ST.setSession(o);location.reload()}).catch(function(){gs.disabled=false})}}
  ST.h.$$('#tbAns button',bar).forEach(function(b){b.onclick=function(){var o=ST.session();o.answers=b.dataset.a==='1';ST.setSession(o);location.reload()}});
  $('#tbOut',bar).onclick=function(){ST.setSession(null);location.reload()};
};
})();
