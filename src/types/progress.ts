import type { TaskStatus } from "@/types";

/** Single series for chart libraries (Chart.js, Recharts, etc.). */
export type ChartDataset = {
  label: string;
  data: number[];
};

export type ChartSeries = {
  labels: string[];
  datasets: ChartDataset[];
};

export type DailyCompletionPoint = {
  date: string;
  completedCount: number;
};

export type TaskSummaryItem = {
  taskId: string;
  taskTitle: string;
  subjectId?: string;
  topicId?: string;
  planId?: string;
  dueDate: string;
  status: TaskStatus;
  priority: string;
  completedAt: string | null;
};

export type ProgressMetrics = {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionPercentage: number;
  currentStreak: number;
  studyDaysCompleted: number;
};

export type SubjectProgressSlice = {
  subjectId: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
};

export type ProgressCharts = {
  completionByStatus: ChartSeries;
  completionBySubject: ChartSeries;
  dailyCompletions: DailyCompletionPoint[];
  completionTrend: ChartSeries;
};

export type ProgressSummary = {
  metrics: ProgressMetrics;
  bySubject: SubjectProgressSlice[];
  upcomingTasks: TaskSummaryItem[];
  recentCompletions: TaskSummaryItem[];
  charts: ProgressCharts;
  updatedAt: string;
};
