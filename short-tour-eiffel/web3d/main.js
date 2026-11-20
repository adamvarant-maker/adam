import * as THREE from 'three';
const W=1080,H=1920;
const R=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
R.setSize(W,H);R.setPixelRatio(1);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
R.outputColorSpace=THREE.SRGBColorSpace;document.body.appendChild(R.domElement);
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(50,W/H,0.05,900);

// ---------- toon materials + ink ----------
const gc=document.createElement('canvas');gc.width=4;gc.height=1;{const g=gc.getContext('2d');['#6a6a6a','#b4b4b4','#ffffff','#ffffff'].forEach((c,i)=>{g.fillStyle=c;g.fillRect(i,0,1,1)})}
const grad=new THREE.CanvasTexture(gc);grad.minFilter=grad.magFilter=THREE.NearestFilter;grad.generateMipmaps=false;
const MATS={};
function toon(col,map){const k=col+(map?map.uuid:'');if(MATS[k])return MATS[k];const m=new THREE.MeshToonMaterial({color:col,gradientMap:grad,map:map||null});return MATS[k]=m}
const inkBox=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{w:{value:0.035}},vertexShader:`uniform float w;void main(){vec3 p=position+sign(position)*w;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`void main(){gl_FragColor=vec4(.17,.10,.18,1.);}`});
const inkN=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{w:{value:0.035}},vertexShader:`uniform float w;void main(){vec3 p=position+normal*w;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`void main(){gl_FragColor=vec4(.17,.10,.18,1.);}`});
function inkMat(w,box){const m=(box?inkBox:inkN).clone();m.uniforms.w.value=w;return m}
const INKC={};
function add(parent,geo,col,{x=0,y=0,z=0,rx=0,ry=0,rz=0,ink=0.03,box=true,map=null,cast=true,recv=true}={}){
  const m=new THREE.Mesh(geo,toon(col,map));m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=cast;m.receiveShadow=recv;
  if(ink){const k=(box?'b':'n')+ink;const h=new THREE.Mesh(geo,INKC[k]||(INKC[k]=inkMat(ink,box)));m.add(h)}
  parent.add(m);return m}
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
function beam(parent,a,b,t,col,ink=0.02){const A=new THREE.Vector3(...a),Bv=new THREE.Vector3(...b);const len=A.distanceTo(Bv);
  const m=add(parent,B(t,len,t),col,{ink});m.position.copy(A).add(Bv).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),Bv.clone().sub(A).normalize());return m}

// ---------- painted textures ----------
function ctex(w,h,fn,rep=[1,1]){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');fn(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...rep);t.anisotropy=4;return t}
const noise=(g,w,h,col,n,a)=>{g.fillStyle=col;for(let i=0;i<n;i++){g.globalAlpha=a*Math.random();g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*6,2+Math.random()*6)}g.globalAlpha=1};
const TX={
  grass:ctex(256,256,(g,w,h)=>{g.fillStyle='#8fc06a';g.fillRect(0,0,w,h);noise(g,w,h,'#6f9e4e',900,.7);noise(g,w,h,'#b3d98a',500,.6)},[60,60]),
  gravel:ctex(256,256,(g,w,h)=>{g.fillStyle='#d9c7a0';g.fillRect(0,0,w,h);noise(g,w,h,'#b9a57c',1200,.7)},[6,40]),
  cobble:ctex(256,256,(g,w,h)=>{g.fillStyle='#6d6f86';g.fillRect(0,0,w,h);for(let y=0;y<8;y++)for(let x=0;x<8;x++){g.fillStyle=['#7d7f96','#73758c','#868aa0'][(x+y*3)%3];g.beginPath();g.roundRect(x*32+(y%2)*16+2,y*32+2,28,28,8);g.fill()}},[30,30]),
  wall:ctex(256,256,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#a33a48':'#8e2f3c';g.fillRect(i*32,0,32,h)}noise(g,w,h,'#5a1a24',300,.3);g.fillStyle='#e0b350';for(let i=0;i<8;i++){g.beginPath();g.arc(i*32+16,128,5,0,7);g.fill()}},[6,2]),
  beige:ctex(256,256,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#e9d9b8':'#ddc9a1';g.fillRect(i*32,0,32,h)}},[5,2]),
  parquet:ctex(256,256,(g,w,h)=>{for(let y=0;y<8;y++)for(let x=0;x<4;x++){g.fillStyle=['#9a6a3e','#8a5c34','#a8774a'][(x+y)%3];g.fillRect(x*64+(y%2)*32,y*32,62,30)}},[6,6]),
  cloth:ctex(128,128,(g,w,h)=>{g.fillStyle='#f4efe4';g.fillRect(0,0,w,h);g.fillStyle='#ddd3bf';for(let i=0;i<8;i++)g.fillRect(i*16,0,3,h)},[4,1]),
};
function facade(base,seed,lit){return ctex(256,512,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);noise(g,w,h,'#000',200,.08);
  for(let r=0;r<5;r++)for(let c=0;c<3;c++){const x=28+c*76,y=40+r*92;g.fillStyle='#2b1a2e';g.fillRect(x-4,y-4,48,72);g.fillStyle=lit&&((r*3+c+seed)%3)?'#ffd36a':'#4a5f86';g.fillRect(x,y,40,64);g.fillStyle='#f3efe6';g.fillRect(x-6,y+64,52,8);g.fillStyle='#2b1a2e';g.fillRect(x+18,y,4,64)}
  g.fillStyle='#2b1a2e';g.fillRect(0,h-110,w,6);g.fillStyle='#7a3a2a';g.fillRect(90,h-100,76,100)})}

