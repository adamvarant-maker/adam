var X=null;const INK='#2b1a2e';
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ss=t=>{t=cl(t);return t*t*t*(t*(t*6-15)+10)};
const eo=t=>{t=cl(t);return 1-Math.pow(1-t,3)};
const back=t=>{t=cl(t);const c=1.9;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
const prog=(f,a,b)=>cl((f-a)/(b-a));
function rnd(i){const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)}

// ---------- primitives ----------
function shape(path,fill,lw=6){X.beginPath();path();if(fill){X.fillStyle=fill;X.fill()}if(lw){X.lineWidth=lw;X.strokeStyle=INK;X.lineJoin='round';X.lineCap='round';X.stroke()}}
function rr(x,y,w,h,r){X.moveTo(x+r,y);X.arcTo(x+w,y,x+w,y+h,r);X.arcTo(x+w,y+h,x,y+h,r);X.arcTo(x,y+h,x,y,r);X.arcTo(x,y,x+w,y,r);X.closePath()}
function ell(x,y,rx,ry){X.ellipse(x,y,rx,ry,0,0,Math.PI*2)}
function text(s,x,y,size,fill,rot=0,stroke=true,font='900'){X.save();X.translate(x,y);X.rotate(rot);X.font=`${font} ${size}px "DejaVu Sans",Arial,sans-serif`;X.textAlign='center';X.textBaseline='middle';if(stroke){X.lineWidth=size*0.14;X.strokeStyle=INK;X.lineJoin='round';X.strokeText(s,0,0)}X.fillStyle=fill;X.fillText(s,0,0);X.restore()}

