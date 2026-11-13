import { workspaceAccess } from "./access.mjs";

export const quoteStatuses = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Cần sửa",
};

const fail = (message) => {
  throw Object.assign(Error(message), { status: 400 });
};
function text(value, label, maximum, required = false) {
  if (typeof value !== "string" || value.length > maximum)
    fail(`${label} không hợp lệ (tối đa ${maximum} ký tự).`);
  const result = value.trim();
  if (required && !result) fail(`Nhập ${label.toLocaleLowerCase("vi")}.`);
  return result;
}
function integer(value, label, minimum, maximum) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum)
    fail(`${label} phải là số nguyên từ ${minimum} đến ${maximum}.`);
  return value;
}
function calendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    fail("Chọn ngày hết hạn báo giá hợp lệ.");
  const parsed = new Date(value + "T00:00:00Z");
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    fail("Ngày hết hạn báo giá không tồn tại.");
  return value;
}

export function quoteAccess(user) {
  const access = workspaceAccess(user);
  return {
    canRead: access.canReadInquiries,
    canEdit: access.canEditInquiries,
    canApprove: access.canApproveQuotes,
    canApproveOwn: access.canManageTeam,
  };
}

export function quoteCapabilities(user, quote) {
  const access = quoteAccess(user);
  const editable = quote.status === "draft" || quote.status === "rejected";
  const approval = access.canApprove && quote.status === "pending" &&
    (access.canApproveOwn || quote.created_by !== user.id);
  return {
    canEdit: access.canEdit && editable,
    canSubmit: access.canEdit && editable,
    canWithdraw: access.canEdit && quote.status === "pending",
    canApprove: approval,
    canReject: approval,
    canRevise: access.canEdit && quote.status === "approved",
    canExport: access.canRead && quote.status === "approved",
  };
}

export function quoteTotals(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("Dữ liệu tính báo giá không hợp lệ.");
  const people = integer(input.people, "Số khách", 1, 1000);
  const unitPrice = integer(input.unit_price, "Giá một khách", 0, 1000000000);
  const subtotal = people * unitPrice;
  const discount = integer(input.discount_amount ?? 0, "Giảm giá", 0, subtotal);
  return { subtotal, discount_amount: discount, total: subtotal - discount };
}

// Only explicit terms are accepted. A tour snapshot is always supplied by the server.
export function quoteInput(input, fallbackUnitPrice) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("Dữ liệu báo giá không hợp lệ.");
  const recipientEmail = text(input.recipient_email ?? "", "Email người nhận", 254);
  if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))
    fail("Email người nhận không hợp lệ.");
  const result = {
    tour_id: text(input.tour_id, "Tour", 100, true),
    recipient_name: text(input.recipient_name, "Tên người nhận", 120, true),
    recipient_email: recipientEmail,
    people: input.people,
    unit_price: input.unit_price ?? fallbackUnitPrice,
    discount_amount: input.discount_amount ?? 0,
    valid_until: calendarDate(input.valid_until),
    notes: text(input.notes ?? "", "Ghi chú", 2000),
  };
  quoteTotals(result);
  return result;
}

// Used by both Excel and the print view; never reads live tour data after approval.
export function quoteRows(quote) {
  const p = quote.payload;
  return [
    ["Mã báo giá", quote.id],
    ["Trạng thái", quoteStatuses[quote.status] || quote.status],
    ["Phiên bản", quote.version],
    ["Người nhận", p.recipient_name],
    ["Email người nhận", p.recipient_email],
    ["Tên tour", p.tour.title],
    ["Điểm đến", p.tour.destination],
    ["Khởi hành", p.tour.departure],
    ["Thời lượng", p.tour.duration],
    ["Số khách", p.people],
    ["Giá một khách (VND)", p.unit_price],
    ["Tạm tính (VND)", quote.subtotal],
    ["Giảm giá (VND)", p.discount_amount],
    ["Tổng báo giá (VND)", quote.total],
    ["Có hiệu lực đến", p.valid_until],
    ["Người tạo", quote.created_by_name || "Tài khoản đã xóa"],
    ["Người duyệt", quote.reviewed_by_name || ""],
    ["Thời điểm duyệt", quote.reviewed_at || ""],
    ["Mô tả tour", p.tour.description],
    ["Lịch trình", p.tour.itinerary],
    ["Ghi chú", p.notes],
    ["Lưu ý", "Báo giá không giữ chỗ, không xác nhận booking hoặc thanh toán. Cần xác nhận dịch vụ và số chỗ trước khi đặt tour."],
  ];
}
