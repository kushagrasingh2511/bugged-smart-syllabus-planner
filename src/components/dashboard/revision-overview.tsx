import Link from "next/link";
import { AlertCircle, CalendarClock, CheckCircle2, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import type { RevisionItem, RevisionListResponse } from "@/types/revision";

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function revisionLabel(item: RevisionItem): string {
  const topic = item.topicName ?? `Topic ${item.topicId.slice(0, 8)}…`;
  const subject = item.subjectName ? ` · ${item.subjectName}` : "";
  return `${topic}${subject}`;
}

function RevisionRow({ item }: { item: RevisionItem }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium leading-snug">
          {revisionLabel(item)}
        </p>
        <p className="text-xs text-muted-foreground">
          Revision {item.revisionNumber} · Due {formatDueDate(item.dueDate)}
        </p>
      </div>
      <Badge
        variant={
          item.displayStatus === "missed" ? "destructive" : "secondary"
        }
      >
        {item.displayStatus === "missed" ? "Missed" : `R${item.revisionNumber}`}
      </Badge>
    </li>
  );
}

function RevisionSection({
  title,
  description,
  icon: Icon,
  items,
  emptyText,
  variant,
}: {
  title: string;
  description: string;
  icon: typeof CalendarClock;
  items: RevisionItem[];
  emptyText: string;
  variant: "upcoming" | "missed" | "completed";
}) {
  const iconClass =
    variant === "missed" ? "text-destructive"
    : variant === "completed" ? "text-primary"
    : "text-primary";

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`size-4 ${iconClass}`} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((item) => (
              <RevisionRow key={item.revisionId} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function RevisionOverview({ buckets }: { buckets: RevisionListResponse }) {
  const hasAny =
    buckets.upcoming.length > 0 ||
    buckets.missed.length > 0 ||
    buckets.completed.length > 0;

  if (!hasAny) {
    return (
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="size-4 text-primary" />
            Revisions
          </CardTitle>
          <CardDescription>
            Complete study tasks to auto-schedule spaced revisions (+1, +3, +7
            days, then before your exam).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No revisions yet.{" "}
            <Link href={ROUTES.planner} className="text-primary hover:underline">
              Mark a planner task done
            </Link>{" "}
            or{" "}
            <Link
              href={ROUTES.revisions}
              className="text-primary hover:underline"
            >
              generate revisions
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Revisions
        </h2>
        <Link
          href={ROUTES.revisions}
          className="text-xs font-medium text-primary hover:underline"
        >
          View all ({buckets.total})
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <RevisionSection
          title="Upcoming"
          description="Scheduled revision sessions"
          icon={CalendarClock}
          items={buckets.upcoming}
          emptyText="Nothing scheduled ahead"
          variant="upcoming"
        />
        <RevisionSection
          title="Missed"
          description="Overdue — catch up when you can"
          icon={AlertCircle}
          items={buckets.missed}
          emptyText="No missed revisions"
          variant="missed"
        />
        <RevisionSection
          title="Completed"
          description="Finished revision sessions"
          icon={CheckCircle2}
          items={buckets.completed}
          emptyText="None completed yet"
          variant="completed"
        />
      </div>
    </div>
  );
}
