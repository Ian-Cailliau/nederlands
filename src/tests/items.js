// Every term works in every way it can be asked. Usage: node items.js [PORT]  (exits 1 on any failure)
// For each term, 6 random draws of write and pick: the first accepted answer is graded right, garbage is graded wrong,
// multiple choice has the answer among 2+ different options, no prompt shows undefined / NaN / null, and
// every Vertaling noun needs its article (the bare word is not accepted). All 192 words appear in the decks.
const {chromium}=require('playwright-core');const PORT=process.argv[2]||'8765';
(async()=>{const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});const p=await b.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/sw.js',r=>r.abort());
 await p.goto('http://127.0.0.1:'+PORT+'/');await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const bad=[],say=(id,m)=>bad.push(id+': '+m),seen=new Set(),modes=new Map();
  const grade=(q,g)=>{if(q.check)return q.check(g).res;const n=norm(g);return q.accept.map(norm).includes(n)?'right':'wrong'};
  ITEMS.forEach(it=>{seen.add(it.id.replace(/^\w+:/,''));
   for(let k=0;k<6;k++)for(const st of ['write','pick']){let q;try{q=it.make(st)}catch(e){say(it.id,`${st} throws ${e.message}`);continue}
    const txt=[q.prompt,q.sub,q.eyebrow,q.answer,q.note].filter(x=>x!=null).join(' ');
    if(/undefined|NaN|\bnull\b|\[object/.test(txt))say(it.id,`${st} shows “${txt.slice(0,90)}”`);
    const m=modeOf(it,q).m;modes.set(m,(modes.get(m)||0)+1);
    if(q.options){const good=q.valid||[q.mcAnswer||q.answer];if(!q.options.some(o=>good.includes(o)))say(it.id,`${st} options miss the answer ${good[0]}`);
     if(new Set(q.options).size<2||new Set(q.options).size!==q.options.length)say(it.id,`${st} options ${JSON.stringify(q.options)}`)}
    else if(q.accept){if(grade(q,q.accept[0])!=='right')say(it.id,`${st} own answer “${q.accept[0]}” is not graded right`);
     if(grade(q,'qqq zzz')==='right')say(it.id,`${st} garbage graded right`);
     const w=WID.get(it.id);if(w&&w.pos==='noun'&&w.art&&q.accept.some(a=>/^(de|het) /i.test(a))){if(grade(q,w.word)==='right')say(it.id,`${st} accepts “${w.word}” without ${w.art}`)}}}});
  const words=WL.map(w=>w.id),missing=words.filter(id=>!seen.has(id));
  return {n:ITEMS.length,words:words.length,missing,bad,modes:[...modes]}});
 const F=(ok,m)=>{console.log((ok?'✓ ':'✗ ')+m);return ok};
 const ok=[F(!r.missing.length,`all ${r.words} words are in the decks${r.missing.length?' · missing: '+r.missing.join(', '):''}`),
  F(!r.bad.length,`all ${r.n} terms ask and grade correctly${r.bad.length?` · ${r.bad.length} problems:\n  `+[...new Set(r.bad)].slice(0,30).join('\n  '):''}`),
  F(['betek','vert','lidw','meerv','adj','erzin','regels'].every(m=>r.modes.some(([k])=>k===m)),'every mode is used: '+r.modes.map(([k,n])=>k+' '+n).join(' · ')),
  F(!errs.length,'no errors'+(errs.length?': '+errs.join(' | '):''))].every(Boolean);
 await b.close();process.exitCode=ok?0:1})();
