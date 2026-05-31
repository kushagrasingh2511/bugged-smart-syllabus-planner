import type { Part } from "@google/generative-ai";

import { getGeminiModel } from "@/lib/gemini/client";
import {
  extractionResultSchema,
  type ExtractionResult,
} from "@/lib/validations/extraction";
import { mimeTypeFromPath } from "@/lib/storage/syllabus-files";

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
    trimmed.startsWith("```") ?
      trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;
  const parsed = extractionResultSchema.parse(JSON.parse(jsonText));
  return parsed;
}

async function generateStructuredExtraction(parts: Part[]): Promise<ExtractionResult> {
  const model = getGeminiModel();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: EXTRACTION_PROMPT }, ...parts] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
  const text = result.response.text();
  if (!text) {
    throw new Error("Empty response from Gemini");
  }
  return parseJsonResponse(text);
}

export async function extractFromManualText(rawContent: string): Promise<ExtractionResult> {
  return generateStructuredExtraction([{ text: rawContent }]);
}

export async function extractFromPdfBuffer(buffer: Buffer): Promise<ExtractionResult> {
  return generateStructuredExtraction([
    {
      inlineData: {
        mimeType: "application/pdf",
        data: buffer.toString("base64"),
      },
    },
  ]);
}

export async function extractFromImageBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractionResult> {
  return generateStructuredExtraction([
    {
      inlineData: {
        mimeType,
        data: buffer.toString("base64"),
      },
    },
  ]);
}

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
