import { REVISION_DAY_OFFSETS } from "@/lib/constants";
import {
  addUtcDays,
  dayBeforeExam,
  startOfUtcDay,
} from "@/lib/revisions/date-utils";
import Revision from "@/models/Revision";
import StudyPlan from "@/models/StudyPlan";
import Topic from "@/models/Topic";
import Task, { type TaskDocument } from "@/models/Task";

export type RevisionScheduleSlot = {
  revisionNumber: number;
  scheduledDate: Date;
};

/** Build due dates: +1d, +3d, +7d from completion, then day before exam. */
export function buildRevisionSchedule(
  topicCompletedAt: Date,
  examDate: Date | null | undefined,
): RevisionScheduleSlot[] {
  const anchor = startOfUtcDay(topicCompletedAt);
  const slots: RevisionScheduleSlot[] = [
    {
      revisionNumber: 1,
      scheduledDate: addUtcDays(anchor, REVISION_DAY_OFFSETS.first),
    },
    {
      revisionNumber: 2,
      scheduledDate: addUtcDays(anchor, REVISION_DAY_OFFSETS.second),
    },
    {
      revisionNumber: 3,
      scheduledDate: addUtcDays(anchor, REVISION_DAY_OFFSETS.third),
    },
  ];

  if (examDate) {
    let finalDate = dayBeforeExam(examDate);
    const lastSpaced = slots[slots.length - 1]!.scheduledDate;
    if (finalDate <= lastSpaced) {
      finalDate = addUtcDays(lastSpaced, 1);
    }
    const examDay = startOfUtcDay(examDate);
    if (finalDate >= examDay) {
      finalDate = addUtcDays(examDay, -1);
    }
    if (finalDate > anchor) {
      slots.push({ revisionNumber: 4, scheduledDate: finalDate });
    }
  }

  return slots;
}

async function resolveExamDate(planId?: string | null): Promise<Date | null> {
  if (!planId) return null;
  const plan = await StudyPlan.findOne({ planId }).select("examDate").lean();
  return plan?.examDate ? new Date(plan.examDate) : null;
}

async function markTopicCompleted(topicId: string): Promise<void> {
  await Topic.updateOne(
    { topicId, status: { $ne: "completed" } },
    { $set: { status: "completed" } },
  );
}

/** Create revision rows for a completed study task (idempotent per task). */
export async function scheduleRevisionsForTask(
  task: Pick<
    TaskDocument,
    | "userId"
    | "taskId"
    | "topicId"
    | "subjectId"
    | "planId"
    | "completedAt"
    | "status"
  >,
): Promise<number> {
  if (!task.topicId || task.status !== "completed" || !task.completedAt) {
    return 0;
  }

  const existing = await Revision.countDocuments({
    userId: task.userId,
    taskId: task.taskId,
  });
  if (existing > 0) {
    return 0;
  }

  const completedAt = new Date(task.completedAt);
  const examDate = await resolveExamDate(task.planId);
  const slots = buildRevisionSchedule(completedAt, examDate);

  if (slots.length === 0) {
    return 0;
  }

  await Revision.insertMany(
    slots.map((slot) => ({
      userId: task.userId,
      topicId: task.topicId,
      subjectId: task.subjectId,
      planId: task.planId,
      taskId: task.taskId,
      revisionNumber: slot.revisionNumber,
      scheduledDate: slot.scheduledDate,
      topicCompletedAt: completedAt,
      status: "scheduled",
    })),
  );

  await markTopicCompleted(task.topicId);
  return slots.length;
}

/** Remove pending revisions when a task completion is undone. */
export async function cancelRevisionsForTask(
  userId: string,
  taskId: string,
): Promise<number> {
  const result = await Revision.deleteMany({
    userId,
    taskId,
    status: "scheduled",
  });
  return result.deletedCount ?? 0;
}

export async function scheduleRevisionsForCompletedTask(
  userId: string,
  taskId: string,
): Promise<number> {
  const task = await Task.findOne({ taskId, userId }).lean();
  if (!task || task.status !== "completed" || !task.topicId) {
    return 0;
  }
  return scheduleRevisionsForTask(task);
}
