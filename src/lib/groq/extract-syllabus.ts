import {
  groqChatCompletion,
  type GroqContentPart,
  type GroqMessage,
} from "@/lib/groq/client";
import { extractTextFromPdf } from "@/lib/pdf/extract-text";
import { mimeTypeFromPath } from "@/lib/storage/syllabus-files";
import {
  extractionResultSchema,
  type ExtractionResult,
} from "@/lib/validations/extraction";

const EXTRACTION_PROMPT = `You are an academic syllabus parser. Extract a structured list of subjects and their topics from the provided syllabus content.

Rules:
- Group content into logical subjects (courses/units).
- Under each subject, list distinct topics or chapters as study units.
- Assign difficulty from 1 (easy) to 5 (hard); use 3 when unclear.
- Do not invent subjects or topics that are not supported by the source.
- Return ONLY valid JSON matching this shape:
{"subjects":[{"subjectName":"string","topics":[{"topicName":"string","difficulty":3}]}]}`;

function parseJsonResponse(text: string): ExtractionResult {
  const trimmed = text.trim();
  const jsonText =
    trimmed.startsWith("```")
      ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
      : trimmed;
  return extractionResultSchema.parse(JSON.parse(jsonText));
}

// ─── Text extraction ────────────────────────────────────────────

export async function extractFromManualText(
  rawContent: string,
): Promise<ExtractionResult> {
  const messages: GroqMessage[] = [
    { role: "system", content: EXTRACTION_PROMPT },
    { role: "user", content: rawContent },
  ];
  const text = await groqChatCompletion(messages);
  return parseJsonResponse(text);
}

// ─── PDF extraction (text-based via pdf-parse) ──────────────────

export async function extractFromPdfBuffer(
  buffer: Buffer,
): Promise<ExtractionResult> {
  const pdfText = await extractTextFromPdf(buffer);
  return extractFromManualText(pdfText);
}

// ─── Image extraction (vision model) ────────────────────────────

export async function extractFromImageBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractionResult> {
  const base64 = buffer.toString("base64");
  const content: GroqContentPart[] = [
    {
      type: "text",
      text: "Extract subjects and topics from this syllabus image. Return ONLY valid JSON matching: {\"subjects\":[{\"subjectName\":\"string\",\"topics\":[{\"topicName\":\"string\",\"difficulty\":3}]}]}. No explanation, no markdown, just the JSON object.",
    },
    {
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${base64}` },
    },
  ];
  const messages: GroqMessage[] = [
    { role: "system", content: EXTRACTION_PROMPT },
    { role: "user", content },
  ];
  const text = await groqChatCompletion(messages, { vision: true });
  return parseJsonResponse(text);
}

// ─── Stored file dispatcher ─────────────────────────────────────

export async function extractFromStoredFile(
  buffer: Buffer,
  filePath: string,
): Promise<ExtractionResult> {
  const mimeType = mimeTypeFromPath(filePath);
  if (mimeType === "application/pdf") {
    return extractFromPdfBuffer(buffer);
  }
  if (mimeType.startsWith("image/")) {
    return extractFromImageBuffer(buffer, mimeType);
  }
  throw new Error(`Unsupported file type for extraction: ${mimeType}`);
}
