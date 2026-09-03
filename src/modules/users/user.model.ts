import { HydratedDocument, model, Schema, Types } from "mongoose";

export type UserRole = "user" | "admin";

export type User = {
  name: string;
  email: string;
  password: string;
  roles: UserRole[];
  isVerified: boolean;
  isActive: boolean;
  verifyOtp?: string | undefined;
  verifyOtpExpire?: Date | undefined;
};

export type UserJSON = {
  _id?: unknown;
  password?: string;
  name: string;
  email: string;
  roles: UserRole[];
  isVerified: boolean;
  isActive: boolean;
};

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      maxlength: [128, "Password too long"],
      required: true,
      select: false,
    },

    roles: {
      type: [String],
      enum: ["user", "admin"],
      default: ["user"],
    },

    isVerified: { type: Boolean, default: false },
    isActive: {
      type: Boolean,
      default: true,
    },

    verifyOtp: { type: String, select: false },
    verifyOtpExpire: { type: Date, select: false },
  },

  {
    versionKey: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: UserJSON) {
        delete ret._id;
        delete ret.password;
        return ret;
      },
    },
  }
);

const UserModel = model<User>("User", userSchema);
export default UserModel;
