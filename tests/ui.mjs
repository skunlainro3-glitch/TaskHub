import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { qaTour } from "./fixtures.mjs";
import { importColumns } from "../src/import-tours.mjs";
import { xlsxFixture } from "./xlsx-fixture.mjs";
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
const screenshot = (options) => page.screenshot({ animations: "disabled", ...options });
const workspace = async () => {
  const response = await context.request.get(base + "/api/workspace");
  assert.equal(response.status(), 200);
  return response.json();
};
const noOverflow = async (label, widths = [320, 390]) => {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label} overflows at ${width}px`);
  }
};
try {
  await page.goto(base);
  await page.locator('.portal-results').waitFor();
  assert.equal(await page.locator('.reference-catalog,.catalog-card,[data-track="portal:toggle-reference"]').count(),0);
  // Read-only route fixture exercises date/stock filtering without writing
  // business data to a live workspace. Reference content belongs internally.
  const publicResponse=await context.request.get(base+'/api/public/agency');
  assert.equal(publicResponse.status(),200);
  const publicData=await publicResponse.json();
  assert.equal(Object.hasOwn(publicData,'catalog'),false);
  const filterTours=[
    {...qaTour,id:'filter-open',title:'Hà Nội - Đà Nẵng',destination:'Đà Nẵng',reserved:10},
    {...qaTour,id:'filter-full',title:'Tour đã đủ khách',destination:'Phú Quốc',reserved:30,departure:'2026-12-21'},
    {...qaTour,id:'filter-past',title:'Tour lịch sử',destination:'Quy Nhơn',departure:'2020-01-01'},
  ];
  await page.route('**/api/public/agency',route=>route.fulfill({json:{...publicData,tours:filterTours}}));
  await page.reload();
  const operatingCards=page.locator('.tour-card:not(.catalog-card)');
  await operatingCards.last().waitFor();
  assert.equal(await operatingCards.count(),3);
  assert.deepEqual(await page.getByLabel('Lọc điểm đến',{exact:true}).locator('option').allTextContents(),['Tất cả điểm đến','Đà Nẵng','Phú Quốc','Quy Nhơn']);
  await page.getByLabel('Tìm tour',{exact:true}).fill('da nang');
  assert.equal(await operatingCards.count(),1);
  await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();
  await page.getByLabel('Khởi hành từ ngày',{exact:true}).fill('2026-12-20');
  await page.getByLabel('Đến ngày',{exact:true}).fill('2026-12-20');
  assert.equal(await operatingCards.count(),1);
  assert.equal(await page.locator('.catalog-card').count(),0);
  assert.equal(await page.locator('.reference-filter-note').count(),0);
  await page.getByLabel('Đến ngày',{exact:true}).fill('2026-12-19');
  await page.getByText('Ngày kết thúc cần bằng hoặc sau ngày bắt đầu.',{exact:true}).waitFor();
  assert.equal(await operatingCards.count(),0);
  await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();
  await page.getByLabel('Chỉ tour còn chỗ, chưa khởi hành',{exact:true}).check();
  assert.equal(await operatingCards.count(),1);
  await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();
  for(const width of [320,390]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.locator('.portal-hero,.portal-cta,.capability-board').count(),0,'Customer view must omit operator marketing');
    const heading=await page.locator('.customer-heading').boundingBox();
    assert.ok(heading.height<250,'Customer heading must leave space for actual tour search');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Portal filters overflow');
  }
  await page.unroute('**/api/public/agency');
  await page.reload();
  await page.locator('.portal-results').waitFor();
  await page.setViewportSize({width:1440,height:1050});
  console.log('Portal schedule filters passed: accent-free search, inclusive dates, invalid ranges, unavailable stock, published tours only and compact customer header');
  assert.equal(await page.getByText('TaskHub Travel',{exact:true}).count(),0);
  await screenshot({ path: "work/portal-desktop.png", fullPage: true });
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
  await page.locator('.portal-results').waitFor();
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
  await page.locator('.portal-results').waitFor();
  console.log("Portal responsive, search reset and network recovery passed");
  await page.getByRole("button", { name: "Dành cho điều hành", exact: true }).click();
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
  const signupResponse = page.waitForResponse(response => response.url().endsWith('/api/register') && response.request().method() === 'POST');
  await page
    .getByRole("button", { name: "Bắt đầu trải nghiệm", exact: true })
    .click();
  assert.equal((await signupResponse).status(), 201);
  registered = true;
  await page.getByRole("heading", { name: "Tổng quan", exact: true }).waitFor();
  await page.getByText("Hành trình đang mở", { exact: true }).waitFor();
  assert.equal(await page.locator(".welcome-banner,.workspace-switch,.app-main > .workspace-notice").count(), 0);
  assert.equal(await page.locator('aside nav').getByRole('button',{name:'Phản hồi MVP',exact:true}).count(), 0);
  assert.equal(await page.getByRole('button',{name:'Hướng dẫn & hỗ trợ',exact:true}).count(),0);
  assert.equal(await page.locator('a[href*="github.com"]').count(),0);
  assert.equal(await page.locator('.feature-feedback-form,select[name="price_status"]').count(), 0);
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
  await screenshot({ path: "work/dashboard-desktop.png", fullPage: true });
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
    await page.locator('.catalog-picker-detail').click();
    await page.getByRole('button',{name:'Dùng nội dung tour',exact:true}).click();
    assert.equal(await page.locator('input[name="price"]').inputValue(),price);
    for (const name of ['departure','capacity','reserved'])
      assert.equal(await page.locator(`input[name="${name}"]`).inputValue(),'');
    assert.equal(await page.locator('textarea[name="itinerary"]').inputValue(),'');
    assert.equal(await page.locator('input[name="published"]').isChecked(),false);
    assert.ok((await page.locator('textarea[name="description"]').inputValue()).includes('https://dulichenvietcs.netlify.app/'));
    await page.getByRole('button',{name:'Hủy',exact:true}).click();
  }
  await page.getByRole('button',{name:'Danh mục Én Việt',exact:true}).click();
  await page.getByRole('button',{name:'Dùng EVG-TQ01',exact:true}).click();
  assert.equal(await page.locator('input[name="price"]').inputValue(),'28990000');
  await page.getByRole('button',{name:'Hủy',exact:true}).click();
  await page.getByRole('button',{name:'Tạo tour',exact:true}).click();
  for(const name of ['title','destination','departure','duration','price','capacity','reserved'])
    await page.locator(`input[name="${name}"]`).fill(String(qaTour[name]));
  await page.locator('textarea[name="description"]').fill(qaTour.description);
  await page.locator('textarea[name="itinerary"]').fill(qaTour.itinerary);
  await page.locator('input[name="published"]').check();
  await page.getByRole('button',{name:'Lưu hành trình',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('button',{name:qaTour.title,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Báo giá Excel',exact:true}).waitFor();
  assert.equal(await page.getByRole('dialog').getByRole('button',{name:'Yêu cầu tư vấn',exact:true}).count(),0);
  await page.getByRole('dialog').getByRole('button',{name:'Sửa tour',exact:true}).click();
  await page.getByRole('heading',{name:'Cập nhật hành trình',exact:true}).waitFor();
  assert.equal(await page.locator('input[name="title"]').inputValue(),qaTour.title);
  await page.getByRole('button',{name:'Hủy',exact:true}).click();
  await page
    .getByRole("button", { name: "Đổi số chỗ", exact: true })
    .click();
  await page.getByLabel("Khách đã giữ chỗ").fill("24");
  await page
    .getByRole("button", { name: "Lưu số khách", exact: true })
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
  // The open detail must follow the shared source if an operator withdraws a tour.
  const beforeWithdrawal = (await workspace()).tours.find((tour) => tour.title === qaTour.title);
  const withdraw = await context.request.put(base + "/api/tours/" + beforeWithdrawal.id, {
    headers: { "X-TaskHub": "1" },
    data: { ...beforeWithdrawal, published: false },
  });
  assert.equal(withdraw.status(), 200);
  await page.getByText("Tour đã ngừng công khai", { exact: true }).waitFor({ timeout: 20000 });
  assert.equal(await page.getByRole("button", { name: "Yêu cầu tư vấn", exact: true }).count(), 0);
  const withdrawn = (await workspace()).tours.find((tour) => tour.id === beforeWithdrawal.id);
  const republish = await context.request.put(base + "/api/tours/" + withdrawn.id, {
    headers: { "X-TaskHub": "1" },
    data: { ...withdrawn, published: true },
  });
  assert.equal(republish.status(), 200);
  await page
    .getByRole("button", { name: "Yêu cầu tư vấn", exact: true })
    .click({ timeout: 20000 });
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
  await page.getByLabel("Tour liên quan", { exact: true }).selectOption({ label: qaTour.title });
  await page
    .getByLabel("Tên người phụ trách", { exact: true })
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
  await page.getByRole("button", { name: "Sửa Công việc kiểm thử UI", exact: true }).click();
  await page.getByRole("heading", { name: "Cập nhật công việc", exact: true }).waitFor();
  await page.getByLabel("Công việc", { exact: true }).fill("Công việc kiểm thử UI đã cập nhật");
  await page.getByLabel("Tên người phụ trách", { exact: true }).fill("Người phụ trách đã đổi");
  await page.getByLabel("Hạn hoàn thành", { exact: true }).fill("2026-12-19");
  await page.getByLabel("Ưu tiên", { exact: true }).selectOption("high");
  await page.getByRole("button", { name: "Lưu công việc", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Sửa Công việc kiểm thử UI đã cập nhật", exact: true }).waitFor();
  const updatedTask = (await workspace()).tasks.find((task) => task.title === "Công việc kiểm thử UI đã cập nhật");
  assert.equal(updatedTask.assignee, "Người phụ trách đã đổi");
  assert.equal(updatedTask.due, "2026-12-19");
  assert.equal(updatedTask.priority, "high");
  assert.equal(updatedTask.status, "done", "Editing task details preserves its completed status");
  await page.getByLabel("Lọc hạn và ưu tiên", { exact: true }).selectOption("high");
  assert.equal(await page.locator(".task-card").count(), 1);
  await page.getByLabel("Lọc hạn và ưu tiên", { exact: true }).selectOption("overdue");
  assert.equal(await page.locator(".task-card").count(), 0, "Completed tasks are excluded from overdue work");
  await page.getByLabel("Lọc hạn và ưu tiên", { exact: true }).selectOption("all");
  await page.getByRole("button", { name: "Giao công việc", exact: true }).click();
  await page.getByLabel("Công việc", { exact: true }).fill("Công việc kiểm thử để xóa");
  await page.getByLabel("Tour liên quan", { exact: true }).selectOption({ label: qaTour.title });
  await page.getByLabel("Tên người phụ trách", { exact: true }).fill("Người kiểm thử xóa");
  await page.getByLabel("Hạn hoàn thành", { exact: true }).fill(qaTour.departure);
  await page.getByRole("dialog").getByRole("button", { name: "Giao công việc", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Sửa Công việc kiểm thử để xóa", exact: true }).click();
  await page.getByRole("button", { name: "Xóa công việc", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận xóa công việc", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal((await workspace()).tasks.some((task) => task.title === "Công việc kiểm thử để xóa"), false);
  await screenshot({ path: "work/tasks-desktop.png", fullPage: true });
  console.log("Tasks passed: create/status, edit title/assignee/due, and confirmed deletion");
  await page.getByRole('button',{name:'Ghép tour B2B',exact:true}).click();
  await page.getByRole('button',{name:'Tạo phiếu ghép',exact:true}).first().click();
  await page.getByLabel('Tour ghép',{exact:true}).selectOption({index:1});
  await page.getByLabel('Tên đối tác',{exact:true}).fill('Đối tác kiểm thử UI');
  await page.getByLabel('Số khách ghép',{exact:true}).fill('3');
  await page.getByLabel('Giá thỏa thuận / khách (VND)',{exact:true}).fill('100000');
  await page.getByRole('dialog').getByRole('button',{name:'Tạo phiếu ghép',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Xác nhận ghép',exact:true}).click();
  await page.locator('.pool-card').getByText('Đã xác nhận',{exact:true}).waitFor();
  for(const amount of ['150000','0']) {
    await page.getByRole('button',{name:'Ghi nhận thu',exact:true}).click();
    await page.getByLabel('Tổng tiền đã ghi nhận thu (VND)',{exact:true}).fill(amount);
    await page.getByRole('button',{name:'Lưu đối soát',exact:true}).click();
    await page.getByRole('dialog').waitFor({state:'hidden'});
  }
  await page.getByRole('button',{name:'Lịch sử phiếu',exact:true}).click();
  const historyDialog=page.getByRole('dialog');
  await historyDialog.getByRole('heading',{name:'Lịch sử phiếu ghép',exact:true}).waitFor();
  assert.equal(await historyDialog.getByRole('list',{name:'Các thay đổi của phiếu ghép',exact:true}).locator('li').count(),4);
  await historyDialog.getByText('Xác nhận giữ chỗ',{exact:true}).waitFor();
  await historyDialog.getByText('Điều chỉnh tổng đã thu',{exact:true}).first().waitFor();
  await noOverflow('B2B history');
  await screenshot({path:'work/pooling-history-mobile.png',fullPage:true});
  await historyDialog.getByRole('button',{name:'Đóng',exact:true}).click();
  await page.setViewportSize({width:1440,height:1050});
  await screenshot({path:'work/pooling-desktop.png',fullPage:true});
  await noOverflow('B2B');
  await screenshot({path:'work/pooling-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1050});
  await page.getByRole('button',{name:'Hủy phiếu',exact:true}).click();
  await page.getByRole('button',{name:'Xác nhận hủy phiếu',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Lịch sử phiếu',exact:true}).click();
  await page.getByRole('dialog').getByText('Hủy phiếu',{exact:true}).waitFor();
  assert.equal(await page.getByRole('dialog').getByRole('list',{name:'Các thay đổi của phiếu ghép',exact:true}).locator('li').count(),5);
  await page.getByRole('dialog').getByRole('button',{name:'Đóng',exact:true}).click();
  console.log('B2B UI passed: create, seat confirmation, payment reconciliation and cancellation');
  assert.equal(await page.getByRole('button',{name:'Phản hồi MVP',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Gửi đánh giá',exact:true}).count(),0);
  assert.equal(await page.locator('.feature-feedback-form,select[name="price_status"]').count(),0);
  await page.getByRole('button',{name:'Tổng quan',exact:true}).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow('Dashboard after survey removal');
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
  await screenshot({ path: "work/dashboard-mobile.png", fullPage: true });
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
  await screenshot({ path: "work/portal-mobile.png", fullPage: true });
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
    await review.getByRole('heading',{name:'Tổng quan',exact:true}).waitFor();
    await review.locator('.profile').getByText('Người đánh giá · chỉ xem',{exact:true}).waitFor();
    assert.equal(await review.locator('.app-main > .workspace-notice,.workspace-switch,.welcome-banner').count(),0);
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
    assert.equal(await review.getByRole('button',{name:/^Sửa /}).count(),0);
    assert.equal(await review.getByRole('button',{name:'Xóa công việc',exact:true}).count(),0);
    assert.equal(await review.getByRole('button',{name:'Phản hồi MVP',exact:true}).count(),0);
    assert.equal(await review.getByRole('button',{name:'Hướng dẫn & hỗ trợ',exact:true}).count(),0);
    await review.getByRole('button',{name:'Tài khoản & nhóm',exact:true}).click();
    await review.getByRole('link',{name:'Nhật ký thao tác CSV',exact:true}).waitFor();
    assert.equal(await review.getByRole('link',{name:'Nhật ký thao tác CSV',exact:true}).getAttribute('href'),'/api/export/events');
    await review.screenshot({
      path: "work/reviewer-desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    await reviewerContext.close();
    assert.deepEqual(errors, []);
    console.log(
      "Reviewer UI passed: protected interaction export in account settings; survey/help menus and tour/task writes unavailable.",
    );
  }
  await page.setViewportSize({width:1440,height:1050});
  await page.getByRole('button',{name:'Về điều hành',exact:true}).click();
  await page.getByRole('button',{name:'Quản lý tour',exact:true}).click();
  await page.getByRole('button',{name:qaTour.title,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Sửa tour',exact:true}).click();
  await page.getByRole('button',{name:'Xóa tour',exact:true}).click();
  await page.getByRole('button',{name:'Giữ lại tour',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Xác nhận xóa tour',exact:true}).count(),0);
  await page.getByRole('button',{name:'Xóa tour',exact:true}).click();
  await page.getByRole('button',{name:'Xác nhận xóa tour',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('heading',{name:'Chưa có hành trình',exact:true}).waitFor();
  await page.getByRole('button',{name:'Nhập Excel',exact:true}).click();
  const imported={...qaTour,title:'Excel UI QA'};
  await page.getByLabel('Tệp tour Excel hoặc CSV').setInputFiles({name:'qa-tour.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:xlsxFixture([importColumns,importColumns.map(k=>imported[k])])});
  await page.getByText('1 / 1 dòng hợp lệ',{exact:true}).waitFor();
  let releaseImport;
  const importGate=new Promise(resolve=>{releaseImport=resolve;});
  await page.route('**/api/tours/import',async route=>{
    if(route.request().postDataJSON()?.import_id)await importGate;
    await route.continue();
  });
  try {
    await page.getByRole('button',{name:'Nhập 1 tour',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('[role="dialog"]')?.getAttribute('aria-busy')==='true');
    for(const close of await page.getByRole('dialog').getByRole('button',{name:'Đóng',exact:true}).all())assert.ok(await close.isDisabled());
    await page.keyboard.press('Escape');
    await page.locator('.overlay').click({position:{x:2,y:2}});
    assert.ok(await page.getByRole('dialog').isVisible(),'Pending import cannot be closed by Escape or backdrop');
  } finally { releaseImport(); }
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.unroute('**/api/tours/import');
  await page.getByRole('button',{name:'Excel UI QA',exact:true}).waitFor();
  await page.locator('.tour-card').getByText('Bản nháp',{exact:true}).waitFor();
  console.log('XLSX browser import passed; new tour stays unpublished');
  let loggedClick=false;
  for(let attempt=0;attempt<12;attempt++) {
    const loggedWorkspace=await (await context.request.get(base+'/api/workspace')).json();
    loggedClick=loggedWorkspace.activity.some(event=>event.action==='ui_click');
    if(loggedClick)break;
    await page.waitForTimeout(300);
  }
  assert.ok(loggedClick,'Consented participant button/menu clicks must reach the server after survey removal');
  assert.deepEqual(errors, []);
  console.log('Consented participant UI clicks were saved; no browser errors');
  console.log(
    "UI PASS: signup, live tour withdrawal/recovery, inquiry, task CRUD/status, B2B audit, retired survey absence, raw click logs and XLSX import; desktop/mobile no overflow; no page errors.",
  );
} catch (e) {
  await screenshot({ path: "work/ui-failure.png", fullPage: true });
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
