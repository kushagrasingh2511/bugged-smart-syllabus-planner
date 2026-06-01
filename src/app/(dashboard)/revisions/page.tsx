import type { Metadata } from "next";

import { RevisionManager } from "@/components/revisions/revision-manager";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: "Revisions",
};

export default function RevisionsPage() {
  return (
    <DashboardShell
      title="Revisions"
      description="Automatic revision scheduling with spaced repetition reminders."
    >
      <RevisionManager />
    </DashboardShell>
  );
}