// ---------- world ----------
const SETS={};
function mkSet(name,x){const g=new THREE.Group();g.position.x=x;scene.add(g);SETS[name]=g;return g}
// sky dome
const skyC=document.createElement('canvas');skyC.width=4;skyC.height=256;const skyT=new THREE.CanvasTexture(skyC);skyT.colorSpace=THREE.SRGBColorSpace;
const sky=new THREE.Mesh(new THREE.SphereGeometry(800,32,16),new THREE.MeshBasicMaterial({map:skyT,side:THREE.BackSide,fog:false}));scene.add(sky);
const sunM=new THREE.Mesh(new THREE.CircleGeometry(30,32),new THREE.MeshBasicMaterial({color:'#fff',fog:false}));scene.add(sunM);
// clouds
const cloudT=ctex(256,128,(g)=>{g.fillStyle='#fff';[[70,80,50],[130,60,60],[190,82,45],[110,90,50]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fill()});g.globalCompositeOperation='source-atop';g.fillStyle='#e6e8f4';g.fillRect(0,90,256,40)});
const clouds=[];for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(60,30),new THREE.MeshBasicMaterial({map:cloudT,transparent:true,depthWrite:false,fog:false}));m.userData={a:i/9*Math.PI*2,r:300+(i%3)*60,y:90+(i%4)*35};scene.add(m);clouds.push(m)}

// PARIS
const P=mkSet('paris',0);
add(P,new THREE.PlaneGeometry(1200,1200),'#ffffff',{rx:-Math.PI/2,ink:0,map:TX.grass,cast:false});
add(P,new THREE.PlaneGeometry(8,140),'#ffffff',{rx:-Math.PI/2,y:0.01,z:-20,ink:0,map:TX.gravel,cast:false});
// Eiffel tower
const TOW=new THREE.Group();TOW.position.set(0,0,-62);P.add(TOW);
const TC='#8a5236',TC2='#6e3f2a';
{const lvl=[[0,9.5],[13,4.2],[27,1.9],[50,0.35]];
  const cr=[[1,1],[1,-1],[-1,1],[-1,-1]];
  for(let s=0;s<3;s++){const [y0,r0]=lvl[s],[y1,r1]=lvl[s+1];const t=[0.9,0.55,0.35][s];
    for(const [a,b] of cr){beam(TOW,[a*r0,y0,b*r0],[a*r1,y1,b*r1],t,TC)}
    // braces on 4 faces
    const n=[5,5,8][s];
    for(let i=0;i<n;i++){const u0=i/n,u1=(i+1)/n;const ya=y0+(y1-y0)*u0,yb=y0+(y1-y0)*u1,ra=r0+(r1-r0)*u0,rb=r0+(r1-r0)*u1;
      for(const [sx,sz,ax] of [[1,0,'x'],[-1,0,'x'],[0,1,'z'],[0,-1,'z']]){
        const P1=(r,y,side)=>ax==='x'?[sx*r,y,side*r]:[side*r,y,sz*r];
        beam(TOW,P1(ra,ya,-1),P1(rb,yb,1),t*0.28,TC2,0.012);beam(TOW,P1(ra,ya,1),P1(rb,yb,-1),t*0.28,TC2,0.012)}}
  }
  // arches
  for(let k=0;k<4;k++){const a=new THREE.Group();a.rotation.y=k*Math.PI/2;TOW.add(a);const m=add(a,new THREE.TorusGeometry(6.2,0.35,6,24,Math.PI),TC,{z:7.6,y:4.2,ink:0.03,box:false});m.scale.y=0.85}
  add(TOW,B(13.5,1.1,13.5),TC,{y:13.3});add(TOW,B(13.9,0.3,13.9),'#c9a24a',{y:13.95,ink:0.02});
  add(TOW,B(6.4,0.8,6.4),TC,{y:27.3});
  add(TOW,B(1.6,1.6,1.6),TC,{y:50.6});add(TOW,new THREE.CylinderGeometry(0.08,0.15,4,6),TC2,{y:53.3,box:false,ink:0.02});
}
// houses ring
function house(par,x,z,ry,seed,w=9,h=11,d=8,lit=false){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;par.add(g);
  const cols=['#efe2c8','#e8d3b0','#f3e9d6','#e4cfae','#dcc7a6'];const t=facade(cols[seed%5],seed,lit);t.repeat.set(1,1);
  const m=add(g,B(w,h,d),'#ffffff',{y:h/2,map:t,ink:0.06});
  const roof=add(g,new THREE.CylinderGeometry(0.0001,1,1,4,1),'#5d6f92',{y:h+1.6,ry:Math.PI/4,box:false,ink:0.05});roof.scale.set(w*0.72,3.2,d*0.72);
  add(g,B(0.9,2.2,0.9),'#b55a3c',{x:w*0.25,y:h+2.5,ink:0.04});return g}
