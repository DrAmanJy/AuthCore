import type {
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
import { AuthenticationError } from "../../errors/authentication-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import type { EmailQueue } from "@authcore/queue";

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private readonly recoveryService: RecoveryService,
    private readonly emailQueue: EmailQueue,
  ) {}

  async registerUser(data: RegisterType): Promise<User> {
    const passwordHash = await this.passwordService.hash(data.password);

    const user = await this.userService.create({
      displayName: data.displayName,
      email: data.email,
      passwordHash,
    });

    const { token } = await this.recoveryService.createEmailVerificationToken(user.id);

    await this.emailQueue.publishVerificationEmail({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      verificationToken: token,
    });

    logger.info(
      {
        event: "auth.register.success",
        userId: user.id,
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
      throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    const session = await this.sessionService.createSession({
      userId: user.id,
      organizationId: data.organizationId,
      device: data.device,
    });

    logger.info(
      { event: "auth.login.success", userId: user.id },
      "User logged in successfully",
    );
    const {
      passwordHash: _passwordHash,
      emailVerified: _emailVerified,
      ...safeUser
    } = user;

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

  async resendVerification(userId: UserId): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (user.status !== "pending") {
      throw new AuthenticationError("USER_ACCOUNT_PENDING");
    }
    const { token } = await this.recoveryService.createEmailVerificationToken(userId);

    await this.emailQueue.publishVerificationEmail({
      displayName: user.displayName,
      email: user.email,
      userId,
      verificationToken: token,
    });

    logger.info(
      {
        event: "auth.email.verification.resend.requested",
        userId,
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

    await this.emailQueue.publishPasswordResetEmail({
      displayName: user.displayName,
      email: user.email,
      resetToken: token,
      userId: user.id,
    });

    logger.info(
      {
        event: "auth.password.reset.requested",
      },
      "Password reset requested",
    );
    void token;
    void expiresAt;
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
      throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
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

  async revokeSession(sessionId: SessionId): Promise<Session> {
    const session = await this.sessionService.revokeSession(sessionId);
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
}
