import type { Request, Response } from "express";
import type { InvitationService } from "./invitation.service.js";
import type {
  InvitationId,
  OrganizationId,
  RoleId,
  TargetType,
  UserId,
} from "@authcore/database";
import { sendCreated, sendNoContent, sendSuccess } from "../../utils/response.utils.js";
import { AuthenticationError } from "../../errors/authentication-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import type { AccessTokenPayload } from "../auth/auth.types.js";

export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  async sendInvitation(
    req: Request<
      Record<string, never>,
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
    const { sub, orgId } = this.getAuthToken(req);

    const invitation = await this.invitationService.sendInvite(
      orgId,
      roleId,
      targetType,
      sub,
      targetEmail,
      targetUserId,
    );

    sendCreated(res, invitation, "Invite send successfully");
  }

  async getOrganizationInvites(
    req: Request<{ organizationId: OrganizationId }, unknown, unknown>,
    res: Response,
  ) {
    const { organizationId } = req.params;
    if (!organizationId) {
      throw new Error("change at L10");
    }
    const invitations =
      await this.invitationService.getOrganizationInvites(organizationId);

    sendSuccess(res, invitations, "Invitation successfully retrieved");
  }

  async getUserInvites(req: Request, res: Response) {
    const { sub } = this.getAuthToken(req);
    const invitations = await this.invitationService.getInvitesByUserId(sub);

    sendSuccess(res, invitations, "Invitation successfully retrieved");
  }

  async acceptInvitation(
    req: Request<{ invitationId: InvitationId }, unknown, unknown>,
    res: Response,
  ) {
    const { invitationId } = req.params;
    const { sub } = this.getAuthToken(req);

    if (!invitationId) {
      throw new Error("Change at L39");
    }
    await this.invitationService.acceptInvite(invitationId, sub);

    sendNoContent(res);
  }

  async rejectInvitation(
    req: Request<{ invitationId: InvitationId }, unknown, unknown>,
    res: Response,
  ) {
    const { invitationId } = req.params;
    const { sub } = this.getAuthToken(req);

    if (!invitationId) {
      throw new Error("Change at L56");
    }
    await this.invitationService.rejectInvitation(invitationId, sub);

    sendNoContent(res);
  }

  async revokeInvitation(
    req: Request<{ invitationId: InvitationId }, unknown, unknown>,
    res: Response,
  ) {
    const { invitationId } = req.params;
    const { sub } = this.getAuthToken(req);

    if (!invitationId) {
      throw new Error("Change at L71");
    }
    await this.invitationService.revokeInvitation(invitationId, sub);

    sendNoContent(res);
  }

  private getAuthToken(req: { token?: AccessTokenPayload }): AccessTokenPayload {
    if (!req.token) {
      throw new AuthenticationError(ERROR_CODES.AUTH_UNAUTHORIZED);
    }
    return req.token;
  }
}
