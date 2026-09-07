import { model, Schema } from "mongoose";
export const USER_STATUSES = [
    "pending",
    "active",
    "suspended",
    "inactive",
    "deactivated",
];
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
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
}, {
    timestamps: true,
    versionKey: false,
});
UserSchema.index({ email: 1 }, { unique: true });
const UserModel = model("User", UserSchema);
export default UserModel;
