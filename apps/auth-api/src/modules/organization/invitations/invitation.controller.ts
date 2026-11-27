import type { Request, Response } from "express";
import type { InvitationService } from "./invitation.service.js";
import type {
  InvitationId,
  OrganizationId,
  RoleId,
  TargetType,
  UserId,
} from "@authcore/database";
import {
  getPaginationOptions,
  sendCreated,
  sendNoContent,
  sendPaginated,
} from "../../../utils/response.utils.js";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import type { AccessTokenPayload } from "../../auth/auth.types.js";
import { AppError } from "../../../errors/app-error.js";
import getAuthToken from "../../../utils/token.js";

export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {
    this.sendInvitation = this.sendInvitation.bind(this);
    this.getOrganizationInvites = this.getOrganizationInvites.bind(this);
    this.getUserInvites = this.getUserInvites.bind(this);
    this.acceptInvitation = this.acceptInvitation.bind(this);
    this.rejectInvitation = this.rejectInvitation.bind(this);
    this.revokeInvitation = this.revokeInvitation.bind(this);
  }

  async sendInvitation(
    req: Request<
      unknown,
      unknown,
      {
        roleId: RoleId;
        targetType: TargetType;
        targetEmail?: string;
        targetUserId?: UserId;
      }
    >,
    res: Response,
  ) {
    const { roleId, targetType, targetEmail, targetUserId } = req.body;
    const { sub: actorId } = getAuthToken(req);
    if (!req.orgContext) throw new AppError("AUTH_FORBIDDEN");

    const invitation = await this.invitationService.sendInvite({
      organization: req.orgContext.organization,
      roleId,
      targetType,
      actorId,
      targetEmail,
      targetUserId,
    });

    sendCreated(res, invitation, "Invite send successfully");
  }

  async getOrganizationInvites(
    req: Request<{ organizationId: OrganizationId }, unknown, unknown>,
    res: Response,
  ) {
    const { organizationId } = req.params;
    if (!organizationId) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
    }
    const options = getPaginationOptions(req.query);
    const invitations =
      await this.invitationService.getOrganizationInvites(organizationId, options);

    sendPaginated(res, invitations, "Invitation successfully retrieved");
  }

  async getUserInvites(req: Request, res: Response) {
    const { sub } = this.getAuthToken(req);
    const options = getPaginationOptions(req.query);
    const invitations = await this.invitationService.getInvitesByUserId(sub, options);

    sendPaginated(res, invitations, "Invitation successfully retrieved");
  }

  async acceptInvitation(
    req: Request<
      { invitationId: InvitationId; organizationId: OrganizationId },
      unknown,
      unknown
    >,
    res: Response,
  ) {
    const { invitationId, organizationId } = req.params;
    const { sub } = this.getAuthToken(req);

    if (!invitationId) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
    }
    await this.invitationService.acceptInvite(invitationId, organizationId, sub);

    sendNoContent(res);
  }

  async rejectInvitation(
    req: Request<
      { invitationId: InvitationId; organizationId: OrganizationId },
      unknown,
      unknown
    >,
    res: Response,
  ) {
    const { invitationId, organizationId } = req.params;
    const { sub } = this.getAuthToken(req);

    if (!invitationId) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
    }
    await this.invitationService.rejectInvitation(invitationId, organizationId, sub);

    sendNoContent(res);
  }

  async revokeInvitation(
    req: Request<
      { invitationId: InvitationId; organizationId: OrganizationId },
      unknown,
      unknown
    >,
    res: Response,
  ) {
    const { invitationId, organizationId } = req.params;
    const { sub } = this.getAuthToken(req);

    if (!invitationId) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
    }
    await this.invitationService.revokeInvitation(invitationId, organizationId, sub);

    sendNoContent(res);
  }

  private getAuthToken(req: { token?: AccessTokenPayload }): AccessTokenPayload {
    if (!req.token) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED);
    }
    return req.token;
  }
}
