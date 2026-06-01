import Task from "@/models/Task";
import type { TaskDocument } from "@/models/Task";

import { serializeTask } from "@/lib/progress/serialize-task";
import { syncUserProgress } from "@/lib/progress/sync-progress";
import {
  cancelRevisionsForTask,
  scheduleRevisionsForTask,
} from "@/lib/revisions/schedule";
import type { TaskSummaryItem } from "@/types/progress";

export class TaskActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TaskActionError";
  }
}

async function refreshProgress(userId: string) {
  const tasks = await Task.find({ userId })
    .select("status completedAt")
    .lean();
  await syncUserProgress(userId, tasks);
}

export async function completeTask(
  userId: string,
  taskId: string,
): Promise<{ task: TaskSummaryItem; alreadyCompleted: boolean }> {
  const task = await Task.findOne({ taskId, userId });
  if (!task) {
    throw new TaskActionError("Task not found", 404);
  }

  if (task.status === "completed") {
    return { task: serializeTask(task), alreadyCompleted: true };
  }

  task.status = "completed";
  task.completedAt = new Date();
  await task.save();
  await refreshProgress(userId);
  await scheduleRevisionsForTask(task);

  return { task: serializeTask(task), alreadyCompleted: false };
}

export async function undoTaskCompletion(
  userId: string,
  taskId: string,
): Promise<{ task: TaskSummaryItem }> {
  const task = await Task.findOne({ taskId, userId });
  if (!task) {
    throw new TaskActionError("Task not found", 404);
  }

  if (task.status !== "completed") {
    throw new TaskActionError("Task is not completed", 400);
  }

  task.status = "pending";
  task.completedAt = null;
  await task.save();
  await refreshProgress(userId);
  await cancelRevisionsForTask(userId, taskId);

  return { task: serializeTask(task) };
}

export function applyTaskStatusUpdate(
  task: TaskDocument,
  status: TaskDocument["status"],
): void {
  task.status = status;
  if (status === "completed") {
    if (!task.completedAt) {
      task.completedAt = new Date();
    }
  } else {
    task.completedAt = null;
  }
}