const HOUSES=[];
for(let i=0;i<14;i++){const x=-70+i*10.5;if(Math.abs(x)<16)continue;HOUSES.push(house(P,x,-34-(i%3)*3,0,i,9.5,10+(i%4)*2))}
for(let i=0;i<10;i++){HOUSES.push(house(P,-17-(i%2)*2,-25+i*9.6,Math.PI/2,i+3,9,10+(i%3)*2.5,8));HOUSES.push(house(P,17+(i%2)*2,-25+i*9.6,-Math.PI/2,i+7,9,10+(i%3)*2.5,8))}
for(let i=0;i<16;i++){const a=i/16*Math.PI*2;house(P,Math.cos(a)*140,-62+Math.sin(a)*140,-a+Math.PI/2,i,14,14+(i%3)*4,10)}
// trees
function tree(par,x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);par.add(g);add(g,new THREE.CylinderGeometry(0.2,0.3,2.4,6),'#6b4a2e',{y:1.2,box:false,ink:0.03});add(g,new THREE.SphereGeometry(1.6,10,8),'#4f9a4a',{y:3.4,box:false,ink:0.04});add(g,new THREE.SphereGeometry(1.1,10,8),'#62ae58',{y:4.6,x:0.4,box:false,ink:0.04})}
for(let i=0;i<10;i++){tree(P,-8,-8-i*5.5,1);tree(P,8,-8-i*5.5,1)}
// lamps (for night)
const LAMPS=[];for(let i=0;i<8;i++){const x=i%2?5.5:-5.5,z=6-Math.floor(i/2)*10;add(P,new THREE.CylinderGeometry(0.07,0.1,4,6),'#2a2a33',{x,z,y:2,box:false,ink:0.02});const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.28,10,8),new THREE.MeshBasicMaterial({color:'#ffe48a'}));bulb.position.set(x,4.1,z);P.add(bulb);LAMPS.push(bulb)}
// street cobble patch for night chase
add(P,new THREE.PlaneGeometry(14,70),'#ffffff',{rx:-Math.PI/2,y:0.02,z:-10,ink:0,map:TX.cobble,cast:false});

// POLICE facade (inside Paris set at x=+40 street)
const POL=new THREE.Group();POL.position.set(60,0,30);P.add(POL);
{const t=ctex(512,512,(g,w,h)=>{g.fillStyle='#3c4a78';g.fillRect(0,0,w,h);noise(g,w,h,'#000',300,.12);g.fillStyle='#2b1a2e';g.fillRect(150,180,212,332);g.fillStyle='#5a3d2c';g.fillRect(160,190,192,322);g.fillStyle='#e7c06a';g.beginPath();g.arc(330,360,10,0,7);g.fill();
  g.fillStyle='#e8ecff';g.font='900 72px DejaVu Sans';g.textAlign='center';g.fillText('POLICE',256,140);g.fillStyle='#ffd36a';g.fillRect(40,220,70,100);g.fillRect(402,220,70,100)});
  add(POL,B(9,8,6),'#ffffff',{y:4,map:t,ink:0.05});
  add(POL,B(3,0.18,0.7),'#7b5a3a',{x:-3.6,y:0.8,z:3.6});for(const dx of [-1.3,1.3])add(POL,B(0.15,0.8,0.5),'#7b5a3a',{x:-3.6+dx,y:0.4,z:3.6});}
const clockHand=[];{const c=add(POL,new THREE.CylinderGeometry(0.7,0.7,0.15,24),'#ffffff',{x:3.0,y:5.4,z:3.08,rx:Math.PI/2,box:false,ink:0.05});
  for(const L of [0.55,0.35]){const h=new THREE.Group();h.position.set(3.0,5.4,3.2);POL.add(h);add(h,B(0.06,L,0.04),'#2b1a2e',{y:L/2,ink:0});clockHand.push(h)}}

// HOTEL
const HO=mkSet('hotel',500);
add(HO,B(16,7,12),'#ffffff',{y:3.5,map:TX.wall,ink:0,cast:false}).material.side=THREE.BackSide;
add(HO,new THREE.PlaneGeometry(16,12),'#ffffff',{rx:-Math.PI/2,y:0.01,ink:0,map:TX.parquet,cast:false});
// window with tower view
const winT=ctex(512,768,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#f59e5b');gr.addColorStop(1,'#ffd89a');g.fillStyle=gr;g.fillRect(0,0,w,h);setCtx(g);tower(256,760,620,{col:'#6a4030'});g.fillStyle='#c9a0a8';for(let i=0;i<6;i++)g.fillRect(i*90,640+(i%2)*30,80,140)});
add(HO,new THREE.PlaneGeometry(3,4.4),'#ffffff',{x:4.5,y:3.6,z:-5.95,map:winT,ink:0,cast:false});
add(HO,B(3.3,0.2,0.3),'#f3efe6',{x:4.5,y:1.3,z:-5.85});add(HO,B(3.3,0.2,0.3),'#f3efe6',{x:4.5,y:5.9,z:-5.85});add(HO,B(0.15,4.4,0.2),'#f3efe6',{x:4.5,y:3.6,z:-5.85});
// curtains
for(const dx of [-2.1,2.1])add(HO,B(0.9,5.2,0.3),'#d4a53a',{x:4.5+dx,y:3.4,z:-5.7});
// table
add(HO,B(8,0.2,2.4),'#ffffff',{y:1.0,z:0,map:TX.cloth});add(HO,B(8.05,0.3,2.45),'#ffffff',{y:0.8,z:0,map:TX.cloth,ink:0.02});for(const [lx,lz] of [[-3.7,-1],[3.7,-1],[-3.7,1],[3.7,1]])add(HO,B(0.15,0.7,0.15),'#7b4a2a',{x:lx,y:0.35,z:lz});
// chandelier
const CH=new THREE.Group();CH.position.set(0,7,0);HO.add(CH);add(CH,new THREE.CylinderGeometry(0.03,0.03,1.6,6),'#2b1a2e',{y:-0.8,box:false,ink:0});
add(CH,new THREE.TorusGeometry(0.9,0.09,6,24),'#e8b84a',{y:-1.7,rx:Math.PI/2,box:false,ink:0.03});
for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const b=new THREE.Mesh(new THREE.SphereGeometry(0.12,8,6),new THREE.MeshBasicMaterial({color:'#fff6b0'}));b.position.set(Math.cos(a)*0.9,-1.5,Math.sin(a)*0.9);CH.add(b)}
// easel board (card texture redrawn)
const boardC=document.createElement('canvas');boardC.width=640;boardC.height=800;const boardT=new THREE.CanvasTexture(boardC);boardT.colorSpace=THREE.SRGBColorSpace;
const BOARD=new THREE.Group();BOARD.position.set(-3.6,0,-3.5);BOARD.rotation.y=0.35;HO.add(BOARD);
add(BOARD,B(2.6,3.2,0.12),'#ffffff',{y:2.6,map:boardT,ink:0.04});
for(const dx of [-1,1])beam(BOARD,[dx*1.1,0,0.3],[dx*0.9,4.3,-0.05],0.12,'#7b5a3a');

