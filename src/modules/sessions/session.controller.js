import { AppError } from "../../utils/AppError.js";
import { findSessionById } from "./session.service.js";

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
