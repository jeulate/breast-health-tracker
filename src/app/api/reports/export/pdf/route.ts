import { createReportExportResponse } from "@/app/api/reports/export/report-export-response";

export async function GET(request: Request): Promise<Response> {
  return createReportExportResponse(request, "pdf");
}
