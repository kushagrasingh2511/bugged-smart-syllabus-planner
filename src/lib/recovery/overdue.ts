import type { TaskDocument } from "@/models/Task";

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isOverdueTask(
  task: Pick<TaskDocument, "dueDate" | "status">,
  now = new Date(),
): boolean {
  if (task.status === "completed") return false;
  return startOfLocalDay(task.dueDate) < startOfLocalDay(now);
}

export function filterOverdueTasks<T extends Pick<TaskDocument, "dueDate" | "status">>(
  tasks: T[],
  now = new Date(),
): T[] {
  return tasks.filter((t) => isOverdueTask(t, now));
}
