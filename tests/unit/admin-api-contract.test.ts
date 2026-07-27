import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorize } from "@/features/auth";
import { GET } from "@/app/api/admin/route";
import type { PublicUser } from "@/types";

vi.mock("@/features/auth", () => ({
  authorize: vi.fn(),
}));

const authorizeMock = vi.mocked(authorize);

function createAdmin(): PublicUser {
  return {
    id: "admin-1",
    name: "Administrador",
    email: "admin@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2026-07-26T12:00:00.000Z",
    updatedAt: "2026-07-26T12:00:00.000Z",
  };
}

describe("GET /api/admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no active authenticated user", async () => {
    authorizeMock.mockResolvedValue({
      authorized: false,
      reason: "UNAUTHORIZED",
    });

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión.",
      },
    });
    expect(authorizeMock).toHaveBeenCalledOnce();
    expect(authorizeMock).toHaveBeenCalledWith("settings:manage");
  });

  it("returns 403 when the user lacks the required permission", async () => {
    authorizeMock.mockResolvedValue({
      authorized: false,
      reason: "FORBIDDEN",
    });

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "No tienes permisos para acceder a la administración.",
      },
    });
    expect(authorizeMock).toHaveBeenCalledOnce();
    expect(authorizeMock).toHaveBeenCalledWith("settings:manage");
  });

  it("returns 200 when the administrator has the required permission", async () => {
    authorizeMock.mockResolvedValue({
      authorized: true,
      user: createAdmin(),
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        access: true,
        section: "administration",
      },
    });
    expect(authorizeMock).toHaveBeenCalledOnce();
    expect(authorizeMock).toHaveBeenCalledWith("settings:manage");
  });
});
