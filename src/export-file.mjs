function saveBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadTable(filename, table) {
  const { tableXlsx, xlsxMime } = await import("../shared/xlsx.mjs");
  saveBlob(filename, new Blob([tableXlsx(table)], { type: xlsxMime }));
}

// Keep the user on the current screen if a protected export fails or expires.
export async function downloadWorkbook(path, filename) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: { "X-TaskHub": "1" },
      signal: controller.signal,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw Error(data.message || "Chưa tải được tệp Excel. Vui lòng thử lại.");
    }
    if (!response.headers.get("content-type")?.includes("spreadsheetml"))
      throw Error("Hệ thống chưa trả về tệp Excel. Vui lòng tải lại trang rồi thử lại.");
    saveBlob(filename, await response.blob());
  } catch (error) {
    if (error.name === "AbortError")
      throw Error("Tải Excel quá lâu. Kiểm tra kết nối rồi thử lại.");
    if (error instanceof TypeError)
      throw Error("Mất kết nối khi tải Excel. Kiểm tra mạng rồi thử lại.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
