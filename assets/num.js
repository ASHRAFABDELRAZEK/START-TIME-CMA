/* START TIME — shared number display and exact arithmetic for labs (ST.N).
   One place for every number a lab shows: rounding, sign, grouping, "below the display unit"
   labels, very large values, comparisons at display precision, input parsing, exact cents.
   Rules come from docs/rules/R14-witness-catalog.md (items 1-12). Spec: docs/library/01-num-spec.md.
   Tests: node tools/review/num_tests.mjs (must print FAIL 0). No lab may format numbers itself. */
(function(root){
'use strict';
var ST = root.ST = root.ST || {};
var EPS = Number.EPSILON, SAFE = 9007199254740992; /* 2^53 */
var NM = 'n.m.', BIG = 'too large to show', MINUS = '−';
var ROUND_NOTE='Displayed components are rounded independently at the stated precision. Totals use the underlying values, so the displayed total may differ from the sum of displayed components.';
var ROUND_NOTE_CENTS='Amounts are generally shown rounded to cents. When reliable cent precision is unavailable, large amounts are shown rounded to whole dollars. Displayed components are rounded independently, so their sum may differ from the displayed total.';   /* money at 2 decimals */

function bad(x){return typeof x!=='number'||x!==x||x===Infinity||x===-Infinity}
function p10(dp){var s=1,i;for(i=0;i<dp;i++)s*=10;return s}

/* Whole display units in a (a >= 0) at dp decimals, rounded half away from zero.
   Tie guard: a value within max(1e-9, about 2 ulps, capped at 0.01) of a display unit below a half step counts
   as the half step (the 2-ulp term grows with the amount, up to the 0.01 cap: a display aid, not exact money), so 115.00 - 115.05 (stored as -0.04999999999999716) rounds to 0.1 at one decimal.
   Returns null when the count cannot be held exactly (2^53 or more, or decimals past 15 significant digits). */
function mag(a,dp){
  var t=a*p10(dp);
  if(t>=SAFE||(dp>0&&t>=1e15))return null;   /* decimals are shown only within 15 significant digits */
  if(t>=4503599627370496)return t;            /* 2^52 and above: already a whole number */
  var g=Math.min(Math.max(1e-9,t*2*EPS),0.01);
  return Math.floor(t+0.5+g);
}
function group(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',')}
function digits(n,dp){
  var s=String(n);
  if(dp>0){while(s.length<=dp)s='0'+s;return group(s.slice(0,-dp))+'.'+s.slice(-dp)}
  return group(s);
}

/* fix(x, dp, o): the one formatter. o = {cur:'$', suf:'%', paren, plus, trim, zero}.
   - never scientific notation, never a signed zero ("-0.00");
   - a non-zero value that rounds to zero reads "positive, below 0.01" / "negative, magnitude below 0.01";
   - when dp decimals cannot be held exactly the value is shown in whole units; 2^53 and above reads BIG;
   - not a finite number reads NM. */
function fix(x,dp,o){
  o=o||{};
  if(bad(x))return NM;
  dp=dp|0;
  var a=Math.abs(x),neg=x<0,d=dp,n=mag(a,d);
  if(n===null&&d>0){d=0;n=mag(a,0)}
  if(n===null)return BIG;
  var cur=o.cur||'',suf=o.suf||'';
  if(n===0){
    if(a===0)return o.zero!=null?o.zero:cur+digits(0,d)+suf;
    var u=cur+digits(1,d)+suf;
    return neg?'negative, magnitude below '+u:'positive, below '+u;
  }
  var body=digits(n,d);
  if(o.trim&&d>0)body=body.replace(/\.0+$/,'');
  body=cur+body+suf;
  if(neg)return o.paren?'('+body+')':MINUS+body;
  return o.plus?'+'+body:body;
}
function merge(o,k,v){var r={},i;for(i in (o||{}))r[i]=o[i];if(r[k]==null)r[k]=v;return r}
function money(x,o){return fix(x,(o&&o.dp!=null)?o.dp:2,o)}
function pct(v,dp,o){return fix(v,dp==null?1:dp,merge(o,'suf','%'))}      /* v already in percent */
function pctOf(r,dp,o){return bad(r)?NM:pct(r*100,dp,o)}                    /* r is a ratio */

/* abs2(x): the legacy ST.money format, made safe: ABSOLUTE value, at most 2 decimals, trailing zeros dropped.
   It never gives a sign: a non-zero value that rounds to zero reads "magnitude below 0.01" for both signs.
   A lab that needs the sign uses money(). */
function abs2(x){
  if(bad(x))return NM;
  var s=fix(Math.abs(x),2);
  if(s===BIG)return s;
  if(/^positive, below/.test(s))return s.replace(/^positive, below/,'magnitude below');
  return s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');
}

/* near(a,b,scale,quantum) and sign(x,scale,quantum): floating-point NOISE removal, nothing more.
   tol = 4 ulps of the largest amount (scale), and never more than a tenth of the domain quantum when one is given
   (0.01 for cents). No tolerance can tell noise from a true tiny difference at every scale: money that must be
   exact is compared in whole units (units, pctUnits, or the lab's own integer arithmetic), not with these.
   sign returns null (not 0) for a value that is not a finite number, and null when it cannot decide: the value is
   larger than quantum/10 but still inside the noise of the scale (amounts so large that floats lose the quantum). */
function near(a,b,scale,quantum){
  if(bad(a)||bad(b)||(scale!=null&&bad(scale)))return false;
  var tol=4*EPS*Math.max(1,Math.abs(a),Math.abs(b),Math.abs(scale||0));
  if(quantum!=null)tol=Math.min(tol,Math.abs(quantum)/10);
  return Math.abs(a-b)<=tol;
}
function sign(x,scale,quantum){
  if(bad(x)||(scale!=null&&bad(scale)))return null;
  var noise=4*EPS*Math.max(1,Math.abs(scale||0)),tol=noise;
  if(quantum!=null)tol=Math.min(tol,Math.abs(quantum)/10);
  if(Math.abs(x)<=tol)return 0;
  if(Math.abs(x)<=noise)return null;   /* inside the noise of this scale but above quantum/10: floats cannot decide; use exact units */
  return x<0?-1:1;
}
/* cmp(a,b,dp,o): {s, tie, invalid}. s = sign of a-b (noise removed; o.scale, o.quantum). tie = different values
   that print the same at dp decimals, so the text must say "before rounding". invalid = a value is not a finite
   number or the comparison cannot be decided (s is null), or one of them cannot be displayed (BIG): the lab
   must branch on invalid first. */
function cmp(a,b,dp,o){
  if(bad(a)||bad(b))return {s:null,tie:false,invalid:true};
  var fa=fix(a,dp,o),fb=fix(b,dp,o);
  var s=sign(a-b,Math.max(Math.abs(a),Math.abs(b),Math.abs((o&&o.scale)||0)),o&&o.quantum);
  if(s===null)return {s:null,tie:false,invalid:true};   /* floats cannot decide at this scale and quantum */
  if(fa===BIG||fb===BIG||fa===NM||fb===NM)return {s:s,tie:false,invalid:true};
  return {s:s,tie:s!==0&&fa===fb,invalid:false};
}

/* ratio(x,dp,o): like fix, plus o.edge (a threshold such as 1) and o.side ('below' | 'above' | 'both').
   A value that is not the edge but would print as the edge gets o.more (default 2, 1 to 12) extra decimals,
   cut so that the display never reaches the edge: 0.99999 -> 0.9999, 1.00001 -> 1.0001.
   With a one-sided o.side, a value on the other side reads "above 1.00 (before rounding)" / "below ...", and so
   does any value that the extra decimals cannot separate from the edge (one ulp away, or too large for them):
   the edge itself is printed only for x === edge. ratio speaks about the NUMBER it is given. Whether a computed
   value such as 16.8 / 1.4 "is" 12 is the lab's decision: when cmp(x, edge).s === 0 (or exact units agree) the
   lab prints fix(x), not ratio(x). */
function ratio(x,dp,o){
  o=o||{};
  if(o.edge!=null&&bad(o.edge))return NM;
  var s=fix(x,dp,o);
  if(o.edge==null||s===NM||s===BIG||s!==fix(o.edge,dp,o))return s;
  if(x===o.edge)return s;
  var below=x<o.edge,side=o.side||'both';
  var boundary=(below?'below ':'above ')+fix(o.edge,dp,o)+' (before rounding)';
  if(near(x,o.edge))return boundary;
  if((below&&side==='above')||(!below&&side==='below'))return boundary;
  var more=Number.isInteger(o.more)&&o.more>=1?Math.min(o.more,12):2;
  var d2=(dp|0)+more,sc=p10(d2),t=x*sc;
  if(Math.abs(t)>=SAFE)return boundary;
  var e=Math.round(o.edge*sc),k=below?Math.floor(t):Math.ceil(t);
  if(below&&k>=e)k=e-1;
  if(!below&&k<=e)k=e+1;
  var refined=fix(k/sc,d2,o);
  return refined===fix(o.edge,dp,o)?boundary:refined;
}

/* Whole units (cents at dp 2). units() rounds half away from zero with the tie guard, so it is exact only for
   an amount that already is a whole number of units (a cent-valid input); null when it cannot be held.
   rnd() returns null in that case too. */
function units(x,dp){
  if(bad(x))return null;
  var n=mag(Math.abs(x),dp==null?2:dp);
  if(n===null)return null;
  return n===0?0:(x<0?-n:n);
}
function fromUnits(n,dp){return n/p10(dp==null?2:dp)}
function rnd(x,dp){var n=units(x,dp);return n===null?null:fromUnits(n,dp)}
/* adds(rows,total,dp): do the displayed rows add to the displayed total? If not, show ROUND_NOTE. */
function adds(rows,total,dp){
  var s=0,i,u;
  for(i=0;i<rows.length;i++){u=units(rows[i],dp);if(u===null)return false;s+=u}
  return s===units(total,dp);
}
/* decimalParts(input): the exact decimal value of a number or of typed text ("12.345", "1e-7") as
   {n: BigInt coefficient, places}. null for anything else, for text longer than 128 characters, and for an
   exponent beyond 400 (checked BEFORE any BigInt power). */
function decimalParts(input){
  var s=String(input).trim().replace(/−/g,'-').toLowerCase();
  if(s.length>128)return null;
  var m=s.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/);
  if(!m)return null;
  var ex=m[5]==null?0:Number(m[5]);
  if(!Number.isSafeInteger(ex)||Math.abs(ex)>400)return null;
  var fraction=m[3]!=null?m[3]:(m[4]||'');
  var coefficient=BigInt((m[2]||'0')+fraction);
  if(m[1]==='-')coefficient=-coefficient;
  return {n:coefficient,places:fraction.length-ex};
}
/* pctUnits(amount, rate, dp): amount x rate% in whole units (dp 0 to 6), half away from zero, rounded ONCE:
   the exact decimal values of both are multiplied with BigInt. 10.03 at 50% -> 502 cents; 10.005 at 50% -> 500.
   Pass the text the user typed (parse().s) when the digits matter; a Number has already lost what it lost.
   null = not a decimal number, out of bounds, or a result of 2^53 units or more. */
