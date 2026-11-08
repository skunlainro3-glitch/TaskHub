// Disposable QA workspace only. These accounts are not real survey participants.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import readXlsxFile from "read-excel-file/node";
import { qaTour } from "./fixtures.mjs";

const base = process.env.TEST_URL || "http://127.0.0.1:3058";
const directory = "work/quotes-20261109";
mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { channel: "msedge" } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
await context.addInitScript(() => {
  window.__quotePrints = 0;
  window.print = () => {
    window.__quotePrints++;
    window.__quotePrintedText = document.querySelector(".taskhub-print")?.innerText || "";
  };
});
const page = await context.newPage(), errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let made = false;
const request = (path, method = "GET", data) => context.request.fetch(base + "/api" + path, {
  method, headers: { "X-TaskHub": "1" }, ...(data ? { data } : {}),
});
async function api(path, method, data) {
  const response = await request(path, method, data);
  const result = await response.json();
  assert(response.ok(), `${path}: ${response.status()} ${JSON.stringify(result)}`);
  return result;
}
const future = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
async function nav(id) {
  const button = page.locator(`[data-track="nav:${id}"]`);
  if (!(await button.isVisible())) await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await button.click();
}
async function layout(label) {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const result = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth <= innerWidth + 1,
      modal: !document.querySelector(".modal") || document.querySelector(".modal").scrollWidth <= document.querySelector(".modal").clientWidth + 1,
    }));
    assert(result.page && result.modal, `${label} overflow at ${width}px: ${JSON.stringify(result)}`);
    if (width === 390 || width === 1440)
      await page.screenshot({ path: `${directory}/${label}-${width}.png`, fullPage: true, animations: "disabled" });
  }
}
function responseFor(method, path) {
  return page.waitForResponse((response) => response.request().method() === method && new URL(response.url()).pathname === "/api" + path);
}
try {
  await api("/register", "POST", {
    name: "QA báo giá — không phải tester", email: `qa-quotes-${Date.now()}@example.test`,
    password: "Temporary-quotation-QA-only-2026!", role: "operations", company_size: "10to30", consent: true,
  });
  made = true;
  const tour = { ...qaTour, title: "QA Báo giá Đà Nẵng", departure: future(30), reserved: 0 };
  const { id: tourId } = await api("/tours", "POST", tour);
  await page.goto(base + "/app");
  await page.getByRole("heading", { name: "Tổng quan", exact: true }).waitFor();
  await nav("quotes");
  await page.getByRole("heading", { name: "Chưa có báo giá", exact: true }).waitFor();
  await page.locator('[data-track="quote:new"]').click();
  await page.getByLabel("Tour báo giá", { exact: true }).selectOption(tourId);
  await page.getByLabel("Người / đơn vị nhận báo giá", { exact: true }).fill("QA Đặng Hải Yến");
  await page.getByLabel("Email người nhận (không bắt buộc)", { exact: true }).fill("qa-recipient@example.test");
  await page.getByLabel("Số khách", { exact: true }).fill("4");
  assert.equal(await page.getByLabel("Đơn giá / khách (VND)", { exact: true }).inputValue(), "1000000");
  await page.getByLabel("Giảm giá cho cả đoàn (VND)", { exact: true }).fill("200000");
  await page.getByLabel("Báo giá có giá trị đến ngày", { exact: true }).fill(future(7));
  await page.getByLabel("Điều kiện / ghi chú (không bắt buộc)", { exact: true }).fill("QA: điều kiện thử nghiệm riêng, không phải giao dịch thật.");
  assert.match(await page.locator(".quote-total dd").innerText(), /3\.800\.000/);
  await layout("quote-editor");
  const createResponse = responseFor("POST", "/quotes");
  await page.locator('[data-track="quote:save"]').click();
  assert.equal((await createResponse).status(), 201);
  await page.locator('[data-track="quote:submit"]').waitFor();
  let quote = (await api("/quotes")).quotes[0];
  assert.equal(quote.total, 3800000);
  assert.equal(await page.locator('[data-track="quote:export-xlsx"]').count(), 0);

  // A stale form must preserve the draft and send exactly one failed write.
  await page.locator('[data-track="quote:edit"]').click();
  await page.getByLabel("Người / đơn vị nhận báo giá", { exact: true }).fill("QA đang nhập, cần giữ lại");
  await api("/quotes/" + quote.id, "PUT", {
    ...quote.payload, tour_id: quote.tour_id, version: quote.version, recipient_name: "QA Đặng Hải Yến bản mới",
  });
  let writes = 0;
  page.on("request", (req) => { if (req.method() === "PUT" && new URL(req.url()).pathname === "/api/quotes/" + quote.id) writes++; });
  const conflictResponse = responseFor("PUT", "/quotes/" + quote.id);
  await page.locator('[data-track="quote:save"]').click();
  assert.equal((await conflictResponse).status(), 409);
  await page.getByRole("button", { name: "Tải bản đã lưu", exact: true }).waitFor();
  assert.equal(await page.getByLabel("Người / đơn vị nhận báo giá", { exact: true }).inputValue(), "QA đang nhập, cần giữ lại");
  assert.equal(writes, 1, "The UI must not silently retry a stale save");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Tải bản đã lưu", exact: true }).click();
  await page.waitForFunction(() => [...document.querySelectorAll("input")].some((input) => input.value === "QA Đặng Hải Yến bản mới"));
  const saveResponse = responseFor("PUT", "/quotes/" + quote.id);
  await page.locator('[data-track="quote:save"]').click();
  assert.equal((await saveResponse).status(), 200);
  await page.locator('[data-track="quote:submit"]').waitFor();
  const submitResponse = responseFor("PATCH", "/quotes/" + quote.id);
  await page.locator('[data-track="quote:submit"]').click();
  assert.equal((await submitResponse).status(), 200);
  await page.locator('[data-track="quote:approve"]').waitFor();
  const rejectButton = page.getByRole("button", { name: "Yêu cầu sửa", exact: true });
  assert.equal(await rejectButton.isEnabled(), false);
  await page.getByLabel("Ghi chú xử lý", { exact: true }).fill("QA: bổ sung điều kiện báo giá trước khi duyệt.");
  const rejectResponse = responseFor("PATCH", "/quotes/" + quote.id);
  await rejectButton.click();
  assert.equal((await rejectResponse).status(), 200);
  await page.locator('[data-track="quote:edit"]').waitFor();
  assert.equal(await page.locator('[data-track="quote:approve"]').count(), 0);
  await page.locator('[data-track="quote:edit"]').click();
  await page.getByLabel("Điều kiện / ghi chú (không bắt buộc)", { exact: true }).fill("QA: đã bổ sung điều kiện. Không phải giao dịch thật.");
  const correctionResponse = responseFor("PUT", "/quotes/" + quote.id);
  await page.locator('[data-track="quote:save"]').click();
  assert.equal((await correctionResponse).status(), 200);
  await page.locator('[data-track="quote:submit"]').waitFor();
  const resubmitResponse = responseFor("PATCH", "/quotes/" + quote.id);
  await page.locator('[data-track="quote:submit"]').click();
  assert.equal((await resubmitResponse).status(), 200);
  await page.locator('[data-track="quote:approve"]').waitFor();
  page.once("dialog", (dialog) => { assert.match(dialog.message(), /chính mình tạo/); return dialog.accept(); });
  const approveResponse = responseFor("PATCH", "/quotes/" + quote.id);
  await page.locator('[data-track="quote:approve"]').click();
  assert.equal((await approveResponse).status(), 200);
  await page.locator('[data-track="quote:export-xlsx"]').waitFor();
  await layout("quote-approved");
  assert.equal(await page.locator(".quote-history li").count(), 8);

  // Mutating the live tour must not rewrite a previously approved quote snapshot.
  const workspace = await api("/workspace");
  const currentTour = workspace.tours.find((item) => item.id === tourId);
  await api("/tours/" + tourId, "PUT", { ...currentTour, title: "QA tour đã sửa sau duyệt", price: 9000000 });
  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-track="quote:export-xlsx"]').click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /\.xlsx$/);
  const workbook = await readXlsxFile(readFileSync(await download.path()));
  const rows = workbook[0].data;
  assert.equal(rows.find((row) => row[0] === "Tổng báo giá (VND)")[1], 3800000);
  assert.equal(rows.find((row) => row[0] === "Tên tour")[1], tour.title);
  await page.locator('[data-track="quote:print"]').click();
  await page.waitForFunction(() => window.__quotePrints === 1);
  const printed = await page.evaluate(() => window.__quotePrintedText);
  assert(printed.includes(tour.title));
  assert(printed.includes("QA Đặng Hải Yến bản mới"));
  assert(printed.includes("3.800.000"));
  assert(!printed.includes("QA tour đã sửa sau duyệt"));
  const pdfPath = `${directory}/approved-quote.pdf`;
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
  assert.equal(readFileSync(pdfPath).subarray(0, 4).toString(), "%PDF");
  assert(statSync(pdfPath).size > 1000);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.waitForFunction(() => !document.querySelector(".taskhub-print"));

  page.once("dialog", (dialog) => dialog.accept());
  const reviseResponse = responseFor("PATCH", "/quotes/" + quote.id);
  await page.getByRole("button", { name: "Mở lại bản nháp", exact: true }).click();
  assert.equal((await reviseResponse).status(), 200);
  await page.locator('[data-track="quote:submit"]').waitFor();
  assert.equal(await page.locator('[data-track="quote:export-xlsx"]').count(), 0);
  assert.equal((await request("/quotes/" + quote.id + "/export-data")).status(), 409);
  await page.locator(".modal-header").getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByLabel("Tìm báo giá", { exact: true }).fill("  DANG HAI YEN  ");
  assert.equal(await page.locator(".quote-card").count(), 1);
  await layout("quote-list");

  await page.route("**/api/quotes", (route) => route.abort("internetdisconnected"));
  await page.getByRole("button", { name: "Tải lại danh sách báo giá", exact: true }).click();
  await page.locator(".quotes-page .error").filter({ hasText: "Mất kết nối" }).waitFor();
  assert.equal(await page.locator(".quote-card").count(), 1, "Keep the latest loaded list after a network failure");
  await page.unroute("**/api/quotes");
  await page.getByRole("button", { name: "Tải lại danh sách báo giá", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector(".quotes-page .error"));
  assert.deepEqual(errors, []);
  console.log("Quotation UI PASS: draft/edit, stale recovery without retry, submit/reject/correct/explicit owner approval, canonical Excel/PDF snapshot and print cleanup, revision revokes export, offline recovery, 320/390/768/1440 layouts.");
} finally {
  if (made) assert.equal((await request("/account", "DELETE")).status(), 200);
  await browser.close();
}
