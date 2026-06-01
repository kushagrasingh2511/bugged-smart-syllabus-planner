import type { SyllabusSource } from "@/types";

export type ExtractionStatus = "pending" | "processing" | "completed" | "failed";

export type SyllabusItem = {
  syllabusId: string;
  title: string;
  sourceType: SyllabusSource;
  extractionStatus: ExtractionStatus;
  extractionError?: string;
  createdAt: string;
  updatedAt: string;
};

export type TopicItem = {
  topicId: string;
  topicName: string;
  difficulty: number;
  status: string;
};

export type SubjectItem = {
  subjectId: string;
  syllabusId?: string;
  subjectName: string;
  topics: TopicItem[];
};
