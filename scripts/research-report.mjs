// Offline, aggregate-only analysis of TaskHub's protected CSV exports.
// Does not create participants, choose a selling price or decide Iterate/Persevere.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const requiredActions = ['tour_updated', 'portal_viewed', 'task_created', 'task_status_changed'];
const feedbackFields = ['email','role','company_size','consent_at','consent_version','portal','operations','sync','ease','intent','price','liked','disliked','created'];
const eventFields = ['email','action','created'];
const qaEmail = /@(?:example\.test|example\.com|example\.invalid)$/i;
const emailKey = value => String(value || '').trim().toLowerCase();
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validTime = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value.slice(0,10);
const distribution = (rows, key) => Object.fromEntries([...new Set(rows.map(r => r[key]))].sort().map(k => [k, rows.filter(r => r[key] === k).length]));
const median = sorted => sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2 : null;

export function parseCsv(input) {
  const text = String(input).replace(/^\uFEFF/, '');
  // The deployed exporter emits this sentinel when there are no rows.
  if (!text.trim() || text.trim() === 'No data') return { headers: [], rows: [] };
  const records = []; let row = [], value = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else value += char;
      continue;
    }
    if (char === '"') {
      if (value || closed) throw Error('CSV có dấu nháy không hợp lệ.');
      quoted = true;
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(value); value = ''; closed = false;
      if (char !== ',') {
        if (char === '\r' && text[i + 1] === '\n') i++;
        if (row.some(v => v !== '')) records.push(row);
        row = [];
      }
    } else {
      if (closed) throw Error('CSV có ký tự thừa sau dấu nháy đóng.');
      value += char;
    }
  }
  if (quoted) throw Error('CSV bị cắt hoặc thiếu dấu nháy đóng.');
  if (value || row.length || closed) { row.push(value); records.push(row); }
  if (!records.length) return { headers: [], rows: [] };
  const headers = records.shift();
  if (headers.some(h => !h) || new Set(headers).size !== headers.length) throw Error('Tiêu đề CSV trống hoặc trùng.');
  return { headers, rows: records.map((r, i) => {
    if (r.length !== headers.length) throw Error(`CSV sai số cột tại bản ghi ${i + 2}.`);
    return Object.fromEntries(headers.map((h, index) => [h, r[index]]));
  }) };
}

function checkHeaders(table, required, label) {
  if (table.headers.length && required.some(key => !table.headers.includes(key)))
    throw Error(`Sai loại tệp ${label} hoặc thiếu cột bắt buộc.`);
}

