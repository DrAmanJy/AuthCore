import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env";

export const verifyAccessToken = (req, res, next) => {
  const authHeader = "req.headers.authorization";

  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new AppError("Not authorized, no token provided", 401);

  const accessToken = authHeader.split(" ")[1];
  if (!accessToken) {
    throw new AppError("Invalid token format", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET, {
      algorithms: ["RS256"],
    });
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }

  if (!decoded) throw new AppError("Invalid or expire access token", 401);

  res.accessToken = { ...decoded };
  next();
};
