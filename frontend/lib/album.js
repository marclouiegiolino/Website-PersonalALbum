/* eslint-disable */
/* Imperative album engine (page flip, drag, edit, swap, sound, login gate) ported from Our_Love_Story.html. Client-only: call from useEffect. */
import { createCropper } from './cropper';
export default function initAlbum(api){
'use strict';
var _off=[];function on(t,e,f,o){t.addEventListener(e,f,o);_off.push(function(){t.removeEventListener(e,f,o);});}
var PW=460, PH=620;
var stage=document.getElementById('stage'), frame=document.getElementById('frame'), book=document.getElementById('book');
var prevBtn=document.getElementById('prev'), nextBtn=document.getElementById('next'), label=document.getElementById('label');
var swapBtn=document.getElementById('swap'), soundBtn=document.getElementById('sound'), fileIn=document.getElementById('file'), hint=document.getElementById('hint');
var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var mode='', N=8, cur=0, leaves=[], scale=1, swapMode=false, soundOn=false, ownerName='Your name', pendingKey=null;
var own={}, shR, shL, eR, eL, castR, castL, slR, slL, brR, brL;

function el(tag,cls){var e=document.createElement(tag); if(cls) e.className=cls; return e;}
function pad(n){return (n<10?'0':'')+n;}

/* ---------- random + scene helpers ---------- */
function rng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function R(a,b,r){return a+(b-a)*r();}
function grad(id,stops){return '<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1">'+stops.map(function(c,i){return '<stop offset="'+(i/(stops.length-1)).toFixed(2)+'" stop-color="'+c+'"/>';}).join('')+'</linearGradient>';}
function ridge(r,base,amp,f,jag){var p=r()*6.28,q=r()*6.28,d='M-20,320';for(var x=-20;x<=420;x+=8){var y=base-amp*Math.pow(Math.abs(Math.sin(x*f+p)),.9)*(.65+.35*Math.sin(x*f*2.3+q))+(r()-.5)*jag;d+=' L'+x+','+y.toFixed(1);}return d+' L420,320Z';}
function pines(r,y,n,h,col){var d='';for(var i=0;i<n;i++){var x=r()*430-15,hh=h*(.7+r()*.6),w=hh*.36;d+='M'+x+','+(y-hh)+' L'+(x+w*.5)+','+(y-hh*.62)+' L'+(x+w*.25)+','+(y-hh*.62)+' L'+(x+w*.75)+','+(y-hh*.3)+' L'+(x+w*.35)+','+(y-hh*.3)+' L'+(x+w)+','+y+' L'+(x-w)+','+y+' L'+(x-w*.35)+','+(y-hh*.3)+' L'+(x-w*.75)+','+(y-hh*.3)+' L'+(x-w*.25)+','+(y-hh*.62)+' L'+(x-w*.5)+','+(y-hh*.62)+'Z ';}return '<path d="'+d+'" fill="'+col+'"/>';}
function bldgs(r,color,minH,maxH,win){var x=-10,s='';while(x<410){var w=22+r()*34,h=minH+r()*(maxH-minH);s+='<rect x="'+x.toFixed(0)+'" y="'+(300-h).toFixed(0)+'" width="'+w.toFixed(0)+'" height="'+h.toFixed(0)+'" fill="'+color+'"/>';if(win){for(var wy=300-h+8;wy<290;wy+=12){for(var wx=x+5;wx<x+w-6;wx+=9){if(r()<.32)s+='<rect x="'+wx.toFixed(0)+'" y="'+wy.toFixed(0)+'" width="4" height="6" fill="#ffd27a" opacity="'+(.5+r()*.5).toFixed(2)+'"/>';}}}x+=w+r()*3;}return s;}
function dune(r,y,c,dark){var a=R(40,90,r);return '<path d="M-10,'+y+' C '+(60+R(0,40,r)).toFixed(0)+','+(y-a).toFixed(0)+' '+(150+R(0,40,r)).toFixed(0)+','+(y+20)+' 230,'+(y-a*.6).toFixed(0)+' S 350,'+(y-10)+' 410,'+(y-a*.8).toFixed(0)+' L410,320 L-10,320Z" fill="'+c+'"/><path d="M-10,'+(y+30)+' C 80,'+(y+10)+' 150,'+(y+40)+' 230,'+(y-a*.6+30).toFixed(0)+' L230,320 L-10,320Z" fill="'+dark+'" opacity=".35"/>';}

var S={};
S.sunset=function(r,v,id){var P=[['#2b1b4b','#b83b5e','#f9a45c','#ffe3a3'],['#10234a','#5a63b0','#f2866b','#ffd9a8'],['#3a1c2e','#d1495b','#edae49','#fbeab8']][v];var sx=R(150,250,r),refl='',wv='',i;
for(i=0;i<9;i++){var w=64-i*6;refl+='<rect x="'+(sx-w/2).toFixed(1)+'" y="'+(180+i*11)+'" width="'+w+'" height="3" rx="1.5" fill="#fff0c4" opacity="'+(.8-i*.08).toFixed(2)+'"/>';}
for(i=0;i<16;i++)wv+='<rect x="'+R(0,380,r).toFixed(0)+'" y="'+R(184,296,r).toFixed(0)+'" width="'+R(18,60,r).toFixed(0)+'" height="1.5" fill="'+P[3]+'" opacity=".2"/>';
return '<defs>'+grad('a'+id,P)+grad('b'+id,[P[2],P[0]])+'<radialGradient id="c'+id+'"><stop offset="0" stop-color="#fff3cf" stop-opacity=".85"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></radialGradient></defs><rect width="400" height="180" fill="url(#a'+id+')"/><circle cx="'+sx.toFixed(0)+'" cy="176" r="86" fill="url(#c'+id+')"/><circle cx="'+sx.toFixed(0)+'" cy="174" r="25" fill="#fff4d2"/><ellipse cx="'+R(60,160,r).toFixed(0)+'" cy="'+R(60,100,r).toFixed(0)+'" rx="80" ry="5" fill="'+P[1]+'" opacity=".55"/><ellipse cx="'+R(250,340,r).toFixed(0)+'" cy="'+R(90,130,r).toFixed(0)+'" rx="60" ry="4" fill="'+P[2]+'" opacity=".5"/><rect y="180" width="400" height="120" fill="url(#b'+id+')"/>'+refl+wv+'<path d="M'+(sx+84).toFixed(0)+' 182 l32 0 -7 8 -19 0z M'+(sx+98).toFixed(0)+' 182 v-24 l13 22z" fill="#1b1030"/>';};
S.mountains=function(r,v,id){var P=[['#8fbbe0','#eef4f8','#a9bcd2','#6d86a4','#3a4f69'],['#f0b78e','#fdeedd','#c7a5b8','#8a769c','#4a4268'],['#6fa0c4','#d6e6ef','#a6c0cf','#6a8b9f','#34505f']][v];
return '<defs>'+grad('a'+id,[P[0],P[1]])+'</defs><rect width="400" height="300" fill="url(#a'+id+')"/><circle cx="'+R(60,330,r).toFixed(0)+'" cy="'+R(50,90,r).toFixed(0)+'" r="16" fill="#fffaf0" opacity=".9"/><path d="'+ridge(r,150,70,.021,8)+'" fill="'+P[2]+'"/><path d="'+ridge(r,195,62,.034,9)+'" fill="'+P[3]+'"/><path d="'+ridge(r,238,48,.05,10)+'" fill="'+P[4]+'"/>'+pines(r,300,15,58,P[4])+'<rect y="296" width="400" height="6" fill="'+P[4]+'"/>';};
S.forest=function(r,v,id){var C=[['#7fa98a','#4f8062','#2d5a43','#173a2a'],['#c9a66b','#8a8a4a','#4f6b3a','#25402a'],['#9db4c0','#5f8a8f','#33605f','#17383c']][v];
return '<defs>'+grad('a'+id,v===1?['#f6dcae','#fbeed3']:['#d4e6d6','#a8c9ae'])+'</defs><rect width="400" height="300" fill="url(#a'+id+')"/><polygon points="250,0 300,0 190,300 110,300" fill="#fffbe0" opacity=".16"/><polygon points="320,0 350,0 270,300 230,300" fill="#fffbe0" opacity=".12"/>'+pines(r,160,18,64,C[0])+'<rect y="160" width="400" height="140" fill="'+C[0]+'"/>'+pines(r,205,14,86,C[1])+'<rect y="205" width="400" height="95" fill="'+C[1]+'"/><rect y="150" width="400" height="60" fill="#fff" opacity=".18"/>'+pines(r,255,9,118,C[2])+'<rect y="255" width="400" height="45" fill="'+C[2]+'"/>'+pines(r,310,5,170,C[3])+'<rect y="296" width="400" height="10" fill="'+C[3]+'"/>';};
S.city=function(r,v,id){var P=[['#1b1f4a','#6b4a8f','#f2956b'],['#0d1b3a','#2b5d8f','#f4c27a'],['#2a1740','#a14a7d','#f7a072']][v];var mx=R(280,350,r),my=R(50,80,r);
return '<defs>'+grad('a'+id,P)+'<radialGradient id="g'+id+'"><stop offset="0" stop-color="#fff3d0" stop-opacity=".5"/><stop offset="1" stop-color="#fff3d0" stop-opacity="0"/></radialGradient></defs><rect width="400" height="300" fill="url(#a'+id+')"/><circle cx="'+mx.toFixed(0)+'" cy="'+my.toFixed(0)+'" r="46" fill="url(#g'+id+')"/><circle cx="'+mx.toFixed(0)+'" cy="'+my.toFixed(0)+'" r="17" fill="#f9f1d8"/>'+bldgs(r,'#2b2552',70,150,false)+bldgs(r,'#130f2b',80,190,true);};
S.dunes=function(r,v,id){var P=[['#f4b183','#fde3c0','#e9b27a','#d18a54','#a95f38'],['#c9a0dc','#f6d6e8','#e6b17e','#c27d54','#8a4a3a'],['#7fb6d9','#f2ead0','#eac586','#cf9a5e','#a06a3c']][v];
return '<defs>'+grad('a'+id,[P[0],P[1]])+'</defs><rect width="400" height="300" fill="url(#a'+id+')"/><circle cx="'+R(80,320,r).toFixed(0)+'" cy="'+R(60,100,r).toFixed(0)+'" r="24" fill="#fff6dc" opacity=".95"/>'+dune(r,200,P[2],P[3])+dune(r,235,P[3],P[4])+dune(r,275,P[4],'#000');};
S.snow=function(r,v,id){var P=[['#b8cde4','#eef3f8'],['#f2c8d6','#fbeef2'],['#9fc0dc','#e4eef6']][v],fl='',i;for(i=0;i<70;i++)fl+='<circle cx="'+R(0,400,r).toFixed(0)+'" cy="'+R(0,300,r).toFixed(0)+'" r="'+R(.8,2.2,r).toFixed(1)+'" fill="#fff" opacity=".85"/>';
return '<defs>'+grad('a'+id,P)+'</defs><rect width="400" height="300" fill="url(#a'+id+')"/><path d="'+ridge(r,170,40,.03,6)+'" fill="#d6e2ef"/>'+pines(r,215,12,70,'#3d5a6c')+'<path d="M-10,320 L-10,215 Q100,190 200,222 T410,205 L410,320Z" fill="#f4f8fc"/>'+pines(r,262,7,110,'#2c4658')+'<path d="M-10,320 L-10,262 Q120,240 220,268 T410,255 L410,320Z" fill="#ffffff"/>'+fl;};
S.beach=function(r,v,id){var P=[['#6ec6e8','#d7f1f5','#2bb5c9','#7fdbd6'],['#f6a778','#fde3c3','#2a8aa8','#79c8c9'],['#5aa6d9','#cfe9f4','#1f7fa5','#6fc3d4']][v];var cx=100+v*14,cy=108;
var fr=[-175,-140,-100,-55,-15,20].map(function(a){return '<path transform="translate('+cx+' '+cy+') rotate('+a+')" d="M0 0 Q28 -26 66 -3 Q32 -11 0 0Z" fill="#2f8a4f"/>';}).join('');
return '<defs>'+grad('a'+id,[P[0],P[1]])+grad('b'+id,[P[2],P[3]])+grad('s'+id,['#f2dcae','#e5c387'])+'</defs><rect width="400" height="300" fill="url(#a'+id+')"/><circle cx="320" cy="62" r="22" fill="#fff6d6" opacity=".95"/><rect y="150" width="400" height="60" fill="url(#b'+id+')"/><path d="M0 208 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V216 H0Z" fill="#fff" opacity=".85"/><rect y="208" width="400" height="92" fill="url(#s'+id+')"/><path d="M70 300 Q'+(cx-24)+' 210 '+cx+' '+cy+'" stroke="#6b4a2f" stroke-width="7" fill="none" stroke-linecap="round"/>'+fr+'<circle cx="'+cx+'" cy="'+(cy+3)+'" r="4" fill="#5a3b22"/>';};
S.meadow=function(r,v,id){var P=[['#8fc8ee','#e8f4fb','#7fb069','#4f9a4a'],['#f3b6a0','#fde9d6','#a9b86a','#6e9a3f'],['#9cc0f0','#f3ecfa','#85b57a','#4c8f58']][v],cl='',fl='',i;
var cols=['#ffffff','#ffd23f','#ff6b9d','#c77dff','#ff8c42'];
for(i=0;i<4;i++)cl+='<ellipse cx="'+R(20,380,r).toFixed(0)+'" cy="'+R(30,110,r).toFixed(0)+'" rx="'+R(30,60,r).toFixed(0)+'" ry="'+R(7,12,r).toFixed(0)+'" fill="#fff" opacity=".8"/>';
for(i=0;i<110;i++){var y=R(185,305,r),k=(y-185)/120;fl+='<circle cx="'+R(0,400,r).toFixed(0)+'" cy="'+y.toFixed(0)+'" r="'+(1+k*4.5).toFixed(1)+'" fill="'+cols[(r()*cols.length)|0]+'"/>';}
return '<defs>'+grad('a'+id,[P[0],P[1]])+'</defs><rect width="400" height="300" fill="url(#a'+id+')"/>'+cl+'<path d="M-10,320 L-10,170 Q90,130 200,165 T410,150 L410,320Z" fill="'+P[2]+'"/><path d="M-10,320 L-10,200 Q120,165 240,200 T410,185 L410,320Z" fill="'+P[3]+'"/>'+fl;};
S.lake=function(r,v,id){var P=[['#f6c89f','#fbe8cf','#3d4a6b','#e8b79a'],['#9ec3e6','#eef5fb','#4a6a8c','#a9c9e3'],['#d6a3c9','#fbe3ea','#4b3d6b','#e3b9cf']][v];var rg=ridge(r,128,72,.026,7),rp='',i;
for(i=0;i<10;i++)rp+='<rect x="'+R(0,360,r).toFixed(0)+'" y="'+R(190,290,r).toFixed(0)+'" width="'+R(20,70,r).toFixed(0)+'" height="1.5" fill="#fff" opacity=".35"/>';
return '<defs>'+grad('a'+id,[P[0],P[1]])+grad('w'+id,[P[3],P[0]])+'<clipPath id="k'+id+'"><rect y="180" width="400" height="120"/></clipPath></defs><rect width="400" height="300" fill="url(#a'+id+')"/><circle cx="'+R(100,300,r).toFixed(0)+'" cy="82" r="22" fill="#fff7e2" opacity=".9"/><path d="'+rg+'" fill="'+P[2]+'"/><rect y="180" width="400" height="120" fill="url(#w'+id+')"/><g clip-path="url(#k'+id+')" opacity=".55"><path transform="translate(0 360) scale(1 -1)" d="'+rg+'" fill="'+P[2]+'"/></g>'+rp+pines(r,300,9,44,'#10131f');};
S.balloons=function(r,v,id){var C=[['#e63946','#f1faee'],['#ffb703','#023047'],['#8338ec','#ffbe0b'],['#06d6a0','#118ab2'],['#ef476f','#ffd166']],P=[['#3f88d6','#cfe7f6'],['#f08a6c','#ffe2b8'],['#5a6fd6','#f1d6f2']][v],b='',cl='',i;
for(i=0;i<5;i++){var c=C[(i+v)%5],x=R(40,360,r),y=R(50,190,r),s=R(.6,1.3,r);b+='<g transform="translate('+x.toFixed(0)+' '+y.toFixed(0)+') scale('+s.toFixed(2)+')"><path d="M-14 22 L-6 46 L6 46 L14 22Z" fill="'+c[0]+'"/><ellipse rx="23" ry="29" fill="'+c[0]+'"/><ellipse rx="9" ry="29" fill="'+c[1]+'"/><path d="M-6 46 L-5 56 M6 46 L5 56" stroke="#3a2a1a" stroke-width="1"/><rect x="-6" y="56" width="12" height="8" fill="#7a4a2a"/></g>';}
for(i=0;i<5;i++)cl+='<ellipse cx="'+R(0,400,r).toFixed(0)+'" cy="'+R(180,280,r).toFixed(0)+'" rx="'+R(40,80,r).toFixed(0)+'" ry="'+R(8,14,r).toFixed(0)+'" fill="#fff" opacity=".7"/>';
return '<defs>'+grad('a'+id,P)+'</defs><rect width="400" height="300" fill="url(#a'+id+')"/>'+cl+b+'<path d="M-10,320 L-10,272 Q100,250 220,274 T410,262 L410,320Z" fill="#4f8f55"/>';};
S.stars=function(r,v,id){var P=[['#050816','#141a46','#3b2a5e'],['#02121b','#0b3a4a','#2a6a6a'],['#0b0618','#2a1457','#7a3b7a']][v],st='',i;
for(i=0;i<150;i++)st+='<circle cx="'+R(0,400,r).toFixed(0)+'" cy="'+R(0,230,r).toFixed(0)+'" r="'+R(.3,1.3,r).toFixed(2)+'" fill="#fff" opacity="'+R(.4,1,r).toFixed(2)+'"/>';
return '<defs>'+grad('a'+id,P)+'<radialGradient id="m'+id+'"><stop offset="0" stop-color="#cfd8ff" stop-opacity=".35"/><stop offset="1" stop-color="#cfd8ff" stop-opacity="0"/></radialGradient><radialGradient id="f'+id+'"><stop offset="0" stop-color="#ffb45e" stop-opacity=".8"/><stop offset="1" stop-color="#ffb45e" stop-opacity="0"/></radialGradient></defs><rect width="400" height="300" fill="url(#a'+id+')"/><ellipse cx="200" cy="110" rx="260" ry="34" transform="rotate(-28 200 110)" fill="url(#m'+id+')"/>'+st+'<path d="'+ridge(r,238,30,.04,6)+'" fill="#05060d"/><circle cx="200" cy="262" r="62" fill="url(#f'+id+')"/><polygon points="166,284 200,232 234,284" fill="#232a52"/><polygon points="190,284 200,258 210,284" fill="#ffb45e"/>';};
S.harbor=function(r,v,id){var P=[['#f7d6c1','#fdf1e3','#6aa6b8','#2f6f86'],['#bcd8f0','#f4f8fb','#4f8fb0','#215a78'],['#f2b8a2','#ffe9c4','#5a9aa8','#245f73']][v];var HC=['#e07a5f','#f2cc8f','#81b29a','#f4f1de','#3d405b','#e9c46a'],h='',bt='',x=-5,i;
while(x<410){var w=R(22,40,r),ht=R(26,56,r),c=HC[(r()*HC.length)|0];h+='<rect x="'+x.toFixed(0)+'" y="'+(150-ht).toFixed(0)+'" width="'+w.toFixed(0)+'" height="'+ht.toFixed(0)+'" fill="'+c+'"/><polygon points="'+(x-2).toFixed(0)+','+(150-ht).toFixed(0)+' '+(x+w/2).toFixed(0)+','+(136-ht).toFixed(0)+' '+(x+w+2).toFixed(0)+','+(150-ht).toFixed(0)+'" fill="#7a3b2e"/>';x+=w+R(1,4,r);}
for(i=0;i<3;i++){bt+='<g transform="translate('+R(30,300,r).toFixed(0)+' '+R(210,270,r).toFixed(0)+') scale('+R(.8,1.5,r).toFixed(2)+')"><path d="M0 0 H50 L42 13 H9Z" fill="#33415c"/><path d="M24 0 V-46" stroke="#33415c" stroke-width="2"/><polygon points="26,-44 26,-6 48,-6" fill="#f8f4e8"/><polygon points="22,-38 22,-6 6,-6" fill="#f2cc8f"/><rect y="16" width="50" height="2" fill="#fff" opacity=".25"/></g>';}
return '<defs>'+grad('a'+id,[P[0],P[1]])+grad('w'+id,[P[2],P[3]])+'</defs><rect width="400" height="300" fill="url(#a'+id+')"/>'+h+'<rect y="150" width="400" height="150" fill="url(#w'+id+')"/>'+bt;};
function sceneSVG(kind,v,id,seed,aria){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="'+aria+'">'+S[kind](rng(seed),v,id)+'</svg>';}

/* ---------- album content ---------- */
var KINDS=['sunset','stars','meadow','beach','lake','balloons','city','harbor','snow','dunes','sunset','stars'];
var CAPS=['The day I knew','Coffee, and you across the table','Our first trip together','Your laugh, caught mid-air','Slow Sunday, nowhere to be','Dancing in the kitchen','Golden hour, golden you','The night we stayed up talking','Walking home the long way','Holding on, holding hands','Rain on the window, you on the couch','Our favourite place','Candlelight, cheap pizza, perfect','Wrong turn, right person','Sunrise, still awake together','You said yes','Little moments, big love','Home is wherever you are','Stolen kiss on the pier','Still my favourite view'];
var TPL={
 chapter:{n:'Chapter + 2 photos',h:'New chapter',p:[[44,108,372,262,-1,'c',1],[150,432,252,126,1.6,'t',1]]},
 big:{n:'One big photo',p:[[60,64,340,438,-.8,'t',1]]},
 two:{n:'Two photos',p:[[60,48,340,236,-1,'c',1],[60,336,340,218,1,'t',1]]},
 trio:{n:'Three photos',p:[[44,64,372,250,-1.1,'c',1],[44,398,222,140,1.4,'t',1],[292,420,126,130,-2,'c',0]]},
 collage:{n:'Collage of five',p:[[40,56,176,136,-1,'c',0],[248,76,176,136,1.2,'c',1],[50,258,176,136,1.4,'t',0],[238,278,176,136,-1.2,'c',1],[70,458,320,118,.6,'c',0]]},
 letter:{n:'Love letter',h:'My love,',L:'Every day with you feels like my favourite chapter. Thank you for the quiet mornings, the loud laughs, and for making anywhere feel like home.\n\nI’d choose you in every lifetime.',p:[[110,446,240,118,-1.2,'t',1]]}
};
var uid=0,pc=0,pages=[],TXT={},editMode=false,selKey=null,tool='';
var coverPh={key:'cover',kind:'sunset',v:1,seed:4242,svg:null,src:null,pos:'50% 50%'};
var IMGF=['src','kind','v','seed','svg','pos'];
function mk(t,h){var T=TPL[t],id=++uid;
 return {id:id,h:T.h?h||T.h:null,L:T.L||null,ph:T.p.map(function(a){var k=pc++;
  return {key:'p'+id+'_'+k,x:a[0],y:a[1],w:a[2],h:a[3],r:a[4],decor:a[5],hc:a[6],cap:CAPS[k%CAPS.length],date:pad(1+(k*7)%28)+'.'+pad(1+(k*5)%12)+'.26',kind:KINDS[k%12],v:(k*7)%3,seed:k*977+13,svg:null,src:null,pos:'50% 50%'};})};}
['chapter|How we met','two','big','letter|My love,','chapter|Falling for you','collage','trio','big'].forEach(function(x){var q=x.split('|');pages.push(mk(q[0],q[1]));});
function find(key){if(key==='cover')return coverPh;for(var i=0;i<pages.length;i++)for(var j=0;j<pages[i].ph.length;j++)if(pages[i].ph[j].key===key)return pages[i].ph[j];}
function svgFor(sp){if(!sp.svg)sp.svg=sceneSVG(sp.kind,sp.v,'s'+sp.seed,sp.seed,sp.cap||('Photo, '+sp.kind));return sp.svg;}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function ed(id,def,o){o=o||{};var v=TXT[id];if(v==null)v=def;var t=o.t||'span';
 return '<'+t+(o.c?' class="'+o.c+'"':'')+' data-t="'+id+'"'+(o.ml?' data-ml="1"':'')+(o.a?' data-a="1"':'')+(o.s?' style="'+o.s+'"':'')+' contenteditable="'+!!(o.a||editMode)+'" spellcheck="false">'+esc(v)+'</'+t+'>';}
function imgHTML(sp){return sp.src?'<img src="'+media(sp.src)+'" style="object-position:'+sp.pos+'" alt="Our photo" draggable="false">':svgFor(sp);}
function photoHTML(sp){
  var t=sp.decor==='t',deco=t?'<i class="tp tl"></i><i class="tp tr"></i>':'<i class="pc a"></i><i class="pc b"></i><i class="pc c"></i><i class="pc d"></i>';
  var h='<figure class="photo '+(t?'tape':'corners')+(sp.key===selKey?' sel':'')+'" data-key="'+sp.key+'" style="left:'+sp.x+'px;top:'+sp.y+'px;width:'+sp.w+'px;height:'+sp.h+'px;transform:rotate('+sp.r+'deg)"><div class="img">'+imgHTML(sp)+'</div>'+deco+'</figure>';
  if(sp.hc)h+='<div class="cap" style="left:'+(sp.x+4)+'px;top:'+(sp.y+sp.h+(t?15:11))+'px;width:'+(sp.w-8)+'px;transform:rotate('+(sp.r*.4)+'deg)">'+ed('c'+sp.key,sp.cap)+ed('d'+sp.key,sp.date,{t:'small'})+'</div>';
  return h;
}
function pageHTML(pi){
  var pg=pages[pi],h='';
  if(pg.h)h+=ed('h'+pg.id,pg.h,{c:'hd',t:'div',s:'left:44px;top:36px'});
  if(pg.L)h+=ed('l'+pg.id,pg.L,{c:'letter',t:'div',ml:1});
  pg.ph.forEach(function(sp){h+=photoHTML(sp);});
  return h+'<div class="pn '+((pi+1)%2?'r':'l')+'">'+(pi+1)+'</div>';
}
function coverSpec(){return {cls:'cover',html:'<div class="cv-frame"></div><div class="cv-in">'+ed('cvno','OUR LOVE STORY',{c:'cv-no foil',t:'div'})+ed('cvt','Forever',{c:'cv-title foil',t:'h1'})+'<div class="cv-window" data-key="cover"><div class="img">'+imgHTML(coverPh)+'</div></div>'+ed('cvsub','Every moment with you',{c:'cv-sub foil',t:'div'})+'</div>'};}
function plateSpec(){var when=new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});
 return {cls:'endpaper',html:'<div class="plate">'+ed('k','A love story for',{c:'k',t:'div'})+ed('who','Your name',{c:'who',a:1})+ed('when','Begun '+when,{c:'when',t:'div'})+'</div>'};}
