import type { Metadata } from "next";
import { Bot } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default function AssistantPage() {
  return (
    <DashboardShell
      title="AI study assistant"
      description="Ask study questions, get daily suggestions, and emergency recovery plans."
    >
      <PlaceholderPanel
        icon={Bot}
        phase={6}
        title="Assistant module"
        description="Phase 6 will integrate Google Gemini for conversational academic help."
        steps={[
          "Ask study-related questions",
          "Get daily task suggestions",
          "Generate emergency recovery plans",
        ]}
      />
    </DashboardShell>
  );
}
