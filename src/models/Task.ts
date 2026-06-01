import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { TASK_STATUS } from "@/lib/constants";

const taskSchema = new Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    userId: { type: String, required: true, index: true },
    planId: { type: String, index: true },
    subjectId: { type: String, index: true },
    topicId: { type: String, index: true },
    taskTitle: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: TASK_STATUS,
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, completedAt: 1 });

export type TaskDocument = InferSchemaType<typeof taskSchema>;

const Task: Model<TaskDocument> =
  mongoose.models.Task ?? mongoose.model("Task", taskSchema);

export default Task;
