import type {
  ActorId,
  CreateMemberData,
  Member,
  MemberId,
  MemberRepository,
  OrganizationId,
  RoleId,
  UserId,
} from "@authcore/database";
import { ResourceError } from "../../../errors/resource-error.js";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import { logger } from "@authcore/logger";
import type { AuthorizationService } from "../authorization/authorization.service.js";
import { InternalServerError } from "../../../errors/internal-server-error.js";

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
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND);
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
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND);
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

  async addMember(
    organizationId: OrganizationId,
    actorId: ActorId,
    data: Omit<CreateMemberData, "organizationId" | "actorId">,
  ): Promise<Member> {
    await this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId,
      },
      actorId,
    );

    const existingMember = await this.memberRepository.find({
      by: "user",
      userId: data.userId,
      organizationId,
    });

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

    const member = await this.memberRepository.create({
      ...data,
      organizationId,
      actorId,
    });
    logger.info(
      { event: "organization.member.create.success", actorId, memberId: member.id },
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
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    const updatedMember = await this.memberRepository.update(
      { memberId, organizationId },
      { roleId },
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

  async removeMember(
    organizationId: OrganizationId,
    memberId: MemberId,
    actorId: ActorId,
  ): Promise<Member> {
    const member = await this.getMember(organizationId, memberId, actorId);

    if (member.status !== "active") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    const updatedMember = await this.memberRepository.update(
      { memberId, organizationId },
      { status: "removed" },
    );

    if (!updatedMember) {
      throw new InternalServerError();
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
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    const updatedMember = await this.memberRepository.update(
      { memberId, organizationId },
      { status: "suspended" },
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

  async activateMember(
    organizationId: OrganizationId,
    memberId: MemberId,
    actorId: ActorId,
  ): Promise<Member> {
    const member = await this.getMember(organizationId, memberId, actorId);

    if (member.status !== "suspended") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_SUSPENDED);
    }

    const updatedMember = await this.memberRepository.update(
      { memberId, organizationId },
      { status: "active" },
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
}
