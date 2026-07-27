import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorize } from "@/features/auth/authorization";
import { AuthService } from "@/services/auth.service";
import type { PublicUser } from "@/types";

vi.mock("@/services/auth.service", () => ({
  AuthService: {
    currentUser: vi.fn(),
  },
}));

const currentUserMock = vi.mocked(AuthService.currentUser);

function createUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "user-1",
    name: "Administrador",
    email: "admin@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2026-07-26T12:00:00.000Z",
    updatedAt: "2026-07-26T12:00:00.000Z",
    ...overrides,
  };
}

describe("authorize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when there is no active authenticated user", async () => {
    currentUserMock.mockResolvedValue(null);

    await expect(authorize("settings:manage")).resolves.toEqual({
      authorized: false,
      reason: "UNAUTHORIZED",
    });
  });

  it("returns FORBIDDEN when the user lacks the requested permission", async () => {
    currentUserMock.mockResolvedValue(
      createUser({
        role: "PROFESSIONAL",
      }),
    );

    await expect(authorize("settings:manage")).resolves.toEqual({
      authorized: false,
      reason: "FORBIDDEN",
    });
  });

  it("returns the user when the requested permission is granted", async () => {
    const user = createUser();
    currentUserMock.mockResolvedValue(user);

    await expect(authorize("settings:manage")).resolves.toEqual({
      authorized: true,
      user,
    });
  });
});
