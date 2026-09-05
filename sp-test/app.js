(()=>{
const VERSION="19";
const C=[L,R], MAX=Math.PI/6, T=Math.PI*2;
let tx=0,ty=0,ax=0,ay=0,rg=0,rb=0,bg=0,bb=0,have=0,drag=0,lx=0,ly=0;
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)), fr=v=>v-Math.floor(v);

function hsv(h,s=.9,v=1,a=1){
  h=fr(h)*6;let i=h|0,f=h-i,p=v*(1-s),q=v*(1-s*f),t=v*(1-s*(1-f));
  let c=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
  return `rgba(${c[0]*255|0},${c[1]*255|0},${c[2]*255|0},${a})`;
}
function rot(p){let[X,Y,Z]=p,cy=Math.cos(ax),sy=Math.sin(ax),x=cy*X+sy*Z,z=-sy*X+cy*Z,cx=Math.cos(ay),sx=Math.sin(ay);return[x,cx*Y-sx*z,sx*Y+cx*z]}
function pr(p,w,h,e){let z=p[2]+3.5,f=Math.min(w,h)*1.28;return[w/2+(p[0]+e*.035)*f/z,h/2-p[1]*f/z]}

/* front outline:
   wide hook, short lower stem, thick graphic construction.
   no bevel, no taper. */
function qp(g){
  g.beginPath();
  g.moveTo(-.48,.48);
  g.bezierCurveTo(-.50,.77,-.23,.95,.10,.92);
  g.bezierCurveTo(.44,.89,.66,.70,.64,.43);
  g.bezierCurveTo(.62,.22,.49,.10,.30,-.02);
  g.bezierCurveTo(.11,-.14,.02,-.23,.02,-.38);
  g.lineTo(-.23,-.38);
  g.bezierCurveTo(-.23,-.08,-.08,.08,.12,.20);
  g.bezierCurveTo(.25,.28,.32,.36,.30,.45);
  g.bezierCurveTo(.28,.57,.15,.63,.00,.63);
  g.bezierCurveTo(-.15,.63,-.25,.56,-.25,.44);
  g.bezierCurveTo(-.25,.34,-.20,.25,-.10,.19);
  g.lineTo(-.28,.04);
  g.bezierCurveTo(-.42,.13,-.49,.28,-.48,.48);
  g.closePath();
}

/* fixed inclusion population: TEST17 direction kept */
let seed=81173,RN=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646},P=[];
for(let i=0;i<250;i++){
  let X,Y,Z;
  do{X=RN()*1.72-.86;Y=RN()*1.72-.86;Z=RN()*1.72-.86}
  while(X*X+Y*Y+Z*Z>.72);
  let u=RN();
  let r=u<.72?1.55+RN()*.55:(u<.95?2.5+RN()*1.0:4.0+RN()*1.8);
  P.push({p:[X,Y,Z],r,h:RN(),x:(RN()*2-1)*MAX,y:(RN()*2-1)*MAX,w:.020+RN()*.050});
}

/* dynamic shell:
   clear center + broad low-contrast 2D aurora patches in the milky rim.
   highlights have crisp boundaries and move with viewpoint. */