function endSpec(){var n=0;pages.forEach(function(p){n+=p.ph.length;});
 return {cls:'pg',html:'<div class="note" style="top:216px;font-size:46px">'+ed('endt','Forever starts here.')+'</div><div class="mono-note" style="top:300px">'+n+' photos &middot; '+pages.length+' pages</div><div class="mono-note" style="top:352px;letter-spacing:.14em;text-transform:none;font-size:11px;padding:0 70px">'+ed('endm','Thank you for every ordinary day that became my favourite memory.',{ml:1})+'</div>'};}
function padSpec(){return {cls:'pg',html:'<div class="note" style="top:280px;opacity:.5;font-size:34px">&hearts;</div>'};}
function backSpec(){return {cls:'cover',html:'<div class="cv-frame"></div><div class="cv-in"><div class="emblem foil"><span>&amp;</span></div><div class="cv-sub foil">Always yours</div></div>'};}
function blankSpec(){return {cls:'pg blank',html:''};}
function makeFace(spec,cls,spine){var f=el('div','face '+cls+' '+spec.cls+' '+spine);f.innerHTML=spec.html+'<div class="shade"></div>';return f;}

/* ---------- build ---------- */
function maxCur(){return mode==='spread'?N:N-1;}
function sides(){var a=[coverSpec(),plateSpec()];pages.forEach(function(p,i){a.push({cls:'pg',html:pageHTML(i)});});a.push(endSpec());if(mode==='spread'&&pages.length%2)a.push(padSpec());a.push(backSpec());return a;}
function build(){
  book.innerHTML='';leaves=[];
  var sp=mode==='spread',SD=sides();
  N=sp?SD.length/2:SD.length;
  var bw=sp?PW*2:PW;
  book.style.width=bw+'px';book.style.height=PH+'px';
  book.classList.toggle('swap',swapMode);book.classList.toggle('edit',editMode);
  shR=el('div','dshadow');shL=el('div','dshadow');
  shR.style.left=(sp?PW:0)+'px';shR.style.width=PW+'px';
  shL.style.left='0px';shL.style.width=PW+'px';
  eR=el('div','edge r');eL=el('div','edge l');
  brR=el('div','brd');brL=el('div','brd');slR=el('div','slab');slL=el('div','slab');
  brR.style.left=(sp?PW:0)+'px';brL.style.left='0px';slR.style.left=(sp?PW:0)+'px';slL.style.left='0px';
  eR.style.left=(sp?PW*2:PW)+'px';eL.style.left='0px';eL.style.transform='translateX(-100%)';
  castR=el('div','cast r');castL=el('div','cast l');
  castR.style.left=(sp?PW:0)+'px';castL.style.left='0px';
  castR.style.zIndex=N+1;castL.style.zIndex=N+1;
  book.append(shR,shL,brL,brR,slL,slR,eR,eL,castR,castL);
  for(var i=0;i<N;i++){
    var L=el('div','leaf');L.style.left=(sp?PW:0)+'px';
    var fs=sp?SD[2*i]:SD[i],bs=sp?SD[2*i+1]:blankSpec();
    L.append(makeFace(fs,'front','sp-l'),makeFace(bs,'back','sp-r'));
    L._a=i<cur?-180:0;L._moving=false;L._raf=0;
    L.style.transform='rotateY('+L._a+'deg)';
    L.style.zIndex=i<cur?i+1:N-i;
    leaves.push(L);book.append(L);
  }
  chrome(lastT);void book.offsetWidth;chrome();
}
function rebuild(){cur=Math.max(0,Math.min(cur,maxCur()));build();updateShift();ui();}
function showPage(i){var q=i+2;cur=mode==='spread'?Math.ceil(q/2):q;}
var lastT=0;
/* page-block thickness grows with the page count and moves from the right stack to the left as pages turn */
function chrome(T0){
  var sp=mode==='spread',sh=sp?N:N/2,T=T0==null?Math.round(36*(1-Math.exp(-sh/9))):T0,
      R=T*(N-cur)/N,L=sp?T*cur/N:0,open=cur>0&&cur<maxCur(),hasR=!sp||cur<N,hasL=sp&&cur>0;
  if(T0==null)lastT=T;
  shR.style.opacity=cur<maxCur()||!sp?1:0;
  shL.style.opacity=sp&&cur>0?1:0;
  eR.style.width=hasR?R*.6+'px':'0px';
  eL.style.width=hasL?L*.6+'px':'0px';
  slR.style.height=(hasR?R:0)+'px';slR.style.opacity=hasR?1:0;
  slL.style.height=(hasL?L:0)+'px';slL.style.opacity=hasL?1:0;
  brR.style.opacity=hasR?1:0;brL.style.opacity=hasL?1:0;
  book.style.setProperty('--ov',(open?5:0)+'px');
  frame.style.setProperty('--tilt',(open?8:15)+'deg');
}
function updateShift(){
  var sw=stage.clientWidth,sh=stage.clientHeight;if(!sw||!sh)return;
  var f0=1,fN=0;
  if(leaves.length){f0=1-Math.abs(leaves[0]._a)/180;fN=Math.abs(leaves[N-1]._a)/180;}
  var vis=PW*(2-f0-fN);
  scale=Math.max(.2,Math.min((sw-16)/(vis+80),(sh-24)/(PH+48),1.4));
  frame.style.width=(vis*scale)+'px';frame.style.height=((PH+48)*scale)+'px';
  book.style.transform='translate('+(-PW*f0*scale).toFixed(2)+'px,0) scale('+scale+')';
}
function relayout(){
  var sw=stage.clientWidth,sh=stage.clientHeight;if(!sw||!sh)return;
  var want=(sw<640||sw/sh<1.15)?'single':'spread';
  if(want!==mode){cur=mapCur(mode,want,cur);mode=want;build();}
  updateShift();ui();
}
function mapCur(f,t,c){var P=pages.length;if(!f||f===t)return c;
  if(t==='single')return c===0?0:c>=Math.ceil((P+4)/2)?P+3:Math.min(2*c,P+2);
  return c===0?0:c>=P+3?Math.ceil((P+4)/2):Math.ceil(c/2);}

