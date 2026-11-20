const {chromium}=require('playwright');const fs=require('fs'),path=require('path');(async()=>{
const [out,spec]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
let fr=[];for(const p of spec.split(',')){if(p.includes('-')){const[a,b]=p.split('-').map(Number);for(let i=a;i<=b;i++)fr.push(i)}else fr.push(+p)}
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1080,height:1920}});
await pg.goto('file://'+path.resolve('web/index.html'));await pg.waitForFunction('window.ready');
for(const f of fr){const d=await pg.evaluate(f=>renderFrame(f),f);fs.writeFileSync(`${out}/f${String(f).padStart(4,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64'));if(f%100==0)console.log(f)}
await b.close();})();