function shell(g,w,h,e){
  let cx=w*.5,cy=h*.5,R=Math.min(w,h)*.44;
  let eyePhase=e*.022; // slight LR optical phase difference

  g.save();
  g.beginPath();g.arc(cx,cy,R,0,T);g.clip();

  // faint dark body
  let base=g.createRadialGradient(cx,cy,R*.05,cx,cy,R);
  base.addColorStop(0,"rgba(0,0,0,0)");
  base.addColorStop(.60,"rgba(10,12,18,.02)");
  base.addColorStop(.83,"rgba(95,105,125,.08)");
  base.addColorStop(1,"rgba(160,170,195,.18)");
  g.fillStyle=base;g.fillRect(cx-R,cy-R,R*2,R*2);

  // aurora-sheet patches: intentionally large and gentle
  const blobs=[
    [-.62,-.52,.46,.24],[.03,-.70,.92,.22],[.62,-.33,.55,.20],
    [-.63,.40,.60,.19],[.02,.68,.15,.25],[.64,.50,.80,.21]
  ];
  for(let i=0;i<blobs.length;i++){
    let [bx,by,ph,op]=blobs[i];
    let shiftX=Math.sin(ax*2.1+i*.8+eyePhase*8)*R*.08;
    let shiftY=Math.cos(ay*2.0+i*.7-eyePhase*6)*R*.07;
    let x=cx+bx*R+shiftX,y=cy+by*R+shiftY;
    let rr=R*(.78+(i%2)*.09);
    let gr=g.createRadialGradient(x,y,0,x,y,rr);
    let hp=ph + ax*.23 + ay*.10 + eyePhase;
    gr.addColorStop(0,hsv(hp,.52,.95,op));
    gr.addColorStop(.48,hsv(hp+.08,.40,.95,op*.52));
    gr.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=gr;g.fillRect(cx-R,cy-R,R*2,R*2);
  }
  g.restore();

  // colored rim, not white
  g.save();
  g.beginPath();g.arc(cx,cy,R,0,T);
  g.lineWidth=R*.050;
  let rim=g.createLinearGradient(cx-R,cy-R,cx+R,cy+R);
  let rp=ax*.20+ay*.08+eyePhase;
  rim.addColorStop(0,hsv(.46+rp,.55,.94,.70));
  rim.addColorStop(.30,hsv(.88+rp,.46,.95,.56));
  rim.addColorStop(.63,hsv(.58+rp,.48,.95,.52));
  rim.addColorStop(1,hsv(.12+rp,.54,.95,.70));
  g.strokeStyle=rim;g.stroke();
  g.restore();

  // crisp window-like highlight, viewpoint-driven
  let hx=cx-R*.50 + (ax/MAX)*R*.22 + e*R*.012;
  let hy=cy-R*.56 + (ay/MAX)*R*.18;
  g.save();
  g.translate(hx,hy);
  g.rotate(-.20 + ax*.34);
  g.fillStyle="rgba(255,255,255,.72)";
  g.fillRect(-R*.15,-R*.045,R*.29,R*.075);
  g.fillRect(-R*.13,R*.045,R*.19,R*.035);
  g.restore();

  // compact sharp secondary highlight
  let sx=cx+R*.58-(ax/MAX)*R*.16, sy=cy-R*.50-(ay/MAX)*R*.12;
  g.save();
  g.translate(sx,sy);
  g.rotate(.20-ay*.4);
  g.fillStyle="rgba(255,255,255,.78)";
  g.fillRect(-R*.042,-R*.022,R*.084,R*.044);
  g.restore();
}

function inc(g,w,h,e){
  g.save();
  g.beginPath();g.arc(w*.5,h*.5,Math.min(w,h)*.42,0,T);g.clip();
  g.globalCompositeOperation="lighter";
  let lr=e*.018; // slight left/right hue phase
  for(let a of P){
    let p=pr(rot(a.p),w,h,e);
    let dx=ax-a.x,dy=ay-a.y,d=Math.hypot(dx,dy);
    let f=Math.exp(-d*d/(2*a.w*a.w));
    let r=Math.max(1.0,a.r*w/430);
    g.globalAlpha=.24+f*.62;
    g.fillStyle=hsv(a.h+(ax/MAX)*.12+(ay/MAX)*.07+lr,.62,.98);
    g.beginPath();g.arc(p[0],p[1],r,0,T);g.fill();

    let glow=r*(1.55+f*2.0);
    let gr=g.createRadialGradient(p[0],p[1],0,p[0],p[1],glow);
    gr.addColorStop(0,"rgba(255,255,255,.94)");
    gr.addColorStop(.16,`rgba(255,255,255,${.30+.40*f})`);
    gr.addColorStop(1,"rgba(255,255,255,0)");
    g.globalAlpha=.18+f*.50;g.fillStyle=gr;
    g.beginPath();g.arc(p[0],p[1],glow,0,T);g.fill();
  }
  g.restore();
}

/* Opaque holographic B-rep-like question.
   Front plane = one uniform color.
   Extrusion is straight: same 2D shape at front/back, no bulge/bevel/taper.
   Front/back boundaries both carry thick holo edge lines. */
