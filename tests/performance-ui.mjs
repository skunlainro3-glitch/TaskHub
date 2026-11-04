// Delayed authentication must not block public tours or undo a later sign-in.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { qaTour } from './fixtures.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:3015';
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'win32' ? { channel: 'msedge' } : {}),
});
const context = await browser.newContext();
const page = await context.newPage();
const email = `qa-performance-${Date.now()}@example.test`, password = 'QA-performance-only-2026!';
let registered = false, releaseSession, releaseRetry, releasePrivate;
const guest = await browser.newContext();
mkdirSync('work', { recursive: true });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => {
  if (m.type() === 'error' && /Minified React error|hydration failed/i.test(m.text())) errors.push(m.text());
});
const request = (path, method = 'GET', data) => context.request.fetch(base + '/api' + path, {
  method, headers: { 'X-TaskHub': '1' }, ...(data ? { data } : {}),
});
try {
  const created = await request('/register', 'POST', {
    name: 'QA performance - không phải tester', email, password,
    role: 'other', company_size: 'other', consent: true,
  });
  assert.equal(created.status(), 201);
  registered = true;
  const { user } = await created.json();
  await request('/logout', 'POST', {});
  const held = new Promise(resolve => { releaseSession = resolve; });
  await page.route('**/api/session', async route => {
    await held;
    await route.fulfill({ status: 503, json: { message: 'Phiên phản hồi chậm (kiểm thử).' } });
  });
  await page.route('**/api/public/agency', route => route.fulfill({ json: {
    agency: 'QA performance', tours: [{...qaTour, id: 'qa-public-tour'}],
  } }));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Cổng thông tin tour', exact: true }).waitFor();
  await page.locator('.tour-card:not(.catalog-card)').first().waitFor();
  assert.equal(await page.locator('.sidebar').count(), 0);
  assert.equal(await page.locator('.portal-hero,.portal-cta,.capability-board').count(), 0);
  assert.equal(await page.getByText('Ít thao tác hơn. Nhiều hành trình hơn.', { exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Dùng thử TaskHub', exact: true }).count(), 0);
  assert.equal((await page.locator('.portal-nav .logo').innerText()).replace(/\s/g, ''), 'TaskHub.');
  assert.equal((await request('/workspace')).status(), 401);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `work/customer-view-${width}.png`, fullPage: true });
  }
  assert.equal(await page.locator('.reference-catalog,.catalog-card,[data-track="portal:toggle-reference"]').count(), 0);
  releaseSession();
  await page.getByRole('button', { name: 'Kiểm tra lại kết nối', exact: true }).waitFor();
  await page.unroute('**/api/session');
  const retryHeld = new Promise(resolve => { releaseRetry = resolve; });
  await page.route('**/api/session', async route => {
    await retryHeld;
    await route.fulfill({ json: { user: null } });
  });
  await page.getByRole('button', { name: 'Kiểm tra lại kết nối', exact: true }).click();
  await page.getByRole('button', { name: 'Dành cho điều hành', exact: true }).click();
  assert.equal(new URL(page.url()).pathname, '/app');
  await page.getByRole('heading', { name: 'Điều hành tour cùng TaskHub', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Quản lý lịch, số chỗ và công việc tại một nơi.', exact: true }).waitFor();
  assert.equal(await page.locator('.tour-card').count(), 0);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Operator entry overflow');
    await page.screenshot({ path: `work/operator-entry-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.locator('.modal input[name="email"]').fill(email);
  await page.locator('.modal input[name="password"]').fill(password);
  await page.locator('.modal').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('heading', { name: 'Tổng quan', exact: true }).waitFor();
  const sessionReturned = page.waitForResponse(r => new URL(r.url()).pathname === '/api/session');
  releaseRetry();
  await sessionReturned;
  await page.waitForTimeout(100);
  await page.getByRole('heading', { name: 'Tổng quan', exact: true }).waitFor();
  await page.unroute('**/api/session');

  // A customer has a real inquiry flow but no internal workspace access.
  assert.equal((await request('/tours', 'POST', qaTour)).status(), 201);
  const customer = await guest.newPage();
  await customer.goto(base + '/portal/' + user.workspace);
  await customer.getByRole('button', { name: qaTour.title, exact: true }).click();
  await customer.getByRole('button', { name: 'Yêu cầu tư vấn', exact: true }).click();
  await customer.getByLabel('Tên', { exact: true }).fill('Khách QA giả lập');
  await customer.getByLabel('Email', { exact: true }).fill('qa-customer@example.test');
  await customer.locator('input[name="consent"]').check();
  await customer.getByRole('button', { name: 'Gửi yêu cầu tư vấn', exact: true }).click();
  await customer.getByText('Đã gửi yêu cầu. Đây chưa phải xác nhận đặt tour.', { exact: true }).waitFor();
  assert.equal((await guest.request.get(base + '/api/workspace')).status(), 401);
  const internal = await (await request('/workspace')).json();
  assert.equal(internal.inquiries.length, 1);

  // The internal workspace still waits for a checked session.
  const privateHeld = new Promise(resolve => { releasePrivate = resolve; });
  await page.route('**/api/session', async route => {
    await privateHeld;
    await route.fulfill({ json: { user } });
  });
  await page.goto(base + '/app', { waitUntil: 'domcontentloaded' });
  await page.getByText('Đang mở TaskHub…', { exact: true }).waitFor();
  assert.equal(await page.locator('.sidebar').count(), 0);
  releasePrivate();
  await page.getByRole('heading', { name: 'Tổng quan', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: separate customer/operator views; guest inquiry and internal API401; mobile layout; public session delay and stale sign-in response; gated private workspace.');
} finally {
  releaseSession?.();
  releaseRetry?.();
  releasePrivate?.();
  if (registered) {
    let deleted = await request('/account', 'DELETE');
    if (!deleted.ok()) {
      await request('/login', 'POST', { email, password });
      deleted = await request('/account', 'DELETE');
    }
    assert.ok(deleted.ok(), 'Disposable QA account must be removed');
  }
  await browser.close();
}