/* ---------- flipping ---------- */
function setAngle(i,a){
  var L=leaves[i];L._a=a;
  var sh=Math.sin(Math.abs(a)/180*Math.PI);
  L.style.transform='translateZ('+(sh*110).toFixed(1)+'px) rotateY('+a.toFixed(2)+'deg) skewY('+(sh*-2.2).toFixed(2)+'deg)';
  L.style.setProperty('--sh',sh.toFixed(3));
  if(L._moving){
    var sp=mode==='spread';
    if(!sp){castR.style.opacity=(sh*.55).toFixed(3);castL.style.opacity=0;}
    else if(Math.abs(a)<90){castR.style.opacity=(sh*.6).toFixed(3);castL.style.opacity=0;}
    else{castL.style.opacity=(sh*.6).toFixed(3);castR.style.opacity=0;}
  }
  if(i===0||i===N-1)updateShift();
}
function raise(i){var L=leaves[i];L._moving=true;L.style.zIndex=N+3;}
function settle(i){
  var L=leaves[i];L._moving=false;
  L.style.zIndex=L._a<=-90?i+1:N-i;
  L.style.setProperty('--sh',0);
  if(!leaves.some(function(l){return l._moving;})){castR.style.opacity=0;castL.style.opacity=0;}
  chrome();
}
function animate(i,to,dur,ease){
  var L=leaves[i];cancelAnimationFrame(L._raf);
  var from=L._a,t0=performance.now();
  var d=RM?1:Math.max(220,dur*Math.abs(to-from)/180);
  raise(i);
  function step(now){
    var t=Math.min(1,(now-t0)/d),e=ease==='out'?1-Math.pow(1-t,3):(t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2);
    setAngle(i,from+(to-from)*e);
    if(t<1)L._raf=requestAnimationFrame(step);else{setAngle(i,to);settle(i);}
  }
  L._raf=requestAnimationFrame(step);
}
function flipForward(){if(cur>=maxCur())return;var i=cur;cur++;animate(i,-180,950,'io');ui();sfx();chrome();}
function flipBack(){if(cur<=0)return;cur--;animate(cur,0,950,'io');ui();sfx();chrome();}

