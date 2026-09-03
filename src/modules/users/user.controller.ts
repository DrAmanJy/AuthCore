import * as userService from "./user.service.js";
import { RegisterResponse } from "../auth/auth.controller.js";
import { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { Types } from "mongoose";

export const getMe = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { sub } = req.accessToken;

  if (typeof sub !== "string") {
    throw new AppError("Invalid user ID or Token", 400);
  }
  if (!Types.ObjectId.isValid(sub)) {
    throw new AppError("Invalid user ID or Token", 400);
  }
  const userId = new Types.ObjectId(sub);

  const user = await userService.getUserProfile(userId);

  return res.status(200).json({
    success: true,
    data: { user },
  });
};

export const updateMe = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { sub } = req.accessToken;

  if (typeof sub !== "string") {
    throw new AppError("Invalid user ID or Token", 400);
  }
  if (!Types.ObjectId.isValid(sub)) {
    throw new AppError("Invalid user ID or Token", 400);
  }
  const userId = new Types.ObjectId(sub);

  const updatedUser = await userService.updateUserProfile(userId, req.body);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user: updatedUser },
  });
};

export const deactivateMe = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { sub } = req.accessToken;

  if (typeof sub !== "string") {
    throw new AppError("Invalid user ID or Token", 400);
  }
  if (!Types.ObjectId.isValid(sub)) {
    throw new AppError("Invalid user ID or Token", 400);
  }
  const userId = new Types.ObjectId(sub);

  await userService.deactivateUserProfile(userId);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({
    success: true,
    message: "Your account has been successfully deactivated.",
  });
};
