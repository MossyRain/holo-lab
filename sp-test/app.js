(()=>{
const canvases=[document.getElementById('left'),document.getElementById('right')];

let targetX=0,targetY=0,tiltX=0,tiltY=0;
let dragging=false,lastX=0,lastY=0;

const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fract=v=>v-Math.floor(v);

function hsv(h,s,v){
  h=fract(h)*6;
  const i=Math.floor(h),f=h-i;
  const p=v*(1-s),q=v*(1-s*f),t=v*(1-s*(1-f));
  const c=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
  return `rgb(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)})`;
}

function rotatePoint(p,rx,ry){
  let [X,Y,Z]=p;
  // yaw around Y
  let cy=Math.cos(ry),sy=Math.sin(ry);
  let x1=cy*X+sy*Z, z1=-sy*X+cy*Z;
  // pitch around X
  let cx=Math.cos(rx),sx=Math.sin(rx);
  let y2=cx*Y-sx*z1, z2=sx*Y+cx*z1;
  return [x1,y2,z2];
}

function project(p,w,h,eye){
  // stable perspective, eye offset changes viewpoint but not shell
  const z=p[2]+3.15;
  const f=Math.min(w,h)*1.12;
  return [w/2+(p[0]+eye*0.032)*f/z, h/2-p[1]*f/z, z];
}

/* --- 2D question-mark outline, then a simple extrusion.
   The silhouette is a clean glyph-like ? with a separate round dot. --- */
function makeQuestionShape(){
  const c=document.createElement('canvas');
  c.width=220;c.height=270;
  const g=c.getContext('2d');
  g.fillStyle='#fff';
  g.font='900 230px Arial Black, Arial, sans-serif';
  g.textAlign='center';
  g.textBaseline='middle';
  g.fillText('?',110,126);

  const img=g.getImageData(0,0,c.width,c.height).data;
  const on=(x,y)=>x>=0&&y>=0&&x<c.width&&y<c.height&&img[(y*c.width+x)*4+3]>128;

  // sample boundary for side faces
  const boundary=[];
  const step=3;
  for(let y=step;y<c.height-step;y+=step){
    for(let x=step;x<c.width-step;x+=step){
      if(!on(x,y)) continue;
      if(!on(x+step,y)||!on(x-step,y)||!on(x,y+step)||!on(x,y-step)){
        boundary.push([(x-110)/150,(132-y)/150]);
      }
    }
  }

  return {canvas:c,boundary};
}
const qshape=makeQuestionShape();

/* Inclusions: mixed SMALL sizes, not all identical.
   Most are tiny. A few are modestly larger. No dark-state particles. */
function makeInclusions(){
  let seed=17321;
  const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  const pts=[];
  for(let i=0;i<360;i++){
    let x,y,z;
    do{
      x=rnd()*1.42-.71;y=rnd()*1.42-.71;z=rnd()*1.42-.71;
    }while(x*x+y*y+z*z>.49);

    const u=rnd();
    // 84% micro, 13% small, 3% brighter/larger
    const r=u<.84 ? .45+rnd()*.35 : (u<.97 ? .80+rnd()*.35 : 1.15+rnd()*.35);
    pts.push({p:[x,y,z],r,seed:rnd(),phase:rnd()*TAU,h:rnd()});
  }
  return pts;
}
const inclusions=makeInclusions();

function drawQuestion(ctx,w,h,eye){
  const rx=tiltY*.62, ry=tiltX*.82;
  const baseHue=fract(tiltX*1.55+tiltY*1.05+.12);
  const depth=.15;

  // Draw side wall first using boundary points.
  // Side hue differs by plane/orientation, but is uniform within a side class.
  const sideColor=hsv(baseHue+.18,.86,.92);
  ctx.fillStyle=sideColor;
  ctx.globalAlpha=.98;

  for(const b of qshape.boundary){
    const p0=rotatePoint([b[0],b[1],-depth],rx,ry);
    const p1=rotatePoint([b[0],b[1], depth],rx,ry);
    const a=project(p0,w,h,eye), c=project(p1,w,h,eye);
    ctx.beginPath();
    ctx.arc((a[0]+c[0])/2,(a[1]+c[1])/2,1.45,0,TAU);
    ctx.fill();
  }

  // Front face as ONE UNIFORM COLOR.
  const faceColor=hsv(baseHue,.90,1.0);
  const faceCanvas=qshape.canvas;

  // map the 2D face through a simple affine approx using 3 projected anchor points
  const A=project(rotatePoint([-.73,.88,depth],rx,ry),w,h,eye);
  const B=project(rotatePoint([ .73,.88,depth],rx,ry),w,h,eye);
  const C=project(rotatePoint([-.73,-.92,depth],rx,ry),w,h,eye);

  const sx=(B[0]-A[0])/faceCanvas.width;
  const shy=(B[1]-A[1])/faceCanvas.width;
  const shx=(C[0]-A[0])/faceCanvas.height;
  const sy=(C[1]-A[1])/faceCanvas.height;

  const tint=document.createElement('canvas');
  tint.width=faceCanvas.width;tint.height=faceCanvas.height;
  const tg=tint.getContext('2d');
  tg.drawImage(faceCanvas,0,0);
  tg.globalCompositeOperation='source-in';
  tg.fillStyle=faceColor;
  tg.fillRect(0,0,tint.width,tint.height);

  ctx.save();
  ctx.setTransform(sx,shy,shx,sy,A[0],A[1]);
  ctx.drawImage(tint,0,0);
  ctx.restore();

  // Separate dot: sideways cylinder, diameter ≈ depth.
  const dotR=.105, dotY=-.54, dotDepth=.21;
  const front=project(rotatePoint([0,dotY,dotDepth/2],rx,ry),w,h,eye);
  const back=project(rotatePoint([0,dotY,-dotDepth/2],rx,ry),w,h,eye);

  // side
  ctx.fillStyle=hsv(baseHue+.18,.86,.92);
  ctx.beginPath();
  ctx.ellipse((front[0]+back[0])/2,(front[1]+back[1])/2,
              Math.max(2,Math.abs(front[0]-back[0])/2+5.5),
              5.5,0,0,TAU);
  ctx.fill();

  // front circle
  ctx.fillStyle=faceColor;
  ctx.beginPath();
  ctx.arc(front[0],front[1],6.0,0,TAU);
  ctx.fill();

  ctx.setTransform(1,0,0,1,0,0);
}

function drawInclusions(ctx,w,h,eye,time){
  const rx=tiltY*.62, ry=tiltX*.82;

  for(const it of inclusions){
    const rp=rotatePoint(it.p,rx,ry);
    const pp=project(rp,w,h,eye);

    // periodic twinkle, with rare sharper flare
    const slow=.55+.45*Math.sin(time*(.85+it.seed*1.4)+it.phase);
    const rare=Math.pow(Math.max(0,Math.sin(time*(.28+it.seed*.34)+it.phase*2.7)),24);
    const coreAlpha=.18+.42*Math.max(0,slow)+rare*.78;

    const px=Math.max(.55,it.r*(w/360));
    const hue=fract(it.h + tiltX*.10 + tiltY*.06);

    ctx.save();
    ctx.globalCompositeOperation='lighter';

    // normal glow
    let g=ctx.createRadialGradient(pp[0],pp[1],0,pp[0],pp[1],px*3.0);
    g.addColorStop(0,hsv(hue,.55,1));
    g.addColorStop(.28,`rgba(255,255,255,${Math.min(.78,coreAlpha)})`);
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.globalAlpha=Math.min(1,coreAlpha);
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(pp[0],pp[1],px*3.0,0,TAU);
    ctx.fill();

    // occasional star-like stronger light, still no shadow/dark particle
    if(rare>.55 && it.r>.9){
      const L=px*(3.5+rare*3.0);
      ctx.globalAlpha=.55*rare;
      ctx.strokeStyle='rgba(255,255,255,.95)';
      ctx.lineWidth=Math.max(.45,px*.35);
      ctx.beginPath();
      ctx.moveTo(pp[0]-L,pp[1]);ctx.lineTo(pp[0]+L,pp[1]);
      ctx.moveTo(pp[0],pp[1]-L);ctx.lineTo(pp[0],pp[1]+L);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function setup(canvas,eye){
  const ctx=canvas.getContext('2d',{alpha:false});
  return function draw(time){
    const dpr=Math.min(devicePixelRatio||1,2);
    const w=Math.max(1,Math.floor(canvas.clientWidth*dpr));
    const h=Math.max(1,Math.floor(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle='#050507';
    ctx.fillRect(0,0,w,h);

    drawInclusions(ctx,w,h,eye,time);
    drawQuestion(ctx,w,h,eye);
  };
}

const draws=[setup(canvases[0],-1),setup(canvases[1],1)];
const t0=performance.now();
function frame(t){
  tiltX+=(targetX-tiltX)*.10;
  tiltY+=(targetY-tiltY)*.10;
  const sec=(t-t0)/1000;
  draws.forEach(d=>d(sec));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

canvases.forEach(c=>{
  c.addEventListener('pointerdown',e=>{
    dragging=true;lastX=e.clientX;lastY=e.clientY;
    try{c.setPointerCapture(e.pointerId);}catch(_){}
  });
  c.addEventListener('pointermove',e=>{
    if(!dragging)return;
    targetX=clamp(targetX+(e.clientX-lastX)/180,-1,1);
    targetY=clamp(targetY+(e.clientY-lastY)/180,-1,1);
    lastX=e.clientX;lastY=e.clientY;
  });
  c.addEventListener('pointerup',()=>dragging=false);
  c.addEventListener('pointercancel',()=>dragging=false);
});

function onOrientation(e){
  if(dragging)return;
  targetX=clamp((e.gamma||0)/24,-1,1);
  targetY=clamp((e.beta||0)/24,-1,1);
}
async function enableMotion(){
  try{
    if(typeof DeviceOrientationEvent!=='undefined' &&
       typeof DeviceOrientationEvent.requestPermission==='function'){
      const r=await DeviceOrientationEvent.requestPermission();
      if(r!=='granted')return;
    }
    window.addEventListener('deviceorientation',onOrientation,true);
    document.getElementById('motion').textContent='TILT ACTIVE';
  }catch(e){}
}
document.getElementById('motion').addEventListener('click',enableMotion);
window.addEventListener('deviceorientation',onOrientation,true);
})();