import { Device, OrganizationId, SessionId, UserId } from "@authcore/database";

export type RegisterType = { displayName: string; email: string; password: string };

export type RefreshToken = String;

export type CreateSessionResult = {
  accessToken: string;
  refreshToken: RefreshToken;
};

export type CreateSessionType = {
  userId: UserId;
  organizationId: OrganizationId;
  device: Device;
  expiresAt: Date;
};

export type RevokeSessionType = {
  userId: UserId;
  organizationId: OrganizationId;
  reason?: string;
};

export type FindUserAllSessionType = {
  userId: UserId;
  organizationId: OrganizationId;
  activeOnly?: boolean;
};

export type AccessTokenPayload = {
  sub: UserId;
  sid: SessionId;
  orgId: OrganizationId;
  jti: string;
  type: "access";
};
