import type { OrganizationId } from "../organization/organization.types.js";
import type { ActorId, UserId } from "../user/user.types.js";
import type {
  CreateOrganizationMemberData,
  OrganizationMember,
  OrganizationMemberId,
  UpdateOrganizationMemberData,
} from "./organization-member.types.js";

export interface OrganizationMemberRepository {
  findById(memberId: OrganizationMemberId): Promise<OrganizationMember | null>;

  findByUser(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<OrganizationMember | null>;

  findByOrganization(organizationId: OrganizationId): Promise<OrganizationMember[]>;

  findAll(): Promise<OrganizationMember[]>;

  create(
    actorId: ActorId,
    organizationId: OrganizationId,
    data: CreateOrganizationMemberData,
  ): Promise<OrganizationMember>;

  update(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    data: UpdateOrganizationMemberData,
  ): Promise<OrganizationMember | null>;

  softDelete(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ): Promise<OrganizationMember | null>;
}
