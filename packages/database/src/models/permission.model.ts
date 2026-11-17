import { model, Schema, Types } from "mongoose";

export const PERMISSION_SCOPE = ["system", "organization"] as const;
export type PermissionScope = (typeof PERMISSION_SCOPE)[number];
export interface IPermission {
  _id: Types.ObjectId;

  scope: PermissionScope;

  // Present only for organization permissions.
  organizationId?: Types.ObjectId;

  key: string;
  description: string;

  // Present only for organization permissions.
  createdBy?: Types.ObjectId;

  // Organization permissions can be soft-deleted.
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    scope: { type: String, enum: PERMISSION_SCOPE, default: "organization" },
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true },
    key: { type: String, required: true, trim: true, minlength: 4, maxlength: 32 },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
  },
  { versionKey: false, timestamps: true },
);

const PermissionModel = model<IPermission>("Permission", PermissionSchema);
export default PermissionModel;