export function summarize(feedbackCsv, eventsCsv) {
  const feedback = parseCsv(feedbackCsv), events = parseCsv(eventsCsv);
  checkHeaders(feedback, feedbackFields, 'feedback'); checkHeaders(events, eventFields, 'interactions');
  const excluded = { invalid: 0, qa: 0, system: 0, duplicateEmail: 0 };
  let incompleteFlow = 0;
  // Select the most recent validly timestamped row before validation: an older
  // positive answer must never replace a newer incomplete or negative one.
  const latest = new Map();
  for (const r of feedback.rows) {
    const email = emailKey(r.email);
    if (!validEmail(email) || !validTime(r.created)) { excluded.invalid++; continue; }
    if (qaEmail.test(email)) { excluded.qa++; continue; }
    if (['admin','reviewer'].includes(r.role)) { excluded.system++; continue; }
    if (latest.has(email)) excluded.duplicateEmail++;
    if (!latest.has(email) || Date.parse(r.created) >= Date.parse(latest.get(email).created)) latest.set(email, r);
  }
  const eventIndex = new Map(); let invalidEvents = 0;
  for (const event of events.rows) {
    const email = emailKey(event.email);
    if (!validEmail(email) || !validTime(event.created)) { invalidEvents++; continue; }
    if (!eventIndex.has(email)) eventIndex.set(email, []);
    eventIndex.get(email).push(event);
  }
  const valid = [], matched = [];
  for (const [email, r] of latest) {
    const scores = ['portal','operations','sync','ease'];
    const validNumber = (value,min,max) => String(value).trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
    if (!scores.every(key => validNumber(r[key],1,5)) || !validNumber(r.price,0,100000000)
      || !['yes','maybe','no'].includes(r.intent) || !validTime(r.consent_at)
      || Date.parse(r.consent_at) > Date.parse(r.created) || !r.consent_version
      || !['operations','sales','manager','other'].includes(r.role)
      || !['under10','10to30','31to50','over50','other'].includes(r.company_size)) {
      excluded.invalid++; continue;
    }
    const response = {...r, ...Object.fromEntries([...scores,'price'].map(key => [key, Number(r[key])]))};
    valid.push(response);
    const actions = new Set((eventIndex.get(email) || [])
      .filter(e => Date.parse(e.created) >= Date.parse(r.consent_at) && Date.parse(e.created) <= Date.parse(r.created))
      .map(e => e.action));
    if (requiredActions.every(action => actions.has(action))) matched.push(response);
    else incompleteFlow++;
  }
  const prices = valid.map(r => r.price).sort((a,b) => a-b);
  const scoreSummary = rows => Object.fromEntries(['portal','operations','sync','ease'].map(key => [key, {
    n: rows.length,
    mean: rows.length ? Number((rows.reduce((sum,r) => sum + r[key],0) / rows.length).toFixed(2)) : null,
    distribution: Object.fromEntries([1,2,3,4,5].map(n => [n, rows.filter(r => r[key] === n).length])),
    rated4or5: rows.filter(r => r[key] >= 4).length,
  }]));
  return {
    feedbackRows: feedback.rows.length, interactionRows: events.rows.length,
    validResponses: valid.length, matchedResponses: matched.length, incompleteFlow, excluded, invalidEvents,
    minimum20Records: valid.length >= 20,
    independentPeopleVerified: false,
    roles: distribution(valid,'role'), companySizes: distribution(valid,'company_size'),
    targetSegmentRecords: valid.filter(r => ['operations','sales','manager'].includes(r.role) && ['10to30','31to50'].includes(r.company_size)).length,
    managerRecords: valid.filter(r => r.role === 'manager').length,
    scores: scoreSummary(valid), matchedScores: scoreSummary(matched), intent: distribution(valid,'intent'),
    willingnessToPay: { n: prices.length, zero: prices.filter(n => n === 0).length, min: prices[0] ?? null, median: median(prices), max: prices.at(-1) ?? null },
    openResponses: { liked: valid.filter(r => r.liked.trim()).length, disliked: valid.filter(r => r.disliked.trim()).length },
    limitations: [
      'Email tự nhập; số bản ghi không chứng minh số cá nhân độc lập. Nhóm phải đối chiếu người thử thật.',
      'Đủ bốn loại thao tác trước phản hồi không chứng minh thứ tự sử dụng, mức hiểu tính năng hay mẫu đại diện.',
      'Thống kê chính giữ tất cả phản hồi hợp lệ; nhóm đủ log được báo riêng. Thiếu log không chứng minh người đó chưa xem demo, và không tự loại tư cách tester theo PDF.',
      'Mức sẵn sàng trả là mô tả mẫu, không phải giá bán, nghiên cứu Van Westendorp hoặc cam kết thanh toán.',
      'Không tự quyết định Iterate/Persevere; ý kiến mở cần nhóm đọc trong bản gốc có giới hạn truy cập.',
    ],
  };
}

