import React, { useState, useRef } from "react";
import { FlaskConical } from "lucide-react";
import "./demo.css";

export function createDemoUI({ Button, ErrorBox, api }) {
  function DemoLoader({ data, reload, notify }) {
    const [busy, setBusy] = useState(false),
      [error, setError] = useState("");
    const lock = useRef(false);
    if (data.tours.length || data.tasks.length || data.pooling?.length)
      return null;
    return (
      <section className="sample-loader">
        <FlaskConical size={24} />
        <div>
          <h3>Bắt đầu với một bộ dữ liệu mẫu</h3>
          <p>
            3 tour, 3 công việc và 3 phiếu B2B giả lập. Tùy chọn này chỉ thêm
            vào không gian trống của bạn; không tạo phản hồi hoặc người thử giả.
          </p>
          <ErrorBox error={error} />
        </div>
        <Button
          disabled={busy}
          data-track="demo:load"
          onClick={async () => {
            if (lock.current) return;
            if (
              !confirm(
                "Thêm bộ dữ liệu giả lập vào không gian trống của bạn? Sau đó bạn có thể sửa hoặc xóa từng bản ghi.",
              )
            )
              return;
            lock.current = true;
            setBusy(true);
            setError("");
            try {
              await api("/demo/load", "POST", {});
              await reload();
              notify(
                "Đã thêm dữ liệu giả lập. Bạn có thể bắt đầu trải nghiệm.",
              );
            } catch (e) {
              setError(e.message);
              await reload().catch(() => {});
            } finally {
              lock.current = false;
              setBusy(false);
            }
          }}
        >
          {busy ? "Đang thêm…" : "Dùng dữ liệu mẫu"}
        </Button>
      </section>
    );
  }
  return { DemoLoader };
}