function pctUnits(amount,rate,dp){
  dp=dp==null?2:dp;
  if(!Number.isInteger(dp)||dp<0||dp>6)return null;
  var a=decimalParts(amount),r=decimalParts(rate);
  if(!a||!r)return null;
  var prod=a.n*r.n,power=dp-a.places-r.places-2,den=1n;
  if(power>=0)prod*=10n**BigInt(power);
  else den=10n**BigInt(-power);
  var magnitude=prod<0n?-prod:prod;
  var q=(2n*magnitude+den)/(2n*den);
  if(prod<0n)q=-q;
  if(q>=BigInt(SAFE)||q<=-BigInt(SAFE))return null;
  return Number(q);
}

/* bigDiv(num, den): num / den as a whole BigInt, rounded half away from zero, exactly (G6-P2-38 R2, R2-M01).
   num and den are BigInt (or integer text); den must not be zero. Rounds the magnitude, then restores the sign:
   1n/2n -> 1n, -1n/2n -> -1n, 3n/2n -> 2n, 149n/100n -> 1n. null = not integers, or a zero divisor. */
/* big(x): the one argument contract of bigDiv, bigFixed and bigRatio. Accepted: a BigInt, a safe integer Number, or text
   made only of an optional minus sign and digits. Everything else is null: '' and ' ', true, 1.5, a non-number, and a Number past
   2^53 (it has already lost the digits it would pretend to carry). */
