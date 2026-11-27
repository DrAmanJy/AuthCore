import type { Request, Response } from "express";

import { config } from "@authcore/config";
import type { Device, SessionId } from "@authcore/database";
import { asRefreshToken, getDurationMs } from "@authcore/database";
import type {
  Register,
  ForgotPassword,
  ResetPassword,
  ChangePassword,
} from "@authcore/contracts";

import type { AuthService } from "./auth.service.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import {
  getPaginationOptions,
  sendCreated,
  sendNoContent,
  sendPaginated,
  sendSuccess,
} from "../../utils/response.utils.js";
import getAuthToken from "../../utils/token.js";
import type { LoginType } from "./auth.types.js";
import { AppError } from "../../errors/app-error.js";

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

  async login(req: Request<unknown, unknown, LoginType>, res: Response) {
    const { organizationId, email, password } = req.body;
    const device: Device = req.device ?? {
      name: req.get("user-agent") ?? "Unknown Device",
      userAgent: req.get("user-agent") ?? "unknown",
      ip: req.ip ?? "unknown",
    };

    const { user, accessToken, refreshToken } = await this.authService.loginUser({
      organizationId: organizationId,
      email,
      password,
      device,
    });

    this.setRefreshTokenCookie(res, refreshToken);

    sendSuccess(res, { user, accessToken }, "User successfully Login");
  }

  async logout(req: Request, res: Response) {
    const { orgId, sub } = getAuthToken(req);

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
      throw new AppError(ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN);
    }

    const result = await this.authService.refreshAccessToken(
      asRefreshToken(refreshToken),
    );

    this.setRefreshTokenCookie(res, result.refreshToken);

    sendSuccess(res, result.accessToken, "Access token refreshed successfully");
  }

  async verifyEmail(req: Request<unknown, unknown, { token: string }>, res: Response) {
    const { token } = req.body;

    await this.authService.verifyEmail(token);

    sendNoContent(res);
  }

  async resendVerification(req: Request<unknown, unknown, EmailParams>, res: Response) {
    const { email } = req.body;

    await this.authService.resendVerification(email.trim());

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
    const { sub } = getAuthToken(req);

    await this.authService.changePassword(sub, {
      currentPassword,
      newPassword,
    });

    sendNoContent(res);
  }

  async getSessions(req: Request, res: Response) {
    const { orgId, sub } = getAuthToken(req);
    const options = getPaginationOptions(req.query);

    const sessions = await this.authService.getSessions(orgId, sub, options);

    sendPaginated(res, sessions, "Session successfully retrieved");
  }

  async revokeSession(req: Request<{ sessionId: SessionId }>, res: Response) {
    const { sessionId } = req.params;
    const { sub } = getAuthToken(req);

    // Enforce caller ownership when revoking specific session
    const session = await this.authService.revokeSession(sessionId, sub);

    sendSuccess(res, session, "Session successfully revoked");
  }

  async revokeAllSessions(req: Request, res: Response) {
    const { orgId, sub } = getAuthToken(req);

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
