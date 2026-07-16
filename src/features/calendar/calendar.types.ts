import type { ClinicalEventStatus } from "@/features/clinical-timeline";

export const CALENDAR_ITEM_SOURCES = ["CLINICAL_EVENT", "FINDING_NEXT_CONTROL"] as const;
export const CALENDAR_ITEM_TYPES = ["CONTROL", "FINDING_FOLLOW_UP"] as const;
export const CALENDAR_ITEM_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED"] as const;

export type CalendarItemSource = (typeof CALENDAR_ITEM_SOURCES)[number];
export type CalendarItemType = (typeof CALENDAR_ITEM_TYPES)[number];
export type CalendarItemStatus = (typeof CALENDAR_ITEM_STATUSES)[number];

export interface CalendarItem {
  id: string;
  patientId: string;
  source: CalendarItemSource;
  sourceId: string;
  date: string;
  type: CalendarItemType;
  title: string;
  description: string;
  status: CalendarItemStatus;
  findingId?: string;
}

export interface PatientCalendarItem extends CalendarItem {
  patientName: string;
  patientActive: boolean;
}

export interface CalendarRange {
  from: string;
  to: string;
  status?: CalendarItemStatus | "ALL";
}

export function isCalendarStatus(status: ClinicalEventStatus): status is CalendarItemStatus {
  return status === "SCHEDULED" || status === "COMPLETED" || status === "CANCELLED";
}
