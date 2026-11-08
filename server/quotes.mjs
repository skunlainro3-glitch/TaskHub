import { randomUUID } from "node:crypto";
import { quoteAccess, quoteCapabilities, quoteInput, quoteTotals } from "../shared/quotes.mjs";

const fail = (message, status = 400) => {
  throw Object.assign(Error(message), { status });
};
const now = () => new Date().toISOString();
const selectQuote = `SELECT q.*,creator.name AS created_by_name,reviewer.name AS reviewed_by_name
  FROM quotes q LEFT JOIN users creator ON creator.id=q.created_by
  LEFT JOIN users reviewer ON reviewer.id=q.reviewed_by`;
function requireAccess(user, capability) {
  if (!user || !quoteAccess(user)[capability])
    fail("Vai trò hiện tại không được thực hiện thao tác báo giá này.", 403);
}
function versionOf(input) {
  if (!Number.isSafeInteger(input?.version) || input.version < 1)
    fail("Thiếu phiên bản báo giá hợp lệ. Tải lại trước khi sửa.");
  return input.version;
}
function todayVietnam() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function normalized(row, user) {
  const payload = JSON.parse(row.payload);
  const quote = { ...row, payload, subtotal: quoteTotals(payload).subtotal };
  quote.capabilities = quoteCapabilities(user, quote);
  return quote;
}
async function storedQuote(db, user, id) {
  const row = await db.prepare(`${selectQuote} WHERE q.id=? AND q.workspace=?`).get(id, user.workspace);
  if (!row) fail("Không tìm thấy báo giá trong không gian này.", 404);
  return normalized(row, user);
}
function audit(user, quote, action, previousStatus, note, at) {
  // This statement must immediately follow its versioned write: changes() is local
  // to that write, so failed or replayed requests cannot add a false history entry.
  return [
    `INSERT INTO quote_audit(id,workspace,quote_id,actor_id,actor_name,action,from_status,to_status,version,total,payload,note,created)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,? WHERE changes()=1`,
    [randomUUID(), user.workspace, quote.id, user.id, user.name, action, previousStatus,
      quote.status, quote.version, quote.total, JSON.stringify(quote.payload), note, at],
  ];
}
async function existingTour(db, user, id) {
  const tour = await db.prepare("SELECT id,title,destination,departure,duration,description,itinerary,price,version FROM tours WHERE id=? AND workspace=?")
    .get(id, user.workspace);
  if (!tour) fail("Không tìm thấy tour trong không gian này.", 404);
  return tour;
}
function snapshot(tour) {
  return Object.fromEntries(["title", "destination", "departure", "duration", "description", "itinerary"].map((key) => [key, tour[key]]));
}
function terms(input) {
  const { tour_id, ...payload } = input;
  return payload;
}

export async function listQuotes(db, user) {
  requireAccess(user, "canRead");
  const rows = await db.prepare(`${selectQuote} WHERE q.workspace=? ORDER BY q.updated DESC,q.id`).all(user.workspace);
  return { quotes: rows.map((row) => normalized(row, user)), access: quoteAccess(user) };
}
export async function getQuote(db, user, id) {
  requireAccess(user, "canRead");
  const quote = await storedQuote(db, user, id);
  const history = await db.prepare(`SELECT id,actor_id,actor_name,action,from_status,to_status,version,total,note,created
    FROM quote_audit WHERE workspace=? AND quote_id=? ORDER BY version,id`).all(user.workspace, id);
  return { quote, history, capabilities: quote.capabilities };
}

export async function createQuote(db, user, input) {
  requireAccess(user, "canEdit");
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("Dữ liệu báo giá không hợp lệ.");
  if (input.request_id !== undefined && (typeof input.request_id !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.request_id)))
    fail("Mã lần tạo báo giá không hợp lệ.");
  const id = input.request_id || randomUUID();
  const previous = await db.prepare("SELECT * FROM quotes WHERE id=?").get(id);
  if (previous) {
    if (previous.workspace !== user.workspace || previous.created_by !== user.id)
      fail("Mã tạo báo giá đã được dùng. Tải lại danh sách trước khi thử tiếp.", 409);
    const saved = JSON.parse(previous.payload);
    const parsed = quoteInput(input, saved.unit_price);
    const { tour, ...savedTerms } = saved;
    if (previous.tour_id !== parsed.tour_id || JSON.stringify(savedTerms) !== JSON.stringify(terms(parsed)))
      fail("Lần tạo này đã được lưu với nội dung khác. Mở báo giá đã có để kiểm tra.", 409);
    return getQuote(db, user, id);
  }
  if (typeof input.tour_id !== "string" || !input.tour_id.trim() || input.tour_id.length > 100)
    fail("Chọn tour hợp lệ để tạo báo giá.");
  const tour = await existingTour(db, user, input.tour_id.trim());
  const parsed = quoteInput(input, tour.price);
  const payload = { ...terms(parsed), tour: snapshot(tour) };
  const quote = { id, payload, total: quoteTotals(payload).total, status: "draft", version: 1 };
  const at = now();
  let result;
  try {
    result = await db.batch([
      [`INSERT INTO quotes(id,workspace,tour_id,payload,total,status,version,created_by,reviewed_by,reviewed_at,created,updated)
        SELECT ?,?,?,?,?,'draft',1,?,NULL,NULL,?,? FROM tours WHERE id=? AND workspace=? AND version=?`,
      [id, user.workspace, parsed.tour_id, JSON.stringify(payload), quote.total, user.id, at, at, tour.id, user.workspace, tour.version]],
      audit(user, quote, "created", "", "", at),
    ]);
  } catch (error) {
    if (/UNIQUE.*quotes\.id/i.test(error.message)) {
      // A duplicate client request may race between the initial read and insert.
      // Re-enter once to compare its saved terms rather than silently duplicating it.
      return createQuote(db, user, { ...input, request_id: id });
    }
    throw error;
  }
  if (!result[0].changes) fail("Tour đã thay đổi. Tải lại tour trước khi tạo báo giá.", 409);
  return getQuote(db, user, id);
}

