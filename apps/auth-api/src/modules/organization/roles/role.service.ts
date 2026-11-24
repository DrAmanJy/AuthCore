import type {
  ActorId,
  CreateRoleData,
  FindManyOptions,
  MemberRepository,
  OrganizationId,
  PaginatedResult,
  Role,
  RoleId,
  RoleRepository,
  UpdateRoleData,
} from "@authcore/database";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import { logger } from "@authcore/logger";
import { AppError } from "../../../errors/app-error.js";
import type { PermissionId } from "@authcore/database/dist/repositories/permission/permission.types.js";

export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly memberRepository: MemberRepository,
  ) {}

  // ─────────────────────────────────────────────

  async get(params: {
    organizationId: OrganizationId;
    roleId: RoleId;
    actorId?: ActorId;
  }): Promise<Role> {
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
    options?: FindManyOptions,
    _actorId?: ActorId,
  ): Promise<PaginatedResult<Role>> {
    return this.roleRepository.findMany(
      {
        organizationId,
      },
      options,
    );
  }

  async create(params: {
    organizationId: OrganizationId;
    actorId: ActorId;
    data: {
      name: string;
      permissionIds: CreateRoleData["permissionIds"];
    };
  }): Promise<Role> {
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
    const updatedRole = await this.roleRepository.addPermissions(
      { by: "id", roleId: params.roleId, organizationId: params.organizationId },
      params.permissionIds,
    );
    if (!updatedRole) throw new AppError(ERROR_CODES.ROLE_NOT_FOUND);

    return updatedRole;
  }
  async removePermissions(params: {
    organizationId: OrganizationId;
    actorId: ActorId;
    roleId: RoleId;
    permissionIds: PermissionId[];
  }): Promise<Role> {
    const updatedRole = await this.roleRepository.removePermissions(
      { by: "id", roleId: params.roleId, organizationId: params.organizationId },
      params.permissionIds,
    );
    if (!updatedRole) throw new AppError(ERROR_CODES.ROLE_NOT_FOUND);

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

    if (isUsed) throw new AppError(ERROR_CODES.ROLE_IN_USE);
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
