import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { manualSyllabusSchema } from "@/lib/validations/syllabus";
import { scheduleSyllabusExtraction } from "@/lib/syllabus/run-extraction";
import Syllabus from "@/models/Syllabus";

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    // Parse and validate JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const parsed = manualSyllabusSchema.parse(body);

    await connectDB();

    const syllabus = await Syllabus.create({
      userId: session.userId,
      title: parsed.title,
      sourceType: "manual",
      rawContent: parsed.rawContent,
      extractionStatus: "pending",
    });

    scheduleSyllabusExtraction(syllabus.syllabusId, session.userId);

    return jsonSuccess(
      {
        syllabus: {
          syllabusId: syllabus.syllabusId,
          title: syllabus.title,
          sourceType: syllabus.sourceType,
          extractionStatus: syllabus.extractionStatus,
          createdAt: syllabus.createdAt,
        },
        message:
          "Syllabus saved successfully. Extraction has started in the background.",
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
