import React, { useState, useEffect, useCallback, useId, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  MapPin,
  CalendarDays,
  Users,
  Check,
  CheckCheck,
  X,
  LayoutDashboard,
  Compass,
  ListTodo,
  Inbox,
  BarChart3,
  LogOut,
  ExternalLink,
  Clock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Download,
  Menu,
  Send,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Globe,
  Mail,
  Handshake,
  Upload,
  Settings,
  GitBranch,
  Calculator,
  FileText,
} from "lucide-react";
import "./styles.css";
import { createOperationsUI } from "./operations-ui.jsx";
import { startInteractions, flushInteractions } from "./interactions.mjs";
import { createPortalUI } from "./portal-ui.jsx";
import { createAccountUI } from "./accounts-ui.jsx";
import { createDemoUI } from "./demo-ui.jsx";
import { createPlanningUI } from "./planning-ui.jsx";
import { createQuotesUI } from "./quotes-ui.jsx";
import { createTaskTemplatesUI } from "./task-templates-ui.jsx";
import { Workflow } from "./workflow-ui.jsx";
import { Analytics } from "./analytics-ui.jsx";
import { SyncStatus } from "./sync-status.jsx";
import { workspaceAccess } from "../shared/access.mjs";
import { taskPersonLabel } from "../shared/task-templates.mjs";
import { loadTaskPeople } from "./task-people.mjs";
import { api } from "./api.mjs";
import { startPolling } from "./polling.mjs";
import { tourDeletionSummary } from "./pooling-view.mjs";
import { todayVietnam as todayVN } from "./dates.mjs";
import {
  matchesTourSearch,
  normalizeSearchText,
} from "./tour-search.mjs";
import "./portal-filters.css";
const money = (n) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";
const date = (n) =>
  new Date(n + "T12:00:00").toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
