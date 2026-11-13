import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import { taskTemplateInput, taskPersonLabel } from '../shared/task-templates.mjs';
import { loadTaskPeople } from './task-people.mjs';
import './task-templates.css';

const blankEntry = () => ({ title: '', offset_days: 0, priority: 'normal', assignee_id: null });

export function createTaskTemplatesUI({ Button, Field, Modal, ErrorBox, api, date }) {
  return function TaskTemplates({ tours, canManageTeam, onClose, onApplied, onRefresh, notify }) {
    const [templates, setTemplates] = useState([]), [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [mode, setMode] = useState('list'), [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ name: '', entries: [blankEntry()] }), [dirty, setDirty] = useState(false);
    const [tourId, setTourId] = useState(''), [defaultPerson, setDefaultPerson] = useState('');
    const [preview, setPreview] = useState(null), [runId, setRunId] = useState('');
    const [requestId, setRequestId] = useState('');
    // Modal's Escape listener is installed once; read current edits through a ref.
    const latest = useRef({ dirty, busy, onClose });
    latest.current = { dirty, busy, onClose };
    async function load() {
      setLoading(true);
      try {
        const [result, members] = await Promise.all([api('/task-templates'), loadTaskPeople(api, canManageTeam)]);
        setTemplates(result.templates); setPeople(members); setError('');
      } catch (error) { setError(error.message); }
      finally { setLoading(false); }
    }
    useEffect(() => { void load(); }, []);
    useEffect(() => {
      if (!dirty) return;
      const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
      window.addEventListener('beforeunload', warn);
      return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);
    function mayLeave() { return !latest.current.dirty || confirm('Bộ mẫu chưa lưu. Bỏ phần đang sửa?'); }
    function close() { if (!latest.current.busy && mayLeave()) latest.current.onClose(); }
    function back() { if (mayLeave()) { setMode('list'); setDirty(false); setError(''); setPreview(null); } }
    function openEditor(template) {
      setSelected(template); setForm(template ? { name: template.name, entries: template.entries.map((entry) => ({ ...entry })) } : { name: '', entries: [blankEntry()] });
      setRequestId(template ? '' : crypto.randomUUID());
      setMode('edit'); setDirty(false); setError('');
    }
    function change(next) { setForm(next); setDirty(true); }
    function editEntry(index, key, value) {
      change({ ...form, entries: form.entries.map((entry, i) => i === index ? { ...entry, [key]: value } : entry) });
    }
    async function save(event) {
      event.preventDefault(); if (busy) return;
      setBusy(true); setError('');
      try {
        const body = taskTemplateInput(form);
        await api(selected ? '/task-templates/' + selected.id : '/task-templates', selected ? 'PUT' : 'POST', { ...body, ...(selected ? { version: selected.version } : { request_id: requestId }) });
        setDirty(false); setMode('list'); await load(); notify('Đã lưu bộ mẫu công việc.');
      } catch (error) { setError(error.message); }
      finally { setBusy(false); }
    }
    async function archive(template) {
      if (busy || !confirm('Ngừng dùng bộ mẫu “' + template.name + '”? Các công việc đã tạo được giữ nguyên.')) return;
      setBusy(true); setError('');
      try { await api('/task-templates/' + template.id, 'PUT', { version: template.version, archived: true }); await load(); notify('Đã ngừng dùng bộ mẫu.'); }
      catch (error) { setError(error.message); }
      finally { setBusy(false); }
    }
    function openApply(template) {
      setSelected(template); setTourId(''); setDefaultPerson(''); setPreview(null); setRunId(crypto.randomUUID()); setMode('apply'); setError('');
    }
    function applyInput() {
      const tour = tours.find((tour) => tour.id === tourId);
      if (!tour) throw Error('Chọn một tour trước khi xem trước.');
      return { version: selected.version, tour_id: tour.id, tour_version: tour.version, default_assignee_id: defaultPerson || null, run_id: runId };
    }
    async function showPreview(event) {
      event.preventDefault(); if (busy) return;
      setBusy(true); setError(''); setPreview(null);
      try { setPreview(await api('/task-templates/' + selected.id + '/preview', 'POST', applyInput())); }
      catch (error) { setError(error.message); }
      finally { setBusy(false); }
    }
    async function apply() {
      if (busy || !preview) return;
      setBusy(true); setError('');
      try {
        // Keep this same run_id on a network retry; the server never creates it twice.
        const result = await api('/task-templates/' + selected.id + '/apply', 'POST', { ...applyInput(), version: preview.template_version, tour_version: preview.tour_version });
        setDirty(false); await onApplied(); notify('Đã tạo ' + result.count + ' công việc từ bộ mẫu.'); onClose();
      } catch (error) { setError(error.message); }
      finally { setBusy(false); }
    }
    async function refresh() {
      if (busy || !mayLeave()) return;
      setBusy(true);
      try { await onRefresh?.(); await load(); setDirty(false); setMode('list'); setPreview(null); }
      catch (error) { setError(error.message); }
      finally { setBusy(false); }
    }
    return <Modal title="Bộ mẫu công việc" subtitle="Lưu các việc lặp lại; tạo theo ngày khởi hành của tour." onClose={close} busy={busy}>
      <div className="task-template-tool">
        <ErrorBox error={error} />
        {error && <Button type="button" variant="ghost" onClick={refresh} disabled={busy}><RefreshCw size={15} />Nạp lại dữ liệu</Button>}
        {mode !== 'list' && <button type="button" className="text-btn" onClick={back} disabled={busy}><ArrowLeft size={15} />Danh sách bộ mẫu</button>}
        {mode === 'list' && <>
          <div className="task-template-toolbar"><p>Bộ mẫu do nhóm tạo. Áp dụng chỉ thêm việc mới, không thay công việc đang có.</p><Button type="button" onClick={() => openEditor(null)} disabled={loading || busy}><Plus size={16} />Tạo bộ mẫu</Button></div>
          {loading ? <p role="status">Đang tải bộ mẫu…</p> : !templates.length ? <div className="empty-state"><h3>Chưa có bộ mẫu</h3><p>Tạo bộ mẫu từ quy trình thực tế của nhóm rồi dùng lại cho các tour sau.</p></div> : <div className="task-template-list">{templates.map((template) => <article key={template.id}><div><h3>{template.name}</h3><p>{template.entries.length} công việc</p></div><div className="button-row"><Button type="button" onClick={() => openApply(template)} disabled={busy || !tours.length}>Dùng cho tour</Button><Button type="button" variant="ghost" onClick={() => openEditor(template)} disabled={busy}>Sửa mẫu</Button><button type="button" className="text-btn" onClick={() => archive(template)} disabled={busy}>Ngừng dùng</button></div></article>)}</div>}
          {!tours.length && <p className="workspace-notice">Tạo tour trước khi áp dụng bộ mẫu.</p>}
        </>}
        {mode === 'edit' && <form onSubmit={save}><fieldset disabled={busy} className="task-template-fields">
          <Field label="Tên bộ mẫu"><input required maxLength="100" value={form.name} onChange={(event) => change({ ...form, name: event.target.value })} /></Field>
          <p className="muted">Mốc âm là trước ngày đi, 0 là ngày đi, mốc dương là sau ngày đi. Người chưa chọn sẽ được phân công khi dùng mẫu hoặc để “Chưa phân công”.</p>
          {form.entries.map((entry, index) => <section className="task-template-entry" key={index}>
            <h3>Công việc {index + 1}</h3>
            <Field label={'Nội dung công việc ' + (index + 1)}><input required maxLength="160" value={entry.title} onChange={(event) => editEntry(index, 'title', event.target.value)} /></Field>
            <div className="form-grid"><Field label={'Mốc ngày công việc ' + (index + 1)}><input type="number" min="-365" max="365" step="1" required value={entry.offset_days} onChange={(event) => editEntry(index, 'offset_days', event.target.value === '' ? '' : Number(event.target.value))} /></Field><Field label={'Ưu tiên công việc ' + (index + 1)}><select value={entry.priority} onChange={(event) => editEntry(index, 'priority', event.target.value)}><option value="normal">Bình thường</option><option value="high">Cao</option></select></Field></div>
            <Field label={'Tài khoản phụ trách công việc ' + (index + 1)}><select value={entry.assignee_id || ''} onChange={(event) => editEntry(index, 'assignee_id', event.target.value || null)}><option value="">Chọn khi dùng bộ mẫu</option>{entry.assignee_id && !people.some((person) => person.id === entry.assignee_id) && <option value={entry.assignee_id}>Tài khoản cũ — cần chọn lại</option>}{people.map((person) => <option key={person.id} value={person.id}>{taskPersonLabel(person)}</option>)}</select></Field>
            {form.entries.length > 1 && <button className="text-btn" type="button" onClick={() => change({ ...form, entries: form.entries.filter((_, i) => i !== index) })}><Trash2 size={15} />Bỏ công việc {index + 1}</button>}
          </section>)}
          <div className="button-row">{form.entries.length < 20 && <Button type="button" variant="ghost" onClick={() => change({ ...form, entries: [...form.entries, blankEntry()] })}><Plus size={16} />Thêm công việc</Button>}<Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu bộ mẫu'}</Button></div>
        </fieldset></form>}
        {mode === 'apply' && <>
          <h3>{selected.name}</h3>
          <form onSubmit={showPreview}><fieldset disabled={busy} className="task-template-fields"><Field label="Tour áp dụng"><select required value={tourId} onChange={(event) => { setTourId(event.target.value); setPreview(null); }}><option value="">Chọn tour</option>{tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.title} · {date(tour.departure)}</option>)}</select></Field><Field label="Phụ trách các việc chưa có người"><select value={defaultPerson} onChange={(event) => { setDefaultPerson(event.target.value); setPreview(null); }}><option value="">Để chưa phân công</option>{people.map((person) => <option key={person.id} value={person.id}>{taskPersonLabel(person)}</option>)}</select></Field><Button type="submit" variant="ghost">Xem trước công việc</Button></fieldset></form>
          {preview && <section className="task-template-preview"><h3>{preview.rows.length} công việc sẽ được thêm</h3><p>Kiểm tra hạn và người phụ trách. Dùng lại bộ mẫu ở lần khác sẽ tạo thêm một bộ việc.</p><ol>{preview.rows.map((row, index) => <li key={index}><strong>{row.title}</strong><span>Hạn {date(row.due)} · {row.assignee} · {row.priority === 'high' ? 'Ưu tiên cao' : 'Bình thường'}</span></li>)}</ol><Button type="button" onClick={apply} disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo ' + preview.rows.length + ' công việc'}</Button></section>}
        </>}
      </div>
    </Modal>;
  };
}
