import type { RevisionDocument } from "@/models/Revision";
import type { RevisionItem } from "@/types/revision";

import { getRevisionDisplayStatus } from "@/lib/revisions/status";

type RevisionLike = Pick<
  RevisionDocument,
  | "revisionId"
  | "topicId"
  | "subjectId"
  | "planId"
  | "taskId"
  | "revisionNumber"
  | "scheduledDate"
  | "topicCompletedAt"
  | "status"
  | "completedAt"
>;

type NameLookup = {
  topicNames: Map<string, string>;
  subjectNames: Map<string, string>;
};

export function serializeRevision(
  revision: RevisionLike,
  names?: NameLookup,
): RevisionItem {
  const scheduledDate = new Date(revision.scheduledDate);
  const status = revision.status;

  return {
    revisionId: revision.revisionId,
    topicId: revision.topicId,
    subjectId: revision.subjectId ?? undefined,
    planId: revision.planId ?? undefined,
    taskId: revision.taskId ?? undefined,
    revisionNumber: revision.revisionNumber,
    dueDate: scheduledDate.toISOString(),
    topicCompletedAt: new Date(revision.topicCompletedAt).toISOString(),
    status,
    displayStatus: getRevisionDisplayStatus(status, scheduledDate),
    completedAt: revision.completedAt
      ? new Date(revision.completedAt).toISOString()
      : null,
    topicName: names?.topicNames.get(revision.topicId),
    subjectName:
      revision.subjectId ?
        names?.subjectNames.get(revision.subjectId)
      : undefined,
  };
}
