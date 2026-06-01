import type { RevisionDisplayStatus, RevisionStoredStatus } from "@/types/revision";

import { startOfUtcDay } from "@/lib/revisions/date-utils";

export function getRevisionDisplayStatus(
  status: RevisionStoredStatus,
  scheduledDate: Date,
  now = new Date(),
): RevisionDisplayStatus {
  if (status === "completed" || status === "skipped") {
    return status;
  }
  if (startOfUtcDay(scheduledDate) < startOfUtcDay(now)) {
    return "missed";
  }
  return "scheduled";
}
