import { connectDB } from "@/lib/db";
import type { GeneratePlanInput } from "@/lib/validations/study-plan";
import {
  bucketsToScheduledSlots,
  computePriority,
  createDayBuckets,
  distributeEntriesToDays,
  estimatedHours,
  getStudyDays,
  type TopicEntry,
} from "@/lib/study-plan/scheduling";
import StudyPlan from "@/models/StudyPlan";
import Subject from "@/models/Subject";
import Task from "@/models/Task";
import Topic from "@/models/Topic";

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
    status: { $ne: "completed" },
  }).lean();

  if (topics.length === 0) {
    throw new Error("All topics are already completed. Nothing to schedule.");
  }

  const weakSet = new Set(
    (input.weakSubjects ?? []).map((s) => s.toLowerCase()),
  );

  const entries: TopicEntry[] = topics.map((t) => {
    const subject = subjectMap.get(t.subjectId);
    const subjectName = subject?.subjectName ?? "Unknown";
    const isWeak =
      weakSet.has(subjectName.toLowerCase()) || weakSet.has(t.subjectId);

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

  const dayBuckets = createDayBuckets(studyDays, input.dailyStudyHours);
  distributeEntriesToDays(entries, dayBuckets);

  const plan = await StudyPlan.create({
    userId,
    title: input.title,
    examDate,
    dailyStudyHours: input.dailyStudyHours,
    weakSubjects: input.weakSubjects,
    status: "active",
  });

  const taskDocs = bucketsToScheduledSlots(dayBuckets, {
    userId,
    planId: plan.planId,
  });

  if (taskDocs.length > 0) {
    await Task.insertMany(taskDocs);
  }

  const activeDays = dayBuckets.filter((b) => b.tasks.length > 0).length;

  return {
    planId: plan.planId,
    title: plan.title,
    totalTasks: taskDocs.length,
    totalDays: activeDays,
    tasksPerDay:
      activeDays > 0 ? Math.round((taskDocs.length / activeDays) * 10) / 10 : 0,
  };
}

// Re-export scheduling helpers for recovery and tests
export {
  computePriority,
  estimatedHours,
  getStudyDays,
  getRemainingStudyDays,
} from "@/lib/study-plan/scheduling";
