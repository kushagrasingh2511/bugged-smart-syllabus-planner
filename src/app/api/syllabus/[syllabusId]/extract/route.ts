import { getSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { formatGeminiError, isGeminiQuotaError } from "@/lib/gemini/errors";
import { runSyllabusExtraction } from "@/lib/syllabus/run-extraction";

type RouteContext = {
  params: Promise<{ syllabusId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const { syllabusId } = await context.params;
    if (!syllabusId?.trim()) {
      return jsonError("Syllabus ID is required", 400);
    }

    const result = await runSyllabusExtraction(syllabusId, session.userId);

    return jsonSuccess({
      ...result,
      message: "Syllabus extracted successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Syllabus not found") {
        return jsonError(error.message, 404);
      }
      if (
        error.message === "Extraction is already in progress" ||
        error.message === "Extraction already completed"
      ) {
        return jsonError(error.message, 409);
      }
      if (error.message.includes("not configured")) {
        return jsonError(error.message, 503);
      }
      if (isGeminiQuotaError(error)) {
        return jsonError(formatGeminiError(error), 429);
      }
      if (error.message.length < 600) {
        return jsonError(error.message, 502);
      }
    }
    return jsonError(formatGeminiError(error), 502);
  }
}
