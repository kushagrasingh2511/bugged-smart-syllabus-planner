import { connectDB } from "@/lib/db";
import Progress from "@/models/Progress";
import Revision from "@/models/Revision";
import StudyPlan from "@/models/StudyPlan";
import Subject from "@/models/Subject";
import Task from "@/models/Task";
import Topic from "@/models/Topic";

export type AssistantContext = {
  subjects: { subjectId: string; name: string; topicCount: number; completedTopics: number }[];
  activePlan: {
    title: string;
    examDate: string | null;
    dailyStudyHours: number;
    weakSubjects: string[];
    daysUntilExam: number | null;
  } | null;
  taskSummary: {
    total: number;
    completed: number;
    pending: number;
    missed: number;
    todayTasks: { title: string; priority: string; status: string }[];
  };
  progress: {
    overallPercentage: number;
    streak: number;
    studyDaysCompleted: number;
  };
  revisions: {
    dueToday: number;
    overdue: number;
    upcoming: { topicName: string; dueDate: string }[];
  };
  recoveryNeeded: boolean;
  missedTaskCount: number;
};

export async function buildAssistantContext(userId: string): Promise<AssistantContext> {
  await connectDB();

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // First fetch subjects so we can scope the topic query
  const subjects = await Subject.find({ userId }).lean();
  const subjectIds = subjects.map((s) => s.subjectId);

  const [tasks, activePlan, progressRecords, revisions, topics] = await Promise.all([
    Task.find({ userId }).lean(),
    StudyPlan.findOne({ userId, status: "active" }).lean(),
    Progress.find({ userId }).lean(),
    Revision.find({ userId, status: "scheduled" }).sort({ scheduledDate: 1 }).lean(),
    // Scope topics to this user's subjects only
    subjectIds.length > 0
      ? Topic.find({ subjectId: { $in: subjectIds } }).lean()
      : Promise.resolve([]),
  ]);

  // Build topic maps
  const topicMap = new Map(topics.map((t) => [t.topicId, t]));

  // Subject stats
  const subjectStats = subjects.map((s) => {
    const subjectTopics = topics.filter((t) => t.subjectId === s.subjectId);
    const completedTopics = subjectTopics.filter((t) => t.status === "completed").length;
    return {
      subjectId: s.subjectId,
      name: s.subjectName,
      topicCount: subjectTopics.length,
      completedTopics,
    };
  });

  // Task summary
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const missed = tasks.filter((t) => t.status === "missed").length;

  const todayTasks = tasks
    .filter((t) => {
      const due = new Date(t.dueDate);
      return due >= todayStart && due < todayEnd;
    })
    .slice(0, 5)
    .map((t) => ({ title: t.taskTitle, priority: t.priority, status: t.status }));

  // Overall progress
  const globalProgress = progressRecords.find((p) => !p.subjectId);
  const overallPercentage =
    tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  // Active plan info
  let activePlanInfo: AssistantContext["activePlan"] = null;
  if (activePlan) {
    const examDate = activePlan.examDate ? new Date(activePlan.examDate) : null;
    const daysUntilExam = examDate
      ? Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    activePlanInfo = {
      title: activePlan.title,
      examDate: examDate ? examDate.toISOString().split("T")[0] : null,
      dailyStudyHours: activePlan.dailyStudyHours,
      weakSubjects: activePlan.weakSubjects ?? [],
      daysUntilExam,
    };
  }

  // Revisions
  const revisionsDueToday = revisions.filter((r) => {
    const d = new Date(r.scheduledDate);
    return d >= todayStart && d < todayEnd;
  }).length;

  const revisionsOverdue = revisions.filter((r) => new Date(r.scheduledDate) < todayStart).length;

  const upcomingRevisions = revisions
    .filter((r) => new Date(r.scheduledDate) >= todayStart)
    .slice(0, 5)
    .map((r) => ({
      topicName: topicMap.get(r.topicId)?.topicName ?? "Unknown topic",
      dueDate: new Date(r.scheduledDate).toISOString().split("T")[0],
    }));

  return {
    subjects: subjectStats,
    activePlan: activePlanInfo,
    taskSummary: {
      total: tasks.length,
      completed,
      pending,
      missed,
      todayTasks,
    },
    progress: {
      overallPercentage,
      streak: globalProgress?.streakDays ?? 0,
      studyDaysCompleted: globalProgress?.studyDaysCompleted ?? 0,
    },
    revisions: {
      dueToday: revisionsDueToday,
      overdue: revisionsOverdue,
      upcoming: upcomingRevisions,
    },
    recoveryNeeded: missed > 5,
    missedTaskCount: missed,
  };
}

export function formatContextForPrompt(ctx: AssistantContext): string {
  const lines: string[] = ["=== STUDENT ACADEMIC CONTEXT ==="];

  // Overall progress
  lines.push(
    `\nOVERALL PROGRESS: ${ctx.progress.overallPercentage}% complete | ` +
      `Streak: ${ctx.progress.streak} days | ` +
      `Study days: ${ctx.progress.studyDaysCompleted}`,
  );

  // Active plan
  if (ctx.activePlan) {
    const p = ctx.activePlan;
    lines.push(
      `\nACTIVE STUDY PLAN: "${p.title}"` +
        (p.examDate ? ` | Exam: ${p.examDate}` : "") +
        (p.daysUntilExam !== null ? ` (${p.daysUntilExam} days away)` : "") +
        ` | Daily hours: ${p.dailyStudyHours}h`,
    );
    if (p.weakSubjects.length > 0) {
      lines.push(`Weak subjects: ${p.weakSubjects.join(", ")}`);
    }
  } else {
    lines.push("\nACTIVE STUDY PLAN: None");
  }

  // Tasks
  lines.push(
    `\nTASKS: ${ctx.taskSummary.total} total | ` +
      `${ctx.taskSummary.completed} completed | ` +
      `${ctx.taskSummary.pending} pending | ` +
      `${ctx.taskSummary.missed} missed`,
  );

  if (ctx.taskSummary.todayTasks.length > 0) {
    lines.push("Today's tasks:");
    for (const t of ctx.taskSummary.todayTasks) {
      lines.push(`  - ${t.title} [${t.priority} priority, ${t.status}]`);
    }
  } else {
    lines.push("Today's tasks: None scheduled");
  }

  // Subjects
  if (ctx.subjects.length > 0) {
    lines.push("\nSUBJECTS:");
    for (const s of ctx.subjects) {
      const pct =
        s.topicCount > 0 ? Math.round((s.completedTopics / s.topicCount) * 100) : 0;
      lines.push(`  - ${s.name}: ${s.completedTopics}/${s.topicCount} topics (${pct}%)`);
    }
  } else {
    lines.push("\nSUBJECTS: None added yet");
  }

  // Revisions
  lines.push(
    `\nREVISIONS: ${ctx.revisions.dueToday} due today | ${ctx.revisions.overdue} overdue`,
  );
  if (ctx.revisions.upcoming.length > 0) {
    lines.push("Upcoming revisions:");
    for (const r of ctx.revisions.upcoming) {
      lines.push(`  - ${r.topicName} on ${r.dueDate}`);
    }
  }

  // Recovery alert
  if (ctx.recoveryNeeded) {
    lines.push(
      `\n⚠️ RECOVERY NEEDED: ${ctx.missedTaskCount} missed tasks — student is behind schedule.`,
    );
  }

  lines.push("\n=== END CONTEXT ===");
  return lines.join("\n");
}
