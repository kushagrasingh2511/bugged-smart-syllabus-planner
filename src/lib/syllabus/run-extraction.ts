import { connectDB } from "@/lib/db";
import {
  extractFromManualText,
  extractFromStoredFile,
} from "@/lib/gemini/extract-syllabus";
import { readSyllabusFile } from "@/lib/storage/syllabus-files";
import type { ExtractionResult } from "@/lib/validations/extraction";
import Subject from "@/models/Subject";
import Syllabus, { type SyllabusDocument } from "@/models/Syllabus";
import Topic from "@/models/Topic";

async function loadExtractionInput(
  syllabus: SyllabusDocument,
): Promise<ExtractionResult> {
  if (syllabus.sourceType === "manual") {
    if (!syllabus.rawContent?.trim()) {
      throw new Error("Manual syllabus has no text content");
    }
    return extractFromManualText(syllabus.rawContent);
  }

  if (!syllabus.fileUrl) {
    throw new Error("Syllabus file is missing");
  }

  const buffer = await readSyllabusFile(syllabus.fileUrl);
  return extractFromStoredFile(buffer, syllabus.fileUrl);
}

async function persistExtraction(
  userId: string,
  syllabusId: string,
  result: ExtractionResult,
): Promise<{ subjectCount: number; topicCount: number }> {
  const existingSubjects = await Subject.find({ userId, syllabusId }).lean();
  const existingSubjectIds = existingSubjects.map((s) => s.subjectId);

  if (existingSubjectIds.length > 0) {
    await Topic.deleteMany({ subjectId: { $in: existingSubjectIds } });
    await Subject.deleteMany({ userId, syllabusId });
  }

  let topicCount = 0;

  for (const item of result.subjects) {
    const subject = await Subject.create({
      userId,
      syllabusId,
      subjectName: item.subjectName,
    });

    for (const topic of item.topics) {
      await Topic.create({
        subjectId: subject.subjectId,
        topicName: topic.topicName,
        difficulty: topic.difficulty ?? 3,
      });
      topicCount += 1;
    }
  }

  return { subjectCount: result.subjects.length, topicCount };
}

export type ExtractionRunResult = {
  syllabusId: string;
  extractionStatus: "completed";
  subjectCount: number;
  topicCount: number;
};

export async function runSyllabusExtraction(
  syllabusId: string,
  userId: string,
): Promise<ExtractionRunResult> {
  await connectDB();

  const syllabus = await Syllabus.findOne({ syllabusId, userId });
  if (!syllabus) {
    throw new Error("Syllabus not found");
  }

  if (syllabus.extractionStatus === "processing") {
    throw new Error("Extraction is already in progress");
  }

  if (syllabus.extractionStatus === "completed") {
    throw new Error("Extraction already completed");
  }

  await Syllabus.updateOne(
    { syllabusId, userId },
    {
      $set: { extractionStatus: "processing" },
      $unset: { extractionError: 1 },
    },
  );

  try {
    const result = await loadExtractionInput(syllabus);
    const counts = await persistExtraction(userId, syllabusId, result);

    await Syllabus.updateOne(
      { syllabusId, userId },
      {
        $set: { extractionStatus: "completed" },
        $unset: { extractionError: 1 },
      },
    );

    return {
      syllabusId,
      extractionStatus: "completed",
      ...counts,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Extraction failed";

    await Syllabus.updateOne(
      { syllabusId, userId },
      {
        $set: {
          extractionStatus: "failed",
          extractionError: message,
        },
      },
    );

    throw error;
  }
}

/** Fire-and-forget helper; logs errors without throwing to the caller. */
export function scheduleSyllabusExtraction(syllabusId: string, userId: string) {
  void runSyllabusExtraction(syllabusId, userId).catch((error) => {
    console.error(`Syllabus extraction failed for ${syllabusId}:`, error);
  });
}
