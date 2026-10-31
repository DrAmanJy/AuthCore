import type {
  ActorId,
  CreateMemberData,
  OrganizationId,
  Member,
  MemberId,
  MemberRepository,
  UserId,
  RoleId,
} from "@authcore/database";
import { logger } from "@authcore/logger";
import { ResourceError } from "../../../errors/resource-error.js";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import { InternalServerError } from "../../../errors/internal-server-error.js";
import type { AuthorizationService } from "../authorization/authorization.service.js";

export class MembersService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  //   async transferOwnership(
  //     organizationId: OrganizationId,
  //     actorId: ActorId,
  //     newOwnerUserId: UserId,
  //   ): Promise<Organization> {
  //     const organization = await this.authorizationService.getValidOrganization(
  //       {
  //         type: "id",
  //         value: organizationId,
  //       },
  //       actorId,
  //     );

  //     const targetMember = await this.getMemberByUser(organizationId, newOwnerUserId);
  //     if (targetMember.status !== "active") {
  //       throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
  //     }

  //     const ownerRole = await this.roleRepository.findByName(organizationId);
  //     if (!ownerRole) {
  //       throw new ResourceError(ERROR_CODES.ROLE_NOT_FOUND);
  //     }

  //     await this.MemberRepository.update(organizationId, targetMember.id, {
  //       roleId: ownerRole.id,
  //     });

  //     logger.info(
  //       {
  //         event: "organization.ownership.transferred",
  //         organizationId,
  //         fromActorId: actorId,
  //         toUserId: newOwnerUserId,
  //       },
  //       "Organization ownership transferred successfully",
  //     );

  //     return organization;
  //   }

  // ─────────────────────────────────────────────

  async getMember(organizationId: OrganizationId, memberId: MemberId): Promise<Member> {
    await this.authorizationService.getValidOrganization({
      type: "id",
      value: organizationId,
    });

    const member = await this.memberRepository.find({
      type: "id",
      value: memberId,
      orgId: organizationId,
    });

    if (!member) {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND);
    }

    return member;
  }

  async getMemberByUser(organizationId: OrganizationId, userId: UserId): Promise<Member> {
    await this.authorizationService.getValidOrganization({
      type: "id",
      value: organizationId,
    });

    const member = await this.memberRepository.find({
      type: "user",
      value: userId,
      orgId: organizationId,
    });

    if (!member) {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND);
    }

    return member;
  }

  async getMembers(organizationId: OrganizationId): Promise<Member[]> {
    await this.authorizationService.getValidOrganization({
      type: "id",
      value: organizationId,
    });

    return this.memberRepository.find({ type: "organization", value: organizationId });
  }

  async addMember(
    organizationId: OrganizationId,
    actorId: ActorId,
    data: CreateMemberData,
  ): Promise<Member> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: organizationId,
      },
      actorId,
    );

    const existingMember = await this.memberRepository.find({
      type: "user",
      value: data.userId,
      orgId: organizationId,
    });

    //todo implement can reinvite removed members
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

    const member = await this.memberRepository.create(actorId, organizationId, data);
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
    const member = await this.getMember(organizationId, memberId);

    if (member.status !== "active") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    const updatedMember = await this.memberRepository.update(organizationId, memberId, {
      roleId,
    });

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

  // private async ensureNotLastOwner(
  //   organizationId: OrganizationId,
  //   memberId: MemberId,
  // ): Promise<void> {
  //   const member = await this.MemberRepository.find({
  //     type: "id",
  //     value: memberId,
  //     orgId: organizationId,
  //   });
  //   if (!member) return;

  //   const role = await this.roleRepository.findById(member.roleId);
  //   if (!role || role.name !== SYSTEM_ROLE_NAMES.OWNER) {
  //     return;
  //   }

  //   const allMembers = await this.MemberRepository.findByOrganization(organizationId);
  //   const activeOwnerCount = allMembers.filter(
  //     m => m.status === "active" && m.roleId === member.roleId && m.id !== memberId,
  //   ).length;

  //   if (activeOwnerCount === 0) {
  //     throw new ResourceError(ERROR_CODES.ORGANIZATION_LAST_OWNER_PROTECTION);
  //   }
  // }

  async removeMember(
    organizationId: OrganizationId,
    memberId: MemberId,
    actorId: ActorId,
  ): Promise<Member> {
    const member = await this.getMember(organizationId, memberId);

    if (member.status !== "active") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    const updatedMember = await this.memberRepository.update(organizationId, memberId, {
      status: "removed",
    });

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
    const member = await this.getMember(organizationId, memberId);

    if (member.status !== "active") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_ACTIVE);
    }

    const updatedMember = await this.memberRepository.update(organizationId, memberId, {
      status: "suspended",
    });

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
    const member = await this.getMember(organizationId, memberId);

    if (member.status !== "suspended") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_MEMBER_NOT_SUSPENDED);
    }

    const updatedMember = await this.memberRepository.update(organizationId, memberId, {
      status: "active",
    });

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