function big(x){
  if(typeof x==='bigint')return x;
  if(typeof x==='number')return Number.isSafeInteger(x)?BigInt(x):null;
  if(typeof x==='string'&&/^-?\d+$/.test(x))return BigInt(x);
  return null;
}
function bigDiv(num,den){
  var a=big(num),b=big(den);
  if(a===null||b===null||b===0n)return null;
  var neg=(a<0n)!==(b<0n);
  if(a<0n)a=-a;
  if(b<0n)b=-b;
  var q=(2n*a+b)/(2n*b);
  return neg?-q:q;
}
/* bigFixed(units, dp, o): a BigInt count of 10^-dp units written exactly, with no Number in between, so amounts past
   2^53 keep every digit. dp 0 to 9. o = {cur:'$', suf, paren, plus, minDp}: trailing zeros are dropped down to minDp
   decimals (default dp, so 12345n at dp 4 and minDp 2 reads 1.2345, and 20000n reads 2.00). Grouped with commas;
   a negative reads with the minus sign, or in parentheses when o.paren is set; zero never carries a sign.
   null = not an integer or dp out of range. It rounds nothing: round first (bigDiv), then format. */
function bigFixed(units,dp,o){
  o=o||{};
  var v=big(units);
  if(v===null)return null;
  dp=dp==null?0:dp;
  if(!Number.isInteger(dp)||dp<0||dp>9)return null;
  var neg=v<0n;
  if(neg)v=-v;
  var s=v.toString();
  while(s.length<=dp)s='0'+s;
  var ip=group(dp>0?s.slice(0,-dp):s),fp=dp>0?s.slice(-dp):'';
  var minDp=o.minDp==null?dp:Math.min(Math.max(o.minDp|0,0),dp);
  while(fp.length>minDp&&fp.charAt(fp.length-1)==='0')fp=fp.slice(0,-1);
  var body=(o.cur||'')+ip+(fp?'.'+fp:'')+(o.suf||'');
  if(v===0n)return body;
  if(neg)return o.paren?'('+body+')':MINUS+body;
  return o.plus?'+'+body:body;
}

