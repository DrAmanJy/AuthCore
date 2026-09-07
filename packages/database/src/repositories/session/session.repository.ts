import {
  CreateSessionData,
  OrganizationId,
  Session,
  SessionId,
  UpdateSessionData,
  UserId,
} from "./session.types.js";

export interface SessionRepository {
  create(data: CreateSessionData): Promise<Session>;

  findById(sessionId: SessionId): Promise<Session | null>;

  findByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null>;

  findByUserId(userId: UserId, organizationId: OrganizationId): Promise<Session[]>;

  findActiveByUserId(userId: UserId, organizationId: OrganizationId): Promise<Session[]>;

  updateLastUsedAt(sessionId: SessionId, lastUsedAt: Date): Promise<Session | null>;

  updateRefreshToken(
    sessionId: SessionId,
    data: UpdateSessionData,
  ): Promise<Session | null>;

  revoke(sessionId: SessionId, reason?: string): Promise<Session | null>;

  revokeAllByUserId(
    userId: UserId,
    organizationId: OrganizationId,
    reason?: string,
  ): Promise<number>;

  revokeAllExcept(
    userId: UserId,
    organizationId: OrganizationId,
    sessionId: SessionId,
    reason?: string,
  ): Promise<number>;

  deleteById(sessionId: SessionId): Promise<boolean>;
}
