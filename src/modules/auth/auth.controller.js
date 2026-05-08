import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { getClientInfo } from "../../utils/clientInfo.utils.js";
import * as authService from "./auth.service.js";

export const register = async (req, res) => {
  const user = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user,
    },
  });
};

export const login = async (req, res) => {
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

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      user,
      accessToken,
    },
  });
};

export const logout = async (req, res) => {
  const { sid: sessionId } = req.accessToken;

  await authService.logoutUser(sessionId);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

export const logoutAll = async (req, res) => {
  const { sub: userId } = req.accessToken;

  await authService.logoutAllUser(userId);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Successfully logged out of all devices",
  });
};

export const refreshToken = async (req, res) => {
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

  res.status(200).json({
    success: true,
    message: "Access token successfully created",
    data: {
      accessToken,
    },
  });
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { sub: userId } = req.accessToken;
  const { ipAddress, userAgent, device } = getClientInfo(req);
  const { name: serviceName } = req.service;

  const { refreshToken, accessToken } = await authService.changeUserPassword(
    userId,
    serviceName,
    device,
    ipAddress,
    userAgent,
    oldPassword,
    newPassword
  );

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
