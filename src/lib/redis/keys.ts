import { getServerEnv } from "@/config/env";

function normalizePrefix(prefix: string): string {
  return prefix.endsWith(":") ? prefix : `${prefix}:`;
}

function getPrefix(): string {
  return normalizePrefix(getServerEnv().HEALTH_APP_REDIS_PREFIX);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const redisKeys = {
  user(id: string): string {
    return `${getPrefix()}users:${id}`;
  },

  userByEmail(email: string): string {
    return `${getPrefix()}users:email:${normalizeEmail(email)}`;
  },

  usersIndex(): string {
    return `${getPrefix()}users:index`;
  },

  patient(id: string): string {
    return `${getPrefix()}patients:${id}`;
  },

  patientsIndex(): string {
    return `${getPrefix()}patients:index`;
  },

  patientsCreatedAtIndex(): string {
    return `${getPrefix()}patients:created-at`;
  },

  finding(id: string): string {
    return `${getPrefix()}findings:${id}`;
  },

  findingsIndex(): string {
    return `${getPrefix()}findings:index`;
  },

  patientFindingsByStudyDate(patientId: string): string {
    return `${getPrefix()}patients:${patientId}:findings:study-date`;
  },

  clinicalEvent(id: string): string {
    return `${getPrefix()}clinical-events:${id}`;
  },

  clinicalEventsIndex(): string {
    return `${getPrefix()}clinical-events:index`;
  },

  patientClinicalEventsByEventDate(patientId: string): string {
    return `${getPrefix()}patients:${patientId}:clinical-events:event-date`;
  },
};
