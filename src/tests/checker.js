// The free-text checker of the exam drills (SD1, SD3, SD4, SD5). Usage: node checker.js [PORT]  (exits 1 on any failure)
// Realistic wrong exam sentences, one or more per rule, and the exact message each must get (HTML tags stripped);
// right sentences that must get no remark; whole texts (sentence count, what is still missing, the e-mail frame);
// and every generated model answer (40 pictures of each drill) plus the class models must come out clean.
const {chromium}=require('playwright-core');const PORT=process.argv[2]||'8765';
const WRONG=[
 // adjective + e
 ['Ze draagt een groene hemd.','adj: hemd is a het-word: after een no -e: een groen hemd'],
 ['Ze draagt een rood jurk.','adj: jurk is a de-word: + e: een rode jurk'],
 ['De jas is lange.','adj: After is / zijn the adjective has no -e: lang'],
 ['Er hangt een gestreepte schilderij.','adj: schilderij is a het-word: after een no -e: een gestreept schilderij'],
 ['Er staat een houtene tafel in de eetkamer.','spelling: houtene → houten · never takes -e'],
 ['Ze draagt een lederene jas.','spelling: lederene → lederen · never takes -e'],
 // de / het
 ['Hij draagt de hemd.','art: hemd is a het-word: het hemd'],
 ['Het jas is lang.','art: jas is a de-word: de jas'],
 // Er + verb: number and position verb
 ['Er staan een lamp naast de zetel.','er: One thing (een lamp): Er staat'],
 ['Er staat twee stoelen rond de tafel.','er: Two or more (twee stoelen): Er staan'],
 ['In de slaapkamer staan er een bed.','er: One thing (een bed): Er staat'],
 ['Er staat een tapijt onder de tafel.','er: Het tapijt lies flat: Er ligt …'],
 ['Er hangt een kast tegen de muur.','er: De kast stands upright: Er staat …'],
 ['Er ligt een schilderij boven de zetel.','er: Het schilderij hangs on the wall or from the ceiling: Er hangt …'],
 ['Er staan twee kussen op de zetel.','num: After twee comes the plural: twee kussens'],
 ['In de woonkamer er staat een zetel.','order: Verb in 2nd place: after “in de woonkamer” comes the verb, then er: In de woonkamer staat er een zetel.'],
 // subject + verb
 ['Hij draag een blauwe broek.','verb: Hij → draagt'],
 ['Ik draagt een rok.','verb: Ik → draag'],
 ['Hij hebben een hoed.','verb: Hij → heeft'],
 // moet / mag + infinitive last · geen / niet
 ['Je moet dragen een helm.','order: The infinitive goes to the end: Je moet een helm dragen.'],
 ['Je mag hier geen roken.','neg: geen goes with a noun. Before a verb: niet: Je mag hier niet roken.'],
 ['Je mag geen de hond meebrengen.','neg: geen takes the noun without de: Je mag geen hond meebrengen.'],
 ['Je mag niet de gsm gebruiken.','neg: niet comes after de gsm, right before the infinitive: Je mag de gsm niet gebruiken.'],
 ['Ik heb geen een tas.','neg: geen takes the noun without een: Ik heb geen tas.'],
 ['Je moet de gsm uitzet.','inf: After moet comes an infinitive at the end: Je moet … drinken.'],
 // spelling
 ['Je mag hier niet eeten.','spelling: eeten → eten · a long vowel at the end of a syllable is written once'],
 ['Ze draagt een groote tas.','spelling: groote → grote · a long vowel at the end of a syllable is written once'],
 ['Er staat een groete houten kast tegen de muur.','spelling: groete → grote'],
 ['Hij draagt een wite broek.','spelling: wite → witte · short vowel: the consonant after it doubles'],
 ['Ze draagt grijse kousen.','spelling: grijse → grijze · s becomes z between vowels'],
 ['Hij draagt zwarte laarsen.','spelling: laarsen → laarzen · s becomes z between vowels'],
 // capital, full stop, names
 ['ze draagt een rok','cap: Start with a capital letter: Ze …'],
 ['ze draagt een rok','punct: End the sentence with a full stop.'],
 ['Ik woon in gent.','name: Names of towns, countries and languages start with a capital: Gent'],
 // SD4: comparatives and conjunctions
 ['Mijn huis is meer groot dan het appartement.','comp: One word: groter (not meer groot)'],
 ['Mijn huis is groter als het appartement.','comp: Compare with dan: groter dan'],
 ['Ik woon graag hier, omdat het is ruim.','conj: After omdat the verb goes to the end: omdat het ruim is'],
];
const RIGHT=['Je moet je gsm uitzetten.','Je mag hier niet roken.','Je mag de hond niet meebrengen.','Ik zet mijn gsm uit.','Ze draagt een rode trui met lange mouwen.',
 'Er ligt een groot, rond tapijt onder de salontafel.','Hij draagt een groot, grijs kostuum.','Er staat een kleine, vierkante glazen salontafel voor de zetel.',
 'Er hangen gestreepte gordijnen voor het raam.','In de woonkamer staat er een zetel.','Op het bed liggen er twee kussens.','Persoon 1 draagt een gestreepte jurk.',
 'Ze draagt een lederen jas.','Er zijn drie slaapkamers.','Mijn appartement is groter dan het appartement van Yumi en Ken.','Ik verhuis, want mijn appartement is te klein.',
 'Ik woon graag in mijn huis, omdat het ruim en gezellig is.','Er staat een kleine glazen tafel in het midden van de kamer.','Je moet aan het rode licht stoppen.'];
