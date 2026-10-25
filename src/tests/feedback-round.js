// Feedback from inside a round (touch screen): the issue carries the exercise (item id, prompt, typed answer).
// Usage: PORT=8765 node feedback-round.js  (exits 1 on any failure)
const {chromium}=require('playwright-core');
(async()=>{
 const br=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});
 const p=await (await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 let body='';await p.route('https://api.github.com/**',async r=>{if(r.request().url().includes('/issues')){body=JSON.parse(r.request().postData()).body;return r.fulfill({status:201,body:'{}'})}return r.fulfill({status:404,body:'{}'})});
 await p.route('**/sw.js',r=>r.abort());
 await p.goto('http://127.0.0.1:'+(process.env.PORT||8765)+'/index.html');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('nl-gh-token','x')});await p.reload();await p.waitForTimeout(400);
 await p.evaluate(()=>{const it=ITEMS.find(x=>x.id==='h1-het-hemd');start([{it,st:'write',slot:'fix'}],'Leren',false)});await p.waitForTimeout(200);
 await p.fill('#ti','de hemd');
 await p.tap('#fbk');await p.waitForTimeout(200);
 const pr=await p.$('.prompt, h2, .q');await (pr||await p.$('main')).tap();await p.waitForTimeout(300);
 await p.fill('#fbtext','Prompt is ambiguous');
 await p.tap('#fbsend');await p.waitForTimeout(900);
 const ok=/"item": "h1-het-hemd"/.test(body)&&/"typed": "de hemd"/.test(body)&&/"round": "Leren"/.test(body)&&!errs.length;
 console.log((ok?'✓ ':'✗ ')+'feedback from a round carries the item, the round and the typed answer'+(ok?'':'\n'+body+'\n'+errs.join(' | ')));
 await br.close();process.exitCode=ok?0:1})();
