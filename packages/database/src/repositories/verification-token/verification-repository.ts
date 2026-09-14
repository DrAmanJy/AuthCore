import type {
  CreateVerificationTokenData,
  DeleteVerificationTokenCriteria,
  FindVerificationTokenCriteria,
  UpdateVerificationTokenData,
  VerificationToken,
  VerificationTokenId,
} from "./verification-token.types.js";

export interface VerificationTokenRepository {
  find(
    criteria: Extract<FindVerificationTokenCriteria, { type: "id" | "hash" }>,
  ): Promise<VerificationToken | null>;

  find(
    criteria: Extract<FindVerificationTokenCriteria, { type: "user" }>,
  ): Promise<VerificationToken[]>;

  create(data: CreateVerificationTokenData): Promise<VerificationToken>;

  markAsUsed(
    tokenId: VerificationTokenId,
    usedAt?: Date,
  ): Promise<VerificationToken | null>;

  delete(criteria: DeleteVerificationTokenCriteria): Promise<number>;
}
