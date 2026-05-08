import bcrypt from "bcrypt";

import Users from "../users/user.model.js";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import {
  createSession,
  revokeAllSessions,
  revokeSession,
  rotateSession,
} from "../sessions/session.service.js";
import { createAccessToken } from "../../utils/token.js";

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await Users.exists({ email });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const user = await Users.create({
    name,
    email,
    password: hashedPassword,
  });

  //todo send email with otp to verify account

  return user;
};

export const loginUser = async ({
  email,
  password,
  device,
  ipAddress,
  userAgent,
  serviceId,
  serviceName,
}) => {
  const user = await Users.findOne({ email });

  if (!user) throw new AppError("Invalid email or password", 400);
  if (!user.isVerified) throw new AppError("Verify your account before login", 401);
  if (!user.isActive) throw new AppError("Inactive account", 400);

  const isValidPass = await bcrypt.compare(password, user.password);
  if (!isValidPass) throw new AppError("Invalid email or password", 400);

  const { plainToken: refreshToken, sessionId } = await createSession(
    user._id,
    serviceId,
    device,
    ipAddress,
    userAgent
  );

  const accessToken = createAccessToken(user._id, sessionId, serviceName);

  return { user, refreshToken, accessToken };
};

export const logoutUser = async sessionId => {
  const status = await revokeSession(sessionId);

  if (!status) {
    throw new AppError("Session invalid or already logged out", 400);
  }

  return true;
};

export const logoutAllUser = async userId => {
  const status = await revokeAllSessions(userId);

  if (!status) {
    throw new AppError("Internal server error: Failed to revoke sessions", 400);
  }

  return true;
};

export const refreshAccessToken = async (plainToken, serviceName) => {
  const {
    newPlainToken: refreshToken,
    sessionId,
    userId,
  } = await rotateSession(plainToken);

  const accessToken = createAccessToken(userId, sessionId, serviceName);

  return { refreshToken, accessToken };
};

export const changeUserPassword = async (
  userId,
  serviceName,
  device,
  ipAddress,
  userAgent,
  oldPassword,
  newPassword
) => {
  const user = await Users.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isValidPass = await bcrypt.compare(oldPassword, user.password);
  if (!isValidPass) {
    throw new AppError("Invalid current password", 401);
  }

  const saltRounds = Number(env.BCRYPT_SALT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  user.password = hashedPassword;
  await user.save();

  const success = await revokeAllSessions(user._id);
  if (!success) {
    throw new AppError(
      "Password changed, but failed to securely log out other devices",
      500
    );
  }

  const { plainToken: refreshToken, sessionId } = await createSession(
    user._id,
    serviceName,
    device,
    ipAddress,
    userAgent
  );

  const accessToken = createAccessToken(user._id, sessionId, serviceName);

  return { user, refreshToken, accessToken };
};
