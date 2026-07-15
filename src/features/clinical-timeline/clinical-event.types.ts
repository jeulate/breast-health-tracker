export const CLINICAL_EVENT_TYPES = ["CONTROL", "SYMPTOM", "NOTE"] as const;

export const CLINICAL_EVENT_STATUSES = ["RECORDED", "SCHEDULED", "COMPLETED", "CANCELLED"] as const;

export const TIMELINE_ENTRY_SOURCES = ["CLINICAL_EVENT", "FINDING"] as const;

export type ClinicalEventType = (typeof CLINICAL_EVENT_TYPES)[number];
export type ClinicalEventStatus = (typeof CLINICAL_EVENT_STATUSES)[number];
export type TimelineEntrySource = (typeof TIMELINE_ENTRY_SOURCES)[number];

/**
 * A manually recorded event. BI-RADS findings remain in their own entity and
 * are projected into the timeline instead of being copied here.
 */
export interface ClinicalEvent {
  id: string;
  patientId: string;
  type: ClinicalEventType;
  eventDate: string;
  title: string;
  description: string;
  status: ClinicalEventStatus;
  findingId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Read model used to merge clinical events and BI-RADS findings chronologically. */
export interface TimelineEntry {
  id: string;
  patientId: string;
  source: TimelineEntrySource;
  sourceId: string;
  eventDate: string;
  type: ClinicalEventType | "FINDING";
  title: string;
  description: string;
  status: ClinicalEventStatus | "FOLLOW_UP" | "CLOSED";
}