// ---------- character ----------
// origin at soles. o: {skin,coat,pants,hat,must,expr,blink,aL,aR,prop,flip,blush,glasses,sash,lean,step}
function char(x,y,s,o){
  X.save();X.translate(x,y);X.scale(s*(o.flip?-1:1),s);X.rotate(o.lean||0);
  const st=o.step||0;
  // shadow
  X.fillStyle='rgba(40,20,50,.25)';X.beginPath();ell(0,0,110,18);X.fill();
  // legs
  const l1=Math.sin(st)*22,l2=-l1;
  shape(()=>rr(-60+l1,-130,48,128,18),o.pants||'#3a3550');
  shape(()=>rr(12+l2,-130,48,128,18),o.pants||'#3a3550');
  shape(()=>rr(-72+l1,-24,70,30,14),'#231a26',5);
  shape(()=>rr(4+l2,-24,70,30,14),'#231a26',5);
  // arms behind
  const arm=(sx,a,prop)=>{X.save();X.translate(sx,-330);X.rotate(a);shape(()=>rr(-20,0,40,170,20),o.coat||'#455');shape(()=>ell(0,180,26,26),o.skin||'#f2c49b',5);if(prop)prop();X.restore()};
  // torso
  shape(()=>rr(-95,-370,190,260,70),o.coat||'#455');
  if(o.sash){X.save();X.beginPath();rr(-95,-370,190,260,70);X.clip();
    const cs=['#2a52be','#fff','#d1342f'];cs.forEach((c,i)=>{X.fillStyle=c;X.beginPath();X.moveTo(-95,-330+i*26);X.lineTo(95,-210+i*26);X.lineTo(95,-184+i*26);X.lineTo(-95,-304+i*26);X.fill()});X.restore();
    shape(()=>ell(45,-300,22,22),'#f3c03a',5);}
  // buttons/ tie
  shape(()=>{X.moveTo(0,-365);X.lineTo(-16,-330);X.lineTo(0,-250);X.lineTo(16,-330);X.closePath()},o.tie||'#c23b3b',4);
  arm(-100,o.aL??0.15,o.propL);
  arm(100,o.aR??-0.15,o.propR);
  // head
  const hy=-470;
  shape(()=>ell(0,hy,98,108),o.skin||'#f2c49b');
  // ears
  shape(()=>ell(-98,hy+5,16,24),o.skin||'#f2c49b',5);shape(()=>ell(98,hy+5,16,24),o.skin||'#f2c49b',5);
  if(o.blush){X.fillStyle=`rgba(230,60,60,${o.blush})`;X.beginPath();ell(-52,hy+30,34,20);ell(52,hy+30,34,20);X.fill();}
  // eyes
  const e=o.expr||'smile';
  const ey=hy-12;
  if(o.blink){X.lineWidth=7;X.strokeStyle=INK;X.beginPath();X.moveTo(-50,ey);X.lineTo(-20,ey);X.moveTo(20,ey);X.lineTo(50,ey);X.stroke();}
  else if(e==='wink'){shape(()=>ell(-35,ey,15,20),'#fff',5);X.fillStyle=INK;X.beginPath();ell(-33,ey+3,8,10);X.fill();X.lineWidth=7;X.beginPath();X.moveTo(20,ey);X.quadraticCurveTo(35,ey-14,52,ey);X.stroke();}
  else if(e==='star'){[-35,35].forEach(sx=>{X.save();X.translate(sx,ey);X.fillStyle='#f6c73a';X.beginPath();for(let i=0;i<10;i++){const r=i%2?10:26,a=i*Math.PI/5-Math.PI/2;X.lineTo(Math.cos(a)*r,Math.sin(a)*r)}X.closePath();X.fill();X.lineWidth=4;X.strokeStyle=INK;X.stroke();X.restore()})}
  else {const big=e==='wow'||e==='shock';const r=big?22:16;
    [-35,35].forEach(sx=>{shape(()=>ell(sx,ey,r,r*1.25),'#fff',5);X.fillStyle=INK;X.beginPath();ell(sx+(o.look||0)*6,ey+3,big?7:9,big?9:11);X.fill()});
    if(e==='sly'){X.fillStyle=o.skin||'#f2c49b';X.fillRect(-58,ey-24,116,18);X.lineWidth=6;X.beginPath();X.moveTo(-56,ey-8);X.lineTo(-14,ey-4);X.moveTo(14,ey-4);X.lineTo(56,ey-8);X.stroke();}
    if(e==='worry'){X.lineWidth=6;X.beginPath();X.moveTo(-55,ey-30);X.lineTo(-18,ey-40);X.moveTo(18,ey-40);X.lineTo(55,ey-30);X.stroke();}}
  if(o.glasses){X.lineWidth=5;X.strokeStyle=INK;X.beginPath();ell(-35,ey,28,28);X.moveTo(-7,ey);X.lineTo(7,ey);ell(35,ey,28,28);X.stroke();}
  // nose
  shape(()=>ell(0,hy+18,16,13),o.nose||'#e8a77e',4);
  // mouth
  X.lineWidth=6;X.strokeStyle=INK;X.beginPath();const my=hy+55;
  if(e==='wow'||e==='shock'){shape(()=>ell(0,my+5,16,e==='shock'?24:16),'#6b1f2a',5)}
  else if(e==='worry'){X.moveTo(-28,my+8);X.quadraticCurveTo(0,my-8,28,my+8);X.stroke()}
  else {X.moveTo(-34,my);X.quadraticCurveTo(0,my+(e==='sly'||e==='wink'?18:28),40,my-(e==='sly'||e==='wink'?10:0));X.stroke()}
  // mustache
  if(o.must){shape(()=>{X.moveTo(0,hy+34);X.bezierCurveTo(-30,hy+22,-60,hy+30,-72,hy+46);X.bezierCurveTo(-50,hy+50,-20,hy+48,0,hy+40);X.bezierCurveTo(20,hy+48,50,hy+50,72,hy+46);X.bezierCurveTo(60,hy+30,30,hy+22,0,hy+34)},'#3b2416',4)}
  if(o.beard){shape(()=>{X.moveTo(-70,hy+40);X.quadraticCurveTo(0,hy+170,70,hy+40);X.quadraticCurveTo(0,hy+90,-70,hy+40)},o.beard,5)}
  // hat
  if(o.hat==='top'){X.save();X.translate(0,hy-80);X.rotate(o.hatTilt||0);X.translate(0,-(o.hatLift||0));shape(()=>rr(-62,-130,124,130,10),'#1d1a24');X.fillStyle='#b8323a';X.fillRect(-60,-35,120,22);shape(()=>rr(-100,-8,200,22,11),'#1d1a24');X.restore()}
  if(o.hat==='bowler'){X.save();X.translate(0,hy-80);X.rotate(o.hatTilt||0);X.translate(0,-(o.hatLift||0));shape(()=>{X.moveTo(-70,0);X.bezierCurveTo(-70,-110,70,-110,70,0);X.closePath()},'#4a3626');shape(()=>rr(-100,-8,200,20,10),'#4a3626');X.restore()}
  if(o.hat==='cap'){shape(()=>{X.moveTo(-95,hy-55);X.bezierCurveTo(-90,hy-140,90,hy-140,95,hy-55);X.closePath()},o.capc||'#6d6a52');shape(()=>rr(-20,hy-70,130,22,11),o.capc||'#6d6a52',5)}
  X.restore();
}

