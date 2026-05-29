import type { Metadata } from "next";
import { LineChart } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata: Metadata = {
  title: "Progress",
};

export default function ProgressPage() {
  return (
    <DashboardShell
      title="Progress"
      description="Track syllabus completion, subject-wise progress, and study streaks."
    >
      <PlaceholderPanel
        icon={LineChart}
        phase={4}
        title="Progress module"
        description="Phase 4 will add task completion, charts, and analytics dashboard."
        steps={[
          "Mark tasks complete as you study",
          "View completion percentage and streaks",
          "Analyze subject-wise performance",
        ]}
      />
    </DashboardShell>
  );
}
