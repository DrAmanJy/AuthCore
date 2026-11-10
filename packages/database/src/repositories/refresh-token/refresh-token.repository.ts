import type {
  CreateRepository,
  ReadRepository,
} from "../repository.contracts.js";
import type {
  CreateRefreshTokenData,
  FindManyRefreshTokensCriteria,
  FindRefreshTokenCriteria,
  RefreshTokenId,
  RefreshTokenRecord,
  TokenFamilyId,
} from "./refresh-token.types.js";
import type { SessionId } from "../session/session.types.js";

export interface RefreshTokenRepository
  extends ReadRepository<
      RefreshTokenRecord,
      FindRefreshTokenCriteria,
      FindManyRefreshTokensCriteria
    >,
    CreateRepository<RefreshTokenRecord, CreateRefreshTokenData> {
  consumeIfUnused(
    refreshTokenId: RefreshTokenId,
    consumedAt?: Date,
  ): Promise<RefreshTokenRecord | null>;

  markAsUsed(
    refreshTokenId: RefreshTokenId,
    usedAt?: Date,
  ): Promise<RefreshTokenRecord | null>;

  markReuseDetected(
    refreshTokenId: RefreshTokenId,
  ): Promise<RefreshTokenRecord | null>;

  revoke(
    refreshTokenId: RefreshTokenId,
    revokedAt?: Date,
  ): Promise<RefreshTokenRecord | null>;

  revokeFamily(tokenFamilyId: TokenFamilyId, revokedAt?: Date): Promise<number>;

  revokeAllBySessionId(sessionId: SessionId, revokedAt?: Date): Promise<number>;

  deleteExpired(before?: Date): Promise<number>;
}
