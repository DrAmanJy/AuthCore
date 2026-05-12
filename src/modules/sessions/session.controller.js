import { AppError } from "../../utils/AppError.js";
import {
  findSessionById,
  findUserSessions,
  revokeAllSessions,
  revokeSession,
} from "./session.service.js";

export const getUserSessionById = async (req, res) => {

  const sessionId = req.params.sessionId;

  const session = await findSessionById(sessionId);
  if (!session) throw new AppError("Session not found", 404);

  return res.status(200).json({
    status: "success",
    message: "Session successfully found",
    data: { session },
  });
};

export const getUserSessions = async (req, res) => {

  const { sub: userId } = req.accessToken;

  const sessions = await findUserSessions(userId);
  return res.status(200).json({
    status: "success",
    message: "Sessions successfully found",
    data: { sessions },
  });
};

export const deleteUserSessionById = async (req, res) => {

  const sessionId = req.params.sessionId;

  const status = await revokeSession(sessionId);

  if (!status) {
    throw new AppError("Session not found or already revoked", 404);
  }

  return res.status(200).json({
    status: "success",
    message: "Session successfully deleted",
  });
};

export const deleteUserSessions = async (req, res) => {

  const { sub: userId } = req.accessToken;

  const status = await revokeAllSessions(userId);

  if (!status) {
    throw new AppError("Internal server error: Failed to revoke sessions", 500);
  }

  return res.status(200).json({
    status: "success",
    message: "All sessions successfully revoked",
  });
};
