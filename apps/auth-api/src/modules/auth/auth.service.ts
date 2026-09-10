import { RefreshToken, SessionId, User } from "@authcore/database";
import { config, Config } from "@authcore/config";
import { UserService } from "../users/users.service.js";
import type {
  CreateSessionResult,
  LoginResult,
  LoginType,
  LogoutType,
  RegisterType,
} from "./auth.types.js";
import { PasswordService } from "./password.service.js";
import { SessionService } from "./session.service.js";

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
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
    const user = await this.userService.getUserCredentialsByEmail(data.email);

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

    const { passwordHash, emailVerified, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  }

  async logoutUser(data: LogoutType): Promise<User> {
    const user = await this.userService.getUserById(data.userId);

    this.userService.validateAccountStatus(user);

    await this.sessionService.revokeAllUserSessions(
      data.userId,
      data.organizationId,
      "User logout",
    );

    return user;
  }

  async refreshAccessToken(
    sessionId: SessionId,
    refreshToken: RefreshToken,
  ): Promise<CreateSessionResult> {
    return await this.sessionService.rotateRefreshToken(sessionId, refreshToken);
  }

  async verifyEmail() {}
  async resendVerification() {}
  async forgotPassword() {}
  async resetPassword() {}
  async changePassword() {}
  async getAllSessions() {}
  async deleteSession() {}
  async deleteAllSessions() {}
}
