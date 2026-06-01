import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { REVISION_NUMBERS, REVISION_STATUS } from "@/lib/constants";

const revisionSchema = new Schema(
  {
    revisionId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    userId: { type: String, required: true, index: true },
    topicId: { type: String, required: true, index: true },
    subjectId: { type: String, index: true },
    planId: { type: String, index: true },
    taskId: { type: String, index: true },
    revisionNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
      enum: REVISION_NUMBERS,
    },
    scheduledDate: { type: Date, required: true },
    topicCompletedAt: { type: Date, required: true },
    status: {
      type: String,
      enum: REVISION_STATUS,
      default: "scheduled",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

revisionSchema.index({ userId: 1, taskId: 1, revisionNumber: 1 }, { unique: true, sparse: true });
revisionSchema.index({ userId: 1, scheduledDate: 1 });
revisionSchema.index({ userId: 1, status: 1 });

export type RevisionDocument = InferSchemaType<typeof revisionSchema>;

const Revision: Model<RevisionDocument> =
  mongoose.models.Revision ?? mongoose.model("Revision", revisionSchema);

export default Revision;
