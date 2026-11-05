const { chromium } = require('playwright');
const fs=require('fs'); const FPS=30; const dir=process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1080,height:1920}, deviceScaleFactor:1 });
  await p.goto('file://'+__dirname+'/video.html'); await p.waitForTimeout(800);
  const only=process.argv[3];
  if(only){ for(const t of only.split(',')){ await p.evaluate(t=>render(t),+t); await p.screenshot({path:`${dir}/t${t}.jpg`,quality:80,type:'jpeg'});} await b.close(); return; }
  const dur=await p.evaluate(()=>DUR); const n=Math.round(dur*FPS);
  for(let i=0;i<n;i++){ await p.evaluate(t=>render(t), i/FPS);
    await p.screenshot({ path: `${dir}/f${String(i).padStart(4,'0')}.jpg`, type:'jpeg', quality:92 }); }
  await b.close(); console.log('frames',n);
})();
