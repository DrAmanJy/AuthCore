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
      throw new Error("Organization not found or modification is not allowed.");
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
      throw new Error("Organization could not be deleted.");
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
      throw new Error("Organization member not found");
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
      throw new Error("User is already a member of this organization");
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
      throw new Error("Organization member not found or modification is not allowed.");
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
      throw new Error("Only active members can be removed");
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
      throw new Error("Only active members can be suspended");
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
      throw new Error("Only suspended members can be activated");
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
      throw new Error("Role not found");
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
      throw new Error("Role already exists");
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
      throw new Error("Role not found or modification is not allowed.");
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
      throw new Error("Role not found or deletion is not allowed.");
    }

    return deletedRole;
  }

  // ─────────────────────────────────────────────
  // Authorization helpers
  // ─────────────────────────────────────────────

  private requireOrganizationCreator(actorId: ActorId, organization: Organization): void {
    if (organization.createdBy.id !== actorId) {
      throw new Error("Only the organization creator can modify this resource.");
    }
  }

  private requireModifiableRole(role: Role): void {
    if (role.isSystemRole) {
      throw new Error("System roles cannot be modified.");
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
      throw new Error("Organization not found");
    }

    if (organization.status !== "active") {
      throw new Error("Organization is not active");
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
      throw new Error("Organization member not found");
    }

    if (member.organizationId !== organizationId) {
      throw new Error("Organization member not found");
    }

    return member;
  }

  private validateMemberUpdate(
    member: OrganizationMember,
    data: UpdateOrganizationMemberData,
  ): void {
    if (member.status === "removed") {
      throw new Error("Removed members cannot be updated");
    }

    if (data.status === "active" && member.status !== "suspended") {
      throw new Error("Only suspended members can be activated");
    }

    if (data.status === "suspended" && member.status !== "active") {
      throw new Error("Only active members can be suspended");
    }

    if (data.status === "removed") {
      throw new Error("Use removeMember to remove a member");
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
      throw new Error("Role not found");
    }

    if (role.organizationId !== organizationId) {
      throw new Error("Role not found");
    }

    return role;
  }
}
