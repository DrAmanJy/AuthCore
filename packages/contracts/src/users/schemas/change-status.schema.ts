import { z } from "zod";

import { userStatusSchema } from "./user.schema.js";

export const changeStatusSchema = z.strictObject({
  status: userStatusSchema,
});