/* bigRatio(num, den, dp, o): num / den shown at dp decimals, rounded ONCE, half away from zero, from exact BigInt values
   (no Number): a ratio or an average whose numerator and denominator are exact scaled integers. Same display rules as
   fix(): a non-zero value that rounds to zero reads "positive, below 0.01" or "negative, magnitude below 0.01" (with o.cur
   and o.suf in the unit); a zero numerator reads as zero. o as in bigFixed. null = not integers, a zero divisor, dp out of range. */
function bigRatio(num,den,dp,o){
  o=o||{};
  var a=big(num),b=big(den);
  if(a===null||b===null||b===0n||!Number.isInteger(dp)||dp<0||dp>9)return null;
  var q=bigDiv(a*10n**BigInt(dp),b);
  if(q===null)return null;
  if(q===0n&&a!==0n){
    var unit=bigFixed(1n,dp,{cur:o.cur,suf:o.suf,minDp:o.minDp});
    return (a<0n)!==(b<0n)?'negative, magnitude below '+unit:'positive, below '+unit;
  }
  return bigFixed(q,dp,o);
}
/* parse(raw, o): one input check for every lab.
   o = {neg:false, zero:true, int:false, maxDp:2, max:1e12, min:null, msg:{...}}; maxDp:null and max:null switch a limit off.
   Returns {v:number, e:null, s:plain text of the number} or {v:null, e:message}. min and max are checked on the
   signed typed decimal, exactly. v is a Number: beyond about 15 significant digits it is the nearest Number, so
   exact work uses s (decimalParts, pctUnits). */
