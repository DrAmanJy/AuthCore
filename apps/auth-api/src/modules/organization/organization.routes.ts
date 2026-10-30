import { Router } from "express";

import { validateAccessToken } from "../../middlewares/token.middleware.js";
import apiKeyRouter from "./api-keys/api-key.routes.js";
import invitationRouter from "./invitations/invitations.routes.js";
import memberRouter from "./members/members.routes.js";
import roleRouter from "./roles/role.routes.js";
import { organizationController } from "./organization.container.js";

const organizationRouter = Router();

organizationRouter.use(validateAccessToken);

organizationRouter.get("/", organizationController.getOrganizations);

organizationRouter.post("/", organizationController.createOrganization);

organizationRouter.get("/by-slug/:slug", organizationController.getOrganizationBySlug);

organizationRouter.get("/:organizationId", organizationController.getOrganization);

organizationRouter.patch("/:organizationId", organizationController.updateOrganization);

organizationRouter.delete("/:organizationId", organizationController.deleteOrganization);

organizationRouter.use("/:organizationId", apiKeyRouter);
organizationRouter.use("/:organizationId", invitationRouter);
organizationRouter.use("/:organizationId", memberRouter);
organizationRouter.use("/:organizationId", roleRouter);

export { organizationRouter };
