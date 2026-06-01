import { z } from "zod";

export const generatePlanSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  examDate: z.string().refine(
    (d) => !isNaN(Date.parse(d)) && new Date(d) > new Date(),
    "Exam date must be a valid future date",
  ),
  dailyStudyHours: z.number().min(0.5).max(16).default(2),
  weakSubjects: z.array(z.string()).optional().default([]),
  syllabusIds: z.array(z.string().min(1)).min(1, "At least one syllabus is required"),
});

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;
