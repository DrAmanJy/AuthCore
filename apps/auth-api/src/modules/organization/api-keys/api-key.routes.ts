import { Router } from "express";
import { apiKeyController } from "../organization.container.js";

const apiKeyRouter = Router({ mergeParams: true });

apiKeyRouter.post("/api-keys", apiKeyController.createApiKey);

apiKeyRouter.get("/api-keys", apiKeyController.getALlOrganizationApiKey);
apiKeyRouter.get("/api-keys/:apiKeyId", apiKeyController.getApiKeyById);

apiKeyRouter.patch("/api-keys/:key/revoke", apiKeyController.revokeApiKey);

apiKeyRouter.delete("/api-keys/:apiKeyId", apiKeyController.deleteApiKey);

export default apiKeyRouter;
