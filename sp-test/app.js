(()=>{
const cvs=[document.getElementById('right'),document.getElementById('left')];
const ctx=cvs.map(c=>c.getContext('2d'));
let tx=0,ty=0, targetX=0,targetY=0, active=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hsv=(h,s,l,a=1)=>`hsla(${((h%360)+360)%360},${s}%,${l}%,${a})`;

function resize(){
  cvs.forEach((c,i)=>{
    const r=c.getBoundingClientRect(), d=Math.min(devicePixelRatio||1,2);
    c.width=Math.round(r.width*d); c.height=Math.round(r.height*d);
  });
}
addEventListener('resize',resize); resize();

function qPath(g,cx,cy,S){
  // Deliberately sculpted geometry, not a font glyph:
  // wide hook, short lower stem, thick stroke.
  g.beginPath();
  g.moveTo(cx-0.42*S,cy-0.08*S);
  g.bezierCurveTo(cx-0.46*S,cy-0.36*S,cx-0.26*S,cy-0.53*S,cx+0.02*S,cy-0.52*S);
  g.bezierCurveTo(cx+0.35*S,cy-0.51*S,cx+0.48*S,cy-0.34*S,cx+0.43*S,cy-0.15*S);
  g.bezierCurveTo(cx+0.40*S,cy-0.03*S,cx+0.30*S,cy+0.04*S,cx+0.19*S,cy+0.10*S);
  g.bezierCurveTo(cx+0.08*S,cy+0.16*S,cx+0.04*S,cy+0.21*S,cx+0.04*S,cy+0.31*S);
  g.lineTo(cx-0.19*S,cy+0.31*S);
  g.bezierCurveTo(cx-0.19*S,cy+0.11*S,cx-0.12*S,cy-0.02*S,cx+0.08*S,cy-0.13*S);
  g.bezierCurveTo(cx+0.19*S,cy-0.19*S,cx+0.22*S,cy-0.25*S,cx+0.18*S,cy-0.31*S);
  g.bezierCurveTo(cx+0.13*S,cy-0.39*S,cx-0.01*S,cy-0.40*S,cx-0.10*S,cy-0.35*S);
  g.bezierCurveTo(cx-0.19*S,cy-0.30*S,cx-0.22*S,cy-0.20*S,cx-0.20*S,cy-0.08*S);
  g.closePath();
}
function holoColor(nx,ny,phase,light=55){
  const h=phase + Math.atan2(ny,nx)*180/Math.PI + nx*55;
  return hsv(h,92,light);
}
function drawQ(g,cx,cy,S,eye){
  const ax=tx*Math.PI/180, ay=ty*Math.PI/180;
  // straight extrusion, no bevel/taper. Thickness = dot diameter.
  const stemW=.23*S, dotD=stemW*1.2, depth=dotD;
  const dx=Math.sin(ax)*depth*.50 + eye*depth*.10;
  const dy=-Math.sin(ay)*depth*.50;
  const phase=210+tx*5.5+ty*2.2;

  // back boundary: clear B-rep-like edge, including silhouette at the rear.
  g.save();
  qPath(g,cx+dx,cy+dy,S);
  g.fillStyle=holoColor(-Math.sin(ax),.25,phase+115,42); g.fill();
  g.lineWidth=stemW*.08; g.strokeStyle=hsv(phase+145,95,54); g.stroke();
  g.restore();

  // side approximation between front/back, opaque and uniform per side direction.
  const steps=12;
  for(let k=steps;k>=1;k--){
    const t=k/steps;
    g.save(); qPath(g,cx+dx*t,cy+dy*t,S);
    g.fillStyle=holoColor(Math.sign(dx||1),Math.sign(dy||1),phase+70*t,46);
    g.fill(); g.restore();
  }

  // front is ONE uniform holo color at a static view.
  g.save(); qPath(g,cx,cy,S);
  g.fillStyle=hsv(phase,92,55); g.fill();
  g.lineWidth=stemW*.08; g.strokeStyle=hsv(phase+65,96,50); g.stroke(); g.restore();

  // explicit front/side boundary
  g.save(); qPath(g,cx,cy,S); g.lineWidth=stemW*.08;
  g.strokeStyle=hsv(phase+65,96,50); g.stroke(); g.restore();

  // dot: cylindrical extrusion, diameter 1.2 x stem width, same depth as diameter.
  const dotY=cy+.55*S, r=dotD/2;
  g.beginPath(); g.arc(cx+dx,dotY+dy,r,0,Math.PI*2);
  g.fillStyle=hsv(phase+120,92,45); g.fill();
  g.lineWidth=stemW*.08; g.strokeStyle=hsv(phase+155,95,52); g.stroke();
  for(let k=10;k>=1;k--){let t=k/10;g.beginPath();g.arc(cx+dx*t,dotY+dy*t,r,0,Math.PI*2);g.fillStyle=hsv(phase+70*t,92,48);g.fill();}
  g.beginPath();g.arc(cx,dotY,r,0,Math.PI*2);g.fillStyle=hsv(phase,92,55);g.fill();
  g.lineWidth=stemW*.08;g.strokeStyle=hsv(phase+65,96,50);g.stroke();
}
function drawShell(g,W,H,cx,cy,R,eye){
  const p=tx*.014+ty*.009+eye*.018;
  g.save();
  g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.clip();

  // dark transparent interior
  const base=g.createRadialGradient(cx,cy,R*.15,cx,cy,R);
  base.addColorStop(0,'rgba(5,7,12,.03)');
  base.addColorStop(.66,'rgba(8,10,18,.08)');
  base.addColorStop(1,'rgba(90,90,115,.18)');
  g.fillStyle=base;g.fillRect(cx-R,cy-R,R*2,R*2);

  // large, slow, 2-D aurora-sheet patches only in the milky shell.
  const blobs=[
    [-.62,-.55,165],[.18,-.72,325],[.66,-.28,195],
    [-.58,.46,215],[.18,.62,45],[.62,.52,290]
  ];
  blobs.forEach((b,i)=>{
    let x=cx+(b[0]+Math.sin(p*3+i)*.08)*R, y=cy+(b[1]+Math.cos(p*2+i)*.07)*R;
    let gr=g.createRadialGradient(x,y,0,x,y,R*.78);
    gr.addColorStop(0,hsv(b[2]+tx*2.0+ty*.8,72,78,.30));
    gr.addColorStop(.52,hsv(b[2]+35+tx*2.0,60,78,.13));
    gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr;g.fillRect(cx-R,cy-R,R*2,R*2);
  });

  // inclusions: material particles, no stars/flares/crystals; deterministic.
  let seed=7391;
  const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<95;i++){
    const a=rnd()*Math.PI*2, rr=Math.sqrt(rnd())*R*.78;
    const x=cx+Math.cos(a)*rr + eye*(rnd()-.5)*2.0;
    const y=cy+Math.sin(a)*rr;
    const rad=R*(.008+rnd()*.024); // former largest becomes near-small end
    g.beginPath();g.arc(x,y,rad,0,Math.PI*2);
    g.fillStyle=hsv(rnd()*360+tx*1.3,55,62,.38+rnd()*.28);g.fill();
  }
  g.restore();

  // shell rim, colored rather than white.
  g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);
  g.lineWidth=R*.035;
  const rim=g.createLinearGradient(cx-R,cy-R,cx+R,cy+R);
  rim.addColorStop(0,hsv(165+tx*2,70,76,.72));
  rim.addColorStop(.34,hsv(315+tx*2,62,78,.58));
  rim.addColorStop(.68,hsv(205+tx*2,65,78,.58));
  rim.addColorStop(1,hsv(45+tx*2,70,78,.72));
  g.strokeStyle=rim;g.stroke();

  // crisp window-like highlights; positions change with viewpoint.
  const hx=cx-R*.52+tx*R*.010, hy=cy-R*.57+ty*R*.010;
  g.save();g.translate(hx,hy);g.rotate(-.18+tx*.004);
  g.fillStyle='rgba(255,255,255,.72)';
  g.fillRect(-R*.16,-R*.035,R*.30,R*.07);
  g.fillRect(-R*.15,R*.015,R*.20,R*.035);
  g.restore();
}
function draw(i){
  const c=cvs[i],g=ctx[i],W=c.width,H=c.height;g.clearRect(0,0,W,H);
  const eye=i===0?1:-1, cx=W*.5,cy=H*.50,R=Math.min(W,H)*.43;
  drawShell(g,W,H,cx,cy,R,eye);
  drawQ(g,cx,cy-R*.03,R*.82,eye);
}
function frame(){tx+=(targetX-tx)*.13;ty+=(targetY-ty)*.13;draw(0);draw(1);requestAnimationFrame(frame)} frame();

function orient(e){
 if(!active)return;
 let gamma=e.gamma||0,beta=e.beta||0;
 targetX=clamp(gamma,-30,30); targetY=clamp(beta-45,-30,30);
}
addEventListener('deviceorientation',orient,true);
document.getElementById('tilt').onclick=async()=>{
 active=true;
 if(typeof DeviceOrientationEvent!=='undefined' && typeof DeviceOrientationEvent.requestPermission==='function'){
   try{active=(await DeviceOrientationEvent.requestPermission())==='granted'}catch(e){active=false}
 }
};
document.getElementById('reset').onclick=()=>{targetX=targetY=tx=ty=0};
let drag=false,sx=0,sy=0,bx=0,by=0;
document.addEventListener('pointerdown',e=>{drag=true;sx=e.clientX;sy=e.clientY;bx=targetX;by=targetY});
document.addEventListener('pointermove',e=>{if(!drag)return;targetX=clamp(bx+(e.clientX-sx)*.18,-30,30);targetY=clamp(by+(e.clientY-sy)*.18,-30,30)});
document.addEventListener('pointerup',()=>drag=false);
})();