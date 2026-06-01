import type { Metadata } from "next";

import { StudyPlanner } from "@/components/planner/study-planner";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: "Study Planner",
};

export default function PlannerPage() {
  return (
    <DashboardShell
      title="Study planner"
      description="Configure exam dates, daily hours, and weak subjects to generate plans."
    >
      <StudyPlanner />
    </DashboardShell>
  );
}
