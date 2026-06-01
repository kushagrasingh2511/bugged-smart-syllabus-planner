import { extractText } from "unpdf";

/**
 * Extract plain text from a PDF buffer.
 * Uses unpdf for server-side PDF text extraction (needed for Groq
 * which cannot process raw PDF bytes like Gemini can).
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const result = await extractText(new Uint8Array(buffer));
  const text = result.text.join("\n\n").trim();
  if (!text) {
    throw new Error(
      "Could not extract any text from the PDF. The file may be image-based — try uploading as an image instead.",
    );
  }
  return text;
}
