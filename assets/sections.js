/* START TIME — CMA Part 1: all six sections in one site.
   ?s=B opens Section B; a link to a topic (#/t/b1-…) opens that topic's section; otherwise the last section opened.
   Each section is its own deck: its own progress record on the sheet, its own readiness, LOS map and handouts.
   A section with no topic files yet shows as "coming soon". Loaded after config.js and los.js, before core.js. */
(function(){
var ST=window.ST=window.ST||{};
ST.ENC={"p1a":"41d06ff7d2","p1b":"ecb1bc491c","p1c":"0b1e8e8807","p1d":"2bd4ee19cb","p1e":"6966659098","p1f":"aed2315ec7"};
ST.SECTIONS=[
 {k:'A',deck:'p1a',section:'Section A',title:'External Financial Reporting Decisions',weight:15,
  blurb:'Every LOS in Section A, explained in order: a short story about a company that fits each idea, pictures that move when movement helps, and exam-style practice.',
  groups:[['A.1','Financial statements'],['A.2','Recognition, measurement, and valuation']],
  files:['a1-primer.js?v=5','a1-users.js?v=15','a1-comp.js?v=13','a1-limits.js?v=10','a1-effects.js?v=8','a1-links.js?v=9','a1-prep.js?v=7','a1-consolidation.js?v=14','a1-ir.js?v=14',
   'a2-receivables.js?v=9','a2-inventory.js?v=12','a2-investments.js?v=11','a2-ppe.js?v=9','a2-liabilities.js?v=12','a2-taxes.js?v=10','a2-leases.js?v=9',
   'a2-equity.js?v=11','a2-revenue.js?v=16','a2-income.js?v=13','a2-gaap-ifrs.js?v=13']},
 {k:'B',deck:'p1b',section:'Section B',title:'Planning, Budgeting, and Forecasting',weight:20,
  blurb:'From strategy to the master budget: every LOS in Section B, with forecasts and budgets you build and change yourself.',
  groups:[['B.1','Strategic planning'],['B.2','Budgeting concepts'],['B.3','Forecasting techniques'],['B.4','Budget methodologies'],['B.5','Annual profit plan and supporting schedules'],['B.6','Top-level planning and analysis']],
  files:['b1-plan.js?v=15','b1-env.js?v=15','b1-gen.js?v=15','b2-role.js?v=15','b2-proc.js?v=12','b2-std.js?v=11','b3-regr.js?v=11','b3-learn.js?v=11','b3-ev.js?v=11','b4-master.js?v=12','b4-abz.js?v=11','b4-flex.js?v=13','b5-sales.js?v=11','b5-mat.js?v=12','b5-oh.js?v=12','b5-cm.js?v=12','b5-cash.js?v=11','b6-pf.js?v=12','b6-fin.js?v=12']},
 {k:'C',deck:'p1c',section:'Section C',title:'Performance Management',weight:20,
  blurb:'How a company measures what happened against the plan: variances, responsibility centers and performance measures.',
  groups:[['C.1','Cost and variance measures'],['C.2','Responsibility centers and reporting segments'],['C.3','Performance measures']],
  files:['c1-master.js?v=5','c1-flex.js?v=4','c1-std.js?v=2','c1-oh.js?v=3','c1-mix.js?v=3','c1-act.js?v=2','c2-resp.js?v=3','c2-seg.js?v=2','c2-tp.js?v=3','c2-mnc.js?v=2','c3-goals.js?v=2','c3-prof.js?v=2','c3-roi.js?v=2','c3-comp.js?v=2','c3-bsc.js?v=2']},
 {k:'D',deck:'p1d',section:'Section D',title:'Cost Management',weight:15,
  blurb:'What a product really costs: costing systems, overhead, the supply chain and process improvement.',
  groups:[['D.1','Measurement concepts'],['D.2','Costing systems'],['D.3','Overhead costs'],['D.4','Supply chain management'],['D.5','Business process improvement']],
  files:['d1-behav.js?v=9','d1-meas.js?v=7','d1-varabs.js?v=9','d1-joint.js?v=7','d2-job.js?v=3','d2-abc.js?v=3','d2-life.js?v=3','d3-oh.js?v=3','d3-rates.js?v=1','d3-under.js?v=1','d3-svc.js?v=1','d4-lean.js?v=2','d4-sys.js?v=2','d4-out.js?v=1','d4-cap.js?v=2','d5-value.js?v=1','d5-bpr.js?v=1','d5-quality.js?v=1']},
 {k:'E',deck:'p1e',section:'Section E',title:'Internal Controls',weight:15,
  blurb:'Governance, risk and the controls that protect a company\'s assets, records and systems.',
  groups:[['E.1','Governance, risk, and compliance'],['E.2','System controls and security measures']],
  files:['e1-gov.js?v=2','e1-coso.js?v=4','e1-risk.js?v=4','e1-sod.js?v=3','e1-law.js?v=3','e1-audit.js?v=3','e2-gen.js?v=4','e2-app.js?v=4','e2-net.js?v=4','e2-bcp.js?v=5']},
 {k:'F',deck:'p1f',section:'Section F',title:'Technology and Analytics',weight:15,
  blurb:'Information systems, data governance, finance transformation and data analytics.',
  groups:[['F.1','Information systems'],['F.2','Data governance'],['F.3','Technology-enabled finance transformation'],['F.4','Data analytics']],
  files:['f1-ais.js?v=3','f1-db.js?v=2','f2-data.js?v=2','f3-sdlc.js?v=2','f3-tech.js?v=3','f4-bi.js?v=2','f4-mine.js?v=1','f4-regr.js?v=1','f4-tools.js?v=1','f4-viz.js?v=1']}
];
var has=function(k){return ST.SECTIONS.filter(function(s){return s.k===k&&s.files.length})[0]};
var saved=null;try{saved=localStorage.getItem('st-sec')}catch(e){}
var q=(location.search.match(/[?&]s=([a-f])(?![\w])/i)||[])[1],hm=(location.hash.match(/^#\/(?:t|print)\/([a-f])\d/i)||[])[1];
var S=has(String(hm||q||saved||'A').toUpperCase())||ST.SECTIONS[0];
try{localStorage.setItem('st-sec',S.k)}catch(e){}
ST.SEC=S;
var C=ST.CONFIG=ST.CONFIG||{};
C.deck=S.deck;C.section=S.section;C.sectionKey=(C.partKey||'P1')+'-'+S.k;C.sectionTitle=S.title;C.weight=S.weight;
ST.LOS=((ST.LOSALL||{})[S.k]||[]).map(function(r){return {c:r[0],g:r[1],sub:r[2],d:r[3]}});
ST.sectionOpen=function(k){return !!has(k)};
/* the published site carries no topic files: the build (tools/build-site.mjs) encrypts each section's topics into content/<deck>.enc
   and sets ST.ENC = {deck: version}. The key of each section comes with sign-in (the sheet sends it only to an active code), so the
   lessons and the question bank open only for a signed-in code. In the source, ST.ENC is unset and the topic files load as plain scripts. */
ST.loadTopics=function(){if(ST.ENC)return;S.files.forEach(function(f){document.write('<script src="topics/'+f+'"><\/script>')})};
ST.boot=function(go){var E=ST.ENC,dk=S.deck,s=ST.session&&ST.session();
  if(!E||!E[dk]||!s||!s.code){go();return}                          // the source, a section with no lessons yet, or not signed in: the start screen
  if(s.enrolled===false){go();                                       // signed in to the platform, not registered for this course: no keys asked for, the dashboard still opens
    var nr=document.createElement('div');nr.className='fb content-err';nr.setAttribute('role','status');
    nr.innerHTML='<b>Your code is not registered for '+(C.program||'CMA')+' yet.</b> Its lessons open here once START TIME adds you to the course.';
    var ap=document.getElementById('app');if(ap&&ap.parentNode)ap.parentNode.insertBefore(nr,ap);return}
  function b64(t){var r=atob(t),u=new Uint8Array(r.length);for(var i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u}
  function open(k){return fetch('content/'+dk+'.enc?v='+E[dk]).then(function(r){if(!r.ok)throw new Error('content '+r.status);return r.arrayBuffer()})
    .then(function(buf){var b=new Uint8Array(buf);return crypto.subtle.importKey('raw',b64(k),'AES-GCM',false,['decrypt'])
      .then(function(ck){return crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(0,12)},ck,b.slice(12))})})
    .then(unpack).then(function(js){(0,eval)(js)})}
  function unpack(pt){if(window.DecompressionStream)return new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return new Promise(function(ok,no){if(window.pako)return ok();var sc=document.createElement('script');sc.src='assets/vendor/pako_inflate.min.js';sc.onload=ok;sc.onerror=no;document.head.appendChild(sc)})
      .then(function(){return pako.ungzip(new Uint8Array(pt),{to:'string'})})}
  var key=s.keys&&s.keys[dk];
  (key?Promise.resolve(key):(ST.refreshKeys?ST.refreshKeys():Promise.reject(new Error('no key'))).then(function(ks){return ks&&ks[dk]}))
    .then(function(k){if(!k)throw new Error('no key');return open(k).catch(function(e){        // a stale key (the keys were changed): ask once for the new one
      if(!ST.refreshKeys)throw e;return ST.refreshKeys().then(function(ks){if(!ks||!ks[dk]||ks[dk]===k)throw e;return open(ks[dk])})})})
    .then(function(){go()},function(e){console.error('START TIME content:',e);ST.contentError=true;go();
      var n=document.createElement('div');n.className='fb bad content-err';n.setAttribute('role','alert');
      n.innerHTML='<b>The lessons could not be opened.</b> Check the internet connection and open the platform again.';
      var app=document.getElementById('app');if(app&&app.parentNode)app.parentNode.insertBefore(n,app)})};
ST.goSection=function(k){if(k===S.k){location.hash='#/';return}location.href=location.pathname+'?s='+k+'#/'};
var sm=document.querySelector('.brand-t small');if(sm)sm.textContent='ASHRAF FATHY · '+(C.part||'Part 1')+' · '+S.section;
})();
