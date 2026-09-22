import { z } from "zod";

import { tokenSchema } from "./auth.schema.js";

export const verifyEmailSchema = z.strictObject({
  token: tokenSchema,
});
