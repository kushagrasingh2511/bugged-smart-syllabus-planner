import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import Subject from "@/models/Subject";
import Syllabus from "@/models/Syllabus";
import Topic from "@/models/Topic";

type RouteContext = {
  params: Promise<{ syllabusId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const { syllabusId } = await context.params;
    if (!syllabusId?.trim()) {
      return jsonError("Syllabus ID is required", 400);
    }

    await connectDB();

    const syllabus = await Syllabus.findOne({
      syllabusId,
      userId: session.userId,
    });
    if (!syllabus) {
      return jsonError("Syllabus not found", 404);
    }

    // Cascade: delete topics → subjects → syllabus
    const subjects = await Subject.find({ syllabusId, userId: session.userId }).lean();
    const subjectIds = subjects.map((s) => s.subjectId);

    if (subjectIds.length > 0) {
      await Topic.deleteMany({ subjectId: { $in: subjectIds } });
      await Subject.deleteMany({ syllabusId, userId: session.userId });
    }

    await Syllabus.deleteOne({ syllabusId, userId: session.userId });

    return jsonSuccess({
      message: "Syllabus and all related data deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
