import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicUser } from "@/types";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock("@/features/auth", () => ({
  authorize: mocks.authorize,
}));

vi.mock("@/services/admin-user.service", () => ({
  AdminUserService: {
    list: mocks.list,
    getById: mocks.getById,
    create: mocks.create,
    update: mocks.update,
    resetPassword: mocks.resetPassword,
  },
}));

import { GET as listUsers, POST as createUser } from "@/app/api/admin/users/route";
import { GET as getUser, PATCH as updateUser } from "@/app/api/admin/users/[id]/route";
import { POST as resetPassword } from "@/app/api/admin/users/[id]/reset-password/route";

const administrator: PublicUser = {
  id: "admin-1",
  name: "Administrador",
  email: "admin@example.com",
  role: "ADMIN",
  status: "ACTIVE",
  createdAt: "2026-07-27T12:00:00.000Z",
  updatedAt: "2026-07-27T12:00:00.000Z",
};

const professional: PublicUser = {
  id: "professional-1",
  name: "Profesional",
  email: "professional@example.com",
  role: "PROFESSIONAL",
  status: "ACTIVE",
  createdAt: "2026-07-27T12:00:00.000Z",
  updatedAt: "2026-07-27T12:00:00.000Z",
};

function authorized() {
  return {
    authorized: true as const,
    user: administrator,
  };
}

function dynamicParams(id = professional.id) {
  return {
    params: Promise.resolve({ id }),
  };
}

function jsonRequest(url: string, method: "POST" | "PATCH", body: unknown): Request {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function malformedJsonRequest(url: string, method: "POST" | "PATCH"): Request {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: "{invalid-json",
  });
}

async function responseBody(response: Response) {
  return response.json();
}

