import type { SessionId } from "../session/session.types.js";

export type RefreshToken = string & {
  readonly __brand: "RefreshToken";
};

export type RefreshTokenHash = string & {
  readonly __brand: "RefreshTokenHash";
};

export type RefreshTokenId = string & {
  readonly __brand: "RefreshTokenId";
};

export type TokenFamilyId = string & {
  readonly __brand: "TokenFamilyId";
};

export const asRefreshToken = (token: string): RefreshToken => token as RefreshToken;

export const asRefreshTokenHash = (hash: string): RefreshTokenHash =>
  hash as RefreshTokenHash;

export const asRefreshTokenId = (id: string): RefreshTokenId => id as RefreshTokenId;

export const asTokenFamilyId = (id: string): TokenFamilyId => id as TokenFamilyId;

export type RefreshTokenRecord = {
  id: RefreshTokenId;
  sessionId: SessionId;
  tokenHash: RefreshTokenHash;
  tokenFamilyId: TokenFamilyId;
  parentTokenId?: RefreshTokenId;
  expiresAt: Date;
  usedAt?: Date;
  revokedAt?: Date;
  reuseDetected: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateRefreshTokenData = {
  sessionId: SessionId;
  tokenHash: RefreshTokenHash;
  tokenFamilyId: TokenFamilyId;
  parentTokenId?: RefreshTokenId;
  expiresAt: Date;
};

export type UpdateRefreshTokenData = {
  usedAt?: Date;
  revokedAt?: Date;
  reuseDetected?: boolean;
};
