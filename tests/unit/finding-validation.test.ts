import { describe, expect, it } from "vitest";
import { createFindingSchema, updateFindingSchema } from "@/lib/validations/finding";

const validFinding = {
  patientId: "45ae0fb2-dfd0-49a6-a426-eb492bcbad46",
  category: "3",
  laterality: "LEFT",
  studyType: "MAMMOGRAPHY",
  studyDate: "2026-07-10",
  description: "Hallazgo registrado a partir del informe profesional.",
  biopsyPerformed: false,
} as const;

describe("finding validation", () => {
  it("accepts and normalizes a valid finding", () => {
    const result = createFindingSchema.parse({
      ...validFinding,
      description: "  Hallazgo registrado a partir del informe profesional.  ",
      observations: "   ",
    });

    expect(result.description).toBe("Hallazgo registrado a partir del informe profesional.");
    expect(result.observations).toBeUndefined();
    expect(result.status).toBe("RECORDED");
  });

  it.each(["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"])(
    "accepts BI-RADS category %s",
    (category) => {
      expect(createFindingSchema.safeParse({ ...validFinding, category }).success).toBe(true);
    },
  );

  it("rejects unsupported categories", () => {
    const result = createFindingSchema.safeParse({ ...validFinding, category: "7" });

    expect(result.success).toBe(false);
  });

  it("rejects impossible and future study dates", () => {
    expect(
      createFindingSchema.safeParse({ ...validFinding, studyDate: "2026-02-30" }).success,
    ).toBe(false);
    expect(
      createFindingSchema.safeParse({ ...validFinding, studyDate: "2999-01-01" }).success,
    ).toBe(false);
  });

  it("rejects a control date before the study", () => {
    const result = createFindingSchema.safeParse({
      ...validFinding,
      nextControlDate: "2026-07-09",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a biopsy result when no biopsy was performed", () => {
    const result = createFindingSchema.safeParse({
      ...validFinding,
      biopsyResult: "Resultado registrado.",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a partial update", () => {
    const result = updateFindingSchema.parse({ status: "FOLLOW_UP" });

    expect(result).toEqual({ status: "FOLLOW_UP" });
  });

  it("rejects an empty update", () => {
    expect(updateFindingSchema.safeParse({}).success).toBe(false);
  });

  it("rejects patientId changes in updates", () => {
    const result = updateFindingSchema.safeParse({ patientId: validFinding.patientId });

    expect(result.success).toBe(false);
  });
});
