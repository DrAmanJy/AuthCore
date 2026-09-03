import { AppError } from "../../utils/AppError.js";
import Users, { User, UserDocument } from "./user.model.js";
import { revokeAllSessions } from "../sessions/session.service.js";
import { Types } from "mongoose";

type UserId = Types.ObjectId;
type UpdateUserProfileInput = Partial<Pick<User, "name" | "email">>;

export const getUserProfile = async (userId: UserId): Promise<UserDocument> => {
  const user = await Users.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const updateUserProfile = async (
  userId: UserId,
  updateData: UpdateUserProfileInput
): Promise<UserDocument> => {
  const user = await Users.findByIdAndUpdate(
    userId,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const deactivateUserProfile = async (userId: UserId): Promise<boolean> => {
  const user = await Users.findByIdAndUpdate(
    userId,
    { $set: { isActive: false } },
    { new: true }
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const sessionsRevoked = await revokeAllSessions(userId);

  if (!sessionsRevoked) {
    console.error(`Failed to revoke sessions for deactivated user: ${userId}`);
  }

  return true;
};
