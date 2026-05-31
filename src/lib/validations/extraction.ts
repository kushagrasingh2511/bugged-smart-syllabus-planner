import { z } from "zod";

export const extractedTopicSchema = z.object({
  topicName: z.string().min(1).max(500),
  difficulty: z.number().int().min(1).max(5).optional(),
});

export const extractedSubjectSchema = z.object({
  subjectName: z.string().min(1).max(200),
  topics: z.array(extractedTopicSchema).min(1),
});

export const extractionResultSchema = z.object({
  subjects: z.array(extractedSubjectSchema).min(1),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;
