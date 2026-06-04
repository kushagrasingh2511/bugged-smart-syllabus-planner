"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecoveryMovedTask, RecoveryScheduleDay } from "@/types/recovery";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MovedTasksTimeline({ movedTasks }: { movedTasks: RecoveryMovedTask[] }) {
  if (movedTasks.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Rescheduled tasks ({movedTasks.length})
      </p>
      <ul className="max-h-60 space-y-2 overflow-y-auto">
        {movedTasks.map((task) => (
          <li key={task.taskId} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-white/3 px-4 py-2.5">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{task.taskTitle}</span>
            <div className="flex shrink-0 items-center gap-1.5 text-xs">
              <span className="rounded-lg bg-destructive/12 px-2 py-0.5 text-destructive line-through">{fmt(task.fromDueDate)}</span>
              <ArrowRight className="size-3 text-muted-foreground" />
              <span className="rounded-lg bg-primary/12 px-2 py-0.5 text-primary">{fmt(task.toDueDate)}</span>
              <span className="text-muted-foreground">~{task.estimatedHours}h</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScheduleBarChart({ schedulePreview }: { schedulePreview: RecoveryScheduleDay[] }) {
  const chartData = schedulePreview.slice(0, 14).map((day) => ({
    date: fmt(day.date),
    "Recovery hours": Math.round(day.totalHours * 10) / 10,
    Tasks: day.tasks.length,
  }));
  if (chartData.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Recovery schedule ({chartData.length} days)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "#1f2937", color: "#f1f5f9", fontSize: "12px" }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="Recovery hours" fill="#818cf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SchedulePreviewList({ schedulePreview }: { schedulePreview: RecoveryScheduleDay[] }) {
  const days = schedulePreview.slice(0, 7);
  if (days.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Day-by-day plan</p>
      <ul className="space-y-2">
        {days.map((day) => (
          <li key={day.date} className="rounded-xl border border-border/60 bg-white/3 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">{fmt(day.date)}</span>
              <span className="text-xs text-muted-foreground">{day.totalHours.toFixed(1)}h · {day.tasks.length} task(s)</span>
            </div>
            <ul className="space-y-1">
              {day.tasks.slice(0, 4).map((task, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                  <span className="truncate">{task.taskTitle}</span>
                  <span className="ml-auto shrink-0 capitalize opacity-60">{task.priority}</span>
                </li>
              ))}
              {day.tasks.length > 4 && <li className="text-xs text-muted-foreground">+{day.tasks.length - 4} more</li>}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RecoveryTimeline({ movedTasks, schedulePreview }: { movedTasks: RecoveryMovedTask[]; schedulePreview: RecoveryScheduleDay[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-4">
        <p className="text-sm font-semibold">Recovery timeline</p>
        <p className="text-xs text-muted-foreground mt-0.5">Original plan vs rescheduled dates and new daily workload.</p>
      </div>
      <div className="space-y-6 p-5">
        <MovedTasksTimeline movedTasks={movedTasks} />
        <ScheduleBarChart schedulePreview={schedulePreview} />
        <SchedulePreviewList schedulePreview={schedulePreview} />
      </div>
    </div>
  );
}
