import { z } from "zod";

export const generateRecoverySchema = z.object({
  planId: z.string().trim().min(1, "planId is required"),
  apply: z.boolean().optional().default(false),
});
