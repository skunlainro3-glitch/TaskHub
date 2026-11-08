import { randomUUID } from 'node:crypto';
import { requireCapability } from '../shared/access.mjs';
import { taskTemplateInput, taskDueDate } from '../shared/task-templates.mjs';

const fail = (message, status = 400) => { throw Object.assign(Error(message), { status }); };
const now = () => new Date().toISOString();
const version = (v) => { if (!Number.isSafeInteger(v) || v < 1 || v > 1e9) fail('Phiên bản không hợp lệ.'); return v; };
const decode = (row) => ({ ...row, entries: JSON.parse(row.entries) });
const object = (input) => { if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Dữ liệu công việc không hợp lệ.'); };
const uuid = (value) => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const identifier = (value, label) => { if (typeof value !== 'string' || !value.trim() || value.length > 100) fail(label + ' không hợp lệ.'); return value; };

// Only actual members of this workspace are offered; no emails are exposed.
export async function listTaskPeople(db, user) {
  const people = await db.prepare(`SELECT u.id,u.name,COALESCE(m.department,'owner') AS department
    FROM users u LEFT JOIN workspace_members m ON m.user_id=u.id AND m.workspace=u.workspace
    WHERE u.workspace=? AND u.role!='reviewer' AND (u.role!='staff' OR m.user_id IS NOT NULL)
    ORDER BY u.name,u.id`).all(user.workspace);
  return { people };
}

export async function resolveTaskAssignee(db, user, input) {
  object(input);
  if (input.assignee_id) {
    if (typeof input.assignee_id !== 'string' || input.assignee_id.length > 100) fail('Người phụ trách không hợp lệ.');
    const { people } = await listTaskPeople(db, user);
    const person = people.find((p) => p.id === input.assignee_id);
    if (!person) fail('Người phụ trách không còn trong không gian này. Chọn lại người phụ trách.', 409);
    return { assignee_id: person.id, assignee: person.name };
  }
  if (typeof input.assignee !== 'string' || !input.assignee.trim() || input.assignee.trim().length > 80)
    fail('Nhập tên người phụ trách tối đa 80 ký tự hoặc chọn một tài khoản.');
  return { assignee_id: null, assignee: input.assignee.trim() };
}

export async function listTaskTemplates(db, user) {
  const templates = await db.prepare('SELECT * FROM task_templates WHERE workspace=? AND archived=0 ORDER BY updated DESC,id').all(user.workspace);
  return { templates: templates.map(decode) };
}

async function validatePeople(db, user, entries) {
  const { people } = await listTaskPeople(db, user);
  for (const entry of entries)
    if (entry.assignee_id && !people.some((p) => p.id === entry.assignee_id))
      fail('Có người phụ trách không còn trong không gian này. Chọn lại hoặc để chưa phân công.', 409);
  return people;
}

export async function createTaskTemplate(db, user, input) {
  requireCapability(user, 'canEditTasks');
  const payload = taskTemplateInput(input);
  if (input.request_id !== undefined && !uuid(input.request_id)) fail('Mã tạo bộ mẫu không hợp lệ.');
  const id = input.request_id || randomUUID(), at = now();
  const existing = await db.prepare('SELECT * FROM task_templates WHERE id=?').get(id);
  if (existing) {
    if (existing.workspace !== user.workspace || existing.archived || existing.name !== payload.name || existing.entries !== JSON.stringify(payload.entries))
      fail('Mã tạo này đã được dùng. Nạp lại bộ mẫu để đối chiếu trước khi tạo tiếp.', 409);
    return { template: decode(existing), replayed: true };
  }
  await validatePeople(db, user, payload.entries);
  await db.prepare('INSERT OR IGNORE INTO task_templates(id,workspace,name,entries,archived,version,created,updated) VALUES (?,?,?,?,0,1,?,?)')
    .run(id, user.workspace, payload.name, JSON.stringify(payload.entries), at, at);
  const saved = await db.prepare('SELECT * FROM task_templates WHERE id=? AND workspace=?').get(id, user.workspace);
  if (!saved || saved.archived || saved.name !== payload.name || saved.entries !== JSON.stringify(payload.entries))
    fail('Mã tạo này đã được dùng. Nạp lại bộ mẫu để đối chiếu trước khi tạo tiếp.', 409);
  return { template: decode(saved) };
}

export async function updateTaskTemplate(db, user, id, input) {
  requireCapability(user, 'canEditTasks');
  object(input);
  const current = await db.prepare('SELECT * FROM task_templates WHERE id=? AND workspace=? AND archived=0').get(id, user.workspace);
  if (!current) fail('Không tìm thấy bộ mẫu đang dùng.', 404);
  version(input.version);
  if (input.version !== current.version) fail('Bộ mẫu đã thay đổi. Nạp bản mới trước khi lưu.', 409);
  const archive = input.archived === true;
  const payload = archive ? decode(current) : taskTemplateInput(input);
  if (!archive) await validatePeople(db, user, payload.entries);
  const result = await db.prepare('UPDATE task_templates SET name=?,entries=?,archived=?,version=version+1,updated=? WHERE id=? AND workspace=? AND version=? AND archived=0')
    .run(payload.name, JSON.stringify(payload.entries), archive ? 1 : 0, now(), id, user.workspace, input.version);
  if (!result.changes) fail('Bộ mẫu đã thay đổi. Nạp bản mới trước khi lưu.', 409);
  return { template: decode(await db.prepare('SELECT * FROM task_templates WHERE id=? AND workspace=?').get(id, user.workspace)) };
}

export async function previewTaskTemplate(db, user, id, input) {
  requireCapability(user, 'canEditTasks');
  object(input);
  version(input.version); version(input.tour_version);
  identifier(input.tour_id, 'Tour');
  if (input.default_assignee_id !== undefined && input.default_assignee_id !== null && input.default_assignee_id !== '')
    identifier(input.default_assignee_id, 'Người phụ trách');
  const template = await db.prepare('SELECT * FROM task_templates WHERE id=? AND workspace=? AND archived=0').get(id, user.workspace);
  if (!template) fail('Không tìm thấy bộ mẫu đang dùng.', 404);
  if (template.version !== input.version) fail('Bộ mẫu đã thay đổi. Nạp bản mới trước khi áp dụng.', 409);
  const tour = await db.prepare('SELECT id,title,departure,version FROM tours WHERE id=? AND workspace=?').get(input.tour_id, user.workspace);
  if (!tour) fail('Tour không tồn tại trong không gian này.', 404);
  if (tour.version !== input.tour_version) fail('Tour đã thay đổi. Nạp lại tour trước khi áp dụng.', 409);
  const entries = JSON.parse(template.entries);
  const resolved = entries.map((e) => ({ ...e, assignee_id: e.assignee_id || input.default_assignee_id || null }));
  const people = await validatePeople(db, user, resolved);
  const rows = resolved.map((e) => ({
    title: e.title, due: taskDueDate(tour.departure, e.offset_days), priority: e.priority,
    assignee_id: e.assignee_id, assignee: people.find((p) => p.id === e.assignee_id)?.name || 'Chưa phân công',
  }));
  return { template_id: id, template_version: template.version, tour_id: tour.id, tour_version: tour.version, tour_title: tour.title, departure: tour.departure, rows };
}

export async function applyTaskTemplate(db, user, id, input) {
  requireCapability(user, 'canEditTasks');
  object(input);
  if (!uuid(input.run_id)) fail('Mã lần tạo không hợp lệ.');
  if (await db.prepare('SELECT id FROM task_template_runs WHERE id=?').get(input.run_id))
    fail('Lần này đã tạo công việc. Tải lại danh sách trước khi tiếp tục.', 409);
  const preview = await previewTaskTemplate(db, user, id, input);
  const token = randomUUID(), at = now();
  const people = [...new Set(preview.rows.map((r) => r.assignee_id).filter(Boolean))];
  const memberGuards = people.map(() => `EXISTS(SELECT 1 FROM users u LEFT JOIN workspace_members m ON m.user_id=u.id AND m.workspace=u.workspace WHERE u.id=? AND u.workspace=? AND u.role!='reviewer' AND (u.role!='staff' OR m.user_id IS NOT NULL))`);
  // The marker and every generated task are one atomic batch. Its private nonce
  // prevents a retry or a second client from appending rows to an earlier run.
  const guard = `EXISTS(SELECT 1 FROM task_templates WHERE id=? AND workspace=? AND version=? AND archived=0) AND EXISTS(SELECT 1 FROM tours WHERE id=? AND workspace=? AND version=?)${memberGuards.length ? ' AND ' + memberGuards.join(' AND ') : ''}`;
  const statements = [[`INSERT OR IGNORE INTO task_template_runs(id,workspace,template_id,tour_id,template_version,tour_version,token,created_by,created) SELECT ?,?,?,?,?,?,?,?,? WHERE ${guard}`,
    [input.run_id, user.workspace, id, preview.tour_id, preview.template_version, preview.tour_version, token, user.id, at,
      id, user.workspace, preview.template_version, preview.tour_id, user.workspace, preview.tour_version,
      ...people.flatMap((person) => [person, user.workspace])]]];
  for (const [index, row] of preview.rows.entries())
    statements.push([`INSERT INTO tasks(id,workspace,tour_id,title,assignee,assignee_id,due,priority,status,created,version) SELECT ?,?,?,?,?,?,?,?,'todo',?,1 WHERE EXISTS(SELECT 1 FROM task_template_runs WHERE id=? AND token=?)`,
      [input.run_id + ':' + index, user.workspace, preview.tour_id, row.title, row.assignee, row.assignee_id, row.due, row.priority, at, input.run_id, token]]);
  if (!['admin', 'reviewer', 'staff'].includes(user.role))
    statements.push([`INSERT INTO events SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM task_template_runs WHERE id=? AND token=?)`,
      [randomUUID(), user.id, 'task_template_applied', input.run_id, at, input.run_id, token]]);
  const result = await db.batch(statements);
  if (!result[0].changes) fail('Tour, bộ mẫu hoặc người phụ trách đã thay đổi, hoặc lần này đã tạo việc. Tải lại trước khi thử tiếp.', 409);
  return { count: preview.rows.length, run_id: input.run_id };
}
