import { getSession } from "@/lib/auth";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { getRecoveryDashboardData } from "@/lib/recovery/dashboard";
import { recoveryPlanToSummary } from "@/lib/recovery/serialize-doc";
import RecoveryPlan from "@/models/RecoveryPlan";
import StudyPlan from "@/models/StudyPlan";

/** GET /api/recovery — overdue summary and optional latest recovery for a plan. */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    const dashboard = await getRecoveryDashboardData(session.userId);

    if (planId) {
      const latest = await RecoveryPlan.findOne({
        userId: session.userId,
        planId,
      })
        .sort({ createdAt: -1 })
        .lean();

      if (latest) {
        const plan = await StudyPlan.findOne({
          planId,
          userId: session.userId,
        })
          .select("title")
          .lean();

        return jsonSuccess({
          ...dashboard,
          recovery: recoveryPlanToSummary(latest, plan?.title ?? "Study plan"),
        });
      }
    }

    return jsonSuccess(dashboard);
  } catch (error) {
    return handleApiError(error);
  }
}
