import React, { useState, useRef } from "react";
import {
  Upload,
  Download,
  Check,
  Plus,
  Handshake,
  History,
  RefreshCw,
  ShieldCheck,
  Search,
  Printer,
} from "lucide-react";
import { PrintPage } from "./print-page.jsx";
import { downloadWorkbook } from "./export-file.mjs";
import { readTourFile, downloadTourTemplate } from "./import-tours.mjs";
import "./operations-polish.css";
import { filterPooling } from "./pooling-view.mjs";

// Reuse TaskHub's accessible controls and API client in these bounded workflows.
export function createOperationsUI({
  Modal,
  Button,
  Field,
  ErrorBox,
  Empty,
  Badge,
  api,
  money,
  date,
}) {
  function ImportTours({ onClose, onSave }) {
    const [rows, setRows] = useState(null),
      [preview, setPreview] = useState(null),
      [error, setError] = useState(""),
      [busy, setBusy] = useState(false),
      [saved, setSaved] = useState(false);
    const importId = useRef(crypto.randomUUID());
    const pending = useRef(false);
    const close = () => {
      if (!pending.current) onClose();
    };
    async function choose(e) {
      if (pending.current) return;
      const file = e.target.files[0];
      if (!file) return;
      e.target.value = "";
      pending.current = true;
      setBusy(true);
      setRows(null);
      setPreview(null);
      setError("");
      setSaved(false);
      importId.current = crypto.randomUUID();
      try {
        const data = await readTourFile(file);
        if (
          new TextEncoder().encode(JSON.stringify({ rows: data })).byteLength >
          250000
        )
          throw Error("Nội dung quá dài. Chia nhỏ thành nhiều đợt nhập.");
        const result = await api("/tours/import", "POST", {
          rows: data,
          preview: true,
        });
        setRows(data);
        setPreview(result);
      } catch (e) {
        setError(e.message);
      } finally {
        pending.current = false;
        setBusy(false);
      }
    }
    async function save() {
      if (pending.current || saved || !preview || preview.errors.length) return;
      pending.current = true;
      setBusy(true);
      setError("");
      try {
        const result = await api("/tours/import", "POST", {
          rows,
          import_id: importId.current,
        });
        setSaved(true);
        await onSave(result.count);
        onClose();
      } catch (e) {
        setSaved(false);
        setError(e.message);
      } finally {
        pending.current = false;
        setBusy(false);
      }
    }
    return (
      <Modal
        title="Nhập tour từ Excel"
        subtitle="Chọn tệp, kiểm tra rồi nhập một lần. Tour mới là bản nháp."
        onClose={close}
        busy={busy}
        wide
      >
        <div className="import-guide">
          <Upload size={25} />
          <div>
            <strong>.xlsx hoặc .csv · tối đa 20 tour</strong>
            <p>
              Tệp tối đa 2 MB. Ngày dạng YYYY-MM-DD hoặc DD/MM/YYYY; tiền VND và
              số khách là số nguyên, không có dấu phân cách hàng nghìn.
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={downloadTourTemplate}>
          <Download size={16} />
          Tải mẫu CSV cho Excel
        </Button>
        <Field label="Tệp tour Excel hoặc CSV">
          <input
            type="file"
            accept=".xlsx,.csv"
            disabled={busy || saved}
            onChange={choose}
            data-track="tour:import-file"
          />
        </Field>
        <ErrorBox error={error} />
        {busy && !rows && <p className="loading">Đang đọc và kiểm tra tệp…</p>}
        {preview && (
          <>
            <div
              className={
                "import-result " + (preview.errors.length ? "invalid" : "valid")
              }
            >
              <strong>
                {preview.count} / {rows.length} dòng hợp lệ
              </strong>
              <p>
                {preview.errors.length
                  ? "Chưa nhập dữ liệu. Sửa các dòng lỗi và chọn lại tệp."
                  : "Ngày, số chỗ và các trường bắt buộc đã được kiểm tra. Tour chưa được công khai."}
              </p>
            </div>
            {!!preview.errors.length && (
              <ul className="import-errors">
                {preview.errors.map((e) => (
                  <li key={e.row}>
                    Dòng {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
            <div className="import-preview">
              {rows.slice(0, 5).map((t, i) => (
                <div key={i}>
                  <strong>{t.title || `Dòng ${i + 2}`}</strong>
                  <span>
                    {t.destination} · {t.departure} · {t.capacity ?? "?"} chỗ
                  </span>
                </div>
              ))}
              {rows.length > 5 && <p>Và {rows.length - 5} tour khác.</p>}
            </div>
          </>
        )}
        <div className="modal-actions">
          <Button variant="ghost" disabled={busy} onClick={close}>
            Đóng
          </Button>
          <Button
            disabled={busy || saved || !preview || preview.errors.length > 0}
            onClick={save}
          >
            {busy
              ? "Đang nhập…"
              : saved
                ? "Đã nhập"
                : "Nhập " + (rows?.length || 0) + " tour"}
            <Check size={16} />
          </Button>
        </div>
      </Modal>
    );
  }
  function ConflictRecovery({ visible, busy, onRefresh }) {
    if (!visible || !onRefresh) return null;
    return (
      <div className="operation-recovery" role="status">
        <p>
          Dữ liệu có thể đã được cập nhật ở nơi khác. Giá trị bạn vừa nhập vẫn
          được giữ. Nạp bản mới để kiểm tra rồi nhập lại nếu cần.
        </p>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={onRefresh}
          data-track="operation:reload-conflict"
        >
          <RefreshCw size={16} />
          Nạp bản mới
        </Button>
      </div>
    );
  }
  function SeatEditor({
    tour,
    minimumReserved = 0,
    onClose,
    onSave,
    onRefresh,
  }) {
    const [current, setCurrent] = useState(tour),
      [floor, setFloor] = useState(minimumReserved),
      [revision, setRevision] = useState(0);
    const [error, setError] = useState(""),
      [busy, setBusy] = useState(false),
      [conflict, setConflict] = useState(false);
    const pending = useRef(false);
    const close = () => {
      if (!pending.current) onClose();
    };
    async function refresh() {
      if (pending.current || !onRefresh) return;
      pending.current = true;
      setBusy(true);
      setError("");
      try {
        const fresh = await onRefresh(),
          next = fresh?.tours?.find((t) => t.id === current.id);
        if (!next)
          throw Error(
            "Tour không còn trong không gian này. Đóng cửa sổ và kiểm tra danh sách tour.",
          );
        setCurrent(next);
        setFloor(
          (fresh.pooling || [])
            .filter((p) => p.tour_id === next.id && p.status === "confirmed")
            .reduce((sum, p) => sum + p.seats, 0),
        );
        setRevision((n) => n + 1);
        setConflict(false);
      } catch (e) {
        setError(e.message);
      } finally {
        pending.current = false;
        setBusy(false);
      }
    }
    async function submit(e) {
      e.preventDefault();
      if (pending.current) return;
      pending.current = true;
      setBusy(true);
      setError("");
      const reserved = Number(new FormData(e.target).get("reserved"));
      try {
        await api("/tours/" + current.id, "PUT", {
          ...current,
          published: !!current.published,
          reserved,
        });
        await onSave();
        onClose();
      } catch (e) {
        setError(e.message);
        setConflict(e.status === 409);
      } finally {
        pending.current = false;
        setBusy(false);
      }
    }
    return (
      <Modal title="Cập nhật số khách" subtitle={current.title} onClose={close} busy={busy}>
        <form onSubmit={submit}>
          <ErrorBox error={error} />
          <ConflictRecovery
            visible={conflict}
            busy={busy}
            onRefresh={onRefresh ? refresh : null}
          />
          <p className="muted">
            Khởi hành {date(current.departure)} · Sức chứa {current.capacity}{" "}
            khách.
          </p>
          <Field
            label="Khách đã giữ chỗ"
            hint={`Bao gồm ${floor} khách ghép đã xác nhận. Portal sẽ cập nhật số chỗ còn lại.`}
          >
            <input
              key={current.version + ":" + revision}
              type="number"
              name="reserved"
              defaultValue={current.reserved}
              min={floor}
              max={current.capacity}
              required
              autoFocus
              disabled={busy}
            />
          </Field>
          <div className="modal-actions">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={close}
            >
              Hủy
            </Button>
            <Button disabled={busy || conflict}>
              {busy ? "Đang lưu…" : "Lưu số khách"}
              <Check size={16} />
            </Button>
          </div>
        </form>
      </Modal>
    );
  }
  function PoolingEditor({ tours, pool, onClose, onSave, onRefresh }) {
    const [current, setCurrent] = useState(pool),
      [currentTours, setCurrentTours] = useState(tours),
      [revision, setRevision] = useState(0);
    const [error, setError] = useState(""),
      [busy, setBusy] = useState(false),
      [conflict, setConflict] = useState(false);
    const pending = useRef(false);
    const close = () => {
      if (!pending.current) onClose();
    };
    async function refresh() {
      if (pending.current || !onRefresh) return;
      pending.current = true;
      setBusy(true);
      setError("");
      try {
        const fresh = await onRefresh();
        if (!fresh?.tours)
          throw Error("Chưa tải được dữ liệu mới. Vui lòng thử lại.");
        if (current) {
          const next = fresh.pooling?.find((p) => p.id === current.id);
          if (!next)
            throw Error(
              "Phiếu không còn trong không gian này. Đóng cửa sổ và kiểm tra danh sách.",
            );
          setCurrent(next);
        }
        setCurrentTours(fresh.tours);
        setRevision((n) => n + 1);
        setConflict(false);
      } catch (e) {
        setError(e.message);
      } finally {
        pending.current = false;
        setBusy(false);
      }
    }
    async function submit(e) {
      e.preventDefault();
      if (pending.current) return;
      pending.current = true;
      setBusy(true);
      setError("");
      const b = Object.fromEntries(new FormData(e.target));
      try {
        if (current)
          await api("/pooling/" + current.id, "PATCH", {
            action: "payment",
            paid: Number(b.paid),
            version: current.version,
          });
        else
          await api("/pooling", "POST", {
            ...b,
            seats: Number(b.seats),
            unit_price: Number(b.unit_price),
          });
        await onSave();
        onClose();
      } catch (e) {
        setError(e.message);
        setConflict(e.status === 409);
      } finally {
        pending.current = false;
        setBusy(false);
      }
    }
    const inactive = current && current.status !== "confirmed";
    return (
      <Modal
        title={current ? "Đối soát tiền đã thu" : "Tạo phiếu ghép tour"}
        subtitle={
          current
            ? current.partner + " · " + current.tour_title
            : "Ghi nhận thỏa thuận với đối tác; xác nhận chỗ ở bước tiếp theo."
        }
        onClose={close}
        busy={busy}
      >
        <form onSubmit={submit}>
          <ErrorBox error={error} />
          <ConflictRecovery
            visible={conflict}
            busy={busy}
            onRefresh={onRefresh ? refresh : null}
          />
          {current ? (
            <>
              <div className="pool-payment-summary">
                <span>
                  {current.seats} khách × {money(current.unit_price)}
                </span>
                <strong>
                  Phải thu: {money(current.seats * current.unit_price)}
                </strong>
              </div>
              {inactive && (
                <p className="operation-state-note" role="status">
                  Phiếu hiện{" "}
                  {status[current.status]?.toLocaleLowerCase("vi") ||
                    "không khả dụng"}
                  . Chỉ đối soát phiếu đã xác nhận.
                </p>
              )}
              <Field
                label="Tổng tiền đã ghi nhận thu (VND)"
                hint="Nhập tổng lũy kế đã đối chiếu, không nhập riêng khoản vừa thu."
              >
                <input
                  key={current.version + ":" + revision}
                  name="paid"
                  type="number"
                  min="0"
                  max={current.seats * current.unit_price}
                  defaultValue={current.paid}
                  required
                  disabled={busy || inactive}
                />
              </Field>
              <p className="operation-correction-note">
                Mỗi lần lưu thay thế tổng tiền trên sổ và lưu lịch sử trước/sau.
                Giảm số tiền là chỉnh sửa ghi sổ; hệ thống không thực hiện thanh
                toán hoặc hoàn tiền cho đối tác.
              </p>
            </>
          ) : (
            <fieldset className="operation-fields" disabled={busy}>
              <Field label="Tour ghép">
                <select name="tour_id" required defaultValue="">
                  <option value="" disabled>
                    Chọn tour đã có lịch và số chỗ
                  </option>
                  {currentTours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} · {date(t.departure)} · còn{" "}
                      {t.capacity - t.reserved} chỗ
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tên đối tác">
                <input
                  name="partner"
                  required
                  maxLength="120"
                  placeholder="Nhập tên đơn vị đã thỏa thuận"
                />
              </Field>
              <div className="form-grid">
                <Field label="Số khách ghép">
                  <input
                    type="number"
                    name="seats"
                    min="1"
                    max="1000"
                    required
                  />
                </Field>
                <Field
                  label="Giá thỏa thuận / khách (VND)"
                  hint="Giá net: số tiền đối tác trả cho một khách, có thể khác giá bán trên cổng tour."
                >
                  <input
                    type="number"
                    name="unit_price"
                    min="0"
                    max="1000000000"
                    required
                  />
                </Field>
              </div>
              <Field label="Ghi chú thỏa thuận">
                <textarea name="note" rows="3" maxLength="1000" />
              </Field>
            </fieldset>
          )}
          <div className="modal-actions">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={close}
            >
              Hủy
            </Button>
            <Button disabled={busy || conflict || inactive}>
              {busy ? "Đang lưu…" : current ? "Lưu đối soát" : "Tạo phiếu ghép"}
              <Check size={16} />
            </Button>
          </div>
        </form>
      </Modal>
    );
  }
  const status = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
  };
  function Pooling({
    data,
    readOnly,
    canManageDeals = !readOnly,
    canRecordReceipts = !readOnly,
    onNew,
    onPayment,
    reload,
    notify,
    simulated = false,
    tourFilter = "",
    onTourFilter = () => {},
  }) {
    const [busy, setBusy] = useState(""),
      [cancel, setCancel] = useState(null),
      [history, setHistory] = useState(null);
    const [query, setQuery] = useState(""),
      [statusFilter, setStatusFilter] = useState("");
    const [exporting, setExporting] = useState(false),
      [exportError, setExportError] = useState("");
    const exportPending = useRef(false);
    const pending = useRef(false);
    const pools = data.pooling || [],
      confirmed = pools.filter((p) => p.status === "confirmed"),
      tours = Object.fromEntries(data.tours.map((t) => [t.id, t]));
    async function exportWorkbook(e) {
      e.preventDefault();
      if (exportPending.current) return;
      exportPending.current = true;
      setExporting(true);
      setExportError("");
      try {
        await downloadWorkbook("/api/pooling/export.xlsx", "taskhub-cong-no.xlsx");
      } catch (e) {
        setExportError(e.message);
      } finally {
        exportPending.current = false;
        setExporting(false);
      }
    }
    async function action(row, kind) {
      if (pending.current) return;
      pending.current = true;
      setBusy(row.id);
      try {
        await api("/pooling/" + row.id, "PATCH", {
          action: kind,
          version: row.version,
          tour_version: tours[row.tour_id]?.version,
        });
        setCancel(null);
        await reload();
        notify(
          kind === "confirm"
            ? "Đã xác nhận ghép. Số chỗ tour đã cập nhật."
            : "Đã hủy phiếu. Chỗ đã giữ được trả lại.",
        );
      } catch (e) {
        notify(e.message, "error");
        await reload().catch(() => {});
      } finally {
        pending.current = false;
        setBusy("");
      }
    }
    const visiblePools = filterPooling(pools, {
      query,
      status: statusFilter,
      tour: tourFilter,
    });
    const filtersActive = Boolean(query || statusFilter || tourFilter);
    const clearFilters = () => {
      setQuery("");
      setStatusFilter("");
      onTourFilter("");
    };
    const historyPool = pools.find((p) => p.id === history);
    const historyRows = (data.poolingHistory || []).filter(
      (row) => row.pooling_id === history,
    );
    const auditLabels = {
      pooling_created: "Tạo phiếu ghép",
      pooling_confirmed: "Xác nhận giữ chỗ",
      demo_seeded: "Khởi tạo dữ liệu giả lập",
      pooling_reconciled: "Điều chỉnh tổng đã thu",
      pooling_cancelled: "Hủy phiếu",
    };
    const stamp = (value) => {
      const d = new Date(value);
      return Number.isNaN(d.valueOf())
        ? "Không rõ thời điểm"
        : d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    };
    return (
      <>
        {simulated && (
          <div className="pooling-notice" role="note">
            <ShieldCheck size={21} />
            <p>
              <strong>Dữ liệu giả lập:</strong> Khách đã giữ trong tour bao gồm
              khách B2B đã xác nhận. Xem trạng thái và số thu hiện tại trên từng
              phiếu; ghi chú lúc tạo được giữ riêng để đối chiếu. TaskHub không
              thực hiện giao dịch tiền.
            </p>
          </div>
        )}
        <section className="pool-guide" aria-label="Cách ghép tour B2B">
          <h2>Nhận khách từ công ty du lịch khác vào tour của bạn</h2>
          <p>
            B2B là hợp tác giữa các doanh nghiệp. Phiếu giúp đội ngũ thống nhất
            số khách, giữ đúng chỗ và theo dõi tiền đối tác phải trả.
          </p>
          <ol className="pool-steps">
            <li>
              <strong>1. Tạo phiếu</strong>
              <span>Ghi thỏa thuận, chưa giữ chỗ.</span>
            </li>
            <li>
              <strong>2. Xác nhận ghép</strong>
              <span>Nhận khách và trừ chỗ còn trống.</span>
            </li>
            <li>
              <strong>3. Ghi nhận thu</strong>
              <span>Nhập tổng đã nhận, xem số còn thiếu.</span>
            </li>
          </ol>
          <details>
            <summary>Xem ví dụ cách tính chỗ và tiền</summary>
            <p>
              Ví dụ giả lập: tour có 30 chỗ, đã giữ 22. Nhận thêm 4 khách từ đối
              tác; xác nhận xong có 26 khách, còn 4 chỗ. Giá thỏa thuận 4,2
              triệu/khách: tổng 16,8 triệu; đã nhận 8,4 triệu thì còn phải thu
              8,4 triệu.
            </p>
            <p>
              Đối soát là kiểm tra lại số khách, giá và tiền đã nhận. Ô Ghi nhận
              thu lưu <strong>tổng lũy kế</strong>: nhận đủ thì nhập 16,8 triệu.
              Việc chuyển tiền diễn ra bên ngoài TaskHub.
            </p>
          </details>
        </section>
        <p className="muted pool-total-label">
          Tổng quan toàn bộ phiếu trong không gian
        </p>
        <div className="pool-stats">
          <div>
            <span>Phiếu chờ xác nhận</span>
            <strong>
              {pools.filter((p) => p.status === "pending").length}
            </strong>
          </div>
          <div>
            <span>Khách ghép đã xác nhận</span>
            <strong>{confirmed.reduce((s, p) => s + p.seats, 0)}</strong>
          </div>
          <div>
            <span>Còn phải thu theo sổ</span>
            <strong>
              {money(
                confirmed.reduce(
                  (s, p) => s + p.seats * p.unit_price - p.paid,
                  0,
                ),
              )}
            </strong>
          </div>
        </div>
        <div className="pool-filters" aria-label="Lọc phiếu ghép">
          <label className="search">
            <Search size={18} />
            <input
              aria-label="Tìm phiếu B2B"
              placeholder="Tìm đối tác hoặc tên tour…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            <span>Trạng thái</span>
            <select
              aria-label="Trạng thái phiếu B2B"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </label>
          <label>
            <span>Tour</span>
            <select
              aria-label="Tour của phiếu B2B"
              value={tourFilter}
              onChange={(e) => onTourFilter(e.target.value)}
            >
              <option value="">Tất cả tour</option>
              {data.tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="pool-toolbar">
          <span className="muted">
            Hiển thị {visiblePools.length} / {pools.length} phiếu
          </span>
          {filtersActive && (
            <Button variant="ghost" onClick={clearFilters}>
              Xóa bộ lọc phiếu
            </Button>
          )}
          <div className="pool-export-actions">
            <Button
              variant="ghost"
              onClick={() => window.print()}
              data-track="pooling:print"
            >
              <Printer size={16} />
              In / lưu công nợ PDF (theo bộ lọc)
            </Button>
            <a
              className="btn ghost"
              href="/api/pooling/export.xlsx"
              data-track="pooling:export-xlsx"
              onClick={exportWorkbook}
              aria-busy={exporting}
              aria-disabled={exporting}
            >
              <Download size={16} />
              {exporting ? "Đang tải Excel…" : "Công nợ Excel (toàn bộ)"}
            </a>
            <a
              className="btn ghost"
              href="/api/pooling/export"
              data-track="pooling:export"
              title="Xuất toàn bộ phiếu trong không gian"
            >
              <Download size={16} />
              Đối soát CSV
            </a>
            <a
              className="btn ghost"
              href="/api/pooling/history/export"
              data-track="pooling:history-export"
              title="Xuất toàn bộ lịch sử đối soát trong không gian"
            >
              <History size={16} />
              Lịch sử CSV
            </a>
          </div>
        </div>
        <ErrorBox error={exportError} />
        <p className="muted pool-export-note">
          Excel và CSV gồm toàn bộ phiếu trong không gian. PDF chỉ gồm các
          phiếu theo bộ lọc đang chọn.
        </p>
        {!pools.length ? (
          <Empty title="Chưa có phiếu ghép tour">
            <span>
              Tạo phiếu từ thỏa thuận với đối tác. Không cần nhập dữ liệu khách
              hàng cá nhân.
            </span>
            {canManageDeals && (
              <span className="pool-empty-action">
                <Button disabled={!data.tours.length} onClick={onNew}>
                  Tạo phiếu ghép
                  <Plus size={16} />
                </Button>
                {!data.tours.length && (
                  <small>Tạo một tour trước khi lập phiếu ghép.</small>
                )}
              </span>
            )}
          </Empty>
        ) : !visiblePools.length ? (
          <Empty title="Không có phiếu phù hợp">
            Thử đổi tên đối tác, tour hoặc trạng thái.{" "}
            <button className="text-btn" onClick={clearFilters}>
              Xóa bộ lọc phiếu
            </button>
          </Empty>
        ) : (
          <div className="pool-list">
            {visiblePools.map((p) => (
              <article className="pool-card" key={p.id}>
                <div className="pool-card-heading">
                  <div>
                    <strong>{p.partner}</strong>
                    <p>
                      {p.tour_title} · {date(p.departure)}
                    </p>
                  </div>
                  <Badge tone={p.status === "confirmed" ? "blue" : "gray"}>
                    {status[p.status]}
                  </Badge>
                </div>
                <div className="pool-card-facts">
                  <div>
                    <span>Khách ghép</span>
                    <strong>{p.seats} khách</strong>
                  </div>
                  <div>
                    <span>Giá thỏa thuận / khách</span>
                    <strong>{money(p.unit_price)}</strong>
                  </div>
                  <div>
                    <span>Đã ghi nhận thu</span>
                    <strong>{money(p.paid)}</strong>
                  </div>
                  <div>
                    <span>
                      {p.status === "pending"
                        ? "Dự kiến phải thu"
                        : "Còn phải thu"}
                    </span>
                    <strong>
                      {p.status === "cancelled"
                        ? "—"
                        : money(p.seats * p.unit_price - p.paid)}
                    </strong>
                  </div>
                </div>
                {p.note && (
                  <details className="pool-source-note">
                    <summary>Ghi chú lúc tạo phiếu</summary>
                    <p className="muted">
                      Nội dung được giữ theo thời điểm tạo; có thể khác trạng
                      thái và khoản thu hiện tại hiển thị phía trên.
                    </p>
                    <p className="pool-note">{p.note}</p>
                  </details>
                )}
                <div className="pool-card-actions">
                  {p.status !== "cancelled" && (
                    <>
                      {p.status === "pending" && canManageDeals && (
                        <Button
                          disabled={!!busy}
                          onClick={() => action(p, "confirm")}
                          data-track="pooling:confirm"
                        >
                          Xác nhận ghép
                          <Check size={16} />
                        </Button>
                      )}
                      {p.status === "confirmed" && canRecordReceipts && (
                        <Button
                          variant="ghost"
                          disabled={!!busy}
                          onClick={() => onPayment(p)}
                          data-track="pooling:payment"
                        >
                          Ghi nhận thu
                        </Button>
                      )}
                      {canManageDeals && (
                        <Button
                          variant="ghost"
                          disabled={!!busy || p.paid > 0}
                          onClick={() => setCancel(p)}
                          data-track="pooling:cancel"
                        >
                          Hủy phiếu
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    disabled={!!busy}
                    onClick={() => setHistory(p.id)}
                    data-track="pooling:history"
                    data-track-entity={p.id}
                  >
                    <History size={16} />
                    Lịch sử phiếu
                  </Button>
                  {!readOnly && p.paid > 0 && p.status !== "cancelled" && (
                    <small>
                      Phiếu còn tiền đã ghi nhận; kiểm tra đối soát thực tế
                      trước khi hủy.
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {cancel && (
          <Modal
            title="Hủy phiếu ghép tour?"
            subtitle={cancel.partner}
            onClose={() => {
              if (!pending.current) setCancel(null);
            }}
          >
            <p>
              {cancel.status === "confirmed"
                ? `${cancel.seats} chỗ đã giữ sẽ được trả lại cho tour.`
                : "Phiếu chờ chưa giữ chỗ nên số chỗ tour không thay đổi."}{" "}
              Thỏa thuận với đối tác cần được xử lý riêng.
            </p>
            <div className="modal-actions">
              <Button
                variant="ghost"
                disabled={!!busy}
                onClick={() => setCancel(null)}
              >
                Giữ phiếu
              </Button>
              <Button
                variant="danger"
                disabled={!!busy}
                onClick={() => action(cancel, "cancel")}
              >
                {busy ? "Đang hủy…" : "Xác nhận hủy phiếu"}
              </Button>
            </div>
          </Modal>
        )}
        {historyPool && (
          <Modal
            title="Lịch sử phiếu ghép"
            subtitle={historyPool.partner + " · " + historyPool.tour_title}
            onClose={() => setHistory(null)}
            wide
          >
            <p className="pool-history-intro">
              Thao tác và số tiền trước/sau được lưu khi phiếu thay đổi. Đây là
              lịch sử ghi sổ nội bộ, không phải chứng từ thanh toán. Hiển thị
              các dòng của phiếu trong 200 thay đổi gần nhất của không gian; tải
              CSV để xem toàn bộ.
            </p>
            {historyRows.length ? (
              <ol
                className="pool-history"
                aria-label="Các thay đổi của phiếu ghép"
              >
                {historyRows.map((row) => (
                  <li key={row.id}>
                    <div className="pool-history-heading">
                      <strong>
                        {auditLabels[row.action] || "Cập nhật phiếu"}
                      </strong>
                      <time dateTime={row.created}>{stamp(row.created)}</time>
                    </div>
                    <p className="pool-history-actor">
                      {row.actor_name || "Không còn thông tin người thực hiện"}
                    </p>
                    <dl>
                      <div>
                        <dt>Trạng thái</dt>
                        <dd>
                          {row.status_before
                            ? status[row.status_before] || row.status_before
                            : "—"}{" "}
                          <span aria-label="chuyển thành">→</span>{" "}
                          {status[row.status_after] || row.status_after}
                        </dd>
                      </div>
                      <div>
                        <dt>Tổng đã thu</dt>
                        <dd>
                          {money(row.paid_before)}{" "}
                          <span aria-label="chuyển thành">→</span>{" "}
                          {money(row.paid_after)}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="pool-history-empty" role="status">
                Chưa có lịch sử được ghi cho phiếu này trong 200 thay đổi gần
                nhất. Phiếu có trước khi bổ sung tính năng này không được tạo
                lại lịch sử. Có thể tải CSV để kiểm tra các dòng đã lưu.
              </p>
            )}
            <div className="modal-actions">
              <a
                className="btn ghost"
                href="/api/pooling/history/export"
                data-track="pooling:history-export"
              >
                <Download size={16} />
                Tải toàn bộ lịch sử CSV
              </a>
              <Button onClick={() => setHistory(null)}>Đóng lịch sử</Button>
            </div>
          </Modal>
        )}
        <PrintPage>
          <strong>TaskHub · Đối soát tour ghép</strong>
          <h1>Danh sách công nợ B2B</h1>
          <p>
            Lập lúc {new Date().toLocaleString("vi-VN",{timeZone:'Asia/Ho_Chi_Minh'})}. {visiblePools.length}/
            {pools.length} phiếu theo bộ lọc đang chọn.
            {simulated ? " DỮ LIỆU GIẢ LẬP, không phải giao dịch thật." : ""}
          </p>
          <table>
            <thead>
              <tr>
                <th>Đối tác / tour</th>
                <th>Ngày đi</th>
                <th>Khách</th>
                <th>Trạng thái</th>
                <th>Thỏa thuận</th>
                <th>Đã thu</th>
                <th>Còn thu</th>
              </tr>
            </thead>
            <tbody>
              {visiblePools.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.partner}
                    <br />
                    {p.tour_title}
                  </td>
                  <td>{date(p.departure)}</td>
                  <td>{p.seats}</td>
                  <td>{status[p.status]}</td>
                  <td>{money(p.seats * p.unit_price)}</td>
                  <td>{money(p.paid)}</td>
                  <td>
                    {p.status === "confirmed"
                      ? money(p.seats * p.unit_price - p.paid)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="print-note">
            Chỉ phiếu đã xác nhận mới phát sinh khoản phải thu. Số thu là tổng
            lũy kế do người có quyền ghi nhận; chưa xác minh giao dịch ngân
            hàng, chưa phải hóa đơn. Bản PDF theo bộ lọc đang xem; Excel/CSV
            xuất toàn bộ phiếu trong không gian.
          </p>
        </PrintPage>
      </>
    );
  }
  return { ImportTours, SeatEditor, PoolingEditor, Pooling };
}
