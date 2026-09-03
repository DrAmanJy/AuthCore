import { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import {
  findSessionById,
  findUserSessions,
  revokeAllSessions,
  revokeSession,
} from "./session.service.js";
import { Types } from "mongoose";
import { RegisterResponse } from "../auth/auth.controller.js";

export const getUserSessionById = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { sessionId } = req.params;

  if (typeof sessionId !== "string") {
    throw new AppError("Invalid session ID", 400);
  }

  if (!Types.ObjectId.isValid(sessionId)) {
    throw new AppError("Invalid session ID", 400);
  }

  const sessionObjectId = new Types.ObjectId(sessionId);

  const session = await findSessionById(sessionObjectId);

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  return res.status(200).json({
    status: "success",
    message: "Session successfully found",
    data: { session },
  });
};

export const getUserSessions = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { sub } = req.accessToken;
  if (typeof sub !== "string") {
    throw new AppError("Invalid user ID", 400);
  }
  if (!Types.ObjectId.isValid(sub)) {
    throw new AppError("Invalid user ID", 400);
  }
  const userId = new Types.ObjectId(sub);

  const sessions = await findUserSessions(userId);
  return res.status(200).json({
    status: "success",
    message: "Sessions successfully found",
    data: { sessions },
  });
};

export const deleteUserSessionById = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const sessionId = req.params.sessionId;

  if (typeof sessionId !== "string") {
    throw new AppError("Invalid session ID", 400);
  }
  if (!Types.ObjectId.isValid(sessionId)) {
    throw new AppError("Invalid session ID", 400);
  }

  const sessionObjectId = new Types.ObjectId(sessionId);
  const status = await revokeSession(sessionObjectId);

  if (!status) {
    throw new AppError("Session not found or already revoked", 404);
  }

  return res.status(200).json({
    status: "success",
    message: "Session successfully deleted",
  });
};

export const deleteUserSessions = async (
  req: Request,
  res: Response
): Promise<Response<RegisterResponse>> => {
  const { sub } = req.accessToken;

  if (typeof sub !== "string") {
    throw new AppError("Invalid user ID", 400);
  }

  if (!Types.ObjectId.isValid(sub)) {
    throw new AppError("Invalid user ID", 400);
  }

  const userId = new Types.ObjectId(sub);

  const status = await revokeAllSessions(userId);

  if (!status) {
    throw new AppError("Internal server error: Failed to revoke sessions", 500);
  }

  return res.status(200).json({
    status: "success",
    message: "All sessions successfully revoked",
  });
};
