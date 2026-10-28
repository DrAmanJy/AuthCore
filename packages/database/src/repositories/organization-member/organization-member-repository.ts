import type { OrganizationId } from "../organization/organization.types.js";
import type { ActorId, UserId } from "../user/user.types.js";
import type {
  CreateMemberData,
  Member,
  MemberId,
  UpdateMemberData,
} from "./organization-member.types.js";

export interface MemberRepository {
  find(criteria: {
    type: "id";
    value: MemberId;
    orgId: OrganizationId;
  }): Promise<Member | null>;

  find(criteria: {
    type: "user";
    value: UserId;
    orgId: OrganizationId;
  }): Promise<Member | null>;

  find(criteria: { type: "organization"; value: OrganizationId }): Promise<Member[]>;

  find(criteria: { type: "all" }): Promise<Member[]>;

  create(
    actorId: ActorId,
    organizationId: OrganizationId,
    data: CreateMemberData,
  ): Promise<Member>;

  update(
    organizationId: OrganizationId,
    memberId: MemberId,
    data: UpdateMemberData,
  ): Promise<Member | null>;

  softDelete(organizationId: OrganizationId, memberId: MemberId): Promise<Member | null>;
}
