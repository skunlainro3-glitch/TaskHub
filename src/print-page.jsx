import React from "react";
import { createPortal } from "react-dom";
import "./print-page.css";

// No new tab, upload or third-party service: the user chooses a printer/PDF file.
export function PrintPage({ children }) {
  return createPortal(
    <article className="taskhub-print">{children}</article>,
    document.body,
  );
}
