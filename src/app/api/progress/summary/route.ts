import { getSession } from "@/lib/auth";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { getProgressSummary } from "@/lib/progress/summary";

/** GET /api/progress/summary — aggregated progress metrics and chart-ready series. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const summary = await getProgressSummary(session.userId);

    return jsonSuccess({ summary });
  } catch (error) {
    return handleApiError(error);
  }
}
