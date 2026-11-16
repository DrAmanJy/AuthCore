import { Router } from "express";
import { invitationController } from "../../../container.js";
import { requirePermission } from "../../../middlewares/permission.js";

const invitationRouter = Router({ mergeParams: true });

invitationRouter.get(
  "/",
  requirePermission("members:read"),
  invitationController.getOrganizationInvites,
);

invitationRouter.post(
  "/",
  requirePermission("members:invite"),
  invitationController.sendInvitation,
);

invitationRouter.delete(
  "/:invitationId",
  requirePermission("members:invite"),
  invitationController.revokeInvitation,
);

invitationRouter.post("/:invitationId/accept", invitationController.acceptInvitation);

invitationRouter.post("/:invitationId/reject", invitationController.rejectInvitation);

export default invitationRouter;
