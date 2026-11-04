import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {qaTour} from './fixtures.mjs';
import {csvRows,rowsToTours,importColumns} from '../src/import-tours.mjs';

test('tour import parses Excel-style rows without inventing missing numbers',()=>{
  const row={...qaTour,departure:'20/12/2026'};
  const matrix=[importColumns,importColumns.map(k=>row[k])];
  const parsed=rowsToTours(matrix)[0];assert.equal(parsed.departure,'2026-12-20');assert.equal(parsed.reserved,22);
  matrix[1][importColumns.indexOf('reserved')]='';assert.equal(rowsToTours(matrix)[0].reserved,null);
  assert.throws(()=>rowsToTours([['title'],['tour']]),/Thiếu cột/);
  assert.throws(()=>csvRows('a,b\n"unfinished'),/dấu nháy/);
  assert.deepEqual(csvRows('a,b\n"one\ntwo","a""b"'),[['a','b'],['one\ntwo','a"b']]);
  const withGap=rowsToTours([importColumns,[],importColumns.map(k=>row[k])]);assert.equal(withGap[0]._row,3);
});

test('operations: atomic import, B2B seat ledger and private click records',async t=>{
  const tempRoot=resolve(tmpdir()),dir=mkdtempSync(join(tempRoot,'taskhub-ops-'));
  const base='http://127.0.0.1:'+(4300+Math.floor(Math.random()*200));
  const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'test',PORT:new URL(base).port,HOST:'127.0.0.1',DATA_DIR:dir,ADMIN_EMAIL:'admin@taskhub.local',ADMIN_PASSWORD:'Ops-admin-secret-2026!',REVIEWER_EMAIL:'reviewer@example.test',REVIEWER_PASSWORD:'Ops-reviewer-secret-2026!',TURSO_DATABASE_URL:process.env.TEST_DATABASE_DRIVER==='libsql'?'file:'+join(dir,'taskhub.sqlite').replaceAll('\\','/'):'',TURSO_AUTH_TOKEN:'',REQUIRE_REMOTE_DB:'0'},stdio:'pipe'});
  let stderr='';child.stderr.on('data',d=>{stderr+=d;});
  const request=async(path,method='GET',data,cookie)=>{
    const r=await fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json','X-TaskHub':'1',...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})});
    const raw=await r.text();return {status:r.status,body:raw.startsWith('{')?JSON.parse(raw):raw,cookie:r.headers.get('set-cookie')?.split(';')[0]};
  };
  const register=async(name)=>request('/register','POST',{name,email:name+'@example.test',password:'Ops-test-secret-2026!',role:'operations',company_size:'10to30',consent:true});
  try {
    let started=false;
    for(let i=0;i<80;i++){if(child.exitCode!==null)throw Error(stderr);try{if((await fetch(base+'/api/health')).ok){started=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
    assert.ok(started,stderr);
    const a=await register('ops-a'),b=await register('ops-b'),cookie=a.cookie;
    assert.equal(a.status,201);assert.equal(b.status,201);
    const workspace=async()=>(await request('/workspace','GET',null,cookie)).body;
    const reviewer=await request('/login','POST',{email:'reviewer@example.test',password:'Ops-reviewer-secret-2026!'});
    await t.test('import previews errors, writes all-or-nothing, blocks replays and leaves tours unpublished',async()=>{
      const rows=[{...qaTour,title:'Import A'},{...qaTour,title:'Import B',reserved:31}],id=randomUUID();
      const preview=await request('/tours/import','POST',{rows,preview:true},cookie);assert.equal(preview.status,200);assert.equal(preview.body.count,1);assert.equal(preview.body.errors[0].row,3);
      assert.equal((await request('/tours/import','POST',{rows,import_id:id},cookie)).status,400);assert.equal((await workspace()).tours.length,0);
      rows[1].reserved=0;
      const imported=await request('/tours/import','POST',{rows,import_id:id},cookie);assert.equal(imported.status,200);assert.equal(imported.body.count,2);
      assert.ok((await workspace()).tours.every(t=>t.published===0));
      assert.equal((await request('/tours/import','POST',{rows,import_id:id},cookie)).status,409);
      assert.equal((await request('/tours/import','POST',{rows,import_id:randomUUID()},cookie)).status,400);
      assert.equal((await request('/tours/import','POST',{rows,import_id:randomUUID()},reviewer.cookie)).status,403);
      const large=Array.from({length:10},(_,i)=>({...qaTour,title:'Large '+i,itinerary:'x'.repeat(4000)}));
      assert.equal((await request('/tours/import','POST',{rows:large,preview:true},cookie)).status,200);
      assert.equal((await request('/tours/import','POST',{rows:Array(21).fill(qaTour),preview:true},cookie)).status,400);
    });
    let tour,pending,confirmed;
    await t.test('B2B confirmation reserves seats once; parallel/stale and cross-tenant writes fail',async()=>{
      const created=await request('/tours','POST',{...qaTour,title:'Pooling QA',capacity:10,reserved:2},cookie);assert.equal(created.status,201);
      tour=(await workspace()).tours.find(t=>t.id===created.body.id);
      const make=()=>request('/pooling','POST',{tour_id:tour.id,partner:'=QA partner',seats:5,unit_price:100000,note:'Automated QA only'},cookie);
      const p=await make(),q=await make();assert.equal(p.status,201);assert.equal(q.status,201);
      assert.equal((await request('/pooling','POST',{tour_id:tour.id,partner:'QA',seats:1,unit_price:1},b.cookie)).status,404);
      assert.equal((await request('/pooling/'+p.body.id,'PATCH',{action:'confirm',version:1,tour_version:tour.version},b.cookie)).status,404);
      const results=await Promise.all([p,q].map(p=>request('/pooling/'+p.body.id,'PATCH',{action:'confirm',version:1,tour_version:tour.version},cookie)));
      assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
      const data=await workspace();tour=data.tours.find(t=>t.id===tour.id);assert.equal(tour.reserved,7);
      confirmed=data.pooling.find(p=>p.status==='confirmed');pending=data.pooling.find(p=>p.status==='pending');
      assert.equal((await request('/pooling/'+pending.id,'PATCH',{action:'confirm',version:pending.version,tour_version:tour.version},cookie)).status,409);
      assert.equal((await request('/tours/'+tour.id,'PUT',{...tour,published:true,reserved:4},cookie)).status,409);
      const pub=(await request('/public/'+a.body.user.workspace)).body;assert.equal(pub.tours.find(t=>t.id===tour.id).reserved,7);assert.ok(!JSON.stringify(pub).includes('QA partner'));
      assert.equal((await request('/pooling','POST',{},reviewer.cookie)).status,403);
    });
    await t.test('reconciliation bounds payments; cancellation releases seats; active ledgers protect deletion',async()=>{
      assert.equal((await request('/pooling/'+confirmed.id,'PATCH',{action:'payment',version:confirmed.version,paid:500001},cookie)).status,400);
      assert.equal((await request('/pooling/'+confirmed.id,'PATCH',{action:'payment',version:confirmed.version,paid:200000},cookie)).status,200);
      confirmed=(await workspace()).pooling.find(p=>p.id===confirmed.id);
      assert.equal((await request('/pooling/'+confirmed.id,'PATCH',{action:'cancel',version:confirmed.version},cookie)).status,400);
      assert.equal((await request('/tours/'+tour.id,'DELETE',{version:tour.version},cookie)).status,409);
      assert.equal((await request('/pooling/export')).status,401);
      const exported=await request('/pooling/export','GET',null,cookie);assert.equal(exported.status,200);assert.ok(exported.body.includes("'=QA partner"));assert.ok(exported.body.includes('300000'));
      const exportRows=csvRows(exported.body),exportHeader=exportRows.shift(),statusColumn=exportHeader.indexOf('status'),balanceColumn=exportHeader.indexOf('balance');
      assert.equal(exportRows.find(row=>row[statusColumn]==='pending')[balanceColumn],'','A pending offer has no receivable');
      assert.equal(exportRows.find(row=>row[statusColumn]==='confirmed')[balanceColumn],'300000');
      assert.equal((await request('/pooling/'+confirmed.id,'PATCH',{action:'payment',version:confirmed.version,paid:0},cookie)).status,200);
      confirmed=(await workspace()).pooling.find(p=>p.id===confirmed.id);
      assert.equal((await request('/pooling/'+confirmed.id,'PATCH',{action:'cancel',version:confirmed.version},cookie)).status,200);
      assert.equal((await workspace()).tours.find(t=>t.id===tour.id).reserved,2);
      const cancelledRows=csvRows((await request('/pooling/export','GET',null,cookie)).body).slice(1);
      assert.equal(cancelledRows.find(row=>row[statusColumn]==='cancelled')[balanceColumn],'','A cancelled offer must not export an outstanding debt');
      assert.equal((await request('/pooling/'+confirmed.id,'PATCH',{action:'confirm',version:confirmed.version+1,tour_version:tour.version},cookie)).status,409);
    });
    await t.test('click batches are private, deduplicated, bounded and never retain form values',async()=>{
      const event={id:randomUUID(),kind:'click',control:'nav:pooling',area:'nav:dashboard',at:new Date().toISOString(),value:'SECRET-NOT-TO-STORE',target:tour.id};
      assert.equal((await request('/interactions','POST',{events:[event]},cookie)).status,200);
      assert.equal((await request('/interactions','POST',{events:[event]},cookie)).status,200);
      assert.equal((await request('/interactions','POST',{events:[{...event,id:randomUUID(),control:'bad email@example.test'}]},cookie)).status,400);
      const admin=await request('/login','POST',{email:'admin@taskhub.local',password:'Ops-admin-secret-2026!'});
      const csv=await request('/export/events','GET',null,admin.cookie);
      assert.equal(csv.body.split(event.id).length-1,1);assert.ok(!csv.body.includes('SECRET-NOT-TO-STORE'));assert.ok(csv.body.includes('nav:pooling'));
      const fresh=await workspace();const remaining=fresh.pooling.find(p=>p.status==='pending');const current=fresh.tours.find(t=>t.id===tour.id);
      assert.equal((await request('/pooling/'+remaining.id,'PATCH',{action:'confirm',version:remaining.version,tour_version:current.version},cookie)).status,200);
      assert.equal((await request('/account','DELETE',null,cookie)).status,200,'Account deletion must cascade even with confirmed B2B records');
    });
  }finally{
    if(child.exitCode===null){const done=once(child,'exit');child.kill();await done;}
    assert.ok(dir.startsWith(tempRoot+sep+'taskhub-ops-'));rmSync(dir,{recursive:true,force:true});
  }
});
