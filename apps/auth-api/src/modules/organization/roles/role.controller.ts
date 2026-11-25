import type { Request, Response } from "express";
import getAuthToken from "../../../utils/token.js";
import type { RoleService } from "./role.service.js";
import type {
  CreateRoleData,
  OrganizationId,
  RoleId,
  UpdateRoleData,
} from "@authcore/database";
import {
  getPaginationOptions,
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../../utils/response.utils.js";
import type { PermissionId } from "@authcore/database/dist/repositories/permission/permission.types.js";

export class RoleController {
  constructor(private readonly roleService: RoleService) {
    this.getRoles = this.getRoles.bind(this);
    this.createRole = this.createRole.bind(this);
    this.getRole = this.getRole.bind(this);
    this.updateRole = this.updateRole.bind(this);
    this.deleteRole = this.deleteRole.bind(this);
    this.addPermissions = this.addPermissions.bind(this);
    this.removePermissions = this.removePermissions.bind(this);
  }

  async getRoles(req: Request<{ organizationId: OrganizationId }>, res: Response) {
    const { organizationId } = req.params;
    const options = getPaginationOptions(req.query);

    const roles = await this.roleService.getByOrganizationId(organizationId, options);

    sendPaginated(res, roles, "Roles successfully retrieved");
  }

  async createRole(
    req: Request<
      { organizationId: OrganizationId },
      unknown,
      { name: string; permissionIds: CreateRoleData["permissionIds"] }
    >,
    res: Response,
  ) {
    const { sub: actorId } = getAuthToken(req);
    const { organizationId } = req.params;
    const { name, permissionIds } = req.body;
    const role = await this.roleService.create({
      organizationId,
      actorId,
      data: { name, permissionIds },
    });

    sendCreated(res, role, "Role successfully created");
  }

  async getRole(
    req: Request<{ organizationId: OrganizationId; roleId: RoleId }>,
    res: Response,
  ) {
    const { organizationId, roleId } = req.params;

    const role = await this.roleService.get({ organizationId, roleId });

    sendSuccess(res, role, "Role successfully retrieved");
  }

  async updateRole(
    req: Request<
      { organizationId: OrganizationId; roleId: RoleId },
      unknown,
      UpdateRoleData
    >,
    res: Response,
  ) {
    const { organizationId, roleId } = req.params;
    const { sub: actorId } = getAuthToken(req);
    const { name } = req.body;
    const role = await this.roleService.update({
      organizationId,
      roleId,
      actorId,
      data: {
        name,
      },
    });

    sendSuccess(res, role, "Role successfully updated");
  }

  async addPermissions(
    req: Request<
      { roleId: RoleId; organizationId: OrganizationId },
      unknown,
      { permissionIds: PermissionId[] }
    >,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    const { roleId, organizationId } = req.params;
    const { permissionIds } = req.body;
    const role = await this.roleService.addPermissions({
      actorId: sub,
      organizationId,
      roleId,
      permissionIds,
    });

    sendSuccess(res, role, "Role successfully updated");
  }
  async removePermissions(
    req: Request<
      { roleId: RoleId; organizationId: OrganizationId },
      unknown,
      { permissionIds: PermissionId[] }
    >,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    const { roleId, organizationId } = req.params;
    const { permissionIds } = req.body;
    const role = await this.roleService.removePermissions({
      actorId: sub,
      organizationId,
      roleId,
      permissionIds,
    });

    sendSuccess(res, role, "Role successfully updated");
  }

  async deleteRole(
    req: Request<{ organizationId: OrganizationId; roleId: RoleId }>,
    res: Response,
  ) {
    const { organizationId, roleId } = req.params;
    const { sub: actorId } = getAuthToken(req);
    const role = await this.roleService.softDelete({ organizationId, roleId, actorId });

    sendSuccess(res, role, "Role successfully deleted");
  }
}
