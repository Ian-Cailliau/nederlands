// Feedback button against a fake GitHub API. Usage: PORT=8765 node feedback.js  (exits 1 on any failure)
// sent with a token (201) · kept in the queue when the token cannot create issues (403) · kept until sync is set up (no token)
const {chromium}=require('playwright-core');
(async()=>{
 const br=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});let fails=0;const F=(ok,m)=>{console.log((ok?'✓ ':'✗ ')+m);if(!ok)fails++};
 async function run(name,token,status){
  const ctx=await br.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  const posts=[];
  await p.route('https://api.github.com/**',async r=>{const u=r.request().url();
   if(u.includes('/issues')){posts.push({url:u,...JSON.parse(r.request().postData())});return r.fulfill({status,body:'{}',contentType:'application/json'})}
   return r.fulfill({status:404,body:'{}'})});
  await p.route('**/sw.js',r=>r.abort());
  await p.goto('http://127.0.0.1:'+(process.env.PORT||8765)+'/index.html');
  if(token){await p.evaluate(t=>localStorage.setItem('nl-gh-token',t),token);await p.reload()}
  await p.waitForTimeout(500);
  await p.click('#fbk');await p.waitForTimeout(200);
  const bar=await p.textContent('#pickbar');
  await p.mouse.click(195,200);await p.waitForTimeout(300);
  const snip=await p.textContent('.fbsnip');
  await p.fill('#fbtext','Test comment: the gloss is wrong');
  await p.click('#fbsend');await p.waitForTimeout(800);
  const msg=await p.textContent('#fbmsg').catch(()=>'(sheet closed)');
  const q=JSON.parse(await p.evaluate(()=>localStorage.getItem('nl-fbq'))||'[]');
  await ctx.close();return {bar,snip,msg,posts,q,errs}}
 const a=await run('ok','ghp_fake',201);
 F(a.posts.length===1&&/repos\/Ian-Cailliau\/nederlands\/issues/.test(a.posts[0].url)&&/^Feedback: Test comment/.test(a.posts[0].title)&&!a.q.length,`with a token: sent as an issue to Ian-Cailliau/nederlands (${a.posts.length} post, queue ${a.q.length})`);
 F(a.posts[0]&&/\*\*Selected:\*\*/.test(a.posts[0].body)&&/"screen"/.test(a.posts[0].body),'the issue holds the selected text and the context');
 F(/Tik op/.test(a.bar),'the pick bar asks to tap something (Dutch label)');
 const f=await run('forbidden','ghp_fake',403);F(f.q.length===1&&/cannot create issues/.test(f.msg),`token without issue access: kept in the queue with advice (${f.msg.slice(0,60)}…)`);
 const n=await run('notoken',null,201);F(!n.posts.length&&n.q.length===1&&/once sync is set up/.test(n.msg),'no token: kept on this device until sync is set up');
 const errs=[...a.errs,...f.errs,...n.errs];F(!errs.length,'no errors'+(errs.length?': '+errs.join(' | '):''));
 await br.close();process.exitCode=fails?1:0})();
