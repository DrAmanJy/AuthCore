import { Router } from "express";
import { permissionController } from "../../../container.js";
import { requirePermission } from "../../../middlewares/permission.js";

const permissionRouter = Router({ mergeParams: true });

permissionRouter.get(
  "/:permissionId",
  requirePermission("perm:read"),
  permissionController.get,
);

permissionRouter.get(
  "/:roleId",
  requirePermission("perm:read"),
  permissionController.getRolePermissions,
);

permissionRouter.get(
  "/",
  requirePermission("perm:read"),
  permissionController.getOrganizationPermissions,
);

permissionRouter.post("/", requirePermission("perm:create"), permissionController.create);

permissionRouter.patch(
  "/:permissionId",
  requirePermission("perm:update"),
  permissionController.update,
);

permissionRouter.delete(
  "/:permissionId",
  requirePermission("perm:delete"),
  permissionController.delete,
);

export default permissionRouter;
