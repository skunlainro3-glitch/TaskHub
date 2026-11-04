import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { qaTour } from './fixtures.mjs';
import { parseFeatureFeedback,featureIds,testerFields,featureFields } from '../server/feature-feedback.mjs';
import { summarizeSurvey } from '../scripts/survey-report.mjs';
import { parseCsv } from '../scripts/research-report.mjs';

const answer = () => ({
  entries: featureIds.map(feature => feature==='portal'
    ? {feature,mode:'self',result:'completed',importance:5,ease:4,intent:'yes'}
    : feature==='operations'
      ? {feature,mode:'demo',result:'viewed',importance:3,ease:null,intent:'maybe'}
      : {feature,mode:'untried',result:'untried',importance:null,ease:null,intent:'na'}),
  price:null,price_status:'undecided',liked:'Điểm kiểm thử',disliked:'=FORMULA MUST STAY TEXT',
});

test('historical feature feedback stays readable without converting unknown values to zero',()=>{
  assert.equal(parseFeatureFeedback(null),null);
  const unknown=parseFeatureFeedback({entries:JSON.stringify(answer().entries),price:null,price_status:'undecided'});
  const zero=parseFeatureFeedback({entries:JSON.stringify(answer().entries),price:0,price_status:'provided'});
  assert.equal(unknown.price,null);assert.equal(zero.price,0);
  assert.equal(unknown.entries[1].ease,null);assert.equal(unknown.entries[2].mode,'untried');
});

