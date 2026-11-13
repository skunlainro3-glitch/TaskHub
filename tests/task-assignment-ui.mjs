// Isolated QA workspaces and accounts. These interactions are not tester evidence.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { qaTour } from './fixtures.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:3063';
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'win32' ? { channel: 'msedge' } : {}),
});
const contexts = [];
const errors = [];
const stamp = Date.now();
const password = 'Temporary-assignment-QA-2026!';
const screenshotDir = 'work/task-assignment-qa';
mkdirSync(screenshotDir, { recursive: true });

async function context() {
  const result = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  contexts.push(result);
  return result;
}

async function request(session, path, method = 'GET', data) {
  return session.request.fetch(base + '/api' + path, {
    method,
    headers: { 'X-TaskHub': '1' },
    ...(data ? { data } : {}),
  });
}

async function api(session, path, method = 'GET', data) {
  const response = await request(session, path, method, data);
  const body = await response.json();
  assert(response.ok(), `${path}: ${response.status()} ${JSON.stringify(body)}`);
  return body;
}

async function nav(page, id) {
  const button = page.locator(`[data-track="nav:${id}"]`);
  if (!await button.isVisible()) await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
  await button.click();
}

function observe(page) {
  page.on('pageerror', (error) => errors.push(error.message));
  return page;
}

const owner = await context();
const page = observe(await owner.newPage());
let created = false;

async function invite(department, permission, suffix, name) {
  const email = `qa-assignment-${suffix}-${stamp}@example.test`;
  const invitation = await api(owner, '/team/invites', 'POST', { email, department, permission });
  return {
    email, name, department, permission,
    token: new URL(invitation.url, base).searchParams.get('invite'),
  };
}

async function accept(invitation) {
  const session = await context();
  const { user } = await api(session, '/team/invites/accept', 'POST', {
    token: invitation.token, email: invitation.email, name: invitation.name,
    password, consent: true,
  });
  return { ...invitation, session, user };
}

async function openEditor() {
  await page.getByRole('button', { name: 'Giao công việc', exact: true }).first().click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('heading', { name: 'Giao một công việc', exact: true }).waitFor();
  return modal;
}

async function fillTask(modal, tourId, title, assigneeId) {
  await modal.getByLabel('Công việc', { exact: true }).fill(title);
  await modal.getByLabel('Tour liên quan', { exact: true }).selectOption(tourId);
  await modal.getByLabel('Hạn hoàn thành', { exact: true }).fill('2026-12-19');
  await modal.getByLabel('Tài khoản phụ trách', { exact: true }).selectOption(assigneeId);
}

async function saveTask(modal) {
  const saved = page.waitForResponse((response) =>
    new URL(response.url()).pathname === '/api/tasks' && response.request().method() === 'POST');
  await modal.getByRole('button', { name: 'Giao công việc', exact: true }).click();
  assert.equal((await saved).status(), 201);
  await modal.waitFor({ state: 'hidden' });
}

