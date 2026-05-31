import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const subjectSchema = new Schema(
  {
    subjectId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    userId: { type: String, required: true, index: true },
    syllabusId: { type: String, index: true },
    subjectName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type SubjectDocument = InferSchemaType<typeof subjectSchema>;

const Subject: Model<SubjectDocument> =
  mongoose.models.Subject ?? mongoose.model("Subject", subjectSchema);

export default Subject;
