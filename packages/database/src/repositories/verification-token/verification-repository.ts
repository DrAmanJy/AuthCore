import type {
  CreateRepository,
  HardDeleteRepository,
  ReadRepository,
} from "../repository.contracts.js";
import type {
  CreateVerificationTokenData,
  DeleteVerificationTokenCriteria,
  FindManyVerificationTokensCriteria,
  FindVerificationTokenCriteria,
  VerificationToken,
  VerificationTokenId,
} from "./verification-token.types.js";

export interface VerificationTokenRepository
  extends ReadRepository<
      VerificationToken,
      FindVerificationTokenCriteria,
      FindManyVerificationTokensCriteria
    >,
    CreateRepository<VerificationToken, CreateVerificationTokenData>,
    HardDeleteRepository<DeleteVerificationTokenCriteria> {
  markAsUsed(
    tokenId: VerificationTokenId,
    usedAt?: Date,
  ): Promise<VerificationToken | null>;

  deleteExpired(before?: Date): Promise<number>;
}
