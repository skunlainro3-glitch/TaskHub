import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { openDatabase, seedWorkspace, purgeExpired } from '../server/db.mjs';
import { createAccounts, deleteAccount } from '../server/accounts.mjs';
import { qaTour } from './fixtures.mjs';

const hash = s => 'test-hash:' + s;
const digest = s => createHash('sha256').update(s).digest('hex');
const now = () => new Date().toISOString();
const cleanup = dir => { const root=resolve(tmpdir()); assert.ok(resolve(dir).startsWith(root+sep)); rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100}); };
const rejection = (status, message) => error => error.status === status && (!message || message.test(error.message));

test('account links and team membership: secure tokens, additive data and safe workspace lifecycle', async t => {
  const dir=mkdtempSync(join(tmpdir(),'taskhub-accounts-'));
  const previous=process.env.TURSO_DATABASE_URL;
  // libSQL may retain native file handles until process exit on Windows. Unit
  // tests need no persistence; API tests below exercise its real file storage.
  if(process.env.TEST_DATABASE_DRIVER==='libsql')process.env.TURSO_DATABASE_URL='file::memory:';
  else delete process.env.TURSO_DATABASE_URL;
  const db=await openDatabase(dir);
  const addUser=async(name,role='operations',workspace=name)=>{
    await seedWorkspace(db,workspace,'Không gian '+name);
    const user={id:name,email:name+'@example.test',name,password:hash('before-password'),workspace,role,company_size:'10to30',consent_at:now(),consent_version:'test'};
    await db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)').run(...Object.values(user));
    return user;
  };
  try {
    const owner=await addUser('owner'),other=await addUser('other'),admin=await addUser('admin','admin');
    const settings={NODE_ENV:'test',PUBLIC_APP_URL:'https://taskhub-travel.pages.dev',MAIL_FROM:'taskhub@example.test'};
    const messages=[];
    const accounts=createAccounts(db,settings,{hashPassword:hash,sendMail:async message=>messages.push(message)});
    const noMail=createAccounts(db,settings,{hashPassword:hash});
    await t.test('no provider means no delivery and no public recovery token, even for existing email',async()=>{
      assert.equal((await noMail.security(owner)).mail_ready,false);
      assert.deepEqual(await noMail.forgot(owner.email),await noMail.forgot('unknown@example.test'));
      assert.equal((await noMail.forgot(owner.email)).mail_ready,false);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM account_tokens').get()).n,0);
      assert.equal(noMail.requestVerification,undefined);
      assert.equal(noMail.confirmVerification,undefined);
    });
    await t.test('password reset links are hashed, expiring and never disclosed by the request API',async()=>{
      const reply=await accounts.forgot(owner.email);assert.equal(reply.mail_ready,true);assert.ok(!('token' in reply));
      const raw=new URL(messages.at(-1).text.split('\n')[0].split(': ').at(-1)).searchParams.get('reset');
      assert.equal(raw.length,64);const stored=await db.prepare('SELECT * FROM account_tokens').get();assert.equal(stored.token,digest(raw));assert.ok(!stored.token.includes(raw));
      assert.equal(stored.purpose,'reset');assert.ok(stored.expires>Date.now() && stored.expires<=Date.now()+30*60000);
      await accounts.forgot(owner.email);assert.equal(messages.length,1,'One account cannot flood reset emails within a minute');
      assert.ok(!('email_verified' in await accounts.security(owner)));
    });
    await t.test('reset is one-use, invalidates sessions and preserves protected system credentials',async()=>{
      await accounts.forgot(owner.email);
      const raw=messages.at(-1).text.match(/reset=([a-f0-9]+)/)[1];
      await db.prepare('INSERT INTO sessions VALUES (?,?,?)').run('owner-session',owner.id,Date.now()+60000);
      await assert.rejects(accounts.reset(raw,'short'),rejection(400));
      await accounts.reset(raw,'new-password');
      assert.equal((await db.prepare('SELECT password FROM users WHERE id=?').get(owner.id)).password,hash('new-password'));
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=?').get(owner.id)).n,0);
      await assert.rejects(accounts.reset(raw,'another-password'),rejection(400));
      const before=messages.length;await accounts.forgot(admin.email);assert.equal(messages.length,before);
      await db.prepare('INSERT INTO account_tokens VALUES (?,?,?,?,NULL,?)').run(digest('a'.repeat(64)),admin.id,'reset',Date.now()+60000,now());
      await assert.rejects(accounts.reset('a'.repeat(64),'forbidden-password'),rejection(400));
      assert.equal((await db.prepare('SELECT password FROM users WHERE id=?').get(admin.id)).password,hash('before-password'));
    });
    await t.test('expired tokens fail and a delivery failure deletes its token without exposing a link',async()=>{
      const raw='b'.repeat(64);await db.prepare('INSERT INTO account_tokens VALUES (?,?,?,?,NULL,?)').run(digest(raw),other.id,'reset',Date.now()-1,now());
      await assert.rejects(accounts.reset(raw,'next-password'),rejection(400));
      await db.prepare('DELETE FROM account_tokens WHERE user_id=?').run(other.id);
      const broken=createAccounts(db,settings,{hashPassword:hash,sendMail:async()=>{throw Error('provider secret body');}});
      const result=await broken.forgot(other.email);assert.equal(result.ok,true);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM account_tokens WHERE user_id=?').get(other.id)).n,0);
    });
    await t.test('parallel password reset consumes one token exactly once',async()=>{
      const raw='c'.repeat(64);
      await db.prepare('INSERT INTO account_tokens VALUES (?,?,?,?,NULL,?)').run(digest(raw),other.id,'reset',Date.now()+60000,now());
      const attempts=await Promise.allSettled([accounts.reset(raw,'first-new-password'),accounts.reset(raw,'second-new-password')]);
      assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);
      assert.equal(attempts.filter(r=>r.status==='rejected'&&r.reason.status===400).length,1);
    });
    let staff;
    await t.test('invites are owner-only, bound to email and claimed once without moving existing accounts',async()=>{
      const invite=await accounts.invite(owner,{email:'member@example.test',permission:'viewer'});
      const token=new URL(invite.url).searchParams.get('invite');
      assert.equal(new URL(invite.url).origin,settings.PUBLIC_APP_URL);
      const preview=await accounts.preview(token);assert.equal(preview.permission,'viewer');assert.ok(!JSON.stringify(preview).includes('member@'));
      await assert.rejects(accounts.accept({token,email:'wrong@example.test',name:'Member',password:'member-password',consent:true}),rejection(400));
      await assert.rejects(accounts.accept({token,email:'member@example.test',name:'Member',password:'member-password',consent:false}),rejection(400));
      staff=await accounts.accept({token,email:'member@example.test',name:'Member',password:'member-password',consent:true});
      assert.equal(staff.role,'staff');assert.equal(staff.workspace,owner.workspace);assert.equal(staff.staff_permission,'viewer');
      assert.equal((await accounts.security(staff)).can_delete_workspace,false);
      await assert.rejects(accounts.preview(token),rejection(404));
      await assert.rejects(accounts.accept({token,email:'member@example.test',name:'Member',password:'member-password',consent:true}),rejection(400));
      await assert.rejects(accounts.invite(owner,{email:other.email,permission:'editor'}),rejection(409));
      assert.equal((await db.prepare('SELECT workspace FROM users WHERE id=?').get(other.id)).workspace,other.workspace);
      await assert.rejects(accounts.invite(staff,{email:'forbidden@example.test',permission:'editor'}),rejection(403));
      assert.equal((await accounts.team(other)).members.length,0);
      await assert.rejects(accounts.updateMember(other,staff.id,{permission:'editor'}),rejection(404));
      await accounts.updateMember(owner,staff.id,{permission:'editor'});assert.equal((await accounts.team(owner)).members[0].permission,'editor');
    });
    await t.test('revocation and staff self-deletion preserve shared tours, owner and other members',async()=>{
      const pending=await accounts.invite(owner,{email:'revoked@example.test',permission:'editor'});
      await accounts.revokeInvite(owner,pending.id);await assert.rejects(accounts.preview(new URL(pending.url).searchParams.get('invite')),rejection(404));
      await db.prepare('INSERT INTO tours VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('tour',owner.workspace,qaTour.title,qaTour.destination,qaTour.departure,qaTour.duration,qaTour.price,qaTour.capacity,qaTour.reserved,qaTour.description,qaTour.itinerary,qaTour.theme,1,1,now());
      await deleteAccount(db,staff);
      assert.ok(await db.prepare('SELECT id FROM users WHERE id=?').get(owner.id));assert.ok(await db.prepare('SELECT id FROM tours WHERE id=?').get('tour'));
      assert.equal(await db.prepare('SELECT id FROM users WHERE id=?').get(staff.id),undefined);
      await assert.rejects(deleteAccount(db,admin),rejection(403));
    });
    await t.test('parallel invitation acceptance creates exactly one staff account',async()=>{
      const invitation=await accounts.invite(owner,{email:'parallel-member@example.test',permission:'viewer'});
      const input={token:new URL(invitation.url).searchParams.get('invite'),email:'parallel-member@example.test',name:'Parallel',password:'parallel-password',consent:true};
      const attempts=await Promise.allSettled([accounts.accept(input),accounts.accept(input)]);
      assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);
      assert.equal(attempts.filter(r=>r.status==='rejected').length,1);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM users WHERE email=?').get(input.email)).n,1);
      const member=await db.prepare('SELECT * FROM users WHERE email=?').get(input.email);
      await accounts.removeMember(owner,member.id);
      assert.ok(await db.prepare('SELECT id FROM workspaces WHERE id=?').get(owner.workspace));
    });
    await t.test('retention expires only the staff member, then owner expiry deletes their workspace normally',async()=>{
      const made=await accounts.invite(owner,{email:'old-member@example.test',permission:'editor'});
      const member=await accounts.accept({token:new URL(made.url).searchParams.get('invite'),email:'old-member@example.test',name:'Old member',password:'member-password',consent:true});
      await db.prepare("UPDATE users SET consent_at='2000-01-01T00:00:00.000Z' WHERE id=?").run(member.id);
      await purgeExpired(db);assert.ok(await db.prepare('SELECT id FROM users WHERE id=?').get(owner.id));assert.ok(await db.prepare('SELECT id FROM tours WHERE id=?').get('tour'));
      assert.equal(await db.prepare('SELECT id FROM users WHERE id=?').get(member.id),undefined);
      await db.prepare("UPDATE users SET consent_at='2000-01-01T00:00:00.000Z' WHERE id=?").run(owner.id);
      await purgeExpired(db);assert.equal(await db.prepare('SELECT id FROM workspaces WHERE id=?').get(owner.workspace),undefined);
      assert.ok(await db.prepare('SELECT id FROM users WHERE id=?').get(other.id));
    });
  } finally { db.close();if(previous===undefined)delete process.env.TURSO_DATABASE_URL;else process.env.TURSO_DATABASE_URL=previous;await new Promise(resolve=>setTimeout(resolve,100));cleanup(dir); }
});