const statuses = {
  todo: "Cần làm",
  doing: "Đang thực hiện",
  done: "Hoàn thành",
};
const navItems = [
  ["dashboard", "Tổng quan", LayoutDashboard],
  ["analytics", "Báo cáo vận hành", BarChart3],
  ["tours", "Quản lý tour", Compass],
  ["tasks", "Công việc", ListTodo],
  ["quotes", "Báo giá", FileText],
  ["pooling", "Ghép tour B2B", Handshake],
  ["inbox", "Yêu cầu tư vấn", Inbox],
  ["workflow", "Quy trình vận hành", GitBranch],
  ["business", "Giá trị & doanh thu", Calculator],
  ["account", "Tài khoản & nhóm", Settings],
];
function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark">
        <Compass size={25} />
      </span>
      TaskHub<span className="logo-dot">.</span>
    </span>
  );
}
function Button({ children, variant = "", ...props }) {
  return (
    <button className={"btn " + variant} {...props}>
      {children}
    </button>
  );
}
function Badge({ children, tone = "" }) {
  return <span className={"badge " + tone}>{children}</span>;
}
function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  busy = false,
}) {
  const blocked = useRef(busy);
  blocked.current = busy;
  useEffect(() => {
    const before = document.activeElement;
    const handler = (e) => {
      if (e.key === "Escape" && !blocked.current) onClose();
      if (e.key === "Tab") {
        const focusable = [
          ...document.querySelectorAll(
            '.modal button:not(:disabled),.modal input:not(:disabled):not([type="hidden"]),.modal select:not(:disabled),.modal textarea:not(:disabled),.modal a[href]',
          ),
        ];
        const first = focusable[0],
          last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    document
      .querySelector(
        '.modal input:not(:disabled):not([type="hidden"]),.modal button:not(:disabled)',
      )
      ?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = old;
      before?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !blocked.current) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-busy={busy}
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
      >
        <header className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-btn"
            aria-label="Đóng"
            disabled={busy}
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function Field({ label, children, hint }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) &&
        ["input", "select", "textarea"].includes(child.type)
          ? React.cloneElement(child, {
              id,
              "aria-describedby": hint ? id + "-hint" : undefined,
            })
          : child,
      )}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </div>
  );
}
function ErrorBox({ error }) {
  return error ? (
    <div className="error" role="alert">
      <AlertCircle size={18} />
      {error}
    </div>
  ) : null;
}
function Empty({ title, children }) {
  return (
    <div className="empty">
      <Compass size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function TourEditor({
  tour,
  prefill,
  minimumReserved = 0,
  pooling = [],
  onRelatedPooling,
  onClose,
  onSave,
  onRefresh,
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false),
    [conflict, setConflict] = useState(false);
  async function refresh() {
    setBusy(true);
    try {
      await onRefresh();
      setConflict(false);
      setError("");
      setConfirmDelete(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const t = tour || {
    title: "",
    destination: "",
    departure: "",
    duration: "",
    price: "",
    capacity: "",
    reserved: 0,
    theme: "danang",
    published: 0,
    description: "",
    itinerary: "",
    ...(prefill
      ? {
          title: prefill.title,
          destination: prefill.destination,
          duration: prefill.duration,
          price: prefill.price ?? "",
          reserved: "",
          description: `${prefill.route}\n${prefill.highlights.join("; ")}\nNguồn: ${prefill.sourceUrl} · ${prefill.code} · Ghi nhận ${date(prefill.capturedOn)}.`,
        }
      : {}),
  };
  const linked = tourDeletionSummary(pooling, tour?.id);
  async function unpublish() {
    setBusy(true);
    setError("");
    try {
      await api("/tours/" + tour.id, "PUT", { ...tour, published: false });
      await onSave();
      onClose();
    } catch (e) {
      setError(e.message);
      setConflict(e.status === 409);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (linked.blocking) return;
    setBusy(true);
    setError("");
    try {
      await api("/tours/" + tour.id, "DELETE", { version: tour.version });
      await onSave();
      onClose();
    } catch (e) {
      setError(e.message);
      setConflict(e.status === 409);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.target),
      b = Object.fromEntries(f);
    for (const k of ["price", "capacity", "reserved"]) b[k] = Number(b[k]);
    b.published = f.get("published") === "on";
    b.version = t.version;
    try {
      await api(
        tour ? "/tours/" + tour.id : "/tours",
        tour ? "PUT" : "POST",
        b,
      );
      await onSave();
      onClose();
    } catch (e) {
      setError(e.message);
      setConflict(e.status === 409);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      busy={busy}
      title={tour ? "Cập nhật hành trình" : "Tạo hành trình mới"}
      subtitle="Thông tin công khai được dùng trực tiếp trên cổng tour."
      onClose={onClose}
      wide
    >
      <form
        key={tour ? `${tour.id}:${tour.version}` : "new-tour"}
        onSubmit={submit}
      >
        <ErrorBox error={error} />
        {conflict && (
          <div className="conflict-recovery">
            <p>
              Bản đang sửa đã cũ. Nội dung bạn nhập vẫn giữ tại đây. Chọn Nạp
              bản mới sẽ thay biểu mẫu bằng dữ liệu vừa lưu trên hệ thống; hãy
              sao chép phần cần giữ trước.
            </p>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={refresh}
            >
              Nạp bản mới
              <RefreshCw size={16} />
            </Button>
          </div>
        )}
        <p className="tour-form-note">
          Xác nhận thông tin hành trình, số khách và nội dung bên dưới. Lưu tour
          nháp trước, kiểm tra rồi mới công khai.
        </p>
        {prefill && (
          <div className="catalog-source">
            <ShieldCheck size={18} />
            <div>
              <strong>Kiểm tra và bổ sung trước khi lưu</strong>
              <p>
                Đã lấy nội dung tham khảo {prefill.code}. Xác nhận giá, nhập
                ngày đi, sức chứa, khách đã giữ chỗ và lịch trình từng ngày.
                Tour chưa được công khai.
              </p>
            </div>
          </div>
        )}
        <div className="form-section-label">Thông tin hành trình</div>
        <Field label="Tên tour">
          <input name="title" defaultValue={t.title} required maxLength="120" />
        </Field>
        <div className="form-grid">
          <Field label="Điểm đến">
            <input
              name="destination"
              defaultValue={t.destination}
              required
              maxLength="80"
            />
          </Field>
          <Field label="Khởi hành">
            <input
              name="departure"
              type="date"
              defaultValue={t.departure}
              required
            />
          </Field>
          <Field label="Thời lượng">
            <input
              name="duration"
              defaultValue={t.duration}
              required
              maxLength="80"
            />
          </Field>
          <Field label="Giá / khách (VND)">
            <input
              name="price"
              type="number"
              min="0"
              max="1000000000"
              defaultValue={t.price}
              required
            />
          </Field>
          <Field label="Sức chứa">
            <input
              name="capacity"
              type="number"
              min="1"
              max="1000"
              defaultValue={t.capacity}
              required
            />
          </Field>
          <Field
            label="Khách đã giữ chỗ"
            hint={
              minimumReserved
                ? `Bao gồm ${minimumReserved} khách ghép đã xác nhận; không được thấp hơn mức này.`
                : undefined
            }
          >
            <input
              name="reserved"
              type="number"
              min={minimumReserved}
              max="1000"
              defaultValue={t.reserved}
              required
            />
          </Field>
        </div>
        <div className="form-section-label">Nội dung cho khách hàng</div>
        <Field label="Mô tả ngắn">
          <textarea
            name="description"
            defaultValue={t.description}
            rows="3"
            required
            maxLength="2000"
          />
        </Field>
        <Field label="Lịch trình (mỗi dòng một ngày)">
          <textarea
            name="itinerary"
            defaultValue={t.itinerary}
            rows="4"
            required
            maxLength="5000"
          />
        </Field>
        <Field label="Hình minh họa">
          <select name="theme" defaultValue={t.theme}>
            <option value="danang">Phố cổ / Miền Trung</option>
            <option value="dalat">Đồi thông / Cao nguyên</option>
            <option value="phuquoc">Biển / Đảo</option>
          </select>
        </Field>
        <label className="checkbox">
          <input
            name="published"
            type="checkbox"
            defaultChecked={!!t.published}
          />
          <span>Công khai trên cổng khách hàng</span>
        </label>
        {tour && confirmDelete && (
          <div className="delete-confirm" role="alert">
            <strong>
              {linked.blocking
                ? "Tour còn " + linked.blocking + " phiếu B2B cần xử lý"
                : "Xóa tour này?"}
            </strong>
            <p>
              Công việc và yêu cầu tư vấn gắn với tour cũng sẽ bị xóa. Nếu còn
              phiếu ghép B2B, hãy hoàn tất đối soát và hủy phiếu trước. Để chỉ
              ẩn khỏi cổng khách hàng, bỏ chọn công khai rồi lưu.
            </p>
            {linked.blocking > 0 && (
              <p className="deletion-guidance">
                {linked.withReceipts > 0
                  ? linked.withReceipts +
                    " phiếu còn số tiền đã ghi nhận thu. Kiểm tra thỏa thuận và đối soát với đối tác trước khi hủy; không đưa tiền về 0 chỉ để xóa tour."
                  : "Mở các phiếu liên quan để kiểm tra và hủy những phiếu đã kết thúc thỏa thuận."}
              </p>
            )}
            <div className="deletion-options">
              {onRelatedPooling && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => onRelatedPooling(tour.id)}
                >
                  Xem phiếu B2B liên quan
                  {linked.total ? " (" + linked.total + ")" : ""}
                </Button>
              )}
              {!!tour.published && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={unpublish}
                >
                  Ngừng công khai tour
                </Button>
              )}
            </div>
            {!!tour.published && (
              <p className="muted">
                Ngừng công khai chỉ ẩn tour khỏi cổng khách hàng, giữ dữ liệu đã
                lưu và lịch sử. Các chỉnh sửa chưa lưu trong biểu mẫu sẽ không
                được áp dụng.
              </p>
            )}
            <Button
              type="button"
              variant="danger"
              disabled={busy || linked.blocking > 0}
              onClick={remove}
            >
              Xác nhận xóa tour
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              Giữ lại tour
            </Button>
          </div>
        )}
        <div className="modal-actions">
          {tour && !confirmDelete && (
            <Button
              type="button"
              variant="danger"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              Xóa tour
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={busy}
          >
            Hủy
          </Button>
          <Button disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu hành trình"}
            <Check size={17} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function TaskEditor({
  tours,
  task,
  canManageTeam,
  defaultTourId,
  onClose,
  onSave,
  onRefresh,
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [conflict, setConflict] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false);
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [peopleError, setPeopleError] = useState("");
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id || "");
  const loadPeople = async () => {
    setPeopleLoading(true);
    try { setPeople(await loadTaskPeople(api, canManageTeam)); setPeopleError(""); }
    catch (error) { setPeopleError(error.message); }
    finally { setPeopleLoading(false); }
  };
  useEffect(() => { void loadPeople(); }, []);
  useEffect(() => { setAssigneeId(task?.assignee_id || ""); }, [task?.id, task?.version]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = Object.fromEntries(new FormData(e.target));
      if (task) body.version = task.version;
      await api(
        task ? "/tasks/" + task.id : "/tasks",
        task ? "PUT" : "POST",
        body,
      );
      await onSave();
      onClose();
    } catch (e) {
      setError(e.message);
      setConflict(e.status === 409);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await api("/tasks/" + task.id, "DELETE", { version: task.version });
      await onSave();
      onClose();
    } catch (e) {
      setError(e.message);
      setConflict(e.status === 409);
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    setBusy(true);
    try {
      await onRefresh();
      setConflict(false);
      setError("");
      setConfirmDelete(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={task ? "Cập nhật công việc" : "Giao một công việc"}
      subtitle="Gắn với tour, rõ người phụ trách và thời hạn."
      onClose={onClose}
      busy={busy}
    >
      <form
        key={task ? `${task.id}:${task.version}` : "new-task"}
        onSubmit={save}
      >
        <ErrorBox error={error} />
        {conflict && (
          <div className="conflict-recovery">
            <p>
              Công việc đã đổi từ một màn hình khác. Chọn Nạp bản mới sẽ thay
              nội dung đang nhập; sao chép phần cần giữ trước.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={refresh}
              disabled={busy}
            >
              Nạp bản mới
              <RefreshCw size={15} />
            </Button>
          </div>
        )}
        <Field label="Công việc">
          <input
            name="title"
            defaultValue={task?.title || ""}
            required
            maxLength="160"
            placeholder="Nhập nội dung công việc"
          />
        </Field>
        {!tours.length && (
          <p className="workspace-notice">
            Tạo một tour trong Quản lý tour trước khi giao công việc.
          </p>
        )}
        <Field label="Tour liên quan">
          <select
            name="tour_id"
            defaultValue={task?.tour_id || defaultTourId || ""}
            required
          >
            <option value="" disabled>
              Chọn tour
            </option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tài khoản phụ trách" hint="Mỗi việc có một người phụ trách. Danh sách gồm người đã nhận lời mời vào cùng không gian. Người nhận cần quyền sửa công việc để cập nhật trạng thái.">
          <select name="assignee_id" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} disabled={peopleLoading || busy}>
            <option value="">Nhập tên để theo dõi</option>
            {assigneeId && !people.some((person) => person.id === assigneeId) && <option value={assigneeId}>Tài khoản cũ — cần chọn lại</option>}
            {people.map((person) => <option key={person.id} value={person.id}>{taskPersonLabel(person)}</option>)}
          </select>
        </Field>
        <div className="task-people-status">
          {peopleLoading ? <p role="status">Đang tải người phụ trách…</p> : <>
            {peopleError && <p role="alert">Chưa tải được danh sách người phụ trách: {peopleError}</p>}
            {!peopleError && people.length < 2 && <p>Mời thêm nhân viên tại Tài khoản & nhóm, rồi tải lại danh sách sau khi họ nhận lời mời.</p>}
            {people.find((person) => person.id === assigneeId)?.can_edit_tasks === false && <p>Người này chỉ theo dõi công việc. Chủ không gian có thể kiểm tra vai trò và quyền tại Tài khoản & nhóm.</p>}
          </>}
          <button type="button" className="text-btn" onClick={loadPeople} disabled={peopleLoading || busy}>Tải lại người phụ trách</button>
        </div>
        {!assigneeId && <Field label="Tên người phụ trách" hint="Tên nhập tay không được tự gắn với tài khoản cùng tên.">
          <input
            name="assignee"
            defaultValue={task?.assignee || ""}
            required
            maxLength="80"
            placeholder="Nhập tên người phụ trách"
          />
        </Field>}
        <div className="form-grid">
          <Field label="Hạn hoàn thành">
            <input
              name="due"
              type="date"
              defaultValue={task?.due || ""}
              required
            />
          </Field>
          <Field label="Ưu tiên">
            <select name="priority" defaultValue={task?.priority || "normal"}>
              <option value="normal">Bình thường</option>
              <option value="high">Cao</option>
            </select>
          </Field>
        </div>
        {task && (
          <Field label="Trạng thái">
            <select name="status" defaultValue={task.status}>
              {Object.entries(statuses).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        )}
        {confirmDelete && (
          <div className="delete-confirm" role="alert">
            <strong>Xóa công việc này?</strong>
            <p>Tour và các công việc khác được giữ nguyên.</p>
            <Button
              type="button"
              variant="danger"
              disabled={busy}
              onClick={remove}
            >
              Xác nhận xóa công việc
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              Giữ công việc
            </Button>
          </div>
        )}
        <div className="modal-actions">
          {task && !confirmDelete && (
            <Button
              type="button"
              variant="danger"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              Xóa công việc
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button disabled={busy || peopleLoading || !tours.length}>
            {busy ? "Đang lưu…" : task ? "Lưu công việc" : "Giao công việc"}
            <Check size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Dashboard({
  data,
  access,
  onNav,
  onTask,
  onTour,
  onPortal,
  readOnly = false,
  showTrial = false,
  reload,
  notify,
}) {
  const pending = data.tasks.filter((t) => t.status !== "done"),
    done = data.tasks.filter((t) => t.status === "done");
  const tourById = Object.fromEntries(data.tours.map((t) => [t.id, t]));
  const stats = [
    [
      "Hành trình đang mở",
      data.tours.filter((t) => t.published).length,
      Compass,
      "Thông tin sẵn sàng trên cổng tour",
    ],
    [
      "Chỗ còn sẵn",
      data.tours
        .filter((t) => t.published)
        .reduce((s, t) => s + t.capacity - t.reserved, 0),
      Users,
      "Theo dữ liệu điều hành hiện tại",
    ],
    [
      "Công việc cần theo dõi",
      pending.length,
      ListTodo,
      `${done.length} công việc đã hoàn thành`,
    ],
    [
      "Yêu cầu mới",
      data.inquiries.filter((i) => i.status === "new").length,
      Inbox,
      "Chờ đội ngũ liên hệ tư vấn",
    ],
  ].filter((s) => s[0] !== "Yêu cầu mới" || access.canReadInquiries);
  return (
    <>
      {showTrial && <DemoLoader data={data} reload={reload} notify={notify} />}
      <div className="stat-grid">
        {stats.map(([label, value, Icon, note]) => (
          <div className="stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <Icon size={18} />
            </div>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-lower">
        <section className="panel">
          <div className="panel-header">
            <h3>
              Công việc cần theo dõi{" "}
              <span className="count">{pending.length}</span>
            </h3>
            <button className="text-btn" onClick={() => onNav("tasks")}>
              Xem tất cả
              <ChevronRight size={16} />
            </button>
          </div>
          {pending.length ? (
            pending.slice(0, 5).map((t) => (
              <div className="task-row" key={t.id}>
                <span className={"task-indicator " + t.status} />
                <div>
                  <strong>{t.title}</strong>
                  <small>
                    {tourById[t.tour_id]?.title} · {t.assignee}
                  </small>
                </div>
                <Badge tone={t.priority === "high" ? "orange" : "gray"}>
                  {date(t.due).slice(0, 5)}
                </Badge>
              </div>
            ))
          ) : (
            <Empty
              title={
                data.tasks.length
                  ? "Mọi việc đã được xử lý"
                  : "Chưa có công việc"
              }
            >
              Tạo một công việc để bắt đầu hành trình mới.
            </Empty>
          )}
          <button disabled={readOnly} className="panel-add" onClick={onTask}>
            <Plus size={16} />
            Giao công việc mới
          </button>
        </section>
        <section className="panel departures">
          <div className="panel-header">
            <h3>Sắp khởi hành</h3>
            <CalendarDays size={18} />
          </div>
          {data.tours
            .filter((t) => t.departure >= todayVN())
            .sort((a, b) => a.departure.localeCompare(b.departure))
            .slice(0, 3)
            .map((t) => (
              <button
                key={t.id}
                className="departure-row"
                onClick={() => onTour(t)}
              >
                <span className="date-block">
                  <strong>
                    {new Date(t.departure + "T12:00:00").getDate()}
                  </strong>
                  <small>
                    THÁNG {new Date(t.departure + "T12:00:00").getMonth() + 1}
                  </small>
                </span>
                <div>
                  <strong>{t.title}</strong>
                  <small>
                    {t.reserved}/{t.capacity} khách · {t.duration}
                  </small>
                </div>
                <ChevronRight size={17} />
              </button>
            ))}
          {!data.tours.some((t) => t.departure >= todayVN()) && (
            <Empty title="Chưa có lịch khởi hành sắp tới">
              Các tour đã qua ngày khởi hành vẫn nằm trong Quản lý tour.
            </Empty>
          )}
          <div className="soft-note">
            <CheckCheck size={18} />
            <p>
              Lịch và số chỗ được chia sẻ với cổng tour. Khách hàng thấy thay
              đổi khi cổng cập nhật.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

function Tasks({ data, onNew, onChange, onEdit, pendingId, readOnly = false, user }) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [dueFilter, setDueFilter] = useState("all"),
    [mine, setMine] = useState(false);
  const tours = Object.fromEntries(data.tours.map((t) => [t.id, t.title]));
  const visible = data.tasks.filter(
    (t) =>
      (!mine || t.assignee_id === user?.id) &&
      (!filter || t.tour_id === filter) &&
      (dueFilter === "all" ||
        (dueFilter === "overdue" && t.status !== "done" && t.due < todayVN()) ||
        (dueFilter === "today" && t.due === todayVN()) ||
        (dueFilter === "high" && t.priority === "high")) &&
      normalizeSearchText(t.title + " " + t.assignee)
        .includes(normalizeSearchText(query)),
  );
  return (
    <>
      <div className="filter-bar">
        {user?.id && <label className="checkbox"><input type="checkbox" checked={mine} onChange={(event) => setMine(event.target.checked)} />Việc của tôi</label>}
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Tìm công việc"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm công việc, người phụ trách…"
          />
        </label>
        <select
          aria-label="Lọc tour"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Tất cả tour</option>
          {data.tours.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc hạn và ưu tiên"
          value={dueFilter}
          onChange={(e) => setDueFilter(e.target.value)}
        >
          <option value="all">Mọi thời hạn</option>
          <option value="overdue">Việc quá hạn</option>
          <option value="today">Đến hạn hôm nay</option>
          <option value="high">Ưu tiên cao</option>
        </select>
      </div>
      <div className="task-filter-count">
        {visible.length} / {data.tasks.length} công việc ·{" "}
        {
          data.tasks.filter((t) => t.status !== "done" && t.due < todayVN())
            .length
        }{" "}
        quá hạn{" "}
        {Boolean(query || filter || dueFilter !== "all" || mine) && (
          <button
            className="text-btn"
            onClick={() => {
              setQuery("");
              setFilter("");
              setDueFilter("all");
              setMine(false);
            }}
          >
            Xóa bộ lọc công việc
          </button>
        )}
      </div>
      <div className="kanban">
        {Object.entries(statuses).map(([status, label]) => (
          <section className={"kanban-column " + status} key={status}>
            <div className="kanban-heading">
              <h3>
                <span className={"task-indicator " + status} />
                {label}
              </h3>
              <span className="count">
                {visible.filter((t) => t.status === status).length}
              </span>
            </div>
            {visible
              .filter((t) => t.status === status)
              .map((t) => (
                <article
                  className="task-card"
                  key={t.id}
                  data-track-entity={t.id}
                >
                  <div className="task-label">{tours[t.tour_id]}</div>
                  <h3>
                    {readOnly ? (
                      t.title
                    ) : (
                      <button
                        className="task-title"
                        aria-label={"Sửa " + t.title}
                        data-track="task:edit"
                        onClick={() => onEdit(t)}
                      >
                        {t.title}
                      </button>
                    )}
                  </h3>
                  {t.status !== "done" && t.due < todayVN() && (
                    <span className="task-overdue">Quá hạn</span>
                  )}
                  <div className="task-card-meta">
                    <Badge tone={t.priority === "high" ? "orange" : "gray"}>
                      {t.priority === "high" ? "Ưu tiên cao" : "Bình thường"}
                    </Badge>
                    <span>
                      <CalendarDays size={13} />
                      {date(t.due).slice(0, 5)}
                    </span>
                  </div>
                  <div className="task-card-bottom">
                    <span className="avatar">
                      {t.assignee.split(" ").at(-1).slice(0, 1)}
                    </span>
                    <span>{t.assignee}</span>
                  </div>
                  <select
                    disabled={readOnly || pendingId === t.id}
                    aria-label={"Trạng thái " + t.title}
                    value={t.status}
                    onChange={(e) => onChange(t, e.target.value)}
                  >
                    {Object.entries(statuses).map(([s, l]) => (
                      <option key={s} value={s}>
                        {l}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            {!visible.some((t) => t.status === status) && (
              <div className="kanban-empty">Chưa có công việc</div>
            )}
            {status === "todo" && !readOnly && (
              <button className="panel-add" onClick={onNew}>
                <Plus size={16} />
                Thêm công việc
              </button>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

function Workspace({ user, onLogout, onPortal, notify }) {
  const pending = useRef(0);
  const latest = useRef(0);
  const [permission, setPermission] = useState(user.workspace_permission);
  const readOnly = user.role === "reviewer" || permission === "viewer";
  const [nav, setNav] = useState("dashboard"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [editor, setEditor] = useState(null),
    [menu, setMenu] = useState(false),
    [query, setQuery] = useState(""),
    [tourFilter, setTourFilter] = useState("all"),
    [lastSuccess, setLastSuccess] = useState(null),
    [pendingTask, setPendingTask] = useState(""),
    [pendingLead, setPendingLead] = useState(""),
    [leadQuery, setLeadQuery] = useState(""),
    [leadStatus, setLeadStatus] = useState("");
  const [poolTourFilter, setPoolTourFilter] = useState("");
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [planningDirty, setPlanningDirty] = useState(false);
  const [quoteDirty, setQuoteDirty] = useState(false);
  const leaveUnsaved = () => (!planningDirty && !quoteDirty) || confirm("Có thay đổi chưa lưu. Rời khỏi và bỏ thay đổi?");
  const changeNav = (id) => { if(id!==nav && leaveUnsaved()) {setPlanningDirty(false);setQuoteDirty(false);setNav(id);} };
  const access = data?.access || workspaceAccess({ ...user, workspace_permission: permission });
  const [mobile, setMobile] = useState(
    () => matchMedia("(max-width: 650px)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(max-width: 650px)");
    const update = () => {
      setMobile(media.matches);
      if (!media.matches) setMenu(false);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!menu || !mobile) return;
    const before = document.activeElement;
    document.querySelector(".drawer-close")?.focus();
    const close = (e) => {
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") {
        const controls = [...document.querySelectorAll(
          '#workspace-nav button:not(:disabled), #workspace-nav a[href]',
        )].filter((el) => el.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("keydown", close);
      before?.focus();
    };
  }, [menu, mobile]);
  const reload = useCallback(async () => {
    const request = ++latest.current;
    pending.current += 1;
    try {
      const d = await api("/workspace");
      if (request !== latest.current) return;
      setData(d);
      setPermission(d.workspace_permission || user.workspace_permission);
      setError("");
      setLastSuccess(Date.now());
      return d;
    } finally {
      pending.current -= 1;
    }
  }, []);
  useEffect(() => {
    return startPolling(reload, {
      isBusy: () => pending.current > 0,
      onError: (e) => setError(e.message),
    });
  }, [reload]);
  async function changeTask(t, status) {
    setPendingTask(t.id);
    try {
      await api("/tasks/" + t.id, "PATCH", { status, version: t.version });
      await reload();
      notify("Đã cập nhật trạng thái công việc.");
    } catch (e) {
      notify(e.message, "error");
      if (e.status === 409) await reload().catch(() => {});
    } finally {
      setPendingTask("");
    }
  }
  async function changeLead(i, status) {
    setPendingLead(i.id);
    try {
      await api("/inquiries/" + i.id, "PATCH", { status, version: i.version });
      await reload();
      notify("Đã cập nhật yêu cầu.");
    } catch (e) {
      if (e.status === 409) {
        try {
          await reload();
          notify("Yêu cầu đã thay đổi. Đã tải lại; kiểm tra trạng thái mới trước khi sửa.", "error");
        } catch (refreshError) {
          setError(refreshError.message);
          notify("Yêu cầu đã thay đổi. Chưa tải được bản mới; bấm Thử tải lại trước khi sửa.", "error");
        }
      } else notify(e.message, "error");
    } finally {
      setPendingLead("");
    }
  }
  async function openCatalog() {
    if (catalogLoading) return;
    if (catalog) { setEditor({ type: "catalog" }); return; }
    setCatalogLoading(true);
    try {
      const result = await api("/catalog");
      setCatalog(result);
      setEditor({ type: "catalog" });
    } catch (e) { notify(e.message, "error"); }
    finally { setCatalogLoading(false); }
  }
  async function deleteAccount() {
    const staff = user.role === "staff";
    if (!confirm(staff
      ? "Xóa tài khoản nhân viên của bạn? Dữ liệu chung của đội ngũ được giữ lại."
      : "Xóa tài khoản, nhân viên được mời và toàn bộ dữ liệu trong không gian dùng thử của bạn? Thao tác này không thể hoàn tác.")) return;
    try {
      await api("/account", "DELETE");
      onLogout();
      notify(staff ? "Đã xóa tài khoản nhân viên. Dữ liệu chung được giữ lại." : "Đã xóa tài khoản và dữ liệu.");
    } catch (error) { notify(error.message, "error"); }
  }
  async function refreshEditor() {
    const d = await reload();
    if (!d) throw Error("Chưa tải được bản mới. Thử lại sau.");
    setEditor((current) => {
      if (!current) return current;
      const kind =
        current.type === "task"
          ? "tasks"
          : current.type === "pooling"
            ? "pooling"
            : "tours";
      const record = current.task || current.pool || current.tour;
      if (!record) return current;
      const found = d[kind].find((r) => r.id === record.id);
      if (!found) {
        notify("Bản ghi đã bị xóa.", "error");
        return null;
      }
      return {
        ...current,
        [current.task ? "task" : current.pool ? "pool" : "tour"]: found,
      };
    });
    return d;
  }
  const visibleLeads = (data?.inquiries || []).filter(
    (i) =>
      (!leadStatus || i.status === leadStatus) &&
      normalizeSearchText(i.name + " " + i.email + " " + i.tour_title)
        .includes(normalizeSearchText(leadQuery)),
  );
  const detailTour = editor?.tour && data?.tours.find((tour) => tour.id === editor.tour.id);
  const allowedNav = navItems.filter(([id]) =>
    (id !== "inbox" || access.canReadInquiries) &&
    (id !== "quotes" || access.canReadInquiries) &&
    (id !== "pooling" || access.canReadPooling) &&
    (id !== "business" || access.canReadPlanning),
  );
  useEffect(() => {
    if (!allowedNav.some(([id]) => id === nav)) { setNav("dashboard"); setEditor(null); }
  }, [nav, access.canReadInquiries, access.canReadPooling, access.canReadPlanning]);
  const current = allowedNav.find((i) => i[0] === nav);
  const minimumReserved = (id) =>
    (data?.pooling || [])
      .filter((p) => p.tour_id === id && p.status === "confirmed")
      .reduce((sum, p) => sum + p.seats, 0);
  const visibleTours =
    data?.tours.filter(
      (t) =>
        (tourFilter === "all" ||
          (tourFilter === "published" && t.published) ||
          (tourFilter === "draft" && !t.published) ||
          (tourFilter === "past" && t.departure < todayVN()) ||
          (tourFilter === "upcoming" && t.departure >= todayVN())) &&
        matchesTourSearch(t, query),
    ) || [];
  const descriptions = {
    dashboard: "Lịch khởi hành, số chỗ và công việc cần theo dõi.",
    analytics: "Phân tích lịch tour, công việc và đối soát từ dữ liệu của không gian.",
    tours: "Dữ liệu điều hành và cổng khách hàng cùng một nguồn.",
    tasks: "Theo dõi người phụ trách, thời hạn và trạng thái công việc.",
    quotes: "Soạn báo giá theo số khách, gửi duyệt và xuất bản đã được xác nhận.",
    pooling: "Một nơi xác nhận khách ghép và theo dõi số tiền còn phải thu.",
    inbox: "Tiếp nhận yêu cầu ngay cả ngoài giờ làm việc.",
    account: "Gửi lời mời và phân quyền cho người cùng làm việc.",
    workflow: "Các bước vận hành, người phụ trách và phạm vi của từng vai trò.",
    business: "Bản nháp nội bộ: lượng hóa giá trị, soạn gói và dự tính doanh thu.",
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace-main">
        Đến nội dung chính
      </a>
      {menu && (
        <button
          className="drawer-backdrop"
          aria-label="Đóng menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        id="workspace-nav"
        inert={mobile && !menu ? true : undefined}
        className={"sidebar " + (menu ? "open" : "")}
      >
        <button
          className="icon-btn drawer-close"
          aria-label="Đóng menu điều hành"
          onClick={() => setMenu(false)}
        >
          <X size={20} />
        </button>
        <Logo />
        <div className="nav-caption">KHÔNG GIAN LÀM VIỆC</div>
        <nav>
          {allowedNav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={nav === id ? "active" : ""}
              aria-current={nav === id ? "page" : undefined}
              data-track={"nav:" + id}
              onClick={() => {
                changeNav(id);
                setMenu(false);
              }}
            >
              <Icon size={19} />
              {label}
              {id === "inbox" &&
                !!data?.inquiries.filter((i) => i.status === "new").length && (
                  <span className="nav-count">
                    {data.inquiries.filter((i) => i.status === "new").length}
                  </span>
                )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <Globe size={20} />
            <strong>
              Cổng thông tin tour
            </strong>
            <button onClick={()=>{if(leaveUnsaved())onPortal();}}>
              Mở cổng khách hàng
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="profile">
            <span className="avatar">{user.name[0]}</span>
            <div>
              <strong>{user.name}</strong>
              <small>
                {access.label}{readOnly ? " · chỉ xem" : ""}
              </small>
            </div>
            <button
              className="icon-btn"
              title="Đăng xuất"
              aria-label="Đăng xuất"
              onClick={()=>{if(leaveUnsaved())onLogout();}}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="app-body" inert={mobile && menu ? true : undefined}>
        <header className="app-topbar">
          <button
            className="icon-btn mobile-menu"
            aria-label="Mở menu"
            aria-expanded={menu}
            aria-controls="workspace-nav"
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </button>
          <span className="breadcrumb">
            Không gian làm việc
            <ChevronRight size={13} />
            <strong>{current?.[1]}</strong>
          </span>
          <div className="topbar-right">
            <Badge tone="blue">
              <span className="live-dot" />
              {user.workspace === "agency" ? "Dữ liệu giả lập" : "Bản dùng thử"}
            </Badge>
            <button className="text-btn" onClick={()=>{if(leaveUnsaved())onPortal();}}>
              <Globe size={16} />
              Cổng khách hàng
              <ArrowUpRight size={14} />
            </button>
          </div>
        </header>
        <main id="workspace-main" className="app-main">
          <div className="page-title">
            <div>
              <div className="eyebrow blue">
                TASKHUB · ĐIỀU HÀNH TOUR
              </div>
              <h1>{current?.[1]}</h1>
              <p>{descriptions[nav]}</p>
            </div>
            <div className="button-row">
              {nav === "dashboard" && (
                <span className="today">
                  <CalendarDays size={16} />
                  {date(todayVN())}
                </span>
              )}
              {nav === "tours" && access.canEditTours && (
                <Button
                  variant="ghost"
                  onClick={() => setEditor({ type: "import" })}
                >
                  <Upload size={17} />
                  Nhập Excel
                </Button>
              )}
              {nav === "tours" && access.canEditTours && (
                <Button
                  variant="ghost"
                  disabled={catalogLoading}
                  onClick={openCatalog}
                >
                  <Compass size={17} />
                  {catalogLoading ? "Đang tải danh mục…" : "Danh mục Én Việt"}
                </Button>
              )}
              {nav === "tours" && access.canEditTours && (
                <Button onClick={() => setEditor({ type: "tour" })}>
                  <Plus size={17} />
                  Tạo tour
                </Button>
              )}
              {nav === "tasks" && access.canEditTasks && (
                <Button variant="ghost" onClick={() => setEditor({type:"task-templates"})}>
                  <ListTodo size={17} /> Mẫu công việc
                </Button>
              )}
              {nav === "tasks" && access.canEditTasks && (
                <Button
                  disabled={!data?.tours.length}
                  onClick={() => setEditor({ type: "task" })}
                >
                  <Plus size={17} />
                  Giao công việc
                </Button>
              )}
              {nav === "pooling" && access.canManageDeals && (
                <Button
                  disabled={!data?.tours.length}
                  onClick={() => setEditor({ type: "pooling" })}
                >
                  <Plus size={17} />
                  Tạo phiếu ghép
                </Button>
              )}
            </div>
          </div>
          <div className="workspace-sync">
            {user.workspace === "agency" && <span className="demo-data-label">Dữ liệu giả lập</span>}
            <SyncStatus lastSuccess={lastSuccess} error={error} compact />
          </div>
          <ErrorBox error={error} />
          {error && (
            <div className="connection-recovery">
              <p>
                {data
                  ? "Dữ liệu hiển thị có thể chưa phải bản mới nhất."
                  : "Chưa tải được không gian làm việc."}
              </p>
              <Button
                variant="ghost"
                onClick={() => reload().catch((e) => setError(e.message))}
              >
                <RefreshCw size={16} />
                Thử tải lại
              </Button>
            </div>
          )}
          {!data ? (
            <p className="loading">Đang tải không gian làm việc…</p>
          ) : (
            <>
              {nav === "dashboard" && (
                <Dashboard
                  access={access}
                  readOnly={!access.canEditTasks}
                  showTrial={
                    !["admin", "reviewer", "staff"].includes(user.role)
                  }
                  reload={reload}
                  notify={notify}
                  data={data}
                  onNav={setNav}
                  onTask={() => setEditor({ type: "task" })}
                  onTour={(t) => setEditor({ type: "detail", tour: t })}
                  onPortal={onPortal}
                />
              )}{" "}
              {nav === "tours" && (
                <>
                  <div className="filter-bar">
                    <label className="search">
                      <Search size={18} />
                      <input
                        aria-label="Tìm tour nội bộ"
                        placeholder="Tìm hành trình hoặc điểm đến…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Lọc trạng thái tour"
                      value={tourFilter}
                      onChange={(e) => setTourFilter(e.target.value)}
                    >
                      <option value="all">Tất cả tour</option>
                      <option value="published">Đang công khai</option>
                      <option value="draft">Bản nháp</option>
                      <option value="upcoming">Chưa khởi hành</option>
                      <option value="past">Đã khởi hành</option>
                    </select>
                    <span className="muted">
                      {visibleTours.length} / {data.tours.length} hành trình
                    </span>
                  </div>
                  <div className="tour-grid">
                    {visibleTours.map((t) => (
                      <TourCard
                        key={t.id}
                        tour={t}
                        onOpen={(tour) => setEditor({ type: "detail", tour })}
                        onEdit={access.canEditTours ? (tour) => setEditor({ type: "tour", tour }) : undefined}
                        onSeats={
                          !access.canEditTours
                            ? undefined
                            : (tour) => setEditor({ type: "seats", tour })
                        }
                        onTask={
                          !access.canEditTasks
                            ? undefined
                            : (tour) => setEditor({ type: "task", tour })
                        }
                        internal
                      />
                    ))}
                  </div>
                  {!visibleTours.length && (
                    <Empty
                      title={
                        query
                          ? "Không tìm thấy hành trình"
                          : "Chưa có hành trình"
                      }
                    >
                      {query || tourFilter !== "all"
                        ? "Thử từ khóa khác hoặc xóa bộ lọc."
                        : "Tạo một tour để bắt đầu."}
                      {(query || tourFilter !== "all") && (
                        <button
                          className="text-btn"
                          onClick={() => {
                            setQuery("");
                            setTourFilter("all");
                          }}
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </Empty>
                  )}
                </>
              )}
              {nav === "tasks" && (
                <Tasks
                  user={user}
                  readOnly={!access.canEditTasks}
                  data={data}
                  onNew={() => setEditor({ type: "task" })}
                  onChange={changeTask}
                  onEdit={(task) => setEditor({ type: "task", task })}
                  pendingId={pendingTask}
                />
              )}{" "}
              {nav === "pooling" && access.canReadPooling && (
                <Pooling
                  data={data}
                  simulated={user.workspace === "agency"}
                  tourFilter={poolTourFilter}
                  onTourFilter={setPoolTourFilter}
                  readOnly={readOnly}
                  canManageDeals={access.canManageDeals}
                  canRecordReceipts={access.canRecordReceipts}
                  onNew={() => setEditor({ type: "pooling" })}
                  onPayment={(pool) => setEditor({ type: "pooling", pool })}
                  reload={reload}
                  notify={notify}
                />
              )}
              {nav === "quotes" && access.canReadInquiries && (
                <Quotes user={user} access={access} tours={data.tours} notify={notify} onDirtyChange={setQuoteDirty} />
              )}
              {nav === "inbox" && access.canReadInquiries && (
                <section className="panel">
                  <div className="panel-header">
                    <h3>
                      Yêu cầu tư vấn{" "}
                      <span className="count">{data.inquiries.length}</span>
                    </h3>
                  </div>
                  <div className="filter-bar inquiry-filters">
                    <label className="search">
                      <Search size={17} />
                      <input
                        aria-label="Tìm yêu cầu tư vấn"
                        value={leadQuery}
                        onChange={(e) => setLeadQuery(e.target.value)}
                        placeholder="Tên, email hoặc tour…"
                      />
                    </label>
                    <select
                      aria-label="Lọc trạng thái tư vấn"
                      value={leadStatus}
                      onChange={(e) => setLeadStatus(e.target.value)}
                    >
                      <option value="">Mọi trạng thái</option>
                      <option value="new">Mới</option>
                      <option value="contacted">Đã liên hệ</option>
                      <option value="closed">Đã đóng</option>
                    </select>
                  </div>
                  {visibleLeads.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Khách hàng</th>
                            <th>Hành trình</th>
                            <th>Số khách</th>
                            <th>Ghi chú</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleLeads.map((i) => (
                            <tr key={i.id}>
                              <td>
                                <strong>{i.name}</strong>
                                <small>{i.email}</small>
                              </td>
                              <td>{i.tour_title}</td>
                              <td>{i.people}</td>
                              <td>{i.note || "—"}</td>
                              <td>
                                <select
                                  disabled={!access.canEditInquiries || pendingLead === i.id}
                                  aria-label={
                                    "Trạng thái yêu cầu của " + i.name
                                  }
                                  value={i.status}
                                  onChange={(e) =>
                                    changeLead(i, e.target.value)
                                  }
                                >
                                  <option value="new">Mới</option>
                                  <option value="contacted">Đã liên hệ</option>
                                  <option value="closed">Đã đóng</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title={
                        leadQuery || leadStatus
                          ? "Không có yêu cầu phù hợp"
                          : "Chưa có yêu cầu mới"
                      }
                    >
                      {leadQuery || leadStatus ? (
                        <>
                          <span>Thử từ khóa hoặc trạng thái khác.</span>
                          <button
                            className="text-btn"
                            onClick={() => {
                              setLeadQuery("");
                              setLeadStatus("");
                            }}
                          >
                            Xóa bộ lọc tư vấn
                          </button>
                        </>
                      ) : (
                        "Yêu cầu khách gửi từ tour đã công khai sẽ được lưu tại đây."
                      )}
                    </Empty>
                  )}
                </section>
              )}
              {nav === "account" && (
                <AccountSettings user={{...user, department: data.department, workspace_permission: permission}} notify={notify} onDelete={deleteAccount} />
              )}
              {nav === "workflow" && <Workflow data={data} access={access} onNav={setNav} />}
              {nav === "analytics" && <Analytics access={access} />}
              {nav === "business" && access.canReadPlanning && <BusinessPlanning access={access} notify={notify} onDirtyChange={setPlanningDirty} />}
            </>
          )}
          <footer className="app-footer">
            <span>TaskHub · Điều hành tour · 0.8.0</span>
            <span>Tour · Lịch / số chỗ · Công việc</span>
          </footer>
        </main>
      </div>
      {(editor?.type === "detail" || (editor?.type === "tour" && !access.canEditTours)) && detailTour && (
        <TourDetails
          tour={detailTour}
          workspace={user.workspace}
          internal
          readOnly={!access.canEditTours}
          onEdit={access.canEditTours ? () => setEditor({ type: "tour", tour: detailTour }) : undefined}
          onClose={() => setEditor(null)}
          notify={notify}
        />
      )}
      {editor?.type === "detail" && data && !detailTour && (
        <Modal title="Tour không còn tồn tại" onClose={() => setEditor(null)}>
          <p>Tour đã bị xóa. Danh sách đã cập nhật; hãy chọn một tour khác.</p>
          <Button onClick={() => setEditor(null)}>Về danh sách tour</Button>
        </Modal>
      )}
      {editor?.type === "tour" && access.canEditTours && (
        <TourEditor
          tour={editor.tour}
          prefill={editor.prefill}
          minimumReserved={minimumReserved(editor.tour?.id)}
          pooling={data?.pooling || []}
          onRelatedPooling={(id) => {
            setEditor(null);
            setPoolTourFilter(id);
            setNav("pooling");
          }}
          onClose={() => setEditor(null)}
          onRefresh={refreshEditor}
          onSave={async () => {
            await reload();
            notify("Đã lưu tour. Cổng khách hàng sẽ cập nhật dữ liệu mới.");
          }}
        />
      )}
      {editor?.type === "task" && access.canEditTasks && (
        <TaskEditor
          canManageTeam={access.canManageTeam}
          tours={data.tours}
          defaultTourId={editor.tour?.id}
          task={editor.task}
          onRefresh={refreshEditor}
          onClose={() => setEditor(null)}
          onSave={async () => {
            await reload();
            notify(
              editor.task ? "Đã cập nhật công việc." : "Đã giao công việc.",
            );
          }}
        />
      )}
      {editor?.type === "task-templates" && access.canEditTasks && (
        <TaskTemplates tours={data.tours} canManageTeam={access.canManageTeam} notify={notify} onClose={() => setEditor(null)} onApplied={reload} onRefresh={reload} />
      )}
      {editor?.type === "catalog" && access.canEditTours && catalog && (
        <CatalogPicker
          catalog={catalog}
          onClose={() => setEditor(null)}
          onUse={(prefill) => setEditor({ type: "tour", prefill })}
        />
      )}
      {editor?.type === "import" && access.canEditTours && (
        <ImportTours
          onClose={() => setEditor(null)}
          onSave={async (count) => {
            await reload();
            notify(`Đã nhập ${count} tour dưới dạng bản nháp.`);
          }}
        />
      )}
      {editor?.type === "seats" && access.canEditTours && (
        <SeatEditor
          onRefresh={refreshEditor}
          tour={editor.tour}
          minimumReserved={minimumReserved(editor.tour.id)}
          onClose={() => setEditor(null)}
          onSave={async () => {
            await reload();
            notify("Đã cập nhật số khách. Portal sẽ đồng bộ số chỗ.");
          }}
        />
      )}
      {editor?.type === "pooling" && (editor.pool ? access.canRecordReceipts : access.canManageDeals) && (
        <PoolingEditor
          onRefresh={refreshEditor}
          tours={data.tours}
          pool={editor.pool}
          onClose={() => setEditor(null)}
          onSave={async () => {
            await reload();
            notify("Đã lưu phiếu ghép tour.");
          }}
        />
      )}
    </div>
  );
}

const { Auth, AccountLink, AccountSettings, OperationsEntry } = createAccountUI({
  Modal,
  Button,
  Field,
  ErrorBox,
  Badge,
  Logo,
  api,
});
const { DemoLoader } = createDemoUI({
  Button,
  ErrorBox,
  api,
});
const BusinessPlanning = createPlanningUI({Button, Field, ErrorBox, api, money});
const Quotes = createQuotesUI({Button, Field, Modal, ErrorBox, Badge, money, date, api});
const TaskTemplates = createTaskTemplatesUI({Button, Field, Modal, ErrorBox, api, date});
const { TourCard, CatalogPicker, Portal, TourDetails } = createPortalUI({
  Modal,
  Button,
  Field,
  ErrorBox,
  Empty,
  Badge,
  Logo,
  api,
  money,
  date,
  todayVN,
});
const { ImportTours, SeatEditor, PoolingEditor, Pooling } = createOperationsUI({
  Modal,
  Button,
  Field,
  ErrorBox,
  Empty,
  Badge,
  api,
  money,
  date,
});

function App() {
  const sessionRequest = useRef(0);
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [path, setPath] = useState(location.pathname),
    [auth, setAuth] = useState(null),
    [toast, setToast] = useState(null),
    [sessionError, setSessionError] = useState("");
  const [accountLink, setAccountLink] = useState(() => {
    if (typeof location === "undefined") return null;
    const q = new URLSearchParams(location.search);
    const kind = ["invite", "reset"].find((k) => q.has(k));
    return kind ? { kind, token: q.get(kind) } : null;
  });
  const navigate = (p) => {
    history.pushState({}, "", p);
    setPath(p);
    window.scrollTo(0, 0);
  };
  const loadSession = useCallback(async () => {
    const request = ++sessionRequest.current;
    try {
      const result = await api("/session");
      if (request !== sessionRequest.current) return;
      setUser(result.user);
      setSessionError("");
    } catch (e) {
      if (request === sessionRequest.current) setSessionError(e.message);
    } finally {
      if (request === sessionRequest.current) setReady(true);
    }
  }, []);
  const acceptUser = (u) => {
    // A delayed initial session check must not undo a completed sign-in.
    sessionRequest.current += 1;
    setUser(u);
    setReady(true);
    setSessionError("");
    navigate("/app");
  };
  useEffect(() => {
    // Remove account tokens before any interaction collection or external link.
    if (accountLink || new URLSearchParams(location.search).has("verify"))
      history.replaceState({}, "", location.pathname);
    const handler = () => setPath(location.pathname);
    window.addEventListener("popstate", handler);
    loadSession();
    return () => window.removeEventListener("popstate", handler);
  }, [loadSession]);
  useEffect(() => startInteractions(user), [user?.id]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  const notify = (text, tone = "success") => setToast({ text, tone });
  const logout = async () => {
    try {
      await flushInteractions();
      await api("/logout", "POST", {});
      sessionRequest.current += 1;
      setUser(null);
      navigate("/");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const isApp = path === "/app";
  const workspace = path.startsWith("/portal/") ? path.split("/")[2] : "agency";
  // Public tours do not depend on sign-in; load both requests in parallel.
  // Keep the private workspace and account links behind the session check.
  if (!ready && (isApp || accountLink))
    return (
      <div className="initial-loading">
        <Logo />
        <p>Đang mở TaskHub…</p>
      </div>
    );
  return (
    <>
      {sessionError && (
        <div className="session-recovery">
          <ErrorBox error={sessionError} />
          <button className="text-btn" onClick={loadSession}>
            Kiểm tra lại kết nối
          </button>
        </div>
      )}{" "}
      {isApp && user ? (
        <Workspace
          user={user}
          onLogout={logout}
          onPortal={() => navigate("/portal/" + user.workspace)}
          notify={notify}
        />
      ) : isApp ? (
        <OperationsEntry onAuth={setAuth} onPortal={() => navigate("/")} />
      ) : (
        <Portal
          workspace={workspace}
          user={user}
          onWorkspace={() => navigate("/app")}
          notify={notify}
        />
      )}{" "}
      {accountLink && (
        <AccountLink
          link={accountLink}
          onClose={() => setAccountLink(null)}
          refreshSession={loadSession}
          onUser={acceptUser}
        />
      )}
      {auth && !accountLink && (
        <Auth
          mode={auth}
          setMode={setAuth}
          onClose={() => setAuth(null)}
          onUser={acceptUser}
        />
      )}
      {toast && (
        <div className={"toast " + toast.tone} role="status">
          {toast.tone === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{toast.text}</span>
          <button
            className="icon-btn"
            aria-label="Đóng thông báo"
            onClick={() => setToast(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
