import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { generateRevisionsForUser } from "@/lib/revisions/generate";
import { generateRevisionsSchema } from "@/lib/validations/revision";

/** POST /api/revisions/generate — backfill revision schedules from completed tasks. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const body = generateRevisionsSchema.parse(
      await request.json().catch(() => ({})),
    );

    await connectDB();

    const result = await generateRevisionsForUser(session.userId, {
      planId: body.planId,
      topicId: body.topicId,
      force: body.force,
    });

    return jsonSuccess(
      {
        message: `Created ${result.created} revision(s) for ${result.topicsProcessed} topic(s)`,
        ...result,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
