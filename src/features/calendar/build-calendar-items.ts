import type { ClinicalEvent } from "@/features/clinical-timeline";
import type { Finding } from "@/features/findings";
import {
  isCalendarStatus,
  type CalendarItem,
  type CalendarItemStatus,
  type CalendarRange,
} from "./calendar.types";

type CalendarControlEvent = ClinicalEvent & {
  type: "CONTROL";
  status: CalendarItemStatus;
};

function isCalendarControl(event: ClinicalEvent): event is CalendarControlEvent {
  return event.type === "CONTROL" && isCalendarStatus(event.status);
}

function isWithinRange(date: string, range: CalendarRange): boolean {
  return date >= range.from && date <= range.to;
}

function matchesStatus(item: CalendarItem, range: CalendarRange): boolean {
  return !range.status || range.status === "ALL" || item.status === range.status;
}

function compareCalendarItems(left: CalendarItem, right: CalendarItem): number {
  const dateComparison = left.date.localeCompare(right.date);
  if (dateComparison !== 0) return dateComparison;

  const sourceComparison = left.source.localeCompare(right.source);
  if (sourceComparison !== 0) return sourceComparison;

  return left.sourceId.localeCompare(right.sourceId);
}

/**
 * Builds a read-only calendar projection. Findings remain in their own entity
 * and are never copied or modified by this function.
 */
export function buildCalendarItems(
  events: ClinicalEvent[],
  findings: Finding[],
  range: CalendarRange,
): CalendarItem[] {
  const controls = events.filter(isCalendarControl);
  const scheduledFindingIds = new Set(
    controls
      .filter((event) => event.status === "SCHEDULED" && event.findingId)
      .map((event) => event.findingId as string),
  );

  const controlItems: CalendarItem[] = controls.map((event) => ({
    id: `clinical-event:${event.id}`,
    patientId: event.patientId,
    source: "CLINICAL_EVENT",
    sourceId: event.id,
    date: event.eventDate,
    type: "CONTROL",
    title: event.title,
    description: event.description,
    status: event.status,
    findingId: event.findingId,
  }));

  const findingItems: CalendarItem[] = findings
    .filter(
      (finding) =>
        finding.status !== "CLOSED" &&
        Boolean(finding.nextControlDate) &&
        !scheduledFindingIds.has(finding.id),
    )
    .map((finding) => ({
      id: `finding-next-control:${finding.id}`,
      patientId: finding.patientId,
      source: "FINDING_NEXT_CONTROL" as const,
      sourceId: finding.id,
      date: finding.nextControlDate as string,
      type: "FINDING_FOLLOW_UP" as const,
      title: `Próximo control BI-RADS ${finding.category}`,
      description: finding.description,
      status: "SCHEDULED" as const,
      findingId: finding.id,
    }));

  return [...controlItems, ...findingItems]
    .filter((item) => isWithinRange(item.date, range) && matchesStatus(item, range))
    .sort(compareCalendarItems);
}
