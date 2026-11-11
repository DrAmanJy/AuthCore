import type { RoleId } from "../role/role.types.js";
import type { ActorId, CreatedBy } from "../user/user.types.js";
import type { OrganizationId } from "../organization/organization.types.js";
import type { PermissionScope } from "../../models/permission.model.js";

export type PermissionId = string & {
  readonly __brand: "PermissionId";
};

export const asPermissionId = (id: string): PermissionId => id as PermissionId;

export type Permission = {
  id: PermissionId;
  scope: PermissionScope;
  organizationId?: OrganizationId;
  key: string;
  description: string;
  createdBy?: CreatedBy;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePermissionData = Pick<
  Permission,
  "organizationId" | "key" | "description"
> & { scope?: PermissionScope; createdBy?: ActorId };

export type UpdatePermissionData = Pick<CreatePermissionData, "description" | "key">;

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
