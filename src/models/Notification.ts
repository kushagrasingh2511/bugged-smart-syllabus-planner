import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const NOTIFICATION_TYPES = [
  "missed_task",
  "study_reminder",
  "deadline_alert",
  "revision_reminder",
  "exam_readiness",
  "recovery_alert",
] as const;

export const NOTIFICATION_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

const notificationSchema = new Schema(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: "medium",
    },
    read: { type: Boolean, default: false, index: true },
    actionLink: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;

const Notification: Model<NotificationDocument> =
  mongoose.models.Notification ??
  mongoose.model("Notification", notificationSchema);

export default Notification;
