import type { OrganizationId } from "../organization/organization.types.js";

export type RoleId = string & {
  readonly __brand: "RoleId";
};

export const asRoleId = (id: string): RoleId => id as RoleId;

export type Role = {
  id: RoleId;
  organizationId: OrganizationId;
  name: string;
  isSystemRole: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateRoleData = {
  organizationId: OrganizationId;
  name: string;
  isSystemRole?: boolean;
};

export type UpdateRoleData = {
  name?: string;
};

export type FindRoleCriteria =
  | {
      type: "id";
      value: RoleId;
    }
  | {
      type: "name";
      organizationId: OrganizationId;
      name: string;
    }
  | {
      type: "organization";
      organizationId: OrganizationId;
    };
