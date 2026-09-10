import { SessionId } from "../session/session.types.js";
import type {
  CreateRefreshTokenData,
  RefreshTokenHash,
  RefreshTokenId,
  RefreshTokenRecord,
  TokenFamilyId,
} from "./refresh-token.types.js";

export interface RefreshTokenRepository {
  findById(refreshTokenId: RefreshTokenId): Promise<RefreshTokenRecord | null>;

  findByHash(tokenHash: RefreshTokenHash): Promise<RefreshTokenRecord | null>;

  findFamily(tokenFamilyId: TokenFamilyId): Promise<RefreshTokenRecord[]>;

  create(data: CreateRefreshTokenData): Promise<RefreshTokenRecord>;

  markAsUsed(
    refreshTokenId: RefreshTokenId,
    usedAt?: Date,
  ): Promise<RefreshTokenRecord | null>;

  revoke(
    refreshTokenId: RefreshTokenId,
    revokedAt?: Date,
  ): Promise<RefreshTokenRecord | null>;

  markReuseDetected(refreshTokenId: RefreshTokenId): Promise<RefreshTokenRecord | null>;

  revokeFamily(tokenFamilyId: TokenFamilyId, revokedAt?: Date): Promise<number>;

  revokeAllBySessionId(sessionId: SessionId, revokedAt?: Date): Promise<number>;

  deleteExpired(before?: Date): Promise<number>;
}
