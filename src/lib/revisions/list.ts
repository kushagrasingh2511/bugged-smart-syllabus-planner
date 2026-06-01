import { connectDB } from "@/lib/db";
import { serializeRevision } from "@/lib/revisions/serialize";
import Revision from "@/models/Revision";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import type { RevisionItem, RevisionListResponse } from "@/types/revision";

const UPCOMING_LIMIT = 10;
const MISSED_LIMIT = 10;
const COMPLETED_LIMIT = 10;

async function loadNameMaps(
  userId: string,
  topicIds: string[],
  subjectIds: string[],
) {
  const [topics, subjects] = await Promise.all([
    topicIds.length > 0 ?
      Topic.find({ topicId: { $in: topicIds } }).select("topicId topicName").lean()
    : [],
    subjectIds.length > 0 ?
      Subject.find({ userId, subjectId: { $in: subjectIds } })
        .select("subjectId subjectName")
        .lean()
    : [],
  ]);

  return {
    topicNames: new Map(topics.map((t) => [t.topicId, t.topicName])),
    subjectNames: new Map(subjects.map((s) => [s.subjectId, s.subjectName])),
  };
}

function bucketRevisions(items: RevisionItem[]): RevisionListResponse {
  const upcoming: RevisionItem[] = [];
  const missed: RevisionItem[] = [];
  const completed: RevisionItem[] = [];

  for (const item of items) {
    if (item.status === "completed") {
      completed.push(item);
      continue;
    }
    if (item.status === "skipped") {
      continue;
    }
    if (item.displayStatus === "missed") {
      missed.push(item);
    } else {
      upcoming.push(item);
    }
  }

  const byDue = (a: RevisionItem, b: RevisionItem) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

  upcoming.sort(byDue);
  missed.sort(byDue);
  completed.sort(
    (a, b) =>
      new Date(b.completedAt ?? b.dueDate).getTime() -
      new Date(a.completedAt ?? a.dueDate).getTime(),
  );

  return {
    upcoming: upcoming.slice(0, UPCOMING_LIMIT),
    missed: missed.slice(0, MISSED_LIMIT),
    completed: completed.slice(0, COMPLETED_LIMIT),
    total: items.length,
  };
}

export async function listRevisionsForUser(
  userId: string,
): Promise<RevisionListResponse> {
  await connectDB();

  const revisions = await Revision.find({ userId })
    .sort({ scheduledDate: 1 })
    .lean();

  const topicIds = [...new Set(revisions.map((r) => r.topicId))];
  const subjectIds = [
    ...new Set(
      revisions.map((r) => r.subjectId).filter((id): id is string => Boolean(id)),
    ),
  ];

  const names = await loadNameMaps(userId, topicIds, subjectIds);
  const items = revisions.map((r) => serializeRevision(r, names));

  return bucketRevisions(items);
}

export async function getRevisionDashboardBuckets(
  userId: string,
): Promise<RevisionListResponse> {
  return listRevisionsForUser(userId);
}
