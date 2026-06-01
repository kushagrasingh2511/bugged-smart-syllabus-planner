import { z } from "zod";

const uuidLike = z
  .string()
  .trim()
  .min(1, "Task ID is required")
  .max(64, "Task ID is too long");

export const taskIdParamSchema = z.object({
  taskId: uuidLike,
});
