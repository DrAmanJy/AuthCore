import type { UserId } from "../user/user.types.js";

export type VerificationTokenId = string & {
  readonly __brand: "VerificationTokenId";
};

export type VerificationTokenHash = string & {
  readonly __brand: "VerificationTokenHash";
};

export const asVerificationTokenId = (id: string): VerificationTokenId =>
  id as VerificationTokenId;

export const asVerificationTokenHash = (hash: string): VerificationTokenHash =>
  hash as VerificationTokenHash;

export const VERIFICATION_TOKEN_TYPES = [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
] as const;

export type VerificationTokenType = (typeof VERIFICATION_TOKEN_TYPES)[number];

export const asVerificationTokenType = (
  type: VerificationTokenType,
): VerificationTokenType => type;

export type VerificationToken = {
  id: VerificationTokenId;
  userId: UserId;
  type: VerificationTokenType;
  tokenHash: VerificationTokenHash;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateVerificationTokenData = {
  userId: UserId;
  type: VerificationTokenType;
  tokenHash: VerificationTokenHash;
  expiresAt: Date;
};

export type UpdateVerificationTokenData = {
  expiresAt?: Date;
  usedAt?: Date;
};

export type FindVerificationTokenCriteria =
  | {
      by: "id";
      tokenId: VerificationTokenId;
    }
  | {
      by: "hash";
      tokenHash: VerificationTokenHash;
    };

export interface FindManyVerificationTokensCriteria {
  userId: UserId;
  tokenType?: VerificationTokenType;
  unusedOnly?: boolean;
}

export type DeleteVerificationTokenCriteria =
  | {
      by: "id";
      tokenId: VerificationTokenId;
    }
  | {
      by: "hash";
      tokenHash: VerificationTokenHash;
    }
  | {
      by: "user";
      userId: UserId;
      tokenType?: VerificationTokenType;
    };
