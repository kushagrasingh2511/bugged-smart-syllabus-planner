import type { Metadata } from "next";
import { Flame, LineChart, Target } from "lucide-react";

import { getSession } from "@/lib/auth";
import { getProgressSummary } from "@/lib/progress/summary";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/shared/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Progress",
};

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const session = await getSession();
  const summary = session ? await getProgressSummary(session.userId) : null;
  const metrics = summary?.metrics;
  const hasTasks = (metrics?.totalTasks ?? 0) > 0;

  return (
    <DashboardShell
      title="Progress"
      description="Track syllabus completion, subject-wise progress, and study streaks."
    >
      <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Overall completion"
            value={hasTasks ? `${metrics!.completionPercentage}%` : "0%"}
            hint={`${metrics?.completedTasks ?? 0} completed · ${metrics?.remainingTasks ?? 0} remaining`}
            icon={Target}
          />
          <StatCard
            label="Current streak"
            value={`${metrics?.currentStreak ?? 0} days`}
            hint="Consecutive days with completed tasks"
            icon={Flame}
          />
          <StatCard
            label="Study days"
            value={String(metrics?.studyDaysCompleted ?? 0)}
            hint="Distinct days with at least one completion"
            icon={LineChart}
          />
          <StatCard
            label="Total tasks"
            value={String(metrics?.totalTasks ?? 0)}
            hint="Across all study plans"
            icon={LineChart}
          />
        </section>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Analytics preview</CardTitle>
            <CardDescription>
              Chart-ready data is available from{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                GET /api/progress/summary
              </code>
              . Wire your chart library to the{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                charts
              </code>{" "}
              object.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {hasTasks && summary ? (
              <>
                <p>
                  Last 14 days:{" "}
                  {summary.charts.dailyCompletions
                    .reduce((sum, d) => sum + d.completedCount, 0)}{" "}
                  tasks completed.
                </p>
                {summary.bySubject.length > 0 ? (
                  <ul className="list-inside list-disc space-y-1">
                    {summary.bySubject.slice(0, 5).map((row) => (
                      <li key={row.subjectId}>
                        Subject {row.subjectId.slice(0, 8)}… —{" "}
                        {row.completionPercentage}% ({row.completedTasks}/
                        {row.totalTasks})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No subject-linked tasks yet.</p>
                )}
              </>
            ) : (
              <p>
                Complete tasks from your study planner to populate analytics.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
