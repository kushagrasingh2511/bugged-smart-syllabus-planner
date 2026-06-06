import type { Metadata } from "next";
import { BookOpen, CheckCircle2, Flame, ListTodo, Target } from "lucide-react";

import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getProgressSummary } from "@/lib/progress/summary";
import { getRevisionDashboardBuckets } from "@/lib/revisions/list";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/shared/stat-card";
import { CompletionDonut } from "@/components/progress/completion-donut";
import { CompletionGauge } from "@/components/progress/completion-gauge";
import { DailyCompletionsChart } from "@/components/progress/daily-completions-chart";
import { RevisionCompletionChart } from "@/components/progress/revision-completion-chart";
import { SubjectProgressChart } from "@/components/progress/subject-progress-chart";

export const metadata: Metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const session = await getSession();
  await connectDB();

  const [summary, revisions] = await Promise.all([
    session ? getProgressSummary(session.userId) : null,
    session ? getRevisionDashboardBuckets(session.userId) : null,
  ]);

  const metrics = summary?.metrics;
  const hasTasks = (metrics?.totalTasks ?? 0) > 0;

  return (
    <DashboardShell
      title="Progress"
      description="Track syllabus completion, subject-wise progress, and study streaks."
    >
      <div className="page-enter space-y-6">
        {/* KPI cards */}
        <section className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Overall completion"
            value={hasTasks ? `${metrics!.completionPercentage}%` : "0%"}
            hint={`${metrics?.completedTasks ?? 0} completed · ${metrics?.remainingTasks ?? 0} remaining`}
            icon={<Target className="size-5" strokeWidth={2} />}
          />
          <StatCard
            label="Completed tasks"
            value={String(metrics?.completedTasks ?? 0)}
            hint="Tasks marked as done"
            icon={<CheckCircle2 className="size-5" strokeWidth={2} />}
            accent="emerald"
          />
          <StatCard
            label="Study streak"
            value={`${metrics?.currentStreak ?? 0}d`}
            hint="Consecutive days with completions"
            icon={<Flame className="size-5" strokeWidth={2} />}
            accent="amber"
          />
          <StatCard
            label="Remaining"
            value={String(metrics?.remainingTasks ?? 0)}
            hint={hasTasks ? `${metrics!.remainingTasks} tasks left` : "No tasks yet"}
            icon={<ListTodo className="size-5" strokeWidth={2} />}
            accent="rose"
          />
        </section>

        {/* Gauge + donut */}
        <section className="grid gap-4 sm:grid-cols-2">
          <CompletionGauge
            percentage={metrics?.completionPercentage ?? 0}
            completedTasks={metrics?.completedTasks ?? 0}
            totalTasks={metrics?.totalTasks ?? 0}
          />
          <CompletionDonut
            labels={summary?.charts.completionByStatus.labels ?? []}
            data={summary?.charts.completionByStatus.datasets[0]?.data ?? []}
          />
        </section>

        {/* Daily activity */}
        <DailyCompletionsChart dailyCompletions={summary?.charts.dailyCompletions ?? []} />

        {/* Subject + revision */}
        <section className="grid gap-4 lg:grid-cols-2">
          <SubjectProgressChart bySubject={summary?.bySubject ?? []} />
          <RevisionCompletionChart
            revisions={revisions ?? { upcoming: [], missed: [], completed: [], total: 0 }}
          />
        </section>

        {/* Subject detail table */}
        {(summary?.bySubject.length ?? 0) > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
              <BookOpen className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Subject breakdown</h2>
            </div>
            <ul className="divide-y divide-border/40">
              {summary!.bySubject.map((s) => (
                <li key={s.subjectId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.subjectName}</span>
                  <div className="flex items-center gap-3">
                    <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-white/8 sm:block">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-1000"
                        style={{ width: `${s.completionPercentage}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-xs text-muted-foreground">
                      {s.completedTasks}/{s.totalTasks} tasks
                    </span>
                    <span className="w-10 text-right text-sm font-bold tabular-nums text-primary">
                      {s.completionPercentage}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
