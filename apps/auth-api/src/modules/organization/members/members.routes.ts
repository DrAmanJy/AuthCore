import { Router } from "express";
import { memberController } from "../organization.container.js";

const memberRouter = Router({ mergeParams: true });

memberRouter.get("/members", memberController.getMembers);

memberRouter.post("/members", memberController.createMember);

memberRouter.get("/members/:memberId", memberController.getMember);

memberRouter.patch("/members/:memberId/role", memberController.changeRole);

memberRouter.post("/members/:memberId/activate", memberController.activateMember);

memberRouter.post("/members/:memberId/suspend", memberController.suspendMember);

memberRouter.post("/members/:memberId", memberController.removeMember);

export default memberRouter;
