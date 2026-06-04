"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RecoveryDashboardData, RecoverySummary } from "@/types/recovery";

async function readApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : "Request failed";
  } catch { return "Request failed"; }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

export function RecoveryPanel({ initial }: { initial: RecoveryDashboardData }) {
  const [data, setData] = useState(initial);
  const [recovery, setRecovery] = useState<RecoverySummary | null>(initial.latestRecovery);
  const [selectedPlanId, setSelectedPlanId] = useState(initial.plansWithOverdue[0]?.planId ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function runGenerate(apply: boolean) {
    if (!selectedPlanId) { setMessage({ type: "error", text: "Select a study plan first" }); return; }
    setLoading(true); setMessage(null);
    try {
      const res = await fetch("/api/recovery/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId, apply }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const body = await res.json();
      setRecovery(body.data.recovery as RecoverySummary);
      const refresh = await fetch("/api/recovery");
      if (refresh.ok) setData((await refresh.json()).data as RecoveryDashboardData);
      setMessage({ type: "success", text: body.data.message ?? "Recovery plan ready" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Recovery failed" });
    } finally { setLoading(false); }
  }

  if (data.overdueCount === 0 && !recovery) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Smart recovery</h2>
        <Link href={ROUTES.recovery} className="text-xs text-primary hover:underline">
          Recovery Center →
        </Link>
      </div>

      {/* Missed tasks alert */}
      {data.overdueCount > 0 && (
        <div className="overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/5">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-destructive/15">
            <div className="flex size-7 items-center justify-center rounded-xl bg-destructive/15">
              <AlertTriangle className="size-3.5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive">
                {data.overdueCount} missed task{data.overdueCount > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-destructive/70">Due date passed without completion.</p>
            </div>
            <Link
              href={ROUTES.recovery}
              className="shrink-0 rounded-xl bg-destructive/15 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/25"
            >
              View all
            </Link>
          </div>

          <ul className="divide-y divide-border/30">
            {data.overdueTasks.slice(0, 5).map((t) => (
              <li key={t.taskId} className="flex justify-between gap-2 px-5 py-2.5">
                <span className="truncate text-sm font-medium">{t.taskTitle}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(t.originalDueDate)}</span>
              </li>
            ))}
          </ul>

          {data.plansWithOverdue.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-destructive/15">
              {data.plansWithOverdue.length > 1 && (
                <select
                  id="recovery-plan"
                  className="h-8 flex-1 min-w-[160px] rounded-xl border border-input bg-background px-2 text-xs outline-none focus:border-primary/40"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  {data.plansWithOverdue.map((p) => (
                    <option key={p.planId} value={p.planId}>{p.title} ({p.overdueCount})</option>
                  ))}
                </select>
              )}
              <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => runGenerate(false)}
                className="h-8 gap-1 text-xs">
                {loading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                Preview
              </Button>
              <Button type="button" size="sm" disabled={loading} onClick={() => runGenerate(true)}
                className="h-8 gap-1 text-xs">
                Apply schedule
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Message */}
      {message && (
        <p role="status" className={cn("rounded-xl border px-3.5 py-2.5 text-sm",
          message.type === "success" ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-400" : "border-destructive/25 bg-destructive/8 text-destructive"
        )}>
          {message.text}
        </p>
      )}

      {/* Recovery summary */}
      {recovery && (
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">{recovery.planTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {recovery.missedTaskCount} topic(s) · {recovery.remainingStudyDays} day(s) left
                </p>
              </div>
            </div>
            <Badge className={cn("text-xs", recovery.status === "applied" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "")}>
              {recovery.status === "applied" ? "✓ Applied" : "Preview"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-px bg-border/40 border-b border-border/40">
            {[
              { label: "Extra hours", value: `${recovery.extraHoursNeeded}h` },
              { label: "Suggested daily", value: `${recovery.recommendedDailyHours}h` },
              { label: "Est. completion", value: recovery.estimatedCompletionDate ? formatDate(recovery.estimatedCompletionDate) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          {recovery.recommendations.length > 0 && (
            <ul className="divide-y divide-border/30 px-5 py-2">
              {recovery.recommendations.slice(0, 2).map((rec, i) => (
                <li key={i} className="flex items-start gap-2 py-2">
                  <Badge variant={rec.severity === "critical" ? "destructive" : "secondary"} className="mt-0.5 shrink-0 text-xs">
                    {rec.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground leading-relaxed">{rec.message}</span>
                </li>
              ))}
            </ul>
          )}

          {recovery.movedTasks.length > 0 && (
            <div className="border-t border-border/40 px-5 py-3">
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <CalendarClock className="size-3.5" />
                Rescheduled ({recovery.movedTasks.length})
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {recovery.movedTasks.slice(0, 4).map((m) => (
                  <li key={m.taskId} className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{m.taskTitle}</span>
                    <span className="shrink-0 text-destructive/60 line-through">{formatDate(m.fromDueDate)}</span>
                    <ArrowRight className="size-3 shrink-0" />
                    <span className="shrink-0 text-primary">{formatDate(m.toDueDate)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-border/40 px-5 py-3">
            <Link href={ROUTES.recovery} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              Open Recovery Center <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
