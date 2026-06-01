import { z } from "zod";

import { REVISION_STATUS } from "@/lib/constants";

export const generateRevisionsSchema = z.object({
  planId: z.string().trim().min(1).optional(),
  topicId: z.string().trim().min(1).optional(),
  force: z.boolean().optional().default(false),
});

export const updateRevisionSchema = z.object({
  status: z.enum(REVISION_STATUS),
});

export const revisionIdParamSchema = z.object({
  revisionId: z.string().trim().min(1).max(64),
});
