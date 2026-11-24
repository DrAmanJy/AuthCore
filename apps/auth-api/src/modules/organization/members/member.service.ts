import type {
  ActorId,
  FindManyOptions,
  Member,
  MemberId,
  MemberRepository,
  Organization,
  OrganizationId,
  PaginatedResult,
  RoleId,
  UserId,
} from "@authcore/database";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import { logger } from "@authcore/logger";
import type { AuthorizationService } from "../authorization/authorization.service.js";
import { AppError } from "../../../errors/app-error.js";

export class MembersService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async transferOwnership(
    organization: Organization,
    actorId: ActorId,
    newOwnerUserId: UserId,
  ): Promise<{ organization: Organization; previousOwner: Member; newOwner: Member }> {
    const currentOwner = await this.getMemberByUser(organization.id, actorId, actorId);
    if (!currentOwner.isOwner) {
      throw new AppError(ERROR_CODES.ORGANIZATION_ACCESS_DENIED);
    }

    if (currentOwner.status !== "active") {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }
    if (currentOwner.userId === newOwnerUserId) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
    }

    const targetMember = await this.getMemberByUser(
      organization.id,
      newOwnerUserId,
      actorId,
    );
    if (targetMember.status !== "active") {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }
    if (targetMember.isOwner) {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_ALREADY_EXISTS);
    }

    const promotedMember = await this.memberRepository.update(
      { memberId: targetMember.id, organizationId: organization.id },
      { isOwner: true },
    );

    const demotedMember = await this.memberRepository.update(
      { memberId: currentOwner.id, organizationId: organization.id },
      { isOwner: false },
    );

    if (!promotedMember || !demotedMember) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    logger.info(
      {
        event: "organization.ownership.transfer.success",
        organizationId: organization.id,
        actorId,
        previousOwnerMemberId: currentOwner.id,
        newOwnerMemberId: targetMember.id,
        newOwnerUserId,
      },
      "Organization ownership transferred successfully",
    );

    return {
      organization,
      previousOwner: demotedMember,
      newOwner: promotedMember,
    };
  }

  async getMember(
    organizationId: OrganizationId,
    memberId: MemberId,
    _actorId?: ActorId,
  ): Promise<Member> {
    const member = await this.memberRepository.find({
      by: "id",
      memberId,
      organizationId,
    });

    if (!member) {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND);
    }

    return member;
  }

  async getMemberByUser(
    organizationId: OrganizationId,
    userId: UserId,
    _actorId?: ActorId,
  ): Promise<Member> {
    const member = await this.memberRepository.find({
      by: "user",
      userId,
      organizationId,
    });

    if (!member) {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND);
    }

    return member;
  }

  async getMembers(
    organizationId: OrganizationId,
    options?: FindManyOptions,
    _actorId?: ActorId,
  ): Promise<PaginatedResult<Member>> {
    return this.memberRepository.findMany({ organizationId }, options);
  }

  getUserOrganizations(userId: UserId): Promise<Organization[]> {
    return this.memberRepository.findUserOrganizations(userId);
  }

  async addMember(params: {
    organizationId: OrganizationId;
    userId: UserId;
    actorId: ActorId;
    roleId: RoleId;
    status: "invited" | "active";
  }): Promise<Member> {
    const existingMember = await this.memberRepository.find({
      by: "user",
      userId: params.userId,
      organizationId: params.organizationId,
    });

    if (existingMember) {
      logger.warn(
        {
          event: "organization.member.create.failed",
          reason: "organization_already_exists",
          actorId: params.actorId,
          organizationId: params.organizationId,
        },
        "Failed to create member: already exists",
      );
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_ALREADY_EXISTS);
    }

    const member = await this.memberRepository.create({
      organizationId: params.organizationId,
      actorId: params.actorId,
      roleId: params.roleId,
      status: params.status,
      userId: params.userId,
      ...(params.status === "active" && { joinedAt: new Date() }),
    });
    logger.info(
      {
        event: "organization.member.create.success",
        actorId: params.actorId,
        memberId: member.id,
      },
      "Organization member created successfully",
    );

    return member;
  }

  async changeRole(
    organizationId: OrganizationId,
    memberId: MemberId,
    actorId: ActorId,
    roleId: RoleId,
  ): Promise<Member> {
    const member = await this.getMember(organizationId, memberId, actorId);

    if (member.status !== "active") {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    const updatedMember = await this.memberRepository.update(
      { memberId, organizationId },
      { roleId },
    );

    if (!updatedMember) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
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

  async removeMember(
    organizationId: OrganizationId,
    memberId: MemberId,
    actorId: ActorId,
  ): Promise<Member> {
    const member = await this.getMember(organizationId, memberId, actorId);

    if (member.status !== "active") {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    await this.assertNotLastActiveOwner(organizationId, member);

    const updatedMember = await this.memberRepository.update(
      { memberId, organizationId },
      { status: "removed" },
    );

    if (!updatedMember) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    logger.info(
      {
        event: "organization.member.remove.success",
        actorId,
        memberId: updatedMember.id,
      },
      "Organization member updated successfully",
    );
    return updatedMember;
  }

  async suspendMember(
    organizationId: OrganizationId,
    memberId: MemberId,
    actorId: ActorId,
  ): Promise<Member> {
    const member = await this.getMember(organizationId, memberId, actorId);

    if (member.status !== "active") {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    await this.assertNotLastActiveOwner(organizationId, member);

    const updatedMember = await this.memberRepository.update(
      { memberId, organizationId },
      { status: "suspended" },
    );

    if (!updatedMember) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
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

  async activateMember(
    organizationId: OrganizationId,
    memberId: MemberId,
    actorId: ActorId,
  ): Promise<Member> {
    const member = await this.getMember(organizationId, memberId, actorId);

    if (member.status !== "suspended") {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_SUSPENDED);
    }

    const updatedMember = await this.memberRepository.update(
      { memberId, organizationId },
      { status: "active" },
    );

    if (!updatedMember) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
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

  async leave(organizationId: OrganizationId, actorId: ActorId): Promise<Member> {
    const member = await this.getMemberByUser(organizationId, actorId, actorId);

    if (member.status !== "active") {
      throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    await this.assertNotLastActiveOwner(organizationId, member);

    const updatedMember = await this.memberRepository.update(
      { memberId: member.id, organizationId },
      { status: "left" },
    );
    if (!updatedMember) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
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

  private async assertNotLastActiveOwner(
    organizationId: OrganizationId,
    member: Member,
  ): Promise<void> {
    if (!member.isOwner) {
      return;
    }

    const owners = await this.memberRepository.findOwners(organizationId);
    const activeOwners = owners.filter(
      owner => owner.status === "active" && !owner.deletedAt,
    );

    if (activeOwners.length <= 1) {
      throw new AppError("ORGANIZATION_LAST_OWNER_PROTECTION");
    }
  }
}
