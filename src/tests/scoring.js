// Scoring rules, checked through the real answer screens. Usage: node scoring.js [PORT]  (exits 1 on any failure)
//  1. accent / hyphen and hint slips never lower a level
//  2. multiple choice never lowers a level
//  3. a level only drops after 3 wrong written answers in a row (a right answer starts the count again)
//  4. a noun without de / het is wrong (Vertaling), and so is the wrong article
const {chromium}=require('playwright-core');const PORT=process.argv[2]||'8765';
(async()=>{const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});const p=await b.newPage({viewport:{width:390,height:844}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/sw.js',r=>r.abort());
 await p.goto('http://127.0.0.1:'+PORT+'/');await p.waitForTimeout(400);
 await p.evaluate(()=>{localStorage.clear();S={};saveLocal()});
 const ID='h1-het-hemd',fails=[];const F=(ok,m)=>{console.log((ok?'✓ ':'✗ ')+m);if(!ok)fails.push(m)};
 const lvl=(id=ID)=>p.evaluate(id=>S[id]?S[id].b:null,id);
 const set=(b0,id=ID)=>p.evaluate(([id,b0])=>{S[id]={b:b0,n:4,w:0,f:dayKey(),due:0,lr:'r'};save()},[id,b0]);
 /* one written answer on the real screen: mode right | wrong | hint, or a given text */
 const write=async(mode,id=ID,text)=>{await p.evaluate(id=>{const it=ITEMS.find(x=>x.id===id);start([{it,st:'write',slot:'fix'}],'test',false)},id);
  if(mode==='hint')await p.click('#hb');
  await p.evaluate(([m,t])=>{const q=sess.queue[sess.i].q;document.getElementById('ti').value=t!=null?t:m==='wrong'?'qqq':q.accept[0]},[mode,text==null?null:text]);
  await p.click('#tf .check');return p.evaluate(()=>sess.log[sess.log.length-1].res)};
 /* one multiple-choice warm-up on the real screen */
 const pick=async right=>{await p.evaluate(id=>{const it=ITEMS.find(x=>x.id===id);start([{it,st:'pick',slot:'fix'}],'test',false)},ID);
  await p.evaluate(ok=>{const q=sess.queue[sess.i].q;const good=q.valid||[q.mcAnswer||q.answer];const j=q.options.findIndex(o=>ok?good.includes(o):!good.includes(o));document.querySelectorAll('.opt')[j].click()},right);
  return p.evaluate(()=>sess.log[sess.log.length-1].res)};
 // 1. hint slips
 await set(3);
 const r1=await write('hint');F(r1==='hint'&&await lvl()===3,`hint slip keeps the level (res ${r1}, level ${await lvl()})`);
 for(let k=0;k<5;k++)await write('hint');F(await lvl()===3,`5 more hint slips: level still 3 (${await lvl()})`);
 // an accent / hyphen slip: “het tshirt” for “het T-shirt”
 const T='h1-het-t-shirt';await set(4,T);let r2;for(let k=0;k<6;k++)r2=await write('x',T,'het tshirt');
 F(r2==='accent'&&await lvl(T)===4,`6 hyphen slips (het tshirt for het T-shirt) keep the level (res ${r2}, level ${await lvl(T)})`);
 // 2. multiple choice (a warm-up only comes before a term is written, so the term has no written answer yet)
 await p.evaluate(id=>{S[id]={b:2,n:0,w:0,f:dayKey(),due:0};save()},ID);for(let k=0;k<6;k++){const r=await pick(false);if(r!=='wrong')F(false,'wrong option should be graded wrong')}
 F(await lvl()===2,`6 wrong multiple-choice picks keep the level (${await lvl()})`);
 // 3. three wrong written answers in a row
 await set(3);await write('wrong');await write('wrong');F(await lvl()===3,`2 wrong written answers: level stays 3 (${await lvl()})`);
 await write('wrong');F(await lvl()===2,`3rd wrong written answer in a row: level drops by one, 3 → ${await lvl()}`);
 await write('wrong');await write('wrong');F(await lvl()===2,`2 more wrong: still ${await lvl()} (the count started again)`);
 await set(3);await write('wrong');await write('wrong');await write('right');await write('wrong');await write('wrong');
 F(await lvl()===4,`wrong, wrong, right, wrong, wrong: no drop (level ${await lvl()}, up one for the right answer)`);
 // 4. the article counts
 await set(3);const a1=await write('x',ID,'hemd');const m1=await p.evaluate(()=>document.querySelector('.fb .mark')&&document.querySelector('.fb .mark').textContent);
 F(a1==='wrong'&&/lidwoord vergeten/.test(m1||''),`“hemd” without het is wrong, marked “${m1}”`);
 const a2=await write('x',ID,'de hemd');F(a2==='wrong',`“de hemd” is wrong (${a2})`);
 const a3=await write('x',ID,'Het Hemd');F(a3==='right',`“Het Hemd” (capitals) is right (${a3})`);
 // the same rules hold in record() itself
 const rec=await p.evaluate(()=>{const id='h1-de-trui';S[id]={b:2,n:3,w:0,f:dayKey(),due:0};const out=[];record(id,'accent');record(id,'hint');out.push(S[id].b);
  record(id,'wrong');record(id,'accent');record(id,'wrong');out.push(S[id].b);record(id,'wrong');out.push(S[id].b);return out});
 F(rec[0]===2&&rec[1]===2&&rec[2]===1,`record(): slips keep 2, two wrong keep 2, third wrong drops to 1 (${rec.join(' → ')})`);
 console.log(fails.length?`✗ ${fails.length} scoring rules broken`:'✓ scoring rules hold');if(errs.length)console.log('errors',errs);
 await b.close();process.exitCode=fails.length||errs.length?1:0})();
