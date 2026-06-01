import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import {
  generateRecoveryPlan,
  RecoveryGenerateError,
} from "@/lib/recovery/generate";
import { generateRecoverySchema } from "@/lib/validations/recovery";

/** POST /api/recovery/generate — build a recovery plan for overdue tasks. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const body = generateRecoverySchema.parse(await request.json());
    await connectDB();

    const summary = await generateRecoveryPlan(
      session.userId,
      body.planId,
      body.apply,
    );

    return jsonSuccess(
      {
        message: body.apply
          ? "Recovery plan applied — task due dates updated"
          : "Recovery plan generated",
        recovery: summary,
      },
      201,
    );
  } catch (error) {
    if (error instanceof RecoveryGenerateError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
