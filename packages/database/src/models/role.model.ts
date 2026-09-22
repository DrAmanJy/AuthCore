import type { Types } from "mongoose";
import { model, Schema } from "mongoose";

export interface IRole {
  organizationId: Types.ObjectId;
  name: string;
  isSystemRole: boolean;
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
      maxlength: 64,
    },

    isSystemRole: {
      type: Boolean,
      required: true,
      default: false,
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
