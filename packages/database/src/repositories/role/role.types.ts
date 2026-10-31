import type { OrganizationId } from "../organization/organization.types.js";
import type { CreatedBy } from "../user/user.types.js";

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
  permissions: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateRoleData = Pick<Role, "name" | "isSystemRole" | "permissions">;

export type UpdateRoleData = Omit<CreateRoleData, "isSystemRole">;

export type FindRoleCriteria =
  | {
      type: "id";
      value: RoleId;
      orgId: OrganizationId;
    }
  | {
      type: "name";
      value: string;
      orgId: OrganizationId;
    }
  | {
      type: "organization";
      value: OrganizationId;
    }
  | {
      type: "all";
    };
