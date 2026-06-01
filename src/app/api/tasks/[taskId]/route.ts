import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { applyTaskStatusUpdate } from "@/lib/progress/task-actions";
import { syncUserProgress } from "@/lib/progress/sync-progress";
import {
  cancelRevisionsForTask,
  scheduleRevisionsForTask,
} from "@/lib/revisions/schedule";
import { serializeTask } from "@/lib/progress/serialize-task";
import Task from "@/models/Task";
import { z } from "zod";

const updateTaskSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "missed"]),
});

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

/** PUT /api/tasks/[taskId] — update task status. */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const { taskId } = await context.params;
    const body = updateTaskSchema.parse(await request.json());

    await connectDB();

    const task = await Task.findOne({ taskId, userId: session.userId });
    if (!task) {
      return jsonError("Task not found", 404);
    }

    const wasCompleted = task.status === "completed";
    applyTaskStatusUpdate(task, body.status);
    await task.save();

    if (body.status === "completed" && !wasCompleted) {
      await scheduleRevisionsForTask(task);
    } else if (body.status !== "completed" && wasCompleted) {
      await cancelRevisionsForTask(session.userId, taskId);
    }

    const allTasks = await Task.find({ userId: session.userId })
      .select("status completedAt")
      .lean();
    await syncUserProgress(session.userId, allTasks);

    return jsonSuccess({ task: serializeTask(task) });
  } catch (error) {
    return handleApiError(error);
  }
}
