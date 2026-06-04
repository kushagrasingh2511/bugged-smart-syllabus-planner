"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TaskSummaryItem } from "@/types/progress";

function formatDueDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  // Use "en-US" explicitly so server (Vercel) and client produce identical output
  // and avoid React hydration mismatches from locale differences.
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const priorityConfig: Record<string, { variant: "default" | "secondary" | "destructive"; color: string }> = {
  high: { variant: "destructive", color: "bg-rose-500/10 border-rose-500/20 text-rose-400" },
  medium: { variant: "default", color: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
  low: { variant: "secondary", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
};

export function UpcomingTasks({ tasks }: { tasks: TaskSummaryItem[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-primary" />
          <h2 className="font-semibold">Upcoming tasks</h2>
        </div>
        <Link href={ROUTES.planner} className="text-xs text-primary hover:underline">
          View planner →
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <CheckCircle2 className="size-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">All caught up!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a study plan to schedule tasks.
            </p>
          </div>
          <Link href={ROUTES.planner} className="text-sm font-medium text-primary hover:underline">
            Open study planner →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {tasks.map((task, i) => {
            const cfg = priorityConfig[task.priority] ?? priorityConfig.low;
            const dueText = formatDueDate(task.dueDate);
            const isOverdue = dueText.includes("overdue");
            return (
              <li
                key={task.taskId}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/2"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                  <Clock className="size-3.5 text-primary/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.taskTitle}</p>
                  <p className={cn("text-xs", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                    {dueText}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium", cfg.color)}>
                  {task.priority}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