var MSG={
  blank:'Enter a value in every box.',
  format:'Use a dot as the decimal separator and commas only in groups of three digits.',
  neg:'Enter zero or more: negative values are not allowed.',
  pos:'Enter a value above zero.',
  nonzero:'Enter a value other than zero.',
  int:'Enter a whole number.',
  finite:'Enter a finite number within the supported range.',
  underflow:'Value is too small to represent; enter a shorter decimal.',
  dp:function(n){return n===2?'Enter amounts with at most two decimal places.':'Enter at most '+n+' decimal place'+(n===1?'':'s')+'.'},
  max:function(m){return 'Enter a value of at most '+boundLabel(m)+'.'},
  min:function(m){return 'Enter a value of at least '+boundLabel(m)+'.'}
};
function say(m,k,arg){var t=(m&&m[k]!=null)?m[k]:MSG[k];return typeof t==='function'?t(arg):t}
/* boundLabel(v): a limit written out exactly for an error message (never through fix, which is for display):
   every decimal the limit has, no e-notation, grouped, with its sign. */
function boundLabel(v){
  var p=decimalParts(v);
  if(!p)return NM;
  if(p.n===0n)return '0';
  var neg=p.n<0n,n=neg?-p.n:p.n,s=String(n),k=p.places;
  if(k>0){
    while(s.length<=k)s='0'+s;
    s=s.slice(0,-k)+'.'+s.slice(-k);
    s=s.replace(/0+$/,'').replace(/\.$/,'');
  }else if(k<0){
    s+='0'.repeat(-k);
  }
  var a=s.split('.');
  return (neg?MINUS:'')+group(a[0])+(a.length>1?'.'+a[1]:'');
}
/* decimalBoundCompare(text, bound): -1, 0, 1 for the typed decimal against a limit, exactly (BigInt); null if either
   is not a bounded decimal. */
function decimalBoundCompare(text,bound){
  var a=decimalParts(text),b=decimalParts(String(bound));
  if(!a||!b)return null;
  var places=Math.max(a.places,b.places);
  var av=a.n*10n**BigInt(places-a.places);
  var bv=b.n*10n**BigInt(places-b.places);
  return av<bv?-1:(av>bv?1:0);
}
function parse(raw,o){
  o=o||{};
  var m=o.msg,t=String(raw==null?'':raw).trim().replace(/−/g,'-');
  if(t==='')return {v:null,e:say(m,'blank')};
  var neg=t.charAt(0)==='-';
  if(neg)t=t.slice(1);
  if(!/^(\d{1,3}(,\d{3})+|\d*)(\.\d*)?$/.test(t)||!/\d/.test(t))
    return {v:null,e:say(m,'format')};
  var zeroOk=o.zero!==false,p=t.replace(/,/g,'').split('.'),
      ip=p[0]||'0',fp=p[1]||'';
  if(neg&&!o.neg)return {v:null,e:say(m,zeroOk?'neg':'pos')};
  var maxDp=('maxDp' in o)?o.maxDp:2,max=('max' in o)?o.max:1e12;
  if(o.int&&fp!=='')return {v:null,e:say(m,'int')};
  if(maxDp!=null&&fp.length>maxDp)
    return {v:null,e:say(m,'dp',maxDp)};
  var txt=ip.replace(/^0+(?=\d)/,'')+(fp?'.'+fp:''),
      magnitude=Number(txt);
  if(max!=null&&!neg&&magnitude>max)return {v:null,e:say(m,'max',max)};   /* also catches positive text too long to be finite */
  if(!Number.isFinite(magnitude)||(o.int&&!Number.isSafeInteger(magnitude)))
    return {v:null,e:say(m,'finite')};
  if(magnitude===0&&/[1-9]/.test(ip+fp))
    return {v:null,e:say(m,'underflow')};
  if(magnitude===0&&!zeroOk)
    return {v:null,e:say(m,o.neg?'nonzero':'pos')};
  var v=neg?-magnitude:magnitude;
  var exactText=(neg?'-':'')+txt,comparison;   /* limits are checked on the SIGNED typed decimal, exactly */
  if(max!=null){
    comparison=decimalBoundCompare(exactText,max);
    if(comparison===null)return {v:null,e:say(m,'finite')};
    if(comparison>0)return {v:null,e:say(m,'max',max)};
  }
  if(o.min!=null){
    comparison=decimalBoundCompare(exactText,o.min);
    if(comparison===null)return {v:null,e:say(m,'finite')};
    if(comparison<0)return {v:null,e:say(m,'min',o.min)};
  }
  return {v:magnitude===0?0:v,e:null,s:magnitude===0?'0':(neg?'-':'')+txt};
}

