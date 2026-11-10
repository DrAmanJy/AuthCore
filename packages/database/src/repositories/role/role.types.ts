import type { OrganizationId } from "../organization/organization.types.js";
import type { Permission } from "../permission/permission.types.js";
import type { ActorId, CreatedBy } from "../user/user.types.js";

export type RoleId = string & {
  readonly __brand: "RoleId";
};

export const asRoleId = (id: string): RoleId => id as RoleId;

export type Role = {
  id: RoleId;
  organizationId: OrganizationId;
  name: string;
  createdBy: CreatedBy;
  isSystemRole: boolean;
  permissions: Permission["key"][];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateRoleData = Pick<Role, "name" | "isSystemRole" | "permissions"> & {
  organizationId: OrganizationId;
  actorId: ActorId;
};

export type UpdateRoleData = {
  name?: string;
  permissions?: Permission["key"][];
};

export type FindRoleCriteria =
  | {
      by: "id";
      roleId: RoleId;
      organizationId: OrganizationId;
    }
  | {
      by: "name";
      name: string;
      organizationId: OrganizationId;
    };

export interface FindManyRolesCriteria {
  organizationId: OrganizationId;
  isSystemRole?: boolean;
}

export interface UpdateRoleCriteria {
  roleId: RoleId;
  organizationId: OrganizationId;
}

export interface DeleteRoleCriteria {
  roleId: RoleId;
  organizationId: OrganizationId;
}
