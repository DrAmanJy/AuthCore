import { Router } from "express";
import { memberController } from "../../../container.js";
import { requirePermission } from "../../../middlewares/permission.js";

const memberRouter = Router({ mergeParams: true });

memberRouter.get("/", requirePermission("members:read"), memberController.getMembers);

memberRouter.get(
  "/:memberId",
  requirePermission("members:read"),
  memberController.getMember,
);

memberRouter.patch(
  "/:memberId/role",
  requirePermission("members:update"),
  memberController.changeRole,
);

memberRouter.post(
  "/:memberId/activate",
  requirePermission("members:update"),
  memberController.activateMember,
);

memberRouter.post(
  "/:memberId/suspend",
  requirePermission("members:update"),
  memberController.suspendMember,
);

memberRouter.delete(
  "/:memberId",
  requirePermission("members:remove"),
  memberController.removeMember,
);

export default memberRouter;
