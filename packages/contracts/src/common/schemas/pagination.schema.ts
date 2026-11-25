import { z } from "zod";

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().trim().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
