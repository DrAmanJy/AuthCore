// import { Router } from "express";

// import { validateApiToken } from "../../middlewares/token.middleware.js";
// import { organizationController } from "./organization.container.js";

// const organizationServiceRouter = Router();

// organizationServiceRouter.use(validateApiToken);

// // ─────────────────────────────────────────────
// // Organizations
// // ─────────────────────────────────────────────

// // ─────────────────────────────────────────────
// // Organization Members
// // ─────────────────────────────────────────────

// organizationServiceRouter.get(
//   "/:organizationId/members",
//   organizationController.getMembers,
// );

// organizationServiceRouter.get(
//   "/:organizationId/members/:memberId",
//   organizationController.getMember,
// );

// // ─────────────────────────────────────────────
// // Organization Roles
// // ─────────────────────────────────────────────

// organizationServiceRouter.get("/:organizationId/roles", organizationController.getRoles);

// organizationServiceRouter.get(
//   "/:organizationId/roles/:roleId",
//   organizationController.getRole,
// );

// export { organizationServiceRouter };
