import { getSession } from "@/lib/auth";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { generateStudyPlan } from "@/lib/study-plan/generate";
import { generatePlanSchema } from "@/lib/validations/study-plan";

/** POST /api/study-plans/generate — generate a new study plan. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const body = generatePlanSchema.parse(await request.json());
    const result = await generateStudyPlan(session.userId, body);

    return jsonSuccess(
      {
        message: "Study plan generated successfully",
        plan: result,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
