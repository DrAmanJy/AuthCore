import { model, Schema, Types } from "mongoose";

export type RefreshTokenDocument = {
  sessionId: Types.ObjectId;
  tokenHash: string;
  tokenFamilyId: string;
  parentTokenId?: Types.ObjectId;
  expiresAt: Date;
  usedAt?: Date;
  revokedAt?: Date;
  reuseDetected: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    tokenFamilyId: {
      type: String,
      required: true,
      index: true,
    },

    parentTokenId: {
      type: Schema.Types.ObjectId,
      ref: "RefreshToken",
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    usedAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    reuseDetected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const RefreshTokenModel = model<RefreshTokenDocument>(
  "RefreshToken",
  RefreshTokenSchema,
);
