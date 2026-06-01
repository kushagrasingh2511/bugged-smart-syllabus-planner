import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import {
  RevisionUpdateError,
  updateRevisionStatus,
} from "@/lib/revisions/update";
import {
  revisionIdParamSchema,
  updateRevisionSchema,
} from "@/lib/validations/revision";

type RouteContext = {
  params: Promise<{ revisionId: string }>;
};

/** PUT /api/revisions/[revisionId] — update revision status. */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const { revisionId } = revisionIdParamSchema.parse(await context.params);
    const body = updateRevisionSchema.parse(await request.json());

    await connectDB();

    const revision = await updateRevisionStatus(
      session.userId,
      revisionId,
      body.status,
    );

    return jsonSuccess({ revision });
  } catch (error) {
    if (error instanceof RevisionUpdateError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
