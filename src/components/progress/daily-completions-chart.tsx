"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyCompletionPoint } from "@/types/progress";

type Props = { dailyCompletions: DailyCompletionPoint[] };

function fmt(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DailyCompletionsChart({ dailyCompletions }: Props) {
  const chartData = dailyCompletions.map((p) => ({ date: fmt(p.date), Tasks: p.completedCount }));
  const hasData = chartData.some((d) => d.Tasks > 0);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="mb-1 text-sm font-semibold">Tasks completed over time</div>
      <div className="text-xs text-muted-foreground mb-4">Daily completions — last 14 days</div>
      {!hasData ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          Complete tasks to see your activity
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "#1f2937", color: "#f1f5f9", fontSize: "12px" }}
              formatter={(v: number) => [v, "tasks completed"]}
            />
            <Area type="monotone" dataKey="Tasks" stroke="#818cf8" strokeWidth={2.5} fill="url(#grad)" dot={false} activeDot={{ r: 5, fill: "#818cf8" }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
