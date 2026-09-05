(()=>{
const VERSION="24";
const C=[L,R], MAX=Math.PI/6, T=Math.PI*2;
let tx=0,ty=0,ax=0,ay=0,rg=0,rb=0,bg=0,bb=0,have=0,drag=0,lx=0,ly=0;
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)), fr=v=>v-Math.floor(v);

function hsv(h,s=.9,v=1,a=1){
  h=fr(h)*6;let i=h|0,f=h-i,p=v*(1-s),q=v*(1-s*f),t=v*(1-s*(1-f));
  let c=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
  return `rgba(${c[0]*255|0},${c[1]*255|0},${c[2]*255|0},${a})`;
}
function rot(p){let[X,Y,Z]=p,cy=Math.cos(ax),sy=Math.sin(ax),x=cy*X+sy*Z,z=-sy*X+cy*Z,cx=Math.cos(ay),sx=Math.sin(ay);return[x,cx*Y-sx*z,sx*Y+cx*z]}
function rotQ(p){
  // TEST23: the whole ? (hook AND dot) shares one actual 3D orientation.
  // A small neutral pose exposes extrusion without exceeding the ±30° stereo comfort range.
  const yaw=ax+0.14, pitch=ay-0.09;
  let[X,Y,Z]=p,cy=Math.cos(yaw),sy=Math.sin(yaw),x=cy*X+sy*Z,z=-sy*X+cy*Z,cx=Math.cos(pitch),sx=Math.sin(pitch);
  return[x,cx*Y-sx*z,sx*Y+cx*z];
}
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

  // The aurora IS the shell appearance. There is no independent milky-white layer.
  // Its opacity is derived from sphere curvature: face-on center -> transparent,
  // grazing outer surface -> increasingly visible.
  const off=document.createElement("canvas"); off.width=w; off.height=h;
  const o=off.getContext("2d");
  o.save();o.beginPath();o.arc(cx,cy,R,0,T);o.clip();

  // Broad, low-frequency 2D aurora-sheet color fields.
  const blobs=[
    [-.60,-.52,.42,.50,1.12],[.02,-.72,.94,.46,1.20],[.66,-.35,.55,.44,1.05],
    [-.68,.42,.62,.46,1.10],[-.04,.70,.12,.50,1.24],[.65,.54,.82,.44,1.08]
  ];
  for(let i=0;i<blobs.length;i++){
    let [bx,by,ph,op,sz]=blobs[i];
    let x=cx+bx*R+Math.sin(ax*1.7+i*.91+eyePhase*7)*R*.10;
    let y=cy+by*R+Math.cos(ay*1.6+i*.73-eyePhase*5)*R*.09;
    let rr=R*sz;
    let gr=o.createRadialGradient(x,y,0,x,y,rr);
    let hp=ph+ax*.16+ay*.09+eyePhase;
    gr.addColorStop(0,hsv(hp,1.00,.98,op));
    gr.addColorStop(.38,hsv(hp+.055,1.00,.98,op*.78));
    gr.addColorStop(.72,hsv(hp+.11,1.00,.97,op*.44));
    gr.addColorStop(1,"rgba(0,0,0,0)");
    o.fillStyle=gr;o.fillRect(cx-R,cy-R,R*2,R*2);
  }
  let wash=o.createLinearGradient(cx-R*.9,cy-R*.8,cx+R*.85,cy+R*.75);
  let wp=ax*.12-ay*.08+eyePhase;
  wash.addColorStop(0,hsv(.46+wp,1.00,.98,.15));
  wash.addColorStop(.36,hsv(.92+wp,1.00,.98,.13));
  wash.addColorStop(.70,hsv(.63+wp,1.00,.98,.13));
  wash.addColorStop(1,hsv(.13+wp,1.00,.98,.15));
  o.fillStyle=wash;o.fillRect(cx-R,cy-R,R*2,R*2);
  o.restore();

  // Curvature opacity mask. r/R = sin(theta), theta is the angle between
  // the local shell normal and the viewing direction. This is intentionally
  // NOT a simple linear radial fade.
  o.globalCompositeOperation="destination-in";
  const mask=o.createImageData(w,h), d=mask.data;
  for(let y=Math.max(0,(cy-R)|0);y<Math.min(h,(cy+R+1)|0);y++){
    for(let x=Math.max(0,(cx-R)|0);x<Math.min(w,(cx+R+1)|0);x++){
      let nx=(x-cx)/R, ny=(y-cy)/R, r=Math.hypot(nx,ny);
      if(r>1) continue;
      let theta=Math.asin(cl(r,0,1))/(Math.PI/2); // 0 center -> 1 rim
      // broad transparent center, then smooth curvature-driven rise
      let q=cl((theta-.16)/.84,0,1);
      let a=q*q*(3-2*q);
      let k=(y*w+x)*4; d[k]=d[k+1]=d[k+2]=255; d[k+3]=(a*255)|0;
    }
  }
  const mc=document.createElement("canvas");mc.width=w;mc.height=h;
  mc.getContext("2d").putImageData(mask,0,0);
  o.drawImage(mc,0,0);
  o.globalCompositeOperation="source-over";
  g.drawImage(off,0,0);

  // Sphere-surface highlight patch. Defined by latitude/longitude-like coordinates
  // around a local pole; projection alone bends and foreshortens the rectangular source.
  function sphPoint(lon,lat,poleLon,poleLat){
    // local patch around +Z, then rotate its pole on the sphere
    let x=Math.sin(lon)*Math.cos(lat), y=Math.sin(lat), z=Math.cos(lon)*Math.cos(lat);
    // pitch around X
    let cp=Math.cos(poleLat),sp=Math.sin(poleLat);
    let y1=cp*y-sp*z,z1=sp*y+cp*z;
    // yaw around Y
    let cyy=Math.cos(poleLon),syy=Math.sin(poleLon);
    return [cyy*x+syy*z1,y1,-syy*x+cyy*z1];
  }
  function projSphere(p){return[cx+p[0]*R,cy-p[1]*R,p[2]]}
  function highlightPatch(pLon,pLat,lonHalf,latHalf,alpha){
    // viewpoint moves the reflection pole across the sphere
    pLon += ax*.72 + e*.018;
    pLat += ay*.62;
    const N=12, pts=[];
    // boundary: top, right, bottom, left in local lon/lat coordinates
    for(let i=0;i<=N;i++) pts.push(sphPoint(-lonHalf+2*lonHalf*i/N, latHalf,pLon,pLat));
    for(let i=1;i<=N;i++) pts.push(sphPoint(lonHalf,latHalf-2*latHalf*i/N,pLon,pLat));
    for(let i=1;i<=N;i++) pts.push(sphPoint(lonHalf-2*lonHalf*i/N,-latHalf,pLon,pLat));
    for(let i=1;i<N;i++) pts.push(sphPoint(-lonHalf,-latHalf+2*latHalf*i/N,pLon,pLat));
    // hide patches that have moved entirely behind the visible hemisphere
    if(!pts.some(p=>p[2]>0)) return;
    g.save();g.beginPath();
    let first=true;
    for(let p of pts){if(p[2]<=0) continue;let q=projSphere(p);if(first){g.moveTo(q[0],q[1]);first=false}else g.lineTo(q[0],q[1])}
    if(first){g.restore();return}g.closePath();
    // slightly tinted area-light reflection, crisp boundary, not paper-white
    g.fillStyle=hsv(.50+ax*.06-ay*.04+eyePhase,.10,1,alpha);g.fill();g.restore();
  }
  highlightPatch(-.56,.20,.045,.225,.60);
  highlightPatch(-.47,.10,.026,.125,.34);
  highlightPatch(.48,.30,.024,.105,.42);

  // Thin optical boundary only.
  g.save();g.beginPath();g.arc(cx,cy,R,0,T);g.lineWidth=R*.014;
  let rim=g.createLinearGradient(cx-R,cy-R,cx+R,cy+R),rp=ax*.18+ay*.07+eyePhase;
  rim.addColorStop(0,hsv(.46+rp,.52,.96,.54));
  rim.addColorStop(.34,hsv(.90+rp,.48,.96,.47));
  rim.addColorStop(.68,hsv(.59+rp,.50,.96,.45));
  rim.addColorStop(1,hsv(.13+rp,.52,.96,.52));
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
  const back=pr(rotQ([0,0,zBack]),w,h,e), front=pr(rotQ([0,0,zFront]),w,h,e);
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
    let t=k/(slices-1),z=zBack+(zFront-zBack)*t,q=pr(rotQ([0,0,z]),w,h,e);
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

  // Dot: part of the SAME swept planar ? as the hook.
  // Same 2D shear, same zBack/zFront, same rotQ() and same perspective projection.
  // It therefore moves/foreshortens by exactly the same rigid-body rule as the hook.
  const dotD=stemW*1.2, rrObj=(dotD/S)*.5;
  const y0=-.68, x0=0, seg=32;
  const shear=-.10;
  function dotPoint(a,z){
    const yy=y0+rrObj*Math.sin(a);
    const xx=x0+rrObj*Math.cos(a)+shear*yy;
    return [xx,yy,z];
  }
  function polyPath(pts){
    g.beginPath(); g.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++) g.lineTo(pts[i][0],pts[i][1]);
    g.closePath();
  }
  let backRing=[],frontRing=[];
  for(let i=0;i<seg;i++){
    const a=i*T/seg;
    backRing.push(pr(rotQ(dotPoint(a,zBack)),w,h,e));
    frontRing.push(pr(rotQ(dotPoint(a,zFront)),w,h,e));
  }
  polyPath(backRing);
  g.fillStyle=hsv(hue+.43,.88,.58); g.fill();
  g.lineJoin="round"; g.lineWidth=edgeW;
  g.strokeStyle=hsv(hue+.43,.92,.72); g.stroke();

  let sideFaces=[];
  for(let i=0;i<seg;i++){
    const j=(i+1)%seg,a0=i*T/seg,a1=j*T/seg;
    const r0=rotQ(dotPoint(a0,zBack)),r1=rotQ(dotPoint(a1,zBack));
    const r2=rotQ(dotPoint(a1,zFront)),r3=rotQ(dotPoint(a0,zFront));
    sideFaces.push({z:(r0[2]+r1[2]+r2[2]+r3[2])*.25,
      pts:[pr(r0,w,h,e),pr(r1,w,h,e),pr(r2,w,h,e),pr(r3,w,h,e)],
      a:(a0+a1)*.5});
  }
  sideFaces.sort((a,b)=>a.z-b.z);
  for(const f of sideFaces){
    polyPath(f.pts);
    g.fillStyle=hsv(fr(hue+.18+f.a/T*.92+(ax/MAX)*.10+e*.018),.92,.80);
    g.fill();
  }
  polyPath(frontRing);
  g.fillStyle=hsv(hue,.90,.96); g.fill();
  g.lineJoin="round"; g.lineWidth=edgeW;
  g.strokeStyle=hsv(hue+.18,.95,.66); g.stroke();


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