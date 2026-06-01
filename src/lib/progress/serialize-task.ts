import type { TaskDocument } from "@/models/Task";
import type { TaskSummaryItem } from "@/types/progress";

type TaskLike = Pick<
  TaskDocument,
  | "taskId"
  | "taskTitle"
  | "subjectId"
  | "topicId"
  | "planId"
  | "dueDate"
  | "status"
  | "priority"
  | "completedAt"
>;

export function serializeTask(task: TaskLike): TaskSummaryItem {
  return {
    taskId: task.taskId,
    taskTitle: task.taskTitle,
    subjectId: task.subjectId ?? undefined,
    topicId: task.topicId ?? undefined,
    planId: task.planId ?? undefined,
    dueDate: new Date(task.dueDate).toISOString(),
    status: task.status,
    priority: task.priority,
    completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null,
  };
}
