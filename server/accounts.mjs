import { randomBytes, randomUUID, createHash } from "node:crypto";
import { validDepartment } from '../shared/access.mjs';

const fail = (message, status = 400) => {
  throw Object.assign(Error(message), { status });
};
const digest = (token) => createHash("sha256").update(token).digest("hex");
const timestamp = () => new Date().toISOString();
const tokenInput = (value) => {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    fail("Liên kết không hợp lệ hoặc đã hết hạn.", 400);
  return digest(value);
};
const text = (value, label, max) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(label + " không hợp lệ.");
  return value.trim();
};
export function accountEmail(value) {
  const valueText = text(value, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valueText))
    fail("Email không hợp lệ.");
  return valueText;
}
function permission(value) {
  if (!["viewer", "editor"].includes(value))
    fail("Chọn quyền chỉ xem hoặc chỉnh sửa.");
  return value;
}
function protectedUser(user) {
  return ["admin", "reviewer"].includes(user?.role);
}
export function canManageTeam(user) {
  return Boolean(user && !["staff", "reviewer"].includes(user.role));
}
export function workspacePermission(user) {
  if (user.role === "reviewer") return "reviewer";
  if (user.role === "staff") return user.staff_permission || "viewer";
  return "owner";
}
function requireOwner(user) {
  if (!canManageTeam(user))
    fail("Chỉ chủ không gian được quản lý nhân viên.", 403);
}
function publicOrigin(settings) {
  const supplied =
    settings.PUBLIC_APP_URL ||
    (settings.NODE_ENV === "production"
      ? "https://taskhub-travel.pages.dev"
      : "http://127.0.0.1:5173");
  try {
    const url = new URL(supplied);
    if (
      url.username ||
      url.password ||
      !["https:", "http:"].includes(url.protocol)
    )
      return null;
    if (
      url.protocol !== "https:" &&
      !["127.0.0.1", "localhost"].includes(url.hostname)
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export function mailReady(settings) {
  try {
    const endpoint = new URL(settings.MAIL_API_URL || "");
    return Boolean(
      endpoint.protocol === "https:" &&
        settings.MAIL_API_TOKEN &&
        settings.MAIL_FROM &&
        publicOrigin(settings),
    );
  } catch {
    return false;
  }
}

// The configured mail endpoint owns delivery. TaskHub never returns recovery tokens
// from the public request API, including when delivery is unavailable.
export function createAccounts(db, settings, { hashPassword, sendMail } = {}) {
  const origin = publicOrigin(settings);
  const deliveryReady =
    mailReady(settings) ||
    Boolean(settings.NODE_ENV === "test" && sendMail && origin);
  const generic = {
    ok: true,
    mail_ready: deliveryReady,
    message: deliveryReady
      ? "Nếu tài khoản phù hợp, email hướng dẫn sẽ được gửi. Kiểm tra cả thư rác."
      : "Gửi email chưa được cấu hình. Vui lòng liên hệ chủ không gian; không có email nào được gửi.",
  };
  async function deliverPasswordReset(user) {
    if (!deliveryReady || protectedUser(user)) return;
    const purpose = "reset";
    const recent = await db
      .prepare(
        "SELECT created FROM account_tokens WHERE user_id=? AND purpose=? ORDER BY created DESC LIMIT 1",
      )
      .get(user.id, purpose);
    if (recent && Date.now() - Date.parse(recent.created) < 60000) return;
    const raw = randomBytes(32).toString("hex"),
      token = digest(raw),
      created = timestamp();
    const expires = Date.now() + 30 * 60000;
    await db.batch([
      [
        "DELETE FROM account_tokens WHERE user_id=? AND purpose=?",
        [user.id, purpose],
      ],
      [
        "INSERT INTO account_tokens(token,user_id,purpose,expires,used_at,created) VALUES (?,?,?,?,NULL,?)",
        [token, user.id, purpose, expires, created],
      ],
    ]);
    const link = origin + "/?reset=" + raw;
    const mail = {
      from: settings.MAIL_FROM,
      to: user.email,
      subject: "TaskHub: đặt lại mật khẩu",
      text:
        "Đặt lại mật khẩu trong 30 phút: " + link +
        "\nNếu không yêu cầu, hãy bỏ qua thư này.",
    };
    try {
      if (sendMail && settings.NODE_ENV === "test") await sendMail(mail);
      else {
        const result = await fetch(settings.MAIL_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + settings.MAIL_API_TOKEN,
          },
          body: JSON.stringify(mail),
          signal: AbortSignal.timeout(10000),
        });
        if (!result.ok) throw Error("Mail transport failed");
      }
    } catch {
      await db.prepare("DELETE FROM account_tokens WHERE token=?").run(token);
      // Never log provider bodies, email addresses or recovery links.
      console.error("Account email delivery failed.");
    }
  }
  return {
    async security(user) {
      return {
        mail_ready: deliveryReady,
        can_manage_team: canManageTeam(user),
        workspace_permission: workspacePermission(user),
        department: user.department || user.staff_department || null,
        managed_account: protectedUser(user),
        can_delete_workspace: user.role !== "staff" && !protectedUser(user),
      };
    },
    async forgot(email) {
      const user = await db
        .prepare("SELECT * FROM users WHERE email=?")
        .get(accountEmail(email));
      if (user) await deliverPasswordReset(user);
      return generic;
    },
    async reset(raw, password) {
      const token = tokenInput(raw),
        pass = text(password, "Mật khẩu", 128);
      if (pass.length < 8) fail("Mật khẩu cần ít nhất 8 ký tự.");
      const row = await db
        .prepare(
          "SELECT t.user_id FROM account_tokens t JOIN users u ON u.id=t.user_id WHERE t.token=? AND t.purpose='reset' AND t.used_at IS NULL AND t.expires>? AND u.role NOT IN ('admin','reviewer')",
        )
        .get(token, Date.now());
      if (!row) fail("Liên kết không hợp lệ hoặc đã hết hạn.", 400);
      const marker = randomUUID();
      const result = await db.batch([
        [
          "UPDATE account_tokens SET used_at=? WHERE token=? AND purpose='reset' AND used_at IS NULL AND expires>?",
          [marker, token, Date.now()],
        ],
        [
          "UPDATE users SET password=? WHERE id=? AND changes()=1",
          [hashPassword(pass), row.user_id],
        ],
        [
          "DELETE FROM sessions WHERE user_id=? AND EXISTS(SELECT 1 FROM account_tokens WHERE token=? AND used_at=?)",
          [row.user_id, token, marker],
        ],
        [
          "DELETE FROM account_tokens WHERE user_id=? AND token!=? AND EXISTS(SELECT 1 FROM account_tokens WHERE token=? AND used_at=?)",
          [row.user_id, token, token, marker],
        ],
      ]);
      if (!result[0].changes)
        fail("Liên kết không hợp lệ hoặc đã hết hạn.", 400);
      return {
        ok: true,
        message: "Đã đổi mật khẩu. Vui lòng đăng nhập lại trên các thiết bị.",
      };
    },
    async team(user) {
      requireOwner(user);
      const members = await db
        .prepare(
          "SELECT u.id,u.name,u.email,u.role,m.permission,m.department,m.created FROM workspace_members m JOIN users u ON u.id=m.user_id WHERE m.workspace=? ORDER BY m.created",
        )
        .all(user.workspace);
      const invitations = await db
        .prepare(
          "SELECT id,email,permission,department,expires,created FROM workspace_invites WHERE workspace=? AND used_at IS NULL AND expires>? ORDER BY created",
        )
        .all(user.workspace, Date.now());
      return { members, invitations };
    },
    async invite(user, body) {
      requireOwner(user);
      if (!origin) fail("Chưa cấu hình địa chỉ web để tạo liên kết mời.", 503);
      const email = accountEmail(body.email),
        access = permission(body.permission),
        department = validDepartment(body.department);
      if (await db.prepare("SELECT id FROM users WHERE email=?").get(email))
        fail(
          "Email đã có tài khoản. MVP chưa chuyển tài khoản giữa các không gian; hãy mời bằng email khác.",
          409,
        );
      const count = await db
        .prepare(
          "SELECT COUNT(*) AS n FROM workspace_members WHERE workspace=?",
        )
        .get(user.workspace);
      if (count.n >= 30) fail("MVP hỗ trợ tối đa 30 nhân viên mỗi không gian.");
      const raw = randomBytes(32).toString("hex"),
        id = randomUUID(),
        expires = Date.now() + 7 * 86400000;
      await db.batch([
        [
          "DELETE FROM workspace_invites WHERE workspace=? AND email=? AND used_at IS NULL",
          [user.workspace, email],
        ],
        [
          "INSERT INTO workspace_invites(id,token,workspace,email,permission,invited_by,expires,used_at,created,department) VALUES (?,?,?,?,?,?,?,NULL,?,?)",
          [
            id,
            digest(raw),
            user.workspace,
            email,
            access,
            user.id,
            expires,
            timestamp(),
            department,
          ],
        ],
      ]);
      return {
        id,
        email,
        permission: access,
        department,
        expires,
        url: origin + "/?invite=" + raw,
      };
    },
    async preview(raw) {
      const row = await db
        .prepare(
          "SELECT i.*,w.name AS workspace_name FROM workspace_invites i JOIN workspaces w ON w.id=i.workspace WHERE token=? AND used_at IS NULL AND expires>?",
        )
        .get(tokenInput(raw), Date.now());
      if (!row) fail("Lời mời không hợp lệ hoặc đã hết hạn.", 404);
      const [name, domain] = row.email.split("@");
      return {
        workspace_name: row.workspace_name,
        email_hint: name.slice(0, 2) + "***@" + domain,
        permission: row.permission,
        department: row.department,
        expires: row.expires,
      };
    },
    async accept(body) {
      const token = tokenInput(body.token),
        email = accountEmail(body.email),
        name = text(body.name, "Tên", 80),
        pass = text(body.password, "Mật khẩu", 128);
      if (pass.length < 8) fail("Mật khẩu cần ít nhất 8 ký tự.");
      if (body.consent !== true)
        fail("Cần đồng ý xử lý dữ liệu tài khoản trước khi tham gia.");
      const invitation = await db
        .prepare(
          "SELECT * FROM workspace_invites WHERE token=? AND email=? AND used_at IS NULL AND expires>?",
        )
        .get(token, email, Date.now());
      if (!invitation)
        fail("Lời mời không hợp lệ, sai email hoặc đã hết hạn.", 400);
      if (await db.prepare("SELECT id FROM users WHERE email=?").get(email))
        fail(
          "Email đã có tài khoản. Không gian hiện tại của tài khoản được giữ nguyên; hãy dùng email mới để nhận lời mời.",
          409,
        );
      const id = randomUUID(),
        marker = randomUUID(),
        created = timestamp();
      // One atomic batch claims the invitation before creating its user. Only the
      // winner of that claim can insert anything; retry never creates a second user.
      const results = await db.batch([
        [
          "UPDATE workspace_invites SET used_at=? WHERE token=? AND email=? AND used_at IS NULL AND expires>? AND (SELECT COUNT(*) FROM workspace_members WHERE workspace=workspace_invites.workspace)<30",
          [marker, token, email, Date.now()],
        ],
        [
          "INSERT INTO users SELECT ?,?,?,?,workspace,'staff','',?,'staff-v1' FROM workspace_invites WHERE token=? AND used_at=? AND changes()=1",
          [id, email, name, hashPassword(pass), created, token, marker],
        ],
        [
          "INSERT INTO workspace_members(user_id,workspace,permission,created,department) SELECT ?,workspace,permission,?,department FROM workspace_invites WHERE token=? AND used_at=? AND changes()=1",
          [id, created, token, marker],
        ],
      ]);
      if (!results[0].changes)
        fail("Lời mời không hợp lệ hoặc đã được sử dụng.", 409);
      return await db
        .prepare(
          "SELECT u.*,m.permission AS staff_permission,m.department FROM users u JOIN workspace_members m ON m.user_id=u.id WHERE u.id=?",
        )
        .get(id);
    },
    async revokeInvite(user, id) {
      requireOwner(user);
      const result = await db
        .prepare("DELETE FROM workspace_invites WHERE id=? AND workspace=?")
        .run(id, user.workspace);
      if (!result.changes) fail("Không tìm thấy lời mời.", 404);
      return { ok: true };
    },
    async updateMember(user, id, body) {
      requireOwner(user);
      const columns=[],values=[];
      if (body.permission !== undefined) { columns.push('permission=?'); values.push(permission(body.permission)); }
      if (body.department !== undefined) { columns.push('department=?'); values.push(validDepartment(body.department)); }
      if (!columns.length) fail('Chưa có thay đổi quyền hoặc vai trò.');
      const result = await db
        .prepare(
          "UPDATE workspace_members SET "+columns.join(',')+" WHERE user_id=? AND workspace=?",
        )
        .run(...values, id, user.workspace);
      if (!result.changes) fail("Không tìm thấy nhân viên.", 404);
      return { ok: true };
    },
    async removeMember(user, id) {
      requireOwner(user);
      const result = await db
        .prepare(
          "DELETE FROM users WHERE id=? AND role='staff' AND workspace=? AND EXISTS(SELECT 1 FROM workspace_members WHERE user_id=users.id AND workspace=?)",
        )
        .run(id, user.workspace, user.workspace);
      if (!result.changes) fail("Không tìm thấy nhân viên.", 404);
      return { ok: true };
    },
  };
}

// Staff have a shared workspace: deleting or expiring one member must never
// delete that workspace, its owner, tours, ledger or other members.
export async function deleteAccount(db, user) {
  if (protectedUser(user))
    fail("Không thể xóa tài khoản hệ thống qua đây.", 403);
  if (user.role === "staff")
    await db.prepare("DELETE FROM users WHERE id=?").run(user.id);
  else
    await db.prepare("DELETE FROM workspaces WHERE id=?").run(user.workspace);
  return { ok: true };
}
