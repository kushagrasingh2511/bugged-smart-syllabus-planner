import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { undoTaskCompletion, TaskActionError } from "@/lib/progress/task-actions";
import { taskIdParamSchema } from "@/lib/validations/task";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

/** POST /api/tasks/[taskId]/undo — revert a completed task to pending. */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const { taskId } = taskIdParamSchema.parse(await context.params);
    await connectDB();

    const result = await undoTaskCompletion(session.userId, taskId);

    return jsonSuccess({ task: result.task });
  } catch (error) {
    if (error instanceof TaskActionError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
