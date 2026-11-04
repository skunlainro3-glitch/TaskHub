// Automated QA only; isolated workspaces are deleted and are not tester evidence.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { qaTour } from './fixtures.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:3015';
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});
const owner=await browser.newContext({viewport:{width:1440,height:1000}}),staff=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await owner.newPage(),member=await staff.newPage(),errors=[];
for(const p of [page,member])p.on('pageerror',e=>errors.push(e.message));
mkdirSync('work/cp4-20261027',{recursive:true});
async function api(context,path,method='GET',data) {
  const r=await context.request.fetch(base+'/api'+path,{method,headers:{'X-TaskHub':'1'},...(data?{data}:{})});
  const body=await r.json();assert.ok(r.ok(),path+': '+JSON.stringify(body));return body;
}
async function nav(tab,label) {
  const b=tab.locator('aside nav').getByRole('button',{name:label,exact:true});
  if(!await b.isVisible())await tab.getByRole('button',{name:'Mở menu',exact:true}).click();
  await b.click();await tab.getByRole('heading',{name:label,exact:true}).waitFor();
}
async function layout(tab,label) {
  for(const width of [320,390,768,1440]) {
    await tab.setViewportSize({width,height:1000});
    assert.ok(await tab.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' overflows '+width);
    if(width===390||width===1440)await tab.screenshot({path:`work/cp4-20261027/${label}-${width}.png`,fullPage:true,animations:'disabled'});
  }
}
let created=false;
try {
  const stamp=Date.now(),password='CP4-UI-automated-only!';
  await api(owner,'/register','POST',{name:'CP4 QA owner',email:`cp4-ui-${stamp}@example.test`,password,role:'operations',company_size:'10to30',consent:true});created=true;
  const tour=await api(owner,'/tours','POST',{...qaTour,reserved:0});
  const deal=await api(owner,'/pooling','POST',{tour_id:tour.id,partner:'QA partner only',seats:2,unit_price:100,note:'Automated only'});
  let d=await api(owner,'/workspace');
  await api(owner,'/pooling/'+deal.id,'PATCH',{action:'confirm',version:1,tour_version:d.tours[0].version});
  const email=`cp4-ui-member-${stamp}@example.test`;
  const invite=await api(owner,'/team/invites','POST',{email,permission:'editor',department:'sales'});
  const accepted=await api(staff,'/team/invites/accept','POST',{token:new URL(invite.url).searchParams.get('invite'),email,name:'CP4 QA member',password,consent:true});
  const memberId=accepted.user.id;
  await page.goto(base+'/app');await page.getByRole('heading',{name:'Tổng quan',exact:true}).waitFor();
  await nav(page,'Quy trình vận hành');await page.locator('.workflow-steps > li').last().waitFor();assert.equal(await page.locator('.workflow-steps > li').count(),5);await layout(page,'workflow');
  await nav(page,'Giá trị & doanh thu');await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).waitFor();
  await page.getByLabel('Số thao tác mỗi tháng',{exact:true}).fill('120');
  await page.getByLabel('Số phút trước khi áp dụng / thao tác',{exact:true}).fill('15');
  await page.getByLabel('Số phút sau khi áp dụng / thao tác',{exact:true}).fill('5');
  await page.getByLabel('Chi phí nhân sự / giờ (VND)',{exact:true}).fill('60000');
  await page.getByLabel('Phí phần mềm dự kiến / tháng (VND)',{exact:true}).fill('200000');
  assert.ok((await page.locator('.planning-metrics').first().innerText()).includes('20 giờ'));
  await page.getByRole('button',{name:'Thêm gói dự kiến',exact:true}).click();
  await page.getByLabel('Tên gói 1',{exact:true}).fill('QA only');await page.getByLabel('Giá tháng gói 1 (VND)',{exact:true}).fill('200000');
  await page.getByLabel('Số doanh nghiệp dự kiến gói 1',{exact:true}).fill('3');
  await page.getByLabel('Quản lý tour/lịch/chỗ',{exact:true}).check();
  await page.getByRole('button',{name:'Thêm dòng thu một lần',exact:true}).click();
  await layout(page,'planning');
  // Empty named rows remain incomplete rather than becoming zero revenue.
  await page.getByRole('button',{name:'Bỏ dòng thu 1',exact:true}).click();
  const saved=page.waitForResponse(r=>r.url().endsWith('/api/planning')&&r.request().method()==='PUT');
  await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();assert.equal((await saved).status(),200);
  const p=await api(owner,'/planning');assert.equal(p.plan.value.monthlyTasks,120);assert.equal(p.plan.plans[0].customers,3);
  await api(owner,'/planning','PUT',{plan:{...p.plan,notes:'Other QA edit'},version:p.version});
  await page.getByLabel('Nguồn số liệu, thời điểm đo hoặc giả định của nhóm',{exact:true}).fill('Unsaved QA');
  const conflict=page.waitForResponse(r=>r.url().endsWith('/api/planning')&&r.request().method()==='PUT');
  await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();assert.equal((await conflict).status(),409);
  assert.equal(await page.getByLabel('Nguồn số liệu, thời điểm đo hoặc giả định của nhóm',{exact:true}).inputValue(),'Unsaved QA');
  page.once('dialog',d=>d.dismiss());await page.locator('aside nav').getByRole('button',{name:'Quản lý tour',exact:true}).click();
  assert.ok(await page.getByRole('heading',{name:'Giá trị & doanh thu',exact:true}).isVisible());
  const refreshed=page.waitForResponse(r=>r.url().endsWith('/api/planning')&&r.request().method()==='GET');
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Tải bản đã lưu',exact:true}).click();
  assert.equal((await refreshed).status(),200);await page.getByText(/^Bản lưu lúc /).waitFor();
  await nav(page,'Tài khoản & nhóm');await layout(page,'accounts');
  const inviteControls = await Promise.all(['Email nhân viên','Vai trò nhân viên','Quyền truy cập'].map(name=>page.getByLabel(name,{exact:true}).boundingBox()));
  assert.ok(inviteControls.every(Boolean));
  assert.ok(Math.max(...inviteControls.map(b=>b.y))-Math.min(...inviteControls.map(b=>b.y))<=1,'Invite input/select controls must align on desktop');
  const inviteButton = await page.getByRole('button',{name:'Tạo lời mời',exact:true}).boundingBox();
  assert.ok(Math.abs(inviteButton.y-inviteControls[0].y)<=2,'Invite button must align with the inputs');
  await member.goto(base+'/app');await member.locator('.profile').getByText('Kinh doanh',{exact:true}).waitFor();
  assert.equal(await member.locator('aside nav').getByRole('button',{name:'Ghép tour B2B',exact:true}).count(),0);
  assert.equal(await member.locator('aside nav').getByRole('button',{name:'Giá trị & doanh thu',exact:true}).count(),0);
  await nav(member,'Quản lý tour');assert.equal(await member.getByRole('button',{name:'Tạo tour',exact:true}).count(),0);
  await api(owner,'/team/members/'+memberId,'PATCH',{department:'accounting'});
  await member.locator('.profile').getByText('Kế toán',{exact:true}).waitFor();
  assert.equal(await member.locator('aside nav').getByRole('button',{name:'Yêu cầu tư vấn',exact:true}).count(),0);
  await nav(member,'Ghép tour B2B');await member.getByRole('button',{name:'Ghi nhận thu',exact:true}).waitFor();
  assert.equal(await member.getByRole('button',{name:'Tạo phiếu ghép',exact:true}).count(),0);
  assert.equal(await member.getByRole('button',{name:'Hủy phiếu',exact:true}).count(),0);
  await api(owner,'/team/members/'+memberId,'PATCH',{department:'operations'});
  await member.locator('.profile').getByText('Điều hành',{exact:true}).waitFor();
  assert.equal(await member.getByRole('button',{name:'Ghi nhận thu',exact:true}).count(),0);
  await api(owner,'/team/members/'+memberId,'PATCH',{department:'manager',permission:'viewer'});
  await member.locator('.profile').getByText('Quản lý · chỉ xem',{exact:true}).waitFor();
  await nav(member,'Giá trị & doanh thu');await member.getByLabel('Số thao tác mỗi tháng',{exact:true}).waitFor();
  assert.ok(await member.getByLabel('Số thao tác mỗi tháng',{exact:true}).isDisabled());
  assert.equal(await member.getByRole('button',{name:'Lưu bản nháp',exact:true}).count(),0);
  await staff.setOffline(true);await member.getByText('Mất kết nối',{exact:true}).waitFor();
  await staff.setOffline(false);await member.locator('.sync-status.fresh').waitFor();
  assert.deepEqual(errors,[]);
  console.log('CP4 UI passed: workflow; role-specific navigation/actions; calculations/save/conflict/draft guard; offline recovery; 320/390/768/1440px layouts.');
} finally {
  if(created){const removed=await owner.request.delete(base+'/api/account',{headers:{'X-TaskHub':'1'}});assert.equal(removed.status(),200,'QA workspace cleanup');}
  await browser.close();
}
