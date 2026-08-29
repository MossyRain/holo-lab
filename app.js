(()=>{const menu=document.querySelector('#menu'),viewer=document.querySelector('#viewer'),cards=[...document.querySelectorAll('.card')],pair=document.querySelector('#pair'),status=document.querySelector('#status');let on=false,bB=null,bG=null,drag=false;
const show=(v)=>{menu.classList.toggle('active',!v);viewer.classList.toggle('active',v)};
document.querySelector('#openMira').onclick=()=>show(true);document.querySelector('#back').onclick=()=>show(false);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function draw(x,y){x=clamp(x,-1,1);y=clamp(y,-1,1);cards.forEach(c=>{c.style.setProperty('--x',`${50+x*46}%`);c.style.setProperty('--y',`${50+y*43}%`)})}
function orient(e){if(!on)return;if(bB===null){bB=e.beta||0;bG=e.gamma||0}let x=((e.gamma||0)-bG)/27,y=((e.beta||0)-bB)/27;if(matchMedia('(orientation:portrait)').matches){let t=x;x=y;y=-t}draw(x,y)}
document.querySelector('#start').onclick=async()=>{try{if(typeof DeviceOrientationEvent==='undefined'){status.textContent='センサー非対応 / ドラッグ操作可';return}if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted'){status.textContent='センサー許可なし / ドラッグ操作可';return}bB=bG=null;on=true;addEventListener('deviceorientation',orient,true);document.querySelector('#start').textContent='TILT ACTIVE';status.textContent='現在角度を基準に設定'}catch(e){status.textContent='センサーを開始できません'}};
document.querySelector('#reset').onclick=()=>{bB=bG=null;draw(0,0)};
function ptr(e){let r=pair.getBoundingClientRect();draw(((e.clientX-r.left)/r.width-.5)*2,((e.clientY-r.top)/r.height-.5)*2)}
pair.onpointerdown=e=>{drag=true;pair.setPointerCapture(e.pointerId);ptr(e)};pair.onpointermove=e=>{if(drag)ptr(e)};pair.onpointerup=pair.onpointercancel=()=>drag=false;draw(0,0);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))})();