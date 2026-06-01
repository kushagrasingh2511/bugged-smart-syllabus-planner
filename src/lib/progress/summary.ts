import { connectDB } from "@/lib/db";
import {
  buildProgressCharts,
  buildProgressMetrics,
  buildSubjectSlices,
} from "@/lib/progress/metrics";
import { serializeTask } from "@/lib/progress/serialize-task";
import Task from "@/models/Task";
import type { ProgressSummary } from "@/types/progress";

const UPCOMING_LIMIT = 8;
const RECENT_LIMIT = 5;

export async function getProgressSummary(userId: string): Promise<ProgressSummary> {
  await connectDB();

  const tasks = await Task.find({ userId })
    .sort({ dueDate: 1, priority: -1 })
    .lean();

  const metrics = buildProgressMetrics(tasks);
  const now = new Date();

  const upcomingTasks = tasks
    .filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "missed" &&
        new Date(t.dueDate) >= startOfToday(now),
    )
    .slice(0, UPCOMING_LIMIT)
    .map(serializeTask);

  const recentCompletions = tasks
    .filter((t) => t.status === "completed" && t.completedAt)
    .sort(
      (a, b) =>
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime(),
    )
    .slice(0, RECENT_LIMIT)
    .map(serializeTask);

  return {
    metrics,
    bySubject: buildSubjectSlices(tasks),
    upcomingTasks,
    recentCompletions,
    charts: buildProgressCharts(tasks),
    updatedAt: new Date().toISOString(),
  };
}

function startOfToday(reference: Date): Date {
  return new Date(
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth(),
      reference.getUTCDate(),
    ),
  );
}
