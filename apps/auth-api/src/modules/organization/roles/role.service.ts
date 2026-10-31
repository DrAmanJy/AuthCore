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

  // async getMemberPermissions(
  //   organizationId: OrganizationId,
  //   userId: UserId,
  // ): Promise<string[]> {
  //   const member = await this.getMemberByUser(organizationId, userId);
  //   if (member.status !== "active") {
  //     return [];
  //   }

  //   const role = await this.roleRepository.findById(member.roleId);
  //   if (!role) {
  //     return [];
  //   }

  //   return role.permissions ?? [];
  // }

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
      type: "id",
      value: params.roleId,
      orgId: params.organizationId,
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
      type: "name",
      value: params.name,
      orgId: params.organizationId,
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

    return this.roleRepository.find({
      type: "organization",
      value: organizationId,
    });
  }

  async createRole(params: {
    organizationId: OrganizationId;
    actorId: ActorId;
    data: CreateRoleData;
  }): Promise<Role> {
    await this.authorizationService.getValidOrganization({
      type: "id",
      value: params.organizationId,
    });

    const existingRole = await this.roleRepository.find({
      type: "name",
      value: params.data.name,
      orgId: params.organizationId,
    });

    if (existingRole) {
      throw new ResourceError(ERROR_CODES.ROLE_ALREADY_EXISTS);
    }

    const role = await this.roleRepository.create(
      params.organizationId,
      params.actorId,
      params.data,
    );

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
      params.organizationId,
      params.roleId,
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

    const deletedRole = await this.roleRepository.softDelete(
      params.organizationId,
      params.roleId,
    );

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
