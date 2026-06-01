import { connectDB } from "@/lib/db";
import { filterOverdueTasks, isOverdueTask } from "@/lib/recovery/overdue";
import {
  computePriority,
  createDayBuckets,
  distributeEntriesToDays,
  estimateCompletionDate,
  estimatedHours,
  getRemainingStudyDays,
  localDayKey,
  remainingCapacityInBuckets,
  sumEntryHours,
  toPriority,
  totalAvailableCapacity,
  type DayBucket,
  type TopicEntry,
} from "@/lib/study-plan/scheduling";
import RecoveryPlan from "@/models/RecoveryPlan";
import StudyPlan from "@/models/StudyPlan";
import Subject from "@/models/Subject";
import Task from "@/models/Task";
import Topic from "@/models/Topic";
import { recoveryPlanToSummary } from "@/lib/recovery/serialize-doc";
import type {
  RecoveryCharts,
  RecoveryRecommendation,
  RecoveryScheduleDay,
  RecoverySummary,
} from "@/types/recovery";

export class RecoveryGenerateError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RecoveryGenerateError";
  }
}

function buildRecommendations(
  extraHours: number,
  remainingDays: number,
  dailyHours: number,
  recommendedDaily: number,
  missedCount: number,
): RecoveryRecommendation[] {
  const items: RecoveryRecommendation[] = [];

  if (missedCount === 0) {
    items.push({
      type: "schedule",
      message: "You have no overdue tasks. Keep up your current pace.",
      severity: "info",
    });
    return items;
  }

  if (extraHours > 0 && remainingDays > 0) {
    items.push({
      type: "hours",
      message: `You need about ${extraHours.toFixed(1)} extra hour(s) beyond your remaining ${remainingDays}-day capacity at ${dailyHours}h/day.`,
      severity: extraHours > dailyHours * 2 ? "critical" : "warning",
    });
    if (recommendedDaily > dailyHours) {
      items.push({
        type: "pace",
        message: `Consider increasing daily study to ~${recommendedDaily.toFixed(1)} hours, or extend your timeline before the exam.`,
        severity: "warning",
      });
    }
  }

  if (remainingDays <= 2 && missedCount > 0) {
    items.push({
      type: "exam",
      message: "Exam is very soon — focus on highest-difficulty and weak-subject topics first.",
      severity: "critical",
    });
  }

  items.push({
    type: "schedule",
    message: `${missedCount} overdue task(s) were reprioritized across your remaining study days.`,
    severity: "info",
  });

  return items;
}

function buildCharts(
  buckets: DayBucket[],
  missedHours: number,
  recoveredHours: number,
): RecoveryCharts {
  const labels = buckets.map((b) => localDayKey(b.date));
  const recoveryHours = buckets.map((b) =>
    b.tasks.reduce((s, t) => s + estimatedHours(t.difficulty), 0),
  );
  const remaining = buckets.map((b) => Math.max(0, b.remaining));

  return {
    hoursByDay: {
      labels,
      datasets: [
        { label: "Recovery hours", data: recoveryHours },
        { label: "Free capacity", data: remaining },
      ],
    },
    workload: {
      labels: ["Missed load", "Rescheduled"],
      datasets: [
        {
          label: "Hours",
          data: [Math.round(missedHours * 10) / 10, Math.round(recoveredHours * 10) / 10],
        },
      ],
    },
  };
}

type SchedulePreviewDoc = {
  date: Date;
  totalHours: number;
  tasks: {
    taskId?: string;
    taskTitle: string;
    topicId: string;
    estimatedHours: number;
    priority: string;
    isRecovery: boolean;
  }[];
};

function buildSchedulePreview(buckets: DayBucket[]): SchedulePreviewDoc[] {
  return buckets
    .filter((b) => b.tasks.length > 0)
    .map((b) => ({
      date: b.date,
      totalHours: b.tasks.reduce((s, t) => s + estimatedHours(t.difficulty), 0),
      tasks: b.tasks.map((t) => ({
        taskId: t.taskId,
        taskTitle: t.taskTitle ?? `Study: ${t.topicName}`,
        topicId: t.topicId,
        estimatedHours: estimatedHours(t.difficulty),
        priority: toPriority(t.difficulty),
        isRecovery: true,
      })),
    }));
}

