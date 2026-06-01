import Task from "@/models/Task";
import Revision from "@/models/Revision";

import { scheduleRevisionsForTask } from "@/lib/revisions/schedule";
import type { GenerateRevisionsResult } from "@/types/revision";

export type GenerateRevisionsOptions = {
  planId?: string;
  topicId?: string;
  force?: boolean;
};

/** Backfill revisions for completed study-plan tasks. */
export async function generateRevisionsForUser(
  userId: string,
  options: GenerateRevisionsOptions = {},
): Promise<GenerateRevisionsResult> {
  const filter: Record<string, unknown> = {
    userId,
    status: "completed",
    topicId: options.topicId ?? { $exists: true, $nin: [null, ""] },
  };

  if (options.planId) filter.planId = options.planId;

  const tasks = await Task.find(filter).lean();

  let created = 0;
  let skipped = 0;
  const topicsSeen = new Set<string>();

  for (const task of tasks) {
    if (!task.topicId) continue;
    topicsSeen.add(task.topicId);

    if (options.force) {
      await Revision.deleteMany({
        userId,
        taskId: task.taskId,
        status: "scheduled",
      });
    }

    const count = await scheduleRevisionsForTask(task);
    if (count > 0) created += count;
    else skipped += 1;
  }

  return {
    created,
    skipped,
    topicsProcessed: topicsSeen.size,
  };
}
