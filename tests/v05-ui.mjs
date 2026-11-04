// Disposable automated QA accounts are deleted in finally. These are not
// research participants and must never be reported as actual tester evidence.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

mkdirSync("work", { recursive: true });
const base = process.env.TEST_URL || "http://127.0.0.1:3014";
const stamp = Date.now();
const ownerEmail = `v05-owner-${stamp}@example.test`;
const staffEmail = `v05-staff-${stamp}@example.test`;
const canceledEmail = `v05-cancel-${stamp}@example.test`;
const password = "V05-automated-qa-only-2026!";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHANNEL || process.platform === "win32"
    ? { channel: process.env.PLAYWRIGHT_CHANNEL || "msedge" }
    : {}),
});
const ownerContext = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
});
const staffContext = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
});
const page = await ownerContext.newPage();
const staff = await staffContext.newPage();
const errors = [];
for (const tab of [page, staff])
  tab.on("pageerror", (error) => errors.push(error.message));
let registered = false;

const responseFor = (tab, path, method) =>
  tab.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api" + path &&
      r.request().method() === method,
  );
const workspace = async (context) => {
  const response = await context.request.get(base + "/api/workspace");
  assert.equal(response.status(), 200);
  return response.json();
};
async function noOverflow(tab, label, screenshot) {
  for (const width of [320, 390]) {
    await tab.setViewportSize({ width, height: 844 });
    assert.ok(
      await tab.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${label} overflows at ${width}px`,
    );
    if (screenshot)
      await tab.screenshot({
        path: `work/v05-${screenshot}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
  }
  await tab.setViewportSize({ width: 1440, height: 1050 });
}
async function nav(tab, label) {
  const button = tab
    .locator("aside nav")
    .getByRole("button", { name: label, exact: true });
  if (!(await button.isVisible()))
    await tab.getByRole("button", { name: "Mở menu", exact: true }).click();
  await button.click();
  await tab.getByRole("heading", { name: label, exact: true }).waitFor();
}
async function createInvite(email) {
  await page.getByLabel("Email nhân viên", { exact: true }).fill(email);
  await page
    .getByLabel("Quyền truy cập", { exact: true })
    .selectOption("viewer");
  const response = responseFor(page, "/team/invites", "POST");
  await page.getByRole("button", { name: "Tạo lời mời", exact: true }).click();
  assert.equal((await response).status(), 201);
  const input = page.getByLabel("Liên kết mời nhân viên", { exact: true });
  await input.waitFor();
  const link = await input.inputValue();
  assert.equal(
    new URL(link).origin,
    new URL(base).origin,
    "Invitation UI must keep the current public host",
  );
  assert.match(
    new URL(link).searchParams.get("invite") || "",
    /^[a-f0-9]{64}$/,
  );
  return link;
}

try {
  await page.goto(base);
  await page.getByRole("button", { name: "Dành cho điều hành", exact: true }).click();
  await page
    .getByRole("button", { name: "Dùng thử TaskHub", exact: true })
    .click();
  await page
    .getByLabel("Tên hiển thị", { exact: true })
    .fill("QA tự động v0.5 — không phải tester thật");
  await page.getByLabel("Email", { exact: true }).fill(ownerEmail);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page
    .getByLabel("Vai trò hiện tại", { exact: true })
    .selectOption("operations");
  await page
    .getByLabel("Quy mô doanh nghiệp", { exact: true })
    .selectOption("10to30");
  await page.locator('input[name="consent"]').check();
  const registration = responseFor(page, "/register", "POST");
  await page
    .getByRole("button", { name: "Bắt đầu trải nghiệm", exact: true })
    .click();
  assert.equal((await registration).status(), 201);
  registered = true;
  await page.getByRole("heading", { name: "Tổng quan", exact: true }).waitFor();
  assert.equal((await workspace(ownerContext)).tours.length, 0);
  assert.equal(await page.locator('.welcome-banner,.workspace-switch,.app-main > .workspace-notice').count(),0);
  assert.equal(await page.getByRole('button',{name:'Phản hồi MVP',exact:true}).count(),0);
  assert.equal(await page.locator('.feature-feedback-form').count(),0);
  await page
    .getByRole("button", { name: "Dùng dữ liệu mẫu", exact: true })
    .waitFor();
  await noOverflow(
    page,
    "Empty dashboard without survey or decorative hero",
    "empty-dashboard",
  );
  page.once("dialog", (dialog) => dialog.accept());
  const seed = responseFor(page, "/demo/load", "POST");
  await page
    .getByRole("button", { name: "Dùng dữ liệu mẫu", exact: true })
    .click();
  assert.equal((await seed).status(), 200);
  await page
    .getByRole("button", { name: "Dùng dữ liệu mẫu", exact: true })
    .waitFor({ state: "hidden" });
  const data = await workspace(ownerContext);
  assert.equal(data.tours.length, 3);
  assert.equal(data.tasks.length, 3);
  assert.equal(data.pooling.length, 3);
  assert.deepEqual(
    [...data.tours]
      .sort((a, b) => a.departure.localeCompare(b.departure))
      .map((tour) => tour.reserved),
    [22, 18, 12],
  );
  assert.deepEqual(
    data.pooling.map((pool) => pool.paid).sort((a, b) => a - b),
    [0, 8500000, 33600000],
  );
  assert.equal(
    data.pooling.filter((pool) => pool.status === "confirmed").length,
    2,
  );
  assert.ok(data.tours.every((tour) => tour.title.includes("[Demo]")));
  await noOverflow(
    page,
    "Populated dashboard without survey or decorative hero",
    "sample-dashboard",
  );
  console.log(
    "v0.5 sample UI passed: optional isolated 3/3/3 scenario, correct seats and simulated payments; 320/390px fit",
  );

  assert.equal(await page.getByRole('heading',{name:'Đo một bài thử thực tế',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Bắt đầu đo',exact:true}).count(),0);
  for(const [path,method] of [['/trials','GET'],['/trials','POST'],['/trials/removed','PATCH'],['/trials/summary','GET'],['/export/trials','GET']]) {
    const removed=await ownerContext.request.fetch(base+'/api'+path,{method,headers:{'X-TaskHub':'1'},...(['POST','PATCH'].includes(method)?{data:{}}:{})});
    assert.equal(removed.status(),404,'Removed API must not be available: '+path);
  }
  await nav(page,'Ghép tour B2B');
  assert.equal(await page.locator('.pool-guide').count(),1);
  await noOverflow(page,'Simulated pooling ledger','pooling');
  await nav(page,'Tổng quan');
  console.log('Removed timed-trial UI/API; demo, onboarding and B2B remain usable.');

  await nav(page, "Tài khoản & nhóm");
  const securityCard = page.locator('.account-panel').filter({ has: page.getByRole('heading', { name: 'Tài khoản & bảo mật', exact: true }) });
  await securityCard.getByText('Quyền: Chủ không gian.', { exact: true }).waitFor();
  assert.equal(await securityCard.locator('p').count(), 2);
  assert.equal(await securityCard.locator('button,.badge,.muted').count(), 0);
  assert.equal(await securityCard.locator('strong').textContent(), 'QA tự động v0.5 — không phải tester thật');
  assert.ok((await securityCard.textContent()).includes(ownerEmail));
  await noOverflow(page, "Account security and invitation form", "account");
  const inviteLink = await createInvite(staffEmail);
  await staff.goto(inviteLink);
  await staff
    .getByRole("dialog", { name: "Tham gia không gian làm việc", exact: true })
    .waitFor();
  await staff.getByLabel("Email nhận lời mời", { exact: true }).waitFor();
  await staff.waitForFunction(() => location.search === "");
  await staff
    .getByLabel("Tên hiển thị", { exact: true })
    .fill("QA nhân viên v0.5");
  await staff
    .getByLabel("Email nhận lời mời", { exact: true })
    .fill(staffEmail);
  await staff
    .getByLabel("Mật khẩu tài khoản nhân viên", { exact: true })
    .fill(password);
  await staff.locator('input[name="consent"]').check();
  const accepted = responseFor(staff, "/team/invites/accept", "POST");
  await staff.getByRole("button", { name: "Tham gia", exact: true }).click();
  assert.equal((await accepted).status(), 201);
  await staff
    .getByRole("heading", { name: "Tổng quan", exact: true })
    .waitFor();
  assert.equal((await workspace(staffContext)).tours.length, 3);
  assert.equal(
    await staff
      .getByRole("button", { name: "Bắt đầu đo", exact: true })
      .count(),
    0,
    "Staff must not appear in participant timing tools",
  );
  assert.equal(
    await staff
      .locator("aside nav")
      .getByRole("button", { name: "Phản hồi MVP", exact: true })
      .count(),
    0,
  );
  await nav(staff, "Quản lý tour");
  assert.equal(
    await staff.getByRole("button", { name: "Tạo tour", exact: true }).count(),
    0,
  );
  assert.equal(await staff.locator(".tour-card").count(), 3);
  const blockedWrite = await staffContext.request.post(base + "/api/tours", {
    headers: { "X-TaskHub": "1" },
    data: {},
  });
  assert.equal(blockedWrite.status(), 403);
  await nav(staff, "Ghép tour B2B");
  assert.equal(
    await staff
      .getByRole("button", { name: "Tạo phiếu ghép", exact: true })
      .count(),
    0,
  );
  assert.equal((await workspace(staffContext)).pooling.length, 3);
  await noOverflow(staff, "Read-only staff pooling workspace", "staff-viewer");
  const roleChange = page.waitForResponse(
    (r) =>
      r.url().includes("/api/team/members/") &&
      r.request().method() === "PATCH",
  );
  await page
    .getByLabel("Quyền của QA nhân viên v0.5", { exact: true })
    .selectOption("editor");
  assert.equal((await roleChange).status(), 200);
  await staff.reload();
  await staff
    .getByRole("heading", { name: "Tổng quan", exact: true })
    .waitFor();
  await nav(staff, "Quản lý tour");
  await staff.getByRole("button", { name: "Tạo tour", exact: true }).waitFor();
  assert.ok(
    await staff
      .getByRole("button", { name: "Tạo tour", exact: true })
      .isEnabled(),
  );
  await staff.getByRole("button", { name: "Tạo tour", exact: true }).click();
  await staff.getByRole("dialog").waitFor();
  await staff
    .getByRole("dialog")
    .getByRole("button", { name: "Đóng", exact: true })
    .click();
  console.log(
    "v0.5 shared workspace passed: invite accepted through UI, token removed, viewer API403 and editor permission refresh",
  );

  await staff
    .getByRole("button", { name: "Tài khoản & nhóm", exact: true })
    .click();
  await staff.getByText("Xóa tài khoản", { exact: true }).click();
  staff.once("dialog", (dialog) => dialog.accept());
  const removeStaff = responseFor(staff, "/account", "DELETE");
  await staff
    .getByRole("button", {
      name: "Xóa tài khoản nhân viên của tôi",
      exact: true,
    })
    .click();
  assert.equal((await removeStaff).status(), 200);
  await staff
    .getByRole("button", { name: "Dành cho điều hành", exact: true })
    .waitFor();
  assert.equal(
    (await workspace(ownerContext)).tours.length,
    3,
    "Staff deletion must preserve owner workspace",
  );
  assert.equal(
    (await (await staffContext.request.get(base + "/api/session")).json()).user,
    null,
  );

  // Re-entering the account screen refreshes its member list after self-deletion.
  await nav(page, "Tổng quan");
  await nav(page, "Tài khoản & nhóm");
  const canceledLink = await createInvite(canceledEmail);
  const pendingRow = page
    .locator(".team-row")
    .filter({ hasText: canceledEmail });
  await pendingRow.waitFor();
  const cancelResponse = page.waitForResponse(
    (r) =>
      r.url().includes("/api/team/invites/") &&
      r.request().method() === "DELETE",
  );
  await pendingRow
    .getByRole("button", { name: "Hủy lời mời", exact: true })
    .click();
  assert.equal((await cancelResponse).status(), 200);
  await pendingRow.waitFor({ state: "hidden" });
  await staff.goto(canceledLink);
  await staff
    .getByRole("alert")
    .getByText("Lời mời không hợp lệ hoặc đã hết hạn.", { exact: true })
    .waitFor();
  assert.ok(
    await staff
      .getByRole("button", { name: "Tham gia", exact: true })
      .isDisabled(),
  );
  await staff.waitForFunction(() => location.search === "");
  console.log(
    "v0.5 account lifecycle passed: staff self-deletion preserves business records; canceled invitation cannot be accepted",
  );

  await staff.goto(base);
  await staff.getByRole("button", { name: "Dành cho điều hành", exact: true }).click();
  await staff.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await staff
    .getByRole("button", { name: "Quên mật khẩu?", exact: true })
    .click();
  await staff.getByLabel("Email đã đăng ký", { exact: true }).fill(ownerEmail);
  const forgot = responseFor(staff, "/password/forgot", "POST");
  await staff
    .getByRole("button", { name: "Gửi hướng dẫn", exact: true })
    .click();
  const forgotResponse = await forgot;
  assert.equal(forgotResponse.status(), 200);
  assert.equal((await forgotResponse.json()).mail_ready, false);
  await staff
    .getByText("Gửi email chưa được cấu hình.", { exact: false })
    .waitFor();
  await noOverflow(staff, "Unavailable email recovery message", "forgot");

  await staff.goto(base + "/?reset=" + "1".repeat(64));
  await staff
    .getByRole("dialog", { name: "Đặt mật khẩu mới", exact: true })
    .waitFor();
  await staff.waitForFunction(() => location.search === "");
  await staff
    .getByLabel("Mật khẩu mới", { exact: true })
    .fill(password + "-changed");
  const reset = responseFor(staff, "/password/reset", "POST");
  await staff
    .getByRole("button", { name: "Lưu mật khẩu mới", exact: true })
    .click();
  assert.equal((await reset).status(), 400);
  await staff
    .getByRole("alert")
    .getByText("Liên kết không hợp lệ hoặc đã hết hạn.", { exact: true })
    .waitFor();
  await staff.goto(base + "/?verify=" + "2".repeat(64));
  await staff.waitForFunction(() => location.search === "");
  await staff.getByRole('heading', { name: 'Cổng thông tin tour', exact: true }).waitFor();
  assert.equal(await staff.getByRole('dialog').count(), 0);
  for (const path of ['/account/verification/request','/account/verification/confirm']) {
    const retired = await staffContext.request.post(base + '/api' + path, { headers: { 'X-TaskHub': '1' }, data: { token: '2'.repeat(64) } });
    assert.equal(retired.status(), 404);
  }
  assert.deepEqual(errors, []);
  console.log(
    "V0.5 UI PASS: optional samples, removed features, invitations/permissions, safe self-deletion, recovery honesty, invalid links and mobile no-overflow; no browser errors. Disposable QA accounts removed.",
  );
} catch (error) {
  // Avoid capturing live invite links/tokens in failure artifacts.
  for (const [name, tab] of [
    ["owner", page],
    ["staff", staff],
  ]) {
    await tab
      .evaluate(() => {
        for (const input of document.querySelectorAll(
          'input[aria-label="Liên kết mời nhân viên"]',
        ))
          input.value = "[redacted QA invite]";
      })
      .catch(() => {});
    await tab
      .screenshot({
        path: `work/v05-failure-${name}.png`,
        fullPage: true,
        animations: "disabled",
      })
      .catch(() => {});
    console.log(
      name + " failure headings:",
      await tab
        .locator("h1,h2")
        .allTextContents()
        .catch(() => []),
    );
  }
  throw error;
} finally {
  if (registered) {
    const removed = await ownerContext.request.delete(base + "/api/account", {
      headers: { "X-TaskHub": "1" },
    });
    assert.equal(
      removed.status(),
      200,
      "Disposable QA owner/workspace must be deleted",
    );
  }
  await browser.close();
}
