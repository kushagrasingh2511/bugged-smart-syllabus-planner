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
  ShieldAlert,
} from "lucide-react";

import { AiSuggestionCard } from "@/components/dashboard/ai-suggestion-card";
import { OverdueAlertBanner } from "@/components/dashboard/overdue-alert-banner";
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
import StudyPlan from "@/models/StudyPlan";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function getReadinessScore(completionPct: number, streak: number, missedCount: number): number {
  const base = completionPct * 0.6;
  const streakBonus = Math.min(streak * 2, 20);
  const missedPenalty = Math.min(missedCount * 3, 20);
  return Math.max(0, Math.min(100, Math.round(base + streakBonus - missedPenalty)));
}

function getReadinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Exam Ready", color: "text-emerald-400" };
  if (score >= 60) return { label: "On Track", color: "text-primary" };
  if (score >= 40) return { label: "Needs Focus", color: "text-amber-400" };
  return { label: "Behind Schedule", color: "text-destructive" };
}

function getDaysUntilExam(examDate: Date | null | undefined): number | null {
  if (!examDate) return null;
  const diff = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export default async function DashboardPage() {
  const session = await getSession();
  await connectDB();

  const [user, summary, revisions, recovery, activePlan] = await Promise.all([
    session ? User.findOne({ userId: session.userId }).lean() : null,
    session ? getProgressSummary(session.userId) : null,
    session ? getRevisionDashboardBuckets(session.userId) : null,
    session ? getRecoveryDashboardData(session.userId) : null,
    session ? StudyPlan.findOne({ userId: session.userId, status: "active" }).lean() : null,
  ]);

  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const metrics = summary?.metrics;
  const hasTasks = (metrics?.totalTasks ?? 0) > 0;
  const readinessScore = getReadinessScore(
    metrics?.completionPercentage ?? 0,
    metrics?.currentStreak ?? 0,
    recovery?.overdueCount ?? 0,
  );
  const { label: readinessLabel, color: readinessColor } = getReadinessLabel(readinessScore);
  const daysUntilExam = getDaysUntilExam(activePlan?.examDate);

  return (
    <DashboardShell
      title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${firstName}`}
      description={hasTasks ? "Here's your academic overview." : "Generate a study plan to start tracking progress."}
    >
      <div className="page-enter space-y-6">
        {/* Overdue alert */}
        {(recovery?.overdueCount ?? 0) > 0 && (
          <OverdueAlertBanner overdueCount={recovery!.overdueCount} />
        )}

        {/* Top KPI strip */}
        <section className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Readiness Score — hero card (dominant element) */}
          <div className="relative overflow-hidden rounded-hero border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" aria-hidden />
            <div className="relative">
              <p className="text-overline text-muted-foreground">Readiness Score</p>
              <p className={`mt-1.5 stat-dominant tabular-nums ${readinessColor}`}>{readinessScore}</p>
              <p className={`text-caption font-medium ${readinessColor}`}>{readinessLabel}</p>
              {/* Mini progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
            </div>
          </div>

          <StatCard
            label="Completion"
            value={hasTasks ? `${metrics!.completionPercentage}%` : "0%"}
            hint={hasTasks ? `${metrics!.completedTasks} of ${metrics!.totalTasks} tasks` : "No tasks yet"}
            icon={<Target className="size-5" strokeWidth={2} />}
          />
          <StatCard
            label="Study streak"
            value={`${metrics?.currentStreak ?? 0}d`}
            hint={(metrics?.studyDaysCompleted ?? 0) > 0 ? `${metrics!.studyDaysCompleted} days studied` : "Complete a task to start"}
            icon={<Flame className="size-5" strokeWidth={2} />}
            accent="amber"
          />
          {daysUntilExam !== null ? (
            <div className="relative overflow-hidden rounded-card border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="text-overline text-muted-foreground">Exam Countdown</p>
              <p className="mt-1.5 stat-dominant tabular-nums text-amber-400">{daysUntilExam}</p>
              <p className="text-caption text-muted-foreground">days remaining</p>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-amber-400/60" style={{ width: "100%" }} />
              </div>
            </div>
          ) : (
            <StatCard
              label="Remaining"
              value={String(metrics?.remainingTasks ?? 0)}
              hint="Tasks still to finish"
              icon={<ListTodo className="size-5" strokeWidth={2} />}
              accent="rose"
            />
          )}
        </section>

        {/* Second row: stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Completed tasks"
            value={String(metrics?.completedTasks ?? 0)}
            hint="Tasks marked done"
            icon={<CheckCircle2 className="size-5" strokeWidth={2} />}
            accent="emerald"
          />
          <StatCard
            label="Total tasks"
            value={String(metrics?.totalTasks ?? 0)}
            hint="Across all study plans"
            icon={<Target className="size-5" strokeWidth={2} />}
          />
          <StatCard
            label="Pending"
            value={String(metrics?.remainingTasks ?? 0)}
            hint="Still to complete"
            icon={<ListTodo className="size-5" strokeWidth={2} />}
            accent="amber"
          />
        </section>

        {/* Upcoming tasks */}
        <section>
          <UpcomingTasks tasks={summary?.upcomingTasks ?? []} />
        </section>

        {/* Revisions overview */}
        {revisions && <RevisionOverview buckets={revisions} />}

        {/* AI suggestion */}
        <AiSuggestionCard />

        {/* Module cards */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-overline text-muted-foreground">
              Modules
            </h2>
          </div>
          <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard href={ROUTES.syllabus} icon={BookOpen} title="Syllabus" description="Upload and manage subjects and topics." accentIndex={0} />
            <FeatureCard href={ROUTES.planner} icon={CalendarDays} title="Study Planner" description="Set exam dates and generate schedules." accentIndex={1} />
            <FeatureCard href={ROUTES.progress} icon={LineChart} title="Progress" description="Track completion and analytics." accentIndex={2} />
            <FeatureCard href={ROUTES.revisions} icon={RotateCcw} title="Revisions" description="Spaced repetition system." accentIndex={3} />
            <FeatureCard href={ROUTES.recovery} icon={ShieldAlert} title="Recovery Center" description="Recover missed tasks intelligently." accentIndex={4} />
            <FeatureCard href={ROUTES.assistant} icon={Bot} title="AI Assistant" description="Chat for study guidance and plans." accentIndex={0} />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
