import { DEFAULT_ROLE_PERMISSIONS, SYSTEM_ROLE_NAMES } from "./role-defaults.js";
import type {
  ActorId,
  ApiKey,
  ApiKeyId,
  CreateOrganizationData,
  CreateOrganizationMemberData,
  CreateRoleData,
  Organization,
  OrganizationId,
  OrganizationMember,
  OrganizationMemberId,
  OrganizationMemberRepository,
  OrganizationRepository,
  Role,
  RoleId,
  RoleRepository,
  UpdateOrganizationData,
  UpdateOrganizationMemberData,
  UpdateRoleData,
  UserId,
} from "@authcore/database";
import { ResourceError } from "../../errors/resource-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import { InternalServerError } from "../../errors/internal-server-error.js";
import { logger } from "@authcore/logger";
import type { ApiKeyService } from "../api-keys/api-key.service.js";
import { randomBytes } from "crypto";

export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly organizationMemberRepository: OrganizationMemberRepository,
    private readonly roleRepository: RoleRepository,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  // ─────────────────────────────────────────────
  // Organization
  // ─────────────────────────────────────────────

  async getOrganization(organizationId: OrganizationId): Promise<Organization> {
    const organization = await this.organizationRepository.find({
      type: "id",
      value: organizationId,
    });

    return this.requireActiveOrganization(organization);
  }

  async getOrganizationBySlug(slug: string): Promise<Organization> {
    const organization = await this.organizationRepository.find({
      type: "slug",
      value: slug,
    });

    return this.requireActiveOrganization(organization);
  }

  async getOrganizationsByActor(actorId: ActorId): Promise<Organization[]> {
    return this.organizationRepository.find({ type: "actor", value: actorId });
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return this.organizationRepository.find({ type: "all" });
  }

    async createOrganization(
    actorId: ActorId,
    data: CreateOrganizationData,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.create(actorId, data);

    // Seed default roles and assign creator as Owner
    let ownerRole: Role | null = null;
    for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = await this.roleRepository.create(organization.id, actorId, {
        name: roleName,
        isSystemRole: true,
        permissions,
      });
      if (roleName === SYSTEM_ROLE_NAMES.OWNER) {
        ownerRole = role;
      }
    }

    if (ownerRole) {
      await this.organizationMemberRepository.create(actorId, organization.id, {
        userId: asUserId(actorId),
        roleId: ownerRole.id,
        status: "active",
      });
    }

    logger.info(
      { event: "organization.create.success", actorId, orgId: organization.id },
      "Organization created and creator assigned as Owner",
    );
    return organization;
  }

  async updateOrganization(
    organizationId: OrganizationId,
    actorId: ActorId,
    data: UpdateOrganizationData,
  ): Promise<Organization> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    const updatedOrganization = await this.organizationRepository.update(
      organizationId,
      actorId,
      data,
    );

    if (!updatedOrganization) {
      throw new InternalServerError();
    }

    logger.info(
      {
        event: "organization.update.success",
        actorId,
        organizationId: organization.id,
      },
      "Organization updated successfully",
    );

    return updatedOrganization;
  }

  async deleteOrganization(
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<Organization> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    const organizationDeleted = await this.organizationRepository.softDelete(
      { type: "id", value: organizationId },
      actorId,
    );

    if (!organizationDeleted) {
      throw new InternalServerError();
    }
    logger.info(
      { event: "organization.delete.success", actorId, orgId: organization.id },
      "Organization deleted successfully",
    );

    return organizationDeleted;
  }

  // ─────────────────────────────────────────────
  // Members
  // ─────────────────────────────────────────────

  async getMember(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ): Promise<OrganizationMember> {
    await this.requireActiveOrganizationById(organizationId);

    const member = await this.organizationMemberRepository.findById(memberId);

    return this.requireOrganizationMember(member, organizationId);
  }

  async getMemberByUser(
    organizationId: OrganizationId,
    userId: UserId,
  ): Promise<OrganizationMember> {
    await this.requireActiveOrganizationById(organizationId);

    const member = await this.organizationMemberRepository.findByUser(
      userId,
      organizationId,
    );

    if (!member) {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND);
    }

    return member;
  }

  async getMembers(organizationId: OrganizationId): Promise<OrganizationMember[]> {
    await this.requireActiveOrganizationById(organizationId);

    return this.organizationMemberRepository.findByOrganization(organizationId);
  }

  async addMember(
    organizationId: OrganizationId,
    actorId: ActorId,
    data: CreateOrganizationMemberData,
  ): Promise<OrganizationMember> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    const existingMember = await this.organizationMemberRepository.findByUser(
      data.userId,
      organizationId,
    );

    if (existingMember) {
      logger.warn(
        {
          event: "organization.member.create.failed",
          reason: "organization_already_exists",
          actorId,
          organizationId,
        },
        "Failed to create member: already exists",
      );
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_ALREADY_EXISTS);
    }

    const member = await this.organizationMemberRepository.create(
      actorId,
      organizationId,
      data,
    );
    logger.info(
      { event: "organization.member.create.success", actorId, memberId: member.id },
      "Organization member created successfully",
    );
    return member;
  }

  async updateMember(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    actorId: ActorId,
    data: UpdateOrganizationMemberData,
  ): Promise<OrganizationMember> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    const member = await this.getMember(organizationId, memberId);

    this.validateMemberUpdate(member, data);

    const updatedMember = await this.organizationMemberRepository.update(
      organizationId,
      memberId,
      data,
    );

    if (!updatedMember) {
      throw new InternalServerError();
    }

    logger.info(
      {
        event: "organization.member.update.success",
        actorId,
        memberId: updatedMember.id,
      },
      "Organization member updated successfully",
    );
    return updatedMember;
  }

  
  private async ensureNotLastOwner(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ): Promise<void> {
    const member = await this.organizationMemberRepository.findById(memberId);
    if (!member) return;

    const role = await this.roleRepository.findById(member.roleId);
    if (!role || role.name !== SYSTEM_ROLE_NAMES.OWNER) {
      return;
    }

    const allMembers = await this.organizationMemberRepository.findByOrganization(organizationId);
    const activeOwnerCount = allMembers.filter(
      m => m.status === "active" && m.roleId === member.roleId && m.id !== memberId
    ).length;

    if (activeOwnerCount === 0) {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_LAST_OWNER_PROTECTION);
    }
  }

  async removeMember(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    actorId: ActorId,
  ): Promise<OrganizationMember> {
    const member = await this.getMember(organizationId, memberId);

    if (member.status !== "active") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }
    await this.ensureNotLastOwner(organizationId, memberId);

    return this.updateMember(organizationId, memberId, actorId, {
      status: "removed",
    });
  }

  async suspendMember(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    actorId: ActorId,
  ): Promise<OrganizationMember> {
    const member = await this.getMember(organizationId, memberId);

    if (member.status !== "active") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    return this.updateMember(organizationId, memberId, actorId, {
      status: "suspended",
    });
  }

  async activateMember(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    actorId: ActorId,
  ): Promise<OrganizationMember> {
    const member = await this.getMember(organizationId, memberId);

    if (member.status !== "suspended") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_SUSPENDED);
    }

    return this.updateMember(organizationId, memberId, actorId, {
      status: "active",
    });
  }

  // ─────────────────────────────────────────────
  // Roles

  async getMemberPermissions(
    organizationId: OrganizationId,
    userId: UserId,
  ): Promise<string[]> {
    const member = await this.getMemberByUser(organizationId, userId);
    if (member.status !== "active") {
      return [];
    }

    const role = await this.roleRepository.findById(member.roleId);
    if (!role) {
      return [];
    }

    return role.permissions ?? [];
  }

  // ─────────────────────────────────────────────

  async getRole(organizationId: OrganizationId, roleId: RoleId): Promise<Role> {
    await this.requireActiveOrganizationById(organizationId);

    const role = await this.roleRepository.findById(roleId);

    return this.requireOrganizationRole(role, organizationId);
  }

  async getRoleByName(organizationId: OrganizationId, name: string): Promise<Role> {
    await this.requireActiveOrganizationById(organizationId);

    const role = await this.roleRepository.findByName(organizationId, name);

    if (!role) {
      throw new ResourceError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    return role;
  }

  async getRoles(organizationId: OrganizationId): Promise<Role[]> {
    await this.requireActiveOrganizationById(organizationId);

    return this.roleRepository.findByOrganization(organizationId);
  }

  async createRole(
    organizationId: OrganizationId,
    actorId: ActorId,
    data: CreateRoleData,
  ): Promise<Role> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    const existingRole = await this.roleRepository.findByName(organizationId, data.name);

    if (existingRole) {
      throw new ResourceError(ERROR_CODES.ROLE_ALREADY_EXISTS);
    }

    const role = await this.roleRepository.create(organizationId, actorId, data);

    logger.info(
      { event: "role.create.success", roleId: role.id, actorId },
      "Role created successfully",
    );
    return role;
  }

  async updateRole(
    organizationId: OrganizationId,
    roleId: RoleId,
    actorId: ActorId,
    data: UpdateRoleData,
  ): Promise<Role> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    const role = await this.getRole(organizationId, roleId);

    this.requireModifiableRole(role);

    const updatedRole = await this.roleRepository.update(organizationId, roleId, data);

    if (!updatedRole) {
      throw new InternalServerError();
    }

    logger.info(
      { event: "role.update.success", roleId: updatedRole.id, actorId },
      "Role updated successfully",
    );
    return updatedRole;
  }

  async deleteRole(
    organizationId: OrganizationId,
    roleId: RoleId,
    actorId: ActorId,
  ): Promise<Role> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    const role = await this.getRole(organizationId, roleId);

    this.requireModifiableRole(role);

    const deletedRole = await this.roleRepository.softDelete(organizationId, roleId);

    if (!deletedRole) {
      throw new ResourceError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    logger.info(
      { event: "role.delete.success", roleId: deletedRole.id, actorId },
      "Role deleted successfully",
    );
    return deletedRole;
  }

  // ─────────────────────────────────────────────
  // Api Key
  // ─────────────────────────────────────────────

  async getApiKeyById(organizationId: OrganizationId, id: ApiKeyId): Promise<ApiKey> {
    const organization = await this.requireActiveOrganizationById(organizationId);
    const apiKey = await this.apiKeyService.getById(id);
    if (apiKey.organizationId !== organization.id) {
      throw new ResourceError(ERROR_CODES.API_KEY_UNAUTHORIZED);
    }
    return apiKey;
  }

  async getApiKeyByKey(organizationId: OrganizationId, key: string): Promise<ApiKey> {
    const organization = await this.requireActiveOrganizationById(organizationId);
    const apiKey = await this.apiKeyService.getByKey(key);
    if (apiKey.organizationId !== organization.id) {
      throw new ResourceError(ERROR_CODES.API_KEY_UNAUTHORIZED);
    }
    return apiKey;
  }

  async getAllApiKeyByOrganizationId(
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<ApiKey[]> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    const apiKeys = await this.apiKeyService.getALl(organizationId);

    return apiKeys;
  }

  async createApiKey(organizationId: OrganizationId, actorId: ActorId): Promise<string> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    const apiKey = `ac_live_${randomBytes(32).toString("hex")}`;

    await this.apiKeyService.create(organization.name, organizationId, apiKey, actorId);

    return apiKey;
  }

  async revokeApiKeyByKey(
    organizationId: OrganizationId,
    key: string,
    actorId: ActorId,
  ): Promise<boolean> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    await this.apiKeyService.revokeByKey(key, organizationId, actorId);

    return true;
  }

  async markUseApiKeyByKey(
    key: string,
    organizationId: OrganizationId,
  ): Promise<boolean> {
    await this.requireActiveOrganizationById(organizationId);

    await this.apiKeyService.markUsedByKey(key, organizationId);

    return true;
  }

  async deleteApiKeyById(
    apiKeyId: ApiKeyId,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<ApiKey> {
    const apiKey = await this.apiKeyService.softDelete(
      { type: "id", value: apiKeyId, organizationId: organizationId },
      actorId,
    );

    return apiKey;
  }

  // ─────────────────────────────────────────────
  // Authorization helpers
  // ─────────────────────────────────────────────

  private requireOrganizationCreator(actorId: ActorId, organization: Organization): void {
    if (organization.createdBy.id !== actorId) {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_CREATOR_ONLY);
    }
  }

  private requireModifiableRole(role: Role): void {
    if (role.isSystemRole) {
      throw new ResourceError(ERROR_CODES.ROLE_SYSTEM_PROTECTED);
    }
  }

  // ─────────────────────────────────────────────
  // Organization helpers
  // ─────────────────────────────────────────────

  private async requireActiveOrganizationById(
    organizationId: OrganizationId,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.find({
      type: "id",
      value: organizationId,
    });

    return this.requireActiveOrganization(organization);
  }

  private requireActiveOrganization(organization: Organization | null): Organization {
    if (!organization) {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
    }

    if (organization.status !== "active") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_INACTIVE);
    }

    return organization;
  }

  // ─────────────────────────────────────────────
  // Member helpers
  // ─────────────────────────────────────────────

  private requireOrganizationMember(
    member: OrganizationMember | null,
    organizationId: OrganizationId,
  ): OrganizationMember {
    if (!member) {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND);
    }

    if (member.organizationId !== organizationId) {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND);
    }

    return member;
  }

  private validateMemberUpdate(
    member: OrganizationMember,
    data: UpdateOrganizationMemberData,
  ): void {
    if (member.status === "removed") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_REMOVED);
    }

    if (data.status === "active" && member.status !== "suspended") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_SUSPENDED);
    }

    if (data.status === "suspended" && member.status !== "active") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    if (data.status === "removed") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_REMOVE_DIRECTLY);
    }
  }

  // ─────────────────────────────────────────────
  // Role helpers
  // ─────────────────────────────────────────────

  private requireOrganizationRole(
    role: Role | null,
    organizationId: OrganizationId,
  ): Role {
    if (!role) {
      throw new ResourceError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    if (role.organizationId !== organizationId) {
      throw new ResourceError(ERROR_CODES.ROLE_NOT_FOUND);
    }

    return role;
  }
}
