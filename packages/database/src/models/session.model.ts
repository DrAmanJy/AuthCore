import { model, Schema, Types } from "mongoose";

interface IDevice {
  name: string;
  userAgent: string;
  ip: string;
}

export interface ISession {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;

  refreshTokenHash: string;

  device: IDevice;

  lastUsedAt: Date;
  expiresAt: Date;

  revokedAt?: Date;
  revokedReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    userAgent: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },

    ip: {
      type: String,
      required: true,
      trim: true,
      maxlength: 45,
    },
  },
  {
    _id: false,
    versionKey: false,
  },
);

export const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
      trim: true,
      minlength: 1,
      maxlength: 255,
    },

    device: {
      type: DeviceSchema,
      required: true,
    },

    lastUsedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: undefined,
    },

    revokedReason: {
      type: String,
      trim: true,
      minlength: 10,
      maxlength: 100,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

SessionSchema.index({ refreshTokenHash: 1 }, { unique: true });

SessionSchema.index({
  userId: 1,
  organizationId: 1,
  revokedAt: 1,
});

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SessionModel = model<ISession>("Session", SessionSchema);

export default SessionModel;
