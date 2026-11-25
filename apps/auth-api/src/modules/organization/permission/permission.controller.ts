import type { Request, Response } from "express";
import type { PermissionService } from "./permission.service.js";
import type { OrganizationId, PermissionId, RoleId } from "@authcore/database";
import getAuthToken from "../../../utils/token.js";
import {
  getPaginationOptions,
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../../utils/response.utils.js";

export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {
    this.get = this.get.bind(this);
    this.getRolePermissions = this.getRolePermissions.bind(this);
    this.getOrganizationPermissions = this.getOrganizationPermissions.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  private resolveOrgId(req: Request): OrganizationId {
    return (
      req.orgContext?.organization.id ??
      (req.params as { organizationId?: OrganizationId }).organizationId ??
      getAuthToken(req).orgId
    );
  }

  async get(req: Request, res: Response) {
    const orgId = this.resolveOrgId(req);
    const { permissionId } = req.params as { permissionId: PermissionId };
    const permission = await this.permissionService.get(permissionId, orgId);
    sendSuccess(res, permission, "Permission successfully retrieved");
  }

  async getRolePermissions(req: Request, res: Response) {
    const orgId = this.resolveOrgId(req);
    const { roleId } = req.params as { roleId: RoleId };
    const options = getPaginationOptions(req.query);
    const permissions = await this.permissionService.getRoles(
      roleId,
      orgId,
      options,
    );
    sendPaginated(res, permissions, "Permissions successfully retrieved");
  }

  async getOrganizationPermissions(req: Request, res: Response) {
    const orgId = this.resolveOrgId(req);
    const options = getPaginationOptions(req.query);
    const permissions = await this.permissionService.getOrganizations(
      orgId,
      options,
    );
    sendPaginated(res, permissions, "Permissions successfully retrieved");
  }

  async create(req: Request, res: Response) {
    const { sub } = getAuthToken(req);
    const orgId = this.resolveOrgId(req);
    const { description, key } = req.body as { description: string; key: string };
    const permission = await this.permissionService.create({
      description,
      key,
      createdBy: sub,
      organizationId: orgId,
    });

    sendCreated(res, permission, "Permission created successfully");
  }

  async update(req: Request, res: Response) {
    const orgId = this.resolveOrgId(req);
    const { permissionId } = req.params as { permissionId: PermissionId };
    const { key, description } = req.body as { description?: string; key?: string };

    const permission = await this.permissionService.update(
      permissionId,
      orgId,
      description,
      key,
    );

    sendSuccess(res, permission, "Permission updated successfully");
  }

  async delete(req: Request, res: Response) {
    const { permissionId } = req.params as { permissionId: PermissionId };
    const orgId = this.resolveOrgId(req);

    const permission = await this.permissionService.softDelete(permissionId, orgId);

    sendSuccess(res, permission, "Permission deleted successfully");
  }
}