test('polished API: historical survey exports, guarded task CRUD and past departures',async t=>{
  const tempRoot=resolve(tmpdir()),dir=mkdtempSync(join(tempRoot,'taskhub-polish-'));
  const path=join(dir,'taskhub.sqlite');
  // A pre-existing nine-column tasks table must gain a version without losing a row.
  const old=new DatabaseSync(path);
  old.exec('CREATE TABLE tasks(id TEXT PRIMARY KEY,workspace TEXT NOT NULL,tour_id TEXT NOT NULL,title TEXT NOT NULL,assignee TEXT NOT NULL,due TEXT NOT NULL,priority TEXT NOT NULL,status TEXT NOT NULL,created TEXT NOT NULL)');
  old.prepare('INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?)').run('old-task','old-workspace','old-tour','Kept task','QA','2026-01-01','normal','todo','2026-01-01T00:00:00.000Z');old.close();
  const base='http://127.0.0.1:'+(4700+Math.floor(Math.random()*200));
  const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'test',PORT:new URL(base).port,HOST:'127.0.0.1',DATA_DIR:dir,ADMIN_EMAIL:'admin@taskhub.local',ADMIN_PASSWORD:'Polish-admin-secret-2026!',REVIEWER_EMAIL:'reviewer@example.test',REVIEWER_PASSWORD:'Polish-reviewer-secret-2026!',TURSO_DATABASE_URL:process.env.TEST_DATABASE_DRIVER==='libsql'?'file:'+path.replaceAll('\\','/'):'',TURSO_AUTH_TOKEN:'',REQUIRE_REMOTE_DB:'0'},stdio:'pipe'});
  let stderr='';child.stderr.on('data',d=>{stderr+=d;});
  const request=async(path,method='GET',data,cookie)=>{
    const r=await fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json','X-TaskHub':'1',...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})});
    const text=await r.text();return {status:r.status,body:text.startsWith('{')?JSON.parse(text):text,cookie:r.headers.get('set-cookie')?.split(';')[0]};
  };
  const register=name=>request('/register','POST',{name:'=QA '+name,email:name+'@taskhub.invalid',password:'Polish-participant-secret-2026!',role:'operations',company_size:'10to30',consent:true});
  try {
    let started=false;
    for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error(stderr);try{if((await fetch(base+'/api/health')).ok){started=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
    assert.ok(started,stderr);
    const raw=new DatabaseSync(path);assert.equal(raw.prepare("SELECT version,title FROM tasks WHERE id='old-task'").get().version,1);assert.equal(raw.prepare("SELECT title FROM tasks WHERE id='old-task'").get().title,'Kept task');raw.close();
    const a=await register('polish-a'),b=await register('polish-b'),cookie=a.cookie;
    assert.equal(a.status,201);assert.equal(b.status,201);
    const admin=await request('/login','POST',{email:'admin@taskhub.local',password:'Polish-admin-secret-2026!'}),reviewer=await request('/login','POST',{email:'reviewer@example.test',password:'Polish-reviewer-secret-2026!'});
    const workspace=async c=>(await request('/workspace','GET',null,c||cookie)).body;
    // Seed prior records directly in the disposable DB, never through retired APIs.
    const seedHistory=(id,{legacy,features,created=new Date().toISOString()})=>{
      const archive=new DatabaseSync(path);
      try {
        if(legacy)archive.prepare('INSERT INTO feedback VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET liked=excluded.liked,created=excluded.created').run(id,legacy.portal,legacy.operations,legacy.sync,legacy.ease,legacy.intent,legacy.price,legacy.liked,legacy.disliked,created);
        if(features)archive.prepare('INSERT INTO feature_feedback VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET entries=excluded.entries,price=excluded.price,price_status=excluded.price_status,liked=excluded.liked,disliked=excluded.disliked,created=excluded.created').run(id,JSON.stringify(features.entries),features.price,features.price_status,features.liked,features.disliked,created);
      } finally {archive.close();}
    };
    await t.test('retired survey writes return 404 while historical records and protected exports remain intact',async()=>{
      const empty=await request('/export/survey-testers','GET',null,admin.cookie);assert.deepEqual(parseCsv(empty.body).headers,testerFields);assert.equal(parseCsv(empty.body).rows.length,0);
      const before=(await request('/research','GET',null,admin.cookie)).body.events;
      for(const c of [undefined,admin.cookie,reviewer.cookie,cookie,b.cookie]) {
        assert.equal((await request('/feedback/features','POST',answer(),c)).status,404);
        assert.equal((await request('/feedback','POST',{portal:4,operations:3,sync:4,ease:4,intent:'maybe',price:0},c)).status,404);
      }
      assert.equal((await request('/research','GET',null,admin.cookie)).body.events,before,'Retired endpoints do not create interaction data');
      const current=await workspace();for(const key of ['feedback','featureFeedback','completedActions'])assert.equal(Object.hasOwn(current,key),false);
      const legacy={portal:4,operations:3,sync:4,ease:4,intent:'maybe',price:0,liked:'Legacy kept',disliked:''};
      seedHistory(a.body.user.id,{legacy,features:{...answer(),price:0,price_status:'provided'}});
      const research=(await request('/research','GET',null,reviewer.cookie)).body;
      assert.equal(research.feedback.length,1);assert.equal(research.featureFeedback.length,1);assert.equal(research.uniqueResponseCount,1);assert.equal(research.readyToReview,0);
      assert.equal(research.feedback[0].liked,'Legacy kept');assert.equal(research.featureFeedback[0].entries[1].ease,null);
      assert.equal((await request('/export/survey-testers','GET',null,cookie)).status,403);
      const testers=await request('/export/survey-testers','GET',null,admin.cookie),features=await request('/export/survey-features','GET',null,reviewer.cookie);
      assert.deepEqual(parseCsv(testers.body).headers,testerFields);assert.deepEqual(parseCsv(features.body).headers,featureFields);
      assert.equal(parseCsv(testers.body).rows.length,1);assert.equal(parseCsv(features.body).rows.length,2,'Untried features must not become observations');
      assert.ok(testers.body.includes("'=FORMULA MUST STAY TEXT"));
      const report=summarizeSurvey(testers.body,features.body);assert.equal(report.experiencedEmailRecords,1);assert.equal(report.willingnessToPay.n,1);assert.equal(report.willingnessToPay.zero,1);assert.equal(report.excluded.featureInvalid,0);
      seedHistory(a.body.user.id,{features:answer()});
      const unknown=summarizeSurvey((await request('/export/survey-testers','GET',null,admin.cookie)).body,(await request('/export/survey-features','GET',null,admin.cookie)).body);
      assert.equal(unknown.willingnessToPay.n,0);assert.equal(unknown.willingnessToPay.unknown,1);
    });
    let tour,task;
    await t.test('all task mutations require optimistic versions and reject stale or unversioned status changes',async()=>{
      const created=await request('/tours','POST',{...qaTour,title:'QA task tour'},cookie);assert.equal(created.status,201);tour=(await workspace()).tours.find(t=>t.id===created.body.id);
      const body={tour_id:tour.id,title:'First task',assignee:'QA assignee',due:'2026-12-01',priority:'normal'};
      const made=await request('/tasks','POST',body,cookie);assert.equal(made.status,201);task=(await workspace()).tasks.find(t=>t.id===made.body.id);assert.equal(task.version,1);
      assert.equal((await request('/tasks/'+task.id,'PUT',{...task,title:'Edited task',assignee:'Other assignee',priority:'high'},cookie)).status,200);
      assert.equal((await request('/tasks/'+task.id,'PUT',{...task,title:'Stale edit'},cookie)).status,409);
      let current=(await workspace()).tasks.find(t=>t.id===task.id);assert.equal(current.title,'Edited task');assert.equal(current.version,2);
      assert.equal((await request('/tasks/'+task.id,'PATCH',{status:'doing',version:1},cookie)).status,409);
      assert.equal((await request('/tasks/'+task.id,'PUT',{...current,tour_id:tour.id},b.cookie)).status,404);
      assert.equal((await request('/tasks/'+task.id,'DELETE',{version:current.version},b.cookie)).status,409);
      assert.equal((await request('/tasks/'+task.id,'DELETE',{version:current.version},reviewer.cookie)).status,403);
      assert.equal((await request('/tasks/'+task.id,'PATCH',{status:'doing',version:current.version},cookie)).status,200);
      assert.equal((await request('/tasks/'+task.id,'PATCH',{status:'done'},cookie)).status,400,'Missing version must not bypass overwrite protection');
      current=(await workspace()).tasks.find(t=>t.id===task.id);assert.equal(current.status,'doing');assert.equal(current.version,3);
      assert.equal((await request('/tasks/'+task.id,'PATCH',{status:'done',version:current.version},cookie)).status,200);
      assert.equal((await request('/tasks/'+task.id,'PATCH',{status:'todo',version:current.version},cookie)).status,409,'A stale click must not undo the newer status');
      current=(await workspace()).tasks.find(t=>t.id===task.id);assert.equal(current.version,4);
      assert.equal((await request('/tours/'+tour.id,'PUT',{...tour,published:true,reserved:tour.reserved-1},cookie)).status,200);
      assert.equal((await request('/events','POST',{action:'portal_viewed'},cookie)).status,200);
      seedHistory(a.body.user.id,{features:answer()});
      const dedup=(await request('/research','GET',null,admin.cookie)).body;
      assert.equal(dedup.uniqueResponseCount,1);assert.equal(dedup.readyToReview,1,'New feature response can qualify without double-counting its legacy response');
      assert.equal(dedup.feedback[0].has_test_flow,0,'Actions after a legacy response must not qualify that earlier response');
      assert.equal(dedup.featureFeedback[0].has_test_flow,1);
      assert.equal((await request('/tasks/'+task.id,'DELETE',{version:2},cookie)).status,409);
      assert.equal((await request('/tasks/'+task.id,'DELETE',{version:current.version},cookie)).status,200);
      assert.ok(!(await workspace()).tasks.some(t=>t.id===task.id));
    });
    await t.test('pooling history exports only the current workspace and neutralizes spreadsheet formulas',async()=>{
      const made=await request('/tours','POST',{...qaTour,title:'=QA ledger tour'},cookie);assert.equal(made.status,201);
      const pool=await request('/pooling','POST',{tour_id:made.body.id,partner:'=QA partner',seats:1,unit_price:100,note:'QA ledger'},cookie);assert.equal(pool.status,201);
      const own=(await workspace()).poolingHistory;assert.equal(own.length,1);assert.equal(own[0].actor_name,'=QA polish-a');assert.equal(own[0].pooling_id,pool.body.id);
      assert.deepEqual((await workspace(b.cookie)).poolingHistory,[]);
      const exported=await request('/pooling/history/export','GET',null,cookie);assert.equal(exported.status,200);
      assert.equal(parseCsv(exported.body).rows.length,1);for(const text of ['=QA ledger tour','=QA partner','=QA polish-a'])assert.ok(exported.body.includes("'"+text));
      assert.equal(parseCsv((await request('/pooling/history/export','GET',null,b.cookie)).body).rows.length,0);
      assert.equal(parseCsv((await request('/pooling/history/export','GET',null,reviewer.cookie)).body).rows.length,0,'Reviewer can only inspect its assigned workspace');
      const agencyTour=await request('/tours','POST',{...qaTour,title:'QA agency ledger tour'},admin.cookie);assert.equal(agencyTour.status,201);
      assert.equal((await request('/pooling','POST',{tour_id:agencyTour.body.id,partner:'QA agency partner',seats:1,unit_price:0},admin.cookie)).status,201);
      const viewed=await request('/pooling/history/export','GET',null,reviewer.cookie);assert.equal(viewed.status,200);assert.equal(parseCsv(viewed.body).rows.length,1);
      assert.ok(!viewed.body.includes('=QA partner'));
      assert.equal((await request('/pooling','POST',{tour_id:agencyTour.body.id,partner:'Forbidden',seats:1,unit_price:0},reviewer.cookie)).status,403);
    });
    await t.test('past departures remain readable but cannot take inquiries; today is accepted',async()=>{
      const made=await request('/tours','POST',{...qaTour,title:'Historical QA tour',departure:'2000-01-01'},cookie);assert.equal(made.status,201);
      const inquiry={tour_id:made.body.id,name:'QA visitor',email:'qa-visitor@taskhub.invalid',people:1,note:'Automated test',consent:true};
      const url='/public/'+a.body.user.workspace;
      assert.ok((await request(url)).body.tours.some(t=>t.id===made.body.id));
      assert.equal((await request(url+'/inquiries','POST',inquiry)).status,409);
      const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
      const sameDay=await request('/tours','POST',{...qaTour,title:'Today QA tour',departure:today},cookie);assert.equal(sameDay.status,201);
      assert.equal((await request(url+'/inquiries','POST',{...inquiry,tour_id:sameDay.body.id})).status,201);
      assert.equal((await request('/pooling/history/export')).status,401);
    });
    await t.test('account deletion cascades the additional survey data',async()=>{
      seedHistory(b.body.user.id,{legacy:{portal:3,operations:4,sync:3,ease:4,intent:'maybe',price:0,liked:'Legacy fallback',disliked:''}});
      const both=(await request('/research','GET',null,admin.cookie)).body;assert.equal(both.uniqueResponseCount,2,'Legacy-only participant is retained alongside new survey data');
      assert.equal(parseCsv((await request('/export/survey-testers','GET',null,admin.cookie)).body).rows.length,1,'Legacy answers are never synthesized into six-feature rows');
      assert.equal((await request('/account','DELETE',null,cookie)).status,200);
      const data=(await request('/research','GET',null,admin.cookie)).body;assert.equal(data.featureFeedback.length,0);assert.equal(data.feedback.length,1);assert.equal(data.uniqueResponseCount,1);
      assert.equal((await request('/account','DELETE',null,b.cookie)).status,200);
    });
  } finally {
    if(child.exitCode===null){const exit=once(child,'exit');child.kill();await exit;}
    assert.ok(dir.startsWith(tempRoot+sep+'taskhub-polish-'));rmSync(dir,{recursive:true,force:true});
  }
});
