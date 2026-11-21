import type { Request, Response } from "express";
import type { PermissionService } from "./permission.service.js";
import type { PermissionId, RoleId } from "@authcore/database";
import getAuthToken from "../../../utils/token.js";
import { sendCreated, sendSuccess } from "../../../utils/response.utils.js";

export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  async get(req: Request<{ permissionId: PermissionId }>, res: Response) {
    const { orgId } = getAuthToken(req);
    const { permissionId } = req.params;
    const permission = await this.permissionService.get(permissionId, orgId);
    sendSuccess(res, permission, "Permission successfully retrieved");
  }

  async getRolePermissions(req: Request<{ roleId: RoleId }>, res: Response) {
    const { orgId } = getAuthToken(req);
    const { roleId } = req.params;
    const permissions = await this.permissionService.getRoles(roleId, orgId);
    sendSuccess(res, permissions, "Permissions successfully retrieved");
  }

  async getOrganizationPermissions(req: Request, res: Response) {
    const { orgId } = getAuthToken(req);
    const permissions = await this.permissionService.getOrganizations(orgId);
    sendSuccess(res, permissions, "Permissions successfully retrieved");
  }

  async create(
    req: Request<unknown, unknown, { description: string; key: string }>,
    res: Response,
  ) {
    const { sub, orgId } = getAuthToken(req);
    const { description, key } = req.body;
    const permission = await this.permissionService.create({
      description,
      key,
      createdBy: sub,
      organizationId: orgId,
    });

    sendCreated(res, permission, "Permission crated successfully");
  }

  async update(
    req: Request<
      { permissionId: PermissionId },
      unknown,
      { description?: string; key?: string }
    >,
    res: Response,
  ) {
    const { orgId } = getAuthToken(req);
    const { permissionId } = req.params;
    const { key, description } = req.body;

    const permission = await this.permissionService.update(
      permissionId,
      orgId,
      description,
      key,
    );

    sendSuccess(res, permission, "Permission updated succesfully");
  }

  async delete(req: Request<{ permissionId: PermissionId }>, res: Response) {
    const { permissionId } = req.params;
    const { orgId } = getAuthToken(req);

    const permission = await this.permissionService.softDelete(permissionId, orgId);

    sendSuccess(res, permission, "Permission deleted successfully");
  }
}
