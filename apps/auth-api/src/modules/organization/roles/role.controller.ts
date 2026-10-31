import type { Request, Response } from "express";
import getAuthToken from "../../../utils/token.js";
import type { RoleService } from "./role.service.js";
import type {
  CreateRoleData,
  OrganizationId,
  RoleId,
  UpdateRoleData,
} from "@authcore/database";
import { sendCreated, sendSuccess } from "../../../utils/response.utils.js";

export class RoleController {
  constructor(private readonly roleService: RoleService) {
    this.getRoles = this.getRoles.bind(this);
    this.createRole = this.createRole.bind(this);
    this.getRole = this.getRole.bind(this);
    this.updateRole = this.updateRole.bind(this);
    this.deleteRole = this.deleteRole.bind(this);
  }

  async getRoles(req: Request<{ organizationId: OrganizationId }>, res: Response) {
    const { organizationId } = req.params;

    const roles = await this.roleService.getRoles(organizationId);

    sendSuccess(res, roles, "Roles successfully retrieved");
  }

  async createRole(
    req: Request<{ organizationId: OrganizationId }, unknown, CreateRoleData>,
    res: Response,
  ) {
    const { sub: actorId } = getAuthToken(req);
    const { organizationId } = req.params;
    const { isSystemRole, name, permissions } = req.body;
    const role = await this.roleService.createRole({
      organizationId,
      actorId,
      data: { isSystemRole, name, permissions },
    });

    sendCreated(res, role, "Role successfully created");
  }

  async getRole(
    req: Request<{ organizationId: OrganizationId; roleId: RoleId }>,
    res: Response,
  ) {
    const { organizationId, roleId } = req.params;

    const role = await this.roleService.getRole({ organizationId, roleId });

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
    const { name, permissions } = req.body;
    const role = await this.roleService.updateRole({
      organizationId,
      roleId,
      actorId,
      data: {
        name,
        permissions,
      },
    });

    sendSuccess(res, role, "Role successfully updated");
  }

  async deleteRole(
    req: Request<{ organizationId: OrganizationId; roleId: RoleId }>,
    res: Response,
  ) {
    const { organizationId, roleId } = req.params;
    const { sub: actorId } = getAuthToken(req);
    const role = await this.roleService.deleteRole({ organizationId, roleId, actorId });

    sendSuccess(res, role, "Role successfully deleted");
  }
}
