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
  HelpCircle,
  Send,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Globe,
  Mail,
} from "lucide-react";
import "./styles.css";

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
const trialSteps = [
  {
    title: "Tạo và cập nhật tour",
    description: "Nhập tour của bạn, sau đó thử sửa lịch hoặc số chỗ.",
    nav: "tours",
    actions: ["tour_updated"],
  },
  {
    title: "Xem cổng khách hàng",
    description: "Kiểm tra lịch và số chỗ sau khi vừa sửa.",
    nav: "portal",
    actions: ["portal_viewed"],
  },
  {
    title: "Giao và xử lý công việc",
    description: "Tạo một việc gắn với tour, rồi đổi trạng thái.",
    nav: "tasks",
    actions: ["task_created", "task_status_changed"],
  },
];
const stepDone = (step, actions) =>
  step.actions.every((action) => actions.has(action));
const roleNames = {
  operations: "Điều hành tour",
  sales: "Sales / Marketing",
  manager: "Quản lý / Chủ doanh nghiệp",
  other: "Khác",
};
const navItems = [
  ["dashboard", "Tổng quan", LayoutDashboard],
  ["tours", "Quản lý tour", Compass],
  ["tasks", "Công việc", ListTodo],
  ["inbox", "Yêu cầu tư vấn", Inbox],
  ["research", "Phản hồi MVP", BarChart3],
];
async function api(path, method = "GET", data) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const r = await fetch("/api" + path, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-TaskHub": "1" },
      signal: controller.signal,
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    let body;
    try {
      body = await r.json();
    } catch {
      throw Error("Không kết nối được hệ thống.");
    }
    if (!r.ok) throw Error(body.message || "Không thể thực hiện thao tác.");
    return body;
  } catch (error) {
    if (error.name === "AbortError")
      throw Error(
        "Máy chủ phản hồi chậm. Vui lòng thử lại; trước khi gửi lại thay đổi, kiểm tra dữ liệu đã được lưu chưa.",
      );
    if (error instanceof TypeError)
      throw Error("Mất kết nối. Kiểm tra mạng và thử lại.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function Landscape({ theme = "danang", large = false }) {
  const gradientId = useId();
  return (
    <svg
      className={"landscape " + (large ? "large" : "")}
      viewBox="0 0 600 360"
      role="img"
      aria-label={
        theme === "dalat"
          ? "Minh họa đồi thông"
          : theme === "phuquoc"
            ? "Minh họa biển"
            : "Minh họa phố cổ"
      }
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            stopColor={
              theme === "dalat"
                ? "#deedff"
                : theme === "phuquoc"
                  ? "#cce5ff"
                  : "#d5eaff"
            }
          />
          <stop offset="1" stopColor="#f1f7ff" />
        </linearGradient>
      </defs>
      <rect width="600" height="360" fill={`url(#${gradientId})`} />
      <circle cx="450" cy="83" r="34" fill="#fffbdf" />
      {theme === "dalat" ? (
        <>
          <path d="M0 214Q70 110 200 202Q350 76 600 186V360H0" fill="#9bbbcf" />
          <path
            d="M0 263Q230 148 390 263Q500 191 600 240V360H0"
            fill="#7599b5"
          />
          <path d="M0 329Q230 206 600 310V360H0" fill="#527594" />
          {[80, 155, 460, 535].map((x, i) => (
            <g key={x} transform={`translate(${x} ${190 + (i % 2) * 27})`}>
              <rect x="-4" width="8" height="90" fill="#465b48" />
              <path d="M0-80L-35 15H35Z M0-40L-46 45H46Z" fill="#315c4c" />
            </g>
          ))}
          <path d="M250 360L306 260L370 260L324 360" fill="#d6c3a1" />
        </>
      ) : theme === "phuquoc" ? (
        <>
          <path d="M0 176Q140 170 270 188T600 178V360H0" fill="#76afd8" />
          <path d="M0 238Q320 210 600 310V360H0" fill="#b4d6ed" />
          <path d="M0 290Q260 220 600 338V360H0" fill="#e5cfab" />
          <path
            d="M92 337Q110 160 155 90"
            stroke="#6a7861"
            strokeWidth="13"
            fill="none"
          />
          <path
            d="M149 110Q75 48 23 113Q96 104 149 125Q190 57 257 82Q200 99 156 131Q209 117 249 162Q184 156 150 136Q109 158 47 164Q83 123 149 110"
            fill="#456e60"
          />
          <path d="M285 231L345 215L392 231L380 240H295Z" fill="#fcf7e8" />
        </>
      ) : (
        <>
          <rect y="252" width="600" height="108" fill="#7aaccd" />
          <path
            d="M0 281Q170 246 340 279T600 267"
            stroke="#cce3f4"
            fill="none"
            strokeWidth="3"
          />
          {[15, 145, 285, 440].map((x, i) => (
            <g key={x}>
              <rect
                x={x}
                y={161 + (i % 2) * 18}
                width="116"
                height="107"
                fill={["#cfaa64", "#dec185", "#cfa570", "#e4c382"][i]}
              />
              <path
                d={`M${x - 9} ${169 + (i % 2) * 18}L${x + 56} ${115 + (i % 2) * 18}L${x + 125} ${169 + (i % 2) * 18}Z`}
                fill="#6e7764"
              />
              <rect x={x + 18} y="203" width="24" height="39" fill="#657765" />
              <rect x={x + 71} y="203" width="24" height="65" fill="#697461" />
              <circle cx={x + 58} cy="191" r="10" fill="#cf7655" />
            </g>
          ))}
          <path d="M400 315L494 312L479 326H410Z" fill="#354f49" />
          <path d="M459 304L459 253" stroke="#596d52" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}
function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark">
        <Compass size={25} />
      </span>
      taskhub<span className="logo-dot">.</span>
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
function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    const before = document.activeElement;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusable = [
          ...document.querySelectorAll(
            ".modal button:not(:disabled),.modal input,.modal select,.modal textarea,.modal a",
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
    document.querySelector(".modal input,.modal button")?.focus();
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
      >
        <header className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn" aria-label="Đóng" onClick={onClose}>
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

function Auth({ mode, setMode, onClose, onUser }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const register = mode === "register";
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.target);
    const data = Object.fromEntries(f);
    data.consent = f.get("consent") === "on";
    try {
      const result = await api(register ? "/register" : "/login", "POST", data);
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
      title={
        register
          ? "Cùng thử một cách làm việc mới"
          : "Chào mừng anh/chị trở lại"
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
              placeholder="Anh/chị muốn được gọi là gì?"
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
              ? "Tối thiểu 8 ký tự. Email nhập tại đây chưa được xác minh."
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
                  <option value="" disabled>Chọn vai trò của bạn</option>
                  <option value="operations">Điều hành tour</option>
                  <option value="sales">Sales / Marketing</option>
                  <option value="manager">Quản lý / Chủ doanh nghiệp</option>
                  <option value="other">Khác / Chưa làm du lịch</option>
                </select>
              </Field>
              <Field label="Quy mô doanh nghiệp">
                <select name="company_size" required defaultValue="">
                  <option value="" disabled>Chọn quy mô phù hợp</option>
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
                thao tác trong MVP để đánh giá CP3. Dữ liệu lưu tối đa khoảng 6
                tháng, nhóm và giảng viên được xem; email không xuất hiện trên
                cổng tour công khai. Không nhập thông tin khách hàng thật trong
                không gian dùng thử. Bạn có thể xóa dữ liệu của mình tại mục
                Hướng dẫn. Bản CSV đã xuất cần nhóm xóa riêng khi nhận yêu cầu.
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
        <p className="auth-switch">
          {register ? "Đã có tài khoản?" : "Muốn trải nghiệm MVP?"}{" "}
          <button
            type="button"
            className="text-btn"
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

function TourCard({ tour, onOpen, internal = false }) {
  const remaining = tour.capacity - tour.reserved;
  return (
    <article className="tour-card">
      <button
        className="cover-button"
        aria-label={"Xem " + tour.title}
        onClick={() => onOpen(tour)}
      >
        <Landscape theme={tour.theme} />
        <span className="cover-pill">
          <MapPin size={12} />
          {tour.destination}
        </span>
      </button>
      <div className="tour-card-body">
        <div className="eyebrow">
          {tour.duration} <span>•</span> KHỞI HÀNH {date(tour.departure)}
        </div>
        <button className="card-title" onClick={() => onOpen(tour)}>
          {tour.title}
          <ArrowUpRight size={19} />
        </button>
        <p>{tour.description}</p>
        <div className="tour-meta">
          <span>
            <Users size={15} />
            {remaining > 0 ? `Còn ${remaining} chỗ` : "Đã đủ khách"}
          </span>
          <strong>
            {money(tour.price)}
            <small>/ khách</small>
          </strong>
        </div>
        {internal && (
          <div className="occupancy">
            <div
              style={{ width: (100 * tour.reserved) / tour.capacity + "%" }}
            />
          </div>
        )}
        {internal && (
          <div className="card-bottom">
            <span>
              {tour.reserved}/{tour.capacity} khách
            </span>
            <Badge tone={tour.published ? "blue" : "gray"}>
              {tour.published ? "Đang công khai" : "Bản nháp"}
            </Badge>
          </div>
        )}
      </div>
    </article>
  );
}

function CatalogImage({ tour }) {
  const [failed, setFailed] = useState(false);
  return failed || !tour.image ? <div className="catalog-placeholder"><Compass size={42} strokeWidth={1.2} /><span>Đang cập nhật ảnh</span></div> : (
    <img className="catalog-image" src={tour.image} alt={tour.title}
      loading="lazy" decoding="async" referrerPolicy="no-referrer"
      onError={() => setFailed(true)} />
  );
}

function CatalogCard({ tour, onOpen }) {
  return (
    <article className="tour-card catalog-card">
      <button className="cover-button" aria-label={"Xem " + tour.title} onClick={() => onOpen(tour)}>
        <CatalogImage tour={tour} />
        <span className="cover-pill"><MapPin size={12} />{tour.destination}</span>
        {tour.image && <span className="catalog-image-note">Ảnh minh họa từ nguồn</span>}
      </button>
      <div className="tour-card-body">
        <div className="catalog-kicker"><span>{tour.code}</span><Badge tone="blue">Tham khảo</Badge></div>
        <div className="eyebrow">{tour.duration}</div>
        <button className="card-title" onClick={() => onOpen(tour)}>{tour.title}<ArrowUpRight size={19} /></button>
        <p>{tour.route}</p>
        <div className="catalog-departure"><CalendarDays size={15} /><span>{tour.departureNote} · Chưa chốt ngày</span></div>
        <div className="tour-meta catalog-price"><span>Giá tham khảo</span><strong>{tour.price === null ? "Liên hệ" : money(tour.price)}{tour.price !== null && <small>/ khách</small>}</strong></div>
      </div>
    </article>
  );
}

function CatalogDetails({ tour, source, onClose, onUse }) {
  return (
    <Modal title={tour.title} subtitle={tour.code + " · Danh mục tham khảo"} onClose={onClose} wide>
      <div className="catalog-detail-cover"><CatalogImage tour={tour} /></div>
      <div className="catalog-facts">
        <div><span>Thời lượng</span><strong>{tour.duration}</strong></div>
        <div><span>Giá tham khảo / khách</span><strong>{tour.price === null ? "Liên hệ" : money(tour.price)}</strong></div>
        <div><span>Lịch theo nguồn</span><strong>{tour.departureNote}</strong></div>
        <div><span>Hàng không theo nguồn</span><strong>{tour.airline || "Chưa nêu cụ thể"}</strong></div>
      </div>
      <div className="catalog-section"><h3>Tuyến hành trình</h3><p>{tour.route}</p></div>
      <div className="catalog-section"><h3>Điểm nổi bật</h3><ul>{tour.highlights.map(h => <li key={h}>{h}</li>)}</ul></div>
      <div className="catalog-source">
        <ShieldCheck size={19} />
        <div><strong>Cần xác nhận trước khi mở bán</strong>
          <p>Chưa có ngày khởi hành cụ thể, số chỗ và lịch trình từng ngày. Giá và lịch có thể thay đổi; danh mục này chưa nhận đặt chỗ.</p>
          <a href={tour.sourceUrl} target="_blank" rel="noopener noreferrer">Nguồn: {source.name}<ArrowUpRight size={14} /></a>
          <small>Ghi nhận ngày {date(source.capturedOn)}</small>
        </div>
      </div>
      <div className="modal-actions"><Button variant="ghost" onClick={onClose}>Xong</Button>
        {onUse && <Button onClick={() => onUse(tour)}>Dùng nội dung tour<ArrowRight size={16} /></Button>}
      </div>
    </Modal>
  );
}

function CatalogPicker({ catalog, onClose, onUse }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const tours = catalog.tours.filter(t => (t.title + " " + t.code + " " + t.destination).toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  if (selected) return <CatalogDetails tour={selected} source={catalog.source} onClose={() => setSelected(null)} onUse={tour => onUse({ ...tour, capturedOn: catalog.source.capturedOn })} />;
  return <Modal title="Danh mục tour Én Việt" subtitle="Chọn nội dung có sẵn, sau đó bổ sung dữ liệu vận hành." onClose={onClose} wide>
    <label className="search catalog-search"><Search size={18} /><input aria-label="Tìm trong danh mục" placeholder="Tên tour, mã hoặc điểm đến…" value={query} onChange={e => setQuery(e.target.value)} /></label>
    <div className="catalog-picker-list">{tours.map(t => <button className="catalog-picker-row" key={t.id} onClick={() => setSelected(t)}>
      <span><small>{t.code} · {t.destination}</small><strong>{t.title}</strong><span>{t.duration} · {t.price === null ? "Giá: Liên hệ" : money(t.price)}</span></span><ChevronRight size={19} />
    </button>)}</div>
    {!tours.length && <p className="muted">Không tìm thấy tour. Thử từ khóa khác.</p>}
  </Modal>;
}

function Portal({ workspace, user, onAuth, onWorkspace, notify }) {
  const pending = useRef(0);
  const latest = useRef(0);
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [destination, setDestination] = useState(""),
    [selected, setSelected] = useState(null),
    [reference, setReference] = useState(null),
    [last, setLast] = useState("");
  const load = useCallback(async () => {
    const request = ++latest.current;
    pending.current += 1;
    try {
      const d = await api("/public/" + workspace);
      if (request !== latest.current) return;
      setData(d);
      setLast(new Date().toLocaleTimeString("vi-VN"));
      setError("");
    } catch (e) {
      if (request === latest.current) setError(e.message);
    } finally {
      pending.current -= 1;
    }
  }, [workspace]);
  useEffect(() => {
    load();
    if (user && user.workspace === workspace)
      api("/events", "POST", { action: "portal_viewed" }).catch(() => {});
    const timer = setInterval(() => {
      if (!document.hidden && pending.current === 0) load();
    }, 5000);
    return () => clearInterval(timer);
  }, [load, user?.id]);
  const allTours = [...(data?.tours || []), ...(data?.catalog?.tours || [])];
  const matches = (t) =>
    (!destination || t.destination === destination) &&
    (t.title + " " + t.destination + " " + (t.code || "") + " " + (t.route || ""))
      .toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"));
  const references = (data?.catalog?.tours || []).filter(matches);
  const visible = (data?.tours || []).filter(matches);
  const open = (t) => {
    setSelected(t);
    if (user && user.workspace === workspace)
      api("/events", "POST", { action: "tour_viewed" }).catch(() => {});
  };
  return (
    <div className="portal">
      <a className="skip-link" href="#journeys">
        Đến danh sách tour
      </a>
      <header className="portal-nav">
        <a className="plain-link" href="/">
          <Logo />
        </a>
        <nav>
          <a href="#journeys">Cổng tour</a>
          <span className="nav-divider" />
          <Button
            variant="ghost"
            onClick={user ? onWorkspace : () => onAuth("login")}
          >
            {user ? "Về điều hành" : "Đăng nhập"}
            <ArrowUpRight size={16} />
          </Button>
          {!user && (
            <Button onClick={() => onAuth("register")}>
              Dùng thử TaskHub
              <ArrowRight size={16} />
            </Button>
          )}
        </nav>
      </header>
      <main>
        <div className="portal-hero">
          <div className="hero-copy">
            <div className="eyebrow blue">
              <span className="live-dot" />
              TASKHUB ·{" "}
              {workspace === "agency"
                ? "ĐIỀU HÀNH TOUR"
                : data?.agency || "CỔNG THÔNG TIN TOUR"}
            </div>
            <h1>
              Lịch rõ ràng.
              <br />
              Đội ngũ <em>cùng nhịp.</em>
            </h1>
            <p>
              Quản lý tour, lịch khởi hành và công việc tại một nơi. Thông tin
              được công khai từ điều hành để khách hàng cùng tra cứu.
            </p>
            <a className="btn" href="#journeys">
              Xem cổng tour
              <ArrowRight size={17} />
            </a>
            <div className="hero-trust">
              <ShieldCheck size={17} />
              Cùng một nguồn thông tin với đội ngũ điều hành
            </div>
          </div>
          <div className="capability-board" aria-label="Ba chức năng của TaskHub">
            <span className="eyebrow blue">MỘT NGUỒN THÔNG TIN</span>
            <h2>Từ điều hành<br />đến cổng khách hàng.</h2>
            {[
              [Compass, "Quản lý tour", "Lịch trình, ngày khởi hành, giá và số chỗ"],
              [Globe, "Cổng khách hàng", "Tra cứu thông tin tour đã công khai"],
              [ListTodo, "Công việc theo tour", "Người phụ trách, thời hạn và tiến độ"],
            ].map(([Icon, title, description]) => (
              <div className="capability-row" key={title}>
                <span className="capability-icon"><Icon size={22} /></span>
                <div><strong>{title}</strong><p>{description}</p></div>
                <Check size={16} aria-hidden="true" />
              </div>
            ))}
            <span className="capability-note"><RefreshCw size={14} /> Lịch và số chỗ dùng chung với điều hành</span>
          </div>
        </div>
        <section id="journeys" className="journeys">
          <div className="section-title">
            <div>
              <div className="eyebrow blue">THÔNG TIN TỪ ĐIỀU HÀNH</div>
              <h2>Cổng thông tin tour</h2>
            </div>
            <span className={"sync-note " + (error ? "stale" : "")}>
              {error ? <AlertCircle size={14} /> : <RefreshCw size={14} />}
              {error ? "Chưa thể cập nhật" : `Cập nhật ${last || "…"}`}
            </span>
          </div>
          <div className="filter-bar">
            <label className="search">
              <Search size={18} />
              <input
                aria-label="Tìm tour"
                placeholder="Tìm tên tour hoặc điểm đến…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="destination-select">
              <SlidersHorizontal size={16} />
              <select
                aria-label="Lọc điểm đến"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="">Tất cả điểm đến</option>
                {[
                  ...new Set(allTours.map((t) => t.destination)),
                ].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
          <ErrorBox error={error} />
          {error && (
            <div className="connection-recovery">
              <p>
                {data
                  ? "Đang hiển thị dữ liệu từ lần tải thành công gần nhất. Số chỗ có thể đã thay đổi."
                  : "Danh sách tour chưa tải được. Vui lòng thử lại khi kết nối ổn định."}
              </p>
              <Button variant="ghost" onClick={load}>
                <RefreshCw size={16} />
                Thử tải lại
              </Button>
            </div>
          )}
          {!data && !error ? (
            <p className="loading">Đang tải hành trình…</p>
          ) : visible.length ? (
            <div className="tour-grid">
              {visible.map((t) => (
                <TourCard key={t.id} tour={t} onOpen={open} />
              ))}
            </div>
          ) : data && !references.length ? (
            <Empty title={query || destination ? "Chưa có hành trình phù hợp" : "Chưa có tour công khai"}>
              {query || destination
                ? "Thử đổi điểm đến hoặc từ khóa tìm kiếm."
                : "Tour chỉ xuất hiện tại đây sau khi người quản lý nhập thông tin và chọn công khai."}
              {(query || destination) && (
                <button
                  className="text-btn"
                  onClick={() => {
                    setQuery("");
                    setDestination("");
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </Empty>
          ) : null}
          {!!references.length && <div className="reference-catalog">
            <div className="catalog-heading"><div><div className="eyebrow blue">DỮ LIỆU TOUR TỪ ÉN VIỆT</div><h3>Khám phá hành trình quốc tế</h3></div><span>{references.length} hành trình</span></div>
            <p className="catalog-intro">Tham khảo tuyến đi, điểm nổi bật và giá. Ngày khởi hành và số chỗ cần được xác nhận riêng.</p>
            <div className="tour-grid">{references.map(t => <CatalogCard key={t.id} tour={t} onOpen={setReference} />)}</div>
            <p className="catalog-attribution">Nguồn: <a href={data.catalog.source.url} target="_blank" rel="noopener noreferrer">{data.catalog.source.name}</a> · Ghi nhận {date(data.catalog.source.capturedOn)}. Thông tin tham khảo có thể thay đổi.</p>
          </div>}
          <div className="portal-notice">
            <ShieldCheck size={17} />
            <p>
              Tour có lịch và số chỗ được công khai từ điều hành.{data?.catalog && " Danh mục Én Việt là thông tin tham khảo."}
              Yêu cầu tư vấn không giữ chỗ và không tạo thanh toán.
            </p>
          </div>
        </section>
        <section className="portal-cta">
          <div>
            <div className="eyebrow">
              DÀNH CHO DOANH NGHIỆP LỮ HÀNH 10–50 NHÂN SỰ
            </div>
            <h2>Để mỗi chuyến đi vận hành trôi chảy.</h2>
            <p>
              Điều hành và Sales dùng chung lịch, số chỗ và công việc. Khách
              hàng tra cứu tour trên một cổng riêng.
            </p>
          </div>
          <Button
            variant="light"
            onClick={user ? onWorkspace : () => onAuth("register")}
          >
            {user ? "Mở điều hành" : "Trải nghiệm TaskHub"}
            <ArrowUpRight size={18} />
          </Button>
        </section>
      </main>
      <footer className="portal-footer">
        <Logo />
        <span>Ít thao tác hơn. Nhiều hành trình hơn.</span>
        <span>Quản lý tour · Cổng khách hàng · Công việc</span>
      </footer>
      {reference && <CatalogDetails tour={reference} source={data.catalog.source} onClose={() => setReference(null)} />}
      {selected && (
        <TourDetails
          tour={
            (data?.tours || []).find((t) => t.id === selected.id) || selected
          }
          workspace={workspace}
          onClose={() => setSelected(null)}
          notify={notify}
        />
      )}
    </div>
  );
}

function TourDetails({ tour, workspace, onClose, notify, readOnly = false }) {
  const [booking, setBooking] = useState(false),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.target);
    try {
      const result = await api("/public/" + workspace + "/inquiries", "POST", {
        ...Object.fromEntries(f),
        people: Number(f.get("people")),
        tour_id: tour.id,
        consent: f.get("consent") === "on",
      });
      setSent(true);
      notify(result.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={tour.title}
      subtitle={tour.destination + " · " + tour.duration}
      onClose={onClose}
      wide
    >
      <div className="detail-cover">
        <Landscape theme={tour.theme} />
      </div>
      <div className="detail-facts">
        <span>
          <CalendarDays size={17} />
          {date(tour.departure)}
        </span>
        <span>
          <Users size={17} />
          Còn {tour.capacity - tour.reserved} chỗ
        </span>
        <strong>{money(tour.price)} / khách</strong>
      </div>
      <p className="detail-description">{tour.description}</p>
      <h3>Lịch trình dự kiến</h3>
      <div className="itinerary">
        {tour.itinerary.split("\n").map((line, i) => (
          <div key={i}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <p>{line}</p>
          </div>
        ))}
      </div>
      <p className="muted">
        Thông tin do người quản lý tour cung cấp. Chi tiết dịch vụ cần được xác nhận trước khi đặt tour.
      </p>
      {readOnly ? (
        <p className="workspace-notice">Chế độ xem dành cho người đánh giá.</p>
      ) : sent ? (
        <div className="success">
          <CheckCircle2 size={20} />
          Đã gửi yêu cầu. Đây chưa phải xác nhận đặt tour.
        </div>
      ) : booking ? (
        <form onSubmit={submit}>
          <h3>Gửi yêu cầu tư vấn</h3>
          <ErrorBox error={error} />
          <div className="form-grid">
            <Field label="Tên">
              <input name="name" required maxLength="80" />
            </Field>
            <Field label="Email">
              <input name="email" type="email" required maxLength="254" />
            </Field>
          </div>
          <Field label="Số khách">
            <input
              name="people"
              type="number"
              min="1"
              max={Math.max(1, tour.capacity - tour.reserved)}
              defaultValue="1"
              required
            />
          </Field>
          <Field label="Ghi chú">
            <textarea name="note" maxLength="1000" rows="2" />
          </Field>
          <label className="checkbox">
            <input name="consent" type="checkbox" required />
            <span>
              Tôi đồng ý để nhóm dùng thông tin này liên hệ tư vấn và kiểm thử
              MVP, lưu tối đa khoảng 6 tháng. Thông tin không được công khai. Có
              thể yêu cầu nhóm xóa; với bản dùng thử, hãy dùng dữ liệu giả.
            </span>
          </label>
          <Button disabled={busy}>
            {busy ? "Đang gửi…" : "Gửi yêu cầu tư vấn"}
            <Send size={16} />
          </Button>
        </form>
      ) : (
        <Button
          disabled={tour.reserved >= tour.capacity}
          onClick={() => setBooking(true)}
        >
          Yêu cầu tư vấn
          <ArrowRight size={17} />
        </Button>
      )}
    </Modal>
  );
}

function TourEditor({ tour, prefill, onClose, onSave }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false);
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
    ...(prefill ? {
      title: prefill.title, destination: prefill.destination, duration: prefill.duration,
      price: prefill.price ?? "", reserved: "",
      description: `${prefill.route}\n${prefill.highlights.join("; ")}\nNguồn: ${prefill.sourceUrl} · ${prefill.code} · Ghi nhận ${date(prefill.capturedOn)}.`,
    } : {}),
  };
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api("/tours/" + tour.id, "DELETE", { version: tour.version });
      await onSave();
      onClose();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
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
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={tour ? "Cập nhật hành trình" : "Tạo hành trình mới"}
      subtitle="Thông tin công khai được dùng trực tiếp trên cổng tour."
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <ErrorBox error={error} />
        {prefill && <div className="catalog-source"><ShieldCheck size={18} /><div><strong>Kiểm tra và bổ sung trước khi lưu</strong><p>Đã lấy nội dung tham khảo {prefill.code}. Xác nhận giá, nhập ngày đi, sức chứa, khách đã giữ chỗ và lịch trình từng ngày. Tour chưa được công khai.</p></div></div>}
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
          <Field label="Khách đã giữ chỗ">
            <input
              name="reserved"
              type="number"
              min="0"
              max="1000"
              defaultValue={t.reserved}
              required
            />
          </Field>
        </div>
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
            <strong>Xóa tour này?</strong>
            <p>Công việc và yêu cầu tư vấn gắn với tour cũng sẽ bị xóa. Thao tác này không thể hoàn tác. Để chỉ ẩn khỏi cổng khách hàng, hãy bỏ chọn công khai rồi lưu.</p>
            <Button type="button" variant="danger" disabled={busy} onClick={remove}>Xác nhận xóa tour</Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>Giữ lại tour</Button>
          </div>
        )}
        <div className="modal-actions">
          {tour && !confirmDelete && <Button type="button" variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}>Xóa tour</Button>}
          <Button type="button" variant="ghost" onClick={onClose}>
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
function TaskEditor({ tours, onClose, onSave }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/tasks", "POST", Object.fromEntries(new FormData(e.target)));
      await onSave();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Giao một công việc"
      subtitle="Rõ người phụ trách, rõ thời hạn, gắn với đúng tour."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <ErrorBox error={error} />
        <Field label="Công việc">
          <input
            name="title"
            required
            maxLength="160"
            placeholder="Ví dụ: Chốt danh sách khách"
          />
        </Field>
        {!tours.length && <p className="workspace-notice">Tạo một tour trong Quản lý tour trước khi giao công việc.</p>}
        <Field label="Tour liên quan">
          <select name="tour_id" required>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Người phụ trách"
          hint="Tên do bạn nhập để theo dõi. Hệ thống chưa tạo tài khoản hoặc gửi thông báo cho người được giao."
        >
          <input
            name="assignee"
            required
            maxLength="80"
            placeholder="Nhập tên người phụ trách"
          />
        </Field>
        <div className="form-grid">
          <Field label="Hạn hoàn thành">
            <input
              name="due"
              type="date"
              required
            />
          </Field>
          <Field label="Ưu tiên">
            <select name="priority">
              <option value="normal">Bình thường</option>
              <option value="high">Cao</option>
            </select>
          </Field>
        </div>
        <Button disabled={busy || !tours.length} variant="full">
          {busy ? "Đang lưu…" : "Giao công việc"}
          <Plus size={17} />
        </Button>
      </form>
    </Modal>
  );
}

function Dashboard({
  data,
  onNav,
  onTask,
  onTour,
  onPortal,
  readOnly = false,
  showTrial = false,
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
  ];
  return (
    <>
      <div className="welcome-banner">
        <div>
          <Badge tone="blue">
            <span className="live-dot" />
            MỘT NGUỒN DỮ LIỆU CHUNG
          </Badge>
          <h2>
            Lịch rõ ràng.
            <br />
            Đội ngũ cùng nhịp.
          </h2>
          <p>
            Một nơi theo dõi lịch khởi hành, số chỗ và công việc của đội ngũ.
          </p>
          <Button onClick={onPortal}>
            Xem cổng khách hàng
            <ArrowUpRight size={16} />
          </Button>
        </div>
        <div className="banner-art">
          <Landscape theme="dalat" />
        </div>
      </div>
      {showTrial && (
        <section className="trial-checklist" aria-label="Lộ trình dùng thử">
          <div className="trial-heading">
            <div>
              <h3>Bắt đầu trong 3 bước</h3>
              <p>Thử các thao tác dưới đây, rồi chia sẻ trải nghiệm của bạn.</p>
            </div>
            <Button variant="ghost" onClick={() => onNav("research")}>
              {data.feedback ? "Xem phản hồi" : "Gửi phản hồi"}
              <ArrowRight size={16} />
            </Button>
          </div>
          <div className="trial-grid">
            {trialSteps.map((step, i) => {
              const done = stepDone(step, new Set(data.completedActions));
              return (
                <button
                  key={step.nav}
                  className={"trial-item " + (done ? "completed" : "")}
                  onClick={() =>
                    step.nav === "portal" ? onPortal() : onNav(step.nav)
                  }
                >
                  <span className="step-number">
                    {done ? <Check size={17} /> : `0${i + 1}`}
                  </span>
                  <span>
                    <strong>{step.title}</strong>
                    <small>{step.description}</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              );
            })}
          </div>
        </section>
      )}
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
            <Empty title={data.tasks.length ? "Mọi việc đã được xử lý" : "Chưa có công việc"}>
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
            .filter(
              (t) => t.departure >= new Date().toLocaleDateString("sv-SE"),
            )
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
          {!data.tours.some(
            (t) => t.departure >= new Date().toLocaleDateString("sv-SE"),
          ) && (
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

function Tasks({ data, onNew, onChange, readOnly = false }) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("");
  const tours = Object.fromEntries(data.tours.map((t) => [t.id, t.title]));
  const visible = data.tasks.filter(
    (t) =>
      (!filter || t.tour_id === filter) &&
      (t.title + " " + t.assignee)
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <>
      <div className="filter-bar">
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
                <article className="task-card" key={t.id}>
                  <div className="task-label">{tours[t.tour_id]}</div>
                  <h3>{t.title}</h3>
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
                    disabled={readOnly}
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

function Feedback({ data, notify, reload }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const f = data.feedback || {};
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const b = Object.fromEntries(new FormData(e.target));
    for (const k of ["portal", "operations", "sync", "ease", "price"])
      b[k] = Number(b[k]);
    try {
      await api("/feedback", "POST", b);
      await reload();
      notify("Đã lưu phản hồi. Cảm ơn bạn đã thử TaskHub!");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const actions = new Set(data.completedActions);
  return (
    <div className="feedback-layout">
      <aside className="panel testing-guide">
        <Badge tone="blue">ĐÁNH GIÁ SAU TRẢI NGHIỆM</Badge>
        <h2>
          Hãy thử trước, <br />
          rồi kể cho chúng em.
        </h2>
        <p>
          Phản hồi dựa trên những gì bạn vừa sử dụng giúp nhóm chọn đúng điều
          cần cải thiện.
        </p>
        {trialSteps.map((step, i) => (
          <div className="test-step" key={step.nav}>
            <span className={stepDone(step, actions) ? "completed" : ""}>
              {stepDone(step, actions) ? <Check size={16} /> : i + 1}
            </span>
            <div>
              <strong>{step.title}</strong>
              <small>{step.description}</small>
            </div>
          </div>
        ))}
        <div className="soft-note">
          <ShieldCheck size={18} />
          <p>
            Không có đáp án đúng hay sai. Câu trả lời tiêu cực cũng rất hữu ích.
            Bạn tự nhập dữ liệu trong không gian dùng thử riêng.
          </p>
        </div>
      </aside>
      <form className="panel feedback-form" onSubmit={submit}>
        <div className="panel-header">
          <div>
            <h3>Trải nghiệm của bạn</h3>
            <p>Đánh giá sau khi dùng MVP.</p>
          </div>
          {data.feedback && <Badge tone="blue">Đã lưu</Badge>}
        </div>
        <ErrorBox error={error} />
        {[
          ["portal", "Cổng thông tin tour có hữu ích cho bạn?"],
          ["operations", "Giao việc gắn với tour có hữu ích cho bạn?"],
          ["sync", "Dữ liệu lịch / số chỗ dùng chung có hữu ích?"],
          ["ease", "Bạn thấy thao tác trên MVP dễ đến đâu?"],
        ].map(([key, label]) => (
          <fieldset className="rating" key={key}>
            <legend>{label}</legend>
            <div>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n}>
                  <input
                    type="radio"
                    name={key}
                    value={n}
                    defaultChecked={f[key] === n}
                    required
                  />
                  <span>{n}</span>
                </label>
              ))}
            </div>
            <small>
              {key === "ease"
                ? "1 = Rất khó · 5 = Rất dễ"
                : "1 = Không hữu ích · 5 = Rất hữu ích"}
            </small>
          </fieldset>
        ))}
        <Field label="Bạn có muốn dùng sản phẩm này trong công việc?">
          <select name="intent" defaultValue={f.intent || ""} required>
            <option value="" disabled>
              Chọn câu trả lời
            </option>
            <option value="yes">Có</option>
            <option value="maybe">Có thể, cần cải thiện thêm</option>
            <option value="no">Không</option>
          </select>
        </Field>
        <Field
          label="Mức tối đa bạn sẵn sàng trả / doanh nghiệp / tháng (VND)"
          hint="Có thể nhập 0 nếu không muốn trả. Đây là ý kiến khảo sát, không phải giá đã chốt."
        >
          <input
            name="price"
            type="number"
            min="0"
            max="100000000"
            defaultValue={f.price ?? ""}
            required
            placeholder="Ví dụ: 0 hoặc 300000"
          />
        </Field>
        <Field label="Điều bạn thích (không bắt buộc)">
          <textarea
            name="liked"
            maxLength="1500"
            rows="2"
            defaultValue={f.liked || ""}
          />
        </Field>
        <Field label="Điều gây khó chịu hoặc cần sửa (không bắt buộc)">
          <textarea
            name="disliked"
            maxLength="1500"
            rows="3"
            defaultValue={f.disliked || ""}
          />
        </Field>
        <Button disabled={busy} variant="full">
          {busy
            ? "Đang lưu…"
            : data.feedback
              ? "Cập nhật phản hồi"
              : "Gửi phản hồi"}
          <Send size={17} />
        </Button>
      </form>
    </div>
  );
}

function Research({ notify }) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  const load = () =>
    api("/research")
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const avg = (k) =>
    data?.feedback.length
      ? (
          data.feedback.reduce((sum, f) => sum + f[k], 0) / data.feedback.length
        ).toFixed(1)
      : "—";
  return (
    <>
      <ErrorBox error={error} />
      <div className="research-banner">
        <div>
          <Badge tone="blue">PHẢN HỒI ĐÃ GHI NHẬN</Badge>
          <h2>Học từ những người đã thử.</h2>
          <p>
            Tài khoản quản trị và dữ liệu tour mẫu không được tính là người khảo
            sát.
          </p>
        </div>
        <Button variant="ghost" onClick={load}>
          <RefreshCw size={16} />
          Làm mới
        </Button>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Đã tạo không gian dùng thử</span>
          <strong>{data?.participants ?? "—"}</strong>
          <small>Email do người tham gia tự nhập</small>
        </div>
        <div className="stat-card">
          <span>Phản hồi đã hoàn thành</span>
          <strong>
            {data?.feedback.length ?? "—"}
            <small> / 20</small>
          </strong>
          <small>Mỗi tài khoản có một phản hồi</small>
        </div>
        <div className="stat-card">
          <span>Tương tác được ghi nhận</span>
          <strong>{data?.events ?? "—"}</strong>
          <small>Không gồm lần tải lại tự động</small>
        </div>
        <div className="stat-card">
          <span>Độ dễ sử dụng trung bình</span>
          <strong>
            {avg("ease")}
            <small> / 5</small>
          </strong>
          <small>Chưa có dữ liệu thì không tính điểm</small>
        </div>
      </div>
      <div className="research-readiness">
        <div>
          <strong>
            {data?.readyToReview ?? "—"} tài khoản có phản hồi và đủ thao tác
            thử
          </strong>
          <p>
            Đã sửa tour, mở cổng khách hàng, tạo việc và đổi trạng thái trước
            khi gửi phản hồi. Nhóm cần xác nhận từng người thật để chốt mẫu tối
            thiểu 20 cá nhân.
          </p>
        </div>
        <span className="badge blue">Mục tiêu tuyển: trên 20 người</span>
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Dữ liệu phục vụ CP3</h3>
            <p>Email nằm trong bản xuất dành cho nhóm / giảng viên.</p>
          </div>
          <div className="button-row">
            <a className="btn ghost" href="/api/export/events">
              <Download size={16} />
              Tương tác CSV
            </a>
            <a className="btn" href="/api/export/feedback">
              <Download size={16} />
              Phản hồi CSV
            </a>
          </div>
        </div>
        <div className="research-scores">
          {[
            ["portal", "Cổng thông tin tour"],
            ["operations", "Giao việc nội bộ"],
            ["sync", "Lịch & số chỗ dùng chung"],
          ].map(([key, label]) => (
            <div key={key}>
              <span>{label}</span>
              <strong>
                {avg(key)}
                <small> / 5</small>
              </strong>
            </div>
          ))}
        </div>
        {data?.feedback.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Người tham gia</th>
                  <th>Vai trò</th>
                  <th>Thao tác thử</th>
                  <th>Muốn sử dụng</th>
                  <th>Mức sẵn sàng trả / tháng</th>
                  <th>Cần cải thiện</th>
                </tr>
              </thead>
              <tbody>
                {data.feedback.map((f) => (
                  <tr key={f.user_id}>
                    <td>{f.name}</td>
                    <td>{roleNames[f.role] || f.role}</td>
                    <td>
                      <Badge tone={f.has_test_flow ? "blue" : "orange"}>
                        {f.has_test_flow ? "Đủ thao tác" : "Cần đối chiếu"}
                      </Badge>
                    </td>
                    <td>
                      {{ yes: "Có", maybe: "Có thể", no: "Không" }[f.intent]}
                    </td>
                    <td>{money(f.price)}</td>
                    <td>{f.disliked || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Chưa có phản hồi thực">
            Mời người tham gia tạo không gian dùng thử, trải nghiệm và gửi phản
            hồi. Nhóm vẫn cần kiểm tra ai đã thực sự dùng MVP.
          </Empty>
        )}
      </section>
      <div className="portal-notice">
        <AlertCircle size={18} />
        <p>
          20 tài khoản hoặc email khác nhau chưa chứng minh 20 cá nhân độc lập.
          Nhóm cần đối chiếu người tham gia và lịch sử thao tác khi chốt mẫu.
          Giá khảo sát chưa phải kết quả Van Westendorp.
        </p>
      </div>
    </>
  );
}

function Help({ user, onClose, onDelete }) {
  return (
    <Modal title="Bắt đầu cùng TaskHub" onClose={onClose}>
      <div className="help-content">
        <h3>Ba thao tác để thử MVP</h3>
        <p>
          1. Quản lý tour: tạo tour bằng thông tin bạn nhập. Chọn công khai nếu muốn xem trên cổng khách hàng; sau đó sửa lịch hoặc số chỗ để kiểm tra cập nhật.
        </p>
        <p>
          2. Mở cổng tour: kiểm tra thay đổi. Cổng đọc cùng cơ sở dữ liệu và cập
          nhật mỗi 5 giây khi đang mở.
        </p>
        <p>
          3. Công việc: giao việc gắn với tour rồi chuyển sang Đang thực hiện /
          Hoàn thành.
        </p>
        <h3>Những gì bản này có</h3>
        <p>
          Thông tin tour, lịch/số chỗ dùng chung, giao việc, yêu cầu tư vấn và
          phản hồi dùng thử. Chưa có thanh toán, tự gửi email, tài khoản nhân
          viên được giao việc, nhập Excel hoặc đối soát B2B đầy đủ.
        </p>
        <h3>Hỗ trợ</h3>
        <p>
          Ghi vấn đề trong mục Phản hồi MVP để nhóm TaskHub xem. Bản học phần
          chưa có cam kết SLA.
        </p>
        {!["admin", "reviewer"].includes(user.role) && (
          <>
            <h3>Dữ liệu của bạn</h3>
            <p>
              Không gian dùng thử riêng. Xóa tài khoản sẽ xóa tour, công việc,
              lịch sử và phản hồi của bạn trên hệ thống. Nếu nhóm đã xuất CSV,
              cần yêu cầu nhóm xóa bản xuất riêng.
            </p>
            <Button variant="danger" onClick={onDelete}>
              Xóa tài khoản và dữ liệu dùng thử
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}

function Workspace({ user, onLogout, onPortal, notify }) {
  const pending = useRef(0);
  const latest = useRef(0);
  const readOnly = user.role === "reviewer";
  const [nav, setNav] = useState("dashboard"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [editor, setEditor] = useState(null),
    [help, setHelp] = useState(false),
    [menu, setMenu] = useState(false),
    [query, setQuery] = useState(""),
    [last, setLast] = useState("");
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
      setError("");
      setLast(new Date().toLocaleTimeString("vi-VN"));
    } finally {
      pending.current -= 1;
    }
  }, []);
  useEffect(() => {
    reload().catch((e) => setError(e.message));
    const timer = setInterval(() => {
      if (!document.hidden && pending.current === 0)
        reload().catch((e) => setError(e.message));
    }, 5000);
    return () => clearInterval(timer);
  }, [reload]);
  async function changeTask(t, status) {
    try {
      await api("/tasks/" + t.id, "PATCH", { status });
      await reload();
      notify("Đã cập nhật trạng thái công việc.");
    } catch (e) {
      notify(e.message, "error");
    }
  }
  async function changeLead(i, status) {
    try {
      await api("/inquiries/" + i.id, "PATCH", { status });
      await reload();
      notify("Đã cập nhật yêu cầu.");
    } catch (e) {
      notify(e.message, "error");
    }
  }
  const current = navItems.find((i) => i[0] === nav);
  const visibleTours =
    data?.tours.filter((t) =>
      (t.title + " " + t.destination)
        .toLocaleLowerCase("vi")
        .includes(query.toLocaleLowerCase("vi")),
    ) || [];
  const descriptions = {
    dashboard: "Mọi thông tin cần thiết cho một ngày điều hành.",
    tours: "Một lần cập nhật. Cả đội ngũ và khách hàng cùng nhìn thấy.",
    tasks: "Rõ người phụ trách. Đúng thời hạn. Không bỏ sót.",
    inbox: "Tiếp nhận yêu cầu ngay cả ngoài giờ làm việc.",
    research: ["admin", "reviewer"].includes(user.role)
      ? "Theo dõi phản hồi và xuất dữ liệu cho nhóm."
      : "Chia sẻ trải nghiệm sau khi thử ba tính năng cốt lõi.",
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
        <div className="workspace-switch">
          <span className="workspace-icon">TH</span>
          <div>
            <strong>TaskHub</strong>
            <small>
              {["admin", "reviewer"].includes(user.role)
                ? "Không gian điều hành"
                : "Không gian dùng thử riêng"}
            </small>
          </div>
        </div>
        <div className="nav-caption">KHÔNG GIAN LÀM VIỆC</div>
        <nav>
          {navItems.map(([id, label, Icon]) => (
            <button
              key={id}
              className={nav === id ? "active" : ""}
              aria-current={nav === id ? "page" : undefined}
              onClick={() => {
                setNav(id);
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
              Ít thao tác hơn.
              <br />
              Nhiều hành trình hơn.
            </strong>
            <button onClick={onPortal}>
              Mở cổng khách hàng
              <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="help-link" onClick={() => setHelp(true)}>
            <HelpCircle size={18} />
            Hướng dẫn & hỗ trợ
          </button>
          <div className="profile">
            <span className="avatar">{user.name[0]}</span>
            <div>
              <strong>{user.name}</strong>
              <small>
                {readOnly
                  ? "Người đánh giá · chỉ xem"
                  : user.role === "admin"
                    ? "Quản trị"
                    : "Người tham gia dùng thử"}
              </small>
            </div>
            <button
              className="icon-btn"
              title="Đăng xuất"
              aria-label="Đăng xuất"
              onClick={onLogout}
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
              Bản dùng thử
            </Badge>
            <button className="text-btn" onClick={onPortal}>
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
                TASKHUB · ĐIỀU HÀNH CÙNG MỘT NHỊP
              </div>
              <h1>{current?.[1]}</h1>
              <p>{descriptions[nav]}</p>
            </div>
            <div className="button-row">
              {nav === "dashboard" && (
                <span className="today">
                  <CalendarDays size={16} />
                  {date(new Date().toISOString().slice(0, 10))}
                </span>
              )}
              {nav === "tours" && !readOnly && (
                <Button variant="ghost" disabled={!data?.catalog?.tours.length} onClick={() => setEditor({ type: "catalog" })}>
                  <Compass size={17} />Danh mục Én Việt
                </Button>
              )}
              {nav === "tours" && !readOnly && (
                <Button onClick={() => setEditor({ type: "tour" })}>
                  <Plus size={17} />
                  Tạo tour
                </Button>
              )}
              {nav === "tasks" && !readOnly && (
                <Button
                  disabled={!data?.tours.length}
                  onClick={() => setEditor({ type: "task" })}
                >
                  <Plus size={17} />
                  Giao công việc
                </Button>
              )}
            </div>
          </div>
          <div className="workspace-notice">
            <ShieldCheck size={16} />
            <span>
              {["admin", "reviewer"].includes(user.role)
                ? readOnly
                  ? "Tài khoản giảng viên / người đánh giá: chỉ xem, không chỉnh sửa dữ liệu."
                  : "Chỉ công khai tour sau khi đã kiểm tra thông tin."
                : "Không gian dùng thử riêng. Tự nhập dữ liệu để trải nghiệm; không nhập thông tin khách hàng thật."}
            </span>
            <span className={"sync-time " + (error ? "stale" : "")}>
              {error ? "Đồng bộ gián đoạn" : `Cập nhật ${last || "…"}`}
            </span>
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
                  readOnly={readOnly}
                  showTrial={!["admin", "reviewer"].includes(user.role)}
                  data={data}
                  onNav={setNav}
                  onTask={() => setEditor({ type: "task" })}
                  onTour={(t) => setEditor({ type: "tour", tour: t })}
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
                    <span className="muted">
                      {visibleTours.length} / {data.tours.length} hành trình
                    </span>
                  </div>
                  <div className="tour-grid">
                    {visibleTours.map((t) => (
                      <TourCard
                        key={t.id}
                        tour={t}
                        onOpen={(tour) => setEditor({ type: "tour", tour })}
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
                      {query
                        ? "Thử từ khóa khác hoặc xóa bộ lọc."
                        : "Tạo một tour để bắt đầu."}
                      {query && (
                        <button
                          className="text-btn"
                          onClick={() => setQuery("")}
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
                  readOnly={readOnly}
                  data={data}
                  onNew={() => setEditor({ type: "task" })}
                  onChange={changeTask}
                />
              )}{" "}
              {nav === "inbox" && (
                <section className="panel">
                  <div className="panel-header">
                    <h3>
                      Yêu cầu tư vấn{" "}
                      <span className="count">{data.inquiries.length}</span>
                    </h3>
                    <Badge tone="gray">Chưa giữ chỗ tự động</Badge>
                  </div>
                  {data.inquiries.length ? (
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
                          {data.inquiries.map((i) => (
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
                                  disabled={readOnly}
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
                    <Empty title="Chưa có yêu cầu mới">
                      Mở cổng khách hàng, chọn tour và gửi yêu cầu tư vấn để thử
                      luồng tiếp nhận.
                    </Empty>
                  )}
                </section>
              )}
              {nav === "research" &&
                (["admin", "reviewer"].includes(user.role) ? (
                  <Research notify={notify} />
                ) : (
                  <Feedback data={data} notify={notify} reload={reload} />
                ))}
            </>
          )}
          <footer className="app-footer">
            <span>TaskHub · Điều hành tour</span>
            <span>Tour · Lịch / số chỗ · Công việc</span>
          </footer>
        </main>
      </div>
      {editor?.type === "tour" && readOnly && (
        <TourDetails
          tour={editor.tour}
          workspace={user.workspace}
          readOnly
          onClose={() => setEditor(null)}
          notify={notify}
        />
      )}
      {editor?.type === "tour" && !readOnly && (
        <TourEditor
          tour={editor.tour}
          prefill={editor.prefill}
          onClose={() => setEditor(null)}
          onSave={async () => {
            await reload();
            notify("Đã lưu tour. Cổng khách hàng sẽ cập nhật dữ liệu mới.");
          }}
        />
      )}
      {editor?.type === "task" && !readOnly && (
        <TaskEditor
          tours={data.tours}
          onClose={() => setEditor(null)}
          onSave={async () => {
            await reload();
            notify("Đã giao công việc.");
          }}
        />
      )}
      {editor?.type === "catalog" && !readOnly && data?.catalog && (
        <CatalogPicker catalog={data.catalog} onClose={() => setEditor(null)} onUse={prefill => setEditor({ type: "tour", prefill })} />
      )}
      {help && (
        <Help
          user={user}
          onClose={() => setHelp(false)}
          onDelete={async () => {
            if (
              !window.confirm(
                "Xóa toàn bộ dữ liệu dùng thử của bạn trên hệ thống? Thao tác này không thể hoàn tác.",
              )
            )
              return;
            try {
              await api("/account", "DELETE");
              onLogout();
              notify("Đã xóa tài khoản và dữ liệu.");
            } catch (e) {
              notify(e.message, "error");
            }
          }}
        />
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [path, setPath] = useState(location.pathname),
    [auth, setAuth] = useState(null),
    [toast, setToast] = useState(null),
    [sessionError, setSessionError] = useState("");
  const navigate = (p) => {
    history.pushState({}, "", p);
    setPath(p);
    window.scrollTo(0, 0);
  };
  const loadSession = useCallback(async () => {
    try {
      const result = await api("/session");
      setUser(result.user);
      setSessionError("");
    } catch (e) {
      setSessionError(e.message);
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    const handler = () => setPath(location.pathname);
    window.addEventListener("popstate", handler);
    loadSession();
    return () => window.removeEventListener("popstate", handler);
  }, [loadSession]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  const notify = (text, tone = "success") => setToast({ text, tone });
  const logout = async () => {
    try {
      await api("/logout", "POST", {});
      setUser(null);
      navigate("/");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const isApp = path === "/app";
  const workspace = path.startsWith("/portal/") ? path.split("/")[2] : "agency";
  if (!ready)
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
      ) : (
        <Portal
          workspace={workspace}
          user={user}
          onAuth={setAuth}
          onWorkspace={() => navigate("/app")}
          notify={notify}
        />
      )}{" "}
      {auth && (
        <Auth
          mode={auth}
          setMode={setAuth}
          onClose={() => setAuth(null)}
          onUser={(u) => {
            setUser(u);
            setSessionError("");
            navigate("/app");
          }}
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
