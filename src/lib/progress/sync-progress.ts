import Progress from "@/models/Progress";
import type { TaskDocument } from "@/models/Task";

import {
  buildProgressMetrics,
  collectStudyDayKeys,
  calculateCurrentStreak,
} from "@/lib/progress/metrics";

type TaskForSync = Pick<TaskDocument, "status" | "completedAt">;

/** Persist aggregated metrics on the user's global Progress document. */
export async function syncUserProgress(
  userId: string,
  tasks: TaskForSync[],
): Promise<void> {
  const metrics = buildProgressMetrics(tasks);
  const studyDayKeys = collectStudyDayKeys(tasks);
  const streak = calculateCurrentStreak(studyDayKeys);

  let lastStudyDate: Date | undefined;
  if (studyDayKeys.size > 0) {
    const sorted = [...studyDayKeys].sort();
    lastStudyDate = new Date(`${sorted[sorted.length - 1]}T12:00:00.000Z`);
  }

  await Progress.findOneAndUpdate(
    { userId, subjectId: { $exists: false } },
    {
      $set: {
        completionPercentage: metrics.completionPercentage,
        streakDays: streak,
        studyDaysCompleted: metrics.studyDaysCompleted,
        lastStudyDate,
      },
      $setOnInsert: {
        progressId: crypto.randomUUID(),
        userId,
      },
    },
    { upsert: true, new: true },
  );
}
