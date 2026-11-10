import type {
  ActorId,
  CreateRoleData,
  OrganizationId,
  Role,
  RoleId,
  RoleRepository,
  UpdateRoleData,
} from "@authcore/database";
import { ResourceError } from "../../../errors/resource-error.js";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import { logger } from "@authcore/logger";
import type { AuthorizationService } from "../authorization/authorization.service.js";
import { InternalServerError } from "../../../errors/internal-server-error.js";

export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  // ─────────────────────────────────────────────

  async getRole(params: {
    organizationId: OrganizationId;
    roleId: RoleId;
    actorId?: ActorId;
  }): Promise<Role> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    const role = await this.roleRepository.find({
      by: "id",
      roleId: params.roleId,
      organizationId: params.organizationId,
    });

    if (!role) {
      throw new ResourceError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    return role;
  }

  async getRoleByName(params: {
    organizationId: OrganizationId;
    name: string;
    actorId?: ActorId;
  }): Promise<Role> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    const role = await this.roleRepository.find({
      by: "name",
      name: params.name,
      organizationId: params.organizationId,
    });

    if (!role) {
      throw new ResourceError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    return role;
  }

  async getRoles(organizationId: OrganizationId, actorId?: ActorId): Promise<Role[]> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: organizationId,
      },
      actorId,
    );

    const result = await this.roleRepository.findMany({
      organizationId,
    });

    return result.items;
  }

  async createRole(params: {
    organizationId: OrganizationId;
    actorId: ActorId;
    data: {
      name: string;
      permissions: CreateRoleData["permissions"];
    };
  }): Promise<Role> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    const existingRole = await this.roleRepository.find({
      by: "name",
      name: params.data.name,
      organizationId: params.organizationId,
    });

    if (existingRole) {
      throw new ResourceError(ERROR_CODES.ROLE_ALREADY_EXISTS);
    }

    const role = await this.roleRepository.create({
      organizationId: params.organizationId,
      actorId: params.actorId,
      isSystemRole: false,
      name: params.data.name,
      permissions: params.data.permissions,
    });

    logger.info(
      { event: "role.create.success", roleId: role.id, actorId: params.actorId },
      "Role created successfully",
    );
    return role;
  }

  async updateRole(params: {
    organizationId: OrganizationId;
    roleId: RoleId;
    actorId: ActorId;
    data: UpdateRoleData;
  }): Promise<Role> {
    const role = await this.getRole(params);

    if (role.isSystemRole) {
      throw new ResourceError(ERROR_CODES.ROLE_SYSTEM_PROTECTED);
    }

    const updatedRole = await this.roleRepository.update(
      {
        roleId: params.roleId,
        organizationId: params.organizationId,
      },
      params.data,
    );

    if (!updatedRole) {
      throw new InternalServerError();
    }

    logger.info(
      { event: "role.update.success", roleId: updatedRole.id, actorId: params.actorId },
      "Role updated successfully",
    );
    return updatedRole;
  }

  async deleteRole(params: {
    organizationId: OrganizationId;
    roleId: RoleId;
    actorId: ActorId;
  }): Promise<Role> {
    const role = await this.getRole(params);

    if (role.isSystemRole) {
      throw new ResourceError(ERROR_CODES.ROLE_SYSTEM_PROTECTED);
    }

    const deletedRole = await this.roleRepository.softDelete({
      roleId: params.roleId,
      organizationId: params.organizationId,
    });

    if (!deletedRole) {
      throw new ResourceError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    logger.info(
      { event: "role.delete.success", roleId: deletedRole.id, actorId: params.actorId },
      "Role deleted successfully",
    );
    return deletedRole;
  }
}
