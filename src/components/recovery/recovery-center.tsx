"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MissedTasksList } from "@/components/recovery/missed-tasks-list";
import { RecommendationsPanel } from "@/components/recovery/recommendations-panel";
import { RecoveryKpiCards } from "@/components/recovery/recovery-kpi-cards";
import { RecoveryTimeline } from "@/components/recovery/recovery-timeline";
import { cn } from "@/lib/utils";
import type { RecoveryDashboardData, RecoverySummary } from "@/types/recovery";

async function readApiError(res: Response): Promise<string> {
  try { const b = await res.json(); return typeof b.error === "string" ? b.error : "Request failed"; }
  catch { return "Request failed"; }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15">
        <CheckCircle2 className="size-7 text-emerald-400" />
      </div>
      <div>
        <p className="font-semibold text-emerald-400">You&apos;re all caught up!</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          No overdue tasks found. Keep completing your daily tasks to stay on track.
        </p>
      </div>
    </div>
  );
}

export function RecoveryCenter({ initial }: { initial: RecoveryDashboardData }) {
  const [data, setData] = useState(initial);
  const [recovery, setRecovery] = useState<RecoverySummary | null>(initial.latestRecovery);
  const [selectedPlanId, setSelectedPlanId] = useState(initial.plansWithOverdue[0]?.planId ?? "");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const hasOverdue = data.overdueCount > 0;

  async function generate(apply: boolean) {
    if (!selectedPlanId) { setMessage({ type: "error", text: "No study plan with overdue tasks found." }); return; }
    apply ? setApplying(true) : setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/recovery/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId, apply }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const body = await res.json();
      setRecovery(body.data.recovery as RecoverySummary);
      setMessage({ type: "success", text: body.data.message ?? (apply ? "Plan applied!" : "Recovery plan generated") });
      const refresh = await fetch("/api/recovery");
      if (refresh.ok) { const r = await refresh.json(); setData(r.data as RecoveryDashboardData); }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong" });
    } finally { setLoading(false); setApplying(false); }
  }

  return (
    <div className="space-y-6">
      {/* Generate panel */}
      {hasOverdue && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-5 py-4">
            <p className="text-sm font-semibold">Generate recovery plan</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {data.overdueCount} overdue task(s) detected. Preview or apply a rescheduled plan.
            </p>
          </div>
          <div className="space-y-4 p-5">
            {data.plansWithOverdue.length > 1 && (
              <div className="space-y-1.5">
                <label htmlFor="plan-select" className="text-xs font-medium text-muted-foreground">Study plan</label>
                <select
                  id="plan-select"
                  className="h-9 w-full max-w-xs rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  {data.plansWithOverdue.map((p) => (
                    <option key={p.planId} value={p.planId}>{p.title} ({p.overdueCount} overdue)</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={loading || applying} onClick={() => void generate(false)}>
                {loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
                Preview plan
              </Button>
              <Button size="sm" disabled={loading || applying} onClick={() => void generate(true)}>
                {applying ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
                Apply recovery plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <p role="status" className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          message.type === "success" ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-400" : "border-destructive/25 bg-destructive/8 text-destructive"
        )}>
          {message.text}
        </p>
      )}

      {/* Empty state */}
      {!hasOverdue && !recovery && <EmptyState />}

      {/* Missed tasks */}
      {data.overdueTasks.length > 0 && <MissedTasksList tasks={data.overdueTasks} />}

      {/* Recovery details */}
      {recovery && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">{recovery.planTitle}</h2>
              <p className="text-xs text-muted-foreground">
                Generated {new Date(recovery.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <Badge
              variant={recovery.status === "applied" ? "default" : "secondary"}
              className={recovery.status === "applied" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : ""}
            >
              {recovery.status === "applied" ? "✓ Applied" : "Preview"}
            </Badge>
          </div>

          <RecoveryKpiCards recovery={recovery} />
          <RecommendationsPanel recommendations={recovery.recommendations} />
          <RecoveryTimeline movedTasks={recovery.movedTasks} schedulePreview={recovery.schedulePreview} />

          {/* Apply CTA */}
          {recovery.status === "generated" && hasOverdue && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/8 p-5">
              <div>
                <p className="font-semibold">Ready to apply this plan?</p>
                <p className="text-sm text-muted-foreground">This will update task due dates in your study planner.</p>
              </div>
              <Button disabled={loading || applying} onClick={() => void generate(true)} className="gap-1.5">
                {applying ? <Loader2 className="animate-spin" /> : <RefreshCw className="size-4" />}
                Apply recovery plan
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
