// Export the existing TaskHub UI/API into a prepared Sites Vinext checkout.
// Cloud writes use D1 atomic batches; local Node/Turso code stays unchanged.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
const target = resolve(process.argv[2] || '');
assert.ok(process.argv[2] && target !== process.cwd(), 'Pass the prepared Sites checkout path.');
const put = (path, text) => { mkdirSync(resolve(target, path, '..'), { recursive: true }); writeFileSync(join(target, path), text); };
// One approved source for local and hosted catalogs; no fictional inventory is seeded.
put('lib/catalog.mjs', 'export const referenceCatalog = '+readFileSync('catalog/enviet-tours.json','utf8').trim()+';\n');
let api = readFileSync('server/index.mjs', 'utf8').replaceAll('\r\n','\n');
const replace = (before, after) => { assert.equal(api.split(before).length, 2, 'API export contract changed: ' + before.slice(0, 60)); api = api.replace(before, after); };
api = api.replace('import http from "node:http";\n', '')
  .replace('import { readFileSync, existsSync, statSync } from "node:fs";\n', '')
  .replace('import { resolve, extname } from "node:path";\n', '')
  .replace('  openDatabase,\n', '').replace('  transaction,\n', '').replace('  purgeExpired,\n', '')
  .replace('} from "./db.mjs";', '} from "./seed.mjs";');
