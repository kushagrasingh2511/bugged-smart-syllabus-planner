import type { REVISION_STATUS } from "@/lib/constants";

export type RevisionStoredStatus = (typeof REVISION_STATUS)[number];

/** Includes derived `missed` for overdue scheduled revisions. */
export type RevisionDisplayStatus = RevisionStoredStatus | "missed";

export type RevisionItem = {
  revisionId: string;
  topicId: string;
  subjectId?: string;
  planId?: string;
  taskId?: string;
  revisionNumber: number;
  dueDate: string;
  topicCompletedAt: string;
  status: RevisionStoredStatus;
  displayStatus: RevisionDisplayStatus;
  completedAt: string | null;
  topicName?: string;
  subjectName?: string;
};

export type RevisionListResponse = {
  upcoming: RevisionItem[];
  missed: RevisionItem[];
  completed: RevisionItem[];
  total: number;
};

export type GenerateRevisionsResult = {
  created: number;
  skipped: number;
  topicsProcessed: number;
};
