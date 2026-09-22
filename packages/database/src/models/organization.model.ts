import { model, Schema } from "mongoose";

export const ORGANIZATION_STATUSES = ["active", "suspended", "inactive"] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export interface IOrganization {
  name: string;
  slug: string;
  status: OrganizationStatus;
  deletedAt?: Date;
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

const OrganizationModel = model<IOrganization>("Organization", OrganizationSchema);
export default OrganizationModel;
