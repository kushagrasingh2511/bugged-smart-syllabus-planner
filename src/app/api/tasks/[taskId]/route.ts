import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
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

    task.status = body.status;
    await task.save();

    return jsonSuccess({
      task: {
        taskId: task.taskId,
        taskTitle: task.taskTitle,
        status: task.status,
        dueDate: task.dueDate,
        priority: task.priority,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
