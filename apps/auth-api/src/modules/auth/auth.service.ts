import type {
  ActorId,
  OrganizationId,
  RefreshToken,
  Session,
  SessionId,
  User,
  UserId,
} from "@authcore/database";
import { logger } from "@authcore/logger";

import type { ChangePassword } from "@authcore/contracts";

import type { UserService } from "../users/users.service.js";
import type {
  CreateSessionResult,
  LoginResult,
  LoginType,
  LogoutType,
  RegisterType,
} from "./auth.types.js";
import type { PasswordService } from "./password.service.js";
import type { RecoveryService } from "./recovery.service.js";
import type { SessionService } from "./session.service.js";

import { ERROR_CODES } from "../../errors/error-codes.js";
import type { MembersService } from "../organization/members/member.service.js";
import {
  passwordResetEmailTemplate,
  resendVerificationEmailTemplate,
  sendEmail,
  verificationEmailTemplate,
  welcomeEmailTemplate,
} from "@authcore/email";
import { AppError } from "../../errors/app-error.js";
import type { InvitationService } from "../organization/invitations/invitation.service.js";
import type { OrganizationService } from "../organization/organization.service.js";
import { config } from "@authcore/config";

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private readonly recoveryService: RecoveryService,
    private readonly membersService: MembersService,
    private readonly invitationService: InvitationService,
    private readonly organizationService: OrganizationService,
  ) {}

  async registerUser(data: RegisterType): Promise<User> {
    const hasInvitation = Boolean(data.InvitationToken);
    const hasOrganization = Boolean(data.organization);

    if (hasInvitation === hasOrganization) {
      throw new AppError("AUTH_ONBOARDING_CONTEXT_REQUIRED");
    }

    const email = data.email.trim().toLowerCase();

    const emailExists = await this.userService.isEmailExist(email);

    if (emailExists) {
      throw new AppError("USER_EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await this.passwordService.hash(data.password);

    const { user, organizationId } = hasInvitation
      ? await this.registerWithInvitation(data, email, passwordHash)
      : await this.registerWithOrganization(data, email, passwordHash);

    logger.info(
      {
        event: "auth.register.success",
        userId: user.id,
        onboardingType: hasInvitation ? "invitation" : "organization",
        organizationId,
      },
      "User registered successfully",
    );

    return user;
  }

  async loginUser(data: LoginType): Promise<LoginResult> {
    const user = await this.userService.getUserCredentials({
      type: "email",
      value: data.email,
    });

    this.userService.validateAccountStatus(user);

    const isValidPassword = await this.passwordService.verify(
      data.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    const member = await this.resolveLoginMembership(user.id, data.organizationId);

    this.validateMemberStatus(member);

    const session = await this.sessionService.createSession({
      userId: member.userId,
      organizationId: member.organizationId,
      device: data.device,
    });

    logger.info(
      {
        event: "auth.login.success",
        userId: user.id,
        organizationId: member.organizationId,
      },
      "User logged in successfully",
    );

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  }

  async logoutUser(data: LogoutType): Promise<User> {
    const user = await this.userService.getUserById(data.userId);

    await this.sessionService.revokeAllUserSessions(
      data.userId,
      data.organizationId,
      "User logout",
    );

    logger.info(
      { event: "auth.logout.success", userId: user.id },
      "User logged out successfully",
    );

    return user;
  }

  async refreshAccessToken(refreshToken: RefreshToken): Promise<CreateSessionResult> {
    const result = await this.sessionService.rotateRefreshToken(refreshToken);
    logger.info(
      {
        event: "auth.token.refresh.success",
      },
      "Access token refreshed successfully",
    );
    return result;
  }

  async verifyEmail(token: string): Promise<void> {
    const verificationToken = await this.recoveryService.verifyEmail(token);

    await this.userService.verifyEmail(verificationToken.userId);

    await this.recoveryService.markTokenAsUsed(verificationToken.id);

    logger.info(
      { event: "auth.email.verify.success", userId: verificationToken.userId },
      "Email verified successfully",
    );
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.userService.getUserByEmail(email);
    if (user.status !== "pending") {
      throw new AppError(ERROR_CODES.USER_ALREADY_ACTIVE);
    }
    const { token, expiresAt } = await this.recoveryService.createEmailVerificationToken(
      user.id,
    );
    const { html, subject, text } = resendVerificationEmailTemplate({
      displayName: user.displayName,
      expiresAt: expiresAt.toISOString(),
      verificationUrl: `${config.app.frontendUrl}/verify-email?token=${token}`,
    });

    await sendEmail({ html, subject, to: user.email, text });

    logger.info(
      {
        event: "auth.email.verification.resend.requested",
        userId: user.id,
      },
      "Verification email resend requested",
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.getUserCredentials({
      type: "email",
      value: email,
    });

    this.userService.validateAccountStatus(user);

    const { token, expiresAt } = await this.recoveryService.createPasswordResetToken(
      user.id,
    );

    const { html, subject, text } = passwordResetEmailTemplate({
      displayName: user.displayName,
      expiresAt: expiresAt.toISOString(),
      resetUrl: `${config.app.frontendUrl}/change-password?token=${token}`,
    });

    await sendEmail({ html, subject, to: user.email, text });

    logger.info(
      {
        event: "auth.password.reset.requested",
      },
      "Password reset requested",
    );
  }

  async resetPassword(token: string, password: string): Promise<User> {
    const verificationToken = await this.recoveryService.verifyPasswordResetToken(token);

    const passwordHash = await this.passwordService.hash(password);

    const user = await this.userService.updatePassword(
      verificationToken.userId,
      passwordHash,
    );

    await this.sessionService.revokeAllUserSessions(user.id, undefined, "Password reset");

    await this.recoveryService.markTokenAsUsed(verificationToken.id);
    logger.info(
      { event: "auth.password.reset.success", userId: user.id },
      "Password reset successfully",
    );
    return user;
  }

  async changePassword(userId: UserId, data: ChangePassword): Promise<User> {
    const user = await this.userService.getUserCredentials({
      type: "id",
      value: userId,
    });

    this.userService.validateAccountStatus(user);

    const isValidPassword = await this.passwordService.verify(
      data.currentPassword,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    const passwordHash = await this.passwordService.hash(data.newPassword);

    await this.sessionService.revokeAllUserSessions(userId);

    const updatedUser = await this.userService.updatePassword(userId, passwordHash);

    logger.info(
      {
        event: "auth.password.change.success",
        userId: updatedUser.id,
      },
      "Password changed successfully",
    );

    return updatedUser;
  }

  async getSessions(organizationId: OrganizationId, userId: UserId): Promise<Session[]> {
    return this.sessionService.getUserSessions({
      organizationId,
      userId,
      activeOnly: true,
    });
  }

  async revokeSession(sessionId: SessionId, actorId: ActorId): Promise<Session> {
    const session = await this.sessionService.revokeSession(sessionId, actorId);
    logger.info(
      {
        event: "auth.session.revoked",
        organizationId: session.organizationId,
        sessionId: session.id,
        userId: session.userId,
      },
      "Session revoked successfully",
    );
    return session;
  }

  async revokeAllSessions(
    organizationId: OrganizationId,
    userId: UserId,
  ): Promise<number> {
    const count = await this.sessionService.revokeAllUserSessions(userId, organizationId);
    logger.info(
      {
        event: "auth.sessions.revoked_all",
        organizationId,
        userId,
      },
      "All user sessions revoked successfully",
    );
    return count;
  }

  private async registerWithInvitation(
    data: RegisterType,
    email: string,
    passwordHash: string,
  ): Promise<{ user: User; organizationId: OrganizationId }> {
    if (!data.InvitationToken) {
      throw new AppError("AUTH_ONBOARDING_CONTEXT_REQUIRED");
    }

    const invitation = await this.invitationService.getInviteByToken(
      data.InvitationToken,
    );
    if (invitation.expiresAt < new Date()) throw new AppError("INVITATION_EXPIRED");
    if (invitation.status === "accepted")
      throw new AppError("INVITATION_ALREADY_ACCEPTED");
    if (invitation.status === "rejected") throw new AppError("INVITATION_REJECTED");
    if (invitation.status === "revoked") throw new AppError("INVITATION_REVOKED");
    if (invitation.status === "expired") throw new AppError("INVITATION_EXPIRED");
    if (!invitation.targetEmail && invitation.targetEmail !== email)
      throw new AppError("INVITATION_INVALID");

    const user = await this.userService.create({
      displayName: data.displayName,
      email,
      passwordHash,
      emailVerified: true,
      status: "active",
    });

    const { organization } = await this.invitationService.acceptInvite(
      invitation.id,
      invitation.organizationId,
      user.id,
    );

    const { html, subject, text } = welcomeEmailTemplate({
      displayName: user.displayName,
      occurredAt: new Date().toISOString(),
      signInUrl: `${organization.frontendUrl}/login`,
    });

    await sendEmail({
      html,
      subject,
      to: user.email,
      text,
    });

    return { user, organizationId: organization.id };
  }

  private async registerWithOrganization(
    data: RegisterType,
    email: string,
    passwordHash: string,
  ): Promise<{ user: User; organizationId: OrganizationId }> {
    if (!data.organization) {
      throw new AppError("AUTH_ONBOARDING_CONTEXT_REQUIRED");
    }

    const user = await this.userService.create({
      displayName: data.displayName,
      email,
      passwordHash,
      emailVerified: false,
    });

    const organization = await this.organizationService.create(user.id, {
      frontendUrl: data.organization.frontendUrl,
      name: data.organization.name,
      slug: data.organization.slug,
    });

    const { token, expiresAt } = await this.recoveryService.createEmailVerificationToken(
      user.id,
    );

    const { html, subject, text } = verificationEmailTemplate({
      displayName: user.displayName,
      expiresAt: expiresAt.toISOString(),
      verificationUrl: `${config.app.frontendUrl}/verify-email?token=${token}`,
    });

    await sendEmail({
      html,
      subject,
      to: user.email,
      text,
    });

    return { user, organizationId: organization.id };
  }

  private async resolveLoginMembership(
    userId: UserId,
    organizationId?: OrganizationId,
  ): Promise<Awaited<ReturnType<MembersService["getMemberByUser"]>>> {
    if (organizationId) {
      return this.membersService.getMemberByUser(organizationId, userId);
    }

    const organizations = await this.membersService.getUserOrganizations(userId);

    if (organizations.length === 0) {
      throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
    }

    if (organizations.length > 1) {
      throw new AppError(ERROR_CODES.AUTH_ORGANIZATION_SELECTION_REQUIRED, {
        details: {
          organizations: organizations.map(organization => ({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          })),
        },
      });
    }

    const organization = organizations[0];

    if (!organization) {
      throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
    }

    return this.membersService.getMemberByUser(organization.id, userId);
  }

  private validateMemberStatus(
    member: Awaited<ReturnType<MembersService["getMemberByUser"]>>,
  ): void {
    switch (member.status) {
      case "active":
        return;

      case "removed":
        throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_REMOVED);

      case "suspended":
        throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_SUSPENDED);

      case "invited":
        throw new AppError(ERROR_CODES.ORGANIZATION_MEMBER_INVITATION_PENDING);
      case "left":
        throw new AppError("ORGANIZATION_MEMBER_REMOVED"); //to do add left error code and replace it
    }
  }
}