// ---------- props ----------
function sign(x,y,w,h,label,col,rot=0,s=1){X.save();X.translate(x,y);X.rotate(rot);X.scale(s,s);
  shape(()=>rr(-12,0,24,h*0.9,6),'#8a5a32');shape(()=>rr(-w/2,-h/2,w,h,14),'#f6ecd2',7);
  text(label,0,0,h*0.42,col,0,false);X.restore()}
function bag(x,y,s,label='₣'){X.save();X.translate(x,y);X.scale(s,s);shape(()=>{X.moveTo(-60,0);X.bezierCurveTo(-90,-110,-40,-120,-25,-130);X.lineTo(25,-130);X.bezierCurveTo(40,-120,90,-110,60,0);X.closePath()},'#d9b26a');shape(()=>rr(-30,-145,60,20,8),'#a07b3c',5);text(label,0,-60,60,'#7a5420',0,false);X.restore()}
function suitcase(x,y,s){X.save();X.translate(x,y);X.scale(s,s);shape(()=>rr(-70,-90,140,90,14),'#7b4a2a');shape(()=>rr(-25,-112,50,26,10),null,6);X.fillStyle='#e7c06a';X.fillRect(-55,-55,10,20);X.fillRect(45,-55,10,20);X.restore()}
function coin(x,y,r,a){X.save();X.translate(x,y);X.scale(Math.abs(Math.cos(a))+0.15,1);shape(()=>ell(0,0,r,r),'#f3c43c',5);X.restore()}
function note(x,y,a){X.save();X.translate(x,y);X.rotate(a);shape(()=>rr(-40,-22,80,44,6),'#9fd39a',4);X.fillStyle='#5f9a5a';X.beginPath();ell(0,0,12,12);X.fill();X.restore()}
function envelope(x,y,s,rot=0){X.save();X.translate(x,y);X.rotate(rot);X.scale(s,s);shape(()=>rr(-70,-45,140,90,8),'#f1e6c8');X.lineWidth=5;X.beginPath();X.moveTo(-70,-45);X.lineTo(0,10);X.lineTo(70,-45);X.stroke();X.restore()}
function puff(x,y,p,n=9,col='#fff'){if(p<=0||p>=1)return;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+rnd(i)*.5,d=eo(p)*140,r=(1-p)*60+10;X.globalAlpha=1-p;shape(()=>ell(x+Math.cos(a)*d,y+Math.sin(a)*d*.8,r,r),col,4)}X.globalAlpha=1}

