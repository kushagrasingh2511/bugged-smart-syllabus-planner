import type { TaskStatus } from "@/types";

export type StudyPlanListItem = {
  planId: string;
  title: string;
  examDate: string;
  dailyStudyHours: number;
  weakSubjects: string[];
  status: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  createdAt: string;
};

export type PlannerTask = {
  taskId: string;
  taskTitle: string;
  subjectId?: string;
  topicId?: string;
  dueDate: string;
  status: TaskStatus;
  priority: string;
  completedAt: string | null;
};

export type StudyPlanDetail = {
  planId: string;
  title: string;
  examDate: string;
  dailyStudyHours: number;
  weakSubjects: string[];
  status: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  createdAt: string;
};