replace('const production = process.env.NODE_ENV === "production";', 'export async function createApi(db, settings) {\nconst production = settings.NODE_ENV === "production";');
api = api.replaceAll('process.env.', 'settings.');
replace('const db = await openDatabase();', '');
const startupStart = api.indexOf('await transaction(db, async () => {');
const startupEnd = api.indexOf('const limits = new Map();');
assert.ok(startupStart > 0 && startupEnd > startupStart);
api = api.slice(0, startupStart) + `
if (!(await db.prepare("SELECT id FROM workspaces WHERE id=?").get("agency"))) {
  try { await db.batch(await workspaceStatements("agency", "TaskHub")); }
  catch (e) { if (!(await db.prepare("SELECT id FROM workspaces WHERE id=?").get("agency"))) throw e; }
}
async function systemUser(em, password, role, name) {
  const existing = await db.prepare("SELECT id,role,workspace FROM users WHERE email=?").get(em);
  if (existing && (existing.role !== role || existing.workspace !== "agency")) throw Error("System email conflicts with a participant.");
  await db.prepare("INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET password=excluded.password WHERE users.role=excluded.role AND users.workspace='agency'").run(randomUUID(),em,name,hash(password),'agency',role,'',now(),role+'-setup');
  const saved = await db.prepare("SELECT role,workspace FROM users WHERE email=?").get(em);
  if (saved.role !== role || saved.workspace !== 'agency') throw Error('System account conflict.');
}
await systemUser(adminEmail,adminPassword,'admin','Điều hành TaskHub');
const reviewerEmail = settings.REVIEWER_EMAIL?.trim().toLowerCase();
if (reviewerEmail) {
  const password = settings.REVIEWER_PASSWORD || '';
  if (password.length < 12 || reviewerEmail === adminEmail) throw Error('Set a separate reviewer credential.');
  await systemUser(reviewerEmail,password,'reviewer','Giảng viên / người đánh giá');
}
let lastPurge = 0;
async function retention() {
  if (Date.now() - lastPurge < 12*3600000) return;
  const cutoff = new Date(Date.now()-180*86400000).toISOString();
  await db.batch([
    ["DELETE FROM workspaces WHERE id IN (SELECT workspace FROM users WHERE role NOT IN ('admin','reviewer') AND workspace!='agency' AND consent_at<?)",[cutoff]],
    ['DELETE FROM inquiries WHERE created<?',[cutoff]],
    ['DELETE FROM sessions WHERE expires<?',[Date.now()]],
    ['DELETE FROM rate_limits WHERE bucket<?',[Math.floor(Date.now()/60000)-1440]],
  ]);
  lastPurge = Date.now();
}
async function workspaceStatements(id,name) {
  const statements=[];
  await seedWorkspace({prepare:sql=>({run:async (...args)=>{statements.push([sql,args]);}})},id,name);
  return statements;
}
function eventStatement(user,action,entity='',conditional=false) {
  if (['admin','reviewer'].includes(user.role)) return [];
  return [[conditional ? 'INSERT INTO events SELECT ?,?,?,?,? WHERE changes()=1' : 'INSERT INTO events VALUES (?,?,?,?,?)', [randomUUID(),user.id,action,entity,now()]]];
}
` + api.slice(startupEnd);
const rateStart = api.indexOf('const limits = new Map();');
const rateEnd = api.indexOf('const fail =');
api = api.slice(0,rateStart) + `async function limited(req,key,max=20) {
  const bucket=Math.floor(Date.now()/60000), id=req.socket.remoteAddress+':'+key;
  const results=await db.batch([
    ['INSERT INTO rate_limits VALUES (?,?,1) ON CONFLICT(key,bucket) DO UPDATE SET n=n+1',[id,bucket]],
    ['SELECT n FROM rate_limits WHERE key=? AND bucket=?',[id,bucket]],
  ]);
  if(results[1].rows[0].n>max) throw Object.assign(Error('Thử lại sau một phút.'),{status:429});
}
` + api.slice(rateEnd);
api = api.replace(/(?<!function )limited\(req,/g, 'await limited(req,');
// Replace interactive write transactions with one atomic D1 batch each.
const regStart=api.indexOf('      const u = await transaction(db, async () => {');
const regEnd=api.indexOf('      await session(res, u);',regStart);
assert.ok(regStart>0 && regEnd>regStart);
api = api.slice(0,regStart) + `      const u={id,email:em,name,workspace,role,company_size:size,consent_at:now(),consent_version:'cp3-v1'};
      try {
        await db.batch([
          ...await workspaceStatements(workspace,'Không gian của '+name),
          ['INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)',[id,em,name,hash(password),workspace,role,size,u.consent_at,u.consent_version]],
          ...eventStatement(u,'test_started'),
        ]);
      } catch(e) {
        if(await db.prepare('SELECT id FROM users WHERE email=?').get(em)) fail('Email đã đăng ký. Anh/chị có thể đăng nhập.',409);
        throw e;
      }
` + api.slice(regEnd);
replace(`      await transaction(db, async () => {
        await db
          .prepare("INSERT INTO tours VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
          .run(id, u.workspace, ...values, 1, now());
        await log(u, "tour_created", id);
      });`, `      await db.batch([['INSERT INTO tours VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[id,u.workspace,...values,1,now()]],...eventStatement(u,'tour_created',id)]);`);
const deleteStart=api.indexOf('      await transaction(db, async () => {',api.indexOf('const tourMatch'));
const deleteEnd=api.indexOf('      return json(res, { ok: true });',deleteStart);
assert.ok(deleteStart>0 && deleteEnd>deleteStart);
api=api.slice(0,deleteStart)+`      const result=await db.batch([
        ['DELETE FROM tours WHERE id=? AND workspace=? AND version=?',[tourMatch[1],u.workspace,b.version]],
        ...eventStatement(u,'tour_deleted',tourMatch[1],true),
      ]);
      if(!result[0].changes) fail('Tour đã thay đổi hoặc không tồn tại. Tải lại trước khi xóa.',409);
`+api.slice(deleteEnd);
const tourStart=api.indexOf('      await transaction(db, async () => {',api.indexOf('if (tourMatch && method === "PUT")'));
const tourEnd=api.indexOf('      return json(res, { ok: true });',tourStart);
assert.ok(tourStart>0 && tourEnd>tourStart);
api = api.slice(0,tourStart) + `      const result=await db.batch([
        ['UPDATE tours SET title=?,destination=?,departure=?,duration=?,price=?,capacity=?,reserved=?,description=?,itinerary=?,theme=?,published=?,version=version+1,updated=? WHERE id=? AND workspace=? AND version=?',[...values,now(),tourMatch[1],u.workspace,b.version]],
        ...eventStatement(u,'tour_updated',tourMatch[1],true),
      ]);
      if(!result[0].changes) fail('Tour đã thay đổi hoặc không tồn tại. Tải lại trước khi sửa.',409);
` + api.slice(tourEnd);
const taskStart=api.indexOf('      await transaction(db, async () => {',api.indexOf('if (p === "/api/tasks"'));
const taskEnd=api.indexOf('      return json(res, { id }, 201);',taskStart);
assert.ok(taskStart>0 && taskEnd>taskStart);
api=api.slice(0,taskStart)+`      await db.batch([
        ['INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?)',[id,u.workspace,tour.id,title,assignee,due,priority,'todo',now()]],
        ...eventStatement(u,'task_created',id),
      ]);
`+api.slice(taskEnd);
const statusStart=api.indexOf('      await transaction(db, async () => {',api.indexOf('const taskMatch'));
const statusEnd=api.indexOf('      return json(res, { ok: true });',statusStart);
assert.ok(statusStart>0 && statusEnd>statusStart);
api=api.slice(0,statusStart)+`      const result=await db.batch([
        ['UPDATE tasks SET status=? WHERE id=? AND workspace=?',[status,taskMatch[1],u.workspace]],
        ...eventStatement(u,'task_status_changed',status,true),
      ]);
      if(!result[0].changes) fail('Không tìm thấy công việc.',404);
`+api.slice(statusEnd);
const feedbackStart=api.indexOf('      await transaction(db, async () => {',api.indexOf('if (p === "/api/feedback"'));
const feedbackEnd=api.indexOf('      return json(res, { ok: true });',feedbackStart);
assert.ok(feedbackStart>0 && feedbackEnd>feedbackStart);
api=api.slice(0,feedbackStart)+`      await db.batch([
        ['INSERT INTO feedback VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET portal=excluded.portal,operations=excluded.operations,sync=excluded.sync,ease=excluded.ease,intent=excluded.intent,price=excluded.price,liked=excluded.liked,disliked=excluded.disliked,created=excluded.created',[u.id,...values,intent,price,liked,disliked,now()]],
        ...eventStatement(u,'feedback_submitted'),
      ]);
`+api.slice(feedbackEnd);
replace('export const server = http.createServer(async (req, res) => {','return async function handle(req, res) {');
replace('    const url = new URL(req.url, "http://localhost");','    await retention();\n    const url = new URL(req.url, "http://localhost");');
// The framework serves frontend assets; this module handles API requests only.
const staticStart=api.indexOf('    let file = resolve(dist,');
const staticEnd=api.indexOf('  } catch (e) {', staticStart);
assert.ok(staticStart>0 && staticEnd>staticStart);
api=api.slice(0,staticStart)+`    fail('Không tìm thấy trang.',404);\n`+api.slice(staticEnd);
const footer=api.indexOf('\n});\nserver.listen(');
assert.ok(footer>0);
api=api.slice(0,footer)+'\n};\n}\n';
assert.ok(!api.includes('transaction(') && !api.includes('process.env') && !api.includes('readFileSync'));
put('lib/taskhub-api.mjs',api);
const dbSource=readFileSync('server/db.mjs','utf8').replaceAll('\r\n','\n');
put('lib/seed.mjs', 'import {randomUUID} from "node:crypto";\nexport const now=()=>new Date().toISOString();\n'+dbSource.slice(dbSource.indexOf('export async function seedWorkspace')));
put('lib/d1.mjs', `export function adaptD1(DB) {
  const statement=(sql,args)=>args.length?DB.prepare(sql).bind(...args):DB.prepare(sql);
  return {
    prepare:sql=>({
      get:async(...args)=>await statement(sql,args).first() ?? undefined,
      all:async(...args)=>(await statement(sql,args).all()).results,
      run:async(...args)=>({changes:(await statement(sql,args).run()).meta.changes}),
    }),
    batch:async statements=>(await DB.batch(statements.map(([sql,args])=>statement(sql,args)))).map(r=>({changes:r.meta.changes,rows:r.results})),
  };
}
`);
copyFileSync('cloud/pages/proxy-auth.mjs',join(target,'lib/proxy-auth.mjs'));
put('lib/route.mjs', `import { env } from 'cloudflare:workers';
import { createApi } from './taskhub-api.mjs';
import { adaptD1 } from './d1.mjs';
import { verifyProxyRequest } from './proxy-auth.mjs';
const handlers=new WeakMap();
export async function handleApi(request) {
  if(!env.DB) return Response.json({message:'Database chưa được cấu hình.'},{status:503});
  let clientAddress=request.headers.get('cf-connecting-ip') || 'local';
  if(request.headers.has('x-taskhub-proxy-signature')) {
    clientAddress=verifyProxyRequest(request,env.TASKHUB_PROXY_SECRET);
    if(!clientAddress)return Response.json({message:'Nguồn yêu cầu không hợp lệ.'},{status:403});
  }
  let pending=handlers.get(env.DB);
  if(!pending) {
    const local=['127.0.0.1','localhost'].includes(new URL(request.url).hostname);
    pending=createApi(adaptD1(env.DB),{...env,NODE_ENV:local?'development':'production',TRUST_PROXY:'0'});
    handlers.set(env.DB,pending);
    pending.catch(()=>handlers.delete(env.DB));
  }
  try {
    const handler=await pending;
    const headers=Object.fromEntries(request.headers.entries());
    headers.host=new URL(request.url).host;
    // Drain the bounded Fetch body even when the API rejects before parsing it.
    // Leaving a rejected POST body unread can reset the local proxy connection.
    const chunks=[];let bytes=0;
    if(request.body)for await(const chunk of request.body){bytes+=chunk.length;if(bytes>32768)return Response.json({message:'Dữ liệu quá lớn.'},{status:413});chunks.push(Buffer.from(chunk));}
    const req={url:request.url,method:request.method,headers,socket:{remoteAddress:clientAddress},
      async *[Symbol.asyncIterator]() { for(const chunk of chunks)yield chunk; }
    };
    const outgoing=new Headers(); let status=200, payload='';
    const res={headersSent:false,setHeader:(k,v)=>outgoing.set(k,v),
      writeHead:(s,h)=>{status=s;for(const[k,v]of Object.entries(h||{}))outgoing.set(k,v);res.headersSent=true;},
      end:b=>{payload=b ?? '';res.headersSent=true;}};
    await handler(req,res);
    return new Response(request.method==='HEAD'?null:payload,{status,headers:outgoing});
  } catch(e) { console.error('Cloud API initialization failed:',e.message);return Response.json({message:'Hệ thống đang khởi động. Vui lòng thử lại.'},{status:503}); }
}
`);
put('app/api/[...path]/route.ts', `import {handleApi} from '../../../lib/route.mjs';\nexport const dynamic='force-dynamic';\nexport const GET=handleApi;export const POST=handleApi;export const PUT=handleApi;export const PATCH=handleApi;export const DELETE=handleApi;export const HEAD=handleApi;\n`);
let ui=readFileSync('src/main.jsx','utf8').replaceAll('\r\n','\n').replace('import { createRoot } from "react-dom/client";\n','').replace('import "./styles.css";\n','').replace('function App() {','export default function App() {').replace('useState(location.pathname)','useState(typeof location === "undefined" ? "/" : location.pathname)').replace('createRoot(document.getElementById("root")).render(<App />);','');
put('app/TaskHub.jsx','"use client";\n'+ui);
put('app/globals.css',readFileSync('src/styles.css','utf8'));
for(const [file,relative] of [['app/page.tsx','./TaskHub'],['app/app/page.tsx','../TaskHub'],['app/portal/[workspace]/page.tsx','../../TaskHub']]) put(file,`import TaskHub from '${relative}';\nexport default function Page(){return <TaskHub/>;}\n`);
put('app/layout.tsx',`import './globals.css';\nexport const metadata={title:'TaskHub · Điều hành tour, cùng một nhịp',description:'TaskHub hỗ trợ doanh nghiệp lữ hành quản lý tour, lịch/số chỗ và công việc.',icons:{icon:'/favicon.svg'}};\nexport default function Layout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>;}\n`);
put('README.md',`# TaskHub cloud\n\nGenerated from the TaskHub FE/BE by scripts/export-sites.mjs. Uses Sites Workers and persistent D1, independent of the owner's PC. Runtime credentials are private environment secrets. No CP2 or local personal data is imported.\n`);
copyFileSync('cloud/schema.ts',join(target,'db/schema.ts'));
copyFileSync('cloud/favicon.svg',join(target,'public/favicon.svg'));
function copyMigrations(from,to) {
  mkdirSync(to,{recursive:true});
  for(const entry of readdirSync(from,{withFileTypes:true})) {
    const source=join(from,entry.name),dest=join(to,entry.name);
    if(entry.isDirectory())copyMigrations(source,dest);
    else { if(existsSync(dest))assert.ok(readFileSync(source).equals(readFileSync(dest)),'Migration history differs; preserve applied files: '+entry.name); else copyFileSync(source,dest); }
  }
}
copyMigrations('cloud/drizzle',join(target,'drizzle'));
let worker=readFileSync(join(target,'build/sites-worker.ts'),'utf8');
if(!worker.includes('TaskHub response headers')) {
  worker=worker.replace('  fetch(request:', '  async fetch(request:').replace('    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));', `    // TaskHub response headers also protect framework-rendered HTML.
    const response=await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    const headers=new Headers(response.headers);
    headers.set('X-Content-Type-Options','nosniff');headers.set('X-Frame-Options','DENY');headers.set('Referrer-Policy','same-origin');
    if(!headers.has('Content-Security-Policy'))headers.set('Content-Security-Policy',"frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});`);
  put('build/sites-worker.ts',worker);
}
const manifest=JSON.parse(readFileSync(join(target,'.openai/hosting.json'),'utf8'));
assert.ok(manifest.project_id,'Register the Site before exporting.');
manifest.d1='DB';manifest.r2=null;delete manifest.static;
put('.openai/hosting.json',JSON.stringify(manifest,null,2)+'\n');
console.log('TaskHub UI/API exported with atomic D1 writes; no secrets or runtime data copied.');