export function reportMarkdown(summary) {
  const display = value => value === null ? 'Chưa có dữ liệu' : new Intl.NumberFormat('vi-VN').format(value);
  const names = {portal:'Cổng thông tin tour',operations:'Công việc theo tour',sync:'Lịch và số chỗ dùng chung',ease:'Độ dễ thao tác'};
  const scoreRows = scores => Object.entries(scores).map(([key,s]) => `| ${names[key]} | ${s.n} | ${display(s.mean)} | ${s.n ? s.rated4or5+'/'+s.n : 'Chưa có dữ liệu'} |`).join('\n');
  const table = scores => `| Chỉ tiêu | n | Trung bình / 5 | Chấm 4–5 |\n| --- | ---: | ---: | ---: |\n${scoreRows(scores)}\n`;
  return `# Tổng hợp dữ liệu MVP TaskHub\n\n`
    + `Trạng thái: ${summary.validResponses ? 'Có phản hồi hợp lệ để nhóm đối chiếu người thật và việc xem/dùng MVP.' : 'CHƯA CÓ DỮ LIỆU PHẢN HỒI HỢP LỆ; không có kết quả khảo sát để kết luận.'}\n\n`
    + `- Dòng phản hồi gốc: ${summary.feedbackRows}; dòng tương tác: ${summary.interactionRows}.\n`
    + `- Phản hồi hợp lệ sau kiểm tra/trùng email: ${summary.validResponses}.\n`
    + `- Phản hồi có đủ bốn loại thao tác trước khi gửi: ${summary.matchedResponses}.\n`
    + `- Ngưỡng 20 bản ghi hợp lệ: ${summary.minimum20Records ? 'Đủ số bản ghi; CHƯA xác minh 20 cá nhân.' : 'CHƯA ĐỦ.'}\n`
    + `- Bị loại: không hợp lệ ${summary.excluded.invalid}; QA ${summary.excluded.qa}; hệ thống ${summary.excluded.system}; email trùng ${summary.excluded.duplicateEmail}. Có ${summary.incompleteFlow} phản hồi chưa đủ log; các phản hồi này vẫn nằm trong thống kê chính.\n\n`
    + `## Tính năng — tất cả phản hồi hợp lệ\n\n${table(summary.scores)}\n`
    + `## Đối chiếu riêng — nhóm đủ bốn loại thao tác trước phản hồi\n\n${table(summary.matchedScores)}\n`
    + `Nhóm log là tập con để đối chiếu, không phải điều kiện bắt buộc trong PDF. Không chỉ chọn người hoàn thành thao tác để kết luận toàn bộ mẫu; người gặp khó khăn hoặc xem demo vẫn có thể có phản hồi hợp lệ.\n\n`
    + `## Ý định sử dụng và mức sẵn sàng trả\n\n`
    + `- Có: ${summary.intent.yes || 0}; có thể/cần cải thiện: ${summary.intent.maybe || 0}; không: ${summary.intent.no || 0}.\n`
    + `- Mức trả / doanh nghiệp / tháng: n=${summary.willingnessToPay.n}; trung vị ${display(summary.willingnessToPay.median)}; thấp nhất ${display(summary.willingnessToPay.min)}; cao nhất ${display(summary.willingnessToPay.max)} (VND). Có ${summary.willingnessToPay.zero} mức trả bằng 0.\n`
    + `- Vai trò: ${Object.entries(summary.roles).map(([key,n])=>key+': '+n).join('; ') || 'Chưa có dữ liệu'}.\n`
    + `- Quy mô: ${Object.entries(summary.companySizes).map(([key,n])=>key+': '+n).join('; ') || 'Chưa có dữ liệu'}.\n`
    + `- Thuộc vai trò mục tiêu tại doanh nghiệp 10–50 nhân sự: ${summary.validResponses ? summary.targetSegmentRecords+'/'+summary.validResponses+' bản ghi' : 'Chưa có dữ liệu'}; vai trò quản lý: ${summary.managerRecords}. Đây là thông tin tự khai, không xác minh quyền duyệt ngân sách.\n`
    + `- Có ý kiến mở: thích ${summary.openResponses.liked}; cần sửa ${summary.openResponses.disliked}. Đọc và mã hóa bản gốc riêng; không xuất email hoặc nội dung tự do vào báo cáo này.\n\n`
    + `## Giới hạn và việc nhóm phải xác nhận\n\n${summary.limitations.map(s=>'- '+s).join('\n')}\n`;
}

export function run(args) {
  if (args.length !== 3) throw Error('Dùng: npm run research:report -- <feedback.csv> <interactions.csv> <thu-muc-dau-ra>');
  const [feedbackPath,eventsPath,directory] = args.map(p => resolve(p));
  const output = ['summary.json','summary.md'].map(name => resolve(directory,name));
  if (output.some(path => path === feedbackPath || path === eventsPath)) throw Error('Đầu ra không được ghi đè dữ liệu gốc.');
  const summary = summarize(readFileSync(feedbackPath,'utf8'),readFileSync(eventsPath,'utf8'));
  mkdirSync(dirname(output[0]),{recursive:true});
  writeFileSync(output[0],JSON.stringify(summary,null,2)+'\n');
  writeFileSync(output[1],reportMarkdown(summary));
  console.log(`Đã tổng hợp ${summary.validResponses} phản hồi hợp lệ, trong đó ${summary.matchedResponses} có đủ log. Báo cáo chỉ có số liệu tổng hợp: ${directory}`);
  return summary;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { run(process.argv.slice(2)); }
  catch(error) { console.error(error.message); process.exitCode = 1; }
}