// HOME (Poisson) + calendar
const HM=mkSet('home',800);
add(HM,B(10,6,10),'#ffffff',{y:3,map:TX.beige,ink:0,cast:false}).material.side=THREE.BackSide;
add(HM,new THREE.PlaneGeometry(10,10),'#ffffff',{rx:-Math.PI/2,y:0.01,ink:0,map:TX.parquet,cast:false});
add(HM,B(2.2,0.7,1.4),'#3f7a6a',{x:0,y:0.35,z:-3.4});add(HM,B(2.2,1.6,0.4),'#3f7a6a',{x:0,y:0.9,z:-4});
for(const dx of [-1.2,1.2])add(HM,B(0.35,1.0,1.4),'#3f7a6a',{x:dx,y:0.5,z:-3.4});
add(HM,B(0.9,1.4,0.9),'#7b4a2a',{x:2.6,y:0.7,z:-3.6});
const lampS=add(HM,new THREE.CylinderGeometry(0.3,0.5,0.6,12,1,true),'#f2c94c',{x:2.6,y:1.9,z:-3.6,box:false,ink:0.03});
const calC=document.createElement('canvas');calC.width=600;calC.height=760;const calT=new THREE.CanvasTexture(calC);calT.colorSpace=THREE.SRGBColorSpace;
const CAL=add(HM,B(1.5,1.9,0.06),'#ffffff',{x:-2.6,y:2.6,z:-4.95,map:calT,ink:0.03});
const PAGE=new THREE.Group();PAGE.position.set(-2.6,3.55-0.43,-4.9);HM.add(PAGE);
const pageC=document.createElement('canvas');pageC.width=600;pageC.height=560;const pageT=new THREE.CanvasTexture(pageC);pageT.colorSpace=THREE.SRGBColorSpace;
const pageM=add(PAGE,new THREE.PlaneGeometry(1.5,1.4),'#ffffff',{y:-0.7,map:pageT,ink:0});pageM.material=new THREE.MeshToonMaterial({map:pageT,gradientMap:grad});{const bk=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.4),new THREE.MeshToonMaterial({color:'#efe6d0',gradientMap:grad}));bk.rotation.y=Math.PI;bk.position.y=-0.7;PAGE.add(bk)}

// ---------- lights ----------
const hemi=new THREE.HemisphereLight('#ffffff','#556',0.9);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff',2.2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:200});sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.02;scene.add(sun);scene.add(sun.target);
const amb=new THREE.AmbientLight('#fff',0.25);scene.add(amb);
const LIGHTS={
  day:{top:'#6cbcf0',bot:'#dff3fb',fog:'#cfe7f3',sun:'#fff3dc',si:2.3,hemi:['#dff2ff','#7a8a6a',1.0],az:-0.6,el:0.9,sunC:'#fff6c8'},
  gold:{top:'#f07a4a',bot:'#ffd89a',fog:'#f6c38c',sun:'#ffc27a',si:2.4,hemi:['#ffd6a8','#7a5a6a',0.9],az:0.9,el:0.35,sunC:'#ffe39a'},
  night:{top:'#0f1638',bot:'#3d4f8f',fog:'#2a3566',sun:'#9fb2ff',si:0.9,hemi:['#5a6ab0','#202030',0.7],az:-0.4,el:0.8,sunC:'#e8ecff'},
  indoor:{top:'#f07a4a',bot:'#ffd89a',fog:'#5a2a30',sun:'#ffd9a0',si:1.6,hemi:['#ffe2c0','#6a3a40',1.1],az:0.5,el:1.1,sunC:'#ffe39a'},
};
scene.fog=new THREE.Fog('#fff',60,420);
function applyLight(k,center){const L=LIGHTS[k];const g=skyC.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,L.top);gr.addColorStop(0.55,L.bot);gr.addColorStop(1,L.bot);g.fillStyle=gr;g.fillRect(0,0,4,256);skyT.needsUpdate=true;
  scene.fog.color.set(L.fog);sun.color.set(L.sun);sun.intensity=L.si;hemi.color.set(L.hemi[0]);hemi.groundColor.set(L.hemi[1]);hemi.intensity=L.hemi[2];
  const d=new THREE.Vector3(Math.sin(L.az)*Math.cos(L.el),Math.sin(L.el),Math.cos(L.az)*Math.cos(L.el));
  sun.position.copy(center).addScaledVector(d,80);sun.target.position.copy(center);
  sunM.position.copy(cam.position).addScaledVector(new THREE.Vector3(-d.x,0,-d.z).normalize().multiplyScalar(-1).add(new THREE.Vector3(0,0,0)),0);
  const sd=new THREE.Vector3(d.x,Math.max(d.y,0.18),d.z).normalize();sunM.position.copy(cam.position).addScaledVector(sd,600);sunM.lookAt(cam.position);sunM.material.color.set(L.sunC);
  LAMPS.forEach(l=>l.material.color.set(k==='night'?'#ffe48a':'#d8d0b0'));
  clouds.forEach(c=>{c.material.opacity=k==='night'?0.25:0.95})}

