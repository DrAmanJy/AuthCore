import type { Request, Response } from "express";

import { config } from "@authcore/config";
import {
  asOrganizationId,
  asRefreshToken,
  asSessionId,
  getDurationMs,
} from "@authcore/database";
import type {
  Register,
  Login,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
  ChangePassword,
  SessionParams,
} from "@authcore/contracts";

import type { AuthService } from "./auth.service.js";
import { AuthenticationError } from "../../errors/authentication-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import { sendCreated, sendNoContent, sendSuccess } from "../../utils/response.utils.js";

const REFRESH_TOKEN_COOKIE =
  config.nodeEnv === "production" ? "__Host-refresh_token" : "refresh_token";

type EmailParams = {
  email: string;
};

export class AuthController {
  constructor(private readonly authService: AuthService) {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.refreshAccessToken = this.refreshAccessToken.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.resendVerification = this.resendVerification.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.getSessions = this.getSessions.bind(this);
    this.revokeSession = this.revokeSession.bind(this);
    this.revokeAllSessions = this.revokeAllSessions.bind(this);
  }

  async register(req: Request<unknown, unknown, Register>, res: Response) {
    const { displayName, email, password } = req.body;

    const user = await this.authService.registerUser({
      displayName,
      email,
      password,
    });

    sendCreated(res, user, "User successfully registered");
  }

  async login(req: Request<unknown, unknown, Login>, res: Response) {
    const { organizationId, email, password } = req.body;
    const { device } = req;

    const { user, accessToken, refreshToken } = await this.authService.loginUser({
      organizationId: asOrganizationId(organizationId),
      email,
      password,
      device,
    });

    this.setRefreshTokenCookie(res, refreshToken);

    sendSuccess(res, { user, accessToken }, "User successfully Login");
  }

  async logout(req: Request, res: Response) {
    const { orgId, sub } = req.token;

    const user = await this.authService.logoutUser({
      organizationId: orgId,
      userId: sub,
    });

    this.clearRefreshTokenCookie(res);

    sendSuccess(res, user, "User successfully logout");
  }

  async refreshAccessToken(req: Request, res: Response) {
    const cookies = req.cookies as Record<string, unknown>;

    const refreshToken: unknown = cookies[REFRESH_TOKEN_COOKIE];

    if (typeof refreshToken !== "string") {
      throw new AuthenticationError(ERROR_CODES.AUTH_VERIFICATION_TOKEN_NOT_FOUND);
    }

    const result = await this.authService.refreshAccessToken(
      asRefreshToken(refreshToken),
    );

    this.setRefreshTokenCookie(res, result.refreshToken);
    sendSuccess(res, result.accessToken, "Access token refreshed successfully");
  }

  async verifyEmail(req: Request<VerifyEmail, unknown, unknown>, res: Response) {
    const { token } = req.params;

    await this.authService.verifyEmail(token);

    sendNoContent(res);
  }

  async resendVerification(req: Request<EmailParams, unknown, unknown>, res: Response) {
    const { email } = req.params;

    await this.authService.resendVerification(email);

    sendNoContent(res);
  }

  async forgotPassword(req: Request<unknown, unknown, ForgotPassword>, res: Response) {
    const { email } = req.body;

    await this.authService.forgotPassword(email);

    sendNoContent(res);
  }

  async resetPassword(req: Request<unknown, unknown, ResetPassword>, res: Response) {
    const { token, password } = req.body;

    await this.authService.resetPassword(token, password);

    sendNoContent(res);
  }

  async changePassword(req: Request<unknown, unknown, ChangePassword>, res: Response) {
    const { currentPassword, newPassword } = req.body;
    const { sub } = req.token;

    await this.authService.changePassword(sub, {
      currentPassword,
      newPassword,
    });

    sendNoContent(res);
  }

  async getSessions(req: Request, res: Response) {
    const { orgId, sub } = req.token;

    const sessions = await this.authService.getSessions(orgId, sub);

    sendSuccess(res, sessions, "Session successfully retrieved");
  }

  async revokeSession(req: Request<SessionParams>, res: Response) {
    const { sessionId } = req.params;

    const session = await this.authService.revokeSession(asSessionId(sessionId));

    sendSuccess(res, session, "Session successfully revoked");
  }

  async revokeAllSessions(req: Request, res: Response) {
    const { orgId, sub } = req.token;

    const count = await this.authService.revokeAllSessions(orgId, sub);

    sendSuccess(res, count, "Sessions successfully revoked");
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProduction = config.nodeEnv === "production";

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: getDurationMs(config.auth.refreshTokenExpiry),
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    const isProduction = config.nodeEnv === "production";

    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
  }
}
