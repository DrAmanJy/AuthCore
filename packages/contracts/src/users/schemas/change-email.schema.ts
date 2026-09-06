import { z } from "zod";

import { emailSchema } from "./user.schema.js";

export const changeEmailSchema = z.strictObject({
  email: emailSchema,
});
