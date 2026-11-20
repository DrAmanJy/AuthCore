import { Router } from "express";
import { apiKeyController } from "../../../container.js";
import { requirePermission } from "../../../middlewares/permission.js";

const apiKeyRouter = Router({ mergeParams: true });

apiKeyRouter.get(
  "/",
  requirePermission("api_keys:read"),
  apiKeyController.getALlOrganizationApiKey,
);

apiKeyRouter.post(
  "/",
  requirePermission("api_keys:create"),
  apiKeyController.createApiKey,
);

apiKeyRouter.get(
  "/:apiKeyId",
  requirePermission("api_keys:read"),
  apiKeyController.getApiKeyById,
);

apiKeyRouter.patch(
  "/:key/revoke",
  requirePermission("api_keys:revoke"),
  apiKeyController.revokeApiKey,
);

apiKeyRouter.delete(
  "/:apiKeyId",
  requirePermission("api_keys:delete"),
  apiKeyController.deleteApiKey,
);

export default apiKeyRouter;
