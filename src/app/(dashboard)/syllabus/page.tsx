import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata: Metadata = {
  title: "Syllabus",
};

export default function SyllabusPage() {
  return (
    <DashboardShell
      title="Syllabus"
      description="Upload PDFs, images, or enter syllabus manually. AI extraction comes next."
    >
      <PlaceholderPanel
        icon={BookOpen}
        phase={2}
        title="Syllabus module"
        description="Phase 2 will add file upload, manual entry, and Gemini-powered topic extraction."
        steps={[
          "Upload PDF or image syllabus",
          "AI extracts subjects and topics",
          "Review and edit your structure",
        ]}
      />
    </DashboardShell>
  );
}
