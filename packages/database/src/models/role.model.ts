import type { Types } from "mongoose";
import { model, Schema } from "mongoose";

export interface IRole {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  permissionIds: Types.ObjectId[];
  createdBy: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 32,
    },

    permissionIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Permission",
        },
      ],
      default: [],
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
  {
    timestamps: true,
    versionKey: false,
  },
);

RoleSchema.index(
  { organizationId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $exists: false },
    },
  },
);

RoleSchema.index({ organizationId: 1, deletedAt: 1, _id: 1 });
RoleSchema.index({ organizationId: 1, isSystemRole: 1, deletedAt: 1 });

export const RoleModel = model<IRole>("Role", RoleSchema);
