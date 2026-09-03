import { Types } from "mongoose";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { getClientInfo } from "../../utils/clientInfo.utils.js";
import * as authService from "./auth.service.js";
import { Request, Response } from "express";

export type RegisterResponse = {
  success: boolean;
  message: string;
  data?: unknown;
};

export const register = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const user = await authService.registerUser(req.body);

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user,
    },
  });
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { email, otp } = req.body;
  const { device, ipAddress, userAgent } = getClientInfo(req);
  const { serviceId } = req.service;

  const { user, accessToken, refreshToken } = await authService.verifyUser({
    email,
    submittedOtp: otp,
    serviceId,
    device,
    ipAddress,
    userAgent,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Email successfully verified",
    data: { accessToken, user },
  });
};

export const login = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { ipAddress, userAgent, device } = getClientInfo(req);
  const { name: serviceName } = req.service;

  const { user, accessToken, refreshToken } = await authService.loginUser({
    ...req.body,
    ipAddress,
    userAgent,
    device,
    serviceId: serviceName,
    serviceName,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      user,
      accessToken,
    },
  });
};

export const logout = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { sid: sessionId } = req.accessToken;

  await authService.logoutUser(sessionId);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

export const logoutAll = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { sub } = req.accessToken;
  const userId = new Types.ObjectId(sub);

  await authService.logoutAllUser(userId);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({
    success: true,
    message: "Successfully logged out of all devices",
  });
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { name: serviceName } = req.service;
  const plainToken = req.cookies.refreshToken;

  if (!plainToken) {
    throw new AppError("No refresh token found. Please log in again.", 401);
  }

  const { refreshToken, accessToken } = await authService.refreshAccessToken(
    plainToken,
    serviceName
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Access token successfully created",
    data: {
      accessToken,
    },
  });
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { oldPassword, newPassword } = req.body;
  const { sub } = req.accessToken;
  const { ipAddress, userAgent, device } = getClientInfo(req);
  const { serviceId } = req.service;
  const userId = new Types.ObjectId(sub);

  const { refreshToken, accessToken } = await authService.changeUserPassword({
    userId,
    serviceId,
    device,
    ipAddress,
    userAgent,
    oldPassword,
    newPassword,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    status: "success",
    message: "Password successfully changed",
    data: { accessToken },
  });
};

export const resendVerification = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { email } = req.body;

  await authService.resendVerificationEmail(email);

  return res.status(200).json({
    success: true,
    message: "A new verification code has been sent to your email.",
  });
};
