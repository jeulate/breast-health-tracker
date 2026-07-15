export const BIRADS_CATEGORIES = ["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"] as const;

export const BREAST_LATERALITIES = ["LEFT", "RIGHT", "BILATERAL"] as const;

export const BREAST_STUDY_TYPES = ["MAMMOGRAPHY", "ULTRASOUND", "MRI"] as const;

export const FINDING_STATUSES = ["RECORDED", "FOLLOW_UP", "CLOSED"] as const;

export type BiradsCategory = (typeof BIRADS_CATEGORIES)[number];
export type BreastLaterality = (typeof BREAST_LATERALITIES)[number];
export type BreastStudyType = (typeof BREAST_STUDY_TYPES)[number];
export type FindingStatus = (typeof FINDING_STATUSES)[number];

/**
 * Clinical information recorded from an existing professional assessment.
 * The application must not infer or recommend BI-RADS categories.
 */
export interface Finding {
  id: string;
  patientId: string;
  category: BiradsCategory;
  laterality: BreastLaterality;
  studyType: BreastStudyType;
  studyDate: string;
  description: string;
  observations?: string;
  biopsyPerformed: boolean;
  biopsyResult?: string;
  nextControlDate?: string;
  status: FindingStatus;
  createdAt: string;
  updatedAt: string;
}