// ---------- cards ----------
const CARDS={};const PXM=0.0024;
function card(name,w=700,h=1100,ax=350,ay=1060,blob=true){if(CARDS[name])return CARDS[name];
  const c=document.createElement('canvas');c.width=w;c.height=h;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
  const geo=new THREE.PlaneGeometry(w*PXM,h*PXM);geo.translate((w/2-ax)*PXM,(ay-h/2)*PXM,0);
  const mat=new THREE.MeshToonMaterial({map:t,gradientMap:grad,transparent:true,alphaTest:0.5,side:THREE.DoubleSide});
  const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:t,alphaTest:0.5});
  const g=new THREE.Group();g.add(m);
  if(blob){const b=new THREE.Mesh(new THREE.CircleGeometry(0.42,24),new THREE.MeshBasicMaterial({color:'#2b1a2e',transparent:true,opacity:0.28,depthWrite:false}));b.rotation.x=-Math.PI/2;b.position.y=0.015;b.scale.y=0.45;g.add(b)}
  scene.add(g);return CARDS[name]={g,m,c,t,ax,ay,key:null}}
function drawCard(cd,key,fn){if(cd.key!==key){const x=cd.c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,cd.c.width,cd.c.height);setCtx(x);fn(cd.ax,cd.ay);cd.t.needsUpdate=true;cd.key=key}}
function place(cd,set,x,y,z,s=1,yawOff=0){cd.g.visible=true;const S=SETS[set];cd.g.position.set(S.position.x+x,y,z);cd.g.scale.setScalar(s);
  const p=cd.g.position;cd.g.rotation.y=Math.atan2(cam.position.x-p.x,cam.position.z-p.z)+yawOff}
const q=v=>Math.round(v*100)/100;
function actor(name,set,x,z,s,o,y=0){const cd=card(name);const key=JSON.stringify(o,(k,v)=>typeof v==='number'?q(v):(typeof v==='function'?'fn':v));
  drawCard(cd,key,(ax,ay)=>char(ax,ay,1,o));place(cd,set,x,y,z,s)}
function prop(name,set,x,y,z,s,key,fn,w=800,h=600,ax=400,ay=300,blob=false){const cd=card(name,w,h,ax,ay,blob);drawCard(cd,key,fn);place(cd,set,x,y,z,s);return cd}

