import type { Types } from "mongoose";
import { model, Schema } from "mongoose";

export const _MEMBER_STATUSES = ["invited", "active", "suspended", "removed"] as const;

export type MemberStatus = (typeof _MEMBER_STATUSES)[number];

export interface IMember {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  roleId: Types.ObjectId;
  status: MemberStatus;
  createdBy: Types.ObjectId;
  joinedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    status: {
      type: String,
      enum: _MEMBER_STATUSES,
      required: true,
      default: "invited",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    joinedAt: {
      type: Date,
      default: undefined,
    },

    deletedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

MemberSchema.index(
  { organizationId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $exists: false },
    },
  },
);

MemberSchema.index({
  organizationId: 1,
  status: 1,
});

MemberSchema.index({
  createdBy: 1,
});

const MemberModel = model<IMember>("Member", MemberSchema);

export default MemberModel;