export function serializeRecoveryPlan(
  doc: {
    recoveryId: string;
    planId: string;
    status: "generated" | "applied";
    missedTaskCount: number;
    remainingStudyDays: number;
    extraHoursNeeded: number;
    recommendedDailyHours: number;
    currentDailyHours: number;
    estimatedCompletionDate?: Date | null;
    missedTasks: {
      taskId: string;
      taskTitle: string;
      topicId?: string;
      subjectId?: string;
      originalDueDate: Date;
    }[];
    movedTasks: {
      taskId: string;
      taskTitle: string;
      topicId: string;
      subjectId?: string;
      fromDueDate: Date;
      toDueDate: Date;
      estimatedHours: number;
      priority: string;
    }[];
    schedulePreview: {
      date: Date | string;
      totalHours: number;
      tasks: RecoveryScheduleDay["tasks"];
    }[];
    recommendations: RecoveryRecommendation[];
    charts: RecoveryCharts;
    createdAt?: Date;
  },
  planTitle: string,
): RecoverySummary {
  return {
    recoveryId: doc.recoveryId,
    planId: doc.planId,
    planTitle,
    status: doc.status,
    missedTaskCount: doc.missedTaskCount,
    remainingStudyDays: doc.remainingStudyDays,
    extraHoursNeeded: doc.extraHoursNeeded,
    recommendedDailyHours: doc.recommendedDailyHours,
    currentDailyHours: doc.currentDailyHours,
    estimatedCompletionDate: doc.estimatedCompletionDate
      ? new Date(doc.estimatedCompletionDate).toISOString()
      : null,
    missedTasks: doc.missedTasks.map((m) => ({
      taskId: m.taskId,
      taskTitle: m.taskTitle,
      topicId: m.topicId,
      subjectId: m.subjectId,
      originalDueDate: new Date(m.originalDueDate).toISOString(),
    })),
    movedTasks: doc.movedTasks.map((m) => ({
      taskId: m.taskId,
      taskTitle: m.taskTitle,
      topicId: m.topicId,
      subjectId: m.subjectId,
      fromDueDate: new Date(m.fromDueDate).toISOString(),
      toDueDate: new Date(m.toDueDate).toISOString(),
      estimatedHours: m.estimatedHours,
      priority: m.priority,
    })),
    schedulePreview: doc.schedulePreview.map((d) => ({
      date: new Date(d.date as string | Date).toISOString(),
      totalHours: d.totalHours,
      tasks: d.tasks,
    })),
    recommendations: doc.recommendations,
    charts: doc.charts,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

export async function generateRecoveryPlan(
  userId: string,
  planId: string,
  apply: boolean,
): Promise<RecoverySummary> {
  await connectDB();

  const plan = await StudyPlan.findOne({ planId, userId }).lean();
  if (!plan) {
    throw new RecoveryGenerateError("Study plan not found", 404);
  }
  if (!plan.examDate) {
    throw new RecoveryGenerateError("Study plan has no exam date", 400);
  }

  const examDate = new Date(plan.examDate);
  const dailyHours = plan.dailyStudyHours ?? 2;
  const weakSet = new Set(
    (plan.weakSubjects ?? []).map((s) => s.toLowerCase()),
  );

  const allTasks = await Task.find({ userId, planId }).lean();
  const missed = filterOverdueTasks(allTasks);
  const now = new Date();

  if (missed.length === 0) {
    throw new RecoveryGenerateError("No overdue tasks to recover", 400);
  }

  const studyDays = getRemainingStudyDays(examDate, now);
  if (studyDays.length === 0) {
    throw new RecoveryGenerateError(
      "No remaining study days before the exam — adjust your exam date.",
      400,
    );
  }

  const topicIds = [
    ...new Set(missed.map((t) => t.topicId).filter((id): id is string => Boolean(id))),
  ];
  const topics = await Topic.find({ topicId: { $in: topicIds } }).lean();
  const topicMap = new Map(topics.map((t) => [t.topicId, t]));

  const subjectIds = [
    ...new Set(missed.map((t) => t.subjectId).filter((id): id is string => Boolean(id))),
  ];
  const subjects = await Subject.find({
    userId,
    subjectId: { $in: subjectIds },
  }).lean();
  const subjectMap = new Map(subjects.map((s) => [s.subjectId, s]));

  const upcoming = allTasks.filter(
    (t) => !isOverdueTask(t, now) && t.status !== "completed",
  );

  const usedHoursByDay = new Map<string, number>();
  for (const task of upcoming) {
    if (!task.topicId) continue;
    const topic = topicMap.get(task.topicId);
    const hours = estimatedHours(topic?.difficulty ?? 3);
    const key = localDayKey(task.dueDate);
    usedHoursByDay.set(key, (usedHoursByDay.get(key) ?? 0) + hours);
  }

  const dayBuckets = createDayBuckets(studyDays, dailyHours, usedHoursByDay);
  const capacityBefore = remainingCapacityInBuckets(dayBuckets);

  const missedEntries: TopicEntry[] = missed.map((task) => {
    const topic = task.topicId ? topicMap.get(task.topicId) : undefined;
    const subject = task.subjectId ? subjectMap.get(task.subjectId) : undefined;
    const subjectName = subject?.subjectName ?? "Unknown";
    const difficulty = topic?.difficulty ?? 3;
    const isWeak =
      weakSet.has(subjectName.toLowerCase()) ||
      (task.subjectId ? weakSet.has(task.subjectId) : false);

    return {
      topicId: task.topicId ?? task.taskId,
      topicName: topic?.topicName ?? task.taskTitle,
      subjectId: task.subjectId ?? "",
      subjectName,
      difficulty,
      isWeakSubject: isWeak,
      priority: computePriority(difficulty, isWeak),
      taskId: task.taskId,
      taskTitle: task.taskTitle,
    };
  });

  const missedHours = sumEntryHours(missedEntries);
  distributeEntriesToDays(missedEntries, dayBuckets);

  const extraHoursNeeded = Math.max(
    0,
    Math.round((missedHours - capacityBefore) * 10) / 10,
  );

  const recommendedDaily = Math.min(
    16,
    Math.round(
      (dailyHours + extraHoursNeeded / Math.max(1, studyDays.length)) * 10,
    ) / 10,
  );

  const completionDate = estimateCompletionDate(dayBuckets);
  const recoveredHours = sumEntryHours(
    dayBuckets.flatMap((b) => b.tasks),
  );

  const movedTasks = missed.map((task) => {
    const bucket = dayBuckets.find((b) =>
      b.tasks.some((e) => e.taskId === task.taskId),
    );
    const topic = task.topicId ? topicMap.get(task.topicId) : undefined;
    const hours = estimatedHours(topic?.difficulty ?? 3);
    return {
      taskId: task.taskId,
      taskTitle: task.taskTitle,
      topicId: task.topicId ?? task.taskId,
      subjectId: task.subjectId,
      fromDueDate: task.dueDate,
      toDueDate: bucket?.date ?? studyDays[studyDays.length - 1]!,
      estimatedHours: hours,
      priority: toPriority(topic?.difficulty ?? 3),
    };
  });

  const schedulePreview = buildSchedulePreview(dayBuckets);
  const recommendations = buildRecommendations(
    extraHoursNeeded,
    studyDays.length,
    dailyHours,
    recommendedDaily,
    missed.length,
  );
  const charts = buildCharts(dayBuckets, missedHours, recoveredHours);

  const missedTasksPayload = missed.map((t) => ({
    taskId: t.taskId,
    taskTitle: t.taskTitle,
    topicId: t.topicId,
    subjectId: t.subjectId,
    originalDueDate: t.dueDate,
  }));

  const recoveryDoc = await RecoveryPlan.create({
    userId,
    planId,
    status: apply ? "applied" : "generated",
    missedTaskCount: missed.length,
    remainingStudyDays: studyDays.length,
    extraHoursNeeded,
    recommendedDailyHours: recommendedDaily,
    currentDailyHours: dailyHours,
    estimatedCompletionDate: completionDate,
    missedTasks: missedTasksPayload,
    movedTasks,
    schedulePreview,
    recommendations,
    charts,
    appliedAt: apply ? new Date() : undefined,
  });

  if (apply) {
    for (const moved of movedTasks) {
      await Task.updateOne(
        { taskId: moved.taskId, userId },
        {
          $set: {
            dueDate: moved.toDueDate,
            status: "pending",
            priority: moved.priority,
          },
        },
      );
    }
  }

  return recoveryPlanToSummary(recoveryDoc, plan.title);
}
