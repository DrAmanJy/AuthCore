import { model, Schema, Types } from "mongoose";

export type IPermissions = {
  _id: Types.ObjectId;
  key: string;
  organizationId: Types.ObjectId;
  description: string;
  roleId: Types.ObjectId;
  deletedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const PermissionSchema = new Schema<IPermissions>(
  {
    key: { type: String, required: true, trim: true, minlength: 4, maxlength: 32 },
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    roleId: { type: Types.ObjectId, ref: "Role", required: true },
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
  { versionKey: false, timestamps: true },
);

const PermissionModel = model("Permission", PermissionSchema);
export default PermissionModel;