async function assertMyTasks(member, expectedTitle, hiddenTitle) {
  const memberPage = observe(await member.session.newPage());
  await memberPage.goto(base + '/app');
  await memberPage.getByRole('heading', { name: 'Tổng quan', exact: true }).waitFor();
  await nav(memberPage, 'tasks');
  await memberPage.getByLabel('Việc của tôi', { exact: true }).check();
  await memberPage.locator('.task-card').getByRole('button', { name: `Sửa ${expectedTitle}`, exact: true }).waitFor();
  assert.equal(await memberPage.locator('.task-card').getByRole('button', { name: `Sửa ${hiddenTitle}`, exact: true }).count(), 0);
  const status = memberPage.getByLabel(`Trạng thái ${expectedTitle}`, { exact: true });
  assert.equal(await status.isEnabled(), true);
  const changed = memberPage.waitForResponse((response) =>
    /\/api\/tasks\//.test(new URL(response.url()).pathname) && response.request().method() === 'PATCH');
  await status.selectOption('doing');
  assert.equal((await changed).status(), 200);
}

try {
  await api(owner, '/register', 'POST', {
    name: 'QA chủ không gian giao việc', email: `qa-assignment-owner-${stamp}@example.test`,
    password, role: 'operations', company_size: '10to30', consent: true,
  });
  created = true;
  const { id: tourId } = await api(owner, '/tours', 'POST', {
    ...qaTour, title: '[QA] Tour giao việc', reserved: 0,
  });
  const operator = await accept(await invite('operations', 'editor', 'operator', 'QA Trùng Tên'));
  const salesperson = await accept(await invite('sales', 'editor', 'sales', 'QA Trùng Tên'));
  const accountant = await accept(await invite('accounting', 'editor', 'accounting', 'QA Kế toán'));
  const viewer = await accept(await invite('operations', 'viewer', 'viewer', 'QA Chỉ xem'));
  const pending = await invite('operations', 'editor', 'late', 'QA Nhận lời mời muộn');

  const people = (await api(owner, '/task-people')).people;
  assert.equal(people.filter((person) => person.name === 'QA Trùng Tên').length, 2);
  assert(!people.some((person) => person.name === pending.name), 'Pending invitations must not become task recipients');

  await page.goto(base + '/app');
  await page.getByRole('heading', { name: 'Tổng quan', exact: true }).waitFor();
  await nav(page, 'tasks');

  let releasePeople;
  const peopleGate = new Promise((resolve) => { releasePeople = resolve; });
  const pausePeople = async (route) => { await peopleGate; await route.continue(); };
  await page.route('**/api/task-people', pausePeople);
  let modal = await openEditor();
  await modal.getByText('Đang tải người phụ trách…', { exact: true }).waitFor();
  assert.equal(await modal.getByLabel('Tài khoản phụ trách', { exact: true }).isDisabled(), true);
  assert.equal(await modal.getByRole('button', { name: 'Giao công việc', exact: true }).isDisabled(), true);
  await modal.getByLabel('Công việc', { exact: true }).fill('[QA] Việc điều hành');
  releasePeople();
  await modal.getByRole('option', { name: 'QA Trùng Tên · Điều hành', exact: true }).waitFor({ state: 'attached' });
  await page.unroute('**/api/task-people', pausePeople);
  const picker = modal.getByLabel('Tài khoản phụ trách', { exact: true });
  assert.equal(await picker.getByRole('option', { name: 'QA Trùng Tên · Kinh doanh', exact: true }).count(), 1);
  assert.equal(await picker.getByRole('option', { name: /QA Nhận lời mời muộn/ }).count(), 0);

  await picker.selectOption(accountant.user.id);
  await modal.getByText('Người này chỉ theo dõi công việc.', { exact: false }).waitFor();
  assert.equal(await picker.getByRole('option', { name: 'QA Kế toán · Kế toán · chỉ theo dõi', exact: true }).count(), 1);
  await picker.selectOption(viewer.user.id);
  assert.equal(await picker.getByRole('option', { name: 'QA Chỉ xem · Điều hành · chỉ theo dõi', exact: true }).count(), 1);
  await fillTask(modal, tourId, '[QA] Việc điều hành', operator.user.id);

  const late = await accept(pending);
  const refreshed = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/task-people');
  await modal.getByRole('button', { name: 'Tải lại người phụ trách', exact: true }).click();
  assert.equal((await refreshed).status(), 200);
  await picker.getByRole('option', { name: 'QA Nhận lời mời muộn · Điều hành', exact: true }).waitFor({ state: 'attached' });
  assert.equal(await picker.inputValue(), operator.user.id);
  assert.equal(await modal.getByLabel('Công việc', { exact: true }).inputValue(), '[QA] Việc điều hành');
  assert.equal(await modal.getByLabel('Tour liên quan', { exact: true }).inputValue(), tourId);
  assert.equal(await modal.getByLabel('Hạn hoàn thành', { exact: true }).inputValue(), '2026-12-19');
  assert.equal((await api(owner, '/task-people')).people.some((person) => person.id === late.user.id), true);

  const failPeople = (route) => route.abort();
  await page.route('**/api/task-people', failPeople);
  await modal.getByRole('button', { name: 'Tải lại người phụ trách', exact: true }).click();
  await modal.getByRole('alert').filter({ hasText: 'Chưa tải được danh sách người phụ trách' }).waitFor();
  assert.equal(await picker.inputValue(), operator.user.id);
  assert.equal(await modal.getByLabel('Công việc', { exact: true }).inputValue(), '[QA] Việc điều hành');
  await page.unroute('**/api/task-people', failPeople);
  const retried = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/task-people');
  await modal.getByRole('button', { name: 'Tải lại người phụ trách', exact: true }).click();
  assert.equal((await retried).status(), 200);
  await modal.getByRole('alert').filter({ hasText: 'Chưa tải được danh sách người phụ trách' }).waitFor({ state: 'hidden' });
  assert.equal(await picker.inputValue(), operator.user.id);

  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Page overflow at ${width}px`);
    assert(await modal.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), `Task editor overflow at ${width}px`);
    await page.screenshot({ path: `${screenshotDir}/assignment-${width}.png`, fullPage: true, animations: 'disabled' });
  }
  await saveTask(modal);
  modal = await openEditor();
  await fillTask(modal, tourId, '[QA] Việc kinh doanh', salesperson.user.id);
  await saveTask(modal);

  const tasks = (await api(owner, '/workspace')).tasks;
  const operationalTask = tasks.find((task) => task.title === '[QA] Việc điều hành');
  const salesTask = tasks.find((task) => task.title === '[QA] Việc kinh doanh');
  assert.equal(operationalTask.assignee_id, operator.user.id);
  assert.equal(salesTask.assignee_id, salesperson.user.id);
  assert.notEqual(operationalTask.assignee_id, salesTask.assignee_id);
  await assertMyTasks(operator, operationalTask.title, salesTask.title);
  await assertMyTasks(salesperson, salesTask.title, operationalTask.title);

  for (const member of [accountant, viewer]) {
    const response = await request(member.session, '/tasks/' + operationalTask.id, 'PATCH', {
      status: 'done', version: operationalTask.version,
    });
    assert.equal(response.status(), 403, member.department + '/' + member.permission + ' task write must stay denied');
  }
  assert.deepEqual(errors, []);
  console.log('Task assignment UI PASS: multiple staff and exact-ID My tasks, distinct role labels, read-only recipient warning, denied role writes, pending and accepted invitations, loading/retry without draft loss, and 320/1440px layouts.');
} finally {
  if (created) {
    const response = await request(owner, '/account', 'DELETE');
    assert.equal(response.status(), 200, 'Disposable QA workspace cleanup');
  }
  for (const session of contexts) await session.close();
  await browser.close();
}
