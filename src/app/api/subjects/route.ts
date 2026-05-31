import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const syllabusId = searchParams.get("syllabusId");

    await connectDB();

    const subjectFilter: { userId: string; syllabusId?: string } = {
      userId: session.userId,
    };
    if (syllabusId) {
      subjectFilter.syllabusId = syllabusId;
    }

    const subjects = await Subject.find(subjectFilter).sort({ createdAt: 1 }).lean();
    const subjectIds = subjects.map((s) => s.subjectId);

    const topics =
      subjectIds.length > 0 ?
        await Topic.find({ subjectId: { $in: subjectIds } })
          .sort({ createdAt: 1 })
          .lean()
      : [];

    const topicsBySubject = new Map<string, typeof topics>();
    for (const topic of topics) {
      const list = topicsBySubject.get(topic.subjectId) ?? [];
      list.push(topic);
      topicsBySubject.set(topic.subjectId, list);
    }

    return jsonSuccess({
      subjects: subjects.map((subject) => ({
        subjectId: subject.subjectId,
        syllabusId: subject.syllabusId,
        subjectName: subject.subjectName,
        topics: (topicsBySubject.get(subject.subjectId) ?? []).map((topic) => ({
          topicId: topic.topicId,
          topicName: topic.topicName,
          difficulty: topic.difficulty,
          status: topic.status,
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
