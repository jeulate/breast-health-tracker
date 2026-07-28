import { describe, expect, it } from "vitest";
import {
  createAdminUserSchema,
  resetAdminUserPasswordSchema,
  updateAdminUserSchema,
} from "@/lib/validations/admin-user";

describe("admin user validation", () => {
  describe("createAdminUserSchema", () => {
    it("normalizes and accepts a valid user", () => {
      const result = createAdminUserSchema.parse({
        name: "  Ana Profesional  ",
        email: "  ANA@EXAMPLE.COM  ",
        password: "Secure123",
        role: "PROFESSIONAL",
      });

      expect(result).toEqual({
        name: "Ana Profesional",
        email: "ana@example.com",
        password: "Secure123",
        role: "PROFESSIONAL",
        status: "ACTIVE",
      });
    });

    it("accepts an inactive administrator when explicitly requested", () => {
      const result = createAdminUserSchema.safeParse({
        name: "Administrador secundario",
        email: "admin2@example.com",
        password: "Secure123",
        role: "ADMIN",
        status: "INACTIVE",
      });

      expect(result.success).toBe(true);
    });

    it("rejects an invalid email", () => {
      const result = createAdminUserSchema.safeParse({
        name: "Ana Profesional",
        email: "correo-invalido",
        password: "Secure123",
        role: "PROFESSIONAL",
      });

      expect(result.success).toBe(false);
    });

    it("rejects a short password", () => {
      const result = createAdminUserSchema.safeParse({
        name: "Ana Profesional",
        email: "ana@example.com",
        password: "1234567",
        role: "PROFESSIONAL",
      });

      expect(result.success).toBe(false);
    });

    it("rejects unsupported roles and statuses", () => {
      expect(
        createAdminUserSchema.safeParse({
          name: "Ana Profesional",
          email: "ana@example.com",
          password: "Secure123",
          role: "PATIENT",
        }).success,
      ).toBe(false);

      expect(
        createAdminUserSchema.safeParse({
          name: "Ana Profesional",
          email: "ana@example.com",
          password: "Secure123",
          role: "PROFESSIONAL",
          status: "BLOCKED",
        }).success,
      ).toBe(false);
    });
  });

  describe("updateAdminUserSchema", () => {
    it("accepts supported partial changes", () => {
      expect(
        updateAdminUserSchema.parse({
          name: "  Nombre actualizado  ",
          role: "ADMIN",
        }),
      ).toEqual({
        name: "Nombre actualizado",
        role: "ADMIN",
      });
    });

    it("rejects an empty update", () => {
      expect(updateAdminUserSchema.safeParse({}).success).toBe(false);
    });

    it("does not allow email or password changes", () => {
      expect(
        updateAdminUserSchema.safeParse({
          email: "nuevo@example.com",
        }).success,
      ).toBe(false);

      expect(
        updateAdminUserSchema.safeParse({
          password: "Another123",
        }).success,
      ).toBe(false);
    });
  });

  describe("resetAdminUserPasswordSchema", () => {
    it("accepts a valid password", () => {
      expect(
        resetAdminUserPasswordSchema.parse({
          password: "NewSecure123",
        }),
      ).toEqual({
        password: "NewSecure123",
      });
    });

    it("rejects an invalid password", () => {
      expect(
        resetAdminUserPasswordSchema.safeParse({
          password: "short",
        }).success,
      ).toBe(false);
    });
  });
});
