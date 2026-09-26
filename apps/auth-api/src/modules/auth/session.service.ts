import type {
  SessionId,
  SessionRepository,
  Session,
  OrganizationId,
  UserId,
  UpdateSessionData,
  RefreshTokenRepository,
  RefreshToken,
  RefreshTokenHash,
} from "@authcore/database";
import {
  asTokenFamilyId,
  asRefreshToken,
  asRefreshTokenHash,
  getExpiryTime,
} from "@authcore/database";
import type {
  CreateSessionType,
  AccessTokenPayload,
  CreateSessionResult,
  FindUserAllSessionType,
} from "./auth.types.js";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "@authcore/config";

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

    const refreshTokenExpiresAt = new Date(
      Math.min(
        getExpiryTime(config.auth.refreshTokenExpiry).getTime(),
        session.expiresAt.getTime(),
      ),
    );

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
    return this.assertSession(
      await this.sessionRepository.findSession({
        type: "id",
        value: sessionId,
      }),
    );
  }

  // async getSessionByRefreshToken(refreshTokenHash: RefreshTokenHash): Promise<Session> {
  //   return this.assertSession(
  //     await this.sessionRepository.findSession({
  //       type: "refreshTokenHash",
  //       value: refreshTokenHash,
  //     }),
  //   );
  // }

  async getUserSessions(data: FindUserAllSessionType): Promise<Session[]> {
    return this.sessionRepository.findSession({
      type: "user",
      ...data,
    });
  }

  async updateSession(sessionId: SessionId, data: UpdateSessionData): Promise<Session> {
    return this.assertSession(
      await this.sessionRepository.updateSession(sessionId, data),
    );
  }

  async revokeSession(sessionId: SessionId) {
    return this.assertSession(await this.sessionRepository.revoke(sessionId));
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
  ) {
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
      throw new Error("Invalid refresh token");
    }

    if (currentRefreshToken.usedAt) {
      await this.refreshTokenRepository.markReuseDetected(currentRefreshToken.id);

      await this.refreshTokenRepository.revokeFamily(currentRefreshToken.tokenFamilyId);

      throw new Error("Refresh token reuse detected");
    }

    const now = new Date();

    if (currentRefreshToken.revokedAt || currentRefreshToken.expiresAt <= now) {
      throw new Error("Invalid refresh token");
    }

    const session = await this.sessionRepository.findSession({
      type: "id",
      value: currentRefreshToken.sessionId,
    });

    if (!session) {
      throw new Error("Invalid session");
    }

    if (session.revokedAt || session.expiresAt <= now) {
      throw new Error("Invalid session");
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
    return jwt.verify(accessToken, config.auth.jwtPublicKey, {
      algorithms: ["RS256"],
      issuer: config.auth.jwtIssuer,
      audience: organizationId,
    }) as AccessTokenPayload;
  }

  private assertSession(session: Session | null): Session {
    if (!session) {
      throw new Error("Session not found");
    }

    return session;
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
