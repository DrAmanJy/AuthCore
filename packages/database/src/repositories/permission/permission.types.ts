import type { RoleId } from "../role/role.types.js";
import type { ActorId, CreatedBy } from "../user/user.types.js";
import type { OrganizationId } from "../organization/organization.types.js";

export type PermissionId = string & {
  readonly __brand: "PermissionId";
};

export const asPermissionId = (id: string): PermissionId => id as PermissionId;

export type Permission = {
  id: PermissionId;
  key: string;
  organizationId: OrganizationId;
  description: string;
  roleId: RoleId;
  deletedAt?: Date;
  createdBy: CreatedBy;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePermissionData = {
  key: string;
  description: string;
  roleId: RoleId;
  organizationId: OrganizationId;
  actorId: ActorId;
};

export type UpdatePermissionData = {
  description?: string;
  roleId?: RoleId;
};

export type FindPermissionCriteria =
  | {
      by: "id";
      permissionId: PermissionId;
      organizationId: OrganizationId;
    }
  | {
      by: "key";
      key: string;
      organizationId: OrganizationId;
    };

export interface FindManyPermissionsCriteria {
  organizationId: OrganizationId;
  roleId?: RoleId;
}

export interface UpdatePermissionCriteria {
  permissionId: PermissionId;
  organizationId: OrganizationId;
}

export interface DeletePermissionCriteria {
  permissionId: PermissionId;
  organizationId: OrganizationId;
}
