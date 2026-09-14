import { model, Schema, Types } from "mongoose";

export const VERIFICATION_TOKEN_TYPES = ["EMAIL_VERIFICATION", "PASSWORD_RESET"] as const;

export type VerificationTokenType = (typeof VERIFICATION_TOKEN_TYPES)[number];

export type VerificationTokenDocument = {
  userId: Types.ObjectId;
  type: VerificationTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const VerificationTokenSchema = new Schema<VerificationTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: VERIFICATION_TOKEN_TYPES,
      required: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

VerificationTokenSchema.index({
  userId: 1,
  type: 1,
});

export const VerificationTokenModel = model<VerificationTokenDocument>(
  "VerificationToken",
  VerificationTokenSchema,
);
