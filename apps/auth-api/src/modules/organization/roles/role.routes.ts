import { Router } from "express";
import { roleController } from "../organization.container.js";

const roleRouter = Router({ mergeParams: true });

roleRouter.get("/roles", roleController.getRoles);

roleRouter.post("/roles", roleController.createRole);

roleRouter.get("/roles/:roleId", roleController.getRole);
roleRouter.patch("/roles/:roleId", roleController.updateRole);

roleRouter.delete("/roles/:roleId", roleController.deleteRole);

export default roleRouter;
