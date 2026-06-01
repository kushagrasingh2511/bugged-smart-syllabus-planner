import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const progressSchema = new Schema(
  {
    progressId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    userId: { type: String, required: true, index: true },
    subjectId: { type: String, index: true },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    streakDays: { type: Number, min: 0, default: 0 },
    studyDaysCompleted: { type: Number, min: 0, default: 0 },
    lastStudyDate: { type: Date },
  },
  { timestamps: true },
);

/** One global row per user (no subjectId); optional per-subject rows when subjectId is set. */
progressSchema.index({ userId: 1, subjectId: 1 }, { unique: true, sparse: true });

export type ProgressDocument = InferSchemaType<typeof progressSchema>;

const Progress: Model<ProgressDocument> =
  mongoose.models.Progress ?? mongoose.model("Progress", progressSchema);

export default Progress;
