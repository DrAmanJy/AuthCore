import type {
  OrganizationId,
  RefreshToken,
  Session,
  SessionId,
  User,
  UserId,
} from "@authcore/database";

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

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private readonly recoveryService: RecoveryService,
  ) {}

  async registerUser(data: RegisterType): Promise<User> {
    const passwordHash = await this.passwordService.hash(data.password);

    const user = await this.userService.create({
      displayName: data.displayName,
      email: data.email,
      passwordHash,
    });

    // TODO: Push verify-email job to SQS.

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
      throw new Error("Invalid credentials");
    }

    const session = await this.sessionService.createSession({
      userId: user.id,
      organizationId: data.organizationId,
      device: data.device,
    });

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

    return user;
  }

  async refreshAccessToken(refreshToken: RefreshToken): Promise<CreateSessionResult> {
    return this.sessionService.rotateRefreshToken(refreshToken);
  }

  async verifyEmail(token: string): Promise<void> {
    const verificationToken = await this.recoveryService.verifyEmail(token);

    await this.userService.verifyEmail(verificationToken.userId);

    await this.recoveryService.markTokenAsUsed(verificationToken.id);
  }

  async resendVerification(userId: UserId): Promise<void> {
    const { token, expiresAt } =
      await this.recoveryService.createEmailVerificationToken(userId);

    // TODO: Push verify-email job to SQS.

    void token;
    void expiresAt;
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

    // TODO: Push password-reset email job to SQS.

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
      throw new Error("Invalid password");
    }

    const passwordHash = await this.passwordService.hash(data.newPassword);

    await this.sessionService.revokeAllUserSessions(userId);

    return this.userService.updatePassword(userId, passwordHash);
  }

  async getSessions(organizationId: OrganizationId, userId: UserId): Promise<Session[]> {
    return this.sessionService.getUserSessions({
      organizationId,
      userId,
      activeOnly: true,
    });
  }

  async revokeSession(sessionId: SessionId): Promise<Session> {
    return this.sessionService.revokeSession(sessionId);
  }

  async revokeAllSessions(
    organizationId: OrganizationId,
    userId: UserId,
  ): Promise<number> {
    return this.sessionService.revokeAllUserSessions(userId, organizationId);
  }
}
