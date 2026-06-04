import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecoveryMissedTask } from "@/types/recovery";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function daysOverdue(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function MissedTasksList({ tasks }: { tasks: RecoveryMissedTask[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
        <p className="text-sm text-emerald-400">No missed tasks — you&apos;re on track!</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/5">
      <div className="flex items-center gap-2.5 border-b border-destructive/20 px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-xl bg-destructive/15">
          <AlertTriangle className="size-4 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-semibold text-destructive">Missed tasks ({tasks.length})</p>
          <p className="text-xs text-destructive/70">These tasks passed their due date without completion.</p>
        </div>
      </div>
      <ul className="divide-y divide-border/40">
        {tasks.map((task) => {
          const overdue = daysOverdue(task.originalDueDate);
          return (
            <li key={task.taskId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Clock className="size-3.5 shrink-0 text-destructive/60" />
                <span className="truncate text-sm font-medium">{task.taskTitle}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">Due {formatDate(task.originalDueDate)}</span>
                <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                  {overdue}d overdue
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
