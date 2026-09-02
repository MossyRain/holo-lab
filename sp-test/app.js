(()=>{
const cvs=[document.getElementById('left'),document.getElementById('right')];
let tx=0,ty=0,x=0,y=0,drag=false,lx=0,ly=0;

function compile(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
function makeProgram(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p}

const VS=`attribute vec3 aPos; attribute vec3 aNormal;
uniform mat4 uMVP; uniform float uPointSize;
varying vec3 vPos; varying vec3 vNormal;
void main(){vPos=aPos;vNormal=aNormal;gl_Position=uMVP*vec4(aPos,1.0);gl_PointSize=uPointSize;}`;

const FS=`precision mediump float;
uniform int uMode; uniform float uHue; uniform float uAlpha;
varying vec3 vPos; varying vec3 vNormal;

vec3 holo(float t){return .56+.44*cos(6.283185*(vec3(0.0,.333,.667)+t));}

void main(){
  if(uMode==2){
    vec2 q=gl_PointCoord-.5;
    float r=length(q);
    if(r>.5) discard;
    float a=smoothstep(.5,0.0,r)*uAlpha;
    vec3 c=holo(fract(uHue + vPos.z*.18));
    gl_FragColor=vec4(c,a);
    return;
  }

  vec3 n=normalize(vNormal);

  if(uMode==0){
    // Same plane = same color.
    // Face color depends on orientation class + tilt hue, not XY position.
    float faceClass = abs(n.z)>.8 ? 0.0 : (abs(n.x)>abs(n.y) ? .18 : .34);
    vec3 c=holo(fract(uHue + faceClass));
    float light=.64+.36*max(0.0,dot(n,normalize(vec3(-.35,.55,1.0))));
    gl_FragColor=vec4(c*light,uAlpha);
    return;
  }

  // Fixed shell look: transparent center, milky edge + material highlights.
  float fres=pow(1.0-abs(n.z),2.5);
  float h1=pow(max(0.0,dot(n,normalize(vec3(-.42,.55,1.0)))),42.0);
  float h2=pow(max(0.0,dot(n,normalize(vec3(.55,-.15,1.0)))),70.0);
  vec3 pearl=vec3(.88,.91,.97);
  float a=.015 + fres*.18 + h1*.16 + h2*.22;
  gl_FragColor=vec4(pearl + vec3(h1+h2)*.45, a*uAlpha);
}`;

function perspective(fov,asp,n,f){
  let t=1/Math.tan(fov/2),q=1/(n-f);
  return new Float32Array([t/asp,0,0,0,0,t,0,0,0,0,(f+n)*q,-1,0,0,2*f*n*q,0]);
}
function mul(a,b){
  let o=new Float32Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}
  return o;
}
function model(rx,ry,eye){
  let cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry);
  return new Float32Array([cy,sx*sy,-cx*sy,0, 0,cx,sx,0, sy,-sx*cy,cx*cy,0, eye,0,-3.15,1]);
}

function sphere(seg=56,rings=34){
  const p=[],n=[],idx=[];
  for(let j=0;j<=rings;j++){
    let ph=j/rings*Math.PI;
    for(let i=0;i<=seg;i++){
      let th=i/seg*Math.PI*2;
      let X=Math.sin(ph)*Math.cos(th),Y=Math.cos(ph),Z=Math.sin(ph)*Math.sin(th);
      p.push(X,Y,Z); n.push(X,Y,Z);
    }
  }
  for(let j=0;j<rings;j++)for(let i=0;i<seg;i++){
    let a=j*(seg+1)+i,b=a+seg+1;
    idx.push(a,b,a+1,b,b+1,a+1);
  }
  return {p:new Float32Array(p),n:new Float32Array(n),i:new Uint16Array(idx)};
}

// Create a flat-front, extruded question-mark solid from a 2D raster mask.
// Front/back are flat; boundary becomes the side wall.
function extrudedQuestion(){
  const W=120,H=150,cell=.012,depth=.16;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d');
  g.clearRect(0,0,W,H);
  g.fillStyle='#fff';
  g.font='900 128px Arial Black,Arial';
  g.textAlign='center'; g.textBaseline='middle';
  g.fillText('?',W/2,H/2-4);

  const img=g.getImageData(0,0,W,H).data;
  const on=(xx,yy)=>xx>=0&&yy>=0&&xx<W&&yy<H&&img[(yy*W+xx)*4+3]>80;

  const p=[],n=[],idx=[];
  const vid=(xx,yy,front)=>{
    p.push((xx-W/2)*cell,(H/2-yy)*cell,front?depth:-depth);
    n.push(0,0,front?1:-1);
    return p.length/3-1;
  };

  // front/back quads only where mask is filled
  for(let yy=0;yy<H-1;yy++) for(let xx=0;xx<W-1;xx++){
    if(on(xx,yy)&&on(xx+1,yy)&&on(xx,yy+1)&&on(xx+1,yy+1)){
      let a=vid(xx,yy,true),b=vid(xx+1,yy,true),c1=vid(xx,yy+1,true),d=vid(xx+1,yy+1,true);
      idx.push(a,c1,b,b,c1,d);
      let A=vid(xx,yy,false),B=vid(xx+1,yy,false),C=vid(xx,yy+1,false),D=vid(xx+1,yy+1,false);
      idx.push(A,B,C,B,D,C);
    }
  }

  // boundary side walls
  const dirs=[[1,0],[0,1],[-1,0],[0,-1]];
  for(let yy=1;yy<H-1;yy++) for(let xx=1;xx<W-1;xx++){
    if(!on(xx,yy)) continue;
    for(const [dx,dy] of dirs){
      if(!on(xx+dx,yy+dy)){
        let x0=xx-(dy<0?0:dy>0?0:0), y0=yy;
        let x1=xx+dx, y1=yy+dy;
        // approximate wall segment along pixel edge
        let ax=(xx-W/2)*cell, ay=(H/2-yy)*cell;
        let bx=((xx+(dy!=0?1:0))-W/2)*cell;
        let by=(H/2-(yy+(dx!=0?1:0)))*cell;
        let base=p.length/3;
        p.push(ax,ay,-depth, bx,by,-depth, ax,ay,depth, bx,by,depth);
        let nx=dx,ny=-dy;
        for(let k=0;k<4;k++) n.push(nx,ny,0);
        idx.push(base,base+1,base+2,base+1,base+3,base+2);
      }
    }
  }
  return {p:new Float32Array(p),n:new Float32Array(n),i:new Uint16Array(idx)};
}

function cylinder(){
  const N=48,r=.11,depth=.22,cy=-.56,p=[],n=[],idx=[];
  // front/back circles + side
  for(let side=0;side<2;side++){
    const z=side?depth/2:-depth/2, center=p.length/3;
    p.push(0,cy,z); n.push(0,0,side?1:-1);
    for(let i=0;i<N;i++){
      let th=i/N*Math.PI*2;
      p.push(r*Math.cos(th),cy+r*Math.sin(th),z); n.push(0,0,side?1:-1);
    }
    for(let i=0;i<N;i++){
      let a=center,b=center+1+i,c=center+1+((i+1)%N);
      side?idx.push(a,b,c):idx.push(a,c,b);
    }
  }
  const front=1, back=N+2;
  for(let i=0;i<N;i++){
    let j=(i+1)%N;
    let a=front+i,b=front+j,c=back+i,d=back+j;
    idx.push(a,c,b,b,c,d);
  }
  return {p:new Float32Array(p),n:new Float32Array(n),i:new Uint16Array(idx)};
}

function inclusions(){
  let p=[],n=[],sz=[],seed=94731;
  const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  for(let i=0;i<280;i++){
    let X,Y,Z;
    do{X=rnd()*1.62-.81;Y=rnd()*1.62-.81;Z=rnd()*1.62-.81;}while(X*X+Y*Y+Z*Z>.64);
    p.push(X,Y,Z); n.push(0,0,1);
    // Mostly micro points, small controlled variation.
    sz.push(.55 + rnd()*1.15);
  }
  return {p:new Float32Array(p),n:new Float32Array(n),sz:new Float32Array(sz)};
}

const S=sphere(),Q=extrudedQuestion(),D=cylinder(),I=inclusions();

function setup(canvas,eye){
  const gl=canvas.getContext('webgl',{antialias:true,alpha:false});
  const P=makeProgram(gl,VS,FS); gl.useProgram(P);
  const L={
    p:gl.getAttribLocation(P,'aPos'),n:gl.getAttribLocation(P,'aNormal'),
    mvp:gl.getUniformLocation(P,'uMVP'),ps:gl.getUniformLocation(P,'uPointSize'),
    mode:gl.getUniformLocation(P,'uMode'),hue:gl.getUniformLocation(P,'uHue'),
    alpha:gl.getUniformLocation(P,'uAlpha')
  };
  const mk=(data,target=gl.ARRAY_BUFFER)=>{const b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b};
  const pack=o=>({p:mk(o.p),n:mk(o.n),i:o.i?mk(o.i,gl.ELEMENT_ARRAY_BUFFER):null});
  const SB=pack(S),QB=pack(Q),DB=pack(D),IB=pack(I);

  function attr(buf,loc){gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0)}
  function mesh(B,O,mode,alpha){
    attr(B.p,L.p); attr(B.n,L.n);
    gl.uniform1i(L.mode,mode); gl.uniform1f(L.alpha,alpha);
    if(B.i){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,B.i);gl.drawElements(gl.TRIANGLES,O.i.length,gl.UNSIGNED_SHORT,0);}
    else gl.drawArrays(gl.POINTS,0,O.p.length/3);
  }

  return ()=>{
    const dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth*dpr|0,h=canvas.clientHeight*dpr|0;
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    gl.viewport(0,0,w,h);
    gl.clearColor(.01,.01,.014,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND);

    const hue=fract((x*1.7+y*1.1)+eye*.025);
    function fract(v){return v-Math.floor(v)}
    const mvp=mul(perspective(.72,w/h,.1,20),model(y*.70,x*.90,eye*.045));
    gl.uniformMatrix4fv(L.mvp,false,mvp); gl.uniform1f(L.hue,hue);

    // Flat-faced solid ? and dot
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    mesh(QB,Q,0,.97); mesh(DB,D,0,.97);

    // Micro inclusions: glow only, no black/dark state.
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
    attr(IB.p,L.p); attr(IB.n,L.n);
    gl.uniform1i(L.mode,2); gl.uniform1f(L.alpha,.7);
    // three tiny size groups
    for(const ps of [1.25,1.8,2.35]){
      gl.uniform1f(L.ps,ps*dpr);
      gl.drawArrays(gl.POINTS,0,I.p.length/3);
    }

    // Fixed shell treatment: visually stable on-screen
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    mesh(SB,S,1,.78);
    gl.depthMask(true);
  };
}