/* ---------- drag / swipe ---------- */
var drag=null;
on(book,'pointerdown',function(e){
  if(e.button>0)return;
  if(e.target.closest&&e.target.closest('[contenteditable="true"]'))return;
  drag={id:e.pointerId,x0:e.clientX,y0:e.clientY,ax:0,lastX:e.clientX,lastT:performance.now(),v:0,active:false,idx:-1,dir:0,start:0,target:e.target};
  try{book.setPointerCapture(e.pointerId);}catch(_){}
});
on(book,'pointermove',function(e){
  if(!drag||e.pointerId!==drag.id)return;
  var dx=e.clientX-drag.x0,dy=e.clientY-drag.y0;
  if(!drag.active){
    if(Math.abs(dx)<7||Math.abs(dx)<Math.abs(dy)*.7)return;
    var dir=dx<0?-1:1;
    var idx=dir<0?cur:cur-1;
    if(dir<0&&cur>=maxCur()||dir>0&&cur<=0){drag=null;return;}
    drag.active=true;drag.dir=dir;drag.idx=idx;drag.ax=e.clientX;drag.dist=PW*1.3*scale;
    var L=leaves[idx];cancelAnimationFrame(L._raf);drag.start=L._a;raise(idx);
  }
  var now=performance.now(),dt=Math.max(1,now-drag.lastT);
  drag.v=drag.v*.6+((e.clientX-drag.lastX)/dt)*.4;drag.lastX=e.clientX;drag.lastT=now;
  var a=Math.max(-180,Math.min(0,drag.start+(e.clientX-drag.ax)/drag.dist*180));
  setAngle(drag.idx,a);
});
function endDrag(e,cancel){
  if(!drag||e.pointerId!==drag.id)return;
  var d=drag;drag=null;
  try{book.releasePointerCapture(e.pointerId);}catch(_){}
  if(d.active){
    var L=leaves[d.idx],a=L._a,v=cancel?0:d.v,target;
    if(d.dir<0)target=(a<-60||v<-.5)?-180:0;else target=(a>-120||v>.5)?0:-180;
    if(cancel)target=d.start>-90?0:-180;
    if(d.dir<0&&target===-180){cur++;sfx();}
    if(d.dir>0&&target===0){cur--;sfx();}
    animate(d.idx,target,700,'out');ui();chrome();
    return;
  }
  if(cancel)return;
  if(Math.hypot(e.clientX-d.x0,e.clientY-d.y0)>8)return;
  var fig=d.target.closest&&d.target.closest('[data-key]');
  if(swapMode&&fig){pickPhoto(fig.getAttribute('data-key'));return;}
  if(editMode)return;
  var rect=frame.getBoundingClientRect();
  if(cur===0)flipForward();
  else if(cur>=maxCur())flipBack();
  else if(e.clientX>rect.left+rect.width/2)flipForward();else flipBack();
}
on(book,'pointerup',function(e){endDrag(e,false);});
on(book,'pointercancel',function(e){endDrag(e,true);});
on(book,'dragstart',function(e){e.preventDefault();});
on(book,'keydown',function(e){var t=e.target;if(e.key==='Enter'&&t.hasAttribute&&t.hasAttribute('data-t')&&!t.hasAttribute('data-ml')){e.preventDefault();t.blur();}});
on(book,'paste',function(e){var t=e.target;if(t.isContentEditable){e.preventDefault();document.execCommand('insertText',false,((e.clipboardData||window.clipboardData).getData('text/plain')||'').replace(/\r?\n/g,t.hasAttribute('data-ml')?'\n':' '));}});
on(book,'input',function(e){var t=e.target.closest&&e.target.closest('[data-t]');if(t)TXT[t.getAttribute('data-t')]=t.hasAttribute('data-ml')?t.innerText.replace(/\n$/,''):t.textContent;if(t)changed();});
on(document,'keydown',function(e){
  if(e.target&&e.target.isContentEditable)return;
  if(e.key==='Escape'&&editModeActive){toggleEditMode(false);return;}
  if(e.key==='ArrowRight'||e.key==='PageDown')flipForward();
  else if(e.key==='ArrowLeft'||e.key==='PageUp')flipBack();
});
on(prevBtn,'click',flipBack);
on(nextBtn,'click',flipForward);

