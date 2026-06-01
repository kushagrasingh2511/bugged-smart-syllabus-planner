/**
 * Gemini Developer API auth for @google/genai.
 *
 * AQ-format keys from Google AI Studio are "authorization keys" bound to a
 * service account. They authenticate via the x-goog-api-key header against
 * generativelanguage.googleapis.com — not Authorization: Bearer.
 *
 * @see https://ai.google.dev/gemini-api/docs/api-key
 * @see https://cloud.google.com/docs/authentication/api-keys#api-keys-bound-sa
 */

/** Official SDK precedence: GOOGLE_API_KEY, then GEMINI_API_KEY. */
export function resolveGeminiApiKey(): string {
  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (googleKey && geminiKey && googleKey !== geminiKey) {
    console.warn(
      "Both GOOGLE_API_KEY and GEMINI_API_KEY are set. Using GOOGLE_API_KEY.",
    );
  }

  const key = googleKey || geminiKey;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add GOOGLE_API_KEY or GEMINI_API_KEY to .env.local, save the file, then restart npm run dev.",
    );
  }

  return key;
}

/** Keep SDK env detection aligned when only GEMINI_API_KEY is provided. */
export function syncGeminiEnvVars(): void {
  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (geminiKey && !googleKey) {
    process.env.GOOGLE_API_KEY = geminiKey;
  }
}

export function isAuthorizationKeyFormat(apiKey: string): boolean {
  return apiKey.startsWith("AQ.");
}

export function getGeminiApiVersion(): string {
  return process.env.GEMINI_API_VERSION?.trim() || "v1beta";
}
