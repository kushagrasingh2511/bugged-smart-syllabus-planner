import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import StudyPlan from "@/models/StudyPlan";
import Task from "@/models/Task";

type RouteContext = {
  params: Promise<{ planId: string }>;
};

/** GET /api/study-plans/[planId] — get a plan with all its tasks. */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const { planId } = await context.params;
    await connectDB();

    const plan = await StudyPlan.findOne({
      planId,
      userId: session.userId,
    }).lean();

    if (!plan) {
      return jsonError("Study plan not found", 404);
    }

    const tasks = await Task.find({ planId })
      .sort({ dueDate: 1, priority: -1 })
      .lean();

    // Group tasks by date for easy calendar rendering
    const tasksByDate: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      const dateKey = new Date(task.dueDate).toISOString().split("T")[0];
      (tasksByDate[dateKey] ??= []).push(task);
    }

    const completedCount = tasks.filter((t) => t.status === "completed").length;

    return jsonSuccess({
      plan: {
        planId: plan.planId,
        title: plan.title,
        examDate: plan.examDate,
        dailyStudyHours: plan.dailyStudyHours,
        weakSubjects: plan.weakSubjects,
        status: plan.status,
        createdAt: plan.createdAt,
        totalTasks: tasks.length,
        completedTasks: completedCount,
        progress: tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0,
      },
      tasks: tasks.map((t) => ({
        taskId: t.taskId,
        taskTitle: t.taskTitle,
        subjectId: t.subjectId,
        topicId: t.topicId,
        dueDate: t.dueDate,
        status: t.status,
        priority: t.priority,
      })),
      tasksByDate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE /api/study-plans/[planId] — delete a plan and all its tasks. */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const { planId } = await context.params;
    await connectDB();

    const plan = await StudyPlan.findOne({
      planId,
      userId: session.userId,
    });

    if (!plan) {
      return jsonError("Study plan not found", 404);
    }

    await Task.deleteMany({ planId });
    await StudyPlan.deleteOne({ planId, userId: session.userId });

    return jsonSuccess({
      message: "Study plan and all tasks deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