const draws=[setup(cvs[0],-1),setup(cvs[1],1)];
function frame(){x+=(tx-x)*.11;y+=(ty-y)*.11;draws.forEach(f=>f());requestAnimationFrame(frame)} frame();

cvs.forEach(c=>{
  c.addEventListener('pointerdown',e=>{drag=true;lx=e.clientX;ly=e.clientY;c.setPointerCapture(e.pointerId)});
  c.addEventListener('pointermove',e=>{if(!drag)return;tx=Math.max(-1,Math.min(1,tx+(e.clientX-lx)/180));ty=Math.max(-1,Math.min(1,ty+(e.clientY-ly)/180));lx=e.clientX;ly=e.clientY});
  c.addEventListener('pointerup',()=>drag=false);
  c.addEventListener('pointercancel',()=>drag=false);
});
function orient(e){if(drag)return;tx=Math.max(-1,Math.min(1,(e.gamma||0)/24));ty=Math.max(-1,Math.min(1,(e.beta||0)/24))}
async function motion(){
  try{
    if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
      if(await DeviceOrientationEvent.requestPermission()!=='granted')return;
    }
    window.addEventListener('deviceorientation',orient,true);
    document.getElementById('motion').textContent='TILT ACTIVE';
  }catch(e){}
}
document.getElementById('motion').addEventListener('click',motion);
window.addEventListener('deviceorientation',orient,true);
})();