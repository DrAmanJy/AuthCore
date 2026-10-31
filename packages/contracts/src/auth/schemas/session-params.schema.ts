// import { z } from "zod";
// import { idSchema } from "../../common/schemas/id.schema.js";

// export const sessionParamsSchema = z.object({
//   sessionId: idSchema,
// });

// export const sessionQueryFilterSchema = z.object({
//   limit: z.coerce.number().min(1).max(100).default(20),
//   page: z.coerce.number().min(1).default(1),
//   activeOnly: z.enum(["true", "false"]).transform(v => v === "true").default("true"),
//   deviceType: z.string().trim().max(50).optional(),
// });

// export type SessionQueryFilter = z.infer<typeof sessionQueryFilterSchema>;
