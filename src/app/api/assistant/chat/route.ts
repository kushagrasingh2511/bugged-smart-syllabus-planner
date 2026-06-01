import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api";
import { groqChatText } from "@/lib/groq/chat";
import { buildAssistantContext, formatContextForPrompt } from "@/lib/assistant/context";
import { chatRequestSchema } from "@/lib/validations/assistant";
import type { GroqMessage } from "@/lib/groq/client";

const SYSTEM_PROMPT = `You are an intelligent AI study assistant for the Smart Syllabus Planner app. You help students manage their academic workload, stay on track, and prepare effectively for exams.

You have access to the student's real-time academic data (provided in each message as context). Use this data to give specific, actionable, and encouraging advice.

Your capabilities:
- Recommend what to study today based on pending tasks and priorities
- Assess if the student can finish before their exam date
- Identify the weakest subject based on completion percentages
- Generate crash/emergency study plans for students who are behind
- List revision sessions that are due or overdue
- Provide study tips and motivation

Guidelines:
- Be concise, warm, and encouraging
- Always reference the student's actual data when answering
- For crash plans, provide a day-by-day breakdown
- If no study plan exists, suggest creating one first
- Keep responses focused and practical (avoid long generic advice)
- Use bullet points and structure for clarity`;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const body = chatRequestSchema.parse(await request.json());
    await connectDB();

    // Build academic context for this user
    const ctx = await buildAssistantContext(session.userId);
    const contextText = formatContextForPrompt(ctx);

    // Build message history for Groq
    const messages: GroqMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: contextText,
      },
      {
        role: "assistant",
        content:
          "I have your academic data. I'm ready to help you study smarter. What would you like to know?",
      },
      // Inject conversation history (last 10 messages to stay within token limits)
      ...body.history.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      // Current user message
      { role: "user", content: body.message },
    ];

    const reply = await groqChatText(messages);

    return jsonSuccess({ reply });
  } catch (error) {
    // Surface Groq/config errors clearly instead of hiding them as 500
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("GROQ_API_KEY")) {
        return jsonError("AI service not configured. Please set GROQ_API_KEY in your .env.local file.", 503);
      }
      if (msg.includes("Groq API error")) {
        return jsonError(`AI service error: ${msg}`, 502);
      }
    }
    return handleApiError(error);
  }
}
