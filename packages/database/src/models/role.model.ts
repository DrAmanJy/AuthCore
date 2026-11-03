import type { Types } from "mongoose";
import { model, Schema } from "mongoose";

export interface IRole {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  createdBy: Types.ObjectId;

  isSystemRole: boolean;
  permissionIds: Types.ObjectId[];
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

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    isSystemRole: {
      type: Boolean,
      required: true,
      default: false,
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

export const RoleModel = model<IRole>("Role", RoleSchema);
