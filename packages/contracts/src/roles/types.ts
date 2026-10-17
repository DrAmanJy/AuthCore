import type { z } from "zod";
import type {
  createRoleSchema,
  updateRoleSchema,
  roleParamsSchema,
} from "./schemas/role.schema.js";

export type CreateRole = z.infer<typeof createRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type RoleParams = z.infer<typeof roleParamsSchema>;
