import { Router } from "express";
import { validateAccessToken } from "../../middlewares/token.middleware.js";
import { resolveOrgContext, requirePermission } from "../../middlewares/permission.js";
import { organizationController } from "../../container.js";

import roleRouter from "./roles/role.routes.js";
import memberRouter from "./members/members.routes.js";
import apiKeyRouter from "./api-keys/api-key.routes.js";
import invitationRouter from "./invitations/invitations.routes.js";
import permissionRouter from "./permission/permission.routes.js";

const organizationRouter = Router();

organizationRouter.use(validateAccessToken);

organizationRouter.get("/", organizationController.getOrganizations);
organizationRouter.post("/", organizationController.createOrganization);

organizationRouter.use("/:organizationId/invitations", invitationRouter);

const scopedRouter = Router({ mergeParams: true });
scopedRouter.use(resolveOrgContext);

scopedRouter.get("/", organizationController.getOrganization);
scopedRouter.patch(
  "/",
  requirePermission("org:update"),
  organizationController.updateOrganization,
);
scopedRouter.delete(
  "/",
  requirePermission("org:delete"),
  organizationController.deleteOrganization,
);

scopedRouter.use("/roles", roleRouter);
scopedRouter.use("/members", memberRouter);
scopedRouter.use("/api-keys", apiKeyRouter);
scopedRouter.use("/permissions", permissionRouter);

organizationRouter.use("/:organizationId", scopedRouter);

export { organizationRouter };
