import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { calendarRangeSchema } from "@/lib/validations/calendar";
import { CalendarService } from "@/services/calendar.service";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const searchParams = new URL(request.url).searchParams;
    const result = calendarRangeSchema.safeParse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa el rango del calendario.", result.error.issues),
        400,
      );
    }

    const items = await CalendarService.list(result.data);

    return toJsonResponse(ok(items));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible consultar el calendario."), 500);
  }
}
