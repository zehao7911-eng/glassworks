import {BeaconHost} from './sdk.mjs';
const T=THREE, canvas=document.querySelector('canvas'), action=document.querySelector('#action');
const status=document.querySelector('#status'), record=document.querySelector('#record');
const key='glassworks-v1';
let best=0;
try{best=Number(localStorage.getItem(key))||0}catch{}
const save=()=>{try{localStorage.setItem(key,String(best))}catch{} host.save({best})};
const host=new BeaconHost(window,{status(){},reward(){},load(data){if(Number.isSafeInteger(data?.best)&&data.best>best){best=data.best;save();hud()}}});
const r=new T.WebGLRenderer({canvas,antialias:true}), scene=new T.Scene();
r.setPixelRatio(Math.min(devicePixelRatio,1.5));r.outputEncoding=T.sRGBEncoding;
scene.background=new T.Color(0x20342d);scene.fog=new T.Fog(0x20342d,13,28);
const camera=new T.PerspectiveCamera(38,1,.1,40);
const light=new T.DirectionalLight(0xffd7a3,2);light.position.set(-3,8,4);
scene.add(light,new T.HemisphereLight(0xb9f5de,0x7b4234,1.4));
const cube=new T.BoxGeometry();
const amber=new T.MeshBasicMaterial({color:0xffb456});
function block(x,y,z,w,h,d,c,metalness=0){
 const m=new T.Mesh(cube,new T.MeshStandardMaterial({color:c,metalness,roughness:metalness?.28:.74}));
 m.position.set(x,y,z);m.scale.set(w,h,d);scene.add(m);return m;
}
block(0,-.25,0,15,.5,15,0x323a30);
for(let i=-5;i<=5;i++){block(i,.01,0,.024,.01,12,0x585949);block(0,.01,i,12,.01,.024,0x585949)}
for(let i=-3;i<=3;i++){block(i*2,3,-4,.18,6,.38,0x646249);block(i*2,2.5,-4.2,1.7,3,.12,0x527663)}
for(let i=0;i<6;i++)block(0,i+.4,-4.1,14,.07,.27,0x6c6650);
block(0,.25,0,3.5,.5,3.2,0x716147,.35);
block(0,.54,0,2.7,.12,2.6,0xc89755,.4);
// A lit annealing furnace and the operator's control station.
block(-3.4,1,-2.2,2.45,2,1.65,0x343d3a,.25);
block(-3.4,1.07,-1.36,1.75,1.22,.08,0x191e20);
block(-3.4,1.03,-1.30,1.34,.72,.04,0xf8a249).material=amber;
for(let i=0;i<6;i++)block(-4+i*.24,1.04,-1.25,.046,.9,.07,0x573a2d);
const heat=new T.PointLight(0xff962f,2.7,7);
heat.position.set(-3.4,1.3,-.93);scene.add(heat);
for(let i=0;i<4;i++)block(0,4.75+i*.19,-.2,7.3,.10,.23,i%2?0x9b6b3a:0x514b36,.3);
const worker=new T.Group();worker.position.set(2.8,0,-.65);worker.rotation.y=-.62;scene.add(worker);
function detail(x,y,z,w,h,d,color,parent=worker){
 const m=block(x,y,z,w,h,d,color);parent.add(m);return m;
}
const cloth=0x4b7e73, skin=0xb87f61, leather=0x644233;
detail(0,.94,0,.57,.60,.35,cloth);
detail(0,.91,.19,.42,.45,.052,leather);
detail(0,.66,.22,.39,.055,.041,0xc7985e);
detail(0,1.49,0,.41,.42,.37,skin);
detail(0,1.70,0,.49,.12,.43,0xe4aa56);
detail(0,1.57,.194,.43,.095,.06,0x233d36);
for(const side of [-1,1]){
 detail(side*.10,1.57,.235,.135,.066,.024,0x8ed8c4);
 detail(side*.17,1.16,.22,.045,.29,.03,0x9e744b);
 detail(side*.145,.35,0,.23,.64,.24,0x313c42);
 detail(side*.145,.08,.055,.25,.15,.35,0x252927);
}
const leverArm=new T.Group();leverArm.position.set(-.37,1.12,0);worker.add(leverArm);
detail(0,-.14,0,.18,.31,.20,cloth,leverArm);
detail(0,-.35,.055,.15,.17,.17,skin,leverArm);
detail(.36,.88,0,.17,.48,.19,cloth);
detail(.36,.61,.01,.15,.15,.15,skin);
block(2.4,.42,.72,.82,.84,.62,0x4b5142);
block(2.4,.87,.72,.87,.07,.66,0xa88a5f);
block(2.4,.98,.72,.052,.24,.052,0x27312c);
block(2.4,1.12,.72,.14,.10,.13,0xba633f);
const sparkGeometry=new T.BoxGeometry(.037,.037,.037);
const sparks=Array.from({length:16},()=>{
 const spark=new T.Mesh(sparkGeometry,amber);scene.add(spark);spark.visible=false;return spark;
});
let impactAt=-Infinity, impactX=0, impactY=0;
let state='ready', count=0, width=2.65, center=0, moving, fallStart=0, startTime=0, shift=1, stack=[];
const colors=[0x42c3ae,0x7ee0bb,0xf6b267,0xe28b85,0xbdb5f4,0x69b7ee];
function hud(){record.textContent='SHIFT '+shift+' / BEST '+best+' SLABS'}
function slab(x,y,w){const m=block(x,y,0,w,.29,2.32,colors[count%colors.length],.22);const edge=new T.LineSegments(new T.EdgesGeometry(cube),new T.LineBasicMaterial({color:0xc2ffee}));m.add(edge);return m}
function discard(m){scene.remove(m);m.material.dispose();m.children[0].geometry.dispose();m.children[0].material.dispose()}
function spawn(){moving=slab(0,.82+count*.3+1.1,width);startTime=performance.now();state='aim';action.disabled=false;action.textContent='Drop slab';}
function finish(won){state='done';host.end();save();action.disabled=false;action.textContent=won?'Next shift':'Try again'}
action.onclick=()=>{
 if(state==='ready'||state==='done'){
  shift=Math.min(8,1+Math.floor(best/6));stack.forEach(discard);stack=[];
  count=0;width=2.65;center=0;hud();host.start();status.textContent='Line up the slab with the stack.';spawn();
 }else if(state==='aim'){state='fall';fallStart=performance.now();action.disabled=true}
};
function frame(now){
 if(state==='aim')moving.position.x=Math.sin((now-startTime)*(.0018+shift*.00035)) * 2.2;
 if(state==='fall'){
  const t=Math.min(1,(now-fallStart)/230);
  moving.position.y=.82+count*.3+1.1*(1-t*t);
  if(t===1){
   const offset=moving.position.x-center;
   if(Math.abs(offset)>=width-.12){discard(moving);status.textContent='Missed the stack.';finish(false)}
   else{
    const perfect=Math.abs(offset)<.12;
    if(!perfect){width-=Math.abs(offset);center+=offset/2}
    moving.position.x=center;moving.scale.x=width;stack.push(moving);count++;
    impactAt=now;impactX=center;impactY=moving.position.y;
    best=Math.max(best,(shift-1)*6+count);save();hud();
    status.textContent=(perfect?'Perfect alignment! ':'')+count+' / 6 slabs';
    if(count===6)finish(true);else spawn();
   }
  }
 }
 const age=(now-impactAt)/460;
 const pulse=age<1?Math.sin(Math.PI*age):0;
 heat.intensity=2.4+Math.sin(now*.007)*.28+pulse;
 leverArm.rotation.x=state==='fall'?-1.28:-.54+pulse*.25;
 sparks.forEach((spark,i)=>{
  spark.visible=age<1;
  if(spark.visible){
   const angle=i*2.4;
   spark.position.set(impactX+Math.cos(angle)*age*1.65,impactY+.56*Math.sin(age*Math.PI),Math.sin(angle)*age*1.38);
  }
 });
 const h=count*.21;
 const attract=state==='ready'?Math.sin(now*.0008)*.22:0;
 camera.position.set(4.8+attract-pulse*.16,4.2+h,10.3-pulse*.38);
 camera.lookAt(.1,1.55+h,0);
 r.render(scene,camera);requestAnimationFrame(frame);
}
new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h){r.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}}).observe(canvas);
addEventListener('pagehide',()=>{save();host.stop()});
addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
hud();host.poll();requestAnimationFrame(frame);