// ---------- story ----------
const blinkAt=(f,s)=>((f+s*37)%97)<3, bob=(f,s,a)=>Math.sin(f*0.18+s)*a;
const LUSTIG={coat:'#3c3f63',pants:'#2a2a40',hat:'top',must:true,tie:'#b8323a',skin:'#f2c49b'};
const OFFI={...LUSTIG,hat:'bowler',sash:true,coat:'#2d2d3a'};
const POISSON={coat:'#7d6a4f',pants:'#4d3f2f',hat:'bowler',glasses:true,beard:'#8a6a4a',tie:'#2f6e5a',skin:'#f5cfae'};
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
function camKeys(f,a,b,p0,p1,l0,l1,fov0=50,fov1=fov0,roll=0){const t=ss(prog(f,a,b));return {p:p0.clone().lerp(p1,t),l:l0.clone().lerp(l1,t),fov:lerp(fov0,fov1,t),roll}}
let shake=0;
const SH=[
 [0,f=>{ // hook: Lustig + tower golden
   const c=camKeys(f,0,86,V(-0.2,1.05,6.6),V(0,1.15,5.5),V(0.2,3.6,-4),V(0.3,3.2,-4),58,54);
   actor('lustig','paris',0.55,0.4,1,{...LUSTIG,expr:f>48?'sly':'smile',blink:blinkAt(f,1),aL:f>40?-0.9-0.5*eo(prog(f,40,50)):0.2,aR:-0.2});
   prop('sign1','paris',-0.6,0.0,0.2,1,'v'+q(back(prog(f,40,52))),(ax,ay)=>sign(400,250,380,170,'VENDU','#d1342f',-0.08,1),800,800,400,780,true).g.scale.setScalar(Math.max(0.001,back(prog(f,40,52))));
   prop('yr','paris',-0.2,3.0,-1.5,1.4,'1925',()=>text('1925',400,300,170,'#fff4d6',-0.05));
   return {env:'paris',light:'gold',c}}],
 [86,f=>{ // encore stamp on tower
   const c=camKeys(f,86,120,V(0,1.15,5.5),V(-0.1,1.25,5.0),V(0.3,3.2,-4),V(0.2,5,-12),54,56);
   actor('lustig','paris',0.55,0.4,1,{...LUSTIG,expr:f>104?'wink':'sly',aL:-1.4,aR:-0.2});
   prop('sign1','paris',-0.6,0.0,0.2,1,'v1',(ax,ay)=>sign(400,250,380,170,'VENDU','#d1342f',-0.08,1),800,800,400,780,true);
   if(f>=94){const sc=f<96?3:lerp(3,1,eo(prog(f,96,100)));prop('stamp','paris',0,24,-50,7*sc,'st',()=>{X.save();X.translate(400,300);X.rotate(-0.2);X.lineWidth=14;X.strokeStyle='#d1342f';X.strokeRect(-300,-110,600,220);text('ENCORE !',0,0,130,'#d1342f',0,false);X.restore()})}
   if(f>=100&&f<108)shake=Math.sin((f-100)*2.6)*0.06*(1-(f-100)/8);
   if(f>=100)prop('puff','paris',0,22,-48,10,'p'+f,()=>puff(400,300,prog(f,100,118),10,'#f3e3c0'));
   return {env:'paris',light:'gold',c}}],
 [120,f=>{ // disguise MCU
   const on=f>=150;
   const c=camKeys(f,120,200,V(0.6,1.45,3.3),V(0.5,1.5,2.7),V(0.6,1.25,0),V(0.6,1.3,0),45,45,0.02);
   actor('lustig','paris',0.6,0.3,1,on?{...OFFI,expr:'sly',blink:blinkAt(f,2),aR:-0.5,aL:0.2,propR:()=>suitcase(0,240,0.8)}:{...LUSTIG,expr:'smile',blink:blinkAt(f,2),aL:0.2,aR:-0.1});
   if(on){const p=back(prog(f,150,162));prop('badge','paris',0.6,1.95,0.35,Math.max(0.001,p*0.6),'mb',()=>{shape(()=>rr(140,230,520,140,26),'#fff7e0',7);text('MINISTÈRE',400,300,82,'#2a52be',0,false)})}
   if(f>=144&&f<168)prop('puff','paris',0.6,0.4,0.6,2.4,'p'+f,()=>puff(400,300,prog(f,144,166),12));
   return {env:'paris',light:'day',c}}],
 [200,f=>{ // hotel meeting
   const c=camKeys(f,238,285,V(-4.0,2.2,4.2),V(0.6,2.6,5.2),V(-4.4,1.5,0),V(0,1.5,-1.6),46,40);
   dealers(f,'smile',0);
   const lx=lerp(-5.4,-4.5,eo(prog(f,205,235)));
   actor('lustig','hotel',lx,0.2,1,{...OFFI,expr:'smile',blink:blinkAt(f,3),aL:-2.6,aR:-0.2,step:f<235?f*0.5:0});
   return {env:'hotel',light:'indoor',c,board:[0,0,0]}}],
 [285,f=>{ // secret board
   const c=camKeys(f,285,372,V(-1.6,2.3,3.6),V(-2.0,2.5,2.6),V(-3.6,2.5,-3.5),V(-3.6,2.6,-3.5),50,48);
   actor('lustig','hotel',-1.8,-2.6,1,{...OFFI,expr:f>350?'worry':'sly',blink:blinkAt(f,4),aL:-2.2,aR:-0.2,flip:true});
   return {env:'hotel',light:'indoor',c,board:[prog(f,318,345),0,prog(f,350,372)]}}],
 [372,f=>{ // dismantle + shock
   const c=camKeys(f,372,406,V(-2.2,2.4,3.0),V(0,2.8,5.4),V(-3.2,2.4,-3.5),V(-0.5,1.6,0),48,52);
   dealers(f,f>384?'shock':'wow',f>384?Math.abs(Math.sin((f-384)*0.4)):0);
   return {env:'hotel',light:'indoor',c,board:[1,eo(prog(f,374,402)),1]}}],
 [406,f=>{ // Poisson believes, pays
   const st=f>=426&&f<452;
   const c=camKeys(f,406,476,V(0.6,2.3,3.4),V(1.1,2.2,2.8),V(0.3,1.8,-1.4),V(0.6,1.7,-1.4),42,42,-0.02);
   actor('poisson','hotel',0.3,-1.5,1,{...POISSON,expr:st?'star':(f>=452?'smile':'wow'),blink:!st&&blinkAt(f,6),aR:f>452?-1.3*eo(prog(f,452,462)):-0.1,aL:0.1},0.45);
   if(f>=452){const p=eo(prog(f,452,470));prop('bag','hotel',lerp(0.5,1.8,p),1.12,lerp(-0.6,0.3,p),0.6,'bag',()=>bag(400,580,2.2),800,600,400,580)}
   if(st)for(let i=0;i<5;i++){const a=f*0.1+i*1.25;prop('spk'+i,'hotel',0.3+Math.cos(a)*0.7,2.5+Math.sin(a)*0.35,-1.3,0.25,'s',()=>text('✦',400,300,260,'#f6c73a',0,false))}
   return {env:'hotel',light:'indoor',c}}],
 [476,f=>{ // bribe under table
   const c=camKeys(f,476,536,V(0,0.4,3.2),V(0.3,0.42,2.9),V(0,0.45,-0.5),V(0.3,0.45,-0.5),60,60);
   const p=ss(prog(f,482,512));const ex=lerp(-0.8,0.8,p);
   prop('env','hotel',ex,0.3,0.0,0.45,'e',()=>{envelope(400,330,2.4);text('pot-de-vin',400,140,64,'#fff4d6')});
   // legs as cards
   actor('poisson','hotel',-0.95,-0.3,1,{...POISSON,expr:'sly',aR:-1.4});
   actor('lustig','hotel',0.95,-0.3,1,{...OFFI,expr:f>520?'wink':'sly',aL:-1.2,flip:true});
   return {env:'hotel',light:'indoor',c}}],
 [536,f=>{ // night escape
   const p=prog(f,536,590);const lz=lerp(0,-26,p);
   const c={p:V(3.2,1.5,lz+5.5),l:V(0,1.2,lz-2),fov:50,roll:0.03};
   actor('lustig','paris',0,lz,1,{...OFFI,expr:'sly',step:f*0.5,lean:0.18,aL:0.9*Math.sin(f*0.5),aR:-0.3,propR:()=>suitcase(0,280,0.85)},Math.abs(Math.sin(f*0.5))*0.08);
   for(let i=0;i<5;i++){const qq=(f*0.03+i*0.2)%1;prop('note'+i,'paris',Math.sin(i*2.1)*0.6,1.4+qq*1.5,lz+1+qq*3,0.3,'n'+i,()=>note(400,300,i))}
   return {env:'paris',light:'night',c}}],
 [590,f=>{ // police: nobody
   const c=camKeys(f,590,635,V(60,1.9,47),V(60,2.1,44),V(60,3.2,30),V(60,3.3,30),50,48);
   clockHand.forEach((h,i)=>h.rotation.z=-f*(i?0.02:0.25));
   prop('leaf','paris',lerp(56,64,prog(f,595,635)),0.3+Math.abs(Math.sin(f*0.3))*0.6,37,0.4,'l',()=>shape(()=>ell(400,300,90,50),'#b98a3a',8));
   return {env:'paris',light:'night',c}}],
 [635,f=>{ // shame
   const up=eo(prog(f,650,662));
   const c=camKeys(f,635,690,V(0,1.7,1.4),V(0,1.75,0.9),V(0,1.4,-2.6),V(0,1.45,-2.6),50,46,0.03*Math.sin(f*0.1));
   actor('poisson','home',0,-2.5,1,{...POISSON,expr:'worry',blush:0.85,blink:blinkAt(f,7),aL:-1.2*up-0.1,aR:1.2*up+0.1,lean:Math.sin(f*0.4)*0.01},0.25);
   if(up>0){const cd=prop('paper','home',0,1.0,-2.2,0.85,'pp',()=>{shape(()=>rr(120,120,560,380,10),'#f8f5ea');X.fillStyle='#999';for(let i=0;i<6;i++)X.fillRect(160,230+i*40,i%2?200:480,16);text('LE JOURNAL',400,170,54,INK,0,false)});cd.g.scale.set(0.85*up,0.85,0.85)}
   for(let i=0;i<3;i++){const qq=((f*0.04+i*0.33)%1);prop('drop'+i,'home',-0.45+i*0.45,2.5-qq*0.5,-2.4,0.15,'d',()=>shape(()=>ell(400,300,60,85),'#8fd3f4',10))}
   return {env:'home',light:'indoor',c}}],
 [690,f=>{ // calendar flip
   const c=camKeys(f,690,737,V(-2.6,2.6,-1.4),V(-2.6,2.6,-1.9),V(-2.6,2.6,-5),V(-2.6,2.6,-5),40,40);
   return {env:'home',light:'indoor',c,cal:prog(f,700,724)}}],
 [737,f=>{ // return
   const c=camKeys(f,737,765,V(-0.4,1.3,5.6),V(-0.2,1.3,5.0),V(0.3,3.4,-4),V(0.3,3.3,-4),56,55);
   const x=lerp(4.5,0.9,eo(prog(f,737,760)));
   actor('lustig','paris',x,0.4,1,{...LUSTIG,expr:'smile',step:f<760?f*0.5:0,hatLift:f>756?30*Math.sin(prog(f,756,765)*Math.PI):0,aR:f>754?-2.4:-0.2,aL:0.2,blink:blinkAt(f,8)});
   return {env:'paris',light:'day',c}}],
 [765,f=>{ // à vendre
   const t=ss(prog(f,765,805));
   const c={p:V(lerp(-0.1,0.1,t),lerp(1.2,1.3,t),lerp(6.2,5.0,t)),l:V(0.1,lerp(3.3,2.3,t),-4),fov:55,roll:lerp(0,-0.05,t)};
   const p=back(prog(f,780,792));
   actor('lustig','paris',0.55,0.4,1,{...LUSTIG,expr:f>793?'wink':'sly',aL:f>778?-1.0:0.2,aR:-0.2});
   prop('sign2','paris',-0.65,0,0.2,Math.max(0.001,p),'av',()=>sign(400,250,420,170,'À VENDRE','#2a52be',0.06,1),800,800,400,780,true);
   if(f>=782)prop('puff','paris',-0.8,0.8,0.4,2,'p'+f,()=>puff(400,300,prog(f,782,800),8));
   return {env:'paris',light:'day',c}}],
];
function dealers(f,expr,react){const cols=['#6d6a52','#5b6f7c','#7a5a44','#58705a'];
  for(let i=0;i<4;i++){const jump=react*Math.abs(Math.sin(i+1))*0.12;
    actor('d'+i,'hotel',-2.4+i*1.6,-1.6,1,{coat:cols[i],hat:'cap',capc:['#4f4d3a','#3d4d5a','#5a3f2d','#3f5040'][i],expr,blink:blinkAt(f,i+5),look:-1,beard:i==2?'#5a4a3a':null,lean:react*0.08*(i%2?1:-1),aL:0.1,aR:-0.1,skin:['#f2c49b','#d9a07a','#f5cfae','#c88a62'][i]},0.45+jump)}}
