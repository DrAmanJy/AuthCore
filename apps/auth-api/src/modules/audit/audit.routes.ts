import { Router } from "express";
import { auditController } from "../../container.js";
import { validateAccessToken } from "../../middlewares/token.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "@authcore/contracts";

const auditRouter = Router();

auditRouter.use(validateAccessToken);

auditRouter.get(
  "/:organizationId/audit-logs",
  requirePermission(PERMISSIONS.AUDIT_READ),
  auditController.getOrganizationLogs,
);

export { auditRouter };
