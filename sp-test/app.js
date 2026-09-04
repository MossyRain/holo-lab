(()=>{let C=[L,R],MAX=Math.PI/6,tx=0,ty=0,ax=0,ay=0,rg=0,rb=0,bg=0,bb=0,have=0,drag=0,lx=0,ly=0,T=Math.PI*2,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),fr=v=>v-Math.floor(v);
function hsv(h,s=.9,v=1){h=fr(h)*6;let i=h|0,f=h-i,p=v*(1-s),q=v*(1-s*f),t=v*(1-s*(1-f)),c=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];return`rgb(${c[0]*255|0},${c[1]*255|0},${c[2]*255|0})`}
function rot(p){let[X,Y,Z]=p,cy=Math.cos(ax),sy=Math.sin(ax),x=cy*X+sy*Z,z=-sy*X+cy*Z,cx=Math.cos(ay),sx=Math.sin(ay);return[x,cx*Y-sx*z,sx*Y+cx*z]}
function pr(p,w,h,e){let z=p[2]+3.5,f=Math.min(w,h)*1.28;return[w/2+(p[0]+e*.035)*f/z,h/2-p[1]*f/z]}
function qp(g){
  g.beginPath();
  g.moveTo(-.46,.56);
  g.bezierCurveTo(-.45,.90,-.14,1.08,.22,1.00);
  g.bezierCurveTo(.57,.93,.76,.70,.71,.40);
  g.bezierCurveTo(.67,.19,.53,.06,.35,-.07);
  g.bezierCurveTo(.17,-.20,.10,-.30,.10,-.48);
  g.bezierCurveTo(.10,-.57,.06,-.61,-.02,-.61);
  g.lineTo(-.20,-.61);
  g.bezierCurveTo(-.29,-.61,-.33,-.56,-.33,-.47);
  g.bezierCurveTo(-.33,-.14,-.16,.06,.07,.24);
  g.bezierCurveTo(.23,.36,.31,.45,.30,.55);
  g.bezierCurveTo(.29,.67,.19,.74,.05,.76);
  g.bezierCurveTo(-.12,.78,-.24,.69,-.26,.54);
  g.bezierCurveTo(-.28,.42,-.24,.31,-.14,.24);
  g.lineTo(-.28,.08);
  g.bezierCurveTo(-.43,.18,-.50,.35,-.46,.56);
  g.closePath();
}
let seed=81173,RN=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646},P=[];
for(let i=0;i<250;i++){
  let X,Y,Z;
  do{
    X=RN()*1.72-.86;Y=RN()*1.72-.86;Z=RN()*1.72-.86
  }while(X*X+Y*Y+Z*Z>.72);
  let u=RN();
  let r=u<.72 ? 1.55+RN()*.55 : (u<.95 ? 2.5+RN()*1.0 : 4.0+RN()*1.8);
  P.push({
    p:[X,Y,Z],r,
    h:RN(),
    x:(RN()*2-1)*MAX,
    y:(RN()*2-1)*MAX,
    w:.020+RN()*.050,
    flare:RN()
  })
}
function inc(g,w,h,e){
  g.save();
  g.beginPath();
  g.arc(w*.5,h*.5,Math.min(w,h)*.44,0,T);
  g.clip();
  g.globalCompositeOperation="lighter";

  for(let a of P){
    let p=pr(rot(a.p),w,h,e);
    let dx=ax-a.x,dy=ay-a.y,d=Math.hypot(dx,dy);
    let f=Math.exp(-d*d/(2*a.w*a.w));
    let r=Math.max(1.0,a.r*w/430);

    g.globalAlpha=.24+f*.62;
    g.fillStyle=hsv(a.h+(ax/MAX)*.12+(ay/MAX)*.07,.62,.98);
    g.beginPath();g.arc(p[0],p[1],r,0,T);g.fill();

    let glow=r*(1.55+f*2.0);
    let gr=g.createRadialGradient(p[0],p[1],0,p[0],p[1],glow);
    gr.addColorStop(0,"rgba(255,255,255,.95)");
    gr.addColorStop(.15,`rgba(255,255,255,${.35+.45*f})`);
    gr.addColorStop(1,"rgba(255,255,255,0)");
    g.globalAlpha=.20+f*.55;
    g.fillStyle=gr;
    g.beginPath();g.arc(p[0],p[1],glow,0,T);g.fill();

    if(a.r>3.9 && f>.72){
      let q=r*(3.0+f*2.5);
      g.globalAlpha=.55*f;
      g.strokeStyle="white";
      g.lineWidth=.65;
      g.beginPath();
      g.moveTo(p[0]-q,p[1]);g.lineTo(p[0]+q,p[1]);
      g.moveTo(p[0],p[1]-q);g.lineTo(p[0],p[1]+q);
      g.stroke();
    }
  }
  g.restore()
}
function ques(g,w,h,e){
  let hue=fr(.10+(ax/MAX)*.72+(ay/MAX)*.43);
  let s=Math.min(w,h)*.31/1.45;
  let slices=28;

  for(let k=0;k<slices;k++){
    let t=k/(slices-1);
    let z=-.15+k*(.30/(slices-1));
    let q=pr(rot([0,0,z]),w,h,e);
    let bulge=1 + .035*Math.sin(Math.PI*t);

    g.save();
    g.translate(q[0],q[1]);
    g.scale(s*bulge,-s*bulge);

    let ug=g.createConicGradient(
      -Math.PI*.68 + (ax/MAX)*.98 - (ay/MAX)*.30,
      -.03,.43
    );
    let phase=fr(hue+.05+(ax/MAX)*.20+(ay/MAX)*.08);
    for(let j=0;j<=16;j++){
      let u=j/16;
      let val=.82+.16*Math.sin(Math.PI*u);
      ug.addColorStop(u,hsv(phase+u*.96,.94,val));
    }
    g.globalAlpha=.90;
    g.fillStyle=ug;
    qp(g);g.fill();
    g.restore();
  }

  let cen=pr(rot([0,0,.15]),w,h,e);
  g.save();
  g.translate(cen[0],cen[1]);
  g.scale(s,-s);
  g.globalAlpha=.86;
  g.fillStyle=hsv(hue,.82,1);
  qp(g);g.fill();

  let hg=g.createLinearGradient(-.45,.70,.35,-.35);
  hg.addColorStop(0,"rgba(255,255,255,.32)");
  hg.addColorStop(.28,"rgba(255,255,255,.10)");
  hg.addColorStop(.60,"rgba(255,255,255,0)");
  g.globalAlpha=.42;
  g.fillStyle=hg;
  qp(g);g.fill();
  g.restore();

  let f=pr(rot([0,-.56,.13]),w,h,e);
  let rr=Math.min(w,h)*.039;
  let rg=g.createRadialGradient(
    f[0]-rr*.28,f[1]-rr*.34,rr*.10,
    f[0],f[1],rr
  );
  rg.addColorStop(0,"rgba(255,255,255,.96)");
  rg.addColorStop(.18,hsv(hue+.18,.80,1));
  rg.addColorStop(.52,hsv(hue+.48,.88,.95));
  rg.addColorStop(.82,hsv(hue+.78,.90,.82));
  rg.addColorStop(1,"rgba(255,255,255,.20)");
  g.globalAlpha=.95;
  g.fillStyle=rg;
  g.beginPath();
  g.ellipse(f[0],f[1],rr,rr*.92,0,0,T);
  g.fill();
}
function setup(c,e){let g=c.getContext("2d",{alpha:false,desynchronized:true});return()=>{let d=Math.min(devicePixelRatio||1,1.5),w=c.clientWidth*d|0,h=c.clientHeight*d|0;if(c.width!=w||c.height!=h){c.width=w;c.height=h}g.fillStyle="#050507";g.fillRect(0,0,w,h);inc(g,w,h,e);ques(g,w,h,e)}}let D=[setup(C[0],-1),setup(C[1],1)];
function loop(){ax+=(tx-ax)*.34;ay+=(ty-ay)*.34;D[0]();D[1]();requestAnimationFrame(loop)}loop();
function orient(e){if(drag)return;rg=e.gamma||0;rb=e.beta||0;if(!have){bg=rg;bb=rb;have=1}tx=cl((rg-bg)*Math.PI/180,-MAX,MAX);ty=cl((rb-bb)*Math.PI/180,-MAX,MAX)}
motion.onclick=async()=>{try{if(typeof DeviceOrientationEvent.requestPermission==="function"&&await DeviceOrientationEvent.requestPermission()!="granted")return;addEventListener("deviceorientation",orient,true);motion.textContent="TILT ACTIVE"}catch(e){}};
reset.onclick=()=>{if(have){bg=rg;bb=rb}tx=ty=ax=ay=0};addEventListener("deviceorientation",orient,true);
C.forEach(c=>{c.onpointerdown=e=>{drag=1;lx=e.clientX;ly=e.clientY};c.onpointermove=e=>{if(!drag)return;tx=cl(tx+(e.clientX-lx)/260,-MAX,MAX);ty=cl(ty+(e.clientY-ly)/260,-MAX,MAX);lx=e.clientX;ly=e.clientY};c.onpointerup=c.onpointercancel=()=>drag=0})})();