import { getSession } from "@/lib/auth";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { listRevisionsForUser } from "@/lib/revisions/list";

/** GET /api/revisions — upcoming, missed, and completed revision buckets. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const buckets = await listRevisionsForUser(session.userId);

    return jsonSuccess(buckets);
  } catch (error) {
    return handleApiError(error);
  }
}