function drawBoard(rust,parts,coins){const g=boardC.getContext('2d');setCtx(g);g.fillStyle='#2f4a3a';g.fillRect(0,0,640,800);g.lineWidth=16;g.strokeStyle='#7b5a3a';g.strokeRect(0,0,640,800);
  tower(320,760,680,{col:'#e8e2cf',rust,parts});text('SECRET',320,60,64,'#f6c73a',-0.04);
  if(coins>0)for(let i=0;i<18;i++){const p=cl(coins*1.5-rnd(i)*0.6);if(p>0)coin(160+rnd(i+2)*320,lerp(380+rnd(i+4)*200,820,p*p),22,i)}
  boardT.needsUpdate=true}
function drawCal(p){const g=calC.getContext('2d');setCtx(g);g.fillStyle='#fff';g.fillRect(0,0,600,760);g.fillStyle='#d1342f';g.fillRect(0,0,600,200);
  g.fillStyle='#2b1a2e';for(let i=0;i<5;i++){g.beginPath();g.arc(80+i*110,40,16,0,7);g.fill()}
  text('JUIN',300,360,130,INK,0,false);text('1925',300,580,150,'#d1342f',0,false);calT.needsUpdate=true;
  const h=pageC.getContext('2d');setCtx(h);h.fillStyle='#fbf6ea';h.fillRect(0,0,600,560);text('MAI',300,160,130,INK,0,false);text('1925',300,380,150,'#d1342f',0,false);pageT.needsUpdate=true;
  PAGE.rotation.x=-p*Math.PI*0.95;PAGE.visible=p<0.98}

