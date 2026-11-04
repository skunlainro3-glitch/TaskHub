import { zipSync, strToU8 } from "fflate";

const xml = (value) =>
  String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[c],
    );
const column = (index) => {
  let name = "";
  for (let n = index + 1; n; n = Math.floor((n - 1) / 26))
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
};
export const xlsxMime =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// A bounded, plain-table XLSX export. Text is always inlineStr, never a formula.
// ZIP packaging stays in fflate; we only describe standard worksheet cells.
export function tableXlsx({ name = "TaskHub", headers, rows, widths = [] }) {
  if (
    !Array.isArray(headers) ||
    !headers.length ||
    headers.length > 30 ||
    !Array.isArray(rows) ||
    rows.length > 5000
  )
    throw Object.assign(
      Error("Báo cáo quá lớn để xuất một tệp. Dùng CSV hoặc chọn kỳ nhỏ hơn."),
      { status: 413 },
    );
  const sheetName =
    name.replace(/[\\/?*\[\]:]/g, " ").slice(0, 31) || "TaskHub";
  const matrix = [headers, ...rows];
  const cell = (v, r, c) => {
    const ref = column(c) + (r + 1),
      style =
        r === 0 ? 1 : typeof v === "number" && Number.isInteger(v) ? 2 : 0;
    return typeof v === "number" && Number.isFinite(v)
      ? `<c r="${ref}" s="${style}"><v>${v}</v></c>`
      : `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  };
  const worksheetRows = matrix
    .map((row, r) => {
      const lines = Math.max(
        1,
        ...headers.map((_, c) =>
          String(row[c] ?? "")
            .split("\n")
            .reduce(
              (n, line) =>
                n +
                Math.max(
                  1,
                  Math.ceil(line.length / Math.max(8, (widths[c] || 22) - 2)),
                ),
              0,
            ),
        ),
      );
      const height = r === 0 ? 32 : Math.min(409, Math.max(22, lines * 15 + 6));
      return `<row r="${r + 1}" ht="${height}" customHeight="1">${headers.map((_, c) => cell(row[c], r, c)).join("")}</row>`;
    })
    .join("");
  const files = {
    "[Content_Types].xml":
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    "xl/styles.xml":
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2564B4"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"><alignment vertical="top" horizontal="right"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    "xl/worksheets/sheet1.xml": `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${headers.map((_, i) => `<col min="${i + 1}" max="${i + 1}" width="${widths[i] || 22}" customWidth="1"/>`).join("")}</cols><sheetData>${worksheetRows}</sheetData><autoFilter ref="A1:${column(headers.length - 1)}${matrix.length}"/></worksheet>`,
  };
  return zipSync(
    Object.fromEntries(
      Object.entries(files).map(([path, content]) => [
        path,
        strToU8(
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + content,
        ),
      ]),
    ),
    { level: 6 },
  );
}