/* answer(raw, o): what counts as a number when a learner types an ANSWER (the numeric questions of every lesson).
   Same grammar as parse() (a dot for the decimal, commas only in groups of three) plus: Arabic-Indic and Persian digits
   (٠-٩, ۰-۹), the Arabic decimal separator (٫) and thousands separator (٬), minus signs (- − –), a leading plus,
   a negative in brackets "(5)", spaces (including no-break) anywhere, and one trailing % (the digits are the answer;
   o.pct === false refuses the sign). No exponent form, no letters, no currency signs.
   Returns {v:number, e:null} or {v:null, e:'Enter a number only.'}. A blank box is the same message. */
var ANSWER_MSG='Enter a number only.';
function answer(raw,o){
  o=o||{};
  var t=String(raw==null?'':raw).replace(/[   \s]/g,'')
    .replace(/[٠-٩]/g,function(c){return String(c.charCodeAt(0)-0x660)})
    .replace(/[۰-۹]/g,function(c){return String(c.charCodeAt(0)-0x6f0)})
    .replace(/٫/g,'.').replace(/٬/g,',').replace(/[−–]/g,'-');
  var bad={v:null,e:ANSWER_MSG};
  if(t==='')return bad;
  var pct=/%$/.test(t);
  if(pct){if(o.pct===false)return bad;t=t.slice(0,-1)}
  var paren=/^\((.*)\)$/.exec(t);
  if(paren)t='-'+paren[1];
  var m=/^([+-]?)((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)$/.exec(t);
  if(!m)return bad;
  var v=Number(m[2].replace(/,/g,''));
  if(!isFinite(v))return bad;
  if(m[1]==='-')v=-v;
  return {v:v===0?0:v,e:null};
}
var N={NM:NM,BIG:BIG,MINUS:MINUS,ROUND_NOTE:ROUND_NOTE,ROUND_NOTE_CENTS:ROUND_NOTE_CENTS,MSG:MSG,
  fix:fix,money:money,pct:pct,pctOf:pctOf,abs2:abs2,ratio:ratio,
  near:near,sign:sign,cmp:cmp,
  units:units,fromUnits:fromUnits,rnd:rnd,adds:adds,pctUnits:pctUnits,decimalParts:decimalParts,
  parse:parse,answer:answer,decimalBoundCompare:decimalBoundCompare,boundLabel:boundLabel,bigDiv:bigDiv,bigFixed:bigFixed,bigRatio:bigRatio,version:'1.3.0'};
ST.N=N;
if(typeof module==='object'&&module&&module.exports)module.exports=N;
})(typeof window==='object'?window:globalThis);
