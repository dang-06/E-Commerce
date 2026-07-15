import { z } from "zod";

export const healthStatusSchema = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.iso.datetime(),
  requestId: z.string().optional(),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
