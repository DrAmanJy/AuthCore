import type {
  ActorId,
  Member,
  MemberId,
  MemberRepository,
  Organization,
  OrganizationId,
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

  async getMember(
    organizationId: OrganizationId,
    memberId: MemberId,
    actorId: ActorId,
  ): Promise<Member> {
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId,
      },
      actorId,
    );

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
    actorId?: ActorId,
  ): Promise<Member> {
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId,
      },
      actorId,
    );

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

  async getMembers(organizationId: OrganizationId, actorId: ActorId): Promise<Member[]> {
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId,
      },
      actorId,
    );

    const result = await this.memberRepository.findMany({ organizationId });
    return result.items;
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
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId: params.organizationId,
      },
      params.actorId,
    );

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
}
