import type {
  ActorId,
  CreateRoleData,
  MemberRepository,
  OrganizationId,
  Role,
  RoleId,
  RoleRepository,
  UpdateRoleData,
} from "@authcore/database";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import { logger } from "@authcore/logger";
import type { AuthorizationService } from "../authorization/authorization.service.js";
import { AppError } from "../../../errors/app-error.js";
import type { PermissionId } from "@authcore/database/dist/repositories/permission/permission.types.js";

export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly memberRepository: MemberRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  // ─────────────────────────────────────────────

  async get(params: {
    organizationId: OrganizationId;
    roleId: RoleId;
    actorId?: ActorId;
  }): Promise<Role> {
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId: params.organizationId,
      },
      params.actorId,
    );

    const role = await this.roleRepository.find({
      by: "id",
      roleId: params.roleId,
      organizationId: params.organizationId,
    });

    if (!role) {
      throw new AppError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    return role;
  }

  async getByName(params: {
    organizationId: OrganizationId;
    name: string;
    actorId?: ActorId;
  }): Promise<Role> {
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId: params.organizationId,
      },
      params.actorId,
    );

    const role = await this.roleRepository.find({
      by: "name",
      name: params.name,
      organizationId: params.organizationId,
    });

    if (!role) {
      throw new AppError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    return role;
  }

  async getByOrganizationId(
    organizationId: OrganizationId,
    actorId?: ActorId,
  ): Promise<Role[]> {
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId,
      },
      actorId,
    );

    const result = await this.roleRepository.findMany({
      organizationId,
    });

    return result.items;
  }

  async create(params: {
    organizationId: OrganizationId;
    actorId: ActorId;
    data: {
      name: string;
      permissionIds: CreateRoleData["permissionIds"];
    };
  }): Promise<Role> {
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId: params.organizationId,
      },
      params.actorId,
    );

    const existingRole = await this.roleRepository.find({
      by: "name",
      name: params.data.name,
      organizationId: params.organizationId,
    });

    if (existingRole) {
      throw new AppError(ERROR_CODES.ROLE_ALREADY_EXISTS);
    }

    const role = await this.roleRepository.create({
      organizationId: params.organizationId,
      createdBy: params.actorId,
      name: params.data.name,
      permissionIds: params.data.permissionIds,
    });

    logger.info(
      { event: "role.create.success", roleId: role.id, actorId: params.actorId },
      "Role created successfully",
    );
    return role;
  }

  async update(params: {
    organizationId: OrganizationId;
    roleId: RoleId;
    actorId: ActorId;
    data: UpdateRoleData;
  }): Promise<Role> {
    const updatedRole = await this.roleRepository.update(
      {
        by: "id",
        roleId: params.roleId,
        organizationId: params.organizationId,
      },
      params.data,
    );

    if (!updatedRole) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    logger.info(
      { event: "role.update.success", roleId: updatedRole.id, actorId: params.actorId },
      "Role updated successfully",
    );
    return updatedRole;
  }

  async addPermissions(params: {
    organizationId: OrganizationId;
    actorId: ActorId;
    roleId: RoleId;
    permissionIds: PermissionId[];
  }): Promise<Role> {
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId: params.organizationId,
      },
      params.actorId,
    );

    const existingRole = await this.roleRepository.find({
      by: "id",
      roleId: params.roleId,
      organizationId: params.organizationId,
    });

    if (existingRole) {
      throw new AppError(ERROR_CODES.ROLE_ALREADY_EXISTS);
    }
    const updatedRole = await this.roleRepository.addPermissions(
      { by: "id", roleId: params.roleId, organizationId: params.organizationId },
      params.permissionIds,
    );
    if (!updatedRole) throw new AppError("INTERNAL_SERVER_ERROR");

    return updatedRole;
  }
  async removePermissions(params: {
    organizationId: OrganizationId;
    actorId: ActorId;
    roleId: RoleId;
    permissionIds: PermissionId[];
  }): Promise<Role> {
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId: params.organizationId,
      },
      params.actorId,
    );

    const existingRole = await this.roleRepository.find({
      by: "id",
      roleId: params.roleId,
      organizationId: params.organizationId,
    });

    if (existingRole) {
      throw new AppError(ERROR_CODES.ROLE_ALREADY_EXISTS);
    }
    const updatedRole = await this.roleRepository.removePermissions(
      { by: "id", roleId: params.roleId, organizationId: params.organizationId },
      params.permissionIds,
    );
    if (!updatedRole) throw new AppError("INTERNAL_SERVER_ERROR");

    return updatedRole;
  }

  async softDelete(params: {
    organizationId: OrganizationId;
    roleId: RoleId;
    actorId: ActorId;
  }): Promise<Role> {
    const isUsed = await this.memberRepository.exists({
      organizationId: params.organizationId,
      roleId: params.roleId,
      status: ["active", "invited"],
    });

    if (isUsed) throw new AppError("API_KEY_NOT_FOUND"); //todo make error code for it.
    const deletedRole = await this.roleRepository.softDelete({
      by: "id",
      roleId: params.roleId,
      organizationId: params.organizationId,
    });

    if (!deletedRole) {
      throw new AppError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    logger.info(
      { event: "role.delete.success", roleId: deletedRole.id, actorId: params.actorId },
      "Role deleted successfully",
    );
    return deletedRole;
  }
}
