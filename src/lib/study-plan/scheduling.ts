/** Shared study-plan scheduling utilities (used by plan generation and recovery). */

export type TopicEntry = {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  difficulty: number;
  isWeakSubject: boolean;
  /** Higher = scheduled earlier */
  priority: number;
  /** Optional link to an existing task when recovering */
  taskId?: string;
  taskTitle?: string;
};

export type DayBucket = {
  date: Date;
  remaining: number;
  tasks: TopicEntry[];
};

export type ScheduledSlot = {
  userId: string;
  planId: string;
  subjectId: string;
  topicId: string;
  taskTitle: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  taskId?: string;
};

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Local calendar date key (YYYY-MM-DD) for bucket lookups. */
export function localDayKey(date: Date): string {
  const d = startOfLocalDay(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Study days from start (inclusive) through the day before the exam.
 * Plan generation uses tomorrow; recovery uses today by passing `fromDate`.
 */
export function getStudyDaysBetween(examDate: Date, fromDate: Date): Date[] {
  const days: Date[] = [];
  const start = startOfLocalDay(fromDate);
  const end = startOfLocalDay(examDate);
  const cursor = new Date(start);

  while (cursor < end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

/** Plan generation: study days starting tomorrow. */
export function getStudyDays(examDate: Date): Date[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return getStudyDaysBetween(examDate, tomorrow);
}

/** Recovery: include today through day before exam. */
export function getRemainingStudyDays(examDate: Date, fromDate = new Date()): Date[] {
  const today = startOfLocalDay(fromDate);
  return getStudyDaysBetween(examDate, today);
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

/** Map difficulty (1-5) to estimated hours to study. */
export function estimatedHours(difficulty: number): number {
  return 0.5 + (difficulty - 1) * 0.5;
}

/** Compute priority score: higher difficulty + weak subjects first. */
export function computePriority(difficulty: number, isWeak: boolean): number {
  let score = difficulty * 10;
  if (isWeak) score += 25;
  return score;
}

export function toPriority(difficulty: number): "low" | "medium" | "high" {
  if (difficulty >= 4) return "high";
  if (difficulty >= 2) return "medium";
  return "low";
}

export function createDayBuckets(
  studyDays: Date[],
  dailyCapacity: number,
  usedHoursByDay?: Map<string, number>,
): DayBucket[] {
  return studyDays.map((date) => {
    const key = localDayKey(date);
    const used = usedHoursByDay?.get(key) ?? 0;
    return {
      date,
      remaining: Math.max(0, dailyCapacity - used),
      tasks: [],
    };
  });
}

/** Bin-pack topic entries into day buckets (highest priority first). */
export function distributeEntriesToDays(
  entries: TopicEntry[],
  dayBuckets: DayBucket[],
): DayBucket[] {
  const sorted = [...entries].sort((a, b) => b.priority - a.priority);

  for (const entry of sorted) {
    const hours = estimatedHours(entry.difficulty);
    let placed = false;

    for (const bucket of dayBuckets) {
      if (bucket.remaining >= hours) {
        bucket.tasks.push(entry);
        bucket.remaining -= hours;
        placed = true;
        break;
      }
    }

    if (!placed && dayBuckets.length > 0) {
      const least = dayBuckets.reduce((a, b) =>
        a.remaining > b.remaining ? a : b,
      );
      least.tasks.push(entry);
      least.remaining -= hours;
    }
  }

  return dayBuckets;
}

export function bucketsToScheduledSlots(
  buckets: DayBucket[],
  ctx: { userId: string; planId: string },
): ScheduledSlot[] {
  const slots: ScheduledSlot[] = [];
  for (const bucket of buckets) {
    for (const entry of bucket.tasks) {
      slots.push({
        userId: ctx.userId,
        planId: ctx.planId,
        subjectId: entry.subjectId,
        topicId: entry.topicId,
        taskTitle:
          entry.taskTitle ??
          `Study: ${entry.topicName} (${entry.subjectName})`,
        dueDate: bucket.date,
        priority: toPriority(entry.difficulty),
        taskId: entry.taskId,
      });
    }
  }
  return slots;
}

/** Sum of per-day hour limits before packing. */
export function totalAvailableCapacity(
  studyDays: Date[],
  dailyCapacity: number,
): number {
  return studyDays.length * dailyCapacity;
}

export function remainingCapacityInBuckets(dayBuckets: DayBucket[]): number {
  return dayBuckets.reduce((sum, b) => sum + Math.max(0, b.remaining), 0);
}

export function sumEntryHours(entries: TopicEntry[]): number {
  return entries.reduce((s, e) => s + estimatedHours(e.difficulty), 0);
}

export function estimateCompletionDate(buckets: DayBucket[]): Date | null {
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i]!.tasks.length > 0) {
      return buckets[i]!.date;
    }
  }
  return null;
}
