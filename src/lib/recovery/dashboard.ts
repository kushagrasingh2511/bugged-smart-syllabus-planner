import { connectDB } from "@/lib/db";
import { filterOverdueTasks } from "@/lib/recovery/overdue";
import { recoveryPlanToSummary } from "@/lib/recovery/serialize-doc";
import RecoveryPlan from "@/models/RecoveryPlan";
import StudyPlan from "@/models/StudyPlan";
import Task from "@/models/Task";
import type { RecoveryDashboardData } from "@/types/recovery";

export async function getRecoveryDashboardData(
  userId: string,
): Promise<RecoveryDashboardData> {
  await connectDB();

  const allTasks = await Task.find({ userId }).lean();
  const overdue = filterOverdueTasks(allTasks);

  const overdueTasks = overdue.slice(0, 8).map((t) => ({
    taskId: t.taskId,
    taskTitle: t.taskTitle,
    topicId: t.topicId ?? undefined,
    subjectId: t.subjectId ?? undefined,
    originalDueDate: new Date(t.dueDate).toISOString(),
  }));

  const countByPlan = new Map<string, number>();
  for (const t of overdue) {
    if (!t.planId) continue;
    countByPlan.set(t.planId, (countByPlan.get(t.planId) ?? 0) + 1);
  }

  const planIds = [...countByPlan.keys()];
  const plans =
    planIds.length > 0 ?
      await StudyPlan.find({ userId, planId: { $in: planIds } })
        .select("planId title")
        .lean()
    : [];

  const plansWithOverdue = plans.map((p) => ({
    planId: p.planId,
    title: p.title,
    overdueCount: countByPlan.get(p.planId) ?? 0,
  }));

  const latest = await RecoveryPlan.findOne({ userId })
    .sort({ createdAt: -1 })
    .lean();

  let latestRecovery = null;
  if (latest) {
    const plan = await StudyPlan.findOne({ planId: latest.planId, userId })
      .select("title")
      .lean();

    latestRecovery = recoveryPlanToSummary(latest, plan?.title ?? "Study plan");
  }

  return {
    overdueCount: overdue.length,
    overdueTasks,
    latestRecovery,
    plansWithOverdue,
  };
}
