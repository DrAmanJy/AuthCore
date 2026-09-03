import bcrypt from "bcrypt";
import { Types } from "mongoose";

import UserModel, { UserDocument } from "../users/user.model.js";
import { Device } from "../sessions/session.model.js";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import {
  createSession,
  revokeAllSessions,
  revokeSession,
  rotateSession,
} from "../sessions/session.service.js";
import { createAccessToken } from "../../utils/token.js";
import { generateOTP, hashOTP, verifyOTP } from "../../utils/otp.util.js";
import { sendVerificationEmail } from "../../services/mail/email.service.js";

type RegisterUserTypes = { name: string; email: string; password: string };
type VerifyUserTypes = {
  email: string;
  submittedOtp: string;
  serviceId: string;
  device: Device;
  ipAddress: string;
  userAgent: string;
};
type LoginUserTypes = {
  email: string;
  password: string;
  serviceId: string;
  device: Device;
  ipAddress: string;
  userAgent: string;
};
type ChangeUserPasswordTypes = {
  userId: Types.ObjectId;
  serviceId: string;
  device: Device;
  ipAddress: string;
  userAgent: string;
  oldPassword: string;
  newPassword: string;
};

export const registerUser = async ({
  name,
  email,
  password,
}: RegisterUserTypes): Promise<UserDocument> => {
  const existingUser = await UserModel.exists({ email });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const plainOTP = generateOTP(6);
  const hashedOTP = await hashOTP(plainOTP);

  const expiresInMs = parseInt(env.EMAIL_VERIFICATION_EXPIRES_IN) * 60 * 1000;
  const expireDate = new Date(Date.now() + expiresInMs);

  const user = await UserModel.create({
    name,
    email,
    password: hashedPassword,
    verifyOtp: hashedOTP,
    verifyOtpExpire: expireDate,
  });

  try {
    await sendVerificationEmail(user.email, user.name, plainOTP);
  } catch (error) {
    console.error("Email failed to send during registration:", error);

    throw new AppError(
      "Account created, but verification email failed to send. Please try logging in to resend.",
      500
    );
  }

  return user;
};

export const verifyUser = async ({
  email,
  submittedOtp,
  serviceId,
  device,
  ipAddress,
  userAgent,
}: VerifyUserTypes) => {
  const user = await UserModel.findOne({ email }).select("+verifyOtp +verifyOtpExpire");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Account is already verified. Please log in.", 400);
  }

  if (!user.verifyOtp || !user.verifyOtpExpire) {
    throw new AppError("No verification code found. Please request a new one.", 400);
  }

  if (user.verifyOtpExpire.getTime() < Date.now()) {
    user.verifyOtp = undefined;
    user.verifyOtpExpire = undefined;
    await user.save();

    throw new AppError("Verification code has expired. Please request a new one.", 400);
  }

  const isValid = await verifyOTP(submittedOtp, user.verifyOtp);

  if (!isValid) {
    throw new AppError("Invalid verification code", 401);
  }

  user.isVerified = true;
  delete user.verifyOtp;
  delete user.verifyOtpExpire;

  await user.save();

  const { plainToken: refreshToken, sessionId } = await createSession({
    userId: user._id,
    serviceId,
    device,
    ipAddress,
    userAgent,
  });

  const accessToken = createAccessToken(
    user._id.toString(),
    sessionId.toString(),
    serviceId
  );

  return { user, refreshToken, accessToken };
};

export const loginUser = async ({
  email,
  password,
  serviceId,
  device,
  ipAddress,
  userAgent,
}: LoginUserTypes) => {
  const user = await UserModel.findOne({ email }).select("+password");

  if (!user) throw new AppError("Invalid email or password", 400);
  if (!user.isVerified) throw new AppError("Verify your account before login", 401);
  if (!user.isActive) throw new AppError("Inactive account", 400);

  const isValidPass = await bcrypt.compare(password, user.password);
  if (!isValidPass) throw new AppError("Invalid email or password", 400);

  const { plainToken: refreshToken, sessionId } = await createSession({
    userId: user._id,
    serviceId,
    device,
    ipAddress,
    userAgent,
  });

  const accessToken = createAccessToken(
    user._id.toString(),
    sessionId.toString(),
    serviceId
  );

  return { user, refreshToken, accessToken };
};

export const logoutUser = async (sessionId: Types.ObjectId) => {
  const status = await revokeSession(sessionId);

  if (!status) {
    throw new AppError("Session invalid or already logged out", 400);
  }

  return true;
};

export const logoutAllUser = async (userId: Types.ObjectId) => {
  const status = await revokeAllSessions(userId);

  if (!status) {
    throw new AppError("Internal server error: Failed to revoke sessions", 400);
  }

  return true;
};

export const refreshAccessToken = async (plainToken: string, serviceName: string) => {
  const { plainToken: refreshToken, sessionId, userId } = await rotateSession(plainToken);

  const accessToken = createAccessToken(
    userId.toString(),
    sessionId.toString(),
    serviceName
  );

  return { refreshToken, accessToken };
};

export const changeUserPassword = async ({
  userId,
  serviceId,
  device,
  ipAddress,
  userAgent,
  oldPassword,
  newPassword,
}: ChangeUserPasswordTypes) => {
  const user = await UserModel.findById(userId).select("+password");
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

  const { plainToken: refreshToken, sessionId } = await createSession({
    userId: user._id,
    serviceId,
    device,
    ipAddress,
    userAgent,
  });

  const accessToken = createAccessToken(
    user._id.toString(),
    sessionId.toString(),
    serviceId
  );

  return { user, refreshToken, accessToken };
};

export const resendVerificationEmail = async (email: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Account is already verified. Please log in.", 400);
  }

  const plainOTP = generateOTP(6);
  const hashedOTP = await hashOTP(plainOTP);

  const expiresInMs = parseInt(env.EMAIL_VERIFICATION_EXPIRES_IN) * 60 * 1000;
  const expireDate = new Date(Date.now() + expiresInMs);

  user.verifyOtp = hashedOTP;
  user.verifyOtpExpire = expireDate;

  await user.save();

  try {
    await sendVerificationEmail(user.email, user.name, plainOTP);
  } catch (error) {
    console.error("Email failed to send during OTP resend:", error);
    throw new AppError("Failed to send verification email. Please try again later.", 500);
  }

  return true;
};