(async()=>{const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});const p=await b.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route('**/sw.js',r=>r.abort());
 await p.goto('http://127.0.0.1:'+PORT+'/');await p.waitForTimeout(400);
 const r=await p.evaluate(([WRONG,RIGHT])=>{const t=x=>String(x).replace(/<[^>]+>/g,'');const got=s=>checkSentence(s).issues.map(i=>i.k+': '+t(i.msg));
  const wrong=WRONG.map(([s,want])=>{const g=got(s);return {s,want,ok:g.includes(want),g}});
  const right=RIGHT.map(s=>({s,g:got(s)})).map(x=>({...x,ok:!x.g.length}));
  /* whole texts */
  const tx=[];const T=(name,ok,info)=>tx.push({name,ok,info});
  const five='Er staat een grote zetel tegen de muur. Er ligt een rond tapijt onder de tafel. Er staat een houten tafel voor de zetel. Er staan twee stoelen naast de tafel. Er staat een lamp naast de zetel.';
  let c=checkText(five,SPEC.sd5);T('SD5 with 5 sentences: “5 sentences: write exactly 6.” and “No sentence with Er hangt or Er hangen yet.”',c.count==='5 sentences: write exactly 6.'&&c.missing.map(t).includes('No sentence with Er hangt or Er hangen yet.')&&!c.ok,[c.count,...c.missing.map(t)]);
  c=checkText('Je moet op tijd komen. Je moet je gsm uitzetten. Je mag water drinken. Je mag hier niet eten. Je mag niet roepen.',SPEC.sd3);
  T('SD3 without geen: “geen” is still missing',c.missing.map(t).some(m=>/geen/.test(m))&&!c.ok,c.missing.map(t));
  c=checkText('Ik woon in Brugge. Mijn huis is groot.',SPEC.sd4);T('SD4 without greeting and closing: both asked for',!c.ok&&c.missing.map(t).join(' ').match(/Beste|Dag/)&&c.missing.map(t).join(' ').match(/groeten/),c.missing.map(t));
  /* a slip in a translation is corrected towards the model answer (feedback 27 Oct: groete was turned into groene) */
  const sa=checkSentAnswer('Er staat een groete, houten kast tegen de muur',['Er staat een grote houten kast tegen de muur.']),san=(sa.notes||[]).map(n=>n[0]+': '+t(n[1]));
  T('translation: “groete” → “grote” from the model answer, not “groene”',sa.res==='wrong'&&san.includes('spelling: groete → grote')&&!san.some(n=>/groene/.test(n)),san);
  const sb=checkSentAnswer('Ze draagt een groene jas',['Ze draagt een groene jas.']);T('translation: a right sentence stays right',sb.res==='right',sb);
  /* every model answer is clean */
  const dirty=[];for(let seed=1;seed<=40;seed++){
   const room=scene('sd5',seed),m5=roomModel(room);c=checkText(m5,SPEC.sd5);if(!c.ok)dirty.push(['sd5',seed,m5,c.count,c.missing.map(t),c.S.flatMap(s=>s.issues.map(i=>t(i.msg)))]);
   scene('sd1',seed).people.forEach(pp=>{const m=personModel(pp);c=checkText(m,SPEC.sd1);if(!c.ok)dirty.push(['sd1',seed,m,c.missing.map(t),c.S.flatMap(s=>s.issues.map(i=>t(i.msg)))])});
   const m3=scene('sd3',seed).rules.map(x=>x.nl).join(' ');c=checkText(m3,SPEC.sd3);if(!c.ok)dirty.push(['sd3',seed,m3,c.missing.map(t),c.S.flatMap(s=>s.issues.map(i=>t(i.msg)))])}
  [['persoon1',SPEC.sd1],['persoon2',SPEC.sd1],['kamer',SPEC.sd5],['regels',SPEC.sd3],['woning',SPEC.sd4]].forEach(([k,sp])=>{c=checkText(EXAM.models[k],sp);if(!c.ok)dirty.push(['class model',k,c.count,c.missing.map(t),c.S.flatMap(s=>s.issues.map(i=>t(i.msg)))])});
  EXAM.places.forEach(pl=>pl.rules.forEach(x=>{const g=checkSentence(x.nl).issues;if(g.length)dirty.push(['sign',x.id,x.nl,g.map(i=>t(i.msg))])}));
  return {wrong,right,tx,dirty}},[WRONG,RIGHT]);
 let fails=0;const F=(ok,m)=>{console.log((ok?'✓ ':'✗ ')+m);if(!ok)fails++};
 r.wrong.forEach(x=>F(x.ok,`${x.s} → ${x.want}${x.ok?'':'\n      got: '+(x.g.join(' | ')||'(nothing)')}`));
 r.right.forEach(x=>F(x.ok,`${x.s} → no remark${x.ok?'':'\n      got: '+x.g.join(' | ')}`));
 r.tx.forEach(x=>F(x.ok,x.name+(x.ok?'':'\n      got: '+JSON.stringify(x.info))));
 F(!r.dirty.length,`every model answer (40 pictures × SD1, SD3, SD5, the class models and every sign) is clean${r.dirty.length?':\n  '+r.dirty.slice(0,8).map(d=>JSON.stringify(d)).join('\n  '):''}`);
 F(!errs.length,'no errors'+(errs.length?': '+errs.join(' | '):''));
 console.log(fails?`✗ ${fails} checker cases fail`:`✓ checker: ${r.wrong.length} wrong sentences get the right message, ${r.right.length} right sentences get none`);
 await b.close();process.exitCode=fails?1:0})();
