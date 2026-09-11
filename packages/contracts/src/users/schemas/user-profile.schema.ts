import { z } from "zod";

import { idSchema } from "../../common/schemas/id.schema.js";
import { dateSchema } from "../../common/schemas/common.schema.js";
import { displayNameSchema } from "./user.schema.js";

export const userProfileSchema = z.strictObject({
  id: idSchema,
  displayName: displayNameSchema,
  createdAt: dateSchema,
});
