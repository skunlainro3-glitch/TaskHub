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
async function noPlanningNav(tab) {
  assert.equal(await tab.locator('aside nav').getByRole('button',{name:'Giá trị & doanh thu',exact:true}).count(),0);
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
  await noPlanningNav(page);
  await nav(page,'Quy trình vận hành');await page.locator('.workflow-steps > li').last().waitFor();assert.equal(await page.locator('.workflow-steps > li').count(),6);await page.getByRole('heading',{name:'Soạn và duyệt báo giá',exact:true}).waitFor();await layout(page,'workflow');
  await nav(page,'Tài khoản & nhóm');await layout(page,'accounts');
  const inviteControls = await Promise.all(['Email nhân viên','Vai trò nhân viên','Quyền truy cập'].map(name=>page.getByLabel(name,{exact:true}).boundingBox()));
  assert.ok(inviteControls.every(Boolean));
  assert.ok(Math.max(...inviteControls.map(b=>b.y))-Math.min(...inviteControls.map(b=>b.y))<=1,'Invite input/select controls must align on desktop');
  const inviteButton = await page.getByRole('button',{name:'Tạo lời mời',exact:true}).boundingBox();
  assert.ok(Math.abs(inviteButton.y-inviteControls[0].y)<=2,'Invite button must align with the inputs');
  await member.goto(base+'/app');await member.locator('.profile').getByText('Kinh doanh',{exact:true}).waitFor();
  assert.equal(await member.locator('aside nav').getByRole('button',{name:'Ghép tour B2B',exact:true}).count(),0);
  await noPlanningNav(member);
  await nav(member,'Quản lý tour');assert.equal(await member.getByRole('button',{name:'Tạo tour',exact:true}).count(),0);
  await api(owner,'/team/members/'+memberId,'PATCH',{department:'accounting'});
  await member.locator('.profile').getByText('Kế toán',{exact:true}).waitFor();
  await noPlanningNav(member);
  assert.equal(await member.locator('aside nav').getByRole('button',{name:'Yêu cầu tư vấn',exact:true}).count(),0);
  await nav(member,'Ghép tour B2B');await member.getByRole('button',{name:'Ghi nhận thu',exact:true}).waitFor();
  assert.equal(await member.getByRole('button',{name:'Tạo phiếu ghép',exact:true}).count(),0);
  assert.equal(await member.getByRole('button',{name:'Hủy phiếu',exact:true}).count(),0);
  await api(owner,'/team/members/'+memberId,'PATCH',{department:'operations'});
  await member.locator('.profile').getByText('Điều hành',{exact:true}).waitFor();
  await noPlanningNav(member);
  assert.equal(await member.getByRole('button',{name:'Ghi nhận thu',exact:true}).count(),0);
  await api(owner,'/team/members/'+memberId,'PATCH',{department:'manager',permission:'viewer'});
  await member.locator('.profile').getByText('Quản lý · chỉ xem',{exact:true}).waitFor();
  await noPlanningNav(member);
  await nav(member,'Báo giá');assert.equal(await member.getByRole('button',{name:'Tạo báo giá',exact:true}).count(),0);
  await api(owner,'/team/members/'+memberId,'PATCH',{permission:'editor'});
  await member.locator('.profile').getByText('Quản lý',{exact:true}).waitFor();
  await noPlanningNav(member);
  await nav(member,'Quản lý tour');await nav(member,'Báo giá');
  await member.getByRole('button',{name:'Tạo báo giá',exact:true}).waitFor();
  await staff.setOffline(true);await member.getByText('Mất kết nối',{exact:true}).waitFor();
  await staff.setOffline(false);await member.locator('.sync-status.fresh').waitFor();
  assert.deepEqual(errors,[]);
  console.log('CP4 UI passed: workflow; removed business-planning navigation for owner/staff; role-specific navigation/actions; manager quote permissions; offline recovery; 320/390/768/1440px layouts.');
} finally {
  if(created){const removed=await owner.request.delete(base+'/api/account',{headers:{'X-TaskHub':'1'}});assert.equal(removed.status(),200,'QA workspace cleanup');}
  await browser.close();
}
