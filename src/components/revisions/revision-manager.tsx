"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarClock, Check, CheckCircle2, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RevisionItem, RevisionListResponse } from "@/types/revision";

async function readApiError(r: Response): Promise<string> {
  try { const b = await r.json(); return typeof b.error === "string" ? b.error : "Request failed"; }
  catch { return "Request failed"; }
}

function formatDueDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function revisionTitle(item: RevisionItem) {
  const topic = item.topicName ?? item.topicId.slice(0, 8);
  return item.subjectName ? `${topic} · ${item.subjectName}` : topic;
}

function RevisionListBlock({ title, items, actingId, onComplete, onSkip, empty }: {
  title: string; items: RevisionItem[]; actingId: string | null;
  onComplete: (id: string) => void; onSkip: (id: string) => void; empty: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const busy = actingId === item.revisionId;
        const missed = item.displayStatus === "missed";
        return (
          <li key={item.revisionId} className={cn(
            "flex flex-wrap items-center gap-3 rounded-xl border p-3.5 transition-colors",
            missed ? "border-destructive/20 bg-destructive/5" : "border-border/60 bg-white/2 hover:bg-white/4",
          )}>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">{revisionTitle(item)}</p>
              <p className="text-xs text-muted-foreground">
                Revision {item.revisionNumber} · Due {formatDueDate(item.dueDate)}
              </p>
              <div className="flex gap-1.5">
                <Badge
                  variant={missed ? "destructive" : "secondary"}
                  className={cn("text-xs", missed ? "bg-destructive/15 text-destructive" : "")}
                >
                  {missed ? "Missed" : item.displayStatus}
                </Badge>
                <Badge variant="outline" className="text-xs">R{item.revisionNumber}</Badge>
              </div>
            </div>
            {item.displayStatus !== "completed" && (
              <div className="flex shrink-0 gap-1.5">
                <Button type="button" size="sm" disabled={busy} onClick={() => onComplete(item.revisionId)}
                  className="h-8 gap-1 text-xs">
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Done
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onSkip(item.revisionId)}
                  className="h-8 gap-1 text-xs">
                  <X className="size-3.5" />
                  Skip
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function RevisionManager() {
  const [buckets, setBuckets] = useState<RevisionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/revisions");
    if (!r.ok) throw new Error(await readApiError(r));
    const b = await r.json();
    return b.data as RevisionListResponse;
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().then((d) => { if (!cancelled) setBuckets(d); })
      .catch((e) => { if (!cancelled) setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to load" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [load]);

  async function updateStatus(revisionId: string, status: "completed" | "skipped") {
    setActingId(revisionId); setMessage(null);
    try {
      const r = await fetch(`/api/revisions/${revisionId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!r.ok) throw new Error(await readApiError(r));
      setBuckets(await load());
      setMessage({ type: "success", text: status === "completed" ? "Revision completed" : "Revision skipped" });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Update failed" });
    } finally { setActingId(null); }
  }

  async function handleGenerate() {
    setGenerating(true); setMessage(null);
    try {
      const r = await fetch("/api/revisions/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!r.ok) throw new Error(await readApiError(r));
      const b = await r.json();
      setBuckets(await load());
      setMessage({ type: "success", text: b.data.message ?? "Revisions generated" });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Generate failed" });
    } finally { setGenerating(false); }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="skeleton mb-2 h-5 w-5 rounded-lg mx-auto" />
              <div className="skeleton mx-auto mb-1 h-7 w-8 rounded-lg" />
              <div className="skeleton mx-auto h-3 w-16 rounded" />
            </div>
          ))}
        </div>
        {/* Skeleton columns */}
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <div className="border-b border-border/60 px-4 py-3.5">
                <div className="skeleton h-4 w-28 rounded" />
              </div>
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const data = buckets ?? { upcoming: [], missed: [], completed: [], total: 0 };

  return (
    <div className="page-enter space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/8 via-card to-card p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/8 blur-2xl" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Spaced repetition system</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed max-w-md">
              Reviews scheduled 1 day, 3 days, 7 days after completing a topic — plus a final review before your exam.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={generating} onClick={handleGenerate} className="shrink-0 gap-1.5">
            {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            Generate from completed tasks
          </Button>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <p role="status" className={cn("rounded-xl border px-4 py-3 text-sm",
          message.type === "success" ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-400" : "border-destructive/25 bg-destructive/8 text-destructive"
        )}>
          {message.text}
        </p>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Upcoming", count: data.upcoming.length, icon: CalendarClock, color: "text-primary" },
          { label: "Missed", count: data.missed.length, icon: AlertCircle, color: "text-destructive" },
          { label: "Completed", count: data.completed.length, icon: CheckCircle2, color: "text-emerald-400" },
        ].map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-card p-4 text-center">
            <Icon className={cn("mx-auto mb-1.5 size-5", color)} />
            <p className="text-2xl font-bold tabular-nums">{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { icon: CalendarClock, iconClass: "text-primary", title: `Upcoming (${data.upcoming.length})`, items: data.upcoming, empty: "No upcoming revisions" },
          { icon: AlertCircle, iconClass: "text-destructive", title: `Missed (${data.missed.length})`, items: data.missed, empty: "No missed revisions" },
          { icon: CheckCircle2, iconClass: "text-emerald-400", title: `Completed (${data.completed.length})`, items: data.completed, empty: "None completed yet" },
        ].map(({ icon: Icon, iconClass, title, items, empty }) => (
          <div key={title} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3.5">
              <Icon className={cn("size-4 shrink-0", iconClass)} />
              <span className="text-sm font-semibold">{title}</span>
            </div>
            <div className="p-4">
              <RevisionListBlock
                title={title}
                items={items}
                actingId={actingId}
                onComplete={(id) => updateStatus(id, "completed")}
                onSkip={(id) => updateStatus(id, "skipped")}
                empty={empty}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

