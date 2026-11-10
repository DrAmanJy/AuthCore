import type { OrganizationId } from "../organization/organization.types.js";
import type { RoleId } from "../role/role.types.js";
import type { ActorId, CreatedBy, UserId } from "../user/user.types.js";

export type MemberId = string & {
  readonly __brand: "MemberId";
};

export const asMemberId = (id: string): MemberId => id as MemberId;

export const _MEMBER_STATUSES = ["invited", "active", "suspended", "removed"] as const;

export type MemberStatus = (typeof _MEMBER_STATUSES)[number];

export type Member = {
  id: MemberId;
  organizationId: OrganizationId;
  userId: UserId;
  roleId: RoleId;
  status: MemberStatus;
  createdBy: CreatedBy;
  joinedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMemberData = {
  organizationId: OrganizationId;
  userId: UserId;
  roleId: RoleId;
  actorId: ActorId;
};

export type UpdateMemberData = Partial<Pick<Member, "roleId" | "status">>;

export type FindMemberCriteria =
  | {
      by: "id";
      memberId: MemberId;
      organizationId: OrganizationId;
    }
  | {
      by: "user";
      userId: UserId;
      organizationId: OrganizationId;
    };

export interface FindManyMembersCriteria {
  organizationId: OrganizationId;
  roleId?: RoleId;
  status?: MemberStatus;
}

export interface UpdateMemberCriteria {
  memberId: MemberId;
  organizationId: OrganizationId;
}

export interface DeleteMemberCriteria {
  memberId: MemberId;
  organizationId: OrganizationId;
}
