export function formatGeminiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (
    raw.includes("429") ||
    raw.includes("Too Many Requests") ||
    raw.includes("RESOURCE_EXHAUSTED") ||
    raw.includes("quota")
  ) {
    return (
      "Gemini API quota exceeded for this model. Wait a few minutes and retry, " +
      "or set GEMINI_MODEL=gemini-2.0-flash-lite in .env.local and restart the dev server."
    );
  }

  if (
    raw.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
    raw.includes("API_KEY_SERVICE_BLOCKED") ||
    raw.includes("API_KEY_INVALID") ||
    raw.includes("API key not valid") ||
    raw.includes("UNAUTHENTICATED") ||
    raw.includes("401")
  ) {
    return (
      "Gemini API rejected the key. For AQ-format keys from AI Studio: " +
      "enable the Generative Language API on your Google Cloud project, link billing, " +
      "and ensure the key is allowed for generativelanguage.googleapis.com. " +
      "Set GOOGLE_API_KEY or GEMINI_API_KEY in .env.local (keys may start with AQ. or AIza). " +
      "Manage keys at https://aistudio.google.com/app/apikey"
    );
  }

  if (raw.length > 500) {
    return `${raw.slice(0, 500)}…`;
  }

  return raw || "Extraction failed";
}

export function isGeminiQuotaError(error: unknown): boolean {
  const raw = error instanceof Error ? error.message : String(error);
  return (
    raw.includes("429") ||
    raw.includes("Too Many Requests") ||
    raw.includes("RESOURCE_EXHAUSTED")
  );
}