export async function updateQuote(db, user, id, input) {
  requireAccess(user, "canEdit");
  const expectedVersion = versionOf(input);
  const current = await storedQuote(db, user, id);
  if (current.version !== expectedVersion) fail("Báo giá đã thay đổi. Tải lại trước khi sửa.", 409);
  if (!quoteCapabilities(user, current).canEdit)
    fail("Chỉ sửa bản nháp hoặc báo giá cần sửa. Thu hồi hoặc tạo bản sửa trước.", 409);
  const parsed = quoteInput(input, current.payload.unit_price);
  let selectedTour;
  if (parsed.tour_id !== current.tour_id) selectedTour = await existingTour(db, user, parsed.tour_id);
  const payload = { ...terms(parsed), tour: selectedTour ? snapshot(selectedTour) : current.payload.tour };
  const quote = { ...current, tour_id: parsed.tour_id, payload, total: quoteTotals(payload).total,
    status: "draft", version: expectedVersion + 1 };
  const at = now();
  const tourGuard = selectedTour ? " AND EXISTS(SELECT 1 FROM tours WHERE id=? AND workspace=? AND version=?)" : "";
  const args = [parsed.tour_id, JSON.stringify(payload), quote.total, at, id, user.workspace, expectedVersion];
  if (selectedTour) args.push(selectedTour.id, user.workspace, selectedTour.version);
  const result = await db.batch([
    [`UPDATE quotes SET tour_id=?,payload=?,total=?,status='draft',version=version+1,reviewed_by=NULL,reviewed_at=NULL,updated=?
      WHERE id=? AND workspace=? AND version=? AND status IN ('draft','rejected')${tourGuard}`, args],
    audit(user, quote, "edited", current.status, "", at),
  ]);
  if (!result[0].changes) fail("Báo giá hoặc tour đã thay đổi. Tải lại trước khi sửa.", 409);
  return getQuote(db, user, id);
}

export async function transitionQuote(db, user, id, input) {
  requireAccess(user, "canRead");
  const expectedVersion = versionOf(input);
  const current = await storedQuote(db, user, id);
  if (current.version !== expectedVersion) fail("Báo giá đã thay đổi. Tải lại trước khi tiếp tục.", 409);
  const transitions = {
    submit: { capability: "canSubmit", status: "pending" },
    withdraw: { capability: "canWithdraw", status: "draft" },
    approve: { capability: "canApprove", status: "approved" },
    reject: { capability: "canReject", status: "rejected" },
    revise: { capability: "canRevise", status: "draft" },
  };
  const transition = transitions[input.action];
  if (!transition) fail("Chọn thao tác báo giá hợp lệ.");
  const access = quoteAccess(user);
  const approval = input.action === "approve" || input.action === "reject";
  if (!(approval ? access.canApprove : access.canEdit))
    fail("Vai trò hiện tại không được thực hiện thao tác báo giá này.", 403);
  if (approval && !access.canApproveOwn && current.created_by === user.id)
    fail("Người tạo không được tự duyệt báo giá. Gửi chủ không gian hoặc quản lý khác duyệt.", 403);
  if (!quoteCapabilities(user, current)[transition.capability])
    fail("Trạng thái báo giá đã thay đổi hoặc không phù hợp. Tải lại để kiểm tra.", 409);
  const note = input.note ?? "";
  if (typeof note !== "string" || note.length > 1000) fail("Ghi chú duyệt tối đa 1.000 ký tự.");
  if (input.action === "reject" && !note.trim()) fail("Nhập lý do cần sửa báo giá.");
  if (["submit", "approve"].includes(input.action) && current.payload.valid_until < todayVietnam())
    fail("Báo giá đã hết hạn. Sửa ngày hiệu lực trước khi gửi duyệt.");
  const quote = { ...current, status: transition.status, version: expectedVersion + 1 };
  const at = now();
  const result = await db.batch([
    [`UPDATE quotes SET status=?,version=version+1,reviewed_by=?,reviewed_at=?,updated=?
      WHERE id=? AND workspace=? AND version=? AND status=?`,
    [quote.status, approval ? user.id : null, approval ? at : null, at, id, user.workspace, expectedVersion, current.status]],
    audit(user, quote, input.action, current.status, note.trim(), at),
  ]);
  if (!result[0].changes) fail("Báo giá đã thay đổi. Tải lại trước khi tiếp tục.", 409);
  return getQuote(db, user, id);
}

export async function quoteExportData(db, user, id) {
  const result = await getQuote(db, user, id);
  if (result.quote.status !== "approved")
    fail("Chỉ xuất báo giá đã duyệt. Hoàn tất bước duyệt trước khi gửi khách.", 409);
  return result;
}
