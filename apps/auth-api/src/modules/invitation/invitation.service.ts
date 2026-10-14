import { randomBytes } from "crypto";
import type { InvitationId, ActorId, Invitation } from "@authcore/database";
import { getExpiryTime } from "@authcore/database";
import type {
  InvitationRepository,
  OrganizationId,
  RoleId,
  UserId,
  TargetType,
} from "@authcore/database";
import type { OrganizationService } from "../organization/organization.service.js";
import { config } from "@authcore/config";
import { hashString } from "../../utils/hashString.js";
import { ResourceError } from "../../errors/resource-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import type { UserService } from "../users/users.service.js";

export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
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
    const invitations = await this.invitationRepository.find({
      type: "organization",
      value: organizationId,
    });

    return invitations;
  }

  async sendInvite(
    organizationId: OrganizationId,
    roleId: RoleId,
    targetType: TargetType,
    actorId: ActorId,
    targetEmail?: string,
    targetUserId?: UserId,
  ): Promise<Invitation> {
    let email: string;
    let resolvedTargetUserId: UserId | undefined;

    if (targetType === "user") {
      if (!targetUserId) {
        throw new ResourceError(ERROR_CODES.VALIDATION_FAILED);
      }

      const user = await this.userService.getAuthenticatedUser(targetUserId);

      email = user.email;
      resolvedTargetUserId = user.id;
    } else {
      const normalizedEmail = targetEmail?.trim().toLowerCase();

      if (!normalizedEmail) {
        throw new ResourceError(ERROR_CODES.VALIDATION_FAILED);
      }

      email = normalizedEmail;
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashString(token);

    const invitation = await this.invitationRepository.create({
      organizationId,
      roleId,
      targetType,
      ...(targetType === "user"
        ? { targetUserId: resolvedTargetUserId }
        : { targetEmail: email }),
      invitedBy: actorId,
      tokenHash,
      expiresAt: getExpiryTime(config.auth.invitationExpiry),
    });

    // TODO: Send the invitation email to `email` with the raw `token`.
    // Store only the token hash in the database.

    return invitation;
  }

  async acceptInviteByEmail(
    email: string,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<void> {
    const invitation = await this.invitationRepository.find({
      type: "email",
      value: email,
      orgId: organizationId,
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    await this.validInvitation(invitation, actorId, "accepted");

    const acceptedInvitation = await this.invitationRepository.update(
      invitation.id,
      { status: "accepted" },
      actorId,
    );

    if (!acceptedInvitation) {
      throw new Error("Invitation not found");
    }
  }

  async acceptInvite(invitationId: InvitationId, actorId: ActorId): Promise<void> {
    const invitation = await this.invitationRepository.find({
      type: "id",
      value: invitationId,
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    await this.validInvitation(invitation, actorId, "accepted");

    const acceptedInvitation = await this.invitationRepository.update(
      invitationId,
      { status: "accepted" },
      actorId,
    );

    if (!acceptedInvitation) {
      throw new Error("Invitation not found");
    }
  }

  async rejectInvitation(invitationId: InvitationId, actorId: ActorId): Promise<void> {
    const invitation = await this.invitationRepository.find({
      type: "id",
      value: invitationId,
    });
    if (!invitation) {
      throw new Error("Change at L133");
    }

    await this.validInvitation(invitation, actorId, "rejected");

    const rejectInvitation = await this.invitationRepository.update(
      invitationId,
      { status: "expired" },
      actorId,
    );
    if (!rejectInvitation) {
      throw new Error("Change at L140");
    }
  }

  async revokeInvitation(invitationId: InvitationId, actorId: ActorId) {
    const invitation = await this.invitationRepository.find({
      type: "id",
      value: invitationId,
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    await this.validInvitation(invitation, actorId, "accepted");

    const revokeInvitation = await this.invitationRepository.revoke(
      invitation.id,
      actorId,
    );

    if (!revokeInvitation) {
      throw new Error("change at L234");
    }
  }

  private async validInvitation(
    invitation: Invitation,
    actorId: ActorId,
    status: "accepted" | "rejected",
  ): Promise<void> {
    if (invitation.status !== "expired" && invitation.expiresAt <= new Date()) {
      await this.invitationRepository.update(
        invitation.id,
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
  }
}
