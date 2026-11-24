import { randomBytes } from "node:crypto";

import type {
  InvitationId,
  ActorId,
  Invitation,
  Member,
  InvitationRepository,
  OrganizationId,
  RoleId,
  UserId,
  Organization,
  FindManyOptions,
  PaginatedResult,
} from "@authcore/database";

import { getExpiryTime } from "@authcore/database";
import { config } from "@authcore/config";

import { hashString } from "../../../utils/hashString.js";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import { AppError } from "../../../errors/app-error.js";

import type { UserService } from "../../users/users.service.js";
import type { AuthorizationService } from "../authorization/authorization.service.js";
import type { MembersService } from "../members/member.service.js";
import { invitationEmailTemplate, sendEmail } from "@authcore/email";
import type { RoleService } from "../roles/role.service.js";

type InvitationAction = "accepted" | "rejected" | "revoked";

type InvitationStatus = Invitation["status"];

type SendInvitationParams = {
  organization: Organization;
  roleId: RoleId;
  targetType: "user" | "email";
  actorId: ActorId;
  targetEmail?: string;
  targetUserId?: UserId;
};

const INVITATION_TRANSITIONS: Record<InvitationStatus, readonly InvitationAction[]> = {
  pending: ["accepted", "rejected", "revoked"],
  accepted: [],
  rejected: [],
  revoked: [],
  expired: [],
};

