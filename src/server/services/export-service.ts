import ExcelJS from "exceljs";

type ExportRow = Record<string, string | number | null>;

export async function buildWorkbookBuffer(rows: ExportRow[], sheetName: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Maika";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];

  worksheet.columns = keys.map((key) => ({
    header: key,
    key,
    width: Math.max(14, key.length + 4),
  }));

  if (rows.length > 0) {
    worksheet.addRows(rows);
  } else if (keys.length === 0) {
    worksheet.addRow(["暂无数据"]);
  }

  return workbook.xlsx.writeBuffer();
}

export function buildAttachmentHeaders(filename: string) {
  return {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
}
