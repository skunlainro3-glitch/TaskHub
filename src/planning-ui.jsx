import React, { useEffect, useState } from "react";
import { Plus, Trash2, Save, RefreshCw } from "lucide-react";
import {
  emptyPlanning,
  planningInput,
  planningResults,
  planFeatures,
} from "../shared/planning.mjs";
import "./workspace-tools.css";

export function createPlanningUI({ Button, Field, ErrorBox, api, money }) {
  return function BusinessPlanning({ access, notify, onDirtyChange }) {
    const [document, setDocument] = useState(null),
      [plan, setPlan] = useState(emptyPlanning),
      [error, setError] = useState(""),
      [busy, setBusy] = useState(false),
      [dirty, setDirty] = useState(false);
    async function load() {
      try {
        const d = await api("/planning");
        setDocument(d);
        setPlan(d.plan);
        setDirty(false);
        setError("");
      } catch (e) {
        setError(e.message);
      }
    }
    useEffect(() => {
      void load();
    }, []);
    useEffect(() => {
      onDirtyChange(dirty);
    }, [dirty, onDirtyChange]);
    useEffect(() => {
      if (!dirty) return;
      const warn = (e) => {
        e.preventDefault();
        e.returnValue = "";
      };
      window.addEventListener("beforeunload", warn);
      return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);
    const change = (next) => {
      setPlan(next);
      setDirty(true);
    };
    const number = (v) => (v === "" ? null : Number(v));
    const editRow = (kind, index, key, value) =>
      change({
        ...plan,
        [kind]: plan[kind].map((p, i) =>
          i === index ? { ...p, [key]: value } : p,
        ),
      });
    let results = {},
      calculationError = "";
    try {
      results = planningResults(plan);
    } catch (e) {
      calculationError = e.message;
    }
    async function save(e) {
      e.preventDefault();
      if (busy || !document) return;
      setBusy(true);
      setError("");
      try {
        const saved = await api("/planning", "PUT", {
          plan: planningInput(plan),
          version: document.version,
        });
        setDocument(saved);
        setPlan(saved.plan);
        setDirty(false);
        notify("Đã lưu bản nháp kế hoạch nội bộ.");
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }
    const metric = (title, value, unit = "đ") => (
      <div key={title}>
        <span>{title}</span>
        <strong>
          {value === null || value === undefined
            ? "Chưa đủ dữ liệu"
            : unit === "giờ"
              ? new Intl.NumberFormat("vi-VN", {
                  maximumFractionDigits: 1,
                }).format(value) + " giờ"
              : money(value)}
        </strong>
      </div>
    );
    return (
      <form className="workspace-tools" onSubmit={save}>
        <div className="planning-note">
          <strong>Kế hoạch nội bộ, chưa phải bảng giá mở bán.</strong> Nhập giả
          định hoặc dữ liệu đã được nhóm đối chiếu. Các ô để trống chưa được
          tính là 0; kết quả không phải doanh thu thật hoặc bằng chứng khảo sát.
        </div>
        <ErrorBox error={error || calculationError} />
        {!document && (
          <p>
            Đang chờ tải bản nháp.{" "}
            <button type="button" className="text-btn" onClick={load}>
              Thử tải lại
            </button>
          </p>
        )}
        <fieldset
          className="planning-fieldset"
          disabled={busy || !document || !access.canEditPlanning}
        >
          <section className="panel tool-panel">
            <h2>Giá trị đối với doanh nghiệp sử dụng</h2>
            <p>
              So sánh cùng một loại thao tác trước/sau khi dùng TaskHub. Nhóm
              cần có quan sát hoặc phỏng vấn để thay giả định bằng số có căn cứ.
            </p>
            <div className="planning-fields">
              {[
                ["monthlyTasks", "Số thao tác mỗi tháng"],
                ["minutesBefore", "Số phút trước khi áp dụng / thao tác"],
                ["minutesAfter", "Số phút sau khi áp dụng / thao tác"],
                ["hourlyCost", "Chi phí nhân sự / giờ (VND)"],
                ["monthlyFee", "Phí phần mềm dự kiến / tháng (VND)"],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={plan.value[key] ?? ""}
                    onChange={(e) =>
                      change({
                        ...plan,
                        value: { ...plan.value, [key]: number(e.target.value) },
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            <div className="planning-metrics">
              {metric("Thời gian tiết kiệm / tháng", results.hours, "giờ")}
              {metric("Giá trị thời gian quy đổi / tháng", results.laborValue)}
              {metric("Giá trị sau phí phần mềm / tháng", results.netValue)}
            </div>
            <p className="muted">
              Thời gian tiết kiệm = số thao tác × (phút trước − phút sau) / 60.
              Giá trị quy đổi = giờ tiết kiệm × chi phí giờ. Kết quả âm vẫn được
              giữ; thời gian tiết kiệm không tự trở thành tiền mặt hoặc doanh
              thu tăng.
            </p>
          </section>
          <section className="panel tool-panel">
            <h2>Soạn gói dịch vụ dự kiến</h2>
            <p>
              Phân biệt gói bằng các chức năng MVP đã có. Các lựa chọn ở đây chỉ
              dùng cho kế hoạch, chưa tạo giới hạn tài khoản hoặc thu tiền.
            </p>
            {plan.plans.map((p, i) => (
              <div className="planning-row" key={i}>
                <div className="planning-fields">
                  <Field label={"Tên gói " + (i + 1)}>
                    <input
                      maxLength="80"
                      value={p.name}
                      onChange={(e) =>
                        editRow("plans", i, "name", e.target.value)
                      }
                    />
                  </Field>
                  <Field label={"Giá tháng gói " + (i + 1) + " (VND)"}>
                    <input
                      type="number"
                      min="0"
                      value={p.price ?? ""}
                      onChange={(e) =>
                        editRow("plans", i, "price", number(e.target.value))
                      }
                    />
                  </Field>
                  <Field label={"Số doanh nghiệp dự kiến gói " + (i + 1)}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={p.customers ?? ""}
                      onChange={(e) =>
                        editRow("plans", i, "customers", number(e.target.value))
                      }
                    />
                  </Field>
                </div>
                <div className="planning-features">
                  {Object.entries(planFeatures).map(([id, label]) => (
                    <label className="checkbox" key={id}>
                      <input
                        type="checkbox"
                        checked={p.features.includes(id)}
                        onChange={(e) =>
                          editRow(
                            "plans",
                            i,
                            "features",
                            e.target.checked
                              ? [...p.features, id]
                              : p.features.filter((f) => f !== id),
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() =>
                    change({
                      ...plan,
                      plans: plan.plans.filter((_, n) => n !== i),
                    })
                  }
                >
                  <Trash2 size={15} /> Bỏ gói dự kiến {i + 1}
                </button>
              </div>
            ))}
            {plan.plans.length < 4 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  change({
                    ...plan,
                    plans: [
                      ...plan.plans,
                      { name: "", price: null, customers: null, features: [] },
                    ],
                  })
                }
              >
                <Plus size={16} /> Thêm gói dự kiến
              </Button>
            )}
            {!!plan.plans.length && (
              <div className="table-wrap planning-comparison">
                <table>
                  <caption>So sánh nội dung các gói dự kiến</caption>
                  <thead>
                    <tr>
                      <th>Tính năng</th>
                      {plan.plans.map((p, i) => (
                        <th key={i}>{p.name || "Chưa đặt tên"}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(planFeatures).map(([id, label]) => (
                      <tr key={id}>
                        <td>{label}</td>
                        {plan.plans.map((p, i) => (
                          <td key={i}>
                            {p.features.includes(id) ? "Có" : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="panel tool-panel">
            <h2>Dòng doanh thu dự kiến</h2>
            <p>
              Doanh thu thuê bao tháng được tính từ các gói ở trên. Dòng thu một
              lần cần do nhóm xác định riêng, không tự coi B2B tour là doanh thu
              SaaS.
            </p>
            {plan.extras.map((p, i) => (
              <div className="planning-row" key={i}>
                <div className="planning-fields">
                  <Field label={"Tên dòng thu một lần " + (i + 1)}>
                    <input
                      maxLength="80"
                      value={p.name}
                      onChange={(e) =>
                        editRow("extras", i, "name", e.target.value)
                      }
                    />
                  </Field>
                  <Field label={"Đơn giá một lần " + (i + 1) + " (VND)"}>
                    <input
                      type="number"
                      min="0"
                      value={p.price ?? ""}
                      onChange={(e) =>
                        editRow("extras", i, "price", number(e.target.value))
                      }
                    />
                  </Field>
                  <Field label={"Số lượng dòng thu " + (i + 1)}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={p.quantity ?? ""}
                      onChange={(e) =>
                        editRow("extras", i, "quantity", number(e.target.value))
                      }
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() =>
                    change({
                      ...plan,
                      extras: plan.extras.filter((_, n) => n !== i),
                    })
                  }
                >
                  Bỏ dòng thu {i + 1}
                </button>
              </div>
            ))}
            {plan.extras.length < 4 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  change({
                    ...plan,
                    extras: [
                      ...plan.extras,
                      { name: "", price: null, quantity: null },
                    ],
                  })
                }
              >
                <Plus size={16} /> Thêm dòng thu một lần
              </Button>
            )}
            <div className="planning-metrics">
              {metric("Thuê bao mỗi tháng dự kiến (MRR)", results.mrr)}
              {metric("Quy đổi 12 tháng dự kiến", results.annualRunRate)}
              {metric("Thu một lần dự kiến", results.oneTime)}
            </div>
            <p className="muted">
              MRR = tổng giá tháng × số doanh nghiệp của từng gói. Quy đổi năm =
              12 × MRR, giả định giữ nguyên khách và giá; chưa tính thuế, chi
              phí, churn hoặc chiết khấu. Thu một lần không nằm trong MRR.
            </p>
          </section>
          <section className="panel tool-panel">
            <h2>Cơ sở số liệu và điều cần xác nhận</h2>
            <Field
              label="Nguồn số liệu, thời điểm đo hoặc giả định của nhóm"
              hint="Ghi rõ số nào đã đo, số nào là giả định; không nhập thông tin cá nhân của người khảo sát."
            >
              <textarea
                rows="4"
                maxLength="2000"
                value={plan.notes || ""}
                onChange={(e) => change({ ...plan, notes: e.target.value })}
              />
            </Field>
          </section>
        </fieldset>
        <div className="planning-toolbar">
          {access.canEditPlanning && (
            <Button disabled={busy || !document || !!calculationError}>
              <Save size={16} />
              {busy ? "Đang lưu…" : "Lưu bản nháp"}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (!dirty || confirm("Bỏ thay đổi chưa lưu và tải bản mới?"))
                void load();
            }}
          >
            <RefreshCw size={16} /> Tải bản đã lưu
          </Button>
          <small>
            {dirty
              ? "Có thay đổi chưa lưu"
              : document?.updated
                ? "Bản lưu lúc " +
                  new Date(document.updated).toLocaleString("vi-VN")
                : "Chưa lưu giả định"}
          </small>
        </div>
      </form>
    );
  };
}
