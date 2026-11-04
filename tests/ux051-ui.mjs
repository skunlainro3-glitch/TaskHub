// Exercise guidance using one disposable workspace. Never alter agency records.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
mkdirSync("work", { recursive: true });
const base = process.env.TEST_URL || "http://127.0.0.1:3014";
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "win32" ? { channel: "msedge" } : {}),
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await ctx.newPage();
let registered = false;
const errors = [];
let deletes = 0;
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (
    r.method() === "DELETE" &&
    new URL(r.url()).pathname.startsWith("/api/tours/")
  )
    deletes++;
});
async function api(path, method = "GET", data) {
  const r = await ctx.request.fetch(base + "/api" + path, {
    method,
    headers: { "X-TaskHub": "1" },
    ...(data ? { data } : {}),
  });
  const d = await r.json();
  assert.ok(r.ok(), path + ": " + r.status() + " " + d.message);
  return d;
}
async function nav(id) {
  const b = page.locator('[data-track="nav:' + id + '"]');
  if (!(await b.isVisible()))
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await b.click();
}
try {
  const { user } = await api("/register", "POST", {
    name: "QA UX 0.5.1 - không phải tester",
    email: "qa-ux051-" + Date.now() + "@example.test",
    password: "Temporary-UX-051-" + crypto.randomUUID(),
    role: "other",
    company_size: "other",
    consent: true,
  });
  registered = true;
  await api("/demo/load", "POST", {});
  const original = await api("/workspace"),
    first = original.tours[0];
  await page.goto(base + "/app");
  await page.getByRole("heading", { name: "Tổng quan", exact: true }).waitFor();
  await nav("pooling");
  await page
    .getByRole("heading", {
      name: "Nhận khách từ công ty du lịch khác vào tour của bạn",
      exact: true,
    })
    .waitFor();
  await page
    .getByText("Xem ví dụ cách tính chỗ và tiền", { exact: true })
    .click();
  await page
    .getByText("Ví dụ giả lập: tour có 30 chỗ", { exact: false })
    .waitFor();
  const note = page.locator(".pool-source-note").first();
  assert.equal(await note.getAttribute("open"), null);
  await note.locator("summary").click();
  await note.locator(".pool-note").waitFor();
  await page.getByLabel("Tìm phiếu B2B", { exact: true }).fill("  PHU QUOC  ");
  assert.equal(await page.locator(".pool-card").count(), 1);
  await page
    .getByLabel("Trạng thái phiếu B2B", { exact: true })
    .selectOption("pending");
  await page
    .getByRole("heading", { name: "Không có phiếu phù hợp", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Xóa bộ lọc phiếu", exact: true })
    .first()
    .click();
  assert.equal(await page.locator(".pool-card").count(), 3);
  await page
    .getByLabel("Tour của phiếu B2B", { exact: true })
    .selectOption(first.id);
  assert.equal(await page.locator(".pool-card").count(), 1);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(400);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "B2B overflow " + width,
    );
    await page.screenshot({
      path: "work/ux051-pooling-" + width + ".png",
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(300);
  await nav("tours");
  await page.locator(".card-title").filter({ hasText: first.title }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sửa tour", exact: true }).click();
  await page.getByRole("button", { name: "Xóa tour", exact: true }).click();
  assert.ok(
    await page
      .getByRole("button", { name: "Xác nhận xóa tour", exact: true })
      .isDisabled(),
  );
  await page
    .getByText("không đưa tiền về 0 chỉ để xóa tour.", { exact: false })
    .waitFor();
  await page.getByRole("button", { name: /^Xem phiếu B2B liên quan/ }).click();
  await page
    .getByRole("heading", { name: "Ghép tour B2B", exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel("Tour của phiếu B2B", { exact: true }).inputValue(),
    first.id,
  );
  assert.equal(await page.locator(".pool-card").count(), 1);
  assert.equal(deletes, 0);
  await nav("tours");
  await page.locator(".card-title").filter({ hasText: first.title }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sửa tour", exact: true }).click();
  await page.getByRole("button", { name: "Xóa tour", exact: true }).click();
  await page
    .getByRole("button", { name: "Ngừng công khai tour", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const after = await api("/workspace");
  assert.equal(after.tours.find((t) => t.id === first.id).published, 0);
  assert.deepEqual(
    after.pooling.map((p) => [p.id, p.paid, p.status, p.version]),
    original.pooling.map((p) => [p.id, p.paid, p.status, p.version]),
  );
  assert.deepEqual(
    after.tours.map((t) => [t.id, t.reserved]),
    original.tours.map((t) => [t.id, t.reserved]),
  );
  await page.goto(base + "/portal/" + user.workspace);
  const logo = page.getByRole("link", {
    name: "Trang đầu cổng tour này",
    exact: true,
  });
  assert.equal(await logo.getAttribute("href"), "/portal/" + user.workspace);
  await logo.click();
  assert.equal(new URL(page.url()).pathname, "/portal/" + user.workspace);
  await page.goto(base);
  await page.getByRole("heading", { name: "Cổng thông tin tour", exact: true }).waitFor();
  assert.equal(await page.locator('.reference-catalog,.catalog-card,[data-track="portal:toggle-reference"]').count(), 0);
  await page.getByLabel("Tìm tour", { exact: true }).fill("EVG-TQ01");
  await page.getByRole("heading", { name: "Chưa có hành trình phù hợp", exact: true }).waitFor();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Portal overflow " + width,
    );
    await page.screenshot({
      path: "work/ux051-portal-" + width + ".png",
      fullPage: true,
      animations: "disabled",
    });
  }
  assert.equal(deletes, 0);
  assert.deepEqual(errors, []);
  console.log(
    "UX PASS: B2B guidance/filters, historical notes, protected deletion, details/edit navigation, unpublish preserves seats/receipts, workspace logo, customer catalogue removal and mobile layout.",
  );
} finally {
  if (registered) {
    const r = await ctx.request.delete(base + "/api/account", {
      headers: { "X-TaskHub": "1" },
    });
    assert.equal(r.status(), 200, "Remove disposable QA workspace");
  }
  await browser.close();
}
