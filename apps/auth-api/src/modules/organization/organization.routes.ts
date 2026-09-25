import { Router } from "express";

import { organizationController } from "../../container.js";
import { validateAccessToken } from "../../middlewares/token.middleware.js";

const organizationRouter = Router();

// ─────────────────────────────────────────────
// Organizations
// ─────────────────────────────────────────────

organizationRouter.get("/", validateAccessToken, organizationController.getOrganizations);

organizationRouter.post(
  "/",
  validateAccessToken,
  organizationController.createOrganization,
);

organizationRouter.get(
  "/by-slug/:slug",
  validateAccessToken,
  organizationController.getOrganizationBySlug,
);

organizationRouter.get(
  "/:organizationId",
  validateAccessToken,
  organizationController.getOrganization,
);

organizationRouter.patch(
  "/:organizationId",
  validateAccessToken,
  organizationController.updateOrganization,
);

organizationRouter.delete(
  "/:organizationId",
  validateAccessToken,
  organizationController.deleteOrganization,
);

// ─────────────────────────────────────────────
// Organization Members
// ─────────────────────────────────────────────

organizationRouter.get(
  "/:organizationId/members",
  validateAccessToken,
  organizationController.getMembers,
);

organizationRouter.post(
  "/:organizationId/members",
  validateAccessToken,
  organizationController.createMember,
);

organizationRouter.get(
  "/:organizationId/members/:memberId",
  validateAccessToken,
  organizationController.getMember,
);

organizationRouter.patch(
  "/:organizationId/members/:memberId",
  validateAccessToken,
  organizationController.updateMember,
);

organizationRouter.post(
  "/:organizationId/members/:memberId/activate",
  validateAccessToken,
  organizationController.activateMember,
);

organizationRouter.post(
  "/:organizationId/members/:memberId/suspend",
  validateAccessToken,
  organizationController.suspendMember,
);

organizationRouter.post(
  "/:organizationId/members/:memberId",
  validateAccessToken,
  organizationController.removeMember,
);

// ─────────────────────────────────────────────
// Organization Roles
// ─────────────────────────────────────────────

organizationRouter.get(
  "/:organizationId/roles",
  validateAccessToken,
  organizationController.getRoles,
);

organizationRouter.post(
  "/:organizationId/roles",
  validateAccessToken,
  organizationController.createRole,
);

organizationRouter.get(
  "/:organizationId/roles/:roleId",
  validateAccessToken,
  organizationController.getRole,
);

organizationRouter.patch(
  "/:organizationId/roles/:roleId",
  validateAccessToken,
  organizationController.updateRole,
);

organizationRouter.delete(
  "/:organizationId/roles/:roleId",
  validateAccessToken,
  organizationController.deleteRole,
);

export { organizationRouter };
