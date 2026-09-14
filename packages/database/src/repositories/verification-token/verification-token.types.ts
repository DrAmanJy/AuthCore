import type { UserId } from "../user/user.types.js";

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

export type VerificationTokenId = string & { readonly __brand: "VerificationTokenId" };

export type VerificationTokenHash = string & {
  readonly __brand: "VerificationTokenHash";
};

export type VerificationTokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

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
      type: "id";
      value: VerificationTokenId;
    }
  | {
      type: "hash";
      value: VerificationTokenHash;
    }
  | {
      type: "user";
      userId: UserId;
      tokenType?: VerificationTokenType;
    };

export type DeleteVerificationTokenCriteria =
  | {
      type: "id";
      value: VerificationTokenId;
    }
  | {
      type: "hash";
      value: VerificationTokenHash;
    }
  | {
      type: "user";
      userId: UserId;
      tokenType?: VerificationTokenType;
    }
  | {
      type: "expired";
      before?: Date;
    };
