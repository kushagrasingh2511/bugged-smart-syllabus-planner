import { serializeRecoveryPlan } from "@/lib/recovery/generate";
import type { RecoveryPlanDocument } from "@/models/RecoveryPlan";
import type { RecoveryCharts, RecoveryRecommendation } from "@/types/recovery";
import type { RecoverySummary } from "@/types/recovery";

/** Serialize a lean or document RecoveryPlan for API responses. */
export function recoveryPlanToSummary(
  doc: RecoveryPlanDocument | Record<string, unknown>,
  planTitle: string,
): RecoverySummary {
  const d = doc as RecoveryPlanDocument;

  // Explicitly map every nested subdocument field to strip Mongoose internals
  // (_id buffers, toJSON methods) before crossing the server/client boundary.
  const recommendations: RecoveryRecommendation[] = (
    d.recommendations as RecoveryRecommendation[]
  ).map((r) => ({
    type: r.type,
    message: r.message,
    severity: r.severity,
  }));

  const rawCharts = d.charts as RecoveryCharts;
  const charts: RecoveryCharts = {
    hoursByDay: {
      labels: [...rawCharts.hoursByDay.labels],
      datasets: rawCharts.hoursByDay.datasets.map((ds) => ({
        label: ds.label,
        data: [...ds.data],
      })),
    },
    workload: {
      labels: [...rawCharts.workload.labels],
      datasets: rawCharts.workload.datasets.map((ds) => ({
        label: ds.label,
        data: [...ds.data],
      })),
    },
  };

  return serializeRecoveryPlan(
    {
      recoveryId: d.recoveryId,
      planId: d.planId,
      status: d.status as "generated" | "applied",
      missedTaskCount: d.missedTaskCount,
      remainingStudyDays: d.remainingStudyDays,
      extraHoursNeeded: d.extraHoursNeeded,
      recommendedDailyHours: d.recommendedDailyHours,
      currentDailyHours: d.currentDailyHours,
      estimatedCompletionDate: d.estimatedCompletionDate,
      missedTasks: d.missedTasks.map((m) => ({
        taskId: m.taskId,
        taskTitle: m.taskTitle,
        topicId: m.topicId ?? undefined,
        subjectId: m.subjectId ?? undefined,
        originalDueDate: m.originalDueDate,
      })),
      movedTasks: d.movedTasks.map((m) => ({
        taskId: m.taskId,
        taskTitle: m.taskTitle,
        topicId: m.topicId,
        subjectId: m.subjectId ?? undefined,
        fromDueDate: m.fromDueDate,
        toDueDate: m.toDueDate,
        estimatedHours: m.estimatedHours,
        priority: m.priority,
      })),
      schedulePreview: d.schedulePreview.map((day) => ({
        date: new Date(day.date),
        totalHours: day.totalHours,
        tasks: day.tasks.map((t) => ({
          taskId: t.taskId ?? undefined,
          taskTitle: t.taskTitle,
          topicId: t.topicId,
          estimatedHours: t.estimatedHours,
          priority: t.priority,
          isRecovery: t.isRecovery ?? true,
        })),
      })),
      recommendations,
      charts,
      createdAt: d.createdAt,
    },
    planTitle,
  );
}
