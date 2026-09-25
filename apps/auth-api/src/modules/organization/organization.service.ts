import type {
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

  async getOrganizations(): Promise<Organization[]> {
    return this.organizationRepository.findAll();
  }

  async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    return this.organizationRepository.create(data);
  }

  async updateOrganization(
    organizationId: OrganizationId,
    data: UpdateOrganizationData,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.update(organizationId, data);

    if (!organization) {
      throw new Error("Organization not found");
    }

    return organization;
  }

  async deleteOrganization(organizationId: OrganizationId): Promise<Organization> {
    const organization = await this.organizationRepository.softDelete(organizationId);

    if (!organization) {
      throw new Error("Organization not found");
    }

    return organization;
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

  async addMember(data: CreateOrganizationMemberData): Promise<OrganizationMember> {
    await this.requireActiveOrganizationById(data.organizationId);

    const existingMember = await this.organizationMemberRepository.findByUser(
      data.userId,
      data.organizationId,
    );

    if (existingMember) {
      throw new Error("User is already a member of this organization");
    }

    return this.organizationMemberRepository.create(data);
  }

  async updateMember(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    data: UpdateOrganizationMemberData,
  ): Promise<OrganizationMember> {
    const member = await this.getMember(organizationId, memberId);

    this.validateMemberUpdate(member, data);

    const updatedMember = await this.organizationMemberRepository.update(memberId, data);

    if (!updatedMember) {
      throw new Error("Organization member not found");
    }

    return updatedMember;
  }

  async removeMember(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ): Promise<OrganizationMember> {
    const member = await this.getMember(organizationId, memberId);

    if (member.status === "removed") {
      throw new Error("Organization member is already removed");
    }

    const removedMember = await this.organizationMemberRepository.remove(memberId);

    if (!removedMember) {
      throw new Error("Organization member not found");
    }

    return removedMember;
  }

  async suspendMember(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ): Promise<OrganizationMember> {
    const member = await this.getMember(organizationId, memberId);

    if (member.status !== "active") {
      throw new Error("Only active members can be suspended");
    }

    return this.updateMember(organizationId, memberId, { status: "suspended" });
  }

  async activateMember(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ): Promise<OrganizationMember> {
    const member = await this.getMember(organizationId, memberId);

    if (member.status !== "suspended") {
      throw new Error("Only suspended members can be activated");
    }

    return this.updateMember(organizationId, memberId, { status: "active" });
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

  async createRole(data: CreateRoleData): Promise<Role> {
    await this.requireActiveOrganizationById(data.organizationId);

    const existingRole = await this.roleRepository.findByName(
      data.organizationId,
      data.name,
    );

    if (existingRole) {
      throw new Error("Role already exists");
    }

    return this.roleRepository.create(data);
  }

  async updateRole(
    organizationId: OrganizationId,
    roleId: RoleId,
    data: UpdateRoleData,
  ): Promise<Role> {
    const role = await this.getRole(organizationId, roleId);

    if (role.isSystemRole) {
      throw new Error("System roles cannot be modified");
    }

    const updatedRole = await this.roleRepository.update(roleId, data);

    if (!updatedRole) {
      throw new Error("Role not found");
    }

    return updatedRole;
  }

  async deleteRole(organizationId: OrganizationId, roleId: RoleId): Promise<Role> {
    const role = await this.getRole(organizationId, roleId);

    if (role.isSystemRole) {
      throw new Error("System roles cannot be deleted");
    }

    const deletedRole = await this.roleRepository.softDelete(roleId);

    if (!deletedRole) {
      throw new Error("Role not found");
    }

    return deletedRole;
  }

  // ─────────────────────────────────────────────
  // Private helpers
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
}
