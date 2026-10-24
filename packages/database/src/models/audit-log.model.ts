import type { Types } from "mongoose";
import { model, Schema } from "mongoose";

export interface IAuditLog {
  organizationId?: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
      default: undefined,
    },

    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    targetType: {
      type: String,
      required: true,
      trim: true,
    },

    targetId: {
      type: String,
      trim: true,
      default: undefined,
    },

    details: {
      type: Schema.Types.Mixed,
      default: undefined,
    },

    ipAddress: {
      type: String,
      trim: true,
      default: undefined,
    },

    userAgent: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLogModel = model<IAuditLog>("AuditLog", AuditLogSchema);
