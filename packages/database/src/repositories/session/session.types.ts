import type { UserId } from "../user/user.types.js";

export type SessionId = string & {
  readonly __brand: "SessionId";
};

export type OrganizationId = string & {
  readonly __brand: "OrganizationId";
};

export type RefreshTokenHash = string & {
  readonly __brand: "RefreshTokenHash";
};

export const asSessionId = (id: string): SessionId => id as SessionId;

export const asOrganizationId = (id: string): OrganizationId => id as OrganizationId;

export const asRefreshTokenHash = (hash: string): RefreshTokenHash =>
  hash as RefreshTokenHash;

export type Device = {
  name: string;
  userAgent: string;
  ip: string;
};

export type Session = {
  id: SessionId;

  userId: UserId;
  organizationId: OrganizationId;

  refreshTokenHash: RefreshTokenHash;

  device: Device;

  lastUsedAt: Date;
  expiresAt: Date;

  revokedAt?: Date;
  revokedReason?: string;

  createdAt: Date;
  updatedAt: Date;
};

export type CreateSessionData = {
  userId: UserId;
  organizationId: OrganizationId;

  refreshTokenHash: RefreshTokenHash;

  device: Device;

  expiresAt: Date;
};

export type UpdateSessionData = {
  refreshTokenHash?: RefreshTokenHash;
  expiresAt?: Date;
  lastUsedAt?: Date;
};

export type FindSessionCriteria =
  | {
      type: "id";
      value: SessionId;
    }
  | {
      type: "refreshTokenHash";
      value: RefreshTokenHash;
    }
  | {
      type: "user";
      userId: UserId;
      organizationId: OrganizationId;
      activeOnly?: boolean;
    };
