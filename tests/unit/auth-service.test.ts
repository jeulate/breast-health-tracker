import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types";

const mocks = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  verifyPassword: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/repositories/user.repository", () => ({
  UserRepository: class {
    findByEmail = mocks.findByEmail;
    findById = mocks.findById;
  },
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: mocks.verifyPassword,
}));

vi.mock("@/lib/auth/session", () => ({
  createSession: mocks.createSession,
  deleteSession: mocks.deleteSession,
  getSession: mocks.getSession,
}));

import { AuthService } from "@/services/auth.service";

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Usuario de prueba",
    email: "user@example.com",
    passwordHash: "hashed-password",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
    ...overrides,
  };
}

describe("AuthService.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows an active administrator to log in", async () => {
    const user = createUser();

    mocks.findByEmail.mockResolvedValue(user);
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.createSession.mockResolvedValue(undefined);

    const result = await AuthService.login(user.email, "correct-password");

    expect(mocks.findByEmail).toHaveBeenCalledWith(user.email);
    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      "correct-password",
      user.passwordHash,
    );
    expect(mocks.createSession).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: "ADMIN",
    });
    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("allows an active professional to log in", async () => {
    const user = createUser({
      id: "professional-1",
      email: "professional@example.com",
      role: "PROFESSIONAL",
    });

    mocks.findByEmail.mockResolvedValue(user);
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.createSession.mockResolvedValue(undefined);

    const result = await AuthService.login(user.email, "correct-password");

    expect(mocks.createSession).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: "PROFESSIONAL",
    });
    expect(result.role).toBe("PROFESSIONAL");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("rejects a nonexistent user", async () => {
    mocks.findByEmail.mockResolvedValue(null);

    await expect(
      AuthService.login("missing@example.com", "password"),
    ).rejects.toThrow("INVALID_CREDENTIALS");

    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password", async () => {
    const user = createUser();

    mocks.findByEmail.mockResolvedValue(user);
    mocks.verifyPassword.mockResolvedValue(false);

    await expect(
      AuthService.login(user.email, "incorrect-password"),
       ).rejects.toThrow("INVALID_CREDENTIALS");

    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects an inactive account regardless of its role", async () => {
    const user = createUser({
      role: "PROFESSIONAL",
      status: "INACTIVE",
    });

    mocks.findByEmail.mockResolvedValue(user);
    mocks.verifyPassword.mockResolvedValue(true);

    await expect(
      AuthService.login(user.email, "correct-password"),
    ).rejects.toThrow("ACCOUNT_INACTIVE");

    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});