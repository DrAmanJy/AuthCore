import type {
  ActorId,
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

export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly organizationMemberRepository: OrganizationMemberRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  // ─────────────────────────────────────────────
  // Organization
  // ─────────────────────────────────────────────

  async getOrganization(organizationId: OrganizationId): Promise<Organization> {
    const organization = await this.organizationRepository.findById(organizationId);

    return this.requireActiveOrganization(organization);
  }

  async getOrganizationBySlug(slug: string): Promise<Organization> {
    const organization = await this.organizationRepository.findBySlug(slug);

    return this.requireActiveOrganization(organization);
  }

  async getOrganizationsByActor(actorId: ActorId): Promise<Organization[]> {
    return this.organizationRepository.findAllByActorId(actorId);
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return this.organizationRepository.findAll();
  }

  async createOrganization(
    actorId: ActorId,
    data: CreateOrganizationData,
  ): Promise<Organization> {
    return this.organizationRepository.create(actorId, data);
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

    return updatedOrganization;
  }

  async deleteOrganization(
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<Organization> {
    const organization = await this.requireActiveOrganizationById(organizationId);

    this.requireOrganizationCreator(actorId, organization);

    const organizationDeleted = await this.organizationRepository.softDelete(
      organizationId,
      actorId,
    );

    if (!organizationDeleted) {
      throw new InternalServerError();
    }

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
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_ALREADY_EXISTS);
    }

    return this.organizationMemberRepository.create(actorId, organizationId, data);
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

    return updatedMember;
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

    return this.roleRepository.create(organizationId, actorId, data);
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

    return deletedRole;
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
    const organization = await this.organizationRepository.findById(organizationId);

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
