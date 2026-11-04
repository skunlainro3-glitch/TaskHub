// Disposable workspace: exercise stale inquiry recovery and Vietnamese search.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { qaTour } from "./fixtures.mjs";

const base = process.env.TEST_URL || "http://127.0.0.1:3027";
const browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? {channel: "msedge"} : {}) });
const context = await browser.newContext({ viewport: {width: 1440, height: 1000} });
const guest = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let made = false;
const request = (path, method = "GET", data) => context.request.fetch(base + "/api" + path, {
  method, headers: {"X-TaskHub": "1"}, ...(data ? {data} : {}),
});
async function api(path, method, data) {
  const response = await request(path, method, data);
  assert.ok(response.ok(), `${path}: ${response.status()}`);
  return response.json();
}
async function nav(id) {
  const button = page.locator(`[data-track="nav:${id}"]`);
  if (!(await button.isVisible())) await page.getByRole("button", {name: "Mở menu", exact: true}).click();
  await button.click();
}
try {
  const {user} = await api("/register", "POST", {
    name: "QA ổn định — không phải tester", email: `qa-stability-${Date.now()}@example.test`,
    password: "Temporary-stability-QA-only-2026!", role: "operations", company_size: "10to30", consent: true,
  });
  made = true;
  const {id: tourId} = await api("/tours", "POST", {...qaTour, title: "Hành trình Đà Nẵng", reserved: 0});
  await api("/tasks", "POST", {tour_id: tourId, title: "Điều phối hành trình", assignee: "Nguyễn Minh Tuấn", due: "2026-12-19", priority: "normal"});
  const inquiry = await guest.request.post(base + `/api/public/${user.workspace}/inquiries`, {
    headers: {"X-TaskHub": "1"}, data: {tour_id: tourId, name: "Đặng Hải Yến", email: "qa-inquiry@example.test", people: 1, note: "QA only", consent: true},
  });
  assert.equal(inquiry.status(), 201);
  const original = await api("/workspace");
  assert.equal("catalog" in original, false);
  let holdOldWorkspace = true;
  await page.route("**/api/workspace", route => holdOldWorkspace ? route.fulfill({json: original}) : route.continue());
  await page.goto(base + "/app");
  await page.getByRole("heading", {name: "Tổng quan", exact: true}).waitFor();
  await nav("tasks");
  await page.getByLabel("Tìm công việc", {exact: true}).fill("  DIEU PHOI  ");
  assert.equal(await page.locator(".task-title").count(), 1);
  await page.getByLabel("Tìm công việc", {exact: true}).fill("tuan");
  assert.equal(await page.locator(".task-title").count(), 1);
  await nav("inbox");
  await page.getByLabel("Tìm yêu cầu tư vấn", {exact: true}).fill("  DANG HAI YEN  ");
  const status = page.locator('select[aria-label^="Trạng thái yêu cầu"]');
  await status.waitFor();
  assert.equal(await status.count(), 1);
  const lead = original.inquiries[0];
  await api("/inquiries/" + lead.id, "PATCH", {status: "closed", version: lead.version});
  holdOldWorkspace = false;
  let writes = 0;
  page.on("request", r => { if (r.method() === "PATCH" && new URL(r.url()).pathname === "/api/inquiries/" + lead.id) writes++; });
  const conflict = page.waitForResponse(r => r.request().method() === "PATCH" && new URL(r.url()).pathname === "/api/inquiries/" + lead.id);
  await status.selectOption("contacted");
  assert.equal((await conflict).status(), 409);
  await page.getByText("Yêu cầu đã thay đổi. Đã tải lại; kiểm tra trạng thái mới trước khi sửa.", {exact: true}).waitFor();
  await page.waitForFunction(() => document.querySelector('select[aria-label^="Trạng thái yêu cầu"]')?.value === "closed");
  assert.equal(writes, 1, "A stale write must not be automatically retried");
  assert.equal((await api("/workspace")).inquiries[0].status, "closed");

  await nav("tours");
  let catalogueReads = 0;
  page.on("request", r => {if (new URL(r.url()).pathname === "/api/catalog") catalogueReads++;});
  const catalogButton = page.getByRole("button", {name: "Danh mục Én Việt", exact: true});
  for (let i = 0; i < 2; i++) {
    await catalogButton.click();
    await page.locator(".catalog-picker-row").last().waitFor();
    assert.equal(await page.locator(".catalog-picker-row").count(), 13);
    await page.getByRole("dialog").getByRole("button", {name: "Đóng", exact: true}).click();
  }
  assert.equal(catalogueReads, 1, "The static catalogue is loaded once on demand");
  assert.deepEqual(errors, []);
  console.log("Stability UI PASS: accent-free task/inquiry search, stale inquiry conflict refresh without retry, cached private catalogue.");
} finally {
  if (made) assert.equal((await request("/account", "DELETE")).status(), 200);
  await guest.close();
  await browser.close();
}
