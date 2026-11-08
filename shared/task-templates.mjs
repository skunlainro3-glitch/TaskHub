const fail = (message) => { throw Object.assign(Error(message), { status: 400 }); };

export function taskTemplateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Bộ mẫu không hợp lệ.');
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 100)
    fail('Tên bộ mẫu cần từ 1 đến 100 ký tự.');
  if (!Array.isArray(input.entries) || input.entries.length < 1 || input.entries.length > 20)
    fail('Mỗi bộ mẫu cần từ 1 đến 20 công việc.');
  const entries = input.entries.map((entry, index) => {
    if (!entry || typeof entry.title !== 'string' || !entry.title.trim() || entry.title.trim().length > 160)
      fail('Công việc ' + (index + 1) + ' cần nội dung tối đa 160 ký tự.');
    if (!Number.isSafeInteger(entry.offset_days) || Math.abs(entry.offset_days) > 365)
      fail('Mốc ngày công việc ' + (index + 1) + ' phải nằm từ -365 đến 365 ngày.');
    if (!['normal', 'high'].includes(entry.priority)) fail('Chọn mức ưu tiên hợp lệ.');
    const assignee_id = entry.assignee_id || null;
    if (assignee_id !== null && (typeof assignee_id !== 'string' || assignee_id.length > 100))
      fail('Người phụ trách không hợp lệ.');
    return { title: entry.title.trim(), offset_days: entry.offset_days, priority: entry.priority, assignee_id };
  });
  return { name: input.name.trim(), entries };
}

export function taskDueDate(departure, offset) {
  if (!Number.isSafeInteger(offset) || Math.abs(offset) > 365) fail('Mốc ngày phải nằm từ -365 đến 365 ngày.');
  if (typeof departure !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(departure)) fail('Ngày khởi hành không hợp lệ.');
  const date = new Date(departure + 'T12:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== departure)
    fail('Ngày khởi hành không hợp lệ.');
  date.setUTCDate(date.getUTCDate() + offset);
  const result = date.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || result < '2000-01-01' || result > '2100-12-31')
    fail('Hạn công việc nằm ngoài khoảng năm 2000–2100.');
  return result;
}
