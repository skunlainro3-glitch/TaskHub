import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  Check, Download, FileText, History, Plus, Printer, RefreshCw,
  Search, Send, SquarePen, Undo2,
} from "lucide-react";
import { PrintPage } from "./print-page.jsx";
import { downloadWorkbook } from "./export-file.mjs";
import { normalizeSearchText } from "./tour-search.mjs";
import { todayVietnam } from "./dates.mjs";
import "./quotes.css";

const statusNames = {
  draft: "Bản nháp", pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Cần sửa",
};
const actionNames = {
  create: "Tạo báo giá", created: "Tạo báo giá", update: "Sửa bản nháp", updated: "Sửa bản nháp", edited: "Sửa bản nháp",
  submit: "Gửi duyệt", withdraw: "Rút về nháp", approve: "Duyệt báo giá",
  reject: "Yêu cầu sửa", revise: "Mở lại bản nháp",
};
const quoteCode = (quote) => "BG-" + quote.id.slice(0, 8).toUpperCase();
const time = (value) => value ? new Date(value).toLocaleString("vi-VN") : "—";
const blankForm = () => ({
  tour_id: "", recipient_name: "", recipient_email: "", people: "", unit_price: "",
  discount_amount: "0", valid_until: "", notes: "",
});
const quoteForm = (quote) => ({
  ...blankForm(), ...quote.payload, tour_id: quote.tour_id,
});

