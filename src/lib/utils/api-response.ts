import type { ApiResponse, ApiError } from "@/types";

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function fail(code: string, message: string, details?: unknown): ApiResponse<never> {
  const error: ApiError = { code, message };
  if (details !== undefined) error.details = details;
  return { success: false, error };
}

export function toJsonResponse<T>(response: ApiResponse<T>, status = 200): Response {
  return Response.json(response, { status });
}
