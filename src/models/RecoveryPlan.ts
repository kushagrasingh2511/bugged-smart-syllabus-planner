import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const movedTaskSchema = new Schema(
  {
    taskId: { type: String, required: true },
    taskTitle: { type: String, required: true },
    topicId: { type: String, required: true },
    subjectId: { type: String },
    fromDueDate: { type: Date, required: true },
    toDueDate: { type: Date, required: true },
    estimatedHours: { type: Number, required: true },
    priority: { type: String, required: true },
  },
  { _id: false },
);

const missedTaskSchema = new Schema(
  {
    taskId: { type: String, required: true },
    taskTitle: { type: String, required: true },
    topicId: { type: String },
    subjectId: { type: String },
    originalDueDate: { type: Date, required: true },
  },
  { _id: false },
);

const scheduleDaySchema = new Schema(
  {
    date: { type: Date, required: true },
    totalHours: { type: Number, required: true },
    tasks: [
      {
        taskId: { type: String },
        taskTitle: { type: String, required: true },
        topicId: { type: String, required: true },
        estimatedHours: { type: Number, required: true },
        priority: { type: String, required: true },
        isRecovery: { type: Boolean, default: true },
      },
    ],
  },
  { _id: false },
);

const recoveryPlanSchema = new Schema(
  {
    recoveryId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    userId: { type: String, required: true, index: true },
    planId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["generated", "applied"],
      default: "generated",
    },
    missedTaskCount: { type: Number, required: true, min: 0 },
    remainingStudyDays: { type: Number, required: true, min: 0 },
    extraHoursNeeded: { type: Number, required: true, min: 0 },
    recommendedDailyHours: { type: Number, required: true, min: 0.5 },
    currentDailyHours: { type: Number, required: true },
    estimatedCompletionDate: { type: Date },
    missedTasks: [missedTaskSchema],
    movedTasks: [movedTaskSchema],
    schedulePreview: [scheduleDaySchema],
    recommendations: [
      {
        type: { type: String, required: true },
        message: { type: String, required: true },
        severity: {
          type: String,
          enum: ["info", "warning", "critical"],
          default: "info",
        },
      },
    ],
    charts: { type: Schema.Types.Mixed, required: true },
    appliedAt: { type: Date },
  },
  { timestamps: true },
);

recoveryPlanSchema.index({ userId: 1, createdAt: -1 });
recoveryPlanSchema.index({ userId: 1, planId: 1, createdAt: -1 });

export type RecoveryPlanDocument = InferSchemaType<typeof recoveryPlanSchema>;

const RecoveryPlan: Model<RecoveryPlanDocument> =
  mongoose.models.RecoveryPlan ??
  mongoose.model("RecoveryPlan", recoveryPlanSchema);

export default RecoveryPlan;
