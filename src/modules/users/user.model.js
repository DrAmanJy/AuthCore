import { model, Schema } from "mongoose";

const userSchema = new Schema(
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
    isVerified: { type: Boolean, default: false },
    roles: {
      type: [String],
      enum: ["user", "admin"],
      default: ["user"],
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },

  {
    versionKey: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.password;
        return ret;
      },
    },
  }
);

const Users = model("User", userSchema);
export default Users;
