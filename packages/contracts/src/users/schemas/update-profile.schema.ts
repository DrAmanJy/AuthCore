import { z } from "zod";

import { displayNameSchema } from "./user.schema.js";

export const updateUserProfile = z.strictObject({
  displayName: displayNameSchema,
});
