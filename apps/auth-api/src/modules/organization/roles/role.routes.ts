import { Router } from "express";
import { requirePermission } from "../../../middlewares/permission.js";
import { roleController } from "../../../container.js";

const roleRouter = Router({ mergeParams: true });

roleRouter.get("/", requirePermission("roles:read"), roleController.getRoles);

roleRouter.post("/", requirePermission("roles:create"), roleController.createRole);

roleRouter.get("/:roleId", requirePermission("roles:read"), roleController.getRole);

roleRouter.patch(
  "/:roleId",
  requirePermission("roles:update"),
  roleController.updateRole,
);

roleRouter.delete(
  "/:roleId",
  requirePermission("roles:delete"),
  roleController.deleteRole,
);

export default roleRouter;
