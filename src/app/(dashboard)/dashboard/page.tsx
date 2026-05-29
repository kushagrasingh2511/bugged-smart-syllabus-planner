import type { Metadata } from "next";
import {
  BookOpen,
  Bot,
  CalendarDays,
  Flame,
  LineChart,
  ListTodo,
  RotateCcw,
  Target,
} from "lucide-react";

import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FeatureCard } from "@/components/shared/feature-card";
import { StatCard } from "@/components/shared/stat-card";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();
  await connectDB();
  const user = session
    ? await User.findOne({ userId: session.userId }).lean()
    : null;

  const firstName = user?.name?.split(" ")[0] ?? "Student";

  return (
    <DashboardShell
      title={`Welcome back, ${firstName}`}
      description="Jump into a module below. Your stats will populate as features roll out."
    >
      <div className="space-y-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tasks today"
            value="—"
            hint="Available after planner launch"
            icon={ListTodo}
          />
          <StatCard
            label="Completion"
            value="—"
            hint="Track progress in Phase 4"
            icon={Target}
          />
          <StatCard
            label="Study streak"
            value="—"
            hint="Build consistency over time"
            icon={Flame}
          />
          <StatCard
            label="Subjects"
            value="—"
            hint="Add syllabus in Phase 2"
            icon={BookOpen}
          />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Modules
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore each area of your academic workspace.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              href={ROUTES.syllabus}
              icon={BookOpen}
              title="Syllabus"
              description="Upload documents and manage subjects and topics."
              accentIndex={0}
            />
            <FeatureCard
              href={ROUTES.planner}
              icon={CalendarDays}
              title="Study planner"
              description="Set exam dates and generate personalized schedules."
              accentIndex={1}
            />
            <FeatureCard
              href={ROUTES.progress}
              icon={LineChart}
              title="Progress"
              description="Track completion, streaks, and analytics."
              accentIndex={2}
            />
            <FeatureCard
              href={ROUTES.revisions}
              icon={RotateCcw}
              title="Revisions"
              description="Spaced repetition and revision timelines."
              accentIndex={3}
            />
            <FeatureCard
              href={ROUTES.assistant}
              icon={Bot}
              title="AI assistant"
              description="Chat for study guidance and recovery plans."
              accentIndex={4}
            />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
