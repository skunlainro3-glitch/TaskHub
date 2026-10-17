import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { qaTour } from "./fixtures.mjs";
mkdirSync("work", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHANNEL || process.platform === "win32"
    ? { channel: process.env.PLAYWRIGHT_CHANNEL || "msedge" }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.log("Page error:", e.message);
});
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const em = "ui-" + Date.now() + "@example.test";
let registered = false;
try {
  await page.goto(base);
  await page.locator('.catalog-card').last().waitFor();
  assert.equal(await page.locator('.catalog-card').count(),13);
  await page.getByLabel('Tìm tour',{exact:true}).fill('EVG-TQ11');
  assert.equal(await page.locator('.catalog-card').count(),1);
  await page.locator('.catalog-card .card-title').click();
  await page.getByRole('dialog').getByText('Liên hệ',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Yêu cầu tư vấn',exact:true}).count(),0);
  await page.getByText('Chưa có ngày khởi hành cụ thể, số chỗ và lịch trình từng ngày.',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Xong',exact:true}).click();
  await page.getByLabel('Tìm tour',{exact:true}).fill('');
  assert.equal(await page.getByText('TaskHub Travel',{exact:true}).count(),0);
  await page.screenshot({ path: "work/portal-desktop.png", fullPage: true });
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Portal overflows at ${width}px`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.getByLabel("Tìm tour", { exact: true }).fill("NoMatchingTour-UI");
  await page
    .getByRole("heading", { name: "Chưa có hành trình phù hợp" })
    .waitFor();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page.locator('.catalog-card').last().waitFor();
  await page.route("**/api/public/agency", (route) => route.abort());
  await page.reload();
  await page
    .getByRole("button", { name: "Thử tải lại", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("heading", { name: "Chưa có hành trình phù hợp" })
      .count(),
    0,
    "Network failure is presented as an empty search",
  );
  await page.unroute("**/api/public/agency");
  await page.getByRole("button", { name: "Thử tải lại", exact: true }).click();
  await page.locator('.catalog-card').last().waitFor();
  console.log("Portal responsive, search reset and network recovery passed");
  await page.getByRole("button", { name: "Dùng thử TaskHub", exact: true }).click();
  await page.getByLabel("Tên hiển thị").fill("Người kiểm thử UI");
  await page.getByLabel("Email", { exact: true }).fill(em);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill("Ui-test-secret-2026");
  assert.equal(await page.getByLabel('Vai trò hiện tại',{exact:true}).inputValue(),'');
  assert.equal(await page.getByLabel('Quy mô doanh nghiệp',{exact:true}).inputValue(),'');
  await page.getByLabel('Vai trò hiện tại',{exact:true}).selectOption('operations');
  await page.getByLabel('Quy mô doanh nghiệp',{exact:true}).selectOption('10to30');
  await page.locator('input[name="consent"]').check();
  await page
    .getByRole("button", { name: "Bắt đầu trải nghiệm", exact: true })
    .click();
  await page.getByRole("heading", { name: "Tổng quan", exact: true }).waitFor();
  await page
    .getByRole("heading", { name: "Bắt đầu trong 3 bước", exact: true })
    .waitFor();
  registered = true;
  console.log("Signup passed");
  await page.getByText("Hành trình đang mở", { exact: true }).waitFor();
  let pending = 0,
    maxPending = 0,
    refreshes = 0;
  await page.route("**/api/workspace", async (route) => {
    pending++;
    maxPending = Math.max(maxPending, pending);
    refreshes++;
    try {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 6500));
      await route.fulfill({ response });
    } finally {
      pending--;
    }
  });
  await page.waitForTimeout(12000);
  assert.ok(refreshes > 0, "The slow refresh was not exercised");
  assert.equal(
    maxPending,
    1,
    "Background requests piled up while the server was slow",
  );
  // Drain delayed handlers before later navigation can cancel/handle their routes.
  await page.unrouteAll({ behavior: "wait" });
  console.log("Slow connection passed: no background request pile-up");
  await page.screenshot({ path: "work/dashboard-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Quản lý tour", exact: true }).click();
  await page.getByRole('heading',{name:'Chưa có hành trình',exact:true}).waitFor();
  await page.getByRole('button',{name:'Tạo tour',exact:true}).click();
  for(const name of ['duration','departure','price','capacity'])
    assert.equal(await page.locator(`input[name="${name}"]`).inputValue(),'');
  assert.equal(await page.locator('input[name="published"]').isChecked(),false);
  await page.getByRole('button',{name:'Hủy',exact:true}).click();
  for (const [code,price] of [['EVG-TQ11',''],['EVG-TQ01','28990000']]) {
    await page.getByRole('button',{name:'Danh mục Én Việt',exact:true}).click();
    await page.getByLabel('Tìm trong danh mục').fill(code);
    await page.locator('.catalog-picker-row').click();
    await page.getByRole('button',{name:'Dùng nội dung tour',exact:true}).click();
    assert.equal(await page.locator('input[name="price"]').inputValue(),price);
    for (const name of ['departure','capacity','reserved'])
      assert.equal(await page.locator(`input[name="${name}"]`).inputValue(),'');
    assert.equal(await page.locator('textarea[name="itinerary"]').inputValue(),'');
    assert.equal(await page.locator('input[name="published"]').isChecked(),false);
    assert.ok((await page.locator('textarea[name="description"]').inputValue()).includes('https://dulichenvietcs.netlify.app/'));
    await page.getByRole('button',{name:'Hủy',exact:true}).click();
  }
  await page.getByRole('button',{name:'Tạo tour',exact:true}).click();
  for(const name of ['title','destination','departure','duration','price','capacity','reserved'])
    await page.locator(`input[name="${name}"]`).fill(String(qaTour[name]));
  await page.locator('textarea[name="description"]').fill(qaTour.description);
  await page.locator('textarea[name="itinerary"]').fill(qaTour.itinerary);
  await page.locator('input[name="published"]').check();
  await page.getByRole('button',{name:'Lưu hành trình',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page
    .getByRole("button", { name: qaTour.title, exact: true })
    .click();
  await page.getByLabel("Khách đã giữ chỗ").fill("24");
  await page
    .getByRole("button", { name: "Lưu hành trình", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Cổng khách hàng", exact: true })
    .click();

  await page
    .locator(".tour-card")
    .first()
    .getByText("Còn 6 chỗ", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: qaTour.title, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Yêu cầu tư vấn", exact: true })
    .click();
  await page.getByLabel("Tên", { exact: true }).fill("Khách minh họa");
  await page.getByLabel("Email", { exact: true }).fill("customer@example.test");
  await page.locator('input[name="consent"]').check();
  await page
    .getByRole("button", { name: "Gửi yêu cầu tư vấn", exact: true })
    .click();
  await page
    .getByText("Đã gửi yêu cầu. Đây chưa phải xác nhận đặt tour.", {
      exact: true,
    })
    .waitFor();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByRole("button", { name: "Về điều hành", exact: true }).click();
  await page
    .locator(".sidebar nav")
    .getByRole("button", { name: /Yêu cầu tư vấn/ })
    .click();
  console.log("Portal and inquiry passed");
  await page.getByText("customer@example.test", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Công việc", exact: true }).click();
  await page
    .getByRole("button", { name: "Giao công việc", exact: true })
    .click();

  await page
    .getByLabel("Công việc", { exact: true })
    .fill("Công việc kiểm thử UI");
  await page
    .getByLabel("Người phụ trách", { exact: true })
    .fill("Nhân viên mẫu");
  await page.getByLabel('Hạn hoàn thành',{exact:true}).fill(qaTour.departure);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Giao công việc", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByLabel("Trạng thái Công việc kiểm thử UI", { exact: true })
    .selectOption("done");
  await page
    .locator(".kanban-column.done")
    .getByRole("heading", { name: "Công việc kiểm thử UI" })
    .waitFor();
  await page.screenshot({ path: "work/tasks-desktop.png", fullPage: true });
  console.log("Tasks passed");
  await page.getByRole("button", { name: "Phản hồi MVP", exact: true }).click();
  for (const k of ["portal", "operations", "sync", "ease"])
    await page.locator(`input[name="${k}"][value="4"]`).check();
  await page.locator('select[name="intent"]').selectOption("maybe");
  await page.locator('input[name="price"]').fill("0");
  await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await page.getByText("Đã lưu", { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: "work/feedback-mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile feedback has horizontal overflow",
  );
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("button", { name: "Mở menu", exact: true })
      .getAttribute("aria-expanded"),
    "false",
  );
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page.getByRole("button", { name: "Tổng quan", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: "work/dashboard-mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile dashboard has horizontal overflow",
  );
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Workspace overflows at ${width}px`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Cổng khách hàng", exact: true })
    .click();
  await page.screenshot({ path: "work/portal-mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile portal has horizontal overflow",
  );
  assert.deepEqual(errors, []);
  if (process.env.REVIEWER_TEST_EMAIL && process.env.REVIEWER_TEST_PASSWORD) {
    const reviewerContext = await browser.newContext();
    const login = await reviewerContext.request.post(base + "/api/login", {
      headers: { "X-TaskHub": "1" },
      data: {
        email: process.env.REVIEWER_TEST_EMAIL,
        password: process.env.REVIEWER_TEST_PASSWORD,
      },
    });
    assert.equal(login.status(), 200);
    const review = await reviewerContext.newPage();
    review.on("pageerror", (error) => errors.push(error.message));
    await review.goto(base + "/app");
    await review
      .getByText(
        "Tài khoản giảng viên / người đánh giá: chỉ xem, không chỉnh sửa dữ liệu.",
      )
      .waitFor();
    await review
      .getByRole("button", { name: "Quản lý tour", exact: true })
      .click();
    assert.equal(
      await review
        .getByRole("button", { name: "Tạo tour", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await review
        .getByRole("button", { name: "Lưu hành trình", exact: true })
        .count(),
      0,
    );
    await review
      .getByRole("button", { name: "Công việc", exact: true })
      .click();
    const statuses = review.locator('select[aria-label^="Trạng thái "]');
    for (const control of await statuses.all())
      assert.ok(await control.isDisabled());
    assert.equal(await review.getByRole('button',{name:'Giao công việc',exact:true}).count(),0);
    await review
      .getByRole("button", { name: "Phản hồi MVP", exact: true })
      .click();
    await review
      .getByRole("link", { name: "Tương tác CSV", exact: true })
      .waitFor();
    await review.screenshot({
      path: "work/reviewer-desktop.png",
      fullPage: true,
    });
    await reviewerContext.close();
    assert.deepEqual(errors, []);
    console.log(
      "Reviewer UI passed: reports visible, tour/task writes unavailable.",
    );
  }
  await page.setViewportSize({width:1440,height:1050});
  await page.getByRole('button',{name:'Về điều hành',exact:true}).click();
  await page.getByRole('button',{name:'Quản lý tour',exact:true}).click();
  await page.getByRole('button',{name:qaTour.title,exact:true}).click();
  await page.getByRole('button',{name:'Xóa tour',exact:true}).click();
  await page.getByRole('button',{name:'Giữ lại tour',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Xác nhận xóa tour',exact:true}).count(),0);
  await page.getByRole('button',{name:'Xóa tour',exact:true}).click();
  await page.getByRole('button',{name:'Xác nhận xóa tour',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('heading',{name:'Chưa có hành trình',exact:true}).waitFor();
  console.log(
    "UI PASS: signup, tour sync, inquiry, task create/status, feedback; desktop and mobile no overflow; no page errors.",
  );
} catch (e) {
  await page.screenshot({ path: "work/ui-failure.png", fullPage: true });
  console.log(
    "Failure headings:",
    await page.locator("h1,h2").allTextContents(),
  );
  throw e;
} finally {
  if (registered) {
    await context.request.delete(base + "/api/account", {
      headers: { "X-TaskHub": "1" },
    });
  }
  await browser.close();
}
