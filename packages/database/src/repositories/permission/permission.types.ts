import type { RoleId } from "../role/role.types.js";
import type { CreatedBy } from "../user/user.types.js";

export type PermissionId = string & {
  readonly __brand: "PermissionId";
};

export const asPermissionId = (id: string): PermissionId => id as PermissionId;

export type Permission = {
  id: PermissionId;
  key: string;
  description: string;
  roleId: RoleId;
  deletedAt?: Date;
  createdBy: CreatedBy;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePermission = Pick<Permission, "key" | "description" | "roleId">;
export type UpdatePermission = Omit<CreatePermission, "roleId">;