test('shared staff API enforces viewer/editor permissions and excludes staff from research',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'taskhub-team-api-')),path=join(dir,'taskhub.sqlite');
  const port=5200+Math.floor(Math.random()*180),base='http://127.0.0.1:'+port;
  const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'test',HOST:'127.0.0.1',PORT:String(port),DATA_DIR:dir,ADMIN_EMAIL:'admin@example.test',ADMIN_PASSWORD:'Accounts-admin-password!',REVIEWER_EMAIL:'reviewer@example.test',REVIEWER_PASSWORD:'Accounts-reviewer-password!',PUBLIC_APP_URL:'https://taskhub-travel.pages.dev',MAIL_API_URL:'',MAIL_API_TOKEN:'',MAIL_FROM:'',TURSO_DATABASE_URL:process.env.TEST_DATABASE_DRIVER==='libsql'?'file:'+path.replaceAll('\\','/'):'',TURSO_AUTH_TOKEN:'',REQUIRE_REMOTE_DB:'0'},stdio:'pipe'});
  let stderr='';child.stderr.on('data',d=>stderr+=d);
  const request=async(path,method='GET',body,cookie)=>{
    const response=await fetch(base+'/api'+path,{method,headers:{'X-TaskHub':'1','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const text=await response.text();return {status:response.status,body:text.startsWith('{')?JSON.parse(text):text,cookie:response.headers.get('set-cookie')?.split(';')[0]};
  };
  try {
    let ready=false;for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error(stderr);try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,stderr);
    const owner=await request('/register','POST',{name:'Owner',email:'owner@example.test',password:'owner-password',role:'operations',company_size:'10to30',consent:true});assert.equal(owner.status,201);assert.equal(owner.body.user.workspace_permission,'owner');
    const admin=await request('/login','POST',{email:'admin@example.test',password:'Accounts-admin-password!'}),reviewer=await request('/login','POST',{email:'reviewer@example.test',password:'Accounts-reviewer-password!'});
    assert.equal((await request('/password/forgot','POST',{email:'owner@example.test'})).body.mail_ready,false);
    assert.deepEqual((await request('/password/forgot','POST',{email:'owner@example.test'})).body,(await request('/password/forgot','POST',{email:'none@example.test'})).body);
    const invitation=await request('/team/invites','POST',{email:'staff@example.test',permission:'viewer'},owner.cookie);assert.equal(invitation.status,201);
    const staff=await request('/team/invites/accept','POST',{token:new URL(invitation.body.url).searchParams.get('invite'),email:'staff@example.test',name:'Staff',password:'staff-password',consent:true});assert.equal(staff.status,201);assert.equal(staff.body.user.workspace_permission,'viewer');
    assert.equal((await request('/workspace','GET',null,staff.cookie)).status,200);
    assert.equal((await request('/tours','POST',qaTour,staff.cookie)).status,403);
    assert.equal((await request('/team','GET',null,staff.cookie)).status,403);
    assert.equal((await request('/team/invites','POST',{email:'bad@example.test',permission:'editor'},reviewer.cookie)).status,403);
    assert.equal((await request('/team/members/'+staff.body.user.id,'PATCH',{permission:'editor'},owner.cookie)).status,200);
    const state=(await request('/session','GET',null,staff.cookie)).body.user;assert.equal(state.workspace_permission,'editor');
    const tour=await request('/tours','POST',qaTour,staff.cookie);assert.equal(tour.status,201);
    assert.ok((await request('/workspace','GET',null,owner.cookie)).body.tours.some(t=>t.id===tour.body.id));
    assert.equal((await request('/events','POST',{action:'portal_viewed'},staff.cookie)).status,200);
    assert.deepEqual((await request('/interactions','POST',{events:[{id:randomUUID(),kind:'click',control:'test',area:'workspace',at:now()}]},staff.cookie)).body,{count:0});
    assert.equal((await request('/feedback','POST',{},staff.cookie)).status,404);
    assert.equal((await request('/feedback/features','POST',{},staff.cookie)).status,404);
    const research=(await request('/research','GET',null,admin.cookie)).body;assert.equal(research.participants,1);assert.equal(research.events,1,'Only owner test_started is research data');
    assert.equal((await request('/account','DELETE',null,staff.cookie)).status,200);
    assert.equal((await request('/session','GET',null,staff.cookie)).body.user,null);
    assert.ok((await request('/workspace','GET',null,owner.cookie)).body.tours.some(t=>t.id===tour.body.id));
    assert.equal((await request('/account','DELETE',null,owner.cookie)).status,200);
  } finally { if(child.exitCode===null){child.kill();await once(child,'exit');}cleanup(dir); }
});
