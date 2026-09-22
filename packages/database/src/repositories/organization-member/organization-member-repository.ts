import type { OrganizationId } from "../session/session.types.js";
import type { UserId } from "../user/user.types.js";
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

  create(data: CreateOrganizationMemberData): Promise<OrganizationMember>;

  update(
    memberId: OrganizationMemberId,
    data: UpdateOrganizationMemberData,
  ): Promise<OrganizationMember | null>;

  remove(memberId: OrganizationMemberId): Promise<OrganizationMember | null>;
}
