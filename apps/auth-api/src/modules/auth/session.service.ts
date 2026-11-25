import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

import {
  asRefreshToken,
  asRefreshTokenHash,
  asTokenFamilyId,
  getExpiryTime,
} from "@authcore/database";

import type {
  ActorId,
  FindManyOptions,
  MemberRepository,
  OrganizationId,
  PaginatedResult,
  RefreshToken,
  RefreshTokenHash,
  RefreshTokenRepository,
  RoleRepository,
  Session,
  SessionId,
  SessionRepository,
  UpdateSessionData,
  UserId,
} from "@authcore/database";

import { config } from "@authcore/config";
import { SYSTEM_PERMISSIONS } from "@authcore/contracts";

import type {
  AccessTokenPayload,
  CreateSessionResult,
  CreateSessionType,
  FindUserAllSessionType,
} from "./auth.types.js";

import { ERROR_CODES } from "../../errors/error-codes.js";
import { AppError } from "../../errors/app-error.js";

export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly memberRepository: MemberRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async getUserPermissions(
    organizationId: OrganizationId,
    userId: UserId,
  ): Promise<{ permissions: string[]; isOwner: boolean }> {
    const member = await this.memberRepository.find({
      by: "user",
      userId,
      organizationId,
    });

    if (!member || member.status !== "active") {
      return { permissions: [], isOwner: false };
    }

    if (member.isOwner) {
      return { permissions: Object.values(SYSTEM_PERMISSIONS), isOwner: true };
    }

    const role = await this.roleRepository.find({
      by: "id",
      roleId: member.roleId,
      organizationId,
    });

    return {
      permissions: role?.permissions ?? [],
      isOwner: false,
    };
  }

  async createSession(data: CreateSessionType): Promise<CreateSessionResult> {
    const { refreshToken, refreshTokenHash } = this.generateRefreshToken();

    const sessionExpiresAt = getExpiryTime(config.auth.sessionExpiry);

    const session = await this.sessionRepository.create({
      userId: data.userId,
      organizationId: data.organizationId,
      device: data.device,
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

    let permissions = data.permissions;
    let isOwner = data.isOwner;

    if (!permissions || isOwner === undefined) {
      const resolved = await this.getUserPermissions(data.organizationId, data.userId);
      permissions = permissions ?? resolved.permissions;
      isOwner = isOwner ?? resolved.isOwner;
    }

    const accessToken = this.generateAccessToken({
      sub: session.userId,
      sid: session.id,
      orgId: session.organizationId,
      jti: randomUUID(),
      type: "access",
      permissions,
      isOwner,
    });

    return {
      refreshToken,
      accessToken,
    };
  }

  async getSessionById(sessionId: SessionId): Promise<Session | null> {
    const session = await this.sessionRepository.find({
      by: "id",
      sessionId,
    });

    return this.assertSession(session);
  }

  async getPaginatedUserSessions(params: {
    userId: UserId;
    organizationId: OrganizationId;
    limit?: number;
    skip?: number;
  }): Promise<PaginatedResult<Session>> {
    return this.getUserSessions(
      {
        userId: params.userId,
        organizationId: params.organizationId,
        activeOnly: true,
      },
      params.limit ? { limit: params.limit } : undefined,
    );
  }

  async getUserSessions(
    data: FindUserAllSessionType,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Session>> {
    return this.sessionRepository.findMany(
      {
        userId: data.userId,
        organizationId: data.organizationId,
        activeOnly: data.activeOnly,
      },
      options,
    );
  }

  async updateSession(sessionId: SessionId, data: UpdateSessionData): Promise<Session> {
    const session = await this.sessionRepository.update(sessionId, data);

    return this.assertSession(session);
  }

  async revokeSession(sessionId: SessionId, actorId: ActorId): Promise<Session> {
    const session = await this.sessionRepository.revoke({
      sessionId,
      userId: actorId,
    });

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

    const currentRefreshToken = await this.refreshTokenRepository.find({
      by: "hash",
      tokenHash: refreshTokenHash,
    });

    if (!currentRefreshToken) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN);
    }

    const now = new Date();

    if (currentRefreshToken.revokedAt || currentRefreshToken.expiresAt <= now) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN);
    }

    const session = await this.sessionRepository.find({
      by: "id",
      sessionId: currentRefreshToken.sessionId,
    });

    if (!session) {
      throw new AppError(ERROR_CODES.AUTH_SESSION_NOT_FOUND);
    }

    if (session.revokedAt) {
      throw new AppError(ERROR_CODES.AUTH_SESSION_REVOKED);
    }

    if (session.expiresAt <= now) {
      throw new AppError(ERROR_CODES.AUTH_SESSION_EXPIRED);
    }

    const consumedToken = await this.refreshTokenRepository.consumeIfUnused(
      currentRefreshToken.id,
      now,
    );

    if (!consumedToken) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN);
    }

    const { refreshToken: newRefreshToken, refreshTokenHash: newRefreshTokenHash } =
      this.generateRefreshToken();

    const refreshTokenExpiresAt = new Date(
      Math.min(
        getExpiryTime(config.auth.refreshTokenExpiry).getTime(),
        session.expiresAt.getTime(),
      ),
    );

    const { permissions, isOwner } = await this.getUserPermissions(
      session.organizationId,
      session.userId,
    );

    await this.refreshTokenRepository.create({
      sessionId: session.id,
      parentTokenId: consumedToken.id,
      tokenFamilyId: consumedToken.tokenFamilyId,
      tokenHash: newRefreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
    });

    const accessToken = this.generateAccessToken({
      sub: session.userId,
      sid: session.id,
      orgId: session.organizationId,
      jti: randomUUID(),
      type: "access",
      permissions,
      isOwner,
    });

    return {
      refreshToken: newRefreshToken,
      accessToken,
    };
  }

  async validateSession(sessionId: SessionId): Promise<boolean> {
    const session = await this.sessionRepository.find({
      by: "id",
      sessionId,
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
        throw new AppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, {
          cause: error,
        });
      }

      throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN, {
        cause: error,
      });
    }
  }

  private assertSession(session: Session | null): Session {
    if (!session) {
      throw new AppError(ERROR_CODES.AUTH_SESSION_NOT_FOUND);
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
