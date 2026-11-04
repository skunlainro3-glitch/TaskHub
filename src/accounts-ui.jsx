import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ShieldCheck, Users, Copy } from "lucide-react";
import "./accounts.css";
import { departmentNames } from '../shared/access.mjs';
export function createAccountUI({
  Modal,
  Button,
  Field,
  ErrorBox,
  Badge,
  Logo,
  api,
}) {
  function OperationsEntry({ onAuth, onPortal }) {
    return (
      <div className="operations-entry">
        <header className="portal-nav">
          <a className="plain-link" href="/" aria-label="Cổng khách hàng">
            <Logo />
          </a>
          <Button variant="ghost" onClick={onPortal}>
            Xem cổng khách hàng <ArrowRight size={16} />
          </Button>
        </header>
        <main className="operations-entry-main">
          <section className="operations-entry-intro">
            <div className="eyebrow blue">KHÔNG GIAN ĐIỀU HÀNH</div>
            <h1>Điều hành tour cùng TaskHub</h1>
            <p>
              Quản lý tour, lịch khởi hành, công việc và phiếu ghép B2B trong
              không gian của đội ngũ. Đăng nhập để tiếp tục làm việc.
            </p>
            <Button onClick={() => onAuth("login")} data-track="operator:login">
              Đăng nhập <ArrowRight size={17} />
            </Button>
            <p className="operations-entry-hint">
              Khách hàng có thể xem tour và gửi yêu cầu tư vấn trên cổng khách
              hàng mà không cần đăng nhập.
            </p>
          </section>
          <section className="portal-cta" aria-label="Giới thiệu cho điều hành">
            <div>
              <div className="eyebrow">
                DÀNH CHO DOANH NGHIỆP LỮ HÀNH 10–50 NHÂN SỰ
              </div>
              <h2>Quản lý lịch, số chỗ và công việc tại một nơi.</h2>
              <p>
                Tập trung lịch, số chỗ và công việc để người điều hành theo dõi.
                Khách hàng tra cứu thông tin đã công khai trên một cổng riêng.
              </p>
            </div>
            <Button variant="light" onClick={() => onAuth("register")}>
              Dùng thử TaskHub <ArrowRight size={17} />
            </Button>
          </section>
        </main>
      </div>
    );
  }

  function Auth({ mode, setMode, onClose, onUser }) {
    const [error, setError] = useState(""),
      [busy, setBusy] = useState(false);
    const register = mode === "register";
    if (mode === "forgot")
      return (
        <ForgotPassword onClose={onClose} onBack={() => setMode("login")} />
      );
    async function submit(e) {
      e.preventDefault();
      setBusy(true);
      setError("");
      const f = new FormData(e.target);
      const data = Object.fromEntries(f);
      data.consent = f.get("consent") === "on";
      try {
        const result = await api(
          register ? "/register" : "/login",
          "POST",
          data,
        );
        onUser(result.user);
        onClose();
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }
    return (
      <Modal
        busy={busy}
        title={
          register
            ? "Tạo không gian dùng thử"
            : "Đăng nhập TaskHub"
        }
        subtitle={
          register
            ? "Dùng thử tự nguyện · Không có quà tặng · Có thể dừng bất cứ lúc nào"
            : "Đăng nhập vào không gian điều hành của bạn."
        }
        onClose={onClose}
      >
        <form onSubmit={submit}>
          <ErrorBox error={error} />
          {register && (
            <Field label="Tên hiển thị">
              <input
                name="name"
                autoComplete="name"
                required
                maxLength="80"
                placeholder="Nhập tên của bạn"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="ban@congty.vn"
              maxLength="254"
            />
          </Field>
          <Field
            label="Mật khẩu"
            hint={
              register
                ? "Tối thiểu 8 ký tự."
                : undefined
            }
          >
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 8 : undefined}
              required
              maxLength="128"
              placeholder="Nhập mật khẩu"
            />
          </Field>
          {register && (
            <>
              <div className="form-grid">
                <Field label="Vai trò hiện tại">
                  <select name="role" required defaultValue="">
                    <option value="" disabled>
                      Chọn vai trò của bạn
                    </option>
                    <option value="operations">Điều hành tour</option>
                    <option value="sales">Sales / Marketing</option>
                    <option value="manager">Quản lý / Chủ doanh nghiệp</option>
                    <option value="other">Khác / Chưa làm du lịch</option>
                  </select>
                </Field>
                <Field label="Quy mô doanh nghiệp">
                  <select name="company_size" required defaultValue="">
                    <option value="" disabled>
                      Chọn quy mô phù hợp
                    </option>
                    <option value="10to30">10–30 nhân sự</option>
                    <option value="under10">Dưới 10 nhân sự</option>
                    <option value="31to50">31–50 nhân sự</option>
                    <option value="over50">Trên 50 nhân sự</option>
                    <option value="other">Không áp dụng</option>
                  </select>
                </Field>
              </div>
              <div className="consent">
                <ShieldCheck size={20} />
                <p>
                  Nhóm TaskHub thu email, vai trò, quy mô, phản hồi và lịch sử
                  thao tác trong MVP, gồm nút/menu và thời gian bấm, để đánh
                  giá CP3. Không ghi
                  nội dung bạn gõ hoặc mật khẩu. Dữ liệu lưu tối đa khoảng 6
                  tháng, nhóm và giảng viên được xem; email không xuất hiện trên
                  cổng tour công khai. Không nhập thông tin khách hàng thật
                  trong không gian dùng thử. Bạn có thể xóa dữ liệu của mình tại
                  mục Hướng dẫn. Bản CSV đã xuất cần nhóm xóa riêng khi nhận yêu
                  cầu.
                </p>
              </div>
              <label className="checkbox">
                <input name="consent" type="checkbox" required />
                <span>Tôi đã đọc thông tin trên và tự nguyện tham gia.</span>
              </label>
            </>
          )}
          <Button disabled={busy} variant="full">
            {busy
              ? "Đang xử lý…"
              : register
                ? "Bắt đầu trải nghiệm"
                : "Đăng nhập"}
            <ArrowRight size={17} />
          </Button>
          {!register && (
            <button
              type="button"
              className="text-btn password-forgot"
              disabled={busy}
              onClick={() => setMode("forgot")}
            >
              Quên mật khẩu?
            </button>
          )}
          <p className="auth-switch">
            {register ? "Đã có tài khoản?" : "Muốn trải nghiệm MVP?"}{" "}
            <button
              type="button"
              className="text-btn"
              disabled={busy}
              onClick={() => {
                setMode(register ? "login" : "register");
                setError("");
              }}
            >
              {register ? "Đăng nhập" : "Tạo không gian dùng thử"}
            </button>
          </p>
        </form>
      </Modal>
    );
  }

  function ForgotPassword({ onClose, onBack }) {
    const [busy, setBusy] = useState(false),
      [error, setError] = useState(""),
      [message, setMessage] = useState("");
    return (
      <Modal
        title="Khôi phục mật khẩu"
        subtitle="Liên kết khôi phục chỉ được gửi đến email của tài khoản."
        onClose={onClose}
        busy={busy}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const r = await api("/password/forgot", "POST", {
                email: new FormData(e.target).get("email"),
              });
              setMessage(
                r.message ||
                  (r.mail_ready
                    ? "Nếu email phù hợp, hướng dẫn khôi phục sẽ được gửi."
                    : "Chức năng gửi email chưa được cấu hình."),
              );
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <ErrorBox error={error} />
          <Field label="Email đã đăng ký">
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength="254"
              required
              disabled={busy}
            />
          </Field>
          {message && (
            <p className="account-message" role="status">
              {message}
            </p>
          )}
          <div className="modal-actions">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={onBack}
            >
              Về đăng nhập
            </Button>
            <Button disabled={busy}>
              {busy ? "Đang gửi…" : "Gửi hướng dẫn"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }
  function AccountLink({ link, onClose, onUser, refreshSession }) {
    const [info, setInfo] = useState(null),
      [busy, setBusy] = useState(false),
      [error, setError] = useState(""),
      [done, setDone] = useState(false);
    const invite = link.kind === "invite";
    useEffect(() => {
      let mounted = true;
      if (invite)
        api("/team/invites/preview?token=" + encodeURIComponent(link.token))
          .then((r) => {
            if (mounted) setInfo(r);
          })
          .catch((e) => {
            if (mounted) setError(e.message);
          });
      return () => {
        mounted = false;
      };
    }, [link.token]);
    async function submit(e) {
      e.preventDefault();
      if (busy) return;
      setBusy(true);
      setError("");
      try {
        const form = Object.fromEntries(new FormData(e.target));
        const r = await api(
          invite ? "/team/invites/accept" : "/password/reset",
          "POST",
          { ...form, token: link.token, consent: form.consent === "on" },
        );
        if (invite) {
          onUser(r.user);
          onClose();
        } else {
          setDone(true);
          await refreshSession();
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }
    return (
      <Modal
        title={
          invite ? "Tham gia không gian làm việc" : "Đặt mật khẩu mới"
        }
        onClose={onClose}
        busy={busy}
      >
        <ErrorBox error={error} />
        {done ? (
          <>
            <p className="success" role="status">
              Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.
            </p>
            <Button onClick={onClose}>Xong</Button>
          </>
        ) : (
          <form onSubmit={submit}>
            {invite &&
              (!info ? (
                <p>Đang kiểm tra lời mời…</p>
              ) : (
                <>
                  <p className="account-message">
                    Không gian <strong>{info.workspace_name}</strong> ·{" "}
                    {info.permission === "editor"
                      ? "Được chỉnh sửa"
                      : "Chỉ xem"} · {departmentNames[info.department] || 'Nhân viên tổng hợp'}
                    . Lời mời dành cho {info.email_hint}.
                  </p>
                  <Field label="Tên hiển thị">
                    <input
                      name="name"
                      autoComplete="name"
                      required
                      maxLength="80"
                      disabled={busy}
                    />
                  </Field>
                  <Field label="Email nhận lời mời">
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength="254"
                      required
                      disabled={busy}
                    />
                  </Field>
                </>
              ))}
            {(!invite || info) && (
              <Field
                label={invite ? "Mật khẩu tài khoản nhân viên" : "Mật khẩu mới"}
                hint="Tối thiểu 8 ký tự."
              >
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength="8"
                  maxLength="128"
                  required
                  disabled={busy}
                />
              </Field>
            )}
            {invite && info && (
              <label className="checkbox">
                <input
                  name="consent"
                  type="checkbox"
                  required
                  disabled={busy}
                />
                <span>
                  Tôi đồng ý tham gia không gian này. Chủ không gian xem được
                  tài khoản và các thao tác nghiệp vụ tôi thực hiện. Tài khoản
                  nhân viên không được tính là người tham gia khảo sát. Không
                  nhập dữ liệu khách hàng thật vào bản dùng thử.
                </span>
              </label>
            )}
            <Button disabled={busy || (invite && !info)}>
              {busy
                ? "Đang xử lý…"
                : invite
                  ? "Tham gia"
                  : "Lưu mật khẩu mới"}
            </Button>
          </form>
        )}
      </Modal>
    );
  }
  function AccountSettings({ user, notify, onUser, onDelete }) {
    const [security, setSecurity] = useState(null),
      [team, setTeam] = useState(null),
      [error, setError] = useState(""),
      [busy, setBusy] = useState(""),
      [invite, setInvite] = useState(null);
    const load = async () => {
      const r = await api("/account/security");
      setSecurity(r);
      if (r.can_manage_team) setTeam(await api("/team"));
    };
    useEffect(() => {
      load().catch((e) => setError(e.message));
    }, [user.id]);
    const polling = useRef(false);
    useEffect(() => {
      const timer = setInterval(async () => {
        if (!user.can_manage_team || document.hidden || polling.current) return;
        polling.current = true;
        try {
          setTeam(await api("/team"));
        } catch {
        } finally {
          polling.current = false;
        }
      }, 5000);
      return () => clearInterval(timer);
    }, [user.id, user.can_manage_team]);
    async function act(key, run) {
      if (busy) return;
      setBusy(key);
      setError("");
      try {
        await run();
        await load();
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy("");
      }
    }
    const permissionLabel = (p) =>
      p === "owner"
        ? "Chủ không gian"
        : p === "editor"
          ? "Được sửa"
          : p === "reviewer"
            ? "Người đánh giá"
            : "Chỉ xem";
    return (
      <div className="account-settings">
        <ErrorBox error={error} />
        <section className="panel account-panel">
          <div className="panel-header">
            <h3>Tài khoản & bảo mật</h3>
            <ShieldCheck size={19} />
          </div>
          <p>
            <strong>{user.name}</strong> · {user.email}
          </p>
          <p>
            Quyền:{" "}
            {permissionLabel(
              user.workspace_permission || security?.workspace_permission,
            )}
            {user.role==='staff' && ' · '+(departmentNames[user.department || security?.department] || 'Nhân viên tổng hợp')}
            .
          </p>
        </section>
        {security?.can_manage_team && (
          <section className="panel account-panel">
            <div className="panel-header">
              <h3>Nhân viên cùng không gian</h3>
              <Users size={19} />
            </div>
            <p>
              Mời nhân viên bằng email và chia sẻ liên kết riêng. Nhân viên xem
              cùng nguồn tour, công việc và B2B. Chỉ chủ không gian được mời,
              đổi quyền hoặc thu hồi quyền truy cập.
            </p>
            <form
              className="team-invite-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = e.currentTarget;
                const d = Object.fromEntries(new FormData(f));
                act("invite", async () => {
                  const r = await api("/team/invites", "POST", d);
                  const url = new URL(r.url, location.origin);
                  setInvite({
                    ...r,
                    url: location.origin + url.pathname + url.search,
                  });
                  f.reset();
                  notify(
                    "Đã tạo lời mời. Sao chép liên kết và gửi riêng cho nhân viên.",
                  );
                });
              }}
            >
              <Field label="Email nhân viên">
                <input
                  name="email"
                  type="email"
                  required
                  maxLength="254"
                  disabled={!!busy}
                  placeholder="nhanvien@congty.vn"
                />
              </Field>
              <Field label="Vai trò nhân viên">
                <select name="department" defaultValue="operations" disabled={!!busy}>
                  {Object.entries(departmentNames).map(([id,label])=><option key={id} value={id}>{label}</option>)}
                </select>
              </Field>
              <Field label="Quyền truy cập">
                <select
                  name="permission"
                  disabled={!!busy}
                  defaultValue="viewer"
                >
                  <option value="viewer">Chỉ xem</option>
                  <option value="editor">Được sửa</option>
                </select>
              </Field>
              <Button disabled={!!busy}>
                {busy === "invite" ? "Đang tạo…" : "Tạo lời mời"}
              </Button>
            </form>
            <p className="invite-hint">Vai trò giới hạn nghiệp vụ; quyền xem/sửa được chọn riêng.</p>
            {invite && (
              <div className="invite-result" role="status">
                <strong>Liên kết dành cho {invite.email}</strong>
                <p>
                  Hết hạn {new Date(invite.expires).toLocaleString("vi-VN")}.
                  Không đăng liên kết này công khai.
                </p>
                <input
                  readOnly
                  aria-label="Liên kết mời nhân viên"
                  value={invite.url}
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(invite.url);
                      notify("Đã sao chép lời mời.");
                    } catch {
                      notify(
                        "Chọn và sao chép liên kết trong ô phía trên.",
                        "error",
                      );
                    }
                  }}
                >
                  <Copy size={16} /> Sao chép lời mời
                </Button>
              </div>
            )}
            <div className="team-list">
              {team?.members?.map((m) => (
                <div className="team-row" key={m.id}>
                  <div>
                    <strong>{m.name}</strong>
                    <small>{m.email}</small>
                  </div>
                  {m.role === "staff" ? (
                    <>
                      <select aria-label={'Vai trò của '+m.name} value={m.department || 'general'} disabled={!!busy}
                        onChange={e=>act(m.id,()=>api('/team/members/'+m.id,'PATCH',{department:e.target.value}))}>
                        {Object.entries(departmentNames).map(([id,label])=><option key={id} value={id}>{label}</option>)}
                      </select>
                      <select
                        aria-label={"Quyền của " + m.name}
                        value={
                          m.permission || m.workspace_permission || "viewer"
                        }
                        disabled={!!busy}
                        onChange={(e) =>
                          act(m.id, () =>
                            api("/team/members/" + m.id, "PATCH", {
                              permission: e.target.value,
                            }),
                          )
                        }
                      >
                        <option value="viewer">Chỉ xem</option>
                        <option value="editor">Được sửa</option>
                      </select>
                      <Button
                        variant="ghost"
                        disabled={!!busy}
                        onClick={() => {
                          if (
                            confirm(
                              "Thu hồi tài khoản nhân viên này? Dữ liệu nghiệp vụ của không gian được giữ lại.",
                            )
                          )
                            act(m.id, () =>
                              api("/team/members/" + m.id, "DELETE"),
                            );
                        }}
                      >
                        Thu hồi
                      </Button>
                    </>
                  ) : (
                    <Badge>{permissionLabel(m.permission || "owner")}</Badge>
                  )}
                </div>
              ))}
            </div>
            {!!team?.invitations?.length && (
              <>
                <h4>Lời mời đang chờ</h4>
                {team.invitations.map((i) => (
                  <div className="team-row" key={i.id}>
                    <div>
                      <strong>{i.email}</strong>
                      <small>
                        {departmentNames[i.department] || 'Nhân viên tổng hợp'} · {permissionLabel(i.permission)} · hết hạn{" "}
                        {new Date(i.expires).toLocaleString("vi-VN")}
                      </small>
                    </div>
                    <Button
                      variant="ghost"
                      disabled={!!busy}
                      onClick={() =>
                        act(i.id, async () => {
                          await api("/team/invites/" + i.id, "DELETE");
                          if (invite?.id === i.id) setInvite(null);
                        })
                      }
                    >
                      Hủy lời mời
                    </Button>
                  </div>
                ))}
              </>
            )}
          </section>
        )}

        {["admin", "reviewer"].includes(user.role) && (
          <section className="panel account-panel">
            <h3>Dữ liệu kiểm thử</h3>
            <a className="btn ghost" href="/api/export/events">Nhật ký thao tác CSV</a>
            <details className="account-data">
              <summary>Bản xuất khảo sát đã lưu</summary>
              <p>Chỉ đọc dữ liệu cũ. Khảo sát mới thực hiện bằng biểu mẫu riêng của nhóm.</p>
              <a className="text-btn" href="/api/export/survey-testers">Người thử CSV</a>
              <a className="text-btn" href="/api/export/survey-features">Đánh giá tính năng CSV</a>
              <a className="text-btn" href="/api/export/feedback">Phản hồi cũ CSV</a>
            </details>
          </section>
        )}
        {!["admin", "reviewer"].includes(user.role) && (
          <section className="panel account-panel">
            <details className="account-data">
              <summary>Xóa tài khoản</summary>
              <p>{user.role === "staff" ? "Dữ liệu nghiệp vụ chung của đội ngũ được giữ lại." : "Xóa toàn bộ dữ liệu của không gian này. Thao tác không thể hoàn tác."}</p>
              <Button variant="danger" onClick={onDelete} data-track="account:delete">
                {user.role === "staff" ? "Xóa tài khoản nhân viên của tôi" : "Xóa tài khoản và dữ liệu dùng thử"}
              </Button>
            </details>
          </section>
        )}
      </div>
    );
  }
  return { Auth, AccountLink, AccountSettings, OperationsEntry };
}
