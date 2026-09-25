import { Router } from "express";

const organizationRouter = Router();

organizationRouter.get("/");
organizationRouter.post("/");
organizationRouter.get("/by-slug/:slug");
organizationRouter.get("/:organizationId");
organizationRouter.patch("/:organizationId");
organizationRouter.delete("/:organizationId");

// Members
organizationRouter.get("/:organizationId/members");
organizationRouter.post("/:organizationId/members");
organizationRouter.get("/:organizationId/members/:memberId");
organizationRouter.patch("/:organizationId/members/:memberId");
organizationRouter.post("/:organizationId/members/:memberId/activate");
organizationRouter.post("/:organizationId/members/:memberId/suspend");
organizationRouter.delete("/:organizationId/members/:memberId");

organizationRouter.get("/:organizationId/roles");
organizationRouter.post("/:organizationId/roles");
organizationRouter.get("/:organizationId/roles/:roleId");
organizationRouter.patch("/:organizationId/roles/:roleId");
organizationRouter.delete("/:organizationId/roles/:roleId");
