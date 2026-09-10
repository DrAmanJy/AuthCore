import type { Device, OrganizationId, SessionId, User, UserId } from "@authcore/database";

export type RegisterType = {
  displayName: string;
  email: string;
  password: string;
};

export type LoginType = {
  email: string;
  password: string;
  organizationId: OrganizationId;
  device: Device;
};

export type LoginResult = {
  user: User;
  accessToken: string;
  refreshToken: RefreshToken;
};

export type RefreshToken = string;

export type CreateSessionResult = {
  accessToken: string;
  refreshToken: RefreshToken;
};

export type CreateSessionType = {
  userId: UserId;
  organizationId: OrganizationId;
  device: Device;
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

export type LogoutType = {
  userId: UserId;
  organizationId: OrganizationId;
};
