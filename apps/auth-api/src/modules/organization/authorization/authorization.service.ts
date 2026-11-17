import type {
  ApiKeyRepository,
  Member,
  MemberRepository,
  Role,
  RoleRepository,
} from "@authcore/database";
import type {
  Organization,
  OrganizationId,
  OrganizationRepository,
  FindOrganizationCriteria,
  UserId,
  ApiKey,
} from "@authcore/database";
import { asKeyHash } from "@authcore/database";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import { hashString } from "../../../utils/hashString.js";
import { AppError } from "../../../errors/app-error.js";
import type { PermissionKey } from "@authcore/contracts";

export interface OrgContext {
  organization: Organization;
  member: Member;
  role: Role;
  isOwner: boolean;
  permissions: Set<string>;
}

export class AuthorizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly memberRepository: MemberRepository,
    private readonly roleRepository: RoleRepository,
  ) {}
  async getMemberContext(
    organizationId: OrganizationId,
    userId: UserId,
  ): Promise<OrgContext> {
    const organization = await this.getValidOrganization({ by: "id", organizationId });

    const member = await this.memberRepository.find({
      by: "user",
      userId,
      organizationId,
    });

    if (!member) {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND);
    }

    if (member.status !== "active") {
      if (member.status === "suspended")
        throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_SUSPENDED);
      if (member.status === "invited")
        throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_INVITATION_PENDING);
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_ACCESS_DENIED);
    }

    const role = await this.roleRepository.find({
      by: "id",
      roleId: member.roleId,
      organizationId,
    });

    if (!role) {
      throw new AppError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    return {
      organization,
      member,
      role,
      isOwner: member.isOwner,
      permissions: new Set(role.permissions),
    };
  }

  hasPermission(context: OrgContext, requiredPermission: PermissionKey): boolean {
    if (context.isOwner) return true;
    return context.permissions.has(requiredPermission);
  }

  async getValidOrganization(
    criteria: FindOrganizationCriteria,
    owner?: UserId,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.find(criteria);

    if (!organization) {
      throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
    }

    if (organization.status !== "active") {
      throw new AppError(ERROR_CODES.ORGANIZATION_INACTIVE);
    }
    if (owner && organization.createdBy.id !== owner) {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_ACCESS_DENIED);
    }
    return organization;
  }

  async getByKey(key: string): Promise<ApiKey> {
    const keyHash = asKeyHash(hashString(key));

    const apiKey = await this.apiKeyRepository.find({
      by: "keyHash",
      keyHash,
    });

    if (!apiKey) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    await this.getValidOrganization({
      by: "id",
      organizationId: apiKey.organizationId,
    });

    return apiKey;
  }
}
