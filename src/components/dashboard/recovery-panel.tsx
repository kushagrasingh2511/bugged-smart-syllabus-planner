"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RecoveryDashboardData, RecoverySummary } from "@/types/recovery";

async function readApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : "Request failed";
  } catch {
    return "Request failed";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function SchedulePreview({ recovery }: { recovery: RecoverySummary }) {
  const days = recovery.schedulePreview.slice(0, 5);
  if (days.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Regenerated schedule preview
      </p>
      <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border/60 p-2">
        {days.map((day) => (
          <li key={day.date} className="text-sm">
            <p className="font-medium text-foreground">
              {formatDate(day.date)}{" "}
              <span className="font-normal text-muted-foreground">
                · {day.totalHours.toFixed(1)}h
              </span>
            </p>
            <ul className="mt-1 space-y-0.5 pl-2 text-xs text-muted-foreground">
              {day.tasks.slice(0, 3).map((t, i) => (
                <li key={`${day.date}-${i}`} className="truncate">
                  {t.taskTitle}
                </li>
              ))}
              {day.tasks.length > 3 ? (
                <li>+{day.tasks.length - 3} more</li>
              ) : null}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RecoveryPanel({
  initial,
}: {
  initial: RecoveryDashboardData;
}) {
  const [data, setData] = useState(initial);
  const [recovery, setRecovery] = useState<RecoverySummary | null>(
    initial.latestRecovery,
  );
  const [selectedPlanId, setSelectedPlanId] = useState(
    initial.plansWithOverdue[0]?.planId ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function runGenerate(apply: boolean) {
    if (!selectedPlanId) {
      setMessage({ type: "error", text: "Select a study plan first" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/recovery/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId, apply }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const body = await response.json();
      setRecovery(body.data.recovery as RecoverySummary);

      const refresh = await fetch("/api/recovery");
      if (refresh.ok) {
        const refreshed = await refresh.json();
        setData(refreshed.data as RecoveryDashboardData);
      }

      setMessage({
        type: "success",
        text: body.data.message ?? "Recovery plan ready",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Recovery failed",
      });
    } finally {
      setLoading(false);
    }
  }

  if (data.overdueCount === 0 && !recovery) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Smart recovery
      </h2>

      {data.overdueCount > 0 ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="size-4" />
              Missed tasks alert
            </CardTitle>
            <CardDescription>
              {data.overdueCount} overdue task(s) — due date passed and not
              completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-card/80">
              {data.overdueTasks.map((t) => (
                <li
                  key={t.taskId}
                  className="flex justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="truncate font-medium">{t.taskTitle}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(t.originalDueDate)}
                  </span>
                </li>
              ))}
            </ul>

            {data.plansWithOverdue.length > 0 ? (
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[180px] flex-1 space-y-1">
                  <label
                    htmlFor="recovery-plan"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Study plan
                  </label>
                  <select
                    id="recovery-plan"
                    className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                  >
                    {data.plansWithOverdue.map((p) => (
                      <option key={p.planId} value={p.planId}>
                        {p.title} ({p.overdueCount} overdue)
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => runGenerate(false)}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Sparkles data-icon="inline-start" />
                  )}
                  Preview recovery
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={loading}
                  onClick={() => runGenerate(true)}
                >
                  Apply schedule
                </Button>
              </div>
            ) : null}

            <Link
              href={ROUTES.planner}
              className="inline-block text-xs font-medium text-primary hover:underline"
            >
              Open study planner
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {message ? (
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            message.type === "success"
              ? "border-primary/30 bg-primary/5"
              : "border-destructive/30 text-destructive",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      {recovery ? (
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" />
              Recovery suggestions
            </CardTitle>
            <CardDescription>
              {recovery.planTitle} · {recovery.missedTaskCount} topic(s) ·{" "}
              {recovery.remainingStudyDays} day(s) left
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Extra hours needed</p>
                <p className="text-lg font-semibold tabular-nums">
                  {recovery.extraHoursNeeded}h
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Suggested daily</p>
                <p className="text-lg font-semibold tabular-nums">
                  {recovery.recommendedDailyHours}h
                </p>
                <p className="text-xs text-muted-foreground">
                  was {recovery.currentDailyHours}h
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Est. completion</p>
                <p className="text-sm font-semibold">
                  {recovery.estimatedCompletionDate ?
                    formatDate(recovery.estimatedCompletionDate)
                  : "—"}
                </p>
              </div>
            </div>

            <ul className="space-y-2">
              {recovery.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm"
                >
                  <Badge
                    variant={
                      rec.severity === "critical" ? "destructive" : "secondary"
                    }
                  >
                    {rec.type}
                  </Badge>
                  <span className="text-muted-foreground">{rec.message}</span>
                </li>
              ))}
            </ul>

            {recovery.movedTasks.length > 0 ? (
              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  Topics moved ({recovery.movedTasks.length})
                </p>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {recovery.movedTasks.slice(0, 6).map((m) => (
                    <li key={m.taskId} className="truncate">
                      {m.taskTitle}: {formatDate(m.fromDueDate)} →{" "}
                      {formatDate(m.toDueDate)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <SchedulePreview recovery={recovery} />

            {recovery.status === "generated" ? (
              <p className="text-xs text-muted-foreground">
                Preview only — click Apply schedule to update task due dates in
                your planner.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
