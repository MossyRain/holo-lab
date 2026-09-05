(()=>{
const VERSION="21";
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
  /* TEST20: Toppan-Bunkyu-Midashi-Gothic-EB-like proportions, not a font glyph.
     Broad horizontal hook, heavy stroke, short terminal stem. */
  g.beginPath();
  // outer silhouette, clockwise from lower-left of hook
  g.moveTo(-.52,.34);
  g.bezierCurveTo(-.52,.73,-.22,.94,.17,.94);
  g.bezierCurveTo(.56,.94,.79,.72,.79,.43);
  g.bezierCurveTo(.79,.18,.64,.02,.42,-.11);
  g.bezierCurveTo(.25,-.21,.17,-.28,.17,-.40);
  g.lineTo(-.12,-.40);
  g.bezierCurveTo(-.12,-.13,.03,.03,.24,.16);
  g.bezierCurveTo(.38,.25,.45,.33,.45,.43);
  g.bezierCurveTo(.45,.57,.33,.65,.15,.65);
  g.bezierCurveTo(-.04,.65,-.17,.56,-.17,.40);
  g.bezierCurveTo(-.17,.29,-.12,.20,-.01,.13);
  // inner return makes the hook thick and graphic rather than tubular
  g.lineTo(-.25,-.02);
  g.bezierCurveTo(-.43,.08,-.52,.20,-.52,.34);
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
  let eyePhase=e*.026;

  g.save();
  g.beginPath();g.arc(cx,cy,R,0,T);g.clip();

  // Transparent core + softly milky shell body. Avoid a white/gray glass-ball read.
  let base=g.createRadialGradient(cx,cy,R*.08,cx,cy,R);
  base.addColorStop(0,"rgba(5,7,12,.00)");
  base.addColorStop(.45,"rgba(3,5,10,.00)");
  base.addColorStop(.68,"rgba(16,20,30,.025)");
  base.addColorStop(.82,"rgba(80,94,118,.055)");
  base.addColorStop(1,"rgba(140,155,184,.095)");
  g.fillStyle=base;g.fillRect(cx-R,cy-R,R*2,R*2);

  // Broad 2D aurora-sheet fields. Large, low-contrast patches rather than a rainbow rim.
  const blobs=[
    [-.60,-.52,.42,.34,1.05],[.02,-.72,.94,.31,1.15],[.66,-.35,.55,.30,.95],
    [-.68,.42,.62,.30,1.02],[-.04,.70,.12,.34,1.18],[.65,.54,.82,.29,1.00]
  ];
  for(let i=0;i<blobs.length;i++){
    let [bx,by,ph,op,sz]=blobs[i];
    let x=cx+bx*R+Math.sin(ax*1.7+i*.91+eyePhase*7)*R*.10;
    let y=cy+by*R+Math.cos(ay*1.6+i*.73-eyePhase*5)*R*.09;
    let rr=R*sz;
    let gr=g.createRadialGradient(x,y,0,x,y,rr);
    let hp=ph+ax*.16+ay*.09+eyePhase;
    gr.addColorStop(0,hsv(hp,.34,.98,op));
    gr.addColorStop(.38,hsv(hp+.055,.28,.98,op*.70));
    gr.addColorStop(.72,hsv(hp+.11,.30,.97,op*.36));
    gr.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=gr;g.fillRect(cx-R,cy-R,R*2,R*2);
  }

  // A faint complementary wash across the sphere keeps the aurora from reading only as an outline.
  let wash=g.createLinearGradient(cx-R*.9,cy-R*.8,cx+R*.85,cy+R*.75);
  let wp=ax*.12-ay*.08+eyePhase;
  wash.addColorStop(0,hsv(.46+wp,.38,.98,.085));
  wash.addColorStop(.36,hsv(.92+wp,.34,.98,.070));
  wash.addColorStop(.70,hsv(.63+wp,.36,.98,.072));
  wash.addColorStop(1,hsv(.13+wp,.36,.98,.080));
  g.fillStyle=wash;g.fillRect(cx-R,cy-R,R*2,R*2);

  // TEST21: large area-light reflections projected onto the sphere.
  // Crisp boundaries, but curved/foreshortened so they cannot read as paper rectangles.
  function windowPatch(nx,ny,ww,hh,skew,alpha){
    const vx=(ax/MAX)*.20 + e*.012, vy=(ay/MAX)*.16;
    let x=cx+(nx+vx)*R, y=cy+(ny+vy)*R;
    // local sphere foreshortening: stronger toward rim
    let rr=Math.hypot((x-cx)/R,(y-cy)/R), fo=Math.sqrt(Math.max(.16,1-rr*rr));
    let W=ww*R*fo, H=hh*R*(.70+.30*fo);
    g.save();g.translate(x,y);g.rotate(skew+ax*.22-ay*.12);
    let tint=hsv(.52+ax*.08-ay*.05+eyePhase,.10,1,alpha);
    g.fillStyle=tint;
    // curved quadrilateral, representing a rectangular softbox/window on a sphere
    g.beginPath();
    g.moveTo(-W*.55,-H*.46);
    g.quadraticCurveTo(0,-H*.62,W*.55,-H*.38);
    g.lineTo(W*.48,H*.42);
    g.quadraticCurveTo(0,H*.27,-W*.50,H*.48);
    g.closePath();g.fill();
    g.restore();
  }
  windowPatch(-.48,-.54,.48,.15,-.16,.68);
  windowPatch(-.45,-.39,.30,.075,-.16,.50);
  windowPatch(.54,-.48,.18,.075,.16,.58);
  g.restore();

  // Thin colored optical edge only; aurora itself lives on the shell surface above.
  g.save();g.beginPath();g.arc(cx,cy,R,0,T);g.lineWidth=R*.018;
  let rim=g.createLinearGradient(cx-R,cy-R,cx+R,cy+R),rp=ax*.18+ay*.07+eyePhase;
  rim.addColorStop(0,hsv(.46+rp,.48,.96,.52));
  rim.addColorStop(.34,hsv(.90+rp,.42,.96,.45));
  rim.addColorStop(.68,hsv(.59+rp,.44,.96,.42));
  rim.addColorStop(1,hsv(.13+rp,.46,.96,.50));
  g.strokeStyle=rim;g.stroke();g.restore();
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
  const hue=fr(.10+(ax/MAX)*.72+(ay/MAX)*.43+e*.030);
  // TEST20: ~1.2x TEST19 apparent size.
  const S=Math.min(w,h)*.372/1.45;
  // straight extrusion; no bevel and no taper
  const zBack=-.18,zFront=.18;
  const back=pr(rot([0,0,zBack]),w,h,e), front=pr(rot([0,0,zFront]),w,h,e);
  const stemW=.29*S;
  const edgeW=stemW*.08;

  // Rear B-rep boundary FIRST, so solid side/front geometry correctly occludes hidden portions.
  g.save();g.translate(back[0],back[1]);g.scale(S,-S);g.transform(1,0,-.10,1,0,0);
  qp(g);g.lineJoin="round";g.lineCap="round";g.lineWidth=edgeW/S;
  g.strokeStyle=hsv(hue+.43,.92,.72);g.stroke();g.restore();

  // Straight side extrusion. U-like color variation is carried along the silhouette,
  // while each visible local face reads as a solid holo color rather than transparent plastic.
  const slices=28;
  for(let k=0;k<slices;k++){
    let t=k/(slices-1),z=zBack+(zFront-zBack)*t,q=pr(rot([0,0,z]),w,h,e);
    g.save();g.translate(q[0],q[1]);g.scale(S,-S);g.transform(1,0,-.10,1,0,0);
    let ug=g.createLinearGradient(-.58,.10,.78,.10);
    let phase=fr(hue+.12+(ax/MAX)*.10);
    ug.addColorStop(0,hsv(phase+.00,.91,.82));
    ug.addColorStop(.28,hsv(phase+.18,.92,.80));
    ug.addColorStop(.56,hsv(phase+.38,.92,.80));
    ug.addColorStop(.80,hsv(phase+.60,.92,.80));
    ug.addColorStop(1,hsv(phase+.82,.91,.82));
    g.fillStyle=ug;qp(g);g.fill();g.restore();
  }

  // Front plane: one uniform opaque holo color at any instant.
  g.save();g.translate(front[0],front[1]);g.scale(S,-S);g.transform(1,0,-.10,1,0,0);
  qp(g);g.fillStyle=hsv(hue,.90,.96);g.fill();
  g.lineJoin="round";g.lineCap="round";g.lineWidth=edgeW/S;
  g.strokeStyle=hsv(hue+.18,.95,.66);g.stroke();g.restore();

  // Dot: diameter 1.2x stem width, depth equals its diameter in the same object scale.
  const dotD=stemW*1.2,rr=dotD*.5;
  const y0=-.68;
  // make extrusion depth of dot visually/structurally equal to its diameter
  const dz=(dotD/S)*.5;
  const db=pr(rot([0,y0,-dz]),w,h,e),df=pr(rot([0,y0,dz]),w,h,e);
  let vx=df[0]-db[0],vy=df[1]-db[1],vl=Math.hypot(vx,vy)||1;
  let px=-vy/vl*rr,py=vx/vl*rr;

  // rear circular B-rep edge first
  g.beginPath();g.arc(db[0],db[1],rr,0,T);g.lineWidth=edgeW;
  g.strokeStyle=hsv(hue+.43,.92,.72);g.stroke();

  // opaque cylindrical side
  g.beginPath();g.moveTo(db[0]+px,db[1]+py);g.lineTo(df[0]+px,df[1]+py);
  g.lineTo(df[0]-px,df[1]-py);g.lineTo(db[0]-px,db[1]-py);g.closePath();
  let dg=g.createLinearGradient(db[0]-rr,db[1],db[0]+rr,db[1]);
  dg.addColorStop(0,hsv(hue+.12,.92,.80));dg.addColorStop(.5,hsv(hue+.43,.92,.78));dg.addColorStop(1,hsv(hue+.72,.92,.80));
  g.fillStyle=dg;g.fill();

  // front face uniform + explicit boundary
  g.beginPath();g.arc(df[0],df[1],rr,0,T);g.fillStyle=hsv(hue,.90,.96);g.fill();
  g.lineWidth=edgeW;g.strokeStyle=hsv(hue+.18,.95,.66);g.stroke();
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