"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
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
import { cn } from "@/lib/utils";
import type { RevisionItem, RevisionListResponse } from "@/types/revision";

async function readApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : "Request failed";
  } catch {
    return "Request failed";
  }
}

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function revisionTitle(item: RevisionItem): string {
  const topic = item.topicName ?? item.topicId.slice(0, 8);
  return item.subjectName ? `${topic} (${item.subjectName})` : topic;
}

function RevisionListBlock({
  title,
  items,
  actingId,
  onComplete,
  onSkip,
  empty,
}: {
  title: string;
  items: RevisionItem[];
  actingId: string | null;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/80 py-6 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
      {items.map((item) => {
        const busy = actingId === item.revisionId;
        const missed = item.displayStatus === "missed";
        return (
          <li
            key={item.revisionId}
            className="flex flex-wrap items-center gap-2 px-3 py-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">{revisionTitle(item)}</p>
              <p className="text-xs text-muted-foreground">
                Revision {item.revisionNumber} · Due {formatDueDate(item.dueDate)}
              </p>
              <div className="flex gap-1.5">
                <Badge variant={missed ? "destructive" : "secondary"}>
                  {missed ? "Missed" : item.displayStatus}
                </Badge>
                <Badge variant="outline">R{item.revisionNumber}</Badge>
              </div>
            </div>
            {item.displayStatus !== "completed" ? (
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => onComplete(item.revisionId)}
                >
                  {busy ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Check data-icon="inline-start" />
                  )}
                  Done
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onSkip(item.revisionId)}
                >
                  <X data-icon="inline-start" />
                  Skip
                </Button>
              </div>
            ) : null}
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
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/revisions");
    if (!response.ok) throw new Error(await readApiError(response));
    const body = await response.json();
    return body.data as RevisionListResponse;
  }, []);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setBuckets(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage({
            type: "error",
            text: err instanceof Error ? err.message : "Failed to load revisions",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function updateStatus(revisionId: string, status: "completed" | "skipped") {
    setActingId(revisionId);
    setMessage(null);
    try {
      const response = await fetch(`/api/revisions/${revisionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const data = await load();
      setBuckets(data);
      setMessage({
        type: "success",
        text: status === "completed" ? "Revision completed" : "Revision skipped",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setActingId(null);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setMessage(null);
    try {
      const response = await fetch("/api/revisions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const body = await response.json();
      const data = await load();
      setBuckets(data);
      setMessage({
        type: "success",
        text: body.data.message ?? "Revisions generated",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Generate failed",
      });
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading revisions…
      </p>
    );
  }

  const data = buckets ?? {
    upcoming: [],
    missed: [],
    completed: [],
    total: 0,
  };

  return (
    <div className="space-y-4">
      {message ? (
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            message.type === "success"
              ? "border-primary/30 bg-primary/5"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Spaced schedule: 1 day, 3 days, and 7 days after you finish a topic,
          plus a final review before the exam.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={generating}
          onClick={handleGenerate}
        >
          {generating ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          Generate from completed tasks
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-primary" />
              Upcoming ({data.upcoming.length})
            </CardTitle>
            <CardDescription>Due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <RevisionListBlock
              title="Upcoming"
              items={data.upcoming}
              actingId={actingId}
              onComplete={(id) => updateStatus(id, "completed")}
              onSkip={(id) => updateStatus(id, "skipped")}
              empty="No upcoming revisions"
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="size-4 text-destructive" />
              Missed ({data.missed.length})
            </CardTitle>
            <CardDescription>Past due</CardDescription>
          </CardHeader>
          <CardContent>
            <RevisionListBlock
              title="Missed"
              items={data.missed}
              actingId={actingId}
              onComplete={(id) => updateStatus(id, "completed")}
              onSkip={(id) => updateStatus(id, "skipped")}
              empty="No missed revisions"
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-primary" />
              Completed ({data.completed.length})
            </CardTitle>
            <CardDescription>Done sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {data.completed.length === 0 ? (
              <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                No completed revisions yet
              </p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
                {data.completed.map((item) => (
                  <li key={item.revisionId} className="px-3 py-3">
                    <p className="text-sm font-medium">{revisionTitle(item)}</p>
                    <p className="text-xs text-muted-foreground">
                      R{item.revisionNumber} ·{" "}
                      {item.completedAt ?
                        `Done ${formatDueDate(item.completedAt)}`
                      : "Completed"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
