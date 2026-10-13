/* START TIME — Linked Financial Statements Engine
   Every number is computed from one ledger: opening balances + journal entries.
   Debit = positive, Credit = negative. */
(function(){
'use strict';
var ST = window.ST = window.ST || {};

/* ---------- number formatting ---------- */
function fmt(n){
  if(n===null||n===undefined||isNaN(n))return '';
  var r=Math.round(n*100)/100;
  if(Math.abs(r)<0.005)return '–';
  var s=Math.abs(r).toLocaleString('en-US',{maximumFractionDigits:2});
  return r<0?'('+s+')':s;
}
function fmtS(n){ /* signed change */
  var r=Math.round(n*100)/100;
  if(Math.abs(r)<0.005)return '0';
  return (r>0?'+':'−')+Math.abs(r).toLocaleString('en-US',{maximumFractionDigits:2});
}
function money(n){var r=Math.round(n*100)/100;return Math.abs(r).toLocaleString('en-US',{maximumFractionDigits:2})}
ST.fmt=fmt;ST.fmtS=fmtS;ST.money=money;

/* ---------- chart of accounts used by the trace slides (any company: the slide's co sets the name shown) ---------- */
/* sec: ca current asset | nca non-current asset | cl current liability | ncl non-current liability | eq equity
        rev revenue | cogs cost of sales | opx operating expense | oth other income/expense | tax | divs dividends
   nc: non-cash item adjusted in the indirect method | wc: operating working-capital account */
var ACC = {
  cash:    {n:'Cash',sec:'ca'},
  ar:      {n:'Accounts receivable',sec:'ca',wc:1},
  inv:     {n:'Inventory',sec:'ca',wc:1},
  prepaid: {n:'Prepaid rent',sec:'ca',wc:1},
  ppe:     {n:'Equipment, at cost',sec:'nca'},
  accdep:  {n:'Accumulated depreciation',sec:'nca',contra:1},
  ap:      {n:'Accounts payable',sec:'cl',wc:1},
  accrued: {n:'Accrued expenses',sec:'cl',wc:1},
  unearned:{n:'Unearned revenue',sec:'cl',wc:1},
  divpay:  {n:'Dividends payable',sec:'cl'},
  loan:    {n:'Long-term loan',sec:'ncl'},
  paidin:  {n:'Paid-in capital',sec:'eq'},
  re:      {n:'Retained earnings',sec:'eq'},
  sales:   {n:'Revenue',sec:'rev'},
  cogs:    {n:'Cost of goods sold',sec:'cogs'},
  salaries:{n:'Salaries expense',sec:'opx'},
  rent:    {n:'Rent expense',sec:'opx'},
  depexp:  {n:'Depreciation expense',sec:'opx',nc:1},
  interest:{n:'Interest expense',sec:'oth'},
  gain:    {n:'Gain on sale of equipment',sec:'oth',nc:1},
  loss:    {n:'Loss on sale of equipment',sec:'oth',nc:1},
  div:     {n:'Dividends declared',sec:'divs'}
};
/* opening balances, start of the month (debit +, credit −) — balanced: 388,000 = 388,000 */
var OPEN = {cash:120000, ar:40000, inv:60000, prepaid:18000, ppe:200000, accdep:-50000,
            ap:-30000, accrued:0, unearned:-12000, divpay:0, loan:-100000, paidin:-150000, re:-96000};

function model(acc,open){return {acc:acc||ACC, open:open||OPEN}}

function balances(m,txs){
  var b={};Object.keys(m.acc).forEach(function(k){b[k]=m.open[k]||0});
  (txs||[]).forEach(function(t){t.je.forEach(function(l){b[l[0]]=(b[l[0]]||0)+l[1]})});
  return b;
}
function sumSec(m,b,sec,sign){var s=0;Object.keys(m.acc).forEach(function(k){if(m.acc[k].sec===sec)s+=sign*b[k]});return s}
function keysOf(m,sec){return Object.keys(m.acc).filter(function(k){return m.acc[k].sec===sec})}

/* ---------- build the four statements ---------- */
function build(m,txs){
  var A=m.acc,b=balances(m,txs),o=m.open,R={is:[],sce:[],bs:[],cf:[],val:{}};
  function row(st,k,n,v,cls){R[st].push({k:k,n:n,v:v,cls:cls||''});R.val[k]=v}
  /* income statement (multiple-step) */
  var rev=sumSec(m,b,'rev',-1), cogs=sumSec(m,b,'cogs',1);
  keysOf(m,'rev').forEach(function(k){row('is','is:'+k,A[k].n,-b[k],'')});
  keysOf(m,'cogs').forEach(function(k){row('is','is:'+k,'Less: '+A[k].n,-b[k],'')});
  var gp=rev-cogs; row('is','is:gp','Gross profit',gp,'s');
  var opx=0; keysOf(m,'opx').forEach(function(k){opx+=b[k];row('is','is:'+k,A[k].n,-b[k],'ind')});
  var oi=gp-opx; row('is','is:oi','Operating income',oi,'s');
  var oth=0; keysOf(m,'oth').forEach(function(k){oth+=-b[k];row('is','is:'+k,A[k].n,-b[k],'ind')});
  var ibt=oi+oth; row('is','is:ibt','Income before income taxes',ibt,'s');
  var tax=sumSec(m,b,'tax',1);
  keysOf(m,'tax').forEach(function(k){row('is','is:'+k,A[k].n,-b[k],'ind')});
  var ni=ibt-tax; row('is','is:ni','Net income',ni,'tt');
  /* statement of changes in equity */
  var piB=-(o.paidin||0), piE=-b.paidin, reB=-(o.re||0), dv=sumSec(m,b,'divs',1), reE=reB+ni-dv;
  row('sce','h:pi','Paid-in capital',null,'h');
  row('sce','sce:piB','Beginning balance',piB,'ind');
  row('sce','sce:iss','+ Shares issued',piE-piB,'ind');
  row('sce','sce:piE','Ending balance',piE,'s');
  row('sce','h:re','Retained earnings',null,'h');
  row('sce','sce:reB','Beginning balance',reB,'ind');
  row('sce','sce:ni','+ Net income',ni,'ind');
  row('sce','sce:div','− Dividends declared',-dv,'ind');
  row('sce','sce:reE','Ending balance',reE,'s');
  var eqOther=0; keysOf(m,'eq').forEach(function(k){if(k!=='paidin'&&k!=='re'){eqOther+=-b[k];row('sce','sce:'+k,A[k].n,-b[k],'s')}});
  var teq=piE+reE+eqOther; row('sce','sce:teq','Total equity, ending',teq,'tt');
  /* balance sheet */
  row('bs','h:ca','Current assets',null,'h');
  var ca=0; keysOf(m,'ca').forEach(function(k){ca+=b[k];row('bs','bs:'+k,A[k].n,b[k],'ind')});
  row('bs','bs:tca','Total current assets',ca,'s');
  row('bs','h:nca','Non-current assets',null,'h');
  var nca=0; keysOf(m,'nca').forEach(function(k){nca+=b[k];row('bs','bs:'+k,(A[k].contra?'Less: ':'')+A[k].n,b[k],'ind')});
  row('bs','bs:tnca','Total non-current assets',nca,'s');
  var ta=ca+nca; row('bs','bs:ta','TOTAL ASSETS',ta,'tt');
  row('bs','h:cl','Current liabilities',null,'h');
  var cl=0; keysOf(m,'cl').forEach(function(k){cl+=-b[k];row('bs','bs:'+k,A[k].n,-b[k],'ind')});
  row('bs','bs:tcl','Total current liabilities',cl,'s');
  row('bs','h:ncl','Non-current liabilities',null,'h');
  var ncl=0; keysOf(m,'ncl').forEach(function(k){ncl+=-b[k];row('bs','bs:'+k,A[k].n,-b[k],'ind')});
  var tl=cl+ncl; row('bs','bs:tl','Total liabilities',tl,'s');
  row('bs','h:eq','Equity',null,'h');
  row('bs','bs:paidin',A.paidin.n,piE,'ind');
  row('bs','bs:re',A.re.n,reE,'ind');
  keysOf(m,'eq').forEach(function(k){if(k!=='paidin'&&k!=='re')row('bs','bs:'+k,A[k].n,-b[k],'ind')});
  row('bs','bs:teq','Total equity',teq,'s');
  row('bs','bs:tle','TOTAL LIABILITIES & EQUITY',tl+teq,'tt');
  /* statement of cash flows — indirect method */
  row('cf','h:op','Operating activities',null,'h');
  row('cf','cf:ni','Net income',ni,'ind');
  var cfo=ni;
  Object.keys(A).forEach(function(k){if(A[k].nc){var adj=b[k];cfo+=adj;
    row('cf','cf:nc:'+k,(k==='gain'?'Less: ':'Add back: ')+A[k].n,adj,'ind')}});
  Object.keys(A).forEach(function(k){if(A[k].wc){var d=-(b[k]-(o[k]||0));cfo+=d;
    row('cf','cf:wc:'+k,'Change in '+A[k].n.toLowerCase(),d,'ind')}});
  row('cf','cf:cfo','Net cash from operating activities',cfo,'s');
  var groups={inv:{},fin:{},op:{}},direct={op:0,inv:0,fin:0},noncash=[];
  (txs||[]).forEach(function(t){if(t.noncash)noncash.push(t.label);t.je.forEach(function(l){if(l[0]==='cash'&&l[2]){direct[l[2]]+=l[1];var g=groups[l[2]];g[l[3]]=(g[l[3]]||0)+l[1]}})});
  row('cf','h:inv','Investing activities',null,'h');
  Object.keys(groups.inv).forEach(function(lb){row('cf','cf:inv:'+lb,lb,groups.inv[lb],'ind')});
  row('cf','cf:cfi','Net cash from investing activities',direct.inv,'s');
  row('cf','h:fin','Financing activities',null,'h');
  Object.keys(groups.fin).forEach(function(lb){row('cf','cf:fin:'+lb,lb,groups.fin[lb],'ind')});
  row('cf','cf:cff','Net cash from financing activities',direct.fin,'s');
  var net=cfo+direct.inv+direct.fin;
  row('cf','cf:net','Net change in cash',net,'s');
  row('cf','cf:beg','Cash, beginning of period',o.cash||0,'ind');
  row('cf','cf:end','Cash, end of period',(o.cash||0)+net,'tt');
  R.ni=ni;R.rev=rev;R.gp=gp;R.oi=oi;R.ta=ta;R.tl=tl;R.teq=teq;R.reE=reE;R.cfo=cfo;R.cfi=direct.inv;R.cff=direct.fin;R.cash=b.cash;R.noncash=noncash;
  R.ok={bs:Math.abs(ta-tl-teq)<0.01, cash:Math.abs((o.cash||0)+net-b.cash)<0.01, cfo:Math.abs(cfo-direct.op)<0.01};
  R.bal=b;
  return R;
}

/* ---------- transaction library (Follow-the-Number tool) ---------- */
/* je: [account, amount (debit + / credit −), cash-flow class op/inv/fin, cash-flow line label] */
var TX = {
  issue:{n:'Issue common stock for cash',p:[['x','Amount',50000]],
    je:function(p){return [['cash',p.x,'fin','Proceeds from issuing stock'],['paidin',-p.x]]},
    why:'The owners put money in: cash and paid-in capital both rise by the same amount. There is <b>no income statement effect</b> — issuing shares is not revenue; it is the owners\' own money. In the cash flow statement it is a <b>financing</b> inflow.'},
  borrow:{n:'Borrow on a long-term loan',p:[['x','Amount',80000]],
    je:function(p){return [['cash',p.x,'fin','Proceeds from borrowing'],['loan',-p.x]]},
    why:'Cash and liabilities both rise. A loan is not revenue, so the income statement does not move. Only the interest becomes an expense, later, as it accrues. Cash flow: <b>financing</b>.'},
  repay:{n:'Repay loan principal',p:[['x','Amount',20000]],
    je:function(p){return [['loan',p.x],['cash',-p.x,'fin','Repayment of loan principal']]},
    why:'Repaying principal lowers cash and lowers the liability — it is <b>not an expense</b>. Classic trap: principal is financing; only the interest is an expense (and under U.S. GAAP interest paid is classified as operating).'},
  buyEq:{n:'Buy equipment for cash',p:[['x','Amount',60000]],
    je:function(p){return [['ppe',p.x],['cash',-p.x,'inv','Purchase of equipment']]},
    why:'One asset is swapped for another: cash down, equipment up, total assets unchanged. It is <b>not an expense</b> today — it becomes expense gradually through depreciation. Cash flow: <b>investing</b>.'},
  buyEqLoan:{n:'Buy equipment by signing a note (non-cash)',p:[['x','Amount',70000]],noncash:1,
    je:function(p){return [['ppe',p.x],['loan',-p.x]]},
    why:'Assets and liabilities both rise and <b>cash never moves</b>. So it does not appear inside the cash flow statement — it is disclosed separately as a <b>non-cash investing and financing activity</b>.'},
  buyInv:{n:'Buy inventory on credit',p:[['x','Amount',30000]],
    je:function(p){return [['inv',p.x],['ap',-p.x]]},
    why:'Inventory and accounts payable both rise. No expense yet — inventory becomes an expense (cost of goods sold) only when it is sold. No cash left either. In the indirect method the increase in inventory is subtracted and the increase in payables is added: net zero.'},
  buyInvCash:{n:'Buy inventory for cash',p:[['x','Amount',25000]],
    je:function(p){return [['inv',p.x],['cash',-p.x,'op','Payments to suppliers']]},
    why:'Asset swap (cash → inventory). Profit is unchanged, but <b>operating</b> cash falls — buying goods for resale is an operating activity, not an investing one.'},
  saleCredit:{n:'Sell goods on credit',p:[['x','Selling price',40000],['c','Cost of the goods',24000]],
    je:function(p){return [['ar',p.x],['sales',-p.x],['cogs',p.c],['inv',-p.c]]},
    why:'Two entries: revenue at the selling price (receivables up) and cost of goods sold at cost (inventory down). Net income rises by the <b>gross profit</b> only. No cash has arrived yet — profit is up while operating cash is zero. That is exactly the difference between accrual accounting and cash.'},
  saleCash:{n:'Sell goods for cash',p:[['x','Selling price',30000],['c','Cost of the goods',18000]],
    je:function(p){return [['cash',p.x,'op','Cash received from customers'],['sales',-p.x],['cogs',p.c],['inv',-p.c]]},
    why:'Revenue at the selling price, expense at cost, so profit rises by the gross profit. Operating cash rises by the <b>full</b> selling price — the gap between the two is the decrease in inventory.'},
  collect:{n:'Collect from customers',p:[['x','Amount',25000]],
    je:function(p){return [['cash',p.x,'op','Cash received from customers'],['ar',-p.x]]},
    why:'Asset swap: cash up, receivables down. It is <b>not new revenue</b> — revenue was recorded on the day of the sale. But it is an <b>operating</b> cash inflow.'},
  payAP:{n:'Pay suppliers (accounts payable)',p:[['x','Amount',20000]],
    je:function(p){return [['ap',p.x],['cash',-p.x,'op','Payments to suppliers']]},
    why:'Cash down, liabilities down. <b>Not an expense</b> (the expense is recognized when the goods are sold), but it is an operating cash outflow.'},
  paySal:{n:'Pay this month\'s salaries in cash',p:[['x','Amount',15000]],
    je:function(p){return [['salaries',p.x],['cash',-p.x,'op','Payments to employees']]},
    why:'A real, paid expense: net income falls → retained earnings fall → equity falls. At the same time cash falls, so the equation still balances (assets ↓ = equity ↓).'},
  accrSal:{n:'Accrue salaries not yet paid',p:[['x','Amount',8000]],
    je:function(p){return [['salaries',p.x],['accrued',-p.x]]},
    why:'Employees worked this month, so the expense belongs to this month even if it is paid next month (accrual basis). Net income falls, liabilities rise, and <b>cash is untouched</b>. Indirect method: the lower net income is offset by adding back the increase in accrued expenses.'},
  prepay:{n:'Prepay three months of rent',p:[['x','Amount',18000]],
    je:function(p){return [['prepaid',p.x],['cash',-p.x,'op','Rent paid']]},
    why:'Cash went out but the benefit has not been used yet, so it is an <b>asset</b> (prepaid expense), not an expense. Profit is unchanged; operating cash falls.'},
  useRent:{n:'Adjusting entry: one month of prepaid rent expires',p:[['x','Amount',6000]],
    je:function(p){return [['rent',p.x],['prepaid',-p.x]]},
    why:'The month has passed, so part of the asset turns into expense. Profit falls, assets fall, and there is <b>no cash</b> — the cash left on the day of the prepayment.'},
  dep:{n:'Record depreciation for the month',p:[['x','Amount',4000]],
    je:function(p){return [['depexp',p.x],['accdep',-p.x]]},
    why:'Depreciation is a <b>non-cash</b> expense: profit falls and net assets fall, but no cash leaves. That is why the indirect method <b>adds it back</b> to net income. Trap: depreciation is not a "source" of cash — it is added back only because it was subtracted without any cash leaving.'},
  advance:{n:'Receive a customer advance',p:[['x','Amount',12000]],
    je:function(p){return [['cash',p.x,'op','Cash received from customers'],['unearned',-p.x]]},
    why:'The cash arrived but the company has not delivered yet, so it is a <b>liability</b> (unearned revenue), not revenue. Profit is unchanged; operating cash rises.'},
  earnAdv:{n:'Deliver the service paid for in advance',p:[['x','Amount',12000]],
    je:function(p){return [['unearned',p.x],['sales',-p.x]]},
    why:'Only now is the revenue earned: the liability falls and revenue rises, so profit and equity rise — <b>with no cash</b> (the cash came in earlier).'},
  divPay:{n:'Declare and pay a cash dividend',p:[['x','Amount',10000]],
    je:function(p){return [['div',p.x],['cash',-p.x,'fin','Dividends paid']]},
    why:'Dividends are <b>not an expense</b>: net income is unaffected, but retained earnings fall directly in the statement of changes in equity. The cash paid is <b>financing</b> under U.S. GAAP.'},
  divDecl:{n:'Declare a dividend payable next month',p:[['x','Amount',10000]],noncash:1,
    je:function(p){return [['div',p.x],['divpay',-p.x]]},
    why:'Declaration creates a liability: retained earnings fall and liabilities rise. Net income is unaffected and no cash has left yet — it will appear as financing when paid.'},
  sellEq:{n:'Sell old equipment',p:[['c','Original cost',30000],['d','Accumulated depreciation',20000],['x','Selling price',14000]],
    je:function(p){var bv=p.c-p.d,g=p.x-bv,j=[['cash',p.x,'inv','Proceeds from sale of equipment'],['accdep',p.d],['ppe',-p.c]];if(g>0)j.push(['gain',-g]);else if(g<0)j.push(['loss',-g]);return j},
    why:'Carrying (book) value = cost − accumulated depreciation. The difference between the price and the carrying value is a gain or loss on the income statement. But the <b>entire</b> price is an <b>investing</b> inflow, so in the indirect method the gain is <b>subtracted</b> from net income (a loss is added back) — otherwise the same cash would be counted twice.'},
  payInt:{n:'Pay interest on the loan',p:[['x','Amount',3000]],
    je:function(p){return [['interest',p.x],['cash',-p.x,'op','Interest paid']]},
    why:'Interest is an expense: profit falls. Interest paid is classified as <b>operating</b> under U.S. GAAP even though the loan itself is financing — a favorite exam trap.'}
};

/* does any balance end up on the wrong side? (e.g., collecting more than is receivable) */
function invalid(m,b){
  var out=[];Object.keys(m.acc).forEach(function(k){var a=m.acc[k],v=b[k]||0;
    if(a.sec==='ca'||a.sec==='nca'){if(a.contra?v>0.001:v<-0.001)out.push(k)}
    else if(a.sec==='cl'||a.sec==='ncl'||(a.sec==='eq'&&k==='paidin')){if(v>0.001)out.push(k)}});
  return out;
}
function makeTx(id,p){
  var d=TX[id],q={};d.p.forEach(function(a){q[a[0]]=(p&&p[a[0]]!==undefined)?+p[a[0]]:a[2]});
  return {id:id,label:d.n,je:d.je(q),noncash:!!d.noncash,p:q};
}

ST.L={ACC:ACC,OPEN:OPEN,TX:TX,model:model,build:build,balances:balances,makeTx:makeTx,invalid:invalid};
})();
