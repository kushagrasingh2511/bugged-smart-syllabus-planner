import Link from "next/link";
import { AlertCircle, CalendarClock, CheckCircle2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RevisionItem, RevisionListResponse } from "@/types/revision";

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function revisionLabel(item: RevisionItem): string {
  const topic = item.topicName ?? `Topic ${item.topicId.slice(0, 6)}…`;
  return item.subjectName ? `${topic} · ${item.subjectName}` : topic;
}

function RevisionRow({ item }: { item: RevisionItem }) {
  const isMissed = item.displayStatus === "missed";
  return (
    <li className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{revisionLabel(item)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          R{item.revisionNumber} · Due {formatDueDate(item.dueDate)}
        </p>
      </div>
      <Badge
        variant={isMissed ? "destructive" : "secondary"}
        className={cn("shrink-0 text-xs", isMissed && "bg-destructive/15 text-destructive")}
      >
        {isMissed ? "Missed" : `R${item.revisionNumber}`}
      </Badge>
    </li>
  );
}

function RevisionColumn({
  icon: Icon,
  title,
  iconClass,
  items,
  empty,
}: {
  icon: typeof CalendarClock;
  title: string;
  iconClass: string;
  items: RevisionItem[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", iconClass)} />
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border/40">
          {items.slice(0, 4).map((item) => (
            <RevisionRow key={item.revisionId} item={item} />
          ))}
          {items.length > 4 && (
            <li className="pt-2 text-xs text-muted-foreground">+{items.length - 4} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

export function RevisionOverview({ buckets }: { buckets: RevisionListResponse }) {
  const hasAny = buckets.upcoming.length > 0 || buckets.missed.length > 0 || buckets.completed.length > 0;

  if (!hasAny) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
        <RotateCcw className="mx-auto mb-2 size-8 text-muted-foreground/40" />
        <p className="text-sm font-medium">No revisions yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Complete study tasks to auto-schedule spaced revisions.{" "}
          <Link href={ROUTES.planner} className="text-primary hover:underline">Mark a task done</Link>
          {" "}or{" "}
          <Link href={ROUTES.revisions} className="text-primary hover:underline">generate revisions</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Revisions</h2>
        <Link href={ROUTES.revisions} className="text-xs text-primary hover:underline">
          View all ({buckets.total}) →
        </Link>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <RevisionColumn icon={CalendarClock} title="Upcoming" iconClass="text-primary" items={buckets.upcoming} empty="Nothing scheduled ahead" />
        <RevisionColumn icon={AlertCircle} title="Missed" iconClass="text-destructive" items={buckets.missed} empty="No missed revisions" />
        <RevisionColumn icon={CheckCircle2} title="Completed" iconClass="text-emerald-400" items={buckets.completed} empty="None completed yet" />
      </div>
    </div>
  );
}