describe("admin users API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorize.mockResolvedValue(authorized());
  });

  describe("GET /api/admin/users", () => {
    it("returns 401 when there is no authenticated session", async () => {
      mocks.authorize.mockResolvedValue({
        authorized: false,
        reason: "UNAUTHORIZED",
      });

      const response = await listUsers();
      const body = await responseBody(response);

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(mocks.list).not.toHaveBeenCalled();
    });

    it("returns 403 when the user lacks users:manage", async () => {
      mocks.authorize.mockResolvedValue({
        authorized: false,
        reason: "FORBIDDEN",
      });

      const response = await listUsers();
      const body = await responseBody(response);

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
      expect(mocks.list).not.toHaveBeenCalled();
    });

    it("returns the administrative user list", async () => {
      mocks.list.mockResolvedValue([administrator, professional]);

      const response = await listUsers();
      const body = await responseBody(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([administrator, professional]);
      expect(mocks.authorize).toHaveBeenCalledWith("users:manage");
      expect(mocks.list).toHaveBeenCalledOnce();
    });

    it("returns 500 when listing users fails unexpectedly", async () => {
      mocks.list.mockRejectedValue(new Error("Redis unavailable"));

      const response = await listUsers();
      const body = await responseBody(response);

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("POST /api/admin/users", () => {
    const validInput = {
      name: "Nueva Profesional",
      email: "new@example.com",
      password: "Secure123",
      role: "PROFESSIONAL",
      status: "ACTIVE",
    };

    it("creates a valid user", async () => {
      const createdUser: PublicUser = {
        ...professional,
        id: "new-user",
        name: validInput.name,
        email: validInput.email,
      };

      mocks.create.mockResolvedValue(createdUser);

      const response = await createUser(
        jsonRequest("http://localhost/api/admin/users", "POST", validInput),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(createdUser);
      expect(mocks.create).toHaveBeenCalledWith(validInput);
    });

    it("returns 400 for invalid user fields", async () => {
      const response = await createUser(
        jsonRequest("http://localhost/api/admin/users", "POST", {
          name: "",
          email: "invalid-email",
          password: "short",
          role: "UNKNOWN",
        }),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(mocks.create).not.toHaveBeenCalled();
    });

    it("returns 400 for malformed JSON", async () => {
      const response = await createUser(
        malformedJsonRequest("http://localhost/api/admin/users", "POST"),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(mocks.create).not.toHaveBeenCalled();
    });

    it("returns 409 when the email is already registered", async () => {
      mocks.create.mockRejectedValue(new Error("EMAIL_ALREADY_EXISTS"));

      const response = await createUser(
        jsonRequest("http://localhost/api/admin/users", "POST", validInput),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("returns 500 when user creation fails unexpectedly", async () => {
      mocks.create.mockRejectedValue(new Error("Unexpected failure"));

      const response = await createUser(
        jsonRequest("http://localhost/api/admin/users", "POST", validInput),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("GET /api/admin/users/[id]", () => {
    it("returns an existing user", async () => {
      mocks.getById.mockResolvedValue(professional);

      const response = await getUser(
        new Request(`http://localhost/api/admin/users/${professional.id}`),
        dynamicParams(),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(professional);
      expect(mocks.getById).toHaveBeenCalledWith(professional.id);
    });

    it("returns 404 when the user does not exist", async () => {
      mocks.getById.mockResolvedValue(null);

      const response = await getUser(
        new Request("http://localhost/api/admin/users/missing-user"),
        dynamicParams("missing-user"),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(404);
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 500 when retrieving the user fails", async () => {
      mocks.getById.mockRejectedValue(new Error("Unexpected failure"));

      const response = await getUser(
        new Request(`http://localhost/api/admin/users/${professional.id}`),
        dynamicParams(),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("PATCH /api/admin/users/[id]", () => {
    it("updates a valid user using the authenticated administrator ID", async () => {
      const updatedUser: PublicUser = {
        ...professional,
        name: "Nombre actualizado",
        status: "INACTIVE",
      };

      mocks.update.mockResolvedValue(updatedUser);

      const response = await updateUser(
        jsonRequest(`http://localhost/api/admin/users/${professional.id}`, "PATCH", {
          name: "Nombre actualizado",
          status: "INACTIVE",
        }),
        dynamicParams(),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(updatedUser);
      expect(mocks.update).toHaveBeenCalledWith(
        professional.id,
        {
          name: "Nombre actualizado",
          status: "INACTIVE",
        },
        administrator.id,
      );
    });

    it("returns 400 for an empty update", async () => {
      const response = await updateUser(
        jsonRequest(`http://localhost/api/admin/users/${professional.id}`, "PATCH", {}),
        dynamicParams(),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(mocks.update).not.toHaveBeenCalled();
    });

    it("returns 404 when the user to update does not exist", async () => {
      mocks.update.mockResolvedValue(null);

      const response = await updateUser(
        jsonRequest("http://localhost/api/admin/users/missing-user", "PATCH", {
          name: "Nombre actualizado",
        }),
        dynamicParams("missing-user"),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(404);
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 409 when an administrator deactivates their own account", async () => {
      mocks.update.mockRejectedValue(new Error("SELF_DEACTIVATION_NOT_ALLOWED"));

      const response = await updateUser(
        jsonRequest(`http://localhost/api/admin/users/${administrator.id}`, "PATCH", {
          status: "INACTIVE",
        }),
        dynamicParams(administrator.id),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(409);
      expect(body.error.code).toBe("SELF_DEACTIVATION_NOT_ALLOWED");
    });

    it("returns 409 when updating the last active administrator", async () => {
      mocks.update.mockRejectedValue(new Error("LAST_ACTIVE_ADMIN"));

      const response = await updateUser(
        jsonRequest(`http://localhost/api/admin/users/${administrator.id}`, "PATCH", {
          role: "PROFESSIONAL",
        }),
        dynamicParams(administrator.id),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(409);
      expect(body.error.code).toBe("LAST_ACTIVE_ADMIN");
    });

    it("returns 500 when updating the user fails unexpectedly", async () => {
      mocks.update.mockRejectedValue(new Error("Unexpected failure"));

      const response = await updateUser(
        jsonRequest(`http://localhost/api/admin/users/${professional.id}`, "PATCH", {
          name: "Nombre actualizado",
        }),
        dynamicParams(),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("POST /api/admin/users/[id]/reset-password", () => {
    it("resets the password of an existing user", async () => {
      mocks.resetPassword.mockResolvedValue(professional);

      const response = await resetPassword(
        jsonRequest(`http://localhost/api/admin/users/${professional.id}/reset-password`, "POST", {
          password: "NewSecure123",
        }),
        dynamicParams(),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(professional);
      expect(mocks.resetPassword).toHaveBeenCalledWith(professional.id, {
        password: "NewSecure123",
      });
    });

    it("returns 400 for an invalid password", async () => {
      const response = await resetPassword(
        jsonRequest(`http://localhost/api/admin/users/${professional.id}/reset-password`, "POST", {
          password: "short",
        }),
        dynamicParams(),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(mocks.resetPassword).not.toHaveBeenCalled();
    });

    it("returns 404 when the user does not exist", async () => {
      mocks.resetPassword.mockResolvedValue(null);

      const response = await resetPassword(
        jsonRequest("http://localhost/api/admin/users/missing-user/reset-password", "POST", {
          password: "NewSecure123",
        }),
        dynamicParams("missing-user"),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(404);
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 500 when resetting the password fails unexpectedly", async () => {
      mocks.resetPassword.mockRejectedValue(new Error("Unexpected failure"));

      const response = await resetPassword(
        jsonRequest(`http://localhost/api/admin/users/${professional.id}/reset-password`, "POST", {
          password: "NewSecure123",
        }),
        dynamicParams(),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
