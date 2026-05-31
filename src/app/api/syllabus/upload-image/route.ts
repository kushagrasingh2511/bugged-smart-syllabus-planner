import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "@/lib/validations/syllabus";
import { saveSyllabusFile } from "@/lib/storage/syllabus-files";
import { scheduleSyllabusExtraction } from "@/lib/syllabus/run-extraction";
import Syllabus from "@/models/Syllabus";

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError("Invalid form data", 400);
    }

    const file = formData.get("file");
    const title = formData.get("title");

    // Validate file presence
    if (!file || !(file instanceof File)) {
      return jsonError("No file provided. Include a 'file' field in the form data", 400);
    }

    // Validate title
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return jsonError("Title is required", 400);
    }
    if (title.trim().length > 200) {
      return jsonError("Title must be 200 characters or less", 400);
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return jsonError(
        `Invalid file type '${file.type}'. Allowed types: JPEG, PNG, WebP`,
        400,
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonError(
        `File size exceeds the ${MAX_FILE_SIZE_MB}MB limit`,
        400,
      );
    }

    // Validate file is not empty
    if (file.size === 0) {
      return jsonError("File is empty", 400);
    }

    await connectDB();

    const syllabus = await Syllabus.create({
      userId: session.userId,
      title: title.trim(),
      sourceType: "image",
      extractionStatus: "pending",
    });

    const fileUrl = await saveSyllabusFile(
      session.userId,
      syllabus.syllabusId,
      file,
    );
    syllabus.fileUrl = fileUrl;
    await syllabus.save();

    scheduleSyllabusExtraction(syllabus.syllabusId, session.userId);

    return jsonSuccess(
      {
        syllabus: {
          syllabusId: syllabus.syllabusId,
          title: syllabus.title,
          sourceType: syllabus.sourceType,
          extractionStatus: syllabus.extractionStatus,
          fileUrl: syllabus.fileUrl,
          createdAt: syllabus.createdAt,
        },
        message:
          "Image uploaded successfully. Extraction has started in the background.",
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
