import { AlertTriangle, CalendarCheck, Clock, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { RecoverySummary } from "@/types/recovery";

function formatDate(iso: string | null): string {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function RecoveryKpiCards({ recovery }: { recovery: RecoverySummary }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Missed tasks" value={String(recovery.missedTaskCount)} hint="Tasks past due date" icon={<AlertTriangle className="size-5" strokeWidth={2} />} accent="rose" />
      <StatCard label="Days remaining" value={String(recovery.remainingStudyDays)} hint="Until exam date" icon={<CalendarCheck className="size-5" strokeWidth={2} />} accent="amber" />
      <StatCard label="Extra hours needed" value={`${recovery.extraHoursNeeded}h`} hint={`Suggested: ${recovery.recommendedDailyHours}h/day (was ${recovery.currentDailyHours}h)`} icon={<Clock className="size-5" strokeWidth={2} />} />
      <StatCard label="Est. completion" value={formatDate(recovery.estimatedCompletionDate)} hint={recovery.status === "applied" ? "Plan applied ✓" : "Preview only"} icon={<TrendingUp className="size-5" strokeWidth={2} />} accent="emerald" />
    </section>
  );
}
