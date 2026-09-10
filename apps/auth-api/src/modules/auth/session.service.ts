import {
  SessionId,
  SessionRepository,
  Session,
  OrganizationId,
  UserId,
  UpdateSessionData,
} from "@authcore/database";
import {
  CreateSessionType,
  RefreshToken,
  AccessTokenPayload,
  CreateSessionResult,
  FindUserAllSessionType,
  RevokeSessionType,
} from "./auth.types.js";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "@authcore/config";

export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    // private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async createSession(data: CreateSessionType): Promise<CreateSessionResult> {
    const { refreshToken, refreshTokenHash } = this.generateRefreshToken();

    const session = await this.sessionRepository.create({
      ...data,
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
    organizationId: OrganizationId,
    reason?: string,
  ): Promise<number> {
    return await this.sessionRepository.revokeAllByUserId(userId, organizationId, reason);
  }

  async revokeAllExceptCurrent(
    sessionId: SessionId,
    userId: UserId,
    organizationId: OrganizationId,
    reason?: string,
  ) {
    return await this.sessionRepository.revokeAllExcept(
      userId,
      organizationId,
      sessionId,
      reason,
    );
  }

  async rotateRefreshToken(sessionId: SessionId) {
    const session = await this.sessionRepository.findSession({
      type: "id",
      value: sessionId,
    });
    if (!session) {
      throw new Error("Invalid session id");
    }

    if (session.revokedAt || session.expiresAt < new Date()) {
      throw new Error("Invalid session id");
    }

    //todo create new refresh token put new token id new old token parentTokenId and use same tokenFamilyId
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
    refreshTokenHash: string;
  } {
    const refreshToken = randomBytes(64).toString("base64url");

    const refreshTokenHash = createHash("sha256").update(refreshToken).digest("hex");

    return {
      refreshToken,
      refreshTokenHash,
    };
  }
}
