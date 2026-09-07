import { model, Schema, type HydratedDocument } from "mongoose";
import { UserStatus } from "../repositories/user/user.types.js";

export const USER_STATUSES = [
  "pending",
  "active",
  "suspended",
  "inactive",
  "deactivated",
] as const;

interface IUser {
  email: string;
  passwordHash: string;
  displayName: string;
  emailVerified: boolean;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },

    status: {
      type: String,
      required: true,
      enum: USER_STATUSES,
      default: "pending",
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

UserSchema.index({ email: 1 }, { unique: true });

const UserModel = model<IUser>("User", UserSchema);

export default UserModel;