export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly userService: UserService,
    private readonly memberService: MembersService,
    private readonly roleService: RoleService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getInvitesByActorId(
    actorId: ActorId,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Invitation>> {
    return this.invitationRepository.findMany(
      {
        userId: actorId,
        activeOnly: true,
      },
      options,
    );
  }

  async getInvitesByUserId(
    userId: UserId,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Invitation>> {
    return this.invitationRepository.findMany(
      {
        userId,
        activeOnly: true,
      },
      options,
    );
  }
  async getInviteByToken(token: string): Promise<Invitation> {
    const tokenHash = hashString(token);
    const invitation = await this.invitationRepository.find({
      by: "tokenHash",
      tokenHash,
    });
    if (!invitation) throw new AppError("INVITATION_NOT_FOUND");

    return invitation;
  }

  /**
   * Do not expose this method without verifying email ownership.
   */
  async getInviteByEmail(email: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.find({
      by: "email",
      email,
    });

    if (!invitation) throw new AppError("INVITATION_NOT_FOUND");

    return invitation;
  }

  async getOrganizationInvitesByUserId(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<Invitation> {
    await this.validateOrganization(organizationId);

    const invitation = await this.invitationRepository.find({
      by: "user",
      userId,
      organizationId,
    });

    if (!invitation) {
      throw new AppError(ERROR_CODES.INVITATION_NOT_FOUND);
    }

    return invitation;
  }

  async getOrganizationInvitesByEmail(
    email: string,
    organizationId: OrganizationId,
  ): Promise<Invitation> {
    await this.validateOrganization(organizationId);

    const invitation = await this.invitationRepository.find({
      by: "email",
      email: this.normalizeEmail(email),
      organizationId,
    });

    if (!invitation) {
      throw new AppError(ERROR_CODES.INVITATION_NOT_FOUND);
    }

    return invitation;
  }

  async getOrganizationInvites(
    organizationId: OrganizationId,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Invitation>> {
    return this.invitationRepository.findMany(
      {
        organizationId,
        activeOnly: true,
      },
      options,
    );
  }

  async sendInvite(params: SendInvitationParams): Promise<Invitation> {
    let targetUser;

    let targetEmail = params.targetEmail
      ? this.normalizeEmail(params.targetEmail)
      : undefined;

    if (params.targetType === "user") {
      if (!params.targetUserId) {
        throw new AppError(ERROR_CODES.VALIDATION_FAILED);
      }

      targetUser = await this.userService.getAuthenticatedUser(params.targetUserId);

      targetEmail = this.normalizeEmail(targetUser.email);
    } else {
      if (!targetEmail) throw new AppError(ERROR_CODES.VALIDATION_FAILED);
      targetUser = await this.userService.getUserByEmail(targetEmail);
      this.userService.validateAccountStatus(targetUser);
    }

    const role = await this.roleService.get({
      organizationId: params.organization.id,
      roleId: params.roleId,
      actorId: params.actorId,
    });

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashString(token);

    const invitation = await this.invitationRepository.create({
      organizationId: params.organization.id,
      roleId: params.roleId,
      targetType: params.targetType,
      targetUserId: params.targetUserId,
      targetEmail,
      invitedBy: params.actorId,
      tokenHash,
      expiresAt: getExpiryTime(config.auth.invitationExpiry),
    });

    const { html, subject, text } = invitationEmailTemplate({
      expiresAt: invitation.expiresAt.toISOString(),
      inviterName: invitation.invitedBy,
      inviteUrl: `${params.organization.frontendUrl}/accept-invitation/${token}`,
      organizationName: params.organization.name,
      roleName: role.name,
      displayName: targetUser.displayName || "Not available",
    });

    await sendEmail({ html, subject, to: targetEmail, text });

    return invitation;
  }

  async acceptInvite(
    invitationId: InvitationId,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<{ member: Member; organization: Organization }> {
    const [invitation, organization] = await Promise.all([
      this.findInvitationById(invitationId),
      this.authorizationService.getValidOrganization({
        by: "id",
        organizationId: organizationId,
      }),
    ]);

    await this.validateInvitationAction(invitation, organizationId, actorId, "accepted");

    const member = await this.memberService.addMember({
      organizationId,
      actorId,
      roleId: invitation.roleId,
      userId: actorId,
      status: "active",
    });

    const updated = await this.invitationRepository.update(
      {
        invitationId,
        organizationId,
      },
      {
        status: "accepted",
        actionBy: actorId,
      },
    );

    if (!updated) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    return { member, organization };
  }

  async rejectInvitation(
    invitationId: InvitationId,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<void> {
    const invitation = await this.findInvitationById(invitationId);

    await this.validateInvitationAction(invitation, organizationId, actorId, "rejected");

    const updated = await this.invitationRepository.update(
      {
        invitationId,
        organizationId,
      },
      {
        status: "rejected",
        actionBy: actorId,
      },
    );

    if (!updated) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async revokeInvitation(
    invitationId: InvitationId,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<void> {
    const invitation = await this.findInvitationById(invitationId);

    await this.validateInvitationAction(
      invitation,
      organizationId,
      actorId,
      "revoked",
      false,
    );

    const revoked = await this.invitationRepository.revoke({
      invitationId: invitation.id,
      organizationId,
      actorId,
    });

    if (!revoked) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  private async validateOrganization(organizationId: OrganizationId): Promise<void> {
    await this.authorizationService.getValidOrganization({
      by: "id",
      organizationId: organizationId,
    });
  }

  private assertOrganizationOwnership(
    invitation: Invitation,
    organizationId: OrganizationId,
  ): void {
    if (invitation.organizationId !== organizationId) {
      throw new AppError(ERROR_CODES.INVITATION_NOT_FOUND);
    }
  }

  // ---------------------------------------------------------------------------
  // Recipient validation
  // ---------------------------------------------------------------------------

  private assertInvitationRecipient(invitation: Invitation, actorId: ActorId): void {
    if (invitation.targetType === "user" && invitation.targetUserId !== actorId) {
      throw new AppError(ERROR_CODES.AUTH_FORBIDDEN);
    }
  }

  // ---------------------------------------------------------------------------
  // Expiration validation
  // ---------------------------------------------------------------------------

  private async assertInvitationNotExpired(
    invitation: Invitation,
    actorId: ActorId,
  ): Promise<void> {
    if (invitation.status === "expired") {
      throw new AppError(ERROR_CODES.INVITATION_EXPIRED);
    }

    if (invitation.expiresAt.getTime() > Date.now()) {
      return;
    }

    await this.invitationRepository.update(
      {
        invitationId: invitation.id,
        organizationId: invitation.organizationId,
      },
      {
        status: "expired",
        actionBy: actorId,
      },
    );

    throw new AppError(ERROR_CODES.INVITATION_EXPIRED);
  }

  // ---------------------------------------------------------------------------
  // State transition validation
  // ---------------------------------------------------------------------------

  private assertInvitationTransition(
    invitation: Invitation,
    action: InvitationAction,
  ): void {
    const allowedTransitions = INVITATION_TRANSITIONS[invitation.status];

    if (allowedTransitions.includes(action)) {
      return;
    }

    switch (invitation.status) {
      case "accepted":
        throw new AppError(ERROR_CODES.INVITATION_ALREADY_ACCEPTED);

      case "rejected":
        throw new AppError(ERROR_CODES.INVITATION_ALREADY_REJECTED);

      case "revoked":
        throw new AppError(ERROR_CODES.INVITATION_REVOKED);

      case "expired":
        throw new AppError(ERROR_CODES.INVITATION_EXPIRED);

      case "pending":
        throw new AppError(ERROR_CODES.VALIDATION_FAILED);
    }
  }

  private async validateInvitationAction(
    invitation: Invitation,
    organizationId: OrganizationId,
    actorId: ActorId,
    action: InvitationAction,
    validateRecipient = true,
  ): Promise<void> {
    this.assertOrganizationOwnership(invitation, organizationId);

    if (validateRecipient) {
      this.assertInvitationRecipient(invitation, actorId);
    }

    await this.assertInvitationNotExpired(invitation, actorId);

    this.assertInvitationTransition(invitation, action);
  }

  private async findInvitationById(invitationId: InvitationId): Promise<Invitation> {
    const invitation = await this.invitationRepository.find({
      by: "id",
      invitationId,
    });

    if (!invitation) {
      throw new AppError(ERROR_CODES.INVITATION_NOT_FOUND);
    }

    return invitation;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
