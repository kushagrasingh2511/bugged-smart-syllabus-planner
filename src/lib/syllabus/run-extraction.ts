import { connectDB } from "@/lib/db";
import { readSyllabusFile } from "@/lib/storage/syllabus-files";
import type { ExtractionResult } from "@/lib/validations/extraction";
import Subject from "@/models/Subject";
import Syllabus, { type SyllabusDocument } from "@/models/Syllabus";
import Topic from "@/models/Topic";

// ─── Provider routing ───────────────────────────────────────────
// Set AI_PROVIDER=groq in .env.local to use Groq instead of Gemini.
// Default: auto-detect based on which API key is available.

type ExtractionProvider = {
  extractFromManualText: (text: string) => Promise<ExtractionResult>;
  extractFromStoredFile: (buffer: Buffer, path: string) => Promise<ExtractionResult>;
};

function resolveProviderName(): "groq" | "gemini" {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "groq") return "groq";
  if (explicit === "gemini") return "gemini";

  // Auto-detect: prefer Groq if key is available (avoids Gemini quota issues)
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()) return "gemini";

  throw new Error(
    "No AI provider configured. Set GROQ_API_KEY (free at https://console.groq.com) or GEMINI_API_KEY in .env.local and restart the dev server.",
  );
}

async function getProvider(): Promise<ExtractionProvider> {
  const name = resolveProviderName();
  if (name === "groq") {
    const mod = await import("@/lib/groq/extract-syllabus");
    return mod;
  }
  const mod = await import("@/lib/gemini/extract-syllabus");
  return mod;
}

function formatExtractionError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  // Gemini quota errors
  if (
    raw.includes("429") ||
    raw.includes("Too Many Requests") ||
    raw.includes("RESOURCE_EXHAUSTED") ||
    raw.includes("quota")
  ) {
    return (
      "AI quota exceeded. Try switching to Groq (free): set GROQ_API_KEY in .env.local " +
      "(get a key at https://console.groq.com), then restart the dev server."
    );
  }

  // Groq-specific errors
  if (raw.includes("Groq API error")) {
    return raw;
  }

  if (raw.length > 500) {
    return `${raw.slice(0, 500)}…`;
  }

  return raw || "Extraction failed";
}

// ─── Core logic ─────────────────────────────────────────────────

async function loadExtractionInput(
  syllabus: SyllabusDocument,
): Promise<ExtractionResult> {
  const provider = await getProvider();

  if (syllabus.sourceType === "manual") {
    if (!syllabus.rawContent?.trim()) {
      throw new Error("Manual syllabus has no text content");
    }
    return provider.extractFromManualText(syllabus.rawContent);
  }

  if (!syllabus.fileUrl) {
    throw new Error("Syllabus file is missing");
  }

  const buffer = await readSyllabusFile(syllabus.fileUrl);
  return provider.extractFromStoredFile(buffer, syllabus.fileUrl);
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

  if (syllabus.extractionStatus === "failed") {
    await Syllabus.updateOne(
      { syllabusId, userId },
      { $set: { extractionStatus: "pending" }, $unset: { extractionError: 1 } },
    );
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
    const message = formatExtractionError(error);

    await Syllabus.updateOne(
      { syllabusId, userId },
      {
        $set: {
          extractionStatus: "failed",
          extractionError: message,
        },
      },
    );

    throw new Error(message);
  }
}

/** Fire-and-forget helper; logs errors without throwing to the caller. */
export function scheduleSyllabusExtraction(syllabusId: string, userId: string) {
  void runSyllabusExtraction(syllabusId, userId).catch((error) => {
    console.error(`Syllabus extraction failed for ${syllabusId}:`, error);
  });
}
