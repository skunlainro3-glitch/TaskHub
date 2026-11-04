import React, { useEffect, useState } from "react";
import { RefreshCw, WifiOff, AlertCircle } from "lucide-react";
import { syncState } from "./sync-state.mjs";
import "./workspace-tools.css";
export function SyncStatus({
  lastSuccess,
  error = "",
  roundTrip = null,
  compact = false,
}) {
  const [now, setNow] = useState(Date.now()),
    [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      setNow(Date.now());
    };
    const timer = setInterval(update, 5000);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const state = syncState({ online, lastSuccess, error, now });
  const time = lastSuccess
    ? new Date(lastSuccess).toLocaleTimeString("vi-VN")
    : "";
  const label =
    state === "offline"
      ? "Mất kết nối"
      : state === "stale"
        ? "Dữ liệu có thể đã cũ"
        : state === "loading"
          ? "Đang tải dữ liệu"
          : `Cập nhật định kỳ · ${time}`;
  const Icon =
    state === "offline" ? WifiOff : state === "stale" ? AlertCircle : RefreshCw;
  return (
    <span
      className={"sync-status " + state}
      role="status"
      title={
        compact
          ? "Tự động cập nhật định kỳ khi đang mở trang và có kết nối mạng."
          : "Tự động cập nhật định kỳ, khoảng 5 giây sau lần tải trước khi trang đang hiển thị và có mạng. Thời gian nhận thay đổi phụ thuộc kết nối."
      }
    >
      <Icon size={14} />
      <span>
        {label}
        {!compact && state === "fresh" && roundTrip !== null
          ? ` · ${roundTrip} ms`
          : ""}
      </span>
    </span>
  );
}
