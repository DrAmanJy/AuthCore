import { AppError } from "../../utils/AppError.js";
import Users from "./user.model.js";
import { revokeAllSessions } from "../sessions/session.service.js";

export const getUserProfile = async userId => {
  const user = await Users.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const updateUserProfile = async (userId, updateData) => {
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

export const deactivateUserProfile = async userId => {
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
