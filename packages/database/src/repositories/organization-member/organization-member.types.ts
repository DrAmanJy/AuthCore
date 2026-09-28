import type { OrganizationId } from "../organization/organization.types.js";
import type { RoleId } from "../role/role.types.js";
import type { CreatedBy, UserId } from "../user/user.types.js";

export type OrganizationMemberId = string & {
  readonly __brand: "OrganizationMemberId";
};

export const asOrganizationMemberId = (id: string): OrganizationMemberId =>
  id as OrganizationMemberId;

export const ORGANIZATION_MEMBER_STATUSES = [
  "invited",
  "active",
  "suspended",
  "removed",
] as const;

export type OrganizationMemberStatus = (typeof ORGANIZATION_MEMBER_STATUSES)[number];

export type OrganizationMember = {
  id: OrganizationMemberId;
  organizationId: OrganizationId;
  userId: UserId;
  roleId: RoleId;
  status: OrganizationMemberStatus;
  createdBy: CreatedBy;
  joinedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateOrganizationMemberData = {
  userId: UserId;
  roleId: RoleId;
};

export type UpdateOrganizationMemberData = {
  roleId?: RoleId;
  status?: OrganizationMemberStatus;
};

export type FindOrganizationMemberCriteria =
  | {
      type: "id";
      organizationId: OrganizationId;
      value: OrganizationMemberId;
    }
  | {
      type: "user";
      organizationId: OrganizationId;
      userId: UserId;
    };
