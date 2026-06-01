import { connectDB } from "@/lib/db";
import type { GeneratePlanInput } from "@/lib/validations/study-plan";
import StudyPlan from "@/models/StudyPlan";
import Subject from "@/models/Subject";
import Task from "@/models/Task";
import Topic from "@/models/Topic";

// ─── Types ──────────────────────────────────────────────────────

type TopicEntry = {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  difficulty: number;
  isWeakSubject: boolean;
  /** Higher = scheduled earlier */
  priority: number;
};

type ScheduledTask = {
  userId: string;
  planId: string;
  subjectId: string;
  topicId: string;
  taskTitle: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
};

// ─── Helpers ────────────────────────────────────────────────────

/** Calculate business-style study days between now and exam date. */
function getStudyDays(examDate: Date): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(examDate);
  end.setHours(0, 0, 0, 0);

  // Start from tomorrow, end 1 day before exam (exam day = revision)
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor < end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

/** Map difficulty (1-5) to estimated hours to study. */
function estimatedHours(difficulty: number): number {
  // 1 → 0.5h, 2 → 1h, 3 → 1.5h, 4 → 2h, 5 → 2.5h
  return 0.5 + (difficulty - 1) * 0.5;
}

/** Compute priority score: higher difficulty + weak subjects first. */
function computePriority(difficulty: number, isWeak: boolean): number {
  let score = difficulty * 10;
  if (isWeak) score += 25;
  return score;
}

function toPriority(difficulty: number): "low" | "medium" | "high" {
  if (difficulty >= 4) return "high";
  if (difficulty >= 2) return "medium";
  return "low";
}

// ─── Main Algorithm ─────────────────────────────────────────────

export async function generateStudyPlan(
  userId: string,
  input: GeneratePlanInput,
): Promise<{
  planId: string;
  title: string;
  totalTasks: number;
  totalDays: number;
  tasksPerDay: number;
}> {
  await connectDB();

  const examDate = new Date(input.examDate);
  const studyDays = getStudyDays(examDate);

  if (studyDays.length === 0) {
    throw new Error("Exam date is too soon — need at least 1 full day to generate a plan.");
  }

  // 1. Load all subjects + topics from selected syllabi
  const subjects = await Subject.find({
    userId,
    syllabusId: { $in: input.syllabusIds },
  }).lean();

  if (subjects.length === 0) {
    throw new Error("No subjects found in the selected syllabi. Run extraction first.");
  }

  const subjectMap = new Map(subjects.map((s) => [s.subjectId, s]));
  const subjectIds = subjects.map((s) => s.subjectId);

  const topics = await Topic.find({
    subjectId: { $in: subjectIds },
    status: { $ne: "completed" }, // Skip already-completed topics
  }).lean();

  if (topics.length === 0) {
    throw new Error("All topics are already completed. Nothing to schedule.");
  }

  const weakSet = new Set(
    (input.weakSubjects ?? []).map((s) => s.toLowerCase()),
  );

  // 2. Build prioritized topic list
  const entries: TopicEntry[] = topics.map((t) => {
    const subject = subjectMap.get(t.subjectId);
    const subjectName = subject?.subjectName ?? "Unknown";
    const isWeak =
      weakSet.has(subjectName.toLowerCase()) ||
      weakSet.has(t.subjectId);

    return {
      topicId: t.topicId,
      topicName: t.topicName,
      subjectId: t.subjectId,
      subjectName,
      difficulty: t.difficulty ?? 3,
      isWeakSubject: isWeak,
      priority: computePriority(t.difficulty ?? 3, isWeak),
    };
  });

  // Sort: highest priority first (hard + weak topics get earlier slots)
  entries.sort((a, b) => b.priority - a.priority);

  // 3. Distribute topics across days using bin-packing
  const dailyCapacity = input.dailyStudyHours;
  const dayBuckets: { date: Date; remaining: number; tasks: TopicEntry[] }[] =
    studyDays.map((d) => ({ date: d, remaining: dailyCapacity, tasks: [] }));

  for (const entry of entries) {
    const hours = estimatedHours(entry.difficulty);

    // Find first day with enough capacity
    let placed = false;
    for (const bucket of dayBuckets) {
      if (bucket.remaining >= hours) {
        bucket.tasks.push(entry);
        bucket.remaining -= hours;
        placed = true;
        break;
      }
    }

    // If no day has enough capacity, place in the least-full day
    if (!placed) {
      const least = dayBuckets.reduce((a, b) =>
        a.remaining > b.remaining ? a : b,
      );
      least.tasks.push(entry);
      least.remaining -= hours;
    }
  }

  // 4. Create StudyPlan record
  const plan = await StudyPlan.create({
    userId,
    title: input.title,
    examDate,
    dailyStudyHours: input.dailyStudyHours,
    weakSubjects: input.weakSubjects,
    status: "active",
  });

  // 5. Create Task records
  const taskDocs: ScheduledTask[] = [];
  for (const bucket of dayBuckets) {
    for (const entry of bucket.tasks) {
      taskDocs.push({
        userId,
        planId: plan.planId,
        subjectId: entry.subjectId,
        topicId: entry.topicId,
        taskTitle: `Study: ${entry.topicName} (${entry.subjectName})`,
        dueDate: bucket.date,
        priority: toPriority(entry.difficulty),
      });
    }
  }

  if (taskDocs.length > 0) {
    await Task.insertMany(taskDocs);
  }

  const activeDays = dayBuckets.filter((b) => b.tasks.length > 0).length;

  return {
    planId: plan.planId,
    title: plan.title,
    totalTasks: taskDocs.length,
    totalDays: activeDays,
    tasksPerDay: activeDays > 0 ? Math.round((taskDocs.length / activeDays) * 10) / 10 : 0,
  };
}
