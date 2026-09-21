import { z } from "zod";

import { idSchema } from "../../common/schemas/id.schema.js";

export const sessionParamsSchema = z.strictObject({
  sessionId: idSchema,
});
