import { describe, expect, it } from "vitest";
import { createPatientSchema, updatePatientSchema } from "@/lib/validations/patient";

describe("patient validation v2", () => {
  it("trims the patient name and applies the Bolivia timezone", () => {
    const result = createPatientSchema.parse({ fullName: "  María García  " });

    expect(result.fullName).toBe("María García");
    expect(result.timezone).toBe("America/La_Paz");
  });

  it("converts an empty birth date to undefined", () => {
    const result = createPatientSchema.parse({ fullName: "María García", birthDate: "" });
    expect(result.birthDate).toBeUndefined();
  });

  it("rejects an impossible calendar date", () => {
    const result = createPatientSchema.safeParse({
      fullName: "María García",
      birthDate: "2026-02-30",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a future birth date", () => {
    const result = createPatientSchema.safeParse({
      fullName: "María García",
      birthDate: "2999-01-01",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unsupported timezones", () => {
    const result = createPatientSchema.safeParse({
      fullName: "María García",
      timezone: "America/Mexico_City",
    });

    expect(result.success).toBe(false);
  });

  it("allows updating the administrative status", () => {
    const result = updatePatientSchema.safeParse({ status: "INACTIVE" });
    expect(result.success).toBe(true);
  });
});
