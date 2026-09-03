(()=>{let C=[L,R],MAX=Math.PI/6,tx=0,ty=0,ax=0,ay=0,rg=0,rb=0,bg=0,bb=0,have=0,drag=0,lx=0,ly=0,T=Math.PI*2,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),fr=v=>v-Math.floor(v);
function hsv(h,s=.9,v=1){h=fr(h)*6;let i=h|0,f=h-i,p=v*(1-s),q=v*(1-s*f),t=v*(1-s*(1-f)),c=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];return`rgb(${c[0]*255|0},${c[1]*255|0},${c[2]*255|0})`}
function rot(p){let[X,Y,Z]=p,cy=Math.cos(ax),sy=Math.sin(ax),x=cy*X+sy*Z,z=-sy*X+cy*Z,cx=Math.cos(ay),sx=Math.sin(ay);return[x,cx*Y-sx*z,sx*Y+cx*z]}
function pr(p,w,h,e){let z=p[2]+3.5,f=Math.min(w,h)*1.28;return[w/2+(p[0]+e*.035)*f/z,h/2-p[1]*f/z]}
function qp(g){g.beginPath();g.moveTo(-.42,.58);g.bezierCurveTo(-.4,.88,-.12,1.02,.18,.96);g.bezierCurveTo(.54,.9,.7,.68,.66,.42);g.bezierCurveTo(.63,.22,.49,.1,.32,-.02);g.bezierCurveTo(.14,-.15,.08,-.25,.08,-.43);g.lineTo(.08,-.54);g.lineTo(-.18,-.54);g.lineTo(-.18,-.39);g.bezierCurveTo(-.18,-.1,-.03,.06,.17,.21);g.bezierCurveTo(.32,.32,.39,.4,.39,.51);g.bezierCurveTo(.39,.65,.28,.72,.12,.75);g.bezierCurveTo(-.04,.78,-.16,.7,-.18,.56);g.closePath()}
let seed=81173,RN=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646},P=[];
for(let i=0;i<210;i++){
  let X,Y,Z;
  // Broad volume distribution: deliberately reaches close to shell.
  do{X=RN()*1.82-.91;Y=RN()*1.82-.91;Z=RN()*1.82-.91}
  while(X*X+Y*Y+Z*Z>.80);
  let u=RN(), r=u<.68?1.85+RN()*.75:u<.93?2.65+RN()*1.15:3.8+RN()*1.5;
  P.push({p:[X,Y,Z],r,h:RN(),x:(RN()*2-1)*MAX,y:(RN()*2-1)*MAX,w:.022+RN()*.05})
}
function inc(g,w,h,e){
  g.save();
  // TEST 16: inclusions exist only inside the orb volume.
  // Match the CSS shell inset (6%) so no particles can leak into the square background.
  g.beginPath();g.arc(w*.5,h*.5,Math.min(w,h)*.44,0,T);g.clip();
  g.globalCompositeOperation="lighter";
  for(let a of P){
    let p=pr(rot(a.p),w,h,e),dx=ax-a.x,dy=ay-a.y,d=Math.hypot(dx,dy);
    let f=Math.exp(-d*d/(2*a.w*a.w)), r=Math.max(1.1,a.r*w/430);
    g.globalAlpha=.32+f*.66;
    g.fillStyle=hsv(a.h+(ax/MAX)*.13+(ay/MAX)*.08,.62,.95);
    g.beginPath();g.arc(p[0],p[1],r,0,T);g.fill();
    if(f>.58){
      let glow=r*(1.7+f*2.4);
      let gr=g.createRadialGradient(p[0],p[1],0,p[0],p[1],glow);
      gr.addColorStop(0,"rgba(255,255,255,.95)");
      gr.addColorStop(.18,"rgba(255,255,255,.48)");
      gr.addColorStop(1,"rgba(255,255,255,0)");
      g.globalAlpha=f*.78;g.fillStyle=gr;
      g.beginPath();g.arc(p[0],p[1],glow,0,T);g.fill();
      if(f>.82&&a.r>3.2){
        let q=r*(3.5+f*2);
        g.globalAlpha=.62*f;g.strokeStyle="white";g.lineWidth=.65;
        g.beginPath();g.moveTo(p[0]-q,p[1]);g.lineTo(p[0]+q,p[1]);
        g.moveTo(p[0],p[1]-q);g.lineTo(p[0],p[1]+q);g.stroke();
      }
    }
  }
  g.restore()
}
function ques(g,w,h,e){
  let hue=fr(.1+(ax/MAX)*.72+(ay/MAX)*.43), s=Math.min(w,h)*.31/1.45;
  let slices=22;
  for(let k=0;k<slices;k++){
    let z=-.13+k*(.26/(slices-1)), q=pr(rot([0,0,z]),w,h,e);
    g.save();g.translate(q[0],q[1]);g.scale(s,-s);

    // TEST 16: side colour is U-driven, not V/depth-driven.
    // A conic spectral field follows the hook's bend; all depth slices share
    // the same U phase, so thickness no longer creates rainbow bands.
    let ug=g.createConicGradient(
      -Math.PI*.64 + (ax/MAX)*.92 - (ay/MAX)*.28,
      -.02,.42
    );
    let phase=fr(hue+.08+(ax/MAX)*.18+(ay/MAX)*.07);
    for(let j=0;j<=12;j++){
      let u=j/12;
      ug.addColorStop(u,hsv(phase+u*.92,.94,.86+.12*Math.sin(Math.PI*u)));
    }
    g.fillStyle=ug;
    qp(g);g.fill();g.restore();
  }

  let cen=pr(rot([0,0,.13]),w,h,e);
  g.save();g.translate(cen[0],cen[1]);g.scale(s,-s);
  // Front plane stays coherent; the U-rainbow belongs primarily to the curved side.
  g.fillStyle=hsv(hue,.91,1);qp(g);g.fill();g.restore();

  // Dot: same principle. Side colour varies around its circumference (U),
  // rather than along cylinder depth (V).
  let f=pr(rot([0,-.57,.13]),w,h,e), b=pr(rot([0,-.57,-.13]),w,h,e);
  let rr=Math.min(w,h)*.037;
  let cx=(f[0]+b[0])/2,cy=(f[1]+b[1])/2;
  let sideR=rr+Math.hypot(f[0]-b[0],f[1]-b[1])/2;
  let dg=g.createConicGradient((ax/MAX)*1.1,cx,cy);
  for(let j=0;j<=10;j++){let u=j/10;dg.addColorStop(u,hsv(hue+.08+u*.9,.93,.92))}
  g.fillStyle=dg;g.beginPath();g.ellipse(cx,cy,sideR,rr*.96,0,0,T);g.fill();
  g.fillStyle=hsv(hue,.91,1);g.beginPath();g.arc(f[0],f[1],rr,0,T);g.fill()
}
function setup(c,e){let g=c.getContext("2d",{alpha:false,desynchronized:true});return()=>{let d=Math.min(devicePixelRatio||1,1.5),w=c.clientWidth*d|0,h=c.clientHeight*d|0;if(c.width!=w||c.height!=h){c.width=w;c.height=h}g.fillStyle="#050507";g.fillRect(0,0,w,h);inc(g,w,h,e);ques(g,w,h,e)}}let D=[setup(C[0],-1),setup(C[1],1)];
function loop(){ax+=(tx-ax)*.34;ay+=(ty-ay)*.34;D[0]();D[1]();requestAnimationFrame(loop)}loop();
function orient(e){if(drag)return;rg=e.gamma||0;rb=e.beta||0;if(!have){bg=rg;bb=rb;have=1}tx=cl((rg-bg)*Math.PI/180,-MAX,MAX);ty=cl((rb-bb)*Math.PI/180,-MAX,MAX)}
motion.onclick=async()=>{try{if(typeof DeviceOrientationEvent.requestPermission==="function"&&await DeviceOrientationEvent.requestPermission()!="granted")return;addEventListener("deviceorientation",orient,true);motion.textContent="TILT ACTIVE"}catch(e){}};
reset.onclick=()=>{if(have){bg=rg;bb=rb}tx=ty=ax=ay=0};addEventListener("deviceorientation",orient,true);
C.forEach(c=>{c.onpointerdown=e=>{drag=1;lx=e.clientX;ly=e.clientY};c.onpointermove=e=>{if(!drag)return;tx=cl(tx+(e.clientX-lx)/260,-MAX,MAX);ty=cl(ty+(e.clientY-ly)/260,-MAX,MAX);lx=e.clientX;ly=e.clientY};c.onpointerup=c.onpointercancel=()=>drag=0})})();