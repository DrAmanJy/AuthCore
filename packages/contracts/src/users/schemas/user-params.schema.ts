import { z } from "zod";

import { idSchema } from "../../common/schemas/id.schema.js";

export const userParamsSchema = z.strictObject({
  userId: idSchema,
});