export function createQuotesUI({ Button, Field, Modal, ErrorBox, Badge, money, date, api }) {
  function Status({ value }) {
    return <Badge tone={value === "approved" ? "green" : value === "pending" ? "orange" : "gray"}>
      {statusNames[value] || value}
    </Badge>;
  }

  function Totals({ quote }) {
    const p = quote.payload;
    return <dl className="quote-totals">
      <div><dt>Tạm tính · {p.people} khách × {money(p.unit_price)}</dt><dd>{money(quote.subtotal)}</dd></div>
      <div><dt>Giảm giá cho cả đoàn</dt><dd>− {money(p.discount_amount)}</dd></div>
      <div className="quote-total"><dt>Tổng báo giá</dt><dd>{money(quote.total)}</dd></div>
    </dl>;
  }

  function QuoteEditor({ initial, tours, onClose, onSaved, onDirtyChange, onInspectList }) {
    const [record, setRecord] = useState(initial),
      [form, setForm] = useState(() => initial ? quoteForm(initial.quote) : blankForm()),
      [dirty, setDirty] = useState(false),
      [busy, setBusy] = useState(false),
      [error, setError] = useState(""),
      [conflict, setConflict] = useState(false);
    const pending = useRef(false), requestId = useRef(crypto.randomUUID());
    const changed = (key, value) => {
      setForm((current) => ({ ...current, [key]: value }));
      setDirty(true);
    };
    useEffect(() => {
      onDirtyChange?.(dirty);
      return () => onDirtyChange?.(false);
    }, [dirty, onDirtyChange]);
    useEffect(() => {
      if (!dirty) return;
      const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
      window.addEventListener("beforeunload", warn);
      return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);
    function close() {
      if (pending.current) return;
      if (dirty && !confirm("Báo giá có thay đổi chưa lưu. Bỏ thay đổi và đóng?")) return;
      onClose();
    }
    function chooseTour(id) {
      const selected = tours.find((tour) => tour.id === id);
      setForm((current) => ({ ...current, tour_id: id, unit_price: selected?.price ?? "" }));
      setDirty(true);
    }
    async function reload() {
      if (pending.current || !record) return;
      if (dirty && !confirm("Tải bản đã lưu sẽ thay phần đang nhập. Anh/chị đã đối chiếu và muốn tải lại?")) return;
      pending.current = true;
      setBusy(true);
      try {
        const next = await api("/quotes/" + record.quote.id);
        setRecord(next);
        setForm(quoteForm(next.quote));
        setDirty(false);
        setConflict(false);
        setError(next.capabilities.canEdit ? "" : "Báo giá đã chuyển trạng thái và không còn sửa được. Đóng để xem bản mới.");
      } catch (e) { setError(e.message); }
      finally { pending.current = false; setBusy(false); }
    }
    const people = Number(form.people), price = Number(form.unit_price), discount = Number(form.discount_amount);
    const subtotal = people * price;
    const validTotal = form.people !== "" && form.unit_price !== "" &&
      [people, price, discount, subtotal].every(Number.isSafeInteger) && people > 0 &&
      price >= 0 && discount >= 0 && discount <= subtotal;
    const editable = !record || record.capabilities.canEdit;
    async function save(event) {
      event.preventDefault();
      if (pending.current || !editable) return;
      if (!validTotal) { setError("Kiểm tra số khách, đơn giá và giảm giá. Giảm giá không được vượt tạm tính."); return; }
      pending.current = true;
      setBusy(true);
      setError("");
      try {
        const input = {
          ...form, people, unit_price: price, discount_amount: discount,
          ...(record ? { version: record.quote.version } : { request_id: requestId.current }),
        };
        delete input.tour;
        const saved = await api(record ? "/quotes/" + record.quote.id : "/quotes", record ? "PUT" : "POST", input);
        setDirty(false);
        onDirtyChange?.(false);
        onSaved(saved);
      } catch (e) {
        setError(e.message);
        setConflict(e.status === 409);
      } finally { pending.current = false; setBusy(false); }
    }
    const archivedTour = record && !tours.some((tour) => tour.id === record.quote.tour_id);
    return <Modal title={record ? "Sửa bản nháp báo giá" : "Tạo báo giá"}
      subtitle="Lưu nháp, kiểm tra rồi gửi duyệt. Báo giá không tự giữ chỗ."
      onClose={close} busy={busy} wide>
      <form onSubmit={save} className="quote-form">
        <ErrorBox error={error} />
        {conflict && record && <div className="quote-conflict">
          <p>Phần đang nhập được giữ lại. Đối chiếu trước khi tải bản mới.</p>
          <Button type="button" variant="ghost" onClick={reload} disabled={busy}>
            <RefreshCw size={16} /> Tải bản đã lưu
          </Button>
        </div>}
        {conflict && !record && <div className="quote-conflict">
          <p>Giữ phần đang nhập để đối chiếu. Nếu lần lưu trước đã thành công, kiểm tra danh sách trước khi tạo thêm.</p>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => {
            if (!dirty || confirm("Đóng phần đang nhập để kiểm tra báo giá đã lưu trong danh sách?")) onInspectList();
          }}>Đóng và kiểm tra danh sách</Button>
        </div>}
        <fieldset disabled={busy || !editable}>
          <Field label="Tour báo giá">
            <select required value={form.tour_id} onChange={(e) => chooseTour(e.target.value)} data-track="quote:tour">
              <option value="">Chọn tour</option>
              {archivedTour && <option value={record.quote.tour_id}>{record.quote.payload.tour.title} · bản đã lưu</option>}
              {tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.title} · {date(tour.departure)}</option>)}
            </select>
          </Field>
          <div className="quote-fields">
            <Field label="Người / đơn vị nhận báo giá">
              <input required maxLength="120" value={form.recipient_name} onChange={(e) => changed("recipient_name", e.target.value)} autoComplete="off" />
            </Field>
            <Field label="Email người nhận (không bắt buộc)" hint="Chỉ lưu vào báo giá, không tự gửi email.">
              <input type="email" maxLength="254" value={form.recipient_email} onChange={(e) => changed("recipient_email", e.target.value)} autoComplete="off" />
            </Field>
            <Field label="Số khách">
              <input required type="number" min="1" max="1000" step="1" value={form.people} onChange={(e) => changed("people", e.target.value)} />
            </Field>
            <Field label="Đơn giá / khách (VND)">
              <input required type="number" min="0" max="1000000000" step="1" value={form.unit_price} onChange={(e) => changed("unit_price", e.target.value)} />
            </Field>
            <Field label="Giảm giá cho cả đoàn (VND)">
              <input required type="number" min="0" step="1" value={form.discount_amount} onChange={(e) => changed("discount_amount", e.target.value)} />
            </Field>
            <Field label="Báo giá có giá trị đến ngày" hint="Cần còn hạn khi gửi duyệt và duyệt.">
              <input required type="date" value={form.valid_until} onChange={(e) => changed("valid_until", e.target.value)} />
            </Field>
          </div>
          <Field label="Điều kiện / ghi chú (không bắt buộc)">
            <textarea rows="3" maxLength="2000" value={form.notes} onChange={(e) => changed("notes", e.target.value)} />
          </Field>
        </fieldset>
        {validTotal && <Totals quote={{ payload: { people, unit_price: price, discount_amount: discount }, subtotal, total: subtotal - discount }} />}
        <p className="quote-note">Lịch trình được lưu cùng báo giá. Thay đổi tour về sau không tự sửa bản báo giá đã lưu.</p>
        <div className="modal-actions quote-actions">
          <Button type="button" variant="ghost" onClick={close} disabled={busy}>Hủy</Button>
          <Button type="submit" disabled={busy || !editable} data-track="quote:save">
            <Check size={16} /> {busy ? "Đang lưu…" : "Lưu bản nháp"}
          </Button>
        </div>
      </form>
    </Modal>;
  }

  function QuoteDetails({ id, initial, user, onClose, onEdit, onChanged }) {
    const [document, setDocument] = useState(initial || null),
      [error, setError] = useState(""),
      [busy, setBusy] = useState(false),
      [loading, setLoading] = useState(!initial),
      [conflict, setConflict] = useState(false),
      [note, setNote] = useState(""),
      [printed, setPrinted] = useState(null);
    const pending = useRef(false), request = useRef(0);
    useEffect(() => {
      const clearPrint = () => setPrinted(null);
      window.addEventListener("afterprint", clearPrint);
      return () => window.removeEventListener("afterprint", clearPrint);
    }, []);
    async function load() {
      if (pending.current) return;
      if (note.trim() && !confirm("Tải lại và bỏ ghi chú xử lý chưa gửi?")) return;
      const current = ++request.current;
      setPrinted(null);
      setLoading(true);
      try {
        const next = await api("/quotes/" + id);
        if (current !== request.current) return;
        setDocument(next); setNote(""); setConflict(false); setError("");
      } catch (e) { if (current === request.current) setError(e.message); }
      finally { if (current === request.current) setLoading(false); }
    }
    useEffect(() => {
      if (!initial) void load();
      return () => { request.current += 1; };
    }, [id]);
    function close() {
      if (pending.current) return;
      if (note.trim() && !confirm("Đóng và bỏ ghi chú xử lý chưa gửi?")) return;
      onClose();
    }
    async function action(kind) {
      if (pending.current || loading || !document) return;
      const q = document.quote;
      if (kind === "approve" && !confirm(
        (q.created_by === user.id ? "Bạn đang duyệt báo giá do chính mình tạo với quyền chủ không gian. " : "") +
        "Duyệt báo giá " + quoteCode(q) + " cho " + q.payload.recipient_name + ", tổng " + money(q.total) + "?",
      )) return;
      if (kind === "revise" && !confirm("Mở lại bản nháp sẽ bỏ trạng thái đã duyệt. Cần gửi duyệt lại trước khi xuất báo giá. Tiếp tục?")) return;
      pending.current = true; setBusy(true); setError(""); setPrinted(null);
      try {
        const next = await api("/quotes/" + id, "PATCH", { action: kind, version: q.version, note: note.trim() });
        setDocument(next); setNote(""); setConflict(false); setPrinted(null);
        onChanged(actionNames[kind] + " thành công.");
      } catch (e) { setError(e.message); setConflict(e.status === 409); setPrinted(null); }
      finally { pending.current = false; setBusy(false); }
    }
    async function exportFile(kind) {
      if (pending.current || loading || !document) return;
      pending.current = true; setBusy(true); setError("");
      try {
        if (kind === "excel") {
          await downloadWorkbook("/api/quotes/" + id + "/export.xlsx", quoteCode(document.quote) + ".xlsx");
        } else {
          const canonical = await api("/quotes/" + id + "/export-data");
          flushSync(() => setPrinted(canonical.quote));
          window.print();
        }
      } catch (e) { setError(e.message); setConflict(e.status === 409); setPrinted(null); }
      finally { pending.current = false; setBusy(false); }
    }
    const quote = document?.quote, caps = document?.capabilities || {}, p = quote?.payload;
    const expired = p && p.valid_until < todayVietnam();
    return <>
      <Modal title={quote ? "Báo giá " + quoteCode(quote) : "Chi tiết báo giá"}
        subtitle="Bản đã lưu và lịch sử duyệt trong không gian làm việc."
        onClose={close} busy={busy} wide>
        <div className="quote-detail">
          <ErrorBox error={error} />
          {(conflict || (!quote && !loading)) && <Button variant="ghost" onClick={load} disabled={busy || loading}>
            <RefreshCw size={16} /> Tải bản mới
          </Button>}
          {loading && <p role="status">Đang tải báo giá…</p>}
          {quote && <>
            <div className="quote-detail-heading">
              <Status value={quote.status} />
              <span className="muted">Phiên bản {quote.version} · cập nhật {time(quote.updated)}</span>
            </div>
            <h3>{p.tour.title}</h3>
            <dl className="quote-information">
              <div><dt>Người nhận</dt><dd>{p.recipient_name}{p.recipient_email && <small>{p.recipient_email}</small>}</dd></div>
              <div><dt>Khởi hành</dt><dd>{date(p.tour.departure)}</dd></div>
              <div><dt>Điểm đến / thời lượng</dt><dd>{p.tour.destination} · {p.tour.duration}</dd></div>
              <div><dt>Có giá trị đến</dt><dd>{date(p.valid_until)}{expired && <small className="quote-expired">Đã hết hạn báo giá</small>}</dd></div>
              <div><dt>Người tạo</dt><dd>{quote.created_by_name || "Tài khoản đã xóa"}</dd></div>
              <div><dt>Người duyệt</dt><dd>{quote.status === "approved" ? quote.reviewed_by_name || "Tài khoản đã xóa" : "Chưa duyệt"}</dd></div>
            </dl>
            <Totals quote={quote} />
            {p.notes && <section className="quote-text"><h4>Điều kiện / ghi chú</h4><p>{p.notes}</p></section>}
            <details className="quote-itinerary">
              <summary>Lịch trình trong báo giá</summary>
              {p.tour.description && <p>{p.tour.description}</p>}
              <p>{p.tour.itinerary}</p>
            </details>
            <div className="quote-actions">
              {caps.canEdit && <Button variant="ghost" onClick={() => onEdit(document)} disabled={busy || loading} data-track="quote:edit"><SquarePen size={16} /> Sửa bản nháp</Button>}
              {caps.canSubmit && <Button onClick={() => action("submit")} disabled={busy || loading || conflict || expired} data-track="quote:submit"><Send size={16} /> Gửi duyệt</Button>}
              {caps.canWithdraw && <Button variant="ghost" onClick={() => action("withdraw")} disabled={busy || loading || conflict}><Undo2 size={16} /> Rút về nháp</Button>}
              {caps.canRevise && <Button variant="ghost" onClick={() => action("revise")} disabled={busy || loading || conflict}><SquarePen size={16} /> Mở lại bản nháp</Button>}
            </div>
            {(caps.canApprove || caps.canReject) && <section className="quote-review">
              <h4>Xử lý báo giá chờ duyệt</h4>
              <Field label="Ghi chú xử lý" hint="Bắt buộc ghi rõ nội dung cần sửa khi yêu cầu sửa.">
                <textarea rows="2" maxLength="1000" value={note} disabled={busy || loading} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <div className="quote-actions">
                {caps.canApprove && <Button onClick={() => action("approve")} disabled={busy || loading || conflict || expired} data-track="quote:approve"><Check size={16} />{quote.created_by === user.id ? "Duyệt với quyền chủ không gian" : "Duyệt báo giá"}</Button>}
                {caps.canReject && <Button variant="ghost" onClick={() => action("reject")} disabled={busy || loading || conflict || !note.trim()} data-track="quote:reject">Yêu cầu sửa</Button>}
              </div>
            </section>}
            {expired && quote.status !== "approved" && <p className="quote-note">Cần sửa ngày hết hạn trong bản nháp trước khi gửi duyệt hoặc duyệt.</p>}
            {quote.status === "pending" && !caps.canApprove && <p className="quote-note">Đang chờ chủ không gian hoặc quản lý có quyền duyệt. Người quản lý không tự duyệt báo giá do mình tạo.</p>}
            {caps.canExport && <section className="quote-export">
              <div className="quote-actions">
                <Button variant="ghost" onClick={() => exportFile("excel")} disabled={busy || loading || conflict} data-track="quote:export-xlsx"><Download size={16} /> Báo giá Excel</Button>
                <Button variant="ghost" onClick={() => exportFile("pdf")} disabled={busy || loading || conflict} data-track="quote:print"><Printer size={16} /> In / lưu báo giá PDF</Button>
              </div>
              <p className="quote-note">Xuất nội dung đã duyệt, không dùng dữ liệu tour đang thay đổi. Báo giá không phải xác nhận đặt tour hoặc thanh toán.</p>
            </section>}
            {!caps.canExport && <p className="quote-note">Chỉ báo giá đã duyệt mới được xuất Excel hoặc lưu PDF.</p>}
            <section className="quote-history">
              <h4><History size={17} /> Lịch sử báo giá</h4>
              <ol>{(document.history || []).map((item) => <li key={item.id}>
                <div><strong>{actionNames[item.action] || statusNames[item.to_status] || "Cập nhật báo giá"}</strong><time dateTime={item.created}>{time(item.created)}</time></div>
                <p>{item.actor_name || "Tài khoản đã xóa"} · phiên bản {item.version}</p>
                {item.note && <p className="quote-history-note">{item.note}</p>}
              </li>)}</ol>
            </section>
            <div className="modal-actions quote-actions">
              <Button variant="ghost" onClick={load} disabled={busy || loading}><RefreshCw size={16} /> Tải lại</Button>
              <Button onClick={close} disabled={busy}>Đóng</Button>
            </div>
          </>}
        </div>
      </Modal>
      {printed && <PrintPage>
        <p>TaskHub · {quoteCode(printed)}</p>
        <h1>BÁO GIÁ TOUR</h1>
        <h2>{printed.payload.tour.title}</h2>
        <p>Kính gửi: {printed.payload.recipient_name}{printed.payload.recipient_email ? " · " + printed.payload.recipient_email : ""}</p>
        <p>Khởi hành: {date(printed.payload.tour.departure)} · {printed.payload.tour.duration}<br />Điểm đến: {printed.payload.tour.destination}<br />Báo giá có giá trị đến: {date(printed.payload.valid_until)}</p>
        <table><thead><tr><th>Nội dung</th><th>Số khách</th><th>Đơn giá (VND)</th><th>Thành tiền (VND)</th></tr></thead>
          <tbody><tr><td>{printed.payload.tour.title}</td><td>{printed.payload.people}</td><td>{money(printed.payload.unit_price)}</td><td>{money(printed.subtotal)}</td></tr>
            <tr><td colSpan="3">Giảm giá cho cả đoàn</td><td>− {money(printed.payload.discount_amount)}</td></tr>
            <tr><th colSpan="3">Tổng báo giá</th><th>{money(printed.total)}</th></tr></tbody></table>
        {printed.payload.tour.description && <p>{printed.payload.tour.description}</p>}
        <h2>Lịch trình</h2><p>{printed.payload.tour.itinerary}</p>
        {printed.payload.notes && <><h2>Điều kiện / ghi chú</h2><p>{printed.payload.notes}</p></>}
        <p className="print-note">Đã duyệt bởi {printed.reviewed_by_name || "người được cấp quyền"} lúc {time(printed.reviewed_at)}. Phiên bản {printed.version}.<br />Báo giá không thay thế xác nhận đặt tour, không giữ chỗ và không xác nhận thanh toán.</p>
      </PrintPage>}
    </>;
  }

  return function Quotes({ user, access, tours, notify, onDirtyChange }) {
    const [data, setData] = useState(null), [error, setError] = useState(""),
      [loading, setLoading] = useState(true), [query, setQuery] = useState(""),
      [status, setStatus] = useState(""), [modal, setModal] = useState(null);
    const pending = useRef(false), mounted = useRef(true);
    async function load() {
      if (pending.current) return;
      pending.current = true; setLoading(true);
      try {
        const result = await api("/quotes");
        if (mounted.current) { setData(result); setError(""); }
      } catch (e) { if (mounted.current) setError(e.message); }
      finally { pending.current = false; if (mounted.current) setLoading(false); }
    }
    useEffect(() => {
      mounted.current = true; void load();
      return () => { mounted.current = false; onDirtyChange?.(false); };
    }, []);
    const rows = data?.quotes || [];
    const visible = rows.filter((q) => (!status || q.status === status) &&
      normalizeSearchText([quoteCode(q), q.payload.recipient_name, q.payload.tour.title].join(" ")).includes(normalizeSearchText(query)));
    const canCreate = data?.access?.canEdit ?? access?.canEditQuotes ?? false;
    const changed = (message) => { if (message) notify(message); void load(); };
    return <section className="quotes-page">
      <div className="quote-page-toolbar">
        <div className="quote-actions">
          <Button variant="ghost" onClick={load} disabled={loading} aria-label="Tải lại danh sách báo giá"><RefreshCw size={16} /> Tải lại</Button>
          {canCreate && <Button onClick={() => setModal({ kind: "new" })} disabled={!tours.length} data-track="quote:new"><Plus size={16} /> Tạo báo giá</Button>}
        </div>
      </div>
      <ErrorBox error={error} />
      <div className="quote-filters">
        <label className="quote-search"><span>Tìm báo giá</span><div><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mã, người nhận hoặc tour…" /></div></label>
        <label><span>Trạng thái</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(statusNames).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
      </div>
      {loading && <p role="status">Đang tải báo giá…</p>}
      {!loading && !rows.length && !error && <div className="quote-empty panel">
        <FileText size={28} /><h3>Chưa có báo giá</h3>
        <p>{canCreate ? tours.length ? "Chọn Tạo báo giá để lập bản nháp đầu tiên." : "Tạo hoặc nhập tour trước khi lập báo giá." : "Báo giá của không gian sẽ xuất hiện tại đây."}</p>
      </div>}
      {!!rows.length && <p className="muted quote-result-count">Hiển thị {visible.length} / {rows.length} báo giá</p>}
      {!loading && !!rows.length && !visible.length && <div className="quote-empty panel"><h3>Không tìm thấy báo giá phù hợp</h3><Button variant="ghost" onClick={() => { setQuery(""); setStatus(""); }}>Xóa bộ lọc</Button></div>}
      <div className="quote-list">{visible.map((q) => <article className="quote-card panel" key={q.id}>
        <div className="quote-card-heading"><button className="quote-open" data-track="quote:details" onClick={() => setModal({ kind: "detail", id: q.id })} aria-label={"Xem báo giá " + quoteCode(q)}>{quoteCode(q)} <span>{q.payload.tour.title}</span></button><Status value={q.status} /></div>
        <dl className="quote-card-data"><div><dt>Người nhận</dt><dd>{q.payload.recipient_name}</dd></div><div><dt>Số khách</dt><dd>{q.payload.people}</dd></div><div><dt>Tổng báo giá</dt><dd>{money(q.total)}</dd></div><div><dt>Có giá trị đến</dt><dd>{date(q.payload.valid_until)}</dd></div></dl>
        <div className="quote-card-bottom"><span>Cập nhật {time(q.updated)}</span><button className="text-btn" onClick={() => setModal({ kind: "detail", id: q.id })}>Xem chi tiết</button></div>
      </article>)}</div>
      {(modal?.kind === "new" || modal?.kind === "edit") && <QuoteEditor key={modal.kind === "new" ? "new" : modal.document.quote.id}
        initial={modal.document} tours={tours} onDirtyChange={onDirtyChange}
        onInspectList={() => { setModal(null); void load(); }}
        onClose={() => setModal(null)} onSaved={(saved) => {
          setModal({ kind: "detail", id: saved.quote.id, document: saved }); changed("Đã lưu bản nháp báo giá.");
        }} />}
      {modal?.kind === "detail" && <QuoteDetails key={modal.id} id={modal.id} initial={modal.document}
        user={user} onClose={() => setModal(null)} onEdit={(document) => setModal({ kind: "edit", document })} onChanged={changed} />}
    </section>;
  };
}
