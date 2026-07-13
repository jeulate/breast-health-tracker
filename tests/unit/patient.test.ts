import { describe, it, expect } from "vitest";
import { createPatientSchema, updatePatientSchema } from "@/lib/validations/patient";

describe("createPatientSchema", () => {
  it("accepts a valid patient", () => {
    const result = createPatientSchema.safeParse({
      fullName: "Ana Pérez",
      timezone: "America/Mexico_City",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an optional birthDate", () => {
    const result = createPatientSchema.safeParse({
      fullName: "Ana Pérez",
      birthDate: "1990-01-01",
      timezone: "America/Mexico_City",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthDate).toBe("1990-01-01");
    }
  });

  it("defaults timezone", () => {
    const result = createPatientSchema.safeParse({ fullName: "Ana Pérez" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timezone).toBe("America/Mexico_City");
    }
  });

  it("rejects short fullName", () => {
    const result = createPatientSchema.safeParse({
      fullName: "A",
      timezone: "America/Mexico_City",
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePatientSchema", () => {
  it("accepts partial update", () => {
    const result = updatePatientSchema.safeParse({ status: "INACTIVE" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updatePatientSchema.safeParse({ status: "DELETED" });
    expect(result.success).toBe(false);
  });
});
