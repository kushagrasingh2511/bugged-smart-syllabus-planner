import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata: Metadata = {
  title: "Study Planner",
};

export default function PlannerPage() {
  return (
    <DashboardShell
      title="Study planner"
      description="Configure exam dates, daily hours, and weak subjects to generate plans."
    >
      <PlaceholderPanel
        icon={CalendarDays}
        phase={3}
        title="Planner module"
        description="Phase 3 will generate daily tasks, weekly plans, and priority scheduling."
        steps={[
          "Set exam dates and daily study hours",
          "Mark weak subjects for extra focus",
          "Get AI-generated daily and weekly tasks",
        ]}
      />
    </DashboardShell>
  );
}
