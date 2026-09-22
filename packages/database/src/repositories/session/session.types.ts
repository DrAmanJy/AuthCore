import type { OrganizationId } from "../organization/organization.types.js";
import type { UserId } from "../user/user.types.js";

export type SessionId = string & {
  readonly __brand: "SessionId";
};

export const asSessionId = (id: string): SessionId => id as SessionId;

// export const asRefreshTokenHash = (hash: string): RefreshTokenHash =>
//   hash as RefreshTokenHash;

export type Device = {
  name: string;
  userAgent: string;
  ip: string;
};

export type Session = {
  id: SessionId;

  userId: UserId;
  organizationId: OrganizationId;

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

  device: Device;

  expiresAt: Date;
};

export type UpdateSessionData = {
  expiresAt?: Date;
  lastUsedAt?: Date;
};

export type FindSessionCriteria =
  | {
      type: "id";
      value: SessionId;
    }
  | {
      type: "user";
      userId: UserId;
      organizationId: OrganizationId;
      activeOnly?: boolean;
    };
