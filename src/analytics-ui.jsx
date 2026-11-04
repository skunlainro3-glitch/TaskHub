import React, { useEffect, useState, useRef } from "react";
import { BarChart3, Download, Printer, RefreshCw } from "lucide-react";
import { analyticsRange } from "../shared/analytics.mjs";
import { api } from "./api.mjs";
import { startPolling } from "./polling.mjs";
import { PrintPage } from "./print-page.jsx";
import { downloadWorkbook } from "./export-file.mjs";
import "./analytics.css";

const money = (n) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";
const percent = (n) =>
  n === null
    ? "Chưa có dữ liệu"
    : new Intl.NumberFormat("vi-VN", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(n);
const status = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
};
function Ledger({ rows }) {
  return (
    <table>
      <thead>
        <tr>
          {[
            "Đối tác / tour",
            "Khởi hành",
            "Khách",
            "Trạng thái",
            "Giá trị thỏa thuận",
            "Đã ghi nhận thu",
            "Còn phải thu",
          ].map((x) => (
            <th key={x}>{x}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>
              <strong>{r.partner}</strong>
              <small>{r.tour}</small>
            </td>
            <td>{r.departure}</td>
            <td>{r.seats}</td>
            <td>{status[r.status]}</td>
            <td>{money(r.total)}</td>
            <td>{money(r.paid)}</td>
            <td>{r.balance === null ? "—" : money(r.balance)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export function Analytics({ access }) {
  const initial = analyticsRange();
  const [filter, setFilter] = useState(initial),
    [draft, setDraft] = useState(initial),
    [report, setReport] = useState(null),
    [error, setError] = useState(""),
    [filterError, setFilterError] = useState(""),
    [exportError, setExportError] = useState(""),
    [exporting, setExporting] = useState(false),
    [busy, setBusy] = useState(false);
  const pending = useRef(false),
    request = useRef(0);
  const query = new URLSearchParams({
    from: filter.from,
    to: filter.to,
  }).toString();
  async function load() {
    if (pending.current) return;
    const id = ++request.current;
    pending.current = true;
    setBusy(true);
    try {
      const d = await api("/analytics?" + query);
      if (id === request.current) {
        setReport(d);
        setError("");
      }
    } catch (e) {
      if (id === request.current) setError(e.message);
      throw e;
    } finally {
      if (id === request.current) {
        pending.current = false;
        setBusy(false);
      }
    }
  }
  useEffect(() => {
    setReport(null);
    setError("");
    pending.current = false;
    const stop = startPolling(load, { interval: 30000, maxInterval: 60000 });
    return () => {
      stop();
      request.current++;
    };
  }, [query, access.canReadPooling, access.canReadInquiries]);
  const reload = () => void load().catch(() => {});
  const r =
    report &&
    report.range.from === filter.from &&
    report.range.to === filter.to &&
    report.access.canReadPooling === access.canReadPooling &&
    report.access.canReadInquiries === access.canReadInquiries
      ? report
      : null;
  const stats = r
    ? [
        ["Tour trong kỳ", r.tours.total, "Theo ngày khởi hành, gồm bản nháp"],
        [
          "Khách đã giữ",
          r.tours.reserved,
          "Số khách đang giữ chỗ trên các tour trong kỳ",
        ],
        [
          "Tỷ lệ lấp đầy",
          percent(r.tours.occupancy),
          "Tổng đã giữ / tổng sức chứa",
        ],
        [
          "Công việc hoàn thành",
          percent(r.tasks.completion),
          `${r.tasks.done}/${r.tasks.total} việc có hạn trong kỳ`,
        ],
      ]
    : [];
  const max = r ? Math.max(1, ...r.months.map((m) => m.reserved)) : 1;
  return (
    <div className="analytics-report">
      <form
        className="analytics-filter panel"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const next = analyticsRange(draft);
            setFilterError("");
            if (next.from === filter.from && next.to === filter.to) reload();
            else setFilter(next);
          } catch (e) {
            setFilterError(e.message);
          }
        }}
      >
        <label>
          Từ ngày
          <input
            aria-label="Báo cáo từ ngày"
            type="date"
            required
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </label>
        <label>
          Đến ngày
          <input
            aria-label="Báo cáo đến ngày"
            type="date"
            required
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
        </label>
        <button className="btn" disabled={busy}>
          Xem báo cáo
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={busy}
          onClick={reload}
        >
          <RefreshCw size={16} />
          Tải lại
        </button>
      </form>
      {filterError && <div className="error" role="alert">{filterError}</div>}
      {error && (
        <div className="error" role="alert">
          {error} {r ? "Số liệu bên dưới chưa được cập nhật. Bấm Tải lại để kiểm tra." : "Bấm Tải lại để thử lại."}
        </div>
      )}
      {exportError && <div className="error" role="alert">{exportError}</div>}
      {!r ? (
        <p className="loading">
          {error
            ? "Chưa tải được báo cáo. Thử tải lại."
            : "Đang tổng hợp báo cáo…"}
        </p>
      ) : (
        <>
          <div className="analytics-meta">
            <span>
              {r.range.from} đến {r.range.to} · Lập lúc{" "}
              {new Date(r.generated).toLocaleTimeString("vi-VN",{timeZone:'Asia/Ho_Chi_Minh'})}
            </span>
            <div className="button-row">
              <a
                className="btn ghost"
                href={"/api/analytics/export.xlsx?" + query}
                aria-disabled={exporting}
                onClick={async (e) => {
                  e.preventDefault();
                  if (exporting) return;
                  setExporting(true);
                  setExportError("");
                  try {
                    await downloadWorkbook("/api/analytics/export.xlsx?" + query, "taskhub-bao-cao.xlsx");
                  } catch (e) {
                    setExportError(e.message);
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                <Download size={16} />
                {exporting ? "Đang tải Excel…" : "Báo cáo Excel"}
              </a>
              <button
                className="btn ghost"
                disabled={busy || !!error}
                onClick={() => window.print()}
              >
                <Printer size={16} />
                In / lưu PDF
              </button>
            </div>
          </div>
          <details className="analytics-definitions">
            <summary>Cách tính số liệu</summary>
            <ul>
              <li>Tour và phiếu B2B theo ngày khởi hành; công việc theo hạn; yêu cầu tư vấn theo ngày gửi, giờ Việt Nam.</li>
              <li>Số chỗ và trạng thái là dữ liệu hiện tại, không phải số đặt tour mới phát sinh trong kỳ.</li>
              {r.pooling && <li>Công nợ chỉ cộng phiếu đã xác nhận. Khoản thu do nhân viên ghi nhận, chưa đối chiếu ngân hàng và không phải doanh thu thuê bao TaskHub.</li>}
              <li>Số liệu tự cập nhật khoảng 30 giây khi đang xem. Có thể bấm Tải lại để kiểm tra ngay.</li>
            </ul>
          </details>
          <div className="stat-grid">
            {stats.map(([label, value, note]) => (
              <section className="stat-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </section>
            ))}
          </div>
          <section className="panel analytics-panel">
            <h2>
              <BarChart3 size={20} /> Lịch tour theo tháng
            </h2>
            {r.tours.total ? (
              <div
                className="analytics-bars"
                role="img"
                aria-label="Biểu đồ khách đã giữ theo tháng khởi hành"
              >
                {r.months.map((m) => (
                  <div className="analytics-bar" key={m.month}>
                    <span>{m.month}</span>
                    <div>
                      <i style={{ width: (100 * m.reserved) / max + "%" }} />
                    </div>
                    <strong>
                      {m.reserved} khách · {m.tours} tour
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                Chưa có tour khởi hành trong kỳ này. Chọn kỳ khác hoặc tạo tour
                trước.
              </p>
            )}
          </section>
          <section className="panel analytics-panel">
            <h2>Công việc và yêu cầu tư vấn</h2>
            <div className="analytics-breakdown">
              <div>
                <h3>Công việc theo hạn</h3>
                <p>
                  {r.tasks.todo} cần làm · {r.tasks.doing} đang làm ·{" "}
                  {r.tasks.done} hoàn thành
                </p>
                <strong>{r.tasks.overdue} việc quá hạn chưa xong</strong>
              </div>
              {r.inquiries && (
                <div>
                  <h3>Yêu cầu theo ngày gửi</h3>
                  <p>
                    {r.inquiries.new} mới · {r.inquiries.contacted} đã liên hệ ·{" "}
                    {r.inquiries.closed} đã đóng
                  </p>
                  <strong>{r.inquiries.total} yêu cầu</strong>
                  <p className="muted">
                    Đã liên hệ/đóng không đồng nghĩa đã đặt tour.
                  </p>
                </div>
              )}
            </div>
          </section>
          {r.pooling && (
            <section className="panel analytics-panel">
              <h2>Đối soát B2B theo lịch khởi hành</h2>
              <div className="planning-metrics">
                {[
                  ["Giá trị phiếu xác nhận", r.pooling.agreed],
                  ["Đã ghi nhận thu lũy kế", r.pooling.paid],
                  ["Còn phải thu", r.pooling.balance],
                ].map(([title, value]) => (
                  <div key={title}>
                    <span>{title}</span>
                    <strong>{money(value)}</strong>
                  </div>
                ))}
              </div>
              <p>
                {r.pooling.confirmed} phiếu xác nhận · {r.pooling.pending} chờ ·{" "}
                {r.pooling.cancelled} đã hủy.
              </p>
              <p className="muted">Tổng tiền chỉ tính phiếu đã xác nhận. Các khoản thu do nhân viên ghi nhận.</p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tháng khởi hành</th>
                      <th>Giá trị phiếu xác nhận</th>
                      <th>Thu lũy kế</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.months.map((m) => (
                      <tr key={m.month}>
                        <td>{m.month}</td>
                        <td>{money(m.agreed)}</td>
                        <td>{money(m.paid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {r.ledger.length ? (
                <div className="table-wrap">
                  <Ledger rows={r.ledger} />
                </div>
              ) : (
                <p>Chưa có phiếu B2B cho các tour trong kỳ này.</p>
              )}
            </section>
          )}
          <PrintPage>
            <strong>TaskHub · Báo cáo vận hành</strong>
            <h1>
              Báo cáo {r.range.from} – {r.range.to}
            </h1>
            {r.simulated && (
              <p>
                <strong>DỮ LIỆU GIẢ LẬP PHỤC VỤ DEMO</strong>
              </p>
            )}
            <p>
              Lập lúc {new Date(r.generated).toLocaleString("vi-VN",{timeZone:'Asia/Ho_Chi_Minh'})}. {r.today}{" "}
              theo giờ Việt Nam.
            </p>
            {error && <p><strong>Chưa tải lại được dữ liệu. Kiểm tra thời điểm lập trước khi sử dụng báo cáo.</strong></p>}
            <table>
              <tbody>
                {stats.map(([label, value, note]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{value}</td>
                    <td>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {r.pooling && (
              <>
                <h2>Công nợ B2B</h2>
                <p>
                  Giá trị phiếu xác nhận: {money(r.pooling.agreed)}. Đã ghi nhận
                  thu: {money(r.pooling.paid)}. Còn phải thu:{" "}
                  {money(r.pooling.balance)}.
                </p>
                <Ledger rows={r.ledger} />
              </>
            )}
            <p className="print-note">
              Tour/B2B theo ngày khởi hành, công việc theo hạn. Số chỗ và khoản
              thu là trạng thái lúc lập báo cáo; không phải doanh thu SaaS hoặc
              xác nhận thanh toán ngân hàng. Thông tin tư vấn cá nhân không được
              đưa vào bản in.
            </p>
          </PrintPage>
        </>
      )}
    </div>
  );
}
