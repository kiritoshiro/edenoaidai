const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/AdminLogin-CkenhazB.js","assets/api-BIhm3Bkl.js","assets/AdminLogin-CsH8lyIX.css","assets/AdminLayout-CuTaEKD6.js","assets/AdminLayout-Btu2gOZn.css","assets/AdminSongs-TGaG3ITF.js","assets/AdminSongEdit-Cu9jAP5_.js","assets/AdminTracks-C-GC5NzA.js","assets/AdminDatabase-D4wLS1Ey.js"])))=>i.map(i=>d[i]);
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const l of s)if(l.type==="childList")for(const f of l.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&i(f)}).observe(document,{childList:!0,subtree:!0});function r(s){const l={};return s.integrity&&(l.integrity=s.integrity),s.referrerPolicy&&(l.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?l.credentials="include":s.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function i(s){if(s.ep)return;s.ep=!0;const l=r(s);fetch(s.href,l)}})();function Es(e){const t=Object.create(null);for(const r of e.split(","))t[r]=1;return r=>r in t}const Le={},lr=[],tn=()=>{},yu=()=>!1,Yo=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&(e.charCodeAt(2)>122||e.charCodeAt(2)<97),Qo=e=>e.startsWith("onUpdate:"),ht=Object.assign,Ss=(e,t)=>{const r=e.indexOf(t);r>-1&&e.splice(r,1)},wc=Object.prototype.hasOwnProperty,Me=(e,t)=>wc.call(e,t),be=Array.isArray,cr=e=>wr(e)==="[object Map]",vu=e=>wr(e)==="[object Set]",wa=e=>wr(e)==="[object Date]",xc=e=>wr(e)==="[object RegExp]",xe=e=>typeof e=="function",We=e=>typeof e=="string",nn=e=>typeof e=="symbol",Fe=e=>e!==null&&typeof e=="object",bu=e=>(Fe(e)||xe(e))&&xe(e.then)&&xe(e.catch),_u=Object.prototype.toString,wr=e=>_u.call(e),Ec=e=>wr(e).slice(8,-1),wu=e=>wr(e)==="[object Object]",As=e=>We(e)&&e!=="NaN"&&e[0]!=="-"&&""+parseInt(e,10)===e,Fr=Es(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),Jo=e=>{const t=Object.create(null);return(r=>t[r]||(t[r]=e(r)))},Sc=/-\w/g,Ot=Jo(e=>e.replace(Sc,t=>t.slice(1).toUpperCase())),Ac=/\B([A-Z])/g,zn=Jo(e=>e.replace(Ac,"-$1").toLowerCase()),Xo=Jo(e=>e.charAt(0).toUpperCase()+e.slice(1)),Ui=Jo(e=>e?`on${Xo(e)}`:""),en=(e,t)=>!Object.is(e,t),fr=(e,...t)=>{for(let r=0;r<e.length;r++)e[r](...t)},xu=(e,t,r,i=!1)=>{Object.defineProperty(e,t,{configurable:!0,enumerable:!1,writable:i,value:r})},Os=e=>{const t=parseFloat(e);return isNaN(t)?e:t};let xa;const Zo=()=>xa||(xa=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{});function ei(e){if(be(e)){const t={};for(let r=0;r<e.length;r++){const i=e[r],s=We(i)?Cc(i):ei(i);if(s)for(const l in s)t[l]=s[l]}return t}else if(We(e)||Fe(e))return e}const Oc=/;(?![^(]*\))/g,Pc=/:([^]+)/,Rc=/\/\*[^]*?\*\//g;function Cc(e){const t={};return e.replace(Rc,"").split(Oc).forEach(r=>{if(r){const i=r.split(Pc);i.length>1&&(t[i[0].trim()]=i[1].trim())}}),t}function Gr(e){let t="";if(We(e))t=e;else if(be(e))for(let r=0;r<e.length;r++){const i=Gr(e[r]);i&&(t+=i+" ")}else if(Fe(e))for(const r in e)e[r]&&(t+=r+" ");return t.trim()}const Ic="itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",Tc=Es(Ic);function Eu(e){return!!e||e===""}function kc(e,t){if(e.length!==t.length)return!1;let r=!0;for(let i=0;r&&i<e.length;i++)r=Ps(e[i],t[i]);return r}function Ps(e,t){if(e===t)return!0;let r=wa(e),i=wa(t);if(r||i)return r&&i?e.getTime()===t.getTime():!1;if(r=nn(e),i=nn(t),r||i)return e===t;if(r=be(e),i=be(t),r||i)return r&&i?kc(e,t):!1;if(r=Fe(e),i=Fe(t),r||i){if(!r||!i)return!1;const s=Object.keys(e).length,l=Object.keys(t).length;if(s!==l)return!1;for(const f in e){const d=e.hasOwnProperty(f),p=t.hasOwnProperty(f);if(d&&!p||!d&&p||!Ps(e[f],t[f]))return!1}}return String(e)===String(t)}const Su=e=>!!(e&&e.__v_isRef===!0),Nt=e=>We(e)?e:e==null?"":be(e)||Fe(e)&&(e.toString===_u||!xe(e.toString))?Su(e)?Nt(e.value):JSON.stringify(e,Au,2):String(e),Au=(e,t)=>Su(t)?Au(e,t.value):cr(t)?{[`Map(${t.size})`]:[...t.entries()].reduce((r,[i,s],l)=>(r[Vi(i,l)+" =>"]=s,r),{})}:vu(t)?{[`Set(${t.size})`]:[...t.values()].map(r=>Vi(r))}:nn(t)?Vi(t):Fe(t)&&!be(t)&&!wu(t)?String(t):t,Vi=(e,t="")=>{var r;return nn(e)?`Symbol(${(r=e.description)!=null?r:t})`:e};let ct;class Nc{constructor(t=!1){this.detached=t,this._active=!0,this._on=0,this.effects=[],this.cleanups=[],this._isPaused=!1,this._warnOnRun=!0,this.__v_skip=!0,!t&&ct&&(ct.active?(this.parent=ct,this.index=(ct.scopes||(ct.scopes=[])).push(this)-1):(this._active=!1,this._warnOnRun=!1))}get active(){return this._active}pause(){if(this._active){this._isPaused=!0;let t,r;if(this.scopes)for(t=0,r=this.scopes.length;t<r;t++)this.scopes[t].pause();for(t=0,r=this.effects.length;t<r;t++)this.effects[t].pause()}}resume(){if(this._active&&this._isPaused){this._isPaused=!1;let t,r;if(this.scopes)for(t=0,r=this.scopes.length;t<r;t++)this.scopes[t].resume();for(t=0,r=this.effects.length;t<r;t++)this.effects[t].resume()}}run(t){if(this._active){const r=ct;try{return ct=this,t()}finally{ct=r}}}on(){++this._on===1&&(this.prevScope=ct,ct=this)}off(){if(this._on>0&&--this._on===0){if(ct===this)ct=this.prevScope;else{let t=ct;for(;t;){if(t.prevScope===this){t.prevScope=this.prevScope;break}t=t.prevScope}}this.prevScope=void 0}}stop(t){if(this._active){this._active=!1;let r,i;for(r=0,i=this.effects.length;r<i;r++)this.effects[r].stop();for(this.effects.length=0,r=0,i=this.cleanups.length;r<i;r++)this.cleanups[r]();if(this.cleanups.length=0,this.scopes){for(r=0,i=this.scopes.length;r<i;r++)this.scopes[r].stop(!0);this.scopes.length=0}if(!this.detached&&this.parent&&!t){const s=this.parent.scopes.pop();s&&s!==this&&(this.parent.scopes[this.index]=s,s.index=this.index)}this.parent=void 0}}}function Dc(){return ct}let Ve;const $i=new WeakSet;class Ou{constructor(t){this.fn=t,this.deps=void 0,this.depsTail=void 0,this.flags=5,this.next=void 0,this.cleanup=void 0,this.scheduler=void 0,ct&&(ct.active?ct.effects.push(this):this.flags&=-2)}pause(){this.flags|=64}resume(){this.flags&64&&(this.flags&=-65,$i.has(this)&&($i.delete(this),this.trigger()))}notify(){this.flags&2&&!(this.flags&32)||this.flags&8||Ru(this)}run(){if(!(this.flags&1))return this.fn();this.flags|=2,Ea(this),Cu(this);const t=Ve,r=qt;Ve=this,qt=!0;try{return this.fn()}finally{Iu(this),Ve=t,qt=r,this.flags&=-3}}stop(){if(this.flags&1){for(let t=this.deps;t;t=t.nextDep)Is(t);this.deps=this.depsTail=void 0,Ea(this),this.onStop&&this.onStop(),this.flags&=-2}}trigger(){this.flags&64?$i.add(this):this.scheduler?this.scheduler():this.runIfDirty()}runIfDirty(){ss(this)&&this.run()}get dirty(){return ss(this)}}let Pu=0,Br,Lr;function Ru(e,t=!1){if(e.flags|=8,t){e.next=Lr,Lr=e;return}e.next=Br,Br=e}function Rs(){Pu++}function Cs(){if(--Pu>0)return;if(Lr){let t=Lr;for(Lr=void 0;t;){const r=t.next;t.next=void 0,t.flags&=-9,t=r}}let e;for(;Br;){let t=Br;for(Br=void 0;t;){const r=t.next;if(t.next=void 0,t.flags&=-9,t.flags&1)try{t.trigger()}catch(i){e||(e=i)}t=r}}if(e)throw e}function Cu(e){for(let t=e.deps;t;t=t.nextDep)t.version=-1,t.prevActiveLink=t.dep.activeLink,t.dep.activeLink=t}function Iu(e){let t,r=e.depsTail,i=r;for(;i;){const s=i.prevDep;i.version===-1?(i===r&&(r=s),Is(i),jc(i)):t=i,i.dep.activeLink=i.prevActiveLink,i.prevActiveLink=void 0,i=s}e.deps=t,e.depsTail=r}function ss(e){for(let t=e.deps;t;t=t.nextDep)if(t.dep.version!==t.version||t.dep.computed&&(Tu(t.dep.computed)||t.dep.version!==t.version))return!0;return!!e._dirty}function Tu(e){if(e.flags&4&&!(e.flags&16)||(e.flags&=-17,e.globalVersion===zr)||(e.globalVersion=zr,!e.isSSR&&e.flags&128&&(!e.deps&&!e._dirty||!ss(e))))return;e.flags|=2;const t=e.dep,r=Ve,i=qt;Ve=e,qt=!0;try{Cu(e);const s=e.fn(e._value);(t.version===0||en(s,e._value))&&(e.flags|=128,e._value=s,t.version++)}catch(s){throw t.version++,s}finally{Ve=r,qt=i,Iu(e),e.flags&=-3}}function Is(e,t=!1){const{dep:r,prevSub:i,nextSub:s}=e;if(i&&(i.nextSub=s,e.prevSub=void 0),s&&(s.prevSub=i,e.nextSub=void 0),r.subs===e&&(r.subs=i,!i&&r.computed)){r.computed.flags&=-5;for(let l=r.computed.deps;l;l=l.nextDep)Is(l,!0)}!t&&!--r.sc&&r.map&&r.map.delete(r.key)}function jc(e){const{prevDep:t,nextDep:r}=e;t&&(t.nextDep=r,e.prevDep=void 0),r&&(r.prevDep=t,e.nextDep=void 0)}let qt=!0;const ku=[];function rn(){ku.push(qt),qt=!1}function on(){const e=ku.pop();qt=e===void 0?!0:e}function Ea(e){const{cleanup:t}=e;if(e.cleanup=void 0,t){const r=Ve;Ve=void 0;try{t()}finally{Ve=r}}}let zr=0;class Kc{constructor(t,r){this.sub=t,this.dep=r,this.version=r.version,this.nextDep=this.prevDep=this.nextSub=this.prevSub=this.prevActiveLink=void 0}}class Ts{constructor(t){this.computed=t,this.version=0,this.activeLink=void 0,this.subs=void 0,this.map=void 0,this.key=void 0,this.sc=0,this.__v_skip=!0}track(t){if(!Ve||!qt||Ve===this.computed)return;let r=this.activeLink;if(r===void 0||r.sub!==Ve)r=this.activeLink=new Kc(Ve,this),Ve.deps?(r.prevDep=Ve.depsTail,Ve.depsTail.nextDep=r,Ve.depsTail=r):Ve.deps=Ve.depsTail=r,Nu(r);else if(r.version===-1&&(r.version=this.version,r.nextDep)){const i=r.nextDep;i.prevDep=r.prevDep,r.prevDep&&(r.prevDep.nextDep=i),r.prevDep=Ve.depsTail,r.nextDep=void 0,Ve.depsTail.nextDep=r,Ve.depsTail=r,Ve.deps===r&&(Ve.deps=i)}return r}trigger(t){this.version++,zr++,this.notify(t)}notify(t){Rs();try{for(let r=this.subs;r;r=r.prevSub)r.sub.notify()&&r.sub.dep.notify()}finally{Cs()}}}function Nu(e){if(e.dep.sc++,e.sub.flags&4){const t=e.dep.computed;if(t&&!e.dep.subs){t.flags|=20;for(let i=t.deps;i;i=i.nextDep)Nu(i)}const r=e.dep.subs;r!==e&&(e.prevSub=r,r&&(r.nextSub=e)),e.dep.subs=e}}const as=new WeakMap,Vn=Symbol(""),us=Symbol(""),Yr=Symbol("");function yt(e,t,r){if(qt&&Ve){let i=as.get(e);i||as.set(e,i=new Map);let s=i.get(r);s||(i.set(r,s=new Ts),s.map=i,s.key=r),s.track()}}function dn(e,t,r,i,s,l){const f=as.get(e);if(!f){zr++;return}const d=p=>{p&&p.trigger()};if(Rs(),t==="clear")f.forEach(d);else{const p=be(e),b=p&&As(r);if(p&&r==="length"){const v=Number(i);f.forEach((w,C)=>{(C==="length"||C===Yr||!nn(C)&&C>=v)&&d(w)})}else switch((r!==void 0||f.has(void 0))&&d(f.get(r)),b&&d(f.get(Yr)),t){case"add":p?b&&d(f.get("length")):(d(f.get(Vn)),cr(e)&&d(f.get(us)));break;case"delete":p||(d(f.get(Vn)),cr(e)&&d(f.get(us)));break;case"set":cr(e)&&d(f.get(Vn));break}}Cs()}function or(e){const t=Ke(e);return t===e?t:(yt(t,"iterate",Yr),Mt(e)?t:t.map(Ut))}function ti(e){return yt(e=Ke(e),"iterate",Yr),e}function Xt(e,t){return gn(e)?yr($n(e)?Ut(t):t):Ut(t)}const Mc={__proto__:null,[Symbol.iterator](){return Hi(this,Symbol.iterator,e=>Xt(this,e))},concat(...e){return or(this).concat(...e.map(t=>be(t)?or(t):t))},entries(){return Hi(this,"entries",e=>(e[1]=Xt(this,e[1]),e))},every(e,t){return ln(this,"every",e,t,void 0,arguments)},filter(e,t){return ln(this,"filter",e,t,r=>r.map(i=>Xt(this,i)),arguments)},find(e,t){return ln(this,"find",e,t,r=>Xt(this,r),arguments)},findIndex(e,t){return ln(this,"findIndex",e,t,void 0,arguments)},findLast(e,t){return ln(this,"findLast",e,t,r=>Xt(this,r),arguments)},findLastIndex(e,t){return ln(this,"findLastIndex",e,t,void 0,arguments)},forEach(e,t){return ln(this,"forEach",e,t,void 0,arguments)},includes(...e){return Wi(this,"includes",e)},indexOf(...e){return Wi(this,"indexOf",e)},join(e){return or(this).join(e)},lastIndexOf(...e){return Wi(this,"lastIndexOf",e)},map(e,t){return ln(this,"map",e,t,void 0,arguments)},pop(){return Tr(this,"pop")},push(...e){return Tr(this,"push",e)},reduce(e,...t){return Sa(this,"reduce",e,t)},reduceRight(e,...t){return Sa(this,"reduceRight",e,t)},shift(){return Tr(this,"shift")},some(e,t){return ln(this,"some",e,t,void 0,arguments)},splice(...e){return Tr(this,"splice",e)},toReversed(){return or(this).toReversed()},toSorted(e){return or(this).toSorted(e)},toSpliced(...e){return or(this).toSpliced(...e)},unshift(...e){return Tr(this,"unshift",e)},values(){return Hi(this,"values",e=>Xt(this,e))}};function Hi(e,t,r){const i=ti(e),s=i[t]();return i!==e&&!Mt(e)&&(s._next=s.next,s.next=()=>{const l=s._next();return l.done||(l.value=r(l.value)),l}),s}const Fc=Array.prototype;function ln(e,t,r,i,s,l){const f=ti(e),d=f!==e&&!Mt(e),p=f[t];if(p!==Fc[t]){const w=p.apply(e,l);return d?Ut(w):w}let b=r;f!==e&&(d?b=function(w,C){return r.call(this,Xt(e,w),C,e)}:r.length>2&&(b=function(w,C){return r.call(this,w,C,e)}));const v=p.call(f,b,i);return d&&s?s(v):v}function Sa(e,t,r,i){const s=ti(e),l=s!==e&&!Mt(e);let f=r,d=!1;s!==e&&(l?(d=i.length===0,f=function(b,v,w){return d&&(d=!1,b=Xt(e,b)),r.call(this,b,Xt(e,v),w,e)}):r.length>3&&(f=function(b,v,w){return r.call(this,b,v,w,e)}));const p=s[t](f,...i);return d?Xt(e,p):p}function Wi(e,t,r){const i=Ke(e);yt(i,"iterate",Yr);const s=i[t](...r);return(s===-1||s===!1)&&Ds(r[0])?(r[0]=Ke(r[0]),i[t](...r)):s}function Tr(e,t,r=[]){rn(),Rs();const i=Ke(e)[t].apply(e,r);return Cs(),on(),i}const Bc=Es("__proto__,__v_isRef,__isVue"),Du=new Set(Object.getOwnPropertyNames(Symbol).filter(e=>e!=="arguments"&&e!=="caller").map(e=>Symbol[e]).filter(nn));function Lc(e){nn(e)||(e=String(e));const t=Ke(this);return yt(t,"has",e),t.hasOwnProperty(e)}class ju{constructor(t=!1,r=!1){this._isReadonly=t,this._isShallow=r}get(t,r,i){if(r==="__v_skip")return t.__v_skip;const s=this._isReadonly,l=this._isShallow;if(r==="__v_isReactive")return!s;if(r==="__v_isReadonly")return s;if(r==="__v_isShallow")return l;if(r==="__v_raw")return i===(s?l?Qc:Bu:l?Fu:Mu).get(t)||Object.getPrototypeOf(t)===Object.getPrototypeOf(i)?t:void 0;const f=be(t);if(!s){let p;if(f&&(p=Mc[r]))return p;if(r==="hasOwnProperty")return Lc}const d=Reflect.get(t,r,bt(t)?t:i);if((nn(r)?Du.has(r):Bc(r))||(s||yt(t,"get",r),l))return d;if(bt(d)){const p=f&&As(r)?d:d.value;return s&&Fe(p)?cs(p):p}return Fe(d)?s?cs(d):ni(d):d}}class Ku extends ju{constructor(t=!1){super(!1,t)}set(t,r,i,s){let l=t[r];const f=be(t)&&As(r);if(!this._isShallow){const b=gn(l);if(!Mt(i)&&!gn(i)&&(l=Ke(l),i=Ke(i)),!f&&bt(l)&&!bt(i))return b||(l.value=i),!0}const d=f?Number(r)<t.length:Me(t,r),p=Reflect.set(t,r,i,bt(t)?t:s);return t===Ke(s)&&p&&(d?en(i,l)&&dn(t,"set",r,i):dn(t,"add",r,i)),p}deleteProperty(t,r){const i=Me(t,r);t[r];const s=Reflect.deleteProperty(t,r);return s&&i&&dn(t,"delete",r,void 0),s}has(t,r){const i=Reflect.has(t,r);return(!nn(r)||!Du.has(r))&&yt(t,"has",r),i}ownKeys(t){return yt(t,"iterate",be(t)?"length":Vn),Reflect.ownKeys(t)}}class qc extends ju{constructor(t=!1){super(!0,t)}set(t,r){return!0}deleteProperty(t,r){return!0}}const Uc=new Ku,Vc=new qc,$c=new Ku(!0);const ls=e=>e,Co=e=>Reflect.getPrototypeOf(e);function Hc(e,t,r){return function(...i){const s=this.__v_raw,l=Ke(s),f=cr(l),d=e==="entries"||e===Symbol.iterator&&f,p=e==="keys"&&f,b=s[e](...i),v=r?ls:t?yr:Ut;return!t&&yt(l,"iterate",p?us:Vn),ht(Object.create(b),{next(){const{value:w,done:C}=b.next();return C?{value:w,done:C}:{value:d?[v(w[0]),v(w[1])]:v:У]{¶‰ћЛkєwµзYЩKњЩ]][J”УУ‹њЭљ[™ЪYћJ_ЧJJ_XЫЫњЭSШљ™XЭ™њ™Y^™JШљ™XЭ™Yљ[™T›Ь\ќJЧЧЬ›ЭЧЧО›ќ[ЋђќЩ]XЪХ\\О•Ы\Т[њЭ[YљЩ]XЪХ\\О‘ЫKЮ[X›ЫќФЭљ[™ХYЛЭ[YN€“[Щ[HџJJK^Ы[YN€”ЫЫ™ТXЫЫ€‹›ЬОћЫ[YNћЭ\N”Эљ[™Л™\]Z\™Y€L_KЫЫ\]YћЪ[”Ьљ]J
^Ь™]\›€\[Щ€ШЭ[Y[ќќH‰‰€HYШЭ[Y[ќ™Щ][[Y[ќћRY
XЫЫ‹IЭ\Л›[Y_X
_KXЫЫ•\›

^ШЫЫњЭOUЫ

K™љ[™
Oќ›[YOOO]\Л›[YJNЬ™]\›€Y_YKљXЫЫЏЫќ[‹ЧЉПОЉOЧЧЛЪKќ\Э
KљXЫЫЉ_KљXЫЫ‹њЭ\ќХЪ]
‹ИЉOЩKљXЫЫЋ™KљXЫЫ‹љ[ЫY\К‹ИЉOШ	ЧЬ‹™љ[\Р\Щ_KЙЩKљXЫЫџX	ЧЬ‹љXЫЫњР\Щ_KЙЩKљXЫЫџXK]\Љ
^Ь™]\›€\Л›[YKЪ\ђ]

KќХ\\ђШ\ЩJ
___K\^ЪЩ^NЊЫ\ЬО€љXЫЫ‹X]Y[ИџKЬVИљ™Y€—K\VИњЬИ—Kњ^ЪЩ^NЊ‹Ы\ЬО€љXЫЫ‹X]Y[ИXЫЫ‹X]Y[ЛK[]\€џNЩќ[Э[Ы€њ
K‹KЛ
^Ь™]\›€љ[”Ьљ]OКJ
K™JњЭ™И‹\ФЩJќ\ЩH‹Ъ™YЋЪXЫЫ‹IЬ‹›[Y_XKќ[Ь
WJJN›љXЫЫ•\›КJ
K™Jљ[YИ‹ЪЩ^NЊKЫ\ЬО€љXЫЫ‹X]Y[ИXЫЫ‹X]Y[ЛKZ[YИ‹ЬО›љXЫЫ•\›[€€џKќ[\
JNЉJ
K™JњЬ[€‹њќ
›]\ЉKJJ_XЫЫњЭ›\ЫЉЦИњ™[™\€‹њWJKЬ^Ы[YN€“\Э‹ЫЫ\Ы™[ќОћФЫЫ™ТXЫЫЋћ›K›ЬОћЬЫЫ™ЬОћЭ\Nђ\њ^K™\]Z\™Y€L_KШ]ЪћЬЫЫ™ЬК
^Э\ЛќћTШЬ›ЫУ\Э

__K[Э[ќY

^Э\ЛќћTШЬ›ЫУ\Э

_KXЭ]]Y

^Э\ЛќћTШЬ›ЫУ\Э

_KY]ЩОћЭћTШЬ›ЫУ\Э

^ШЫЫњЭO]Ъ[™ЭЛ—ЧЬШЬ›ЫФЫЫ™ОЩI‰ќ\Л‰™^XЪК

OOћШЫЫњЭYШЭ[Y[ќ™Щ][[Y[ќћRY
ЫЫ™ЛIЩ_X
NЭ	‰ЉњШЬ›Ы[ќХљY]КШ›ШЪО€Щ[ќ\€џJKЪ[™ЭЛ—ЧЬШЬ›ЫФЫЫ™П[ќ[
_J___KЬ^ШЫ\ЬО€›\ЭџK^ШЫ\ЬО€™[[Y[ќЧЫќ[X™\€џK\^ШЫ\ЬО€™[[Y[ќЧЭ]HџKЬ^ШЫ\ЬО€љXЫЫњИџNЩќ[Э[Ы€\
K‹KЛ
^ШЫЫњЭЏ^[ЉњЫЫ™ЛZXЫЫ€ЉK^[Љњ›Э]\‹[[љИЉNЬ™]\›€J
K™J™]€‹ЬКJL
K™Jќќ[К‹њЫЫ™ЬЛOЉJ
KЫЉЪYЫЫ™ЛIЬњЫЫ™ТYXЩ^NњљYЫ\ЬО€™[[Y[ќ‹ОЬЫЫ™ЛЙЬњЫЫ™ТYXKЩY][њЉ

OO–ФЩJњЬ[€‹ќ
њЫЫ™ТY
KJKЩJњ‹\ќ
ќ]JKJKЩJ™]€‹ЬКJL
K™Jќќ[К›\ЭЛЏOЉJ
KЫЉ‹ЪЩ^N‹[YNџKќ[И›[YH—JJJKLЋ
JWJWJKОЊџKLМ‹ИљY‹ќИ—JJJKLЋ
JWJ_XЫЫњЭП\ЫЉЬЦИњ™[™\€‹\WJKЬ^Ы[YN€’ЫYH‹ЫЫ\Ы™[ќОћУ\Э“ЯK]J
^Ь™]\›ћЬЫЫ™ЬО–ЧKШYY]›ќ[_KЬ™X]Y

^Э\Л›ШY

_KXЭ]]Y

^Э\Л›ШYY]OO[ШШ[ЭЬYЩK™Щ]][J›\Э[њЭ[ЉI‰ќ\Л›ШY

_KY]ЩОћЫШY

^Э\Л›ШYY][ШШ[ЭЬYЩK™Щ]][J›\Э[њЭ[ЉK\Л‰ЫЫ™ЬЛ›Ь™\ђћJљYЉKќР\њ^J
Kќ[ЉOOћЭ\ЛњЫЫ™ЬПY_JKШ]Ъ
OOЫЫњЫЫK™\њ›ЬЉJJ_KЫХТ[њЭ[YЩJ
^Э\Л‰›Э]\‹њ\Ъ
Ы[YN€љ[њЭ[‹]Y\ћNћЬ™Yњ™\Ъ€ЊHџ_J___NЩќ[Э[Ы€
K‹KЛ
^ШЫЫњЭЏ^[Љ›\ЭЉNЬ™]\›€J
K™J™]€‹ќ[ФЩJќ]Ы€‹ШЫ\ЬО€ќ\]KXќ]Ы€‹ЫђЫXЪОќМ_
МOJ‹‹™
OO›™ЫХТ[њЭ[YЩI‰›™ЫХТ[њЭ[YЩJ‹‹™
J_K€]]Zљ[ќH[ЫY[љ\ИЉK™J‹ЬЫЫ™ЬОњЛњЫЫ™ЬЯKќ[ИњЫЫ™ЬИ—JWJ_XЫЫњЭњ\ЫЉЬЦИњ™[™\€‹WJKЬ^Ы[YN€”Ъ[™ЫH‹ЫЫ\Ы™[ќОћФЫЫ™ТXЫЫЋћ›K›ЬОћЬЫЫ™ТYћЭ\N”Эљ[™Л™\]Z\™Y€L_K]J
^Ь™]\›ћЬЫЫ™О›ќ[ЫЫ™ТYО–ЧK[XYЩU\N€љњИ‹[XYЩSШYY–ЧK[XYЩQ\њ›Ь™Y–ЧK›ЫќЪ^™Nњ\њЩR[ќ
ШШ[ЭЬYЩK™Щ]][J™›ЫќЪ^™HЉKL
_Ќ_KЫЫ\]YћЩ›ЫќЪ^™TЭ[J
^Ь™]\›ћЩ›ЫќЪ^™N	Э\Л™›ЫќЪ^™_\_K›ЭTYЩR[™^\К
^ШЫЫњЭO]\ЛњЫЫ™ПЛ››ЭTYЩ\ПЛ–Э\Лљ[XYЩU\WNЪYЉ\њ^Kљ\Р\њ^JJJ\™]\›€NШЫЫњЭ]\ЛњЫЫ™Й‰“ќ[X™\Љ\ЛњЫЫ™ЛњYЩ\К_Ь™]\›€\њ^K™њ›ЫJЫ[™ЭќK
‹JOOљJ_K[XYЩU\›К
^ЪYЉ]\ЛњЫЫ™К\™]\›–ЧNШЫЫњЭOX	ЧЬ‹››Э\Р\Щ_KЙЭ\Лљ[XYЩU\_KЙЭ\ЛњЫЫ™ЛњЫЫ™ТYXЬ™]\›€\Л››ЭTYЩR[™^\Л›X\
OќOOLШ	Щ_K‰Э\Лљ[XYЩU\_X	Щ_WЙЭK‰Э\Лљ[XYЩU\_X
_KЭ\њ™[ќ[™^

^Ь™]\›€\ЛњЫЫ™ПЭ\ЛњЫЫ™ТYЛљ[™^ЩЉ\ЛњЫЫ™ЛњЫЫ™ТY
N‹L_K™]љ[Э\ФЫЫ™ТY

^Ь™]\›€\ЛЭ\њ™[ќ[™^ЊЭ\ЛњЫЫ™ТYЦЭ\ЛЭ\њ™[ќ[™^LWN€€џK™^ЫЫ™ТY

^Ь™]\›€\ЛЭ\њ™[ќ[™^ЏL	‰ќ\ЛЭ\њ™[ќ[™^\ЛњЫЫ™ТYЛ›[™ЭLOЭ\ЛњЫЫ™ТYЦЭ\ЛЭ\њ™[ќ[™^
МWN€€џ_KШ]ЪћЬЫЫ™ТY

^Э\Л™™]ЪЫЫ™К
_K[XYЩU\›К
^Э\Лњ™\Щ][XYЩ\К
_K›ЫќЪ^™JJ^ЫШШ[ЭЬYЩKњЩ]][J™›ЫќЪ^™H‹Эљ[™КJJ__KЬ™X]Y

^Э\Л™™]ЪЫЫ™ТYК
K\Л™™]ЪЫЫ™К
_KY]ЩОћЬ™\Щ][XYЩ\К
^Э\Лљ[XYЩSШYY]\Лљ[XYЩU\›Л›X\


OO€LJK\Лљ[XYЩQ\њ›Ь™Y]\Лљ[XYЩU\›Л›X\


OO€LJ_KЫ’[XYЩQ\њ›ЬЉJ^Э\Лљ[XYЩSШYYЩWOHL\Лљ[XYЩQ\њ›Ь™YЩWOHLK]Y[Х\›
J^Ь™]\›	ЧЬ‹]Y[Р\Щ_KЙЩ_KЙЭ\ЛњЫЫ™ЛњЫЫ™ТYK›\ШK™]ЪЫЫ™ТYК
^Э\Л‰ЫЫ™ЬЛ›Ь™\ђћJљYЉKќР\њ^J
Kќ[ЉOOћЭ\ЛњЫЫ™ТYПYK›X\
OќњЫЫ™ТY
_JKШ]Ъ
OOЫЫњЫЫK™\њ›ЬЉJJ_K™]ЪЫЫ™К
^Э\Л‰ЫЫ™ЬЛќЪ\™JњЫЫ™ТYЉK™\]X[К\ЛњЫЫ™ТY
K™љ\њЭ

Kќ[ЉOOћЭ\ЛњЫЫ™ПY_ќ[\Лњ™\Щ][XYЩ\К
_JKШ]Ъ
OOЫЫњЫЫK™\њ›ЬЉJJ_KЫХКJ^ЩI‰ќ\Л‰›Э]\‹њ\Ъ
ЬЫЫ™ЛЙЩ_X
_KЩЩЫQ]›Ьљ]J
^ШЫЫњЭO]\ЛњЫЫ™Л™]›Ьљ]YМЊNЭ\Л‰ЫЫ™ЬЛќ\]J\ЛњЫЫ™ЛљYЩ]›Ьљ]Y™_JKќ[ЉOћЭ	‰Љ\ЛњЫЫ™Л™]›Ьљ]YYJ_JKШ]Ъ
OЫЫњЫЫK™\њ›ЬЉ
J_KYќ\Э›ЫќЪ^™JJ^Э\Л™›ЫќЪ^™OSX]›Z[ЉМ‹X]›X^
L‹\Л™›ЫќЪ^™JЩJJ___K\^ЪЩ^NЊЫ\ЬО€њЫЫ™ИџK^ШЫ\ЬО€њЫЫ™ЧЧЭ]HџKЬ^ШЫ\ЬО€њЫЫ™ЧЧШќ]ЫњИџKњVИ™\ШX›Y—KVИќ]H—Kњ^ШЫ\ЬО€љXЫЫ€џKЬ^ЪЩ^NЊ™YЋ€€ЪXЫЫ‹\Э\‹Yќ[џK\^ЪЩ^NЊK™YЋ€€ЪXЫЫ‹\Э\‹Y[\HџKњVИ™\ШX›Y—Kњ^ШЫ\ЬО€њЫЫ™ЧЧЭ™\њЩHџK^ШЫ\ЬО€]Y[ЛZXЫЫ€џK\^ШЫ\ЬО€]Y[Л\^Y\€џK\VИњЬИ—Kњ^ЬЭ[NћИќ^X[YЫ€Ћ€Щ[ќ\€‹›X\™Ъ[‹]ЬЋ€ЊЊџ_K	VИљ[›™\’S—K^ШЫ\ЬО€љ[XYЩKY›Ь›X]XЫЫќZ[™\€‹Э[NћИ›X\™Ъ[‹]ЬЋ€ЊЊџ_KЬ^ШЫ\ЬО€њЫЫ™ЛZ[XYЩHџKЬ^ЪЩ^NЊЫ\ЬО€љ[XYЩK[ШY\€џKњVИњЬИ‹›Ы“ШY‹›Ы‘\њ›Ь€—K\VИљ[›™\’S—NЩќ[Э[Ы€\
K‹KЛ
^ШЫЫњЭЏ^[ЉњЫЫ™ЛZXЫЫ€ЉNЬ™]\›€ЛњЫЫ™ПКJ
K™J™]€‹\ФЩJљ€‹ќ
ЛњЫЫ™ЛњЫЫ™ТY
JИ€ЉУќ
ЛњЫЫ™Лќ]JKJKЩJ™]€‹ЬФЩJќ]Ы€‹ШЫ\ЬО€њЫЫ™ЧЧЫ]љYШ][Ы‹Xќ]Ы€‹\ШX›Y€[њ™]љ[Э\ФЫЫ™ТYЫђЫXЪОќМ_
МOYO›™ЫХКњ™]љ[Э\ФЫЫ™ТY
J_Kќ
њ™]љ[Э\ФЫЫ™ТY
JИ€8Ў¤‹Kњ
KЩJќ]Ы€‹ШЫ\ЬО€њЫЫ™ЧЧЩ›Ыќ\Ъ^™KXќ]Ы€‹ЫђЫXЪОќМW_
МWOYO›Yќ\Э›ЫќЪ^™JJJ_K€XJКИЉKЩJќ]Ы€‹ШЫ\ЬО€њЫЫ™ЧЧЩ›Ыќ\Ъ^™KXќ]Ы€‹ЫђЫXЪОќМ—_
М—OYO›Yќ\Э›ЫќЪ^™JLJJ_K€XKKHЉKЩJќ]Ы€‹ШЫ\ЬО€њЫЫ™ЧЧЩ]›Ьљ]KXќ]Ы€‹]NњЛњЫЫ™Л™]›Ьљ]YИ’qh\Ш]YЫЭHЋ€”[q%ЩЭH‹ЫђЫXЪОќМЧ_
МЧOJ‹‹™
OO›ќЩЩЫQ]›Ьљ]I‰›ќЩЩЫQ]›Ьљ]J‹‹™
J_KКJ
K™JњЭ™И‹њЬЛњЫЫ™Л™]›Ьљ]YКJ
K™Jќ\ЩH‹Ь
JNЉJ
K™Jќ\ЩH‹\
JWJJWK
KЩJќ]Ы€‹ШЫ\ЬО€њЫЫ™ЧЧЫ]љYШ][Ы‹Xќ]Ы€‹\ШX›Y€[›™^ЫЫ™ТYЫђЫXЪОќН_
НOYO›™ЫХК›™^ЫЫ™ТY
J_K€8Ў¤€ЉУќ
›™^ЫЫ™ТY
KKњ
WJKЩJњ‹њФЩJ™[H‹ќ[ќ
ЛњЫЫ™Лќ™\њЩJKJWJK
JL
K™Jќќ[КЛњЫЫ™Л›\ЭЛOЉJ
K™J™]€‹ЪЩ^N™Ы\ЬО€]Y[ЛXЫЫќZ[™\€џKФЩJ™]€‹Ц™J‹Ы[YN™Kќ[И›[YH—JWJKЩJ™]€‹\КJ
K™J]Y[И‹ЪЩ^N	ЩKIЬЛњЫЫ™ЛњЫЫ™ТYX™[ШY€›Y]Y]H‹ЫЫќ›ЫО€€џKФЩJњЫЭ\ЩH‹ЬЬО›]Y[Х\›

K\N€]Y[ЛЫ\YИџKќ[\
KНЧ_
НЧOYЬЉ€\±h^ZЫ1%И™\[ZZЫИ]Y[И[[Y[ќ1lЛ€‹LJJWJJWJWJJJKLЋ
JKЩJ™]€‹њФЩJ™]€‹ШЫ\ЬО€њЫЫ™ЧЧШ›ЩH‹Э[N™ZJ™›ЫќЪ^™TЭ[JK[›™\’SњЛњЫЫ™Л›Щ_Kќ[L‹	
WJKЩJ™]€‹ФЩJќ]Ы€‹ШЫ\ЬО‘ЬЉИњЫЫ™ЧЧЩ›Ыќ\Ъ^™KXќ]Ы€‹љ[XYЩKY›Ь›X]Xќ]Ы€‹ЬЩ[XЭYњЛљ[XYЩU\OOOHњЭ™ИџWJKЫђЫXЪОќНW_
НWOYOњЛљ[XYЩU\OHњЭ™ИЉ_K€]ЬИHИ‹ЉKЩJќ]Ы€‹ШЫ\ЬО‘ЬЉИњЫЫ™ЧЧЩ›Ыќ\Ъ^™KXќ]Ы€‹љ[XYЩKY›Ь›X]Xќ]Ы€‹ЬЩ[XЭYњЛљ[XYЩU\OOOHљњИџWJKЫђЫXЪОќН—_
Н—OYOњЛљ[XYЩU\OHљњИЉ_K€]ЬИ€И‹ЉWJKЩJ™]€‹ЬКJL
K™Jќќ[Кљ[XYЩU\›Л

OOЉJ
K™J™]€‹ЪЩ^N™KЬЛљ[XYЩSШYYЬOТЉ€‹L
NЉJ
K™J™]€‹Ь
JKЛљ[XYЩQ\њ›Ь™YЬOТЉ€‹L
N™™Љ
J
K™Jљ[YИ‹ЪЩ^NЊKЬО™[€€‹Ы“ШYЏOњЛљ[XYЩSШYYЬOHLЫ‘\њ›ЬЋЏO››Ы’[XYЩQ\њ›ЬЉ
_Kќ[њ
JKЦШљЛљ[XYЩSШYYЬWWJWJJJKLЋ
JWJKЩJњЫX[‹ШЫ\ЬО€њЫЫ™ЧЧШЫЬ\љYЪ‹[›™\’SњЛњЫЫ™ЛЫЬ\љYЪKќ[\
WJJN’Љ€‹L
_XЫЫњЭњ\ЫЉЬЦИњ™[™\€‹\WJK^с!N€H‹1#N€И‹1&N€™H‹1%О€™H‹1+О€љH‹1hN€њИ‹1lО€ќH‹1jО€ќH‹1oЋ€ћ€џNЩќ[Э[Ы€\КJ^Ь™]\›€Эљ[™К_€ЉKќУЭЩ\ђШ\ЩJ
Kњ™\XЩJЦс!q#q&q%с+сhqlсjсo—KЩЛO–ЭJKњ™\XЩJЦИx $ш %ЋЋПИ‰К
WKЩЛ€ЉKњ™\XЩJЧКЛЩЛ€ЉKќљ[J
_Yќ[Э[Ы€њ
K
^Ы]ЋЬ™]\›€ќ[Э[ЫЉ‹‹њК^ШЫX\•[Y[Э]
ЉKЏ\Щ][Y[Э]


OO™K\J\ЛКK
__XЫЫњЭ[O^Ы[YN€”ЩX\Ъ‹ЫЫ\Ы™[ќОћУ\Э“ЯK›ЬОћЬ]Y\ћNћЭ\N”Эљ[™ЛY][€€џ_K]J
^Ь™]\›ћЬЫЫ™ЬО–Ч__KШ]ЪћЙ›Э]J
^Э\ЛњЩX\ЪЫЫ™ЬК
__KЬ™X]Y

^Э\Лќ\]TЩX\Ъ\љOVњ
\Лќ\]TЩX\Ъ\љKМ
K\ЛњЩX\ЪЫЫ™ЬК
_KY]ЩОћЫЫ’[њ]
Э\™Щ]ћЭ[YN™__J^Э\Лќ\]TЩX\Ъ\љJKќљ[J
J_K\]TЩX\Ъ\љJJ^ШЫЫњЭYOЮЫ[YN€њЩX\Ъ‹\[\ОћЬ]Y\ћN™__NћЫ[YN€њЩX\ЪџNЭ\Л‰›Э]K›[YOOOHњЩX\ЪЏЭ\Л‰›Э]\‹њ™\XЩJ
Nќ\Л‰›Э]\‹њ\Ъ

_KЩX\ЪЫЫ™ЬК
^ШЫЫњЭOJ\Лњ]Y\ћ_€ЉKќљ[J
NЪYЉYJ^Э\ЛњЫЫ™ЬПVЧNЬ™]\›џZYЉќ[X™\‹љ\Т[ќYЩ\Љќ[X™\ЉJJJ^Э\Л‰ЫЫ™ЬЛќЪ\™JњЫЫ™ТYЉKњЭ\ќХЪ]
JK›[Z]
L
KќР\њ^J
Kќ[ЉЏOћЭ\ЛњЫЫ™ЬП\џЧ_JKШ]Ъ
ЏOЫЫњЫЫK™\њ›ЬЉЉJNЬ™]\›џXЫЫњЭZ\КJNЭ\Л‰ЫЫ™ЬЛ™љ[\ЉЏOћШЫЫњЭOP\њ^Kљ\Р\њ^J‹ќ]JOЬ‹ќ]Kљ›Ъ[Љ€ЉNњ‹ќ]NЬ™]\›€\К‹›ЩJKљ[ЫY\К
_\КJKљ[ЫY\К
_JK›[Z]
М
KќР\њ^J
Kќ[ЉЏOћЭ\ЛњЫЫ™ЬП\џЧ_JKШ]Ъ
ЏOЫЫњЫЫK™\њ›ЬЉЉJ___KO^ШЫ\ЬО€™›Ь›HџK›O^ШЫ\ЬО€љ[њ]XЫЫќZ[™\€џK›OVИќ[YH—NЩќ[Э[Ы€ЫJK‹KЛ
^ШЫЫњЭЏ^[Љ›\ЭЉNЬ™]\›€J
K™J™]€‹KФЩJ™]€‹›KФЩJљ[њ]‹Э\N€ќ^‹XЩZЫ\Ћ€”qh^ZЪ]H1#ZXK‹‹€‹[YNњ‹њ]Y\ћKЫ’[њ]ќМ_
МOJ‹‹™
OO››Ы’[њ]	‰››Ы’[њ]
‹‹™
J_Kќ[›JWJK™J‹ЬЫЫ™ЬОњЛњЫЫ™ЬЯKќ[ИњЫЫ™ЬИ—JWJ_XЫЫњЭ[O\ЫЉ[KЦИњ™[™\€‹ЫWWJKЫO^Ы[YN€’[њЭ[‹]J
^Ь™]\›ћЬЭ]\О€€‹Y\ЬШYЩN€”ќ[сhZX[Xx )€‹\њ›ЬЋ€€‹Э[ЊЭ\њ™[ќЊ_KЬ™X]Y

^Э\ЛњЭ\ќ

_KY]ЩОћШ\Ю[ИЭ\ќ

^Э\ЛњЭ]\ПH€‹\Л™\њ›ЬЏH€‹\Л›Y\ЬШYЩOH”ќ[сhZX[Xx )€‹\ЛќЭ[L\ЛЭ\њ™[ќLЭћ^К\Л‰›Э]Kњ]Y\ћKњ™Yњ™\ЪOOHЊHџ]ШZ]ќњЫЫ™ЬЛЫЭ[ќ

OЊ
I‰Љ\Л›Y\ЬШYЩOH•[ЫZHЩ[љH[ЫY[ћ\ш )€‹]ШZ]\ЛЫX\”ќ[ќ[YPШXЪ\К
JK\Л›Y\ЬШYЩOH”Ъ][±#ZX[XHЪY\ЫZqlИ[ЫY[±lИ^±%ш )€ЋШЫЫњЭЭ—OX]ШZ]›ЫZ\ЩK[
Э\Л™™]ЪњЫЫЉЬ‹™•\›
K\Л™™]ЪњЫЫЉЬ‹ќXЪЬХ\›
KШ]Ъ


OO–ЧJWJNЪYЉP\њ^Kљ\Р\њ^J
_]›[™Э
]›ЭИ™]И\њ›ЬЉ‘Ш]]Hqhq#ZXH\H™][љШ[XH[ЫY[±lИ^±%ИЉNШЫЫњЭOP\њ^Kљ\Р\њ^JЉOЬЋ–ЧNЭ\Л›Y\ЬШYЩOH±+њqh[ЫXx )€‹]ШZ]\Лљ[\ЬќЫЫ™ЬКJKЫ
K›X\

Ы[YNњЛX™[›XЫЫЋ™џJOOЉЫ[YNњЛX™[›ЛXЫЫЋ™џќ[JJJKШШ[ЭЬYЩKњЩ]][J›\Э[њЭ[‹Эљ[™К]K››ЭК
JJK\ЛњЭXШЩ\ЬК
_XШ]Ъ
J^ШЫЫњЫЫK™\њ›ЬЉJK\ЛњЭ]\ПH™\њ›Ь€‹\Л™\њ›ЬЏYI‰™K›Y\ЬШYЩOЩK›Y\ЬШYЩN”Эљ[™КJ__K\Ю[ИЫX\”ќ[ќ[YPШXЪ\К
^ЪYЉШXЪ\Иљ[€Ъ[™ЭК]ћ^ШЫЫњЭOX]ШZ]ШXЪ\ЛљЩ^\К
NШ]ШZ]›ЫZ\ЩK[
K™љ[\ЉO€]љ[ЫY\Књ™XШXЪHЉJK›X\
OШXЪ\Л™[]J
JJ_XШ]Ъ
J^ШЫЫњЫЫK™\њ›ЬЉ“™\]ћZЫИqh][]HЩ1%Ы[О€‹J__K\Ю[И™]ЪњЫЫЉJ^ЪYЉYJ]›ЭИ™]И\њ›ЬЉ“™[ќ\›Щ]\И[ЫY[±lИ^±%ЬИY™\Ш\И
’UWС—ХT“
HЉNШЫЫњЭYKљ[ЫY\КЏИЉOИ‰€Ћ€ЏИ‹ЏX]ШZ]™]Ъ
	Щ_IЭ]IС]K››ЭК
_XШШXЪN€››Л\ЭЬ™HџJNЪYЉ\‹›ЪК]›ЭИ™]И\њ›ЬЉ™\]ћZЫИ\њЪqlЬЭH
	Ь‹њЭ]\ЯJX
NЬ™]\›€‹љњЫЫЉ
_K\Ю[И[\ЬќЫЫ™ЬКK
^Э\ЛќЭ[YK›[™Э\ЛЭ\њ™[ќLШЫЫњЭЏYK›X\
ПOћШЫЫњЭЬЫЫ™ТY›]N™‹™\њЩN™›ЩNњЫЬ\љYЪ‹YЩ\Оќ‹›ЭTYЩ\ОќЯO\ЛП]™љ[\ЉЏOђ\њ^Kљ\Р\њ^J‹ќXЪЬКI‰љ‹ќXЪЬЛљ[ЫY\К
JK›X\
ЏOљ‹›[YJNЬ™]\›ћЬЫЫ™ТY›]N™‹™\њЩN™›ЩNњЫЬ\љYЪ‹YЩ\Оќџќ[›ЭTYЩ\ОќЯќ[]›Ьљ]YЊ\ЭОђЯ_JKO[™]ИЩ]

]ШZ]ќњЫЫ™ЬЛќЪ\™J™]›Ьљ]YЉK™\]X[КJKќР\њ^J
JK›X\
ПOњЛњЫЫ™ТY
JNЬ‹™›Ь‘XXЪ
ПOћЪKљ\КЛњЫЫ™ТY
I‰ЉЛ™]›Ьљ]YLJ_JK]ШZ]ќќ[њШXЭ[ЫЉњќИ‹ќњЫЫ™ЬЛ\Ю[К
OOћШ]ШZ]ќњЫЫ™ЬЛЫX\Љ
NШЫЫњЭПLLЩ›ЬЉ]LЫ‹›[™ЭЫ
П\КX]ШZ]ќњЫЫ™ЬЛќ[РY
‹њЫXЩJ
ЬКJK\ЛЭ\њ™[ќSX]›Z[Љ
ЬЛ‹›[™Э
_J_KЭXШЩ\ЬК
^Э\ЛњЭ]\ПHњ™XYH‹Щ][Y[Э]


OOќ\Л‰›Э]\‹њ™\XЩJ‹ИЉK
___K[O^ШЫ\ЬО€љ[њЭ[[Y\ЬШYЩHџK[O^ЪЩ^NЊNЩќ[Э[Ы€JK‹KЛ
^Ь™]\›€J
K™J™]€‹[KЬЛњЭ]\ПOOHњ™XYHЏКJ
K™JќЪЩ^NЊKЩЬЉ”\ќ[сh]HHЉWKЌ
JNњЛњЭ]\ПOOH™\њ›Ь€ЏКJ
K™JќЪЩ^NЊ_KФЩJњ‹ќ[±+ќћZЫИЫZYN€ЉУќ
Л™\њ›ЬЉKJKЩJќ]Ы€‹ШЫ\ЬО€ќ\]KXќ]Ы€[њЭ[\™]ћH‹ЫђЫXЪОќМ_
МOJ‹‹™ЉOO›њЭ\ќ	‰›њЭ\ќ
‹‹™ЉJ_K€[™]H\€Ш\ќ1!HЉWKЌ
JNЉJ
K™JќЪЩ^NЊџKФЩJњ‹ќ[ќ
Л›Y\ЬШYЩJKJKЛќЭ[КJ
K™Jњ‹[Kќ
ЛЭ\њ™[ќ
JИ‹ИЉУќ
ЛќЭ[
KJJN’Љ€‹L
WKЌ
JWJ_XЫЫњЭЫO\ЫЉЫKЦИњ™[™\€‹WWJK›O^Ы[YN€“›Э›Э[™‹Ь™X]Y

^ЪYЉYШЭ[Y[ќњ]Y\ћTЩ[XЭЬЉ	ЫY]VЫ[YOHњ›Ш›ЭИ—IКJ^ШЫЫњЭOYШЭ[Y[ќЬ™X]Q[[Y[ќ
›Y]HЉNЩK›[YOHњ›Ш›ЭИ‹KЫЫќ[ќH››Ъ[™^‹ШЭ[Y[ќљXY\[™Ъ[
JK\Л›Y]OY__K[›[Э[ќY

^Э\Л›Y]I‰ќ\Л›Y]Kњ™[[Э™J
__KO^ШЫ\ЬО€››ЭY›Э[™џNЩќ[Э[Ы€JK‹KЛ
^Ь™]\›€J
K™Jљ‹K”\Ы\\И™YYЮљ\Э[ЪK‹‹€Љ_XЫЫњЭO\ЫЉ›KЦИњ™[™\€‹WWJK[O^Ы[YN€‘]›Ьљ]\И‹ЫЫ\Ы™[ќОћУ\Э“ЯK]J
^Ь™]\›ћЬЫЫ™ЬО–Ч__KЬ™X]Y

^Э\Л›ШY

_KXЭ]]Y

^Э\Л›ШY

_KY]ЩОћЫШY

^Э\Л‰ЫЫ™ЬЛќЪ\™JЩ]›Ьљ]YЊ_JKќР\њ^J
Kќ[ЉOOћЭ\ЛњЫЫ™ЬПY_JKШ]Ъ
OOЫЫњЫЫK™\њ›ЬЉJJ___KЫO^ЪЩ^NЊKЫ\ЬО€™]›Ьљ]\ЛY[\HџNЩќ[Э[Ы€[JK‹KЛ
^ШЫЫњЭЏ^[Љ›\ЭЉNЬ™]\›€ЛњЫЫ™ЬЛ›[™ЭКJ
KЫЉ‹ЪЩ^NЊЫЫ™ЬОњЛњЫЫ™ЬЯKќ[ИњЫЫ™ЬИ—JJNЉJ
K™Jљ€‹ЫK€qhq#ZXK€љY1%ЪЪ]HљYHq%ЩЬЭ[qlИ\Ь]\Щ[ZH1oќZYсo™]1&HЉJ_XЫЫњЭ›O\ЫЉ[KЦИњ™[™\€‹[WWJK[VИ›\Э‹њЩX\Ъ‹™]›Ьљ]\И—KЪO\Ь
Ъ\ЭЬћN‘™
‹ИЉK[љРXЭ]™PЫ\ЬО€љ\ЛXXЭ]™H‹ШЬ›Ы™Z]љ[ЬЉKЉ^Ь™]\›€›[YOOOHњЪ[™ЫH‰‰–[љ[ЫY\КK›[YJOИLNњџЭЬЊ_K›Э]\О–ЮЬ]€‹И‹[YN€›\Э‹ЫЫ\Ы™[ќ”њKЬ]€‹ЬЫЫ™ЛОњЫЫ™ТY‹[YN€њЪ[™ЫH‹ЫЫ\Ы™[ќ’њ›ЬО€LKЬ]€‹Щ]›Ьљ]\И‹[YN€™]›Ьљ]\И‹ЫЫ\Ы™[ќќ›_KЬ]€‹ЬЩX\ЪОњ]Y\ћOИ‹[YN€њЩX\Ъ‹ЫЫ\Ы™[ќљ[K›ЬО€LKЬ]€‹Ъ[њЭ[‹[YN€љ[њЭ[‹ЫЫ\Ы™[ќЫ_KЬ]€‹ШYZ[‹ЫЩЪ[€‹[YN€YZ[‹[ЩЪ[€‹ЫЫ\Ы™[ќЉ
OO’ќ


OOљ[\Ьќ
‹‹РYZ[“ЩЪ[‹PЪЩ[љ^ђ‹љњИЉKЧЭљ]WЧЫX\\КМK—JJ_KЬ]€‹ШYZ[€‹ЫЫ\Ы™[ќЉ
OO’ќ


OOљ[\Ьќ
‹‹РYZ[“^[Э]PЭUQRС‹љњИЉKЧЭљ]WЧЫX\\КМЛKJJKЪ[™[Ћ–ЮЬ]€€‹[YN€YZ[‹\ЫЫ™ЬИ‹ЫЫ\Ы™[ќЉ
OO’ќ


OOљ[\Ьќ
‹‹РYZ[”ЫЫ™ЬЛUШQМТU‹љњИЉKЧЭљ]WЧЫX\\КНKWJJ_KЬ]€њЫЫ™ЬЛЫ™]И‹[YN€YZ[‹\ЫЫ™Л[™]И‹ЫЫ\Ы™[ќЉ
OO’ќ


OOљ[\Ьќ
‹‹РYZ[”ЫЫ™СY]PЭNZђTWЛљњИЉKЧЭљ]WЧЫX\\КН‹WJJ_KЬ]€њЫЫ™ЬЛОњЫЫ™ТY‹[YN€YZ[‹\ЫЫ™ЛYY]‹ЫЫ\Ы™[ќЉ
OO’ќ


OOљ[\Ьќ
‹‹РYZ[”ЫЫ™СY]PЭNZђTWЛљњИЉKЧЭљ]WЧЫX\\КН‹WJJK›ЬО€LKЬ]€ќXЪЬИ‹[YN€YZ[‹]XЪЬИ‹ЫЫ\Ы™[ќЉ
OO’ќ


OOљ[\Ьќ
‹‹РYZ[•XЪЬЛPЛQРНSћђKљњИЉKЧЭљ]WЧЫX\\КНЛWJJ_KЬ]€™]X\ЩH‹[YN€YZ[‹Y]X\ЩH‹ЫЫ\Ы™[ќЉ
OO’ќ


OOљ[\Ьќ
‹‹РYZ[‘]X\ЩKQУМQ^KљњИЉKЧЭљ]WЧЫX\\КОWJJ_W_KЬ]€‹Оњ]X]Ъ
ЉЉJ€‹[YN€››ЭY›Э[™‹ЫЫ\Ы™[ќњ_W_JNЫ]ЭOHLNШЪK™Y›Ь™QXXЪ
\Ю[ИOOћЪYЉK›[YOOOHљ[њЭ[џKњ]њЭ\ќХЪ]
‹ШYZ[€ЉJ\™]\›€LЪYЉYЭJ^ЩЭOHLШЫЫњЭЪ\Т[њЭ[YќOX]ШZ]ќ
\Ю[К
OOћШЫЫњЭЪ\Т[њЭ[YњџOX]ШZ]›ЫZ\ЩKњ™\ЫЫ™J
Kќ[Љ

OO™
NЬ™]\›ћЪ\Т[њЭ[Yњџ_K›ЪY
NЪYЉX]ШZ]

J\™]\›ћЫ[YN€љ[њЭ[џ_\™]\›€LJNШЪK™Y›Ь™QXXЪ
\Ю[ИOOћЪYЉYKњ]њЭ\ќХЪ]
‹ШYZ[€Љ_K›[YOOOHYZ[‹[ЩЪ[€Љ\™]\›€LШЫЫњЭШ\NќOX]ШZ]ќ
\Ю[К
OOћШЫЫњЭШ\NњџOX]ШZ][\Ьќ
‹‹Ш\KP’ZLРљЫљњИЉNЬ™]\›ћШ\Nњџ_KЧJNЭћ^Ь™]\›€]ШZ]›YJ
KLXШ]ЪЬ™]\›ћЫ[YN€YZ[‹[ЩЪ[€‹]Y\ћNћЬ™Y\™XЭ™K™ќ[]___JNШЪKYќ\‘XXЪ

K
OOћЭЪ[™ЭЛ—ЧЬШЬ›ЫФЫЫ™П]›[YOOOHњЪ[™ЫH‰‰–[љ[ЫY\КK›[YJOЭњ\[\ЛњЫЫ™ТY›ќ[JNШ\Ю[Иќ[Э[Ы€›J
^Эћ^ЪYЉИ™•™\њЪ[Ы€‹™]X\ЩU\]Y‹њЭИ—K™›Ь‘XXЪ
OO›ШШ[ЭЬYЩKњ™[[Э™R][JJJKњЩ\ќљXЩUЫЬљЩ\€љ[€]љYШ]ЬЉ^ШЫЫњЭOX]ШZ]]љYШ]Ь‹њЩ\ќљXЩUЫЬљЩ\‹™Щ]™YЪ\Э][ЫњК
NЩ›ЬЉЫЫњЭЩ€J^ШЫЫњЭЏ]XЭ]™_ќШZ][™Яљ[њЭ[[™ОЬ‰‰њ‹њШЬљ\T“љ[ЫY\КњЩ\ќљXЩK]ЫЬљЩ\‹љњИЉI‰Љ]ШZ]ќ[њ™YЪ\Э\Љ
KЫЫњЫЫKљ[™›К”Щ[\ИЩ\ќљXЩHЫЬљЩ\€qhX[[ќ\Л€ЉJ___XШ]Ъ
J^ШЫЫњЫЫK™\њ›ЬЉJ__X›J
NШЫЫњЭ\П\Z
Y
NЬ\ЛЫЫ™љYЛ™ЫШ[›Ь\ќY\Л‰ЫЫ™ЬПPќњЫЫ™ЬОЬ\Лќ\ЩJЪJNЬ\Л›[Э[ќ
€Ш\ЉNХЪ
Ъ[[YYX]N€LJNЩ^ЬќЩќ\И‹Ы€\ИЛЩH\ИK€\И‹™H\ИЛЫH\И™H\ИK€\И‹Ь€\ИЛИ\ИЬ€\ИKH\ИЛ[€\И‹ќ\ИЫH\И‹™€\ИЯNВ