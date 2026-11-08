// Disposable QA workspace only; these interactions are not real tester evidence.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { qaTour } from './fixtures.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:3058';
const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
let created = false;
const request = (path, method = 'GET', data) => context.request.fetch(base + '/api' + path, { method, headers: { 'X-TaskHub': '1' }, ...(data ? { data } : {}) });
async function api(path, method, data) {
  const response = await request(path, method, data);
  assert(response.ok(), path + ': ' + response.status() + ' ' + await response.text());
  return response.json();
}
async function nav(id) {
  const button = page.locator('[data-track="nav:' + id + '"]');
  if (!await button.isVisible()) await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
  await button.click();
}
async function noOverflow(label) {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' page overflow ' + width);
    const modal = page.getByRole('dialog');
    if (await modal.isVisible()) {
      const bounds = await modal.boundingBox();
      assert(bounds.x >= -1 && bounds.x + bounds.width <= width + 1, label + ' modal bounds ' + width);
      const fits = await modal.evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
      if (!fits) {
        mkdirSync('work/task-template-qa', { recursive: true });
        await page.screenshot({ path: 'work/task-template-qa/overflow-' + width + '.png', fullPage: true });
        console.log(await modal.evaluate((element) => { const root = element.getBoundingClientRect(); return { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, overflowing: [...element.querySelectorAll('*')].map((node) => ({ tag: node.tagName, cls: node.className, left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right, width: node.getBoundingClientRect().width })).filter((node) => node.right > root.right || node.left < root.left).slice(0, 12) }; }));
      }
      assert(fits, label + ' modal content overflow ' + width);
    }
  }
}
try {
  const { user } = await api('/register', 'POST', {
    name: 'QA mẫu công việc — không phải tester', email: 'qa-task-template-' + Date.now() + '@example.test',
    password: 'Temporary-task-template-QA-2026!', role: 'operations', company_size: '10to30', consent: true,
  });
  created = true;
  const { id: tourId } = await api('/tours', 'POST', { ...qaTour, reserved: 0, title: 'Tour QA bộ mẫu' });
  await api('/tasks', 'POST', { tour_id: tourId, title: 'Tên nhập tay chưa gắn tài khoản', assignee: user.name, due: '2026-12-20', priority: 'normal' });
  await page.goto(base + '/app');
  await page.getByRole('heading', { name: 'Tổng quan', exact: true }).waitFor();
  await nav('tasks');
  await page.getByRole('button', { name: 'Mẫu công việc', exact: true }).click();
  let modal = page.getByRole('dialog');
  await modal.getByText('Chưa có bộ mẫu', { exact: true }).waitFor();
  await noOverflow('Empty template list');
  await modal.getByRole('button', { name: 'Tạo bộ mẫu', exact: true }).click();
  await modal.getByLabel('Tên bộ mẫu', { exact: true }).fill('Quy trình QA');
  await modal.getByLabel('Nội dung công việc 1', { exact: true }).fill('Chuẩn bị trước ngày đi QA');
  await modal.getByLabel('Mốc ngày công việc 1', { exact: true }).fill('-2');
  await modal.getByLabel('Ưu tiên công việc 1', { exact: true }).selectOption('high');
  await modal.getByLabel('Tài khoản phụ trách công việc 1', { exact: true }).selectOption(user.id);
  await modal.getByRole('button', { name: 'Thêm công việc', exact: true }).click();
  await modal.getByLabel('Nội dung công việc 2', { exact: true }).fill('Kết thúc sau ngày đi QA');
  await modal.getByLabel('Mốc ngày công việc 2', { exact: true }).fill('1');
  let dirtyPrompt = false;
  page.once('dialog', async (dialog) => { dirtyPrompt = true; await dialog.dismiss(); });
  await page.keyboard.press('Escape');
  assert(dirtyPrompt, 'Escape must prompt before discarding a dirty template');
  assert(await modal.isVisible());
  await noOverflow('Template editor');
  const saved = page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/task-templates');
  await modal.getByRole('button', { name: 'Lưu bộ mẫu', exact: true }).click();
  const savedResponse = await saved; assert.equal(savedResponse.status(), 201);
  const template = (await savedResponse.json()).template;
  await modal.getByRole('heading', { name: 'Quy trình QA', exact: true }).waitFor();
  await modal.getByRole('button', { name: 'Dùng cho tour', exact: true }).click();
  await modal.getByLabel('Tour áp dụng', { exact: true }).selectOption(tourId);
  await modal.getByLabel('Phụ trách các việc chưa có người', { exact: true }).selectOption(user.id);
  const previewUrl = '**/api/task-templates/' + template.id + '/preview';
  await page.route(previewUrl, (route) => route.abort());
  await modal.getByRole('button', { name: 'Xem trước công việc', exact: true }).click();
  await modal.getByText('Mất kết nối. Kiểm tra mạng và thử lại.', { exact: true }).waitFor();
  assert.equal(await modal.getByLabel('Tour áp dụng', { exact: true }).inputValue(), tourId);
  assert.equal(await modal.getByLabel('Phụ trách các việc chưa có người', { exact: true }).inputValue(), user.id);
  await page.unroute(previewUrl);
  await modal.getByRole('button', { name: 'Xem trước công việc', exact: true }).click();
  await modal.getByRole('heading', { name: '2 công việc sẽ được thêm', exact: true }).waitFor();
  assert((await modal.locator('.task-template-preview').innerText()).includes('18/12/2026'));
  assert((await modal.locator('.task-template-preview').innerText()).includes('21/12/2026'));
  await noOverflow('Template preview');
  mkdirSync('work/task-template-qa', { recursive: true });
  await page.setViewportSize({ width: 390, height: 950 });
  await page.screenshot({ path: 'work/task-template-qa/preview-390.png', fullPage: true });
  const applied = page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/' + template.id + '/apply'));
  await modal.getByRole('button', { name: 'Tạo 2 công việc', exact: true }).click();
  const appliedResponse = await applied; assert.equal(appliedResponse.status(), 200);
  const appliedBody = appliedResponse.request().postDataJSON();
  await modal.waitFor({ state: 'hidden' });
  let data = await api('/workspace');
  assert.equal(data.tasks.length, 3);
  assert.equal(data.tasks.filter((task) => task.assignee_id === user.id).length, 2);
  assert.deepEqual(data.tasks.filter((task) => task.assignee_id === user.id).map((task) => task.due).sort(), ['2026-12-18', '2026-12-21']);
  assert.equal((await request('/task-templates/' + template.id + '/apply', 'POST', appliedBody)).status(), 409);
  assert.equal((await api('/workspace')).tasks.length, 3);

  await page.getByLabel('Việc của tôi', { exact: true }).check();
  assert.equal(await page.locator('.task-title').count(), 2);
  assert.equal(await page.getByRole('button', { name: 'Tên nhập tay chưa gắn tài khoản', exact: true }).count(), 0);
  await noOverflow('My tasks');
  await page.getByRole('button', { name: 'Sửa Chuẩn bị trước ngày đi QA', exact: true }).click();
  modal = page.getByRole('dialog');
  assert.equal(await modal.getByLabel('Tài khoản phụ trách', { exact: true }).inputValue(), user.id);
  await modal.getByLabel('Tài khoản phụ trách', { exact: true }).selectOption('');
  await modal.getByLabel('Tên người phụ trách', { exact: true }).fill(user.name);
  const changedTask = page.waitForResponse((response) => response.request().method() === 'PUT' && /\/api\/tasks\//.test(response.url()));
  await modal.getByRole('button', { name: 'Lưu công việc', exact: true }).click();
  assert.equal((await changedTask).status(), 200);
  await modal.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.task-title').count(), 1, 'Manual name must not match Việc của tôi by name');
  await page.getByRole('button', { name: 'Xóa bộ lọc công việc', exact: true }).click();

  await page.getByRole('button', { name: 'Mẫu công việc', exact: true }).click();
  modal = page.getByRole('dialog');
  await modal.getByRole('button', { name: 'Sửa mẫu', exact: true }).click();
  await modal.getByLabel('Tên bộ mẫu', { exact: true }).fill('Nháp sửa cũ QA');
  const current = (await api('/task-templates')).templates.find((row) => row.id === template.id);
  await api('/task-templates/' + template.id, 'PUT', { ...current, name: 'Bản mới từ màn hình khác QA', version: current.version });
  const conflict = page.waitForResponse((response) => response.request().method() === 'PUT' && new URL(response.url()).pathname === '/api/task-templates/' + template.id);
  await modal.getByRole('button', { name: 'Lưu bộ mẫu', exact: true }).click();
  assert.equal((await conflict).status(), 409);
  await modal.getByText('Bộ mẫu đã thay đổi. Nạp bản mới trước khi lưu.', { exact: true }).waitFor();
  page.once('dialog', (dialog) => dialog.accept());
  await modal.getByRole('button', { name: 'Nạp lại dữ liệu', exact: true }).click();
  await modal.getByRole('heading', { name: 'Bản mới từ màn hình khác QA', exact: true }).waitFor();
  page.once('dialog', (dialog) => dialog.accept());
  await modal.getByRole('button', { name: 'Ngừng dùng', exact: true }).click();
  await modal.getByText('Chưa có bộ mẫu', { exact: true }).waitFor();
  assert.equal((await api('/workspace')).tasks.length, 3, 'Archiving must preserve tasks');
  assert.deepEqual(errors, []);
  console.log('Task templates UI PASS: create/edit, dirty Escape, preview dates, linked assignment, atomic replay protection, exact-ID My tasks, manual unlink, stale recovery, archive and 320/390/768/1440px.');
} finally {
  if (created) assert.equal((await request('/account', 'DELETE')).status(), 200);
  await browser.close();
}