let lastBoard='';
window.renderFrame=f=>{
  let i=SH.length-1;while(SH[i][0]>f)i--;
  Object.values(CARDS).forEach(c=>c.g.visible=false);shake=0;
  // first pass camera from shot (cards need cam for yaw) -> compute twice
  const r=SH[i][1](f);const ox=SETS[r.env].position.x;r.c.p.x+=ox;r.c.l.x+=ox;
  cam.position.copy(r.c.p);cam.fov=r.c.fov;cam.up.set(0,1,0);cam.lookAt(r.c.l);cam.rotateZ(r.c.roll||0);cam.position.x+=shake;cam.position.y+=shake*0.6;cam.updateProjectionMatrix();
  SH[i][1](f); // re-place cards facing final camera
  for(const k in SETS)SETS[k].visible=(k===r.env);
  sky.visible=sunM.visible=r.env==='paris';clouds.forEach(c=>c.visible=r.env==='paris');
  sky.position.copy(cam.position);
  clouds.forEach((c,j)=>{const a=c.userData.a+f*0.0008;c.position.set(cam.position.x+Math.cos(a)*c.userData.r,c.userData.y,cam.position.z+Math.sin(a)*c.userData.r);c.lookAt(cam.position)});
  scene.fog.near=r.env==='paris'?60:30;scene.fog.far=r.env==='paris'?420:200;
  const center=r.c.l.clone();if(r.env!=='paris')center.x+=0;
  applyLight(r.light,new THREE.Vector3(r.c.l.x,0,r.c.l.z));
  if(r.env==='paris'&&r.c.l.z<-10){Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40});}else Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14});sun.shadow.camera.updateProjectionMatrix();
  CH.rotation.z=Math.sin(f*0.05)*0.04;
  if(r.env==='hotel'){const b=r.board||[0,0,0];const k=b.map(q).join();if(k!==lastBoard){drawBoard(...b);lastBoard=k}}
  if(r.env==='home')drawCal(r.cal||0);
  R.render(scene,cam);
  // 2D post: vignette + flash
  const o=OUT.getContext('2d');o.drawImage(R.domElement,0,0);
  const g=o.createRadialGradient(540,960,520,540,960,1250);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(30,10,30,.35)');o.fillStyle=g;o.fillRect(0,0,W,H);
  const fl=f>=690&&f<697?1-(f-690)/7:0;if(fl){o.fillStyle=`rgba(255,255,255,${fl})`;o.fillRect(0,0,W,H)}
  return OUT.toDataURL('image/jpeg',0.93)};
const OUT=document.createElement('canvas');OUT.width=W;OUT.height=H;
window.ready=true;
