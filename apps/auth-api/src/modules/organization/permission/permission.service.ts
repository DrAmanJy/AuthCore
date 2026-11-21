import type {
  OrganizationId,
  PermissionRepository,
  Permission,
  RoleId,
} from "@authcore/database";
import type {
  CreatePermissionData,
  PermissionId,
} from "@authcore/database/dist/repositories/permission/permission.types.js";
import { AppError } from "../../../errors/app-error.js";

export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async get(
    permissionId: PermissionId,
    organizationId: OrganizationId,
  ): Promise<Permission> {
    const permission = await this.permissionRepository.find({
      by: "id",
      permissionId,
      organizationId,
    });
    if (!permission) throw new AppError("PERMISSION_NOT_FOUND");
    return permission;
  }

  async getRoles(roleId: RoleId, organizationId: OrganizationId): Promise<Permission[]> {
    const permissions = await this.permissionRepository.findMany({
      roleId,
      organizationId,
    });
    return permissions.items;
  }

  async getOrganizations(organizationId: OrganizationId): Promise<Permission[]> {
    const permissions = await this.permissionRepository.findMany({ organizationId });
    const systemPermissions = await this.permissionRepository.findSystemPermissions();
    systemPermissions.forEach(permission => permissions.items.push(permission));
    return permissions.items;
  }

  async create(params: Omit<CreatePermissionData, "scope">) {
    const permission = await this.permissionRepository.create({
      scope: "organization",
      ...params,
    });

    return permission;
  }

  async update(
    permissionId: PermissionId,
    organizationId: OrganizationId,
    description?: string,
    key?: string,
  ) {
    const permission = await this.permissionRepository.update(
      { by: "id", permissionId, organizationId },
      { description, key },
    );

    if (!permission) throw new AppError("PERMISSION_NOT_FOUND");

    return permission;
  }

  async softDelete(
    permissionId: PermissionId,
    organizationId: OrganizationId,
  ): Promise<Permission> {
    const permission = await this.permissionRepository.softDelete({
      by: "id",
      permissionId,
      organizationId,
    });

    if (!permission) throw new AppError("PERMISSION_NOT_FOUND");
    return permission;
  }

  async delete(
    permissionId: PermissionId,
    organizationId: OrganizationId,
  ): Promise<void> {
    const permission = await this.permissionRepository.delete({
      by: "id",
      permissionId,
      organizationId,
    });

    if (!permission) throw new AppError("PERMISSION_NOT_FOUND");
  }
}
