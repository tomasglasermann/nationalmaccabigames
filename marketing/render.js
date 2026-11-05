const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1080,height:1920}, deviceScaleFactor:1 });
  await p.goto('file://'+__dirname+'/story.html'); await p.waitForTimeout(500);
  await p.screenshot({ path: __dirname+'/nmb-story-interest.png' });
  await p.evaluate(()=>document.body.classList.add('guide'));
  await p.screenshot({ path: __dirname+'/nmb-story-interest-GUIDE.png' });
  const r = await p.evaluate(()=>{const s=document.querySelector('.slot').getBoundingClientRect();return [s.top,s.bottom]});
  console.log('slot', r); await b.close();
})();
