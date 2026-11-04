import { workspaceAccess } from "./access.mjs";

const invalid = (message) => {
  throw Object.assign(Error(message), { status: 400 });
};
export function vietnamDay(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
function validDate(value) {
  if (
    typeof value !== "string" ||
    !/^20\d{2}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    invalid("Chọn ngày báo cáo hợp lệ.");
  return value;
}
export function analyticsRange(input = {}, today = vietnamDay()) {
  const start = today.slice(0, 7) + "-01";
  const end = new Date(start + "T00:00:00Z");
  end.setUTCMonth(end.getUTCMonth() + 6);
  end.setUTCDate(0);
  const from = validDate(input.from ?? start),
    to = validDate(input.to ?? end.toISOString().slice(0, 10));
  if (from > to) invalid("Ngày kết thúc phải từ ngày bắt đầu trở đi.");
  const months = [];
  let month = from.slice(0, 7);
  while (month <= to.slice(0, 7)) {
    months.push(month);
    if (months.length > 24) invalid("Chọn tối đa 24 tháng trong một báo cáo.");
    const next = new Date(month + "-01T00:00:00Z");
    next.setUTCMonth(next.getUTCMonth() + 1);
    month = next.toISOString().slice(0, 7);
  }
  return { from, to, months };
}
const sum = (rows, key) => rows.reduce((n, row) => n + key(row), 0);
export function buildAnalytics(data, user, input = {}, today = vietnamDay()) {
  const range = analyticsRange(input, today),
    access = workspaceAccess(user);
  const within = (day) => day >= range.from && day <= range.to;
  const tours = data.tours.filter((t) => within(t.departure));
  const tasks = data.tasks.filter((t) => within(t.due));
  const inquiries = access.canReadInquiries
    ? data.inquiries.filter((i) => within(vietnamDay(i.created)))
    : [];
  const tourIds = new Set(tours.map((t) => t.id));
  const deals = access.canReadPooling
    ? data.pooling.filter((p) => tourIds.has(p.tour_id))
    : [];
  const confirmed = deals.filter((p) => p.status === "confirmed");
  const capacity = sum(tours, (t) => t.capacity),
    reserved = sum(tours, (t) => t.reserved);
  const completed = tasks.filter((t) => t.status === "done").length;
  const months = range.months.map((month) => {
    const scheduled = tours.filter((t) => t.departure.startsWith(month));
    const monthlyDeals = confirmed.filter((p) => p.departure.startsWith(month));
    return {
      month,
      tours: scheduled.length,
      capacity: sum(scheduled, (t) => t.capacity),
      reserved: sum(scheduled, (t) => t.reserved),
      ...(access.canReadPooling
        ? {
            agreed: sum(monthlyDeals, (p) => p.seats * p.unit_price),
            paid: sum(monthlyDeals, (p) => p.paid),
          }
        : {}),
    };
  });
  return {
    range,
    access,
    generated: new Date().toISOString(),
    today,
    simulated: user.workspace === "agency",
    tours: {
      total: tours.length,
      published: tours.filter((t) => t.published).length,
      capacity,
      reserved,
      occupancy: capacity ? reserved / capacity : null,
    },
    tasks: {
      total: tasks.length,
      done: completed,
      doing: tasks.filter((t) => t.status === "doing").length,
      todo: tasks.filter((t) => t.status === "todo").length,
      overdue: tasks.filter((t) => t.status !== "done" && t.due < today).length,
      completion: tasks.length ? completed / tasks.length : null,
    },
    inquiries: access.canReadInquiries
      ? {
          total: inquiries.length,
          new: inquiries.filter((i) => i.status === "new").length,
          contacted: inquiries.filter((i) => i.status === "contacted").length,
          closed: inquiries.filter((i) => i.status === "closed").length,
        }
      : null,
    pooling: access.canReadPooling
      ? {
          confirmed: confirmed.length,
          pending: deals.filter((p) => p.status === "pending").length,
          cancelled: deals.filter((p) => p.status === "cancelled").length,
          agreed: sum(confirmed, (p) => p.seats * p.unit_price),
          paid: sum(confirmed, (p) => p.paid),
          balance: sum(confirmed, (p) => p.seats * p.unit_price - p.paid),
        }
      : null,
    months,
    ledger: access.canReadPooling
      ? deals.map((p) => ({
          partner: p.partner,
          tour: p.tour_title,
          departure: p.departure,
          seats: p.seats,
          status: p.status,
          total: p.seats * p.unit_price,
          paid: p.paid,
          balance:
            p.status === "confirmed" ? p.seats * p.unit_price - p.paid : null,
        }))
      : null,
    tourRows: tours.map((t) => ({
      title: t.title,
      departure: t.departure,
      capacity: t.capacity,
      reserved: t.reserved,
      published: Boolean(t.published),
    })),
  };
}
// Export only aggregates and operational ledger fields, never inquiry contacts.
export function analyticsRows(report) {
  const rows = [
    {
      section: "Phạm vi",
      metric: "Từ ngày",
      value: report.range.from,
      unit: "ngày",
    },
    {
      section: "Phạm vi",
      metric: "Đến ngày",
      value: report.range.to,
      unit: "ngày",
    },
    {
      section: "Phạm vi",
      metric: "Ngày lập",
      value: report.generated,
      unit: "ISO",
    },
  ];
  rows.push({
    section: "Phạm vi",
    metric: "Loại dữ liệu",
    value: report.simulated
      ? "Giả lập phục vụ demo"
      : "Dữ liệu trong không gian, chưa xác minh ngân hàng",
    unit: "",
  });
  const add = (section, metric, value, unit) =>
    rows.push({ section, metric, value: value ?? "", unit });
  add("Tour", "Số tour theo ngày khởi hành", report.tours.total, "tour");
  add("Tour", "Sức chứa", report.tours.capacity, "chỗ");
  add("Tour", "Đã giữ", report.tours.reserved, "chỗ");
  add("Tour", "Tỷ lệ lấp đầy", report.tours.occupancy, "tỷ lệ 0–1");
  add("Công việc", "Tổng theo hạn", report.tasks.total, "việc");
  add("Công việc", "Đã hoàn thành", report.tasks.done, "việc");
  add("Công việc", "Quá hạn chưa xong", report.tasks.overdue, "việc");
  if (report.inquiries)
    for (const [key, label] of [
      ["total", "Tổng"],
      ["new", "Mới"],
      ["contacted", "Đã liên hệ"],
      ["closed", "Đã đóng"],
    ])
      add("Tư vấn", label, report.inquiries[key], "yêu cầu");
  if (report.pooling)
    for (const [key, label] of [
      ["agreed", "Giá trị phiếu xác nhận"],
      ["paid", "Đã ghi nhận thu lũy kế"],
      ["balance", "Còn phải thu"],
    ])
      add("B2B theo lịch khởi hành", label, report.pooling[key], "VND");
  for (const row of report.months) {
    add(row.month, "Số tour", row.tours, "tour");
    add(row.month, "Số khách đã giữ", row.reserved, "chỗ");
  }
  return rows;
}