/* ---------- tools ---------- */
var editModeBtn=document.getElementById('edit-mode'),editBar=document.getElementById('edit-bar'),editDoneBtn=document.getElementById('edit-done');
var editBtn=document.getElementById('edit'),fillBtn=document.getElementById('fill'),fillIn=document.getElementById('files'),addBtn=document.getElementById('add'),delBtn=document.getElementById('del'),tplSel=document.getElementById('tpl'),delT=0;
var editModeActive=false;
var HINTS={
  '':'Drag, swipe or tap a page to turn it. Arrow keys work too.',
  edit:'Tap any title, caption or message and type. Your words stay when you add pages.',
  swap:'Tap a print to pick it, then tap another to swap them. Tap it twice to choose a photo from your device.',
  mode:'Edit mode is active. Choose an editing tool below to edit text, swap photos, or manage pages.'
};
tplSel.innerHTML=Object.keys(TPL).map(function(k){return '<option value="'+k+'">Layout · '+TPL[k].n+'</option>';}).join('');
function mark(){
  book.querySelectorAll('[data-key]').forEach(function(f){f.classList.toggle('sel',f.getAttribute('data-key')===selKey);});
  if(tool==='swap'&&selKey){
    hint.textContent='Now tap another print to swap, or tap this one again to upload a photo.';
  } else if(tool){
    hint.textContent=HINTS[tool];
  } else if(editModeActive){
    hint.textContent=HINTS.mode;
  } else {
    hint.textContent=HINTS[''];
  }
}
function setTool(t){
  tool=tool===t?'':t;swapMode=tool==='swap';editMode=tool==='edit';selKey=null;
  swapBtn.setAttribute('aria-pressed',swapMode);editBtn.setAttribute('aria-pressed',editMode);
  book.classList.toggle('swap',swapMode);book.classList.toggle('edit',editMode);
  book.querySelectorAll('[data-t]').forEach(function(e){e.contentEditable=editMode||e.hasAttribute('data-a');});
  mark();
}
function toggleEditMode(open){
  editModeActive=typeof open==='boolean'?open:!editModeActive;
  if(editModeBtn){
    editModeBtn.setAttribute('aria-pressed',editModeActive);
    editModeBtn.setAttribute('aria-expanded',editModeActive);
  }
  if(editBar){
    if(editModeActive){
      editBar.removeAttribute('hidden');
      editBar.setAttribute('aria-hidden','false');
    } else {
      editBar.setAttribute('hidden','');
      editBar.setAttribute('aria-hidden','true');
    }
  }
  if(!editModeActive){
    setTool('');
  }
  mark();
}
if(editModeBtn) on(editModeBtn,'click',function(){toggleEditMode();});
if(editDoneBtn) on(editDoneBtn,'click',function(){toggleEditMode(false);});
on(swapBtn,'click',function(){setTool('swap');});
on(editBtn,'click',function(){setTool('edit');});
/* photos auto-fit their frame (cover crop); portraits are framed toward the top so faces stay in view */
function readImg(f){return new Promise(function(ok){var u=URL.createObjectURL(f),im=new Image();im.onload=function(){ok({file:f,src:u,pos:im.naturalHeight>im.naturalWidth*1.1?'50% 30%':'50% 50%'});};im.onerror=function(){ok(null);};im.src=u;});}
function refresh(sp){book.querySelectorAll('[data-key="'+sp.key+'"] .img').forEach(function(b){b.innerHTML=imgHTML(sp);});}
function pickPhoto(key){
  if(!selKey){selKey=key;return mark();}
  if(selKey===key){pendingKey=key;fileIn.value='';fileIn.click();return;}
  var a=find(selKey),b=find(key);IMGF.forEach(function(f){var t=a[f];a[f]=b[f];b[f]=t;});
  selKey=null;refresh(a);refresh(b);mark();changed();
}
on(fileIn,'change',function(){var f=fileIn.files&&fileIn.files[0],sp=pendingKey&&find(pendingKey);if(!f||!sp)return;
  cropImage(f,aspectOf(sp)).then(function(im){if(!im||im.skipped)return;var old={src:sp.src,pos:sp.pos};sp.src=im.src;sp.pos=im.pos;refresh(sp);selKey=null;mark();upload(im.src,im.file,old);});});
