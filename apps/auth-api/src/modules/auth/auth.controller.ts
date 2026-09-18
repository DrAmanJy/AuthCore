import type { Request, Response } from "express";

import { config } from "@authcore/config";
import { asRefreshToken, asSessionId, getDurationMs } from "@authcore/database";

import type { AuthService } from "./auth.service.js";

const REFRESH_TOKEN_COOKIE =
  config.nodeEnv === "production" ? "__Host-refresh_token" : "__Secure-refresh_token";

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

  async register(req: Request, res: Response) {
    const { displayName, email, password } = req.body;

    const user = await this.authService.registerUser({
      displayName,
      email,
      password,
    });

    return res.status(201).json({
      message: "User registered successfully",
      data: { user },
    });
  }

  async login(req: Request, res: Response) {
    const { organizationId, email, password } = req.body;
    const { device } = req;

    const { user, accessToken, refreshToken } = await this.authService.loginUser({
      organizationId,
      email,
      password,
      device,
    });

    this.setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      message: "Login successful",
      data: {
        user,
        accessToken,
      },
    });
  }

  async logout(req: Request, res: Response) {
    const { orgId, sub } = req.token;

    await this.authService.logoutUser({
      organizationId: orgId,
      userId: sub,
    });

    this.clearRefreshTokenCookie(res);

    return res.status(200).json({
      message: "Logout successful",
    });
  }

  async refreshAccessToken(req: Request, res: Response) {
    const { sid } = req.token;

    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

    if (typeof refreshToken !== "string") {
      throw new Error("Refresh token is required");
    }

    const result = await this.authService.refreshAccessToken(
      sid,
      asRefreshToken(refreshToken),
    );

    this.setRefreshTokenCookie(res, result.refreshToken);

    return res.status(200).json({
      message: "Access token refreshed successfully",
      data: {
        accessToken: result.accessToken,
      },
    });
  }

  async verifyEmail(req: Request, res: Response) {
    const { token } = req.body;

    await this.authService.verifyEmail(token);

    return res.status(200).json({
      message: "Email verified successfully",
    });
  }

  async resendVerification(req: Request, res: Response) {
    const { sub } = req.token;

    await this.authService.resendVerification(sub);

    return res.status(200).json({
      message: "Verification email sent successfully",
    });
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    await this.authService.forgotPassword(email);

    return res.status(200).json({
      message: "If the email exists, a password reset link has been sent",
    });
  }

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;

    await this.authService.resetPassword(token, password);

    return res.status(200).json({
      message: "Password reset successfully",
    });
  }

  async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = req.body;
    const { sub } = req.token;

    await this.authService.changePassword(sub, {
      currentPassword,
      newPassword,
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  }

  async getSessions(req: Request, res: Response) {
    const { orgId, sub } = req.token;

    const sessions = await this.authService.getSessions(orgId, sub);

    return res.status(200).json({
      message: "Sessions retrieved successfully",
      data: { sessions },
    });
  }

  async revokeSession(req: Request, res: Response) {
    const { sessionId } = req.params;

    if (typeof sessionId !== "string") {
      throw new Error("Session ID is required");
    }

    const session = await this.authService.revokeSession(asSessionId(sessionId));

    return res.status(200).json({
      message: "Session revoked successfully",
      data: { session },
    });
  }

  async revokeAllSessions(req: Request, res: Response) {
    const { orgId, sub } = req.token;

    const count = await this.authService.revokeAllSessions(orgId, sub);

    return res.status(200).json({
      message: "All sessions revoked successfully",
      data: { count },
    });
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      path: "/",
      maxAge: getDurationMs(config.auth.refreshTokenExpiry),
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      path: "/",
    });
  }
}
