import { model, Schema } from "mongoose";
import type { Types } from "mongoose";

export const ORGANIZATION_STATUSES = ["active", "suspended", "inactive"] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export interface IOrganization {
  name: string;
  slug: string;
  status: OrganizationStatus;
  deletedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 64,
    },

    status: {
      type: String,
      enum: ORGANIZATION_STATUSES,
      required: true,
      default: "active",
    },

    deletedAt: {
      type: Date,
      default: undefined,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

OrganizationSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $exists: false },
    },
  },
);

OrganizationSchema.index({ createdBy: 1 });

const OrganizationModel = model<IOrganization>("Organization", OrganizationSchema);
export default OrganizationModel;
