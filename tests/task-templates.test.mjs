import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openDatabase, seedWorkspace } from '../server/db.mjs';
import { qaTour } from './fixtures.mjs';
import { taskTemplateInput, taskDueDate } from '../shared/task-templates.mjs';
import { listTaskPeople, resolveTaskAssignee, listTaskTemplates, createTaskTemplate, updateTaskTemplate, previewTaskTemplate, applyTaskTemplate } from '../server/task-templates.mjs';

const at = () => new Date().toISOString();
const rejected = (status) => (error) => error.status === status;

test('task templates: relative schedules, tenant assignment, version guards and atomic idempotency', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'taskhub-task-template-'));
  const previous = process.env.TURSO_DATABASE_URL;
  if (process.env.TEST_DATABASE_DRIVER === 'libsql') process.env.TURSO_DATABASE_URL = 'file::memory:';
  else delete process.env.TURSO_DATABASE_URL;
  const db = await openDatabase(dir);
  try {
    for (const workspace of ['team', 'other']) await seedWorkspace(db, workspace, workspace);
    async function addUser(id, role, workspace = 'team', permission = 'editor') {
      await db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)').run(id, id + '@example.test', id, 'test-hash', workspace, role, '', at(), 'test');
      if (role === 'staff') await db.prepare('INSERT INTO workspace_members(user_id,workspace,permission,created,department) VALUES (?,?,?,?,?)').run(id, workspace, permission, at(), 'operations');
      return { id, name: id, role, workspace, workspace_permission: permission, department: 'operations' };
    }
    const owner = await addUser('owner', 'operations'), staff = await addUser('operator', 'staff');
    const viewer = await addUser('viewer', 'staff', 'team', 'viewer'), reviewer = await addUser('reviewer', 'reviewer');
    const other = await addUser('other-owner', 'operations', 'other');
    for (const [id, workspace] of [['tour', 'team'], ['foreign-tour', 'other']])
      await db.prepare('INSERT INTO tours(id,workspace,title,destination,departure,duration,price,capacity,reserved,description,itinerary,theme,published,version,updated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .run(id, workspace, qaTour.title, qaTour.destination, qaTour.departure, qaTour.duration, qaTour.price, qaTour.capacity, qaTour.reserved, qaTour.description, qaTour.itinerary, qaTour.theme, 0, 1, at());
    const body = () => ({ name: 'Quy trình thử', entries: [{ title: 'Việc trước ngày đi', offset_days: -2, priority: 'high', assignee_id: staff.id }, { title: 'Việc trong ngày đi', offset_days: 0, priority: 'normal', assignee_id: null }] });
    const create = async () => (await createTaskTemplate(db, owner, body())).template;
    const input = (template, extra = {}) => ({ version: template.version, tour_id: 'tour', tour_version: 1, run_id: randomUUID(), ...extra });

    await t.test('validates template limits and real calendar arithmetic', () => {
      assert.equal(taskDueDate('2028-03-01', -1), '2028-02-29');
      assert.equal(taskDueDate('2026-12-31', 1), '2027-01-01');
      assert.throws(() => taskDueDate('2026-02-30', 0), rejected(400));
      assert.throws(() => taskDueDate('2026-12-31', NaN), rejected(400));
      assert.throws(() => taskTemplateInput({ name: 'x', entries: [] }), rejected(400));
      assert.throws(() => taskTemplateInput({ ...body(), entries: [{ ...body().entries[0], offset_days: 1.5 }] }), rejected(400));
      assert.throws(() => taskTemplateInput({ ...body(), entries: Array.from({ length: 21 }, () => body().entries[0]) }), rejected(400));
    });
    await t.test('member picker excludes other workspaces, reviewer and all emails; legacy names remain unlinked', async () => {
      const { people } = await listTaskPeople(db, owner);
      assert(people.some((person) => person.id === staff.id));
      assert(!people.some((person) => person.id === other.id || person.id === reviewer.id));
      assert(people.every((person) => !Object.hasOwn(person, 'email')));
      assert.deepEqual(await resolveTaskAssignee(db, owner, { assignee: staff.name }), { assignee: staff.name, assignee_id: null });
      assert.deepEqual(await resolveTaskAssignee(db, owner, { assignee_id: staff.id, assignee: 'ignore manual name' }), { assignee: staff.name, assignee_id: staff.id });
      await assert.rejects(resolveTaskAssignee(db, owner, { assignee_id: other.id }), rejected(409));
      await assert.rejects(resolveTaskAssignee(db, owner, null), rejected(400));
    });
    await t.test('write permission is checked by the backend', async () => {
      await assert.rejects(createTaskTemplate(db, viewer, body()), rejected(403));
      await assert.rejects(createTaskTemplate(db, reviewer, body()), rejected(403));
      const bad = body(); bad.entries[0].assignee_id = other.id;
      await assert.rejects(createTaskTemplate(db, owner, bad), rejected(409));
      assert.equal((await listTaskTemplates(db, other)).templates.length, 0);
    });
    await t.test('create retries with the same request ID do not duplicate a saved recipe', async () => {
      const payload = { ...body(), request_id: randomUUID() };
      const attempts = await Promise.all([createTaskTemplate(db, owner, payload), createTaskTemplate(db, owner, payload)]);
      assert.equal(attempts[0].template.id, attempts[1].template.id);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM task_templates WHERE id=?').get(payload.request_id)).n, 1);
      await assert.rejects(createTaskTemplate(db, owner, { ...payload, name: 'Changed retry' }), rejected(409));
      await assert.rejects(createTaskTemplate(db, other, payload), rejected(409));
    });
    await t.test('preview schedules from departure and resolves only chosen member IDs', async () => {
      const template = await create();
      const preview = await previewTaskTemplate(db, owner, template.id, input(template, { default_assignee_id: owner.id }));
      assert.equal(preview.rows[0].due, '2026-12-18');
      assert.equal(preview.rows[0].assignee_id, staff.id);
      assert.equal(preview.rows[1].assignee_id, owner.id);
      assert.equal(preview.rows[1].due, '2026-12-20');
      await assert.rejects(previewTaskTemplate(db, other, template.id, input(template)), rejected(404));
      await assert.rejects(previewTaskTemplate(db, owner, template.id, input(template, { tour_id: 'foreign-tour' })), rejected(404));
      await assert.rejects(previewTaskTemplate(db, owner, template.id, input(template, { default_assignee_id: other.id })), rejected(409));
      await assert.rejects(previewTaskTemplate(db, owner, template.id, input(template, { tour_id: {} })), rejected(400));
      await assert.rejects(previewTaskTemplate(db, owner, template.id, input(template, { default_assignee_id: [] })), rejected(400));
    });
    await t.test('parallel replay creates one complete set, never duplicates tasks', async () => {
      const template = await create(), request = input(template);
      const attempts = await Promise.allSettled([applyTaskTemplate(db, owner, template.id, request), applyTaskTemplate(db, owner, template.id, request)]);
      assert.equal(attempts.filter((result) => result.status === 'fulfilled').length, 1);
      assert.equal(attempts.filter((result) => result.status === 'rejected' && result.reason.status === 409).length, 1);
      const rows = await db.prepare('SELECT * FROM tasks WHERE id LIKE ?').all(request.run_id + ':%');
      assert.equal(rows.length, 2); assert.equal(rows[0].assignee_id, staff.id);
      assert.equal(rows[1].assignee, 'Chưa phân công'); assert.equal(rows[1].assignee_id, null);
      await assert.rejects(applyTaskTemplate(db, owner, template.id, request), rejected(409));
    });
    await t.test('failed batch rolls back marker and every generated task; retry stays possible', async () => {
      const template = await create(), request = input(template);
      const broken = { ...db, batch: (statements) => db.batch([...statements, ['INSERT INTO workspaces(id,name) VALUES (?,NULL)', ['will-not-persist']]]) };
      await assert.rejects(applyTaskTemplate(broken, owner, template.id, request));
      assert.equal(await db.prepare('SELECT id FROM task_template_runs WHERE id=?').get(request.run_id), undefined);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE id LIKE ?').get(request.run_id + ':%')).n, 0);
      assert.equal((await applyTaskTemplate(db, owner, template.id, request)).count, 2);
    });
    await t.test('stale templates and changed tours cannot create a run', async () => {
      const template = await create();
      const changed = (await updateTaskTemplate(db, owner, template.id, { ...body(), name: 'Đã đổi', version: template.version })).template;
      await assert.rejects(updateTaskTemplate(db, owner, template.id, { ...body(), version: template.version }), rejected(409));
      await assert.rejects(applyTaskTemplate(db, owner, template.id, input(template)), rejected(409));
      await assert.rejects(applyTaskTemplate(db, owner, template.id, input(changed, { tour_version: 999 })), rejected(409));
    });
    await t.test('atomic marker rechecks versions after preview', async () => {
      const template = await create(), request = input(template);
      const raced = { ...db, batch: async (statements) => {
        await db.prepare('UPDATE task_templates SET version=version+1 WHERE id=?').run(template.id);
        return db.batch(statements);
      } };
      await assert.rejects(applyTaskTemplate(raced, owner, template.id, request), rejected(409));
      assert.equal(await db.prepare('SELECT id FROM task_template_runs WHERE id=?').get(request.run_id), undefined);
    });
    await t.test('revoked assignment between preview and write creates no marker or task', async () => {
      const person = await addUser('race-person', 'staff');
      const payload = body(); payload.entries[0].assignee_id = person.id;
      const template = (await createTaskTemplate(db, owner, payload)).template, request = input(template);
      const raced = { ...db, batch: async (statements) => {
        await db.prepare('DELETE FROM workspace_members WHERE user_id=?').run(person.id);
        return db.batch(statements);
      } };
      await assert.rejects(applyTaskTemplate(raced, owner, template.id, request), rejected(409));
      assert.equal(await db.prepare('SELECT id FROM task_template_runs WHERE id=?').get(request.run_id), undefined);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE id LIKE ?').get(request.run_id + ':%')).n, 0);
    });
    await t.test('archiving a template preserves generated work and blocks future use', async () => {
      const template = await create(), request = input(template);
      await applyTaskTemplate(db, owner, template.id, request);
      await updateTaskTemplate(db, owner, template.id, { version: template.version, archived: true });
      assert(!(await listTaskTemplates(db, owner)).templates.some((row) => row.id === template.id));
      await assert.rejects(previewTaskTemplate(db, owner, template.id, request), rejected(404));
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE id LIKE ?').get(request.run_id + ':%')).n, 2);
    });
    await t.test('removed member cannot receive new tasks, while existing task name is preserved', async () => {
      const template = await create(), request = input(template);
      await applyTaskTemplate(db, owner, template.id, request);
      await db.prepare('DELETE FROM users WHERE id=?').run(staff.id);
      const original = await db.prepare('SELECT assignee,assignee_id FROM tasks WHERE id=?').get(request.run_id + ':0');
      assert.deepEqual({ ...original }, { assignee: staff.name, assignee_id: null });
      await assert.rejects(previewTaskTemplate(db, owner, template.id, input(template)), rejected(409));
    });
  } finally {
    db.close();
    if (previous === undefined) delete process.env.TURSO_DATABASE_URL; else process.env.TURSO_DATABASE_URL = previous;
    const tempRoot = resolve(tmpdir()); assert(resolve(dir).startsWith(tempRoot + sep));
    if (process.env.TEST_DATABASE_DRIVER !== 'libsql') rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});
