import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key?.trim()) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return key.trim();
}

export function getGeminiModel(modelName = DEFAULT_MODEL) {
  const client = new GoogleGenerativeAI(getGeminiApiKey());
  return client.getGenerativeModel({ model: modelName });
}
