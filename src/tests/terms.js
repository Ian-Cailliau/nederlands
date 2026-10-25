// Term snapshot: every term id and what it asks / accepts, under a fixed random seed.
// Usage: node terms.js PORT            compare with terms-fixture.json (exits 1 on any difference)
//        node terms.js PORT update     after adding content: adds the NEW ids to the fixture, but refuses if an existing term changed
//        node terms.js PORT write      re-record everything (only when a change to existing terms is intended)
const {chromium}=require('playwright-core');const fs=require('fs');
const PORT=process.argv[2]||'8765',MODE=['write','update'].includes(process.argv[3])?process.argv[3]:'compare',FILE=process.argv[MODE==='compare'?3:4]||__dirname+'/terms-fixture.json';
(async()=>{const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});const p=await b.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/sw.js',r=>r.abort());
 await p.goto('http://127.0.0.1:'+PORT+'/');await p.waitForTimeout(400);
 const snap=await p.evaluate(()=>{let s=1;const R=Math.random;Math.random=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646};
  const n=x=>x==null?null:String(x).toLowerCase().replace(/[.,!?;:…]/g,'').replace(/\s+/g,' ').trim();
  const out={ids:ITEMS.map(it=>it.id),order:ORDER.map(it=>it.id),terms:{}};
  ITEMS.forEach(it=>{const runs=[];for(let k=0;k<4;k++){s=1000+k*7919;for(const st of ['write','pick']){const q=it.make(st);
   runs.push({st,eyebrow:q.eyebrow,prompt:q.prompt,sub:q.sub||null,answer:q.answer,mc:q.mcAnswer||null,accept:q.accept?q.accept.map(n).sort():null,valid:q.valid||null,options:q.options||null,say:q.sayAns||null,note:q.note||null,group:it.group||null,block:it.block||null,kind:it.kind,stage:it.stage})}}
   out.terms[it.id]=runs});
  Math.random=R;return out});
 const save=o=>fs.writeFileSync(FILE,JSON.stringify(o));
 if(MODE==='write'){save(snap);console.log('recorded',snap.ids.length,'terms →',FILE);await b.close();return}
 const old=JSON.parse(fs.readFileSync(FILE,'utf8'));let bad=0;const badIds=new Set();const say=(m,id)=>{bad++;if(id)badIds.add(id);if(bad<=25)console.log('✗',m)};
 const gone=old.ids.filter(i=>!snap.ids.includes(i)),added=snap.ids.filter(i=>!old.ids.includes(i));
 if(gone.length)say('term ids missing (their progress would be lost): '+gone.join(', '));
 if(MODE==='compare'){if(added.length)say('new term ids not in the fixture (run with update): '+added.join(', '));
  if(JSON.stringify(old.order)!==JSON.stringify(snap.order))say('learning order differs')}
 /* options and the order can shift when new words join a deck (the distractors are drawn from the deck); prompts and accepted answers may not.
    Er-zinnen (ez:) are drawn at random from the rooms and the colour / material lists, so a new colour changes the drawn sentence: only their kind is kept. */
 const loose=MODE==='update'?new Set(['options','valid']):new Set(),drawn=id=>MODE==='update'&&/^ez:/.test(id),fixed=new Set(['st','eyebrow','kind','block','stage']);
 old.ids.forEach(id=>{const a=old.terms[id],c=snap.terms[id];if(!c)return;a.forEach((r,k)=>Object.keys(r).forEach(f=>{if(loose.has(f)||drawn(id)&&!fixed.has(f))return;if(JSON.stringify(r[f])!==JSON.stringify(c[k][f]))say(`${id} [${r.st}] ${f}: ${JSON.stringify(r[f])} → ${JSON.stringify(c[k][f])}`,id)}))});
 if(badIds.size)console.log('  terms that changed: '+[...badIds].slice(0,40).join(', ')+(badIds.size>40?' …':''));
 if(MODE==='update'){if(bad){console.log(`✗ ${bad} problems: fixture not updated`);process.exitCode=1}
  else{save(snap);console.log(`✓ existing ${old.ids.length} terms unchanged · added ${added.length} new: ${added.join(', ')||'none'} → fixture updated`)}}
 else console.log(bad?`✗ ${bad} differences`:`✓ all ${old.ids.length} term ids, the learning order and every term's prompts and accepted answers are unchanged`);
 if(errs.length)console.log('errors',errs);if(bad||errs.length)process.exitCode=1;
 await b.close()})();
