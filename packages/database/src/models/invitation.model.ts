import type { Types } from "mongoose";
import { model, Schema } from "mongoose";

export const TARGET_TYPES = ["user", "email"] as const;

export const INVITATION_STATUS = [
  "pending",
  "accepted",
  "rejected",
  "revoked",
  "expired",
] as const;

export type TargetType = (typeof TARGET_TYPES)[number];
export type InvitationStatus = (typeof INVITATION_STATUS)[number];

export interface IInvitation {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  roleId: Types.ObjectId;
  targetType: TargetType;
  targetUserId?: Types.ObjectId;
  targetEmail?: string;
  invitedBy: Types.ObjectId;
  tokenHash: string;
  status: InvitationStatus;
  actionAt?: Date;
  actionBy?: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    targetType: {
      type: String,
      enum: TARGET_TYPES,
      required: true,
    },

    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function (this: IInvitation) {
        return this.targetType === "user";
      },
    },

    targetEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: function (this: IInvitation) {
        return this.targetType === "email";
      },
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tokenHash: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },

    status: {
      type: String,
      enum: INVITATION_STATUS,
      required: true,
      default: "pending",
    },

    actionAt: Date,

    actionBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

InvitationSchema.index({ tokenHash: 1 }, { unique: true });

InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

InvitationSchema.index({
  organizationId: 1,
  status: 1,
  createdAt: -1,
});

InvitationSchema.index({
  organizationId: 1,
  targetUserId: 1,
  status: 1,
});

InvitationSchema.index({
  organizationId: 1,
  targetEmail: 1,
  status: 1,
});

const InvitationModel = model<IInvitation>("Invitation", InvitationSchema);

export default InvitationModel;
