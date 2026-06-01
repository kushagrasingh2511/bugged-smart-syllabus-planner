import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import StudyPlan from "@/models/StudyPlan";
import Task from "@/models/Task";

/** GET /api/study-plans — list all study plans for the user. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    await connectDB();

    const plans = await StudyPlan.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    // Attach task counts for each plan
    const planIds = plans.map((p) => p.planId);
    const taskCounts = await Task.aggregate([
      { $match: { planId: { $in: planIds } } },
      {
        $group: {
          _id: "$planId",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]);

    const countMap = new Map(
      taskCounts.map((c: { _id: string; total: number; completed: number }) => [
        c._id,
        { total: c.total, completed: c.completed },
      ]),
    );

    return jsonSuccess({
      plans: plans.map((plan) => {
        const counts = countMap.get(plan.planId) ?? { total: 0, completed: 0 };
        return {
          planId: plan.planId,
          title: plan.title,
          examDate: plan.examDate,
          dailyStudyHours: plan.dailyStudyHours,
          weakSubjects: plan.weakSubjects,
          status: plan.status,
          totalTasks: counts.total,
          completedTasks: counts.completed,
          progress: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
          createdAt: plan.createdAt,
        };
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
