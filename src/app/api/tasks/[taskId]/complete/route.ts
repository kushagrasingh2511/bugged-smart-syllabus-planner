import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { completeTask, TaskActionError } from "@/lib/progress/task-actions";
import { taskIdParamSchema } from "@/lib/validations/task";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

/** POST /api/tasks/[taskId]/complete — mark a task as completed. */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const { taskId } = taskIdParamSchema.parse(await context.params);
    await connectDB();

    const result = await completeTask(session.userId, taskId);

    return jsonSuccess({
      task: result.task,
      alreadyCompleted: result.alreadyCompleted,
    });
  } catch (error) {
    if (error instanceof TaskActionError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
