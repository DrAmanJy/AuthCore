import { Router } from "express";

import { organizationController } from "../../container.js";
import { validateApiToken } from "../../middlewares/token.middleware.js";

const organizationServiceRouter = Router();

organizationServiceRouter.use(validateApiToken);

// ─────────────────────────────────────────────
// Organizations
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Organization Members
// ─────────────────────────────────────────────

organizationServiceRouter.get(
  "/:organizationId/members",
  organizationController.getMembers,
);

organizationServiceRouter.get(
  "/:organizationId/members/:memberId",
  organizationController.getMember,
);

// ─────────────────────────────────────────────
// Organization Roles
// ─────────────────────────────────────────────

organizationServiceRouter.get("/:organizationId/roles", organizationController.getRoles);

organizationServiceRouter.get(
  "/:organizationId/roles/:roleId",
  organizationController.getRole,
);

export { organizationServiceRouter };
