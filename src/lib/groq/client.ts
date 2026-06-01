const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Text model — generous free tier (30 RPM, 14 400 RPD). */
const TEXT_MODEL = "llama-3.3-70b-versatile";
/** Vision model for image-based extraction. */
const VISION_MODEL = "llama-3.2-90b-vision-preview";

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
  const model = options?.vision ? VISION_MODEL : TEXT_MODEL;

  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API error ${response.status}: ${body.slice(0, 500)}`);
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
