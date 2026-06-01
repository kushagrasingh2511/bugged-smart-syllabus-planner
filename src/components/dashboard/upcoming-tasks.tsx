import Link from "next/link";
import { CalendarClock, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import type { TaskSummaryItem } from "@/types/progress";

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const priorityVariant: Record<string, "default" | "secondary" | "destructive"> =
  {
    high: "destructive",
    medium: "default",
    low: "secondary",
  };

export function UpcomingTasks({
  tasks,
}: {
  tasks: TaskSummaryItem[];
}) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-primary" />
          Upcoming tasks
        </CardTitle>
        <CardDescription>
          Next items on your study plan. Mark complete from the planner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/80 py-10 text-center">
            <CheckCircle2 className="size-8 text-muted-foreground/60" />
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Generate a study plan to schedule tasks, or complete pending work.
            </p>
            <Link
              href={ROUTES.planner}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Open study planner
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {tasks.map((task) => (
              <li
                key={task.taskId}
                className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-medium leading-snug">
                    {task.taskTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDueDate(task.dueDate)}
                  </p>
                </div>
                <Badge variant={priorityVariant[task.priority] ?? "secondary"}>
                  {task.priority}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
