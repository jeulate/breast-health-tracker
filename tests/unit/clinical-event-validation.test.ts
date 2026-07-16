import { describe, expect, it } from "vitest";
import {
  createClinicalEventSchema,
  updateClinicalEventSchema,
} from "@/lib/validations/clinical-event";

const patientId = "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";

const validControl = {
  patientId,
  type: "CONTROL",
  eventDate: "2026-07-10",
  title: "Control programado",
  description: "Control registrado a partir de la indicación profesional.",
  status: "COMPLETED",
} as const;

describe("clinical event validation", () => {
  it("accepts and trims a valid control", () => {
    const result = createClinicalEventSchema.parse({
      ...validControl,
      title: "  Control programado  ",
      description: "  Control registrado a partir de la indicación profesional.  ",
    });

    expect(result.title).toBe("Control programado");
    expect(result.description).toBe("Control registrado a partir de la indicación profesional.");
  });

  it.each(["CONTROL", "SYMPTOM", "NOTE"])("accepts event type %s", (type) => {
    const status = type === "CONTROL" ? "COMPLETED" : "RECORDED";
    const result = createClinicalEventSchema.safeParse({ ...validControl, type, status });

    expect(result.success).toBe(true);
  });

  it("allows a future date only for a scheduled control", () => {
    expect(
      createClinicalEventSchema.safeParse({
        ...validControl,
        eventDate: "2999-01-01",
        status: "SCHEDULED",
      }).success,
    ).toBe(true);

    expect(
      createClinicalEventSchema.safeParse({
        ...validControl,
        eventDate: "2999-01-01",
        status: "COMPLETED",
      }).success,
    ).toBe(false);
  });

  it("rejects recorded status for a control", () => {
    expect(
      createClinicalEventSchema.safeParse({ ...validControl, status: "RECORDED" }).success,
    ).toBe(false);
  });

  it("rejects workflow statuses for symptoms and notes", () => {
    expect(
      createClinicalEventSchema.safeParse({
        ...validControl,
        type: "SYMPTOM",
        status: "SCHEDULED",
      }).success,
    ).toBe(false);
  });

  it("rejects impossible dates", () => {
    expect(
      createClinicalEventSchema.safeParse({ ...validControl, eventDate: "2026-02-30" }).success,
    ).toBe(false);
  });

  it("accepts an optional finding relation", () => {
    const result = createClinicalEventSchema.safeParse({
      ...validControl,
      findingId: "b19b019a-5a0f-41f3-9ba1-a6f191462bc0",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid finding identifiers", () => {
    expect(
      createClinicalEventSchema.safeParse({ ...validControl, findingId: "finding-1" }).success,
    ).toBe(false);
  });

  it("accepts partial updates and clearing a finding relation", () => {
    expect(updateClinicalEventSchema.parse({ status: "COMPLETED" })).toEqual({
      status: "COMPLETED",
    });
    expect(updateClinicalEventSchema.parse({ findingId: "" })).toEqual({
      findingId: undefined,
    });
  });

  it("rejects an empty update", () => {
    expect(updateClinicalEventSchema.safeParse({}).success).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(updateClinicalEventSchema.safeParse({ patientId, title: "No permitido" }).success).toBe(
      false,
    );
  });
});
