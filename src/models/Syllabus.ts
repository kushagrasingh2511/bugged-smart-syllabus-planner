import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { SYLLABUS_SOURCE } from "@/lib/constants";

const syllabusSchema = new Schema(
  {
    syllabusId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      enum: SYLLABUS_SOURCE,
      required: true,
    },
    fileUrl: { type: String },
    rawContent: { type: String },
    extractionStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    extractionError: { type: String },
  },
  { timestamps: true },
);

export type SyllabusDocument = InferSchemaType<typeof syllabusSchema>;

const Syllabus: Model<SyllabusDocument> =
  mongoose.models.Syllabus ?? mongoose.model("Syllabus", syllabusSchema);

export default Syllabus;
