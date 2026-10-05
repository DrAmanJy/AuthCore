import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

import {
  asRefreshToken,
  asRefreshTokenHash,
  asTokenFamilyId,
  getExpiryTime,
} from "@authcore/database";

import type {
  OrganizationId,
  RefreshToken,
  RefreshTokenHash,
  RefreshTokenRepository,
  Session,
  SessionId,
  SessionRepository,
  UpdateSessionData,
  UserId,
} from "@authcore/database";

import { config } from "@authcore/config";

import type {
  AccessTokenPayload,
  CreateSessionResult,
  CreateSessionType,
  FindUserAllSessionType,
} from "./auth.types.js";

import {
  AuthenticationError,
  TokenExpiredError,
} from "../../errors/authentication-error.js";

import { ERROR_CODES } from "../../errors/error-codes.js";

export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async createSession(data: CreateSessionType): Promise<CreateSessionResult> {
    const { refreshToken, refreshTokenHash } = this.generateRefreshToken();

    const sessionExpiresAt = getExpiryTime(config.auth.sessionExpiry);

    const session = await this.sessionRepository.create({
      ...data,
      expiresAt: sessionExpiresAt,
    });

    const tokenFamilyId = asTokenFamilyId(randomUUID());

    const refreshTokenExpiresAt = this.getRefreshTokenExpiry(session.expiresAt);

    await this.refreshTokenRepository.create({
      sessionId: session.id,
      tokenHash: refreshTokenHash,
      tokenFamilyId,
      expiresAt: refreshTokenExpiresAt,
    });

    const accessToken = this.generateAccessToken({
      sub: session.userId,
      sid: session.id,
      orgId: session.organizationId,
      jti: randomUUID(),
      type: "access",
    });

    return {
      refreshToken,
      accessToken,
    };
  }

  async getSessionById(sessionId: SessionId): Promise<Session> {
    const session = await this.sessionRepository.findSession({
      type: "id",
      value: sessionId,
    });

    return this.assertSession(session);
  }

  async getUserSessions(data: FindUserAllSessionType): Promise<Session[]> {
    return this.sessionRepository.findSession({
      type: "user",
      ...data,
    });
  }

  async updateSession(sessionId: SessionId, data: UpdateSessionData): Promise<Session> {
    const session = await this.sessionRepository.updateSession(sessionId, data);

    return this.assertSession(session);
  }

  async revokeSession(sessionId: SessionId): Promise<Session> {
    const session = await this.sessionRepository.revoke(sessionId);

    return this.assertSession(session);
  }

  async revokeAllUserSessions(
    userId: UserId,
    organizationId?: OrganizationId,
    reason?: string,
  ): Promise<number> {
    return this.sessionRepository.revokeAllByUserId(userId, organizationId, reason);
  }

  async revokeAllExceptCurrent(
    sessionId: SessionId,
    userId: UserId,
    organizationId: OrganizationId,
    reason?: string,
  ): Promise<number> {
    return this.sessionRepository.revokeAllExcept(
      userId,
      organizationId,
      sessionId,
      reason,
    );
  }

  async rotateRefreshToken(refreshToken: RefreshToken): Promise<CreateSessionResult> {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    const currentRefreshToken =
      await this.refreshTokenRepository.findByHash(refreshTokenHash);

    if (!currentRefreshToken) {
      throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN);
    }

    // Refresh-token reuse detected.
    if (currentRefreshToken.usedAt) {
      await this.refreshTokenRepository.markReuseDetected(currentRefreshToken.id);

      await this.refreshTokenRepository.revokeFamily(currentRefreshToken.tokenFamilyId);

      throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN);
    }

    const now = new Date();

    // Refresh token was revoked or expired.
    if (currentRefreshToken.revokedAt || currentRefreshToken.expiresAt <= now) {
      throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN);
    }

    const session = await this.sessionRepository.findSession({
      type: "id",
      value: currentRefreshToken.sessionId,
    });

    if (!session) {
      throw new AuthenticationError(ERROR_CODES.AUTH_SESSION_NOT_FOUND);
    }

    if (session.revokedAt) {
      throw new AuthenticationError(ERROR_CODES.AUTH_SESSION_REVOKED);
    }

    if (session.expiresAt <= now) {
      throw new AuthenticationError(ERROR_CODES.AUTH_SESSION_EXPIRED);
    }

    const { refreshToken: newRefreshToken, refreshTokenHash: newRefreshTokenHash } =
      this.generateRefreshToken();

    const refreshTokenExpiresAt = new Date(
      Math.min(
        getExpiryTime(config.auth.refreshTokenExpiry).getTime(),
        session.expiresAt.getTime(),
      ),
    );

    await this.refreshTokenRepository.markAsUsed(currentRefreshToken.id);

    await this.refreshTokenRepository.create({
      sessionId: session.id,
      parentTokenId: currentRefreshToken.id,
      tokenFamilyId: currentRefreshToken.tokenFamilyId,
      tokenHash: newRefreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
    });

    const accessToken = this.generateAccessToken({
      sub: session.userId,
      sid: session.id,
      orgId: session.organizationId,
      jti: randomUUID(),
      type: "access",
    });

    return {
      refreshToken: newRefreshToken,
      accessToken,
    };
  }
  async validateSession(sessionId: SessionId): Promise<boolean> {
    const session = await this.sessionRepository.findSession({
      type: "id",
      value: sessionId,
    });

    if (!session) {
      return false;
    }

    return !session.revokedAt && session.expiresAt > new Date();
  }

  private generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, config.auth.jwtPrivateKey, {
      algorithm: "RS256",
      expiresIn: config.auth.accessTokenExpiry,
      keyid: config.auth.jwtKeyId,
      issuer: config.auth.jwtIssuer,
      audience: payload.orgId,
    });
  }

  private verifyAccessToken(
    accessToken: string,
    organizationId: OrganizationId,
  ): AccessTokenPayload {
    try {
      return jwt.verify(accessToken, config.auth.jwtPublicKey, {
        algorithms: ["RS256"],
        issuer: config.auth.jwtIssuer,
        audience: organizationId,
      }) as AccessTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError(ERROR_CODES.AUTH_TOKEN_EXPIRED, error.expiredAt, {
          cause: error,
        });
      }

      throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_TOKEN, {
        cause: error,
      });
    }
  }

  private assertSession(session: Session | null): Session {
    if (!session) {
      throw new AuthenticationError(ERROR_CODES.AUTH_SESSION_NOT_FOUND);
    }

    return session;
  }

  private getRefreshTokenExpiry(sessionExpiresAt: Date): Date {
    return new Date(
      Math.min(
        getExpiryTime(config.auth.refreshTokenExpiry).getTime(),
        sessionExpiresAt.getTime(),
      ),
    );
  }

  private generateRefreshToken(): {
    refreshToken: RefreshToken;
    refreshTokenHash: RefreshTokenHash;
  } {
    const refreshToken = asRefreshToken(randomBytes(64).toString("base64url"));

    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    return {
      refreshToken,
      refreshTokenHash,
    };
  }

  private hashRefreshToken(refreshToken: RefreshToken): RefreshTokenHash {
    return asRefreshTokenHash(createHash("sha256").update(refreshToken).digest("hex"));
  }
}
