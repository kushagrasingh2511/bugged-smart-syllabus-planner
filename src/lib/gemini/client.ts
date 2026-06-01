import { GoogleGenAI } from "@google/genai";

import {
  getGeminiApiVersion,
  resolveGeminiApiKey,
  syncGeminiEnvVars,
} from "@/lib/gemini/auth";

// flash-lite has a separate free-tier quota from gemini-2.0-flash
const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";

let cachedClient: GoogleGenAI | null = null;

export function getGeminiApiKey(): string {
  return resolveGeminiApiKey();
}

export function getGeminiModelName(): string {
  return DEFAULT_MODEL;
}

/**
 * Native Gemini Developer API client.
 * AQ and AIza keys both authenticate via x-goog-api-key (handled by the SDK).
 */
export function getGeminiClient(): GoogleGenAI {
  if (!cachedClient) {
    syncGeminiEnvVars();
    const apiKey = resolveGeminiApiKey();

    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        apiVersion: getGeminiApiVersion(),
      },
    });
  }

  return cachedClient;
}
