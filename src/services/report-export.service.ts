import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  buildReportExportRows,
  buildReportFilename,
  type ReportExportFormat,
  type ReportSummary,
} from "@/features/reports";

export interface ReportExportFile {
  body: Uint8Array;
  contentType: string;
  filename: string;
}

export class ReportExportService {
  static async create(
    format: ReportExportFormat,
    summary: ReportSummary,
  ): Promise<ReportExportFile> {
    return format === "csv" ? this.createCsv(summary) : this.createPdf(summary);
  }

  static createCsv(summary: ReportSummary): ReportExportFile {
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = buildReportExportRows(summary);
    const lines = [
      ["Periodo desde", summary.period.from],
      ["Periodo hasta", summary.period.to],
      [],
      ["Categoria", "Total", "Detalle"],
      ...rows.map((row) => [row.category, row.total, row.detail]),
    ];
    const csv = `\uFEFF${lines.map((line) => line.map(escape).join(";")).join("\r\n")}\r\n`;

    return {
      body: new TextEncoder().encode(csv),
      contentType: "text/csv; charset=utf-8",
      filename: buildReportFilename("csv", summary),
    };
  }

  static async createPdf(summary: ReportSummary): Promise<ReportExportFile> {
    const document = await PDFDocument.create();
    const page = document.addPage([595.28, 841.89]);
    const regular = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    const rows = buildReportExportRows(summary);

    page.drawText("Reporte clinico consolidado", {
      x: 48,
      y: 785,
      size: 20,
      font: bold,
      color: rgb(0.75, 0.08, 0.25),
    });
    page.drawText(`Periodo: ${summary.period.from} al ${summary.period.to}`, {
      x: 48,
      y: 760,
      size: 10,
      font: regular,
      color: rgb(0.3, 0.3, 0.35),
    });

    const startY = 715;
    page.drawRectangle({
      x: 48,
      y: startY,
      width: 499,
      height: 28,
      color: rgb(0.96, 0.96, 0.97),
    });
    page.drawText("Categoria", { x: 58, y: startY + 9, size: 10, font: bold });
    page.drawText("Total", { x: 210, y: startY + 9, size: 10, font: bold });
    page.drawText("Detalle por estado", { x: 265, y: startY + 9, size: 10, font: bold });

    rows.forEach((row, index) => {
      const y = startY - 31 - index * 46;
      page.drawText(row.category, { x: 58, y, size: 10, font: bold });
      page.drawText(String(row.total), { x: 210, y, size: 10, font: regular });
      drawWrappedText(page, row.detail, 265, y, 270, regular);
      page.drawLine({
        start: { x: 48, y: y - 13 },
        end: { x: 547, y: y - 13 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.88),
      });
    });

    page.drawText("Documento generado por Breast Health Tracker", {
      x: 48,
      y: 42,
      size: 8,
      font: regular,
      color: rgb(0.45, 0.45, 0.5),
    });

    return {
      body: await document.save(),
      contentType: "application/pdf",
      filename: buildReportFilename("pdf", summary),
    };
  }
}

function drawWrappedText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
): void {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, 9) <= maxWidth) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  lines
    .slice(0, 3)
    .forEach((value, index) => page.drawText(value, { x, y: y - index * 11, size: 9, font }));
}
