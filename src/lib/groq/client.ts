const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Text model — generous free tier (30 RPM, 14 400 RPD). */
const TEXT_MODEL = "llama-3.3-70b-versatile";
/** Vision model — Llama 4 Scout supports multimodal input. */
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GROQ_API_KEY is not configured. Get a free key at https://console.groq.com and add GROQ_API_KEY to .env.local, then restart the dev server.",
    );
  }
  return key;
}

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string | GroqContentPart[];
};

export type GroqContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function groqChatCompletion(
  messages: GroqMessage[],
  options?: { vision?: boolean },
): Promise<string> {
  const apiKey = getGroqApiKey();
  const isVision = options?.vision ?? false;
  const model = isVision ? VISION_MODEL : TEXT_MODEL;

  // Vision models don't support response_format: json_object
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: 4096,
  };

  if (!isVision) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errBody.slice(0, 500)}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Empty response from Groq");
  }
  return text;
}
