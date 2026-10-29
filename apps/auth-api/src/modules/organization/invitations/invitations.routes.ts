import { Router } from "express";
import { invitationController } from "../organization.container.js";

const invitationRouter = Router({ mergeParams: true });

invitationRouter.get("/invitation", invitationController.getOrganizationInvites);

invitationRouter.post("/invitation", invitationController.sendInvitation);

invitationRouter.post(
  "/invitation/:invitationId/accept",
  invitationController.acceptInvitation,
);
invitationRouter.post(
  "/invitation/:invitationId/reject",
  invitationController.rejectInvitation,
);

invitationRouter.delete(
  "/invitation/:invitationId",
  invitationController.revokeInvitation,
);

export default invitationRouter;