on(fillBtn,'click',function(){fillIn.value='';fillIn.click();});
on(fillIn,'change',function(){
  var files=[].slice.call(fillIn.files),n=files.length,k=0,first=-1,slots=[];
  pages.forEach(function(pg,i){pg.ph.forEach(function(sp){if(!sp.src)slots.push([sp,i]);});});
  function finish(){if(first<0)return;selKey=null;showPage(first);rebuild();mark();changed();}
  /* one photo at a time: crop it for the slot it will fill, then place it */
  function run(){
    if(k>=n)return finish();
    var f=files[k++],q=slots[0],np=null;
    if(!q){np=mk('trio');q=[np.ph[0],pages.length];}
    return cropImage(f,aspectOf(q[0]),{label:'Photo '+k+' of '+n,skip:n>1}).then(function(im){
      if(!im)return finish();
      if(im.skipped)return run();
      if(np){pages.push(np);np.ph.slice(1).forEach(function(sp){slots.push([sp,q[1]]);});}else slots.shift();
      q[0].src=im.src;q[0].pos=im.pos;upload(im.src,im.file,{src:null,pos:'50% 50%'});
      if(first<0)first=q[1];
      return run();
    });
  }
  run();
});
on(addBtn,'click',function(){var i=mode==='spread'?2*cur-1:cur-1;i=Math.max(0,Math.min(pages.length,i));pages.splice(i,0,mk(tplSel.value));showPage(i);rebuild();changed();});
function target(){var P=pages.length,i=mode==='spread'?2*cur-2:cur-2;if(mode==='spread'&&i>=P)i=2*cur-3;return i>=0&&i<P?i:-1;}
on(delBtn,'click',function(){var i=target();if(i<0||pages.length<2)return;
  if(!delT){delBtn.textContent='Tap to confirm';delT=setTimeout(ui,2500);return;}
  pages.splice(i,1);showPage(Math.min(i,pages.length-1));rebuild();changed();});

