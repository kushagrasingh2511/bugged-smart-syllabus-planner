export type RecoveryMissedTask = {
  taskId: string;
  taskTitle: string;
  topicId?: string;
  subjectId?: string;
  originalDueDate: string;
};

export type RecoveryMovedTask = {
  taskId: string;
  taskTitle: string;
  topicId: string;
  subjectId?: string;
  fromDueDate: string;
  toDueDate: string;
  estimatedHours: number;
  priority: string;
};

export type RecoveryScheduleDay = {
  date: string;
  totalHours: number;
  tasks: {
    taskId?: string;
    taskTitle: string;
    topicId: string;
    estimatedHours: number;
    priority: string;
    isRecovery: boolean;
  }[];
};

export type RecoveryRecommendation = {
  type: "hours" | "pace" | "exam" | "schedule";
  message: string;
  severity: "info" | "warning" | "critical";
};

export type RecoveryCharts = {
  hoursByDay: {
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
  workload: {
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
};

export type RecoverySummary = {
  recoveryId: string;
  planId: string;
  planTitle: string;
  status: "generated" | "applied";
  missedTaskCount: number;
  remainingStudyDays: number;
  extraHoursNeeded: number;
  recommendedDailyHours: number;
  currentDailyHours: number;
  estimatedCompletionDate: string | null;
  missedTasks: RecoveryMissedTask[];
  movedTasks: RecoveryMovedTask[];
  schedulePreview: RecoveryScheduleDay[];
  recommendations: RecoveryRecommendation[];
  charts: RecoveryCharts;
  createdAt: string;
};

export type RecoveryDashboardData = {
  overdueCount: number;
  overdueTasks: RecoveryMissedTask[];
  latestRecovery: RecoverySummary | null;
  plansWithOverdue: { planId: string; title: string; overdueCount: number }[];
};
