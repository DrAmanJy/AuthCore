import { model, Schema, Types } from "mongoose";
import { env } from "../../config/env.js";

const sessionSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    serviceId: {
      // type: Types.ObjectId,
      // ref: "Service",
      type: String,
      required: true,
      index: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    device: {
      deviceName: {
        type: String,
        trim: true,
      },

      browser: {
        type: String,
        trim: true,
      },

      os: {
        type: String,
        trim: true,
      },
    },

    ipAddress: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () =>
        new Date(Date.now() + Number(env.SESSION_EXPIRY_DAYS) * 24 * 60 * 60 * 1000),
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({
  userId: 1,
  serviceId: 1,
});

const Sessions = model("Session", sessionSchema);

export default Sessions;
