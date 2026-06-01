import type { Metadata } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SyllabusManager } from "@/components/syllabus/syllabus-manager";

export const metadata: Metadata = {
  title: "Syllabus",
};

export default function SyllabusPage() {
  return (
    <DashboardShell
      title="Syllabus"
      description="Upload PDFs, images, or paste text. AI extracts subjects and topics automatically."
    >
      <SyllabusManager />
    </DashboardShell>
  );
}