function ques(g,w,h,e){
  const hue=fr(.10+(ax/MAX)*.72+(ay/MAX)*.43+e*.022);
  const S=Math.min(w,h)*.31/1.45;
  const zBack=-.16,zFront=.16;
  const back=pr(rot([0,0,zBack]),w,h,e), front=pr(rot([0,0,zFront]),w,h,e);
  const stemW=.25*S;
  const edgeW=stemW*.08;

  // side body: many identical silhouettes, same U-gradient phase through depth
  const slices=22;
  for(let k=0;k<slices;k++){
    let t=k/(slices-1), z=zBack+(zFront-zBack)*t, q=pr(rot([0,0,z]),w,h,e);
    g.save();g.translate(q[0],q[1]);g.scale(S,-S);
    let ug=g.createConicGradient(-Math.PI*.62+(ax/MAX)*.90-(ay/MAX)*.24,-.02,.40);
    let phase=fr(hue+.08);
    for(let j=0;j<=14;j++){let u=j/14;ug.addColorStop(u,hsv(phase+u*.92,.92,.78));}
    g.fillStyle=ug;qp(g);g.fill();g.restore();
  }

  // rear boundary / B-rep edge
  g.save();g.translate(back[0],back[1]);g.scale(S,-S);
  qp(g);g.lineWidth=edgeW/S;g.strokeStyle=hsv(hue+.43,.94,.70);g.stroke();g.restore();

  // front plane is opaque and UNIFORM
  g.save();g.translate(front[0],front[1]);g.scale(S,-S);
  qp(g);g.fillStyle=hsv(hue,.90,.96);g.fill();
  g.lineWidth=edgeW/S;g.strokeStyle=hsv(hue+.18,.96,.66);g.stroke();g.restore();

  // dot = straight cylinder; diameter = 1.2 x stem width; depth = same as diameter.
  const dotD=stemW*1.2, rr=dotD*.5;
  const y0=-.60;
  const db=pr(rot([0,y0,zBack]),w,h,e), df=pr(rot([0,y0,zFront]),w,h,e);

  // cylinder side as tangent quad
  let vx=df[0]-db[0],vy=df[1]-db[1],vl=Math.hypot(vx,vy)||1;
  let px=-vy/vl*rr,py=vx/vl*rr;
  g.beginPath();
  g.moveTo(db[0]+px,db[1]+py);g.lineTo(df[0]+px,df[1]+py);
  g.lineTo(df[0]-px,df[1]-py);g.lineTo(db[0]-px,db[1]-py);g.closePath();
  g.fillStyle=hsv(hue+.34,.92,.76);g.fill();

  // rear edge
  g.beginPath();g.arc(db[0],db[1],rr,0,T);
  g.lineWidth=edgeW;g.strokeStyle=hsv(hue+.43,.94,.70);g.stroke();

  // front face uniform + edge
  g.beginPath();g.arc(df[0],df[1],rr,0,T);
  g.fillStyle=hsv(hue,.90,.96);g.fill();
  g.lineWidth=edgeW;g.strokeStyle=hsv(hue+.18,.96,.66);g.stroke();
}

function setup(c,e){
  let g=c.getContext("2d",{alpha:false,desynchronized:true});
  return ()=>{
    let d=Math.min(devicePixelRatio||1,1.5),w=c.clientWidth*d|0,h=c.clientHeight*d|0;
    if(c.width!=w||c.height!=h){c.width=w;c.height=h}
    g.fillStyle="#050507";g.fillRect(0,0,w,h);
    shell(g,w,h,e);
    inc(g,w,h,e);
    ques(g,w,h,e);

    // version burned into the actual rendered holo image
    g.save();
    g.font=`600 ${Math.max(9,w*.032)}px -apple-system,sans-serif`;
    g.textAlign="right";g.textBaseline="bottom";
    g.fillStyle="rgba(255,255,255,.58)";
    g.fillText("V"+VERSION,w*.965,h*.965);
    g.restore();
  };
}
let D=[setup(C[0],-1),setup(C[1],1)];

function loop(){ax+=(tx-ax)*.34;ay+=(ty-ay)*.34;D[0]();D[1]();requestAnimationFrame(loop)}loop();

function orient(e){
  if(drag)return;
  rg=e.gamma||0;rb=e.beta||0;
  if(!have){bg=rg;bb=rb;have=1}
  tx=cl((rg-bg)*Math.PI/180,-MAX,MAX);
  ty=cl((rb-bb)*Math.PI/180,-MAX,MAX);
}
motion.onclick=async()=>{
  try{
    if(typeof DeviceOrientationEvent.requestPermission==="function"&&await DeviceOrientationEvent.requestPermission()!="granted")return;
    addEventListener("deviceorientation",orient,true);motion.textContent="TILT ACTIVE";
  }catch(e){}
};
reset.onclick=()=>{if(have){bg=rg;bb=rb}tx=ty=ax=ay=0};
addEventListener("deviceorientation",orient,true);

C.forEach(c=>{
  c.onpointerdown=e=>{drag=1;lx=e.clientX;ly=e.clientY};
  c.onpointermove=e=>{
    if(!drag)return;
    tx=cl(tx+(e.clientX-lx)/260,-MAX,MAX);
    ty=cl(ty+(e.clientY-ly)/260,-MAX,MAX);
    lx=e.clientX;ly=e.clientY;
  };
  c.onpointerup=c.onpointercancel=()=>drag=0;
});
})();