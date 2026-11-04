import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Pencil,
  Search,
  MapPin,
  CalendarDays,
  Users,
  X,
  Clock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  Send,
} from "lucide-react";
import { TourMedia, TourImageCredit } from "./tour-media.jsx";
import { SyncStatus } from "./sync-status.jsx";
import { PrintPage } from "./print-page.jsx";
import { downloadTable } from "./export-file.mjs";
import { Printer, Download } from "lucide-react";
import { startPolling } from "./polling.mjs";
import {
  matchesTourSearch,
  matchesTourSchedule,
  hasScheduleFilters,
} from "./tour-search.mjs";
export function createPortalUI({
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
}) {
  function TourCard({ tour, onOpen, internal = false, onEdit, onSeats, onTask }) {
    const remaining = tour.capacity - tour.reserved;
    const departed = tour.departure < todayVN();
    return (
      <article
        className={"tour-card" + (internal ? " internal-tour" : "")}
        data-track-entity={tour.id}
      >
        <button
          className="cover-button"
          aria-label={"Xem " + tour.title}
          data-track="tour:cover"
          onClick={() => onOpen(tour)}
        >
          <TourMedia tour={tour} />
          <span className="cover-pill">
            <MapPin size={12} />
            {tour.destination}
          </span>
        </button>
        <div className="tour-card-body">
          <div className="eyebrow">
            {tour.duration} <span>•</span> KHỞI HÀNH {date(tour.departure)}
          </div>
          <button
            className="card-title"
            data-track="tour:open"
            onClick={() => onOpen(tour)}
          >
            {tour.title}
            <ArrowUpRight size={19} />
          </button>
          <p>{tour.description}</p>
          <div className="tour-meta">
            <span>
              <Users size={15} />
              {departed
                ? "Đã khởi hành"
                : remaining > 0
                  ? `Còn ${remaining} chỗ`
                  : "Đã đủ khách"}
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
          {(onEdit || onSeats || onTask) && (
            <div className="tour-quick-actions">
              {onEdit && (
                <Button
                  variant="ghost"
                  data-track="tour:edit"
                  onClick={() => onEdit(tour)}
                >
                  <Pencil size={15} />
                  Sửa tour
                </Button>
              )}
              {onSeats && (
                <Button
                  variant="ghost"
                  data-track="tour:seats"
                  onClick={() => onSeats(tour)}
                >
                  <Users size={15} />
                  Đổi số chỗ
                </Button>
              )}
              {onTask && (
                <Button
                  variant="ghost"
                  data-track="tour:task"
                  onClick={() => onTask(tour)}
                >
                  <Plus size={15} />
                  Giao việc
                </Button>
              )}
            </div>
          )}
        </div>
      </article>
    );
  }

  function CatalogImage({ tour }) {
    return <TourMedia tour={tour} />;
  }

  function CatalogDetails({ tour, source, onClose, onUse }) {
    return (
      <Modal
        title={tour.title}
        subtitle={tour.code + " · Danh mục tham khảo"}
        onClose={onClose}
        wide
      >
        <div className="catalog-detail-cover">
          <CatalogImage tour={tour} />
        </div>
        <TourImageCredit tour={tour} />
        <div className="catalog-facts">
          <div>
            <span>Thời lượng</span>
            <strong>{tour.duration}</strong>
          </div>
          <div>
            <span>Giá tham khảo / khách</span>
            <strong>
              {tour.price === null ? "Liên hệ" : money(tour.price)}
            </strong>
          </div>
          <div>
            <span>Lịch theo nguồn</span>
            <strong>{tour.departureNote}</strong>
          </div>
          <div>
            <span>Hàng không theo nguồn</span>
            <strong>{tour.airline || "Chưa nêu cụ thể"}</strong>
          </div>
        </div>
        <div className="catalog-section">
          <h3>Tuyến hành trình</h3>
          <p>{tour.route}</p>
        </div>
        <div className="catalog-section">
          <h3>Điểm nổi bật</h3>
          <ul>
            {tour.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
        <div className="catalog-source">
          <ShieldCheck size={19} />
          <div>
            <strong>Cần xác nhận trước khi mở bán</strong>
            <p>
              Chưa có ngày khởi hành cụ thể, số chỗ và lịch trình từng ngày. Giá
              và lịch có thể thay đổi; danh mục này chưa nhận đặt chỗ.
            </p>
            <a href={tour.sourceUrl} target="_blank" rel="noopener noreferrer">
              Nguồn: {source.name}
              <ArrowUpRight size={14} />
            </a>
            <small>Ghi nhận ngày {date(source.capturedOn)}</small>
          </div>
        </div>
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Xong
          </Button>
          {onUse && (
            <Button onClick={() => onUse(tour)}>
              Dùng nội dung tour
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </Modal>
    );
  }

  function CatalogPicker({ catalog, onClose, onUse }) {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(null);
    const tours = catalog.tours.filter((t) => matchesTourSearch(t, query));
    if (selected)
      return (
        <CatalogDetails
          tour={selected}
          source={catalog.source}
          onClose={() => setSelected(null)}
          onUse={(tour) =>
            onUse({ ...tour, capturedOn: catalog.source.capturedOn })
          }
        />
      );
    return (
      <Modal
        title="Danh mục tour Én Việt"
        subtitle="Chọn nội dung có sẵn, sau đó bổ sung dữ liệu vận hành."
        onClose={onClose}
        wide
      >
        <label className="search catalog-search">
          <Search size={18} />
          <input
            aria-label="Tìm trong danh mục"
            placeholder="Tên tour, mã hoặc điểm đến…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="catalog-picker-list">
          {tours.map((t) => (
            <div className="catalog-picker-row" key={t.id}>
              <button
                className="catalog-picker-detail"
                data-track="catalog:detail"
                onClick={() => setSelected(t)}
              >
                <span>
                  <small>
                    {t.code} · {t.destination}
                  </small>
                  <strong>{t.title}</strong>
                  <span>
                    {t.duration} ·{" "}
                    {t.price === null ? "Giá: Liên hệ" : money(t.price)}
                  </span>
                </span>
                <ChevronRight size={19} />
              </button>
              <Button
                variant="ghost"
                data-track="catalog:use"
                aria-label={"Dùng " + t.code}
                onClick={() =>
                  onUse({ ...t, capturedOn: catalog.source.capturedOn })
                }
              >
                Dùng tour
              </Button>
            </div>
          ))}
        </div>
        {!tours.length && (
          <p className="muted">Không tìm thấy tour. Thử từ khóa khác.</p>
        )}
      </Modal>
    );
  }

  function Portal({ workspace, user, onWorkspace, notify }) {
    const pending = useRef(0);
    const latest = useRef(0);
    const [data, setData] = useState(null),
      [error, setError] = useState(""),
      [query, setQuery] = useState(""),
      [destination, setDestination] = useState(""),
      [from, setFrom] = useState(""),
      [to, setTo] = useState(""),
      [availableOnly, setAvailableOnly] = useState(false),
      [selected, setSelected] = useState(null),
      [lastSuccess, setLastSuccess] = useState(null);
    const load = useCallback(async () => {
      const request = ++latest.current;
      pending.current += 1;
      try {
        const d = await api("/public/" + workspace);
        if (request !== latest.current) return;
        setData(d);
        setLastSuccess(Date.now());
        setError("");
      } catch (e) {
        if (request === latest.current) setError(e.message);
        throw e;
      } finally {
        pending.current -= 1;
      }
    }, [workspace]);
    useEffect(() => {
      return startPolling(load, { isBusy: () => pending.current > 0 });
    }, [load]);
    useEffect(() => {
      if (user && user.workspace === workspace)
        api("/events", "POST", { action: "portal_viewed" }).catch(() => {});
    }, [workspace, user?.id, user?.workspace]);
    const allTours = data?.tours || [];
    const schedule = { from, to, availableOnly };
    const scheduleActive = hasScheduleFilters(schedule);
    const filtersActive = Boolean(query || destination || scheduleActive);
    const invalidRange = Boolean(from && to && from > to);
    const matches = (tour) => matchesTourSearch(tour, query, destination);
    const visible = (data?.tours || []).filter(
      (tour) => matches(tour) && matchesTourSchedule(tour, schedule),
    );
    function resetFilters() {
      setQuery("");
      setDestination("");
      setFrom("");
      setTo("");
      setAvailableOnly(false);
    }
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
          <a
            className="plain-link"
            href={
              workspace === "agency"
                ? "/"
                : "/portal/" + encodeURIComponent(workspace)
            }
            aria-label="Trang đầu cổng tour này"
          >
            <Logo />
          </a>
          <nav>
            <a href="#journeys">Cổng tour</a>
            <span className="nav-divider" />
            <Button
              variant="ghost"
              onClick={onWorkspace}
              data-track="portal:operations"
            >
              {user ? "Về điều hành" : "Dành cho điều hành"}
              <ArrowUpRight size={16} />
            </Button>
          </nav>
        </header>
        <main>
          <section id="journeys" className="journeys">
            <div className="section-title customer-heading">
              <div>
                <h1>Cổng thông tin tour</h1>
                <p>Tra cứu lịch trình, giá, số chỗ và gửi yêu cầu tư vấn.</p>
              </div>
              <SyncStatus lastSuccess={lastSuccess} error={error} compact />
            </div>
            {workspace === "agency" && (
              <div className="portal-notice" role="note">
                <ShieldCheck size={18} />
                <p>
                  <strong>Không gian trình diễn TaskHub</strong>
                  <br />
                  Dữ liệu giả lập để dùng thử. Không mở bán, nhận đặt tour
                  hoặc thanh toán thực tế.
                </p>
              </div>
            )}
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
                  {[...new Set(allTours.map((t) => t.destination))].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>
            <div
              className="portal-date-filters"
              aria-label="Lọc lịch khởi hành"
            >
              <Field label="Khởi hành từ ngày">
                <input
                  type="date"
                  name="departure_from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </Field>
              <Field label="Đến ngày">
                <input
                  type="date"
                  name="departure_to"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                />
              </Field>
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="available_only"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                />
                <span>Chỉ tour còn chỗ, chưa khởi hành</span>
              </label>
            </div>
            {invalidRange && (
              <p className="portal-filter-error" role="alert">
                Ngày kết thúc cần bằng hoặc sau ngày bắt đầu.
              </p>
            )}
            {data && (
              <div className="portal-results">
                <p role="status" aria-live="polite">
                  {visible.length} tour có lịch
                </p>
                {filtersActive && (
                  <Button
                    variant="ghost"
                    data-track="portal:reset-filters"
                    onClick={resetFilters}
                  >
                    Xóa bộ lọc
                    <X size={15} />
                  </Button>
                )}
              </div>
            )}
            <ErrorBox error={error} />
            {error && (
              <div className="connection-recovery">
                <p>
                  {data
                    ? "Đang hiển thị dữ liệu từ lần tải thành công gần nhất. Số chỗ có thể đã thay đổi."
                    : "Danh sách tour chưa tải được. Vui lòng thử lại khi kết nối ổn định."}
                </p>
                <Button variant="ghost" onClick={() => load().catch(() => {})}>
                  <RefreshCw size={16} />
                  Thử tải lại
                </Button>
              </div>
            )}
            {!data && !error ? (
              <p className="loading">Đang tải hành trình…</p>
            ) : visible.length ? (
              <div>
                <h3 className="operating-tour-heading">
                  Tour có lịch khởi hành
                </h3>
                <div className="tour-grid">
                  {visible.map((t) => (
                    <TourCard key={t.id} tour={t} onOpen={open} />
                  ))}
                </div>
              </div>
            ) : data ? (
              <Empty
                title={
                  filtersActive
                    ? "Chưa có hành trình phù hợp"
                    : "Chưa có tour công khai"
                }
              >
                {filtersActive
                  ? "Thử đổi ngày khởi hành, điểm đến hoặc từ khóa tìm kiếm."
                  : "Tour chỉ xuất hiện tại đây sau khi người quản lý nhập thông tin và chọn công khai."}
              </Empty>
            ) : null}
            <div className="portal-notice">
              <ShieldCheck size={17} />
              <p>
                Tour có lịch và số chỗ được công khai từ điều hành.{" "}
                Yêu cầu tư vấn không giữ chỗ và không tạo thanh toán.
              </p>
            </div>
          </section>
        </main>
        <footer className="portal-footer">
          <Logo />
          <span>Lịch trình · Giá tour · Yêu cầu tư vấn</span>
        </footer>
        {selected &&
          ((data?.tours || []).some((t) => t.id === selected.id) ? (
            <TourDetails
              key={selected.id}
              tour={data.tours.find((t) => t.id === selected.id)}
              workspace={workspace}
              onClose={() => setSelected(null)}
              notify={notify}
            />
          ) : (
            <Modal
              title="Tour đã ngừng công khai"
              onClose={() => setSelected(null)}
            >
              <p>
                Thông tin tour vừa được người điều hành ẩn hoặc xóa. Danh sách
                đã cập nhật; tour này không nhận yêu cầu tư vấn mới.
              </p>
              <Button onClick={() => setSelected(null)}>
                Về danh sách tour
                <ArrowLeft size={16} />
              </Button>
            </Modal>
          ))}
      </div>
    );
  }

  function TourDetails({ tour, workspace, onClose, notify, readOnly = false, internal = false, onEdit }) {
    const [booking, setBooking] = useState(false),
      [busy, setBusy] = useState(false),
      [sent, setSent] = useState(false),
      [error, setError] = useState("");
    const simulated = workspace === "agency";
    const departed = tour.departure < todayVN();
    const unavailable = departed || tour.reserved >= tour.capacity;
    async function exportQuote() {
      try {
        await downloadTable("taskhub-tour.xlsx", {
          name: "Thong tin tour",
          headers: ["Thông tin", "Nội dung"],
          widths: [28, 95],
          rows: [
            ["Tên tour", tour.title],
            ["Điểm đến", tour.destination],
            ["Khởi hành", tour.departure],
            ["Thời lượng", tour.duration],
            ["Giá / khách (VND)", tour.price],
            ["Chỗ còn lúc xuất", tour.capacity - tour.reserved],
            ["Mô tả", tour.description],
            ...tour.itinerary.split("\n").map((line,i)=>["Lịch trình "+(i+1),line]),
            ["Cập nhật", tour.updated],
            [
              "Lưu ý",
              simulated
                ? "Dữ liệu giả lập, không phải tour mở bán."
                : "Thông tin tham khảo, cần xác nhận dịch vụ/giá/chỗ; không phải booking hoặc xác nhận thanh toán.",
            ],
          ],
        });
      } catch (e) {
        notify("Chưa xuất được tệp: " + e.message, "error");
      }
    }
    async function submit(e) {
      e.preventDefault();
      if (unavailable) {
        setError("Tour không còn nhận yêu cầu mới. Chọn lịch khởi hành khác.");
        return;
      }
      setBusy(true);
      setError("");
      const f = new FormData(e.target);
      try {
        const result = await api(
          "/public/" + workspace + "/inquiries",
          "POST",
          {
            ...Object.fromEntries(f),
            people: Number(f.get("people")),
            tour_id: tour.id,
            consent: f.get("consent") === "on",
          },
        );
        setSent(true);
        notify(
          simulated
            ? "Đã lưu yêu cầu thử nghiệm. Không phát sinh đặt tour hoặc thanh toán."
            : result.message,
        );
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
        busy={busy}
        wide
      >
        <div className="detail-cover">
          <TourMedia tour={tour} large />
        </div>
        <TourImageCredit tour={tour} />
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
        {simulated && (
          <div className="portal-notice" role="note">
            <ShieldCheck size={18} />
            <p>
              <strong>
                Dữ liệu giả lập phục vụ trình diễn, không phải thông tin mở bán
                thực tế.
              </strong>{" "}
              Mọi yêu cầu tại đây chỉ phục vụ thử nghiệm, không đặt tour, giữ
              chỗ hoặc tạo thanh toán.
            </p>
          </div>
        )}
        <p className="detail-description">{tour.description}</p>
        <div className="button-row tour-document-actions">
          <Button
            variant="ghost"
            type="button"
            disabled={busy}
            onClick={() => window.print()}
            data-track="tour:print"
          >
            <Printer size={16} />
            In / lưu báo giá PDF
          </Button>
          <Button
            variant="ghost"
            type="button"
            disabled={busy}
            onClick={exportQuote}
            data-track="tour:quote-xlsx"
          >
            <Download size={16} />
            Báo giá Excel
          </Button>
        </div>
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
          Thông tin do người quản lý tour cung cấp. Chi tiết dịch vụ cần được
          xác nhận trước khi đặt tour.
        </p>
        {internal ? (
          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose}>
              Đóng
            </Button>
            {onEdit && (
              <Button data-track="tour:edit" onClick={() => onEdit(tour)}>
                <Pencil size={16} />
                Sửa tour
              </Button>
            )}
          </div>
        ) : readOnly ? (
          <p className="workspace-notice">
            Chế độ xem. Vai trò hiện tại không chỉnh sửa thông tin tour.
          </p>
        ) : unavailable ? (
          <div className="tour-expired-notice">
            <Clock size={18} />
            <span>
              {departed
                ? "Tour đã khởi hành, không tiếp nhận yêu cầu tư vấn mới."
                : "Tour đã đủ số khách, chưa tiếp nhận yêu cầu mới."}{" "}
              Vui lòng chọn hành trình hoặc ngày khởi hành khác.
            </span>
          </div>
        ) : sent ? (
          <div className="success">
            <CheckCircle2 size={20} />
            {simulated
              ? "Đã lưu yêu cầu thử nghiệm. Không phát sinh đặt tour hoặc thanh toán."
              : "Đã gửi yêu cầu. Đây chưa phải xác nhận đặt tour."}
          </div>
        ) : booking ? (
          <form onSubmit={submit}>
            <h3>
              {simulated ? "Gửi yêu cầu thử nghiệm" : "Gửi yêu cầu tư vấn"}
            </h3>
            <ErrorBox error={error} />
            <div className="form-grid">
              <Field label="Tên">
                <input name="name" autoComplete="name" required maxLength="80" />
              </Field>
              <Field label="Email">
                <input name="email" type="email" autoComplete="email" required maxLength="254" />
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
                {simulated
                  ? "Tôi đồng ý để nhóm lưu thông tin này phục vụ kiểm thử MVP tối đa khoảng 6 tháng. Thông tin không được công khai và có thể yêu cầu nhóm xóa. Hãy dùng dữ liệu giả, không nhập thông tin khách hàng thật."
                  : "Tôi đồng ý để nhóm dùng thông tin này liên hệ tư vấn và kiểm thử MVP, lưu tối đa khoảng 6 tháng. Thông tin không được công khai. Có thể yêu cầu nhóm xóa; với bản dùng thử, hãy dùng dữ liệu giả."}
              </span>
            </label>
            <Button disabled={busy}>
              {busy
                ? "Đang gửi…"
                : simulated
                  ? "Gửi yêu cầu thử nghiệm"
                  : "Gửi yêu cầu tư vấn"}
              <Send size={16} />
            </Button>
          </form>
        ) : (
          <Button
            disabled={tour.reserved >= tour.capacity}
            onClick={() => setBooking(true)}
          >
            {simulated ? "Gửi yêu cầu thử nghiệm" : "Yêu cầu tư vấn"}
            <ArrowRight size={17} />
          </Button>
        )}
        <PrintPage>
          <strong>TaskHub · Thông tin tour và giá tham khảo</strong>
          <h1>{tour.title}</h1>
          <p>
            {tour.destination} · {tour.duration}
          </p>
          <table>
            <tbody>
              <tr>
                <th>Ngày khởi hành</th>
                <td>{date(tour.departure)}</td>
              </tr>
              <tr>
                <th>Giá tham khảo / khách</th>
                <td>{money(tour.price)}</td>
              </tr>
              <tr>
                <th>Chỗ còn tại thời điểm xuất</th>
                <td>{tour.capacity - tour.reserved}</td>
              </tr>
              <tr>
                <th>Tình trạng lịch</th>
                <td>
                  {departed
                    ? "Đã khởi hành"
                    : tour.reserved >= tour.capacity
                      ? "Đã đủ khách"
                      : "Chưa khởi hành"}
                </td>
              </tr>
            </tbody>
          </table>
          {simulated && (
            <p>
              <strong>DỮ LIỆU GIẢ LẬP. Không phải tour mở bán.</strong>
            </p>
          )}
          <p>{tour.description}</p>
          <h2>Lịch trình dự kiến</h2>
          <p>{tour.itinerary}</p>
          <p className="print-note">
            Thông tin do người quản lý cung cấp, cập nhật{" "}
            {tour.updated
              ? new Date(tour.updated).toLocaleString("vi-VN",{timeZone:'Asia/Ho_Chi_Minh'})
              : "chưa rõ"}
            . Giá, chỗ và dịch vụ cần được xác nhận lại. Tài liệu này không giữ
            chỗ, xác nhận đặt tour hoặc thanh toán. Vui lòng xác nhận chính sách
            dịch vụ với đơn vị tổ chức trước khi đặt tour.
          </p>
        </PrintPage>
      </Modal>
    );
  }

  return { TourCard, CatalogPicker, Portal, TourDetails };
}
