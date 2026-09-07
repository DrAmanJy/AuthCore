export type SessionId = string;
export type UserId = string;
export type OrganizationId = string;

export type Device = {
  name: string;
  userAgent: string;
  ip: string;
};

export type Session = {
  id: SessionId;

  userId: UserId;
  organizationId: OrganizationId;

  refreshTokenHash: string;

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

  refreshTokenHash: string;

  device: Device;

  expiresAt: Date;
};

export type UpdateSessionData = {
  refreshTokenHash?: string;
  expiresAt?: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  revokedReason?: string;
};