/* ---------- sound ---------- */
var ac=null;
on(soundBtn,'click',function(){soundOn=!soundOn;soundBtn.setAttribute('aria-pressed',soundOn);soundBtn.textContent=soundOn?'Sound on':'Sound off';if(soundOn)sfx();});
function sfx(){
  if(!soundOn)return;
  try{
    ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();
    var d=.4,n=(ac.sampleRate*d)|0,b=ac.createBuffer(1,n,ac.sampleRate),c=b.getChannelData(0);
    for(var i=0;i<n;i++){var t=i/n;c[i]=(Math.random()*2-1)*Math.pow(Math.sin(Math.PI*Math.min(1,t*1.2)),2)*(1-t)*.5;}
    var s=ac.createBufferSource();s.buffer=b;
    var f=ac.createBiquadFilter();f.type='bandpass';f.Q.value=.7;
    f.frequency.setValueAtTime(1100,ac.currentTime);f.frequency.exponentialRampToValueAtTime(4300,ac.currentTime+d);
    var g=ac.createGain();g.gain.value=.55;
    s.connect(f);f.connect(g);g.connect(ac.destination);s.start();
  }catch(_){}
}

/* ---------- ui ---------- */
function ui(){
  var P=pages.length,sp=mode==='spread',t;
  clearTimeout(delT);delT=0;
  prevBtn.disabled=cur<=0;nextBtn.disabled=cur>=maxCur();
  if(cur===0)t='Cover';else if(cur>=maxCur())t='Back cover';
  else{var sl=sp?2*cur-1:cur,sr=sp?2*cur:cur,lo=Math.max(1,sl-1),hi=Math.min(P,sr-1);
    t=hi<1?'Inside cover':lo>hi?'The end':lo===hi?'Page '+lo+' of '+P:'Pages '+lo+'–'+hi+' of '+P;}
  label.textContent=t;
  var i=target();delBtn.disabled=i<0||P<2;delBtn.textContent=i<0?'Remove page':'Remove page '+(i+1);
}

