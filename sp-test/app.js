(()=>{
const canvases=[document.getElementById('left'),document.getElementById('right')];
const motionBtn=document.getElementById('motion');
const resetBtn=document.getElementById('reset');

let rawX=0,rawY=0,baseX=0,baseY=0,tiltX=0,tiltY=0;
let haveSensor=false,drag=false,lastX=0,lastY=0;
const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), fract=v=>v-Math.floor(v);

function hsv(h,s,v){
  h=fract(h)*6; const i=Math.floor(h),f=h-i,p=v*(1-s),q=v*(1-s*f),t=v*(1-s*(1-f));
  const c=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
  return `rgb(${(c[0]*255)|0},${(c[1]*255)|0},${(c[2]*255)|0})`;
}
function updateTilt(){
  tiltX=clamp(rawX-baseX,-1,1);
  tiltY=clamp(rawY-baseY,-1,1);
}
function rotatePoint(p){
  const [X,Y,Z]=p, cy=Math.cos(tiltX*.82), sy=Math.sin(tiltX*.82);
  const x1=cy*X+sy*Z, z1=-sy*X+cy*Z, cx=Math.cos(tiltY*.62), sx=Math.sin(tiltY*.62);
  return [x1,cx*Y-sx*z1,sx*Y+cx*z1];
}
function project(p,w,h,eye){
  const z=p[2]+3.15,f=Math.min(w,h)*1.12;
  return [w/2+(p[0]+eye*.032)*f/z,h/2-p[1]*f/z];
}

/* Cached inclusion sprites */
const HUES=8, sizes=[5,7,10], sprites=[];
for(let hi=0;hi<HUES;hi++){
  sprites[hi]=[];
  for(let si=0;si<sizes.length;si++){
    const n=sizes[si],c=document.createElement('canvas'); c.width=c.height=n*4;
    const g=c.getContext('2d'),r=c.width/2,gr=g.createRadialGradient(r,r,0,r,r,r);
    const cc=hsv(hi/HUES,.58,1);
    gr.addColorStop(0,'white'); gr.addColorStop(.15,cc); gr.addColorStop(.46,cc); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr; g.fillRect(0,0,c.width,c.height);
    sprites[hi][si]=c;
  }
}

/* Small mixed-size inclusions */
let seed=31721;
const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
const inclusions=[];
for(let i=0;i<300;i++){
  let X,Y,Z;
  do{X=rnd()*1.42-.71;Y=rnd()*1.42-.71;Z=rnd()*1.42-.71;}while(X*X+Y*Y+Z*Z>.49);
  const u=rnd(),sizeClass=u<.82?0:u<.97?1:2;
  inclusions.push({p:[X,Y,Z],sizeClass,hue:(rnd()*HUES)|0,phase:rnd()*TAU,r:rnd()});
}

/* Reusable ? mask and tint */
const mask=document.createElement('canvas'); mask.width=220; mask.height=270;
{
  const g=mask.getContext('2d');
  g.fillStyle='white'; g.font='900 230px Arial Black,Arial,sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.fillText('?',110,126);
}
const tint=document.createElement('canvas'); tint.width=220; tint.height=270;
let lastHueKey=-1;
function tintedQuestion(hue){
  const key=(fract(hue)*72)|0;
  if(key!==lastHueKey){
    const g=tint.getContext('2d');
    g.clearRect(0,0,220,270); g.drawImage(mask,0,0);
    g.globalCompositeOperation='source-in'; g.fillStyle=hsv(key/72,.90,1); g.fillRect(0,0,220,270);
    g.globalCompositeOperation='source-over'; lastHueKey=key;
  }
  return tint;
}

function drawInclusions(ctx,w,h,eye,time){
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const it of inclusions){
    const pp=project(rotatePoint(it.p),w,h,eye);
    const tw=.55+.45*Math.sin(time*(.8+it.r*1.0)+it.phase);
    const rare=Math.pow(Math.max(0,Math.sin(time*(.22+it.r*.25)+it.phase*2.2)),26);
    const alpha=.10+.28*Math.max(0,tw)+rare*.78;
    const spr=sprites[it.hue][it.sizeClass];
    const scale=[.58,.72,.90][it.sizeClass]*(1+rare*.42);
    const dw=spr.width*scale;
    ctx.globalAlpha=Math.min(1,alpha);
    ctx.drawImage(spr,pp[0]-dw/2,pp[1]-dw/2,dw,dw);
    if(rare>.73 && it.sizeClass===2){
      const L=5+rare*6;
      ctx.globalAlpha=.55*rare; ctx.strokeStyle='white'; ctx.lineWidth=.7;
      ctx.beginPath();
      ctx.moveTo(pp[0]-L,pp[1]);ctx.lineTo(pp[0]+L,pp[1]);
      ctx.moveTo(pp[0],pp[1]-L);ctx.lineTo(pp[0],pp[1]+L);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawQuestion(ctx,w,h,eye){
  const hue=fract(tiltX*1.65+tiltY*1.10+.12);
  const A=project(rotatePoint([-.73,.88,.15]),w,h,eye);
  const B=project(rotatePoint([ .73,.88,.15]),w,h,eye);
  const D=project(rotatePoint([-.73,-.92,.15]),w,h,eye);
  ctx.save();
  ctx.setTransform((B[0]-A[0])/220,(B[1]-A[1])/220,(D[0]-A[0])/270,(D[1]-A[1])/270,A[0],A[1]);
  ctx.drawImage(tintedQuestion(hue),0,0);
  ctx.restore();

  /* independent dot, sideways-cylinder impression */
  const f=project(rotatePoint([0,-.54,.105]),w,h,eye);
  const b=project(rotatePoint([0,-.54,-.105]),w,h,eye);
  ctx.fillStyle=hsv(hue+.18,.86,.90);
  ctx.beginPath();ctx.ellipse((f[0]+b[0])/2,(f[1]+b[1])/2,7.5,5.5,0,0,TAU);ctx.fill();
  ctx.fillStyle=hsv(hue,.90,1);
  ctx.beginPath();ctx.arc(f[0],f[1],6,0,TAU);ctx.fill();
}

function setup(canvas,eye){
  const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
  return time=>{
    const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,(canvas.clientWidth*dpr)|0),h=Math.max(1,(canvas.clientHeight*dpr)|0);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
    ctx.fillStyle='#050507';ctx.fillRect(0,0,w,h);
    drawInclusions(ctx,w,h,eye,time);
    drawQuestion(ctx,w,h,eye);
  };
}

const draws=[setup(canvases[0],-1),setup(canvases[1],1)];
const start=performance.now();
function frame(t){
  const sec=(t-start)/1000;
  draws[0](sec);draws[1](sec);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* direct response: no smoothing */
function onOrientation(e){
  if(drag)return;
  rawX=clamp((e.gamma||0)/24,-2,2);
  rawY=clamp((e.beta||0)/24,-2,2);
  if(!haveSensor){
    baseX=rawX;baseY=rawY;haveSensor=true;
  }
  updateTilt();
}
async function enableMotion(){
  try{
    if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
      const r=await DeviceOrientationEvent.requestPermission();
      if(r!=='granted')return;
    }
    window.addEventListener('deviceorientation',onOrientation,true);
    motionBtn.textContent='TILT ACTIVE';
  }catch(e){}
}
function resetNeutral(){
  if(haveSensor){
    baseX=rawX;baseY=rawY;
  }else{
    baseX=0;baseY=0;rawX=0;rawY=0;
  }
  updateTilt();
}

motionBtn.addEventListener('click',enableMotion);
resetBtn.addEventListener('click',resetNeutral);
window.addEventListener('deviceorientation',onOrientation,true);

canvases.forEach(c=>{
  c.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;try{c.setPointerCapture(e.pointerId)}catch(_){}});
  c.addEventListener('pointermove',e=>{
    if(!drag)return;
    tiltX=clamp(tiltX+(e.clientX-lastX)/180,-1,1);
    tiltY=clamp(tiltY+(e.clientY-lastY)/180,-1,1);
    lastX=e.clientX;lastY=e.clientY;
  });
  c.addEventListener('pointerup',()=>drag=false);
  c.addEventListener('pointercancel',()=>drag=false);
});
})();