import type { MemberStatus } from "../../models/member.model.js";
import type { OrganizationId } from "../organization/organization.types.js";
import type { RoleId } from "../role/role.types.js";
import type { ActorId, CreatedBy, UserId } from "../user/user.types.js";

export type MemberId = string & {
  readonly __brand: "MemberId";
};

export const asMemberId = (id: string): MemberId => id as MemberId;

export type Member = {
  id: MemberId;
  organizationId: OrganizationId;
  userId: UserId;
  roleId: RoleId;
  status: MemberStatus;
  invitedBy: CreatedBy;
  joinedAt?: Date;
  isOwner: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMemberData = Pick<
  Member,
  "organizationId" | "userId" | "roleId" | "status" | "joinedAt"
> & {
  actorId: ActorId;
  isOwner?: boolean;
};

export type UpdateMemberData = Partial<
  Pick<Member, "roleId" | "status" | "isOwner" | "joinedAt">
>;

export type ExistCriteria = {
  organizationId: OrganizationId;
  roleId: RoleId;
  status: MemberStatus[];
};
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