/* ---------- dianthus background ---------- */
var bgEl=document.getElementById('bg'),bgT=0;
var DPAL=[['#f08fae','#f7b6c8','#b8325f'],['#e5557f','#f08aa6','#8f1d46'],['#f9cdd9','#fde6ec','#d9618a'],['#ffffff','#ffe3ec','#e0668f'],['#c93a6a','#e5698f','#6e1233']];
function fringe(x,y,rad,rot){var p='',q,m;for(q=0;q<5;q++){var a0=rot+q*1.2566,d='M'+x.toFixed(1)+','+y.toFixed(1);for(m=0;m<=14;m++){var an=a0-.7+m*.1,rd=rad*(m%2?.86:1);d+='L'+(x+Math.cos(an)*rd).toFixed(1)+','+(y+Math.sin(an)*rd).toFixed(1);}p+=d+'Z';}return p;}
function dianthus(x,y,rad,rot,c){return '<path d="'+fringe(x,y,rad,rot)+'" fill="'+c[0]+'" stroke="#fff" stroke-opacity=".45" stroke-width=".8"/><path d="'+fringe(x,y,rad*.72,rot+.63)+'" fill="'+c[1]+'" stroke="'+c[2]+'" stroke-opacity=".4" stroke-width=".8"/><path d="'+fringe(x,y,rad*.4,rot+.2)+'" fill="'+c[2]+'" fill-opacity=".85"/><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(rad*.07).toFixed(1)+'" fill="#ffe9f0"/>';}
function drawBg(){
  var w=innerWidth,h=innerHeight,m=Math.min(w,h),r=rng(1402),st='',fw='',n=Math.max(12,Math.min(30,Math.round(w*h/28000))),k=0,t=0;
  while(k<n&&t++<800){
    var x=R(-.03,1.03,r)*w,y=R(-.03,1.03,r)*h,dx=(x-w/2)/(w*.4),dy=(y-h/2)/(h*.42);
    if(dx*dx+dy*dy<1)continue;k++;
    var rad=m*R(.05,.1,r),c=DPAL[(r()*5)|0],sw=R(-60,60,r),ex=x+sw,ey=y+R(140,280,r),cx=x-sw*.8,cy=y+(ey-y)*.5,u=.55,
    px=(1-u)*(1-u)*x+2*(1-u)*u*cx+u*u*ex,py=(1-u)*(1-u)*y+2*(1-u)*u*cy+u*u*ey,sc=(rad/45).toFixed(2),tr='translate('+px.toFixed(0)+' '+py.toFixed(0)+') ';
    st+='<path d="M'+x.toFixed(0)+','+y.toFixed(0)+'Q'+cx.toFixed(0)+','+cy.toFixed(0)+' '+ex.toFixed(0)+','+ey.toFixed(0)+'" stroke="#6f9b86" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>'
     +'<path transform="'+tr+'rotate(-140) scale('+sc+')" d="M0,0Q45,-9 100,-16Q50,4 0,0Z" fill="#8cb39c" opacity=".75"/>'
     +'<path transform="'+tr+'rotate(-40) scale('+sc+')" d="M0,0Q45,-9 100,-16Q50,4 0,0Z" fill="#8cb39c" opacity=".75"/>';
    fw+=dianthus(x,y,rad,r()*6.28,c);
  }
  bgEl.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-hidden="true">'+st+fw+'</svg>';
}
on(window,'resize',function(){clearTimeout(bgT);bgT=setTimeout(drawBg,150);});
drawBg();
/* ---------- backend sync: load, validate, debounce-save, upload ---------- */
var dead=false,dirty=false,canSave=false,saving=false,again=false,saveT=0,syncT=0,syncEl=document.getElementById('sync');
function setSync(t,ttl){if(!syncEl)return;clearTimeout(syncT);syncEl.textContent=t;if(ttl)syncT=setTimeout(function(){syncEl.textContent='';},ttl);}
function media(u){return api.mediaUrl(u);}
var cropper=createCropper(document.getElementById('crop'));
/* the cropped frame matches the print's visible area (tape prints have 7px of border) */
function aspectOf(sp){if(sp.key==='cover')return 224/152;var p=sp.decor==='t'?14:0;return Math.max(.2,(sp.w-p)/Math.max(1,sp.h-p));}
function cropImage(f,a,o){return cropper.crop(f,a,o).then(function(im){if(im&&im.error){setSync('Couldn’t read that photo.',4000);return {skipped:true};}return im;});}
function allPh(){var a=[coverPh];pages.forEach(function(p){a=a.concat(p.ph);});return a;}
function strip(s){var o={};Object.keys(s).forEach(function(k){if(k!=='svg')o[k]=s[k];});if(o.src&&o.src.indexOf('blob:')===0)o.src=null;return o;}
function snapshot(){return {v:1,uid:uid,pc:pc,txt:TXT,cover:strip(coverPh),pages:pages.map(function(p){return {id:p.id,h:p.h,L:p.L,ph:p.ph.map(strip)};})};}
function num(x,d){x=Number(x);return isFinite(x)?x:d;}
function okSrc(s){return typeof s==='string'&&/^(https?:\/\/|\/)[^"'<>\s\\]*$/.test(s)?s:null;}
function cleanPh(s,key){s=s||{};return {key:key||(/^\w{1,40}$/.test(s.key)?s.key:'p'+(++uid)+'_'+(pc++)),x:num(s.x,0),y:num(s.y,0),w:num(s.w,100),h:num(s.h,100),r:num(s.r,0),decor:s.decor==='t'?'t':'c',hc:s.hc?1:0,cap:String(s.cap==null?'':s.cap).slice(0,200),date:String(s.date==null?'':s.date).slice(0,40),kind:Object.prototype.hasOwnProperty.call(S,s.kind)?s.kind:'sunset',v:Math.max(0,Math.min(2,num(s.v,0)|0)),seed:num(s.seed,1),svg:null,src:okSrc(s.src),pos:/^\d{1,3}% \d{1,3}%$/.test(s.pos)?s.pos:'50% 50%'};}
function applyRemote(d){
  if(!d||!Array.isArray(d.pages)||!d.pages.length)return;
  var list=d.pages.slice(0,200);
  uid=list.reduce(function(m,p){return Math.max(m,num(p&&p.id,0)|0);},num(d.uid,0)|0);
  pc=num(d.pc,0)|0;
  pages=list.map(function(p){p=p||{};return {id:num(p.id,0)|0,h:p.h==null?null:String(p.h).slice(0,200),L:p.L==null?null:String(p.L).slice(0,4000),ph:(Array.isArray(p.ph)?p.ph:[]).slice(0,12).map(function(s){return cleanPh(s);})};});
  TXT={};if(d.txt&&typeof d.txt==='object')Object.keys(d.txt).forEach(function(k){if(typeof d.txt[k]==='string')TXT[k]=d.txt[k].slice(0,4000);});
  if(d.cover)coverPh=cleanPh(d.cover,'cover');
}
function loadRemote(){
  return api.getAlbum().then(function(d){applyRemote(d);canSave=true;setSync('');}).catch(function(){canSave=false;setSync('Can’t reach the server — changes won’t be saved.');});
}
function changed(){if(!canSave)return;dirty=true;setSync('Unsaved changes…');clearTimeout(saveT);saveT=setTimeout(saveNow,900);}
function saveNow(){
  clearTimeout(saveT);saveT=0;
  if(!canSave||!dirty)return Promise.resolve();
  if(saving){again=true;return Promise.resolve();}
  saving=true;dirty=false;setSync('Saving…');
  return api.saveAlbum(snapshot()).then(function(){if(dirty)setSync('Unsaved changes…');else setSync('Saved',2000);}).catch(function(e){
    dirty=true;
    if(e&&e.status===401){okFlag=false;canSave=false;setSync('');if(!dead)location.hash='login';return;}
    setSync('Couldn’t save — retrying…');saveT=setTimeout(saveNow,5000);
  }).then(function(){saving=false;if(again){again=false;return saveNow();}});
}
/* show the picked photo at once, upload it, then swap in the server URL */
function upload(blobSrc,file,old){
  if(!file)return;
  setSync('Uploading photo…');
  api.uploadPhoto(file).then(function(url){
    allPh().forEach(function(s){if(s.src===blobSrc){s.src=url;refresh(s);}});
    URL.revokeObjectURL(blobSrc);setSync('');changed();
  }).catch(function(){
    allPh().forEach(function(s){if(s.src===blobSrc){s.src=old.src;s.pos=old.pos;refresh(s);}});
    setSync('Photo upload failed.',4000);
  });
}
on(window,'pagehide',function(){if(dirty&&canSave)api.saveAlbum(snapshot(),true).catch(function(){});});

/* ---------- landing → login → album (hash routes) ---------- */
var okFlag=false,shown=false,busy=false;
var envB=document.getElementById('env'),lf=document.getElementById('login'),lerr=document.getElementById('lerr'),lockB=document.getElementById('lock');
function isAuth(){return okFlag;}
function setAuth(v){okFlag=v;}
function route(){
  if(dead)return;
  var v=(location.hash||'').replace('#','');
  if(v!=='login'&&v!=='album')v='welcome';
  if(v==='album'&&!isAuth()){location.replace('#login');return;}
  if(v==='login'&&isAuth()){location.replace('#album');return;}
  document.body.setAttribute('data-view',v);
  if(v==='album'&&!shown){shown=true;lastT=0;cur=0;rebuild();}
  if(v!=='album'){shown=false;toggleEditMode(false);}
  if(v==='login'){setTimeout(function(){envB.classList.remove('open');},700);}
}
on(envB,'click',function(){if(envB.classList.contains('open'))return;envB.classList.add('open');setTimeout(function(){location.hash='login';},RM?150:1900);});
on(lf,'submit',function(e){
  e.preventDefault();if(busy)return;
  var nm=lf.elements.nm.value.trim(),pw=lf.elements.pw.value.trim();
  function fail(m){lerr.textContent=m;lf.classList.remove('shake');void lf.offsetWidth;lf.classList.add('shake');}
  if(!nm)return fail('Please tell me your name first.');
  if(!pw)return fail('Please enter our secret word.');
  busy=true;lerr.textContent='';
  api.login(nm,pw).then(function(){setAuth(true);return loadRemote();}).then(function(){
    if(dead)return;
    if(TXT.who==null){TXT.who=nm;changed();}
    lf.reset();location.hash='album';
  }).catch(function(err){fail(err&&err.status===401?'That isn’t our secret word. Try again.':'Can’t reach the server. Try again in a moment.');}).then(function(){busy=false;});
});
on(document.getElementById('lback'),'click',function(){location.hash='welcome';});
on(lockB,'click',function(){toggleEditMode(false);saveNow().catch(function(){}).then(function(){return api.logout().catch(function(){});}).then(function(){setAuth(false);canSave=false;setSync('');lf.reset();location.hash='welcome';});});
on(window,'hashchange',route);
on(window,'resize',relayout);
var ro=null;if(window.ResizeObserver){ro=new ResizeObserver(relayout);ro.observe(stage);}
relayout();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(relayout);
api.me().then(function(ok){if(!ok||dead)return;setAuth(true);return loadRemote();}).catch(function(){}).then(route);
return function cleanup(){dead=true;cropper.dispose();clearTimeout(saveT);clearTimeout(syncT);if(dirty&&canSave)api.saveAlbum(snapshot(),true).catch(function(){});_off.forEach(function(f){f();});if(ro)ro.disconnect();clearTimeout(bgT);clearTimeout(delT);document.body.removeAttribute('data-view');};
}
