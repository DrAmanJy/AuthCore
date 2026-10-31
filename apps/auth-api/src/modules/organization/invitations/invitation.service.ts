import { randomBytes } from "crypto";
import type { InvitationId, ActorId, Invitation, Member } from "@authcore/database";
import { getExpiryTime } from "@authcore/database";
import type {
  InvitationRepository,
  OrganizationId,
  RoleId,
  UserId,
  TargetType,
} from "@authcore/database";
import { config } from "@authcore/config";
import { hashString } from "../../../utils/hashString.js";
import { ResourceError } from "../../../errors/resource-error.js";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import type { UserService } from "../../users/users.service.js";
import type { AuthorizationService } from "../authorization/authorization.service.js";
import type { MembersService } from "../members/member.service.js";

export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly userService: UserService,
    private readonly memberService: MembersService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getInvitesByActorId(actorId: ActorId): Promise<Invitation[]> {
    const invitations = await this.invitationRepository.find({
      type: "user",
      value: actorId,
    });
    return invitations;
  }

  async getInvitesByUserId(userId: UserId): Promise<Invitation[]> {
    const invitations = await this.invitationRepository.find({
      type: "user",
      value: userId,
    });
    return invitations;
  }

  //don't use without checking ownership
  async getInvitesByEmail(email: string): Promise<Invitation[]> {
    const invitations = await this.invitationRepository.find({
      type: "email",
      value: email,
    });
    return invitations;
  }

  async getOrganizationInvitesByUserId(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<Invitation> {
    await this.authorizationService.getValidOrganization({
      type: "id",
      value: organizationId,
    });

    const invitation = await this.invitationRepository.find({
      type: "user",
      value: userId,
      orgId: organizationId,
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    return invitation;
  }

  async getOrganizationInvitesByEmail(
    email: string,
    organizationId: OrganizationId,
  ): Promise<Invitation> {
    await this.authorizationService.getValidOrganization({
      type: "id",
      value: organizationId,
    });

    const invitation = await this.invitationRepository.find({
      type: "email",
      value: email,
      orgId: organizationId,
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    return invitation;
  }

  async getOrganizationInvites(organizationId: OrganizationId): Promise<Invitation[]> {
    await this.authorizationService.getValidOrganization({
      type: "id",
      value: organizationId,
    });

    const invitations = await this.invitationRepository.find({
      type: "organization",
      value: organizationId,
    });

    return invitations;
  }

  async sendInvite(params: {
    organizationId: OrganizationId;
    roleId: RoleId;
    targetType: TargetType;
    actorId: ActorId;
    targetEmail?: string;
    targetUserId?: UserId;
  }): Promise<Invitation> {
    let _email: string;

    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    if (params.targetType === "user") {
      if (!params.targetUserId) {
        throw new ResourceError(ERROR_CODES.VALIDATION_FAILED);
      }

      const user = await this.userService.getAuthenticatedUser(params.targetUserId);

      _email = user.email;
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashString(token);

    const invitation = await this.invitationRepository.create({
      invitedBy: params.actorId,
      tokenHash,
      expiresAt: getExpiryTime(config.auth.invitationExpiry),
      ...params,
    });

    // TODO: Send the invitation email to `email` with the raw `token`.
    // Store only the token hash in the database.

    return invitation;
  }

  // use Id for now
  async acceptInviteByEmail(
    email: string,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<void> {
    await this.authorizationService.getValidOrganization({
      type: "id",
      value: organizationId,
    });

    const invitation = await this.invitationRepository.find({
      type: "email",
      value: email,
      orgId: organizationId,
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    await this.validInvitation(invitation, organizationId, actorId, "accepted");

    const acceptedInvitation = await this.invitationRepository.update(
      invitation.id,
      organizationId,
      { status: "accepted" },
      actorId,
    );

    if (!acceptedInvitation) {
      throw new Error("Invitation not found");
    }
  }

  async acceptInvite(
    invitationId: InvitationId,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<Member> {
    const invitation = await this.invitationRepository.find({
      type: "id",
      value: invitationId,
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    await this.authorizationService.getValidOrganization({
      type: "id",
      value: invitation.organizationId,
    });

    await this.validInvitation(invitation, organizationId, actorId, "accepted");

    const acceptedInvitation = await this.invitationRepository.update(
      invitationId,
      organizationId,
      { status: "accepted" },
      actorId,
    );

    if (!acceptedInvitation) {
      throw new Error("Invitation not found");
    }

    return this.memberService.addMember(acceptedInvitation.organizationId, actorId, {
      roleId: acceptedInvitation.roleId,
      userId: actorId,
    });
  }

  async rejectInvitation(
    invitationId: InvitationId,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<void> {
    const invitation = await this.invitationRepository.find({
      type: "id",
      value: invitationId,
    });
    if (!invitation) {
      throw new Error("Change at L133");
    }

    await this.validInvitation(invitation, organizationId, actorId, "rejected");

    const rejectInvitation = await this.invitationRepository.update(
      invitationId,
      organizationId,
      { status: "rejected" },
      actorId,
    );
    if (!rejectInvitation) {
      throw new Error("Change at L140");
    }
  }

  async revokeInvitation(
    invitationId: InvitationId,
    organizationId: OrganizationId,
    actorId: ActorId,
  ) {
    const invitation = await this.invitationRepository.find({
      type: "id",
      value: invitationId,
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: invitation.organizationId,
      },
      actorId,
    );

    await this.validInvitation(invitation, organizationId, actorId, "accepted");

    const revokeInvitation = await this.invitationRepository.revoke(
      invitation.id,
      organizationId,
      actorId,
    );

    if (!revokeInvitation) {
      throw new Error("change at L234");
    }
  }

  private async validInvitation(
    invitation: Invitation,
    organizationId: OrganizationId,
    actorId: ActorId,
    status: "accepted" | "rejected",
  ): Promise<void> {
    if (invitation.status !== "expired" && invitation.expiresAt <= new Date()) {
      await this.invitationRepository.update(
        invitation.id,
        organizationId,
        { status: "expired" },
        actorId,
      );
      throw new ResourceError(ERROR_CODES.VALIDATION_FAILED); //todo change ths
    }

    switch (invitation.status) {
      case "accepted":
        if (status !== "rejected") {
          throw new ResourceError(ERROR_CODES.VALIDATION_FAILED); //todo change ths}
        }
        break;
      case "expired":
        throw new ResourceError(ERROR_CODES.VALIDATION_FAILED); //todo change ths}

      case "rejected":
        if (status !== "accepted") {
          throw new ResourceError(ERROR_CODES.VALIDATION_FAILED); //todo change ths}
        }
        break;
      case "revoked":
        throw new ResourceError(ERROR_CODES.VALIDATION_FAILED); //todo change ths}
      case "pending":
        break;
    }

    if (invitation.targetType === "user" && invitation.targetUserId !== actorId) {
      throw new ResourceError(ERROR_CODES.VALIDATION_FAILED); //todo change ths}
    }
  }
}
