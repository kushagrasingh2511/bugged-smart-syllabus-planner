import { getGroqApiKey, type GroqMessage } from "@/lib/groq/client";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const CHAT_MODEL = "llama-3.3-70b-versatile";

/**
 * Plain-text chat completion — no JSON mode.
 * Used by the AI study assistant (unlike groqChatCompletion which forces JSON output).
 */
export async function groqChatText(messages: GroqMessage[]): Promise<string> {
  const apiKey = getGroqApiKey();

  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
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
