import type { Types } from "mongoose";
import { model, Schema } from "mongoose";

export const API_CLIENT_STATUSES = ["active", "revoked"] as const;

export type ApiClientStatus = (typeof API_CLIENT_STATUSES)[number];

export type IApiKey = {
  organizationId: Types.ObjectId;
  name: string;
  keyHash: string;
  status: ApiClientStatus;
  createdBy: Types.ObjectId;
  lastUsedAt?: Date;
  revokedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const ApiKeySchema = new Schema<IApiKey>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    keyHash: {
      type: String,
      required: true,
      select: false,
    },

    status: {
      type: String,
      enum: API_CLIENT_STATUSES,
      default: "active",
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
    lastUsedAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ApiKeyModel = model<IApiKey>("ApiKey", ApiKeySchema);
