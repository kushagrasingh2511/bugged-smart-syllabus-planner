import type { TaskDocument } from "@/models/Task";
import type {
  DailyCompletionPoint,
  ProgressCharts,
  ProgressMetrics,
  SubjectProgressSlice,
} from "@/types/progress";

import { addUtcDays, startOfUtcDay, toDateKey } from "@/lib/progress/date-utils";

type TaskForMetrics = Pick<
  TaskDocument,
  "status" | "completedAt" | "subjectId"
>;

const STATUS_LABELS = ["pending", "in_progress", "completed", "missed"] as const;

export function calculateCompletionPercentage(
  completed: number,
  total: number,
): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function collectStudyDayKeys(tasks: TaskForMetrics[]): Set<string> {
  const keys = new Set<string>();
  for (const task of tasks) {
    if (task.status === "completed" && task.completedAt) {
      keys.add(toDateKey(new Date(task.completedAt)));
    }
  }
  return keys;
}

/** Consecutive calendar days with at least one completion, ending today or yesterday. */
export function calculateCurrentStreak(studyDayKeys: Set<string>, now = new Date()): number {
  if (studyDayKeys.size === 0) return 0;

  const today = startOfUtcDay(now);
  const todayKey = toDateKey(today);

  let cursor = today;
  if (!studyDayKeys.has(todayKey)) {
    const yesterday = addUtcDays(today, -1);
    const yesterdayKey = toDateKey(yesterday);
    if (!studyDayKeys.has(yesterdayKey)) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  while (studyDayKeys.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
}

export function buildProgressMetrics(tasks: TaskForMetrics[]): ProgressMetrics {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const remainingTasks = totalTasks - completedTasks;
  const studyDayKeys = collectStudyDayKeys(tasks);

  return {
    totalTasks,
    completedTasks,
    remainingTasks,
    completionPercentage: calculateCompletionPercentage(completedTasks, totalTasks),
    currentStreak: calculateCurrentStreak(studyDayKeys),
    studyDaysCompleted: studyDayKeys.size,
  };
}

export function buildSubjectSlices(tasks: TaskForMetrics[]): SubjectProgressSlice[] {
  const bySubject = new Map<string, { total: number; completed: number }>();

  for (const task of tasks) {
    if (!task.subjectId) continue;
    const bucket = bySubject.get(task.subjectId) ?? { total: 0, completed: 0 };
    bucket.total += 1;
    if (task.status === "completed") bucket.completed += 1;
    bySubject.set(task.subjectId, bucket);
  }

  return [...bySubject.entries()]
    .map(([subjectId, counts]) => ({
      subjectId,
      totalTasks: counts.total,
      completedTasks: counts.completed,
      completionPercentage: calculateCompletionPercentage(
        counts.completed,
        counts.total,
      ),
    }))
    .sort((a, b) => b.completionPercentage - a.completionPercentage);
}

export function buildDailyCompletions(
  tasks: TaskForMetrics[],
  days = 14,
): DailyCompletionPoint[] {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.status !== "completed" || !task.completedAt) continue;
    const key = toDateKey(new Date(task.completedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const end = startOfUtcDay(new Date());
  const points: DailyCompletionPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = addUtcDays(end, -i);
    const date = toDateKey(day);
    points.push({ date, completedCount: counts.get(date) ?? 0 });
  }
  return points;
}

export function buildProgressCharts(tasks: TaskForMetrics[]): ProgressCharts {
  const statusCounts = STATUS_LABELS.map(
    (status) => tasks.filter((t) => t.status === status).length,
  );

  const bySubject = buildSubjectSlices(tasks);
  const dailyCompletions = buildDailyCompletions(tasks);

  return {
    completionByStatus: {
      labels: [...STATUS_LABELS],
      datasets: [{ label: "Tasks", data: statusCounts }],
    },
    completionBySubject: {
      labels: bySubject.map((s) => s.subjectId),
      datasets: [
        {
          label: "Completed",
          data: bySubject.map((s) => s.completedTasks),
        },
        {
          label: "Remaining",
          data: bySubject.map((s) => s.totalTasks - s.completedTasks),
        },
      ],
    },
    dailyCompletions,
    completionTrend: {
      labels: dailyCompletions.map((p) => p.date),
      datasets: [
        {
          label: "Tasks completed",
          data: dailyCompletions.map((p) => p.completedCount),
        },
      ],
    },
  };
}
