import type { Metadata } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChatWindow } from "@/components/assistant/chat-window";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const initialQuestion = typeof q === "string" ? decodeURIComponent(q) : undefined;

  return (
    <DashboardShell
      title="AI study assistant"
      description="Ask study questions, get daily suggestions, and emergency recovery plans."
    >
      <ChatWindow initialQuestion={initialQuestion} />
    </DashboardShell>
  );
}
