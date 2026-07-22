import type { ReportExportFormat } from "@/features/reports";
import { getSession } from "@/lib/auth/session";
import { fail, toJsonResponse } from "@/lib/utils/api-response";
import { reportFiltersSchema } from "@/lib/validations/report";
import { ReportExportService } from "@/services/report-export.service";
import { ReportService } from "@/services/report.service";

export async function createReportExportResponse(
  request: Request,
  format: ReportExportFormat,
): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL")
      return toJsonResponse(fail("FORBIDDEN", "No tienes permiso para exportar reportes."), 403);

    const params = new URL(request.url).searchParams;
    const result = reportFiltersSchema.safeParse({
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      patientId: params.get("patientId") ?? undefined,
      patientStatus: params.get("patientStatus") ?? undefined,
    });
    if (!result.success)
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa los filtros del reporte.", result.error.issues),
        400,
      );

    const summary = await ReportService.summary(result.data);
    const file = await ReportExportService.create(format, summary);
    return new Response(file.body as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible exportar el reporte."), 500);
  }
}
