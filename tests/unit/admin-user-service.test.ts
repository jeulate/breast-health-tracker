import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types";

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  listAll: vi.fn(),
  save: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("@/repositories/user.repository", () => ({
  UserRepository: class {
    findById = mocks.findById;
    findByEmail = mocks.findByEmail;
    listAll = mocks.listAll;
    save = mocks.save;
  },
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: mocks.hashPassword,
}));

vi.mock("crypto", () => ({
  randomUUID: () => "generated-user-id",
}));

import { AdminUserService } from "@/services/admin-user.service";

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Administrador",
    email: "admin@example.com",
    passwordHash: "stored-password-hash",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2026-07-27T12:00:00.000Z",
    updatedAt: "2026-07-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("AdminUserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.save.mockResolvedValue(undefined);
  });

  it("lists users alphabetically without exposing password hashes", async () => {
    mocks.listAll.mockResolvedValue([
      createUser({ id: "user-2", name: "Zoe" }),
      createUser({
        id: "user-1",
        name: "Ana",
        email: "ana@example.com",
        role: "PROFESSIONAL",
      }),
    ]);

    const result = await AdminUserService.list();

    expect(result.map((user) => user.name)).toEqual(["Ana", "Zoe"]);
    expect(result[0]).not.toHaveProperty("passwordHash");
    expect(result[1]).not.toHaveProperty("passwordHash");
  });

  it("gets an existing public user", async () => {
    mocks.findById.mockResolvedValue(createUser());

    const result = await AdminUserService.getById("user-1");

    expect(result?.id).toBe("user-1");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("returns null when the requested user does not exist", async () => {
    mocks.findById.mockResolvedValue(null);

    await expect(AdminUserService.getById("missing-user")).resolves.toBeNull();
  });

  it("creates a user with a hashed password", async () => {
    mocks.findByEmail.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue("new-password-hash");

    const result = await AdminUserService.create({
      name: "Ana Profesional",
      email: "ana@example.com",
      password: "Secure123",
      role: "PROFESSIONAL",
      status: "ACTIVE",
    });

    expect(mocks.hashPassword).toHaveBeenCalledWith("Secure123");
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "generated-user-id",
        name: "Ana Profesional",
        email: "ana@example.com",
        passwordHash: "new-password-hash",
        role: "PROFESSIONAL",
        status: "ACTIVE",
      }),
    );
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("rejects an email already assigned to another user", async () => {
    mocks.findByEmail.mockResolvedValue(createUser());

    await expect(
      AdminUserService.create({
        name: "Otro usuario",
        email: "admin@example.com",
        password: "Secure123",
        role: "PROFESSIONAL",
        status: "ACTIVE",
      }),
    ).rejects.toThrow("EMAIL_ALREADY_EXISTS");

    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("updates an existing user without exposing the password hash", async () => {
    mocks.findById.mockResolvedValue(createUser({ role: "PROFESSIONAL" }));

    const result = await AdminUserService.update(
      "user-1",
      { name: "Nombre actualizado", status: "ACTIVE" },
      "admin-actor",
    );

    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
        name: "Nombre actualizado",
        passwordHash: "stored-password-hash",
      }),
    );
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("returns null when updating a nonexistent user", async () => {
    mocks.findById.mockResolvedValue(null);

    await expect(
      AdminUserService.update("missing-user", { name: "Nombre actualizado" }, "admin-actor"),
    ).resolves.toBeNull();

    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("prevents an administrator from deactivating their own account", async () => {
    mocks.findById.mockResolvedValue(createUser());

    await expect(
      AdminUserService.update("user-1", { status: "INACTIVE" }, "user-1"),
    ).rejects.toThrow("SELF_DEACTIVATION_NOT_ALLOWED");

    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("prevents deactivating the last active administrator", async () => {
    const administrator = createUser();
    mocks.findById.mockResolvedValue(administrator);
    mocks.listAll.mockResolvedValue([administrator]);

    await expect(
      AdminUserService.update(administrator.id, { status: "INACTIVE" }, "another-admin"),
    ).rejects.toThrow("LAST_ACTIVE_ADMIN");

    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("prevents changing the last active administrator to professional", async () => {
    const administrator = createUser();
    mocks.findById.mockResolvedValue(administrator);
    mocks.listAll.mockResolvedValue([administrator]);

    await expect(
      AdminUserService.update(administrator.id, { role: "PROFESSIONAL" }, "another-admin"),
    ).rejects.toThrow("LAST_ACTIVE_ADMIN");
  });

  it("allows changing an administrator when another active administrator exists", async () => {
    const target = createUser();
    const secondAdministrator = createUser({
      id: "admin-2",
      email: "admin2@example.com",
    });

    mocks.findById.mockResolvedValue(target);
    mocks.listAll.mockResolvedValue([target, secondAdministrator]);

    const result = await AdminUserService.update(
      target.id,
      { role: "PROFESSIONAL" },
      secondAdministrator.id,
    );

    expect(result?.role).toBe("PROFESSIONAL");
    expect(mocks.save).toHaveBeenCalledOnce();
  });

  it("resets the password using a new hash", async () => {
    mocks.findById.mockResolvedValue(createUser());
    mocks.hashPassword.mockResolvedValue("replacement-password-hash");

    const result = await AdminUserService.resetPassword("user-1", {
      password: "NewSecure123",
    });

    expect(mocks.hashPassword).toHaveBeenCalledWith("NewSecure123");
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
        passwordHash: "replacement-password-hash",
      }),
    );
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("returns null when resetting a nonexistent user's password", async () => {
    mocks.findById.mockResolvedValue(null);

    await expect(
      AdminUserService.resetPassword("missing-user", {
        password: "NewSecure123",
      }),
    ).resolves.toBeNull();

    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