// ---------- tower ----------
function tower(cx,by,h,o={}){const w=h*0.42;const col=o.col||'#7a4b35';
  const parts=o.parts||0;
  const L=(i)=>{const p=cl(parts*1.6-i*0.15);return {dy:-eo(p)*900,r:p*(i%2?1:-1)*0.6,dx:p*(i%2?260:-260)}};
  X.save();
  const seg=(i,draw)=>{const d=L(i);X.save();X.translate(cx+d.dx,by+d.dy);X.rotate(d.r);draw();X.restore()};
  // legs + arch (piece 0)
  seg(0,()=>{shape(()=>{X.moveTo(-w/2,0);X.quadraticCurveTo(-w*0.3,-h*0.18,-w*0.2,-h*0.3);X.lineTo(w*0.2,-h*0.3);X.quadraticCurveTo(w*0.3,-h*0.18,w/2,0);X.lineTo(w*0.3,0);X.quadraticCurveTo(0,-h*0.24,-w*0.3,0);X.closePath()},col);
    X.lineWidth=3;X.strokeStyle='rgba(43,26,46,.55)';X.beginPath();for(let i=1;i<6;i++){const y=-h*0.05*i;X.moveTo(-w*0.45+i*w*0.04,y);X.lineTo(-w*0.33+i*w*0.03,y-h*0.04);X.moveTo(w*0.45-i*w*0.04,y);X.lineTo(w*0.33-i*w*0.03,y-h*0.04)}X.stroke();
    shape(()=>rr(-w*0.26,-h*0.33,w*0.52,h*0.035,4),col,5)});
  // middle (piece 1)
  seg(1,()=>{shape(()=>{X.moveTo(-w*0.2,-h*0.3);X.lineTo(-w*0.09,-h*0.6);X.lineTo(w*0.09,-h*0.6);X.lineTo(w*0.2,-h*0.3);X.closePath()},col);
    X.lineWidth=3;X.strokeStyle='rgba(43,26,46,.55)';X.beginPath();for(let i=0;i<6;i++){const t1=i/6,t2=(i+1)/6;const y1=-h*(0.3+0.3*t1),y2=-h*(0.3+0.3*t2),w1=w*(0.2-0.11*t1),w2=w*(0.2-0.11*t2);X.moveTo(-w1,y1);X.lineTo(w2,y2);X.moveTo(w1,y1);X.lineTo(-w2,y2)}X.stroke();
    shape(()=>rr(-w*0.13,-h*0.62,w*0.26,h*0.025,4),col,5)});
  // top (piece 2)
  seg(2,()=>{shape(()=>{X.moveTo(-w*0.09,-h*0.6);X.lineTo(-w*0.025,-h*0.95);X.lineTo(w*0.025,-h*0.95);X.lineTo(w*0.09,-h*0.6);X.closePath()},col);
    X.lineWidth=3;X.strokeStyle='rgba(43,26,46,.55)';X.beginPath();for(let i=0;i<7;i++){const t1=i/7,t2=(i+1)/7;const y1=-h*(0.6+0.35*t1),y2=-h*(0.6+0.35*t2),w1=w*(0.09-0.065*t1),w2=w*(0.09-0.065*t2);X.moveTo(-w1,y1);X.lineTo(w2,y2);X.moveTo(w1,y1);X.lineTo(-w2,y2)}X.stroke();
    shape(()=>rr(-w*0.035,-h*0.99,w*0.07,h*0.04,4),col,5);shape(()=>{X.moveTo(0,-h*0.99);X.lineTo(0,-h*1.05)},null,5)});
  // rust spots
  if(o.rust){for(let i=0;i<14;i++){const t=rnd(i+3),yy=-h*(0.05+0.85*t),ww=w*(0.45-0.38*t)*(rnd(i+9)*2-1);const r=cl(o.rust*1.4-rnd(i)*0.4)*h*0.03;if(r>1){X.fillStyle='#c1561d';X.beginPath();ell(cx+ww*0.8,by+yy,r*1.3,r);X.fill()}}}
  X.restore()}


function setCtx(c){X=c}
