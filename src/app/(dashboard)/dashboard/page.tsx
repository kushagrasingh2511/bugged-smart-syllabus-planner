import type { Metadata } from "next";
import {
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  Flame,
  LineChart,
  ListTodo,
  RotateCcw,
  Target,
} from "lucide-react";

import { RecoveryPanel } from "@/components/dashboard/recovery-panel";
import { RevisionOverview } from "@/components/dashboard/revision-overview";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import { getProgressSummary } from "@/lib/progress/summary";
import { getRecoveryDashboardData } from "@/lib/recovery/dashboard";
import { getRevisionDashboardBuckets } from "@/lib/revisions/list";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FeatureCard } from "@/components/shared/feature-card";
import { StatCard } from "@/components/shared/stat-card";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  await connectDB();

  const [user, summary, revisions, recovery] = await Promise.all([
    session
      ? User.findOne({ userId: session.userId }).lean()
      : Promise.resolve(null),
    session ? getProgressSummary(session.userId) : null,
    session ? getRevisionDashboardBuckets(session.userId) : null,
    session ? getRecoveryDashboardData(session.userId) : null,
  ]);

  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const metrics = summary?.metrics;
  const hasTasks = (metrics?.totalTasks ?? 0) > 0;

  return (
    <DashboardShell
      title={`Welcome back, ${firstName}`}
      description={
        hasTasks
          ? "Your study progress updates as you complete tasks."
          : "Generate a study plan to start tracking progress."
      }
    >
      <div className="space-y-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Completion"
            value={hasTasks ? `${metrics!.completionPercentage}%` : "0%"}
            hint={
              hasTasks
                ? `${metrics!.completedTasks} of ${metrics!.totalTasks} tasks`
                : "No tasks yet"
            }
            icon={Target}
          />
          <StatCard
            label="Completed"
            value={String(metrics?.completedTasks ?? 0)}
            hint="Tasks marked done"
            icon={CheckCircle2}
          />
          <StatCard
            label="Remaining"
            value={String(metrics?.remainingTasks ?? 0)}
            hint="Still to finish"
            icon={ListTodo}
          />
          <StatCard
            label="Study streak"
            value={`${metrics?.currentStreak ?? 0}d`}
            hint={
              (metrics?.studyDaysCompleted ?? 0) > 0
                ? `${metrics!.studyDaysCompleted} study days total`
                : "Complete a task to start"
            }
            icon={Flame}
          />
        </section>

        <section>
          <UpcomingTasks tasks={summary?.upcomingTasks ?? []} />
        </section>

        {recovery ? <RecoveryPanel initial={recovery} /> : null}

        {revisions ? <RevisionOverview buckets={revisions} /> : null}

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
