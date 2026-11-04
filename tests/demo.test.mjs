import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { openDatabase } from '../server/db.mjs';
import { loadDemoWorkspace, demoScenario } from '../server/demo.mjs';

async function fixture(run) {
  const root = resolve(tmpdir()), dir = mkdtempSync(join(root, 'taskhub-demo-'));
  const previous = { url: process.env.TURSO_DATABASE_URL, required: process.env.REQUIRE_REMOTE_DB };
  process.env.TURSO_DATABASE_URL = process.env.TEST_DATABASE_DRIVER === 'libsql' ? 'file::memory:' : '';
  process.env.REQUIRE_REMOTE_DB = '0';
  let db;
  try {
    db = await openDatabase(dir);
    const addUser = async (id, workspace = id, role = 'operations') => {
      await db.prepare('INSERT OR IGNORE INTO workspaces VALUES (?,?)').run(workspace, 'QA ' + workspace);
      const user = { id, workspace, role };
      await db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)').run(id, id + '@example.test', 'QA ' + id, 'not-a-password', workspace, role, '10to30', new Date().toISOString(), 'test-consent');
      return user;
    };
    await run({ db, user: await addUser('owner'), other: await addUser('other'), addUser });
  } finally {
    db?.close();
    if (previous.url === undefined) delete process.env.TURSO_DATABASE_URL; else process.env.TURSO_DATABASE_URL = previous.url;
    if (previous.required === undefined) delete process.env.REQUIRE_REMOTE_DB; else process.env.REQUIRE_REMOTE_DB = previous.required;
    assert.ok(dir.startsWith(root + sep + 'taskhub-demo-'));
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
}

const count = async (db, table) => (await db.prepare('SELECT COUNT(*) AS n FROM ' + table).get()).n;

test('optional sample data is isolated, explicit, seat-consistent and idempotent under retries', async () => fixture(async ({ db, user, other }) => {
  assert.equal(await count(db, 'tours'), 0, 'Registration must not auto-seed fictional inventory');
  const results = await Promise.all([loadDemoWorkspace(db, user), loadDemoWorkspace(db, user)]);
  assert.equal(results.filter(r => !r.already_loaded).length, 1);
  assert.equal(results.filter(r => r.already_loaded).length, 1);
  const tours = await db.prepare('SELECT * FROM tours WHERE workspace=? ORDER BY departure').all(user.workspace);
  assert.deepEqual(tours.map(t => t.reserved), [22, 18, 12]);
  assert.deepEqual(tours.map(t => t.capacity), [30, 25, 20]);
  assert.ok(tours.every(t => t.title.startsWith('[Demo]') && t.description.includes('giả lập')));
  assert.ok(tours.every(t => ['danang', 'dalat', 'phuquoc'].includes(t.theme)), 'Samples must remain editable through the existing tour form/API');
  const pools = await db.prepare('SELECT * FROM pooling WHERE workspace=? ORDER BY partner').all(user.workspace);
  assert.deepEqual(pools.map(p => [p.status, p.paid]).sort(), [['confirmed', 8500000], ['confirmed', 33600000], ['pending', 0]].sort());
  assert.equal(pools.find(p => p.paid === 8500000).seats * pools.find(p => p.paid === 8500000).unit_price, 17000000);
  const tasks = await db.prepare('SELECT * FROM tasks WHERE workspace=? ORDER BY id').all(user.workspace);
  assert.equal(tasks.length, 3);
  assert.ok(tasks.every(task => /^\d{4}-\d{2}-\d{2}$/.test(task.due)), 'Samples must remain editable through the date-only task form/API');
  assert.equal(tasks[2].tour_id, tours[0].id, 'TASK-03 belongs to the simulated TOUR-01');
  assert.ok(!tasks[2].title.includes('Testers'));
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM tours WHERE workspace=?').get(other.workspace)).n, 0);
  const events = await db.prepare('SELECT action,entity FROM events WHERE user_id=?').all(user.id);
  assert.equal(events.length, 1);
  assert.equal(events[0].action, 'demo_loaded');
  assert.equal(JSON.parse(events[0].entity).simulated, true);
  assert.equal(await count(db, 'pooling_audit'), 3);
  await db.prepare('UPDATE tours SET title=? WHERE id=?').run('Owner edit to keep', tours[0].id);
  assert.equal((await loadDemoWorkspace(db, user)).already_loaded, true);
  assert.equal((await db.prepare('SELECT title FROM tours WHERE id=?').get(tours[0].id)).title, 'Owner edit to keep');
}));

test('sample loading rejects existing business records and system/staff/consent bypasses', async () => fixture(async ({ db, user, addUser }) => {
  await db.prepare('INSERT INTO tours VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('existing', user.workspace, 'Real input to keep', 'Hà Nội', '2026-12-01', '1 ngày', 1, 10, 0, 'Existing record', 'N1', 'danang', 0, 1, new Date().toISOString());
  await assert.rejects(loadDemoWorkspace(db, user), e => e.status === 409);
  assert.equal(await count(db, 'tours'), 1);
  assert.equal(await count(db, 'events'), 0);
  for (const role of ['admin', 'reviewer', 'staff']) {
    const restricted = await addUser('restricted-' + role, 'agency', role);
    await assert.rejects(loadDemoWorkspace(db, restricted), e => e.status === 403);
  }
  const noConsent = await addUser('no-consent');
  await db.prepare('UPDATE users SET consent_version=? WHERE id=?').run('', noConsent.id);
  await assert.rejects(loadDemoWorkspace(db, noConsent), e => e.status === 403);
  await assert.rejects(loadDemoWorkspace(db, { ...noConsent, workspace: user.workspace }), e => e.status === 403);
}));

test('sample data batch rolls back all inventory, audit and marker if any write fails', async () => fixture(async ({ db, user }) => {
  await db.exec("CREATE TRIGGER qa_demo_failure BEFORE INSERT ON tasks WHEN NEW.title LIKE '%Gửi lịch trình%' BEGIN SELECT RAISE(ABORT,'QA_DEMO_FAILURE'); END;");
  await assert.rejects(loadDemoWorkspace(db, user), /QA_DEMO_FAILURE/);
  for (const table of ['tours', 'tasks', 'pooling', 'pooling_audit', 'events']) assert.equal(await count(db, table), 0, table + ' must roll back');
  await db.exec('DROP TRIGGER qa_demo_failure');
  assert.equal((await loadDemoWorkspace(db, user)).already_loaded, false);
  assert.equal(await count(db, 'tours'), demoScenario.tours.length);
}));

