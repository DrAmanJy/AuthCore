import { Router } from "express";

import { organizationController } from "../../container.js";
import { validateAccessToken } from "../../middlewares/token.middleware.js";

const organizationRouter = Router();

organizationRouter.use(validateAccessToken);

// ─────────────────────────────────────────────
// Organizations
// ─────────────────────────────────────────────

organizationRouter.get("/", organizationController.getOrganizations);

organizationRouter.post("/", organizationController.createOrganization);

organizationRouter.get("/by-slug/:slug", organizationController.getOrganizationBySlug);

organizationRouter.get("/:organizationId", organizationController.getOrganization);

organizationRouter.patch("/:organizationId", organizationController.updateOrganization);

organizationRouter.delete("/:organizationId", organizationController.deleteOrganization);

// ─────────────────────────────────────────────
// Organization Members
// ─────────────────────────────────────────────

organizationRouter.get("/:organizationId/members", organizationController.getMembers);

organizationRouter.post("/:organizationId/members", organizationController.createMember);

organizationRouter.get(
  "/:organizationId/members/:memberId",
  organizationController.getMember,
);

organizationRouter.patch(
  "/:organizationId/members/:memberId",
  organizationController.updateMember,
);

organizationRouter.post(
  "/:organizationId/members/:memberId/activate",
  organizationController.activateMember,
);

organizationRouter.post(
  "/:organizationId/members/:memberId/suspend",
  organizationController.suspendMember,
);

organizationRouter.post(
  "/:organizationId/members/:memberId",
  organizationController.removeMember,
);

// ─────────────────────────────────────────────
// Organization Roles
// ─────────────────────────────────────────────

organizationRouter.get("/:organizationId/roles", organizationController.getRoles);

organizationRouter.post("/:organizationId/roles", organizationController.createRole);

organizationRouter.get("/:organizationId/roles/:roleId", organizationController.getRole);

organizationRouter.patch(
  "/:organizationId/roles/:roleId",
  organizationController.updateRole,
);

organizationRouter.delete(
  "/:organizationId/roles/:roleId",
  organizationController.deleteRole,
);

export { organizationRouter };
