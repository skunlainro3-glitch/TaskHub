import http from "node:http";
import { referenceCatalog } from "./catalog.mjs";
import { isIP } from "node:net";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";
import {
  randomUUID,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import {
  openDatabase,
  seedWorkspace,
  transaction,
  now,
  publicTours,
  purgeExpired,
} from "./db.mjs";

const production = process.env.NODE_ENV === "production";
const adminEmail = (
  process.env.ADMIN_EMAIL || "admin@taskhub.local"
).toLowerCase();
const adminPassword =
  process.env.ADMIN_PASSWORD || (production ? "" : "TaskHub-Local-2026!");
if (adminPassword.length < 12)
  throw new Error(
    "Set ADMIN_PASSWORD to at least 12 characters before deployment.",
  );
const db = await openDatabase();
const hash = (password) => {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
};
const verify = (password, stored) => {
  const [salt, key] = stored.split(":");
  const received = scryptSync(password, salt, 64);
  return timingSafeEqual(received, Buffer.from(key, "hex"));
};
await transaction(db, async () => {
  if (!(await db.prepare("SELECT id FROM workspaces WHERE id=?").get("agency")))
    await seedWorkspace(db, "agency", "TaskHub");
  const admin = await db
    .prepare("SELECT id,role,workspace FROM users WHERE email=?")
    .get(adminEmail);
  if (admin && (admin.role !== "admin" || admin.workspace !== "agency"))
    throw new Error("ADMIN_EMAIL conflicts with an existing participant.");
  if (admin)
    await db
      .prepare("UPDATE users SET password=? WHERE id=?")
      .run(hash(adminPassword), admin.id);
  else
    await db
      .prepare("INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)")
      .run(
        randomUUID(),
        adminEmail,
        "Điều hành TaskHub",
        hash(adminPassword),
        "agency",
        "admin",
        "10–50",
        now(),
        "admin-setup",
      );
});

const reviewerEmail = process.env.REVIEWER_EMAIL?.trim().toLowerCase();
if (reviewerEmail) {
  const password = process.env.REVIEWER_PASSWORD || "";
  if (password.length < 12 || reviewerEmail === adminEmail)
    throw new Error(
      "Set a separate REVIEWER_EMAIL and REVIEWER_PASSWORD of at least 12 characters.",
    );
  const existing = await db
    .prepare("SELECT id,role FROM users WHERE email=?")
    .get(reviewerEmail);
  if (existing && existing.role !== "reviewer")
    throw new Error("REVIEWER_EMAIL conflicts with an existing user.");
  if (existing)
    await db
      .prepare("UPDATE users SET password=? WHERE id=?")
      .run(hash(password), existing.id);
  else
    await db
      .prepare("INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)")
      .run(
        randomUUID(),
        reviewerEmail,
        "Giảng viên / người đánh giá",
        hash(password),
        "agency",
        "reviewer",
        "",
        now(),
        "reviewer-setup",
      );
}
await db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
await purgeExpired(db);
setInterval(async () => {
  try {
    await purgeExpired(db);
  } catch (e) {
    console.error("Retention cleanup failed:", e.message);
  }
}, 12 * 3600000).unref();
const dist = resolve("dist");
const limits = new Map();
function limited(req, key, max = 20) {
  // Only enable this behind a reverse proxy that overwrites/appends X-Forwarded-For.
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .at(-1)
    .trim();
  const address =
    process.env.TRUST_PROXY === "1" && isIP(forwarded)
      ? forwarded
      : req.socket.remoteAddress;
  const id = address + ":" + key;
  const t = Date.now();
  if (limits.size > 10000)
    for (const [k, v] of limits) if (v.until < t) limits.delete(k);
  let item = limits.get(id);
  if (!item || item.until < t) {
    item = { n: 0, until: t + 60000 };
    limits.set(id, item);
  }
  if (++item.n > max)
    throw Object.assign(new Error("Thử lại sau một phút."), { status: 429 });
}
const fail = (msg, status = 400) => {
  throw Object.assign(new Error(msg), { status });
};
function text(v, label, max = 500, optional = false) {
  if (typeof v !== "string") fail("Thiếu " + label);
  const s = v.trim();
  if ((!s && !optional) || s.length > max) fail(label + " không hợp lệ.");
  return s;
}
function integer(v, label, min, max) {
  if (!Number.isSafeInteger(v) || v < min || v > max)
    fail(label + " không hợp lệ.");
  return v;
}
function email(v) {
  const s = text(v, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) fail("Email không hợp lệ.");
  return s;
}
function date(v) {
  const s = text(v, "ngày", 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
    !Number.isFinite(Date.parse(s)) ||
    new Date(s).toISOString().slice(0, 10) !== s
  )
    fail("Ngày không hợp lệ.");
  return s;
}
function choice(v, choices, label) {
  if (!choices.includes(v)) fail(label + " không hợp lệ.");
  return v;
}
const log = async (user, action, entity = "") => {
  if (!["admin", "reviewer"].includes(user.role))
    await db
      .prepare("INSERT INTO events VALUES (?,?,?,?,?)")
      .run(randomUUID(), user.id, action, entity, now());
};
async function userFor(req) {
  const raw = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("taskhub_session="))
    ?.slice(16);
  if (!raw) return null;
  return (
    (await db
      .prepare(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
      )
      .get(createHash("sha256").update(raw).digest("hex"), Date.now())) || null
  );
}
async function required(req) {
  return (await userFor(req)) || fail("Vui lòng đăng nhập.", 401);
}
async function adminOnly(req) {
  const user = await required(req);
  if (!["admin", "reviewer"].includes(user.role))
    fail("Chỉ quản trị hoặc người đánh giá được truy cập.", 403);
  return user;
}
async function session(res, user) {
  const raw = randomBytes(32).toString("hex");
  await db
    .prepare("INSERT INTO sessions VALUES (?,?,?)")
    .run(
      createHash("sha256").update(raw).digest("hex"),
      user.id,
      Date.now() + 7 * 86400000,
    );
  res.setHeader(
    "Set-Cookie",
    `taskhub_session=${raw}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${production ? "; Secure" : ""}`,
  );
}
function safeUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    workspace: u.workspace,
    role: u.role,
  };
}
function json(res, value, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}
async function body(req) {
  if (!(req.headers["content-type"] || "").startsWith("application/json"))
    fail("Yêu cầu phải có định dạng JSON.", 415);
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 32768) fail("Dữ liệu quá lớn.", 413);
    chunks.push(chunk);
  }
  try {
    const result = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!result || typeof result !== "object" || Array.isArray(result))
      fail("JSON phải là một đối tượng.");
    return result;
  } catch {
    fail("JSON không hợp lệ.");
  }
}
function csv(rows) {
  if (!rows.length) return "\ufeffNo data\r\n";
  const fields = Object.keys(rows[0]);
  const quote = (x) =>
    '"' +
    String(x ?? "")
      .replace(/^(\s*[=+\-@]|[\t\r])/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return (
    "\ufeff" +
    [fields, ...rows.map((r) => fields.map((f) => r[f]))]
      .map((row) => row.map(quote).join(","))
      .join("\r\n")
  );
}
function download(res, rows, name) {
  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${name}.csv"`,
  });
  res.end(csv(rows));
}
function tourInput(b) {
  return [
    text(b.title, "tên tour", 120),
    text(b.destination, "điểm đến", 80),
    date(b.departure),
    text(b.duration, "thời lượng", 80),
    integer(b.price, "giá", 0, 1000000000),
    integer(b.capacity, "sức chứa", 1, 1000),
    integer(b.reserved, "số khách", 0, 1000),
    text(b.description, "mô tả", 2000),
    text(b.itinerary, "lịch trình", 5000),
    choice(b.theme, ["danang", "dalat", "phuquoc"], "ảnh"),
    b.published === true ? 1 : 0,
  ];
}
export const server = http.createServer(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "DENY");
  if (production)
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: https://dulichenvietcs.netlify.app; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",
    );
  try {
    const url = new URL(req.url, "http://localhost");
    const p = url.pathname;
    const method = req.method;
    if (p.startsWith("/api/") && method !== "GET") {
      if (req.headers["x-taskhub"] !== "1") fail("Yêu cầu không hợp lệ.", 403);
      if (req.headers.origin) {
        const origin = new URL(req.headers.origin);
        const localDev =
          !production &&
          ["http://127.0.0.1:5173", "http://localhost:5173"].includes(
            origin.origin,
          );
        if (origin.host !== req.headers.host && !localDev)
          fail("Nguồn yêu cầu không hợp lệ.", 403);
      }
    }
    if (p === "/api/health") {
      await db.prepare("SELECT 1").get();
      return json(res, { ok: true, version: "0.2.0" });
    }
    if (
      p.startsWith("/api/") &&
      method !== "GET" &&
      !["/api/login", "/api/logout", "/api/register", "/api/events"].includes(
        p,
      ) &&
      (await userFor(req))?.role === "reviewer"
    )
      fail("Tài khoản người đánh giá chỉ có quyền xem.", 403);
    if (p === "/api/session" && method === "GET") {
      const u = await userFor(req);
      return json(res, { user: u ? safeUser(u) : null });
    }
    if (p === "/api/register" && method === "POST") {
      limited(req, "register", 30);
      const b = await body(req);
      const em = email(b.email);
      const password = text(b.password, "mật khẩu", 128);
      if (password.length < 8) fail("Mật khẩu cần ít nhất 8 ký tự.");
      if (b.consent !== true) fail("Cần đồng ý trước khi bắt đầu khảo sát.");
      const name = text(b.name, "tên", 80);
      const role = choice(
        b.role,
        ["operations", "sales", "manager", "other"],
        "vai trò",
      );
      const size = choice(
        b.company_size,
        ["under10", "10to30", "31to50", "over50", "other"],
        "quy mô",
      );
      if (await db.prepare("SELECT id FROM users WHERE email=?").get(em))
        fail("Email đã đăng ký. Anh/chị có thể đăng nhập.", 409);
      const id = randomUUID(),
        workspace = randomUUID();
      const u = await transaction(db, async () => {
        if (await db.prepare("SELECT id FROM users WHERE email=?").get(em))
          fail("Email đã đăng ký. Anh/chị có thể đăng nhập.", 409);
        await seedWorkspace(db, workspace, "Không gian của " + name);
        await db
          .prepare("INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)")
          .run(
            id,
            em,
            name,
            hash(password),
            workspace,
            role,
            size,
            now(),
            "cp3-v1",
          );
        const result = await db
          .prepare("SELECT * FROM users WHERE id=?")
          .get(id);
        await log(result, "test_started");
        return result;
      });
      await session(res, u);
      return json(res, { user: safeUser(u) }, 201);
    }
    if (p === "/api/login" && method === "POST") {
      limited(req, "login", 30);
      const b = await body(req);
      const u = await db
        .prepare("SELECT * FROM users WHERE email=?")
        .get(email(b.email));
      const password = text(b.password, "mật khẩu", 128);
      if (!u || !verify(password, u.password))
        fail("Email hoặc mật khẩu chưa đúng.", 401);
      await session(res, u);
      return json(res, { user: safeUser(u) });
    }
    if (p === "/api/logout" && method === "POST") {
      const u = await userFor(req);
      if (u) {
        const raw = (req.headers.cookie || "")
          .split(";")
          .map((s) => s.trim())
          .find((s) => s.startsWith("taskhub_session="))
          ?.slice(16);
        if (raw)
          await db
            .prepare("DELETE FROM sessions WHERE token=?")
            .run(createHash("sha256").update(raw).digest("hex"));
      }
      res.setHeader(
        "Set-Cookie",
        "taskhub_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      );
      return json(res, { ok: true });
    }
    const publicMatch = p.match(/^\/api\/public\/([^/]+)$/);
    if (publicMatch && method === "GET") {
      const ws = await db
        .prepare("SELECT * FROM workspaces WHERE id=?")
        .get(publicMatch[1]);
      if (!ws) fail("Không tìm thấy cổng tour.", 404);
      return json(res, {
        agency: ws.id === "agency" ? "TaskHub" : ws.name,
        tours: await publicTours(db, ws.id),
        catalog: ws.id === "agency" ? referenceCatalog : null,
        updated: now(),
      });
    }
    const inquiryMatch = p.match(/^\/api\/public\/([^/]+)\/inquiries$/);
    if (inquiryMatch && method === "POST") {
      limited(req, "inquiry", 10);
      const b = await body(req);
      const tour = await db
        .prepare(
          "SELECT * FROM tours WHERE id=? AND workspace=? AND published=1",
        )
        .get(b.tour_id, inquiryMatch[1]);
      if (!tour) fail("Tour không khả dụng.", 404);
      if (b.consent !== true) fail("Cần đồng ý để gửi yêu cầu.");
      const name = text(b.name, "tên", 80),
        em = email(b.email),
        people = integer(b.people, "số khách", 1, 1000),
        note = text(b.note || "", "ghi chú", 1000, true);
      if (people > tour.capacity - tour.reserved)
        fail("Số khách vượt số chỗ còn lại. Vui lòng chọn tour khác.");
      await db
        .prepare("INSERT INTO inquiries VALUES (?,?,?,?,?,?,?,?,?,?)")
        .run(
          randomUUID(),
          tour.workspace,
          tour.id,
          name,
          em,
          people,
          note,
          "new",
          now(),
          "inquiry-v1",
        );
      const u = await userFor(req);
      if (u?.workspace === tour.workspace)
        await log(u, "inquiry_sent", tour.id);
      return json(
        res,
        {
          ok: true,
          message:
            "Đã gửi yêu cầu tư vấn. Chưa giữ chỗ hoặc xác nhận đặt tour.",
        },
        201,
      );
    }
    if (p === "/api/workspace" && method === "GET") {
      const u = await required(req);
      const [tasks, tours, inquiries, activity, actionRows, feedback] =
        await Promise.all([
          db
            .prepare(
              "SELECT * FROM tasks WHERE workspace=? ORDER BY due,created",
            )
            .all(u.workspace),
          db
            .prepare("SELECT * FROM tours WHERE workspace=? ORDER BY departure")
            .all(u.workspace),
          db
            .prepare(
              "SELECT i.*,t.title AS tour_title FROM inquiries i JOIN tours t ON t.id=i.tour_id WHERE i.workspace=? ORDER BY i.created DESC",
            )
            .all(u.workspace),
          db
            .prepare(
              "SELECT action,entity,created FROM events WHERE user_id=? ORDER BY created DESC LIMIT 8",
            )
            .all(u.id),
          db
            .prepare("SELECT DISTINCT action FROM events WHERE user_id=?")
            .all(u.id),
          db.prepare("SELECT * FROM feedback WHERE user_id=?").get(u.id),
        ]);
      const completedActions = actionRows.map((e) => e.action);
      return json(res, {
        tours,
        tasks,
        inquiries,
        activity,
        completedActions,
        catalog: referenceCatalog,
        feedback: feedback || null,
      });
    }
    if (p === "/api/events" && method === "POST") {
      const u = await required(req),
        b = await body(req);
      limited(req, "events", 60);
      const action = choice(
        b.action,
        ["portal_viewed", "tour_viewed"],
        "thao tác",
      );
      await log(u, action);
      return json(res, { ok: true });
    }
    if (p === "/api/tours" && method === "POST") {
      const u = await required(req),
        b = await body(req),
        values = tourInput(b);
      if (values[6] > values[5]) fail("Số khách đã giữ vượt sức chứa.");
      const id = randomUUID();
      await transaction(db, async () => {
        await db
          .prepare("INSERT INTO tours VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
          .run(id, u.workspace, ...values, 1, now());
        await log(u, "tour_created", id);
      });
      return json(res, { id }, 201);
    }
    const tourMatch = p.match(/^\/api\/tours\/([^/]+)$/);
    if (tourMatch && method === "DELETE") {
      const u = await required(req), b = await body(req);
      integer(b.version, "phiên bản", 1, 1000000000);
      await transaction(db, async () => {
        const result = await db.prepare("DELETE FROM tours WHERE id=? AND workspace=? AND version=?").run(tourMatch[1], u.workspace, b.version);
        if (!result.changes) fail("Tour đã thay đổi hoặc không tồn tại. Tải lại trước khi xóa.", 409);
        await log(u, "tour_deleted", tourMatch[1]);
      });
      return json(res, { ok: true });
    }
    if (tourMatch && method === "PUT") {
      const u = await required(req),
        b = await body(req),
        values = tourInput(b);
      if (values[6] > values[5]) fail("Số khách đã giữ vượt sức chứa.");
      integer(b.version, "phiên bản", 1, 1000000000);
      await transaction(db, async () => {
        const result = await db
          .prepare(
            "UPDATE tours SET title=?,destination=?,departure=?,duration=?,price=?,capacity=?,reserved=?,description=?,itinerary=?,theme=?,published=?,version=version+1,updated=? WHERE id=? AND workspace=? AND version=?",
          )
          .run(...values, now(), tourMatch[1], u.workspace, b.version);
        if (!result.changes)
          fail(
            "Tour đã thay đổi hoặc không tồn tại. Tải lại trước khi sửa.",
            409,
          );
        await log(u, "tour_updated", tourMatch[1]);
      });
      return json(res, { ok: true });
    }
    if (p === "/api/tasks" && method === "POST") {
      const u = await required(req),
        b = await body(req);
      const tour = await db
        .prepare("SELECT id FROM tours WHERE id=? AND workspace=?")
        .get(b.tour_id, u.workspace);
      if (!tour) fail("Tour không tồn tại.", 404);
      const id = randomUUID();
      const title = text(b.title, "công việc", 160),
        assignee = text(b.assignee, "người phụ trách", 80),
        due = date(b.due),
        priority = choice(b.priority, ["normal", "high"], "ưu tiên");
      await transaction(db, async () => {
        await db
          .prepare("INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?)")
          .run(
            id,
            u.workspace,
            tour.id,
            title,
            assignee,
            due,
            priority,
            "todo",
            now(),
          );
        await log(u, "task_created", id);
      });
      return json(res, { id }, 201);
    }
    const taskMatch = p.match(/^\/api\/tasks\/([^/]+)$/);
    if (taskMatch && method === "PATCH") {
      const u = await required(req),
        b = await body(req);
      const status = choice(b.status, ["todo", "doing", "done"], "trạng thái");
      await transaction(db, async () => {
        const result = await db
          .prepare("UPDATE tasks SET status=? WHERE id=? AND workspace=?")
          .run(status, taskMatch[1], u.workspace);
        if (!result.changes) fail("Không tìm thấy công việc.", 404);
        await log(u, "task_status_changed", status);
      });
      return json(res, { ok: true });
    }
    const leadMatch = p.match(/^\/api\/inquiries\/([^/]+)$/);
    if (leadMatch && method === "PATCH") {
      const u = await required(req),
        b = await body(req);
      const status = choice(
        b.status,
        ["new", "contacted", "closed"],
        "trạng thái",
      );
      const result = await db
        .prepare("UPDATE inquiries SET status=? WHERE id=? AND workspace=?")
        .run(status, leadMatch[1], u.workspace);
      if (!result.changes) fail("Không tìm thấy yêu cầu.", 404);
      return json(res, { ok: true });
    }
    if (p === "/api/feedback" && method === "POST") {
      const u = await required(req),
        b = await body(req);
      if (u.role === "admin")
        fail("Quản trị không phải người tham gia khảo sát.");
      const values = ["portal", "operations", "sync", "ease"].map((k) =>
        integer(b[k], k, 1, 5),
      );
      const intent = choice(b.intent, ["yes", "maybe", "no"], "ý định");
      const price = integer(b.price, "giá", 0, 100000000);
      const liked = text(b.liked || "", "điểm thích", 1500, true),
        disliked = text(b.disliked || "", "điểm cần sửa", 1500, true);
      await transaction(db, async () => {
        await db
          .prepare(
            "INSERT INTO feedback VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET portal=excluded.portal,operations=excluded.operations,sync=excluded.sync,ease=excluded.ease,intent=excluded.intent,price=excluded.price,liked=excluded.liked,disliked=excluded.disliked,created=excluded.created",
          )
          .run(u.id, ...values, intent, price, liked, disliked, now());
        await log(u, "feedback_submitted");
      });
      return json(res, { ok: true });
    }
    if (p === "/api/research" && method === "GET") {
      await adminOnly(req);
      const feedback = await db
        .prepare(
          `SELECT f.*,u.name,u.role,u.company_size,
            (SELECT COUNT(DISTINCT e.action) FROM events e
             WHERE e.user_id=f.user_id AND e.created<=f.created
             AND e.action IN ('tour_updated','portal_viewed','task_created','task_status_changed'))=4 AS has_test_flow
           FROM feedback f JOIN users u ON u.id=f.user_id ORDER BY f.created DESC`,
        )
        .all();
      const participants = (
        await db
          .prepare(
            "SELECT COUNT(*) AS count FROM users WHERE role NOT IN ('admin','reviewer')",
          )
          .get()
      ).count;
      return json(res, {
        participants,
        feedback,
        readyToReview: feedback.filter((f) => f.has_test_flow).length,
        events: (await db.prepare("SELECT COUNT(*) AS count FROM events").get())
          .count,
      });
    }
    if (p === "/api/export/events" && method === "GET") {
      await adminOnly(req);
      return download(
        res,
        await db
          .prepare(
            "SELECT e.id,u.email,u.role,u.company_size,u.consent_at,u.consent_version,e.action,e.entity,e.created FROM events e JOIN users u ON u.id=e.user_id ORDER BY e.created",
          )
          .all(),
        "taskhub-interactions",
      );
    }
    if (p === "/api/export/feedback" && method === "GET") {
      await adminOnly(req);
      return download(
        res,
        await db
          .prepare(
            "SELECT u.email,u.name,u.role,u.company_size,u.consent_at,u.consent_version,f.portal,f.operations,f.sync,f.ease,f.intent,f.price,f.liked,f.disliked,f.created FROM feedback f JOIN users u ON u.id=f.user_id ORDER BY f.created",
          )
          .all(),
        "taskhub-feedback",
      );
    }
    if (p === "/api/account" && method === "DELETE") {
      const u = await required(req);
      if (u.role === "admin") fail("Không thể xóa tài khoản quản trị qua đây.");
      await db.prepare("DELETE FROM workspaces WHERE id=?").run(u.workspace);
      res.setHeader(
        "Set-Cookie",
        "taskhub_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      );
      return json(res, { ok: true });
    }
    if (p.startsWith("/api/")) fail("Không tìm thấy API.", 404);
    if (method !== "GET" && method !== "HEAD")
      fail("Phương thức không hỗ trợ.", 405);
    let file = resolve(dist, "." + decodeURIComponent(p));
    if (!file.startsWith(dist + "/") && !file.startsWith(dist + "\\"))
      file = resolve(dist, "index.html");
    if (!existsSync(file) || !statSync(file).isFile())
      file = resolve(dist, "index.html");
    if (!existsSync(file))
      return json(
        res,
        { message: "Chạy npm run dev hoặc npm run build trước." },
        503,
      );
    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
    };
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    res.end(method === "HEAD" ? undefined : readFileSync(file));
  } catch (e) {
    if (!e.status) console.error("API error:", e.message);
    if (!res.headersSent)
      json(
        res,
        {
          message: e.status ? e.message : "Có lỗi hệ thống. Vui lòng thử lại.",
        },
        e.status || 500,
      );
    else res.end();
  }
});
server.listen(
  Number(process.env.PORT || 3001),
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      `TaskHub API: http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 3001}`,
    ),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
