(()=>{
const cvs=[document.getElementById('left'),document.getElementById('right')];
let tiltX=0,tiltY=0,targetX=0,targetY=0,drag=false,lastX=0,lastY=0;

function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s}
function program(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);return p}
const VS=`attribute vec3 p;attribute vec3 n;uniform mat4 mvp;uniform mat4 model;uniform float pointSize;varying vec3 N;varying vec3 P;void main(){vec4 wp=model*vec4(p,1.);P=wp.xyz;N=mat3(model)*n;gl_Position=mvp*vec4(p,1.);gl_PointSize=pointSize;}`;
const FS=`precision mediump float;uniform vec4 color;uniform vec3 light;uniform int mode;varying vec3 N;varying vec3 P;void main(){if(mode==1){vec2 q=gl_PointCoord-.5;if(dot(q,q)>.25)discard;float z=sqrt(max(0.,.25-dot(q,q)));float h=.35+.65*z;gl_FragColor=vec4(color.rgb*h,color.a);return;}vec3 nn=normalize(N);float d=max(.0,dot(nn,normalize(light)));float rim=pow(1.-abs(nn.z),2.2);vec3 c=color.rgb*(.22+.58*d)+vec3(.42,.32,.65)*rim;gl_FragColor=vec4(c,color.a*(.35+.65*rim));}`;

function sphere(seg=48,rings=28){
 let P=[],N=[],I=[];
 for(let y=0;y<=rings;y++){let v=y/rings,ph=v*Math.PI;for(let x=0;x<=seg;x++){let u=x/seg,th=u*Math.PI*2;let nx=Math.sin(ph)*Math.cos(th),ny=Math.cos(ph),nz=Math.sin(ph)*Math.sin(th);P.push(nx,ny,nz);N.push(nx,ny,nz)}}
 for(let y=0;y<rings;y++)for(let x=0;x<seg;x++){let a=y*(seg+1)+x,b=a+seg+1;I.push(a,b,a+1,b,b+1,a+1)}
 return {p:new Float32Array(P),n:new Float32Array(N),i:new Uint16Array(I)};
}
function questionPoints(){
 const c=document.createElement('canvas');c.width=180;c.height=220;const x=c.getContext('2d');
 x.fillStyle='#fff';x.font='900 190px Arial Black,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText('?',90,112);
 const d=x.getImageData(0,0,c.width,c.height).data, pts=[], ns=[];
 for(let yy=4;yy<c.height;yy+=5)for(let xx=4;xx<c.width;xx+=5)if(d[(yy*c.width+xx)*4+3]>100){
   let X=(xx-90)/112,Y=(110-yy)/112;
   for(let z=-0.12;z<=0.1201;z+=0.06){pts.push(X,Y,z);ns.push(0,0,1)}
 }
 return {p:new Float32Array(pts),n:new Float32Array(ns)};
}
const S=sphere(),Q=questionPoints();

function perspective(fov,asp,n,f){let t=1/Math.tan(fov/2),nf=1/(n-f);return new Float32Array([t/asp,0,0,0,0,t,0,0,0,0,(f+n)*nf,-1,0,0,2*f*n*nf,0])}
function mul(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o}
function rot(rx,ry,tx=0){let cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry);return new Float32Array([cy, sx*sy,-cx*sy,0, 0,cx,sx,0, sy,-sx*cy,cx*cy,0, tx,0,-3.15,1])}

function setup(canvas,eye){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true});const pr=program(gl,VS,FS);
 const loc={p:gl.getAttribLocation(pr,'p'),n:gl.getAttribLocation(pr,'n'),mvp:gl.getUniformLocation(pr,'mvp'),model:gl.getUniformLocation(pr,'model'),color:gl.getUniformLocation(pr,'color'),light:gl.getUniformLocation(pr,'light'),mode:gl.getUniformLocation(pr,'mode'),ps:gl.getUniformLocation(pr,'pointSize')};
 function buf(data,target=gl.ARRAY_BUFFER){let b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b}
 const sb={p:buf(S.p),n:buf(S.n),i:buf(S.i,gl.ELEMENT_ARRAY_BUFFER)},qb={p:buf(Q.p),n:buf(Q.n)};
 function attr(b,l){gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,0,0)}
 return function draw(){
   let dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth*dpr|0,h=canvas.clientHeight*dpr|0;if(canvas.width!=w||canvas.height!=h){canvas.width=w;canvas.height=h}
   gl.viewport(0,0,w,h);gl.clearColor(.018,.018,.022,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(pr);
   let eyeShift=eye*.045, model=rot(tiltY*.75,tiltX*.9,eyeShift), proj=perspective(.72,w/h,.1,20), mvp=mul(proj,model);
   gl.uniformMatrix4fv(loc.mvp,false,mvp);gl.uniformMatrix4fv(loc.model,false,new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]));gl.uniform3f(loc.light,-.35,.7,1);
   // internal 3D question mark first
   attr(qb.p,loc.p);attr(qb.n,loc.n);gl.uniform1i(loc.mode,1);gl.uniform1f(loc.ps,5*dpr);gl.uniform4f(loc.color,1.0,.70,.08,.95);gl.drawArrays(gl.POINTS,0,Q.p.length/3);
   // translucent outer sphere
   attr(sb.p,loc.p);attr(sb.n,loc.n);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,sb.i);gl.uniform1i(loc.mode,0);gl.uniform4f(loc.color,.30,.20,.55,.25);gl.depthMask(false);gl.drawElements(gl.TRIANGLES,S.i.length,gl.UNSIGNED_SHORT,0);gl.depthMask(true);
   // fine sphere wire-ish points for material presence
   gl.uniform1i(loc.mode,1);gl.uniform1f(loc.ps,1.25*dpr);gl.uniform4f(loc.color,.75,.68,1.0,.20);gl.drawArrays(gl.POINTS,0,S.p.length/3);
 }
}
const draws=[setup(cvs[0],-1),setup(cvs[1],1)];

function loop(){tiltX+=(targetX-tiltX)*.11;tiltY+=(targetY-tiltY)*.11;draws.forEach(f=>f());requestAnimationFrame(loop)}loop();

function pointer(c){
 c.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;c.setPointerCapture(e.pointerId)});
 c.addEventListener('pointermove',e=>{if(!drag)return;targetX=Math.max(-1,Math.min(1,targetX+(e.clientX-lastX)/180));targetY=Math.max(-1,Math.min(1,targetY+(e.clientY-lastY)/180));lastX=e.clientX;lastY=e.clientY});
 c.addEventListener('pointerup',()=>drag=false);c.addEventListener('pointercancel',()=>drag=false);
}cvs.forEach(pointer);

function orient(e){if(drag)return;let g=e.gamma||0,b=e.beta||0;targetX=Math.max(-1,Math.min(1,g/24));let portrait=innerHeight>innerWidth;targetY=Math.max(-1,Math.min(1,(portrait?(b-45):b)/24))}
async function motion(){try{if(typeof DeviceOrientationEvent!='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){let r=await DeviceOrientationEvent.requestPermission();if(r!=='granted')return}window.addEventListener('deviceorientation',orient,true);document.getElementById('motion').textContent='TILT ACTIVE'}catch(e){}}
document.getElementById('motion').addEventListener('click',motion);
window.addEventListener('deviceorientation',orient,true);
})();