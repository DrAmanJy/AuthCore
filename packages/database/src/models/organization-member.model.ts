import type { Types } from "mongoose";
import { model, Schema } from "mongoose";

export const ORGANIZATION_MEMBER_STATUSES = [
  "invited",
  "active",
  "suspended",
  "removed",
] as const;

export type OrganizationMemberStatus = (typeof ORGANIZATION_MEMBER_STATUSES)[number];

export interface IOrganizationMember {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  roleId: Types.ObjectId;
  status: OrganizationMemberStatus;
  createdBy: Types.ObjectId;
  joinedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
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
      enum: ORGANIZATION_MEMBER_STATUSES,
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

OrganizationMemberSchema.index(
  { organizationId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $exists: false },
    },
  },
);

OrganizationMemberSchema.index({
  organizationId: 1,
  status: 1,
});

OrganizationMemberSchema.index({
  createdBy: 1,
});

const OrganizationMemberModel = model<IOrganizationMember>(
  "OrganizationMember",
  OrganizationMemberSchema,
);

export default OrganizationMemberModel;
