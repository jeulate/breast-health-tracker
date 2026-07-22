import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { reportFiltersSchema } from "@/lib/validations/report";
import { ReportService } from "@/services/report.service";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL")
      return toJsonResponse(fail("FORBIDDEN", "No tienes permiso para consultar reportes."), 403);
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
    return toJsonResponse(ok(await ReportService.summary(result.data)));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible generar el reporte."), 500);
  }
}
