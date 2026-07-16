import { describe, expect, it } from "vitest";
import type { ClinicalEvent } from "@/features/clinical-timeline";
import type { Finding } from "@/features/findings";
import { buildCalendarItems } from "@/features/calendar";

const patientId = "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";

const control: ClinicalEvent = {
  id: "event-1",
  patientId,
  type: "CONTROL",
  eventDate: "2026-08-10",
  title: "Control programado",
  description: "Control ficticio registrado para seguimiento.",
  status: "SCHEDULED",
  findingId: "finding-1",
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z",
};

const finding: Finding = {
  id: "finding-1",
  patientId,
  category: "3",
  laterality: "LEFT",
  studyType: "ULTRASOUND",
  studyDate: "2026-07-10",
  description: "Hallazgo ficticio consignado por un profesional.",
  biopsyPerformed: false,
  nextControlDate: "2026-08-10",
  status: "FOLLOW_UP",
  createdAt: "2026-07-10T12:00:00.000Z",
  updatedAt: "2026-07-10T12:00:00.000Z",
};

const range = { from: "2026-08-01", to: "2026-08-31", status: "ALL" } as const;

describe("buildCalendarItems", () => {
  it("projects controls and excludes symptoms and notes", () => {
    const note: ClinicalEvent = {
      ...control,
      id: "event-note",
      type: "NOTE",
      status: "RECORDED",
      findingId: undefined,
    };

    const result = buildCalendarItems([control, note], [], range);

    expect(result).toEqual([
      expect.objectContaining({
        id: "clinical-event:event-1",
        type: "CONTROL",
        status: "SCHEDULED",
      }),
    ]);
  });

  it("projects a next control from an open finding", () => {
    const result = buildCalendarItems([], [finding], range);

    expect(result).toEqual([
      expect.objectContaining({
        id: "finding-next-control:finding-1",
        type: "FINDING_FOLLOW_UP",
        status: "SCHEDULED",
      }),
    ]);
  });

  it("does not duplicate a finding with a related scheduled control", () => {
    const result = buildCalendarItems([control], [finding], range);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("clinical-event:event-1");
  });

  it("does not project next controls from closed findings", () => {
    const result = buildCalendarItems([], [{ ...finding, status: "CLOSED" }], range);

    expect(result).toEqual([]);
  });

  it("filters by date range and status", () => {
    const completed = {
      ...control,
      id: "event-completed",
      eventDate: "2026-08-20",
      status: "COMPLETED" as const,
      findingId: undefined,
    };

    expect(
      buildCalendarItems([control, completed], [], {
        ...range,
        status: "COMPLETED",
      }).map((item) => item.id),
    ).toEqual(["clinical-event:event-completed"]);

    expect(buildCalendarItems([control], [], { from: "2026-09-01", to: "2026-09-30" })).toEqual([]);
  });

  it("orders items by date and uses a deterministic tie breaker", () => {
    const second = { ...control, id: "event-2", findingId: undefined };
    const first = { ...control, id: "event-0", findingId: undefined };

    const result = buildCalendarItems([second, first], [], range);

    expect(result.map((item) => item.id)).toEqual([
      "clinical-event:event-0",
      "clinical-event:event-2",
    ]);
  });
});
