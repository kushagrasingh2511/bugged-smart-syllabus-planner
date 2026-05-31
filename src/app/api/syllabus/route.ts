import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import Syllabus from "@/models/Syllabus";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    await connectDB();

    const syllabi = await Syllabus.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    return jsonSuccess({
      syllabi: syllabi.map((s) => ({
        syllabusId: s.syllabusId,
        title: s.title,
        sourceType: s.sourceType,
        extractionStatus: s.extractionStatus,
        extractionError: s.extractionError,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
